import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CreateExpenseDto, UpdateExpenseDto, BulkConfirmDto } from '../dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  async create(
    @Body() dto: CreateExpenseDto,
    @Req() req: any,
  ) {
    return this.expensesService.create(
      req.user.userId,
      dto.amount,
      dto.description,
      dto.merchantName,
      dto.date ? new Date(dto.date) : new Date(),
      dto.categoryId,
      dto.status || 'confirmed',
      dto.accountSource,
      dto.notes,
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
    @Body() dto: UpdateExpenseDto,
    @Req() req: any,
  ): Promise<any> {
    return this.expensesService.update(id, req.user.userId, dto);
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
  async bulkConfirm(@Body() dto: BulkConfirmDto, @Req() req) {
    if (dto.ids.length > 100) {
      dto.ids = dto.ids.slice(0, 100);
    }
    return this.expensesService.bulkConfirm(dto.ids, req.user.userId);
  }
}
