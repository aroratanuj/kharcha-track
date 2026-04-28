import { User } from './user.entity';
import { Expense } from './expense.entity';
import { Budget } from './budget.entity';
export declare class Category {
    id: string;
    name: string;
    color: string;
    icon: string;
    userId: string;
    user: User;
    expenses: Expense[];
    budgets: Budget[];
    createdAt: Date;
    updatedAt: Date;
}
