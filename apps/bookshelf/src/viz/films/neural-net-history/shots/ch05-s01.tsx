/**
 * ch05-s01 — Versailles, summer 1981: the Hall of Mirrors. Hopfield's ring of eight lanterns rolls a
 * half-memory downhill until the whole pattern returns, while the mirrored crowd looks away.
 *
 *   0.1        the chapter's manila index tab drops at top-left, holds 2.5 s, slides up
 *   1.0        the hall resolves out of the haze (no stamp yet)
 *   'Hopfield' the camera finds the man at the easel (push in); VERSAILLES · SUMMER 1981 types on
 *   'presents' name card John Hopfield · physicist, Caltech
 *   'network'  the chalked ring of eight lanterns: a glow passes once round the loop
 *   'half'     only four of the eight are lit; a chalk ball waits on the rim of a chalked hollow
 *   'downhill' the ball rolls down in four steps; at each step one missing lantern lights
 *   'whole'    all eight hold the stored pattern (a memory recalled, not learned)
 *   +0.3 s     wordless: a truck left along the hall; every reflected head is a profile, turned away
 *   +1.6 s     the reflections fade mirror by mirror, the far ones first, until only his remains
 *   +3.0 s     the chalked ring in that last mirror glows once, warmly, and holds
 *
 * The binding: the ball's height in the hollow is the network's energy; each lantern that completes the
 * pattern takes it one step down. The mirrors carry the idea that nobody listened: a reflected listener
 * would face us (frontal); every one of them is in profile.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv, Pose, ShotScene } from '../../../film';
import { LAYERS, PUPPET_NEAR_BLACK, PoseTrack, addPose, createPuppet, defineShot, glow, mixLab, paperLantern, pose, softPlate, toScreen, withAlpha, withLife } from '../../../film';
import { SPECS } from '../cast';
import { HALL5, hall5, warped } from '../sets/ch05-s01-hall';
import { indexTab } from '../sets/indexTab';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { chalk, clamp01, lerp, monotone, phosphorStamp, sm, tq12, win } from '../sets/ch05-s01-kit';

const ID = 'ch05-s01';
/** Hopfield as cast, with his suit's cut-lines first in the budget (lapel, cuffs, pocket flap) so the darkest
 *  figure in the hall still reads as cut paper, not a hole */
const hop = createPuppet({ ...SPECS.hopfield, id: 'hopfield-s01', details: ['lapel', 'cuff', 'shirtCuff', 'pocketFlap', 'breastPocket'] });
/** the window side: the low sun pours in from the upper left, behind the camera */
const WIN_DIR = { x: -0.5, y: -1 };

// ------------------------------------------------------------------ staging (L4 world)
const FLOOR = 652;
const HOP_X = 710;
/** the easel and its slate */
const EASEL = { x: 512, board: { x: 392, y: 288, w: 244, h: 184 } };
const RING = { x: 500, y: 346, r: 47, lr: 9.5 };
/** the chalked hollow under the ring: from the left rim down to the floor of the bowl */
const BOWL = { x0: 424, x1: 584, y0: 412, depth: 44 };
const bowlY = (x: number) => BOWL.y0 + BOWL.depth * Math.sin(Math.PI * clamp01((x - BOWL.x0) / (BOWL.x1 - BOWL.x0)));
/** the mirror in which only his reflection remains */
const LAST = 4;
/** the stored pattern is the whole ring; the half-memory starts with these four lit */
const HALF = [0, 2, 3, 5];
const MISSING = [1, 4, 6, 7];
const LIGHT_DIR = { x: 0.2, y: -1 };

