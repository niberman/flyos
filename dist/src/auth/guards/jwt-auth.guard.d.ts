import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
export type JwtAuthUser = {
    userId: string;
    role: string;
    organizationId?: string;
};
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private readonly config;
    private readonly prisma;
    private readonly moduleRef;
    constructor(config: ConfigService, prisma: PrismaService, moduleRef: ModuleRef);
    getRequest(context: ExecutionContext): any;
    canActivate(context: ExecutionContext): Promise<boolean>;
    private applyOrganizationContext;
    private parseDevRole;
    private resolveDevUser;
}
export {};
