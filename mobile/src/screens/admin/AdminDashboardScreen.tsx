import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { useResponsive } from '../../hooks/useResponsive';

interface Expense {
  id: string;
  amount: number | string;
  description: string;
  merchantName: string;
  date: string;
  status: 'draft' | 'confirmed';
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export default function AdminDashboardScreen() {
  const toast = useToast();
  const { isWeb, isNarrowScreen } = useResponsive();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const slideAnim = useState(new Animated.Value(-260))[0];

  const menuItems = [
    { key: 'all', icon: '📋', label: 'All Expenses' },
    { key: 'draft', icon: '⏳', label: 'Draft' },
    { key: 'confirmed', icon: '✅', label: 'Confirmed' },
    { key: 'users', icon: '👥', label: 'Users' },
  ];

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: menuOpen ? 0 : -260,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [menuOpen]);

  async function loadExpenses() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeTab !== 'all') params.status = activeTab;

      const response = await api.get('/expenses/all', { params });
      setExpenses(response.data);
    } catch (error: any) {
      if (error.message?.includes('Network')) {
        toast.error('Cannot connect to server');
      } else {
        toast.error('Failed to load expenses');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteExpense(id: string) {
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      await loadExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    }
  }

  async function handleConfirmExpense(id: string) {
    try {
      await api.post(`/expenses/${id}/confirm`);
      toast.success('Expense confirmed');
      await loadExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to confirm expense');
    }
  }

  function handleMenuSelect(key: string) {
    setActiveTab(key);
    setMenuOpen(false);
    if (key !== 'users') {
      loadExpenses();
    }
  }

  function toggleMenu() {
    setMenuOpen(!menuOpen);
  }

  const overlay = menuOpen ? (
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Admin Panel</Text>
        </View>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.menuItem, activeTab === item.key && styles.menuItemActive]}
            onPress={() => handleMenuSelect(item.key)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text
              style={[styles.menuLabel, activeTab === item.key && styles.menuLabelActive]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </TouchableOpacity>
  ) : null;

  return (
    <View style={[styles.container, isWeb && { alignItems: 'center' }]}>
      {overlay}

      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburger} onPress={toggleMenu}>
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {menuItems.find((i) => i.key === activeTab)?.icon} {menuItems.find((i) => i.key === activeTab)?.label}
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadExpenses}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'users' ? (
        <View style={styles.usersView}>
          <Text style={styles.usersTitle}>Users Management</Text>
          <Text style={styles.usersSubtext}>Coming soon</Text>
        </View>
      ) : (
        <FlatList
          style={{ width: '100%', maxWidth: isWeb ? 700 : '100%' }}
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadExpenses} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.userName}>{item.user?.name || 'Unknown'}</Text>
                  <Text style={styles.userEmail}>{item.user?.email || ''}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'draft' ? styles.statusDraft : styles.statusConfirmed]}>
                  {item.status}
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.merchant}>{item.merchantName || 'Unknown'}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.amount}>${Number(item.amount).toFixed(2)}</Text>
                <View style={styles.actions}>
                  {item.status === 'draft' && (
                    <TouchableOpacity style={styles.confirmAction} onPress={() => handleConfirmExpense(item.id)}>
                      <Text style={styles.confirmActionText}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.deleteAction} onPress={() => handleDeleteExpense(item.id)}>
                    <Text style={styles.deleteActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No expenses found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    paddingTop: Platform.OS === 'web' ? 20 : 50,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#007AFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemActive: {
    backgroundColor: '#E8F4FF',
    borderRightWidth: 3,
    borderRightColor: '#007AFF',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 28,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  hamburger: {
    padding: 8,
    marginRight: 12,
  },
  hamburgerIcon: {
    fontSize: 22,
    color: '#333',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  refreshBtn: {
    padding: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    fontSize: 18,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    paddingBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    textTransform: 'capitalize',
  },
  statusDraft: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
  },
  statusConfirmed: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#007AFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmAction: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteAction: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteActionText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  usersView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usersTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  usersSubtext: {
    fontSize: 14,
    color: '#999',
  },
});
