<script setup lang="ts">
import { watch } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { encerrarSessao, sessao } from './sessao';

const router = useRouter();

watch(
  () => sessao.token,
  (token) => {
    if (!token) {
      router.replace({ name: 'login' });
    }
  },
);
</script>

<template>
  <header v-if="sessao.aluno" class="topo">
    <div class="marca">Matrícula<span>· Sistema Acadêmico</span></div>
    <nav>
      <RouterLink to="/turmas">Turmas</RouterLink>
      <RouterLink to="/matriculas">Minhas matrículas</RouterLink>
      <RouterLink to="/historico">Meu histórico</RouterLink>
    </nav>
    <div class="usuario">
      <span>{{ sessao.aluno.nome }} <small>{{ sessao.aluno.matricula_aluno }}</small></span>
      <button class="secundario" @click="encerrarSessao()">Sair</button>
    </div>
  </header>

  <main>
    <RouterView />
  </main>

  <footer>Frontend → API Gateway (REST/JSON + JWT) → microsserviços gRPC → PostgreSQL</footer>
</template>
