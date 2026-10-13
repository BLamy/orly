/**
 * neural-net-history — THE REWIND / THE FAST-FORWARD (treatment: recurring devices).
 *
 * Five held paper-cut images, each one clue, painted as a pure function of its FORWARD progress u
 * (0 = before the event, 1 = after it). ch01-s06 plays them backwards (u: 1 → 0) in reverse order of time;
 * ch15's fast-forward can replay the very same images forwards (u: 0 → 1) at the same 0.75 s spacing, so the
 * two read as one rhyme.
 *
 *   goStone  a white Go stone is set down on a lit board by a silhouette hand     (backwards: lifts into it)
 *   fans     inside a dark tower two graphics cards' fans, backlit through the grille, spin up; a status
 *            light comes on                                                      (backwards: spin down, out)
 *   snow     snow falls on a white field under a winter sky                       (backwards: rises)
 *   knob     a motorised potentiometer knob (knurled cap, shaft, motor) in a row of identical knobs turns
 *            about 90°                                                            (backwards: unturns)
 *   wick     a paper lantern's wick catches over the Chicago night: ember, glow   (backwards: goes dark)
 *
 * GRADE: every image is two passes. The BACK plates (everything behind the hero) take the full tape grade
 * (half chroma, one rose cast, highlights capped, shadows lifted into the rose); then the hero cut-out is
 * painted at true ink and only the colour cast and vignette go over it, so each image keeps a backlit
 * paper-cut's ≈ 15:1 hero-to-backlight contrast.
 *
 *   paintRewindImage(f, img, u, uq, dir)  paints a whole frame (mood, camera, L0 … L5). uq = u on the twos
 *                                         (hands, lights); dir = -1 rewind (default) / +1 fast-forward
 *                                         (which way the snow streaks trail).
 *   tapeShudder(f, amt, seed, dir)        the stretched-tape look over the composed frame: torn bands, a tracking
 *                                         band rolling up (dir -1, rewind) or down (dir +1, fast-forward), warble.
 *   REWIND_IMAGES, REWIND_STEP
 */
import type { Camera3, Frame, LayerSpec, PaintEnv, Palette } from '../../../film';
import {
  CM,
  LAYERS,
  MOODS,
  crossfadeMood,
  forestBand,
  goBoard,
  hash1,
  mixLab,
  overscan,
  paperLantern,
  ridgeline,
  snow,
  snowfield,
  toScreen,
  tree,
  withAlpha,
} from '../../../film';
import { CHI_NIGHT, chiBackdrop } from './ch01-s06-chicago';

type C = CanvasRenderingContext2D;
export const REWIND_IMAGES = ['goStone', 'fans', 'snow', 'knob', 'wick'] as const;
export type RewindImage = (typeof REWIND_IMAGES)[number];
/** seconds per image (the beats sit exactly this far apart) */
export const REWIND_STEP = 0.75;

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const v = clamp01(u);
  return v * v * (3 - 2 * v);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

type Rect = { x: number; y: number; w: number; h: number };
const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void, blur?: number) => {
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  }, blur ? { blur } : undefined)(c, r.x, r.y);
};
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

export function paintRewindImage(f: Frame, img: RewindImage, u: number, uq = u, dir: -1 | 1 = -1) {
  switch (img) {
    case 'goStone':
      return paintGo(f, clamp01(u), clamp01(uq));
    case 'fans':
      return paintFans(f, clamp01(u), clamp01(uq));
    case 'snow':
      return paintSnow(f, clamp01(u), dir);
    case 'knob':
      return paintKnob(f, clamp01(u));
    case 'wick':
      return paintWick(f, clamp01(u), clamp01(uq));
  }
}

// =====================================================================================================
// 1 · GO STONE — a lit goban seen low across its edge; a hand sets one white stone
// =====================================================================================================
const GO = { x: 640, y: 780, s: 10 };
const GO_PT = { col: 12, row: 6 };
const GO_CAMS: Camera3[] = [
  { x: 640, y: 360, z: 10, lens: 1 },
  { x: 640, y: 360, z: 100, lens: 1 },
];

/** a paper-cut forearm and Go grip in cm, fingertips at the origin, +x toward the fingertips; the wrist at
 *  x = WRIST, where the forearm bends away (so the arm can enter from the side while the hand dips) */
const WRIST = -18.6;
let HAND: { hand: Path2D; arm: Path2D; cuts: Path2D; armCuts: Path2D; link: Path2D } | null = null;
function handGeo() {
  if (HAND) return HAND;
  const hand = new Path2D();
  const arm = new Path2D();
  const rr = (P: Path2D, x: number, y: number, w: number, h: number, r: number) => {
    const p = new Path2D();
    p.roundRect(x, y, w, h, r);
    P.addPath(p);
  };
  // the jacket sleeve, flaring a little at its hem; the shirt cuff stands proud of it, then the wrist
  {
    const p = new Path2D();
    p.moveTo(-90, -5.2);
    p.lineTo(-27.2, -5.9);
    p.lineTo(-26.6, 6.0);
    p.lineTo(-90, 5.2);
    p.closePath();
    arm.addPath(p);
  }
  rr(arm, -27.6, -4.6, 6.4, 9.2, 0.7); // the shirt cuff (squared, crisp)
  // the hand as ONE clean outline (wrist → back of the hand over the knuckles → the two extended fingers
  // gripping the stone → the curled fingers' fold → the heel of the palm), so the rim pass gives one crisp edge
  {
    const p = new Path2D();
    p.moveTo(-22, -3.2);
    p.quadraticCurveTo(-19, -3.9, -15.5, -4.0);
    p.quadraticCurveTo(-11.2, -4.2, -9.6, -3.5); // the knuckle
    p.quadraticCurveTo(-8.9, -2.7, -7.8, -2.4);
    p.lineTo(-1.3, -2.1); // middle finger, back
    p.quadraticCurveTo(0.1, -2.0, 0.1, -0.95); // fingertip
    p.quadraticCurveTo(0.0, -0.05, -0.9, -0.02);
    p.lineTo(-0.9, 0.2); // index finger, tip
    p.quadraticCurveTo(0.0, 0.5, -0.2, 1.4);
    p.quadraticCurveTo(-0.5, 2.25, -1.6, 2.25);
    p.lineTo(-6.9, 2.3); // index finger, underside
    p.quadraticCurveTo(-7.6, 2.5, -7.8, 3.2); // into the curled fingers
    p.quadraticCurveTo(-8.6, 4.9, -10.6, 4.9);
    p.quadraticCurveTo(-12.6, 5.2, -14.6, 4.7);
    p.quadraticCurveTo(-17.6, 4.2, -19.6, 3.6); // heel of the palm
    p.quadraticCurveTo(-21.0, 3.4, -22, 3.3);
    p.closePath();
    hand.addPath(p);
  }
  // cut-lines: the split between the two fingers, their joints, the curled fingers' folds, the nail
  const cuts = new Path2D();
  cuts.moveTo(-7.4, 0.06);
  cuts.lineTo(-1.0, 0.06);
  for (const x of [-3.9, -5.9]) {
    cuts.moveTo(x, -1.9);
    cuts.quadraticCurveTo(x - 0.3, -1.0, x, -0.3);
  }
  cuts.moveTo(-8.0, 3.0);
  cuts.quadraticCurveTo(-9.6, 3.4, -10.4, 4.6);
  cuts.moveTo(-11.0, 3.6);
  cuts.quadraticCurveTo(-12.2, 3.9, -12.8, 4.9);
  cuts.moveTo(-14.8, -2.6);
  cuts.quadraticCurveTo(-11.8, -3.0, -8.8, -2.3); // the thumb's edge along the back
  cuts.moveTo(-1.4, -1.9);
  cuts.quadraticCurveTo(-0.5, -1.7, -0.25, -1.0);
  const armCuts = new Path2D();
  armCuts.moveTo(-27.6, -4.4);
  armCuts.lineTo(-27.6, 4.4);
  armCuts.moveTo(-21.4, -4.4);
  armCuts.lineTo(-21.4, 4.4);
  armCuts.moveTo(-70, -3.8);
  armCuts.quadraticCurveTo(-52, -2.6, -32, -4.2);
  armCuts.moveTo(-60, 3.6);
  armCuts.quadraticCurveTo(-46, 2.2, -34, 3.9);
  const link = new Path2D();
  link.ellipse(-24.4, -0.2, 0.75, 0.75, 0, 0, Math.PI * 2);
  HAND = { hand, arm, cuts, armCuts, link };
  return HAND;
}
function drawHand(c: C, env: PaintEnv, x: number, y: number, ang: number, bend: number, s: number) {
  const H = handGeo();
  const ink = env.mood.ink;
  const rim = env.mood.rim;
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.scale(s, s);
  c.save();
  c.translate(WRIST, 0);
  c.rotate(-bend);
  c.translate(-WRIST, 0);
  c.fillStyle = ink;
  c.fill(H.arm);
  c.strokeStyle = withAlpha(rim, 0.55);
  c.lineWidth = 1.1 / s;
  c.stroke(H.armCuts);
  c.fillStyle = withAlpha(rim, 0.8);
  c.fill(H.link);
  c.restore();
  c.fillStyle = ink;
  c.fill(H.hand);
  c.strokeStyle = withAlpha(rim, 0.6);
  c.lineWidth = 1.1 / s;
  c.stroke(H.cuts);
  c.restore();
}

