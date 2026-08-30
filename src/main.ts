import './styles.css'
import { decimalError, exampleCsv, formatQuantity, importInventory, toCsv, type CountLine, variance } from './lib/reconcile'
import notebookHero from '../assets/src/notebook-hero.webp'

type Workspace = { raw: string; importHash: string; importedAt: string; lines: CountLine[] }
const app = document.querySelector<HTMLDivElement>('#app')!
let workspace: Workspace | null = null
let notice = ''
let importErrors: string[] = []
let demoMode = false
const reasons = ['Counted short', 'Counted over', 'Damaged or expired', 'Receiving error', 'Location correction', 'Other investigation']
const releases = {
  Windows: 'https://github.com/B-Divyesh/sf-stocktake-reconcile/releases/download/v0.1.7/Stocktake.Reconcile_0.1.7_x64_en-US.msi',
  macOS: 'https://github.com/B-Divyesh/sf-stocktake-reconcile/releases/download/v0.1.7/Stocktake.Reconcile_0.1.7_aarch64.dmg',
  Linux: 'https://github.com/B-Divyesh/sf-stocktake-reconcile/releases/download/v0.1.7/Stocktake.Reconcile_0.1.7_amd64.AppImage'
}
const esc = (value: string | number) => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!))

const download = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click(); URL.revokeObjectURL(url)
}
async function sha256(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}
function allCounted() { return workspace?.lines.filter(line => !line.counted || decimalError(line.counted, line.unitType, line.precision)) ?? [] }
function requiringReason() { return workspace?.lines.filter(line => { const diff = variance(line); return diff !== null && diff !== 0n && !line.reason }) ?? [] }
function canExport() { return !!workspace && !allCounted().length && !requiringReason().length }
function title(title: string) { document.title = title }

function shell(content: string, page: 'landing' | 'workspace') {
  app.innerHTML = `<header class="masthead"><a class="brand" href="/" data-route aria-label="Stocktake Reconcile home"><span aria-hidden="true">✎</span> Stocktake Reconcile</a><nav aria-label="Primary"><a href="/demo" data-route>Demo</a><a href="/workspace" data-route>Workspace</a><a href="/privacy/">Privacy</a></nav></header><main id="main" tabindex="-1">${content}</main><footer><span>Local-first stocktake records for shelf counts.</span><span><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a> · Built by Param Factory · v0.1.7</span></footer><p class="route-announcer sr-only" aria-live="polite"></p>`
  app.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); navigate(link.getAttribute('href') || '/')
  }))
  if (page === 'workspace') wireWorkspace()
  else wireLanding()
}

function renderLanding() {
  title('Stocktake Reconcile — export stock adjustments')
  const platform = /Win/.test(navigator.userAgent) ? 'Windows' : /Mac/.test(navigator.userAgent) ? 'macOS' : 'Linux'
  shell(`<section class="hero"><div class="hero-copy"><p class="eyebrow">Local stocktake tool</p><h1>Reconcile shelf counts with expected stock.</h1><p class="lede">For store teams who need explainable stock adjustments after a physical count.</p><div class="hero-actions"><a class="button primary" href="/demo" data-route>Try it with sample data</a><a class="button quiet" href="/workspace" data-route>Start a real count</a><a class="button quiet" href="${releases[platform]}" rel="noopener">Download for ${platform}</a></div><p class="micro">Sample opens a complete three-line count. It is separate from your real worksheet.</p><ul class="plain-facts"><li>Inventory data stays in this browser.</li><li>Counts use exact decimal values.</li></ul></div><figure class="hero-art"><img src="${notebookHero}" width="1024" height="683" fetchpriority="high" decoding="async" alt="Hand-inked stock notebook beside a brass scale, pencil, and parcel tags." /><figcaption>Original generated artwork for Stocktake Reconcile.</figcaption></figure></section><section class="three-notes" aria-label="How it works"><article><span>01</span><h2>Import expected stock</h2><p>Use a CSV with units and permitted decimal precision.</p></article><article><span>02</span><h2>Record physical counts</h2><p>Enter non-negative counts without hidden rounding.</p></article><article><span>03</span><h2>Export adjustment files</h2><p>Explain each variance before exporting a CSV or integrity-hashed report.</p></article></section><section class="privacy-note"><h2>What this does not do</h2><p>It does not sync inventory or change your stock system. You decide where exported files go.</p></section>`, 'landing')
}

