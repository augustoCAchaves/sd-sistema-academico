import {
  CORRELATION_ID_HEADER,
  ListarMatriculasRequest,
  ListarMatriculasResponse,
  MatriculaService as ContratoMatricula,
  Metadata,
  SolicitarMatriculaRequest,
  SolicitarMatriculaResponse,
} from '@academico/contratos-grpc';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { exigirPreenchidos } from './erros';
import { MatriculasService } from './matriculas.service';

const SERVICO = 'MatriculaService';

function cidDe(metadata?: Metadata): string {
  return String(metadata?.get(CORRELATION_ID_HEADER)[0] ?? '-');
}

@Controller()
export class MatriculaController implements ContratoMatricula {
  constructor(private readonly matriculas: MatriculasService) {}

  @GrpcMethod(SERVICO)
  async SolicitarMatricula(req: SolicitarMatriculaRequest, metadata?: Metadata): Promise<SolicitarMatriculaResponse> {
    exigirPreenchidos({ matricula_aluno: req.matricula_aluno, codigo_turma: req.codigo_turma });
    return this.matriculas.solicitar(req, cidDe(metadata));
  }

  @GrpcMethod(SERVICO)
  async ListarMatriculas(req: ListarMatriculasRequest): Promise<ListarMatriculasResponse> {
    exigirPreenchidos({ matricula_aluno: req.matricula_aluno });
    return { matriculas: await this.matriculas.listar(req.matricula_aluno) };
  }
}
