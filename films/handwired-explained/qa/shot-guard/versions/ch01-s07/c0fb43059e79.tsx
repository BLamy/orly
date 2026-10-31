/**
 * ch01-s07 — THE README'S SMALL PRINT, AND THE EMPTY RULE (scene, candleAmber; crossfade in from the plate; 16.6 s).
 * L0112 "Nothing's broken. It was built for whole numbers, and it took that on trust."
 * L0113 "This film is about promises like that: who tied them on, who doubted them, and how long they held." (refrain,
 *        first full use) — then 3.4 s of held silence.
 *
 * The tag-keeper's workshop (sets/tagLine, canonical): L2 paned window wall, L3 the bench with the dimmed HandwiredOS
 * desk, L4 the copper line at 58 % with the three slack suspects (3, 4, 5) and the blank why tag from ch01-s05, L6
 * the near post. Tag 6, the README's own promise, hangs at frame centre; the parchment plate from ch01-s06 lies on
 * the bench edge in front (L5), its 11 still in the tray.
 *
 *   0 → tilt        the camera starts low and close, on the plate at the foot of the frame (the 11 tile in its tray,
 *                   blurred, leaving frame); it cranes up (L5 slides out fastest) to the line
 *   ink (0.9)       tag 6 turns on its string into the lamplight at frame centre: its knot card reads the README
 *   'whole'         its front inks, verbatim from the README's comment: For an integer a (no stamp: the README's own
 *                   promise, not a suspect; the code is not repeated, so the tag carries no ternary)
 *   'trust'         the red pencil (frame RIGHT, plain cuff, the frame's only red) comes to the tag's edge, stops a
 *                   finger's width away, and withdraws without writing
 *   'promises'      the camera begins to ease back; on 'tied', 'doubted' and 'held' it steps back a little each time
 *                   until the tags and the line sit together in one wide frame
 *   'long'          the empty Lifespan Rule fades up along the bench edge with its tick labels, set in as one line
 *   silence         the hour, day, year and lifetime ticks warm in turn, left to right, 0.3 s apart (each a bigger
 *                   step along the log rule than the last); no thread drops (the encoding is not stated here)
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { CAMERA3_HOME, FONT, cam3Interp, capPx1080, defineShot, mixLab, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { RB, tile } from '../sets/rampBench';
import { RULE, TICKS, TAG, lifeX, lineYAt, SLOT_X, tagLineScene, tagsAt, type TagState } from '../sets/tagLine';
import { copperOf } from '../sets/narratorHands';

const ID = 'ch01-s07';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- the camera's stations
/** low and close: the plate at the foot of the frame, tag 6's lower half at the top */
const CAM_LOW: Camera3 = { x: 652, y: 612, z: 200, lens: 1.9 };
/** close on tag 6 at frame centre (L4 scale 2.5: the tag's front reads) */
const CAM_TAG: Camera3 = { x: 646, y: 500, z: 200, lens: 2.0 };
const CAM_EASE: Camera3 = { x: 645, y: 494, z: 190, lens: 1.93 };
const CAM_STEP1: Camera3 = { x: 640, y: 470, z: 150, lens: 1.6 };
const CAM_STEP2: Camera3 = { x: 640, y: 440, z: 90, lens: 1.3 };
/** the wide: tags, line and rule in one frame, the rule's labels above the caption band */
const CAM_WIDE: Camera3 = { x: 640, y: 400, z: 0, lens: 1.0 };
const l4Scale = (cam: Camera3) => (1000 * cam.lens) / (1000 - cam.z);
const K_TAG = l4Scale(CAM_TAG);

const X6 = SLOT_X['6'];
const BASE = tagsAt(ID, 'start');
/** the knot card's canonical size (sets/tagLine drawTag: 6.6 px Cormorant SC) */
const KNOT_FS = 6.6;
const KNOT = 'the README';

