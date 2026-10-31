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
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { defineShot, mixLab, withAlpha } from '../../../film';
import { matmulLoom, loomGeom } from '../sets/matmulLoom';
import { crank, finiteDial } from '../sets/ch02-s03-dial';
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
const ECHO_L: LayerSpec = { id: `${ID}-echo`, z: 1250, haze: 0.2, blur: 1.2 };
const ECHO_FROM = { x: 1000, y: 36, r: 50 };
const ECHO_TO = { x: 984, y: 132, r: 60 };

/** one evaluation per tick: the escapement ticks, the crank turns once, a wave crosses the loom, a card rides home */
const PERIOD = 2.5;
const TURN = 1.25;

interface Beats {
  D: number;
  crank: number;
  finite: number;
  outside: number;
  repo: number;
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
    const b: Beats = { D: T.duration, crank: T.beat('crank'), finite: T.beat('kleene'), outside: T.beat('outside'), repo: T.beat('repo') };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(cam(t, b));
    clockRoom(f, { key: ID, oculus: { x: 500, y: 300, r: 320 }, lightGap: 170, sunX: 520, sunY: 310, intensity: 0.95 });
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

// ------------------------------------------------------------------ camera
/** pull back to the whole mechanism; on 'outside' find the crank's handle; then a slow creep through the hold */
function cam(t: number, b: Beats): Camera3 {
  const a: Camera3 = { x: 440, y: 360, z: 150, lens: 1 };
  const whole: Camera3 = { x: 720, y: 340, z: -60, lens: 1 };
  const handle: Camera3 = { x: 680, y: 345, z: 200, lens: 1 };
  const end: Camera3 = { x: 690, y: 350, z: 225, lens: 1 };
  const mix = (p: Camera3, q: Camera3, u: number): Camera3 => ({ x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u), z: lerp(p.z, q.z, u), lens: 1 });
  const u1 = ease5(clamp01((t - 0.0) / 3.9));
  const u2 = ease5(clamp01((t - (b.outside - 0.15)) / 3.6));
  const u3 = clamp01((t - (b.outside + 3.6)) / (b.D - b.outside - 3.6));
  let p = mix(a, whole, u1);
  p = mix(p, handle, u2);
  return mix(p, end, u3 * u3 * (3 - 2 * u3));
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
  c.fillStyle = withAlpha(brassOf(env, 0.9), 0.85 * g);
  c.beginPath();
  c.ellipse(hx, hy, 6 * LC.s * LC_HS * 0.55, 9 * LC.s * LC_HS * 0.55, 0, 0, Math.PI * 2);
  c.fill();
  c.globalCompositeOperation = 'lighter';
  const rg = c.createRadialGradient(hx, hy, 0, hx, hy, 46);
  rg.addColorStop(0, withAlpha(brassOf(env, 1), 0.4 * g));
  rg.addColorStop(1, withAlpha(brassOf(env, 1), 0));
  c.fillStyle = rg;
  c.fillRect(hx - 46, hy - 46, 92, 92);
  c.restore();
}

// ------------------------------------------------------------------ the loom's wave, and the card riding home
function waveGlow(c: C2, env: PaintEnv, wave: number, a: number) {
  const x = lerp(LOOM.x, LOOM.x + LOOM.w, wave);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(x - 70, 0, x + 20, 0);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.8, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.11 * a));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - 70, LOOM.y - 10, 90, LOOM.h + 20);
  c.restore();
}
function footRail(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  // the rail itself
  c.save();
  c.fillStyle = env.fill('ink');
  c.fillRect(LOOM.x - 4, FOOT_Y + 10, LOOM.w + 8, 5);
  c.restore();
  const k = tickIndex(t, b);
  if (k < 0) return;
  const tk = b.crank + k * PERIOD;
  // the next-state card: out of the loom's far end as the wave arrives, home into the source table before the next tick
  const u = (tq - tk - 1.55) / 0.85;
  if (u < 0 || u > 1.12) return;
  const x0 = LOOM.x + LOOM.w - 14, x1 = LG.frameX(-1);
  const x = lerp(x0, x1, ease5(clamp01(u)));
  const rise = seg(u, 0.9, 1.12);
  const y = FOOT_Y - 4 - rise * 26;
  const a = 1 - rise;
  c.save();
  c.globalAlpha = a;
  c.fillStyle = withAlpha(shadowCol, 0.4);
  c.fillRect(x - 18 + 2, y - 13 + 3, 36, 26);
  c.fillStyle = cardPaper(env);
  c.fillRect(x - 18, y - 13, 36, 26);
  c.fillStyle = withAlpha(inkCol(env), 0.55);
  c.fillRect(x - 12, y - 6, 20, 3);
  c.fillRect(x - 12, y + 1, 13, 3);
  c.restore();
}

// ------------------------------------------------------------------ the echo of Kleene's finite dial
function echo(c: C2, env: PaintEnv, t: number, b: Beats) {
  const inA = seg(t, b.finite - 0.15, b.finite + 0.9);
  if (inA <= 0.005) return;
  const settle = ease5(clamp01((t - b.finite) / 2.6));
  const x = lerp(ECHO_FROM.x, ECHO_TO.x, settle), y = lerp(ECHO_FROM.y, ECHO_TO.y, settle), r = lerp(ECHO_FROM.r, ECHO_TO.r, settle);
  // one stop per tick: the same evaluations the crank counts, on a closed ring of eight
  const k = Math.max(0, tickIndex(t, b));
  const step = t < b.crank ? 0 : clamp01((t - b.crank - k * PERIOD - 0.05) / 0.3);
  const pointer = k + ease5(step);
  c.save();
  c.globalAlpha = 0.78 * inA;
  finiteDial(c, env, { x, y, r, lit: 0.55, pointer });
  c.restore();
  // the label under it (paper, so it reads over the threads)
  paperSlip(c, env, { lines: ['an echo, not a citation'], x, y: y + r * 1.42 + 6, t, inkAt: b.finite + 0.45, font: 'italic', size: 22, id: `${ID}-echo-label`, pin: false, tint: 'plate', out: 0.92 * (1 - seg(t, b.repo - 1.6, b.repo - 0.9)) });
}

// ------------------------------------------------------------------ the repo card on the crank's bearing
function repoCard(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const inkAt = b.repo + 0.15;
  if (t < inkAt - 0.6) return;
  // it drops on its thread from the bearing (on twos) and swings to rest
  const d = clamp01((tq - (inkAt - 0.45)) / 0.4);
  const drop = ease5(d);
  const swing = d >= 1 ? 0.035 * Math.exp(-(tq - inkAt + 0.05) * 1.6) * Math.sin((tq - inkAt) * 5.2) : 0;
  const topY = lerp(LC.y + 40, LC.y + 104, drop);
  c.save();
  // the thread from the bearing, behind the stand's front
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), 0.75);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.moveTo(LC.x, LC.y + 12);
  c.lineTo(LC.x + Math.sin(swing) * (topY - LC.y), topY);
  c.stroke();
  c.translate(LC.x, LC.y + 12);
  c.rotate(-swing);
  c.translate(-LC.x, -(LC.y + 12));
  paperSlip(c, env, { lines: ['“a fixed-depth circuit”', '— the lab guide'], x: LC.x, y: topY, t, inkAt, font: 'mono', size: 21, id: `${ID}-repo`, pin: true, tint: 'card' });
  c.restore();
}