// ------------------------------------------------------------------ Hopfield's performance (facing left)
const STAND: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 8, head: -4, shoulderF: 6, elbowF: 18, wristF: 6, shoulderB: -9, elbowB: 14 });
/** chalk raised to the slate (the ring's right side) */
const WRITE: Pose = pose({ hipF: 6, kneeF: -4, hipB: -5, kneeB: -1, torso: 4, neck: 2, head: 2, shoulderF: 104, elbowF: 34, wristF: 10, shoulderB: -6, elbowB: 22 }, { handF: 'grip' });
/** chalk lower (the bowl) */
const WRITE_LO: Pose = pose({ hipF: 6, kneeF: -5, hipB: -5, kneeB: -1, torso: 7, neck: 4, head: 6, shoulderF: 76, elbowF: 30, wristF: 8, shoulderB: -6, elbowB: 22 }, { handF: 'grip' });
/** steps back a touch and presents the ring with an open hand */
const PRESENT: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 6, head: -5, shoulderF: 58, elbowF: 40, wristF: -24, shoulderB: -8, elbowB: 16 }, { handF: 'open' });
/** points at the ball on the rim */
const POINT: Pose = pose({ hipF: 8, kneeF: -4, hipB: -4, kneeB: -1, torso: 3, neck: 4, head: 0, shoulderF: 72, elbowF: 6, wristF: 0, shoulderB: -10, elbowB: 16 }, { handF: 'point' });
/** follows it down */
const POINT_LO: Pose = pose({ hipF: 8, kneeF: -4, hipB: -4, kneeB: -1, torso: 5, neck: 6, head: 6, shoulderF: 56, elbowF: 6, wristF: 4, shoulderB: -10, elbowB: 16 }, { handF: 'point' });
/** the memory complete: hand lowered, a small open-palmed stillness, head up to the ring */
const DONE: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -3, neck: 6, head: -8, shoulderF: 22, elbowF: 46, wristF: -20, shoulderB: -12, elbowB: 18 }, { handF: 'open' });
const AFTER: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -3, neck: 8, head: -4, shoulderF: -14, elbowF: 30, wristF: 4, shoulderB: -18, elbowB: 26 }, { handF: 'fist', handB: 'fist' });

