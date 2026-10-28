/**
 * ch06-s11 — THE K-SLOT RACK: filter into a fixed number of slots; every maximum needs a plan (scene, the clock room,
 * labGreen; cut in; 12.83 s).
 *   L0622 "Filtering too: each item counts its place, and a fixed rack takes the first three."
 *   L0623 "The desktop's Monitor window admits it: "Only 64 rows are drawn at a time.""
 *
 * Front-on at the K-SLOT RACK, an open dark rack against the clock room's round window: eight paper items in a row,
 * each with a small visibility lamp (lit 0 1 1 0 1 0 1 1); beneath them the running-count rail, drawn as the prefix
 * loom's threads in miniature (a Brent-Kung count: an up-sweep of pair sums, then a down-sweep that fills the gaps);
 * above them three slot frames; a brass capacity plate bolted to the rack shows the number 3.
 *
 * TEACHES, word by word:
 *   items (0.3)      the rack: eight items, their lamps, three empty slots
 *   each item (2.34) every item's lamp drops a thread into the rail at once
 *   counts (2.98)    the rail's threads light level by level and the running counts ink left to right: 0 1 2 2 3 3 4 5;
 *                    the equation card pins at the foot of the frame and stays through the pull-back
 *   three (5.92)     slot k takes the item where the count first reaches k + 1: items 1, 2 and 4 rise into the three
 *                    slots; the later visible items (counts 4 and 5) rise, meet the rack's stop bar and wait outside,
 *                    unplaced; the capacity plate warms
 *   Monitor (7.54)   the camera pulls back: behind the rack, HandwiredOS's Monitor window lights, its list a fixed rack
 *                    of 64 slots; on 'Only' its overflow line at the list's foot lights as a pale ruled line (the
 *                    words are spoken, not set)
 * Counts and placements are COMPUTED from the visibility pattern below, never typed.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { FONT, PUPPET_NEAR_BLACK, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { brassOf, cardPaper, clamp01, clockNear, clockRoom, ease5, inkCol, lerp, lw, paperSlip, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
import { OS_COLORS } from '../sets/circuit';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s11';

// ------------------------------------------------------------------ the data (script ch06-s11, PT18 / PT20)
const VIS = [0, 1, 1, 0, 1, 0, 1, 1];
const NI = VIS.length;
const K = 3;
/** running (inclusive) count of visible items */
const COUNT = VIS.reduce<number[]>((a, v, i) => (a.push((i ? a[i - 1] : 0) + v), a), []);
/** slot k takes the item where the count first reaches k + 1 */
const SLOT_ITEM = Array.from({ length: K }, (_, k) => COUNT.findIndex((c, i) => VIS[i] === 1 && c === k + 1));
/** visible items past the rack's capacity: they wait outside */
const WAITING = VIS.map((v, i) => (v && COUNT[i] > K ? i : -1)).filter((i) => i >= 0);
/** Brent-Kung count network for 8 items: [level, from, to] (up-sweep pair sums, then the down-sweep) */
const BK: [number, number, number][] = [
  [0, 0, 1], [0, 2, 3], [0, 4, 5], [0, 6, 7],
  [1, 1, 3], [1, 5, 7],
  [2, 3, 7],
  [3, 3, 5],
  [4, 1, 2], [4, 3, 4], [4, 5, 6],
];
const LEVELS = 5;

// ------------------------------------------------------------------ layout (L4 rest px): the rack
const RACK = { x: 150, y: 176, w: 640, h: 434 };
const ITEM = { x0: 211, pitch: 74, w: 54, h: 66, y: 392 };
const itemX = (i: number) => ITEM.x0 + i * ITEM.pitch;
const LAMP_Y = 336;
const SLOT = { y: 236, w: 66, h: 80, pitch: 92, x0: 378 };
const slotX = (k: number) => SLOT.x0 + k * SLOT.pitch;
const STOP_Y = 300;
const RAIL = { y0: 456, dy: 15 };
const COUNT_Y = 562;
const PLATE = { x: 706, y: 228, w: 58, h: 64 };

