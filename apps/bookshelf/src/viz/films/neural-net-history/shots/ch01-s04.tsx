/**
 * ch01-s04 — the case opens: the lamp clicks on in the detective's study; the hands pin the case card
 * WHO TAUGHT IT? at the centre of the board, then slide the makers' own admission of a flaw into the
 * lamplight and file it (candleAmber, 17.79 s, lampChange in from the frozen earth).
 *
 * The study is the one geography of sets/study.ts (shared with ch01-s05's full wide): the left bookcase
 * flanking the Case Board, the Wall of Forecasts in the dark to the board's right, the empty candle shelf
 * below, and the green-shaded banker's lamp on the desk in front, under its own pool (sets/ch01-s04-nearDesk).
 *
 * BOARD (0 → ~8.3 s): the lamp clicks on (`lamp`, 0.5 s): its green shade rises into the bottom of frame,
 *   lit from inside along its lip, and the study builds out of the dark from its pool outward: the empty
 *   board with faint pin-holes, the bookcase (ink against an amber backlight), haze in the lamplight. A PIN
 *   INSERT: the camera pushes in to slot K as one cuffed hand (articulated fingers, shirt cuff, jacket sleeve,
 *   a short forearm from the lower right at ~35°) rises holding the card by its right edge; the card is pressed
 *   flat onto its brass pin exactly on "taught" and the hand withdraws along its forearm. The camera eases back
 *   only to a medium where the card still reads (≥ 28 px), and on "launched" begins a slow drift down past the
 *   board's foot to the lamp's green shade, carrying L0107.
 * TILT (~7.9 → ~8.8 s): the desk's dark front edge wipes up through the lens (a hidden cut) and the FILE
 *   camera (top-down on the desk) arrives still moving.
 * FILE (~8.3 s →): on "admitted" a hand pushes a typed slip into the lamp's pool: the launch post's sentence and
 *   its date, exactly as L0108 reads it. A slow push in while it is read; the index finger follows the reading
 *   from BENEATH the slip's lower edge (never over the words). On "Put" the right hand folds the slip once,
 *   carries it into the folder the left hand holds open; the left hand closes the flap on "file" and leaves;
 *   the right hand taps the folder twice (two visible lifts, on twos) and rests flat on it to the cut.
 *   The lamp's green shade, seen from above, is a soft near-plane shape at the top-left edge of frame.
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, defineShot, fbm, legibleSize, makeCanvas, mixLab, overscan, toScreen, withAlpha } from '../../../film';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { STUDY, slotWorld, studyCase, studyRoom } from '../sets/study';
import { SLOTS, wallStateAt } from '../sets/studyState';
import { paperTone } from '../sets/caseBoard';
import { hash1 } from '../../../film/silhouette/atmosphere';
import { BULB01, LAMP01, SHELF_PLANE, shadeGreen, study01Near, study01Shelves } from '../sets/ch01-s04-nearDesk';
import { armDir, drawArm, wristAt, type Arm, type HandShape01, type Pt } from '../sets/ch01-s04-hands';
import { ch01Card } from '../sets/ch01-s04-cards';

// ---------------------------------------------------------------- cameras
const KP = slotWorld('K', 'centre');
/** the establishing medium (a tighter s05 wide): the lamp low in frame, its lit lip at (640, 497), exactly where
 *  ch01-s03's home window sat, so the lampChange carries that last cyan point into the switch-on; the board
 *  fills the upper half, the bookcase at frame left */
const OPEN: Camera3 = { x: 725, y: 635, z: -420, lens: 1 };
/** the pin insert: the card a little below centre, so the board's top frame edge (rim-lit) and the oxblood
 *  thread cross the top of K's pool and the pool reads as cork on a board, not a lit wall */
const INSERT: Camera3 = { x: KP.x + 20, y: KP.y - 62, z: 290, lens: 1 };
/** the medium after the pin: K still reads at ≥ 28 px */
const MED: Camera3 = { x: KP.x + 40, y: KP.y + 50, z: 150, lens: 1 };
/** the drift's end: down past the board's foot to the lamp's green shade */
const LOW: Camera3 = { x: 740, y: 980, z: 120, lens: 1 };
const BOARD_CAMS = [OPEN, { ...OPEN, z: OPEN.z + 40 }, INSERT, MED, LOW, { ...LOW, y: LOW.y + 420 }];
/** the near bookcase's lamp-side edge (L5 world): ~70 px in from frame left in the establishing medium, so the
 *  study's own amber-backlit bookcase reads beside it; it slides out past the lens on the push */
const BOOKCASE_EDGE = -168;

/** the cut's marks, anchored on `slip` ("admitted"): the board's slow drift down to the desk (one 3 s ease from
 *  "launched") ends on a clean CUT to the top-down FILE plate just before the slip enters (no wipe, no black) */
const tiltMarks = (slipAt: number) => ({ tilt0: slipAt - 0.2, mid: slipAt - 0.2, tilt1: slipAt - 0.2 });

// ---------------------------------------------------------------- the pin
const K = SLOTS.K;
const KC = { x: STUDY.board.x + K.x, y: STUDY.board.y + K.y };
/** the hand holds the card from behind its lower right corner: fingertips behind the card, the palm and cuff
 *  below and to the right of it, so the type is never covered */
const GRIP_OFF = { x: K.w / 2 - 22, y: K.h / 2 - 16 };
const HAND_L4 = 190;
const PIN_DIR = armDir(-34);

// ---------------------------------------------------------------- the slip and the folder (FILE plate)
const SLIP = { w: 640, h: 262 } as const;
const SLIP_REST = { x: 455, y: 352 };
/** the slip's type: ~5% over the 22 px cap-height floor at 1080p, so it clears it through the slide-in settle too */
const SLIP_PX = 30;
const slipFont = () => `400 ${SLIP_PX}px ${FONT.typewriter}`;
const FOLDER = { x: 1000, y: 430, w: 420, h: 300 };
const QUOTE = ['“ChatGPT sometimes writes', 'plausible-sounding but incorrect', 'or nonsensical answers.”'];
const QUOTE_X = [30, 44, 44];
const ATTRIB = '— OpenAI, 30 Nov 2022';
/** the spoken words of L0108 that are on the slip: [word, line, index of the word on that line] */
const READ: [string, number, number][] = [
  ['sometimes', 0, 1], ['writes', 0, 2], ['plausible-sounding', 1, 0], ['but', 1, 1], ['incorrect', 1, 2],
  ['or', 2, 0], ['nonsensical', 2, 1], ['answers', 2, 2],
];
const HAND_F = 230; // hand length on the FILE plate (a closer camera)
/** the banker's lamp seen from above (L5 world): CROPPED just past the top-left corner of the FILE plate, so only
 *  the bulb's warm spill from under its lip reaches the desk (no dark shape intruding on the frame) */
const LAMP_TOP = { x: -190, y: -30 };
const DIR_R = armDir(-26);
/** the carry and the taps: the right forearm nearly upright from the bottom edge, so it stays BELOW the folder */
const DIR_R2 = armDir(-7);
/** the left hand: nearly upright from the bottom edge, wrist bent forward onto the flap */
const DIR_L = armDir(6);

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const smr = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpP = (a: Pt, b: Pt, u: number): Pt => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
const lerpCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: lerp(a.lens, b.lens, u) });
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12; // on twos

