/**
 * ch09-s01 — FOUR DAYS IN OCTOBER: the Window Calendar blazes (Device 2). emberRed night, lampChange in from ch08's
 * dawnGold; 11.75 s on the locked clock.
 *   L0901 "Then October: six hundred and eighty-nine commits."
 *   L0902 "Nearly all of them in four days."
 *
 * The black paper building (sets/windowCalendar, the canonical grid and placement: base centre (640, 690), six panes a
 * storey, one lit pane per commit, exact counts) seen across a dark street: L1 a far city in the haze, L2 dark
 * neighbouring blocks, fog A drifting across the lower third, L3 two street lamps on the far kerb, L4 the building and
 * its street, L5 the near kerb and railing (blurred, it drops out of frame as the camera cranes up).
 * The main block as ch08 left it: June 72 · July 6 · August black glass, snow on the sill · September 58.
 *
 * TEACHES, word by word:
 *   0.1 chapterCard   'Chapter IX · Four Days in October' sets in upper left over the night sky, holds ~3 s, fades
 *   3.57 October      the camera still wide on the 12-storey block (~50 % of frame height): October's column lights its
 *                     six panes for 1-12 October one by one (689 - 683)
 *   5.83 commits      the month stamp 'OCTOBER 2026 · 689 COMMITS' sets in lower left
 *   8.39 four         the ANNEXE rises from the roof as four day-columns over July..October, labelled at their feet
 *                     13 · 14 · 15 · 16, and fills in a fast cascade, every pane drawn and lit: 242, 200, 113, 128
 *                     (683; built from the counts, sets/windowCalendar COMMITS); the count label sets in lower right.
 *                     The camera (moving since 'Nearly') cranes up with the 13 October leading edge and pulls back to
 *                     the 53-storey wide (one storey ~ 11 px), the old block now the tower's plinth.
 *   9.55 everyHour    the 24-hour clock on the 13 October column's crown (it rides up with that column's leading edge)
 *                     has lit every hour mark: each mark lights when the first pane committed in that hour (Pacific
 *                     time) lights. The hours are the repo's own (git log, author dates -0700, 13 and 14 October:
 *                     the 13th covers 07-23, the 14th 00-23 bar 11; all 24 are lit by the end of the 14th's column).
 *   hold              the blazing tower, the clock fully lit, rim embers on the window frames.
 * No figure in any pane. One saturated accent: the lit panes (the lamps on the far kerb stay dim and low).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import {
  FONT,
  LAYERS,
    chapterCard,
  defineShot,
  drawTracked,
  legibleSize,
  measureTracked,
  mixLab,
  moon,
  placeStamp,
  skyline,
  softPlate,
  textProbe,
  textRole,
  textSwap,
  toLayer,
  toScreen,
  withAlpha,
} from '../../../film';
import { CAL, COMMITS, DAYS, paneRect, windowCalendar, type Day } from '../sets/windowCalendar';
import { clamp01, seg, sm, smr } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch09-s01';

// ---------------------------------------------------------------- the building (canonical placement)
const BASE = { x: 640, y: 690 };
const P = CAL.pane + CAL.gap;
const COL_W = CAL.cols * P - CAL.gap;
const MAIN_W = 5 * COL_W + 4 * CAL.pier + 2 * CAL.pier;
const MAIN_TOP = BASE.y - CAL.storeys * P - CAL.pier;
const TOWER_BASE = MAIN_TOP - CAL.pier * 0.6;
const STOREYS: Record<Day, number> = { d13: Math.ceil(COMMITS.d13 / 6), d14: Math.ceil(COMMITS.d14 / 6), d15: Math.ceil(COMMITS.d15 / 6), d16: Math.ceil(COMMITS.d16 / 6) };
/** the left edge of a day column (its first pane's x) */
const dayX = (d: Day) => paneRect(d, 0, BASE).x;
const DAY_LABEL: Record<Day, string> = { d13: '13', d14: '14', d15: '15', d16: '16' };

/**
 * Commits per hour (Pacific time, the author dates' own zone) on 13 and 14 October 2026, from the repo's git log; the
 * panes fill in commit order, so the k-th pane of a day lit = that day's k-th commit, and its hour is known.
 */
