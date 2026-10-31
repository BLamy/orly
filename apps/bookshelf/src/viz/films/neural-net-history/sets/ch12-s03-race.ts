/**
 * neural-net-history — ch12-s03's race pieces (round 2: L1208 was cut; the ledger is a brief insert, the freed
 * seconds go to the race):
 *
 *   raceRunners(c, env, tq, o)   the stampede carried into the study: a stream of small cut-paper runners crossing
 *                                the desk's far edge left to right (a toy-theatre track), near-black, their top edges
 *                                catching the lamp, short shadows thrown down-right onto the desk. Pure in tq (on
 *                                twos); a steady, endless stream (each runner has its own start time and speed).
 *   errataSlip(c, env, p, rot)   a typed paper strip pasted under the FTX row: the footnote '(later exposed as fraud;
 *                                Anthropic not implicated)' on two lines, IBM Plex Mono, at the legibility floor in
 *                                every desk framing (a later annotation, so it is pasted, not written).
 *   leakTag(c, env, p, rot)      a small typed tag tied to the LLaMA chip on 'leaked': WEIGHTS LEAKED / 3 MAR 2023.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { FONT, drawTracked } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { paperTone } from './caseBoard';

type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };

// ------------------------------------------------------------------------------------------------ runners
/** one running figure, hip-hinged, leaning into the run; feet at (x, y), height H, facing f; phase in cycles */
function runner(c: C, x: number, y: number, H: number, f: 1 | -1, phase: number) {
  const phi = phase * Math.PI * 2;
  const bob = -0.03 * H * Math.abs(Math.sin(phi));
  const hip = { x, y: y - 0.5 * H + bob };
  const lean = 0.28;
  const neck = { x: hip.x + f * Math.sin(lean) * 0.31 * H, y: hip.y - Math.cos(lean) * 0.31 * H };
  c.lineCap = 'round';
  const limb = (a: Pt, b: Pt, w: number) => {
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  };
  for (const off of [Math.PI, 0]) {
    const a = 0.62 * Math.sin(phi + off);
    const bend = 0.25 + 0.9 * Math.max(0, -Math.sin(phi + off + 0.7));
    const knee = { x: hip.x + f * Math.sin(a) * 0.25 * H, y: hip.y + Math.cos(a) * 0.25 * H };
    const a2 = a - bend * 1.25;
    const ank = { x: knee.x + f * Math.sin(a2) * 0.25 * H, y: knee.y + Math.cos(a2) * 0.25 * H };
    limb(hip, knee, 0.09 * H);
    limb(knee, ank, 0.072 * H);
    limb(ank, { x: ank.x + f * 0.07 * H, y: ank.y + 0.01 * H }, 0.05 * H);
  }
  limb(hip, neck, 0.17 * H);
  const sh = { x: neck.x - f * 0.02 * H, y: neck.y + 0.04 * H };
  for (const off of [0, Math.PI]) {
    const a = -0.85 * Math.sin(phi + off);
    const el = { x: sh.x + f * Math.sin(a) * 0.17 * H, y: sh.y + Math.cos(a) * 0.17 * H };
    const a2 = a + 1.5;
    limb(sh, el, 0.062 * H);
    limb(el, { x: el.x + f * Math.sin(a2) * 0.15 * H, y: el.y + Math.cos(a2) * 0.15 * H }, 0.05 * H);
  }
  c.beginPath();
  c.arc(neck.x + f * 0.05 * H, neck.y - 0.09 * H, 0.085 * H, 0, Math.PI * 2);
  c.fill();
}

export interface RaceOpts {
  /** the track's y (feet), L4 world */
  y: number;
  /** x where runners enter (off frame left) and leave (off frame right) */
  x0: number;
  x1: number;
  /** first runner's start time and the mean gap between starts (s) */
  t0: number;
  gap: number;
  /** how many runners in the stream */
  n: number;
  /** figure height (world px) */
  h: number;
  /** lamp side: the top-left edges catch it */
  rim: string;
  /** 0..1 overall presence (fade in/out) */
  alpha?: number;
}

