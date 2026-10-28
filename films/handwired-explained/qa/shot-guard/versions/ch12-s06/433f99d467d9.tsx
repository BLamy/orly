/**
 * ch12-s06 — THE LAST HANDS (scene, parchment; a cut from ch12-s05's push on the Notes window; 10.67 s).
 * L1209 "Who ties the next one on? Who doubts it? How long will it hold?"   (soft, a breath after each)
 * L1210 "It's waiting for the next pair of hands."                          (soft; nothing after it)
 *
 * A macro on the HandwiredOS desk's one copper wire under the dock (OS18; sets/ch12-s06-close): the warm paper desk
 * fills the frame lit from the upper left, the three dock tiles stand soft at the upper left, the wire runs in from
 * frame left to its end ring, and a short length is hooked through the ring. The narrator's hands are already on it
 * at the cut, the right one carrying the BLANK tag by its string:
 *   bend (0.3)      the left hand holds the flat, the right turns the free end up about the corner: flat, then up at
 *                   45 deg, the Deep Dive I hinge and the profile of column 5's empty hook (ch12-s02..s04); its bare
 *                   end keeps a faint copper glow, as that hook's did
 *   tie (1.4)       the right hand loops the tag's string over the flat run and pulls the knot (the detent's tie)
 *   'ties' (0.94)   a plain open hand (the viewer's: bare, no sleeve, ring or cuff) begins to rise from below frame
 *   'doubts' (2.96) it is halfway up; at that word the right hand turns the tag over (the detent's flip): its back
 *                   is blank too, where the red pencil would have written a doubt. The red pencil never appears.
 *   'hold' (4.77)   the open hand settles in the lower third and opens, palm up, still
 *   'waiting'(6.65) the left hand unhooks the hinge and lays it, tag and all, across the open palm, then withdraws to
 *                   the lower left. The bare end's glow warms: the waiting hook is paid.
 *   still (9.43)    the open hand holds it; the camera drifts the slightest way toward the palm. No strike.
 * No text. Locked camera until 'hands', then a hair's drift (CLOSE_END_CAM) that ch12-s07's last light starts from.
 * Planes: L3 the paper desk and tiles (soft, macro focus), L4 wire, hinge, tag and hands (sharp), L5 the toy
 * theatre's stage lip (black card, warm rim) the open hand rises from behind, and morning motes.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { CAMERA3_HOME, cam3Interp, defineShot, dustMotes, mixLab, withAlpha } from '../../../film';
import { HAND_LEN, type ArmPose, type HandShapeN, type HandsPose } from '../sets/narratorHands';
import { TAG, drawTag, type TagState } from '../sets/tagLine';
import { CLOSE, CLOSE_END_CAM, closeDesk, copperTones, drawCopper, drawRing, stageLip, type Pt } from '../sets/ch12-s06-close';
import { hands } from '../cast';

type C = CanvasRenderingContext2D;
const ID = 'ch12-s06';

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpP = (a: Pt, b: Pt, u: number): Pt => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
/** a shallow arc between two points (hands travel on curves, never straight lines) */
const arcP = (a: Pt, b: Pt, u: number, bow = 0.12): Pt => {
  const p = lerpP(a, b, u);
  const k = Math.sin(Math.PI * u) * bow;
  return { x: p.x + (b.y - a.y) * k, y: p.y - Math.abs(b.x - a.x) * k * 0.5 };
};
/** twos: puppets and hands hold each drawing for two frames */
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- staging
/** hand length multiplier (a macro insert) and the tag's scale */
const HS = 1.05;
const LEN = HAND_LEN * HS;
const TS = 1.3;
const STRING = TAG.string * TS;
/** the narrator's entries for this insert (both in the lower-left quadrant, so the two forearms never cross):
 *  the support (left) hand from the left edge low, the working (right) hand from the bottom edge, left of centre */
const ENTRY_L: Pt = { x: -60, y: 980 };
const ENTRY_R: Pt = { x: 330, y: 1100 };
/** the viewer's open hand: where it rises from and where its palm settles (lower third, right of centre) */
const ENTRY_V: Pt = { x: 1380, y: 830 };
const PALM_T: Pt = { x: 860, y: 500 };

