import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument } from '../schemas/budget.schema';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
  ) {}

  async findAll(userId: string): Promise<any[]> {
    const budgets = await this.budgetModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate<{ categoryId: any }>('categoryId')
      .lean();

    return budgets.map(b => ({
      ...b,
      id: b._id.toString(),
      userId: b.userId?.toString?.() || b.userId,
      categoryId: b.categoryId?._id?.toString?.() || b.categoryId?.toString?.() || b.categoryId,
      category: b.categoryId ? {
        id: b.categoryId._id?.toString(),
        name: b.categoryId.name,
        color: b.categoryId.color,
        icon: b.categoryId.icon,
      } : null,
    }));
  }

  async create(userId: string, categoryId: string, limit: number, month: number, year: number) {
    const budget = await this.budgetModel.create({
      userId: new Types.ObjectId(userId),
      categoryId: new Types.ObjectId(categoryId),
      limit,
      spent: 0,
      month,
      year,
    });

    return {
      ...budget.toObject(),
      id: budget._id.toString(),
      userId: budget.userId?.toString(),
      categoryId: budget.categoryId?.toString(),
    };
  }
}
