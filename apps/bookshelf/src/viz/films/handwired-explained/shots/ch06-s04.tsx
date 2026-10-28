/**
 * ch06-s04 — THE RATCHET AT 300 (scene, inside the host clockwork, candleAmber; cut in; 7.83 s).
 *   L0611 "Past three hundred steps in one frame, stepping stops, and every window snaps home."
 *
 * Close on the clockwork's RATCHET WHEEL (300 fine teeth, the release pawl; the same wheel as ch06-s01/s02) against the
 * clock room's round window. Through the clockwork's open top, a strip of the HandwiredOS desk: three paper windows
 * on their springs, each with its destination drawn dashed. At the left a paper hourglass tips (a long stall) and
 * pours step tokens into a hopper faster than the frame can take them; the backlog piles up.
 *
 * TEACHES, word by word (HL08: at most 300 steps of 4 ms = 1,200 ms per frame; past it a snap lands every animated
 * object on its destination at rest and the backlog is discarded; HL27: others carry the backlog, a design choice):
 *   ratchet (0.40)  the hourglass tips; tokens pour; the wheel races, one tooth per step, toward the copper-marked
 *                   300th tooth; the windows above creep toward home
 *                   (a long brass POINTER on the wheel's arbor, aimed at the copper 300 notch with its engraved tag,
 *                   sweeps one full revolution, a motion smear behind it)
 *   stops (3.25)    at tooth 300 the RELEASE PAWL (a hooked click on its pivot) flips up 25 degrees with a brass flare;
 *                   stepping stops and the windows hold still; the hopper's trapdoor drops and the backlog falls away;
 *                   '300 steps = 1,200 ms' inks on a slip in the right third
 *   snaps (4.35)    every window jumps onto its firm dashed outline (copper motion streaks, a small settle)
 *   every (3.79)    a TWO-SIDED CARD drops a little on its thread, already in frame, and turns slowly in an even light: one face a backlog of tokens carried
 *                   on past the frame line (others carry the time), the other the snapped, emptied ratchet (Handwired
 *                   snaps); 'others carry time · Handwired snaps' inks under it. Neither face is struck.
 *   bound (5.22)    the ratchet resets to tooth 0, empty: nothing carries over. Hold on the card turning.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { brassOf, cardPaper, clamp01, clockNear, clockRoom, clockworkX, ease5, inkCol, lerp, lin, lw, paperSlip, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
import { copperOf } from '../sets/narratorHands';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s04';
const INK = '#0b0d0b';

const WHEEL = { x: 430, y: 436, r: 214 };
/** the desk strip above (seen through the open top), its three windows: start and destination x (L4 px) */
const DESK = { x: 150, y: 24, w: 1010, h: 120 };
const WINS = [
  { x0: 236, x1: 330, y: 52, w: 120, h: 72 },
  { x0: 640, x1: 520, y: 44, w: 104, h: 80 },
  { x0: 820, x1: 950, y: 56, w: 132, h: 64 },
];
const GLASS = { x: 120, y: 300 };
const HOPPER = { x: 128, y: 520 };
const CARD = { x: 900, y: 440, w: 200, h: 236 };
/** the release pawl's pivot (L4 px), above the wheel's top right; its click tooth rests in the teeth at the top */
const PAWL = { x: WHEEL.x + WHEEL.r * 0.7, y: WHEEL.y - WHEEL.r * 1.17 };
/** the angle (canvas radians) where the pawl's tooth sits on the rim */
const PAWL_A = -Math.PI / 2 + 0.2;

