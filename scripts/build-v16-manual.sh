#!/usr/bin/env bash
set -euo pipefail
# Build the version-matched v1.6 manual locally. Publication and deployment are separate actions.
cd "$(dirname "$0")/.."
mkdir -p public/manuals/1.6
pandoc docs/V1.6_UI_REFERENCE.md --pdf-engine=xelatex --toc --number-sections \
  -V papersize=a4 -V geometry:margin=18mm -V mainfont='DejaVu Sans' \
  -V monofont='DejaVu Sans Mono' -V fontsize=10pt -V colorlinks=true \
  -o public/manuals/1.6/ARGOS_PM_UI_REFERENCE.pdf
