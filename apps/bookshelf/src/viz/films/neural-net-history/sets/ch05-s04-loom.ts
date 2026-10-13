/**
 * ch05-s04 — THE LOOM, 9 October 1986: a real 2-2-1 network (XOR_221, trained offline in mlp.ts) hung as
 * paper lanterns on a loom so that light really flows UP and the messenger really runs back DOWN.
 *
 * Every visual variable is bound to the network (style bible §6):
 *   lantern glow        ← unit activation (sigmoid) for the presented input
 *   string width/colour ← |w| / sign (warm +, cool −), from netAt(XOR_221, epoch)
 *   knob pointer        ← the weight (a Mark I potentiometer callback): angle ∝ w; it is TURNED by the
 *                         messenger's tug, in the direction of −dL/dw, by an amount ∝ |dL/dw|
 *   forward knot        ← |w·a| travelling up the string
 *   messenger bead      ← |dL/dw| (a dark bead in a ring of light) travelling down the string; it pauses on
 *                         each knob, where the string swells by its share of the blame
 *   hidden-lantern ring ← |blame(j)| = slope(j) · Σ blame · w, gathered as the bead arrives
 *   error ember         ← |ŷ − target| (a low-chroma ember: emberRed mixed ~60% into the dawnGold rim)
 *
 *   LOOM                         geometry (L4 world): frame, beam, unit positions, slips, breast beam
 *   loomFrame(c, env, o)         the loom: uprights, top beam, breast beam (with the prop lettering), journal strip
 *   loomNet(c, o, env)           strings, knobs, knots, beads, cords, lanterns, labels, readout
 *   targetSlips(c, o, env)       the four XOR target tags hanging from the beam (digits only)
 *   familyTrees(c, o, env)       two identical paper-cut family trees + a row of six hidden lanterns between
 *   equationCard(c, o)           the backprop rule on a small parchment card (screen-locked)
 */
import type { PaintEnv, Palette } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, softPlate } from '../../../film/silhouette/type';
import { glow, knot, paperLantern, weightColor, weightWidth } from '../../../film/silhouette/metaphors/kit';
import { XOR_221, forward, grads, lossAt, netAt } from '../../../film/silhouette/metaphors/mlp';
import { hash1 } from '../../../film/core/frame';
import { bust5 } from './ch05-s01-hall';

type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export const LOOM = {
  cx: 1000,
  beamY: 92,
  beamX0: 700,
  beamX1: 1300,
  /** uprights */
  postX: [716, 1284],
  floorY: 640,
  breastY: 548,
  /** unit centres per layer (input at the bottom, output at the top) */
  units: [
    [
      { x: 850, y: 446 },
      { x: 1150, y: 446 },
    ],
    [
      { x: 905, y: 318 },
      { x: 1095, y: 318 },
    ],
    [{ x: 1000, y: 186 }],
  ],
  r: [26, 28, 31],
  /** the four target slips hang from the beam at these x (right of the output) */
  slipX: [1112, 1160, 1208, 1256],
  slipY: 138,
  /** the journal strip pinned at the beam's left end */
  strip: { x: 872, y: 108, w: 120, h: 40 },
};

/** the error ember: emberRed mixed ~60% into the mood's rim (the oxblood recipe; never full red) */
export const ember = (m: Palette) => mixLab(m.rim, MOODS.emberRed.rim, 0.6);

// ------------------------------------------------------------------ the frame
export function loomFrame(c: C, env: PaintEnv, o: { lettering: number; strip: number }) {
  const m = env.mood;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  // uprights with feet, the top beam with end finials, the breast beam
  for (const px of LOOM.postX) {
    c.fillRect(px - 7, LOOM.beamY - 14, 14, LOOM.floorY - LOOM.beamY + 14);
    c.fillRect(px - 26, LOOM.floorY - 10, 52, 10);
    c.beginPath();
    c.arc(px, LOOM.beamY - 18, 10, 0, Math.PI * 2);
    c.fill();
  }
  c.fillRect(LOOM.beamX0 - 30, LOOM.beamY - 8, LOOM.beamX1 - LOOM.beamX0 + 60, 16);
  c.fillRect(LOOM.beamX0 - 20, LOOM.beamY + 10, LOOM.beamX1 - LOOM.beamX0 + 40, 3);
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(LOOM.beamX0 - 30, LOOM.beamY - 8, LOOM.beamX1 - LOOM.beamX0 + 60, 1.2);
  // the breast beam: a board across the bottom of the loom
  const by = LOOM.breastY;
  c.fillStyle = ink;
  c.fillRect(LOOM.postX[0] - 10, by, LOOM.postX[1] - LOOM.postX[0] + 20, 58);
  // its prop lettering: cut-paper capitals in two lines on a pale strip, lit by the lamp on 'Again'
  // (sized to the 22 px cap floor at the training framing; it is read through the scrub and the check)
  const L = o.lettering;
  const paper = mixLab(mixLab(m.set, m.setHaze, 0.35), mixLab(m.halo, m.rim, 0.5), 0.05 + 0.8 * L);
  c.fillStyle = paper;
  c.fillRect(LOOM.cx - 272, by + 4, 544, 50);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = withAlpha(m.ink, 0.28 + 0.67 * L);
  c.letterSpacing = '1px';
  c.font = `400 23px ${FONT.fellSC}`;
  const l1 = 'THE 1986 METHOD, ON EXCLUSIVE-OR';
  const w1 = c.measureText(l1).width;
  if (w1 > 528) c.font = `400 ${(23 * 528) / w1}px ${FONT.fellSC}`;
  c.fillText(l1, LOOM.cx, by + 18);
  c.font = `400 23px ${FONT.fellSC}`;
  c.fillText('·  A DEMONSTRATION  ·', LOOM.cx, by + 41);
  c.letterSpacing = '0px';
  // the journal clipping pinned under the beam, right of the left post
  if (o.strip > 0.003) {
    const S = LOOM.strip;
    c.save();
    c.globalAlpha *= o.strip;
    journalClipping(c, { x: S.x, y: S.y, w: S.w, h: S.h, rot: -0.03, paper: mixLab(m.haze, m.core, 0.5) }, m);
    c.restore();
  }
}

