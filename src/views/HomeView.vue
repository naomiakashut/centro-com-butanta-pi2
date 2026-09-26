<script setup>
import { onMounted, ref } from 'vue'

const isDarkMode = ref(false)

onMounted(() => {
  const savedTheme = localStorage.getItem('centro-theme')
  isDarkMode.value = savedTheme
    ? savedTheme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
})

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('centro-theme', isDarkMode.value ? 'dark' : 'light')
}
</script>

<template>
  <div class="site-shell" :class="{ 'dark-theme': isDarkMode }">
    <header class="hero text-center">
      <button
        class="theme-toggle"
        type="button"
        :aria-label="isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'"
        :title="isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'"
        :aria-pressed="isDarkMode"
        @click="toggleTheme"
      >
        <svg v-if="isDarkMode" aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
        </svg>
        <svg v-else aria-hidden="true" viewBox="0 0 24 24">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
        </svg>
      </button>

      <div class="container-fluid">
        <div class="row align-items-start hero-row">
          <div class="col-3 col-sm-2 hero-image-column">
            <img
              class="hero-image rounded-circle"
              src="/images/ccb.jpg"
              alt="Logo do Centro Comunitário do Conjunto Residencial Butantã"
              width="100"
              height="100"
            />
          </div>

          <div class="col-6 col-sm-8 hero-title-column">
            <h2>Centro Comunitário do<br />Conjunto Residencial Butantã</h2>
            <h1>José Octaviano Ximenes</h1>
          </div>

          <div class="col-3 col-sm-2 hero-image-column">
            <img
              class="hero-image rounded-circle"
              src="/images/entrada.jpg"
              alt="Entrada do Centro Comunitário"
              width="100"
              height="100"
            />
          </div>
        </div>

        <p class="hero-description mb-0">
          O Centro é uma organização sem fins lucrativos de convivência dos moradores do Conjunto
          Residencial Butantã,<br class="d-none d-md-block" />
          onde oferece atividades de lazer, cultura, esporte e apoio social.
        </p>
      </div>
    </header>

    <nav class="navbar navbar-expand bg-dark main-navigation" data-bs-theme="dark" aria-label="Navegação principal">
      <div class="container-fluid">
        <a class="navbar-brand" href="/">Centro</a>
        <ul class="navbar-nav ms-auto">
          <li class="nav-item"><a class="nav-link active" href="/login">Login</a></li>
          <li class="nav-item"><a class="nav-link" href="/links">Link</a></li>
        </ul>
      </div>
    </nav>

    <main class="container news-section">
      <h2>Novidades</h2>
      <p>Modernização dos nossos sistemas e cadastros, em breve acesso a vocês...</p>
      <p>
        "Estamos trabalhando para revitalizar o Centro Comunitário. Contamos com a participação de
        todos os moradores do Conjunto Residencial Butantã!!!"
      </p>
    </main>

    <footer class="site-footer d-flex flex-wrap justify-content-between align-items-center border-top">
      <p class="mb-0">© 2026 Centro Comunitário do Conjuto Residencial Butantã</p>
      <ul class="nav footer-navigation">
        <li class="nav-item"><a class="nav-link" href="/">Inicial</a></li>
        <li class="nav-item"><a class="nav-link" href="/perguntas">Perguntas</a></li>
        <li class="nav-item"><a class="nav-link" href="/about">Sobre</a></li>
      </ul>
    </footer>
  </div>
</template>
