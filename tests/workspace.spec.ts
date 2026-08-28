import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('a count becomes an auditable, export-ready ledger', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /physical count in/i })).toBeVisible()
  await expect(page.locator('.hero-art img')).toBeVisible()
  await expect(page.locator('.hero-art img')).toHaveJSProperty('naturalWidth', 1024)
  await page.getByRole('button', { name: /try the local workspace/i }).click()
  await page.getByRole('button', { name: /load a 3-line example/i }).click()
  await expect(page.getByRole('heading', { name: 'Inspection ledger' })).toBeVisible()
  const counts = page.locator('input[data-field="counted"]')
  await counts.nth(0).fill('47'); await counts.nth(0).press('Tab')
  await counts.nth(1).fill('2.850'); await counts.nth(1).press('Tab')
  await counts.nth(2).fill('17.50'); await counts.nth(2).press('Tab')
  const reasons = page.locator('select[data-field="reason"]')
  await reasons.nth(0).selectOption({ label: 'Counted short' })
  await expect(page.getByRole('button', { name: /export adjustment csv/i })).toBeEnabled()
  expect(errors).toEqual([])
})

test('landing page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter(v => ['critical', 'serious'].includes(v.impact || '')).map(v => v.id)).toEqual([])
})
