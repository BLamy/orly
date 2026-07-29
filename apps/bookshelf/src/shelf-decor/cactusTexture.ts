import * as THREE from 'three';

// Cactus "skin": vertical pleated ribs (alternating light/dark green
// stripes, wrapped around the trunk) with small pale spine-dots along each
// ridge — drawn once into an offscreen canvas, tiled around a cylinder/
// capsule via UV repeat rather than per-instance geometry.
let cached: THREE.CanvasTexture | null = null;

export function cactusTexture(): THREE.CanvasTexture {
  if (cached) return cached;

  const w = 256;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const ribCount = 10;
  const ribW = w / ribCount;
  for (let i = 0; i < ribCount; i++) {
    const x = i * ribW;
    const grad = ctx.createLinearGradient(x, 0, x + ribW, 0);
    const light = i % 2 === 0 ? '#4f8f4a' : '#3d7538';
    const dark = i % 2 === 0 ? '#3a6e3a' : '#2c5a2c';
    grad.addColorStop(0, dark);
    grad.addColorStop(0.5, light);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, ribW, h);
  }

  // Spine dots along each rib crest, staggered vertically.
  ctx.fillStyle = 'rgba(240, 235, 210, 0.85)';
  for (let i = 0; i < ribCount; i++) {
    const x = i * ribW + ribW / 2;
    const stagger = (i % 2) * 14;
    for (let y = stagger; y < h; y += 26) {
      ctx.beginPath();
      ctx.ellipse(x, y, 1.6, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cached = tex;
  return tex;
}
