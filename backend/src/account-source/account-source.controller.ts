import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AccountSourceService } from './account-source.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('account-sources')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AccountSourceController {
  constructor(private service: AccountSourceService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(
    @Body('label') label: string,
    @Body('icon') icon: string,
  ) {
    return this.service.create(label, icon);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body('label') label?: string,
    @Body('icon') icon?: string,
    @Body('isActive') isActive?: boolean,
  ) {
    return this.service.update(id, { label, icon, isActive });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
