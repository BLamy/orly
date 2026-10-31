/**
 * ch12-s06 — the return to the scene: the dark room of the cold open, 30 November 2022. The little lit box turns
 * translucent, swings open like a door, the first note in the file slides into its light, and the camera pulls
 * back over the fully lit city (serverCyan, 20.83 s, crossfade in from the garden plate).
 *
 * ROOM (sets/ch12-s06-room: the exact composition of ch01-s01, the person in profile at the desk, the mug, fog at
 * desk height, the window on the blue city). The camera opens on ch01-s01's frame and pushes in slowly.
 *   'box'      the little lit box rises out of the laptop's face as a lit paper panel on a slim rod (the chat box
 *              made visible, cursor blinking); the date stamp 30 NOVEMBER 2022 sets in, bottom-left
 *   'tuned'    the panel turns translucent for a moment: a shadow-screen; behind it anonymous racks (soft, far),
 *              in front of them the hedge and the shears from the garden (crisp, near). The label sets in at
 *              upper-left and stays until the pull-back
 *   'all'      through the room's own window the city's small windows light one by one, then in a flood
 *              (no counter, no caption); the camera stays in the room
 *   'door'     the panel swings open on its left edge like a door: warm light spills down across the desk and
 *              the floor toward us (the shot's one warm accent, motivated by the opening)
 *   'file'     chapter 1's folded typed slip slides into the wedge of warm light, comes to rest on the desk and
 *              unfolds; its text stays faint except 'plausible-sounding', which catches the light (prop
 *              lettering; brighter again on 'plausible')
 *   pullBack   the music-only hold: the camera pulls back past the person, a window stile races across the lens
 *              (a hidden cut, as in ch01-s03), and rises over the city, now fully lit; the open door is a small
 *              warm rectangle among the windows ('cityLit')
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { FONT, LAYERS, MOODS, blendPose, defineShot, drawTracked, mixLab, overscan, skyline, softPlate, stars, toScreen, withAlpha, withLife, loopPose, POSES } from '../../../film';
import { FACE06, ROOM06, ROOM06_POSES, room06 } from '../sets/ch12-s06-room';
import { roomPlant, roomVignette } from '../sets/ch01-s01-roomExtras';
import { shearsArt } from '../sets/ch12-s02-garden';
import { frameOn, mixFrame } from '../sets/ch09-s03a-kit';
import { paperTone } from '../sets/caseBoard';
import { clamp01, lerp, sm, subFrame, tq12, win } from '../sets/ch02-s05b-util';

type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
const ID = 'ch12-s06';
const CYAN = MOODS.serverCyan;
const AMBER = MOODS.candleAmber;

// ------------------------------------------------------------------------------------------------ geometry
/** the chat box: a lit paper panel hovering over the laptop on a slim rod (L4 world) */
const BOX = { cx: ROOM06.hinge.x + 64, cy: ROOM06.deskY - 168, w: 214, h: 140 };
const BX0 = BOX.cx - BOX.w / 2, BY0 = BOX.cy - BOX.h / 2;
/** (round 1) where the slip comes to rest: ON the desk top in the wedge of warm light, below the door's lower edge and
 *  clear of the figure, at 75% of its old size (bottom edge on the desk, lying back a little: a 0.92 vertical squash) */
const SLIP_S = 0.75;
const SLIP_SQ = 0.92;
const SLIP = { x: ROOM06.hinge.x + 132, y: ROOM06.deskY - (124 * SLIP_S * SLIP_SQ) / 2 - 1, w: 300, h: 124 };

// ------------------------------------------------------------------------------------------------ cameras
const HOME: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
const PUSH: Camera3 = frameOn({ x: BOX.cx, y: BOX.cy + 30 }, { x: 690, y: 320 }, 1.26);
const DOOR: Camera3 = frameOn({ x: BOX.cx, y: BOX.cy + 70 }, { x: 650, y: 300 }, 1.4);
/** the note insert stops wide enough that the seated figure stays in frame at left, the witness to the open door */
const NOTE: Camera3 = frameOn({ x: SLIP.x, y: SLIP.y - 10 }, { x: 850, y: 470 }, 1.46);
const NOTE2: Camera3 = frameOn({ x: SLIP.x, y: SLIP.y - 12 }, { x: 846, y: 472 }, 1.52);
/** (round 1) the pass-through: the camera lifts off the note and squares up on the room's own window (rising, so the
 *  desk and the figure drop out under the frame), then flies out through one of its panes */
const WINCAM: Camera3 = { x: 1050, y: 236, z: 250, lens: 1 };
const CAMS = [HOME, PUSH, DOOR, NOTE, NOTE2, WINCAM];

