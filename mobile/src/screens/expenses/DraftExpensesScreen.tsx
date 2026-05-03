import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';
import { SkeletonCard } from '../../components/SkeletonLoader';
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
    parseMethod?: string;
    overallConfidence?: string;
  };
}

function confColor(conf?: string) {
  if (conf === 'high') return '#2ECC71';
  if (conf === 'medium') return '#F5A623';
  return '#FF3B30';
}

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

export default function DraftExpensesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark, fontFamily } = useTheme();
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

  useFocusEffect(() => { loadDrafts(); });

  function renderItem({ item, index }: { item: DraftExpense; index: number }) {
    const isEmail = item.metadata?.source === 'email';
    const confidence = item.metadata?.overallConfidence || item.metadata?.confidence || 'medium';
    const cc = confColor(confidence);
    const accIcon = item.accountSource?.includes('Credit') ? '💳' : item.accountSource?.includes('Cash') ? '💵' : '🏦';
    const isAlt = index % 2 === 1;

    return (
      <TouchableOpacity
        style={[s.card, isAlt && { backgroundColor: colors.cardAlt }]}
        onPress={() => navigation.navigate('DraftReview', { index })}
        activeOpacity={0.7}
      >
        <View style={[s.cardIcon, { backgroundColor: `${item.category?.color || colors.primary}18` }]}>
          <Text style={{ fontSize: 18 }}>{item.category?.icon || '📥'}</Text>
        </View>
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={[s.cardDesc, { color: colors.text, fontFamily }]} numberOfLines={1}>{item.description || 'Untitled'}</Text>
            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
              {isEmail && (
                <View style={[s.pill, { backgroundColor: `${colors.primary}18` }]}>
                  <Text style={{ fontSize: 10, marginRight: 3 }}>✉️</Text>
                  <Text style={[s.pillText, { color: colors.primary, fontFamily }]}>Email</Text>
                </View>
              )}
              <View style={[s.confDot, { backgroundColor: cc }]}>
                <Text style={[s.confDotText, { color: '#fff', fontFamily }]}>{confidence.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
          </View>
          {item.merchantName ? (
            <Text style={[s.cardMerchant, { color: colors.textSecondary, fontFamily }]} numberOfLines={1}>{item.merchantName}</Text>
          ) : null}
          <View style={s.cardMeta}>
            <Text style={[s.cardAcc, { color: colors.textMuted, fontFamily }]}>{accIcon} {item.accountSource || 'N/A'}</Text>
            <Text style={[s.cardTime, { color: colors.textMuted, fontFamily }]}>{relativeTime(item.date)}</Text>
          </View>
          {item.category && (
            <View style={[s.catPill, { backgroundColor: `${item.category.color}18`, borderColor: `${item.category.color}40` }]}>
              <Text style={{ fontSize: 12 }}>{item.category.icon}</Text>
              <Text style={[s.catPillText, { color: item.category.color, fontFamily }]}>{item.category.name}</Text>
            </View>
          )}
          {isAdmin && item.user && (
            <View style={s.ownerRow}>
              <View style={[s.ownerAvatar, { backgroundColor: `${colors.primary}20` }]}>
                <Text style={[s.ownerAvatarText, { color: colors.primary, fontFamily }]}>{item.user.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[s.ownerName, { color: colors.textMuted, fontFamily }]}>{item.user.name}</Text>
            </View>
          )}
        </View>
        <View style={s.cardAmountWrap}>
          <Text style={[s.cardAmount, { color: colors.text, fontFamily }]}>
            ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderLoading() {
    return (
      <View>
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </View>
    );
  }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDrafts} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: colors.text, fontFamily }]}>Drafts</Text>
          {drafts.length > 0 && !loading && (
            <View style={[s.countBadge, { backgroundColor: `${colors.primary}18` }]}>
              <Text style={[s.countText, { color: colors.primary, fontFamily }]}>{drafts.length}</Text>
            </View>
          )}
        </View>

        {isAdmin && (
          <View style={[s.adminBar, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }]}>
            <Text style={{ fontSize: 12 }}>👁️</Text>
            <Text style={[s.adminText, { color: colors.primary, fontFamily }]}>Viewing all users' drafts</Text>
          </View>
        )}

        {loading ? (
          renderLoading()
        ) : drafts.length > 0 ? (
          drafts.map((item, index) => renderItem({ item, index }))
        ) : (
          <View style={s.empty}>
            <View style={s.emptyArt}>
              <Text style={s.emptyLine}>╭──────────────╮</Text>
              <Text style={s.emptyLine}>│    📥 ✉️     │</Text>
              <Text style={s.emptyLine}>╰──────────────╯</Text>
            </View>
            <Text style={[s.emptyTitle, { color: colors.text, fontFamily }]}>No Pending Drafts</Text>
            <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>Forward expense emails to your Kharcha inbox.</Text>
            <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>AI will create draft expenses automatically.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  countText: { fontSize: 14, fontWeight: '700' },
  adminBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  adminText: { fontSize: 13, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1, flexShrink: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardDesc: { fontSize: 15, fontWeight: '600', flex: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 10, fontWeight: '600' },
  confDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confDotText: { fontSize: 11, fontWeight: '700' },
  cardMerchant: { fontSize: 13, marginTop: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  cardAcc: { fontSize: 11 },
  cardTime: { fontSize: 11 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 6,
  },
  catPillText: { fontSize: 11, fontWeight: '600' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ownerAvatar: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ownerAvatarText: { fontSize: 11, fontWeight: '700' },
  ownerName: { fontSize: 12 },
  cardAmountWrap: { marginLeft: 12, alignItems: 'flex-end' },
  cardAmount: { fontSize: 16, fontWeight: '700' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyArt: { marginBottom: 16 },
  emptyLine: { fontSize: 13, color: '#ccc', textAlign: 'center', lineHeight: 22, fontFamily: 'monospace' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 4 },
});
