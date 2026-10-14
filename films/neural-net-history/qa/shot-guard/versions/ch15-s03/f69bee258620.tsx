/**
 * ch15-s03 — the detective's microscope: inside a simplified copy of the model, a lantern-forest of features;
 * RABBIT lights before a single slug of the line is set, and snuffing it changes the rhyme to HABIT.
 * (candleAmber, the study's own lamp; 15.88 s; in: crossfade from the hall.)
 *
 * CAMERA: a desk insert from the side (STUDY LOCK: the detective's own instrument under the green-shaded banker's
 * lamp, whose shade hangs cut off at the frame's left edge as a dark near shape (L5); its pool lies on the specimen
 * stage), a slow push toward the specimen. The microscope is the SAME brass monocular that stands on the tray in
 * ch15-s08 (sets/ch15-s03-microscope: horseshoe foot, pillar, C-limb, stage with clips, sub-stage mirror, the
 * banded body tube rising from the objective to the eyepiece, the milled coarse-focus head and the fine-focus knob),
 * drawn at insert scale with a longer working distance so the specimen fits under the objective. The specimen is a
 * small lantern network laid on the slide. Only the lens's round field is sharp and lit (a lens-circle vignette); the
 * rest of the desk falls into soft, darker haze, honest about the limits of the tool.
 *   b1 (0.6)    the two steady hands turn the coarse-focus head once (one full turn, a brass glint) and withdraw;
 *               the field sharpens as it turns; MARCH 2025
 *   'looked'    the label: whose model, which tool
 *   — the couplet's first line stands set in type: He saw a carrot and had to grab it, (from the paper's example);
 *     the second line is an empty row of slots
 *   'rhyme'     the first line's slugs warm once (a glint runs along them): the couplet arrives with the word
 *   'rabbit'    one lantern deep in the forest lights gold; RABBIT glows faintly at the far end of the empty line,
 *               a thread of light between them, before a single slug of the line is set
 *   b3          a small paper snuffer drops over that lantern by itself; a neighbour lights; the ghost word becomes
 *               HABIT; the line's slugs fill in left to right SET FACE-DOWN (blank type metal, nick marks, no
 *               glyphs: 'habit' is the only readable word of the line); the label: rabbit → (suppressed) → habit
 *   'plan'      hold on the finished line under the microscope
 * The lanterns are feature-nodes (glow ← activation, illustrative); the binding that matters is causal: the lit
 * feature names the line's last word before the line exists, and suppressing it changes the word.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import {
  LAYERS, PUPPET_NEAR_BLACK, defineShot, drawSlug, glow, makeCanvas, mixLab, overscan,
  paperLantern, slugWidth, toScreen, typeSlugs, withAlpha,
} from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { FONT, softPlate, textRole, textSwap } from '../../../film/silhouette/type';
import { hands } from '../cast';
import { handsEntry } from '../sets/narratorHands';
import { clamp01, label15, lerp, monoDate, screen, sm, tq12, win } from '../sets/ch15-s01-kit';
import { studyMicroscope } from '../sets/ch15-s03-microscope';

const ID = 'ch15-s03';
type C = CanvasRenderingContext2D;

// ===================================================================================================== staging (L4)
const DESK_Y = 560;
/** the microscope (shared silhouette, sets/ch15-s03-microscope): foot centre on the desk, insert scale, a wider stage
 *  and a longer working distance (lift) so the paper forest stands under the objective */
const MIC = { x: 1000, y: DESK_Y, s: 2, stageW: 150, stageX: -60, lift: 50 };
/** its anchors (the set's local geometry × s; the joint is 52 units above the foot) */
const JY = DESK_Y - 52 * MIC.s;
const MS = {
  obj: { x: MIC.x - 12 * MIC.s, y: JY - (29 + MIC.lift) * MIC.s },
  knob: { x: MIC.x + 10 * MIC.s, y: JY - (86 + MIC.lift) * MIC.s },
  stageY: JY - 24 * MIC.s,
  mirror: { x: MIC.x - 12 * MIC.s, y: JY - 6 * MIC.s },
};
/** the specimen slide on the stage: it runs left from just past the objective (the limb rises behind its right end,
 *  so no lantern stands in front of the limb) */
const PLATE = { x0: MS.obj.x - 196, x1: MS.obj.x + 46, y: MS.stageY - 5 };
const PLATE_CX = (PLATE.x0 + PLATE.x1) / 2;
/** reviser r1 (round 5): the near plane (z 780: between the action plane and the shared L5) for the banker's lamp's
 *  shade at the upper left and the inkwell at the lower left */