/** the city exterior (its own world): rising and pulling back */
const EXT0: Camera3 = frameOn({ x: 640, y: 470 }, { x: 640, y: 400 }, 1.3);
const EXT1: Camera3 = frameOn({ x: 640, y: 400 }, { x: 640, y: 420 }, 1.0);
const EXT_CAMS = [EXT0, EXT1];
/** our building's window in the exterior (L3 world): the open door seen from outside */
const HOME_WIN = { x: 612, y: 452, w: 16, h: 20 };

interface B {
  D: number;
  little: number;
  box: number;
  tuned: number;
  all: number;
  door: number;
  file: number;
  plausible: number;
  pull: number;
  /** the pass-through: the window grid grows from P2A and has left the frame by P2B */
  cut: number;
  cutEnd: number;
  cityLit: number;
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const pull = T.beat('pullBack');
    const b: B = {
      D,
      little: T.word('L1212', 'little'),
      box: T.beat('stamp'),
      tuned: T.beat('behind'),
      all: T.beat('flood'),
      door: T.beat('door'),
      file: T.beat('firstNote'),
      plausible: T.word('L1216', 'plausible'),
      pull,
      cut: pull + 0.62,
      cutEnd: pull + 0.62 + 1.7,
      cityLit: T.beat('cityLit'),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    f.setMood('serverCyan');
    if (t < b.cut + FADE) paintRoom(f, b, t);
    if (t >= b.cutEnd) paintCity(f, b, t);
    else if (t >= b.cut) passThrough(f, b, t);
    type_(f, b, t);
  },
});

// ================================================================================================ camera
function roomCam(b: B, t: number): Camera3 {
  if (t < 2.6) return mixFrame(HOME, { ...HOME, z: 18 }, sm(t / 2.6) * 0.6);
  const h2: Camera3 = mixFrame(HOME, { ...HOME, z: 18 }, 0.6);
  if (t < b.tuned + 0.4) return mixFrame(h2, PUSH, sm((t - 2.6) / (b.tuned + 0.4 - 2.6)));
  if (t < b.door - 1.4) return PUSH;
  if (t < b.door + 0.6) return mixFrame(PUSH, DOOR, sm((t - (b.door - 1.4)) / 2.0));
  if (t < b.file + 1.0) return mixFrame(DOOR, NOTE, sm((t - (b.door + 0.6)) / (b.file + 1.0 - (b.door + 0.6))));
  if (t < b.pull) return mixFrame(NOTE, NOTE2, sm((t - (b.file + 1.0)) / (b.pull - b.file - 1.0)));
  // the lift: off the note, rising and squaring up on the room's window (arrives as the pass-through fade completes)
  const u = clamp01((t - b.pull) / (b.cut + FADE - b.pull));
  return mixFrame(NOTE2, WINCAM, sm(u));
}

// ================================================================================================ ROOM
function personPose(b: B, tq: number): Pose {
  const typing = loopPose('type', POSES.type, tq);
  const k = win(tq, b.box - 0.9, b.box - 0.3);
  let p = k > 0 ? blendPose(typing, ROOM06_POSES.rest, k) : typing;
  // on 'door' the head lifts a little toward the light
  const look = win(tq, b.door - 0.1, b.door + 0.5);
  if (look > 0) p = { ...p, angles: { ...p.angles, head: (p.angles.head ?? 0) - 7 * look, neck: (p.angles.neck ?? 0) - 3 * look } };
  return withLife({ ...p, prev: p }, tq, 26);
}

function paintRoom(f: Frame, b: B, t: number) {
  const cam = roomCam(b, t);
  f.camera(cam);
  const tq = tq12(t);
  const rise = sm((t - (b.little - 0.05)) / 1.2);
  const see = win(t, b.tuned - 0.15, b.tuned + 0.25) * (1 - win(t, b.tuned + 1.55, b.tuned + 1.95));
  const door = sm((tq - (b.door - 0.3)) / 0.75);
  const glow = 0.9 + 0.1 * win(t, b.box - 0.3, b.box + 0.2);
  room06(f, {
    key: ID,
    cams: CAMS,
    glow,
    pose: personPose(b, tq),
    cursorOn: false,
    near: false,
    // (round 1) 'one by one' reads: 8 single windows flare on over 1.25 s, then the flood lands on 'all'
    flood: { t, at: b.all - 1.3, n1: 8, d1: 1.25, d2: 1.4 },
    extra: (c, env) => {
      if (rise > 0) chatBox(c, env, t, rise, see, door);
      slip(c, env, b, t, tq);
    },
    after: (g) => {
      if (rise > 0) boxLight(g, rise, door);
    },
  });
  // the near plane, as ch01-s01 framed it: the rubber plant at frame left and the curtain edge at right (both
  // slide out past the lens as the push begins); the prologue's vignette, easing off with the push
  roomPlant(f, { key: ID, cams: [HOME], x: 70, floor: 790, alpha: 1 });
  // (the curtain is the nearest plane: it leaves the frame as the push starts, softly, before it can sweep across)
  curtain(f, 1 - sm((t - 2.7) / 0.7));
  roomVignette(f, 0.75 * (1 - 0.6 * sm((t - 2.6) / 2.0)));
}

