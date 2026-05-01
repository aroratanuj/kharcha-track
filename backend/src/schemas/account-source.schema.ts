import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountSourceDocument = AccountSource & Document;

@Schema({ timestamps: true })
export class AccountSource {
  @Prop({ required: true, unique: true })
  label: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const AccountSourceSchema = SchemaFactory.createForClass(AccountSource);
