# Handoff — Stocktake Reconcile v0.1.5

## Delivered

- Tauri 2 desktop shell with a local-first TypeScript reconciliation workspace.
- Expected-stock CSV import with explicit unit types (`integer`, `decimal`, `weight`) and precision validation; no count is rounded.
- Required reason for every non-zero variance; exported adjustment CSV includes the unit, unit type, reason and note.
- Integrity-hashed JSON count report containing the exact original CSV, its SHA-256, all count lines, and the adjustment CSV so it can be reproduced.
- Static landing site in `dist/site`, responsive at 390px, with OS-aware release links, a one-time Pro Archive license restore/verify flow, `/privacy/`, `/terms/`, and checksum-verifying install scripts.
- GitHub tag-release workflow: macOS arm64/x86_64 `.dmg`, Windows `.msi`/`.exe`, Linux `.AppImage`/`.deb`, `SHA256SUMS`, and `latest.json`.
- Original generated ledger illustration at `assets/src/notebook-hero.webp` (146.9 KB) and documented provenance in `.factory/design.md`.

## Verification

Ran successfully:

```sh
npm test
npm run test:ui
npm run build
npm run build:app
```

Results: 4 unit tests pass; 2 Playwright tests pass (full count-to-export-ready flow and axe serious/critical scan); static JS is 16.06 KB raw / 6.43 KB gzip, CSS 8.85 KB raw / 2.73 KB gzip, hero WebP 146.9 KB. The page has title/lang/main, exactly one h1 per view, skip link, keyboard-native controls, visible focus styling, semantic labelled inputs, dark mode, and reduced-motion support. A Lighthouse run was attempted with the container Chromium but its screenshot target closed during collection; the lightweight bundle and axe scan are the available local performance/accessibility evidence.

`cargo check --manifest-path src-tauri/Cargo.toml` reached the native GTK dependency stage but this disposable worker lacks `glib-2.0` development headers. The release workflow installs the required Linux WebKit/GTK packages before Tauri builds.

## How to release

After CI passes, tag and push `v0.1.5`; `.github/workflows/release.yml` builds and publishes the release. The release job generates `SHA256SUMS` and `latest.json`; the landing page uses GitHub's CORS-enabled public release API to select the matching platform asset while the release contains `latest.json` for the install scripts.

## Needs operator action

- Release assets are intentionally unsigned. For signed distribution, provide `APPLE_CERTIFICATE` (and related Apple signing/notarization values) plus `WINDOWS_CERT_PFX` to the GitHub repository, then extend the workflow signing steps with the certificate password/secrets used by the operator.
- Register the billing product before production checkout if it has not already been registered. The source deliberately uses the slug, never a hardcoded product ID.

## Known gaps

- The free v1 keeps the active worksheet in memory until its signed report is exported; it does not retain an editable draft across an app restart. This protects local-first behavior and keeps v1 focused on the physical count → audited export workflow.
- The Pro Archive stores metadata locally only; reports themselves remain user-controlled exports.
