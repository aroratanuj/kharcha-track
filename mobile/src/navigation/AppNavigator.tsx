import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DraftExpensesScreen from '../screens/expenses/DraftExpensesScreen';
import ExpenseFormScreen from '../screens/expenses/ExpenseFormScreen';
import BudgetDashboardScreen from '../screens/budget/BudgetDashboardScreen';
import AnalyticsDashboardScreen from '../screens/analytics/AnalyticsDashboardScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
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
              name="ExpenseForm"
              component={ExpenseFormScreen}
              options={{ title: 'Add Expense' }}
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
            {user.role === 'admin' && (
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={{ title: 'Admin Dashboard' }}
              />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
