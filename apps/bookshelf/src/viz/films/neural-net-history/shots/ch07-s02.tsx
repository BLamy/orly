/**
 * ch07-s02 — a new candle in Toronto, 2006: a deep stack of lanterns warms up one layer at a time; three
 * tick-boxes (computers, data, starting weights) tick, and the third fades to optional.
 *
 * Opens in the study (candleAmber, STUDY LOCK), arrives on the candle stage (dawnGold) through the FLAME PUSH.
 *   0 → 1.65      SHELF: low macro on the 1990s candle NEURAL NETS ARE FIDDLY…, its ghost sleeve ten rings long;
 *                 the camera pushes into its flame (1.2 s, lens → 1.6), bloom up, tint candleAmber → dawnGold
 *   1.65          the stage: the same candle huge at frame left, its pool on the paper floor. At the rim, half in
 *                 shadow and facing OUT, Hinton (2000s puppet) holds a small hand-lantern
 *   'candle'      he lowers the lantern to a short new candle on the floor at the very rim; its wick catches
 *                 (name card, TORONTO · 2006, the belief in Plex Mono). A small BLANK tag hangs at its base
 *   'deep net'    in the new candle's glow, a tall loom of lantern rows (inputs at the bottom) catches the light
 *   'one'         the rows warm one at a time, bottom to top; as each lights, a knot runs back down its strings
 *                 and the row beneath shows a faint dashed echo of its own glow: each row rebuilding its input
 *                 (real numbers: a greedy, layer-wise trained tied-weight autoencoder stack, sets/ch07-s02-stack)
 *   line end +.3  one pulse runs up and back down the whole stack (fine-tuning); the blank tag sways
 *   L0703         a parchment strip beside Hinton: three pictogram tick-boxes (clock, cards, seed) tick on
 *                 'computers', 'data', 'weights'; the quote card rises (Plex Mono on parchment)
 *   'nearly'      the seed's tick flickers, ink not quite dry; 'optional': it pales to a faint outline
 * Camera: a slow push toward the new flame, Hinton held in the left third.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { LAYERS, defineShot, mixLab, nameCard, placeStamp, pose, toLayer, toScreen, withAlpha, withLife, blendPose } from '../../../film';
import { SPECS } from '../cast';
import { createPuppet } from '../../../film/silhouette/puppet';
import { dustMotes } from '../../../film/silhouette/atmosphere';
import { STUDY, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { shelfStateAt } from '../sets/studyState';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { candleStage, floorShadow, stageGeo } from '../sets/candleStage';
import { deepStack } from '../sets/ch07-s02-stack';
import { glow, paperLantern, parchmentPlate } from '../../../film/silhouette/metaphors/kit';
import { beliefLabel, clamp01, lerp, mixCam, monoCard, paperTag, pulse, sm, tickBox, tq12, win } from '../sets/ch07-s01-kit';
import { lampGrade } from '../sets/ch07-s01-grade';
import { hash1 } from '../../../film/core/frame';

const ID = 'ch07-s02';

// ------------------------------------------------------------------------------------------------ the shelf
const VIEWS0 = shelfStateAt(ID, 'start');
const FIDDLY = VIEWS0.find((v) => v.id === 'fiddly')!;
const SHELF_X = candleX(VIEWS0, 'fiddly');
const SHELF_FLAME = candleFlame({ x: SHELF_X, y: STUDY.shelf.y, view: FIDDLY, s: STUDY.shelf.s });
const CAM_SHELF0: Camera3 = { x: SHELF_X + 90, y: STUDY.shelf.y - 150, z: 420, lens: 1 };
const CAM_SHELF1: Camera3 = { x: SHELF_X + 60, y: STUDY.shelf.y - 160, z: 452, lens: 1 };
const CAM_FLAME: Camera3 = { x: SHELF_FLAME.x, y: SHELF_FLAME.y - 4, z: 560, lens: 1.6 };
const SHELF_CAMS = [CAM_SHELF0, CAM_SHELF1, { ...CAM_FLAME, lens: 1 }];

// ------------------------------------------------------------------------------------------------ the stage
const BIG_X = 170;
const POOL = 0.75;
const GEO = stageGeo({ candle: FIDDLY, candleX: BIG_X, pool: POOL });
const FY = GEO.floorY;
const HX = Math.round(GEO.rimX - 8);
/** the 2000s Hinton puppet (cast.hinton) with empty hands: the lantern is this shot's prop, not his laptop */
const HINTON = createPuppet({ ...SPECS.hinton, prop: 'none' });
/** standing at the rim, facing out, the hand-lantern held low in front */
const HOLD: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 7, head: -4, shoulderF: 26, elbowF: 44, wristF: -30, shoulderB: -8, elbowB: 14 }, { handF: 'grip' });
/** leaning to the new candle, the lantern lowered beside its wick */
const LOWER: Pose = pose({ hipF: 16, kneeF: -20, hipB: 4, kneeB: -14, torso: 12, neck: 6, head: 10, shoulderF: 52, elbowF: 6, wristF: -20, shoulderB: -2, elbowB: 18 }, { handF: 'grip' });
/** after: upright again, the lantern raised a little, looking down at the new flame */
const WATCH: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 1, neck: 12, head: 10, shoulderF: 12, elbowF: 14, wristF: -8, shoulderB: -8, elbowB: 14 }, { handF: 'grip' });
const LANTERN_DROP = 14; // cord from the grip to the lantern's crown
const LANTERN_R = 11;
const lanternAt = (hand: { x: number; y: number }) => ({ x: hand.x + 2, y: hand.y + LANTERN_DROP + LANTERN_R * 1.2 });
const LOW_HAND = HINTON.anchor({ x: HX, y: FY, facing: 'right', pose: LOWER }, 'handF');
const LOW_LANTERN = lanternAt(LOW_HAND);
const WARM = shelfStateAt(ID, 'end').find((v) => v.id === 'warmup')!;
const NEW_S = 0.62;
const NEW_X = Math.round(LOW_LANTERN.x + LANTERN_R + 16);
const NEW_FLAME = candleFlame({ x: NEW_X, y: FY, view: { ...WARM, rings: 0 }, s: NEW_S });
// the loom, standing in the new candle's glow
const LOOM = { x: NEW_X + 100, y: 196, w: 262, h: FY - 196 };

