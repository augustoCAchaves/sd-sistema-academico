import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RegistroController } from './registro.controller';
import { RegistroService } from './registro.service';

@Module({
  controllers: [RegistroController],
  providers: [PrismaService, RegistroService],
})
export class AppModule {}
