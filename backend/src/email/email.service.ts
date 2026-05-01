import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../schemas/expense.schema';
import Groq from 'groq-sdk';

@Injectable()
export class EmailService {
  private groq: Groq;

  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
  }

  async findByDigest(digest: string): Promise<string | null> {
    const expense = await this.expenseModel.findOne({ emailDigest: digest }).lean();
    return expense ? expense._id.toString() : null;
  }

  async processEmail(emailContent: string, userId: string, subject: string, digest: string) {
    try {
      const parsedExpense = await this.parseExpenseWithAI(emailContent);

      const expense = await this.expenseModel.create({
        userId: new Types.ObjectId(userId),
        amount: parsedExpense.amount,
        description: parsedExpense.description,
        merchantName: parsedExpense.merchant,
        date: new Date(parsedExpense.date),
        status: 'draft',
        emailDigest: digest,
        metadata: {
          emailContent,
          subject,
          confidence: parsedExpense.confidence,
          source: 'email',
        },
      });

      return {
        success: true,
        expenseId: expense._id.toString(),
        parsed: parsedExpense,
      };
    } catch (error) {
      console.error('Failed to process email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async parseExpenseWithAI(emailContent: string) {
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
    } catch (error) {
      console.error('AI parsing failed, using fallback:', error);
      return this.fallbackParsing(emailContent);
    }
  }

  private fallbackParsing(emailContent: string) {
    const amountMatch = emailContent.match(/[\$₹]?\s*(\d+\.?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    return {
      amount,
      description: 'Expense from email',
      merchant: 'Unknown',
      date: new Date().toISOString().split('T')[0],
      confidence: 'low',
    };
  }
}
