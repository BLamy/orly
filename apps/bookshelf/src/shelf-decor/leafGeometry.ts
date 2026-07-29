import * as THREE from 'three';

/** Geometry for plant foliage. The first pass used bare `PlaneGeometry` for
 *  both pothos leaves and snake-plant blades, which is what made them read as
 *  paper cutouts: a flat quad has one constant normal, so it takes exactly one
 *  flat shade from the scene lights no matter how it's turned. Real foliage is
 *  curved — a pothos leaf cups around its midrib and droops toward the tip; a
 *  Sansevieria blade is a twisted, tapering trough — and that curvature is what
 *  produces the light-to-dark gradient across a single leaf that makes it read
 *  as a solid object. These builders bake that shape into subdivided meshes.
 *
 *  Geometries are cached by their (quantized) parameters, since a shelf mounts
 *  several plants and each plant has a dozen-plus leaves. */
const cache = new Map<string, THREE.BufferGeometry>();

function cached(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geo = cache.get(key);
  if (!geo) {
    geo = make();
    // Tells PlantCanvas's teardown not to dispose this — it outlives any one
    // plant instance and is handed to the next one that mounts.
    geo.userData.shared = true;
    cache.set(key, geo);
  }
  return geo;
}

/** A pothos leaf: a heart outline (from the alpha texture) on a surface that
 *  cups around its midrib and curls down toward the tip.
 *
 *  Local axes match the leaf texture: +y is the leaf's base/lobes, -y is the
 *  tip, and the sheet bows toward -z. The leaf's own droop lives here rather
 *  than in the placement code so that a leaf looks right at any orientation. */
export function pothosLeafGeometry(size: number, cup = 1, droop = 1): THREE.BufferGeometry {
  const q = (n: number) => Math.round(n * 20) / 20;
  return cached(`leaf:${q(size)}:${q(cup)}:${q(droop)}`, () => {
    const w = size;
    const h = size * 1.05;
    const geo = new THREE.PlaneGeometry(w, h, 10, 12);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const cupAmt = size * 0.3 * cup;
    const droopAmt = size * 0.42 * droop;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const u = x / w; // -0.5 .. 0.5 across the blade
      const s = 0.5 - y / h; // 0 at the base, 1 at the tip

      // Cross-section: a shallow V around the midrib, deepest mid-leaf and
      // flattening out at both the base and the tip (a leaf's channel opens
      // up as it reaches the point).
      const channel = Math.sin(Math.min(1, s * 1.15) * Math.PI) * cupAmt;
      let z = (4 * u * u - 0.35) * channel;

      // Lengthwise: nearly flat where the petiole holds it, then falling away
      // quadratically — the tip is where a pothos leaf visibly hangs.
      z -= droopAmt * s * s;

      // The tip itself curls a touch further, and the whole sheet gets a
      // faint asymmetric lift on one side so no two edges are parallel.
      z -= droopAmt * 0.35 * Math.pow(s, 6);
      z += u * s * size * 0.06;

      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  });
}

/** A snake-plant blade: a tapered, twisted, gently back-arching trough that
 *  comes to an actual point.
 *
 *  Unlike the pothos leaf this does NOT rely on an alpha cutout for its
 *  silhouette — the mesh itself is the shape. That removes the alpha fringe,
 *  lets the blade be lit as a solid, and means the paired crossed quad the
 *  old version used for "volume" isn't needed: the trough cross-section gives
 *  real thickness from every angle.
 *
 *  Anchored at the base (y = 0), growing to +y. */
export function snakeBladeGeometry(
  width: number,
  height: number,
  opts: { twist?: number; bend?: number; curl?: number } = {},
): THREE.BufferGeometry {
  const { twist = 0.5, bend = 0.12, curl = 1 } = opts;
  const q = (n: number) => Math.round(n * 50) / 50;
  return cached(`blade:${q(width)}:${q(height)}:${q(twist)}:${q(bend)}:${q(curl)}`, () => {
    const geo = new THREE.PlaneGeometry(1, 1, 8, 28);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const curlAmt = width * 0.34 * curl;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) + 0.5; // 0..1 across the blade
      const v = pos.getY(i) + 0.5; // 0 at the base, 1 at the tip

      // Width profile: narrow where it emerges from the soil, widest around
      // the lower third, then a long taper into a true point.
      const profile =
        Math.sqrt(Math.max(0, 1 - Math.pow(v, 3))) * (0.62 + 0.38 * Math.min(1, v / 0.28));

      let x = (u - 0.5) * width * profile;
      // Cross-section: a parabolic trough, shallow at the tip.
      let z = -curlAmt * (1 - 4 * (u - 0.5) * (u - 0.5)) * profile;

      // Twist around the blade's own axis, accumulating toward the tip — the
      // single most recognizable thing about a Sansevieria leaf.
      const a = twist * v * v;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const rx = x * ca - z * sa;
      z = x * sa + z * ca;
      x = rx;

      // A gentle backward arch so the blade isn't a ruler.
      z += bend * height * v * v;

      pos.setXYZ(i, x, v * height, z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  });
}
