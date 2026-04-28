import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from '../entities/expense.entity';
import Groq from 'groq-sdk';

@Injectable()
export class EmailService {
  private groq: Groq;

  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
  }

  async processEmail(emailContent: string, userId: string) {
    try {
      const parsedExpense = await this.parseExpenseWithAI(emailContent);

      const expense = this.expenseRepository.create({
        userId,
        amount: parsedExpense.amount,
        description: parsedExpense.description,
        merchantName: parsedExpense.merchant,
        date: new Date(parsedExpense.date),
        status: ExpenseStatus.DRAFT,
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
    // Simple regex-based fallback
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
}