/** the board camera as a pure function of time */
function boardCam(t: number, B: { pin: number; launched: number; tilt0: number; mid: number }): Camera3 {
  const T_TILT0 = B.tilt0, T_MID = B.mid;
  // the medium holds (a slow creep in) while the study resolves round the lamp, then the push to slot K
  const inS = B.pin - 0.95, inE = B.pin - 0.1;
  const outS = B.pin + 0.85, outE = B.launched - 0.15;
  const o2 = { ...OPEN, z: OPEN.z + 40 };
  if (t < inS) return lerpCam(OPEN, o2, clamp01(t / inS));
  if (t < inE) return lerpCam(o2, INSERT, smr((t - inS) / (inE - inS)));
  const i2 = { ...INSERT, z: INSERT.z + 14 };
  if (t < outS) return lerpCam(INSERT, i2, (t - inE) / (outS - inE));
  if (t < outE) return lerpCam(i2, MED, smr((t - outS) / (outE - outS)));
  if (t < B.launched) return MED;
  // from "launched": ONE slow ease (~3 s) down past the board's foot to the lamp and the desk top; it is still
  // settling when the cut to the FILE plate comes
  void T_MID;
  const u = clamp01((t - B.launched) / Math.max(0.5, T_TILT0 + 0.15 - B.launched));
  return lerpCam(MED, LOW, smr(u));
}

export default defineShot({
  id: 'ch01-s04',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    tl.hold(0, D);
    return {
      tl,
      D,
      ...tiltMarks(T.beat('slip')),
      lampAt: T.beat('lamp'),
      pin: T.beat('pinCase'),
      launched: T.word('L0107', 'launched'),
      slipAt: T.beat('slip'),
      fileAt: T.beat('file'),
      putAt: T.word('L0109', 'Put'),
      inAt: T.word('L0109', 'in'),
      caseAt: T.word('L0109', 'case'),
      read: READ.map(([w]) => [T.word('L0108', w), T.wordEnd('L0108', w)] as [number, number]),
      readStart: T.word('L0108', 'sometimes'),
      readEnd: T.line('L0108').end,
    };
  },
  paint(f, _s, sc) {
    const t = f.t;
    if (t < sc.mid) paintBoard(f, sc, t);
    else paintFile(f, sc, t);
  },
});

type SC = {
  D: number;
  tilt0: number;
  mid: number;
  tilt1: number;
  lampAt: number;
  pin: number;
  launched: number;
  slipAt: number;
  fileAt: number;
  putAt: number;
  inAt: number;
  caseAt: number;
  read: [number, number][];
  readStart: number;
  readEnd: number;
};

// =====================================================================================================
// BOARD
// =====================================================================================================
const WALL_SLIPS = wallStateAt('ch01-s05', 'start');
const WALL_HIDE = WALL_SLIPS.filter((v) => v.ghost).map((v) => v.slot);

