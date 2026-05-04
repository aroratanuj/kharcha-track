import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { Skeleton, SkeletonCard, SkeletonHero, SkeletonCategoryBar } from '../components/SkeletonLoader';
import { useApi } from '../hooks/useApi';
import api from '../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  merchantName: string;
  category: { id: string; name: string; color: string; icon: string } | null;
  accountSource: string;
  status: string;
  userId?: string;
  user?: { id: string; name: string; email: string } | null;
  metadata?: {
    source?: string;
    confidence?: string;
  };
}

interface Summary {
  totalSpent: number;
  expenseCount: number;
  draftCount: number;
  draftTotal: number;
  topCategories: { name: string; icon: string; color: string; amount: number; count: number; percentage: number }[];
  month: number;
  year: number;
}

type TimeRange = 'weekly' | 'monthly' | 'yearly';

function relativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function DonutChart({ data, size = 180, strokeWidth = 30 }: { data: { name: string; amount: number; color: string; percentage: number }[]; size?: number; strokeWidth?: number }) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let accumulated = 0;

  if (data.length === 0) {
    return (
      <View style={[s.donutEmpty, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle cx={center} cy={center} r={radius} stroke={colors.skeleton} strokeWidth={strokeWidth} fill="none" />
        </Svg>
        <View style={s.donutCenter}>
          <Text style={[s.donutAmount, { color: colors.textMuted }]}>₹0</Text>
          <Text style={[s.donutLabel, { color: colors.textMuted }]}>No spend</Text>
        </View>
      </View>
    );
  }

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <View style={[s.donutWrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={colors.skeleton} strokeWidth={strokeWidth} fill="none" />
        {data.map((item, i) => {
          const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
          const rotation = (accumulated / 100) * 360 - 90;
          accumulated += item.percentage;
          return (
            <G key={item.name + i} transform={`rotate(${rotation} ${center} ${center})`}>
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
              />
            </G>
          );
        })}
      </Svg>
      <View style={s.donutCenter}>
        <Text style={[s.donutAmount, { color: colors.text, fontFamily: 'PlusJakartaSans' }]}>
          ₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </Text>
        <Text style={[s.donutLabel, { color: colors.textMuted, fontFamily: 'PlusJakartaSans' }]}>Total</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const { colors, isDark, fontFamily } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  const dataApi = useApi();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get(isAdmin ? '/expenses/all' : '/expenses'),
        api.get(`/expenses/summary?month=${selectedMonth}&year=${selectedYear}`),
      ]);
      setAllExpenses(expRes.data);
      if (sumRes.data) setSummary(sumRes.data);
    } catch {
      toast.error('Failed to load data');
    }
  }, [isAdmin, user, selectedMonth, selectedYear]);

  useFocusEffect(useCallback(() => { dataApi.run(loadData); }, [loadData, dataApi.run]));

  useEffect(() => {
    const filtered = allExpenses.filter(e => {
      if (e.status !== 'confirmed') return false;
      const d = new Date(e.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(filtered);
  }, [allExpenses, selectedMonth, selectedYear]);

  const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  function handlePrevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  }
  function handleNextMonth() {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  }

  function renderExpense({ item, index }: { item: Expense; index: number }) {
    const accIcon = item.accountSource?.includes('UPI') || item.accountSource?.includes('Bank') ? '🏦' : item.accountSource?.includes('Credit') ? '💳' : item.accountSource?.includes('Cash') ? '💵' : '🏦';
    const isEmail = item.metadata?.source === 'email';
    const isAlt = index % 2 === 1;
    return (
      <Pressable
        style={[s.txRow, isAlt && { backgroundColor: colors.cardAlt }]}
        onPress={() => navigation.navigate('ExpenseForm', { expense: item })}
      >
        <View style={[s.txIcon, { backgroundColor: `${item.category?.color || colors.primary}18` }]}>
          <Text style={{ fontSize: 18 }}>{item.category?.icon || '📦'}</Text>
        </View>
        <View style={s.txBody}>
          <View style={s.txTop}>
            <Text style={[s.txMerchant, { color: colors.text, fontFamily }]} numberOfLines={1}>{item.merchantName || item.description}</Text>
            {isEmail && (
              <View style={[s.emailTag, { backgroundColor: `${colors.primary}18` }]}>
                <Text style={[s.emailTagText, { color: colors.primary, fontFamily }]}>Email</Text>
              </View>
            )}
          </View>
          <Text style={[s.txDesc, { color: colors.textMuted, fontFamily }]} numberOfLines={1}>{item.description}</Text>
          <View style={s.txMeta}>
            <Text style={[s.txAcc, { color: colors.textMuted, fontFamily }]}>{accIcon} {item.accountSource || 'N/A'}</Text>
            <Text style={[s.txTime, { color: colors.textMuted, fontFamily }]}>{relativeTime(item.date)}</Text>
          </View>
        </View>
        <View style={s.txRight}>
          <Text style={[s.txAmount, { color: colors.text, fontFamily }]}>₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
          {isAdmin && item.user && (
            <Text style={[s.txUser, { color: colors.textMuted, fontFamily }]}>{item.user.name.split(' ')[0]}</Text>
          )}
        </View>
      </Pressable>
    );
  }

  function renderLoading() {
    return (
      <View>
        <SkeletonHero />
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Skeleton width={100} height={14} borderRadius={4} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 16 }}>
            <Skeleton width={180} height={180} borderRadius={90} />
          </View>
          {[0, 1, 2, 3].map(i => <SkeletonCategoryBar key={i} />)}
        </View>
        {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
      </View>
    );
  }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={dataApi.loading} onRefresh={() => dataApi.refetch(loadData)} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {dataApi.loading && !dataApi.exhausted ? (
          renderLoading()
        ) : dataApi.exhausted ? (
          <View style={s.errorContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[s.errorTitle, { color: colors.text, fontFamily }]}>Unable to load data</Text>
            <Text style={[s.errorSub, { color: colors.textMuted, fontFamily }]}>{dataApi.error}</Text>
            <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.primary }]} onPress={() => dataApi.refetch(loadData)}>
              <Text style={[s.retryBtnText, { fontFamily }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : dataApi.retrying ? (
          <View style={s.retryingOverlay}>
            <View style={[s.retryingCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[s.retryingText, { color: colors.textMuted, fontFamily }]}>Retrying...</Text>
            </View>
          </View>
        ) : (
          <>
            <View style={[s.hero, isDark ? s.heroDark : s.heroLight]}>
              <View style={s.heroTop}>
                <TouchableOpacity onPress={handlePrevMonth} hitSlop={12}>
                  <Text style={s.heroArrow}>&#8249;</Text>
                </TouchableOpacity>
                <View style={s.heroCenter}>
                  <Text style={[s.heroMonth, { fontFamily }]}>{FULL_MONTHS[selectedMonth - 1]} {selectedYear}</Text>
                  <Text style={[s.heroCount, { fontFamily }]}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</Text>
                </View>
                <TouchableOpacity onPress={handleNextMonth} hitSlop={12} disabled={isCurrentMonth} style={isCurrentMonth && s.disabled}>
                  <Text style={[s.heroArrow, isCurrentMonth && { opacity: 0.3 }]}>&#8250;</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={signOut} hitSlop={12} style={s.logoutBtn}>
                  <Text style={s.logoutIcon}>⏻</Text>
                </TouchableOpacity>
              </View>
              <AnimatedCounter
                value={summary?.totalSpent || 0}
                fontSize={38}
                fontWeight="800"
              />
              <Text style={[s.heroSub, { fontFamily }]}>
                {summary?.expenseCount || 0} transactions this month
              </Text>
            </View>

            {summary && summary.draftCount > 0 && (
              <TouchableOpacity style={[s.draftBanner, { backgroundColor: isDark ? '#2A2A40' : '#F0EDFF', borderColor: colors.primary }]}>
                <View style={s.draftBannerLeft}>
                  <View style={[s.draftBannerIcon, { backgroundColor: `${colors.primary}20` }]}>
                    <Text style={{ fontSize: 16 }}>📥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.draftBannerTitle, { color: colors.text, fontFamily }]}>{summary.draftCount} Draft{summary.draftCount !== 1 ? 's' : ''}</Text>
                    <Text style={[s.draftBannerSub, { color: colors.textMuted, fontFamily }]}>₹{Number(summary.draftTotal).toLocaleString('en-IN', { maximumFractionDigits: 0 })} pending</Text>
                  </View>
                </View>
                <Text style={[s.draftBannerArrow, { color: colors.primary }]}>&#8250;</Text>
              </TouchableOpacity>
            )}

            {summary && summary.topCategories.length > 0 && (
              <View style={s.chartSection}>
                <View style={s.sectionHeader}>
                  <Text style={[s.sectionTitle, { color: colors.text, fontFamily }]}>Spending Breakdown</Text>
                  <View style={s.timeChips}>
                    {(['weekly', 'monthly', 'yearly'] as TimeRange[]).map(range => (
                      <TouchableOpacity
                        key={range}
                        style={[s.timeChip, timeRange === range && { backgroundColor: colors.primary }]}
                        onPress={() => setTimeRange(range)}
                      >
                        <Text style={[s.timeChipText, timeRange === range ? { color: '#fff' } : { color: colors.textMuted }, { fontFamily }]}>{range.charAt(0).toUpperCase() + range.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={s.donutRow}>
                  <DonutChart data={summary.topCategories.slice(0, 6)} />
                  <View style={s.catLegend}>
                    {summary.topCategories.slice(0, 5).map((cat, i) => (
                      <View key={cat.name + i} style={s.legendItem}>
                        <View style={[s.legendDot, { backgroundColor: cat.color }]} />
                        <Text style={[s.legendLabel, { color: colors.text, fontFamily }]} numberOfLines={1}>{cat.name}</Text>
                        <Text style={[s.legendPct, { color: colors.textMuted, fontFamily }]}>{cat.percentage}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            <View style={s.listSection}>
              <Text style={[s.sectionTitle, { color: colors.text, fontFamily }]}>Recent Transactions</Text>
              {expenses.length > 0 ? (
                expenses.map((item, index) => <View key={item.id || index}>{renderExpense({ item, index })}</View>)
              ) : (
                <View style={s.empty}>
                  <Text style={s.emptyLine}>━━━━━━━━━━━━</Text>
                  <Text style={[s.emptyIcon]}>💰</Text>
                  <Text style={[s.emptyTitle, { color: colors.text, fontFamily }]}>No expenses yet</Text>
                  <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>
                    {isCurrentMonth ? 'Tap + to add your first expense' : 'No expenses for this period'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[s.fab, { backgroundColor: colors.coral }]}
        onPress={() => navigation.navigate('ExpenseForm')}
        activeOpacity={0.85}
      >
        <Text style={s.fabIcon}>+</Text>
        <Text style={[s.fabLabel, { fontFamily }]}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  hero: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 20,
  },
  heroDark: { backgroundColor: '#2A1F5E' },
  heroLight: { backgroundColor: '#6C4EF2' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  heroCenter: { alignItems: 'center' },
  heroMonth: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  heroCount: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  heroArrow: { fontSize: 26, color: 'rgba(255,255,255,0.8)', fontWeight: '300', width: 36, textAlign: 'center' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  disabled: { opacity: 0.3 },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoutIcon: { fontSize: 16 },
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  draftBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  draftBannerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  draftBannerTitle: { fontSize: 14, fontWeight: '600' },
  draftBannerSub: { fontSize: 12, marginTop: 2 },
  draftBannerArrow: { fontSize: 20, fontWeight: '600' },
  chartSection: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  timeChips: { flexDirection: 'row', gap: 6 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'transparent' },
  timeChipText: { fontSize: 12, fontWeight: '600' },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutWrap: { position: 'relative' },
  donutEmpty: { position: 'relative' },
  donutCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  donutAmount: { fontSize: 20, fontWeight: '700' },
  donutLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  catLegend: { flex: 1, gap: 10, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, fontWeight: '500', flex: 1 },
  legendPct: { fontSize: 12, fontWeight: '600', width: 36, textAlign: 'right' },
  listSection: { paddingHorizontal: 16, paddingTop: 12 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginVertical: 2,
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txBody: { flex: 1, flexShrink: 1 },
  txTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txMerchant: { fontSize: 15, fontWeight: '600', flex: 1 },
  txDesc: { fontSize: 13, marginTop: 2 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  txAcc: { fontSize: 11 },
  txTime: { fontSize: 11 },
  txRight: { alignItems: 'flex-end', marginLeft: 12 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  txUser: { fontSize: 11, marginTop: 2 },
  emailTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  emailTagText: { fontSize: 10, fontWeight: '600' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyLine: { fontSize: 10, color: '#ccc', marginBottom: 8 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#E85D3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { fontSize: 20, fontWeight: '700', color: '#fff', marginRight: 8 },
  fabLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  retryBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, minHeight: 44, justifyContent: 'center' },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  retryingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  retryingCard: { alignItems: 'center', justifyContent: 'center', padding: 32, borderRadius: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  retryingText: { fontSize: 14, fontWeight: '500', marginTop: 12 },
});
