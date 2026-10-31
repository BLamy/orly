/**
 * handwired-explained — THE LEARNED GALLERY (art department 22), shared by ch07-s06 … ch07-s10.
 *
 * Every number this set draws is the gallery's own: films/handwired-explained/research/exports/gallery-story.json,
 * written by research/runs/gallery-story-run.ts, which drives the page's own editor (createLearnedGalleryEditor,
 * src/learned-gallery/learned-gallery.ts at 257856e) frame by frame at 60 Hz exactly as tests/learned-gallery does:
 * the Story preset (10 rectangles), the slider at its default 4 %, the seeded weights (0x517a9e). The app copy is
 * sets/data/ch07-s06-gallery.json.
 *   targets      the Story preset's ten rectangles [left, top, width, height] as fractions of the 5:4 stage
 *   pile         the ten photos at step 0, exactly where the seeded weights put them (photo k = output k)
 *   pair0        before step 1, the min-cost assignment (ordinary JS): rectangle t → photo pair0[t]
 *   step1        the photos after one Adam step (the "hair" they move toward their pairs)
 *   frames       every page frame of the first fit: step, distance from the sketch, misalignment, the photos
 *                (training stops at step 679, inside the README's 630–750)
 *   springs      at step 0, each rectangle's left / right edge error for the 'left' output bias (DG26), and the
 *                bias itself 0.5 → 0.492 after Adam's first step (DG27)
 *
 *   galleryBooth(c, env, B, o)   the 5:4 paper stage on two trestles (a puppet booth), screen at B
 *   photoCard / sketchFrame      a photo (a small paper landscape) and a cut-paper rectangle of the sketch
 *   brassCounter                 a three-to-five-drum brass counter that clicks up to a value
 *   hillRidges / lossRidge       misty dawn ridges for L1 / L2 / L3, and the front ridge cut to the measured loss
 *   traveller                    the lantern-bearing traveller (the mistyHills kit's figure, redrawn here)
 */
import type { PaintEnv } from '../../../film';
import { FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { paperOf, plateInk } from './ch03-s02-plate';
import raw from './data/ch07-s06-gallery.json';

type C2 = CanvasRenderingContext2D;
export type GRect = [number, number, number, number];
export type Pt = { x: number; y: number };

// ------------------------------------------------------------------ the data
interface RawFrame {
  step: number;
  fromSketch: number;
  misalignment: number;
  rects: number[][];
}
const R = raw as unknown as {
  targets: number[][];
  pile: number[][];
  pairingAtStart: { outputByTarget: number[] };
  firstSteps: { step: number; rects: number[][] }[];
  frames: RawFrame[];
  leftBias: { before: number; afterFirstFrame: number; gradientAtSeed: number; springs: { t: number; o: number; eL: number; eR: number }[] };
  stopStep: number;
};
const asRect = (r: number[]): GRect => [r[0], r[1], r[2], r[3]];
/** the merged per-step record: step 0 (the pile), 1, 2, 3 single steps, then every page frame from step 4 */
const TRACK: { step: number; loss: number; rects: GRect[] }[] = (() => {
  const out: { step: number; loss: number; rects: GRect[] }[] = [];
  const f0 = R.frames[0];
  out.push({ step: 0, loss: f0.fromSketch + f0.misalignment, rects: R.pile.map(asRect) });
  for (const s of R.firstSteps) if (s.step < 4) out.push({ step: s.step, loss: NaN, rects: s.rects.map(asRect) });
  for (const f of R.frames) if (f.step >= 4) out.push({ step: f.step, loss: f.fromSketch + f.misalignment, rects: f.rects.map(asRect) });
  // the single steps have no loss recorded: interpolate in log between step 0 and step 4
  const l0 = Math.log10(out[0].loss);
  const i4 = out.findIndex((x) => x.step === 4);
  const l4 = Math.log10(out[i4].loss);
  for (let i = 1; i < i4; i++) out[i].loss = 10 ** (l0 + ((l4 - l0) * out[i].step) / 4);
  return out;
})();

export const GAL = {
  targets: R.targets.map(asRect),
  pile: R.pile.map(asRect),
  /** rectangle t is paired with photo pair0[t] before the first step */
  pair0: R.pairingAtStart.outputByTarget.slice(),
  step1: R.firstSteps[0].rects.map(asRect),
  /** the step at which training stops (the page's rule): 679 */
  stopStep: R.stopStep,
  springs: R.leftBias.springs.slice(),
  biasBefore: R.leftBias.before,
  biasAfter: R.leftBias.afterFirstFrame,
  gradient: R.leftBias.gradientAtSeed,
  /** the final pairing (stable from step 4 on): rectangle t → photo */
  pairEnd: (raw as unknown as { frames: { pairing: number[] }[] }).frames.at(-1)!.pairing.slice(),
  track: TRACK,
};

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
export const lerpRect = (a: GRect, b: GRect, u: number): GRect => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)];

