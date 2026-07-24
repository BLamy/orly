import * as THREE from 'three';

// Snake plant (Sansevieria) blades: tall, stiff, pointed, dark green with
// the wavy lighter horizontal banding the plant is known for, and (on the
// "laurentii" variant) a cream edge stripe. Drawn once per variant into a
// tall, narrow offscreen canvas and reused as a shared alpha-mapped texture.
const cache = new Map<number, THREE.CanvasTexture>();
const VARIANTS = 3;

export function bladeTexture(variant = 0): THREE.CanvasTexture {
  const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
  const cached = cache.get(v);
  if (cached) return cached;

  const w = 96;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const baseW = w * 0.32;
  const tipY = h * 0.02;

  // A tall tapered blade with a slightly wavy edge (not a perfect lens).
  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.bezierCurveTo(cx - baseW * 0.15, h * 0.15, cx - baseW * 0.55, h * 0.45, cx - baseW * 0.65, h * 0.75);
  ctx.bezierCurveTo(cx - baseW * 0.72, h * 0.9, cx - baseW * 0.6, h * 0.98, cx - baseW * 0.5, h);
  ctx.lineTo(cx + baseW * 0.5, h);
  ctx.bezierCurveTo(cx + baseW * 0.6, h * 0.98, cx + baseW * 0.72, h * 0.9, cx + baseW * 0.65, h * 0.75);
  ctx.bezierCurveTo(cx + baseW * 0.55, h * 0.45, cx + baseW * 0.15, h * 0.15, cx, tipY);
  ctx.closePath();
  ctx.clip();

  // Base color: deep, slightly blue-green.
  const base = ctx.createLinearGradient(0, 0, w, 0);
  base.addColorStop(0, '#1f4a2e');
  base.addColorStop(0.5, '#2e6b3d');
  base.addColorStop(1, '#1f4a2e');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Wavy horizontal variegation bands — the plant's signature look.
  let bs = v * 733 + 91;
  const rnd = () => {
    bs = (bs * 1103515245 + 12345) & 0x7fffffff;
    return bs / 0x7fffffff;
  };
  const bandCount = 5 + Math.floor(rnd() * 3);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < bandCount; i++) {
    const by = rnd() * h;
    const bh = h * (0.04 + rnd() * 0.05);
    const grad = ctx.createLinearGradient(0, by, 0, by + bh);
    grad.addColorStop(0, 'rgba(120, 168, 90, 0)');
    grad.addColorStop(0.5, 'rgba(140, 188, 104, 0.45)');
    grad.addColorStop(1, 'rgba(120, 168, 90, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, by, w, bh);
  }
  ctx.globalCompositeOperation = 'source-over';

  // "laurentii" variant: a cream edge stripe down both sides.
  if (v === 1) {
    ctx.strokeStyle = 'rgba(230, 222, 170, 0.55)';
    ctx.lineWidth = w * 0.06;
    ctx.beginPath();
    ctx.moveTo(cx - baseW * 0.45, h * 0.2);
    ctx.lineTo(cx - baseW * 0.55, h * 0.95);
    ctx.moveTo(cx + baseW * 0.45, h * 0.2);
    ctx.lineTo(cx + baseW * 0.55, h * 0.95);
    ctx.stroke();
  }

  // Subtle center highlight for a rounded, waxy cross-section.
  const gloss = ctx.createLinearGradient(cx - baseW * 0.3, 0, cx + baseW * 0.1, 0);
  gloss.addColorStop(0, 'rgba(255,255,255,0.16)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, w, h);

  // Darken the rim for form.
  ctx.strokeStyle = 'rgba(8, 24, 12, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.bezierCurveTo(cx - baseW * 0.15, h * 0.15, cx - baseW * 0.55, h * 0.45, cx - baseW * 0.65, h * 0.75);
  ctx.bezierCurveTo(cx - baseW * 0.72, h * 0.9, cx - baseW * 0.6, h * 0.98, cx - baseW * 0.5, h);
  ctx.moveTo(cx + baseW * 0.5, h);
  ctx.bezierCurveTo(cx + baseW * 0.6, h * 0.98, cx + baseW * 0.72, h * 0.9, cx + baseW * 0.65, h * 0.75);
  ctx.bezierCurveTo(cx + baseW * 0.55, h * 0.45, cx + baseW * 0.15, h * 0.15, cx, tipY);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(v, tex);
  return tex;
}

export const BLADE_VARIANTS = VARIANTS;