/** the hinge (the short length): corner position, rotation and bend (0 flat .. 1 = 45 deg up) */
interface Hinge {
  x: number;
  y: number;
  rot: number;
  bend: number;
}
const HOOK_X = CLOSE.ringX + CLOSE.ringR;
const REST: Hinge = { x: HOOK_X + CLOSE.flat, y: CLOSE.wireY, rot: 0, bend: 0 };
/** where along the flat run (from the corner, fraction of the flat) the tag is tied and the left hand grips */
const TIE_F = 0.4;
const GRIP_F = 0.8;

function hingePts(h: Hinge) {
  const ca = Math.cos(h.rot), sa = Math.sin(h.rot);
  const at = (lx: number, ly: number): Pt => ({ x: h.x + lx * ca - ly * sa, y: h.y + lx * sa + ly * ca });
  const b = (h.bend * Math.PI) / 4;
  const cb = Math.cos(b), sb = Math.sin(b);
  return {
    hook: at(-CLOSE.flat, 0),
    corner: at(0, 0),
    tip: at(CLOSE.climb * cb, -CLOSE.climb * sb),
    pinch: at(CLOSE.climb * 0.84 * cb, -CLOSE.climb * 0.84 * sb),
    tie: at(-CLOSE.flat * TIE_F, 0),
    grip: at(-CLOSE.flat * GRIP_F, 0),
    /** the hook's little curl through the ring (local, before rotation) */
    curl: [at(-CLOSE.flat, 0), at(-CLOSE.flat - 4, -4), at(-CLOSE.flat - 2, -8), at(-CLOSE.flat + 3, -7)],
  };
}

interface Beats {
  bend: number;
  bendEnd: number;
  tie: number;
  rise: number;
  doubt: number;
  palm: number;
  place: number;
  still: number;
  hands: number;
  D: number;
}

// ---------------------------------------------------------------- the choreography (pure functions of tq)
/** the viewer's hand: u for hands.viewer (rise 0..0.4 from 'ties' to 'hold', open to 0.55, then hold) */
function viewerU(tq: number, b: Beats): number {
  if (tq <= b.rise) return 0;
  if (tq < b.palm) return 0.4 * ((tq - b.rise) / (b.palm - b.rise));
  if (tq < b.palm + 0.6) return 0.4 + 0.15 * ((tq - b.palm) / 0.6);
  return 0.55 + 0.45 * clamp01((tq - b.palm - 0.6) / 4);
}
function viewerPose(tq: number, b: Beats) {
  const u = viewerU(tq, b);
  // breathing once settled: the palm sinks a pixel under the weight, then lifts, slow
  const settle = tq > b.palm ? Math.sin((tq - b.palm) * 1.4) * 1.2 : 0;
  const weight = tq > b.place ? 3 * sm((tq - b.place) / 0.3) * (1 - 0.6 * sm((tq - b.place - 0.3) / 0.5)) : 0;
  const target = { x: PALM_T.x, y: PALM_T.y + settle + weight };
  return hands.viewer(u, target, { scale: HS, entry: ENTRY_V });
}

/** the hinge's pose through the shot: on the wire (bent from 'bend'), carried to the palm, lying in it */
function hingeAt(tq: number, b: Beats, palm: Pt): Hinge {
  const bend = win(tq, b.bend, b.bendEnd);
  const inPalm: Hinge = { x: palm.x + 10, y: palm.y - 3, rot: -0.04, bend: 1 };
  const c0 = b.place - 0.95;
  const c1 = b.place - 0.14;
  if (tq < c0) return { ...REST, bend };
  if (tq < c1) {
    // unhook (a small lift up and right off the ring), then an arc down to the palm
    const u = sm((tq - c0) / (c1 - c0));
    const lift = { x: REST.x + 10, y: REST.y - 26 };
    const p = u < 0.18 ? lerpP(REST, lift, u / 0.18) : arcP(lift, { x: inPalm.x, y: inPalm.y - 16 }, (u - 0.18) / 0.82, 0.16);
    return { x: p.x, y: p.y, rot: Math.sin(Math.PI * u) * -0.06, bend: 1 };
  }
  // settle into the palm (the last 16 px), then lie still on it
  const u = sm((tq - c1) / (b.place - c1));
  return { ...inPalm, y: inPalm.y - 16 * (1 - u) };
}

