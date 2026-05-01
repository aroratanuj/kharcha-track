import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  success: string;
  warning: string;
  inputBg: string;
  inputBorder: string;
  screenBorder: string;
  headerBg: string;
  drawerBg: string;
  drawerItem: string;
  drawerItemActive: string;
  filterBg: string;
  shadowColor: string;
}

interface ThemeContextData {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const lightColors: ThemeColors = {
  bg: '#F5F5F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#555555',
  textMuted: '#999999',
  border: '#E0E0E0',
  primary: '#007AFF',
  primaryText: '#FFFFFF',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  inputBg: '#FFFFFF',
  inputBorder: '#E0E0E0',
  screenBorder: '#D0D0D0',
  headerBg: '#FFFFFF',
  drawerBg: '#FFFFFF',
  drawerItem: '#333333',
  drawerItemActive: '#007AFF',
  filterBg: '#007AFF',
  shadowColor: '#000000',
};

const darkColors: ThemeColors = {
  bg: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#888888',
  border: '#3A3A3C',
  primary: '#0A84FF',
  primaryText: '#FFFFFF',
  danger: '#FF453A',
  success: '#30D158',
  warning: '#FF9F0A',
  inputBg: '#2C2C2E',
  inputBorder: '#3A3A3C',
  screenBorder: '#3A3A3C',
  headerBg: '#1E1E1E',
  drawerBg: '#1E1E1E',
  drawerItem: '#E0E0E0',
  drawerItemActive: '#0A84FF',
  filterBg: '#0A84FF',
  shadowColor: '#000000',
};

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem('@KTS:theme').then(stored => {
      if (stored === 'dark') setMode('dark');
    });
  }, []);

  const toggleTheme = async () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    await AsyncStorage.setItem('@KTS:theme', next);
  };

  const isDark = mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
