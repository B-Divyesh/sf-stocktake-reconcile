import './styles.css'
import { decimalError, exampleCsv, formatQuantity, importInventory, toCsv, type CountLine, variance } from './lib/reconcile'
import notebookHero from '../assets/src/notebook-hero.webp'

type Workspace = { raw: string; importHash: string; importedAt: string; lines: CountLine[] }
const app = document.querySelector<HTMLDivElement>('#app')!
let workspace: Workspace | null = null
let notice = ''
let importErrors: string[] = []
let proActive = false
const reasons = ['Counted short', 'Counted over', 'Damaged or expired', 'Receiving error', 'Location correction', 'Other investigation']

const escape = (value: string | number) => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!))
const download = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click(); URL.revokeObjectURL(url)
}
async function sha256(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('')
}
function allCounted() { return workspace?.lines.filter(l => !l.counted || decimalError(l.counted, l.unitType, l.precision)) ?? [] }
function requiringReason() { return workspace?.lines.filter(l => variance(l) !== null && variance(l) !== 0 && !l.reason) ?? [] }
function canExport() { return !!workspace && !allCounted().length && !requiringReason().length }
function reportLibrary(): Array<{ hash: string; date: string; lines: number }> { return JSON.parse(localStorage.getItem('stocktake-reconcile:report-library') || '[]') }

function renderShell(content: string, page = 'workspace') {
  app.innerHTML = `<header class="masthead"><a class="brand" href="./" aria-label="Stocktake Reconcile home"><span aria-hidden="true">✎</span> Stocktake Reconcile</a><nav aria-label="Primary"><a href="./">Download</a><a href="#workspace" data-open-workspace>Workspace</a><a href="./privacy/">Privacy</a></nav></header><main id="main" tabindex="-1">${content}</main><footer><span>Local files only. No telemetry.</span><span>Original generated artwork · <a href="./terms/">Terms</a></span></footer>`
  if (page === 'workspace') wireWorkspace()
  else wireLanding()
}

function renderLanding() {
  document.title = 'Stocktake Reconcile — count with a paper trail'
  const platform = /Win/.test(navigator.userAgent) ? 'Windows' : /Mac/.test(navigator.userAgent) ? 'macOS' : /Linux/.test(navigator.userAgent) ? 'Linux' : 'your computer'
  renderShell(`<section class="hero"><div class="hero-copy"><p class="eyebrow">A portable count ledger</p><h1>Physical count in. Explainable adjustments out.</h1><p class="lede">Import expected stock, enter what is on the shelf, then export a unit-safe adjustment journal and integrity-stamped count report. Nothing leaves this device.</p><div class="hero-actions"><a class="button primary" id="download-button" href="https://github.com/B-Divyesh/sf-stocktake-reconcile/releases/latest" rel="noopener">Download for ${escape(platform)}</a><button class="button quiet" data-open-workspace>Try the local workspace</button></div><p id="release-status" class="micro" aria-live="polite">Checking the latest signed release…</p></div><figure class="hero-art"><img src="${notebookHero}" width="1024" height="683" fetchpriority="high" decoding="async" alt="Hand-inked stock notebook beside a brass scale, pencil, and parcel tags." /><figcaption>Count carefully. Keep the trail.</figcaption></figure></section><section class="three-notes" aria-label="How it works"><article><span>01</span><h2>Bring your expected stock</h2><p>CSV headers make units and permitted decimal precision explicit.</p></article><article><span>02</span><h2>Count without rounding</h2><p>Integer, decimal, and weight quantities are checked exactly as typed.</p></article><article><span>03</span><h2>Explain every change</h2><p>Any variance needs a reason before the adjustment journal can leave.</p></article></section><section class="pro-note"><div><p class="eyebrow">One-time Pro Archive · $19</p><h2>Keep a local library of signed count reports.</h2><p>Core imports and exports are free forever. Pro adds a device-only library of report hashes, dates, and line totals. Sociobot/Dodo is merchant of record.</p></div><div class="license-actions"><a class="button primary" href="https://api.sociobot.in/api/v1/products/stocktake-reconcile/checkout">Buy Pro Archive — $19</a><details><summary>Have a license?</summary><label for="license-input">Paste your license token</label><div class="restore-row"><input id="license-input" autocomplete="off" /><button class="button quiet" id="restore-license">Restore</button></div><p id="license-status" class="micro" aria-live="polite"></p></details></div></section>`, 'landing')
  loadRelease(platform)
}

