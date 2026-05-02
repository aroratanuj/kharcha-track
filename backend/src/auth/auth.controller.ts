import { Controller, Post, Body, Get, UseGuards, Req, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import crypto from 'crypto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { AdminGuard } from './admin.guard';
import { RegisterDto, LoginDto } from '../dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req) {
    return this.authService.getUserById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('users')
  async listUsers() {
    return this.authService.findAllUsers();
  }
}
