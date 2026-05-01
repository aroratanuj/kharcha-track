import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../schemas/expense.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { AccountSource } from '../constants/account-source.enum';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  private toPlain(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      ...obj,
      id: obj._id?.toString(),
      userId: obj.userId?.toString?.() || obj.userId,
      categoryId: obj.categoryId?.toString?.() || obj.categoryId,
    };
  }

  private toPlainArray(docs: any[]) {
    return docs.map(d => this.toPlain(d));
  }

  async create(
    userId: string,
    amount: number,
    description: string,
    merchantName: string,
    date: Date,
    categoryId?: string,
    status: string = 'confirmed',
    accountSource?: AccountSource,
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

    return this.toPlain(expense);
  }

  async findAll(userId: string, status?: string): Promise<any[]> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (status) {
      filter.status = status;
    }

    const expenses = await this.expenseModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate<{ categoryId: any }>('categoryId')
      .lean();

    return expenses.map(e => ({
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
    }));
  }

  async findAllAdmin(userId?: string, status?: string): Promise<any[]> {
    const filter: any = {};
    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }
    if (status) {
      filter.status = status;
    }

    const expenses = await this.expenseModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate<{ categoryId: any; userId: any }>('categoryId userId')
      .lean();

    return expenses.map(e => ({
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
    }));
  }

  async findOne(id: string, userId: string): Promise<any> {
    const expense = await this.expenseModel
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .populate<{ categoryId: any }>('categoryId')
      .lean();

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return {
      ...expense,
      id: expense._id.toString(),
      userId: expense.userId?.toString?.() || expense.userId,
      categoryId: expense.categoryId?._id?.toString?.() || expense.categoryId?.toString?.() || expense.categoryId,
      category: expense.categoryId ? {
        id: expense.categoryId._id?.toString(),
        name: expense.categoryId.name,
        color: expense.categoryId.color,
        icon: expense.categoryId.icon,
      } : null,
    };
  }

  async update(id: string, userId: string, updates: any): Promise<any> {
    const expense = await this.expenseModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });

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
      if (key === 'categoryId' && value) {
        mongoUpdates.categoryId = new Types.ObjectId(value as string);
      } else if (key === 'date' && value) {
        mongoUpdates.date = new Date(value as string);
      } else if (value !== undefined && key !== 'id' && key !== '_id') {
        mongoUpdates[key] = value;
      }
    }

    await this.expenseModel.updateOne({ _id: id }, mongoUpdates);
    return this.findOne(id, userId);
  }

  async confirm(id: string, userId: string): Promise<any> {
    const expense = await this.expenseModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.status === 'confirmed') {
      return this.findOne(id, userId);
    }

    expense.status = 'confirmed';
    await expense.save();

    if (expense.categoryId) {
      await this.updateBudgetSpent(userId, expense.categoryId.toString(), expense.amount);
    }

    return this.findOne(id, userId);
  }

  async delete(id: string) {
    const expense = await this.expenseModel.findById(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    await this.expenseModel.deleteOne({ _id: id });
    return { message: 'Expense deleted successfully' };
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

  private async updateBudgetSpent(userId: string, categoryId: string, amount: number) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
  }
}
