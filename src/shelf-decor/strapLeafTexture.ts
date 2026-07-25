import * as THREE from 'three';

// Spider plant (Chlorophytum comosum) strap-leaf surface. Like bladeTexture
// this is a full-bleed surface, not a cutout — the leaf's silhouette comes
// from the mesh (see strapLeafGeometry in SpiderPlant.tsx), so there's no
// alpha channel to fringe. UVs run u = 0..1 across the strap and v = 0 at the
// base to v = 1 at the tip, so (three.js UVs being y-up) the base is the
// BOTTOM of this canvas.
//
// Variants are the two cultivars people actually own, plus the plain species:
//   0 'vittatum'   — cream stripe down the MIDDLE, green margins
//   1 'variegatum' — green middle, cream MARGINS
//   2 plain green  — all-green, for the odd unvariegated leaf in the clump
const cache = new Map<number, THREE.CanvasTexture>();
const VARIANTS = 3;

export function strapLeafTexture(variant = 0): THREE.CanvasTexture {
  const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
  const cached = cache.get(v);
  if (cached) return cached;

  const w = 64;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  let bs = v * 977 + 313;
  const rnd = () => {
    bs = (bs * 1103515245 + 12345) & 0x7fffffff;
    return bs / 0x7fffffff;
  };

  // Base green, darker at both margins so the leaf's own channel is reinforced
  // by the paint where the strap rolls away from the viewer.
  const base = ctx.createLinearGradient(0, 0, w, 0);
  base.addColorStop(0, '#2a5a2c');
  base.addColorStop(0.3, '#45873f');
  base.addColorStop(0.6, '#4e9448');
  base.addColorStop(1, '#2a5a2c');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // The variegation. Painted with soft-edged gradients rather than hard bands
  // because on a real leaf the cream bleeds into the green over a millimetre
  // or two; a crisp edge is what makes a striped leaf look printed.
  const cream = (a: number) => `rgba(240, 236, 190, ${a})`;
  if (v === 0) {
    const stripe = ctx.createLinearGradient(w * 0.26, 0, w * 0.74, 0);
    stripe.addColorStop(0, cream(0));
    stripe.addColorStop(0.22, cream(0.9));
    stripe.addColorStop(0.78, cream(0.9));
    stripe.addColorStop(1, cream(0));
    ctx.fillStyle = stripe;
    ctx.fillRect(w * 0.26, 0, w * 0.48, h);
  } else if (v === 1) {
    for (const edge of [0, 1]) {
      const x0 = edge === 0 ? 0 : w;
      const x1 = edge === 0 ? w * 0.3 : w * 0.7;
      const stripe = ctx.createLinearGradient(x0, 0, x1, 0);
      stripe.addColorStop(0, cream(0.92));
      stripe.addColorStop(1, cream(0));
      ctx.fillStyle = stripe;
      ctx.fillRect(Math.min(x0, x1), 0, w * 0.3, h);
    }
  }

  // Lengthwise fibre striations — a strap leaf is visibly ribbed, and at this
  // texel density that ribbing is most of what keeps it from reading as vinyl.
  ctx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 30; i++) {
    const fx = rnd() * w;
    ctx.strokeStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '0,0,0'},0.08)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx, 0);
    ctx.lineTo(fx + (rnd() - 0.5) * 3, h);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  // The base sits buried in the crowded centre of the rosette where almost no
  // light reaches, and the tip of a spider plant leaf reliably dries to a
  // brown point — the single most honest detail you can paint on one.
  const root = ctx.createLinearGradient(0, h, 0, h * 0.85);
  root.addColorStop(0, 'rgba(10, 26, 12, 0.5)');
  root.addColorStop(1, 'rgba(10, 26, 12, 0)');
  ctx.fillStyle = root;
  ctx.fillRect(0, h * 0.85, w, h * 0.15);

  const tip = ctx.createLinearGradient(0, 0, 0, h * 0.05);
  tip.addColorStop(0, 'rgba(126, 92, 54, 0.8)');
  tip.addColorStop(1, 'rgba(126, 92, 54, 0)');
  ctx.fillStyle = tip;
  ctx.fillRect(0, 0, w, h * 0.05);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(v, tex);
  return tex;
}

export const STRAP_VARIANTS = VARIANTS;
