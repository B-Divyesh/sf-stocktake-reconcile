# Independent verification 2 — FAIL

Verified on 2026-09-02 UTC.

- Candidate: `ed23f535d8024fc0687eb79d5e5fea13e2ccedeb`
- Live URL: `https://stocktake-reconcile.sociobot.in`
- Candidate tag: `v0.1.7`
- Environment: Node `22.23.2`, npm `10.9.8`, Rust/Cargo `1.98.0`, Chromium `145.0.7632.6`, Playwright `1.58.2`
- Result: **FAIL — do not release this candidate**

The live static files are byte-for-byte identical to the candidate build. This is not a stale-deployment result. No prohibited service, database, key vault, application setting, storage account, or unrelated product resource was read or changed. Verification used only the clean checkout, the public product URL, and the product's public GitHub repository/API.

## Release-blocking findings

### Critical

1. **The v0.1.7 desktop release does not exist, and every live download button is broken.** The public GitHub API returns HTTP `404` for `/releases/tags/v0.1.7`; direct requests for the live Linux AppImage, Windows MSI, and macOS DMG links each return `404`. The latest published release remains `v0.1.6`. GitHub Actions run `33298617992` for candidate SHA `ed23f535…` completed with `failure`: Linux and both macOS jobs passed, the Windows `Build Tauri bundles` step failed, and the dependent release job was skipped. The workflow uses POSIX environment-assignment syntax in the cross-platform build command at `.github/workflows/release.yml:52`, including on the default Windows PowerShell shell. A desktop product without a downloadable candidate fails the installer contract and its main first-screen action.

2. **Opening Demo destroys an in-progress real worksheet without confirmation.** Live reproduction: open `/workspace`, import a one-line real CSV containing SKU `REAL-ONLY`, click the header's **Demo** link, then use browser Back. `/workspace` now contains the three demo SKUs such as `BK-001`; `REAL-ONLY` is gone. `loadDemo()` clears and replaces the single global `workspace` object. The loss is not recoverable because workspaces are otherwise memory-only. This contradicts “It is separate from your real worksheet,” `.factory/demo.md`, and the required demo sandbox boundary.

3. **The mandatory claims contract is not satisfied even though all five listed commands exit successfully.** The `desktop-download` test only checks that an `href` looks like a v0.1.7 AppImage URL; it never checks that a package exists, and the observed URL returns `404`. The public claim that demo data “is separate from your real worksheet” is absent from `.factory/claims.json` and is false in the live flow. Integrity-report hash/coverage claims in the UI and README are also absent from the manifest. In addition, `@claim:exact-quantities` is attached to two tests rather than exactly one as required by the claims contract.

### High

4. **Intel macOS visitors are directed to an incompatible arm64 package.** A fresh browser with `Macintosh; Intel Mac OS X` receives a **Download for macOS** link ending in `_aarch64.dmg`. The release workflow builds x86_64 and arm64 DMGs, but the page offers only arm64. `scripts/release-manifest.mjs` also collapses both builds into one `platforms.macos` URL and deterministically selects the first DMG, which is arm64 in the current `latest.json`.

### Medium

5. **The required signed count report is not delivered.** The researched brief names a signed count report in the smallest useful product. The app emits a self-hashed JSON report and explicitly says it is not a digital signature. The hash behavior is honest and works, but this remains an unexplained scope deviation from the acceptance contract.

6. **Unknown routes return HTTP 200.** `/definitely-missing-qa` renders the designed client-side not-found view but returns `200 text/html`, not a real 404 response. `404.html` exists, yet the navigation fallback captures arbitrary paths before the response override can produce a 404.

7. **The desktop demo lacks the required captioned 3–5 frame walkthrough.** The landing page has one generated ledger illustration and the live web demo, but no desktop-app screenshot walkthrough.

### Low

8. At 390 px, the header **Demo** link measures `42.03125 × 44` CSS px, below the required 44 × 44 target. All other visible demo controls tested at that width met the target.

9. The first screen has two plain facts, not the required three. `.factory/copy-audit.md` lists “Desktop downloads are free” as a landing fact, but that sentence is not rendered.

10. The Open Graph image is `1024 × 683`, not the required `1200 × 630`, and the Apple touch icon is `128 × 128`, not 180 px.

