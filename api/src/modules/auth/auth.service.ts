import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user && user.isActive) {
        // pgcrypto crypt() generated hashes start with $2a$ or $2b$, bcrypt can verify them
        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (isMatch) {
          const { passwordHash, ...result } = user;
          return result;
        }
      }
      return null;
    } catch (error) {
      console.error("PRISMA ERROR", error);
      throw error;
    }
  }

  async login(user: any): Promise<AuthResponseDto> {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '1d',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }
}
