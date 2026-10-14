// ch06-s02 — the end card: "Replay QA. End-to-end testing, fully managed. Catch bugs that only exist in time."
// Blur dissolve from the collage into the ember haze (grey paper over a coral / orange / pink fire), white hairlines
// drifting through the fire. On 'Replay' the Replay mark + 'Replay QA' rise into place at 58 % height and the
// '▶ recording' chip that drifted out of the collage (sets/ch06-s01-chip) settles to the right of the lock-up. On
// 'End-to-end' the tagline grows in above it at 42 % height, '{ End-to-end testing }' with corner dots, the braces
// parting as the words arrive; on 'fully' the braces part wider and '· fully managed' arrives inside them, the dots
// sliding out. On 'Catch' 'qa.replay.io' types in under the lock-up with the caret, which blinks twice and stops.
// Nothing else; everything holds still for the last 0.8 s.
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, blurText, easeInOut, easeOut, font, haze, hexA, measure, squareDots } from '../../../film/promo';
import { driftLines, replayLockup } from '../sets/brand';
import { DriftChip, END, endLayout } from '../sets/ch06-s01-chip';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---- the tagline: Promo Sans light, centred at 42 % height
const TAG = { size: 52, weight: 300, cy: 302 };
const TAG_BASE = TAG.cy + TAG.size * 0.35;
const P1 = 'End-to-end testing';
const P2 = '· fully managed';
// ---- the URL under the lock-up: Promo Sans regular 34 px, ink at 80 %, typed at the recorded rate
const URL = { text: 'qa.replay.io', size: 34, base: 500, cps: 14 };

type Sc = {
  tl: Timeline;
  mark: number;
  w: { end: number; testing: number; fully: number; managed: number; catch: number };
  typeAt: number;
  typeDone: number;
  dur: number;
};

/** caret opacity: solid while typing, then off / on twice, then on for good (stopped) */
function caretOn(t: number, sc: Sc) {
  if (t < sc.typeAt - 0.25) return 0;
  const d = t - sc.typeDone;
  if (d < 0.3) return 1;
  if (d < 0.55) return 0;
  if (d < 0.8) return 1;
  if (d < 1.05) return 0;
  return 1;
}

