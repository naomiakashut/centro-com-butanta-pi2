<script setup>
import { ref } from 'vue'

const isOpen = ref(false)
</script>

<template>
  <nav class="navbar navbar-expand-lg main-navigation" aria-label="Navegação principal">
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
      <ul class="navbar-nav ms-auto align-items-lg-center">
        <li class="nav-item">
          <a class="nav-link active" aria-current="page" href="/">Início</a>
        </li>
        <li class="nav-item"><a class="nav-link" href="/perguntas">Perguntas</a></li>
        <li class="nav-item"><a class="nav-link" href="/about">Sobre</a></li>
        <li class="nav-item"><a class="nav-link" href="/links">Links</a></li>
        <li class="nav-item ms-lg-2">
          <a class="btn navigation-login" href="/login">Área do morador</a>
        </li>
      </ul>
    </div>
  </nav>
</template>
