import * as THREE from 'three';
import { monsteraLeafTexture, MONSTERA_LEAF_VARIANTS } from './monsteraLeafTexture';
import { PlantCanvas, type Sway } from './PlantCanvas';
import { buildPot, POT_CROWN_Y } from './pot';

// Newer growth up top is a lighter, yellower green than the oldest leaves near
// the soil; tinting the shared material is cheaper than redrawing the texture.
const LEAF_TINTS = [0xffffff, 0xd7ecab, 0xa9cf88];

const leafMatCache = new Map<string, THREE.MeshStandardMaterial>();
function leafMaterial(variant: number, tint: number): THREE.MeshStandardMaterial {
  const key = `${variant}:${tint}`;
  let mat = leafMatCache.get(key);
  if (!mat) {
    const map = monsteraLeafTexture(variant);
    mat = new THREE.MeshStandardMaterial({
      map,
      color: new THREE.Color(LEAF_TINTS[tint % LEAF_TINTS.length]),
      transparent: true,
      // The splits and holes are alpha in the map, so this threshold is what
      // actually carves the fenestrations out of the blade.
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.22, // monstera leaves are conspicuously glossy
      metalness: 0.04,
      emissive: new THREE.Color(0x0b2412),
      emissiveMap: map,
      emissiveIntensity: 0.3,
    });
    mat.userData.shared = true; // cached across instances — see PlantCanvas teardown
    leafMatCache.set(key, mat);
  }
  return mat;
}

const petioleMat = new THREE.MeshStandardMaterial({ color: 0x59783a, roughness: 0.7 });
petioleMat.userData.shared = true;

const geoCache = new Map<string, THREE.BufferGeometry>();

/** A monstera blade: base at y = 0 growing to +y (matching the texture, whose
 *  petiole end is at v = 0), cupped around the midrib and tilting back toward
 *  -z under its own weight. Mature monstera leaves are held much flatter than
 *  a pothos leaf's droop — the cup is the dominant curve here, not the fall. */
function monsteraLeafGeometry(size: number, cup: number, sag: number): THREE.BufferGeometry {
  const q = (n: number) => Math.round(n * 20) / 20;
  const key = `mleaf:${q(size)}:${q(cup)}:${q(sag)}`;
  let geo = geoCache.get(key);
  if (geo) return geo;

  const w = size * 0.92;
  const h = size;
  // Densely subdivided because the alpha cutouts mean the silhouette follows
  // the texture, but the *shading* still has to vary across each surviving rib.
  const g = new THREE.PlaneGeometry(w, h, 16, 18);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const cupAmt = size * 0.26 * cup;
  const sagAmt = size * 0.2 * sag;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const u = x / w; // -0.5 .. 0.5 across the blade
    const t = pos.getY(i) / h + 0.5; // 0 at the petiole, 1 at the tip

    // Cross-section: a shallow channel that opens out toward the tip, deepest
    // where the leaf is widest.
    const channel = Math.sin(Math.min(1, t * 1.3) * Math.PI) * cupAmt;
    let z = (4 * u * u - 0.3) * channel;
    // Lengthwise the blade tips back gently, then a little more at the point.
    z -= sagAmt * t * t + sagAmt * 0.3 * Math.pow(t, 6);
    // A faint twist so no two edges of the leaf are parallel.
    z += u * t * size * 0.07;

    pos.setXYZ(i, x, t * h, z);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.userData.shared = true; // cached across instances — see PlantCanvas teardown
  geoCache.set(key, g);
  geo = g;
  return geo;
}

/** One leaf on its own pivot: a thick petiole arcs up from the soil and the
 *  blade sits on its far end. Pivoting at the soil (rather than placing a bare
 *  mesh) means the sway rotates petiole and blade together, the way a stalk
 *  actually moves. */
function buildStalk(rng: () => number, leafSize: number, lean: number, height: number, tint: number): THREE.Group {
  const pivot = new THREE.Group();

  // Monstera petioles are stiff and sheathed — thick at the base, barely
  // tapering, and they arc outward rather than flopping.
  const pts: THREE.Vector3[] = [];
  const segs = 8;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    pts.push(new THREE.Vector3(0, height * t, height * lean * t * t));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 20, leafSize * 0.05, 6, false),
    petioleMat,
  );
  pivot.add(stem); // per-stalk tube geometry, deliberately not shared

  const tip = curve.getPointAt(1);
  const dir = curve.getTangentAt(1).normalize();
  const blade = new THREE.Mesh(
    monsteraLeafGeometry(leafSize, 0.8 + rng() * 0.5, 0.7 + rng() * 0.7),
    leafMaterial(Math.floor(rng() * MONSTERA_LEAF_VARIANTS), tint),
  );
  blade.position.copy(tip);
  // The blade continues the petiole's direction, then flops a bit further over
  // than the stalk itself — the join has to stay hidden at the petiole's end.
  const aim = dir.clone().add(new THREE.Vector3((rng() - 0.5) * 0.5, -0.25 - rng() * 0.3, 0.15)).normalize();
  blade.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), aim);
  blade.rotateY((rng() - 0.5) * 0.7);
  pivot.add(blade);

  return pivot;
}

function buildMonstera(potGroup: THREE.Group, rng: () => number): Sway[] {
  buildPot(potGroup, rng);

  // A young plant: a handful of stalks, not a jungle. They fan mostly toward
  // the viewer so the fenestrations are actually face-on and readable rather
  // than seen edge-wise from behind.
  const count = 4 + Math.floor(rng() * 4);
  const sway: Sway[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count - 0.5) * Math.PI * 1.5 + (rng() - 0.5) * 0.4;
    const r = 0.05 + rng() * 0.1;
    // Tallest stalks in the middle of the fan, shortest at the outside — the
    // newest leaf on a monstera comes up through the center.
    const centered = 1 - Math.abs(i / (count - 1) - 0.5) * 2;
    const height = 0.34 + centered * 0.3 + rng() * 0.12;
    const stalk = buildStalk(rng, 0.3 + centered * 0.14 + rng() * 0.07, 0.35 + rng() * 0.4, height, i < 2 ? 0 : Math.floor(rng() * 3));
    stalk.position.set(Math.sin(a) * r, POT_CROWN_Y, Math.cos(a) * r);
    stalk.rotation.y = a;
    potGroup.add(stalk);
    sway.push({ group: stalk, phase: rng() * Math.PI * 2, freq: 0.35 + rng() * 0.3, amp: 0.028 + rng() * 0.02 });
  }

  return sway;
}

/** A small potted monstera deliciosa — a few stiff petioles holding big split,
 *  hole-punched glossy leaves — three.js-rendered, standing on the shelf board.
 *  Desktop shelf only, see DesktopShelf's placement logic in Library.tsx. */
export function Monstera({ width, height, seed = 0 }: { width: number; height: number; seed?: number }) {
  // potY = -0.78 puts the pot's bottom at the bottom of the frustum, so it
  // stands on the board like the cactus and snake plant (see Cactus.tsx).
  // The wide fan of leaves needs a larger spread than an upright blade plant.
  return (
    <PlantCanvas width={width} height={height} seed={seed} potY={-0.78} spread={0.75} build={buildMonstera} />
  );
}
