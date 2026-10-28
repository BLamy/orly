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
 *
 * Review round 1 (reviser): the README card sits tight at tag 6's shoulder, above-left of the eyelet, sized like tag
 * 4's card in ch01-s05; the close medium is framed so tag 3 to tag 6 sit inside 5-95 % of the width; a blurred near
 * post (L6) holds the frame's right edge and the bench's dark top edge (L5) crosses the foot of the frame through the
 * close-up, so the pale tags read against near-black; the rule's labels are painted here one by one, each only once
 * it is wholly inside the frame (no clipped word), and each brightens with its warming tick; the pencil hand's pinch
 * shows a sliver of light between thumb and forefinger and a warm rim.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { CAMERA3_HOME, FONT, cam3Interp, capPx1080, defineShot, mixLab, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { LAYERS } from '../../../film/contracts';
import { toLayer } from '../../../film/core/multiplane';
import { legibleSize } from '../../../film/silhouette/type';
import { hands } from '../cast';
import { RB, tile } from '../sets/rampBench';
import { RULE, TICKS, TAG, lifeX, lineYAt, SLOT_X, tagLineScene, tagsAt, type TagState } from '../sets/tagLine';
import { HAND_LEN, copperOf, type HandsPose } from '../sets/narratorHands';

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
const CAM_LOW: Camera3 = { x: 636, y: 612, z: 200, lens: 1.84 };
/** close on tag 6 near frame centre (L4 scale 2.35: the tag's front reads; tags 3-6 inside 5-95 % of the width) */
const CAM_TAG: Camera3 = { x: 620, y: 500, z: 200, lens: 1.88 };
const CAM_EASE: Camera3 = { x: 622, y: 494, z: 190, lens: 1.83 };
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
    tl.tween(cam, CAM_WIDE, { at: b.step3 - 0.12, dur: 0.9, ease: ease.move });
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
      // the rule's labels are painted below (ruleLabels), each only once it is wholly inside the frame
      rule: { alpha: ruleA, labels: 0 },
      pencilOnPost: false,
      // the desk on the bench stays a dimmed silhouette; while the camera is close a fog bank lies between it and the
      // line, so the tags read against soft haze instead of the desk's busy screen
      desk: { lamp: 0.25 },
      l3: (c, env) => deskVeil(c, env, 0.72 * (1 - sm(back * 1.25)) + 0.1),
      l4: (c, env) => {
        if (turn > 0) knotCard(c, env, f.pxScale, turn, subject, back, k);
        if (ruleA > 0) warmTicks(c, env, warm, ruleA);
        if (ruleA > 0) ruleLabels(c, env, cam, ruleA * win(t, b.rule + 0.05, b.rule + 0.75), warm);
        if (pu > 0 && pu < 1) {
          const pp = hands.pencil('hover', pu, edge, { entry: hands.entry(cam, 'L4').pencil });
          hands.draw(c, pp, env);
          pinchLight(c, env, pp);
        }
      },
      l5: (c, env) => {
        // the bench's dark top edge across the foot of the frame while the camera is close
        const band = 1 - sm(back * 1.7);
        if (band > 0.01) benchBand(c, env, cam, band);
        if (t < b.tilt + 2.4) plateOnBench(f, c, env);
      },
      l6: (c, env) => {
        // the near post holds the frame's right edge through the close-up; the canonical post takes over in the wide
        const a = 1 - sm((back - 0.45) / 0.45);
        if (a > 0.01) nearPostClose(c, env, cam, a);
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
  void pxScale;
  // sized like tag 4's card in ch01-s05: just over the legibility floor AT THE CLOSE CAMERA (legibleSize measures the
  // current transform; scaling by k / K_TAG gives the size it would need at CAM_TAG, so the card never swells as the
  // camera pulls back), easing to the set's canonical size in the wide
  const floorNow = legibleSize(c, `600 ${KNOT_FS}px ${FONT.sc}`, KNOT_FS, KNOT);
  const fsClose = Math.max(KNOT_FS, ((floorNow * k) / K_TAG) * 1.02);
  const fs = lerp(fsClose, KNOT_FS, sm(back * 1.15));
  const eye = { x: X6, y: lineYAt(X6) + TAG.string + 7 };
  c.save();
  c.globalAlpha *= sm(turn * 1.4);
  c.font = `600 ${fs.toFixed(2)}px ${FONT.sc}`;
  const tw = c.measureText(KNOT).width;
  const cw = tw + fs * 0.8, ch = fs * 1.45;
  // threaded through the eyelet: tight at tag 6's left shoulder, above-left of the eyelet (as tag 4's in ch01-s05)
  const kx = eye.x - cw - 6, ky = eye.y - ch * 0.4 - 7 + (1 - turn) * -6;
  const m = c.getTransform();
  const px = 1 / (Math.hypot(m.a, m.b) || 1);
  // the thread from the card's punched hole to the eyelet
  c.strokeStyle = withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.85);
  c.lineWidth = px;
  c.beginPath();
  c.moveTo(kx + cw - fs * 0.32, ky + ch * 0.5);
  c.quadraticCurveTo(eye.x - 3, ky + ch * 0.9, eye.x - 1, eye.y);
  c.stroke();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(kx + 1.5, ky + 2, cw, ch);
  c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.haze, env.layer.haze * 0.6);
  c.fillRect(kx, ky, cw, ch);
  // a punched hole at its right end, where the thread goes through
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7);
  c.beginPath();
  c.arc(kx + cw - fs * 0.32, ky + ch * 0.5, fs * 0.09, 0, Math.PI * 2);
  c.fill();
  textRole(c, subject ? 'subject' : 'texture', () => {
    c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillText(KNOT, kx + fs * 0.3, ky + ch * 0.55);
  });
  c.restore();
}

