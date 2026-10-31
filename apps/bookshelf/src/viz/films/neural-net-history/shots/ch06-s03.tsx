/**
 * ch06-s03 — the rivals were good: the gallery, the widest street, one clean bowl (duskRose plate, paper wipe in,
 * 24.04 s). Presented with real admiration: this is the fairest case for the age's belief.
 *
 *   'rivals'       in a dusk lecture hall, a long paper strip unrolls across the stage (on twos): the rivals' gallery,
 *                  two panels, no captions.
 *   'translation'  panel 1: a parchment of two bilingual columns (texture, not text); threads of light pair line to
 *                  line (statistics learned from data); on 'beat hand-written rules' the small hand-cut rulebook
 *                  beside it is closed and set aside.
 *   'Forests'      panel 2: a little forest of cut-paper decision trees grows; each raises a tiny paper flag; on 'voted'
 *                  the majority colour rises as one big flag over the forest.
 *   'Vapnik's'     the strip rolls aside onto the favourite: Vapnik at a blackboard, chalk in hand, two crowds of
 *                  chalk dots; name card (with Cortes, Guyon, Boser · Bell Labs).
 *   'support…'     the dots become two crowds of small paper lanterns, warm on the left, cool on the right.
 *   'widest'       a narrow street is tried first (faint, a real separator with less than half the room) and erased;
 *                  then the widest street opens (kerbs + a lit centre line); the lanterns standing right on each kerb
 *                  glow brighter and get chalk circles (the support vectors; drawn, not labelled).
 *   'crowds'       the margin equation inks onto the board's lower margin, in chalk.
 *   'landscape'    the board tilts away; ONE CLEAN BOWL rises as a side-on paper landscape (f(x) = x², no fog).
 *   'with a proof' a ball of light set on the left rim rolls to the single bottom (true gradient-descent iterates),
 *                  then one from the right rim, to the same point; a parchment tag pins to the bowl's floor:
 *                  "convex: one global optimum". Beside it, smaller, chapter 5's misty hills return in miniature,
 *                  fog and hollow and all, the timid traveller still stuck.
 */
import { Timeline } from '../../../core';
import { LAYERS, FONT, MISTY_LR, PUPPET_NEAR_BLACK, descentPath, lossF, defineShot, legibleSize, mistyHills, mixLab, nameCard, pose, windowWall, withAlpha, withLife, MOODS } from '../../../film';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { cast } from '../cast';
import { clamp01, sm, win, tq12, camPath, easeIO, h01, bake, screenPass, lerp } from '../sets/ch06-s01-kit';
import { SVM, BOWL_ITER, chalkCircle, lineSeg, paperFlag, paperLantern2, toBoard, type Area } from '../sets/ch06-s03-svm';

type C = CanvasRenderingContext2D;
const ID = 'ch06-s03';

// ------------------------------------------------------------------------------------------- staging (L4 world)
const FLOOR = 662;
/** the strip: a translucent paper drop (~60% of the frame) hung in front of the gothic windows; the backlight shines
 *  THROUGH it, so its pictures read as shadow-theatre silhouettes and its threads as light */
const STRIP = { x0: 360, x1: 1120, y0: 150, y1: 566 };
const P1 = { x0: 384, x1: 690 };
const P2 = { x0: 704, x1: 1104 };
const BOARD = { x: 420, y: 128, w: 800, h: 420 };
/** the data area on the board (the crowds and the street); the lower margin strip holds the equation */
const AREA: Area = { x: 486, y: 150, w: 668, h: 300 };
const EQ_Y = 512;
/** Vapnik stands LEFT of the board, against the window light (never against the dark slate) */
const VAP_X = 300;
const LIGHT = { x: 0.15, y: -1 };
const CHALK = '#e9e2d2';

/** the bowl landscape (L4 world) and the miniature hills beside it */
const BOWL = { cx: 600, hw: 270, rimY: 300, bot: 520, floorY: 600 };
/** chapter 5's hills in miniature: unframed, feathered into the hall's haze, right of the bowl */
const MINI = { x: 990, y: 296, w: 350, h: 238 };
/** Vapnik's mark for the bowl: he side-steps left as the board tilts away, so the bowl's rim line runs clear of him */
const VAP_BOWL_X = VAP_X - 120;

const VAP_STAND: Pose = pose({ hipF: 5, kneeF: -4, hipB: -5, kneeB: -1, torso: -1, neck: 6, head: -4, shoulderF: 8, elbowF: 30, wristF: 4, shoulderB: -8, elbowB: 16 }, { handF: 'grip' });
const VAP_WRITE: Pose = pose({ hipF: 7, kneeF: -4, hipB: -6, kneeB: -1, torso: 4, neck: 2, head: -2, shoulderF: 96, elbowF: 22, wristF: 8, shoulderB: -6, elbowB: 22 }, { handF: 'grip' });
const VAP_PRESENT: Pose = pose({ hipF: 5, kneeF: -4, hipB: -5, kneeB: -1, torso: -2, neck: 6, head: -6, shoulderF: 48, elbowF: 40, wristF: -24, shoulderB: -8, elbowB: 16 }, { handF: 'open' });

// ------------------------------------------------------------------------------------------- cameras
/** the hall, then the strip unrolling within it */
const G0: Camera3 = { x: 740, y: 350, z: -40, lens: 1 };
/** panel 1, a gentle push (the windows stay visible either side of the strip) */
const G1: Camera3 = { x: 600, y: 364, z: 110, lens: 1 };
/** a breath back between the panels, then panel 2 */
const GM: Camera3 = { x: 740, y: 360, z: 40, lens: 1 };
const G2: Camera3 = { x: 900, y: 364, z: 110, lens: 1 };
/** the whole strip, as it rolls aside onto the board (Vapnik already fully in frame at left) */
const G3: Camera3 = { x: 720, y: 356, z: 30, lens: 1 };
const V0: Camera3 = { x: 712, y: 356, z: 40, lens: 1 };
const V1: Camera3 = { x: 744, y: 340, z: 110, lens: 1 };
const W0: Camera3 = { x: 704, y: 372, z: 60, lens: 1 };
const W1: Camera3 = { x: 716, y: 376, z: 20, lens: 1 };
const CAMS = [G0, G1, GM, G2, G3, V0, V1, W0, W1];

