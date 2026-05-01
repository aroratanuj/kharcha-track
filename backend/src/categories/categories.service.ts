import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll() {
    const categories = await this.categoryModel.find().sort({ createdAt: 1 }).lean();
    return categories.map(c => ({ ...c, id: c._id.toString() }));
  }

  async findOne(id: string, userId: string) {
    return this.categoryModel.findOne({ _id: id, userId });
  }

  async create(userId: string, name: string, color?: string, icon?: string) {
    return this.categoryModel.create({
      userId,
      name,
      color: color || '#007AFF',
      icon,
    });
  }

  async update(id: string, userId: string, updates: Partial<Category>) {
    const category = await this.findOne(id, userId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    Object.assign(category, updates);
    await category.save();
    return category;
  }

  async delete(id: string, userId: string) {
    const category = await this.findOne(id, userId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryModel.deleteOne({ _id: id });
    return { message: 'Category deleted successfully' };
  }
}
