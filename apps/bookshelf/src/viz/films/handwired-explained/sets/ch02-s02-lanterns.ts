/**
 * handwired-explained — the 1943 THRESHOLD LANTERNS (ch02-s02), reused as the 30 % ghost in ch07-s03.
 *
 * Three kit paperLanterns hang from one fixed beam: two input lanterns (A, B) at left, one output lantern (OUT) at
 * right, joined by kit thread() lines with a hard ink knot tied at each end: wiring that never changes. Every lantern
 * is ALL OR NONE (act is only ever 0 or 1). The output's brass threshold ring has two notches: at notch 2 (AND) it
 * catches only when both inputs arrive, at notch 1 (OR) when either does. The state is COMPUTED here
 * (gateFires), never typed: a McCulloch-Pitts unit fires when the count of active inputs reaches its threshold.
 *
 *   import { GATE, gateLanterns, gateFires } from '../sets/ch02-s02-lanterns';
 *   f.layer('L4', (c, env) => gateLanterns(c, env, { a: 1, b: 0, threshold: 1, ring: 1, pulseA: u, alpha: 0.3 }));
 *
 * Geometry is in rest-screen px at L4 (GATE): ch07-s03 draws the same objects at the same relative positions (pass
 * `at` to translate and `scale` to scale the whole machine).
 */
import type { PaintEnv } from '../../../film/contracts';
import { knot, paperLantern, thread, threadPoint } from '../../../film/silhouette/metaphors/kit';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';

export const GATE = {
  beam: { x0: 300, x1: 1040, y: 112 },
  A: { x: 392, y: 330, r: 62 },
  B: { x: 610, y: 330, r: 62 },
  OUT: { x: 920, y: 352, r: 86 },
  /** the output ring's two notches (0..1 of the lantern's height): threshold 2 (AND) and threshold 1 (OR) */
  notch: { 2: 0.64, 1: 0.36 } as Record<1 | 2, number>,
};

/** the threads (A → OUT, B → OUT): from under each input lantern to the output's flank */
export function gateThreads() {
  const { A, B, OUT } = GATE;
  return [
    { x0: A.x, y0: A.y + A.r * 1.06, x1: OUT.x - OUT.r * 0.74, y1: OUT.y + OUT.r * 0.28, w: 2.4, sag: 40 },
    { x0: B.x, y0: B.y + B.r * 1.06, x1: OUT.x - OUT.r * 0.8, y1: OUT.y - OUT.r * 0.05, w: 2.4, sag: 18 },
  ];
}

/** does a threshold unit fire? (the count of lit inputs reaches the threshold) */
export const gateFires = (a: number, b: number, threshold: number) => (a >= 1 ? 1 : 0) + (b >= 1 ? 1 : 0) >= threshold;

export interface GateState {
  /** inputs lit (0 | 1) */
  a: number;
  b: number;
  /** output lit (0 | 1): pass gateFires(...) once the pulses have ARRIVED */
  out: number;
  /** the ring's position: 2 → 1 continuously while a hand lowers it */
  ring: number;
  /** 0..1 a signal pulse travelling along each thread (undefined = none) */
  pulseA?: number;
  pulseB?: number;
  /** 0..1 flare on a lantern that has just caught */
  flareA?: number;
  flareB?: number;
  flareOut?: number;
  /** 0..1 the hard knots catching the light ('learned') */
  knots?: number;
  alpha?: number;
  at?: { x: number; y: number };
  scale?: number;
}

function hardKnot(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, k: number) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.beginPath();
  c.ellipse(x, y, 5.2, 4.2, 0.4, 0, Math.PI * 2);
  c.fill();
  // the loose ends of the knot
  c.strokeStyle = ink;
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(x + 2, y + 3);
  c.lineTo(x + 6, y + 11);
  c.moveTo(x - 1, y + 4);
  c.lineTo(x - 3, y + 12);
  c.stroke();
  if (k > 0.01) {
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.85 * k);
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(x, y, 8.5, Math.PI * 1.05, Math.PI * 1.95);
    c.stroke();
  }
}

