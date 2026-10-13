/**
 * ch15-s03 — the detective's microscope: inside a simplified copy of the model, a lantern-forest of features;
 * RABBIT lights before a single slug of the line is set, and snuffing it changes the rhyme to HABIT.
 * (candleAmber, the study's own lamp; 12.21 s; in: crossfade from the hall.)
 *
 * CAMERA: a desk insert from the side (STUDY LOCK: the detective's own instrument under the green-shaded lamp), a
 * slow push toward the specimen. Only about a quarter of the frame is sharp (a feathered focus disc round the lens's
 * field); the rest is soft, honest about the limits of the tool.
 *   b1 (0.6)    the two steady hands turn the focus knob once and withdraw; the field sharpens as it turns; MARCH 2025
 *   'looked'    the label: whose model, which tool
 *   — the couplet's first line stands set in type: He saw a carrot and had to grab it, (from the paper's example);
 *     the second line is an empty row of slots
 *   'rabbit'    one lantern deep in the forest lights gold; RABBIT glows faintly at the far end of the empty line,
 *               a thread of light between them, before a single slug of the line is set
 *   b3          a small paper snuffer drops over that lantern by itself; a neighbour lights; the ghost word becomes
 *               HABIT; the line's slugs fill in from left to right toward it (blank sorts: the words are not shown);
 *               the label: rabbit → (suppressed) → habit
 *   'plan'      hold on the finished line under the microscope
 * The lanterns are feature-nodes (glow ← activation, illustrative); the binding that matters is causal: the lit
 * feature names the line's last word before the line exists, and suppressing it changes the word.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import {
  LAYERS, PUPPET_NEAR_BLACK, bankersLamp, defineShot, drawSlug, glow, makeCanvas, mixLab, overscan,
  paperLantern, slugWidth, toScreen, typeSlugs, withAlpha,
} from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { FONT } from '../../../film/silhouette/type';
import { hands } from '../cast';
import { handsEntry } from '../sets/narratorHands';
import { clamp01, label15, lerp, monoDate, screen, sm, tq12, win } from '../sets/ch15-s01-kit';

const ID = 'ch15-s03';
type C = CanvasRenderingContext2D;

// ===================================================================================================== staging (L4)
const DESK_Y = 560;
const PLATE = { x0: 300, x1: 960, y: 452 };
/** the microscope stands at the right, facing left: tube from the eyepiece (upper right) down to the nosepiece */
const MS = { base: 1040, eye: { x: 1160, y: 70 }, nose: { x: 884, y: 384 }, knob: { x: 1062, y: 292 }, stageY: 452 };
/** the composing stick on its stand, upper left */
const STICK = { x: 240, y1: 150, y2: 228, size: 27 };
const LINE1 = ['He', ' saw', ' a', ' carrot', ' and', ' had', ' to', ' grab', ' it', ','];
const N_BLANK = 6;
/** the focus field (L4 world): centred under the lens, round the forest's heart and the end of the empty line;
 *  radii in screen px at the pushed-in framing (about a quarter of the frame) */
const FOCUS = [
  { x: 650, y: 372, rx: 350, ry: 112 },
  { x: 580, y: 202, rx: 380, ry: 52 },
  // the focus knob, sharp only while the hands turn it
  { x: 1050, y: 300, rx: 120, ry: 90, knob: true },
];
/** the study wall behind the desk (deeper and softer than the shared L2: only the specimen plane is sharp) */
const WALL_SOFT: LayerSpec = { id: 'L2', z: LAYERS.L2.z, haze: 0.2, blur: 4.5 };
/** a camera that puts L4 point p at screen point s with L4 scale k (dolly only) */
function frameL4(p: { x: number; y: number }, s: { x: number; y: number }, k: number): Camera3 {
  const z = 1000 - 1000 / k;
  return { x: 640 + (640 + (p.x - 640) * k - s.x) / k, y: 360 + (360 + (p.y - 360) * k - s.y) / k, z, lens: 1 };
}

