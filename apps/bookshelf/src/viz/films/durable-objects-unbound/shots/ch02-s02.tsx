/**
 * ch02-s02 — the chat room on Kenton Varda's desk, 2020 (candleAmber, cut): the harbour's room in history.
 *
 * Same study (sets/ch02-s01-study.ts), closer: a paper Room Lantern (sets/roomLantern.ts) stands on the desk beside
 * the laptop, candlelight inside, four members. Kenton Varda stays screen-left, soft behind a veil of lamp haze.
 * Slow dolly in on the lantern; on 'Notice' a push into it.
 *
 *   demo        quote card Q02 upper-right
 *   broadcast   one member's slip rises to the lantern's centre; three copies flutter out to the other members
 *   threads     threads of light join each member to the centre (they carry the copies)
 *   match       the desk falls away: for a moment the lantern stands in House C's night window, then the desk returns
 *   notice      the paper fades to a frame: the inside is a small lit stage
 *   interleave  a handler's slip in two halves: the first half is set down, the second waits; another member's slip
 *               slides in between; the second half lands after it (a thread arches over the intruder)
 * Cut-paper only, no text on the slips. Lantern centre about 45 % height; nothing below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, defineShot, mixLab, quoteCard, toScreen, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { camAt, clamp01, cord, glowDot, lerp, paper, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { roomLantern, lanternPt } from '../sets/roomLantern';
import { paintStudy } from '../sets/ch02-s01-study';

const ID = 'ch02-s02';
/** the lantern on the desk top, between the laptop and the lamp */
const L = { x: 492, y: 459, s: 2.0 };
const H = 86, W = 60;
/** members (lantern-local units, roomLantern's MEMBERS 0..3): head centres */
const HEADS = [
  { x: -12.6, y: -37.9 },
  { x: 12, y: -35.4 },
  { x: -2.4, y: -41.2 },
  { x: 5.4, y: -33.2 },
];
const CENTRE = { x: 0, y: -H * 0.5 };
const FLOOR = -27;

const C0: Camera3 = { x: 457, y: 394, z: 420, lens: 1 };
const C1: Camera3 = { x: 462, y: 392, z: 476, lens: 1 };
const C2c: Camera3 = { x: 492, y: 402, z: 762, lens: 1 };
const C3: Camera3 = { x: 492, y: 402, z: 790, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      demo: T.beat('demo'),
      threads: T.beat('threads'),
      broadcast: T.beat('broadcast'),
      match: T.beat('match'),
      notice: T.beat('notice'),
      interleave: T.beat('interleave'),
      transaction: T.word('L0209', 'transaction'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: C0 },
      { t: b.notice - 0.2, cam: C1 },
      { t: b.notice + 2.4, cam: C2c },
      { t: b.D, cam: C3 },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const match = seg(t, b.match - 0.25, b.match + 0.5) * (1 - seg(t, b.match + 2.7, b.match + 3.5));
    const cut = seg(t, b.notice - 0.1, b.notice + 1.1);
    const threads = seg(t, b.broadcast - 0.3, b.broadcast + 0.3) * (1 - seg(t, b.match - 0.6, b.match));
    paintStudy(
      f,
      { cam, cams: cams.map((k) => k.cam), era: 2020, lamp: 0.45 * (1 - match * 0.8), screen: 0.4, think: 0.15 },
      {
        L4: (c, env) => {
          if (match > 0.01) harbourWindow(c, env, match);
          roomLantern(c, env, { ...L, lit: 1, members: 4, tq, threads, cutaway: cut * 0.85, door: 0 });
          inside(c, env, t, tq, b, cut);
        },
      },
    );
    const fl = lanternPt(L, 'flame');
    f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 23, intensity: 0.5 - 0.15 * cut, radius: 46, layer: 'L4' });
    // Kenton Varda soft at the left edge: a veil of lamp haze over him (he is not the subject)
    const c = f.c;
    const head = toScreen(LAYERS.L4, cam, 288, 400);
    c.save();
    const g = c.createLinearGradient(Math.max(0, head.x - 260), 0, head.x + 200, 0);
    g.addColorStop(0, withAlpha(f.mood.haze, 0.42));
    g.addColorStop(1, withAlpha(f.mood.haze, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, Math.max(0, head.x + 200), 720);
    c.restore();
    quoteCard(c, { quote: 'The logical unit of state in a chat app is a chat room.', speaker: 'Kenton Varda, 2020', x: 770, y: 128, width: 420, align: 'left', at: b.demo - 0.1, dur: b.match - 1.0 - b.demo, fade: 0.5 }, { t, mood: f.mood });
  },
});

