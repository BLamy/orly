/**
 * ch01-s01 — the cold open: a cursor pinprick in total black; the dark room resolves around it (serverCyan, 9.0 s).
 *
 * fadeBlack in. Total black for a breath; at `cursor` (0.6 s) one cool pinprick blinks on a steady half-second
 * rhythm, exactly where the laptop's light will sit. From `room` the room resolves from the backlight outward
 * (sets/ch01-s01-room): the window (three tall lights, a transom, slim mullions with rim hairlines) and the city,
 * then fog at desk height across the floor (fog B lifts the wall and floor behind the chair and legs, so the ink
 * figure cuts against light), then the screen's light. As the room opens the pinprick hands its blink over to
 * the screen's glow. The laptop is seen EDGE-ON: the lid's back is an ink slab leaning away from the user, and
 * its light spills LEFT onto the hands, chest and face (the cyan rim). On "wonder" the screen becomes the hero
 * practical (bible spec: outer r 260 α 0.16, inner r 70 α 0.35), the hands lift 8 px off the keys, then tap on
 * twos (alternating hands, a visible forearm bob, a seeded hover now and then) with a 1-2 frame screen flicker
 * on every keystroke. Camera: holds through the reveal, then a true dolly toward the laptop (z 60 → 156),
 * still moving at the cut into ch01-s02. Near planes: the plant (L5, left) and an armchair back (L5, lower
 * right) slide out past the lens.
 */
import { Timeline, ease } from '../../../core';
import { CAMERA3_HOME, LAYERS, addPose, blendPose, defineShot, dustMotes, mixLab, toScreen, vnoise2, withAlpha, withLife } from '../../../film';
import type { Camera3, Pose } from '../../../film';
import { FACE_C, ROOM01, ROOM01_CURSOR, ROOM01_POSES, room01 } from '../sets/ch01-s01-room';
import { roomVignette } from '../sets/ch01-s01-roomExtras';
import { cast } from '../cast';

/** the rest framing: trucked right and dollied in, so the figure and laptop sit right of centre with the window
 *  filling the back and the plant as a near (L5) occluder at frame left */
const START: Camera3 = { ...CAMERA3_HOME, x: CAMERA3_HOME.x + 120, y: CAMERA3_HOME.y + 18, z: 60 };
/** the push: a true dolly toward the laptop's face (it holds its place on screen while the room grows round it) */
const Z_PUSH = 96;
const PUSH_AT = 3.0;
const P0 = toScreen(LAYERS.L4, START, FACE_C.x, FACE_C.y);
const fixedCam = (z: number): Camera3 => {
  // screen = C + (F - C)·s - d·s  (L4: k = s)  ->  d = (C + (F - C)·s - p0) / s
  const s = 1000 / (1000 - z);
  return { x: 640 + (640 + (FACE_C.x - 640) * s - P0.x) / s, y: 360 + (360 + (FACE_C.y - 360) * s - P0.y) / s, z, lens: 1 };
};
/** where the push arrives at the cut (ch01-s02 opens closer, on the same line) */
export const S01_END: Camera3 = fixedCam(START.z + Z_PUSH);
const CAMS = [START, S01_END];

const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);

/** the last 2.5 s: the frame centre drifts toward the laptop (a ~40 px truck right and the lens easing to 1.06),
 *  so the cut to ch01-s02's over-the-shoulder reverse on the screen is motivated */
const DRIFT_S = 2.5;
const DRIFT_X = 40;
const DRIFT_LENS = 0.06;
/** the camera: still, then a dolly in on the laptop that eases in (still moving at the cut) */
function camAt(t: number, D: number): Camera3 {
  const u = clamp01((t - PUSH_AT) / (D - PUSH_AT));
  const e = 0.25 * u + 0.75 * u * u;
  const c = fixedCam(START.z + Z_PUSH * e);
  const v = clamp01((t - (D - DRIFT_S)) / DRIFT_S);
  const d = v * v; // eases in, still moving at the cut
  return { ...c, x: c.x + DRIFT_X * d, lens: 1 + DRIFT_LENS * d };
}

// ---------------------------------------------------------------- the dark opening from the glass outward
/** a low-res alpha mask (bilinear-upscaled, so its edge is soft): a disc of dark lifting from the window,
 *  its rim broken by seeded angular noise (±80 px) so the corners come up as haze, not as a circle */