const NEAR: LayerSpec = { id: 'L5', z: 780, haze: 0, blur: 0 };
/** the shade (near-plane world): spans x 70..330 so it is cut by the left edge through the whole push */
const SHADE = { x: 70, y: 92, w: 260, h: 70 };
/** the inkwell (near-plane world): base on the desk's near edge */
const INK = { x: 300, base: 566, w: 128, h: 72 };
/** the composing stick on its stand, above the desk, left of the microscope's tube */
/** reviser r1: lowered 50 so the dollied-in frame holds the couplet, the forest and the microscope together */
const STICK = { x: 316, y1: 148, y2: 214, size: 22 };
const LINE1 = ['He', ' saw', ' a', ' carrot', ' and', ' had', ' to', ' grab', ' it', ','];
/** the second line's sorts: word lengths only (set face-down: the words are never shown) */
const LINE2_LEN = [3, 6, 3, 4, 1, 8];
/** the lens's field (L4 world): round, centred on the specimen; the couplet's band; the knob while it turns */
const FOCUS = [
  { x: PLATE_CX, y: PLATE.y - 50, rx: 190, ry: 190 },
  { x: 600, y: 182, rx: 330, ry: 96 },
  { x: MS.knob.x, y: MS.knob.y + 10, rx: 130, ry: 110, knob: true },
];
/** the study wall behind the desk (deeper and softer than the shared L2: only the specimen plane is sharp) */
const WALL_SOFT: LayerSpec = { id: 'L2', z: LAYERS.L2.z, haze: 0.2, blur: 4.5 };
/** a camera that puts L4 point p at screen point s with L4 scale k (dolly only) */
function frameL4(p: { x: number; y: number }, s: { x: number; y: number }, k: number): Camera3 {
  const z = 1000 - 1000 / k;
  return { x: 640 + (640 + (p.x - 640) * k - s.x) / k, y: 360 + (360 + (p.y - 360) * k - s.y) / k, z, lens: 1 };
}

/** the lantern forest: three ranks of small paper lanterns on wire stems standing on the slide */
interface Lan { x: number; y: number; r: number; base: number; rank: number; seed: number }
const FOREST: Lan[] = (() => {
  const out: Lan[] = [];
  let seed = 1;
  for (let rank = 2; rank >= 0; rank--) {
    const n = rank === 0 ? 8 : rank === 1 ? 9 : 10;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const x = lerp(PLATE.x0 + 16, PLATE.x1 - 24, u) + hash1(seed, 3) * 7 + rank * 6;
      // a little lower under the objective, so the lens never touches a lantern
      const dip = 1 - 0.32 * Math.max(0, 1 - Math.abs(x - MS.obj.x) / 70);
      const h = (24 + rank * 14 + (0.5 + 0.5 * hash1(seed, 4)) * 34) * dip;
      const r = 9.6 - rank * 2 + hash1(seed, 5) * 1.0;
      out.push({ x, y: PLATE.y - 4 - rank * 5 - h, r, base: PLATE.y - 4 - rank * 5, rank, seed: seed++ });
    }
  }
  return out;
})();
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
/** the rabbit feature: a lantern deep in the forest, under the lens; the habit feature beside it */
const RABBIT_X = MS.obj.x - 64;
const RABBIT = FOREST.reduce((best, l) => (l.rank === 1 && Math.abs(l.x - RABBIT_X) < Math.abs(best.x - RABBIT_X) ? l : best), FOREST[0]);
const HABIT = FOREST.filter((l) => l.rank === 1 && l !== RABBIT).reduce((best, l) => (Math.abs(l.x - (RABBIT.x - 56)) < Math.abs(best.x - (RABBIT.x - 56)) ? l : best));

