import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
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

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set(allExpenses.map(e => new Date(e.date).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [allExpenses]);

  useEffect(() => { loadExpenses(); }, []);

  async function loadExpenses() {
    setLoading(true);
    try {
      const url = isAdmin ? '/expenses/all' : '/expenses';
      const response = await api.get(url);
      setAllExpenses(response.data);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const filtered = allExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(filtered);
  }, [allExpenses, selectedMonth, selectedYear]);

  const totalAmount = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses]);
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
          <View style={[s.badge, { backgroundColor: item.status === 'confirmed' ? (isDark ? '#1a3a2a' : '#E8F8EF') : (isDark ? '#3a3520' : '#FFF8E1') }]}>
            <Text style={[s.badgeText, { color: item.status === 'confirmed' ? colors.success : colors.warning }]}>{item.status === 'confirmed' ? 'Confirmed' : 'Draft'}</Text>
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

        <View style={[s.summary, { backgroundColor: colors.primary }]}>
          <Text style={s.summaryLabel}>Total Spent</Text>
          <Text style={s.summaryAmount}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        </View>

        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadExpenses} tintColor={colors.primary} colors={[colors.primary]} />}
          renderItem={renderCard}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📊</Text>
              <Text style={[s.emptyTitle, { color: colors.text }]}>No expenses this month</Text>
              <Text style={[s.emptySub, { color: colors.textMuted }]}>{isCurrentMonth ? 'Tap + to add your first expense' : 'No expenses for this period'}</Text>
            </View>
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
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  summaryLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  summaryAmount: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  card: { marginHorizontal: 12, marginVertical: 5, padding: 14, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardCat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardCatIcon: { fontSize: 16 },
  cardCatName: { fontSize: 13, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
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
