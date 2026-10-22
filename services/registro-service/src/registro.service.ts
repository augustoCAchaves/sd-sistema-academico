import {
  ConsultarAlunoResponse,
  LiberarVagaResponse,
  ReservarVagaResponse,
  Turma,
  VerificarPreRequisitosResponse,
  status,
} from '@academico/contratos-grpc';
import { Injectable } from '@nestjs/common';
import { erroGrpc } from './erros';
import { PrismaService } from './prisma.service';

const INCLUIR_DISCIPLINA = {
  disciplina: { include: { pre_requisitos: { orderBy: { codigo_pre_requisito: 'asc' } } } },
} as const;

@Injectable()
export class RegistroService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTurmas(): Promise<Turma[]> {
    const turmas = await this.prisma.turma.findMany({ include: INCLUIR_DISCIPLINA, orderBy: { codigo: 'asc' } });
    return turmas.map((t) => this.paraTurma(t));
  }

  async consultarTurma(codigoTurma: string): Promise<Turma> {
    return this.paraTurma(await this.buscarTurma(codigoTurma));
  }

  async verificarPreRequisitos(matriculaAluno: string, codigoTurma: string): Promise<VerificarPreRequisitosResponse> {
    const turma = await this.buscarTurma(codigoTurma);
    const aluno = await this.prisma.aluno.findUnique({
      where: { matricula: matriculaAluno },
      include: { aprovacoes: true },
    });
    if (!aluno) {
      throw erroGrpc(status.NOT_FOUND, `Aluno nao encontrado: ${matriculaAluno}`);
    }

    const aprovadas = new Set(aluno.aprovacoes.map((a) => a.codigo_disciplina));
    const pendentes = turma.disciplina.pre_requisitos
      .map((p) => p.codigo_pre_requisito)
      .filter((codigo) => !aprovadas.has(codigo));

    return { atendido: pendentes.length === 0, disciplinas_pendentes: pendentes };
  }

  async reservarVaga(codigoTurma: string): Promise<ReservarVagaResponse> {
    await this.buscarTurma(codigoTurma);

    // Um único UPDATE: o Postgres trava a linha e reavalia o WHERE. Com duas
    // requisições simultâneas pela última vaga, só uma afeta 1 linha.
    const reservada = await this.prisma.$queryRaw<{ disponiveis: number }[]>`
      UPDATE turmas SET vagas_ocupadas = vagas_ocupadas + 1
       WHERE codigo = ${codigoTurma} AND vagas_ocupadas < vagas_totais
      RETURNING vagas_totais - vagas_ocupadas AS disponiveis`;

    if (reservada.length === 1) {
      return { reservada: true, vagas_disponiveis: reservada[0].disponiveis };
    }
    return { reservada: false, vagas_disponiveis: await this.vagasDisponiveis(codigoTurma) };
  }

  async liberarVaga(codigoTurma: string): Promise<LiberarVagaResponse> {
    await this.buscarTurma(codigoTurma);
    const liberada = await this.prisma.$queryRaw<{ disponiveis: number }[]>`
      UPDATE turmas SET vagas_ocupadas = vagas_ocupadas - 1
       WHERE codigo = ${codigoTurma} AND vagas_ocupadas > 0
      RETURNING vagas_totais - vagas_ocupadas AS disponiveis`;

    return { vagas_disponiveis: liberada[0]?.disponiveis ?? (await this.vagasDisponiveis(codigoTurma)) };
  }

  async consultarAluno(matriculaAluno: string): Promise<ConsultarAlunoResponse> {
    const aluno = await this.prisma.aluno.findUnique({
      where: { matricula: matriculaAluno },
      include: { aprovacoes: { include: { disciplina: true }, orderBy: { codigo_disciplina: 'asc' } } },
    });
    if (!aluno) {
      throw erroGrpc(status.NOT_FOUND, `Aluno nao encontrado: ${matriculaAluno}`);
    }
    return {
      matricula_aluno: aluno.matricula,
      nome: aluno.nome,
      aprovadas: aluno.aprovacoes.map((a) => ({ codigo: a.disciplina.codigo, nome: a.disciplina.nome })),
    };
  }

  private async buscarTurma(codigoTurma: string) {
    const turma = await this.prisma.turma.findUnique({ where: { codigo: codigoTurma }, include: INCLUIR_DISCIPLINA });
    if (!turma) {
      throw erroGrpc(status.NOT_FOUND, `Turma nao encontrada: ${codigoTurma}`);
    }
    return turma;
  }

  private async vagasDisponiveis(codigoTurma: string): Promise<number> {
    const turma = await this.prisma.turma.findUniqueOrThrow({ where: { codigo: codigoTurma } });
    return turma.vagas_totais - turma.vagas_ocupadas;
  }

  private paraTurma(turma: Awaited<ReturnType<RegistroService['buscarTurma']>>): Turma {
    return {
      codigo_turma: turma.codigo,
      nome_disciplina: turma.disciplina.nome,
      vagas_totais: turma.vagas_totais,
      vagas_ocupadas: turma.vagas_ocupadas,
      vagas_disponiveis: turma.vagas_totais - turma.vagas_ocupadas,
      pre_requisitos: turma.disciplina.pre_requisitos.map((p) => p.codigo_pre_requisito),
    };
  }
}
