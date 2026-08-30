# Handoff — independent verification of Stocktake Reconcile v0.1.6

## Verdict

**FAIL — do not release candidate `c459a3be94be3ecec28f6dcdcdca2d6d70382ce1`.**

Verified on 2026-08-30 UTC against `https://stocktake-reconcile.sociobot.in`. The live HTML, JS, CSS, and hero image exactly match the candidate build. Full evidence and reproduction details are in `.factory/verification.md`.

## Release blockers

- `.factory/claims.json` is missing, so the mandatory claims gate cannot run.
- The cold page does not say who the product is for and has no one-click sample-data demo. `/demo` and `?demo=1` are ordinary landing pages with no sandbox, banner, reset, or separate storage.
- Quantity arithmetic is not unit-safe: `0.30 → 0.20` exports `-0.09999999999999998`, and `9007199254740993 → 9007199254740992` is silently treated as zero variance.
- Negative physical counts are accepted and exportable.
- Editing any count destroys keyboard focus; mobile count/note fields are 33 px high.
- The release-manifest request produces CORS console errors on every load and leaves the platform download on its generic fallback.
- The advertised $19 checkout returns HTTP 404.
- The committed Rust lockfile is stale; clean `cargo check --locked` fails.

Additional medium/low findings cover license-verdict cache confusion, overstated “signed/immutable” wording, missing routing/404/metadata/CSP/cache controls, hidden mobile Privacy navigation, local AppImage bundling failure, and rustfmt failure.

## What passed

- `npm ci` (0 vulnerabilities), `npm test` (4/4), `npx tsc --noEmit`, `npm run test:ui` (2/2), `npm run build`, and `npm run build:app`.
- Normal sample count, required-reason gating, invalid precision messages/recovery, CSV and JSON downloads, original-import hash, report integrity hash, and embedded adjustment reproducibility.
- A 200-line count reached 200/200 and exported a 200-line report.
- Axe found no serious/critical violations across landing, workspace, mobile, and dark views; reduced motion is respected.
- Lighthouse mobile: performance 99, accessibility 100, best practices 96, SEO 100; LCP 1.58 s, CLS 0.006.
- No inventory/count data left the browser in the observed flow; only GitHub release requests occurred. No analytics/telemetry was found.
- Billing verify rate limit enforced: 30 allowed in the observed window, request 31 returned 429 with `Retry-After: 3`.
- Published macOS/Windows/Linux assets exist. A downloaded Windows MSI matched its published SHA-256 exactly.
- With documented Linux libraries installed, native `cargo check`, optimized executable build, and `.deb` packaging passed. AppImage packaging failed locally in `linuxdeploy`; the published AppImage exists.

## How to reproduce

```sh
npm ci
npm test
npx tsc --noEmit
npm run test:ui
npm run build
npm run build:app
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --locked --manifest-path src-tauri/Cargo.toml
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh https://stocktake-reconcile.sociobot.in /tmp/stocktake-verify
```

For the native Linux build, install the packages listed in `.github/workflows/release.yml`, then run:

```sh
CI=true npm run tauri build -- --target x86_64-unknown-linux-gnu --bundles appimage,deb
```

## Next action

Repair the critical/high findings, add the mandatory claims/demo artifacts and regression coverage, publish a new candidate, then repeat independent verification. Do not treat the existing published binaries or strong Lighthouse score as acceptance of this candidate.