const HOURS13: [number, number][] = [[7, 3], [8, 24], [9, 31], [10, 33], [11, 20], [12, 31], [13, 17], [14, 10], [15, 5], [16, 1], [17, 9], [18, 19], [19, 6], [20, 14], [21, 10], [22, 8], [23, 1]];
const HOURS14: [number, number][] = [[0, 1], [1, 2], [2, 15], [3, 6], [4, 18], [5, 20], [6, 14], [7, 17], [8, 14], [9, 3], [10, 6], [12, 8], [13, 5], [14, 6], [15, 5], [16, 9], [17, 7], [18, 15], [19, 10], [20, 4], [21, 2], [22, 12], [23, 1]];
/** the index of the first pane of each hour in a day's column */
const firstPaneOfHour = (rows: [number, number][]) => {
  const out = new Map<number, number>();
  let acc = 0;
  for (const [h, n] of rows) {
    out.set(h, acc);
    acc += n;
  }
  return out;
};
const FIRST13 = firstPaneOfHour(HOURS13);
const FIRST14 = firstPaneOfHour(HOURS14);

// ---------------------------------------------------------------- the cascade schedule (shot-local seconds)
interface Beats {
  D: number;
  october: number;
  count: number;
  four: number;
  everyHour: number;
  nearly: number;
}
/** each day column's cascade: start, end (s after 'four'); the 13th is the longest and leads the camera */
const CASCADE: Record<Day, [number, number]> = { d13: [0, 1.6], d14: [0.1, 1.18], d15: [0.18, 0.9], d16: [0.24, 1.02] };
/** the pace inside a cascade: brisk at first, settling at the crown (relay run) */
const runE = (u: number) => 1 - Math.pow(1 - clamp01(u), 1.5);
const runInv = (e: number) => 1 - Math.pow(1 - clamp01(e), 1 / 1.5);
function litCount(d: Day, t: number, b: Beats): number {
  const [s, e] = CASCADE[d];
  const u = (t - (b.four + s)) / (e - s);
  if (u <= 0) return 0;
  return Math.min(COMMITS[d], Math.floor(runE(u) * COMMITS[d] + 1e-6));
}
/** when pane i of day d lights */
function paneLitAt(d: Day, i: number, b: Beats): number {
  const [s, e] = CASCADE[d];
  return b.four + s + runInv((i + 1) / COMMITS[d]) * (e - s);
}
/** when each of the 24 hour marks lights: the first pane of that hour, on whichever of the two days lights it first */
function hourLitTimes(b: Beats): number[] {
  const out: number[] = [];
  for (let h = 0; h < 24; h++) {
    const a = FIRST13.has(h) ? paneLitAt('d13', FIRST13.get(h)!, b) : Infinity;
    const c = FIRST14.has(h) ? paneLitAt('d14', FIRST14.get(h)!, b) : Infinity;
    out.push(Math.min(a, c));
  }
  return out;
}
/** October 1-12: six single panes, one by one (one every 0.3 s from just before 'October') */
const octAt = (i: number, b: Beats) => b.october - 0.12 + i * 0.3;
/**
 * where October's six lit panes sit: scattered down the column (storeys 1, 3, 5, 7, 9, 11, each in a different
 * window of its storey), so they read as six separate days of work and never as July's packed bottom row
 */
const OCT_PANES = [
  [1, 2],
  [3, 4],
  [5, 1],
  [7, 3],
  [9, 5],
  [11, 0],
].map(([storey, k]) => storey * CAL.cols + k);

// ---------------------------------------------------------------- camera
/** action-plane scale k centred on world (x, y): dolly to k 1.2, lens beyond (as ch03-s01 frames the building) */
function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}
/** the wide on the block alone (~42 % of frame height), sky above it for the chapter card; a 3 % drift */
const W0 = { x: 640, y: 612, k: 2.28 };
const W1 = { x: 644, y: 606, k: 2.36 };
/** the 53-storey wide: the tower fills the frame height, the old block its plinth (one storey ~10 px) */
const WF = { x: 642, y: 384, k: 1.05 };
/** the clock's top over the 13th's leading edge, for n lit panes (continuous) */
const CLOCK_R = 24;
const clockTopAt = (n: number) => {
  const shell = Math.min(STOREYS.d13, n / 6 + 1);
  return TOWER_BASE - shell * P - (n >= COMMITS.d13 ? 12 : 2) - 7 - 2 * CLOCK_R - 3;
};
/** a smooth min (blend width r) so the follow constraint takes over without a kink */
const smin = (a: number, b: number, r: number) => {
  const h = clamp01(0.5 + (0.5 * (b - a)) / r);
  return b + (a - b) * h - r * h * (1 - h);
};
/**
 * The crane: still on the block until 'Nearly', then one long move (log zoom 2.36 -> 1.05) up and back to the wide,
 * drifting a little left mid-move so the lower-left stamp stays clear of the block; during the cascade it is held
 * to the 13 October leading edge: the clock's top never rises above 40 px from the frame's top.
 */
