import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getSummary(req: any): Promise<{
        totalSpent: number;
        thisMonth: number;
        transactionCount: number;
    }>;
    getByCategory(req: any): Promise<any[]>;
    getTrends(req: any): Promise<any[]>;
}