// ---------------------------------------------------------------- the close-up's near-black frame (L5 band, L6 post)
/** L5: the bench's top edge, a dark band across the foot of the frame (screen-anchored while the camera is close) */
function benchBand(c: C, env: PaintEnv, cam: Camera3, a: number) {
  const L = LAYERS.L5;
  const p0 = toLayer(L, cam, -60, 652);
  const p1 = toLayer(L, cam, 1340, 760);
  const lip = toLayer(L, cam, 0, 640).y;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(p0.x, lip + (p0.y - lip) * 0.4);
  c.lineTo(p1.x, lip);
  c.lineTo(p1.x, p1.y);
  c.lineTo(p0.x, p1.y);
  c.closePath();
  c.fill();
  // a thin warm rim on its top only
  const k = Math.hypot(c.getTransform().a, c.getTransform().b) || 1;
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.55), 0.7);
  c.lineWidth = 2.4 / k;
  c.beginPath();
  c.moveTo(p0.x, lip + (p0.y - lip) * 0.4);
  c.lineTo(p1.x, lip);
  c.stroke();
  c.restore();
}
/** L6: a turned post at the frame's right edge while the camera is close (the canonical post is off frame then) */
function nearPostClose(c: C, env: PaintEnv, cam: Camera3, a: number) {
  const L = LAYERS.L6;
  const o = toLayer(L, cam, 1214, 0);
  const one = toLayer(L, cam, 1215, 0).x - o.x; // layer units per screen px
  const sy = (y: number) => toLayer(L, cam, 0, y).y;
  const w = (px: number) => px * one;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.ellipse(o.x, sy(200), w(30), w(22), 0, 0, Math.PI * 2);
  c.rect(o.x - w(34), sy(214), w(68), w(18));
  c.rect(o.x - w(24), sy(228), w(48), sy(800) - sy(228));
  c.rect(o.x - w(40), sy(420), w(80), w(20));
  c.fill();
  c.restore();
  void env;
}

// ---------------------------------------------------------------- the pencil hand's pinch, cut clearer
/** hand-local (unit = hand length) → world, as narratorHands' rig maps it */
function handPt(a: NonNullable<HandsPose['right']>, len: number, lx: number, ly: number) {
  const fy = (Math.cos(a.angle) < 0 ? -1 : 1) * (a.palmUp ? -1 : 1);
  const bd = a.bend ?? 0;
  const x1 = lx * Math.cos(bd) - ly * Math.sin(bd);
  const y1 = lx * Math.sin(bd) + ly * Math.cos(bd);
  const x2 = x1 * len, y2 = y1 * len * fy;
  const A = a.angle;
  return { x: a.wrist.x + x2 * Math.cos(A) - y2 * Math.sin(A), y: a.wrist.y + x2 * Math.sin(A) + y2 * Math.cos(A) };
}
/**
 * A sliver of light between thumb and forefinger (so the pinch reads as a hand at a glance, not a mitt), the pencil
 * re-laid over it, and a warm 2.5 px rim on the thumb's and knuckles' lit edge.
 */
