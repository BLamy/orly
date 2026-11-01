/**
 * ch02-s04 — September 2022, then September 2024 (candleAmber, inkBleed in): the runtime that could leave, the
 * room that could not, then SQLite inside the room.
 *
 * Kenton Varda's study (sets/ch02-s01-study.ts), the lamp a little cooler. A cut-paper RUNTIME HOUSE FRAME (walls and
 * roof, empty) stands on the desk beside the Room Lantern. Two slow left-to-right trucks, one per era; the era
 * change is an ink bleed across the window that fills the frame.
 *
 *   date22   '27 September 2022' top-right;  q04  quote card Q04 upper-left (until s24)
 *   leave    the house frame hops along the desk and out of the window, up a paper road to a far hill (L1)
 *   (room)   the Room Lantern follows it out, alone
 *   tether   on 'only' the lantern stands in the one house on the one hill, its thread tied there; the next hill is
 *            bare: no second house to take the room if that one goes dark
 *   single   the lone flame is ringed once
 *   s24      ink bleeds across the window and fills the frame; '26 September 2024'; the hill is gone; the lantern
 *            is back on the desk (Cloudflare's own room again)
 *   book     a small bound book (SQLite) slides into the lantern beside the members, lit by the same flame
 *   local    a member's slip touches the book and is back at once (twice); quote card Q05 upper-left
 *   door     push to the lantern's door: the reply letter still waits at the latch
 * No implementation badge on the 2022 runtime (the narration names workerd; the house is the runtime). Nothing
 * below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, defineShot, mixLab, quoteCard, toScreen, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { camAt, clamp01, cord, glowDot, lerp, paper, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { roomLantern, lanternPt } from '../sets/roomLantern';
import { lanternDoor, latchPt, letter } from '../sets/heldLetter';
import { book } from '../sets/walRibbon';
import { paintStudy } from '../sets/ch02-s01-study';
import { dateStamp, h01 } from '../sets/ch02-s01-kit';

const ID = 'ch02-s04';
const DESK_Y = 459;
const L = { x: 470, y: DESK_Y, s: 1.4 };
const HOUSE0 = { x: 400, y: DESK_Y };
const DESK_END = { x: 570, y: DESK_Y };
const DOOR = { x: 489, y: DESK_Y - 14, s: 0.25 };
const LATCH = latchPt(DOOR);
/** the far hill and its road (L1 coordinates; L1 barely parallaxes) */
const HILL = { x: 870, top: 384 };
const ROAD0 = { x: 640, y: 478 };
function roadAt(u: number): { x: number; y: number } {
  // a winding road from below the window up to the hill top
  const x = lerp(ROAD0.x, HILL.x - 6, u) + Math.sin(u * Math.PI * 2) * 26 * (1 - u);
  const y = lerp(ROAD0.y, HILL.top + 3, sm(u));
  return { x, y };
}

