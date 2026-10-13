/**
 * Gesture vocabulary + pose keying (style bible §4.5). Pose to pose, eased,
 * HELD (≥ 0.5 s), sampled on twos.
 *
 *   POSES[g]                 g ∈ stand · rest (weight back, knee eased) · clasp (hands behind) · present · point · write · think · doubt · dissent ·
 *                            triumph · despair · authority · lean · sit · type · listen · walkStand
 *   pose(angles, hands?)     build a Pose; unspecified ankles keep the feet flat
 *   blendPose(a, b, u)       joint-wise lerp; hands swap at u = 0.5 (a sprite swap, never a morph)
 *   addPose(base, delta)     additive offsets (talk beats, breathing)
 *   loopPose(g, base, tq)    the cyclic gestures: 'write' (3-drawing chalk loop), 'type'
 *
 *   const tr = poseTrack(tl, 'ada.pose', 'stand', { facing: 'right' });
 *   tr.to('present', { at: T.word('L0003', 'network') - 0.3, dur: 0.5 });  // returns end time
 *   tr.loop('write', { at: 6, dur: 3 });  tr.flip(9.2);                     // dissent turn on a hold
 *   const { pose, facing } = tr.sample(t);   // PuppetPose on twos, with .prev for secondary lag
 *
 * Keys snap their motion to the twos grid (quantised eases); a key that would
 * start inside the previous key's hold is pushed to prevEnd + minHold (0.5 s)
 * unless { force: true }. When a Timeline is given, each track registers a
 * channel (key) so the Motion Studio sees the beats; sampling stays pure.
 */
import type { Facing, HandShape, JointId, Pose } from '../../contracts';
import { TWOS_HZ, quantizeTwos } from '../../contracts';
import { ease as EASE, type Ease, type Timeline } from '../../../core';
import { JOINTS } from './rig';

export type GestureId =
  | 'stand' | 'present' | 'point' | 'write' | 'think' | 'doubt' | 'dissent' | 'triumph'
  | 'despair' | 'authority' | 'lean' | 'sit' | 'type' | 'listen' | 'walkStand' | 'rest' | 'clasp';

type A = Partial<Record<JointId, number>>;

/** Build a pose; feet stay level unless ankles are given. */
export function pose(angles: A, hands: { handF?: HandShape; handB?: HandShape } = {}, root?: Pose['root']): Pose {
  const a: A = { ...angles };
  if (a.ankleF === undefined) a.ankleF = -((a.hipF ?? 0) + (a.kneeF ?? 0));
  if (a.ankleB === undefined) a.ankleB = -((a.hipB ?? 0) + (a.kneeB ?? 0));
  return { angles: a, handF: hands.handF ?? 'relaxed', handB: hands.handB ?? 'relaxed', ...(root ? { root } : {}) };
}

const STANCE: A = { hipF: 5, kneeF: -4, hipB: -4, kneeB: -1 };
/** natural carriage: chest a touch back, neck forward, face level (the S-curve) */
const CARRY: A = { torso: -2, neck: 8, head: -6 };

