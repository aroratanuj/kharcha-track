import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import api from '../services/api';

export default function ConfigScreen() {
  const { user } = useAuth();
  const { colors, fontFamily } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState<'categories' | 'accounts'>('categories');

  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      {!isAdmin ? (
        <View style={s.restricted}>
          <View style={[s.restrictedIcon, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={s.restrictedEmoji}>🔒</Text>
          </View>
          <Text style={[s.restrictedTitle, { color: colors.text, fontFamily }]}>Admin Only</Text>
          <Text style={[s.restrictedSub, { color: colors.textMuted, fontFamily }]}>Configuration requires admin access</Text>
        </View>
      ) : (
        <>
          <View style={s.pillRow}>
            {(['categories', 'accounts'] as const).map(t => (
              <TouchableOpacity key={t} style={[s.pill, tab === t && { backgroundColor: colors.primary }]} onPress={() => setTab(t)}>
                <Text style={[s.pillText, { color: tab === t ? '#fff' : colors.textMuted, fontFamily }]}>
                  {t === 'categories' ? 'Categories' : 'Accounts'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {tab === 'categories' ? <CategoriesManager colors={colors} toast={toast} fontFamily={fontFamily} /> : <AccountsManager colors={colors} toast={toast} fontFamily={fontFamily} />}
        </>
      )}
    </View>
  );
}

function CategoriesManager({ colors, toast, fontFamily }: any) {
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
      <TouchableOpacity style={[s.addCard, { borderColor: colors.border }]} onPress={openCreate}>
        <View style={[s.addIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Text style={{ fontSize: 20, color: colors.primary }}>+</Text>
        </View>
        <View>
          <Text style={[s.addTitle, { color: colors.text, fontFamily }]}>Add Category</Text>
          <Text style={[s.addSub, { color: colors.textMuted, fontFamily }]}>Create a new expense category</Text>
        </View>
      </TouchableOpacity>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id || item._id?.toString()}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item, index }) => (
          <View style={[s.itemCard, index % 2 === 1 && { backgroundColor: colors.cardAlt }, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.itemBorder, { backgroundColor: item.color || '#007AFF' }]} />
             <View style={[s.itemIconWrap, { backgroundColor: colors.skeleton }]}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            </View>
            <View style={s.itemInfo}>
              <Text style={[s.itemName, { color: colors.text, fontFamily }]} numberOfLines={1}>{item.name}</Text>
              <View style={[s.colorDot, { backgroundColor: item.color || '#007AFF' }]} />
            </View>
            <View style={s.itemActions}>
              <TouchableOpacity style={s.actionWrap} onPress={() => openEdit(item)} accessibilityLabel="Edit category">
                <Text style={[s.actionText, { color: colors.primary, fontFamily }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionWrap} onPress={() => handleDelete(item.id || item._id?.toString())} accessibilityLabel="Delete category">
                <Text style={[s.actionText, { color: colors.danger, fontFamily }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={[s.emptyTitle, { color: colors.text, fontFamily }]}>No categories yet</Text>
              <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>Tap "Add Category" to create one</Text>
            </View>
          ) : null
        }
      />
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[s.modal, { backgroundColor: colors.surface }]}>
            <Text style={[s.modalTitle, { color: colors.text, fontFamily }]}>{editId ? 'Edit Category' : 'New Category'}</Text>
            <TextInput style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, fontFamily }]} value={name} onChangeText={setName} placeholder="Category name" placeholderTextColor={colors.textMuted} maxLength={50} />
            <TextInput style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, fontFamily }]} value={icon} onChangeText={setIcon} placeholder="Icon (e.g. 🍔)" placeholderTextColor={colors.textMuted} maxLength={10} />
            <View style={s.colorPreviewRow}>
              <TextInput style={[s.modalInput, s.colorInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, fontFamily }]} value={color} onChangeText={setColor} placeholder="#FF6B6B" placeholderTextColor={colors.textMuted} maxLength={7} />
              <View style={[s.colorPreview, { backgroundColor: color || '#007AFF' }]} />
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[s.modalBtnText, { color: colors.text, fontFamily }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={[s.modalBtnText, { fontFamily }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function AccountsManager({ colors, toast, fontFamily }: any) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/account-sources');
      setAccounts(res.data || []);
    } catch { toast.error('Failed to load accounts'); }
    finally { setLoading(false); }
  }

  function openAdd() { setEditId(null); setNewLabel(''); setNewIcon(''); setModalVisible(true); }

  function openEdit(item: any) {
    setEditId(item.id);
    setNewLabel(item.label || '');
    setNewIcon(item.icon || '');
    setModalVisible(true);
  }

  async function handleSave() {
    if (!newLabel.trim()) { toast.error('Label is required'); return; }
    try {
      if (editId) {
        await api.put(`/account-sources/${editId}`, { label: newLabel, icon: newIcon || '💳' });
        toast.success('Account type updated');
      } else {
        await api.post('/account-sources', { label: newLabel, icon: newIcon || '💳' });
        toast.success('Account type added');
      }
      setModalVisible(false);
      load();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save account';
      toast.error(msg);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await api.put(`/account-sources/${id}`, { isActive: !currentActive });
      toast.success(currentActive ? 'Account disabled' : 'Account enabled');
      load();
    } catch { toast.error('Failed to update'); }
  }

  function handleDelete(id: string, label: string) {
    Alert.alert('Delete Account', `Delete "${label}"? Existing expenses using this account won't be affected.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/account-sources/${id}`); toast.success('Deleted'); load(); }
        catch { toast.error('Failed to delete'); }
      }},
    ]);
  }

  return (
    <View style={s.section}>
      <Text style={[s.sectionNote, { color: colors.textMuted, fontFamily }]}>Account types shown when creating expenses. Active types are selectable.</Text>
      <TouchableOpacity style={[s.addCard, { borderColor: colors.border }]} onPress={openAdd}>
        <View style={[s.addIcon, { backgroundColor: `${colors.primary}15` }]}>
          <Text style={{ fontSize: 20, color: colors.primary }}>+</Text>
        </View>
        <View>
          <Text style={[s.addTitle, { color: colors.text, fontFamily }]}>Add Account Type</Text>
          <Text style={[s.addSub, { color: colors.textMuted, fontFamily }]}>Create a new payment source</Text>
        </View>
      </TouchableOpacity>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item, index }) => (
          <View style={[s.itemCard, !item.isActive && { opacity: 0.5 }, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.itemIconWrap, { backgroundColor: colors.skeleton }]}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            </View>
            <View style={s.itemInfo}>
              <Text style={[s.itemName, { color: colors.text, fontFamily }]} numberOfLines={1}>{item.label}</Text>
              {!item.isActive && (
                <View style={[s.inactiveBadge, { backgroundColor: `${colors.danger}15` }]}>
                  <Text style={[s.inactiveText, { color: colors.danger, fontFamily }]}>Inactive</Text>
                </View>
              )}
            </View>
            <View style={s.itemActions}>
              <TouchableOpacity style={s.actionWrap} onPress={() => openEdit(item)} accessibilityLabel="Edit account">
                <Text style={[s.actionText, { color: colors.primary, fontFamily }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionWrap} onPress={() => handleToggle(item.id, item.isActive)} accessibilityLabel={item.isActive ? 'Disable' : 'Enable'}>
                <Text style={[s.actionText, { color: item.isActive ? colors.warning : colors.primary, fontFamily }]}>{item.isActive ? 'Disable' : 'Enable'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionWrap} onPress={() => handleDelete(item.id, item.label)} accessibilityLabel="Delete">
                <Text style={[s.actionText, { color: colors.danger, fontFamily }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>💳</Text>
              <Text style={[s.emptyTitle, { color: colors.text, fontFamily }]}>No account types yet</Text>
              <Text style={[s.emptySub, { color: colors.textMuted, fontFamily }]}>Tap "Add Account Type" to create one</Text>
            </View>
          ) : null
        }
      />
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[s.modal, { backgroundColor: colors.surface }]}>
            <Text style={[s.modalTitle, { color: colors.text, fontFamily }]}>{editId ? 'Edit Account Type' : 'New Account Type'}</Text>
            <TextInput style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, fontFamily }]} value={newLabel} onChangeText={setNewLabel} placeholder="Label (e.g. UPI)" placeholderTextColor={colors.textMuted} maxLength={50} />
            <TextInput style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, fontFamily }]} value={newIcon} onChangeText={setNewIcon} placeholder="Icon (e.g. 📱)" placeholderTextColor={colors.textMuted} maxLength={10} />
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[s.modalBtnText, { color: colors.text, fontFamily }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={[s.modalBtnText, { fontFamily }]}>{editId ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1 },
  restricted: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  restrictedIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  restrictedEmoji: { fontSize: 28 },
  restrictedTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  restrictedSub: { fontSize: 14, textAlign: 'center' },
  pillRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  pill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  pillText: { fontSize: 14, fontWeight: '600' },
  section: { flex: 1, padding: 16 },
  sectionNote: { fontSize: 13, marginBottom: 12 },
  addCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', marginBottom: 12 },
  addIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addTitle: { fontSize: 15, fontWeight: '600' },
  addSub: { fontSize: 12, marginTop: 2 },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  itemBorder: { width: 4, height: 40, borderRadius: 2 },
  itemIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemActions: { flexDirection: 'row', gap: 4 },
  actionWrap: { paddingHorizontal: 10, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  actionText: { fontSize: 14, fontWeight: '600' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  inactiveBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  inactiveText: { fontSize: 11, fontWeight: '600' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '85%', maxWidth: 400, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12 },
  colorPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  colorInput: { flex: 1, marginBottom: 0 },
  colorPreview: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, minHeight: 48, justifyContent: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
