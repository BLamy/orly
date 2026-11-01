/**
 * ch02-s05 — Cloudflare's hosted Storage Relay Service, 2024 (serverCyan, cut): drawn as a DIAGRAM, never as the
 * harbour town.
 *
 * A serverCyan board: deep blue-black ground, cyan cut-line practicals. L1 a faint field of points, L2 five far hills
 * each with a data-centre lamp, L4 the diagram (the Room Lantern, the Ribbon, the chute, the cistern, the sand-glass),
 * L5 two dark slats at the frame edges. One focal motion at a time.
 *
 *   badge     the brass tag 'Cloudflare, hosted' swings on the lantern's base (the one warm accent is the lantern)
 *   ribbon    the Ribbon (SQLite's write-ahead log) unspools from the lantern's base, frame after frame
 *   batches   scissors cut it: the length rolls up and creeps down a slow cyan chute into the object-storage
 *             cistern; a small cut-paper sand-glass drains (no text)
 *   slow      the reply letter waits at the lantern's door; the sand-glass is still nearly full
 *   five      five far lamps light; each new frame flies along five cyan threads at once; quote card Q06 upper-left
 *   three     three of the five lamps flash back along their threads
 *   lift      the latch on the lantern's door lifts; the letter goes
 *   inside    pull back: the whole diagram stands inside one great paper wall (Cloudflare's network); the lantern's
 *             thread is tied inside; outside the wall, the open road from the last shot runs to a far hill
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, defineShot, mixLab, quoteCard, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { SEA_CYAN, badge, camAt, clamp01, cord, cordAt, glowDot, lerp, paper, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { roomLantern, lanternPt } from '../sets/roomLantern';
import { letter } from '../sets/heldLetter';
import { ribbon, scroll } from '../sets/walRibbon';
import { bakeRes, h01 } from '../sets/ch02-s01-kit';

const ID = 'ch02-s05';
const L = { x: 210, y: 440, s: 1.5 };
const RIB = { x: 262, y: 418, s: 0.72 };
const PITCH = (14 + 40) * 0.72 + 3 * 0.72;
const FRAME_DT = 0.42;
const CHUTE = { x0: 470, y0: 470, x1: 668, y1: 528 };
const CISTERN = { x: 720, top: 530, bottom: 590, w: 120 };
const GLASS = { x: 880, y: 540, h: 66 };
/** five far lamps (L2 coords) on five small hills */
const LAMPS = [
  { x: 690, y: 262 },
  { x: 790, y: 196 },
  { x: 890, y: 244 },
  { x: 990, y: 176 },
  { x: 1086, y: 236 },
];
const ANSWER = [0, 2, 3];
const WALL = { x0: -170, x1: 1130, y0: 44, y1: 612 };

