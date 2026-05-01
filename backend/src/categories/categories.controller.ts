import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  async create(
    @Body('name') name: string,
    @Body('color') color?: string,
    @Body('icon') icon?: string,
    @Req() req?: any,
  ) {
    return this.categoriesService.create(req.user.userId, name, color, icon);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updates: any,
    @Req() req,
  ) {
    return this.categoriesService.update(id, req.user.userId, updates);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req) {
    return this.categoriesService.delete(id, req.user.userId);
  }
}
