import axios from 'axios';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = '@KTS:token';

if (__DEV__ !== true && API_BASE_URL.startsWith('http://')) {
  throw new Error('API_BASE_URL must use HTTPS in production');
}

let navigateToLogin: (() => void) | null = null;

export function setLoginRedirect(fn: () => void) {
  navigateToLogin = fn;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    let token: string | null = null;
    if (Platform.OS === 'web') {
      token = localStorage.getItem(TOKEN_KEY);
    } else {
      const SecureStore = require('expo-secure-store');
      token = await SecureStore.getItemAsync(TOKEN_KEY);
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const url = error.config?.url;
      if (error.response?.status === 401 && url !== '/auth/login' && url !== '/auth/register') {
        if (Platform.OS === 'web') {
          localStorage.removeItem(TOKEN_KEY);
        } else {
          const SecureStore = require('expo-secure-store');
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
        if (navigateToLogin) navigateToLogin();
      }
      return Promise.reject(error);
    },
  );

export default api;