## Mandatory first-read test

Cold desktop and 390 px views both pass the explicit first-read gate:

- What it does: “Reconcile shelf counts with expected stock.”
- Who it is for: store teams making explainable adjustments after a physical count.
- What to click first: **Try it with sample data**, with adjacent text saying it opens a complete three-line count.
- One-click demo: pass; it opens `/demo` with three realistic lines and a persistent demo banner.

The later demo-isolation failure above still makes the sandbox unacceptable.

## Claims gate

The manifest was read before any other repository work. Every listed command was then run independently from the clean checkout:

| Claim | Command | Command result | Independent outcome |
| --- | --- | --- | --- |
| `demo` | `npm run test:ui -- --grep @claim:demo` | PASS, 1 test | One-click fresh demo passes; isolation from an existing real count fails |
| `exact-quantities` | `npm test -- -t @claim:exact-quantities` | PASS, 2 tests | Live `0.30 → 0.20` exports `-0.1`; >MAX_SAFE_INTEGER exports `-1` |
| `csv-export` | `npm run test:ui -- --grep @claim:csv-export` | PASS, 1 test | Live explained adjustment CSV passes |
| `inventory-local` | `npm run test:ui -- --grep @claim:inventory-local` | PASS, 1 test | Live completed flow stays same-origin |
| `desktop-download` | `npm run test:ui -- --grep @claim:desktop-download` | PASS, 1 test | **FAIL live: target package is HTTP 404** |

Overall claims result: **FAIL** because a passing test does not prove the claimed package outcome and public claims are unlisted/false.

## End-to-end functional evidence

Passing behavior:

- The one-click demo loads three lines with integer, decimal, and weight units.
- A negative count is rejected with a non-negative-number message, excess precision is rejected without rounding, and exports remain disabled until all counts are valid and every non-zero variance has a reason.
- `0.30 kg → 0.20 kg` exports exactly `-0.1`; `9007199254740993 → 9007199254740992` exports exactly `-1`.
- An unclosed quoted field produces an announced import error; **Load a 3-line example** recovers successfully.
- The adjustment CSV includes only changed lines and preserves unit and reason.
- The JSON report's `original_import_sha256` matched the embedded original CSV. Recomputing SHA-256 over the payload matched `integrity_hash`, and the report's embedded `adjustment_csv` exactly matched the separately downloaded CSV.
- A 200-line CSV imported, reached `200/200`, enabled export, and produced a report with 200 lines. Dispatching the 200 browser change events took 2,252 ms; this is automation evidence, not a claim about human completion time.
- Keyboard focus advances from a changed count to its reason field. The skip link is the first tab stop and moves focus to `<main>`.
- History navigation and route titles work for `/demo` and `/workspace`.

Failing behavior:

- Entering demo replaces an existing real worksheet, as detailed above.
- All candidate download links are dead, and Intel macOS selection is wrong.

## Accessibility and responsive evidence

- Playwright axe found zero serious/critical findings on the light landing page, light and dark demo workspaces, Privacy, and Terms.
- `<html lang="en">`, descriptive route titles, one `<h1>`, `<main>`, image alt text, form labels, an operable skip link, and visible focus are present.
- Reduced-motion mode computed a `0s` button transition.
- The 390 px pages have no horizontal overflow. A 200% root text-size check remained usable without horizontal overflow; demo controls remained visible.
- The only measured target failure was the 42.03 px-wide mobile Demo link.
- `/opt/fleet/lib/verify-url.sh https://stocktake-reconcile.sociobot.in …` passed: load `765 ms`, zero console errors, one h1, title/lang/main/alt checks all pass.

## Privacy, network, and response headers

A fresh live context recorded the entire normal count, validation, adjustment download, report download, boundary import, and error-recovery flow. The unique outgoing URLs were:

```text
https://stocktake-reconcile.sociobot.in/demo
https://stocktake-reconcile.sociobot.in/assets/index-BBMi2mP4.js
https://stocktake-reconcile.sociobot.in/assets/index-BMRneMIT.css
https://stocktake-reconcile.sociobot.in/workspace
```

There were no analytics, telemetry, remote fonts/scripts, third-party runtime requests, failed requests, console errors, or page errors. Demo mode created no localStorage keys. Browser-observed root headers include:

