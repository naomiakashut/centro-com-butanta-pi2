import { afterEach, describe, expect, it, vi } from 'vitest'
import { lookupCep } from '@/services/cep'

afterEach(() => vi.unstubAllGlobals())

describe('consulta de CEP', () => {
  it('normaliza o CEP e retorna o endereço recebido do backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ endereco: 'Rua A', cidade: 'São Paulo', estado: 'SP' }), { headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(lookupCep('05508-000')).resolves.toEqual({ endereco: 'Rua A', cidade: 'São Paulo', estado: 'SP' })
    expect(fetchMock).toHaveBeenCalledWith('/api/cep/05508000', expect.any(Object))
  })

  it('não consulta CEP com quantidade inválida de dígitos', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(lookupCep('123')).rejects.toThrow('8 dígitos')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [404, 'application/json', '{}', 'não encontrado'],
    [500, 'application/json', '{}', 'indisponível'],
    [200, 'text/html', '<html></html>', 'indisponível'],
    [200, 'application/json', '{"cidade":"São Paulo","estado":"SP"}', 'incompleto'],
  ])('trata resposta %s / %s sem bloquear o preenchimento manual', async (status, contentType, body, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status, headers: { 'Content-Type': contentType } })))
    await expect(lookupCep('05508000')).rejects.toThrow(message)
  })
})