const A0: Camera3 = { x: 560, y: 384, z: 120, lens: 1 };
const A1: Camera3 = { x: 610, y: 380, z: 150, lens: 1 };
const A2: Camera3 = { x: 760, y: 368, z: 150, lens: 1.6 };
const A3: Camera3 = { x: 780, y: 366, z: 160, lens: 1.66 };
const B0: Camera3 = { x: 452, y: 404, z: 590, lens: 1 };
const B1: Camera3 = { x: 470, y: 408, z: 690, lens: 1 };
const B2: Camera3 = { x: 486, y: 428, z: 800, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      date22: T.beat('date22'),
      q04: T.beat('q04'),
      leave: T.beat('leave'),
      tether: T.beat('tether'),
      single: T.beat('single'),
      s24: T.beat('s24'),
      book: T.beat('book'),
      local: T.beat('local'),
      door: T.beat('door'),
      room: T.word('L0216', 'room'),
    };
    const swap = b.s24 + 0.45;
    const camsA: CamKey[] = [
      { t: 0, cam: A0 },
      { t: b.leave - 0.4, cam: A1 },
      { t: b.tether + 1.2, cam: A2 },
      { t: swap, cam: A3 },
    ];
    const camsB: CamKey[] = [
      { t: swap, cam: B0 },
      { t: b.local - 0.6, cam: B1 },
      { t: b.door - 0.6, cam: { ...B1, x: B1.x + 10 } },
      { t: b.D, cam: B2 },
    ];
    return { tl, b, swap, camsA, camsB };
  },
  paint(f, _s, sc) {
    const { b, swap, camsA, camsB } = sc;
    const t = f.t;
    const tq = twos(t);
    const era24 = t >= swap;
    const cam = era24 ? camAt(camsB, t) : camAt(camsA, t);
    const cams = era24 ? camsB.map((k) => k.cam) : camsA.map((k) => k.cam);
    // the runtime house: hops along the desk (L4) from 'leave', then up the road (L1)
    const hop1 = clamp01((tq - (b.leave - 0.1)) / 1.2);
    const road1 = clamp01((tq - (b.leave + 1.25)) / 1.7);
    // the lantern follows on 'room', arriving as 'only' is said
    const hop2 = clamp01((tq - (b.room - 0.25)) / 0.75);
    const road2 = clamp01((tq - (b.room + 0.55)) / Math.max(0.6, b.tether - 0.1 - (b.room + 0.55)));
    const hillUp = seg(t, b.leave - 0.3, b.leave + 0.7);
    const ring = seg(t, b.single - 0.05, b.single + 0.9);
    const cut = era24 ? seg(t, b.book - 1.0, b.book) * 0.55 : 0;
    paintStudy(
      f,
      { cam, cams, era: era24 ? 2024 : 2022, lamp: era24 ? 0.6 : 0.62, screen: 0.4, think: era24 ? 0.25 : 0.1 },
      {
        L1: (c, env) => {
          if (era24) return;
          farHill(c, env, hillUp, t);
          if (road2 > 0) {
            const e = sm(road2);
            const p = roadAt(e);
            const at = road2 >= 1;
            const lx = at ? HILL.x - 6 : p.x, ly = at ? HILL.top - 6 : p.y + hopY(tq, 1) * 0.4;
            const ls = lerp(0.5, 0.33, e);
            // the thread tied to a peg on the hill (the room tethered to its one house)
            const th = seg(t, b.tether - 0.2, b.tether + 0.5);
            if (th > 0) cord(c, lx + 8, ly - 4, HILL.x + 26, HILL.top + 8, 6, withAlpha(tone(env, '#f2d29a', 0.2), 0.85), 1.1, th);
            roomLantern(c, env, { x: lx, y: ly, s: ls, lit: 1, members: 3, tq, alpha: seg(road2, 0, 0.08), hook: false });
            if (ring > 0 && ring < 1) {
              const fl = lanternPt({ x: lx, y: ly, s: ls }, 'flame');
              c.save();
              c.strokeStyle = withAlpha(tone(env, '#f6dca0', 0.1), 0.9 * Math.sin(Math.PI * ring));
              c.lineWidth = 1.4;
              c.beginPath();
              c.arc(fl.x, fl.y, 10 + 18 * ring, 0, Math.PI * 2);
              c.stroke();
              c.restore();
            }
          }
          // the house on the road
          if (road1 > 0) {
            const p = roadAt(sm(road1));
            houseFrame(c, env, p.x, p.y + hopY(tq, road1 < 1 ? 1 : 0) * 0.5, lerp(0.85, 1.0, sm(road1)), seg(road1, 0, 0.08), tq, road1 < 1, true);
          }
        },
        L4: (c, env) => {
          if (!era24) {
            // the runtime house frame and the lantern on the desk, then their hop to the desk's end
            if (road1 <= 0) {
              const e = sm(hop1);
              const x = lerp(HOUSE0.x, DESK_END.x, e);
              houseFrame(c, env, x, DESK_Y + hopY(tq, hop1 > 0 && hop1 < 1 ? 1 : 0) * 1.6 - (hop1 >= 1 ? 26 : 0), 1, 1 - seg(hop1, 0.92, 1), tq, hop1 > 0 && hop1 < 1);
            }
            if (road2 <= 0) {
              const e = sm(hop2);
              const x = lerp(L.x, DESK_END.x, e);
              roomLantern(c, env, { ...L, x, y: DESK_Y + hopY(tq, hop2 > 0 ? 1 : 0) * 1.2, lit: 1, members: 3, tq, alpha: 1 - seg(hop2, 0.9, 1) });
            }
          } else {
            // 2024: the lantern back on the desk, its door, the book (SQLite) and the local read
            roomLantern(c, env, { ...L, lit: 1, members: 3, tq, cutaway: cut, door: 0 });
            inside24(c, env, t, tq, b);
            lanternDoor(c, env, { ...DOOR, latch: 0, glow: 0.7 });
            const arr = sm(clamp01((tq - (b.door - 3.6)) / 1.0));
            if (arr > 0) letter(c, env, { x: lerp(L.x + 4, LATCH.x + 1.5, arr), y: lerp(L.y - 54, LATCH.y - 5, arr), s: 0.3, rot: -0.12 - 0.3 * (1 - arr), alpha: seg(t, b.door - 3.6, b.door - 3.3) });
          }
        },
      },
    );
    if (era24 || (road2 <= 0 && hop2 < 0.95)) {
      const fl = lanternPt(L, 'flame');
      f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 31, intensity: 0.38, radius: 34, layer: 'L4' });
    }
    // the era change: ink bleeds in across the window, fills the frame, and clears onto 2024
    const c = f.c;
    const inkU = seg(t, b.s24 - 0.5, swap) * (1 - seg(t, swap + 0.05, swap + 1.2));
    if (inkU > 0.01) {
      const w0 = toScreen(LAYERS.L2, cam, 600, 120), w1 = toScreen(LAYERS.L2, cam, 1330, 452);
      inkBleed(c, inkU, t, w0, w1);
    }
    // ---------------------------------------------------------------- type
    const sw = { a: seg(t, b.date22, b.date22 + 0.5) * (1 - seg(t, b.s24 - 0.3, b.s24)), b: seg(t, swap + 0.4, swap + 0.9) * (1 - seg(t, b.local - 1.0, b.local - 0.4)) };
    dateStamp(c, f.mood, { id: `${ID}-date22`, text: '27 September 2022', x: 1222, y: 66, alpha: sw.a });
    dateStamp(c, f.mood, { id: `${ID}-date24`, text: '26 September 2024', x: 1222, y: 66, alpha: sw.b });
    quoteCard(c, { quote: 'workerd is Open Source under the Apache License version 2.0.', speaker: 'Kenton Varda, 2022', x: 72, y: 150, width: 470, align: 'left', at: b.q04 - 0.1, dur: b.s24 - 0.6 - b.q04, fade: 0.45 }, { t, mood: f.mood });
    quoteCard(c, { quote: 'Latency is effectively zero', speaker: 'Kenton Varda, 2024', x: 72, y: 140, width: 470, align: 'left', at: b.local - 0.1, dur: b.door - 0.5 - b.local, fade: 0.45 }, { t, mood: f.mood });
  },
});