export const POSES: Record<GestureId, Pose> = {
  stand: pose({ ...STANCE, ...CARRY, shoulderF: 5, elbowF: 16, wristF: 6, shoulderB: -9, elbowB: 12, wristB: 4 }),
  rest: pose({ hipF: 11, kneeF: -13, hipB: -3, kneeB: 0, torso: -3, neck: 9, head: -5, shoulderF: 2, elbowF: 12, wristF: 8, shoulderB: -6, elbowB: 10, wristB: 6 }),
  clasp: pose({ ...STANCE, torso: -3, neck: 7, head: -6, shoulderF: -24, elbowF: 46, wristF: 10, shoulderB: -22, elbowB: 50, wristB: 8 }, { handF: 'fist', handB: 'fist' }),
  walkStand: pose({ hipF: 10, kneeF: -2, hipB: -10, kneeB: -4, shoulderF: -6, elbowF: 14, shoulderB: 8, elbowB: 16, neck: 3 }),
  listen: pose({ ...STANCE, torso: 0, neck: 10, head: -3, shoulderF: 2, elbowF: 18, wristF: 6, shoulderB: -4, elbowB: 14 }),
  present: pose({ ...STANCE, torso: 2, neck: 6, head: -7, shoulderF: 38, elbowF: 52, wristF: -28, shoulderB: -8, elbowB: 14 }, { handF: 'open' }),
  point: pose({ ...STANCE, hipF: 9, kneeF: -4, torso: 3, neck: 6, head: -6, shoulderF: 86, elbowF: 4, wristF: 0, shoulderB: -10, elbowB: 16 }, { handF: 'point' }),
  write: pose({ ...STANCE, hipF: 6, torso: 4, neck: -4, head: -4, shoulderF: 118, elbowF: 36, wristF: 14, shoulderB: -4, elbowB: 22 }, { handF: 'grip' }),
  think: pose({ ...STANCE, torso: 2, neck: 10, head: 2, shoulderF: 30, elbowF: 156, wristF: -24, shoulderB: -2, elbowB: 16, wristB: 4 }, { handF: 'chin', handB: 'relaxed' }),
  doubt: pose({ hipF: 2, kneeF: -2, hipB: -6, kneeB: 0, torso: -6, neck: -4, head: -6, shoulderF: -26, elbowF: 66, wristF: -10, shoulderB: -22, elbowB: 50 }, { handF: 'fist', handB: 'fist' }),
  dissent: pose({ ...STANCE, torso: -2, neck: 12, head: 4, shoulderF: -8, elbowF: 22, shoulderB: -14, elbowB: 18 }, { handF: 'fist' }),
  triumph: pose({ ...STANCE, hipF: 7, hipB: -7, torso: -6, neck: -8, head: -10, shoulderF: 164, elbowF: 12, wristF: 0, shoulderB: 152, elbowB: 18 }, { handF: 'fist', handB: 'fist' }),
  despair: pose({ hipF: 6, kneeF: -10, hipB: -2, kneeB: -8, torso: 7, neck: 8, head: 9, shoulderF: 0, elbowF: 6, wristF: 8, shoulderB: -2, elbowB: 6 }),
  authority: pose({ ...STANCE, hipF: 6, hipB: -6, torso: -4, neck: 5, head: -6, shoulderF: -15, elbowF: 30, wristF: -4, shoulderB: -18, elbowB: 26 }, { handF: 'fist', handB: 'fist' }),
  lean: pose({ hipF: 2, kneeF: -2, hipB: -16, kneeB: 0, torso: 16, neck: -2, head: -6, shoulderF: 30, elbowF: 6, wristF: -58, shoulderB: 18, elbowB: 10, wristB: -50 }, { handF: 'palmDown', handB: 'palmDown' }),
  sit: pose({ hipF: 88, kneeF: -86, hipB: 84, kneeB: -80, torso: 2, neck: 3, head: 0, shoulderF: 18, elbowF: 56, wristF: 4, shoulderB: 12, elbowB: 58 }),
  type: pose({ hipF: 86, kneeF: -84, hipB: 82, kneeB: -78, torso: 7, neck: 2, head: 4, shoulderF: 14, elbowF: 78, wristF: 8, shoulderB: 10, elbowB: 80, wristB: 8 }, { handF: 'typing', handB: 'typing' }),
};

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export function blendPose(a: Pose, b: Pose, u: number): Pose {
  if (u <= 0) return a;
  if (u >= 1) return b;
  const angles: A = {};
  for (const j of JOINTS) {
    const va = a.angles[j];
    const vb = b.angles[j];
    if (va === undefined && vb === undefined) continue;
    angles[j] = lerp(va ?? 0, vb ?? 0, u);
  }
  const out: Pose = { angles, handF: u < 0.5 ? a.handF : b.handF, handB: u < 0.5 ? a.handB : b.handB };
  if (a.root || b.root) {
    const ra = a.root ?? {};
    const rb = b.root ?? {};
    out.root = {
      x: lerp(ra.x ?? 0, rb.x ?? 0, u),
      y: ra.y === undefined && rb.y === undefined ? undefined : lerp(ra.y ?? 0, rb.y ?? 0, u),
    };
  }
  return out;
}

/** Add joint offsets (degrees) to a pose; hands/root untouched. */
export function addPose<P extends Pose>(base: P, delta: A): P {
  const angles: A = { ...base.angles };
  for (const k in delta) {
    const j = k as JointId;
    angles[j] = (angles[j] ?? 0) + (delta[j] ?? 0);
  }
  return { ...base, angles };
}

/** Cyclic gestures on twos: 'write' = 3-drawing chalk loop (0.5 s), 'type' = 2-drawing loop. */
export function loopPose(g: 'write' | 'type', base: Pose, tq: number): Pose & { loop?: number } {
  const tick = Math.floor(tq * TWOS_HZ + 1e-6);
  if (g === 'write') {
    const d = Math.floor(tick / 2) % 3; // each drawing held two ticks
    const off: A[] = [
      { shoulderF: 0, elbowF: 0, wristF: 0 },
      { shoulderF: -3, elbowF: 6, wristF: -6 },
      { shoulderF: 2, elbowF: -4, wristF: 8 },
    ];
    return addPose(base, off[d]);
  }
  const d = Math.floor(tick / 2) % 2;
  return { ...addPose(base, d ? { wristF: 3, wristB: -2 } : { wristF: -2, wristB: 3 }), loop: d };
}