function paintGo(f: Frame, u: number, uq: number) {
  f.setMood('duskRose');
  f.camera({ x: 640, y: 360, z: lerp(10, 100, u), lens: 1 });
  f.backlight({ sunX: 760, sunY: 300, sunRadius: 760, intensity: 0.95 });
  // L1: far beyond the glazing, a city's low roofline and a few bare crowns, hazed nearly into the sky (seen
  // only through the panes; the far plane the pull-back slides over)
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, GO_CAMS, 40);
    bake(f, c, `nnh-rw-go2-L1-${env.mood.id}-${rk(r)}`, r, (cc) => {
      cc.fillStyle = env.fill('set');
      cc.beginPath();
      let x = r.x;
      let i = 0;
      cc.moveTo(r.x, 720);
      while (x < r.x + r.w) {
        const w = 40 + 70 * (0.5 + 0.5 * hash1(i, 2016));
        const h = 70 + 130 * (0.5 + 0.5 * hash1(i, 2017)) * (hash1(i, 2018) > 0.75 ? 1.9 : 1);
        cc.lineTo(x, 500 - h);
        cc.lineTo(x + w, 500 - h);
        x += w;
        i++;
      }
      cc.lineTo(r.x + r.w, 720);
      cc.closePath();
      cc.fill();
      for (const [tx, ts] of [[180, 1.1], [700, 0.9], [1020, 1.25]] as const) {
        tree(cc, { x: tx, y: 500, h: 230 * ts, seed: Math.round(tx), kind: 'elm' }, env);
      }
    });
  });
  // L2: a hall with tall glazed panels behind the board (the backlight, graded)
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, GO_CAMS, 40);
    bake(f, c, `nnh-rw-go-L2-${env.mood.id}-${rk(r)}`, r, (cc) => {
      cc.fillStyle = env.fill('set');
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      for (const x of [-60, 250, 560, 870, 1180]) cc.rect(x, 30, 230, 470);
      cc.fill('evenodd');
      for (const x of [-60, 250, 560, 870, 1180]) {
        cc.fillRect(x + 113, 30, 5, 470);
        cc.fillRect(x, 180, 230, 5);
        cc.fillRect(x, 330, 230, 4);
      }
      cc.fillRect(r.x, 500, r.w, r.y + r.h - 500);
    });
  });
  f.fog('A');
  gradeBack(f, GRADE.goStone);
  const o = { x: GO.x, y: GO.y, s: GO.s, view: 'perspective' as const, count: 46, seed: 2016, bowls: true };
  const target = goBoard.point(o, GO_PT.col, GO_PT.row);
  const hover = { x: target.x + 60, y: target.y - 200 };
  // forward: the hand lowers the stone (0 → .5), lets go (.5 → .6), withdraws (.6 → 1); on the twos
  let p: { x: number; y: number };
  let holding: boolean;
  if (uq < 0.5) {
    const e = sm(uq / 0.5);
    p = { x: lerp(hover.x, target.x, e), y: lerp(hover.y, target.y, e) };
    holding = true;
  } else if (uq < 0.6) {
    p = target;
    holding = uq < 0.55;
  } else {
    const e = sm((uq - 0.6) / 0.4);
    p = { x: lerp(target.x, hover.x + 40, e), y: lerp(target.y, hover.y - 60, e) };
    holding = false;
  }
  const k = CM * GO.s;
  const stoneR = 0.95 * 0.9 * k;
  const stone = (c: C, env: PaintEnv, x: number, y: number) => {
    c.beginPath();
    c.ellipse(x, y - stoneR * 0.22, stoneR, stoneR * 0.46, 0, 0, Math.PI * 2);
    c.fillStyle = mixLab(env.mood.rim, env.mood.core, 0.45);
    c.fill();
    c.strokeStyle = withAlpha(env.mood.ink, 0.6);
    c.lineWidth = 0.8;
    c.stroke();
  };
  // the hero: the board's body and the hand at true ink (ungraded except for the colour cast)
  const heroEnv = (env: PaintEnv): PaintEnv => ({ ...env, fill: (role) => (role === 'ink' || role === 'fg' ? env.mood.ink : env.fill(role)) });
  f.layer('L4', (c, env0) => {
    const env = heroEnv(env0);
    goBoard(c, o, env);
    // the lamp's pool on the board top
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(600, 360);
    c.scale(1, 0.32);
    const g = c.createRadialGradient(0, 0, 10, 0, 0, 420);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.26));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(-420, -420, 840, 840);
    c.restore();
    if (!holding) stone(c, env, target.x, target.y);
    // the pendant lamp's shade and flex at the top of frame
    c.fillStyle = env.mood.ink;
    c.fillRect(518, -200, 3, 236);
    c.beginPath();
    c.moveTo(470, 72);
    c.quadraticCurveTo(476, 40, 506, 30);
    c.lineTo(534, 30);
    c.quadraticCurveTo(564, 40, 570, 72);
    c.closePath();
    c.fill();
    // the hand (ink, on the twos), the stone held between index and middle finger; smaller, so the
    // fingertip and the stone are the subject
    drawHand(c, env, p.x + 2, p.y - 3, Math.PI * 0.6, 0.62, k * 0.74);
    if (holding) stone(c, env, p.x, p.y);
  });
  f.rim({ x: 0.2, y: -1 });
  f.practical({ x: 520, y: 78, kind: 'lamp', seed: 61, intensity: 0.85, radius: 70 });
  // L5: the near plane, soft: the opponent's lidded bowl at the lower left and a spindle chair back cutting
  // the right edge (the pull-back slides them out past the board)
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, GO_CAMS, 60);
    bake(f, c, `nnh-rw-go2-L5-${env.mood.id}-${rk(r)}`, r, (cc) => {
      cc.fillStyle = env.mood.ink;
      // the bowl: a big turned body cropped by the lower-left corner, its lid set ajar on the rim
      cc.beginPath();
      cc.ellipse(-10, 780, 230, 150, 0, Math.PI, 0);
      cc.lineTo(220, 960);
      cc.lineTo(-240, 960);
      cc.closePath();
      cc.fill();
      cc.beginPath();
      cc.ellipse(10, 640, 214, 40, -0.1, 0, Math.PI * 2);
      cc.fill();
      cc.beginPath();
      cc.ellipse(22, 620, 84, 22, -0.1, Math.PI, 0);
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.34);
      cc.lineWidth = 2.2;
      cc.beginPath();
      cc.ellipse(10, 638, 214, 40, -0.1, Math.PI * 1.15, Math.PI * 1.85);
      cc.stroke();
      cc.beginPath();
      cc.ellipse(22, 618, 84, 22, -0.1, Math.PI * 1.2, Math.PI * 1.8);
      cc.stroke();
      // the chair back: two turned posts, a crest rail and spindles, cropped by the right edge
      cc.fillStyle = env.mood.ink;
      const x0 = 1150, x1 = 1420, top = 430;
      for (const px of [x0, x1]) {
        cc.fillRect(px - 15, top - 20, 30, 760 - top + 40);
        cc.beginPath();
        cc.ellipse(px, top - 26, 20, 20, 0, 0, Math.PI * 2);
        cc.fill();
      }
      cc.beginPath();
      cc.moveTo(x0, top);
      cc.quadraticCurveTo((x0 + x1) / 2, top - 40, x1, top);
      cc.lineTo(x1, top + 46);
      cc.quadraticCurveTo((x0 + x1) / 2, top + 6, x0, top + 46);
      cc.closePath();
      cc.fill();
      for (let k = 1; k < 5; k++) {
        const sx = x0 + ((x1 - x0) * k) / 5;
        cc.fillRect(sx - 5, top + 20, 10, 760 - top);
      }
      cc.fillRect(x0, 640, x1 - x0, 22);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.3);
      cc.beginPath();
      cc.moveTo(x0 - 15, top - 18);
      cc.quadraticCurveTo((x0 + x1) / 2, top - 58, x1 + 15, top - 18);
      cc.stroke();
    });
  });
  gradeHero(f);
}