// stage cameras: the arrival under the flash, then the slow push toward the new flame
// (review ch07 r1) the big 1990s candle stays whole in frame through the push: its centre ≈ x 150 → 120 on screen
const CW0: Camera3 = { x: 626, y: 388, z: 40, lens: 1 };
const CW1: Camera3 = { x: 594, y: 414, z: 150, lens: 1 };
const STAGE_CAMS = [CW0, CW1];
/** the backlit arched window on the back plane (L3), placed in SCREEN px at the end camera → L3 world */
const WIN = (() => {
  const a = toLayer(LAYERS.L3, CW1, 1092, 60), b = toLayer(LAYERS.L3, CW1, 1252, 560);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
})();
/** the type beside Hinton, in the dead upper-left third above his shoulder (ticks, quote): screen x */
const LX = 322;

interface B {
  D: number;
  push0: number;
  cut: number;
  lower0: number;
  lit: number;
  rise0: number;
  rise1: number;
  frame0: number;
  rows: number[];
  word: number;
  strip: number;
  ticks: number[];
  quote: number;
  all: number;
  hinton: number;
  turned: number;
  nearly: number;
  optional: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const lit = T.beat('lit');
    const one = T.beat('layers');
    const b: B = {
      D,
      push0: 0.45,
      cut: 1.65,
      lower0: lit - 0.62,
      lit,
      rise0: lit + 0.5,
      rise1: lit + 1.25,
      frame0: T.word('L0702', 'warm') - 0.1,
      rows: [one - 0.12, T.word('L0702', 'at') - 0.05, T.word('L0702', 'each') - 0.25, T.word('L0702', 'rebuilding') + 0.05],
      word: T.beat('word'),
      strip: T.beat('tick1') - 0.45,
      ticks: [T.beat('tick1'), T.beat('tick2'), T.beat('tick3')],
      quote: T.beat('quote'),
      all: T.word('L0703', 'All') - 0.2,
      hinton: T.word('L0703', 'Hinton'),
      turned: T.word('L0703', 'turned'),
      nearly: T.beat('nearly'),
      optional: T.beat('optional'),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    if (t < b.cut) shelf(f, t, b);
    else stage(f, t, b);

    // the bright pass over the flame push: rises through the push, peaks at the cut, falls on the stage
    const flash = t < b.cut ? Math.pow(win(t, b.push0 + 0.35, b.cut), 1.6) : 1 - win(t, b.cut, b.cut + 0.6);
    if (flash > 0.002) {
      const c = f.c;
      const P = f.mood;
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      c.globalCompositeOperation = 'lighter';
      const cx = t < b.cut ? 640 : toScreen(LAYERS.L4, stageCam(t, b), GEO.flame.x, GEO.flame.y).x;
      const cy = t < b.cut ? 360 : toScreen(LAYERS.L4, stageCam(t, b), GEO.flame.x, GEO.flame.y).y;
      const g = c.createRadialGradient(cx, cy, 20, cx, cy, 1000);
      g.addColorStop(0, withAlpha(P.core, 0.95 * flash));
      g.addColorStop(0.4, withAlpha(mixLab(P.core, P.halo, 0.5), 0.8 * flash));
      g.addColorStop(1, withAlpha(P.halo, 0.55 * flash));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }
    type_(f, t, b);
  },
});

