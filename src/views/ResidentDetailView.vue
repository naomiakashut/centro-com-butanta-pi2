<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResidentsStore } from '@/stores/residents'
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const store = useResidentsStore()
const resident = computed(() => store.getById(route.params.id))
const related = computed(() => store.residents.filter((item) => item.unit === resident.value?.unit && item.id !== resident.value?.id))
const rejectOpen = ref(false)
const rejectionReason = ref('Documento ilegível ou incompleto')
const confirmDeactivate = ref(false)
const notice = ref(route.query.created ? 'Cadastro enviado para aprovação com sucesso.' : '')

function flash(message) {
  notice.value = message
  window.setTimeout(() => { notice.value = '' }, 3500)
}

function approve() {
  store.approveResident(resident.value.id)
  flash('Cadastro e comprovante aprovados. Morador ativado.')
}

function reject() {
  store.rejectDocument(resident.value.id, rejectionReason.value)
  rejectOpen.value = false
  flash('Comprovante reprovado. O motivo foi registrado.')
}

function deactivate() {
  store.deactivateResident(resident.value.id)
  confirmDeactivate.value = false
  flash('Morador desativado. O histórico foi preservado.')
}

function updatePayment(isOverdue) {
  store.setUnitPaymentStatus(resident.value.unit, isOverdue)
  flash(isOverdue ? 'Atraso aplicado a todos os moradores da unidade.' : 'Pagamento registrado para toda a unidade.')
}
</script>

