// ch01-s03 · { intro▢▢▢ducing } → the Replay mark + Replay QA (L0102)
// The reference's '{ intro▢ducing }' card on studio paper: braces part, the word blurs in around an empty gap, the
// corner dots slide in; on 'Introducing' three postage-stamp stills of the product flicker in the gap; on 'Replay' the
// gap closes, the braces close in and the type dissolves into the lock-up, landed on 'QA'. Whip out to ch02.
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, blurText, easeInOut, easeOut, measure, paper, squareDots } from '../../../film/promo';
import { replayLockup } from '../sets/brand';
import { SLUG } from '../sets/takes';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const SIZE = 46;
const WEIGHT = 300;
const CY = 330; // optical centre line of the card
const BASE = CY + SIZE * 0.35; // type baseline
const GAP = 92; // the gap in 'intro▢ducing': one stamp plus a letter space of air each side
const STAMP = { w: 64, h: 44 };
const LOCK = { markH: 64, size: 52 };

/** the three stamps: frozen, cursor off, ≈ 1.45:1 crops (script ch01-s03) */
const STAMPS = [
  { take: 'runs', at: 3668, crop: { x: 980, y: 200, w: 260, h: 180 }, filter: undefined },
  // measured in the film's RrwebScreen at 11458 (the chip sits at recording y 77–102 there, ≈ 95 px higher than on the
  // rr-sheet frame, whose header row the film's cast does not lay out). Tight on the chip (centre y ≈ 89, ≈ a quarter of
  // the stamp's height) so the stamp reads as a green swatch; Edit, the Production badge and the URLs stay outside
  { take: 'schedule', at: 11458, crop: { x: 1060, y: 40, w: 145, h: 100 }, filter: 'contrast(1.2) saturate(2.6)' },
  { take: 'bug-react', at: 3100, crop: { x: 530, y: 76, w: 290, h: 200 }, filter: undefined },
] as const;

export default defineShot({
  id: 'ch01-s03',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const openAt = 0.22; // braces part as the blur-in clears, finishing on 'Introducing' (0.5)
    const stampsAt = T.beat('stamps'); // 'Introducing' − 0.1
    const closeAt = T.beat('close'); // 'Replay' − 0.1: the gap closes
    const dissolveAt = closeAt + 0.12; // type → lock-up, 0.32 s (legible mid-dissolve, on 'Replay')
    const markAt = T.beat('mark'); // 'QA': landed
    const windows = STAMPS.map((_, i) => ({ from: stampsAt + i * 0.3, to: i < 2 ? stampsAt + (i + 1) * 0.3 : closeAt + 0.3 }));
    return { tl, openAt, closeAt, dissolveAt, markAt, windows };
  },
  paint(f, _s, scene) {
    const c = f.c;
    const t = f.t;
    paper(c);
    const L = layout(c, t, scene);

    // the card: '{ intro   ducing }'
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

    // the stamp's white border + soft shadow (the frozen still itself is DOM, above)
    const st = stampAt(t, scene, L);
    if (st) {
      c.save();
      c.globalAlpha *= st.a;
      c.shadowColor = 'rgba(40,20,50,.22)';
      c.shadowBlur = 8;
      c.shadowOffsetY = 2;
      c.fillStyle = '#ffffff';
      c.fillRect(st.x - 2, st.y - 2, st.w + 4, st.h + 4);
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
  dom(s, scene) {
    // mount only the stamp whose window this is (never all three at once)
    const t = s.t;
    const i = scene.windows.findIndex((w) => t >= w.from && t < w.to);
    if (i < 0) return null;
    const L = geom(t, scene);
    const st = stampGeom(t, scene, L, i);
    if (!st) return null;
    const sp = STAMPS[i];
    return (
      <RrwebScreen
        key={sp.take}
        slug={SLUG}
        take={sp.take}
        at={sp.at}
        crop={sp.crop}
        box={{ x: st.x, y: st.y, w: st.w }}
        chrome="none"
        cursor={false}
        shadow={false}
        radius={0}
        opacity={st.a}
        style={sp.filter ? { filter: sp.filter } : undefined}
      />
    );
  },
});

type Scene = { openAt: number; closeAt: number; dissolveAt: number; markAt: number; windows: { from: number; to: number }[] };
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

/** stamp i's box (stage px) and opacity at t: a quick flicker in, sitting on the baseline like a glyph; the last one is
 *  pinched out by the closing letters (its width follows the gap, no separate fade) */
function stampGeom(t: number, s: Scene, L: Geom, i: number) {
  const w = s.windows[i];
  if (t < w.from || t >= w.to) return null;
  const k = t - w.from;
  // flicker: on for two frames, a dip, then on (a stamp being struck), all within 0.08 s
  const flick = k < 0.03 ? 0.85 : k < 0.055 ? 0.45 : 1;
  const fit = clamp((L.gap - 14) / STAMP.w);
  const sw = STAMP.w * Math.min(1, fit);
  if (sw < 4) return null;
  const sh = (sw * STAMP.h) / STAMP.w;
  const rise = (1 - easeOut(clamp(k / 0.12))) * 4;
  // the last stamp also goes with the type as it dissolves into the lock-up
  const a = flick * (i === 2 ? 1 - easeInOut(L.d) : 1);
  return { x: L.gapX - sw / 2, y: BASE + 3.5 - sh + rise, w: sw, h: sh, a };
}

function stampAt(t: number, s: Scene, L: Geom) {
  const i = s.windows.findIndex((w) => t >= w.from && t < w.to);
  return i < 0 ? null : stampGeom(t, s, L, i);
}
