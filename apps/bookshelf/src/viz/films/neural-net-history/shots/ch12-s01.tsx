/**
 * ch12-s01 — the last accomplice: the X-ray box's empty seventh band, a shears-shaped slot, glints once; ink
 * bleeds out of it onto a paper simulation stage where a hand taps the better of two tries and a one-legged
 * robot learns from the taps (candleAmber → duskRose, 9.08 s, cut in from ch11-s08's study).
 *
 *   X-RAY  0 → 1.0   the study, square-on to the X-ray chat box (candleAmber room; the box a serverCyan
 *                    practical, bands 1–6 lit, band 7 drawn as a dark, empty, shears-shaped slot). A slow push
 *                    toward the top band. The CHAPTER INDEX TAB drops at top-left (0.1 s), holds 2.5 s, rises.
 *          0.6       the slot glints once: a single cold edge-light along the shears' outline
 *   BLEED  1.0 → 2.2 ink bleeds out of the slot (makeInkBleed, origin = the slot on screen) into duskRose
 *   STAGE  2.2 →     the paper stage (sets/ch12-s01-hopper): the Hopper, cut from black card, hops and
 *                    topples on a checkerboard simulator floor under a pendant lamp; at the front a small
 *                    desk with two little lit screens, each replaying one of its latest tries.
 *          'choosing' a generic hand taps the better try (right); the reward lantern beside the desk brightens
 *                    a fraction, a pulse of its light runs along a thread to the robot, a tally mark is made;
 *                    the date stamp JUNE 2017 and the paper's authors set in (bottom-left, after the tab)
 *          'better'  a second choice (left), the robot on the stage now hops steadier
 *          hold      a third choice; the robot hops on steadily to the cut
 * Camera on the stage: a slow push and truck toward the desk (≈ z 0 → 70).
 * TEXT RULE: the chapter tab, the date stamp and the paper's authors only.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, MOODS, defineShot, drawTracked, makeInkBleed, mixLab, softPlate, toScreen, withAlpha } from '../../../film';
import { STUDY, STUDY_CAMS, studyCase, studyNear, studyRoom } from '../sets/study';
import { XRAY } from '../sets/xrayColumn';
import { cardIcon } from '../sets/caseBoard';
import { indexTab2 } from '../sets/ch12-s01-tab';
import { bankersLamp } from '../../../film/silhouette/props/lights';
import { toLayer } from '../../../film/core/multiplane';
import { hopperStage } from '../sets/ch12-s01-hopper';
import { sm, subFrame, win } from '../sets/ch02-s05b-util';

const ID = 'ch12-s01';
const CYAN = MOODS.serverCyan;

// ------------------------------------------------------------------------------------------------ X-RAY
/** band 7's slot centre (L4 world): the box's bottom centre minus 355 box units at scale 0.75 */
const SLOT = { x: STUDY.xray.x, y: STUDY.xray.y - 355 * STUDY.xray.s };
/** trucked 40 px left and a touch closer than the X-ray camera, so no lettered card on the board or the Wall is cut
 *  by the frame edge (the board's last column sits whole at left, the Wall's first slip falls just outside) */
/** (round 1) lifted 36 px so band 7's slot sits well below the chapter tab while it glints */
const XR0: Camera3 = { x: STUDY_CAMS.xray.x - 40, y: STUDY_CAMS.xray.y - 12, z: STUDY_CAMS.xray.z + 14, lens: 1 };
const XR1: Camera3 = { x: STUDY_CAMS.xray.x - 40, y: STUDY_CAMS.xray.y - 48, z: STUDY_CAMS.xray.z + 70, lens: 1 };
const XR_CAMS = [XR0, XR1];
const xrCam = (t: number): Camera3 => {
  const u = sm(t / 2.4);
  return { x: XR0.x, y: XR0.y + (XR1.y - XR0.y) * u, z: XR0.z + (XR1.z - XR0.z) * u, lens: 1 };
};

// ------------------------------------------------------------------------------------------------ STAGE
/** (round 1) a slow drift from the bleed on, plus a PUSH toward the desk on 'shown two tries … which is better?'
 *  (5.0 → 7.0 s, ≈ +12% on the action plane), so the two clips and the tapping hand become the subject */
