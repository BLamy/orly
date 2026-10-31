/**
 * ch06-s07 — the Wall of Forecasts, May 1997 then the year 2000, night (STUDY LOCK: candleAmber).
 * The yellowed chess slip is corrected to 1997, twenty-nine years late (a point for RULES); then a 2000 calendar
 * leaf drifts past and Turing's slip curls, still pinned.
 *
 *   0 → 1.9       reverse flame push: the bead of ch06-s06's pipe becomes the 'fiddly' candle's flame. The camera
 *                 dollies back out of the flame ANCHORED on it (the flame stays at the frame's left edge, where the
 *                 bead ended), tint-crossfading duskRose → candleAmber, and lands on a MEDIUM of the shelf and the
 *                 Wall (the X-ray cabinet between them sits in shadow: the slip keeps the one accent)
 *   'promised'    the chess slip (W2, yellowed, curled, OVERDUE tag) catches the lamp; a slow push (anchored on the
 *                 slip) from 1.8 s carries in to it by 'came', then creeps on to the writing
 *   'came'        a paper-cut vignette irises open inside the slip's frame (the typed text is covered, never doubled):
 *                 a panelled room, a chessboard, two tall towers (no logos); the player leans back on 'came' + 0.4
 *                 (one pose change, on twos); stamp NEW YORK · 11 MAY 1997 (Plex Mono)
 *   'late'        the iris has closed; on the word the hand turns the slip over on its pin (a 0.4 s flip, scaleX
 *                 1 → 0 → −1 with the paper shading through edge-on); the fountain pen writes 1968 → 1997 · 29 years late
 *   'search'      label: 200 million positions a second (the narration carries "no neural network")
 *   then          the hand unpins the slip; FILE insert: it is laid face down (the written back up) in the file
 *   'Rules'       BOARD insert on the RULES suspect card: the hand presses one brass pin beside it
 *   'Turing'      WALL on W1 (the same wall camera family as the opening: W1 · W3 above, W2 between and below): the
 *                 chess slip's pin hangs empty in W2, in the lamp's pool, and glints; a calendar leaf reading 2000
 *                 drifts down past the Wall and Turing's slip lifts at its corners as the date passes. It is not taken down.
 * Wall/slip close-ups and the Rules insert carry a blurred near occluder (bottom-left), corner falloff to ink and
 * a little dust drifting in the lamp's pool.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, ShotScene } from '../../../film';
import { CAMERA3_HOME, LAYERS, MFONT, defineShot, dustMotes, hash1, label, mixLab, softPlate, textColor, toLayer, toScreen, withAlpha } from '../../../film';
import { FONT } from '../../../film/silhouette/type';
import { hands } from '../cast';
import { HAND_LEN, type ArmPose, type Pt } from '../sets/narratorHands';
import { STUDY, STUDY_CAMS, fileDesk, studyCase, studyNear, studyRoom, studyShelf } from '../sets/study';
import { SLIPS, SLOTS, shelfStateAt, wallStateAt } from '../sets/studyState';
import { shelfFlames } from '../sets/beliefCandle';
import { WALL_SLOTS, drawSlip, slotLight } from '../sets/wallOfForecasts';
import { paperTone } from '../sets/caseBoard';
import { agedChessSlip } from '../sets/ch04-s08-slip';
import { clamp01, lerp, monotone, sm, tq12, win } from '../sets/ch02-s05b-util';

const ID = 'ch06-s07';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------ geometry
const WK = STUDY.wall.k;
const W2 = WALL_SLOTS.W2;
const W2C = { x: STUDY.wall.x + W2.x * WK, y: STUDY.wall.y + W2.y * WK };
const W2W = W2.w * WK, W2H = W2.h * WK;
const W2PIN = { x: W2C.x, y: W2C.y - W2H / 2 + 6 * WK };
const W1 = WALL_SLOTS.W1;
const W1C = { x: STUDY.wall.x + W1.x * WK, y: STUDY.wall.y + W1.y * WK };
const W1_DEF = SLIPS.find((d) => d.slot === 'W1')!;
const S1 = SLOTS.S1;
const S1C = { x: STUDY.board.x + S1.x * STUDY.board.k, y: STUDY.board.y + S1.y * STUDY.board.k };
/** the brass pin pressed beside the RULES card (its upper right) */
const RULES_PIN = { x: STUDY.board.x + (S1.x + S1.w / 2 + 16) * STUDY.board.k, y: STUDY.board.y + (S1.y - S1.h / 2 + 12) * STUDY.board.k };
const VIEWS = shelfStateAt(ID, 'start');
const FLAME = shelfFlames({ ...studyShelf(VIEWS), drawFlames: false }).find((q) => q.id === 'fiddly') ?? { x: 560, y: 690, seed: 335 };
const INK_PEN = '#1d2236';
const LINE1 = '1968 → 1997';
const LINE2 = '29 years late';
const HSCALE = 0.6;
/** where ch06-s06's bead ends on screen (its final camera; the flame push starts exactly there) */
const BEAD = { x: 50, y: 449 };
const W6 = WALL_SLOTS.W6;
const W6C = { x: STUDY.wall.x + W6.x * WK, y: STUDY.wall.y + W6.y * WK };
const W3 = WALL_SLOTS.W3;
const W3C = { x: STUDY.wall.x + W3.x * WK, y: STUDY.wall.y + W3.y * WK };
/** the closing WALL frame's centre: between W1 and W3, a little above W2's empty pin */
const WALL_FOCUS = { x: (W1C.x * 0.55 + W3C.x * 0.45), y: (W1C.y - W1.h * WK * 0.5 + W2PIN.y + 12) / 2 };

// the opening camera's anchors (L4 = the wall plane: scale s = 1000 / (1000 − z))
const S_FLAME = 1000 / (1000 - 560);
const S_MED = 1.05;
/** the flame's screen point in the MEDIUM (lower left), and where that puts the chess slip */
const Q_MED = { x: 109, y: 655 };
const Q_MED_W2 = { x: Q_MED.x + (W2C.x - FLAME.x) * S_MED, y: Q_MED.y + (W2C.y - FLAME.y) * S_MED };
/** a camera that holds world point P (on L4) at screen point Q with action-plane scale s */
function anchorCam(P: Pt, Q: Pt, s: number): Camera3 {
  return { x: P.x - (Q.x - 640) / s, y: P.y - (Q.y - 360) / s, z: 1000 - 1000 / s, lens: 1 };
}

/** a shallow side entry for the narrator's forearm: it comes in from the frame's right edge at ~15°, aimed at `ref`,
 *  so only the forearm and cuff cross the frame (not a long diagonal from the corner) */
function sideEntry(cam: Camera3, ref: Pt): { R: Pt; L: Pt } {
  const p = toScreen(LAYERS.L4, cam, ref.x, ref.y);
  const ex = 1470;
  const ey = p.y + (ex - p.x) * 0.27;
  return { R: toLayer(LAYERS.L4, cam, ex, ey), L: toLayer(LAYERS.L4, cam, ex, ey + 220) };
}