function paintBoard(f: Frame, sc: SC, t: number) {
  const cam = boardCam(t, sc);
  f.camera(cam);
  const L = lampLevel(t, sc.lampAt);
  studyRoom(f, { key: 'ch01-s04', cams: BOARD_CAMS, outside: { mood: 'winterBlue', kind: 'city', city: 0.3 } });
  study01Shelves(f, { key: 'ch01-s04', cams: BOARD_CAMS, lamp: 0.25 + 0.75 * L });
  // haze drifting through the lamplight, between the shelves and the board
  f.fog({ yCenter: 470, height: 340, alpha: 0.15 * L, drift: 9 });

  // the pin, on twos: rise carrying the card, press it flat on "taught", let go, withdraw along the forearm
  const tq = q2(t);
  const target: Pt = { x: KC.x + GRIP_OFF.x, y: KC.y + GRIP_OFF.y };
  const t0 = sc.pin - 0.8, tP = sc.pin - 0.2, tR = sc.pin + 0.08, tW = sc.pin + 0.42;
  let sock: Pt | null = null;
  let shape: HandShape01 = 'pinch';
  let carrying = false;
  let press = 0;
  const away = (p: Pt, d: number): Pt => ({ x: p.x - Math.cos(PIN_DIR) * d, y: p.y - Math.sin(PIN_DIR) * d });
  if (tq >= t0 && tq < tW) {
    if (tq < tP) {
      const u = sm((tq - t0) / (tP - t0));
      sock = lerpP(away({ x: target.x + 4, y: target.y + 4 }, 400), { x: target.x + 4, y: target.y + 4 }, 1 - Math.pow(1 - u, 1.6));
      carrying = true;
      press = 1;
    } else if (tq < sc.pin) {
      const u = sm((tq - tP) / (sc.pin - tP));
      sock = lerpP({ x: target.x + 4, y: target.y + 4 }, target, u);
      carrying = true;
      press = 1 - u;
    } else if (tq < tR) {
      // let go: the fingers relax off the card (never a spread "claw")
      sock = away(target, 30);
      shape = 'rest';
    } else {
      // withdraw along the forearm, relaxed, and out of frame within ~0.35 s
      const u = (tq - tR) / (tW - tR);
      sock = away(target, 30 + 820 * u * (0.6 + 0.4 * u));
      shape = 'rest';
    }
  }
  studyCase(f, {
    shot: 'ch01-s04',
    when: 'end',
    key: 'ch01-s04',
    shelf: { only: [] },
    // the cork is DARK (about L* 25) outside a tight lamp pool round K, so the board stands apart from the wall
    board: { hide: ['K'], pinHoles: true, pool: BOARD_POOL },
    wall: { slips: WALL_SLIPS, hide: WALL_HIDE },
    extra: (c, env) => {
      corkDetail(c, env);
      // the hand works from behind the card: its fingertips behind the edge it holds, never over the type
      if (sock) {
        const arm: Arm = { wrist: wristAt(sock, PIN_DIR, shape, HAND_L4, 'R', 0.12), dir: PIN_DIR, shape, side: 'R', len: HAND_L4, bend: 0.12, light: { x: 0.25, y: 1 } };
        drawArm(c, env, arm);
      }
      if (tq >= sc.pin) {
        const k = t - sc.pin;
        const swing = k > 0 ? 0.045 * Math.exp(-k * 4) * Math.sin(k * 15) : 0;
        ch01Card(c, K, { x: KC.x, y: KC.y, light: 1, rot: swing }, env);
        // the brass pin's glint as it goes home
        if (k < 0.5) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          const px = KC.x, py = KC.y - K.h / 2 + 7;
          const g = c.createRadialGradient(px, py, 0, px, py, 16);
          g.addColorStop(0, withAlpha(env.mood.core, 0.7 * (1 - k / 0.5)));
          g.addColorStop(1, withAlpha(env.mood.core, 0));
          c.fillStyle = g;
          c.fillRect(px - 16, py - 16, 32, 32);
          c.restore();
        }
      }
      if (sock && carrying) ch01Card(c, K, { x: sock.x - GRIP_OFF.x, y: sock.y - GRIP_OFF.y, light: 0.9, rot: -0.02 * press, lift: press }, env);
    },
  });
  // haze drifting through the lamp's pool, in front of the board (it catches the light, so it reads as air)
  {
    const pc = toScreen(LAYERS.L4, cam, STUDY.pool.cx, STUDY.pool.cy);
    f.fog({ yCenter: pc.y + 40, height: 360, alpha: 0.13 * L, drift: 14 });
  }
  // the study's bookcase edge, nearest the lens at frame left (L5, blurred): it slides out past the lens as
  // the camera pushes in to the pin, so the board's long cork hold has a near plane
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, BOARD_CAMS, 40);
    const bx = r.x - 20, by = r.y - 20, bw = BOOKCASE_EDGE - bx + 30, bh = r.h + 40;
    f.cached(`ch01-s04/bookEdge/${env.mood.id}/${Math.round(bx)},${Math.round(by)},${Math.round(bh)}`, Math.ceil(bw), Math.ceil(bh), (cc) => {
      cc.translate(-bx, -by);
      const ink = env.fill('fg');
      cc.fillStyle = ink;
      cc.fillRect(bx, by, BOOKCASE_EDGE - bx, bh);
      // shelf boards proud of the upright, and the ragged tops of the books between them
      for (let y = by + 60, i = 0; y < by + bh; y += 230, i++) {
        cc.fillRect(BOOKCASE_EDGE - 4, y, 22, 18);
        for (let x = BOOKCASE_EDGE - 210, j = 0; x < BOOKCASE_EDGE - 50; j++) {
          const w = 14 + 12 * hash1(i * 40 + j, 71);
          const h = 120 + 70 * hash1(i * 40 + j, 72);
          cc.fillStyle = mixLab(ink, env.mood.set, 0.08 + 0.1 * hash1(i * 40 + j, 73));
          cc.fillRect(x, y - h, w, h);
          x += w + 2;
        }
        cc.fillStyle = ink;
      }
      // the upright's lamp-side edge catches the pool
      cc.fillStyle = withAlpha(env.mood.rim, 0.32);
      cc.fillRect(BOOKCASE_EDGE - 2, by, 2, bh);
    })(c, bx, by);
  });
  // the desk and the banker's lamp in front of the board (near plane): it clicks on, green shade lit
  study01Near(f, { key: 'ch01-s04', cams: BOARD_CAMS, lamp: L, file: false });
  // the establishing medium in the wide's own grammar (ch01-s05/s06): a haze band lying at desk height across the
  // lamp's pool, so the lamp and the desk edge stand as ink against lit air
  {
    const est = 1 - sm((t - (sc.pin - 1.1)) / 0.6);
    if (est > 0.01) {
      const dy = toScreen(LAYERS.L5, cam, BULB01.x, BULB01.y + 30).y;
      f.fog({ yCenter: dy, height: 120, alpha: 0.32 * est * L, drift: 7 });
    }
  }
  // the pool: a DARK corkboard. A tight pool (~280 px) around K, so the card is the brightest shape; outside it
  // the cork sinks to about L* 30 and the corners to near ink. As the camera drifts down after "launched" the
  // pool's centre follows it to the lamp's shade.
  const kc = toScreen(LAYERS.L4, cam, KC.x, KC.y);
  const lpS = toScreen(LAYERS.L5, cam, BULB01.x, BULB01.y);
  const follow = sm((t - sc.launched) / Math.max(0.5, sc.tilt0 - sc.launched));
  const pcx = lerp(kc.x, lerp(kc.x, lpS.x, 0.6), follow), pcy = lerp(kc.y, lerp(kc.y, lpS.y, 0.75), follow);
  // in the establishing medium the pool lies broader and the dark lifts, so the bookcase and the room read as
  // ink against the lamplight; it tightens onto K as the push arrives
  const estab = 1 - sm((t - (sc.pin - 0.95)) / 0.7);
  const ecx = toScreen(LAYERS.L4, cam, STUDY.pool.cx, STUDY.pool.cy + 120);
  const pr = 250 * Math.min(1.35, Math.max(0.8, kc.k)) * (1 + 0.3 * estab);
  {
    const c = f.c;
    const gx = lerp(pcx, ecx.x, estab), gy = lerp(pcy, ecx.y, estab);
    const g = c.createRadialGradient(gx, gy, pr * 0.3, gx, gy, pr * 3.4);
    const ink = f.mood.fg;
    g.addColorStop(0, withAlpha(ink, 0));
    g.addColorStop(0.12, withAlpha(ink, 0.22));
    g.addColorStop(0.24, withAlpha(ink, 0.6));
    g.addColorStop(0.42, withAlpha(ink, 0.8));
    g.addColorStop(0.7, withAlpha(ink, 0.92));
    g.addColorStop(1, withAlpha(ink, 0.97));
    // the dark, with soft holes punched (in the medium only) for the lamp and its desk pool and for the
    // bookcase's amber-backlit bays, so the study reads round the lamp while the cork stays dark
    const lampS = toScreen(LAYERS.L5, cam, BULB01.x, BULB01.y + 40);
    const caseS = toScreen(SHELF_PLANE, cam, -35, 470);
    vignetteWithHoles(f, g, (0.25 + 0.75 * L), estab > 0.01 ? [
      { x: lampS.x, y: lampS.y, rx: 300, ry: 190, k: 0.9 * estab },
      { x: caseS.x, y: caseS.y, rx: 200 * caseS.k, ry: 520 * caseS.k, k: 0.62 * estab },
    ] : []);
    // haze drifting through the pool: soft lit wisps crossing the lamplight (additive, slow, seeded)
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const ph = hash1(i, 91) * 6.28;
      const wx = pcx + Math.cos(ph + t * (0.05 + 0.03 * i)) * pr * 0.7 + (t * (10 + 6 * i)) % (pr * 0.6) - pr * 0.3;
      const wy = pcy + Math.sin(ph * 1.7 + t * 0.07) * pr * 0.35 - 20;
      const rx = pr * (0.7 + 0.4 * hash1(i, 92)), ry = rx * 0.32;
      c.save();
      c.translate(wx, wy);
      c.scale(1, ry / rx);
      const hg = c.createRadialGradient(0, 0, 0, 0, 0, rx);
      hg.addColorStop(0, withAlpha(f.mood.halo, 0.05 * L));
      hg.addColorStop(1, withAlpha(f.mood.halo, 0));
      c.fillStyle = hg;
      c.fillRect(-rx, -rx, 2 * rx, 2 * rx);
      c.restore();
    }
    c.restore();
  }
  // the study resolving out of the dark from the lamp's pool outward (the lamp clicks at `lamp`)
  if (L < 0.999) {
    const c = f.c;
    const pc = toScreen(LAYERS.L4, cam, STUDY.pool.cx + 100, STUDY.pool.cy + 200);
    const r = 140 + 1150 * sm(L);
    const g = c.createRadialGradient(pc.x, pc.y, r * 0.2, pc.x, pc.y, r);
    const ink = f.mood.fg;
    g.addColorStop(0, withAlpha(ink, 0.9 * (1 - L)));
    g.addColorStop(1, withAlpha(ink, Math.min(1, 0.98 * (1 - L) + 0.25 * (1 - sm(L)))));
    c.save();
    c.fillStyle = g;
    c.fillRect(-20, -20, 1320, 760);
    c.restore();
    // the shade's lit lip shows through the dark first: the click
    if (t >= sc.lampAt) {
      const lp = toScreen(LAYERS.L5, cam, LAMP01.x, LAMP01.y - 29.8 * LAMP01.k);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(lp.x, lp.y, 4, lp.x, lp.y, 180);
      gl.addColorStop(0, withAlpha(f.mood.halo, 0.45 * (1 - L) * (t - sc.lampAt < 0.12 ? 0.6 : 1)));
      gl.addColorStop(1, withAlpha(f.mood.halo, 0));
      c.fillStyle = gl;
      c.fillRect(lp.x - 200, lp.y - 200, 400, 400);
      c.restore();
    }
  }
}

/** the board's lamp pool on the cork (board units): tight round K, so the cork outside falls to about L* 25 */
const BOARD_POOL = { cx: K.x, cy: K.y + 30, r: 330, k: 0.85 };
/** cork detail drawn over the board (s04's board is empty but for K): sparse flecks (granules a step lighter
 *  and darker than the cork) and the frame's edges catching the lamp from below: a rim on the bottom rail and a
 *  fainter one down each side, so the board's edge reads against the wall in the establishing medium */
