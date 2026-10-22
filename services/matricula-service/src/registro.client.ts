import {
  RegistroAcademicoService,
  Requisicao,
  ReservarVagaResponse,
  VerificarPreRequisitosResponse,
  criarClienteRegistro,
  ehErroGrpc,
  status,
} from '@academico/contratos-grpc';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { config } from './config';
import { erroGrpc } from './erros';

@Injectable()
export class RegistroClient implements OnModuleDestroy {
  private readonly cliente = criarClienteRegistro(config.registroUrl);

  verificarPreRequisitos(matriculaAluno: string, codigoTurma: string, cid: string): Promise<VerificarPreRequisitosResponse> {
    return this.chamar('VerificarPreRequisitos', { matricula_aluno: matriculaAluno, codigo_turma: codigoTurma }, cid);
  }

  reservarVaga(codigoTurma: string, cid: string): Promise<ReservarVagaResponse> {
    return this.chamar('ReservarVaga', { codigo_turma: codigoTurma }, cid);
  }

  async liberarVaga(codigoTurma: string, cid: string): Promise<void> {
    await this.chamar('LiberarVaga', { codigo_turma: codigoTurma }, cid);
  }

  onModuleDestroy(): void {
    this.cliente.fechar();
  }

  // Repassa o erro do registro com o MESMO código gRPC; sem isso o Nest
  // o transformaria em UNKNOWN, e o gateway, num 500 genérico.
  private async chamar<M extends keyof RegistroAcademicoService & string>(
    metodo: M,
    req: Requisicao<RegistroAcademicoService[M]>,
    cid: string,
  ) {
    try {
      return await this.cliente.chamar(metodo, req, { deadlineMs: config.registroDeadlineMs, correlationId: cid });
    } catch (err) {
      if (!ehErroGrpc(err)) {
        throw err;
      }
      if (err.code === status.UNAVAILABLE) {
        throw erroGrpc(status.UNAVAILABLE, 'Registro academico indisponivel');
      }
      if (err.code === status.DEADLINE_EXCEEDED) {
        throw erroGrpc(status.DEADLINE_EXCEEDED, 'Registro academico nao respondeu no prazo');
      }
      throw erroGrpc(err.code, err.details);
    }
  }
}