interface B {
  D: number;
  forecast: number;
  match: number;
  late: number;
  search: number;
  rules: number;
  turing: number;
  reach0: number;
  flip0: number;
  flip1: number;
  pen0: number;
  w1a: number;
  w1b: number;
  w2a: number;
  w2b: number;
  lift: number;
  unpin0: number;
  carry0: number;
  cutFile: number;
  cutBoard: number;
  cutWall: number;
  pin0: number;
  pinDur: number;
  curl0: number;
  curl1: number;
  leaf0: number;
}
interface Scene extends ShotScene {
  b: B;
  camA: (t: number) => Camera3;
  camB: (t: number) => Camera3;
  camW: (t: number) => Camera3;
  CAMS: Camera3[];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const late = T.beat('late');
    const rules = T.beat('rules');
    const turing = T.beat('turing');
    // the vignette's iris closes just before 'late'; the slip turns on the word (0.4 s, done by 5.1)
    const flip0 = late;
    const flip1 = flip0 + 0.4;
    const pen0 = flip1 + 0.1;
    const w1a = pen0 + 0.2, w1b = w1a + 0.5;
    const w2a = w1b + 0.1, w2b = w2a + 0.55;
    const lift = w2b + 0.12;
    const unpin0 = lift + 0.18;
    const carry0 = unpin0 + 0.25;
    const cutFile = carry0 + 0.25;
    const cutBoard = rules - 0.62;
    const cutWall = turing - 0.25;
    const b: B = {
      D, late, rules, turing, flip0, flip1, pen0, w1a, w1b, w2a, w2b, lift, unpin0, carry0, cutFile, cutBoard, cutWall,
      forecast: T.beat('forecast'),
      match: T.beat('match'),
      search: T.beat('search'),
      reach0: flip0 - 0.5,
      pinDur: 1.1,
      pin0: rules - 0.45 * 1.1,
      // the leaf is already falling as the camera arrives; it passes Turing's slip at ≈ turing + 0.2, and the corners
      // lift over 1.2 s from there, then hold
      leaf0: turing - 0.55,
      curl0: turing + 0.2,
      curl1: turing + 1.4,
    };
    // WALL (with the flame pull-back). Review round 1: no whip, no full-study wide. (1) 0 → 1.9 s a dolly back out of
    // the flame, anchored on it: the flame drifts only from ch06-s06's bead position (BEAD) to the lower-left of a
    // MEDIUM of the shelf and the Wall; (2) from 1.8 s a slow push anchored on the chess slip, in to it by 'came',
    // then creeping on through the writing. Both are built from one anchor rule (a world point held at a screen point).
    const T_LAND = 1.9;
    const T_PUSH = 1.8;
    const came = T.beat('match');
    const sPush = monotone([[T_PUSH, S_MED], [came + 0.05, 1.95], [cutFile, 2.5]]);
    const qx = monotone([[T_PUSH, Q_MED_W2.x], [came + 0.05, 900], [cutFile, 700]]);
    const qy = monotone([[T_PUSH, Q_MED_W2.y], [came + 0.05, 330], [cutFile, 352]]);
    const camA = (t: number): Camera3 => {
      if (t < T_PUSH) {
        // a Hermite ease: leaves at a moderate speed (carrying ch06-s06's pull-back on through the crossfade) and lands
        // with zero velocity at T_LAND, spreading the move over the whole 1.9 s
        const x = clamp01(t / T_LAND);
        const u = 0.7 * (x * x * x - 2 * x * x + x) + (3 * x * x - 2 * x * x * x);
        const sc = Math.exp(lerp(Math.log(S_FLAME), Math.log(S_MED), u));
        return anchorCam(FLAME, { x: lerp(BEAD.x, Q_MED.x, u), y: lerp(BEAD.y, Q_MED.y, u) }, sc);
      }
      return anchorCam(W2C, { x: qx(t), y: qy(t) }, sPush(t));
    };
    const sIns = STUDY_CAMS.insert('S1', 430);
    const camB = (t: number): Camera3 => ({ ...sIns, x: sIns.x + 30, z: 430 + 40 * sm((t - cutBoard) / (cutWall - cutBoard)) });
    // W1 in (review round 1): the same anchored wall camera, framed on W1 with W2's empty pin in the lamp's pool
    // between W1 and W3 as it glints (s 3.1), then a slow push (≈ 24% over the silent close) so TURING · DUE 2000
    // reads at ≥ 22 px cap by the time the corners have lifted; the pin stays in frame at the bottom
    // the push is anchored on Turing's title line: it grows in place and eases down toward the upper third, while the
    // empty pin (already glinted) sinks out at the bottom
    const TITLE = { x: W1C.x, y: W1C.y - 25 };
    const Q0 = { x: 640 + (TITLE.x - WALL_FOCUS.x) * 3.1, y: 360 + (TITLE.y - WALL_FOCUS.y) * 3.1 };
    const camW = (t: number): Camera3 => {
      const u = sm((t - cutWall) / (D - cutWall));
      return anchorCam(TITLE, { x: lerp(Q0.x, 500, u), y: lerp(Q0.y, 190, u) }, lerp(3.1, 3.98, u));
    };
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 10; i++) CAMS.push(camA((cutFile * i) / 10));
    CAMS.push(camB(cutBoard), camB(cutWall), camW(cutWall), camW(D));
    tl.hold(0, D);
    return { tl, b, camA, camB, camW, CAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t < b.cutFile) paintWallA(f, sc, t);
    else if (t < b.cutBoard) paintFile(f, sc, t);
    else if (t < b.cutWall) paintBoard(f, sc, t);
    else paintWallB(f, sc, t);
    // screen-locked type
    dateStamp(f, t, b);
    const la = win(t, b.search - 0.25, b.search + 0.05) * (1 - win(t, b.cutBoard - 0.45, b.cutBoard - 0.05));
    if (la > 0.01) {
      f.c.save();
      f.c.globalAlpha = la;
      softPlate(f.c, 330, 96, 680, 120, f.mood.ink, 0.6);
      f.c.restore();
      label(f.c, '200 million positions a second', 64, 106, { size: 30, font: MFONT.serif, italic: true, color: textColor(f.mood), align: 'left', alpha: la });
    }
  },
});

/**
 * the study's near plane for this camera. The shared L6 occluders (drape, pelmet, chair back; z 400) only exist for
 * cameras well short of them: the close WALL / BOARD inserts here sit at z 430–710, past the L6 plane, where those
 * occluders would blow up to fill the frame. The desk and lamp (L5) stay while the camera is short of them.
 */
