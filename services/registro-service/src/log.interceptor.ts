import { CORRELATION_ID_HEADER, Metadata, status } from '@academico/contratos-grpc';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { log } from './log';

function descreverErro(err: unknown): string {
  if (err instanceof RpcException) {
    const { code, message } = err.getError() as { code: status; message: string };
    return `${status[code]} ${message}`;
  }
  const e = err as { name?: string; code?: unknown; message?: string; cause?: { code?: unknown } };
  const codigo = e.code ?? e.cause?.code ?? e.name ?? 'erro';
  return `FALHA ${String(codigo)} ${e.message?.split('\n')[0] ?? ''}`.trim();
}

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const rpc = ctx.switchToRpc();
    const metodo = ctx.getHandler().name;
    const cid = rpc.getContext<Metadata>().get(CORRELATION_ID_HEADER)[0] ?? '-';
    const inicio = Date.now();

    log(`--> ${metodo} cid=${cid} ${JSON.stringify(rpc.getData())}`);
    return next.handle().pipe(
      tap((resposta) => log(`<== ${metodo} cid=${cid} OK ${Date.now() - inicio}ms ${JSON.stringify(resposta)}`)),
      catchError((err: unknown) => {
        log(`<== ${metodo} cid=${cid} ${descreverErro(err)} ${Date.now() - inicio}ms`);
        return throwError(() => err);
      }),
    );
  }
}