interface B {
  D: number;
  rivals: number;
  translation: number;
  statistics: number;
  beat: number;
  rules: number;
  forest: number;
  voted: number;
  board: number;
  support: number;
  finds: number;
  widest: number;
  street: number;
  eq: number;
  landscape: number;
  bowl: number;
  proof: number;
  lineEnd: number;
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      rivals: T.beat('rivals'),
      translation: T.beat('translation'),
      statistics: T.word('L0605', 'statistics'),
      beat: T.word('L0605', 'beat'),
      rules: T.word('L0605', 'rules'),
      forest: T.beat('forest'),
      voted: T.word('L0605', 'voted'),
      board: T.beat('board'),
      support: T.word('L0606', 'support'),
      finds: T.word('L0606', 'finds'),
      widest: T.beat('street'),
      street: T.word('L0606', 'street'),
      eq: T.beat('eq'),
      landscape: T.word('L0607', 'landscape'),
      bowl: T.beat('bowl'),
      proof: T.beat('proof'),
      lineEnd: T.line('L0607').end,
    };
    tl.hold(0, D);
    const cam = camPath([
      [0, G0],
      [b.rivals + 1.3, G0],
      [b.translation + 0.2, G1, easeIO],
      [b.rules + 0.1, G1, (u: number) => u * 0.15],
      [b.forest - 0.1, GM, easeIO],
      [b.forest + 1.6, G2, easeIO],
      [b.voted + 0.6, G2],
      [b.board - 0.3, G3, easeIO],
      [b.board + 0.9, V0, easeIO],
      [b.finds - 0.2, V0],
      [b.street + 0.6, V1, easeIO],
      [b.landscape + 0.3, V1],
      [b.bowl + 0.1, W0, easeIO],
      [D, W1, easeIO],
    ]);
    return { tl, b, cam };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as B;
    const cam = (scene.cam as (t: number) => Camera3)(t);
    f.camera(cam);
    f.backlight({ sunX: 700, sunY: 420, sunRadius: 720, intensity: 0.8 });

    // ---------------- the hall (L2): tall round-headed windows as holes, the reference look
    f.layer('L2', (c, env) => {
      const r = { x: -520, y: -300, w: 2500, h: 1100 };
      bake(f, c, `${ID}/L2b/${env.mood.id}`, r, (cc) =>
        windowWall(cc, { x: r.x, y: r.y, w: r.w, h: 720 - r.y, centers: [-510, -130, 250, 630, 1010, 1390, 1770], winW: 210, apex: 40, sill: 470, shape: 'round', lights: 2, panes: { cols: 3, rows: 9 }, transoms: [0.36], tracery: 'quatrefoil', spandrel: 'trefoil', cornice: 70, wainscot: 80 }, env),
      );
    });
    f.fog('A');
    // ---------------- mid (L3): the floor of the hall, a row of empty chairs' backs
    f.layer('L3', (c, env) => {
      const r = { x: -500, y: 400, w: 2400, h: 500 };
      bake(f, c, `${ID}/L3/${env.mood.id}`, r, (cc) => {
        cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.35);
        cc.fillRect(r.x, 600, r.w, 300);
        cc.fillStyle = env.fill('ink');
        for (let x = -460; x < 1900; x += 74) {
          cc.fillRect(x, 548, 46, 6);
          cc.fillRect(x + 4, 554, 4, 50);
          cc.fillRect(x + 38, 554, 4, 50);
          cc.fillRect(x + 2, 512, 42, 30);
        }
      });
    });
    f.fog('B');

    // ---------------- the action plane (L4)
    const stripOn = t < b.board + 0.8;
    const bowlOn = t > b.landscape - 0.2;
    f.layer('L4', (c, env) => {
      // the floor of the stage, a faint warm sheen
      c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.3);
      c.fillRect(-600, FLOOR, 2600, 400);
      if (t > b.board - 0.75 && (!bowlOn || t < b.bowl)) boardScene(f, c, env, t, tq, b);
      pendant(c, env);
      if (bowlOn) bowlScene(f, c, env, t, tq, b);
      if (stripOn) strip(c, env, t, tq, b);
      // Vapnik at the board (revealed as the strip rolls aside), facing it
      const vp = vapPose(tq, b);
      // the side-step (on twos) as the board tilts away: two strides left, done before the bowl rises
      const stepU = clamp01((tq - (b.landscape + 0.2)) / 0.8);
      const vx = VAP_X + (VAP_BOWL_X - VAP_X) * easeIO(stepU);
      // value hierarchy: the darkest shape in frame, lit only from the window side, a 1.5 px rim on that contour
      if (t > b.board - 0.75) cast.vapnik.draw(c, { x: vx, y: FLOOR, facing: 'right', pose: vp, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: 0.55, y: -1, floor: 0 }, edgeRim: { x: 0.5, y: -1, px: 1.5, alpha: 0.8 } }, env);
    });
    f.rim(LIGHT);
    // a lamp over the board (the practical: a hanging reading lamp) — the bowl's ball is the second, briefer light
    f.practical({ x: 790, y: 82, kind: 'lamp', seed: 63, intensity: 0.55, radius: 50 });
    // ---------------- near (L5): the edge of a lectern at lower left, blurred
    f.layer('L5', (c, env) => {
      const r = { x: -600, y: 560, w: 2600, h: 500 };
      bake(f, c, `${ID}/L5/${env.mood.id}`, r, (cc) => {
        cc.fillStyle = env.fill('fg');
        cc.fillRect(-600, 760, 2600, 300);
        cc.beginPath();
        cc.moveTo(-300, 1000);
        cc.lineTo(-300, 690);
        cc.lineTo(40, 664);
        cc.lineTo(60, 690);
        cc.lineTo(20, 1000);
        cc.closePath();
        cc.fill();
      });
    });

    // ---------------- type
    screenPass(f, (c) => {
      const env = { t, mood: f.mood, seed: 63 };
      // right of Vapnik (never across him), on its own soft plate, clear of the bottom 12%
      nameCard(c, { name: 'Vladimir Vapnik', role: 'with Corinna Cortes, Isabelle Guyon, Bernhard Boser · Bell Labs', at: b.board + 0.1, dur: Math.min(4.2, b.widest - b.board + 0.9), fade: 0.4, x: 452, y: 566 }, env);
    });
  },
});

