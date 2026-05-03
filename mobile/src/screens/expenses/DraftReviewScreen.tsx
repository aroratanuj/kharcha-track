import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';
import { Skeleton, SkeletonHero } from '../../components/SkeletonLoader';
import DatePicker from '../../components/DatePicker';
import api from '../../services/api';

interface Category { id: string; name: string; color: string; icon: string; }

interface DraftItem {
  id: string;
  amount: number;
  description: string;
  merchantName: string;
  date: string;
  category: { id: string; name: string; color: string; icon: string } | null;
  categoryId?: string;
  accountSource: string;
  status: string;
  user?: { id: string; name: string; email: string } | null;
  metadata?: {
    source?: string;
    parseMethod?: string;
    overallConfidence?: string;
    fieldConfidence?: {
      amount?: string;
      description?: string;
      merchant?: string;
      date?: string;
      accountSource?: string;
      category?: string;
    };
  };
}

const ACCOUNT_SOURCES = [
  { label: 'Credit Card', icon: '💳' },
  { label: 'Bank Account/UPI', icon: '🏦' },
  { label: 'Cash', icon: '💵' },
];

function confColor(conf?: string) {
  if (conf === 'high') return '#2ECC71';
  if (conf === 'medium') return '#F5A623';
  return '#FF3B30';
}

