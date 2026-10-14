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
 *   norival   'rival'   the camera eases back; on 'named' the plan's own title is underlined, on 'rival' a ruled blank
 *                       line in the page's lower margin (where a counterpart would be named) draws and stays empty;
 *                       a hand comes in from the right frame edge at jetty height and sets one stone on the board
 * WINDOW RULE · equal shores (identical palette, height and warmth; the windows breathe on one rhythm).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, MOODS, defineShot, mixLab, placeStamp, withAlpha } from '../../../film';
import { indexTab } from '../sets/indexTab';
import { STONES, boardPoint, clamp01, lerp, monotone, sm, stoneHand, strait, tq12, win, windowFrame } from '../sets/ch14-s01-strait';

const ID = 'ch14-s01';
type C = CanvasRenderingContext2D;

/** the plan's page hangs in the air above the right shore (action plane). Review r1: ~72% of its first size and
 *  hung higher, so it overlaps only the right city's tower tops; its mid-rise and waterline (y 250-405) stay seen */
const PAGE = { x: 952, y: 162, w: 316, h: 262 } as const;
/** page-local rows (y from the page centre) */
const ROW = { t1: -103, t2: -77, under: -68, q1: -39, q2: -12, ring: 15, yr: 46, blank: 68, attr: 96, attr2: 121 } as const;
const Z0 = -420;
const PUSH = 2.6;
/** the window frame's own depth (stage px): its scale follows the dolly so the mullions part like a near object */
const ZW = 140;

