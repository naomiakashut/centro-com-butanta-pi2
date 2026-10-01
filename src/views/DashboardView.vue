<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useResidentsStore } from '@/stores/residents'
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const store = useResidentsStore()
const router = useRouter()
const ufespDraft = ref(store.ufespValue)
const settingsOpen = ref(false)
const statusOrder = { overdue: 0, pending: 1, active: 2, inactive: 3 }
const recentResidents = computed(() => [...store.residents].sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.name.localeCompare(b.name)).slice(0, 6))
const overdueUnits = computed(() => new Set(store.residents.filter((resident) => resident.status === 'overdue').map((resident) => resident.unit)).size)

function saveUfesp() {
  store.updateUfesp(ufespDraft.value)
  settingsOpen.value = false
}
</script>

<template>
  <div class="page-stack">
    <div class="page-intro page-intro--actions">
      <div><p>Olá, Marina. Aqui está o resumo da comunidade hoje.</p><span>Atualizado em 30 de setembro de 2026, às 14:30</span></div>
      <RouterLink class="button button--primary" to="/app/cadastro"><AppIcon name="plus" :size="18" />Cadastrar morador</RouterLink>
    </div>

    <section class="summary-grid" aria-label="Resumo dos moradores">
      <article class="summary-card summary-card--blue"><div class="summary-card__icon"><AppIcon name="users" :size="24" /></div><div><span>Moradores ativos</span><strong>{{ store.activeResidents.length }}</strong><small>{{ store.activeCount }} em dia</small></div></article>
      <article class="summary-card summary-card--amber"><div class="summary-card__icon"><AppIcon name="clock" :size="24" /></div><div><span>Aguardando aprovação</span><strong>{{ store.pendingCount }}</strong><small>comprovantes para revisar</small></div></article>
      <article class="summary-card summary-card--red"><div class="summary-card__icon"><AppIcon name="alert" :size="24" /></div><div><span>Mensalidades atrasadas</span><strong>{{ store.overdueCount }}</strong><small>em {{ overdueUnits }} unidade residencial</small></div></article>
      <article class="summary-card summary-card--green"><div class="summary-card__icon"><AppIcon name="home" :size="24" /></div><div><span>Unidades representadas</span><strong>{{ new Set(store.activeResidents.map((r) => r.unit)).size }}</strong><small>residências com cadastro ativo</small></div></article>
    </section>

    <section v-if="store.overdueCount" class="attention-banner">
      <div class="attention-banner__icon"><AppIcon name="alert" /></div>
      <div><strong>{{ overdueUnits }} unidade precisa de atenção</strong><p>O atraso é compartilhado por todos os moradores ativos da mesma residência.</p></div>
      <RouterLink to="/app/moradores?status=overdue">Ver moradores <AppIcon name="chevron" :size="16" /></RouterLink>
    </section>

    <div class="dashboard-grid">
      <section class="panel residents-panel">
        <div class="panel-heading"><div><h2>Moradores</h2><p>Cadastros que precisam de acompanhamento.</p></div><RouterLink to="/app/moradores">Ver todos</RouterLink></div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead><tr><th>Morador</th><th>Unidade</th><th>Situação</th><th aria-label="Ações"></th></tr></thead>
            <tbody>
              <tr v-for="resident in recentResidents" :key="resident.id" tabindex="0" @click="router.push(`/app/moradores/${resident.id}`)" @keyup.enter="router.push(`/app/moradores/${resident.id}`)">
                <td><div class="person-cell"><span class="person-avatar">{{ resident.name.split(' ').slice(0, 2).map((name) => name[0]).join('') }}</span><div><strong>{{ resident.socialName || resident.name }}</strong><small>{{ resident.cpf }}</small></div></div></td>
                <td><strong>{{ resident.unit }}</strong><small>{{ resident.monthlyFee }} UFESP/mês</small></td>
                <td><StatusBadge :status="resident.status" /></td>
                <td><button class="icon-button" type="button" :aria-label="`Ver cadastro de ${resident.name}`"><AppIcon name="chevron" :size="18" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <aside class="dashboard-aside">
        <section class="panel quick-panel">
          <div class="panel-heading"><div><h2>Ações rápidas</h2><p>Atalhos para tarefas frequentes.</p></div></div>
          <RouterLink to="/app/cadastro"><span><AppIcon name="plus" /></span><div><strong>Novo cadastro</strong><small>Adicionar morador ou residência</small></div><AppIcon name="chevron" :size="17" /></RouterLink>
          <RouterLink to="/app/moradores?status=pending"><span><AppIcon name="file" /></span><div><strong>Revisar comprovantes</strong><small>{{ store.pendingCount }} aguardando análise</small></div><AppIcon name="chevron" :size="17" /></RouterLink>
          <button type="button" @click="settingsOpen = !settingsOpen"><span><AppIcon name="settings" /></span><div><strong>Valor da UFESP</strong><small>R$ {{ store.ufespValue.toFixed(2).replace('.', ',') }}</small></div><AppIcon name="chevron" :size="17" /></button>
          <form v-if="settingsOpen" class="ufesp-form" @submit.prevent="saveUfesp"><label for="ufesp">Valor atual em reais</label><div><input id="ufesp" v-model="ufespDraft" type="number" min="1" step="0.01" /><button class="button button--primary button--small">Salvar</button></div></form>
        </section>
        <section class="privacy-card"><AppIcon name="check" /><div><strong>Dados protegidos</strong><p>CPFs estão mascarados e o acesso é restrito à equipe autorizada.</p></div></section>
        <button class="reset-demo" type="button" @click="store.resetDemo()">Restaurar dados da demonstração</button>
      </aside>
    </div>
  </div>
</template>
