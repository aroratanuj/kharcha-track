import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
export declare class CategoriesService {
    private categoryRepository;
    constructor(categoryRepository: Repository<Category>);
    findAll(userId: string): Promise<Category[]>;
    findOne(id: string, userId: string): Promise<Category>;
    create(userId: string, name: string, color?: string, icon?: string): Promise<Category>;
    update(id: string, userId: string, updates: Partial<Category>): Promise<Category>;
    delete(id: string, userId: string): Promise<{
        message: string;
    }>;
}
