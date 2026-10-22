import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { correlationId } from './comum/correlation-id.middleware';
import { ErrosFilter } from './comum/erros.filter';
import { log } from './comum/log';
import { config } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api/v1');
  app.use(correlationId);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ErrosFilter());
  app.enableShutdownHooks();

  await app.listen(config.porta, '0.0.0.0');
  log(`Escutando HTTP em 0.0.0.0:${config.porta} (registro em ${config.registroUrl}, matricula em ${config.matriculaUrl})`);
}

void bootstrap();
