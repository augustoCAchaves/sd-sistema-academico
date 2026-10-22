import { reactive } from 'vue';

const CHAVE = 'sd-academico.sessao';

export interface AlunoLogado {
  matricula_aluno: string;
  nome: string;
}

interface Sessao {
  token: string | null;
  aluno: AlunoLogado | null;
  aviso: string;
}

function carregar(): Pick<Sessao, 'token' | 'aluno'> {
  try {
    const salvo = JSON.parse(sessionStorage.getItem(CHAVE) ?? 'null');
    if (salvo?.token && salvo?.aluno) {
      return { token: salvo.token, aluno: salvo.aluno };
    }
  } catch {}
  return { token: null, aluno: null };
}

export const sessao = reactive<Sessao>({ ...carregar(), aviso: '' });

export function iniciarSessao(token: string, aluno: AlunoLogado): void {
  sessao.token = token;
  sessao.aluno = aluno;
  sessao.aviso = '';
  sessionStorage.setItem(CHAVE, JSON.stringify({ token, aluno }));
}

export function encerrarSessao(aviso = ''): void {
  sessao.token = null;
  sessao.aluno = null;
  sessao.aviso = aviso;
  sessionStorage.removeItem(CHAVE);
}
