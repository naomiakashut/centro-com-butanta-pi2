<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useResidentsStore } from '@/stores/residents'
import AppIcon from '@/components/AppIcon.vue'

const store = useResidentsStore()
const router = useRouter()
const submitted = ref(false)
const fileName = ref('')
const form = reactive({ name: '', socialName: '', cpf: '', birthDate: '', email: '', phone: '', block: '', apartment: '', owner: true, hasAssociates: false })
const associates = ref([])
const unit = computed(() => `Bloco ${form.block.toUpperCase()} · Apto ${form.apartment}`)
const monthlyFee = computed(() => form.hasAssociates ? 1 : 0.5)
const monthlyValue = computed(() => monthlyFee.value * store.ufespValue)

function addAssociate() {
  if (associates.value.length < 7) associates.value.push({ name: '', cpf: '', birthDate: '', email: '', phone: '' })
}

function removeAssociate(index) {
  associates.value.splice(index, 1)
  if (!associates.value.length) form.hasAssociates = false
}

function handleFile(event) {
  fileName.value = event.target.files[0]?.name || ''
}

function submit() {
  submitted.value = true
  if (!form.name || !form.cpf || !form.birthDate || !form.phone || !form.block || !form.apartment || !fileName.value) return
  const primary = store.createResident({
    ...form,
    unit: unit.value,
    address: 'Av. Corifeu de Azevedo Marques, 1.200',
    monthlyFee: monthlyFee.value,
    documentName: fileName.value,
  })
  associates.value.forEach((associate) => store.createResident({
    ...associate,
    socialName: '',
    unit: unit.value,
    address: 'Av. Corifeu de Azevedo Marques, 1.200',
    owner: false,
    monthlyFee: 1,
    documentName: fileName.value,
  }))
  router.push({ name: 'resident-detail', params: { id: primary.id }, query: { created: 'true' } })
}
</script>