interface Beats {
  D: number;
  ratchet: number;
  slip: number;
  card: number;
  bound: number;
  /** 'snaps': every window jumps home */
  snap: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, ratchet: T.beat('ratchet'), slip: T.beat('slip'), card: T.beat('card'), bound: T.beat('bound'), snap: T.word('L0611', 'snaps') };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(cam(t, b));
    clockRoom(f, { key: ID, oculus: { x: 440, y: 420, r: 360 }, lightGap: 160, sunX: 440, sunY: 420 });
    const steps = stepsAt(t, b);
    const release = seg(t, b.slip - 0.04, b.slip + 0.1) * (1 - seg(t, b.bound - 0.1, b.bound + 0.2));
    f.layer('L4', (c, env) => {
      desk(c, env, t, tq, b, steps);
      topPlate(c, env);
      hourglass(c, env, t, tq, b);
      hopper(c, env, t, tq, b);
      clockworkX(c, env, { ...WHEEL, steps, release, esc: escAt(t, b), crank: 0.25, lit: 0.35, frame: false, pawl: false });
      mark300(c, env, t, b, steps);
      pointer(c, env, t, b, steps);
      pawl(c, env, release);
      twoSidedCard(c, env, t, tq, b);
      labels(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // an even lamp over the card (both faces lit alike)
    const ca = seg(t, b.card - 0.3, b.card + 0.2);
    if (ca > 0) f.practical({ x: CARD.x, y: CARD.y - CARD.h / 2 - 44, kind: 'lamp', seed: 41, intensity: 0.7 * ca, radius: 110 });
    // the pawl's lift on 'stops': a brass flare at its tooth
    const sp = seg(t, b.slip - 0.02, b.slip + 0.04) * (1 - seg(t, b.slip + 0.2, b.slip + 0.8));
    if (sp > 0.01) f.practical({ x: WHEEL.x + Math.cos(PAWL_A) * WHEEL.r, y: WHEEL.y + Math.sin(PAWL_A) * WHEEL.r - 16, kind: 'led', seed: 43, intensity: sp, radius: 70 });
    clockNear(f, { key: ID, lip: 700, post: -150 });
  },
});

/** close on the wheel, a small push while it races; the card's place is already in frame on 'every' (no pan to find
 *  it), and the drift is clamped so the tipped hourglass keeps at least 40 px of margin at the left */
function cam(t: number, b: Beats): Camera3 {
  const u1 = ease5((t - 0.1) / (b.slip + 0.2));
  const z = 20 + 65 * u1 + 10 * lin(t, b.slip + 0.2, b.D);
  const x = 590 - 20 * u1;
  return { x, y: 366 - 6 * u1, z, lens: 1 };
}
/** the pointer races, accelerating, to tooth 300 at 'stops'; holds; then resets to 0 on 'bound' */
function stepsAt(t: number, b: Beats) {
  if (t < b.ratchet) return 0;
  if (t < b.slip) return Math.floor(300 * Math.pow((t - b.ratchet) / (b.slip - b.ratchet), 1.7));
  // reset: the wheel runs back to tooth 0 over 0.5 s around 'bound'
  return 300 * (1 - ease5((t - (b.bound - 0.3)) / 0.55));
}
/** the escapement rattles while the wheel races, then is still */
const escAt = (t: number, b: Beats) => (t < b.ratchet ? 0 : t < b.slip ? 2 * Math.pow((t - b.ratchet), 1.5) * 4 : 2 * Math.pow(b.slip - b.ratchet, 1.5) * 4);

