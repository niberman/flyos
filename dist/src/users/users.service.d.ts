import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        passwordHash: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findById(id: string): Promise<{
        email: string;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        passwordHash: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
