import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = '@KTS:token';
const MAX_RETRIES = 5;

if (__DEV__ !== true && API_BASE_URL.startsWith('http://')) {
  throw new Error('API_BASE_URL must use HTTPS in production');
}

let navigateToLogin: (() => void) | null = null;

export function setLoginRedirect(fn: () => void) {
  navigateToLogin = fn;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: AxiosError): boolean {
  if (!error.config) return false;
  if (error.config.method && !['get', 'GET'].includes(error.config.method)) return false;
  if (error.response) {
    const status = error.response.status;
    if (status === 401 || status === 403 || status === 404 || status === 409 || status === 422) return false;
    if (status >= 400 && status < 500) return false;
    return true;
  }
  return true;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const url = error.config?.url;
    if (error.response?.status === 401 && url !== '/auth/login' && url !== '/auth/register') {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        const SecureStore = require('expo-secure-store');
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
      if (navigateToLogin) navigateToLogin();
      return Promise.reject(error);
    }

    if (isRetryableError(error)) {
      const config = error.config as InternalAxiosRequestConfig & { __retryCount?: number };
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        const delay = Math.pow(2, config.__retryCount) * 1000;
        await sleep(delay);
        return api(config);
      }

      const exhaustedError = error as AxiosError & { __exhaustedRetries?: boolean };
      exhaustedError.__exhaustedRetries = true;
    }

    return Promise.reject(error);
  },
);

export default api;
