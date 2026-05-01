import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

interface Expense {
  id: string;
  amount: number | string;
  description: string;
  merchantName: string;
  date: string;
  status: 'draft' | 'confirmed';
  user: { id: string; email: string; name: string };
}

export default function AdminDashboardScreen() {
  const toast = useToast();
  const { colors, isDark } = useTheme();
  const { isWeb } = useResponsive();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'confirmed', label: 'Confirmed' },
  ];

  useEffect(() => { loadExpenses(); }, []);
  useEffect(() => { if (activeTab !== 'all') loadExpenses(); }, [activeTab]);

  async function loadExpenses() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeTab !== 'all') params.status = activeTab;
      const response = await api.get('/expenses/all', { params });
      setExpenses(response.data);
    } catch (error: any) {
      if (error.message?.includes('Network')) toast.error('Cannot connect to server');
      else toast.error('Failed to load expenses');
    } finally { setLoading(false); }
  }

  function handleDeleteExpense(id: string) {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/expenses/${id}`); toast.success('Expense deleted'); await loadExpenses(); }
        catch (e: any) { toast.error(e.response?.data?.message || 'Failed to delete expense'); }
      }},
    ]);
  }

  async function handleConfirmExpense(id: string) {
    try { await api.post(`/expenses/${id}/confirm`); toast.success('Expense confirmed'); await loadExpenses(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed to confirm expense'); }
  }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <View style={[s.screenBorder, { backgroundColor: colors.surface, borderColor: colors.screenBorder }]}>
        <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
          {tabs.map(t => (
            <TouchableOpacity key={t.key} style={[s.tabItem, activeTab === t.key && { borderBottomColor: colors.primary }]} onPress={() => setActiveTab(t.key)}>
              <Text style={[s.tabText, { color: activeTab === t.key ? colors.primary : colors.textMuted }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadExpenses} tintColor={colors.primary} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const d = new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.cardHeader}>
                  <View style={s.cardHeaderLeft}>
                    <Text style={[s.userName, { color: colors.text }]}>{item.user?.name || 'Unknown'}</Text>
                    <Text style={[s.userEmail, { color: colors.textMuted }]}>{item.user?.email || ''}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: item.status === 'confirmed' ? (isDark ? '#1a3a2a' : '#E8F8EF') : (isDark ? '#3a3520' : '#FFF8E1') }]}>
                    <Text style={[s.badgeText, { color: item.status === 'confirmed' ? colors.success : colors.warning }]}>
                      {item.status === 'confirmed' ? 'Confirmed' : 'Draft'}
                    </Text>
                  </View>
                </View>
                <Text style={[s.description, { color: colors.text }]} numberOfLines={2}>{item.description}</Text>
                <Text style={[s.dateText, { color: colors.textMuted }]}>{d}</Text>
                <View style={[s.cardFooter, { borderTopColor: colors.border }]}>
                  <Text style={[s.amount, { color: colors.primary }]}>₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                  <View style={s.actions}>
                    {item.status === 'draft' && (
                      <TouchableOpacity style={[s.confirmBtn, { backgroundColor: colors.success }]} onPress={() => handleConfirmExpense(item.id)}>
                        <Text style={s.actionText}>Confirm</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[s.deleteBtn, { backgroundColor: isDark ? '#3a2020' : '#FFF0F0' }]} onPress={() => handleDeleteExpense(item.id)}>
                      <Text style={[s.deleteText, { color: colors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={[s.emptyTitle, { color: colors.text }]}>No expenses found</Text>
              <Text style={[s.emptySub, { color: colors.textMuted }]}>No expenses match the current filter</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', paddingTop: 4 },
  screenBorder: { flex: 1, width: '100%', maxWidth: 700, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 15, fontWeight: '600' },
  card: { marginHorizontal: 12, marginVertical: 6, padding: 14, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardHeaderLeft: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700' },
  userEmail: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  description: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  dateText: { fontSize: 12, marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTopWidth: 1 },
  amount: { fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 8 },
  confirmBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  deleteText: { fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center' },
});
