import * as THREE from 'three';
import { leafTexture } from './leafTexture';
import { PlantCanvas, type Sway } from './PlantCanvas';
import { buildPot, POT_CLEAR_R, POT_CROWN_Y } from './pot';

const leafMatCache = new Map<number, THREE.MeshStandardMaterial>();
function leafMaterial(variant: number): THREE.MeshStandardMaterial {
  let mat = leafMatCache.get(variant);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      map: leafTexture(variant),
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.38,
      metalness: 0.02,
    });
    leafMatCache.set(variant, mat);
  }
  return mat;
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
function buildVine(rng: () => number, drop: number, hue: number, startR: number): Sway {
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

  const segs = 7 + Math.floor(rng() * 3);
  const wobble = 0.06 + rng() * 0.05;
  const wobblePhase = rng() * Math.PI * 2;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    // Mostly a straight hang (gravity), with a gentle single S-wander — not
    // a wide side-to-side fan, which reads as spider legs.
    const x = Math.sin(t * Math.PI * 1.1 + wobblePhase) * wobble * t;
    const y = base.y - drop * (0.08 * t + 0.92 * t * t);
    const z = base.z + Math.cos(t * Math.PI * 0.8 + wobblePhase) * wobble * 0.5 * t;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.011 + rng() * 0.005, 6, false);
  const vineColor = new THREE.Color().setHSL(hue, 0.4, 0.24 + rng() * 0.07);
  const tubeMat = new THREE.MeshStandardMaterial({ color: vineColor, roughness: 0.8 });
  group.add(new THREE.Mesh(tubeGeo, tubeMat));

  // Denser, tapering leaves: bigger and more crowded near the pot, smaller
  // and sparser toward the trailing tip — how a real pothos vine reads.
  const leafCount = 6 + Math.floor(rng() * 4);
  const petiole = 0.03; // pushes the leaf off the tube surface, away from center
  for (let i = 0; i < leafCount; i++) {
    // capped at 0.9, not right up to the tip — the tip always gets its OWN
    // guaranteed terminal leaf below, so every vine visibly ends in a leaf
    // instead of sometimes petering out as bare tube.
    const t = Math.min(0.9, 0.08 + (i / leafCount) * 0.85 + rng() * 0.04);
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = i % 2 === 0 ? 1 : -1;
    const out = new THREE.Vector3(side, 0.15, side * 0.4 + (rng() - 0.5) * 0.6).normalize();
    const scale = (0.22 - t * 0.12) * (0.85 + rng() * 0.3);

    const variant = Math.floor(rng() * 4);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale * 1.05), leafMaterial(variant));
    leaf.position.copy(p).addScaledVector(out, petiole);
    leaf.lookAt(leaf.position.clone().add(out).add(tangent.clone().multiplyScalar(0.15)));
    leaf.rotateZ((rng() - 0.5) * 0.9 + side * 0.25);
    group.add(leaf);
  }

  // The terminal leaf — every pothos vine ends in one, never bare tube.
  {
    const p = curve.getPointAt(1);
    const tangent = curve.getTangentAt(1).normalize();
    const out = new THREE.Vector3((rng() - 0.5) * 0.6, 0.35, (rng() - 0.5) * 0.6).normalize();
    const scale = 0.13 + rng() * 0.05;
    const variant = Math.floor(rng() * 4);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale * 1.05), leafMaterial(variant));
    leaf.position.copy(p).addScaledVector(tangent, 0.025);
    leaf.lookAt(leaf.position.clone().add(out));
    leaf.rotateZ(rng() * Math.PI * 2);
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
  buildPot(potGroup);

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
  const vineCount = 3 + Math.floor(rng() * 3);
  const sway: Sway[] = [];
  for (let i = 0; i < vineCount; i++) {
    // mostly front-facing angles (a bit of spread side to side), so most
    // vines are the clearly-visible "hero" ones and only a couple graze
    // the sides — not spread a full 360° around into the hidden back.
    const angle = vineCount === 1 ? 0 : (i / (vineCount - 1) - 0.5) * Math.PI * 0.85 + (rng() - 0.5) * 0.2;
    const drop = 0.75 + rng() * 0.85;
    const hue = 0.3 + rng() * 0.07;
    const startR = 0.04 + rng() * 0.14; // where in the soil this vine is rooted
    const vine = buildVine(rng, drop, hue, startR);
    vine.group.position.set(Math.sin(angle) * startR, POT_CROWN_Y, Math.cos(angle) * startR);
    vine.group.rotation.y = angle;
    potGroup.add(vine.group);
    sway.push(vine);
  }

  // A few upright crown leaves right at the rim, so the plant has some
  // fullness at the top instead of vines starting from bare pot lip.
  const crownCount = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < crownCount; i++) {
    const a = (i / crownCount) * Math.PI * 2 + rng() * 0.5;
    const variant = Math.floor(rng() * 4);
    const scale = 0.22 + rng() * 0.09;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale * 1.05), leafMaterial(variant));
    leaf.position.set(Math.sin(a) * 0.16, 0.26 + rng() * 0.12, Math.cos(a) * 0.16);
    leaf.lookAt(leaf.position.clone().add(new THREE.Vector3(Math.sin(a), 0.5, Math.cos(a))));
    leaf.rotateZ(rng() * Math.PI * 2);
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
  return <PlantCanvas width={width} height={height} seed={seed} potY={0.4} build={buildPothos} />;
}