const hopY = (tq: number, on: number) => (on ? -Math.abs(Math.sin(tq * Math.PI * 2.4)) * 6 : 0);

/** the runtime: a cut-paper house frame (walls and roof, empty inside) with two small feet */
function houseFrame(c: C2, env: PaintEnv, x: number, y: number, s: number, a: number, tq: number, walking: boolean, dark = false): void {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.scale(s, s);
  const col = dark ? mixLab(env.mood.fg, env.mood.set, 0.35) : mixLab(paper(env, 0.1), '#f0d6a6', 0.25);
  c.strokeStyle = col;
  c.lineWidth = 3.2;
  c.lineJoin = 'miter';
  // feet
  const step = walking ? Math.sin(tq * Math.PI * 2.4) : 0;
  c.fillStyle = env.fill('ink');
  c.fillRect(-12 + step * 3, -6, 5, 6);
  c.fillRect(7 - step * 3, -6, 5, 6);
  c.beginPath();
  c.moveTo(-20, -6);
  c.lineTo(-20, -40);
  c.lineTo(0, -60);
  c.lineTo(20, -40);
  c.lineTo(20, -6);
  c.closePath();
  c.stroke();
  // a door hole outline and the eave line
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(-6, -6);
  c.lineTo(-6, -24);
  c.lineTo(6, -24);
  c.lineTo(6, -6);
  c.moveTo(-23, -38);
  c.lineTo(23, -38);
  c.stroke();
  c.restore();
}

