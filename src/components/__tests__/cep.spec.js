import { afterEach, describe, expect, it, vi } from 'vitest'
import { lookupCep } from '@/services/cep'

afterEach(() => vi.unstubAllGlobals())

describe('consulta de CEP', () => {
  it('normaliza o CEP e retorna o endereço recebido do ViaCEP', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ logradouro: 'Praça da Sé', localidade: 'São Paulo', uf: 'SP', estado: 'São Paulo', complemento: 'lado ímpar' }), { headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(lookupCep('01001-000')).resolves.toEqual({ endereco: 'Praça da Sé', cidade: 'São Paulo', estado: 'SP' })
    expect(fetchMock).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/', expect.any(Object))
  })

  it('não consulta CEP com quantidade inválida de dígitos', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(lookupCep('123')).rejects.toThrow('8 dígitos')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('encaminha o sinal de cancelamento para o ViaCEP', async () => {
    const controller = new AbortController()
    const error = new DOMException('Cancelado', 'AbortError')
    const fetchMock = vi.fn().mockRejectedValue(error)
    vi.stubGlobal('fetch', fetchMock)
    await expect(lookupCep('01001000', controller.signal)).rejects.toBe(error)
    expect(fetchMock).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/', {
      signal: controller.signal, headers: { Accept: 'application/json' },
    })
  })

  it('permite preenchimento manual quando a conexão falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(lookupCep('01001000')).rejects.toThrow('Consulta de CEP indisponível')
  })

  it.each(['', 'sp', 'São Paulo'])('rejeita UF inválida %s', async (uf) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ logradouro: 'Praça da Sé', localidade: 'São Paulo', uf }), { headers: { 'Content-Type': 'application/json' } })))
    await expect(lookupCep('01001000')).rejects.toThrow('Endereço incompleto')
  })

  it.each([
    [200, 'application/json', '{"erro":true}', 'não encontrado'],
    [200, 'application/json', '{"erro":"true"}', 'não encontrado'],
    [400, 'application/json', '{}', 'indisponível'],
    [200, 'application/json', 'null', 'indisponível'],
    [200, 'application/json', 'invalid json', 'indisponível'],
    [404, 'application/json', '{}', 'não encontrado'],
    [500, 'application/json', '{}', 'indisponível'],
    [200, 'text/html', '<html></html>', 'indisponível'],
    [200, 'application/json', '{"localidade":"São Paulo","uf":"SP"}', 'incompleto'],
  ])('trata resposta %s / %s sem bloquear o preenchimento manual', async (status, contentType, body, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status, headers: { 'Content-Type': contentType } })))
    await expect(lookupCep('05508000')).rejects.toThrow(message)
  })
})
