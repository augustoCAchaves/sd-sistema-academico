<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FalhaApi, api } from '../api';
import type { Matricula } from '../api';
import ErroApi from '../components/ErroApi.vue';
import StatusBadge from '../components/StatusBadge.vue';

const matriculas = ref<Matricula[]>([]);
const carregando = ref(true);
const falha = ref<FalhaApi | null>(null);

const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

async function carregar(): Promise<void> {
  carregando.value = true;
  try {
    matriculas.value = (await api.minhasMatriculas()).dados;
    falha.value = null;
  } catch (e) {
    if (!(e instanceof FalhaApi)) throw e;
    falha.value = e;
  } finally {
    carregando.value = false;
  }
}

onMounted(carregar);
</script>

<template>
  <div class="cabecalho">
    <div>
      <h1>Minhas matrículas</h1>
      <p class="subtitulo">Todas as solicitações gravadas no matricula_db, deferidas e indeferidas.</p>
    </div>
    <button class="secundario" :disabled="carregando" @click="carregar">Atualizar</button>
  </div>

  <ErroApi v-if="falha" :falha="falha" />

  <div class="cartao tabela">
    <table>
      <thead>
        <tr>
          <th>Turma</th>
          <th>Situação</th>
          <th>Detalhe</th>
          <th>Solicitada em</th>
          <th>Protocolo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in matriculas" :key="m.protocolo">
          <td><code>{{ m.codigo_turma }}</code></td>
          <td><StatusBadge :status="m.status" /></td>
          <td>
            {{ m.mensagem }}
            <div v-if="m.pendencias.length" class="tecnico">Pendente: {{ m.pendencias.join(', ') }}</div>
          </td>
          <td>{{ formatoData.format(new Date(m.solicitada_em)) }}</td>
          <td><code :title="m.protocolo">{{ m.protocolo.slice(0, 8) }}</code></td>
        </tr>
        <tr v-if="!matriculas.length">
          <td colspan="5" class="vazio">{{ carregando ? 'Carregando…' : 'Nenhuma solicitação ainda.' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
</style>
