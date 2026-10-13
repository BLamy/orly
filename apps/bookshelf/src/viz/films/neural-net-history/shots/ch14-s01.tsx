/**
 * ch14-s01 — Two Shores. Through the study window, two equal shores at dawn; the 2017 plan's parchment page rises
 * over the right shore, its 2030 ring glowing, naming no rival; one stone is set on the jetty's Go board
 * (dawnGold; 11.0 s; in: crossfade from ch13-s06's study window).
 *
 *   indexTab  0.1   the manila chapter tab 'Two Shores' drops at top-left, holds 2.5 s, slides up
 *   open      0     the study window frame itself (dark mullions against the dawn); a short dolly through the gap
 *                   between the two centre mullions, which slide out to the frame's edges and stay as the occluder;
 *                   then a slow push toward the jetty (lens)
 *   page      'aimed'   the plan's parchment page rises above the right shore; the date stamp types on
 *   rings     'thirty'  the 2030 ring on the page glows
 *   norival   'rival'   the camera eases back to show the whole page (no name on it but its own); a hand from the
 *                       right shore's side sets one stone on the board; nothing answers yet
 * WINDOW RULE · equal shores (identical palette, height and warmth; the windows breathe on one rhythm).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, MOODS, defineShot, mixLab, placeStamp, withAlpha } from '../../../film';
import { indexTab } from '../sets/indexTab';
import { STONES, boardPoint, clamp01, lerp, monotone, sm, stoneHand, strait, tq12, win, windowFrame } from '../sets/ch14-s01-strait';

const ID = 'ch14-s01';
type C = CanvasRenderingContext2D;

/** the plan's page hangs in the air above the right shore (action plane) */
const PAGE = { x: 958, y: 222, w: 330, h: 262 } as const;
const Z0 = -420;
const PUSH = 2.6;
/** the window frame's own depth (stage px): its scale follows the dolly so the mullions part like a near object */
const ZW = 140;

interface B {
  D: number;
  page: number;
  rings: number;
  rival: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  lens: (t: number) => number;
  cx: (t: number) => number;
  cy: (t: number) => number;
  [k: string]: unknown;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = { D, page: T.beat('page'), rings: T.beat('rings'), rival: T.beat('norival') };
    // after the push-through: a slow lens push toward the jetty, then on 'rival' an easing back to the whole page
    // 'no rival': a real pull-back (1.12 → 0.98) so the whole left shore comes into frame, lit and untouched, beside
    // the page that names nobody
    const lens = monotone([[0, 1], [PUSH, 1], [b.rival - 0.45, 1.12], [Math.min(D - 0.05, b.rival + 2.0), 0.98], [D, 0.975]]);
    const cx = monotone([[0, 640], [PUSH, 640], [b.rival - 0.45, 652], [Math.min(D - 0.05, b.rival + 2.0), 640], [D, 639]]);
    const cy = monotone([[0, 360], [PUSH, 360], [b.rival - 0.45, 372], [Math.min(D - 0.05, b.rival + 2.0), 356], [D, 355]]);
    tl.hold(0, D);
    return { tl, b, lens, cx, cy };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const tq = tq12(t);
    const z = lerp(Z0, 0, sm(t / PUSH));
    const cam: Camera3 = { x: sc.cx(t), y: sc.cy(t), z, lens: sc.lens(t) };
    f.camera(cam);
    const uStone = (tq - (b.rival + 0.15)) / 1.25;
    const stones: Array<[number, number, 'b' | 'w']> = uStone >= 0.5 ? [STONES.r1] : [];
    // on contact the post lantern flares for ~0.3 s (inside the music hold)
    const contact = b.rival + 0.15 + 0.625;
    const flare = win(t, contact - 0.03, contact + 0.07) * (1 - win(t, contact + 0.12, contact + 0.34));
    strait(f, {
      key: 'ch14',
      moodKey: 'dawnGold',
      sunX: 640,
      sunI: 1,
      stones,
      flare,
      l3: (c, env) => {
        if (uStone > 0 && uStone < 1) stoneHand(c, env, { side: 1, u: uStone, target: boardPoint(STONES.r1[0], STONES.r1[1]), col: 'b', len: 34 });
        // the newly set stone catches the lantern a moment
        if (uStone >= 0.5) {
          const p = boardPoint(STONES.r1[0], STONES.r1[1]);
          const g = win(tq, b.rival + 0.8, b.rival + 1.1) * (1 - win(tq, b.rival + 1.4, b.rival + 2.6));
          if (g > 0.01) {
            c.save();
            c.globalCompositeOperation = 'lighter';
            const rg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
            rg.addColorStop(0, withAlpha(env.mood.core, 0.45 * g));
            rg.addColorStop(1, withAlpha(env.mood.core, 0));
            c.fillStyle = rg;
            c.fillRect(p.x - 12, p.y - 12, 24, 24);
            c.restore();
          }
        }
      },
      l4: (c, env) => planPage(c, env, t, b),
    });
    // the window: k follows the dolly through it (mullions at the frame edges once through)
    const k = ZW / (ZW - z);
    windowFrame(f, {
      k,
      glass: (c, env) => glassAtStart(c, env, t),
    });
    // type
    const env = { t, mood: f.mood };
    placeStamp(f.c, { place: '20 July 2017', date: 'State Council of China', year: 2017, x: 104, y: 664, at: b.page + 0.1, dur: b.D - b.page - 0.6, fade: 0.5 }, env);
    indexTab(f.c, { title: 'Two Shores', number: 14, at: 0.1, hold: 2.5, x: 104 }, env);
  },
});

