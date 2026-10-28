const digits = (value, limit) => String(value).replace(/\D/g, '').slice(0, limit)

function grouped(value, sizes, separators) {
  let offset = 0
  return sizes.reduce((result, size, index) => {
    const part = value.slice(offset, offset + size)
    offset += size
    return part ? result + (index ? separators[index - 1] : '') + part : result
  }, '')
}

export const maskCpf = (value) => grouped(String(value).replace(/[^a-z0-9]/gi, '').slice(0, 11), [3, 3, 3, 2], ['.', '.', '-'])
export const maskDate = (value) => grouped(digits(value, 8), [2, 2, 4], ['/', '/'])
export const maskCep = (value) => grouped(digits(value, 8), [5, 3], ['-'])
export function maskPhone(value) {
  const number = digits(value, 11)
  if (!number) return ''
  if (number.length <= 2) return `(${number}`
  return `(${number.slice(0, 2)})${grouped(number.slice(2), [number.length > 10 ? 5 : 4, 4], ['-'])}`
}
export const formatCity = (value) => String(value).replace(/\p{N}/gu, '').slice(0, 50)

export function dateToIso(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null
  const [day, month, year] = value.split('/').map(Number)
  if (year < 1 || month < 1 || month > 12 || day < 1) return null
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= days[month - 1] ? `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null
}

// O e-mail é opcional. Não exige ponto no domínio, conforme a regra do formulário.
export const isEmail = (value) => /^[^\s@]*[a-z0-9][^\s@]*@[^\s@]*[a-z0-9][^\s@]*$/i.test(value)

export function personalErrors(person, phoneRequired = true) {
  return {
    name: !person.name.trim() ? 'Informe o nome completo.' : person.name.length > 200 ? 'Use no máximo 200 caracteres.' : '',
    socialName: (person.socialName || '').length > 200 ? 'Use no máximo 200 caracteres.' : '',
    cpf: !/^[a-z0-9]{3}\.[a-z0-9]{3}\.[a-z0-9]{3}-[a-z0-9]{2}$/i.test(person.cpf) ? 'Informe os 11 caracteres do CPF.' : '',
    birthDate: !dateToIso(person.birthDate) ? 'Informe uma data válida no formato dd/mm/aaaa.' : '',
    phone: (phoneRequired || person.phone) && !/^\(\d{2}\)\d{4,5}-\d{4}$/.test(person.phone) ? 'Informe DDD e telefone com 10 ou 11 dígitos.' : '',
    email: person.email && !isEmail(person.email) ? 'Informe um e-mail válido, como nome@dominio.' : '',
  }
}

export function residentialErrors(form) {
  return {
    cep: !/^\d{5}-\d{3}$/.test(form.cep) ? 'Informe os 8 dígitos do CEP.' : '',
    street: !form.street.trim() ? 'Informe o endereço.' : form.street.length > 150 ? 'Use no máximo 150 caracteres.' : '',
    city: !form.city.trim() ? 'Informe a cidade.' : form.city.length > 50 ? 'Use no máximo 50 caracteres.' : /\p{N}/u.test(form.city) ? 'A cidade não pode conter números.' : '',
  }
}
