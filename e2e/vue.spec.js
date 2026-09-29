import { test, expect } from '@playwright/test'

// See here how to get started:
// https://playwright.dev/docs/intro
test('visits the app root url', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Conjunto Residencial Butantã')
  await expect(page.getByRole('heading', { name: 'Novidades' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()

  await page.getByRole('button', { name: 'Aumentar tamanho do texto' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-font-size', 'large')

  const themeToggle = page.getByRole('button', { name: 'Ativar modo escuro' })
  await themeToggle.click()
  await expect(page.locator('.site-shell')).toHaveClass(/dark-theme/)
  await expect(page.getByRole('button', { name: 'Ativar modo claro' })).toBeVisible()
})
