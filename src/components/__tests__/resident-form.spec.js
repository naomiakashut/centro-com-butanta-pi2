import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ResidentFormView from '@/views/ResidentFormView.vue'
import ResidentDetailView from '@/views/ResidentDetailView.vue'
import AppShell from '@/components/AppShell.vue'
import { useResidentsStore } from '@/stores/residents'
import { createHousehold, loadResidents, updateResident } from '@/services/residents'
import { lookupCep } from '@/services/cep'

vi.mock('@/services/residents', () => ({ createHousehold: vi.fn(), loadResidents: vi.fn(), updateResident: vi.fn(), updateDocument: vi.fn(), registerPaymentStatus: vi.fn() }))

vi.mock('@/services/cep', () => ({ lookupCep: vi.fn() }))

let wrapper
let router
let pinia

beforeEach(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() })
  vi.mocked(lookupCep).mockReset()
  vi.mocked(createHousehold).mockReset().mockResolvedValue(9)
  vi.mocked(loadResidents).mockReset().mockResolvedValue([])
  vi.mocked(updateResident).mockReset().mockResolvedValue({})
  pinia = createPinia()
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/app/cadastro', name: 'resident-new', component: ResidentFormView, meta: { title: 'Cadastrar morador' } },
      { path: '/app/moradores', component: { template: '<div>Moradores</div>' } },
      { path: '/app/moradores/:id', name: 'resident-detail', component: ResidentDetailView },
    ],
  })
})

afterEach(() => {
  wrapper?.unmount()
  vi.unstubAllGlobals()
})

async function render(component = ResidentFormView, path = '/app/cadastro') {
  await router.push(path)
  wrapper = mount(component, { global: { plugins: [pinia, router] } })
  return wrapper
}

function field(label) {
  return wrapper.findAll('label.form-field').find((item) => item.find('span').text() === label).find('input, select')
}

async function fillForm() {
  for (const [label, value] of Object.entries({
    'Nome completo *': 'Pessoa de Teste', 'CPF *': '529.982.247-25',
    'Data de nascimento *': '10051990', 'Telefone *': '11999999999',
    'CEP *': '05508-000', 'Endereço *': 'Rua de Teste', 'Número *': '123',
    'Complemento': 'Apto 10', 'Cidade *': 'São Paulo', 'Estado *': 'SP',
  })) await field(label).setValue(value)
}

