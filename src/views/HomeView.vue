<script setup>
import { onMounted, ref } from 'vue'
import AccessibilityToolbar from '@/components/AccessibilityToolbar.vue'
import NewsSection from '@/components/NewsSection.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import SiteHeader from '@/components/SiteHeader.vue'

const isDarkMode = ref(false)
const fontSize = ref('default')

function applyFontSize(size) {
  fontSize.value = size
  document.documentElement.dataset.fontSize = size
  localStorage.setItem('centro-font-size', size)
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('centro-theme', isDarkMode.value ? 'dark' : 'light')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('centro-theme')
  const savedFontSize = localStorage.getItem('centro-font-size')

  isDarkMode.value = savedTheme
    ? savedTheme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches

  applyFontSize(['small', 'default', 'large'].includes(savedFontSize) ? savedFontSize : 'default')
})
</script>

<template>
  <div class="site-shell" :class="{ 'dark-theme': isDarkMode }">
    <AccessibilityToolbar
      :font-size="fontSize"
      :is-dark-mode="isDarkMode"
      @set-font-size="applyFontSize"
      @toggle-theme="toggleTheme"
    />
    <SiteHeader />
    <NewsSection />
    <SiteFooter />
  </div>
</template>
