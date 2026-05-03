import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';
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

export default function DraftReviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialIndex = route.params?.index ?? 0;
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
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

  function confColor(conf?: string) {
    if (conf === 'high') return '#34C759';
    if (conf === 'medium') return '#FF9500';
    return '#FF3B30';
  }

  function goTo(dir: 1 | -1) {
    const next = currentIndex + dir;
    if (next >= 0 && next < drafts.length) {
      setCurrentIndex(next);
    }
  }

  async function handleSave() {
    if (!current) return;
    setSaving(true);
    try {
      const newAmount = parseFloat(amount) || current.amount;
      const newDesc = description.trim() || current.description;
      const newDate = date ? `${date}T00:00:00.000Z` : current.date;
      const newCatId = categoryId || null;
      const newAcc = accountSource || null;

      const hasChanges =
        newAmount !== current.amount ||
        newDesc !== current.description ||
        newDate !== current.date ||
        newCatId !== (current.categoryId?._id || current.categoryId || current.category?.id) ||
        newAcc !== current.accountSource;

      if (!hasChanges) {
        toast.info('No changes to save');
        setSaving(false);
        return;
      }

      const data: any = { amount: newAmount, description: newDesc, date: newDate };
      if (categoryId) data.categoryId = categoryId;
      if (accountSource) data.accountSource = accountSource;
      await api.put(`/expenses/${current.id}`, data);
      toast.success('Draft saved');
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === current.id
            ? { ...d, amount: newAmount, description: newDesc, accountSource: newAcc || d.accountSource }
            : d,
        ),
      );
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    if (!current) return;
    setConfirming(true);
    try {
      const newAmount = parseFloat(amount) || current.amount;
      const newDesc = description.trim() || current.description;
      const newDate = date ? `${date}T00:00:00.000Z` : current.date;
      const newCatId = categoryId || null;
      const newAcc = accountSource || null;

      const hasChanges =
        newAmount !== current.amount ||
        newDesc !== current.description ||
        newDate !== current.date ||
        newCatId !== (current.categoryId?._id || current.categoryId || current.category?.id) ||
        newAcc !== current.accountSource;

      if (hasChanges) {
        const data: any = { amount: newAmount, description: newDesc, date: newDate };
        if (categoryId) data.categoryId = categoryId;
        if (accountSource) data.accountSource = accountSource;
        await api.put(`/expenses/${current.id}`, data);
      }

      await api.post(`/expenses/${current.id}/confirm`);
      toast.success('Expense confirmed');

      if (drafts.length > 1) {
        setDrafts((prev) => prev.filter((d) => d.id !== current.id));
      } else {
        navigation.goBack();
        return;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm');
    } finally {
      setConfirming(false);
    }
  }

  async function handleDelete() {
    if (!current) return;
    Alert.alert('Delete Draft', 'Remove this draft expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/expenses/${current.id}`);
          toast.success('Draft deleted');
          if (drafts.length > 1) {
            setDrafts((prev) => prev.filter((d) => d.id !== current.id));
          } else {
            navigation.goBack();
          }
        } catch { toast.error('Failed to delete'); }
      }},
    ]);
  }

  if (loading) return <View style={[s.loading, { backgroundColor: colors.bg }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  if (drafts.length === 0) {
    return (
      <View style={[s.outer, { backgroundColor: colors.bg }]}>
        <View style={[s.screenBorder, { backgroundColor: colors.surface, borderColor: colors.screenBorder }]}>
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📥</Text>
            <Text style={[s.emptyTitle, { color: colors.text }]}>No Pending Drafts</Text>
            <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
              <Text style={[s.backBtnText, { color: colors.text }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <View style={[s.screenBorder, { backgroundColor: colors.surface, borderColor: colors.screenBorder }]}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
          <View style={s.header}>
            <Text style={[s.headerTitle, { color: colors.text }]}>
              Draft {currentIndex + 1} of {drafts.length}
            </Text>
            {current?.metadata?.parseMethod && (
              <View style={[s.methodBadge, { backgroundColor: isDark ? '#1a2a4a' : '#E8F4FF' }]}>
                <Text style={[s.methodText, { color: colors.primary }]}>{current.metadata.parseMethod}</Text>
              </View>
            )}
            {current?.metadata?.overallConfidence && (
              <View style={[s.confBadge, { backgroundColor: `${confColor(current.metadata.overallConfidence)}18` }]}>
                <Text style={[s.confText, { color: confColor(current.metadata.overallConfidence) }]}>
                  {current.metadata.overallConfidence}
                </Text>
              </View>
            )}
          </View>

          <View style={s.navDots}>
            {drafts.map((_, i) => (
              <View key={i} style={[s.dot, { backgroundColor: i === currentIndex ? colors.primary : colors.border }]} />
            ))}
          </View>

          <View style={s.fields}>
            <ConfidenceField label="Amount" conf={fieldConf?.amount} colors={colors} isDark={isDark}>
              <TextInput
                style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
                maxLength={12}
              />
            </ConfidenceField>

            <ConfidenceField label="Description" conf={fieldConf?.description} colors={colors} isDark={isDark}>
              <TextInput
                style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                placeholderTextColor={colors.textMuted}
                maxLength={200}
              />
            </ConfidenceField>

            <ConfidenceField label="Date" conf={fieldConf?.date} colors={colors} isDark={isDark}>
              <DatePicker label="" value={date} onChange={setDate} error="" />
            </ConfidenceField>

            <ConfidenceField label="Account" conf={fieldConf?.accountSource} colors={colors} isDark={isDark}>
              <View style={s.accountRow}>
                {['Credit Card', 'Bank Account', 'UPI', 'Cash'].map((acc) => {
                  const icons: Record<string, string> = { 'Credit Card': '💳', 'Bank Account': '🏦', 'UPI': '📲', 'Cash': '💵' };
                  const sel = accountSource === acc;
                  return (
                    <TouchableOpacity
                      key={acc}
                      style={[s.accChip, { borderColor: colors.border, backgroundColor: sel ? (isDark ? '#1a2a4a' : '#E8F4FF') : colors.inputBg }, sel && { borderColor: colors.primary }]}
                      onPress={() => setAccountSource(acc)}
                    >
                      <Text style={s.accIcon}>{icons[acc]}</Text>
                      <Text style={[s.accLabel, { color: sel ? colors.primary : colors.textSecondary }]} numberOfLines={1}>{acc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ConfidenceField>

            <ConfidenceField label="Category" conf={fieldConf?.category} colors={colors} isDark={isDark}>
              <View style={s.catGrid}>
                {categories.map((cat) => {
                  const sel = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.catChip, { borderColor: colors.border, backgroundColor: sel ? (isDark ? '#1a2a4a' : '#E8F4FF') : colors.inputBg }, sel && { borderColor: colors.primary }]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text style={s.catIcon}>{cat.icon}</Text>
                      <Text style={[s.catLabel, { color: sel ? colors.primary : colors.textSecondary }]} numberOfLines={1}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ConfidenceField>

            {current?.merchantName && (
              <View style={s.merchantRow}>
                <Text style={[s.merchantLabel, { color: colors.textMuted }]}>Merchant:</Text>
                <Text style={[s.merchantValue, { color: colors.text }]}>{current.merchantName}</Text>
                {fieldConf?.merchant && (
                  <View style={[s.miniBadge, { backgroundColor: `${confColor(fieldConf.merchant)}18` }]}>
                    <Text style={[s.miniText, { color: confColor(fieldConf.merchant) }]}>{fieldConf.merchant}</Text>
                  </View>
                )}
              </View>
            )}

            {isAdmin && current?.user && (
              <View style={s.ownerRow}>
                <Text style={[s.ownerLabel, { color: colors.textMuted }]}>👤 {current.user.name}</Text>
              </View>
            )}
          </View>

          <View style={[s.footer, { borderTopColor: colors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)' }]}>
            <View style={s.navDots}>
              {drafts.map((_, i) => (
                <View key={i} style={[s.dot, { backgroundColor: i === currentIndex ? colors.primary : colors.border }]} />
              ))}
            </View>

            <View style={s.footerRow}>
              <TouchableOpacity
                style={[s.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => goTo(-1)}
                disabled={currentIndex === 0}
              >
                <Text style={[s.navBtnText, { color: currentIndex === 0 ? colors.textMuted : colors.text }]}>← Prev</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.deleteBtn, { backgroundColor: isDark ? '#3a2020' : '#FFF0F0' }]}
                onPress={handleDelete}
              >
                <Text style={s.deleteBtnText}>🗑 Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => goTo(1)}
                disabled={currentIndex >= drafts.length - 1}
              >
                <Text style={[s.navBtnText, { color: currentIndex >= drafts.length - 1 ? colors.textMuted : colors.text }]}>Next →</Text>
              </TouchableOpacity>
            </View>

            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: isDark ? '#1a2a1a' : '#E8F5E9', opacity: saving ? 0.6 : 1 }]}
                onPress={handleSave}
                disabled={saving || confirming}
              >
                <Text style={s.saveBtnText}>{saving ? 'Saving...' : '💾 Save as Draft'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.confirmBtn, { backgroundColor: colors.primary, opacity: confirming ? 0.6 : 1 }]}
                onPress={handleConfirm}
                disabled={saving || confirming}
              >
                <Text style={s.confirmBtnText}>{confirming ? 'Confirming...' : '✓ Save & Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function ConfidenceField({ label, conf, colors, isDark, children }: {
  label: string;
  conf?: string;
  colors: any;
  isDark: boolean;
  children: React.ReactNode;
}) {
  const cc = conf === 'high' ? '#34C759' : conf === 'medium' ? '#FF9500' : '#FF3B30';
  return (
    <View style={cf.fieldWrap}>
      <View style={cf.fieldLabel}>
        <Text style={[cf.labelText, { color: colors.text }]}>{label}</Text>
        {conf && (
          <View style={[cf.badge, { backgroundColor: `${cc}18` }]}>
            <Text style={[cf.badgeText, { color: cc }]}>{conf}</Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

const cf = StyleSheet.create({
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  labelText: { fontSize: 14, fontWeight: '600' },
  badge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

const s = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', paddingTop: 4 },
  screenBorder: { flex: 1, width: '100%', maxWidth: 700, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, borderWidth: 1, minHeight: 44, justifyContent: 'center' },
  backBtnText: { fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 16, paddingBottom: 8, paddingHorizontal: 16 },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  methodText: { fontSize: 12, fontWeight: '700' },
  confBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  confText: { fontSize: 12, fontWeight: '700' },
  navDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  fields: { paddingHorizontal: 16 },
  footer: { borderTopWidth: 1, paddingTop: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 20 },
  navBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, minHeight: 44, justifyContent: 'center' },
  navBtnText: { fontSize: 15, fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: '#FF3B30' },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minHeight: 44, justifyContent: 'center', flex: 1, maxWidth: 200 },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#34C759', textAlign: 'center' },
  confirmBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minHeight: 44, justifyContent: 'center', flex: 1, maxWidth: 200 },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center' },
});
