// Source Becomes Wires
//
// Trace Compiler — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/trace-compiler/README.md:3 (AST walk, not a tracer, not arbitrary JavaScript), 15 (frozen fixture, 221
//     photos), 31 (FP32 division policy fround(a * fround(1 / b))), 41 (bounded loops unroll and mask), 62
//     (affine operations and ReGLUs), "Supported Constructs", "Lowering And Rounding" (roundAffine, two products)
//   lab/trace-compiler/fixtures/README.md:3 (gallery commit f315d58, June 20, 2026)
//   lab/trace-compiler/fixtures/index.ts.txt:65 (clamp's ternary), 72 + 84-85 (boxesGapX = 24, boxMinSizeX = 220:
//     the column count's (containerSizeX - 24) / 244), 363 (the 1D layout's backward loop, runtime bound)
//   lab/trace-compiler/compile.ts:4-10 (design summary), 24 (f32 = Math.fround), 99-108 (constant or wire),
//     141 (Emitter), 210-237 (affineStep → circuit.roundAffine), 264-277 (subtract, multiplyConstant),
//     282-298 (maskedProduct → circuit.reglu), 346-352 (notBit is affine), 372-393 (select: two products and an
//     add; non-finite branch rejection at 380-388), 673-681 (divide by a constant → f32 reciprocal),
//     1049-1053 (runForStatement: static range, per-iteration mask, masked writes keep the old value)
//   lab/trace-compiler/twin.ts:495-498 (the FP32 interpreter divides the same way)
//   lab/reassessment-2026-09-03.md:92 (the older select expansion off + bit * (on - off) overflows)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim, book.json chapters[0]). Every number on screen is computed below with
// Math.fround, the compiler's own f32. The 221-tile wall is one tile per photo with schematic shading; the
// unrolled loop shows the last six passes for an example newFocused = 3 (labelled on screen).
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const CH14 = 8.43; // mono advance at 14 px
const CH13 = 7.83; // mono advance at 13 px
const CONST_FILL = '#1c2230';

// ---------------------------------------------------------------------------
// The compiler's arithmetic, exact (compile.ts:24, 676-681; twin.ts:498)
// ---------------------------------------------------------------------------

const f32 = Math.fround;
const GAP = 24; // boxesGapX (index.ts.txt:72)
const DIVISOR = 220 + GAP; // boxMinSizeX + boxesGapX folds to 244 (index.ts.txt:84-85)
const RECIP = f32(1 / DIVISOR); // 0.004098360426723957
const WIDTH = 1732;
const SUB = f32(WIDTH - GAP); // 1708
const PRODUCT = f32(SUB * RECIP); // 6.999999523162842: just under seven
if (DIVISOR !== 244 || SUB !== 1708 || PRODUCT >= 7) throw new Error('column arithmetic drifted');

// select(bit, off, on) — the two-product form (compile.ts:372-393) against the older off + bit*(on-off)
const OFF = f32(3e38); // 3.0000000054977558e+38
const ON = -OFF;
const twoProducts = (b: number): number => f32(f32(ON * b) + f32(OFF * (1 - b)));
const olderForm = (b: number) => {
  const diff = f32(ON - OFF);
  const prod = f32(b * diff);
  return { diff, prod, res: f32(OFF + prod) };
};
const num = (x: number): string => (Object.is(x, -0) ? '0' : String(x));
if (num(twoProducts(0)) !== '3.0000000054977558e+38' || !Number.isNaN(olderForm(0).res) || olderForm(1).res !== -Infinity) {
  throw new Error('select probe drifted');
}

// the unrolled loop: for (let i = newFocused - 1; i >= 0; i--), pass i runs when i <= newFocused - 1
const NEW_FOCUSED = 3;
const PASSES = [5, 4, 3, 2, 1, 0];
const MASKS = PASSES.map((i) => (i <= NEW_FOCUSED - 1 ? 1 : 0));

// ---------------------------------------------------------------------------
// Narration (fixed, verbatim) and its clock: ~150 wpm plus a short hold
// ---------------------------------------------------------------------------

const CAPS = [
  "Cheng Lou's photo gallery lays out 221 photos with plain number code: widths, columns, positions. This lab asks whether that real code can become a fixed circuit with the same answers.",
  "It works on a frozen copy of the gallery's source from June 20, 2026, so every measurement can be repeated.",
  'The compiler is not a tracer that watches the program run. It reads the source as a syntax tree and carries symbolic values, each one a constant or a wire.',
  'Anything known in advance folds away. In a width minus 24, divided by 244, the 24 and the 244 are constants, so the division becomes one multiply by one over 244.',
  "That reciprocal is rounded once to single precision, about four thousandths, and the lab's interpreter does the same. It's an explicit policy, not Java Script's own division.",
  "The width is only known at run time, so it becomes a wire. Each subtraction is tagged as a rounding point, so the builder can't merge it into the next step and erase the rounding.",
  'A conditional becomes two products and a sum: the chosen value times the bit, plus the other value times one minus the bit. Both multiply by exactly one or zero, so nothing re-rounds.',
  'The older library select form added the bit times a difference. With plus and minus three times ten to the thirty-eighth, that difference overflows, and a bit of zero returned not a number.',
  'The two-product form hands back the first value untouched. Because both branches always compute, a branch that can\'t fit in single precision is rejected up front.',
  'A loop with a finite integer bound unrolls across every possible count, and a mask bit for each pass decides which writes actually count.',
  'What comes out is the kind of circuit the first book built, weighted sums and relu, only now generated from real source instead of written by hand.',
  'And the subset is small on purpose: numbers, fixed arrays, bounded loops, ternaries. It does not compile arbitrary Java Script.',
];
const HOLD = 0.7;
const DUR = CAPS.map((c) => +(c.split(/\s+/).length * 0.4 + 0.6).toFixed(1));
const T: number[] = [];
DUR.reduce((at, d, i) => ((T[i] = at), +(at + d + HOLD).toFixed(1)), 0.4);

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// the wall: one tile per photo, 17 × 13 = 221
const WALL = { cols: 17, rows: 13, w: 34, h: 22, gap: 6, x: 303, y: 150 };
const WALL_TILES = (() => {
  const rand = mulberry32(221);
  return Array.from({ length: 221 }, (_, i) => ({
    x: WALL.x + (i % WALL.cols) * (WALL.w + WALL.gap),
    y: WALL.y + Math.floor(i / WALL.cols) * (WALL.h + WALL.gap),
    tone: 0.25 + 0.6 * rand(),
    warm: rand() < 0.18,
  }));
})();

// the source strip (screen space, a fixed ribbon under the header)
const STRIP = { x: 50, y: 84, w: 1180, h: 80, row: 126 };
const TOKS = ['(', 'width', '−', '24', ')', '/', '244'];
const TOK_KIND = ['op', 'wire', 'op', 'const', 'op', 'op', 'const'];
const tokW = (t: string) => t.length * CH14 + 16;
const TOK_X = TOKS.reduce<number[]>((xs, t, i) => [...xs, i === 0 ? 70 : xs[i - 1] + tokW(TOKS[i - 1]) + 4], []);
const STMT2 = { text: 'v > max ? max : v < min ? min : v', x: 380 };
const STMT3 = { text: 'for (let i = newFocused - 1; i >= 0; i--)', x: 730 };
const stmtW = (t: string) => t.length * CH14 + 16;
const SUBLINES = [
  'colsBoxMaxSizeXF · Math.floor((containerSizeX - boxesGapX) / (boxMinSizeX + boxesGapX)) · gaps inlined: 24, 220 + 24 = 244',
  'clamp · a runtime ternary over numbers',
  'the 1D layout · newFocused is a bounded runtime integer',
];

