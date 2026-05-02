import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function FabButton() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[s.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
      onPress={() => navigation.navigate('ExpenseForm')}
      activeOpacity={0.8}
      accessibilityLabel="Add expense"
      accessibilityRole="button"
    >
      <Text style={s.fabText}>+</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
});
