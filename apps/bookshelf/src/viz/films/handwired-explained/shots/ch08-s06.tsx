/**
 * ch08-s06 — MULTIPLY'S GRADIENT AT ZERO, found and fixed on 3 September 2026. A SILENT PLATE (no narration; the
 * score's first lift carries it). 9.0 s on the locked clock; lampChange in from ch08-s05's cold plate: the first warm
 * light of the chapter (a cold wash still on the paper, warming to an early dawnGold over the first 1.6 s).
 *
 * The lamp-lit parchment plate of Deep Dive I (sets/ch04-s12-plate: the wall with its two paned windows at L2, the
 * pinned sheet at L3, the near bench edge at L5), so the plate reads as the same workshop's paper. Two small copies of
 * the same multiplication are inked side by side, each at v = 0, each with a brass slope gauge:
 *
 *   plate   (0.3)  the two copies ink in: 3 · v (left) and v · 3 (right), each with "v = 0" and its gauge at rest
 *   zero    (1.4)  the equation line inks across the top; the RIGHT needle swings to 3, the LEFT one twitches and
 *                  stays firmly on 0 (same multiplication, different operand order, different slope)
 *   corners (2.6)  inside the left copy, the multiply's two ramps (Deep Dive I's hinged boards, in miniature) rise:
 *                  both hinged at v = 0, a brass marble resting exactly on both corners; label "both ramps on their
 *                  corners" (the reason its slope came out 0)
 *   circle  (3.6)  the red-pencil hand enters from frame RIGHT, draws ONE circle round the two gauges together, and
 *                  withdraws (the pencil only writes, strikes or rests: a circle is writing)
 *   fixed   (4.4)  a small stamp presses onto the left copy (a plain ring-and-tick mark, no words); the left needle
 *                  swings to 3: both gauges now read 3; the brass test counter clicks up to 274; label "fixed that
 *                  morning · 274 tests pass"
 *   (5.2 → 9.0)    hold; a slight push toward the counter. Ends clean into ch08-s07's crossfade.
 *
 * Every fact on screen is the script's: the equation, the two labels, the gauge readings 0 / 3 / 3, the count 274.
 * Value hierarchy: the pencil hand is the darkest shape; the red circle is the one saturated accent.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, defineShot, hash1, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { LAYERS } from '../../../film/contracts';
import { toScreen } from '../../../film/core/multiplane';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { HAND_LEN, PENCIL_MARK, copperOf } from '../sets/narratorHands';
import { INK, PLATE, PLATE_INK, coldWash, plateNear, plateRoom } from '../sets/ch04-s12-plate';

type C2 = CanvasRenderingContext2D;
const ID = 'ch08-s06';

// ---------------------------------------------------------------- helpers (pure)
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
/** a needle settling on a detent: eased travel with one small damped overshoot */
const settle = (t: number, t0: number, dur = 0.55) => {
  if (t <= t0) return 0;
  const u = (t - t0) / dur;
  if (u >= 2.2) return 1;
  const base = sm(Math.min(1, u * 1.15));
  const over = u > 0.6 ? 0.07 * Math.exp(-(u - 0.6) * 3.2) * Math.sin((u - 0.6) * 7.5) : 0;
  return base + over;
};

// ---------------------------------------------------------------- layout (plate rest px)
const EQ_Y = 82;
const CARD = { top: 112, bottom: 566, w: 470 } as const;
const LX = 392;
const RX = 888;
const HEAD_Y = 182;
const V0_Y = 218;
const GAUGE_Y = 354;
const GAUGE_R = 92;
const FLOOR_Y = 478;
const CLIMB = 70;
const CORNERS_Y = 538;
/** the stamp lands at the LEFT gauge's right foot (the gauge that was wrong), clear of the header and the circle */
const STAMP_AT = { x: LX + GAUGE_R + 38, y: GAUGE_Y + 8 };
const COUNTER = { x: RX, y: 462, w: 170, h: 52 } as const;
const FIXED_Y = 538;
/** the red circle: one loose ellipse round both gauges */
const RING = { x: 640, y: 318, rx: 404, ry: 98, rot: -0.02 } as const;

