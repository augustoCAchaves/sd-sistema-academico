import {
  ClienteGrpc,
  MatriculaService,
  RegistroAcademicoService,
  Requisicao,
  criarClienteMatricula,
  criarClienteRegistro,
} from '@academico/contratos-grpc';
import { Global, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { log } from '../comum/log';
import { config } from '../config';

abstract class ClienteComDeadline<S> implements OnModuleDestroy {
  constructor(
    private readonly nome: string,
    private readonly cliente: ClienteGrpc<S>,
  ) {}

  async chamar<M extends keyof S & string>(metodo: M, req: Requisicao<S[M]>, cid: string) {
    log(`    gRPC --> ${this.nome}.${metodo} cid=${cid}`);
    const resposta = await this.cliente.chamar(metodo, req, { deadlineMs: config.grpcDeadlineMs, correlationId: cid });
    log(`    gRPC <== ${this.nome}.${metodo} cid=${cid} OK`);
    return resposta;
  }

  onModuleDestroy(): void {
    this.cliente.fechar();
  }
}

@Injectable()
export class RegistroGrpc extends ClienteComDeadline<RegistroAcademicoService> {
  constructor() {
    super('registro', criarClienteRegistro(config.registroUrl));
  }
}

@Injectable()
export class MatriculaGrpc extends ClienteComDeadline<MatriculaService> {
  constructor() {
    super('matricula', criarClienteMatricula(config.matriculaUrl));
  }
}

@Global()
@Module({
  providers: [RegistroGrpc, MatriculaGrpc],
  exports: [RegistroGrpc, MatriculaGrpc],
})
export class GrpcModule {}
