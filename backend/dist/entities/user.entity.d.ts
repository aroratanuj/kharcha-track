import { Expense } from './expense.entity';
import { Category } from './category.entity';
import { Budget } from './budget.entity';
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    expenses: Expense[];
    categories: Category[];
    budgets: Budget[];
}
