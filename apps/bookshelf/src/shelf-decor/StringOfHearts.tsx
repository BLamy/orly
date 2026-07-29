import * as THREE from 'three';
import { heartLeafTexture } from './heartLeafTexture';
import { PlantCanvas, type Sway } from './PlantCanvas';
import { buildPot, POT_CLEAR_R, POT_CROWN_Y } from './pot';

// Per-strand tints. A Ceropegia planter is never one color: strands grown in
// brighter light go grey-silver and almost pink at the leaf margin, shaded
// ones stay deep green. Tinting the shared material costs one material per
// combination instead of a redraw of the texture.
const LEAF_TINTS = [0xffffff, 0xc9d6c4, 0xa9b9c8, 0xd8c2cf, 0x9fb08e];

const leafMatCache = new Map<string, THREE.MeshStandardMaterial>();
/** `under` picks the dusky-purple texture AND flips the material to BackSide,
 *  because each leaf is built as two single-sided meshes over one geometry —
 *  a DoubleSide material would show the silver face from below, which is the
 *  one thing a string of hearts never does. */
function leafMaterial(variant: number, tint: number, under: boolean): THREE.MeshStandardMaterial {
  const key = `${variant}:${tint}:${under}`;
  let mat = leafMatCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      map: heartLeafTexture(variant, under),
      color: new THREE.Color(under ? 0xffffff : LEAF_TINTS[tint % LEAF_TINTS.length]),
      transparent: true,
      alphaTest: 0.4,
      side: under ? THREE.BackSide : THREE.FrontSide,
      // Succulent leaves are thick and waxy rather than glossy-thin, so no
      // emissive backlight here (unlike the pothos) — just a low sheen.
      roughness: under ? 0.72 : 0.45,
      metalness: 0.02,
    });
    mat.userData.shared = true; // cached across instances — see PlantCanvas teardown
    leafMatCache.set(key, mat);
  }
  return mat;
}

const geoCache = new Map<string, THREE.BufferGeometry>();

/** A Ceropegia heart: a small, thick, keeled leaf. Unlike the pothos blade it
 *  folds along the midrib into a shallow V (these are succulents — the leaf is
 *  a fat wedge, not a sheet) and hooks slightly at the tip.
 *
 *  Local axes match the texture: +y is the base/lobes, -y the tip; the fold
 *  opens toward -z so the silver face is the +z one. */
function heartLeafGeometry(size: number, fold: number, hook: number): THREE.BufferGeometry {
  const q = (n: number) => Math.round(n * 24) / 24;
  const key = `heart:${q(size)}:${q(fold)}:${q(hook)}`;
  let geo = geoCache.get(key);
  if (geo) return geo;

  const w = size * 1.1; // hearts are wider than long
  const h = size;
  const g = new THREE.PlaneGeometry(w, h, 8, 8);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = x / w; // -0.5 .. 0.5
    const s = 0.5 - y / h; // 0 at the base, 1 at the tip

    // The keel: a V that is deepest at the base and closes toward the point,
    // which is what makes the leaf catch light on one half and shade the other
    // rather than taking a single flat shade.
    let z = -(0.5 - Math.abs(u)) * size * 0.34 * fold * (1 - 0.55 * s);
    // The whole leaf tilts back and the tip hooks under — a hanging heart
    // never lies in the plane it started in.
    z -= size * 0.3 * hook * s * s;
    // Slight lengthwise twist so no two edges stay parallel.
    z += u * s * size * 0.12;

    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  // Outlives any one plant instance — PlantCanvas's teardown must not dispose.
  g.userData.shared = true;
  geo = g;
  geoCache.set(key, geo);
  return geo;
}

const petioleMat = new THREE.MeshStandardMaterial({ color: 0x5d4a52, roughness: 0.8 });
petioleMat.userData.shared = true;

const tuberMat = new THREE.MeshStandardMaterial({ color: 0x6a5348, roughness: 0.95 });
tuberMat.userData.shared = true;

/** One heart on its own pivot: a very short petiole (these sit almost flush
 *  against the strand) plus front and back meshes sharing one geometry. */
