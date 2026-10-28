/**
 * ch04-s07 — THE COLD LIMIT (scene; candleAmber → winterBlue tint crossfade; crossfade in; 13.6 s). The dive's one
 * cold excursion, past 2^24.
 * L0412 "Past nearly seventeen million, floats skip whole numbers."
 * L0413 "Just past it, the second ramp's input rounds down. A bit meant for nought or one reads two. Answer: eight."
 *
 * Opens on ch04-s06's last frame (CAM6_END: the machine at a = 5, the 10 in the tray) and WHIPS right along the
 * bench's number line (1.15 s; L6 post, L5 bench edge, L3 bench, L2 window bay and L1 ridge sliding at their own
 * speeds, the haze streaking), out past the bay's right jamb into cold blue light, to a GIANT RULER laid on the bench.
 *
 * TEACHES, word by word (every number COMPUTED with Math.fround: rampBench's RB maths on a = 16,777,222):
 *   whip (0-1.15)   the integer rule runs on (6, 7, 8 …), a break mark, then the giant ruler: one tick per whole number
 *   'seventeen'     a flag on the tall 16,777,216 tick inks '2²⁴ = 16,777,216'; past it the odd ticks drop out of
 *                   the ruler one by one: the ticks now stand 2 apart
 *   'past'          the marble lands on 16,777,222
 *   (then)          two pointers leave the marble, each carrying its board's emblem (board one copper, board two
 *                   pale): board one's a − 4 stops on 16,777,218, a tick that exists; board two's a − 5 stops over
 *                   16,777,217, where there is no tick, and hovers
 *   'rounds'        the pale pointer slides down to 16,777,216 (round to even); the card inks 'a = 16,777,222'; a
 *                   copper bracket spans the two pointers: two ticks apart
 *   pull-back (7.75-10.25) the camera pulls back and drifts right: the lever, the belts and the tray come in
 *   'two'           the lever swings past its 1 stop to 2 and bends the stop peg; ' · bit = 2'
 *   'Answer'        the over-open 10 shutter's frame splays, its panel gone; the 12 shutter's panel is pushed down
 *                   through the belt (minus one); the belts step: a copper 20 and an indigo −12 are thrown in
 *   'eight'         they fuse with a dull clack into 8; ' · 20 − 12 = 8'. Hold, cold.
 * Text: the edge flag and the card (two items, one per beat), plus the ruler's own small numerals (texture).
 *
 * Review r1: the bay's window row runs on past the jamb (L2, cold-lit, receding; it streaks by in the whip), the ruler
 * is a cut card (dark top rim, cool paper falling off to its foot, a cast shadow), a ruler clamp is the L5 occluder at
 * the lower-left corner; each pin hops back from the marble one tick per hop (4 for board one, 5 for board two) on a
 * ramp-coloured stem; the pale pin stands over 16,777,217's gap (a dashed ghost tick and a cross) and slides down to
 * 16,777,216 from 7.0 s; the machine sits out of frame until the reveal (truck + pull-back, done by 'two'), the stop
 * kinks visibly; the forced tiles (s06's size on screen) pass the gate's funnelled and driven-down windows.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, ghostOk, mixLab, snow, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { RB, rampBench } from '../sets/rampBench';
import { copperOf } from '../sets/narratorHands';
import {
  CAM6_END,
  LAMP,
  M6,
  PAPER,
  PAPER_INK,
  beltBand,
  benchRoom,
  feeder,
  heroTile,
  leverGauge,
  marble,
  nearEdge,
  nearPost,
  settle,
  tray,
  xOfA,
  leverAngle,
  type RoomOpts,
} from '../sets/ch04-s06-bench';
import { GATE, gateBack, gateFront, slabTile } from '../sets/ch04-s06-gate';

const ID = 'ch04-s07';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const f32 = Math.fround;

// ---------------------------------------------------------------- the maths (computed, FP32)
const TWO24 = 16777216;
const A = 16777222;
const R1 = RB.ramp(A, 4); // board one's input a − 4: 16,777,218 (a tick that exists)
const R2 = RB.ramp(A, 5); // board two's a − 5: 16,777,217 has no float; rounds to 16,777,216
const BIT = RB.above4(A); // 2
const T10 = RB.fmt(f32(10 * BIT)); // 20
const T12 = RB.fmt(f32(f32(1 - BIT) * 12)); // −12
const SUM = RB.fmt(RB.result(A)); // 8
const commas = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const minus = (s: string) => s.replace('-', '−');
const D_R1 = R1 - TWO24; // 2
const D_R2X = A - 5 - TWO24; // 1: where a − 5 would sit (no tick)
const D_R2 = R2 - TWO24; // 0
const D_A = A - TWO24; // 6

// ---------------------------------------------------------------- camera
/** the settled camera after the whip (x), and the reveal: a truck right with a pull-back that brings the machine in */
const SETTLE_X = 3200;
const PAN = SETTLE_X - CAM6_END.x;
const TRUCK = 476;
const PULL = -330;
const WHIP = 1.15;
const TRUCK_DUR = 2.6;
function cam7(t: number, b: Beats): Camera3 {
  const u = clamp01(t / WHIP);
  const whip = (1 - Math.cos(Math.PI * u)) / 2;
  const tr = sm((t - b.truck) / TRUCK_DUR);
  return {
    x: CAM6_END.x + PAN * whip + TRUCK * tr + 14 * sm(t / 7),
    y: lerp(CAM6_END.y, 368, whip) - 68 * tr,
    z: CAM6_END.z * (1 - whip) + PULL * tr + 36 * sm((t - b.push) / 3.2),
    lens: 1,
  };
}
const whipSpeed = (t: number) => (t <= 0 || t >= WHIP ? 0 : Math.sin(Math.PI * (t / WHIP)));

