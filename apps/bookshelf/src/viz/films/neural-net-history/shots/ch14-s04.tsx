/**
 * ch14-s04 — one idea on two shores. A shuttered window on the left bank hides a spooling scroll of working notes
 * (only the answer slides out); then an open paper lantern from the right bank carries its notes and recipe in plain
 * view; a week later the left bank's ticker-strip tears and falls (winterBlue; 20.92 s; in: cut).
 *
 *   shutter    0.3        left bank, Sept 2024: high in a tower, a tall shuttered window; behind its slats, in
 *                         silhouette, a spool and a long paper strip running down (its perforations travelling); the
 *                         strip's loose end curls out through a slot under the sill and hangs down the tower
 *   longer     'longer'   the scroll spools faster and the hanging curl grows visibly longer; the o1 label sets in
 *                         in the sky right of the tower
 *   reward     'reward'   the answer slip slides out under the sill (3.40-4.0 s); the brass check-stamp lands by 4.0 s
 *   hidden     'hid'      the slats close tight and the hanging curl is drawn back in through the slot: only the
 *                         answer shows; light leaks through the slats and the strip's shadow keeps moving behind them;
 *                         the o1 label is gone 0.4 s before the pan
 *   hall       'Then'     pan across the water to the right bank and push in on the hall's tall lit window, 20 Jan
 *                         2025: a long table of seated officials (cast.delegate) and Liang Wenfeng (cast.liang) standing
 *                         at its head, rimmed by the hanging lamp; date stamp, name card
 *   lantern    'method'   at the water's edge below, the R1 lantern is set on the water: paper glowing from within,
 *                         the SAME scroll visible through it in plain view, a recipe card tied to its handle
 *   rightstone 'all'      it drifts past the jetty's end; a hand from the right shore sets a second stone
 *   tear       'week'     cut to the left bank, 27 Jan: the tall ticker-strip hanging from a tower begins to tear;
 *                         the Nvidia label is in beside the strip (leader line) by 'week' + 0.2 s
 *   fall       'fell'     it drops in one long fall; a chip silhouette on the bank dims; hold on the torn end swinging
 * No red anywhere: the drop is carried by the falling banner and its label. TEXT RULE: the o1 label (gone with the
 * pan) and the Nvidia label, besides stamps and the name card. WINDOW RULE (sets/ch14-s01-strait).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import type { Frame, LayerSpec } from '../../../film';
import { FONT, LAYERS, MOODS, POSES, PUPPET_NEAR_BLACK, defineShot, mixLab, nameCard, placeStamp, toLayer, withAlpha, withLife } from '../../../film';
import { cast } from '../cast';
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
/** review r1: a tall lit window, so the officials and Liang are puppets at a readable height (≥ 110 px on screen) */
const HWIN = { x: 1078, y: 364, w: 156, h: 92 } as const;
/** the hall's hanging lamp (its light keys the figures' rims) */
const HLAMP: P = { x: HWIN.x - 18, y: HWIN.y - HWIN.h / 2 + 12 };
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
      // (review r1: framed a little lower so the scroll's curl under the sill is in the picture)
      [0, WIN.x, WIN.y + 44, 560, 318, 2.15],
      [p0, WIN.x, WIN.y + 44, 530, 306, 2.26],
      // review r1: the pan lands pushed in on the hall's lit window (lens 1.55), so the name card has a person
      [b.panEnd, HWIN.x, HWIN.y, 800, 300, 1.55],
      // round 2: a slow push toward the jetty's end and the lantern as it is set on the water, so its lettering
      // (R1 · OPEN WEIGHTS) reads while 'weights … open to all' is spoken
      [b.lantern + 1.0, 600, 470, 360, 430, 1.5],
      [b.cut, 596, 470, 352, 430, 1.53],
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
      // the light inside the R1 lantern (review r1: it glows from within)
      f.practical({ x: lp.x, y: lp.y - LANT.h * 0.5, kind: 'lamp', seed: 1425, intensity: 0.7 * win(t, b.lantern - 0.2, b.lantern + 0.4), radius: 34, layer: 'L3' });
    }
    // part 1's near plane: a dark parapet across the bottom of the frame; it slides away left with the pan
    if (!part3) nearParapet(f, t, b);
    windowFrame(f, {});
    // type
    const env = { t, mood: f.mood };
    if (!part3) {
      // the o1 label sits in the sky right of the tower (screen-locked: part 1's camera barely moves) and is gone
      // 0.4 s BEFORE the pan starts, so it is never dragged off mid-read (its 'until: hall')
      const pan0 = b.hall - 0.35;
      const a = win(t, b.longer, b.longer + 0.5) * (1 - win(t, pan0 - 0.45, pan0 - 0.05));
      monoLabel(f.c, f.mood, 'SEP 2024 · OPENAI o1', 770, 238, { a, size: 18.5, align: 'left' });
      monoLabel(f.c, f.mood, 'LONG CHAIN OF THOUGHT,', 770, 272, { a, size: 18.5, align: 'left' });
      monoLabel(f.c, f.mood, 'HIDDEN BY DESIGN', 770, 300, { a, size: 18.5, align: 'left' });
      placeStamp(f.c, { place: '20 January 2025', date: 'Premier’s symposium', year: 2025, x: 104, y: 664, at: b.hall + 0.5, dur: b.cut - b.hall - 0.5, fade: 0.3 }, env);
      nameCard(f.c, { name: 'Liang Wenfeng', role: 'founder of DeepSeek', align: 'right', x: 1176, y: 140, at: b.hall + 1.2, dur: Math.min(3.6, b.cut - b.hall - 1.3), fade: 0.4 }, env);
    } else {
      monoLabel(f.c, f.mood, '27 JANUARY 2025', 104, 664, { align: 'left', a: win(t, b.tear - 0.05, b.tear + 0.2), size: 18.5 });
      // review r1: the Nvidia label sits NEXT TO the ticker strip it is about (left, x ≈ 470-800, y ≈ 80-130),
      // tied to the strip by a short leader, and is in by 'week' + 0.2 s
      const al = win(t, b.tear - 0.05, b.tear + 0.2);
      const sx = toScreenX(cam, BANNER.x + BANNER.w / 2 + 2);
      if (al > 0.003) {
        f.c.save();
        f.c.globalAlpha = al * 0.8;
        f.c.strokeStyle = mixLab('#e8e2d2', f.mood.rim, 0.3);
        f.c.lineWidth = 1;
        f.c.beginPath();
        f.c.moveTo(sx + 4, 104);
        f.c.lineTo(470, 104);
        f.c.stroke();
        f.c.fillStyle = f.c.strokeStyle;
        f.c.beginPath();
        f.c.arc(sx + 3, 104, 2.4, 0, Math.PI * 2);
        f.c.fill();
        f.c.restore();
      }
      monoLabel(f.c, f.mood, 'NVIDIA −17% · −$589B', 482, 98, { a: al, size: 18.5, align: 'left' });
      monoLabel(f.c, f.mood, 'RECORD 1-DAY LOSS FOR A US FIRM', 482, 128, { a: al, size: 18.5, align: 'left' });
    }
  },
});

