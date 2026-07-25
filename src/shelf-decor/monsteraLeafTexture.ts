import * as THREE from 'three';

// The monstera's whole identity is its silhouette — the deep side splits and
// the interior holes — and none of that can come from the mesh: a fenestrated
// blade is a plane with pieces missing, so the shape lives in the alpha
// channel and the material's alphaTest cuts it out. Each variant is drawn once
// into an offscreen canvas and shared across every plant on the shelf.
//
// Texture orientation matches monsteraLeafGeometry: the petiole attaches at
// the BOTTOM of the image (v = 0) and the tip is at the top, so a blade whose
// base sits at y = 0 and grows to +y needs no flipping.
const cache = new Map<number, THREE.CanvasTexture>();
const VARIANTS = 4;

export function monsteraLeafTexture(variant = 0): THREE.CanvasTexture {
  const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
  const cached = cache.get(v);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Per-variant determinism: the texture is cached forever, so it can't take
  // the plant's rng — the variant index seeds its own generator instead.
  let s = v * 7919 + 101;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  const cx = size * (0.5 + (v - 1.5) * 0.02);
  const baseY = size * 0.94; // petiole end
  const tipY = size * 0.06;
  const halfW = size * (0.40 + rnd() * 0.05);
  const span = baseY - tipY;

  // Outline: a broad heart — two lobes flaring either side of the petiole,
  // widest around a third up, drawing into a blunt point.
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.bezierCurveTo(cx - halfW * 0.5, baseY, cx - halfW, baseY - span * 0.25, cx - halfW, baseY - span * 0.5);
    ctx.bezierCurveTo(cx - halfW, baseY - span * 0.8, cx - halfW * 0.4, tipY, cx, tipY);
    ctx.bezierCurveTo(cx + halfW * 0.4, tipY, cx + halfW, baseY - span * 0.8, cx + halfW, baseY - span * 0.5);
    ctx.bezierCurveTo(cx + halfW, baseY - span * 0.25, cx + halfW * 0.5, baseY, cx, baseY);
    ctx.closePath();
  };

  outline();
  ctx.save();
  ctx.clip();

  // Glossy deep green, darkest toward the base where the leaf is oldest.
  const base = ctx.createLinearGradient(0, tipY, 0, baseY);
  base.addColorStop(0, '#3d7f42');
  base.addColorStop(0.55, '#2c6435');
  base.addColorStop(1, '#1d4527');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Ribs run from the midrib out toward each split, which is what makes the
  // fenestrations read as gaps *between* ribs rather than random punctures.
  const ribs = 5;
  ctx.lineWidth = 2.4;
  for (let i = 0; i < ribs; i++) {
    const t = 0.16 + (i / ribs) * 0.74;
    const y = baseY - span * t;
    const reach = halfW * (0.92 - t * 0.35);
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.quadraticCurveTo(cx + dir * reach * 0.5, y - span * 0.04, cx + dir * reach, y - span * 0.1);
      ctx.stroke();
    }
  }

  // Midrib: a raised pale spine with a shadow under it.
  ctx.strokeStyle = 'rgba(20,50,25,0.45)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx + 3, baseY);
  ctx.lineTo(cx + 3, tipY + span * 0.04);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(224,240,196,0.4)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx, baseY);
  ctx.lineTo(cx, tipY + span * 0.04);
  ctx.stroke();

  // Waxy sheen — monstera leaves are markedly glossier than pothos.
  const gloss = ctx.createRadialGradient(
    cx - halfW * 0.35, baseY - span * 0.62, 0,
    cx - halfW * 0.35, baseY - span * 0.62, size * 0.34,
  );
  gloss.addColorStop(0, 'rgba(255,255,255,0.26)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, size, size);

  ctx.restore();

  // Rim shading before the cuts, so the un-cut edges get their ambient-occlusion
  // darkening; the split edges get their own outline afterwards.
  outline();
  ctx.strokeStyle = 'rgba(8,28,12,0.4)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // --- fenestration -------------------------------------------------------
  // Side splits: wedges eaten in from each margin, alternating up the blade
  // and stopping short of the midrib. Erased rather than drawn so the alpha
  // channel carries the shape.
  ctx.globalCompositeOperation = 'destination-out';
  const splitPaths: (() => void)[] = [];
  const splits = 3 + Math.floor(rnd() * 2);
  for (let i = 0; i < splits; i++) {
    for (const dir of [-1, 1]) {
      const t = 0.2 + (i / splits) * 0.66 + (dir < 0 ? 0.07 : 0) + rnd() * 0.03;
      const y = baseY - span * t;
      const depth = halfW * (0.5 + rnd() * 0.28); // stops short of the midrib
      const mouth = span * (0.075 + rnd() * 0.05);
      const p = () => {
        ctx.beginPath();
        ctx.moveTo(cx + dir * halfW * 1.15, y - mouth);
        ctx.quadraticCurveTo(cx + dir * depth * 0.7, y - mouth * 0.4, cx + dir * (halfW - depth), y);
        ctx.quadraticCurveTo(cx + dir * depth * 0.7, y + mouth * 0.5, cx + dir * halfW * 1.15, y + mouth);
        ctx.closePath();
      };
      splitPaths.push(p);
      p();
      ctx.fill();
    }
  }

  // Interior holes — the "deliciosa" perforations, a couple of ovals set
  // between the midrib and the splits.
  const holes = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < holes; i++) {
    const dir = i % 2 === 0 ? -1 : 1;
    const t = 0.3 + rnd() * 0.42;
    const hx = cx + dir * halfW * (0.22 + rnd() * 0.16);
    const hy = baseY - span * t;
    const rx = size * (0.022 + rnd() * 0.018);
    const ry = rx * (1.6 + rnd() * 0.9);
    const p = () => {
      ctx.beginPath();
      ctx.ellipse(hx, hy, rx, ry, dir * 0.35, 0, Math.PI * 2);
      ctx.closePath();
    };
    splitPaths.push(p);
    p();
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Darken the cut edges too — without this the fenestrations look like clean
  // die-cuts instead of leaf margins.
  ctx.strokeStyle = 'rgba(8,28,12,0.55)';
  ctx.lineWidth = 3;
  for (const p of splitPaths) {
    p();
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(v, tex);
  return tex;
}

export const MONSTERA_LEAF_VARIANTS = VARIANTS;