// =====================================================================================================
// 2 · FANS — inside a dark tower: two graphics cards, their fans face-on, backlit through the grille
// =====================================================================================================
const FANS_MOOD: Palette = crossfadeMood('duskRose', 'serverCyan', 0.18);
const FANS_CAMS: Camera3[] = [
  { x: 640, y: 360, z: 20, lens: 1 },
  { x: 640, y: 360, z: 90, lens: 1 },
];
/** two cards, two fans each (L4 world) */
const FAN_R = 84;
const CARDS = [
  { x: 640, y: 252, w: 900, h: 206 },
  { x: 640, y: 512, w: 900, h: 206 },
];
const FAN_XS = [462, 818];
/** the fans' light: a plane at the cards' own depth, painted before the back grade (it is the backlight) */
const FAN_LIGHT: LayerSpec = { id: 'fanLight', z: 1000, haze: 0.03, blur: 0 };
/**
 * forward: the fans start from rest at FAN_X0 and wind up to FAN_RATE rev/s at u = 1, so played backwards they
 * open at full speed (a smoked veil over the light) and decay to still, crisp blades by ≈ 0.63 s into the image.
 * The status light is on for u ≥ LED_ON (backwards: it dims on the twos ≈ 0.58 s into the image, ≈ 1.83 s in
 * ch01-s06, and is out a frame-pair later).
 */