// ------------------------------------------------------------------ the desk strip above
function desk(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, steps: number) {
  const ink = inkCol(env);
  c.save();
  // the desk's paper (HandwiredOS's beige) with a faint dot grid
  c.fillStyle = mixLab('#dcd2c1', env.mood.halo, 0.25);
  c.fillRect(DESK.x, DESK.y, DESK.w, DESK.h);
  c.fillStyle = withAlpha(ink, 0.12);
  for (let x = DESK.x + 10; x < DESK.x + DESK.w; x += 20) for (let y = DESK.y + 10; y < DESK.y + DESK.h; y += 20) c.fillRect(x, y, 1.6, 1.6);
  // the windows: destination outlines (dashed, firm), then the windows on their springs. They creep while the wheel
  // races; on 'stops' stepping stops and they hold still; on 'snaps' every window jumps onto its outline (a copper
  // motion streak on the snap frame, a small settle) and stays dead still
  const snapped = t >= b.snap;
  const frozen = t >= b.slip;
  const pHeld = 0.62;
  const p = snapped ? 1 : frozen ? pHeld : pHeld * Math.pow(steps / 300, 0.8);
  const settle = snapped ? Math.sin(Math.min(1, (t - b.snap) / 0.3) * Math.PI) * (1 - lin(t, b.snap, b.snap + 0.3)) : 0;
  WINS.forEach((w, i) => {
    c.save();
    c.setLineDash([6, 4]);
    c.fillStyle = withAlpha(copperOf(env, 0.4), 0.08);
    c.fillRect(w.x1, w.y, w.w, w.h);
    c.strokeStyle = withAlpha(mixLab(copperOf(env, 0.5), '#5a2d12', 0.35), 0.9);
    c.lineWidth = lw(c, 2.4);
    c.strokeRect(w.x1, w.y, w.w, w.h);
    c.restore();
    // the snap's motion streak: from where the window was held to its outline, fading over 0.3 s
    const st = seg(t, b.snap - 0.02, b.snap + 0.02) * (1 - seg(t, b.snap + 0.06, b.snap + 0.36));
    if (st > 0) {
      const xh = lerp(w.x0, w.x1, pHeld);
      const dir = Math.sign(w.x1 - xh);
      const g = c.createLinearGradient(dir > 0 ? xh : xh + w.w, 0, dir > 0 ? w.x1 : w.x1 + w.w, 0);
      g.addColorStop(0, withAlpha(copperOf(env, 0.8), 0));
      g.addColorStop(1, withAlpha(copperOf(env, 0.8), 0.75 * st));
      c.fillStyle = g;
      // the streak runs along the window's trailing edge's path
      const xa = dir > 0 ? xh : xh + w.w, xb = dir > 0 ? w.x1 : w.x1 + w.w;
      for (const yy of [w.y + 10, w.y + w.h / 2, w.y + w.h - 12]) c.fillRect(Math.min(xa, xb), yy - 2, Math.abs(xb - xa), 4);
    }
    // a slight spring wobble while moving; dead still once stopped; a small settle on the snap
    const wob = frozen ? 0 : Math.sin(tq * 7 + i * 2) * 3 * (steps / 300);
    const x = lerp(w.x0, w.x1, p) + wob + settle * 5 * Math.sign(w.x1 - w.x0);
    c.fillStyle = withAlpha(shadowCol, 0.3);
    c.fillRect(x + 3, w.y + 4, w.w, w.h);
    c.fillStyle = cardPaper(env);
    c.fillRect(x, w.y, w.w, w.h);
    c.fillStyle = withAlpha(ink, 0.85);
    c.fillRect(x, w.y, w.w, 11);
    c.strokeStyle = withAlpha(ink, 0.6);
    c.lineWidth = lw(c, 1);
    c.strokeRect(x, w.y, w.w, w.h);
    c.fillStyle = withAlpha(ink, 0.2);
    for (let k = 0; k < 3; k++) c.fillRect(x + 10, w.y + 22 + k * 12, w.w - 24 - k * 14, 4);
    // the snap: a copper flash on the outline as the window lands on it
    const fl = seg(t, b.snap, b.snap + 0.05) * (1 - seg(t, b.snap + 0.25, b.snap + 1.0));
    if (fl > 0) {
      c.strokeStyle = withAlpha(copperOf(env, 0.9), fl);
      c.lineWidth = lw(c, 3);
      c.strokeRect(w.x1 - 2, w.y - 2, w.w + 4, w.h + 4);
    }
  });
  c.restore();
}
/** the clockwork's top plate, open over the wheel (the desk is seen through it) */
function topPlate(c: C2, env: PaintEnv) {
  c.save();
  c.fillStyle = INK;
  c.fillRect(-200, 144, 1700, 22);
  c.fillRect(-200, -200, DESK.x - 10 + 200, 370);
  c.fillRect(DESK.x + DESK.w + 10, -200, 600, 370);
  c.strokeStyle = withAlpha(brassOf(env, 0.2), 0.7);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(-200, 144.5);
  c.lineTo(1500, 144.5);
  c.stroke();
  // screw heads along the plate
  c.fillStyle = brassOf(env, 0.1);
  for (let x = 40; x < 1300; x += 160) {
    c.beginPath();
    c.arc(x, 155, 3.2, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ------------------------------------------------------------------ the stall: an hourglass tipping, tokens pouring
function hourglass(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const tip = ease5((tq - (b.ratchet - 0.2)) / 0.9);
  c.save();
  c.translate(GLASS.x, GLASS.y);
  c.rotate(-tip * Math.PI * 0.62);
  // frame: two plates and two posts; glass: two cones (paper, backlit), sand mostly in the top bulb
  c.fillStyle = INK;
  c.fillRect(-36, -78, 72, 9);
  c.fillRect(-36, 69, 72, 9);
  c.fillRect(-34, -70, 5, 140);
  c.fillRect(29, -70, 5, 140);
  c.fillStyle = withAlpha(cardPaper(env), 0.55);
  c.beginPath();
  c.moveTo(-24, -68);
  c.lineTo(24, -68);
  c.lineTo(3, 0);
  c.lineTo(24, 68);
  c.lineTo(-24, 68);
  c.lineTo(-3, 0);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(INK, 0.8);
  c.lineWidth = lw(c, 1.4);
  c.stroke();
  // sand: fills the bulb that is up (it pours out as it tips)
  const left = 1 - seg(tq, b.ratchet + 0.3, b.slip);
  c.fillStyle = mixLab(brassOf(env, 0.2), '#3a2614', 0.35);
  c.beginPath();
  c.moveTo(-20 * left, -6 - 56 * left);
  c.lineTo(20 * left, -6 - 56 * left);
  c.lineTo(2, -4);
  c.lineTo(-2, -4);
  c.closePath();
  c.fill();
  c.restore();
}
/** the hopper of step tokens: they pour in faster than the frame takes them; on 'stops' the trapdoor drops them */
function hopper(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const H = HOPPER;
  const door = seg(tq, b.slip, b.slip + 0.12) * (1 - seg(tq, b.bound + 0.3, b.bound + 0.7));
  c.save();
  // the funnel
  c.fillStyle = INK;
  c.beginPath();
  c.moveTo(H.x - 70, H.y - 70);
  c.lineTo(H.x - 60, H.y - 70);
  c.lineTo(H.x - 18, H.y + 40);
  c.lineTo(H.x + 18, H.y + 40);
  c.lineTo(H.x + 60, H.y - 70);
  c.lineTo(H.x + 70, H.y - 70);
  c.lineTo(H.x + 26, H.y + 48);
  c.lineTo(H.x - 26, H.y + 48);
  c.closePath();
  c.fill();
  // a chute from the hopper into the wheel's teeth
  c.fillRect(H.x + 40, H.y - 30, WHEEL.x - WHEEL.r - (H.x + 40) + 6, 8);
  // the trapdoor under the funnel, hinged at its left
  c.save();
  c.translate(H.x - 26, H.y + 48);
  c.rotate(door * 1.25);
  c.fillRect(0, 0, 52, 7);
  c.restore();
  c.restore();
  // the tokens: a backlog that grows while the stall lasts
  const n = t < b.ratchet + 0.3 ? 0 : Math.min(26, Math.floor((Math.min(t, b.slip) - (b.ratchet + 0.3)) * 10));
  const fall = Math.max(0, tq - b.slip);
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 6), col = i % 6;
    const w = Math.max(1, 6 - row);
    const x = H.x - ((w - 1) * 14) / 2 + (col % w) * 14 + hash1(i, 3) * 3;
    let y = H.y + 30 - row * 13 - Math.floor(col / w) * 13;
    if (tq >= b.slip) y += 0.5 * 2400 * fall * fall + hash1(i, 7) * 6 * fall;
    if (y > 820) continue;
    token(c, env, x, y);
  }
  // a stream of tokens falling in from the hourglass while it pours
  if (t > b.ratchet + 0.3 && t < b.slip) {
    for (let k = 0; k < 4; k++) {
      const ph = (tq * 3 + k / 4) % 1;
      token(c, env, H.x - 6 + k * 3, lerp(GLASS.y + 60, H.y - 40, ph));
    }
  }
}
/** a token drawn on the card: paper disc, firm ink ring */
function tokenInk(c: C2, env: PaintEnv, x: number, y: number) {
  c.fillStyle = mixLab(cardPaper(env), '#b89a6a', 0.35);
  c.beginPath();
  c.arc(x, y, 8, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = inkCol(env);
  c.lineWidth = lw(c, 2);
  c.stroke();
}
function token(c: C2, env: PaintEnv, x: number, y: number) {
  c.fillStyle = withAlpha(shadowCol, 0.4);
  c.beginPath();
  c.arc(x + 1, y + 1.5, 6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = cardPaper(env);
  c.beginPath();
  c.arc(x, y, 6, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(inkCol(env), 0.6);
  c.lineWidth = lw(c, 1);
  c.stroke();
}

/** the wheel's angle for a tooth count: it turns clockwise one tooth per step, so tooth 300 comes round to the pawl
 *  after one full revolution */
const wheelA = (steps: number) => PAWL_A - Math.PI * 2 + (steps / 300) * Math.PI * 2;
/** the 300th tooth: a bold copper notch cut in the rim, with a small engraved brass tag reading 300 inboard of it */
function mark300(c: C2, env: PaintEnv, t: number, b: Beats, steps: number) {
  const a = wheelA(steps);
  const R = WHEEL.r;
  const glow = seg(t, b.slip - 0.3, b.slip) * (1 - seg(t, b.slip + 0.5, b.slip + 1.4));
  const cu = mixLab(copperOf(env, 0.5 + 0.5 * glow), '#5a2d12', 0.15 * (1 - glow));
  c.save();
  c.translate(WHEEL.x, WHEEL.y);
  // the notch: a copper wedge through the rim
  c.save();
  c.rotate(a);
  c.fillStyle = cu;
  c.beginPath();
  c.moveTo(R * 0.8, -9);
  c.lineTo(R + 7, -14);
  c.lineTo(R + 7, 14);
  c.lineTo(R * 0.8, 9);
  c.closePath();
  c.fill();
  c.restore();
  // the tag: upright, so it stays readable as it rides round
  // beside the pointer (which rides the notch's own radius), trailing it, so the pointer never crosses the digits
  const ta = a - 0.36;
  const tx = Math.cos(ta) * R * 0.7, ty = Math.sin(ta) * R * 0.7;
  c.fillStyle = mixLab(brassOf(env, 0.5 + 0.5 * glow), '#fff0c8', 0.15);
  c.fillRect(tx - 30, ty - 15, 60, 30);
  c.strokeStyle = cu;
  c.lineWidth = lw(c, 2);
  c.strokeRect(tx - 30, ty - 15, 60, 30);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `700 20px ${FONT.mono}`, 20);
    c.font = `700 ${size}px ${FONT.mono}`;
    c.fillStyle = '#2a1a0e';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('300', tx, ty + 1);
    textProbe(c, `${ID}-t300`, WHEEL.x + tx - 30, WHEEL.y + ty - 15, 60, 30, 1);
  });
  c.restore();
}
/** a long brass pointer fixed to the wheel's arbor, aimed at the 300 notch: it sweeps a full revolution as the wheel
 *  races (one tooth per step) and a motion smear trails it while it is fast; it rests under the pawl */
function pointer(c: C2, env: PaintEnv, t: number, b: Beats, steps: number) {
  const a = wheelA(steps);
  const prev = wheelA(stepsAt(t - 0.1, b));
  const sweep = a - prev;
  // it stops short of the rim, so the copper notch it aims at shows beyond its tip
  const R = WHEEL.r * 0.76;
  c.save();
  c.translate(WHEEL.x, WHEEL.y);
  if (Math.abs(sweep) > 0.02) {
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(brassOf(env, 0.6), Math.min(0.32, Math.abs(sweep) * 0.35));
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, R, Math.min(prev, a), Math.max(prev, a));
    c.closePath();
    c.fill();
    c.globalCompositeOperation = 'source-over';
  }
  c.rotate(a);
  c.fillStyle = withAlpha(shadowCol, 0.5);
  c.beginPath();
  c.moveTo(-R * 0.18 + 3, -7 + 4);
  c.lineTo(R + 3, 4);
  c.lineTo(-R * 0.18 + 3, 7 + 4);
  c.closePath();
  c.fill();
  const g = c.createLinearGradient(0, -8, 0, 8);
  g.addColorStop(0, mixLab(brassOf(env, 0.9), '#fff0c8', 0.3));
  g.addColorStop(1, brassOf(env, 0.15));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-R * 0.18, -8);
  c.lineTo(R * 0.86, -3);
  c.lineTo(R, 0);
  c.lineTo(R * 0.86, 3);
  c.lineTo(-R * 0.18, 8);
  c.closePath();
  c.fill();
  c.strokeStyle = mixLab(brassOf(env, 0), '#2a1d14', 0.5);
  c.lineWidth = lw(c, 1.2);
  c.stroke();
  c.fillStyle = mixLab(brassOf(env, 0.4), '#2a1d14', 0.3);
  c.beginPath();
  c.arc(0, 0, 13, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
/** the release pawl: a hooked click on a pivot above the wheel's top right, its tooth down in the teeth; on 'stops'
 *  it flips up about 25 degrees (and drops back as the wheel resets on 'bound') */
function pawl(c: C2, env: PaintEnv, release: number) {
  const tip = { x: WHEEL.x + Math.cos(PAWL_A) * WHEEL.r, y: WHEEL.y + Math.sin(PAWL_A) * WHEEL.r };
  const dx = tip.x - PAWL.x, dy = tip.y - PAWL.y;
  const L = Math.hypot(dx, dy);
  const base = Math.atan2(dy, dx);
  c.save();
  c.translate(PAWL.x, PAWL.y);
  c.rotate(base + (25 * Math.PI) / 180 * release);
  // the arm: tapered, a counterweight tail behind the pivot, the click tooth hooked down at the end
  c.fillStyle = INK;
  c.beginPath();
  c.moveTo(-40, -14);
  c.lineTo(L - 16, -8);
  c.lineTo(L + 6, 2);
  c.lineTo(L - 6, 24);
  c.lineTo(L - 20, 9);
  c.lineTo(-40, 14);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(-40, 0, 22, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(brassOf(env, 0.4 + 0.6 * release), 0.6 + 0.4 * release);
  c.lineWidth = lw(c, 1.8);
  c.beginPath();
  c.moveTo(-34, -14);
  c.lineTo(L - 16, -8);
  c.lineTo(L + 6, 2);
  c.stroke();
  c.restore();
  // the pivot: a brass screw head
  c.fillStyle = brassOf(env, 0.5);
  c.beginPath();
  c.arc(PAWL.x, PAWL.y, 7, 0, Math.PI * 2);
  c.fill();
}

// ------------------------------------------------------------------ the two-sided card
function twoSidedCard(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  // drops a short way on its thread, in frame, on 'every' (readable by every+0.4), then turns slowly
  const inU = ease5((tq - (b.card - 0.15)) / 0.4);
  if (inU <= 0) return;
  // turns about its vertical axis, slowly, evenly lit: one face, then the other
  const th = Math.max(0, tq - (b.card + 0.7)) * 1.0;
  const sx = Math.cos(th);
  const face = sx >= 0 ? 0 : 1;
  const w = CARD.w * Math.max(0.03, Math.abs(sx));
  const x = CARD.x;
  const y = CARD.y - (1 - inU) * 70;
  c.save();
  c.globalAlpha = clamp01(inU * 2.5);
  // a thread up to the lamp
  c.strokeStyle = INK;
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.moveTo(x, y - CARD.h / 2);
  c.lineTo(x, y - CARD.h / 2 - 200);
  c.stroke();
  c.fillStyle = withAlpha(shadowCol, 0.35);
  c.fillRect(x - w / 2 + 5, y - CARD.h / 2 + 7, w, CARD.h);
  c.fillStyle = cardPaper(env);
  c.fillRect(x - w / 2, y - CARD.h / 2, w, CARD.h);
  c.strokeStyle = withAlpha(inkCol(env), 0.5);
  c.lineWidth = lw(c, 1.2);
  c.strokeRect(x - w / 2, y - CARD.h / 2, w, CARD.h);
  // the face drawing, squeezed with the turn
  c.translate(x, y);
  c.scale(Math.max(0.03, Math.abs(sx)), 1);
  if (face === 0) faceCarry(c, env);
  else faceSnap(c, env);
  c.restore();
}
/** face A: a backlog of tokens carried on across the frame line, into the next frame */
function faceCarry(c: C2, env: PaintEnv) {
  const ink = inkCol(env);
  c.strokeStyle = withAlpha(ink, 0.7);
  c.lineWidth = lw(c, 1.6);
  c.setLineDash([5, 4]);
  c.beginPath();
  c.moveTo(0, -100);
  c.lineTo(0, 100);
  c.stroke();
  c.setLineDash([]);
  for (let i = 0; i < 9; i++) {
    const x = -78 + (i % 3) * 22 + Math.floor(i / 3) * 52;
    const y = -40 + (i % 3) * 30 - Math.floor(i / 3) * 4;
    tokenInk(c, env, x, y);
  }
  // the arrow: the backlog goes on
  c.strokeStyle = copperOf(env, 0.4);
  c.lineWidth = lw(c, 2.6);
  c.beginPath();
  c.moveTo(-70, 70);
  c.lineTo(70, 70);
  c.moveTo(58, 60);
  c.lineTo(72, 70);
  c.lineTo(58, 80);
  c.stroke();
}
/** face B: the ratchet with its pawl lifted, empty, and a window sitting on its outline */
function faceSnap(c: C2, env: PaintEnv) {
  const ink = inkCol(env);
  c.fillStyle = ink;
  c.beginPath();
  const r = 46;
  for (let i = 0; i < 40; i++) {
    const a0 = (i / 40) * Math.PI * 2, a1 = ((i + 0.5) / 40) * Math.PI * 2;
    c.lineTo(Math.cos(a0) * r * 0.9, -20 + Math.sin(a0) * r * 0.9);
    c.lineTo(Math.cos(a1) * r, -20 + Math.sin(a1) * r);
  }
  c.closePath();
  c.moveTo(r * 0.55, -20);
  c.arc(0, -20, r * 0.55, 0, Math.PI * 2, true);
  c.fill('evenodd');
  // the pawl, lifted
  c.fillRect(8, -86, 46, 7);
  // the window, home on its dashed outline
  c.save();
  c.setLineDash([4, 3]);
  c.strokeStyle = copperOf(env, 0.5);
  c.lineWidth = lw(c, 1.6);
  c.strokeRect(-46, 52, 92, 50);
  c.restore();
  c.fillStyle = cardPaper(env);
  c.fillRect(-46, 52, 92, 50);
  c.fillStyle = withAlpha(ink, 0.85);
  c.fillRect(-46, 52, 92, 9);
  c.strokeStyle = withAlpha(ink, 0.6);
  c.lineWidth = lw(c, 1);
  c.strokeRect(-46, 52, 92, 50);
}

// ------------------------------------------------------------------ labels
function labels(c: C2, env: PaintEnv, t: number, b: Beats) {
  // 300 steps = 1,200 ms, on a slip pinned in the right third, on 'stops'
  paperSlip(c, env, { lines: ['300 steps = 1,200 ms'], x: 960, y: 182, t, inkAt: b.slip + 0.05, id: `${ID}-bound`, font: 'mono', size: 22, pin: true });
  // the card's one label, both faces named, on 'every'
  paperSlip(c, env, { lines: ['others carry time · Handwired snaps'], x: CARD.x, y: CARD.y + CARD.h / 2 + 24, t, inkAt: b.card + 0.35, id: `${ID}-card`, size: 24 });
}
void lin;
void FONT;
void legibleSize;
void textProbe;
void textRole;
