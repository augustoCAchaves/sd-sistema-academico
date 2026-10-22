import {
  ConsultarAlunoRequest,
  ConsultarAlunoResponse,
  ConsultarVagasRequest,
  ConsultarVagasResponse,
  LiberarVagaRequest,
  LiberarVagaResponse,
  ListarTurmasResponse,
  RegistroAcademicoService,
  ReservarVagaRequest,
  ReservarVagaResponse,
  VerificarPreRequisitosRequest,
  VerificarPreRequisitosResponse,
} from '@academico/contratos-grpc';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { exigirPreenchidos } from './erros';
import { RegistroService } from './registro.service';

const SERVICO = 'RegistroAcademicoService';

@Controller()
export class RegistroController implements RegistroAcademicoService {
  constructor(private readonly registro: RegistroService) {}

  @GrpcMethod(SERVICO)
  async ConsultarVagas(req: ConsultarVagasRequest): Promise<ConsultarVagasResponse> {
    exigirPreenchidos({ codigo_turma: req.codigo_turma });
    return this.registro.consultarTurma(req.codigo_turma);
  }

  @GrpcMethod(SERVICO)
  async VerificarPreRequisitos(req: VerificarPreRequisitosRequest): Promise<VerificarPreRequisitosResponse> {
    exigirPreenchidos({ matricula_aluno: req.matricula_aluno, codigo_turma: req.codigo_turma });
    return this.registro.verificarPreRequisitos(req.matricula_aluno, req.codigo_turma);
  }

  @GrpcMethod(SERVICO)
  async ListarTurmas(): Promise<ListarTurmasResponse> {
    return { turmas: await this.registro.listarTurmas() };
  }

  @GrpcMethod(SERVICO)
  async ReservarVaga(req: ReservarVagaRequest): Promise<ReservarVagaResponse> {
    exigirPreenchidos({ codigo_turma: req.codigo_turma });
    return this.registro.reservarVaga(req.codigo_turma);
  }

  @GrpcMethod(SERVICO)
  async LiberarVaga(req: LiberarVagaRequest): Promise<LiberarVagaResponse> {
    exigirPreenchidos({ codigo_turma: req.codigo_turma });
    return this.registro.liberarVaga(req.codigo_turma);
  }

  @GrpcMethod(SERVICO)
  async ConsultarAluno(req: ConsultarAlunoRequest): Promise<ConsultarAlunoResponse> {
    exigirPreenchidos({ matricula_aluno: req.matricula_aluno });
    return this.registro.consultarAluno(req.matricula_aluno);
  }
}
