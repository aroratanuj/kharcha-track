import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(@Req() req) {
    return this.analyticsService.getSummary(req.user.userId);
  }

  @Get('by-category')
  async getByCategory(@Req() req) {
    return this.analyticsService.getByCategory(req.user.userId);
  }

  @Get('trends')
  async getTrends(@Req() req) {
    return this.analyticsService.getTrends(req.user.userId);
  }
}