interface Beats {
  hopfield: number;
  card: number;
  ring: number;
  half: number;
  roll: number;
  whole: number;
  turned: number;
  fade: number;
  glow: number;
  /** when each missing lantern lights (and the ball takes a step) */
  steps: number[];
}
interface Scene extends ShotScene {
  b: Beats;
  D: number;
  hop: PoseTrack;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const roll = T.beat('roll');
    const whole = T.beat('whole');
    const span = whole - 0.12 - (roll + 0.2);
    const b: Beats = {
      hopfield: T.beat('hopfield'),
      card: T.beat('card'),
      ring: T.beat('ring'),
      half: T.beat('half'),
      roll,
      whole,
      turned: T.beat('turned'),
      fade: T.beat('fade'),
      glow: T.beat('glow'),
      steps: [0, 1, 2, 3].map((i) => roll + 0.2 + (span * (i + 0.6)) / 4),
    };
    // Hopfield: chalking at the slate as we arrive, presenting on 'network', pointing at the ball, following it down
    const h = new PoseTrack(tl, 'hopfield.pose', WRITE, 'left', 0.5);
    h.loop('write', { at: 1.2, dur: Math.max(0.5, b.hopfield + 0.3 - 1.2) });
    h.to(WRITE_LO, { at: b.hopfield + 0.4, dur: 0.5 });
    h.loop('write', { at: b.hopfield + 0.95, dur: Math.max(0.4, b.ring - 0.25 - (b.hopfield + 0.95)) });
    h.to(PRESENT, { at: b.ring - 0.15, dur: 0.5, force: true });
    h.to(POINT, { at: b.half + 0.05, dur: 0.45, force: true });
    h.to(POINT_LO, { at: roll + 0.6, dur: span * 0.9, force: true });
    h.to(DONE, { at: whole - 0.1, dur: 0.5, force: true });
    h.to(AFTER, { at: b.turned + 0.9, dur: 0.9 });
    // camera: wide in the haze → finds him on 'Hopfield' → creeps in through the idea → trucks left, pulling back
    // after the line: a truck left with a ~8% push toward the mirrors left of the easel (the turned heads
    // fill the frame), then an easing pull that settles on the last mirror near the frame's centre
    // on 'turned' the camera pushes in (dolly + a slight lens) until mirrors 3 and 4 (left of the easel) fill
    // about 40% of the frame, the dark easel slab framing them on the right: every reflected head is a profile
    // turned AWAY from the easel. It drifts as the reflections fade, then eases ~10% further toward the last
    // mirror for the ring's glow.
    const K: [number, number, number, number, number][] = [
      [0, 700, 334, -70, 1],
      [b.hopfield - 0.6, 662, 344, 20, 1],
      [b.ring + 0.9, 600, 366, 236, 1],
      [whole + 0.45, 590, 370, 282, 1],
      [b.turned - 0.25, 584, 371, 292, 1],
      [b.turned + 3.5, 336, 381, 420, 1.12],
      [b.glow - 0.7, 330, 386, 432, 1.125],
      [D, 336, 404, 470, 1.17],
    ];
    const fx = monotone(K.map((k) => [k[0], k[1]])), fy = monotone(K.map((k) => [k[0], k[2]]));
    const fz = monotone(K.map((k) => [k[0], k[3]])), fl = monotone(K.map((k) => [k[0], k[4]]));
    const cam = (t: number): Camera3 => ({ x: fx(t), y: fy(t), z: fz(t), lens: fl(t) });
    tl.hold(0, D);
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 16; i++) CAMS.push(cam((D * i) / 16));
    return { tl, b, D, hop: h, cam, CAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = tq12(t);
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);

    // lantern states (0..1 lit) — on twos: paper lanterns catch, they do not fade
    const endDim = 1 - 0.55 * win(t, b.glow - 0.5, b.glow + 0.6);
    const lit = (i: number) => {
      let v = 0;
      // the glow passing once round the loop on 'network'
      const ph = (tq - b.ring) / 1.1;
      if (ph > 0 && ph < 1.25) v = Math.max(v, Math.exp(-(((ph * 8 - i) / 1.1) ** 2)) * 0.85);
      // the half-memory is already lit as 'half' lands (lead 0.15 s, a 0.2 s catch)
      if (HALF.includes(i)) v = Math.max(v, clamp01((t - (b.half - 0.15)) / 0.2));
      const k = MISSING.indexOf(i);
      if (k >= 0 && tq >= b.steps[k]) v = 1;
      return v * endDim;
    };
    // the ball: height in the bowl = energy; one step down per lantern recovered
    const ballU = (() => {
      if (t < b.roll) return 0;
      let u = 0;
      for (let k = 0; k < 4; k++) {
        const s0 = b.steps[k] - 0.42;
        u = Math.max(u, (k + sm((t - s0) / 0.42)) / 4);
      }
      // a small settling rock at the bottom of the bowl
      const settle = t > b.steps[3] ? 0.035 * Math.exp(-(t - b.steps[3]) * 2.2) * Math.sin((t - b.steps[3]) * 11) : 0;
      return clamp01(u) + settle;
    })();
    // reflections fading, far mirrors first; the last one (his) keeps him and the ring
    const crowd = (i: number) => {
      const d = Math.abs(i - LAST);
      const at = b.fade + ((7 - Math.min(7, d)) / 7) * 1.05;
      return 1 - win(t, at, at + 0.45);
    };
    // the last mirror's ring: a clear swell on 'glow' (0.5 → 1 → 0.7 over 1.2 s), then it holds, warm
    const ringGlow = t < b.glow - 0.6 ? 0 : t < b.glow ? 0.5 * win(t, b.glow - 0.6, b.glow) : t < b.glow + 0.45 ? lerp(0.5, 1, sm((t - b.glow) / 0.45)) : lerp(1, 0.7, sm((t - b.glow - 0.45) / 0.75));

    hall5(f, {
      key: ID,
      cams: sc.CAMS,
      crowd,
      rimDir: LIGHT_DIR,
      rays: 0.5,
      fogA: 0.09,
      darkWall: true,
      awayFromX: EASEL.x,
      // one chandelier hung low enough to frame the upper left through the easel section (a dark L5 plane)
      chandeliers: [[250, 1.3, -100], [1180, 1.15, -175]],
      inMirror: (c, env, i) => {
        if (i === LAST) reflection(c, env, sc, t, tq, ringGlow, lit);
      },
      action: (c, env) => {
        easel(c, env, t, tq, b, lit, ballU);
        const smp = sc.hop.sample(t);
        const p = withLife(smp.pose, tq, 1981, 0.8);
        hop.draw(c, { x: HOP_X, y: FLOOR, facing: smp.facing, pose: p, ink: PUPPET_NEAR_BLACK, light: { x: WIN_DIR.x, y: WIN_DIR.y, floor: 0.3 }, edgeRim: { x: WIN_DIR.x, y: WIN_DIR.y, px: 1.7, alpha: 0.72 } }, env);
      },
      actionTop: (c, env) => easelGlow(c, env, lit, ballU, t),
    });

    // the hall resolving out of the haze (from 1.0 s): a warm veil burning off
    const veil = 1 - win(t, 0.9, 2.9);
    if (veil > 0.003) {
      const c = f.c;
      c.save();
      // fog clearing: the haze colour, a step darker, thin (<= 0.58): the hall reads through it from the start
      c.fillStyle = withAlpha(mixLab(f.mood.haze, f.mood.set, 0.3), 0.58 * veil);
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }

    // the end: the hall settles darker around the last mirror so its small warm ring is the final image
    const endV = win(t, b.glow - 0.4, b.glow + 1.0);
    if (endV > 0.003) {
      const { rx, ry } = ringAt();
      const p = toScreen(LAYERS.L2, cam, rx, ry);
      const c = f.c;
      const g = c.createRadialGradient(p.x, p.y, 60, p.x, p.y, 760);
      g.addColorStop(0, withAlpha(f.mood.ink, 0));
      g.addColorStop(0.35, withAlpha(f.mood.ink, 0.12 * endV));
      g.addColorStop(1, withAlpha(f.mood.ink, 0.5 * endV));
      c.save();
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }
    // the ring's swell, laid in screen space over the fog and the near planes, so it is the brightest thing
    if (ringGlow > 0.01) {
      const { rx, ry } = ringAt();
      const p = toScreen(LAYERS.L2, cam, rx, ry);
      glow(f.c, p.x, p.y, (40 + 70 * ringGlow) * p.k, f.mood.halo, 0.32 * ringGlow);
      glow(f.c, p.x, p.y, (13 + 12 * ringGlow) * p.k, f.mood.core, 0.55 * ringGlow);
    }

    // type: index tab (top-left) → place stamp (bottom-left) → name card (right)
    const tenv = { t, mood: f.mood, seed: 1981 };
    indexTab(f.c, { title: 'Clue Three: The Messenger Who Runs Backward', at: 0.1, hold: 2.5, number: 5 }, tenv);
    phosphorStamp(f.c, { place: 'VERSAILLES', date: 'SUMMER 1981', year: 1981, at: b.hopfield, until: b.fade - 0.2, fade: 0.4 }, tenv);
    // the name card on the plain dark upper wall (top right), on a soft plate of its own, clear of crowd and candelabra
    const cardA = win(t, b.card - 0.1, b.card + 0.4) * (1 - win(t, b.card + 3.9, b.card + 4.3));
    if (cardA > 0.003) softPlate(f.c, 1090, 178, 520, 150, f.mood.ink, 0.55 * cardA);
    nameCardLg(f.c, { name: 'John Hopfield', role: 'physicist, Caltech', x: 1222, y: 166, align: 'right', at: b.card, dur: 4.2 }, tenv);
  },
});

