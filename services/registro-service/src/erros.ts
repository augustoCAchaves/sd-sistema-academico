import { status } from '@academico/contratos-grpc';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { log } from './log';

export function erroGrpc(code: status, message: string): RpcException {
  return new RpcException({ code, message });
}

export function exigirPreenchidos(campos: Record<string, string>): void {
  const vazios = Object.keys(campos).filter((nome) => !campos[nome]?.trim());
  if (vazios.length > 0) {
    throw erroGrpc(status.INVALID_ARGUMENT, `${vazios.join(' e ')} obrigatorio(s)`);
  }
}

const CODIGOS_BANCO_FORA = ['P1001', 'P1002', 'P1017', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', '57P01'];

function bancoIndisponivel(err: unknown): boolean {
  const e = err as { code?: unknown; cause?: { code?: unknown } } | null;
  return [e?.code, e?.cause?.code].some((c) => typeof c === 'string' && CODIGOS_BANCO_FORA.includes(c));
}

@Catch()
export class ErrosFilter implements ExceptionFilter {
  catch(err: unknown, _host: ArgumentsHost): Observable<never> {
    if (err instanceof RpcException) {
      return throwError(() => err.getError());
    }
    if (bancoIndisponivel(err)) {
      return throwError(() => ({ code: status.UNAVAILABLE, message: 'Banco de dados do registro indisponivel' }));
    }
    log(`ERRO inesperado: ${err instanceof Error ? err.stack : String(err)}`);
    return throwError(() => ({ code: status.INTERNAL, message: 'Erro interno no registro' }));
  }
}