/** needle angle for a slope reading v in [0, 3] (0 at upper left, 3 at upper right) */
const needleAng = (v: number) => Math.PI + 0.35 + (v / 3) * (Math.PI - 0.7);
/** the left needle's swing on the stamp: off the detent within a frame of contact, at 3 by ~0.42 s (ease-out), one
 *  small overshoot settling by ~0.9 s */
const swingAfter = (dt: number) => {
  if (dt <= 0.02) return 0;
  const u = (dt - 0.02) / 0.4;
  const base = u >= 1 ? 1 : 1 - Math.pow(1 - u, 3);
  const over = u > 0.75 ? 0.06 * Math.exp(-(u - 0.75) * 4.5) * Math.sin((u - 0.75) * 9) : 0;
  return base + over;
};

/** the camera: pulled back so the plate fills ~72 % of the frame width inside the dark workshop; after the fix, a
 *  slight push toward the counter */
const CAM0: Camera3 = { x: 640, y: 372, z: -200, lens: 1 };
const CAM1: Camera3 = { x: 700, y: 398, z: -120, lens: 1 };
/** the wall's two paned windows (L2 rest px, ch04-s12-plate's) */
const WALL_WINS = [[-150, 240], [1190, 240]] as const;

interface Beats {
  D: number;
  plate: number;
  zero: number;
  corners: number;
  circle: number;
  fixed: number;
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const b = (name: string, fb: number) => {
      const v = T.beat(name);
      return Number.isFinite(v) ? v : fb;
    };
    const beats: Beats = { D: T.duration, plate: b('plate', 0.3), zero: b('zero', 1.4), corners: b('corners', 2.6), circle: b('circle', 3.6), fixed: b('fixed', 4.4) };
    tl.hold(0, T.duration);
    return { tl, beats };
  },
  paint(f, _s, scene) {
    const b = scene.beats as Beats;
    const t = f.t;
    const tq = f.tq;
    // locked; after the fix a slight push toward the counter
    const push = seg(t, b.fixed + 0.8, b.D);
    const cam: Camera3 = { x: lerp(CAM0.x, CAM1.x, push), y: lerp(CAM0.y, CAM1.y, push), z: lerp(CAM0.z, CAM1.z, push), lens: 1 };
    f.camera(cam);
    plateRoom(f, { key: ID });
    surround(f, cam);
    f.layer(PLATE_INK, (c, env) => plateInk(f, c, env, t, tq, b, cam));
    plateNear(f, ID);
    nearClamp(f);
    // the cold of the last plate still on the paper as the lamp comes up warm
    coldWash(f, 0.55 * (1 - sm(t / 1.7)));
    // dawnGold arrives first as the warm key at the top of the plate
    warmKey(f, cam, t);
  },
});

// ---------------------------------------------------------------- the plate's ink
function plateInk(f: Frame, c: C2, env: PaintEnv, t: number, tq: number, b: Beats, cam: Camera3) {
  const inkA = seg(t, b.plate - 0.05, b.plate + 0.45);
  // the two copies
  copyCard(c, env, LX, '3 · v', inkA, `${ID}-left`);
  copyCard(c, env, RX, 'v · 3', inkA, `${ID}-right`);
  // the equation line across the top, inked left to right on 'zero'
  equation(c, env, t, b);
  // the left copy's ramps (beat corners), drawn under its gauge
  const rampU = seg(tq, b.corners - 0.1, b.corners + 0.55);
  const after = 1 - 0.15 * seg(t, b.fixed + 0.4, b.fixed + 1.2);
  ramps(c, env, LX, rampU, after);
  label(c, 'both ramps on their corners', LX, CORNERS_Y, seg(t, b.corners + 0.25, b.corners + 0.6), 28, `${ID}-corners`);
  // the gauges: right reads 3 from 'zero'; left stays on 0 (a twitch) until the stamp, then reads 3
  const twitch = t > b.zero && t < b.zero + 0.6 ? 0.05 * Math.sin((t - b.zero) * 26) * Math.exp(-(t - b.zero) * 6) : 0;
  // the left needle swings 0 → 3 right on the stamp's contact (cause and effect), then the counter rolls
  const leftV = 3 * swingAfter(t - b.fixed) + Math.max(0, twitch);
  const rightV = 3 * settle(twos(t), b.zero, 0.55);
  gauge(c, env, LX, inkA, leftV, t > b.fixed ? seg(t, b.fixed, b.fixed + 0.3) * (1 - seg(t, b.fixed + 1.0, b.fixed + 2.2)) : 0);
  gauge(c, env, RX, inkA, rightV, seg(t, b.zero, b.zero + 0.3) * (1 - seg(t, b.zero + 0.9, b.zero + 1.8)));
  // the red-pencil circle round both gauges, and the hand that draws it
  circleAndPencil(c, env, t, tq, b, cam);
  // the stamp and its mark
  stamp(c, env, t, tq, b);
  // the test counter and its label
  counter(c, env, t, tq, b, inkA);
  label(c, 'fixed that morning · 274 tests pass', RX, FIXED_Y, seg(t, b.fixed + 0.55, b.fixed + 0.95), 28, `${ID}-fixed`);
  void f;
}

