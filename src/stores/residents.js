import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'ccb-prototype-residents'
const UFESP_KEY = 'ccb-prototype-ufesp'

const demoResidents = [
  {
    id: 1,
    name: 'Ana Paula Ribeiro',
    socialName: '',
    cpf: '***.482.***-09',
    birthDate: '1984-06-18',
    email: 'ana.ribeiro@email.com',
    phone: '(11) 99842-7610',
    status: 'overdue',
    unit: 'Bloco A · Apto 12',
    address: 'Av. Corifeu de Azevedo Marques, 1.200',
    owner: true,
    monthlyFee: 1,
    lastPayment: '10/07/2026',
    dueDate: '10/09/2026',
    createdAt: '12/03/2024',
    document: { status: 'approved', file: 'comprovante-ana-ribeiro.pdf', submittedAt: '12/03/2024' },
  },
  {
    id: 2,
    name: 'Marcos Vinícius Ribeiro',
    socialName: '',
    cpf: '***.125.***-44',
    birthDate: '1981-11-02',
    email: 'marcos.ribeiro@email.com',
    phone: '(11) 98750-1492',
    status: 'overdue',
    unit: 'Bloco A · Apto 12',
    address: 'Av. Corifeu de Azevedo Marques, 1.200',
    owner: false,
    monthlyFee: 1,
    lastPayment: '10/07/2026',
    dueDate: '10/09/2026',
    createdAt: '12/03/2024',
    document: { status: 'approved', file: 'declaracao-unidade-a12.pdf', submittedAt: '12/03/2024' },
  },
  {
    id: 3,
    name: 'Beatriz Oliveira Santos',
    socialName: 'Bia Oliveira',
    cpf: '***.819.***-21',
    birthDate: '1994-01-27',
    email: 'bia.oliveira@email.com',
    phone: '(11) 97123-4455',
    status: 'pending',
    unit: 'Bloco C · Apto 34',
    address: 'Av. Corifeu de Azevedo Marques, 1.200',
    owner: false,
    monthlyFee: 0.5,
    lastPayment: '—',
    dueDate: 'Após ativação',
    createdAt: '28/09/2026',
    document: { status: 'pending', file: 'contrato-locacao-bia.pdf', submittedAt: '28/09/2026' },
  },
  {
    id: 4,
    name: 'Carlos Eduardo Lima',
    socialName: '',
    cpf: '***.630.***-17',
    birthDate: '1973-09-15',
    email: 'carlos.lima@email.com',
    phone: '(11) 96350-8872',
    status: 'active',
    unit: 'Bloco B · Apto 21',
    address: 'Av. Corifeu de Azevedo Marques, 1.200',
    owner: true,
    monthlyFee: 0.5,
    lastPayment: '08/09/2026',
    dueDate: '10/10/2026',
    createdAt: '07/02/2023',
    document: { status: 'approved', file: 'comprovante-carlos-lima.pdf', submittedAt: '07/02/2023' },
  },
  {
    id: 5,
    name: 'Daniela Souza Martins',
    socialName: '',
    cpf: '***.344.***-80',
    birthDate: '1988-03-09',
    email: 'daniela.martins@email.com',
    phone: '(11) 95674-2290',
    status: 'active',
    unit: 'Bloco D · Apto 42',
    address: 'Av. Corifeu de Azevedo Marques, 1.200',
    owner: true,
    monthlyFee: 1,
    lastPayment: '09/09/2026',
    dueDate: '10/10/2026',
    createdAt: '19/08/2025',
    document: { status: 'approved', file: 'comprovante-daniela.pdf', submittedAt: '19/08/2025' },
  },
  {
    id: 6,
    name: 'Eduardo Martins',
    socialName: '',
    cpf: '***.055.***-62',
    birthDate: '1990-12-20',
    email: 'eduardo.martins@email.com',
    phone: '(11) 94510-7731',
    status: 'active',
    unit: 'Bloco D · Apto 42',
    address: 'Av. Corifeu de Azevedo Marques, 1.200',
    owner: false,
    monthlyFee: 1,
    lastPayment: '09/09/2026',
    dueDate: '10/10/2026',
    createdAt: '19/08/2025',
    document: { status: 'approved', file: 'declaracao-unidade-d42.pdf', submittedAt: '19/08/2025' },
  },
  {
    id: 7,
    name: 'Fernanda Costa Nogueira',
    socialName: '',
    cpf: '***.991.***-06',
    birthDate: '1967-05-31',
    email: 'fernanda.nogueira@email.com',
    phone: '(11) 93442-1198',
    status: 'inactive',
    unit: 'Bloco A · Apto 03',
    address: 'Av. Corifeu de Azevedo Marques, 1.200',
    owner: true,
    monthlyFee: 0.5,
    lastPayment: '10/04/2026',
    dueDate: '—',
    createdAt: '22/01/2022',
    deactivatedAt: '04/05/2026',
    document: { status: 'approved', file: 'comprovante-fernanda.pdf', submittedAt: '22/01/2022' },
  },
  {
    id: 8,
    name: 'João Miguel Pereira',
    socialName: '',
    cpf: '***.238.***-71',
    birthDate: '2001-07-11',
    email: 'joao.pereira@email.com',
    phone: '(11) 92334-5560',
    status: 'pending',
    unit: 'Bloco E · Apto 51',
    address: 'Av. Corifeu de Azevedo Marques, 1.200',
    owner: true,
    monthlyFee: 0.5,
    lastPayment: '—',
    dueDate: 'Após ativação',
    createdAt: '29/09/2026',
    document: { status: 'pending', file: 'comprovante-joao-pereira.pdf', submittedAt: '29/09/2026' },
  },
]