/** House C's night window around the lantern for a moment (the desk lantern IS the harbour's room) */
function harbourWindow(c: C2, env: PaintEnv, a: number): void {
  c.save();
  c.globalAlpha = a;
  const night0 = '#1d2833', night1 = '#4d6273';
  const R = { x: 40, y: 110, w: 940, h: 580 };
  const sky = c.createLinearGradient(0, R.y, 0, R.y + R.h);
  sky.addColorStop(0, night0);
  sky.addColorStop(0.75, night1);
  sky.addColorStop(1, '#2a3540');
  c.fillStyle = sky;
  c.fillRect(R.x, R.y, R.w, R.h);
  // the far terrace roofs and the moon low-left through the window
  glowDot(c, 410, 330, 28, '#e9f0f2', 0.9);
  c.fillStyle = '#161e26';
  c.beginPath();
  c.moveTo(R.x, 470);
  for (let x = R.x; x <= R.x + R.w; x += 30) c.lineTo(x, 440 - 30 * Math.sin(x * 0.011) - (x > 600 ? 20 : 0));
  c.lineTo(R.x + R.w, R.y + R.h);
  c.lineTo(R.x, R.y + R.h);
  c.closePath();
  c.fill();
  // the house wall with the window opening around the lantern
  const p = new Path2D();
  p.rect(R.x - 400, R.y - 300, R.w + 800, R.h + 600);
  const wx0 = L.x - 98, wx1 = L.x + 98, wy0 = L.y - 210, wy1 = L.y + 4;
  p.rect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  c.fillStyle = '#10161c';
  c.fill(p, 'evenodd');
  // mullion and sill, the moon catching the sill's top
  c.fillStyle = '#10161c';
  c.fillRect(L.x - 2, wy0, 4, wy1 - wy0);
  c.fillRect(wx0, (wy0 + wy1) / 2 - 2, wx1 - wx0, 4);
  c.fillRect(wx0 - 12, wy1, wx1 - wx0 + 24, 10);
  c.strokeStyle = 'rgba(190,210,225,0.45)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(wx0 - 12, wy1);
  c.lineTo(wx1 + 12, wy1);
  c.stroke();
  c.restore();
  void env;
}

