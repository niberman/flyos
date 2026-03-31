import { Role } from '@prisma/client';
export declare class RegisterInput {
    email: string;
    password: string;
    role?: Role;
}
