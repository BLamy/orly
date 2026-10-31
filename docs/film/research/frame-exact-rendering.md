# Frame-exact rendering (verified 2026-10-05)

**Decision:** frame-step a pure render page and capture each frame with CDP; never use
Playwright `recordVideo` (25 fps wall-clock VP8 ≈ 1 Mb/s; on heavy haze/blur scenes 17% of
frames repeat — measured in the pipeline map).

## Measured (Apple M4 Max; heavy silhouette benchmark frame; barcode check = 0 mismatches)
| browser / raster / viewport / method | ms per frame | fps per worker |
|---|---|---|
| headless-shell · GPU · 1280×720 @ DSF 1.5 · CDP JPEG fast | 35.1 | 28.5 |
| headless-shell · GPU · native 1920×1080 · CDP JPEG fast | 38.2 | 26.2 |
| headless-shell · GPU · native 1920×1080 · Playwright JPEG | 39.3 | 25.4 |
| system Chrome · default · native 1920×1080 · CDP JPEG fast | 40.4 | 24.8 |
| headless-shell · default (no GPU flags) · native · Playwright JPEG | 69.9 | 14.3 |
| headless-shell · native · CDP PNG | 265 | 3.8 |

GPU flags: `--enable-gpu --use-angle=metal --enable-gpu-rasterization --ignore-gpu-blocklist`.
Pitfall: with `deviceScaleFactor` 1.5, a bare CDP `Page.captureScreenshot` returns DIP-size
(1280×720) unless the clip carries `scale: 1.5`; prefer a native 1920×1080 viewport.
Canvas text does not wait for webfonts: `await document.fonts.load(spec)` for every font first.

## Plan
- JPEG q95 (`optimizeForSpeed`) → ffmpeg `image2pipe` → `libx264 -crf 18 -preset medium -tune grain -pix_fmt yuv420p`.
- Shard by time across 6–8 workers into segments; concat demuxer without re-encode; verify
  `nb_frames == round(duration·fps)`; mux master audio (AAC 256k).
- Expected: 35 min at 24 fps = 50,400 frames; at ~25 fps/worker × 6–8 workers ≈ 5–8 minutes of
  capture (painting cost on top; the canvas style probe measured 71 ms uncached, so layer caching matters).
- Benchmark harness: `.orly-work/probes/render/render-bench.mjs`.
