import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from '../entities/expense.entity';
import { Category } from '../entities/category.entity';
import { AccountSource } from '../constants/account-source.enum';
export declare class ExpensesService {
    private expenseRepository;
    private categoryRepository;
    constructor(expenseRepository: Repository<Expense>, categoryRepository: Repository<Category>);
    create(userId: string, amount: number, description: string, merchantName: string, date: Date, categoryId?: string, status?: ExpenseStatus, accountSource?: AccountSource, notes?: string): Promise<Expense>;
    findAll(userId: string, status?: ExpenseStatus): Promise<Expense[]>;
    findAllAdmin(userId?: string, status?: ExpenseStatus): Promise<Expense[]>;
    findOne(id: string, userId: string): Promise<Expense>;
    update(id: string, userId: string, updates: Partial<Expense>): Promise<Expense>;
    confirm(id: string, userId: string): Promise<Expense>;
    delete(id: string): Promise<{
        message: string;
    }>;
    bulkConfirm(ids: string[], userId: string): Promise<{
        confirmed: number;
        message: string;
    }>;
    private updateBudgetSpent;
}