function camAt(t: number, b: Beats): Camera3 {
  const t1 = b.nearly + 0.1, t2 = b.four + 2.1;
  if (t <= t1) {
    const u = clamp01(t / t1);
    return camK(W0.x + (W1.x - W0.x) * u, W0.y + (W1.y - W0.y) * u, W0.k + (W1.k - W0.k) * u);
  }
  const u = smr((t - t1) / (t2 - t1));
  const k = Math.exp(Math.log(W1.k) + (Math.log(WF.k) - Math.log(W1.k)) * u);
  const x = W1.x + (WF.x - W1.x) * u - 72 * Math.sin(Math.PI * u);
  const yKey = W1.y + (WF.y - W1.y) * u;
  const n13 = t < b.four ? 0 : runE((t - b.four - CASCADE.d13[0]) / (CASCADE.d13[1] - CASCADE.d13[0])) * COMMITS.d13;
  const yMax = clockTopAt(n13) + 320 / k;
  // the last move: a slow 3.5 % push onto the clock (scaled about the dial, so it stays put while the frame closes in)
  const p = seg(t, 9.6, b.D);
  const s = 1 + 0.035 * p;
  const cy0 = smin(yKey, yMax, 30);
  return camK(CLOCK_X + (x - CLOCK_X) / s, CLOCK_Y + (cy0 - CLOCK_Y) / s, k * s);
}
/** the finished clock's centre (L4 world) */
const CLOCK_X = paneRect('d13', 0, BASE).x + COL_W / 2;
const CLOCK_Y = TOWER_BASE - STOREYS.d13 * P - 12 - 7 - CLOCK_R;

// ---------------------------------------------------------------- layer placements (world px of each layer)
const MOON = toLayer(LAYERS.L1, camK(WF.x, WF.y, WF.k), 236, 112);

export default defineShot({
  id: ID,
  mood: 'emberRed',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      october: T.beat('october'),
      count: T.beat('count'),
      four: T.beat('fourDays'),
      everyHour: T.beat('everyHour'),
      nearly: T.word('L0902', 'Nearly'),
    };
    return { tl, b, hours: hourLitTimes(b) };
  },
  paint(f, _s, sc) {
    const { b, hours } = sc;
    const t = f.t;
    const cam = camAt(t, b);
    f.camera(cam);
    f.backlight({ sunX: 700, sunY: 420, intensity: 0.92 });

    // ---------------- L1: a far city deep in the haze, and the moon
    f.layer('L1', (c, env) => {
      f.cached(`${ID}/L1/${env.mood.id}`, 2000, 700, (cc) => {
        cc.translate(360, -380);
        skyline(cc, { style: 'megacity', x0: -360, x1: 1640, y: 700, height: 230, seed: 909, lit: 0.015, ground: 380, role: 'set' }, env);
      })(c, -360, 380);
      moon(c, { x: MOON.x, y: MOON.y, r: 26, phase: 0.62, halo: 0.55 }, env);
    });
    // ---------------- L2: dark neighbouring blocks, all asleep
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 2000, 800, (cc) => {
        cc.translate(360, -360);
        // a farther, paler skyline behind the neighbours: half-dissolved in the haze (the crane's middle plane)
        cc.save();
        cc.globalAlpha = 0.5;
        skyline(cc, { style: 'chicago1940', x0: -360, x1: 1640, y: 640, height: 300, seed: 917, lit: 0, ground: 420, role: 'set' }, env);
        cc.restore();
        neighbours(cc, env);
      })(c, -360, 360);
    });
    // haze sheet A drifting across the lower third (in front of the far blocks, behind the kerb lamps)
    f.fog({ yCenter: 560, height: 230, alpha: 0.25, drift: 9 });
    // ---------------- L3: the far kerb's two street lamps (dim, low)
    f.layer('L3', (c, env) => {
      f.cached(`${ID}/L3/${env.mood.id}`, 1900, 420, (cc) => {
        cc.translate(300, -540);
        farKerb(cc, env);
      })(c, -300, 540);
    });
    for (const [x, s] of LAMPS3) f.practical({ x, y: LAMP3_Y, kind: 'lamp', seed: s, intensity: 0.42, radius: 40, layer: 'L3' });
    f.fog('B');

    // ---------------- L4: the street, the building, the annexe, the clock
    const lit = {
      d13: litCount('d13', t, b),
      d14: litCount('d14', t, b),
      d15: litCount('d15', t, b),
      d16: litCount('d16', t, b),
    };
    const octN = [0, 1, 2, 3, 4, 5].filter((i) => t >= octAt(i, b)).length;
    const kAct = toScreen(LAYERS.L4, cam, 0, 0).k;
    f.layer('L4', (c, env) => {
      street(f, c, env);
      windowCalendar(f, c, env, {
        x: BASE.x,
        y: BASE.y,
        fill: { jun: 1, jul: 1, aug: 0, sep: 1, oct: 0 },
        snow: true,
        labels: 0,
        warm: 0.85,
        key: ID,
      });
      octoberPanes(c, env, octN);
      monthLabels(c, env, 1 - seg(t, b.count - 0.25, b.count + 0.2), textSwap(t, b.four - 0.1, 0.45));
      octoberFlash(c, env, t, b);
      octoberSeam(c, env, t, b, octN);
      tower(c, env, t, b, lit);
      // the day numbers leave in the last beat (the crossfade carries the next shot's card through where they sit)
      dayLabels(c, env, seg(t, b.four - 0.05, b.four + 0.45) * (1 - seg(t, b.D - 0.95, b.D - 0.55)));
      clock(c, env, t, b, lit.d13, hours, kAct);
    });
    f.rim({ x: 0.2, y: -1 });
    // the blaze: additive warmth over the lit annexe (its own light, not a global glow)
    f.layer('L4', (c, env) => blaze(c, env, lit, t, b));

    // ---------------- L5: the near kerb and its railing (soft); drops out of frame as the camera cranes up
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 1900, 1300, (cc) => {
        cc.translate(300, 200);
        nearKerb(cc, env);
      })(c, -300, -200);
    });
    // the near lamp's head: a dim practical (its own seed), so the post reads as a lamp and not a matte line
    f.practical({ x: LAMP5.x, y: LAMP5.y + 10, kind: 'lamp', seed: 977, intensity: 0.5, radius: 46, layer: 'L5' });

    // ---------------- type (screen-locked)
    const tenv = { t, mood: f.mood, seed: 901 };
    chapterCard(f.c, { number: 9, title: 'Four Days in October', x: 318, y: 152, size: 50, at: 0.1, dur: b.october - 0.15, fade: 0.6 }, tenv);
    placeStamp(f.c, { place: 'October 2026', date: '689 commits', style: 'mono', x: 52, y: 610, at: b.count - 0.1, fade: 0.5 }, tenv);
    countsLabel(f, t, b);
  },
});