/** the lantern forest: three ranks of small paper lanterns on wire stems standing on the specimen plate */
interface Lan { x: number; y: number; r: number; base: number; rank: number; seed: number }
const FOREST: Lan[] = (() => {
  const out: Lan[] = [];
  let seed = 1;
  for (let rank = 2; rank >= 0; rank--) {
    const n = rank === 0 ? 9 : rank === 1 ? 10 : 11;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const x = lerp(PLATE.x0 + 30, PLATE.x1 - 40, u) + hash1(seed, 3) * 16 + rank * 9;
      const h = 44 + rank * 26 + (0.5 + 0.5 * hash1(seed, 4)) * 64;
      const r = 11.5 - rank * 2.4 + hash1(seed, 5) * 1.2;
      out.push({ x, y: PLATE.y - 4 - rank * 5 - h, r, base: PLATE.y - 4 - rank * 5, rank, seed: seed++ });
    }
  }
  return out;
})();
/** the rabbit feature: a lantern deep in the forest, under the lens; the habit feature beside it */
/** the network's threads: each lantern wired to its two nearest lanterns in the rank in front of it */
const THREADS: [Lan, Lan][] = (() => {
  const out: [Lan, Lan][] = [];
  for (const a of FOREST) {
    if (a.rank === 0) continue;
    const next = FOREST.filter((l) => l.rank === a.rank - 1).sort((p, q) => Math.abs(p.x - a.x) - Math.abs(q.x - a.x));
    out.push([a, next[0]], [a, next[1]]);
    if (hash1(a.seed, 21) > 0.2) out.push([a, next[2]]);
  }
  return out;
})();
const RABBIT = FOREST.reduce((best, l) => (l.rank === 1 && Math.abs(l.x - 836) < Math.abs(best.x - 836) ? l : best), FOREST[0]);
const HABIT = FOREST.filter((l) => l.rank === 1 && l !== RABBIT).reduce((best, l) => (Math.abs(l.x - (RABBIT.x - 72)) < Math.abs(best.x - (RABBIT.x - 72)) ? l : best));

