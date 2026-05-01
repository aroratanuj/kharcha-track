import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll() {
    return this.categoryRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.categoryRepository.findOne({
      where: { id, userId },
    });
  }

  async create(userId: string, name: string, color?: string, icon?: string) {
    const category = this.categoryRepository.create({
      userId,
      name,
      color: color || '#007AFF',
      icon,
    });

    return this.categoryRepository.save(category);
  }

  async update(id: string, userId: string, updates: Partial<Category>) {
    const category = await this.findOne(id, userId);

    if (!category) {
      throw new Error('Category not found');
    }

    Object.assign(category, updates);
    return this.categoryRepository.save(category);
  }

  async delete(id: string, userId: string) {
    const category = await this.findOne(id, userId);

    if (!category) {
      throw new Error('Category not found');
    }

    await this.categoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}
