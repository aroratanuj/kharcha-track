// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  TOKEN: '@KTS:token',
  USER: '@KTS:user',
  THEME: '@KTS:theme',
  LANGUAGE: '@KTS:language',
} as const;

// ============================================
// API Configuration
// ============================================

export const API_CONFIG = {
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// ============================================
// Query Keys for React Query
// ============================================

export const QUERY_KEYS = {
  AUTH: 'auth',
  USER: 'user',
  EXPENSES: 'expenses',
  BUDGETS: 'budgets',
  ANALYTICS: 'analytics',
} as const;

// ============================================
// Budget Periods
// ============================================

export const BUDGET_PERIODS = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export const BUDGET_PERIOD_LABELS = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
} as const;

// ============================================
// Expense Status
// ============================================

export const EXPENSE_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
} as const;

export const EXPENSE_STATUS_LABELS = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
} as const;

export const EXPENSE_STATUS_COLORS = {
  draft: '#FFA500', // Orange
  confirmed: '#4CAF50', // Green
  rejected: '#F44336', // Red
} as const;

// ============================================
// Currency
// ============================================

export const CURRENCY = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
} as const;

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
} as const;

// ============================================
// Validation Rules
// ============================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 255,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
} as const;

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You need to login to access this resource.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// ============================================
// Success Messages
// ============================================

export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  REGISTER: 'Registration successful!',
  LOGOUT: 'Logout successful!',
  EXPENSE_CREATED: 'Expense created successfully!',
  EXPENSE_UPDATED: 'Expense updated successfully!',
  EXPENSE_DELETED: 'Expense deleted successfully!',
  BUDGET_CREATED: 'Budget created successfully!',
  BUDGET_UPDATED: 'Budget updated successfully!',
  BUDGET_DELETED: 'Budget deleted successfully!',
} as const;

// ============================================
// Pagination
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================
// App Configuration
// ============================================

export const APP_CONFIG = {
  NAME: 'KTS - Expense Tracker',
  VERSION: '1.0.0',
  DESCRIPTION: 'Track and manage your expenses efficiently',
} as const;

// ============================================
// Theme Colors
// ============================================

export const THEME_COLORS = {
  PRIMARY: '#007AFF',
  SECONDARY: '#5856D6',
  SUCCESS: '#4CAF50',
  DANGER: '#F44336',
  WARNING: '#FFA500',
  INFO: '#2196F3',
  LIGHT: '#F5F5F5',
  DARK: '#333333',
} as const;

// ============================================
// Date Formats
// ============================================

export const DATE_FORMATS = {
  SHORT: 'short',
  LONG: 'long',
  TIME: 'time',
  DATE_TIME: 'date-time',
} as const;