// API de demonstração disponível somente no servidor Vite em modo standalone.
export function standaloneApi() {
  const homes = [
    { id_moradia: 1, rua: 'Rua da Comunidade', numero: '100', bloco: 'A', proprietario: 'Ana Demonstração', numero_residentes: 2 },
    { id_moradia: 2, rua: 'Rua da Comunidade', numero: '200', bloco: 'B', proprietario: 'Bia Demonstração', numero_residentes: 1 },
  ]
  const people = [
    { id_associado: 1, id_moradia: 1, nome: 'Ana Demonstração', documento: '00000000000', data_nascimento: '1990-01-10', telefone: '(11)90000-0000', email: null, tipo_associacao: 'proprietario', situacao_cadastro: 'ativo', dth_ingresso: '2026-01-01T12:00:00' },
    { id_associado: 2, id_moradia: 1, nome: 'Carlos Demonstração', documento: '00000000000', data_nascimento: '1988-05-20', telefone: '(11)90000-0000', email: null, tipo_associacao: 'associado', situacao_cadastro: 'ativo', dth_ingresso: '2026-01-01T12:00:00' },
    { id_associado: 3, id_moradia: 2, nome: 'Bia Demonstração', documento: '00000000000', data_nascimento: '1995-03-15', telefone: '(11)90000-0000', email: null, tipo_associacao: 'proprietario', situacao_cadastro: 'pendente', dth_ingresso: '2026-10-01T12:00:00' },
  ]
  const documents = [{ id_comprovante: 1, id_associado: 3, tipo_documento: 'outro', caminho_arquivo: 'comprovante-demonstracao.pdf', status_aprovacao: 'pendente' }]
  const payments = []
  const resources = {
    moradias: { rows: homes, key: 'id_moradia' },
    associados: { rows: people, key: 'id_associado' },
    comprovantes: { rows: documents, key: 'id_comprovante' },
    pagamentos: { rows: payments, key: 'id_pagamento' },
  }
  const nextIds = { moradias: 3, associados: 4, comprovantes: 2, pagamentos: 1 }
  const token = 'ccb-local-demo-token'

  return {
    name: 'ccb-standalone-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()
        const send = (status, data) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(status === 204 ? undefined : JSON.stringify(data))
        }
        try {
          let raw = ''
          if (['POST', 'PUT'].includes(req.method)) {
            for await (const chunk of req) raw += chunk
          }
          if (url.pathname === '/api/v1/auth/token' && req.method === 'POST') {
            const form = new URLSearchParams(raw)
            if (form.get('username') !== 'demo@example.com' || form.get('password') !== 'demonstracao') {
              return send(401, { detail: 'Use as credenciais de demonstração indicadas na tela.' })
            }
            return send(200, { access_token: token, token_type: 'bearer' })
          }
          if (req.headers.authorization !== `Bearer ${token}`) return send(401, { detail: 'Não autenticado' })
          const monthlyMatch = /^\/api\/v1\/associados\/(\d+)\/mensalidade$/.exec(url.pathname)
          if (monthlyMatch && req.method === 'PUT') {
            const person = people.find((row) => row.id_associado === Number(monthlyMatch[1]))
            if (!person) return send(404, { detail: 'Associado não encontrado' })
            if (!['ativo', 'mensalidade_atrasada'].includes(person.situacao_cadastro)) return send(409, { detail: 'O cadastro precisa estar ativado.' })
            const body = JSON.parse(raw)
            if (typeof body.atraso !== 'boolean' || (!body.atraso && !/^\d{4}-\d{2}-\d{2}$/.test(body.data_pagamento || '')) || (body.atraso && body.data_pagamento)) {
              return send(422, { detail: 'Informe a data do pagamento ou marque mensalidade atrasada.' })
            }
            person.situacao_cadastro = body.atraso ? 'mensalidade_atrasada' : 'ativo'
            if (!body.atraso) person.data_ultimo_pagamento = body.data_pagamento
            return send(200, person)
          }
          const match = /^\/api\/v1\/(moradias|associados|comprovantes|pagamentos)(?:\/(\d+))?\/?$/.exec(url.pathname)
          if (!match) return send(404, { detail: 'Recurso de demonstração não encontrado' })
          const [, name, id] = match
          const { rows, key } = resources[name]
          const item = id ? rows.find((row) => row[key] === Number(id)) : null
          if (id && !item) return send(404, { detail: 'Registro não encontrado' })
          if (req.method === 'GET') {
            const skip = Math.max(0, Number(url.searchParams.get('skip')) || 0)
            const limit = Math.max(1, Number(url.searchParams.get('limit')) || 100)
            return send(200, id ? item : rows.slice(skip, skip + limit))
          }
          if (req.method === 'POST' && !id) {
            const created = { ...JSON.parse(raw), [key]: nextIds[name]++ }
            rows.push(created)
            return send(201, created)
          }
          if (req.method === 'PUT' && item) {
            Object.assign(item, JSON.parse(raw), { [key]: Number(id) })
            return send(200, item)
          }
          if (req.method === 'DELETE' && item) {
            rows.splice(rows.indexOf(item), 1)
            return send(204)
          }
          return send(405, { detail: 'Método não permitido' })
        } catch {
          return send(400, { detail: 'Requisição de demonstração inválida' })
        }
      })
    },
  }
}
