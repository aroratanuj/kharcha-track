import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountSource, AccountSourceDocument } from '../schemas/account-source.schema';

@Injectable()
export class AccountSourceService {
  constructor(
    @InjectModel(AccountSource.name) private model: Model<AccountSourceDocument>,
  ) {}

  async findAll() {
    const items = await this.model.find().sort({ label: 1 }).lean();
    return items.map(i => ({
      id: i._id.toString(),
      label: i.label,
      icon: i.icon,
      isActive: i.isActive,
    }));
  }

  async findActive() {
    const items = await this.model.find({ isActive: true }).sort({ label: 1 }).lean();
    return items.map(i => ({
      id: i._id.toString(),
      label: i.label,
      icon: i.icon,
    }));
  }

  async create(label: string, icon: string) {
    const existing = await this.model.findOne({ label });
    if (existing) {
      throw new ConflictException('Account source already exists');
    }
    const item = await this.model.create({ label, icon });
    return { id: item._id.toString(), label: item.label, icon: item.icon, isActive: item.isActive };
  }

  async update(id: string, updates: Partial<{ label: string; icon: string; isActive: boolean }>) {
    const item = await this.model.findById(id);
    if (!item) throw new NotFoundException('Account source not found');
    Object.assign(item, updates);
    await item.save();
    return { id: item._id.toString(), label: item.label, icon: item.icon, isActive: item.isActive };
  }

  async delete(id: string) {
    const item = await this.model.findById(id);
    if (!item) throw new NotFoundException('Account source not found');
    await this.model.deleteOne({ _id: id });
    return { message: 'Account source deleted' };
  }
}
