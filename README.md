# Stocktake Reconcile

Stocktake Reconcile is a local-first desktop app for store teams who reconcile shelf counts with expected stock. It imports an expected-stock CSV, validates exact quantities, and exports reviewable adjustment files.

Try the three-line sample at `/demo`. The demo is isolated in memory and is discarded when you start a real count.

## What it does

- Imports `sku, name, expected, unit, unit_type, precision` CSV files.
- Uses scaled-integer arithmetic for integer, decimal, and weight quantities. It rejects negative physical counts and excess precision rather than rounding.
- Requires a reason for every non-zero variance.
- Exports an adjustment CSV and a JSON integrity report with an SHA-256 hash. The hash detects changes; it is not a digital signature.
- Runs as a Tauri 2 desktop app. `npm run build:site` creates the static product site in `dist/site`.

## Run and verify

Requires Node 22+, Rust, and (on Linux) the GTK/WebKit packages installed in `.github/workflows/release.yml`.

```sh
npm ci
npm test
npx tsc --noEmit
npm run test:ui
npm run build
npm run build:app
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

For a local Linux package build:

```sh
CI=true npm run tauri build -- --target x86_64-unknown-linux-gnu --bundles appimage,deb
```

The tag-triggered GitHub Actions workflow builds macOS `.dmg`, Windows `.msi`/`.exe`, and Linux `.AppImage`/`.deb` files, then publishes `SHA256SUMS` and `latest.json`. Release artifact names and manifests are sorted deterministically; build time is fixed to the tagged commit timestamp. The Tauri wrapper enables AppImage extraction on Linux so the same command works in FUSE-restricted containers.

## Privacy and deployment

Inventory data remains in the browser or desktop app. The product has no analytics, telemetry, inventory sync, payment flow, or runtime third-party requests. The static site is deployed from `dist/site`; its routing, security headers, and immutable asset caching are in `staticwebapp.config.json`.

See `/privacy/`, `/terms/`, [`.factory/demo.md`](.factory/demo.md), and [`.factory/claims.json`](.factory/claims.json).

## License

MIT. See [LICENSE](LICENSE).