/** ch01-s01's heavy curtain edge at frame right (L6, blurred) */
function curtain(f: Frame, a: number) {
  if (a <= 0.01) return;
  f.layer('L6', (c, env) => {
    c.globalAlpha *= a;
    const r = overscan(LAYERS.L6, [HOME], 40);
    f.cached(`${ID}/curtain/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      cc.fillStyle = env.fill('fg');
      const x0 = 1176;
      cc.beginPath();
      cc.moveTo(x0 + 30, r.y - 10);
      for (let y = r.y; y <= r.y + r.h + 10; y += 40) cc.lineTo(x0 + 14 * Math.sin(y * 0.011) + (y > 560 ? (y - 560) * 0.08 : 0), y);
      cc.lineTo(r.x + r.w + 10, r.y + r.h + 10);
      cc.lineTo(r.x + r.w + 10, r.y - 10);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.12);
      cc.lineWidth = 3;
      cc.beginPath();
      cc.moveTo(x0 + 46, r.y);
      cc.lineTo(x0 + 52, r.y + r.h);
      cc.stroke();
    })(c, r.x, r.y);
  });
}

/** the chat box: a lit paper panel on a rod, rising out of the laptop's face; translucent (`see`); a door (`door`) */
function chatBox(c: C, env: PaintEnv, t: number, rise: number, see: number, door: number) {
  const ink = env.fill('ink');
  // it rises out of the face: from a sliver at the face to its full size above the laptop
  const cx = lerp(FACE06.x, BOX.cx, rise), cy = lerp(FACE06.y, BOX.cy, rise);
  const w = lerp(16, BOX.w, rise), h = lerp(40, BOX.h, rise);
  const x0 = cx - w / 2, y0 = cy - h / 2;
  c.save();
  // first the laptop's glow swells, then the panel lifts out of it
  if (rise < 0.6) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gr = c.createRadialGradient(cx, cy, 2, cx, cy, 30 + 90 * rise);
    gr.addColorStop(0, withAlpha(CYAN.core, 0.5 * Math.sin(Math.PI * Math.min(1, rise / 0.6))));
    gr.addColorStop(1, withAlpha(CYAN.halo, 0));
    c.fillStyle = gr;
    c.fillRect(cx - 130, cy - 130, 260, 260);
    c.restore();
  }
  c.globalAlpha *= clamp01((rise - 0.08) * 4);
  // the rod: a slim ink stick from behind the laptop up to the panel's bottom edge
  c.fillStyle = ink;
  c.fillRect(cx - 1.5, y0 + h, 3, ROOM06.deskY - (y0 + h));
  // the bezel
  c.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
  if (door > 0.001) {
    // behind the door: warm light (the opening), then the panel swung on its left edge toward us
    // the opening: a warm light source, hottest low and toward the hinge side, falling off to the frame
    const g = c.createRadialGradient(x0 + w * 0.4, y0 + h * 0.62, 4, x0 + w * 0.4, y0 + h * 0.62, w * 0.75);
    g.addColorStop(0, mixLab(mixLab(AMBER.core, '#fff3d6', 0.25), AMBER.set, 0.15));
    g.addColorStop(0.45, mixLab(AMBER.core, AMBER.set, 0.32));
    g.addColorStop(1, mixLab(AMBER.halo, AMBER.set, 0.55));
    c.fillStyle = g;
    c.fillRect(x0, y0, w, h);
    // a far doorway's floorboards in the light (a few soft lines converging), so it reads as a way through
    c.strokeStyle = withAlpha(AMBER.halo, 0.35);
    c.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      c.beginPath();
      c.moveTo(x0 + w * 0.4 + i * 6, y0 + h * 0.62);
      c.lineTo(x0 + w * 0.4 + i * 36, y0 + h);
      c.stroke();
    }
    const ang = door * Math.PI * 0.47;
    const pw = w * Math.cos(ang);
    const flare = 22 * Math.sin(ang);
    const face = c.createLinearGradient(x0, 0, x0 + pw, 0);
    face.addColorStop(0, mixLab(CYAN.halo, CYAN.set, 0.25 + 0.35 * door));
    face.addColorStop(1, mixLab(CYAN.halo, CYAN.ink, 0.3 + 0.4 * door));
    c.fillStyle = face;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x0 + pw, y0 - flare);
    c.lineTo(x0 + pw, y0 + h + flare);
    c.lineTo(x0, y0 + h);
    c.closePath();
    c.fill();
    // the door's edge catches the warm light
    c.fillStyle = withAlpha(AMBER.core, 0.7 * door);
    c.fillRect(x0 + pw - 1.5, y0 - flare, 2.5, h + 2 * flare);
  } else {
    const g = c.createLinearGradient(x0, y0, x0, y0 + h);
    g.addColorStop(0, mixLab(CYAN.halo, CYAN.core, 0.42));
    g.addColorStop(1, mixLab(CYAN.halo, CYAN.set, 0.15));
    c.fillStyle = g;
    c.fillRect(x0, y0, w, h);
    if (see > 0.01) shadowScreen(c, env, x0, y0, w, h, see, t);
    // the faint input field and the cursor (shape only, nothing readable)
    if (rise > 0.9) {
      c.globalAlpha *= 1 - 0.75 * see;
      c.strokeStyle = withAlpha(CYAN.core, 0.55);
      c.lineWidth = 1;
      c.strokeRect(x0 + 14, y0 + h - 34, w - 28, 20);
      if (Math.floor(t * 2) % 2 === 0) {
        c.fillStyle = CYAN.core;
        c.fillRect(x0 + 22, y0 + h - 30, 3, 12);
      }
    }
  }
  c.restore();
}

/** the panel as a shadow-screen: soft racks far behind it, the hedge and the shears crisp against it */
function shadowScreen(c: C, env: PaintEnv, x0: number, y0: number, w: number, h: number, see: number, t: number) {
  const ink = mixLab(CYAN.ink, CYAN.set, 0.2);
  c.save();
  c.beginPath();
  c.rect(x0, y0, w, h);
  c.clip();
  // the backlight brightens as the skin turns translucent
  c.fillStyle = withAlpha(CYAN.core, 0.25 * see);
  c.fillRect(x0, y0, w, h);
  // racks: far, soft-edged (penumbra), a row of five with LED rows, receding
  c.globalAlpha = 0.55 * see;
  c.fillStyle = withAlpha(ink, 0.8);
  for (let i = 0; i < 6; i++) {
    const rx = x0 + 8 + i * (w - 16) / 6;
    const rw = (w - 16) / 6 - 6;
    const top = y0 + 14 + (i % 2) * 4;
    for (let k = 0; k < 3; k++) {
      // three offset copies make a soft penumbra (far from the screen = soft)
      c.globalAlpha = 0.2 * see;
      c.fillRect(rx - 1.5 + k * 1.5, top - 1 + k, rw, h - 26);
    }
    c.globalAlpha = 0.55 * see;
    c.fillStyle = withAlpha(CYAN.core, 0.6);
    for (let r = 0; r < 6; r++) c.fillRect(rx + 3, top + 8 + r * 12, 3, 2);
    c.fillStyle = withAlpha(ink, 0.8);
  }
  // the hedge (left) and the shears (right): near the screen, crisp
  c.globalAlpha = see;
  c.fillStyle = ink;
  c.beginPath();
  const hx = x0 + w * 0.3, hy = y0 + h;
  c.moveTo(hx - 58, hy);
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI + (i / 20) * Math.PI;
    const r = 46 + 6 * Math.sin(i * 2.7) + 4 * Math.cos(i * 5.1);
    c.lineTo(hx + Math.cos(a) * r * 1.25, hy - 6 + Math.sin(a) * r * 0.95);
  }
  c.lineTo(hx + 58, hy);
  c.closePath();
  c.fill();
  shearsArt(c, { ...env, fill: () => ink, mood: { ...env.mood, rim: CYAN.core } }, x0 + w * 0.72, y0 + h * 0.6, 0.62, -0.5, 0.55);
  c.restore();
  void t;
}

/** the box's own glow, then (on 'door') the wedge of warm light spilling down across the desk and floor */
function boxLight(f: Frame, rise: number, door: number) {
  f.practical({ x: BOX.cx, y: BOX.cy, kind: 'screen', seed: 1262, intensity: 0.4 * rise * (1 - 0.6 * door), radius: 60 });
  if (door <= 0.01) return;
  f.layer('L4', (c) => {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const x0 = BX0, x1 = BX0 + BOX.w, y = BY0 + BOX.h;
    // the wedge, widening toward us down to the floor. (round 1) its EDGES are held ≈ 15% lower in chroma (a
    // desaturated base fill) and only its core carries the full amber, so the cyan room still reads as night
    const wedge = new Path2D();
    wedge.moveTo(x0 + 8, y);
    wedge.lineTo(x1, y - BOX.h * 0.15);
    wedge.lineTo(x1 + 340, 820);
    wedge.lineTo(x0 - 120, 820);
    wedge.closePath();
    const dull = mixLab(AMBER.halo, '#8f969a', 0.32);
    const g = c.createLinearGradient(0, BY0, 0, 800);
    g.addColorStop(0, withAlpha(dull, 0.2 * door));
    g.addColorStop(0.45, withAlpha(dull, 0.12 * door));
    g.addColorStop(1, withAlpha(dull, 0.08 * door));
    c.fillStyle = g;
    c.fill(wedge);
    const coreX = (x0 + x1) / 2 + 90;
    const h = c.createLinearGradient(coreX - 330, 0, coreX + 330, 0);
    h.addColorStop(0, withAlpha(AMBER.halo, 0));
    h.addColorStop(0.5, withAlpha(AMBER.halo, 0.09 * door));
    h.addColorStop(1, withAlpha(AMBER.halo, 0));
    c.fillStyle = h;
    c.fill(wedge);
    // the light's glow at the opening and its pool on the desk top and the floor
    const o = c.createRadialGradient(BOX.cx, BOX.cy, 10, BOX.cx, BOX.cy, 260);
    o.addColorStop(0, withAlpha(AMBER.core, 0.2 * door));
    o.addColorStop(1, withAlpha(AMBER.halo, 0));
    c.fillStyle = o;
    c.fillRect(BOX.cx - 260, BOX.cy - 260, 520, 520);
    const p = c.createRadialGradient(BOX.cx + 30, ROOM06.deskY, 4, BOX.cx + 30, ROOM06.deskY, 260);
    p.addColorStop(0, withAlpha(AMBER.core, 0.42 * door));
    p.addColorStop(1, withAlpha(AMBER.halo, 0));
    c.fillStyle = p;
    c.fillRect(BOX.cx - 240, ROOM06.deskY - 30, 540, 40);
    // the spill's pool on the floor toward us (the warmth lives in the light it throws)
    const fl = c.createRadialGradient(BOX.cx + 80, ROOM06.floorY + 20, 10, BOX.cx + 80, ROOM06.floorY + 20, 360);
    fl.addColorStop(0, withAlpha(AMBER.halo, 0.24 * door));
    fl.addColorStop(0.55, withAlpha(mixLab(AMBER.halo, '#8f969a', 0.3), 0.1 * door));
    fl.addColorStop(1, withAlpha(dull, 0));
    c.fillStyle = fl;
    c.fillRect(BOX.cx - 300, ROOM06.floorY - 80, 760, 200);
    c.restore();
  });
}

// ------------------------------------------------------------------------------------------------ the slip
/** the slip's typed lines (chapter 1's note): only 'plausible-sounding' is set to be read; the rest is faint texture */
const FAINT = ['“ChatGPT sometimes writes', 'but incorrect or nonsensical answers.”'];
function slip(c: C, env: PaintEnv, b: B, t: number, tq: number) {
  const s0 = b.file - 0.55;
  if (tq < s0) return;
  // (round 1) it slides OUT OF THE OPEN DOOR and down the wedge of warm light onto the desk, so it stays inside the
  // frame the whole way (no edge-crossing), growing as it comes toward us; lands, then unfolds
  const u = clamp01((tq - s0) / 0.95);
  const from = { x: BOX.cx + 12, y: BOX.cy + 10 };
  const p = { x: lerp(from.x, SLIP.x, sm(u)), y: lerp(from.y, SLIP.y, sm(u)) - 26 * Math.sin(Math.PI * u) };
  const scale = lerp(0.3, SLIP_S, sm(u));
  const rot = lerp(0.2, -0.01, sm(u));
  const open = sm((tq - (s0 + 1.0)) / 0.6);
  const catchA = win(t, s0 + 1.3, s0 + 1.9) * 0.75 + 0.25 * Math.max(0, 1 - Math.abs(t - b.plausible - 0.3) / 0.6) + 0.25 * win(t, b.plausible - 0.1, b.plausible + 0.3);
  c.save();
  c.globalAlpha *= clamp01(u * 5);
  drawSlip(c, env, p, rot, scale, open, catchA);
  c.restore();
}

function drawSlip(c: C, env: PaintEnv, p: Pt, rot: number, scale: number, open: number, lit: number) {
  const W = SLIP.w, H = SLIP.h;
  const paper = mixLab(paperTone(env, 0.95), AMBER.core, 0.35);
  const ink = mixLab(env.mood.ink, paper, 0.1);
  // folded in half: the right half lies behind the left until it opens (visible width = half + half × open)
  const half = W / 2;
  const vw = half + half * open;
  const L = -vw / 2;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(rot);
  c.scale(scale, scale * lerp(1, SLIP_SQ, clamp01((scale - 0.3) / (SLIP_S - 0.3))));
  // its contact shadow on the desk (it rests on the desk top)
  c.fillStyle = withAlpha(env.mood.fg, 0.45);
  c.fillRect(L - 4, H / 2 - 4, vw + 14, 8);
  c.fillStyle = paper;
  c.fillRect(L, -H / 2, vw, H);
  // the crease, and the opening half a shade darker as it turns toward the light
  c.fillStyle = withAlpha(env.mood.fg, 0.1 + 0.2 * (1 - open));
  c.fillRect(L + half, -H / 2, vw - half, H);
  c.fillStyle = withAlpha(env.mood.fg, 0.3);
  c.fillRect(L + half - 0.6, -H / 2, 1.2, H);
  // the typed text (revealed as it opens): two faint lines of texture, and the one word set to be read
  c.save();
  c.beginPath();
  c.rect(L, -H / 2, vw, H);
  c.clip();
  const tx = L + 12;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = `400 12px ${FONT.typewriter}`;
  c.fillStyle = withAlpha(ink, 0.22);
  c.fillText(FAINT[0], tx, -H / 2 + 24);
  c.fillText(FAINT[1], tx, -H / 2 + 104);
  // 'plausible-sounding': 25 px Special Elite on the 0.75× slip (≈ 27 px cap height at 1080p in the note's framing)
  c.font = `400 25px ${FONT.typewriter}`;
  const pw = c.measureText('plausible-sounding').width;
  const py = -H / 2 + 70;
  if (lit > 0.02) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(tx + pw / 2, py - 8, 2, tx + pw / 2, py - 8, pw * 0.72);
    g.addColorStop(0, withAlpha(AMBER.halo, 0.34 * lit));
    g.addColorStop(1, withAlpha(AMBER.halo, 0));
    c.fillStyle = g;
    c.fillRect(tx - 16, py - 40, pw + 32, 56);
    c.restore();
  }
  c.fillStyle = withAlpha(mixLab(ink, '#1a120a', 0.4), 0.35 + 0.63 * clamp01(lit));
  c.fillText('plausible-sounding', tx, py);
  c.restore();
  c.restore();
}

// ================================================================================================ CITY
function paintCity(f: Frame, b: B, t: number) {
  const u = sm((t - b.cut) / (b.D - b.cut - 0.4));
  const cam = mixFrame(EXT0, EXT1, u);
  f.camera(cam);
  f.backlight({ sunX: 640, sunY: 600, sunRadius: 560, intensity: 0.8 });
  const bake = (key: string, layer: (typeof LAYERS)[keyof typeof LAYERS], paint: (cc: C, r: { x: number; y: number; w: number; h: number }, env: PaintEnv) => void) =>
    f.layer(layer, (c, env) => {
      const r = overscan(layer, EXT_CAMS, 60);
      f.cached(`${ID}/ext/${key}/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        paint(cc, r, env);
      })(c, r.x, r.y);
    });
  bake('L1', LAYERS.L1, (cc, r, env) => {
    stars(cc, { x: r.x, y: r.y, w: r.w, h: 300, count: 80, seed: 1226, twinkle: 0 }, env);
    skyline(cc, { style: 'megacity', x0: r.x, x1: r.x + r.w, y: 640, height: 420, seed: 2022, lit: 0.8, ground: 600 }, env);
  });
  f.fog({ yCenter: 560, height: 300, alpha: 0.24, drift: -6 });
  bake('L2', LAYERS.L2, (cc, r, env) => {
    skyline(cc, { style: 'megacity', x0: r.x, x1: r.x + r.w, y: 720, height: 430, seed: 1130, lit: 0.85, ground: 600 }, env);
  });
  f.fog({ yCenter: 640, height: 200, alpha: 0.18, drift: -9 });
  bake('L3', LAYERS.L3, (cc, r, env) => {
    // the near rank: a few broad towers; ours a little left of centre
    cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.5);
    const towers = [
      [r.x - 20, 300, 360],
      [330, 210, 300],
      [560, 130, 380],
      [720, 260, 330],
      [900, 220, 410],
      [1150, r.x + r.w - 1150 + 20, 340],
    ];
    for (const [x, w, top] of towers) cc.fillRect(x, top, w, 900);
    let i = 0;
    let ti = 0;
    for (const [x, w, top] of towers) {
      ti++;
      // each tower its own window rhythm and warmth of cool light; a few windows stay dark
      const pitchX = 14 + (ti % 3) * 3, pitchY = 18 + (ti % 2) * 4;
      const ww = 5 + (ti % 2), wh = 8 + (ti % 3);
      for (let y = top + 14; y < 760; y += pitchY) {
        for (let xx = x + 9; xx < x + w - 12; xx += pitchX) {
          i++;
          if (Math.abs(xx - HOME_WIN.x) < 12 && Math.abs(y - HOME_WIN.y) < 14) continue;
          const hsh = ((i * 2654435761) >>> 0) % 100;
          if (hsh < 14) continue;
          cc.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.halo, 0.35 + (hsh % 5) * 0.08), 0.55 + (hsh % 7) * 0.05);
          cc.fillRect(xx, y, ww, wh);
        }
      }
    }
  });
  // our window: the open door's warm light among the cool windows
  f.layer('L3', (c) => {
    const k = 0.85 + 0.15 * win(t, b.cityLit - 0.4, b.cityLit + 0.4);
    c.fillStyle = mixLab(AMBER.core, '#fff1cf', 0.2);
    c.fillRect(HOME_WIN.x - 2, HOME_WIN.y - 2, HOME_WIN.w, HOME_WIN.h);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(HOME_WIN.x + 6, HOME_WIN.y + 8, 2, HOME_WIN.x + 6, HOME_WIN.y + 8, 70);
    g.addColorStop(0, withAlpha(AMBER.halo, 0.5 * k));
    g.addColorStop(1, withAlpha(AMBER.halo, 0));
    c.fillStyle = g;
    c.fillRect(HOME_WIN.x - 70, HOME_WIN.y - 70, 150, 150);
    c.restore();
  });
  f.fog({ yCenter: 760, height: 160, alpha: 0.2, drift: -4 });
}

