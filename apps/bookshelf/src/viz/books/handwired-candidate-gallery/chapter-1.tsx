// Three Layouts at Once
//
// Three Layouts (handwired-candidate-gallery) — chapter 1. Source pin:
// chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT), lab/candidate-gallery.
//   README.md:7 (root: "matrix multiplication + reglu over floats"; no skipping work)
//   lab/candidate-gallery/candidate-gallery.ts:19 (photoCount 12), 21-27 (layoutNames, layout ids),
//     165-206 (Contact: relu(W − 5·gap)/4 × relu(H − 4·gap)/3, column = item % 4, no hero),
//     208-266 (Cinema: rail = min(280, 0.28·W), hero, 2-column rail, column = slot % 2),
//     268-322 (Story: hero height = min(0.72·W, 0.58·H), thumbnails in 3 columns, column = slot % 3),
//     324-332 (every candidate built, then emitArgmax), 402-414 (gap 14, cinemaRailMaximum 280, focus on photo 0)
//   lab/candidate-gallery/candidate-gallery.test.ts:100-122 (finite, bounded geometry at tiny sizes)
//   src/runtime/numeric-ui-core.ts:1934-1936 (emitRelu)
//   lab/ui-exploration/guide/patterns/run-every-candidate.md:52 (417 operations in 60 layers, compiled)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). Every rectangle on screen is a line-for-line port of the lab's three
// candidate geometries (below), evaluated at the sampled viewport width; the module throws if the
// 1400 × 680 values ever disagree with the fact-checked plan. The pile of photos in the opening and the
// photo hues are illustration only.
import type { ReactNode } from 'react';
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import 'katex/dist/katex.min.css';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px
const ACC = '#3fb6a8'; // the book's accent
const RELU_C = colors.SECONDARY;
const GAP_C = colors.WARM;
const f1 = (v: number): string => {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

// ---------------------------------------------------------------------------
// The lab's three candidate geometries (candidate-gallery.ts:165-322), exact
// ---------------------------------------------------------------------------

const relu = (x: number): number => Math.max(0, x);
const GAP = 14; // source[sourceField.gap] = 14
const RAIL_MAX = 280; // source[sourceField.cinemaRailMaximum] = 280
const PHOTOS = 12; // photoCount
const H0 = 680;

type R = { l: number; t: number; w: number; h: number };
type Row = { label: string; vals: Array<{ v: number; clamped?: boolean }>; sep?: string };
type Cand = {
  thumbs: R[];
  hero: R | null;
  /** the two sides of this layout's min(...), when it has one */
  pair?: { a: number; b: number; aLabel: string; bLabel: string };
  rows: Row[];
};

function cinema(W: number, H: number, g = GAP): Cand {
  const railB = 0.28 * W;
  const rail = Math.min(RAIL_MAX, railB);
  const heroWPre = W - rail - 3 * g;
  const hero = { l: g, t: g, w: relu(heroWPre), h: relu(H - 2 * g) };
  const twPre = 0.5 * rail - 0.5 * g;
  const tw = relu(twPre);
  const th = relu(H / 6 - (7 / 6) * g);
  const railLeft = hero.l + hero.w + g;
  const thumbs = Array.from({ length: PHOTOS }, (_, slot) => {
    const column = slot % 2;
    const row = Math.floor(slot / 2);
    return { l: railLeft + tw * column + g * column, t: g * (1 + row) + th * row, w: tw, h: th };
  });
  return {
    thumbs,
    hero,
    pair: { a: RAIL_MAX, b: railB, aLabel: 'cinemaRailMaximum', bLabel: '0.28·W' },
    rows: [
      { label: 'hero  ', vals: [{ v: hero.w, clamped: heroWPre < 0 }, { v: hero.h }] },
      { label: 'thumb ', vals: [{ v: tw, clamped: twPre < 0 }, { v: th }] },
      { label: 'photo 7  left ', vals: [{ v: thumbs[7].l }, { v: thumbs[7].t }], sep: ' · top ' },
    ],
  };
}

function contact(W: number, H: number, g = GAP): Cand {
  const innerWPre = W - 5 * g;
  const innerHPre = H - 4 * g;
  const cw = relu(innerWPre) / 4;
  const chh = relu(innerHPre) / 3;
  const thumbs = Array.from({ length: PHOTOS }, (_, item) => {
    const column = item % 4;
    const row = Math.floor(item / 4);
    return { l: g * (1 + column) + cw * column, t: g * (1 + row) + chh * row, w: cw, h: chh };
  });
  return {
    thumbs,
    hero: null,
    rows: [
      { label: 'inner ', vals: [{ v: relu(innerWPre), clamped: innerWPre < 0 }, { v: relu(innerHPre), clamped: innerHPre < 0 }] },
      { label: 'cell  ', vals: [{ v: cw, clamped: innerWPre < 0 }, { v: chh, clamped: innerHPre < 0 }] },
      { label: 'photo 7  left ', vals: [{ v: thumbs[7].l }, { v: thumbs[7].t }], sep: ' · top ' },
    ],
  };
}

function story(W: number, H: number, g = GAP): Cand {
  const hA = 0.72 * W;
  const hB = 0.58 * H;
  const hh = Math.min(hA, hB);
  const heroWPre = W - 2 * g;
  const hero = { l: g, t: g, w: relu(heroWPre), h: hh };
  const regionTop = hh + 2 * g;
  const twPre = W / 3 - (4 / 3) * g;
  const thPre = H / 4 - hh / 4 - (6 / 4) * g;
  const tw = relu(twPre);
  const th = relu(thPre);
  const thumbs = Array.from({ length: PHOTOS }, (_, slot) => {
    const column = slot % 3;
    const row = Math.floor(slot / 3);
    return { l: g * (1 + column) + tw * column, t: regionTop + g * row + th * row, w: tw, h: th };
  });
  return {
    thumbs,
    hero,
    pair: { a: hA, b: hB, aLabel: '0.72·W', bLabel: '0.58·H' },
    rows: [
      { label: 'hero  ', vals: [{ v: hero.w, clamped: heroWPre < 0 }, { v: hh }] },
      { label: 'thumb ', vals: [{ v: tw, clamped: twPre < 0 }, { v: th, clamped: thPre < 0 }] },
      { label: 'photo 7  left ', vals: [{ v: thumbs[7].l }, { v: thumbs[7].t }], sep: ' · top ' },
    ],
  };
}

const BUILD = [cinema, contact, story];
const NAMES = ['Cinema', 'Contact', 'Story'] as const;
const IDS = ['layout.cinema 0', 'layout.contact 1', 'layout.story 2'];
const CODE = ['column = slot % 2 · row = floor(slot / 2)', 'column = item % 4 · row = floor(item / 4)', 'column = slot % 3 · row = floor(slot / 3)'];

// the fact-checked numbers at 1400 × 680 (plan.md ch1 on-screen labels; review.md "Visuals in plan.md")
{
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  const c = cinema(1400, 680);
  const k = contact(1400, 680);
  const s = story(1400, 680);
  const ok =
    near(k.thumbs[0].w, 332.5) && near(k.thumbs[0].h, 208) &&
    near(c.hero!.w, 1078) && near(c.hero!.h, 652) && near(c.thumbs[0].w, 133) && near(c.thumbs[0].h, 97) &&
    near(c.thumbs[0].l, 1106) && near(c.thumbs[7].l, 1253) && near(c.thumbs[7].t, 347) &&
    near(s.hero!.h, 394.4) && near(s.hero!.w, 1372) && near(s.thumbs[0].w, 448) && near(s.thumbs[0].h, 50.4);
  if (!ok) throw new Error('candidate geometry disagrees with the fact-checked plan');
  // candidate-gallery.test.ts:100-122 — a 20 px sliver stays finite and non-negative
  for (const b of BUILD) {
    const g = b(20, 680);
    for (const r of [...g.thumbs, ...(g.hero ? [g.hero] : [])]) {
      if (![r.l, r.t, r.w, r.h].every((x) => Number.isFinite(x) && x >= 0)) throw new Error('sliver geometry is not finite');
    }
  }
}

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const S = 0.26; // stage pixels → screen
const SLOT_W = 1400 * S; // 364
const FRAME_X = [40, 458, 876];
const FRAME_Y = 150;
const HEADER_Y = 98;
const NAME_Y = 136;
const PANEL_Y = 352;
const hue = (i: number): string => `hsl(${(196 + i * 30) % 360}, 52%, 60%)`;

/** the opening pile: twelve photos fanned at the stage's centre (illustration) */
const pileRect = (i: number, W: number): R => ({ l: W / 2 - 95 + (i - 5.5) * 30, t: H0 / 2 - 60 + (i % 2 === 0 ? -22 : 22) + (i - 5.5) * 4, w: 190, h: 120 });
const lerpR = (a: R, b: R, u: number): R => ({ l: lerp(a.l, b.l, u), t: lerp(a.t, b.t, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) });

const CAM_INTRO: CameraState = { x: 640, y: 245, k: 1.45 };
const CAM_CONTACT: CameraState = { x: 640, y: 320, k: 1.45 };

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — ten fixed captions, ≈113 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_INTRO, cameraInterp);
  const W = tl.channel('viewportWidth', 1400);

  const frameU = tl.channel('frameU', 0);
  const headerU = tl.channel('headerU', 0);
  const pileU = tl.channel('pileU', 0);
  const gripU = tl.channel('gripU', 0);
  const qU = tl.channel('questionU', 0);
  const reluChipU = tl.channel('reluChipU', 0);
  const ifChipU = tl.channel('ifChipU', 0);
  const strikeU = tl.channel('ifStrikeU', 0);
  const introOp = tl.channel('introOp', 1);
  const splitU = tl.channel('splitU', 0);
  const namesU = tl.channel('namesU', 0);
  const legendU = tl.channel('legendU', 0);
  const op = [tl.channel('cinemaOp', 1), tl.channel('contactOp', 1), tl.channel('storyOp', 1)];
  const settle = [tl.channel('cinemaSettle', 0), tl.channel('contactSettle', 0), tl.channel('storySettle', 0)];
  const code = [tl.channel('cinemaCode', 0), tl.channel('contactCode', 0), tl.channel('storyCode', 0)];
  const heroLbl = tl.channel('heroLabel', 0);
  const tokensU = tl.channel('headerTokens', 0);
  const rulerU = tl.channel('rulerU', 0);
  const texWU = tl.channel('texWU', 0);
  const numsU = tl.channel('numsU', 0);
  const texHU = tl.channel('texHU', 0);
  const cellRing = tl.channel('cellRing', 0);
  const contactMathOp = tl.channel('contactMathOp', 1);
  const panel = [tl.channel('cinemaPanel', 0), tl.channel('contactPanel', 0), tl.channel('storyPanel', 0)];
  const bars = [tl.channel('cinemaBars', 0), tl.channel('contactBars', 0), tl.channel('storyBars', 0)];
  const dimsU = [tl.channel('cinemaDims', 0), tl.channel('contactDims', 0), tl.channel('storyDims', 0)];
  const thumbGlow = tl.channel('storyThumbGlow', 0);
  const p7U = tl.channel('photo7U', 0);
  const dragHi = tl.channel('dragHi', 0);
  const counterU = tl.channel('counterU', 0);
  const countN = tl.channel('countN', 0);
  const endDim = tl.channel('endDim', 0);
  const qmarkU = tl.channel('qmarkU', 0);
  const sideOp = tl.channel('sideLabelsOp', 1);

  // — B1 · a window resizes; twelve photos; weighted sums and relu, no skipping —
  tl.caption({ at: 0.4, dur: 13.0, text: "When a gallery's window resizes, twelve photos need a layout. But a Handwired program is fixed weighted sums and relu, which zeroes negatives. It cannot skip work the way an if statement does." });
  tl.tween(frameU, 1, { at: 0.4, dur: 1.0, ease: ease.draw });
  tl.tween(headerU, 1, { at: 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(pileU, 1, { at: 1.0, dur: 1.2, ease: ease.linear });
  tl.tween(gripU, 1, { at: 1.8, dur: 0.4, ease: ease.enter });
  tl.tween(W, 1180, { at: 2.2, dur: 1.0, ease: ease.move });
  tl.tween(W, 1400, { at: 3.3, dur: 1.0, ease: ease.move });
  tl.tween(gripU, 0, { at: 4.4, dur: 0.4, ease: ease.move });
  tl.tween(qU, 1, { at: 3.6, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 5.0, dur: 1.4, ease: ease.move });
  tl.tween(reluChipU, 1, { at: 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(ifChipU, 1, { at: 9.6, dur: 0.6, ease: ease.enter });
  tl.tween(strikeU, 1, { at: 10.6, dur: 0.6, ease: ease.draw });
  tl.hold(13.4, 0.6);

  // — B2 · build all the answers: the stage splits into three —
  tl.caption({ at: 14.0, dur: 9.0, text: 'So this lab builds all the answers. On every frame it computes three complete layouts, and only afterwards decides which one to show.' });
  tl.tween(introOp, 0, { at: 14.0, dur: 0.6, ease: ease.move });
  tl.tween(splitU, 1, { at: 14.6, dur: 1.4, ease: ease.move });
  tl.tween(namesU, 1, { at: 15.8, dur: 0.6, ease: ease.enter });
  tl.tween(legendU, 1, { at: 16.2, dur: 0.6, ease: ease.enter });
  tl.hold(23.0, 0.6);

  // — B3 · Cinema: hero + a two-column rail —
  tl.caption({ at: 23.6, dur: 8.0, text: 'Cinema is a hero photo with a rail of thumbnails beside it, two columns wide. The hero is the photo in focus.' });
  tl.tween(op[1], 0.15, { at: 23.6, dur: 0.6, ease: ease.move });
  tl.tween(op[2], 0.15, { at: 23.6, dur: 0.6, ease: ease.move });
  tl.tween(settle[0], 1, { at: 24.0, dur: 2.2, ease: ease.move });
  tl.tween(code[0], 1, { at: 26.2, dur: 0.6, ease: ease.enter });
  tl.tween(heroLbl, 1, { at: 28.4, dur: 0.6, ease: ease.enter });
  tl.hold(31.6, 0.6);

  // — B4 · Contact: a 4 × 3 sheet, no hero; Story: hero across the top, three columns —
  tl.caption({ at: 32.2, dur: 11.0, text: 'The Contact sheet has no hero: twelve equal thumbnails in four columns and three rows. Story lays the hero across the top, with thumbnails below in three columns.' });
  tl.tween(op[0], 0.15, { at: 32.2, dur: 0.6, ease: ease.move });
  tl.tween(op[1], 1, { at: 32.2, dur: 0.6, ease: ease.move });
  tl.tween(settle[1], 1, { at: 32.6, dur: 2.0, ease: ease.move });
  tl.tween(code[1], 1, { at: 34.6, dur: 0.6, ease: ease.enter });
  tl.tween(op[1], 0.15, { at: 37.2, dur: 0.6, ease: ease.move });
  tl.tween(op[2], 1, { at: 37.2, dur: 0.6, ease: ease.move });
  tl.tween(settle[2], 1, { at: 37.5, dur: 2.0, ease: ease.move });
  tl.tween(code[2], 1, { at: 39.5, dur: 0.6, ease: ease.enter });
  for (const ch of [op[0], op[1]]) tl.tween(ch, 1, { at: 41.6, dur: 0.8, ease: ease.move });
  tl.hold(43.2, 0.6);

  // — B5 · positions are sums of W, H and the gap; push in on one Contact cell —
  tl.caption({ at: 43.8, dur: 12.0, text: "Positions are sums of the stage's width, its height and a 14 pixel gap, with clamps along the way. A Contact cell's width is the width minus five gaps, divided by four." });
  for (const ch of [...code, heroLbl]) tl.tween(ch, 0, { at: 43.8, dur: 0.6, ease: ease.move });
  tl.tween(op[0], 0.15, { at: 43.8, dur: 0.8, ease: ease.move });
  tl.tween(op[2], 0.15, { at: 43.8, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_CONTACT, { at: 44.0, dur: 1.4, ease: ease.move });
  tl.tween(sideOp, 0, { at: 43.8, dur: 0.6, ease: ease.move });
  tl.tween(tokensU, 1, { at: 44.6, dur: 0.6, ease: ease.enter });
  tl.tween(rulerU, 1, { at: 47.0, dur: 1.6, ease: ease.draw });
  tl.tween(texWU, 1, { at: 50.6, dur: 0.6, ease: ease.enter });
  tl.hold(55.8, 0.6);

  // — B6 · the numbers for 1400 × 680; pull back —
  tl.caption({ at: 56.4, dur: 8.6, text: 'On a 1,400 by 680 stage, that makes a Contact cell 332 and a half pixels wide and 208 tall.' });
  tl.tween(numsU, 1, { at: 57.2, dur: 0.6, ease: ease.enter });
  tl.tween(cellRing, 1, { at: 57.6, dur: 0.5, ease: ease.pop });
  tl.tween(texHU, 1, { at: 59.6, dur: 0.6, ease: ease.enter });
  tl.tween(tokensU, 0, { at: 62.4, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 62.6, dur: 1.4, ease: ease.move });
  tl.tween(sideOp, 1, { at: 63.4, dur: 0.6, ease: ease.move });
  tl.hold(65.0, 0.6);

  // — B7 · Cinema's capped rail; Story's shorter hero —
  tl.caption({ at: 65.6, dur: 12.4, text: "Cinema caps its rail at 280 pixels, leaving a hero 1,078 by 652. Story's hero is 394 tall, so its thumbnails get just over 50 pixels of height." });
  tl.tween(contactMathOp, 0, { at: 65.6, dur: 0.6, ease: ease.move });
  tl.tween(op[1], 0.15, { at: 65.6, dur: 0.6, ease: ease.move });
  tl.tween(op[0], 1, { at: 65.6, dur: 0.6, ease: ease.move });
  tl.tween(panel[0], 1, { at: 66.0, dur: 0.6, ease: ease.enter });
  tl.tween(bars[0], 1, { at: 66.6, dur: 1.0, ease: ease.draw });
  tl.tween(dimsU[0], 1, { at: 68.4, dur: 0.6, ease: ease.enter });
  tl.tween(op[0], 0.15, { at: 71.2, dur: 0.6, ease: ease.move });
  tl.tween(panel[0], 0.15, { at: 71.2, dur: 0.6, ease: ease.move });
  tl.tween(op[2], 1, { at: 71.2, dur: 0.6, ease: ease.move });
  tl.tween(panel[2], 1, { at: 71.4, dur: 0.6, ease: ease.enter });
  tl.tween(bars[2], 1, { at: 72.0, dur: 1.0, ease: ease.draw });
  tl.tween(dimsU[2], 1, { at: 73.2, dur: 0.6, ease: ease.enter });
  tl.tween(thumbGlow, 1, { at: 75.0, dur: 0.5, ease: ease.enter });
  tl.hold(78.0, 0.6);

  // — B8 · drag the stage narrower: every number slides; relu pins the negatives at zero —
  tl.caption({ at: 78.6, dur: 12.0, text: 'Drag the stage narrower and every number slides along. Where a subtraction would go negative, a relu pins it at zero, so even a 20 pixel sliver gets finite sizes.' });
  for (const ch of [...op, ...panel]) tl.tween(ch, 1, { at: 78.6, dur: 0.6, ease: ease.move });
  for (const ch of [...dimsU, thumbGlow]) tl.tween(ch, 0, { at: 78.6, dur: 0.6, ease: ease.move });
  tl.tween(bars[1], 1, { at: 78.8, dur: 0.6, ease: ease.enter });
  tl.tween(p7U, 1, { at: 79.0, dur: 0.6, ease: ease.enter });
  tl.tween(gripU, 1, { at: 79.2, dur: 0.4, ease: ease.enter });
  tl.tween(dragHi, 1, { at: 79.4, dur: 0.4, ease: ease.enter });
  tl.tween(W, 600, { at: 80.0, dur: 2.4, ease: ease.move });
  tl.tween(W, 20, { at: 84.4, dur: 2.4, ease: ease.move });
  tl.hold(90.6, 0.6);

  // — B9 · nothing chosen: 417 operations in 60 layers, every frame —
  tl.caption({ at: 91.2, dur: 11.4, text: 'Nothing is chosen yet. All three layouts, plus the click and focus logic, are 417 operations in 60 layers, and every frame computes every one.' });
  tl.tween(W, 1400, { at: 91.2, dur: 2.0, ease: ease.move });
  for (const ch of [...panel, p7U, gripU, dragHi]) tl.tween(ch, 0, { at: 92.6, dur: 0.8, ease: ease.move });
  tl.tween(counterU, 1, { at: 94.6, dur: 0.6, ease: ease.enter });
  tl.tween(countN, 1, { at: 94.6, dur: 1.6, ease: ease.linear });
  tl.hold(102.6, 0.6);

  // — B10 · which one? —
  tl.caption({ at: 103.2, dur: 7.0, text: 'Building every answer is the price of having no branch. The next question is how to pick one.' });
  tl.tween(endDim, 1, { at: 103.2, dur: 0.8, ease: ease.move });
  tl.tween(qmarkU, 1, { at: 105.6, dur: 0.6, ease: ease.pop });
  tl.hold(110.2, 2.6);

  return {
    tl, cam, W, frameU, headerU, pileU, gripU, qU, reluChipU, ifChipU, strikeU, introOp, splitU, namesU, legendU,
    op, settle, code, heroLbl, tokensU, rulerU, texWU, numsU, texHU, cellRing, contactMathOp, panel, bars, dimsU,
    thumbGlow, p7U, dragHi, counterU, countN, endDim, qmarkU, sideOp,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/** Violet hockey stick: flat to the middle, then a 45° rise. (x, y) is the bottom-left. */
function ReluGlyph({ x, y, w = 18, color = RELU_C, width = 2.2, opacity = 1 }: {
  x: number; y: number; w?: number; color?: string; width?: number; opacity?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <path
      d={`M ${x} ${y} L ${x + w / 2} ${y} L ${x + w} ${y - w / 2}`}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}

/** One photo rectangle in a mini-stage; collapses to a line or a dot when relu zeroes a side. */
function Photo({ x, y, r, i, label = true }: { x: number; y: number; r: R; i: number; label?: boolean }) {
  const px = x + r.l * S;
  const py = y + r.t * S;
  const w = r.w * S;
  const h = r.h * S;
  if (w < 1.2 && h < 1.2) return <circle cx={px} cy={py} r={1.6} fill={hue(i)} />;
  if (w < 1.2) return <line x1={px} y1={py} x2={px} y2={py + h} stroke={hue(i)} strokeWidth={1.6} />;
  if (h < 1.2) return <line x1={px} y1={py} x2={px + w} y2={py} stroke={hue(i)} strokeWidth={1.6} />;
  return (
    <g>
      <rect x={px} y={py} width={w} height={h} rx={Math.min(3, w / 4, h / 4)} fill={hue(i)} fillOpacity={0.82} stroke={colors.BG} strokeWidth={1} />
      {label && w >= 18 && h >= 16 && (
        <text x={px + w / 2} y={py + h / 2 + 4.3} textAnchor="middle" fontSize={12} fontFamily={MONO} fontWeight={700} fill="#0a0e1a">
          {i}
        </text>
      )}
    </g>
  );
}

/** A mono row whose values turn violet (with a relu hinge) when a relu has pinned them at zero. */
function ValueRow({ x, y, row, opacity = 1, glow = 0 }: { x: number; y: number; row: Row; opacity?: number; glow?: number }) {
  if (opacity <= 0.005) return null;
  const parts: Array<{ s: string; c: string }> = [{ s: row.label, c: colors.MUTED }];
  row.vals.forEach((v, i) => {
    if (i > 0) parts.push({ s: row.sep ?? ' × ', c: colors.MUTED });
    parts.push({ s: f1(v.v), c: v.clamped ? RELU_C : colors.TEXT });
  });
  const len = parts.reduce((n, p) => n + p.s.length, 0);
  const anyClamped = row.vals.some((v) => v.clamped);
  return (
    <g opacity={opacity}>
      {glow > 0.01 && <rect x={x - 6} y={y - 14} width={len * CH13 + 12} height={20} rx={4} fill={colors.WARM} opacity={0.2 * glow} />}
      <text x={x} y={y} fontSize={13} fontFamily={MONO} xmlSpace="preserve">
        {parts.map((p, i) => (
          <tspan key={i} fill={p.c}>
            {p.s}
          </tspan>
        ))}
      </text>
      {anyClamped && (
        <g>
          <ReluGlyph x={x + len * CH13 + 10} y={y - 1} w={16} />
          <text x={x + len * CH13 + 32} y={y} fontSize={12} fontFamily={MONO} fill={RELU_C}>
            relu → 0
          </text>
        </g>
      )}
    </g>
  );
}

/** The two sides of a min(...): two bars, the shorter one wins (amber). */
function MinBars({ x, y, pair, scale, u, title }: {
  x: number; y: number; pair: NonNullable<Cand['pair']>; scale: number; u: number; title: string;
}) {
  const winA = pair.a <= pair.b;
  const bar = (yy: number, label: string, v: number, win: boolean) => (
    <g>
      <text x={x} y={yy + 4} fontSize={12} fontFamily={MONO} fill={win ? colors.WARM : colors.MUTED}>
        {label}
      </text>
      <rect x={x + 138} y={yy - 6} width={Math.max(1, v * scale * u)} height={12} rx={2} fill={win ? colors.WARM : colors.MUTED} opacity={win ? 0.9 : 0.4} />
      <text x={x + 146 + v * scale * u} y={yy + 4} fontSize={12} fontFamily={MONO} fill={win ? colors.WARM : colors.MUTED} opacity={u}>
        {f1(v)}
      </text>
    </g>
  );
  return (
    <g>
      <text x={x} y={y} fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
        {title}
      </text>
      {bar(y + 20, pair.aLabel, pair.a, winA)}
      {bar(y + 38, pair.bLabel, pair.b, !winA)}
    </g>
  );
}

function Chip({ x, y, w, h, stroke, children, opacity }: { x: number; y: number; w: number; h: number; stroke: string; children: ReactNode; opacity: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={colors.PANEL} stroke={stroke} strokeWidth={1.5} />
      {children}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const Wd = Math.max(0, Math.round(v(scene.W)));
  const cands = BUILD.map((b) => b(Wd, H0));

  const splitU = v(scene.splitU);
  const frameU = v(scene.frameU);
  const pileU = v(scene.pileU);
  const introOp = v(scene.introOp);
  const endDim = lerp(1, 0.4, v(scene.endDim));
  const p7U = v(scene.p7U);
  const gripU = v(scene.gripU);
  const dragHi = v(scene.dragHi);
  const tokensU = v(scene.tokensU);
  const mathOp = v(scene.contactMathOp);
  const rulerU = v(scene.rulerU) * mathOp;
  const numsU = v(scene.numsU) * mathOp;
  const counterU = v(scene.counterU);
  const countN = v(scene.countN);
  const qmarkU = v(scene.qmarkU);

  const frameX = (i: number) => lerp(FRAME_X[1], FRAME_X[i], splitU);
  const fw = Wd * S;
  const fh = H0 * S;

  // contact ruler geometry (stage px → screen), from the live cell sizes
  const kx = FRAME_X[1];
  const kc = cands[1].thumbs[0];
  const hSegs: Array<{ a: number; b: number; gap: boolean }> = [];
  for (let c = 0; c < 4; c++) {
    hSegs.push({ a: GAP * c + kc.w * c, b: GAP * (c + 1) + kc.w * c, gap: true });
    hSegs.push({ a: GAP * (c + 1) + kc.w * c, b: GAP * (c + 1) + kc.w * (c + 1), gap: false });
  }
  hSegs.push({ a: GAP * 4 + kc.w * 4, b: GAP * 5 + kc.w * 4, gap: true });
  const vSegs: Array<{ a: number; b: number; gap: boolean }> = [];
  for (let r = 0; r < 3; r++) {
    vSegs.push({ a: GAP * r + kc.h * r, b: GAP * (r + 1) + kc.h * r, gap: true });
    vSegs.push({ a: GAP * (r + 1) + kc.h * r, b: GAP * (r + 1) + kc.h * (r + 1), gap: false });
  }
  vSegs.push({ a: GAP * 3 + kc.h * 3, b: GAP * 4 + kc.h * 3, gap: true });
  const RULER_Y = FRAME_Y + fh + 12;
  const RULER_X = kx + SLOT_W + 10;

  const k = cands[1].thumbs[0];
  const texW = `\\text{cellWidth}=\\tfrac14\\,\\mathrm{relu}(W-5\\cdot\\text{gap})`;
  const texWn = `\\tfrac14\\,\\mathrm{relu}(1400-5\\cdot 14)=${f1(k.w)}`;
  const texH = `\\text{cellHeight}=\\tfrac13\\,\\mathrm{relu}(680-4\\cdot 14)=${f1(k.h)}`;

  // header: the stage's three sources
  const tok = tokensU > 0.5;
  const hdr: Array<{ s: string; c: string; b?: boolean }> = [
    { s: 'viewportWidth ', c: colors.MUTED },
    { s: String(Wd), c: dragHi > 0.5 ? colors.WARM : tok ? ACC : colors.TEXT, b: tok || dragHi > 0.5 },
    { s: ' × viewportHeight ', c: colors.MUTED },
    { s: '680', c: tok ? ACC : colors.TEXT, b: tok },
    { s: '  ·  gap ', c: colors.MUTED },
    { s: '14', c: tok ? GAP_C : colors.TEXT, b: tok },
    { s: '  ·  photoCount 12', c: colors.MUTED },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= header: W × H · gap (the sources every position sums) ================= */}
        <g opacity={v(scene.headerU)}>
          <text x={640} y={HEADER_Y} textAnchor="middle" fontSize={15} fontFamily={MONO} xmlSpace="preserve">
            {hdr.map((p, i) => (
              <tspan key={i} fill={p.c} fontWeight={p.b ? 700 : 400}>
                {p.s}
              </tspan>
            ))}
          </text>
        </g>

        {/* relu legend (after the opening) */}
        {v(scene.legendU) > 0.005 && (
          <g opacity={v(scene.legendU) * v(scene.sideOp) * lerp(1, 0.6, v(scene.endDim))}>
            <ReluGlyph x={40} y={44} w={20} />
            <text x={68} y={44} fontSize={13} fontFamily={MONO} fill={RELU_C}>
              relu: negatives → 0
            </text>
          </g>
        )}

        {/* ================= the loom: three mini-stages, always computed ================= */}
        {[0, 1, 2].map((li) => {
          const fx = frameX(li);
          const emerge = li === 1 ? 1 : clamp01(splitU * 6);
          const o = v(scene.op[li]) * emerge * endDim;
          if (o <= 0.005 || frameU <= 0) return null;
          const c = cands[li];
          const su = v(scene.settle[li]);
          const per = 4 * (fw + fh);
          const heroU = staggerU(su, 0, PHOTOS, 0.09, 0.8);
          const hero = c.hero ? lerpR(pileRect(0, Wd), c.hero, heroU) : null;
          const heroLbl = v(scene.heroLbl);
          const dims = v(scene.dimsU[li]);
          return (
            <g key={li} opacity={o}>
              <rect x={fx} y={FRAME_Y} width={Math.max(fw, 1.5)} height={fh} rx={4} fill={colors.PANEL} fillOpacity={0.55} stroke={colors.MUTED} strokeOpacity={0.7} strokeWidth={1.5} strokeDasharray={per} strokeDashoffset={per * (1 - frameU)} />
              {/* the hero: the photo in focus (photo 0) */}
              {hero && heroU > 0 && (
                <g>
                  <rect x={fx + hero.l * S} y={FRAME_Y + hero.t * S} width={Math.max(0, hero.w * S)} height={Math.max(0, hero.h * S)} rx={3} fill={hue(0)} fillOpacity={0.3} stroke={ACC} strokeWidth={2.5} opacity={heroU} />
                  {hero.w * S > 120 && (
                    <g opacity={heroU}>
                      {li === 0 && heroLbl > 0.01 && (
                        <text x={fx + (hero.l + hero.w / 2) * S} y={FRAME_Y + (hero.t + hero.h / 2) * S - 4} textAnchor="middle" fontSize={14} fontFamily={UI} fontWeight={600} fill={colors.TEXT} opacity={heroLbl}>
                          hero · photo 0, in focus
                        </text>
                      )}
                      {dims > 0.01 && (
                        <text x={fx + (hero.l + hero.w / 2) * S} y={FRAME_Y + (hero.t + hero.h / 2) * S + (li === 0 ? 18 : 5)} textAnchor="middle" fontSize={15} fontFamily={MONO} fontWeight={700} fill={colors.WARM} opacity={dims}>
                          {`${f1(c.hero!.w)} × ${f1(c.hero!.h)}`}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              )}
              {/* the twelve photos: pile → this layout's slots */}
              {Array.from({ length: PHOTOS }, (_, i) => {
                const u = staggerU(su, i, PHOTOS, 0.09, 0.8);
                const r = lerpR(pileRect(i, Wd), c.thumbs[i], u);
                const pileO = staggerU(pileU, i, PHOTOS, 0.06, 0.4);
                if (pileO <= 0.005) return null;
                return (
                  <g key={i} opacity={pileO}>
                    <Photo x={fx} y={FRAME_Y} r={r} i={i} label={u > 0.95} />
                  </g>
                );
              })}
              {/* photo 7, followed across the three layouts */}
              {p7U > 0.01 && (() => {
                const r = c.thumbs[7];
                return (
                  <rect x={fx + r.l * S - 2.5} y={FRAME_Y + r.t * S - 2.5} width={Math.max(0, r.w * S) + 5} height={Math.max(0, r.h * S) + 5} rx={3} fill="none" stroke="#ffffff" strokeWidth={1.8} opacity={p7U} />
                );
              })()}
              {/* the Contact cell under the lens */}
              {li === 1 && v(scene.cellRing) * mathOp > 0.01 && (
                <rect x={fx + kc.l * S - 3} y={FRAME_Y + kc.t * S - 3} width={kc.w * S + 6} height={kc.h * S + 6} rx={4} fill="none" stroke="#ffffff" strokeWidth={2} opacity={v(scene.cellRing) * mathOp} />
              )}
              {/* drag grip on the stage's right edge */}
              {gripU > 0.01 && (
                <rect x={fx + fw + 3} y={FRAME_Y + fh / 2 - 18} width={6} height={36} rx={3} fill={colors.WARM} opacity={gripU} />
              )}
              {/* name + id */}
              <g opacity={v(scene.namesU) * (li === 1 ? 1 : v(scene.sideOp))}>
                <text x={FRAME_X[li]} y={NAME_Y} fontSize={17} fontFamily={UI} fontWeight={700} fill={colors.TEXT}>
                  {NAMES[li]}
                </text>
                <text x={FRAME_X[li] + SLOT_W} y={NAME_Y} textAnchor="end" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                  {IDS[li]}
                </text>
              </g>
              {/* the slot rule */}
              {v(scene.code[li]) > 0.01 && (
                <text x={FRAME_X[li]} y={FRAME_Y + fh + 24} fontSize={13} fontFamily={MONO} fill={ACC} opacity={v(scene.code[li])}>
                  {li === 1 ? `${CODE[li]} · no hero` : CODE[li]}
                </text>
              )}
            </g>
          );
        })}

        {/* ================= B5–B6 · one Contact cell: the gap ruler and the sum ================= */}
        {rulerU > 0.005 && (
          <g>
            {hSegs.map((sg, i) => {
              const u = staggerU(rulerU, i, hSegs.length, 0.08, 0.3);
              if (u <= 0) return null;
              const x1 = kx + sg.a * S;
              const x2 = kx + lerp(sg.a, sg.b, u) * S;
              return sg.gap ? (
                <rect key={i} x={x1} y={RULER_Y - 6} width={Math.max(0.5, x2 - x1)} height={12} fill={GAP_C} />
              ) : (
                <g key={i}>
                  <line x1={x1 + 1} y1={RULER_Y} x2={x2 - 1} y2={RULER_Y} stroke={ACC} strokeWidth={2} />
                </g>
              );
            })}
            {vSegs.map((sg, i) => {
              const u = staggerU(rulerU, i, vSegs.length, 0.1, 0.3);
              if (u <= 0) return null;
              const y1 = FRAME_Y + sg.a * S;
              const y2 = FRAME_Y + lerp(sg.a, sg.b, u) * S;
              return sg.gap ? (
                <rect key={i} x={RULER_X - 6} y={y1} width={12} height={Math.max(0.5, y2 - y1)} fill={GAP_C} />
              ) : (
                <line key={i} x1={RULER_X} y1={y1 + 1} x2={RULER_X} y2={y2 - 1} stroke={ACC} strokeWidth={2} />
              );
            })}
            <text x={kx + SLOT_W} y={RULER_Y + 22} textAnchor="end" fontSize={12} fontFamily={MONO} fill={GAP_C} opacity={clamp01(rulerU * 3 - 2)}>
              5 gaps across · 4 down
            </text>
          </g>
        )}
        {numsU > 0.01 && (
          <g opacity={numsU}>
            <text x={kx + (GAP + kc.w / 2) * S} y={RULER_Y + 22} textAnchor="middle" fontSize={13} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
              {f1(kc.w)}
            </text>
            <text x={RULER_X + 10} y={FRAME_Y + (GAP + kc.h / 2) * S + 4} fontSize={13} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
              {f1(kc.h)}
            </text>
          </g>
        )}
        <MathLabel tex={texW} x={640} y={402} fontSize={22} opacity={v(scene.texWU) * mathOp} boxWidth={760} />
        <MathLabel tex={texWn} x={640} y={442} fontSize={22} color={colors.WARM} opacity={numsU} boxWidth={760} />
        <MathLabel tex={texH} x={640} y={486} fontSize={22} color={colors.WARM} opacity={v(scene.texHU) * mathOp} boxWidth={760} />

        {/* ================= B7–B8 · the readout panels (live in the viewport width) ================= */}
        {[0, 1, 2].map((li) => {
          const po = v(scene.panel[li]);
          if (po <= 0.005) return null;
          const c = cands[li];
          const x = FRAME_X[li];
          const bu = v(scene.bars[li]);
          const rowsY = PANEL_Y + 84;
          return (
            <g key={li} opacity={po}>
              <rect x={x - 10} y={PANEL_Y} width={SLOT_W + 20} height={164} rx={8} fill={colors.PANEL} fillOpacity={0.6} stroke={colors.GRID} />
              {c.pair ? (
                <MinBars
                  x={x + 4}
                  y={PANEL_Y + 20}
                  pair={c.pair}
                  scale={li === 0 ? 0.36 : 0.15}
                  u={bu}
                  title={li === 0 ? 'rail = min(280, 0.28·W)' : 'hero height = min(0.72·W, 0.58·H)'}
                />
              ) : (
                <text x={x + 4} y={PANEL_Y + 20} fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={bu}>
                  relu(W − 5·gap)/4 × relu(H − 4·gap)/3
                </text>
              )}
              {li === 1 && (
                <text x={x + 4} y={PANEL_Y + 44} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={bu}>
                  hero  none
                </text>
              )}
              <ValueRow x={x + 4} y={rowsY + 4} row={c.rows[0]} />
              <ValueRow x={x + 4} y={rowsY + 26} row={c.rows[1]} glow={li === 2 ? v(scene.thumbGlow) : 0} />
              <ValueRow x={x + 4} y={rowsY + 52} row={c.rows[2]} opacity={p7U} />
            </g>
          );
        })}

        {/* ================= B1 · the opening chips ================= */}
        {introOp > 0.005 && (
          <g opacity={introOp}>
            <Chip x={470} y={356} w={340} h={40} stroke={colors.MUTED} opacity={v(scene.qU)}>
              <text x={640} y={382} textAnchor="middle" fontSize={18} fontFamily={UI} fill={colors.TEXT}>
                which layout fits this stage?
              </text>
            </Chip>
            <Chip x={300} y={430} w={370} h={48} stroke={RELU_C} opacity={v(scene.reluChipU)}>
              <ReluGlyph x={322} y={462} w={26} width={2.6} />
              <text x={360} y={460} fontSize={15} fontFamily={UI} fill={colors.TEXT}>
                weighted sums +
              </text>
              <MathLabel tex={'\\mathrm{relu}(x)=\\max(0,x)'} x={566} y={454} fontSize={18} boxWidth={200} />
            </Chip>
            <Chip x={700} y={430} w={250} h={48} stroke={colors.NEGATIVE} opacity={v(scene.ifChipU)}>
              <text x={825} y={460} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                {'if (…) { skip work }'}
              </text>
              <line x1={730} y1={455} x2={lerp(730, 920, v(scene.strikeU))} y2={455} stroke={colors.NEGATIVE} strokeWidth={2.5} strokeLinecap="round" />
            </Chip>
            {v(scene.strikeU) > 0.01 && (
              <text x={825} y={502} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.NEGATIVE} opacity={v(scene.strikeU)}>
                no early exit
              </text>
            )}
          </g>
        )}

        {/* ================= B9–B10 · the counter and the open question ================= */}
        {counterU > 0.005 && (
          <g opacity={counterU}>
            <text x={640} y={548} textAnchor="middle" fontSize={26} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
              {`${Math.round(417 * countN)} operations · ${Math.round(60 * countN)} layers`}
            </text>
            <text x={640} y={578} textAnchor="middle" fontSize={14} fontFamily={UI} fill={colors.MUTED}>
              all three layouts + click and focus · computed every frame
            </text>
          </g>
        )}
        {qmarkU > 0.005 && (
          <g opacity={clamp01(qmarkU)}>
            {[0, 1, 2].map((li) => (
              <line key={li} x1={640} y1={378} x2={FRAME_X[li] + SLOT_W / 2} y2={FRAME_Y + fh + 10} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="5 6" opacity={0.7} />
            ))}
            <text x={640} y={452} textAnchor="middle" fontSize={96 * lerp(0.7, 1, qmarkU)} fontFamily={UI} fontWeight={700} fill={colors.WARM} stroke={colors.BG} strokeWidth={6} paintOrder="stroke">
              ?
            </text>
            <text x={640} y={492} textAnchor="middle" fontSize={20} fontFamily={UI} fontWeight={600} fill={colors.TEXT}>
              which one?
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