/**
 * Photo k as the seeded start shows it (DG06: the output biases put every photo at 0.18 × 0.18 of the stage near
 * the centre): a square on screen, 0.18 of the stage's width on both sides (0.225 of its height: the stage is 5:4),
 * centred where the seeded weights put photo k (the recorded pile's centre).
 */
export function pileSquare(k: number): GRect {
  const r = GAL.pile[k];
  const cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
  const w = 0.18, h = 0.18 / 0.8;
  return [cx - w / 2, cy - h / 2, w, h];
}

/** the ten photos at a (fractional) training step, from the recorded frames (linear between records) */
export function rectsAtStep(s: number): GRect[] {
  const T = GAL.track;
  if (s <= 0) return T[0].rects;
  if (s >= T[T.length - 1].step) return T[T.length - 1].rects;
  let i = 0;
  while (i < T.length - 2 && T[i + 1].step <= s) i++;
  const a = T[i], b = T[i + 1];
  const u = (s - a.step) / Math.max(1e-6, b.step - a.step);
  return a.rects.map((r, k) => lerpRect(r, b.rects[k], u));
}
/** log10 of the loss at a step (linear in log between records) */
export function logLossAtStep(s: number): number {
  const T = GAL.track;
  if (s <= 0) return Math.log10(T[0].loss);
  if (s >= T[T.length - 1].step) return Math.log10(T[T.length - 1].loss);
  let i = 0;
  while (i < T.length - 2 && T[i + 1].step <= s) i++;
  const a = T[i], b = T[i + 1];
  const u = (s - a.step) / Math.max(1e-6, b.step - a.step);
  return lerp(Math.log10(a.loss), Math.log10(b.loss), u);
}
/** the page's chart axis: log from 0.1 (top) to 1e-11 (bottom) → 0..1 down */
export const chartY = (log10: number) => clamp01((-1 - log10) / 10);

// ------------------------------------------------------------------ helpers
const devOf = (c: C2) => Math.hypot(c.getTransform().a, c.getTransform().b) || 1;
/** a line width in 1080p device px, whatever the transform */
export const px = (c: C2, p: number) => (p * 1.5) / devOf(c);

/** the booth's paper and its ink (a warm parchment lit by the dawn) */
export const screenPaper = (env: Pick<PaintEnv, 'mood'>) => mixLab(paperOf(env), env.mood.halo, 0.12);
export const galInk = (env: Pick<PaintEnv, 'mood'>) => plateInk(env);
/** the booth's wood: one step lighter than the figures (value hierarchy) */
const woodOf = (env: PaintEnv) => mixLab(env.fill('ink'), env.fill('set'), 0.28);
export const brassOf = (env: Pick<PaintEnv, 'mood'>, k = 0) => mixLab(mixLab('#a8823e', env.mood.halo, 0.35), env.mood.core, clamp01(k) * 0.55);

// ------------------------------------------------------------------ the booth
/** the screen's top-left (x, y) and width (layer px); h = 0.8 w (5:4); ground = where the trestles stand */
export interface Booth {
  x: number;
  y: number;
  w: number;
  ground: number;
}
export function boothGeo(B: Booth) {
  const w = B.w, h = w * 0.8;
  const post = w * 0.055;
  const header = w * 0.15;
  const apronTop = B.y + h + w * 0.035;
  const apronH = w * 0.2;
  return {
    screen: { x: B.x, y: B.y, w, h },
    post,
    frame: { x: B.x - post, y: B.y - header, w: w + post * 2, h: h + header },
    apron: { x: B.x - post * 1.4, y: apronTop, w: w + post * 2.8, h: apronH },
    legY: apronTop + apronH,
  };
}
/** a stage fraction (fx, fy) → layer px */
export const stagePt = (B: Booth, fx: number, fy: number): Pt => ({ x: B.x + fx * B.w, y: B.y + fy * B.w * 0.8 });
export const stageRect = (B: Booth, r: GRect) => ({ x: B.x + r[0] * B.w, y: B.y + r[1] * B.w * 0.8, w: r[2] * B.w, h: r[3] * B.w * 0.8 });

/**
 * The booth, baked: two trestles, the apron board, the posts with turned finials, a pierced header (a row of round
 * holes and a sunburst lunette: the backlight shows through), two tied-back paper curtains, and the paper screen.
 * `parts`: 'back' = everything behind the photos (legs, apron, frame, screen), 'front' = the curtains (they overlap
 * the screen's sides, in front of the sketch).
 */
