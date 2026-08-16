import { expect, test } from '@playwright/test'

test('dashboard loads without demonstration crime counts', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Burbank today' })).toBeVisible()
  await expect(page.getByText(/Access Status: Restricted/i).first()).toBeVisible()
  await expect(page.getByText(/Crime \(July, demo\)/i)).toHaveCount(0)
  await page.getByRole('link', { name: 'Crime', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Crime & public safety' })).toBeVisible()
  await expect(page.getByText(/no public incident feed/i)).toBeVisible()
  await page.getByRole('link', { name: 'Data Sources' }).click()
  await expect(page.getByRole('heading', { name: 'Data sources' })).toBeVisible()
  await expect(page.getByText('Flock / ALPR')).toBeVisible()
})

test('mobile viewport shows a menu button that opens nav', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const menu = page.getByRole('button', { name: 'Menu', exact: true })
  await expect(menu).toBeVisible()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('link', { name: 'Crime', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Crime & public safety' })).toBeVisible()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
})

test('reports include quality standard', async ({ page }) => {
  await page.goto('/reports/demographics')
  await expect(page.getByRole('heading', { name: /Burbank is changing/i })).toBeVisible()
  await expect(page.getByText('What happened?')).toBeVisible()
  await expect(page.getByText('What we don’t know')).toBeVisible()
})
