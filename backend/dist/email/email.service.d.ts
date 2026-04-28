import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
export declare class EmailService {
    private expenseRepository;
    private groq;
    constructor(expenseRepository: Repository<Expense>);
    processEmail(emailContent: string, userId: string): Promise<{
        success: boolean;
        expenseId: string;
        parsed: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        expenseId?: undefined;
        parsed?: undefined;
    }>;
    private parseExpenseWithAI;
    private fallbackParsing;
}