function buildHeart(rng: () => number, size: number, tint: number): THREE.Group {
  const pivot = new THREE.Group();

  const stemLen = size * 0.3;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(size * 0.035, size * 0.05, stemLen, 4),
    petioleMat,
  );
  stem.position.y = stemLen / 2;
  pivot.add(stem);

  const variant = Math.floor(rng() * 4);
  const geo = heartLeafGeometry(size, 0.7 + rng() * 0.6, 0.6 + rng() * 0.8);
  const blade = new THREE.Mesh(geo, leafMaterial(variant, tint, false));
  const back = new THREE.Mesh(geo, leafMaterial(variant, tint, true));
  // Flipped like the pothos leaf: the texture's base meets the petiole's far
  // end and the tip continues outward along the pivot's +y.
  const roll = Math.PI + (rng() - 0.5) * 0.6;
  const yaw = (rng() - 0.5) * 1.4;
  for (const m of [blade, back]) {
    m.position.y = stemLen + size * 0.45;
    m.rotation.z = roll;
    m.rotation.y = yaw;
    pivot.add(m);
  }

  return pivot;
}

/** One trailing strand. It clears the pot the same way a pothos vine does —
 *  arcing up and over the rim before it's allowed to fall — but from there it
 *  behaves nothing like one: a string of hearts is essentially weightless
 *  thread, so it drops almost plumb, wanders only a few millimetres, and its
 *  leaves sit in opposite PAIRS at widely spaced nodes rather than alternating
 *  singly all the way along. That spacing is the whole look: mostly bare
 *  string with hearts punctuating it. */
function buildStrand(
  rng: () => number,
  drop: number,
  startR: number,
  tint: number,
  drift: number,
): Sway {
  const group = new THREE.Group();

  const overhang = POT_CLEAR_R - startR;
  const pts: THREE.Vector3[] = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.015, overhang * 0.4),
    new THREE.Vector3(0, 0.02, overhang * 0.75),
    new THREE.Vector3(0, 0, overhang),
  ];
  const base = pts[pts.length - 1].clone();

  const segs = 16;
  const wanderPhase = rng() * Math.PI * 2;
  const wander = 0.014 + rng() * 0.02;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    // Near-linear descent (not the pothos's quadratic swing-out) — thread this
    // fine hangs straight from the moment it leaves the rim.
    const y = base.y - drop * (0.55 * t + 0.45 * t * t);
    const x = drift * t * 1.6 + Math.sin(t * 5 + wanderPhase) * wander;
    const z = base.z - t * 0.03 + Math.cos(t * 4 + wanderPhase) * wander * 0.7;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  // Deliberately near the thinnest a tube can be and still antialias — a
  // visible stem is what made the first hanging plant read as chunky.
  const strandR = 0.0035 + rng() * 0.0018;
  const tubeGeo = new THREE.TubeGeometry(curve, 72, strandR, 4, false);
  const strandColor = new THREE.Color().setHSL(0.93 + rng() * 0.06, 0.2 + rng() * 0.18, 0.28 + rng() * 0.12);
  const tubeMat = new THREE.MeshStandardMaterial({ color: strandColor, roughness: 0.75 });
  group.add(new THREE.Mesh(tubeGeo, tubeMat));

  const UP = new THREE.Vector3(0, 1, 0);
  const nodes = 7 + Math.floor(rng() * 5);
  for (let i = 0; i < nodes; i++) {
    // Nodes start below the rim arc and run right to the tip; the last pair is
    // the strand's terminus, so no strand ends in bare thread.
    const t = 0.22 + (i / (nodes - 1)) * 0.78 + (rng() - 0.5) * 0.03;
    const p = curve.getPointAt(Math.min(1, Math.max(0, t)));
    // Each node's pair rotates a little from the last — a real strand spirals
    // its nodes rather than stacking them all in one plane.
    const spin = i * 1.1 + rng() * 0.5;
    // Hearts are held out almost horizontally, drooping only slightly; leaves
    // shrink toward the tip, which is the newest growth.
    const droop = -0.18 - rng() * 0.3;
    const size = (0.115 - t * 0.045) * (0.85 + rng() * 0.35);

    for (const side of [1, -1]) {
      const out = new THREE.Vector3(
        Math.sin(spin) * side,
        droop,
        Math.cos(spin) * side * 0.6,
      ).normalize();
      const heart = buildHeart(rng, size, tint);
      heart.position.copy(p);
      heart.quaternion.setFromUnitVectors(UP, out);
      heart.rotateY((rng() - 0.5) * 0.8);
      group.add(heart);
    }

    // Ceropegia grows aerial tubers at scattered nodes — small, pale, and
    // never on every one, which is why this is a low-probability draw.
    if (rng() < 0.18) {
      const tuber = new THREE.Mesh(new THREE.SphereGeometry(size * 0.34, 6, 5), tuberMat);
      tuber.position.copy(p);
      tuber.scale.y = 0.75;
      group.add(tuber);
    }
  }

  // Faster and looser than a pothos vine: less mass on the string means it
  // answers a breeze sooner.
  return { group, phase: rng() * Math.PI * 2, freq: 0.7 + rng() * 0.5, amp: 0.06 + rng() * 0.05 };
}