interface ArmOut {
  socket: Pt;
  shape: HandShapeN;
  bend?: number;
}
/** the right (working) hand: bend the free end, tie, flip, withdraw */
function rightHand(tq: number, b: Beats, h: Hinge): (ArmOut & { tagFrom: 'hand' | 'line'; knot: number; flip: number; pinchTag: boolean }) | null {
  const P = hingePts(h);
  const R = LEN * 0.15;
  const tie = P.tie;
  const loopStart = { x: tie.x, y: tie.y - R };
  const pulled = { x: tie.x + LEN * 0.04, y: tie.y + LEN * 0.3 };
  const rest = { x: tie.x + LEN * 0.78, y: tie.y + LEN * 1.5 };
  const tagEye = { x: tie.x, y: tie.y + STRING };
  const corner = { x: tagEye.x + TAG.w * TS * 0.36, y: tagEye.y + TAG.h * TS * 0.86 };
  const f0 = b.doubt - 0.62; // reach for the corner
  const f1 = b.doubt - 0.26; // turn begins
  const f2 = b.doubt + 0.26; // turn ends: the back faces us
  const out0 = f2 + 0.18;
  const out1 = out0 + 1.05;
  const base = { tagFrom: 'line' as 'hand' | 'line', knot: 1, flip: 0, pinchTag: false };
  if (tq < b.bendEnd + 0.04) return { ...base, socket: P.pinch, shape: 'pinch', bend: -0.25, tagFrom: 'hand', knot: 0 };
  const l0 = b.tie - 0.32, l1 = b.tie - 0.1;
  if (tq < l0) return { ...base, socket: arcP(P.pinch, loopStart, sm((tq - b.bendEnd - 0.04) / (l0 - b.bendEnd - 0.04)), 0.2), shape: 'pinch', bend: -0.2, tagFrom: 'hand', knot: 0 };
  if (tq < l1) {
    const k = (tq - l0) / (l1 - l0);
    const th = -Math.PI / 2 + k * Math.PI * 2;
    return { ...base, socket: { x: tie.x + Math.cos(th) * R, y: tie.y + Math.sin(th) * R }, shape: 'pinch', bend: -0.15, tagFrom: 'hand', knot: k };
  }
  if (tq < b.tie) return { ...base, socket: lerpP({ x: tie.x, y: tie.y - R }, pulled, sm((tq - l1) / (b.tie - l1))), shape: 'pinch', tagFrom: 'hand', knot: 1 };
  if (tq < b.tie + 0.4) return { ...base, socket: arcP(pulled, rest, sm((tq - b.tie) / 0.4), 0.1), shape: tq < b.tie + 0.12 ? 'open' : 'rest' };
  if (tq < f0) {
    const br = Math.sin((tq - b.tie) * 1.6) * 1.5;
    return { ...base, socket: { x: rest.x, y: rest.y + br }, shape: 'rest' };
  }
  if (tq < f1) return { ...base, socket: arcP(rest, corner, sm((tq - f0) / (f1 - f0)), 0.15), shape: tq < f1 - 0.1 ? 'open' : 'pinch' };
  if (tq < f2) {
    const k = sm((tq - f1) / (f2 - f1));
    // the fingers carry the corner round the tag's vertical axis: across, toward camera and back
    const s = { x: tagEye.x + Math.cos(Math.PI * k) * TAG.w * TS * 0.36, y: corner.y - Math.sin(Math.PI * k) * LEN * 0.06 };
    return { ...base, socket: s, shape: 'pinch', flip: k, pinchTag: true };
  }
  const back = { x: tagEye.x - TAG.w * TS * 0.36, y: corner.y };
  if (tq < out0) return { ...base, socket: back, shape: 'open', flip: 1 };
  if (tq < out1) return { ...base, socket: arcP(back, lerpP(ENTRY_R, back, -0.05), sm((tq - out0) / (out1 - out0)), 0.08), shape: 'rest', flip: 1 };
  return null;
}

