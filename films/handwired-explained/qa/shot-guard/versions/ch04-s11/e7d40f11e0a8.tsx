/**
 * ch04-s11 — SIXTEEN AGAINST TWO (plate, parchment; crossfade in from the lens train; 7.3 s).
 * L0422 "Sixteen against two. One honest sentence about your input saves fourteen operations."
 *
 * The lamp-lit parchment plate of Deep Dive I (sets/ch04-s12-plate). Drawn side by side in ink: the lens train of
 * ch04-s10 (left, long: sets/ch04-s10-lenses in its 'ink' style, with its 16 operation marks) and the small two-board
 * grid rig of ch04-s08 (right, with its 2 marks), tag 6 ('grid 1') on the rig's wire; the copper line across the top.
 * TEACHES, word by word (PR12, script):
 *   'Sixteen'    the lens train's count inks under it: 'a range only: 16 ops · 15 layers' (beat compare);
 *   'two'        the small rig's: 'grid 1: 2 ops · 2 layers'
 *   'sentence'   the 'grid 1' tag glows copper: the one honest sentence (beat honest)
 *   'fourteen'   fourteen of the lens train's sixteen marks fade, one by one, leaving two, as many as the small rig
 *                (beat fourteen)
 *   hold         the narrator's hand unties tag 6 from the wire and carries it back up to the copper line, where it
 *                hangs again with its small print 'For an integer a' showing, a slack thread under it (beat return)
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { CAMERA3_HOME, cam3Interp, defineShot, withAlpha } from '../../../film';
import { hands } from '../cast';
import { copperOf, type HandsPose, type Held, type Pt } from '../sets/narratorHands';
import { COPPER_INK, INK, PLATE_INK, inkText, plateNear, plateRoom } from '../sets/ch04-s12-plate';
import { LT, PIN_X, lensTrain } from '../sets/ch04-s10-lenses';
import { G, tag6 } from '../sets/ch04-s08-grid';

const ID = 'ch04-s11';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

/** the lens train drawn at k about (TX, TY) (plate px) */
const TR = { x: 54, y: 474, k: 1 };
const trX = (x: number) => TR.x + x * TR.k;
const trY = (y: number) => TR.y + (y - LT.Y) * TR.k;
/** the small rig (plate px): its rule, board A (ramp) and B (bit); its wire and the knot of tag 6 */
/** (review: the two rigs are drawn in two rows from ONE left edge at ONE scale, so their lengths compare at a glance:
 *  the small rig above, the lens train below running nearly the plate's width) */
const RIG = { x0: 332, x1: 560, y: 300, VA: 46, hinge: 452, bx0: 482, bx1: 552 };
const WIRE = { x0: 40, y: 168, bendX: 318 };
const K_WIRE: Pt = { x: 196, y: WIRE.y };
const LINE_Y = 64;
const K_LINE: Pt = { x: 196, y: LINE_Y + 6 };
const TS = G.TAG_S;
const HAND_S = 1.2;
const LIFT = 1.7;
/** the two marks the lens train keeps (the d and the bit), the order the other fourteen fade in */
const KEEP = [0, 15];
const FADE_ORDER = PIN_X.map((_, i) => i).filter((i) => !KEEP.includes(i));

interface Beats {
  compare: number;
  two: number;
  honest: number;
  fourteen: number;
  liftAt: number;
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const ret = T.beat('return');
    const b: Beats = {
      compare: T.beat('compare'),
      two: T.word('L0422', 'two'),
      honest: T.beat('honest'),
      fourteen: T.beat('fourteen'),
      // lifted off the wire just before 'return', let go on the line just after it
      liftAt: ret - 0.45 * LIFT,
    };
    const cam = tl.channel<Camera3>('cam', { ...CAMERA3_HOME, z: 0 }, cam3Interp);
    tl.tween(cam, { x: 664, y: 350, z: 46, lens: 1 }, { at: 0, dur: D, ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b, D };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const cam = s.get(scene.cam);
    f.camera(cam);
    plateRoom(f, { key: ID });
    const hp = handPose(tq, b, cam);
    f.layer(PLATE_INK, (c, env) => {
      copperLine(c, env);
      // the lens train, long, in ink
      c.save();
      c.translate(TR.x, TR.y - LT.Y * TR.k);
      c.scale(TR.k, TR.k);
      lensTrain(c, env, { style: 'ink', front: 0 });
      c.restore();
      trainMarks(c, t, b);
      smallRig(c, env);
      labels(c, t, b);
      drawTag(c, env, t, tq, b, hp);
      if (hp) hands.draw(c, hp, env, { heldDraw: (cc, at, held, e) => heldDraw(cc, e, at, held, t, b) });
    });
    plateNear(f, ID);
  },
});

