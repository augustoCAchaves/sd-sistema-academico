export interface ConsultarVagasRequest {
  codigo_turma: string;
}

export interface ConsultarVagasResponse {
  codigo_turma: string;
  nome_disciplina: string;
  vagas_totais: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
  pre_requisitos: string[];
}

export interface VerificarPreRequisitosRequest {
  matricula_aluno: string;
  codigo_turma: string;
}

export interface VerificarPreRequisitosResponse {
  atendido: boolean;
  disciplinas_pendentes: string[];
}

export interface Turma {
  codigo_turma: string;
  nome_disciplina: string;
  vagas_totais: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
  pre_requisitos: string[];
}

export type ListarTurmasRequest = Record<string, never>;

export interface ListarTurmasResponse {
  turmas: Turma[];
}

export interface ReservarVagaRequest {
  codigo_turma: string;
}

export interface ReservarVagaResponse {
  reservada: boolean;
  vagas_disponiveis: number;
}

export interface LiberarVagaRequest {
  codigo_turma: string;
}

export interface LiberarVagaResponse {
  vagas_disponiveis: number;
}

export interface ConsultarAlunoRequest {
  matricula_aluno: string;
}

export interface Disciplina {
  codigo: string;
  nome: string;
}

export interface ConsultarAlunoResponse {
  matricula_aluno: string;
  nome: string;
  aprovadas: Disciplina[];
}

export interface RegistroAcademicoService {
  ConsultarVagas(req: ConsultarVagasRequest): Promise<ConsultarVagasResponse>;
  VerificarPreRequisitos(req: VerificarPreRequisitosRequest): Promise<VerificarPreRequisitosResponse>;
  ListarTurmas(req: ListarTurmasRequest): Promise<ListarTurmasResponse>;
  ReservarVaga(req: ReservarVagaRequest): Promise<ReservarVagaResponse>;
  LiberarVaga(req: LiberarVagaRequest): Promise<LiberarVagaResponse>;
  ConsultarAluno(req: ConsultarAlunoRequest): Promise<ConsultarAlunoResponse>;
}
