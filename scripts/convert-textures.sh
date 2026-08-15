#!/usr/bin/env bash
# Temporary script — converts TIF textures to browser-compatible formats for Three.js.
# Uses macOS built-in `sips`. Run once from the project root:
#   bash scripts/convert-textures.sh
#
# Output:
#   public/textures/8k_earth_normal_map.png   (PNG — preserves colour precision for normal mapping)
#   public/textures/8k_earth_specular_map.jpg (JPG — grayscale, compression artefacts don't matter)

set -euo pipefail

TEXTURES_DIR="$(dirname "$0")/../public/textures"

echo "Converting 8k_earth_normal_map.tif → PNG..."
sips \
  --setProperty format png \
  "${TEXTURES_DIR}/8k_earth_normal_map.tif" \
  --out "${TEXTURES_DIR}/8k_earth_normal_map.png"

echo "Converting 8k_earth_specular_map.tif → JPG..."
sips \
  --setProperty format jpeg \
  --setProperty formatOptions 90 \
  "${TEXTURES_DIR}/8k_earth_specular_map.tif" \
  --out "${TEXTURES_DIR}/8k_earth_specular_map.jpg"

echo ""
echo "Done. Output files:"
ls -lh "${TEXTURES_DIR}/8k_earth_normal_map.png" "${TEXTURES_DIR}/8k_earth_specular_map.jpg"
echo ""
echo "You can now delete the .tif files if you no longer need them:"
echo "  rm public/textures/8k_earth_normal_map.tif"
echo "  rm public/textures/8k_earth_specular_map.tif"
