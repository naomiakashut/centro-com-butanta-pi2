<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'

const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)

const pageTitle = computed(() => route.meta.title || 'Visão geral')

function logout() {
  sessionStorage.removeItem('ccb-auth')
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-layout">
    <button class="mobile-menu" type="button" aria-label="Abrir menu" @click="mobileOpen = true">☰</button>
    <div v-if="mobileOpen" class="sidebar-backdrop" @click="mobileOpen = false"></div>
    <aside class="app-sidebar" :class="{ 'app-sidebar--open': mobileOpen }">
      <div class="brand-lockup">
        <img src="/images/ccb.jpg" alt="Centro Comunitário do Butantã" />
        <div><strong>Centro Comunitário</strong><span>Conjunto Residencial Butantã</span></div>
      </div>

      <nav class="app-nav" aria-label="Menu administrativo">
        <span class="app-nav__label">GESTÃO</span>
        <RouterLink to="/app" @click="mobileOpen = false">
          <AppIcon name="dashboard" />Visão geral
        </RouterLink>
        <RouterLink to="/app/moradores" @click="mobileOpen = false">
          <AppIcon name="users" />Moradores
        </RouterLink>
        <RouterLink to="/app/cadastro" @click="mobileOpen = false">
          <AppIcon name="plus" />Novo cadastro
        </RouterLink>
      </nav>

      <div class="sidebar-user">
        <div class="avatar">MA</div>
        <div><strong>Marina Alves</strong><span>Administradora</span></div>
        <button type="button" aria-label="Sair" title="Sair" @click="logout"><AppIcon name="logout" :size="18" /></button>
      </div>
    </aside>

    <main class="app-main">
      <header class="app-topbar">
        <div>
          <span class="topbar-eyebrow">PAINEL ADMINISTRATIVO</span>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="topbar-user">
          <div><strong>Marina Alves</strong><span>Administradora</span></div>
          <div class="avatar">MA</div>
        </div>
      </header>
      <div class="app-content"><slot /></div>
    </main>
  </div>
</template>
