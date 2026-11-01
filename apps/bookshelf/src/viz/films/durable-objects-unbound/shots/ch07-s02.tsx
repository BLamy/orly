/**
 * ch07-s02 — the price of the Well in workerd's cluster, then the hinge into celld's town (winterBlue, cut).
 *
 * Cut on the crown lamp: the square, the Plate above the Well (C · 9 · 9, crown lit: continuity from ch07-s01),
 * C's pulley line from the live owner down to the wellhead. A long brass measuring rod lies along the front of the
 * square (the action plane, above the caption band): NO numbers, NO scale marks.
 *
 *   badgeW   the 'workerd · 28 Oct' tag hanging from the rod's end swings and catches the light (named)
 *   bar      a held letter's journey inks onto the rod: a thin sliver (local work in the lantern), then a long
 *            segment while a scroll rides C's pulley line down into the Well, then a short hook up (the second look:
 *            the Plate's tiles glint), and the small bell at the bar's end rings
 *   dotted   a dotted outline doubles the bar's edges: proportions only, nothing measured (sliver, then long walk
 *            pulse on their words)
 *   shore    the camera trucks right past the L6 lamp-post (the occluder) and lifts to a far headland across the
 *            water (L1): five small far lamps glow serverCyan, tagged 'Cloudflare, hosted' — the 2024 relay
 *            remembered, never drawn as the harbour town
 *   turn     back past the lamp-post to the terrace: the two upper windows beside A's (B's and C's) brighten
 *   lamps    'Change the lamps': the backlight sinks toward the fg while every silhouette holds (completed in ch07-s03)
 * Text: only the two badges. Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, defineShot, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { paintTown, pulleyAt } from '../sets/harbourTown';
import { houseBell, bellSwing } from '../sets/heldLetter';
import { scroll } from '../sets/walRibbon';
import { BRASS_HI, SEA_CYAN, badge, bakeRect, brass, camAt, clamp01, glowDot, lerp, pulse, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';

const ID = 'ch07-s02';
/** the rod along the front of the square (L4) */
const ROD = { x0: 128, x1: 868, y: 630, h: 14 };
/** the bar's stations along the rod: the sliver (local work), the long walk (to the Well), the hook (second look) */
const BAR = { a: 146, b: 170, c: 700, hookX: 744, hookUp: 34 };
const BELL = { x: 772, y: 572 };
/** the tag's upright on the rod's left end */
const TAG = { x: 198, y: 558 };
/** the far headland across the water (L1) and its five far lamps */
const HEAD = { x0: 960, x1: 1620, peak: 64, foot: 392 };
/** final review r1: the sea's waterline at the headland's foot (L1), so water shows between the town's ridge and the relay */
/** the hosted tag's hook, in the far plane's coordinates */
const HOSTED = { x: 1190, y: 132 };
const SEA = { y: 242, x0: 250, fade: 520, x1: 1760, y1: 470 };
const FAR = [1086, 1136, 1190, 1242, 1294].map((x, i) => ({ x, y: 108 + [8, 0, -6, -1, 7][i] }));

const SQ: Camera3 = { x: 600, y: 470, z: 100, lens: 1 };
const SQ2: Camera3 = { x: 636, y: 462, z: 140, lens: 1 };
const SHORE: Camera3 = { x: 1500, y: 170, z: 60, lens: 1 };
const SHORE2: Camera3 = { x: 1518, y: 164, z: 80, lens: 1 };
const TERR: Camera3 = { x: 640, y: 404, z: 40, lens: 1 };
const TERR2: Camera3 = { x: 646, y: 408, z: 78, lens: 1 };

function headY(x: number): number {
  const u = (x - HEAD.x0) / (HEAD.x1 - HEAD.x0);
  if (u <= 0 || u >= 1) return HEAD.foot;
  return HEAD.foot - (HEAD.foot - HEAD.peak) * Math.pow(Math.sin(Math.PI * u), 0.7) - 6 * Math.sin(x * 0.05);
}
function headland(c: C2, env: PaintEnv) {
  c.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.15);
  c.beginPath();
  c.moveTo(HEAD.x0 - 40, HEAD.foot + 6);
  for (let x = HEAD.x0 - 40; x <= HEAD.x1 + 40; x += 6) c.lineTo(x, Math.min(HEAD.foot + 6, headY(x)));
  c.lineTo(HEAD.x1 + 40, HEAD.foot + 6);
  c.closePath();
  c.fill();
}