async function loadRelease(platform: string) {
  const button = document.querySelector<HTMLAnchorElement>('#download-button')
  const status = document.querySelector('#release-status')
  // Keep local/offline desktop launches quiet; they retain the stable releases-page fallback.
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    if (status) status.textContent = 'Release lookup is available on the published site.'
    return
  }
  try {
    // GitHub's release-download endpoint omits CORS headers. Its public API is CORS-enabled,
    // and exposes the same release assets (including latest.json) without a proxy or tracker.
    const res = await fetch('https://api.github.com/repos/B-Divyesh/sf-stocktake-reconcile/releases/latest', { cache: 'no-store' })
    if (!res.ok) throw new Error('No release manifest yet')
    const release = await res.json() as { tag_name: string; assets: Array<{ id: number; name: string; url: string; browser_download_url: string }> }
    const key = platform === 'Windows' ? 'windows' : platform === 'macOS' ? 'macos' : platform === 'Linux' ? 'linux' : ''
    const manifestAsset = release.assets.find(asset => asset.name === 'latest.json')
    const manifestResponse = manifestAsset && await fetch(manifestAsset.url, { headers: { Accept: 'application/octet-stream' } })
    const manifest = manifestResponse?.ok ? await manifestResponse.json() as { platforms?: Record<string, { url: string }> } : undefined
    const manifestUrl = key && manifest?.platforms?.[key]?.url
    const pattern = key === 'windows' ? /\.(msi|exe)$/i : key === 'macos' ? /\.dmg$/i : /\.(AppImage|deb)$/i
    const asset = release.assets.find(candidate => pattern.test(candidate.name))
    if (button && (manifestUrl || asset)) button.href = manifestUrl || asset!.browser_download_url
    if (status) status.textContent = `Version ${release.tag_name} · latest.json and checksums published with the release.`
  } catch { if (status) status.textContent = 'Latest release link is ready; the first tagged build will publish platform downloads.' }
}

async function verifyLicense(token: string) {
  const status = document.querySelector('#license-status')
  if (!token.trim()) return
  localStorage.setItem('sb_license:stocktake-reconcile', token.trim())
  const cached = JSON.parse(localStorage.getItem('sb_license_verdict:stocktake-reconcile') || 'null') as { valid: boolean; checked: number } | null
  if (cached && Date.now() - cached.checked < 86_400_000) { proActive = cached.valid; if (status) status.textContent = cached.valid ? 'Pro Archive is active on this device.' : 'This license is not active.'; return }
  if (status) status.textContent = 'Checking license…'
  try {
    const res = await fetch(`https://api.sociobot.in/api/v1/products/stocktake-reconcile/verify?license=${encodeURIComponent(token)}`)
    const verdict = await res.json() as { valid: boolean; reason: string }
    localStorage.setItem('sb_license_verdict:stocktake-reconcile', JSON.stringify({ valid: verdict.valid, checked: Date.now() }))
    proActive = verdict.valid
    if (status) status.textContent = verdict.valid ? 'Pro Archive is active on this device.' : `License not active (${verdict.reason}). You can purchase a new one-time license.`
  } catch { if (status) status.textContent = 'Offline: your local purchase status will be checked again when connected.' }
}

