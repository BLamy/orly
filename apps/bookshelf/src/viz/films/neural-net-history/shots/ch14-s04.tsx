/**
 * ch14-s04 — one idea on two shores. A shuttered window on the left bank hides a spooling scroll of working notes
 * (only the answer slides out); then an open paper lantern from the right bank carries its notes and recipe in plain
 * view; a week later the left bank's ticker-strip tears and falls (winterBlue; 20.92 s; in: cut).
 *
 *   shutter    0.3        left bank, Sept 2024: high in a tower, a tall shuttered window; behind its slats, in
 *                         silhouette only, a long scroll of scratch paper begins to spool between two rollers
 *   longer     'longer'   the scroll spools faster; the o1 label sets in under the window
 *   reward     'reward'   one crisp typed answer line slides out under the sill; a small brass check-stamp drops on it
 *   hidden     'hidden'   the slats close tight: only the answer shows; the scroll's shadow still moves behind
 *   hall       'Then'     pan across the water to the right bank, 20 Jan 2025: far off, one lit window in a formal
 *                         hall, a long table of officials, one small generic figure among them; date stamp, name card
 *   lantern    'recipe'   at the water's edge below, the R1 lantern is set on the water: translucent, the same scroll
 *                         inside in plain view, a recipe card tied to its handle
 *   rightstone 'all'      it drifts past the jetty's end; a hand from the right shore sets a second stone
 *   tear       'week'     cut to the left bank, 27 Jan: the tall ticker-strip hanging from a tower begins to tear
 *   fall       'fell'     it drops in one long fall; a chip silhouette on the bank dims; hold on the torn end swinging
 * No red anywhere: the drop is carried by the falling banner and its label. TEXT RULE: the o1 label (gone with the
 * pan) and the Nvidia label, besides stamps and the name card. WINDOW RULE (sets/ch14-s01-strait).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import type { Frame, LayerSpec } from '../../../film';
import { FONT, LAYERS, MOODS, defineShot, mixLab, nameCard, placeStamp, toLayer, toScreen, withAlpha } from '../../../film';
import { STONES, boardPoint, clamp01, h01, lerp, monoLabel, monotone, sm, stoneHand, strait, tq12, win, windowFrame } from '../sets/ch14-s01-strait';
import { ruleFence } from '../sets/ch14-s02-fence';

const ID = 'ch14-s04';
type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

/** the left bank's towers (L3): T1 with the shuttered window, T2 with the ticker banner */
const T1 = { x0: 186, x1: 304, top: 52, base: 456 } as const;
const WIN = { x: 245, y: 150, w: 58, h: 94 } as const;
const T2 = { x0: -96, x1: 10, top: 34, base: 456 } as const;
const BANNER = { x: -43, top: 66, bot: 418, w: 42 } as const;
const CHIP: P = { x: 330, y: 456 };
/** the right bank's formal hall (L3) and its one lit window */
const HALL = { x0: 960, x1: 1196, top: 302, base: 456 } as const;
const HWIN = { x: 1072, y: 360, w: 104, h: 44 } as const;
/** the R1 lantern floats on the water beyond the jetty's end: its base on this L3 line */
const LANTERN_Y = 471;
/** camera coordinate that puts an L3 world coordinate w at screen coordinate sc with lens k (same for x and y) */
function camL3(w: number, sc: number, k: number, c0 = 640) {
  // screen = c0 + (w − c0)·k − (cam − c0)·k·ZA/z
  return c0 + ((w - c0) * k - (sc - c0)) / ((k * 1000) / LAYERS.L3.z);
}
/** a warm that both shores' lit windows share (identical warmth) */
const WARM = mixLab(MOODS.candleAmber.halo, MOODS.candleAmber.core, 0.5);