describe('cadastro e detalhes', () => {
  it('envia o cadastro à API e abre os detalhes após confirmação', async () => {
    await render()
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
    expect(wrapper.find('.form-progress').exists()).toBe(false)
    expect(wrapper.find('.section-number').exists()).toBe(false)
    await fillForm()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(createHousehold).toHaveBeenCalledWith(expect.objectContaining({
      street: 'Rua de Teste', number: '123', complement: 'Apto 10', birthDate: '1990-05-10', phone: '(11)99999-9999',
    }), [])
    expect(router.currentRoute.value.params.id).toBe('9')
  })

  it('abre e aprova um novo cadastro sem documento', async () => {
    const store = useResidentsStore(pinia)
    store.residents = [{ id: 9, name: 'Pessoa de Teste', birthDate: '1990-05-10', unit: 'Rua, 1', monthlyFee: 0.5, document: null, status: 'pending' }]
    await render(ResidentDetailView, '/app/moradores/9')
    expect(wrapper.text()).not.toContain('Baixar')
    await wrapper.findAll('button').find((button) => button.text().includes('Aprovar cadastro')).trigger('click')
    await flushPromises()
    expect(updateResident).toHaveBeenCalledWith(9, { situacao_cadastro: 'ativo' })
  })

  it('exige os campos obrigatórios do endereço antes de salvar', async () => {
    await render()
    await fillForm()
    await field('Número *').setValue('')
    await wrapper.find('form').trigger('submit')
    expect(useResidentsStore(pinia).residents).toHaveLength(0)
    expect(field('Número *').classes()).toContain('invalid')
  })

  it('aplica máscaras na digitação e na colagem, incluindo telefone fixo e celular', async () => {
    await render()
    for (const [label, raw, expected] of [
      ['CPF *', 'ABC123DEF45', 'ABC.123.DEF-45'],
      ['Data de nascimento *', 'abc10051990', '10/05/1990'],
      ['Telefone *', '1134567890', '(11)3456-7890'],
      ['Telefone *', '11987654321', '(11)98765-4321'],
      ['CEP *', 'abc05508000', '05508-000'],
      ['Cidade *', 'São Paulo 2', 'São Paulo '],
    ]) {
      await field(label).setValue(raw)
      expect(field(label).element.value).toBe(expected)
    }
    await field('CPF *').setValue('ABC.123.DEF-4')
    expect(field('CPF *').element.value).toBe('ABC.123.DEF-4')
    await field('CPF *').setValue('')
    expect(field('CPF *').element.value).toBe('')
    expect(field('Nome completo *').attributes('maxlength')).toBe('200')
    expect(field('Nome social').attributes('maxlength')).toBe('200')
    expect(field('Endereço *').attributes('maxlength')).toBe('150')
    expect(field('Cidade *').attributes('maxlength')).toBe('50')
  })

  it.each([
    ['CPF *', '123', '11 caracteres'],
    ['Data de nascimento *', '31022000', 'data válida'],
    ['Telefone *', '111234567', '10 ou 11 dígitos'],
    ['E-mail', 'email-sem-arroba', 'e-mail válido'],
    ['Nome completo *', 'A'.repeat(201), '200 caracteres'],
    ['Nome social', 'A'.repeat(201), '200 caracteres'],
    ['Endereço *', 'A'.repeat(151), '150 caracteres'],
  ])('bloqueia o cadastro com %s inválido e exibe erro acessível', async (label, value, message) => {
    await render()
    await fillForm()
    await field(label).setValue(value)
    await wrapper.find('form').trigger('submit')
    expect(useResidentsStore(pinia).residents).toHaveLength(0)
    expect(field(label).attributes('aria-invalid')).toBe('true')
    expect(wrapper.get(`#${field(label).attributes('aria-describedby')}`).text()).toContain(message)
  })

  it('valida e salva associados usando as mesmas máscaras e formato de data', async () => {
    await render()
    await fillForm()
    const associatesGroup = wrapper.findAll('fieldset').find((group) => group.text().includes('Há mais associados'))
    await associatesGroup.find('input').setValue(true)
    const associate = wrapper.get('.associate-card')
    const inputs = associate.findAll('input')
    await inputs[0].setValue('Associado #2')
    await inputs[1].setValue('ABC123DEF45')
    await inputs[2].setValue('31022000')
    await wrapper.find('form').trigger('submit')
    expect(useResidentsStore(pinia).residents).toHaveLength(0)
    expect(associate.text()).toContain('data válida')
    await inputs[2].setValue('29022000')
    await inputs[3].setValue('a@b.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(createHousehold).toHaveBeenCalledWith(expect.any(Object), [expect.objectContaining({ name: 'Associado #2', cpf: 'ABC.123.DEF-45', birthDate: '2000-02-29', email: 'a@b.com' })])
  })

  it('preenche e bloqueia apenas endereço, cidade e estado quando encontra o CEP', async () => {
    vi.mocked(lookupCep).mockResolvedValue({ endereco: 'Rua Retornada', cidade: 'São Paulo', estado: 'SP' })
    await render()
    await field('CEP *').setValue('05508-000')
    await field('CEP *').trigger('blur')
    await flushPromises()
    expect(lookupCep).toHaveBeenCalledWith('05508-000', expect.any(AbortSignal))
    expect(field('Endereço *').element.value).toBe('Rua Retornada')
    expect(field('Cidade *').element.value).toBe('São Paulo')
    expect(field('Estado *').element.value).toBe('SP')
    for (const label of ['Endereço *', 'Cidade *', 'Estado *']) expect(field(label).element.disabled).toBe(true)
    for (const label of ['Número *', 'Complemento']) expect(field(label).element.disabled).toBe(false)
    await field('CEP *').setValue('01001-000')
    expect(field('Endereço *').element.disabled).toBe(false)
  })

  it('mantém preenchimento manual disponível quando a consulta falha', async () => {
    vi.mocked(lookupCep).mockRejectedValue(new Error('CEP não encontrado. Preencha o endereço manualmente.'))
    await render()
    await field('CEP *').setValue('99999-999')
    await field('CEP *').trigger('blur')
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('CEP não encontrado')
    expect(field('Endereço *').element.disabled).toBe(false)
  })

  it('ignora resposta de um CEP alterado enquanto a consulta estava em andamento', async () => {
    let resolve
    vi.mocked(lookupCep).mockReturnValue(new Promise((done) => { resolve = done }))
    await render()
    await field('CEP *').setValue('05508-000')
    await field('CEP *').trigger('blur')
    await field('CEP *').setValue('01001-000')
    resolve({ endereco: 'Endereço antigo', cidade: 'São Paulo', estado: 'SP' })
    await flushPromises()
    expect(field('Endereço *').element.value).toBe('')
    expect(field('Endereço *').element.disabled).toBe(false)
  })

  it('oferece breadcrumb no header do cadastro para retornar à lista', async () => {
    await render(AppShell)
    const breadcrumb = wrapper.get('nav[aria-label="Caminho de navegação"]')
    expect(breadcrumb.get('[aria-current="page"]').text()).toBe('Cadastrar morador')
    await breadcrumb.get('a').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/app/moradores')
  })

  it('remove a seção de download de comprovantes dos cadastros existentes', async () => {
    useResidentsStore(pinia).residents = [{ id: 1, name: 'Teste', birthDate: '1990-01-01', status: 'active', monthlyFee: 0.5 }]
    await render(ResidentDetailView, '/app/moradores/1')
    expect(wrapper.find('.document-row').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Baixar')
  })
})
