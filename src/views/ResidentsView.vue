<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResidentsStore } from '@/stores/residents'
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const store = useResidentsStore()
const route = useRoute()
const router = useRouter()
const search = ref('')
const status = ref(route.query.status || 'all')

watch(() => route.query.status, (value) => { status.value = value || 'all' })

const filteredResidents = computed(() => {
  const term = search.value.toLocaleLowerCase('pt-BR').trim()
  const order = { overdue: 0, pending: 1, active: 2, inactive: 3 }
  return store.residents
    .filter((resident) => status.value === 'all' || resident.status === status.value)
    .filter((resident) => !term || `${resident.name} ${resident.socialName} ${resident.cpf} ${resident.unit}`.toLocaleLowerCase('pt-BR').includes(term))
    .sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name))
})
</script>

<template>
  <div class="page-stack">
    <div class="page-intro page-intro--actions">
      <div><p>Consulte cadastros, documentos e a situação financeira por residência.</p><span>{{ filteredResidents.length }} de {{ store.residents.length }} moradores exibidos</span></div>
      <RouterLink class="button button--primary" to="/app/cadastro"><AppIcon name="plus" :size="18" />Cadastrar morador</RouterLink>
    </div>

    <section class="panel residents-list-panel">
      <div class="list-toolbar">
        <label class="search-field"><AppIcon name="search" :size="19" /><input v-model="search" type="search" placeholder="Buscar por nome, CPF ou unidade" aria-label="Buscar moradores" /></label>
        <label class="select-field"><span>Situação</span><select v-model="status"><option value="all">Todos</option><option value="pending">Cadastrado</option><option value="active">Ativado</option><option value="overdue">Mensalidade atrasada</option><option value="inactive">Desativado</option></select></label>
      </div>
      <div class="data-table-wrap">
        <table class="data-table data-table--full">
          <thead><tr><th>Morador</th><th>Contato</th><th>Unidade residencial</th><th>Situação</th><th aria-label="Ações"></th></tr></thead>
          <tbody>
            <tr v-for="resident in filteredResidents" :key="resident.id" tabindex="0" @click="router.push(`/app/moradores/${resident.id}`)" @keyup.enter="router.push(`/app/moradores/${resident.id}`)">
              <td><div class="person-cell"><span class="person-avatar">{{ resident.name.split(' ').slice(0, 2).map((name) => name[0]).join('') }}</span><div><strong>{{ resident.socialName || resident.name }}</strong><small>{{ resident.cpf }}</small></div></div></td>
              <td><strong>{{ resident.phone }}</strong><small>{{ resident.email }}</small></td>
              <td><strong>{{ resident.unit }}</strong><small>{{ resident.monthlyFee }} UFESP/mês</small></td>
              <td><StatusBadge :status="resident.status" /></td>
              <td><button class="icon-button" type="button" :aria-label="`Ver cadastro de ${resident.name}`"><AppIcon name="chevron" :size="18" /></button></td>
            </tr>
            <tr v-if="!filteredResidents.length"><td class="empty-state" colspan="5"><AppIcon name="search" :size="30" /><strong>Nenhum morador encontrado</strong><span>Tente ajustar a busca ou o filtro.</span></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