interface B {
  D: number;
  shutter: number;
  longer: number;
  reward: number;
  hidden: number;
  hall: number;
  lantern: number;
  all: number;
  tear: number;
  fall: number;
  cut: number;
  panEnd: number;
  /** lantern drift: set on the water at lx0 (below the hall), level with the jetty's end (lx1) on 'all' */
  lx0: number;
  lx1: number;
  lx2: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  camA: (t: number) => Camera3;
  [k: string]: unknown;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      shutter: T.beat('shutter'),
      longer: T.beat('longer'),
      reward: T.beat('reward'),
      hidden: T.beat('hidden'),
      hall: T.beat('hall'),
      lantern: T.beat('lantern'),
      all: T.beat('rightstone'),
      tear: T.beat('tear'),
      fall: T.beat('fall'),
      cut: T.beat('tear') - 0.06,
      panEnd: T.beat('hall') + 2.0,
      lx0: 0,
      lx1: 0,
      lx2: 0,
    };
    // part 1 (window) → the pan on 'Then' → part 2 (hall, lantern, jetty); part 3 after the cut is its own frame.
    // Keys are framings of L3 points (where the towers and the hall stand): [t, world x, world y, screen x, screen y, lens]
    const p0 = b.hall - 0.35;
    const keys: [number, number, number, number, number, number][] = [
      // part 1: a slow push (≈ 6%) with a slight drift, so the window is never a still picture
      [0, WIN.x, WIN.y + 20, 586, 304, 2.2],
      [p0, WIN.x, WIN.y + 20, 548, 292, 2.34],
      [b.panEnd, 846, 420, 640, 360, 1.3],
      [b.cut, 862, 416, 640, 360, 1.36],
    ];
    const fx = monotone(keys.map((k) => [k[0], camL3(k[1], k[3], k[5])]));
    const fy = monotone(keys.map((k) => [k[0], camL3(k[2], k[4], k[5], 360)]));
    const fl = monotone(keys.map((k) => [k[0], Math.log(k[5])]));
    const camA = (t: number): Camera3 => ({ x: fx(t), y: fy(t), z: 0, lens: Math.exp(fl(t)) });
    // the lantern's path in L3 world, from where it must sit on screen: set below the hall's left corner, level with
    // the jetty's end (screen x ≈ 320) on 'all', drifting on a little after
    b.lx0 = HALL.x0 - 22;
    b.lx1 = toLayer(LAYERS.L3, camA(b.all), 262, 400).x;
    b.lx2 = toLayer(LAYERS.L3, camA(b.cut), 205, 400).x;
    tl.hold(0, D);
    return { tl, b, camA };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const tq = tq12(t);
    const part3 = t >= b.cut;
    const u3 = sm((t - b.cut) / (b.D - b.cut));
    const l3 = lerp(1.6, 1.7, u3);
    const cam: Camera3 = part3 ? { x: camL3(BANNER.x + 60, 470 + 10 * u3, l3), y: camL3(250, 340, l3, 360), z: 0, lens: l3 } : sc.camA(t);
    f.camera(cam);
    const uStone = (tq - (b.all - 0.02)) / 0.82;
    const stones: Array<[number, number, 'b' | 'w']> = [STONES.r1, STONES.l1];
    if (uStone >= 0.5) stones.push(STONES.r2);
    strait(f, {
      key: 'ch14',
      moodKey: 'winterBlue',
      sunX: 640,
      sunI: 0.55,
      stones,
      l3back: (c, env) => {
        ruleFence(c, env, { rise: () => 1, light: 0.6 });
        if (!part3) lantern(c, env, t, b);
      },
      l3: (c, env) => {
        tower2(c, env, t, b);
        tower1(c, env, t, b);
        chipSign(c, env, t, b);
        hall(c, env, t, b);
        if (uStone > 0 && uStone < 1) stoneHand(c, env, { side: 1, u: uStone, target: boardPoint(STONES.r2[0], STONES.r2[1]), col: 'b', len: 34 });
      },
    });
    // practicals behind the action plane: the hall's window, the lantern's flame, the shuttered window's light
    if (!part3 && t > b.lantern - 0.2) {
      const lp = lanternPos(t, b);
      f.practical({ x: lp.x, y: lp.y - 24, kind: 'candle', seed: 1425, intensity: 0.6 * win(t, b.lantern - 0.2, b.lantern + 0.4), radius: 20, layer: 'L3' });
    }
    // part 1's near plane: a dark parapet across the bottom of the frame; it slides away left with the pan
    if (!part3) nearParapet(f, t, b);
    windowFrame(f, {});
    // type
    const env = { t, mood: f.mood };
    if (!part3) {
      const ls = toScreen(LAYERS.L3, cam, WIN.x, WIN.y + WIN.h / 2 + 64);
      const a = win(t, b.longer, b.longer + 0.5) * (1 - win(t, b.hall + 0.6, b.hall + 1.3));
      monoLabel(f.c, f.mood, 'SEP 2024 · OPENAI o1', ls.x, ls.y + 26, { a, size: 18.5 });
      monoLabel(f.c, f.mood, 'LONG CHAIN OF THOUGHT, HIDDEN BY DESIGN', ls.x, ls.y + 54, { a, size: 18.5 });
      placeStamp(f.c, { place: '20 January 2025', date: 'Premier’s symposium', year: 2025, x: 104, y: 664, at: b.hall + 0.5, dur: b.cut - b.hall - 0.5, fade: 0.3 }, env);
      nameCard(f.c, { name: 'Liang Wenfeng', role: 'founder of DeepSeek', align: 'right', x: 1176, y: 214, at: b.hall + 1.2, dur: Math.min(3.6, b.cut - b.hall - 1.3), fade: 0.4 }, env);
    } else {
      monoLabel(f.c, f.mood, '27 JANUARY 2025', 104, 664, { align: 'left', a: win(t, b.tear + 0.1, b.tear + 0.5), size: 18.5 });
      monoLabel(f.c, f.mood, 'NVIDIA −17% · −$589B · RECORD 1-DAY LOSS FOR A US FIRM', 760, 92, { a: win(t, b.tear + 0.15, b.tear + 0.65), size: 18.5 });
    }
  },
});

