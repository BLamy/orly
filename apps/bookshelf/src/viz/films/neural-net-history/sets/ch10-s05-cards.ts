/**
 * neural-net-history — THE THREE CARDS every word grows (ch10-s05, and the same objects from here on):
 *
 *   queryLantern(c, env, x, y, s, { grow, lit, beam, beamAngle })   QUESTION · Q  a small paper lantern; its beam
 *                                                                    shines outward, looking for something
 *   keyMirror(c, env, x, y, s, { grow, sheen })                     LABEL · K     a hand mirror with a paper tag:
 *                                                                    what this word offers to be found by
 *   valueNote(c, env, x, y, s, { grow })                            MESSAGE · V   a sealed paper note: what it
 *                                                                    hands over if chosen
 *   brassKnob(c, env, x, y, r, angle, { grow, glint })              the 1958 knob: one adjustable weight
 *   messengerBead(c, env, x, y, r, k)                               ch05's messenger: a dark bead in a ring of light
 *
 * (x, y) is each object's hanging point (the top of its cord); objects hang below it. `grow` 0..1 unfolds the
 * object on its cord (cut paper: it scales up from the cord, it does not morph). Colours come from the mood;
 * the knobs are the only warm note (low-chroma brass).
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { glow, paperLantern } from '../../../film/silhouette/metaphors/kit';

type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** the cord from the hanging point down to the object's top */
function cord(c: C, env: PaintEnv, x: number, y: number, len: number, s: number) {
  c.strokeStyle = mixLab(env.mood.ink, env.mood.set, 0.25);
  c.lineWidth = Math.max(0.7, 1.2 * s);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y + len);
  c.stroke();
}

export const CARD_DROP = 28; // cord length from the hanging point to the object's top (at s = 1)

export function queryLantern(c: C, env: PaintEnv, x: number, y: number, s: number, o: { grow: number; lit?: number; beam?: number; beamAngle?: number }) {
  const g = clamp01(o.grow);
  if (g <= 0.01) return;
  const m = env.mood;
  const lit = clamp01(o.lit ?? 1) * g;
  const r = 20 * s;
  const cy = y + CARD_DROP * s + r * 1.2;
  cord(c, env, x, y, CARD_DROP * s, s);
  // the beam: a soft cone shining outward (drawn first, under the lantern)
  const bk = clamp01(o.beam ?? 0) * lit;
  if (bk > 0.01) {
    const a = o.beamAngle ?? -2.4;
    const L = 210 * s;
    const sp = 0.32;
    const op = c.globalCompositeOperation;
    c.globalCompositeOperation = 'lighter';
    const gr = c.createRadialGradient(x, cy, 4 * s, x, cy, L);
    gr.addColorStop(0, withAlpha(m.core, 0.42 * bk));
    gr.addColorStop(0.5, withAlpha(m.halo, 0.16 * bk));
    gr.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = gr;
    c.beginPath();
    c.moveTo(x, cy);
    c.arc(x, cy, L, a - sp, a + sp);
    c.closePath();
    c.fill();
    c.globalCompositeOperation = op;
  }
  c.save();
  c.translate(x, cy);
  c.scale(g, g);
  paperLantern(c, { x: 0, y: 0, r, act: lit, hang: 0, tassel: true, halo: 0.55 }, env);
  c.restore();
}

