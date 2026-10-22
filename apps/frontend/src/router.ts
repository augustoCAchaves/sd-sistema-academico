import { createRouter, createWebHistory } from 'vue-router';
import { sessao } from './sessao';
import LoginView from './views/LoginView.vue';
import MatriculasView from './views/MatriculasView.vue';
import TurmasView from './views/TurmasView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/turmas' },
    { path: '/login', name: 'login', component: LoginView, meta: { publica: true } },
    { path: '/turmas', name: 'turmas', component: TurmasView },
    { path: '/matriculas', name: 'matriculas', component: MatriculasView },
    { path: '/:pathMatch(.*)*', redirect: '/turmas' },
  ],
});

router.beforeEach((to) => {
  if (!to.meta.publica && !sessao.token) {
    return { name: 'login' };
  }
  if (to.name === 'login' && sessao.token) {
    return { name: 'turmas' };
  }
});
