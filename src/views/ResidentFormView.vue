<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useResidentsStore } from '@/stores/residents'
import AppIcon from '@/components/AppIcon.vue'
import { lookupCep } from '@/services/cep'
import ValidatedField from '@/components/ValidatedField.vue'
import { maskCpf, maskDate, maskPhone, maskCep, formatCity, dateToIso, personalErrors, residentialErrors } from '@/utils/residentValidation'

const store = useResidentsStore()
const router = useRouter()
const submitted = ref(false)
const form = reactive({ name: '', socialName: '', cpf: '', birthDate: '', email: '', phone: '', cep: '', street: '', number: '', block: '', ownerName: '', city: '', state: '', owner: true, hasAssociates: false })
const cepLoading = ref(false)
const cepMessage = ref('')
const addressLocked = ref(false)
const errors = computed(() => ({ ...personalErrors(form), ...residentialErrors(form) }))
const associateErrors = computed(() => associates.value.map((associate) => personalErrors(associate, false)))
let cepRequest
const states = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')
watch(() => form.cep, () => {
  cepRequest?.abort()
  addressLocked.value = false
  cepLoading.value = false
  cepMessage.value = ''
})
onBeforeUnmount(() => cepRequest?.abort())

async function searchCep() {
  cepRequest?.abort()
  addressLocked.value = false
  if (form.cep.replace(/\D/g, '').length !== 8) {
    cepMessage.value = 'Informe um CEP com 8 dígitos.'
    return
  }
  const request = new AbortController()
  cepRequest = request
  cepLoading.value = true
  cepMessage.value = 'Consultando CEP…'
  try {
    const result = await lookupCep(form.cep, request.signal)
    if (request.signal.aborted) return
    const returnedErrors = residentialErrors({ ...form, street: result.endereco, city: result.cidade })
    if (returnedErrors.street || returnedErrors.city) {
      cepMessage.value = 'Endereço retornado fora dos limites permitidos. Preencha os campos manualmente.'
      return
    }
    form.street = result.endereco
    form.city = result.cidade
    form.state = result.estado
    addressLocked.value = true
    cepMessage.value = 'Endereço preenchido pelo CEP. Informe o número e o bloco, se houver.'
  } catch (error) {
    if (!request.signal.aborted) cepMessage.value = error.message
  } finally {
    if (!request.signal.aborted) cepLoading.value = false
  }
}
const associates = ref([])
const monthlyFee = computed(() => form.hasAssociates ? 1 : 0.5)
const monthlyValue = computed(() => monthlyFee.value * store.ufespValue)

function addAssociate() {
  if (associates.value.length < 7) associates.value.push({ name: '', cpf: '', birthDate: '', email: '', phone: '' })
}

function removeAssociate(index) {
  associates.value.splice(index, 1)
  if (!associates.value.length) form.hasAssociates = false
}

