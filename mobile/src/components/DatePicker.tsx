import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  error?: string;
  label?: string;
}

export default function DatePicker({ value, onChange, error, label }: DatePickerProps) {
  const { colors } = useTheme();
  const parsed = parseDate(value);

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 20 }}>
        {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            height: 48,
            padding: '0 14px',
            fontSize: 16,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.inputBorder,
            backgroundColor: colors.inputBg,
            color: colors.text,
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box' as const,
          }}
        />
        {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 20 }}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View style={styles.mobilePicker}>
        <View style={styles.mobileField}>
          <Text style={[styles.mobileHint, { color: colors.textMuted }]}>Day</Text>
          <TextInput
            style={[styles.mobileInput, { backgroundColor: colors.inputBg, borderColor: error ? colors.danger : colors.inputBorder, color: colors.text }]}
            value={parsed.day}
            onChangeText={(v) => setPart('day', v)}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="DD"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.mobileField}>
          <Text style={[styles.mobileHint, { color: colors.textMuted }]}>Month</Text>
          <TextInput
            style={[styles.mobileInput, { backgroundColor: colors.inputBg, borderColor: error ? colors.danger : colors.inputBorder, color: colors.text }]}
            value={parsed.month}
            onChangeText={(v) => setPart('month', v)}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="MM"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.mobileField}>
          <Text style={[styles.mobileHint, { color: colors.textMuted }]}>Year</Text>
          <TextInput
            style={[styles.mobileInput, { backgroundColor: colors.inputBg, borderColor: error ? colors.danger : colors.inputBorder, color: colors.text }]}
            value={parsed.year}
            onChangeText={(v) => setPart('year', v)}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="YYYY"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
    </View>
  );

  function setPart(part: 'day' | 'month' | 'year', v: string) {
    const p = parseDate(value);
    p[part] = v;
    const newDate = `${p.year}-${p.month.padStart(2, '0')}-${p.day.padStart(2, '0')}`;
    onChange(newDate);
  }
}

function parseDate(value: string) {
  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
  }
  const now = new Date();
  return {
    year: now.getFullYear().toString(),
    month: (now.getMonth() + 1).toString().padStart(2, '0'),
    day: now.getDate().toString().padStart(2, '0'),
  };
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
  mobilePicker: {
    flexDirection: 'row',
    gap: 12,
  },
  mobileField: {
    flex: 1,
  },
  mobileHint: {
    fontSize: 11,
    marginBottom: 4,
    textAlign: 'center',
  },
  mobileInput: {
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    textAlign: 'center',
  },
});
