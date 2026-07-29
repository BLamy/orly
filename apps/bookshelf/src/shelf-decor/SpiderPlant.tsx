import * as THREE from 'three';
import { PlantCanvas, type Sway } from './PlantCanvas';
import { buildPot, POT_CROWN_Y } from './pot';
import { strapLeafTexture, STRAP_VARIANTS } from './strapLeafTexture';

// ---------------------------------------------------------------------------
// Geometry
//
// A spider plant is read almost entirely from ONE shape: a long strap leaf
// that shoots up out of the crown, keeps turning as it goes, and ends up
// pointing back down below the pot. So the leaf is built along a curved
// centreline (a swept arc) rather than as a straight blade that gets bent by a
// vertex offset — at this much curvature a bent plane folds through itself,
// and the taper has to follow the arc to stay a strap.
// ---------------------------------------------------------------------------

const geoCache = new Map<string, THREE.BufferGeometry>();

type StrapOpts = {
  /** Total turn from vertical over the leaf's length, in radians. Past ~1.8
   *  the tip is below horizontal, which is what makes it "fountain". */
  arch?: number;
  /** How much of the cross-section rolls over toward the tip. */
  twist?: number;
  /** Depth of the lengthwise channel (a strap leaf is a shallow V, not flat). */
  curl?: number;
};

/** One arching strap leaf, anchored at the base (origin) and growing up into
 *  +y before curving over toward +z. Its silhouette is the mesh, so it takes a
 *  full-bleed texture with no alpha. */
function strapLeafGeometry(width: number, length: number, opts: StrapOpts = {}): THREE.BufferGeometry {
  const { arch = 2.1, twist = 0.5, curl = 1 } = opts;
  const q = (n: number) => Math.round(n * 40) / 40;
  const key = `strap:${q(width)}:${q(length)}:${q(arch)}:${q(twist)}:${q(curl)}`;
  const hit = geoCache.get(key);
  if (hit) return hit;

  const SEG = 34;
  const geo = new THREE.PlaneGeometry(1, 1, 6, SEG);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const curlAmt = width * 0.3 * curl;

  // The centreline, integrated once and sampled per vertex. The turn rate is
  // biased toward the outer half (v^1.5) so the leaf leaves the crown nearly
  // upright and does most of its falling out near the tip — a leaf that starts
  // curving immediately reads as wilted rather than arching.
  const theta = (v: number) => arch * Math.pow(v, 1.5);
  const cy: number[] = [0];
  const cz: number[] = [0];
  const ds = length / SEG;
  for (let i = 1; i <= SEG; i++) {
    const a = theta((i - 0.5) / SEG);
    cy.push(cy[i - 1] + Math.cos(a) * ds);
    cz.push(cz[i - 1] + Math.sin(a) * ds);
  }

  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5; // 0..1 across the strap
    const v = pos.getY(i) + 0.5; // 0 at the base, 1 at the tip
    const s = v * SEG;
    const i0 = Math.min(SEG - 1, Math.floor(s));
    const f = s - i0;
    const py = cy[i0] + (cy[i0 + 1] - cy[i0]) * f;
    const pz = cz[i0] + (cz[i0 + 1] - cz[i0]) * f;

    // Narrow sheath at the very base, widest in the lower third, then a long
    // even taper into a real point.
    const profile = Math.sqrt(Math.max(0, 1 - Math.pow(v, 4))) * (0.5 + 0.5 * Math.min(1, v / 0.22));

    const a = theta(v);
    // Frame on the centreline: tangent (0, cos a, sin a), in-plane normal
    // (0, -sin a, cos a), and the cross-section axis x.
    const roll = twist * v * v;
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    // Rolling the section about the tangent mixes those two axes, which is
    // what makes the tip show its edge the way a real strap does.
    const ny = -Math.sin(a);
    const nz = Math.cos(a);
    const ex = new THREE.Vector3(cr, sr * ny, sr * nz);
    const en = new THREE.Vector3(-sr, cr * ny, cr * nz);

    const across = (u - 0.5) * width * profile;
    const channel = curlAmt * (1 - 4 * (u - 0.5) * (u - 0.5)) * profile;
    pos.setXYZ(
      i,
      ex.x * across + en.x * channel,
      py + ex.y * across + en.y * channel,
      pz + ex.z * across + en.z * channel,
    );
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  // Cached across instances — see PlantCanvas's teardown.
  geo.userData.shared = true;
  geoCache.set(key, geo);
  return geo;
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

// Subtle per-leaf tints on top of the three painted cultivars: within one
// rosette the outer old leaves are deeper and bluer than the new growth in the
// centre, and a uniform green is what makes a clump read as one moulded object.
const LEAF_TINTS = [0xffffff, 0xd8e8b4, 0xa9c98e, 0xe6efc8];

const leafMatCache = new Map<string, THREE.MeshStandardMaterial>();
function leafMaterial(variant: number, tint: number): THREE.MeshStandardMaterial {
  const key = `${variant}:${tint}`;
  let mat = leafMatCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      map: strapLeafTexture(variant),
      color: new THREE.Color(LEAF_TINTS[tint % LEAF_TINTS.length]),
      side: THREE.DoubleSide,
      roughness: 0.45,
      metalness: 0.03,
      // Strap leaves are thin and translucent; without a little emissive the
      // undersides of the arch — which is most of what you see on a hanging
      // plant, lit from above — go to flat black.
      emissive: new THREE.Color(0x14301a),
      emissiveMap: strapLeafTexture(variant),
      emissiveIntensity: 0.32,
    });
    mat.userData.shared = true;
    leafMatCache.set(key, mat);
  }
  return mat;
}