interface B {
  D: number;
  named: number;
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
    const b: B = { D, named: T.word('L1402', 'named'), page: T.beat('page'), rings: T.beat('rings'), rival: T.beat('norival') };
    // after the push-through: a slow lens push toward the jetty (held high enough that the hung page stays in frame),
    // then on 'rival' an easing back so the whole left shore comes into frame, lit and untouched, beside the page
    const back = Math.min(D - 0.05, b.rival + 2.0);
    const lens = monotone([[0, 1], [PUSH, 1], [b.rival - 0.45, 1.08], [back, 0.98], [D, 0.975]]);
    const cx = monotone([[0, 640], [PUSH, 640], [b.rival - 0.45, 660], [back, 640], [D, 639]]);
    const cy = monotone([[0, 360], [PUSH, 360], [b.rival - 0.45, 334], [back, 354], [D, 352]]);
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
    // review r1: the hand comes in from the right frame edge at jetty height (someone on the right bank reaching
    // to the board), sets the stone and goes back the way it came
    const HAND0 = b.rival - 0.35;
    const HAND_DUR = 2.3;
    const uStone = (tq - HAND0) / HAND_DUR;
    const stones: Array<[number, number, 'b' | 'w']> = uStone >= 0.5 ? [STONES.r1] : [];
    // on contact the post lantern flares for ~0.3 s (inside the music hold)
    const contact = HAND0 + HAND_DUR * 0.5;
    const flare = win(t, contact - 0.03, contact + 0.07) * (1 - win(t, contact + 0.12, contact + 0.34));
    strait(f, {
      key: 'ch14',
      moodKey: 'dawnGold',
      sunX: 640,
      sunI: 1,
      stones,
      flare,
      l3: (c, env) => {
        if (uStone > 0 && uStone < 1)
          stoneHand(c, env, { side: 1, u: uStone, target: boardPoint(STONES.r1[0], STONES.r1[1]), col: 'b', len: 30, from: { x: 1360, y: 452 }, armAxis: 0.1, handAxis: 0.62, sleeve: 2.0 });
        // the newly set stone catches the lantern a moment
        if (uStone >= 0.5) {
          const p = boardPoint(STONES.r1[0], STONES.r1[1]);
          const g = win(tq, contact, contact + 0.3) * (1 - win(tq, contact + 0.6, contact + 1.8));
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
 *  attribution. It rises from the right shore on 'aimed' (on twos) and hangs there, turning very slightly.
 *  'No rival' (review r1): on 'named' an ink underline draws under the plan's own title (the only name on it); on
 *  'rival' a ruled blank line draws in the lower margin, where a counterpart would be named, and a small glint runs
 *  along it and finds nothing; both hold to the end */
function planPage(c: C, env: PaintEnv, t: number, b: B) {
  const tq = tq12(t);
  const u = clamp01((tq - (b.page - 0.15)) / 1.25);
  if (u <= 0) return;
  const m = env.mood;
  const rise = 1 - sm(u);
  const sway = 0.012 * Math.sin(tq * 0.8) * sm(u);
  const P = MOODS.parchment;
  const A = MOODS.candleAmber;
  c.save();
  c.globalAlpha = sm(u * 1.6);
  c.translate(PAGE.x, PAGE.y + rise * 150);
  c.rotate(sway - 0.02 * rise);
  const w = PAGE.w, h = PAGE.h;
  // the page: warm parchment lit by the dawn, a slightly deckled top edge, its lower edge a touch darker
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
  // its sunward (left, toward sunX = 640) and top edges catch the dawn
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(-w / 2, -h / 2 - 0.5, w, 1);
  c.fillRect(-w / 2 - 0.5, -h / 2, 1, h);
  const ink = P.ink;
  // title (the plan's own name, the only name on it): 24 px small caps clear the 22 px cap floor at the widest lens
  c.fillStyle = withAlpha(ink, 0.88);
  c.font = `600 24px ${FONT.sc}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  (c as C & { letterSpacing?: string }).letterSpacing = '0.3px';
  c.fillText('NEW GENERATION', 0, ROW.t1);
  c.fillText('AI DEVELOPMENT PLAN', 0, ROW.t2);
  const titleW = c.measureText('AI DEVELOPMENT PLAN').width;
  (c as C & { letterSpacing?: string }).letterSpacing = '0px';
  // the underline: on 'named' it draws under the title in ink, with a warm wash behind the title for its first second
  const uu = clamp01((tq - (b.named - 0.05)) / 0.45);
  const wash = win(tq, b.named, b.named + 0.3) * (1 - 0.7 * win(tq, b.rival + 0.6, b.rival + 1.6));
  if (wash > 0.01) {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = withAlpha(mixLab(A.rim, P.sky[1], 0.4), 0.5 * wash);
    c.fillRect(-titleW / 2 - 8, ROW.t1 - 22, titleW + 16, ROW.under - ROW.t1 + 26);
    c.restore();
  }
  c.strokeStyle = withAlpha(ink, 0.5);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-w * 0.34, ROW.under + 6);
  c.lineTo(w * 0.34, ROW.under + 6);
  c.stroke();
  if (uu > 0) {
    c.strokeStyle = withAlpha(ink, 0.9);
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-titleW / 2, ROW.under);
    c.lineTo(-titleW / 2 + titleW * sm(uu), ROW.under + 0.6 * Math.sin(uu * 3));
    c.stroke();
  }
  // the quoted aim
  c.fillStyle = withAlpha(ink, 0.92);
  c.font = `italic 400 24px ${FONT.text}`;
  c.fillText('“…the world’s primary', 0, ROW.q1);
  c.fillText('AI innovation center”', 0, ROW.q2);
  // three steps: 2020 · 2025 · 2030 as rings; the 2030 ring lights on 'thirty' (a peak), then stays lit at 0.6
  const glow = win(tq, b.rings - 0.15, b.rings + 0.3) * (1 - 0.4 * win(tq, b.rings + 0.6, b.rings + 1.8));
  const ry = ROW.ring;
  const xs = [-92, 0, 92];
  c.strokeStyle = withAlpha(ink, 0.7);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(xs[0] + 10, ry);
  c.lineTo(xs[1] - 10, ry);
  c.moveTo(xs[1] + 10, ry);
  c.lineTo(xs[2] - 10, ry);
  c.stroke();
  xs.forEach((x, i) => {
    c.beginPath();
    c.arc(x, ry, 9, 0, Math.PI * 2);
    c.strokeStyle = withAlpha(ink, 0.8);
    c.lineWidth = 1.8;
    c.stroke();
    if (i === 2 && glow > 0) {
      c.save();
      c.globalAlpha *= Math.min(1, glow * 1.6);
      c.fillStyle = mixLab(mixLab(A.rim, A.halo, 0.2), A.core, 0.25 * glow);
      c.beginPath();
      c.arc(x, ry, 8.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.fillStyle = withAlpha(ink, i === 2 ? 0.95 : 0.8);
    c.font = `500 22px ${FONT.mono}`;
    c.fillText(['2020', '2025', '2030'][i], x, ROW.yr);
  });
  // the lower margin, where a counterpart would be named: a ruled blank line draws on 'rival' and stays empty
  const bu = clamp01((tq - (b.rival - 0.1)) / 0.5);
  if (bu > 0) {
    const x0 = -w * 0.3, x1 = w * 0.3;
    c.save();
    c.strokeStyle = withAlpha(ink, 0.55);
    c.lineWidth = 1.1;
    c.setLineDash([5, 4]);
    c.beginPath();
    c.moveTo(x0, ROW.blank);
    c.lineTo(lerp(x0, x1, sm(bu)), ROW.blank);
    c.stroke();
    c.setLineDash([]);
    // a glint runs along it once (looking for a name) and goes out at the far end
    const gu = clamp01((tq - (b.rival + 0.3)) / 1.1);
    const ga = win(tq, b.rival + 0.3, b.rival + 0.5) * (1 - win(tq, b.rival + 1.2, b.rival + 1.45));
    if (ga > 0.01) {
      const gx = lerp(x0, x1, sm(gu));
      c.globalCompositeOperation = 'lighter';
      const rg = c.createRadialGradient(gx, ROW.blank, 0, gx, ROW.blank, 14);
      rg.addColorStop(0, withAlpha(A.core, 0.5 * ga));
      rg.addColorStop(1, withAlpha(A.halo, 0));
      c.fillStyle = rg;
      c.fillRect(gx - 14, ROW.blank - 14, 28, 28);
    }
    c.restore();
  }
  // attribution
  c.fillStyle = withAlpha(ink, 0.74);
  c.font = `italic 400 23.5px ${FONT.text}`;
  c.fillText('2017 plan', 0, ROW.attr);
  c.fillText('(DigiChina translation)', 0, ROW.attr2);
  c.restore();
  // the 2030 ring's light: a small practical-like bloom (the page's one accent)
  if (glow > 0) {
    const gx = PAGE.x + Math.cos(sway) * xs[2] - Math.sin(sway) * ry;
    const gy = PAGE.y + Math.sin(sway) * xs[2] + Math.cos(sway) * ry;
    c.save();
    const hole = new Path2D();
    hole.rect(gx - 100, gy - 100, 200, 200);
    hole.arc(gx, gy, 9.2, 0, Math.PI * 2);
    c.clip(hole, 'evenodd');
    c.globalCompositeOperation = 'lighter';
    const pulse = 1 + 0.05 * Math.sin(t * 3.1);
    const R = 28 * pulse;
    const rg = c.createRadialGradient(gx, gy, 7, gx, gy, R);
    rg.addColorStop(0, withAlpha(A.core, 0.6 * glow));
    rg.addColorStop(0.35, withAlpha(A.halo, 0.32 * glow));
    rg.addColorStop(1, withAlpha(A.halo, 0));
    c.fillStyle = rg;
    c.fillRect(gx - R, gy - R, R * 2, R * 2);
    const peak = win(tq, b.rings - 0.15, b.rings + 0.3) * (1 - win(tq, b.rings + 0.5, b.rings + 1.6));
    if (peak > 0.01) {
      const rb = c.createRadialGradient(gx, gy, 0, gx, gy, 70);
      rb.addColorStop(0, withAlpha(A.core, 0.35 * peak));
      rb.addColorStop(1, withAlpha(A.halo, 0));
      c.fillStyle = rb;
      c.fillRect(gx - 70, gy - 70, 140, 140);
    }
    c.restore();
  }
}