// ---------------------------------------------------------------- tracks
interface Key {
  at: number;
  dur: number;
  to: Pose;
  ease: Ease;
}

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** An ease that only advances on the twos grid (global, shot-local seconds). */
export function twosEase(base: Ease, at: number, dur: number): Ease {
  if (dur <= 0) return () => 1;
  return (u) => base(clamp01((quantizeTwos(at + u * dur) - at) / dur));
}

export interface PoseSample {
  pose: Pose & { prev?: Pose; loop?: number };
  facing: Facing;
}

export class PoseTrack {
  readonly keys: Key[] = [];
  readonly flips: { at: number; facing: Facing }[] = [];
  readonly loops: { g: 'write' | 'type'; at: number; end: number }[] = [];
  private lastEnd = 0;
  private ch?: import('../../../core').ChannelRef<Pose>;

  constructor(
    private tl: Timeline | null,
    readonly key: string,
    readonly initial: Pose,
    readonly facing0: Facing = 'right',
    readonly minHold = 0.5,
  ) {
    if (tl) this.ch = tl.channel<Pose>(key, initial, (a, b) => (u) => blendPose(a, b, u));
  }

  /** Move to a pose; returns the end time (chain the next key from it plus a hold). */
  to(p: Pose | GestureId, o: { at: number; dur?: number; ease?: Ease; force?: boolean }): number {
    const target = typeof p === 'string' ? POSES[p] : p;
    const dur = o.dur ?? 0.5;
    let at = o.at;
    if (!o.force && this.keys.length && at < this.lastEnd + this.minHold) at = this.lastEnd + this.minHold;
    at = Math.ceil(at * TWOS_HZ - 1e-6) / TWOS_HZ;
    const e = twosEase(o.ease ?? EASE.move, at, dur);
    this.keys.push({ at, dur, to: target, ease: e });
    this.keys.sort((a, b) => a.at - b.at);
    this.lastEnd = Math.max(this.lastEnd, at + dur);
    if (this.tl && this.ch) this.tl.tween(this.ch, target, { at, dur, ease: e });
    return at + dur;
  }

  /** Turn to face the other way (a dissent flip) — instant, on a hold. */
  flip(at: number, facing?: Facing): number {
    const cur = this.facingAt(at - 1e-3);
    const t = Math.ceil(at * TWOS_HZ - 1e-6) / TWOS_HZ;
    this.flips.push({ at: t, facing: facing ?? (cur === 'right' ? 'left' : 'right') });
    this.flips.sort((a, b) => a.at - b.at);
    this.tl?.hold(t, 0);
    return t;
  }

  /** Run a cyclic gesture (write/type) over the current pose for [at, at+dur]. */
  loop(g: 'write' | 'type', o: { at: number; dur: number }): number {
    this.loops.push({ g, at: o.at, end: o.at + o.dur });
    this.tl?.hold(o.at, o.dur);
    return o.at + o.dur;
  }

  facingAt(t: number): Facing {
    let f = this.facing0;
    for (const x of this.flips) if (t >= x.at) f = x.facing;
    return f;
  }

  /** Pure pose at time t (not quantised). */
  poseAt(t: number): Pose {
    let v = this.initial;
    for (const k of this.keys) {
      if (t <= k.at) break;
      const u = k.dur === 0 ? 1 : clamp01((t - k.at) / k.dur);
      v = u >= 1 ? k.to : blendPose(v, k.to, k.ease(u));
      if (u < 1) break;
    }
    return v;
  }

  private withLoops(p: Pose, tq: number): Pose & { loop?: number } {
    for (const l of this.loops) if (tq >= l.at && tq < l.end) return loopPose(l.g, p, tq);
    return p;
  }

  /** Sample on twos; includes the pose one tick earlier for secondary lag. */
  sample(t: number): PoseSample {
    const tq = quantizeTwos(t);
    const cur = this.withLoops(this.poseAt(tq), tq);
    const prev = this.withLoops(this.poseAt(Math.max(0, tq - 1 / TWOS_HZ)), tq - 1 / TWOS_HZ);
    return { pose: { ...cur, prev }, facing: this.facingAt(tq) };
  }

  get end(): number {
    return Math.max(this.lastEnd, ...this.loops.map((l) => l.end), ...this.flips.map((f) => f.at));
  }
}

export function poseTrack(tl: Timeline | null, key: string, initial: Pose | GestureId = 'stand', o: { facing?: Facing; minHold?: number } = {}): PoseTrack {
  return new PoseTrack(tl, key, typeof initial === 'string' ? POSES[initial] : initial, o.facing ?? 'right', o.minHold ?? 0.5);
}