const ST0: Camera3 = { ...CAMERA3_HOME, x: 620, y: 372, z: -20 };
const DRIFT = { x: 60, y: 18, z: 42 };
const PUSH = { x: 120, y: 30, z: 85 };
const PUSH0 = 5.0, PUSH1 = 7.0;
const ST1: Camera3 = { x: ST0.x + DRIFT.x + PUSH.x, y: ST0.y + DRIFT.y + PUSH.y, z: ST0.z + DRIFT.z + PUSH.z, lens: 1 };
const ST_CAMS = [ST0, ST1, CAMERA3_HOME];
const stCam = (t: number): Camera3 => {
  const u = sm((t - 1.0) / 8.0);
  const p = sm((t - PUSH0) / (PUSH1 - PUSH0));
  return { x: ST0.x + DRIFT.x * u + PUSH.x * p, y: ST0.y + DRIFT.y * u + PUSH.y * p, z: ST0.z + DRIFT.z * u + PUSH.z * p, lens: 1 };
};

const BLEED0 = 1.0;
const BLEED1 = 2.2;

interface B {
  D: number;
  glint: number;
  choose: number;
  taps: number[];
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const choose = T.beat('choose');
    const better = T.word('L1201', 'better');
    const taps = [choose, better + 0.05, Math.min(D - 1.0, better + 1.55)];
    tl.hold(0, D);
    return { tl, b: { D, glint: T.beat('slotGlint'), choose, taps } as B };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    if (t < BLEED0) paintXray(f, b, t);
    else if (t >= BLEED1) paintStage(f, b, t);
    else {
      const A = subFrame(f, `${ID}/xr`, 'candleAmber', (g) => paintXray(g, b, t));
      const Bc = subFrame(f, `${ID}/st`, 'duskRose', (g) => paintStage(g, b, t));
      const u = sm((t - BLEED0) / (BLEED1 - BLEED0));
      f.setMood('duskRose', { from: 'candleAmber', u });
      BLEED(f.c, A, Bc, u, { W: 1280, H: 720, pxScale: f.pxScale, seed: 1201, frame: f.frame, mood: MOODS.candleAmber });
    }
    // type (screen-locked, last): the chapter tab over the lead-in; the date and the authors after it has gone
    // (round 1) the chapter-title tab on two lines, sized from the face's live cap height: 33 px real cap at 1080p
    // (the legibility audit under-reads Special Elite by ≈ 0.7×, so this measures ≈ 23 px there)
    indexTab2(f.c, { lines: ['The Last Accomplice,', 'and the Return to the Scene'], at: 0.1, hold: 2.5, cap: 33 }, { t, mood: f.mood });
    stamp(f, t, b.choose);
  },
});

/** the bleed starts at the slot (where the eye already is): its screen point mid-bleed */
const BLEED_O = toScreen(LAYERS.L4, (() => {
  const u = sm(1.3 / 2.4);
  return { x: XR0.x, y: XR0.y + (XR1.y - XR0.y) * u, z: XR0.z + (XR1.z - XR0.z) * u, lens: 1 };
})(), SLOT.x, SLOT.y);
const BLEED = makeInkBleed({ origin: { x: BLEED_O.x, y: BLEED_O.y }, edge: 0.04, wet: 0.8 });