// ---------------------------------------------------------------- the far bench (L4 world px)
/** at the settled camera (x = CAM6_END.x + PAN) a world point x lands on screen x − (CAM6_END.x + PAN − 640) */
const EDGE_X = 2964; // 2^24 on the giant ruler
const UNIT = 128;
const xN = (d: number) => EDGE_X + d * UNIT;
const RY = 430; // the giant ruler's top edge
const RB_BOT = 596;
const D_MIN = -12, D_MAX = 7;
const SMALL_END = xN(D_MIN); // the integer rule runs from the machine to here
/** the far machine: the same lever / belts / gate / tray as ch04-s06, past the marble (out of frame until the reveal) */
const F = {
  feed: 3914,
  SX: 4054,
  END10: 4132,
  END12: 4108,
  LX: 4180,
  LY: M6.LY,
  LR: 96,
  TX: 4370,
  TW: 196,
  SLOT12: 4322,
  SLOT10: 4418,
};
/** at the revealed camera (scale ≈ 0.79) these tiles are s06's tiles' size on screen */
const TILE_S = 2.3;
const GAP7 = 64;
const TILE_W = 34 * TILE_S;
const G = 2600;
const throwDur = (y: number) => Math.sqrt((2 * Math.max(10, M6.TY - 4 - y)) / G);

interface Beats {
  edge: number;
  far: number;
  rounds: number;
  two: number;
  answer: number;
  eight: number;
  truck: number;
  push: number;
  step: number;
  /** when each forced tile reaches its belt's end and lands */
  end10: number;
  end12: number;
  land10: number;
  land12: number;
}

const STEP = 0.5;
const W0 = F.SX - GATE.W / 2 - TILE_W / 2 - 8; // where the waiting tiles sit, clear of the gate, before the step
const stepX = (t: number, s: number) => W0 + 200 * sm((t - s) / STEP);
function timeAt(s: number, x: number) {
  let lo = s, hi = s + STEP;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (stepX(m, s) < x) lo = m;
    else hi = m;
  }
  return hi;
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const rounds = T.beat('rounds');
    const step = T.word('L0413', 'Answer') - 0.3;
    const end10 = timeAt(step, F.END10);
    const end12 = timeAt(step, F.END12);
    const b: Beats = {
      edge: T.beat('edge'),
      far: T.beat('far'),
      rounds,
      two: T.beat('two'),
      answer: T.word('L0413', 'Answer'),
      eight: T.beat('eight'),
      truck: rounds + 0.45,
      push: T.beat('two') + 0.3,
      step,
      end10,
      end12,
      land10: end10 + throwDur(M6.Y10),
      land12: end12 + throwDur(M6.Y12),
    };
    tl.hold(0, D);
    return { tl, b, D };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const cam = cam7(t, b);
    f.camera(cam);
    const moodU = sm((t + 0.5) / 3);
    f.setMood('winterBlue', { from: 'candleAmber', u: moodU });
    const room: RoomOpts = { key: ID, from: 'candleAmber', to: 'winterBlue', u: moodU, sunX: 700, extraR: PAN + TRUCK + 420, wallEnd: 1390, coldBay: 3300, far: true, intensity: 1 - 0.15 * moodU };
    benchRoom(f, room);
    // the bench lamp, left behind in the room (it goes out of frame in the whip)
    f.practical({ x: LAMP.x, y: LAMP.y, kind: 'lamp', seed: LAMP.seed, intensity: 0.9 - 0.6 * moodU, radius: LAMP.radius, layer: 'L3' });
    streaks(f, t, 0.22);
    f.fog({ yCenter: 540, height: 120, alpha: 0.1, drift: 8 });

    const flakes = win(t, WHIP, WHIP + 1.5);
    if (flakes > 0) {
      f.layer('L3', (c, env) => {
        c.save();
        c.globalAlpha *= flakes * 0.7;
        snow(c, { area: { x: 1900, y: -60, w: 2900, h: 760 }, count: 90, fall: 22, wind: 10, size: 0.8, depthRange: [0, 0.5], salt: 7 }, env);
        c.restore();
      });
    }
    f.layer('L4', (c, env) => {
      startMachine(c, env, t);
      integerRule(c, env);
      giantRuler(c, env, t, tq, b);
      pointers(c, env, t, tq, b);
      farMachine(c, env, t, tq, b);
    });
    f.rim({ x: 0, y: -1 });
    nearEdge(f, ID, room, -260, 1560 + (PAN + TRUCK) * 1.54 + 900);
    // the near ruler clamp at the lower-left corner (L5): it comes in from the right in the whip and slides out left
    // in the reveal (the near plane's parallax)
    f.layer('L5', (c, env) => rulerClamp(c, env, 110 + (SETTLE_X - 640) * 1.5385, 600));
    nearPost(f, ID, room, 1226);
    streaks(f, t, 0.1);
    card(f.c, f, t, b);
  },
});

