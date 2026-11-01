import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { registerPaymentStatus, createHousehold, loadResidents, updateDocument, updateResident } from '@/services/residents'

export const useResidentsStore = defineStore('residents', () => {
  const residents = ref([])
  const loading = ref(false)
  const error = ref('')
  const updatedAt = ref('')
  // Apenas estimativa local: o contrato atual não possui configuração de UFESP.
  const ufespValue = ref(37.02)
  const activeResidents = computed(() => residents.value.filter((r) => ['active', 'overdue'].includes(r.status)))
  const pendingCount = computed(() => residents.value.filter((r) => r.status === 'pending').length)
  const overdueCount = computed(() => residents.value.filter((r) => r.status === 'overdue').length)
  const activeCount = computed(() => residents.value.filter((r) => r.status === 'active').length)
  const getById = (id) => residents.value.find((r) => r.id === Number(id))
  let revision = 0

  function clear() {
    revision++
    residents.value = []
    error.value = ''
    updatedAt.value = ''
    loading.value = false
  }

  async function load() {
    const current = ++revision
    loading.value = true
    error.value = ''
    try {
      const data = await loadResidents()
      if (current === revision) {
        residents.value = data
        updatedAt.value = new Date().toLocaleString('pt-BR')
      }
    } catch (cause) {
      if (current === revision) error.value = cause.message
    } finally {
      if (current === revision) loading.value = false
    }
  }

  async function createResidents(primary, associates) {
    const id = await createHousehold(primary, associates)
    await load()
    return id
  }

  async function approveResident(id) {
    const resident = getById(id)
    if (resident.document) await updateDocument(resident.document.id, 'aprovado')
    try { await updateResident(id, { situacao_cadastro: 'ativo' }) }
    finally { await load() }
  }

  async function rejectDocument(id) {
    const resident = getById(id)
    if (resident?.document) await updateDocument(resident.document.id, 'reprovado')
    await load()
  }

  async function deactivateResident(id) {
    await updateResident(id, { situacao_cadastro: 'inativo', dth_saida: new Date().toISOString() })
    await load()
  }

  async function registerPayment(id, body) {
    await registerPaymentStatus(id, body)
    await load()
  }

  function updateUfesp(value) {
    if (Number.isFinite(Number(value)) && Number(value) > 0) ufespValue.value = Number(value)
  }

  return { residents, loading, error, updatedAt, ufespValue, activeResidents, pendingCount, overdueCount,
    activeCount, getById, load, clear, createResidents, approveResident, rejectDocument, deactivateResident, registerPayment, updateUfesp }
})