// ================================================================================================ X-RAY
function paintXray(f: Frame, b: B, t: number) {
  const cam = xrCam(t);
  f.camera(cam);
  f.setMood('candleAmber');
  studyRoom(f, { key: ID, cams: XR_CAMS, outside: { mood: 'duskRose', kind: 'night' } });
  const gk = Math.max(0, 1 - Math.abs(t - b.glint - 0.12) / 0.32);
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    flames: false,
    // the plate a step quieter than full: its glow comes from the lit bands and the edge, not the glass
    xray: { light: 0.7, slotGlint: 0.001 },
  });
  xrayPlate(f);
  // the glint: one cold edge-light along the shears' outline (a lighter copy of the slot, a hair larger)
  f.layer('L4', (c, env) => {
    c.save();
    c.translate(SLOT.x, SLOT.y);
    c.scale(STUDY.xray.s, STUDY.xray.s);
    // the slot itself: a deep, empty, shears-shaped hole (darker than the darkened band)
    cardIcon(c, 'shears', 0, 0, 46, env, withAlpha(mixLab(CYAN.ink, '#000000', 0.3), 0.9));
    if (gk > 0) {
      c.globalCompositeOperation = 'lighter';
      for (const [dx, dy] of [[-1.2, -1.2], [1.2, -0.6], [0, 1.2]] as const) {
        cardIcon(c, 'shears', dx, dy, 48, env, withAlpha(CYAN.core, 0.9 * gk));
      }
      c.globalCompositeOperation = 'source-over';
      cardIcon(c, 'shears', 0, 0, 46, env, withAlpha(mixLab(CYAN.ink, '#000000', 0.3), 0.9));
      // a travelling spark along the blade
      c.globalCompositeOperation = 'lighter';
      const sx = -18 + 36 * sm((t - b.glint + 0.05) / 0.4);
      const g = c.createRadialGradient(sx, -8 + sx * 0.25, 0, sx, -8 + sx * 0.25, 12);
      g.addColorStop(0, withAlpha(CYAN.core, 0.9 * gk));
      g.addColorStop(1, withAlpha(CYAN.core, 0));
      c.fillStyle = g;
      c.fillRect(sx - 12, -20 + sx * 0.25, 24, 24);
    }
    c.restore();
  });
  studyNear(f, { key: ID, cams: XR_CAMS, file: true });
  studyLampPool(f);
}

/** (round 1) the opening frame's practical: the green-shaded banker's lamp at the lower right (the study's lamp side)
 *  rises into the corner on the near plane, and its warm pool climbs the panelled wall beside the box, so the cut in
 *  from ch11-s08's warm board lands on lamplight, not a flat amber wall */
const LAMP_SCR = { x: 1150, y: 800 };
function studyLampPool(f: Frame) {
  const cam0 = xrCam(0);
  const base = toLayer(LAYERS.L5, cam0, LAMP_SCR.x, LAMP_SCR.y);
  const S = 1.0;
  const bulb = bankersLamp.anchors({ x: base.x, y: base.y, s: S }).bulb;
  // the pool on the wall and the box's flank (L4, additive), brightest just above the shade
  f.layer('L4', (c, env) => {
    const p = toLayer(LAYERS.L4, f.cam, ...(() => {
      const q = toScreen(LAYERS.L5, f.cam, bulb.x, bulb.y);
      return [q.x - 30, q.y - 90] as [number, number];
    })());
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(p.x, p.y, 20, p.x, p.y, 430);
    g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.25), 0.42));
    g.addColorStop(0.45, withAlpha(env.mood.halo, 0.16));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - 430, p.y - 430, 860, 860);
    // a soft second pool on the board edge at left (the lamp's spill across the room)
    const q = toLayer(LAYERS.L4, f.cam, 120, 470);
    const g2 = c.createRadialGradient(q.x, q.y, 10, q.x, q.y, 300);
    g2.addColorStop(0, withAlpha(env.mood.halo, 0.12));
    g2.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g2;
    c.fillRect(q.x - 300, q.y - 300, 600, 600);
    c.restore();
  });
  f.practical({ x: bulb.x, y: bulb.y + 4, kind: 'lamp', seed: 1213, intensity: 0.8, radius: 54, layer: 'L5' });
  f.layer('L5', (c, env) => {
    bankersLamp(c, { x: base.x, y: base.y, s: S, lit: true, seed: 1213 }, env);
  });
}

/** the X-ray as a glowing paper plate, not a flat slab: the glass sinks toward the set with a soft inner falloff,
 *  the six lit bands keep their light (an inner strip-glow each) and the bezel carries a thin cold edge-glow; band 7
 *  is darkened to ≈ 30% of the others, so the slot's glint is the only light on it */