// ---------------------------------------------------------------- painters
/** L2: dark neighbouring blocks either side of the street, unlit, water tanks and stair towers (L2 world px) */
function neighbours(c: C2, env: PaintEnv) {
  c.fillStyle = env.fill('set');
  const blocks: [number, number, number][] = [
    [-360, -120, 210],
    [-120, 110, 300],
    [110, 290, 240],
    [290, 470, 330],
    [840, 1000, 270],
    [1000, 1190, 340],
    [1190, 1400, 230],
    [1400, 1640, 290],
  ];
  const G = 760;
  for (const [x0, x1, h] of blocks) {
    c.fillRect(x0, G - h, x1 - x0, h + 600);
    // parapet and a cornice step
    c.fillRect(x0 - 4, G - h - 6, x1 - x0 + 8, 6);
  }
  // a water tank on legs and a stair tower
  const tank = (x: number, y: number) => {
    c.fillRect(x - 18, y - 46, 36, 32);
    c.beginPath();
    c.moveTo(x - 20, y - 46);
    c.lineTo(x, y - 60);
    c.lineTo(x + 20, y - 46);
    c.fill();
    c.fillRect(x - 15, y - 14, 3, 14);
    c.fillRect(x + 12, y - 14, 3, 14);
  };
  tank(10, G - 300);
  tank(1100, G - 340);
  c.fillRect(360, G - 362, 40, 32);
  c.fillRect(1460, G - 320, 56, 30);
  // a top-only rim on the parapets (the backlight above)
  c.strokeStyle = withAlpha(env.mood.rim, 0.16);
  c.lineWidth = 1.2;
  c.beginPath();
  for (const [x0, x1, h] of blocks) {
    c.moveTo(x0 - 4, G - h - 6);
    c.lineTo(x1 + 4, G - h - 6);
  }
  c.stroke();
}

/** the near lamp's lantern (L5 world px): at the post, its head about 180 px from the top of the final wide */
const LAMP5 = { x: 203, y: Math.round(toLayer(LAYERS.L5, camK(WF.x, WF.y, WF.k * 1.035), 240, 180).y) };

