import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<import("../entities/category.entity").Category[]>;
    create(name: string, color?: string, icon?: string, req?: any): Promise<import("../entities/category.entity").Category>;
    update(id: string, updates: any, req: any): Promise<import("../entities/category.entity").Category>;
    delete(id: string, req: any): Promise<{
        message: string;
    }>;
}
