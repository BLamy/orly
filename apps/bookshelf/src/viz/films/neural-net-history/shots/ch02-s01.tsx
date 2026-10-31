/**
 * ch02-s01 — Chicago, about 1941: the El at dusk, a lit window, and the study where Warren McCulloch
 * offers the shy teenager Walter Pitts a home (candleAmber, crossfade in from the title card, 9.04 s).
 *
 * The CHAPTER INDEX TAB ("Clue One: A Switch That Fires") drops at top-left on the first line and slides
 * back up; the date stamp types itself bottom-left. One continuous camera move:
 *   EXTERIOR  the amber dusk; a far 1940s skyline (L1); an elevated-railway trestle crossing the sky in the
 *             foreground with a train of lit windows sliding left → right (its rumble trembles the haze);
 *             a dark brick house front with ONE lit window: the lamp's room, seen small through the glass.
 *   THROUGH   the camera dollies at the lit window: the trestle swoops up and out over the lens, the facade
 *             grows until its window bars slide off frame and we are inside (a true multiplane pass: the
 *             facade and the trestle are absolute-depth planes in front of the interior's layers).
 *   INTERIOR  a lamplit family study: two tall windows on the dusk, a bookcase, a rolltop desk and a standard
 *             lamp at left, a doorway at right. McCulloch (beard, three-piece, watch chain) at left facing
 *             right; Pitts, slight, round glasses, papers held to his chest, in the doorway facing left.
 *   beats     'doctor' − 0.7 (mcculloch): his name card; he steps forward and offers his hand.
 *             'home' (home): a second lamp comes on in the doorway behind them (the household beyond,
 *             never shown); the camera starts to ease back: the room is warmer than we thought.
 *             Pitts hesitates on twos (a half-raised hand, withdrawn), then steps in and shakes it on
 *             'Warren McCulloch'; McCulloch's far hand gestures him in.
 *             'Pitts' (pitts): Walter Pitts · about 18.
 */
import { ease } from '../../../core';
import { Timeline } from '../../../core';
import {
  CAMERA3_HOME,
  LAYERS,
  ZA,
  POSES,
  addPose,
  blendPose,
  FONT,
  bookshelfWall,
  defineShot,
  envelope,
  hash1,
  mixLab,
  nameCard,
  overscan,
  pose,
  skyline,
  softPlate,
  textColor,
  vnoise,
  walkTo,
  withAlpha,
  withLife,
  writingDesk,
} from '../../../film';
import type { Camera3, FilmFrame, Frame, LayerSpec, PaintEnv, Palette, Pose, PuppetDrawOpts, Rect } from '../../../film';
import { cast } from '../cast';
import { indexTab } from '../sets/indexTab';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';

type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const smoother = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ------------------------------------------------------------------------------------------------ camera
/** start: far outside, looking at the lit window; end: inside the study (rest framing, a touch in) */
const Z0 = -2600;
const Z1 = 40;
const DOLLY_AT = 0.2;
const DOLLY_DUR = 5.0;
/** the pull-back after 'home' (dolly units): the action plane shrinks about 9% */
const BACK = 100;
/**
 * Depth warp: the dolly is geometric (constant perceived speed) EXCEPT through the facade's window, where
 * it quickens so the frame and the two mullions sweep past the lens in about a third of a second instead
 * of lingering over the figures like a double exposure.
 */
function warp(p: number) {
  const A = 0.22, c0 = 0.575, hw = 0.11;
  return (1 - A) * p + A * sm((p - (c0 - hw)) / (2 * hw));
}
function camAt(t: number, homeAt: number, D: number): Camera3 {
  const u = smoother((t - DOLLY_AT) / DOLLY_DUR);
  const z = ZA - (ZA - Z0) * Math.pow((ZA - Z1) / (ZA - Z0), warp(u));
  // on 'home' the camera eases BACK: the room turns out warmer and larger than we thought; the doorway
  // lamp and the bookcase open up around the handshake
  const b0 = homeAt - 0.15;
  const back = smoother((t - b0) / Math.max(1, D - b0));
  return { x: 640 + 14 * u + 10 * back, y: 300 + 78 * Math.pow(u, 0.8) - 6 * back, z: z - BACK * back, lens: 1 };
}
const END_CAMS: Camera3[] = [
  { x: 654, y: 378, z: Z1, lens: 1 },
  { x: 664, y: 372, z: Z1 - BACK, lens: 1 },
  { x: 640, y: 420, z: -700, lens: 1 },
];

// ------------------------------------------------------------------------------------------------ the exterior (absolute depth planes)
/**
 * Absolute-depth planes for the exterior (in front of the interior's layer stack, which sits at the
 * standard depths). A world point W at depth z lands at C + (W − cam.xy)·s with s = ZA/(z − cam.z): the
 * same projection the multiplane layers use, so the facade and the room behind its window agree exactly.
 */
const FACADE_Z = -450;
const TRESTLE_Z = -1150;
/** the lit window in the facade (world units at the facade's depth) */
const WIN = { x0: 270, x1: 1010, y0: 300, y1: 700 };
/** a 'Chicago window': a wide fixed centre pane flanked by two narrow sashes. The mullions sit OUTSIDE the
 *  figures' lines of sight for the whole approach, so neither figure is ever cut by a bar. */
const WIN_BARS = [640 - 236, 640 + 236];

