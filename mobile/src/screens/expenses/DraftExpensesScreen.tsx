import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, ScrollView, Modal } from 'react-native';
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

interface UserItem { id: string; name: string; email: string; role: string; }

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
  const { colors, fontFamily } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [drafts, setDrafts] = useState<DraftExpense[]>([]);
  const [allDrafts, setAllDrafts] = useState<DraftExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showUserPicker, setShowUserPicker] = useState(false);

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
    } catch {
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, [toast, isAdmin]);

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

  function toggleUser(uid: string) {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  function filterLabel(): string {
    if (selectedUsers.size === 0) return 'All Users';
    if (selectedUsers.size === 1) {
      const u = users.find(u => u.id === [...selectedUsers][0]);
      return u ? u.name : '1 user';
    }
    return `${selectedUsers.size} users`;
  }

  function renderItem({ item, index }: { item: DraftExpense; index: number }) {
    const isEmail = item.metadata?.source === 'email';
    const confidence = item.metadata?.overallConfidence || item.metadata?.confidence || 'medium';
    const cc = confColor(confidence);
    const accIcon = item.accountSource?.includes('Credit') ? '💳' : item.accountSource?.includes('Cash') ? '💵' : '🏦';
    const isAlt = index % 2 === 1;

    return (
      <TouchableOpacity
        style={[s.card, isAlt && { backgroundColor: colors.cardAlt }]}
        onPress={() => navigation.navigate('DraftReview', { draftId: item.id })}
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
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {drafts.length > 0 && !loading && (
              <View style={[s.countBadge, { backgroundColor: `${colors.primary}18` }]}>
                <Text style={[s.countText, { color: colors.primary, fontFamily }]}>{drafts.length}</Text>
              </View>
            )}
          </View>
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={[s.filterBar, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }]}
            onPress={() => setShowUserPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14 }}>👤</Text>
            <Text style={[s.filterLabel, { color: colors.text, fontFamily }]}>Filter: {filterLabel()}</Text>
            {selectedUsers.size > 0 && (
              <TouchableOpacity hitSlop={12} onPress={() => setSelectedUsers(new Set())}>
                <Text style={[s.clearBtn, { color: colors.primary, fontFamily }]}>Clear</Text>
              </TouchableOpacity>
            )}
            <Text style={[s.filterArrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          renderLoading()
        ) : drafts.length > 0 ? (
          drafts.map((item, index) => <View key={item.id}>{renderItem({ item, index })}</View>)
        ) : (
          <View style={s.empty}>
            <View style={s.emptyArt}>
              <Text style={s.emptyLine}>╭──────────────╮</Text>
              <Text style={s.emptyLine}>│    📥 ✉️     │</Text>
              <Text style={s.emptyLine}>╰──────────────╯</Text>
            </View>
            <Text style={[s.emptyTitle, { color: colors.text, fontFamily }]}>No Pending Drafts</Text>
            {selectedUsers.size > 0 ? (
              <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>No drafts found for selected user(s).</Text>
            ) : (
              <>
                <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>Forward expense emails to your Kharcha inbox.</Text>
                <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>AI will create draft expenses automatically.</Text>
              </>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showUserPicker} transparent animationType="fade" onRequestClose={() => setShowUserPicker(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowUserPicker(false)}>
          <View style={[s.modal, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text, fontFamily }]}>Filter by User</Text>
              <TouchableOpacity hitSlop={12} onPress={() => setShowUserPicker(false)}>
                <Text style={[s.modalClose, { color: colors.textMuted }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <Text style={[s.modalHint, { color: colors.textMuted, fontFamily }]}>Select one or more users to filter their drafts</Text>

            <ScrollView style={{ maxHeight: 320 }}>
              {users.map(u => {
                const selected = selectedUsers.has(u.id);
                return (
                  <TouchableOpacity key={u.id} style={[s.userRow, selected && { backgroundColor: `${colors.primary}10` }]} onPress={() => toggleUser(u.id)}>
                    <View style={[s.userCheck, { backgroundColor: selected ? colors.primary : `${colors.border}` }]}>
                      {selected && <Text style={s.checkMark}>✓</Text>}
                    </View>
                    <View style={s.userInfo}>
                      <Text style={[s.userName, { color: colors.text, fontFamily }]}>{u.name}</Text>
                      <Text style={[s.userEmail, { color: colors.textMuted, fontFamily }]}>{u.email}</Text>
                    </View>
                    <View style={[s.roleBadge, { backgroundColor: u.role === 'admin' ? `${colors.warning}15` : `${colors.primary}10` }]}>
                      <Text style={[s.roleText, { color: u.role === 'admin' ? colors.warning : colors.primary, fontFamily }]}>{u.role}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedUsers.size > 0 && (
              <TouchableOpacity style={[s.clearAllBtn, { backgroundColor: `${colors.danger}12` }]} onPress={() => setSelectedUsers(new Set())}>
                <Text style={[s.clearAllText, { color: colors.danger, fontFamily }]}>Clear Selection</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  countText: { fontSize: 14, fontWeight: '700' },
  filterBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  filterLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  filterArrow: { fontSize: 18, fontWeight: '700' },
  clearBtn: { fontSize: 13, fontWeight: '600' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '88%', maxWidth: 440, borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { fontSize: 15, fontWeight: '600' },
  modalHint: { fontSize: 13, marginBottom: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 10 },
  userCheck: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 13, color: '#fff', fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600' },
  userEmail: { fontSize: 12 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleText: { fontSize: 11, fontWeight: '600' },
  clearAllBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  clearAllText: { fontSize: 14, fontWeight: '600' },
});