// ---------------------------------------------------------------- the whip's haze streaks (screen-locked)
function streaks(f: { c: C; mood: { haze: string; rim: string } }, t: number, alpha: number) {
  const v = whipSpeed(t);
  if (v <= 0.02) return;
  const c = f.c;
  c.save();
  for (let i = 0; i < 16; i++) {
    const y = 120 + ((i * 97) % 520);
    const len = 300 + ((i * 53) % 400);
    const x = ((i * 211 - t * 5200) % 1800 + 1800) % 1800 - 260;
    const g = c.createLinearGradient(x, 0, x + len, 0);
    g.addColorStop(0, withAlpha(f.mood.haze, 0));
    g.addColorStop(0.5, withAlpha(mixLab(f.mood.haze, f.mood.rim, 0.3), alpha * v));
    g.addColorStop(1, withAlpha(f.mood.haze, 0));
    c.fillStyle = g;
    c.fillRect(x, y, len, 2 + (i % 3) * 2);
  }
  c.restore();
}

// ---------------------------------------------------------------- where the whip starts: ch04-s06's last frame
function startMachine(c: C, env: PaintEnv, t: number) {
  if (t > WHIP * 0.7) return; // gone off the left edge by then
  rampBench(c, env, { x: M6.BX, y: M6.BY, s: M6.S, domain: M6.DOMAIN, boards: 2, lever: false, tray: false, numerals: true });
  marble(c, env, xOfA(5), M6.BY - M6.MARBLE_R, M6.MARBLE_R, 0.4);
  // the link rod, the lever at 1
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(M6.LX, M6.LY);
  c.lineTo(M6.SX, M6.Y12 + GATE.FOOT / 2);
  c.stroke();
  leverGauge(c, env, { x: M6.LX, y: M6.LY, r: M6.LR, value: 1, stand: M6.BY - M6.LY });
  // s06's last frame: the gate fully open over the 10, shut over the 12, the next tiles waiting clear of it
  const gate = { x: M6.SX, y10: M6.Y10, y12: M6.Y12, open10: 1, open12: 0 };
  for (const r of [{ v: 10, y: M6.Y10, end: M6.END10 }, { v: 12, y: M6.Y12, end: M6.END12 }]) beltBand(c, env, M6.BELT_X0, r.end, r.y);
  gateBack(c, env, gate);
  for (const r of [{ v: 10, y: M6.Y10 }, { v: 12, y: M6.Y12 }]) {
    for (let k = 0; k < 3; k++) {
      const x = M6.SX - 82 - 190 * k;
      if (x > M6.BELT_X0) heroTile(c, env, x, r.y, String(r.v), { s: M6.TILE_S });
    }
  }
  gateFront(c, env, gate);
  feeder(c, env, M6.BELT_X0, M6.Y10 - 70, M6.Y12 + 22, [M6.Y10, M6.Y12]);
  tray(c, env, M6.TX, M6.TY, M6.TW, 30, M6.BY);
  heroTile(c, env, M6.TX, M6.TY - 5, RB.fmt(RB.result(5)), { s: M6.TILE_S * 1.08 });
}

