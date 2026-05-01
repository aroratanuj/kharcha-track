import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { AccountSource } from '../types/expense';

export default function ConfigScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState<'categories' | 'accounts'>('categories');

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <View style={[s.screenBorder, { backgroundColor: colors.surface, borderColor: colors.screenBorder }]}>
        {!isAdmin ? (
          <View style={s.restricted}>
            <Text style={[s.restrictedIcon, { color: colors.textMuted }]}>🔒</Text>
            <Text style={[s.restrictedTitle, { color: colors.text }]}>Admin Only</Text>
            <Text style={[s.restrictedSub, { color: colors.textMuted }]}>Configuration requires admin access</Text>
          </View>
        ) : (
          <>
            <View style={[s.tabs, { borderBottomColor: colors.border }]}>
              <TouchableOpacity style={[s.tab, tab === 'categories' && { borderBottomColor: colors.primary }]} onPress={() => setTab('categories')}>
                <Text style={[s.tabText, { color: tab === 'categories' ? colors.primary : colors.textMuted }]}>Categories</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.tab, tab === 'accounts' && { borderBottomColor: colors.primary }]} onPress={() => setTab('accounts')}>
                <Text style={[s.tabText, { color: tab === 'accounts' ? colors.primary : colors.textMuted }]}>Accounts</Text>
              </TouchableOpacity>
            </View>
            {tab === 'categories' ? <CategoriesManager colors={colors} toast={toast} /> : <AccountsManager colors={colors} toast={toast} />}
          </>
        )}
      </View>
    </View>
  );
}

