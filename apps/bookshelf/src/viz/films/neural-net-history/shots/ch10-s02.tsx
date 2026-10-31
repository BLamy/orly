/**
 * ch10-s02 — the bottleneck and the look back: a whole sentence folded into one envelope jams in a paper
 * funnel; then the plate opens into a grid where each French word looks back at every English word
 * (duskRose; the parchment hangs in a dim translator's study, lit from the right by a desk lamp; 13.1 s; cut in
 * from the hall).
 *
 * TEACHES encoder–decoder translation and attention, on the words:
 *   'squeezed'    the seven English slips fold, one by one, into ONE small sealed envelope (the single list
 *                 of numbers, its first numbers inked on its face, illustrative) that is pushed into a funnel;
 *                 the Bahdanau quote card is pinned beside the funnel and stays up (2014 typed in the corner)
 *   'bottleneck'  the envelope jams in the funnel's neck; it squeezes through and the French comes out below
 *   'look'        the plate opens: the same slips slide into a grid, English along the top, French down the side
 *                 (lettered on the slips themselves); as each French word is written a highlighter of light
 *                 sweeps the English row and each square lights by its attention weight
 *   'attention'   the lit diagonal BENDS where French reverses European Economic Area → zone économique
 *                 européenne; the map holds, legible, to the end
 * Every square's light is bound to a weight in ALIGN (each row sums to 1), redrawn after the alignment figure
 * of Bahdanau, Cho & Bengio (2014), not copied from it.
 */
import { Timeline } from '../../../core';
import { LAYERS, defineShot, mixLab, overscan, withAlpha } from '../../../film';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { valance } from '../sets/occluders';
import { bookshelfWall } from '../../../film/silhouette/architecture';
import { anglepoiseLamp } from '../../../film/silhouette/props';
import { amberPlate, paperAt } from '../sets/ch02-s02-plate';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s02';
const L = 'L1005';
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

const EN = ['the', 'agreement', 'on', 'the', 'European', 'Economic', 'Area'];
const FR = ["l'", 'accord', 'sur', 'la', 'zone', 'économique', 'européenne'];
/** attention weights: row = French word, column = English word; each row sums to 1 (redrawn, not copied) */
const ALIGN: number[][] = [
  [0.92, 0.04, 0.01, 0.01, 0.01, 0.005, 0.005],
  [0.05, 0.88, 0.04, 0.01, 0.01, 0.005, 0.005],
  [0.01, 0.06, 0.86, 0.05, 0.01, 0.005, 0.005],
  [0.01, 0.02, 0.07, 0.82, 0.04, 0.02, 0.02],
  [0.005, 0.01, 0.01, 0.03, 0.12, 0.08, 0.745],
  [0.005, 0.005, 0.01, 0.01, 0.12, 0.77, 0.08],
  [0.005, 0.005, 0.005, 0.01, 0.83, 0.1, 0.04],
];

/** the plate hangs on the study wall: drawn in plate units (the old full-frame plate) and mapped into the frame by
 *  HANG (scaled about its centre, a slight tilt) so the study shows round it */
const PLATE_L: LayerSpec = { id: 'plate', z: 1000, haze: 0.02, blur: 0 };
const PLATE = { x: 64, y: 58, w: 1152, h: 566 };
const HANG = { cx: 640, cy: 330, k: 0.79, rot: -0.011 };
/** the desk lamp's pool on the parchment, in plate units (the lamp stands at frame right) */
const POOL = { x: 860, y: 640, r: 980 };
/** the lamp in frame (screen px): on the desk at lower right, its head turned toward the plate */
const LAMP = { x: 1176, y: 668, s: 1.9, reach: 0.5, aim: -1.45 };
/** the study wall: a near-ish layer with little haze, so the room stays dark round the lit parchment */
const WALL_L: LayerSpec = { id: 'studyWall10', z: 1250, haze: 0.05, blur: 0.9 };

/** the camera: a slow push on the plate over the whole shot (and a hair of drift toward the lamp) */
const CAM0: Camera3 = { x: 640, y: 352, z: 20, lens: 1 };
const CAM1: Camera3 = { x: 648, y: 356, z: 68, lens: 1 };
/** ease-out, so the push is already moving in the opening line (about 2% by 'squeezed', 5% by the end) */
const eo = (u: number) => 1 - (1 - clamp01(u)) * (1 - clamp01(u));
const camAt = (u: number): Camera3 => ({ x: lerp(CAM0.x, CAM1.x, u), y: lerp(CAM0.y, CAM1.y, u), z: lerp(CAM0.z, CAM1.z, eo(u)), lens: 1 });

// ------------------------------------------------------------------------------------------------ geometry
/** phase A: the English row across the top, the funnel below it, the French out of the spout */
const EN_A_Y = 112;
const FUN = { x: 450, mouthY: 252, mouthW: 380, neckY: 446, neckW: 26, spoutY: 512 };
const ENV = { x: FUN.x, y: 206, w: 200, h: 96 };
/** phase B: the grid (shifted left so grid and card balance across the plate) */
const G = { x0: 256, y0: 222, cw: 80, ch: 45 };
const QUOTE = { x: 1026, y: 384, w: 330, h: 300 };

