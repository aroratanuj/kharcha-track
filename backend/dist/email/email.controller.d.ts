import { Request } from 'express';
import { EmailService } from './email.service';
export declare class EmailController {
    private emailService;
    constructor(emailService: EmailService);
    handleMailgunWebhook(body: any, req: Request): Promise<{
        success: boolean;
        expenseId: string;
        parsed: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        expenseId?: undefined;
        parsed?: undefined;
    } | {
        success: boolean;
        message: string;
    }>;
    private getUserIdFromEmail;
}