interface B {
  D: number;
  knob: number;
  who: number;
  rabbit: number;
  snuff: number;
  habit: number;
  fill0: number;
  set: number;
  plan: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
  [k: string]: unknown;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      knob: T.beat('b1'),
      who: T.beat('who'),
      rabbit: T.beat('b2') - 0.12,
      snuff: T.beat('b3'),
      habit: T.beat('b3') + 0.42,
      fill0: T.beat('b3') + 0.75,
      set: T.beat('b4') + 0.2,
      plan: T.beat('b4'),
    };
    // the knob framing (the hand's turn reads inside the frame), then on 'Asked' an ease in to ~1.5x on the
    // specimen (the couplet across the top, the microscope's tube framing the top-right) landing on 'rabbit'
    const C0: Camera3 = { x: 712, y: 352, z: 0, lens: 1 };
    const C1: Camera3 = frameL4({ x: 676, y: 334 }, { x: 640, y: 360 }, 1.5);
    const C2: Camera3 = frameL4({ x: 684, y: 332 }, { x: 640, y: 360 }, 1.56);
    const asked = T.word('L1504', 'Asked');
    const cam = (t: number): Camera3 => {
      const u = sm((t - (asked - 0.15)) / (b.rabbit + 0.15 - (asked - 0.15)));
      const v = sm((t - (b.rabbit + 0.2)) / (D - b.rabbit - 0.2));
      const lz = (a: Camera3, q: Camera3, w: number): Camera3 => ({ x: lerp(a.x, q.x, w), y: lerp(a.y, q.y, w), z: lerp(a.z, q.z, w), lens: 1 });
      return v > 0 ? lz(C1, C2, v) : lz(C0, C1, u);
    };
    tl.hold(0, D);
    return { tl, b, cam, CAMS: [C0, C1, C2] };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);
    const tq = tq12(t);
    // the knob turn: the hands reach in (0–.35), grip and turn (.35–.65), withdraw (.65–1)
    const hu = clamp01((tq - b.knob + 0.1) / 1.7);
    const focusK = sm((tq - (b.knob + 0.55)) / 0.7);
    const rabbitOn = win(t, b.rabbit, b.rabbit + 0.35);
    const snuffU = clamp01((tq - b.snuff) / 0.34);
    const rabbitK = rabbitOn * (1 - 0.92 * sm(clamp01((tq - b.snuff - 0.25) / 0.3)));
    const habitK = win(t, b.habit, b.habit + 0.4);
    f.backlight({ sunX: 230, sunY: 420, sunRadius: 520, intensity: 0.4 });

    // L2: the study's own panelled wall behind the desk (STUDY LOCK: the same plain warm panelling and the lamp's
    // pool as the board wall in ch15-s04 / s06), well out of focus
    f.layer(WALL_SOFT, (c, env) => {
      const r = overscan(LAYERS.L2, sc.CAMS, 80);
      f.cached(`${ID}/L2s/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        const m = env.mood;
        const wall = mixLab(env.fill('set'), m.fg, 0.25);
        cc.fillStyle = wall;
        cc.fillRect(r.x, r.y, r.w, r.h);
        const g = cc.createRadialGradient(170, 470, 40, 170, 470, 1000);
        g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.25), 0.85));
        g.addColorStop(0.5, withAlpha(mixLab(m.set, m.halo, 0.12), 0.45));
        g.addColorStop(1, withAlpha(wall, 0));
        cc.fillStyle = g;
        cc.fillRect(r.x, r.y, r.w, r.h);
        // the panelling: tall raised fields between stiles (cut-lines), a dado rail, a picture rail
        cc.strokeStyle = withAlpha(m.rim, 0.1);
        cc.lineWidth = 1.4;
        for (let x = Math.floor(r.x / 240) * 240; x < r.x + r.w; x += 240) {
          cc.strokeRect(x + 14, 40, 212, 300);
          cc.strokeRect(x + 14, 380, 212, 150);
        }
        cc.fillStyle = withAlpha(m.fg, 0.6);
        cc.fillRect(r.x, 8, r.w, 10);
        cc.fillRect(r.x, 356, r.w, 9);
      })(c, r.x, r.y);
    });
    f.fog({ yCenter: 0.55 * 720, height: 0.45 * 720, alpha: 0.12, drift: 5 });

    // the green-shaded banker's lamp stands near the camera at lower left (L5, soft); its light rakes the specimen
    const L = { x: 104, y: 742, s: 3.6 };
    const bulb = bankersLamp.anchors({ x: L.x, y: L.y, s: L.s }).bulb;
    f.practical({ x: bulb.x, y: bulb.y + 6, kind: 'lamp', seed: 41, intensity: 0.8, radius: 80, layer: 'L5' });
    f.fog('B');

    // L4: the desk top, the specimen plate and its forest, the composing stick, the microscope
    f.layer('L4', (c, env) => {
      const m = env.mood;
      // the desk: a lit sliver of top, the dark front below (the label's plate)
      const r = overscan(LAYERS.L4, sc.CAMS, 40);
      c.fillStyle = mixLab(env.fill('set'), m.fg, 0.3);
      c.fillRect(r.x, DESK_Y, r.w, r.y + r.h - DESK_Y);
      const dg = c.createLinearGradient(0, DESK_Y, 0, DESK_Y + 36);
      dg.addColorStop(0, mixLab(m.setHaze, m.halo, 0.35));
      dg.addColorStop(1, mixLab(env.fill('set'), m.fg, 0.3));
      c.fillStyle = dg;
      c.fillRect(r.x, DESK_Y, r.w, 36);
      c.fillStyle = mixLab(m.fg, m.ink, 0.4);
      c.fillRect(r.x, DESK_Y + 36, r.w, r.y + r.h - DESK_Y - 36);
      c.fillStyle = withAlpha(m.rim, 0.35);
      c.fillRect(r.x, DESK_Y + 36, r.w, 1.2);
      // the plate on its riser and the microscope stage
      c.fillStyle = env.fill('ink');
      c.fillRect(PLATE.x0 + 10, PLATE.y + 6, 26, DESK_Y - PLATE.y - 6);
      c.fillStyle = withAlpha(mixLab(m.rim, m.haze, 0.4), 0.55);
      c.fillRect(PLATE.x0, PLATE.y, PLATE.x1 - PLATE.x0, 5);
      c.fillStyle = withAlpha(m.core, 0.4);
      c.fillRect(PLATE.x0, PLATE.y, PLATE.x1 - PLATE.x0, 1);
      // the forest
      drawForest(c, env, t, rabbitK, habitK);
      // the snuffer: a small paper bell on a wire, dropping over the rabbit lantern by itself
      if (snuffU > 0) {
        const fall = sm(snuffU);
        const sy = lerp(RABBIT.y - 120, RABBIT.y - RABBIT.r * 1.4, fall * fall);
        c.fillStyle = env.fill('ink');
        c.beginPath();
        c.moveTo(RABBIT.x - RABBIT.r * 2.1, sy + RABBIT.r * 3.2);
        c.quadraticCurveTo(RABBIT.x - RABBIT.r * 1.8, sy, RABBIT.x, sy - 2);
        c.quadraticCurveTo(RABBIT.x + RABBIT.r * 1.8, sy, RABBIT.x + RABBIT.r * 2.1, sy + RABBIT.r * 3.2);
        c.closePath();
        c.fill();
        c.fillRect(RABBIT.x - 0.8, sy - 30, 1.6, 30);
        c.fillStyle = withAlpha(m.rim, 0.5);
        c.fillRect(RABBIT.x - RABBIT.r * 2.1, sy + RABBIT.r * 3.2 - 1, RABBIT.r * 4.2, 1);
        // a thread of smoke after it settles
        const sk = win(t, b.snuff + 0.4, b.snuff + 0.8) * (1 - win(t, b.snuff + 1.6, b.snuff + 3));
        if (sk > 0.01) {
          c.strokeStyle = withAlpha(m.rim, 0.25 * sk);
          c.lineWidth = 1;
          c.beginPath();
          for (let i = 0; i <= 16; i++) {
            const yy = sy - 32 - i * 4;
            const xx = RABBIT.x + Math.sin(i * 0.5 + t * 2.1) * (1 + i * 0.3);
            if (i === 0) c.moveTo(xx, yy);
            else c.lineTo(xx, yy);
          }
          c.stroke();
        }
      }
      // the composing stick and its stand
      drawCouplet(c, env, t, b, rabbitK, habitK);
      // the microscope (side view, facing left), brass in silhouette
      drawMicroscope(c, env, tq, hu);
      // the hands: in from the lamp side, grip the coarse-focus knob, turn it once, withdraw
      if (hu > 0 && hu < 1) {
        const E = handsEntry(cam, 'L4');
        const knob = { x: MS.knob.x + 4, y: MS.knob.y + 6 };
        const out = { x: lerp(E.R.x, knob.x, 0.25), y: lerp(E.R.y, knob.y, 0.25) };
        let at = knob;
        let shape: 'grip' | 'open' | 'rest' = 'grip';
        if (hu < 0.35) {
          at = { x: lerp(out.x, knob.x, sm(hu / 0.35)), y: lerp(out.y, knob.y, sm(hu / 0.35)) };
          shape = 'open';
        } else if (hu > 0.65) {
          at = { x: lerp(knob.x, out.x, sm((hu - 0.65) / 0.35)), y: lerp(knob.y, out.y, sm((hu - 0.65) / 0.35)) };
          shape = 'rest';
        }
        const twist = hu > 0.35 && hu < 0.65 ? Math.sin(((hu - 0.35) / 0.3) * Math.PI) * 0.28 : 0;
        const arm = hands.reach(E.R, at, shape, 118, { bend: -0.15 - twist });
        hands.draw(c, { right: arm, scale: 1 }, env);
      }
    });
    f.rim({ x: -0.7, y: -0.6 });
    // the lit features as practicals (light wraps the stems)
    const rl = rabbitK;
    if (rl > 0.02) f.practical({ x: RABBIT.x, y: RABBIT.y, kind: 'candle', seed: 1503, intensity: 0.9 * rl, radius: 42 });
    if (habitK > 0.02) f.practical({ x: HABIT.x, y: HABIT.y, kind: 'candle', seed: 1504, intensity: 0.9 * habitK, radius: 42 });

    // L5: the near edge of an open notebook and the banker's lamp, lower left, out of focus
    f.layer('L5', (c, env) => {
      bankersLamp(c, { x: L.x, y: L.y, s: L.s, lit: true, seed: 41 }, env);
      c.fillStyle = env.fill('fg');
      c.beginPath();
      c.moveTo(-200, 760);
      c.lineTo(-200, 640);
      c.quadraticCurveTo(80, 612, 330, 640);
      c.lineTo(360, 760);
      c.closePath();
      c.fill();
      c.fillStyle = withAlpha(env.mood.rim, 0.16);
      c.fillRect(-200, 640, 520, 1.5);
    });

    // the limits of the tool: everything outside the field falls soft (stronger before the knob is turned)
    focusField(f, cam, 3.6 + 3.0 * (1 - focusK), 0.6 + 0.4 * focusK, 1 - win(t, b.knob + 1.6, b.knob + 2.2));

    screen(f, (c) => {
      const te = { t, mood: f.mood };
      // the date leaves before the study label sets in (never two text items on one row)
      monoDate(c, 'MARCH 2025', 0.15, b.who - 0.55, te);
      label15(c, { text: 'Anthropic, on Claude 3.5 Haiku · via a simplified replacement model', x: 640, y: 598, at: b.who, until: b.rabbit - 0.4, size: 19 }, te);
      label15(c, { text: 'rabbit → (suppressed) → habit', x: 640, y: 598, at: b.snuff + 0.2, size: 22 }, te);
    });
  },
});

// ===================================================================================================== the forest
function drawForest(c: C, env: PaintEnv, t: number, rabbitK: number, habitK: number) {
  const m = env.mood;
  const tq = tq12(t);
  // the network's threads (paper wires between the ranks): what makes the forest read as a network
  c.save();
  c.lineWidth = 1;
  for (const [a, q] of THREADS) {
    const hot = (a === RABBIT || q === RABBIT ? rabbitK : 0) + (a === HABIT || q === HABIT ? habitK : 0);
    c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, Math.min(1, hot)), 0.35 + 0.35 * Math.min(1, hot));
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.quadraticCurveTo((a.x + q.x) / 2, Math.max(a.y, q.y) + 14, q.x, q.y);
    c.stroke();
  }
  c.restore();
  for (const l of FOREST) {
    const hz = l.rank * 0.22;
    // the wire stem
    c.strokeStyle = mixLab(env.fill('ink'), m.haze, hz);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(l.x, l.base);
    c.quadraticCurveTo(l.x + hash1(l.seed, 8) * 6, (l.base + l.y) / 2, l.x, l.y + l.r * 1.2);
    c.stroke();
    // activation: a low seeded shimmer (illustrative), the two named features driven by the beats
    let act = 0.16 + 0.22 * (0.5 + 0.5 * Math.sin(tq * (0.6 + 0.3 * hash1(l.seed, 9)) + l.seed));
    if (l === RABBIT) act = Math.max(act * (1 - rabbitK), rabbitK);
    if (l === HABIT) act = Math.max(act, habitK);
    paperLantern(c, { x: l.x, y: l.y, r: l.r, act: act * (1 - hz * 0.6), alpha: 1 - hz * 0.35, halo: l === RABBIT || l === HABIT ? 1 : 0.35 }, env);
  }
}

// ===================================================================================================== the couplet
function drawCouplet(c: C, env: PaintEnv, t: number, b: B, rabbitK: number, habitK: number) {
  const m = env.mood;
  const S = STICK.size;
  // the stand: a brass rod from the desk and a clamp holding the stick
  c.fillStyle = env.fill('ink');
  c.fillRect(STICK.x - 34, STICK.y1 - 30, 5, DESK_Y - STICK.y1 + 30);
  c.fillRect(STICK.x - 60, DESK_Y - 8, 56, 8);
  c.fillRect(STICK.x - 40, STICK.y1 - 34, 24, 10);
  c.fillRect(STICK.x - 40, STICK.y2 - 6, 24, 10);
  // line 1, set (the paper's example line)
  const lay = typeSlugs(c, { x: STICK.x, y: STICK.y1, tokens: LINE1, size: S, reveal: 1 }, env);
  // line 2: an empty row of slots, the ghost word at the far end, blank sorts filling toward it
  const h = S * 1.9;
  const x0 = STICK.x + 14;
  const blankW = (lay.x1 - lay.x0 - 120) / N_BLANK;
  const ghostX = x0 + N_BLANK * blankW + 6;
  const ghostW = Math.max(slugWidth(c, ' rabbit', S), slugWidth(c, ' habit', S));
  const stickEnd = Math.max(lay.x1, ghostX + ghostW + 18);
  c.fillStyle = env.fill('ink');
  c.fillRect(STICK.x, STICK.y2, stickEnd - STICK.x, 10);
  c.fillRect(STICK.x, STICK.y2 - h - 6, 12, h + 16);
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(STICK.x + 12, STICK.y2, stickEnd - STICK.x - 12, 1.2);
  // empty slot outlines
  c.strokeStyle = withAlpha(m.rim, 0.14);
  c.lineWidth = 1;
  for (let i = 0; i < N_BLANK; i++) c.strokeRect(x0 + i * blankW + 1, STICK.y2 - h + 2, blankW - 3, h - 3);
  c.strokeRect(ghostX, STICK.y2 - h + 2, ghostW, h - 3);
  // the blank sorts (spacing material: the line's words are not shown) drop in left to right
  const tq = tq12(t);
  for (let i = 0; i < N_BLANK; i++) {
    const a = sm(clamp01((tq - b.fill0 - i * 0.14) / 0.2));
    if (a <= 0) continue;
    c.save();
    c.globalAlpha *= Math.min(1, a * 1.5);
    const sx = x0 + i * blankW + 1, sy = STICK.y2 - h + (1 - a) * -30;
    drawSlug(c, sx, sy, blankW - 3, h, '', S, 0.5, env);
    glyphTexture(c, sx, sy, blankW - 3, h, S, 40 + i, env);
    c.restore();
  }
  // the ghost word: RABBIT (lit by the feature), then HABIT; then the real sort is set
  const setU = sm(clamp01((tq - b.set) / 0.25));
  const gx = ghostX + ghostW / 2, gy = STICK.y2 - h / 2;
  const ghostA = (rabbitK > 0 ? Math.max(rabbitK, 0) : 0) * (1 - habitK);
  const word = (txt: string, a: number) => {
    if (a <= 0.01) return;
    c.save();
    c.globalAlpha *= a;
    glow(c, gx, gy, 60, m.halo, 0.25 * a);
    c.font = `500 ${S * 1.05}px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = withAlpha(mixLab(m.core, '#ffffff', 0.2), 0.8);
    c.fillText(txt, gx, gy + 1);
    c.restore();
  };
  word('rabbit', 0.85 * (rabbitK > 0.001 ? Math.max(ghostA, 0) : 0) * (1 - 0.8 * win(t, b.snuff + 0.2, b.habit)));
  word('habit', 0.85 * habitK * (1 - setU));
  if (setU > 0) {
    c.save();
    c.globalAlpha *= Math.min(1, setU * 1.4);
    drawSlug(c, ghostX, STICK.y2 - h + (1 - setU) * -34, ghostW, h, ' habit', S, 0.6, env);
    c.restore();
  }
  // a thread of light from the lit feature up to the word it names (before the line exists)
  const th = Math.max(rabbitK * (1 - win(t, b.snuff + 0.1, b.snuff + 0.4)), habitK * (1 - 0.6 * setU));
  if (th > 0.02) {
    const src = rabbitK > habitK ? RABBIT : HABIT;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(m.halo, 0.45 * th);
    c.lineWidth = 1.4;
    c.setLineDash([3, 5]);
    c.beginPath();
    c.moveTo(src.x, src.y - src.r * 1.3);
    c.quadraticCurveTo((src.x + gx) / 2 + 30, (src.y + gy) / 2, gx, gy + h / 2 + 2);
    c.stroke();
    c.restore();
  }
}

/** the set line's faces: lit lead with a faint mirrored glyph texture (not legible: the second line is not
 *  script text), so the line reads as written, not redacted */
function glyphTexture(c: C, x: number, y: number, w: number, h: number, S: number, seed: number, env: PaintEnv) {
  const m = env.mood;
  c.save();
  c.beginPath();
  c.rect(x + 3, y + 2, w - 6, h * 0.62);
  c.clip();
  // the lit face of the type
  c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), 0.22);
  c.fillRect(x + 2, y + 2, w - 4, h * 0.62);
  // greeked type: the line's words as soft runs of x-height with a few ascenders, never letterforms
  c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.4), 0.42);
  const xh = S * 0.3;
  const by = y + h * 0.36 + S * 0.12;
  let gx = x + 8;
  let k = 0;
  while (gx < x + w - 12) {
    const ww = Math.min(x + w - 10 - gx, S * (0.9 + 1.6 * (0.5 + 0.5 * hash1(seed * 17 + k, 2))));
    if (ww < S * 0.4) break;
    c.beginPath();
    c.roundRect(gx, by - xh, ww, xh, xh * 0.45);
    c.fill();
    for (let j = 0; j < 2; j++) {
      if (hash1(seed * 17 + k, 5 + j) > 0.1) continue;
      const ax = gx + ww * (0.2 + 0.6 * (0.5 + 0.5 * hash1(seed * 17 + k, 9 + j)));
      c.fillRect(ax, by - xh * 1.9, 1.6, xh);
    }
    gx += ww + S * 0.42;
    k++;
  }
  c.restore();
}