/** the bench's integer rule running on from the machine (6, 7, 8 …), a break mark, into the giant ruler */
function integerRule(c: C, env: PaintEnv) {
  const x0 = xOfA(M6.DOMAIN[1]) + 10;
  const U = 110 * M6.S;
  const y = M6.BY;
  c.fillStyle = mixLab(mixLab('#d8c393', env.mood.halo, 0.3), env.mood.set, 0.15);
  c.fillRect(x0, y, SMALL_END - x0, 15);
  const brk = 1220;
  c.strokeStyle = withAlpha('#1d140d', 0.8);
  c.lineWidth = 1.4;
  c.beginPath();
  for (let a = 6; xOfA(a) < brk - 20; a++) {
    c.moveTo(xOfA(a), y);
    c.lineTo(xOfA(a), y + 12);
  }
  // the break: two slashes
  c.moveTo(brk - 8, y + 16);
  c.lineTo(brk - 2, y - 2);
  c.moveTo(brk + 2, y + 16);
  c.lineTo(brk + 8, y - 2);
  c.stroke();
  textRole(c, 'texture', () => {
    c.fillStyle = withAlpha('#1d140d', 0.85);
    c.font = `${(16 * M6.S).toFixed(1)}px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    for (let a = 6; xOfA(a) < brk - 20; a++) c.fillText(String(a), xOfA(a), y + 19);
    c.textAlign = 'left';
  });
  void U;
}

// ---------------------------------------------------------------- the giant ruler
function giantRuler(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const x0 = xN(D_MIN) - 30, x1 = xN(D_MAX) + 30;
  rulerCard(c, env, x0, x1);
  // the ticks: every whole number up to 2^24; past it the odd ones drop out of the ruler on 'seventeen'
  const ink = '#1a1c20';
  for (let d = D_MIN; d <= D_MAX; d++) {
    const x = xN(d);
    const odd = d > 0 && d % 2 !== 0;
    let dy = 0, rot = 0, a = 1;
    if (odd) {
      const tf = b.edge + 0.06 + 0.11 * ((d - 1) / 2);
      const tau = Math.max(0, tq - tf);
      if (tau > 0) {
        dy = 0.5 * 2200 * tau * tau;
        rot = tau * 2.4 * (d % 4 === 1 ? 1 : -1);
        a = 1 - sm(tau / 0.55);
      }
      if (a <= 0) {
        // the empty slot where it was: a faint notch on the ruler's edge
        c.fillStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.4), 0.45);
        c.fillRect(x - 4, RY, 8, 7);
        continue;
      }
    }
    const len = d === 0 ? 0 : d % 2 === 0 ? 64 : 44;
    c.save();
    c.globalAlpha *= a;
    c.translate(x, RY + dy);
    c.rotate(rot);
    c.fillStyle = ink;
    c.fillRect(-2.2, 0, 4.4, len);
    c.restore();
  }
  // the tall edge tick at 2^24 (copper-capped), standing up from the ruler
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(EDGE_X - 3, RY - 128, 6, 128 + 74);
  c.fillStyle = copperOf(env, 0.4 + 0.4 * win(t, b.edge, b.edge + 0.4));
  c.beginPath();
  c.arc(EDGE_X, RY - 128, 6.5, 0, Math.PI * 2);
  c.fill();
  // numerals under the even ticks (the ruler's own scale: texture); 2^24's in copper ink
  textRole(c, 'texture', () => {
    c.font = `500 22px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    for (let d = D_MIN; d <= D_MAX; d++) {
      if (d % 2 !== 0) continue;
      c.fillStyle = d === 0 ? mixLab('#8a4421', env.mood.core, 0.1) : withAlpha('#2a2c31', 0.8);
      c.fillText(commas(TWO24 + d), xN(d), RY + 100);
    }
    c.textAlign = 'left';
  });
  edgeFlag(c, env, t, b);
  // the copper bracket: the two readings stand two ticks apart (what the lever will read)
  const br = win(t, b.rounds + 0.5, b.rounds + 0.9);
  if (br > 0) {
    const y = RB_BOT + 16;
    const xa = xN(D_R2), xb = lerp(xN(D_R2), xN(D_R1), br);
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(xa, y - 9);
    c.lineTo(xa, y);
    c.lineTo(xb, y);
    if (br > 0.98) c.lineTo(xb, y - 9);
    c.stroke();
    c.strokeStyle = copperOf(env, 0.7);
    c.lineWidth = 3;
    c.stroke();
  }
}

/** the flag on the tall tick: '2²⁴ = 16,777,216', inked on 'seventeen' */
function edgeFlag(c: C, env: PaintEnv, t: number, b: Beats) {
  // review r1: the flag carries its text the moment it shows (ink within 3 frames of the paper), before 'seventeen'
  const inkAt = b.edge - 0.22;
  const paper = cardPaperAlpha(t, inkAt);
  if (paper <= 0.001) return;
  const ink = cardInkAlpha(t, inkAt);
  // it hangs to the right of the tall tick, so the reveal's wider frame keeps it whole
  const w = 268, h = 48, x = EDGE_X - 40, y = RY - 196;
  // the flag hangs from the tall tick's copper cap on two short cords
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85 * paper);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(EDGE_X, RY - 128);
  c.lineTo(x + 30, y + h);
  c.moveTo(EDGE_X, RY - 128);
  c.lineTo(x + w - 30, y + h);
  c.stroke();
  c.save();
  c.globalAlpha *= paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x + 3, y + 4, w, h);
  c.fillStyle = mixLab(mixLab(PAPER, env.mood.halo, 0.2), env.mood.core, 0.15);
  c.fillRect(x, y, w, h);
  c.restore();
  cardProbe(c, `${ID}/flag`, x, y, w, h, paper, ink);
  // one equation in three runs (the exponent is raised): a deliberate overlap with its own probe, not a ghost
  ghostOk(c, () => textRole(c, 'subject', () => {
    c.save();
    c.fillStyle = withAlpha(PAPER_INK, ink);
    c.font = `500 24px ${FONT.mono}`;
    c.textBaseline = 'alphabetic';
    const by = y + 33;
    let cx = x + 16;
    c.fillText('2', cx, by);
    cx += c.measureText('2').width;
    c.font = `500 22px ${FONT.mono}`;
    c.fillText('24', cx + 1, by - 12);
    cx += c.measureText('24').width + 3;
    c.font = `500 24px ${FONT.mono}`;
    const rest = ` = ${commas(TWO24)}`;
    c.fillText(rest, cx, by);
    textProbe(c, `${ID}/flag`, x + 16, by - 20, cx + c.measureText(rest).width - x - 16, 24, ink);
    c.restore();
  }));
}

