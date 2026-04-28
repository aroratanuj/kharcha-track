import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Get()
  async findAll(@Req() req) {
    return this.budgetsService.findAll(req.user.userId);
  }

  @Post()
  async create(
    @Body('categoryId') categoryId: string,
    @Body('limit') limit: number,
    @Body('month') month: number,
    @Body('year') year: number,
    @Req() req?: any,
  ) {
    return this.budgetsService.create(req.user.userId, categoryId, limit, month, year);
  }
}
