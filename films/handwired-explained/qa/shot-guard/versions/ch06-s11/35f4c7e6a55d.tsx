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
import { FONT, LAYERS, PUPPET_NEAR_BLACK, overscan, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { brassOf, cardPaper, clamp01, clockRoom, ease5, inkCol, lerp, lw, paperSlip, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
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
/** review r1: the visible items past capacity wait OUTSIDE the rack, on a bracket off its right post */
const WAIT = { x0: RACK.x + RACK.w + 62, pitch: 70, y: STOP_Y + 5 + ITEM.h / 2 };
const waitX = (w: number) => WAIT.x0 + w * WAIT.pitch;

// the Monitor window behind (its own plane, rest px of that plane)
const MON: LayerSpec = { id: `${ID}-monitor`, z: 1600, haze: 0.1, blur: 0.8 };
const WIN = { x: 120, y: 40, w: 1040, h: 600 };
const LIST = { x: 820, y: 118, w: 312, h: 460, cols: 4, rows: 16 };

interface Beats {
  D: number;
  each: number;
  counts: number;
  /** 'place': the count rail's last knot has fired; the counts ink left to right from here */
  place: number;
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
      place: T.word('L0622', 'place'),
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
    // review r1: the near floor runs across the whole camera path (the bench lip stopped short at the pull-back's end)
    nearFloor(f, b);
    // screen-locked: the equation, pinned at the foot of the frame through the pull-back
    const scr = { mood: f.mood } as PaintEnv;
    paperSlip(f.c, scr, { lines: ['visible 0 1 1 0 1 0 1 1 → counts 0 1 2 2 3 3 4 5'], x: 640, y: 570, t, inkAt: b.counts + 0.35, font: 'mono', size: 23, id: `${ID}-eq`, pin: true, tint: 'card' });
    // the window's name, as it lights
    // review r1: inked once the pull-back has settled, above the window's frame, top-centre (never over the list)
    paperSlip(f.c, scr, { lines: ['HandwiredOS · Monitor · 64 slots'], x: 640, y: 14, t, inkAt: b.monitor + 1.45, font: 'sc', size: 24, id: `${ID}-mon`, pin: true, tint: 'plate' });
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

// ------------------------------------------------------------------ the near floor (L5), over the whole camera path
function nearFloor(f: Frame, b: Beats) {
  const cams = [0, b.monitor, b.monitor + 1.5, b.monitor + 3, b.D].map((t) => cam(t, b));
  const r = overscan(LAYERS.L5, cams, 60);
  const y = 860;
  const x0 = Math.floor(r.x), w = Math.ceil(r.w), h = Math.max(80, Math.ceil(r.y + r.h - y) + 20);
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/floor/${env.mood.id}/${x0},${w},${h}`, w, h + 20, (cc) => {
      cc.translate(-x0, -y + 20);
      cc.fillStyle = mixLab(env.mood.fg, env.mood.ink, 0.4);
      cc.beginPath();
      cc.moveTo(x0, y + 6);
      cc.lineTo(x0 + w, y - 4);
      cc.lineTo(x0 + w, y + h);
      cc.lineTo(x0, y + h);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), 0.28);
      cc.lineWidth = 1.6;
      cc.beginPath();
      cc.moveTo(x0, y + 6.5);
      cc.lineTo(x0 + w, y - 3.5);
      cc.stroke();
    })(c, x0, y - 20);
  });
}

// ------------------------------------------------------------------ the rack (cached)
function rack(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/rack/${env.mood.id}`, 1000, 560, (cc) => {
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
    // the waiting bracket: a short ledge bolted to the outside of the right post (nothing on it is in the rack)
    cc.fillStyle = ink;
    cc.fillRect(x + w + 4, WAIT.y + ITEM.h / 2 + 4, waitX(WAITING.length - 1) + ITEM.w / 2 + 14 - (x + w + 4), 6);
    cc.beginPath();
    cc.moveTo(x + w + 4, WAIT.y + ITEM.h / 2 + 10);
    cc.lineTo(x + w + 4, WAIT.y + ITEM.h / 2 + 46);
    cc.lineTo(x + w + 44, WAIT.y + ITEM.h / 2 + 10);
    cc.closePath();
    cc.fill();
    // the rail's backing board in the set's ink (the s10 board's world), so the count threads read against it
    cc.fillStyle = mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.45);
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
    cc.moveTo(x + w + 4, WAIT.y + ITEM.h / 2 + 4);
    cc.lineTo(waitX(WAITING.length - 1) + ITEM.w / 2 + 14, WAIT.y + ITEM.h / 2 + 4);
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
    const step = (b.place - b.counts - 0.12) / (LEVELS - 1);
    const on = seg(t, b.counts + l * step - 0.04, b.counts + l * step + 0.1);
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
  // review r1: from 'place' each column's thread carries its count down to its tile, left to right
  for (let i = 0; i < NI; i++) {
    const at = countAt(i, b);
    const u = seg(t, at - 0.16, at);
    const out = 1 - seg(t, at + 0.05, at + 0.5);
    if (u <= 0.01 || out <= 0.01) continue;
    const x = itemX(i);
    const yA = yl(LEVELS - 1) + RAIL.dy, yB = COUNT_Y - 20;
    const yh = lerp(yA, yB, u);
    c.strokeStyle = withAlpha(hot, 0.95 * out);
    c.lineWidth = lw(c, 2.6);
    c.beginPath();
    c.moveTo(x, yA);
    c.lineTo(x, yh);
    c.stroke();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, yh, 0, x, yh, 16);
    g.addColorStop(0, withAlpha(hot, 0.6 * out));
    g.addColorStop(1, withAlpha(hot, 0));
    c.fillStyle = g;
    c.fillRect(x - 16, yh - 16, 32, 32);
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
}
/** count tile i inks as its thread arrives: left to right from 'place' */
const countAt = (i: number, b: Beats) => b.place + 0.12 + i * 0.15;

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
    return { x: lerp(itemX(i), slotX(k), u), y: lerp(ITEM.y, SLOT.y, u), lift: u > 0 && u < 1 ? 1 : 0, wait: 0 };
  }
  const w = WAITING.indexOf(i);
  if (w >= 0) {
    // they rise as well and meet the stop bar (no slot is left), then are carried out past the right post to wait
    // outside the rack, unplaced, on its bracket
    const t0 = b.three + 0.36 + w * 0.12;
    const u = clamp01((tq - t0) / 0.4);
    const rise = Math.sin(Math.min(1, u * 1.4) * Math.PI * 0.5);
    const top = WAIT.y;
    const o = ease5(clamp01((tq - t0 - 0.45) / 0.65));
    return { x: lerp(itemX(i), waitX(w), o), y: lerp(ITEM.y, top, rise), lift: (u > 0 && u < 1) || (o > 0 && o < 1) ? 1 : 0, wait: o };
  }
  return { x: itemX(i), y: ITEM.y, lift: 0, wait: 0 };
}
function items(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const paper = cardPaper(env);
  const ink = inkCol(env);
  for (let i = 0; i < NI; i++) {
    const p = itemPos(i, tq, b);
    const dim = VIS[i] ? 0 : 0.42;
    c.save();
    // the waiting items dim to about 60 %: outside the rack, unplaced
    c.globalAlpha = 1 - 0.4 * p.wait;
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
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `700 26px ${FONT.mono}`, 26, '0');
    for (let i = 0; i < NI; i++) {
      const at = countAt(i, b);
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
/**
 * Review r1: the window wears HandwiredOS's frame language (the dark carved desk of ch05-s07 / ch06-s13): a sheet at
 * the set's value, a near-black bezel, a small brass plaque, rows ruled in rim light. Never the brightest shape.
 */
function monitorWindow(f: Frame, c: C2, env: PaintEnv, t: number, lit: number, b: Beats) {
  const a = lit;
  if (a <= 0.003) return;
  const ruleCol = mixLab(env.mood.rim, env.mood.haze, 0.35);
  c.save();
  c.globalAlpha = a;
  f.cached(`${ID}/monitor2/${env.mood.id}`, WIN.w + 80, WIN.h + 80, (cc) => {
    cc.translate(-WIN.x + 30, -WIN.y + 30);
    const sheet = mixLab(env.mood.set, env.mood.core, 0.25);
    const chrome = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.15);
    const B = 22;
    // the bezel: near-black chrome, a carved inner lip
    cc.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
    cc.beginPath();
    cc.roundRect(WIN.x - B + 10, WIN.y - B + 14, WIN.w + 2 * B, WIN.h + 2 * B, 22);
    cc.fill();
    cc.fillStyle = chrome;
    cc.beginPath();
    cc.roundRect(WIN.x - B, WIN.y - B, WIN.w + 2 * B, WIN.h + 2 * B, 22);
    cc.fill();
    cc.fillStyle = sheet;
    cc.beginPath();
    cc.roundRect(WIN.x, WIN.y, WIN.w, WIN.h, 10);
    cc.fill();
    // a soft vignette inside (lit from the room's window behind, so the centre is a hair brighter)
    const v = cc.createRadialGradient(WIN.x + WIN.w / 2, WIN.y + WIN.h * 0.45, WIN.w * 0.1, WIN.x + WIN.w / 2, WIN.y + WIN.h * 0.45, WIN.w * 0.7);
    v.addColorStop(0, withAlpha(env.mood.halo, 0.06));
    v.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0.28));
    cc.fillStyle = v;
    cc.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    // the title strip: chrome, three dark studs (no lettering)
    const th = 40;
    cc.fillStyle = chrome;
    cc.fillRect(WIN.x, WIN.y, WIN.w, th);
    cc.strokeStyle = withAlpha(ruleCol, 0.35);
    cc.lineWidth = 1.3;
    cc.beginPath();
    cc.moveTo(WIN.x, WIN.y + th);
    cc.lineTo(WIN.x + WIN.w, WIN.y + th);
    cc.stroke();
    for (let i = 0; i < 3; i++) {
      cc.beginPath();
      cc.arc(WIN.x + WIN.w - 30 - i * 28, WIN.y + th / 2, 6, 0, Math.PI * 2);
      cc.stroke();
    }
    // rim on the bezel's top edge only
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
    cc.lineWidth = 1.6;
    cc.beginPath();
    cc.moveTo(WIN.x - B + 20, WIN.y - B + 0.8);
    cc.lineTo(WIN.x + WIN.w + B - 20, WIN.y - B + 0.8);
    cc.stroke();
    // the small brass plaque at the bezel's foot (blank, the HandwiredOS desk's own)
    const px = WIN.x + WIN.w / 2, py = WIN.y + WIN.h + B / 2;
    cc.fillStyle = mixLab(brassOf(env, 0.25), PUPPET_NEAR_BLACK, 0.25);
    cc.fillRect(px - 54, py - 8, 108, 16);
    cc.fillStyle = mixLab(brassOf(env, 0), PUPPET_NEAR_BLACK, 0.6);
    cc.beginPath();
    cc.arc(px - 46, py, 2.2, 0, Math.PI * 2);
    cc.arc(px + 46, py, 2.2, 0, Math.PI * 2);
    cc.fill();
    // the sidebar: texture bars only
    cc.fillStyle = withAlpha(ruleCol, 0.16);
    for (let r = 0; r < 6; r++) {
      cc.fillRect(WIN.x + 40, WIN.y + 100 + r * 46, 150 - (r % 3) * 24, 9);
      cc.fillRect(WIN.x + 240, WIN.y + 100 + r * 46, 40, 9);
    }
    // the list: a fixed rack of 64 slots (4 × 16), each a ruled slot holding a row stub
    const cw = LIST.w / LIST.cols, ch = LIST.h / LIST.rows;
    cc.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
    cc.fillRect(LIST.x - 8, LIST.y - 8, LIST.w + 16, LIST.h + 16);
    for (let k = 0; k < LIST.cols * LIST.rows; k++) {
      const cx = LIST.x + Math.floor(k / LIST.rows) * cw, cy = LIST.y + (k % LIST.rows) * ch;
      cc.strokeStyle = withAlpha(ruleCol, 0.42);
      cc.lineWidth = 1.2;
      cc.strokeRect(cx + 3, cy + 2.5, cw - 6, ch - 5);
      cc.fillStyle = withAlpha(ruleCol, 0.3);
      cc.fillRect(cx + 9, cy + ch * 0.38, (cw - 18) * (0.4 + 0.45 * (((k * 37) % 11) / 11)), 3.5);
    }
    // the bracket that holds the list rack
    cc.fillStyle = chrome;
    cc.fillRect(LIST.x - 8, LIST.y - 8, 5, LIST.h + 16);
    cc.fillRect(LIST.x + LIST.w + 3, LIST.y - 8, 5, LIST.h + 16);
  })(c, WIN.x - 30, WIN.y - 30);
  c.restore();
  // 'Only': a quick pulse down the 64 slots (all four columns at once) that ends on the overflow line, which lights
  // as a warm ruled line with a soft halo and holds to the end
  const warm = mixLab(brassOf(env, 1), env.mood.core, 0.25);
  const y = LIST.y + LIST.h + 16;
  const p = clamp01((t - (b.only - 0.1)) / 0.55);
  const ov = seg(t, b.only + 0.35, b.only + 0.6);
  c.save();
  c.strokeStyle = withAlpha(ruleCol, 0.35 * a);
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  c.moveTo(LIST.x + 4, y);
  c.lineTo(LIST.x + LIST.w - 4, y);
  c.stroke();
  c.globalCompositeOperation = 'lighter';
  if (p > 0 && p < 1) {
    const py = lerp(LIST.y, y, ease5(p));
    const g = c.createLinearGradient(0, py - 70, 0, py + 4);
    g.addColorStop(0, withAlpha(warm, 0));
    g.addColorStop(1, withAlpha(warm, 0.3 * Math.sin(Math.PI * p)));
    c.fillStyle = g;
    c.fillRect(LIST.x, py - 70, LIST.w, 74);
  }
  if (ov > 0) {
    const g = c.createLinearGradient(0, y - 20, 0, y + 20);
    g.addColorStop(0, withAlpha(warm, 0));
    g.addColorStop(0.5, withAlpha(warm, 0.32 * ov));
    g.addColorStop(1, withAlpha(warm, 0));
    c.fillStyle = g;
    c.fillRect(LIST.x - 10, y - 20, LIST.w + 20, 40);
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = withAlpha(warm, 0.95 * ov);
    c.lineWidth = lw(c, 2.5);
    c.beginPath();
    c.moveTo(LIST.x + 4, y);
    c.lineTo(LIST.x + LIST.w - 4, y);
    c.stroke();
  }
  c.restore();
}