// ---------------------------------------------------------------- the ruler as a cut card, and its near clamp
/** the giant ruler: a cut card lying on the bench (cool paper falling off to its foot, a black top rim with a cold
 *  rim light, a deckled foot), and its cast shadow on the bench */
function rulerCard(c: C, env: PaintEnv, x0: number, x1: number) {
  const h = RB_BOT - RY;
  // cast shadow on the bench, lit from the windows behind (falls toward us)
  const sh = c.createLinearGradient(0, RB_BOT - 6, 0, RB_BOT + 40);
  sh.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.55));
  sh.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
  c.fillStyle = sh;
  c.fillRect(x0 + 10, RB_BOT - 6, x1 - x0 + 10, 46);
  // the card, cool paper, darkening to its foot
  const paper = mixLab(mixLab('#d9d6cc', env.mood.halo, 0.15), env.mood.set, 0.26);
  const g = c.createLinearGradient(0, RY, 0, RB_BOT);
  g.addColorStop(0, paper);
  g.addColorStop(0.5, mixLab(paper, env.mood.set, 0.32));
  g.addColorStop(1, mixLab(paper, PUPPET_NEAR_BLACK, 0.55));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x0, RY);
  c.lineTo(x1, RY);
  c.lineTo(x1 + 2, RB_BOT - 4);
  for (let x = x1; x > x0; x -= 18) c.lineTo(x, RB_BOT + 1.6 * hash01(x));
  c.lineTo(x0 - 2, RB_BOT - 2);
  c.closePath();
  c.fill();
  // a faint grain along the card
  c.strokeStyle = withAlpha(PAPER_INK, 0.05);
  c.lineWidth = 1;
  c.beginPath();
  for (let k = 0; k < 6; k++) {
    const y = RY + 16 + k * (h - 24) / 6;
    c.moveTo(x0 + 6, y);
    c.lineTo(x1 - 6, y + 1);
  }
  c.stroke();
  // the dark top rim (the card's thickness seen from above) and its cold rim light
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x0 - 2, RY - 10, x1 - x0 + 4, 11);
  c.fillRect(x1 - 2, RY - 7, 6, h + 4);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.85);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(x0 - 2, RY - 10);
  c.lineTo(x1 + 4, RY - 10);
  c.stroke();
}
const hash01 = (x: number) => {
  const v = Math.sin(x * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};

/** L5: a G-clamp holding the ruler card to the near bench edge (big, blurred by the layer) */
function rulerClamp(c: C, env: PaintEnv, x0: number, y0: number) {
  c.save();
  c.translate(x0, y0);
  c.scale(1.35, 1.35);
  const x = 0, y = 0;
  c.fillStyle = env.fill('fg');
  c.beginPath();
  // the C frame: an upper jaw over the bench edge, a back spine, a lower arm under it
  c.moveTo(x - 70, y - 40);
  c.lineTo(x + 60, y - 40);
  c.quadraticCurveTo(x + 96, y - 40, x + 96, y - 4);
  c.lineTo(x + 96, y + 150);
  c.quadraticCurveTo(x + 96, y + 182, x + 62, y + 182);
  c.lineTo(x - 30, y + 182);
  c.lineTo(x - 30, y + 150);
  c.lineTo(x + 54, y + 150);
  c.lineTo(x + 54, y - 8);
  c.lineTo(x - 70, y - 8);
  c.closePath();
  c.fill();
  // the jaw pad, the screw and its T-bar under the bench
  c.fillRect(x - 84, y - 50, 40, 14);
  c.fillRect(x - 16, y + 182, 12, 70);
  c.fillRect(x - 60, y + 246, 100, 14);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - 70, y - 40);
  c.lineTo(x + 60, y - 40);
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- the marble and the two board pointers
/** the two pins: each hops back from the marble one tick per hop (board one: a − 4, four hops; board two: a − 5, five) */
const HOP = 0.2;
function hopD(tq: number, from: number, hops: number, at: number) {
  const k = Math.max(0, Math.min(hops, (tq - at) / HOP));
  const i = Math.floor(k);
  const f = sm((k - i) / 0.8);
  return { d: from - i - f, lift: i < hops ? Math.sin(Math.PI * clamp01((k - i) / 0.8)) : 0, done: Math.min(hops, i + (f >= 1 ? 1 : 0)) };
}
function pointers(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  // the marble lands on 16,777,222 on 'past'
  const r = 16;
  const fall0 = b.far - 0.42;
  if (tq >= fall0) {
    const tau = tq - fall0;
    const yRest = RY - 7 - r;
    let y = Math.min(yRest, -60 + 0.5 * 2600 * tau * tau);
    if (y >= yRest) {
      const dt = tq - (fall0 + Math.sqrt((2 * (yRest + 60)) / 2600));
      y = yRest - (dt >= 0 && dt < 1 / 12 ? 6 : dt < 2 / 12 ? 2 : 0);
    }
    marble(c, env, xN(D_A), y, r, 0.3);
  }
  const show = win(tq, b.far + 0.25, b.far + 0.45);
  if (show <= 0) return;
  // board one's pin: four hops back from the marble, onto 16,777,218 (a tick that exists)
  const h1 = hopD(tq, D_A, D_A - D_R1, b.far + 0.5);
  // board two's pin: five hops back, onto 16,777,217's gap (no tick there); on 'rounds' it slides down to 16,777,216
  const h2 = hopD(tq, D_A, D_A - D_R2X, b.far + 0.5 + 0.1);
  const slideAt = b.rounds - 0.2;
  const slide = sm((tq - slideAt) / 0.6);
  const d2 = tq >= slideAt ? lerp(D_R2X, D_R2, slide) : h2.d;
  const atGap = h2.done >= D_A - D_R2X;
  c.save();
  c.globalAlpha *= show;
  // the hop trails: one small arc per tick hopped, in each board's colour
  hopTrail(c, D_A, h1.done, copperOf(env, 0.6), RY - 30);
  hopTrail(c, D_A, h2.done, mixLab(PAPER, env.mood.halo, 0.2), RY - 54);
  // the gap under the pale pin: a dashed ghost tick where 16,777,217 would be, and a small cross ('no tick')
  if (atGap) {
    const ga = 1 - win(tq, slideAt + 0.45, slideAt + 0.9);
    const gx = xN(D_R2X);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, PUPPET_NEAR_BLACK, 0.3), 0.9 * ga);
    c.setLineDash([5, 4]);
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(gx, RY);
    c.lineTo(gx, RY + 44);
    c.stroke();
    c.setLineDash([]);
    c.strokeStyle = withAlpha('#7c2b1f', 0.85 * ga);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(gx - 8, RY + 52);
    c.lineTo(gx + 8, RY + 68);
    c.moveTo(gx + 8, RY + 52);
    c.lineTo(gx - 8, RY + 68);
    c.stroke();
  }
  // a motion smear behind the pale pin as it slides down
  if (tq >= slideAt && slide < 1) {
    c.strokeStyle = withAlpha(mixLab(PAPER, env.mood.halo, 0.2), 0.5 * (1 - slide));
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(xN(D_R2X), RY - 20);
    c.lineTo(xN(d2), RY - 20);
    c.stroke();
  }
  pointer(c, env, xN(d2), 'pale', tq, slide >= 1 ? slideAt + 0.6 : -1, h2.lift);
  pointer(c, env, xN(h1.d), 'copper', tq, b.far + 0.5 + 4 * HOP, h1.lift);
  c.restore();
}

