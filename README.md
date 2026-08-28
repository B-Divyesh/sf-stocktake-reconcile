# Stocktake Reconcile

Stocktake Reconcile is a local-first desktop utility for a tiny ecommerce, workshop, or stockroom operator. It turns an expected-stock CSV plus physical count into an explainable adjustment journal and an integrity-hashed count report. It does not sync inventory, post accounting entries, calculate tax, or send stock data anywhere.

## What it does

- Imports `sku, name, expected, unit, unit_type, precision` CSVs.
- Supports integer, decimal, and weight units; values beyond allowed precision are rejected rather than silently rounded.
- Requires a reason for each non-zero variance.
- Exports an adjustment CSV and JSON count report containing the immutable original CSV and SHA-256 hashes.
- Runs as a Tauri 2 desktop app and has a static download page in `dist/site`.

## Develop and verify

Requires Node 22+ and Rust only for the desktop wrapper.

```sh
npm install
npm run dev             # browser workspace at localhost:5173
npm test                # reconciliation unit tests
npm run test:ui         # Playwright workflow + axe smoke scan
npm run build           # static landing site → dist/site
npm run build:app       # Tauri frontend → dist/app
npm run tauri dev       # native desktop development window
```

The Linux Tauri build needs WebKit/GTK headers; GitHub Actions installs them for release builds. The release workflow runs on a version tag and publishes macOS (`.dmg`, arm64 and x86_64), Windows (`.msi`/`.exe`), and Linux (`.AppImage`/`.deb`) assets, `SHA256SUMS`, and `latest.json`.

## Install

On the published site, choose the detected-platform download. The unsigned release scripts verify `SHA256SUMS` before installing/downloading:

```sh
curl -fsSL https://stocktake-reconcile.sociobot.in/install.sh | sh
irm https://stocktake-reconcile.sociobot.in/install.ps1 | iex
```

Windows and macOS binaries are unsigned in v1. On macOS use right-click → Open on first launch; Windows may show a SmartScreen warning.

## Privacy and licensing

Inventory files remain local. There is no analytics or telemetry. The free tool includes imports and both exports. The optional one-time Pro Archive license stores an on-device summary library of report hashes; it uses Sociobot/Dodo checkout and can be restored by pasting its token. See `/privacy/` and `/terms/`.

## License

MIT. See [LICENSE](LICENSE).