/** the far water (L1), baked: a bright waterline, darkening toward the viewer, feathered away at its left end */
function seaBand(c: C2, env: PaintEnv) {
  const set = env.fill('set');
  const g = c.createLinearGradient(0, SEA.y, 0, SEA.y1);
  g.addColorStop(0, mixLab(set, env.mood.haze, 0.3));
  g.addColorStop(0.14, mixLab(set, env.mood.fg, 0.22));
  g.addColorStop(1, mixLab(set, env.mood.fg, 0.6));
  c.fillStyle = g;
  c.fillRect(SEA.x0, SEA.y, SEA.x1 - SEA.x0, SEA.y1 - SEA.y);
  c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.3), 0.55);
  c.fillRect(SEA.x0, SEA.y, SEA.x1 - SEA.x0, 1.6);
  c.globalCompositeOperation = 'destination-in';
  const h = c.createLinearGradient(SEA.x0, 0, SEA.x0 + SEA.fade, 0);
  h.addColorStop(0, 'rgba(0,0,0,0)');
  h.addColorStop(1, 'rgba(0,0,0,1)');
  c.fillStyle = h;
  c.fillRect(SEA.x0 - 2, SEA.y - 2, SEA.x1 - SEA.x0 + 4, SEA.y1 - SEA.y + 4);
  c.globalCompositeOperation = 'source-over';
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      badgeW: T.beat('badgeW'),
      bar: T.beat('bar'),
      well: T.word('L0708', 'well'),
      second: T.word('L0708', 'second'),
      plate: T.word('L0708', 'plate'),
      dotted: T.beat('dotted'),
      sliver: T.word('L0709', 'sliver'),
      walk: T.word('L0709', 'long'),
      cloud: T.word('L0710', "cloudflare's"),
      shore: T.beat('shore'),
      turn: T.beat('turn'),
      too: T.word('L0711', 'followers'),
      lamps: T.beat('lamps'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: SQ },
      { t: b.cloud - 0.5, cam: SQ2 },
      { t: b.shore + 1.9, cam: SHORE },
      { t: b.turn - 0.45, cam: SHORE2 },
      { t: b.turn + 2.6, cam: TERR },
      { t: b.D, cam: TERR2 },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // ---- the bar: sliver → long walk → hook, then the bell
    const uSliver = clamp01((t - (b.bar - 0.1)) / 0.35);
    const uLong = clamp01((t - (b.bar + 0.3)) / (b.second - 0.15 - (b.bar + 0.3)));
    const uHook = clamp01((t - (b.second - 0.1)) / 0.65);
    const ring = b.plate + 0.15;
    const dotted = seg(t, b.dotted - 0.1, b.dotted + 0.5);
    const glowS = pulse(t, b.sliver - 0.1, 0.2, 0.5, 0.7);
    const glowL = pulse(t, b.walk - 0.1, 0.25, 0.6, 0.8);
    // the scroll that the long segment stands for, riding C's line down into the Well
    const ride = sm((tq - (b.bar + 0.3)) / (b.well - (b.bar + 0.3) + 0.1));
    const far = seg(t, b.cloud + 0.2, b.shore + 0.6) * (1 - seg(t, b.turn + 1.2, b.turn + 2.4));
    const ups = seg(t, b.too - 0.3, b.too + 0.9);
    const sky = 1 - 0.72 * seg(t, b.lamps - 0.1, b.D - 0.2);

    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 0, B: 0, C: 1, Bup: 0.5 * ups, Cup: 0.5 * ups },
        lanterns: [{ house: 'C', lit: 1, members: 4, tq: 0, door: 0, s: 0.37 }],
        lines: { A: 1, B: 1, C: 1 },
        plate: { house: 'C', epoch: 9, from: 9, crown: 1, glint: [0, 0.8 * pulse(t, b.plate - 0.25, 0.2, 0.4, 0.7), 0.8 * pulse(t, b.plate - 0.15, 0.2, 0.4, 0.7)] },
        plateLegible: false,
        tooth: null,
        well: { bucket: lerp(0.3, 0.95, seg(t, b.well - 0.2, b.well + 0.6)) * (1 - seg(t, b.well + 1.5, b.well + 2.6)) + 0.3 * seg(t, b.well + 1.5, b.well + 2.6), load: t > b.well - 0.2 && t < b.well + 0.8 ? 'scroll' : 'none', glint: 0.4 },
        badge: null,
        lampPostLit: 0.5,
        sky,
        skip: { L5: true },
      },
      {
        L1: (c, env) => {
          // the far headland across the water and the hosted relay's five far lamps (remembered from ch02)
          bakeRect(f, c, env, `${ID}/headland`, { x: HEAD.x0 - 60, y: HEAD.peak - 20, w: HEAD.x1 - HEAD.x0 + 120, h: HEAD.foot + 20 - HEAD.peak }, (cc) => headland(cc, env));
          if (far > 0.01) {
            // the moonlit water between the ridge and the headland's foot (present only while the relay is remembered)
            c.save();
            c.globalAlpha = far;
            bakeRect(f, c, env, `${ID}/sea`, { x: SEA.x0, y: SEA.y - 2, w: SEA.x1 - SEA.x0, h: SEA.y1 - SEA.y + 2 }, (cc) => seaBand(cc, env));
            c.restore();
            for (let i = 0; i < 9; i++) {
              // slow moon glints on the water, just under the waterline
              const gy = SEA.y + 7 + i * 6.5;
              const gx = 1190 + 250 * Math.sin(i * 2.4) + 14 * Math.sin(t * 0.5 + i * 1.3);
              c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.3), (0.3 - i * 0.02) * far);
              c.fillRect(gx - 26 - i * 3, gy, 52 + i * 6, 1.6);
            }
            FAR.forEach((p, i) => {
              const on = seg(t, b.shore - 0.4 + i * 0.12, b.shore + 0.2 + i * 0.12) * far;
              const fl = 0.9 + 0.1 * Math.sin(t * 2.1 + i * 1.7);
              glowDot(c, p.x, p.y, 24, tone(env, SEA_CYAN, 0.08), 0.95 * on * fl);
              c.fillStyle = withAlpha(mixLab(tone(env, SEA_CYAN, 0.05), '#ffffff', 0.4), on);
              c.fillRect(p.x - 1.2, p.y - 1.2, 2.4, 2.4);
            });
          }
        },
        L4: (c, env) => {
          // the narrated tag tracks its far point (L1, above the headland's foot) but is drawn on this sharp plane: L1 paints
          // through a low-res blur buffer, where the legibility floor would blow it up about 3x at 1080p and clip it
          const tagA = seg(t, b.cloud + 0.4, b.shore + 0.4) * far;
          if (tagA > 0.01) {
            const sp = toScreen(LAYERS.L1, cam, HOSTED.x, HOSTED.y);
            const lp = toLayer(LAYERS.L4, cam, sp.x, sp.y);
            badge(c, env, { x: lp.x, y: lp.y, text: 'Cloudflare, hosted', alpha: tagA, legible: true, s: 1.2, swing: 0.03 * Math.sin(tq * 1.4), id: `${ID}-hosted` });
          }
          // the scroll the long walk stands for: down C's pulley line into the Well
          if (ride > 0.001 && ride < 0.995) {
            const p = pulleyAt(cam, 'C', ride);
            scroll(c, env, { x: p.x, y: p.y + 7, s: lerp(0.7, 0.9, ride), rot: -0.15, tag: 1, alpha: 1 - seg(ride, 0.9, 1) });
          }
          paintRod(c, env, { t, tq, uSliver, uLong, uHook, dotted, glowS, glowL, ring, badgeW: b.badgeW });
        },
      },
    );
    // 'Change the lamps': the light sinks toward the fg while every silhouette holds (ch07-s03 completes it)
    const sink = seg(t, b.lamps - 0.05, b.D - 0.1);
    if (sink > 0.01) {
      f.c.save();
      f.c.globalAlpha = 0.5 * sink;
      f.c.fillStyle = f.mood.fg;
      f.c.fillRect(0, 0, 1280, 720);
      f.c.restore();
    }
  },
});

