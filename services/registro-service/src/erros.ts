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
  if (vazios.length === 1) {
    throw erroGrpc(status.INVALID_ARGUMENT, `${vazios[0]} e obrigatorio`);
  }
  if (vazios.length > 1) {
    throw erroGrpc(status.INVALID_ARGUMENT, `${vazios.join(' e ')} sao obrigatorios`);
  }
}

const CODIGOS_BANCO_FORA = [
  'P1001', 'P1002', 'P1008', 'P1017',
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN',
  '57P01', '57P03', '08001', '08003', '08006',
];
const TIPOS_BANCO_FORA = ['DatabaseNotReachable', 'ConnectionClosed', 'SocketTimeout', 'TooManyConnections'];

interface ErroBanco {
  code?: unknown;
  message?: unknown;
  cause?: { code?: unknown };
  meta?: { driverAdapterError?: { cause?: { kind?: unknown; originalCode?: unknown; code?: unknown } } };
}

// O adapter-pg do Prisma 7 esconde a causa real em meta.driverAdapterError
// (o $executeRaw, por exemplo, sempre chega como P2010).
function bancoIndisponivel(err: unknown): boolean {
  const e = (err ?? {}) as ErroBanco;
  const causa = e.meta?.driverAdapterError?.cause;
  const codigos = [e.code, e.cause?.code, causa?.originalCode, causa?.code];
  return (
    codigos.some((c) => typeof c === 'string' && CODIGOS_BANCO_FORA.includes(c)) ||
    (typeof causa?.kind === 'string' && TIPOS_BANCO_FORA.includes(causa.kind)) ||
    (typeof e.message === 'string' && /connection terminated|connection closed/i.test(e.message))
  );
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
