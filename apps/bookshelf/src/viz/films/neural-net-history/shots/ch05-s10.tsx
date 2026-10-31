/**
 * ch05-s10 — 1988: the systematicity challenge at the messenger's rim; then the study: X-ray band 3 lights,
 * the messenger's clue card is pinned in C2-b, the LEARNING card catches and sinks, and through the study
 * window the messenger's pool fades by half as most of its figures drift off into the dark (16.0 s).
 *
 * STAGE (dawnGold, the messenger's own light): the trained 2-2-1 lantern network from ch05-s04 hangs over
 * the stage as a warm lamp (not a belief candle: no rings) and throws a dawnGold pool. Inside it, readers
 * lean over a table with a thick two-volume book. At the right rim, half in shadow, FACING OUT, long
 * shadows thrown across the floor: two men in jackets (Fodor, Pylyshyn).
 *   'critics'    their name card
 *   'net'        one hidden lantern in the hanging network flickers uncertainly
 *   'John'       two cut-paper strips rise from the floor between them: JOHN LOVES THE GIRL above,
 *                THE GIRL LOVES JOHN below; the small 'still argued' label fades in beneath them
 *   'always'     the strips swap places like a pair of tiles (both still read as sentences)
 *   'argued'     the strips hang in the half-light at the rim, swaying, unresolved
 *   'messenger'  the hanging lanterns brighten together: the messenger worked; the light fills the frame
 * X-RAY (on 'worked'): out of the flare, the study's X-ray chat box, square-on; the tint crossfades briskly
 *   dawnGold → candleAmber (STUDY LOCK). Band 3 lights (hidden layers + a backward arrow); a bead of light
 *   runs backward along it, twice. Bands 1–2 stay softly lit, the seam above band 3 stays dark.
 * BOARD (on 'listening'): the hands pin the clue card (a bead of light on a string) in C2-b; threads of light
 *   run to the 1958 knob card (C1-b) and the Helsinki card (C2-h); the camera eases back and the LEARNING
 *   card (S3) catches: its paper lantern glows warm for a beat, then sinks to a low ember.
 * WINDOW (the end): the study window; beyond the glass, in the winter night, the messenger's dawnGold pool
 *   on the stage far behind fades by half while most of its figures drift out of the light toward the dark;
 *   two stay. (The chapter's last image; ch06 fades in from black.)
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, Pose, ShotScene } from '../../../film';
import { LAYERS, MOODS, POSES, addPose, blendPose, defineShot, glow, mixLab, overscan, snow, toLayer, toScreen, walkTo, withAlpha, withLife } from '../../../film';
import { lanternNetwork, lanternNetworkLayout } from '../../../film/silhouette/metaphors';
import { XOR_221 } from '../../../film/silhouette/metaphors/mlp';
import { cast, hands } from '../cast';
import { STUDY, STUDY_CAMS, STUDY_WALL, slotWorld, studyCase, studyRoom } from '../sets/study';
import { SLOTS, boardStateAt } from '../sets/studyState';
import { DEFAULT_POOL, drawCard, poolAt, slotPin } from '../sets/caseBoard';
import { floorShadow, type StageGeo } from '../sets/candleStage';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { lampSpill } from '../sets/ch03-s06-kit';
import { GEN, camKeys, clamp01, lerp, lightThread, mixCam, pulse, sm, softArmHands, textPlateLabel, tq12, win, wordStrip } from '../sets/ch05-s07-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch05-s10';

// ================================================================================================ the stage
const FY = 640;
const LAMP_X = 470;
const NET = { x: LAMP_X - 230, y: 66, w: 460, h: 236 };
const NET_O = { ...NET, r: 25, training: XOR_221, epoch: XOR_221.epochs, sample: 1, labels: false, readout: false };
const LAYOUT = lanternNetworkLayout(NET_O);
/** the lantern that flickers on 'net': the output, the one that answers */
const FLICK = LAYOUT.units[2][0];
const POOL = { x: LAMP_X, rx: 410, ry: 60 };
const GEO: StageGeo = {
  candleX: LAMP_X,
  floorY: FY,
  flame: { x: LAMP_X, y: 200 },
  poolX: POOL.x,
  poolRx: POOL.rx,
  rimX: POOL.x + POOL.rx,
  rimXL: POOL.x - POOL.rx,
  inPool: (x: number) => {
    const u = Math.max(0, 1 - Math.abs(x - POOL.x) / POOL.rx);
    return u * u * (3 - 2 * u);
  },
};

// readers in the pool: two at the table on the action plane, two one rank back (L3)
const R1 = { p: GEN.readerA, x: 292, facing: 'right' as const };
const R2 = { p: GEN.readerD, x: 650, facing: 'left' as const };
const R3 = { p: GEN.readerB, x: 404, facing: 'right' as const };
const R4 = { p: GEN.readerC, x: 560, facing: 'left' as const };
const LEAN: Pose = POSES.lean;
const TABLE_Y = Math.round(R1.p.anchor({ x: R1.x, y: FY, facing: 'right', pose: LEAN }, 'handF').y + 4);
const TABLE = { x0: 352, x1: 592 };

// the critics at the right rim, facing out
const FOD_X = 866;
const PYL_X = 1128;
const FODOR = cast.fodor;
const PYL = cast.pylyshyn;
const FOD_BASE: Pose = POSES.think;
const FOD_RAISE: Pose = addPose(POSES.present, { shoulderF: 72, elbowF: -30, wristF: -10, head: -12 });
const PYL_BASE: Pose = POSES.authority;
const PYL_DOUBT: Pose = POSES.doubt;

// the word strips (L4 world) between them
const SX = 997;
// (review r2) they hang BETWEEN the two men, just above head height (screen y ~330-400 at 1080p), where the left
// critic's raised hand leads into them; they rise from the floor between the men folded edge-on (narrow), and open
// to full width only once they are above the heads
const SA_Y = 228, SB_Y = 276;
const STRIP_A = 'JOHN LOVES THE GIRL';
const STRIP_B = 'THE GIRL LOVES JOHN';
// (sized so the strips read at the 22 px (1080p) cap-height floor from the widest stage framing on)
const STRIP_SIZE = 29; // ~24 px cap at 1080p (a margin over the 22 px floor)