// =========================================================================================== Vapnik
function vapPose(tq: number, b: B): Pose {
  let p = VAP_STAND;
  if (tq > b.finds - 0.3 && tq < b.street + 0.9) p = VAP_WRITE;
  else if (tq >= b.street + 0.9 && tq < b.landscape) p = VAP_PRESENT;
  else if (tq >= b.landscape) p = VAP_PRESENT;
  return withLife(p, tq, 1995, 0.9);
}

// =========================================================================================== the strip (the rivals' gallery)
function strip(c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const m = env.mood;
  // unroll left → right from 'rivals' (on twos); roll back up left → right from just before 'Vapnik's'
  const unroll = clamp01((tq - (b.rivals - 0.05)) / 1.2);
  const rollAway = clamp01((tq - (b.board - 0.55)) / 1.1);
  const xL = lerp(STRIP.x0, STRIP.x1 + 30, easeIO(rollAway));
  const xR = lerp(STRIP.x0 + 16, STRIP.x1, easeIO(unroll));
  if (xR <= xL + 2) {
    roll(c, env, Math.max(xL, xR));
    return;
  }
  // the hanging cords
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.5;
  c.beginPath();
  for (const x of [STRIP.x0 + 40, STRIP.x1 - 40]) {
    if (x < xL || x > xR) continue;
    c.moveTo(x, -200);
    c.lineTo(x, STRIP.y0);
  }
  c.stroke();
  // the paper (lamp-lit parchment), clipped to its unrolled extent
  c.save();
  c.beginPath();
  c.rect(xL, STRIP.y0, xR - xL, STRIP.y1 - STRIP.y0);
  c.clip();
  // round 2: OPAQUE parchment toned to the set (nothing of the window grid shows through), lamp-warm at its centre
  const paper = mixLab(MOODS.parchment.sky[2], m.halo, 0.3);
  const g = c.createLinearGradient(0, STRIP.y0, 0, STRIP.y1);
  g.addColorStop(0, withAlpha(mixLab(paper, m.set, 0.55), 0.96));
  g.addColorStop(0.55, withAlpha(mixLab(paper, m.set, 0.45), 0.97));
  g.addColorStop(1, withAlpha(mixLab(paper, m.set, 0.62), 0.96));
  c.fillStyle = g;
  c.fillRect(STRIP.x0, STRIP.y0, STRIP.x1 - STRIP.x0, STRIP.y1 - STRIP.y0);
  // the paper's fibres catching the light (a faint additive sheen), a ruled border, the panel division (a fold)
  c.save();
  c.globalCompositeOperation = 'lighter';
  const sh = c.createRadialGradient(740, 360, 40, 740, 360, 460);
  sh.addColorStop(0, withAlpha(m.halo, 0.14));
  sh.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = sh;
  c.fillRect(STRIP.x0, STRIP.y0, STRIP.x1 - STRIP.x0, STRIP.y1 - STRIP.y0);
  c.restore();
  c.strokeStyle = withAlpha(m.ink, 0.45);
  c.lineWidth = 1.2;
  c.strokeRect(STRIP.x0 + 8, STRIP.y0 + 8, STRIP.x1 - STRIP.x0 - 16, STRIP.y1 - STRIP.y0 - 16);
  c.fillStyle = withAlpha(m.ink, 0.4);
  c.fillRect((P1.x1 + P2.x0) / 2 - 1, STRIP.y0 + 6, 2, STRIP.y1 - STRIP.y0 - 12);
  // the two panels' ruled frames ink in as the paper settles (by ~2.2 s), and panel 1's empty easel card stands ready
  const frames = clamp01((tq - (b.rivals + 0.75)) / 0.6);
  if (frames > 0) {
    c.strokeStyle = withAlpha(m.ink, 0.62 * frames);
    c.lineWidth = 1.6;
    c.strokeRect(P1.x0, STRIP.y0 + 22, P1.x1 - P1.x0, STRIP.y1 - STRIP.y0 - 44);
    c.strokeRect(P2.x0, STRIP.y0 + 22, P2.x1 - P2.x0, STRIP.y1 - STRIP.y0 - 44);
    easel(c, env, frames);
  }
  panel1(c, env, t, tq, b);
  panel2(c, env, t, tq, b);
  c.restore();
  // the roll at the moving edge: unrolling on the right, rolling up on the left after the gallery
  if (unroll < 1) roll(c, env, xR);
  if (rollAway > 0) roll(c, env, xL);
}