// ================================================================================================ the pass-through
const FADE = 0.36;
/** (round 1) out through the room's REAL window: its mullion grid and frame (the L2 geometry, as the camera last saw it)
 *  grow about one pane and slide off the frame while the city shows through the glass; the wall around the window keeps
 *  its hazed value (no flat black slab); the near frame blurs as it nears the lens. Eased over 1.7 s. */
function passThrough(f: Frame, b: B, t: number) {
  const W = ROOM06.window;
  const u = clamp01((t - b.cut) / (b.cutEnd - b.cut));
  const e = u * u * (3 - 2 * u);
  const a = sm((t - b.cut) / FADE);
  const camR = roomCam(b, Math.min(t, b.cut + FADE));
  // the pane we fly through (column 3 of 4, row 3 of 5) and where it is on screen as the camera last saw it
  const Fw = { x: W.x + (W.w * 2.5) / 4, y: W.y + (W.h * 2.5) / 5 };
  const F0 = toScreen(LAYERS.L2, camR, Fw.x, Fw.y);
  const s = Math.exp(Math.log(8.5) * Math.pow(e, 1.25));
  const C0 = { x: lerp(F0.x, 640, e), y: lerp(F0.y, 372, e) };
  const map = (x: number, y: number) => {
    const q = toScreen(LAYERS.L2, camR, x, y);
    return { x: C0.x + (q.x - F0.x) * s, y: C0.y + (q.y - F0.y) * s };
  };
  const unit = F0.k * s; // screen px per window-world px
  // the city beyond the glass
  const cv = subFrame(f, `${ID}/ext`, 'serverCyan', (g) => paintCity(g, b, t));
  // the wall and the grid go onto the city's own buffer, then the whole view blends in over the room
  const c = cv.getContext('2d')!;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  c.globalAlpha = 1;
  // the wall around the window, at its hazed value (lifted by the city's spill near the glass)
  const r0 = map(W.x, W.y), r1 = map(W.x + W.w, W.y + W.h);
  const wall = mixLab(mixLab(CYAN.set, CYAN.fg, 0.62), CYAN.haze, 0.2);
  c.fillStyle = wall;
  c.beginPath();
  c.rect(-40, -40, 1360, 800);
  c.rect(r0.x, r0.y, r1.x - r0.x, r1.y - r0.y);
  c.fill('evenodd');
  const sp = c.createRadialGradient((r0.x + r1.x) / 2, (r0.y + r1.y) / 2, 10, (r0.x + r1.x) / 2, (r0.y + r1.y) / 2, Math.max(300, (r1.x - r0.x) * 0.9));
  sp.addColorStop(0, withAlpha(CYAN.halo, 0.14));
  sp.addColorStop(1, withAlpha(CYAN.halo, 0));
  c.fillStyle = sp;
  c.beginPath();
  c.rect(-40, -40, 1360, 800);
  c.rect(r0.x, r0.y, r1.x - r0.x, r1.y - r0.y);
  c.fill('evenodd');
  // the mullion grid and the frame: ink bars with rim hairlines on their window-facing edges, blurring as they near
  const blurPx = (0.8 + 7 * e) * (f.pxScale / 1.5);
  c.filter = `blur(${blurPx.toFixed(2)}px)`;
  const ink = mixLab(CYAN.ink, CYAN.set, 0.12);
  c.fillStyle = ink;
  const bar = 7 * unit;
  const cols = 4, rows = 5;
  for (let i = 1; i < cols; i++) {
    const x = map(W.x + (W.w * i) / cols, 0).x;
    c.fillRect(x - bar / 2, r0.y, bar, r1.y - r0.y);
  }
  for (let j = 1; j < rows; j++) {
    const y = map(0, W.y + (W.h * j) / rows).y;
    c.fillRect(r0.x, y - bar / 2, r1.x - r0.x, bar);
  }
  c.fillRect(r0.x - 12 * unit, r0.y - 12 * unit, r1.x - r0.x + 24 * unit, 13 * unit);
  c.fillRect(r0.x - 12 * unit, r0.y, 12 * unit, r1.y - r0.y);
  c.fillRect(r1.x, r0.y, 12 * unit, r1.y - r0.y);
  c.fillRect(r0.x - 22 * unit, r1.y, r1.x - r0.x + 44 * unit, 14 * unit);
  c.fillStyle = withAlpha(CYAN.rim, 0.34);
  for (let i = 1; i < cols; i++) {
    const x = map(W.x + (W.w * i) / cols, 0).x;
    c.fillRect(x - bar / 2, r0.y, Math.max(1, unit), r1.y - r0.y);
  }
  c.filter = 'none';
  c.restore();
  const o = f.c;
  o.save();
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.globalAlpha = a;
  o.drawImage(cv, 0, 0);
  o.restore();
}

