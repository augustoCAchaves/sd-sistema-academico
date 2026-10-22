import { type AlunoLogado, encerrarSessao, sessao } from './sessao';

const BASE = '/api/v1';

export interface Turma {
  codigo_turma: string;
  nome_disciplina: string;
  vagas_totais: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
  pre_requisitos: string[];
}

export type StatusMatricula = 'DEFERIDA' | 'INDEFERIDA_SEM_VAGA' | 'INDEFERIDA_PRE_REQUISITO';

export interface Matricula {
  protocolo: string;
  codigo_turma: string;
  status: StatusMatricula;
  mensagem: string;
  pendencias: string[];
  solicitada_em: string;
}

export interface Historico {
  matricula_aluno: string;
  nome: string;
  aprovadas: { codigo: string; nome: string }[];
}

export interface LoginResposta {
  access_token: string;
  token_type: string;
  expires_in: number;
  aluno: AlunoLogado;
}

export interface CorpoErro {
  status: number;
  erro: string;
  mensagem: string;
  detalhes: string[];
  correlation_id: string;
}

export interface Resposta<T> {
  status: number;
  dados: T;
  cid: string;
}

export class FalhaApi extends Error {
  constructor(readonly corpo: CorpoErro) {
    super(corpo.mensagem);
  }

  get status(): number {
    return this.corpo.status;
  }
}

async function requisitar<T>(metodo: string, caminho: string, corpo?: unknown, headers: Record<string, string> = {}): Promise<Resposta<T>> {
  const autorizacao: Record<string, string> = sessao.token ? { Authorization: `Bearer ${sessao.token}` } : {};

  let resp: Response;
  try {
    resp = await fetch(BASE + caminho, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...autorizacao, ...headers },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new FalhaApi({ status: 0, erro: 'SEM_CONEXAO', mensagem: 'Não foi possível falar com o API Gateway.', detalhes: [], correlation_id: '-' });
  }

  const cid = resp.headers.get('x-correlation-id') ?? '-';
  const dados = await resp.json().catch(() => null);

  if (!resp.ok) {
    // Sem corpo JSON: a resposta não veio do gateway (ex.: 502 do nginx com o gateway fora do ar).
    const erro: CorpoErro = dados ?? { status: resp.status, erro: resp.statusText, mensagem: `Falha HTTP ${resp.status} antes de chegar ao gateway.`, detalhes: [], correlation_id: cid };
    if (resp.status === 401 && autorizacao.Authorization) {
      encerrarSessao('Sua sessão expirou ou o token é inválido. Entre novamente.');
    }
    throw new FalhaApi(erro);
  }

  if (dados === null) {
    throw new FalhaApi({ status: resp.status, erro: 'RESPOSTA_INVALIDA', mensagem: 'A resposta não veio do gateway (corpo sem JSON).', detalhes: [], correlation_id: cid });
  }
  return { status: resp.status, dados: dados as T, cid };
}

export const api = {
  login: (usuario: string, senha: string) => requisitar<LoginResposta>('POST', '/auth/login', { usuario, senha }),
  turmas: () => requisitar<Turma[]>('GET', '/turmas'),
  solicitarMatricula: (codigo_turma: string, idempotencyKey: string) =>
    requisitar<Matricula>('POST', '/matriculas', { codigo_turma }, { 'Idempotency-Key': idempotencyKey }),
  minhasMatriculas: () => requisitar<Matricula[]>('GET', '/matriculas'),
  historico: () => requisitar<Historico>('GET', '/historico'),
};

// crypto.randomUUID só existe em contexto seguro (HTTPS ou localhost); na VM o acesso é por http://IP.
export function novoUuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
