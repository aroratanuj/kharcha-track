import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';
import { Skeleton, SkeletonHero, SkeletonCard } from '../../components/SkeletonLoader';
import api from '../../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface TrendPoint { date: string; amount: number; }
interface CatBreakdown { name: string; icon: string; color: string; amount: number; percentage: number; budget?: number; budgetLimit?: number; }

type Period = '7d' | '30d';

export default function AnalyticsDashboardScreen() {
  const { user } = useAuth();
  const { colors, fontFamily } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [summary, setSummary] = useState<{ totalSpent: number; thisMonth: number; transactionCount: number } | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<CatBreakdown[]>([]);
  const [insights, setInsights] = useState<{ text: string; type: 'info' | 'warning' }[]>([]);

  const now = new Date();
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [sumRes, trendRes, catRes] = await Promise.all([
        api.get('/analytics/summary', isAdmin ? { params: { month: selectedMonth, year: selectedYear } } : {}),
        api.get('/analytics/trends', { params: { days: period === '7d' ? 7 : 30 } }),
        api.get('/analytics/by-category', isAdmin ? { params: { month: selectedMonth, year: selectedYear } } : {}),
      ]);
      if (sumRes.data) setSummary(sumRes.data);
      if (trendRes.data) setTrends(trendRes.data);
      if (catRes.data && catRes.data.length > 0) {
        const total = catRes.data.reduce((s: number, c: any) => s + (c.amount || 0), 0);
        const withPct = catRes.data.map((c: any) => ({ ...c, percentage: total > 0 ? Math.round((c.amount / total) * 100) : 0 }));
        withPct.sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0));
        setCategories(withPct);
      }

      const ins: { text: string; type: 'info' | 'warning' }[] = [];
      if (catRes.data && catRes.data.length > 0) {
        const top = catRes.data[0];
        const total = catRes.data.reduce((s: number, c: any) => s + (c.amount || 0), 0);
        ins.push({ text: `${top.name || 'Uncategorized'} is your top category (${Math.round(((top.amount || 0) / total) * 100)}%)`, type: 'info' });
        if (catRes.data.length >= 2) {
          const second = catRes.data[1];
          ins.push({ text: `${second.name || 'Uncategorized'} is #2 (${Math.round(((second.amount || 0) / total) * 100)}%)`, type: 'info' });
        }
      }
      setInsights(ins);
    } catch { toast.error('Failed to load analytics'); } finally { setLoading(false); }
  }, [user, isAdmin, selectedMonth, selectedYear, period, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const maxTrend = trends.length > 0 ? Math.max(...trends.map(t => t.amount)) : 1;

  function handlePrevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  }
  function handleNextMonth() {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  }

  if (loading) {
    return (
      <View style={[s.outer, { backgroundColor: colors.bg }]}>
        <View style={{ padding: 16 }}>
          <SkeletonHero />
          <View style={{ gap: 10, paddingVertical: 16 }}>
            <Skeleton width="80%" height={14} borderRadius={4} />
            <Skeleton width="100%" height={200} borderRadius={12} />
            <Skeleton width="100%" height={14} borderRadius={4} />
            {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[s.hero, isAdmin ? s.heroDark : s.heroLight]}>
          <Text style={[s.heroMonth, { fontFamily }]}>{MONTHS[selectedMonth - 1]} {selectedYear} Summary</Text>
          {summary && (
            <Text style={[s.heroAmount, { fontFamily }]}>₹{Number(summary.totalSpent).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</Text>
          )}
          {summary && (
            <Text style={[s.heroCount, { fontFamily }]}>
              {summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''} this month
            </Text>
          )}
        </View>

        <View style={s.periodRow}>
          {(['7d', '30d'] as Period[]).map(p => (
            <TouchableOpacity key={p} style={[s.periodChip, period === p && { backgroundColor: colors.primary }]} onPress={() => setPeriod(p)}>
              <Text style={[s.periodText, { color: period === p ? '#fff' : colors.textMuted, fontFamily }]}>{p === '7d' ? '7 Days' : '30 Days'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {insights.length > 0 && (
          <View style={s.insightsRow}>
            {insights.map((ins, i) => (
              <View key={i} style={[s.insightChip, { backgroundColor: ins.type === 'warning' ? `${colors.warning}15` : `${colors.primary}10`, borderColor: ins.type === 'warning' ? `${colors.warning}30` : `${colors.primary}20` }]}>
                <Text style={[s.insightText, { color: ins.type === 'warning' ? colors.warning : colors.primary, fontFamily }]}>{ins.text}</Text>
              </View>
            ))}
          </View>
        )}

        {trends.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.text, fontFamily }]}>Spending Trend</Text>
            <View style={s.chartContainer}>
              {trends.map((t, i) => {
                const barH = maxTrend > 0 ? Math.max(4, (t.amount / maxTrend) * 180) : 4;
                return (
                  <View key={i} style={[s.chartBarCol]}>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                      <View style={[s.chartBar, { height: barH, backgroundColor: i === trends.length - 1 ? colors.primary : `${colors.primary}60` }]} />
                    </View>
                    <Text style={[s.chartLabel, { color: colors.textMuted, fontFamily }]}>{new Date(t.date).getDate()}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {categories.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.text, fontFamily }]}>Category Breakdown</Text>
            {categories.map((cat, i) => (
              <View key={cat.name || i} style={[s.catRow, i % 2 === 1 && { backgroundColor: colors.cardAlt }]}>
                <View style={[s.catBorder, { backgroundColor: cat.color }]} />
                <View style={[s.catIcon, { backgroundColor: `${cat.color}18` }]}>
                  <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                </View>
                <View style={s.catInfo}>
                  <Text style={[s.catName, { color: colors.text, fontFamily }]} numberOfLines={1}>{cat.name}</Text>
                  <Text style={[s.catAmount, { color: colors.text, fontFamily }]}>₹{Number(cat.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                </View>
                <View style={s.catRight}>
                  <Text style={[s.catPct, { color: cat.percentage > 25 ? colors.text : colors.textMuted, fontFamily }]}>{cat.percentage}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {(!trends || trends.length === 0) && categories.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📊</Text>
            <Text style={[s.emptyTitle, { color: colors.text, fontFamily }]}>No Data Yet</Text>
            <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>Start adding expenses to see your analytics.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  hero: { marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 16 },
  heroDark: { backgroundColor: '#2A1F5E' },
  heroLight: { backgroundColor: '#6C4EF2' },
  heroMonth: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroAmount: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 4 },
  heroCount: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  periodRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  periodText: { fontSize: 13, fontWeight: '600' },
  insightsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4, flexWrap: 'wrap' },
  insightChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginBottom: 4 },
  insightText: { fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 200, gap: 2, backgroundColor: 'rgba(128,128,128,0.04)', borderRadius: 12, padding: 12 },
  chartBarCol: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: '80%', borderRadius: 6 },
  chartLabel: { fontSize: 10, marginTop: 6, textAlign: 'center' },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  catBorder: { width: 4, height: 40, borderRadius: 2 },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  catInfo: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '600' },
  catAmount: { fontSize: 13, marginTop: 2 },
  catRight: { alignItems: 'flex-end' },
  catPct: { fontSize: 14, fontWeight: '700' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center' },
});
