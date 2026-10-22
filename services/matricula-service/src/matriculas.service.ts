import { randomUUID } from 'node:crypto';
import { Matricula, SolicitarMatriculaRequest, SolicitarMatriculaResponse, status } from '@academico/contratos-grpc';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { erroGrpc } from './erros';
import { Matricula as LinhaMatricula, StatusMatricula } from './generated/prisma/client';
import { log } from './log';
import { PrismaService } from './prisma.service';
import { RegistroClient } from './registro.client';

interface NovaMatricula {
  request_id: string;
  matricula_aluno: string;
  codigo_turma: string;
  status: StatusMatricula;
  mensagem: string;
  pendencias: string[];
}

function jaMatriculado(codigoTurma: string) {
  return erroGrpc(status.ALREADY_EXISTS, `Aluno ja matriculado na turma ${codigoTurma}`);
}

function violouUnicidade(err: unknown): boolean {
  return (err as { code?: unknown } | null)?.code === 'P2002';
}

@Injectable()
export class MatriculasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registro: RegistroClient,
  ) {}

  async solicitar(req: SolicitarMatriculaRequest, cid: string): Promise<SolicitarMatriculaResponse> {
    const base = {
      request_id: req.request_id || randomUUID(),
      matricula_aluno: req.matricula_aluno,
      codigo_turma: req.codigo_turma,
    };

    const anterior = await this.prisma.matricula.findUnique({ where: { request_id: base.request_id } });
    if (anterior) {
      return this.repeticao(anterior, base, cid);
    }

    const deferida = await this.prisma.matricula.findFirst({
      where: { matricula_aluno: base.matricula_aluno, codigo_turma: base.codigo_turma, status: 'DEFERIDA' },
    });
    if (deferida) {
      throw jaMatriculado(base.codigo_turma);
    }

    const pre = await this.registro.verificarPreRequisitos(base.matricula_aluno, base.codigo_turma, cid);
    if (!pre.atendido) {
      return this.gravar({
        ...base,
        status: 'INDEFERIDA_PRE_REQUISITO',
        mensagem: `Pre-requisitos nao cumpridos para a turma ${base.codigo_turma}.`,
        pendencias: pre.disciplinas_pendentes,
      }, cid);
    }

    const reserva = await this.registro.reservarVaga(base.codigo_turma, cid).catch((err: unknown) => {
      if (err instanceof RpcException && (err.getError() as { code?: unknown }).code === status.DEADLINE_EXCEEDED) {
        log(`!! cid=${cid} ReservarVaga estourou o prazo: a vaga de ${base.codigo_turma} pode ter sido ocupada sem matricula`);
      }
      throw err;
    });
    if (!reserva.reservada) {
      return this.gravar({
        ...base,
        status: 'INDEFERIDA_SEM_VAGA',
        mensagem: `Turma ${base.codigo_turma} lotada: nao ha vagas disponiveis.`,
        pendencias: [],
      }, cid);
    }

    return this.gravar({
      ...base,
      status: 'DEFERIDA',
      mensagem: `Matricula deferida na turma ${base.codigo_turma}. Restam ${reserva.vagas_disponiveis} vagas.`,
      pendencias: [],
    }, cid, () => this.compensar(base.codigo_turma, cid));
  }

  async listar(matriculaAluno: string): Promise<Matricula[]> {
    const linhas = await this.prisma.matricula.findMany({
      where: { matricula_aluno: matriculaAluno },
      orderBy: { solicitada_em: 'desc' },
    });
    return linhas.map((m) => this.paraResposta(m));
  }

  private async gravar(
    dados: NovaMatricula,
    cid: string,
    compensar?: () => Promise<void>,
  ): Promise<SolicitarMatriculaResponse> {
    try {
      return this.paraResposta(await this.prisma.matricula.create({ data: dados }));
    } catch (err) {
      if (compensar) {
        await compensar();
      }
      if (!violouUnicidade(err)) {
        throw err;
      }
      // Duas causas possíveis: a MESMA requisição chegou em paralelo (a linha
      // dela já existe) ou outra requisição deferiu primeiro (índice único).
      const mesma = await this.prisma.matricula.findUnique({ where: { request_id: dados.request_id } });
      if (mesma) {
        return this.repeticao(mesma, dados, cid);
      }
      throw jaMatriculado(dados.codigo_turma);
    }
  }

  private async compensar(codigoTurma: string, cid: string): Promise<void> {
    log(`!! cid=${cid} falha ao gravar a matricula deferida: liberando a vaga de ${codigoTurma} (compensacao)`);
    try {
      await this.registro.liberarVaga(codigoTurma, cid);
    } catch (err) {
      log(`!! cid=${cid} compensacao falhou, vaga de ${codigoTurma} ficou ocupada: ${String(err)}`);
    }
  }

  private repeticao(
    gravada: LinhaMatricula,
    pedido: Pick<NovaMatricula, 'request_id' | 'matricula_aluno' | 'codigo_turma'>,
    cid: string,
  ): SolicitarMatriculaResponse {
    if (gravada.matricula_aluno !== pedido.matricula_aluno || gravada.codigo_turma !== pedido.codigo_turma) {
      throw erroGrpc(status.ALREADY_EXISTS, 'request_id ja utilizado por outra solicitacao');
    }
    log(`== cid=${cid} repeticao do request_id=${pedido.request_id}: devolvendo a resposta gravada`);
    return this.paraResposta(gravada);
  }

  private paraResposta(m: LinhaMatricula): SolicitarMatriculaResponse {
    return {
      protocolo: m.protocolo,
      status: m.status,
      mensagem: m.mensagem,
      pendencias: m.pendencias,
      codigo_turma: m.codigo_turma,
      solicitada_em: m.solicitada_em.toISOString(),
    };
  }
}