// ================================================================================================= SHELF
function shelf(f: Frame, t: number, b: B) {
  let cam = mixCam(CAM_SHELF0, CAM_SHELF1, sm(t / b.cut));
  const u = sm((t - b.push0) / (b.cut - b.push0));
  if (u > 0) cam = mixCam(cam, CAM_FLAME, u);
  f.camera(cam);
  if (u > 0) f.setMood('dawnGold', { from: 'candleAmber', u: sm((t - b.push0) / 1.2) });
  studyRoom(f, { key: ID, cams: SHELF_CAMS, outside: { mood: 'duskRose', kind: 'city' } });
  studyCase(f, { shot: ID, when: 'start', key: ID, wall: false });
  if (cam.z < 540) studyNear(f, { key: ID, cams: SHELF_CAMS, file: true });
}

// ================================================================================================= STAGE
function stageCam(t: number, b: B): Camera3 {
  return mixCam(CW0, CW1, sm((t - b.cut) / (b.D - b.cut)));
}

function hintonPose(tq: number, b: B): Pose {
  let p: Pose;
  if (tq < b.lower0) p = HOLD;
  else if (tq < b.lit - 0.08) p = blendPose(HOLD, LOWER, sm((tq - b.lower0) / (b.lit - 0.08 - b.lower0)));
  else if (tq < b.rise0) p = LOWER;
  else p = blendPose(LOWER, WATCH, sm((tq - b.rise0) / (b.rise1 - b.rise0)));
  const A = { ...p.angles };
  // 'one layer at a time': the head lifts from the new flame to the loom and follows the rows climbing
  const look = win(tq, b.rows[0] - 0.35, b.rows[0] + 0.25) * (1 - 0.35 * win(tq, b.word + 0.8, b.word + 1.6));
  const climb = win(tq, b.rows[0], b.rows[3] + 0.3);
  A.neck = (A.neck ?? 0) - 10 * look - 4 * climb;
  A.head = (A.head ?? 0) - 12 * look - 6 * climb;
  A.torso = (A.torso ?? 0) - 2 * look;
  // L0703: a glance up toward the ticks as they are counted off, then back to the flame
  const glance = win(tq, b.ticks[0] - 0.4, b.ticks[0]) * (1 - win(tq, b.ticks[2] + 0.5, b.ticks[2] + 1.0));
  A.head = (A.head ?? 0) - 7 * glance;
  A.neck = (A.neck ?? 0) - 3 * glance;
  // a small nod when his name is spoken
  const nod = pulse(tq, b.hinton - 0.1, 0.2, 0.35);
  A.head = (A.head ?? 0) + 6 * nod;
  // breathing and a slow weight shift (visible at this size)
  const br = Math.sin(tq * 1.9);
  A.torso = (A.torso ?? 0) + 0.9 * br;
  A.shoulderB = (A.shoulderB ?? 0) + 1.6 * br;
  const shift = Math.sin(tq * 0.42 + 1.1);
  A.hipF = (A.hipF ?? 0) + 1.6 * shift;
  A.hipB = (A.hipB ?? 0) - 1.6 * shift;
  return withLife({ ...p, angles: A }, tq, 2006, 1.4);
}

