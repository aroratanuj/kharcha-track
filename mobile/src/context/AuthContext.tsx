import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      const token = await AsyncStorage.getItem('@KTS:token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        // Verify token and get user data
        const response = await api.get('/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to load stored data', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;

    await AsyncStorage.setItem('@KTS:token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(user);
  }

  async function signUp(email: string, password: string, name: string) {
    const response = await api.post('/auth/register', { email, password, name });
    const { user, token } = response.data;

    await AsyncStorage.setItem('@KTS:token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(user);
  }

  async function signOut() {
    await AsyncStorage.removeItem('@KTS:token');
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
