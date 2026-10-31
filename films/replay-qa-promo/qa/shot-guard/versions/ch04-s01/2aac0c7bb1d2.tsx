// ch04-s01 — first of the triplet: it runs on Replay's browsers, on a schedule, while you sleep.
// A large thin '3:00 AM' on studio paper; the real schedule chip ('Tue at 3:00 AM · America/New_York', take
// 'schedule' frozen at mark add-env 11458) lifts under it like a name tag on 'Then'; 'hosted by Replay' pill on
// 'browsers'; brace halves + red-pink underline on 'schedule'; six ticks (Sep 1 → Oct 6) draw after; the big time
// dims on 'sleep'. The drifting hairlines continue ch03-s01's (same seed, time offset by its length).
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, blurText, easeOut, font, hexA, icon, measure, smooth } from '../../../film/promo';
import { braceBox, driftLines, underline } from '../sets/brand';
import { MARKS, SLUG } from '../sets/takes';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

// ---- layout (stage px)
const CX = 640;
const TIME_Y = 264; // baseline of the big '3:00 AM' (≈ 60 px of paper above the name tag)
const TIME_SIZE = 150;
// The chip crop MEASURED IN THE FILM HARNESS (a single seek to add-env 11458): the page's sheet scroller sits at
// scrollTop 700 there, so the chip is at recording y 77..102 (the rr-sheet frames, cast by sequential seeks, show it
// 93 px lower, at 170..195, which is what sets/takes CROPS.scheduleChip encodes). Measured with a DOM probe of the
// replay iframe: chip 1054..1285 × 77..102; the project URL line sits at x < 620, outside this crop.
const CHIP_CROP = { x: 1050, y: 73, w: 245, h: 32 };
const CHIP_W = 735; // ×3
const K = CHIP_W / CHIP_CROP.w;
const CHIP_BOX = { x: CX - CHIP_W / 2, y: 324, w: CHIP_W };
const CHIP_H = CHIP_CROP.h * K; // 96
/** the green chip inside the crop (recording px), measured in the harness at 11458 */
const rx = (x: number) => CHIP_BOX.x + (x - CHIP_CROP.x) * K;
const ry = (y: number) => CHIP_BOX.y + (y - CHIP_CROP.y) * K;
const CHIP = { x0: rx(1054), x1: rx(1285), y0: ry(77), y1: ry(102) };
const TUE = { x0: rx(1064), x1: rx(1153) }; // 'Tue at 3:00 AM'
const STRIP_Y = 506;
const STRIP_X0 = CHIP.x0 + 12;
const STRIP_X1 = 650; // ≥ 45 px of paper between 'Oct 6' and the 'hosted by Replay' pill
const PILL_SIZE = 25;
/** seconds between ticks: the strip completes ~0.75 s after b-strip so both end labels hold > 1 s before the cut */
const TICK = 0.12;

