<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login as authenticate } from '@/services/api'

const router = useRouter()
const standalone = import.meta.env.MODE === 'standalone'
const email = ref(standalone ? 'demo@example.com' : '')
const password = ref(standalone ? 'demonstracao' : '')
const showPassword = ref(false)
const loading = ref(false)

const error = ref('')
async function login() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    await authenticate(email.value.trim(), password.value)
    await router.push({ name: 'dashboard' })
  } catch (cause) {
    error.value = cause.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-brand-panel">
      <div class="login-brand">
        <img src="/images/ccb.jpg" alt="Centro Comunitário do Conjunto Residencial Butantã" />
        <div><span>Centro Comunitário do</span><strong>Conjunto Residencial Butantã</strong></div>
      </div>
      <div class="login-message">
        <span class="login-kicker">GESTÃO MAIS SIMPLES E HUMANA</span>
        <h1>Cuidar da comunidade começa com informação organizada.</h1>
        <p>Cadastros, comprovantes e mensalidades reunidos em um só lugar para apoiar o trabalho da equipe.</p>
      </div>
      <p class="login-caption">Gestão do Centro Comunitário</p>
    </section>

    <section class="login-form-panel">
      <form class="login-card" @submit.prevent="login">
        <div class="login-card__heading">
          <span class="mobile-brand">CENTRO COMUNITÁRIO BUTANTÃ</span>
          <h2>Boas-vindas</h2>
          <p>Acesse o painel administrativo.</p>
        </div>
        <div v-if="standalone" class="demo-notice"><strong>Demonstração local</strong><span>Use demo@example.com e senha demonstracao. Os dados são fictícios e reiniciam com o servidor.</span></div>
        <p v-if="error" class="field-error" role="alert">{{ error }}</p>
        <label class="field-label" for="email">E-mail</label>
        <input id="email" v-model="email" class="form-control-app" type="email" autocomplete="username" required />
        <div class="password-label"><label class="field-label" for="password">Senha</label></div>
        <div class="password-field">
          <input id="password" v-model="password" class="form-control-app" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required />
          <button type="button" :aria-label="showPassword ? 'Ocultar senha' : 'Exibir senha'" @click="showPassword = !showPassword">{{ showPassword ? 'Ocultar' : 'Exibir' }}</button>
        </div>
        <button class="button button--primary button--large" type="submit" :disabled="loading">{{ loading ? 'Entrando…' : 'Entrar no painel' }}</button>
        <p class="security-note">Acesso restrito à equipe administrativa e financeira.</p>
      </form>
    </section>
  </main>
</template>