function freshDemoData() {
  return JSON.parse(JSON.stringify(demoResidents))
}

export const useResidentsStore = defineStore('residents', () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  const residents = ref(saved ? JSON.parse(saved) : freshDemoData())
  const ufespValue = ref(Number(localStorage.getItem(UFESP_KEY)) || 37.02)

  const activeResidents = computed(() => residents.value.filter((resident) => resident.status !== 'inactive'))
  const pendingCount = computed(() => residents.value.filter((resident) => resident.status === 'pending').length)
  const overdueCount = computed(() => residents.value.filter((resident) => resident.status === 'overdue').length)
  const activeCount = computed(() => residents.value.filter((resident) => resident.status === 'active').length)

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(residents.value))
    localStorage.setItem(UFESP_KEY, String(ufespValue.value))
  }

  function getById(id) {
    return residents.value.find((resident) => resident.id === Number(id))
  }

  function createResident(payload) {
    const nextId = Math.max(...residents.value.map((resident) => resident.id), 0) + 1
    const created = {
      ...payload,
      id: nextId,
      status: 'pending',
      createdAt: new Intl.DateTimeFormat('pt-BR').format(new Date()),
      lastPayment: '—',
      dueDate: 'Após ativação',
      document: {
        status: 'pending',
        file: payload.documentName || 'comprovante-residencia.pdf',
        submittedAt: new Intl.DateTimeFormat('pt-BR').format(new Date()),
      },
    }
    delete created.documentName
    residents.value.push(created)
    persist()
    return created
  }

  function approveResident(id) {
    const resident = getById(id)
    if (!resident) return
    resident.status = 'active'
    resident.document.status = 'approved'
    resident.document.rejectionReason = ''
    resident.dueDate = '10/10/2026'
    persist()
  }

  function rejectDocument(id, reason) {
    const resident = getById(id)
    if (!resident) return
    resident.status = 'pending'
    resident.document.status = 'rejected'
    resident.document.rejectionReason = reason
    persist()
  }

  function deactivateResident(id) {
    const resident = getById(id)
    if (!resident) return
    resident.status = 'inactive'
    resident.deactivatedAt = new Intl.DateTimeFormat('pt-BR').format(new Date())
    resident.dueDate = '—'
    persist()
  }

  function setUnitPaymentStatus(unit, isOverdue) {
    residents.value
      .filter((resident) => resident.unit === unit && resident.status !== 'inactive')
      .forEach((resident) => {
        resident.status = isOverdue ? 'overdue' : 'active'
        resident.lastPayment = isOverdue
          ? resident.lastPayment
          : new Intl.DateTimeFormat('pt-BR').format(new Date())
        resident.dueDate = isOverdue ? '10/09/2026' : '10/10/2026'
      })
    persist()
  }

  function updateUfesp(value) {
    ufespValue.value = Number(value)
    persist()
  }

  function resetDemo() {
    residents.value = freshDemoData()
    ufespValue.value = 37.02
    persist()
  }

  return {
    residents,
    ufespValue,
    activeResidents,
    pendingCount,
    overdueCount,
    activeCount,
    getById,
    createResident,
    approveResident,
    rejectDocument,
    deactivateResident,
    setUnitPaymentStatus,
    updateUfesp,
    resetDemo,
  }
})