/** L3: the far kerb: a low wall and two street lamps (L3 world px; the lamps' heads at LAMP3_Y) */
const LAMP3_Y = 586;
const LAMPS3: [number, number][] = [[392, 71], [902, 73]];
function farKerb(c: C2, env: PaintEnv) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  for (const [x] of LAMPS3) {
    c.fillRect(x - 2.5, LAMP3_Y, 5, 140);
    c.beginPath();
    c.moveTo(x - 9, LAMP3_Y + 2);
    c.lineTo(x + 9, LAMP3_Y + 2);
    c.lineTo(x + 5, LAMP3_Y - 10);
    c.lineTo(x - 5, LAMP3_Y - 10);
    c.closePath();
    c.fill();
    c.fillRect(x - 6, LAMP3_Y + 128, 12, 10);
  }
  // a low kerb wall either side of the building's street
  c.fillRect(-300, 718, 760, 18);
  c.fillRect(820, 718, 780, 18);
}

/** L4: the street in front of the building (dark, a wet sheen of the panes' light on it) */
function street(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/street/${env.mood.id}`, 3000, 700, (cc) => {
    cc.translate(1180, -BASE.y);
    cc.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.25);
    cc.fillRect(-1180, BASE.y, 3000, 700);
    // the kerb line in front of the building, rimmed on top
    cc.fillStyle = env.fill('ink');
    cc.fillRect(-1180, BASE.y + 22, 3000, 6);
    cc.strokeStyle = withAlpha(env.mood.rim, 0.22);
    cc.lineWidth = 1;
    cc.beginPath();
    cc.moveTo(-1180, BASE.y + 22);
    cc.lineTo(1820, BASE.y + 22);
    cc.stroke();
    // a faint sheen of the building's light on the street
    const g = cc.createLinearGradient(0, BASE.y, 0, BASE.y + 60);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.16));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    cc.fillStyle = g;
    cc.fillRect(BASE.x - MAIN_W / 2 - 20, BASE.y, MAIN_W + 40, 60);
  })(c, -1180, BASE.y);
}

/**
 * month names under the main block (world text). June..September fade before the camera pulls back; October's stays
 * at 0.7 for the whole shot, so in the wide the eye can still find the column the annexe grows from.
 */
function monthLabels(c: C2, env: PaintEnv, a: number, side: { in: number; out: number }) {
  const names: [string, number][] = [['June', 0], ['July', 1], ['August', 2], ['September', 3], ['October', 4]];
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `italic 500 14px ${FONT.display}`, 14);
    c.font = `italic 500 ${size}px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    const left = BASE.x - MAIN_W / 2 + CAL.pier;
    for (const [n, i] of names) {
      const ai = i === 4 ? Math.max(0.7, 0.88 * a) * side.out : 0.88 * a;
      if (ai <= 0.01) continue;
      const x = left + i * (COL_W + CAL.pier) + COL_W / 2;
      c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, i === 4 ? 0.62 : 0.5), ai);
      c.fillText(n, x, BASE.y + 4);
      textProbe(c, `${ID}-m${i}`, x - 30, BASE.y + 4, 60, size, ai);
    }
    // in the wide the foot drops into the bottom band: October's name moves to the block's right flank, level with
    // its column's middle, a short tick pointing back at the column
    if (side.in > 0.01) {
      const sx = BASE.x + MAIN_W / 2 + 7;
      const sy = BASE.y - CAL.pier - (CAL.storeys * P) / 2;
      const sz = legibleSize(c, `italic 500 14px ${FONT.display}`, 14);
      c.font = `italic 500 ${sz}px ${FONT.display}`;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.62), 0.8 * side.in);
      c.fillRect(sx, sy - 0.4, 6, 0.9);
      c.fillText('October', sx + 9, sy);
      textProbe(c, `${ID}-oct-side`, sx + 9, sy - sz / 2, sz * 3.6, sz, 0.8 * side.in);
    }
    c.restore();
  });
}

/** October 1-12's six lit panes (scattered down the column), a shade warmer than the rest of the block, each with a
 * small steady halo: October is the column the annexe grows out of */
function octoberPanes(c: C2, env: PaintEnv, n: number) {
  const hot = mixLab(paneHot(env), '#ffd9a0', 0.35);
  for (let i = 0; i < n; i++) {
    const r = paneRect('oct', OCT_PANES[i], BASE);
    c.fillStyle = hot;
    c.fillRect(r.x, r.y, r.w, r.h);
  }
  if (n <= 0) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const r = paneRect('oct', OCT_PANES[i], BASE);
    const g = c.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 0, r.x + r.w / 2, r.y + r.h / 2, 11);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.32));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(r.x - 11, r.y - 11, r.w + 22, r.h + 22);
  }
  c.restore();
}

