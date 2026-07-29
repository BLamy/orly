import * as THREE from 'three';
import { leafTexture } from './leafTexture';
import { pothosLeafGeometry } from './leafGeometry';
import { PlantCanvas, type Sway } from './PlantCanvas';
import { buildPot, POT_CLEAR_R, POT_CROWN_Y, type PotStyle } from './pot';

// Per-vine foliage tints. A single leaf color across the whole plant is what
// made the first pass read as plastic: on a real pothos the older growth near
// the pot is deep and blue-green, the new growth at the trailing tips is
// yellow-green and much lighter, and a "marble queen"-ish vine is paler still.
// Tinting the shared leaf material (rather than redrawing the texture) gives
// that spread for the cost of a few extra materials.
const LEAF_TINTS = [0xffffff, 0xc8e08a, 0x8fbf72, 0xa8d6f0, 0xdfe9a8];

const leafMatCache = new Map<string, THREE.MeshStandardMaterial>();
function leafMaterial(variant: number, tint = 0): THREE.MeshStandardMaterial {
  const key = `${variant}:${tint}`;
  let mat = leafMatCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      map: leafTexture(variant),
      color: new THREE.Color(LEAF_TINTS[tint % LEAF_TINTS.length]),
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.32,
      metalness: 0.03,
      // Pothos leaves are thin enough to glow when backlit; a little
      // emissive keyed off the same map keeps the shaded side of a curled
      // leaf from going to flat black.
      emissive: new THREE.Color(0x0e2a12),
      emissiveMap: leafTexture(variant),
      emissiveIntensity: 0.35,
    });
    mat.userData.shared = true; // cached across instances — see PlantCanvas teardown
    leafMatCache.set(key, mat);
  }
  return mat;
}

const petioleMat = new THREE.MeshStandardMaterial({ color: 0x4a6b33, roughness: 0.85 });
petioleMat.userData.shared = true;

/** Builds one leaf on its own pivot group: the group sits where the leaf
 *  attaches to the vine, a short petiole runs from there out to the blade,
 *  and the blade itself is a curved, cupped, drooping mesh. Returning a pivot
 *  (rather than a bare mesh) is what lets the leaf be aimed by rotating,
 *  which keeps the petiole attached to the stem no matter how it's turned. */
function buildLeaf(rng: () => number, size: number, tint = 0): THREE.Group {
  const pivot = new THREE.Group();

  const stemLen = size * (0.3 + rng() * 0.15);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(size * 0.028, size * 0.045, stemLen, 5),
    petioleMat,
  );
  // The petiole runs along the pivot's +y, so the blade hangs off its far end.
  stem.position.y = stemLen / 2;
  stem.rotation.z = (rng() - 0.5) * 0.25;
  pivot.add(stem);

  const variant = Math.floor(rng() * 4);
  const blade = new THREE.Mesh(
    pothosLeafGeometry(size, 0.75 + rng() * 0.5, 0.7 + rng() * 0.6),
    leafMaterial(variant, tint),
  );
  // The leaf texture's base (its lobes) is at +y and its tip at -y, so the
  // blade is flipped: the lobes meet the petiole's far end and the tip
  // continues outward along the pivot's +y, the way a leaf extends away from
  // the stem it hangs off. Its droop is baked into the geometry (toward -z).
  blade.position.y = stemLen + size * 0.45;
  blade.rotation.z = Math.PI + (rng() - 0.5) * 0.5;
  blade.rotation.y = (rng() - 0.5) * 0.7;
  pivot.add(blade);

  return pivot;
}

/** A trailing vine that emerges from the soil near `startR` (small radius —
 *  where in the pot it's rooted), arcs UP AND OUTWARD to clear the pot's rim
 *  (the lead-in points), then drapes down the outside once past it. Building
 *  it this way — rather than just dropping straight down from somewhere near
 *  the rim — is what actually keeps it off the pot: the entire lead-in stays
 *  above the rim's height, where the pot is open (no solid cap), so there's
 *  nothing to clip regardless of horizontal position; only once it's past
 *  `overhang` (comfortably beyond the pot's own max radius) does it start
 *  actually falling. Returns the root group (pivoted at the soil point, so
 *  swaying it rotates the whole vine naturally from where it grows). */