const NEAR_Z = 250;
function near(f: Frame, sc: Scene, cam: Camera3) {
  if (cam.z < NEAR_Z) {
    const cams = sc.CAMS.filter((q) => q.z < NEAR_Z);
    studyNear(f, { key: `${ID}/wide`, cams: cams.length ? cams : [cam], file: true });
  } else if (cam.z < 600) {
    const cams = sc.CAMS.filter((q) => q.z < 600);
    studyNear(f, { key: `${ID}/close`, cams: cams.length ? cams : [cam], file: true, occluders: false });
  }
}

// =================================================================================================== WALL (A)
function paintWallA(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.camA(t);
  f.camera(cam);
  // the tint crossfade as the camera clears the flame (STUDY LOCK)
  const tint = sm((t - 0.1) / 1.3);
  if (tint < 1) f.setMood('candleAmber', { from: 'duskRose', u: tint });
  studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'duskRose', kind: 'city' } });
  const tq = tq12(t);
  const entry = sideEntry(cam, W2C);
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    wall: { hide: ['W2'] },
    // the X-ray box stands in shadow for the whole setup: a dark divider between shelf and Wall, no cyan (STUDY
    // LOCK: the shot's one accent is the yellow slip)
    xray: { light: 0 },
    extra: (c, env) => {
      const light = slotLight('W2');
      // the slip catches the light as its forecast is voiced
      const catchK = win(t, b.forecast - 0.1, b.forecast + 0.35) * (1 - 0.5 * win(t, b.forecast + 1.6, b.forecast + 2.6));
      const L = Math.min(1, light + 0.3 * catchK);
      chessSlipOnWall(c, env, t, tq, b, L, catchK);
      shadeXray(c, env, 0.9);
      // the board's chat-box card (slot O) is the X-ray box's twin: in shadow here too, so no cyan reads
      const O = SLOTS.O;
      c.fillStyle = withAlpha(env.mood.fg, 0.82);
      c.fillRect(STUDY.board.x + (O.x - O.w / 2 - 8) * STUDY.board.k, STUDY.board.y + (O.y - O.h / 2 - 8) * STUDY.board.k, (O.w + 16) * STUDY.board.k, (O.h + 16) * STUDY.board.k);
      // the hands
      const pose = handsA(t, tq, b, entry);
      if (pose) hands.draw(c, pose.p, env, pose.held ? { heldDraw: (cc, at, _h, e) => slipBack(cc, e, at.x, at.y + W2H / 2 - 4, 1, L, 1, 1, false) } : undefined);
    },
  });
  // the slip's catch-light
  const catchK = win(t, b.forecast - 0.1, b.forecast + 0.35) * (1 - 0.6 * win(t, b.forecast + 1.6, b.forecast + 2.6));
  if (catchK > 0.01) f.practical({ x: W2C.x, y: W2C.y, kind: 'lamp', seed: 71, intensity: 0.32 * catchK, radius: 60, layer: 'L4' });
  // the pool of lamplight on the slip, with dust; the near occluder; falloff to ink at the corners — rising with the push
  const k = sm((cam.z - 150) / 350);
  poolDust(f, W2C, 0.9 * k, 51);
  nearOccluder(f, cam, sc.camA(sc.b.cutFile), `${ID}/occA`);
  near(f, sc, cam);
  cornerFalloff(f, cam, W2C, 0.35 + 0.6 * k);
  // the flame filling the frame (ch06-s06's bead become a candle flame), shrinking back to a candle as the camera
  // pulls out of it; deep ink closes round it so the pull-back has real blacks
  if (t < 1.4) flamePush(f, cam, t);
}

/** the X-ray cabinet in shadow (no cyan): a dark divider */
function shadeXray(c: C, env: PaintEnv, a: number) {
  const w = 230 * STUDY.xray.s + 16, h = 420 * STUDY.xray.s + 30;
  c.fillStyle = withAlpha(env.mood.fg, a);
  c.fillRect(STUDY.xray.x - w / 2, STUDY.xray.y - h + 10, w, h);
}

/** a soft warm pool of lamplight on the subject (world point on the wall) with a little dust drifting in it */
function poolDust(f: Frame, P: Pt, k: number, salt: number) {
  if (k <= 0.02) return;
  f.layer('L4', (c, env) => {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const R = 150;
    const g = c.createRadialGradient(P.x, P.y, 0, P.x, P.y, R);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.16 * k));
    g.addColorStop(0.55, withAlpha(env.mood.halo, 0.06 * k));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(P.x - R, P.y - R, 2 * R, 2 * R);
    c.restore();
    dustMotes(c, { area: { x: P.x - 150, y: P.y - 110, w: 300, h: 220 }, count: 36, drift: { x: 1.6, y: -0.9 }, size: 0.55, brightness: 0.75 * k, salt }, env);
  });
}

/** the near occluder: two tall ledger spines standing on the X-ray cabinet's near side (a custom plane in front of the
 *  Wall), out of focus. Placed so that at the reference (closest) camera they fill the bottom-left corner; earlier
 *  in the push they sit over the dark cabinet and sweep left as the camera goes in. */
const OCC: LayerSpec = { id: 'occ', z: 900, haze: 0, blur: 0 };
function nearOccluder(f: Frame, cam: Camera3, ref: Camera3, key: string) {
  const r0 = toScreen(OCC, ref, 0, 0);
  const P0 = toLayer(OCC, ref, 0, 720);
  const kr = r0.k;
  void cam;
  f.layer(OCC, (c, env) => {
    const draw = f.cached(`${key}/${env.mood.id}`, 260, 820, (cc) => {
      cc.translate(60, 440);
      cc.fillStyle = env.fill('fg');
      // the upright spine, then one leaning on it; a band or two cut out of each (paper-cut)
      cc.fillRect(-40, -380, 70, 760);
      cc.save();
      cc.translate(34, 380);
      cc.rotate(0.13);
      cc.fillRect(0, -700, 58, 700);
      cc.restore();
      cc.fillStyle = withAlpha(env.mood.rim, 0.22);
      cc.fillRect(-40, -380, 70, 2);
      cc.fillStyle = withAlpha(env.mood.set, 0.5);
      cc.fillRect(-34, -318, 58, 3);
      cc.fillRect(-34, -300, 58, 2);
    }, { blur: 5 });
    c.save();
    c.translate(P0.x, P0.y);
    c.scale(1 / kr, 1 / kr);
    draw(c, -60, -440);
    c.restore();
  });
}

/** the lamp's pool falls off to ink at the frame corners (screen space, centred on the subject) */
function cornerFalloff(f: Frame, cam: Camera3, P: Pt, k: number) {
  if (k <= 0.02) return;
  const c = f.c;
  const p = toScreen(LAYERS.L4, cam, P.x, P.y);
  const cx = Math.max(240, Math.min(1040, p.x)), cy = Math.max(200, Math.min(520, p.y));
  const g = c.createRadialGradient(cx, cy, 230, cx, cy, 900);
  g.addColorStop(0, withAlpha(f.mood.ink, 0));
  g.addColorStop(0.45, withAlpha(f.mood.ink, 0.45 * k));
  g.addColorStop(1, withAlpha(f.mood.ink, 0.95 * k));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
}