// ================================================================================================ the study
const BX = STUDY.board.x, BY = STUDY.board.y;
const C2B = SLOTS['C2-b'];
const C2B_AT = slotWorld('C2-b', 'centre');
const C2B_PIN = slotWorld('C2-b', 'pin');
const S3_AT = slotWorld('S3', 'centre');
/** X-ray band 3 (xrayColumn bandRect(3)) in world px: the backward arrow runs along its bottom */
const XS = STUDY.xray.s;
const xw = (lx: number, ly: number) => ({ x: STUDY.xray.x + lx * XS, y: STUDY.xray.y + ly * XS });
const ARROW = { a: xw(75, -128), b: xw(-75, -128) };
const BAND3 = xw(0, -145);
const XCAM0: Camera3 = { ...STUDY_CAMS.xray, z: 470 };
const XCAM1: Camera3 = { x: STUDY.xray.x, y: BAND3.y - 6, z: 600, lens: 1 };

// the window (study geometry) and the far stage beyond it
const WIN = STUDY.window;
/** a camera whose view puts wall point (wx, wy) at screen (sx, sy) at depth z (the wall plane has its own parallax) */
function aimWall(wx: number, wy: number, z: number, sx = 640, sy = 360): Camera3 {
  const c0: Camera3 = { x: wx, y: wy, z, lens: 1 };
  const p0 = toScreen(STUDY_WALL, c0, wx, wy);
  const p1 = toScreen(STUDY_WALL, { ...c0, x: wx + 100, y: wy + 100 }, wx, wy);
  return { x: wx + (100 * (sx - p0.x)) / (p1.x - p0.x), y: wy + (100 * (sy - p0.y)) / (p1.y - p0.y), z, lens: 1 };
}
const WCAM0: Camera3 = aimWall(WIN.x + WIN.w / 2, 556, 560);
const WCAM1: Camera3 = aimWall(WIN.x + WIN.w / 2 - 4, 562, 610);
const FAR: LayerSpec = { id: 'farStage', z: 3200, haze: 0.5, blur: 1.4 };

interface B {
  D: number;
  critics: number;
  net: number;
  john: number;
  always: number;
  argued: number;
  messenger: number;
  worked: number;
  pin: number;
  cutBoard: number;
  s3: number;
  win0: number;
}
interface Scene extends ShotScene {
  b: B;
  stageCam: (t: number) => Camera3;
  STAGE_CAMS: Camera3[];
  BOARD_CAMS: Camera3[];
  walkers: ((t: number) => { x: number; pose: Pose; facing: 'left' | 'right' })[];
}

/** the far figures in the window: [puppet, x0 (screen), x1 (screen) or null = stays, start delay] */
// (review r2) six figures stand in the pool when the window comes up; four walk out of the light on the twos (two
// left, two right, staggered), the two at the book stay
const FAR_FIGS = [
  { p: GEN.readerA, x0: 548, x1: 330, d: 0.15 },
  { p: GEN.readerB, x0: 612, x1: null, d: 0 },
  { p: GEN.readerC, x0: 708, x1: 930, d: 0.0 },
  { p: GEN.engineerB, x0: 652, x1: null, d: 0 },
  { p: GEN.readerD, x0: 762, x1: 990, d: 0.3 },
  { p: GEN.connectionist, x0: 494, x1: 270, d: 0.45 },
] as const;
const FAR_UNIT = 0.3; // figure scale in far-stage layer units (≈ 93 px on screen)

export default defineShot<Scene>({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const worked = T.beat('xray');
    const listening = T.beat('clue');
    const b: B = {
      D,
      critics: T.beat('rim'),
      net: T.beat('net'),
      john: T.beat('strips'),
      always: T.beat('swap'),
      argued: T.beat('still'),
      messenger: T.word('L0519', 'messenger'),
      worked,
      pin: listening,
      cutBoard: listening - 0.36,
      s3: listening + 0.75,
      // (review r2) the window comes up as the LEARNING card has mostly sunk (~13.7 s), so the pool's fade and the
      // figures leaving read for ~1.4 s before ch06-s01's fade to black starts (~15.2 s)
      win0: Math.min(D - 2.3, listening + 2.2),
    };
    const stageCam = camKeys([
      [0, 640, 372, -40],
      [b.john - 0.2, 690, 368, 60],
      [b.messenger - 0.2, 756, 364, 138],
      [worked, 700, 330, 196],
    ]);
    const STAGE_CAMS = [0, b.john, b.messenger, worked].map(stageCam);
    const BOARD_CAMS: Camera3[] = [boardCam(b.cutBoard, b), boardCam(b.pin + 0.6, b), boardCam(D, b), XCAM0, XCAM1];
    // the far figures leave on the twos (positions in screen px, mapped into the far layer at paint time)
    const walkers = FAR_FIGS.map((g) =>
      g.x1 === null
        ? () => ({ x: g.x0, pose: POSES.lean as Pose, facing: 'right' as const })
        : (() => {
            // every walker leaves outward from the pool's centre and has arrived (and settled) before the
            // last half second, so the shot ends still for ch06's fade from black
            const at = b.win0 + 0.2 + 0.6 * g.d;
            let w = walkTo(g.p.spec, { x0: g.x0, x1: g.x1, at, cadence: 1.15, scale: 0.3 });
            const latest = D - 0.75;
            const arr = w(0).arrive;
            if (arr > latest) w = walkTo(g.p.spec, { x0: g.x0, x1: g.x1, at, cadence: (1.15 * (arr - at)) / (latest - at), scale: 0.3 });
            return (t: number) => {
              const s = w(t);
              return { x: s.x, pose: s.pose as Pose, facing: s.facing };
            };
          })(),
    );
    tl.hold(0, D);
    return { tl, b, stageCam, STAGE_CAMS, BOARD_CAMS, walkers };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t < b.worked) paintStage(f, sc, t);
    else if (t < b.cutBoard) paintXray(f, sc, t);
    else if (t < b.win0) paintBoard(f, sc, t);
    else paintWindow(f, sc, t);
  },
});

