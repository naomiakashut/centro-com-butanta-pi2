import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useResidentsStore } from '@/stores/residents'

describe('residents store', () => {
  beforeEach(() => {
    const values = {}
    vi.stubGlobal('localStorage', {
      getItem: (key) => values[key] ?? null,
      setItem: (key, value) => { values[key] = String(value) },
      removeItem: (key) => { delete values[key] },
      clear: () => { Object.keys(values).forEach((key) => delete values[key]) },
    })
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('propagates payment status to every active resident in a unit', () => {
    const store = useResidentsStore()
    store.setUnitPaymentStatus('Bloco A · Apto 12', false)
    const unitResidents = store.residents.filter((resident) => resident.unit === 'Bloco A · Apto 12')
    expect(unitResidents).toHaveLength(2)
    expect(unitResidents.every((resident) => resident.status === 'active')).toBe(true)
  })

  it('keeps a deactivated resident for traceability', () => {
    const store = useResidentsStore()
    store.deactivateResident(4)
    expect(store.getById(4).status).toBe('inactive')
    expect(store.getById(4).deactivatedAt).toBeTruthy()
    expect(store.residents).toHaveLength(8)
  })
})