function roll(c: C, env: PaintEnv, x: number) {
  const m = env.mood;
  c.save();
  const w = 26;
  const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  const paper = mixLab(MOODS.parchment.sky[2], m.halo, 0.3);
  g.addColorStop(0, mixLab(paper, m.set, 0.45));
  g.addColorStop(0.45, paper);
  g.addColorStop(1, mixLab(paper, m.fg, 0.55));
  c.fillStyle = g;
  c.fillRect(x - w / 2, STRIP.y0 - 6, w, STRIP.y1 - STRIP.y0 + 12);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.ellipse(x, STRIP.y0 - 6, w / 2, 5, 0, 0, Math.PI * 2);
  c.ellipse(x, STRIP.y1 + 6, w / 2, 5, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

const PINK = MOODS.parchment.ink;
/** panel 1 — statistics pairing translations; the rulebook set aside. The strip stays BLANK until just before
 *  'translation'; the columns appear and the threads start on the word. */
function panel1(c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const m = env.mood;
  const show = win(t, b.translation - 0.25, b.translation + 0.2);
  if (show <= 0.003) return;
  c.save();
  c.globalAlpha = show;
  // the bilingual sheet (two columns): a thinner paper, a touch brighter where the light comes through
  const sx = P1.x0 + 14, sy = STRIP.y0 + 40, sw = 196, sh = 330;
  c.fillStyle = mixLab(mixLab(MOODS.parchment.sky[1], m.core, 0.25), m.set, 0.08);
  c.fillRect(sx, sy, sw, sh);
  c.strokeStyle = withAlpha(m.ink, 0.6);
  c.lineWidth = 1;
  c.strokeRect(sx, sy, sw, sh);
  c.fillStyle = withAlpha(m.ink, 0.45);
  c.fillRect(sx + sw / 2 - 0.5, sy + 12, 1, sh - 24);
  const rows = 15;
  const rowY = (i: number) => sy + 22 + i * ((sh - 40) / (rows - 1));
  // the columns' lines: typeset texture (word-blocks in shadow), English left, French right (a little longer)
  c.fillStyle = withAlpha(m.ink, 0.95);
  for (let i = 0; i < rows; i++) {
    for (const side of [0, 1]) {
      const x0 = sx + 9 + side * (sw / 2);
      let x = x0;
      const maxW = sw / 2 - 20 + (side ? 4 : 0);
      for (let k = 0; k < 6; k++) {
        const w = 6 + 11 * h01(i * 13 + k * 3 + side * 101, 77);
        if (x + w > x0 + maxW * (0.72 + 0.28 * h01(i + side * 50, 78))) break;
        c.fillRect(x, rowY(i) - 2, w, 4);
        x += w + 3;
      }
    }
  }
  // threads of LIGHT pairing line to line, drawn in on twos from 'translation'; a couple cross (alignment is learned)
  const pairs: [number, number][] = [];
  for (let i = 0; i < rows; i++) pairs.push([i, i === 4 ? 5 : i === 5 ? 4 : i === 10 ? 11 : i === 11 ? 10 : i]);
  const thr = (tq - b.translation) / Math.max(0.6, b.beat - 0.2 - b.translation);
  const nOn = Math.floor(clamp01(thr) * rows + 1e-6) + (tq >= b.translation ? 1 : 0);
  if (nOn > 0) {
    c.save();
    c.lineCap = 'round';
    for (let k = 0; k < Math.min(rows, nOn); k++) {
      const [i, j] = pairs[k];
      const x0 = sx + sw / 2 - 10, y0 = rowY(i);
      const x1 = sx + sw / 2 + 8, y1 = rowY(j);
      const fresh = k === nOn - 1 ? 1 : 0.8;
      c.beginPath();
      c.moveTo(x0 - 34, y0);
      c.bezierCurveTo(x0 - 4, y0, x1 + 4, y1, x1 + 34, y1);
      // a cut shadow under the thread (so the light reads on the pale sheet), then the thread in the warm core,
      // then its soft glow
      c.globalCompositeOperation = 'source-over';
      c.strokeStyle = withAlpha(mixLab(m.ink, m.halo, 0.25), 0.5 * fresh);
      c.lineWidth = 4.2;
      c.stroke();
      c.strokeStyle = withAlpha(mixLab(m.core, '#ffb64a', 0.35), fresh);
      c.lineWidth = 2.2;
      c.shadowColor = withAlpha(m.core, 0.9);
      c.shadowBlur = 8;
      c.stroke();
      c.shadowBlur = 0;
    }
    c.restore();
  }
  // the small hand-cut rulebook: open, then closed and set aside on 'beat hand-written rules'
  const close = clamp01((tq - (b.beat - 0.05)) / 0.42);
  const aside = clamp01((tq - (b.rules - 0.1)) / 0.5);
  c.save();
  c.translate(P1.x1 - 64 + 30 * easeIO(aside), STRIP.y1 - 70 + 22 * easeIO(aside));
  c.scale(0.72, 0.72);
  rulebook(c, env, 0, 0, close, 1 - 0.45 * aside, 0.35 * easeIO(aside));
  c.restore();
  c.restore();
}

function rulebook(c: C, env: PaintEnv, x: number, y: number, close: number, light: number, rot: number) {
  // a small hand-cut book seen from the front: two leaves (open) folding to one cover (closed), on twos
  const ink = env.fill('ink');
  const pw = 72, ph = 96;
  const leaf = withAlpha(mixLab(env.mood.sky[3], env.mood.set, 0.1 + 0.4 * (1 - light)), 0.75);
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  if (close < 1) {
    const k = Math.cos(close * Math.PI * 0.5);
    c.fillStyle = leaf;
    c.fillRect(-pw, -ph, pw, ph);
    c.fillStyle = withAlpha(mixLab(env.mood.sky[2], ink, 0.15), 0.8);
    c.fillRect(0, -ph, pw * k, ph);
    // hand-written "rules": numbered lines with arrows (texture, in shadow)
    c.fillStyle = withAlpha(ink, 0.75);
    for (let i = 0; i < 7; i++) {
      c.fillRect(-pw + 9, -ph + 13 + i * 11.5, 5, 5);
      c.fillRect(-pw + 19, -ph + 14.5 + i * 11.5, 34 + 10 * h01(i, 4), 2.6);
      if (k > 0.2) c.fillRect(9 * k, -ph + 14.5 + i * 11.5, (30 + 12 * h01(i, 5)) * k, 2.6);
    }
    c.strokeStyle = ink;
    c.lineWidth = 1.6;
    c.strokeRect(-pw, -ph, pw, ph);
    c.strokeRect(0, -ph, pw * k, ph);
  } else {
    // closed: a cloth-bound cover with a raised spine, laid aside (a solid silhouette)
    c.fillStyle = ink;
    c.beginPath();
    c.roundRect(-pw * 0.5, -ph, pw, ph, 3);
    c.fill();
    c.fillStyle = withAlpha(env.mood.rim, 0.45);
    c.fillRect(-pw * 0.5 + 6, -ph, 2, ph);
  }
  c.restore();
}

/** panel 2 — a forest of FIVE separate small decision trees; each raises its own flag; the majority wins */
const TREES = [
  { x: 0.1, h: 150, warm: true, s: 3 },
  { x: 0.3, h: 168, warm: false, s: 2 },
  { x: 0.5, h: 156, warm: true, s: 3 },
  { x: 0.7, h: 172, warm: true, s: 2 },
  { x: 0.9, h: 150, warm: false, s: 3 },
];
/** one small decision tree: a trunk, a split, and two or three leaves (each node a small cut-out disc) */
function smallTree(c: C, env: PaintEnv, x: number, ground: number, h: number, splits: number, u: number) {
  if (u <= 0) return { x, y: ground - h };
  const ink = env.fill('ink');
  const yRoot = ground - h * 0.42, ySplit = ground - h * 0.72, yLeaf = ground - h;
  const w = 18;
  c.save();
  c.strokeStyle = ink;
  c.fillStyle = ink;
  c.lineCap = 'round';
  c.lineWidth = 4.5;
  const seg = (x0: number, y0: number, x1: number, y1: number, k: number) => {
    if (k <= 0) return;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x0 + (x1 - x0) * Math.min(1, k), y0 + (y1 - y0) * Math.min(1, k));
    c.stroke();
  };
  // round 2: every decision node is cut as a small tree crown (a cluster of leafy lobes): the forest reads as trees,
  // the branching still reads as a decision tree
  const node = (nx: number, ny: number, r: number, k: number) => {
    if (k <= 0) return;
    const R = r * 1.5 * Math.min(1, k);
    c.beginPath();
    c.arc(nx, ny - R * 0.35, R * 0.8, 0, Math.PI * 2);
    c.arc(nx - R * 0.7, ny + R * 0.05, R * 0.62, 0, Math.PI * 2);
    c.arc(nx + R * 0.7, ny + R * 0.05, R * 0.62, 0, Math.PI * 2);
    c.arc(nx, ny + R * 0.25, R * 0.6, 0, Math.PI * 2);
    c.fill();
    // a lit cut on the crown's top (the strip's lamp)
    c.save();
    c.strokeStyle = withAlpha(env.mood.rim, 0.45);
    c.lineWidth = 1;
    c.beginPath();
    c.arc(nx, ny - R * 0.35, R * 0.8, Math.PI * 1.15, Math.PI * 1.85);
    c.stroke();
    c.restore();
  };
  // grow in three steps on twos: trunk → first split → leaves
  const u1 = clamp01(u * 3), u2 = clamp01(u * 3 - 1), u3 = clamp01(u * 3 - 2);
  // a tapered trunk
  if (u1 > 0) {
    const yT = ground + (yRoot - ground) * Math.min(1, u1);
    c.beginPath();
    c.moveTo(x - 4.5, ground);
    c.lineTo(x - 1.6, yT);
    c.lineTo(x + 1.6, yT);
    c.lineTo(x + 4.5, ground);
    c.closePath();
    c.fill();
  }
  node(x, yRoot, 7, u1 >= 1 ? 1 : 0);
  c.lineWidth = 3;
  seg(x, yRoot, x - w, ySplit, u2);
  seg(x, yRoot, x + w, ySplit, u2);
  node(x - w, ySplit, 5.5, u2 >= 1 ? 1 : 0);
  node(x + w, ySplit, 5.5, u2 >= 1 ? 1 : 0);
  c.lineWidth = 2.2;
  // the second split level: small crowns at the tips (the leaves of the decision tree)
  const leaves = splits === 3 ? [[-w - 9, -w + 9], [w]] : [[-w], [w - 9, w + 9]];
  leaves.forEach((xs, side) => {
    const px = side === 0 ? x - w : x + w;
    for (const lx of xs) {
      seg(px, ySplit, x + lx, yLeaf + 8, u3);
      node(x + lx, yLeaf + 5, 4.2, u3 >= 1 ? 1 : 0);
    }
  });
  // a little ground tuft at the foot
  c.fillRect(x - 12, ground - 2, 24, 4);
  c.restore();
  return { x, y: yLeaf - 4 };
}
function panel2(c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const show = win(t, b.forest - 0.3, b.forest + 0.1);
  if (show <= 0.003) return;
  const ground = STRIP.y1 - 54;
  c.save();
  c.globalAlpha = show;
  const wsum = TREES.filter((q) => q.warm).length;
  TREES.forEach((tr, i) => {
    const grow = clamp01((tq - (b.forest + i * 0.12)) / 0.5);
    const x = P2.x0 + 10 + tr.x * (P2.x1 - P2.x0 - 20);
    const top = smallTree(c, env, x, ground, tr.h, tr.s, grow);
    // each raises its own flag, one after another, before 'voted'
    const fa = b.forest + 0.7 + i * 0.22;
    const flagU = clamp01((tq - fa) / 0.25);
    // on 'voted' the minority's flags dip
    const dip = !tr.warm ? clamp01((tq - (b.voted + 0.15)) / 0.3) : 0;
    paperFlag(c, env, top.x, top.y, 1.5, tr.warm, flagU * (1 - 0.7 * dip));
  });
  // the vote: the majority colour rises over the forest as one big flag
  // round 2: the big warm flag SLIDES UP from behind the forest to stand above the group, and holds there (> 1.5 s)
  const vu = clamp01((tq - (b.voted - 0.05)) / 0.5);
  if (vu > 0 && wsum * 2 > TREES.length) {
    const cx = (P2.x0 + P2.x1) / 2;
    const yTop = STRIP.y0 + 128;
    const y = lerp(ground - 40, yTop, easeIO(vu));
    c.save();
    c.beginPath();
    c.rect(P2.x0, STRIP.y0 + 22, P2.x1 - P2.x0, ground - 36 - STRIP.y0);
    c.clip();
    // its tall pole rises with it
    c.fillStyle = env.fill('ink');
    c.fillRect(cx - 21.5, y, 3, ground - y);
    paperFlag(c, env, cx - 20, y, 3.6, true, 1);
    c.restore();
  }
  c.restore();
}

/** a shaded reading lamp hanging over the board (the scene's practical) */
function pendant(c: C, env: PaintEnv) {
  const x = 790, y = 52;
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 1.2, -500, 2.4, 500 + y);
  c.beginPath();
  c.moveTo(x - 40, y + 26);
  c.quadraticCurveTo(x - 32, y + 2, x - 8, y);
  c.lineTo(x + 8, y);
  c.quadraticCurveTo(x + 32, y + 2, x + 40, y + 26);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.8);
  c.beginPath();
  c.ellipse(x, y + 26, 33, 3.5, 0, 0, Math.PI * 2);
  c.fill();
}

