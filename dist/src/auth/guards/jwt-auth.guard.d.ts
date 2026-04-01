import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private readonly config;
    private readonly prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    getRequest(context: ExecutionContext): any;
    canActivate(context: ExecutionContext): Promise<boolean>;
    private parseDevRole;
    private resolveDevUser;
}
export {};
