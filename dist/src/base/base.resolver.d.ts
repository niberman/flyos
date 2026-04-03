import { BaseType } from './base.type';
import { BaseService } from './base.service';
import { CreateBaseInput } from './dto/create-base.input';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../prisma/tenant.context';
export declare class BaseResolver {
    private readonly baseService;
    private readonly prisma;
    private readonly tenantContext;
    constructor(baseService: BaseService, prisma: PrismaService, tenantContext: TenantContext);
    private bindTenantContext;
    bases(user: {
        userId: string;
        role: string;
    }): Promise<BaseType[]>;
    createBase(user: {
        userId: string;
        role: string;
    }, input: CreateBaseInput): Promise<BaseType>;
}
