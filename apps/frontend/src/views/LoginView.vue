<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { FalhaApi, api } from '../api';
import ErroApi from '../components/ErroApi.vue';
import { iniciarSessao, sessao } from '../sessao';

const router = useRouter();
const usuario = ref('');
const senha = ref('');
const enviando = ref(false);
const falha = ref<FalhaApi | null>(null);

async function entrar(): Promise<void> {
  enviando.value = true;
  falha.value = null;
  try {
    const { dados } = await api.login(usuario.value.trim(), senha.value);
    iniciarSessao(dados.access_token, dados.aluno);
    router.push({ name: 'turmas' });
  } catch (e) {
    if (!(e instanceof FalhaApi)) throw e;
    falha.value = e;
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <div class="login">
    <h1>Matrícula em turmas</h1>
    <p class="subtitulo">Entre com a sua matrícula de aluno.</p>

    <div v-if="sessao.aviso" class="alerta amarelo">{{ sessao.aviso }}</div>
    <ErroApi v-if="falha" :falha="falha" />

    <form class="cartao" @submit.prevent="entrar">
      <label for="usuario">Matrícula</label>
      <input id="usuario" v-model="usuario" autocomplete="username" placeholder="ex.: 2021001" />

      <label for="senha">Senha</label>
      <input id="senha" v-model="senha" type="password" autocomplete="current-password" />

      <button type="submit" :disabled="enviando" class="entrar">{{ enviando ? 'Entrando…' : 'Entrar' }}</button>
    </form>

    <p class="tecnico">Alunos de demonstração: 2021001 (Ana), 2021002 (Bruno), 2021003 (Carla).</p>
  </div>
</template>

<style scoped>
.login {
  max-width: 380px;
  margin: 48px auto 0;
}

.entrar {
  width: 100%;
  margin-top: 20px;
}
</style>
