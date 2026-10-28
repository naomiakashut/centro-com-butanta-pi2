<script setup>
import { ref, watch } from 'vue'
import AccessibilityToolbar from '@/components/AccessibilityToolbar.vue'

const savedSize = localStorage.getItem('centro-font-size')
const fontSize = ref(['small', 'default', 'large'].includes(savedSize) ? savedSize : 'default')
const savedTheme = localStorage.getItem('centro-theme')
const isDarkMode = ref(savedTheme ? savedTheme === 'dark' : !!window.matchMedia?.('(prefers-color-scheme: dark)').matches)

watch(fontSize, (value) => {
  document.documentElement.dataset.fontSize = value
  localStorage.setItem('centro-font-size', value)
}, { immediate: true })
watch(isDarkMode, (value) => {
  document.documentElement.dataset.theme = value ? 'dark' : 'light'
  localStorage.setItem('centro-theme', value ? 'dark' : 'light')
}, { immediate: true })
</script>

<template>
  <AccessibilityToolbar
    :font-size="fontSize"
    :is-dark-mode="isDarkMode"
    @set-font-size="fontSize = $event"
    @toggle-theme="isDarkMode = !isDarkMode"
  />
  <RouterView />
</template>