interface B {
  D: number;
  knob: number;
  who: number;
  rhyme: number;
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
  /** 'a simplified copy of their model': the full model's hazed field dims while the copy on the slide ripples */
  copy: { at: number; end: number };
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
      // review round 4: re-anchored to the re-recorded L1504/L1505 word timings (each beat rides its word)
      knob: T.word('L1504', 'Researchers'),
      who: T.word('L1504', 'looked'),
      rhyme: T.word('L1504', 'rhyme'),
      rabbit: T.word('L1504', 'rabbit') - 0.12,
      // review round 5: the new solo line L1504b says the intervention aloud: the snuffer drops ON 'Snuff' (it
      // starts 0.15 s before the word and lands just after it), HABIT lights ON 'habit'
      // reviser r1 (round 5): a tighter drop: it starts 0.12 s before the word and lands ~0.16 s after it (a true
      // gravity fall, y ∝ u²), so the bell is down within 0.25 s of 'Snuff'
      snuff: T.word('L1504b', 'Snuff') - 0.12,
      habit: T.word('L1504b', 'habit') - 0.12,
      // the second line's slugs land one every 0.25 s once HABIT is lit, and the HABIT sort closes the line up
      // well before 'plan' (L1505): the line is visibly written after its end was chosen
      fill0: T.word('L1504b', 'habit') + 0.45,
      set: T.word('L1505', 'plan') - 0.75,
      plan: T.word('L1505', 'plan'),
    };
    // the desk insert (couplet, microscope and specimen all in frame; the knob turn reads inside it); on 'looked
    // inside' a first slow push toward the specimen; on 'Asked' the second, landing on 'rabbit' with the couplet and
    // the eyepiece inside the frame
    // reviser r1: the whole move sits ~1.12x closer and further left, so the couplet fills the upper frame, the forest
    // the middle and the microscope's limb frames the right edge (no flat brown haze in the upper left)
    const C0: Camera3 = frameL4({ x: 690, y: 330 }, { x: 640, y: 352 }, 1.1);
    const CM: Camera3 = frameL4({ x: 672, y: 328 }, { x: 640, y: 356 }, 1.24);
    const C1: Camera3 = frameL4({ x: 652, y: 326 }, { x: 640, y: 358 }, 1.34);
    const C2: Camera3 = frameL4({ x: 640, y: 326 }, { x: 640, y: 360 }, 1.41);
    const looked = T.word('L1504', 'looked');
    const model = T.wordEnd('L1504', 'model');
    const asked = T.word('L1504', 'Asked');
    const lz = (a: Camera3, q: Camera3, w: number): Camera3 => ({ x: lerp(a.x, q.x, w), y: lerp(a.y, q.y, w), z: lerp(a.z, q.z, w), lens: 1 });
    const cam = (t: number): Camera3 => {
      if (t < asked - 0.15) return lz(C0, CM, sm((t - (looked - 0.2)) / (model + 0.4 - (looked - 0.2))));
      const v = sm((t - (b.rabbit + 0.2)) / (D - b.rabbit - 0.2));
      if (v > 0) return lz(C1, C2, v);
      return lz(CM, C1, sm((t - (asked - 0.15)) / (b.rabbit + 0.15 - (asked - 0.15))));
    };
    tl.hold(0, D);
    return { tl, b, cam, CAMS: [C0, CM, C1, C2], copy: { at: T.word('L1504', 'simplified'), end: model } };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);
    const tq = tq12(t);
    // the knob turn: the hands reach in (0–.3), grip and turn once (.3–.72), withdraw (.72–1)
    const hu = clamp01((tq - b.knob + 0.1) / 1.7);
    const turn = hu <= 0.3 ? 0 : hu >= 0.72 ? 1 : sm((hu - 0.3) / 0.42);
    const focusK = sm((tq - (b.knob + 0.55)) / 0.7);
    const rabbitOn = win(t, b.rabbit, b.rabbit + 0.35);
    const snuffU = clamp01((t - b.snuff) / 0.28);
    const rabbitK = rabbitOn * (1 - 0.92 * sm(clamp01((t - b.snuff - 0.24) / 0.25)));
    const habitK = win(t, b.habit, b.habit + 0.3);
    f.backlight({ sunX: 900, sunY: 360, sunRadius: 380, intensity: 0.22 });

    // L2: the study's own panelled wall behind the desk, in the lamp's shadow: candleAmber ink, well out of focus;
    // the only spill on it sits behind the specimen, and the wall falls a stop toward the upper right and the corners
    f.layer(WALL_SOFT, (c, env) => {
      const r = overscan(LAYERS.L2, sc.CAMS, 80);
      f.cached(`${ID}/L2s3b/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        const m = env.mood;
        const wall = mixLab(mixLab(env.fill('set'), m.fg, 0.35), m.ink, 0.5);
        cc.fillStyle = wall;
        cc.fillRect(r.x, r.y, r.w, r.h);
        // the lamp's spill on the wall, behind and below the specimen
        const g = cc.createRadialGradient(900, 420, 30, 900, 420, 620);
        g.addColorStop(0, withAlpha(mixLab(m.set, m.halo, 0.22), 0.58));
        g.addColorStop(0.45, withAlpha(mixLab(m.set, m.halo, 0.06), 0.22));
        g.addColorStop(1, withAlpha(wall, 0));
        cc.fillStyle = g;
        cc.fillRect(r.x, r.y, r.w, r.h);
        // the upper right a stop down (the shade's cut-off throws it into shadow)
        const d = cc.createLinearGradient(700, 420, 1300, -60);
        d.addColorStop(0, withAlpha(m.ink, 0));
        d.addColorStop(1, withAlpha(m.ink, 0.55));
        cc.fillStyle = d;
        cc.fillRect(r.x, r.y, r.w, r.h);
        // the panelling: tall raised fields between stiles (cut-lines), a dado rail, a picture rail
        cc.strokeStyle = withAlpha(m.rim, 0.07);
        cc.lineWidth = 1.4;
        for (let x = Math.floor(r.x / 240) * 240; x < r.x + r.w; x += 240) {
          cc.strokeRect(x + 14, 40, 212, 300);
          cc.strokeRect(x + 14, 380, 212, 150);
        }
        cc.fillStyle = withAlpha(m.ink, 0.7);
        cc.fillRect(r.x, 8, r.w, 10);
        cc.fillRect(r.x, 356, r.w, 9);
      })(c, r.x, r.y);
    });
    f.fog({ yCenter: 0.55 * 720, height: 0.45 * 720, alpha: 0.08, drift: 5 });

    // L3: THE MODEL ITSELF, behind the specimen: a vast hazed field of small lit features, far past the tool's focus.
    // On 'simplified' it sinks back while the copy on the slide ripples awake: the researchers look inside the copy.
    const sinkK = sm((t - sc.copy.at + 0.1) / 1.2);
    f.layer({ id: 'L3', z: LAYERS.L3.z, haze: 0.35, blur: 2.5 }, (c, env) => {
      const r = overscan(LAYERS.L3, sc.CAMS, 60);
      c.save();
      c.globalAlpha *= 0.85 - 0.55 * sinkK;
      f.cached(`${ID}/L3field3/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        modelField(cc, env, r);
      })(c, r.x, r.y);
      c.restore();
    });
    f.fog('B');

    // L4: the desk top and the lamp's pool, the composing stick, the microscope with the slide on its stage
    f.layer('L4', (c, env) => {
      const m = env.mood;
      // the desk: a lit sliver of top, the dark front below
      const r = overscan(LAYERS.L4, sc.CAMS, 40);
      const dg = c.createLinearGradient(0, DESK_Y, 0, DESK_Y + 36);
      dg.addColorStop(0, mixLab(m.setHaze, m.halo, 0.12));
      dg.addColorStop(1, mixLab(env.fill('set'), m.fg, 0.55));
      c.fillStyle = dg;
      c.fillRect(r.x, DESK_Y, r.w, 36);
      c.fillStyle = mixLab(m.fg, m.ink, 0.6);
      c.fillRect(r.x, DESK_Y + 36, r.w, r.y + r.h - DESK_Y - 36);
      c.fillStyle = withAlpha(m.rim, 0.24);
      c.fillRect(r.x, DESK_Y + 36, r.w, 1.2);
      // the lamp's warm pool on the desk top, falling under the microscope
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.translate(PLATE_CX, DESK_Y + 6);
      c.scale(1, 0.12);
      const pg = c.createRadialGradient(0, 0, 0, 0, 0, 420);
      pg.addColorStop(0, withAlpha(m.halo, 0.5));
      pg.addColorStop(0.5, withAlpha(m.halo, 0.14));
      pg.addColorStop(0.7, withAlpha(m.halo, 0.03));
      pg.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = pg;
      c.fillRect(-420, -420, 840, 840);
      c.restore();
      // reviser r1 (round 5): the banker's lamp's own soft pool on the desk under its shade (dim: the specimen and the
      // lit lantern stay brighter)
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.translate(250, DESK_Y + 8);
      c.scale(1, 0.16);
      const lp = c.createRadialGradient(0, 0, 0, 0, 0, 260);
      lp.addColorStop(0, withAlpha(m.halo, 0.3));
      lp.addColorStop(0.6, withAlpha(m.halo, 0.08));
      lp.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = lp;
      c.fillRect(-260, -260, 520, 520);
      c.restore();
      // THE POOL ON THE SPECIMEN STAGE: the lamp's light gathered on the slide and the forest (r ~140 world), so the
      // network is the brightest area of the frame and the microscope stands dark against it
      c.save();
      c.globalCompositeOperation = 'lighter';
      const sp = c.createRadialGradient(PLATE_CX, PLATE.y - 30, 6, PLATE_CX, PLATE.y - 30, 150);
      // reviser r1: about +0.15 exposure on the specimen
      // reviser r1 (round 5): its outer 30 % falls away fast, so the lit RABBIT, then HABIT, lantern is the
      // brightest point in the frame at each beat (not the halo behind the forest)
      sp.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.25), 0.44));
      sp.addColorStop(0.45, withAlpha(m.halo, 0.2));
      sp.addColorStop(0.7, withAlpha(m.halo, 0.05));
      sp.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = sp;
      c.fillRect(PLATE_CX - 150, PLATE.y - 180, 300, 300);
      c.restore();
      // the composing stick and its stand
      drawCouplet(c, env, t, b, rabbitK, habitK);
      // the microscope (the shared silhouette, side view, facing left; the hands turn its coarse-focus head once)
      studyMicroscope(c, { x: MIC.x, y: MIC.y, s: MIC.s, stageW: MIC.stageW, stageX: MIC.stageX, lift: MIC.lift, knob: turn * Math.PI * 2, light: 0.85, glint: -1, ink: PUPPET_NEAR_BLACK }, env);
      // the slide on the stage, the two spring clips lying on it
      c.fillStyle = withAlpha(mixLab(m.rim, m.haze, 0.4), 0.55);
      c.fillRect(PLATE.x0, PLATE.y, PLATE.x1 - PLATE.x0, 5);
      c.fillStyle = withAlpha(m.core, 0.45);
      c.fillRect(PLATE.x0, PLATE.y, PLATE.x1 - PLATE.x0, 1);
      for (const cx of [PLATE.x0 + 34, PLATE.x1 - 30]) {
        c.fillStyle = PUPPET_NEAR_BLACK;
        c.fillRect(cx - 18, PLATE.y - 3, 36, 3.5);
        c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.5), 0.7);
        c.fillRect(cx - 18, PLATE.y - 3, 36, 1.2);
      }
      // the forest on the slide
      drawForest(c, env, t, rabbitK, habitK, sc.copy);
      // the objective's own catch-light, looking down into the field
      glow(c, MS.obj.x, MS.obj.y + 2, 16, m.halo, 0.3);
      // the brass glint where the fingers turn the head (b1 'Researchers' → +1.2 s): brightest as the notch passes
      const gk = win(t, b.knob, b.knob + 0.3) * (1 - win(t, b.knob + 0.9, b.knob + 1.2));
      if (gk > 0.01) {
        const face = 0.55 + 0.45 * Math.max(0, -Math.sin(turn * Math.PI * 2 - 0.6));
        glow(c, MS.knob.x - 8, MS.knob.y - 10, 22, mixLab(m.core, m.halo, 0.3), 0.7 * gk * face);
      }
      // the snuffer: a small paper bell on a wire, dropping over the rabbit lantern by itself
      if (snuffU > 0) {
        const sy = lerp(RABBIT.y - 110, RABBIT.y - RABBIT.r * 1.4, snuffU * snuffU);
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
        const sk = win(t, b.snuff + 0.3, b.snuff + 0.7) * (1 - win(t, b.snuff + 1.6, b.snuff + 3));
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
      // reviser r1: no hands (at insert scale they read as a soft dark rod across the frame): the coarse-focus head
      // turns by itself, its brass glint passing once, and the specimen's focus pulls in with it
      void hands;
      void handsEntry;
    });
    f.rim({ x: 0, y: -1 });
    // the lit features as practicals (light wraps the stems)
    const rl = rabbitK;
    if (rl > 0.02) f.practical({ x: RABBIT.x, y: RABBIT.y, kind: 'candle', seed: 1503, intensity: 1.15 * rl, radius: 40 });
    if (habitK > 0.02) f.practical({ x: HABIT.x, y: HABIT.y, kind: 'candle', seed: 1504, intensity: 1.15 * habitK, radius: 40 });

    // L5 (reviser r1, round 5; STUDY LOCK): the green-shaded banker's lamp's SHADE hangs in at the upper left, cut by
    // the frame edge, its lip lit from within; and a defocused inkwell with a pen stands at the lower left with a
    // warm 1.5 px rim. A near plane at z 780 (not the shared L5's 650, which balloons 3.7x through this push), so the
    // two shapes slide against the desk and the wall but stay in frame. The lantern forest stays the one sharp plane.
    f.layer(NEAR, (c, env) => {
      const r = overscan(NEAR, sc.CAMS, 40);
      f.cached(`${ID}/near5/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        nearPlane(cc, env);
      }, { blur: 3 })(c, r.x, r.y);
      // the bulb's light under the lip (dynamic, a slow candle-like breath)
      const fl = 0.92 + 0.08 * Math.sin(tq * 2.3);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(SHADE.x + SHADE.w * 0.55, SHADE.y + SHADE.h + 4, 4, SHADE.x + SHADE.w * 0.55, SHADE.y + SHADE.h + 4, 150);
      g.addColorStop(0, withAlpha(mixLab(env.mood.core, env.mood.halo, 0.4), 0.42 * fl));
      g.addColorStop(0.4, withAlpha(env.mood.halo, 0.12 * fl));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(SHADE.x - 150, SHADE.y - 100, SHADE.w + 320, SHADE.h + 260);
      c.restore();
    });

    // the limits of the tool: everything outside the lens's round field falls soft and into shade
    focusField(f, cam, 3.6 + 3.0 * (1 - focusK), 0.6 + 0.4 * focusK, 1 - win(t, b.knob + 1.6, b.knob + 2.2), 0.42);
    // value: the frame's corners and the upper right a stop down, the specimen the brightest place in the picture
    const spec = toScreen(LAYERS.L4, cam, PLATE_CX, PLATE.y - 40);
    screen(f, (c) => {
      const g = c.createRadialGradient(spec.x - 80, spec.y - 40, 220, spec.x - 80, spec.y - 40, 900);
      g.addColorStop(0, withAlpha(f.mood.ink, 0));
      g.addColorStop(1, withAlpha(f.mood.ink, 0.4));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      const d = c.createLinearGradient(820, 300, 1280, 0);
      d.addColorStop(0, withAlpha(f.mood.ink, 0));
      d.addColorStop(1, withAlpha(f.mood.ink, 0.35));
      c.fillStyle = d;
      c.fillRect(640, 0, 640, 400);
    });

    screen(f, (c) => {
      const te = { t, mood: f.mood };
      // the date leaves before the study label sets in (never two text items on one row)
      monoDate(c, 'MARCH 2025', b.knob - 0.45, b.who - 0.55, te);
      // the study label starts just before 'looked', on an extra plate over the desk edge
      const whoAt = b.who - 0.17;
      const wa = win(t, whoAt, whoAt + 0.5) * (1 - win(t, b.rabbit - 0.4, b.rabbit + 0.1));
      if (wa > 0.003) softPlate(c, 600, 580, 900, 100, f.mood.ink, 0.62 * wa);
      label15(c, { text: 'Anthropic, on Claude 3.5 Haiku · via a simplified replacement model', x: 600, y: 586, at: whoAt, until: b.rabbit - 0.4, size: 19 }, te);
      // the swap's caption: a quiet texture-role ECHO, only after the narration has said 'habit' (never before it)
      const echoAt = b.habit + 0.12 + 0.3;
      const sa = win(t, echoAt, echoAt + 0.5);
      if (sa > 0.003) softPlate(c, 560, 580, 560, 90, f.mood.ink, 0.5 * sa);
      c.save();
      c.globalAlpha *= 0.72;
      textRole(c, 'texture', () => label15(c, { text: 'rabbit → (suppressed) → habit', x: 560, y: 586, at: echoAt, size: 19 }, te));
      c.restore();
    });
  },
});

// ===================================================================================================== near plane
/** the banker's lamp's shade (dark green glass, nearly black, a lit inner lip) and its brass arm running up out of
 *  frame; the inkwell with a dip pen, its contour rimmed warm toward the lamp */
function nearPlane(c: C, env: PaintEnv) {
  const m = env.mood;
  const glass = mixLab(mixLab('#1d3326', PUPPET_NEAR_BLACK, 0.45), m.ink, 0.15);
  const rimW = withAlpha(mixLab('#e9d6a8', m.halo, 0.4), 0.85);
  const S = SHADE;
  // the arm from above (out of frame) to the shade's top
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(S.x + S.w * 0.55 - 4, -400, 8, 400 + S.y + 6);
  // the shade: a half-cylinder seen from the side: a long rounded crown, a straight lower edge, rolled ends
  const p = new Path2D();
  p.moveTo(S.x, S.y + S.h);
  p.bezierCurveTo(S.x + 4, S.y + 18, S.x + S.w * 0.2, S.y, S.x + S.w * 0.5, S.y);
  p.bezierCurveTo(S.x + S.w * 0.8, S.y, S.x + S.w - 4, S.y + 18, S.x + S.w, S.y + S.h);
  p.closePath();
  c.fillStyle = glass;
  c.fill(p);
  // a faint green sheen along the crown (the glass), muted: the frame's one accent stays the lantern gold
  c.strokeStyle = withAlpha(mixLab('#4f7a5c', m.haze, 0.35), 0.35);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(S.x + 30, S.y + 22);
  c.bezierCurveTo(S.x + S.w * 0.3, S.y + 6, S.x + S.w * 0.7, S.y + 6, S.x + S.w - 30, S.y + 22);
  c.stroke();
  // the rolled lower edge, lit from inside by the bulb
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(S.x - 4, S.y + S.h - 5, S.w + 8, 7);
  c.fillStyle = withAlpha(mixLab(m.core, m.halo, 0.35), 0.85);
  c.fillRect(S.x + 6, S.y + S.h + 2, S.w - 12, 2.2);
  // the inkwell: a squat square-shouldered bottle, a short neck, a pen leaning out of it
  const I = INK;
  const ink = mixLab(PUPPET_NEAR_BLACK, m.set, 0.1);
  const q = new Path2D();
  q.moveTo(I.x, I.base);
  q.lineTo(I.x, I.base - I.h * 0.62);
  q.quadraticCurveTo(I.x, I.base - I.h * 0.78, I.x + I.w * 0.16, I.base - I.h * 0.8);
  q.lineTo(I.x + I.w * 0.36, I.base - I.h * 0.82);
  q.lineTo(I.x + I.w * 0.36, I.base - I.h);
  q.lineTo(I.x + I.w * 0.64, I.base - I.h);
  q.lineTo(I.x + I.w * 0.64, I.base - I.h * 0.82);
  q.lineTo(I.x + I.w * 0.84, I.base - I.h * 0.8);
  q.quadraticCurveTo(I.x + I.w, I.base - I.h * 0.78, I.x + I.w, I.base - I.h * 0.62);
  q.lineTo(I.x + I.w, I.base);
  q.closePath();
  c.fillStyle = ink;
  c.fill(q);
  // the dip pen: a slim tapering holder leaning out of the neck to the right
  c.save();
  c.translate(I.x + I.w * 0.5, I.base - I.h + 4);
  c.rotate(0.42);
  c.beginPath();
  c.moveTo(-3, 0);
  c.lineTo(3, 0);
  c.lineTo(5, -150);
  c.quadraticCurveTo(0, -160, -5, -150);
  c.closePath();
  c.fillStyle = ink;
  c.fill();
  c.strokeStyle = rimW;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-3.5, -4);
  c.lineTo(-5.5, -148);
  c.stroke();
  c.restore();
  // the warm rim on the bottle's lamp-facing contour (top and left shoulder)
  c.strokeStyle = rimW;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(I.x + 0.75, I.base - I.h * 0.2);
  c.lineTo(I.x + 0.75, I.base - I.h * 0.62);
  c.quadraticCurveTo(I.x + 0.75, I.base - I.h * 0.77, I.x + I.w * 0.16, I.base - I.h * 0.79);
  c.lineTo(I.x + I.w * 0.36, I.base - I.h * 0.81);
  c.moveTo(I.x + I.w * 0.36, I.base - I.h + 0.75);
  c.lineTo(I.x + I.w * 0.64, I.base - I.h + 0.75);
  c.stroke();
  // the desk's near edge it stands on
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, m.fg, 0.3);
  c.fillRect(-600, I.base, 1400, 400);
  c.fillStyle = withAlpha(m.rim, 0.14);
  c.fillRect(-600, I.base, 1400, 1.2);
}

// ===================================================================================================== the model
/** the full model as a far field (L3): sparse ranks of tiny lit features on faint threads, baked once */
function modelField(c: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const m = env.mood;
  const x0 = Math.max(r.x, -120), x1 = Math.min(r.x + r.w, 1500);
  const pts: { x: number; y: number; a: number }[] = [];
  let k = 0;
  for (let row = 0; row < 11; row++) {
    const y = 96 + row * 34;
    for (let x = x0 + (row % 2) * 13; x < x1; x += 26) {
      k++;
      // sparse: the far field must not compete with the specimen
      if (0.5 + 0.5 * hash1(k, 34) > 0.36) continue;
      const a = 0.45 + 0.45 * hash1(k, 31);
      pts.push({ x: x + 8 * hash1(k, 32), y: y + 7 * hash1(k, 33), a });
    }
  }
  c.strokeStyle = withAlpha(m.rim, 0.06);
  c.lineWidth = 0.9;
  c.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 17) % pts.length];
    if (Math.abs(q.y - p.y) > 40 || Math.abs(q.x - p.x) > 80) continue;
    c.moveTo(p.x, p.y);
    c.lineTo(q.x, q.y);
  }
  c.stroke();
  for (const p of pts) {
    const R = 10 + 4 * p.a;
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
    g.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.3), 0.26 * p.a));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
    c.fillStyle = withAlpha(m.core, 0.2 * p.a);
    c.beginPath();
    c.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
    c.fill();
  }
}

// ===================================================================================================== the forest
function drawForest(c: C, env: PaintEnv, t: number, rabbitK: number, habitK: number, copy: { at: number; end: number }) {
  const m = env.mood;
  const tq = tq12(t);
  // the network's threads (paper wires between the ranks): what makes the forest read as a network
  c.save();
  c.lineWidth = 1;
  for (const [a, q] of THREADS) {
    const hot = (a === RABBIT || q === RABBIT ? rabbitK : 0) + (a === HABIT || q === HABIT ? habitK : 0);
    c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, Math.min(1, hot)), 0.4 + 0.35 * Math.min(1, hot));
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.quadraticCurveTo((a.x + q.x) / 2, Math.max(a.y, q.y) + 10, q.x, q.y);
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
    c.quadraticCurveTo(l.x + hash1(l.seed, 8) * 5, (l.base + l.y) / 2, l.x, l.y + l.r * 1.2);
    c.stroke();
    // activation: a low seeded shimmer (illustrative), the two named features driven by the beats
    let act = 0.24 + 0.26 * (0.5 + 0.5 * Math.sin(tq * (0.6 + 0.3 * hash1(l.seed, 9)) + l.seed));
    // the copy wakes: a wave of light runs left to right across the slide on 'simplified copy of their model'
    const wx = (l.x - PLATE.x0) / (PLATE.x1 - PLATE.x0);
    const wave = Math.max(0, 1 - Math.abs((tq - copy.at - 0.1) / Math.max(0.6, copy.end - copy.at) - wx) * 4.5);
    act = Math.min(1, act + 0.5 * wave);
    if (l === RABBIT) act = Math.max(act * (1 - rabbitK), rabbitK);
    if (l === HABIT) act = Math.max(act, habitK);
    paperLantern(c, { x: l.x, y: l.y, r: l.r, act: act * (1 - hz * 0.6), alpha: 1 - hz * 0.35, halo: l === RABBIT || l === HABIT ? 1 : 0.35 }, env);
  }
}

// ===================================================================================================== the couplet
/** the second line's slot layout: word-length sorts and the last word's slot */
function line2Layout(c: C, x0: number) {
  const S = STICK.size;
  const slots: { x: number; w: number; n: number }[] = [];
  let x = x0;
  for (const n of LINE2_LEN) {
    const w = slugWidth(c, ' ' + 'n'.repeat(n), S);
    slots.push({ x, w, n });
    x += w + 2;
  }
  const ghostW = Math.max(slugWidth(c, ' rabbit', S), slugWidth(c, ' habit', S));
  return { slots, ghostX: x, ghostW };
}

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
  // reviser r1: the example's first line is TEXTURE (the script keeps the rhyme's words in the sources list): set
  // in type, dimmed, never half-legible subject text; RABBIT / HABIT are the line's only subject words
  c.save();
  c.globalAlpha *= 0.62;
  const lay = textRole(c, 'texture', () => typeSlugs(c, { x: STICK.x, y: STICK.y1, tokens: LINE1, size: S, reveal: 1 }, env));
  c.restore();
  // 'rhyme': the first line's slugs warm once, a glint running along them (0.6 s), so the couplet arrives with the word
  const rk = win(t, b.rhyme - 0.1, b.rhyme + 0.15) * (1 - win(t, b.rhyme + 0.3, b.rhyme + 0.6));
  if (rk > 0.003) {
    const h1 = S * 1.9;
    const u = clamp01((t - (b.rhyme - 0.1)) / 0.6);
    const gx = lerp(STICK.x, lay.x1, u);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(m.halo, 0.12 * rk);
    c.fillRect(STICK.x, STICK.y1 - h1, lay.x1 - STICK.x, h1);
    const g = c.createLinearGradient(gx - 70, 0, gx + 70, 0);
    g.addColorStop(0, withAlpha(m.core, 0));
    g.addColorStop(0.5, withAlpha(mixLab(m.core, m.halo, 0.3), 0.3 * rk));
    g.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = g;
    c.fillRect(gx - 70, STICK.y1 - h1, 140, h1);
    c.restore();
  }
  // line 2: an empty row of slots, the ghost word at the far end, sorts filling toward it
  const h = S * 1.9;
  const L2 = line2Layout(c, STICK.x + 14);
  const ghostX = L2.ghostX, ghostW = L2.ghostW;
  const stickEnd = Math.max(lay.x1, ghostX + ghostW + 18);
  c.fillStyle = env.fill('ink');
  c.fillRect(STICK.x, STICK.y2, stickEnd - STICK.x, 10);
  c.fillRect(STICK.x, STICK.y2 - h - 6, 12, h + 16);
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(STICK.x + 12, STICK.y2, stickEnd - STICK.x - 12, 1.2);
  // empty slot outlines (faint)
  c.strokeStyle = withAlpha(m.rim, 0.1);
  c.lineWidth = 1;
  for (const s of L2.slots) c.strokeRect(s.x + 0.5, STICK.y2 - h + 2, s.w - 1, h - 3);
  c.strokeRect(ghostX, STICK.y2 - h + 2, ghostW, h - 3);
  // the sorts drop in left to right SET FACE-DOWN: blank type metal with nick marks and a lit shoulder, no glyphs
  // (review round 1: never a readable line 1 beside a mirrored line 2; 'habit' is the line's only readable word)
  const tq = tq12(t);
  L2.slots.forEach((s, i) => {
    const at = b.fill0 + i * 0.25;
    const a = sm(clamp01((tq - at) / 0.22));
    if (a <= 0) return;
    // each sort lands with a brief warm catch on its shoulder, then rests as lit type metal (texture: no glyphs)
    const land = a >= 1 ? Math.max(0, 1 - (tq - at - 0.22) / 0.5) : 0;
    c.save();
    c.globalAlpha *= Math.min(1, a * 1.5);
    const sy = STICK.y2 - h + (1 - a) * -30;
    drawSlug(c, s.x, sy, s.w, h, '', S, 0.18 + 0.6 * land, env);
    c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.5), 0.2 + 0.25 * land);
    c.fillRect(s.x + 1, sy + 1.6, s.w - 3, h * 0.6);
    faceDown(c, s.x, sy, s.w, h, s.n, env);
    c.restore();
  });
  // the ghost word: RABBIT (lit by the feature), then HABIT; then the real sort is set
  // the ghost word hands over to the real sort with a text swap (never two readable 'habit's at once): the sort
  // settles a few px into its slot while the ghost goes out
  const setSw = textSwap(t, b.set, 0.25);
  const setU = setSw.in;
  const gx = ghostX + ghostW / 2, gy = STICK.y2 - h / 2;
  const word = (txt: string, a: number) => {
    if (a <= 0.01) return;
    c.save();
    c.globalAlpha *= a;
    glow(c, gx, gy, 54, m.halo, 0.25 * a);
    c.font = `500 ${S * 1.05}px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = withAlpha(mixLab(m.core, '#ffffff', 0.2), 0.85);
    c.fillText(txt, gx, gy + 1);
    c.restore();
  };
  word('rabbit', 0.85 * rabbitK * (1 - habitK) * (1 - 0.8 * win(t, b.snuff + 0.2, b.habit)));
  word('habit', 0.85 * habitK * setSw.out);
  if (setU > 0) {
    c.save();
    c.globalAlpha *= Math.min(1, setU * 1.4);
    drawSlug(c, ghostX, STICK.y2 - h + (1 - setU) * -8, ghostW, h, ' habit', S, 0.6, env);
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
    c.quadraticCurveTo((src.x + gx) / 2 - 40, (src.y + gy) / 2, gx, gy + h / 2 + 2);
    c.stroke();
    c.restore();
  }
}

/** a sort set face-down: no face shows, only the metal's body: two nick grooves across it and a few hairline
 *  sort-marks (one per letter), so the row reads as type waiting, never as words */
function faceDown(c: C, x: number, y: number, w: number, h: number, n: number, env: PaintEnv) {
  const m = env.mood;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.55);
  c.fillRect(x + 2, y + h * 0.3, w - 4, 1.6);
  c.fillRect(x + 2, y + h * 0.42, w - 4, 1.2);
  c.fillStyle = withAlpha(m.rim, 0.16);
  c.fillRect(x + 2, y + h * 0.3 + 1.6, w - 4, 0.8);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.45);
  const step = (w - 8) / Math.max(1, n);
  for (let i = 1; i < n; i++) c.fillRect(x + 4 + i * step, y + h * 0.5, 0.9, h * 0.18);
}

