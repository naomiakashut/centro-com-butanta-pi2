<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResidentsStore } from '@/stores/residents'
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaymentStatusForm from '@/components/PaymentStatusForm.vue'

const route = useRoute()
const router = useRouter()
const store = useResidentsStore()
const resident = computed(() => store.getById(route.params.id))
const related = computed(() => store.residents.filter((item) => item.homeId === resident.value?.homeId && item.id !== resident.value?.id))
const rejectOpen = ref(false)
const confirmDeactivate = ref(false)
const notice = ref(route.query.created ? 'Cadastro enviado para aprovação com sucesso.' : '')

function flash(message) {
  notice.value = message
  window.setTimeout(() => { notice.value = '' }, 3500)
}

const paymentOpen = ref(false)
const busy = ref(false)
const actionError = ref('')
async function act(action, message) {
  if (busy.value) return
  busy.value = true
  actionError.value = ''
  try {
    await action()
    paymentOpen.value = rejectOpen.value = confirmDeactivate.value = false
    flash(message)
  } catch (cause) {
    actionError.value = cause.message
  } finally {
    busy.value = false
  }
}
function registerPayment(payload) {
  return act(() => store.registerPayment(resident.value.id, payload),
    payload.atraso ? 'Mensalidade marcada como atrasada.' : 'Pagamento registrado. Morador ativado.')
}
const approve = () => act(() => store.approveResident(resident.value.id), 'Cadastro aprovado. Morador ativado.')
const reject = () => act(() => store.rejectDocument(resident.value.id), 'Comprovante reprovado.')
const deactivate = () => act(() => store.deactivateResident(resident.value.id), 'Morador desativado. O histórico foi preservado.')
</script>