function flamePush(f: Frame, cam: Camera3, t: number) {
  const c = f.c;
  const m = f.mood;
  const p = toScreen(LAYERS.L4, cam, FLAME.x, FLAME.y);
  const u = sm(t / 1.15);
  const H = 20 + 330 * Math.pow(1 - u, 1.35); // flame height (px): ≥ 40% of frame at the cut
  const vis = 1 - sm((t - 0.95) / 0.4);
  // deep ink round the flame (the near candle column and shelf read as silhouettes)
  const ink = 0.92 * (1 - sm((t - 0.3) / 0.9));
  if (ink > 0.01) {
    const g = c.createRadialGradient(p.x, p.y - H * 0.35, H * 0.45, p.x, p.y - H * 0.35, H * 0.45 + 520);
    g.addColorStop(0, withAlpha(m.ink, 0));
    g.addColorStop(0.35, withAlpha(m.ink, 0.75 * ink));
    g.addColorStop(1, withAlpha(m.ink, ink));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
  }
  if (vis <= 0.01) return;
  const sway = Math.sin(t * 9.3) * H * 0.025;
  const tip = { x: p.x + sway * 2, y: p.y - H * 0.82 };
  const r = H * 0.2;
  const shape = (k: number) => {
    c.beginPath();
    c.moveTo(tip.x, p.y - H * 0.82 * k);
    c.bezierCurveTo(p.x + r * 1.35 * k, p.y - H * 0.38 * k, p.x + r * k, p.y + r * 0.6 * k, p.x, p.y + r * 0.72 * k);
    c.bezierCurveTo(p.x - r * k, p.y + r * 0.6 * k, p.x - r * 1.35 * k, p.y - H * 0.38 * k, tip.x, p.y - H * 0.82 * k);
    c.closePath();
  };
  c.save();
  c.globalCompositeOperation = 'lighter';
  const R = H * 1.25;
  const halo = c.createRadialGradient(p.x, p.y - H * 0.3, 0, p.x, p.y - H * 0.3, R);
  halo.addColorStop(0, withAlpha(m.halo, 0.55 * vis));
  halo.addColorStop(0.5, withAlpha(m.halo, 0.16 * vis));
  halo.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = halo;
  c.fillRect(p.x - R, p.y - H * 0.3 - R, 2 * R, 2 * R);
  c.restore();
  c.save();
  c.globalAlpha = vis;
  const g1 = c.createLinearGradient(0, tip.y, 0, p.y + r);
  g1.addColorStop(0, withAlpha(m.halo, 0.0));
  g1.addColorStop(0.25, withAlpha(m.halo, 0.85));
  g1.addColorStop(0.7, mixLab(m.core, '#fff3d6', 0.5));
  g1.addColorStop(1, withAlpha(mixLab(m.halo, '#3a2a60', 0.5), 0.85));
  c.fillStyle = g1;
  shape(1);
  c.fill();
  // the hot white-gold core
  const g2 = c.createRadialGradient(p.x, p.y - H * 0.2, 0, p.x, p.y - H * 0.2, H * 0.4);
  g2.addColorStop(0, '#fffaf0');
  g2.addColorStop(0.5, withAlpha('#fff0c8', 0.9));
  g2.addColorStop(1, withAlpha(m.core, 0));
  c.fillStyle = g2;
  shape(0.62);
  c.fill();
  c.restore();
}

/** W2 through its beats: hanging (vignette inside its frame), turned over on its pin and written on, unpinned */
function chessSlipOnWall(c: C, env: PaintEnv, t: number, tq: number, b: B, light: number, catchK: number) {
  if (tq >= b.carry0) {
    brassPin(c, env, W2PIN.x, W2PIN.y, light, 0);
    return;
  }
  const flip = sm((tq - b.flip0) / (b.flip1 - b.flip0));
  const cs = Math.cos(Math.PI * flip);
  c.save();
  c.translate(W2C.x, W2C.y);
  c.scale(Math.max(0.03, Math.abs(cs)), 1);
  c.translate(-W2C.x, -W2C.y);
  if (cs > 0) {
    agedChessSlip(c, { x: W2C.x, y: W2C.y, k: WK, light, yellow: 1, curl: 1, tagSway: 0.03 * Math.sin(t * 1.1), overdue: 1, tagFont: 11.5 }, env);
    // the vignette irises open inside the slip's frame on 'came' and shut just before 'late'. Inside the iris it is
    // opaque, so the typed text and the scene never double-expose (review round 1)
    const iris = win(t, b.match - 0.12, b.match + 0.2) * (1 - win(t, b.late - 0.3, b.late - 0.04));
    if (iris > 0.01) vignette(c, env, t, tq, iris, light, b.match + 0.4);
    if (catchK > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(env.mood.halo, 0.16 * catchK);
      c.fillRect(W2C.x - W2W / 2, W2C.y - W2H / 2, W2W, W2H);
      // the catch-light: a sheen sweeping across the paper on 'promised'
      const sw = (t - (b.forecast - 0.05)) / 0.55;
      if (sw > 0 && sw < 1) {
        c.beginPath();
        c.rect(W2C.x - W2W / 2, W2C.y - W2H / 2, W2W, W2H);
        c.clip();
        const cx = W2C.x - W2W * 0.8 + W2W * 1.6 * sw;
        const g = c.createLinearGradient(cx - 26, W2C.y - 20, cx + 26, W2C.y + 20);
        g.addColorStop(0, withAlpha(env.mood.core, 0));
        g.addColorStop(0.5, withAlpha(env.mood.core, 0.5 * Math.sin(Math.PI * sw)));
        g.addColorStop(1, withAlpha(env.mood.core, 0));
        c.fillStyle = g;
        c.fillRect(W2C.x - W2W / 2, W2C.y - W2H / 2, W2W, W2H);
      }
      c.restore();
    }
  } else {
    const u1 = clamp01((tq - b.w1a) / (b.w1b - b.w1a));
    const u2 = clamp01((tq - b.w2a) / (b.w2b - b.w2a));
    slipBack(c, env, W2C.x, W2C.y, 1, light, u1, u2, true);
  }
  // the turn's shading: the paper darkens as it swings edge-on (the face away from the lamp), then the back comes up
  // into the light; a bright rim runs along the turning edge
  if (flip > 0 && flip < 1) {
    const ac = Math.abs(cs);
    c.fillStyle = withAlpha(env.mood.fg, 0.55 * (1 - ac) + (cs < 0 ? 0.12 * ac * (1 - flip) : 0));
    c.fillRect(W2C.x - W2W / 2, W2C.y - W2H / 2, W2W, W2H);
    c.fillStyle = withAlpha(env.mood.core, 0.55 * Math.sin(Math.PI * flip));
    const ex = cs > 0 ? W2C.x + W2W / 2 - 3 : W2C.x - W2W / 2;
    c.fillRect(ex, W2C.y - W2H / 2, 3, W2H);
  }
  c.restore();
}

