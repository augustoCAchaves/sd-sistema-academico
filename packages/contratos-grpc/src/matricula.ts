export type StatusMatricula =
  | 'STATUS_MATRICULA_NAO_ESPECIFICADO'
  | 'DEFERIDA'
  | 'INDEFERIDA_SEM_VAGA'
  | 'INDEFERIDA_PRE_REQUISITO';

export interface SolicitarMatriculaRequest {
  matricula_aluno: string;
  codigo_turma: string;
  request_id: string;
}

export interface SolicitarMatriculaResponse {
  protocolo: string;
  status: StatusMatricula;
  mensagem: string;
  pendencias: string[];
  codigo_turma: string;
  solicitada_em: string;
}

export interface Matricula {
  protocolo: string;
  codigo_turma: string;
  status: StatusMatricula;
  mensagem: string;
  pendencias: string[];
  solicitada_em: string;
}

export interface ListarMatriculasRequest {
  matricula_aluno: string;
}

export interface ListarMatriculasResponse {
  matriculas: Matricula[];
}

export interface MatriculaService {
  SolicitarMatricula(req: SolicitarMatriculaRequest): Promise<SolicitarMatriculaResponse>;
  ListarMatriculas(req: ListarMatriculasRequest): Promise<ListarMatriculasResponse>;
}
