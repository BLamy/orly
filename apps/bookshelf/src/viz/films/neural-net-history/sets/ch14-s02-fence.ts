/**
 * ch14-s02 … ch14-s04 — the paper fence of rule pages across the strait, the two quays with their identical
 * lecterns, the left bank's chip tiles and chipmaking machine (generic, no marks).
 *
 *   ruleFence(c, env, { rise, t })   L3: a receding row of tall parchment rule pages standing in the water along the
 *                                     strait's middle, from just behind the jetty's end to the horizon. rise(i) → 0..1
 *                                     per page (0 = under water); page 0 is the nearest.
 *   quay(c, env, side)               L4: a paper-cut embankment at the frame's lower left/right (mirror placed)
 *   chipMachine(c, env, o)           L4: a generic lithography tool (long low body, a tall illumination column with a
 *                                     projection-lens stack over a wafer stage; no marks); rim 0..1
 *   chipTiles(c, env, o)             L4: a few flat black chip squares with pin legs; rim 0..1 (a glint on 'tools')
 *   lectern(c, env, o)               L4: a plain lectern (one panel line, no emblem)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { MOODS } from '../../../film/silhouette/palette';
import { h01 } from './ch14-s01-strait';

type C = CanvasRenderingContext2D;

export const FENCE_N = 24;
/** page i of the fence (left → right across the strait, mid-distance, L3 px): base on the water, height, width */
export function fencePage(i: number) {
  const x = 330 + i * 26.5;
  return { x, yb: 452, h: 82 + 14 * h01(i, 41), w: 27, lean: (i % 2 ? 1 : -1) * 0.03 + 0.035 };
}

/**
 * The paper fence ACROSS the strait: a row of tall parchment rule pages standing edge to edge in the water between
 * the two cities, behind the jetty's end. rise(i) 0..1 per page (0 = still under water).
 */
export function ruleFence(c: C, env: PaintEnv, o: { rise: (i: number) => number; light?: number }) {
  const m = env.mood;
  const P = MOODS.parchment;
  const paper = mixLab(mixLab(P.sky[2], m.halo, 0.4), m.setHaze, 0.42);
  const lit = o.light ?? 1;
  for (let i = 0; i < FENCE_N; i++) {
    const r = o.rise(i);
    if (r <= 0.001) continue;
    const g = fencePage(i);
    const top = g.yb - g.h * r;
    c.save();
    c.beginPath();
    c.rect(g.x - g.w, top - 12, g.w * 2, g.yb - top + 12);
    c.clip();
    c.translate(g.x, g.yb);
    c.transform(1, 0, g.lean, 1, 0, 0);
    c.translate(0, -g.h * r);
    // the sheet, lit from the dawn behind it (its top edge brighter), a slight curl at one corner
    const gr = c.createLinearGradient(0, 0, 0, g.h);
    gr.addColorStop(0, mixLab(paper, m.rim, 0.3 * lit));
    gr.addColorStop(1, mixLab(paper, m.set, 0.45));
    c.fillStyle = gr;
    c.beginPath();
    c.moveTo(-g.w / 2, 1.5);
    c.lineTo(g.w / 2 - 3, 0);
    c.quadraticCurveTo(g.w / 2, 0, g.w / 2, 3);
    c.lineTo(g.w / 2, g.h);
    c.lineTo(-g.w / 2, g.h);
    c.closePath();
    c.fill();
    // the seam between sheets
    c.fillStyle = withAlpha(m.set, 0.5);
    c.fillRect(g.w / 2 - 0.7, 2, 0.7, g.h);
    // the top edge catches the rim light from the dawn behind
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.85 * lit);
    c.fillRect(-g.w / 2, 0.6, g.w - 3, 1.4);
    // a heading bar and typed rule lines (texture)
    c.fillStyle = withAlpha(P.ink, 0.5);
    c.fillRect(-g.w * 0.36, 6, g.w * 0.5, 2);
    c.strokeStyle = withAlpha(P.ink, 0.32);
    c.lineWidth = 0.8;
    c.beginPath();
    for (let k = 0; k < 8; k++) {
      const y = 13 + k * 5.4;
      if (y > g.h - 4) break;
      const len = 0.55 + 0.4 * h01(k + i * 31, 7);
      c.moveTo(-g.w * 0.36, y);
      c.lineTo(-g.w * 0.36 + g.w * 0.72 * len, y);
    }
    c.stroke();
    c.restore();
    // its reflection in the water below
    if (r > 0.2) {
      c.save();
      c.globalAlpha = 0.18 * r;
      c.fillStyle = mixLab(paper, m.haze, 0.35);
      c.fillRect(g.x - g.w / 2, g.yb + 1.5, g.w - 1, g.h * 0.32 * r);
      c.restore();
    }
  }
  // where the pages meet the water: a thin line of foam
  const n = Array.from({ length: FENCE_N }, (_, i) => o.rise(i)).filter((r) => r > 0.05).length;
  if (n > 0) {
    c.fillStyle = withAlpha(m.rim, 0.35);
    c.fillRect(fencePage(0).x - 13.5, 451.5, n * 26.5, 1);
  }
}

