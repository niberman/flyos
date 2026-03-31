import { UserType } from './user.type';
import { UsersService } from './users.service';
export declare class UsersResolver {
    private readonly usersService;
    constructor(usersService: UsersService);
    me(user: {
        userId: string;
        role: string;
    }): Promise<UserType>;
    users(): Promise<UserType[]>;
}
