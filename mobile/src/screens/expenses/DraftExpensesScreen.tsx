import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
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

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadDrafts);
    return unsub;
  }, [navigation, loadDrafts]);

  function renderItem({ item, index }: { item: DraftExpense; index: number }) {
    const d = new Date(item.date);
    const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const isEmail = item.metadata?.source === 'email';
    const confidence = item.metadata?.confidence || 'medium';
    const confColor = confidence === 'high' ? '#34C759' : confidence === 'medium' ? '#FF9500' : '#FF3B30';

    return (
      <TouchableOpacity
        style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('DraftReview', { index })}
        activeOpacity={0.7}
      >
        <View style={s.cardTop}>
          <Text style={[s.cardDesc, { color: colors.text }]} numberOfLines={1}>{item.description}</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {isEmail && (
              <View style={[s.badge, { backgroundColor: isDark ? '#1a2a4a' : '#E8F4FF' }]}>
                <Text style={[s.badgeText, { color: colors.primary }]}>Email</Text>
              </View>
            )}
            <View style={[s.badge, { backgroundColor: isDark ? '#2a2a1a' : '#FFF8E1' }]}>
              <Text style={[s.badgeText, { color: confColor }]}>{confidence}</Text>
            </View>
          </View>
        </View>
        <View style={s.cardMeta}>
          <Text style={[s.cardAmount, { color: colors.primary }]}>₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          <Text style={[s.cardDate, { color: colors.textMuted }]}>{dateStr}</Text>
        </View>
        {item.merchantName ? <Text style={[s.cardMerchant, { color: colors.textMuted }]}>{item.merchantName}</Text> : null}
        {item.category ? <Text style={[s.cardCategory, { color: colors.textMuted }]}>{item.category.icon} {item.category.name}</Text> : null}
        {isAdmin && item.user && (
          <Text style={[s.cardOwner, { color: colors.textMuted }]}>👤 {item.user.name}</Text>
        )}
      </TouchableOpacity>
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
  card: { marginHorizontal: 12, marginVertical: 6, borderRadius: 12, borderWidth: 1, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cardDesc: { fontSize: 15, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAmount: { fontSize: 17, fontWeight: 'bold' },
  cardDate: { fontSize: 12 },
  cardMerchant: { fontSize: 13, color: '#888', marginTop: 4 },
  cardCategory: { fontSize: 13, marginTop: 2 },
  cardOwner: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', color: '#888', marginBottom: 4 },
});
