// ch04-s01 — first of the triplet: "Then it runs on Replay's browsers. On a schedule, while you sleep."
// All drawn, no product footage (director's note 2026-10-14). A large thin '3:00 AM' on studio paper; on 'Then' a row
// of five abstract browsers rises under it and on 'runs' each starts a run (recording dot pulsing, skeleton page
// lighting, a progress hairline); 'hosted by Replay' lands on 'browsers'. On 'schedule' the real schedule
// ('Tue · America/New_York', the account's Production environment) types under the time with the red-pink underline,
// and six weekly ticks draw (Sep 1 → Oct 6); on 'sleep' a crescent moon rises beside the time, the time dims, the room
// cools, and the runs finish one by one with green ✓s. The drifting hairlines continue ch03-s01's.
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, blurText, easeOut, font, hexA, icon, measure, smooth } from '../../../film/promo';
import { driftLines, underline } from '../sets/brand';
import { browserWindow, moon } from '../sets/abstract';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

// ---- layout (stage px)
const CX = 640;
const TIME_Y = 196; // baseline of the big '3:00 AM'
const TIME_SIZE = 128;
const SUB_Y = 252; // 'Tue · America/New_York'
const SUB_SIZE = 26;
const WIN = { n: 5, w: 196, h: 128, gap: 22, y: 300 };
const WIN_X0 = CX - (WIN.n * WIN.w + (WIN.n - 1) * WIN.gap) / 2;
const PILL_Y = 486;
const PILL_SIZE = 22;
const STRIP_Y = 590;
const STRIP_X0 = 390;
const STRIP_X1 = 890;
const TICK = 0.12;

/** per-window run timing: start (s after 'runs'), duration; finishes spread across 'sleep' */
const RUNS = [
  { start: 0.0, dur: 2.55 },
  { start: 0.1, dur: 2.95 },
  { start: 0.05, dur: 2.75 },
  { start: 0.18, dur: 3.1 },
  { start: 0.08, dur: 2.65 },
];

function hostedPill(c: CanvasRenderingContext2D, t: number, at: number) {
  const u = clamp((t - at) / 0.45);
  if (u <= 0) return;
  const e = easeOut(u);
  const text = 'hosted by Replay';
  const tw = measure(c, text, PILL_SIZE, 400);
  const ic = 22;
  const h = 44;
  const w = 18 + ic + 10 + tw + 22;
  const x = CX - w / 2;
  const y = PILL_Y - h / 2 + (1 - e) * 12;
  c.save();
  c.globalAlpha *= e;
  if (e < 0.98) c.filter = `blur(${((1 - e) * 5).toFixed(2)}px)`;
  c.fillStyle = 'rgba(255,255,255,.78)';
  c.beginPath();
  c.roundRect(x, y, w, h, h / 2);
  c.fill();
  c.strokeStyle = hexA(PROMO.ink, 0.14);
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, h / 2);
  c.stroke();
  icon(c, 'server', x + 18 + ic / 2, y + h / 2, ic, PROMO.ink, false);
  c.fillStyle = PROMO.ink;
  c.font = font(400, PILL_SIZE);
  c.textBaseline = 'middle';
  c.fillText(text, x + 18 + ic + 10, y + h / 2 + 1);
  c.restore();
  // a hairline bracket joining the pill to the row of browsers above it
  const lu = easeOut(clamp((t - at - 0.1) / 0.4));
  if (lu > 0) {
    const yb = WIN.y + WIN.h + 18;
    const xa = WIN_X0 + WIN.w / 2, xb = WIN_X0 + (WIN.n - 1) * (WIN.w + WIN.gap) + WIN.w / 2;
    c.save();
    c.strokeStyle = hexA(PROMO.ink, 0.22 * lu);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(CX - (CX - xa) * lu, yb + 10);
    c.lineTo(CX - (CX - xa) * lu, yb);
    c.lineTo(CX + (xb - CX) * lu, yb);
    c.lineTo(CX + (xb - CX) * lu, yb + 10);
    c.moveTo(CX, yb);
    c.lineTo(CX, PILL_Y - 22);
    c.stroke();
    c.restore();
  }
}

