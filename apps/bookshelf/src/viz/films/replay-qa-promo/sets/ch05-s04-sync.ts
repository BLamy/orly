/**
 * ch05-s04 / ch05-s05 shared: the bug-sync title strip framing and our request-ribbon overlay (258 request bars, the
 * counter, the 'checkpoint −1' tag with its bookmark flag, the struck pointer and its label), as ONE painter driven by
 * ch05-s04's clock, so ch05-s05 can carry the last state across the cut and fade it with the haze.
 *
 * bug-sync @ 1603, measured in the harness with the take's Inter forced (sets/ch05-s02-bug TakeInter), from the replay
 * iframe's DOM: 'Fixed' chip text 582..613.5 × 84.5..99.5 · title line 1 glyph box 117..148 ('Live-sync' from 537.2;
 * '258' 1309.8..1357.1, the line's last word: 'times' wraps to line 2) · line 2 149.5..180.5 ('past -1' 1016..1096.9).
 */
import { PROMO, blurText, counter, easeInOut, easeOut, font, hexA, measure } from '../../../film/promo';
import TIMELINE from '../timeline.json';
import { struckCursor } from './ch05-s02-bug';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** chips row + both title lines (the chat column, the header and the player stay out) */
export const STRIP_CROP = { x: 520, y: 74, w: 900, h: 120 } as const;
export const STRIP_BOX = { x: 90, y: 46, w: 1100 } as const;
/** the title only (no chips row, so no 'Fixed' chip): ch05-s05 while the agent pair is on screen */
export const TITLE_CROP = { x: 520, y: 110, w: 900, h: 76 } as const;
/** '258' at the end of the title's first line, in stage px at STRIP_BOX (measured on a 1080p still of ch05-s04 at
 *  rest: glyphs 1056.7..1112 × cap top 105.8, baseline 129.2; '/pulls' ends at ≈ 1046.7, so ≈ 10 px of gap on the
 *  left and clear paper on the right). ch05-s04 frames it with braces + an underline instead of a zoom. */
export const T258 = { x0: 1056.7, x1: 1112, yTop: 105.8, base: 129.2 } as const;

type W = { w: string; start: number; end: number };
type S = { id: string; start: number; end: number; lines: { id: string; words: W[] }[] };
const S04 = (TIMELINE as unknown as { shots: S[] }).shots.find((s) => s.id === 'ch05-s04')!;
const word = (line: string, w: string) => S04.lines.find((l) => l.id === line)!.words.find((x) => x.w.toLowerCase() === w.toLowerCase())!.start;

/** ch05-s04's anchors (shot-local s), from the locked clock */
export const S04_AT = {
  list: word('L0507', 'list'),
  fetched: word('L0507', 'fetched'),
  fiftyEight: word('L0507', 'fifty-eight'),
  minutes: word('L0507', 'minutes'),
  never: word('L0508', 'never'),
  place: word('L0508', 'place'),
  starting: word('L0508', 'starting'),
  dur: S04.end - S04.start,
};

// ---- the overlay layout (stage px): ONE block under the strip, centred on the stage (vertical centre ≈ y 450):
//      the ribbon x 190..970 with the counter right-aligned to it, the struck pointer + its label at x 1010..1200
const RX0 = 190, RX1 = 970;
const BASE = 535; // the bars stand on this line
const N = 258;
const PITCH = (RX1 - RX0) / (N - 1);
/** each request bar's height (deterministic, a little irregular, like request durations) */
const BAR_H = Array.from({ length: N }, (_, i) => {
  const r = Math.sin((i + 1) * 78.233) * 43758.5453;
  const f = r - Math.floor(r);
  return 44 + 34 * f;
});
const TAG = { x: RX0 - 12, y: BASE - 114 };
const COUNTER_BASE = BASE - 118;
/** the pointer glyph (≈ 45 px wide at scale 2.6) centred on x 1105, its two-line label under it */
const CURSOR = { x: 1082, y: 382 };
const LABEL = { x: 1105, y: 498, lh: 23 };

/** the bookmark's three tries on 'never': out 0.15 s (64 / 72 / 80 px along the ribbon), snap back in 0.08 s; the last
 *  lands back on −1 exactly on 'place' */
