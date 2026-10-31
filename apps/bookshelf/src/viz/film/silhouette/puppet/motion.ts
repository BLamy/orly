/**
 * Puppet life (style bible §4.5): breathing, idle drift and word-driven beats.
 * Everything is a pure function of the twos-quantised time tq and a seed.
 *
 *   breathe(tq, seed)            -> joint offsets: torso ±0.6° on a 4 s sine
 *   idle(tq, seed)               -> head drift ≈1° re-aimed every 6–9 s (seeded holds, eased on twos)
 *   withLife(pose, tq, seed, k?) -> pose (and its .prev) with breathing + idle added
 *   talkBeats(timing, o?)        -> { at(tq) → offsets, times }  head bobs ±2° on stressed words,
 *                                   a near-hand beat (elbow lift + wrist flick) at most one per 1.2 s.
 *                                   NO mouth flap: beats are head/hand only.
 *   applyBeats(pose, beats, tq)  -> pose (and .prev) with the beat offsets added
 *
 * talkBeats accepts the shot's ShotTiming (uses timing.emphasis()) or any
 * { lines } with word timings; restrict with o.lines (line ids) or o.from/o.to.
 */
import type { JointId, LineTiming, Pose, ShotTiming } from '../../contracts';
import { TWOS_HZ } from '../../contracts';
import { addPose } from './poses';
import { hash01 } from './rig';

type A = Partial<Record<JointId, number>>;

export function breathe(tq: number, seed: number): A {
  const ph = hash01(seed * 7 + 3) * Math.PI * 2;
  const s = Math.sin((tq / 4) * Math.PI * 2 + ph);
  return { torso: 0.6 * s, neck: -0.3 * s, shoulderF: 0.4 * s, shoulderB: 0.4 * s };
}

const smoothstep = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

/** Seeded piecewise holds: a new head aim every 6–9 s, eased over 0.6 s. */
export function idle(tq: number, seed: number): A {
  let t0 = -hash01(seed * 13 + 1) * 6;
  let i = 0;
  let prevAim = 0;
  let aim = (hash01(seed * 31) - 0.5) * 2;
  while (true) {
    const len = 6 + hash01(seed * 97 + i * 17) * 3;
    if (tq < t0 + len) break;
    t0 += len;
    i++;
    prevAim = aim;
    aim = (hash01(seed * 31 + i * 7919) - 0.5) * 2;
    if (i > 10000) break;
  }
  const u = smoothstep((tq - t0) / 0.6);
  const v = prevAim + (aim - prevAim) * u;
  return { head: v * 1.0, neck: v * 0.3 };
}

export function withLife<P extends Pose & { prev?: Pose }>(p: P, tq: number, seed: number, k = 1): P {
  const off = (t: number): A => {
    const b = breathe(t, seed);
    const d = idle(t, seed);
    const o: A = {};
    for (const src of [b, d]) for (const j in src) o[j as JointId] = (o[j as JointId] ?? 0) + (src[j as JointId] ?? 0) * k;
    return o;
  };
  const out = addPose(p, off(tq));
  if (p.prev) out.prev = addPose(p.prev, off(tq - 1 / TWOS_HZ));
  return out;
}

export interface TalkBeats {
  /** offsets at a (twos-quantised) time */
  at(tq: number): A;
  /** the stressed-word times used for hand beats */
  times: number[];
}

function bump(dt: number, pre: number, post: number): number {
  if (dt < -pre || dt > post) return 0;
  if (dt < 0) {
    const u = (dt + pre) / pre;
    return Math.sin((u * Math.PI) / 2) ** 2;
  }
  const u = dt / post;
  return Math.cos((u * Math.PI) / 2) ** 2;
}

export function talkBeats(
  timing: Pick<ShotTiming, 'lines'> & Partial<Pick<ShotTiming, 'emphasis'>>,
  o: { lines?: string[]; from?: number; to?: number; head?: number; hand?: number; minGap?: number } = {},
): TalkBeats {
  const lines: LineTiming[] = timing.lines.filter((l) => !o.lines || o.lines.includes(l.id));
  const inRange = (t: number) => (o.from === undefined || t >= o.from) && (o.to === undefined || t <= o.to);
  const minGap = o.minGap ?? 1.2;
  let stressed: number[];
  if (timing.emphasis && !o.lines) stressed = timing.emphasis(minGap);
  else {
    // fallback: longest word per ≥ minGap window
    const words = lines.flatMap((l) => l.words).filter((w) => w.w.replace(/[^\p{L}\p{N}]/gu, '').length >= 5);
    stressed = [];
    for (const w of words) if (!stressed.length || w.start - stressed[stressed.length - 1] >= minGap) stressed.push(w.start);
  }
  stressed = stressed.filter(inRange);
  const lineStarts = lines.map((l) => l.start).filter(inRange);
  const headAmt = o.head ?? 2;
  const handAmt = o.hand ?? 1;
  return {
    times: stressed,
    at(tq: number): A {
      let head = 0;
      let hand = 0;
      for (const s of stressed) {
        const dt = tq - s;
        if (dt < -0.3 || dt > 0.8) continue;
        head += bump(dt, 0.17, 0.42);
        hand += bump(dt + 0.04, 0.25, 0.6);
      }
      for (const s of lineStarts) {
        const dt = tq - s;
        if (dt < -0.4 || dt > 1) continue;
        head -= 0.6 * bump(dt, 0.3, 0.8);
      }
      head = Math.max(-1, Math.min(1, head));
      hand = Math.min(1, hand);
      return {
        head: head * headAmt,
        neck: head * headAmt * 0.35,
        elbowF: hand * 12 * handAmt,
        wristF: -hand * 8 * handAmt,
        shoulderF: hand * 3 * handAmt,
      };
    },
  };
}

export function applyBeats<P extends Pose & { prev?: Pose }>(p: P, beats: TalkBeats, tq: number): P {
  const out = addPose(p, beats.at(tq));
  if (p.prev) out.prev = addPose(p.prev, beats.at(tq - 1 / TWOS_HZ));
  return out;
}
