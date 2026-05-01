import { ExpensesService } from './expenses.service';
import { ExpenseStatus } from '../entities/expense.entity';
import { AccountSource } from '../constants/account-source.enum';
export declare class ExpensesController {
    private expensesService;
    constructor(expensesService: ExpensesService);
    create(amount: number, description: string, merchantName?: string, date?: string, categoryId?: string, status?: ExpenseStatus, accountSource?: AccountSource, notes?: string, req?: any): Promise<import("../entities/expense.entity").Expense>;
    findAll(req: any, status?: ExpenseStatus): Promise<import("../entities/expense.entity").Expense[]>;
    findAllAdmin(userId?: string, status?: ExpenseStatus): Promise<import("../entities/expense.entity").Expense[]>;
    findOne(id: string, req: any): Promise<import("../entities/expense.entity").Expense>;
    update(id: string, updates: any, req: any): Promise<import("../entities/expense.entity").Expense>;
    confirm(id: string, req: any): Promise<import("../entities/expense.entity").Expense>;
    delete(id: string): Promise<{
        message: string;
    }>;
    bulkConfirm(ids: string[], req: any): Promise<{
        confirmed: number;
        message: string;
    }>;
}