function hostedPill(c: CanvasRenderingContext2D, t: number, at: number) {
  const u = clamp((t - at) / 0.45);
  if (u <= 0) return;
  const e = easeOut(u);
  const text = 'hosted by Replay';
  const tw = measure(c, text, PILL_SIZE, 400);
  const ic = 26;
  const h = 50;
  const w = 20 + ic + 12 + tw + 24;
  const x1 = CHIP.x1; // right end aligns with the chip's right end
  const x = x1 - w + (1 - e) * 46;
  const y = STRIP_Y - h / 2 + 4;
  c.save();
  c.globalAlpha *= e;
  if (e < 0.98) c.filter = `blur(${((1 - e) * 5).toFixed(2)}px)`;
  c.fillStyle = 'rgba(255,255,255,.72)';
  c.beginPath();
  c.roundRect(x, y, w, h, h / 2);
  c.fill();
  c.strokeStyle = hexA(PROMO.ink, 0.16);
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, h / 2);
  c.stroke();
  icon(c, 'server', x + 20 + ic / 2, y + h / 2, ic, PROMO.ink, false);
  c.fillStyle = PROMO.ink;
  c.font = font(400, PILL_SIZE);
  (c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(-0.022 * PILL_SIZE).toFixed(2)}px`;
  c.textBaseline = 'middle';
  c.fillText(text, x + 20 + ic + 12, y + h / 2 + 1);
  c.restore();
}

function tickStrip(c: CanvasRenderingContext2D, t: number, at: number) {
  if (t < at) return;
  const n = 6;
  const step = (STRIP_X1 - STRIP_X0) / (n - 1);
  // the baseline hairline grows with the ticks
  const grow = clamp((t - at) / (TICK * (n - 1) + 0.15));
  c.save();
  c.fillStyle = hexA(PROMO.ink, 0.22);
  c.fillRect(STRIP_X0, STRIP_Y + 0.5, (STRIP_X1 - STRIP_X0) * easeOut(grow), 1);
  for (let i = 0; i < n; i++) {
    const u = clamp((t - at - i * TICK) / 0.18);
    if (u <= 0) continue;
    const e = easeOut(u);
    const x = STRIP_X0 + i * step;
    const hgt = 26 * e;
    c.fillStyle = hexA(PROMO.ink, 0.78);
    c.fillRect(Math.round(x) - 1, STRIP_Y - hgt + 1, 2.2, hgt);
    // a small square cap, the look's registration-dot language
    c.globalAlpha = e;
    c.fillRect(Math.round(x) - 3, STRIP_Y - 26 - 6, 6, 6);
    c.globalAlpha = 1;
  }
  c.restore();
  const l0 = clamp((t - at) / 0.3);
  const l1 = clamp((t - at - (n - 1) * TICK) / 0.3);
  blurText(c, 'Sep 1', STRIP_X0, STRIP_Y + 32, { size: 20, weight: 400, u: l0, color: PROMO.mute, align: 'center', rise: 4 });
  blurText(c, 'Oct 6', STRIP_X1, STRIP_Y + 32, { size: 20, weight: 400, u: l1, color: PROMO.mute, align: 'center', rise: 4 });
}

export default defineShot({
  id: 'ch04-s01',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return {
      tl,
      dur: T.duration,
      bTime: T.beat('b-time'),
      bTag: T.beat('b-tag'),
      bHosted: T.beat('b-hosted'),
      bSchedule: T.beat('b-schedule'),
      bStrip: T.beat('b-strip'),
      bSleep: T.beat('b-sleep'),
    };
  },
  paint(f, _s, sc) {
    const c = f.c;
    const t = f.t;
    c.fillStyle = PROMO.paper;
    c.fillRect(0, 0, 1280, 720);
    // ch03-s01's two hairlines, carried across the cut (its t + 3, plus its 6.79 s)
    driftLines(c, t + 9.79, { n: 2, color: '#a9a4ae', alpha: 0.32, speed: 1.4, seed: 3, y0: 60, y1: 680 });

    // the big thin time; dims a touch on 'sleep' (the room goes dark), the chip stays bright
    const tu = clamp((t - sc.bTime) / 0.55);
    const dim = smooth((t - sc.bSleep + 0.05) / 0.7);
    blurText(c, '3:00 AM', CX, TIME_Y, { size: TIME_SIZE, weight: 300, u: tu, color: hexA(PROMO.ink, 0.85 - 0.3 * dim), align: 'center', rise: 18 });

    // the name tag's soft paper plate glow under the DOM chip, so it sits on the page (and the underline below it)
    const ul = clamp((t - sc.bSchedule - 0.05) / 0.35);
    underline(c, { x0: TUE.x0, x1: TUE.x1, y: CHIP_BOX.y + CHIP_H + 12, u: ul, width: 3.5 });

    hostedPill(c, t, sc.bHosted - 0.08);
    tickStrip(c, t, sc.bStrip);

    // brace halves at the chip's measured ends, corner dots, on 'schedule'
    braceBox(c, {
      x0: CHIP.x0,
      x1: CHIP.x1,
      y: (CHIP.y0 + CHIP.y1) / 2 + 2,
      size: 104,
      u: clamp((t - sc.bSchedule + 0.06) / 0.32),
      color: PROMO.ink,
      pad: 18,
    });
  },
  dom(s, sc) {
    const t = s.t;
    const u = clamp((t - sc.bTag + 0.04) / 0.5);
    const e = easeOut(u);
    return (
      <RrwebScreen
        slug={SLUG}
        take="schedule"
        at={MARKS.schedule.addEnv}
        crop={CHIP_CROP}
        box={{ x: CHIP_BOX.x, y: CHIP_BOX.y + (1 - e) * 24, w: CHIP_W }}
        chrome="none"
        radius={6}
        opacity={e}
        style={{
          filter: e < 0.98 ? `blur(${((1 - e) * 8).toFixed(2)}px)` : undefined,
          boxShadow: `0 ${14 + 10 * e}px ${36 + 14 * e}px -14px rgba(40,10,60,${(0.3 * e).toFixed(3)}), 0 4px 12px -6px rgba(40,10,60,.18), 0 0 0 1px rgba(20,18,22,.05)`,
        }}
      />
    );
  },
});