/** the left (support) hand: holds the flat from the cut, carries the hinge to the palm, lets go, withdraws */
function leftHand(tq: number, b: Beats, h: Hinge): ArmOut | null {
  const P = hingePts(h);
  const r0 = b.place;
  const r1 = b.place + 0.28;
  const w0 = b.place + 0.36;
  const w1 = b.place + 1.6;
  if (tq < r0) {
    // a held breath on the wire (one px), steadier while the right hand ties
    const br = Math.sin(tq * 1.3) * 1.0;
    return { socket: { x: P.grip.x, y: P.grip.y + br }, shape: 'grip', bend: 0.12 };
  }
  const up = { x: P.grip.x - LEN * 0.05, y: P.grip.y - LEN * 0.16 };
  if (tq < r1) return { socket: lerpP(P.grip, up, sm((tq - r0) / (r1 - r0))), shape: 'open', bend: 0.05 };
  if (tq < w0) return { socket: up, shape: 'rest', bend: 0.05 };
  if (tq < w1) return { socket: arcP(up, lerpP(ENTRY_L, up, -0.05), sm((tq - w0) / (w1 - w0)), 0.1), shape: 'rest', bend: 0.05 };
  return null;
}

/** the tag's pendulum: damped swings kicked by the tie, the flip's release and the carry (rad, about its knot) */
function tagSwing(tq: number, b: Beats): number {
  const kick = (t0: number, a: number, w = 6.2, d = 1.9) => (tq < t0 ? 0 : a * Math.exp(-(tq - t0) * d) * Math.sin(w * (tq - t0)));
  const c0 = b.place - 0.95;
  const carry = tq > c0 && tq < b.place ? 0.16 * Math.sin(Math.PI * clamp01((tq - c0) / (b.place - c0))) : 0;
  return 0.03 * Math.sin(tq * 2.1) * (tq < b.tie ? 1 : 0) + kick(b.tie, 0.13) + kick(b.doubt + 0.26, 0.08) + carry + kick(b.place, -0.07, 7, 2.6);
}

// ---------------------------------------------------------------- the shot
export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: Beats = {
      bend: T.beat('bend'),
      bendEnd: T.beat('bend') + 0.62,
      tie: T.beat('tie'),
      rise: T.beat('hand'),
      doubt: T.beat('doubt'),
      palm: T.beat('palm'),
      place: T.beat('place'),
      still: T.beat('still'),
      hands: T.word('L1210', 'hands'),
      D,
    };
    const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
    // locked off; then the slightest drift toward the palm as the last word lands
    tl.tween(cam, CLOSE_END_CAM, { at: b.hands - 0.2, dur: D - (b.hands - 0.2), ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const cam = s.get(scene.cam);
    f.camera(cam);
    f.backlight({ sunX: 300, sunY: 160, intensity: 1 });

    // ---- the state of the hands and the copper, on twos
    const vp = viewerPose(tq, b);
    const palm = vp.palm ?? PALM_T;
    const h = hingeAt(tq, b, palm);
    const P = hingePts(h);
    const rh = rightHand(tq, b, h);
    const lh = leftHand(tq, b, h);
    // the bare end's copper glow: faint (as column 5's waiting hook), warming once it is in the palm
    const tipGlow = 0.35 + 0.45 * win(t, b.place, b.place + 1.4);

    // ---- L3: the paper desk and the dock tiles (soft: the macro's focus is on the wire's front edge)
    f.layer('L3', (c, env) => closeDesk(f, c, env, ID));
    f.fog({ yCenter: 600, height: 300, alpha: 0.05, drift: 5 });

    // ---- L4: the wire, the viewer's hand, the tag, the hinge and the narrator's hands (the one sharp plane)
    f.layer('L4', (c, env) => {
      // the dock wire, in from frame left to its end ring
      drawCopper(c, env, [{ x: CLOSE.wireX0, y: CLOSE.wireY }, { x: CLOSE.ringX - CLOSE.ringR, y: CLOSE.wireY }], { glow: 0.15 });
      drawRing(c, env, CLOSE.ringX, CLOSE.wireY, CLOSE.ringR, 0.15);

      // the viewer's open hand, rising from behind the stage lip
      if (tq > b.rise) hands.draw(c, vp, env);

      // the tag (behind the copper and the fingers that hold it), swinging about its knot
      const tagState: TagState = { id: 'why', front: '', knot: [], back: [], scale: TS, swing: 0, flip: rh?.flip ?? (tq > b.doubt ? 1 : 0), alpha: 1 };
      let knot: Pt;
      let strLen = STRING;
      if (rh && rh.tagFrom === 'hand') {
        // carried by its string from the right hand's pinch
        const arm = armOf(rh, ENTRY_R);
        knot = hands.socket({ right: arm, scale: HS }, 'right') ?? rh.socket;
        strLen = STRING * 0.75;
      } else knot = P.tie;
      const sw = rh?.pinchTag ? 0 : tagSwing(tq, b);
      c.save();
      c.translate(knot.x, knot.y);
      c.rotate(sw);
      c.translate(-knot.x, -knot.y);
      drawTag(c, env, tagState, { knotAt: knot, at: { x: knot.x, y: knot.y + strLen }, tq });
      c.restore();

      // the hinge: the hook's curl, the flat run, the corner, the climb; its bare end glows faintly
      drawCopper(c, env, [...P.curl.slice().reverse(), P.corner, P.tip], { glow: 0.2, shadow: tq < b.place - 0.95 ? 1 : 0.5 });
      if (rh && rh.tagFrom === 'hand' && rh.knot > 0) loopTurn(c, env, P.tie, rh.knot);
      if (tq >= b.tie || (rh && rh.tagFrom === 'line')) knotOn(c, env, P.tie);
      tipLight(c, env, P.tip, tipGlow);

      // the narrator's hands (darkest shapes in frame): left (support) then right (working) on top
      const pose: HandsPose = { scale: HS };
      if (lh) pose.left = armOf(lh, ENTRY_L);
      if (rh) pose.right = armOf(rh, ENTRY_R);
      hands.draw(c, pose, env);
    });
    f.rim({ x: 0, y: -1 });
    // the bare end's glow is a light: wrap it over the fingers that hold it
    f.practical({ x: P.tip.x, y: P.tip.y, kind: 'led', seed: 12, intensity: 0.18 + 0.32 * tipGlow, radius: 34, layer: 'L4' });

    // ---- L5: the toy theatre's stage lip (near, soft) and a few motes in the morning light
    f.layer('L5', (c, env) => {
      stageLip(f, c, env, ID);
      dustMotes(c, { area: { x: -60, y: 40, w: 1400, h: 600 }, count: 16, size: 2.4, brightness: 0.16, drift: { x: 2.2, y: -0.8 }, salt: 1206 }, env);
    });
  },
});

