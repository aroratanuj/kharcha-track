import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../schemas/expense.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { SettingsService } from '../settings/settings.service';
import { ParsedExpense } from './parsers/expense-parser.interface';
import { AIParser } from './parsers/ai.parser';
import { RegexParser } from './parsers/regex.parser';
import { LLMProviderFactory } from './llm/llm-provider.factory';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private settingsService: SettingsService,
    private aiParser: AIParser,
    private regexParser: RegexParser,
    private llmFactory: LLMProviderFactory,
  ) {}

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

  async getCategoryList(): Promise<Array<{ id: string; name: string }>> {
    const categories = await this.categoryModel.find().lean();
    return categories.map((c) => ({ id: c._id.toString(), name: c.name }));
  }

  async getUserCategoryHistory(
    userId: string,
    merchant: string,
  ): Promise<Map<string, number>> {
    const merchantLower = merchant.toLowerCase().trim();
    const expenses = await this.expenseModel
      .find({
        userId: new Types.ObjectId(userId),
        merchantName: { $regex: merchantLower, $options: 'i' },
        categoryId: { $ne: null },
        status: { $in: ['draft', 'confirmed'] },
      })
      .populate('categoryId')
      .limit(20)
      .lean();

    const counts = new Map<string, number>();
    for (const exp of expenses) {
      const cat = exp.categoryId as any;
      if (cat && cat.name) {
        counts.set(cat.name, (counts.get(cat.name) || 0) + 1);
      }
    }
    return counts;
  }

  async deduceCategory(
    emailContent: string,
    merchant: string,
    description: string,
    userId?: string,
  ): Promise<{ id?: string; name?: string; method: 'history' | 'llm' | 'none' }> {
    const categories = await this.getCategoryList();
    if (categories.length === 0) return { method: 'none' };

    if (userId && merchant && merchant !== 'Unknown') {
      const history = await this.getUserCategoryHistory(userId, merchant);
      if (history.size > 0) {
        let topCategory = '';
        let topCount = 0;
        for (const [name, count] of history) {
          if (count > topCount) {
            topCount = count;
            topCategory = name;
          }
        }
        const match = categories.find((c) => c.name === topCategory);
        if (match) {
          this.logger.log(`Category from history: "${topCategory}" (${topCount} matches for "${merchant}")`);
          return { id: match.id, name: match.name, method: 'history' };
        }
      }
    }

    const aiEnabled = await this.settingsService.get('aiEnabled');
    if (!aiEnabled) return { method: 'none' };

    const providerName = await this.settingsService.get('aiProvider');
    const modelName = await this.settingsService.get('llmModel');
    const provider = this.llmFactory.getProvider(providerName);
    if (!provider) return { method: 'none' };

    try {
      const catList = categories.map((c) => c.name).join(', ');
      const suggested = await provider.suggestCategory(
        merchant,
        description,
        emailContent.substring(0, 1000),
        catList,
        modelName,
      );

      const match = categories.find((c) => c.name.toLowerCase() === suggested?.toLowerCase());
      if (match) {
        this.logger.log(`Category via LLM: "${match.name}"`);
        return { id: match.id, name: match.name, method: 'llm' };
      }
      return { method: 'none' };
    } catch (err: any) {
      this.logger.warn(`LLM category deduction failed: ${err.message}`);
      return { method: 'none' };
    }
  }

  async parseExpenseWithAI(emailContent: string, subject?: string): Promise<ParsedExpense> {
    const aiEnabled = await this.settingsService.get('aiEnabled');
    const categories = await this.getCategoryList();

    if (aiEnabled) {
      const providerName = await this.settingsService.get('aiProvider');
      const modelName = await this.settingsService.get('llmModel');
      return this.aiParser.parse(emailContent, subject || '', categories, providerName, modelName);
    }

    this.logger.warn('AI disabled, using regex only');
    return this.regexParser.parse(emailContent, subject || '');
  }

  async processEmail(
    emailContent: string,
    userId: string,
    subject: string,
    digest: string,
    parsedExpense: ParsedExpense,
  ) {
    try {
      let categoryId: any = undefined;
      if (parsedExpense.suggestedCategoryId) {
        categoryId = new Types.ObjectId(parsedExpense.suggestedCategoryId);
      } else {
        const catResult = await this.deduceCategory(
          emailContent,
          parsedExpense.merchant,
          parsedExpense.description,
          userId,
        );
        if (catResult.id) {
          categoryId = new Types.ObjectId(catResult.id);
        }
      }

      const expense = await this.expenseModel.create({
        userId: new Types.ObjectId(userId),
        amount: parsedExpense.amount || 0,
        description: parsedExpense.description || 'Expense from email',
        merchantName: parsedExpense.merchant || '',
        date: parsedExpense.date ? new Date(parsedExpense.date) : new Date(),
        status: 'draft',
        categoryId,
        accountSource: parsedExpense.accountSource || undefined,
        emailDigest: digest,
        metadata: {
          emailContent,
          subject,
          source: 'email',
          parseMethod: parsedExpense.parseMethod,
          overallConfidence: parsedExpense.overallConfidence,
          fieldConfidence: parsedExpense.fieldConfidence,
          categoryMethod: parsedExpense.suggestedCategoryId ? 'ai' : 'regex-history',
        },
      });

      return { success: true, expenseId: expense._id.toString(), parsed: parsedExpense };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async processUnassignedEmail(
    emailContent: string,
    senderEmail: string,
    subject: string,
    digest: string,
    parsedExpense: ParsedExpense,
  ) {
    try {
      const expense = await this.expenseModel.create({
        amount: parsedExpense.amount || 0,
        description: parsedExpense.description || 'Expense from email',
        merchantName: parsedExpense.merchant || '',
        date: parsedExpense.date ? new Date(parsedExpense.date) : new Date(),
        status: 'unassigned',
        accountSource: parsedExpense.accountSource || undefined,
        emailDigest: digest,
        metadata: {
          emailContent,
          subject,
          senderEmail: senderEmail.toLowerCase().trim(),
          source: 'email',
          parseMethod: parsedExpense.parseMethod,
          overallConfidence: parsedExpense.overallConfidence,
          fieldConfidence: parsedExpense.fieldConfidence,
          suggestedCategory: parsedExpense.suggestedCategoryName,
        },
      });

      return { success: true, expenseId: expense._id.toString(), parsed: parsedExpense };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
