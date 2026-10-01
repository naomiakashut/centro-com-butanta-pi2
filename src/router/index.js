import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true, title: 'Entrar' },
    },
    {
      path: '/app',
      component: () => import('../views/AppLayoutView.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: 'Visão geral' } },
        { path: 'moradores', name: 'residents', component: () => import('../views/ResidentsView.vue'), meta: { title: 'Moradores' } },
        { path: 'cadastro', name: 'resident-new', component: () => import('../views/ResidentFormView.vue'), meta: { title: 'Cadastrar morador' } },
        { path: 'moradores/:id', name: 'resident-detail', component: () => import('../views/ResidentDetailView.vue'), meta: { title: 'Detalhes do morador' } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach((to) => {
  const isAuthenticated = sessionStorage.getItem('ccb-auth') === 'true'
  if (!to.meta.public && !isAuthenticated) return { name: 'login' }
  if (to.name === 'login' && isAuthenticated) return { name: 'dashboard' }
})

export default router