export function galleryBooth(c: C2, env: PaintEnv, B: Booth, parts: 'back' | 'front' = 'back') {
  const G = boothGeo(B);
  const wood = woodOf(env);
  const { x, y, w, h } = G.screen;
  if (parts === 'front') {
    curtains(c, env, B);
    return;
  }
  c.save();
  // trestles: two A-frames under the apron, a cross-brace between them
  c.fillStyle = wood;
  const legs = new Path2D();
  const lw0 = w * 0.03;
  for (const cx of [x + w * 0.16, x + w * 0.84]) {
    const top = G.legY - 2;
    const spread = w * 0.11;
    quad(legs, cx - lw0 * 0.6, top, cx + lw0 * 0.6, top, cx - spread + lw0, B.ground, cx - spread - lw0, B.ground);
    quad(legs, cx - lw0 * 0.6, top, cx + lw0 * 0.6, top, cx + spread + lw0, B.ground, cx + spread - lw0, B.ground);
    const by = lerp(top, B.ground, 0.62);
    const bs = spread * 0.62;
    legs.rect(cx - bs, by - lw0 * 0.4, bs * 2, lw0 * 0.8);
    // feet
    legs.rect(cx - spread - lw0 * 2.2, B.ground - lw0 * 0.6, lw0 * 3.2, lw0 * 0.9);
    legs.rect(cx + spread - lw0, B.ground - lw0 * 0.6, lw0 * 3.2, lw0 * 0.9);
  }
  const brY = lerp(G.legY, B.ground, 0.5);
  legs.rect(x + w * 0.16, brY - lw0 * 0.35, w * 0.68, lw0 * 0.7);
  c.fill(legs);

  // the apron: a board with a moulded lip and a row of small pierced diamonds (backlight through)
  const A = G.apron;
  const apron = new Path2D();
  apron.rect(A.x, A.y, A.w, A.h);
  apron.rect(A.x - w * 0.02, A.y - w * 0.012, A.w + w * 0.04, w * 0.022);
  const nD = 13;
  for (let i = 0; i < nD; i++) {
    const dx = A.x + A.w * ((i + 0.5) / nD);
    const dy = A.y + A.h - w * 0.028;
    const r = w * 0.008;
    apron.moveTo(dx, dy - r);
    apron.lineTo(dx + r, dy);
    apron.lineTo(dx, dy + r);
    apron.lineTo(dx - r, dy);
    apron.closePath();
  }
  c.fillStyle = wood;
  c.fill(apron, 'evenodd');

  // the frame: posts, header, the lunette
  const F = G.frame;
  const fr = new Path2D();
  fr.rect(F.x, F.y, F.w, F.h + w * 0.04);
  fr.rect(x, y, w, h); // the screen opening (filled with paper below)
  // the header's pierced row of round holes
  const nH = 15;
  for (let i = 0; i < nH; i++) {
    const hx = x + w * ((i + 0.5) / nH);
    const hy = F.y + (y - F.y) * 0.42;
    fr.moveTo(hx + w * 0.009, hy);
    fr.arc(hx, hy, w * 0.009, 0, Math.PI * 2);
  }
  // lunette above the header with a sunburst of slots
  const lx = x + w / 2, ly = F.y;
  const lr = w * 0.13;
  fr.moveTo(lx - lr, ly + 1);
  fr.arc(lx, ly + 1, lr, Math.PI, 0);
  fr.closePath();
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + ((i + 0.5) / 9) * Math.PI;
    const r0 = lr * 0.32, r1 = lr * 0.8;
    const da = 0.07;
    fr.moveTo(lx + Math.cos(a - da) * r0, ly + Math.sin(a - da) * r0);
    fr.lineTo(lx + Math.cos(a - da * 0.6) * r1, ly + Math.sin(a - da * 0.6) * r1);
    fr.lineTo(lx + Math.cos(a + da * 0.6) * r1, ly + Math.sin(a + da * 0.6) * r1);
    fr.lineTo(lx + Math.cos(a + da) * r0, ly + Math.sin(a + da) * r0);
    fr.closePath();
  }
  fr.moveTo(lx + lr * 0.2, ly);
  fr.arc(lx, ly, lr * 0.2, 0, Math.PI, true);
  fr.closePath();
  c.fillStyle = wood;
  c.fill(fr, 'evenodd');
  // posts: turned finials and a base block (drawn over the frame's sides)
  const posts = new Path2D();
  for (const px0 of [F.x, F.x + F.w - G.post]) {
    const pcx = px0 + G.post / 2;
    posts.rect(px0 - G.post * 0.15, F.y - w * 0.01, G.post * 1.3, w * 0.025);
    posts.moveTo(pcx + G.post * 0.42, F.y - w * 0.045);
    posts.arc(pcx, F.y - w * 0.045, G.post * 0.42, 0, Math.PI * 2);
    posts.moveTo(pcx + G.post * 0.22, F.y - w * 0.1);
    posts.arc(pcx, F.y - w * 0.1, G.post * 0.22, 0, Math.PI * 2);
    posts.rect(pcx - G.post * 0.12, F.y - w * 0.1, G.post * 0.24, w * 0.06);
  }
  c.fill(posts);

  // the paper screen: warm parchment, brighter at the top where the dawn falls on it, fibres
  c.fillStyle = screenPaper(env);
  c.fillRect(x, y, w, h);
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, withAlpha(env.mood.core, 0.18));
  g.addColorStop(0.5, withAlpha(env.mood.core, 0));
  g.addColorStop(1, withAlpha('#3a2614', 0.18));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha('#6a4a2c', 0.06);
  c.lineWidth = px(c, 1);
  for (let i = 0; i < 46; i++) {
    const fx = x + ((hash1(i, 31) + 1) / 2) * w, fy = y + ((hash1(i, 37) + 1) / 2) * h;
    const a = hash1(i, 41) * Math.PI;
    c.beginPath();
    c.moveTo(fx, fy);
    c.lineTo(fx + Math.cos(a) * w * 0.04, fy + Math.sin(a) * w * 0.04);
    c.stroke();
  }
  // the screen's inner shadow under the header
  const sg = c.createLinearGradient(0, y, 0, y + h * 0.08);
  sg.addColorStop(0, withAlpha('#2a1d14', 0.3));
  sg.addColorStop(1, withAlpha('#2a1d14', 0));
  c.fillStyle = sg;
  c.fillRect(x, y, w, h * 0.08);
  c.restore();
}
function quad(p: Path2D, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  p.lineTo(x2, y2);
  p.lineTo(x3, y3);
  p.closePath();
}
/** two paper curtains tied back at the screen's sides, a scalloped pelmet across the top */
function curtains(c: C2, env: PaintEnv, B: Booth) {
  const G = boothGeo(B);
  const { x, y, w, h } = G.screen;
  const col = mixLab(woodOf(env), env.fill('set'), 0.25);
  const p = new Path2D();
  // pelmet: scallops along the top edge of the screen
  const n = 12;
  p.moveTo(x, y - 1);
  p.lineTo(x + w, y - 1);
  for (let i = n; i > 0; i--) {
    const x1 = x + (w * (i - 1)) / n;
    const xm = (x + (w * i) / n + x1) / 2;
    p.quadraticCurveTo(xm, y + w * 0.05, x1, y + w * 0.012);
  }
  p.closePath();
  // left and right drapes, gathered at a tie two thirds down
  for (const side of [-1, 1]) {
    const ex = side < 0 ? x : x + w;
    const inX = ex - side * w * 0.07;
    const tieY = y + h * 0.62;
    p.moveTo(ex, y);
    p.lineTo(ex - side * w * 0.11, y);
    p.bezierCurveTo(ex - side * w * 0.08, y + h * 0.25, inX, tieY - h * 0.12, ex - side * w * 0.012, tieY);
    p.bezierCurveTo(ex - side * w * 0.03, tieY + h * 0.12, ex - side * w * 0.035, y + h * 0.9, ex - side * w * 0.025, y + h);
    p.lineTo(ex, y + h);
    p.closePath();
  }
  c.fillStyle = col;
  c.fill(p);
  // the fold cut-lines in the drapes and the tie cords (rim ink, faint)
  c.strokeStyle = withAlpha(env.mood.rim, 0.25);
  c.lineWidth = px(c, 1.2);
  for (const side of [-1, 1]) {
    const ex = side < 0 ? x : x + w;
    for (const k of [0.04, 0.07]) {
      c.beginPath();
      c.moveTo(ex - side * w * k, y + h * 0.04);
      c.quadraticCurveTo(ex - side * w * (k * 0.8), y + h * 0.4, ex - side * w * 0.014, y + h * 0.6);
      c.stroke();
    }
  }
}