function armOf(a: ArmOut, entry: Pt): ArmPose {
  return hands.reach(entry, a.socket, a.shape, LEN, { sleeve: 'linen', bend: a.bend ?? 0 });
}

/** the string's loop going round the flat run while the knot is made (0..1) */
function loopTurn(c: C, env: PaintEnv, at: Pt, k: number) {
  c.save();
  c.strokeStyle = withAlpha(mixLab('#6b5a44', env.mood.ink, 0.3), 0.9);
  c.lineWidth = 1.4;
  c.beginPath();
  c.ellipse(at.x, at.y, 4.5, 6.5, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
  c.stroke();
  c.restore();
}
/** the finished lark's-head knot on the copper */
function knotOn(c: C, env: PaintEnv, at: Pt) {
  c.save();
  c.strokeStyle = withAlpha(mixLab('#6b5a44', env.mood.ink, 0.3), 0.95);
  c.lineWidth = 1.6;
  c.beginPath();
  c.ellipse(at.x - 2.2, at.y, 2.6, 5.2, 0, 0, Math.PI * 2);
  c.ellipse(at.x + 2.2, at.y, 2.6, 5.2, 0, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}
/** the faint copper light on the hinge's bare end (the same glow column 5's empty hook carried) */
function tipLight(c: C, env: PaintEnv, at: Pt, k: number) {
  const tone = copperTones(env, 1);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const r = 22 + 10 * k;
  const g = c.createRadialGradient(at.x, at.y, 0, at.x, at.y, r);
  g.addColorStop(0, withAlpha(mixLab(tone.body, env.mood.core, 0.6), 0.5 * k));
  g.addColorStop(0.35, withAlpha(tone.body, 0.18 * k));
  g.addColorStop(1, withAlpha(tone.body, 0));
  c.fillStyle = g;
  c.fillRect(at.x - r, at.y - r, 2 * r, 2 * r);
  c.fillStyle = withAlpha('#fff4de', 0.75 * k);
  c.beginPath();
  c.arc(at.x, at.y, 1.8, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
