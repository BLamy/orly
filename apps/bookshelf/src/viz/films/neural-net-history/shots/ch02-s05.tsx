/**
 * ch02-s05 — Montreal, 1949: Hebb's guess made visible (candleAmber, paper wipe in over the candle stage,
 * 8.29 s). A parchment plate in the same amber lamp; Donald Hebb stands as a small cut-out at its left
 * margin, as if beside a blackboard. Two paper lanterns, A and B, joined by one loom thread.
 *
 * TEACHES Hebb's postulate in the film's lantern grammar (ch02-s02): B is a threshold unit. Its glow rises
 * with the input that ARRIVES and its wick catches only when the sum reaches the dashed θ ring.
 *   thread width + warmth  ← the connection weight w (also read on a drawn tick scale beside it; no text)
 *   A's share of B's glow  ← w (A's bead lifts B's glow by w)
 *   a faint second thread  ← "other cells" firing B from off the plate (unlabelled)
 * Each pass: the other cells' bead lands first (B's glow rises, still under θ), then A's bead lands and
 * tops it past θ: B fires — A HELPED fire B — and on that instant the link grows (w steps up, the thread
 * thickens and brightens):
 *   'cell'   pass 1  other 0.65 + A 0.25 → fires; w 0.25 → 0.55
 *   'fire'   pass 2  other 0.35 + A 0.55 → fires; w 0.55 → 0.85
 *   'grows'  pass 3  no help: A ALONE (0.85) passes θ = 0.8 → fires; w → 1.0 (the link has grown)
 * In the music-only hold A keeps firing B alone, slowly, while the trimmed postulate sits at the foot.
 *   'guessed' − .56 (quoteUp)  the quote card settles at the foot (verbatim, attributed)
 *   'Hebb' (hebbStamp)         MONTREAL · 1949 types on; Hebb's name card (ink, on the plate)
 */
import { Timeline } from '../../../core';
import { FONT, PUPPET_NEAR_BLACK, createPuppet, defineShot, mixLab, withAlpha, withLife, POSES, blendPose, pose } from '../../../film';
import type { Camera3, LayerSpec, PaintEnv, Pose } from '../../../film';
import { cast } from '../cast';
import { amberPlate, bead, deskTop, inkText, lanternShadow, nearInkwell, paperAt, plateGlow, threadAt, thresholdLantern } from '../sets/ch02-s02-plate';
import { drapery, valance } from '../sets/occluders';
import { legibleSize } from '../../../film/silhouette/type';

type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const BACK: LayerSpec = { id: 'stageBack', z: 1600, haze: 0.2, blur: 1.5 };
const PLATE = { x: 66, y: 52, w: 1148, h: 600 };
const POOL = { x: 700, y: 320, r: 760 };
/** the lanterns: 1.18x the first cut, dropped to ~40% of frame height so the plate's middle band is used */
const A = { x: 530, y: 284 };
const Bp = { x: 948, y: 284 };
const R = 76;
const TH = { x0: A.x + R * 0.78, y0: A.y + 8, x1: Bp.x - R * 0.78, y1: Bp.y + 8 };
/** B's hanging cord, which also carries the "other cells'" signal down from above the plate (unlabelled), the
 *  same kind of cord A hangs from: no stray wire off to the frame's corner */
const HANG = 170;
const CORD_TOP = Bp.y - R * 1.1 - R * 0.13 - HANG;
const CORD_BOT = Bp.y - R * 1.1 - R * 0.13;
/** Hebb: 1.25x the first cut, near-black, a 1940s suit with its hem, pocket flaps and trouser break cut in */
const HEBB = { x: 200, y: 436, s: 0.775 };
const HEBB_P = createPuppet({ ...cast.hebb.spec, details: ['lapel', 'pocketFlap', 'trouserCuff', 'crease', 'buttons'] });
const SCALE = { x: 739, y: 452, w: 300 };
/** B's threshold: the dashed ring sits at RING of the lantern's height; input θ fills exactly to it */
const THETA = 0.8;
const RING = 0.6;
const W_MIN = 0.25, W_MAX = 1.0;

