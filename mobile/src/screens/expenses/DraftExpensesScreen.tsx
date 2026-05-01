import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../services/api';

interface Expense {
  id: string;
  amount: number | string;
  description: string;
  date: string;
  merchantName: string;
  categoryId: string;
  status: 'draft' | 'confirmed';
}

export default function DraftExpensesScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const toast = useToast();
  const { isWeb, isNarrowScreen } = useResponsive();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const response = await api.get('/expenses');
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

  function handleEditExpense(expense: Expense) {
    navigation.navigate('ExpenseForm', { expense });
  }

  function handleCreateExpense() {
    navigation.navigate('ExpenseForm');
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

  function handleSignOut() {
    signOut();
    toast.info('Logged out');
  }

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.innerContainer, isWeb && { maxWidth: 600 }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>My Expenses</Text>
              <Text style={styles.headerSubtitle}>
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {user?.role === 'admin' && (
                <TouchableOpacity
                  style={[styles.adminButton, isNarrowScreen && styles.adminButtonNarrow]}
                  onPress={() => navigation.navigate('AdminDashboard')}
                >
                  <Text style={styles.adminButtonText}>Admin</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.navRow}>
            <TouchableOpacity style={[styles.navButton, styles.navButtonActive]}>
              <Text style={styles.navButtonTextActive}>Expenses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('BudgetDashboard')}>
              <Text style={styles.navButtonText}>Budgets</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Analytics')}>
              <Text style={styles.navButtonText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadExpenses} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleEditExpense(item)}
            >
              <Text style={styles.merchant}>{item.merchantName || 'Unknown Merchant'}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.footer}>
                <Text style={styles.amount}>${Number(item.amount).toFixed(2)}</Text>
                <View style={styles.footerRight}>
                  <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                  {item.status === 'draft' && (
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleConfirmExpense(item.id);
                      }}
                    >
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.addButton} onPress={handleCreateExpense}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  headerTop: {
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    gap: 8,
    alignItems: 'flex-end',
  },
  adminButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adminButtonNarrow: {
    paddingHorizontal: 10,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  navButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navButtonActive: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  navButtonTextActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    marginLeft: 'auto',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  merchant: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  confirmButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
});