/** the back of the chess slip: plain yellowed paper, then the pen's two lines (u1, u2 = how far each is written) */
function slipBack(c: C, env: PaintEnv, x: number, y: number, s: number, light: number, u1: number, u2: number, pin: boolean) {
  const w = W2W * s, h = W2H * s;
  const paper = mixLab(paperTone(env, light), mixLab(env.mood.halo, '#8a6a2a', 0.5), 0.3);
  c.save();
  c.fillStyle = withAlpha(env.mood.fg, 0.3);
  c.fillRect(x - w / 2 + 2 * s, y - h / 2 + 3 * s, w, h);
  c.fillStyle = paper;
  c.fillRect(x - w / 2, y - h / 2, w, h);
  c.fillStyle = withAlpha(env.mood.rim, 0.18);
  c.fillRect(x - w / 2, y - h / 2, w, 1);
  const ink = mixLab(INK_PEN, paper, 0.12);
  for (const [txt, u, size, dy] of [[LINE1, u1, 17, -6], [LINE2, u2, 15.5, 17]] as const) {
    if (u <= 0) continue;
    c.font = `italic 500 ${size * s}px ${FONT.text}`;
    const tw = c.measureText(txt).width;
    const lx = x - tw / 2;
    c.save();
    c.beginPath();
    c.rect(lx - 2, y + (dy - size) * s, tw * u + 2, size * 1.6 * s);
    c.clip();
    c.fillStyle = ink;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText(txt, lx, y + dy * s);
    c.restore();
  }
  c.restore();
  if (pin) brassPin(c, env, x, y - h / 2 + 6 * s, light, 0);
}

let MCTX: C | null = null;
/** a scratch context for measuring the handwriting */
const mctx = (): C => (MCTX ??= document.createElement('canvas').getContext('2d')!);

/** the nib's point while writing line i at progress u */
function nibAt(c: C, line: 1 | 2, u: number): Pt {
  const size = line === 1 ? 17 : 15.5;
  c.save();
  c.font = `italic 500 ${size}px ${FONT.text}`;
  const tw = c.measureText(line === 1 ? LINE1 : LINE2).width;
  c.restore();
  const dy = line === 1 ? -6 : 17;
  return { x: W2C.x - tw / 2 + tw * u, y: W2C.y + dy - size * 0.3 + Math.sin(u * 46) * size * 0.16 };
}

function brassPin(c: C, env: PaintEnv, x: number, y: number, light: number, glint: number) {
  c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
  c.beginPath();
  c.arc(x, y, 4 * WK, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.5 * (0.3 + light));
  c.beginPath();
  c.arc(x - 1.1, y - 1.1, 1.5, 0, Math.PI * 2);
  c.fill();
  if (glint > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const r = 18 * glint;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(env.mood.core, 0.9 * glint));
    g.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
    c.restore();
  }
}

/** a pen arm whose nib lands on `nib` */
function penArm(entry: Pt, nib: Pt, len: number): ArmPose {
  let sock = nib;
  let arm = hands.reach(entry, sock, 'grip', len, { held: 'pen', bend: 0.1 });
  for (let i = 0; i < 3; i++) {
    const ang = arm.angle + (arm.bend ?? 0) + 0.5;
    sock = { x: nib.x - Math.cos(ang) * 0.55 * len, y: nib.y - Math.sin(ang) * 0.55 * len };
    arm = hands.reach(entry, sock, 'grip', len, { held: 'pen', bend: 0.1 });
  }
  return arm;
}

function handsA(t: number, tq: number, b: B, entry: { R: Pt; L: Pt }): { p: Parameters<typeof hands.draw>[1]; held: boolean } | null {
  if (tq < b.reach0 || tq >= b.cutFile) return null;
  const len = HAND_LEN * HSCALE;
  const E = entry.R;
  const corner = (cs: number): Pt => ({ x: W2C.x + (W2W / 2 - 8) * cs, y: W2C.y + W2H / 2 - 6 });
  const off = (P: Pt, k = 0.18): Pt => ({ x: lerp(E.x, P.x, k), y: lerp(E.y, P.y, k) });
  const ctx = mctx();
  if (tq < b.flip0) {
    const u = sm((tq - b.reach0) / (b.flip0 - b.reach0));
    const P = corner(1);
    const at = { x: lerp(off(P).x, P.x, u), y: lerp(off(P).y, P.y, u) };
    return { p: { right: hands.reach(E, at, u > 0.85 ? 'pinch' : 'open', len), scale: HSCALE }, held: false };
  }
  if (tq < b.flip1 + 0.06) {
    const fl = sm((tq - b.flip0) / (b.flip1 - b.flip0));
    return { p: { right: hands.reach(E, corner(Math.cos(Math.PI * fl)), 'pinch', len), scale: HSCALE }, held: false };
  }
  if (tq < b.lift) {
    // the pen: to the first line, writes it, then the second (a hand swap on the hold)
    let nib: Pt;
    if (tq < b.w1a) {
      const u = sm((tq - b.pen0) / (b.w1a - b.pen0));
      const n0 = nibAt(ctx, 1, 0);
      nib = { x: lerp(n0.x + 40, n0.x, u), y: lerp(n0.y + 30, n0.y, u) };
    } else if (tq < b.w1b) nib = nibAt(ctx, 1, (tq - b.w1a) / (b.w1b - b.w1a));
    else if (tq < b.w2a) {
      const u = sm((tq - b.w1b) / (b.w2a - b.w1b));
      const a = nibAt(ctx, 1, 1), c2 = nibAt(ctx, 2, 0);
      nib = { x: lerp(a.x, c2.x, u), y: lerp(a.y, c2.y, u) - 6 * Math.sin(u * Math.PI) };
    } else if (tq < b.w2b) nib = nibAt(ctx, 2, (tq - b.w2a) / (b.w2b - b.w2a));
    else {
      const u = sm((tq - b.w2b) / (b.lift - b.w2b));
      const a = nibAt(ctx, 2, 1);
      nib = { x: a.x + 14 * u, y: a.y - 12 * u };
    }
    return { p: { right: penArm(E, nib, len), scale: HSCALE }, held: false };
  }
  // unpin: to the pin, then lift the slip off and carry it down toward the lamp side (the file)
  if (tq < b.unpin0) {
    const u = sm((tq - b.lift) / (b.unpin0 - b.lift));
    const a = nibAt(ctx, 2, 1);
    const at = { x: lerp(a.x + 14, W2PIN.x, u), y: lerp(a.y - 12, W2PIN.y, u) };
    return { p: { right: hands.reach(E, at, u > 0.7 ? 'pinch' : 'open', len), scale: HSCALE }, held: false };
  }
  if (tq < b.carry0) return { p: { right: hands.reach(E, W2PIN, 'pinch', len), scale: HSCALE }, held: false };
  const u = sm((tq - b.carry0) / (b.cutFile - b.carry0 + 0.2));
  const at = { x: lerp(W2PIN.x, W2PIN.x + 120, u), y: lerp(W2PIN.y, W2PIN.y + 150, u) };
  return { p: { right: hands.reach(E, at, 'pinch', len, { held: 'slip' }), scale: HSCALE }, held: true };
}

