import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(input: RegisterInput): Promise<{
        access_token: string;
    }>;
    login(input: LoginInput): Promise<{
        access_token: string;
    }>;
}