// the Monitor window behind (its own plane, rest px of that plane)
const MON: LayerSpec = { id: `${ID}-monitor`, z: 1600, haze: 0.1, blur: 0.8 };
const WIN = { x: 120, y: 40, w: 1040, h: 600 };
const LIST = { x: 820, y: 118, w: 312, h: 460, cols: 4, rows: 16 };

interface Beats {
  D: number;
  each: number;
  counts: number;
  three: number;
  monitor: number;
  only: number;
}

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      each: T.word('L0622', 'each'),
      counts: T.beat('counts'),
      three: T.beat('three'),
      monitor: T.beat('monitor'),
      only: T.word('L0623', 'Only'),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(cam(t, b));
    clockRoom(f, { key: ID, oculus: { x: 640, y: 300, r: 300 }, sunX: 640, sunY: 330, intensity: 0.95, bench: false, pad: 520 });
    const lit = seg(t, b.monitor - 0.1, b.monitor + 1.1);
    f.layer(MON, (c, env) => monitorWindow(f, c, env, t, lit, b));
    f.fog({ yCenter: 520, height: 260, alpha: 0.12, drift: 10 });
    f.practical({ x: 640, y: 120, kind: 'tube', seed: 71, intensity: 0.5, radius: 220, layer: 'L3' });
    f.layer('L4', (c, env) => {
      rack(f, c, env);
      rail(c, env, t, b);
      lamps(c, env, t, b);
      items(c, env, t, tq, b);
      counts(c, env, t, b);
      capacity(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    clockNear(f, { key: ID, lip: 760 });
    // screen-locked: the equation, pinned at the foot of the frame through the pull-back
    const scr = { mood: f.mood } as PaintEnv;
    paperSlip(f.c, scr, { lines: ['visible 0 1 1 0 1 0 1 1 → counts 0 1 2 2 3 3 4 5'], x: 640, y: 570, t, inkAt: b.counts + 0.35, font: 'mono', size: 23, id: `${ID}-eq`, pin: true, tint: 'card' });
    // the window's name, as it lights
    paperSlip(f.c, scr, { lines: ['HandwiredOS · Monitor · 64 slots'], x: 900, y: 62, t, inkAt: b.monitor + 0.5, font: 'sc', size: 24, id: `${ID}-mon`, pin: true, tint: 'plate' });
  },
});

// ------------------------------------------------------------------ camera: on the rack, then the pull-back
function cam(t: number, b: Beats): Camera3 {
  const creep = clamp01(t / b.monitor);
  const near: Camera3 = { x: lerp(468, 474, creep), y: lerp(420, 414, creep), z: lerp(170, 205, creep), lens: 1 };
  const u = ease5(clamp01((t - (b.monitor - 0.2)) / 4.2));
  const far: Camera3 = { x: 640, y: 350, z: -600, lens: 1 };
  return { x: lerp(near.x, far.x, u), y: lerp(near.y, far.y, u), z: lerp(near.z, far.z, u), lens: 1 };
}

