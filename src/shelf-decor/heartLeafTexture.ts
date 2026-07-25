import * as THREE from 'three';

// String-of-hearts leaves are tiny on screen — a couple dozen pixels across —
// so the thing that has to survive is the silhouette (a squat, pointed heart)
// and the one feature the plant is named for: the silver marbling webbed
// between the veins over a dark green-purple ground. Each variant is drawn
// once into an offscreen canvas and shared by every strand on every shelf.
//
// The `under` variants exist because a real Ceropegia strand shows both faces
// at once — leaves twist as they hang — and the underside is a flat dusky
// purple with none of the silver. Rendering both from one DoubleSide material
// would make every leaf look identical front and back, which is exactly the
// paper-sticker read we're avoiding.
const cache = new Map<string, THREE.CanvasTexture>();
const VARIANTS = 4;

export function heartLeafTexture(variant = 0, under = false): THREE.CanvasTexture {
  const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
  const key = `${v}:${under}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  // Deterministic per-variant jitter — the marbling has to be stable across
  // mounts, and this texture is built outside any plant's rng.
  let bs = v * 7919 + 31;
  const rnd = () => {
    bs = (bs * 1103515245 + 12345) & 0x7fffffff;
    return bs / 0x7fffffff;
  };

  // Squat heart: two lobes at the top (+y in the texture = the base, where the
  // petiole attaches, matching the pothos leaf convention) drawing down to a
  // point. Ceropegia hearts are wider than they are long, unlike a pothos leaf.
  const lean = (v - 1.5) * 0.05;
  const cx = size * 0.5;
  const topY = size * 0.2;
  const tipY = size * 0.9;
  const halfW = size * (0.4 + lean * 0.3);
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.bezierCurveTo(cx - halfW * 1.02, size * 0.6, cx - halfW * 1.0, topY - size * 0.06, cx - halfW * 0.36, topY + size * 0.02);
    ctx.bezierCurveTo(cx - halfW * 0.16, topY + size * 0.06, cx - halfW * 0.06, topY + size * 0.13, cx, topY + size * 0.16);
    ctx.bezierCurveTo(cx + halfW * 0.06, topY + size * 0.13, cx + halfW * 0.16, topY + size * 0.06, cx + halfW * 0.36, topY + size * 0.02);
    ctx.bezierCurveTo(cx + halfW * 1.0, topY - size * 0.06, cx + halfW * 1.02, size * 0.6, cx, tipY);
    ctx.closePath();
  };

  ctx.save();
  outline();
  ctx.clip();

  const base = ctx.createLinearGradient(0, topY, 0, tipY);
  if (under) {
    base.addColorStop(0, '#6b3f5c');
    base.addColorStop(1, '#40243a');
  } else {
    base.addColorStop(0, '#2f4636');
    base.addColorStop(1, '#1c2c26');
  }
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  if (!under) {
    // The marbling reads as a web, not blobs: pale strokes radiating from the
    // midrib and breaking up, which is how the variegation actually sits
    // between the veins.
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const sy = topY + rnd() * (tipY - topY) * 0.9;
      const side = rnd() < 0.5 ? -1 : 1;
      const reach = halfW * (0.25 + rnd() * 0.7);
      ctx.strokeStyle = `rgba(196, 206, 196, ${0.16 + rnd() * 0.24})`;
      ctx.lineWidth = 1 + rnd() * 3.2;
      ctx.beginPath();
      ctx.moveTo(cx + side * halfW * 0.06, sy);
      ctx.quadraticCurveTo(
        cx + side * reach * 0.6, sy - size * (0.02 + rnd() * 0.08),
        cx + side * reach, sy - size * (0.04 + rnd() * 0.1),
      );
      ctx.stroke();
    }
    // A silver wash pooled around the base, where the marbling is densest.
    const sheen = ctx.createRadialGradient(cx, topY + size * 0.16, 0, cx, topY + size * 0.16, size * 0.36);
    sheen.addColorStop(0, 'rgba(198, 210, 198, 0.3)');
    sheen.addColorStop(1, 'rgba(198, 210, 198, 0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'source-over';

    // Purple bleeding in from the margin — the green face still shows the
    // underside's color at its thin edges.
    const edge = ctx.createRadialGradient(cx, size * 0.55, size * 0.16, cx, size * 0.55, size * 0.5);
    edge.addColorStop(0, 'rgba(90, 45, 78, 0)');
    edge.addColorStop(1, 'rgba(90, 45, 78, 0.55)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, size, size);
  } else {
    // Undersides get only the faintest midrib — no silver at all.
    ctx.strokeStyle = 'rgba(230, 210, 226, 0.18)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, topY + size * 0.14);
    ctx.lineTo(cx, tipY - 4);
    ctx.stroke();
  }
  ctx.restore();

  // A dark rim for form — at this scale it's most of what gives the leaf an
  // edge against the strand behind it.
  outline();
  ctx.strokeStyle = under ? 'rgba(30,12,26,0.5)' : 'rgba(12,22,16,0.5)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export const HEART_LEAF_VARIANTS = VARIANTS;