const cordMat = new THREE.MeshStandardMaterial({ color: 0xcbb994, roughness: 0.9 });
cordMat.userData.shared = true;
const knotMat = new THREE.MeshStandardMaterial({ color: 0x8a7452, roughness: 0.8 });
knotMat.userData.shared = true;

/** Cylinders, not THREE.Line — WebGL ignores `linewidth`, so a line renders
 *  one pixel wide regardless of scale and wouldn't read as a cord. */
function cordBetween(a: THREE.Vector3, b: THREE.Vector3, radius: number): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), 6), cordMat);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

function buildStringOfHearts(potGroup: THREE.Group, rng: () => number): Sway[] {
  buildPot(potGroup, rng);

  const apex = new THREE.Vector3(0, 0.58, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 5;
    potGroup.add(cordBetween(new THREE.Vector3(Math.sin(a) * 0.33, 0.2, Math.cos(a) * 0.33), apex, 0.011));
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), knotMat);
  knot.position.copy(apex);
  potGroup.add(knot);

  // Many more strands than the pothos gets vines — density is what sells this
  // plant, and each strand is thin enough that a dozen still reads as airy.
  const strandCount = 11 + Math.floor(rng() * 5);
  const sway: Sway[] = [];
  for (let i = 0; i < strandCount; i++) {
    // Biased to the front half so most strands are hero strands, with enough
    // jitter that they bunch unevenly instead of forming a tidy curtain.
    const angle = (i / (strandCount - 1) - 0.5) * Math.PI * 1.15 + (rng() - 0.5) * 0.4;
    // Widely varied lengths: this plant's silhouette is a ragged taper, a few
    // long strands well ahead of the rest.
    const drop = 0.5 + rng() * rng() * 1.0;
    const startR = 0.05 + rng() * 0.13;
    const drift = (0.01 + rng() * 0.05) * (i % 2 === 0 ? 1 : -1);
    const tint = Math.floor(rng() * LEAF_TINTS.length);
    const strand = buildStrand(rng, drop, startR, tint, drift);
    strand.group.position.set(Math.sin(angle) * startR, POT_CROWN_Y, Math.cos(angle) * startR);
    strand.group.rotation.y = angle;
    potGroup.add(strand.group);
    sway.push(strand);
  }

  // A low mound of hearts right at the soil line, so the strands don't appear
  // to sprout from nothing.
  const UP = new THREE.Vector3(0, 1, 0);
  const crown = 9 + Math.floor(rng() * 5);
  for (let i = 0; i < crown; i++) {
    const a = (i / crown) * Math.PI * 2 + rng() * 0.6;
    const out = new THREE.Vector3(Math.sin(a), 0.3 + rng() * 0.5, Math.cos(a)).normalize();
    const heart = buildHeart(rng, 0.1 + rng() * 0.04, rng() < 0.6 ? 0 : 4);
    heart.position.set(Math.sin(a) * 0.12, 0.22 + rng() * 0.04, Math.cos(a) * 0.12);
    heart.quaternion.setFromUnitVectors(UP, out);
    heart.rotateY(rng() * Math.PI * 2);
    potGroup.add(heart);
  }

  return sway;
}

/** A hanging string of hearts (Ceropegia woodii): a suspended planter with a
 *  dozen thread-thin strands falling nearly plumb, each strung with paired
 *  silver-marbled hearts and the odd aerial tuber. Sways on its own and
 *  catches a breeze when the page scrolls. Desktop shelf only — see
 *  DesktopShelf's placement logic in Library.tsx. */
export function StringOfHearts({ width, height, seed = 0 }: { width: number; height: number; seed?: number }) {
  // Hung high (and lifted off the board like the pothos) because everything
  // interesting about this plant happens below the pot.
  return (
    <PlantCanvas
      width={width}
      height={height}
      seed={seed}
      potY={0.4}
      lift={30}
      spread={0.55}
      build={buildStringOfHearts}
    />
  );
}