/** small arcs over the ruler from the marble back, one per hop completed */
function hopTrail(c: C, from: number, hops: number, col: string, y: number) {
  if (hops <= 0) return;
  c.strokeStyle = withAlpha(col, 0.9);
  c.lineWidth = 2.2;
  c.setLineDash([4, 4]);
  c.beginPath();
  for (let i = 0; i < hops; i++) {
    const xa = xN(from - i), xb = xN(from - i - 1);
    c.moveTo(xa, y);
    c.quadraticCurveTo((xa + xb) / 2, y - 34, xb, y);
  }
  c.stroke();
  c.setLineDash([]);
}

/** a hanging pointer: its board's emblem (flat then a 45° climb, hinge pin) on a ramp-coloured stem, a wedge tip */
function pointer(c: C, env: PaintEnv, x: number, kind: 'copper' | 'pale', tq: number, clickAt: number, lift = 0) {
  const dip = clickAt > 0 && tq >= clickAt && tq < clickAt + 2 / 12 ? 3 : 0;
  const tipY = RY - 8 + dip - lift * 18;
  const top = tipY - 132;
  const paleC = mixLab(mixLab(PAPER, env.mood.halo, 0.2), env.mood.set, 0.15);
  const stemC = kind === 'copper' ? copperOf(env, 0.75) : paleC;
  // the emblem plate (bigger: board one dark with a copper ramp, board two pale with a dark ramp)
  const body = kind === 'copper' ? PUPPET_NEAR_BLACK : paleC;
  c.fillStyle = body;
  c.beginPath();
  c.roundRect(x - 34, top, 68, 52, 4);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.8);
  c.lineWidth = 1.4;
  c.stroke();
  const ramp = kind === 'copper' ? copperOf(env, 0.7) : PUPPET_NEAR_BLACK;
  c.strokeStyle = ramp;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(x - 25, top + 40);
  c.lineTo(x - 3, top + 40);
  c.lineTo(x + 22, top + 15);
  c.stroke();
  c.fillStyle = kind === 'copper' ? mixLab(env.mood.core, '#ffffff', 0.2) : copperOf(env, 0.4);
  c.beginPath();
  c.arc(x - 3, top + 40, 3.6, 0, Math.PI * 2);
  c.fill();
  // the stem, in the board's colour, cut out with a dark edge
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x - 5, top + 52, 10, tipY - top - 66);
  c.fillStyle = stemC;
  c.fillRect(x - 3, top + 52, 6, tipY - top - 66);
  // the wedge tip
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(x - 10, tipY - 16);
  c.lineTo(x + 10, tipY - 16);
  c.lineTo(x, tipY);
  c.closePath();
  c.fill();
  c.fillStyle = stemC;
  c.beginPath();
  c.moveTo(x - 5, tipY - 14);
  c.lineTo(x + 5, tipY - 14);
  c.lineTo(x, tipY - 4);
  c.closePath();
  c.fill();
}

