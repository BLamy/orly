/**
 * ch03-s04 — the Mark I installation (Cornell Aeronautical Laboratory, Buffalo, 1958–60) as a front-elevation
 * paper cut on the action plane, built big enough for a dolly to name each part as it reaches it:
 *
 *   markEye(c, { x, y, cells, lit }, env)         the photocell eye on its tripod: a deep box, its face a 20×20
 *                                                 grid of cells lit from inside (cells = the card it sees)
 *   markPatch(f, c, { x, y, key, swell }, env)    the cabinet stencilled MARK I, doors open: a lit panel behind a
 *                                                 harp of hundreds of patch cords wired at random (seeded, baked)
 *   markRack(c, { x, y, weights, turn }, env)     the rack stencilled PERCEPTRON: 8 × 8 potentiometer knobs, each
 *                                                 with its own small motor housing; pointers = the weights
 *   markResponse(c, { x, y, needle }, env)        the response unit: a dial on a short cabinet
 *   loomRun(c, { x0, x1, y }, env)                the strings from the knob rack into the response unit (the last
 *                                                 wires: only these carry knobs; the random wires behind have none)
 *   MARK                                          geometry (x of each unit's centre, cabinet height)
 *
 * (x, y) = the unit's base centre on the floor, layer world px. Values come from env.fill (hazed), the lit panel
 * from the mood's halo / rim (the patchboard's backlight is the installation's own practical).
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { h01 } from './ch03-s01-kit';

type C = CanvasRenderingContext2D;

export const MARK = {
  floor: 640,
  cabH: 352,
  eye: 404,
  patch: 640,
  patchW: 272,
  rack: 892,
  rackW: 262,
  resp: 1150,
  respW: 176,
  /** knob grid inside the rack */
  cols: 8,
  rows: 8,
} as const;

// ------------------------------------------------------------------------------------------------ stencils
function stencil(c: C, text: string, x: number, y: number, size: number, env: PaintEnv, alpha = 0.62, track = 0.28) {
  c.save();
  c.font = `400 ${size}px ${FONT.typewriter}`;
  c.letterSpacing = `${(size * track).toFixed(1)}px`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.3), alpha);
  c.fillText(text, x, y);
  c.restore();
}

/** a 1950s rack cabinet: plinth, body, a header band with louvres; returns the inner panel rect */
function cabinet(c: C, x: number, y: number, w: number, h: number, env: PaintEnv) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(x - w / 2 + 4, y - 8, w - 8, 8);
  c.beginPath();
  c.moveTo(x - w / 2, y - 8);
  c.lineTo(x - w / 2, y - h + 8);
  c.quadraticCurveTo(x - w / 2, y - h, x - w / 2 + 8, y - h);
  c.lineTo(x + w / 2 - 8, y - h);
  c.quadraticCurveTo(x + w / 2, y - h, x + w / 2, y - h + 8);
  c.lineTo(x + w / 2, y - 8);
  c.closePath();
  c.fill();
  // header band seam + a plinth louvre (cut-lines)
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(x - w / 2 + 6, y - h + 44);
  c.lineTo(x + w / 2 - 6, y - h + 44);
  for (let k = 0; k < 4; k++) {
    c.moveTo(x - w / 2 + 18, y - 22 - k * 6);
    c.lineTo(x + w / 2 - 18, y - 22 - k * 6);
  }
  c.stroke();
  return { x: x - w / 2 + 16, y: y - h + 56, w: w - 32, h: h - 100 };
}

