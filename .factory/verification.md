# Independent verification — FAIL

Verified on 2026-08-30 UTC.

- Candidate: `c459a3be94be3ecec28f6dcdcdca2d6d70382ce1`
- Live URL: `https://stocktake-reconcile.sociobot.in`
- Release checked: `v0.1.6`
- Environment: Node `22.23.2`, npm `10.9.8`, Rust/Cargo `1.98.0`, Chromium via Playwright `1.58.2`
- Result: **FAIL — do not release this candidate**

The live static files are byte-for-byte identical to the candidate build. This is not a stale-deployment result. No prohibited service, database, key vault, application setting, or unrelated resource was accessed.

## Release-blocking findings

### Critical

1. **The mandatory claims gate does not exist.** `.factory/claims.json` is absent in the clean clone, so there were no claim commands to run. This is an automatic release failure under the claims acceptance contract. The product and README nevertheless make unlisted claims including “Nothing leaves this device,” exact unit/precision handling, local-only storage, no telemetry, CSV export, and report hashing.

2. **The mandatory demo and first-read contract fail.** The cold first screen says what the product does, but not who it is for. There is no “Try it with sample data” action. “Try the local workspace” opens an empty importer; a second click on “Load a 3-line example” is required. `/demo` and `/?demo=1` both show the ordinary landing page with no sample loaded, no isolated storage namespace, no “Demo — sample data, nothing is saved” banner, no reset, and no “Start for real.” `.factory/demo.md` is absent.

3. **Valid quantities can produce incorrect adjustments.** The implementation converts quantity strings to binary JavaScript `Number` values (`src/lib/reconcile.ts:53-55`) and writes the raw subtraction to CSV (`src/lib/reconcile.ts:89-92`). Live evidence:

   - Expected `0.30 kg`, counted `0.20 kg`, precision `2`: the UI displays `-0.1 kg`, but the exported CSV contains `-0.09999999999999998`.
   - Expected integer `9007199254740993`, counted `9007199254740992`: the UI displays `0 each`, asks for no reason, enables export, and emits a header-only adjustment CSV. A real one-unit shortage is silently lost.

   This violates the brief’s unit-correctness and no-silent-rounding constraints.

### High

4. **Negative physical stock is accepted and exportable.** A valid integer row with expected `5` accepted counted `-1`, showed variance `-6 each`, required only a reason, and enabled export. The numeric regex explicitly permits a leading minus (`src/lib/reconcile.ts:46`). A physical count needs a non-negative validation rule unless negative on-hand stock is explicitly supported and explained.

5. **Keyboard entry loses focus after every edit.** Changing the first count and pressing Tab leaves `document.activeElement` as `<body>`, not the next field. Every field change replaces the complete shell (`src/main.ts:117-122`). This prevents efficient keyboard-only stocktaking and makes the 200-line target impractical. A 200-line automated public-UI run did complete and export 200 report lines, but entry took 82.5 seconds and required locating each field afresh.

6. **The live download lookup always logs console errors and falls back.** The page fetches GitHub’s asset API, which redirects to `release-assets.githubusercontent.com` without a usable CORS response (`src/main.ts:52-64`). Fresh desktop and mobile contexts logged a CORS error plus `net::ERR_FAILED`. The status incorrectly says the first tagged build will publish downloads even though `v0.1.6` exists, and the OS button stays on the generic Releases page instead of the actual platform asset. `/opt/fleet/lib/verify-url.sh` exits `1` for these console errors. Lighthouse also flags `errors-in-console`.

7. **The advertised $19 purchase is unavailable.** A fresh GET to `https://api.sociobot.in/api/v1/products/stocktake-reconcile/checkout` returned HTTP `404` with `{"error":"enabled factory product","status":404}`. The live “Buy Pro Archive — $19” action therefore cannot start checkout.

8. **The committed Rust lockfile is not reproducible.** `src-tauri/Cargo.toml` is version `0.1.6`, while its package entry in `Cargo.lock` is `0.1.0`. From the clean candidate, `cargo check --locked --manifest-path src-tauri/Cargo.toml` exits `101`: “cannot update the lock file … because --locked was passed.” An unlocked check silently rewrites the tracked lockfile.

### Medium

9. **License verdict caching is not tied to the token.** After token A received `invalid`, entering token B changed `sb_license:stocktake-reconcile` to B but sent no verification request and reused A’s cached verdict for 24 hours (`src/main.ts:70-77`). The reverse path can also optimistically preserve a prior valid verdict for a replacement token.

10. **“Signed count report” overstates the evidence.** The report has a self-computed SHA-256 hash, not a digital signature or trusted signer. Anyone can modify the payload and recompute the hash. “Integrity-hashed report” is accurate; “signed” and “immutable” are not.

