import { User } from './user.entity';
import { Category } from './category.entity';
export declare class Budget {
    id: string;
    limit: number;
    spent: number;
    month: number;
    year: number;
    userId: string;
    user: User;
    categoryId: string;
    category: Category;
    createdAt: Date;
    updatedAt: Date;
}