const runnerMat = new THREE.MeshStandardMaterial({ color: 0x9aa845, roughness: 0.75 });
runnerMat.userData.shared = true;

const cordMat = new THREE.MeshStandardMaterial({ color: 0xcbb994, roughness: 0.9 });
cordMat.userData.shared = true;
const knotMat = new THREE.MeshStandardMaterial({ color: 0x8a7452, roughness: 0.8 });
knotMat.userData.shared = true;

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

/** A rosette of arching straps around a common crown. Used both for the plant
 *  itself and — at a fraction of the scale — for each baby plantlet, since a
 *  plantlet is literally a miniature of its parent. */
function buildRosette(
  rng: () => number,
  count: number,
  length: number,
  width: number,
  tint: number,
): THREE.Group {
  const rosette = new THREE.Group();
  // Golden-angle placement: evenly divided angles make a fan, phyllotaxis
  // makes the dense fountaining clump a spider plant actually grows.
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const a = i * GOLDEN + rng() * 0.3;
    const outer = i % 3 === 0; // the older, longer, harder-falling leaves
    const leaf = new THREE.Mesh(
      strapLeafGeometry(
        width * (0.8 + rng() * 0.4),
        length * (outer ? 1 : 0.72 + rng() * 0.3),
        {
          // Outer leaves have already fallen past horizontal; inner new growth
          // is still on its way up. Spreading the arch this way is what gives
          // the clump depth instead of a single shell of parallel leaves.
          arch: (outer ? 2.15 : 1.35) + rng() * 0.5,
          twist: (0.4 + rng() * 0.5) * (i % 2 === 0 ? 1 : -1),
          curl: 0.8 + rng() * 0.6,
        },
      ),
      leafMaterial(Math.floor(rng() * STRAP_VARIANTS), rng() < 0.6 ? tint : Math.floor(rng() * LEAF_TINTS.length)),
    );
    leaf.rotation.y = a;
    // A touch of sideways lean so no two leaves share a plane.
    leaf.rotation.z = (rng() - 0.5) * 0.2;
    rosette.add(leaf);
  }
  return rosette;
}

/** One runner: a long thin stem that arcs up out of the crown, clears the pot,
 *  then dangles far below it with a baby plantlet (and sometimes a second,
 *  smaller one further along) hanging off it. */
function buildRunner(rng: () => number, drop: number, tint: number): Sway {
  const group = new THREE.Group();

  // Local +z is "outward" once the caller rotates the group to its azimuth.
  // The runner rises before it falls — that little launch over the rim is what
  // distinguishes a runner from a leaf that simply flopped over the edge.
  const pts: THREE.Vector3[] = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.16 + rng() * 0.1, 0.16),
    new THREE.Vector3(0, 0.14, 0.4 + rng() * 0.1),
    new THREE.Vector3(0.02, -0.05, 0.5 + rng() * 0.08),
  ];
  const base = pts[pts.length - 1].clone();
  const segs = 10;
  const sag = (rng() - 0.5) * 0.12;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    pts.push(
      new THREE.Vector3(
        base.x + sag * t * t,
        base.y - drop * (0.15 * t + 0.85 * t * t),
        // Pulled back toward the pot's axis as it falls: a loaded runner hangs
        // under its own weight rather than continuing outward forever.
        base.z + Math.sin(t * Math.PI) * 0.06 - t * t * 0.22,
      ),
    );
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.008, 5, false), runnerMat));

  // The plantlets. The terminal one is always present and is the big one —
  // that dangling miniature is the whole reason the plant is called a spider
  // plant — and roughly half of the runners carry a smaller sibling upstream.
  const hang = (t: number, scale: number) => {
    const baby = buildRosette(rng, 6 + Math.floor(rng() * 4), 0.3, 0.05, tint);
    baby.scale.setScalar(scale);
    baby.position.copy(curve.getPointAt(t));
    baby.rotation.y = rng() * Math.PI * 2;
    // Tipped over so the little rosette hangs off the runner's underside
    // rather than sitting on top of it like a bowl.
    baby.rotation.x = Math.PI * (0.55 + rng() * 0.25);
    group.add(baby);
    // A stub of root nub where it grips the runner, which is what stops the
    // plantlet from looking impaled on the stem.
    const nub = new THREE.Mesh(new THREE.SphereGeometry(0.022 * scale * 3, 6, 5), runnerMat);
    nub.position.copy(baby.position);
    group.add(nub);
  };
  hang(1, 0.9 + rng() * 0.3);
  if (rng() < 0.5) hang(0.6 + rng() * 0.12, 0.5 + rng() * 0.2);

  // Runners are long and unsupported, so they swing further and slower than
  // the stiff leaves of the crown.
  return { group, phase: rng() * Math.PI * 2, freq: 0.34 + rng() * 0.22, amp: 0.05 + rng() * 0.04 };
}

