import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { setLoginRedirect } from '../services/api';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AppTabNavigator from './AppTabNavigator';
import ExpenseFormScreen from '../screens/expenses/ExpenseFormScreen';
import DraftReviewScreen from '../screens/expenses/DraftReviewScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading, signOut } = useAuth();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    setLoginRedirect(() => signOut());
  }, [signOut]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0F0F1A' : '#F5F5F7' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={AppTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} options={{ presentation: 'card', title: 'Add Expense' }} />
            <Stack.Screen name="DraftReview" component={DraftReviewScreen} options={{ presentation: 'card', title: 'Review Draft' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
