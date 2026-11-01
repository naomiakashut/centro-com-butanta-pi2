import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  const resident = { id_associado: 1, id_moradia: 1, nome: 'Pessoa Teste', documento: '52998224725', data_nascimento: '1990-01-01', situacao_cadastro: 'pendente' }
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.endsWith('/auth/token')) {
      const body = new URLSearchParams(request.postData())
      return route.fulfill({ json: body.get('password') === 'senha-teste' ? { access_token: 'teste-jwt' } : { detail: 'Email ou senha incorretos' }, status: body.get('password') === 'senha-teste' ? 200 : 401 })
    }
    if (request.headers().authorization !== 'Bearer teste-jwt') return route.fulfill({ status: 401, json: { detail: 'Não autenticado' } })
    if (url.pathname.endsWith('/associados/1') && request.method() === 'PUT') {
      Object.assign(resident, request.postDataJSON())
      return route.fulfill({ json: resident })
    }
    const data = url.pathname.includes('/associados/') ? [resident]
      : url.pathname.includes('/moradias/') ? [{ id_moradia: 1, rua: 'Rua Teste', numero: '10', numero_residentes: 1 }] : []
    return route.fulfill({ json: data })
  })
  await page.goto('/')
})

test('autentica, carrega, aprova e preserva o cadastro após recarregar', async ({ page }) => {
  await page.getByLabel('E-mail', { exact: true }).fill('admin@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('senha-teste')
  await page.getByRole('button', { name: 'Entrar no painel' }).click()
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
  await page.getByText('Pessoa Teste').click()
  await page.getByRole('button', { name: 'Aprovar cadastro' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Cadastro aprovado' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Ativado', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Boas-vindas' })).toBeVisible()
  await page.goto('/app/moradores/1')
  await expect(page.getByRole('heading', { name: 'Boas-vindas' })).toBeVisible()
})

test('exibe falha de autenticação sem liberar o painel', async ({ page }) => {
  await page.getByLabel('E-mail', { exact: true }).fill('admin@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('incorreta')
  await page.getByRole('button', { name: 'Entrar no painel' }).click()
  await expect(page.getByRole('alert')).toHaveText('Email ou senha incorretos')
  await expect(page).toHaveURL(/\/login$/)
})

test('consulta o ViaCEP e preenche endereço, cidade e estado', async ({ page }) => {
  await page.route('https://viacep.com.br/ws/01001000/json/', (route) => route.fulfill({
    json: { cep: '01001-000', logradouro: 'Praça da Sé', localidade: 'São Paulo', uf: 'SP', estado: 'São Paulo', complemento: 'lado ímpar' },
  }))
  await page.getByLabel('E-mail', { exact: true }).fill('admin@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('senha-teste')
  await page.getByRole('button', { name: 'Entrar no painel' }).click()
  await page.getByRole('link', { name: 'Novo cadastro', exact: true }).click()
  await page.getByLabel('CEP *', { exact: true }).fill('01001-000')
  await page.getByRole('button', { name: 'Consultar CEP' }).click()
  await expect(page.getByLabel('Endereço *', { exact: true })).toHaveValue('Praça da Sé')
  await expect(page.getByLabel('Cidade *', { exact: true })).toHaveValue('São Paulo')
  await expect(page.locator('select[name="state"]')).toHaveValue('SP')
  await expect(page.getByLabel('Endereço *', { exact: true })).toBeDisabled()
  await expect(page.getByLabel('Bloco', { exact: true })).toHaveValue('')
})
