<script setup lang="ts">
import { computed } from 'vue';
import type { StatusMatricula } from '../api';

const props = defineProps<{ status: StatusMatricula }>();

const ROTULOS: Record<StatusMatricula, { texto: string; cor: string }> = {
  DEFERIDA: { texto: 'Deferida', cor: 'verde' },
  INDEFERIDA_SEM_VAGA: { texto: 'Indeferida · sem vaga', cor: 'amarelo' },
  INDEFERIDA_PRE_REQUISITO: { texto: 'Indeferida · pré-requisito', cor: 'amarelo' },
};

const rotulo = computed(() => ROTULOS[props.status] ?? { texto: props.status, cor: 'vermelho' });
</script>

<template>
  <span class="badge" :class="rotulo.cor">{{ rotulo.texto }}</span>
</template>