function buildVine(
  rng: () => number,
  drop: number,
  hue: number,
  startR: number,
  tint: number,
  /** Sideways push applied over the whole fall, in the group's local x. Given
   *  opposite signs to neighbouring vines by the caller, this is what makes
   *  vines lean across one another and tangle on the way down instead of
   *  hanging as parallel strands. */
  drift: number,
): Sway {
  const group = new THREE.Group();

  // Local +z is "outward from the pot's center" once the group is rotated
  // by its angle (see the placement loop below) — overhang is how far in
  // that direction this vine needs to travel to clear the pot's max radius,
  // from wherever in the soil (startR) it happens to be rooted.
  const overhang = POT_CLEAR_R - startR;
  const pts: THREE.Vector3[] = [
    new THREE.Vector3(0, 0, 0), // emerges from the soil
    new THREE.Vector3(0, 0.02, overhang * 0.35), // rising, still well inside the rim height
    new THREE.Vector3(0, 0.03, overhang * 0.7), // apex — draped right over the rim lip
    new THREE.Vector3(0, 0.005, overhang), // just clear of the pot, starting to fall
  ];
  const base = pts[pts.length - 1].clone();

  // The fall itself. A vine is not a plumb line: it spirals slowly as it
  // descends (the stem twists as it grows), swings out and back, and drifts
  // laterally, so neighbouring vines wander in front of and behind each other
  // instead of hanging as evenly-spaced parallel strands.
  const segs = 14 + Math.floor(rng() * 6);
  const spin = (0.5 + rng() * 1.1) * (rng() < 0.5 ? 1 : -1); // turns over the whole drop
  const spinPhase = rng() * Math.PI * 2;
  const swirl = 0.05 + rng() * 0.07; // radius of that spiral
  const kink = 0.018 + rng() * 0.022; // small high-frequency crookedness
  const kinkPhase = rng() * Math.PI * 2;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const a = spinPhase + spin * t * Math.PI * 2;
    // The spiral is widest mid-fall and closes back up near the tip — a vine
    // swings away from the pot and then hangs back under its own weight.
    const r = swirl * Math.sin(t * Math.PI * 0.9) * (0.4 + t);
    const x = Math.sin(a) * r + drift * t * t + Math.sin(t * 9 + kinkPhase) * kink * t;
    // Slightly irregular descent, so segments aren't uniformly spaced and the
    // stem visibly slows where a heavy leaf hangs.
    const y = base.y - drop * (0.1 * t + 0.9 * t * t) + Math.sin(t * 6 + kinkPhase) * 0.012;
    // Kept biased outward (+z) so a swinging vine never cuts back through the
    // pot it's growing out of.
    const z = base.z + Math.abs(Math.cos(a)) * r * 0.5 + Math.cos(t * 7 + kinkPhase) * kink * 0.6 * t;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.009 + rng() * 0.004, 6, false);
  // Stems vary as much as the leaves do: some woody brown-green, some bright
  // fresh green, some deep and dark.
  const vineColor = new THREE.Color().setHSL(hue, 0.28 + rng() * 0.3, 0.2 + rng() * 0.16);
  const tubeMat = new THREE.MeshStandardMaterial({ color: vineColor, roughness: 0.8 });
  group.add(new THREE.Mesh(tubeGeo, tubeMat));

  // Denser, tapering leaves: bigger and more crowded near the pot, smaller
  // and sparser toward the trailing tip — how a real pothos vine reads.
  const leafCount = 9 + Math.floor(rng() * 5);
  const UP = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < leafCount; i++) {
    // capped at 0.9, not right up to the tip — the tip always gets its OWN
    // guaranteed terminal leaf below, so every vine visibly ends in a leaf
    // instead of sometimes petering out as bare tube.
    const t = Math.min(0.9, 0.06 + (i / leafCount) * 0.87 + (rng() - 0.5) * 0.05);
    const p = curve.getPointAt(t);
    const side = i % 2 === 0 ? 1 : -1;

    // Leaves attach alternately left and right and point outward-and-down:
    // mostly away from the vine, with enough downward component that gravity
    // reads. Aiming the pivot's +y along `out` carries the petiole and blade
    // together, so the stem always meets the vine.
    const out = new THREE.Vector3(
      side * (0.7 + rng() * 0.5),
      -0.35 - rng() * 0.5,
      side * 0.3 + (rng() - 0.5) * 0.8,
    ).normalize();
    const size = (0.26 - t * 0.13) * (0.85 + rng() * 0.3);

    const leaf = buildLeaf(rng, size, tint);
    leaf.position.copy(p);
    leaf.quaternion.setFromUnitVectors(UP, out);
    // Roll around the petiole so the blades don't all face the same way.
    leaf.rotateY((rng() - 0.5) * 1.2);
    group.add(leaf);
  }

  // The terminal leaf — every pothos vine ends in one, never bare tube. It
  // continues the vine's own direction rather than sticking out sideways.
  {
    const p = curve.getPointAt(1);
    const tangent = curve.getTangentAt(1).normalize();
    const out = tangent.clone().add(new THREE.Vector3((rng() - 0.5) * 0.5, -0.2, (rng() - 0.5) * 0.5)).normalize();
    const leaf = buildLeaf(rng, 0.14 + rng() * 0.05, tint);
    leaf.position.copy(p);
    leaf.quaternion.setFromUnitVectors(UP, out);
    leaf.rotateY(rng() * Math.PI * 2);
    group.add(leaf);
  }

  return { group, phase: rng() * Math.PI * 2, freq: 0.5 + rng() * 0.4, amp: 0.05 + rng() * 0.04 };
}