function stage(f: Frame, t: number, b: B) {
  const cam = stageCam(t, b);
  f.camera(cam);
  f.setMood('dawnGold');
  const tq = tq12(t);
  const hp = hintonPose(tq, b);
  const hand = HINTON.anchor({ x: HX, y: FY, facing: 'right', pose: hp }, 'handF');
  const lant = lanternAt(hand);
  // the new flame: catches on 'candle', settles
  const newK = t < b.lit ? 0 : Math.min(1, 0.35 + 0.65 * sm((tq - b.lit) / 0.4)) + 0.25 * pulse(t, b.lit, 0.05, 0.25);
  // the loom: the frame catches the new light, then the rows warm one at a time
  const frame = win(t, b.frame0, b.frame0 + 1.0) * 0.8 + 0.2 * win(t, b.lit, b.lit + 1);
  const rows = b.rows.map((r0) => win(tq, r0, r0 + 0.3));
  const ghost = [0, ...b.rows.slice(1).map((r0) => clamp01((tq - r0) / 1.15))]; // each echo holds ≈ 0.65 s
  // fine-tuning: ONE bright wave, bottom to top over 0.6 s, a short bloom at the top, then it settles
  const pulseU = t > b.word && t < b.word + 0.6 ? (t - b.word) / 0.6 : -1;
  const bloom = pulse(t, b.word + 0.5, 0.12, 0.35);
  const tagSway = 0.05 * Math.sin(Math.max(0, tq - b.lit) * 2.2) + 0.32 * pulse(tq, b.word, 0.18, 0.9) * Math.sin((tq - b.word) * 7);

  candleStage(f, {
    key: ID,
    cams: STAGE_CAMS,
    candle: FIDDLY,
    candleX: BIG_X,
    pool: POOL,
    letters: 0.55,
    // dust in the new candle's light, drifting up behind the loom (L3)
    back: (c, env) => {
      backWindow(c, env);
      if (newK > 0) dustMotes(c, { area: { x: NEW_X - 300, y: 100, w: 820, h: 560 }, count: 80, drift: { x: 3, y: -6 }, size: 1.2, brightness: 0.6 * newK, salt: 72 }, env);
      // a fog sheet between the back plane and the action plane, thickest at the floor
      const fy = toLayer(LAYERS.L3, cam, 0, 560).y;
      const fg = c.createLinearGradient(0, fy - 260, 0, fy + 120);
      fg.addColorStop(0, withAlpha(env.mood.setHaze, 0));
      fg.addColorStop(0.65, withAlpha(env.mood.setHaze, 0.2));
      fg.addColorStop(1, withAlpha(env.mood.setHaze, 0.06));
      c.fillStyle = fg;
      c.fillRect(WIN.x - 2000, fy - 260, 5000, 380);
    },
    draw: (c, env, geo) => {
      // the new candle's own small pool on the floor (beyond the rim)
      if (newK > 0) {
        c.save();
        c.translate(NEW_X + 40, FY + 10);
        c.scale(1, 0.16);
        const R = 330;
        const pg = c.createRadialGradient(0, 0, 4, 0, 0, R);
        pg.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.3), 0.75 * newK));
        pg.addColorStop(0.5, withAlpha(env.mood.halo, 0.32 * newK));
        pg.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = pg;
        c.fillRect(-R, -R, 2 * R, 2 * R);
        c.restore();
      }
      // the stack on its loom (behind the figure plane, in the new candle's glow)
      deepStack(c, { ...LOOM, rows, ghost, pulse: pulseU, pulseGain: 1.5, bloom, frame, alpha: 1 }, env);
      // Hinton's long shadow, away from the old candle; then Hinton, half in shadow, facing out
      floorShadow(c, geo, HX, (cc) => HINTON.draw(cc, { x: 0, y: 0, facing: 'right', pose: hp }, env), env, 1.05);
      HINTON.draw(c, { x: HX, y: FY, facing: 'right', pose: hp, cutLines: true, light: { x: -1, y: -0.35, floor: 0.12 } }, env);
      // the hand-lantern on its cord
      c.strokeStyle = env.fill('ink');
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(hand.x, hand.y);
      c.lineTo(lant.x, lant.y - LANTERN_R * 1.2);
      c.stroke();
      paperLantern(c, { x: lant.x, y: lant.y, r: LANTERN_R, act: 0.9, halo: 0.45, tassel: false }, env);
      // the new candle: short, on the floor at the very rim; its blank tag at the base
      beliefCandle(c, { x: NEW_X, y: FY, view: { ...WARM, rings: 0, tag: '' }, s: NEW_S, flame: newK, drawFlame: false, letters: 0.7 * Math.max(0.35, newK), named: 0 }, env);
      if (newK <= 0) {
        c.fillStyle = env.fill('ink');
        c.fillRect(NEW_FLAME.x - 0.6, NEW_FLAME.y - 1, 1.2, 4);
      }
      paperTag(c, env, { x: NEW_X + 11, y: FY - 30, w: 22, h: 13, len: 8, rot: -0.25 + tagSway, light: 0.25 + 0.6 * newK });
      // a spark leaps from the lantern to the wick just before it catches
      const sp = clamp01((tq - (b.lit - 0.22)) / 0.22);
      if (sp > 0 && sp < 1) {
        const x = lerp(lant.x + LANTERN_R * 0.6, NEW_FLAME.x, sp);
        const y = lerp(lant.y - 2, NEW_FLAME.y, sp) - Math.sin(Math.PI * sp) * 10;
        glow(c, x, y, 10, env.mood.core, 0.9);
      }
    },
  });
  // practicals: the hand-lantern (a soft warm light), the new flame
  f.practical({ x: lant.x, y: lant.y, kind: 'candle', seed: 2006, intensity: 0.42, radius: 26 });
  if (newK > 0) f.practical({ x: NEW_FLAME.x, y: NEW_FLAME.y + 1, kind: 'candle', seed: 2007, intensity: 0.9 * newK, radius: 44 + 18 * newK });
  // the near stage lip (L5), blurred: depth in front of the floor
  footlights(f, cam);
  lampGrade(f, { ...toScreen(LAYERS.L4, cam, NEW_FLAME.x, NEW_FLAME.y), floor: 0.62, core: 320, warm: 0, vignette: 0.3 });
}

