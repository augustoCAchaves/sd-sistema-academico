import 'reflect-metadata';
import { LOADER_OPTIONS, REGISTRO_PACKAGE, REGISTRO_PROTO } from '@academico/contratos-grpc';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { config } from './config';
import { ErrosFilter } from './erros';
import { log } from './log';
import { LogInterceptor } from './log.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: REGISTRO_PACKAGE,
      protoPath: REGISTRO_PROTO,
      url: `0.0.0.0:${config.porta}`,
      loader: LOADER_OPTIONS,
    },
  });
  app.useGlobalInterceptors(new LogInterceptor());
  app.useGlobalFilters(new ErrosFilter());
  app.enableShutdownHooks();

  await app.listen();
  log(`Escutando gRPC em 0.0.0.0:${config.porta}`);
}

void bootstrap();