const FAN_X0 = 0.16, FAN_RATE = 3.0, LED_ON = 1 - 0.55 / REWIND_STEP;
function fanRate(u: number) {
  const x = clamp01((u - FAN_X0) / (1 - FAN_X0));
  return FAN_RATE * Math.pow(x, 1.5);
}
function fanTurns(u: number) {
  const x = clamp01((u - FAN_X0) / (1 - FAN_X0));
  return (FAN_RATE * (1 - FAN_X0) * REWIND_STEP * Math.pow(x, 2.5)) / 2.5;
}
/** the status LED on the top card's edge (world, L4) */
const STATUS_LED = { x: 1052, y: 162 };
let BLADES: Path2D | null = null;
/** nine swept blades in unit radius (hub at 0.3) */
function bladeGeo() {
  if (BLADES) return BLADES;
  const P = new Path2D();
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const p = new Path2D();
    const pt = (r: number, a: number) => [Math.cos(a0 + a) * r, Math.sin(a0 + a) * r] as const;
    const s0 = pt(0.28, -0.16), s1 = pt(0.62, 0.02), s2 = pt(0.97, 0.3), s3 = pt(0.97, 0.62), s4 = pt(0.6, 0.38), s5 = pt(0.28, 0.2);
    p.moveTo(...s0);
    p.quadraticCurveTo(s1[0], s1[1], s2[0], s2[1]);
    p.quadraticCurveTo(...pt(1.0, 0.46), s3[0], s3[1]);
    p.quadraticCurveTo(s4[0], s4[1], s5[0], s5[1]);
    p.closePath();
    P.addPath(p);
  }
  BLADES = P;
  return P;
}
function paintFans(f: Frame, u: number, uq: number) {
  f.setMood(FANS_MOOD);
  const rate = fanRate(u);
  f.camera({ x: 640, y: 360, z: lerp(20, 90, u), lens: 1 });
  f.backlight({ sunX: 640, sunY: 380, sunRadius: 620, intensity: 0.35 });
  // L2: the tower's back panel: ink-dark steel, a few perforations catching the room behind
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, FANS_CAMS, 40);
    bake(f, c, `nnh-rw-fans3-L2-${env.mood.id}-${rk(r)}`, r, (cc) => {
      cc.fillStyle = mixLab(env.mood.ink, env.fill('set'), 0.14);
      cc.fillRect(r.x, r.y, r.w, r.h);
      const pitch = 22;
      for (let j = 0, y = r.y + 10; y < r.y + r.h; j++, y += pitch * 0.866) {
        for (let x = r.x + (j % 2 ? pitch / 2 : 0); x < r.x + r.w; x += pitch) {
          const d = Math.hypot((x - 1180) / 260, (y - 640) / 200);
          const a = 0.2 * Math.max(0, 1 - d) ** 1.5;
          if (a < 0.01) continue;
          cc.fillStyle = withAlpha(env.mood.halo, a);
          cc.beginPath();
          cc.arc(x, y, 2.4, 0, Math.PI * 2);
          cc.fill();
        }
      }
    });
  });
  // L3: a cable bundle between the panel and the cards
  f.layer('L3', (c, env) => {
    c.strokeStyle = env.mood.ink;
    c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      c.lineWidth = 10 - i * 1.5;
      c.beginPath();
      c.moveTo(150 + i * 13, -40);
      c.bezierCurveTo(120 + i * 10, 260, 230 + i * 6, 420, 160 + i * 12, 780);
      c.stroke();
    }
  });
  // haze inside the case: a soft sheet lying between the back panel and the cards, lit from the grille side
  // (lower right), so the cards stand off the panel instead of sitting flat on it
  f.fog({ yCenter: 440, height: 600, alpha: 0.2, drift: -5 });
  f.layer('L3', (c, env) => {
    const g = c.createRadialGradient(1100, 620, 40, 1100, 620, 820);
    g.addColorStop(0, withAlpha(mixLab(env.mood.haze, env.mood.halo, 0.3), 0.32));
    g.addColorStop(0.5, withAlpha(env.mood.haze, 0.12));
    g.addColorStop(1, withAlpha(env.mood.haze, 0));
    c.fillStyle = g;
    c.fillRect(-200, -200, 1700, 1200);
  });
  // the light behind each fan: the room through the side grille, a honeycomb of ink bars over a warm-cyan glow
  f.layer(FAN_LIGHT, (c, env) => {
    const R = FAN_R + 10;
    const disc = f.cached(`nnh-rw-fans3-disc-${env.mood.id}`, 2 * R, 2 * R, (cc) => {
      cc.translate(R, R);
      const g = cc.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, mixLab(env.mood.core, env.mood.halo, 0.35));
      g.addColorStop(0.55, mixLab(env.mood.halo, env.mood.haze, 0.35));
      g.addColorStop(1, mixLab(env.mood.haze, env.mood.ink, 0.45));
      cc.fillStyle = g;
      cc.beginPath();
      cc.arc(0, 0, R, 0, Math.PI * 2);
      cc.fill();
      cc.strokeStyle = env.mood.ink;
      cc.lineWidth = 2.2;
      const s = 11;
      for (let j = -12; j <= 12; j++) {
        for (let i = -12; i <= 12; i++) {
          const x = i * s * 1.5, y = j * s * 1.732 + (i % 2 ? s * 0.866 : 0);
          if (Math.hypot(x, y) > R + s) continue;
          cc.beginPath();
          for (let k = 0; k <= 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            const px = x + Math.cos(a) * s, py = y + Math.sin(a) * s;
            if (k === 0) cc.moveTo(px, py);
            else cc.lineTo(px, py);
          }
          cc.stroke();
        }
      }
    });
    for (const card of CARDS) for (const fx of FAN_XS) disc(c, fx - R, card.y - R);
  });
  gradeBack(f, GRADE.fans);
  // L4: the hero: blades (ink; a smoked veil while fast, crisp as they stop), hubs, the card shrouds with
  // their two round openings, the PCIe brackets, the power plugs
  f.layer('L4', (c, env) => {
    const ink = env.mood.ink;
    const rim = env.mood.rim;
    const turns = fanTurns(u);
    const shutter = 1 / 24;
    const smear = rate * Math.PI * 2 * shutter;
    const K = Math.max(1, Math.min(14, Math.ceil(smear / 0.06)));
    const a = K === 1 ? 1 : 1 - Math.pow(0.12, 1 / K);
    const B = bladeGeo();
    for (const card of CARDS) {
      for (let fi = 0; fi < FAN_XS.length; fi++) {
        const fx = FAN_XS[fi];
        const base = turns * Math.PI * 2 * (fi % 2 ? -1 : 1) + fi * 0.4 + card.y * 0.01;
        c.save();
        c.translate(fx, card.y);
        c.fillStyle = ink;
        for (let k = 0; k < K; k++) {
          c.save();
          c.globalAlpha = a;
          c.rotate(base - (fi % 2 ? -1 : 1) * smear * (k / K));
          c.scale(FAN_R, FAN_R);
          c.fill(B);
          c.restore();
        }
        c.globalAlpha = 1;
        // hub with its sticker ring
        c.beginPath();
        c.arc(0, 0, FAN_R * 0.3, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = withAlpha(rim, 0.35);
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(0, 0, FAN_R * 0.22, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      // the shroud, its two openings cut out
      const x0 = card.x - card.w / 2, y0 = card.y - card.h / 2;
      c.fillStyle = ink;
      c.beginPath();
      c.roundRect(x0, y0, card.w, card.h, 18);
      for (const fx of FAN_XS) {
        c.moveTo(fx + FAN_R, card.y);
        c.arc(fx, card.y, FAN_R, 0, Math.PI * 2, true);
      }
      c.fill('evenodd');
      // the opening's four struts (the motor's spider)
      for (const fx of FAN_XS) {
        for (let q = 0; q < 3; q++) {
          c.save();
          c.translate(fx, card.y);
          c.rotate(q * ((Math.PI * 2) / 3) + 0.5);
          c.fillRect(FAN_R * 0.28, -2, FAN_R * 0.72, 4);
          c.restore();
        }
      }
      // the bracket at left, the edge connector below, the power plug on the top edge
      c.fillRect(x0 - 26, y0 - 14, 22, card.h + 40);
      c.fillRect(x0 + 120, y0 + card.h - 2, 380, 12);
      c.fillRect(x0 + card.w - 150, y0 - 16, 70, 18);
      // cut-lines catching the light from behind: the shroud's chamfer, the opening rims, the bracket slots
      c.strokeStyle = withAlpha(rim, 0.32);
      c.lineWidth = 1.3;
      c.beginPath();
      c.roundRect(x0 + 8, y0 + 8, card.w - 16, card.h - 16, 12);
      c.stroke();
      c.strokeStyle = withAlpha(rim, 0.5);
      for (const fx of FAN_XS) {
        c.beginPath();
        c.arc(fx, card.y, FAN_R + 5, Math.PI * 1.05, Math.PI * 1.95);
        c.stroke();
      }
      for (let k = 0; k < 5; k++) c.strokeRect(x0 - 20, y0 + 12 + k * 36, 10, 24);
    }
    // the LED's housing on the top card's edge
    c.fillStyle = ink;
    c.fillRect(STATUS_LED.x - 14, STATUS_LED.y - 8, 28, 16);
  });
  f.rim({ x: 0, y: -1 });
  gradeHero(f);
  // L5: the near plane, blurred: the edge of the tower's open side panel at frame left (its folded lip and a
  // thumbscrew catching the grille light) and a heavy power cable sagging across the lower right corner
  f.layer('L5', (c, env) => {
    const ink = mixLab(env.mood.ink, env.mood.fg, 0.5);
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(-300, -200);
    c.lineTo(88, -200);
    c.lineTo(88, 120);
    c.quadraticCurveTo(70, 140, 70, 170);
    c.lineTo(70, 900);
    c.lineTo(-300, 900);
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha(env.mood.rim, 0.4);
    c.fillRect(85, -200, 3, 320);
    c.fillRect(69, 170, 3, 730);
    c.fillStyle = ink;
    c.beginPath();
    c.arc(52, 300, 14, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(env.mood.rim, 0.3);
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(52, 300, 14, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
    c.strokeStyle = ink;
    c.lineCap = 'round';
    c.lineWidth = 30;
    c.beginPath();
    c.moveTo(1360, 430);
    c.bezierCurveTo(1200, 500, 1090, 640, 1040, 800);
    c.stroke();
    c.strokeStyle = withAlpha(env.mood.rim, 0.3);
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(1360, 415);
    c.bezierCurveTo(1194, 486, 1080, 626, 1026, 790);
    c.stroke();
  });
  // the image's one accent: the status light, ungraded, stepping off on the twos (≈ 0.6 s into the image)
  if (uq >= LED_ON - 1 / 12 / REWIND_STEP) {
    const k = uq >= LED_ON ? 1 : 0.4;
    const p = toScreen(LAYERS.L4, f.cam, STATUS_LED.x, STATUS_LED.y);
    const cy = MOODS.serverCyan;
    const c = f.c;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const HR = 78;
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, HR);
    g.addColorStop(0, withAlpha(cy.halo, 0.6 * k));
    g.addColorStop(0.18, withAlpha(cy.halo, 0.24 * k));
    g.addColorStop(0.5, withAlpha(cy.halo, 0.06 * k));
    g.addColorStop(1, withAlpha(cy.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - HR, p.y - HR, 2 * HR, 2 * HR);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = withAlpha(mixLab(cy.halo, cy.core, 0.6), k);
    c.beginPath();
    c.arc(p.x, p.y, 7, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

// =====================================================================================================
// 3 · SNOW — a white field under a winter sky; bare trees and a fence in ink; snow falling (backwards: rising)
// =====================================================================================================
const SNOW_MOOD: Palette = crossfadeMood('duskRose', 'winterBlue', 0.36);
const SNOW_CAMS: Camera3[] = [
  { x: 640, y: 360, z: 0, lens: 1 },
  { x: 640, y: 360, z: 60, lens: 1 },
];
/** flakes' speed multiplier: at 0.75 s per image the climb has to read in 18 frames */
const SNOW_FALL = 1.5;
let FENCE: Path2D | null = null;
function fenceGeo(x0: number, x1: number, y: number, depth: number) {
  if (FENCE) return FENCE;
  // the kit snowfield's receding fence (same curve), as its own path so it can be painted at true ink
  const P = new Path2D();
  const n = 16;
  const tops: [number, number][] = [];
  const bots: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const s = 1 / (1 + t * 6);
    const x = x0 + (x1 - x0) * (0.06 + 0.62 * (1 - s) + 0.04 * Math.sin(t * 3));
    const yb = y + depth * 0.95 * s;
    const ph = 70 * s;
    const pw = Math.max(1.2, 7 * s);
    P.rect(x - pw / 2, yb - ph, pw, ph + 4 * s);
    tops.push([x, yb - ph * 0.85]);
    bots.push([x, yb - ph * 0.45]);
  }
  for (const rail of [tops, bots]) {
    for (let i = 0; i < rail.length - 1; i++) {
      const [ax, ay] = rail[i];
      const [bx, by] = rail[i + 1];
      const th = Math.max(0.8, 2.8 / (1 + (i / (n - 1)) * 6));
      const p = new Path2D();
      p.moveTo(ax, ay);
      p.lineTo(bx, by);
      p.lineTo(bx, by + th);
      p.lineTo(ax, ay + th);
      p.closePath();
      P.addPath(p);
    }
  }
  FENCE = P;
  return P;
}
/** near flakes as streaks: the head leads, the tail trails behind it (dir -1: climbing, tail below) */
function flakeStreaks(c: C, tf: number, dir: -1 | 1, color: string) {
  const n = 150;
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = color;
  c.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const d = 0.5 + 0.5 * hash1(i, 7101);
    const x0 = -40 + 1360 * (0.5 + 0.5 * hash1(i, 7102));
    const y0 = 820 * (0.5 + 0.5 * hash1(i, 7103));
    const v = 120 * SNOW_FALL * (0.65 + 0.9 * d);
    const y = ((((y0 + v * tf) % 820) + 820) % 820) - 50;
    const x = x0 + 16 * Math.sin(tf * 0.9 + i * 1.7) * d;
    const len = (v / 24) * 2.4;
    const r = 1.0 + 2.2 * d * d;
    const tail = dir === -1 ? len : -len;
    c.globalAlpha = 0.28 + 0.3 * d;
    c.lineWidth = r * 1.2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y + tail);
    c.stroke();
    c.globalAlpha = 0.6 + 0.35 * d;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
function paintSnow(f: Frame, u: number, dir: -1 | 1) {
  f.setMood(SNOW_MOOD);
  f.camera({ x: 640, y: 360, z: lerp(0, 60, u), lens: 1 });
  f.backlight({ sunX: 820, sunY: 420, sunRadius: 760, intensity: 0.8 });
  // the flakes' own clock: forward time inside the image (played backwards, the snow rises)
  const tf = 8 + u * REWIND_STEP;
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, SNOW_CAMS, 40);
    bake(f, c, `nnh-rw-snow-L1-${env.mood.id}-${rk(r)}`, r, (cc) => {
      ridgeline(cc, { x0: r.x, x1: r.x + r.w, y: 470, amp: 120, seed: 9, scale: 300, ground: 300 }, env);
    });
  });
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, SNOW_CAMS, 40);
    bake(f, c, `nnh-rw-snow-L2-${env.mood.id}-${rk(r)}`, r, (cc) => {
      forestBand(cc, { x0: r.x, x1: r.x + r.w, y: 505, h: 120, kind: 'bare', density: 3, seed: 12, snow: 0.4, ground: 300 }, env);
    });
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    snow(c, { area: { x: -200, y: -120, w: 1680, h: 900 }, count: 520, fall: 110 * SNOW_FALL, wind: 12, gust: 0.4, size: 1.6, depthRange: [0, 0.55], salt: 3 }, { ...env, t: tf });
  });
  f.fog('B');
  const SF = { x0: 0, x1: 0, y: 560, depth: 260 };
  f.layer('L4', (c, env) => {
    const r = overscan(LAYERS.L4, SNOW_CAMS, 40);
    SF.x0 = r.x;
    SF.x1 = r.x + r.w;
    bake(f, c, `nnh-rw-snow2-L4-${env.mood.id}-${rk(r)}`, r, (cc) => {
      snowfield(cc, { x0: r.x, x1: r.x + r.w, y: 560, depth: 260, seed: 8, drifts: 6, fence: false }, env);
    });
  });
  gradeBack(f, GRADE.snow);
  // the hero: the oak, the birch and the fence at true ink
  f.layer('L4', (c, env0) => {
    const env: PaintEnv = { ...env0, fill: (role) => (role === 'ink' || role === 'fg' || role === 'set' ? env0.mood.ink : env0.fill(role)) };
    const r = overscan(LAYERS.L4, SNOW_CAMS, 40);
    bake(f, c, `nnh-rw-snow2-hero-${env0.mood.id}-${rk(r)}`, r, (cc) => {
      tree(cc, { x: 1040, y: 575, h: 300, kind: 'birch', seed: 5, snow: 0.3 }, env);
      tree(cc, { x: 250, y: 600, h: 430, kind: 'oak', seed: 21, snow: 0.35 }, env);
      cc.fillStyle = env0.mood.ink;
      cc.fill(fenceGeo(SF.x0, SF.x1, SF.y, SF.depth));
    });
  });
  f.rim({ x: 0.6, y: -0.3 });
  gradeHero(f);
  // the near band, over the graded frame: big soft flakes right in front of us, streaking as they climb
  f.layer('L5', (c) => {
    flakeStreaks(c, tf, dir, mixLab(ROSE.core, ROSE.rim, 0.35));
  });
}

