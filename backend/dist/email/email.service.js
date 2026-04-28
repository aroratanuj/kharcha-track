"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const expense_entity_1 = require("../entities/expense.entity");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
let EmailService = class EmailService {
    constructor(expenseRepository) {
        this.expenseRepository = expenseRepository;
        this.groq = new groq_sdk_1.default({
            apiKey: process.env.GROQ_API_KEY || '',
        });
    }
    async processEmail(emailContent, userId) {
        try {
            const parsedExpense = await this.parseExpenseWithAI(emailContent);
            const expense = this.expenseRepository.create({
                userId,
                amount: parsedExpense.amount,
                description: parsedExpense.description,
                merchantName: parsedExpense.merchant,
                date: new Date(parsedExpense.date),
                status: expense_entity_1.ExpenseStatus.DRAFT,
                metadata: {
                    emailContent,
                    confidence: parsedExpense.confidence,
                },
            });
            await this.expenseRepository.save(expense);
            return {
                success: true,
                expenseId: expense.id,
                parsed: parsedExpense,
            };
        }
        catch (error) {
            console.error('Failed to process email:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async parseExpenseWithAI(emailContent) {
        const prompt = `
Extract expense information from this email. Respond ONLY with valid JSON in this format:
{
  "amount": number,
  "description": string,
  "merchant": string,
  "date": "YYYY-MM-DD",
  "confidence": "high" | "medium" | "low"
}

Email content:
${emailContent}
`;
        try {
            const response = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama3-70b-8192',
                temperature: 0.1,
                response_format: { type: 'json_object' },
            });
            const content = response.choices[0].message.content;
            return JSON.parse(content);
        }
        catch (error) {
            console.error('AI parsing failed, using fallback:', error);
            return this.fallbackParsing(emailContent);
        }
    }
    fallbackParsing(emailContent) {
        const amountMatch = emailContent.match(/\$?(\d+\.?\d*)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
        return {
            amount,
            description: 'Expense from email',
            merchant: 'Unknown',
            date: new Date().toISOString().split('T')[0],
            confidence: 'low',
        };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(expense_entity_1.Expense)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EmailService);
//# sourceMappingURL=email.service.js.map