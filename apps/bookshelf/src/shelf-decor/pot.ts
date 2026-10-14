import * as THREE from 'three';

export const POT_TOP_R = 0.34;
export const POT_RIM_Y = 0.2;
export const POT_SOIL_R = 0.29;
/** Anything rooted "at the soil" should clear this radius before it's safe
 *  to start falling/leaning — see Pothos.tsx's buildVine for why: it's not
 *  just past the decorative rim ring, it's past the pot's own max radius. */
export const POT_CLEAR_R = 0.42;
export const POT_CROWN_Y = 0.22; // just above the soil — where stems/blades start

/** The pot silhouettes a shelf can grow. Each is a lathe profile given as
 *  (radius, y) pairs from the base up to the rim — never closed over the top,
 *  because every plant relies on the pot being open: a stem rooted at the soil
 *  and drawn above POT_RIM_Y can't clip geometry that isn't there. */
export type PotStyle = 'tapered' | 'cylinder' | 'round' | 'classic' | 'footed' | 'urn';

export const POT_STYLES: PotStyle[] = ['tapered', 'cylinder', 'round', 'classic', 'footed', 'urn'];

/** Glaze/clay colors. Terracotta first — it's still the shelf's default look —
 *  then a spread of the muted ceramics you'd actually find on a bookshelf. */
const POT_COLORS: { body: number; rim: number }[] = [
  { body: 0xa8582f, rim: 0xc06a3a }, // terracotta
  { body: 0x8d4a2a, rim: 0xa85c36 }, // dark terracotta
  { body: 0x3c4a44, rim: 0x4c5c55 }, // charcoal green-grey
  { body: 0xd8cdba, rim: 0xe8dfd0 }, // cream stoneware
  { body: 0x6f7f63, rim: 0x839376 }, // sage
  { body: 0x4a5c72, rim: 0x5c7089 }, // muted slate blue
  { body: 0x9a6b52, rim: 0xb07e62 }, // clay pink
  { body: 0x2f2a2a, rim: 0x413a3a }, // near-black matte
];

/** (radius, y) profiles, bottom → rim. All end at POT_RIM_Y. */
function profile(style: PotStyle): THREE.Vector2[] {
  const v = (r: number, y: number) => new THREE.Vector2(r, y);
  switch (style) {
    case 'cylinder':
      // Straight-sided planter — modern, no taper at all.
      return [v(0.001, -0.2), v(0.3, -0.2), v(0.3, -0.19), v(0.31, 0.05), v(0.31, POT_RIM_Y)];
    case 'round':
      // A bowl: belly out at the middle, drawn back in at the mouth.
      return [
        v(0.001, -0.22), v(0.14, -0.225), v(0.26, -0.16), v(0.33, -0.04),
        v(0.335, 0.06), v(0.31, 0.15), v(0.295, POT_RIM_Y),
      ];
    case 'classic':
      // The archetypal flowerpot: taper, then a pronounced collar at the top.
      return [
        v(0.001, -0.2), v(0.23, -0.2), v(0.24, -0.19), v(0.31, 0.11),
        v(0.315, 0.13), v(0.345, 0.15), v(0.345, POT_RIM_Y),
      ];
    case 'footed':
      // Cylinder lifted on a small pedestal foot.
      return [
        v(0.001, -0.26), v(0.17, -0.26), v(0.17, -0.235), v(0.13, -0.21),
        v(0.28, -0.16), v(0.29, 0.02), v(0.3, POT_RIM_Y),
      ];
    case 'urn':
      // Narrow waist opening to a wide mouth — the fussiest of the set.
      return [
        v(0.001, -0.22), v(0.18, -0.22), v(0.22, -0.17), v(0.19, -0.06),
        v(0.24, 0.05), v(0.32, 0.15), v(0.335, POT_RIM_Y),
      ];
    case 'tapered':
    default:
      // The original shelf pot: a simple truncated cone.
      return [v(0.001, -0.2), v(0.25, -0.2), v(0.26, -0.19), v(POT_TOP_R, POT_RIM_Y)];
  }
}

// One material per (color, kind) — pots are the most-repeated geometry on the
// shelf, so sharing here matters. userData.shared keeps PlantCanvas's teardown
// from disposing them out from under the other live plants.
const potMatCache = new Map<string, THREE.MeshStandardMaterial>();

/** Deterministic noise for the shared textures below (they're cached forever,
 *  so they can't take a plant's rng). */