/** the slips' type, set once per frame at the 22 px floor for the shot's FIRST camera (so the words grow with the
 *  push like the paper they are on, never shrink against it) */
interface Type {
  fs: number;
  enW: number[];
  frW: number[];
  enAX: number[];
  frAX: number[];
  /** the column-head slips' length (the longest English word + margins) */
  colLen: number;
}
let TYPE: Type | null = null;
function typeFor(c: C, camK: number): Type {
  const need = legibleSize(c, `500 10px ${FONT.text}`, 1) * camK;
  const fs = Math.max(25, Math.ceil(need * 2) / 2);
  if (TYPE && TYPE.fs === fs) return TYPE;
  c.save();
  c.font = `500 ${fs}px ${FONT.text}`;
  const wOf = (w: string) => Math.ceil(c.measureText(w).width) + 26;
  const enW = EN.map(wOf);
  const frW = FR.map(wOf);
  c.restore();
  const frAll = frW.reduce((a, b) => a + b, 0) + 10 * (FR.length - 1);
  TYPE = {
    fs,
    enW,
    frW,
    enAX: rowPos(enW, 98, 10),
    frAX: rowPos(frW, Math.max(96, FUN.x - frAll / 2), 10),
    colLen: Math.max(120, ...enW.map((w) => w + 4)),
  };
  return TYPE;
}
function rowPos(widths: number[], x0: number, gap: number) {
  let x = x0;
  return widths.map((w) => {
    const cx = x + w / 2;
    x += w + gap;
    return cx;
  });
}

interface Plan {
  squeeze: number;
  fold: number[];
  seal: number;
  date: number;
  envIn: number;
  jam: number;
  through: number;
  frOut: number[];
  open: number;
  row: number[];
  bend: number;
  D: number;
}

/** each slip: lift and fold in half (first 45%), then slide into the envelope's mouth */
const FOLD_DUR = 0.62;
const SWEEP = 0.3;

function makePlan(T: { word: (l: string, w: string | number) => number; beat: (n: string) => number; duration: number }): Plan {
  const squeeze = T.word(L, 'squeezed');
  // slip by slip, about 0.3 s apart from 'squeezed' (3.1 → 5.3 s); the envelope seals on 'numbers' and dives
  const numbers = T.word(L, 'numbers');
  const first = squeeze - 0.07;
  const fold = EN.map((_, i) => first + (i * (numbers - 0.3 - FOLD_DUR - first)) / 6);
  const seal = numbers - 0.12;
  const envIn = numbers + 0.18;
  const jam = T.word(L, 'bottleneck');
  const through = jam + 0.6;
  // the French comes out of the spout one word at a time and slides to its place
  const frOut = FR.map((_, i) => through + 0.08 + i * 0.17);
  const open = T.word(L, 'look') - 0.15;
  const bend = T.word(L, 'attention');
  // rows 0-3 march the diagonal; row 4 (zone) is timed so its bent square (→ Area) lights ON 'attention', and the
  // bend completes quickly after: row 6's square (européenne → European) is fully lit by 'attention' + 0.3 s
  const r4 = bend - SWEEP * (6.67 / 7);
  const r0 = Math.min(open + 0.5, r4 - 4 * 0.24);
  const step = (r4 - r0) / 4;
  const row = [r0, r0 + step, r0 + 2 * step, r0 + 3 * step, r4, r4 + 0.17, r4 + 0.34];
  return { squeeze, fold, seal, date: T.word(L, 'twenty') - 0.1, envIn, jam, through, frOut, open, row, bend, D: T.duration };
}

// ------------------------------------------------------------------------------------------------ painters
function inkOf(env: PaintEnv) {
  return mixLab(env.mood.ink, env.mood.fg, 0.3);
}