const MW = 256;
const MH = 144;
let MASK: HTMLCanvasElement | null = null;
let MASK_DATA: ImageData | null = null;
const NA = 256;
const EDGE_N = Array.from({ length: NA }, (_, i) => {
  const a = (i / NA) * Math.PI * 2;
  return fbm2(Math.cos(a) * 2.2 + 7, Math.sin(a) * 2.2 + 3, 41);
});
function fbm2(x: number, y: number, seed: number) {
  let v = 0, amp = 0.5, n = 0;
  for (let o = 0; o < 3; o++) {
    v += amp * vnoise2(x, y, seed + o * 17);
    n += amp;
    amp *= 0.5;
    x *= 2.03;
    y *= 2.03;
  }
  return v / n; // ~ -1..1
}
function darkMask(c: CanvasRenderingContext2D, wc: { x: number; y: number }, O: number, t: number, col: string) {
  if (!MASK) {
    MASK = document.createElement('canvas');
    MASK.width = MW;
    MASK.height = MH;
  }
  const mc = MASK.getContext('2d')!;
  if (!MASK_DATA) MASK_DATA = mc.createImageData(MW, MH);
  const d = MASK_DATA.data;
  const RGB = [1, 3, 5].map((i) => parseInt(col.slice(i, i + 2), 16));
  const so = sm(O);
  const k = 1 - so;
  const r1 = 650 + 1250 * so;
  const a0 = 0.55 * k * k;
  const a1 = 0.85 * k;
  const a2 = Math.min(1, 0.98 * k + 0.25 * (1 - O));
  const sx = 1280 / MW, sy = 720 / MH;
  const drift = t * 0.35;
  for (let j = 0; j < MH; j++) {
    const y = (j + 0.5) * sy - wc.y;
    for (let i = 0; i < MW; i++) {
      const x = (i + 0.5) * sx - wc.x;
      const ang = Math.atan2(y, x);
      let ai = (((ang / (Math.PI * 2)) * NA + drift * 6) % NA + NA) % NA;
      const i0 = Math.floor(ai), fr = ai - i0;
      const nz = EDGE_N[i0] + (EDGE_N[(i0 + 1) % NA] - EDGE_N[i0]) * fr;
      const r = Math.hypot(x, y) / (r1 + 80 * nz);
      let a: number;
      if (r < 0.55) a = a0 + (a1 - a0) * (r / 0.55);
      else if (r < 1) a = a1 + (a2 - a1) * ((r - 0.55) / 0.45);
      else a = a2;
      const q = (j * MW + i) * 4;
      d[q] = RGB[0];
      d[q + 1] = RGB[1];
      d[q + 2] = RGB[2];
      d[q + 3] = Math.round(255 * Math.max(0, Math.min(1, a)));
    }
  }
  mc.putImageData(MASK_DATA, 0, 0);
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(MASK, -6, -6, 1292, 732);
  c.restore();
}

// ---------------------------------------------------------------- the typing: lift, then keys on twos
const person = cast['chat-user'];
const handY = (p: Pose, which: 'handF' | 'handB' = 'handF') =>
  person.anchor({ x: ROOM01.personX, y: ROOM01.floorY, facing: 'right', pose: p, scale: ROOM01.personScale }, which).y;
/** the elbow flex (deg) that raises a hand `px` above the keys (measured on the puppet, so it is exact) */
function liftDeg(px: number, which: 'F' | 'B'): number {
  const base = handY(ROOM01_POSES.type, which === 'F' ? 'handF' : 'handB');
  for (let d = 0; d <= 40; d += 0.25) {
    const p = addPose(ROOM01_POSES.type, which === 'F' ? { elbowF: d, wristF: -d * 0.25 } : { elbowB: d, wristB: -d * 0.25 });
    if (base - handY(p, which === 'F' ? 'handF' : 'handB') >= px) return d;
  }
  return 12;
}
/** the hover over the keys after the landing (px above the deck) */
const LIFT_F = liftDeg(10, 'F');
const LIFT_B = liftDeg(9, 'B');
const TICK = 1 / 12;
/** the hands leave the lap this long before 'wonder' (three drawings on twos) and land over the keys on it */
const LIFT_LEAD = 0.25;
/** the keystrokes after the landing (shot-local s, on the twos grid): four alternating taps 5.0 → 6.0, then a
 *  short second pair as the person reads back what they typed. Each strike holds 2 drawings down, 1 half-up. */