// =========================================================================================== the board + street
function boardScene(f: Frame, c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const m = env.mood;
  // tilt away on 'landscape': the board's top falls back (a vertical squash about its foot) and dims
  const tilt = clamp01((t - (b.landscape + 0.45)) / 0.85);
  c.save();
  if (tilt > 0) {
    const ky = 1 - 0.92 * easeIO(tilt);
    c.translate(0, BOARD.y + BOARD.h);
    c.scale(1, ky);
    c.translate(0, -(BOARD.y + BOARD.h));
    c.globalAlpha *= 1 - easeIO(clamp01((tilt - 0.3) / 0.7));
  }
  // the slate (cached), its frame and tray
  bake(f, c, `${ID}/board/${env.mood.id}`, { x: BOARD.x - 20, y: BOARD.y - 20, w: BOARD.w + 40, h: BOARD.h + 60 }, (cc) => {
    cc.fillStyle = env.fill('ink');
    cc.fillRect(BOARD.x - 14, BOARD.y - 14, BOARD.w + 28, BOARD.h + 28);
    const sg = cc.createLinearGradient(0, BOARD.y, 0, BOARD.y + BOARD.h);
    sg.addColorStop(0, mixLab(m.set, m.fg, 0.25));
    sg.addColorStop(1, mixLab(m.set, m.fg, 0.45));
    cc.fillStyle = sg;
    cc.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
    // old chalk smudges (erased lectures)
    for (let i = 0; i < 18; i++) {
      cc.fillStyle = withAlpha(CHALK, 0.025 + 0.03 * h01(i, 5));
      cc.beginPath();
      cc.ellipse(BOARD.x + h01(i, 6) * BOARD.w, BOARD.y + h01(i, 7) * BOARD.h, 40 + 70 * h01(i, 8), 10 + 18 * h01(i, 9), (h01(i, 10) - 0.5) * 0.4, 0, Math.PI * 2);
      cc.fill();
    }
    cc.fillStyle = env.fill('ink');
    cc.fillRect(BOARD.x - 20, BOARD.y + BOARD.h + 12, BOARD.w + 40, 10);
    cc.fillStyle = withAlpha(m.rim, 0.35);
    cc.fillRect(BOARD.x - 14, BOARD.y - 14, BOARD.w + 28, 1.4);
  });

  const P = SVM.pts.map((p) => ({ ...toBoard(AREA, p.x, p.y), c: p.c }));
  // the lamp-light falling on the board's centre
  const pool = c.createRadialGradient(780, 300, 20, 780, 300, 520);
  pool.addColorStop(0, withAlpha(m.halo, 0.12));
  pool.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = pool;
  c.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);

  // 1) the two crowds as chalk dots (from 'Vapnik's'), then 2) they become paper lanterns (from 'support')
  const dots = win(t, b.board + 0.2, b.board + 0.7);
  const lant = clamp01((tq - (b.support - 0.1)) / 0.5);
  // the street: narrow try (finds → widest), erased; then the widest opens (from 'widest')
  // round 2: the narrow try is drawn at ~60% chalk and holds ~0.55 s (to just after 'widest'), then smears out
  const narrowIn = clamp01((tq - (b.finds - 0.15)) / 0.3);
  const narrowOut = clamp01((tq - (b.widest + 0.05)) / 0.35);
  const open = easeIO(clamp01((t - (b.widest + 0.2)) / 0.7));
  const svU = clamp01((tq - (b.street + 0.05)) / 0.5);
  if (narrowIn > 0 && narrowOut < 1) drawStreet(c, env, SVM.narrow, 1, narrowIn * (1 - narrowOut), false, narrowOut);
  if (open > 0) drawStreet(c, env, SVM.best, open, 1, true);
  P.forEach((p, i) => {
    const isSV = SVM.sv.includes(i);
    if (lant < 1 && dots > 0) {
      c.fillStyle = withAlpha(CHALK, 0.85 * dots * (1 - lant));
      c.beginPath();
      if (p.c < 0) c.arc(p.x, p.y, 6, 0, Math.PI * 2);
      else {
        c.moveTo(p.x - 6, p.y - 6);
        c.lineTo(p.x + 6, p.y + 6);
        c.moveTo(p.x + 6, p.y - 6);
        c.lineTo(p.x - 6, p.y + 6);
      }
      if (p.c < 0) c.fill();
      else {
        c.strokeStyle = withAlpha(CHALK, 0.85 * dots * (1 - lant));
        c.lineWidth = 2.6;
        c.stroke();
      }
    }
    if (lant > 0) {
      const glow = 0.45 + (isSV ? 0.55 * svU : 0);
      c.save();
      c.globalAlpha *= lant;
      paperLantern2(c, env, p.x, p.y + 2, 12.5, p.c < 0, glow);
      c.restore();
      if (isSV) chalkCircle(c, p.x, p.y + 2, 24, svU, i, withAlpha(CHALK, 0.9));
    }
  });
  // the margin equation inks onto the board's lower margin, in chalk (left → right)
  const eqU = clamp01((t - (b.eq - 0.3)) / 0.55);
  if (eqU > 0) equation(c, eqU);
  c.restore();
}

