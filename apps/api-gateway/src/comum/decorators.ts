import { ExecutionContext, SetMetadata, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { cidDe } from './correlation-id.middleware';

export interface AlunoAutenticado {
  sub: string;
  nome: string;
}

export const ROTA_PUBLICA = 'rotaPublica';

export const Public = () => SetMetadata(ROTA_PUBLICA, true);

export const Cid = createParamDecorator((_dado: unknown, ctx: ExecutionContext): string =>
  cidDe(ctx.switchToHttp().getRequest<Request>()),
);

export const Aluno = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext): AlunoAutenticado =>
    ctx.switchToHttp().getRequest<Request & { aluno: AlunoAutenticado }>().aluno,
);