- `Content-Security-Policy: default-src 'self'; … connect-src 'self'; … frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- HSTS with `includeSubDomains; preload`
- HTML cache: `public, must-revalidate, max-age=30`
- Hashed JS/CSS and the hero image: `public, max-age=31536000, immutable`

There is no product backend, product-unlock call, sign-in, or service worker. API rate limiting, Entra authority, backend concurrency/persistence, and PWA offline/update checks are therefore not applicable.

## Deployment and release identity

Every public file produced by `npm run build` matched the live response byte-for-byte: index, hashed JS/CSS/hero, Privacy, Terms, 404, installers, icons, OG image, robots, and sitemap.

| Core file | SHA-256 |
| --- | --- |
| `index.html` | `7da0f4f778f52a49068bbf86d8a9a150b22f891e60cca67f8f474a317f88dffd` |
| `index-BBMi2mP4.js` | `e23e6f2730d5b67223ce15207ba52bbcc14be65b0d260410df4cb5d9fa6a8364` |
| `index-BMRneMIT.css` | `e7faf0487c9af7b835d938a3f18f17172d7b58203d156fb033dce6ff3b343c54` |
| `notebook-hero-tA1-myLh.webp` | `852b01e25519cc8839238e9a1f4c035efa713d37144fab094616c9f8835ce481` |

The candidate's v0.1.7 release is absent. For comparison only, the published v0.1.6 `latest.json` is valid and a fresh download of its Linux DEB matched `SHA256SUMS` (`e972f363ab12df8fc8a2da25de7d4183aad15c98c7c7d2892f334b2763c28522`). This does not make v0.1.7 releasable.

## Performance and budgets

Live mobile Lighthouse:

- Performance: `98`
- Accessibility: `100`
- Best practices: `100`
- SEO: `100`
- FCP: `972 ms`
- LCP: `1,610 ms`
- Total blocking time: `168 ms`
- CLS: `0`

Production build sizes are within budget: initial JS `14.95 KB` raw / `6.03 KB` gzip, CSS `8.84 KB` raw / `2.73 KB` gzip, hero WebP `146.90 KB`, and no web fonts.

## Local gate results

| Command/check | Result |
| --- | --- |
| `npm ci` | PASS, 0 vulnerabilities |
| every command in `.factory/claims.json` | Commands PASS; claims outcome FAIL as above |
| `npm test` | PASS, 8/8 |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS, `dist/site` |
| `npm run build:app` | PASS, `dist/app` |
| `npm run test:ui` | PASS, 7/7 |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | PASS |
| `cargo check --locked --manifest-path src-tauri/Cargo.toml` | PASS after installing the README/workflow-declared GTK/WebKit packages |
| `CI=true npm run tauri build -- --target x86_64-unknown-linux-gnu --bundles appimage,deb` | PASS |
| local AppImage smoke under Xvfb for 12 seconds | PASS; stayed running, only headless EGL/DRI warnings |
| `/opt/fleet/lib/verify-url.sh` | PASS |
| expanded live Playwright QA | Functional/a11y/privacy passes plus the defects above |
| Lighthouse mobile | 98/100/100/100 |

No lint script exists. The exact local desktop build produced:

- AppImage: 78,117,368 bytes, SHA-256 `c5dd6a236ac3fa29c4eb60c6f0e91f058a1c0981083147d8bd456aed36e00360`
- DEB: 3,090,890 bytes, SHA-256 `0fb6eac5bed31a0d1eb761b9df0effec8dcf58b5ccda0d2a29df0247e8092354`

## Required next steps

1. Repair the Windows release command, publish a new candidate release with all platform assets, `SHA256SUMS`, and `latest.json`, and make every detected-platform link resolve before verification.
2. Keep demo and real worksheets in distinct storage/state namespaces. Entering or resetting demo must never replace real work.
3. Make claim tests prove observable outcomes: check that download assets exist, add the demo-isolation claim/test, and list/test the report-integrity claims.
4. Offer distinct Intel and Apple-silicon macOS choices or reliably select the architecture; include both in release metadata.
5. Either implement the brief's signed report or explicitly document and approve the hash-only scope deviation.
6. Return a real 404 status, complete the desktop walkthrough, and resolve the smaller touch-target/metadata/copy-audit issues.