const saving = ref(false)
const saveError = ref('')
async function submit() {
  if (saving.value) return
  submitted.value = true
  saveError.value = ''
  if (cepLoading.value || Object.values(errors.value).some(Boolean) || !form.number.trim() || form.number.length > 20 || form.block.length > 50 || (!form.owner && (!form.ownerName.trim() || form.ownerName.length > 200)) || !states.includes(form.state)) return
  if (associateErrors.value.some((error) => Object.values(error).some(Boolean))) return
  saving.value = true
  try {
    const id = await store.createResidents(
      { ...form, birthDate: dateToIso(form.birthDate) },
      associates.value.map((associate) => ({ ...associate, birthDate: dateToIso(associate.birthDate) })),
    )
    await router.push({ name: 'resident-detail', params: { id }, query: { created: 'true' } })
  } catch (cause) {
    saveError.value = cause.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="form-page" novalidate @submit.prevent="submit">
    <div :inert="saving" class="form-fields">
    <section class="panel form-section">
      <div class="form-section__body">
        <div class="form-section__heading"><h2>Dados pessoais</h2><p>Informações de identificação e contato do morador.</p></div>
        <div class="form-grid">
          <ValidatedField v-model="form.name" class="form-field--wide" label="Nome completo *" :error="errors.name" :submitted="submitted" maxlength="200" autocomplete="name" required />
          <ValidatedField v-model="form.socialName" label="Nome social" :error="errors.socialName" :submitted="submitted" maxlength="200" hint="Como a pessoa prefere ser chamada." />
          <ValidatedField v-model="form.cpf" label="CPF *" :error="errors.cpf" :submitted="submitted" :formatter="maskCpf" placeholder="000.000.000-00" required />
          <ValidatedField v-model="form.birthDate" label="Data de nascimento *" :error="errors.birthDate" :submitted="submitted" :formatter="maskDate" inputmode="numeric" placeholder="dd/mm/aaaa" required />
          <ValidatedField v-model="form.phone" label="Telefone *" :error="errors.phone" :submitted="submitted" :formatter="maskPhone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="(00)00000-0000" required />
          <ValidatedField v-model="form.email" label="E-mail" :error="errors.email" :submitted="submitted" type="email" autocomplete="email" />
        </div>
      </div>
    </section>

    <section class="panel form-section">
      <div class="form-section__body">
        <div class="form-section__heading"><h2>Unidade residencial</h2><p>Os associados serão vinculados à mesma moradia. CEP, cidade e estado servem apenas para consulta e não são salvos pela API atual.</p></div>
        <div class="form-grid address-fields">
          <ValidatedField v-model="form.cep" label="CEP *" name="cep" autocomplete="postal-code" inputmode="numeric" placeholder="00000-000" :formatter="maskCep" :error="errors.cep" :submitted="submitted" required @blur="searchCep" @keydown.enter.prevent="searchCep" />
          <div class="cep-action"><button class="button button--secondary" type="button" :disabled="cepLoading" @click="searchCep">{{ cepLoading ? 'Consultando…' : 'Consultar CEP' }}</button></div>
          <p v-if="cepMessage" class="cep-message form-field--wide" role="status">{{ cepMessage }}</p>
          <ValidatedField v-model="form.street" class="form-field--wide" label="Endereço *" name="street" autocomplete="address-line1" maxlength="150" :disabled="addressLocked" :error="errors.street" :submitted="submitted" required />
          <label class="form-field"><span>Número *</span><input v-model="form.number" maxlength="20" name="number" :class="{ invalid: submitted && !form.number.trim() }" /></label>
          <label class="form-field"><span>Bloco</span><input v-model="form.block" name="block" maxlength="50" /></label>
          <ValidatedField v-model="form.city" label="Cidade *" name="city" autocomplete="address-level2" maxlength="50" :formatter="formatCity" :disabled="addressLocked" :error="errors.city" :submitted="submitted" required />
          <label class="form-field"><span>Estado *</span><select v-model="form.state" name="state" autocomplete="address-level1" :disabled="addressLocked" :class="{ invalid: submitted && !form.state }"><option value="">Selecione</option><option v-for="state in states" :key="state" :value="state">{{ state }}</option></select></label>
        </div>
        <fieldset class="choice-group"><legend>É proprietário(a) do imóvel?</legend><div><label :class="{ selected: form.owner }"><input v-model="form.owner" type="radio" :value="true" /><strong>Sim</strong></label><label :class="{ selected: !form.owner }"><input v-model="form.owner" type="radio" :value="false" /><strong>Não</strong></label></div></fieldset>
        <fieldset class="choice-group"><legend>Há mais associados na mesma residência?</legend><div><label :class="{ selected: form.hasAssociates }"><input v-model="form.hasAssociates" type="radio" :value="true" @change="!associates.length && addAssociate()" /><strong>Sim</strong><span>Mensalidade de 1 UFESP por unidade.</span></label><label :class="{ selected: !form.hasAssociates }"><input v-model="form.hasAssociates" type="radio" :value="false" @change="associates = []" /><strong>Não</strong><span>Mensalidade de 0,5 UFESP.</span></label></div></fieldset>

        <div v-if="form.hasAssociates" class="associates-list">
          <article v-for="(associate, index) in associates" :key="index" class="associate-card">
            <div class="associate-card__heading"><strong>Associado {{ index + 2 }}</strong><button type="button" @click="removeAssociate(index)">Remover</button></div>
            <div class="form-grid">
              <ValidatedField v-model="associate.name" label="Nome completo *" maxlength="200" :error="associateErrors[index].name" :submitted="submitted" required />
              <ValidatedField v-model="associate.cpf" label="CPF *" :formatter="maskCpf" placeholder="000.000.000-00" :error="associateErrors[index].cpf" :submitted="submitted" required />
              <ValidatedField v-model="associate.birthDate" label="Data de nascimento *" :formatter="maskDate" inputmode="numeric" placeholder="dd/mm/aaaa" :error="associateErrors[index].birthDate" :submitted="submitted" required />
              <ValidatedField v-model="associate.email" label="E-mail" type="email" :error="associateErrors[index].email" :submitted="submitted" />
            </div>
          </article>
          <button v-if="associates.length < 7" class="button button--secondary button--small" type="button" @click="addAssociate"><AppIcon name="plus" :size="16" />Adicionar associado</button>
        </div>
      </div>
    </section>

    <ValidatedField v-if="!form.owner" v-model="form.ownerName" label="Nome do proprietário *" maxlength="200" :error="!form.ownerName.trim() ? 'Informe o nome do proprietário.' : ''" :submitted="submitted" required />

    <section class="panel form-section">
      <div class="form-section__body">
        <div class="form-section__heading"><h2>Mensalidade</h2><p>O cadastro será analisado pela equipe antes da ativação.</p></div>
        <div class="fee-summary"><div><span>Mensalidade da unidade</span><strong>{{ monthlyFee }} UFESP</strong></div><div><span>Valor estimado atual</span><strong>R$ {{ monthlyValue.toFixed(2).replace('.', ',') }}</strong></div><small>Calculado com a UFESP configurada em R$ {{ store.ufespValue.toFixed(2).replace('.', ',') }}.</small></div>
      </div>
    </section>

    <p v-if="submitted && !saveError && Object.values(errors).some(Boolean)" class="field-error" role="alert">Verifique se todos os campos obrigatórios (*) foram preenchidos corretamente.</p>
    <p v-if="saveError" class="field-error" role="alert">{{ saveError }}</p>
    <div class="form-actions"><RouterLink class="button button--ghost" to="/app/moradores">Cancelar</RouterLink><button class="button button--primary button--large" type="submit" :disabled="cepLoading || saving">{{ saving ? 'Salvando…' : 'Enviar para aprovação' }} <AppIcon name="chevron" :size="17" /></button></div>
    </div>
  </form>
</template>