// ================================================================================================= TYPE
function type_(f: Frame, t: number, b: B) {
  const c = f.c;
  const tenv = { t, mood: f.mood, seed: 62 };
  if (t >= b.cut) {
    nameCard(c, { name: 'Geoffrey Hinton', role: 'with Ruslan Salakhutdinov · Toronto', x: 1226, y: 520, align: 'right', at: b.lit + 0.15, dur: 3.6 }, tenv);
    placeStamp(c, { place: 'Toronto', date: '2006', style: 'mono', at: b.lit + 0.15, dur: 4.4 }, tenv);
    // the belief (Plex Mono, a paraphrase): top right, clear of the loom's crown
    const la = win(t, b.lit + 0.35, b.lit + 0.85) * (1 - win(t, b.rows[0] - 0.6, b.rows[0] - 0.1));
    beliefLabel(c, ['DEEP NETS MUST BE WARMED UP', 'LAYER BY LAYER'], 1236, 78, la, f.mood, { align: 'right', size: 22 });
  }
  // L0703: the tick strip beside Hinton, then the quote card above it
  const sa = win(t, b.strip, b.strip + 0.45);
  if (sa > 0.01) tickStrip(f, t, b, sa);
  const qa = win(t, b.all, b.all + 0.45);
  if (qa > 0.01) monoCard(c, { x: LX, y: 128, lines: ['All three', 'conditions are', 'now satisfied.'], attrib: 'Hinton & Salakhutdinov, 2006', size: 21, alpha: qa, rise: qa, seed: 61 }, f.mood);
}

