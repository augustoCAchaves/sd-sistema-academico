import { join } from 'node:path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import type { MatriculaService } from './matricula';
import type { RegistroAcademicoService } from './registro';

export const PROTO_DIR = join(__dirname, '..', 'proto');
export const REGISTRO_PROTO = join(PROTO_DIR, 'registro.proto');
export const MATRICULA_PROTO = join(PROTO_DIR, 'matricula.proto');
export const REGISTRO_PACKAGE = 'registro';
export const MATRICULA_PACKAGE = 'matricula';

export const LOADER_OPTIONS: protoLoader.Options = {
  keepCase: true,
  enums: String,
  longs: String,
  defaults: true,
  arrays: true,
};

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export interface OpcoesChamada {
  deadlineMs: number;
  correlationId?: string;
}

export type Requisicao<F> = F extends (req: infer R) => unknown ? R : never;
export type Resposta<F> = F extends (...args: never[]) => Promise<infer R> ? R : never;

type MetodoUnario = (
  req: unknown,
  metadata: grpc.Metadata,
  options: grpc.CallOptions,
  callback: (err: grpc.ServiceError | null, res: unknown) => void,
) => grpc.ClientUnaryCall;

export class ClienteGrpc<S> {
  private readonly cliente: grpc.Client;

  constructor(protoPath: string, pacote: string, servico: string, endereco: string) {
    const definicao = protoLoader.loadSync(protoPath, LOADER_OPTIONS);
    const pkg = grpc.loadPackageDefinition(definicao)[pacote] as grpc.GrpcObject;
    const Construtor = pkg[servico] as grpc.ServiceClientConstructor;
    this.cliente = new Construtor(endereco, grpc.credentials.createInsecure(), {
      'grpc.max_reconnect_backoff_ms': 2000,
    });
  }

  chamar<M extends keyof S & string>(
    metodo: M,
    req: Requisicao<S[M]>,
    opcoes: OpcoesChamada,
  ): Promise<Resposta<S[M]>> {
    const metadata = new grpc.Metadata();
    if (opcoes.correlationId) {
      metadata.set(CORRELATION_ID_HEADER, opcoes.correlationId);
    }
    const fn = (this.cliente as unknown as Record<string, MetodoUnario>)[metodo];

    return new Promise((resolve, reject) => {
      fn.call(this.cliente, req, metadata, { deadline: Date.now() + opcoes.deadlineMs }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res as Resposta<S[M]>);
        }
      });
    });
  }

  fechar(): void {
    this.cliente.close();
  }
}

export function criarClienteRegistro(endereco: string): ClienteGrpc<RegistroAcademicoService> {
  return new ClienteGrpc(REGISTRO_PROTO, REGISTRO_PACKAGE, 'RegistroAcademicoService', endereco);
}

export function criarClienteMatricula(endereco: string): ClienteGrpc<MatriculaService> {
  return new ClienteGrpc(MATRICULA_PROTO, MATRICULA_PACKAGE, 'MatriculaService', endereco);
}

// Erros de rede do Node também têm `code`, mas como string ('ECONNREFUSED').
export function ehErroGrpc(err: unknown): err is grpc.ServiceError {
  return typeof err === 'object' && err !== null && typeof (err as { code?: unknown }).code === 'number';
}
