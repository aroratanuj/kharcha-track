// ============================================
// Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================
// Expense Types
// ============================================

export type ExpenseStatus = 'draft' | 'confirmed' | 'rejected';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  merchant: string;
  status: ExpenseStatus;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  date: string;
  merchant: string;
}

export interface UpdateExpenseRequest {
  amount?: number;
  description?: string;
  date?: string;
  merchant?: string;
  status?: ExpenseStatus;
}

export interface ExpensesQueryParams {
  status?: ExpenseStatus;
  limit?: number;
  offset?: number;
}

// ============================================
// Budget Types
// ============================================

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  categories?: string[];
  startDate: string;
  endDate: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBudgetRequest {
  name: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  categories?: string[];
  startDate: string;
  endDate: string;
}

export interface UpdateBudgetRequest {
  name?: string;
  amount?: number;
  period?: 'weekly' | 'monthly' | 'yearly';
  categories?: string[];
  startDate?: string;
  endDate?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// Analytics Types
// ============================================

export interface ExpenseAnalytics {
  totalExpenses: number;
  averageExpense: number;
  topMerchants: MerchantSummary[];
  expensesByCategory: CategorySummary[];
  expensesByPeriod: PeriodSummary[];
}

export interface MerchantSummary {
  merchant: string;
  totalAmount: number;
  count: number;
}

export interface CategorySummary {
  category: string;
  totalAmount: number;
  count: number;
}

export interface PeriodSummary {
  period: string;
  totalAmount: number;
  count: number;
}