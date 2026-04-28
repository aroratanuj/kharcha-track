import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from '../entities/expense.entity';
import { Category } from '../entities/category.entity';
export declare class ExpensesService {
    private expenseRepository;
    private categoryRepository;
    constructor(expenseRepository: Repository<Expense>, categoryRepository: Repository<Category>);
    findAll(userId: string, status?: ExpenseStatus): Promise<Expense[]>;
    findOne(id: string, userId: string): Promise<Expense>;
    update(id: string, userId: string, updates: Partial<Expense>): Promise<Expense>;
    confirm(id: string, userId: string): Promise<Expense>;
    delete(id: string, userId: string): Promise<{
        message: string;
    }>;
    bulkConfirm(ids: string[], userId: string): Promise<{
        confirmed: number;
        message: string;
    }>;
    private updateBudgetSpent;
}
