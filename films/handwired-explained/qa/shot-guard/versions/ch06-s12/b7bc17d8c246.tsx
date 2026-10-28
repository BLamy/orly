/**
 * ch06-s12 — THE CRANK: Kleene paid (scene, the clock room, labGreen; crossfade in; 20.00 s).
 *   L0624 "Kleene's finite machine, with everything unbounded coming from outside? Here it is."
 *   L0625 "The guide to the project's lab of experiments says: "One frame is one evaluation of a fixed-depth circuit".
 *          The host turns the crank. It never stops early."
 *
 * The whole mechanism against the clock room's round window: at the left the HOST CLOCKWORK in its case (its four arms
 * folded home, so not drawn), at the right THE LOOM (sets/matmulLoom, the real circuit: 130 frames, one thread per
 * weight), and between them, OUTSIDE the loom's frame on its own stand, THE LOOM'S CRANK (ch02-s03's crank, the same
 * part). The clockwork's own crank and the loom's crank have the same throw and are joined by one side rod, so the rod
 * stays level as both turn: ONE revolution of the loom's crank per tick of the escapement. Each turn sends one wave of
 * light across the 130 frames, and a next-state card slides back along the loom's foot into the source table (the
 * loom's first, tallest frame). The tick never stops, through the hold.
 *
 * TEACHES, word by word:
 *   crank (0.4)      the first tick; the camera pulls back slowly from the clockwork to the whole mechanism
 *   finite (1.31)    an ECHO of ch02-s03 appears in the haze above the loom: Kleene's dial with its closed ring of eight
 *                    stops; it settles over the loom and its pointer steps one stop per tick (finite and countable);
 *                    under it a small label: an echo, not a citation (it retires before the repo card, so the card
 *                    is the one text item in the hold)
 *   outside (4.14)   the camera finds the loom crank's HANDLE, outside the loom on the host's side; its grip warms
 *   repo (13.79)     a small card in the docs' plain type drops on a thread from the crank's bearing: the one quoted
 *                    fragment and its attribution; the crank keeps turning, tick after tick, to the end
 * No other text.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { defineShot, mixLab, withAlpha } from '../../../film';
import { matmulLoom, loomGeom } from '../sets/matmulLoom';
import { STOPS, crank, stopAngle } from '../sets/ch02-s03-dial';
import { brassOf, cardPaper, clamp01, clockNear, clockRoom, clockworkX, ease5, inkCol, lerp, lw, paperSlip, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s12';

// ------------------------------------------------------------------ layout (L4 rest px)
const CLK = { x: 300, y: 372, r: 150 };
/** the crank throw (the clockwork's crank pin sits 0.45 r from its hub) */
const THROW = CLK.r * 0.45;
/** the loom's crank on its own stand, outside the loom, on the host's side */
const LC = { x: 640, y: 352, s: 1.1 };
const LC_HS = THROW / (40 * LC.s);
/** the loom (its own plane, a hair behind the action plane) */
const LOOM_L: LayerSpec = { id: `${ID}-loom`, z: 1120, haze: 0.07, blur: 0.4 };
const LOOM = { x: 730, y: 232, w: 500, h: 268 };
const LG = loomGeom(LOOM);
/** the loom's foot rail, where the next-state cards ride home */
const FOOT_Y = LOOM.y + LOOM.h + 26;
/** the echo of Kleene's dial (in the haze, its own plane) */
const ECHO_L: LayerSpec = { id: `${ID}-echo`, z: 1250, haze: 0.2, blur: 1.5 };
/** review r1: the echo drifts down out of the haze and settles, grown, centred over the loom */
const ECHO_FROM = { x: 1000, y: 60, r: 56 };
const ECHO_TO = { x: LOOM.x + LOOM.w / 2, y: LOOM.y + LOOM.h / 2, r: 120 };

/** one evaluation per tick: the escapement ticks, the crank turns once, a wave crosses the loom, a card rides home */
const PERIOD = 2.5;
const TURN = 1.25;

interface Beats {
  D: number;
  crank: number;
  finite: number;
  outside: number;
  repo: number;
  /** 'host' (L0625): the camera eases back to the whole machine for the hold */
  host: number;
}