/** at the first frames the centre light still carries the study in its glass: the lamp's warm blur and a row of
 *  far flames low at right (as ch13-s06 left it); it thins away as we pass through */
function glassAtStart(c: C, env: PaintEnv, t: number) {
  const a = 1 - win(t, 0.25, 1.4);
  if (a <= 0.003) return;
  const A = MOODS.candleAmber;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const blob = (x: number, y: number, r: number, k: number) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(A.core, k * a));
    g.addColorStop(0.35, withAlpha(A.halo, 0.4 * k * a));
    g.addColorStop(1, withAlpha(A.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  };
  blob(1030, 1060, 200, 0.42);
  for (let i = 0; i < 6; i++) blob(560 + i * 88, 1000 + (i % 2) * 6, 46, 0.32);
  c.restore();
}

/** the 2017 plan: a parchment page, its title, the quoted aim, three dated rings (the last one glowing) and its
 *  attribution. It rises from the right shore on 'aimed' (on twos) and hangs there, turning very slightly */
function planPage(c: C, env: PaintEnv, t: number, b: B) {
  const tq = tq12(t);
  const u = clamp01((tq - (b.page - 0.15)) / 1.25);
  if (u <= 0) return;
  const m = env.mood;
  const rise = 1 - sm(u);
  // on 'rival' the page turns a few degrees toward the left shore, as if to find who it answers, and settles back
  const look = win(tq, b.rival - 0.1, b.rival + 0.9) * (1 - win(tq, b.rival + 1.4, b.rival + 2.4));
  const sway = 0.012 * Math.sin(tq * 0.8) * sm(u) - 0.07 * look;
  const P = MOODS.parchment;
  c.save();
  c.globalAlpha = sm(u * 1.6);
  c.translate(PAGE.x, PAGE.y + rise * 150);
  c.rotate(sway - 0.02 * rise);
  const w = PAGE.w, h = PAGE.h;
  // the page: warm parchment lit by the dawn, a slightly deckled edge, a soft shadow on the air (none: it is paper
  // against light; instead its lower edge is a touch darker)
  const paper = mixLab(P.sky[1], m.core, 0.18);
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, mixLab(paper, '#fff6e2', 0.25));
  g.addColorStop(1, mixLab(paper, P.set, 0.3));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-w / 2, -h / 2);
  for (let i = 1; i <= 12; i++) c.lineTo(-w / 2 + (w * i) / 12, -h / 2 + (i % 2 ? 0.8 : -0.4));
  c.lineTo(w / 2, h / 2 - 4);
  c.lineTo(w / 2 - 6, h / 2);
  c.lineTo(-w / 2, h / 2);
  c.closePath();
  c.fill();
  const ink = P.ink;
  // title (the plan's own name, the only name on it)
  c.fillStyle = withAlpha(ink, 0.86);
  c.font = `600 18px ${FONT.sc}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  (c as C & { letterSpacing?: string }).letterSpacing = '1px';
  c.fillText('NEW GENERATION', 0, -h / 2 + 30);
  c.fillText('AI DEVELOPMENT PLAN', 0, -h / 2 + 52);
  (c as C & { letterSpacing?: string }).letterSpacing = '0px';
  c.fillStyle = withAlpha(ink, 0.5);
  c.fillRect(-w * 0.34, -h / 2 + 66, w * 0.68, 0.9);
  // the quoted aim
  c.fillStyle = withAlpha(ink, 0.92);
  c.font = `italic 400 23px ${FONT.text}`;
  c.fillText('“…the world’s primary', 0, -h / 2 + 100);
  c.fillText('AI innovation center”', 0, -h / 2 + 128);
  // three steps: 2020 · 2025 · 2030 as rings; the last glows on 'thirty'
  // the 2030 ring lights on 'thirty' (a peak), then stays lit at 0.6 to the end: the plan's target is the point
  const glow = win(tq, b.rings - 0.15, b.rings + 0.3) * (1 - 0.4 * win(tq, b.rings + 0.6, b.rings + 1.8));
  const A = MOODS.candleAmber;
  const ry = -h / 2 + 164;
  const xs = [-96, 0, 96];
  c.strokeStyle = withAlpha(ink, 0.7);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(xs[0] + 11, ry);
  c.lineTo(xs[1] - 11, ry);
  c.moveTo(xs[1] + 11, ry);
  c.lineTo(xs[2] - 11, ry);
  c.stroke();
  xs.forEach((x, i) => {
    c.beginPath();
    c.arc(x, ry, 10, 0, Math.PI * 2);
    c.strokeStyle = withAlpha(ink, 0.8);
    c.lineWidth = 1.8;
    c.stroke();
    if (i === 2 && glow > 0) {
      // a solid candleAmber disc filling the ring
      c.save();
      c.globalAlpha *= Math.min(1, glow * 1.6);
      c.fillStyle = mixLab(mixLab(A.rim, A.halo, 0.2), A.core, 0.25 * glow);
      c.beginPath();
      c.arc(x, ry, 9.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.fillStyle = withAlpha(ink, i === 2 ? 0.95 : 0.78);
    c.font = `500 17.5px ${FONT.mono}`;
    c.fillText(['2020', '2025', '2030'][i], x, ry + 34);
  });
  // attribution
  c.fillStyle = withAlpha(ink, 0.72);
  c.font = `italic 400 17.5px ${FONT.text}`;
  c.fillText('2017 plan (DigiChina translation)', 0, h / 2 - 18);
  c.restore();
  // the 2030 ring's light: a small practical-like bloom (the page's one accent)
  if (glow > 0) {
    const sway2 = sway;
    const gx = PAGE.x + Math.cos(sway2) * 96 - Math.sin(sway2) * (-h / 2 + 164);
    const gy = PAGE.y + Math.sin(sway2) * 96 + Math.cos(sway2) * (-h / 2 + 164);
    c.save();
    // the halo lives OUTSIDE the disc, so the disc keeps its amber
    const hole = new Path2D();
    hole.rect(gx - 100, gy - 100, 200, 200);
    hole.arc(gx, gy, 10.2, 0, Math.PI * 2);
    c.clip(hole, 'evenodd');
    c.globalCompositeOperation = 'lighter';
    const pulse = 1 + 0.05 * Math.sin(t * 3.1);
    // a soft 22 px halo around the disc (the page's one accent), and a wider faint bloom at the peak
    const R = 32 * pulse;
    const rg = c.createRadialGradient(gx, gy, 8, gx, gy, R);
    rg.addColorStop(0, withAlpha(A.core, 0.6 * glow));
    rg.addColorStop(0.35, withAlpha(A.halo, 0.32 * glow));
    rg.addColorStop(1, withAlpha(A.halo, 0));
    c.fillStyle = rg;
    c.fillRect(gx - R, gy - R, R * 2, R * 2);
    const peak = win(tq, b.rings - 0.15, b.rings + 0.3) * (1 - win(tq, b.rings + 0.5, b.rings + 1.6));
    if (peak > 0.01) {
      const rb = c.createRadialGradient(gx, gy, 0, gx, gy, 80);
      rb.addColorStop(0, withAlpha(A.core, 0.35 * peak));
      rb.addColorStop(1, withAlpha(A.halo, 0));
      c.fillStyle = rb;
      c.fillRect(gx - 80, gy - 80, 160, 160);
    }
    c.restore();
  }
}
