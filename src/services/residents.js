import { listAll, request } from './api'

const date = (value) => value ? new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('pt-BR') : 'Não informado'
const statusMap = { ativo: 'active', pendente: 'pending', inativo: 'inactive' }

export async function loadResidents() {
  const [people, homes, documents, payments] = await Promise.all([
    listAll('associados'), listAll('moradias'), listAll('comprovantes'), listAll('pagamentos'),
  ])
  return people.map((person) => {
    const home = homes.find((item) => item.id_moradia === person.id_moradia)
    const unitPeople = new Set(people.filter((item) => item.id_moradia === person.id_moradia).map((item) => item.id_associado))
    const latestPayment = payments.filter((item) => unitPeople.has(item.id_associado))
      .sort((a, b) => b.dth_pagamento.localeCompare(a.dth_pagamento) || b.id_pagamento - a.id_pagamento)[0]
    const doc = documents.filter((item) => item.id_associado === person.id_associado)
      .sort((a, b) => b.id_comprovante - a.id_comprovante)[0]
    const address = home ? `${home.rua}, ${home.numero}${home.bloco ? ` · Bloco ${home.bloco}` : ''}` : 'Moradia não encontrada'
    const status = statusMap[person.situacao_cadastro] || 'unknown'
    const cpf = person.documento?.replace(/[^a-z0-9]/gi, '') || ''
    return {
      id: person.id_associado, homeId: person.id_moradia, name: person.nome, socialName: person.nome_social || '',
      cpf: cpf.length === 11 ? `***.${cpf.slice(3, 6)}.***-${cpf.slice(9)}` : 'Não informado',
      birthDate: person.data_nascimento, phone: person.telefone || 'Não informado', email: person.email || '',
      status: status === 'active' && latestPayment?.atraso ? 'overdue' : status,
      unit: address, address, owner: person.tipo_associacao === 'proprietario',
      monthlyFee: home?.numero_residentes > 1 ? 1 : 0.5,
      createdAt: date(person.dth_ingresso), deactivatedAt: date(person.dth_saida),
      lastPayment: date(latestPayment?.dth_pagamento), dueDate: 'Não disponível na API',
      document: doc ? { id: doc.id_comprovante, file: doc.caminho_arquivo,
        status: { aprovado: 'approved', reprovado: 'rejected', pendente: 'pending' }[doc.status_aprovacao] || 'unknown' } : null,
    }
  })
}

// A API atual não oferece cadastro transacional. Compensa apenas os registros criados nesta operação.
export async function createHousehold(primary, associates = []) {
  const home = await request('/moradias/', { method: 'POST', body: {
    rua: primary.street.trim(), numero: primary.number.trim(), bloco: primary.block?.trim() || null,
    proprietario: primary.owner ? primary.name.trim() : primary.ownerName.trim(),
    numero_residentes: 1 + associates.length,
  } })
  const created = []
  try {
    for (const person of [primary, ...associates]) {
      created.push(await request('/associados/', { method: 'POST', body: {
        nome: person.name.trim(), nome_social: person.socialName?.trim() || null,
        documento: person.cpf.replace(/[^a-z0-9]/gi, ''), data_nascimento: person.birthDate,
        telefone: person.phone || null, email: person.email?.trim() || null,
        tipo_associacao: person === primary && primary.owner ? 'proprietario' : 'associado',
        situacao_cadastro: 'pendente', dth_ingresso: new Date().toISOString(), id_moradia: home.id_moradia,
      } }))
    }
    return created[0].id_associado
  } catch (error) {
    const failures = []
    for (const person of created.reverse()) {
      try { await request(`/associados/${person.id_associado}`, { method: 'DELETE' }) }
      catch { failures.push(`associado ${person.id_associado}`) }
    }
    if (!failures.length) {
      try { await request(`/moradias/${home.id_moradia}`, { method: 'DELETE' }) }
      catch { failures.push(`moradia ${home.id_moradia}`) }
    } else failures.push(`moradia ${home.id_moradia}`)
    throw new Error(`${error.message}${failures.length ? ` Cadastro parcial: confira ${failures.join(', ')} antes de tentar novamente.` : ' O cadastro não foi concluído; os registros confirmados foram removidos.'}`, { cause: error })
  }
}

export const updateResident = (id, body) => request(`/associados/${id}`, { method: 'PUT', body })
export const updateDocument = (id, status) => request(`/comprovantes/${id}`, { method: 'PUT', body: { status_aprovacao: status } })

export const createPayment = (id, body) => request('/pagamentos/', { method: 'POST', body: { ...body, id_associado: id } })