const TRY_OUT = 0.15, TRY_BACK = 0.08, TRY = TRY_OUT + TRY_BACK;
const TRY_PX = [64, 72, 80];
function flagDx(t: number) {
  const t0 = S04_AT.place - TRY * 3;
  for (let i = 0; i < 3; i++) {
    const u = t - (t0 + i * TRY);
    if (u < 0 || u >= TRY) continue;
    if (u < TRY_OUT) return TRY_PX[i] * easeOut(u / TRY_OUT);
    return TRY_PX[i] * (1 - easeInOut((u - TRY_OUT) / TRY_BACK));
  }
  return 0;
}

/**
 * Paint the request ribbon state at ch05-s04 local time t. `alpha` fades the whole overlay (ch05-s05 drains it).
 */
export function paintRequests(c: CanvasRenderingContext2D, t: number, alpha = 1) {
  if (alpha <= 0) return;
  const A = S04_AT;
  c.save();
  c.globalAlpha *= alpha;
  const shown = counter(N, t, A.fetched, A.fiftyEight - A.fetched);
  const on = clamp((t - A.fetched + 0.1) / 0.25);
  // ---- baseline hairline (the timeline the requests stand on)
  if (on > 0) {
    c.fillStyle = `rgba(255,255,255,${(0.28 * easeOut(on)).toFixed(3)})`;
    c.fillRect(RX0 - 12, BASE, (RX1 - RX0 + 24) * easeOut(on), 1);
  }
  // ---- the 258 bars: dealt left → right with the counter; on 'starting' every bar snaps back to its base, shoots up
  //      FULL WHITE at once (held 0.12 s at full height), then settles at 85 % with a faint red-pink glow at the base,
  //      held through the tail (each request asked for everything since −1)
  const ts = t - A.starting;
  const drop = ts >= 0 ? clamp(ts / 0.07) : 0;
  const regrow = ts >= 0.07 ? easeOut(clamp((ts - 0.07) / 0.12)) : 0;
  const k = ts < 0 ? 1 : drop < 1 ? 1 - drop : regrow;
  // alpha: .5 → 1 as they regrow, full white held to 0.31 s (0.12 s at full height), then down to .85 by 0.55 s
  const settleA = easeInOut(clamp((ts - 0.31) / 0.24));
  const barA = ts < 0.07 ? 0.5 : 0.5 + 0.5 * regrow - 0.15 * settleA;
  const flash = ts >= 0.07 ? regrow * (1 - settleA) : 0;
  const glow = ts >= 0.19 ? easeOut(clamp((ts - 0.19) / 0.35)) : 0;
  if (flash > 0) {
    // the flash: a brief white bloom behind the ribbon
    const g = c.createLinearGradient(0, BASE - 90, 0, BASE);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, `rgba(255,255,255,${(0.14 * flash).toFixed(3)})`);
    c.fillStyle = g;
    c.fillRect(RX0 - 6, BASE - 90, RX1 - RX0 + 12, 90);
  }
  if (glow > 0) {
    // the faint red-pink glow at the base: every request starts from −1
    const g = c.createLinearGradient(0, BASE - 34, 0, BASE + 6);
    g.addColorStop(0, hexA(PROMO.brand, 0));
    g.addColorStop(0.85, hexA(PROMO.brand, 0.42 * glow));
    g.addColorStop(1, hexA(PROMO.brand, 0));
    c.fillStyle = g;
    c.fillRect(RX0 - 4, BASE - 34, RX1 - RX0 + 8, 40);
  }
  c.fillStyle = `rgba(255,255,255,${barA.toFixed(3)})`;
  const bw = 1.4 + 0.4 * flash;
  for (let i = 0; i < shown; i++) {
    const x = RX0 + i * PITCH;
    const fresh = clamp((shown - i) / 6); // the newest bars rise as they land
    const h = BAR_H[i] * k * (0.4 + 0.6 * fresh);
    c.fillRect(x - bw / 2, BASE - h, bw, h);
  }
  // ---- the counter, riding above the right end of the ribbon
  if (on > 0) {
    const txt = String(shown);
    const size = 72;
    const w = measure(c, txt, size, 300);
    blurText(c, txt, RX1 - w, COUNTER_BASE, { size, weight: 300, u: on, color: '#ffffff', rise: 0 });
    // the landing: a red-pink underline under 258 as it stops dead
    const land = clamp((t - A.fiftyEight - 0.02) / 0.28);
    if (land > 0) {
      c.strokeStyle = PROMO.brand;
      c.lineWidth = 3;
      c.lineCap = 'round';
      const w258 = measure(c, '258', size, 300);
      c.beginPath();
      c.moveTo(RX1 - w258 + 2, COUNTER_BASE + 14);
      c.lineTo(RX1 - w258 + 2 + (w258 - 4) * easeOut(land), COUNTER_BASE + 14);
      c.stroke();
    }
  }
  // ---- the 'checkpoint −1' tag (never moves, never changes) and its bookmark flag
  if (on > 0) {
    const label = 'checkpoint −1';
    const size = 17;
    const tw = measure(c, label, size, 600, true);
    const h = 34;
    const w = tw + 26;
    c.save();
    c.globalAlpha *= easeOut(on);
    c.fillStyle = 'rgba(12,6,18,.72)';
    c.strokeStyle = 'rgba(255,255,255,.22)';
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect(TAG.x, TAG.y - h / 2, w, h, 8);
    c.fill();
    c.stroke();
    c.fillStyle = '#ffffff';
    c.font = font(600, size, true);
    c.textBaseline = 'middle';
    c.fillText(label, TAG.x + 13, TAG.y + 1);
    c.restore();
    // 'place': the red-pink underline under the tag (the place it never saved)
    const pu = clamp((t - A.place + 0.04) / 0.35);
    if (pu > 0) {
      c.strokeStyle = PROMO.brand;
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(TAG.x + 4, TAG.y + h / 2 + 6);
      c.lineTo(TAG.x + 4 + (w - 8) * easeOut(pu), TAG.y + h / 2 + 6);
      c.stroke();
    }
    // the bookmark: a red-pink flag on the ribbon at −1 (its left end); from 'never' it tries to step forward along
    // the ribbon three times (64 / 72 / 80 px) and snaps back each time, with a short red-pink ghost trail; the last
    // try lands back on −1 on 'place'
    const dx = flagDx(t);
    const fu = easeOut(clamp((t - A.fetched - 0.2) / 0.3));
    const flag = (x: number, a: number) => {
      c.save();
      c.globalAlpha *= a;
      c.fillStyle = PROMO.brand;
      c.fillRect(x - 1, BASE - 84, 2, 84);
      c.beginPath();
      c.moveTo(x + 1, BASE - 84);
      c.lineTo(x + 21, BASE - 77);
      c.lineTo(x + 1, BASE - 70);
      c.closePath();
      c.fill();
      c.restore();
    };
    c.save();
    c.globalAlpha *= fu;
    if (dx > 0.5) {
      // ghost trail: the reach along the ribbon, and the flag's last few positions
      const g = c.createLinearGradient(RX0, 0, RX0 + dx, 0);
      g.addColorStop(0, hexA(PROMO.brand, 0.05));
      g.addColorStop(1, hexA(PROMO.brand, 0.5));
      c.fillStyle = g;
      c.fillRect(RX0, BASE - 3, dx, 5);
      for (let j = 3; j >= 1; j--) {
        const gx = flagDx(t - j * 0.025);
        if (Math.abs(gx - dx) > 2) flag(RX0 + gx, 0.16 * (4 - j) / 3);
      }
    }
    flag(RX0 + dx, 1);
    c.restore();
  }
  // ---- 'minutes': the struck pointer beside the ribbon, with what the take really records
  const cu = clamp((t - A.minutes + 0.05) / 0.35);
  struckCursor(c, { x: CURSOR.x, y: CURSOR.y, u: cu, strike: clamp((t - A.minutes - 0.2) / 0.3), scale: 2.6 });
  if (cu > 0) {
    const lu = clamp((t - A.minutes - 0.1) / 0.4);
    blurText(c, '≈ 160 s · 2 clicks', LABEL.x, LABEL.y, { size: 17, weight: 500, u: lu, color: 'rgba(255,255,255,.74)', align: 'center' });
    blurText(c, 'no keypresses', LABEL.x, LABEL.y + LABEL.lh, { size: 17, weight: 500, u: lu, color: 'rgba(255,255,255,.74)', align: 'center' });
  }
  c.restore();
}
