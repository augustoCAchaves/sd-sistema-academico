import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AlunoAutenticado, ROTA_PUBLICA } from '../comum/decorators';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [ctx.getHandler(), ctx.getClass()]);
    if (publica) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<Request & { aluno?: AlunoAutenticado }>();
    const [tipo, token] = (req.header('authorization') ?? '').split(' ');
    if (tipo?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Token ausente: envie Authorization: Bearer <token>.');
    }

    try {
      req.aluno = await this.jwt.verifyAsync<AlunoAutenticado>(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
    return true;
  }
}
