/**
 * Walk cycles on twos with planted feet (style bible §4.5).
 *
 * A step is 16 frames at 24 fps = 8 drawings on twos; a cycle is two steps
 * (1.333 s at cadence 1). Feet roll heel → flat → toe; the ROOT x is derived
 * from the planted foot (the heel until the foot is flat, then the toe), so a
 * foot on the ground never slides. Vertical bob comes from auto-grounding.
 * Walk across frame in profile only — never toward camera.
 *
 *   walkPose(phase)                       -> Pose at cycle phase 0..1 (0 = near-heel strike)
 *   walkCycle(spec, { x0, facing, start, cadence?, scale? })(t)
 *        -> { x, pose, facing }   endless walk; x = feet x for draw opts (world)
 *   walkTo(spec, { x0, x1, at, cadence?, scale?, settle? })(t)
 *        -> { x, pose, facing, walking }  stand → whole steps → settle into 'stand'
 *   strideLength(spec, scale?)            -> stage px advanced per step
 */
import type { Facing, Pose, PuppetSpec } from '../../contracts';
import { quantizeTwos, TWOS_HZ } from '../../contracts';
import { bodyFor, shoeContacts } from './body';
import { blendPose, pose, POSES } from './poses';
import { DEG, mApply, mRotate, mTranslate, UNIT_H, type M } from './rig';
import { wardrobeFor } from './wardrobe';

export const WALK_CYCLE_SEC = 32 / 24;

type Keys = [number, number][];
/** periodic smooth interpolation through (phase, value) keys */
function cyc(keys: Keys, ph: number): number {
  const n = keys.length;
  const p = ((ph % 1) + 1) % 1;
  let i = 0;
  while (i < n - 1 && keys[i + 1][0] <= p) i++;
  const k0 = keys[(i - 1 + n) % n];
  const k1 = keys[i];
  const k2 = keys[(i + 1) % n];
  const k3 = keys[(i + 2) % n];
  const x1 = k1[0];
  const x2 = k2[0] <= x1 ? k2[0] + 1 : k2[0];
  const u = (p - x1) / (x2 - x1 || 1);
  // Catmull-Rom on values (keys are roughly evenly spaced)
  const [a, b, c, d] = [k0[1], k1[1], k2[1], k3[1]];
  const u2 = u * u;
  const u3 = u2 * u;
  return 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
}

// near leg, phase 0 = heel strike; the far leg runs half a cycle later
const HIP: Keys = [[0, 19], [0.12, 16], [0.3, 4], [0.5, -12], [0.6, -14], [0.7, -4], [0.82, 14], [0.92, 21]];
const KNEE: Keys = [[0, -3], [0.1, -13], [0.25, -6], [0.45, -6], [0.58, -28], [0.7, -50], [0.82, -34], [0.94, -6]];
/** foot angle to the ground, + = toes up */
const FOOT: Keys = [[0, 13], [0.08, 0], [0.42, 0], [0.52, -12], [0.6, -26], [0.7, -12], [0.84, 4], [0.95, 13]];
const ARM: Keys = [[0, -16], [0.25, -2], [0.5, 15], [0.75, 2]];

/** foot angle, exactly flat through mid-stance so the planted foot cannot creep */
function footAt(ph: number): number {
  const p = ((ph % 1) + 1) % 1;
  return p > 0.08 && p < 0.42 ? 0 : cyc(FOOT, p);
}

function legAt(phase: number) {
  const hip = cyc(HIP, phase);
  const knee = Math.min(0, cyc(KNEE, phase));
  const foot = footAt(phase);
  return { hip, knee, ankle: foot - hip - knee, foot };
}

export function walkPose(phase: number): Pose {
  const F = legAt(phase);
  const B = legAt(phase + 0.5);
  const armF = cyc(ARM, phase);
  const armB = cyc(ARM, phase + 0.5);
  const bob = Math.cos(phase * Math.PI * 4);
  return pose(
    {
      hipF: F.hip,
      kneeF: F.knee,
      ankleF: F.ankle,
      hipB: B.hip,
      kneeB: B.knee,
      ankleB: B.ankle,
      torso: 4 + bob * 0.6,
      neck: 7,
      head: -8 - bob * 0.8,
      shoulderF: armF,
      elbowF: 14 + Math.max(0, armF) * 0.7,
      wristF: 4,
      shoulderB: armB,
      elbowB: 14 + Math.max(0, armB) * 0.7,
      wristB: 4,
    },
    { handF: 'relaxed', handB: 'relaxed' },
  );
}

interface LegGeo {
  hip: [number, number];
  thigh: number;
  shin: number;
  heel: [number, number];
  toe: [number, number];
}

const geoCache = new Map<string, LegGeo>();
function legGeo(spec: PuppetSpec): LegGeo {
  const key = `${spec.build}|${spec.wardrobe}`;
  let g = geoCache.get(key);
  if (!g) {
    const wname = spec.wardrobe.replace(/:(f|m)$/, '');
    const w = wardrobeFor(wname);
    const fig = /:f$/.test(spec.wardrobe) ? 'f' : /:m$/.test(spec.wardrobe) ? 'm' : w.fig;
    const b = bodyFor(spec, fig);
    const c = shoeContacts(w.shoes);
    g = { hip: b.hipF, thigh: b.thigh, shin: b.shin, heel: c.heel, toe: c.toe };
    geoCache.set(key, g);
  }
  return g;
}

