<script setup>
import { computed, ref } from 'vue'
import ValidatedField from './ValidatedField.vue'
import { dateToIso, maskDate } from '@/utils/residentValidation'

const props = defineProps({ busy: Boolean, overdue: Boolean })
const emit = defineEmits(['submit'])
const late = ref(props.overdue)
const date = ref('')
const submitted = ref(false)
const dateError = computed(() => !late.value && !dateToIso(date.value)
  ? 'Informe uma data válida no formato dd/mm/aaaa.' : '')

function submit() {
  if (props.busy) return
  submitted.value = true
  if (dateError.value) return
  emit('submit', { atraso: late.value, data_pagamento: late.value ? null : dateToIso(date.value) })
}
</script>

<template>
  <form class="form-fields" novalidate aria-label="Registrar pagamento ou atraso" @submit.prevent="submit">
    <label><input v-model="late" type="checkbox" :disabled="busy" />Mensalidade atrasada</label>
    <ValidatedField v-model="date" label="Data do pagamento" placeholder="dd/mm/aaaa" inputmode="numeric"
      :formatter="maskDate" :disabled="late || busy" :required="!late" :error="dateError" :submitted="submitted" />
    <button class="button button--primary" type="submit" :disabled="busy">{{ busy ? 'Registrando…' : 'Registrar pagamento ou atraso' }}</button>
  </form>
</template>