function noise(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

let potSkin: THREE.CanvasTexture | null = null;
/** A grey "skin" multiplied over every pot colour: fired-clay mottling, faint
 *  throwing rings, and a darkening toward the foot where the pot sits in its
 *  own shade. v runs bottom → rim along the lathe, u around. Without it a pot
 *  is one flat shade of paint, which is most of what read as plastic. */
function potSkinTexture(): THREE.CanvasTexture {
  if (potSkin) return potSkin;
  const w = 128;
  const h = 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const rnd = noise(4242);
  // canvas y runs top → bottom; v = 1 - y/h, so the rim is at y = 0
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#e9e9e9');
  grad.addColorStop(1, '#8c8c8c');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  // throwing rings
  for (let y = 0; y < h; y += 3) {
    g.fillStyle = `rgba(0,0,0,${0.02 + rnd() * 0.04})`;
    g.fillRect(0, y, w, 1);
  }
  // clay mottling: soft blotches that wrap (draw twice, offset by w)
  for (let i = 0; i < 90; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 4 + rnd() * 14;
    const dark = rnd() < 0.55;
    for (const dx of [0, -w]) {
      const rg = g.createRadialGradient(x + dx, y, 0, x + dx, y, r);
      rg.addColorStop(0, dark ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(x + dx - r, y - r, r * 2, r * 2);
    }
  }
  // fine grain
  const img = g.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 22;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  potSkin = new THREE.CanvasTexture(c);
  potSkin.wrapS = THREE.RepeatWrapping;
  potSkin.colorSpace = THREE.SRGBColorSpace;
  return potSkin;
}

function potMaterial(color: number, glossy: boolean): THREE.MeshStandardMaterial {
  const key = `${color}:${glossy}`;
  let mat = potMatCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      map: potSkinTexture(),
      // Matte ceramic and raw clay barely shine; glazed ones get a broad,
      // low-contrast sheen rather than a hot spot.
      roughness: glossy ? 0.4 : 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    mat.userData.shared = true;
    potMatCache.set(key, mat);
  }
  return mat;
}

let soilTex: THREE.CanvasTexture | null = null;
/** Potting mix seen from above: dark crumb with lighter flecks (perlite, bark)
 *  — a flat dark disc is the single giveaway of a toy plant once the camera
 *  looks down into the pot. */
function soilTexture(): THREE.CanvasTexture {
  if (soilTex) return soilTex;
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d')!;
  const rnd = noise(77);
  g.fillStyle = '#2b1f16';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 700; i++) {
    const x = rnd() * s;
    const y = rnd() * s;
    const r = 0.8 + rnd() * 2.4;
    const v = rnd();
    g.fillStyle = v < 0.6 ? `rgba(12,8,5,${0.35 + rnd() * 0.4})` : v < 0.9 ? `rgba(92,68,46,${0.25 + rnd() * 0.35})` : `rgba(205,196,176,${0.4 + rnd() * 0.4})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  soilTex = new THREE.CanvasTexture(c);
  soilTex.colorSpace = THREE.SRGBColorSpace;
  return soilTex;
}

let soilMatShared: THREE.MeshStandardMaterial | null = null;
function soilMaterial(): THREE.MeshStandardMaterial {
  if (!soilMatShared) {
    soilMatShared = new THREE.MeshStandardMaterial({ map: soilTexture(), roughness: 1 });
    soilMatShared.userData.shared = true;
  }
  return soilMatShared;
}

export type PotOptions = {
  style?: PotStyle;
  /** Index into the glaze palette; wraps. */
  color?: number;
  /** Glazed ceramic reads shinier than raw terracotta. */
  glossy?: boolean;
  /** A raised rim ring. Off for the styles whose profile already flares. */
  rim?: boolean;
};

/** The pot a shelf plant sits in. Called with just the group it keeps the
 *  original terracotta tapered pot; pass an `rng` (or explicit options) to get
 *  one of the shelf's other shapes and glazes instead. */
export function buildPot(potGroup: THREE.Group, opts: PotOptions | (() => number) = {}): void {
  let o: PotOptions;
  if (typeof opts === 'function') {
    const rng = opts;
    const style = POT_STYLES[Math.floor(rng() * POT_STYLES.length)];
    o = {
      style,
      color: Math.floor(rng() * POT_COLORS.length),
      glossy: rng() < 0.45,
      // 'classic' and 'round' already have their shape at the mouth; adding a
      // torus on top of those just reads as a lip on a lip.
      rim: style !== 'classic' && style !== 'round' && rng() < 0.8,
    };
  } else {
    o = opts;
  }

  const style = o.style ?? 'tapered';
  const { body, rim: rimColor } = POT_COLORS[(o.color ?? 0) % POT_COLORS.length];
  const glossy = o.glossy ?? false;

  const wall = new THREE.Mesh(
    new THREE.LatheGeometry(profile(style), 24),
    potMaterial(body, glossy),
  );
  potGroup.add(wall);

  if (o.rim ?? style === 'tapered') {
    const pts = profile(style);
    const mouthR = pts[pts.length - 1].x;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(mouthR - 0.005, 0.018, 8, 22),
      potMaterial(rimColor, glossy),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = POT_RIM_Y;
    potGroup.add(ring);
  }

  // Soil, sunk just below the mouth and sized to whatever this profile's
  // mouth actually is, so a narrow-mouthed pot doesn't show a disc of dirt
  // hanging outside its own walls.
  const pts = profile(style);
  const mouthR = pts[pts.length - 1].x;
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(mouthR * 0.93, mouthR * 0.93, 0.04, 22),
    soilMaterial(),
  );
  soil.position.y = POT_RIM_Y - 0.02;
  potGroup.add(soil);

  // How far below the pot's origin its foot is — PlantCanvas stands this on
  // the shelf board (the footed style sits lower than the rest).
  potGroup.userData.baseY = pts[0].y;
}