const HEBB_STAND: Pose = POSES.listen;
/** a bent-elbow point at the lanterns (not a straight-arm reach) */
const HEBB_POINT: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 2, neck: 6, head: -6, shoulderF: 46, elbowF: 44, wristF: -6, shoulderB: -9, elbowB: 12 }, { handF: 'point' });
/** on 'grows': a small open-palm present, the palm turned up toward the thickened link */
const HEBB_PRESENT: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 1, neck: 6, head: -5, shoulderF: 34, elbowF: 58, wristF: -30, shoulderB: -8, elbowB: 14 }, { handF: 'open' });

interface Pass {
  at: number;
  fly: number;
  w0: number;
  w1: number;
  /** the other cells' contribution to B on this pass (0 = A alone) */
  other: number;
  /** B's peak brightness when it fires on this pass (it lights brighter as the link grows) */
  peak: number;
}
/** the passes: on the three words, then slow repeats in the hold (A alone) */
function passes(T: { cell: number; fire: number; grows: number; D: number }): Pass[] {
  const ps: Pass[] = [
    { at: T.cell - 0.62, fly: 0.56, w0: 0.25, w1: 0.55, other: 0.65, peak: 0.6 },
    { at: T.fire - 0.42, fly: 0.4, w0: 0.55, w1: 0.85, other: 0.35, peak: 0.8 },
    { at: T.grows - 0.25, fly: 0.25, w0: 0.85, w1: W_MAX, other: 0, peak: 1 },
  ];
  for (let at = T.grows + 1.25; at < T.D - 0.6; at += 1.35) ps.push({ at, fly: 0.22, w0: W_MAX, w1: W_MAX, other: 0, peak: 1 });
  return ps;
}
/** the other cells' bead leaves this much earlier, so it visibly lands first (B's glow rises before A's bead arrives) */
const OTHER_LEAD = 0.3;
function stateAt(ps: Pass[], tq: number) {
  let w = W_MIN;
  let aLit = 0, bFire = 0, bLevel = 0, flash = 0, oLand = 0;
  const beads: number[] = [];
  const oBeads: number[] = [];
  for (const p of ps) {
    if (tq < p.at - OTHER_LEAD) break;
    const dt = tq - p.at;
    const arrive = p.fly;
    // the weight in force: w0 until A's signal lands on a FIRING B, then it grows over ~0.3 s
    if (dt >= 0) w = dt >= arrive ? lerp(p.w0, p.w1, sm((dt - arrive) / 0.3)) : p.w0;
    if (dt >= 0) aLit = Math.max(aLit, dt < arrive + 0.6 ? 1 - sm((dt - arrive - 0.2) / 0.4) : 0);
    if (dt >= 0 && dt < arrive) beads.push(dt / arrive);
    const od = dt + OTHER_LEAD;
    if (p.other > 0 && od >= 0 && od < arrive) oBeads.push(od / arrive);
    // the other cells' bead landing on B's flank: a short flare so the viewer sees it arrive before A's
    if (p.other > 0 && od >= arrive) oLand = Math.max(oLand, 1 - sm((od - arrive) / 0.35));
    // B: the summed input that has ARRIVED (the other cells', then A's share = w)
    const oIn = p.other > 0 && od >= arrive ? p.other * sm((od - arrive) / 0.12) : 0;
    const aIn = dt >= arrive ? p.w0 * sm((dt - arrive) / 0.12) : 0;
    const sum = oIn + aIn;
    const fires = dt >= arrive && p.other + p.w0 >= THETA - 1e-6;
    const fade = 1 - sm((dt - arrive - 0.4) / 0.4);
    if (fires) {
      bFire = Math.max(bFire, fade * p.peak);
      flash = Math.max(flash, 1 - sm((dt - arrive) / 0.4));
    }
    bLevel = Math.max(bLevel, Math.min(1, (RING * sum) / THETA) * (dt >= arrive ? fade : 1));
  }
  return { w, aLit, bFire, bLevel, flash, beads, oBeads, oLand };
}
/** thread width (px) for a weight: 1.5 px at the start, 10 px when the link has grown */
const widthFor = (w: number) => 1.5 + 8.5 * clamp01((w - W_MIN) / (W_MAX - W_MIN));

