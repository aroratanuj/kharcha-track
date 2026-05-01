import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from '../schemas/expense.schema';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }])],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
