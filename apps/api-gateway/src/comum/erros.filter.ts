import { ehErroGrpc, status } from '@academico/contratos-grpc';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { cidDe } from './correlation-id.middleware';
import { log } from './log';

const GRPC_PARA_HTTP: Partial<Record<status, HttpStatus>> = {
  [status.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
  [status.UNAUTHENTICATED]: HttpStatus.UNAUTHORIZED,
  [status.PERMISSION_DENIED]: HttpStatus.FORBIDDEN,
  [status.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [status.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [status.FAILED_PRECONDITION]: HttpStatus.CONFLICT,
  [status.ABORTED]: HttpStatus.CONFLICT,
  [status.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [status.DEADLINE_EXCEEDED]: HttpStatus.GATEWAY_TIMEOUT,
};

interface CorpoErro {
  status: number;
  erro: string;
  mensagem: string;
  detalhes: string[];
  correlation_id: string;
}

@Catch()
export class ErrosFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const cid = cidDe(req);
    const corpo = this.traduzir(err, cid);
    http.getResponse<Response>().status(corpo.status).json(corpo);
  }

  private traduzir(err: unknown, cid: string): CorpoErro {
    const montar = (s: number, mensagem: string, detalhes: string[] = []): CorpoErro => ({
      status: s,
      erro: HttpStatus[s] ?? 'ERRO',
      mensagem,
      detalhes,
      correlation_id: cid,
    });

    if (err instanceof HttpException) {
      const resposta = err.getResponse() as string | { message?: string | string[] };
      const mensagem = typeof resposta === 'string' ? resposta : resposta.message;
      if (Array.isArray(mensagem)) {
        return montar(err.getStatus(), 'Dados inválidos.', mensagem);
      }
      return montar(err.getStatus(), mensagem ?? err.message);
    }

    if (ehErroGrpc(err)) {
      const s = GRPC_PARA_HTTP[err.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
      log(`    gRPC <== ${status[err.code]} cid=${cid} -> HTTP ${s}: ${err.details}`);
      return montar(s, err.details);
    }

    log(`ERRO inesperado cid=${cid}: ${err instanceof Error ? err.stack : String(err)}`);
    return montar(HttpStatus.INTERNAL_SERVER_ERROR, 'Erro interno no gateway.');
  }
}