function xrayPlate(f: Frame) {
  const X = STUDY.xray;
  const W = XRAY.w, H = XRAY.h;
  const band = (i: number) => {
    const seam = i >= 4 ? 10 : 0;
    const y1 = -XRAY.pad - (i - 1) * XRAY.band - seam;
    return { x: -W / 2 + 18, y: y1 - XRAY.band + 6, w: W - 36, h: XRAY.band - 8 };
  };
  f.layer('L4', (c) => {
    c.save();
    c.translate(X.x, X.y);
    c.scale(X.s, X.s);
    // 1) the glass sinks toward the set colour, more at the edges (soft inner falloff)
    const sink = c.createRadialGradient(0, -H * 0.42, 30, 0, -H * 0.5, H * 0.62);
    sink.addColorStop(0, withAlpha(mixLab(CYAN.set, CYAN.ink, 0.35), 0.3));
    sink.addColorStop(0.7, withAlpha(mixLab(CYAN.set, CYAN.ink, 0.45), 0.45));
    sink.addColorStop(1, withAlpha(mixLab(CYAN.set, CYAN.ink, 0.6), 0.62));
    c.fillStyle = sink;
    c.beginPath();
    c.roundRect(-W / 2, -H, W, H, 6);
    c.fill();
    // 2) bands 1–6: their own light, brightest along the strip's middle (the cyan comes from the bands)
    c.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 6; i++) {
      const r = band(i);
      const g = c.createLinearGradient(r.x, 0, r.x + r.w, 0);
      g.addColorStop(0, withAlpha(CYAN.halo, 0.02));
      g.addColorStop(0.5, withAlpha(CYAN.halo, 0.16));
      g.addColorStop(1, withAlpha(CYAN.halo, 0.02));
      c.fillStyle = g;
      c.fillRect(r.x, r.y, r.w, r.h);
    }
    // 3) a thin cold edge-glow inside the bezel
    for (const [w, a] of [[7, 0.06], [3, 0.12], [1.2, 0.3]] as const) {
      c.strokeStyle = withAlpha(CYAN.core, a);
      c.lineWidth = w;
      c.beginPath();
      c.roundRect(-W / 2 + 1.5, -H + 1.5, W - 3, H - 3, 6);
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
    // 4) band 7: the empty slot's row, dark
    const r7 = band(7);
    c.fillStyle = withAlpha(mixLab(CYAN.ink, '#000000', 0.2), 0.72);
    c.fillRect(r7.x - 1, r7.y - 1, r7.w + 2, r7.h + 2);
    c.strokeStyle = withAlpha(mixLab(CYAN.rim, CYAN.set, 0.4), 0.22);
    c.lineWidth = 1.2;
    c.strokeRect(r7.x, r7.y, r7.w, r7.h);
    c.restore();
  });
}

// ================================================================================================ STAGE
function paintStage(f: Frame, b: B, t: number) {
  const cam = stCam(t);
  f.camera(cam);
  f.setMood('duskRose');
  hopperStage(f, { key: ID, cams: ST_CAMS, t, tq: f.tq, taps: b.taps });
}

// ================================================================================================ type
/** JUNE 2017 (Plex Mono, the era's stamp) and the paper's authors on the line above, bottom-left */
function stamp(f: Frame, t: number, at: number) {
  const a = win(t, at - 0.05, at + 0.45);
  if (a <= 0) return;
  const c = f.c;
  const m = f.mood;
  c.save();
  c.globalAlpha = a;
  softPlate(c, 48 + 250, 648, 640, 130, m.ink, 0.6);
  c.fillStyle = mixLab('#f6ecdb', m.core, 0.12);
  drawTracked(c, 'JUNE 2017', 48 + (1 - a) * -8, 674, { font: `500 22px ${FONT.mono}`, size: 22, tracking: 0.08 });
  c.globalAlpha = a * 0.6;
  c.fillRect(48, 674 - 31, 140 * a, 0.9);
  c.fillRect(48, 674 - 35, 0.9, 8);
  const b2 = win(t, at + 0.35, at + 0.9);
  c.globalAlpha = b2;
  drawTracked(c, 'Christiano et al. · OpenAI and DeepMind', 48, 622, { font: `500 21px ${FONT.mono}`, size: 21, tracking: 0.02 });
  c.restore();
}