/** a copy of the multiplication: a hand-ruled box, its expression and "v = 0" */
function copyCard(c: C2, env: PaintEnv, cx: number, expr: string, a: number, id: string) {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha = a;
  const x0 = cx - CARD.w / 2, x1 = cx + CARD.w / 2;
  // the box: a double rule with slightly uneven corners (inked by hand)
  c.strokeStyle = withAlpha(INK, 0.42);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(x0 + 1, CARD.top);
  c.lineTo(x1 - 1, CARD.top + 1.2);
  c.lineTo(x1, CARD.bottom);
  c.lineTo(x0, CARD.bottom - 0.8);
  c.closePath();
  c.stroke();
  c.strokeStyle = withAlpha(INK, 0.16);
  c.lineWidth = 0.8;
  c.strokeRect(x0 + 6, CARD.top + 6, CARD.w - 12, CARD.bottom - CARD.top - 12);
  c.restore();
  // the expression, large, and v = 0 beneath it
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `500 50px ${FONT.mono}`, 50);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(INK, 0.92 * a);
    c.fillText(expr, cx, HEAD_Y);
    const w = c.measureText(expr).width;
    textProbe(c, id, cx - w / 2, HEAD_Y - size * 0.8, w, size, a);
    const s2 = legibleSize(c, `italic 400 28px ${FONT.text}`, 28);
    c.font = `italic 400 ${s2}px ${FONT.text}`;
    c.fillStyle = withAlpha(INK, 0.78 * a);
    c.fillText('v = 0', cx, V0_Y);
    const w2 = c.measureText('v = 0').width;
    textProbe(c, `${id}-v0`, cx - w2 / 2, V0_Y - s2 * 0.8, w2, s2, a);
    c.restore();
  });
}

/** the equation line: inked left to right on 'zero' (a clip sweep, on twos) */
function equation(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(twos(t), b.zero - 0.12, b.zero + 0.75);
  if (u <= 0.001) return;
  // once the left needle has settled on 3 the header steps back to 40 %, so the screen no longer contradicts itself
  const dim = 1 - 0.6 * seg(t, b.fixed + 0.5, b.fixed + 0.9);
  const txt = 'slope of 3·v at v = 0 → 0   ·   of v·3 → 3';
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `500 27px ${FONT.mono}`, 27);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const w = c.measureText(txt).width;
    const x = 640 - w / 2;
    c.beginPath();
    c.rect(x - 4, EQ_Y - size * 1.2, (w + 8) * u, size * 1.7);
    c.clip();
    c.fillStyle = withAlpha(INK, 0.9 * dim);
    c.fillText(txt, x, EQ_Y);
    c.restore();
    textProbe(c, `${ID}-eq`, x, EQ_Y - size * 0.8, w, size, (u > 0.4 ? 1 : u) * dim);
  });
  // a fine rule under it
  c.save();
  c.strokeStyle = withAlpha(INK, 0.2 * u * dim);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(640 - 340, EQ_Y + 15);
  c.lineTo(640 - 340 + 680 * u, EQ_Y + 15);
  c.stroke();
  c.restore();
  void env;
}

