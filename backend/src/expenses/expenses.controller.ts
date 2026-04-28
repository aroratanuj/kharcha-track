import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ExpenseStatus } from '../entities/expense.entity';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  async findAll(@Req() req, @Query('status') status?: ExpenseStatus) {
    return this.expensesService.findAll(req.user.userId, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.expensesService.findOne(id, req.user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updates: any,
    @Req() req,
  ) {
    return this.expensesService.update(id, req.user.userId, updates);
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string, @Req() req) {
    return this.expensesService.confirm(id, req.user.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req) {
    return this.expensesService.delete(id, req.user.userId);
  }

  @Post('bulk-confirm')
  async bulkConfirm(@Body('ids') ids: string[], @Req() req) {
    return this.expensesService.bulkConfirm(ids, req.user.userId);
  }
}