11. **Mobile touch targets and legal navigation are incomplete.** At 390 px the layout has no horizontal overflow, but count/note fields are 33 px high, the license field is 31 px, and visible navigation/footer links are about 14–15 px high instead of 44 px. CSS hides Privacy and Workspace navigation at this width; there is no Privacy link in the footer, so Privacy is not reachable through the 390 px UI.

12. **Routing and required site files are incomplete.** Clicking Workspace does not change the URL, so back/forward and deep-link state do not work. Unknown routes return the landing page with HTTP `200`. `robots.txt`, `sitemap.xml`, a real `404.html`, favicon, Apple touch icon, canonical metadata, Open Graph/Twitter metadata, and `staticwebapp.config.json` are absent. Privacy and Terms do not use the shared header/footer skeleton. `.factory/copy-audit.md` is absent.

13. **Security/caching headers miss the contract.** The live page has HSTS, `Referrer-Policy`, and `X-Content-Type-Options`, but no Content-Security-Policy or frame protection. Hashed JS, CSS, and image assets are served with `cache-control: public, must-revalidate, max-age=30` rather than long-lived immutable caching. The Tauri CSP permits `github.com`, but not the `api.github.com` and redirected release-asset origins used by the release lookup.

14. **The local AppImage packaging gate is not green.** With the same Linux native packages as the workflow, the optimized application compiles and `.deb` packaging succeeds. `CI=true npm run tauri build -- --target x86_64-unknown-linux-gnu --bundles appimage,deb` reaches bundling and then exits `1` with `failed to run linuxdeploy`; AppImage-only packaging fails the same way. The already-published AppImage demonstrates that GitHub Actions previously packaged it, so this may be container-specific, but the exact clean local production command did not pass.

### Low

15. **Rust formatting check fails.** `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` reports diffs in `build.rs`, `src/lib.rs`, and `src/main.rs`.

## First-read test

Cold desktop view:

- What it does: clear — imports expected stock, records shelf counts, and exports adjustment/report files.
- Who it is for: missing from the first screen.
- What to click first: ambiguous — “Download for Linux” is primary and “Try the local workspace” is secondary; neither starts sample data.
- One-click sample: absent; two clicks are required.
- Verdict: **FAIL**.

The 390 px landing page is legible and does not overflow, but it has the same first-read/demo failure.

## Claims gate

`.factory/claims.json` was checked before installation or other repository work and was missing. Therefore:

- Claim tests discovered: `0`
- Claim tests run: `0`
- Gate result: **FAIL (release-blocking)**

The existing tests have no `@claim:<id>` tags. The static claims above must either be entered in the manifest with observable demo tests or removed/narrowed.

## Functional evidence

### Passing behavior

- The normal 3-line sample imports successfully.
- Integer, decimal, and weight entries are presented with their units.
- `3.0` for an integer gives “This unit accepts whole numbers only.”
- `2.8512` at weight precision 3 gives “at most 3 decimal places; nothing was rounded.”
- Exports remain disabled for invalid counts and unexplained non-zero variances, then enable after correction and reason selection.
- An unclosed quoted field produces a clear import error; loading the example afterward recovers to 3 rows.
- A UTF-8-BOM/CRLF CSV imported as one row through the browser file input.
- Normal adjustment download contained exactly the changed line and its unit/reason.
- Normal JSON report preserved the original CSV, its import SHA-256 verified, the report integrity hash verified, and its embedded adjustment CSV exactly matched the standalone download.
- A 200-line no-variance count reached `200/200`, enabled report export, and produced 200 report lines.

### Failing boundary behavior

- Binary-decimal artifact is exported for `0.30 → 0.20`.
- An integer difference above `Number.MAX_SAFE_INTEGER` is silently treated as zero.
- Negative counts are accepted.

## Accessibility and responsive evidence

- Playwright axe scans on the landing page, populated workspace, 390 px workspace, and dark theme found no serious or critical violations.
- `<html lang="en">`, a descriptive title, one `<h1>`, `<main>`, image alt text, labels, skip link, and a visible 3 px focus outline are present.
- Reduced-motion context matched and computed button/hero transition durations were `0s`.
- Dark treatment rendered and passed the same serious/critical axe filter.
- No 390 px horizontal overflow was observed.
- Failures remain: focus destruction after field changes and sub-44 px mobile controls/links.

`verify-url.sh` result: **FAIL**, HTTP 200 and structural checks pass, but it records the two release-manifest console errors.

## Privacy, network, and endpoint evidence