// ===================================================================================================== microscope
function drawMicroscope(c: C, env: PaintEnv, tq: number, hu: number) {
  const m = env.mood;
  const ink = PUPPET_NEAR_BLACK;
  const brass = withAlpha(mixLab(m.rim, m.halo, 0.5), 0.6);
  c.fillStyle = ink;
  // the horseshoe foot and pillar
  c.beginPath();
  c.moveTo(MS.base - 90, DESK_Y);
  c.lineTo(MS.base - 70, DESK_Y - 22);
  c.lineTo(MS.base + 80, DESK_Y - 22);
  c.lineTo(MS.base + 96, DESK_Y);
  c.closePath();
  c.fill();
  c.fillRect(MS.base + 10, DESK_Y - 120, 30, 100);
  // the stage (holding the plate's right end) and the mirror under it
  c.fillRect(PLATE.x1 - 120, MS.stageY + 5, 190, 10);
  c.fillRect(MS.base - 10, MS.stageY + 5, 40, 30);
  c.beginPath();
  c.ellipse(MS.nose.x + 4, MS.stageY + 64, 18, 7, -0.3, 0, Math.PI * 2);
  c.fill();
  c.fillRect(MS.nose.x + 2, MS.stageY + 14, 5, 46);
  // the curved arm from the hinge up to the tube
  c.beginPath();
  c.moveTo(MS.base + 14, MS.stageY + 6);
  c.bezierCurveTo(MS.base + 90, MS.stageY - 80, MS.base + 70, 220, MS.base + 10, 170);
  c.lineTo(MS.base - 14, 200);
  c.bezierCurveTo(MS.base + 30, 240, MS.base + 52, MS.stageY - 60, MS.base - 8, MS.stageY + 6);
  c.closePath();
  c.fill();
  // the tube: eyepiece (upper right) → nosepiece (lower left), angled
  const ang = Math.atan2(MS.nose.y - MS.eye.y, MS.nose.x - MS.eye.x);
  const len = Math.hypot(MS.nose.x - MS.eye.x, MS.nose.y - MS.eye.y);
  c.save();
  c.translate(MS.eye.x, MS.eye.y);
  c.rotate(ang);
  c.fillRect(-6, -17, 38, 34); // eyepiece
  c.fillRect(30, -13, len - 80, 26); // body tube
  c.fillRect(len - 54, -18, 26, 36); // nosepiece collar
  c.beginPath();
  c.moveTo(len - 30, -10);
  c.lineTo(len, -6);
  c.lineTo(len, 6);
  c.lineTo(len - 30, 10);
  c.closePath();
  c.fill(); // objective
  // brass cut-lines on the lamp side (the lamp is at the far left: the tube's upper edge)
  c.fillStyle = brass;
  c.fillRect(30, -13, len - 80, 1.4);
  c.fillRect(-6, -17, 38, 1.2);
  c.fillRect(len - 54, -18, 26, 1.2);
  c.restore();
  // the coarse-focus knob (it turns with the hand)
  const turn = hu > 0.35 && hu < 0.65 ? (hu - 0.35) / 0.3 : hu >= 0.65 ? 1 : 0;
  c.fillStyle = ink;
  c.beginPath();
  c.arc(MS.knob.x, MS.knob.y, 18, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = brass;
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(MS.knob.x, MS.knob.y, 18, Math.PI * 0.95, Math.PI * 1.7);
  c.stroke();
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + turn * Math.PI * 0.9;
    c.fillStyle = Math.cos(a) < 0 && Math.sin(a) < 0.2 ? brass : withAlpha(m.fg, 0.5);
    c.fillRect(MS.knob.x + Math.cos(a) * 18 - 1, MS.knob.y + Math.sin(a) * 18 - 1, 2.2, 2.2);
  }
  // the lit stage rim and the lamp catching the foot
  c.fillStyle = brass;
  c.fillRect(PLATE.x1 - 120, MS.stageY + 5, 190, 1.2);
  c.fillRect(MS.base - 70, DESK_Y - 22, 150, 1.2);
  void tq;
}