function tickStrip(c: CanvasRenderingContext2D, t: number, at: number) {
  if (t < at) return;
  const n = 6;
  const step = (STRIP_X1 - STRIP_X0) / (n - 1);
  const grow = clamp((t - at) / (TICK * (n - 1) + 0.15));
  c.save();
  c.fillStyle = hexA(PROMO.ink, 0.2);
  c.fillRect(STRIP_X0, STRIP_Y + 0.5, (STRIP_X1 - STRIP_X0) * easeOut(grow), 1);
  for (let i = 0; i < n; i++) {
    const u = clamp((t - at - i * TICK) / 0.18);
    if (u <= 0) continue;
    const e = easeOut(u);
    const x = STRIP_X0 + i * step;
    const hgt = 22 * e;
    c.fillStyle = hexA(PROMO.ink, 0.7);
    c.fillRect(Math.round(x) - 1, STRIP_Y - hgt + 1, 2, hgt);
    c.globalAlpha = e;
    c.fillStyle = PROMO.brand;
    c.fillRect(Math.round(x) - 3, STRIP_Y - 22 - 6, 6, 6);
    c.globalAlpha = 1;
  }
  c.restore();
  const l0 = clamp((t - at) / 0.3);
  const l1 = clamp((t - at - (n - 1) * TICK) / 0.3);
  blurText(c, 'Sep 1', STRIP_X0, STRIP_Y + 30, { size: 18, weight: 400, u: l0, color: PROMO.mute, align: 'center', rise: 4 });
  blurText(c, 'every Tuesday', CX, STRIP_Y + 30, { size: 18, weight: 400, u: clamp((t - at - 0.25) / 0.3), color: PROMO.mute, align: 'center', rise: 4 });
  blurText(c, 'Oct 6', STRIP_X1, STRIP_Y + 30, { size: 18, weight: 400, u: l1, color: PROMO.mute, align: 'center', rise: 4 });
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
      bRuns: T.word('L0401', 'runs'),
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
    // night: the room cools a touch from the top on 'sleep' (never dark: it stays the studio paper)
    const night = smooth((t - sc.bSleep + 0.1) / 0.9);
    if (night > 0) {
      const g = c.createLinearGradient(0, 0, 0, 720);
      g.addColorStop(0, `rgba(88,70,130,${(0.16 * night).toFixed(3)})`);
      g.addColorStop(0.55, `rgba(88,70,130,${(0.05 * night).toFixed(3)})`);
      g.addColorStop(1, 'rgba(88,70,130,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
    }
    // ch03-s01's two hairlines, carried across the cut
    driftLines(c, t + 9.79, { n: 2, color: '#a9a4ae', alpha: 0.32, speed: 1.4, seed: 3, y0: 60, y1: 680 });

    // the big thin time; dims a touch on 'sleep'
    const tu = clamp((t - sc.bTime) / 0.55);
    blurText(c, '3:00 AM', CX, TIME_Y, { size: TIME_SIZE, weight: 300, u: tu, color: hexA(PROMO.ink, 0.86 - 0.26 * night), align: 'center', rise: 18 });
    // the moon beside it
    c.save();
    c.font = font(300, TIME_SIZE);
    const half = measure(c, '3:00 AM', TIME_SIZE, 300) / 2;
    c.restore();
    moon(c, { x: CX + half + 52, y: TIME_Y - TIME_SIZE * 0.55, r: 22, u: clamp((t - sc.bSleep + 0.05) / 0.5), color: hexA(PROMO.ink, 0.78) });

    // the real schedule, typed under the time on 'schedule', with the underline
    const sub = 'Tue · America/New_York';
    const su = clamp((t - sc.bSchedule + 0.12) / 0.35);
    blurText(c, sub, CX, SUB_Y, { size: SUB_SIZE, weight: 400, u: su, color: hexA(PROMO.ink, 0.7), align: 'center', rise: 6 });
    const sw = measure(c, sub, SUB_SIZE, 400);
    underline(c, { x0: CX - sw / 2, x1: CX + sw / 2, y: SUB_Y + 12, u: clamp((t - sc.bSchedule - 0.08) / 0.4), width: 3 });

    // the browsers: rise on 'Then', run from 'runs', ✓ through 'sleep'
    for (let i = 0; i < WIN.n; i++) {
      const r = RUNS[i];
      const t0 = sc.bRuns + r.start;
      const run = clamp((t - t0) / r.dur);
      const done = clamp((t - t0 - r.dur) / 0.35);
      browserWindow(c, {
        x: WIN_X0 + i * (WIN.w + WIN.gap),
        y: WIN.y,
        w: WIN.w,
        h: WIN.h,
        u: clamp((t - sc.bTag + 0.05 - i * 0.07) / 0.5),
        run,
        done,
        t,
        seed: i + 1,
      });
    }

    hostedPill(c, t, sc.bHosted - 0.08);
    tickStrip(c, t, sc.bStrip);
  },
});