// ------------------------------------------------------------------------------------------------ the eye
export const EYE = { face: 148, cell: 6.2, headY: 640 - 300 };
/** world centre of retina cell k (0..399, row-major) */
export function eyeCell(x: number, k: number) {
  const g = EYE.cell * 20;
  return { x: x - g / 2 + ((k % 20) + 0.5) * EYE.cell, y: EYE.headY - g / 2 + (Math.floor(k / 20) + 0.5) * EYE.cell };
}
export function markEye(c: C, o: { x: number; y: number; cells?: ArrayLike<number> | null; lit?: number }, env: PaintEnv) {
  const P = env.mood;
  const ink = env.fill('ink');
  const { x, y } = o;
  const hy = EYE.headY;
  const F = EYE.face;
  const lit = o.lit ?? 0;
  c.save();
  // tripod: three splayed legs and a column
  c.strokeStyle = ink;
  c.lineCap = 'butt';
  c.lineWidth = 9;
  c.beginPath();
  c.moveTo(x, hy + F / 2 + 30);
  c.lineTo(x - 70, y);
  c.moveTo(x, hy + F / 2 + 30);
  c.lineTo(x + 70, y);
  c.moveTo(x, hy + F / 2 + 30);
  c.lineTo(x + 8, y - 4);
  c.stroke();
  c.fillStyle = ink;
  c.fillRect(x - 9, hy + F / 2 - 4, 18, 40);
  c.fillRect(x - 30, hy + F / 2 - 10, 60, 10);
  // the housing: a deep box nearly face-on, its side depth on the left, a hood over the face
  c.beginPath();
  c.moveTo(x - F / 2 - 26, hy - F / 2 + 8);
  c.lineTo(x - F / 2, hy - F / 2 - 4);
  c.lineTo(x - F / 2, hy + F / 2 + 4);
  c.lineTo(x - F / 2 - 26, hy + F / 2 - 8);
  c.closePath();
  c.fill();
  c.beginPath();
  c.roundRect(x - F / 2 - 6, hy - F / 2 - 10, F + 12, F + 20, 6);
  c.fill();
  c.fillRect(x - F / 2 - 10, hy - F / 2 - 16, F + 20, 8);
  // handle on top + the cable from its back down to the floor
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(x - 22, hy - F / 2 - 16);
  c.quadraticCurveTo(x, hy - F / 2 - 34, x + 22, hy - F / 2 - 16);
  c.stroke();
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(x - F / 2 - 20, hy);
  c.bezierCurveTo(x - F / 2 - 70, hy + 40, x - F / 2 - 50, y - 30, x - F / 2 - 90, y - 3);
  c.stroke();
  // the face: 400 cells; unlit cells dim lenses, lit cells glowing (lit from inside)
  const g = EYE.cell * 20;
  c.fillStyle = mixLab(P.fg, P.set, 0.4);
  c.fillRect(x - g / 2 - 6, hy - g / 2 - 6, g + 12, g + 12);
  const dim = mixLab(P.set, P.halo, 0.12 + 0.2 * lit);
  const on = mixLab(P.halo, P.core, 0.65);
  for (let k = 0; k < 400; k++) {
    const p = eyeCell(x, k);
    const v = o.cells ? o.cells[k] : 0;
    c.fillStyle = v > 0 ? mixLab(dim, on, Math.min(1, v * (0.25 + 0.75 * lit))) : dim;
    c.beginPath();
    c.arc(p.x, p.y, EYE.cell * 0.38, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the patchboard
interface Cord {
  a: { x: number; y: number };
  b: { x: number; y: number };
  sag: number;
  w: number;
  bend: number;
}
function cords(panel: { x: number; y: number; w: number; h: number }, n: number, seed: number): Cord[] {
  // jacks in rows along the top and bottom of the panel and down the sides; cords patch them at random
  const out: Cord[] = [];
  const jx = (u: number) => panel.x + 8 + u * (panel.w - 16);
  for (let i = 0; i < n; i++) {
    const r = (k: number) => h01(i * 7 + k, seed);
    const top = r(1) < 0.78;
    const a = { x: jx(r(2)), y: top ? panel.y + 10 + 18 * Math.floor(r(3) * 3) : panel.y + panel.h * (0.25 + 0.35 * r(3)) };
    // mostly to the lower jack field, some long throws across
    const throwX = r(4) < 0.85 ? (r(5) - 0.5) * 46 : (r(5) - 0.5) * panel.w * 0.9;
    const b = { x: Math.max(panel.x + 6, Math.min(panel.x + panel.w - 6, a.x + throwX)), y: panel.y + panel.h - 10 - 18 * Math.floor(r(6) * 4) };
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    out.push({ a, b, sag: 4 + len * (0.03 + 0.07 * r(7)), w: 0.7 + 1.2 * r(8) * r(8), bend: r(9) - 0.5 });
  }
  return out;
}
export function markPatch(f: Frame, c: C, o: { x: number; y: number; key: string; swell?: number }, env: PaintEnv) {
  const { x, y } = o;
  const w = MARK.patchW, h = MARK.cabH;
  const P = env.mood;
  const r = { x: x - w / 2 - 70, y: y - h - 20, w: w + 140, h: h + 30 };
  f.cached(`${o.key}/patch/${P.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    const panel = cabinet(cc, x, y, w, h, env);
    // the open doors, swung out (thin trapezoids either side)
    cc.fillStyle = env.fill('ink');
    for (const s of [-1, 1]) {
      const ex = x + (s * w) / 2;
      cc.beginPath();
      cc.moveTo(ex, y - h + 10);
      cc.lineTo(ex + s * 52, y - h + 24);
      cc.lineTo(ex + s * 52, y - 26);
      cc.lineTo(ex, y - 14);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(P.rim, 0.18);
      cc.lineWidth = 1;
      cc.beginPath();
      cc.moveTo(ex + s * 10, y - h + 30);
      cc.lineTo(ex + s * 44, y - h + 40);
      cc.lineTo(ex + s * 44, y - 44);
      cc.lineTo(ex + s * 10, y - 34);
      cc.closePath();
      cc.stroke();
    }
    // the lit panel (the cabinet's own lamp behind a diffuser): a HOLE of light
    const g = cc.createLinearGradient(0, panel.y, 0, panel.y + panel.h);
    g.addColorStop(0, mixLab(P.halo, P.rim, 0.25));
    g.addColorStop(0.5, mixLab(P.halo, P.core, 0.2));
    g.addColorStop(1, mixLab(P.setHaze, P.halo, 0.6));
    cc.fillStyle = g;
    cc.fillRect(panel.x, panel.y, panel.w, panel.h);
    // jack fields (tiny dark dots)
    cc.fillStyle = withAlpha(P.ink, 0.55);
    for (let row = 0; row < 3; row++) for (let k = 0; k < 30; k++) cc.fillRect(panel.x + 8 + (k * (panel.w - 16)) / 29 - 1, panel.y + 9 + row * 18, 2, 2);
    for (let row = 0; row < 4; row++) for (let k = 0; k < 30; k++) cc.fillRect(panel.x + 8 + (k * (panel.w - 16)) / 29 - 1, panel.y + panel.h - 11 - row * 18, 2, 2);
    // the harp: a back layer of thin lifted cords, then the dark mass, then a few heavy front cords
    // (clipped to the lit panel: every cord reads as a dark string against the light)
    const all = cords(panel, 210, 1958);
    cc.save();
    cc.beginPath();
    cc.rect(panel.x, panel.y, panel.w, panel.h);
    cc.clip();
    cc.lineCap = 'round';
    all.forEach((cd, i) => {
      const layer = i % 5;
      cc.strokeStyle = layer === 0 ? withAlpha(mixLab(P.ink, P.halo, 0.45), 0.7) : P.ink;
      cc.lineWidth = layer === 0 ? 0.6 : cd.w;
      cc.beginPath();
      cc.moveTo(cd.a.x, cd.a.y);
      // strung like a harp: mostly vertical runs that belly sideways and sag a little under their weight
      cc.quadraticCurveTo((cd.a.x + cd.b.x) / 2 + cd.bend * cd.sag * 1.2, (cd.a.y + cd.b.y) / 2 + cd.sag * 0.6, cd.b.x, cd.b.y);
      cc.stroke();
    });
    cc.restore();
    // stencil on the header band
    // (round 1: sized to the 22 px cap-height floor at 1080p: the stencils name the machine while the dolly passes)
    stencil(cc, 'MARK I', x, y - h + 25, 31, env, 0.72, 0.2);
  })(c, r.x, r.y);
  // the panel's light swells on 'wires' (additive, through the harp)
  const sw = o.swell ?? 0;
  if (sw > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const cy = y - h / 2 - 10;
    const gg = c.createRadialGradient(x, cy, 10, x, cy, 260);
    gg.addColorStop(0, withAlpha(P.halo, 0.32 * sw));
    gg.addColorStop(1, withAlpha(P.halo, 0));
    c.fillStyle = gg;
    c.fillRect(x - 260, cy - 260, 520, 520);
    c.restore();
  }
}

// ------------------------------------------------------------------------------------------------ the knob rack
export function rackKnob(x: number, y: number, i: number) {
  const w = MARK.rackW, h = MARK.cabH;
  const gx0 = x - w / 2 + 34, gx1 = x + w / 2 - 34;
  const gy0 = y - h + 74, gy1 = y - 62;
  const col = i % MARK.cols, row = Math.floor(i / MARK.cols);
  return { x: gx0 + (col * (gx1 - gx0)) / (MARK.cols - 1), y: gy0 + (row * (gy1 - gy0)) / (MARK.rows - 1) };
}
export function markRack(c: C, o: { x: number; y: number; weights: ArrayLike<number>; wMax: number; turn?: ArrayLike<number> }, env: PaintEnv) {
  const P = env.mood;
  const { x, y } = o;
  cabinet(c, x, y, MARK.rackW, MARK.cabH, env);
  stencil(c, 'PERCEPTRON', x, y - MARK.cabH + 25, 29, env, 0.72, 0.1);
  const ink = env.fill('ink');
  for (let i = 0; i < MARK.cols * MARK.rows; i++) {
    const p = rackKnob(x, y, i);
    const turning = o.turn ? o.turn[i] : 0;
    // the motor housing: a small drum above-right of each knob, rim-lit; it hums while it turns
    const jit = turning > 0 ? (h01(Math.floor(env.t * 24), i) - 0.5) * 1.2 : 0;
    c.fillStyle = mixLab(ink, P.set, 0.25);
    c.fillRect(p.x + 4 + jit, p.y - 15, 9, 8);
    c.fillStyle = withAlpha(P.rim, 0.25 + 0.5 * turning);
    c.fillRect(p.x + 4 + jit, p.y - 15, 9, 1.2);
    // the knob: a skirt with ticks, a lit pointer = the weight
    c.fillStyle = mixLab(P.fg, P.set, 0.3);
    c.beginPath();
    c.arc(p.x, p.y, 9.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(P.rim, 0.28 + 0.5 * turning);
    c.lineWidth = 1;
    c.stroke();
    const w = o.weights[i] ?? 0;
    const ang = -Math.PI / 2 + Math.max(-1, Math.min(1, w / o.wMax)) * Math.PI * 0.8;
    c.strokeStyle = mixLab(P.rim, P.core, 0.3 + 0.6 * turning);
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(p.x + Math.cos(ang) * 8, p.y + Math.sin(ang) * 8);
    c.stroke();
  }
}

// ------------------------------------------------------------------------------------------------ response unit
export function markResponse(c: C, o: { x: number; y: number; needle: number; lit?: number }, env: PaintEnv) {
  const P = env.mood;
  const { x, y } = o;
  const h = 250, w = MARK.respW;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(x - w / 2 + 4, y - 8, w - 8, 8);
  c.fillRect(x - w / 2, y - h, w, h - 8);
  // a raked meter bridge on top with the big dial (a lit window)
  c.beginPath();
  c.moveTo(x - w / 2 + 8, y - h);
  c.lineTo(x - w / 2 + 22, y - h - 110);
  c.lineTo(x + w / 2 - 22, y - h - 110);
  c.lineTo(x + w / 2 - 8, y - h);
  c.closePath();
  c.fill();
  const cx = x, cy = y - h - 30, R = 56;
  c.fillStyle = mixLab(P.set, P.halo, 0.45 + 0.25 * (o.lit ?? 0));
  c.beginPath();
  c.arc(cx, cy, R, Math.PI, 0);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(P.ink, 0.7);
  c.lineWidth = 1;
  for (let k = -6; k <= 6; k++) {
    const a = -Math.PI / 2 + (k / 6) * Math.PI * 0.42;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.74);
    c.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9);
    c.stroke();
  }
  const na = -Math.PI / 2 + o.needle * Math.PI * 0.42;
  c.strokeStyle = ink;
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(cx + Math.cos(na) * R * 0.86, cy + Math.sin(na) * R * 0.86);
  c.stroke();
  // switches and two lamps on the panel
  c.strokeStyle = withAlpha(P.rim, 0.22);
  c.strokeRect(x - w / 2 + 14, y - h + 20, w - 28, h - 70);
  c.fillStyle = withAlpha(P.rim, 0.35);
  for (let k = 0; k < 8; k++) c.fillRect(x - w / 2 + 26 + k * 16, y - h + 40, 3, 9);
}

/** the loom: strings from the knob rack's top into the response unit (drawn sagging, over the gap) */
export function loomRun(c: C, o: { x0: number; x1: number; y: number; n?: number; alpha?: number }, env: PaintEnv) {
  const n = o.n ?? 16;
  c.save();
  c.strokeStyle = withAlpha(env.fill('ink'), o.alpha ?? 1);
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const y0 = o.y + i * 1.6;
    c.lineWidth = 1 + (i % 3 === 0 ? 0.8 : 0);
    c.beginPath();
    c.moveTo(o.x0, y0);
    c.quadraticCurveTo((o.x0 + o.x1) / 2, y0 + 30 + i * 2.2, o.x1, y0 + 12);
    c.stroke();
  }
  c.restore();
}