// ------------------------------------------------------------------ photos and the sketch
/** the ten photos: simple paper landscapes, each its own (sky tone, sun, hills, a tree / house / lake) */
const PHOTO_ART = Array.from({ length: 10 }, (_, k) => ({
  sky: 0.25 + ((hash1(k, 3) + 1) / 2) * 0.5,
  sunX: 0.2 + ((hash1(k, 5) + 1) / 2) * 0.6,
  sunY: 0.22 + ((hash1(k, 7) + 1) / 2) * 0.2,
  hill1: 0.5 + ((hash1(k, 9) + 1) / 2) * 0.15,
  hill2: 0.66 + ((hash1(k, 11) + 1) / 2) * 0.12,
  ph: hash1(k, 13) * 3,
  extra: k % 4, // 0 tree, 1 house, 2 lake, 3 two trees
}));
/** paint photo k's landscape into (x, y, w, h); bake it with f.cached at a canonical size and stretch-cover it */
export function photoArt(c: C2, env: Pick<PaintEnv, 'mood'>, k: number, w: number, h: number) {
  const a = PHOTO_ART[k % 10];
  const m = env.mood;
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, mixLab(m.sky[2], m.halo, a.sky));
  g.addColorStop(0.62, mixLab(m.halo, m.core, 0.35 + a.sky * 0.4));
  g.addColorStop(1, mixLab(m.halo, m.core, 0.3));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.fillStyle = withAlpha(mixLab(m.core, '#ffffff', 0.4), 0.9);
  c.beginPath();
  c.arc(a.sunX * w, a.sunY * h, h * 0.08, 0, Math.PI * 2);
  c.fill();
  const hill = (base: number, amp: number, f: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, h);
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      c.lineTo(u * w, h * (base - amp * Math.sin(u * Math.PI * f + a.ph)));
    }
    c.lineTo(w, h);
    c.closePath();
    c.fill();
  };
  hill(a.hill1, 0.08, 1.6, mixLab(m.set, m.haze, 0.55));
  if (a.extra === 2) {
    c.fillStyle = mixLab(m.core, m.halo, 0.4);
    c.fillRect(0, h * 0.78, w, h * 0.08);
  }
  hill(a.hill2 + (a.extra === 2 ? 0.12 : 0), 0.06, 2.4, mixLab(m.ink, m.set, 0.6));
  c.fillStyle = mixLab(m.ink, m.set, 0.2);
  const ground = h * (a.hill2 + 0.02);
  if (a.extra === 0 || a.extra === 3) {
    const tx = w * (a.extra === 0 ? 0.7 : 0.25);
    c.fillRect(tx - w * 0.012, ground - h * 0.2, w * 0.024, h * 0.2);
    c.beginPath();
    c.ellipse(tx, ground - h * 0.25, w * 0.07, h * 0.1, 0, 0, Math.PI * 2);
    c.fill();
    if (a.extra === 3) {
      c.beginPath();
      c.ellipse(tx + w * 0.16, ground - h * 0.18, w * 0.05, h * 0.07, 0, 0, Math.PI * 2);
      c.fill();
      c.fillRect(tx + w * 0.152, ground - h * 0.12, w * 0.016, h * 0.12);
    }
  } else if (a.extra === 1) {
    const hx = w * 0.62;
    c.beginPath();
    c.moveTo(hx - w * 0.09, ground);
    c.lineTo(hx - w * 0.09, ground - h * 0.12);
    c.lineTo(hx, ground - h * 0.22);
    c.lineTo(hx + w * 0.09, ground - h * 0.12);
    c.lineTo(hx + w * 0.09, ground);
    c.closePath();
    c.fill();
  }
}
export const PHOTO_BAKE = { w: 120, h: 96 };

