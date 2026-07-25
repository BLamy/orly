import * as THREE from 'three';

// Snake plant (Sansevieria) blade surface: deep green with the wavy lighter
// horizontal banding the plant is known for, and (on the "laurentii" variant)
// a cream edge stripe.
//
// This is a full-bleed surface texture, NOT a cutout: the blade's silhouette
// now comes from the mesh itself (see snakeBladeGeometry), so there's no clip
// path and no alpha channel to fringe. UVs run u = 0..1 across the blade and
// v = 0 at the base to v = 1 at the tip, which (three.js UVs being y-up) means
// the base is the BOTTOM of this canvas.
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

  // Base color, dark at both edges so the trough's own shading is reinforced
  // by the paint (real blades are darkest where they roll away from you).
  const base = ctx.createLinearGradient(0, 0, w, 0);
  base.addColorStop(0, '#173c25');
  base.addColorStop(0.32, '#2c6b3d');
  base.addColorStop(0.55, '#37804a');
  base.addColorStop(1, '#173c25');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  let bs = v * 733 + 91;
  const rnd = () => {
    bs = (bs * 1103515245 + 12345) & 0x7fffffff;
    return bs / 0x7fffffff;
  };

  // Wavy horizontal variegation bands — the plant's signature look. Drawn as
  // chevrons rather than flat rectangles: on a real leaf the pale band dips
  // toward the base at the margins and peaks along the midline.
  const bandCount = 9 + Math.floor(rnd() * 4);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < bandCount; i++) {
    const by = (i + rnd() * 0.7) * (h / bandCount);
    const bh = h * (0.025 + rnd() * 0.035);
    const arch = h * (0.02 + rnd() * 0.03);
    const grad = ctx.createLinearGradient(0, by - bh, 0, by + bh);
    grad.addColorStop(0, 'rgba(126, 174, 96, 0)');
    grad.addColorStop(0.5, `rgba(150, 196, 110, ${0.3 + rnd() * 0.25})`);
    grad.addColorStop(1, 'rgba(126, 174, 96, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, by + arch - bh);
    ctx.quadraticCurveTo(w / 2, by - arch - bh, w, by + arch - bh);
    ctx.lineTo(w, by + arch + bh);
    ctx.quadraticCurveTo(w / 2, by - arch + bh, 0, by + arch + bh);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // "laurentii" variant: a cream edge stripe down both margins, fading out as
  // it approaches the tip the way the real cultivar's does.
  if (v === 1) {
    for (const edge of [0, 1]) {
      const stripe = ctx.createLinearGradient(0, h, 0, 0);
      stripe.addColorStop(0, 'rgba(232, 214, 138, 0.85)');
      stripe.addColorStop(0.75, 'rgba(232, 214, 138, 0.7)');
      stripe.addColorStop(1, 'rgba(232, 214, 138, 0)');
      ctx.fillStyle = stripe;
      ctx.fillRect(edge === 0 ? 0 : w - w * 0.09, 0, w * 0.09, h);
    }
  }

  // Fine lengthwise fibre striations — breaks up the flatness at close range.
  ctx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 26; i++) {
    const fx = rnd() * w;
    ctx.strokeStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},0.07)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx, 0);
    ctx.quadraticCurveTo(fx + (rnd() - 0.5) * 6, h / 2, fx, h);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  // The base of every blade is shaded — it sits down inside the rosette where
  // little light reaches — and the very tip of a snake plant dries to brown.
  const root = ctx.createLinearGradient(0, h, 0, h * 0.82);
  root.addColorStop(0, 'rgba(8, 24, 12, 0.45)');
  root.addColorStop(1, 'rgba(8, 24, 12, 0)');
  ctx.fillStyle = root;
  ctx.fillRect(0, h * 0.82, w, h * 0.18);

  const tip = ctx.createLinearGradient(0, 0, 0, h * 0.06);
  tip.addColorStop(0, 'rgba(150, 112, 62, 0.75)');
  tip.addColorStop(1, 'rgba(150, 112, 62, 0)');
  ctx.fillStyle = tip;
  ctx.fillRect(0, 0, w, h * 0.06);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(v, tex);
  return tex;
}

export const BLADE_VARIANTS = VARIANTS;
