# Handoff — independent verification of v0.1.7

## Result

**FAIL — do not release candidate `ed23f535d8024fc0687eb79d5e5fea13e2ccedeb`.**

Verified on 2026-09-02 at `https://stocktake-reconcile.sociobot.in`. The deployed static product matches the candidate byte-for-byte, so the findings are not caused by a stale deployment. Full evidence is in `.factory/verification-2.md`.

## Release blockers

1. GitHub has no v0.1.7 release. Every live Linux, Windows, and macOS download URL returns HTTP 404. Candidate workflow run `33298617992` failed in the Windows Tauri bundle step and skipped the release job.
2. Opening **Demo** while a real worksheet is active replaces the real worksheet with sample data without warning or recovery. Demo and real work share one global in-memory object.
3. The claims contract fails despite green listed commands: the desktop-download test checks only the URL pattern, not that the package exists; the false demo-separation promise and integrity-report claims are unlisted.
4. Intel macOS visitors are linked to the arm64 DMG, and release metadata represents only one macOS architecture.

Additional defects: the brief's signed report is only a self-hashed, explicitly unsigned JSON report; unknown routes return HTTP 200; the required desktop screenshot walkthrough is absent; one 390 px nav target is 42 px wide; the first screen has only two plain facts; OG/touch image dimensions miss the contract.

## What passed

- Every command in `.factory/claims.json` exits successfully, but the claims outcome fails for the reasons above.
- `npm ci` (0 vulnerabilities), `npm test` (8/8), `npx tsc --noEmit`, `npm run build`, `npm run build:app`, and `npm run test:ui` (7/7).
- Rust formatting and locked dependency checks after installing the documented Linux native packages.
- Exact local Linux Tauri AppImage/DEB build and a 12-second AppImage smoke under Xvfb.
- Exact decimal arithmetic, >MAX_SAFE_INTEGER variance, non-negative/precision validation, invalid CSV recovery, reason gating, CSV/report export, report hashes, and a 200-line count.
- Same-origin-only live flow with no analytics, third-party runtime requests, console errors, or page errors.
- Axe serious/critical scans, keyboard focus, reduced motion, light/dark modes, 390 px layout, and 200% text sizing apart from the one target defect.
- Lighthouse mobile: 98 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.61 s, TBT 168 ms, CLS 0.
- Security headers and immutable caching for hashed assets.

## Re-run

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm run build:app
npm run test:ui
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --locked --manifest-path src-tauri/Cargo.toml
CI=true npm run tauri build -- --target x86_64-unknown-linux-gnu --bundles appimage,deb
```

Also run every command in `.factory/claims.json`, `/opt/fleet/lib/verify-url.sh` against the live URL, live Playwright network/axe/mobile/keyboard checks, and verify all published release assets and checksums.

## Needs operator action

- Repair and rerun the Windows release build, then publish a new version with macOS arm64/x64, Windows, Linux, `SHA256SUMS`, and `latest.json`.
- Do not repoint the existing v0.1.7 tag after verification; use a new candidate version after code fixes.
- Signing certificates are not configured. The current packages are unsigned; future signing would require owner-provided Apple and Windows certificates.

No prohibited infrastructure or unrelated product resource was accessed or modified.