/** inside the lantern: the broadcast, then the interleaved handler (lantern-local units) */
function inside(c: C2, env: PaintEnv, t: number, tq: number, b: { broadcast: number; notice: number; interleave: number; transaction: number }, cut: number): void {
  c.save();
  c.translate(L.x, L.y);
  c.scale(L.s, L.s);
  // --- broadcast: m0's slip rises to the centre, three copies go out along the threads
  const up = clamp01((tq - (b.broadcast - 0.1)) / 0.6);
  const out = clamp01((tq - (b.broadcast + 0.6)) / 1.0);
  const gone = 1 - seg(t, b.broadcast + 2.6, b.broadcast + 3.2);
  if (up > 0 && gone > 0.01) {
    const from = HEADS[0];
    if (out <= 0) {
      const e = sm(up);
      miniSlip(c, env, lerp(from.x + 3, CENTRE.x, e), lerp(from.y + 8, CENTRE.y, e), 7, 0.2 * (1 - e), gone);
    }
    for (let i = 1; i < 4 && out > 0; i++) {
      const e = sm(out);
      const to = HEADS[i];
      miniSlip(c, env, lerp(CENTRE.x, to.x, e), lerp(CENTRE.y, to.y + 6, e), 6, Math.sin(tq * 9 + i) * 0.25 * (1 - e), gone);
    }
    if (out > 0) glowDot(c, CENTRE.x, CENTRE.y, 9, tone(env, '#fff1cc', 0.05), 0.6 * (1 - out));
  }
  // --- the stage: the floor of the lantern lit; the handler's slip in two halves; another member's slip
  if (cut > 0.01) {
    c.globalAlpha = cut;
    c.strokeStyle = withAlpha(mixLab(env.fill('rim'), '#ffd9a0', 0.4), 0.5);
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(-20, FLOOR + 2.4);
    c.lineTo(20, FLOOR + 2.4);
    c.stroke();
    const hand = { x: HEADS[0].x + 4, y: HEADS[0].y - 1 };
    const appear = seg(t, b.notice + 1.2, b.notice + 1.8);
    // half 1: set down on 'wait'
    const d1 = sm(clamp01((tq - (b.interleave - 0.35)) / 0.6));
    const h1 = { x: lerp(hand.x, -13, d1), y: lerp(hand.y, FLOOR, d1) };
    // half 2: held (it waits), then lands after the intruder
    const land2 = b.interleave + 2.4;
    const d2 = sm(clamp01((tq - land2) / 0.6));
    const bob = (1 - d2) * Math.sin(tq * 3) * 0.6 * seg(t, b.interleave, b.interleave + 0.3);
    const h2 = { x: lerp(hand.x + 6.5, 9.5, d2), y: lerp(hand.y + bob, FLOOR, d2) };
    // another member's slip slides along the floor into the gap
    const di = sm(clamp01((tq - (b.interleave + 0.9)) / 0.9));
    const intr = { x: lerp(20, -2, di), y: FLOOR };
    if (di > 0) miniSlip(c, env, intr.x, intr.y, 6.5, 0, appear * sm(di * 3), true);
    if (appear > 0) {
      halfSlip(c, env, h1.x, h1.y, 'L', appear);
      halfSlip(c, env, h2.x, h2.y, 'R', appear);
      // the handler's thread: one handler, two steps, something else between
      const th = seg(t, land2 + 0.5, land2 + 1.2);
      if (th > 0) {
        c.globalAlpha = cut * th;
        cord(c, h1.x + 2.5, h1.y - 2.5, h2.x - 2.5, h2.y - 2.5, -9, withAlpha(mixLab('#3a2615', env.mood.fg, 0.1), 0.85), 0.45, th);
      }
    }
  }
  c.restore();
  void W;
}
function miniSlip(c: C2, env: PaintEnv, x: number, y: number, w: number, rot: number, a: number, other = false): void {
  if (a <= 0.01) return;
  const h = w * 0.5;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = other ? mixLab(paper(env, 0.05), '#d7a76a', 0.45) : mixLab(paper(env, 0), '#fff4dc', 0.3);
  c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = withAlpha('#24160a', 0.85);
  c.lineWidth = 0.4;
  c.strokeRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = withAlpha('#3a2615', 0.55);
  c.lineWidth = 0.35;
  c.beginPath();
  c.moveTo(-w * 0.35, -h * 0.1);
  c.lineTo(w * 0.25, -h * 0.1);
  c.moveTo(-w * 0.35, h * 0.2);
  c.lineTo(w * 0.05, h * 0.2);
  c.stroke();
  c.restore();
}
/** one half of a torn slip (side L or R: the torn edge faces the other half) */
function halfSlip(c: C2, env: PaintEnv, x: number, y: number, side: 'L' | 'R', a: number): void {
  const w = 5.5, h = 3.6;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.fillStyle = mixLab(paper(env, 0), '#fff4dc', 0.3);
  c.beginPath();
  if (side === 'L') {
    c.moveTo(-w / 2, -h / 2);
    c.lineTo(w / 2, -h / 2);
    c.lineTo(w / 2 - 0.8, -h / 6);
    c.lineTo(w / 2 + 0.3, h / 6);
    c.lineTo(w / 2 - 0.5, h / 2);
    c.lineTo(-w / 2, h / 2);
  } else {
    c.moveTo(w / 2, -h / 2);
    c.lineTo(-w / 2, -h / 2);
    c.lineTo(-w / 2 - 0.8 + 0.8, -h / 6);
    c.lineTo(-w / 2 - 0.3, h / 6);
    c.lineTo(-w / 2 + 0.5, h / 2);
    c.lineTo(w / 2, h / 2);
  }
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha('#24160a', 0.85);
  c.lineWidth = 0.4;
  c.stroke();
  c.strokeStyle = withAlpha('#3a2615', 0.55);
  c.lineWidth = 0.35;
  c.beginPath();
  c.moveTo(-w * 0.3, -h * 0.05);
  c.lineTo(w * 0.3, -h * 0.05);
  c.stroke();
  c.restore();
}