// tray (constants, left) and circuit panel (wires, right)
const TRAY = { x: 50, y: 196, w: 255, h: 414 };
const PANEL = { x: 330, y: 196, w: 900, h: 414 };
const TRAY_24 = { x: 112, y: 258 };
const TRAY_244 = { x: 196, y: 258 };
const CARD = { x: 62, y: 300, w: 232 };

// the syntax tree → row A
type NodePose = { x: number; y: number; w: number; h: number; rx: number };
const ROUND = (x: number, y: number): NodePose => ({ x, y, w: 40, h: 40, rx: 20 });
const TREE = { div: ROUND(780, 250), sub: ROUND(640, 340), d244: ROUND(920, 340), width: ROUND(560, 430), d24: ROUND(720, 430) };
const ROW_A_Y = 292;
const ROWA = {
  width: { x: 410, y: ROW_A_Y, w: 84, h: 34, rx: 17 },
  sub: { x: 610, y: ROW_A_Y, w: 210, h: 48, rx: 8 },
  div: { x: 860, y: ROW_A_Y, w: 236, h: 48, rx: 8 },
  d24: { x: TRAY_24.x, y: TRAY_24.y, w: 56, h: 28, rx: 6 },
  d244: { x: TRAY_244.x, y: TRAY_244.y, w: 64, h: 28, rx: 6 },
};
const OUT_A = { x: 1050, y: ROW_A_Y, w: 160 };
const lerpPose = (a: NodePose, b: NodePose, u: number): NodePose => ({
  x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u), rx: lerp(a.rx, b.rx, u),
});

// row B: the select (x 340..980) and the older form beside it (x 995..1225)
const SEL = { on: { x: 392, y: 470 }, bit: { x: 392, y: 521 }, off: { x: 392, y: 572 }, p1: { x: 590, y: 470 }, p2: { x: 590, y: 572 }, add: { x: 740, y: 521 } };
const OLD = { x: 1110, w: 228, ys: [456, 514, 572] };
// row C: the unrolled loop, in the older form's column once it has gone
const LOOP = { x0: 1042, pitch: 34, top: 448 };

// cameras
const HOME: CameraState = CAMERA_HOME;
const CAM_WALL: CameraState = { x: 640, y: 345, k: 1.08 };
const CAM_TREE: CameraState = { x: 640, y: 360, k: 1.06 };
const CAM_TRAY: CameraState = { x: 420, y: 350, k: 1.28 };
const CAM_ROWA: CameraState = { x: 735, y: 330, k: 1.22 };
const CAM_ROWB: CameraState = { x: 650, y: 465, k: 1.3 };
const CAM_SPLIT: CameraState = { x: 790, y: 470, k: 1.12 };
const CAM_LOOP: CameraState = { x: 1010, y: 470, k: 1.35 };

const FN_CHIPS = [
  'chenglou.github.io',
  'chenglou.github.io @ f315d58 · fixtures/index.ts.txt',
  'compile.ts · Emitter',
  'Emitter.divide',
  'f32 = Math.fround',
  'Emitter.affineStep → circuit.roundAffine',
  'Emitter.select',
  'Emitter.select',
  'Emitter.select',
  'compile.ts · runForStatement',
  'circuit: affine + reglu',
  'compile.ts · supported subset',
];

