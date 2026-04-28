import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@kts-workspace/shared-types';
import { authService } from '@kts-workspace/shared-api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

// This is a simplified version - in a real app, you'd use React Context
// to manage auth state across the app
export function useAuth(): AuthContextValue {
  const queryClient = useQueryClient();

  // Get current user query
  const {
    data: user,
    isLoading: isUserLoading,
    refetch: refetchUser,
    remove: removeUserQuery,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: () => authService.getCurrentUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data: AuthResponse) => {
      // Store token (platform-specific - implement accordingly)
      // For mobile: AsyncStorage, for web: localStorage
      queryClient.setQueryData(['auth', 'user'], data.user);
      refetchUser();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data: AuthResponse) => {
      // Store token (platform-specific - implement accordingly)
      // For mobile: AsyncStorage, for web: localStorage
      queryClient.setQueryData(['auth', 'user'], data.user);
      refetchUser();
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear token (platform-specific - implement accordingly)
      // For mobile: AsyncStorage, for web: localStorage
      removeUserQuery();
      queryClient.clear();
    },
  });

  const login = async (request: LoginRequest) => {
    await loginMutation.mutateAsync(request);
  };

  const register = async (request: RegisterRequest) => {
    await registerMutation.mutateAsync(request);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return {
    user: user || null,
    isAuthenticated: !!user,
    isLoading: isUserLoading,
    login,
    register,
    logout,
    refetchUser: async () => {
      await refetchUser();
    },
  };
}