import type { ExpenseAnalytics } from '@kts-workspace/shared-types';
import { ApiClient } from '../lib/shared-api';

export class AnalyticsService {
  constructor(private apiClient: ApiClient) {}

  async getExpenseAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<ExpenseAnalytics> {
    const response = await this.apiClient
      .getAxiosClient()
      .get<ExpenseAnalytics>('/analytics/expenses', {
        params: { startDate, endDate },
      });
    return response.data;
  }
}

// Default analytics service instance using the default API client
import { apiClient } from '../lib/shared-api';
export const analyticsService = new AnalyticsService(apiClient);