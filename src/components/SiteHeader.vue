<script setup>
import MainNavigation from '@/components/MainNavigation.vue'
</script>

<template>
  <header class="site-header">
    <div class="container site-header__content">
      <div class="site-brand">
        <img
          class="site-brand__logo"
          src="/images/ccb.jpg"
          alt="Logo do Centro Comunitário do Conjunto Residencial Butantã"
          width="104"
          height="104"
        />
        <div class="site-brand__copy">
          <span class="site-brand__eyebrow">Centro Comunitário do</span>
          <h1>Conjunto Residencial Butantã</h1>
          <p>José Octaviano Ximenes</p>
        </div>
      </div>
      <MainNavigation />
    </div>
    <div class="site-header__skyline" aria-hidden="true"></div>
  </header>
</template>
