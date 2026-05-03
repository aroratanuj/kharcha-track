import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';
import FabButton from '../../components/FabButton';
import api from '../../services/api';

interface DraftExpense {
  id: string;
  amount: number;
  description: string;
  merchantName: string;
  date: string;
  category: { id: string; name: string; color: string; icon: string } | null;
  accountSource: string;
  status: string;
  user?: { id: string; name: string; email: string } | null;
  metadata?: {
    source?: string;
    confidence?: string;
    senderEmail?: string;
    subject?: string;
  };
}

export default function DraftExpensesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const [drafts, setDrafts] = useState<DraftExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (isAdmin) {
        res = await api.get('/expenses/all', { params: { status: 'draft' } });
      } else {
        res = await api.get('/expenses/drafts');
      }
      setDrafts(res.data);
    } catch {
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, [toast, isAdmin]);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  async function handleConfirm(id: string) {
    try {
      await api.post(`/expenses/${id}/confirm`);
      toast.success('Expense confirmed');
      await loadDrafts();
    } catch {
      toast.error('Failed to confirm');
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Draft', 'Remove this draft expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/expenses/${id}`); toast.success('Draft deleted'); await loadDrafts(); }
        catch { toast.error('Failed to delete'); }
      }},
    ]);
  }

  function handleEdit(item: DraftExpense, index: number) {
    navigation.navigate('DraftReview', { index });
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === drafts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drafts.map(d => d.id)));
    }
  }

  async function handleBulkConfirm() {
    if (selectedIds.size === 0) return;
    Alert.alert('Confirm Selected', `Confirm ${selectedIds.size} draft expense${selectedIds.size !== 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          await api.post('/expenses/bulk-confirm', { ids: Array.from(selectedIds) });
          toast.success(`${selectedIds.size} expense(s) confirmed`);
          setSelectedIds(new Set());
          await loadDrafts();
        } catch { toast.error('Failed to confirm'); }
      }},
    ]);
  }

  function renderItem({ item, index }: { item: DraftExpense; index: number }) {
    const isSelected = selectedIds.has(item.id);
    const d = new Date(item.date);
    const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const isEmail = item.metadata?.source === 'email';
    const confidence = item.metadata?.confidence || 'medium';
    const confColor = confidence === 'high' ? '#34C759' : confidence === 'medium' ? '#FF9500' : '#FF3B30';

    return (
      <View style={[s.card, { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border }]}>
        <TouchableOpacity style={s.cardMain} onPress={() => toggleSelect(item.id)} activeOpacity={0.7}>
          <View style={s.cardCheck}>
            <View style={[s.checkbox, { borderColor: colors.border, backgroundColor: isSelected ? colors.primary : 'transparent' }]} />
          </View>
          <View style={s.cardBody}>
            <View style={s.cardTop}>
              <Text style={[s.cardDesc, { color: colors.text }]} numberOfLines={1}>{item.description}</Text>
              {isEmail && (
                <View style={[s.badge, { backgroundColor: isDark ? '#1a2a4a' : '#E8F4FF' }]}>
                  <Text style={[s.badgeText, { color: colors.primary }]}>Email</Text>
                </View>
              )}
              <View style={[s.badge, { backgroundColor: isDark ? '#2a2a1a' : '#FFF8E1' }]}>
                <Text style={[s.badgeText, { color: confColor }]}>{confidence}</Text>
              </View>
            </View>
            <View style={s.cardMeta}>
              <Text style={[s.cardAmount, { color: colors.primary }]}>₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              <Text style={[s.cardDate, { color: colors.textMuted }]}>{dateStr}</Text>
            </View>
            {item.merchantName ? <Text style={[s.cardMerchant, { color: colors.textMuted }]}>{item.merchantName}</Text> : null}
            {isAdmin && item.user && (
              <Text style={[s.cardOwner, { color: colors.textMuted }]}>👤 {item.user.name}</Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={[s.cardActions, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: isDark ? '#1a3a2a' : '#E8F8EF' }]} onPress={() => handleConfirm(item.id)}>
            <Text style={[s.actionBtnText, { color: '#34C759' }]}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: isDark ? '#1a2a4a' : '#E8F4FF' }]} onPress={() => handleEdit(item, index)}>
            <Text style={[s.actionBtnText, { color: colors.primary }]}>Review</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: isDark ? '#3a2020' : '#FFF0F0' }]} onPress={() => handleDelete(item.id)}>
            <Text style={[s.actionBtnText, { color: '#FF3B30' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <View style={[s.screenBorder, { backgroundColor: colors.surface, borderColor: colors.screenBorder }]}>
        {isAdmin && (
          <View style={[s.adminBar, { backgroundColor: isDark ? '#1a1a2a' : '#F0F4FF', borderBottomColor: colors.border }]}>
            <Text style={[s.adminBarText, { color: colors.primary }]}>Admin: Viewing all users' drafts</Text>
          </View>
        )}
        {drafts.length > 0 && (
          <View style={[s.bulkBar, { backgroundColor: isDark ? '#1a1a2a' : '#F0F4FF', borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={toggleSelectAll} style={s.selectAllBtn}>
              <Text style={[s.selectAllText, { color: colors.primary }]}>
                {selectedIds.size === drafts.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[s.reviewAllBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('DraftReview', { index: 0 })}
              >
                <Text style={s.bulkConfirmText}>Review All ({drafts.length})</Text>
              </TouchableOpacity>
              {selectedIds.size > 0 && (
                <TouchableOpacity style={[s.bulkConfirmBtn, { backgroundColor: '#34C759' }]} onPress={handleBulkConfirm}>
                  <Text style={s.bulkConfirmText}>Confirm ({selectedIds.size})</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <FlatList
          data={drafts}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDrafts} tintColor={colors.primary} colors={[colors.primary]} />}
          renderItem={renderItem}
          ListEmptyComponent={
            !loading ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📥</Text>
                <Text style={[s.emptyTitle, { color: colors.text }]}>No Pending Drafts</Text>
                <Text style={[s.emptySub, { color: colors.textMuted }]}>Forward expense emails to your Kharcha inbox.</Text>
                <Text style={[s.emptySub, { color: colors.textMuted }]}>AI will create draft expenses automatically.</Text>
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
  adminBar: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  adminBarText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  bulkBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  selectAllBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  selectAllText: { fontSize: 14, fontWeight: '600' },
  bulkConfirmBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minHeight: 36, justifyContent: 'center' },
  bulkConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  card: { marginHorizontal: 12, marginVertical: 6, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardMain: { flexDirection: 'row', padding: 12 },
  cardCheck: { justifyContent: 'center', paddingRight: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  cardDesc: { fontSize: 15, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAmount: { fontSize: 17, fontWeight: 'bold' },
  cardDate: { fontSize: 12 },
  cardMerchant: { fontSize: 12, color: '#888', marginTop: 2 },
  cardOwner: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, minHeight: 32, justifyContent: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', color: '#888', marginBottom: 4 },
});