<template>
  <form class="form-page" novalidate @submit.prevent="submit">
    <div class="form-progress"><span class="active">1</span><i></i><span class="active">2</span><i></i><span class="active">3</span><div class="form-progress__labels"><small>Dados pessoais</small><small>Residência</small><small>Documentação</small></div></div>

    <section class="panel form-section">
      <div class="section-number">1</div><div class="form-section__body">
        <div class="form-section__heading"><h2>Dados pessoais</h2><p>Informações de identificação e contato do morador.</p></div>
        <div class="form-grid">
          <label class="form-field form-field--wide"><span>Nome completo *</span><input v-model="form.name" :class="{ invalid: submitted && !form.name }" type="text" autocomplete="name" /><small v-if="submitted && !form.name" class="field-error">Informe o nome completo.</small></label>
          <label class="form-field"><span>Nome social</span><input v-model="form.socialName" type="text" /><small>Como a pessoa prefere ser chamada.</small></label>
          <label class="form-field"><span>CPF *</span><input v-model="form.cpf" :class="{ invalid: submitted && !form.cpf }" type="text" placeholder="000.000.000-00" /></label>
          <label class="form-field"><span>Data de nascimento *</span><input v-model="form.birthDate" :class="{ invalid: submitted && !form.birthDate }" type="date" /></label>
          <label class="form-field"><span>Telefone *</span><input v-model="form.phone" :class="{ invalid: submitted && !form.phone }" type="tel" placeholder="(11) 99999-9999" /></label>
          <label class="form-field"><span>E-mail</span><input v-model="form.email" type="email" autocomplete="email" /></label>
        </div>
      </div>
    </section>

    <section class="panel form-section">
      <div class="section-number">2</div><div class="form-section__body">
        <div class="form-section__heading"><h2>Unidade residencial</h2><p>O status da mensalidade será compartilhado entre moradores desta unidade.</p></div>
        <div class="address-prefix"><AppIcon name="home" /><span>Conjunto Residencial Butantã<small>Av. Corifeu de Azevedo Marques, 1.200</small></span></div>
        <div class="form-grid form-grid--compact">
          <label class="form-field"><span>Bloco *</span><input v-model="form.block" :class="{ invalid: submitted && !form.block }" type="text" maxlength="2" placeholder="A" /></label>
          <label class="form-field"><span>Apartamento *</span><input v-model="form.apartment" :class="{ invalid: submitted && !form.apartment }" type="text" placeholder="12" /></label>
        </div>
        <fieldset class="choice-group"><legend>É proprietário(a) do imóvel?</legend><div><label :class="{ selected: form.owner }"><input v-model="form.owner" type="radio" :value="true" /><strong>Sim</strong><span>Apresentará comprovante em seu nome.</span></label><label :class="{ selected: !form.owner }"><input v-model="form.owner" type="radio" :value="false" /><strong>Não</strong><span>Apresentará documentação alternativa.</span></label></div></fieldset>
        <div v-if="!form.owner" class="decision-note"><AppIcon name="alert" /><div><strong>Validação necessária com a equipe</strong><p>Para o protótipo, aceitamos contrato de locação ou declaração do proprietário. A regra final ainda precisa ser definida.</p></div></div>
        <fieldset class="choice-group"><legend>Há mais associados na mesma residência?</legend><div><label :class="{ selected: form.hasAssociates }"><input v-model="form.hasAssociates" type="radio" :value="true" @change="!associates.length && addAssociate()" /><strong>Sim</strong><span>Mensalidade de 1 UFESP por unidade.</span></label><label :class="{ selected: !form.hasAssociates }"><input v-model="form.hasAssociates" type="radio" :value="false" @change="associates = []" /><strong>Não</strong><span>Mensalidade de 0,5 UFESP.</span></label></div></fieldset>

        <div v-if="form.hasAssociates" class="associates-list">
          <article v-for="(associate, index) in associates" :key="index" class="associate-card">
            <div class="associate-card__heading"><strong>Associado {{ index + 2 }}</strong><button type="button" @click="removeAssociate(index)">Remover</button></div>
            <div class="form-grid"><label class="form-field"><span>Nome completo *</span><input v-model="associate.name" required /></label><label class="form-field"><span>CPF *</span><input v-model="associate.cpf" required /></label><label class="form-field"><span>Data de nascimento *</span><input v-model="associate.birthDate" type="date" required /></label><label class="form-field"><span>E-mail</span><input v-model="associate.email" type="email" /></label></div>
          </article>
          <button v-if="associates.length < 7" class="button button--secondary button--small" type="button" @click="addAssociate"><AppIcon name="plus" :size="16" />Adicionar associado</button>
        </div>
      </div>
    </section>

    <section class="panel form-section">
      <div class="section-number">3</div><div class="form-section__body">
        <div class="form-section__heading"><h2>Comprovante de residência</h2><p>O cadastro será analisado pela equipe antes da ativação.</p></div>
        <label class="file-upload" :class="{ invalid: submitted && !fileName }"><input type="file" accept=".pdf,.jpg,.jpeg,.png" @change="handleFile" /><AppIcon :name="fileName ? 'check' : 'file'" :size="28" /><strong>{{ fileName || 'Selecione ou arraste o documento' }}</strong><span>PDF, JPG ou PNG · até 10 MB</span></label>
        <small v-if="submitted && !fileName" class="field-error">Adicione o documento para continuar.</small>
        <div class="fee-summary"><div><span>Mensalidade da unidade</span><strong>{{ monthlyFee }} UFESP</strong></div><div><span>Valor estimado atual</span><strong>R$ {{ monthlyValue.toFixed(2).replace('.', ',') }}</strong></div><small>Calculado com a UFESP configurada em R$ {{ store.ufespValue.toFixed(2).replace('.', ',') }}. O valor pode ser atualizado pela administração.</small></div>
      </div>
    </section>

    <div class="form-actions"><RouterLink class="button button--ghost" to="/app/moradores">Cancelar</RouterLink><button class="button button--primary button--large" type="submit">Enviar para aprovação <AppIcon name="chevron" :size="17" /></button></div>
  </form>
</template>