/** a paper hill and its road (L1), rising from the window's foot; a second, bare hill beyond */
function farHill(c: C2, env: PaintEnv, u: number, t: number): void {
  if (u <= 0.01) return;
  c.save();
  const rise = (1 - sm(u)) * 60;
  c.translate(0, rise);
  c.globalAlpha = sm(u);
  const hillCol = mixLab(env.mood.set, env.mood.fg, 0.3);
  // the bare second hill (no house on it)
  c.fillStyle = mixLab(hillCol, env.mood.haze, 0.3);
  c.beginPath();
  c.moveTo(900, 500);
  c.quadraticCurveTo(1010, 392, 1120, 500);
  c.closePath();
  c.fill();
  // the main hill
  c.fillStyle = hillCol;
  c.beginPath();
  c.moveTo(540, 500);
  c.bezierCurveTo(700, 492, 800, HILL.top + 2, HILL.x, HILL.top + 2);
  c.bezierCurveTo(940, HILL.top + 2, 990, 470, 1060, 500);
  c.closePath();
  c.fill();
  // the paper road
  c.strokeStyle = withAlpha(paper(env, 0.05), 0.9);
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  for (let k = 0; k <= 30; k++) {
    const p = roadAt(k / 30);
    if (k === 0) c.moveTo(p.x, p.y);
    else c.lineTo(p.x, p.y);
  }
  c.stroke();
  // the peg the room's thread is tied to
  c.fillStyle = env.fill('ink');
  c.fillRect(HILL.x + 24, HILL.top + 2, 3, 9);
  // the rim on the hill tops (the dusk)
  c.strokeStyle = withAlpha(env.fill('rim'), 0.35);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(790, HILL.top + 14);
  c.bezierCurveTo(820, HILL.top + 3, 850, HILL.top + 2, HILL.x, HILL.top + 2);
  c.bezierCurveTo(900, HILL.top + 2, 930, HILL.top + 6, 950, HILL.top + 16);
  c.stroke();
  c.restore();
  void t;
}

/** ink blots spreading from the window's edges until they cover the frame (L2 world, the window region) */
function inkBleed(c: C2, u: number, t: number, w0: { x: number; y: number }, w1: { x: number; y: number }): void {
  c.save();
  c.fillStyle = '#160d07';
  for (let i = 0; i < 16; i++) {
    const cx = lerp(w0.x, Math.min(1280, w1.x), h01(i, 3)), cy = lerp(w0.y, w1.y, h01(i, 4));
    const r = (60 + h01(i, 9) * 160) * Math.min(1.6, u * (1.1 + h01(i, 1)));
    if (r <= 1) continue;
    c.globalAlpha = Math.min(1, u * 1.6);
    c.beginPath();
    for (let k = 0; k <= 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      const rr = r * (1 + 0.18 * Math.sin(a * 5 + i) + 0.08 * Math.sin(a * 11 + t * 0.5));
      if (k === 0) c.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      else c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
  }
  if (u > 0.6) {
    c.globalAlpha = sm((u - 0.6) / 0.4);
    c.fillRect(-1000, -1000, 4000, 3000);
  }
  c.restore();
}

/** 2024 inside the lantern: the book slides in beside the members; a member's slip touches it, back at once */
function inside24(c: C2, env: PaintEnv, t: number, tq: number, b: { book: number; local: number }): void {
  const s = L.s;
  const slide = sm(clamp01((tq - (b.book - 0.3)) / 0.9));
  if (slide > 0) {
    const bx = lerp(L.x + 70, L.x + 13 * s, slide), by = L.y - 11 * s;
    book(c, env, { x: bx, y: by, s: 0.55, alpha: seg(slide, 0, 0.2) });
    if (slide >= 1) glowDot(c, bx, by - 6, 16, tone(env, '#ffcf8a', 0.1), 0.25);
  }
  // the local read: twice, each a touch and an immediate return
  for (let k = 0; k < 2; k++) {
    const u = clamp01((tq - (b.local - 0.15 + k * 1.1)) / 0.5);
    if (u <= 0 || u >= 1) continue;
    const head = { x: L.x + 12 * s, y: L.y - 35 * s };
    const bk = { x: L.x + 13 * s, y: L.y - 11 * s - 8 };
    const e = Math.sin(Math.PI * u);
    const x = lerp(head.x, bk.x, e), y = lerp(head.y, bk.y, e);
    c.save();
    c.fillStyle = mixLab(paper(env, 0), '#fff4dc', 0.3);
    c.strokeStyle = withAlpha('#24160a', 0.85);
    c.lineWidth = 0.6;
    c.fillRect(x - 5, y - 2.5, 10, 5);
    c.strokeRect(x - 5, y - 2.5, 10, 5);
    c.restore();
    if (u > 0.4 && u < 0.6) glowDot(c, bk.x, bk.y, 10, tone(env, '#fff1cc', 0.05), 0.6);
  }
  void t;
}
