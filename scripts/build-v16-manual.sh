#!/usr/bin/env bash
set -euo pipefail
# Local candidate manual only. Does not publish a release or deploy an application.
cd "$(dirname "$0")/.."
mkdir -p public/manuals/1.6
pandoc docs/V1.6_UI_REFERENCE.md --pdf-engine=xelatex --toc --number-sections \
  -V papersize=a4 -V geometry:margin=18mm -V mainfont='DejaVu Sans' \
  -V monofont='DejaVu Sans Mono' -V fontsize=10pt -V colorlinks=true \
  -o public/manuals/1.6/ARGOS_PM_UI_REFERENCE.pdf