const C0: Camera3 = { x: 556, y: 372, z: 170, lens: 1 };
const C1: Camera3 = { x: 592, y: 366, z: 214, lens: 1 };
const C2c: Camera3 = { x: 560, y: 356, z: -300, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      badge: T.beat('badge'),
      ribbon: T.beat('ribbon'),
      batches: T.beat('batches'),
      slow: T.beat('slow'),
      five: T.beat('five'),
      three: T.beat('three'),
      lift: T.beat('lift'),
      inside: T.beat('inside'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: C0 },
      { t: b.inside - 0.6, cam: C1 },
      { t: Math.min(b.D - 0.4, b.inside + 3.6), cam: C2c },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const allCams = cams.map((k) => k.cam);
    const lampsOn = LAMPS.map((_, i) => seg(t, b.five - 0.1 + i * 0.12, b.five + 0.3 + i * 0.12));
    const wall = seg(t, b.inside - 0.3, b.inside + 1.6);
    f.camera(cam);
    f.backlight({ sunX: 980, sunY: 210, intensity: 0.3 });
    f.layer('L1', (c, env) => {
      const r = { x: -900, y: -500, w: 3000, h: 1800 };
      bakeRes(f, c, env, `${ID}-field`, r, (cc) => {
        const g = cc.createLinearGradient(0, 0, 0, 900);
        g.addColorStop(0, withAlpha(env.mood.fg, 0.35));
        g.addColorStop(0.45, withAlpha(env.mood.fg, 0.55));
        g.addColorStop(1, withAlpha(env.mood.fg, 0.92));
        cc.fillStyle = g;
        cc.fillRect(r.x, r.y, r.w, r.h);
        for (let i = 0; i < 260; i++) {
          cc.fillStyle = withAlpha(tone(env, SEA_CYAN, 0.35), 0.1 + 0.25 * h01(i, 4));
          cc.fillRect(r.x + h01(i, 1) * r.w, r.y + h01(i, 2) * r.h * 0.7, 1.6, 1.6);
        }
      });
    });
    f.layer('L2', (c, env) => {
      bakeRes(f, c, env, `${ID}-hills`, { x: 400, y: 120, w: 1200, h: 520 }, (cc) => hills(cc, env));
      for (let i = 0; i < 5; i++) dcLamp(c, env, LAMPS[i].x, LAMPS[i].y, lampsOn[i], answerFlash(t, b.three, i));
      // the far hill outside the wall, and the lone house the road leads to (the last shot's runtime)
      if (wall > 0.01) {
        c.save();
        c.globalAlpha = wall;
        c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.2);
        c.beginPath();
        c.moveTo(1180, 470);
        c.quadraticCurveTo(1330, 300, 1480, 470);
        c.closePath();
        c.fill();
        c.strokeStyle = withAlpha(paper(env, 0.2), 0.8);
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(1316, 362);
        c.lineTo(1316, 334);
        c.lineTo(1330, 322);
        c.lineTo(1344, 334);
        c.lineTo(1344, 362);
        c.stroke();
        c.restore();
      }
    });
    f.fog({ yCenter: 520, height: 260, alpha: 0.12, drift: 4 });
    f.layer('L3', (c, env) => {
      bakeRes(f, c, env, `${ID}-edge`, { x: -1200, y: 300, w: 3600, h: 700 }, (cc) => {
        cc.fillStyle = withAlpha(env.mood.fg, 0.55);
        cc.fillRect(-1200, 352, 3600, 650);
        cc.strokeStyle = withAlpha(tone(env, SEA_CYAN, 0.3), 0.35);
        cc.lineWidth = 1.2;
        cc.beginPath();
        cc.moveTo(-1200, 352);
        cc.lineTo(2400, 352);
        cc.stroke();
        cc.lineWidth = 1;
        for (let x = -1200; x < 2400; x += 60) {
          cc.beginPath();
          cc.moveTo(x, 352);
          cc.lineTo(x, 360);
          cc.stroke();
        }
      });
    });
    f.layer('L4', (c, env) => {
      const ink = env.fill('ink');
      // ---- the great wall (Cloudflare's network), revealed by the pull back
      if (wall > 0.01) greatWall(c, env, wall);
      // ---- the chute and the cistern (object storage)
      bakeRes(f, c, env, `${ID}-chute`, { x: 420, y: 440, w: 520, h: 200 }, (cc) => chuteAndCistern(cc, env));
      // ---- the sand-glass (ten seconds; no text)
      sandGlass(c, env, t, b);
      // ---- the lantern, its badge and its thread tied inside
      const latch = seg(t, b.lift - 0.1, b.lift + 0.35) * (1 - seg(t, b.lift + 1.6, b.lift + 2.1));
      roomLantern(c, env, { ...L, lit: 1, members: 3, tq, door: latch });
      const peg = { x: L.x - 70, y: L.y + 30 };
      cord(c, L.x - 16, L.y - 4, peg.x, peg.y, 18, withAlpha(tone(env, '#f2d29a', 0.3), 0.5 + 0.4 * wall), 1, 1);
      c.fillStyle = ink;
      c.fillRect(peg.x - 2, peg.y - 4, 4, 14);
      const bA = seg(t, b.badge - 0.4, b.badge + 0.3);
      const swing = bA < 1 ? 0 : 0;
      badge(c, env, { x: L.x + 20, y: L.y + 1, text: 'Cloudflare, hosted', s: 1, legible: true, alpha: bA, glint: 0.4 + 0.6 * Math.sin(Math.PI * seg(t, b.badge, b.badge + 0.8)), swing: swing + 0.12 * Math.exp(-Math.max(0, tq - b.badge) * 1.4) * Math.sin(Math.max(0, tq - b.badge) * 7), id: `${ID}-badge` });
      // ---- the ribbon: frames unspool from the lantern's base; batches cut, roll and creep to the cistern
      tape(c, env, t, tq, b);
      // ---- the reply letter waits at the door from 'slow' until the latch lifts
      const door = lanternPt(L, 'door');
      const lw = seg(t, b.slow - 1.2, b.slow - 0.6);
      const go = clamp01((tq - (b.lift + 0.25)) / 1.3);
      if (lw > 0 && go < 1) {
        const e = sm(go);
        letter(c, env, { x: lerp(door.x + 26, door.x + 260, e), y: door.y - 10 - Math.sin(Math.PI * e) * 70, s: 0.55, rot: -0.1 + 0.3 * e, alpha: lw * (1 - seg(go, 0.85, 1)) });
      }
      // ---- five threads to the five far lamps; frames fly along them; three answers come back
      threads(c, env, t, tq, cam, b, lampsOn);
    });
    f.rim({ x: -0.3, y: -1 });
    const fl = lanternPt(L, 'flame');
    f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 27, intensity: 0.45, radius: 40, layer: 'L4' });
    // ---------------------------------------------------------------- type
    quoteCard(f.c, { quote: 'Once at least three of these followers respond… the write is confirmed.', speaker: 'Kenton Varda, 2024', x: 66, y: 132, width: 460, align: 'left', at: b.five - 0.1, dur: b.inside - 0.8 - b.five, fade: 0.45 }, { t, mood: f.mood });
    void toScreen;
    void allCams;
  },
});