<template>
  <div v-if="resident" class="page-stack detail-page">
    <p v-if="actionError" class="field-error" role="alert">{{ actionError }}</p>
    <div v-if="notice" class="toast-notice" role="status"><AppIcon name="check" />{{ notice }}</div>
    <div class="detail-back"><button type="button" @click="router.back()"><AppIcon name="arrow-left" :size="17" />Voltar para moradores</button></div>
    <section class="detail-hero panel">
      <div class="detail-person"><span class="person-avatar person-avatar--large">{{ resident.name.split(' ').slice(0, 2).map((name) => name[0]).join('') }}</span><div><div class="detail-person__status"><StatusBadge :status="resident.status" /><span>Cadastro nº {{ String(resident.id).padStart(4, '0') }}</span></div><h2>{{ resident.socialName || resident.name }}</h2><p v-if="resident.socialName">Nome civil: {{ resident.name }}</p><p>Desde {{ resident.createdAt }}</p></div></div>
      <div class="detail-hero__actions"><button v-if="resident.status !== 'inactive'" class="button button--danger-ghost" type="button" @click="confirmDeactivate = true">Desativar cadastro</button></div>
    </section>

    <section v-if="resident.status === 'pending'" class="review-banner">
      <div><AppIcon name="clock" /><span><strong>{{ resident.document ? 'Comprovante aguardando análise' : 'Cadastro aguardando análise' }}</strong><small>Revise os dados antes de ativar o cadastro.</small></span></div>
      <div><button v-if="resident.document" class="button button--danger-ghost" type="button" @click="rejectOpen = true">Reprovar</button><button class="button button--primary" type="button" :disabled="busy" @click="approve"><AppIcon name="check" :size="17" />Aprovar cadastro</button></div>
    </section>

    <div class="detail-grid">
      <div class="detail-main">
        <section class="panel info-panel">
          <div class="panel-heading"><div><h2>Dados pessoais</h2><p>Informações de identificação e contato.</p></div></div>
          <dl class="info-list"><div><dt>Nome completo</dt><dd>{{ resident.name }}</dd></div><div><dt>CPF</dt><dd>{{ resident.cpf }}</dd></div><div><dt>Data de nascimento</dt><dd>{{ new Date(`${resident.birthDate}T12:00:00`).toLocaleDateString('pt-BR') }}</dd></div><div><dt>Telefone</dt><dd>{{ resident.phone }}</dd></div><div><dt>E-mail</dt><dd>{{ resident.email || 'Não informado' }}</dd></div><div><dt>Vínculo com imóvel</dt><dd>{{ resident.owner ? 'Proprietário(a)' : 'Associado(a) / não proprietário(a)' }}</dd></div></dl>
        </section>

        <div v-if="resident.document?.status === 'rejected'" class="rejection-box"><strong>Comprovante reprovado</strong><p>A API não disponibiliza motivo da reprovação.</p></div>

        <section class="panel info-panel">
          <div class="panel-heading"><div><h2>Moradores da mesma unidade</h2><p>Associados vinculados à mesma moradia na API.</p></div></div>
          <div v-if="related.length" class="related-list"><RouterLink v-for="item in related" :key="item.id" :to="`/app/moradores/${item.id}`"><span class="person-avatar">{{ item.name.split(' ').slice(0, 2).map((name) => name[0]).join('') }}</span><div><strong>{{ item.socialName || item.name }}</strong><small>{{ item.cpf }}</small></div><StatusBadge :status="item.status" /><AppIcon name="chevron" :size="17" /></RouterLink></div>
          <p v-else class="no-related">Não há outros moradores vinculados a esta unidade.</p>
        </section>
      </div>

      <aside class="detail-aside">
        <section class="panel unit-card"><div class="unit-card__heading"><span><AppIcon name="home" /></span><div><small>UNIDADE RESIDENCIAL</small><strong>{{ resident.unit }}</strong></div></div><p>{{ resident.address }}</p><dl><div><dt>Estimativa mensal</dt><dd>{{ resident.monthlyFee }} UFESP</dd></div><div><dt>Valor estimado</dt><dd>R$ {{ (resident.monthlyFee * store.ufespValue).toFixed(2).replace('.', ',') }}</dd></div></dl></section>
        <section class="panel payment-card">
          <div class="panel-heading"><div><h2>Mensalidade</h2><p>Situação do morador.</p></div></div>
          <p>{{ resident.status === 'overdue' ? 'Mensalidade atrasada.' : resident.status === 'active' ? 'Morador ativado.' : 'Cadastro aguardando ativação.' }}</p>
          <dl><div><dt>Último pagamento</dt><dd>{{ resident.lastPayment }}</dd></div></dl>
          <button v-if="['active', 'overdue'].includes(resident.status)" class="button button--primary button--block" type="button" :aria-expanded="paymentOpen" @click="paymentOpen = !paymentOpen">Registrar pagamento ou atraso</button>
          <PaymentStatusForm v-if="paymentOpen" :key="resident.id" :busy="busy" :overdue="resident.status === 'overdue'" @submit="registerPayment" />
        </section>
      </aside>
    </div>

    <div v-if="rejectOpen || confirmDeactivate" class="modal-backdrop" @click.self="rejectOpen = confirmDeactivate = false">
      <section v-if="rejectOpen" class="modal-card" role="dialog" aria-modal="true" aria-labelledby="reject-title"><h2 id="reject-title">Reprovar comprovante</h2><p>A API registrará apenas o status de reprovação.</p><div class="modal-actions"><button class="button button--ghost" type="button" @click="rejectOpen = false">Cancelar</button><button class="button button--danger" type="button" :disabled="busy" @click="reject">Confirmar reprovação</button></div></section>
      <section v-else class="modal-card" role="dialog" aria-modal="true" aria-labelledby="deactivate-title"><h2 id="deactivate-title">Desativar este cadastro?</h2><p>O morador deixará de aparecer entre os ativos, mas seu histórico será preservado para rastreabilidade.</p><div class="modal-actions"><button class="button button--ghost" type="button" @click="confirmDeactivate = false">Cancelar</button><button class="button button--danger" type="button" :disabled="busy" @click="deactivate">Desativar cadastro</button></div></section>
    </div>
  </div>
  <section v-else class="empty-page"><h2>Morador não encontrado</h2><RouterLink class="button button--primary" to="/app/moradores">Voltar para moradores</RouterLink></section>
</template>