function absS(cam: Camera3, z: number) {
  const d = z - cam.z;
  return d > 1 ? (ZA * cam.lens) / d : Infinity;
}
function absToScreen(cam: Camera3, z: number, x: number, y: number) {
  const s = absS(cam, z);
  return { x: 640 + (x - cam.x) * s, y: 360 + (y - cam.y) * s, s };
}
function setAbs(f: Frame, cam: Camera3, z: number) {
  const s = absS(cam, z);
  const ps = f.pxScale;
  f.c.setTransform(ps * s, 0, 0, ps * s, ps * (640 - cam.x * s), ps * (360 - cam.y * s));
  return s;
}
/** the window hole's screen rect (null when the facade has passed the lens) */
function windowRect(cam: Camera3) {
  if (FACADE_Z - cam.z < 30) return null;
  const a = absToScreen(cam, FACADE_Z, WIN.x0, WIN.y0);
  const b = absToScreen(cam, FACADE_Z, WIN.x1, WIN.y1);
  return { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
}
const facadeCovers = (r: ReturnType<typeof windowRect>) => !r || (r.x0 < -12 && r.x1 > 1292 && r.y0 < -12 && r.y1 > 732);

function drawFacade(f: Frame, cam: Camera3, env: PaintEnv, spill: number) {
  const c = f.c;
  c.save();
  const s = setAbs(f, cam, FACADE_Z);
  const P = env.mood;
  // depth of field: as the facade nears the lens it is a NEAR plane (L5/L6 grammar): darker, and soft
  // (a focus pull: from s ≈ 0.6 the lens racks to the room inside, so the jambs and lintel sweep past soft)
  const near = clamp01((s - 0.6) / 0.9);
  const blur = 8 * near;
  if (blur > 0.3) c.filter = `blur(${(blur * f.pxScale).toFixed(2)}px)`;
  const wall = mixLab(P.fg, P.set, 0.28 * (1 - 0.7 * near));
  // the house front: a brick wall with the lit window as a HOLE; a cornice; a neighbour's taller wall at right
  const p = new Path2D();
  p.rect(-2600, 170, 5400, 2600);
  p.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
  c.fillStyle = wall;
  c.fill(p, 'evenodd');
  // neighbour (right) rises higher, a step in the roofline
  c.fillStyle = mixLab(P.fg, P.set, 0.18);
  c.fillRect(1640, 40, 1400, 140);
  c.fillRect(1640, 170, 1400, 2600);
  c.fillRect(-2600, 90, 900, 90); // a lower neighbour at left with a chimney
  c.fillRect(-2280, 20, 70, 80);
  // cornice + parapet
  c.fillStyle = mixLab(P.fg, P.set, 0.12);
  c.fillRect(-1700, 152, 3340, 26);
  c.fillRect(-1700, 136, 3340, 8);
  for (let x = -1660; x < 1620; x += 54) c.fillRect(x, 178, 20, 12); // dentils
  // brick coursing: running bond as faint rim cut-lines, lit a little more near the window's spill
  c.strokeStyle = withAlpha(P.rim, 0.1);
  c.lineWidth = 1.1 / s;
  c.stroke(brickPath());
  // the neighbours' windows: sash windows with lintels and sills; two of them dimly lit (life next door),
  // the rest dark glass
  for (const w of NEIGHBOUR_WINDOWS) {
    c.fillStyle = mixLab(P.fg, P.ink, 0.5);
    c.fillRect(w.x - 14, w.y - 20, w.w + 28, 20);
    c.fillRect(w.x - 20, w.y + w.h, w.w + 40, 16);
    if (w.lit) {
      const g = c.createLinearGradient(0, w.y, 0, w.y + w.h);
      g.addColorStop(0, mixLab(P.set, P.halo, 0.22 * w.lit));
      g.addColorStop(1, mixLab(P.set, P.halo, 0.55 * w.lit));
      c.fillStyle = g;
    } else c.fillStyle = mixLab(P.fg, P.set, 0.06);
    c.fillRect(w.x, w.y, w.w, w.h);
    c.fillStyle = mixLab(P.fg, P.ink, 0.5);
    if (w.lit) c.fillRect(w.x, w.y, w.w, w.h * 0.36); // a blind half drawn
    c.fillRect(w.x + w.w / 2 - 4, w.y, 8, w.h);
    c.fillRect(w.x, w.y + w.h / 2 - 5, w.w, 10);
  }
  // the window: deep frame, sill, lintel, the bars (two mullions and a transom: the camera aims between them)
  c.fillStyle = mixLab(P.fg, P.ink, 0.5);
  c.fillRect(WIN.x0 - 26, WIN.y0 - 30, WIN.x1 - WIN.x0 + 52, 30); // lintel
  c.fillRect(WIN.x0 - 40, WIN.y1, WIN.x1 - WIN.x0 + 80, 26); // sill
  c.fillRect(WIN.x0 - 12, WIN.y0, 12, WIN.y1 - WIN.y0);
  c.fillRect(WIN.x1, WIN.y0, 12, WIN.y1 - WIN.y0);
  for (const bx of WIN_BARS) c.fillRect(bx - 6, WIN.y0, 12, WIN.y1 - WIN.y0);
  // the side sashes' meeting rails only (high and low, clear of the centre pane)
  c.fillRect(WIN.x0, 470, WIN_BARS[0] - WIN.x0, 9);
  c.fillRect(WIN_BARS[1], 470, WIN.x1 - WIN_BARS[1], 9);
  // an iron area railing and the stoop's newel along the street: the lower facade is not a blank wall
  c.fillStyle = mixLab(P.fg, P.ink, 0.6);
  c.fillRect(-2600, 905, 5400, 10);
  c.fillRect(-2600, 1010, 5400, 8);
  for (let x = -2600; x < 2800; x += 34) {
    c.fillRect(x - 3, 905, 6, 200);
    c.beginPath();
    c.moveTo(x - 7, 908);
    c.lineTo(x, 884);
    c.lineTo(x + 7, 908);
    c.closePath();
    c.fill();
  }
  for (const nx of [WIN.x0 - 120, WIN.x1 + 120]) {
    c.fillRect(nx - 18, 860, 36, 260);
    c.beginPath();
    c.arc(nx, 852, 22, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = withAlpha(P.rim, 0.16);
  c.fillRect(-2600, 905, 5400, 1.5 / s);
  // the lamp's light spilling onto the brick around the window (additive, motivated by the window)
  c.globalCompositeOperation = 'lighter';
  const cx = (WIN.x0 + WIN.x1) / 2, cy = (WIN.y0 + WIN.y1) / 2 + 40;
  const g = c.createRadialGradient(cx, cy, 200, cx, cy, 760);
  g.addColorStop(0, withAlpha(P.halo, 0.16 * spill));
  g.addColorStop(1, withAlpha(P.halo, 0));
  c.fillStyle = g;
  c.fillRect(cx - 760, cy - 760, 1520, 1520);
  // a rim on the sill and lintel (the window's own light)
  c.fillStyle = withAlpha(P.rim, 0.35 * spill);
  c.fillRect(WIN.x0 - 40, WIN.y1, WIN.x1 - WIN.x0 + 80, 2 / s + 1);
  c.filter = 'none';
  c.restore();
}

const NEIGHBOUR_WINDOWS = [
  { x: -820, y: 330, w: 200, h: 360, lit: 0 },
  { x: -360, y: 330, w: 200, h: 360, lit: 0.16 },
  { x: 1260, y: 330, w: 200, h: 360, lit: 0 },
  { x: 1900, y: 260, w: 180, h: 340, lit: 0.6 },
];
let BRICKS: Path2D | null = null;
/** running-bond brick coursing (module-scope Path2D, built once), kept off the windows */
function brickPath() {
  if (BRICKS) return BRICKS;
  const b = new Path2D();
  const inWin = (x: number, y: number) =>
    (x > WIN.x0 - 44 && x < WIN.x1 + 44 && y > WIN.y0 - 34 && y < WIN.y1 + 30) ||
    NEIGHBOUR_WINDOWS.some((w) => x > w.x - 22 && x < w.x + w.w + 22 && y > w.y - 22 && y < w.y + w.h + 18);
  let row = 0;
  for (let y = 214; y < 1400; y += 30, row++) {
    // bed joints, broken around the openings
    let open = false;
    for (let x = -2600; x <= 1640; x += 20) {
      const hole = inWin(x, y);
      if (!hole && !open) {
        b.moveTo(x, y);
        open = true;
      } else if (hole && open) {
        b.lineTo(x, y);
        open = false;
      }
    }
    if (open) b.lineTo(1640, y);
    // head joints every 76 units, offset on alternate courses
    for (let x = -2600 + (row % 2) * 38; x < 1640; x += 76) {
      if (inWin(x, y + 15)) continue;
      b.moveTo(x, y);
      b.lineTo(x, y + 30);
    }
  }
  BRICKS = b;
  return b;
}

/** the El: a lattice girder deck on paired columns, a train of lit windows sliding left → right */
const TR = { deckY: -40, girderH: 46, cols: [-980, -230, 1510, 2260], carW: 150, cars: 4 };
/** the lead car's x at t = 0: the whole train starts right of frame centre */
const TRAIN_X0 = 1150;
/** the trestle is drawn 1.45x about (640, deck) and set lower so the train rides at ~30% of frame height */
const TR_K = 1.45;
const TR_DECK_WORLD = 152;
function drawTrestle(f: Frame, cam: Camera3, env: PaintEnv, t: number) {
  if (TRESTLE_Z - cam.z < 30) return;
  const c = f.c;
  c.save();
  const s0 = setAbs(f, cam, TRESTLE_Z);
  // it swoops over the lens late in the dolly: soft as it passes (near-plane blur)
  const nearT = clamp01((s0 - 1.0) / 1.4);
  if (nearT > 0.05) c.filter = `blur(${(8 * nearT * f.pxScale).toFixed(2)}px)`;
  c.translate(640, TR_DECK_WORLD);
  c.scale(TR_K, TR_K);
  c.translate(-640, -TR.deckY);
  const s = s0 * TR_K;
  const P = env.mood;
  const ink = mixLab(P.fg, P.ink, 0.4);
  const y0 = TR.deckY, y1 = TR.deckY + TR.girderH;
  // girder with x-bracing HOLES (evenodd: the dusk shows through the lattice)
  const g = new Path2D();
  g.rect(-3200, y0, 7000, TR.girderH);
  const bay = 40;
  for (let x = -3200; x < 3800; x += bay) {
    g.moveTo(x + 6, y0 + 7);
    g.lineTo(x + bay / 2 - 3, y0 + TR.girderH / 2);
    g.lineTo(x + 6, y1 - 7);
    g.closePath();
    g.moveTo(x + bay - 6, y0 + 7);
    g.lineTo(x + bay / 2 + 3, y0 + TR.girderH / 2);
    g.lineTo(x + bay - 6, y1 - 7);
    g.closePath();
  }
  c.fillStyle = ink;
  c.fill(g, 'evenodd');
  // ties and rail along the top; the running rail catches the dusk
  c.fillRect(-3200, y0 - 8, 7000, 8);
  c.fillStyle = withAlpha(P.rim, 0.28);
  c.fillRect(-3200, y0 - 9, 7000, 1.4 / s);
  c.fillStyle = ink;
  // columns with knee braces, down to the street
  for (const x of TR.cols) {
    c.fillRect(x - 16, y1, 32, 1600);
    c.beginPath();
    c.moveTo(x - 16, y1);
    c.lineTo(x - 110, y1);
    c.lineTo(x - 16, y1 + 94);
    c.closePath();
    c.moveTo(x + 16, y1);
    c.lineTo(x + 110, y1);
    c.lineTo(x + 16, y1 + 94);
    c.closePath();
    c.fill();
  }
  // the train: it runs in the RIGHT half of the sky, left → right, so the index tab (top-left) never sits
  // on it. Bodies ride on bogies whose wheels sit ON the rail; the body sways a hair on twos.
  const tx = TRAIN_X0 + twos(t) * 200;
  const carH = 60;
  const rail = y0 - 8;
  for (let i = 0; i < TR.cars; i++) {
    const x = tx - i * (TR.carW + 8);
    const bob = (hash1(i + Math.floor(twos(t) * 6), 41) - 0.5) * 1.2;
    const top = rail - 9 - carH + bob;
    c.fillStyle = ink;
    c.beginPath();
    c.roundRect(x, top, TR.carW, carH + 2, [10, 10, 1, 1]);
    c.fill();
    c.fillRect(x + TR.carW - 1, top + carH - 22, 10, 6); // coupler
    // bogies + wheels, planted on the rail
    for (const bx of [x + 16, x + TR.carW - 46]) {
      c.fillRect(bx, rail - 11, 30, 6);
      c.beginPath();
      c.arc(bx + 7, rail - 4, 4, 0, Math.PI * 2);
      c.arc(bx + 23, rail - 4, 4, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = withAlpha(mixLab(P.halo, P.core, 0.3), 0.92);
    for (let k = 0; k < 7; k++) c.fillRect(x + 12 + k * 19.5, top + 13, 12, 22);
  }
  // the windows' glow along the cars (one soft additive band)
  c.globalCompositeOperation = 'lighter';
  const L = TR.cars * (TR.carW + 8);
  const gl = c.createLinearGradient(0, y0 - 80, 0, y0 + 30);
  gl.addColorStop(0, withAlpha(P.halo, 0));
  gl.addColorStop(0.45, withAlpha(P.halo, 0.12));
  gl.addColorStop(1, withAlpha(P.halo, 0));
  c.fillStyle = gl;
  c.fillRect(tx - L + TR.carW, y0 - 80, L + 40, 110);
  c.filter = 'none';
  c.restore();
  void s;
}

// ------------------------------------------------------------------------------------------------ the interior
const FLOOR: LayerSpec = { id: 'floor', z: 1300, haze: 0.12, blur: 0.75 };
const HALL: LayerSpec = { id: 'hall', z: 1800, haze: 0.18, blur: 0 };
/** the doorway's light on the floor: dynamic, so an unblurred plane at the floor's depth */
const FLOOR_SPILL: LayerSpec = { id: 'floorSpill', z: 1300, haze: 0.12, blur: 0 };
/** a soft wedge of warm light from the door across the floorboards (three nested passes = a feathered edge) */
function doorSpill(c: C2, env: PaintEnv, k: number) {
  const P = env.mood;
  const d = BW.door;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const sp = 1 + i * 0.32;
    const g = c.createLinearGradient(0, BW.base, 0, 790);
    g.addColorStop(0, withAlpha(mixLab(P.halo, P.core, 0.25), 0.2 * k));
    g.addColorStop(0.55, withAlpha(P.halo, 0.09 * k));
    g.addColorStop(1, withAlpha(P.halo, 0));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(d.x + 8 - i * 6, BW.base);
    c.lineTo(d.x + d.w - 8 + i * 6, BW.base);
    c.lineTo(d.x + d.w + 150 * sp, 790);
    c.lineTo(d.x - 210 * sp, 790);
    c.closePath();
    c.fill();
  }
  c.restore();
}
/** back wall (L2): two tall windows on the dusk, a bookcase at left, the doorway at right */
const BW = { win: [{ x: 180, w: 220 }, { x: 560, w: 220 }], winY: 64, winH: 470, door: { x: 900, w: 176, y: 150 }, base: 604 };
const HALL_LAMP = { x: 1036, y: 236 };
const LAMP = { x: 70, y: 640, top: 286 }; // the standard lamp (L3): base, shade centre
const DESK = { x: 205, y: 634 };
const FEET = 660;
const MC = { x1: 610 };

const SPEC_MC = cast.mcculloch.spec;
const SPEC_P = cast.pitts.spec;
const STANCE = { hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 8, head: -6 };
const OFFER: Pose = pose({ ...STANCE, torso: 2, neck: 3, head: -2, shoulderF: 58, elbowF: 20, wristF: -8, shoulderB: -8, elbowB: 14 }, { handF: 'open' });
/** after the shake: the near hand still in Pitts's, the FAR arm swept well back and out from the body, palm open
 *  toward the room ('come in'), with a clear gap of lit air between the arm and the waistcoat */
const GESTURE_IN: Pose = pose({ ...STANCE, torso: 0, neck: 3, head: -2, shoulderF: 56, elbowF: 22, wristF: -8, shoulderB: -50, elbowB: 16, wristB: -26 }, { handF: 'open', handB: 'open' });
const CLUTCH: Pose = pose({ ...STANCE, neck: 12, head: 7, shoulderF: 0, elbowF: 106, wristF: 4, shoulderB: 2, elbowB: 92, wristB: 6 }, { handF: 'grip', handB: 'relaxed' });
const HALF: Pose = pose({ ...STANCE, neck: 10, head: 4, shoulderF: 34, elbowF: 62, wristF: -10, shoulderB: 0, elbowB: 88 }, { handF: 'open', handB: 'grip' });
const SHAKE: Pose = pose({ ...STANCE, neck: 9, head: 1, torso: 3, shoulderF: 54, elbowF: 22, wristF: -8, shoulderB: -6, elbowB: 26, wristB: 4 }, { handF: 'open', handB: 'grip' });

/** solve Pitts's final x so his hand meets McCulloch's offered hand */
let PX1 = 0;
function pittsX1() {
  if (PX1) return PX1;
  const mh = cast.mcculloch.anchor({ x: MC.x1, y: FEET, facing: 'right', pose: OFFER }, 'handF');
  const ph = cast.pitts.anchor({ x: 0, y: FEET, facing: 'left', pose: SHAKE }, 'handF');
  PX1 = mh.x - ph.x - 44; // anchors are at the wrists: the open palms overlap a little
  return PX1;
}

interface Acting {
  mcWalk: ReturnType<typeof walkTo>;
  pWalk: ReturnType<typeof walkTo>;
  mcX0: number;
  pX0: number;
  mcAt: number;
  homeAt: number;
  shakeAt: number;
}
/** a gentler, shorter stride: the walk's legs are scaled by STRIDE_K (and its ground travel with them, so the
 *  planted feet still do not slide), with a slight forward lean, easing back to full pose over the settle */
const STRIDE_K = 0.75;
const LEAN = 2;
/** the warm walk: never stooped. Torso lean is capped at +4 deg, the neck kept 0..+4, the head level */
const capLean = (q: Pose): Pose => {
  const a = { ...q.angles };
  a.torso = Math.min(4, a.torso ?? 0);
  a.neck = Math.max(0, Math.min(4, a.neck ?? 0));
  a.head = Math.max(-3, a.head ?? 0);
  return { ...q, angles: a };
};
/** during the walk McCulloch's near arm rises into the offer, so he arrives with his hand already out */
const ARM_KEYS = ['shoulderF', 'elbowF', 'wristF'] as const;
function offerArm(q: Pose, k: number): Pose {
  const a = { ...q.angles };
  for (const j of ARM_KEYS) a[j] = (a[j] ?? 0) + ((OFFER.angles[j] ?? 0) - (a[j] ?? 0)) * k;
  return { ...q, angles: a, handF: k > 0.4 ? 'open' : q.handF };
}
const LEGS = ['hipF', 'kneeF', 'ankleF', 'hipB', 'kneeB', 'ankleB'] as const;
function gentler(p: Pose & { prev?: Pose }, e: number): Pose & { prev?: Pose } {
  const k = STRIDE_K + (1 - STRIDE_K) * e;
  const lean = LEAN * (1 - e);
  const f = (q: Pose): Pose => {
    const a = { ...q.angles };
    for (const j of LEGS) if (a[j] !== undefined) a[j] = (a[j] as number) * k;
    a.torso = (a.torso ?? 0) + lean;
    a.neck = (a.neck ?? 0) - lean * 0.4;
    return { ...q, angles: a };
  };
  return { ...p, ...f(p), prev: p.prev ? f(p.prev) : undefined };
}
function actingFor(mcAt: number, homeAt: number, shakeAt: number): Acting {
  // McCulloch: one whole (gentler) step forward to MC.x1 (start solved so the planted feet land exactly)
  const probeMc = walkTo(SPEC_MC, { x0: 0, x1: 230, at: 0 });
  const mcX0 = MC.x1 - STRIDE_K * probeMc(10).x;
  const mcWalk = walkTo(SPEC_MC, { x0: mcX0, x1: mcX0 + 230, at: mcAt, end: OFFER });
  // Pitts: one whole step in from the doorway, landing where the hands meet
  const px1 = pittsX1();
  const probeP = walkTo(SPEC_P, { x0: 0, x1: -100, at: 0 });
  const pX0 = px1 - STRIDE_K * probeP(10).x;
  const pWalk = walkTo(SPEC_P, { x0: pX0, x1: pX0 - 100, at: shakeAt - 0.62, end: SHAKE });
  return { mcWalk, pWalk, mcX0, pX0, mcAt, homeAt, shakeAt };
}
/** walk sample → (x, pose) with the gentler stride applied through the walk and its settle */
function stepped(w: ReturnType<ReturnType<typeof walkTo>>, x0: number, tq: number, at: number) {
  const x = x0 + (w.x - x0) * STRIDE_K;
  if (tq < at) return { x, pose: w.pose };
  const e = w.walking ? 0 : sm((tq - w.arrive) / 0.34);
  return { x, pose: e >= 1 ? w.pose : gentler(w.pose, e) };
}

function mcPose(a: Acting, t: number): { x: number; pose: Pose & { prev?: Pose } } {
  const tq = twos(t);
  const w0 = a.mcWalk(t);
  const w = stepped(w0, a.mcX0, tq, a.mcAt);
  let p: Pose & { prev?: Pose } = w.pose;
  if (tq < a.mcAt) p = POSES.listen;
  else {
    // walk + settle: capped lean, the near arm rising into the offer from the first step
    const arrive = w0.arrive;
    const rise = Math.min(0.6, (arrive - a.mcAt) * 0.6);
    const k = sm((tq - a.mcAt - 0.08) / rise);
    const kp = sm((tq - 1 / 12 - a.mcAt - 0.08) / rise);
    p = { ...offerArm(capLean(p), k), prev: p.prev ? offerArm(capLean(p.prev), kp) : undefined };
  }
  // the handshake pumps twice on twos, then the far hand gestures Pitts in
  if (tq >= a.shakeAt + 0.25) {
    const k = sm((tq - (a.shakeAt + 0.55)) / 0.45);
    p = blendPose(OFFER, GESTURE_IN, k);
  }
  const pump = tq >= a.shakeAt && tq < a.shakeAt + 0.5 ? (Math.floor((tq - a.shakeAt) * 12) % 3 === 1 ? 1 : 0) : 0;
  if (pump) p = addPose(p, { elbowF: -6, shoulderF: -3 });
  return { x: w.x, pose: withLife(p, tq, 4301, 0.9) };
}
function pittsPose(a: Acting, t: number): { x: number; pose: Pose & { prev?: Pose } } {
  const tq = twos(t);
  const w0 = a.pWalk(t);
  const w = stepped(w0, a.pX0, tq, a.shakeAt - 0.62);
  let p: Pose & { prev?: Pose };
  if (!w0.walking && tq < a.shakeAt - 0.62) {
    // in the doorway, papers to his chest; on the doorway lamp a hand half-rises … and is withdrawn
    const h0 = a.homeAt + 0.25;
    const up = sm((tq - h0) / 0.34) * (1 - sm((tq - (h0 + 0.62)) / 0.34));
    p = blendPose(CLUTCH, HALF, up);
  } else p = w.pose;
  if (tq >= a.shakeAt && tq < a.shakeAt + 0.5 && Math.floor((tq - a.shakeAt) * 12) % 3 === 1) p = addPose(p, { elbowF: -6, shoulderF: -3 });
  return { x: w.x, pose: withLife(p, tq, 4302, 0.8) };
}

// ------------------------------------------------------------------------------------------------ painters
function bake(f: Frame, c: C2, key: string, r: Rect, paint: (cc: C2) => void) {
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
}
const R_L2: Rect = (() => {
  const o = overscan(LAYERS.L2, END_CAMS, 40);
  const x0 = Math.min(o.x, -220), y0 = Math.min(o.y, -180);
  return { x: x0, y: y0, w: Math.max(o.x + o.w, 1540) - x0, h: Math.max(o.y + o.h, 980) - y0 };
})();

function backWall(cc: C2, env: PaintEnv) {
  const P = env.mood;
  // a shade deeper than the stock set tone: the windows carry the light, the room stays dusky
  const wall = mixLab(env.fill('set'), P.fg, 0.22);
  const r = R_L2;
  const p = new Path2D();
  p.rect(r.x, r.y, r.w, BW.base - r.y);
  for (const w of BW.win) p.rect(w.x, BW.winY, w.w, BW.winH);
  p.rect(BW.door.x, BW.door.y, BW.door.w, BW.base - BW.door.y);
  cc.fillStyle = wall;
  cc.fill(p, 'evenodd');
  // panelling below the windows and a picture rail (rim cut-lines at low alpha)
  cc.strokeStyle = withAlpha(P.rim, 0.1);
  cc.lineWidth = 1.3;
  cc.beginPath();
  cc.moveTo(r.x, 26);
  cc.lineTo(r.x + r.w, 26);
  cc.moveTo(r.x, 548);
  cc.lineTo(BW.door.x - 10, 548);
  cc.moveTo(BW.door.x + BW.door.w + 10, 548);
  cc.lineTo(r.x + r.w, 548);
  cc.stroke();
  for (let x = Math.floor(r.x / 120) * 120 + 8; x < r.x + r.w; x += 120) {
    if (x > BW.door.x - 110 && x < BW.door.x + BW.door.w) continue;
    cc.strokeRect(x, 556, 104, 40);
  }
  // window frames and sash bars (ink-ish, at the wall's depth)
  cc.fillStyle = mixLab(wall, P.fg, 0.45);
  for (const w of BW.win) {
    cc.fillRect(w.x - 10, BW.winY - 14, w.w + 20, 14);
    cc.fillRect(w.x - 16, BW.winY + BW.winH, w.w + 32, 12);
    cc.fillRect(w.x + w.w / 2 - 4, BW.winY, 8, BW.winH);
    for (let j = 1; j < 4; j++) cc.fillRect(w.x, BW.winY + (BW.winH * j) / 4 - 3, w.w, 6);
    // heavy curtains drawn back at the sides of each window
    cc.fillStyle = mixLab(wall, P.fg, 0.3);
    for (const [x0, dir] of [[w.x - 26, 1], [w.x + w.w + 26, -1]] as const) {
      cc.beginPath();
      cc.moveTo(x0, BW.winY - 20);
      cc.lineTo(x0 + dir * 46, BW.winY - 20);
      cc.bezierCurveTo(x0 + dir * 26, BW.winY + 160, x0 + dir * 40, BW.winY + 320, x0 + dir * 16, BW.base);
      cc.lineTo(x0 - dir * 6, BW.base);
      cc.closePath();
      cc.fill();
    }
    cc.fillStyle = mixLab(wall, P.fg, 0.45);
  }
  // door casing
  const d = BW.door;
  cc.fillRect(d.x - 18, d.y - 22, d.w + 36, 22);
  cc.fillRect(d.x - 18, d.y, 18, BW.base - d.y);
  cc.fillRect(d.x + d.w, d.y, 18, BW.base - d.y);
  // bookcase at the far left
  bookshelfWall(cc, { x: -210, y: 30, w: 400, h: BW.base - 30, bays: 2, seed: 1941, gaps: 0.2, objects: true, backTone: 0.28 }, env);
  // a framed picture on the pier between the windows
  cc.fillStyle = mixLab(wall, P.fg, 0.5);
  cc.fillRect(497, 170, 96, 124);
  cc.fillStyle = mixLab(wall, P.haze, 0.25);
  cc.fillRect(507, 180, 76, 104);
}

/** the hallway seen through the doorway: dark, then warm when the second lamp comes on */
function hall(c: C2, env: PaintEnv, k: number) {
  const P = env.mood;
  const d = BW.door;
  // the hall at dusk: dim, lit only by what the windows let in (Pitts still reads against it)
  c.fillStyle = mixLab(P.setHaze, P.haze, 0.35);
  c.fillRect(d.x - 4, d.y - 4, d.w + 8, BW.base - d.y + 8);
  {
    const g = c.createRadialGradient(HALL_LAMP.x, HALL_LAMP.y + 60, 10, HALL_LAMP.x, HALL_LAMP.y + 60, 340);
    g.addColorStop(0, withAlpha(mixLab(P.halo, P.core, 0.2), 0.95 * k));
    g.addColorStop(0.5, withAlpha(mixLab(P.setHaze, P.halo, 0.5), 0.85 * k));
    g.addColorStop(1, withAlpha(P.setHaze, 0.7 * k));
    c.fillStyle = g;
    if (k > 0.01) c.fillRect(d.x - 4, d.y - 4, d.w + 8, BW.base - d.y + 8);
    // a newel post and banister in the hall, cut against its light
    c.fillStyle = mixLab(P.set, P.fg, 0.2);
    c.fillRect(d.x + 30, 380, 14, BW.base - 380);
    c.beginPath();
    c.moveTo(d.x + 30, 384);
    c.lineTo(d.x + d.w + 10, 250);
    c.lineTo(d.x + d.w + 10, 262);
    c.lineTo(d.x + 44, 396);
    c.closePath();
    c.fill();
    for (let i = 0; i < 6; i++) {
      const x = d.x + 58 + i * 22;
      const y = 384 - ((x - d.x - 30) / (d.w - 20)) * 134;
      c.fillRect(x, y, 4, BW.base - 210 - y + 210 - (BW.base - 604));
    }
  }
}

/** the standard lamp: a turned pole and a pleated fabric shade lit from within */
function standardLamp(c: C2, env: PaintEnv, x: number, y: number, top: number) {
  const P = env.mood;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.beginPath();
  c.ellipse(x, y - 4, 34, 8, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - 4, top + 30, 8, y - top - 30);
  for (const yy of [top + 120, top + 230]) {
    c.beginPath();
    c.ellipse(x, yy, 9, 5, 0, 0, Math.PI * 2);
    c.fill();
  }
  // the shade: a trapezoid of lit fabric with ink ribs
  const sh = new Path2D();
  sh.moveTo(x - 30, top - 34);
  sh.lineTo(x + 30, top - 34);
  sh.lineTo(x + 54, top + 30);
  sh.lineTo(x - 54, top + 30);
  sh.closePath();
  const g = c.createLinearGradient(0, top - 34, 0, top + 30);
  g.addColorStop(0, mixLab(P.halo, P.set, 0.35));
  g.addColorStop(1, mixLab(P.halo, P.core, 0.35));
  c.fillStyle = g;
  c.fill(sh);
  c.strokeStyle = withAlpha(P.ink, 0.45);
  c.lineWidth = 1;
  c.beginPath();
  for (let i = -3; i <= 3; i++) {
    c.moveTo(x + i * 9, top - 34);
    c.lineTo(x + i * 17, top + 30);
  }
  c.stroke();
  c.fillStyle = ink;
  c.fillRect(x - 56, top + 28, 112, 4);
  c.fillRect(x - 31, top - 37, 62, 4);
}

/** silhouettes read near-black against the window light: ink / fg pulled toward the palette's deepest tone */
function inkier(env: PaintEnv, k: number): PaintEnv {
  const P = env.mood;
  return { ...env, fill: (r) => (r === 'ink' || r === 'fg' ? mixLab(env.fill(r), P.fg, k) : env.fill(r)) };
}

/** McCulloch's full, unruly beard, enlarged over the rig's (it reads as a goatee at this scale): a head-local
 *  silhouette mapped through the head and eye anchors so it rides every tilt of the head */
const BEARD: [number, number][] = [
  [-0.04, -0.4], [0.06, -0.27], [0.2, -0.2], [0.34, -0.17], [0.44, -0.13], [0.49, -0.04], [0.52, 0.07], [0.5, 0.17],
  [0.45, 0.26], [0.38, 0.32], [0.29, 0.35], [0.2, 0.33], [0.11, 0.26], [0.03, 0.15], [-0.05, 0.0], [-0.09, -0.2],
];
function fullerBeard(c: C2, o: PuppetDrawOpts, env: PaintEnv, tq: number) {
  const h = cast.mcculloch.anchor(o, 'head');
  const e = cast.mcculloch.anchor(o, 'eye');
  const vx = e.x - h.x, vy = e.y - h.y;
  const L = Math.hypot(vx, vy);
  if (L < 1e-3) return;
  const hu = L / Math.hypot(0.33, 0.05);
  const a = Math.atan2(0.05, 0.33) * (o.facing === 'left' ? 1 : -1);
  const ux = vx / L, uy = vy / L;
  const F = { x: ux * Math.cos(a) - uy * Math.sin(a), y: ux * Math.sin(a) + uy * Math.cos(a) };
  const Dn = o.facing === 'left' ? { x: F.y, y: -F.x } : { x: -F.y, y: F.x };
  const at = (u: number, v: number) => ({ x: h.x + hu * (u * F.x + (v + 0.55) * Dn.x), y: h.y + hu * (u * F.y + (v + 0.55) * Dn.y) });
  const pts = BEARD.map(([u, v], i) => {
    // unruly: the lower edge breaks into tufts that shift a hair on twos
    const tuft = v > 0.05 ? 0.025 * (hash1(i, 917 + Math.floor(tq * 3)) + 1) : 0;
    return at(u + (u > 0.3 ? tuft * 0.6 : 0), v + tuft);
  });
  c.beginPath();
  const n = pts.length;
  const mid = (p: { x: number; y: number }, q: { x: number; y: number }) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  const m0 = mid(pts[n - 1], pts[0]);
  c.moveTo(m0.x, m0.y);
  for (let i = 0; i < n; i++) {
    const p = pts[i], m = mid(p, pts[(i + 1) % n]);
    c.quadraticCurveTo(p.x, p.y, m.x, m.y);
  }
  c.closePath();
  c.fillStyle = env.fill('ink');
  c.fill();
  // two lock cut-lines in the rim colour, faint
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 0.9;
  c.beginPath();
  const l0 = at(0.3, 0.0), l1 = at(0.33, 0.14), l2 = at(0.28, 0.26);
  c.moveTo(l0.x, l0.y);
  c.quadraticCurveTo(l1.x, l1.y, l2.x, l2.y);
  c.stroke();
}

/** L5: the near plane, blurred: a carved side chair's open back at the bottom-left corner (two stiles, a
 *  yoked crest rail with ears, a vase splat PIERCED through, so it reads as a chair and never as a head), and a
 *  heavy curtain edge at right with deep folds and a corded tie-back */
// (L5 world coords: at the closing framing, cam z ≈ −60, the chair spans screen x ≈ −60…150 and the curtain
//  edge sits at x ≈ 1150; at the arrival, cam z = 40, both sit just inside the frame edges)
const R_L5: Rect = { x: -120, y: -480, w: 1520, h: 1300 };
function nearPlane(b: C2, env: PaintEnv) {
  const P = env.mood;
  const dark = P.fg;
  b.fillStyle = dark;
  // ---- the chair back (seen from behind, slightly turned): everything between the members is a HOLE
  const cx = 52, top = 470, seat = 790;
  const ch = new Path2D();
  // left stile, raking back a touch, with a turned finial ear
  ch.moveTo(cx - 118, 900);
  ch.lineTo(cx - 112, top + 40);
  ch.quadraticCurveTo(cx - 132, top + 18, cx - 128, top - 4); // ear
  ch.quadraticCurveTo(cx - 112, top - 14, cx - 92, top + 2);
  // the crest rail: a yoke dipping to a raised centre
  ch.bezierCurveTo(cx - 60, top + 12, cx - 34, top - 10, cx, top - 18);
  ch.bezierCurveTo(cx + 34, top - 10, cx + 60, top + 12, cx + 92, top + 2);
  ch.quadraticCurveTo(cx + 112, top - 14, cx + 128, top - 4);
  ch.quadraticCurveTo(cx + 132, top + 18, cx + 112, top + 40);
  ch.lineTo(cx + 118, 900);
  ch.lineTo(cx + 92, 900);
  ch.lineTo(cx + 88, seat + 24);
  ch.lineTo(cx - 88, seat + 24);
  ch.lineTo(cx - 92, 900);
  ch.closePath();
  b.fill(ch);
  // the opening between the stiles, crest and seat rail is cut out (the room shows through) …
  b.save();
  b.globalCompositeOperation = 'destination-out';
  const hole = new Path2D();
  hole.moveTo(cx - 88, top + 46);
  hole.bezierCurveTo(cx - 50, top + 36, cx - 30, top + 24, cx, top + 20);
  hole.bezierCurveTo(cx + 30, top + 24, cx + 50, top + 36, cx + 88, top + 46);
  hole.lineTo(cx + 88, seat);
  hole.lineTo(cx - 88, seat);
  hole.closePath();
  b.fill(hole);
  b.restore();
  b.fillStyle = dark;
  // the vase splat: a baluster from the crest to the shoe, with a heart-shaped piercing
  const sp = new Path2D();
  sp.moveTo(cx - 16, top + 18);
  sp.bezierCurveTo(cx - 30, top + 80, cx - 54, top + 120, cx - 48, top + 180);
  sp.bezierCurveTo(cx - 42, top + 230, cx - 18, top + 250, cx - 22, seat - 26);
  sp.lineTo(cx - 34, seat);
  sp.lineTo(cx + 34, seat);
  sp.lineTo(cx + 22, seat - 26);
  sp.bezierCurveTo(cx + 18, top + 250, cx + 42, top + 230, cx + 48, top + 180);
  sp.bezierCurveTo(cx + 54, top + 120, cx + 30, top + 80, cx + 16, top + 18);
  sp.closePath();
  // the piercing (heart / keyhole), cut through the splat
  sp.moveTo(cx, top + 118);
  sp.bezierCurveTo(cx - 10, top + 96, cx - 30, top + 112, cx - 20, top + 140);
  sp.lineTo(cx, top + 176);
  sp.lineTo(cx + 20, top + 140);
  sp.bezierCurveTo(cx + 30, top + 112, cx + 10, top + 96, cx, top + 118);
  sp.closePath();
  b.fill(sp, 'evenodd');
  // the seat rail and the upholstered seat's edge below
  b.fillRect(cx - 120, seat, 240, 22);
  b.beginPath();
  b.roundRect(cx - 132, seat + 20, 264, 200, 14);
  b.fill();
  // the desk lamp catches the crest rail and the near stile: one soft rim
  b.strokeStyle = withAlpha(P.rim, 0.24);
  b.lineWidth = 2.5;
  b.beginPath();
  b.moveTo(cx - 128, top - 4);
  b.quadraticCurveTo(cx - 112, top - 14, cx - 92, top + 2);
  b.bezierCurveTo(cx - 60, top + 12, cx - 34, top - 10, cx, top - 18);
  b.stroke();
  // ---- the curtain edge at right: a heavy drape in deep folds, gathered by a corded tie-back
  const cu = new Path2D();
  cu.moveTo(1420, -480);
  cu.lineTo(1226, -480);
  cu.bezierCurveTo(1218, -100, 1240, 140, 1226, 300);
  cu.quadraticCurveTo(1214, 340, 1250, 362); // pinched in at the tie-back
  cu.bezierCurveTo(1226, 470, 1214, 640, 1236, 820);
  cu.lineTo(1420, 820);
  cu.closePath();
  b.fillStyle = dark;
  b.fill(cu);
  // the folds: lighter ridges catching the room's light between darker troughs (wide enough to survive the blur)
  b.save();
  b.clip(cu);
  const folds = [1252, 1290, 1334, 1372];
  for (let i = 0; i < folds.length; i++) {
    const x = folds[i];
    b.strokeStyle = withAlpha(mixLab(P.fg, P.set, 0.55), 0.55 - i * 0.08);
    b.lineWidth = 9;
    b.beginPath();
    b.moveTo(x, -480);
    b.bezierCurveTo(x - 6, -100, x + 10, 160, x + 12, 340); // the folds converge on the tie-back …
    b.bezierCurveTo(x + 4, 470, x - 22 - i * 6, 640, x - 18 - i * 10, 820); // … and fan out below it
    b.stroke();
  }
  b.restore();
  // the tie-back: a cord across the gathered drape with a hanging tassel
  b.fillStyle = dark;
  b.beginPath();
  b.ellipse(1300, 352, 82, 9, -0.08, 0, Math.PI * 2);
  b.fill();
  b.fillRect(1236, 352, 5, 54);
  b.beginPath();
  b.moveTo(1238, 400);
  b.lineTo(1226, 448);
  b.lineTo(1252, 448);
  b.closePath();
  b.fill();
  b.strokeStyle = withAlpha(P.rim, 0.22);
  b.lineWidth = 2;
  b.beginPath();
  b.moveTo(1226, -480);
  b.bezierCurveTo(1218, -100, 1240, 140, 1226, 300);
  b.stroke();
}

/** the place stamp, typed on twos in Special Elite, keeping the script's lowercase 'c.' (the kit upper-cases) */
function caseStamp(c: C2, text: string, at: number, dur: number, env: { t: number; mood: Palette }) {
  const A = envelope(env.t, at, dur, 0.45);
  if (A <= 0) return;
  const m = env.mood;
  const x = 48, y = 664, size = 22, cps = 16;
  const tq = Math.floor(env.t * 12) / 12;
  const shown = Math.max(0, Math.min(text.length, Math.floor((tq - at) * cps + 1e-6)));
  c.save();
  c.textBaseline = 'alphabetic';
  c.globalAlpha = A;
  const estW = text.length * size * 0.62;
  // a deep soft plate: the stamp is typed over the bright street haze / floor haze, so it needs its own ground
  softPlate(c, x + estW / 2, y - size * 0.35, estW + 190, size + 84, m.ink, 0.8);
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const adv = c.measureText('M').width * 1.02;
  const col = textColor(m);
  for (let i = 0; i < shown; i++) {
    const ch = text[i];
    if (ch === ' ') continue;
    const ink = 0.72 + 0.28 * hash1(i, 43);
    const dy = (hash1(i, 44) - 0.5) * 1.2;
    const rot = (hash1(i, 45) - 0.5) * 0.025;
    const strike = i === shown - 1 && tq - at < text.length / cps + 0.1 ? 1.15 : 1;
    c.save();
    c.translate(x + i * adv + adv / 2, y + dy);
    c.rotate(rot);
    c.globalAlpha = A * Math.min(1, (0.9 + 0.1 * ink) * strike);
    c.fillStyle = col;
    c.textAlign = 'center';
    c.fillText(ch, 0, 0);
    c.restore();
  }
  c.restore();
}

export default defineShot({
  id: 'ch02-s01',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const mcAt = T.beat('mcculloch');
    const homeAt = T.beat('home');
    const pittsAt = T.beat('pitts');
    const shakeAt = T.word('L0202', 'McCulloch') - 0.05;
    const tabAt = T.beat('indexTab');
    const stampAt = T.beat('stamp');
    // the doorway lamp: a quick warm bloom on 'home'
    const hallK = tl.channel('hall', 0);
    tl.tween(hallK, 1, { at: homeAt - 0.05, dur: 0.5, ease: ease.enter });
    tl.hold(0, D);
    const acting = actingFor(mcAt - 0.15, homeAt, shakeAt);
    return { tl, hallK, D, mcAt, homeAt, pittsAt, tabAt, stampAt, acting };
  },
  paint(f, s, scene) {
    const t = f.t;
    const cam = camAt(t, scene.homeAt, scene.D);
    const hallK = s.get(scene.hallK) as number;
    const win = windowRect(cam);
    const outside = !facadeCovers(win);

    f.camera(cam);
    // bright window light so the room's silhouettes read near-black against it (the reference's contrast)
    f.backlight({ sunX: 560, sunY: 430, sunRadius: 920, intensity: 1.3 });
    // L1: the far city at dusk (seen over the house from outside, and through the study's windows)
    f.layer('L1', (c, env) => {
      const r = overscan(LAYERS.L1, [...END_CAMS, { x: 640, y: 300, z: Z0, lens: 1 }], 60);
      bake(f, c, `ch02-s01/L1/${env.mood.id}`, r, (cc) =>
        skyline(cc, { style: 'chicago1940', x0: r.x, x1: r.x + r.w, y: 470, height: 320, seed: 41, lit: 0.12, ground: 700 }, env),
      );
    });

    // ---------------- the interior, seen through the lit window until the facade passes the lens
    const c = f.c;
    c.save();
    if (outside && win) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.beginPath();
      c.rect(win.x0 * f.pxScale, win.y0 * f.pxScale, (win.x1 - win.x0) * f.pxScale, (win.y1 - win.y0) * f.pxScale);
      c.clip();
    }
    // the hallway beyond the doorway: dynamic (its lamp comes on), so it sits on its own UNBLURRED plane at
    // the back wall's depth (no per-frame blur pass); the baked wall with its door hole goes over it
    f.layer(HALL, (cc, env) => hall(cc, env, hallK));
    f.layer('L2', (cc, env) => {
      bake(f, cc, `ch02-s01/L2v2/${env.mood.id}`, R_L2, (b) => backWall(b, env));
    });
    if (hallK > 0.01) f.practical({ x: HALL_LAMP.x, y: HALL_LAMP.y, kind: 'lamp', seed: 4103, intensity: 1.0 * hallK, radius: 140, layer: 'L2' });
    f.layer(FLOOR, (cc, env) => {
      bake(f, cc, `ch02-s01/floor/${env.mood.id}`, { x: -700, y: 590, w: 2700, h: 700 }, (b) => {
        const P = env.mood;
        b.fillStyle = mixLab(env.fill('fg'), env.fill('set'), 0.55);
        b.fillRect(-700, 600, 2700, 700);
        // a rug in the lamp's pool, boards converging
        b.strokeStyle = withAlpha(P.fg, 0.5);
        b.lineWidth = 1.2;
        for (let i = -16; i <= 16; i++) {
          b.beginPath();
          b.moveTo(640 + i * 52, 600);
          b.lineTo(640 + i * 120, 1290);
          b.stroke();
        }
        const g = b.createRadialGradient(560, 650, 20, 560, 650, 520);
        g.addColorStop(0, withAlpha(mixLab(P.setHaze, P.halo, 0.35), 0.55));
        g.addColorStop(1, withAlpha(P.setHaze, 0));
        b.save();
        b.translate(0, 650);
        b.scale(1, 0.22);
        b.fillStyle = g;
        b.fillRect(-700, -2400, 2700, 4800);
        b.restore();
      });
    });
    // the household beyond: on 'home' the doorway's light spills across the floorboards toward us
    if (hallK > 0.01) f.layer(FLOOR_SPILL, (cc, env) => doorSpill(cc, env, hallK));
    f.fog('A');
    f.layer('L3', (cc, env) => {
      const dark = inkier(env, 0.7);
      bake(f, cc, `ch02-s01/L3v2/${env.mood.id}`, { x: -120, y: 180, w: 520, h: 480 }, (b) => {
        writingDesk(b, { x: DESK.x, y: DESK.y, variant: 'rolltop', w: 132, open: 1 }, dark);
        standardLamp(b, dark, LAMP.x, LAMP.y, LAMP.top);
      });
    });
    f.fog('B');
    const a = scene.acting;
    const mc = mcPose(a, t);
    const pt = pittsPose(a, t);
    f.layer('L4', (cc, env0) => {
      const env = inkier(env0, 0.85);
      cast.pitts.draw(cc, { x: pt.x, y: FEET, facing: 'left', pose: pt.pose, cutLines: true }, env);
      const mo: PuppetDrawOpts = { x: mc.x, y: FEET, facing: 'right', pose: mc.pose, cutLines: true };
      cast.mcculloch.draw(cc, mo, env);
      fullerBeard(cc, mo, env, env.tq);
    });
    f.rim({ x: -0.15, y: -0.99 });
    f.practical({ x: LAMP.x, y: LAMP.top + 4, kind: 'lamp', seed: 4101, intensity: 0.95, radius: 64, layer: 'L3' });
    // L5: a near chair back and a curtain edge, heavily blurred, frame the pair (multiplane depth)
    f.layer('L5', (cc, env) => bake(f, cc, `ch02-s01/L5v4/${env.mood.id}`, R_L5, (b) => nearPlane(b, env)));
    c.restore();
    f.c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);

    // ---------------- the exterior planes in front of the interior: the facade, then the El
    if (outside) {
      const env = (f as FilmFrame).env('L4');
      const spill = 1 - sm((cam.z + 900) / 400);
      drawFacade(f, cam, env, 0.6 + 0.4 * spill);
      // street haze over the lower facade (a fog sheet across the brick at ~60-75% height), trembling on twos
      // while the train is overhead: the band shudders a few px and its density pulses with the rumble
      const rumble = sm((t - 0.4) / 0.5) * (1 - sm((t - 3.6) / 0.8));
      const jy = rumble * 7 * (vnoise(twos(t) * 11.0, 77) - 0.5) * 2;
      const pulse = 1 + rumble * 0.35 * (vnoise(twos(t) * 7.0, 78) - 0.3);
      const fade = 1 - sm((cam.z + 700) / 500);
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      const fg = c.createLinearGradient(0, 520 + jy, 0, 740 + jy);
      fg.addColorStop(0, withAlpha(env.mood.haze, 0));
      fg.addColorStop(0.45, withAlpha(env.mood.haze, 0.3 * pulse * fade));
      fg.addColorStop(1, withAlpha(env.mood.haze, 0.16 * fade));
      c.fillStyle = fg;
      c.fillRect(0, 440, 1280, 300);
      c.restore();
      if (fade > 0.02) f.fog({ yCenter: 610, height: 230, alpha: 0.46 * fade * pulse, drift: 9 });
      f.c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      drawTrestle(f, cam, env, t);
    }
    f.c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);

    // ---------------- screen-locked type
    const tenv = { t, mood: f.mood, seed: 2 };
    caseStamp(c, 'CHICAGO · c. 1941', scene.stampAt, scene.mcAt - 0.25 - scene.stampAt, { t, mood: f.mood });
    // name cards beside each figure (McCulloch's left of him, clear of his face; Pitts's right of him)
    // (at the bible's 34 / 26 px; role baselines stay above the bottom 12%)
    nameCardLg(c, { name: 'Walter Pitts', role: 'about 18', align: 'right', x: 1118, y: 560, at: scene.pittsAt, dur: scene.D - scene.pittsAt + 0.5 }, tenv);
    {
      // McCulloch's card sits at the left edge (clear of his walk) on a deep plate that quiets the desk drawers
      const A = envelope(t, scene.mcAt, scene.D - scene.mcAt + 0.5, 0.4);
      if (A > 0) {
        c.save();
        c.globalAlpha = A;
        softPlate(c, 236, 590, 500, 150, f.mood.ink, 0.7);
        c.restore();
      }
    }
    nameCardLg(c, { name: 'Warren McCulloch', role: '', x: 60, y: 588, at: scene.mcAt, dur: scene.D - scene.mcAt + 0.5 }, tenv);
    indexTab(c, { title: 'Clue One: A Switch That Fires', at: scene.tabAt, hold: 2.5 }, { t, mood: f.mood });
  },
});