/** screen x of an L3 world x under a lens-only camera (part 3: the strip's edge, for the label's leader) */
function toScreenX(cam: Camera3, wx: number) {
  const k = cam.lens;
  return 640 + (wx - 640) * k - (cam.x - 640) * ((k * 1000) / LAYERS.L3.z);
}

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

/** the working-notes scroll, the same on both shores (tower window and R1 lantern): a spool at the top, a long
 *  paper strip running down from it in SILHOUETTE against the light, its perforations and ruled ticks travelling
 *  down at `off` (px), a few loose coils gathering at the bottom. Drawn in local px: x0..x1 the opening, y0..y1. */
function scrollSilhouette(c: C, ink: string, light: string, o: { x0: number; x1: number; y0: number; y1: number; off: number; spin: number; coil: number; sx?: number; sw?: number }) {
  const sw = o.sw ?? 12;
  const sx = o.sx ?? o.x0 + (o.x1 - o.x0) * 0.42;
  const R = Math.min(9, (o.x1 - o.x0) * 0.16);
  const cy = o.y0 + R + 3;
  c.save();
  c.fillStyle = ink;
  // the spool (a disc with three spokes, turning) and its spindle bracket
  c.beginPath();
  c.arc(sx - sw / 2 + R * 0.2, cy, R, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = light;
  c.lineWidth = 0.9;
  c.beginPath();
  for (let k = 0; k < 3; k++) {
    const a = o.spin + (k * Math.PI * 2) / 3;
    c.moveTo(sx - sw / 2 + R * 0.2 + Math.cos(a) * 2, cy + Math.sin(a) * 2);
    c.lineTo(sx - sw / 2 + R * 0.2 + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2));
  }
  c.stroke();
  c.fillRect(o.x0, cy - 1, sx - o.x0, 2);
  // the strip, down from the spool's right side to the bottom
  c.fillRect(sx - sw / 2, cy, sw, o.y1 - cy);
  // its perforations (holes the light shows through), travelling down: the sense of spooling
  c.fillStyle = light;
  const pitch = 7;
  const ph = ((o.off % pitch) + pitch) % pitch;
  for (let y = cy + ph; y < o.y1 - 2; y += pitch) {
    c.fillRect(sx - sw / 2 + 1.6, y, 1.6, 2.4);
    c.fillRect(sx + sw / 2 - 3.2, y, 1.6, 2.4);
  }
  // loose coils gathering at the bottom (more of them as the run gets longer)
  c.strokeStyle = ink;
  c.lineWidth = 2.6;
  for (let k = 0; k < o.coil; k++) {
    const r = 5 + k * 1.6;
    c.beginPath();
    c.ellipse(sx + 4 + k * 1.2, o.y1 - r * 0.55, r, r * 0.55, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

/** the shuttered window: lit interior, the spooling scroll in silhouette behind the slats, the slats (open → closed
 *  on 'hid'), the sill; the strip's loose end curls out through a slot under the sill and hangs down the facade,
 *  growing visibly on 'longer' and drawn back in on 'hid'; the answer slip slides out and is stamped */
function shutteredWindow(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const tq = tq12(t);
  const x0 = WIN.x - WIN.w / 2, y0 = WIN.y - WIN.h / 2;
  // frame and reveal
  c.fillStyle = env.fill('ink');
  c.fillRect(x0 - 6, y0 - 6, WIN.w + 12, WIN.h + 12);
  const room = c.createLinearGradient(0, y0, 0, y0 + WIN.h);
  room.addColorStop(0, withAlpha(WARM, 0.92));
  room.addColorStop(1, withAlpha(mixLab(WARM, m.halo, 0.4), 0.96));
  // spooling speed: steady, then fast on 'longer'
  const speed = lerp(14, 70, win(t, b.longer - 0.2, b.longer + 0.6));
  const off = t * 14 + Math.max(0, t - b.longer) * (speed - 14);
  const strip = { sx: x0 + 20, sw: 13 };
  const sil = mixLab(m.ink, '#000000', 0.25);
  c.save();
  c.beginPath();
  c.rect(x0, y0, WIN.w, WIN.h);
  c.clip();
  c.fillStyle = room;
  c.fillRect(x0, y0, WIN.w, WIN.h);
  const coil = Math.round(1 + 3 * win(t, b.longer, b.reward + 1));
  scrollSilhouette(c, sil, withAlpha(WARM, 0.95), { x0, x1: x0 + WIN.w, y0, y1: y0 + WIN.h, off, spin: off / 9, coil, sx: strip.sx, sw: strip.sw });
  // slats: half open (the scroll reads between them) → closed tight on 'hid' (on twos)
  const close = sm((tq - (b.hidden - 0.08)) / 0.5);
  const n = 10;
  const pitch = WIN.h / n;
  for (let i = 0; i < n; i++) {
    const y = y0 + i * pitch;
    const th = lerp(pitch * 0.42, pitch - 0.35, close);
    c.fillStyle = nearInk(env);
    c.fillRect(x0, y + (pitch - th) / 2, WIN.w, th);
    c.fillStyle = withAlpha(m.rim, 0.25);
    c.fillRect(x0, y + (pitch - th) / 2, WIN.w, 0.6);
  }
  // closed: light leaks through the slats' seams and the strip's moving shadow still crosses them
  if (close > 0.3) {
    const k = sm((close - 0.3) / 0.7);
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(WARM, 0.3 * k);
    for (let i = 1; i < n; i++) c.fillRect(x0, y0 + i * pitch - 0.5, WIN.w, 1);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = withAlpha(sil, 0.55 * k);
    c.fillRect(strip.sx - strip.sw / 2, y0, strip.sw, WIN.h);
    const ph = ((off % 7) + 7) % 7;
    c.fillStyle = withAlpha(WARM, 0.22 * k);
    for (let y = y0 + ph; y < y0 + WIN.h; y += 7) c.fillRect(strip.sx - strip.sw / 2 + 1.6, y, strip.sw - 3.2, 1.2);
  }
  c.restore();
  // mullion, sill, the slot under it
  c.fillStyle = env.fill('ink');
  c.fillRect(WIN.x - 1.5, y0, 3, WIN.h);
  c.fillRect(x0 - 10, y0 + WIN.h + 4, WIN.w + 20, 6);
  c.fillStyle = withAlpha(m.rim, 0.35);
  c.fillRect(x0 - 10, y0 + WIN.h + 3.6, WIN.w + 20, 0.8);
  const sillY = y0 + WIN.h + 10;
  // the strip's loose end out through the slot, hanging down the tower in a long curl: it grows on 'longer' (the
  // notes get long), and on 'hid' it is drawn back in through the slot (hidden by design)
  const grow = 16 + 3 * t + 74 * sm((t - (b.longer - 0.1)) / 1.4) + 8 * Math.max(0, t - b.longer - 1.4);
  const retract = 1 - sm((tq - (b.hidden + 0.05)) / 0.8);
  const L = grow * retract;
  if (L > 0.5) hangingCurl(c, env, strip.sx, sillY - 1, L, off, t);
  // the answer line (review r1): out under the sill from 'reward' − 0.17 s over 0.6 s, a paper slip with one crisp
  // typed line; the brass check-stamp lands on it at ≈ 'reward' + 0.42 s
  const ua = sm((tq - (b.reward - 0.17)) / 0.6);
  if (ua > 0) {
    const slipW = 36, slipH = 16 * ua;
    const sx = WIN.x + 19;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const pool = c.createRadialGradient(sx, sillY + 8, 0, sx, sillY + 8, 50);
    pool.addColorStop(0, withAlpha(WARM, 0.22));
    pool.addColorStop(1, withAlpha(WARM, 0));
    c.fillStyle = pool;
    c.fillRect(sx - 50, sillY - 20, 100, 80);
    c.restore();
    c.fillStyle = mixLab(m.rim, '#f1e8d6', 0.5);
    c.fillRect(sx - slipW / 2, sillY, slipW, slipH);
    if (ua > 0.5) {
      c.fillStyle = withAlpha(m.ink, 0.85);
      for (let k = 0; k < 4; k++) c.fillRect(sx - slipW / 2 + 4 + k * 6.6, sillY + slipH - 7, 4.4 + (k % 2) * 1.5, 1.6);
    }
    const us = (tq - (b.reward + 0.1)) / 0.7;
    if (us > 0) {
      const brass = mixLab(MOODS.candleAmber.halo, '#c9a14a', 0.5);
      if (us < 1) {
        const y = sillY - 40 + 46 * (us < 0.45 ? sm(us / 0.45) : 1 - sm((us - 0.6) / 0.4) * 0.9);
        c.fillStyle = env.fill('ink');
        c.fillRect(sx + 6, y - 16, 5, 12);
        c.fillStyle = brass;
        c.fillRect(sx + 2, y - 5, 13, 5);
      }
      if (us > 0.42) {
        c.strokeStyle = brass;
        c.lineWidth = 1.6;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(sx + 5, sillY + 6);
        c.lineTo(sx + 8.5, sillY + 10);
        c.lineTo(sx + 15, sillY + 2.5);
        c.stroke();
      }
    }
  }
}

/** the scroll's loose end hanging down the facade from the sill slot: a paper strip in shadow (one step lighter than
 *  the tower), rim-lit on its sky side, ticks of writing travelling down it, ending in a loose curl */
function hangingCurl(c: C, env: PaintEnv, x: number, y: number, L: number, off: number, t: number) {
  const m = env.mood;
  const w = 9;
  const pts: P[] = [];
  const n = Math.max(2, Math.ceil(L / 4));
  for (let i = 0; i <= n; i++) {
    const v = (i / n) * L;
    pts.push({ x: x + 2.4 * Math.sin(v * 0.06 + t * 0.9) * Math.min(1, v / 30), y: y + v });
  }
  const end = pts[pts.length - 1];
  const paper = mixLab(mixLab(m.setHaze, '#d9d3c5', 0.32), m.set, 0.15);
  c.save();
  c.lineJoin = 'round';
  c.strokeStyle = paper;
  c.lineWidth = w;
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  // the curl: the strip rolls up on itself at its end
  const r = Math.min(8, 3 + L * 0.05);
  c.arc(end.x + r, end.y, r, Math.PI, Math.PI * 2.75, false);
  c.stroke();
  // writing ticks travelling down the strip (unreadable at this distance: the work, not its content)
  c.strokeStyle = withAlpha(m.ink, 0.5);
  c.lineWidth = 1;
  const ph = ((off % 6) + 6) % 6;
  c.beginPath();
  for (let v = ph + 3; v < L - 2; v += 6) {
    const p = pts[Math.min(pts.length - 1, Math.round((v / L) * n))];
    const ww = 2 + 3.5 * h01(Math.floor((v - off) / 6), 921);
    c.moveTo(p.x - w / 2 + 1.6, p.y);
    c.lineTo(p.x - w / 2 + 1.6 + ww, p.y);
  }
  c.stroke();
  // the sky side catches the rim
  c.strokeStyle = withAlpha(m.rim, 0.55);
  c.lineWidth = 0.7;
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x + w / 2, p.y) : c.moveTo(p.x + w / 2, p.y)));
  c.stroke();
  c.restore();
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
/** the formal hall: a low colonnaded block with one tall lit window. Inside (review r1: puppets, not pictograms): a
 *  long table of seated officials (cast.delegate, alike, generic) under a hanging lamp, and Liang Wenfeng
 *  (cast.liang) standing at the table's head, PUPPET_NEAR_BLACK, his edge rimmed toward the lamp */
function hall(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const tq = tq12(t);
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
  c.fillStyle = withAlpha(m.rim, 0.4);
  c.fillRect(HALL.x0 - 8, HALL.top - 6.5, HALL.x1 - HALL.x0 + 16, 0.9);
  c.fillStyle = withAlpha(m.rim, 0.12);
  for (let x = HALL.x0 + 12; x < HALL.x1 - 6; x += 22) if (x < HWIN.x - HWIN.w / 2 - 4 || x > HWIN.x + HWIN.w / 2 + 4) c.fillRect(x, HALL.top + 14, 1, HALL.base - HALL.top - 20);
  // the lit window
  const x0 = HWIN.x - HWIN.w / 2, y0 = HWIN.y - HWIN.h / 2, y1 = y0 + HWIN.h;
  c.save();
  c.beginPath();
  c.rect(x0, y0, HWIN.w, HWIN.h);
  c.clip();
  const room = c.createRadialGradient(HLAMP.x, HLAMP.y, 4, HLAMP.x, HLAMP.y, HWIN.w * 0.8);
  room.addColorStop(0, withAlpha(mixLab(WARM, '#fff3d6', 0.3), 0.96));
  room.addColorStop(1, withAlpha(mixLab(WARM, m.halo, 0.45), 0.9));
  c.fillStyle = room;
  c.fillRect(x0, y0, HWIN.w, HWIN.h);
  // the hanging lamp: a cord and a shade
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(HLAMP.x - 0.4, y0, 0.8, HLAMP.y - y0 - 3);
  c.beginPath();
  c.moveTo(HLAMP.x - 7, HLAMP.y + 1);
  c.lineTo(HLAMP.x - 2.5, HLAMP.y - 4);
  c.lineTo(HLAMP.x + 2.5, HLAMP.y - 4);
  c.lineTo(HLAMP.x + 7, HLAMP.y + 1);
  c.closePath();
  c.fill();
  // the seated officials along the table (all alike: generic), facing the head of the table
  const ink = PUPPET_NEAR_BLACK;
  const rimTo = (x: number) => ({ x: HLAMP.x - x, y: HLAMP.y - (y1 - 40) });
  for (let i = 0; i < 5; i++) {
    const x = x0 + 14 + i * 19;
    const n = Math.hypot(rimTo(x).x, rimTo(x).y) || 1;
    cast.delegate.draw(
      c,
      { x, y: y1 + 1, facing: 'right', pose: withLife(POSES.sit, tq, 50 + i), scale: 0.2, ink, light: { x: rimTo(x).x / n, y: rimTo(x).y / n, floor: 0 }, edgeRim: { x: rimTo(x).x / n, y: rimTo(x).y / n, px: 1.2, alpha: 0.5 } },
      env,
    );
  }
  // the long table: a dark top and a cloth to the floor (it hides the seated legs)
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, m.set, 0.12);
  c.fillRect(x0 + 2, y1 - 26, 104, 3.5);
  c.fillRect(x0 + 4, y1 - 23, 100, 23);
  c.fillStyle = withAlpha(mixLab(WARM, m.rim, 0.4), 0.6);
  c.fillRect(x0 + 2, y1 - 26.4, 104, 0.8);
  // Liang Wenfeng at the table's head, standing apart: the one figure the name card points to
  const lx = x0 + HWIN.w - 26;
  const nl = Math.hypot(HLAMP.x - lx, HLAMP.y - (y1 - 60)) || 1;
  const dir = { x: (HLAMP.x - lx) / nl, y: (HLAMP.y - (y1 - 60)) / nl };
  const lpose = withLife(t > b.hall + 1.2 ? POSES.present : POSES.stand, tq, 77);
  cast.liang.draw(c, { x: lx, y: y1 + 2, facing: 'left', pose: lpose, scale: 0.245, ink, light: { x: dir.x, y: dir.y, floor: 0 }, edgeRim: { x: dir.x, y: dir.y, px: 1.6, alpha: 0.75 } }, env);
  c.restore();
  // window frame bars (thin, so the figures read)
  c.fillStyle = nearInk(env);
  c.fillRect(x0 - 3, y0 - 3, HWIN.w + 6, 3);
  c.fillRect(x0 - 3, y1, HWIN.w + 6, 4);
  // its light on the water below the hall
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) {
    c.fillStyle = withAlpha(WARM, 0.14 * (1 - i / 8));
    c.fillRect(HWIN.x - 24 + 3 * Math.sin(t * 1.3 + i), HALL.base + 6 + i * 4, 48 - i * 3, 1.2);
  }
  c.restore();
}

