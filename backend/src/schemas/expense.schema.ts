import mongoose, { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  description: string;

  @Prop()
  merchantName: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ enum: ['draft', 'confirmed', 'unassigned'], default: 'confirmed' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ enum: ['UPI', 'Card', 'Bank Account', 'Cash'] })
  accountSource: string;

  @Prop()
  notes: string;

  @Prop()
  emailDigest: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata: Record<string, any>;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

ExpenseSchema.index({ userId: 1 });
ExpenseSchema.index({ status: 1 });
ExpenseSchema.index({ date: 1 });
ExpenseSchema.index({ categoryId: 1 });
ExpenseSchema.index({ emailDigest: 1 }, { unique: true, sparse: true });