/** plate lettering (italic serif), centred, with its probe */
function label(c: C2, txt: string, x: number, y: number, a: number, size0: number, id: string) {
  if (a <= 0.01) return;
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `italic 600 ${size0}px ${FONT.text}`, size0);
    c.font = `italic 600 ${size}px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    // the header's ink value (review r1: the grey italic was about 3:1 on the cream)
    c.fillStyle = withAlpha(mixLab(INK, '#000000', 0.2), a);
    c.fillText(txt, x, y);
    const w = c.measureText(txt).width;
    textProbe(c, id, x - w / 2, y - size * 0.8, w, size, a);
    c.restore();
  });
}

const brass = (env: PaintEnv, k = 0) => mixLab(mixLab('#b68f48', env.mood.halo, 0.22), '#fff0c8', k);

/** a brass slope gauge: a half-dial on a small plinth, ticks 0..3, a needle at v; glow = a brief brass bloom */
function gauge(c: C2, env: PaintEnv, cx: number, a: number, v: number, glow: number) {
  if (a <= 0.01) return;
  const cy = GAUGE_Y;
  const R = GAUGE_R;
  c.save();
  c.globalAlpha = a;
  // the dial face: a brass half-disc with a darker bezel
  c.beginPath();
  c.moveTo(cx - R - 8, cy + 10);
  c.arc(cx, cy, R + 8, Math.PI, 0);
  c.lineTo(cx + R + 8, cy + 10);
  c.closePath();
  c.fillStyle = mixLab(brass(env), '#3a2614', 0.45);
  c.fill();
  const g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.6, 4, cx, cy, R);
  g.addColorStop(0, brass(env, 0.35));
  g.addColorStop(1, brass(env, 0));
  c.beginPath();
  c.moveTo(cx - R, cy + 4);
  c.arc(cx, cy, R, Math.PI, 0);
  c.lineTo(cx + R, cy + 4);
  c.closePath();
  c.fillStyle = g;
  c.fill();
  // ticks: majors at 0..3, minors at quarters
  c.strokeStyle = withAlpha(INK, 0.85);
  for (let i = 0; i <= 12; i++) {
    const vv = i / 4;
    const an = needleAng(vv);
    const major = i % 4 === 0;
    const r0 = R - (major ? 15 : 8);
    c.lineWidth = major ? 2 : 1;
    c.beginPath();
    c.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0);
    c.lineTo(cx + Math.cos(an) * (R - 3), cy + Math.sin(an) * (R - 3));
    c.stroke();
  }
  // numerals inside the ticks
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 22px ${FONT.mono}`, 22);
    c.font = `600 ${size}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = withAlpha(INK, 0.9);
    for (let k = 0; k <= 3; k++) {
      const an = needleAng(k);
      c.fillText(String(k), cx + Math.cos(an) * (R + 24), cy + Math.sin(an) * (R + 24) + 1);
    }
  });
  // 'slope' engraved small on the face (texture)
  textRole(c, 'texture', () => {
    c.font = `italic 12px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(INK, 0.5);
    c.fillText('slope', cx, cy - 10);
  });
  // the needle (dark ink) with a copper pivot
  const an = needleAng(Math.max(0, Math.min(3.15, v)));
  c.fillStyle = mixLab(INK, '#000000', 0.3);
  c.beginPath();
  c.moveTo(cx + Math.cos(an) * (R - 6), cy + Math.sin(an) * (R - 6));
  c.lineTo(cx + Math.cos(an + Math.PI / 2) * 3.2, cy + Math.sin(an + Math.PI / 2) * 3.2);
  c.lineTo(cx - Math.cos(an) * 10, cy - Math.sin(an) * 10);
  c.lineTo(cx + Math.cos(an - Math.PI / 2) * 3.2, cy + Math.sin(an - Math.PI / 2) * 3.2);
  c.closePath();
  c.fill();
  c.fillStyle = copperOf(env, 0.3);
  c.beginPath();
  c.arc(cx, cy, 5, 0, Math.PI * 2);
  c.fill();
  // the plinth
  c.fillStyle = mixLab(brass(env), '#2a1a0c', 0.55);
  c.fillRect(cx - R - 12, cy + 10, 2 * R + 24, 6);
  c.restore();
  if (glow > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(cx, cy - R * 0.4, 4, cx, cy - R * 0.4, R * 1.4);
    gg.addColorStop(0, withAlpha(env.mood.core, 0.22 * glow * a));
    gg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gg;
    c.fillRect(cx - R * 1.5, cy - R * 1.9, R * 3, R * 2.4);
    c.restore();
  }
}

