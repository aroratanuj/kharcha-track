import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import FabButton from '../../components/FabButton';

export default function BudgetDashboardScreen() {
  const { colors } = useTheme();
  return (
    <View style={[s.outer, { backgroundColor: colors.bg }]}>
      <View style={[s.screenBorder, { backgroundColor: colors.surface, borderColor: colors.screenBorder }]}>
        <View style={s.content}>
          <Text style={s.emoji}>💰</Text>
          <Text style={[s.title, { color: colors.text }]}>Budgets</Text>
          <Text style={[s.subtitle, { color: colors.textMuted }]}>Track your spending by category</Text>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cardText, { color: colors.textMuted }]}>Budget tracking is in progress...</Text>
          </View>
        </View>
      </View>
      <FabButton />
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', paddingTop: 4 },
  screenBorder: { flex: 1, width: '100%', maxWidth: 700, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 30 },
  card: { padding: 30, borderRadius: 10, borderWidth: 1, width: '80%', alignItems: 'center' },
  cardText: { fontSize: 16, textAlign: 'center' },
});
