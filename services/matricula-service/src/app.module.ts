import { Module } from '@nestjs/common';
import { MatriculaController } from './matricula.controller';
import { MatriculasService } from './matriculas.service';
import { PrismaService } from './prisma.service';
import { RegistroClient } from './registro.client';

@Module({
  controllers: [MatriculaController],
  providers: [PrismaService, RegistroClient, MatriculasService],
})
export class AppModule {}
