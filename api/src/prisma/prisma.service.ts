import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      // Consider adding log: ['query', 'info', 'warn', 'error'] during active dev if needed
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