function pinchLight(c: C, env: PaintEnv, pp: HandsPose) {
  const a = pp.right;
  if (!a || a.shape !== 'pinch') return;
  const len = HAND_LEN * (pp.scale ?? 1);
  const m = c.getTransform();
  const dev = Math.hypot(m.a, m.b) || 1;
  const P = (x: number, y: number) => handPt(a, len, x, y);
  c.save();
  c.globalAlpha *= pp.presence ?? 1;
  // the gap: a tapered sliver in the backlight's colour, from the web of the hand out to between the fingertips
  const gap = [P(0.58, -0.152), P(0.66, -0.142), P(0.73, -0.128), P(0.775, -0.112)];
  c.strokeStyle = mixLab(mixLab(env.mood.haze, env.mood.core, 0.45), '#fff1d8', 0.15);
  c.lineCap = 'round';
  for (let i = 0; i < gap.length - 1; i++) {
    c.lineWidth = (2.2 + i * 0.9) / dev;
    c.beginPath();
    c.moveTo(gap[i].x, gap[i].y);
    c.lineTo(gap[i + 1].x, gap[i + 1].y);
    c.stroke();
  }
  // the pencil again on top (the rig draws it in the pinch; the sliver must not cross it)
  if (pp.tip) {
    const facingLeft = Math.cos(a.angle) < 0;
    const follow = 0.25 * (a.angle - (facingLeft ? -2.4 : -0.74)) + 0.5 * (a.bend ?? 0);
    const ang = (facingLeft ? 2.2 : Math.PI - 2.2) + follow;
    hands.drawPencil(c, pp.tip, ang, len, env);
  }
  // a warm rim on the thumb's lit edge and over the knuckles (floored at 2.5 px)
  c.strokeStyle = withAlpha(mixLab(mixLab(env.mood.rim, env.mood.core, 0.6), '#e9a46a', 0.3), 0.9);
  c.lineWidth = Math.max(2.5, 2.25) / dev;
  c.beginPath();
  const rim = [P(0.18, -0.225), P(0.32, -0.25), P(0.46, -0.258), P(0.6, -0.24), P(0.72, -0.212)];
  rim.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
  c.stroke();
  c.restore();
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
    const g = c.createRadialGradient(x, RULE.y + 10, 1, x, RULE.y + 10, 46);
    g.addColorStop(0, withAlpha(env.mood.core, 0.6 * w));
    g.addColorStop(0.5, withAlpha(env.mood.core, 0.22 * w));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - 48, RULE.y - 38, 96, 96);
    c.globalCompositeOperation = 'source-over';
  });
  c.restore();
}

/**
 * The rule's four labels (an hour · a day · a year · a lifetime), set as in the tagLine set's drawRule, but each one
 * appears only once it lies wholly inside the frame (5-95 % of the width), so no clipped word is ever on screen; each
 * brightens about 15 % as its tick warms.
 */
function ruleLabels(c: C, env: PaintEnv, cam: Camera3, a: number, warm: number[]) {
  if (a <= 0.01) return;
  const L = LAYERS.L4;
  const lo = toLayer(L, cam, 1280 * 0.05, 0).x;
  const hi = toLayer(L, cam, 1280 * 0.95, 0).x;
  const labelled = TICKS.filter((tk) => tk.label);
  textRole(c, 'subject', () => {
    c.save();
    const base = `italic 15px ${FONT.display}`;
    const size = legibleSize(c, base, 15);
    c.font = `italic ${size}px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    labelled.forEach((tk, i) => {
      const x = lifeX(tk.days);
      const hw = c.measureText(tk.label!).width / 2;
      const inside = clamp01(Math.min(x - hw - lo, hi - (x + hw)) / 14);
      const la = a * inside;
      if (la <= 0) return;
      const w = clamp01(warm[i] ?? 0);
      c.fillStyle = withAlpha(mixLab(mixLab(env.mood.core, env.mood.rim, 0.3), '#fff6e2', 0.15 * w), Math.min(1, (0.82 + 0.15 * w) * la));
      c.fillText(tk.label!, x, RULE.y + RULE.h + 6);
    });
    c.restore();
  });
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