interface Beats {
  tilt: number;
  turn: number;
  inkAt: number;
  pencilAt: number;
  pencilDur: number;
  ease0: number;
  step1: number;
  step2: number;
  step3: number;
  rule: number;
  ticks: number[];
  D: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const pencilDur = 2.6;
    const b: Beats = {
      tilt: T.beat('tilt'),
      turn: T.beat('ink'),
      inkAt: T.word('L0112', 'whole') - 0.1,
      // the pencil's approach ends on 'trust' (hover: approach 0-.35, hold .35-.75, withdraw .75-1)
      pencilAt: T.beat('pencil') - 0.35 * pencilDur,
      pencilDur,
      ease0: T.word('L0113', 'promises'),
      step1: T.beat('tied'),
      step2: T.beat('doubted'),
      step3: T.beat('held'),
      rule: T.beat('rule'),
      ticks: ['hour', 'day', 'year', 'lifetime'].map((k) => T.beat(k)),
      D,
    };
    const cam = tl.channel<Camera3>('cam', CAM_LOW, cam3Interp);
    tl.tween(cam, CAM_TAG, { at: b.tilt, dur: 2.3, ease: ease.move });
    tl.tween(cam, CAM_EASE, { at: b.ease0, dur: b.step1 - 0.2 - b.ease0, ease: ease.move });
    tl.tween(cam, CAM_STEP1, { at: b.step1 - 0.2, dur: 1.25, ease: ease.move });
    tl.tween(cam, CAM_STEP2, { at: b.step2 - 0.15, dur: 1.3, ease: ease.move });
    tl.tween(cam, CAM_WIDE, { at: b.step3 - 0.12, dur: 1.5, ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const cam = s.get(scene.cam);
    f.camera(cam);
    const k = l4Scale(cam);
    /** 0 at the close-up, 1 at the wide */
    const back = clamp01((K_TAG - k) / (K_TAG - 1));
    const subject = t < b.ease0;

    // ---------- tag 6: turns into the light, inks the README's small print (no ternary, no stamp, no thread)
    const turn = win(tq, b.turn, b.turn + 1.0);
    const settle = Math.exp(-Math.max(0, tq - (b.turn + 1.0)) * 1.3);
    const six: TagState = {
      id: '6',
      flip: 0.62 * (1 - turn),
      ink: clamp01((tq - b.inkAt) / 1.1),
      knot: [],
      sub: '',
      glow: 0.15 + 0.45 * turn * (0.45 + 0.55 * settle),
      swing: 0.02 + 0.05 * turn * settle,
      phase: 0.4,
      subject,
    };
    const tags: TagState[] = [...BASE.filter((x) => x.id !== 'why'), six, ...BASE.filter((x) => x.id === 'why')];

    // ---------- the Lifespan Rule: fades up on 'long', labels with it; ticks warm in the silence
    const ruleA = win(t, b.rule - 0.1, b.rule + 0.9);
    const warm = b.ticks.map((at) => win(t, at - 0.06, at + 0.3));

    // ---------- the red pencil: hovers at tag 6's edge on 'trust', writes nothing
    const pu = (tq - b.pencilAt) / b.pencilDur;
    // the tag's right edge, low (below the README card): the hover pose puts the lead a finger's width outside it
    const edge = { x: X6 + TAG.w / 2 - 9, y: lineYAt(X6) + TAG.string + TAG.h * 0.66 };

    tagLineScene(f, {
      variant: 'workshop',
      key: ID,
      tags,
      rule: { alpha: ruleA, labels: win(t, b.rule + 0.05, b.rule + 0.95), labelSubject: true },
      pencilOnPost: false,
      // the desk on the bench stays a dimmed silhouette; while the camera is close a fog bank lies between it and the
      // line, so the tags read against soft haze instead of the desk's busy screen
      desk: { lamp: 0.25 },
      l3: (c, env) => deskVeil(c, env, 0.72 * (1 - sm(back * 1.25)) + 0.1),
      l4: (c, env) => {
        if (turn > 0) knotCard(c, env, f.pxScale, turn, subject, back, k);
        if (ruleA > 0) warmTicks(c, env, warm, ruleA);
        if (pu > 0 && pu < 1) hands.draw(c, hands.pencil('hover', pu, edge, { entry: hands.entry(cam, 'L4').pencil }), env);
      },
      l5: (c, env) => {
        if (t < b.tilt + 2.4) plateOnBench(f, c, env);
      },
    });
  },
});

// ---------------------------------------------------------------- tag 6's knot card (legible while it is the subject)
const ratioCache = new Map<string, number>();
function capRatio(c: C, font100: string, text: string, pxScale: number): number {
  const key = `${font100}|${text}|${pxScale}`;
  let r = ratioCache.get(key);
  if (r === undefined) {
    c.save();
    c.setTransform(pxScale, 0, 0, pxScale, 0, 0);
    r = capPx1080(c, font100, text) / 150;
    c.restore();
    if (r > 0.2) ratioCache.set(key, r);
  }
  return r;
}
/**
 * The README's name card threaded through tag 6's eyelet, in the tagLine set's knot-card style. Close up it is set at
 * the legibility floor for the close camera (a name card the viewer reads); as the camera steps back it eases to the
 * set's canonical size, so the wide matches every later shot.
 */