// ------------------------------------------------------------------ the rack (cached)
function rack(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/rack/${env.mood.id}`, 800, 560, (cc) => {
    cc.translate(-RACK.x + 40, -RACK.y + 60);
    const ink = PUPPET_NEAR_BLACK;
    const rim = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.7);
    const { x, y, w, h } = RACK;
    cc.fillStyle = ink;
    // hanging rods, top rail, end posts, foot rail
    for (const rx of [x + 150, x + w - 150]) cc.fillRect(rx - 3, y - 60, 6, 64);
    cc.fillRect(x, y - 6, w, 14);
    cc.fillRect(x - 6, y - 6, 16, h);
    cc.fillRect(x + w - 10, y - 6, 16, h);
    cc.fillRect(x - 10, y + h - 14, w + 20, 18);
    // the slot frames: three dark frames with paper-lit backs
    for (let k = 0; k < K; k++) {
      const sx = slotX(k);
      cc.fillStyle = ink;
      cc.fillRect(sx - SLOT.w / 2 - 7, SLOT.y - SLOT.h / 2 - 7, SLOT.w + 14, SLOT.h + 14);
      cc.fillStyle = withAlpha(mixLab(env.mood.haze, env.mood.halo, 0.3), 0.3);
      cc.fillRect(sx - SLOT.w / 2, SLOT.y - SLOT.h / 2, SLOT.w, SLOT.h);
      cc.strokeStyle = rim;
      cc.lineWidth = 1.2;
      cc.strokeRect(sx - SLOT.w / 2, SLOT.y - SLOT.h / 2, SLOT.w, SLOT.h);
    }
    // the stop bar: past the third slot nothing rises into the rack
    cc.fillStyle = ink;
    cc.fillRect(slotX(K - 1) + SLOT.w / 2 + 14, STOP_Y - 5, x + w - 10 - (slotX(K - 1) + SLOT.w / 2 + 14), 10);
    // the rail's dark backing board (the count threads glow against it, not against the window)
    cc.fillStyle = mixLab(ink, env.mood.set, 0.18);
    cc.fillRect(x + 16, RAIL.y0 - 16, w - 32, COUNT_Y - 26 - (RAIL.y0 - 16));
    cc.strokeStyle = rim;
    cc.lineWidth = 1.2;
    cc.beginPath();
    cc.moveTo(x + 16, RAIL.y0 - 16);
    cc.lineTo(x + w - 16, RAIL.y0 - 16);
    cc.stroke();
    // the item shelf and the rail's frame
    cc.fillStyle = ink;
    cc.fillRect(x + 10, ITEM.y + ITEM.h / 2 + 4, w - 20, 6);
    cc.fillRect(x + 10, COUNT_Y + 26, w - 20, 6);
    // rim: tops only
    cc.strokeStyle = rim;
    cc.lineWidth = 1.5;
    cc.beginPath();
    cc.moveTo(x, y - 6);
    cc.lineTo(x + w, y - 6);
    cc.moveTo(x + 10, ITEM.y + ITEM.h / 2 + 4);
    cc.lineTo(x + w - 10, ITEM.y + ITEM.h / 2 + 4);
    cc.stroke();
  })(c, RACK.x - 40, RACK.y - 60);
}

// ------------------------------------------------------------------ the running-count rail (Brent-Kung in miniature)
function rail(c: C2, env: PaintEnv, t: number, b: Beats) {
  const thread = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), 0.42);
  const hot = mixLab(brassOf(env, 1), env.mood.core, 0.3);
  const drop = seg(t, b.each - 0.05, b.each + 0.35);
  const yl = (l: number) => RAIL.y0 + l * RAIL.dy;
  c.save();
  c.lineCap = 'round';
  // the columns: a thread from each item down through the rail to its count
  for (let i = 0; i < NI; i++) {
    const x = itemX(i);
    c.strokeStyle = thread;
    c.lineWidth = lw(c, 1.2);
    c.beginPath();
    c.moveTo(x, ITEM.y + ITEM.h / 2 + 10);
    c.lineTo(x, COUNT_Y - 18);
    c.stroke();
    // 'each item': the visible items' lamps drop their light into the rail, all at once
    if (VIS[i] && drop > 0) {
      c.strokeStyle = withAlpha(hot, 0.85);
      c.lineWidth = lw(c, 2.2);
      c.beginPath();
      c.moveTo(x, ITEM.y + ITEM.h / 2 + 10);
      c.lineTo(x, lerp(ITEM.y + ITEM.h / 2 + 10, yl(0), drop));
      c.stroke();
    }
  }
  // the network's crossings, lit level by level from 'counts'
  for (const [l, a, z] of BK) {
    const on = seg(t, b.counts + l * 0.17 - 0.05, b.counts + l * 0.17 + 0.12);
    c.strokeStyle = on > 0 ? withAlpha(hot, 0.42 + 0.58 * on) : thread;
    c.lineWidth = lw(c, on > 0 ? 1.6 + 1.4 * on : 1.3);
    c.beginPath();
    c.moveTo(itemX(a), yl(l));
    c.lineTo(itemX(z), yl(l) + RAIL.dy * 0.85);
    c.stroke();
    c.fillStyle = on > 0 ? hot : thread;
    c.beginPath();
    c.arc(itemX(z), yl(l) + RAIL.dy * 0.85, 2.4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ------------------------------------------------------------------ the visibility lamps
function lamps(c: C2, env: PaintEnv, t: number, b: Beats) {
  for (let i = 0; i < NI; i++) {
    const x = itemX(i);
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.fillRect(x - 2, LAMP_Y + 9, 4, ITEM.y - ITEM.h / 2 - LAMP_Y - 9);
    c.beginPath();
    c.arc(x, LAMP_Y, 11, 0, Math.PI * 2);
    c.fill();
    if (VIS[i]) {
      const k = 0.85 + 0.15 * seg(t, b.each - 0.1, b.each + 0.2) * (1 - seg(t, b.each + 0.4, b.each + 1.2));
      c.fillStyle = mixLab(brassOf(env, 1), env.mood.core, 0.45);
      c.beginPath();
      c.arc(x, LAMP_Y, 7.5, 0, Math.PI * 2);
      c.fill();
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(x, LAMP_Y, 2, x, LAMP_Y, 30);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.5 * k));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(x - 30, LAMP_Y - 30, 60, 60);
      c.restore();
    } else {
      c.strokeStyle = withAlpha(env.mood.rim, 0.3);
      c.lineWidth = lw(c, 1);
      c.beginPath();
      c.arc(x, LAMP_Y, 7, 0, Math.PI * 2);
      c.stroke();
    }
  }
}

// ------------------------------------------------------------------ the eight items, and their rise on 'three'
function itemPos(i: number, tq: number, b: Beats) {
  const k = SLOT_ITEM.indexOf(i);
  if (k >= 0) {
    const t0 = b.three - 0.12 + k * 0.12;
    const u = ease5(clamp01((tq - t0) / 0.55));
    return { x: lerp(itemX(i), slotX(k), u), y: lerp(ITEM.y, SLOT.y, u), lift: u > 0 && u < 1 ? 1 : 0 };
  }
  const w = WAITING.indexOf(i);
  if (w >= 0) {
    // they rise as well, meet the stop bar and settle back a hair: no slot is left
    const t0 = b.three + 0.36 + w * 0.12;
    const u = clamp01((tq - t0) / 0.5);
    const rise = Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - 0.35 * seg(u, 0.65, 1));
    const top = STOP_Y + 5 + ITEM.h / 2;
    return { x: itemX(i), y: lerp(ITEM.y, top, rise), lift: u > 0 && u < 1 ? 1 : 0 };
  }
  return { x: itemX(i), y: ITEM.y, lift: 0 };
}
function items(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const paper = cardPaper(env);
  const ink = inkCol(env);
  for (let i = 0; i < NI; i++) {
    const p = itemPos(i, tq, b);
    const dim = VIS[i] ? 0 : 0.42;
    c.save();
    c.translate(p.x, p.y);
    c.fillStyle = withAlpha(shadowCol, 0.4);
    c.fillRect(-ITEM.w / 2 + 3 + 2 * p.lift, -ITEM.h / 2 + 4 + 3 * p.lift, ITEM.w, ITEM.h);
    c.fillStyle = mixLab(paper, env.mood.set, dim);
    c.fillRect(-ITEM.w / 2, -ITEM.h / 2, ITEM.w, ITEM.h);
    c.strokeStyle = withAlpha(ink, 0.35);
    c.lineWidth = lw(c, 1);
    c.strokeRect(-ITEM.w / 2 + 0.5, -ITEM.h / 2 + 0.5, ITEM.w - 1, ITEM.h - 1);
    // a list row's stub: a name bar and a value bar (texture, like Monitor's own rows)
    c.fillStyle = withAlpha(ink, VIS[i] ? 0.5 : 0.25);
    c.fillRect(-ITEM.w / 2 + 8, -ITEM.h / 2 + 12, ITEM.w * 0.62, 4);
    c.fillRect(-ITEM.w / 2 + 8, -ITEM.h / 2 + 24, ITEM.w * 0.4, 3);
    c.fillRect(-ITEM.w / 2 + 8, -ITEM.h / 2 + 34, ITEM.w * 0.5, 3);
    c.restore();
  }
  void t;
}

// ------------------------------------------------------------------ the running counts, inked left to right
function counts(c: C2, env: PaintEnv, t: number, b: Beats) {
  const t0 = b.counts + 0.1;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `700 26px ${FONT.mono}`, 26, '0');
    for (let i = 0; i < NI; i++) {
      const at = t0 + i * 0.13;
      const u = clamp01((t - at + 0.1) / 0.18);
      if (u <= 0) continue;
      const x = itemX(i);
      c.save();
      c.globalAlpha = u;
      c.fillStyle = withAlpha(shadowCol, 0.35);
      c.fillRect(x - 21 + 3, COUNT_Y - 19 + 4, 42, 40);
      c.fillStyle = mixLab(cardPaper(env), brassOf(env, 0.7), VIS[i] ? 0.25 : 0.05);
      c.fillRect(x - 21, COUNT_Y - 19, 42, 40);
      c.strokeStyle = VIS[i] ? brassOf(env, 0.5) : withAlpha(inkCol(env), 0.3);
      c.lineWidth = lw(c, 1.6);
      c.strokeRect(x - 21, COUNT_Y - 19, 42, 40);
      cardProbe(c, `${ID}-c${i}`, x - 21, COUNT_Y - 19, 42, 40, u, u);
      c.font = `700 ${size}px ${FONT.mono}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = inkCol(env);
      c.fillText(String(COUNT[i]), x, COUNT_Y + 2);
      c.restore();
    }
  });
}