// =====================================================================================================
// 4 · KNOB — a motorised potentiometer: knurled cap, shaft, bearing, motor; a row of identical units
//             receding soft. The hero unturns about 90°.
// =====================================================================================================
const KNOB_MOOD: Palette = crossfadeMood('duskRose', 'labGreen', 0.14);
const KNOB_CAMS: Camera3[] = [
  { x: 640, y: 360, z: 0, lens: 1 },
  { x: 630, y: 352, z: 70, lens: 1 },
];
/** forward: the pointer creeps from −45° to +45° (a motor's slow move); backwards it unturns */
const KNOB_A0 = (-45 * Math.PI) / 180;
const KNOB_A1 = (45 * Math.PI) / 180;
/** the axis's screen direction per unit of depth (the row recedes up and to the right) */
const AX = { x: 0.6, y: -0.2 };
/** front-face ellipse squash (3/4 view: the face reads nearly round) */
const SQ = 0.8;
interface KnobLook {
  ink: string;
  rim: string;
  /** how strong the cut-lines and rim edges are (0 for the soft units) */
  detail: number;
  /** the rail's top (the bearing bracket stands on it) */
  railY: number;
}
/**
 * One motorised potentiometer in 3/4 view, front face centred at (x, y), cap radius R, pointer angle a
 * (0 = up). Back to front: the motor can and its end bell, the drive shaft through a bearing bracket down to
 * the rail, the knob's flared skirt, the short knurled cap (ridges that travel round as it turns), the face
 * with its pointer notch.
 */
