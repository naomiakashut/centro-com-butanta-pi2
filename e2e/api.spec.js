import process from 'node:process'
import { test, expect } from '@playwright/test'

// A execução com API real deve ser opt-in para não gravar em bancos existentes.
// eslint-disable-next-line playwright/no-skipped-test
test.skip(process.env.CCB_LIVE_API !== '1', 'Requer uma API com banco isolado e credenciais de teste.')

test('API real: login, cadastro, aprovação, pagamento, reload e desativação', async ({ page }) => {
  const email = process.env.CCB_TEST_EMAIL?.trim()
  const password = process.env.CCB_TEST_PASSWORD
  expect(email || '', 'Defina CCB_TEST_EMAIL com o e-mail válido de um administrador existente no banco de testes. Não use o texto de exemplo "email-do-admin-de-teste".')
    .toMatch(/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/)
  expect(Boolean(password) && !['senha-do-admin-de-teste', 'sua-senha-de-teste'].includes(password),
    'Defina CCB_TEST_PASSWORD com a senha real do administrador de testes. Não use a senha de exemplo do comando.').toBe(true)

  await test.step('Autenticar e confirmar acesso ao painel', async () => {
    await page.goto('/login')
    await page.getByLabel('E-mail', { exact: true }).fill(email)
    await page.getByLabel('Senha', { exact: true }).fill(password)
    const [response] = await Promise.all([
      page.waitForResponse((response) => new URL(response.url()).pathname.endsWith('/auth/token') && response.request().method() === 'POST'),
      page.getByRole('button', { name: 'Entrar no painel', exact: true }).click(),
    ])
    expect(response.status(), 'O login falhou: confira as credenciais e se a API está disponível no destino configurado.').toBe(200)
    await expect(page).toHaveURL(/\/app\/?$/)
    await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible()
  })

  const menu = page.getByRole('navigation', { name: 'Menu administrativo', exact: true })
  await menu.getByRole('link', { name: 'Novo cadastro', exact: true }).click()
  const registration = page.getByRole('form', { name: 'Cadastro de morador', exact: true })
  await expect(registration).toBeVisible()
  await page.route('https://viacep.com.br/ws/*/json/', (route) => route.fulfill({ json: { logradouro: 'Rua Integração', localidade: 'São Paulo', uf: 'SP' } }))
  await registration.getByLabel('Nome completo *', { exact: true }).fill('Pessoa Integração')
  await registration.getByLabel('CPF *', { exact: true }).fill('52998224725')
  await registration.getByLabel('Data de nascimento *', { exact: true }).fill('10051990')
  await registration.getByLabel('Telefone *', { exact: true }).fill('11999999999')
  await registration.getByLabel('CEP *', { exact: true }).fill('05508000')
  await registration.getByRole('button', { name: 'Consultar CEP', exact: true }).click()
  await expect(page.getByText('Endereço preenchido pelo CEP.', { exact: false })).toBeVisible()
  await registration.getByLabel('Número *', { exact: true }).fill('123')
  await registration.getByLabel('Complemento', { exact: true }).fill('Apto 10')
  await registration.getByRole('button', { name: 'Enviar para aprovação', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Pessoa Integração', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Aprovar cadastro' }).click()
  await expect(page.getByText('Ativado', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Registrar pagamento ou atraso', exact: true }).click()
  await page.getByLabel('Data do pagamento', { exact: true }).fill('31102026')
  await page.getByRole('form', { name: 'Registrar pagamento ou atraso' }).getByRole('button', { name: 'Registrar pagamento ou atraso' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Pagamento registrado' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pessoa Integração', exact: true })).toBeVisible()
  await expect(page.getByText('31/10/2026', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Registrar pagamento ou atraso', exact: true }).click()
  const monthlyForm = page.getByRole('form', { name: 'Registrar pagamento ou atraso' })
  await monthlyForm.getByLabel('Mensalidade atrasada', { exact: true }).check()
  await expect(monthlyForm.getByLabel('Data do pagamento')).toBeDisabled()
  await monthlyForm.getByRole('button', { name: 'Registrar pagamento ou atraso' }).click()
  await expect(page.locator('.detail-person__status').getByText('Mensalidade atrasada', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('.detail-person__status').getByText('Mensalidade atrasada', { exact: true })).toBeVisible()
  await expect(page.getByText('31/10/2026', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Desativar cadastro' }).click()
  await page.getByRole('dialog', { name: 'Desativar este cadastro?', exact: true }).getByRole('button', { name: 'Desativar cadastro', exact: true }).click()
  await expect(page.getByText('Desativado', { exact: true })).toBeVisible()
})
