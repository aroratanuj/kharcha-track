import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseStatus } from '../entities/expense.entity';
import { Category } from '../entities/category.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(userId: string, status?: ExpenseStatus) {
    const query = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .where('expense.userId = :userId', { userId });

    if (status) {
      query.andWhere('expense.status = :status', { status });
    }

    return query.orderBy('expense.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, userId: string) {
    const expense = await this.expenseRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async update(id: string, userId: string, updates: Partial<Expense>) {
    const expense = await this.findOne(id, userId);

    if (updates.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updates.categoryId, userId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    Object.assign(expense, updates);
    return this.expenseRepository.save(expense);
  }

  async confirm(id: string, userId: string) {
    const expense = await this.findOne(id, userId);

    if (expense.status === ExpenseStatus.CONFIRMED) {
      return expense;
    }

    expense.status = ExpenseStatus.CONFIRMED;

    // Update budget spent amount
    if (expense.categoryId) {
      await this.updateBudgetSpent(userId, expense.categoryId, expense.amount);
    }

    return this.expenseRepository.save(expense);
  }

  async delete(id: string, userId: string) {
    const expense = await this.findOne(id, userId);
    await this.expenseRepository.remove(expense);
    return { message: 'Expense deleted successfully' };
  }

  async bulkConfirm(ids: string[], userId: string) {
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.id IN (:...ids)', { ids })
      .andWhere('expense.userId = :userId', { userId })
      .andWhere('expense.status = :status', { status: ExpenseStatus.DRAFT })
      .getMany();

    for (const expense of expenses) {
      expense.status = ExpenseStatus.CONFIRMED;

      if (expense.categoryId) {
        await this.updateBudgetSpent(userId, expense.categoryId, expense.amount);
      }
    }

    await this.expenseRepository.save(expenses);

    return {
      confirmed: expenses.length,
      message: `${expenses.length} expense(s) confirmed`,
    };
  }

  private async updateBudgetSpent(userId: string, categoryId: string, amount: number) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // This would update the budget - implementation depends on budget entity structure
    // For now, we'll skip this as budget module is not fully implemented
  }
}