// =====================================================================================================  left bank
/** T1: a tall tower with a stepped crown; high in it the shuttered window (its light identical to the right bank's) */
function tower1(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  c.save();
  c.fillStyle = nearInk(env);
  c.beginPath();
  c.rect(T1.x0, T1.top, T1.x1 - T1.x0, T1.base - T1.top);
  c.rect(T1.x0 + 16, T1.top - 16, T1.x1 - T1.x0 - 32, 17);
  c.rect(T1.x0 + 38, T1.top - 34, T1.x1 - T1.x0 - 76, 19);
  c.fill();
  // rimmed on top only
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(T1.x0, T1.top - 0.6, 16, 1.2);
  c.fillRect(T1.x1 - 16, T1.top - 0.6, 16, 1.2);
  c.fillRect(T1.x0 + 16, T1.top - 16.6, 22, 1.2);
  c.fillRect(T1.x1 - 38, T1.top - 16.6, 22, 1.2);
  c.fillRect(T1.x0 + 38, T1.top - 34.6, T1.x1 - T1.x0 - 76, 1.2);
  // a few ordinary lit windows lower down (the same light as every window on both shores)
  c.fillStyle = withAlpha(mixLab(m.core, m.halo, 0.25), 0.5);
  for (let j = 0; j < 12; j++)
    for (let i = 0; i < 7; i++) {
      if (h01(i + j * 17, 403) < 0.62) continue;
      c.fillRect(T1.x0 + 12 + i * 15, 230 + j * 18, 4, 7);
    }
  c.restore();
  shutteredWindow(c, env, t, b);
}

/** the shuttered window: lit interior, the spooling scroll in silhouette, the slats (open → closed on 'hidden'), the
 *  sill, the answer line sliding out under it and the brass check-stamp */
