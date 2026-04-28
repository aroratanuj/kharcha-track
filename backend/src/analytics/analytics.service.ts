import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  async getSummary(userId: string) {
    // Placeholder - will implement in Phase 7
    return {
      totalSpent: 0,
      thisMonth: 0,
      transactionCount: 0,
    };
  }

  async getByCategory(userId: string) {
    // Placeholder - will implement in Phase 7
    return [];
  }

  async getTrends(userId: string) {
    // Placeholder - will implement in Phase 7
    return [];
  }
}