// ------------------------------------------------------------------ the easel (L4)
function easel(c: CanvasRenderingContext2D, env: PaintEnv, t: number, tq: number, b: Beats, lit: (i: number) => number, ballU: number) {
  const m = env.mood;
  const ink = env.fill('ink');
  const B = EASEL.board;
  // A-frame: two front legs splayed to the floor, a back leg, the pegs and tray
  c.fillStyle = ink;
  const leg = (x0: number, y0: number, x1: number, y1: number, w: number) => {
    c.beginPath();
    c.moveTo(x0 - w / 2, y0);
    c.lineTo(x0 + w / 2, y0);
    c.lineTo(x1 + w / 2, y1);
    c.lineTo(x1 - w / 2, y1);
    c.closePath();
    c.fill();
  };
  leg(EASEL.x - 70, B.y - 26, EASEL.x - 108, FLOOR, 9);
  leg(EASEL.x + 70, B.y - 26, EASEL.x + 108, FLOOR, 9);
  leg(EASEL.x + 4, B.y - 18, EASEL.x + 22, FLOOR - 2, 6);
  c.fillRect(EASEL.x - 82, B.y - 30, 164, 8);
  // the slate (dark), in a wooden frame; its tray
  c.fillRect(B.x - 7, B.y - 7, B.w + 14, B.h + 14);
  c.fillRect(B.x - 12, B.y + B.h + 6, B.w + 24, 7);
  c.fillStyle = mixLab(m.set, m.fg, 0.35);
  c.fillRect(B.x, B.y, B.w, B.h);
  // old chalk dust: a faint grey bloom on the slate
  const dust = c.createRadialGradient(B.x + B.w * 0.45, B.y + B.h * 0.5, 10, B.x + B.w * 0.45, B.y + B.h * 0.5, B.w * 0.7);
  dust.addColorStop(0, withAlpha(m.rim, 0.07));
  dust.addColorStop(1, withAlpha(m.rim, 0));
  c.fillStyle = dust;
  c.fillRect(B.x, B.y, B.w, B.h);
  c.fillStyle = withAlpha(m.rim, 0.28);
  c.fillRect(B.x - 7, B.y - 7, B.w + 14, 1.3);

  const chalkCol = mixLab(m.rim, m.core, 0.4);
  // the ring (chalked as we arrive: the circle, then the threads between every pair of lanterns)
  const circU = win(t, 1.3, b.hopfield - 0.2);
  const chordU = win(t, b.hopfield + 0.95, b.ring - 0.3);
  const P = Array.from({ length: 8 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 8;
    return { x: RING.x + Math.cos(a) * RING.r, y: RING.y + Math.sin(a) * RING.r };
  });
  if (circU > 0) chalk(c, (cc) => cc.arc(RING.x, RING.y, RING.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * circU), chalkCol, 1.4, 0.55);
  if (chordU > 0) {
    let k = 0;
    const n = 28;
    for (let i = 0; i < 8; i++)
      for (let j = i + 2; j < 8; j++) {
        if (i === 0 && j === 7) continue;
        const u = clamp01(chordU * n - k);
        k++;
        if (u <= 0) continue;
        const a = P[i], q = P[j];
        // threads glow along with the lanterns they join once the pattern is whole
        const both = Math.min(lit(i), lit(j));
        chalk(c, (cc) => {
          cc.moveTo(a.x, a.y);
          cc.lineTo(lerp(a.x, q.x, u), lerp(a.y, q.y, u));
        }, both > 0.9 ? mixLab(chalkCol, m.core, 0.4) : chalkCol, 0.75, 0.32 + 0.22 * both);
      }
  }
  // the bowl (chalked just before 'half') and the ball on its rim
  const bowlU = win(t, b.ring + 0.5, b.half - 0.15);
  if (bowlU > 0) {
    chalk(c, (cc) => {
      cc.moveTo(BOWL.x0 - 8, BOWL.y0 - 4);
      const x1 = lerp(BOWL.x0, BOWL.x1, bowlU);
      for (let x = BOWL.x0; x <= x1; x += 4) cc.lineTo(x, bowlY(x));
      if (bowlU >= 1) cc.lineTo(BOWL.x1 + 8, BOWL.y0 - 4);
    }, chalkCol, 1.5, 0.7);
  }
  // lanterns: small paper lanterns chalked on as the circle reaches them
  for (let i = 0; i < 8; i++) {
    const appear = circU * 8 - i;
    if (appear <= 0) continue;
    paperLantern(c, { x: P[i].x, y: P[i].y, r: RING.lr, act: lit(i), alpha: clamp01(appear), tassel: false, halo: 0.45 }, env);
  }
  // the ball (a chalk-white disc with an ink outline), on twos
  if (t >= b.half - 0.2) {
    const a = clamp01((t - (b.half - 0.2)) / 0.25);
    // ballU is the ball's DROP (energy spent), not its x: each recovered lantern takes it an equal step down,
    // so it visibly reaches the floor on the last lantern (x follows the bowl's profile: sin(pi u_x) = drop)
    const drop = Math.min(1, ballU);
    const bx = lerp(BOWL.x0 + 4, BOWL.x1, Math.asin(drop) / Math.PI) + (ballU > 1 ? (ballU - 1) * 60 : 0);
    const by = bowlY(bx) - 7.5;
    c.save();
    c.globalAlpha *= a;
    c.fillStyle = mixLab(m.rim, m.core, 0.55);
    c.beginPath();
    c.arc(bx, by, 7, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(m.ink, 0.6);
    c.lineWidth = 1;
    c.stroke();
    // a little chalk shadow-line under it (the way it came)
    c.restore();
  }
  void tq;
}

/** after the audience: the lit lanterns' light wrapping over the slate's frame and his hand */
function easelGlow(c: CanvasRenderingContext2D, env: PaintEnv, lit: (i: number) => number, ballU: number, t: number) {
  const m = env.mood;
  let total = 0;
  for (let i = 0; i < 8; i++) total += lit(i);
  if (total <= 0.01) return;
  glow(c, RING.x, RING.y, 120 + 30 * (total / 8), m.halo, 0.05 + 0.08 * (total / 8));
  // when the memory is whole, the bowl's floor catches a warm spot under the ball
  if (ballU > 0.98) glow(c, (BOWL.x0 + BOWL.x1) / 2, bowlY((BOWL.x0 + BOWL.x1) / 2) - 6, 26, m.core, 0.18 * (0.8 + 0.2 * Math.sin(t * 2)));
}

// ------------------------------------------------------------------ his reflection in the last mirror (L2)
function reflection(c: CanvasRenderingContext2D, env: PaintEnv, sc: Scene, t: number, tq: number, ringGlow: number, lit: (i: number) => number) {
  const a = HALL5.arch(LAST);
  // the old glass warps what it shows: the reflection is drawn in bands nudged by a slow sine
  warped(c, { x: a.cx - a.w / 2, y: a.top, w: a.w, h: a.sill - a.top }, LAST, (cc) => reflectionBody(cc, env, sc, t, tq, ringGlow, lit), 8, 2.2, 0);
  const m = env.mood;
  const { rx, ry } = ringAt();
  if (ringGlow > 0.01) {
    // the swell: radius about doubles at its peak; drawn unwarped so it stays round
    glow(c, rx, ry, 46 + 64 * ringGlow, m.halo, 0.42 * ringGlow);
    glow(c, rx, ry, 12 + 16 * ringGlow, m.core, 0.75 * ringGlow);
  }
}
function ringAt() {
  const a = HALL5.arch(LAST);
  const ex = a.cx + 40;
  const fy = a.sill - 6;
  return { ex, fy, rx: ex, ry: fy - 98, rr: 12.5 };
}
function reflectionBody(c: CanvasRenderingContext2D, env: PaintEnv, sc: Scene, t: number, tq: number, ringGlow: number, lit: (i: number) => number) {
  const m = env.mood;
  const a = HALL5.arch(LAST);
  const s = 0.6;
  const fx = a.cx - 32;
  const { ex, fy, rx, ry, rr } = ringAt();
  // the reflected easel (to his right as he faces right) with its ring
  // the same ink as the nearest reflected heads, so he and his easel belong to the glass, not to the room
  const ink = mixLab(m.ink, m.haze, 0.08);
  c.save();
  c.fillStyle = ink;
  // a little A-frame easel: board, tray, two splayed legs and a back leg (reads as an easel, not a sign)
  c.fillRect(ex - 31, fy - 120, 62, 46);
  c.fillRect(ex - 35, fy - 75, 70, 3);
  const leg = (x0: number, x1: number, w: number) => {
    c.beginPath();
    c.moveTo(x0 - w / 2, fy - 126);
    c.lineTo(x0 + w / 2, fy - 126);
    c.lineTo(x1 + w / 2, fy);
    c.lineTo(x1 - w / 2, fy);
    c.closePath();
    c.fill();
  };
  leg(ex - 20, ex - 32, 3);
  leg(ex + 20, ex + 32, 3);
  leg(ex + 2, ex - 6, 2);
  c.fillStyle = mixLab(m.set, m.haze, 0.25);
  c.fillRect(ex - 28, fy - 117, 56, 40);
  // the ring inside it: mirrored, tiny; it swells warm at the end
  c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.4 + 0.5 * ringGlow), 0.5 + 0.5 * ringGlow);
  c.lineWidth = 1.1 + 0.6 * ringGlow;
  c.beginPath();
  c.arc(rx, ry, rr, 0, Math.PI * 2);
  c.stroke();
  for (let i = 0; i < 8; i++) {
    const ang = -Math.PI / 2 - (i * Math.PI * 2) / 8; // mirrored order
    const px = rx + Math.cos(ang) * rr, py = ry + Math.sin(ang) * rr;
    const l = Math.max(lit(i), ringGlow);
    c.fillStyle = l > 0.05 ? mixLab(m.halo, m.core, 0.4 + 0.5 * l) : mixLab(m.ink, m.haze, 0.3);
    c.beginPath();
    c.arc(px, py, 2.3 + 0.6 * ringGlow, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // the man himself, mirrored (facing right), hazed by the double distance
  const smp = sc.hop.sample(t);
  c.save();
  hop.draw(c, { x: fx, y: fy, facing: 'right', pose: withLife(addPose(smp.pose, {}), tq, 1981, 0.8), scale: s, cutLines: false, ink, edgeRim: { x: 0, y: -1, alpha: 0 } }, env);
  c.restore();
}
