import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
})

test('enters the prototype and reviews a pending resident', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Boas-vindas' })).toBeVisible()
  await page.getByRole('button', { name: 'Entrar no painel' }).click()
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
  await expect(page.getByText('Aguardando aprovação').first()).toBeVisible()
  await page.getByRole('link', { name: 'Revisar comprovantes' }).click()
  await expect(page.getByRole('heading', { name: 'Moradores' })).toBeVisible()
  await page.getByText('Bia Oliveira').click()
  await expect(page.getByText('Comprovante aguardando análise')).toBeVisible()
  await page.getByRole('button', { name: 'Aprovar cadastro' }).click()
  await expect(page.getByText('Cadastro e comprovante aprovados. Morador ativado.')).toBeVisible()
})

test('propagates a payment to residents in the same unit', async ({ page }) => {
  await page.getByRole('button', { name: 'Entrar no painel' }).click()
  await page.getByText('Ana Paula Ribeiro').click()
  await page.getByRole('button', { name: 'Registrar pagamento' }).click()
  await expect(page.getByText('Pagamento registrado para toda a unidade.')).toBeVisible()
  await expect(page.getByText('Pagamento em dia')).toBeVisible()
  await expect(page.getByRole('link', { name: /Marcos Vinícius Ribeiro/ }).getByText('Ativado')).toBeVisible()
})