/** the multiply's two ramps in miniature, in Deep Dive I's language (sets/rampBench: a cut-paper floor rule with
 *  ticks, black hinged boards each flat then a 45° climb with a lit top edge, a copper hinge pin at each corner, a
 *  brass marble on the rule): board one climbs to the right of v = 0, board two (standing a little higher behind)
 *  climbs to the left of it; BOTH hinge pins sit on v = 0, and the marble rests on the rule right under them.
 *  u = rise (the boards come up out of the plate), dim = fade after the fix */
function ramps(c: C2, env: PaintEnv, cx: number, u: number, dim: number) {
  if (u <= 0.01) return;
  const a = clamp01(u * 2) * dim;
  const s = 0.5;
  const U = 110 * s; // px per unit of v
  const half = 1.6 * U;
  const y = FLOOR_Y + 4;
  const ink = PUPPET_NEAR_BLACK;
  const rimC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.85);
  c.save();
  c.globalAlpha = a;
  // the floor rule (cut paper) with a tick at each whole v; the v = 0 tick a little longer
  c.fillStyle = mixLab(mixLab('#d8c393', env.mood.halo, 0.3), INK, 0.12);
  c.fillRect(cx - half - 6, y, 2 * half + 12, 10 * s);
  c.strokeStyle = withAlpha('#1d140d', 0.8);
  c.lineWidth = 1.2;
  c.beginPath();
  for (let k = -2; k <= 2; k++) {
    c.moveTo(cx + k * U, y);
    c.lineTo(cx + k * U, y + (k === 0 ? 11 : 7) * s);
  }
  c.stroke();
  // the boards rise out of the plate together
  const lift = (1 - u) * 60 * s;
  const climbTo = 1.15 * U; // each board climbs 1.15 units past its hinge (clear of the gauge above)
  const th = 9 * s * 1.6; // board thickness
  const board = (dir: 1 | -1, by: number, col: string) => {
    const x0 = cx - dir * half; // the flat run's far end
    const xe = cx + dir * climbTo;
    const ye = by - climbTo; // 45°
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x0, by);
    c.lineTo(cx, by);
    c.lineTo(xe, ye);
    c.lineTo(xe + dir * th * 0.7, ye + th * 0.7);
    c.lineTo(cx + dir * th * 0.42, by + th);
    c.lineTo(x0, by + th);
    c.closePath();
    c.fill();
    c.strokeStyle = rimC;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x0, by);
    c.lineTo(cx, by);
    c.lineTo(xe, ye);
    c.stroke();
    // the copper hinge pin at the corner, on v = 0
    c.fillStyle = copperOf(env, 0.5);
    c.beginPath();
    c.arc(cx, by + th * 0.4, 4.6 * s * 1.3, 0, Math.PI * 2);
    c.fill();
  };
  c.save();
  c.beginPath();
  c.rect(cx - half - 12, CARD.top, 2 * half + 24, y - CARD.top);
  c.clip();
  // board two behind (one sheet paler, standing higher), board one in front
  board(-1, y - th - 2 - 26 * s + lift, mixLab(ink, '#6a5a44', 0.35));
  board(1, y - th - 2 + lift, ink);
  c.restore();
  // a faint reading line from the marble up through both pins (v = 0)
  c.strokeStyle = withAlpha(INK, 0.35);
  c.setLineDash([3, 4]);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(cx, y - 2);
  c.lineTo(cx, y - 9 * s * 1.6 - 2 - 26 * s);
  c.stroke();
  c.setLineDash([]);
  // the brass marble on the rule at v = 0
  const mr = 8 * s;
  const g = c.createRadialGradient(cx - mr * 0.35, y - mr - mr * 0.4, mr * 0.1, cx, y - mr, mr);
  g.addColorStop(0, mixLab(env.mood.core, '#ffffff', 0.25));
  g.addColorStop(0.45, mixLab('#b8893e', env.mood.halo, 0.3));
  g.addColorStop(1, mixLab('#5b3f18', ink, 0.4));
  c.fillStyle = g;
  c.beginPath();
  c.arc(cx + 13 * s, y - mr, mr, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** the circle in red pencil round both gauges, and the pencil hand (frame RIGHT) drawing it */
function circleAndPencil(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, cam: Camera3) {
  const t0 = b.circle - 0.45; // the hand enters
  const c0 = b.circle; // the lead touches
  const c1 = b.circle + 0.62; // the circle closes
  const t1 = c1 + 0.6; // the hand is gone
  const TH0 = 0.42;
  const SWEEP = Math.PI * 2 + 0.32;
  const ringPt = (th: number) => {
    const wob = 1 + 0.012 * Math.sin(th * 3 + 1.3) + 0.01 * (th / SWEEP);
    const x = RING.rx * wob * Math.cos(th);
    const y = RING.ry * wob * Math.sin(th);
    return { x: RING.x + x * Math.cos(RING.rot) - y * Math.sin(RING.rot), y: RING.y + x * Math.sin(RING.rot) + y * Math.cos(RING.rot) };
  };
  const drawn = clamp01((tq - c0) / (c1 - c0));
  const ease = drawn < 1 ? drawn * drawn * (3 - 2 * drawn) * 0.25 + drawn * 0.75 : 1;
  const thNow = TH0 - SWEEP * ease;
  // the mark (stays on the plate)
  if (drawn > 0) {
    c.save();
    c.strokeStyle = withAlpha(PENCIL_MARK, 0.88);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const N = Math.max(2, Math.ceil(90 * ease));
    for (let pass = 0; pass < 2; pass++) {
      c.lineWidth = pass ? 1.1 : 2.4;
      c.globalAlpha = pass ? 0.5 : 1;
      c.beginPath();
      for (let i = 0; i <= N; i++) {
        const th = TH0 - SWEEP * ease * (i / N);
        const p = ringPt(th);
        const j = pass ? 0.9 * hash1(i, 7) : 0;
        if (i === 0) c.moveTo(p.x + j, p.y + j);
        else c.lineTo(p.x + j, p.y + j);
      }
      c.stroke();
    }
    c.restore();
  }
  if (tq <= t0 || tq >= t1) return;
  const len = HAND_LEN * 1.15;
  const off = { x: len * 0.12, y: -len * 0.04 };
  let u: number;
  let P: { x: number; y: number };
  if (tq < c0) {
    u = 0.35 * clamp01((tq - t0) / (c0 - t0));
    P = ringPt(TH0);
  } else if (tq < c1) {
    u = 0.5;
    P = ringPt(thNow);
  } else {
    u = 0.75 + 0.25 * clamp01((tq - c1) / (t1 - c1));
    P = ringPt(TH0 - SWEEP);
  }
  // the pencil enters from the FRAME's lower right, in the plate's own coordinates (the plate sits at L3 depth)
  const E = hands.entry(cam, 'L3').pencil;
  const pose = hands.pencil('hover', u, { x: P.x - off.x, y: P.y - off.y }, { scale: 1.15, entry: E });
  hands.draw(c, pose, env);
  void t;
}

/** the small stamp: a turned wooden handle on a rubber block; it presses on 'fixed' and leaves a ring-and-tick */
function stamp(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const press = b.fixed;
  const down = press - 0.42;
  const up = press + 0.16;
  const gone = press + 0.75;
  // the mark (dark ink, never red), from the press on
  if (tq >= press) {
    const a = 0.82 * seg(tq, press, press + 0.05);
    c.save();
    c.translate(STAMP_AT.x, STAMP_AT.y);
    c.rotate(-0.12);
    c.strokeStyle = withAlpha(mixLab(INK, '#3a2a40', 0.25), a);
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 0, 19, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(0, 0, 14.5, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 3.6;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(-8, 1);
    c.lineTo(-2.5, 7);
    c.lineTo(9, -7);
    c.stroke();
    // ink grain: a few dropped-out specks in the impression
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 18; i++) {
      c.fillStyle = withAlpha('#000000', 0.5);
      c.beginPath();
      c.arc(hash1(i, 3) * 18, hash1(i, 5) * 18, 0.9, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  if (tq < down || tq > gone) return;
  // height above the paper: comes down from above frame, presses, lifts away
  let h: number;
  if (tq < press) h = 420 * (1 - sm((tq - down) / (press - down)));
  else if (tq < up) h = 0;
  else h = 420 * sm((tq - up) / (gone - up));
  const x = STAMP_AT.x, y = STAMP_AT.y - h;
  c.save();
  c.translate(x, y);
  c.rotate(-0.12 * (h < 1 ? 1 : 0.6));
  const ink = mixLab(INK, '#000000', 0.35);
  // the rubber block and its wooden mount
  c.fillStyle = ink;
  c.fillRect(-25, -6, 50, 7);
  c.fillRect(-22, -20, 44, 14);
  // the turned handle: a waisted neck and a round knob
  c.beginPath();
  c.moveTo(-9, -20);
  c.quadraticCurveTo(-4, -40, -7, -58);
  c.lineTo(7, -58);
  c.quadraticCurveTo(4, -40, 9, -20);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(0, -70, 14, 13, 0, 0, Math.PI * 2);
  c.fill();
  // the lamp catching the knob's top and the block's edge
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.8);
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(0, -70, 13, Math.PI * 1.15, Math.PI * 1.85);
  c.moveTo(-22, -20);
  c.lineTo(22, -20);
  c.stroke();
  c.restore();
  // a soft shadow on the paper as it nears
  if (h < 160) {
    c.save();
    c.fillStyle = withAlpha(INK, 0.18 * (1 - h / 160));
    c.beginPath();
    c.ellipse(STAMP_AT.x + 6 + h * 0.08, STAMP_AT.y + 4, 28, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  void t;
}

/** the brass test counter: a box with three number wheels; the wheels click up to 274 on the fix */
function counter(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, inkA: number) {
  const a = inkA;
  if (a <= 0.01) return;
  const { x, y, w, h } = COUNTER;
  const r0 = b.fixed + 0.42;
  const run = 0.8;
  const on = tq >= r0;
  const u = clamp01((tq - r0) / run);
  const n = on ? Math.round(274 * (1 - Math.pow(1 - u, 2.2))) : -1;
  c.save();
  c.globalAlpha = a;
  // the housing
  c.fillStyle = mixLab(brass(env), '#2a1a0c', 0.5);
  c.beginPath();
  c.roundRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, 6);
  c.fill();
  c.fillStyle = brass(env, 0.15);
  c.beginPath();
  c.roundRect(x - w / 2, y - h / 2, w, h, 4);
  c.fill();
  // three windows
  const ww = 38, wh = 40, gap = 12;
  const xs = [-1, 0, 1].map((k) => x + k * (ww + gap));
  const digits = n < 0 ? null : String(n).padStart(3, '0');
  for (let i = 0; i < 3; i++) {
    const wx = xs[i] - ww / 2, wy = y - wh / 2;
    c.fillStyle = mixLab('#f1e6cc', env.mood.core, 0.15);
    c.fillRect(wx, wy, ww, wh);
    c.strokeStyle = withAlpha(INK, 0.6);
    c.lineWidth = 1.2;
    c.strokeRect(wx, wy, ww, wh);
    // the wheel's curvature shading
    const g = c.createLinearGradient(0, wy, 0, wy + wh);
    g.addColorStop(0, withAlpha(INK, 0.28));
    g.addColorStop(0.3, withAlpha(INK, 0));
    g.addColorStop(0.7, withAlpha(INK, 0));
    g.addColorStop(1, withAlpha(INK, 0.28));
    c.fillStyle = g;
    c.fillRect(wx, wy, ww, wh);
  }
  if (digits) {
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `600 31px ${FONT.mono}`, 31);
      c.font = `600 ${size}px ${FONT.mono}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = withAlpha(INK, 0.95);
      for (let i = 0; i < 3; i++) c.fillText(digits[i], xs[i], y + 2);
      textProbe(c, `${ID}-count`, x - w / 2, y - size * 0.6, w, size * 1.2, 1);
    });
  }
  // a small brass lever at the side (the counter's reset), and the lamp on the housing's top edge
  c.fillStyle = mixLab(brass(env), '#2a1a0c', 0.5);
  c.fillRect(x + w / 2 + 6, y - 4, 14, 8);
  c.beginPath();
  c.arc(x + w / 2 + 22, y, 6, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.7);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x - w / 2 - 2, y - h / 2 - 5.5);
  c.lineTo(x + w / 2 + 2, y - h / 2 - 5.5);
  c.stroke();
  c.restore();
  void t;
}

// ---------------------------------------------------------------- the workshop surround (review r1: depth and accent)
/** the wall's windows desaturated ~50 % and darkened to ~60 % (the red circle is the shot's one saturated accent);
 *  a haze sheet hanging in the dark workshop around the plate (never over the paper) */
function surround(f: Frame, cam: Camera3) {
  const c = f.c;
  const p0 = toScreen(LAYERS.L3, cam, PLATE.cx - PLATE.w / 2, PLATE.cy - PLATE.h / 2);
  const p1 = toScreen(LAYERS.L3, cam, PLATE.cx + PLATE.w / 2, PLATE.cy + PLATE.h / 2);
  c.save();
  c.beginPath();
  for (const [wx, ww] of WALL_WINS) {
    const a = toScreen(LAYERS.L2, cam, wx, -10);
    const b2 = toScreen(LAYERS.L2, cam, wx + ww, 730);
    c.rect(a.x, a.y, b2.x - a.x, b2.y - a.y);
  }
  c.clip();
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = 'rgba(128,128,128,0.5)';
  c.fillRect(-20, -20, 1320, 760);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = 'rgb(153,153,153)';
  c.fillRect(-20, -20, 1320, 760);
  c.restore();
  // the haze: the frame minus the plate
  c.save();
  c.beginPath();
  c.rect(-20, -20, 1320, 760);
  c.rect(p0.x - 2, p0.y - 2, p1.x - p0.x + 4, p1.y - p0.y + 4);
  c.clip('evenodd');
  f.fog({ yCenter: 380, height: 760, alpha: 0.2, drift: 5 });
  // the windows' light carried into the haze as two soft, low-contrast shafts
  c.globalCompositeOperation = 'lighter';
  for (const [wx, ww] of WALL_WINS) {
    const m = toScreen(LAYERS.L2, cam, wx + ww / 2, 300);
    const g = c.createRadialGradient(m.x, m.y, 10, m.x, m.y, 260);
    g.addColorStop(0, withAlpha(f.mood.haze, 0.1));
    g.addColorStop(1, withAlpha(f.mood.haze, 0));
    c.fillStyle = g;
    c.fillRect(m.x - 260, m.y - 260, 520, 520);
  }
  c.restore();
}

/** L5: a drafting C-clamp biting the bench edge at the lower-left corner, near-black and out of focus */
function nearClamp(f: Frame) {
  f.layer('L5', (c) => {
    f.cached(`${ID}/L5clamp`, 320, 330, (cc) => {
      cc.translate(170, -560);
      cc.fillStyle = PUPPET_NEAR_BLACK;
      // the C frame: an upper jaw over the bench lip, the spine, the lower arm under it
      cc.beginPath();
      cc.moveTo(-150, 610);
      cc.lineTo(30, 606);
      cc.lineTo(36, 640);
      cc.lineTo(-104, 646);
      cc.lineTo(-108, 820);
      cc.lineTo(26, 816);
      cc.lineTo(30, 852);
      cc.lineTo(-150, 860);
      cc.closePath();
      cc.fill();
      // the screw rising through the lower arm to its pad, and its T-handle
      cc.fillRect(-2, 690, 16, 140);
      cc.fillRect(-12, 676, 36, 16);
      cc.fillRect(-40, 836, 92, 12);
      cc.beginPath();
      cc.arc(-40, 842, 9, 0, Math.PI * 2);
      cc.arc(52, 842, 9, 0, Math.PI * 2);
      cc.fill();
    })(c, -170, 560);
  });
}

/** the warm key already at the top of the plate as the shot opens (dawnGold arriving before the cold has gone) */
function warmKey(f: Frame, cam: Camera3, t: number) {
  const c = f.c;
  const top = toScreen(LAYERS.L3, cam, PLATE.cx, PLATE.cy - PLATE.h / 2 + 40);
  const k = 0.75 + 0.25 * sm(t / 1.6);
  c.save();
  c.globalCompositeOperation = 'soft-light';
  const g = c.createRadialGradient(top.x, top.y - 40, 20, top.x, top.y, 560);
  g.addColorStop(0, withAlpha(mixLab(f.mood.core, "#ffd27a", 0.4), 0.3 * k));
  g.addColorStop(0.5, withAlpha(f.mood.halo, 0.1 * k));
  g.addColorStop(1, withAlpha(f.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(top.x - 560, top.y - 600, 1120, 1160);
  c.restore();
}
