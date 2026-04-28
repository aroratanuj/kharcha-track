import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpensesQueryParams,
} from '@kts-workspace/shared-types';
import { ApiClient } from '../lib/shared-api';

export class ExpenseService {
  constructor(private apiClient: ApiClient) {}

  async getExpenses(params?: ExpensesQueryParams): Promise<Expense[]> {
    const response = await this.apiClient.getAxiosClient().get<Expense[]>('/expenses', {
      params,
    });
    return response.data;
  }

  async getExpenseById(id: string): Promise<Expense> {
    const response = await this.apiClient
      .getAxiosClient()
      .get<Expense>(`/expenses/${id}`);
    return response.data;
  }

  async createExpense(request: CreateExpenseRequest): Promise<Expense> {
    const response = await this.apiClient
      .getAxiosClient()
      .post<Expense>('/expenses', request);
    return response.data;
  }

  async updateExpense(
    id: string,
    request: UpdateExpenseRequest
  ): Promise<Expense> {
    const response = await this.apiClient
      .getAxiosClient()
      .put<Expense>(`/expenses/${id}`, request);
    return response.data;
  }

  async deleteExpense(id: string): Promise<void> {
    await this.apiClient.getAxiosClient().delete(`/expenses/${id}`);
  }
}

// Default expense service instance using the default API client
import { apiClient } from '../lib/shared-api';
export const expenseService = new ExpenseService(apiClient);