const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', HOME, cameraInterp);
  const fn = tl.channel('fnChip', 0);
  // B0–B1 the wall
  const wallU = tl.channel('wallU', 0);
  const wallOp = tl.channel('wallOp', 1);
  const wallLbl = tl.channel('wallLabel', 0);
  const qU = tl.channel('questionU', 0);
  const frozenU = tl.channel('frozenU', 0);
  const stampU = tl.channel('stampU', 0);
  // the strip
  const stripU = tl.channel('stripU', 0);
  const stripOp = tl.channel('stripOp', 1);
  const cur = tl.channel('cursor', { x: TOK_X[0], w: 254 });
  const curOp = tl.channel('cursorOp', 0);
  const sub = tl.channel('subline', 0);
  const tokConst = tl.channel('tokConst', 0);
  const tokWire = tl.channel('tokWire', 0);
  // B2 the tree walk
  const tracerU = tl.channel('tracerU', 0);
  const tracerOp = tl.channel('tracerOp', 1);
  const legendOp = tl.channel('legendOp', 1);
  const treeU = tl.channel('treeU', 0);
  const ring = tl.channel('ring', { x: TREE.div.x, y: TREE.div.y, r: 30 });
  const ringOp = tl.channel('ringOp', 0);
  const legendU = tl.channel('legendU', 0);
  // B3–B4 folding, the tray
  const leafGrey = tl.channel('leafGrey', 0);
  const flyU = tl.channel('flyU', 0);
  const divLbl = tl.channel('divLabel', 0);
  const recipU = tl.channel('recipU', 0);
  const cardU = tl.channel('cardU', 0);
  const valU = tl.channel('recipValueU', 0);
  const twinU = tl.channel('twinU', 0);
  const policyU = tl.channel('policyU', 0);
  const trayOp = tl.channel('trayOp', 1);
  // B5 row A
  const widthWire = tl.channel('widthWire', 0);
  const morphA = tl.channel('morphA', 0);
  const lockU = tl.channel('lockU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const ghostX = tl.channel('ghostX', 0);
  const valsU = tl.channel('workedValues', 0);
  const rowAOp = tl.channel('rowAOp', 1);
  // B6–B8 row B
  const selU = tl.channel('selU', 0);
  const bit = tl.channel('bit', 1);
  const bitFlash = tl.channel('bitFlash', 0);
  const zeroU = tl.channel('exactZero', 0);
  const numU = tl.channel('numericU', 0);
  const oldU = tl.channel('oldU', 0);
  const oldOp = tl.channel('oldOp', 1);
  const resU = tl.channel('untouchedU', 0);
  const bothU = tl.channel('bothCompute', 0);
  const rejectU = tl.channel('rejectU', 0);
  const rowBOp = tl.channel('rowBOp', 1);
  // B9 row C
  const loopU = tl.channel('loopU', 0);
  const maskU = tl.channel('maskU', 0);
  // B10–B11 payoff
  const kindU = tl.channel('kindU', 0);
  const kindLbl = tl.channel('kindLabel', 0);
  const machOp = tl.channel('machOp', 1);
  const fenceU = tl.channel('fenceU', 0);
  const insideU = tl.channel('insideU', 0);
  const outsideU = tl.channel('outsideU', 0);
  const strikeU = tl.channel('strikeU', 0);

  const cap = (i: number) => tl.caption({ at: T[i], dur: DUR[i], text: CAPS[i] });
  const curTo = (x: number, w: number, at: number) => tl.tween(cur, { x, w }, { at, dur: 0.6, ease: ease.move });
  const tokAt = (i: number) => ({ x: TOK_X[i], w: tokW(TOKS[i]) });
  FN_CHIPS.forEach((_, i) => tl.set(fn, i, T[i]));

  // — B0 · 221 photos, plain number code —
  let t = T[0];
  cap(0);
  tl.tween(wallU, 1, { at: t + 0.3, dur: 2.2, ease: ease.linear });
  tl.tween(cam, CAM_WALL, { at: t + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(wallLbl, 1, { at: t + 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(qU, 1, { at: t + DUR[0] * 0.58, dur: 0.7, ease: ease.enter });

  // — B1 · a frozen copy —
  t = T[1];
  cap(1);
  tl.tween(cam, HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(qU, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(frozenU, 1, { at: t + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(stampU, 1, { at: t + 1.3, dur: 0.5, ease: ease.pop });

  // — B2 · not a tracer: a syntax tree, constant or wire —
  t = T[2];
  cap(2);
  for (const ch of [wallOp, stampU, wallLbl]) tl.tween(ch, 0, { at: t, dur: 0.7, ease: ease.move });
  tl.tween(stripU, 1, { at: t + 0.3, dur: 0.8, ease: ease.enter });
  tl.tween(tracerU, 1, { at: t + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(tracerU, 2, { at: t + 2.2, dur: 0.5, ease: ease.draw });
  tl.tween(cam, CAM_TREE, { at: t + 2.6, dur: 1.3, ease: ease.move });
  tl.tween(treeU, 1, { at: t + 3.0, dur: 1.2, ease: ease.enter });
  tl.tween(curOp, 1, { at: t + 3.6, dur: 0.4, ease: ease.enter });
  tl.tween(ringOp, 1, { at: t + 4.2, dur: 0.4, ease: ease.enter });
  const walk: Array<[keyof typeof TREE, number]> = [['div', 5], ['sub', 2], ['width', 1], ['d24', 3], ['d244', 6]];
  walk.forEach(([k, tok], i) => {
    const at = t + 4.6 + i * 0.95;
    const p = TREE[k];
    if (i > 0) tl.tween(ring, { x: p.x, y: p.y, r: 30 }, { at, dur: 0.5, ease: ease.move });
    curTo(tokAt(tok).x, tokAt(tok).w, at);
  });
  tl.tween(legendU, 1, { at: t + DUR[2] - 2.6, dur: 0.6, ease: ease.enter });

  // — B3 · constants fold: one multiply by one over 244 —
  t = T[3];
  cap(3);
  tl.tween(tracerOp, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(ring, { x: TREE.d24.x, y: TREE.d24.y, r: 30 }, { at: t + 2.4, dur: 0.5, ease: ease.move });
  curTo(tokAt(3).x, tokAt(3).w, t + 2.4);
  tl.tween(ring, { x: TREE.d244.x, y: TREE.d244.y, r: 30 }, { at: t + 4.0, dur: 0.5, ease: ease.move });
  curTo(tokAt(6).x, tokAt(6).w, t + 4.0);
  tl.tween(tokConst, 1, { at: t + 4.5, dur: 0.5, ease: ease.enter });
  tl.tween(leafGrey, 1, { at: t + 4.5, dur: 0.5, ease: ease.enter });
  tl.tween(ringOp, 0, { at: t + 5.6, dur: 0.4, ease: ease.move });
  tl.tween(flyU, 1, { at: t + 5.8, dur: 1.3, ease: ease.move });
  tl.tween(cam, HOME, { at: t + 5.8, dur: 1.3, ease: ease.move });
  tl.tween(ring, { x: TREE.div.x, y: TREE.div.y, r: 34 }, { at: t + 7.4, dur: 0.1, ease: ease.move });
  tl.tween(ringOp, 1, { at: t + 7.6, dur: 0.4, ease: ease.enter });
  curTo(tokAt(5).x, tokAt(5).w + 4 + tokAt(6).w, t + 7.6);
  tl.tween(divLbl, 1, { at: t + 8.6, dur: 0.5, ease: ease.move });
  tl.tween(recipU, 1, { at: t + 9.4, dur: 0.6, ease: ease.enter });
  tl.tween(ringOp, 0, { at: t + DUR[3] - 0.6, dur: 0.4, ease: ease.move });

  // — B4 · the reciprocal, rounded once: a policy —
  t = T[4];
  cap(4);
  tl.tween(rowAOp, 0.12, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_TRAY, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(curOp, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cardU, 1, { at: t + 0.7, dur: 0.7, ease: ease.enter });
  tl.tween(valU, 1, { at: t + 2.0, dur: 0.6, ease: ease.pop });
  tl.tween(twinU, 1, { at: t + DUR[4] * 0.45, dur: 0.6, ease: ease.enter });
  tl.tween(policyU, 1, { at: t + DUR[4] * 0.7, dur: 0.5, ease: ease.pop });

  // — B5 · the width is a wire; the subtraction keeps its rounding point —
  t = T[5];
  cap(5);
  tl.tween(cam, CAM_ROWA, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(trayOp, 0.12, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(rowAOp, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(curOp, 1, { at: t + 0.3, dur: 0.4, ease: ease.enter });
  curTo(tokAt(1).x, tokAt(1).w, t + 0.3);
  tl.tween(tokWire, 1, { at: t + 0.9, dur: 0.5, ease: ease.enter });
  tl.tween(widthWire, 1, { at: t + 0.9, dur: 0.5, ease: ease.enter });
  tl.tween(morphA, 1, { at: t + 1.6, dur: 1.4, ease: ease.move });
  curTo(tokAt(1).x, tokAt(1).w + 4 + tokAt(2).w + 4 + tokAt(3).w, t + 3.6);
  tl.tween(lockU, 1, { at: t + DUR[5] * 0.36, dur: 0.5, ease: ease.pop });
  tl.tween(ghostU, 1, { at: t + DUR[5] * 0.6, dur: 1.0, ease: ease.draw });
  tl.tween(ghostX, 1, { at: t + DUR[5] * 0.78, dur: 0.4, ease: ease.pop });
  tl.tween(valsU, 1, { at: t + DUR[5] - 1.6, dur: 0.8, ease: ease.enter });

  // — B6 · a conditional: two products and a sum —
  t = T[6];
  cap(6);
  curTo(STMT2.x, stmtW(STMT2.text), t);
  tl.set(sub, 1, t);
  tl.tween(rowAOp, 0.12, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(legendOp, 0.12, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(ghostU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_ROWB, { at: t + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(selU, 1, { at: t + 0.9, dur: 1.6, ease: ease.linear });
  tl.tween(zeroU, 1, { at: t + DUR[6] * 0.55, dur: 0.5, ease: ease.enter });
  tl.set(bit, 0, t + DUR[6] * 0.72);
  tl.tween(bitFlash, 1, { at: t + DUR[6] * 0.72, dur: 0.3, ease: ease.enter });
  tl.tween(bitFlash, 0, { at: t + DUR[6] * 0.72 + 0.4, dur: 0.6, ease: ease.move });

  // — B7 · the older form overflows: NaN —
  t = T[7];
  cap(7);
  tl.tween(cam, CAM_SPLIT, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(zeroU, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(oldU, 1, { at: t + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(numU, 1, { at: t + DUR[7] * 0.45, dur: 0.6, ease: ease.enter });
  tl.tween(oldU, 2, { at: t + DUR[7] * 0.58, dur: 0.6, ease: ease.enter });
  tl.tween(oldU, 3, { at: t + DUR[7] * 0.76, dur: 0.6, ease: ease.enter });
  tl.tween(oldU, 4, { at: t + DUR[7] * 0.88, dur: 0.6, ease: ease.pop });

  // — B8 · the two-product form is untouched; non-finite branches reject —
  t = T[8];
  cap(8);
  tl.tween(resU, 1, { at: t + 0.4, dur: 0.6, ease: ease.pop });
  tl.set(bit, 1, t + 2.6);
  tl.tween(bitFlash, 1, { at: t + 2.6, dur: 0.3, ease: ease.enter });
  tl.tween(bitFlash, 0, { at: t + 3.0, dur: 0.6, ease: ease.move });
  tl.tween(resU, 0, { at: t + DUR[8] * 0.48, dur: 0.4, ease: ease.move });
  tl.tween(oldOp, 0.12, { at: t + DUR[8] * 0.48, dur: 0.6, ease: ease.move });
  tl.tween(bothU, 1, { at: t + DUR[8] * 0.5, dur: 0.5, ease: ease.enter });
  tl.tween(rejectU, 1, { at: t + DUR[8] * 0.7, dur: 0.5, ease: ease.pop });

  // — B9 · a bounded loop unrolls; mask bits decide —
  t = T[9];
  cap(9);
  for (const ch of [rejectU, oldOp, bothU]) tl.tween(ch, 0, { at: t, dur: 0.6, ease: ease.move });
  curTo(STMT3.x, stmtW(STMT3.text), t);
  tl.set(sub, 2, t);
  tl.tween(rowBOp, 0.12, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_LOOP, { at: t + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(loopU, 1, { at: t + 1.0, dur: 1.6, ease: ease.linear });
  tl.tween(maskU, 1, { at: t + DUR[9] * 0.55, dur: 0.8, ease: ease.enter });

  // — B10 · pull back: weighted sums and relu —
  t = T[10];
  cap(10);
  tl.tween(cam, HOME, { at: t, dur: 1.5, ease: ease.move });
  tl.tween(curOp, 0, { at: t, dur: 0.6, ease: ease.move });
  for (const ch of [rowAOp, rowBOp, legendOp]) tl.tween(ch, 1, { at: t + 1.1, dur: 0.8, ease: ease.move });
  tl.tween(trayOp, 0.5, { at: t + 1.1, dur: 0.8, ease: ease.move });
  tl.tween(kindU, 1, { at: t + 2.0, dur: 1.4, ease: ease.linear });
  tl.tween(kindLbl, 1, { at: t + 3.0, dur: 0.6, ease: ease.enter });

  // — B11 · the subset, fenced —
  t = T[11];
  cap(11);
  tl.tween(machOp, 0.1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(stripOp, 0.15, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(fenceU, 1, { at: t + 0.4, dur: 1.2, ease: ease.draw });
  tl.tween(insideU, 1, { at: t + 1.2, dur: 1.4, ease: ease.linear });
  tl.tween(outsideU, 1, { at: t + DUR[11] * 0.62, dur: 0.6, ease: ease.enter });
  tl.tween(strikeU, 1, { at: t + DUR[11] * 0.8, dur: 0.5, ease: ease.draw });
  tl.hold(T[11] + DUR[11], 2.4);

  return {
    tl, cam, fn, wallU, wallOp, wallLbl, qU, frozenU, stampU, stripU, stripOp, cur, curOp, sub, tokConst, tokWire,
    tracerU, tracerOp, legendOp, treeU, ring, ringOp, legendU, leafGrey, flyU, divLbl, recipU, cardU, valU, twinU, policyU, trayOp,
    widthWire, morphA, lockU, ghostU, ghostX, valsU, rowAOp, selU, bit, bitFlash, zeroU, numU, oldU, oldOp, resU,
    bothU, rejectU, rowBOp, loopU, maskU, kindU, kindLbl, machOp, fenceU, insideU, outsideU, strikeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (book-wide spec, redrawn locally)
// ---------------------------------------------------------------------------

function ReluGlyph({ x, y, w = 18, color = colors.SECONDARY, width = 2.5, opacity = 1 }: {
  x: number; y: number; w?: number; color?: string; width?: number; opacity?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <path d={`M ${x} ${y} L ${x + w / 2} ${y} L ${x + w} ${y - w / 2}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );
}

/** The bit: amber disc when 1, ring when 0. */
function BitDisc({ cx, cy, b, r = 12, opacity = 1 }: { cx: number; cy: number; b: number; r?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  const on = b >= 0.5;
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={on ? colors.WARM : colors.BG} stroke={colors.WARM} strokeWidth={2} />
      <text x={cx} y={cy + 4.5} textAnchor="middle" fontSize={13} fontFamily={MONO} fontWeight={700} fill={on ? '#1a1206' : colors.WARM}>
        {on ? 1 : 0}
      </text>
    </g>
  );
}

/** Op-kind badge for the payoff: Σ for a weighted sum (affine), the hockey stick for a gated relu. */
function KindBadge({ x, y, kind, opacity }: { x: number; y: number; kind: 'sum' | 'relu'; opacity: number }) {
  if (opacity <= 0.005) return null;
  const c = kind === 'sum' ? colors.ACCENT : colors.SECONDARY;
  return (
    <g opacity={opacity} transform={`translate(${x}, ${y}) scale(${lerp(0.6, 1, opacity)})`}>
      <circle r={12} fill={colors.BG} stroke={c} strokeWidth={2} />
      {kind === 'sum' ? (
        <text y={5} textAnchor="middle" fontSize={15} fontWeight={700} fill={c}>
          Σ
        </text>
      ) : (
        <ReluGlyph x={-8} y={4} w={16} width={2.2} />
      )}
    </g>
  );
}

function Pill({ x, y, w, h = 24, text, stroke, fill = colors.PANEL, color = colors.TEXT, size = 13, opacity = 1, anchor = 'middle' }: {
  x: number; y: number; w: number; h?: number; text: string; stroke: string; fill?: string; color?: string; size?: number; opacity?: number; anchor?: 'middle' | 'start';
}) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={anchor === 'middle' ? x - w / 2 : x} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={anchor === 'middle' ? x : x + 12} y={y + size * 0.36} textAnchor={anchor} fontSize={size} fontFamily={MONO} fill={color}>
        {text}
      </text>
    </g>
  );
}

/** A circuit/tree node whose shape morphs: round tree node → labelled box. */
function MorphNode({ p, stroke, fill = colors.PANEL, lines, opacity = 1, glow = 0 }: {
  p: NodePose; stroke: string; fill?: string; lines: Array<{ text: string; size: number; color: string; bold?: boolean }>; opacity?: number; glow?: number;
}) {
  if (opacity <= 0.005) return null;
  const lh = lines.length > 1 ? 17 : 0;
  return (
    <g opacity={opacity}>
      {glow > 0.01 && <rect x={p.x - p.w / 2 - 5} y={p.y - p.h / 2 - 5} width={p.w + 10} height={p.h + 10} rx={p.rx + 4} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={glow} />}
      <rect x={p.x - p.w / 2} y={p.y - p.h / 2} width={p.w} height={p.h} rx={p.rx} fill={fill} stroke={stroke} strokeWidth={2} />
      {lines.map((l, i) => (
        <text key={i} x={p.x} y={p.y + l.size * 0.36 + (i - (lines.length - 1) / 2) * lh} textAnchor="middle" fontSize={l.size} fontFamily={MONO} fontWeight={l.bold ? 700 : 400} fill={l.color}>
          {l.text}
        </text>
      ))}
    </g>
  );
}

function Wire({ x1, y1, x2, y2, color = colors.ACCENT, opacity = 1, dash }: { x1: number; y1: number; x2: number; y2: number; color?: string; opacity?: number; dash?: string }) {
  if (opacity <= 0.005) return null;
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} opacity={opacity} strokeDasharray={dash} strokeLinecap="round" />;
}

function Arrow({ x1, y1, x2, y2, color = colors.MUTED, opacity = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; opacity?: number }) {
  if (opacity <= 0.005) return null;
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2 - 6 * Math.cos(a)} y2={y2 - 6 * Math.sin(a)} stroke={color} strokeWidth={1.8} />
      <polygon points={`${x2},${y2} ${x2 - 9 * Math.cos(a - 0.45)},${y2 - 9 * Math.sin(a - 0.45)} ${x2 - 9 * Math.cos(a + 0.45)},${y2 - 9 * Math.sin(a + 0.45)}`} fill={color} />
    </g>
  );
}

function Lock({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <path d={`M ${x - 4} ${y - 2} v -4 a 4 4 0 0 1 8 0 v 4`} fill="none" stroke={color} strokeWidth={1.8} />
      <rect x={x - 6} y={y - 2} width={12} height={9} rx={2} fill={color} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const fnIdx = Math.max(0, Math.min(FN_CHIPS.length - 1, Math.round(v(scene.fn))));
  const subIdx = Math.max(0, Math.min(2, Math.round(v(scene.sub))));

  const machOp = v(scene.machOp);
  // wall
  const wallU = v(scene.wallU);
  const wallOp = v(scene.wallOp);
  const frozen = v(scene.frozenU);
  // strip
  const stripU = v(scene.stripU);
  const stripOp = v(scene.stripOp) * stripU;
  const cur = s.get(scene.cur);
  const curOp = v(scene.curOp);
  const tokConst = v(scene.tokConst);
  const tokWire = v(scene.tokWire);
  // tree / row A
  const treeU = v(scene.treeU);
  const ring = s.get(scene.ring);
  const flyU = v(scene.flyU);
  const morphA = v(scene.morphA);
  const leafGrey = v(scene.leafGrey);
  const widthWire = v(scene.widthWire);
  const rowAOp = v(scene.rowAOp) * machOp;
  const trayOp = v(scene.trayOp) * machOp;
  const divLbl = v(scene.divLbl);
  const P = {
    div: lerpPose(TREE.div, ROWA.div, morphA),
    sub: lerpPose(TREE.sub, ROWA.sub, morphA),
    width: lerpPose(TREE.width, ROWA.width, morphA),
    d24: lerpPose(TREE.d24, ROWA.d24, flyU),
    d244: lerpPose(TREE.d244, ROWA.d244, flyU),
  };
  const treeIn = (i: number) => staggerU(treeU, i, 5, 0.12, 0.5);
  const leafInTray = flyU > 0.5;
  // row B
  const selU = v(scene.selU);
  const b = v(scene.bit) >= 0.5 ? 1 : 0;
  const rowBOp = v(scene.rowBOp) * machOp;
  const numU = v(scene.numU);
  const oldU = v(scene.oldU);
  const oldOp = v(scene.oldOp) * machOp;
  const old = olderForm(b);
  const flash = v(scene.bitFlash);
  const bothU = v(scene.bothU);
  // row C
  const loopU = v(scene.loopU);
  const maskU = v(scene.maskU);
  const kindU = v(scene.kindU);
  const kind = (i: number) => staggerU(kindU, i, 7, 0.15, 0.4) * machOp;

  const fnChip = FN_CHIPS[fnIdx];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= B0–B1 · the wall of 221 photos ================= */}
        {wallOp > 0.005 && wallU > 0 && (
          <g opacity={wallOp}>
            {WALL_TILES.map((tile, i) => {
              const u = staggerU(wallU, i, 221, 0.008, 0.25);
              if (u <= 0) return null;
              const live = tile.warm ? colors.WARM : colors.ACCENT;
              return (
                <rect key={i} x={tile.x} y={tile.y} width={WALL.w} height={WALL.h} rx={3} fill={frozen > 0.5 ? '#8da2be' : live} opacity={u * lerp(tile.tone * 0.75, tile.tone * 0.35, frozen)} />
              );
            })}
            <g opacity={v(scene.wallLbl) * (1 - frozen * 0.6)}>
              <text x={640} y={136} textAnchor="middle" fontSize={18} fill={colors.TEXT}>
                221 photos
              </text>
              <text x={640} y={534} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.MUTED}>
                widths · columns · positions
              </text>
            </g>
            {v(scene.qU) > 0.005 && (
              <g opacity={v(scene.qU)}>
                <rect x={470} y={544} width={340} height={40} rx={20} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
                <text x={640} y={570} textAnchor="middle" fontSize={19} fill={colors.WARM}>
                  same answers, as a circuit?
                </text>
              </g>
            )}
            {v(scene.stampU) > 0.005 && (
              <g opacity={clamp01(v(scene.stampU))} transform={`translate(640, 330) rotate(-4) scale(${lerp(1.25, 1, clamp01(v(scene.stampU)))})`}>
                <rect x={-250} y={-48} width={500} height={96} rx={10} fill={colors.BG} fillOpacity={0.9} stroke={colors.TEXT} strokeWidth={2.5} />
                <text y={-8} textAnchor="middle" fontSize={20} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                  chenglou.github.io @ f315d58
                </text>
                <text y={26} textAnchor="middle" fontSize={16} fill={colors.MUTED}>
                  June 20, 2026 · frozen fixture
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= the two places: constant tray and wire panel ================= */}
        {v(scene.legendU) > 0.005 && (
          <g opacity={v(scene.legendU)}>
            <g opacity={trayOp}>
              <rect x={TRAY.x} y={TRAY.y} width={TRAY.w} height={TRAY.h} rx={10} fill="none" stroke={colors.GRID} strokeDasharray="4 5" />
              <Pill x={TRAY.x + 14} y={TRAY.y + 22} w={96} text="constant" stroke={colors.MUTED} fill={CONST_FILL} color={colors.MUTED} anchor="start" />
            </g>
            <g opacity={machOp * v(scene.legendOp) * (v(scene.fenceU) > 0 ? 0 : 1)}>
              <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={10} fill="none" stroke={colors.GRID} strokeDasharray="4 5" />
              <Pill x={PANEL.x + 14} y={PANEL.y + 22} w={66} text="wire" stroke={colors.ACCENT} color={colors.ACCENT} anchor="start" />
            </g>
          </g>
        )}

        {/* ================= B2 · tracer vs tree tags ================= */}
        {v(scene.tracerU) > 0.005 && (
          <g opacity={clamp01(v(scene.tracerU)) * v(scene.tracerOp)}>
            <text x={1010} y={262} fontSize={15} fill={colors.MUTED}>
              a runtime tracer
            </text>
            <line x1={1006} y1={257} x2={lerp(1006, 1132, clamp01(v(scene.tracerU) - 1))} y2={257} stroke={colors.NEGATIVE} strokeWidth={2.5} />
            <text x={1010} y={292} fontSize={15} fill={colors.TEXT} opacity={treeU}>
              walks the syntax tree
            </text>
            <text x={1010} y={314} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={treeU}>
              symbolic values
            </text>
          </g>
        )}

        {/* ================= B2–B5 · the tree that becomes row A ================= */}
        {treeU > 0.005 && (
          <g opacity={rowAOp}>
            {/* edges: width–(−) and (−)–(/) become the row's wires; the constant leaves' edges go with them */}
            <Wire x1={P.width.x} y1={P.width.y} x2={P.sub.x} y2={P.sub.y} color={widthWire > 0.5 ? colors.ACCENT : colors.MUTED} opacity={treeIn(4) * 0.9} />
            <Wire x1={P.sub.x} y1={P.sub.y} x2={P.div.x} y2={P.div.y} color={morphA > 0.5 ? colors.ACCENT : colors.MUTED} opacity={treeIn(1) * 0.9} />
            <Wire x1={TREE.d24.x} y1={TREE.d24.y} x2={TREE.sub.x} y2={TREE.sub.y} color={colors.MUTED} opacity={treeIn(3) * (1 - flyU) * 0.9} />
            <Wire x1={TREE.d244.x} y1={TREE.d244.y} x2={TREE.div.x} y2={TREE.div.y} color={colors.MUTED} opacity={treeIn(2) * (1 - flyU) * 0.9} />
            {morphA > 0.5 && (
              <Wire x1={ROWA.div.x + ROWA.div.w / 2} y1={ROW_A_Y} x2={OUT_A.x} y2={ROW_A_Y} opacity={clamp01(morphA * 2 - 1)} />
            )}
            <MorphNode
              p={P.div}
              stroke={morphA > 0.5 ? colors.ACCENT : colors.TEXT}
              opacity={treeIn(0)}
              lines={
                morphA > 0.5
                  ? [{ text: 'multiplyConstant', size: 14, color: colors.TEXT, bold: true }, { text: `× ${RECIP}`, size: 13, color: colors.WARM }]
                  : [{ text: divLbl > 0.5 ? '×' : '/', size: 18, color: colors.TEXT, bold: true }]
              }
            />
            {divLbl > 0.5 && morphA < 0.5 && (
              <text x={P.div.x + 30} y={P.div.y - 22} fontSize={15} fontFamily={MONO} fill={colors.WARM} opacity={clamp01(divLbl * 2 - 1) * (1 - morphA * 2)}>
                × (1/244)
              </text>
            )}
            <MorphNode
              p={P.sub}
              stroke={morphA > 0.5 ? colors.ACCENT : colors.TEXT}
              opacity={treeIn(1)}
              glow={v(scene.lockU) * (1 - v(scene.valsU)) * 0.6}
              lines={
                morphA > 0.5
                  ? [{ text: 'circuit.roundAffine', size: 14, color: colors.TEXT, bold: true }, { text: 'width − 24', size: 13, color: colors.MUTED }]
                  : [{ text: '−', size: 18, color: colors.TEXT, bold: true }]
              }
            />
            <MorphNode
              p={P.width}
              stroke={widthWire > 0.5 ? colors.ACCENT : colors.TEXT}
              fill={colors.PANEL}
              opacity={treeIn(4)}
              lines={[{ text: 'width', size: morphA > 0.5 ? 14 : 13, color: widthWire > 0.5 ? colors.ACCENT : colors.TEXT, bold: widthWire > 0.5 }]}
            />
            {/* the output and the worked values for width 1732 */}
            {morphA > 0.5 && (
              <g opacity={clamp01(morphA * 2 - 1)}>
                <rect x={OUT_A.x} y={ROW_A_Y - 16} width={OUT_A.w} height={32} rx={6} fill={colors.PANEL} stroke={colors.ACCENT} strokeOpacity={0.7} />
                <text x={OUT_A.x + OUT_A.w / 2} y={ROW_A_Y + 5} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={v(scene.valsU) > 0.5 ? colors.WARM : colors.MUTED}>
                  {v(scene.valsU) > 0.5 ? String(PRODUCT) : 'wire'}
                </text>
              </g>
            )}
            {v(scene.valsU) > 0.005 && (
              <g opacity={v(scene.valsU)} fontFamily={MONO} fontSize={13}>
                <text x={ROWA.width.x} y={ROW_A_Y + 42} textAnchor="middle" fill={colors.WARM}>
                  {WIDTH}
                </text>
                <text x={ROWA.sub.x} y={ROW_A_Y + 46} textAnchor="middle" fill={colors.WARM}>
                  {`${WIDTH} − ${GAP} = ${SUB}`}
                </text>
                <text x={ROWA.div.x} y={ROW_A_Y + 46} textAnchor="middle" fill={colors.WARM}>
                  {`${SUB} × recip = ${PRODUCT}`}
                </text>
                <text x={OUT_A.x + OUT_A.w / 2} y={ROW_A_Y + 42} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                  just under 7
                </text>
              </g>
            )}
            {/* the rounding point lock, and the merge it forbids */}
            {v(scene.lockU) > 0.005 && (
              <g opacity={v(scene.lockU)}>
                <Lock x={ROWA.sub.x - ROWA.sub.w / 2 + 2} y={ROW_A_Y - 36} color={colors.WARM} />
                <text x={ROWA.sub.x - ROWA.sub.w / 2 + 14} y={ROW_A_Y - 32} fontSize={13} fill={colors.WARM}>
                  rounding point kept
                </text>
              </g>
            )}
            {v(scene.ghostU) > 0.005 && (() => {
              const x0 = ROWA.sub.x + 70, x1 = ROWA.div.x - 70, yb = ROW_A_Y - 26, yt = ROW_A_Y - 62;
              const d = `M ${x0} ${yb} C ${x0 + 20} ${yt}, ${x1 - 20} ${yt}, ${x1} ${yb}`;
              const len = 190;
              const gx = v(scene.ghostX);
              return (
                <g opacity={v(scene.ghostU) > 0 ? 1 - v(scene.valsU) * 0.65 : 0}>
                  <path d={d} fill="none" stroke={colors.MUTED} strokeWidth={2} strokeDasharray={`${len * v(scene.ghostU)} ${len}`} />
                  <text x={(x0 + x1) / 2} y={yt - 4} textAnchor="middle" fontSize={13} fill={colors.MUTED} opacity={v(scene.ghostU)}>
                    merge into consumer
                  </text>
                  {gx > 0.005 && (
                    <g transform={`translate(${(x0 + x1) / 2}, ${yt + 9}) scale(${gx})`} stroke={colors.NEGATIVE} strokeWidth={3.5} strokeLinecap="round">
                      <line x1={-9} y1={-9} x2={9} y2={9} />
                      <line x1={9} y1={-9} x2={-9} y2={9} />
                    </g>
                  )}
                </g>
              );
            })()}
          </g>
        )}

        {/* ================= the constant leaves, folding into the tray ================= */}
        {treeU > 0.005 && (
          <g opacity={leafInTray ? trayOp : machOp}>
            {(['d24', 'd244'] as const).map((k, i) => {
              const grey = leafGrey;
              return (
                <MorphNode
                  key={k}
                  p={P[k]}
                  stroke={grey > 0.5 ? colors.MUTED : colors.TEXT}
                  fill={grey > 0.5 ? CONST_FILL : colors.PANEL}
                  opacity={treeIn(i === 0 ? 3 : 2)}
                  lines={[{ text: k === 'd24' ? '24' : '244', size: 13, color: grey > 0.5 ? colors.MUTED : colors.TEXT }]}
                />
              );
            })}
          </g>
        )}
        {v(scene.recipU) > 0.005 && (
          <g opacity={v(scene.recipU) * trayOp}>
            {v(scene.cardU) < 0.5 ? (
              <Pill x={CARD.x} y={CARD.y + 16} w={90} h={28} text="1/244" stroke={colors.MUTED} fill={CONST_FILL} color={colors.TEXT} anchor="start" opacity={1 - v(scene.cardU) * 2} />
            ) : (
              <g opacity={clamp01(v(scene.cardU) * 2 - 1)}>
                <rect x={CARD.x} y={CARD.y} width={CARD.w} height={196} rx={8} fill={CONST_FILL} stroke={colors.MUTED} strokeWidth={1.5} />
                <text x={CARD.x + 12} y={CARD.y + 26} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  f32 = Math.fround
                </text>
                <text x={CARD.x + 12} y={CARD.y + 54} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                  recip = f32(1/244)
                </text>
                <text x={CARD.x + 12} y={CARD.y + 80} fontSize={14} fontFamily={MONO} fontWeight={700} fill={colors.WARM} opacity={v(scene.valU)}>
                  {`= ${RECIP}`}
                </text>
                <text x={CARD.x + 12} y={CARD.y + 100} fontSize={12} fill={colors.MUTED} opacity={v(scene.valU)}>
                  rounded once, about four thousandths
                </text>
                <g opacity={v(scene.twinU)}>
                  <text x={CARD.x + 12} y={CARD.y + 130} fontSize={12} fill={colors.MUTED}>
                    the interpreter, the same way:
                  </text>
                  <text x={CARD.x + 12} y={CARD.y + 148} fontSize={13} fontFamily={MONO} fill={colors.TEXT}>
                    f32(a * f32(1/b))
                  </text>
                </g>
                <Pill x={CARD.x + 12} y={CARD.y + 176} w={206} h={26} text="policy, not JS division" stroke={colors.WARM} color={colors.WARM} size={13} anchor="start" opacity={v(scene.policyU)} />
              </g>
            )}
          </g>
        )}

        {/* ================= B6–B8 · row B: the select ================= */}
        {selU > 0.005 && (
          <g opacity={rowBOp}>
            <g opacity={staggerU(selU, 0, 6, 0.2, 0.4)}>
              <text x={350} y={402} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                select(bit, off, on) = on*bit + off*(1-bit)
              </text>
            </g>
            {numU > 0.005 && (
              <g opacity={numU} fontSize={13} fontFamily={MONO}>
                <text x={350} y={430} fill={colors.MUTED}>
                  {`off = ${num(OFF)}`}
                </text>
                <text x={640} y={430} fill={colors.MUTED}>
                  {`on = ${num(ON)}`}
                </text>
              </g>
            )}
            {/* inputs */}
            <g opacity={staggerU(selU, 1, 6, 0.2, 0.4)}>
              <Pill x={SEL.on.x} y={SEL.on.y} w={58} text="on" stroke={colors.ACCENT} color={colors.ACCENT} />
              <Pill x={SEL.off.x} y={SEL.off.y} w={58} text="off" stroke={colors.ACCENT} color={colors.ACCENT} />
              {flash > 0.01 && <circle cx={SEL.bit.x} cy={SEL.bit.y} r={12 + 10 * flash} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={1 - flash * 0.5} />}
              <BitDisc cx={SEL.bit.x} cy={SEL.bit.y} b={b} />
              <text x={SEL.bit.x - 22} y={SEL.bit.y + 4} textAnchor="end" fontSize={13} fill={colors.WARM}>
                bit
              </text>
            </g>
            {/* products: both always compute */}
            <g opacity={staggerU(selU, 2, 6, 0.2, 0.4)}>
              <Wire x1={SEL.on.x + 29} y1={SEL.on.y} x2={SEL.p1.x - 75} y2={SEL.p1.y} />
              <Wire x1={SEL.off.x + 29} y1={SEL.off.y} x2={SEL.p2.x - 75} y2={SEL.p2.y} />
              <Wire x1={SEL.bit.x + 13} y1={SEL.bit.y - 4} x2={SEL.p1.x - 75} y2={SEL.p1.y + 12} color={colors.WARM} />
              <Wire x1={SEL.bit.x + 13} y1={SEL.bit.y + 4} x2={SEL.p2.x - 75} y2={SEL.p2.y - 12} color={colors.WARM} />
              <text x={468} y={SEL.p2.y - 24} fontSize={12} fontFamily={MONO} fill={colors.WARM}>
                1 − bit
              </text>
              {[{ p: SEL.p1, label: 'on · bit', m: b }, { p: SEL.p2, label: 'off · (1 − bit)', m: 1 - b }].map(({ p, label, m }, i) => (
                <g key={i}>
                  <MorphNode
                    p={{ x: p.x, y: p.y, w: 150, h: 46, rx: 8 }}
                    stroke={colors.SECONDARY}
                    glow={bothU}
                    lines={[
                      { text: label, size: 14, color: colors.TEXT, bold: true },
                      m === 0 && v(scene.zeroU) > 0.5
                        ? { text: '× 0 = exact 0', size: 13, color: colors.POSITIVE, bold: true }
                        : { text: `× ${m}`, size: 13, color: m === 0 ? colors.MUTED : colors.WARM },
                    ]}
                  />
                </g>
              ))}
            </g>
            {/* the sum */}
            <g opacity={staggerU(selU, 4, 6, 0.2, 0.4)}>
              <Wire x1={SEL.p1.x + 75} y1={SEL.p1.y} x2={SEL.add.x - 16} y2={SEL.add.y - 12} />
              <Wire x1={SEL.p2.x + 75} y1={SEL.p2.y} x2={SEL.add.x - 16} y2={SEL.add.y + 12} />
              <circle cx={SEL.add.x} cy={SEL.add.y} r={20} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
              <text x={SEL.add.x} y={SEL.add.y + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill={colors.TEXT}>
                +
              </text>
              <Arrow x1={SEL.add.x + 21} y1={SEL.add.y} x2={SEL.add.x + 46} y2={SEL.add.y} color={colors.ACCENT} />
            </g>
            <g opacity={staggerU(selU, 5, 6, 0.2, 0.4)}>
              {numU < 0.5 ? (
                <text x={SEL.add.x + 54} y={SEL.add.y + 5} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                  {b ? '= on' : '= off'}
                </text>
              ) : (
                <g>
                  {v(scene.resU) > 0.01 && (
                    <rect x={SEL.add.x + 48} y={SEL.add.y - 16} width={188} height={32} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={v(scene.resU)} />
                  )}
                  <text x={SEL.add.x + 54} y={SEL.add.y + 5} fontSize={13} fontFamily={MONO} fill={colors.POSITIVE}>
                    {num(twoProducts(b))}
                  </text>
                  <text x={SEL.add.x + 54} y={SEL.add.y + 34} fontSize={12} fill={colors.POSITIVE} opacity={v(scene.resU)}>
                    {b ? 'on, untouched' : 'off, untouched'}
                  </text>
                </g>
              )}
            </g>
          </g>
        )}

        {/* ================= B7 · the older form, beside it ================= */}
        {oldU > 0.005 && oldOp > 0.005 && (
          <g opacity={oldOp}>
            <g opacity={clamp01(oldU)}>
              <text x={OLD.x - OLD.w / 2} y={384} fontSize={12} fill={colors.MUTED}>
                older library select
              </text>
              <text x={OLD.x - OLD.w / 2} y={406} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                off + bit*(on-off)
              </text>
            </g>
            {[
              { top: 'on − off', val: num(old.diff) },
              { top: 'bit × (on − off)', val: `${b} × ${num(old.diff)} = ${num(old.prod)}` },
              { top: 'off + …', val: num(old.res) },
            ].map((row, i) => {
              const u = clamp01(oldU - 1 - i);
              if (u <= 0.005) return null;
              const bad = !Number.isFinite(i === 0 ? old.diff : i === 1 ? old.prod : old.res);
              return (
                <g key={i} opacity={u}>
                  {i > 0 && <Arrow x1={OLD.x} y1={OLD.ys[i - 1] + 21} x2={OLD.x} y2={OLD.ys[i] - 21} />}
                  <MorphNode
                    p={{ x: OLD.x, y: OLD.ys[i], w: OLD.w, h: 42, rx: 8 }}
                    stroke={bad ? colors.NEGATIVE : colors.MUTED}
                    lines={[{ text: row.top, size: 13, color: colors.TEXT }, { text: row.val, size: 13, color: bad ? colors.NEGATIVE : colors.TEXT, bold: true }]}
                  />
                </g>
              );
            })}
          </g>
        )}
        {v(scene.rejectU) > 0.005 && (
          <g opacity={v(scene.rejectU) * machOp} transform={`translate(${OLD.x}, 512) rotate(-3) scale(${lerp(1.2, 1, v(scene.rejectU))})`}>
            <rect x={-118} y={-58} width={236} height={116} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={2.5} />
            <text y={-28} textAnchor="middle" fontSize={15} fontWeight={700} fill={colors.NEGATIVE}>
              rejected at compile time
            </text>
            <text y={0} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
              non-finite branch
            </text>
            <text y={26} textAnchor="middle" fontSize={12} fill={colors.MUTED}>
              a branch whose range
            </text>
            <text y={43} textAnchor="middle" fontSize={12} fill={colors.MUTED}>
              doesn't fit in f32
            </text>
          </g>
        )}

        {/* ================= B9 · row C: the unrolled loop ================= */}
        {loopU > 0.005 && (
          <g opacity={machOp}>
            <text x={1000} y={392} fontSize={14} fill={colors.TEXT} opacity={staggerU(loopU, 0, 8, 0.15, 0.4)}>
              static range · mask bit
            </text>
            <text x={1000} y={414} fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={staggerU(loopU, 0, 8, 0.15, 0.4)}>
              example: newFocused = 3
            </text>
            <text x={LOOP.x0 - 34} y={LOOP.top + 50} fontSize={16} fill={colors.MUTED} opacity={staggerU(loopU, 1, 8, 0.15, 0.4)}>
              …
            </text>
            {PASSES.map((i, k) => {
              const u = staggerU(loopU, k + 2, 8, 0.15, 0.4);
              if (u <= 0) return null;
              const x = LOOP.x0 + k * LOOP.pitch;
              const m = MASKS[k];
              const dim = lerp(1, m ? 1 : 0.28, maskU);
              return (
                <g key={i} opacity={u}>
                  <text x={x} y={LOOP.top} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                    {`i=${i}`}
                  </text>
                  <g opacity={dim}>
                    <rect x={x - 13} y={LOOP.top + 10} width={26} height={78} rx={5} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
                    {[0, 1, 2].map((r) => (
                      <rect key={r} x={x - 8} y={LOOP.top + 20 + r * 22} width={16} height={14} rx={2} fill={colors.ACCENT} opacity={0.55} />
                    ))}
                  </g>
                  <BitDisc cx={x} cy={LOOP.top + 110} b={m} r={11} opacity={maskU} />
                </g>
              );
            })}
            <g opacity={maskU}>
              <text x={1000} y={LOOP.top + 146} fontSize={12} fill={colors.MUTED}>
                mask 0: the write keeps the old value
              </text>
            </g>
          </g>
        )}

        {/* ================= B10 · the payoff: weighted sums and relu ================= */}
        {kindU > 0.005 && (
          <g>
            <KindBadge x={ROWA.sub.x + ROWA.sub.w / 2} y={ROW_A_Y - ROWA.sub.h / 2} kind="sum" opacity={kind(0)} />
            <KindBadge x={ROWA.div.x + ROWA.div.w / 2} y={ROW_A_Y - ROWA.div.h / 2} kind="sum" opacity={kind(1)} />
            <KindBadge x={SEL.p1.x + 75} y={SEL.p1.y - 23} kind="relu" opacity={kind(2)} />
            <KindBadge x={SEL.p2.x + 75} y={SEL.p2.y - 23} kind="relu" opacity={kind(3)} />
            <KindBadge x={SEL.add.x + 16} y={SEL.add.y - 18} kind="sum" opacity={kind(4)} />
            <KindBadge x={1188} y={387} kind="relu" opacity={kind(5)} />
            <g opacity={v(scene.kindLbl) * machOp}>
              <rect x={760} y={203} width={462} height={36} rx={18} fill={colors.PANEL} stroke={colors.GRID} />
              <KindBadge x={784} y={221} kind="sum" opacity={1} />
              <text x={802} y={226} fontSize={14} fill={colors.TEXT}>
                weighted sums
              </text>
              <KindBadge x={922} y={221} kind="relu" opacity={1} />
              <text x={940} y={226} fontSize={14} fill={colors.TEXT}>
                relu
              </text>
              <text x={985} y={226} fontSize={13} fill={colors.MUTED}>
                · generated, not written by hand
              </text>
            </g>
          </g>
        )}

        {/* ================= B11 · the fence ================= */}
        {v(scene.fenceU) > 0.005 && (() => {
          const fu = v(scene.fenceU);
          const F = { x: 300, y: 236, w: 560, h: 300 };
          const per = 2 * (F.w + F.h);
          const inside = ['numbers', 'fixed arrays', 'bounded loops', 'ternaries'];
          return (
            <g>
              <rect x={260} y={206} width={980} height={360} rx={16} fill={colors.BG} opacity={0.92 * clamp01(fu * 2)} />
              <rect x={F.x} y={F.y} width={F.w} height={F.h} rx={18} fill={colors.PANEL} fillOpacity={0.6} stroke={colors.ACCENT} strokeWidth={2.5} strokeDasharray={`${per * fu} ${per}`} />
              <text x={F.x + 24} y={F.y + 36} fontSize={16} fill={colors.ACCENT} opacity={fu}>
                the subset, small on purpose
              </text>
              {inside.map((label, i) => {
                const u = staggerU(v(scene.insideU), i, 4, 0.3, 0.5);
                return (
                  <Pill key={label} x={F.x + 150 + (i % 2) * 260} y={F.y + 120 + Math.floor(i / 2) * 84} w={210} h={44} text={label} stroke={colors.ACCENT} size={17} opacity={u} />
                );
              })}
              {v(scene.outsideU) > 0.005 && (
                <g opacity={v(scene.outsideU)}>
                  <Pill x={1050} y={386} w={260} h={44} text="arbitrary JavaScript" stroke={colors.NEGATIVE} color={colors.TEXT} size={17} />
                  <line x1={928} y1={386} x2={lerp(928, 1172, v(scene.strikeU))} y2={386} stroke={colors.NEGATIVE} strokeWidth={3} />
                  <text x={1050} y={440} textAnchor="middle" fontSize={14} fill={colors.NEGATIVE} opacity={v(scene.strikeU)}>
                    not compiled
                  </text>
                </g>
              )}
            </g>
          );
        })()}
      </Camera>

      {/* ================= screen-space: the source strip ================= */}
      {stripOp > 0.005 && (
        <g opacity={stripOp} transform={`translate(0, ${lerp(-24, 0, stripU)})`}>
          <rect x={STRIP.x} y={STRIP.y} width={STRIP.w} height={STRIP.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={STRIP.x + 1170} y={STRIP.y + 17} textAnchor="end" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
            fixtures/index.ts.txt
          </text>
          {curOp > 0.005 && (
            <rect x={cur.x - 4} y={STRIP.row - 18} width={cur.w + 8} height={36} rx={8} fill={colors.WARM} fillOpacity={0.12} stroke={colors.WARM} strokeWidth={2} opacity={curOp} />
          )}
          {TOKS.map((tk, i) => {
            const k = TOK_KIND[i];
            const asConst = k === 'const' ? tokConst : 0;
            const asWire = k === 'wire' ? tokWire : 0;
            return (
              <g key={i}>
                <rect x={TOK_X[i]} y={STRIP.row - 13} width={tokW(tk)} height={26} rx={5} fill={asConst > 0.5 ? CONST_FILL : colors.BG} stroke={asWire > 0.5 ? colors.ACCENT : colors.GRID} strokeWidth={asWire > 0.5 ? 2 : 1} />
                <text x={TOK_X[i] + tokW(tk) / 2} y={STRIP.row + 5} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={asWire > 0.5 ? colors.ACCENT : asConst > 0.5 ? colors.MUTED : colors.TEXT}>
                  {tk}
                </text>
              </g>
            );
          })}
          {[STMT2, STMT3].map((st, i) => (
            <g key={i}>
              <rect x={st.x} y={STRIP.row - 13} width={stmtW(st.text)} height={26} rx={5} fill={colors.BG} stroke={colors.GRID} />
              <text x={st.x + 8} y={STRIP.row + 5} fontSize={14} fontFamily={MONO} fill={colors.TEXT} xmlSpace="preserve">
                {st.text}
              </text>
            </g>
          ))}
          <text x={STRIP.x + 20} y={STRIP.y + 70} fontSize={12} fontFamily={MONO} fill={colors.MUTED} opacity={curOp > 0.005 ? 1 : 0.5}>
            {SUBLINES[subIdx]}
          </text>
        </g>
      )}

      {/* ================= screen-space header ================= */}
      <rect x={40} y={18} width={214} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · Source Becomes Wires
      </text>
      <rect x={262} y={19} width={fnChip.length * CH13 + 20} height={22} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={272} y={35} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
        {fnChip}
      </text>
    </>
  );
}

export const vizScene = () => scene;