/**
 * The 1986 paper as a PRINTED CLIPPING (shared by ch05-s04's loom and ch05-s06's case board): newsprint, a
 * small dark masthead block (~30% width), thin grey column rules of type, a torn bottom edge, a brass pin.
 * (x, y) = the pin, at the top centre.
 */
export function journalClipping(c: C, o: { x: number; y: number; w: number; h: number; rot?: number; paper: string; masthead?: string; mastSize?: number }, m: Palette) {
  const { w, h } = o;
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  const torn = (dx: number, dy: number) => {
    c.beginPath();
    c.moveTo(-w / 2 + dx, dy);
    c.lineTo(w / 2 + dx, dy);
    c.lineTo(w / 2 + dx, h - 3 + dy);
    const n = 14;
    for (let k = n; k >= 0; k--) c.lineTo(-w / 2 + (w * k) / n + dx, h - 3 + dy + 2.6 * (0.5 + 0.5 * hash1(k, 77)));
    c.closePath();
  };
  c.fillStyle = withAlpha(m.fg, 0.35);
  torn(2.5, 3);
  c.fill();
  c.fillStyle = o.paper;
  torn(0, 0);
  c.fill();
  // the masthead: ONE legible word in a heavy serif (review round 1: no fake-text bars), a double rule under
  // it, and the rest of the clipping left plainly blank newsprint
  const ink = mixLab(m.ink, o.paper, 0.12);
  const word = o.masthead ?? 'NATURE';
  let fs = o.mastSize ?? h * 0.4;
  c.font = `700 ${fs}px ${FONT.display}`;
  const mw = c.measureText(word).width;
  if (mw > w - 12) {
    fs *= (w - 12) / mw;
    c.font = `700 ${fs}px ${FONT.display}`;
  }
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  const by = 5 + fs * 0.92;
  c.fillText(word, 0, by);
  c.fillStyle = withAlpha(mixLab(m.ink, o.paper, 0.4), 0.9);
  c.fillRect(-w / 2 + 6, by + fs * 0.18, w - 12, Math.max(0.8, fs * 0.05));
  c.fillRect(-w / 2 + 6, by + fs * 0.18 + fs * 0.1, w - 12, Math.max(0.5, fs * 0.025));
  // the brass pin
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.beginPath();
  c.arc(0, 2, 3.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ------------------------------------------------------------------ the network
export interface LoomNetOpts {
  epoch: number;
  /** presented input */
  x: number[];
  /** its target (for the error, the messenger) */
  y?: number;
  /** forward wave 0..2 */
  wave: number;
  /** messenger 0..2: 0–1 output→hidden strings, 1–2 hidden→input strings (u = position down each string) */
  back: number;
  /** 0..1 the error ember on the output */
  error: number;
  /** knob nudges already made (persist after the tug): 0..1 per weight layer */
  nudged: [number, number];
  /** labels / readout alpha */
  labels: number;
  readout: number;
  /** overall dimming of everything but the lanterns (the stage at the end) */
  dim?: number;
  /** extra glow on the hidden lanterns (the held, trained pattern) */
  hiddenHold?: number;
  /** 0..1 per weight layer: show each knob's tug (a curved arrow of the turn and its + / − sign) */
  tugs?: [number, number];
  /** 0..1 keep the hidden lanterns' blame rings after the messenger has passed */
  gathered?: number;
  /** knob radius (layer px) */
  knobR?: number;
}

/** where the messenger's knob sits on each string (fraction from the upper end) */
const KNOB_U = 0.5;

function stringGeom(l: number, j: number, i: number) {
  // string from unit i of layer l (lower) to unit j of layer l+1 (upper): from the lower lantern's crown
  // to the upper lantern's foot
  const lo = LOOM.units[l][i], up = LOOM.units[l + 1][j];
  const rl = LOOM.r[l], ru = LOOM.r[l + 1];
  return { x0: lo.x, y0: lo.y - rl * 1.25, x1: up.x, y1: up.y + ru * 1.12 };
}
function onString(s: { x0: number; y0: number; x1: number; y1: number }, bow: number, u: number) {
  // u = 0 at the lower end, 1 at the upper; a gentle bow sideways (strings are not quite taut)
  const mx = (s.x0 + s.x1) / 2, my = (s.y0 + s.y1) / 2;
  const dx = s.x1 - s.x0, dy = s.y1 - s.y0;
  const L = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / L) * bow, cy = my + (dx / L) * bow;
  const v = 1 - u;
  return { x: v * v * s.x0 + 2 * v * u * cx + u * u * s.x1, y: v * v * s.y0 + 2 * v * u * cy + u * u * s.y1, cx, cy };
}

/** the knob: a knurled cap with a pointer, on a small bracket where the string is tied */
function drawKnob(c: C, x: number, y: number, r: number, angle: number, env: PaintEnv, lit: number) {
  const m = env.mood;
  const ink = env.fill('ink');
  c.save();
  c.translate(x, y);
  c.fillStyle = ink;
  c.beginPath();
  const teeth = 14;
  for (let k = 0; k <= teeth * 2; k++) {
    const a = (k / (teeth * 2)) * Math.PI * 2;
    const rr = k % 2 ? r : r * 0.86;
    if (k === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  c.rotate(angle);
  c.strokeStyle = mixLab(m.rim, m.core, 0.3 * lit);
  c.globalAlpha *= 0.65 + 0.35 * lit;
  c.lineWidth = Math.max(1, r * 0.22);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -r * 0.72);
  c.stroke();
  c.restore();
}

/**
 * The tug made visible: a curved arrow round the knob from its old pointer angle to the new one (the turn
 * the messenger gave it, toward −dL/dw), and the sign of that turn (+ the weight grows, − it shrinks)
 * cut beside it on the knob's outer side.
 */
function tugMark(c: C, x: number, y: number, r: number, base: number, turn: number, dir: number, k: number, side: number, env: PaintEnv) {
  const m = env.mood;
  const col = mixLab(m.core, m.halo, 0.3);
  const R = r * 1.75;
  const a0 = -Math.PI / 2 + base;
  const a1 = a0 + turn * Math.min(1, k * 1.4);
  c.save();
  glow(c, x, y, r * 3.2, m.rim, 0.22 * k);
  c.globalAlpha *= Math.min(1, k * 1.3);
  c.strokeStyle = col;
  c.lineWidth = 2.2;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(x, y, R, a0, a1, turn < 0);
  c.stroke();
  // the arrowhead at the arc's end, along its tangent
  const tx = -Math.sin(a1) * Math.sign(turn), ty = Math.cos(a1) * Math.sign(turn);
  const hx = x + Math.cos(a1) * R, hy = y + Math.sin(a1) * R;
  const nx = Math.cos(a1), ny = Math.sin(a1);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(hx + tx * 6, hy + ty * 6);
  c.lineTo(hx - tx * 2 + nx * 4.5, hy - ty * 2 + ny * 4.5);
  c.lineTo(hx - tx * 2 - nx * 4.5, hy - ty * 2 - ny * 4.5);
  c.closePath();
  c.fill();
  // the sign, on a small dark disc so it reads over strings
  const sx = x + side * (R + 17), sy = y - 2;
  c.fillStyle = withAlpha(m.ink, 0.72);
  c.beginPath();
  c.arc(sx, sy, 13, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = col;
  c.font = `600 30px ${FONT.text}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(dir > 0 ? '+' : '−', sx, sy + 1);
  c.restore();
}

/** the messenger: a dark bead in a ring of light */
function bead(c: C, x: number, y: number, r: number, k: number, env: PaintEnv) {
  if (k <= 0.01) return;
  const m = env.mood;
  glow(c, x, y, r * 3.6, m.rim, 0.32 * k);
  c.save();
  c.globalAlpha *= Math.min(1, 0.3 + k);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = m.core;
  c.lineWidth = 1.8;
  c.beginPath();
  c.arc(x, y, r + 1, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

function maxAbsW(net: { W: number[][][] }) {
  let mx = 1e-6;
  for (const l of net.W) for (const r of l) for (const w of r) mx = Math.max(mx, Math.abs(w));
  return Math.max(mx, 4);
}

export function loomNet(c: C, o: LoomNetOpts, env: PaintEnv) {
  const m = env.mood;
  const tr = XOR_221;
  const net = netAt(tr, o.epoch);
  const { a } = forward(net, o.x);
  const hasT = o.y !== undefined;
  const g = hasT ? grads(net, o.x, [o.y as number]) : null;
  const wMax = maxAbsW(net);
  const ink = env.fill('ink');
  const dim = o.dim ?? 0;
  const litLayer = (l: number) => (l === 0 ? sm(o.wave / 0.25) : sm((o.wave - (l - 0.25)) / 0.25));

  // strings, knobs, knots and the messenger
  for (let l = 0; l < 2; l++) {
    const gMax = g ? Math.max(1e-6, ...g.gW[l].flat().map(Math.abs)) : 1;
    for (let j = 0; j < net.W[l].length; j++)
      for (let i = 0; i < net.W[l][j].length; i++) {
        const w = net.W[l][j][i];
        const S = stringGeom(l, j, i);
        const bow = (i === j ? 1 : -1) * 6 / (1 + Math.abs(w) * 0.3);
        // the messenger on this string: segment 1 - l of the backward pass, u = 0 at the upper end
        const seg = 1 - l;
        const bu = o.back - seg; // 0..1 along this string from the top
        const onIt = bu > 0 && bu < 1;
        const gN = g ? Math.min(1, Math.abs(g.gW[l][j][i]) / gMax) : 0;
        const tug = onIt ? Math.exp(-(((bu - KNOB_U) / 0.09) ** 2)) : 0;
        const lit = litLayer(l + 1) * 0.6;
        const col = mixLab(weightColor(m, w), m.core, 0.22 * lit + 0.2 * tug * gN);
        c.save();
        c.globalAlpha *= (0.55 + 0.3 * lit + 0.15 * tug) * (1 - 0.35 * dim);
        c.strokeStyle = col;
        c.lineCap = 'round';
        c.lineWidth = weightWidth(w, wMax) * (1 + 1.1 * tug * gN);
        const mid = onString(S, bow, 0.5);
        c.beginPath();
        c.moveTo(S.x0, S.y0);
        c.quadraticCurveTo(mid.cx, mid.cy, S.x1, S.y1);
        c.stroke();
        c.restore();
        // the knob at the string's midpoint: pointer = the weight; the tug turns it toward −dL/dw
        const kp = onString(S, bow, 1 - KNOB_U);
        const dir = g ? -Math.sign(g.gW[l][j][i]) : 0;
        const turn = dir * (0.35 + 0.55 * gN);
        const nudge = turn * Math.max(o.nudged[l], tug);
        const base = Math.max(-2.4, Math.min(2.4, w * 0.32));
        const kr = o.knobR ?? 9;
        const tk = o.tugs ? o.tugs[l] : 0;
        drawKnob(c, kp.x, kp.y, kr, base + nudge, env, Math.max(lit, tug, tk));
        if (tk > 0.01 && g) tugMark(c, kp.x, kp.y, kr, base, turn, dir, tk, kp.x < LOOM.cx ? -1 : 1, env);
        // forward knot: |w·a| travelling up
        if (o.wave > l && o.wave < l + 1) {
          const u = sm((o.wave - l) / 0.85);
          const p = onString(S, bow, u);
          const contrib = Math.min(1, Math.abs(w * a[l][i]) / 6);
          knot(c, p.x, p.y, 3 + 4 * contrib, 0.3 + 0.7 * contrib, env);
        }
        // the messenger: one bead per string, sized by |dL/dw|
        if (g && onIt) {
          const p = onString(S, bow, 1 - bu);
          bead(c, p.x, p.y, 4.5 + 4.5 * gN, 0.45 + 0.55 * gN, env);
        }
      }
  }

  // cords from the beam (behind the lanterns): the lower lanterns' cords pass behind the upper ones
  c.save();
  c.strokeStyle = ink;
  c.lineWidth = 1.1;
  c.beginPath();
  LOOM.units.forEach((row, l) =>
    row.forEach((p) => {
      c.moveTo(p.x, LOOM.beamY + 8);
      c.lineTo(p.x, p.y - LOOM.r[l] * 1.18);
    }),
  );
  c.stroke();
  c.restore();

  // lanterns
  for (let l = 0; l <= 2; l++)
    LOOM.units[l].forEach((p, i) => {
      let act = a[l][i] * litLayer(l);
      if (l === 1 && o.hiddenHold) act = Math.max(act, a[l][i] * o.hiddenHold);
      // the messenger gathering at a hidden lantern: a ring sized by |blame(j)|
      paperLantern(c, { x: p.x, y: p.y, r: LOOM.r[l], act, flare: 0, tassel: l !== 2, alpha: 1 }, env);
      if (l === 1 && g) {
        const pass = Math.exp(-(((o.back - 1) / 0.12) ** 2));
        const near = Math.max(pass, 0.7 * (o.gathered ?? 0));
        const dj = Math.min(1, Math.abs(g.delta[1][i]) / Math.max(1e-6, Math.abs(g.delta[1][0]) + Math.abs(g.delta[1][1])) * 1.6);
        if (near > 0.02) {
          c.save();
          c.strokeStyle = withAlpha(m.core, 0.75 * near);
          c.lineWidth = 2;
          c.beginPath();
          c.arc(p.x, p.y, LOOM.r[l] * (1.35 + 0.5 * dj), 0, Math.PI * 2);
          c.stroke();
          c.restore();
          glow(c, p.x, p.y, LOOM.r[l] * 2.6, m.rim, 0.25 * near * (0.4 + dj));
          bead(c, p.x, p.y + LOOM.r[l] * 1.25, 4.5 + 4 * dj, pass, env);
        }
      }
    });
  // the error ember on the output
  const out = LOOM.units[2][0];
  if (o.error > 0.01 && hasT) {
    const e = Math.abs(a[2][0] - (o.y as number));
    const col = ember(m);
    c.save();
    c.strokeStyle = withAlpha(col, 0.9 * o.error);
    c.lineWidth = 2.6 + 3 * e;
    c.beginPath();
    c.arc(out.x, out.y, LOOM.r[2] * 1.32, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    glow(c, out.x, out.y, LOOM.r[2] * 3.2, col, 0.32 * o.error * (0.5 + e));
    // the messenger forming at the output
    if (o.back > 0 && o.back < 0.12) bead(c, out.x, out.y + LOOM.r[2] * 1.15, 8, 1 - o.back / 0.12, env);
  }

  // labels: the inputs' values, ŷ, the layer names (small caps, at the left of each row)
  if (o.labels > 0.01) {
    const la = o.labels;
    c.save();
    c.textBaseline = 'alphabetic';
    c.font = `italic 400 22px ${FONT.text}`;
    c.textAlign = 'center';
    LOOM.units[0].forEach((p, i) => {
      c.globalAlpha = la * (0.6 + 0.4 * litLayer(0));
      c.fillStyle = mixLab(m.rim, m.core, 0.3);
      c.textAlign = i ? 'left' : 'right';
      c.fillText(`x${i ? '₂' : '₁'} = ${Math.round(o.x[i])}`, p.x + (i ? 1 : -1) * LOOM.r[0] * 1.2, p.y + LOOM.r[0] * 1.62);
    });
    c.globalAlpha = la * litLayer(2);
    c.font = `italic 400 24px ${FONT.text}`;
    c.textAlign = 'right';
    c.fillStyle = m.core;
    c.fillText(`ŷ = ${a[2][0].toFixed(2)}`, out.x - LOOM.r[2] * 1.6, out.y + 8);
    c.font = `600 19px ${FONT.sc}`;
    c.letterSpacing = '3px';
    c.textAlign = 'left';
    c.fillStyle = withAlpha(m.rim, 0.85);
    c.globalAlpha = la * 0.8;
    c.fillText('OUTPUT', LOOM.postX[0] + 18, LOOM.units[2][0].y + 6);
    c.fillText('HIDDEN', LOOM.postX[0] + 18, LOOM.units[1][0].y + 6);
    c.fillText('INPUT', LOOM.postX[0] + 18, LOOM.units[0][0].y + 6);
    c.letterSpacing = '0px';
    c.restore();
  }
  if (o.readout > 0.01) {
    c.save();
    c.globalAlpha = o.readout;
    c.font = `italic 400 21px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.25), 0.95);
    c.fillText(`epoch ${Math.round(o.epoch)}   ·   loss ${lossAt(tr, o.epoch).toFixed(3)}`, LOOM.cx, LOOM.breastY - 16);
    c.restore();
  }
}

