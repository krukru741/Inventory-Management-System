import { Controller, Post, UseGuards, Request, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and return JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Successful login', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Request() req: any) {
    // req.user is populated by LocalStrategy
    return this.authService.login(req.user);
  }

  // A refresh token endpoint would usually verify a separate refresh token,
  // but for a simple 1d token, we can just reissue a new one if they have a valid token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token using a valid active token' })
  @ApiResponse({ status: 200, description: 'Refreshed token', type: AuthResponseDto })
  async refresh(@Request() req: any) {
    return this.authService.login(req.user);
  }
}
