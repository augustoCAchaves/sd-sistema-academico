import { Controller, Get, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { Public } from './comum/decorators';
import { GrpcModule } from './grpc/grpc.module';
import { HistoricoController } from './historico/historico.controller';
import { MatriculasController } from './matriculas/matriculas.controller';
import { TurmasController } from './turmas/turmas.controller';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health() {
    return { status: 'ok' };
  }
}

@Module({
  imports: [GrpcModule, AuthModule],
  controllers: [HealthController, TurmasController, MatriculasController, HistoricoController],
})
export class AppModule {}
