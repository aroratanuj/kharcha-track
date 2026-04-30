import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../entities/expense.entity';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Expense])],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