function drawKnob(c: C, x: number, y: number, R: number, a: number, L: KnobLook) {
  const P = (d: number) => ({ x: x + AX.x * d * R, y: y + AX.y * d * R });
  const ell = (q: { x: number; y: number }, r: number) => {
    c.beginPath();
    c.ellipse(q.x, q.y, r * SQ, r, 0, 0, Math.PI * 2);
  };
  /** the hull of two equal ellipses along the axis (a cylinder's silhouette) */
  const band = (d0: number, d1: number, r: number) => {
    const A = P(d0), B = P(d1);
    // the tangent points sit where the ellipse normal is perpendicular to the axis
    const th = Math.atan2(AX.y * SQ, AX.x);
    const nx = -Math.sin(th), ny = Math.cos(th);
    const tx = nx * r * SQ, ty = ny * r;
    c.beginPath();
    c.moveTo(A.x + tx, A.y + ty);
    c.lineTo(B.x + tx, B.y + ty);
    c.lineTo(B.x - tx, B.y - ty);
    c.lineTo(A.x - tx, A.y - ty);
    c.closePath();
    c.fill();
    ell(A, r);
    c.fill();
    ell(B, r);
    c.fill();
  };
  c.fillStyle = L.ink;
  // the motor can, its end bell, and the bearing bracket down to the rail
  band(1.35, 2.35, 0.5 * R);
  band(2.35, 2.55, 0.32 * R);
  const br = P(1.0);
  c.fillRect(br.x - 0.1 * R, br.y - 0.15 * R, 0.2 * R, L.railY - (br.y - 0.15 * R) + 2);
  c.fillRect(br.x - 0.22 * R, L.railY - 0.08 * R, 0.44 * R, 0.08 * R + 2);
  band(0.4, 1.35, 0.09 * R);
  // the flared skirt, then the knurled cap
  band(0.34, 0.42, 1.16 * R);
  band(0, 0.36, R);
  if (L.detail > 0) {
    // knurl ridges on the visible barrel: lines along the axis at angles that travel with the knob
    const n = 36;
    const A = P(0), B = P(0.34);
    c.lineWidth = Math.max(1, R * 0.014);
    for (let k = 0; k < n; k++) {
      const th = a + (k / n) * Math.PI * 2;
      const cx = Math.sin(th), cy = -Math.cos(th);
      const facing = cx * AX.x + cy * AX.y;
      if (facing < 0.02) continue;
      const light = 0.35 + 0.65 * Math.max(0, -cy);
      c.strokeStyle = withAlpha(L.rim, L.detail * 0.5 * light * Math.min(1, facing * 3));
      c.beginPath();
      c.moveTo(A.x + cx * R * SQ, A.y + cy * R);
      c.lineTo(B.x + cx * R * SQ, B.y + cy * R);
      c.stroke();
    }
    // the face's chamfer, lit along its top; an inner ring
    const F = P(0);
    c.strokeStyle = withAlpha(L.rim, L.detail * 0.8);
    c.lineWidth = Math.max(1.3, R * 0.02);
    c.beginPath();
    c.ellipse(F.x, F.y, R * SQ * 0.98, R * 0.98, 0, Math.PI * 1.02, Math.PI * 1.98);
    c.stroke();
    c.strokeStyle = withAlpha(L.rim, L.detail * 0.2);
    c.lineWidth = Math.max(1, R * 0.012);
    c.beginPath();
    c.ellipse(F.x, F.y, R * SQ * 0.8, R * 0.8, 0, 0, Math.PI * 2);
    c.stroke();
    // the skirt's lit lip, the motor can's top edge and its seam
    const S = P(0.42);
    c.strokeStyle = withAlpha(L.rim, L.detail * 0.5);
    c.lineWidth = Math.max(1.2, R * 0.016);
    c.beginPath();
    c.ellipse(S.x, S.y, 1.16 * R * SQ, 1.16 * R, 0, Math.PI * 1.1, Math.PI * 1.6);
    c.stroke();
    const M0 = P(1.35), M1 = P(2.35);
    c.strokeStyle = withAlpha(L.rim, L.detail * 0.4);
    c.beginPath();
    c.moveTo(M0.x, M0.y - 0.5 * R);
    c.lineTo(M1.x, M1.y - 0.5 * R);
    c.stroke();
    c.strokeStyle = withAlpha(L.rim, L.detail * 0.18);
    const M = P(1.85);
    c.beginPath();
    c.ellipse(M.x, M.y, 0.5 * R * SQ, 0.5 * R, 0, -Math.PI * 0.6, Math.PI * 0.4);
    c.stroke();
    // the pointer notch: a slot cut across the face from the centre to the rim, lit from behind
    const px = Math.sin(a), py = -Math.cos(a);
    c.strokeStyle = withAlpha(L.rim, L.detail);
    c.lineCap = 'round';
    c.lineWidth = Math.max(2.4, R * 0.07);
    c.beginPath();
    c.moveTo(F.x + px * R * SQ * 0.18, F.y + py * R * 0.18);
    c.lineTo(F.x + px * R * SQ * 0.98, F.y + py * R * 0.98);
    c.stroke();
    // the shaft's end (a small set-screw boss) at the face centre
    c.fillStyle = withAlpha(L.rim, L.detail * 0.45);
    c.beginPath();
    c.ellipse(F.x, F.y, R * 0.07 * SQ, R * 0.07, 0, 0, Math.PI * 2);
    c.fill();
  }
}
/** the row: a hero (L4) and identical units going back along the rail into the haze */
const KNOB_HERO = { x: 470, y: 380, R: 128 };
function paintKnob(f: Frame, u: number) {
  f.setMood(KNOB_MOOD);
  f.camera({ x: lerp(640, 620, u), y: lerp(360, 356, u), z: lerp(0, 70, u), lens: 1 });
  f.backlight({ sunX: 820, sunY: 300, sunRadius: 780, intensity: 0.95 });
  // L1: the far cabinets across the aisle, hazed to plain shapes (no dials: the knobs are the subject)
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, KNOB_CAMS, 40);
    bake(f, c, `nnh-rw-knob6-L1-${env.mood.id}-${rk(r)}`, r, (cc) => {
      cc.fillStyle = env.fill('set');
      for (const [x, w, h] of [[-120, 300, 560], [210, 180, 470], [1030, 220, 520], [1280, 300, 600]] as const) {
        cc.fillRect(x, 720 - h, w, h + 200);
        cc.fillRect(x - 8, 720 - h - 10, w + 16, 12);
      }
      cc.strokeStyle = withAlpha(env.mood.rim, 0.12);
      cc.lineWidth = 2;
      for (const [x, w] of [[-120, 300], [210, 180], [1030, 220], [1280, 300]] as const) {
        for (let y = 260; y < 720; y += 64) {
          cc.beginPath();
          cc.moveTo(x + 10, y);
          cc.lineTo(x + w - 10, y);
          cc.stroke();
        }
      }
    });
  });
  f.practical({ x: 820, y: -40, kind: 'tube', seed: 91, intensity: 0.45, radius: 60, layer: 'L2' });
  const unit = (c: C, env: PaintEnv, x: number, y: number, R: number, a: number, detail: number, railY: number) =>
    drawKnob(c, x, y, R, a, { ink: env.fill('ink'), rim: env.mood.rim, detail, railY });
  // the row going back: units 4 (L2), 3 (L2) and 2 (L3), identical, smaller, softer; each on its rail
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, KNOB_CAMS, 40);
    bake(f, c, `nnh-rw-knob6-L2-${env.mood.id}-${rk(r)}`, r, (cc) => {
      cc.fillStyle = env.fill('ink');
      cc.fillRect(880, 336, 900, 14);
      unit(cc, env, 1170, 248, 56, 0.9, 0.3, 336);
      unit(cc, env, 990, 276, 70, -0.2, 0.3, 336);
    });
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, KNOB_CAMS, 40);
    bake(f, c, `nnh-rw-knob6-L3-${env.mood.id}-${rk(r)}`, r, (cc) => {
      cc.fillStyle = env.fill('ink');
      cc.fillRect(640, 432, 900, 18);
      unit(cc, env, 770, 322, 94, 0.5, 0.4, 432);
    });
  });
  f.fog('B');
  gradeBack(f, GRADE.knob);
  // L4: the hero, turning about 90°; its rail at true ink
  const a = lerp(KNOB_A0, KNOB_A1, sm((u - 0.04) / 0.9));
  f.layer('L4', (c, env) => {
    const ink = env.mood.ink;
    const railY = KNOB_HERO.y + 1.45 * KNOB_HERO.R;
    c.fillStyle = ink;
    c.fillRect(-200, railY, 1000, 30);
    c.strokeStyle = withAlpha(env.mood.rim, 0.4);
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-200, railY + 0.5);
    c.lineTo(800, railY + 0.5);
    c.stroke();
    drawKnob(c, KNOB_HERO.x, KNOB_HERO.y, KNOB_HERO.R, a, { ink, rim: env.mood.rim, detail: 1, railY });
  });
  f.rim({ x: 0.3, y: -1 });
  // a raking work-light finds the one knob that moves
  f.practical({ x: KNOB_HERO.x + 30, y: KNOB_HERO.y - 190, kind: 'lamp', seed: 92, intensity: 0.3, radius: 110 });
  // L5: a cable loom crossing low, soft
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, KNOB_CAMS, 60);
    bake(f, c, `nnh-rw-knob6-L5-${env.mood.id}-${rk(r)}`, r, (cc) => {
      cc.strokeStyle = env.mood.ink;
      cc.lineCap = 'round';
      for (const [w, dy] of [[28, 0], [16, 34]] as const) {
        cc.lineWidth = w;
        cc.beginPath();
        cc.moveTo(-200, 820 + dy);
        cc.bezierCurveTo(200, 700 + dy, 700, 740 + dy, 1460, 690 + dy);
        cc.stroke();
      }
    });
  });
  gradeHero(f);
}

