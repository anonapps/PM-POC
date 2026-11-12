#!/usr/bin/env bash
set -euo pipefail
# Build the version-matched v1.7 manual locally. Publication and deployment are separate actions.
cd "$(dirname "$0")/.."
mkdir -p public/manuals/1.7
pandoc docs/V1.7_UI_REFERENCE.md --pdf-engine=xelatex --toc --number-sections \
  -V papersize=a4 -V geometry:margin=18mm -V mainfont='DejaVu Sans' \
  -V monofont='DejaVu Sans Mono' -V fontsize=10pt -V colorlinks=true \
  -o public/manuals/1.7/ARGOS_PM_UI_REFERENCE.pdf
# Keep the generic GitHub downloads identical to the current versioned manual.
cp public/manuals/1.7/ARGOS_PM_UI_REFERENCE.pdf docs/ARGOS_PM_UI_REFERENCE.pdf
pandoc docs/V1.7_UI_REFERENCE.md --toc --number-sections \
  -o docs/ARGOS_PM_UI_REFERENCE.docx