/** whole ticks so far (each tick k starts at crank + k * PERIOD) */
const tickIndex = (t: number, b: Beats) => Math.floor((t - b.crank) / PERIOD);
/** crank revolutions so far: an eased whole turn inside each tick, then a rest */
function revs(t: number, b: Beats) {
  if (t < b.crank) return 0;
  const k = tickIndex(t, b);
  const u = (t - b.crank - k * PERIOD) / TURN;
  return k + ease5(clamp01(u));
}
/** escapement count: a quick rock at each tick's start */
function escAt(t: number, b: Beats) {
  if (t < b.crank) return 0;
  const k = tickIndex(t, b);
  return k + clamp01((t - b.crank - k * PERIOD) / 0.28);
}

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, crank: T.beat('crank'), finite: T.beat('kleene'), outside: T.beat('outside'), repo: T.beat('repo'), host: T.word('L0625', 'host') };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(cam(t, b));
    clockRoom(f, { key: ID, oculus: { x: 500, y: 300, r: 320 }, lightGap: 170, sunX: 520, sunY: 310, intensity: 0.95 });
    // review r1: a soft dark plate pulls the round window down (~30 %) behind the host wheel, so one wheel reads
    f.layer('L3', (c, env) => wheelPlate(f, c, env));
    const rev = revs(t, b);
    const ang = rev * Math.PI * 2;
    // the echo of Kleene's dial, in the haze above the loom
    f.layer(ECHO_L, (c, env) => echo(c, env, t, b));
    // the loom, its wave, and the next-state card riding home
    f.layer(LOOM_L, (c, env) => {
      const k = tickIndex(t, b);
      const tk = b.crank + k * PERIOD;
      const wu = k >= 0 ? (t - tk - 0.55) / 1.2 : -1;
      const wave = wu >= 0 && wu <= 1.15 ? clamp01(wu) : undefined;
      matmulLoom(f, c, env, { ...LOOM, key: ID, wave, threads: 0.85 });
      if (wave !== undefined) waveGlow(c, env, wave, 1 - seg(wu, 0.95, 1.15));
      loomBounds(c, env, t, b);
      footRail(c, env, t, tq, b);
    });
    // a tube on the back wall (behind the action plane)
    f.practical({ x: 980, y: 96, kind: 'tube', seed: 81, intensity: 0.4, radius: 200, layer: 'L3' });
    f.layer('L4', (c, env) => {
      clockworkX(c, env, { ...CLK, esc: escAt(t, b), crank: rev, lit: 0.55 });
      crank(c, env, { x: LC.x, y: LC.y, angle: ang, s: LC.s, hs: LC_HS, glow: handleGlow(t, b) });
      sideRod(c, env, ang);
      handleGrip(c, env, ang, handleGlow(t, b));
      repoCard(c, env, t, tq, b);
    });
    f.rim({ x: 0, y: -1 });
    clockNear(f, { key: ID, lip: 690 });
  },
});

// ------------------------------------------------------------------ the dark plate behind the host wheel (L3)
function wheelPlate(f: Frame, c: C2, env: PaintEnv) {
  const R = CLK.r * 1.55, pad = 60;
  f.cached(`${ID}/wplate/${env.mood.id}`, 2 * (R + pad), 2 * (R + pad), (cc) => {
    const cx = R + pad;
    const g = cc.createRadialGradient(cx, cx, R * 0.2, cx, cx, R);
    const col = mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.55);
    g.addColorStop(0, withAlpha(col, 0.5));
    g.addColorStop(0.7, withAlpha(col, 0.4));
    g.addColorStop(1, withAlpha(col, 0));
    cc.fillStyle = g;
    cc.fillRect(0, 0, 2 * cx, 2 * cx);
  })(c, CLK.x - R - pad, CLK.y - R - pad);
}

// ------------------------------------------------------------------ the loom's bounds: a bracketed frame round it
/**
 * Review r1: a thin bracketed rail marks where the loom ends. On 'outside' its LEFT edge (the host's side) lights for
 * about a second while the handle's grip warms: everything unbounded comes from beyond this line.
 */