function wireLanding() {
  document.querySelectorAll<HTMLElement>('[data-open-workspace]').forEach(el => el.addEventListener('click', event => { event.preventDefault(); renderWorkspace() }))
  document.querySelector('#restore-license')?.addEventListener('click', () => verifyLicense((document.querySelector<HTMLInputElement>('#license-input')?.value || '')))
  const params = new URLSearchParams(location.search); const incoming = params.get('license')
  if (incoming) { history.replaceState({}, '', location.pathname); verifyLicense(incoming) }
  const token = localStorage.getItem('sb_license:stocktake-reconcile'); if (token) verifyLicense(token)
}

function renderWorkspace() {
  document.title = 'Count workspace — Stocktake Reconcile'
  if (!workspace) {
    renderShell(`<section class="workspace-intro"><p class="eyebrow">New stocktake</p><h1>Open a count ledger.</h1><p class="lede">Start with an expected-stock CSV. The original file is fingerprinted and included unchanged in your final report.</p><div class="import-panel"><label class="file-button" for="inventory-file">Choose expected-stock CSV<input id="inventory-file" type="file" accept=".csv,text/csv" /></label><button class="button quiet" id="load-example">Load a 3-line example</button></div><p class="micro">Required: <code>sku, name, expected, unit, unit_type, precision</code>. Unit types: integer, decimal, weight. We never round an entered count.</p>${importErrors.length ? `<div class="error-box" role="alert"><strong>Import needs attention</strong><ul>${importErrors.map(e => `<li>${escape(e)}</li>`).join('')}</ul></div>` : ''}</section>`) 
    return
  }
  const total = workspace.lines.length
  const counted = workspace.lines.filter(l => l.counted && !decimalError(l.counted, l.unitType, l.precision)).length
  const variances = workspace.lines.filter(l => variance(l) !== null && variance(l) !== 0).length
  const invalid = allCounted().length + requiringReason().length
  const rows = workspace.lines.map((line, index) => {
    const error = line.counted ? decimalError(line.counted, line.unitType, line.precision) : ''
    const diff = variance(line)
    const varianceLabel = diff === null ? '—' : `${diff > 0 ? '+' : ''}${formatQuantity(diff, line.precision)} ${line.unit}`
    const needsReason = diff !== null && diff !== 0
    return `<tr class="${error ? 'has-error' : needsReason ? 'has-variance' : ''}"><td data-label="Item"><strong>${escape(line.sku)}</strong><span>${escape(line.name)}</span></td><td data-label="Expected" class="number">${escape(line.expected)} <small>${escape(line.unit)}</small></td><td data-label="Counted"><label class="sr-only" for="count-${index}">Counted quantity for ${escape(line.sku)}</label><input id="count-${index}" data-field="counted" data-index="${index}" inputmode="decimal" value="${escape(line.counted)}" aria-describedby="count-error-${index}" /><small id="count-error-${index}" class="field-error">${escape(error || '')}</small></td><td data-label="Variance" class="number ${diff && diff !== 0 ? 'variance' : ''}">${varianceLabel}</td><td data-label="Reason"><label class="sr-only" for="reason-${index}">Reason for ${escape(line.sku)} variance</label>${needsReason ? `<select id="reason-${index}" data-field="reason" data-index="${index}" aria-required="true"><option value="">Select a reason</option>${reasons.map(r => `<option ${line.reason === r ? 'selected' : ''}>${r}</option>`).join('')}</select>` : '<span class="muted">Not needed</span>'}</td><td data-label="Note"><label class="sr-only" for="note-${index}">Note for ${escape(line.sku)}</label><input id="note-${index}" data-field="note" data-index="${index}" value="${escape(line.note)}" placeholder="Optional note" /></td></tr>`
  }).join('')
  renderShell(`<section class="ledger-head"><div><p class="eyebrow">Count in progress · ${escape(new Date(workspace.importedAt).toLocaleDateString())}</p><h1>Inspection ledger</h1><p class="micro">Original import SHA-256: <code>${workspace.importHash}</code></p></div><div class="head-actions"><button class="button quiet" id="new-count">Start a new count</button><button class="button primary" id="export-adjustment" ${canExport() ? '' : 'disabled'}>Export adjustment CSV</button><button class="button quiet" id="export-report" ${canExport() ? '' : 'disabled'}>Export signed count report</button></div></section><section class="summary" aria-label="Count progress"><div><strong>${counted}/${total}</strong><span>valid counts</span></div><div><strong>${variances}</strong><span>variances</span></div><div><strong>${requiringReason().length}</strong><span>reasons missing</span></div><p aria-live="polite">${escape(notice || (invalid ? 'Finish all counts and explain every variance to export.' : 'Ready to export a complete adjustment journal.'))}</p></section><section class="table-wrap" aria-label="Stocktake lines"><table><caption class="sr-only">Stocktake reconciliation lines</caption><thead><tr><th scope="col">Item</th><th scope="col">Expected</th><th scope="col">Physical count</th><th scope="col">Variance</th><th scope="col">Reason for variance</th><th scope="col">Note</th></tr></thead><tbody>${rows}</tbody></table></section><aside class="integrity-note"><strong>About the signed report</strong><p>Its SHA-256 integrity hash covers the immutable imported CSV, every count, unit, reason, and note. Re-exporting the same completed count produces the same report payload and adjustment CSV.</p>${proActive ? `<p><strong>Pro Archive:</strong> ${reportLibrary().length} report ${reportLibrary().length === 1 ? 'entry' : 'entries'} stored locally on this device.</p>` : ''}</aside>`) 
}

