import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DraftExpensesScreen from '../screens/expenses/DraftExpensesScreen';
import BudgetDashboardScreen from '../screens/budget/BudgetDashboardScreen';
import AnalyticsDashboardScreen from '../screens/analytics/AnalyticsDashboardScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
          </>
        ) : (
          <>
            <Stack.Screen
              name="DraftExpenses"
              component={DraftExpensesScreen}
              options={{ title: 'Review Queue', headerLeft: null }}
            />
            <Stack.Screen
              name="BudgetDashboard"
              component={BudgetDashboardScreen}
              options={{ title: 'Budgets' }}
            />
            <Stack.Screen
              name="Analytics"
              component={AnalyticsDashboardScreen}
              options={{ title: 'Analytics' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
