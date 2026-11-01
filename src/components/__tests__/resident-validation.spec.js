import { describe, expect, it } from 'vitest'
import { maskCpf, maskDate, maskPhone, maskCep, formatCity, dateToIso, personalErrors, residentialErrors, isEmail } from '@/utils/residentValidation'

const validPerson = { name: 'Maria #2 — Souza', socialName: '', cpf: 'ABC.123.DEF-45', birthDate: '29/02/2000', phone: '(11)1234-5678', email: 'a@b.com' }
const validAddress = { cep: '05508-000', street: 'Av. João, nº 123 / fundos', city: "São João d’Aliança" }

describe('máscaras e validações do cadastro', () => {
  it.each([
    ['12345678901', '123.456.789-01'],
    ['ABC123DEF45', 'ABC.123.DEF-45'],
    ['ABC.123.DEF-45', 'ABC.123.DEF-45'],
    ['!12@3#456789012345', '123.456.789-01'],
    ['', ''], ['1234', '123.4'],
  ])('formata CPF %s', (value, expected) => expect(maskCpf(value)).toBe(expected))

  it.each([
    ['1134567890', '(11)3456-7890'], ['11987654321', '(11)98765-4321'],
    ['(11) 98765-4321', '(11)98765-4321'], ['abc11987654321999', '(11)98765-4321'],
    ['', ''], ['11', '(11'], ['113', '(11)3'],
  ])('formata telefone %s', (value, expected) => expect(maskPhone(value)).toBe(expected))

  it('formata e limita CEP e nascimento, removendo letras', () => {
    expect(maskCep('abc05508000999')).toBe('05508-000')
    expect(maskDate('a29022000z999')).toBe('29/02/2000')
    expect(maskDate('2902')).toBe('29/02')
    expect(maskDate('')).toBe('')
  })

  it.each(['31/02/2000', '29/02/1900', '00/01/2000', '01/13/2000', '10/10/0000', '10/10/20'])('rejeita data incompleta ou inexistente %s', (value) => {
    expect(dateToIso(value)).toBeNull()
  })

  it('converte datas válidas para o formato salvo e respeita anos bissextos', () => {
    expect(dateToIso('29/02/2000')).toBe('2000-02-29')
    expect(dateToIso('31/12/1990')).toBe('1990-12-31')
  })

  it.each(['a@b.com', 'nome.sobrenome+tag@dominio.com.br'])('aceita email simples %s', (value) => expect(isEmail(value)).toBe(true))
  it.each(['a@b', '1@2', '@dominio', 'nome@', 'nome dominio@a', 'nome@@dominio', '!@b', 'a@!'])('rejeita email inválido %s', (value) => expect(isEmail(value)).toBe(false))

  it('aceita nomes com números, acentos e símbolos e nomes opcionais vazios', () => {
    expect(Object.values(personalErrors(validPerson)).some(Boolean)).toBe(false)
    expect(personalErrors({ ...validPerson, name: 'A'.repeat(200), socialName: 'B'.repeat(200), email: '' }).name).toBe('')
    expect(personalErrors({ ...validPerson, name: 'A'.repeat(201), socialName: 'B'.repeat(201) })).toMatchObject({ name: 'Use no máximo 200 caracteres.', socialName: 'Use no máximo 200 caracteres.' })
    expect(personalErrors({ ...validPerson, name: '   ' }).name).toBeTruthy()
  })

  it('exige CPF completo, data válida e telefone com DDD', () => {
    const errors = personalErrors({ ...validPerson, cpf: '123', birthDate: '31/02/2000', phone: '(11)123-4567' })
    for (const field of ['cpf', 'birthDate', 'phone']) expect(errors[field]).toBeTruthy()
    for (const phone of ['(11)1234-5678', '(11)91234-5678']) expect(personalErrors({ ...validPerson, phone }).phone).toBe('')
    expect(personalErrors({ ...validPerson, phone: '' }, false).phone).toBe('')
  })

  it('aceita caracteres especiais no endereço e cidade e verifica os limites', () => {
    expect(Object.values(residentialErrors(validAddress)).some(Boolean)).toBe(false)
    expect(residentialErrors({ ...validAddress, street: 'A'.repeat(150), city: 'B'.repeat(50) })).toEqual({ cep: '', street: '', city: '' })
    expect(residentialErrors({ ...validAddress, street: 'A'.repeat(151), city: 'B'.repeat(51) })).toMatchObject({ street: 'Use no máximo 150 caracteres.', city: 'Use no máximo 50 caracteres.' })
    expect(residentialErrors({ ...validAddress, city: 'São Paulo 2' }).city).toBeTruthy()
    expect(formatCity('São João 123 — SP')).toBe('São João  — SP')
    expect(formatCity('A'.repeat(51))).toHaveLength(50)
  })
})