const FLECKS = Array.from({ length: 260 }, (_, i) => ({
  x: (hash1(i, 301) * 0.5 + 0.5) * 1000,
  y: (hash1(i, 302) * 0.5 + 0.5) * 620,
  r: 1.1 + (hash1(i, 303) * 0.5 + 0.5) * 2.2,
  lite: hash1(i, 304) > 0.1,
}));
function corkDetail(c: CanvasRenderingContext2D, env: PaintEnv) {
  const m = env.mood;
  const bx = STUDY.board.x, by = STUDY.board.y;
  for (const F of FLECKS) {
    const d = Math.hypot((F.x - BOARD_POOL.cx) / 1.15, F.y - BOARD_POOL.cy) / (BOARD_POOL.r * 1.3);
    const lit = Math.max(0, 1 - d);
    c.fillStyle = withAlpha(F.lite ? mixLab(m.halo, m.setHaze, 0.4) : m.fg, (F.lite ? 0.1 + 0.28 * lit : 0.22 + 0.2 * lit));
    c.beginPath();
    c.ellipse(bx + F.x, by + F.y, F.r, F.r * 0.75, F.x * 0.01, 0, Math.PI * 2);
    c.fill();
  }
  // the frame's edges lit from below (the lamp stands under the board)
  const W = 1000, H = 620, b = 16;
  c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.3), 0.6);
  c.fillRect(bx - b, by + H + b - 2, W + 2 * b, 2);
  c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.3), 0.35);
  c.fillRect(bx - 1.5, by, 1.5, H);
  c.fillRect(bx + W, by, 1.5, H);
  c.fillRect(bx, by + H, W, 1.2);
}

/** a full-frame dark (fill style `g`, at alpha `A`) with soft elliptical holes (k = how much of the dark the hole
 *  removes at its centre), composed offscreen so the holes never brighten past the scene beneath */
let VIG: HTMLCanvasElement | null = null;
function vignetteWithHoles(f: Frame, g: CanvasGradient, A: number, holes: { x: number; y: number; rx: number; ry: number; k: number }[]) {
  const c = f.c;
  if (!holes.length) {
    c.save();
    c.globalAlpha = A;
    c.fillStyle = g;
    c.fillRect(-20, -20, 1320, 760);
    c.restore();
    return;
  }
  const W = c.canvas.width, H = c.canvas.height;
  if (!VIG || VIG.width !== W || VIG.height !== H) VIG = makeCanvas(W, H);
  const v = VIG.getContext('2d')!;
  v.setTransform(1, 0, 0, 1, 0, 0);
  v.globalCompositeOperation = 'source-over';
  v.clearRect(0, 0, W, H);
  v.setTransform(c.getTransform());
  v.fillStyle = g;
  v.fillRect(-20, -20, 1320, 760);
  v.globalCompositeOperation = 'destination-out';
  for (const h of holes) {
    v.save();
    v.translate(h.x, h.y);
    v.scale(1, h.ry / h.rx);
    const hg = v.createRadialGradient(0, 0, 0, 0, 0, h.rx);
    hg.addColorStop(0, `rgba(0,0,0,${h.k})`);
    hg.addColorStop(0.55, `rgba(0,0,0,${h.k * 0.6})`);
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    v.fillStyle = hg;
    v.fillRect(-h.rx, -h.rx, 2 * h.rx, 2 * h.rx);
    v.restore();
  }
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = A;
  c.drawImage(VIG, 0, 0);
  c.restore();
}

/** the lamp: dark, a click with a filament stutter at `lampAt`, then the pool spreading for ~1.3 s */
function lampLevel(t: number, at: number) {
  if (t < at) return 0.06;
  const k = t - at;
  const stutter = k < 0.12 ? 0.5 : k < 0.18 ? 0.28 : 1;
  return clamp01(0.06 + 0.94 * sm(k / 0.75) * stutter + (k < 0.12 ? 0.18 : 0));
}

// =====================================================================================================
// FILE (top-down on the desk)
/** two closed books, one squared over the other, seen from above at the top-right corner of the desk (L5) */
function deskBooks(c: CanvasRenderingContext2D, env: PaintEnv) {
  const m = env.mood;
  const book = (x: number, y: number, w: number, h: number, rot: number, tone: number) => {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.fillStyle = mixLab(env.fill('ink'), m.set, tone);
    c.beginPath();
    c.roundRect(-w / 2, -h / 2, w, h, 5);
    c.fill();
    // the page block along the lamp-side long edge (a pale band) and the spine's two cut lines
    c.fillStyle = withAlpha(mixLab(m.halo, m.setHaze, 0.5), 0.35);
    c.fillRect(-w / 2 + 6, h / 2 - 9, w - 14, 5);
    c.fillStyle = withAlpha(m.rim, 0.22);
    c.fillRect(-w / 2 + 16, -h / 2 + 4, 1.4, h - 8);
    c.fillRect(-w / 2 + 24, -h / 2 + 4, 1.4, h - 8);
    c.fillStyle = withAlpha(m.rim, 0.45);
    c.fillRect(-w / 2 + 4, -h / 2, w - 8, 1.4);
    c.restore();
  };
  book(1190, 70, 330, 220, 0.12, 0.16);
  book(1175, 40, 300, 200, 0.03, 0.26);
}

// =====================================================================================================
/** the slip (centre x,y), folded once by `fold` (0 flat → 1 LEFT half laid over the right, so the folded slip
 *  sits on the folder's side); edges rim-lit, no shadow. `hl` (per READ word, 0..1) lays a lamp-warm underline
 *  under the word being spoken and warms its letters. */
function slip(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, rot: number, fold: number, light: number, hl?: number[]) {
  const W = SLIP.w, H = SLIP.h;
  const paper = paperTone(env, light);
  const ink = mixLab(env.mood.ink, paper, 0.12);
  const rim = withAlpha(env.mood.rim, 0.55);
  const warm = mixLab(env.mood.core, env.mood.halo, 0.35);
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const text = (left: boolean, alpha = 1) => {
    if (alpha <= 0.01) return;
    c.save();
    c.globalAlpha *= alpha;
    c.beginPath();
    if (left) c.rect(-W / 2, -H / 2, W / 2, H);
    else c.rect(0, -H / 2, W / 2, H);
    c.clip();
    c.fillStyle = ink;
    const font = `400 ${legibleSize(c, slipFont(), SLIP_PX)}px ${FONT.typewriter}`;
    c.font = font;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    QUOTE.forEach((ln, i) => c.fillText(ln, -W / 2 + QUOTE_X[i], -H / 2 + 64 + i * 43));
    // the reading: a lamp-warm underline that travels with the spoken words, and the word's letters warmed
    if (hl) {
      for (let i = 0; i < READ.length; i++) {
        const a = hl[i];
        if (!(a > 0.01)) continue;
        const [, line, idx] = READ[i];
        const words = QUOTE[line].split(' ');
        const pre = words.slice(0, idx).join(' ') + (idx > 0 ? ' ' : '');
        const lead = words[idx].startsWith('“') ? c.measureText('“').width : 0;
        const wtxt = words[idx].replace(/[“”.]/g, '');
        const x0 = -W / 2 + QUOTE_X[line] + c.measureText(pre).width + lead;
        const ww = c.measureText(wtxt).width;
        const by = -H / 2 + 64 + line * 43;
        // a pencil-soft underline in lamp-warm umber, tapered at both ends
        const ul = c.createLinearGradient(x0 - 4, 0, x0 + ww + 4, 0);
        const uc = mixLab(mixLab(warm, env.mood.ink, 0.45), paper, 0.15);
        ul.addColorStop(0, withAlpha(uc, 0));
        ul.addColorStop(0.06, withAlpha(uc, 0.85 * a));
        ul.addColorStop(0.94, withAlpha(uc, 0.85 * a));
        ul.addColorStop(1, withAlpha(uc, 0));
        c.fillStyle = ul;
        c.fillRect(x0 - 4, by + 6, ww + 8, 3);
        c.fillStyle = mixLab(ink, mixLab(warm, env.mood.ink, 0.55), 0.6 * a);
        c.fillText(wtxt, x0, by);
      }
    }
    c.font = font;
    c.globalAlpha *= 0.85;
    c.textAlign = 'right';
    c.fillStyle = ink;
    c.fillText(ATTRIB, W / 2 - 34, H / 2 - 26);
    c.restore();
  };
  const edge = (x0: number, w: number) => {
    c.strokeStyle = rim;
    c.lineWidth = 1;
    c.strokeRect(x0 + 0.5, -H / 2 + 0.5, w - 1, H - 1);
  };
  // the right half stays flat
  c.fillStyle = paper;
  c.fillRect(0, -H / 2, W / 2, H);
  text(false);
  edge(fold < 0.02 ? -W / 2 : 0, W / 2 + (fold < 0.02 ? W / 2 : 0));
  // left half: flat (0) → on edge (0.5) → face down over the right half (1)
  const k = Math.cos(Math.PI * fold);
  if (Math.abs(k) > 0.01) {
    c.save();
    c.scale(k, 1);
    if (k > 0) {
      c.fillStyle = paper;
      c.fillRect(-W / 2, -H / 2, W / 2, H);
      // the type on the rising half fades as it foreshortens (squeezed glyphs read as a glitch, not as paper)
      text(true, clamp01((k - 0.55) / 0.35));
      // the rising half darkens as it turns away from the lamp
      c.fillStyle = withAlpha(env.mood.fg, 0.5 * Math.sin(Math.PI * fold));
      c.fillRect(-W / 2, -H / 2, W / 2, H);
    } else {
      c.fillStyle = mixLab(paper, env.mood.set, 0.2 + 0.25 * Math.sin(Math.PI * fold));
      c.fillRect(-W / 2, -H / 2, W / 2, H);
    }
    edge(-W / 2, W / 2);
    c.restore();
  }
  // the crease: scored before the fold starts (a faint line), then a shade line with a lit lip that deepens as
  // the half turns over; the turning half casts a soft shade on the flat half while it stands up
  if (fold > 0) {
    const up = Math.sin(Math.PI * fold);
    const sg = c.createLinearGradient(0, 0, 60 * up + 1, 0);
    sg.addColorStop(0, withAlpha(env.mood.fg, 0.35 * up));
    sg.addColorStop(1, withAlpha(env.mood.fg, 0));
    c.fillStyle = sg;
    c.fillRect(0, -H / 2, 60 * up + 1, H);
  }
  c.fillStyle = withAlpha(env.mood.fg, 0.12 + 0.5 * Math.min(1, fold * 2));
  c.fillRect(-1, -H / 2, 2, H);
  c.fillStyle = withAlpha(env.mood.rim, 0.3 + 0.4 * Math.min(1, fold * 2));
  c.fillRect(-2.2, -H / 2, 1.2, H);
  c.restore();
}

