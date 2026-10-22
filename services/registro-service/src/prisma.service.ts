import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from './config';
import { PrismaClient } from './generated/prisma/client';

export function criarAdapter(): PrismaPg {
  return new PrismaPg({ connectionString: config.databaseUrl });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: criarAdapter() });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