// ------------------------------------------------------------------ the capacity plate (the number 3 only)
function capacity(c: C2, env: PaintEnv, t: number, b: Beats) {
  const warm = seg(t, b.three - 0.1, b.three + 0.25) * (1 - 0.5 * seg(t, b.three + 0.8, b.three + 2));
  const { x, y, w, h } = PLATE;
  c.save();
  c.fillStyle = withAlpha(shadowCol, 0.4);
  c.fillRect(x - w / 2 + 3, y - h / 2 + 4, w, h);
  const g = c.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
  g.addColorStop(0, brassOf(env, 0.5 + 0.5 * warm));
  g.addColorStop(1, mixLab(brassOf(env, 0.2 * warm), PUPPET_NEAR_BLACK, 0.35));
  c.fillStyle = g;
  c.fillRect(x - w / 2, y - h / 2, w, h);
  // four bolts
  c.fillStyle = mixLab(brassOf(env, 0), PUPPET_NEAR_BLACK, 0.6);
  for (const [bx, by] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    c.beginPath();
    c.arc(x + bx * (w / 2 - 7), y + by * (h / 2 - 7), 2.6, 0, Math.PI * 2);
    c.fill();
  }
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `700 40px ${FONT.mono}`, 40, '3');
    c.font = `700 ${size}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = mixLab('#2a1d14', PUPPET_NEAR_BLACK, 0.3);
    c.fillText(String(K), x, y + 2);
    textProbe(c, `${ID}-cap`, x - size * 0.35, y - size * 0.4, size * 0.7, size * 0.8, 1);
  });
  if (warm > 0.01) {
    c.globalCompositeOperation = 'lighter';
    const rg = c.createRadialGradient(x, y, 4, x, y, 70);
    rg.addColorStop(0, withAlpha(brassOf(env, 1), 0.3 * warm));
    rg.addColorStop(1, withAlpha(brassOf(env, 1), 0));
    c.fillStyle = rg;
    c.fillRect(x - 70, y - 70, 140, 140);
  }
  c.restore();
}

// ------------------------------------------------------------------ HandwiredOS's Monitor window, behind the rack
function monitorWindow(f: Frame, c: C2, env: PaintEnv, t: number, lit: number, b: Beats) {
  const a = lit;
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha = a;
  f.cached(`${ID}/monitor/${env.mood.id}`, WIN.w + 40, WIN.h + 40, (cc) => {
    cc.translate(-WIN.x + 10, -WIN.y + 10);
    const sheet = mixLab(mixLab(OS_COLORS.sheet, env.mood.halo, 0.3), env.mood.haze, 0.12);
    const ink = mixLab(OS_COLORS.ink, env.mood.ink, 0.3);
    cc.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
    cc.beginPath();
    cc.roundRect(WIN.x + 12, WIN.y + 16, WIN.w, WIN.h, 18);
    cc.fill();
    cc.fillStyle = sheet;
    cc.beginPath();
    cc.roundRect(WIN.x, WIN.y, WIN.w, WIN.h, 18);
    cc.fill();
    cc.strokeStyle = withAlpha(ink, 0.25);
    cc.lineWidth = 1.5;
    cc.stroke();
    // title strip
    const th = 46;
    cc.fillStyle = mixLab(sheet, OS_COLORS.desk, 0.35);
    cc.fillRect(WIN.x + 1, WIN.y + 1, WIN.w - 2, th);
    cc.fillStyle = withAlpha(ink, 0.85);
    cc.font = `600 28px ${FONT.display}`;
    cc.textBaseline = 'middle';
    cc.fillText('Monitor', WIN.x + 30, WIN.y + th * 0.55);
    cc.strokeStyle = withAlpha(ink, 0.45);
    cc.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      cc.beginPath();
      cc.arc(WIN.x + WIN.w - 30 - i * 30, WIN.y + th / 2, 7, 0, Math.PI * 2);
      cc.stroke();
    }
    // the sidebar: texture bars only
    cc.fillStyle = withAlpha(ink, 0.18);
    for (let r = 0; r < 6; r++) {
      cc.fillRect(WIN.x + 40, WIN.y + 100 + r * 46, 150 - (r % 3) * 24, 9);
      cc.fillRect(WIN.x + 240, WIN.y + 100 + r * 46, 40, 9);
    }
    // the list: a fixed rack of 64 slots (4 × 16), each a dark-framed slot holding a row stub
    const cw = LIST.w / LIST.cols, ch = LIST.h / LIST.rows;
    for (let k = 0; k < LIST.cols * LIST.rows; k++) {
      const cx = LIST.x + Math.floor(k / LIST.rows) * cw, cy = LIST.y + (k % LIST.rows) * ch;
      cc.strokeStyle = withAlpha(ink, 0.5);
      cc.lineWidth = 1.3;
      cc.strokeRect(cx + 3, cy + 2.5, cw - 6, ch - 5);
      cc.fillStyle = withAlpha(ink, 0.32);
      cc.fillRect(cx + 9, cy + ch * 0.38, (cw - 18) * (0.4 + 0.45 * (((k * 37) % 11) / 11)), 3.5);
    }
    // the bracket that holds the list rack
    cc.fillStyle = withAlpha(ink, 0.7);
    cc.fillRect(LIST.x - 6, LIST.y - 6, 4, LIST.h + 12);
    cc.fillRect(LIST.x + LIST.w + 2, LIST.y - 6, 4, LIST.h + 12);
  })(c, WIN.x - 10, WIN.y - 10);
  c.restore();
  // the overflow line at the list's foot: a pale ruled line, lit on 'Only'
  const ov = seg(t, b.only - 0.15, b.only + 0.35);
  const y = LIST.y + LIST.h + 16;
  c.save();
  c.strokeStyle = withAlpha(mixLab(OS_COLORS.ink, env.mood.ink, 0.3), 0.3 * a);
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  c.moveTo(LIST.x + 4, y);
  c.lineTo(LIST.x + LIST.w - 4, y);
  c.stroke();
  if (ov > 0) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.3), 0.95 * ov);
    c.lineWidth = lw(c, 4.5);
    c.beginPath();
    c.moveTo(LIST.x + 4, y);
    c.lineTo(lerp(LIST.x + 4, LIST.x + LIST.w - 4, ov), y);
    c.stroke();
    const g = c.createLinearGradient(0, y - 22, 0, y + 22);
    g.addColorStop(0, withAlpha(env.mood.halo, 0));
    g.addColorStop(0.5, withAlpha(env.mood.halo, 0.4 * ov));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(LIST.x, y - 22, LIST.w * ov, 44);
  }
  c.restore();
}
