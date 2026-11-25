#!/usr/bin/env bash
# Regenerates the extension icons from assets/icon.svg.
# Requires rsvg-convert (librsvg): `apt install librsvg2-bin` or `brew install librsvg`.
set -euo pipefail
cd "$(dirname "$0")/.."

for size in 16 32 48 128; do
  rsvg-convert -w "$size" -h "$size" assets/icon.svg -o "extension/icons/icon-$size.png"
done
echo "Icons written to extension/icons/"
