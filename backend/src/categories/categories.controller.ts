import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';

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
    @Body() dto: CreateCategoryDto,
    @Req() req?: any,
  ) {
    return this.categoriesService.create(req.user.userId, dto.name, dto.color, dto.icon);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req,
  ) {
    return this.categoriesService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req) {
    return this.categoriesService.delete(id, req.user.userId);
  }
}