function paintRod(c: C2, env: PaintEnv, o: { t: number; tq: number; uSliver: number; uLong: number; uHook: number; dotted: number; glowS: number; glowL: number; ring: number; badgeW: number }) {
  const ink = env.fill('ink');
  const y0 = ROD.y - ROD.h / 2;
  // the rod: a brass bar on two low iron feet, no marks
  c.fillStyle = ink;
  c.fillRect(ROD.x0 + 20, ROD.y + ROD.h / 2, 6, 10);
  c.fillRect(ROD.x1 - 26, ROD.y + ROD.h / 2, 6, 10);
  const g = c.createLinearGradient(0, y0, 0, y0 + ROD.h);
  g.addColorStop(0, brass(env, 0.75));
  g.addColorStop(0.5, brass(env, 0.4));
  g.addColorStop(1, mixLab(brass(env, 0.05), env.mood.fg, 0.35));
  c.fillStyle = g;
  c.fillRect(ROD.x0, y0, ROD.x1 - ROD.x0, ROD.h);
  c.fillStyle = mixLab(brass(env, 0.3), env.mood.fg, 0.3);
  c.fillRect(ROD.x0 - 3, y0 - 1.5, 5, ROD.h + 3);
  c.fillRect(ROD.x1 - 2, y0 - 1.5, 5, ROD.h + 3);
  // the ink bar, inked onto the rod's face
  const inkC = mixLab('#1b130b', env.mood.fg, 0.15);
  const by = ROD.y - 4.5, bh = 9;
  c.fillStyle = inkC;
  if (o.uSliver > 0) c.fillRect(BAR.a, by, (BAR.b - BAR.a) * o.uSliver - 1.5, bh);
  if (o.uLong > 0) c.fillRect(BAR.b + 1, by, (BAR.c - BAR.b) * sm(o.uLong), bh);
  // the hook: off the rod's end, a short rise toward the Plate (a pale halo so it reads on the dark square)
  if (o.uHook > 0) {
    const u = sm(o.uHook);
    const pts: [number, number][] = [
      [BAR.c, ROD.y],
      [BAR.hookX - 10, ROD.y],
      [BAR.hookX, ROD.y - BAR.hookUp],
    ];
    const L1 = BAR.hookX - 10 - BAR.c, L2 = Math.hypot(10, BAR.hookUp);
    const total = L1 + L2;
    const d = u * total;
    const end = d <= L1 ? [BAR.c + d, ROD.y] : [BAR.hookX - 10 + (10 * (d - L1)) / L2, ROD.y - (BAR.hookUp * (d - L1)) / L2];
    for (const pass of [0, 1]) {
      c.strokeStyle = pass === 0 ? withAlpha(brass(env, 0.6), 0.85) : inkC;
      c.lineWidth = pass === 0 ? 10 : 6;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      if (d > L1) c.lineTo(pts[1][0], pts[1][1]);
      c.lineTo(end[0], end[1]);
      c.stroke();
    }
  }
  // glints on the sliver / long walk as the narration names them
  if (o.glowS > 0.01) glowDot(c, (BAR.a + BAR.b) / 2, ROD.y, 22, tone(env, BRASS_HI, 0.1), 0.7 * o.glowS);
  if (o.glowL > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(tone(env, BRASS_HI, 0.1), 0.35 * o.glowL);
    c.fillRect(BAR.b, ROD.y - 9, BAR.c - BAR.b, 18);
    c.restore();
  }
  // the dotted outline doubling the bar's edges: proportions only
  if (o.dotted > 0.01) {
    c.save();
    c.globalAlpha = o.dotted;
    c.strokeStyle = withAlpha(mixLab('#f2e6cc', env.mood.core, 0.3), 0.9);
    c.lineWidth = 1.4;
    c.setLineDash([5, 4]);
    const w = (BAR.c - BAR.a) * clamp01(o.dotted * 1.2);
    c.strokeRect(BAR.a - 4, ROD.y - 11, w + 8, 22);
    c.beginPath();
    c.moveTo(BAR.b, ROD.y - 11);
    c.lineTo(BAR.b, ROD.y + 11);
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }
  // the small bell at the bar's end, on a bracket rising from the rod
  c.fillStyle = ink;
  c.fillRect(BELL.x + 18, BELL.y - 2, 3, ROD.y - BELL.y);
  const rung = seg(o.t, o.ring - 0.1, o.ring + 0.1);
  houseBell(c, env, { x: BELL.x + 20, y: BELL.y, s: 0.85, swing: bellSwing(o.t, o.ring, 0.45), ring: pulse(o.t, o.ring, 0.1, 0.3, 0.9), alpha: 0.4 + 0.6 * Math.max(rung, o.uHook) });
  // the implementation tag hanging from the rod's left end
  c.fillStyle = ink;
  c.fillRect(TAG.x - 1.5, TAG.y - 3, 3, ROD.y - TAG.y);
  c.fillRect(TAG.x - 1.5, TAG.y - 3, 14, 3);
  badge(c, env, { x: TAG.x + 11, y: TAG.y - 1, text: 'workerd · 28 Oct', legible: true, glint: pulse(o.t, o.badgeW, 0.2, 0.5, 0.8), swing: 0.12 * Math.exp(-Math.max(0, o.tq - o.badgeW) * 1.4) * Math.sin(Math.max(0, o.tq - o.badgeW) * 5) * (o.tq > o.badgeW ? 1 : 0), id: `${ID}-workerd` });
}
