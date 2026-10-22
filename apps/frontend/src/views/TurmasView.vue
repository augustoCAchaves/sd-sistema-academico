<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FalhaApi, api, novoUuid } from '../api';
import type { Matricula, Resposta, Turma } from '../api';
import ErroApi from '../components/ErroApi.vue';
import StatusBadge from '../components/StatusBadge.vue';

interface Resultado {
  codigo: string;
  chave: string;
  resposta?: Resposta<Matricula>;
  falha?: FalhaApi;
}

const turmas = ref<Turma[]>([]);
const carregando = ref(true);
const falhaLista = ref<FalhaApi | null>(null);
const enviando = ref<string | null>(null);
const resultado = ref<Resultado | null>(null);
const aprovadas = ref<Set<string> | null>(null);

async function carregar(): Promise<void> {
  carregando.value = true;
  try {
    const [t, h] = await Promise.all([api.turmas(), api.historico().catch(() => null)]);
    turmas.value = t.dados;
    aprovadas.value = h && new Set(h.dados.aprovadas.map((d) => d.codigo));
    falhaLista.value = null;
  } catch (e) {
    if (!(e instanceof FalhaApi)) throw e;
    falhaLista.value = e;
  } finally {
    carregando.value = false;
  }
}

// Uma chave por intenção do usuário; a retentativa reaproveita a mesma, e o serviço devolve o mesmo protocolo.
async function solicitar(codigo: string, chave = novoUuid()): Promise<void> {
  enviando.value = codigo;
  try {
    resultado.value = { codigo, chave, resposta: await api.solicitarMatricula(codigo, chave) };
    await carregar();
  } catch (e) {
    if (!(e instanceof FalhaApi)) throw e;
    resultado.value = { codigo, chave, falha: e };
  } finally {
    enviando.value = null;
  }
}

function podeRetentar(r: Resultado): boolean {
  return !!r.falha && (r.falha.status === 0 || r.falha.status >= 500);
}

function requisito(codigo: string): { cor: string; marca: string; dica: string } {
  if (!aprovadas.value) return { cor: '', marca: '', dica: '' };
  return aprovadas.value.has(codigo)
    ? { cor: 'verde', marca: '✓', dica: 'Você já foi aprovado' }
    : { cor: 'vermelho', marca: '✗', dica: 'Você ainda não foi aprovado' };
}

function ocupacao(t: Turma): string {
  return `${Math.round((t.vagas_ocupadas / t.vagas_totais) * 100)}%`;
}

onMounted(carregar);
</script>

<template>
  <div class="cabecalho">
    <div>
      <h1>Turmas abertas</h1>
      <p class="subtitulo">Vagas e pré-requisitos vêm do registro-service; a solicitação passa pelo matricula-service.</p>
    </div>
    <button class="secundario" :disabled="carregando" @click="carregar">Atualizar</button>
  </div>

  <template v-if="resultado">
    <div v-if="resultado.resposta" class="alerta" role="alert" :class="resultado.resposta.dados.status === 'DEFERIDA' ? 'verde' : 'amarelo'">
      <strong>{{ resultado.resposta.status }}</strong> · {{ resultado.codigo }}
      <StatusBadge :status="resultado.resposta.dados.status" /> · {{ resultado.resposta.dados.mensagem }}
      <ul v-if="resultado.resposta.dados.pendencias.length">
        <li v-for="p in resultado.resposta.dados.pendencias" :key="p">Pendente: {{ p }}</li>
      </ul>
      <div class="tecnico">
        protocolo <code>{{ resultado.resposta.dados.protocolo }}</code> · Idempotency-Key <code>{{ resultado.chave }}</code> ·
        correlation id <code>{{ resultado.resposta.cid }}</code>
      </div>
    </div>
    <template v-else-if="resultado.falha">
      <ErroApi :falha="resultado.falha" />
      <button v-if="podeRetentar(resultado)" class="secundario retentar" :disabled="!!enviando" @click="solicitar(resultado.codigo, resultado.chave)">
        Tentar de novo com a mesma Idempotency-Key
      </button>
    </template>
  </template>

  <ErroApi v-if="falhaLista" :falha="falhaLista" />

  <div class="cartao tabela">
    <table>
      <thead>
        <tr>
          <th>Turma</th>
          <th>Pré-requisitos</th>
          <th>Vagas</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in turmas" :key="t.codigo_turma">
          <td>
            <code>{{ t.codigo_turma }}</code>
            <div class="disciplina">{{ t.nome_disciplina }}</div>
          </td>
          <td>
            <template v-if="t.pre_requisitos.length">
              <span v-for="p in t.pre_requisitos" :key="p" class="badge requisito" :class="requisito(p).cor" :title="requisito(p).dica">
                {{ requisito(p).marca }} {{ p }}
              </span>
            </template>
            <span v-else class="tecnico">nenhum</span>
          </td>
          <td class="vagas">
            <span :class="{ lotada: t.vagas_disponiveis === 0 }">
              {{ t.vagas_disponiveis === 0 ? 'Lotada' : `${t.vagas_disponiveis} ${t.vagas_disponiveis === 1 ? 'livre' : 'livres'}` }}
            </span>
            <span class="tecnico">{{ t.vagas_ocupadas }}/{{ t.vagas_totais }}</span>
            <div class="barra"><div :style="{ width: ocupacao(t) }"></div></div>
          </td>
          <td class="acao">
            <button :disabled="!!enviando" :aria-label="`Solicitar matrícula em ${t.codigo_turma}`" @click="solicitar(t.codigo_turma)">
              {{ enviando === t.codigo_turma ? 'Enviando…' : 'Solicitar' }}
            </button>
          </td>
        </tr>
        <tr v-if="!turmas.length && !falhaLista">
          <td colspan="4" class="vazio">{{ carregando ? 'Carregando turmas…' : 'Nenhuma turma encontrada.' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.disciplina {
  margin-top: 2px;
}

.requisito {
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  margin: 2px 4px 2px 0;
}

.requisito:not(.verde):not(.vermelho) {
  background: var(--fundo);
}

.vagas {
  min-width: 160px;
}

.vagas .tecnico {
  margin-left: 8px;
}

.lotada {
  color: var(--vermelho);
  font-weight: 600;
}

.barra {
  height: 6px;
  background: var(--borda);
  border-radius: 3px;
  margin-top: 6px;
  overflow: hidden;
}

.barra div {
  height: 100%;
  background: var(--primaria);
}

.acao {
  text-align: right;
}

.retentar {
  margin: -8px 0 16px;
}
</style>