/**
 * The seam: on 'four' a thin rim-lit line runs from October's top lit pane up through the parapet and then along the
 * annexe's foot under all four day columns (right to left, October first), so the annexe visibly grows out of
 * October's column. It stays lit, faint, for the rest of the shot.
 */
function octoberSeam(c: C2, env: PaintEnv, t: number, b: Beats, n: number) {
  if (n < 6) return;
  const u = seg(t, b.four - 0.3, b.four + 0.35);
  if (u <= 0) return;
  const top = paneRect('oct', OCT_PANES[5], BASE);
  const xo = paneRect('oct', 5, BASE).x + CAL.pane + CAL.pier * 0.5; // October's right-hand pier
  const y0 = top.y + top.h / 2;
  const y1 = TOWER_BASE + 1.5;
  const xl = dayX('d13') - CAL.pier * 0.5;
  const vLen = y0 - y1;
  const hLen = xo - xl;
  const L = (vLen + hLen) * u;
  const col = mixLab(env.mood.core, '#fff1cf', 0.25);
  const pulse = 1 - 0.55 * seg(t, b.four + 0.35, b.four + 1.6);
  c.save();
  c.lineCap = 'round';
  for (const [w, a] of [[5, 0.16], [1.4, 0.85]] as const) {
    c.strokeStyle = withAlpha(col, a * pulse);
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(top.x + top.w, y0);
    c.lineTo(xo, y0);
    c.lineTo(xo, y0 - Math.min(L, vLen));
    if (L > vLen) c.lineTo(xo - Math.min(L - vLen, hLen), y1);
    c.stroke();
  }
  c.restore();
}

/** October's six panes for 1-12 October: each lights warm with a brief hot flash and a small bloom */
function octoberFlash(c: C2, env: PaintEnv, t: number, b: Beats) {
  for (let i = 0; i < 6; i++) {
    const at = octAt(i, b);
    const u = (t - at) / 0.5;
    if (u < 0 || u > 1) continue;
    const r = paneRect('oct', OCT_PANES[i], BASE);
    const k = 1 - u;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 0, r.x + r.w / 2, r.y + r.h / 2, 18);
    g.addColorStop(0, withAlpha(env.mood.core, 0.6 * k));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(r.x - 18, r.y - 18, r.w + 36, r.h + 36);
    c.restore();
  }
}

const paneLit = (env: PaintEnv) => mixLab(mixLab(env.mood.rim, '#f2c27a', 0.85), env.mood.core, 0.3);
const paneHot = (env: PaintEnv) => mixLab(paneLit(env), '#fff1cf', 0.35);
const paneDark = (env: PaintEnv) => mixLab(env.fill('ink'), env.mood.set, 0.35);

/**
 * The annexe: four day-columns rising from the roof over July..October. Each column's black card rises a storey
 * ahead of its own lit panes (the building grows as the commits land) and stops at its own height: 41, 34, 19, 22.
 * Every pane is one commit, drawn and lit in commit order, bottom-up, six to a storey.
 */
function tower(c: C2, env: PaintEnv, t: number, b: Beats, lit: Record<Day, number>) {
  const ink = env.fill('ink');
  const dark = paneDark(env);
  const L = paneLit(env), H = paneHot(env);
  for (const d of DAYS) {
    const n = lit[d];
    if (t < b.four + CASCADE[d][0] - 0.05) continue;
    const full = STOREYS[d];
    const shell = Math.min(full, Math.ceil(n / 6) + 1);
    const x0 = dayX(d) - CAL.pier * 0.5;
    const top = TOWER_BASE - shell * P - (shell === full ? 8 : 2);
    c.fillStyle = ink;
    c.fillRect(x0, top, COL_W + CAL.pier, TOWER_BASE - top + 6);
    // a cornice on a finished column
    if (shell === full) c.fillRect(x0 - 3, top - 4, COL_W + CAL.pier + 6, 5);
    // unlit glass for the slots above the lit panes
    c.fillStyle = dark;
    for (let i = n; i < shell * 6; i++) {
      const r = paneRect(d, i, BASE);
      c.fillRect(r.x, r.y, r.w, r.h);
    }
    for (let i = 0; i < n; i++) {
      const r = paneRect(d, i, BASE);
      const age = t - paneLitAt(d, i, b);
      c.fillStyle = age < 0.14 ? '#fff4da' : (i * 11) % 7 === 0 ? H : L;
      c.fillRect(r.x, r.y, r.w, r.h);
    }
    // rim embers: the window frames' top edges catch the backlight on the finished storeys
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x0, top);
    c.lineTo(x0 + COL_W + CAL.pier, top);
    c.stroke();
  }
}