/**
 * A photo card at a layer rect: the baked landscape `art` (drawAt from f.cached(… PHOTO_BAKE …)) scaled to cover the
 * rect, a thin paper border and a hairline ink edge, a soft contact shadow below-right.
 */
export function photoCard(c: C2, env: PaintEnv, art: (c: C2, x: number, y: number) => void, r: { x: number; y: number; w: number; h: number }, o: { alpha?: number; shadow?: number } = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.003 || r.w < 0.5 || r.h < 0.5) return;
  c.save();
  c.globalAlpha *= a;
  const sh = o.shadow ?? 0.28;
  if (sh > 0) {
    c.fillStyle = withAlpha('#2a1d14', sh);
    c.fillRect(r.x + r.w * 0.03 + 1.2, r.y + 2, r.w, r.h);
  }
  c.fillStyle = mixLab(screenPaper(env), '#fffaf0', 0.4);
  c.fillRect(r.x, r.y, r.w, r.h);
  const b = Math.min(r.w, r.h) * 0.06;
  const iw = r.w - 2 * b, ih = r.h - 2 * b;
  if (iw > 0.5 && ih > 0.5) {
    c.save();
    c.beginPath();
    c.rect(r.x + b, r.y + b, iw, ih);
    c.clip();
    const s = Math.max(iw / PHOTO_BAKE.w, ih / PHOTO_BAKE.h);
    // keep the horizon (about 0.58 of the art) in view however thin the card
    const oy = Math.max(ih - PHOTO_BAKE.h * s, Math.min(0, ih * 0.5 - PHOTO_BAKE.h * s * 0.58));
    c.translate(r.x + b + (iw - PHOTO_BAKE.w * s) / 2, r.y + b + oy);
    c.scale(s, s);
    art(c, 0, 0);
    c.restore();
  }
  c.strokeStyle = withAlpha(galInk(env), 0.55);
  c.lineWidth = px(c, 1);
  c.strokeRect(r.x, r.y, r.w, r.h);
  c.restore();
}