export default defineShot({
  id: 'ch02-s05',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const ps = passes({ cell: T.beat('pass1'), fire: T.beat('pass2'), grows: T.beat('pass3'), D });
    tl.hold(0, D);
    return {
      tl,
      ps,
      D,
      stamp: T.beat('hebbStamp'),
      quote: T.beat('quoteUp'),
      lineEnd: T.line('L0211').end,
      guessed: T.word('L0211', 'guessed'),
      grows: T.word('L0211', 'grows'),
      when: T.word('L0211', 'when'),
    };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = twos(t);
    const st = stateAt(scene.ps, tq);
    const cam: Camera3 = { x: 640 + 10 * sm(t / scene.D), y: 360, z: 46 * sm(t / scene.D), lens: 1 };
    f.camera(cam);
    f.backlight({ intensity: 0.25 });
    // the paper stage behind the hanging plate (the same dark stage the candle stood on)
    f.layer(BACK, (c, env) => deskTop(f, c, { x: -700, y: -500, w: 2700, h: 1700 }, 'ch02-s05', env, { x: 640, y: 340, r: 900 }));
    f.fog({ yCenter: 0.62 * 720, height: 0.4 * 720, alpha: 0.12, drift: 5 });
    f.layer('L4', (c, env) => {
      amberPlate(f, c, { ...PLATE, key: 'ch02-s05', pool: POOL, seed: 1949 }, env);
      // the lamp's falloff over the plate and the stage around it (corners ~55% darker than the pool's centre),
      // the same lamplit desk world as ch02-s02
      f.cached(`ch02-s05/falloff/${env.mood.id}`, 1800, 900, (cc) => {
        cc.translate(260, 90);
        cc.translate(POOL.x, POOL.y);
        cc.scale(1.25, 0.86);
        const g = cc.createRadialGradient(0, 0, 90, 0, 0, 760);
        g.addColorStop(0, withAlpha(env.mood.fg, 0));
        g.addColorStop(0.3, withAlpha(env.mood.fg, 0.1));
        g.addColorStop(0.6, withAlpha(env.mood.fg, 0.42));
        g.addColorStop(0.85, withAlpha(env.mood.fg, 0.62));
        g.addColorStop(1, withAlpha(env.mood.fg, 0.72));
        cc.fillStyle = g;
        cc.fillRect(-2000, -2000, 4000, 4000);
      }, { blur: 0 })(c, -260, -90);
      // Hebb at the plate's left margin, as if beside a blackboard (no stub floor line): near-black, rimmed on the
      // lamp side, his cut-out's shadow thrown down-right on the parchment like the lanterns'
      // he points (bent elbow) from 'when', and on 'grows' turns it into an open-palm present
      const gesture = sm((tq - (scene.when - 0.25)) / 0.5) * (1 - sm((tq - (scene.lineEnd + 0.6)) / 0.6));
      const present = sm((tq - (scene.grows - 0.1)) / 0.42);
      const hp = withLife(blendPose(HEBB_STAND, blendPose(HEBB_POINT, HEBB_PRESENT, present), gesture), tq, 1949, 0.9);
      c.save();
      c.globalAlpha *= 0.2;
      c.filter = 'blur(2.5px)';
      HEBB_P.draw(c, { x: HEBB.x + 12, y: HEBB.y + 10, facing: 'right', pose: hp, scale: HEBB.s, ink: env.mood.fg }, env);
      c.restore();
      HEBB_P.draw(c, { x: HEBB.x, y: HEBB.y, facing: 'right', pose: hp, scale: HEBB.s, cutLines: true, ink: PUPPET_NEAR_BLACK, edgeRim: { x: 1, y: -0.6, px: 1.6, alpha: 0.7 } }, env);

      // the other cells' signal comes down B's own hanging cord (unlabelled) on passes 1-2 and lands on B FIRST
      for (const u of st.oBeads) bead(c, { x: Bp.x, y: lerp(CORD_TOP + 20, CORD_BOT, sm(u)) }, 1, env, 7.5);
      if (st.oLand > 0.01) plateGlow(c, Bp.x, CORD_BOT + 4, 30, env.mood.core, 0.7 * st.oLand);
      // the loom thread: width AND warmth bound to w (it visibly thickens and brightens as the link grows)
      const tw = widthFor(st.w);
      const sag = 26 / (1 + 2 * st.w);
      cord(c, env, { ...TH, sag }, tw, st.w, st.flash);
      for (const u of st.beads) bead(c, threadAt({ ...TH, sag }, sm(u)), 1, env, 7.5);
      // cut-paper lanterns (s02's grammar) with their own shadows thrown down-right on the parchment
      const paper = mixLab(paperAt(env, 0.8), env.mood.set, 0.22);
      for (const p of [A, Bp]) lanternShadow(c, { x: p.x, y: p.y, r: R, hang: HANG, dx: 12, dy: 12, alpha: 0.2 }, env);
      thresholdLantern(c, { x: A.x, y: A.y, r: R, level: st.aLit > 0.01 ? 1 : 0, fire: st.aLit, hang: HANG, seed: 11, skin: true, paper }, env);
      // B lights brighter pass by pass (peak 0.6 → 0.8 → 1.0): the glow's height and the light both scale with it
      thresholdLantern(c, { x: Bp.x, y: Bp.y, r: R, level: st.bFire > 0.01 ? Math.max(st.bLevel, st.bFire) : st.bLevel, ring: RING, ringGlow: 0.35 + 0.4 * st.flash, fire: st.bFire, theta: 1, hang: HANG, seed: 12, skin: true, paper }, env);
      // the hanging cord warms while it carries the other cells' bead
      if (st.oBeads.length) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = withAlpha(env.mood.halo, 0.35);
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(Bp.x, CORD_TOP + 20);
        c.lineTo(Bp.x, CORD_BOT);
        c.stroke();
        c.restore();
      }
      inkText(c, 'A', A.x, A.y + R * 1.1 + 58, { size: 34, font: FONT.sc, weight: 600 }, env);
      inkText(c, 'B', Bp.x, Bp.y + R * 1.1 + 58, { size: 34, font: FONT.sc, weight: 600 }, env);
      tickScale(c, env, st.w);

      // ink type on the plate: the stamp, Hebb's name card (at the bible's 34 / 26 px), the postulate
      inkStamp(c, env, 'MONTREAL · 1949', 104, 104, t - scene.stamp);
      const nk = sm((t - scene.stamp - 0.1) / 0.5);
      inkText(c, 'donald hebb', HEBB.x - 100, HEBB.y + 50, { size: 37, font: FONT.sc, weight: 600, align: 'left', tracking: 2.4, alpha: nk }, env);
      inkText(c, 'psychologist, McGill', HEBB.x - 100, HEBB.y + 88, { size: 29, italic: true, align: 'left', alpha: nk * sm((t - scene.stamp - 0.35) / 0.5) }, env);
      quote(c, env, t - scene.quote);
    });
    // the lanterns' light on the room (one motivated accent: the lamp's own amber)
    if (st.bFire > 0.05) f.practical({ x: Bp.x, y: Bp.y + 10, kind: 'candle', seed: 1949, intensity: 0.5 * st.bFire, radius: 66 });
    // the paper theatre's near plane (L5, soft): a scalloped pelmet across the top and the curtain's edge at
    // right (the "other cells" thread comes in from behind it); they slide outward as the camera eases in
    f.layer('L5', (c, env) => {
      // the s02 desk's inkwell and dip pen at the bottom-left corner (continuity with the lamplit desk), soft
      f.cached(`ch02-s05/ink/${env.mood.id}`, 420, 420, (cc) => {
        cc.translate(-(-80), -(380));
        nearInkwell(cc, { x: 112, y: 704, penRot: -0.42 }, env);
      })(c, -80, 380);
      f.cached(`ch02-s05/near2/${env.mood.id}`, 1600, 900, (cc) => {
        cc.translate(140, 90);
        valance(cc, { x0: -140, x1: 1460, y: -6, depth: 40 }, env);
        // the curtain frames the plate's right edge (its widest flare stops at the deckle) rather than cropping it
        drapery(cc, { x: 1352, top: -90, bottom: 810, w: 94, side: 'right', folds: 5, tieback: 520, seed: 11 }, env);
        // softened ~25% toward the haze, so the near plane reads as a soft frame, not a black blob
        cc.globalCompositeOperation = 'source-atop';
        cc.fillStyle = withAlpha(env.mood.haze, 0.25);
        cc.fillRect(-140, -90, 1600, 900);
      })(c, -140, -90);
    });
  },
});