function loomBounds(c: C2, env: PaintEnv, t: number, b: Beats) {
  const x0 = LOOM.x - 14, y0 = LOOM.y - 16, x1 = LOOM.x + LOOM.w + 14, y1 = LOOM.y + LOOM.h + 16;
  const arm = 26;
  const base = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), 0.5);
  c.save();
  c.lineCap = 'square';
  c.strokeStyle = base;
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  // four corner brackets and thin rails between them
  for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
    c.moveTo(cx + sx * arm, cy);
    c.lineTo(cx, cy);
    c.lineTo(cx, cy + sy * arm);
  }
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), 0.22);
  c.lineWidth = lw(c, 1);
  c.strokeRect(x0, y0, x1 - x0, y1 - y0);
  // 'outside': the left edge lights
  const k = seg(t, b.outside - 0.1, b.outside + 0.25) * (1 - seg(t, b.outside + 1.0, b.outside + 1.6));
  if (k > 0.01) {
    const warm = brassOf(env, 1);
    c.strokeStyle = withAlpha(warm, 0.95 * k);
    c.lineWidth = lw(c, 2.6);
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x0, y1);
    c.stroke();
    c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(x0 - 26, 0, x0 + 26, 0);
    g.addColorStop(0, withAlpha(warm, 0));
    g.addColorStop(0.5, withAlpha(warm, 0.3 * k));
    g.addColorStop(1, withAlpha(warm, 0));
    c.fillStyle = g;
    c.fillRect(x0 - 26, y0, 52, y1 - y0);
  }
  c.restore();
}

// ------------------------------------------------------------------ camera
/** pull back to the whole mechanism; on 'outside' find the crank's handle; then a slow creep through the hold */
function cam(t: number, b: Beats): Camera3 {
  // review r1: pull back to the whole mechanism; on 'outside' push only part way, so the wheel, the crank stand and the
  // loom's left edge share the frame; on 'host' ease back over ~4 s to the whole machine for the hold
  const a: Camera3 = { x: 440, y: 360, z: 150, lens: 1 };
  const whole: Camera3 = { x: 720, y: 340, z: -60, lens: 1 };
  const handle: Camera3 = { x: 560, y: 352, z: 90, lens: 1 };
  const end: Camera3 = { x: 700, y: 345, z: -40, lens: 1 };
  const mix = (p: Camera3, q: Camera3, u: number): Camera3 => ({ x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u), z: lerp(p.z, q.z, u), lens: 1 });
  const u1 = ease5(clamp01((t - 0.0) / 3.9));
  const u2 = ease5(clamp01((t - (b.outside - 0.15)) / 3.6));
  const u3 = ease5(clamp01((t - (b.host - 0.2)) / 4.0));
  let p = mix(a, whole, u1);
  p = mix(p, handle, u2);
  return mix(p, end, u3);
}