/** the match, played inside the slip's frame: a panelled room, a chessboard, a player leaning back, two towers */
function vignette(c: C, env: PaintEnv, t: number, tq: number, iris: number, light: number, leanAt: number) {
  const m = env.mood;
  const x0 = W2C.x - W2W / 2 + 4 * WK, y0 = W2C.y - W2H / 2 + 10 * WK;
  const w = W2W - 8 * WK, h = W2H - 14 * WK;
  const sx = w / 100, sy = h / 60;
  const P = (x: number, y: number): [number, number] => [x0 + x * sx, y0 + y * sy];
  const ink = mixLab(m.ink, m.set, 0.15);
  // the iris: an ellipse opening from the slip's centre to past its corners (clipped to the window)
  const R = iris * Math.hypot(w, h) * 0.56;
  c.save();
  c.beginPath();
  c.rect(x0, y0, w, h);
  c.clip();
  c.beginPath();
  c.ellipse(x0 + w / 2, y0 + h / 2, R, R * 0.8, 0, 0, Math.PI * 2);
  c.clip();
  // the room: warm backlit panelling (light behind the towers)
  const g = c.createLinearGradient(x0, y0, x0, y0 + h);
  g.addColorStop(0, mixLab(m.set, m.halo, 0.25 + 0.2 * light));
  g.addColorStop(0.7, mixLab(m.setHaze, m.halo, 0.55 + 0.2 * light));
  g.addColorStop(1, mixLab(m.set, m.halo, 0.3));
  c.fillStyle = g;
  c.fillRect(x0, y0, w, h);
  c.fillStyle = withAlpha(m.ink, 0.22);
  for (let i = 1; i < 7; i++) c.fillRect(P(i * 14, 0)[0], y0, 0.8, h * 0.78);
  c.fillRect(x0, P(0, 46)[1], w, 0.8);
  // floor
  c.fillStyle = ink;
  c.fillRect(x0, P(0, 55)[1], w, h);
  // the two tall towers (machine cabinets, no marks), small status lights
  for (const [tx, tw] of [[68, 11], [83, 11]] as const) {
    const [ax, ay] = P(tx, 4);
    c.fillRect(ax, ay, tw * sx, 51 * sy);
    c.fillStyle = withAlpha(m.core, 0.5 + 0.3 * Math.sin(t * 5 + tx));
    for (let k = 0; k < 4; k++) c.fillRect(ax + 3 * sx, ay + (8 + k * 9) * sy, 1.2, 1.2);
    c.fillStyle = ink;
  }
  // the table and the chessboard with a few pieces
  c.beginPath();
  c.moveTo(...P(36, 40));
  c.lineTo(...P(62, 40));
  c.lineTo(...P(62, 42.5));
  c.lineTo(...P(36, 42.5));
  c.closePath();
  c.fill();
  c.fillRect(...P(38, 42), 1.6 * sx, 13 * sy);
  c.fillRect(...P(58.5, 42), 1.6 * sx, 13 * sy);
  c.fillRect(...P(41, 38.4), 16 * sx, 1.7 * sy);
  for (const [px, ph] of [[43, 3.2], [46, 4.2], [49.5, 3], [53, 3.6], [55.5, 2.6]] as const) {
    c.beginPath();
    c.moveTo(...P(px - 0.9, 38.4));
    c.lineTo(...P(px, 38.4 - ph));
    c.lineTo(...P(px + 0.9, 38.4));
    c.closePath();
    c.fill();
  }
  // the player, seated: hunched over the board, then — one pose change on 'came' + 0.4, on twos — he leans back
  const lean = sm((tq - leanAt) / 0.17);
  const [hx, hy] = P(23.5, 45);
  c.beginPath();
  c.moveTo(...P(16, 55));
  c.lineTo(...P(17, 33));
  c.lineTo(...P(20, 33));
  c.lineTo(...P(21, 44));
  c.lineTo(...P(30, 44));
  c.lineTo(...P(30, 55));
  c.lineTo(...P(28.5, 55));
  c.lineTo(...P(28.5, 47));
  c.lineTo(...P(19, 47));
  c.lineTo(...P(18, 55));
  c.closePath();
  c.fill();
  c.save();
  c.translate(hx, hy);
  c.rotate(lerp(0.42, -0.16, lean));
  c.translate(-hx, -hy);
  c.beginPath();
  c.moveTo(...P(22, 44));
  c.lineTo(...P(19.5, 27));
  c.lineTo(...P(24.5, 25.5));
  c.lineTo(...P(29, 42));
  c.lineTo(...P(37, 44));
  c.lineTo(...P(38, 54));
  c.lineTo(...P(35.5, 54));
  c.lineTo(...P(34.5, 47));
  c.lineTo(...P(25, 46));
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(...P(21.6, 21.5), 3.6 * sy, 0, Math.PI * 2);
  c.fill();
  // an arm resting on the table edge
  c.beginPath();
  c.moveTo(...P(23, 30));
  c.lineTo(...P(35, 38.5));
  c.lineTo(...P(35, 40.4));
  c.lineTo(...P(22, 33));
  c.closePath();
  c.fill();
  c.restore();
  c.restore();
  // the iris's own edge, then the window's thin ink frame
  c.save();
  c.beginPath();
  c.rect(x0, y0, w, h);
  c.clip();
  c.strokeStyle = withAlpha(m.ink, 0.7);
  c.lineWidth = 1.2;
  c.beginPath();
  c.ellipse(x0 + w / 2, y0 + h / 2, R, R * 0.8, 0, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  c.save();
  c.globalAlpha *= sm(iris / 0.3);
  c.strokeStyle = withAlpha(m.ink, 0.6);
  c.lineWidth = 0.9;
  c.strokeRect(x0, y0, w, h);
  c.restore();
}

// =================================================================================================== FILE
function paintFile(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  // a still top-down insert (locked off: the slip and the hand are the only motion)
  f.camera(CAMERA3_HOME);
  f.backlight({ intensity: 0.15 });
  const tq = tq12(t) - b.cutFile;
  const S = 1.9; // the slip at this top-down scale
  const sw = W2W * S;
  const rest = { x: 610, y: 392 };
  // carried in from the right (0 → 0.34), laid down (→ 0.46), released; the hand withdraws (0.5 → 0.86)
  const inU = sm(tq / 0.34);
  const down = sm((tq - 0.3) / 0.16);
  const slip = { x: lerp(rest.x + 520, rest.x, inU), y: lerp(rest.y - 26, rest.y, inU) - 6 * (1 - down) };
  const rot = -0.04 + 0.06 * (1 - inU);
  f.layer('L4', (c, env) => {
    const m = env.mood;
    fileDesk(c, { x: 640, y: 400, open: 1, filed: 3, lamp: 1 }, env);
    // the folder: a darker interior, paper fibre, the tab's shadow
    c.save();
    c.fillStyle = withAlpha(m.fg, 0.2);
    c.fillRect(640 - 210 + 14, 400 - 150 + 14, 420 - 28, 300 - 28);
    c.strokeStyle = withAlpha(m.fg, 0.12);
    c.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const y = 260 + hash1(i, 7) * 280, x = 440 + hash1(i, 8) * 380;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 14 + hash1(i, 9) * 30, y + (hash1(i, 10) - 0.5) * 4);
      c.stroke();
    }
    c.fillStyle = withAlpha(m.fg, 0.35);
    c.fillRect(640 - 210 + 30, 400 - 150 + 2, 110, 6);
    c.restore();
    // the lamp's pool: bright at top left, falling to shadow at the bottom right and into the dark at the edges
    const g = c.createLinearGradient(330, 140, 1080, 690);
    g.addColorStop(0, withAlpha(m.halo, 0.0));
    g.addColorStop(0.45, withAlpha(m.fg, 0.12));
    g.addColorStop(1, withAlpha(m.fg, 0.72));
    c.fillStyle = g;
    c.fillRect(-200, -200, 1680, 1120);
    const v = c.createRadialGradient(520, 300, 200, 560, 330, 780);
    v.addColorStop(0, withAlpha(m.fg, 0));
    v.addColorStop(0.6, withAlpha(m.fg, 0.3));
    v.addColorStop(1, withAlpha(m.fg, 0.85));
    c.fillStyle = v;
    c.fillRect(-200, -200, 1680, 1120);
    // the slip: the written back up, fully readable once laid
    if (tq > 0) {
      c.save();
      c.translate(slip.x, slip.y);
      c.rotate(rot);
      c.fillStyle = withAlpha(m.fg, 0.4 * down);
      c.fillRect(-sw / 2 + 6, -W2H * S / 2 + 8, sw, W2H * S);
      slipBack(c, env, 0, 0, S, 0.9, 1, 1, false);
      // the lamp falls across it too
      const gs = c.createLinearGradient(-sw / 2, -W2H * S / 2, sw / 2, W2H * S / 2);
      gs.addColorStop(0, withAlpha(m.halo, 0.12));
      gs.addColorStop(1, withAlpha(m.fg, 0.28));
      c.fillStyle = gs;
      c.fillRect(-sw / 2, -W2H * S / 2, sw, W2H * S);
      c.restore();
    }
    // the hand pinches the slip's right edge (the writing stays clear), lets go, and withdraws to the right
    const out = sm((tq - 0.5) / 0.36);
    if (tq > 0 && out < 1) {
      const pinch = { x: slip.x + sw / 2 + 2, y: slip.y + 6 };
      const at = { x: pinch.x + 460 * out, y: pinch.y + 60 * out };
      const len = HAND_LEN * 1.5;
      const E = { x: 1520, y: at.y + (1520 - at.x) * 0.22 };
      hands.draw(c, { right: hands.reach(E, at, tq < 0.48 ? 'pinch' : 'open', len), scale: 1.5 }, env);
    }
  });
  f.practical({ x: 300, y: 70, kind: 'lamp', seed: 41, intensity: 0.45, radius: 90 });
}

