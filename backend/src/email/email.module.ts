import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Expense, ExpenseSchema } from '../schemas/expense.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Category, CategorySchema } from '../schemas/category.schema';
import { SettingsModule } from '../settings/settings.module';
import { EmailService } from './email.service';
import { EmailSenderService } from './email-sender.service';
import { EmailController } from './email.controller';
import { ImapMonitorService } from './imap-monitor.service';
import { GroqProvider } from './llm/groq.provider';
import { OllamaProvider } from './llm/ollama.provider';
import { LLMProviderFactory } from './llm/llm-provider.factory';
import { RegexParser } from './parsers/regex.parser';
import { AIParser } from './parsers/ai.parser';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    SettingsModule,
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailSenderService,
    ImapMonitorService,
    GroqProvider,
    OllamaProvider,
    LLMProviderFactory,
    RegexParser,
    AIParser,
  ],
})
export class EmailModule {}