// ------------------------------------------------------------------ the side rod (crank pin to crank pin, level)
function sideRod(c: C2, env: PaintEnv, ang: number) {
  const p0 = { x: CLK.x + Math.cos(ang) * THROW, y: CLK.y + Math.sin(ang) * THROW };
  const p1 = { x: LC.x + Math.cos(ang) * THROW, y: LC.y + Math.sin(ang) * THROW };
  c.save();
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineCap = 'round';
  c.lineWidth = 9;
  c.beginPath();
  c.moveTo(p0.x, p0.y);
  c.lineTo(p1.x, p1.y);
  c.stroke();
  // a brass top edge (the window side) and its two bosses
  c.strokeStyle = withAlpha(brassOf(env, 0.4), 0.75);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(p0.x + 6, p0.y - 4);
  c.lineTo(p1.x - 6, p1.y - 4);
  c.stroke();
  c.fillStyle = PUPPET_NEAR_BLACK;
  for (const p of [p0, p1]) {
    c.beginPath();
    c.arc(p.x, p.y, 10, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** 'outside': the handle's grip warms (the one accent); a soft tick-glow keeps it alive after */
function handleGlow(t: number, b: Beats) {
  return seg(t, b.outside - 0.1, b.outside + 0.5) * (1 - 0.45 * seg(t, b.outside + 1.6, b.outside + 3.2));
}
function handleGrip(c: C2, env: PaintEnv, ang: number, g: number) {
  if (g <= 0.01) return;
  const hx = LC.x + Math.cos(ang) * THROW, hy = LC.y + Math.sin(ang) * THROW;
  c.save();
  // review r1: a clear warm grip (11 px) with a halo, not a small ring
  c.globalCompositeOperation = 'lighter';
  const rg = c.createRadialGradient(hx, hy, 0, hx, hy, 64);
  rg.addColorStop(0, withAlpha(brassOf(env, 1), 0.55 * g));
  rg.addColorStop(0.35, withAlpha(brassOf(env, 1), 0.22 * g));
  rg.addColorStop(1, withAlpha(brassOf(env, 1), 0));
  c.fillStyle = rg;
  c.fillRect(hx - 64, hy - 64, 128, 128);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = withAlpha(mixLab(brassOf(env, 1), '#fff1cc', 0.25), 0.95 * g);
  c.beginPath();
  c.ellipse(hx, hy, 8, 11, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ------------------------------------------------------------------ the loom's wave, and the card riding home
function waveGlow(c: C2, env: PaintEnv, wave: number, a: number) {
  // review r1: one clear warm sweep across the loom per crank revolution (the gold is the frame's one accent)
  const x = lerp(LOOM.x, LOOM.x + LOOM.w, wave);
  const warm = brassOf(env, 1);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(x - 110, 0, x + 12, 0);
  g.addColorStop(0, withAlpha(warm, 0));
  g.addColorStop(0.75, withAlpha(warm, 0.2 * a));
  g.addColorStop(0.95, withAlpha(warm, 0.42 * a));
  g.addColorStop(1, withAlpha(warm, 0));
  c.fillStyle = g;
  c.fillRect(x - 110, LOOM.y - 10, 122, LOOM.h + 20);
  c.strokeStyle = withAlpha(mixLab(warm, '#fff1cc', 0.3), 0.7 * a);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.moveTo(x + 4, LOOM.y - 6);
  c.lineTo(x + 4, LOOM.y + LOOM.h + 6);
  c.stroke();
  c.restore();
}
/** the source table's open tray at the loom's foot, on the host's side: where the next-state cards go home */
const TRAY = { x: LOOM.x - 4, y: FOOT_Y + 2, w: 56, h: 34 };
function footRail(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const ink = env.fill('ink');
  // the rail itself, and the source table's tray at its near end (three pigeonholes, faintly lit from inside)
  c.save();
  c.fillStyle = ink;
  c.fillRect(LOOM.x - 4, FOOT_Y + 10, LOOM.w + 8, 5);
  c.fillRect(TRAY.x - TRAY.w / 2, TRAY.y - TRAY.h / 2, TRAY.w, TRAY.h);
  const k = tickIndex(t, b);
  const tk = b.crank + Math.max(0, k) * PERIOD;
  const home = k >= 0 ? seg(tq, tk + 2.3, tk + 2.4) * (1 - seg(tq, tk + 2.45, tk + 2.9)) : 0;
  for (let h = 0; h < 3; h++) {
    const hx = TRAY.x - TRAY.w / 2 + 6 + h * 16;
    c.fillStyle = withAlpha(mixLab(env.mood.halo, brassOf(env, 0.6), 0.4 + 0.6 * home), 0.22 + 0.5 * home);
    c.fillRect(hx, TRAY.y - TRAY.h / 2 + 7, 12, TRAY.h - 14);
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.5);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.moveTo(TRAY.x - TRAY.w / 2, TRAY.y - TRAY.h / 2 + 0.5);
  c.lineTo(TRAY.x + TRAY.w / 2, TRAY.y - TRAY.h / 2 + 0.5);
  c.stroke();
  c.restore();
  if (k < 0) return;
  // the next-state card: out of the loom's far end as the wave arrives, along the foot rail and home into the tray
  const u = (tq - tk - 1.45) / 0.9;
  if (u < 0 || u > 1.1) return;
  const x0 = LOOM.x + LOOM.w - 20, x1 = TRAY.x;
  const x = lerp(x0, x1, ease5(clamp01(u)));
  const into = seg(u, 0.92, 1.1);
  const y = FOOT_Y - 8 + into * 14;
  const a = seg(u, 0, 0.08) * (1 - into);
  c.save();
  c.globalAlpha = a;
  c.fillStyle = withAlpha(shadowCol, 0.4);
  c.fillRect(x - 22 + 2, y - 15 + 3, 44, 30);
  c.fillStyle = cardPaper(env);
  c.fillRect(x - 22, y - 15, 44, 30);
  c.fillStyle = withAlpha(inkCol(env), 0.55);
  c.fillRect(x - 15, y - 7, 26, 3);
  c.fillRect(x - 15, y + 1, 17, 3);
  c.restore();
}

// ------------------------------------------------------------------ the echo of Kleene's finite dial
/**
 * Review r1: an echo, not an object: only the dial's ring and its eight stops, faint (alpha ~0.45) and blurred in the
 * haze, no housing; it drifts down out of the haze and settles, grown, centred over the loom, by ~3 s; its pointer
 * steps one stop per tick (finite and countable).
 */
function echo(c: C2, env: PaintEnv, t: number, b: Beats) {
  const inA = seg(t, b.finite - 0.15, b.finite + 0.9);
  if (inA <= 0.005) return;
  const settle = ease5(clamp01((t - b.finite) / 1.8));
  const x = lerp(ECHO_FROM.x, ECHO_TO.x, settle), y = lerp(ECHO_FROM.y, ECHO_TO.y, settle), r = lerp(ECHO_FROM.r, ECHO_TO.r, settle);
  const k = Math.max(0, tickIndex(t, b));
  const step = t < b.crank ? 0 : clamp01((t - b.crank - k * PERIOD - 0.05) / 0.3);
  const pointer = k + ease5(step);
  const col = mixLab(brassOf(env, 0.6), env.mood.core, 0.35);
  const R = r * 0.78;
  c.save();
  c.globalAlpha = 0.45 * inA;
  c.strokeStyle = col;
  c.lineWidth = Math.max(lw(c, 2), r * 0.03);
  c.beginPath();
  c.arc(x, y, r * 1.02, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.arc(x, y, R, 0, Math.PI * 2);
  c.stroke();
  for (let i = 0; i < STOPS; i++) {
    const a = stopAngle(i);
    const sx = x + Math.cos(a) * R, sy = y + Math.sin(a) * R;
    const on = Math.max(0, 1 - Math.abs(((pointer % STOPS) + STOPS) % STOPS - i));
    c.fillStyle = mixLab(col, '#fff2c8', 0.6 * on);
    c.beginPath();
    c.arc(sx, sy, r * 0.075 * (1 + 0.3 * on), 0, Math.PI * 2);
    c.fill();
  }
  // the pointer, a thin hand from the arbor to the ring
  const pa = stopAngle(pointer);
  c.lineWidth = Math.max(lw(c, 2), r * 0.025);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + Math.cos(pa) * R * 0.88, y + Math.sin(pa) * R * 0.88);
  c.stroke();
  c.beginPath();
  c.arc(x, y, r * 0.05, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // the label under the ring, below the loom's foot (paper, so it reads); it retires before the repo card
  paperSlip(c, env, { lines: ['an echo, not a citation'], x: ECHO_TO.x, y: LOOM.y + LOOM.h + 40, t, inkAt: b.finite + 0.45, font: 'italic', size: 22, id: `${ID}-echo-label`, pin: false, tint: 'plate', out: 0.92 * (1 - seg(t, b.repo - 1.6, b.repo - 0.9)) });
}

// ------------------------------------------------------------------ the repo card, hung from the crank
/**
 * Review r1: the card hangs on a short string from the crank's bearing, just under the handle's sweep, so the crank
 * and the card read as one object; each tick gives it a slow ±2° sway. It fades from D - 1.0 so the X-ray opens clean.
 */
function repoCard(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const inkAt = b.repo + 0.15;
  if (t < inkAt - 0.6) return;
  const d = clamp01((tq - (inkAt - 0.45)) / 0.4);
  const drop = ease5(d);
  // the sway: each tick's turn nudges it, a slow damped swing of about ±2°
  const k = tickIndex(tq, b);
  const tk = b.crank + k * PERIOD;
  const since = tq - tk;
  const swing = (2 * Math.PI / 180) * Math.exp(-since * 0.9) * Math.sin(since * 2.6);
  const pivot = { x: LC.x, y: LC.y + 10 };
  const topY = lerp(LC.y + 40, LC.y + THROW + 22, drop);
  c.save();
  c.translate(pivot.x, pivot.y);
  c.rotate(-swing);
  c.translate(-pivot.x, -pivot.y);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), 0.8);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.moveTo(pivot.x, pivot.y);
  c.lineTo(pivot.x, topY + 4);
  c.stroke();
  paperSlip(c, env, { lines: ['“a fixed-depth circuit”', '— the lab guide'], x: LC.x, y: topY, t, inkAt, font: 'mono', size: 21, id: `${ID}-repo`, pin: true, tint: 'card', out: 1 - seg(t, b.D - 1.0, b.D - 0.45) });
  c.restore();
}
