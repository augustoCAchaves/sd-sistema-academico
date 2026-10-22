import { randomUUID } from 'node:crypto';
import { CORRELATION_ID_HEADER } from '@academico/contratos-grpc';
import { NextFunction, Request, Response } from 'express';
import { log } from './log';

const CID_VALIDO = /^[A-Za-z0-9_-]{1,64}$/;

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const recebido = req.header(CORRELATION_ID_HEADER) ?? '';
  const cid = CID_VALIDO.test(recebido) ? recebido : randomUUID().slice(0, 8);
  req.headers[CORRELATION_ID_HEADER] = cid;
  res.setHeader(CORRELATION_ID_HEADER, cid);

  const inicio = Date.now();
  log(`--> ${req.method} ${req.originalUrl} cid=${cid}`);
  res.on('close', () => {
    const abortada = res.writableFinished ? '' : ' (cliente desistiu)';
    log(`<== ${res.statusCode} ${req.method} ${req.originalUrl} cid=${cid} ${Date.now() - inicio}ms${abortada}`);
  });
  next();
}

export function cidDe(req: Request): string {
  return String(req.headers[CORRELATION_ID_HEADER] ?? '-');
}
