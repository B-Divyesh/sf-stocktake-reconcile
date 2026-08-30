# Handoff — Stocktake Reconcile v0.1.7 repair

## Result

This repair addresses every release blocker in the independent verification report at `ef2ab76f8155e2b19c53d586e0aa882f6d160140`.

- Quantity calculation uses scaled `BigInt` values, so `0.30 - 0.20` exports `-0.1` and values above `Number.MAX_SAFE_INTEGER` retain a one-unit variance. Negative physical counts are rejected.
- `/demo` now opens a one-click, three-line in-memory sample ledger with a persistent demo banner, reset, and start-real controls. `.factory/demo.md`, `.factory/claims.json`, and tagged observable claim tests are included.
- Keyboard edits preserve focus, all compact form/nav/footer targets are at least 44 px, and Privacy remains reachable at 390 px.
- The app has history routes, a client 404 view plus static `404.html`, route titles, canonical/OG/Twitter metadata, favicon/touch icon, robots, sitemap, security headers, and immutable asset caching.
- Broken live GitHub asset fetches and the unavailable billing/Pro path were removed. Download actions are direct release navigations, not fetches. Reports are accurately named integrity reports; no signed or immutable promise remains.
- `Cargo.lock` was regenerated for Cargo 1.98, rustfmt is restored, release-manifest output is sorted and collision-safe, and v0.1.7 packaging is deterministic from the commit timestamp. Linux packaging supplies `file`, `libfuse2t64`, and a safe compatibility wrapper for a GTK link collision.

## Verification

Run from a clean checkout:

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm run test:ui
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --locked --manifest-path src-tauri/Cargo.toml
CI=true npm run tauri build -- --target x86_64-unknown-linux-gnu --bundles appimage,deb
```

Completed locally on 2026-08-30:

- `npm ci`: pass, 0 vulnerabilities.
- `npm test`: pass, 8 tests. This includes exact-decimal, >MAX_SAFE_INTEGER, negative-count, BOM import, and deterministic release-manifest regression coverage.
- `npx tsc --noEmit`: pass.
- `npm run build`: pass; static initial JS is 14.95 KB raw / 6.03 KB gzip, CSS is 8.84 KB raw / 2.73 KB gzip, and the hero WebP is 146.90 KB.
- `npm run test:ui`: pass, 7 tests: demo, CSV download, privacy/network, detected download URL, keyboard focus, 390 px target sizes, console, and axe serious/critical scans.
- Every command in `.factory/claims.json`: pass (`npm test -- -t @claim:exact-quantities` and four Playwright claims).
- `cargo fmt --check` and `cargo check --locked`: pass.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174 …`: pass with no browser errors; title/lang/h1/main/alt checks all pass.
- `CI=true npm run tauri build -- --target x86_64-unknown-linux-gnu --bundles appimage,deb`: pass. Produced `Stocktake Reconcile_0.1.7_amd64.AppImage` (77,658,616 bytes) and `Stocktake Reconcile_0.1.7_amd64.deb` (3,090,890 bytes).

## Deployment and release

The static deployment artifact remains `dist/site`. Push `main` and tag `v0.1.7`; the checked-in GitHub Actions workflow builds macOS, Windows, and Linux release assets plus `SHA256SUMS` and `latest.json`. The landing page's platform link targets the v0.1.7 release asset and does not issue a CORS-sensitive fetch.

## Known scope

The product remains local-first with no paid features, telemetry, hosted database, or update checker. The static host performs the actual deployment; no infrastructure or unrelated service/resource was accessed.