function lanternPos(t: number, b: B): P {
  // pushed off from the bank, it drifts quickly at first and slows: level with the jetty's end on 'all'
  const u1 = clamp01((t - b.lantern) / Math.max(0.5, b.all - b.lantern));
  const x = t < b.all ? lerp(b.lx0, b.lx1, 1 - (1 - u1) * (1 - u1)) : lerp(b.lx1, b.lx2, clamp01((t - b.all) / Math.max(0.5, b.cut - b.all)));
  return { x, y: LANTERN_Y + 0.8 * Math.sin(t * 1.6) };
}
/** the R1 lantern (review r1): a paper lantern glowing FROM INSIDE (an f.practical at its centre), its paper
 *  translucent so the strait shows at its edges, and through it, in plain view, the same scroll as the shuttered
 *  tower's (spool, strip, perforations, coils) in silhouette; the recipe card tied to its handle. The picture
 *  says: the same notes, shown. */
function lantern(c: C, env: PaintEnv, t: number, b: B) {
  if (t < b.lantern - 0.25) return;
  const m = env.mood;
  const tq = tq12(t);
  const p = lanternPos(tq, b);
  const set = sm((tq - (b.lantern - 0.25)) / 0.45);
  const W = LANT.w, H = LANT.h;
  const bob = 0.025 * Math.sin(tq * 1.4);
  c.save();
  c.translate(p.x, p.y - (1 - set) * 14);
  c.globalAlpha = set;
  // the reflection under it: the lit paper flipped, broken by the ripple
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) {
    const y = 2 + i * 3.2;
    const k = 1 - i / 12;
    c.fillStyle = withAlpha(WARM, 0.3 * k * k);
    c.fillRect(-W / 2 + 2 + 2.2 * Math.sin(t * 1.9 + i * 0.9), y, W - 4, 1.9);
  }
  c.restore();
  c.strokeStyle = withAlpha(m.rim, 0.35);
  c.lineWidth = 0.8;
  c.beginPath();
  c.ellipse(0, 0.5, W * 0.62 + 2 * Math.sin(t * 1.2), 2.4, 0, 0, Math.PI * 2);
  c.stroke();
  c.rotate(bob);
  const body = new Path2D();
  body.moveTo(-W / 2 + 2, -H + 6);
  body.bezierCurveTo(-W / 2 - 6, -H * 0.7, -W / 2 - 6, -H * 0.3, -W / 2 + 2, -1.5);
  body.lineTo(W / 2 - 2, -1.5);
  body.bezierCurveTo(W / 2 + 6, -H * 0.3, W / 2 + 6, -H * 0.7, W / 2 - 2, -H + 6);
  body.closePath();
  // the paper, lit from within: bright at its heart, thinner toward the edges where the strait shows through
  const glow = c.createRadialGradient(0, -H * 0.5, 4, 0, -H * 0.5, W * 0.72);
  glow.addColorStop(0, withAlpha(mixLab(WARM, '#fff4d8', 0.5), 0.9));
  glow.addColorStop(0.6, withAlpha(mixLab(WARM, m.halo, 0.2), 0.6));
  glow.addColorStop(1, withAlpha(mixLab(WARM, m.halo, 0.5), 0.32));
  c.fillStyle = glow;
  c.fill(body);
  // inside, in plain view: the scroll, the same as the tower's, its silhouette softened by the paper
  c.save();
  c.clip(body);
  c.globalAlpha *= 0.82;
  const off = t * 22;
  scrollSilhouette(c, mixLab(m.ink, '#000000', 0.2), withAlpha(mixLab(WARM, '#fff4d8', 0.4), 1), { x0: -W / 2 + 6, x1: W / 2 - 6, y0: -H + 8, y1: -4, off, spin: off / 9, coil: 3, sx: -W / 2 + 24, sw: 11 });
  c.restore();
  // ribs of the frame, faint through the paper; the top and bottom rims
  c.strokeStyle = withAlpha(m.ink, 0.22);
  c.lineWidth = 0.6;
  c.beginPath();
  for (let k = 1; k < 6; k++) {
    const y = -H + 6 + ((H - 8) * k) / 6;
    c.moveTo(-W / 2 - 2, y);
    c.lineTo(W / 2 + 2, y);
  }
  c.stroke();
  c.fillStyle = env.fill('ink');
  c.fillRect(-W / 2 + 1, -H + 3, W - 2, 3.6);
  c.fillRect(-W / 2 + 1, -3, W - 2, 3.6);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(-W / 2 + 1, -H + 2.6, W - 2, 0.8);
  // its name, small, inked on the paper beside the scroll
  c.fillStyle = withAlpha(MOODS.parchment.ink, 0.78);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.font = `700 17px ${FONT.mono}`;
  c.fillText('R1', W * 0.22, -H * 0.6);
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
  c.fillStyle = mixLab(m.rim, '#f3ead8', 0.6);
  c.fillRect(-1, 0, 18, 12.5);
  c.fillStyle = withAlpha(mixLab(WARM, '#fff4d8', 0.4), 0.8);
  c.fillRect(-1, 0, 0.8, 12.5);
  c.fillStyle = withAlpha(m.ink, 0.6);
  for (let k = 0; k < 4; k++) c.fillRect(1.5, 2.4 + k * 2.4, 12 - k * 1.8, 0.7);
  c.restore();
  c.restore();
}
const LANT = { w: 64, h: 90 } as const;

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
