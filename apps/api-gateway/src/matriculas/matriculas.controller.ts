import { randomUUID } from 'node:crypto';
import { Matricula, SolicitarMatriculaRequest, SolicitarMatriculaResponse } from '@academico/contratos-grpc';
import { BadRequestException, Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { IsNotEmpty, IsString, Matches, MaxLength, isUUID } from 'class-validator';
import { Aluno, AlunoAutenticado, Cid } from '../comum/decorators';
import { MatriculaGrpc } from '../grpc/grpc.module';
import { CODIGO_TURMA, MENSAGEM_CODIGO } from '../turmas/turmas.controller';

export class SolicitarMatriculaDto {
  @IsString({ message: 'codigo_turma deve ser texto' })
  @IsNotEmpty({ message: 'codigo_turma é obrigatório' })
  @MaxLength(20, { message: 'codigo_turma deve ter no máximo 20 caracteres' })
  @Matches(CODIGO_TURMA, { message: MENSAGEM_CODIGO })
  codigo_turma!: string;
}

export interface MatriculaJson {
  protocolo: string;
  codigo_turma: string;
  status: string;
  mensagem: string;
  pendencias: string[];
  solicitada_em: string;
}

export function solicitacaoParaProto(dto: SolicitarMatriculaDto, aluno: AlunoAutenticado, requestId: string): SolicitarMatriculaRequest {
  return { matricula_aluno: aluno.sub, codigo_turma: dto.codigo_turma, request_id: requestId };
}

export function matriculaParaJson(m: Matricula | SolicitarMatriculaResponse): MatriculaJson {
  return {
    protocolo: m.protocolo,
    codigo_turma: m.codigo_turma,
    status: m.status,
    mensagem: m.mensagem,
    pendencias: m.pendencias,
    solicitada_em: m.solicitada_em,
  };
}

@Controller('matriculas')
export class MatriculasController {
  constructor(private readonly matricula: MatriculaGrpc) {}

  @Post()
  async solicitar(
    @Body() dto: SolicitarMatriculaDto,
    @Headers('idempotency-key') chave: string | undefined,
    @Aluno() aluno: AlunoAutenticado,
    @Cid() cid: string,
  ): Promise<MatriculaJson> {
    if (chave !== undefined && !isUUID(chave)) {
      throw new BadRequestException(['Idempotency-Key deve ser um UUID']);
    }
    const req = solicitacaoParaProto(dto, aluno, chave ?? randomUUID());
    return matriculaParaJson(await this.matricula.chamar('SolicitarMatricula', req, cid));
  }

  @Get()
  async listar(@Aluno() aluno: AlunoAutenticado, @Cid() cid: string): Promise<MatriculaJson[]> {
    const { matriculas } = await this.matricula.chamar('ListarMatriculas', { matricula_aluno: aluno.sub }, cid);
    return matriculas.map(matriculaParaJson);
  }
}
