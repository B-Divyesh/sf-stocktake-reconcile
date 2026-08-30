import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function completeDemo(page: import('@playwright/test').Page) {
  await page.goto('/demo')
  await expect(page.getByRole('heading', { name: 'Inspection ledger' })).toBeVisible()
  const counts = page.locator('input[data-field="counted"]')
  await counts.nth(0).fill('47'); await counts.nth(0).press('Tab')
  await counts.nth(1).fill('2.850'); await counts.nth(1).press('Tab')
  await counts.nth(2).fill('17.50'); await counts.nth(2).press('Tab')
  await page.locator('select[data-field="reason"]').first().selectOption({ label: 'Counted short' })
}

test('@claim:demo loads a separate sample ledger in one click', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /try it with sample data/i }).click()
  await expect(page).toHaveURL(/\/demo$/)
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Inspection ledger' })).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(3)
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.locator('input[data-field="counted"]').first()).toHaveValue('')
})

test('@claim:csv-export exports only explained adjustments', async ({ page }) => {
  await completeDemo(page)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /export adjustment csv/i }).click()
  const csv = await (await download).createReadStream()
  let content = ''
  for await (const chunk of csv!) content += chunk.toString()
  expect(content).toContain('"BK-001"')
  expect(content).toContain('"-1"')
  expect(content).not.toContain('COF-250')
})

test('@claim:inventory-local keeps inventory values off the network in the demo flow', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await completeDemo(page)
  expect(requests.every(url => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true)
})

test('@claim:desktop-download exposes the detected platform package without a fetch', async ({ page }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: 'Download for Linux' })
  await expect(link).toHaveAttribute('href', /releases\/download\/v0\.1\.7\/.*AppImage$/)
})

test('preserves keyboard focus when a count changes', async ({ page }) => {
  await page.goto('/demo')
  const count = page.locator('#count-0')
  await count.fill('47')
  await count.press('Tab')
  await expect(page.locator(':focus')).not.toHaveCount(0)
  await expect(page.locator('#reason-0')).toBeFocused()
})

test('uses real workspace routes and compact touch targets', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Workspace', exact: true }).click()
  await expect(page).toHaveURL(/\/workspace$/)
  await expect(page).toHaveTitle('Count workspace — Stocktake Reconcile')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/demo')
  for (const selector of ['#count-0', '#note-0', 'header a[href="/privacy/"]', 'footer a[href="/privacy/"]']) {
    const box = await page.locator(selector).boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  }
})

test('landing and populated workspace have no serious accessibility violations or console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  expect((await new AxeBuilder({ page }).analyze()).violations.filter(v => ['critical', 'serious'].includes(v.impact || '')).map(v => v.id)).toEqual([])
  await completeDemo(page)
  expect((await new AxeBuilder({ page }).analyze()).violations.filter(v => ['critical', 'serious'].includes(v.impact || '')).map(v => v.id)).toEqual([])
  expect(errors).toEqual([])
})