/** the loom thread as a solid cord: an ink edge around a warm core whose width IS the weight */
function cord(c: C2, env: PaintEnv, o: { x0: number; y0: number; x1: number; y1: number; sag: number }, w: number, wt: number, flash: number) {
  const P = env.mood;
  const cx = (o.x0 + o.x1) / 2, cy = (o.y0 + o.y1) / 2 + 2 * o.sag;
  const path = () => {
    c.beginPath();
    c.moveTo(o.x0, o.y0);
    c.quadraticCurveTo(cx, cy, o.x1, o.y1);
  };
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = P.ink;
  c.lineWidth = w + 2.4;
  path();
  c.stroke();
  c.strokeStyle = mixLab(mixLab(P.halo, P.set, 0.35), P.core, 0.15 + 0.75 * clamp01((wt - W_MIN) / (W_MAX - W_MIN)));
  c.lineWidth = Math.max(0.6, w - 1.2);
  path();
  c.stroke();
  // the rim brightness steps with the weight: a steady warm glow along a strong link
  const k = clamp01((wt - W_MIN) / (W_MAX - W_MIN));
  if (k > 0.02) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(P.halo, 0.2 * k);
    c.lineWidth = w * 2.4;
    path();
    c.stroke();
    c.globalCompositeOperation = 'source-over';
  }
  if (flash > 0.01) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(P.halo, 0.35 * flash);
    c.lineWidth = w * 3;
    path();
    c.stroke();
    c.strokeStyle = withAlpha(P.core, 0.6 * flash);
    c.lineWidth = w * 0.6;
    path();
    c.stroke();
  }
  c.restore();
}

