#!/usr/bin/env bash
# Builds the .zip to upload to the Chrome Web Store: dist/AmbiTube-<version>.zip
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' extension/manifest.json | head -n 1)
if [ -z "$version" ]; then
  echo "Could not read the version from extension/manifest.json" >&2
  exit 1
fi

mkdir -p dist
output="dist/AmbiTube-$version.zip"
rm -f "$output"
(cd extension && zip -r -q -X "../$output" . -x '.*' -x '*/.*')

echo "Created $output"
