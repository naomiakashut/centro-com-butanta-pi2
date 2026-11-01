<script setup>
import { onMounted } from 'vue'
import { useResidentsStore } from '@/stores/residents'
import AppShell from '@/components/AppShell.vue'
const store = useResidentsStore()
onMounted(() => store.load())
</script>

<template>
  <AppShell>
    <p v-if="store.loading" role="status">Carregando dados…</p>
    <div v-else-if="store.error" role="alert" class="field-error">
      <p>{{ store.error }}</p><button class="button button--secondary" @click="store.load()">Tentar novamente</button>
    </div>
    <RouterView v-slot="{ Component }"><component :is="Component" v-show="!store.loading && !store.error" /></RouterView>
  </AppShell>
</template>