/** desk grain: long, irregularly spaced figure lines at low contrast (wood, not ruled paper) */
const GRAIN: { y: number; a: number; d1: number; d2: number }[] = (() => {
  const out: { y: number; a: number; d1: number; d2: number }[] = [];
  let y = -160;
  for (let i = 0; y < 1100; i++) {
    out.push({ y, a: 0.06 + 0.08 * hash1(i, 6), d1: (hash1(i, 4) - 0.5) * 34, d2: (hash1(i, 5) - 0.5) * 34 });
    y += 14 + Math.pow(hash1(i, 3), 2) * 46;
  }
  return out;
})();

/** the desk's wood, baked once: long figure lines (wavering, irregular), a lighter ray here and there, two
 *  plank seams and a couple of knots, all at low contrast (wood, not ruled paper) */
function deskGrain(cc: CanvasRenderingContext2D, env: PaintEnv) {
  const m = env.mood;
  cc.translate(300, 300);
  // broad, wavering growth bands (seeded, under 6% contrast): the plank's figure read at a glance
  for (let i = 0, y = -300; y < 1020; i++) {
    const bh = 18 + 46 * hash1(i, 81);
    const dark = i % 2 === 0;
    cc.fillStyle = dark ? withAlpha(m.fg, 0.05 + 0.03 * hash1(i, 82)) : withAlpha(mixLab(m.halo, m.setHaze, 0.5), 0.025 + 0.02 * hash1(i, 83));
    cc.beginPath();
    const ph = hash1(i, 84) * 6.28;
    for (let x = -300; x <= 1580; x += 40) cc.lineTo(x, y + 10 * Math.sin(x * 0.0021 + ph) + 4 * Math.sin(x * 0.009 + ph * 2));
    for (let x = 1580; x >= -300; x -= 40) cc.lineTo(x, y + bh + 10 * Math.sin(x * 0.0021 + ph + 0.4) + 4 * Math.sin(x * 0.009 + ph * 2));
    cc.closePath();
    cc.fill();
    y += bh;
  }
  cc.lineWidth = 1;
  for (const G of GRAIN) {
    cc.strokeStyle = withAlpha(m.fg, G.a);
    cc.beginPath();
    cc.moveTo(-300, G.y);
    cc.bezierCurveTo(300, G.y + G.d1, 900, G.y + G.d2, 1580, G.y + G.d1 * 0.5);
    cc.stroke();
  }
  // fine figure between the main lines
  for (let i = 0, y = -290; y < 1010; i++) {
    const a = 0.025 + 0.05 * hash1(i, 61);
    cc.strokeStyle = hash1(i, 62) > 0.8 ? withAlpha(mixLab(m.halo, m.setHaze, 0.5), a * 0.9) : withAlpha(m.fg, a);
    cc.lineWidth = 0.6 + 0.8 * hash1(i, 63);
    cc.beginPath();
    for (let x = -300; x <= 1580; x += 40) {
      const yy = y + 6 * Math.sin(x * 0.004 + i * 0.7) + 2.2 * fbm(x * 0.01 + i * 3.1, 64);
      if (x === -300) cc.moveTo(x, yy);
      else cc.lineTo(x, yy);
    }
    cc.stroke();
    y += 3 + 9 * hash1(i, 65);
  }
  // three long streaks of figure that break the bands' rhythm: wandering, tapered, a step darker (one a
  // lighter ray), running most of the desk's length at a slight angle
  for (const [sy, dy, w, a, lite] of [[118, 26, 5, 0.16, 0], [388, -34, 3.5, 0.1, 1], [566, 18, 6, 0.14, 0]] as const) {
    cc.strokeStyle = lite ? withAlpha(mixLab(m.halo, m.setHaze, 0.5), a) : withAlpha(m.fg, a);
    cc.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      cc.lineWidth = w * (1 - k * 0.3);
      cc.beginPath();
      cc.moveTo(-260 + k * 90, sy + k * 3);
      cc.bezierCurveTo(260, sy + dy + k * 2, 820, sy - dy * 0.6, 1480 - k * 140, sy + dy * 0.8 + k * 2);
      cc.stroke();
    }
  }
  // two plank seams
  for (const sy of [-120, 640]) {
    cc.fillStyle = withAlpha(m.fg, 0.32);
    cc.fillRect(-300, sy, 1880, 2);
    cc.fillStyle = withAlpha(m.rim, 0.08);
    cc.fillRect(-300, sy + 2, 1880, 1);
  }
  // knots: tight elliptical rings the figure lines bend around
  for (const [kx, ky, kr] of [[180, 520, 16], [1240, 120, 12], [760, 820, 10]] as const) {
    for (let r = 0; r < 5; r++) {
      cc.strokeStyle = withAlpha(m.fg, 0.14 - r * 0.02);
      cc.lineWidth = 1;
      cc.beginPath();
      cc.ellipse(kx, ky, kr * (1 + r * 0.9) * 2.4, kr * (1 + r * 0.9) * 0.55, 0, 0, Math.PI * 2);
      cc.stroke();
    }
  }
}