function knotCard(c: C, env: PaintEnv, pxScale: number, turn: number, subject: boolean, back: number, k: number) {
  const ratio = capRatio(c, `600 100px ${FONT.sc}`, KNOT, pxScale);
  const fsClose = Math.max(KNOT_FS, (22 * 1.03) / (ratio * 1.5 * K_TAG));
  const fs = lerp(fsClose, KNOT_FS, sm(back * 1.15));
  void k;
  const eye = { x: X6, y: lineYAt(X6) + TAG.string };
  textRole(c, subject ? 'subject' : 'texture', () => {
    c.save();
    c.globalAlpha *= sm(turn * 1.4);
    c.font = `600 ${fs.toFixed(2)}px ${FONT.sc}`;
    const tw = c.measureText(KNOT).width;
    const cw = tw + fs * 1.2, ch = fs * 1.9;
    // hung to the RIGHT of the eyelet here (tag 7's slot is still empty), clear of tag 5
    // (far enough out on its thread that the pencil's hover on 'trust' falls in the gap between tag and card)
    const kx = eye.x + TAG.w / 2 + 64, ky = eye.y - ch * 0.75 + (1 - turn) * -6;
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
    c.fillRect(kx + 1.5, ky + 2, cw, ch);
    c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.haze, env.layer.haze * 0.6);
    c.fillRect(kx, ky, cw, ch);
    c.strokeStyle = withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.85);
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(kx, ky + ch * 0.5);
    c.quadraticCurveTo((kx + eye.x) / 2, eye.y + 14, eye.x, eye.y + 7);
    c.stroke();
    c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
    c.textBaseline = 'middle';
    c.fillText(KNOT, kx + fs * 0.6, ky + ch * 0.55);
    c.restore();
  });
}

// ---------------------------------------------------------------- a fog bank over the bench desk (L3)
function deskVeil(c: C, env: PaintEnv, a: number) {
  if (a <= 0.01) return;
  c.save();
  c.translate(650, 468);
  c.scale(2.5, 1);
  const g = c.createRadialGradient(0, 0, 10, 0, 0, 200);
  g.addColorStop(0, withAlpha(env.mood.haze, a));
  g.addColorStop(0.6, withAlpha(env.mood.haze, a * 0.8));
  g.addColorStop(1, withAlpha(env.mood.haze, 0));
  c.fillStyle = g;
  c.fillRect(-200, -200, 400, 400);
  c.restore();
}

// ---------------------------------------------------------------- the four labelled ticks warming in turn
function warmTicks(c: C, env: PaintEnv, warm: number[], a: number) {
  const labelled = TICKS.filter((tk) => tk.label);
  c.save();
  labelled.forEach((tk, i) => {
    const w = warm[i] * a;
    if (w <= 0) return;
    const x = lifeX(tk.days);
    // the copper tick runs hot
    c.strokeStyle = withAlpha(copperOf(env, 1), w);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x, RULE.y);
    c.lineTo(x, RULE.y + RULE.h * 0.62);
    c.stroke();
    // and throws a small warm pool on the paper around it
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, RULE.y + 10, 1, x, RULE.y + 10, 30);
    g.addColorStop(0, withAlpha(env.mood.core, 0.38 * w));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - 32, RULE.y - 22, 64, 64);
    c.globalCompositeOperation = 'source-over';
  });
  c.restore();
}

// ---------------------------------------------------------------- ch01-s06's plate on the bench edge (L5, leaving frame)
const PLATE = { x: 470, y: 728, w: 470, h: 170 };
function plateOnBench(f: Frame, c: C, env: PaintEnv) {
  f.cached(`${ID}/plate/${env.mood.id}`, PLATE.w + 80, PLATE.h + 80, (cc) => {
    cc.translate(40 - PLATE.x, 40 - PLATE.y);
    paintPlate(cc, env);
  })(c, PLATE.x - 40, PLATE.y - 40);
}
function paintPlate(c: C, env: PaintEnv) {
  const { x, y, w, h } = PLATE;
  // the parchment sheet, lamp-warm, its top edge catching the light
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.4);
  c.fillRect(x + 4, y + 6, w, h);
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, mixLab(mixLab('#e8d6ac', env.mood.halo, 0.35), env.mood.core, 0.15));
  g.addColorStop(1, mixLab(mixLab('#cdb689', env.mood.halo, 0.3), env.mood.set, 0.35));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  // the machine's foot as it stood at the end of ch01-s06: board ends, the lever at its halfway rest, the housing,
  // the tray with its 11
  const ink = PUPPET_NEAR_BLACK;
  const fy = y + 118;
  c.fillStyle = ink;
  c.fillRect(x + 18, fy - 7, 150, 7); // board one's flat run
  c.save();
  c.translate(x + 168, fy - 4);
  c.rotate(-Math.PI / 4);
  c.fillRect(0, -6, 120, 7);
  c.restore();
  const lx = x + 300;
  c.fillRect(lx - 3, fy - 92, 6, 60); // lever stand
  c.beginPath();
  c.moveTo(lx - 3, fy - 92);
  c.lineTo(lx, fy - 132); // the needle, upright: halfway
  c.lineTo(lx + 3, fy - 92);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(lx, fy - 92, 6, 0, Math.PI * 2);
  c.fill();
  c.fillRect(lx - 24, fy - 48, 50, 48); // housing
  c.fillRect(lx + 26, fy - 5, 110, 5); // tray
  tile(c, env, lx + 82, fy - 5, RB.fmt(RB.result(4.5)), { s: 1.1 });
  // the floor rule
  c.fillStyle = mixLab(mixLab('#d8c393', env.mood.halo, 0.3), env.mood.set, 0.15);
  c.fillRect(x + 12, fy, 260, 7);
}
