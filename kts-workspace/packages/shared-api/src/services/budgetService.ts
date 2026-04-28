import type {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '@kts-workspace/shared-types';
import { ApiClient } from '../lib/shared-api';

export class BudgetService {
  constructor(private apiClient: ApiClient) {}

  async getBudgets(): Promise<Budget[]> {
    const response = await this.apiClient
      .getAxiosClient()
      .get<Budget[]>('/budgets');
    return response.data;
  }

  async getBudgetById(id: string): Promise<Budget> {
    const response = await this.apiClient
      .getAxiosClient()
      .get<Budget>(`/budgets/${id}`);
    return response.data;
  }

  async createBudget(request: CreateBudgetRequest): Promise<Budget> {
    const response = await this.apiClient
      .getAxiosClient()
      .post<Budget>('/budgets', request);
    return response.data;
  }

  async updateBudget(
    id: string,
    request: UpdateBudgetRequest
  ): Promise<Budget> {
    const response = await this.apiClient
      .getAxiosClient()
      .put<Budget>(`/budgets/${id}`, request);
    return response.data;
  }

  async deleteBudget(id: string): Promise<void> {
    await this.apiClient.getAxiosClient().delete(`/budgets/${id}`);
  }
}

// Default budget service instance using the default API client
import { apiClient } from '../lib/shared-api';
export const budgetService = new BudgetService(apiClient);