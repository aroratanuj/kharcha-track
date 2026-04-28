import { ExpensesService } from './expenses.service';
import { ExpenseStatus } from '../entities/expense.entity';
export declare class ExpensesController {
    private expensesService;
    constructor(expensesService: ExpensesService);
    findAll(req: any, status?: ExpenseStatus): Promise<import("../entities/expense.entity").Expense[]>;
    findOne(id: string, req: any): Promise<import("../entities/expense.entity").Expense>;
    update(id: string, updates: any, req: any): Promise<import("../entities/expense.entity").Expense>;
    confirm(id: string, req: any): Promise<import("../entities/expense.entity").Expense>;
    delete(id: string, req: any): Promise<{
        message: string;
    }>;
    bulkConfirm(ids: string[], req: any): Promise<{
        confirmed: number;
        message: string;
    }>;
}
