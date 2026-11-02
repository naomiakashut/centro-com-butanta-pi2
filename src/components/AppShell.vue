<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clearSession } from '@/services/api'
import { useResidentsStore } from '@/stores/residents'
import AppIcon from './AppIcon.vue'

const route = useRoute()
const router = useRouter()
const standalone = import.meta.env.MODE === 'standalone'
const mobileOpen = ref(false)
const store = useResidentsStore()
const signingOut = ref(false)
async function endSession() {
  if (signingOut.value) return
  signingOut.value = true
  mobileOpen.value = false
  try {
    await router.replace({ name: 'login' })
    if (router.currentRoute.value.name !== 'login') throw new Error('Redirecionamento interrompido')
    // Limpa apenas a memória do painel, depois de concluir a navegação.
    store.clear()
  } catch {
    // Recarrega o login se a navegação da SPA falhar (por exemplo, um chunk antigo).
    window.location.replace(router.resolve({ name: 'login' }).href)
  }
}
onMounted(() => window.addEventListener('ccb-session-ended', endSession))
onBeforeUnmount(() => window.removeEventListener('ccb-session-ended', endSession))

const pageTitle = computed(() => route.meta.title || 'Visão geral')

function logout() {
  clearSession({ notify: false })
  return endSession()
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
        <div class="avatar">CC</div>
        <div><strong>Equipe administrativa</strong><span>Administradora</span></div>
        <button type="button" aria-label="Sair" title="Sair" :disabled="signingOut" @click="logout"><AppIcon name="logout" :size="18" /></button>
      </div>
    </aside>

    <main class="app-main">
      <header class="app-topbar">
        <div>
          <nav v-if="route.name === 'resident-new'" class="breadcrumbs" aria-label="Caminho de navegação">
            <RouterLink to="/app/moradores"><AppIcon name="arrow-left" :size="14" />Moradores</RouterLink>
            <span aria-hidden="true">/</span><span aria-current="page">Cadastrar morador</span>
          </nav>
          <span class="topbar-eyebrow">PAINEL ADMINISTRATIVO</span>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="topbar-user">
          <div><strong>Equipe administrativa</strong><span>Administradora</span></div>
          <div class="avatar">CC</div>
        </div>
      </header>
      <div class="app-content"><p v-if="signingOut" role="status">Encerrando sessão…</p><p v-if="standalone" class="demo-notice" role="status">Demonstração local · Dados fictícios, mantidos apenas enquanto este servidor estiver em execução.</p><slot v-if="!signingOut" /></div>
    </main>
  </div>
</template>