const cordMat = new THREE.MeshStandardMaterial({ color: 0xcbb994, roughness: 0.9 });
const knotMat = new THREE.MeshStandardMaterial({ color: 0x8a7452, roughness: 0.8 });

/** A thin cylinder connecting two points — used for the hanging-planter
 *  macrame cords, since a plain THREE.Line renders razor-thin regardless of
 *  `linewidth` in WebGL and wouldn't read as a cord at all. */
function cordBetween(a: THREE.Vector3, b: THREE.Vector3, radius: number): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 6), cordMat);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

function buildPothos(potGroup: THREE.Group, rng: () => number): Sway[] {
  // A suspended planter needs a shape the macrame could actually cradle, so
  // the pedestal-footed style is left to the plants that stand on the board.
  const hangable: PotStyle[] = ['tapered', 'cylinder', 'round', 'classic', 'urn'];
  buildPot(potGroup, {
    style: hangable[Math.floor(rng() * hangable.length)],
    color: Math.floor(rng() * 8),
    glossy: rng() < 0.45,
    rim: rng() < 0.6,
  });

  // A macrame-style hanger — three cords from the rim converging to a knot
  // well above the crown — makes this read as a suspended hanging planter
  // rather than a pot just sitting mid-air with nothing holding it up.
  const apex = new THREE.Vector3(0, 0.55, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const rimPoint = new THREE.Vector3(Math.sin(a) * 0.335, 0.2, Math.cos(a) * 0.335);
    potGroup.add(cordBetween(rimPoint, apex, 0.013));
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), knotMat);
  knot.position.copy(apex);
  potGroup.add(knot);

  // 3-5 vines, mostly hanging straight down with varied lengths (not a
  // symmetric fan — a couple long trailing ones plus shorter fuller ones
  // reads as an actual plant instead of evenly-spaced spider legs). Each is
  // rooted near the soil (small radius) and its OWN curve — not this
  // placement — is what arcs it up and over the rim before it falls; see
  // buildVine. Vines toward the back are naturally occluded by the pot
  // itself once past the soil, exactly like a real plant.
  const vineCount = 5 + Math.floor(rng() * 3);
  const sway: Sway[] = [];
  for (let i = 0; i < vineCount; i++) {
    // mostly front-facing angles (a bit of spread side to side), so most
    // vines are the clearly-visible "hero" ones and only a couple graze
    // the sides — not spread a full 360° around into the hidden back. The
    // extra jitter is deliberately large enough that two vines sometimes
    // start close together and grow into each other.
    const angle = vineCount === 1 ? 0 : (i / (vineCount - 1) - 0.5) * Math.PI * 0.95 + (rng() - 0.5) * 0.45;
    // Lengths spread widely — a couple of long trailing vines, some
    // mid-length, one or two short — rather than a tidy even curtain.
    const drop = 0.7 + rng() * rng() * 2.1;
    // Hue across the whole yellow-green → blue-green range, not a 0.07-wide
    // slice, so no two vines are the same green.
    const hue = 0.22 + rng() * 0.16;
    const startR = 0.04 + rng() * 0.14; // where in the soil this vine is rooted
    // Alternating lateral drift: each vine leans across its neighbour, which
    // is what produces the overlapping, caught-up-in-each-other look.
    const drift = (0.08 + rng() * 0.16) * (i % 2 === 0 ? 1 : -1);
    const tint = Math.floor(rng() * 5);
    const vine = buildVine(rng, drop, hue, startR, tint, drift);
    vine.group.position.set(Math.sin(angle) * startR, POT_CROWN_Y, Math.cos(angle) * startR);
    vine.group.rotation.y = angle;
    potGroup.add(vine.group);
    sway.push(vine);
  }

  // A few upright crown leaves right at the rim, so the plant has some
  // fullness at the top instead of vines starting from bare pot lip.
  const crownCount = 7 + Math.floor(rng() * 4);
  const UP = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < crownCount; i++) {
    const a = (i / crownCount) * Math.PI * 2 + rng() * 0.5;
    const size = 0.24 + rng() * 0.1;
    // Crown leaves push up and out over the rim on their petioles, with the
    // outer ones flopping further over than the inner ones.
    const lift = 0.85 - (i % 3) * 0.28;
    const out = new THREE.Vector3(Math.sin(a), lift, Math.cos(a)).normalize();
    // Crown growth is the oldest on the plant — biased toward the deeper,
    // less variegated tints rather than the bright new-growth ones.
    const leaf = buildLeaf(rng, size, rng() < 0.65 ? 0 : 2);
    leaf.position.set(Math.sin(a) * 0.13, 0.22 + rng() * 0.06, Math.cos(a) * 0.13);
    leaf.quaternion.setFromUnitVectors(UP, out);
    leaf.rotateY(rng() * Math.PI * 2);
    potGroup.add(leaf);
  }

  return sway;
}

/** A small potted pothos, three.js-rendered, sitting on a shelf board with a
 *  few vines trailing down over the edge. Sways gently on its own, and gets
 *  a brief extra "breeze" of sway whenever the page scrolls. Desktop shelf
 *  only — see DesktopShelf's placement logic in Library.tsx. */
export function Pothos({ width, height, seed = 0 }: { width: number; height: number; seed?: number }) {
  // Lower than the 0.55 default, freeing up headroom above the pot for the
  // macrame hanger's apex/knot to sit clearly above the crown leaves instead
  // of crowding right against them.
  // `lift` raises the whole canvas off the shelf board: this one is suspended
  // from its macrame hanger up near the row's rule, not standing on the board
  // the way the cactus and snake plant do.
  return (
    <PlantCanvas
      width={width}
      height={height}
      seed={seed}
      potY={0.4}
      lift={30}
      spread={0.72}
      build={buildPothos}
    />
  );
}
