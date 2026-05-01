import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';
import { useResponsive } from '../../hooks/useResponsive';
import DatePicker from '../../components/DatePicker';
import api from '../../services/api';
import { AccountSource } from '../../types/expense';

if (Platform.OS === 'web') {
  const styleId = 'kharcha-global-style';
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `html,body,#root{height:100%}*{scrollbar-width:thin!important;scrollbar-color:#888 #f1f1f1!important}*::-webkit-scrollbar{width:8px!important}*::-webkit-scrollbar-track{background:#f1f1f1;border-radius:4px}*::-webkit-scrollbar-thumb{background:#888;border-radius:4px}*::-webkit-scrollbar-thumb:hover{background:#555}`;
    document.head.appendChild(s);
  }
}

interface Category { id: string; _id?: string; name: string; color: string; icon: string; }
interface UserOption { id: string; email: string; name: string; role: string; }

const ACCOUNTS = [
  { value: AccountSource.UPI, icon: '📱', label: 'UPI' },
  { value: AccountSource.Card, icon: '💳', label: 'Card' },
  { value: AccountSource.BankAccount, icon: '🏦', label: 'Bank' },
  { value: AccountSource.Cash, icon: '💵', label: 'Cash' },
];

export default function ExpenseFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingExpense = route.params?.expense || null;
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const toast = useToast();
  const { isWeb, maxContentWidth, contentPadding } = useResponsive();
  const isAdmin = user?.role === 'admin';

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountSource, setAccountSource] = useState<AccountSource | ''>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [screenLoading, setScreenLoading] = useState(true);
  const [categoryLoadError, setCategoryLoadError] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  const [date, setDate] = useState(todayStr);

  const isFormValid = useMemo(() => {
    return amount && parseFloat(amount) > 0 && description.trim() && categoryId && date && accountSource;
  }, [amount, description, categoryId, date, accountSource]);

  useEffect(() => {
    (async () => {
      await loadCategories();
      if (isAdmin) await loadUsers();
      if (editingExpense) {
        try {
          setAmount(editingExpense.amount ? String(editingExpense.amount) : '');
          setDescription(editingExpense.description || '');
          const catId = editingExpense.categoryId?._id || editingExpense.categoryId || '';
          if (catId) setCategoryId(typeof catId === 'string' ? catId : catId.toString());
          if (editingExpense.accountSource) setAccountSource(editingExpense.accountSource);
          if (editingExpense.userId) setSelectedUserId(editingExpense.userId);
          if (editingExpense.date) {
            const d = new Date(editingExpense.date);
            if (!isNaN(d.getTime())) setDate(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`);
          }
        } catch (e) { console.error('Error parsing expense:', e); }
      }
      setScreenLoading(false);
    })();
  }, []);

  async function loadCategories() {
    try {
      const res = await api.get('/categories');
      if (res.data?.length > 0) {
        setCategories(res.data.map((c: any) => ({ ...c, id: c.id || c._id?.toString() || '' })));
        setCategoryLoadError(false);
      } else { setCategoryLoadError(true); }
    } catch { setCategoryLoadError(true); }
  }

  async function loadUsers() {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
      if (!selectedUserId && res.data?.length > 0) setSelectedUserId(res.data[0].id);
    } catch { /* silent */ }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) e.amount = 'Enter a valid amount';
    if (!description.trim()) e.description = 'Description is required';
    if (!categoryId) e.category = 'Select a category';
    if (!date) e.date = 'Date is required';
    if (!accountSource) e.accountSource = 'Select an account';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const userId = isAdmin ? selectedUserId : user?.id;
      if (!userId) { toast.error('No user selected'); setLoading(false); return; }
      const data: any = {
        amount: parseFloat(amount),
        description: description.trim(),
        categoryId,
        date: `${date}T00:00:00.000Z`,
        accountSource,
      };
      const url = editingExpense?.id ? `/expenses/${editingExpense.id}` : '/expenses';
      const method = editingExpense?.id ? 'put' : 'post';
      await api[method](url, data);
      toast.success(editingExpense ? 'Expense updated' : 'Expense created');
      navigation.navigate('Home');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  }

  if (screenLoading) return <View style={[s.loading, { backgroundColor: colors.bg }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <View style={[s.screenBorder, { backgroundColor: colors.surface, borderColor: colors.screenBorder }]}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator indicatorStyle="black">
          <View style={[s.form, { maxWidth: isWeb ? 600 : undefined, paddingHorizontal: 16 }]}>
            <Text style={[s.title, { color: colors.text }]}>{editingExpense ? 'Edit Expense' : 'New Expense'}</Text>

            {isAdmin && (
              <View style={s.field}>
                <Text style={[s.label, { color: colors.text }]}>Create For (User) *</Text>
                {users.length === 0 ? <Text style={[s.empty, { color: colors.textMuted }]}>No users found</Text> : (
                  <View style={s.userList}>
                    {users.map(u => {
                      const sel = selectedUserId === u.id;
                      return (
                        <TouchableOpacity key={u.id} style={[s.userItem, { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? (isDark ? '#1a2a4a' : '#E8F4FF') : colors.inputBg }]} onPress={() => setSelectedUserId(u.id)}>
                          <Text style={[s.userName, { color: colors.text }]}>{u.name}</Text>
                          <Text style={[s.userEmail, { color: colors.textMuted }]}>{u.email}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            <DatePicker label="Date *" value={date} onChange={(val) => { setDate(val); setErrors({ ...errors, date: '' }); }} error={errors.date} />

            <View style={s.field}>
              <Text style={[s.label, { color: colors.text }]}>Amount *</Text>
              <TextInput style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }, errors.amount && s.inputErr]} value={amount} onChangeText={(v) => { setAmount(v); setErrors({ ...errors, amount: '' }); }} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} />
              {errors.amount && <Text style={s.err}>{errors.amount}</Text>}
            </View>

            <View style={s.field}>
              <Text style={[s.label, { color: colors.text }]}>Description *</Text>
              <TextInput style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }, errors.description && s.inputErr]} value={description} onChangeText={(v) => { setDescription(v); setErrors({ ...errors, description: '' }); }} placeholder="e.g., Lunch at cafe" placeholderTextColor={colors.textMuted} />
              {errors.description && <Text style={s.err}>{errors.description}</Text>}
            </View>

            <View style={s.field}>
              <Text style={[s.label, { color: colors.text }]}>Category *</Text>
              {categoryLoadError ? (
                <View style={[s.errBox, { backgroundColor: isDark ? '#3a2020' : '#FFF0F0', borderColor: isDark ? '#5a3030' : '#FFD1D1' }]}>
                  <Text style={s.errBoxText}>Failed to load</Text>
                  <TouchableOpacity onPress={loadCategories} style={s.errBoxBtn}><Text style={s.errBoxBtnText}>Retry</Text></TouchableOpacity>
                </View>
              ) : (
                <View style={s.grid}>
                  {categories.map((cat) => {
                    const sel = categoryId === (cat.id || cat._id?.toString());
                    return (
                      <TouchableOpacity key={cat.id || cat._id} style={[s.gridItem, { borderColor: colors.border, backgroundColor: colors.inputBg }, sel && { borderColor: colors.primary, backgroundColor: isDark ? '#1a2a4a' : '#E8F4FF' }]} onPress={() => { setCategoryId(cat.id || cat._id?.toString() || ''); setErrors({ ...errors, category: '' }); }}>
                        <Text style={s.gridIcon}>{cat.icon}</Text>
                        <Text style={[s.gridLabel, { color: colors.textSecondary }, sel && { color: colors.primary, fontWeight: '600' }]} numberOfLines={1}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {errors.category && <Text style={s.err}>{errors.category}</Text>}
            </View>

            <View style={s.field}>
              <Text style={[s.label, { color: colors.text }]}>Account *</Text>
              <View style={s.grid}>
                {ACCOUNTS.map((acc) => {
                  const sel = accountSource === acc.value;
                  return (
                    <TouchableOpacity key={acc.value} style={[s.gridItem, { borderColor: colors.border, backgroundColor: colors.inputBg }, sel && { borderColor: colors.primary, backgroundColor: isDark ? '#1a2a4a' : '#E8F4FF' }]} onPress={() => { setAccountSource(acc.value); setErrors({ ...errors, accountSource: '' }); }}>
                      <Text style={s.gridIcon}>{acc.icon}</Text>
                      <Text style={[s.gridLabel, { color: colors.textSecondary }, sel && { color: colors.primary, fontWeight: '600' }]}>{acc.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.accountSource && <Text style={s.err}>{errors.accountSource}</Text>}
            </View>

            <TouchableOpacity style={[s.submitBtn, { backgroundColor: isFormValid ? colors.primary : colors.border }, { marginTop: 8, marginBottom: 32 }]} onPress={handleSubmit} disabled={!isFormValid || loading}>
              <Text style={[s.submitBtnText, { color: isFormValid ? colors.primaryText : colors.textMuted }]}>{loading ? 'Saving...' : editingExpense ? 'Update Expense' : 'Create Expense'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', paddingTop: 4 },
  screenBorder: { flex: 1, width: '100%', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { padding: 16, width: '100%' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1 },
  inputErr: { borderColor: '#FF3B30' },
  err: { color: '#FF3B30', fontSize: 12, marginTop: 6 },
  empty: { fontSize: 14, padding: 12 },
  errBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, borderWidth: 1 },
  errBoxText: { fontSize: 13, flex: 1, color: '#FF3B30' },
  errBoxBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  errBoxBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  userList: { gap: 8 },
  userItem: { padding: 12, borderRadius: 10, borderWidth: 1 },
  userName: { fontSize: 15, fontWeight: '600' },
  userEmail: { fontSize: 12, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 2, width: '22%', minHeight: 60, justifyContent: 'center' },
  gridIcon: { fontSize: 20, marginBottom: 2 },
  gridLabel: { fontSize: 10, textAlign: 'center' },
  submitBtn: { borderRadius: 10, padding: 16, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '600' },
});