// =================================================================================================== BOARD insert
function paintBoard(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.camB(t);
  f.camera(cam);
  studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'duskRose', kind: 'city' } });
  const tq = tq12(t);
  const u = (tq - b.pin0) / b.pinDur;
  const entry = sideEntry(cam, RULES_PIN);
  studyCase(f, {
    shot: ID,
    when: 'end',
    key: ID,
    shelf: false,
    extra: (c, env) => {
      if (u >= 0.45) {
        const g = Math.exp(-Math.max(0, tq - b.rules) * 1.4) * win(tq, b.rules - 0.05, b.rules + 0.12);
        brassPin(c, env, RULES_PIN.x, RULES_PIN.y, 0.9, g);
      }
      if (u > 0 && u < 0.9) hands.draw(c, hands.act('pin', u, RULES_PIN, { held: 'pin', scale: 0.7, entry }), env);
    },
  });
  const g = Math.exp(-Math.max(0, t - b.rules) * 1.4) * win(t, b.rules - 0.05, b.rules + 0.12);
  if (g > 0.02) f.practical({ x: RULES_PIN.x, y: RULES_PIN.y, kind: 'led', seed: 73, intensity: 0.4 * g, radius: 26, layer: 'L4' });
  near(f, sc, cam);
  cornerFalloff(f, cam, S1C, 0.85);
}

// =================================================================================================== WALL (B): 2000
function paintWallB(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.camW(t);
  f.camera(cam);
  studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'duskRose', kind: 'city' } });
  const tq = tq12(t);
  studyCase(f, {
    shot: ID,
    when: 'end',
    key: ID,
    shelf: false,
    wall: { slips: wallStateAt(ID, 'end'), hide: ['W1', 'W6'] },
    // the X-ray cabinet's top corner sits at the frame's lower left: in shadow, no cyan
    xray: { light: 0 },
    extra: (c, env) => {
      shadeXray(c, env, 0.9);
      emptyW2(c, env, tq, b);
      shadowW6(c, env);
      const cu = sm((tq - b.curl0) / (b.curl1 - b.curl0));
      turingSlip(c, env, cu);
      calendarLeaf(c, env, tq, b);
    },
  });
  // the lamp's pool on W2's empty pin, between W1 and W3; dust in it; the near spines; corners to ink
  poolDust(f, { x: W2PIN.x, y: W2PIN.y - 30 }, 1, 53);
  nearOccluder(f, cam, sc.camW(b.D), `${ID}/occW`);
  near(f, sc, cam);
  cornerFalloff(f, cam, { x: W2PIN.x, y: W2PIN.y - 50 }, 0.9);
}

