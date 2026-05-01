import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class AuthService {
    private userRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    register(email: string, password: string, fullName: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
        token: string;
    }>;
    getUserById(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
    }>;
    private generateToken;
}
