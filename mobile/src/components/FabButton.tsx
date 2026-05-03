import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function FabButton() {
  const navigation = useNavigation<any>();
  const { colors, fontFamily } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[
        s.fab,
        {
          backgroundColor: colors.coral,
          bottom: Platform.OS === 'ios' ? 80 + insets.bottom : 72,
        },
      ]}
      onPress={() => navigation.navigate('ExpenseForm')}
      activeOpacity={0.85}
    >
      <Text style={s.fabIcon}>+</Text>
      <Text style={[s.fabLabel, { fontFamily }]}>Add Expense</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#E85D3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { fontSize: 18, fontWeight: '700', color: '#fff', marginRight: 6 },
  fabLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
