import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<AuthResponseDto>;
    refresh(req: any): Promise<AuthResponseDto>;
}