/** x (units, forward) of the planted reference point of a leg, relative to the root */
function refX(g: LegGeo, hip: number, knee: number, ankle: number, useToe: boolean): number {
  let m: M = [1, 0, 0, 1, g.hip[0], g.hip[1]];
  m = mRotate(m, -hip * DEG);
  m = mRotate(mTranslate(m, 0, g.thigh), -knee * DEG);
  m = mRotate(mTranslate(m, 0, g.shin), -ankle * DEG);
  const q = useToe ? g.toe : g.heel;
  return mApply(m, q[0], q[1]).x;
}

/** root x offset within one step (units) for the stance leg at step-local phase s ∈ [0, 0.5) */
function stepGeom(g: LegGeo) {
  // heel strike of the stance leg at s = 0: heel world x = 0 → root = −heelRel
  const at = (s: number) => {
    const L = legAt(s);
    // heel rocker until the foot is flat, then the toe (both agree while flat)
    const heelRef = s < 0.08 || L.foot > 0;
    const rel = refX(g, L.hip, L.knee, L.ankle, !heelRef);
    // when on the toe, the toe sits footLen ahead of the original heel spot
    const footLen = g.toe[0] - g.heel[0];
    return (heelRef ? 0 : footLen) - rel;
  };
  const start = at(0);
  const end = at(0.4999);
  return { at, start, stride: end - start };
}

const stepCache = new Map<string, ReturnType<typeof stepGeom>>();
function geom(spec: PuppetSpec) {
  const key = `${spec.build}|${spec.wardrobe}`;
  let s = stepCache.get(key);
  if (!s) {
    s = stepGeom(legGeo(spec));
    stepCache.set(key, s);
  }
  return s;
}

export function strideLength(spec: PuppetSpec, scale = 1): number {
  return geom(spec).stride * (spec.height / UNIT_H) * scale;
}

export interface WalkSample {
  x: number;
  pose: Pose & { prev?: Pose; drift?: number };
  facing: Facing;
}

/** Endless walk from x0 at time `start`. */
export function walkCycle(spec: PuppetSpec, o: { x0: number; facing: Facing; start?: number; cadence?: number; scale?: number }): (t: number) => WalkSample {
  const G = geom(spec);
  const k = (spec.height / UNIT_H) * (o.scale ?? 1);
  const sg = o.facing === 'left' ? -1 : 1;
  const cad = o.cadence ?? 1;
  const T = WALK_CYCLE_SEC / cad;
  const sample = (tq: number) => {
    const ph = Math.max(0, (tq - (o.start ?? 0)) / T);
    const n = Math.floor(ph * 2);
    const s = ph * 2 - n; // 0..1 within the step
    const local = G.at(s * 0.5) - G.start;
    const ux = n * G.stride + local;
    // the far leg leads on odd steps: the same geometry, mirrored in phase
    const p = walkPose(n % 2 === 0 ? s * 0.5 : 0.5 + s * 0.5);
    return { x: o.x0 + sg * ux * k, p };
  };
  return (t: number) => {
    const tq = quantizeTwos(t);
    const a = sample(tq);
    const b = sample(tq - 1 / TWOS_HZ);
    const drift = Math.abs(a.x - b.x) * TWOS_HZ;
    return { x: a.x, pose: { ...a.p, prev: b.p, drift }, facing: o.facing };
  };
}

/** Stand at x0, walk whole steps toward x1 from `at`, then settle into a stand. */
export function walkTo(
  spec: PuppetSpec,
  o: { x0: number; x1: number; at: number; cadence?: number; scale?: number; settle?: number; end?: Pose },
): (t: number) => WalkSample & { walking: boolean; arrive: number } {
  const facing: Facing = o.x1 >= o.x0 ? 'right' : 'left';
  const stride = strideLength(spec, o.scale);
  const steps = Math.max(1, Math.round(Math.abs(o.x1 - o.x0) / stride));
  const cad = o.cadence ?? 1;
  const stepT = WALK_CYCLE_SEC / cad / 2;
  const arrive = o.at + steps * stepT;
  const cyc = walkCycle(spec, { x0: o.x0, facing, start: o.at, cadence: cad, scale: o.scale });
  const endX = cyc(arrive).x;
  const settle = o.settle ?? 0.34;
  const endPose = o.end ?? POSES.stand;
  const contact = walkPose(0);
  return (t: number) => {
    const tq = quantizeTwos(t);
    if (tq < o.at) return { x: o.x0, pose: POSES.stand, facing, walking: false, arrive };
    if (tq < arrive) return { ...cyc(t), walking: true, arrive };
    const u = Math.min(1, (tq - arrive) / settle);
    const e = u * u * (3 - 2 * u);
    const prevU = Math.max(0, Math.min(1, (tq - 1 / TWOS_HZ - arrive) / settle));
    return {
      x: endX,
      pose: { ...blendPose(contact, endPose, e), prev: blendPose(contact, endPose, prevU * prevU * (3 - 2 * prevU)) },
      facing,
      walking: false,
      arrive,
    };
  };
}
