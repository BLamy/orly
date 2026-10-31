// ch01-s03 · { introducing } → the Replay mark + Replay QA (L0102)
// The reference's bracketed card on studio paper: braces part, the word blurs in, the corner dots slide in; on 'Replay'
// the braces close in and the type dissolves into the lock-up, landed on 'QA'. Whip out to ch02.
// (Director's note 2026-10-14: no product stills inside the word: type only.)
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, blurText, easeInOut, easeOut, measure, paper, squareDots } from '../../../film/promo';
import { replayLockup } from '../sets/brand';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const SIZE = 72;
const WEIGHT = 300;
const CY = 330; // optical centre line of the card
const BASE = CY + SIZE * 0.35; // type baseline
const GAP = 0; // 'introducing' set solid (no stills in the word)
const LOCK = { markH: 64, size: 52 };

export default defineShot({
  id: 'ch01-s03',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const openAt = 0.22; // braces part as the blur-in clears, finishing on 'Introducing' (0.5)
    const closeAt = T.beat('close'); // 'Replay' − 0.1: the gap closes
    const dissolveAt = closeAt + 0.12; // type → lock-up, 0.32 s (legible mid-dissolve, on 'Replay')
    const markAt = T.beat('mark'); // 'QA': landed
    return { tl, openAt, closeAt, dissolveAt, markAt };
  },
  paint(f, _s, scene) {
    const c = f.c;
    const t = f.t;
    paper(c);
    const L = layout(c, t, scene);

    // the card: '{ introducing }'
    const typeA = 1 - easeInOut(L.d);
    if (typeA > 0) {
      c.save();
      c.globalAlpha *= typeA;
      if (L.d > 0) c.filter = `blur(${(L.d * SIZE * 0.16).toFixed(2)}px)`;
      blurText(c, '{', L.braceL, BASE, { size: SIZE, weight: WEIGHT, u: 1, color: PROMO.ink, align: 'right', rise: 0 });
      blurText(c, '}', L.braceR, BASE, { size: SIZE, weight: WEIGHT, u: 1, color: PROMO.ink, align: 'left', rise: 0 });
      blurText(c, 'intro', L.introX, BASE, { size: SIZE, weight: WEIGHT, u: (t - scene.openAt - 0.02) / 0.26, color: PROMO.ink });
      blurText(c, 'ducing', L.ducingX, BASE, { size: SIZE, weight: WEIGHT, u: (t - scene.openAt - 0.06) / 0.26, color: PROMO.ink });
      c.restore();
    }

    // the lock-up: legible from mid-dissolve (on 'Replay'), landed on 'QA'
    if (L.d > 0) replayLockup(c, { x: 640, y: CY, u: L.d, markH: LOCK.markH, size: LOCK.size });

    // four registration dots: wide → brace corners → around the lock-up
    squareDots(
      c,
      [
        { x: CX(L, -1), y: CY - L.dy },
        { x: CX(L, 1), y: CY - L.dy },
        { x: CX(L, -1), y: CY + L.dy },
        { x: CX(L, 1), y: CY + L.dy },
      ],
      { size: 6, color: PROMO.ink },
    );
  },
});

type Scene = { openAt: number; closeAt: number; dissolveAt: number; markAt: number };
type Geom = { braceL: number; braceR: number; introX: number; ducingX: number; gapX: number; gap: number; dx: number; dy: number; d: number; lock: { x0: number; x1: number } };

// measured once per frame; the DOM layer has no canvas, so it reuses the widths from the last paint
let W = { brace: 15, sp: 11, intro: 92, ducing: 128, lockW: 250 };

function geom(t: number, s: Scene): Geom {
  const open = easeOut(clamp((t - s.openAt) / 0.3));
  const close = easeInOut(clamp((t - s.closeAt) / 0.3));
  const d = clamp((t - s.dissolveAt) / 0.32);
  const gap = GAP * (1 - close);
  const inner = W.intro + gap + W.ducing;
  const introX = 640 - inner / 2;
  const ducingX = introX + W.intro + gap;
  // braces: together as a bare '{ }' before they part, then hugging the words (and closing in with the gap)
  const halfOpen = inner / 2 + W.sp;
  const half = lerp(SIZE * 0.32, halfOpen, open);
  const braceL = 640 - half;
  const braceR = 640 + half;
  // dots: the wide box (≈ 620 × 170) → the brace corners → the lock-up's corners
  const slide = easeOut(clamp((t - s.openAt) / 0.36));
  const cornerDx = half + W.brace + SIZE * 0.42;
  const lockDx = W.lockW / 2 + 34;
  const dx = lerp(lerp(310, cornerDx, slide), lockDx, easeInOut(d));
  const dy = lerp(lerp(85, SIZE * 0.78, slide), LOCK.markH / 2 + 18, easeInOut(d));
  return { braceL, braceR, introX, ducingX, gapX: introX + W.intro + gap / 2, gap, dx, dy, d, lock: { x0: 640 - W.lockW / 2, x1: 640 + W.lockW / 2 } };
}

function layout(c: CanvasRenderingContext2D, t: number, s: Scene): Geom {
  const lockW = replayLockup(c, { x: 640, y: CY, u: 0, markH: LOCK.markH, size: LOCK.size }).w;
  W = {
    brace: measure(c, '{', SIZE, WEIGHT),
    sp: measure(c, ' ', SIZE, WEIGHT),
    intro: measure(c, 'intro', SIZE, WEIGHT),
    ducing: measure(c, 'ducing', SIZE, WEIGHT),
    lockW,
  };
  return geom(t, s);
}

const CX = (L: Geom, side: -1 | 1) => 640 + side * L.dx;