const STRIKES: { at: number; hand: 'F' | 'B'; flick: number }[] = [
  { at: 60 / 12, hand: 'F', flick: 2 },
  { at: 64 / 12, hand: 'B', flick: 1 },
  { at: 68 / 12, hand: 'F', flick: 2 },
  { at: 72 / 12, hand: 'B', flick: 1 },
  { at: 89 / 12, hand: 'F', flick: 1 },
  { at: 92 / 12, hand: 'B', flick: 2 },
];
/** 0 = down on the key, 1 = hovering, for one hand at time t */
function handUp(tq: number, hand: 'F' | 'B'): number {
  for (const S of STRIKES) {
    if (S.hand !== hand) continue;
    const d = tq - S.at;
    if (d >= -1e-6 && d < 2 * TICK - 1e-6) return 0;
    if (d >= 2 * TICK - 1e-6 && d < 3 * TICK - 1e-6) return 0.5;
  }
  return 1;
}

/** the person's pose: hands parked palm-down on the thighs (forearms ~25° below level) until just before
 *  'wonder', lifted on twos to land over the keys on the word, then four taps (and a later pair) on twos */
function poseAt(tq: number, typeAt: number): Pose {
  const liftS = typeAt - LIFT_LEAD;
  const hover = addPose(ROOM01_POSES.type, { elbowF: LIFT_F, wristF: -LIFT_F * 0.25, elbowB: LIFT_B, wristB: -LIFT_B * 0.25, head: 0.6 });
  let p: Pose;
  if (tq < liftS - 1e-6) p = ROOM01_POSES.rest;
  else if (tq < typeAt - 1e-6) {
    const u = clamp01((tq - liftS + TICK * 2) / (LIFT_LEAD + TICK * 2));
    p = blendPose(ROOM01_POSES.rest, hover, sm(u));
  } else {
    const fUp = handUp(tq, 'F');
    const bUp = handUp(tq, 'B');
    p = addPose(ROOM01_POSES.type, {
      elbowF: LIFT_F * fUp,
      wristF: -LIFT_F * 0.25 * fUp,
      elbowB: LIFT_B * bUp,
      wristB: -LIFT_B * 0.25 * bUp,
      shoulderF: fUp === 0 ? 1.2 : 0,
      head: 0.6,
    });
  }
  return withLife({ ...p, prev: p }, tq, 26);
}

/** the screen's flicker on each keystroke (1-2 frames, on ones) */
function keyFlicker(t: number): number {
  for (const S of STRIKES) {
    const d = t - S.at;
    if (d >= -1e-6 && d < S.flick / 24 - 1e-6) return 1;
  }
  return 0;
}

/** near-black for the dark: the mood's ink at ~60%, so the finish's ink vignette over it stays under one L*
 *  step (on pure #000 its clear-radius edge showed as a faint ellipse) */
const darkInk = (ink: string) => mixLab('#000000', ink, 0.6);

/** the cursor's blink: lit from the frame its beat falls in, a steady half-second rhythm (0.5 s on, 0.5 s off)
 *  through the end of the shot */
const CUR_LEAD = 1 / 24;
const CUR_ON = 0.5;
const CUR_PERIOD = 1.0;
function cursorOn(t: number, at: number): boolean {
  if (t < at - CUR_LEAD) return false;
  const ph = (t - (at - CUR_LEAD)) % CUR_PERIOD;
  return ph < CUR_ON;
}

