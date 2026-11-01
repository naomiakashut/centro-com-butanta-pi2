import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useResidentsStore } from '@/stores/residents'
import { createHousehold, loadResidents } from '@/services/residents'
import { clearSession, getToken, listAll, login, request } from '@/services/api'

const primary = { name: 'Ana Teste', cpf: 'ABC.123.DEF-45', birthDate: '1990-01-01', email: '', phone: '(11)99999-9999', street: 'Rua A', number: '12', block: 'B', owner: true }
let fetchMock
function respond(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data }
}
beforeEach(() => {
  const values = {}
  vi.stubGlobal('sessionStorage', {
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => { values[key] = String(value) },
    removeItem: (key) => { delete values[key] },
  })
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  setActivePinia(createPinia())
})
afterEach(() => vi.unstubAllGlobals())

describe('contrato HTTP e sessão', () => {
  it('envia login OAuth2 como formulário e o JWT nas consultas', async () => {
    fetchMock.mockResolvedValueOnce(respond({ access_token: 'jwt' })).mockResolvedValueOnce(respond([]))
    await login('ana@example.com', 'senha')
    const [, options] = fetchMock.mock.calls[0]
    expect(options.body).toBeInstanceOf(URLSearchParams)
    expect(options.body.get('username')).toBe('ana@example.com')
    expect(options.body.get('password')).toBe('senha')
    await request('/associados/')
    expect(fetchMock.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer jwt')
  })
  it('invalida a sessão em 401 e preserva o erro de credenciais', async () => {
    sessionStorage.setItem('ccb-access-token', 'expirado')
    fetchMock.mockResolvedValueOnce(respond({}, 401)).mockResolvedValueOnce(respond({ detail: 'Email ou senha incorretos' }, 401))
    await expect(request('/associados/')).rejects.toThrow('Sua sessão expirou')
    expect(getToken()).toBeNull()
    await expect(login('ana@example.com', 'errada')).rejects.toThrow('Email ou senha incorretos')
  })
  it('lê todas as páginas, sem truncar o centésimo cadastro', async () => {
    fetchMock.mockResolvedValueOnce(respond(Array.from({ length: 100 }, (_, id) => ({ id })))).mockResolvedValueOnce(respond([{ id: 100 }]))
    expect(await listAll('associados')).toHaveLength(101)
    expect(fetchMock.mock.calls[1][0]).toContain('skip=100&limit=100')
  })
  it('não reutiliza resposta de uma sessão encerrada', async () => {
    sessionStorage.setItem('ccb-access-token', 'jwt')
    let finish
    fetchMock.mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const pending = request('/associados/')
    clearSession()
    finish(respond([]))
    await expect(pending).rejects.toThrow('A sessão foi alterada')
  })
  it('apresenta validações 422 e indisponibilidade da API', async () => {
    fetchMock.mockResolvedValueOnce(respond({ detail: [{ loc: ['body', 'email'], msg: 'invalid email' }] }, 422))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(request('/associados/')).rejects.toThrow('email: invalid email')
    await expect(request('/associados/')).rejects.toThrow('Não foi possível conectar')
  })
})

describe('integração de moradores', () => {
  it('cria uma moradia compartilhada, sem campos extras ou email vazio', async () => {
    fetchMock.mockResolvedValueOnce(respond({ id_moradia: 8 })).mockResolvedValueOnce(respond({ id_associado: 10 })).mockResolvedValueOnce(respond({ id_associado: 11 }))
    expect(await createHousehold(primary, [{ ...primary, name: 'Outro' }])).toBe(10)
    const bodies = fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body))
    expect(bodies[0]).toEqual({ rua: 'Rua A', numero: '12', bloco: 'B', proprietario: 'Ana Teste', numero_residentes: 2 })
    expect(bodies[1]).toMatchObject({ id_moradia: 8, documento: 'ABC123DEF45', email: null, situacao_cadastro: 'pendente' })
    expect(bodies[2]).toMatchObject({ id_moradia: 8, tipo_associacao: 'associado' })
  })
  it('remove apenas os registros novos quando o cadastro falha', async () => {
    fetchMock.mockResolvedValueOnce(respond({ id_moradia: 8 })).mockResolvedValueOnce(respond({ id_associado: 10 }))
      .mockResolvedValueOnce(respond({ detail: 'Dados inválidos' }, 422))
      .mockResolvedValueOnce(respond(null, 204)).mockResolvedValueOnce(respond(null, 204))
    await expect(createHousehold(primary, [primary])).rejects.toThrow('os registros confirmados foram removidos')
    expect(fetchMock.mock.calls.slice(3).map(([url, options]) => [url, options.method])).toEqual([
      ['/api/v1/associados/10', 'DELETE'], ['/api/v1/moradias/8', 'DELETE'],
    ])
  })
  it('informa IDs de cadastro parcial se a compensação também falhar', async () => {
    fetchMock.mockResolvedValueOnce(respond({ id_moradia: 8 })).mockResolvedValueOnce(respond({ id_associado: 10 }))
      .mockRejectedValueOnce(new Error()).mockResolvedValueOnce(respond({}, 500))
    await expect(createHousehold(primary, [primary])).rejects.toThrow('confira associado 10, moradia 8')
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
  it('compõe entidades por ID, mascara CPF e mantém pendentes fora dos ativos', async () => {
    const people = [
      { id_associado: 1, id_moradia: 8, nome: 'Ana', documento: '52998224725', situacao_cadastro: 'ativo', data_nascimento: '1990-01-01' },
      { id_associado: 2, id_moradia: 8, nome: 'Bia', situacao_cadastro: 'pendente', data_nascimento: '1990-01-01' },
    ]
    fetchMock.mockImplementation(async (url) => respond(
      url.includes('/associados/') ? people : url.includes('/moradias/') ? [{ id_moradia: 8, rua: 'Rua A', numero: '12', numero_residentes: 2 }]
        : url.includes('/pagamentos/') ? [{ id_pagamento: 1, id_associado: 1, atraso: true, dth_pagamento: '2026-10-01T12:00:00' }] : [],
    ))
    const store = useResidentsStore()
    await store.load()
    expect(store.getById(1)).toMatchObject({ status: 'overdue', cpf: '***.982.***-25', homeId: 8 })
    expect(store.getById(2).status).toBe('pending')
    expect(store.activeResidents).toHaveLength(1)
    expect(store.pendingCount).toBe(1)
    store.clear()
    expect(store.residents).toHaveLength(0)
  })
  it('registra um pagamento real vinculado ao associado e recarrega o resumo', async () => {
    fetchMock.mockResolvedValue(respond([]))
    const store = useResidentsStore()
    await store.registerPayment(7, { valor: 20, nome_pagador: 'Ana', modo_pagamento: 'pix', dth_pagamento: '2026-10-31T13:00:00Z', atraso: false, parcial: true })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/pagamentos/')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject({ id_associado: 7, valor: 20, parcial: true })
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })
  it('não ativa o cadastro localmente se a aprovação falhar', async () => {
    fetchMock.mockResolvedValueOnce(respond({ detail: 'Falha ao aprovar' }, 500)).mockResolvedValue(respond([]))
    const store = useResidentsStore()
    store.residents = [{ id: 7, status: 'pending', document: null }]
    await expect(store.approveResident(7)).rejects.toThrow('Falha ao aprovar')
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT')
    expect(store.residents).toEqual([])
  })
  it('não cria moradores fictícios se a API falhar', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'))
    const store = useResidentsStore()
    await store.load()
    expect(store.residents).toEqual([])
    expect(store.error).toContain('Não foi possível conectar')
    await expect(loadResidents()).rejects.toThrow('Não foi possível conectar')
  })
})