/** a top-down desk with the manila folder (no drop shadows) */
function desk(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, pool: number) {
  const m = env.mood;
  c.fillStyle = mixLab(m.set, m.fg, 0.35);
  c.fillRect(-300, -300, 1880, 1320);
  const g = c.createRadialGradient(400, 300, 30, 400, 300, 700);
  g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.5), 0.95 * pool));
  g.addColorStop(0.55, withAlpha(mixLab(m.set, m.halo, 0.2), 0.55 * pool));
  g.addColorStop(1, withAlpha(m.set, 0));
  c.fillStyle = g;
  c.fillRect(-300, -300, 1880, 1320);
  f.cached(`ch01-s04/deskGrain3/${m.id}`, 1880, 1320, (cc) => deskGrain(cc, env))(c, -300, -300);
  const F = FOLDER;
  // the folder's soft contact shadow on the wood (the lamp is up and to the left: it falls down-right)
  contactShadow(f, c, env, F.x + 10, F.y + 12, F.w + 6, F.h + 30, 0, 0.55);
  // manila card at about L* 55 (the slip's paper is the brighter object): the BACK panel with its tab
  c.fillStyle = MANILA_BACK(m);
  c.fillRect(F.x - F.w / 2, F.y - F.h / 2, F.w, F.h);
  c.fillRect(F.x - F.w / 2 + 30, F.y - F.h / 2 - 22, 110, 24);
  // the card stock takes the lamp from the upper left and falls away toward its far corner; a pressed score
  // line near the spine
  const fg = c.createLinearGradient(F.x - F.w / 2, F.y - F.h / 2, F.x + F.w / 2, F.y + F.h / 2);
  fg.addColorStop(0, withAlpha(m.halo, 0.06));
  fg.addColorStop(0.5, withAlpha(m.fg, 0));
  fg.addColorStop(1, withAlpha(m.fg, 0.22));
  c.fillStyle = fg;
  c.fillRect(F.x - F.w / 2, F.y - F.h / 2, F.w, F.h);
  c.fillStyle = withAlpha(m.fg, 0.12);
  c.fillRect(F.x - F.w / 2, F.y - F.h / 2 + 14, F.w, 1.2);
  c.fillStyle = withAlpha(m.rim, 0.4);
  c.fillRect(F.x - F.w / 2, F.y - F.h / 2, F.w, 1);
  c.fillRect(F.x - F.w / 2 + 30, F.y - F.h / 2 - 22, 110, 1);
}
/** a soft contact shadow: a blurred dark card under a paper object (centre x,y, size w×h, rotation) */
function contactShadow(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, w: number, h: number, rot: number, a: number) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.filter = `blur(${(9 * f.pxScale).toFixed(1)}px)`;
  c.fillStyle = withAlpha(env.mood.fg, a);
  c.fillRect(-w / 2, -h / 2, w, h);
  c.filter = 'blur(0px)';
  c.fillStyle = withAlpha(env.mood.fg, a * 0.5);
  c.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
  c.restore();
}

/** a fountain pen lying across the near edge of the desk (L6: blurred by the layer), ink with a rim of lamplight */
function deskPen(c: CanvasRenderingContext2D, env: PaintEnv) {
  const m = env.mood;
  c.save();
  c.translate(300, 694);
  c.rotate(-0.13);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.roundRect(-250, -13, 400, 26, 13);
  c.fill();
  // the cap band and clip, the tapered section and nib
  c.fillStyle = mixLab(env.fill('ink'), m.set, 0.25);
  c.fillRect(-90, -13, 10, 26);
  c.fillRect(-240, -16, 120, 5);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(150, -10);
  c.lineTo(205, -4);
  c.lineTo(232, 0);
  c.lineTo(205, 4);
  c.lineTo(150, 10);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.55);
  c.fillRect(-244, -13, 392, 2);
  c.fillRect(152, -9, 52, 1.5);
  c.restore();
}

/** manila tones (about L* 50-55 under the pool): the back panel a step darker than the front flap */
const MANILA = (m: PaintEnv['mood']) => mixLab(m.halo, '#b08a52', 0.35);
const MANILA_BACK = (m: PaintEnv['mood']) => mixLab(MANILA(m), m.set, 0.52);
const MANILA_FRONT = (m: PaintEnv['mood']) => mixLab(MANILA(m), m.set, 0.4);
/** the front flap's top edge sits this far below the back panel's (so the folder reads as two leaves) */
const FLAP_DROP = 24;
/** the folder's front flap (hinged along the bottom; `open` lifts it toward the camera, foreshortening it): a
 *  leaf a little shorter than the back, its top edge cut by a shadow line on the back and a rim of lamplight */
function flap(c: CanvasRenderingContext2D, env: PaintEnv, open: number) {
  const F = FOLDER;
  const fh = (F.h - FLAP_DROP) * Math.cos((Math.PI / 2) * clamp01(open) * 1.05);
  if (fh <= 2) return;
  const top = F.y + F.h / 2 - fh;
  // the flap's shadow on the back leaf just above its edge
  c.fillStyle = withAlpha(env.mood.fg, 0.4 * (1 - 0.6 * clamp01(open)));
  c.fillRect(F.x - F.w / 2, top - 4, F.w, 4);
  c.fillStyle = mixLab(MANILA_FRONT(env.mood), env.mood.fg, 0.35 * clamp01(open));
  c.fillRect(F.x - F.w / 2, top, F.w, fh);
  // a thumb notch at the flap's centre and the lit top edge
  c.fillStyle = MANILA_BACK(env.mood);
  c.beginPath();
  c.ellipse(F.x, top, 26, 9, 0, 0, Math.PI);
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.55);
  c.fillRect(F.x - F.w / 2, top, F.w / 2 - 26, 1.4);
  c.fillRect(F.x + 26, top, F.w / 2 - 26, 1.4);
}

/** x of a word's centre on the slip at rest (layer px) */
function wordX(c: CanvasRenderingContext2D, line: number, idx: number) {
  c.save();
  c.font = slipFont();
  const words = QUOTE[line].split(' ');
  const pre = words.slice(0, idx).join(' ') + (idx > 0 ? ' ' : '');
  const x0 = SLIP_REST.x - SLIP.w / 2 + QUOTE_X[line] + c.measureText(pre).width;
  const w = c.measureText(words[idx].replace(/[“”.]/g, '')).width;
  c.restore();
  return x0 + w / 2 + (words[idx].startsWith('“') ? 8 : 0);
}

