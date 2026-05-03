import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CategoriesModule } from './categories/categories.module';
import { BudgetsModule } from './budgets/budgets.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EmailModule } from './email/email.module';
import { AccountSourceModule } from './account-source/account-source.module';
import { SettingsModule } from './settings/settings.module';
import { THROTTLER_CONFIG } from './constants/throttler.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../.env'),
      ],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || process.env.DATABASE_URL),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot(THROTTLER_CONFIG),
    AuthModule,
    ExpensesModule,
    CategoriesModule,
    BudgetsModule,
    AnalyticsModule,
    EmailModule,
    AccountSourceModule,
    SettingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