function shutteredWindow(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const tq = tq12(t);
  const x0 = WIN.x - WIN.w / 2, y0 = WIN.y - WIN.h / 2;
  // frame and reveal
  c.fillStyle = env.fill('ink');
  c.fillRect(x0 - 6, y0 - 6, WIN.w + 12, WIN.h + 12);
  // the lit room behind
  const room = c.createLinearGradient(0, y0, 0, y0 + WIN.h);
  room.addColorStop(0, withAlpha(WARM, 0.9));
  room.addColorStop(1, withAlpha(mixLab(WARM, m.halo, 0.4), 0.95));
  c.save();
  c.beginPath();
  c.rect(x0, y0, WIN.w, WIN.h);
  c.clip();
  c.fillStyle = room;
  c.fillRect(x0, y0, WIN.w, WIN.h);
  // the scroll: two dark rollers standing at the window's inner left and right edges, a pale band of scratch paper
  // running between them, ink-line ticks of working scrolling across it (fast after 'longer')
  const speed = lerp(16, 64, win(t, b.longer - 0.2, b.longer + 0.6));
  const off = t * 16 + Math.max(0, t - b.longer) * (speed - 16);
  const band = { y0: WIN.y - 17, y1: WIN.y + 17 };
  const rx = [x0 + 6, x0 + WIN.w - 6];
  const drawBand = (alpha: number) => {
    c.save();
    c.globalAlpha *= alpha;
    c.fillStyle = mixLab('#f1e9d8', WARM, 0.25);
    c.fillRect(rx[0], band.y0, rx[1] - rx[0], band.y1 - band.y0);
    c.fillStyle = withAlpha(m.ink, 0.72);
    for (let r = 0; r < 5; r++) {
      const y = band.y0 + 5 + r * 6;
      for (let k = 0; k < 12; k++) {
        const w = 2.5 + 7 * h01(k + r * 29, 911);
        const x = rx[0] + 3 + ((((k * 11.3 - off + r * 7) % 60) + 60) % 60);
        if (x + w > rx[1] - 3) continue;
        c.fillRect(x, y, w, 1.5);
      }
    }
    c.restore();
  };
  drawBand(1);
  c.fillStyle = mixLab(m.ink, '#000000', 0.2);
  for (const x of rx) {
    c.beginPath();
    c.roundRect(x - 5, band.y0 - 9, 10, band.y1 - band.y0 + 18, 4);
    c.fill();
  }
  // slats: half open (the paper band reads between them) → closed tight on 'hidden' (on twos)
  const close = sm((tq - (b.hidden - 0.08)) / 0.5);
  const n = 10;
  const pitch = WIN.h / n;
  for (let i = 0; i < n; i++) {
    const y = y0 + i * pitch;
    const th = lerp(pitch * 0.5, pitch - 0.35, close);
    c.fillStyle = nearInk(env);
    c.fillRect(x0, y + (pitch - th) / 2, WIN.w, th);
    c.fillStyle = withAlpha(m.rim, 0.25);
    c.fillRect(x0, y + (pitch - th) / 2, WIN.w, 0.6);
  }
  // closed: the band's moving shadow still shows through the slats
  if (close > 0.5) drawBand(0.25 * (close - 0.5) * 2);
  c.restore();
  // mullion, sill, the light spilling under it
  c.fillStyle = env.fill('ink');
  c.fillRect(WIN.x - 1.5, y0, 3, WIN.h);
  c.fillRect(x0 - 10, y0 + WIN.h + 4, WIN.w + 20, 6);
  const sillY = y0 + WIN.h + 10;
  // the answer line: out under the sill on 'reward', a paper slip with one crisp typed line
  const ua = sm((tq - (b.reward - 0.15)) / 0.45);
  if (ua > 0) {
    const slipW = 56, slipH = 15 * ua;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const pool = c.createRadialGradient(WIN.x, sillY + 8, 0, WIN.x, sillY + 8, 60);
    pool.addColorStop(0, withAlpha(WARM, 0.22));
    pool.addColorStop(1, withAlpha(WARM, 0));
    c.fillStyle = pool;
    c.fillRect(WIN.x - 60, sillY - 20, 120, 90);
    c.restore();
    c.fillStyle = mixLab(m.rim, '#f1e8d6', 0.5);
    c.fillRect(WIN.x - slipW / 2, sillY, slipW, slipH);
    if (ua > 0.6) {
      c.fillStyle = withAlpha(m.ink, 0.85);
      for (let k = 0; k < 6; k++) c.fillRect(WIN.x - slipW / 2 + 5 + k * 7.6, sillY + slipH - 7, 5 + (k % 2) * 1.5, 1.6);
    }
    // the brass check-stamp drops onto it, lifts away, leaving the mark
    const us = (tq - (b.reward + 0.35)) / 0.7;
    if (us > 0) {
      const brass = mixLab(MOODS.candleAmber.halo, '#c9a14a', 0.5);
      if (us < 1) {
        const y = sillY - 40 + 46 * (us < 0.45 ? sm(us / 0.45) : 1 - sm((us - 0.6) / 0.4) * 0.9);
        c.fillStyle = env.fill('ink');
        c.fillRect(WIN.x + 14, y - 16, 5, 12);
        c.fillStyle = brass;
        c.fillRect(WIN.x + 10, y - 5, 13, 5);
      }
      if (us > 0.42) {
        c.strokeStyle = brass;
        c.lineWidth = 1.6;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(WIN.x + 12, sillY + 6);
        c.lineTo(WIN.x + 15.5, sillY + 10);
        c.lineTo(WIN.x + 22, sillY + 2.5);
        c.stroke();
      }
    }
  }
}