/** a cut-paper word slip on the plate (horizontal unless rot), lettered in ink */
function slip(c: C, env: PaintEnv, word: string, x: number, y: number, w: number, h: number, fs: number, o: { rot?: number; alpha?: number; ink?: number; light?: number; half?: number; scale?: number; seed?: number } = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const ink = inkOf(env);
  const paper = mixLab(paperAt(env, 1), env.mood.core, 0.3 + 0.4 * (o.light ?? 0));
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  if (o.rot) c.rotate(o.rot);
  if (o.scale !== undefined) c.scale(o.scale, o.scale);
  // the fold: the right half turns over onto the left about the centre crease (half = 0..1); the folded slip
  // keeps its centre, so it visibly halves in width
  const f = clamp01(o.half ?? 0);
  if (f > 0) c.translate((w / 4) * f, 0);
  const cosF = Math.cos(f * Math.PI);
  const x1 = f > 0 ? Math.max(0, (w / 2) * cosF) : w / 2; // the unfolded part's right edge
  // soft cast shadow on the plate (the lamp is at frame right: shadows fall left), then the paper
  c.fillStyle = withAlpha(env.mood.fg, 0.34);
  c.fillRect(-w / 2 - 3, -h / 2 + 3.5, x1 + w / 2, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, x1 + w / 2, h);
  c.strokeStyle = withAlpha(ink, 0.9);
  c.lineWidth = 1.3;
  c.strokeRect(-w / 2, -h / 2, x1 + w / 2, h);
  const ia = o.ink ?? 1;
  if (ia > 0.01) {
    c.save();
    c.beginPath();
    c.rect(-w / 2, -h / 2 - 2, x1 + w / 2, h + 4);
    c.clip();
    c.globalAlpha *= ia;
    c.fillStyle = ink;
    c.font = `500 ${fs}px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText(word, 0, fs * 0.3);
    c.restore();
  }
  if (f > 0) {
    // the turning flap: its front (paper) while it rises, its back (a shade darker, unlettered) once over
    const fx = (w / 2) * cosF;
    c.fillStyle = cosF >= 0 ? mixLab(paper, env.mood.fg, 0.08) : mixLab(paper, env.mood.fg, 0.22);
    c.fillRect(Math.min(0, fx), -h / 2, Math.abs(fx), h);
    c.strokeStyle = withAlpha(ink, 0.9);
    c.strokeRect(Math.min(0, fx), -h / 2, Math.abs(fx), h);
    // the crease
    c.fillStyle = withAlpha(ink, 0.5);
    c.fillRect(-0.8, -h / 2, 1.6, h);
  }
  c.restore();
}

/** the paper funnel: a dark cut-paper cone, lit along its lamp-side (right) edge, with a narrow tube of a neck */
function funnel(c: C, env: PaintEnv, a: number, jamK: number, judder: number) {
  if (a <= 0.003) return;
  const m = env.mood;
  const ink = inkOf(env);
  const { x, mouthY, mouthW, neckY, neckW, spoutY } = FUN;
  c.save();
  c.globalAlpha *= a;
  // the squash on the jam: the cone bulges a touch and sags about its neck; a judder on the twos
  c.translate(x + judder, neckY);
  c.scale(1 + 0.05 * jamK, 1 - 0.06 * jamK);
  c.translate(-x, -neckY);
  const half = mouthW / 2;
  const nw = neckW / 2 + 3 * jamK;
  const cone = new Path2D();
  cone.moveTo(x - half, mouthY);
  cone.quadraticCurveTo(x, mouthY + 18, x + half, mouthY);
  cone.bezierCurveTo(x + half * 0.55, mouthY + 70, x + nw + 6, neckY - 60, x + nw, neckY);
  cone.lineTo(x - nw, neckY);
  cone.bezierCurveTo(x - nw - 6, neckY - 60, x - half * 0.55, mouthY + 70, x - half, mouthY);
  cone.closePath();
  const tube = new Path2D();
  tube.rect(x - neckW / 2, neckY - 2, neckW, spoutY - neckY + 2);
  // cast shadow (left and down, off the lamp)
  c.save();
  c.translate(-9, 8);
  c.fillStyle = withAlpha(m.fg, 0.32);
  c.fill(cone);
  c.fill(tube);
  c.restore();
  // dark paper, a little lighter toward the lamp
  const g = c.createLinearGradient(x - half, 0, x + half, 0);
  g.addColorStop(0, mixLab(m.set, m.fg, 0.55));
  g.addColorStop(0.65, mixLab(m.set, m.fg, 0.35));
  g.addColorStop(1, mixLab(m.set, m.setHaze, 0.35));
  c.fillStyle = g;
  c.fill(cone);
  c.fillStyle = mixLab(m.set, m.fg, 0.5);
  c.fill(tube);
  // the mouth: the inside of the cone's back wall, darker, under the front lip
  c.fillStyle = mixLab(m.fg, m.set, 0.3);
  c.beginPath();
  c.ellipse(x, mouthY, half - 2, 14, 0, Math.PI, Math.PI * 2);
  c.quadraticCurveTo(x, mouthY + 18, x - half + 2, mouthY);
  c.fill();
  // fold lines converging on the neck (faint rim cuts)
  c.strokeStyle = withAlpha(m.rim, 0.16);
  c.lineWidth = 1;
  c.beginPath();
  for (const fr of [-0.5, -0.15, 0.2, 0.55]) {
    c.moveTo(x + fr * half, mouthY + 12);
    c.quadraticCurveTo(x + fr * half * 0.35, neckY - 70, x + fr * nw, neckY);
  }
  c.stroke();
  // the ink outline, then the LIT RIM along the lamp side: the cone's right flank, the mouth's lip, the tube
  c.strokeStyle = ink;
  c.lineWidth = 2.4;
  c.stroke(cone);
  c.stroke(tube);
  c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.85);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x + half, mouthY + 1);
  c.bezierCurveTo(x + half * 0.55, mouthY + 71, x + nw + 6, neckY - 59, x + nw, neckY);
  c.lineTo(x + neckW / 2, spoutY);
  c.stroke();
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(x - half * 0.2, mouthY + 15);
  c.quadraticCurveTo(x + half * 0.5, mouthY + 12, x + half, mouthY);
  c.stroke();
  // a collar where cone meets neck (the bottleneck itself)
  c.fillStyle = ink;
  c.fillRect(x - neckW / 2 - 4, neckY - 3, neckW + 8, 6);
  c.fillStyle = withAlpha(m.rim, 0.6);
  c.fillRect(x - neckW / 2 - 4, neckY - 3, neckW + 8, 1.2);
  c.restore();
}

function envelope(c: C, env: PaintEnv, x: number, y: number, s: number, sx: number, a: number, nums: number, flap: number, camK: number) {
  if (a <= 0.003) return;
  const ink = inkOf(env);
  const w = ENV.w * s * sx, h = ENV.h * s;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.fillStyle = withAlpha(env.mood.fg, 0.34);
  c.fillRect(-w / 2 - 4, -h / 2 + 5, w, h);
  c.fillStyle = mixLab(paperAt(env, 1), env.mood.core, 0.38);
  c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = ink;
  c.lineWidth = 1.8;
  c.strokeRect(-w / 2, -h / 2, w, h);
  // the flap: open (folded up above the envelope) while it receives the slips, then down and sealed
  const fy = lerp(-h / 2 - h * 0.32, h * 0.08, flap);
  c.fillStyle = mixLab(paperAt(env, 0.9), env.mood.core, 0.25);
  c.beginPath();
  c.moveTo(-w / 2, -h / 2);
  c.lineTo(0, fy);
  c.lineTo(w / 2, -h / 2);
  c.closePath();
  c.fill();
  c.stroke();
  if (flap > 0.95) {
    c.fillStyle = mixLab(env.mood.ink, '#5a4330', 0.5);
    c.beginPath();
    c.arc(0, h * 0.06, 7 * s, 0, Math.PI * 2);
    c.fill();
  }
  if (nums > 0.01 && s * sx > 0.85) {
    // the single list of numbers (illustrative), inked on the envelope's face at the legibility floor
    c.globalAlpha *= nums;
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const ns = Math.max(20, legibleSize(c, `500 10px ${FONT.mono}`, 1) * camK);
    c.font = `500 ${ns}px ${FONT.mono}`;
    c.fillText('0.31 −1.20 …', 0, h / 2 - 12 * s);
  }
  c.restore();
}

/** the quote card, pinned at the plate's lower right: ink on a cream card (verbatim, research/quotes.json q-bahdanau) */
function quote(c: C, env: PaintEnv, a: number, t: number, at: number, camK: number) {
  if (a <= 0.003) return;
  const ink = inkOf(env);
  const { x, y, w, h } = QUOTE;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.rotate(0.014);
  c.fillStyle = withAlpha(env.mood.fg, 0.36);
  c.fillRect(-w / 2 - 6, -h / 2 + 6, w, h);
  c.fillStyle = mixLab(paperAt(env, 1), env.mood.core, 0.45);
  c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = withAlpha(ink, 0.5);
  c.lineWidth = 1;
  c.strokeRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
  // the pin
  c.fillStyle = ink;
  c.beginPath();
  c.arc(0, -h / 2 + 14, 4.5, 0, Math.PI * 2);
  c.fill();
  // open-quote mark, three lines, attribution
  c.fillStyle = withAlpha(ink, 0.35);
  c.font = `600 70px ${FONT.display}`;
  c.textAlign = 'left';
  c.fillText('“', -w / 2 + 16, -h / 2 + 76);
  const lines = ['…a fixed-length', 'vector is a', 'bottleneck…”'];
  c.textBaseline = 'alphabetic';
  const qs = Math.max(28, legibleSize(c, `italic 400 10px ${FONT.text}`, 1) * camK);
  c.font = `italic 400 ${qs}px ${FONT.text}`;
  c.fillStyle = ink;
  c.textAlign = 'center';
  lines.forEach((ln, i) => {
    const k = sm((t - at - 0.1 - i * 0.12) / 0.35);
    c.globalAlpha = a * k;
    c.fillText(ln, 8, -h / 2 + 84 + i * qs * 1.32);
  });
  // the attribution (whose word it was): names in roman, the year in italic, both at the floor
  const k2 = sm((t - at - 0.55) / 0.4);
  c.globalAlpha = a * k2;
  const as = Math.max(24, legibleSize(c, `500 10px ${FONT.text}`, 1) * camK);
  c.font = `500 ${as}px ${FONT.text}`;
  c.fillText('Bahdanau, Cho & Bengio', 0, h / 2 - 54);
  c.fillRect(-40, h / 2 - 54 - as * 1.05, 80, 1);
  c.font = `italic 400 ${as}px ${FONT.text}`;
  c.fillText('2014', 0, h / 2 - 20);
  c.restore();
}

/** an additive soft square of light on the plate */
function lightCell(c: C, env: PaintEnv, x: number, y: number, w: number, h: number, k: number) {
  if (k <= 0.004) return;
  const m = env.mood;
  const op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = withAlpha(m.core, 0.8 * k);
  c.fillRect(x + 2, y + 2, w - 4, h - 4);
  const g = c.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.9);
  g.addColorStop(0, withAlpha(m.halo, 0.35 * k));
  g.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - w * 0.4, y - h * 0.9, w * 1.8, h * 2.8);
  c.globalCompositeOperation = op;
}

/** the translator's chair seen from behind (near plane): two turned stiles with finials, a shaped crest rail, five
 *  spindles cut through (the study shows between them), a mid rail; a 1.5 px lamp rim along the crest's top */
function nearChair(c: C, env: PaintEnv, x: number, y: number, s: number) {
  const ink = env.fill('fg');
  const p = new Path2D();
  // stiles with finials
  for (const sx of [-74, 60]) {
    p.rect(x + sx * s, y - 230 * s, 14 * s, 230 * s);
    p.moveTo(x + (sx + 7) * s + 9 * s, y - 238 * s);
    p.arc(x + (sx + 7) * s, y - 238 * s, 9 * s, 0, Math.PI * 2);
  }
  // the crest rail: a shaped top (a shallow serpentine)
  p.moveTo(x - 66 * s, y - 196 * s);
  p.lineTo(x - 66 * s, y - 212 * s);
  p.bezierCurveTo(x - 30 * s, y - 236 * s, x + 30 * s, y - 236 * s, x + 66 * s, y - 212 * s);
  p.lineTo(x + 66 * s, y - 196 * s);
  p.closePath();
  for (let i = 0; i < 5; i++) p.rect(x - 46 * s + i * 22 * s, y - 198 * s, 6 * s, 150 * s);
  p.rect(x - 66 * s, y - 52 * s, 132 * s, 13 * s);
  p.rect(x - 66 * s, y - 120 * s, 132 * s, 5 * s);
  c.fillStyle = ink;
  c.fill(p);
  // rim: the crest's top edge and the finials catch the lamp (lamp at frame right)
  c.strokeStyle = withAlpha(env.mood.rim, 0.75);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - 66 * s, y - 212 * s);
  c.bezierCurveTo(x - 30 * s, y - 236 * s, x + 30 * s, y - 236 * s, x + 66 * s, y - 212 * s);
  c.stroke();
  for (const sx of [-74, 60]) {
    c.beginPath();
    c.arc(x + (sx + 7) * s, y - 238 * s, 9 * s, -Math.PI * 0.9, -Math.PI * 0.1);
    c.stroke();
    c.beginPath();
    c.moveTo(x + (sx + 14) * s, y - 228 * s);
    c.lineTo(x + (sx + 14) * s, y - 60 * s);
    c.strokeStyle = withAlpha(env.mood.rim, 0.25);
    c.stroke();
    c.strokeStyle = withAlpha(env.mood.rim, 0.55);
  }
}

// ------------------------------------------------------------------------------------------------ the study
/** the back wall: dark panelling, two bookshelf bays framing the plate, a picture rail; cached */
function studyWall(f: Frame, c: C, env: PaintEnv) {
  f.cached(`${ID}/wall/${env.mood.id}`, 1600, 960, (cc) => {
    cc.translate(160, 120);
    const m = env.mood;
    cc.fillStyle = mixLab(m.set, m.fg, 0.5);
    cc.fillRect(-160, -120, 1600, 960);
    // panelling between the shelves (faint cut-lines)
    cc.strokeStyle = withAlpha(m.rim, 0.07);
    cc.lineWidth = 1.2;
    for (let px = 200; px < 1100; px += 176) cc.strokeRect(px + 8, 470, 160, 200);
    // the picture rail the plate hangs from
    cc.fillStyle = mixLab(m.fg, m.set, 0.3);
    cc.fillRect(-160, 18, 1600, 10);
    cc.fillStyle = withAlpha(m.rim, 0.14);
    cc.fillRect(-160, 18, 1600, 1.2);
    // bookshelves at both edges of the frame
    bookshelfWall(cc, { x: -150, y: -60, w: 330, h: 860, bays: 1, shelves: 6, seed: 2014, gaps: 0.18, backTone: 0.32, role: 'ink' }, env);
    bookshelfWall(cc, { x: 1100, y: -60, w: 330, h: 860, bays: 1, shelves: 6, seed: 2015, gaps: 0.18, backTone: 0.32, role: 'ink' }, env);
  })(c, -160, -120);
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return { tl, plan: makePlan(T) };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const p = scene.plan as Plan;
    const u = clamp01(t / p.D);
    const cam: Camera3 = camAt(u);
    f.camera(cam);
    // the plate's scale now over its scale on the first frame (its type is sized for the first frame)
    const camK = (1000 - CAM0.z) / (1000 - cam.z);
    f.backlight({ intensity: 0.12, sunX: 1100 });

    // the back wall and its shelves, then the lamp's warm falloff across the wall from frame right
    f.layer(WALL_L, (c, env) => {
      studyWall(f, c, env);
      const op = c.globalCompositeOperation;
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(1120, 560, 20, 1120, 560, 820);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.26));
      g.addColorStop(0.4, withAlpha(env.mood.halo, 0.08));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(-200, -200, 1700, 1100);
      c.globalCompositeOperation = op;
    });
    f.fog({ yCenter: 560, height: 420, alpha: 0.07, drift: 5 });

    f.layer(PLATE_L, (c, env) => {
      // the hanging cords from the rail to the plate's top corners
      const ink = inkOf(env);
      c.strokeStyle = mixLab(env.mood.fg, env.mood.set, 0.2);
      c.lineWidth = 1.6;
      c.beginPath();
      for (const fx of [0.18, 0.82]) {
        const px0 = HANG.cx + (PLATE.x + PLATE.w * fx - HANG.cx) * HANG.k;
        const py0 = HANG.cy + (PLATE.y - HANG.cy) * HANG.k;
        c.moveTo(px0 + (fx - 0.5) * 70, 26);
        c.lineTo(px0, py0 + 4);
      }
      c.stroke();
      c.save();
      c.translate(HANG.cx, HANG.cy);
      c.rotate(HANG.rot);
      c.scale(HANG.k, HANG.k);
      c.translate(-HANG.cx, -HANG.cy);
      // the plate's cast shadow on the wall (lamp at right: down and left), soft
      c.save();
      c.filter = 'blur(10px)';
      c.fillStyle = withAlpha(env.mood.fg, 0.6);
      c.fillRect(PLATE.x - 22, PLATE.y + 22, PLATE.w, PLATE.h);
      c.restore();
      amberPlate(f, c, { ...PLATE, key: ID, pool: POOL, seed: 2014 }, env);
      // the lamp's falloff across the sheet: full at the lamp side (right), dimming toward the far edge (left, top)
      c.save();
      c.beginPath();
      c.rect(PLATE.x - 4, PLATE.y - 4, PLATE.w + 8, PLATE.h + 8);
      c.clip();
      c.globalCompositeOperation = 'multiply';
      // (the lamp stands low at the right: the pool is brightest bottom-right/centre where the grid sits, and both
      // top corners fall about a quarter darker, the empty top-right into shadow)
      const fo = c.createRadialGradient(POOL.x + 120, POOL.y + 60, 40, POOL.x + 120, POOL.y + 60, 980);
      fo.addColorStop(0, '#ffffff');
      fo.addColorStop(0.4, mixLab('#ffffff', env.mood.halo, 0.2));
      fo.addColorStop(0.75, mixLab('#ffffff', mixLab(env.mood.halo, env.mood.set, 0.5), 0.55));
      fo.addColorStop(1, mixLab('#ffffff', mixLab(env.mood.halo, env.mood.set, 0.6), 0.8));
      c.fillStyle = fo;
      c.fillRect(PLATE.x - 4, PLATE.y - 4, PLATE.w + 8, PLATE.h + 8);
      c.restore();
      // the hanging rings at the top corners
      c.strokeStyle = ink;
      c.lineWidth = 3;
      for (const fx of [0.18, 0.82]) {
        c.beginPath();
        c.arc(PLATE.x + PLATE.w * fx, PLATE.y + 6, 7, 0, Math.PI * 2);
        c.stroke();
      }
      plateContent(c, env, t, tq, p, camK);
      c.restore();
    });

    // the desk lamp (sharp) and its practical; the desk's near edge (L5)
    f.layer('L4', (c, env) => {
      // the desk top the lamp stands on: a dark plank across the bottom, its top edge catching the lamp
      c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.2);
      c.fillRect(-140, LAMP.y, 1560, 160);
      const dg = c.createRadialGradient(LAMP.x - 60, LAMP.y, 0, LAMP.x - 60, LAMP.y, 420);
      dg.addColorStop(0, withAlpha(env.mood.rim, 0.5));
      dg.addColorStop(1, withAlpha(env.mood.rim, 0));
      c.fillStyle = dg;
      c.fillRect(LAMP.x - 480, LAMP.y - 1, 900, 2.2);
      anglepoiseLamp(c, { x: LAMP.x, y: LAMP.y, s: LAMP.s, flip: true, reach: LAMP.reach, aim: LAMP.aim, seed: 14 }, env);
    });
    const bulb = anglepoiseLamp.anchors({ x: LAMP.x, y: LAMP.y, s: LAMP.s, flip: true, reach: LAMP.reach, aim: LAMP.aim, seed: 14 }).bulb;
    f.rim({ x: -0.6, y: -0.8 });
    f.practical({ x: bulb.x, y: bulb.y, kind: 'lamp', seed: 14, intensity: 0.7, radius: 260 });
    // the room's near plane (L6): the back of the translator's spindle chair at lower left (a readable cut-paper
    // shape, its crest rail rimmed by the lamp) and the pelmet along the top; on the push they slide out past the
    // frame edges faster than the plate and the wall (three planes against each other)
    // (the chair stands on L5, less blurred than L6, against the mid-grey shelves at frame left, clear of the grid's
    // French column, so its near-black shape and lamp rim read)
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, [CAM0, CAM1], 60);
      f.cached(`${ID}/L5chair/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        nearChair(cc, env, 62, 770, 1.3);
      })(c, r.x, r.y);
    });
    f.layer('L6', (c, env) => {
      const r = overscan(LAYERS.L6, [CAM0, CAM1], 60);
      f.cached(`${ID}/L6v/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        valance(cc, { x0: r.x - 20, x1: r.x + r.w + 20, y: -6, depth: 40 }, env);
      })(c, r.x, r.y);
    });
  },
});

/** everything on the parchment, in plate units */
function plateContent(c: C, env: PaintEnv, t: number, tq: number, p: Plan, camK: number) {
  const ink = inkOf(env);
  const TY = typeFor(c, camK);
  const { fs, enW, frW } = TY;
  // 2014, typed in the plate's corner on 'twenty fourteen'
  const dk = sm((tq - p.date) / 0.3);
  if (dk > 0) {
    c.save();
    c.globalAlpha = dk;
    c.fillStyle = ink;
    c.textBaseline = 'alphabetic';
    c.font = `500 ${Math.max(26, legibleSize(c, `500 10px ${FONT.mono}`, 1) * camK)}px ${FONT.mono}`;
    (c as C & { letterSpacing: string }).letterSpacing = '2px';
    // in the lit top-right corner, where the lamp reaches
    c.fillText('2014', PLATE.x + PLATE.w - 124, PLATE.y + 46);
    c.fillRect(PLATE.x + PLATE.w - 124, PLATE.y + 56, 74 * dk, 1.4);
    (c as C & { letterSpacing: string }).letterSpacing = '0px';
    c.restore();
  }

  // OPEN: phase A dissolves into the grid (slips slide on twos)
  const open = sm((tq - p.open) / 0.75);
  const funA = 1 - sm((tq - p.open) / 0.4);

  // the grid: rules, faint squares, then the light
  if (open > 0) {
    c.save();
    c.globalAlpha = open;
    // an ink wash under the grid, so the squares of light read against it (the figure's dark field)
    c.fillStyle = withAlpha(mixLab(ink, env.mood.set, 0.35), 0.66);
    c.fillRect(G.x0, G.y0, 7 * G.cw, 7 * G.ch);
    c.strokeStyle = withAlpha(env.mood.rim, 0.22);
    c.lineWidth = 1;
    for (let r = 0; r <= 7; r++) {
      c.beginPath();
      c.moveTo(G.x0, G.y0 + r * G.ch);
      c.lineTo(G.x0 + 7 * G.cw, G.y0 + r * G.ch);
      c.stroke();
    }
    for (let k = 0; k <= 7; k++) {
      c.beginPath();
      c.moveTo(G.x0 + k * G.cw, G.y0);
      c.lineTo(G.x0 + k * G.cw, G.y0 + 7 * G.ch);
      c.stroke();
    }
    c.restore();
    // each row: the highlighter sweeps the English row, the squares light by their weight
    for (let r = 0; r < 7; r++) {
      const at = p.row[r];
      if (tq < at) continue;
      const sweep = clamp01((tq - at) / SWEEP);
      const yy = G.y0 + r * G.ch;
      if (sweep < 1) {
        const hx = G.x0 + sweep * 7 * G.cw;
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        const g = c.createLinearGradient(hx - 90, 0, hx + 10, 0);
        g.addColorStop(0, withAlpha(env.mood.halo, 0));
        g.addColorStop(1, withAlpha(env.mood.halo, 0.45));
        c.fillStyle = g;
        c.fillRect(hx - 90, yy + 3, 100, G.ch - 6);
        c.globalCompositeOperation = op;
      }
      for (let k = 0; k < 7; k++) {
        const reached = clamp01((sweep * 7 - k) * 1.5);
        const w = ALIGN[r][k];
        lightCell(c, env, G.x0 + k * G.cw, yy, G.cw, G.ch, reached * Math.pow(w, 0.62));
      }
    }
  }

  // the funnel (phase A): squashes on the jam and judders on the twos until it gives
  const jamK = sm((tq - (p.jam - 0.15)) / 0.2) * (1 - sm((tq - p.through) / 0.25));
  const judder = tq >= p.jam - 0.1 && tq < p.through ? (Math.round(tq * 12) % 2 ? 2.5 : -2.5) * jamK : 0;
  funnel(c, env, funA, jamK, judder);

  // the English slips: in a row (A), each sliding into the envelope's mouth and folding as it goes; then out again
  // to head the grid columns (B)
  EN.forEach((w, i) => {
    // A: lift, fold in half on the crease (on twos), then slide down into the envelope's open mouth
    const fu = clamp01((tq - p.fold[i]) / FOLD_DUR);
    const half = sm(fu / 0.45);
    const mv = sm((fu - 0.42) / 0.58);
    const ax = lerp(TY.enAX[i], ENV.x, mv);
    const ay = lerp(EN_A_Y, ENV.y - 4, mv) - 10 * sm(fu / 0.2) * (1 - mv) - Math.sin(mv * Math.PI) * 24;
    const ga = 1 - sm((fu - 0.88) / 0.12);
    if (open <= 0) {
      if (tq < p.fold[i] + FOLD_DUR) slip(c, env, w, ax, ay, enW[i], 46, fs, { half, scale: lerp(1, 0.7, mv), alpha: ga });
    } else {
      // B: the same slips return from the row they left and stand over each column
      const bx = G.x0 + (i + 0.5) * G.cw, by = G.y0 - 6 - TY.colLen / 2;
      const ou = sm((tq - p.open - i * 0.05) / 0.6);
      const lit = r_light(tq, p, i);
      slip(c, env, w, lerp(TY.enAX[i], bx, ou), lerp(EN_A_Y, by, ou), lerp(enW[i], TY.colLen, ou), lerp(46, G.cw - 12, ou), fs, { rot: (-Math.PI / 2) * ou, alpha: sm(ou * 3), light: lit });
    }
  });

  // the envelope (drawn over the slips, so they go INTO it): waits open above the funnel while the slips fold into it, seals, dives, jams, squeezes through
  const appear = sm((tq - (p.fold[0] - 0.25)) / 0.25);
  const sealed = sm((tq - p.seal) / 0.2);
  if (appear > 0 && funA > 0) {
    let ex = ENV.x, ey = ENV.y, es = 1, sx = 1;
    const dive = sm((tq - p.envIn) / 0.9);
    ey = lerp(ENV.y, FUN.neckY - 40, dive);
    es *= lerp(1, 0.5, dive);
    if (tq >= p.jam - 0.15) {
      // jammed: wedged in the neck, squashed, juddering with the funnel
      ex += judder;
      sx = lerp(1, 0.5, jamK);
      ey = lerp(FUN.neckY - 40, FUN.neckY - 22, sm((tq - (p.jam - 0.15)) / 0.3));
    }
    const pass = sm((tq - p.through) / 0.3);
    ey = lerp(ey, FUN.spoutY + 10, pass);
    const ea = appear * (1 - sm((tq - p.through - 0.2) / 0.15));
    envelope(c, env, ex, ey, es, sx, ea, sealed * (1 - dive), sealed, camK);
  }

  // the French: each word comes out of the spout and slides to its place along the bottom (A), then down the
  // grid's side (B)
  FR.forEach((w, i) => {
    const ia = sm((tq - p.frOut[i]) / 0.12);
    if (ia <= 0) return;
    // out of the spout, then straight up into its place in the grid's left column (a fixed pitch: the rows), so
    // the French never stacks or overlaps under the funnel; the grid opens round them on 'look'
    // (each is well clear of the spout before the next appears: 0.17 s apart, 0.26 s of travel, straight lines)
    const sl = sm((tq - p.frOut[i]) / 0.26);
    const bx = G.x0 - 12 - frW[i] / 2, by = G.y0 + (i + 0.5) * G.ch;
    const x0 = FUN.x, y0 = FUN.spoutY + 16;
    const lit = tq >= p.row[i] ? 0.6 * (1 - sm((tq - p.row[i] - 0.35) / 0.5)) : 0;
    const wScale = lerp(0.5, 1, sm((tq - p.frOut[i]) / 0.18));
    slip(c, env, w, lerp(x0, bx, sl), lerp(y0, by, sl), frW[i] * wScale, lerp(40, G.ch - 4, sl), fs, { alpha: ia, light: lit });
  });

  // the quote card, at the plate's lower right from 'squeezed' to the end of the line
  quote(c, env, sm((tq - (p.squeeze - 0.17)) / 0.6), t, p.squeeze - 0.17, camK);
}

/** an English slip is lit while the highlighter passes over it for the current row, by that row's weight */
function r_light(tq: number, p: Plan, col: number): number {
  let best = 0;
  for (let r = 0; r < 7; r++) {
    const at = p.row[r];
    const age = tq - at;
    if (age < 0 || age > 0.75) continue;
    const reach = clamp01(((age / 0.3) * 7 - col) * 1.5);
    best = Math.max(best, reach * ALIGN[r][col] * (1 - clamp01((age - 0.35) / 0.4)));
  }
  return best;
}
