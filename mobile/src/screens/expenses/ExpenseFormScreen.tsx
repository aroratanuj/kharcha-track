import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../components/Toast';
import { useResponsive } from '../../hooks/useResponsive';
import DatePicker from '../../components/DatePicker';
import api from '../../services/api';
import { AccountSource } from '../../types/expense';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export default function ExpenseFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingExpense = route.params?.expense || null;
  const toast = useToast();
  const { isWeb, maxContentWidth, contentPadding } = useResponsive();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountSource, setAccountSource] = useState<AccountSource | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [screenLoading, setScreenLoading] = useState(true);
  const [categoryLoadError, setCategoryLoadError] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const [date, setDate] = useState(todayStr);

  const amountRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      await loadCategories();
      if (editingExpense) {
        try {
          setAmount(editingExpense.amount ? String(editingExpense.amount) : '');
          setDescription(editingExpense.description || '');
          if (editingExpense.categoryId) {
            setCategoryId(editingExpense.categoryId);
          }
          if (editingExpense.accountSource) {
            setAccountSource(editingExpense.accountSource);
          }
          if (editingExpense.notes) {
            setNotes(editingExpense.notes);
          }
          if (editingExpense.date) {
            const d = new Date(editingExpense.date);
            if (!isNaN(d.getTime())) {
              const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
              setDate(dateStr);
            }
          }
        } catch (e) {
          console.error('Error parsing expense:', e);
        }
      }
      setScreenLoading(false);
    })();
  }, []);

  async function loadCategories() {
    try {
      const response = await api.get('/categories');
      if (response.data && response.data.length > 0) {
        setCategories(response.data);
        setCategoryLoadError(false);
      } else {
        setCategoryLoadError(true);
        toast.error('No categories found. Please add categories first.');
      }
    } catch (error: any) {
      console.error('Failed to load categories', error);
      setCategoryLoadError(true);
      if (error.message?.includes('Network')) {
        toast.error('Cannot connect to server. Is the backend running?');
      } else {
        toast.error('Failed to load categories');
      }
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Enter a valid amount greater than 0';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!categoryId) {
      newErrors.category = 'Select a category to save';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    } else {
      const d = new Date(date);
      const y = d.getFullYear();
      if (y < 2000 || y > 2100) {
        newErrors.date = 'Year must be 2000-2100';
      }
    }

    if (!accountSource) {
      newErrors.accountSource = 'Select an account';
    }

    if (notes && notes.length > 250) {
      newErrors.notes = 'Notes must be 250 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);
    try {
      const expenseData = {
        amount: parseFloat(amount),
        description: description.trim(),
        categoryId,
        date: `${date}T00:00:00.000Z`,
        accountSource,
        notes: notes || undefined,
      };

      if (editingExpense && editingExpense.id) {
        await api.put(`/expenses/${editingExpense.id}`, expenseData);
        toast.success('Expense updated');
      } else {
        await api.post('/expenses', expenseData);
        toast.success('Expense created');
      }

      navigation.goBack();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (msg) {
        toast.error(msg);
      } else if (error.message?.includes('Network')) {
        toast.error('Cannot connect to server');
      } else {
        toast.error('Failed to save expense');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleDescSubmit() {
    amountRef.current?.focus();
  }

  function handleAmountSubmit() {
    if (validate()) handleSubmit();
  }

  if (screenLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#999', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  const gridStyle = {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between',
    gap: 8,
  };

  const gridItemStyle = {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    width: '30%',
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={isWeb ? styles.scrollContentWeb : styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      indicatorStyle="black"
    >
      <View style={[styles.form, { maxWidth: maxContentWidth, paddingHorizontal: contentPadding }]}>
        <DatePicker
          label="Date *"
          value={date}
          onChange={(val) => { setDate(val); setErrors({ ...errors, date: '' }); }}
          error={errors.date}
        />

        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            ref={descRef}
            style={[styles.input, errors.description && styles.inputError, styles.textArea]}
            value={description}
            onChangeText={(val) => { setDescription(val); setErrors({ ...errors, description: '' }); }}
            onSubmitEditing={handleDescSubmit}
            returnKeyType="next"
            placeholder="e.g., Lunch at cafe"
            placeholderTextColor="#999"
            multiline
            numberOfLines={2}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          {categoryLoadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>Categories failed to load</Text>
              <TouchableOpacity onPress={loadCategories} style={styles.errorBoxButton}>
                <Text style={styles.errorBoxButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : categories.length === 0 ? (
            <Text style={styles.emptyText}>No categories available</Text>
          ) : (
            <View style={gridStyle}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    gridItemStyle,
                    categoryId === cat.id && { borderColor: '#007AFF', backgroundColor: '#E8F4FF' },
                  ]}
                  onPress={() => { setCategoryId(cat.id); setErrors({ ...errors, category: '' }); }}
                >
                  <Text style={styles.gridIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.gridLabel,
                      categoryId === cat.id && { color: '#007AFF', fontWeight: '600' as const },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Account *</Text>
          <View style={gridStyle}>
            {[AccountSource.UPI, AccountSource.Card, AccountSource.BankAccount].map((source) => (
              <TouchableOpacity
                key={source}
                style={[
                  gridItemStyle,
                  accountSource === source && { borderColor: '#007AFF', backgroundColor: '#E8F4FF' },
                ]}
                onPress={() => { setAccountSource(source); setErrors({ ...errors, accountSource: '' }); }}
              >
                <Text style={styles.gridIcon}>
                  {source === AccountSource.UPI ? '📱' : source === AccountSource.Card ? '💳' : '🏦'}
                </Text>
                <Text
                  style={[
                    styles.gridLabel,
                    accountSource === source && { color: '#007AFF', fontWeight: '600' as const },
                  ]}
                >
                  {source}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.accountSource && <Text style={styles.errorText}>{errors.accountSource}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Amount *</Text>
          <TextInput
            ref={amountRef}
            style={[styles.input, errors.amount && styles.inputError]}
            value={amount}
            onChangeText={(val) => { setAmount(val); setErrors({ ...errors, amount: '' }); }}
            onSubmitEditing={handleAmountSubmit}
            returnKeyType="done"
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#999"
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        <View style={styles.field}>
          <View style={styles.notesHeader}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.notesCount}>{notes.length}/250</Text>
          </View>
          <TextInput
            style={[styles.input, errors.notes && styles.inputError, styles.notesArea]}
            value={notes}
            onChangeText={(val) => { setNotes(val.slice(0, 250)); setErrors({ ...errors, notes: '' }); }}
            placeholder="Optional notes (max 250 characters)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            maxLength={250}
          />
          {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Saving...' : editingExpense ? 'Update Expense' : 'Create Expense'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  scrollContentWeb: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  form: {
    padding: 16,
    width: '100%',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  notesArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesCount: {
    fontSize: 12,
    color: '#999',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD1D1',
  },
  errorBoxText: {
    color: '#CC0000',
    fontSize: 13,
    flex: 1,
  },
  errorBoxButton: {
    backgroundColor: '#CC0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  errorBoxButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    padding: 12,
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