export function keyMirror(c: C, env: PaintEnv, x: number, y: number, s: number, o: { grow: number; sheen?: number }) {
  const g = clamp01(o.grow);
  if (g <= 0.01) return;
  const m = env.mood;
  const ink = mixLab(m.ink, m.set, 0.1);
  cord(c, env, x, y, CARD_DROP * s, s);
  c.save();
  c.translate(x, y + CARD_DROP * s);
  c.scale(g * s, g * s);
  // the hand mirror hangs by its handle's loop, glass down: loop, handle, oval frame, the glass
  c.strokeStyle = ink;
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(0, 3, 3.5, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-3.2, 6);
  c.lineTo(3.2, 6);
  c.lineTo(4.5, 30);
  c.lineTo(-4.5, 30);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(0, 54, 19, 25, 0, 0, Math.PI * 2);
  c.fill();
  // the glass: cool sheen (it reflects the light of whatever looks into it)
  const sh = clamp01(o.sheen ?? 0);
  const gl = c.createLinearGradient(-14, 32, 14, 78);
  gl.addColorStop(0, mixLab(m.setHaze, m.rim, 0.55 + 0.4 * sh));
  gl.addColorStop(0.45, mixLab(m.set, m.haze, 0.6));
  gl.addColorStop(0.55, mixLab(m.setHaze, m.rim, 0.35 + 0.5 * sh));
  gl.addColorStop(1, mixLab(m.set, m.haze, 0.45));
  c.fillStyle = gl;
  c.beginPath();
  c.ellipse(0, 54, 14.5, 20.5, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-7, 42);
  c.lineTo(5, 36);
  c.stroke();
  // the tag, tied at the handle: a small paper label
  c.strokeStyle = ink;
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(3.6, 18);
  c.lineTo(17, 24);
  c.stroke();
  c.fillStyle = mixLab(MOODS.parchment.sky[1], m.haze, 0.4);
  c.beginPath();
  c.moveTo(15, 20);
  c.lineTo(33, 20);
  c.lineTo(33, 32);
  c.lineTo(15, 32);
  c.lineTo(11, 26);
  c.closePath();
  c.fill();
  c.fillStyle = ink;
  c.beginPath();
  c.arc(15.5, 26, 1.3, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export function valueNote(c: C, env: PaintEnv, x: number, y: number, s: number, o: { grow: number }) {
  const g = clamp01(o.grow);
  if (g <= 0.01) return;
  const m = env.mood;
  const ink = mixLab(m.ink, m.set, 0.1);
  cord(c, env, x, y, CARD_DROP * s, s);
  c.save();
  c.translate(x, y + CARD_DROP * s);
  c.scale(g * s, g * s);
  c.rotate(0.04);
  const w = 46, h = 34;
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-w / 2 + 2, 4, w, h);
  c.fillStyle = mixLab(MOODS.parchment.sky[1], m.haze, 0.3);
  c.fillRect(-w / 2, 2, w, h);
  c.strokeStyle = ink;
  c.lineWidth = 1.2;
  c.strokeRect(-w / 2, 2, w, h);
  // the folded flap and a wax seal; a few lines of writing showing at the fold
  c.beginPath();
  c.moveTo(-w / 2, 2);
  c.lineTo(0, 2 + h * 0.5);
  c.lineTo(w / 2, 2);
  c.stroke();
  // (a deep umber seal, not red: the lantern's cyan stays the shot's one saturated accent)
  c.fillStyle = mixLab(ink, '#4a3a2c', 0.5);
  c.beginPath();
  c.arc(0, 2 + h * 0.5, 5.2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(ink, 0.35);
  c.lineWidth = 0.8;
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    c.moveTo(-w / 2 + 6, 2 + h * 0.66 + k * 4);
    c.lineTo(w / 2 - 6 - k * 6, 2 + h * 0.66 + k * 4);
    c.stroke();
  }
  c.restore();
}

/** a small brass knob (the film's 1958 potentiometer, a learned weight): knurled rim, a pointer at `angle` */
export function brassKnob(c: C, env: PaintEnv, x: number, y: number, r: number, angle: number, o: { grow?: number; glint?: number } = {}) {
  const g = clamp01(o.grow ?? 1);
  if (g <= 0.01) return;
  const m = env.mood;
  const brass = mixLab(mixLab(m.set, m.rim, 0.35), MOODS.dawnGold.rim, 0.35);
  const ink = mixLab(m.ink, m.set, 0.1);
  c.save();
  c.translate(x, y);
  c.scale(g, g);
  // a ring of ticks (the dial), then the knurled knob
  c.strokeStyle = withAlpha(m.rim, 0.45);
  c.lineWidth = Math.max(0.6, r * 0.06);
  c.beginPath();
  for (let k = 0; k <= 10; k++) {
    const a = -Math.PI * 1.25 + (k / 10) * Math.PI * 1.5;
    c.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25);
    c.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45);
  }
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  const n = 18;
  for (let k = 0; k <= n * 2; k++) {
    const a = (k / (n * 2)) * Math.PI * 2;
    const rr = k % 2 ? r : r * 0.9;
    if (k === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  c.fillStyle = brass;
  c.beginPath();
  c.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  c.fill();
  // the pointer
  c.strokeStyle = ink;
  c.lineWidth = Math.max(1, r * 0.16);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(Math.cos(angle) * r * 0.8, Math.sin(angle) * r * 0.8);
  c.stroke();
  const gl = clamp01(o.glint ?? 0);
  if (gl > 0.01) glow(c, 0, 0, r * 3.2, m.core, 0.35 * gl);
  c.restore();
}

/** the messenger (ch05): a dark bead in a ring of light */
export function messengerBead(c: C, env: PaintEnv, x: number, y: number, r: number, k: number) {
  if (k <= 0.01) return;
  const m = env.mood;
  glow(c, x, y, r * 3.8, m.rim, 0.34 * k);
  c.save();
  c.globalAlpha *= Math.min(1, 0.3 + k);
  c.fillStyle = mixLab(m.ink, m.set, 0.05);
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = m.core;
  c.lineWidth = Math.max(1.2, r * 0.22);
  c.beginPath();
  c.arc(x, y, r + 1, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}