// ===================================================================================================== focus field
let fx: HTMLCanvasElement | null = null;
/** blur and shade everything outside the lens's round field (and the couplet's band): one blur per frame */
function focusField(f: Frame, cam: Camera3, px: number, hole: number, knob: number, shade: number) {
  const W = f.c.canvas.width, H = f.c.canvas.height;
  if (!fx || fx.width !== W || fx.height !== H) fx = makeCanvas(W, H);
  const g = fx.getContext('2d')!;
  const s = f.pxScale;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'copy';
  g.filter = `blur(${(px * s).toFixed(1)}px)`;
  g.drawImage(f.c.canvas, 0, 0);
  g.filter = 'none';
  // the haze outside the lens falls toward the study's ink
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = withAlpha(f.mood.ink, shade);
  g.fillRect(0, 0, W, H);
  // punch the feathered fields (the specimen under the lens, the composing stick) out of the shaded copy
  g.globalCompositeOperation = 'destination-out';
  for (const F of FOCUS) {
    if ('knob' in F && knob <= 0.01) continue;
    const p = toScreen(LAYERS.L4, cam, F.x, F.y);
    g.save();
    g.translate(p.x * s, p.y * s);
    g.scale(1, F.ry / F.rx);
    const R = F.rx * p.k * s * hole;
    const gr = g.createRadialGradient(0, 0, R * 0.66, 0, 0, R * 1.08);
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
