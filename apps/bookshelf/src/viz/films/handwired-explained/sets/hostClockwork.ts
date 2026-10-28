/**
 * handwired-explained — DEEP DIVE II's machine: THE HOST CLOCKWORK (ch06-s01..s06, ch06-s12, ch06-s13).
 *
 * The program runs every operation once per evaluation and cannot stop early (no jump, break or repeat, HL01): the
 * repetition belongs to the HOST. The clockwork is that host: an escapement that ticks once per evaluation, a crank
 * on its axle that turns the loom once per tick, and a 4 ms step RATCHET with 300 teeth and a release pawl (the static
 * bound: at most maxStepsPerFrame = 300 steps = 1,200 ms per frame; past it a snap lands every animated object on its
 * destination and the backlog is discarded, HL08). Four brass arms swing out from the hub, each tipped with a small
 * machine-shape (shapes, not words): a peg rail (COUNT), a forked thread (TREE), a card drawer (TABLE), a row of
 * identical tiles (SAME WORK ON EVERY ITEM).
 *
 *   import { hostClockwork, CLOCK } from '../sets/hostClockwork';
 *   f.layer('L4', (c, env) => hostClockwork(c, env, { x: 640, y: 380, r: 190, tick: s.get(scene.tick), steps, arms: armsU }));
 *   CLOCK.armTip(o, i)   // world point of arm i's tip (0 count · 1 tree · 2 table · 3 same work)
 *
 * tick: a continuous count of evaluations (the escapement rocks once per whole tick; the crank turns one revolution
 * per tick); steps: the ratchet pointer in teeth (0..300; at 300 the pawl lifts: pass release 0..1); arms: 0..1
 * swing-out (or true); silhouette: true for the plain black silhouette behind a plate (ch06-s01).
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';

export interface ClockOpts {
  x: number;
  y: number;
  /** ratchet radius (stage px) */
  r: number;
  /** evaluations so far (continuous); default 0 */
  tick?: number;
  /** ratchet pointer in teeth (0..300) */
  steps?: number;
  /** 0..1 the release pawl lifted (the snap) */
  release?: number;
  /** 0..1 (or boolean) the four arms swung out */
  arms?: number | boolean;
  /** highlight one arm (0..3) 0..1 */
  armLit?: [number, number];
  /** plain black silhouette (behind a plate) */
  silhouette?: boolean;
}

const TEETH = 300;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function lw(c: CanvasRenderingContext2D, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}
const brass = (env: PaintEnv, k = 0) => mixLab(mixLab('#a8823e', env.mood.halo, 0.35), env.mood.core, k * 0.4);

/** arm angles (radians): count up-left, tree up-right, table down-right, same work down-left */
const ARM_ANG = [-Math.PI * 0.78, -Math.PI * 0.22, Math.PI * 0.2, Math.PI * 0.8];
function armTip(o: ClockOpts, i: number) {
  const u = typeof o.arms === 'number' ? clamp01(o.arms) : o.arms ? 1 : 0;
  const a = ARM_ANG[i] * u + (-Math.PI / 2) * (1 - u);
  const L = o.r * (1.25 + 0.55 * u);
  return { x: o.x + Math.cos(a) * L, y: o.y + Math.sin(a) * L, a };
}

