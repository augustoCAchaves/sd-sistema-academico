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

const MENSAGEM_5XX: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Serviço interno indisponível. Tente novamente em instantes.',
  [HttpStatus.GATEWAY_TIMEOUT]: 'O serviço interno não respondeu no prazo.',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno ao processar a requisição.',
};

// Mensagens técnicas do grpc-js (com IP e porta internos) não vão para o cliente.
const DETALHE_TECNICO = /No connection established|Deadline exceeded|Name resolution|LB pick|Connection dropped|ECONNREFUSED/;

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
      if (err.getStatus() === HttpStatus.BAD_REQUEST && /JSON/.test(mensagem ?? '')) {
        return montar(HttpStatus.BAD_REQUEST, 'JSON malformado no corpo da requisição.');
      }
      return montar(err.getStatus(), mensagem ?? err.message);
    }

    if (ehErroGrpc(err)) {
      const s = GRPC_PARA_HTTP[err.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
      log(`    gRPC <== ${status[err.code]} cid=${cid} -> HTTP ${s}: ${err.details}`);
      const tecnico = s >= 500 && (DETALHE_TECNICO.test(err.details) || !err.details);
      return montar(s, tecnico ? (MENSAGEM_5XX[s] ?? MENSAGEM_5XX[500]!) : err.details);
    }

    // Erros do body parser do Express (corpo grande demais, encoding inválido...).
    const httpStatus = (err as { status?: unknown }).status;
    if (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500) {
      return montar(httpStatus, httpStatus === 413 ? 'Corpo da requisição grande demais.' : 'Requisição inválida.');
    }

    log(`ERRO inesperado cid=${cid}: ${err instanceof Error ? err.stack : String(err)}`);
    return montar(HttpStatus.INTERNAL_SERVER_ERROR, 'Erro interno no gateway.');
  }
}