/** one cut-paper rectangle of the sketch: a black card frame with a hand-cut wobble (a hollow, the photo shows in it) */
export function sketchFrame(c: C2, env: PaintEnv, r: { x: number; y: number; w: number; h: number }, o: { alpha?: number; seed?: number; lift?: number; weight?: number } = {}) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const s = o.seed ?? 1;
  const t = Math.max(px(c, 2.6), Math.min(r.w, r.h) * 0.045) * (o.weight ?? 1);
  const lift = o.lift ?? 0;
  const j = (i: number) => hash1(i, s) * t * 0.18;
  const outer = new Path2D();
  outer.moveTo(r.x + j(1), r.y + j(2));
  outer.lineTo(r.x + r.w + j(3), r.y + j(4));
  outer.lineTo(r.x + r.w + j(5), r.y + r.h + j(6));
  outer.lineTo(r.x + j(7), r.y + r.h + j(8));
  outer.closePath();
  outer.moveTo(r.x + t + j(9), r.y + t + j(10));
  outer.lineTo(r.x + t + j(15), r.y + r.h - t + j(16));
  outer.lineTo(r.x + r.w - t + j(13), r.y + r.h - t + j(14));
  outer.lineTo(r.x + r.w - t + j(11), r.y + t + j(12));
  outer.closePath();
  c.save();
  c.globalAlpha *= a;
  if (lift > 0) {
    c.save();
    c.translate(lift * 0.5, lift);
    c.fillStyle = withAlpha('#2a1d14', 0.25);
    c.fill(outer, 'evenodd');
    c.restore();
  }
  c.fillStyle = mixLab(galInk(env), '#000000', 0.25);
  c.fill(outer, 'evenodd');
  c.restore();
}

// ------------------------------------------------------------------ brass counter
/**
 * A small brass counter: a housing with `digits` drums in a dark window, the value rolling up to `value` as u goes
 * 0 → 1 (on twos; each drum rolls through its digits and clicks to rest), the unit engraved under it.
 * (x, y) = the window's centre; returns the box.
 */