/** A thin cylinder between two points — a plain THREE.Line renders razor-thin
 *  in WebGL regardless of `linewidth`, so it wouldn't read as a cord. */
function cordBetween(a: THREE.Vector3, b: THREE.Vector3, radius: number): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), 6), cordMat);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

function buildSpiderPlant(potGroup: THREE.Group, rng: () => number): Sway[] {
  buildPot(potGroup, rng);

  // Hung, not stood: without a visible hanger a pot floating mid-frame with
  // babies dangling under it just looks unsupported.
  const apex = new THREE.Vector3(0, 0.62, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 5;
    potGroup.add(cordBetween(new THREE.Vector3(Math.sin(a) * 0.32, 0.2, Math.cos(a) * 0.32), apex, 0.012));
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.033, 8, 8), knotMat);
  knot.position.copy(apex);
  potGroup.add(knot);

  const sway: Sway[] = [];

  // The crown. Built as several small rosettes offset around the soil rather
  // than one — a mature spider plant is a colony of crowded offsets, and the
  // slight vertical stagger is what fills the middle of the fountain in.
  const clumps = 3 + Math.floor(rng() * 2);
  const tint = Math.floor(rng() * LEAF_TINTS.length);
  for (let i = 0; i < clumps; i++) {
    const a = (i / clumps) * Math.PI * 2 + rng() * 0.6;
    const r = i === 0 ? 0 : 0.06 + rng() * 0.06;
    const clump = buildRosette(rng, 7 + Math.floor(rng() * 4), 0.66 + rng() * 0.22, 0.075 + rng() * 0.02, tint);
    clump.position.set(Math.sin(a) * r, POT_CROWN_Y - 0.01 + rng() * 0.03, Math.cos(a) * r);
    clump.rotation.y = rng() * Math.PI * 2;
    potGroup.add(clump);
    sway.push({ group: clump, phase: rng() * Math.PI * 2, freq: 0.45 + rng() * 0.25, amp: 0.014 + rng() * 0.012 });
  }

  // 2-3 runners, kept to front-facing azimuths so the babies hang where
  // they're visible instead of behind the pot.
  const runnerCount = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < runnerCount; i++) {
    const angle = (i / Math.max(1, runnerCount - 1) - 0.5) * Math.PI * 0.9 + (rng() - 0.5) * 0.4;
    const runner = buildRunner(rng, 0.55 + rng() * 0.45, tint);
    runner.group.position.set(Math.sin(angle) * 0.05, POT_CROWN_Y, Math.cos(angle) * 0.05);
    runner.group.rotation.y = angle;
    potGroup.add(runner.group);
    sway.push(runner);
  }

  return sway;
}

/** A hanging spider plant (Chlorophytum comosum) — a fountaining rosette of
 *  cream-striped strap leaves that arch out and fall back down, with runners
 *  dangling baby plantlets below the pot. Desktop shelf only — see
 *  DesktopShelf's placement logic in Library.tsx. */
export function SpiderPlant({ width, height, seed = 0 }: { width: number; height: number; seed?: number }) {
  // High potY plus `lift` off the shelf board: like the pothos this one is
  // suspended, and everything interesting about it happens BELOW the pot.
  return (
    <PlantCanvas
      width={width}
      height={height}
      seed={seed}
      potY={0.36}
      lift={30}
      spread={0.8}
      build={buildSpiderPlant}
    />
  );
}
