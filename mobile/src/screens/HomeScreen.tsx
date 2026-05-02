import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import FabButton from '../components/FabButton';
import api from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set(allExpenses.map(e => new Date(e.date).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [allExpenses]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get(isAdmin ? '/expenses/all' : '/expenses'),
        api.get(`/expenses/summary?month=${selectedMonth}&year=${selectedYear}`),
      ]);
      setAllExpenses(expRes.data);
      if (sumRes.data) setSummary(sumRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast, user, selectedMonth, selectedYear]);

  useEffect(() => { loadData(); }, [loadData]);

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

  function renderCard({ item }: { item: Expense }) {
    const d = new Date(item.date);
    const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const accIcon = item.accountSource === 'UPI' ? '📱' : item.accountSource === 'Card' ? '💳' : item.accountSource === 'Cash' ? '💵' : '🏦';
    return (
      <TouchableOpacity style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('ExpenseForm', { expense: item })}>
        <View style={s.cardHeader}>
          <View style={s.cardCat}>
            <Text style={s.cardCatIcon}>{item.category?.icon || '📦'}</Text>
            <Text style={[s.cardCatName, { color: colors.textSecondary }]}>{item.category?.name || 'Uncategorized'}</Text>
          </View>
        </View>
        <Text style={[s.cardDesc, { color: colors.text }]}>{item.description}</Text>
        {isAdmin && item.user && <Text style={[s.cardUser, { color: colors.textMuted }]}>{item.user.name}</Text>}
        <View style={s.cardFooter}>
          <Text style={[s.cardAmount, { color: colors.primary }]}>₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          <View style={s.cardRight}>
            {item.merchantName ? <Text style={[s.cardMerchant, { color: colors.textMuted }]}>{item.merchantName}</Text> : null}
            <Text style={[s.cardDate, { color: colors.textMuted }]}>{dateStr}</Text>
          </View>
        </View>
        {item.accountSource ? (
          <View style={[s.cardMeta, { borderTopColor: colors.border }]}>
            <Text style={[s.cardMetaText, { color: colors.textMuted }]}>{accIcon} {item.accountSource}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  function renderCategoryBar(cat: Summary['topCategories'][0], maxAmount: number) {
    const barWidth = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;
    return (
      <View style={s.catRow}>
        <View style={s.catInfo}>
          <Text style={s.catIcon}>{cat.icon}</Text>
          <Text style={[s.catName, { color: colors.text }]} numberOfLines={1}>{cat.name}</Text>
        </View>
        <View style={s.catBarContainer}>
          <View style={[s.catBarBg, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}>
            <View style={[s.catBarFill, { backgroundColor: cat.color, width: `${barWidth}%` }]} />
          </View>
          <Text style={[s.catAmount, { color: colors.text }]}>₹{Number(cat.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <View style={[s.screenBorder, { backgroundColor: colors.surface, borderColor: colors.screenBorder }]}>
        <View style={[s.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[s.filterArrow, { backgroundColor: colors.card }]} onPress={handlePrevMonth}>
            <Text style={[s.filterArrowText, { color: colors.text }]}>&#8249;</Text>
          </TouchableOpacity>
          <View style={s.filterCenter}>
            <Text style={[s.filterLabel, { color: colors.text }]}>{MONTHS[selectedMonth - 1]} {selectedYear}</Text>
            <Text style={[s.filterCount, { color: colors.textMuted }]}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={[s.filterArrow, isCurrentMonth && s.disabled, { backgroundColor: colors.card }]} onPress={handleNextMonth} disabled={isCurrentMonth}>
            <Text style={[s.filterArrowText, isCurrentMonth && { color: colors.border }, { color: colors.text }]}>&#8250;</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ListHeaderComponent={
            <View>
              {summary && (
                <View style={[s.summaryCard, { backgroundColor: colors.primary }]}>
                  <Text style={s.summaryLabel}>Total Spent</Text>
                  <Text style={s.summaryAmount}>₹{Number(summary.totalSpent).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  <Text style={s.summaryCount}>{summary.expenseCount} expenses in {MONTHS[selectedMonth - 1]}</Text>
                </View>
              )}

              {summary && summary.draftCount > 0 && (
                <TouchableOpacity style={[s.draftBanner, { backgroundColor: isDark ? '#2a2a1a' : '#FFF8E1', borderColor: isDark ? '#4a4a2a' : '#FFE082' }]} onPress={() => navigation.navigate('DraftExpenses')}>
                  <View style={s.draftBannerLeft}>
                    <Text style={s.draftBannerIcon}>📥</Text>
                    <View>
                      <Text style={[s.draftBannerTitle, { color: colors.text }]}>{summary.draftCount} Draft Expense{summary.draftCount !== 1 ? 's' : ''}</Text>
                      <Text style={[s.draftBannerSub, { color: colors.textMuted }]}>₹{Number(summary.draftTotal).toLocaleString('en-IN', { minimumFractionDigits: 0 })} pending review</Text>
                    </View>
                  </View>
                  <Text style={s.draftBannerArrow}>&#8250;</Text>
                </TouchableOpacity>
              )}

              {summary && summary.topCategories.length > 0 && (
                <View style={s.catSection}>
                  <Text style={[s.catTitle, { color: colors.text }]}>Top Categories</Text>
                  {summary.topCategories.map((cat, i) => {
                    const maxAmount = summary.topCategories[0].amount;
                    return (
                      <View key={cat.name || i}>
                        {renderCategoryBar(cat, maxAmount)}
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={[s.listHeader, { borderBottomColor: colors.border }]}>
                <Text style={[s.listHeaderTitle, { color: colors.text }]}>Recent Expenses</Text>
              </View>
            </View>
          }
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={colors.primary} colors={[colors.primary]} />}
          renderItem={renderCard}
          ListEmptyComponent={
            !loading ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📊</Text>
                <Text style={[s.emptyTitle, { color: colors.text }]}>No expenses this month</Text>
                <Text style={[s.emptySub, { color: colors.textMuted }]}>{isCurrentMonth ? 'Tap + to add your first expense' : 'No expenses for this period'}</Text>
              </View>
            ) : null
          }
        />
      </View>
      <FabButton />
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', paddingTop: 4 },
  screenBorder: { flex: 1, width: '100%', maxWidth: 700, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  filterBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1 },
  filterArrow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.3 },
  filterArrowText: { fontSize: 22, fontWeight: '600', marginTop: -2 },
  filterCenter: { alignItems: 'center' },
  filterLabel: { fontSize: 18, fontWeight: '700' },
  filterCount: { fontSize: 12, marginTop: 2 },
  summaryCard: { margin: 12, padding: 20, borderRadius: 12 },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryAmount: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  summaryCount: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  draftBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 10, borderWidth: 1 },
  draftBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  draftBannerIcon: { fontSize: 22 },
  draftBannerTitle: { fontSize: 15, fontWeight: '600' },
  draftBannerSub: { fontSize: 13, marginTop: 2 },
  draftBannerArrow: { fontSize: 22, color: '#999' },
  catSection: { paddingHorizontal: 12, paddingVertical: 12 },
  catTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
  catInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 110 },
  catIcon: { fontSize: 16 },
  catName: { fontSize: 13, fontWeight: '500', flex: 1 },
  catBarContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 4 },
  catAmount: { fontSize: 12, fontWeight: '600', width: 60, textAlign: 'right' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  listHeaderTitle: { fontSize: 15, fontWeight: '700' },
  card: { marginHorizontal: 12, marginVertical: 5, padding: 14, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardCat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardCatIcon: { fontSize: 16 },
  cardCatName: { fontSize: 13, fontWeight: '600' },
  cardDesc: { fontSize: 15, fontWeight: '500', marginBottom: 6 },
  cardUser: { fontSize: 12, marginBottom: 4, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardAmount: { fontSize: 18, fontWeight: 'bold' },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  cardMerchant: { fontSize: 12 },
  cardDate: { fontSize: 11 },
  cardMeta: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cardMetaText: { fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center' },
});
