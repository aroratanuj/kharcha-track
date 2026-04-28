import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../entities/budget.entity';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
  ) {}

  async findAll(userId: string) {
    return this.budgetRepository.find({
      where: { userId },
      relations: ['category'],
    });
  }

  async create(userId: string, categoryId: string, limit: number, month: number, year: number) {
    const budget = this.budgetRepository.create({
      userId,
      categoryId,
      limit,
      spent: 0,
      month,
      year,
    });

    return this.budgetRepository.save(budget);
  }
}