function CategoriesManager({ colors, toast }: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#007AFF');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditId(null); setName(''); setIcon(''); setColor('#007AFF');
    setModalVisible(true);
  }

  function openEdit(cat: any) {
    setEditId(cat.id || cat._id?.toString());
    setName(cat.name); setIcon(cat.icon || ''); setColor(cat.color || '#007AFF');
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Name is required'); return; }
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, { name, icon, color });
        toast.success('Category updated');
      } else {
        await api.post('/categories', { name, icon, color });
        toast.success('Category created');
      }
      setModalVisible(false);
      load();
    } catch { toast.error('Failed to save category'); }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Category', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/categories/${id}`); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
      }},
    ]);
  }

  return (
    <View style={s.section}>
      <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={openCreate}>
        <Text style={s.addBtnText}>+ Add Category</Text>
      </TouchableOpacity>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id || item._id?.toString()}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <View style={[s.configItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.configItemLeft}>
              <Text style={s.configItemIcon}>{item.icon}</Text>
              <View style={s.configItemInfo}>
                <Text style={[s.configItemName, { color: colors.text }]}>{item.name}</Text>
                <View style={[s.colorDot, { backgroundColor: item.color || '#007AFF' }]} />
              </View>
            </View>
            <View style={s.configItemActions}>
              <TouchableOpacity style={s.actionBtnWrap} onPress={() => openEdit(item)} accessibilityLabel="Edit category">
                <Text style={[s.actionBtn, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtnWrap} onPress={() => handleDelete(item.id || item._id?.toString())} accessibilityLabel="Delete category">
                <Text style={[s.actionBtn, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Text style={[s.emptyText, { color: colors.textMuted }]}>No categories yet</Text>
            </View>
          ) : null
        }
      />
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[s.modal, { backgroundColor: colors.surface, shadowColor: colors.shadowColor }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>{editId ? 'Edit Category' : 'New Category'}</Text>
            <TextInput style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={name} onChangeText={setName} placeholder="Category name" placeholderTextColor={colors.textMuted} />
            <TextInput style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={icon} onChangeText={setIcon} placeholder="Icon (e.g. 🍔)" placeholderTextColor={colors.textMuted} />
            <View style={s.colorPreviewRow}>
              <TextInput style={[s.modalInput, s.colorInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={color} onChangeText={setColor} placeholder="Color (e.g. #FF6B6B)" placeholderTextColor={colors.textMuted} />
              <View style={[s.colorPreview, { backgroundColor: color || '#007AFF' }]} />
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setModalVisible(false)}><Text style={[s.modalBtnText, { color: colors.text }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSave}><Text style={s.modalBtnText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const ACCOUNT_OPTIONS = [
  { value: 'UPI', icon: '📱' },
  { value: 'Card', icon: '💳' },
  { value: 'Bank Account', icon: '🏦' },
  { value: 'Cash', icon: '💵' },
];

function AccountsManager({ colors, toast }: any) {
  const [accounts, setAccounts] = useState(ACCOUNT_OPTIONS);
  const [modalVisible, setModalVisible] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newEnum, setNewEnum] = useState('');

  function openAdd() { setNewLabel(''); setNewIcon(''); setNewEnum(''); setModalVisible(true); }

  async function handleAdd() {
    if (!newLabel.trim() || !newEnum.trim()) { toast.error('Label and value required'); return; }
    if (accounts.find(a => a.value === newEnum)) { toast.error('Account type already exists'); return; }
    setAccounts([...accounts, { value: newEnum, icon: newIcon || '💳' }]);
    setModalVisible(false);
    toast.success('Account option added (backend sync pending)');
  }

  function handleDelete(val: string) {
    Alert.alert('Remove Account', 'Remove this account option?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setAccounts(accounts.filter(a => a.value !== val));
        toast.success('Removed (backend sync pending)');
      }},
    ]);
  }

  return (
    <View style={s.section}>
      <Text style={[s.sectionNote, { color: colors.textMuted }]}>Account options are used when creating expenses. Changes here are frontend-only for now.</Text>
      <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={openAdd}>
        <Text style={s.addBtnText}>+ Add Account Type</Text>
      </TouchableOpacity>
      <FlatList data={accounts} keyExtractor={(item) => item.value} renderItem={({ item }) => (
        <View style={[s.configItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.configItemLeft}>
            <Text style={s.configItemIcon}>{item.icon}</Text>
            <Text style={[s.configItemName, { color: colors.text }]}>{item.value}</Text>
          </View>
          <TouchableOpacity style={s.actionBtnWrap} onPress={() => handleDelete(item.value)} accessibilityLabel="Remove account">
            <Text style={[s.actionBtn, { color: colors.danger }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      )} />
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[s.modal, { backgroundColor: colors.surface, shadowColor: colors.shadowColor }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>New Account Type</Text>
            <TextInput style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={newLabel} onChangeText={setNewLabel} placeholder="Label (e.g. UPI)" placeholderTextColor={colors.textMuted} />
            <TextInput style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={newIcon} onChangeText={setNewIcon} placeholder="Icon (e.g. 📱)" placeholderTextColor={colors.textMuted} />
            <TextInput style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={newEnum} onChangeText={setNewEnum} placeholder="Enum value (e.g. Wallet)" placeholderTextColor={colors.textMuted} />
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setModalVisible(false)}><Text style={[s.modalBtnText, { color: colors.text }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}><Text style={s.modalBtnText}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', paddingTop: 4 },
  screenBorder: { flex: 1, width: '100%', maxWidth: 700, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  restricted: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  restrictedIcon: { fontSize: 48, marginBottom: 12 },
  restrictedTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  restrictedSub: { fontSize: 14, textAlign: 'center' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 15, fontWeight: '600' },
  section: { flex: 1, padding: 16 },
  sectionNote: { fontSize: 13, marginBottom: 12 },
  addBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16, minHeight: 48, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  configItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  configItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  configItemIcon: { fontSize: 22 },
  configItemInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  configItemName: { fontSize: 15, fontWeight: '600' },
  configItemActions: { flexDirection: 'row', gap: 8 },
  actionBtnWrap: { paddingHorizontal: 8, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  actionBtn: { fontSize: 14, fontWeight: '600' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginTop: 2 },
  colorPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  colorInput: { flex: 1, marginBottom: 0 },
  colorPreview: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '85%', maxWidth: 400, borderRadius: 16, padding: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, minHeight: 48, justifyContent: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