function ConfidenceField({ label, conf, colors, fontFamily, children }: {
  label: string;
  conf?: string;
  colors: any;
  fontFamily: string;
  children: React.ReactNode;
}) {
  const cc = confColor(conf);
  return (
    <View style={[cf.wrap, { borderLeftColor: cc, borderLeftWidth: conf ? 3 : 0 }]}>
      <View style={cf.labelRow}>
        <Text style={[cf.label, { color: colors.text, fontFamily }]}>{label}</Text>
        {conf && (
          <View style={[cf.badge, { backgroundColor: `${cc}20` }]}>
            <Text style={[cf.badgeText, { color: cc, fontFamily }]}>{conf}</Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

const cf = StyleSheet.create({
  wrap: { marginBottom: 20, paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

export default function DraftReviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialIndex = route.params?.index ?? 0;
  const { user } = useAuth();
  const { colors, isDark, fontFamily } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountSource, setAccountSource] = useState('');

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

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      if (res.data) setCategories(res.data.map((c: any) => ({ ...c, id: c.id || c._id?.toString() || '' })));
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadDrafts(); loadCategories(); }, [loadDrafts, loadCategories]);

  useEffect(() => {
    if (drafts.length === 0) return;
    const idx = Math.min(currentIndex, drafts.length - 1);
    const d = drafts[idx];
    if (!d) return;
    setAmount(d.amount ? String(d.amount) : '');
    setDescription(d.description || '');
    setAccountSource(d.accountSource || '');
    const catId = d.categoryId?._id || d.categoryId || d.category?.id || '';
    setCategoryId(typeof catId === 'string' ? catId : catId?.toString() || '');
    if (d.date) {
      const dt = new Date(d.date);
      if (!isNaN(dt.getTime())) setDate(`${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`);
    }
  }, [currentIndex, drafts]);

  const current = drafts[currentIndex] || null;
  const fieldConf = current?.metadata?.fieldConfidence;

  function goTo(dir: 1 | -1) {
    const next = currentIndex + dir;
    if (next >= 0 && next < drafts.length) setCurrentIndex(next);
  }

  async function handleSave() {
    if (!current) return;
    setSaving(true);
    try {
      const newAmount = parseFloat(amount) || current.amount;
      const newDesc = description.trim() || current.description;
      const newDate = date ? `${date}T00:00:00.000Z` : current.date;
      const hasChanges =
        newAmount !== current.amount ||
        newDesc !== current.description ||
        newDate !== current.date ||
        categoryId !== (current.categoryId?._id || current.categoryId || current.category?.id) ||
        accountSource !== current.accountSource;
      if (!hasChanges) { toast.info('No changes to save'); setSaving(false); return; }
      const data: any = { amount: newAmount, description: newDesc, date: newDate };
      if (categoryId) data.categoryId = categoryId;
      if (accountSource) data.accountSource = accountSource;
      await api.put(`/expenses/${current.id}`, data);
      toast.success('Draft saved');
      setDrafts(prev => prev.map(d => d.id === current.id ? { ...d, amount: newAmount, description: newDesc, accountSource: accountSource || d.accountSource } : d));
    } catch { toast.error('Failed to save draft'); } finally { setSaving(false); }
  }

  async function handleConfirm() {
    if (!current) return;
    setConfirming(true);
    try {
      const newAmount = parseFloat(amount) || current.amount;
      const newDesc = description.trim() || current.description;
      const newDate = date ? `${date}T00:00:00.000Z` : current.date;
      const hasChanges =
        newAmount !== current.amount ||
        newDesc !== current.description ||
        newDate !== current.date ||
        categoryId !== (current.categoryId?._id || current.categoryId || current.category?.id) ||
        accountSource !== current.accountSource;
      if (hasChanges) {
        const data: any = { amount: newAmount, description: newDesc, date: newDate };
        if (categoryId) data.categoryId = categoryId;
        if (accountSource) data.accountSource = accountSource;
        await api.put(`/expenses/${current.id}`, data);
      }
      await api.post(`/expenses/${current.id}/confirm`);
      toast.success('Expense confirmed');
      if (drafts.length > 1) {
        setDrafts(prev => prev.filter(d => d.id !== current.id));
      } else {
        navigation.goBack();
        return;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm');
    } finally { setConfirming(false); }
  }

  async function handleDelete() {
    if (!current) return;
    Alert.alert('Delete Draft', 'Remove this draft expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/expenses/${current.id}`);
          toast.success('Draft deleted');
          if (drafts.length > 1) setDrafts(prev => prev.filter(d => d.id !== current.id));
          else navigation.goBack();
        } catch { toast.error('Failed to delete'); }
      }},
    ]);
  }

  if (loading) {
    return (
      <View style={[s.outer, { backgroundColor: colors.bg }]}>
        <SkeletonHero />
        <View style={{ paddingHorizontal: 16, gap: 12, paddingVertical: 16 }}>
          <Skeleton width="60%" height={16} borderRadius={4} />
          <Skeleton width="100%" height={48} borderRadius={8} />
          <Skeleton width="100%" height={48} borderRadius={8} />
          <Skeleton width="40%" height={16} borderRadius={4} />
          <Skeleton width="100%" height={80} borderRadius={8} />
        </View>
      </View>
    );
  }

  if (drafts.length === 0) {
    return (
      <View style={[s.outer, { backgroundColor: colors.bg }]}>
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📥</Text>
          <Text style={[s.emptyTitle, { color: colors.text, fontFamily }]}>No Pending Drafts</Text>
          <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>All drafts have been reviewed.</Text>
          <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={[s.backBtnText, { fontFamily }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const oc = current?.metadata?.overallConfidence;

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[s.hero, isDark ? s.heroDark : s.heroLight]}>
          <Text style={[s.heroTitle, { fontFamily }]}>
            Draft {currentIndex + 1} of {drafts.length}
          </Text>
          <View style={s.heroBadges}>
            {current?.metadata?.parseMethod && (
              <View style={[s.pill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[s.pillText, { fontFamily }]}>{current.metadata.parseMethod}</Text>
              </View>
            )}
            {oc && (
              <View style={[s.pill, { backgroundColor: `${confColor(oc)}40` }]}>
                <Text style={[s.pillText, { color: '#fff', fontFamily }]}>{oc} confidence</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.dots}>
          {drafts.map((_, i) => (
            <View key={i} style={[s.dot, i === currentIndex ? [s.dotActive, { backgroundColor: colors.primary }] : { backgroundColor: colors.border }]} />
          ))}
        </View>

        <View style={s.fields}>
          <ConfidenceField label="Amount" conf={fieldConf?.amount} colors={colors} fontFamily={fontFamily}>
            <View style={s.amountRow}>
              <Text style={[s.amountPrefix, { color: colors.textMuted, fontFamily }]}>₹</Text>
              <TextInput
                style={[s.amountInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, fontFamily }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
                maxLength={12}
              />
            </View>
          </ConfidenceField>

          <ConfidenceField label="Description" conf={fieldConf?.description} colors={colors} fontFamily={fontFamily}>
            <TextInput
              style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, fontFamily }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What was this expense for?"
              placeholderTextColor={colors.textMuted}
              maxLength={200}
            />
          </ConfidenceField>

          <ConfidenceField label="Date" conf={fieldConf?.date} colors={colors} fontFamily={fontFamily}>
            <DatePicker label="" value={date} onChange={setDate} error="" />
          </ConfidenceField>

          <ConfidenceField label="Account" conf={fieldConf?.accountSource} colors={colors} fontFamily={fontFamily}>
            <View style={s.chipRow}>
              {ACCOUNT_SOURCES.map(src => {
                const sel = accountSource === src.label;
                return (
                  <TouchableOpacity
                    key={src.label}
                    style={[s.chip, { borderColor: sel ? colors.primary : colors.inputBorder, backgroundColor: sel ? `${colors.primary}15` : colors.inputBg }]}
                    onPress={() => setAccountSource(src.label)}
                  >
                    <Text style={s.chipIcon}>{src.icon}</Text>
                    <Text style={[s.chipLabel, { color: sel ? colors.primary : colors.textSecondary, fontFamily }]} numberOfLines={1}>{src.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ConfidenceField>

          <ConfidenceField label="Category" conf={fieldConf?.category} colors={colors} fontFamily={fontFamily}>
            <View style={s.catGrid}>
              {categories.map(cat => {
                const sel = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.catChip, { borderColor: sel ? colors.primary : colors.inputBorder, backgroundColor: sel ? `${colors.primary}15` : colors.inputBg }]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Text style={s.chipIcon}>{cat.icon}</Text>
                    <Text style={[s.chipLabel, { color: sel ? colors.primary : colors.textSecondary, fontFamily }]} numberOfLines={1}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ConfidenceField>

          {current?.merchantName && (
            <View style={s.infoRow}>
              <Text style={[s.infoLabel, { color: colors.textMuted, fontFamily }]}>Merchant</Text>
              <Text style={[s.infoValue, { color: colors.text, fontFamily }]}>{current.merchantName}</Text>
              {fieldConf?.merchant && (
                <View style={[s.miniBadge, { backgroundColor: `${confColor(fieldConf.merchant)}20` }]}>
                  <Text style={[s.miniText, { color: confColor(fieldConf.merchant), fontFamily }]}>{fieldConf.merchant}</Text>
                </View>
              )}
            </View>
          )}

          {isAdmin && current?.user && (
            <View style={s.infoRow}>
              <Text style={[s.infoLabel, { color: colors.textMuted, fontFamily }]}>👤 Owner</Text>
              <Text style={[s.infoValue, { color: colors.text, fontFamily }]}>{current.user.name}</Text>
            </View>
          )}

          {current?.metadata?.source === 'email' && (
            <View style={[s.emailRow, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }]}>
              <Text style={{ fontSize: 14 }}>✉️</Text>
              <Text style={[s.emailText, { color: colors.primary, fontFamily }]}>Parsed from email</Text>
            </View>
          )}

          <View style={{ height: 180 }} />
        </View>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={s.footerActions}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}40` }]}
            onPress={handleSave}
            disabled={saving || confirming}
          >
            <Text style={[s.actionBtnText, { color: colors.success, fontFamily }]}>
              {saving ? 'Saving...' : 'Save as Draft'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.primary, opacity: confirming ? 0.6 : 1 }]}
            onPress={handleConfirm}
            disabled={saving || confirming}
          >
            <Text style={[s.actionBtnTextSolid, { fontFamily }]}>
              {confirming ? 'Confirming...' : 'Save & Confirm'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={s.footerNav}>
          <TouchableOpacity style={[s.navBtn, { opacity: currentIndex === 0 ? 0.3 : 1 }]} onPress={() => goTo(-1)} disabled={currentIndex === 0}>
            <Text style={[s.navBtnText, { color: colors.text, fontFamily }]}>← Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.deleteBtn, { backgroundColor: `${colors.danger}15` }]} onPress={handleDelete}>
            <Text style={[s.deleteBtnText, { color: colors.danger, fontFamily }]}>🗑 Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.navBtn, { opacity: currentIndex >= drafts.length - 1 ? 0.3 : 1 }]} onPress={() => goTo(1)} disabled={currentIndex >= drafts.length - 1}>
            <Text style={[s.navBtnText, { color: colors.text, fontFamily }]}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  hero: { marginHorizontal: 16, marginTop: 12, padding: 20, borderRadius: 16 },
  heroDark: { backgroundColor: '#2A1F5E' },
  heroLight: { backgroundColor: '#6C4EF2' },
  heroTitle: { fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  heroBadges: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pillText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  fields: { paddingHorizontal: 16, paddingTop: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountPrefix: { fontSize: 22, fontWeight: '600', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '700', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  input: { fontSize: 15, fontWeight: '500', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, minWidth: 0 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: 'rgba(128,128,128,0.06)', borderRadius: 10, marginBottom: 12 },
  infoLabel: { fontSize: 13, fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '500', flex: 1 },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniText: { fontSize: 11, fontWeight: '700' },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  emailText: { fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 4 },
  backBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 16 },
  backBtnText: { fontSize: 16, fontWeight: '600', color: '#fff', textAlign: 'center' },
  footer: { borderTopWidth: 1, paddingTop: 12, paddingBottom: 8 },
  footerActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  actionBtnText: { fontSize: 15, fontWeight: '600' },
  actionBtnTextSolid: { fontSize: 15, fontWeight: '700', color: '#fff' },
  footerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 },
  navBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minHeight: 40, justifyContent: 'center' },
  navBtnText: { fontSize: 15, fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, minHeight: 40, justifyContent: 'center' },
  deleteBtnText: { fontSize: 14, fontWeight: '600' },
});