/** T2: the tower with the ticker banner; on 'week' the strip tears, on 'fell' it drops in one long fall */
function tower2(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const tq = tq12(t);
  // a tower like its neighbours: near-black ink, a stepped crown and mast, a grid of lit windows (same warmth)
  c.fillStyle = nearInk(env);
  c.fillRect(T2.x0, T2.top, T2.x1 - T2.x0, T2.base - T2.top);
  c.fillRect(T2.x0 + 12, T2.top - 14, T2.x1 - T2.x0 - 24, 15);
  c.fillRect(T2.x0 + 30, T2.top - 30, 46, 17);
  c.fillRect(T2.x0 + 51, T2.top - 62, 4, 33);
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(T2.x0, T2.top - 0.6, 12, 1.2);
  c.fillRect(T2.x1 - 12, T2.top - 0.6, 12, 1.2);
  c.fillRect(T2.x0 + 30, T2.top - 30.6, 46, 1.2);
  c.fillStyle = withAlpha(WARM, 0.5);
  for (let j = 0; j < 22; j++)
    for (let i = 0; i < 7; i++) {
      if (h01(i + j * 13, 404) < 0.6) continue;
      c.fillRect(T2.x0 + 8 + i * 14, T2.top + 14 + j * 18, 4, 7);
    }
  c.fillStyle = env.fill('ink');
  c.fillRect(BANNER.x - BANNER.w / 2 - 8, BANNER.top - 6, BANNER.w + 16, 5);
  // the banner: a long ticker tape of paper, marks running down it
  const tearY = BANNER.top + 46;
  const tear = clamp01((tq - b.tear) / 1.25);
  const fallU = Math.max(0, tq - b.fall);
  const paper = mixLab(m.rim, '#e9e2d4', 0.35);
  const swing = fallU > 0 ? 0.16 * Math.exp(-fallU * 0.55) * Math.sin(fallU * 2.6) : 0.01 * Math.sin(tq * 0.9);
  // the stub that stays (swinging after the fall)
  c.save();
  c.translate(BANNER.x, BANNER.top);
  c.rotate(swing);
  tape(c, env, paper, 0, fallU > 0 ? tearY - BANNER.top : BANNER.bot - BANNER.top, 0, fallU > 0, tear);
  c.restore();
  // the falling length: accelerating, fluttering, gone below the bank
  if (fallU > 0) {
    const y = 0.5 * 520 * fallU * fallU + 40 * fallU;
    if (y < 900) {
      c.save();
      c.translate(BANNER.x + 6 * Math.sin(fallU * 3), tearY + y);
      c.rotate(0.06 * Math.sin(fallU * 4) + 0.04 * fallU);
      tape(c, env, paper, 0, BANNER.bot - tearY, tearY - BANNER.top, true, 1, true);
      c.restore();
    }
  }
}
/** a length of ticker tape from y = 0 to len (local), its marks offset by `from` so they continue across the tear */
function tape(c: C, env: PaintEnv, paper: string, y0: number, len: number, from: number, torn: boolean, tear: number, isLower = false) {
  const m = env.mood;
  const w = BANNER.w;
  c.fillStyle = paper;
  c.beginPath();
  if (!isLower) {
    c.moveTo(-w / 2, y0);
    c.lineTo(w / 2, y0);
    if (torn) {
      c.lineTo(w / 2, len - 2);
      for (let i = 6; i >= 0; i--) c.lineTo(-w / 2 + (w * i) / 6, len + (i % 2 ? 3 : -2));
    } else {
      c.lineTo(w / 2, len);
      c.lineTo(-w / 2, len);
    }
  } else {
    for (let i = 0; i <= 6; i++) c.lineTo(-w / 2 + (w * i) / 6, y0 + (i % 2 ? 3 : -2));
    c.lineTo(w / 2, len);
    c.lineTo(-w / 2, len);
  }
  c.closePath();
  c.fill();
  // ticker marks: up/down ticks and price bars (abstract; no figures)
  c.fillStyle = withAlpha(m.ink, 0.62);
  for (let y = 12; y < len - 6; y += 13) {
    const k = Math.floor((y + from) / 13);
    const up = h01(k, 505) > 0.5;
    c.beginPath();
    if (up) {
      c.moveTo(-w / 2 + 6, y + 4);
      c.lineTo(-w / 2 + 10, y - 1);
      c.lineTo(-w / 2 + 14, y + 4);
    } else {
      c.moveTo(-w / 2 + 6, y - 1);
      c.lineTo(-w / 2 + 10, y + 4);
      c.lineTo(-w / 2 + 14, y - 1);
    }
    c.fill();
    c.fillRect(-w / 2 + 18, y + 0.5, 6 + 12 * h01(k, 506), 2);
  }
  // the tear opening on the stub: a notch growing across the width
  if (!isLower && !torn && tear > 0) {
    const ty = 46;
    c.fillStyle = mixLab(m.set, m.haze, 0.3);
    c.beginPath();
    c.moveTo(w / 2 + 1, ty - 1.8);
    for (let i = 0; i <= 8; i++) {
      const x = w / 2 - w * tear * (i / 8);
      c.lineTo(x, ty + (i % 2 ? 1.6 : -1.6));
    }
    c.lineTo(w / 2 - w * tear, ty + 1.8);
    c.lineTo(w / 2 + 1, ty + 1.8);
    c.closePath();
    c.fill();
  }
}

