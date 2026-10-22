<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FalhaApi, api } from '../api';
import type { Historico } from '../api';
import ErroApi from '../components/ErroApi.vue';

const historico = ref<Historico | null>(null);
const carregando = ref(true);
const falha = ref<FalhaApi | null>(null);

async function carregar(): Promise<void> {
  carregando.value = true;
  try {
    historico.value = (await api.historico()).dados;
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
      <h1>Meu histórico</h1>
      <p class="subtitulo">Disciplinas em que você já foi aprovado, no registro_db. São elas que contam como pré-requisito.</p>
    </div>
    <button class="secundario" :disabled="carregando" @click="carregar">Atualizar</button>
  </div>

  <ErroApi v-if="falha" :falha="falha" />

  <div class="cartao tabela">
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Disciplina</th>
          <th>Situação</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in historico?.aprovadas ?? []" :key="d.codigo">
          <td><code>{{ d.codigo }}</code></td>
          <td>{{ d.nome }}</td>
          <td><span class="badge verde">Aprovado</span></td>
        </tr>
        <tr v-if="!historico?.aprovadas.length && !falha">
          <td colspan="3" class="vazio">{{ carregando ? 'Carregando…' : 'Nenhuma disciplina aprovada ainda.' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
