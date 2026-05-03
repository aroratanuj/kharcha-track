import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';
import { Skeleton, SkeletonHero } from '../../components/SkeletonLoader';
import api from '../../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface BudgetItem {
  id: string;
  categoryId: string;
  month: number;
  year: number;
  limit: number;
  spent: number;
  category?: { id: string; name: string; color: string; icon: string };
}

export default function BudgetDashboardScreen() {
  const { user } = useAuth();
  const { colors, fontFamily } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/budgets', { params: { month: selectedMonth, year: selectedYear } });
      if (res.data) setBudgets(res.data);
    } catch { toast.error('Failed to load budgets'); } finally { setLoading(false); }
  }, [user, selectedMonth, selectedYear, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalLimit = budgets.reduce((s, b) => s + (b.limit || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const overallPct = totalLimit > 0 ? Math.min(Math.round((totalSpent / totalLimit) * 100), 100) : 0;

  function handlePrevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  }
  function handleNextMonth() {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  }

  function barColor(spent: number, limit: number) {
    if (limit === 0) return colors.primary;
    const pct = (spent / limit) * 100;
    if (pct >= 95) return '#FF3B30';
    if (pct >= 75) return '#F5A623';
    return colors.primary;
  }

  if (loading) {
    return (
      <View style={[s.outer, { backgroundColor: colors.bg }]}>
        <View style={{ padding: 16 }}>
          <SkeletonHero />
          <View style={{ gap: 10, paddingVertical: 16 }}>
            <Skeleton width="60%" height={14} borderRadius={4} />
            {[0, 1, 2].map(i => <View key={i} style={[s.skelBudget, { backgroundColor: colors.skeleton }]} />)}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[s.hero, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
          <View style={s.heroTop}>
            <TouchableOpacity onPress={handlePrevMonth} hitSlop={12}>
              <Text style={[s.heroArrow, { color: colors.text }]}>&#8249;</Text>
            </TouchableOpacity>
            <View style={s.heroCenter}>
              <Text style={[s.heroMonth, { fontFamily, color: colors.text }]}>{MONTHS[selectedMonth - 1]} {selectedYear}</Text>
              <Text style={[s.heroCount, { fontFamily, color: colors.textMuted }]}>{budgets.length} budget{budgets.length !== 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity onPress={handleNextMonth} hitSlop={12}>
              <Text style={[s.heroArrow, { color: colors.text }]}>&#8250;</Text>
            </TouchableOpacity>
          </View>
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={[s.heroStatValue, { color: colors.text, fontFamily }]}>{totalSpent > 0 ? `₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}</Text>
              <Text style={[s.heroStatLabel, { color: colors.textMuted, fontFamily }]}>of ₹{totalLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
            </View>
          </View>
          <View style={[s.overallBar, { backgroundColor: colors.skeleton }]}>
            <View style={[s.overallBarFill, { width: `${overallPct}%`, backgroundColor: barColor(totalSpent, totalLimit) }]} />
          </View>
        </View>

        {budgets.length > 0 ? (
          <View style={s.budgetList}>
            {budgets.map((b, i) => {
              const pct = b.limit > 0 ? Math.min(Math.round((b.spent / b.limit) * 100), 100) : 0;
              return (
                <View key={b.id || i} style={[s.budgetCard, i % 2 === 1 && { backgroundColor: colors.cardAlt }, { borderColor: colors.border, backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
                  <View style={s.budgetTop}>
                    <View style={[s.budgetIconWrap, { backgroundColor: `${b.category?.color || colors.primary}18` }]}>
                      <Text style={{ fontSize: 20 }}>{b.category?.icon || '📦'}</Text>
                    </View>
                    <View style={s.budgetInfo}>
                      <Text style={[s.budgetName, { color: colors.text, fontFamily }]} numberOfLines={1}>{b.category?.name || 'Uncategorized'}</Text>
                      <Text style={[s.budgetAmount, { color: colors.textMuted, fontFamily }]}>
                        ₹{Number(b.spent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} of ₹{Number(b.limit || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                    <View style={[s.budgetPct, { backgroundColor: pct >= 95 ? '#FF3B30' : pct >= 75 ? '#F5A623' : colors.success }]}>
                      <Text style={[s.budgetPctText, { fontFamily }]}>{pct}%</Text>
                    </View>
                  </View>
                  <View style={[s.progressBar, { backgroundColor: colors.skeleton }]}>
                    <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: barColor(b.spent, b.limit) }]} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={s.empty}>
            <View style={[s.emptyCard, { borderColor: colors.border }]}>
              <Text style={[s.emptyCardIcon, { color: colors.primary }]}>+</Text>
              <Text style={[s.emptyCardTitle, { color: colors.text, fontFamily }]}>Set a Budget</Text>
              <Text style={[s.emptyCardSub, { color: colors.textMuted, fontFamily }]}>Track spending by category</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  hero: { marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 16, borderWidth: 1 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  heroCenter: { alignItems: 'center' },
  heroMonth: { fontSize: 16, fontWeight: '600' },
  heroCount: { fontSize: 12, marginTop: 2 },
  heroArrow: { fontSize: 22, width: 36, textAlign: 'center' },
  heroStats: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  heroStatValue: { fontSize: 20, fontWeight: '700' },
  heroStatLabel: { fontSize: 12 },
  overallBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  overallBarFill: { height: '100%', borderRadius: 4 },
  budgetList: { paddingHorizontal: 16, paddingTop: 8 },
  budgetCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  budgetTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  budgetIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  budgetInfo: { flex: 1 },
  budgetName: { fontSize: 15, fontWeight: '600' },
  budgetAmount: { fontSize: 13, marginTop: 2 },
  budgetPct: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  budgetPctText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyCard: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, padding: 30, alignItems: 'center', width: '70%' },
  emptyCardIcon: { fontSize: 32, marginBottom: 8 },
  emptyCardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptyCardSub: { fontSize: 13, textAlign: 'center' },
  skelBudget: { height: 80, borderRadius: 12, marginBottom: 8 },
});