export default defineShot({
  id: 'ch06-s02',
  mood: 'emberRed',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const L = 'L0602';
    const typeAt = T.word(L, 'Catch') - 0.04;
    const sc: Sc = {
      tl,
      mark: T.word(L, 0),
      w: {
        end: T.word(L, 2),
        testing: T.word(L, 3),
        fully: T.word(L, 4),
        managed: T.word(L, 5),
        catch: T.word(L, 6),
      },
      typeAt,
      typeDone: typeAt + URL.text.length / URL.cps,
      dur: T.duration,
    };
    return sc;
  },
  paint(f, _s, sc) {
    const c = f.c;
    const t = f.t;
    // ---- ground: paper, the ember fire rising from the bottom edge (it climbs a little through the dissolve)
    c.fillStyle = PROMO.paper;
    c.fillRect(0, 0, 1280, 720);
    const rise = easeOut(clamp((t + 0.5) / 1.6));
    haze(c, { t: t + 40, preset: 'ember', u: lerp(0.55, 1, rise), y0: lerp(0.3, 0.12, rise), drift: 0.6 });
    // a longer paper feather than the preset's, so the whole lock-up sits on paper and the fire stays in the bottom
    // third (the reference's end card); the URL line sits on the first blush of it
    const fe = c.createLinearGradient(0, 0, 0, 720);
    fe.addColorStop(0, PROMO.paper);
    fe.addColorStop(0.6, PROMO.paper);
    fe.addColorStop(0.7, hexA(PROMO.paper, 0.72));
    fe.addColorStop(0.86, hexA(PROMO.paper, 0));
    c.fillStyle = fe;
    c.fillRect(0, 0, 1280, 720);
    driftLines(c, t + 12, { n: 4, alpha: 0.55, speed: 0.8, seed: 7, y0: 540, y1: 712 });

    // ---- the lock-up (left part of the centred lock-up + chip group)
    const lay = endLayout();
    replayLockup(c, {
      x: lay.lockX0,
      y: END.lockY,
      align: 'left',
      u: clamp((t - sc.mark + 0.06) / 0.5),
      markH: END.markH,
      size: END.size,
      weight: END.weight,
      rise: 8,
    });

    // ---- the tagline: '{ End-to-end testing }' growing to '{ End-to-end testing · fully managed }'
    const s = TAG.size;
    const sp = measure(c, ' ', s, TAG.weight);
    const w1 = measure(c, P1, s, TAG.weight);
    const w2 = measure(c, P2, s, TAG.weight);
    const wFull = w1 + sp + w2;
    const g = easeInOut(clamp((t - sc.w.fully + 0.24) / 0.42)); // braces part wider on 'fully' (open before it lands)
    const curW = lerp(w1, wFull, g);
    const xLeft = 640 - curW / 2;
    const open = easeInOut(clamp((t - sc.w.end + 0.2) / 0.4)); // the braces part just ahead of the words
    if (open > 0) {
      const half = (curW / 2 + s * 0.42) * open + s * 0.18;
      const bu = clamp((t - sc.w.end + 0.2) / 0.2);
      blurText(c, '{', 640 - half, TAG_BASE, { size: s, weight: 300, u: bu, align: 'right', rise: 0 });
      blurText(c, '}', 640 + half, TAG_BASE, { size: s, weight: 300, u: bu, align: 'left', rise: 0 });
      const dx = half + s * 0.5, dy = s * 0.75, cy = TAG_BASE - s * 0.35;
      squareDots(
        c,
        [
          { x: 640 - dx, y: cy - dy },
          { x: 640 + dx, y: cy - dy },
          { x: 640 - dx, y: cy + dy },
          { x: 640 + dx, y: cy + dy },
        ],
        { size: Math.max(4, s * 0.13), u: clamp((t - sc.w.end - 0.05) / 0.3) },
      );
      // words, each on its spoken word (they ride left with the line as it grows)
      const words: { text: string; at: number; inner?: boolean }[] = [
        { text: 'End-to-end', at: sc.w.end },
        { text: 'testing', at: sc.w.testing },
        { text: '·', at: sc.w.fully - 0.06, inner: true },
        { text: 'fully', at: sc.w.fully, inner: true },
        { text: 'managed', at: sc.w.managed, inner: true },
      ];
      let x = xLeft;
      for (const w of words) {
        // the second half never shows outside the braces: it waits for them to part
        const u = Math.min(clamp((t - w.at + 0.06) / 0.38), w.inner ? clamp(g * 1.4 - 0.2) : 1);
        blurText(c, w.text, x, TAG_BASE, { size: s, weight: TAG.weight, u });
        x += measure(c, w.text, s, TAG.weight) + sp;
      }
    }

    // ---- the URL, typed under the lock-up with the caret from ch02-s01
    const n = Math.max(0, Math.min(URL.text.length, Math.floor((t - sc.typeAt) * URL.cps)));
    const ink = hexA(PROMO.ink, 0.8);
    c.save();
    c.font = font(400, URL.size);
    (c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(-0.022 * URL.size).toFixed(2)}px`;
    const fullW = c.measureText(URL.text).width;
    const x0 = 640 - fullW / 2;
    const shown = URL.text.slice(0, n);
    const sw = c.measureText(shown).width;
    c.fillStyle = ink;
    c.textBaseline = 'alphabetic';
    if (n > 0) c.fillText(shown, x0, URL.base);
    const ca = caretOn(t, sc) * clamp((t - sc.typeAt + 0.25) / 0.15);
    if (ca > 0) {
      c.globalAlpha *= ca;
      c.fillRect(x0 + sw + URL.size * 0.06, URL.base - URL.size * 0.82, Math.max(2, URL.size * 0.055), URL.size * 1.0);
    }
    c.restore();
  },
  overlay(s) {
    // the chip that drifted out of ch06-s01's collage, landing to the right of the lock-up (SVG so it stays crisp
    // through the blur dissolve)
    return <DriftChip t2={s.t} />;
  },
});