/** the street: kerbs (chalk), the empty roadway between them, a lit centre line; `open` widens it from the centre */
function drawStreet(c: C, env: PaintEnv, L: typeof SVM.best, open: number, a: number, lit: boolean, smear = 0) {
  const m = env.mood;
  const half = L.margin * open;
  const kL = lineSeg(AREA, L, L.b - half);
  const kR = lineSeg(AREA, L, L.b + half);
  const ctr = lineSeg(AREA, L, L.b);
  c.save();
  c.globalAlpha *= a;
  c.beginPath();
  c.rect(AREA.x - 30, AREA.y - 20, AREA.w + 60, AREA.h + 40);
  c.clip();
  if (lit) {
    // the roadway: a faintly lighter band (the swept, empty street)
    c.fillStyle = withAlpha(mixLab(m.set, m.halo, 0.25), 0.35);
    c.beginPath();
    c.moveTo(kL[0].x, kL[0].y);
    c.lineTo(kL[1].x, kL[1].y);
    c.lineTo(kR[1].x, kR[1].y);
    c.lineTo(kR[0].x, kR[0].y);
    c.closePath();
    c.fill();
  }
  c.strokeStyle = withAlpha(CHALK, lit ? 0.85 : 0.6);
  // a smear (the duster passing): the chalk line spreads into a soft band as it fades
  c.lineWidth = lit ? 2.6 : 2.2 + 16 * smear;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(kL[0].x, kL[0].y);
  c.lineTo(kL[1].x, kL[1].y);
  c.moveTo(kR[0].x, kR[0].y);
  c.lineTo(kR[1].x, kR[1].y);
  c.stroke();
  if (lit) {
    // the centre line: dashed, lit warm, glowing
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.setLineDash([16, 12]);
    c.strokeStyle = withAlpha(mixLab(m.core, m.halo, 0.3), 0.9);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(ctr[0].x, ctr[0].y);
    c.lineTo(ctr[1].x, ctr[1].y);
    c.stroke();
    c.setLineDash([]);
    c.strokeStyle = withAlpha(m.halo, 0.25);
    c.lineWidth = 10;
    c.stroke();
    c.restore();
  }
  c.restore();
}