function wireWorkspace() {
  document.querySelectorAll<HTMLElement>('[data-open-workspace]').forEach(el => el.addEventListener('click', event => { event.preventDefault(); renderWorkspace() }))
  const file = document.querySelector<HTMLInputElement>('#inventory-file')
  file?.addEventListener('change', async () => { const selected = file.files?.[0]; if (selected) await readImport(await selected.text()) })
  document.querySelector('#load-example')?.addEventListener('click', () => readImport(exampleCsv))
  document.querySelector('#new-count')?.addEventListener('click', () => { if (confirm('Start a new count? The current local worksheet will be cleared.')) { workspace = null; notice = ''; renderWorkspace() } })
  document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-field]').forEach(input => input.addEventListener('change', () => {
    if (!workspace) return
    const index = Number(input.dataset.index); const field = input.dataset.field as 'counted' | 'reason' | 'note'
    workspace.lines[index][field] = input.value
    notice = ''; renderWorkspace()
  }))
  document.querySelector('#export-adjustment')?.addEventListener('click', () => { if (workspace && canExport()) { download('stocktake-adjustments.csv', toCsv(workspace.lines), 'text/csv;charset=utf-8'); notice = 'Adjustment journal exported locally.'; renderWorkspace() } })
  document.querySelector('#export-report')?.addEventListener('click', exportReport)
}

async function readImport(raw: string) {
  const imported = importInventory(raw)
  importErrors = imported.errors
  if (!importErrors.length) { workspace = { raw, importHash: await sha256(raw), importedAt: new Date().toISOString(), lines: imported.lines }; notice = 'Expected stock imported. Begin with the physical count.' }
  renderWorkspace()
}

async function exportReport() {
  if (!workspace || !canExport()) return
  const payload = { schema: 'stocktake-reconcile/v1', imported_at: workspace.importedAt, original_import_sha256: workspace.importHash, original_import_csv: workspace.raw, lines: workspace.lines, adjustment_csv: toCsv(workspace.lines) }
  const integrity_hash = await sha256(JSON.stringify(payload))
  download('stocktake-count-report.json', JSON.stringify({ ...payload, integrity_hash }, null, 2), 'application/json')
  if (proActive) localStorage.setItem('stocktake-reconcile:report-library', JSON.stringify([{ hash: integrity_hash, date: new Date().toISOString(), lines: workspace.lines.length }, ...reportLibrary()].slice(0, 100)))
  notice = `Signed count report exported locally. Integrity hash: ${integrity_hash.slice(0, 12)}…`
  renderWorkspace()
}

renderLanding()