export function brassCounter(c: C2, env: PaintEnv, o: { x: number; y: number; value: number; text: string; unit: string; u: number; size: number; alpha?: number; id: string }) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  // the drums are read: keep their digits above the film's legibility floor at any camera distance
  const size = textRole(c, 'subject', () => legibleSize(c, `600 ${o.size}px ${FONT.mono}`, o.size, '0'));
  c.save();
  c.globalAlpha *= a;
  const digitsFont = `600 ${size}px ${FONT.mono}`;
  c.font = digitsFont;
  const dw = c.measureText('0').width * 1.18;
  const nd = o.text.length;
  const ww = dw * nd + size * 0.5;
  const wh = size * 1.3;
  // housing
  c.fillStyle = mixLab(brassOf(env, 0.2), '#2a1d14', 0.45);
  c.beginPath();
  c.roundRect(o.x - ww / 2 - size * 0.25, o.y - wh / 2 - size * 0.22, ww + size * 0.5, wh + size * 0.44, size * 0.2);
  c.fill();
  const hg = c.createLinearGradient(0, o.y - wh / 2, 0, o.y + wh / 2);
  hg.addColorStop(0, brassOf(env, 0.7));
  hg.addColorStop(1, brassOf(env, 0));
  c.strokeStyle = hg;
  c.lineWidth = px(c, 2);
  c.stroke();
  // window
  c.fillStyle = mixLab(env.mood.ink, '#000000', 0.3);
  c.fillRect(o.x - ww / 2, o.y - wh / 2, ww, wh);
  // drums: the value shown so far (rolling up on twos), comma glyphs stay put
  const u = clamp01(o.u);
  const shown = Math.round(o.value * u);
  const full = o.text;
  const digitsOnly = full.replace(/[^0-9]/g, '');
  const shownStr = String(shown).padStart(digitsOnly.length, ' ');
  let di = 0;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.save();
  c.beginPath();
  c.rect(o.x - ww / 2, o.y - wh / 2, ww, wh);
  c.clip();
  for (let i = 0; i < nd; i++) {
    const ch = full[i];
    const cx = o.x - ww / 2 + size * 0.25 + dw * (i + 0.5);
    if (ch < '0' || ch > '9') {
      c.fillStyle = mixLab(env.mood.core, '#fff6e0', 0.3);
      if (u >= 1 || shown >= 1000) c.fillText(ch, cx, o.y + size * 0.05);
      di += 0;
      continue;
    }
    const d = shownStr[di++];
    // a rolling drum: the next digit peeks in from below while it is still counting
    const roll = u > 0 && u < 1 ? ((o.value * u) % 1) * 0.35 : 0;
    c.fillStyle = mixLab(env.mood.core, '#fff6e0', 0.3);
    if (d !== ' ') c.fillText(d, cx, o.y + size * 0.05 - roll * wh);
    // drum separators
    c.strokeStyle = withAlpha(brassOf(env, 0.3), 0.35);
    c.lineWidth = px(c, 1);
    c.beginPath();
    c.moveTo(cx + dw / 2, o.y - wh / 2);
    c.lineTo(cx + dw / 2, o.y + wh / 2);
    c.stroke();
  }
  // glass sheen
  const gl = c.createLinearGradient(0, o.y - wh / 2, 0, o.y + wh / 2);
  gl.addColorStop(0, withAlpha('#fff6e0', 0.16));
  gl.addColorStop(0.45, withAlpha('#fff6e0', 0));
  c.fillStyle = gl;
  c.fillRect(o.x - ww / 2, o.y - wh / 2, ww, wh);
  c.restore();
  textProbe(c, `${o.id}-n`, o.x - ww / 2, o.y - wh / 2, ww, wh, a);
  // the unit, engraved on a small brass plate under the counter
  textRole(c, 'subject', () => {
    const us = legibleSize(c, `italic 500 ${size * 0.72}px ${FONT.text}`, size * 0.72);
    c.font = `italic 500 ${us}px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const uy = o.y + wh / 2 + size * 0.22 + us * 1.05;
    c.fillStyle = mixLab(env.mood.core, '#fff3d0', 0.2);
    c.fillText(o.unit, o.x, uy);
    const tw = c.measureText(o.unit).width;
    textProbe(c, `${o.id}-u`, o.x - tw / 2, uy - us, tw, us * 1.2, a);
  });
  c.restore();
  return { w: ww + size * 0.5, h: wh + size * 0.44 };
}

// ------------------------------------------------------------------ the hills
export interface RidgeSpec {
  /** crest baseline (layer px) and amplitude */
  y: number;
  amp: number;
  /** spatial frequency (cycles per 1000 px) */
  f: number;
  seed: number;
  /** horizontal extent (layer px) */
  x0: number;
  x1: number;
  /** bottom of the fill */
  bottom: number;
  /** pine count per 1000 px and pine height */
  pines?: number;
  pineH?: number;
}
export function ridgePath(r: RidgeSpec): { p: Path2D; yAt: (x: number) => number } {
  const ph = hash1(r.seed, 3) * 10, ph2 = hash1(r.seed, 7) * 10;
  const yAt = (x: number) => r.y - r.amp * (0.6 * Math.sin((x / 1000) * Math.PI * 2 * r.f + ph) + 0.4 * Math.sin((x / 1000) * Math.PI * 2 * r.f * 2.3 + ph2));
  const p = new Path2D();
  p.moveTo(r.x0, r.bottom);
  for (let x = r.x0; x <= r.x1 + 8; x += 8) p.lineTo(x, yAt(x));
  p.lineTo(r.x1 + 8, r.bottom);
  p.closePath();
  const n = Math.round(((r.x1 - r.x0) / 1000) * (r.pines ?? 0));
  const ph0 = r.pineH ?? 14;
  for (let k = 0; k < n; k++) {
    // pines gather in stands, not an even comb
    const cl = Math.floor(k / 5);
    const x = r.x0 + ((hash1(cl, r.seed + 11) + 1) / 2) * (r.x1 - r.x0) + hash1(k, r.seed + 13) * 40;
    const y0 = yAt(x) + 2;
    const hh = ph0 * (0.7 + ((hash1(k, r.seed + 17) + 1) / 2) * 0.9);
    p.moveTo(x - hh * 0.26, y0);
    p.lineTo(x - hh * 0.12, y0 - hh * 0.9);
    p.lineTo(x - hh * 0.2, y0 - hh * 0.9);
    p.lineTo(x, y0 - hh * 1.9);
    p.lineTo(x + hh * 0.2, y0 - hh * 0.9);
    p.lineTo(x + hh * 0.12, y0 - hh * 0.9);
    p.lineTo(x + hh * 0.26, y0);
    p.closePath();
  }
  return { p, yAt };
}

/**
 * The front ridge cut to the measured loss: x = training step (0 … `steps`), height = log10 of the loss on the page
 * chart's own axis (0.1 at the top, 1e-11 at the bottom), mapped into the box. Grass tufts along the crest.
 */
export function lossRidge(box: { x: number; y: number; w: number; h: number; bottom: number; steps: number; deckle?: number }) {
  const sx = (s: number) => box.x + (s / box.steps) * box.w;
  const sy = (s: number) => box.y + chartY(logLossAtStep(s)) * box.h;
  /** the cut edge: a small deckle (scissor nicks, px) laid on the measured crest, never more than `deckle` */
  const dk = box.deckle ?? 0;
  const nick = (s: number) => (dk > 0 ? Math.abs(hash1(Math.round(s / 2), 97)) * dk * (Math.round(s / 2) % 3 === 0 ? 1 : 0.35) : 0);
  const p = new Path2D();
  // a gentle shoulder before step 0, so the ridge does not start with a cliff edge
  const left = box.x - box.w * 0.18;
  p.moveTo(left, box.bottom);
  for (let x = left; x < box.x; x += 6) {
    const u = (x - left) / (box.x - left);
    p.lineTo(x, lerp(box.y + box.h * 0.12, sy(0), sm(u)) - Math.sin(u * Math.PI) * box.h * 0.04);
  }
  for (let s = 0; s <= box.steps; s += 2) p.lineTo(sx(s), sy(s) + nick(s));
  const right = box.x + box.w * 1.25;
  for (let x = sx(box.steps); x <= right; x += 10) p.lineTo(x, sy(box.steps) - Math.sin(((x - sx(box.steps)) / (right - sx(box.steps))) * Math.PI) * box.h * 0.03);
  p.lineTo(right, box.bottom);
  p.closePath();
  // tufts along the crest
  for (let k = 0; k < 90; k++) {
    const s = ((hash1(k, 71) + 1) / 2) * box.steps;
    const x = sx(s), y = sy(s) + 1.5;
    for (let j = 0; j < 3; j++) {
      const a = hash1(k * 3 + j, 73) * 0.5;
      const L = 4 + ((hash1(k * 3 + j, 79) + 1) / 2) * 6;
      p.moveTo(x + j * 1.6 - 1, y);
      p.lineTo(x + j * 1.6 + Math.sin(a) * L, y - Math.cos(a) * L);
      p.lineTo(x + j * 1.6 + 1.2, y);
      p.closePath();
    }
  }
  return { p, sx, sy };
}

/** A hooded traveller with a staff and a lantern, feet at (x, y), height hgt (the mistyHills kit's figure). Walk on twos. */
export function traveller(c: C2, env: PaintEnv, x: number, y: number, hgt: number, facing: 1 | -1, tq: number, walking: boolean, alpha = 1, ink?: string) {
  const ph = walking ? Math.sin(Math.floor(tq * 12) * (Math.PI / 4)) : 0;
  const s = hgt / 100;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.scale(facing * s, s);
  const col = ink ?? env.fill('ink');
  c.fillStyle = col;
  c.strokeStyle = col;
  c.lineCap = 'round';
  const legA = ph * 0.42;
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(0, -34);
  c.lineTo(Math.sin(legA) * 30, -Math.cos(legA) * 30 - 2);
  c.moveTo(0, -34);
  c.lineTo(Math.sin(-legA) * 30, -Math.cos(legA) * 30 - 2);
  c.stroke();
  const sw = -4 - ph * 3;
  c.beginPath();
  c.moveTo(4, -86);
  c.quadraticCurveTo(14, -60, 14, -30);
  c.lineTo(sw - 18, -24);
  c.quadraticCurveTo(-20, -60, -8, -84);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(-16, -70, 9, 14, -0.25, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(-10, -84);
  c.quadraticCurveTo(-14, -104, 2, -108);
  c.quadraticCurveTo(14, -106, 12, -92);
  c.lineTo(14, -88);
  c.lineTo(10, -86);
  c.quadraticCurveTo(4, -80, -10, -84);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-6, -104);
  c.quadraticCurveTo(-20, -104, -24, -94);
  c.lineTo(-10, -96);
  c.fill();
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(4, -74);
  c.lineTo(20, -60);
  c.stroke();
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(14, 0);
  c.lineTo(30, -122);
  c.quadraticCurveTo(36, -130, 44, -124);
  c.stroke();
  // the lantern hanging from the crook
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(44, -124);
  c.lineTo(44, -112);
  c.stroke();
  c.fillStyle = col;
  c.fillRect(38, -112, 12, 3);
  c.fillRect(38, -96, 12, 3);
  c.fillStyle = mixLab(env.mood.core, '#fff6e0', 0.3);
  c.fillRect(39.5, -109, 9, 13);
  c.restore();
  // the lantern's position (world), for its glow
  return { x: x + facing * 44 * s, y: y - 103 * s };
}

/** a soft additive glow (for lanterns drawn inside a layer) */
export function glowAt(c: C2, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0.003) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(col, a));
  g.addColorStop(0.35, withAlpha(col, a * 0.4));
  g.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

/** grass tufts / a meadow edge along y from x0 to x1 (a path; fill with the ground colour) */
export function meadow(x0: number, x1: number, y: number, bottom: number, seed: number, tuft = 9): Path2D {
  const p = new Path2D();
  p.moveTo(x0, bottom);
  for (let x = x0; x <= x1 + 6; x += 6) p.lineTo(x, y + Math.sin(x * 0.013 + seed) * 3 + Math.sin(x * 0.041 + seed * 2) * 1.5);
  p.lineTo(x1 + 6, bottom);
  p.closePath();
  const n = Math.round((x1 - x0) / 7);
  for (let k = 0; k < n; k++) {
    const x = x0 + ((hash1(k, seed) + 1) / 2) * (x1 - x0);
    const y0 = y + Math.sin(x * 0.013 + seed) * 3 + 2;
    const L = tuft * (0.5 + (hash1(k, seed + 3) + 1) / 2);
    const a = hash1(k, seed + 5) * 0.45;
    p.moveTo(x - 1.4, y0);
    p.lineTo(x + Math.sin(a) * L, y0 - Math.cos(a) * L);
    p.lineTo(x + 1.4, y0);
    p.closePath();
  }
  return p;
}