// ===================================================================================================== focus field
let fx: HTMLCanvasElement | null = null;
/** blur everything outside a feathered focus disc (one blur per frame) */
function focusField(f: Frame, cam: Camera3, px: number, hole: number, knob: number) {
  const W = f.c.canvas.width, H = f.c.canvas.height;
  if (!fx || fx.width !== W || fx.height !== H) fx = makeCanvas(W, H);
  const g = fx.getContext('2d')!;
  const s = f.pxScale;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'copy';
  g.filter = `blur(${(px * s).toFixed(1)}px)`;
  g.drawImage(f.c.canvas, 0, 0);
  g.filter = 'none';
  // punch the feathered fields (the specimen, the composing stick) out of the blurred copy: the sharp plane
  g.globalCompositeOperation = 'destination-out';
  for (const F of FOCUS) {
    if ('knob' in F && knob <= 0.01) continue;
    const p = toScreen(LAYERS.L4, cam, F.x, F.y);
    g.save();
    g.translate(p.x * s, p.y * s);
    g.scale(1, F.ry / F.rx);
    const R = F.rx * p.k * s * hole;
    const gr = g.createRadialGradient(0, 0, R * 0.62, 0, 0, R * 1.12);
    const ka = 'knob' in F ? knob : 1;
    gr.addColorStop(0, `rgba(0,0,0,${ka})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.4);
    g.restore();
  }
  g.globalCompositeOperation = 'source-over';
  const c = f.c;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.drawImage(fx, 0, 0);
  c.restore();
}
