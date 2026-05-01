import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Drawer = createDrawerNavigator();

import HomeScreen from '../screens/HomeScreen';
import ExpenseFormScreen from '../screens/expenses/ExpenseFormScreen';
import BudgetDashboardScreen from '../screens/budget/BudgetDashboardScreen';
import AnalyticsDashboardScreen from '../screens/analytics/AnalyticsDashboardScreen';
import ConfigScreen from '../screens/ConfigScreen';

function CustomDrawerContent(props: any) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <View style={[styles.drawer, { backgroundColor: colors.drawerBg }]}>
      <View style={[styles.profile, { borderBottomColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{user?.email || ''}</Text>
        {user?.role === 'admin' && (
          <View style={[styles.roleBadge, { backgroundColor: colors.warning }]}>
            <Text style={styles.roleBadgeText}>ADMIN</Text>
          </View>
        )}
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.footerItem, { borderBottomColor: colors.border }]} onPress={toggleTheme}>
          <Text style={styles.footerIcon}>{isDark ? '☀️' : '🌙'}</Text>
          <Text style={[styles.footerLabel, { color: colors.drawerItem }]}>{isDark ? 'Light Mode' : 'Dark Mode'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem} onPress={() => { signOut(); }}>
          <Text style={styles.footerIcon}>🚪</Text>
          <Text style={[styles.footerLabel, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AppDrawerNavigator() {
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveBackgroundColor: colors.primary,
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: colors.drawerItem,
        drawerStyle: { width: 280 },
        drawerType: 'front',
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        sceneContainerStyle: { backgroundColor: colors.bg },
        drawerItemStyle: { marginVertical: 2, marginHorizontal: 8, borderRadius: 8 },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ drawerLabel: '🏠  Home', title: 'Kharcha-Track' }}
      />
      <Drawer.Screen
        name="ExpenseForm"
        component={ExpenseFormScreen}
        options={{ drawerItemStyle: { display: 'none' }, title: 'Expense' }}
      />
      <Drawer.Screen
        name="BudgetDashboard"
        component={BudgetDashboardScreen}
        options={{ drawerLabel: '💰  Budgets', title: 'Budgets' }}
      />
      <Drawer.Screen
        name="Analytics"
        component={AnalyticsDashboardScreen}
        options={{ drawerLabel: '📊  Analytics', title: 'Analytics' }}
      />
      <Drawer.Screen
        name="Configuration"
        component={ConfigScreen}
        options={{ drawerLabel: '⚙️  Configuration', title: 'Configuration' }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
  },
  profile: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  footerIcon: {
    fontSize: 18,
    width: 28,
  },
  footerLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
});