function renderNotFound() {
  title('Page not found — Stocktake Reconcile')
  shell('<section class="workspace-intro"><p class="eyebrow">Page not found</p><h1>That page is not in this ledger.</h1><p class="lede">Use the home page to start a count or open the sample workspace.</p><a class="button primary" href="/" data-route>Go to home</a></section>', 'landing')
}

function demoBanner() {
  if (!demoMode) return ''
  return `<aside class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved.</strong><span><button class="text-button" id="reset-demo">Reset demo</button><button class="text-button" id="start-real">Start for real</button></span></aside>`
}

function renderWorkspace() {
  title(demoMode ? 'Demo — Stocktake Reconcile' : 'Count workspace — Stocktake Reconcile')
  if (!workspace) {
    shell(`${demoBanner()}<section class="workspace-intro"><p class="eyebrow">New stocktake</p><h1>Open a count ledger.</h1><p class="lede">Start with an expected-stock CSV. The original file is included in your final integrity-hashed report.</p><div class="import-panel"><label class="file-button" for="inventory-file">Choose expected-stock CSV<input id="inventory-file" type="file" accept=".csv,text/csv" /></label><button class="button quiet" id="load-example">Load a 3-line example</button></div><p class="micro">Required: <code>sku, name, expected, unit, unit_type, precision</code>. Unit types: integer, decimal, weight.</p>${importErrors.length ? `<div class="error-box" role="alert"><strong>Import needs attention</strong><ul>${importErrors.map(error => `<li>${esc(error)}</li>`).join('')}</ul></div>` : ''}</section>`, 'workspace')
    return
  }
  const total = workspace.lines.length
  const counted = workspace.lines.filter(line => line.counted && !decimalError(line.counted, line.unitType, line.precision)).length
  const variances = workspace.lines.filter(line => { const diff = variance(line); return diff !== null && diff !== 0n }).length
  const invalid = allCounted().length + requiringReason().length
  const rows = workspace.lines.map((line, index) => {
    const error = line.counted ? decimalError(line.counted, line.unitType, line.precision) : ''
    const diff = variance(line)
    const varianceLabel = diff === null ? '—' : `${diff > 0n ? '+' : ''}${formatQuantity(diff, line.precision)} ${line.unit}`
    const needsReason = diff !== null && diff !== 0n
    return `<tr class="${error ? 'has-error' : needsReason ? 'has-variance' : ''}"><td data-label="Item"><strong>${esc(line.sku)}</strong><span>${esc(line.name)}</span></td><td data-label="Expected" class="number">${esc(line.expected)} <small>${esc(line.unit)}</small></td><td data-label="Counted"><label class="sr-only" for="count-${index}">Counted quantity for ${esc(line.sku)}</label><input id="count-${index}" data-field="counted" data-index="${index}" inputmode="decimal" value="${esc(line.counted)}" aria-describedby="count-error-${index}" /><small id="count-error-${index}" class="field-error">${esc(error || '')}</small></td><td data-label="Variance" class="number ${diff !== null && diff !== 0n ? 'variance' : ''}">${varianceLabel}</td><td data-label="Reason"><label class="sr-only" for="reason-${index}">Reason for ${esc(line.sku)} variance</label>${needsReason ? `<select id="reason-${index}" data-field="reason" data-index="${index}" aria-required="true"><option value="">Select a reason</option>${reasons.map(reason => `<option ${line.reason === reason ? 'selected' : ''}>${reason}</option>`).join('')}</select>` : '<span class="muted">Not needed</span>'}</td><td data-label="Note"><label class="sr-only" for="note-${index}">Note for ${esc(line.sku)}</label><input id="note-${index}" data-field="note" data-index="${index}" value="${esc(line.note)}" placeholder="Optional note" /></td></tr>`
  }).join('')
  shell(`${demoBanner()}<section class="ledger-head"><div><p class="eyebrow">Count in progress · ${esc(new Date(workspace.importedAt).toLocaleDateString())}</p><h1>Inspection ledger</h1><p class="micro">Original import SHA-256: <code>${workspace.importHash}</code></p></div><div class="head-actions"><button class="button quiet" id="new-count">Start a new count</button><button class="button primary" id="export-adjustment" ${canExport() ? '' : 'disabled'}>Export adjustment CSV</button><button class="button quiet" id="export-report" ${canExport() ? '' : 'disabled'}>Export integrity report</button></div></section><section class="summary" aria-label="Count progress"><div><strong>${counted}/${total}</strong><span>valid counts</span></div><div><strong>${variances}</strong><span>variances</span></div><div><strong>${requiringReason().length}</strong><span>reasons missing</span></div><p aria-live="polite">${esc(notice || (invalid ? 'Finish all counts and explain every variance to export.' : 'Ready to export a complete adjustment journal.'))}</p></section><section class="table-wrap" aria-label="Stocktake lines"><table><caption class="sr-only">Stocktake reconciliation lines</caption><thead><tr><th scope="col">Item</th><th scope="col">Expected</th><th scope="col">Physical count</th><th scope="col">Variance</th><th scope="col">Reason for variance</th><th scope="col">Note</th></tr></thead><tbody>${rows}</tbody></table></section><aside class="integrity-note"><strong>About the integrity report</strong><p>Its SHA-256 hash covers the imported CSV, every count, unit, reason, and note. A changed report has a different hash; this is not a digital signature.</p></aside>`, 'workspace')
}

