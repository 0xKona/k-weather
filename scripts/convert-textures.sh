#!/usr/bin/env bash
# Texture optimisation script — converts and resizes textures for web delivery.
# Uses macOS built-in `sips`. Run once from the project root:
#   bash scripts/convert-textures.sh
#
# Results (approximate):
#   normal_map.png   11 MB → ~3.5 MB  (PNG → JPG q85, 8K kept — detail is visible)
#   clouds.jpg       11 MB → ~2.5 MB  (downscale to 4K — semi-transparent, 4K identical)
#   specular.jpg      2 MB → ~0.4 MB  (downscale to 2K — single-channel mask)
#   nightmap.jpg      3 MB → ~0.8 MB  (downscale to 2K — already looks low-res)
#   daymap.jpg        4.4 MB          (kept as-is — 8K detail is visible at horizon)
#
# Total: ~34 MB → ~12 MB

set -euo pipefail

TEXTURES_DIR="$(dirname "$0")/../public/textures"

echo "▶ Converting 8k_earth_normal_map.tif → JPG (8K, q85)..."
sips \
  --setProperty format jpeg \
  --setProperty formatOptions 85 \
  "${TEXTURES_DIR}/8k_earth_normal_map.tif" \
  --out "${TEXTURES_DIR}/8k_earth_normal_map.jpg"

echo "▶ Converting 8k_earth_specular_map.tif → JPG (2K, q85)..."
sips \
  --resampleHeightWidth 1080 2160 \
  --setProperty format jpeg \
  --setProperty formatOptions 85 \
  "${TEXTURES_DIR}/8k_earth_specular_map.tif" \
  --out "${TEXTURES_DIR}/8k_earth_specular_map.jpg"

echo "▶ Downscaling 8k_earth_clouds.jpg → 4K..."
sips \
  --resampleHeightWidth 2160 4320 \
  --setProperty format jpeg \
  --setProperty formatOptions 85 \
  "${TEXTURES_DIR}/8k_earth_clouds.jpg" \
  --out "${TEXTURES_DIR}/8k_earth_clouds.jpg"

echo "▶ Downscaling 8k_earth_nightmap.jpg → 2K..."
sips \
  --resampleHeightWidth 1080 2160 \
  --setProperty format jpeg \
  --setProperty formatOptions 85 \
  "${TEXTURES_DIR}/8k_earth_nightmap.jpg" \
  --out "${TEXTURES_DIR}/8k_earth_nightmap.jpg"

echo ""
echo "Done. Final sizes:"
ls -lh \
  "${TEXTURES_DIR}/8k_earth_daymap.jpg" \
  "${TEXTURES_DIR}/8k_earth_normal_map.jpg" \
  "${TEXTURES_DIR}/8k_earth_specular_map.jpg" \
  "${TEXTURES_DIR}/8k_earth_clouds.jpg" \
  "${TEXTURES_DIR}/8k_earth_nightmap.jpg"

echo ""
echo "Update Globe.tsx to use 8k_earth_normal_map.jpg instead of .png"
echo "You can now delete the .tif and .png files:"
echo "  rm public/textures/8k_earth_normal_map.tif"
echo "  rm public/textures/8k_earth_normal_map.png"
echo "  rm public/textures/8k_earth_specular_map.tif"