function tickStrip(f: Frame, t: number, b: B, a: number) {
  const c = f.c;
  // 1.3×, in the left third at Hinton's shoulder height, just behind him
  const S = 1.16;
  const w = 238 * S, h = 66 * S, x0 = LX - w / 2 - 14, y0 = 258;
  const dy = (1 - a) * 12;
  c.save();
  c.globalAlpha = a;
  parchmentPlate(c, { x: x0, y: y0 + dy, w, h, seed: 63, ornament: false }, { pxScale: f.pxScale } as PaintEnv);
  const s = 28 * S;
  for (let i = 0; i < 3; i++) {
    const tk = clamp01((t - b.ticks[i] + 0.15) / 0.3); // starts at word -0.15: the ink lands on the stress
    let ink = 1;
    let outline = 0;
    let fade = 0;
    if (i === 2) {
      // 'nearly': the seed's tick flickers, ink not quite dry: three clear dips (1 → 0.3 → 1)
      const tq = tq12(t);
      let dip = 0;
      for (const d of [0, 0.25, 0.5]) dip = Math.max(dip, pulse(tq, b.nearly - 0.04 + d, 0.06, 0.07));
      ink = 1 - 0.7 * Math.min(1, dip);
      // 'turned … optional': the tick pales to a thin dashed outline, the seed and its box to ≈ 35 %, done by 'out'
      const u = win(t, b.turned - 0.05, b.turned + 0.62);
      outline = u;
      fade = u;
    }
    tickBox(c, { x: x0 + 70 * S + i * 80 * S, y: y0 + h / 2 + dy, s, icon: (['clock', 'cards', 'seed'] as const)[i], tick: tk, ink, outline, fade });
  }
  c.restore();
}


// ================================================================================================= DEPTH
/** a tall arched window on the back plane, backlit by the dawn beyond: its glazing is a hole of light */
function backWindow(c: CanvasRenderingContext2D, env: PaintEnv) {
  const { x, y, w, h } = WIN;
  const m = env.mood;
  const arch = (cc: CanvasRenderingContext2D, inset: number) => {
    const x0 = x + inset, x1 = x + w - inset, top = y + inset, bot = y + h;
    const r = (x1 - x0) / 2;
    cc.moveTo(x0, bot);
    cc.lineTo(x0, top + r);
    cc.arc(x0 + r, top + r, r, Math.PI, 0);
    cc.lineTo(x1, bot);
    cc.closePath();
  };
  c.save();
  // the light beyond (hazed dawn), brightest low
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, mixLab(m.set, m.sky[1], 0.25));
  g.addColorStop(0.7, mixLab(m.set, m.setHaze, 0.55));
  g.addColorStop(1, mixLab(m.setHaze, m.halo, 0.2));
  c.fillStyle = g;
  c.beginPath();
  arch(c, 14);
  c.fill();
  // the frame and tracery (ink, hazed by the layer)
  c.fillStyle = env.fill('ink');
  c.beginPath();
  arch(c, 0);
  arch(c, 14);
  c.fill('evenodd');
  const x0 = x + 14, x1 = x + w - 14, ww = x1 - x0;
  c.fillRect(x0 + ww / 2 - 3, y + 14, 6, h - 14);
  for (let j = 1; j < 5; j++) c.fillRect(x0, y + ww / 2 + 14 + ((h - ww / 2 - 14) * j) / 5 - 2.5, ww, 5);
  c.fillRect(x - 26, y + h, w + 52, 14);
  // a soft spill of its light on the curtain around it
  const sp = c.createRadialGradient(x + w / 2, y + h * 0.75, 20, x + w / 2, y + h * 0.75, w * 1.6);
  sp.addColorStop(0, withAlpha(m.halo, 0.12));
  sp.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = sp;
  c.fillRect(x - w * 1.6, y - w, w * 4.2, h + 2 * w);
  c.restore();
}

/** the stage lip and a row of footlight hoods on the near plane, out of focus (L5) */
function footlights(f: Frame, cam: Camera3) {
  f.layer('L5', (c, env) => {
    const lip = FY + 58;
    c.fillStyle = env.fill('fg');
    c.fillRect(-600, lip, 2600, 400);
    c.fillStyle = withAlpha(env.mood.rim, 0.22);
    c.fillRect(-600, lip - 1, 2600, 1.6);
    // the hoods: low half-domes on the lip, their backs catching the stage light
    for (let i = 0; i < 14; i++) {
      const hx = -360 + i * 150 + hash1(i, 9) * 20;
      c.fillStyle = env.fill('ink');
      c.beginPath();
      c.ellipse(hx, lip + 2, 38, 22, 0, Math.PI, 0);
      c.fill();
      c.fillStyle = withAlpha(env.mood.halo, 0.16);
      c.beginPath();
      c.ellipse(hx, lip - 14, 26, 5, 0, 0, Math.PI * 2);
      c.fill();
    }
  });
  void cam;
}
