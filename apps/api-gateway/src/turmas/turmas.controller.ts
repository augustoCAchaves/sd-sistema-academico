import { ConsultarVagasResponse, Turma } from '@academico/contratos-grpc';
import { Controller, Get, Param } from '@nestjs/common';
import { Matches } from 'class-validator';
import { Cid } from '../comum/decorators';
import { RegistroGrpc } from '../grpc/grpc.module';

const CODIGO_TURMA = /^[A-Z0-9-]{1,20}$/;
const MENSAGEM_CODIGO = 'codigo_turma deve ter só letras maiúsculas, dígitos e hífen (ex.: SD-2026-1)';

export class CodigoTurmaParams {
  @Matches(CODIGO_TURMA, { message: MENSAGEM_CODIGO })
  codigo!: string;
}

export interface TurmaJson {
  codigo_turma: string;
  nome_disciplina: string;
  vagas_totais: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
  pre_requisitos: string[];
}

export function turmaParaJson(t: Turma | ConsultarVagasResponse): TurmaJson {
  return {
    codigo_turma: t.codigo_turma,
    nome_disciplina: t.nome_disciplina,
    vagas_totais: t.vagas_totais,
    vagas_ocupadas: t.vagas_ocupadas,
    vagas_disponiveis: t.vagas_disponiveis,
    pre_requisitos: t.pre_requisitos,
  };
}

@Controller('turmas')
export class TurmasController {
  constructor(private readonly registro: RegistroGrpc) {}

  @Get()
  async listar(@Cid() cid: string): Promise<TurmaJson[]> {
    const { turmas } = await this.registro.chamar('ListarTurmas', {}, cid);
    return turmas.map(turmaParaJson);
  }

  @Get(':codigo')
  async consultar(@Param() params: CodigoTurmaParams, @Cid() cid: string): Promise<TurmaJson> {
    return turmaParaJson(await this.registro.chamar('ConsultarVagas', { codigo_turma: params.codigo }, cid));
  }
}

export { CODIGO_TURMA, MENSAGEM_CODIGO };
