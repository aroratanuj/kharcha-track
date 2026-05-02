import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from '../schemas/expense.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { EmailService } from './email.service';
import { EmailSenderService } from './email-sender.service';
import { EmailController } from './email.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailSenderService],
})
export class EmailModule {}
