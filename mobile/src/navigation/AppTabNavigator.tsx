import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const Tab = createBottomTabNavigator();

import HomeScreen from '../screens/HomeScreen';
import DraftExpensesScreen from '../screens/expenses/DraftExpensesScreen';
import BudgetDashboardScreen from '../screens/budget/BudgetDashboardScreen';
import AnalyticsDashboardScreen from '../screens/analytics/AnalyticsDashboardScreen';
import ConfigScreen from '../screens/ConfigScreen';

function TabIcon({ name, focused, color, size }: { name: string; focused: boolean; color: string; size: number }) {
  const { fontFamily } = useTheme();
  const icons: Record<string, { active: string; inactive: string }> = {
    Home: { active: '🏠', inactive: '🏠' },
    Analytics: { active: '📊', inactive: '📊' },
    Budget: { active: '💰', inactive: '💰' },
    Drafts: { active: '📥', inactive: '📥' },
    Settings: { active: '⚙️', inactive: '⚙️' },
  };
  return (
    <View style={[styles.iconWrap, focused && { transform: [{ scale: 1.1 }] }]}>
      <Text style={{ fontSize: size * 0.7 }}>{icons[name]?.[focused ? 'active' : 'inactive'] || '•'}</Text>
    </View>
  );
}

function DraftTabIcon({ focused }: { focused: boolean }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    api.get('/expenses/summary').then(r => {
      if (r.data?.draftCount) setCount(r.data.draftCount);
    }).catch(() => {});
  }, [user]);

  return (
    <View style={styles.iconWrap}>
      <Text style={{ fontSize: 22 }}>📥</Text>
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function AppTabNavigator() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const insets = useSafeAreaInsets();
  const { fontFamily } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom - 4 : 8,
          height: Platform.OS === 'ios' ? 80 + insets.bottom : 64,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontFamily,
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Drafts') return <DraftTabIcon focused={focused} />;
          return <TabIcon name={route.name} focused={focused} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsDashboardScreen}
        options={{ tabBarLabel: 'Analytics' }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetDashboardScreen}
        options={{ tabBarLabel: 'Budget' }}
      />
      <Tab.Screen
        name="Drafts"
        component={DraftExpensesScreen}
        options={{ tabBarLabel: 'Drafts' }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Settings"
          component={ConfigScreen}
          options={{ tabBarLabel: 'Admin' }}
        />
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
