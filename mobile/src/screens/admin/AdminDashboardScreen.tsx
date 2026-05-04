import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useApi } from '../../hooks/useApi';

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
  const { colors, fontFamily } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const dataApi = useApi();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts' },
    { key: 'confirmed', label: 'Confirmed' },
  ];

  const loadExpenses = useCallback(async () => {
    const params: Record<string, string> = {};
    if (activeTab !== 'all') params.status = activeTab;
    const response = await api.get('/expenses/all', { params });
    setExpenses(response.data);
  }, [activeTab]);

  useEffect(() => { dataApi.run(loadExpenses); }, []);
  useEffect(() => { if (activeTab !== 'all') dataApi.run(loadExpenses); }, [activeTab]);

  function handleDeleteExpense(id: string) {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/expenses/${id}`); toast.success('Expense deleted'); await dataApi.refetch(loadExpenses); }
        catch (e: any) { toast.error(e.response?.data?.message || 'Failed to delete expense'); }
      }},
    ]);
  }

  async function handleConfirmExpense(id: string) {
    try { await api.post(`/expenses/${id}/confirm`); toast.success('Expense confirmed'); await dataApi.refetch(loadExpenses); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed to confirm expense'); }
  }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      {dataApi.exhausted ? (
        <View style={s.errorContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.errorTitle, { color: colors.text, fontFamily }]}>Unable to load expenses</Text>
          <Text style={[s.errorSub, { color: colors.textMuted, fontFamily }]}>{dataApi.error}</Text>
          <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.primary }]} onPress={() => dataApi.refetch(loadExpenses)}>
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
      <View style={s.pillRow}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[s.pill, activeTab === t.key && { backgroundColor: colors.primary }]} onPress={() => setActiveTab(t.key)}>
            <Text style={[s.pillText, { color: activeTab === t.key ? '#fff' : colors.textMuted, fontFamily }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        refreshing={dataApi.loading}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={dataApi.loading} onRefresh={() => dataApi.refetch(loadExpenses)} tintColor={colors.primary} colors={[colors.primary]} />}
        renderItem={({ item, index }) => {
          const d = new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          return (
            <View style={[s.card, index % 2 === 1 && { backgroundColor: colors.cardAlt }, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadowColor }]}>
              <View style={s.cardTop}>
                <View style={[s.avatar, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[s.avatarText, { color: colors.primary }]}>{(item.user?.name || 'U')[0].toUpperCase()}</Text>
                </View>
                <View style={s.cardTopInfo}>
                  <Text style={[s.userName, { color: colors.text, fontFamily }]} numberOfLines={1}>{item.user?.name || 'Unknown'}</Text>
                  <Text style={[s.userEmail, { color: colors.textMuted, fontFamily }]} numberOfLines={1}>{item.user?.email || ''}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: item.status === 'confirmed' ? `${colors.success}15` : `${colors.warning}15` }]}>
                  <Text style={[s.badgeText, { color: item.status === 'confirmed' ? colors.success : colors.warning, fontFamily }]}>
                    {item.status === 'confirmed' ? 'Confirmed' : 'Draft'}
                  </Text>
                </View>
              </View>

              <Text style={[s.description, { color: colors.text, fontFamily }]} numberOfLines={2}>{item.description}</Text>
              <Text style={[s.dateText, { color: colors.textMuted, fontFamily }]}>{d}</Text>

              <View style={[s.cardFooter, { borderTopColor: `${colors.border}` }]}>
                <Text style={[s.amount, { color: colors.text, fontFamily }]}>₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                <View style={s.actions}>
                  {item.status === 'draft' && (
                    <TouchableOpacity style={[s.confirmBtn, { backgroundColor: colors.primary }]} onPress={() => handleConfirmExpense(item.id)}>
                      <Text style={[s.btnText, { fontFamily }]}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[s.deleteBtn, { backgroundColor: `${colors.danger}12` }]} onPress={() => handleDeleteExpense(item.id)}>
                    <Text style={[s.deleteText, { color: colors.danger, fontFamily }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={[s.emptyTitle, { color: colors.text, fontFamily }]}>No expenses found</Text>
            <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>No expenses match the current filter</Text>
          </View>
        }
      />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  pillRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  pill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  pillText: { fontSize: 14, fontWeight: '600' },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  cardTopInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700' },
  userEmail: { fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  description: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  dateText: { fontSize: 12, marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  amount: { fontSize: 18, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  confirmBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  deleteText: { fontSize: 13, fontWeight: '600' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  retryBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, minHeight: 44, justifyContent: 'center' },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  retryingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  retryingCard: { alignItems: 'center', justifyContent: 'center', padding: 32, borderRadius: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  retryingText: { fontSize: 14, fontWeight: '500', marginTop: 12 },
});
