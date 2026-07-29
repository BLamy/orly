import * as THREE from 'three';

// A handful of pothos leaves — asymmetric rounded hearts with the marbled
// cream/green variegation pothos are known for, plus a soft gloss highlight
// (pothos leaves are noticeably waxy/shiny) — drawn once per variant into an
// offscreen canvas and reused as shared alpha-mapped textures across every
// plant instance. Several variants (not just one repeated leaf) is what
// keeps a vine from reading as a string of identical stickers.
const cache = new Map<number, THREE.CanvasTexture>();
const VARIANTS = 4;

export function leafTexture(variant = 0): THREE.CanvasTexture {
  const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
  const cached = cache.get(v);
  if (cached) return cached;

  const size = 160;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  // Per-variant asymmetry — real leaves are never perfectly symmetric.
  const lean = (v - 1.5) * 0.06;
  const cx = size * (0.5 + lean);
  const topY = size * 0.24;
  const tipY = size * 0.94;
  const leftW = size * (0.46 - lean * 0.5);
  const rightW = size * (0.46 + lean * 0.5);

  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.bezierCurveTo(cx - leftW * 0.95, size * 0.62, cx - leftW * 0.7, topY, cx - leftW * 0.05, topY - size * 0.03);
  ctx.bezierCurveTo(cx + leftW * 0.15, topY - size * 0.09, cx + rightW * 0.35, topY - size * 0.04, cx + rightW * 0.55, topY + size * 0.1);
  ctx.bezierCurveTo(cx + rightW * 0.95, size * 0.42, cx + rightW * 0.9, size * 0.64, cx, tipY);
  ctx.closePath();
  ctx.clip();

  // Base color: a deep, slightly blue-toned green — pothos reads darker and
  // richer than the pale mint of the first pass.
  const base = ctx.createLinearGradient(0, topY, 0, tipY);
  base.addColorStop(0, '#3f7a3e');
  base.addColorStop(1, '#25502a');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Marbled variegation — a few soft cream/chartreuse blotches, hugging the
  // vein, varied per variant so the four leaf types read distinctly.
  const blotchSeed = v * 97 + 13;
  let bs = blotchSeed;
  const rnd = () => {
    bs = (bs * 1103515245 + 12345) & 0x7fffffff;
    return bs / 0x7fffffff;
  };
  ctx.globalCompositeOperation = 'lighter';
  const blotches = 3 + Math.floor(rnd() * 2);
  for (let i = 0; i < blotches; i++) {
    const bx = cx + (rnd() - 0.5) * leftW * 1.1;
    const by = topY + rnd() * (tipY - topY) * 0.8;
    const r = size * (0.08 + rnd() * 0.09);
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    grad.addColorStop(0, 'rgba(214, 228, 158, 0.55)');
    grad.addColorStop(1, 'rgba(214, 228, 158, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Center vein + a few side veins, faint.
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, topY + size * 0.06);
  ctx.lineTo(cx, tipY - 5);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    const y = topY + (tipY - topY) * (0.35 + t * 0.5);
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx - leftW * 0.5 * t, y - size * 0.05);
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + rightW * 0.5 * t, y - size * 0.05);
    ctx.stroke();
  }

  // Waxy gloss: a soft highlight near the upper lobe.
  const gloss = ctx.createRadialGradient(cx - leftW * 0.25, topY + size * 0.12, 0, cx - leftW * 0.25, topY + size * 0.12, size * 0.28);
  gloss.addColorStop(0, 'rgba(255,255,255,0.32)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, size, size);

  // Darken the rim slightly for form (a cheap ambient-occlusion fake).
  ctx.strokeStyle = 'rgba(10,30,10,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.bezierCurveTo(cx - leftW * 0.95, size * 0.62, cx - leftW * 0.7, topY, cx - leftW * 0.05, topY - size * 0.03);
  ctx.bezierCurveTo(cx + leftW * 0.15, topY - size * 0.09, cx + rightW * 0.35, topY - size * 0.04, cx + rightW * 0.55, topY + size * 0.1);
  ctx.bezierCurveTo(cx + rightW * 0.95, size * 0.42, cx + rightW * 0.9, size * 0.64, cx, tipY);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(v, tex);
  return tex;
}

export const LEAF_VARIANTS = VARIANTS;
