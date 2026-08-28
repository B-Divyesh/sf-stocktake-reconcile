#!/usr/bin/env sh
# Stocktake Reconcile installer — verifies the release checksum before opening/placing an asset.
set -eu
repo="B-Divyesh/sf-stocktake-reconcile"
base="https://github.com/$repo/releases/latest/download"
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
manifest="$tmpdir/latest.json"
curl -fsSL "$base/latest.json" -o "$manifest"
os=$(uname -s)
case "$os" in
  Darwin) key=macos; extension='.dmg' ;;
  Linux) key=linux; extension='.AppImage' ;;
  *) echo "Unsupported OS: $os" >&2; exit 1 ;;
esac
url=$(sed -n "/\"$key\"/,/}/ s/.*\"url\": \"\([^\"]*\)\".*/\1/p" "$manifest")
test -n "$url" || { echo "No $key asset in release manifest" >&2; exit 1; }
file=$(basename "$url" | sed 's/%20/ /g')
asset="$tmpdir/$file"
curl -fL "$url" -o "$asset"
curl -fsSL "$base/SHA256SUMS" -o "$tmpdir/SHA256SUMS"
expected=$(grep -F "  $file" "$tmpdir/SHA256SUMS" | awk '{print $1}')
test -n "$expected" || { echo "Asset checksum missing" >&2; exit 1; }
if command -v sha256sum >/dev/null 2>&1; then actual=$(sha256sum "$asset" | awk '{print $1}'); else actual=$(shasum -a 256 "$asset" | awk '{print $1}'); fi
test "$actual" = "$expected" || { echo "Checksum verification failed" >&2; exit 1; }
if [ "$os" = Darwin ]; then
  echo "Verified $file. Opening the unsigned disk image; drag Stocktake Reconcile to Applications, then use right-click → Open on first launch."
  open "$asset"
else
  target="$HOME/.local/bin"
  mkdir -p "$target"
  cp "$asset" "$target/stocktake-reconcile.AppImage"
  chmod +x "$target/stocktake-reconcile.AppImage"
  echo "Verified and installed $target/stocktake-reconcile.AppImage"
  echo "Add $target to PATH if needed, then run stocktake-reconcile.AppImage."
fi
