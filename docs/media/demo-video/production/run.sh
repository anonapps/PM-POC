#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -lt 1 ]; then
  echo 'Usage: bash run.sh /absolute/path/to/ARGOS-repository [output-directory]'
  exit 2
fi
repo=$(realpath "$1")
production_dir=$(cd "$(dirname "$0")" && pwd)
export ARGOS_OUTPUT=${2:-"$repo/work/argos-video/deliverables"}
export ARGOS_URL=${ARGOS_URL:-http://127.0.0.1:3000}
export CHROME_PATH=${CHROME_PATH:-/usr/bin/chromium}
mkdir -p "$repo/work/argos-video" "$ARGOS_OUTPUT"
cp "$production_dir/produce.spec.ts" "$production_dir/playwright.config.ts" "$production_dir/render.py" "$production_dir/document.py" "$repo/work/argos-video/"
cd "$repo"
# Start the local production build separately before running this script.
npx playwright test -c work/argos-video/playwright.config.ts
python3 work/argos-video/render.py
python3 work/argos-video/document.py