/** a tear-off calendar leaf reading 2000, drifting down past the Wall on the twos */
function calendarLeaf(c: C, env: PaintEnv, tq: number, b: B) {
  const tau = tq - b.leaf0;
  if (tau < 0) return;
  const m = env.mood;
  // falls from above the frame between W1 and W3, drifting right, past the slips' level (y ≈ W1C.y) at ≈ turing + 0.2
  const x = W1C.x + 70 + 16 * Math.sin(tau * 2.1 + 0.4) + 26 * tau;
  const y = W1C.y - 150 + 200 * tau;
  const rot = 0.32 * Math.sin(tau * 2.1 + 1.3);
  const sk = 0.75 + 0.25 * Math.cos(tau * 2.6);
  const w = 46, h = 52;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(sk, 1);
  const paper = mixLab(paperTone(env, 0.8), m.rim, 0.15);
  c.fillStyle = withAlpha(m.fg, 0.3);
  c.fillRect(-w / 2 + 2, -h / 2 + 2.5, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  // the torn binding edge at the top
  c.fillStyle = mixLab(m.ink, paper, 0.25);
  c.fillRect(-w / 2, -h / 2, w, 6);
  c.fillStyle = paper;
  for (let i = 0; i < 9; i++) {
    c.beginPath();
    c.arc(-w / 2 + 3 + i * 5, -h / 2 + 6, 1.4, Math.PI, 0);
    c.fill();
  }
  c.fillStyle = mixLab(m.ink, paper, 0.1);
  c.font = `600 20px ${FONT.display}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('2000', 0, 6);
  c.fillRect(-w / 2 + 6, 19, w - 12, 0.6);
  c.restore();
}

/** NEW YORK · 11 MAY 1997 in Plex Mono, typed on the twos, raised clear of the caption band */
function dateStamp(f: Frame, t: number, b: B) {
  const c = f.c;
  const m = f.mood;
  const A = win(t, b.match - 0.05, b.match + 0.25) * (1 - win(t, b.cutFile - 0.4, b.cutFile - 0.05));
  if (A <= 0.01) return;
  const text = 'NEW YORK · 11 MAY 1997';
  const tq = tq12(t);
  const n = Math.max(0, Math.min(text.length, Math.floor((tq - b.match) * 18)));
  c.save();
  c.globalAlpha = A;
  softPlate(c, 64 + 190, 592, 560, 92, m.ink, 0.55);
  c.restore();
  label(c, text.slice(0, n), 64, 600, { size: 25, font: MFONT.mono, weight: 500, color: textColor(m), align: 'left', alpha: A, tracking: 2 });
}

/** W2 after the chess slip came down: its brass pin, glinting as the camera lands, and the cleaner patch of wall
 *  paper where the slip hung for thirty-nine years */
function emptyW2(c: C, env: PaintEnv, tq: number, b: B) {
  const m = env.mood;
  c.save();
  c.fillStyle = withAlpha(mixLab(m.setHaze, m.halo, 0.4), 0.16);
  c.fillRect(W2C.x - W2W / 2, W2C.y - W2H / 2, W2W, W2H);
  c.strokeStyle = withAlpha(m.fg, 0.35);
  c.lineWidth = 1;
  c.strokeRect(W2C.x - W2W / 2, W2C.y - W2H / 2, W2W, W2H);
  c.restore();
  // a small glint as the camera settles (≈ 10.5 s), the empty pin catching the lamp
  const g = win(tq, b.turing + 0.0, b.turing + 0.17) * (1 - win(tq, b.turing + 0.35, b.turing + 1.0));
  brassPin(c, env, W2PIN.x, W2PIN.y, 0.85, 0.6 * g);
}

/** W6 (the 30-to-50-years slip): deep in shadow, only its lower-left corner touched by the lamp; unreadable */
function shadowW6(c: C, env: PaintEnv) {
  const m = env.mood;
  const w = W6.w * WK, h = W6.h * WK;
  c.save();
  c.translate(W6C.x, W6C.y);
  c.rotate(hash1(5, 23) * 0.04);
  c.fillStyle = withAlpha(m.ink, 0.4);
  c.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
  c.fillStyle = mixLab(m.ink, m.set, 0.35);
  c.fillRect(-w / 2, -h / 2, w, h);
  const g = c.createRadialGradient(-w / 2, h / 2, 0, -w / 2, h / 2, w * 0.3);
  g.addColorStop(0, withAlpha(paperTone(env, 0.5), 0.75));
  g.addColorStop(1, withAlpha(paperTone(env, 0.5), 0));
  c.fillStyle = g;
  c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(-w / 2, h / 2 - 1, w * 0.22, 1);
  c.fillStyle = mixLab(m.halo, m.set, 0.55);
  c.beginPath();
  c.arc(0, -h / 2 + 6 * WK, 3.4 * WK, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Turing's slip (W1), its corners lifting as 2000 passes: the two lower corners and the top right fold up off the wall
 *  (lifted ≈ 18, 14 and 10 px off the wall on screen at the closing camera), each with its pale underside and a shadow beneath */
function turingSlip(c: C, env: PaintEnv, cu: number) {
  const m = env.mood;
  const sz = WALL_SLOTS.W1;
  const w = sz.w * WK, h = sz.h * WK;
  drawSlip(c, W1_DEF, { x: W1C.x, y: W1C.y, k: WK, light: slotLight('W1'), yellow: 0.6 * cu, curl: 0, rot: 0.01 * cu }, env);
  if (cu <= 0.01) return;
  const rot = hash1(0, 23) * 0.04 + 0.01 * cu;
  c.save();
  c.translate(W1C.x, W1C.y);
  c.rotate(rot);
  // corners: [corner x sign, corner y sign, size in world px]
  for (const [sx, sy, size] of [[1, 1, 11], [-1, 1, 8.5], [1, -1, 6]] as const) {
    const cv = size * cu;
    const K = { x: (sx * w) / 2, y: (sy * h) / 2 };
    const A = { x: K.x, y: K.y - sy * cv }, Bp = { x: K.x - sx * cv, y: K.y };
    const mid = { x: (A.x + Bp.x) / 2, y: (A.y + Bp.y) / 2 };
    // the corner lifted away: wall shows through, a soft shadow on it
    c.fillStyle = mixLab(m.set, m.fg, 0.35);
    c.beginPath();
    c.moveTo(A.x, A.y);
    c.lineTo(K.x, K.y);
    c.lineTo(Bp.x, Bp.y);
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha(m.ink, 0.45 * cu);
    c.beginPath();
    c.moveTo(A.x, A.y);
    c.lineTo(K.x + sx * 2.2 * cu, K.y + sy * 2.6 * cu);
    c.lineTo(Bp.x, Bp.y);
    c.closePath();
    c.fill();
    // the flap: paler underside, folded toward the slip's centre and lifted (slight overshoot of the fold line)
    const Tf = { x: mid.x - sx * cv * 0.42, y: mid.y - sy * cv * 0.42 };
    c.fillStyle = mixLab(paperTone(env, 0.95), m.rim, 0.3);
    c.beginPath();
    c.moveTo(A.x, A.y);
    c.quadraticCurveTo(mid.x - sx * cv * 0.05, mid.y - sy * cv * 0.3, Tf.x, Tf.y);
    c.quadraticCurveTo(mid.x - sx * cv * 0.3, mid.y - sy * cv * 0.05, Bp.x, Bp.y);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(m.fg, 0.45);
    c.lineWidth = 0.5;
    c.stroke();
  }
  c.restore();
}