// =====================================================================================================
// 5 · WICK — a paper lantern over the Chicago night; its wick catches (backwards: glow → ember → nothing)
// =====================================================================================================
const WICK_MOOD: Palette = crossfadeMood('duskRose', CHI_NIGHT, 0.5);
const WICK_CAMS: Camera3[] = [
  { x: 640, y: 340, z: 30, lens: 1 },
  { x: 640, y: 340, z: 110, lens: 1 },
];
const LANT = { x: 640, y: 300, r: 66 };
/** forward: an ember glows from u ≈ .17, the flame takes at .46 and the lantern is full by .8. Played backwards
 *  the glow shrinks into the ember at ≈ 3.9 s, the ember holds (flickering on the twos) and is out at ≈ 4.12 s */
export function wickAct(u: number) {
  return sm((u - 0.46) / 0.34);
}
export function wickEmber(u: number) {
  return u >= 0.18 ? 1 : u >= 0.15 ? 0.45 : 0;
}
function paintWick(f: Frame, u: number, uq: number) {
  f.setMood(WICK_MOOD);
  const act = wickAct(u);
  const ember = wickEmber(uq);
  f.camera({ x: 640, y: 340, z: lerp(30, 110, u), lens: 1 });
  f.backlight({ sunX: 760, sunY: 470, sunRadius: 820, intensity: 0.7 });
  // behind the lantern, the very city the Rewind lands on (flat-topped blocks, roof tanks, the El)
  chiBackdrop(f, { cams: WICK_CAMS, key: 'wick', night: 0.5, bake: true });
  f.fog('B');
  gradeBack(f, GRADE.wick);
  const wy = LANT.y + LANT.r * 0.38;
  f.layer('L4', (c, env0) => {
    const env: PaintEnv = { ...env0, fill: (role) => (role === 'ink' ? env0.mood.ink : env0.fill(role)) };
    paperLantern(c, { x: LANT.x, y: LANT.y, r: LANT.r, act, hang: 520, tassel: true, halo: 1.3 }, env);
    if (act > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const R = 10 + 26 * act;
      const g = c.createRadialGradient(LANT.x, wy, 0, LANT.x, wy, R);
      g.addColorStop(0, withAlpha(env.mood.core, 0.95 * act));
      g.addColorStop(0.35, withAlpha(env.mood.halo, 0.6 * act));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(LANT.x - R, wy - R, 2 * R, 2 * R);
      c.restore();
    }
  });
  f.rim({ x: 0, y: 1 });
  if (act > 0.02) f.practical({ x: LANT.x, y: wy, kind: 'candle', seed: 33, intensity: 0.7 * act, radius: 46 });
  gradeHero(f);
  // the ember: a core-only point (≈3 px) seen through the paper, flickering on the twos, after the glow has gone
  const e = ember * (1 - sm(act / 0.25));
  if (e > 0.01) {
    const p = toScreen(LAYERS.L4, f.cam, LANT.x, wy);
    const fl = 0.8 + 0.2 * (0.5 + 0.5 * hash1(Math.floor(uq * REWIND_STEP * 12 + 0.5), 433));
    const c = f.c;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14);
    g.addColorStop(0, withAlpha(f.mood.halo, 0.35 * e * fl));
    g.addColorStop(1, withAlpha(f.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - 14, p.y - 14, 28, 28);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = withAlpha(f.mood.core, 0.6 * e * fl);
    c.beginPath();
    c.arc(p.x, p.y, 1.75, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

// =====================================================================================================
// the reel's grade: one rose cast, one vignette, one luminance range for all five images
// =====================================================================================================
interface Grade {
  /** highlight cap (multiply; 1 = none) */
  mul: number;
  /** shadow lift (screen with dark rose; 0 = none) */
  lift: number;
}
const GRADE: Record<RewindImage, Grade> = {
  goStone: { mul: 0.95, lift: 0.4 },
  fans: { mul: 0.97, lift: 0.12 },
  snow: { mul: 0.7, lift: 0.5 },
  knob: { mul: 0.9, lift: 0.45 },
  wick: { mul: 0.92, lift: 0.35 },
};
const ROSE = MOODS.duskRose;
const GRADE_TINT = mixLab(ROSE.sky[2], ROSE.rim, 0.25);
const GRADE_LIFT = mixLab(ROSE.ink, ROSE.sky[1], 0.55);
const GRADE_VIG = mixLab(ROSE.ink, ROSE.sky[0], 0.3);
const greyHex = (v: number) => {
  const h = Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
};
/** the tape grade on the BACK plates (before the hero is painted): chroma, cast, highlight cap, shadow lift */
export function gradeBack(f: Frame, g: Grade) {
  const c = f.c;
  c.save();
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = withAlpha('#808080', 0.5);
  c.fillRect(0, 0, 1280, 720);
  c.globalCompositeOperation = 'color';
  c.fillStyle = withAlpha(GRADE_TINT, 0.42);
  c.fillRect(0, 0, 1280, 720);
  if (g.mul < 1) {
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = greyHex(g.mul);
    c.fillRect(0, 0, 1280, 720);
  }
  if (g.lift > 0) {
    c.globalCompositeOperation = 'screen';
    c.fillStyle = withAlpha(GRADE_LIFT, g.lift);
    c.fillRect(0, 0, 1280, 720);
  }
  c.restore();
}
/** over the finished image (hero included): the cast only (luminance kept, so the ink stays black), the vignette */
export function gradeHero(f: Frame) {
  const c = f.c;
  c.save();
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'color';
  c.fillStyle = withAlpha(GRADE_TINT, 0.3);
  c.fillRect(0, 0, 1280, 720);
  c.globalCompositeOperation = 'source-over';
  const v = c.createRadialGradient(640, 380, 260, 640, 380, 860);
  v.addColorStop(0, withAlpha(GRADE_VIG, 0));
  v.addColorStop(0.6, withAlpha(GRADE_VIG, 0.2));
  v.addColorStop(1, withAlpha(GRADE_VIG, 0.55));
  c.fillStyle = v;
  c.fillRect(0, 0, 1280, 720);
  c.restore();
}
// =====================================================================================================
// the stretched-tape look (screen-space, over the composed frame)
// =====================================================================================================
/**
 * amt 0..1: torn horizontal bands (copies of the frame shifted sideways, re-seeded every frame), a soft
 * tracking band rolling up (dir -1: rewind) or down (dir +1: fast-forward), and a head-switch fringe at the
 * very bottom edge. No colour fringing (bible §10.11).
 */
export function tapeShudder(f: Frame, amt: number, seed: number, dir: -1 | 1 = -1) {
  if (amt <= 0.01) return;
  const c = f.c;
  const cv = c.canvas as HTMLCanvasElement;
  const W = cv.width;
  const H = cv.height;
  const k = W / 1280;
  const fr = f.frame;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  const n = 1 + Math.round(amt * 5);
  for (let i = 0; i < n; i++) {
    const r1 = 0.5 + 0.5 * hash1(fr * 11 + i, seed);
    const r2 = 0.5 + 0.5 * hash1(fr * 11 + i, seed + 1);
    const r3 = hash1(fr * 11 + i, seed + 2);
    const y = Math.floor(r1 * H * 0.96);
    const h = Math.max(2, Math.floor((3 + r2 * 34 * amt) * k));
    const dx = Math.round(r3 * (6 + 26 * amt) * k);
    if (dx !== 0) c.drawImage(cv, 0, y, W, h, dx, y, W, h);
  }
  // the tracking band
  const ph = (((f.t * 1.35 * -dir) % 1) + 1) % 1;
  const yb = ph * (H + 120 * k) - 60 * k;
  const g = c.createLinearGradient(0, yb - 46 * k, 0, yb + 46 * k);
  const col = f.mood.rim;
  g.addColorStop(0, withAlpha(col, 0));
  g.addColorStop(0.5, withAlpha(col, 0.07 * amt));
  g.addColorStop(1, withAlpha(col, 0));
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g;
  c.fillRect(0, yb - 46 * k, W, 92 * k);
  // a broken hairline of noise through the band
  c.fillStyle = withAlpha(col, 0.22 * amt);
  for (let x = 0; x < W; ) {
    const w = (8 + 60 * (0.5 + 0.5 * hash1(fr * 97 + x, seed + 5))) * k;
    if (hash1(fr * 31 + x, seed + 6) > 0.1) c.fillRect(x, yb + hash1(x, fr) * 3 * k, w, 1.2 * k);
    x += w + 10 * k;
  }
  // head-switch fringe on the bottom edge
  c.globalCompositeOperation = 'source-over';
  const hb = Math.round(7 * k);
  c.drawImage(cv, 0, H - hb, W, hb, Math.round((10 + 14 * amt) * k), H - hb, W, hb);
  c.restore();
}