// ---------------------------------------------------------------- the copper line across the top of the plate
function copperLine(c: C, env: PaintEnv) {
  c.strokeStyle = withAlpha(INK, 0.9);
  c.lineWidth = 4.2;
  c.beginPath();
  c.moveTo(20, LINE_Y);
  c.quadraticCurveTo(640, LINE_Y + 12, 1260, LINE_Y);
  c.stroke();
  c.strokeStyle = copperOf(env, 0.3);
  c.lineWidth = 2.4;
  c.stroke();
}

// ---------------------------------------------------------------- the marks: 16 under the train, 2 under the rig
function trainMarks(c: C, t: number, b: Beats) {
  const y = trY(LT.PIN_Y);
  PIN_X.forEach((x, i) => {
    let a = 1;
    const k = FADE_ORDER.indexOf(i);
    if (k >= 0) {
      const at = b.fourteen + k * 0.085;
      a = 1 - win(t, at, at + 0.18);
    }
    if (a <= 0.001) return;
    c.fillStyle = withAlpha(INK, 0.85 * a);
    c.beginPath();
    c.arc(trX(x), y, 5.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(COPPER_INK, 0.9 * a);
    c.beginPath();
    c.arc(trX(x), y, 2.6, 0, Math.PI * 2);
    c.fill();
  });
}
function smallRig(c: C, env: PaintEnv) {
  const { x0, x1, y, VA, hinge, bx0, bx1 } = RIG;
  c.save();
  c.strokeStyle = INK;
  c.fillStyle = INK;
  c.lineJoin = 'round';
  // the rule
  c.fillStyle = withAlpha('#c9b083', 0.7);
  c.fillRect(x0 - 8, y, x1 - x0 + 16, 7);
  c.strokeStyle = withAlpha(INK, 0.8);
  c.lineWidth = 1.2;
  c.strokeRect(x0 - 8, y, x1 - x0 + 16, 7);
  // board A: relu(5 − a): high at the left, flat from its hinge
  c.lineWidth = 6;
  c.strokeStyle = INK;
  c.beginPath();
  c.moveTo(x0, y - 4 - VA * 1.6);
  c.lineTo(hinge, y - 4);
  c.lineTo(bx0 - 8, y - 4);
  c.stroke();
  // board B: relu(1 − ramp), a little board beside it
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(bx0, y - 4 - 34);
  c.lineTo((bx0 + bx1) / 2, y - 4);
  c.lineTo(bx1, y - 4);
  c.stroke();
  // hinge pins
  c.fillStyle = COPPER_INK;
  for (const x of [hinge, (bx0 + bx1) / 2]) {
    c.beginPath();
    c.arc(x, y - 3, 3.6, 0, Math.PI * 2);
    c.fill();
  }
  // its two operation marks (one per board)
  for (const x of [(x0 + hinge) / 2, (bx0 + bx1) / 2]) {
    c.fillStyle = withAlpha(INK, 0.85);
    c.beginPath();
    c.arc(x, RIG.y + 36, 5.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(COPPER_INK, 0.9);
    c.beginPath();
    c.arc(x, RIG.y + 36, 2.6, 0, Math.PI * 2);
    c.fill();
  }
  // the wire of a: in from the left, bending down onto the rule
  c.strokeStyle = withAlpha(INK, 0.9);
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(WIRE.x0, WIRE.y);
  c.lineTo(WIRE.bendX - 20, WIRE.y);
  c.quadraticCurveTo(WIRE.bendX, WIRE.y, WIRE.bendX, WIRE.y + 20);
  c.lineTo(WIRE.bendX, y - 16);
  c.quadraticCurveTo(WIRE.bendX, y - 4, WIRE.bendX + 12, y - 4);
  c.stroke();
  c.strokeStyle = copperOf(env, 0.25);
  c.lineWidth = 2.2;
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- the counts
function labels(c: C, t: number, b: Beats) {
  const aL = win(t, b.compare - 0.05, b.compare + 0.25);
  const aR = win(t, b.two - 0.1, b.two + 0.2);
  inkText(c, 'a range only: 16 ops · 15 layers', 640, trY(LT.PIN_Y) + 50, { size: 26, align: 'center', alpha: aL, id: `${ID}/left` });
  inkText(c, 'grid 1: 2 ops · 2 layers', 640, RIG.y + 12, { size: 26, align: 'left', alpha: aR, color: INK, id: `${ID}/right` });
}

// ---------------------------------------------------------------- tag 6 and the hand
function drawTag(c: C, env: PaintEnv, t: number, tq: number, b: Beats, hp: (HandsPose & { held?: boolean }) | null) {
  const glow = win(t, b.honest - 0.1, b.honest + 0.25) * (1 - 0.5 * win(t, b.honest + 1.2, b.honest + 2.2));
  const releasedAt = b.liftAt + 0.62 * LIFT;
  const liftedAt = b.liftAt + 0.36 * LIFT;
  if (t < liftedAt) {
    if (glow > 0) halo(c, env, { x: K_WIRE.x, y: K_WIRE.y + 24 * TS + 60 * TS * 0.6 }, glow);
    tag6(c, env, { knot: K_WIRE, eye: { x: K_WIRE.x, y: K_WIRE.y + 24 * TS }, grid: 1, glow: 0.6 * glow, swing: 0.02 * Math.sin(tq * 1.7 + 2.1), id: `${ID}/tag6`, subject: true });
  } else if (t >= releasedAt) {
    // back on the line: its README print shows again; a slack thread hangs under it
    const g = 1 - clamp01((t - releasedAt - 0.1) / 0.55);
    const sw = 0.05 * Math.exp(-(tq - releasedAt) * 1.8) * Math.sin((tq - releasedAt) * 7) + 0.015 * Math.sin(tq * 1.6);
    const eye = { x: K_LINE.x, y: K_LINE.y + 24 * TS };
    c.strokeStyle = withAlpha(INK, 0.55);
    c.lineWidth = 1.2;
    c.beginPath();
    const by = eye.y + 86 * TS;
    c.moveTo(eye.x, by);
    c.bezierCurveTo(eye.x - 8, by + 30, eye.x + 16, by + 36, eye.x + 6, by + 56);
    c.stroke();
    tag6(c, env, { knot: K_LINE, eye, grid: g, swing: sw, id: `${ID}/tag6`, subject: true });
  }
  void hp;
}
function halo(c: C, env: PaintEnv, at: Pt, k: number) {
  const g = c.createRadialGradient(at.x, at.y, 6, at.x, at.y, 130);
  g.addColorStop(0, withAlpha(copperOf(env, 0.8), 0.45 * k));
  g.addColorStop(1, withAlpha(copperOf(env, 0.8), 0));
  c.fillStyle = g;
  c.fillRect(at.x - 130, at.y - 130, 260, 260);
}
function heldDraw(c: C, env: PaintEnv, at: Pt, held: Held, t: number, b: Beats) {
  if (held !== 'tag') return;
  void t;
  void b;
  tag6(c, env, { knot: at, eye: { x: at.x, y: at.y + 24 * TS }, grid: 1, id: `${ID}/tag6`, subject: true });
}
function handPose(tq: number, b: Beats, cam: Camera3): HandsPose | null {
  if (tq < b.liftAt || tq > b.liftAt + LIFT) return null;
  return hands.act('lift', (tq - b.liftAt) / LIFT, K_WIRE, { scale: HAND_S, entry: hands.entry(cam, 'L3'), held: 'tag', dropAt: K_LINE });
}