// ---------------------------------------------------------------- the far lever, the forced gate, the 8
function leverValue(tq: number, b: Beats) {
  return settle(tq, b.two - 0.06, 1, BIT, { k: 5.5, w: 13 });
}
function farMachine(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const lv = leverValue(tq, b);
  const force = sm((tq - (b.two + 0.12)) / 0.3); // the gate's panels follow the lever past their stops
  const bend = clamp01((lv - 1) * 1.3);
  // the link rod and the lever
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(F.LX, F.LY);
  c.lineTo(F.SX, M6.Y12 + GATE.FOOT / 2);
  c.stroke();
  leverGauge(c, env, { x: F.LX, y: F.LY, r: F.LR, value: lv, stand: M6.BY - F.LY, bend, beyond: BIT });
  kinkedStop(c, env, F.LX, F.LY, F.LR, Math.max(bend, sm((tq - b.two) / 0.25) * 0.9 * (lv > 1.02 ? 1 : 0)));
  const open10 = lerp(1, BIT, force), open12 = lerp(0, f32(1 - BIT), force);
  const gate = { x: F.SX, y10: M6.Y10, y12: M6.Y12, open10, open12, gap: GAP7 };
  const rows = [
    { v: 10, y: M6.Y10, end: F.END10, lab: T10, tint: 'copper' as const },
    { v: 12, y: M6.Y12, end: F.END12, lab: minus(T12), tint: 'indigo' as const },
  ];
  for (const r of rows) beltBand(c, env, F.feed, r.end, r.y, (t - b.step) * 3);
  gateBack(c, env, gate);
  for (const r of rows) {
    // the waiting tile, then the step: it passes the forced gate re-lettered (copper 20 / indigo −12)
    for (let k = 0; k < 2; k++) {
      const x = k === 0 ? stepX(t, b.step) : W0 - 200 + 200 * sm((t - b.step) / STEP);
      if (x > r.end) continue;
      c.save();
      c.beginPath();
      c.rect(F.feed, r.y - 120, F.SX - F.feed, 140);
      c.clip();
      heroTile(c, env, x, r.y, String(r.v), { s: TILE_S });
      c.restore();
      if (k === 0 && x + TILE_W / 2 > F.SX) {
        c.save();
        c.beginPath();
        c.rect(F.SX, r.y - 120, 400, 140);
        c.clip();
        slabTile(c, env, x, r.y, r.lab, 1, { s: TILE_S, tint: r.tint });
        c.restore();
      }
    }
  }
  gateFront(c, env, gate);
  // the 12 window's panel driven down through the belt (minus one), stained indigo below it
  const deep = clamp01(-open12);
  if (deep > 0) {
    const iw = GATE.W - 2 * GATE.POST;
    const y0 = M6.Y12 + GATE.FOOT;
    c.fillStyle = mixLab(mixLab(PAPER, '#3a5296', 0.55), env.mood.set, 0.2);
    c.fillRect(F.SX - iw / 2, y0, iw, GAP7 * 0.8 * deep);
    c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85);
    c.lineWidth = 1.4;
    c.strokeRect(F.SX - iw / 2, y0, iw, GAP7 * 0.8 * deep);
  }
  feeder(c, env, F.feed, M6.Y10 - 70, M6.Y12 + 22, [M6.Y10, M6.Y12]);
  // the tray: the two forced tiles are thrown in and fuse into the computed 8 just before 'eight'
  tray(c, env, F.TX, M6.TY, F.TW, 30, M6.BY);
  const parts = [
    { lab: minus(T12), tint: 'indigo' as const, end: b.end12, land: b.land12, y0: M6.Y12, x0: F.END12 + 10, slot: F.SLOT12 },
    { lab: T10, tint: 'copper' as const, end: b.end10, land: b.land10, y0: M6.Y10, x0: F.END10 + 10, slot: F.SLOT10 },
  ];
  const fuse = b.eight - 0.1;
  if (t < fuse) {
    for (const p of parts) {
      if (t < p.end) continue;
      let x: number, y: number;
      if (t < p.land) {
        x = lerp(p.x0, p.slot, (t - p.end) / (p.land - p.end));
        y = Math.min(M6.TY - 5, p.y0 + 0.5 * G * (t - p.end) ** 2);
      } else {
        const dt = tq - p.land;
        y = M6.TY - 5 - (dt < 1 / 12 ? 4 : dt < 2 / 12 ? 1 : 0);
        x = lerp(p.slot, F.TX + (p.slot < F.TX ? -TILE_W * 0.5 : TILE_W * 0.5), win(t, fuse - 0.2, fuse));
      }
      heroTile(c, env, x, y, p.lab, { s: TILE_S, tint: p.tint });
    }
  } else {
    const dt = tq - fuse;
    const y = M6.TY - 5 - (dt < 1 / 12 ? 5 : dt < 2 / 12 ? 1 : 0);
    heroTile(c, env, F.TX, y, SUM, { s: TILE_S * 1.08, glow: 0.6 * win(t, fuse - 0.05, fuse + 0.3) * (1 - 0.5 * win(t, fuse + 0.6, fuse + 1.4)) });
  }
}