function wireLanding() { /* route links are wired by shell */ }

function wireWorkspace() {
  document.querySelector('#reset-demo')?.addEventListener('click', () => loadDemo())
  document.querySelector('#start-real')?.addEventListener('click', () => { demoMode = false; workspace = null; importErrors = []; notice = ''; navigate('/workspace') })
  const file = document.querySelector<HTMLInputElement>('#inventory-file')
  file?.addEventListener('change', async () => { const selected = file.files?.[0]; if (selected) await readImport(await selected.text()) })
  document.querySelector('#load-example')?.addEventListener('click', () => readImport(exampleCsv))
  document.querySelector('#new-count')?.addEventListener('click', () => { if (confirm('Start a new count? The current worksheet will be cleared.')) { workspace = null; notice = ''; renderWorkspace() } })
  document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-field]').forEach(input => {
    let tabTarget = ''
    input.addEventListener('keydown', event => {
      const keyEvent = event as KeyboardEvent
      if (keyEvent.key === 'Tab' && !keyEvent.shiftKey && input.dataset.field === 'counted') {
        const index = Number(input.dataset.index)
        tabTarget = `reason-${index}`
      }
    })
    input.addEventListener('change', () => {
      if (!workspace) return
      const index = Number(input.dataset.index); const field = input.dataset.field as 'counted' | 'reason' | 'note'
      workspace.lines[index][field] = input.value; notice = ''; renderWorkspace()
      const next = document.getElementById(tabTarget) || (tabTarget ? document.getElementById(`note-${index}`) : null)
      next?.focus()
    })
  })
  document.querySelector('#export-adjustment')?.addEventListener('click', () => { if (workspace && canExport()) { download('stocktake-adjustments.csv', toCsv(workspace.lines), 'text/csv;charset=utf-8'); notice = 'Adjustment journal exported locally.'; renderWorkspace() } })
  document.querySelector('#export-report')?.addEventListener('click', exportReport)
}

async function readImport(raw: string) {
  const imported = importInventory(raw); importErrors = imported.errors
  if (!importErrors.length) { workspace = { raw, importHash: await sha256(raw), importedAt: new Date().toISOString(), lines: imported.lines }; notice = 'Expected stock imported. Begin with the physical count.' }
  renderWorkspace()
}
async function exportReport() {
  if (!workspace || !canExport()) return
  const payload = { schema: 'stocktake-reconcile/v1', imported_at: workspace.importedAt, original_import_sha256: workspace.importHash, original_import_csv: workspace.raw, lines: workspace.lines, adjustment_csv: toCsv(workspace.lines) }
  const integrity_hash = await sha256(JSON.stringify(payload))
  download('stocktake-count-report.json', JSON.stringify({ ...payload, integrity_hash }, null, 2), 'application/json')
  notice = `Integrity report exported locally. Hash: ${integrity_hash.slice(0, 12)}…`; renderWorkspace()
}
function loadDemo() { demoMode = true; importErrors = []; workspace = null; notice = ''; history.replaceState({}, '', '/demo'); readImport(exampleCsv) }
function navigate(path: string) { history.pushState({}, '', path); renderRoute(true) }
function renderRoute(announce = false) {
  const path = location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/demo' || new URLSearchParams(location.search).get('demo') === '1') loadDemo()
  else { demoMode = false; if (path === '/workspace') renderWorkspace(); else if (path === '/') renderLanding(); else renderNotFound() }
  if (announce) { const heading = document.querySelector<HTMLElement>('h1'); heading?.setAttribute('tabindex', '-1'); heading?.focus(); const live = document.querySelector('.route-announcer'); if (live) live.textContent = heading?.textContent || '' }
}
window.addEventListener('popstate', () => renderRoute(true))
renderRoute()
