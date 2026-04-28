import { BudgetsService } from './budgets.service';
export declare class BudgetsController {
    private budgetsService;
    constructor(budgetsService: BudgetsService);
    findAll(req: any): Promise<import("../entities/budget.entity").Budget[]>;
    create(categoryId: string, limit: number, month: number, year: number, req?: any): Promise<import("../entities/budget.entity").Budget>;
}