function paintFile(f: Frame, sc: SC, t: number) {
  // a clean cut in (the drift down to the desk carried the move): the plate starts settled
  const yOff = 0;
  const read = sm((t - sc.slipAt - 0.6) / (sc.readEnd - sc.slipAt));
  const toFolder = sm((t - (sc.putAt - 0.4)) / 1.4);
  const cam: Camera3 = {
    x: lerp(lerp(640, 600, read), 760, toFolder),
    y: 360 - yOff + lerp(0, 14, read),
    z: lerp(lerp(0, 70, read), 50, toFolder),
    lens: 1,
  };
  f.camera(cam);
  f.backlight({ sunX: 500, sunY: 300, sunRadius: 500, intensity: 0.3 });
  const flick = 1 + 0.05 * fbm(t * 2.2, 41) + 0.02 * fbm(t * 9, 43);

  // -------- the action's clock (on twos)
  const tq = q2(t);
  const slideS = sc.slipAt - 0.25, slideE = sc.slipAt + 0.9; // in the lamp's pool by ~9.6 s
  const openS = sc.putAt - 0.5, openE = sc.putAt - 0.1; // the left hand lifts the flap
  const foldS = sc.inAt - 0.62, foldE = sc.inAt - 0.05; // folded by "in the" (a readable fold: ~0.6 s)
  const carryE = sc.caseAt; // dropped into the folder on "case"
  const shutS = sc.fileAt - 0.25, shutE = sc.fileAt; // the flap closes, ending on "file"
  // two separate index-finger taps 0.25 s apart (on twos), after the left hand has left the frame
  const taps = [sc.fileAt + 0.38, sc.fileAt + 0.63];
  const LIFT = 0.17;

  const slideU = sm((tq - slideS) / (slideE - slideS));
  const foldU = sm((tq - foldS) / (foldE - foldS));
  const carryU = sm((tq - foldE) / (carryE - foldE));
  // the slip slides straight up from below frame into the pool, left of the folder (never under it)
  let sx = lerp(SLIP_REST.x + 30, SLIP_REST.x, slideU), sy = lerp(SLIP_REST.y + 470, SLIP_REST.y, slideU);
  let rot = lerp(0.07, -0.012, slideU);
  const dropAt = { x: FOLDER.x + 4, y: FOLDER.y + 10 };
  // folded left over right, the packet's centre is sx + W/4
  sx = lerp(sx, dropAt.x - SLIP.w / 4, carryU);
  sy = lerp(sy, dropAt.y, carryU);
  rot = lerp(rot, 0.02, carryU);
  const filed = tq >= carryE;
  // the folder lies open (its flap standing up, seen edge-on) from the cut; the left hand tips the flap over at
  // shutS and it falls shut, accelerating, on "file"
  void openS;
  void openE;
  const fallU = clamp01((tq - shutS) / (shutE - shutS));
  const open = tq < shutS ? 1 : 1 - (0.25 * fallU + 0.75 * fallU * fallU);
  // the reading: one warm underline per spoken word, easing in on its first syllable and fading after it;
  // the three words that carry the flaw ("plausible-sounding", "incorrect", "nonsensical") keep a trace
  const KEEP = new Set(['plausible-sounding', 'incorrect', 'nonsensical']);
  const hl = READ.map(([w], i) => {
    const [s0, s1] = sc.read[i];
    const on = sm((t - s0 + 0.06) / 0.14);
    const off = sm((t - s1 - 0.1) / 0.5);
    const keep = KEEP.has(w) ? 0.45 : 0;
    const fade = 1 - sm((t - sc.putAt + 0.2) / 0.4);
    return on * (1 - off * (1 - keep)) * fade;
  });

  f.layer('L4', (c, env) => {
    desk(f, c, env, flick);
    if (!filed) flap(c, env, open);
    if (tq >= slideS) {
      const light = 0.55 + 0.45 * slideU;
      // the slip's soft contact shadow (wider and fainter while it is lifted and carried)
      if (!filed) {
        const lift = Math.sin(Math.PI * carryU) + 0.6 * Math.sin(Math.PI * foldU);
        const fw = SLIP.w * (1 - 0.5 * foldU);
        contactShadow(f, c, env, sx + (SLIP.w / 4) * foldU + 8 + 14 * lift, sy + 10 + 18 * lift, fw + 6, SLIP.h + 6, rot, 0.5 * (1 - 0.4 * lift));
      }
      if (filed) {
        c.save();
        c.beginPath();
        c.rect(FOLDER.x - FOLDER.w / 2, FOLDER.y - FOLDER.h / 2, FOLDER.w, FOLDER.h);
        c.clip();
        slip(c, env, sx, sy, rot, 1, light);
        c.restore();
      } else slip(c, env, sx, sy, rot, foldU, light, hl);
    }
    if (filed) flap(c, env, open);

    // -------- the hands (short forearms from the lower edge, fixed angles)
    const arms: Arm[] = [];
    const LAMP_DIR = { x: -0.6, y: -0.8 };
    const R = (sock: Pt, shape: HandShape01, lift = 0, bend = 0.1, dir = DIR_R) => arms.push({ wrist: wristAt(sock, dir, shape, HAND_F, 'R', bend), dir, shape, side: 'R', len: HAND_F, bend, lift, light: LAMP_DIR });
    const Lh = (sock: Pt, shape: HandShape01, bend = 0.2) => arms.push({ wrist: wristAt(sock, DIR_L, shape, HAND_F, 'L', bend), dir: DIR_L, shape, side: 'L', len: HAND_F, bend, light: LAMP_DIR });
    const awayR = (p: Pt, d: number): Pt => ({ x: p.x - Math.cos(DIR_R) * d, y: p.y - Math.sin(DIR_R) * d });
    const awayL = (p: Pt, d: number): Pt => ({ x: p.x - Math.cos(DIR_L) * d, y: p.y - Math.sin(DIR_L) * d });
    const edgeR = { x: sx + SLIP.w / 2 - 16, y: sy + 40 };
    if (tq >= slideS - 0.3 && tq < slideE + 0.6) {
      // fingertips push the slip's right edge into the light, then withdraw
      const inU = sm((tq - (slideS - 0.3)) / 0.3);
      const outU = sm((tq - slideE - 0.05) / 0.5);
      R(lerpP(lerpP(awayR(edgeR, 500), edgeR, inU), awayR(edgeR, 620), outU), 'flat');
    }
    // the index finger follows the reading from BENEATH the slip's lower edge (never over the words)
    const rS = sc.readStart - 0.35, rE = sc.readEnd + 0.15;
    if (tq >= rS && tq < rE + 0.45) {
      const under = SLIP_REST.y + SLIP.h / 2 + 7;
      let wx = wordX(c, READ[0][1], READ[0][2]);
      for (let i = 0; i < READ.length; i++) {
        const [s0] = sc.read[i];
        const x = wordX(c, READ[i][1], READ[i][2]);
        if (tq >= s0 - 0.05) {
          const prev = i > 0 ? wordX(c, READ[i - 1][1], READ[i - 1][2]) : x;
          wx = lerp(prev, x, sm((tq - s0 + 0.05) / 0.25));
        }
      }
      const tip = { x: wx, y: under };
      const inU = sm((tq - rS) / 0.35);
      const outU = sm((tq - rE) / 0.45);
      R(lerpP(lerpP(awayR(tip, 420), tip, inU), awayR(tip, 560), outU), 'press', 0, 0.05);
    }
    if (tq >= foldS - 0.3 && tq < carryE + 0.1) {
      // the right hand takes the slip's right edge, folds it over, carries it to the folder by the fold
      const reachU = sm((tq - (foldS - 0.3)) / 0.3);
      let p: Pt;
      // reaching across to the slip's LEFT edge, laying the left half over the right, then carrying it by the fold
      const ex = (SLIP.w / 2 - 16) * Math.cos(Math.PI * foldU);
      const edgeLft = { x: sx - SLIP.w / 2 + 16, y: sy + 40 };
      // after the fold it carries the packet by its LOWER edge (its centre), the forearm swinging upright from
      // the bottom of frame, so the arm stays below the folder and never crosses its face
      const carryGrip = { x: sx + SLIP.w / 4, y: sy + SLIP.h / 2 - 14 };
      const sw = sm((tq - foldE) / 0.17);
      if (tq < foldS) p = lerpP(awayR(edgeLft, 420), edgeLft, reachU);
      else if (tq < foldE) p = { x: sx - ex, y: sy + 40 - 50 * Math.sin(Math.PI * foldU) };
      else p = lerpP({ x: sx + SLIP.w / 2 - 24, y: sy + 40 }, carryGrip, sw);
      // the forearm rights itself through the fold, so it never lies across the folder's corner
      const dir = lerp(DIR_R, DIR_R2, tq < foldE ? foldU : 1);
      R(p, tq >= carryE ? 'open' : 'pinch', 0, tq < foldE ? 0.1 : 0.2, dir);
    } else if (tq >= carryE + 0.1) {
      // to the closed flap: the index finger out, two separate taps (lift, strike; on twos), then the hand
      // settles flat on the file to the cut
      // the taps land on the folder's lower margin, the forearm upright below it (never across the folder)
      const rest = { x: FOLDER.x + 30, y: FOLDER.y + FOLDER.h / 2 - 22 };
      const toU = sm((tq - carryE - 0.1) / (taps[0] - LIFT - carryE - 0.1));
      const from = { x: sx + SLIP.w / 4, y: sy + SLIP.h / 2 - 14 };
      const lifted = taps.some((tt) => tq >= tt - LIFT && tq < tt) ? 1 : 0;
      const p = lerpP(from, rest, toU);
      const tapping = tq < taps[1] + 2 / 12;
      R({ x: p.x, y: p.y + 16 * lifted }, tapping ? 'press' : 'flat', lifted, 0.22, DIR_R2);
    }
    // the left hand: rises from the bottom edge to the flap standing open at the folder's lower edge, tips it
    // over, lets go while the flap edge is still in the folder's lower part, and withdraws straight down; the
    // flap falls shut on "file" by itself (the hand never reaches over the folder's face)
    if (tq >= shutS - 0.55 && tq < shutE + 0.25) {
      // the flap stands open, edge-on along the folder's lower edge: the fingertips come up to that edge from
      // below and push it over; the hand stays below the folder the whole time
      const F = FOLDER;
      const REACH = 0.55 * HAND_F; // palm socket -> fingertips
      const grip = { x: F.x - 70, y: F.y + F.h / 2 + 4 + REACH };
      const inU = sm((tq - (shutS - 0.55)) / 0.4);
      const push = sm((tq - (shutS - 0.12)) / 0.12);
      const outU = sm((tq - (shutS + 0.06)) / 0.3);
      const from = { x: grip.x - 30, y: grip.y + 420 };
      const p = lerpP(lerpP(from, { x: grip.x, y: grip.y - 10 * push }, inU), { x: grip.x - 20, y: grip.y + 460 }, outU);
      Lh(p, 'flat');
    }
    for (const a of arms) drawArm(c, env, a);
  });
  f.rim({ x: -0.6, y: -0.8 });
  // the lamp's warm pool from the upper left (the lamp stands at the edge of frame), breathing with its flicker
  f.layer('L5', (c, env) => {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(250, 200, 30, 330, 240, 780);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.17 * flick));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(-400, -500, 1600, 1500);
    c.restore();
    // a stack of closed case books at the top-right corner (between the desk and the lamp in height: its own
    // plane, so the top-down camera's drift shows three planes sliding: desk, books, lamp shade)
    deskBooks(c, env);
  });
  // the banker's lamp seen from above at the top-left corner, recognisable: the long half-cylinder of green
  // glass (dark at its crown's edges, lighter toward the open lip, a soft highlight along the curve), its rolled
  // ends, the brass arm running out past the frame, and the lip glowing from inside with the bulb's spill on
  // the desk beneath; the nearest plane of all (L6, soft): a lamp-head occluder at the corner
  f.layer('L6', (c, env) => {
    const m = env.mood;
    const G = shadeGreen(env, 1);
    const ink = env.fill('ink');
    c.save();
    c.translate(LAMP_TOP.x, LAMP_TOP.y);
    c.rotate(-0.32);
    // the bulb's light spilling out from under the lip onto the desk
    c.save();
    c.globalCompositeOperation = 'lighter';
    const ug = c.createRadialGradient(0, 44, 6, 0, 60, 210);
    ug.addColorStop(0, withAlpha(m.core, 0.5));
    ug.addColorStop(0.3, withAlpha(m.halo, 0.28));
    ug.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = ug;
    c.fillRect(-230, -120, 460, 380);
    c.restore();
    // the brass arm (ink with a lit edge), out past the frame's top-left edge
    c.strokeStyle = ink;
    c.lineCap = 'round';
    c.lineWidth = 12;
    c.beginPath();
    c.moveTo(0, 6);
    c.lineTo(-270, -170);
    c.stroke();
    c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.45);
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(4, 2);
    c.lineTo(-262, -172);
    c.stroke();
    // the shade: green glass, a half-cylinder seen from above (the gradient runs across its width: dark crown
    // edge at the back, the curve catching a highlight, lighter glass toward the lip)
    const shade = new Path2D();
    shade.roundRect(-152, -46, 304, 88, 30);
    const sg = c.createLinearGradient(0, -46, 0, 42);
    sg.addColorStop(0, mixLab(G.dark, ink, 0.35));
    sg.addColorStop(0.35, G.dark);
    sg.addColorStop(0.55, mixLab(G.dark, G.lip, 0.55));
    sg.addColorStop(0.8, mixLab(G.dark, G.lip, 0.35));
    sg.addColorStop(1, G.lip);
    c.fillStyle = sg;
    c.fill(shade);
    // the rolled ends (darker caps) and a soft highlight running along the curve
    c.fillStyle = withAlpha(ink, 0.55);
    c.beginPath();
    c.roundRect(-152, -46, 26, 88, [30, 0, 0, 30]);
    c.roundRect(126, -46, 26, 88, [0, 30, 30, 0]);
    c.fill();
    c.fillStyle = withAlpha(mixLab(G.lip, m.rim, 0.5), 0.35);
    c.fillRect(-120, -8, 240, 3);
    // the finial at the crown and the shade's crisp outline
    c.fillStyle = ink;
    c.beginPath();
    c.ellipse(0, -2, 9, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(ink, 0.9);
    c.lineWidth = 2;
    c.stroke(shade);
    // the lip lit from inside along the open edge
    c.fillStyle = withAlpha(mixLab(m.core, m.halo, 0.35), 0.95);
    c.beginPath();
    c.roundRect(-140, 38, 280, 6, 3);
    c.fill();
    c.save();
    c.globalCompositeOperation = 'lighter';
    const lg = c.createLinearGradient(0, 30, 0, 64);
    lg.addColorStop(0, withAlpha(m.core, 0.35));
    lg.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = lg;
    c.fillRect(-150, 38, 300, 26);
    c.restore();
    c.restore();
  });
  // a fountain pen lying across the desk's near edge, bottom left: the nearest plane (L6, soft), so the
  // top-down drift shows three planes sliding (desk, books + lamp, pen)
  f.layer('L6', (c, env) => deskPen(c, env));
  // the desk's near edge along the bottom of frame (L5, blurred): a dark lip with the lamp catching its top
  f.layer('L5', (c, env) => {
    const ink = mixLab(env.fill('ink'), env.mood.fg, 0.4);
    c.fillStyle = ink;
    c.fillRect(-500, 676, 2400, 400);
    const g = c.createLinearGradient(0, 660, 0, 690);
    g.addColorStop(0, withAlpha(ink, 0));
    g.addColorStop(1, withAlpha(ink, 0.9));
    c.fillStyle = g;
    c.fillRect(-500, 660, 2400, 16);
    c.fillStyle = withAlpha(env.mood.rim, 0.22);
    c.fillRect(-500, 676, 2400, 1.5);
  });
  // the pool falls off hard into ink toward the frame's edges
  const c = f.c;
  c.save();
  const vc = toScreen(LAYERS.L4, cam, lerp(SLIP_REST.x + 60, FOLDER.x - 40, toFolder), SLIP_REST.y + 20);
  // (as tight as the board's pool: the corners sink below L* 15, so both plates read as lit by the one lamp)
  const vg = c.createRadialGradient(vc.x, vc.y, 120, vc.x, vc.y, 720);
  vg.addColorStop(0, withAlpha(f.mood.fg, 0));
  vg.addColorStop(0.36, withAlpha(f.mood.fg, 0.14));
  vg.addColorStop(0.56, withAlpha(f.mood.fg, 0.72));
  vg.addColorStop(0.78, withAlpha(f.mood.fg, 0.95));
  vg.addColorStop(1, withAlpha(f.mood.fg, 0.99));
  c.fillStyle = vg;
  c.fillRect(-20, -20, 1320, 760);
  c.restore();
}