/** the three lanterns, the beam and the knotted threads (draw in L4) */
export function gateLanterns(c: CanvasRenderingContext2D, env: PaintEnv, s: GateState) {
  const al = s.alpha ?? 1;
  if (al <= 0.003) return;
  const { A, B, OUT, beam } = GATE;
  c.save();
  c.globalAlpha *= al;
  if (s.at || s.scale) {
    c.translate(s.at?.x ?? 0, s.at?.y ?? 0);
    c.scale(s.scale ?? 1, s.scale ?? 1);
  }
  const ink = env.fill('ink');
  // the fixed beam with its pegs
  c.fillStyle = ink;
  c.fillRect(beam.x0, beam.y - 9, beam.x1 - beam.x0, 18);
  c.fillRect(beam.x0 - 14, beam.y - 14, 18, 28);
  c.fillRect(beam.x1 - 4, beam.y - 14, 18, 28);
  c.strokeStyle = withAlpha(env.mood.rim, 0.35);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(beam.x0, beam.y - 9);
  c.lineTo(beam.x1, beam.y - 9);
  c.stroke();
  // threads first (the lanterns hang over their ends); a lit input warms its thread
  const th = gateThreads();
  const warm = [s.a, s.b];
  th.forEach((o, i) => {
    thread(c, { ...o, color: ink }, env);
    if (warm[i] >= 1) thread(c, { ...o, w: 1.2, color: withAlpha(env.mood.halo, 0.8) }, env);
    const p = i === 0 ? s.pulseA : s.pulseB;
    if (p !== undefined && p >= 0 && p <= 1) {
      const q = threadPoint(o, p);
      knot(c, q.x, q.y, 6, 1, env);
    }
  });
  // lanterns: all or none
  const fl = (x?: number) => Math.max(0, Math.min(1, x ?? 0));
  paperLantern(c, { x: A.x, y: A.y, r: A.r, act: s.a >= 1 ? 1 : 0, flare: fl(s.flareA), hang: A.y - A.r * 1.2 - beam.y - 9 }, env);
  paperLantern(c, { x: B.x, y: B.y, r: B.r, act: s.b >= 1 ? 1 : 0, flare: fl(s.flareB), hang: B.y - B.r * 1.2 - beam.y - 9 }, env);
  const ringU = GATE.notch[1] + (GATE.notch[2] - GATE.notch[1]) * Math.max(0, Math.min(1, s.ring - 1));
  paperLantern(c, { x: OUT.x, y: OUT.y, r: OUT.r, act: s.out >= 1 ? 1 : 0, flare: fl(s.flareOut), threshold: ringU, hang: OUT.y - OUT.r * 1.2 - beam.y - 9 }, env);
  // the two notches cut in the output's brass collar rail (right side): where the ring can sit
  const brass = mixLab('#b08d4a', env.mood.halo, 0.35);
  for (const n of [GATE.notch[2], GATE.notch[1]]) {
    const y = OUT.y + OUT.r * 0.86 - n * OUT.r * 1.72;
    const x = OUT.x + OUT.r * 0.98;
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(x, y - 6);
    c.lineTo(x + 12, y);
    c.lineTo(x, y + 6);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(brass, 0.8);
    c.lineWidth = 1.2;
    c.stroke();
  }
  // the ring's brass bead riding at its notch
  const ry = OUT.y + OUT.r * 0.86 - ringU * OUT.r * 1.72;
  c.fillStyle = brass;
  c.beginPath();
  c.arc(OUT.x + OUT.r * 0.86, ry, 4.2, 0, Math.PI * 2);
  c.fill();
  // hard knots at both ends of every thread
  const kk = s.knots ?? 0;
  th.forEach((o) => {
    hardKnot(c, env, o.x0, o.y0, kk);
    hardKnot(c, env, o.x1, o.y1, kk);
  });
  c.restore();
}