// ================================================================================================ type
function type_(f: Frame, b: B, t: number) {
  const c = f.c;
  const m = f.mood;
  // the date stamp: on 'box', until the pull-back
  const a = win(t, b.box - 0.05, b.box + 0.45) * (1 - win(t, b.pull - 0.4, b.pull));
  if (a > 0) {
    c.save();
    c.globalAlpha = a;
    // (round 1) at the floor: 22 px Plex Mono ≈ 23 px cap height at 1080p
    softPlate(c, 48 + 140, 665, 480, 84, m.ink, 0.55);
    c.fillStyle = mixLab('#efe3cf', m.core, 0.2);
    drawTracked(c, '30 NOVEMBER 2022', 48 + (1 - a) * -8, 674, { font: `500 22px ${FONT.mono}`, size: 22, tracking: 0.08 });
    c.globalAlpha = a * 0.6;
    c.fillRect(48, 674 - 31, 270 * a, 0.9);
    c.fillRect(48, 674 - 35, 0.9, 8);
    c.restore();
  }
  // the label: on 'tuned', until the pull-back (upper-left, over the dark wall)
  const l = win(t, b.tuned - 0.05, b.tuned + 0.5) * (1 - win(t, b.pull - 0.4, b.pull));
  if (l > 0) {
    c.save();
    c.globalAlpha = l;
    // (round 1, review: 'raise the size and contrast'): 26 / 23 px Plex Mono (≈ 27 / 24 px cap height at 1080p) on a
    // denser plate, the lead line near-white, the two facts a step behind it
    // (round 1) moved 28 px right and down, clear of the glossary-tag corner, on a denser soft plate of its own
    const LX = 76, LY = 14;
    softPlate(c, LX + 240, 112 + LY, 640, 176, '#020a0d', 0.86);
    c.fillStyle = mixLab('#fbf4e6', m.core, 0.06);
    drawTracked(c, 'a free ‘research preview’', LX, 80 + LY, { font: `500 26px ${FONT.mono}`, size: 26, tracking: 0.02 });
    c.fillStyle = mixLab('#eee6d6', m.core, 0.14);
    drawTracked(c, 'fine-tuned from a GPT-3.5 model', LX, 116 + LY, { font: `400 23px ${FONT.mono}`, size: 23, tracking: 0.0 });
    drawTracked(c, 'trained with human feedback', LX, 148 + LY, { font: `400 23px ${FONT.mono}`, size: 23, tracking: 0.0 });
    c.restore();
  }
}