/** a chip silhouette standing on the bank like a sign; its lit edge dims as the strip falls */
function chipSign(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const lit = 1 - 0.85 * win(t, b.fall, b.fall + 1.4);
  const s = 34;
  c.save();
  c.translate(CHIP.x, CHIP.y - s / 2 - 10);
  c.fillStyle = env.fill('ink');
  c.fillRect(-2, s / 2, 4, 10);
  c.fillRect(-s / 2, -s / 2, s, s);
  for (let k = 0; k < 6; k++) {
    const o = -s / 2 + 4 + k * 5.4;
    c.fillRect(o, -s / 2 - 4, 2.4, 4);
    c.fillRect(o, s / 2, 2.4, 4);
    c.fillRect(-s / 2 - 4, o, 4, 2.4);
    c.fillRect(s / 2, o, 4, 2.4);
  }
  c.fillStyle = withAlpha(WARM, 0.55 * lit);
  c.fillRect(-s / 2 + 7, -s / 2 + 7, s - 14, s - 14);
  c.fillStyle = withAlpha(m.ink, 0.9);
  c.fillRect(-s / 2 + 10, -s / 2 + 10, s - 20, s - 20);
  c.restore();
}

// =====================================================================================================  right bank
/** the formal hall: a low colonnaded block; one lit window, a long table of officials, one small figure apart */
function hall(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  c.save();
  c.fillStyle = nearInk(env);
  c.fillRect(HALL.x0, HALL.top, HALL.x1 - HALL.x0, HALL.base - HALL.top);
  // cornice, a shallow roof, the colonnade's piers
  c.fillRect(HALL.x0 - 8, HALL.top - 6, HALL.x1 - HALL.x0 + 16, 7);
  c.beginPath();
  c.moveTo(HALL.x0 - 4, HALL.top - 6);
  c.lineTo((HALL.x0 + HALL.x1) / 2, HALL.top - 30);
  c.lineTo(HALL.x1 + 4, HALL.top - 6);
  c.fill();
  c.fillStyle = withAlpha(m.rim, 0.12);
  for (let x = HALL.x0 + 12; x < HALL.x1 - 6; x += 22) c.fillRect(x, HALL.top + 64, 1, HALL.base - HALL.top - 70);
  // the one lit window
  const x0 = HWIN.x - HWIN.w / 2, y0 = HWIN.y - HWIN.h / 2;
  c.fillStyle = withAlpha(WARM, 0.88);
  c.fillRect(x0, y0, HWIN.w, HWIN.h);
  // the long table and the officials (heads and shoulders, all alike), one figure apart at the end (generic)
  const ink = mixLab(m.ink, m.set, 0.15);
  c.fillStyle = ink;
  c.fillRect(x0 + 8, y0 + HWIN.h - 12, HWIN.w - 30, 4);
  for (let i = 0; i < 7; i++) {
    const x = x0 + 14 + i * 10.5;
    bust(c, x, y0 + HWIN.h - 12, 1);
  }
  // the small generic figure (no likeness), a little apart at the table's head
  bust(c, x0 + HWIN.w - 9, y0 + HWIN.h - 9.5, 1.08);
  // window bars
  c.fillStyle = env.fill('set');
  c.fillRect(HWIN.x - 0.8, y0, 1.6, HWIN.h);
  c.fillRect(x0, HWIN.y - 0.6, HWIN.w, 1.2);
  // its light on the water below the hall
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) {
    c.fillStyle = withAlpha(WARM, 0.14 * (1 - i / 8));
    c.fillRect(HWIN.x - 20 + 3 * Math.sin(t * 1.3 + i), HALL.base + 6 + i * 4, 40 - i * 3, 1.2);
  }
  c.restore();
}
function bust(c: C, x: number, y: number, s: number) {
  c.beginPath();
  c.arc(x, y - 9 * s, 2.6 * s, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(x - 4 * s, y);
  c.quadraticCurveTo(x - 4 * s, y - 6 * s, x, y - 6 * s);
  c.quadraticCurveTo(x + 4 * s, y - 6 * s, x + 4 * s, y);
  c.closePath();
  c.fill();
}

function lanternPos(t: number, b: B): P {
  // pushed off from the bank, it drifts quickly at first and slows: level with the jetty's end on 'all'
  const u1 = clamp01((t - b.lantern) / Math.max(0.5, b.all - b.lantern));
  const x = t < b.all ? lerp(b.lx0, b.lx1, 1 - (1 - u1) * (1 - u1)) : lerp(b.lx1, b.lx2, clamp01((t - b.all) / Math.max(0.5, b.cut - b.all)));
  return { x, y: LANTERN_Y + 0.8 * Math.sin(t * 1.6) };
}
/** the R1 lantern: translucent paper over a light frame, standing ON the water (its reflection rippling under it), the
 *  working-notes scroll inside in plain view as a clear band of ink lines, a recipe card tied to its handle */
function lantern(c: C, env: PaintEnv, t: number, b: B) {
  if (t < b.lantern - 0.25) return;
  const m = env.mood;
  const tq = tq12(t);
  const p = lanternPos(tq, b);
  const set = sm((tq - (b.lantern - 0.25)) / 0.45);
  const S = 0.7;
  const W = 66 * S, H = 92 * S;
  const bob = 0.025 * Math.sin(tq * 1.4);
  c.save();
  c.translate(p.x, p.y - (1 - set) * 14);
  c.globalAlpha = set;
  // the reflection under it: the lit paper flipped, 35%, broken by the ripple
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) {
    const y = 2 + i * 3.2;
    const k = 1 - i / 12;
    c.fillStyle = withAlpha(WARM, 0.35 * k * k);
    c.fillRect(-W / 2 + 2 + 2.2 * Math.sin(t * 1.9 + i * 0.9), y, W - 4, 1.9);
  }
  c.restore();
  // the waterline: a dark lip and a ring of disturbed water
  c.strokeStyle = withAlpha(m.rim, 0.35);
  c.lineWidth = 0.8;
  c.beginPath();
  c.ellipse(0, 0.5, W * 0.62 + 2 * Math.sin(t * 1.2), 2.4, 0, 0, Math.PI * 2);
  c.stroke();
  c.rotate(bob);
  // the paper body: translucent (the strait shows through it), lit from within
  const body = c.createLinearGradient(0, -H, 0, 0);
  body.addColorStop(0, withAlpha(mixLab(WARM, '#f6ecd8', 0.45), 0.42));
  body.addColorStop(1, withAlpha(mixLab(WARM, m.halo, 0.25), 0.56));
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-W / 2, -H + 6);
  c.quadraticCurveTo(-W / 2 - 3, -H / 2, -W / 2, -1.5);
  c.lineTo(W / 2, -1.5);
  c.quadraticCurveTo(W / 2 + 3, -H / 2, W / 2, -H + 6);
  c.closePath();
  c.fill();
  // the frame: top and bottom rims, a few ribs
  c.fillStyle = env.fill('ink');
  c.fillRect(-W / 2 - 1.5, -H + 3, W + 3, 3.6);
  c.fillRect(-W / 2 - 1.5, -3, W + 3, 3.6);
  c.fillStyle = withAlpha(m.ink, 0.22);
  for (let k = 1; k < 4; k++) c.fillRect(-W / 2 + (W * k) / 4, -H + 7, 0.6, H - 10);
  // inside, in plain view: the same scroll, a clear pale band of ink lines between two rollers
  const by = -H * 0.75;
  c.fillStyle = withAlpha('#f6efe0', 0.85);
  c.fillRect(-W / 2 + 6, by - 6, W - 12, 12);
  c.fillStyle = withAlpha(m.ink, 0.75);
  for (const rx of [-W / 2 + 5, W / 2 - 5]) {
    c.beginPath();
    c.roundRect(rx - 2.2, by - 9, 4.4, 18, 2);
    c.fill();
  }
  const off = t * 14;
  c.fillStyle = withAlpha(m.ink, 0.7);
  for (let r = 0; r < 3; r++) {
    const y = by - 4 + r * 3.6;
    for (let k = 0; k < 7; k++) {
      const w = 2 + 5 * h01(k + r * 29, 911);
      const x = -W / 2 + 8 + ((((k * 7.1 - off + r * 4) % 30) + 30) % 30);
      if (x + w > W / 2 - 8) continue;
      c.fillRect(x, y, w, 1.1);
    }
  }
  // the lettering: R1 · OPEN WEIGHTS
  c.fillStyle = withAlpha(MOODS.parchment.ink, 0.92);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.font = `700 14px ${FONT.mono}`;
  c.fillText('R1', 0, -H * 0.43);
  c.font = `600 8.6px ${FONT.mono}`;
  c.fillText('OPEN', 0, -H * 0.43 + 10.5);
  c.fillText('WEIGHTS', 0, -H * 0.43 + 19.5);
  // the handle and the recipe card tied to it
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-W * 0.3, -H + 3);
  c.quadraticCurveTo(0, -H - 16, W * 0.3, -H + 3);
  c.stroke();
  const cy = -H - 2 + 1.5 * Math.sin(tq * 1.2);
  c.lineWidth = 0.5;
  c.beginPath();
  c.moveTo(W * 0.2, -H - 6);
  c.lineTo(W * 0.5 + 4, cy);
  c.stroke();
  c.save();
  c.translate(W * 0.5 + 4, cy);
  c.rotate(0.25 + 0.08 * Math.sin(tq * 1.2));
  c.fillStyle = mixLab(m.rim, '#f3ead8', 0.55);
  c.fillRect(-1, 0, 15, 10.5);
  c.fillStyle = withAlpha(m.ink, 0.6);
  for (let k = 0; k < 3; k++) c.fillRect(1.5, 2.6 + k * 2.6, 10 - k * 1.5, 0.7);
  c.restore();
  c.restore();
}

