#!/usr/bin/env bash
set -euo pipefail
# Local document build only. Requires Pandoc, XeLaTeX and DejaVu fonts.
cd "$(dirname "$0")/.."
mkdir -p public/manuals/1.5
pandoc docs/V1.5_UI_REFERENCE.md --pdf-engine=xelatex --toc --number-sections \
  -V papersize=a4 -V geometry:margin=18mm -V mainfont='DejaVu Sans' \
  -V monofont='DejaVu Sans Mono' -V fontsize=10pt -V colorlinks=true \
  -o public/manuals/1.5/ARGOS_PM_UI_REFERENCE.pdf
