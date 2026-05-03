import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast';
import DatePicker from '../../components/DatePicker';
import api from '../../services/api';

interface Category { id: string; name: string; color: string; icon: string; }
interface UserOption { id: string; email: string; name: string; role: string; }
interface AccountSourceOpt { id: string; label: string; icon: string; }

export default function ExpenseFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingExpense = route.params?.expense || null;
  const { user } = useAuth();
  const { colors, fontFamily } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountSources, setAccountSources] = useState<AccountSourceOpt[]>([]);
  const [accountSource, setAccountSource] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [screenLoading, setScreenLoading] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  const [date, setDate] = useState(todayStr);

  const isFormValid = useMemo(() => {
    const userOk = !isAdmin || selectedUserId;
    return amount && parseFloat(amount) > 0 && description.trim() && categoryId && date && accountSource && userOk;
  }, [amount, description, categoryId, date, accountSource, isAdmin, selectedUserId]);

  const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId), [users, selectedUserId]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, userSearch]);

  useEffect(() => {
    (async () => {
      await loadCategories();
      await loadAccountSources();
      if (isAdmin) await loadUsers();
      if (editingExpense) {
        try {
          setAmount(editingExpense.amount ? String(editingExpense.amount) : '');
          setDescription(editingExpense.description || '');
          const catId = editingExpense.categoryId?._id || editingExpense.categoryId || editingExpense.category?.id || '';
          if (catId) setCategoryId(typeof catId === 'string' ? catId : catId.toString());
          if (editingExpense.accountSource) setAccountSource(editingExpense.accountSource);
          if (editingExpense.userId) setSelectedUserId(editingExpense.userId);
          if (editingExpense.date) {
            const d = new Date(editingExpense.date);
            if (!isNaN(d.getTime())) setDate(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`);
          }
        } catch { /* fallback */ }
      }
      setScreenLoading(false);
    })();
  }, []);

  async function loadCategories() {
    try {
      const res = await api.get('/categories');
      if (res.data?.length > 0) setCategories(res.data.map((c: any) => ({ ...c, id: c.id || c._id?.toString() || '' })));
    } catch { /* silent */ }
  }

  async function loadAccountSources() {
    try {
      const res = await api.get('/account-sources');
      if (res.data) setAccountSources(res.data);
    } catch { /* silent */ }
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
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > 999999999) e.amount = 'Enter a valid amount';
    if (!description.trim()) e.description = 'Description is required';
    if (description.length > 200) e.description = 'Max 200 characters';
    if (!categoryId) e.category = 'Select a category';
    if (!date) e.date = 'Date is required';
    if (!accountSource) e.accountSource = 'Select an account';
    if (isAdmin && !selectedUserId) e.user = 'Select a user';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const submittingRef = useRef(false);

  async function handleSubmit() {
    if (submittingRef.current) return;
    if (!validate()) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const userId = isAdmin ? selectedUserId : user?.id;
      if (!userId) { toast.error('No user selected'); setLoading(false); return; }
      const data: any = { amount: parseFloat(amount), description: description.trim(), categoryId, date: `${date}T00:00:00.000Z`, accountSource };
      const url = editingExpense?.id ? `/expenses/${editingExpense.id}` : '/expenses';
      const method = editingExpense?.id ? 'put' : 'post';
      await api[method](url, data);
      toast.success(editingExpense ? 'Expense updated' : 'Expense created');
      if (editingExpense) { navigation.navigate('Home'); }
      else { setAmount(''); setDescription(''); setCategoryId(''); setAccountSource(''); setDate(todayStr); setErrors({}); submittingRef.current = false; setLoading(false); return; }
    } catch { toast.error('Failed to save expense'); } finally { setLoading(false); submittingRef.current = false; }
  }

  if (screenLoading) {
    return (
      <View style={[s.outer, { backgroundColor: colors.bg }]}>
        <View style={{ padding: 40 }}>
          <View style={[s.skel, { backgroundColor: colors.skeleton }]} />
          <View style={[s.skel, { backgroundColor: colors.skeleton, width: '70%' }]} />
          <View style={[s.skel, { backgroundColor: colors.skeleton, width: '85%' }]} />
          <View style={[s.skel, { backgroundColor: colors.skeleton }]} />
          <View style={[s.skel, { backgroundColor: colors.skeleton, width: '60%' }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.form}>
          <Text style={[s.title, { color: colors.text, fontFamily }]}>{editingExpense ? 'Edit Expense' : 'New Expense'}</Text>

          {isAdmin && (
            <View style={s.field}>
              <Text style={[s.label, { color: colors.text, fontFamily }]}>Create For *</Text>
              <TouchableOpacity
                style={[s.input, s.dropdownTrigger, { backgroundColor: colors.inputBg, borderColor: selectedUserId ? colors.primary : colors.inputBorder }]}
                onPress={() => setDropdownVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={[s.inputText, { color: selectedUserId ? colors.text : colors.textMuted, fontFamily }]}>
                  {selectedUser ? selectedUser.name : 'Select a user'}
                </Text>
                <Text style={s.arrow}>▾</Text>
              </TouchableOpacity>
              {errors.user && <Text style={s.err}>{errors.user}</Text>}
            </View>
          )}

          <View style={s.field}>
            <Text style={[s.label, { color: colors.text, fontFamily }]}>Date *</Text>
            <DatePicker label="" value={date} onChange={(val) => { setDate(val); setErrors({ ...errors, date: '' }); }} error="" />
            {errors.date && <Text style={s.err}>{errors.date}</Text>}
          </View>

          <View style={s.field}>
            <Text style={[s.label, { color: colors.text, fontFamily }]}>Amount *</Text>
            <View style={s.amountWrap}>
              <Text style={[s.amountPrefix, { color: colors.textMuted, fontFamily }]}>₹</Text>
              <TextInput
                style={[s.amountInput, { backgroundColor: colors.inputBg, borderColor: errors.amount ? colors.danger : colors.inputBorder, color: colors.text, fontFamily }]}
                value={amount}
                onChangeText={(v) => { setAmount(v); setErrors({ ...errors, amount: '' }); }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
                maxLength={12}
              />
            </View>
            {errors.amount && <Text style={s.err}>{errors.amount}</Text>}
          </View>

          <View style={s.field}>
            <Text style={[s.label, { color: colors.text, fontFamily }]}>Description *</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.inputBg, borderColor: errors.description ? colors.danger : colors.inputBorder, color: colors.text, fontFamily }]}
              value={description}
              onChangeText={(v) => { setDescription(v); setErrors({ ...errors, description: '' }); }}
              placeholder="What was this expense for?"
              placeholderTextColor={colors.textMuted}
              maxLength={200}
            />
            {errors.description && <Text style={s.err}>{errors.description}</Text>}
          </View>

          <View style={s.field}>
            <Text style={[s.label, { color: colors.text, fontFamily }]}>Category *</Text>
            <View style={s.chipRow}>
              {categories.map(cat => {
                const sel = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.chip, { borderColor: sel ? colors.primary : colors.inputBorder, backgroundColor: sel ? `${colors.primary}15` : colors.inputBg }]}
                    onPress={() => { setCategoryId(cat.id); setErrors({ ...errors, category: '' }); }}
                  >
                    <Text style={s.chipIcon}>{cat.icon}</Text>
                    <Text style={[s.chipLabel, { color: sel ? colors.primary : colors.textSecondary, fontFamily }]} numberOfLines={1}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.category && <Text style={s.err}>{errors.category}</Text>}
          </View>

          <View style={s.field}>
            <Text style={[s.label, { color: colors.text, fontFamily }]}>Account *</Text>
            <View style={s.chipRow}>
              {accountSources.map(acc => {
                const sel = accountSource === acc.label;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[s.chip, { borderColor: sel ? colors.primary : colors.inputBorder, backgroundColor: sel ? `${colors.primary}15` : colors.inputBg }]}
                    onPress={() => { setAccountSource(acc.label); setErrors({ ...errors, accountSource: '' }); }}
                  >
                    <Text style={s.chipIcon}>{acc.icon}</Text>
                    <Text style={[s.chipLabel, { color: sel ? colors.primary : colors.textSecondary, fontFamily }]} numberOfLines={1}>{acc.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.accountSource && <Text style={s.err}>{errors.accountSource}</Text>}
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity style={[s.cancelBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('Home')}>
              <Text style={[s.cancelBtnText, { color: colors.text, fontFamily }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: isFormValid ? colors.primary : colors.border }]}
              onPress={handleSubmit}
              disabled={!isFormValid || loading}
            >
              <Text style={[s.submitBtnText, { color: isFormValid ? '#fff' : colors.textMuted, fontFamily }]}>
                {loading ? 'Saving...' : editingExpense ? 'Update' : 'Create Expense'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={dropdownVisible} transparent animationType="fade" onRequestClose={() => setDropdownVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
          <View style={[s.modal, { backgroundColor: colors.surface, shadowColor: colors.shadowColor }]}>
            <Text style={[s.modalTitle, { color: colors.text, fontFamily }]}>Select User</Text>
            <View style={[s.searchWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={[s.searchInput, { color: colors.text, fontFamily }]}
                placeholder="Search by name or email..."
                placeholderTextColor={colors.textMuted}
                value={userSearch}
                onChangeText={setUserSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              style={s.userList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const sel = selectedUserId === item.id;
                return (
                  <TouchableOpacity
                    style={[s.userItem, { backgroundColor: sel ? `${colors.primary}15` : colors.card }]}
                    onPress={() => { setSelectedUserId(item.id); setDropdownVisible(false); setUserSearch(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.userName, { color: sel ? colors.primary : colors.text, fontFamily }]}>{item.name}</Text>
                    <Text style={[s.userEmail, { color: colors.textMuted, fontFamily }]}>{item.email}</Text>
                    {item.role === 'admin' && (
                      <View style={[s.adminBadge, { backgroundColor: `${colors.warning}20` }]}>
                        <Text style={[s.adminBadgeText, { fontFamily }]}>Admin</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<View style={s.emptyList}><Text style={[s.emptyListText, { color: colors.textMuted, fontFamily }]}>No users found</Text></View>}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  form: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1 },
  inputText: { fontSize: 16, flex: 1 },
  amountWrap: { flexDirection: 'row', alignItems: 'center' },
  amountPrefix: { fontSize: 22, fontWeight: '600', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '700', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  err: { fontSize: 12, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrow: { fontSize: 16, color: '#999' },
  submitBtn: { borderRadius: 14, padding: 16, alignItems: 'center', flex: 1, minHeight: 50 },
  submitBtnText: { fontSize: 16, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 32 },
  cancelBtn: { borderRadius: 14, padding: 16, alignItems: 'center', flex: 1, borderWidth: 1, minHeight: 50 },
  cancelBtnText: { fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '85%', maxWidth: 400, maxHeight: '70%', borderRadius: 16, padding: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  userList: { maxHeight: 300 },
  userItem: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(128,128,128,0.2)', marginBottom: 4, minHeight: 48 },
  userName: { fontSize: 15, fontWeight: '600' },
  userEmail: { fontSize: 12, marginTop: 2 },
  adminBadge: { position: 'absolute', right: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  adminBadgeText: { fontSize: 10, fontWeight: '700' },
  emptyList: { padding: 24, alignItems: 'center' },
  emptyListText: { fontSize: 14 },
  skel: { height: 16, borderRadius: 8, marginBottom: 12 },
});
