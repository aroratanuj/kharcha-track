import { Repository } from 'typeorm';
import { Budget } from '../entities/budget.entity';
export declare class BudgetsService {
    private budgetRepository;
    constructor(budgetRepository: Repository<Budget>);
    findAll(userId: string): Promise<Budget[]>;
    create(userId: string, categoryId: string, limit: number, month: number, year: number): Promise<Budget>;
}
