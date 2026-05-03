import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../schemas/expense.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { User, UserDocument } from '../schemas/user.schema';

const ALLOWED_UPDATE_FIELDS = ['amount', 'description', 'merchantName', 'date', 'categoryId', 'accountSource', 'notes', 'status'];

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(
    userId: string,
    amount: number,
    description: string,
    merchantName: string,
    date: Date,
    categoryId?: string,
    status: string = 'confirmed',
    accountSource?: string,
    notes?: string,
  ): Promise<any> {
    if (categoryId) {
      const category = await this.categoryModel.findById(categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const expense = await this.expenseModel.create({
      userId: new Types.ObjectId(userId),
      amount,
      description,
      merchantName,
      date,
      categoryId: categoryId ? new Types.ObjectId(categoryId) : null,
      status,
      accountSource,
      notes,
    });

    return this.formatExpense(expense.toObject());
  }

  async findAll(userId: string, status?: string): Promise<any[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (status) {
      filter.status = status;
    }

    const expenses = await this.expenseModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(1000)
      .populate<{ categoryId: any }>('categoryId')
      .lean();

    return expenses.map(e => this.formatExpense(e));
  }

  async findAllAdmin(userId?: string, status?: string): Promise<any[]> {
    const filter: any = {};
    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }
    if (status) {
      filter.status = status;
    }

    const existingUserIds = (await this.userModel.find({}, { _id: 1 }).lean()).map(u => u._id);
    const unassignedFilter: any = filter.userId
      ? filter
      : { ...filter, $or: [{ userId: { $in: existingUserIds } }, { userId: null }] };

    const expenses = await this.expenseModel
      .find(unassignedFilter)
      .sort({ createdAt: -1 })
      .limit(1000)
      .populate<{ categoryId: any; userId: any }>('categoryId userId')
      .lean();

    return expenses
      .filter(e => !e.userId || (e.userId && e.userId._id))
      .map(e => this.formatAdminExpense(e));
  }

  async findUnassigned(): Promise<any[]> {
    const expenses = await this.expenseModel
      .find({ status: 'unassigned' })
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    return expenses.map(e => ({
      ...e,
      id: e._id.toString(),
      senderEmail: e.metadata?.senderEmail || null,
    }));
  }

  async getMonthlySummary(userId: string, monthStr?: string, yearStr?: string): Promise<any> {
    const now = new Date();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const confirmedFilter: any = {
      userId: new Types.ObjectId(userId),
      status: 'confirmed',
      date: { $gte: startDate, $lte: endDate },
    };

    const confirmedExpenses = await this.expenseModel
      .find(confirmedFilter)
      .populate<{ categoryId: any }>('categoryId')
      .lean();

    const totalSpent = confirmedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const expenseCount = confirmedExpenses.length;

    const draftFilter: any = {
      userId: new Types.ObjectId(userId),
      status: 'draft',
    };

    const draftExpenses = await this.expenseModel.find(draftFilter).lean();
    const draftCount = draftExpenses.length;
    const draftTotal = draftExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const categoryMap = new Map<string, { name: string; icon: string; color: string; amount: number; count: number }>();
    for (const e of confirmedExpenses) {
      const cat = e.categoryId;
      const key = cat?._id?.toString() || '_uncategorized';
      const name = cat?.name || 'Uncategorized';
      const icon = cat?.icon || '📦';
      const color = cat?.color || '#AEB6BF';
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { name, icon, color, amount: 0, count: 0 });
      }
      const entry = categoryMap.get(key)!;
      entry.amount += Number(e.amount);
      entry.count += 1;
    }

    const topCategories = Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(c => ({ ...c, percentage: totalSpent > 0 ? Math.round((c.amount / totalSpent) * 100) : 0 }));

    return {
      totalSpent,
      expenseCount,
      draftCount,
      draftTotal,
      topCategories,
      month,
      year,
    };
  }

  async findOne(id: string, userId: string): Promise<any> {
    const expense = await this.expenseModel
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .populate<{ categoryId: any }>('categoryId')
      .lean();

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return this.formatExpense(expense);
  }

  async update(id: string, userId: string, updates: any): Promise<any> {
    const user = await this.userModel.findById(userId).lean();
    const isAdmin = user?.role === 'admin';

    const filter: any = { _id: id };
    if (!isAdmin) {
      filter.userId = new Types.ObjectId(userId);
    }

    const expense = await this.expenseModel.findOne(filter);

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (updates.categoryId) {
      const category = await this.categoryModel.findById(updates.categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const mongoUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_UPDATE_FIELDS.includes(key)) continue;
      if (key === 'categoryId' && value) {
        mongoUpdates.categoryId = new Types.ObjectId(value as string);
      } else if (key === 'date' && value) {
        mongoUpdates.date = new Date(value as string);
      } else if (key === 'status') {
        mongoUpdates.status = value === 'draft' || value === 'confirmed' ? value : expense.status;
      } else if (value !== undefined) {
        mongoUpdates[key] = value;
      }
    }

    await this.expenseModel.updateOne({ _id: id }, mongoUpdates);
    return this.findOne(id, userId);
  }

  async confirm(id: string, userId: string, isAdmin: boolean = false): Promise<any> {
    const filter: any = { _id: id };
    if (!isAdmin) {
      filter.userId = new Types.ObjectId(userId);
    }

    const expense = await this.expenseModel.findOne(filter);

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.status === 'confirmed') {
      return isAdmin
        ? this.formatAdminExpense(await this.expenseModel.findById(id).populate<{ categoryId: any; userId: any }>('categoryId userId').lean() || expense)
        : this.findOne(id, userId);
    }

    expense.status = 'confirmed';
    await expense.save();

    return isAdmin
      ? this.formatAdminExpense(await this.expenseModel.findById(id).populate<{ categoryId: any; userId: any }>('categoryId userId').lean() || expense)
      : this.findOne(id, userId);
  }

  async delete(id: string, userId: string, isAdmin: boolean = false): Promise<any> {
    const expense = await this.expenseModel.findById(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const isOwner = expense.userId && expense.userId.toString() === userId;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own draft expenses');
    }

    await this.expenseModel.deleteOne({ _id: id });
    return { message: 'Expense deleted successfully' };
  }

  async assignToUser(id: string, targetUserId: string): Promise<any> {
    const expense = await this.expenseModel.findById(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    expense.userId = new Types.ObjectId(targetUserId);
    expense.status = 'draft';
    await expense.save();

    const populated = await this.expenseModel
      .findById(id)
      .populate<{ categoryId: any }>('categoryId')
      .lean();

    return this.formatExpense(populated!);
  }

  async bulkConfirm(ids: string[], userId: string) {
    const expenses = await this.expenseModel.find({
      _id: { $in: ids.map(id => new Types.ObjectId(id)) },
      userId: new Types.ObjectId(userId),
      status: 'draft',
    });

    for (const expense of expenses) {
      expense.status = 'confirmed';
      await expense.save();
    }

    return {
      confirmed: expenses.length,
      message: `${expenses.length} expense(s) confirmed`,
    };
  }

  private formatExpense(e: any): any {
    return {
      ...e,
      id: e._id.toString(),
      userId: e.userId?.toString?.() || e.userId,
      categoryId: e.categoryId?._id?.toString?.() || e.categoryId?.toString?.() || e.categoryId,
      category: e.categoryId ? {
        id: e.categoryId._id?.toString(),
        name: e.categoryId.name,
        color: e.categoryId.color,
        icon: e.categoryId.icon,
      } : null,
    };
  }

  private formatAdminExpense(e: any): any {
    return {
      ...e,
      id: e._id.toString(),
      userId: e.userId?._id?.toString?.() || e.userId?.toString?.() || e.userId,
      categoryId: e.categoryId?._id?.toString?.() || e.categoryId?.toString?.() || e.categoryId,
      category: e.categoryId ? {
        id: e.categoryId._id?.toString(),
        name: e.categoryId.name,
        color: e.categoryId.color,
        icon: e.categoryId.icon,
      } : null,
      user: e.userId ? {
        id: e.userId._id?.toString(),
        email: e.userId.email,
        name: e.userId.fullName,
      } : null,
    };
  }
}
