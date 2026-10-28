// O backend deve consultar os Correios com as credenciais do serviço e retornar
// { endereco, cidade, estado }. Credenciais nunca devem ser expostas no frontend.
export async function lookupCep(cep, signal) {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) throw new Error('Informe um CEP com 8 dígitos.')
  const response = await fetch(`/api/cep/${digits}`, { signal, headers: { Accept: 'application/json' } })
  if (response.status === 404) throw new Error('CEP não encontrado. Preencha o endereço manualmente.')
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Consulta de CEP indisponível. Preencha o endereço manualmente.')
  }
  const data = await response.json()
  if (!data.endereco || !data.cidade || !/^[A-Z]{2}$/.test(data.estado || '')) {
    throw new Error('Endereço incompleto para este CEP. Preencha os campos manualmente.')
  }
  return { endereco: data.endereco, cidade: data.cidade, estado: data.estado }
}
