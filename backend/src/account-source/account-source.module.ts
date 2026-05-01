import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountSource, AccountSourceSchema } from '../schemas/account-source.schema';
import { AccountSourceService } from './account-source.service';
import { AccountSourceController } from './account-source.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: AccountSource.name, schema: AccountSourceSchema }])],
  controllers: [AccountSourceController],
  providers: [AccountSourceService],
  exports: [AccountSourceService],
})
export class AccountSourceModule {}