/** the drawn tick scale beside the thread: w from 0 to 1, a marker at the current weight */
function tickScale(c: C2, env: PaintEnv, w: number) {
  const P = env.mood;
  const { x, y, w: L } = SCALE;
  const x0 = x - L / 2;
  c.save();
  c.strokeStyle = withAlpha(P.ink, 0.75);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(x0 + L, y);
  for (let i = 0; i <= 10; i++) {
    const h = i % 5 === 0 ? 14 : 7;
    c.moveTo(x0 + (L * i) / 10, y);
    c.lineTo(x0 + (L * i) / 10, y + h);
  }
  c.stroke();
  // the bar fills to w (thicker and warmer as the link grows)
  c.fillStyle = withAlpha(P.ink, 0.85);
  c.fillRect(x0, y - 8, L * w, 6);
  // marker: a small ink pointer
  const mx = x0 + L * w;
  c.beginPath();
  c.moveTo(mx, y - 9);
  c.lineTo(mx - 8, y - 24);
  c.lineTo(mx + 8, y - 24);
  c.closePath();
  c.fill();
  c.restore();
}

/** a typewritten stamp struck onto the plate in ink, character by character on the twos */
function inkStamp(c: C2, env: PaintEnv, text: string, x: number, y: number, dt: number) {
  if (dt < 0) return;
  const tq = Math.floor(dt * 12) / 12;
  const n = Math.min(text.length, Math.floor(tq * 16 + 1e-6));
  c.save();
  c.font = `400 24px ${FONT.typewriter}`;
  const adv = c.measureText('M').width * 1.02;
  c.fillStyle = env.mood.ink;
  c.textBaseline = 'alphabetic';
  for (let i = 0; i < n; i++) {
    if (text[i] === ' ') continue;
    c.globalAlpha = 0.78 + 0.2 * (((i * 37) % 7) / 7);
    c.fillText(text[i], x + i * adv, y + ((i * 13) % 3) * 0.4);
  }
  c.restore();
}

/** the trimmed postulate across the plate's foot (verbatim; ellipsis as in the script) */
function quote(c: C2, env: PaintEnv, dt: number) {
  if (dt < -0.05) return;
  const k1 = sm(dt / 0.6);
  const k2 = sm((dt - 0.5) / 0.6);
  inkText(c, '“…A’s efficiency, as one of the cells firing B, is increased.”', 640, 566, { size: 30, italic: true, alpha: k1 }, env);
  const at = '— Hebb, 1949';
  inkText(c, at, 640, 610, { size: legibleSize(c, `600 22px ${FONT.sc}`, 22, at) * 1.04, font: FONT.sc, weight: 600, tracking: 1.5, alpha: k2 }, env);
}
