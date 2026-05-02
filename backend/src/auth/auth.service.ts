import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, fullName: string) {
    const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('Registration failed. Please try a different email.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role: 'user',
    });

    const token = this.generateToken(user._id.toString(), user.email, user.role);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user._id.toString(), user.email, user.role);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash').lean();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.fullName,
      role: user.role,
    };
  }

  async findAllUsers(): Promise<any[]> {
    const users = await this.userModel.find().select('-passwordHash').lean();
    return users.map(u => ({
      id: u._id.toString(),
      email: u.email,
      name: u.fullName,
      role: u.role,
    }));
  }

  private generateToken(userId: string, email: string, role: string = 'user'): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }
}
