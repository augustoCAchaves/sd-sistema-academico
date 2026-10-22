import { randomUUID } from 'node:crypto';
import { CORRELATION_ID_HEADER } from '@academico/contratos-grpc';
import { NextFunction, Request, Response } from 'express';
import { log } from './log';

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const cid = req.header(CORRELATION_ID_HEADER) || randomUUID().slice(0, 8);
  req.headers[CORRELATION_ID_HEADER] = cid;
  res.setHeader(CORRELATION_ID_HEADER, cid);

  const inicio = Date.now();
  log(`--> ${req.method} ${req.originalUrl} cid=${cid}`);
  res.on('finish', () => {
    log(`<== ${res.statusCode} ${req.method} ${req.originalUrl} cid=${cid} ${Date.now() - inicio}ms`);
  });
  next();
}

export function cidDe(req: Request): string {
  return String(req.headers[CORRELATION_ID_HEADER] ?? '-');
}
