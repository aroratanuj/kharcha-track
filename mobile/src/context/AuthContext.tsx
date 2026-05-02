import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const token = await SecureStore.getItemAsync('@KTS:token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        setUser(response.data);
      }
    } catch {
      await SecureStore.deleteItemAsync('@KTS:token');
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;

    await SecureStore.setItemAsync('@KTS:token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(user);
  }

  async function signUp(email: string, password: string, name: string) {
    const response = await api.post('/auth/register', { email, password, name });
    const { user, token } = response.data;

    await SecureStore.setItemAsync('@KTS:token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(user);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('@KTS:token');
    api.defaults.headers.common.Authorization = '';
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
