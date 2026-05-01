import { User } from './user.entity';
import { Category } from './category.entity';
import { AccountSource } from '../constants/account-source.enum';
export declare enum ExpenseStatus {
    DRAFT = "draft",
    CONFIRMED = "confirmed"
}
export declare class Expense {
    id: string;
    amount: number;
    description: string;
    merchantName: string;
    date: Date;
    status: ExpenseStatus;
    categoryId: string;
    category: Category;
    accountSource: AccountSource;
    notes: string;
    userId: string;
    user: User;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
