<script setup>
import { ref } from 'vue'

const isOpen = ref(false)
</script>

<template>
  <nav
    class="navbar navbar-expand-md main-navigation"
    data-bs-theme="dark"
    aria-label="Navegação principal"
  >
    <div class="container">
      <a class="navbar-brand" href="/" aria-label="Página inicial">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9Z" />
        </svg>
        Centro
      </a>
      <button
        class="navbar-toggler"
        type="button"
        aria-controls="main-navigation-menu"
        :aria-expanded="isOpen"
        aria-label="Alternar menu de navegação"
        @click="isOpen = !isOpen"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div id="main-navigation-menu" class="navbar-collapse" :class="{ collapse: !isOpen }">
        <ul class="navbar-nav ms-auto align-items-md-center">
          <li class="nav-item">
            <a class="nav-link active" aria-current="page" href="/">Início</a>
          </li>
          <li class="nav-item"><a class="nav-link" href="/perguntas">Perguntas</a></li>
          <li class="nav-item"><a class="nav-link" href="/about">Sobre</a></li>
          <li class="nav-item"><a class="nav-link" href="/links">Links</a></li>
          <li class="nav-item ms-md-2">
            <a class="btn btn-light navigation-login" href="/login">Área do morador</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