/** chalk: widest street:  min ½‖w‖²  subject to  yᵢ(w·xᵢ + b) ≥ 1   (subscripts set by hand) */
function equation(c: C, u: number) {
  const it = `italic 400 30px ${FONT.text}`;
  const up = `400 30px ${FONT.text}`;
  const sub = `italic 400 19px ${FONT.text}`;
  // the two small-cap words carry meaning: at the 22 px cap-height floor (small caps set lower case, so 'h' height)
  const scSize = legibleSize(c, `500 21px ${FONT.sc}`, 21, 'widest street:');
  const sc = `500 ${scSize}px ${FONT.sc}`;
  type Run = { s: string; f: string; dy?: number; gap?: number };
  const runs: Run[] = [
    { s: 'widest street:', f: sc, gap: 22 },
    { s: 'min', f: up, gap: 10 },
    { s: '½', f: up, gap: 2 },
    { s: '‖', f: up },
    { s: 'w', f: it },
    { s: '‖', f: up },
    { s: '2', f: sub, dy: -14, gap: 26 },
    { s: 'subject to', f: sc, gap: 22 },
    { s: 'y', f: it },
    { s: 'i', f: sub, dy: 7, gap: 2 },
    { s: '(', f: up },
    { s: 'w', f: it, gap: 4 },
    { s: '·', f: up, gap: 4 },
    { s: 'x', f: it },
    { s: 'i', f: sub, dy: 7, gap: 7 },
    { s: '+', f: up, gap: 7 },
    { s: 'b', f: it },
    { s: ')', f: up, gap: 10 },
    { s: '≥', f: up, gap: 10 },
    { s: '1', f: up },
  ];
  c.save();
  c.textBaseline = 'alphabetic';
  let w = 0;
  for (const r of runs) {
    c.font = r.f;
    w += c.measureText(r.s).width + (r.gap ?? 1);
  }
  const x0 = BOARD.x + BOARD.w / 2 - w / 2;
  // reveal by a moving clip (the chalk being written)
  c.beginPath();
  c.rect(x0 - 10, EQ_Y - 40, (w + 20) * u, 60);
  c.clip();
  c.fillStyle = withAlpha(CHALK, 0.92);
  let x = x0;
  for (const r of runs) {
    c.font = r.f;
    c.fillText(r.s, x, EQ_Y + (r.dy ?? 0));
    x += c.measureText(r.s).width + (r.gap ?? 1);
  }
  c.restore();
}

// =========================================================================================== the bowl
function bowlY(x: number) {
  // x in −1..1 → the paper profile: rims at ±1 (rimY), bottom at 0 (bot): f(x) = x²
  return BOWL.bot - (BOWL.bot - BOWL.rimY) * x * x;
}
const bx = (x: number) => BOWL.cx + x * BOWL.hw;

function bowlScene(f: Frame, c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const m = env.mood;
  // the paper bowl rises on twos (a cut-out pushed up from below the stage floor)
  const rise = easeIO(clamp01((tq - (b.landscape + 0.75)) / 0.75));
  // chapter 5's hills come in on 'bowl', beside it
  const miniA = win(t, b.bowl - 0.25, b.bowl + 0.5);
  miniHills(f, c, env, miniA);
  if (miniA > 0.01) stuckGlow(c, env, t, miniA);
  if (rise <= 0) return;
  c.save();
  c.translate(0, (1 - rise) * 380);
  // the bowl as a side-on paper landscape: the ground below the curve, a rim-lit edge
  bake(f, c, `${ID}/bowl2/${env.mood.id}`, { x: BOWL.cx - BOWL.hw - 160, y: BOWL.rimY - 40, w: BOWL.hw * 2 + 320, h: BOWL.floorY - BOWL.rimY + 120 }, (cc) => {
    const ground = new Path2D();
    // the rims round off into low shoulders that fall away to the stage floor at either side
    ground.moveTo(BOWL.cx - BOWL.hw - 150, BOWL.floorY + 80);
    ground.lineTo(BOWL.cx - BOWL.hw - 150, BOWL.floorY - 30);
    ground.bezierCurveTo(BOWL.cx - BOWL.hw - 110, BOWL.rimY + 40, BOWL.cx - BOWL.hw - 50, BOWL.rimY - 8, bx(-1), bowlY(-1));
    for (let i = -40; i <= 40; i++) ground.lineTo(bx(i / 40), bowlY(i / 40));
    ground.bezierCurveTo(BOWL.cx + BOWL.hw + 50, BOWL.rimY - 8, BOWL.cx + BOWL.hw + 110, BOWL.rimY + 40, BOWL.cx + BOWL.hw + 150, BOWL.floorY - 30);
    ground.lineTo(BOWL.cx + BOWL.hw + 150, BOWL.floorY + 80);
    ground.closePath();
    const g = cc.createLinearGradient(0, BOWL.rimY, 0, BOWL.floorY + 80);
    g.addColorStop(0, mixLab(m.setHaze, m.halo, 0.3));
    g.addColorStop(1, mixLab(m.set, m.fg, 0.3));
    cc.fillStyle = g;
    cc.fill(ground);
    cc.strokeStyle = withAlpha(m.rim, 0.75);
    cc.lineWidth = 2.4;
    cc.beginPath();
    cc.moveTo(bx(-1), bowlY(-1));
    for (let i = -40; i <= 40; i++) cc.lineTo(bx(i / 40), bowlY(i / 40));
    cc.stroke();
    // contour cut-lines inside the paper (layered paper: the bowl's depth)
    cc.strokeStyle = withAlpha(m.fg, 0.25);
    cc.lineWidth = 1.2;
    for (let k = 1; k <= 3; k++) {
      cc.beginPath();
      for (let i = -40; i <= 40; i++) {
        const x = bx(i / 40), y = bowlY(i / 40) + k * 22;
        if (i === -40) cc.moveTo(x, y);
        else cc.lineTo(x, y);
      }
      cc.stroke();
    }
  });
  c.restore();
  if (rise < 1) return;

  // the balls: the true descent iterates, one stride per twos-pair; left rim first, then right
  const ball = (xs: number[], t0: number, seed: number) => {
    const per = 0.11;
    const k = (tq - t0) / per;
    if (k < 0) return;
    const i = Math.min(xs.length - 2, Math.floor(k));
    const u = Math.min(1, k - i);
    const x = lerp(xs[i], xs[i + 1], sm(u));
    const px = bx(x), py = bowlY(x) - 11;
    const a = win(tq, t0 - 0.1, t0 + 0.1);
    // its trail: the iterates it has already visited, as small chalk dots on the bowl's face
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.75 * a);
    for (let j = 0; j <= i; j++) {
      if (Math.abs(xs[j]) < 0.03) break;
      c.beginPath();
      c.arc(bx(xs[j]), bowlY(xs[j]) - 11, 3.2, 0, Math.PI * 2);
      c.fill();
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(px, py, 1, px, py, 46);
    g.addColorStop(0, withAlpha(m.core, 0.9 * a));
    g.addColorStop(0.25, withAlpha(m.halo, 0.45 * a));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(px - 46, py - 46, 92, 92);
    c.restore();
    c.fillStyle = withAlpha(mixLab(m.core, '#fff4d8', 0.4), a);
    c.beginPath();
    c.arc(px, py, 9, 0, Math.PI * 2);
    c.fill();
    void seed;
  };
  ball(BOWL_ITER.left, b.bowl + 0.05, 1);
  ball(BOWL_ITER.right, b.proof + 0.5, 2); // from the opposite rim (≈ 21.9 s); both settle at the bottom by ≈ 23 s

  // the parchment tag pinned to the bowl's floor
  const tagU = clamp01((tq - (b.proof + 0.02)) / 0.35);
  if (tagU > 0) tag(c, env, tagU);

  // chapter 5's misty hills in miniature beside it: fog, the hollow, the timid traveller still stuck
  void tagU;
}