/** the 1 stop, drawn large over the gauge's own peg: straight, then KINKED over by the needle forced past it */
function kinkedStop(c: C, env: PaintEnv, x: number, y: number, R: number, bend: number) {
  const a = leverAngle(1.07);
  const bx = x + Math.cos(a) * R * 1.0, by = y + Math.sin(a) * R * 1.0;
  c.save();
  c.translate(bx, by);
  c.rotate(a + Math.PI / 2);
  // the root (radial, outward = −y here)
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-4.5, -16, 9, 18);
  // the bent top: hinged at the kink, folded over in the needle's direction
  c.translate(0, -16);
  c.rotate(bend * 1.25);
  c.fillRect(-4.5, -24, 9, 25);
  c.fillStyle = copperOf(env, 0.45);
  c.beginPath();
  c.arc(0, -24, 4.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
  if (bend > 0.05) {
    // the kink's bright crease (copper, where the metal folded)
    const kx = bx + Math.cos(a) * 16, ky = by + Math.sin(a) * 16;
    c.fillStyle = copperOf(env, 0.4 + 0.5 * bend);
    c.beginPath();
    c.arc(kx, ky, 4.2, 0, Math.PI * 2);
    c.fill();
  }
}

// ---------------------------------------------------------------- the card (screen-locked, inked term by term)
function card(c: C, f: { mood: { halo: string; core: string; rim: string } }, t: number, b: Beats) {
  // review r1: the first term inks within 3 frames of the paper; the paper grows with each term (never a blank bar)
  const segs = [
    { text: `a = ${commas(A)}`, at: b.rounds - 0.25 },
    { text: `  ·  bit = ${RB.fmt(BIT)}`, at: b.two - 0.12 },
    { text: `  ·  ${T10} − ${minus(T12).replace('−', '')} = ${SUM}`, at: b.eight - 0.45 },
  ];
  const paper = cardPaperAlpha(t, segs[0].at);
  if (paper <= 0.001) return;
  const x = 56, y = 40, h = 58;
  c.save();
  c.font = `500 24px ${FONT.mono}`;
  const widths = segs.map((g) => c.measureText(g.text).width);
  let w = 36 + widths[0];
  for (let i = 1; i < segs.length; i++) w += widths[i] * win(t, segs[i].at - 0.18, segs[i].at + 0.02);
  c.globalAlpha = paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x + 3, y + 4, w, h);
  c.fillStyle = mixLab(mixLab(PAPER, f.mood.halo, 0.2), f.mood.core, 0.15);
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha(mixLab(f.mood.rim, PAPER_INK, 0.4), 0.45);
  c.lineWidth = 1;
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  c.globalAlpha = 1;
  const ink0 = cardInkAlpha(t, segs[0].at) * paper;
  cardProbe(c, `${ID}/card`, x, y, w, h, paper, ink0);
  textRole(c, 'subject', () => {
    c.textBaseline = 'alphabetic';
    let cx = x + 18;
    segs.forEach((g, i) => {
      const a = (i === 0 ? cardInkAlpha(t, g.at) : win(t, g.at, g.at + 0.2)) * paper;
      if (a > 0.001) {
        c.fillStyle = withAlpha(PAPER_INK, a);
        c.fillText(g.text, cx, y + 38);
      }
      cx += widths[i];
    });
    textProbe(c, `${ID}/card`, x + 18, y + 18, w - 36, 24, ink0);
  });
  c.restore();
}
