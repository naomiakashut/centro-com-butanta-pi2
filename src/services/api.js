const TOKEN_KEY = 'ccb-access-token'
const API_URL = (import.meta.env.MODE === 'standalone' ? '/api/v1' : import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem('ccb-auth')
  window.dispatchEvent(new Event('ccb-session-ended'))
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function request(path, { method = 'GET', body, authenticated = true } = {}) {
  const token = getToken()
  const headers = new Headers()
  if (authenticated && token) headers.set('Authorization', `Bearer ${token}`)
  if (body instanceof URLSearchParams) headers.set('Content-Type', 'application/x-www-form-urlencoded')
  else if (body !== undefined) headers.set('Content-Type', 'application/json')
  let response
  try {
    const options = { method, headers }
    if (body !== undefined) options.body = body instanceof URLSearchParams ? body : JSON.stringify(body)
    response = await fetch(`${API_URL}${path}`, options)
  } catch {
    throw new ApiError(`Não foi possível conectar à API. Verifique se o back-end está disponível.${method !== 'GET' && authenticated ? ' A confirmação da operação não foi recebida; confira os dados antes de tentar novamente.' : ''}`, 0)
  }
  if (authenticated && token !== getToken()) throw new ApiError('A sessão foi alterada. Entre novamente.', 401)
  if (response.status === 401 && authenticated) {
    clearSession()
    throw new ApiError('Sua sessão expirou. Entre novamente.', 401)
  }
  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = data?.detail
    const message = Array.isArray(detail)
      ? detail.map((item) => `${item.loc?.slice(1).join('.')}: ${item.msg}`).join('; ')
      : typeof detail === 'string' ? detail : `A API retornou um erro (${response.status}).`
    throw new ApiError(message, response.status)
  }
  return data
}

export async function login(email, password) {
  const data = await request('/auth/token', {
    method: 'POST', authenticated: false,
    body: new URLSearchParams({ username: email, password }),
  })
  if (!data?.access_token) throw new ApiError('Resposta de autenticação inválida.', 502)
  sessionStorage.setItem(TOKEN_KEY, data.access_token)
}

export async function listAll(resource) {
  const result = []
  const limit = 100
  for (let skip = 0; ; skip += limit) {
    const page = await request(`/${resource}/?skip=${skip}&limit=${limit}`)
    if (!Array.isArray(page)) throw new ApiError('Resposta de listagem inválida.', 502)
    result.push(...page)
    if (page.length < limit) return result
  }
}