/** chapter 5's misty hills in miniature: unframed, feathered into the hall's haze (a paper-cut vignette, no frame) */
function miniHills(f: Frame, c: C, env: PaintEnv, a: number) {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  const pad = 30;
  bake(f, c, `${ID}/mini2/${env.mood.id}`, { x: MINI.x - pad, y: MINI.y - pad, w: MINI.w + pad * 2, h: MINI.h + pad * 2 }, (cc) => {
    mistyHills(cc, { x: MINI.x, y: MINI.y, w: MINI.w, h: MINI.h, lr: MISTY_LR.timid, step: 30, fog: 0.9, tangent: 0, trail: false, labels: false, reveal: 1 }, env);
    // feather every edge into the room (destination-in with a soft elliptical mask)
    cc.globalCompositeOperation = 'destination-in';
    const cx = MINI.x + MINI.w / 2, cy = MINI.y + MINI.h * 0.55;
    cc.save();
    cc.translate(cx, cy);
    cc.scale(1, MINI.h / MINI.w);
    const g = cc.createRadialGradient(0, 0, MINI.w * 0.34, 0, 0, MINI.w * 0.58);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    cc.fillStyle = g;
    cc.fillRect(-MINI.w, -MINI.w, MINI.w * 2, MINI.w * 2);
    cc.restore();
  });
  c.restore();
}

function tag(c: C, env: PaintEnv, u: number) {
  const text = 'convex: one global optimum';
  const px = bx(0), py = bowlY(0) + 4;
  c.save();
  // the payoff of 'with a proof': read at the legibility floor (camera and layer scale included)
  const sz = legibleSize(c, `500 22px ${FONT.mono}`, 22, text);
  c.font = `500 ${sz}px ${FONT.mono}`;
  const w = c.measureText(text).width + sz * 1.4;
  const h = sz * 1.75;
  const drop = 26;
  const y0 = py + drop;
  c.globalAlpha *= u;
  // the pin and its thread
  c.strokeStyle = withAlpha(MOODS.parchment.ink, 0.8);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(px, py);
  c.lineTo(px, y0);
  c.stroke();
  c.fillStyle = mixLab(env.mood.core, env.mood.halo, 0.4);
  c.beginPath();
  c.arc(px, py, 3.2, 0, Math.PI * 2);
  c.fill();
  // the tag itself (parchment), swinging in on twos
  c.translate(px, y0);
  c.rotate((1 - u) * 0.25);
  c.fillStyle = mixLab(MOODS.parchment.sky[0], '#fffaf0', 0.2);
  c.beginPath();
  c.moveTo(-w / 2, 0);
  c.lineTo(w / 2, 0);
  c.lineTo(w / 2, h);
  c.lineTo(-w / 2, h);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(MOODS.parchment.ink, 0.5);
  c.stroke();
  c.fillStyle = MOODS.parchment.ink;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, 0, h / 2 + 1);
  c.restore();
}

/** the stuck traveller's lantern in the miniature hills: a slow 0.5 Hz flicker (the doubt of chapter 5) */
const STUCK_X = descentPath(MISTY_LR.timid, -5.3, 60)[30];
function stuckGlow(c: C, env: PaintEnv, t: number, a: number) {
  const m = env.mood;
  const tx = MINI.x + ((STUCK_X + 6.4) / 12.8) * MINI.w;
  const ty = MINI.y + MINI.h * 0.9 - (lossF(STUCK_X) / 3.6) * MINI.h * 0.48 - 10;
  const fl = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.5 * t));
  c.save();
  c.globalCompositeOperation = 'lighter';
  const r = 30;
  const g = c.createRadialGradient(tx, ty, 1, tx, ty, r);
  g.addColorStop(0, withAlpha(m.core, 0.75 * fl * a));
  g.addColorStop(0.35, withAlpha(m.halo, 0.32 * fl * a));
  g.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = g;
  c.fillRect(tx - r, ty - r, 2 * r, 2 * r);
  c.restore();
}

/** panel 1's empty easel card: a small cut-paper easel (three legs) holding a blank card where the sheet will hang */
function easel(c: C, env: PaintEnv, u: number) {
  const m = env.mood;
  const sx = P1.x0 + 14, sy = STRIP.y0 + 40, sw = 196, sh = 330;
  c.save();
  c.globalAlpha *= u;
  c.fillStyle = withAlpha(m.ink, 0.85);
  c.strokeStyle = withAlpha(m.ink, 0.85);
  c.lineWidth = 4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(sx + sw * 0.3, sy + sh - 6);
  c.lineTo(sx + sw * 0.2, STRIP.y1 - 26);
  c.moveTo(sx + sw * 0.7, sy + sh - 6);
  c.lineTo(sx + sw * 0.8, STRIP.y1 - 26);
  c.moveTo(sx + sw * 0.5, sy - 8);
  c.lineTo(sx + sw * 0.5, sy + 4);
  c.stroke();
  // the ledge and the blank card (a shade darker than the strip: an empty frame, waiting)
  c.fillRect(sx - 6, sy + sh - 6, sw + 12, 6);
  c.strokeStyle = withAlpha(m.ink, 0.5);
  c.lineWidth = 1.4;
  c.strokeRect(sx, sy, sw, sh);
  c.restore();
}

void LAYERS;