/** the day numbers at the columns' feet: on the main block's top storey (unlit black glass under every day column) */
function dayLabels(c: C2, env: PaintEnv, a: number) {
  if (a <= 0.01) return;
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `600 15px ${FONT.mono}`, 15);
    c.font = `600 ${size}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const y = paneRect('jul', 66, BASE).y + CAL.pane / 2 + 0.5;
    for (const d of DAYS) {
      const x = dayX(d) + COL_W / 2;
      c.fillStyle = withAlpha(env.fill('ink'), 0.9 * a);
      c.fillRect(x - COL_W / 2 + 2, y - size * 0.62, COL_W - 4, size * 1.2);
      c.fillStyle = withAlpha(mixLab(env.mood.core, '#fff1cf', 0.2), a);
      c.fillText(DAY_LABEL[d], x, y);
      textProbe(c, `${ID}-d${d}`, x - COL_W / 2, y - size * 0.6, COL_W, size * 1.2, a);
    }
    c.restore();
  });
}

/**
 * The clock on the 13 October column's crown: a 24-hour dial on a short mast that rides up with the column's leading
 * edge; each hour mark lights (with a small flare) when the first commit made in that hour lights its pane.
 */
function clock(c: C2, env: PaintEnv, t: number, b: Beats, n13: number, hours: number[], kAct: number) {
  const appear = seg(t, b.four - 0.05, b.four + 0.3);
  if (appear <= 0) return;
  const full = STOREYS.d13;
  const shell = Math.min(full, Math.ceil(n13 / 6) + 1);
  const top = TOWER_BASE - shell * P - (shell === full ? 12 : 2);
  const R = CLOCK_R;
  const cx = dayX('d13') + COL_W / 2;
  const cy = top - 7 - R;
  const ink = env.fill('ink');
  c.save();
  c.globalAlpha = appear;
  // the mast and its bracket
  c.fillStyle = ink;
  c.fillRect(cx - 2, cy + R - 2, 4, top - (cy + R) + 3);
  c.fillRect(cx - 9, top - 3, 18, 4);
  // the case
  c.beginPath();
  c.arc(cx, cy, R + 3, 0, Math.PI * 2);
  c.fill();
  // the face: dark glass that warms as the marks light
  const nLit = hours.filter((h) => t >= h).length;
  c.fillStyle = mixLab(paneDark(env), env.mood.halo, 0.1 + 0.25 * (nLit / 24));
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.fill();
  // 24 marks; the hour marks of 0, 6, 12, 18 longer
  const dev = Math.max(1, kAct);
  for (let h = 0; h < 24; h++) {
    const a = -Math.PI / 2 + (h / 24) * Math.PI * 2;
    const on = t >= hours[h];
    const len = h % 6 === 0 ? 6 : 4;
    const r0 = R - 1.5 - len, r1 = R - 1.5;
    c.strokeStyle = on ? (t - hours[h] < 0.18 ? '#fff4da' : paneLit(env)) : withAlpha(env.mood.rim, 0.28);
    c.lineWidth = (on ? 2.4 : 1.4) * Math.min(1.2, 1.6 / dev + 0.5);
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    c.stroke();
  }
  // the hub
  c.fillStyle = ink;
  c.beginPath();
  c.arc(cx, cy, 2.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // each mark's flare as it lights, and the whole face's glow once every hour is lit
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let h = 0; h < 24; h++) {
    const u = (t - hours[h]) / 0.35;
    if (u < 0 || u > 1) continue;
    const a = -Math.PI / 2 + (h / 24) * Math.PI * 2;
    const x = cx + Math.cos(a) * (R - 4), y = cy + Math.sin(a) * (R - 4);
    const g = c.createRadialGradient(x, y, 0, x, y, 9);
    g.addColorStop(0, withAlpha(env.mood.core, 0.7 * (1 - u)));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - 9, y - 9, 18, 18);
  }
  const all = seg(t, b.everyHour - 0.05, b.everyHour + 0.8) * (nLit === 24 ? 1 : 0);
  if (all > 0) {
    const g = c.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 2.6);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.32 * all));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(cx - R * 3, cy - R * 3, R * 6, R * 6);
  }
  c.restore();
}

/** the annexe's own light: a soft additive bloom over each column in proportion to its lit panes */
function blaze(c: C2, env: PaintEnv, lit: Record<Day, number>, t: number, b: Beats) {
  if (t < b.four) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const d of DAYS) {
    const n = lit[d];
    if (n <= 0) continue;
    const h = Math.ceil(n / 6) * P;
    const x = dayX(d) + COL_W / 2;
    const yc = TOWER_BASE - h / 2;
    const w = COL_W * 1.9;
    c.save();
    c.translate(x, yc);
    c.scale(w / Math.max(h, 1), 1);
    const r = Math.max(h, 1) * 0.62;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
    const k = 0.2 * Math.min(1, n / 60);
    g.addColorStop(0, withAlpha(env.mood.halo, k));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(-r, -r, 2 * r, 2 * r);
    c.restore();
  }
  c.restore();
}

/**
 * L5: the near kerb (its top at L5 y 880, the opening's lower edge) with two bollards, and a lamp post on the left
 * that rises through the whole frame and slides in from the left during the crane (L5 world px; soft). The kerb drops out of frame as the camera cranes up.
 */
function nearKerb(c: C2, env: PaintEnv) {
  const fg = env.fill('fg');
  c.fillStyle = fg;
  c.fillRect(-300, 880, 1900, 220);
  for (const x of [600, 760]) {
    c.fillRect(x - 7, 850, 14, 34);
    c.beginPath();
    c.ellipse(x, 850, 7, 4, 0, 0, Math.PI * 2);
    c.fill();
  }
  // the lamp post: a tapered shaft with a collar, ending in a lantern head on a short swan-neck bracket
  const hx = LAMP5.x, hy = LAMP5.y;
  c.beginPath();
  c.moveTo(196, 890);
  c.lineTo(199.5, hy + 40);
  c.lineTo(206.5, hy + 40);
  c.lineTo(210, 890);
  c.closePath();
  c.fill();
  c.fillRect(192, 600, 22, 7);
  c.fillRect(193, 830, 20, 60);
  // finial collar and the lantern: a cap, a glazed body (a hole, so the glow reads through it), a drip pan
  c.fillRect(197, hy + 34, 12, 8);
  c.beginPath();
  c.moveTo(hx - 15, hy - 4);
  c.lineTo(hx, hy - 20);
  c.lineTo(hx + 15, hy - 4);
  c.closePath();
  c.fill();
  c.fillRect(hx - 2, hy - 28, 4, 9);
  c.beginPath();
  c.moveTo(hx - 12, hy - 4);
  c.lineTo(hx + 12, hy - 4);
  c.lineTo(hx + 8, hy + 26);
  c.lineTo(hx - 8, hy + 26);
  c.closePath();
  c.moveTo(hx - 8, hy);
  c.lineTo(hx - 5.5, hy + 22);
  c.lineTo(hx + 5.5, hy + 22);
  c.lineTo(hx + 8, hy);
  c.closePath();
  c.fill('evenodd');
  c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffe2b0', 0.4), 0.55);
  c.beginPath();
  c.moveTo(hx - 8, hy);
  c.lineTo(hx - 5.5, hy + 22);
  c.lineTo(hx + 5.5, hy + 22);
  c.lineTo(hx + 8, hy);
  c.closePath();
  c.fill();
  c.fillStyle = fg;
  c.fillRect(hx - 10, hy + 26, 20, 4);
  c.fillRect(hx - 3, hy + 30, 6, 10);
  c.strokeStyle = withAlpha(env.mood.rim, 0.2);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-300, 880);
  c.lineTo(1600, 880);
  c.moveTo(206.5, hy + 40);
  c.lineTo(209.5, 830);
  c.stroke();
}

/** the four day counts, upper right in the sky (screen-locked; the tower rises clear of it), from 'four' to the end */
function countsLabel(f: Frame, t: number, b: Beats) {
  const a = seg(t, b.four + 0.05, b.four + 0.6);
  if (a <= 0) return;
  const c = f.c;
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `500 18.5px ${FONT.mono}`, 18.5);
    const o = { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.08, align: 'right' as const };
    const text = '242 · 200 · 113 · 128';
    const w = measureTracked(c, text, o);
    c.globalAlpha = a;
    softPlate(c, 1228 - w / 2, 80, w + 150, size + 64, f.mood.ink, 0.45);
    c.fillStyle = mixLab('#efe3cf', f.mood.core, 0.2);
    drawTracked(c, text, 1228 - (1 - sm(a)) * -10, 86, o);
    // the thin index rule with a tick, as the date stamp draws it
    c.globalAlpha = a * 0.6;
    c.fillRect(1228 - w * a, 86 + 12, w * a, 0.8);
    c.fillRect(1228 - 0.8, 86 + 8, 0.8, 8);
    textProbe(c, `${ID}-counts`, 1228 - w, 86 - size, w, size * 1.2, a);
    c.restore();
  });
}

