export async function lookupCep(cep, signal) {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) throw new Error('Informe um CEP com 8 dígitos.')
  let response
  let data
  try {
    response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal, headers: { Accept: 'application/json' },
    })
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      data = await response.json()
    }
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Consulta de CEP indisponível. Preencha o endereço manualmente.', { cause: error })
  }
  if (response.status === 404 || data?.erro) {
    throw new Error('CEP não encontrado. Preencha o endereço manualmente.')
  }
  if (!response.ok || !data) {
    throw new Error('Consulta de CEP indisponível. Preencha o endereço manualmente.')
  }
  if (!data.logradouro || !data.localidade || !/^[A-Z]{2}$/.test(data.uf || '')) {
    throw new Error('Endereço incompleto para este CEP. Preencha os campos manualmente.')
  }
  return { endereco: data.logradouro, cidade: data.localidade, estado: data.uf }
}
