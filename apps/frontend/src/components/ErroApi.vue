<script setup lang="ts">
import type { FalhaApi } from '../api';

defineProps<{ falha: FalhaApi }>();
</script>

<template>
  <div class="alerta vermelho">
    <strong>{{ falha.status || 'Sem conexão' }}</strong> · {{ falha.message }}
    <ul v-if="falha.corpo.detalhes.length">
      <li v-for="d in falha.corpo.detalhes" :key="d">{{ d }}</li>
    </ul>
    <div class="tecnico">{{ falha.corpo.erro }} · correlation id <code>{{ falha.corpo.correlation_id }}</code></div>
  </div>
</template>
