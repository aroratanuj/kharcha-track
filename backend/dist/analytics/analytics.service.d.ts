export declare class AnalyticsService {
    getSummary(userId: string): Promise<{
        totalSpent: number;
        thisMonth: number;
        transactionCount: number;
    }>;
    getByCategory(userId: string): Promise<any[]>;
    getTrends(userId: string): Promise<any[]>;
}