export function hostClockwork(c: CanvasRenderingContext2D, env: PaintEnv, o: ClockOpts) {
  const ink = o.silhouette ? env.fill('ink') : PUPPET_NEAR_BLACK;
  const rimC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), o.silhouette ? 0.45 : 0.85);
  const r = o.r;
  const tick = o.tick ?? 0;
  const steps = Math.max(0, Math.min(TEETH, o.steps ?? 0));
  // ---- arms behind the wheel
  const au = typeof o.arms === 'number' ? clamp01(o.arms) : o.arms ? 1 : 0;
  if (au > 0) {
    for (let i = 0; i < 4; i++) {
      const tip = armTip(o, i);
      const lit = o.armLit && o.armLit[0] === i ? clamp01(o.armLit[1]) : 0;
      c.strokeStyle = o.silhouette ? ink : brass(env, lit);
      c.lineWidth = Math.max(lw(c, 3), r * 0.035);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(o.x, o.y);
      c.lineTo(tip.x, tip.y);
      c.stroke();
      c.save();
      c.translate(tip.x, tip.y);
      c.globalAlpha = au;
      c.fillStyle = ink;
      c.strokeStyle = o.silhouette ? ink : brass(env, lit);
      c.lineWidth = Math.max(lw(c, 2), r * 0.018);
      const k = r * 0.16;
      if (i === 0) {
        // COUNT: a peg rail
        c.fillRect(-k * 1.4, -k * 0.15, k * 2.8, k * 0.3);
        for (let p = 0; p < 5; p++) c.fillRect(-k * 1.2 + p * k * 0.6, -k * 0.75, k * 0.16, k * 0.6);
      } else if (i === 1) {
        // TREE: a forked thread (a prefix fan)
        c.beginPath();
        c.moveTo(0, k);
        c.lineTo(0, 0);
        c.lineTo(-k, -k);
        c.moveTo(0, 0);
        c.lineTo(k, -k);
        c.moveTo(-k, -k);
        c.lineTo(-k * 1.4, -k * 1.8);
        c.moveTo(-k, -k);
        c.lineTo(-k * 0.6, -k * 1.8);
        c.moveTo(k, -k);
        c.lineTo(k * 0.6, -k * 1.8);
        c.moveTo(k, -k);
        c.lineTo(k * 1.4, -k * 1.8);
        c.stroke();
      } else if (i === 2) {
        // TABLE: a card drawer
        c.fillRect(-k, -k * 0.7, k * 2, k * 1.4);
        c.strokeStyle = rimC;
        c.lineWidth = lw(c, 1.4);
        c.strokeRect(-k * 0.8, -k * 0.5, k * 1.6, k);
        c.beginPath();
        c.arc(0, 0, k * 0.14, 0, Math.PI * 2);
        c.stroke();
      } else {
        // SAME WORK ON EVERY ITEM: a row of identical tiles
        for (let p = 0; p < 4; p++) c.fillRect(-k * 1.5 + p * k * 0.8, -k * 0.3, k * 0.6, k * 0.6);
      }
      c.restore();
    }
  }
  // ---- the ratchet wheel: 300 fine teeth, spokes, hub
  const rot = (steps / TEETH) * Math.PI * 2;
  c.save();
  c.translate(o.x, o.y);
  c.rotate(rot);
  c.fillStyle = ink;
  c.beginPath();
  for (let i = 0; i < TEETH; i++) {
    const a0 = (i / TEETH) * Math.PI * 2;
    const a1 = ((i + 0.85) / TEETH) * Math.PI * 2;
    const a2 = ((i + 1) / TEETH) * Math.PI * 2;
    if (i === 0) c.moveTo(Math.cos(a0) * r * 0.97, Math.sin(a0) * r * 0.97);
    c.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    c.lineTo(Math.cos(a2) * r * 0.97, Math.sin(a2) * r * 0.97);
  }
  c.closePath();
  // spokes as holes (evenodd)
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.26;
    const a2 = a + (Math.PI * 2) / 6 - 0.32;
    c.moveTo(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22);
    c.arc(0, 0, r * 0.84, a, a2);
    c.arc(0, 0, r * 0.22, a2, a, true);
    c.closePath();
  }
  c.fill('evenodd');
  c.strokeStyle = rimC;
  c.lineWidth = lw(c, 2.2);
  c.beginPath();
  c.arc(0, 0, r, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  c.restore();
  // the pointer (fixed) and the release pawl at the top of the wheel
  const rel = clamp01(o.release ?? 0);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(o.x + r * 0.62, o.y - r * 1.12);
  c.lineTo(o.x + r * 0.08, o.y - r * 0.985 - rel * r * 0.18);
  c.lineTo(o.x + r * 0.16, o.y - r * 1.07 - rel * r * 0.18);
  c.lineTo(o.x + r * 0.68, o.y - r * 1.2);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(o.x + r * 0.66, o.y - r * 1.16, r * 0.05, 0, Math.PI * 2);
  c.fill();
  // ---- the escapement: an anchor rocking once per evaluation, above the wheel
  const ph = tick - Math.floor(tick);
  const rock = Math.sin(Math.min(1, ph * 4) * Math.PI) * 0.22 * (Math.floor(tick) % 2 === 0 ? 1 : -1);
  c.save();
  c.translate(o.x - r * 0.9, o.y - r * 0.95);
  c.rotate(rock);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-r * 0.32, r * 0.18);
  c.quadraticCurveTo(0, -r * 0.12, r * 0.32, r * 0.18);
  c.lineTo(r * 0.26, r * 0.22);
  c.quadraticCurveTo(0, -r * 0.02, -r * 0.26, r * 0.22);
  c.closePath();
  c.rect(-r * 0.025, -r * 0.4, r * 0.05, r * 0.42);
  c.fill();
  c.beginPath();
  c.arc(0, 0, r * 0.05, 0, Math.PI * 2);
  c.fillStyle = o.silhouette ? ink : brass(env, ph < 0.15 ? 1 : 0);
  c.fill();
  c.restore();
  // ---- the hub and the crank (one revolution per tick)
  const ca = tick * Math.PI * 2;
  c.fillStyle = o.silhouette ? ink : brass(env, 0.2);
  c.beginPath();
  c.arc(o.x, o.y, r * 0.12, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = o.silhouette ? ink : brass(env, 0.2);
  c.lineWidth = Math.max(lw(c, 3), r * 0.04);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(o.x, o.y);
  const cx = o.x + Math.cos(ca) * r * 0.45, cy = o.y + Math.sin(ca) * r * 0.45;
  c.lineTo(cx, cy);
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  c.arc(cx, cy, r * 0.05, 0, Math.PI * 2);
  c.fill();
}

export const CLOCK = { TEETH, armTip, ARM_ANG, STEP_MS: 4, MAX_STEPS: 300 };
