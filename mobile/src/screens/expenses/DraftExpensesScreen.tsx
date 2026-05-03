import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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

interface UserItem { id: string; name: string; email: string; role: string; }

function confColor(conf?: string) {
  if (conf === 'high') return '#2ECC71';
  if (conf === 'medium') return '#F5A623';
  return '#FF3B30';
}

function confLabel(conf?: string) {
  if (conf === 'high') return 'H';
  if (conf === 'medium') return 'M';
  return 'L';
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
  const isAdmin = user?.role === 'admin';

  const [drafts, setDrafts] = useState<DraftExpense[]>([]);
  const [allDrafts, setAllDrafts] = useState<DraftExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (isAdmin) {
        res = await api.get('/expenses/all', { params: { status: 'draft' } });
      } else {
        res = await api.get('/expenses/drafts');
      }
      setAllDrafts(res.data || []);
      setDrafts(res.data || []);
    } catch (_e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/auth/users');
      if (res.data) setUsers(res.data);
    } catch { /* silent */ }
  }, [isAdmin]);

  useFocusEffect(() => { loadDrafts(); loadUsers(); });

  useEffect(() => {
    if (selectedUsers.size === 0) {
      setDrafts(allDrafts);
    } else {
      setDrafts(allDrafts.filter(d => {
        const uid = d.user?.id || (d as any).userId;
        return uid && selectedUsers.has(uid);
      }));
    }
  }, [selectedUsers, allDrafts]);

  const totalPending = useMemo(() => drafts.reduce((s, d) => s + d.amount, 0), [drafts]);
  const emailCount = useMemo(() => drafts.filter(d => d.metadata?.source === 'email').length, [drafts]);

  function toggleUser(uid: string) {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  function renderItem({ item }: { item: DraftExpense }) {
    const isEmail = item.metadata?.source === 'email';
    const confidence = item.metadata?.overallConfidence || item.metadata?.confidence || 'medium';
    const cc = confColor(confidence);
    const accIcon = item.accountSource?.includes('Credit') ? '💳' : item.accountSource?.includes('Cash') ? '💵' : '🏦';

    return (
      <TouchableOpacity
        style={[s.card, { backgroundColor: colors.card, borderColor: cc, borderLeftWidth: 3 }]}
        onPress={() => navigation.navigate('DraftReview', { draftId: item.id })}
        activeOpacity={0.85}
      >
        <View style={[s.cardIcon, { backgroundColor: `${item.category?.color || colors.primary}18` }]}>
          <Text style={{ fontSize: 18 }}>{item.category?.icon || '📥'}</Text>
        </View>
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={[s.cardDesc, { color: colors.text, fontFamily }]} numberOfLines={1}>{item.description || 'Untitled'}</Text>
          </View>
          <View style={s.cardBadges}>
            {isEmail && (
              <View style={[s.emailTag, { backgroundColor: `${colors.primary}18` }]}>
                <Text style={{ fontSize: 10 }}>✉️</Text>
                <Text style={[s.emailTagText, { color: colors.primary, fontFamily }]}>Email</Text>
              </View>
            )}
            <View style={[s.confPill, { backgroundColor: `${cc}18` }]}>
              <View style={[s.confDot, { backgroundColor: cc }]} />
              <Text style={[s.confText, { color: cc, fontFamily }]}>{confidence.charAt(0).toUpperCase()}{confidence.slice(1)}</Text>
            </View>
          </View>
          <View style={s.cardMeta}>
            {item.merchantName ? (
              <Text style={[s.cardMerchant, { color: colors.textMuted, fontFamily }]} numberOfLines={1}>{item.merchantName}</Text>
            ) : null}
            <Text style={[s.cardRight, { color: colors.textMuted, fontFamily }]}>{accIcon} {item.accountSource || 'N/A'} · {relativeTime(item.date)}</Text>
          </View>
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
        <View style={[s.heroSkeleton, { marginHorizontal: 16, marginTop: 16, height: 100, borderRadius: 20, backgroundColor: colors.skeleton }]} />
        {isAdmin && <View style={{ marginHorizontal: 16, marginTop: 8, height: 36, borderRadius: 18, backgroundColor: colors.skeleton }} />}
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
        {loading ? renderLoading() : (
          <>
            <View style={[s.hero, isDark ? s.heroDark : s.heroLight]}>
              <Text style={[s.heroEmoji]}>📥</Text>
              <View style={s.heroAmountRow}>
                <Text style={s.heroCurrency}>₹</Text>
                <Text style={s.heroAmount}>
                  {totalPending >= 100000
                    ? `${(totalPending / 100000).toFixed(1)}L`
                    : totalPending >= 1000
                      ? `${(totalPending / 1000).toFixed(1)}k`
                      : totalPending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
              </View>
              <Text style={[s.heroSub, { fontFamily }]}>
                {drafts.length} pending draft{drafts.length !== 1 ? 's' : ''} awaiting review
              </Text>
              {emailCount > 0 && (
                <View style={s.heroTrust}>
                  <Text style={{ fontSize: 11 }}>✉️</Text>
                  <Text style={[s.heroTrustText, { fontFamily }]}>{emailCount} parsed from email</Text>
                </View>
              )}
            </View>

            {isAdmin && users.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.pillRow}
              >
                <TouchableOpacity
                  style={[s.pill, selectedUsers.size === 0 && { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedUsers(new Set())}
                  activeOpacity={0.7}
                >
                  <Text style={[s.pillText, selectedUsers.size === 0 ? { color: '#fff' } : { color: colors.text }, { fontFamily }]}>All</Text>
                </TouchableOpacity>
                {users.map(u => {
                  const sel = selectedUsers.has(u.id);
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[s.pill, sel && { backgroundColor: colors.primary }]}
                      onPress={() => toggleUser(u.id)}
                      activeOpacity={0.7}
                    >
                      {!sel && (
                        <View style={[s.pillAvatar, { backgroundColor: `${colors.primary}20` }]}>
                          <Text style={[s.pillAvatarText, { color: colors.primary, fontFamily }]}>{u.name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={[s.pillText, sel ? { color: '#fff' } : { color: colors.text }, { fontFamily }]} numberOfLines={1}>{u.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text, fontFamily }]}>Pending Drafts</Text>
              {drafts.length > 0 && (
                <View style={[s.countBadge, { backgroundColor: `${colors.primary}18` }]}>
                  <Text style={[s.countText, { color: colors.primary, fontFamily }]}>{drafts.length}</Text>
                </View>
              )}
            </View>

            {drafts.length > 0 ? (
              drafts.map((item, index) => <View key={item.id}>{renderItem({ item, index })}</View>)
            ) : (
              <View style={s.empty}>
                <View style={s.emptyCard}>
                  <Text style={s.emptyIcon}>📥</Text>
                  <Text style={[s.emptyTitle, { color: colors.text, fontFamily }]}>No Pending Drafts</Text>
                  {selectedUsers.size > 0 ? (
                    <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>No drafts found for selected user(s).</Text>
                  ) : (
                    <>
                      <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>Forward expense emails to your</Text>
                      <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>Kharcha inbox. AI creates drafts automatically.</Text>
                    </>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    overflow: 'hidden',
  },
  heroDark: { backgroundColor: '#1A2744' },
  heroLight: { backgroundColor: '#6C4EF2' },
  heroEmoji: { fontSize: 28, marginBottom: 8 },
  heroAmountRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroCurrency: { fontSize: 22, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginRight: 2 },
  heroAmount: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  heroTrust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroTrustText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  heroSkeleton: { width: '100%' },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  pillAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillAvatarText: { fontSize: 10, fontWeight: '700' },
  pillText: { fontSize: 13, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  countText: { fontSize: 14, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
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
  cardTop: { marginBottom: 4 },
  cardDesc: { fontSize: 15, fontWeight: '600' },
  cardBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emailTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  emailTagText: { fontSize: 10, fontWeight: '600' },
  confPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  confDot: { width: 8, height: 8, borderRadius: 4 },
  confText: { fontSize: 10, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardMerchant: { fontSize: 12, flex: 1 },
  cardRight: { fontSize: 11 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  ownerAvatar: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  ownerAvatarText: { fontSize: 10, fontWeight: '700' },
  ownerName: { fontSize: 11 },
  cardAmountWrap: { marginLeft: 12, alignItems: 'flex-end' },
  cardAmount: { fontSize: 16, fontWeight: '700' },
  empty: { paddingVertical: 40, alignItems: 'center', paddingHorizontal: 16 },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(128,128,128,0.25)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