export default defineShot({
  id: 'ch01-s01',
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const cursorAt = T.beat('cursor');
    const roomAt = T.beat('room');
    const typeAt = T.beat('type');
    // the room resolves out of the black from the backlight outward, staged: the window and the city
    // first, then the fog, then the screen's light on the furniture and the figure's rim (2.0 → 3.8 s)
    const reveal = tl.channel('reveal', 0);
    tl.tween(reveal, 1, { at: roomAt - 0.2, dur: 1.6, ease: ease.move });
    const open = tl.channel('open', 0);
    tl.tween(open, 1, { at: roomAt - 0.2, dur: 2.1, ease: ease.move });
    const fog = tl.channel('fog', 0);
    tl.tween(fog, 1, { at: roomAt + 0.3, dur: 0.9, ease: ease.move });
    const light = tl.channel('light', 0);
    tl.tween(light, 1, { at: roomAt + 0.8, dur: 0.8, ease: ease.move });
    // the screen: dim while the room is asleep, a step brighter as the hands find the keys
    const glow = tl.channel('glow', 0.72);
    tl.tween(glow, 0.83, { at: typeAt - 0.05, dur: 0.3, ease: ease.enter }); // +15% on 'wonder'
    // the screen-side rim on the face, chest and fingertips: arrives with the screen's light, brightens on "wonder"
    const rim = tl.channel('rim', 0);
    tl.tween(rim, 0.45, { at: roomAt + 0.8, dur: 0.8, ease: ease.move });
    tl.tween(rim, 1, { at: typeAt - 0.05, dur: 0.6, ease: ease.enter });
    // the screen as the hero practical: up to the bible's full spec on the typing beat
    const hero = tl.channel('hero', 0);
    tl.tween(hero, 1, { at: typeAt - 0.05, dur: 0.6, ease: ease.enter });
    // the 'wonder' step: the screen's light on the face jumps ~15% on the word (a step, not a fade)
    const faceStep = tl.channel('faceStep', 0);
    tl.tween(faceStep, 1, { at: typeAt - 0.02, dur: 0.1, ease: ease.enter });
    tl.hold(0, D);
    return { tl, reveal, open, fog, light, glow, rim, hero, faceStep, cursorAt, roomAt, typeAt, D };
  },
  paint(f, s, scene) {
    const t = f.t;
    const cam = camAt(t, scene.D);
    f.camera(cam);
    const R = s.get(scene.reveal);
    const O = s.get(scene.open);
    const c = f.c;
    const W = ROOM01.window;
    const blinkOn = cursorOn(t, scene.cursorAt);

    if (R > 0.001) {
      room01(f, {
        key: 'ch01-s01',
        cams: CAMS,
        resolve: R,
        fog: s.get(scene.fog),
        light: s.get(scene.light),
        glow: s.get(scene.glow) + 0.12 * keyFlicker(t) + (blinkOn && O > 0.9 ? 0.02 : 0),
        hero: s.get(scene.hero),
        nearRight: true,
        pose: poseAt(f.tq, scene.typeAt),
        cursorOn: false,
        screenRimK: s.get(scene.rim),
        faceGlow: s.get(scene.faceStep),
        plantX: 300,
        curtainX: 1440,
      });
      // dust hanging in the window light and the screen's spill
      f.layer('L4', (cc, env) => {
        dustMotes(cc, { area: { x: 640, y: 220, w: 420, h: 260 }, count: 40, drift: { x: -2.5, y: -1 }, size: 0.9, brightness: 0.5 * O, color: env.mood.rim, salt: 11 }, env);
      });
      // the wall's corners pushed down, so the eye sits on the screen, the hands and the face
      roomVignette(f, 1.05);
    }

    // the dark: total black, opening from the window outward (the glass arrives first, the corners last)
    const wc = toScreen(LAYERS.L2, cam, W.x + W.w / 2, W.y + W.h * 0.5);
    if (O < 0.999) {
      if (R <= 0.001) {
        c.save();
        c.fillStyle = darkInk(f.mood.ink);
        c.fillRect(-20, -20, 1320, 760);
        c.restore();
      } else darkMask(c, wc, O, t, darkInk(f.mood.ink));
    }

    // the cursor: a 3 x 10 px bar of cool light (1080p) with a soft 30-40 px halo, blinking ~0.7 s on / 0.35 s
    // off from the frame the `cursor` beat falls in (so the beat's own frame shows it lit)
    if (t >= scene.cursorAt - CUR_LEAD) {
      const on = cursorOn(t, scene.cursorAt);
      const Cc = ROOM01_CURSOR;
      const p = toScreen(LAYERS.L4, cam, Cc.x + Cc.w / 2, Cc.y + Cc.h / 2);
      const m = f.mood;
      const dark = 1 - sm(O);
      // the bar keeps blinking through the end on the lid's lit inner edge; only its halo shrinks as the room opens
      const vis = 1 - 0.6 * sm(clamp01((O - 0.35) / 0.5));
      {
        const hr = 24 * p.k; // ~36 px at 1080p
        c.save();
        c.globalAlpha = vis;
        c.globalCompositeOperation = 'lighter';
        const halo = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, hr);
        const ha = (on ? 0.5 : 0.08) * (0.45 + 0.55 * dark);
        halo.addColorStop(0, withAlpha(m.halo, ha));
        halo.addColorStop(0.35, withAlpha(m.halo, ha * 0.45));
        halo.addColorStop(1, withAlpha(m.halo, 0));
        c.fillStyle = halo;
        c.fillRect(p.x - hr, p.y - hr, 2 * hr, 2 * hr);
        c.restore();
        if (on) {
          const bw = 2 * p.k, bh = 6.7 * p.k; // 3 x 10 px at 1080p
          c.save();
          c.fillStyle = m.core;
          c.fillRect(p.x - bw / 2, p.y - bh / 2, bw, bh);
          c.restore();
        }
      }
    }
  },
});
