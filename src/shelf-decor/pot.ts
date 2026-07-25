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
function potMaterial(color: number, glossy: boolean): THREE.MeshStandardMaterial {
  const key = `${color}:${glossy}`;
  let mat = potMatCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      roughness: glossy ? 0.35 : 0.78,
      metalness: glossy ? 0.06 : 0,
      side: THREE.DoubleSide,
    });
    mat.userData.shared = true;
    potMatCache.set(key, mat);
  }
  return mat;
}

const soilMat = new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 1 });
soilMat.userData.shared = true;

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
    new THREE.CylinderGeometry(mouthR * 0.9, mouthR * 0.9, 0.04, 22),
    soilMat,
  );
  soil.position.y = POT_RIM_Y - 0.02;
  potGroup.add(soil);
}