/** a paper-cut embankment in the action plane at the frame's lower left (side −1) or right (+1) */
export function quay(c: C, env: PaintEnv, side: -1 | 1) {
  const m = env.mood;
  const X = (x: number) => (side < 0 ? x : 1280 - x);
  c.save();
  c.fillStyle = env.fill('set');
  c.beginPath();
  c.moveTo(X(-260), 596);
  c.lineTo(X(408), 596);
  c.lineTo(X(426), 616);
  c.lineTo(X(436), 900);
  c.lineTo(X(-260), 900);
  c.closePath();
  c.fill();
  // stone courses on the quay face, the top edge catching the dawn
  c.strokeStyle = withAlpha(m.rim, 0.12);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let y = 628; y < 760; y += 18) {
    c.moveTo(X(-260), y);
    c.lineTo(X(430 + (y - 616) * 0.035), y);
  }
  c.stroke();
  c.fillStyle = withAlpha(m.rim, 0.36);
  c.fillRect(Math.min(X(-260), X(408)), 595.4, 668, 1.2);
  // a mooring bollard near the water's edge
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.roundRect(X(380) - 6, 580, 12, 16, [5, 5, 1, 1]);
  c.fill();
  c.restore();
}

/** the chipmaking tool on the left bank: a generic lithography scanner in silhouette (no marks). A long low body with
 *  service panels; at its right end a tall illumination column, its projection-lens stack (stacked rings narrowing
 *  downward) over a wafer stage with one wafer on it. rim 0..1: the light that finds it on 'tools' */