<template>
  <div v-if="resident" class="page-stack detail-page">
    <div v-if="notice" class="toast-notice" role="status"><AppIcon name="check" />{{ notice }}</div>
    <div class="detail-back"><button type="button" @click="router.back()"><AppIcon name="arrow-left" :size="17" />Voltar para moradores</button></div>
    <section class="detail-hero panel">
      <div class="detail-person"><span class="person-avatar person-avatar--large">{{ resident.name.split(' ').slice(0, 2).map((name) => name[0]).join('') }}</span><div><div class="detail-person__status"><StatusBadge :status="resident.status" /><span>Cadastro nº {{ String(resident.id).padStart(4, '0') }}</span></div><h2>{{ resident.socialName || resident.name }}</h2><p v-if="resident.socialName">Nome civil: {{ resident.name }}</p><p>Desde {{ resident.createdAt }}</p></div></div>
      <div class="detail-hero__actions"><button v-if="resident.status !== 'inactive'" class="button button--danger-ghost" type="button" @click="confirmDeactivate = true">Desativar cadastro</button></div>
    </section>

    <section v-if="resident.document.status === 'pending' || resident.document.status === 'rejected'" class="review-banner">
      <div><AppIcon name="clock" /><span><strong>Comprovante aguardando análise</strong><small>Revise o documento antes de ativar o cadastro.</small></span></div>
      <div><button class="button button--danger-ghost" type="button" @click="rejectOpen = true">Reprovar</button><button class="button button--primary" type="button" @click="approve"><AppIcon name="check" :size="17" />Aprovar cadastro</button></div>
    </section>

    <div class="detail-grid">
      <div class="detail-main">
        <section class="panel info-panel">
          <div class="panel-heading"><div><h2>Dados pessoais</h2><p>Informações de identificação e contato.</p></div><button class="text-button" type="button" @click="flash('Edição disponível na próxima etapa do protótipo.')">Editar</button></div>
          <dl class="info-list"><div><dt>Nome completo</dt><dd>{{ resident.name }}</dd></div><div><dt>CPF</dt><dd>{{ resident.cpf }}</dd></div><div><dt>Data de nascimento</dt><dd>{{ new Date(`${resident.birthDate}T12:00:00`).toLocaleDateString('pt-BR') }}</dd></div><div><dt>Telefone</dt><dd>{{ resident.phone }}</dd></div><div><dt>E-mail</dt><dd>{{ resident.email || 'Não informado' }}</dd></div><div><dt>Vínculo com imóvel</dt><dd>{{ resident.owner ? 'Proprietário(a)' : 'Associado(a) / não proprietário(a)' }}</dd></div></dl>
        </section>

        <section class="panel info-panel">
          <div class="panel-heading"><div><h2>Comprovante de residência</h2><p>Documento enviado para validação do cadastro.</p></div><StatusBadge :status="resident.document.status" /></div>
          <div v-if="resident.document.status === 'rejected'" class="rejection-box"><strong>Motivo da reprovação</strong><p>{{ resident.document.rejectionReason }}</p></div>
          <div class="document-row"><span class="document-icon"><AppIcon name="file" /></span><div><strong>{{ resident.document.file }}</strong><small>Enviado em {{ resident.document.submittedAt }}</small></div><button class="button button--secondary button--small" type="button" @click="flash('Download simulado para esta apresentação.')"><AppIcon name="download" :size="16" />Baixar</button></div>
        </section>

        <section class="panel info-panel">
          <div class="panel-heading"><div><h2>Moradores da mesma unidade</h2><p>A situação financeira é compartilhada por toda a residência.</p></div></div>
          <div v-if="related.length" class="related-list"><RouterLink v-for="item in related" :key="item.id" :to="`/app/moradores/${item.id}`"><span class="person-avatar">{{ item.name.split(' ').slice(0, 2).map((name) => name[0]).join('') }}</span><div><strong>{{ item.socialName || item.name }}</strong><small>{{ item.cpf }}</small></div><StatusBadge :status="item.status" /><AppIcon name="chevron" :size="17" /></RouterLink></div>
          <p v-else class="no-related">Não há outros moradores vinculados a esta unidade.</p>
        </section>
      </div>

      <aside class="detail-aside">
        <section class="panel unit-card"><div class="unit-card__heading"><span><AppIcon name="home" /></span><div><small>UNIDADE RESIDENCIAL</small><strong>{{ resident.unit }}</strong></div></div><p>{{ resident.address }}</p><dl><div><dt>Mensalidade</dt><dd>{{ resident.monthlyFee }} UFESP</dd></div><div><dt>Valor atual</dt><dd>R$ {{ (resident.monthlyFee * store.ufespValue).toFixed(2).replace('.', ',') }}</dd></div></dl></section>
        <section class="panel payment-card"><div class="panel-heading"><div><h2>Mensalidade</h2><p>Situação da unidade inteira.</p></div></div><div class="payment-status" :class="resident.status === 'overdue' ? 'payment-status--overdue' : ''"><AppIcon :name="resident.status === 'overdue' ? 'alert' : 'check'" /><div><strong>{{ resident.status === 'overdue' ? 'Pagamento atrasado' : 'Pagamento em dia' }}</strong><small>Vencimento: {{ resident.dueDate }}</small></div></div><dl><div><dt>Último pagamento</dt><dd>{{ resident.lastPayment }}</dd></div><div><dt>Próximo vencimento</dt><dd>{{ resident.dueDate }}</dd></div></dl><button v-if="resident.status === 'overdue'" class="button button--primary button--block" type="button" @click="updatePayment(false)">Registrar pagamento</button><button v-else-if="resident.status === 'active'" class="button button--secondary button--block" type="button" @click="updatePayment(true)">Marcar como atrasada</button></section>
      </aside>
    </div>

    <div v-if="rejectOpen || confirmDeactivate" class="modal-backdrop" @click.self="rejectOpen = confirmDeactivate = false">
      <section v-if="rejectOpen" class="modal-card" role="dialog" aria-modal="true" aria-labelledby="reject-title"><h2 id="reject-title">Reprovar comprovante</h2><p>O motivo ficará registrado para orientar o reenvio.</p><label class="form-field"><span>Motivo *</span><textarea v-model="rejectionReason" rows="4"></textarea></label><div class="modal-actions"><button class="button button--ghost" type="button" @click="rejectOpen = false">Cancelar</button><button class="button button--danger" type="button" :disabled="!rejectionReason" @click="reject">Confirmar reprovação</button></div></section>
      <section v-else class="modal-card" role="dialog" aria-modal="true" aria-labelledby="deactivate-title"><h2 id="deactivate-title">Desativar este cadastro?</h2><p>O morador deixará de aparecer entre os ativos, mas seu histórico será preservado para rastreabilidade.</p><div class="modal-actions"><button class="button button--ghost" type="button" @click="confirmDeactivate = false">Cancelar</button><button class="button button--danger" type="button" @click="deactivate">Desativar cadastro</button></div></section>
    </div>
  </div>
  <section v-else class="empty-page"><h2>Morador não encontrado</h2><RouterLink class="button button--primary" to="/app/moradores">Voltar para moradores</RouterLink></section>
</template>