/** the near-black value every nearest building shares (one step lighter than nothing) */
function nearInk(env: PaintEnv) {
  return mixLab(env.mood.ink, env.fill('set'), 0.18);
}

/** part 1's near plane: a dark parapet with balusters across the bottom of the frame (screen-locked, blurred); it
 *  drifts with the push and slides out left, fast, on the pan (a near object's parallax) */
const PARAPET: LayerSpec = { id: 'ch14s04Near', z: Infinity, haze: 0, blur: 4 };
function nearParapet(f: Frame, t: number, b: B) {
  const pan = sm((t - (b.hall - 0.35)) / 1.6);
  if (pan >= 1) return;
  f.layer(PARAPET, (c, env) => {
    const m = env.mood;
    c.save();
    c.translate(-14 * (t / b.hall) - pan * 1500, 6 * (t / b.hall));
    c.fillStyle = mixLab(m.ink, '#000000', 0.35);
    c.fillRect(-40, 640, 1400, 18);
    c.fillRect(-40, 712, 1400, 30);
    for (let x = -20; x < 1380; x += 46) {
      c.beginPath();
      c.moveTo(x - 7, 658);
      c.quadraticCurveTo(x - 13, 685, x - 6, 712);
      c.lineTo(x + 6, 712);
      c.quadraticCurveTo(x + 13, 685, x + 7, 658);
      c.closePath();
      c.fill();
    }
    c.fillStyle = withAlpha(m.rim, 0.4);
    c.fillRect(-40, 639.4, 1400, 1.4);
    c.restore();
  });
}
