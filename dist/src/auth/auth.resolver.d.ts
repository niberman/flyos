import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.type';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
export declare class AuthResolver {
    private readonly authService;
    constructor(authService: AuthService);
    register(input: RegisterInput): Promise<AuthResponse>;
    login(input: LoginInput): Promise<AuthResponse>;
}