/** the stream: start times jittered, speeds 125–175 px/s, sizes ±12 %; shadows first, then figures, then rims */
export function raceRunners(c: C, env: PaintEnv, tq: number, o: RaceOpts) {
  const A = o.alpha ?? 1;
  if (A <= 0.01) return;
  const live: { x: number; H: number; ph: number }[] = [];
  for (let i = 0; i < o.n; i++) {
    const ts = o.t0 + i * o.gap + 0.22 * o.gap * hash1(i, 3101);
    const v = 150 + 25 * hash1(i, 3102);
    const x = o.x0 + v * (tq - ts);
    if (x < o.x0 || x > o.x1) continue;
    const H = o.h * (1 + 0.12 * hash1(i, 3103));
    live.push({ x, H, ph: hash1(i, 3104) + (tq - ts) * 2.6 });
  }
  if (!live.length) return;
  c.save();
  c.globalAlpha *= A;
  // the lamp is at the upper left: each runner's short shadow falls down and to the right across the desk
  c.fillStyle = withAlpha(env.mood.fg, 0.32);
  for (const r of live) {
    c.beginPath();
    c.ellipse(r.x + r.H * 0.32, o.y + 3, r.H * 0.42, r.H * 0.06, 0.06, 0, Math.PI * 2);
    c.fill();
  }
  // the rim first (offset toward the lamp), then the black cut-out over it: a 1 px lit edge on the lamp side
  c.fillStyle = withAlpha(o.rim, 0.55);
  c.strokeStyle = withAlpha(o.rim, 0.55);
  for (const r of live) runner(c, r.x - 1.1, o.y - 1.1, r.H, 1, r.ph);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.strokeStyle = PUPPET_NEAR_BLACK;
  for (const r of live) runner(c, r.x, o.y, r.H, 1, r.ph);
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the errata slip
export const SLIP_LINES = ['(later exposed as fraud;', 'Anthropic not implicated)'] as const;
/** (round 3) sized for ch12-s03's whole-book framing (k ≥ 0.86): ≥ 22 px cap height at 1080p */
export const SLIP = { size: 25.5, pad: 12, pitch: 48, w: 0, h: 0 };
SLIP.w = SLIP_LINES[1].length * 0.6 * SLIP.size + 2 * SLIP.pad;
SLIP.h = SLIP.pitch + SLIP.size + 2 * SLIP.pad - 6;

/** p = the slip's top-left (first baseline at p.y + pad + size*0.8) */
export function errataSlip(c: C, env: PaintEnv, p: Pt, rot: number, lift = 0) {
  const m = env.mood;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(rot);
  // shadow (the lamp at upper left)
  const d = 2 + 14 * lift;
  c.fillStyle = withAlpha(m.fg, 0.38 - 0.12 * lift);
  c.fillRect(0.8 * d, d, SLIP.w, SLIP.h);
  const paper = mixLab(paperTone(env, 0.9), '#efe6d2', 0.25);
  c.fillStyle = paper;
  c.fillRect(0, 0, SLIP.w, SLIP.h);
  // a torn-straight top edge: a hairline darker fibre band, a pasted-down glue shade along the left
  c.fillStyle = withAlpha(m.ink, 0.12);
  c.fillRect(0, 0, SLIP.w, 1.2);
  c.fillRect(0, 0, 6, SLIP.h);
  c.fillStyle = mixLab(m.ink, '#2a1d14', 0.35);
  c.textBaseline = 'alphabetic';
  const font = `500 ${SLIP.size}px ${FONT.mono}`;
  SLIP_LINES.forEach((ln, i) => drawTracked(c, ln, SLIP.pad, SLIP.pad + SLIP.size * 0.8 + i * SLIP.pitch, { font, size: SLIP.size, tracking: 0 }));
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the leak tag
export const TAG_LINES = ['WEIGHTS LEAKED', '3 MAR 2023'] as const;
export const TAG = { size: 25, pad: 10, w: 0, h: 0 };
TAG.w = TAG_LINES[0].length * 0.6 * TAG.size * 1.04 + 2 * TAG.pad + 14;
TAG.h = TAG.size * 2.3 + 2 * TAG.pad - 4;

/** p = the tag's punched corner (top-left); drawn rotated about it */
export function leakTag(c: C, env: PaintEnv, p: Pt, rot: number, lift = 0) {
  const m = env.mood;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(rot);
  const d = 2 + 14 * lift;
  c.fillStyle = withAlpha(m.fg, 0.4 - 0.12 * lift);
  c.fillRect(0.8 * d, d, TAG.w, TAG.h);
  const paper = mixLab(paperTone(env, 0.88), '#e9dcc4', 0.3);
  c.fillStyle = paper;
  // a luggage-tag outline: the left end clipped at the corners
  c.beginPath();
  c.moveTo(10, 0);
  c.lineTo(TAG.w, 0);
  c.lineTo(TAG.w, TAG.h);
  c.lineTo(10, TAG.h);
  c.lineTo(0, TAG.h - 10);
  c.lineTo(0, 10);
  c.closePath();
  c.fill();
  // the punched hole and its reinforcing ring
  c.fillStyle = withAlpha(m.ink, 0.5);
  c.beginPath();
  c.arc(12, TAG.h / 2, 3.2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(m.ink, 0.22);
  c.lineWidth = 1;
  c.beginPath();
  c.arc(12, TAG.h / 2, 6, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = mixLab(m.ink, '#2a1d14', 0.35);
  c.textBaseline = 'alphabetic';
  const x = 24;
  drawTracked(c, TAG_LINES[0], x, TAG.pad + TAG.size * 0.82, { font: `600 ${TAG.size}px ${FONT.mono}`, size: TAG.size, tracking: 0.04 });
  drawTracked(c, TAG_LINES[1], x, TAG.pad + TAG.size * 0.82 + TAG.size * 1.25, { font: `500 ${TAG.size}px ${FONT.mono}`, size: TAG.size, tracking: 0.02 });
  c.restore();
}
