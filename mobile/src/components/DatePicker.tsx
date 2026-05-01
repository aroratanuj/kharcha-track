import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  error?: string;
  label?: string;
}

export default function DatePicker({ value, onChange, error, label }: DatePickerProps) {
  const parsed = parseDate(value);

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 20 }}>
        {label && <Text style={styles.label}>{label}</Text>}
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
            borderWidth: error ? 1 : 1,
            borderColor: error ? '#FF3B30' : '#e0e0e0',
            backgroundColor: '#fff',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 20 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.mobilePicker}>
        <View style={styles.mobileField}>
          <Text style={styles.mobileHint}>Day</Text>
          <TextInput
            style={[styles.mobileInput, error && styles.inputError]}
            value={parsed.day}
            onChangeText={(v) => setPart('day', v)}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="DD"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.mobileField}>
          <Text style={styles.mobileHint}>Month</Text>
          <TextInput
            style={[styles.mobileInput, error && styles.inputError]}
            value={parsed.month}
            onChangeText={(v) => setPart('month', v)}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="MM"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.mobileField}>
          <Text style={styles.mobileHint}>Year</Text>
          <TextInput
            style={[styles.mobileInput, error && styles.inputError]}
            value={parsed.year}
            onChangeText={(v) => setPart('year', v)}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="YYYY"
            placeholderTextColor="#999"
          />
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
  },
  inputError: {
    borderColor: '#FF3B30',
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
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
  mobileInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'center',
  },
});