// ================================================================================================ STAGE
function paintStage(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.stageCam(t);
  f.camera(cam);
  // the messenger worked: every lantern brightens together toward the flare
  const flare = win(t, b.messenger - 0.1, b.worked);
  // the uncertain lantern on 'net': a stutter on the twos, then it settles, a little lower
  const fl = flickerAt(tq, b.net);
  const lampK = 1 + 0.5 * flare;

  f.backlight({ sunX: LAMP_X, sunY: 330, sunRadius: 560, intensity: 0.52 });
  // L2 backdrop: a dark paper curtain, warmed behind the lamp
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, sc.STAGE_CAMS, 60);
    f.cached(`${ID}/L2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.45);
      cc.fillRect(r.x, r.y, r.w, r.h);
      cc.strokeStyle = withAlpha(env.mood.fg, 0.5);
      cc.lineWidth = 3;
      for (let x = Math.floor(r.x / 70) * 70; x < r.x + r.w; x += 70) {
        cc.beginPath();
        cc.moveTo(x + 8 * Math.sin(x * 0.37), r.y);
        cc.bezierCurveTo(x + 14, r.y + r.h * 0.3, x - 14, r.y + r.h * 0.6, x + 10 * Math.sin(x * 0.91), r.y + r.h);
        cc.stroke();
      }
    })(c, r.x, r.y);
    // (review r2) the critics stand against LIGHT: the pool's soft falloff carried on along the wall behind them
    // (a second, wider and lower lift centred between the two men), so their silhouettes cut out like the readers'
    {
      const hx = (FOD_X + PYL_X) / 2, hy = 430, HR = 560;
      c.save();
      c.translate(hx, hy);
      c.scale(1, 0.62);
      const hg = c.createRadialGradient(0, 0, 20, 0, 0, HR);
      hg.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.42), 0.78));
      hg.addColorStop(0.55, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.22), 0.42));
      hg.addColorStop(1, withAlpha(env.mood.set, 0));
      c.fillStyle = hg;
      c.fillRect(-HR, -HR, 2 * HR, 2 * HR);
      c.restore();
    }
    const gx = LAMP_X, gy = 300, R = 640;
    const g = c.createRadialGradient(gx, gy, 10, gx, gy, R);
    g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.55), Math.min(1, 0.85 * lampK)));
    g.addColorStop(0.45, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.25), 0.45));
    g.addColorStop(1, withAlpha(env.mood.set, 0));
    c.fillStyle = g;
    c.fillRect(gx - R, gy - R, 2 * R, 2 * R);
  });
  f.fog({ yCenter: 0.55 * 720, height: 0.45 * 720, alpha: 0.2, drift: 5 });
  // L3: the back rank of readers, over the table from the front pair
  f.layer('L3', (c, env) => {
    // (review r2) a low haze band on the right (screen y ~0.55-0.75), the lamp's light hanging in the air behind
    // the critics' legs and coats
    {
      const a = toLayer(LAYERS.L3, cam, 1010, 0.65 * 720);
      const kk = toScreen(LAYERS.L3, cam, 0, 0).k;
      c.save();
      c.translate(a.x, a.y);
      c.scale(1 / kk, 0.2 / kk);
      const hb = c.createRadialGradient(0, 0, 10, 0, 0, 470);
      hb.addColorStop(0, withAlpha(mixLab(env.mood.haze, env.mood.halo, 0.45), 0.5));
      hb.addColorStop(0.6, withAlpha(mixLab(env.mood.haze, env.mood.halo, 0.3), 0.26));
      hb.addColorStop(1, withAlpha(env.mood.haze, 0));
      c.fillStyle = hb;
      c.fillRect(-470, -470, 940, 940);
      c.restore();
    }
    const p3 = withLife(LEAN, tq, 63, 0.6);
    const p4 = withLife(blendPose(POSES.stand, POSES.think, 0.6), tq, 71, 0.6);
    // solid hazed silhouettes (ink mixed ~35% toward the haze, fully opaque): a deeper plane, not ghosts
    const solid = mixLab(env.mood.ink, env.mood.haze, 0.24);
    const se: PaintEnv = { ...env, fill: (role) => (role === 'ink' || role === 'fg' ? solid : env.fill(role)) };
    R3.p.draw(c, { x: R3.x, y: FY, facing: R3.facing, pose: p3 }, se);
    R4.p.draw(c, { x: R4.x, y: FY, facing: R4.facing, pose: p4 }, se);
  });
  f.fog('B');
  f.layer('L4', (c, env) => {
    floorAndPool(c, env, sc, lampK);
    // the hanging lamp: two cords from the flies to the network's beam
    c.strokeStyle = env.fill('ink');
    c.lineWidth = 2;
    for (const x of [NET.x + 26, NET.x + NET.w - 26]) {
      c.beginPath();
      c.moveTo(x, NET.y - 700);
      c.lineTo(x, NET.y);
      c.stroke();
    }
    lanternNetwork(c, NET_O, env);
    // the flicker: the lantern's paper dims (an ink veil over its glow, on the twos)
    if (fl > 0.01) {
      const r = LAYOUT.r;
      const g = c.createRadialGradient(FLICK.x, FLICK.y, 0, FLICK.x, FLICK.y, r * 1.6);
      g.addColorStop(0, withAlpha(env.mood.set, 0.82 * fl));
      g.addColorStop(0.7, withAlpha(env.mood.set, 0.55 * fl));
      g.addColorStop(1, withAlpha(env.mood.set, 0));
      c.fillStyle = g;
      c.fillRect(FLICK.x - r * 2, FLICK.y - r * 2, r * 4, r * 4);
    }
    // the messenger worked: the lanterns brighten together
    if (flare > 0.01) for (const col of LAYOUT.units) for (const u of col) glow(c, u.x, u.y, LAYOUT.r * (2.4 + 3 * flare), env.mood.core, 0.5 * flare);
    // shadows (away from the lamp), then the table, its books, and the readers
    const p1 = withLife(LEAN, tq, 41, 0.6);
    const p2 = withLife(LEAN, tq + 0.3, 53, 0.6);
    const fP = critPose(tq, b, 'fodor');
    const pP = critPose(tq, b, 'pyl');
    floorShadow(c, GEO, FOD_X, (cc) => FODOR.draw(cc, { x: 0, y: 0, facing: 'right', pose: fP }, env), env, 1.15);
    floorShadow(c, GEO, PYL_X, (cc) => PYL.draw(cc, { x: 0, y: 0, facing: 'right', pose: pP }, env), env, 1.15);
    floorShadow(c, GEO, R1.x, (cc) => R1.p.draw(cc, { x: 0, y: 0, facing: R1.facing, pose: p1 }, env), env, 0.6);
    floorShadow(c, GEO, R2.x, (cc) => R2.p.draw(cc, { x: 0, y: 0, facing: R2.facing, pose: p2 }, env), env, 0.6);
    readingTable(c, env);
    R1.p.draw(c, { x: R1.x, y: FY, facing: R1.facing, pose: p1, cutLines: true, light: { x: 1, y: -0.6, floor: 0.15 } }, env);
    R2.p.draw(c, { x: R2.x, y: FY, facing: R2.facing, pose: p2, cutLines: true, light: { x: -1, y: -0.6, floor: 0.15 } }, env);
    // the critics: half in shadow at the rim, facing out; the lamp catches only their backs
    FODOR.draw(c, { x: FOD_X, y: FY, facing: 'right', pose: fP, cutLines: true, light: { x: -1, y: -0.4, floor: 0.05 } }, env);
    PYL.draw(c, { x: PYL_X, y: FY, facing: 'right', pose: pP, cutLines: true, light: { x: -1, y: -0.4, floor: 0.05 } }, env);
    strips(c, env, t, tq, b);
  });
  f.rim({ x: -0.8, y: -0.5 });
  // the lamp's light (the network is the source)
  f.practical({ x: LAMP_X, y: NET.y + NET.h * 0.55, kind: 'lamp', seed: 1988, intensity: (0.62 + 0.5 * flare) * (1 - 0.12 * fl), radius: 120 });
  // near floor edge (L5): the stage lip, blurred, once the camera has eased in
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, sc.STAGE_CAMS, 40);
    c.fillStyle = env.fill('fg');
    c.fillRect(r.x, 700, r.w, 200);
    c.fillStyle = withAlpha(env.mood.rim, 0.25);
    c.fillRect(r.x, 700, r.w, 1.5);
  });

  // ---- type: the name card ('critics'), then the label beneath the strips ('John' → 'worked')
  // (review r2) the strips no longer take this corner: the two hard names hold to ~4.45 s, past 'always'
  nameCardLg(f.c, { name: 'Jerry Fodor · Zenon Pylyshyn', role: '1988', x: 1214, y: 74, align: 'right', at: b.critics - 0.05, dur: b.always + 0.24 - (b.critics - 0.05) }, { t, mood: f.mood, seed: 1988 });
  // the small label rides ABOVE the strips (below them are the critics' heads); it waits for the name card to leave
  const labA = win(t, b.always + 0.3, b.always + 0.8);
  if (labA > 0.01) {
    const p = toScreen(LAYERS.L4, cam, SX, SA_Y - 54);
    textPlateLabel(f.c, 'still argued · a 2023 reply claims to meet it', p.x, p.y, { mood: f.mood, alpha: labA * (1 - flare), size: 26, plate: 0.6 });
  }
  // the flare fills the frame on 'worked' (the push out of it lands on the X-ray box)
  // (a warm swell, capped well short of white: the cut lands inside a brisk tint dissolve, not a flash)
  flash(f, 0.38 * flare * flare, toScreen(LAYERS.L4, cam, LAMP_X, NET.y + NET.h * 0.5));
}

function flickerAt(tq: number, at: number) {
  const u = tq - (at - 0.06);
  if (u < 0) return 0;
  if (u > 1.5) return 0.18;
  // a stutter: dim, catch, dim deeper, catch, settle a little lower
  const k = [0.75, 0.2, 0.9, 0.35, 0.8, 0.5, 0.65, 0.4, 0.5, 0.3, 0.32, 0.25, 0.22, 0.2, 0.2, 0.19, 0.18, 0.18];
  return k[Math.min(k.length - 1, Math.floor(u * 12))];
}

function critPose(tq: number, b: B, who: 'fodor' | 'pyl'): Pose {
  if (who === 'fodor') {
    // thinking at first; on 'John' his hand lifts toward the strips; after the swap it returns to his chin
    const up = win(tq, b.john - 0.1, b.john + 0.4) * (1 - win(tq, b.always + 0.7, b.always + 1.3));
    return withLife(blendPose(FOD_BASE, FOD_RAISE, up), tq, 88, 0.7);
  }
  // hands behind his back; on 'always' the head tips back in doubt and stays there
  const d = win(tq, b.always - 0.1, b.always + 0.5) * 0.85;
  return withLife(blendPose(PYL_BASE, PYL_DOUBT, d), tq, 89, 0.7);
}

function floorAndPool(c: C, env: PaintEnv, sc: Scene, lampK: number) {
  const r = overscan(LAYERS.L4, sc.STAGE_CAMS, 40);
  c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.35);
  c.fillRect(r.x, FY - 6, r.w, r.y + r.h - FY + 6);
  c.save();
  c.translate(POOL.x, FY + 14);
  c.scale(1, POOL.ry / POOL.rx);
  const k = Math.min(1, 0.9 * lampK);
  const pg = c.createRadialGradient(0, 0, 10, 0, 0, POOL.rx * 1.05);
  pg.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.25), 0.95 * k));
  pg.addColorStop(0.55, withAlpha(env.mood.halo, 0.6 * k));
  pg.addColorStop(0.86, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.3), 0.3 * k));
  pg.addColorStop(1, withAlpha(env.mood.set, 0));
  c.fillStyle = pg;
  c.beginPath();
  c.arc(0, 0, POOL.rx * 1.05, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.strokeStyle = withAlpha(env.mood.fg, 0.35);
  c.lineWidth = 1;
  for (let i = -16; i <= 16; i++) {
    c.beginPath();
    c.moveTo(POOL.x + i * 60, FY);
    c.lineTo(POOL.x + i * 110, r.y + r.h);
    c.stroke();
  }
}

/** a plain reading table with a thick two-volume book: one volume lies closed, the other open, its pages lit */
function readingTable(c: C, env: PaintEnv) {
  const m = env.mood;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(TABLE.x0, TABLE_Y, TABLE.x1 - TABLE.x0, 9);
  c.fillRect(TABLE.x0 + 12, TABLE_Y + 9, 8, FY - TABLE_Y - 9);
  c.fillRect(TABLE.x1 - 20, TABLE_Y + 9, 8, FY - TABLE_Y - 9);
  c.fillStyle = withAlpha(m.rim, 0.32);
  c.fillRect(TABLE.x0, TABLE_Y - 0.6, TABLE.x1 - TABLE.x0, 1.2);
  // the two volumes of one thick work: volume I stands closed at the table's end (its spine to us),
  // volume II lies open between the readers
  upright(c, env, TABLE.x0 + 44, TABLE_Y);
  openVolume(c, env, TABLE.x0 + 150, TABLE_Y);
}

/** a thick closed volume standing on the table, spine toward us: dark boards, raised bands, a pale label */
function upright(c: C, env: PaintEnv, x: number, y: number) {
  const m = env.mood;
  const ink = env.fill('ink');
  const w = 30, h = 50;
  c.fillStyle = ink;
  c.beginPath();
  c.roundRect(x - w / 2, y - h, w, h, [5, 5, 1, 1]);
  c.fill();
  // the page block's top edge catching the lamp, inset in the boards
  c.fillStyle = mixLab(m.halo, m.rim, 0.4);
  c.fillRect(x - w / 2 + 3, y - h - 1.5, w - 6, 2);
  // raised bands and a small paper label (no lettering)
  c.fillStyle = withAlpha(m.rim, 0.45);
  for (const by of [y - h + 9, y - h + 16, y - 12]) c.fillRect(x - w / 2 + 2, by, w - 4, 1.4);
  c.fillStyle = withAlpha(mixLab(m.halo, m.rim, 0.5), 0.7);
  c.fillRect(x - 8, y - h + 22, 16, 10);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(x - w / 2, y - h + 4, 1.2, h - 6);
}

/** a thick volume lying open: boards, a deep page block on each side, the pages curving up from the gutter */
function openVolume(c: C, env: PaintEnv, x: number, y: number) {
  const m = env.mood;
  const ink = env.fill('ink');
  const paper = mixLab(m.halo, m.core, 0.3);
  const w = 54;
  c.fillStyle = ink;
  c.fillRect(x - w - 4, y - 4, 2 * w + 8, 4);
  for (const sd of [-1, 1]) {
    // the page block (fore-edge lines), its top face curving up toward the gutter
    c.fillStyle = mixLab(paper, m.set, 0.45);
    c.beginPath();
    c.moveTo(x + sd * w, y - 4);
    c.lineTo(x + sd * w, y - 14);
    c.quadraticCurveTo(x + sd * w * 0.45, y - 17, x + sd * 3, y - 22);
    c.lineTo(x + sd * 3, y - 4);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(m.ink, 0.3);
    c.lineWidth = 0.7;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x + sd * w, y - 7 - i * 2.4);
      c.lineTo(x + sd * w * 0.6, y - 8 - i * 2.4);
      c.stroke();
    }
    // the open face (lit)
    c.fillStyle = paper;
    c.beginPath();
    c.moveTo(x + sd * w, y - 14);
    c.quadraticCurveTo(x + sd * w * 0.45, y - 17, x + sd * 3, y - 22);
    c.quadraticCurveTo(x + sd * w * 0.5, y - 22, x + sd * (w - 2), y - 17);
    c.closePath();
    c.fill();
    // a page lifting off the right-hand side
    if (sd === 1) {
      c.strokeStyle = withAlpha(paper, 0.9);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x + 3, y - 22);
      c.quadraticCurveTo(x + 20, y - 34, x + 40, y - 26);
      c.stroke();
    }
  }
  c.fillStyle = ink;
  c.fillRect(x - 1.5, y - 22, 3, 18);
}

/** the two word strips: rise between the critics on 'John', swap on 'always', hang unresolved after 'argued' */
function strips(c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const rise = (at: number) => sm(clamp01((tq - at) / 0.55));
  const ra = rise(b.john - 0.2), rb = rise(b.john - 0.05);
  if (ra <= 0 && rb <= 0) return;
  const sw = sm(clamp01((tq - (b.always - 0.05)) / 0.6));
  const hangA = lerp(SA_Y, SB_Y, sw), hangB = lerp(SB_Y, SA_Y, sw);
  const arc = Math.sin(Math.PI * sw);
  // unresolved: after 'argued' a slow sway that never settles (on twos)
  const un = win(t, b.argued - 0.1, b.argued + 0.8);
  const sway = (ph: number) => (0.02 + 0.03 * un) * Math.sin(tq * 1.7 + ph);
  // they rise from the floor between the two men, folded edge-on (a narrow sliver that passes between the heads),
  // and unfold to full width over the last third of the rise, above head height
  const floor = FY - 30;
  const yA = lerp(floor, hangA, ra), yB = lerp(floor, hangB, rb);
  const openA = 0.14 + 0.86 * sm(clamp01((ra - 0.62) / 0.38)), openB = 0.14 + 0.86 * sm(clamp01((rb - 0.62) / 0.38));
  const dim = 1 - 0.18 * un;
  const glowA = pulse(t, b.john + 0.1, 0.3, 1.2) * 0.8;
  // threads from the flies (they hang like the network: cut paper on strings)
  c.strokeStyle = withAlpha(env.fill('ink'), 0.75);
  c.lineWidth = 1;
  for (const [x, y, a] of [[SX + 46 * arc, yA, ra], [SX - 46 * arc, yB, rb]] as const) {
    if (a < 0.98) continue;
    c.beginPath();
    c.moveTo(x - 120, -400);
    c.lineTo(x - 120, y - 19);
    c.moveTo(x + 120, -400);
    c.lineTo(x + 120, y - 19);
    c.stroke();
  }
  const folded = (x: number, y: number, k: number, draw: () => void) => {
    c.save();
    c.translate(x, y);
    c.scale(k, 1);
    c.translate(-x, -y);
    draw();
    c.restore();
  };
  folded(SX - 46 * arc, yB, openB, () => wordStrip(c, STRIP_B, SX - 46 * arc, yB, STRIP_SIZE, Math.min(1, rb * 3) * dim, env, { rot: (1 - rb) * 0.04 + sway(1.7), glow: glowA }));
  folded(SX + 46 * arc, yA, openA, () => wordStrip(c, STRIP_A, SX + 46 * arc, yA, STRIP_SIZE, Math.min(1, ra * 3) * dim, env, { rot: -(1 - ra) * 0.04 + sway(0), glow: glowA }));
}

/** a screen-space flare: the light filling (or leaving) the frame */
function flash(f: Frame, k: number, at: { x: number; y: number }) {
  if (k <= 0.003) return;
  const c = f.c;
  const P = f.mood;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  c.globalCompositeOperation = 'lighter';
  const x = lerp(at.x, 640, k), y = lerp(at.y, 360, k);
  const g = c.createRadialGradient(x, y, 10, x, y, 300 + 700 * k);
  g.addColorStop(0, withAlpha(mixLab(P.core, '#fff3d0', 0.3), Math.min(1, 1.1 * k)));
  g.addColorStop(0.4, withAlpha(mixLab(P.core, P.halo, 0.5), 0.85 * k));
  g.addColorStop(1, withAlpha(P.halo, 0.55 * k));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  c.restore();
}

// ================================================================================================ X-RAY
function paintXray(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const u = sm(clamp01((t - b.worked) / (b.cutBoard - b.worked)));
  const cam = mixCam(XCAM0, XCAM1, u);
  f.camera(cam);
  f.setMood('candleAmber', { from: 'dawnGold', u: sm(win(t, b.worked - 0.1, b.worked + 0.8)) });
  studyRoom(f, { key: ID, cams: sc.BOARD_CAMS, outside: { mood: 'winterBlue', kind: 'snow' } });
  const bandU = clamp01((t - (b.worked + 0.35)) / 0.9);
  const st = boardStateAt(ID, 'start');
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    board: { state: st, hide: ['C2-b'] },
    xray: { reveal: { band: 3, u: bandU }, light: 0.62 + 0.13 * win(t, b.worked + 0.3, b.worked + 1.2), translucency: 0.6 },
    extra: (c, env) => {
      xrayBand3(c, env, bandU);
      // the backward arrow: a bead of light runs output → hidden → input along band 3, twice
      for (let i = 0; i < 2; i++) {
        const t0 = b.worked + 1.25 + i * 0.85;
        const v = (t - t0) / 0.7;
        if (v < 0 || v > 1) continue;
        const e = sm(v);
        const x = lerp(ARROW.a.x, ARROW.b.x, e), y = ARROW.a.y;
        const C = { core: mixLab(MOODS.serverCyan.core, VELLUM, 0.4) };
        c.save();
        c.globalCompositeOperation = 'lighter';
        const a = Math.sin(Math.PI * v);
        glow(c, x, y, 12, C.core, 0.7 * a);
        c.fillStyle = withAlpha(C.core, 0.95 * a);
        c.beginPath();
        c.arc(x, y, 2.4, 0, Math.PI * 2);
        c.fill();
        // its wake on the arrow
        const g = c.createLinearGradient(x, y, x + 46, y);
        g.addColorStop(0, withAlpha(C.core, 0.6 * a));
        g.addColorStop(1, withAlpha(C.core, 0));
        c.fillStyle = g;
        c.fillRect(x, y - 1.2, 46, 2.4);
        c.restore();
      }
      void env;
    },
  });
  // the light leaving the frame after the flare (it resolves into the box's glow)
  const fk = 1 - win(t, b.worked, b.worked + 0.8);
  flash(f, 0.38 * fk * fk, toScreen(LAYERS.L4, cam, BAND3.x, BAND3.y));
}

/** over the shared X-ray box: the cyan held to band 3 (an amber veil cuts the chroma of the rest of the glass
 *  by about a third), and band 3's hidden layers drawn as rows of small lanterns with the backward arrow */
const VELLUM = '#efe4cb';
function xrayBand3(c: C, env: PaintEnv, u: number) {
  const C3 = MOODS.serverCyan;
  c.save();
  c.translate(STUDY.xray.x, STUDY.xray.y);
  c.scale(XS, XS);
  const R = { x: -97, y: -166, w: 194, h: 42 };
  // the veil: the box glass minus band 3
  const v = new Path2D();
  v.roundRect(-115, -420, 230, 420, 6);
  v.rect(R.x - 6, R.y - 4, R.w + 12, R.h + 8);
  c.fillStyle = withAlpha(mixLab(env.mood.setHaze, env.mood.set, 0.55), 0.55);
  c.fill(v, 'evenodd');
  // (review r2) bands 4-7 stay faint and EMPTY: their cut-outs (furnaces, threads, sorts, shears) are covered with
  // flat unlit vellum so only ~5% of them survives; band 3 is the only thing reading in the column
  {
    const unlit = mixLab(mixLab(MOODS.serverCyan.set, env.mood.setHaze, 0.55), env.mood.set, 0.35);
    c.fillStyle = withAlpha(unlit, 0.9);
    for (let i = 4; i <= 7; i++) {
      const y1 = -22 - (i - 1) * 50 - 10;
      c.fillRect(-97, y1 - 44, 194, 42);
    }
  }
  if (u > 0) {
    c.globalAlpha *= u;
    // cover the band's schematic dots, then draw lantern rows (3 · 4 · 2) on faint threads
    // (the column is backlit vellum now: band 3's light is a soft, paper-filtered cyan, not a saturated glow)
    c.fillStyle = mixLab(mixLab(mixLab(C3.halo, C3.core, 0.2), VELLUM, 0.5), C3.set, 0.18);
    c.fillRect(R.x + 2, R.y + 2, R.w - 4, R.h - 13);
    const xs = [R.x + 30, R.x + R.w / 2, R.x + R.w - 30];
    const rows = [3, 4, 2];
    const pts = xs.map((x, li) => Array.from({ length: rows[li] }, (_, j) => ({ x: x + (j % 2 ? 9 : -9) * (li === 1 ? 1 : 0.6), y: R.y + 7 + (j + 0.5) * ((R.h - 20) / rows[li]) })));
    c.strokeStyle = withAlpha(mixLab(C3.ink, C3.set, 0.3), 0.45);
    c.lineWidth = 0.7;
    for (let li = 0; li < 2; li++) for (const a of pts[li]) for (const b of pts[li + 1]) {
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.stroke();
    }
    for (const col of pts) for (const p of col) {
      // a tiny paper lantern: dark caps, a lit ribbed body
      c.fillStyle = mixLab(C3.ink, C3.set, 0.2);
      c.fillRect(p.x - 2.6, p.y - 5.6, 5.2, 1.6);
      c.fillRect(p.x - 2.6, p.y + 4, 5.2, 1.6);
      c.fillStyle = mixLab(mixLab(C3.core, '#f4fbff', 0.3), VELLUM, 0.45);
      c.beginPath();
      c.ellipse(p.x, p.y, 4, 4.4, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha(C3.ink, 0.4);
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(p.x, p.y - 4.2);
      c.lineTo(p.x, p.y + 4.2);
      c.stroke();
    }
  }
  c.restore();
}

// ================================================================================================ BOARD
function boardCam(t: number, b: B): Camera3 {
  // (the card sits right of centre so the narrator's forearm crosses only a short run of frame from the right edge)
  const A: Camera3 = { x: C2B_AT.x - 96, y: C2B_AT.y - 6, z: 470, lens: 1 };
  const A2: Camera3 = { x: C2B_AT.x - 90, y: C2B_AT.y, z: 482, lens: 1 };
  const W: Camera3 = { x: 404, y: 372, z: 262, lens: 1 };
  if (t < b.pin + 0.3) return mixCam(A, A2, sm(clamp01((t - b.cutBoard) / (b.pin + 0.3 - b.cutBoard))));
  return mixCam(A2, W, sm(clamp01((t - (b.pin + 0.3)) / 1.9)));
}

function paintBoard(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = boardCam(t, b);
  f.camera(cam);
  f.setMood('candleAmber');
  studyRoom(f, { key: ID, cams: sc.BOARD_CAMS, outside: { mood: 'winterBlue', kind: 'snow' } });
  const st = boardStateAt(ID, 'start');
  // the pin: the card lands on 'listening'
  const pinDur = 1.6;
  const pu = (tq - (b.pin - 0.45 * pinDur)) / pinDur;
  const tgt = toScreen(LAYERS.L4, cam, C2B_PIN.x, C2B_PIN.y);
  const entry = { R: toLayer(LAYERS.L4, cam, tgt.x + 1100, tgt.y - 1100 * Math.tan(0.35)), L: toLayer(LAYERS.L4, cam, tgt.x + 1190, tgt.y - 330) };
  const hp = pu > 0 && pu < 1 ? hands.act('pin', pu, C2B_PIN, { held: 'card', scale: 0.8, entry }) : null;
  const placed = hp ? hp.placed : tq >= b.pin;
  // the LEARNING card: glows warm for a beat, then sinks to a low ember
  const s3 = 0.95 * win(t, b.s3 - 0.1, b.s3 + 0.25) * (1 - 0.86 * win(t, b.s3 + 0.75, b.s3 + 1.7));
  const s3Lit = t < b.s3 - 0.1 ? 0 : s3 + 0.12 * win(t, b.s3 + 1.2, b.s3 + 1.7);
  const k = STUDY.board.k;
  const settle = placed && t >= b.pin ? 0.035 * Math.exp(-(t - b.pin) * 2.8) * Math.sin((t - b.pin) * 9) : 0;
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    wall: false,
    board: { state: st, hide: ['C2-b', 'S3'] },
    xray: { reveal: { band: 3, u: 1 }, light: 0.5, translucency: 0.6 },
    extra: (c, env) => {
      // S3 LEARNING
      drawCard(c, SLOTS.S3, { x: S3_AT.x, y: S3_AT.y, k, light: poolAt(DEFAULT_POOL, SLOTS.S3.x, SLOTS.S3.y), lanternLit: s3Lit }, env);
      if (s3Lit > 0.02) glow(c, S3_AT.x, S3_AT.y - 8, 90, env.mood.halo, 0.32 * s3Lit);
      // threads of light from the new card: to the 1958 knob card, to the Helsinki card, and on to S3 for its beat
      const pB = slotPin(STUDY.board, 'C2-b');
      lightThread(c, env, pB, slotPin(STUDY.board, 'C1-b'), win(t, b.pin + 0.15, b.pin + 0.75), 1 - 0.45 * win(t, b.pin + 1.4, b.pin + 2.4), 30);
      lightThread(c, env, pB, slotPin(STUDY.board, 'C2-h'), win(t, b.pin + 0.3, b.pin + 0.8), 1 - 0.45 * win(t, b.pin + 1.4, b.pin + 2.4), 12);
      lightThread(c, env, slotPin(STUDY.board, 'C1-b'), slotPin(STUDY.board, 'S3'), win(t, b.pin + 0.55, b.s3), 1 - win(t, b.s3 + 0.75, b.s3 + 1.6), 30);
      // the clue card on its pin
      if (placed) drawCard(c, C2B, { x: C2B_AT.x, y: C2B_AT.y, k, light: Math.min(1, poolAt(DEFAULT_POOL, C2B.x, C2B.y) + 0.25 * pulse(t, b.pin, 0.2, 1.4)), rot: settle }, env);
      if (hp) softArmHands(c, hp, env, { heldDraw: (cc, at, _h, e) => drawCard(cc, C2B, { x: at.x, y: at.y + C2B.h / 2 - 7, k, light: 0.85, pin: false }, e) });
      // the bead of light running backward on the card's string, once it is pinned
      const bv = (t - (b.pin + 0.35)) / 0.9;
      if (bv > 0 && bv < 1) {
        const x = C2B_AT.x + 34 - 68 * sm(bv);
        c.save();
        c.globalCompositeOperation = 'lighter';
        glow(c, x, C2B_AT.y - 8, 10, env.mood.core, 0.8 * Math.sin(Math.PI * bv));
        c.restore();
      }
    },
  });
  lampSpill(f, 0.7, false);
  // the lamp's pool on the board: an elliptical falloff on the action (the rest of the board falls to ink)
  {
    const fq = t < b.pin + 0.6 ? C2B_AT : { x: lerp(C2B_AT.x, S3_AT.x, 0.45), y: lerp(C2B_AT.y, S3_AT.y, 0.45) };
    const fp = toScreen(LAYERS.L4, cam, fq.x, fq.y);
    const fx = lerp(fp.x, 640, 0.3), fy = lerp(fp.y, 360, 0.3);
    const c = f.c;
    c.save();
    c.translate(fx, fy);
    c.scale(1.45, 1);
    const g = c.createRadialGradient(0, 0, 130, 0, 0, 640);
    g.addColorStop(0, withAlpha(f.mood.ink, 0));
    g.addColorStop(0.5, withAlpha(f.mood.ink, 0.2));
    g.addColorStop(1, withAlpha(f.mood.ink, 0.6));
    c.fillStyle = g;
    c.fillRect(-900, -900, 1800, 1800);
    c.restore();
  }
  // a hard cut from the X-ray box: carry a breath of its cyan glow into the first frames
  void BX;
  void BY;
}

// ================================================================================================ WINDOW
function paintWindow(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const u = sm(clamp01((t - b.win0) / (b.D - b.win0)));
  const cam = mixCam(WCAM0, WCAM1, u);
  f.camera(cam);
  f.setMood('candleAmber');
  // the pool falls to half over ~1.3 s, done just as ch06's fade to black begins
  const fade = 1 - 0.5 * win(t, b.win0 + 0.2, b.D - 0.8);
  f.backlight({ sunX: 640, sunY: 520, sunRadius: 420, intensity: 0.45 });
  // L1: the winter night beyond the glass (the era colour enters only here)
  f.layer('L1', (c, env) => {
    const P = MOODS.winterBlue;
    const r = overscan(LAYERS.L1, [WCAM0, WCAM1], 80);
    f.cached(`${ID}/winSky/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const g = cc.createLinearGradient(0, r.y, 0, r.y + r.h);
      g.addColorStop(0, P.sky[0]);
      g.addColorStop(0.55, P.sky[1]);
      g.addColorStop(0.8, P.sky[2]);
      g.addColorStop(1, P.sky[1]);
      cc.fillStyle = g;
      cc.fillRect(r.x, r.y, r.w, r.h);
    })(c, r.x, r.y);
    void env;
  });
  // the far stage: a dark floor, the messenger's lamp (tiny), its pool fading by half, the figures leaving
  f.layer(FAR, (c, env) => {
    const P = MOODS.winterBlue;
    const G = MOODS.dawnGold;
    const S = (x: number, y: number) => toLayer(FAR, cam, x, y);
    const HY = toScreen(STUDY_WALL, cam, WIN.x + WIN.w / 2, 616).y;
    const LY = toScreen(STUDY_WALL, cam, WIN.x + WIN.w / 2, 462).y;
    const o = S(640, HY);
    const k = (S(740, HY).x - o.x) / 100; // far units per screen px
    const we: PaintEnv = { ...env, mood: P, fill: (role) => mixLab((P as unknown as Record<string, string>)[role] ?? P.set, P.haze, role === 'ink' ? 0.18 : 0.4) };
    // ground
    c.fillStyle = mixLab(P.fg, P.set, 0.4);
    const g0 = S(-200, HY + 4), g1 = S(1500, 1100);
    c.fillRect(g0.x, g0.y, g1.x - g0.x, g1.y - g0.y);
    // the pool
    c.save();
    c.translate(o.x, S(640, HY + 14).y);
    c.scale(1, 0.16);
    // (the pool also draws in a little as it dims)
    const R = 300 * k * (1 - 0.4 * (1 - fade));
    const pg = c.createRadialGradient(0, 0, 4, 0, 0, R);
    pg.addColorStop(0, withAlpha(mixLab(G.halo, G.core, 0.3), 0.95 * fade));
    pg.addColorStop(0.55, withAlpha(G.halo, 0.55 * fade));
    pg.addColorStop(1, withAlpha(G.halo, 0));
    c.fillStyle = pg;
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.fill();
    c.restore();
    // the lamp's glow in the air above it, and its spill on the haze
    const lp = S(640, LY);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const lg = c.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, 240 * k);
    lg.addColorStop(0, withAlpha(G.core, 0.75 * fade));
    lg.addColorStop(0.12, withAlpha(G.halo, 0.45 * fade));
    lg.addColorStop(1, withAlpha(G.halo, 0));
    c.fillStyle = lg;
    c.fillRect(lp.x - 240 * k, lp.y - 240 * k, 480 * k, 480 * k);
    c.restore();
    // the figures (on twos): most walk out of the light; two stay, bent over the book
    FAR_FIGS.forEach((g, i) => {
      const w = sc.walkers[i](t);
      const p = S(w.x, HY + 6);
      const lit = 1 - Math.min(1, Math.abs(w.x - 640) / 250);
      c.save();
      c.globalAlpha *= 0.35 + 0.65 * Math.max(lit, 0.25);
      g.p.draw(c, { x: p.x, y: p.y, facing: g.x1 === null ? 'right' : w.facing, pose: g.x1 === null ? withLife(POSES.lean, tq, 400 + i, 0.6) : w.pose, scale: FAR_UNIT * k * 1.0 }, we);
      c.restore();
    });
  });
  // snow past the glass (outside only)
  f.layer('L2', (c, env) => {
    const a = toLayer(LAYERS.L2, cam, 300, -40), z = toLayer(LAYERS.L2, cam, 980, 760);
    snow(c, { area: { x: a.x, y: a.y, w: z.x - a.x, h: z.y - a.y }, count: 70, salt: 11, color: MOODS.winterBlue.core, size: 1.2, fall: 40, wind: 12 }, env);
  });
  // the study wall with the window hole (the study's own glazing: 3 lights wide, 6 high), lamp-warmed
  f.layer(STUDY_WALL, (c, env) => {
    const r = overscan(STUDY_WALL, [WCAM0, WCAM1], 60);
    f.cached(`${ID}/winWall/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const wall = mixLab(env.fill('set'), env.mood.fg, 0.25);
      cc.fillStyle = wall;
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(WIN.x, WIN.y, WIN.w, WIN.h);
      cc.fill('evenodd');
      cc.save();
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(WIN.x, WIN.y, WIN.w, WIN.h);
      cc.clip('evenodd');
      const pool = cc.createRadialGradient(WIN.x - 260, 760, 40, WIN.x - 260, 760, 900);
      pool.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.2), 0.5));
      pool.addColorStop(1, withAlpha(wall, 0));
      cc.fillStyle = pool;
      cc.fillRect(r.x, r.y, r.w, r.h);
      cc.restore();
      cc.fillStyle = env.fill('ink');
      const bar = 9;
      cc.fillRect(WIN.x - 16, WIN.y - 16, WIN.w + 32, 16);
      cc.fillRect(WIN.x - 16, WIN.y, 16, WIN.h);
      cc.fillRect(WIN.x + WIN.w, WIN.y, 16, WIN.h);
      cc.fillRect(WIN.x - 30, WIN.y + WIN.h, WIN.w + 60, 22);
      for (let i = 1; i < 3; i++) cc.fillRect(WIN.x + (WIN.w * i) / 3 - bar / 2, WIN.y, bar, WIN.h);
      for (let j = 1; j < 6; j++) cc.fillRect(WIN.x, WIN.y + (WIN.h * j) / 6 - bar / 2, WIN.w, bar);
      cc.fillStyle = withAlpha(env.mood.rim, 0.3);
      cc.fillRect(WIN.x - 16, WIN.y - 16, 1.4, WIN.h + 16);
      cc.fillRect(WIN.x + WIN.w + 15, WIN.y - 16, 1.4, WIN.h + 16);
    })(c, r.x, r.y);
  });
  f.fog({ yCenter: 0.62 * 720, height: 0.4 * 720, alpha: 0.12, drift: 6 });
  // the study lamp's warmth from the left (we are inside, in candleAmber)
  f.layer('L5', (c, env) => {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const p = toLayer(LAYERS.L5, cam, -120, 640);
    const g = c.createRadialGradient(p.x, p.y, 20, p.x, p.y, 520);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.14));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - 520, p.y - 520, 1040, 1040);
    c.restore();
  });
}