// ------------------------------------------------------------------ the target slips
export const SLIPS = [
  { x: [0, 0], y: 0 },
  { x: [0, 1], y: 1 },
  { x: [1, 0], y: 1 },
  { x: [1, 1], y: 0 },
];
/**
 * The four target tags hang from the beam right of the output. lift (per slip 0..1) carries a tag to the
 * output lantern's side for comparison; tick (per slip 0..1) marks it matched (a cut-out tick).
 */
export function targetSlips(c: C, o: { lift: number[]; tick: number[]; hot: number[]; t: number }, env: PaintEnv) {
  const m = env.mood;
  const out = LOOM.units[2][0];
  SLIPS.forEach((s, k) => {
    const hx = LOOM.slipX[k];
    const lift = sm(o.lift[k]);
    const sway = 0.03 * Math.sin(o.t * 1.3 + k * 1.7);
    const x = lerp(hx, out.x + LOOM.r[2] * 1.5 + 14, lift);
    const y = lerp(LOOM.slipY, out.y - 20, lift);
    const w = 44, h = 58;
    // the thread up to the beam (or to its lifted position)
    c.strokeStyle = env.fill('ink');
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(hx, LOOM.beamY + 8);
    c.lineTo(x, y);
    c.stroke();
    c.save();
    c.translate(x, y);
    c.rotate(sway * (1 - lift));
    const light = 0.45 + 0.4 * lift + 0.3 * o.hot[k];
    c.fillStyle = withAlpha(m.fg, 0.35);
    c.fillRect(-w / 2 + 2, 3, w, h);
    c.fillStyle = mixLab(mixLab(m.set, m.setHaze, 0.6), mixLab(m.halo, m.rim, 0.6), light);
    c.fillRect(-w / 2, 0, w, h);
    c.fillStyle = withAlpha(m.ink, 0.9);
    c.font = `400 20px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(`${s.x[0]} ${s.x[1]}`, 0, 15);
    c.fillRect(-13, 28, 26, 1.2);
    c.font = `400 25px ${FONT.typewriter}`;
    c.fillText(String(s.y), 0, 44);
    if (o.tick[k] > 0.01) {
      c.globalAlpha *= o.tick[k];
      c.strokeStyle = mixLab(m.ink, m.set, 0.1);
      c.lineWidth = 2.6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(w / 2 - 14, h - 9);
      c.lineTo(w / 2 - 9, h - 4);
      c.lineTo(w / 2 + 2, h - 20);
      c.stroke();
    }
    c.restore();
  });
}

// ------------------------------------------------------------------ the family trees (1986 paper's other demo)
/** one family as 12 people in three generations; identical shape for both families */
const PEOPLE: { x: number; y: number; gen: number }[] = [
  { x: -78, y: 0, gen: 0 }, { x: -46, y: 0, gen: 0 }, { x: 46, y: 0, gen: 0 }, { x: 78, y: 0, gen: 0 },
  { x: -96, y: 62, gen: 1 }, { x: -62, y: 62, gen: 1 }, { x: -16, y: 62, gen: 1 }, { x: 16, y: 62, gen: 1 }, { x: 62, y: 62, gen: 1 }, { x: 96, y: 62, gen: 1 },
  { x: -40, y: 124, gen: 2 }, { x: 40, y: 124, gen: 2 },
];
const COUPLES: [number, number][] = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]];
const DESCENT: [number, number][] = [[0, 5], [0, 6], [2, 7], [2, 8], [6, 10], [8, 11]];

/** the larger net's six hidden lanterns: hung from the top beam in the free band between the output and the
 *  hidden pair, three either side of the XOR strings (never in front of the XOR lanterns) */
export const FAMILY_NET = { xs: [764, 830, 896, 1104, 1170, 1236], y: 252, r: 21 };

/**
 * Two identical family trees cut as silhouette paper (no card behind them): a hanging rod on two threads, the
 * couple and descent lines as ink strips, the people as small profile busts (couples face each other).
 * The hidden lanterns tint them: nationality (tree vs tree, split in VALUE as well as hue: one tree pale and
 * warm, the other darker and cool), then generation (three value bands, light → dark, top to bottom).
 */
export function familyTrees(
  c: C,
  o: { drop: number; nat: number; gen: number; net: number; t: number; lx: number; rx: number; y: number; alpha?: number; k?: number },
  env: PaintEnv,
) {
  const m = env.mood;
  if (o.drop <= 0.003 || (o.alpha ?? 1) <= 0.003) return;
  const K = o.k ?? 0.86;
  const ink = env.fill('ink');
  const natCol = [mixLab(m.core, m.rim, 0.25), mixLab(mixLab(m.halo, MOODS.winterBlue.rim, 0.55), m.set, 0.62)];
  const genCol = [mixLab(m.core, m.rim, 0.15), mixLab(m.rim, m.halo, 0.55), mixLab(m.halo, m.set, 0.55)];
  const trees: { x: number; side: 0 | 1 }[] = [
    { x: o.lx, side: 0 },
    { x: o.rx, side: 1 },
  ];
  const dropY = (1 - sm(o.drop)) * -260;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  // the larger net: six lanterns on threads from the beam (units 0–2 nationality, 3–5 generation)
  const N = FAMILY_NET;
  const netPt = (k: number) => ({ x: N.xs[k], y: N.y + dropY * 0.4 });
  for (let k = 0; k < 6; k++) {
    const { x, y } = netPt(k);
    c.strokeStyle = ink;
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(x, LOOM.beamY + 8);
    c.lineTo(x, y - N.r - 5);
    c.stroke();
    const act = k < 3 ? o.nat * (0.55 + 0.45 * (k === 1 ? 1 : 0.5 + 0.5 * Math.sin(o.t * 3 + k))) : o.gen * (0.6 + 0.4 * (k === 4 ? 1 : 0.6));
    paperLantern(c, { x, y, r: N.r, act: Math.max(0.05, act) * o.net, tassel: false, halo: 0.4, alpha: sm(o.drop) }, env);
  }
  // each half of the row is tied to the tree on its side (a thread from every lantern to the tree's rod end)
  const tie = (tr: { x: number; side: 0 | 1 }) => ({ x: tr.x + (tr.side ? -112 : 112) * K, y: o.y + dropY - 30 * K });
  const threads = (col: string, a: number, w: number) => {
    c.save();
    c.globalAlpha *= a;
    c.strokeStyle = col;
    c.lineWidth = w;
    for (let k = 0; k < 6; k++) {
      const tr = trees[k < 3 ? 0 : 1];
      const { x, y } = netPt(k);
      const e = tie(tr);
      c.beginPath();
      c.moveTo(x + (tr.side ? N.r * 0.8 : -N.r * 0.8), y);
      c.quadraticCurveTo((x + e.x) / 2, Math.min(y, e.y) - 18, e.x, e.y);
      c.stroke();
    }
    c.restore();
  };
  threads(ink, sm(o.drop) * 0.7, 0.9);
  for (const tr of trees) {
    c.save();
    c.translate(tr.x, o.y + dropY);
    c.scale(K, K);
    c.globalAlpha *= sm(o.drop);
    // the hanging rod and its two threads
    c.strokeStyle = ink;
    c.lineWidth = 1 / K;
    for (const dx of [-80, 80]) {
      c.beginPath();
      c.moveTo(dx, -32);
      c.lineTo(dx, -1000);
      c.stroke();
    }
    c.fillStyle = ink;
    c.fillRect(-116, -34, 232, 4);
    // the cut-paper lines: thin ink strips (each gen-0 bust hangs from the rod on a short strip)
    const strip = 2.6;
    for (let i = 0; i < 4; i++) c.fillRect(PEOPLE[i].x - 1, -30, 2, PEOPLE[i].y - 22 + 30);
    for (const [i, j] of COUPLES) c.fillRect(Math.min(PEOPLE[i].x, PEOPLE[j].x), PEOPLE[i].y + 6, Math.abs(PEOPLE[j].x - PEOPLE[i].x), strip);
    for (const [i, j] of DESCENT) {
      const a0 = PEOPLE[i], b0 = PEOPLE[j];
      const sx = COUPLES.find(([p]) => p === i) ? (a0.x + PEOPLE[i + 1].x) / 2 : a0.x;
      c.fillRect(sx - strip / 2, a0.y + 6, strip, 26);
      c.fillRect(Math.min(sx, b0.x) - strip / 2, a0.y + 30, Math.abs(b0.x - sx) + strip, strip);
      c.fillRect(b0.x - strip / 2, a0.y + 30, strip, b0.y - 22 - (a0.y + 30));
    }
    // the people: profile busts, couples facing each other; tinted by what the hidden lanterns found
    const amt = Math.max(o.nat, o.gen);
    PEOPLE.forEach((p, k) => {
      const natC = natCol[tr.side];
      const tint = o.gen > 0.01 ? mixLab(natC, genCol[p.gen], sm(o.gen)) : natC;
      const col = amt > 0.01 ? mixLab(m.ink, tint, amt * 0.95) : m.ink;
      const cp = COUPLES.findIndex(([a, b]) => a === k || b === k);
      const facing = cp >= 0 ? (COUPLES[cp][0] === k ? 1 : -1) : k % 2 ? -1 : 1;
      bust5(c, p.x, p.y + 12, 0.44, facing, col, 0, (k * 7 + tr.side) % 3 === 0 ? 1 : 0);
      if (amt > 0.02) glow(c, p.x, p.y - 8, 15, tint, 0.14 * amt);
    });
    c.restore();
  }
  // threads of light from the hidden row to the trees while they tint
  const th = Math.max(o.nat, o.gen) * o.net;
  if (th > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    threads(m.core, 0.32 * th, 1.5);
    c.restore();
  }
  c.restore();
}

// ------------------------------------------------------------------ the equation card (screen-locked)
type Seg = { t: string; sub?: boolean; big?: boolean };
const EQ1: Seg[] = [{ t: 'blame(i) = slope(i) · ' }, { t: 'Σ', big: true }, { t: 'j', sub: true }, { t: ' blame(j) · w' }, { t: 'ji', sub: true }];
const EQ2: Seg[] = [{ t: 'Δw' }, { t: 'ji', sub: true }, { t: ' = −ε · blame(j) · y' }, { t: 'i', sub: true }];

function drawSegs(c: C, segs: Seg[], x: number, y: number, size: number, reveal: number) {
  // measure, then draw left → right up to `reveal` of the total width (ink drying in)
  const widths = segs.map((s) => {
    c.font = `italic 400 ${s.sub ? size * 0.62 : s.big ? size * 1.25 : size}px ${FONT.text}`;
    return c.measureText(s.t).width;
  });
  const total = widths.reduce((a, b) => a + b, 0);
  const lim = x + total * reveal;
  let cx = x;
  c.save();
  c.beginPath();
  c.rect(x - 4, y - size * 1.4, Math.max(0, lim - x + 4), size * 2.2);
  c.clip();
  segs.forEach((s, k) => {
    c.font = `italic 400 ${s.sub ? size * 0.62 : s.big ? size * 1.25 : size}px ${FONT.text}`;
    c.fillText(s.t, cx, s.sub ? y + size * 0.28 : s.big ? y + size * 0.08 : y);
    cx += widths[k];
  });
  c.restore();
  return total;
}

const EQ1a: Seg[] = [{ t: 'blame(i) = slope(i) ·' }];
const EQ1b: Seg[] = [{ t: 'Σ', big: true }, { t: 'j', sub: true }, { t: ' blame(j) · w' }, { t: 'ji', sub: true }];

/**
 * The rule on a small parchment card (screen-locked), three short lines so it fits beside the loom:
 *   blame(i) = slope(i) ·  /  Σj blame(j) · wji  /  Δwji = −ε · blame(j) · yi
 * reveal: per-line ink progress [0..1] × 3 (ink drying in left → right). (x, y) = top-left.
 */
const EQ2a: Seg[] = [{ t: 'Δw' }, { t: 'ji', sub: true }, { t: ' = −ε' }];
const EQ2b: Seg[] = [{ t: '· blame(j) · y' }, { t: 'i', sub: true }];

/** measure the tall (four-line) card at `size`: { w, h } */
export function equationCardSize(c: C, size: number, wide = false) {
  c.save();
  const meas = (segs: Seg[]) =>
    segs.reduce((acc, sg) => {
      c.font = `italic 400 ${sg.sub ? size * 0.62 : sg.big ? size * 1.25 : size}px ${FONT.text}`;
      return acc + c.measureText(sg.t).width;
    }, 0);
  const lines = (wide ? WIDE : TALL).map(([sg, ind]) => meas(sg) + ind * size);
  c.restore();
  return { w: Math.ceil(Math.max(...lines) + 40), h: Math.ceil(size * 1.42 * (wide ? 2 : 4) + (wide ? 38 : 30)) };
}
/** four lines, two per rule (the gather, then the tug), with a hairline between the rules */
const TALL: [Seg[], number][] = [[EQ1a, 0], [EQ1b, 0.9], [EQ2a, 0], [EQ2b, 0.9]];
/** two lines: each rule whole on its own line (review round 1: no wrapped equations) */
const WIDE: [Seg[], number][] = [[EQ1, 0], [EQ2, 0]];

export function equationCard(c: C, o: { x: number; y: number; alpha: number; reveal: number[]; mood: Palette; size?: number; tall?: boolean; wide?: boolean }) {
  if (o.alpha <= 0.003) return;
  const P = MOODS.parchment;
  const size = o.size ?? 21;
  c.save();
  c.globalAlpha = o.alpha;
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const lines: [Seg[], number][] = o.wide ? WIDE.map(([sg, ind]) => [sg, ind * size] as [Seg[], number]) : o.tall ? TALL.map(([sg, ind]) => [sg, ind * size] as [Seg[], number]) : [[EQ1a, 0], [EQ1b, size * 1.1], [EQ2, 0]];
  const meas = (segs: Seg[]) =>
    segs.reduce((acc, sg) => {
      c.font = `italic 400 ${sg.sub ? size * 0.62 : sg.big ? size * 1.25 : size}px ${FONT.text}`;
      return acc + c.measureText(sg.t).width;
    }, 0);
  const w = Math.ceil(Math.max(...lines.map(([sg, ind]) => meas(sg) + ind)) + (o.tall || o.wide ? 40 : 36));
  const lh = size * 1.42;
  const h = Math.ceil(lh * lines.length + (o.wide ? 38 : o.tall ? 30 : 22));
  softPlate(c, o.x + w / 2, o.y + h / 2, w + 90, h + 70, o.mood.ink, 0.45);
  c.fillStyle = withAlpha(P.fg, 0.4);
  c.fillRect(o.x + 4, o.y + 5, w, h);
  c.fillStyle = mixLab(P.sky[0], P.sky[2], 0.3);
  c.beginPath();
  c.moveTo(o.x, o.y);
  for (let k = 0; k <= 16; k++) c.lineTo(o.x + (w * k) / 16, o.y + hash1(k, 3) * 1.4);
  for (let k = 0; k <= 8; k++) c.lineTo(o.x + w + hash1(k, 4) * 1.4, o.y + (h * k) / 8);
  for (let k = 16; k >= 0; k--) c.lineTo(o.x + (w * k) / 16, o.y + h + hash1(k, 5) * 1.4);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(P.ink, 0.3);
  c.lineWidth = 0.8;
  c.strokeRect(o.x + 6, o.y + 6, w - 12, h - 12);
  c.fillStyle = withAlpha(P.ink, 0.92);
  if (o.wide) {
    c.fillStyle = withAlpha(P.ink, 0.35 * clamp01((o.reveal[2] ?? 0) * 4));
    c.fillRect(o.x + 20, o.y + 13 + lh + 6, w - 40, 1);
    c.fillStyle = withAlpha(P.ink, 0.92);
    // each rule inks in over its two reveal steps (the gather: 0, 1; the tug: 2, 3)
    lines.forEach(([sg], k) => {
      const r = 0.5 * clamp01(o.reveal[k * 2] ?? 0) + 0.5 * clamp01(o.reveal[k * 2 + 1] ?? 0);
      if (r > 0) drawSegs(c, sg, o.x + 20, o.y + 13 + (k ? 12 : 0) + lh * (k + 0.78), size, r);
    });
    c.restore();
    return { w, h };
  }
  if (o.tall) {
    // a hairline between the two rules (the gather above, the tug below)
    c.fillStyle = withAlpha(P.ink, 0.35 * clamp01((o.reveal[2] ?? 0) * 4));
    c.fillRect(o.x + 20, o.y + 13 + lh * 2 + 2, w - 40, 1);
    c.fillStyle = withAlpha(P.ink, 0.92);
  }
  lines.forEach(([sg, ind], k) => {
    const gap = o.tall && k >= 2 ? 8 : 0;
    if ((o.reveal[k] ?? 0) > 0) drawSegs(c, sg, o.x + 20 + ind, o.y + 11 + gap + lh * (k + 0.78), size, clamp01(o.reveal[k]));
  });
  c.restore();
  return { w, h };
}