- The full sample/import/count/export flow sent no inventory values, counts, reasons, notes, or file bodies over the network.
- Cold load did make three external GETs: GitHub release metadata, GitHub asset metadata, and the redirected release asset. There were no analytics, advertising, telemetry, remote fonts, or third-party scripts.
- The absolute “Nothing leaves this device” wording is therefore broader than observed behavior, although the narrower inventory-data privacy promise held.
- Root response headers: HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff` present; CSP/frame protection absent.
- Product verify endpoint: 30 requests succeeded in the observed window; request 31 returned HTTP `429`, `Retry-After: 3`, and `X-RateLimit-After: 3`. The allowance is enforced but not documented in the repository.
- No sign-in exists, so the Entra authority check is not applicable.
- The site is static; backend concurrency/health/persistence checks are otherwise not applicable.
- This is not a PWA and makes no service-worker/offline-reload claim, so PWA update/offline tests are not applicable.

## Deployment and release identity

Clean build and live hashes match:

| File | SHA-256 |
| --- | --- |
| `index.html` | `95025f3f858e488fb8df5be4f71203d7bd7efa3e51c8872b5e99879b9b298896` |
| `index-CVbufM-x.js` | `4c503643a1fba6228875c1cf3ee2a675d20d92b53fe7b5613b0974e45a6775db` |
| `index-wVoRbrs-.css` | `32406a461673514e8da19b41b2ae98c810efeddea7d9cf48db3b2ab4f9970a00` |
| `notebook-hero-tA1-myLh.webp` | `852b01e25519cc8839238e9a1f4c035efa713d37144fab094616c9f8835ce481` |

Release `v0.1.6` points to commit `6fdfd1ddda43fe2923147058f1c5917eae6597a5`; the only difference from candidate `c459a3be…` is `.factory/handoff.md`, so product source is identical. macOS arm64/x64, Windows MSI/EXE, Linux AppImage/DEB, `latest.json`, and `SHA256SUMS` are present. A fresh Windows MSI download hashed to `5b76d25b5f0541c7653a6fedcf32d485ad1b773e86447033b2c1cb827edf61e8`, exactly matching `SHA256SUMS`.

## Performance

Mobile Lighthouse against the live URL:

- Performance: `99`
- Accessibility: `100`
- Best practices: `96` (console errors)
- SEO: `100`
- LCP: `1,576 ms`
- FCP: `847 ms`
- TBT: `127 ms`
- CLS: `0.0055`

Build outputs are comfortably within static budgets: JS `16.06 KB` raw / `6.43 KB` gzip, CSS `8.85 KB` raw / `2.73 KB` gzip, hero WebP `146.90 KB`, and no web fonts.

## Commands and gate results

| Command/check | Result |
| --- | --- |
| mandatory `.factory/claims.json` discovery | **FAIL — missing** |
| `npm ci` | PASS, 0 audit vulnerabilities |
| `npm test` | PASS, 4/4 |
| `npx tsc --noEmit` | PASS |
| `npm run test:ui` | PASS, 2/2 (coverage is too narrow to catch the blockers above) |
| `npm run build` | PASS, `dist/site` |
| `npm run build:app` | PASS, `dist/app` |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | **FAIL** |
| clean `cargo check --locked --manifest-path src-tauri/Cargo.toml` | **FAIL — stale lockfile** |
| unlocked `cargo check` after installing workflow libraries | PASS, but rewrites `Cargo.lock` |
| Linux optimized executable build | PASS |
| Linux `.deb` bundle | PASS |
| Linux AppImage bundle | **FAIL locally in `linuxdeploy`** |
| 12-second native binary smoke under Xvfb | Stayed running; only headless EGL/DRI warnings |
| `/opt/fleet/lib/verify-url.sh` | **FAIL — console errors** |
| Playwright axe serious/critical scans | PASS, 0 findings in tested views |
| Lighthouse mobile | 99/100/96/100 |

## Required next steps

1. Add `.factory/claims.json` and one observable demo-based test per public claim.
2. Implement a true one-click isolated demo with direct URL, persistent banner, reset, start-real action, and `.factory/demo.md`.
3. Replace floating-point quantity arithmetic with exact scaled-decimal/integer arithmetic and enforce safe bounds/non-negative physical counts; add regression tests for both examples above.
4. Preserve/advance focus on edits and make all 390 px interactive targets at least 44 px.
5. Fix release selection without fetching GitHub’s redirected asset endpoint; verify no console errors and direct platform asset hrefs.
6. Enable the product in Sociobot billing before advertising checkout, and bind cached verdicts to a token fingerprint.
7. Synchronize and commit `Cargo.lock`, pass rustfmt, and make the exact local AppImage/DEB build reproducible.
8. Add required route/history behavior, 404, metadata/site files, CSP/frame headers, immutable asset caching, and mobile Privacy access.
9. Replace “signed/immutable” wording with accurate integrity-hash language unless a real signature is implemented.