const answerFlash = (t: number, three: number, i: number) => (ANSWER.includes(i) ? Math.sin(Math.PI * seg(t, three - 0.1 + ANSWER.indexOf(i) * 0.15, three + 0.5 + ANSWER.indexOf(i) * 0.15)) : 0);

function hills(c: C2, env: PaintEnv): void {
  const col = mixLab(env.fill('set'), env.mood.fg, 0.15);
  c.fillStyle = col;
  for (const p of LAMPS) {
    c.beginPath();
    c.moveTo(p.x - 70, p.y + 120);
    c.quadraticCurveTo(p.x - 30, p.y + 10, p.x, p.y + 8);
    c.quadraticCurveTo(p.x + 30, p.y + 10, p.x + 70, p.y + 120);
    c.closePath();
    c.fill();
    // a small lamp-post on each hill
    c.fillRect(p.x - 1.5, p.y - 6, 3, 16);
  }
  c.strokeStyle = withAlpha(tone(env, SEA_CYAN, 0.3), 0.3);
  c.lineWidth = 1;
  for (const p of LAMPS) {
    c.beginPath();
    c.moveTo(p.x - 40, p.y + 40);
    c.quadraticCurveTo(p.x - 20, p.y + 10, p.x, p.y + 8);
    c.stroke();
  }
}
function dcLamp(c: C2, env: PaintEnv, x: number, y: number, on: number, flash: number): void {
  const cy = tone(env, SEA_CYAN, 0.15);
  c.fillStyle = mixLab(env.fill('ink'), cy, 0.2 + 0.6 * on);
  c.fillRect(x - 5, y - 12, 10, 8);
  if (on > 0.01) glowDot(c, x, y - 8, 26 + 20 * flash, mixLab(cy, '#ffffff', 0.3 * flash), 0.7 * on + 0.5 * flash);
}
function chuteAndCistern(c: C2, env: PaintEnv): void {
  const ink = env.fill('ink');
  const cy = tone(env, SEA_CYAN, 0.25);
  // the chute: a trough with cyan cut-line edges
  c.fillStyle = mixLab(ink, cy, 0.22);
  c.beginPath();
  c.moveTo(CHUTE.x0, CHUTE.y0);
  c.lineTo(CHUTE.x1, CHUTE.y1);
  c.lineTo(CHUTE.x1, CHUTE.y1 + 12);
  c.lineTo(CHUTE.x0, CHUTE.y0 + 12);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(cy, 0.85);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(CHUTE.x0, CHUTE.y0 + 12);
  c.lineTo(CHUTE.x1, CHUTE.y1 + 12);
  c.moveTo(CHUTE.x0, CHUTE.y0);
  c.lineTo(CHUTE.x1, CHUTE.y1);
  c.stroke();
  // trestles under it
  c.fillStyle = ink;
  for (const u of [0.15, 0.55, 0.9]) c.fillRect(lerp(CHUTE.x0, CHUTE.x1, u) - 2, lerp(CHUTE.y0, CHUTE.y1, u) + 12, 4, 80);
  // the cistern: a deep stone tank, its mouth a dark slot with a cyan glint
  const C = CISTERN;
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(C.x - C.w / 2, C.bottom);
  c.lineTo(C.x - C.w / 2 + 6, C.top);
  c.lineTo(C.x + C.w / 2 - 6, C.top);
  c.lineTo(C.x + C.w / 2, C.bottom);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(ink, cy, 0.35);
  c.fillRect(C.x - C.w / 2 + 10, C.top + 2, C.w - 20, 4);
  c.strokeStyle = withAlpha(cy, 0.4);
  c.lineWidth = 1;
  for (let r = 1; r < 4; r++) {
    c.beginPath();
    c.moveTo(C.x - C.w / 2 + 4, C.top + r * 15);
    c.lineTo(C.x + C.w / 2 - 4, C.top + r * 15);
    c.stroke();
  }
  // its rim (tops only)
  c.strokeStyle = withAlpha(cy, 0.75);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(C.x - C.w / 2 + 6, C.top);
  c.lineTo(C.x + C.w / 2 - 6, C.top);
  c.stroke();
}
function sandGlass(c: C2, env: PaintEnv, t: number, b: { batches: number; slow: number }): void {
  const a = seg(t, b.batches - 0.2, b.batches + 0.5);
  if (a <= 0.01) return;
  const { x, y, h } = GLASS;
  const w = h * 0.55;
  const drain = clamp01((t - b.batches) / 10) * 0.35; // ten seconds of sand would take far longer than a tick
  const pulse = Math.sin(Math.PI * seg(t, b.slow - 0.1, b.slow + 0.9));
  c.save();
  c.globalAlpha = a;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(x - w / 2 - 4, y - 4, w + 8, 5);
  c.fillRect(x - w / 2 - 4, y - h - 1, w + 8, 5);
  c.fillRect(x - w / 2 - 2, y - h, 3, h);
  c.fillRect(x + w / 2 - 1, y - h, 3, h);
  // glass outline
  const glass = new Path2D();
  glass.moveTo(x - w / 2 + 3, y - h + 4);
  glass.quadraticCurveTo(x - w / 2 + 3, y - h / 2 - 6, x - 2, y - h / 2);
  glass.quadraticCurveTo(x - w / 2 + 3, y - h / 2 + 6, x - w / 2 + 3, y - 4);
  glass.lineTo(x + w / 2 - 3, y - 4);
  glass.quadraticCurveTo(x + w / 2 - 3, y - h / 2 + 6, x + 2, y - h / 2);
  glass.quadraticCurveTo(x + w / 2 - 3, y - h / 2 - 6, x + w / 2 - 3, y - h + 4);
  glass.closePath();
  c.fillStyle = withAlpha(tone(env, SEA_CYAN, 0.4), 0.1);
  c.fill(glass);
  c.strokeStyle = withAlpha(tone(env, SEA_CYAN, 0.3), 0.55 + 0.4 * pulse);
  c.lineWidth = 1 + pulse;
  c.stroke(glass);
  // sand: upper bulb level falls, lower pile grows, a thread of sand between
  const sand = mixLab(paper(env, 0.2), '#d9c08a', 0.4);
  c.save();
  c.clip(glass);
  c.fillStyle = sand;
  const top = (h / 2 - 8) * (1 - drain);
  c.fillRect(x - w / 2, y - h / 2 - top - 2, w, top);
  const pile = (h / 2 - 8) * drain;
  c.beginPath();
  c.moveTo(x - w / 2, y - 4);
  c.lineTo(x - w / 2, y - 4 - pile * 0.6);
  c.quadraticCurveTo(x, y - 4 - pile * 1.5, x + w / 2, y - 4 - pile * 0.6);
  c.lineTo(x + w / 2, y - 4);
  c.closePath();
  c.fill();
  c.fillRect(x - 0.6, y - h / 2, 1.2, h / 2 - 4 - pile);
  c.restore();
  c.restore();
  void ink;
}
/** the Ribbon: written frames unspool from the lantern; at each batch the length is cut, rolls up and creeps away */
function tape(c: C2, env: PaintEnv, t: number, tq: number, b: { ribbon: number; batches: number; slow: number; five: number }): void {
  const cuts = [b.batches, b.slow + 1.4];
  const startOf = (k: number) => (k === 0 ? b.ribbon - 0.1 : cuts[k - 1] + 0.35);
  // which batch is being written now
  let k = 0;
  while (k < cuts.length && t >= cuts[k] + 0.35) k++;
  const s0 = startOf(k);
  const n = Math.max(0, (tq - s0) / FRAME_DT);
  const shown = Math.min(13, n);
  if (shown > 0.02) {
    const frames = Array.from({ length: Math.ceil(shown) + 1 }, (_, i) => ({ kind: 'frame' as const, stamp: i % 3 === 2 ? 4 + ((i / 3) | 0) : null }));
    ribbon(c, env, { ...RIB, frames, shown, id: `${ID}-rib` });
  }
  // the cut lengths: each rolls into a scroll at the ribbon's middle, drops to the chute and creeps down it
  for (let j = 0; j < cuts.length; j++) {
    const cutAt = cuts[j];
    if (t < cutAt - 0.4) continue;
    const len = Math.min(13, (cutAt - startOf(j)) / FRAME_DT);
    const midX = RIB.x + (len * PITCH) / 2;
    // the scissors' snap: a brief bright tick at the lantern end
    const snap = Math.sin(Math.PI * seg(t, cutAt - 0.25, cutAt + 0.15));
    if (snap > 0) glowDot(c, RIB.x - 4, RIB.y, 14, tone(env, '#eaf6f8', 0.2), 0.7 * snap);
    const roll = seg(t, cutAt, cutAt + 0.45);
    if (roll < 1) {
      // the length still flat, shrinking toward its middle as it rolls
      const frames = Array.from({ length: Math.ceil(len) }, (_, i) => ({ kind: 'frame' as const, stamp: i % 3 === 2 ? 4 + ((i / 3) | 0) : null }));
      c.save();
      c.translate(midX, RIB.y);
      c.scale(1 - roll * 0.9, 1);
      c.translate(-midX, -RIB.y);
      ribbon(c, env, { ...RIB, frames, shown: len, alpha: 1 - roll * 0.6 });
      c.restore();
    }
    if (roll > 0.3) {
      // drop to the chute's top, then creep slowly down it (sluggish), then fall into the cistern
      const drop = sm(seg(t, cutAt + 0.35, cutAt + 0.9));
      const creep = clamp01((tq - (cutAt + 0.9)) / 5.5);
      const fall = seg(t, cutAt + 6.4, cutAt + 6.9);
      let x: number, y: number;
      if (creep <= 0) {
        x = lerp(midX, CHUTE.x0 + 16, drop);
        y = lerp(RIB.y, CHUTE.y0 - 4, drop);
      } else {
        x = lerp(CHUTE.x0 + 16, CHUTE.x1 - 6, creep);
        y = lerp(CHUTE.y0 + 4, CHUTE.y1, creep) - 6;
      }
      if (fall > 0) {
        x = lerp(CHUTE.x1 - 6, CISTERN.x - 10, fall);
        y = lerp(CHUTE.y1 - 6, CISTERN.top + 10, fall);
      }
      scroll(c, env, { x, y, s: 0.9, rot: creep * 6 + fall, alpha: seg(roll, 0.3, 0.6) * (1 - seg(fall, 0.7, 1)), tag: 0.6 });
    }
  }
}
/** five cyan threads from the lantern to the five far lamps (converted L2 → L4 each frame), the flights and answers */
function threads(c: C2, env: PaintEnv, t: number, tq: number, cam: Camera3, b: { five: number; three: number; lift: number }, on: number[]): void {
  const cy = tone(env, SEA_CYAN, 0.15);
  const from = lanternPt(L, 'top');
  const ends = LAMPS.map((p) => {
    const sp = toScreen(LAYERS.L2, cam, p.x, p.y - 8);
    return toLayer(LAYERS.L4, cam, sp.x, sp.y);
  });
  for (let i = 0; i < 5; i++) {
    if (on[i] <= 0.01) continue;
    cord(c, from.x, from.y, ends[i].x, ends[i].y, 30, withAlpha(cy, 0.55 * on[i]), 1.1, on[i]);
  }
  // each new commit's frame flies along all five threads at once
  for (let k = 0; k < 7; k++) {
    const st = b.five + 0.4 + k * 0.95;
    const u = clamp01((tq - st) / 0.9);
    if (u <= 0 || u >= 1 || st > b.lift - 0.4) continue;
    for (let i = 0; i < 5; i++) {
      const p = cordAt(from.x, from.y, ends[i].x, ends[i].y, 30, sm(u));
      c.fillStyle = mixLab(paper(env, 0.05), '#f4ecd8', 0.4);
      c.fillRect(p.x - 4, p.y - 3, 8, 6);
      c.fillStyle = withAlpha(tone(env, '#c2412b', 0.2), 0.9);
      c.fillRect(p.x - 4, p.y - 3, 2.5, 6);
    }
  }
  // three of five answer: a bright pulse travels back to the lantern
  for (const i of ANSWER) {
    const j = ANSWER.indexOf(i);
    const u = clamp01((tq - (b.three + 0.1 + j * 0.15)) / 0.9);
    if (u <= 0 || u >= 1) continue;
    const p = cordAt(from.x, from.y, ends[i].x, ends[i].y, 30, 1 - sm(u));
    glowDot(c, p.x, p.y, 16, mixLab(cy, '#ffffff', 0.4), 0.9);
  }
  void t;
}
/** one great paper wall: Cloudflare's network, around the whole diagram; a gate on the right where the road leaves */
function greatWall(c: C2, env: PaintEnv, a: number): void {
  c.save();
  c.globalAlpha = a;
  const col = mixLab(paper(env, 0.35), tone(env, SEA_CYAN, 0.4), 0.25);
  c.strokeStyle = col;
  c.lineWidth = 5;
  c.lineJoin = 'miter';
  const W = WALL;
  c.beginPath();
  // the right side leaves a gate gap at y 470..540
  c.moveTo(W.x1, 470);
  c.lineTo(W.x1, W.y0);
  // crenellated top
  for (let x = W.x1; x > W.x0; x -= 40) {
    c.lineTo(x, W.y0);
    c.lineTo(x, W.y0 - 12);
    c.lineTo(x - 20, W.y0 - 12);
    c.lineTo(x - 20, W.y0);
  }
  c.lineTo(W.x0, W.y0);
  c.lineTo(W.x0, W.y1);
  c.lineTo(W.x1, W.y1);
  c.lineTo(W.x1, 540);
  c.stroke();
  // gate posts and the open road leaving the wall
  c.fillStyle = col;
  c.fillRect(W.x1 - 4, 458, 14, 12);
  c.fillRect(W.x1 - 4, 540, 14, 12);
  c.strokeStyle = withAlpha(paper(env, 0.15), 0.85);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(W.x1 - 30, 512);
  c.bezierCurveTo(W.x1 + 80, 512, W.x1 + 160, 470, W.x1 + 320, 430);
  c.stroke();
  c.restore();
}
