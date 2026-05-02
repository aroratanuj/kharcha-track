import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../schemas/expense.schema';
import { User, UserDocument } from '../schemas/user.schema';
import Groq from 'groq-sdk';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private groq: Groq;

  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
  }

  async findUserByEmail(email: string): Promise<string | null> {
    const user = await this.userModel.findOne({ email: email.toLowerCase().trim() }).lean();
    return user ? user._id.toString() : null;
  }

  async findByDigest(digest: string): Promise<string | null> {
    const expense = await this.expenseModel.findOne({ emailDigest: digest }).lean();
    return expense ? expense._id.toString() : null;
  }

  async countUnassignedBySender(senderEmail: string): Promise<number> {
    return this.expenseModel.countDocuments({
      status: 'unassigned',
      'metadata.senderEmail': senderEmail.toLowerCase().trim(),
    });
  }

  async parseExpenseWithAI(emailContent: string, subject?: string) {
    if (!process.env.GROQ_API_KEY) {
      this.logger.warn('GROQ_API_KEY not set, using regex fallback');
      return this.fallbackParsing(emailContent);
    }

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
${emailContent.substring(0, 3000)}
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
    } catch {
      this.logger.warn('AI parsing failed, using fallback');
      return this.fallbackParsing(emailContent);
    }
  }

  async processEmail(
    emailContent: string,
    userId: string,
    subject: string,
    digest: string,
    parsedExpense: any,
  ) {
    try {
      const expense = await this.expenseModel.create({
        userId: new Types.ObjectId(userId),
        amount: parsedExpense.amount || 0,
        description: parsedExpense.description || 'Expense from email',
        merchantName: parsedExpense.merchant || '',
        date: parsedExpense.date ? new Date(parsedExpense.date) : new Date(),
        status: 'draft',
        emailDigest: digest,
        metadata: {
          emailContent,
          subject,
          confidence: parsedExpense.confidence || 'low',
          source: 'email',
        },
      });

      return {
        success: true,
        expenseId: expense._id.toString(),
        parsed: parsedExpense,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processUnassignedEmail(
    emailContent: string,
    senderEmail: string,
    subject: string,
    digest: string,
    parsedExpense: any,
  ) {
    try {
      const expense = await this.expenseModel.create({
        amount: parsedExpense.amount || 0,
        description: parsedExpense.description || 'Expense from email',
        merchantName: parsedExpense.merchant || '',
        date: parsedExpense.date ? new Date(parsedExpense.date) : new Date(),
        status: 'unassigned',
        emailDigest: digest,
        metadata: {
          emailContent,
          subject,
          senderEmail: senderEmail.toLowerCase().trim(),
          confidence: parsedExpense.confidence || 'low',
          source: 'email',
        },
      });

      return {
        success: true,
        expenseId: expense._id.toString(),
        parsed: parsedExpense,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private fallbackParsing(emailContent: string, subject?: string) {
    const text = [subject, emailContent].filter(Boolean).join('\n');

    const amountMatch = text.match(/(?:Rs\.?|INR|₹|\$)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    const dateMatch = text.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
    let date = new Date().toISOString().split('T')[0];
    if (dateMatch) {
      let y = parseInt(dateMatch[3]);
      if (y < 100) y += 2000;
      const m = parseInt(dateMatch[2]);
      const d = parseInt(dateMatch[1]);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    let merchant = 'Unknown';
    const merchantPatterns = [
      /at\s+(?:Upi\s+)?([A-Z][A-Za-z\s.]+?)(?:\s+is\s+Approved|\s+is\s+Declined|\.|\s*$)/im,
      /at\s+([A-Z][A-Za-z\s.]+?)(?:\s+on\s+\d|\s+for\s+INR|\s+for\s+Rs|\.|\s*$)/im,
      /merchant[:\s]+([A-Z][A-Za-z0-9\s.]+?)(?:\s*$|\n|\.)/im,
      /paid\s+to\s+([A-Z][A-Za-z\s.]+?)(?:\s+on|\s+for|\.|\s*$)/im,
      /to\s+([A-Z][A-Za-z0-9\s.]+?)\s+(?:via|using|on|for)\s/i,
    ];
    for (const pat of merchantPatterns) {
      const m = text.match(pat);
      if (m) {
        merchant = m[1].trim().replace(/\s+/g, ' ');
        if (merchant.length >= 2 && merchant.length <= 80) break;
        merchant = 'Unknown';
      }
    }

    let description = 'Expense from email';
    if (subject && subject.length > 3) {
      description = subject.replace(/^(Fwd?:?\s*)/i, '').trim();
    }
    if (amount > 0) {
      description += ` - INR ${amount}`;
    }

    return {
      amount,
      description,
      merchant,
      date,
      confidence: amount > 0 ? 'medium' : 'low',
    };
  }
}
