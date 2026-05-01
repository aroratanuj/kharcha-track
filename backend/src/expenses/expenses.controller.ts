import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AccountSource } from '../constants/account-source.enum';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  async create(
    @Body('amount') amount: number,
    @Body('description') description: string,
    @Body('merchantName') merchantName?: string,
    @Body('date') date?: string,
    @Body('categoryId') categoryId?: string,
    @Body('status') status?: string,
    @Body('accountSource') accountSource?: AccountSource,
    @Body('notes') notes?: string,
    @Req() req?: any,
  ) {
    return this.expensesService.create(
      req.user.userId,
      amount,
      description,
      merchantName,
      date ? new Date(date) : new Date(),
      categoryId,
      status || 'confirmed',
      accountSource,
      notes,
    );
  }

  @Get()
  async findAll(@Req() req: any, @Query('status') status?: string): Promise<any> {
    return this.expensesService.findAll(req.user.userId, status);
  }

  @Get('all')
  @UseGuards(AdminGuard)
  async findAllAdmin(@Query('userId') userId?: string, @Query('status') status?: string): Promise<any> {
    return this.expensesService.findAllAdmin(userId, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any): Promise<any> {
    return this.expensesService.findOne(id, req.user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updates: any,
    @Req() req: any,
  ): Promise<any> {
    return this.expensesService.update(id, req.user.userId, updates);
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string, @Req() req: any): Promise<any> {
    return this.expensesService.confirm(id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async delete(@Param('id') id: string) {
    return this.expensesService.delete(id);
  }

  @Post('bulk-confirm')
  async bulkConfirm(@Body('ids') ids: string[], @Req() req) {
    return this.expensesService.bulkConfirm(ids, req.user.userId);
  }
}