export function chipMachine(c: C, env: PaintEnv, o: { x: number; y: number; s: number; rim?: number }) {
  const m = env.mood;
  const s = o.s;
  const ink = env.fill('ink');
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  c.fillStyle = ink;
  // the long low body (a slight step at its top), on a plinth
  c.fillRect(-160, -8, 300, 8);
  c.fillRect(-150, -66, 214, 60);
  c.fillRect(-140, -78, 150, 13);
  // the illumination column at the right end
  c.fillRect(64, -190, 60, 186);
  c.fillRect(58, -198, 72, 10);
  // the projection-lens stack hanging out of the column's front, over the wafer stage
  const rings: [number, number][] = [[46, -150], [42, -138], [38, -126], [34, -114], [30, -102], [26, -90]];
  for (const [w, y] of rings) {
    c.beginPath();
    c.roundRect(150 - w / 2, y, w, 11, 2);
    c.fill();
  }
  c.fillRect(124, -158, 14, 10);
  // the wafer stage: a flat table on a pedestal, the wafer a thin disc on it
  c.fillRect(144, -54, 12, 50);
  c.fillRect(118, -62, 64, 9);
  c.beginPath();
  c.ellipse(150, -64, 22, 2.6, 0, 0, Math.PI * 2);
  c.fill();
  // cut-lines: service-panel seams, a vent grille, the ring joints
  c.strokeStyle = withAlpha(m.rim, 0.2);
  c.lineWidth = 1;
  c.beginPath();
  for (let x = -120; x < 60; x += 36) {
    c.moveTo(x, -60);
    c.lineTo(x, -12);
  }
  c.moveTo(-150, -36);
  c.lineTo(64, -36);
  for (let y = -176; y < -110; y += 8) {
    c.moveTo(74, y);
    c.lineTo(114, y);
  }
  for (const [w, y] of rings) {
    c.moveTo(150 - w / 2 + 2, y + 11);
    c.lineTo(150 + w / 2 - 2, y + 11);
  }
  c.stroke();
  // the rim light that finds it on 'tools': the column's top and edge, the lens rings' right edges, the wafer
  const r = o.rim ?? 0;
  if (r > 0.01) {
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(m.rim, 0.8 * r);
    c.fillRect(58, -199, 72, 1.8);
    c.fillRect(122.4, -188, 1.8, 130);
    c.fillRect(-150, -67, 214, 1.6);
    c.fillRect(-140, -79, 150, 1.6);
    for (const [w, y] of rings) c.fillRect(150 + w / 2 - 2.4, y + 1, 1.8, 9);
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.5), 0.9 * r);
    c.fillRect(128, -66.6, 44, 1.4);
  }
  c.restore();
}

/** a few flat black chip squares with pin legs, propped on the quay; rim 0..1 glints their top edges on 'tools' */
export function chipTiles(c: C, env: PaintEnv, o: { x: number; y: number; s: number; dim?: number; rim?: number }) {
  const m = env.mood;
  const s = o.s;
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  const ink = env.fill('ink');
  const tiles: [number, number, number][] = [[0, 0, 0], [26, 0, -0.18], [13, -21, 0.1]];
  for (const [x, y, rot] of tiles) {
    c.save();
    c.translate(x, y - 11);
    c.rotate(rot);
    c.fillStyle = ink;
    c.fillRect(-9, -9, 18, 18);
    // pin legs on all four sides
    for (let k = 0; k < 4; k++) {
      const q = -6.5 + k * 4.3;
      c.fillRect(q, -12, 1.6, 3);
      c.fillRect(q, 9, 1.6, 3);
      c.fillRect(-12, q, 3, 1.6);
      c.fillRect(9, q, 3, 1.6);
    }
    const r = (o.rim ?? 0) * (1 - (o.dim ?? 0));
    if (r > 0.01) {
      c.fillStyle = withAlpha(m.rim, 0.75 * r);
      c.fillRect(-9, -9.6, 18, 1.3);
      c.fillRect(8, -9, 1.2, 18);
    }
    c.restore();
  }
  c.restore();
}

/** a plain lectern (identical on both banks): a tapered panelled body, a sloped desk, one panel line, no emblem */
export function lectern(c: C, env: PaintEnv, o: { x: number; y: number; s: number }) {
  const m = env.mood;
  const s = o.s;
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  c.fillStyle = env.fill('ink');
  c.fillRect(-36, -5, 72, 5);
  c.beginPath();
  c.moveTo(-30, -5);
  c.lineTo(30, -5);
  c.lineTo(33, -104);
  c.lineTo(-33, -104);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-38, -104);
  c.lineTo(38, -104);
  c.lineTo(38, -110);
  c.lineTo(-38, -117);
  c.closePath();
  c.fill();
  // one plain panel line across the front
  c.strokeStyle = withAlpha(m.rim, 0.26);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-28, -84);
  c.lineTo(28, -84);
  c.stroke();
  c.fillStyle = withAlpha(m.rim, 0.4);
  c.fillRect(-38, -117.6, 76, 1.4);
  c.restore();
}
