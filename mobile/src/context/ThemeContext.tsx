import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryLight: string;
  primaryText: string;
  danger: string;
  success: string;
  warning: string;
  inputBg: string;
  inputBorder: string;
  screenBorder: string;
  headerBg: string;
  filterBg: string;
  shadowColor: string;
  tabBg: string;
  tabActive: string;
  tabInactive: string;
  skeleton: string;
  skeletonShimmer: string;
  cardAlt: string;
  coral: string;
  drawerBg: string;
  drawerItem: string;
  drawerItemHover: string;
}

interface ThemeContextData {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  fontFamily: string;
}

const lightColors: ThemeColors = {
  bg: '#F5F5F7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F8F8FC',
  text: '#1C1C2E',
  textSecondary: '#6B6B80',
  textMuted: '#A0A0B8',
  border: '#E5E5EA',
  primary: '#6C4EF2',
  primaryLight: '#8B6FF7',
  primaryText: '#FFFFFF',
  danger: '#FF3B30',
  success: '#2ECC71',
  warning: '#F5A623',
  inputBg: '#F5F5F7',
  inputBorder: '#E5E5EA',
  screenBorder: '#E5E5EA',
  headerBg: '#FFFFFF',
  filterBg: '#F0F0F5',
  shadowColor: 'rgba(0,0,0,0.08)',
  tabBg: '#FFFFFF',
  tabActive: '#6C4EF2',
  tabInactive: '#A0A0B8',
  skeleton: '#E5E5EA',
  skeletonShimmer: '#F5F5F7',
  coral: '#E85D3A',
  drawerBg: '#FFFFFF',
  drawerItem: '#1C1C2E',
  drawerItemHover: '#F0F0F5',
};

const darkColors: ThemeColors = {
  bg: '#0F0F1A',
  surface: '#1C1C2E',
  card: '#242438',
  cardAlt: '#2A2A40',
  text: '#F5F5F7',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',
  border: '#2A2A3D',
  primary: '#6C4EF2',
  primaryLight: '#8B6FF7',
  primaryText: '#FFFFFF',
  danger: '#FF453A',
  success: '#30D158',
  warning: '#FF9F0A',
  inputBg: '#242438',
  inputBorder: '#2A2A3D',
  screenBorder: '#2A2A3D',
  headerBg: '#1C1C2E',
  filterBg: '#2A2A40',
  shadowColor: 'rgba(0,0,0,0.3)',
  tabBg: '#1C1C2E',
  tabActive: '#6C4EF2',
  tabInactive: '#6B6B80',
  skeleton: '#2A2A3D',
  skeletonShimmer: '#363650',
  coral: '#E85D3A',
  drawerBg: '#1C1C2E',
  drawerItem: '#E0E0E0',
  drawerItemHover: '#2A2A40',
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
    <ThemeContext.Provider value={{ mode, colors, isDark, toggleTheme, fontFamily: 'PlusJakartaSans' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
