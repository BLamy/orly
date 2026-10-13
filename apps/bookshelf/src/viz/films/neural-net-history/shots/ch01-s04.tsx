/**
 * ch01-s04 — the case opens: the lamp clicks on in the detective's study; the hands pin the case card
 * WHO TAUGHT IT? at the centre of the board, then slide the makers' own admission of a flaw into the
 * lamplight and file it (candleAmber, 19.25 s, lampChange in from the frozen earth).
 *
 * The study is the one geography of sets/study.ts (shared with ch01-s05's full wide): the left bookcase
 * flanking the Case Board, the Wall of Forecasts in the dark to the board's right, the empty candle shelf
 * below, and the green-shaded banker's lamp on the desk in front, under its own pool (sets/ch01-s04-nearDesk),
 * the manila file lying beside it and the case books at the desk's far end.
 *
 * DARK (0 → `lamp`): not black: a 3–5 % ambient ghost of the room (the lamp's silhouette and the desk edge
 *   against a faint wash of window light) so the click reads as a lamp switching on in a room.
 * BOARD (`lamp` → ~8.5 s): the lamp clicks on: its lip and pool are the brightest values; the bookcase stands as
 *   ink against an amber backlight; a dado rail and panelling under the board. A PIN INSERT: the camera pushes
 *   in to slot K (the board's lit top rail, the oxblood question thread glinting where K's pool reaches it, the
 *   pin-hole grid of the BOARD MAP columns, the left edge of the board in frame) as one cuffed hand rises holding
 *   the card; it is pressed onto its brass pin exactly on "taught". The camera eases back to a medium (both board
 *   edges, K ≥ 28 px), and on "ChatGPT" begins one slow drift down and right past the board's foot to the desk:
 *   by "late" the lamp, the manila file and the case books are established; a blurred book stack (L6) slides up
 *   through the bottom-left corner, so four planes move against each other. Dust turns in the lamplight.
 * FILE (cut ~8.46 s, top-down on the desk): on "admitted" a hand pushes a typed slip into the lamp's pool: the
 *   launch post's sentence and its date, exactly as L0108 reads it. A slow push in while it is read; the index
 *   finger follows the reading from BENEATH the slip's lower edge (never over the words). On "that" the right
 *   hand hinges the slip's RIGHT half over its crease (three drawings on twos, the back one step darker), takes
 *   the folded slip by its crease and drops it into the folder on "case"; the left hand tips the flap shut on
 *   "file"; the right hand taps the folder twice and rests on it to the cut. The banker's lamp's green shade and
 *   lit lip sit at the top-left edge of frame, the case books' spines at the top right.
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, MOODS, defineShot, dustMotes, fbm, legibleSize, makeCanvas, mixLab, overscan, toScreen, withAlpha } from '../../../film';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { STUDY, slotWorld, studyCase, studyRoom } from '../sets/study';
import { BOARD, Q_SLOTS, SLOTS, wallStateAt } from '../sets/studyState';
import { paperTone } from '../sets/caseBoard';
import { hash1 } from '../../../film/silhouette/atmosphere';
import { BULB01, DESK01, LAMP01, SHELF_PLANE, shadeGreen, study01Near, study01Shelves } from '../sets/ch01-s04-nearDesk';
import { armDir, drawArm, wristAt, type Arm, type HandShape01, type Pt } from '../sets/ch01-s04-hands';
import { ch01Card } from '../sets/ch01-s04-cards';

// ---------------------------------------------------------------- cameras
const KP = slotWorld('K', 'centre');
/** the establishing medium (a tighter s05 wide): the lamp low in frame, its lit lip at (640, 497), exactly where
 *  ch01-s03's home window sat, so the lampChange carries that last cyan point into the switch-on; the board
 *  fills the upper half, the bookcase at frame left */
const OPEN: Camera3 = { x: 725, y: 635, z: -420, lens: 1 };
/** the pin insert: K a little right of and below centre, so the board's lit top rail (≈ y 42) and the oxblood
 *  thread (≈ y 112) cross the top of frame above K's pool and the board's left edge stands in frame (≈ x 48) */
const INSERT: Camera3 = { x: KP.x - 80, y: KP.y - 90, z: 290, lens: 1 };
/** the medium after the pin: K centred and ≥ 28 px; both side edges and the top rail of the board in frame */
const MED: Camera3 = { x: 655, y: 302, z: 150, lens: 1 };
/** the drift's end: down and right past the board's foot to the desk: the lamp at the left third, the manila
 *  file right of it, the ends of the case books at the right edge, the dado and the candle shelf behind */
const LOW: Camera3 = { x: 1040, y: 800, z: -150, lens: 1 };
const LOW2: Camera3 = { x: 1060, y: 806, z: -128, lens: 1 };
const BOARD_CAMS = [OPEN, { ...OPEN, z: OPEN.z + 40 }, INSERT, MED, LOW, LOW2];
/** the near bookcase's lamp-side edge (L5 world): ~70 px in from frame left in the establishing medium, so the
 *  study's own amber-backlit bookcase reads beside it; it slides out past the lens on the push */
const BOOKCASE_EDGE = -168;

/** the cut's marks, anchored on `slip` ("admitted"): the board's drift down to the desk (from "ChatGPT") ends on
 *  a clean CUT to the top-down FILE plate just before the slip enters (no wipe, no black) */
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
/** the banker's lamp seen from above (L5 world, blurred): its green shade and lit lip in the top-left corner of
 *  the FILE plate, the nearest thing to the lens up there; it slides out as the camera pushes toward the folder */
const LAMP_TOP = { x: 96, y: 90 };
/** forearm angles on the FILE plate, all from the lower right and leaning (30–50° off the vertical) so the wrist
 *  and the shirt cuff stay in frame whenever a hand is at work: the push, the reading finger, the fold, the taps */
const DIR_PUSH = armDir(-45);
const DIR_READ = armDir(-50);
const DIR_FOLD = armDir(-35);
const DIR_TAP = armDir(-50);
/** the left hand: from the lower left, low and leaning (65°), so its cuff is in frame at the flap */
const DIR_L = armDir(62);

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

/** the drift down to the desk: from "ChatGPT", 2.6 s (≈ 96 % there on "late"); then a slow creep in to the cut */
const DRIFT = 2.6;
/** the board camera as a pure function of time */
function boardCam(t: number, B: { pin: number; chatAt: number; mid: number }): Camera3 {
  // the medium holds (a slow creep in) while the study resolves round the lamp, then the push to slot K
  const inS = B.pin - 0.95, inE = B.pin - 0.1;
  const outS = B.pin + 0.55, outE = B.chatAt - 0.02;
  const o2 = { ...OPEN, z: OPEN.z + 40 };
  if (t < inS) return lerpCam(OPEN, o2, clamp01(t / inS));
  if (t < inE) return lerpCam(o2, INSERT, smr((t - inS) / (inE - inS)));
  const i2 = { ...INSERT, z: INSERT.z + 10 };
  if (t < outS) return lerpCam(INSERT, i2, (t - inE) / (outS - inE));
  if (t < outE) return lerpCam(i2, MED, smr((t - outS) / (outE - outS)));
  // from "ChatGPT": ONE slow ease down and right past the board's foot to the lamp, the file and the books
  const dE = B.chatAt + DRIFT;
  if (t < dE) return lerpCam(MED, LOW, smr((t - B.chatAt) / DRIFT));
  return lerpCam(LOW, LOW2, clamp01((t - dE) / Math.max(0.5, B.mid - dE)));
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
      chatAt: T.word('L0107', 'Chat'),
      thatAt: T.word('L0109', 'that'),
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
  chatAt: number;
  thatAt: number;
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
  // the establishing medium's weight (1 until the push to K begins)
  const estab = 1 - sm((t - (sc.pin - 0.95)) / 0.7);
  // the drift down to the desk (0 → 1 from "ChatGPT")
  const follow = smr((t - sc.chatAt) / DRIFT);
  studyRoom(f, { key: 'ch01-s04', cams: BOARD_CAMS, outside: { mood: 'winterBlue', kind: 'city', city: 0.3 } });
  // the bookcase as ink against an amber backlight: the band above each row of book tops raised (glow)
  study01Shelves(f, { key: 'ch01-s04', cams: BOARD_CAMS, lamp: 0.25 + 0.75 * L, glow: 1 });
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
    board: { hide: ['K'], pinHoles: false, pool: BOARD_POOL },
    wall: { slips: WALL_SLIPS, hide: WALL_HIDE },
    extra: (c, env) => {
      wallPanelling(c, env);
      corkDetail(c, env);
      // the hand works from behind the card: its fingertips behind the edge it holds, never over the type
      if (sock) {
        const arm: Arm = { wrist: wristAt(sock, PIN_DIR, shape, HAND_L4, 'R', 0.12), dir: PIN_DIR, shape, side: 'R', len: HAND_L4, bend: 0.12, light: { x: 0.25, y: 1 }, detail: 0.7 };
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
  // dust turning in the lamp's pool, a plane just in front of the board
  if (L > 0.05) {
    f.layer(DUST_PLANE, (c, env) => {
      dustMotes(c, { area: { x: 260, y: 40, w: 820, h: 1000 }, count: 120, drift: { x: 3, y: -2.5 }, size: 1.15, brightness: 0.75 * L, color: mixLab(env.mood.core, env.mood.halo, 0.4), salt: 404 }, env);
    });
  }
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
  // before the click: the ghost of the room. A faint wash of window light on the wall behind the lamp, so the
  // lamp's silhouette and the desk's edge stand dark against it (≈ 4 % after the dark below), never pure black
  const ghost = 1 - sm((t - sc.lampAt) / 0.5);
  if (ghost > 0.01) {
    const c = f.c;
    const gp = toScreen(LAYERS.L5, cam, BULB01.x, BULB01.y - 60);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(gp.x, gp.y);
    c.scale(1, 0.62);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 460);
    const cool = mixLab(f.mood.haze, '#93a6b8', 0.5);
    g.addColorStop(0, withAlpha(cool, 0.9 * ghost));
    g.addColorStop(0.5, withAlpha(cool, 0.4 * ghost));
    g.addColorStop(1, withAlpha(cool, 0));
    c.fillStyle = g;
    c.fillRect(-460, -460, 920, 920);
    c.restore();
  }
  // the desk and the banker's lamp in front of the board (near plane): it clicks on, green shade lit
  study01Near(f, { key: 'ch01-s04', cams: BOARD_CAMS, lamp: L, file: false });
  // the manila file waiting beside the lamp (open, empty: the slip has not been filed yet)
  f.layer('L5', (c, env) => deskFile(c, env));
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
  // the cork sinks to about L* 30 and the corners to near ink. On the drift the pool slides from K to the desk's
  // own pool between the lamp and the file, and widens.
  const kc = toScreen(LAYERS.L4, cam, KC.x, KC.y);
  const dp = toScreen(LAYERS.L5, cam, LAMP01.x + 420, DESK01.back - 30);
  const pcx = lerp(kc.x, dp.x, follow), pcy = lerp(kc.y, dp.y, follow);
  const ecx = toScreen(LAYERS.L4, cam, STUDY.pool.cx, STUDY.pool.cy + 120);
  const pr = lerp(250 * Math.min(1.35, Math.max(0.8, kc.k)), 430, follow) * (1 + 0.3 * estab);
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
      { x: lampS.x, y: lampS.y, rx: 320, ry: 200, k: 0.92 * estab },
      { x: caseS.x, y: caseS.y, rx: 210 * caseS.k, ry: 560 * caseS.k, k: 0.85 * estab },
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
  // the board's structure catching the lamp (over the dark: lit edges hold their light): the top rail's lip,
  // both side edges, and the oxblood question thread glinting where K's pool reaches it
  boardEdges(f, cam, L * (1 - 0.85 * follow));
  // the lamp is the brightest thing in the room: its lit lip and the pool it throws on the desk
  if (L > 0.05) {
    const c = f.c;
    const lp = toScreen(LAYERS.L5, cam, LAMP01.x, LAMP01.y - 29.8 * LAMP01.k);
    const dk = toScreen(LAYERS.L5, cam, LAMP01.x + 40, DESK01.back + 6);
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const [x, y, rx, ry, a] of [[lp.x, lp.y + 2, 150 * lp.k, 22 * lp.k, 0.5], [dk.x, dk.y, 360 * dk.k, 34 * dk.k, 0.32]] as const) {
      c.save();
      c.translate(x, y);
      c.scale(1, ry / rx);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, withAlpha(mixLab(f.mood.core, f.mood.halo, 0.4), a * L));
      g.addColorStop(0.4, withAlpha(f.mood.halo, a * 0.35 * L));
      g.addColorStop(1, withAlpha(f.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(-rx, -rx, 2 * rx, 2 * rx);
      c.restore();
    }
    c.restore();
  }
  // the nearest plane on the drift (L6, soft): a stack of case books at the desk's near-left corner that rises
  // through the bottom-left corner as the camera comes down to the desk
  if (follow > 0.3) f.layer('L6', (c, env) => nearBooks(c, env));
  // the study resolving out of the dark from the lamp's pool outward (the lamp clicks at `lamp`); capped, so the
  // ghost of the room survives under it
  if (L < 0.999) {
    const c = f.c;
    const pc = toScreen(LAYERS.L4, cam, STUDY.pool.cx + 100, STUDY.pool.cy + 200);
    const r = 140 + 1150 * sm(L);
    const g = c.createRadialGradient(pc.x, pc.y, r * 0.2, pc.x, pc.y, r);
    const ink = f.mood.fg;
    g.addColorStop(0, withAlpha(ink, Math.min(0.84, 0.9 * (1 - L))));
    g.addColorStop(1, withAlpha(ink, Math.min(0.88, 0.98 * (1 - L) + 0.25 * (1 - sm(L)))));
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

/** dust in the lamp's pool: a plane a little in front of the board */
const DUST_PLANE: LayerSpec = { id: 'ch01-s04-dust', z: 900, haze: 0, blur: 0.4 };

/** the board's lamp pool on the cork (board units): tight round K, so the cork outside falls to about L* 25 */
const BOARD_POOL = { cx: K.x, cy: K.y + 30, r: 330, k: 0.85 };
/** the BOARD MAP's pin-hole grid (board units): the four clue columns C1–C4 (holes every 48 down each), the
 *  suspects' margin S1–S3 at the left, and the question clips Q1–Q4 under the thread along the top edge */
const PIN_GRID: { x: number; y: number; q?: boolean }[] = (() => {
  const out: { x: number; y: number; q?: boolean }[] = [];
  for (const x of [230, 370, 640, 790]) for (let y = 96; y <= 576; y += 48) out.push({ x, y });
  for (let y = 120; y <= 480; y += 60) out.push({ x: 80, y });
  for (const x of Object.values(Q_SLOTS)) out.push({ x, y: BOARD.threadY + 16, q: true });
  return out;
})();
/** cork detail over the board (s04's board is empty but for K): the pin-hole grid, each hole a dark prick with
 *  its lower lip catching the lamp (the lamp stands below the board), lit by K's pool and gone in the dark */
function corkDetail(c: CanvasRenderingContext2D, env: PaintEnv) {
  const m = env.mood;
  const bx = STUDY.board.x, by = STUDY.board.y;
  const lip = mixLab(m.halo, m.rim, 0.4);
  for (const P of PIN_GRID) {
    const d = Math.hypot((P.x - BOARD_POOL.cx) / 1.25, P.y - BOARD_POOL.cy) / (BOARD_POOL.r * 1.35);
    const lit = Math.max(0, 1 - d);
    const x = bx + P.x, y = by + P.y;
    const r = P.q ? 2.2 : 1.8;
    c.fillStyle = withAlpha(m.fg, 0.55 + 0.3 * lit);
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    if (lit > 0.02) {
      c.strokeStyle = withAlpha(lip, 0.15 + 0.6 * lit);
      c.lineWidth = 1;
      c.beginPath();
      c.arc(x, y, r + 0.9, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
    }
  }
}

/** the wall under the board: a dado rail (its top catching the lamp) and panelling down to the candle shelf, from
 *  the bookcase's edge to the window, so the wall in the establishing medium and on the drift is not a void */
function wallPanelling(c: CanvasRenderingContext2D, env: PaintEnv) {
  const m = env.mood;
  const x0 = 110, x1 = 1960, ry = 740;
  c.fillStyle = mixLab(m.set, m.fg, 0.3);
  c.fillRect(x0, ry, x1 - x0, 14);
  c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.3), 0.42);
  c.fillRect(x0, ry, x1 - x0, 1.6);
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(x0, ry + 14, x1 - x0, 2.5);
  // raised panels below the rail: a recessed field with its top and lamp-side edges catching the light
  for (let x = x0 + 20; x + 200 < x1; x += 236) {
    c.fillStyle = withAlpha(m.fg, 0.22);
    c.fillRect(x, ry + 40, 200, 150);
    c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.3), 0.16);
    c.fillRect(x, ry + 190, 200, 1.4);
    c.fillStyle = withAlpha(m.fg, 0.35);
    c.fillRect(x, ry + 40, 200, 1.4);
  }
}

/** lit edges of the board (screen space, after the dark): the top rail's lower lip and its outer top edge, the
 *  inner lips of both side rails (brightest low, near the lamp), and the oxblood thread's glint across the top of
 *  K's pool. Strength `a` (0..1). */
function boardEdges(f: Frame, cam: Camera3, a: number) {
  if (a < 0.02) return;
  const c = f.c;
  const B = STUDY.board;
  const P = (bx: number, by: number) => toScreen(LAYERS.L4, cam, B.x + bx, B.y + by);
  const lit = mixLab(f.mood.rim, f.mood.halo, 0.35);
  const falloff = (bx: number) => Math.exp(-(((bx - K.x) / 360) ** 2));
  c.save();
  c.lineCap = 'round';
  // the top rail: its lower lip (where the rail meets the cork) and, fainter, its outer top edge
  for (const [by, w, al] of [[0, 1.1, 0.7], [-16, 0.9, 0.32]] as const) {
    for (let bx = -16; bx < BOARD.w + 16; bx += 40) {
      const p0 = P(bx, by), p1 = P(bx + 40, by);
      c.strokeStyle = withAlpha(lit, a * al * (0.25 + 0.75 * falloff(bx + 20)));
      c.lineWidth = w * p0.k;
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      c.lineTo(p1.x, p1.y);
      c.stroke();
    }
  }
  // the side rails' inner lips: lit from below, fading up the board
  for (const bx of [0, BOARD.w]) {
    for (let by = 0; by < BOARD.h; by += 40) {
      const p0 = P(bx, by), p1 = P(bx, by + 40);
      c.strokeStyle = withAlpha(lit, a * 0.5 * (0.3 + 0.7 * (by / BOARD.h)));
      c.lineWidth = 1.1 * p0.k;
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      c.lineTo(p1.x, p1.y);
      c.stroke();
    }
  }
  // the question thread's glint: where K's pool reaches the top of the board
  // (the case board's oxblood, lifted toward the lamp's halo)
  const glint = mixLab(mixLab(mixLab(MOODS.emberRed.rim, f.mood.set, 0.6), f.mood.halo, 0.55), f.mood.halo, 0.25);
  const sag = (bx: number) => BOARD.threadY + Math.sin(((bx - 40) / 920) * Math.PI) * 10;
  for (let bx = 200; bx < 800; bx += 12) {
    const p0 = P(bx, sag(bx) - 0.6), p1 = P(bx + 12, sag(bx + 12) - 0.6);
    const g = Math.exp(-(((bx + 6 - K.x) / 170) ** 2));
    c.strokeStyle = withAlpha(glint, a * 0.85 * g);
    c.lineWidth = 1.3 * p0.k;
    c.beginPath();
    c.moveTo(p0.x, p0.y);
    c.lineTo(p1.x, p1.y);
    c.stroke();
  }
  c.restore();
}

/** the manila file on the desk (L5 world, as ch01-s05's wide shows it), open and still empty */
function deskFile(c: CanvasRenderingContext2D, env: PaintEnv) {
  const D = DESK01;
  const manila = mixLab(mixLab(env.mood.halo, '#b08a52', 0.35), env.mood.set, 0.3);
  const fx = 1330, fw = 340;
  const topY = D.back + 3, frontY = D.front - 12;
  c.fillStyle = mixLab(manila, env.mood.fg, 0.12);
  c.beginPath();
  c.moveTo(fx + 30, topY + 1);
  c.lineTo(fx + 34, topY - 13);
  c.lineTo(fx + 104, topY - 13);
  c.lineTo(fx + 108, topY + 1);
  c.closePath();
  c.fill();
  c.fillStyle = manila;
  c.beginPath();
  c.moveTo(fx + 12, topY);
  c.lineTo(fx + fw + 8, topY);
  c.lineTo(fx + fw, frontY);
  c.lineTo(fx, frontY);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(manila, env.mood.fg, 0.6);
  c.fillRect(fx, frontY, fw, 8);
  c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), 0.65);
  c.fillRect(fx + 12, topY, fw - 4, 1.6);
  c.fillRect(fx + 34, topY - 13, 70, 1.4);
}

/** a stack of closed books at the desk's near-left corner (L6 world): spines to camera, each top face catching
 *  the lamp (a lit band), page blocks and spine bands as cut-lines */
function nearBooks(c: CanvasRenderingContext2D, env: PaintEnv) {
  const m = env.mood;
  const ink = env.fill('ink');
  const lit = mixLab(m.rim, m.halo, 0.3);
  let y = 2120;
  const books = [[170, 330, 0], [150, 300, 18], [140, 320, -12], [125, 280, 10]] as const;
  for (let i = 0; i < books.length; i++) {
    const [h, w, dx] = books[i];
    const x = 690 + dx;
    y -= h;
    c.fillStyle = mixLab(ink, m.set, 0.08 + 0.06 * (i % 2));
    c.fillRect(x, y, w, h);
    c.fillStyle = withAlpha(m.rim, 0.22);
    c.fillRect(x + 34, y + h * 0.24, w - 68, 4);
    c.fillRect(x + 34, y + h * 0.74, w - 68, 4);
    // the top face, foreshortened, lit toward the lamp (right)
    const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, withAlpha(lit, 0.18));
    g.addColorStop(1, withAlpha(lit, 0.55));
    c.fillStyle = g;
    c.fillRect(x, y - 10, w, 10);
  }
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
/** two closed books, one squared over the other, seen from above at the top-right corner of the desk (L5): each
 *  cover a step off ink, the page block along its lamp-side edge as a pale band ruled with page lines, and the
 *  spine along its left edge: a rounded back with raised bands catching the lamp */
function deskBooks(c: CanvasRenderingContext2D, env: PaintEnv) {
  const m = env.mood;
  const book = (x: number, y: number, w: number, h: number, rot: number, tone: number) => {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    // the cloth cover, a step off ink, catching a little of the lamp toward its lower left
    const cv = c.createLinearGradient(-w / 2, h / 2, w / 2, -h / 2);
    cv.addColorStop(0, mixLab(env.fill('ink'), m.set, tone + 0.18));
    cv.addColorStop(1, mixLab(env.fill('ink'), m.set, tone));
    c.fillStyle = cv;
    c.beginPath();
    c.roundRect(-w / 2, -h / 2, w, h, 5);
    c.fill();
    // the page block showing along the lamp-side (lower) edge: a pale band ruled with page lines
    c.fillStyle = withAlpha(mixLab(m.halo, m.setHaze, 0.45), 0.5);
    c.fillRect(-w / 2 + 24, h / 2 - 9, w - 30, 7);
    c.fillStyle = withAlpha(m.fg, 0.35);
    for (let k = 0; k < 3; k++) c.fillRect(-w / 2 + 24, h / 2 - 8 + k * 2.2, w - 30, 0.6);
    // the spine along the left edge: a rounded back with four raised bands, lit across their tops
    c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.2), 0.16);
    c.fillRect(-w / 2 + 2, -h / 2 + 3, 18, h - 6);
    c.fillStyle = withAlpha(m.rim, 0.5);
    for (const k of [0.2, 0.4, 0.6, 0.8]) c.fillRect(-w / 2 + 2, -h / 2 + h * k, 18, 2.2);
    c.restore();
  };
  book(1190, 70, 330, 220, 0.12, 0.12);
  book(1175, 40, 300, 200, 0.03, 0.2);
}

/** the slip (centre x,y), folded once by `fold` (0 flat → 1 its RIGHT half hinged over the crease and laid on the
 *  left half); edges rim-lit. The front of the turning half darkens as it stands up away from the lamp; its back,
 *  coming down, is one step darker than the paper, with the type showing through faintly (mirrored). `hl` (per
 *  READ word, 0..1) lays a lamp-warm underline under the word being spoken and warms its letters. */
function slip(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, rot: number, fold: number, light: number, hl?: number[]) {
  const W = SLIP.w, H = SLIP.h;
  const paper = paperTone(env, light);
  const back = mixLab(paper, env.mood.set, 0.24);
  const ink = mixLab(env.mood.ink, paper, 0.12);
  const rim = withAlpha(env.mood.rim, 0.55);
  const warm = mixLab(env.mood.core, env.mood.halo, 0.35);
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const text = (left: boolean, alpha = 1, color = ink) => {
    if (alpha <= 0.01) return;
    c.save();
    c.globalAlpha *= alpha;
    c.beginPath();
    if (left) c.rect(-W / 2, -H / 2, W / 2, H);
    else c.rect(0, -H / 2, W / 2, H);
    c.clip();
    c.fillStyle = color;
    const font = `400 ${legibleSize(c, slipFont(), SLIP_PX)}px ${FONT.typewriter}`;
    c.font = font;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    QUOTE.forEach((ln, i) => c.fillText(ln, -W / 2 + QUOTE_X[i], -H / 2 + 64 + i * 43));
    // the reading: a lamp-warm underline that travels with the spoken words, and the word's letters warmed
    if (hl && color === ink) {
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
    c.fillStyle = color;
    c.fillText(ATTRIB, W / 2 - 34, H / 2 - 26);
    c.restore();
  };
  const edge = (x0: number, w: number) => {
    c.strokeStyle = rim;
    c.lineWidth = 1;
    c.strokeRect(x0 + 0.5, -H / 2 + 0.5, w - 1, H - 1);
  };
  // the left half stays flat
  c.fillStyle = paper;
  c.fillRect(-W / 2, -H / 2, W / 2, H);
  text(true);
  if (fold < 0.02) {
    c.fillRect(0, -H / 2, W / 2, H);
    text(false);
    edge(-W / 2, W);
  } else {
    edge(-W / 2, W / 2);
    const up = Math.sin(Math.PI * fold);
    // the half standing up throws a soft shade across the flat half on the side it is falling toward
    if (fold < 1) {
      const sw = 70 * up + 1;
      const sg = c.createLinearGradient(0, 0, -sw, 0);
      sg.addColorStop(0, withAlpha(env.mood.fg, 0.38 * up));
      sg.addColorStop(1, withAlpha(env.mood.fg, 0));
      c.fillStyle = sg;
      c.fillRect(-sw, -H / 2, sw, H);
    }
    // right half: flat (0) → on edge (0.5) → face down over the left half (1)
    const k = Math.cos(Math.PI * fold);
    if (Math.abs(k) > 0.01) {
      c.save();
      c.scale(k, 1);
      if (k > 0) {
        c.fillStyle = paper;
        c.fillRect(0, -H / 2, W / 2, H);
        // the type on the rising half fades as it foreshortens (squeezed glyphs read as a glitch, not as paper)
        text(false, clamp01((k - 0.55) / 0.35));
        c.fillStyle = withAlpha(env.mood.fg, 0.5 * up);
        c.fillRect(0, -H / 2, W / 2, H);
      } else {
        // the back: one step darker than the paper, a touch darker still while it is steep to the lamp, the
        // type showing through faintly (the scale has already mirrored it)
        c.fillStyle = mixLab(back, env.mood.fg, 0.25 * up);
        c.fillRect(0, -H / 2, W / 2, H);
        text(false, 0.09 * (1 - up), mixLab(back, env.mood.ink, 0.5));
      }
      edge(0, W / 2);
      c.restore();
    }
  }
  // the crease: scored before the fold (a faint line), then a shade line with a lit lip as the half goes over
  c.fillStyle = withAlpha(env.mood.fg, 0.12 + 0.5 * Math.min(1, fold * 2));
  c.fillRect(-1, -H / 2, 2, H);
  c.fillStyle = withAlpha(env.mood.rim, 0.3 + 0.4 * Math.min(1, fold * 2));
  c.fillRect(1, -H / 2, 1.2, H);
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

/** manila tones (about L* 45-50 under the pool, ~15 % under the slip's paper, so the slip stays the brightest
 *  object in frame): the back panel a step darker than the front flap */
const MANILA = (m: PaintEnv['mood']) => mixLab(m.halo, '#b08a52', 0.35);
const MANILA_BACK = (m: PaintEnv['mood']) => mixLab(MANILA(m), m.set, 0.6);
const MANILA_FRONT = (m: PaintEnv['mood']) => mixLab(MANILA(m), m.set, 0.5);
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
  const read = sm((t - sc.slipAt - 0.6) / (sc.readEnd - sc.slipAt));
  const toFolder = sm((t - (sc.putAt - 0.4)) / 1.4);
  const cam: Camera3 = {
    x: lerp(lerp(640, 600, read), 760, toFolder),
    y: 360 + lerp(0, 14, read),
    z: lerp(lerp(0, 70, read), 50, toFolder),
    lens: 1,
  };
  f.camera(cam);
  f.backlight({ sunX: 500, sunY: 300, sunRadius: 500, intensity: 0.3 });
  const flick = 1 + 0.05 * fbm(t * 2.2, 41) + 0.02 * fbm(t * 9, 43);

  // -------- the action's clock (on twos)
  const tq = q2(t);
  const W = SLIP.w, H = SLIP.h;
  const slideS = sc.slipAt - 0.25, slideE = sc.slipAt + 0.9; // in the lamp's pool by ~9.6 s
  // THE FOLD: three drawings on twos round "that" (0.3 · 0.6 · 0.85), then the right half lies flat on the left
  const FOLD_AT = [sc.thatAt - 0.17, sc.thatAt - 0.085, sc.thatAt, sc.thatAt + 0.085];
  const FOLD_V = [0.3, 0.6, 0.85, 1];
  let fold = 0;
  for (let i = 0; i < FOLD_AT.length; i++) if (tq >= FOLD_AT[i] - 1e-6) fold = FOLD_V[i];
  const foldS = FOLD_AT[0], foldE = FOLD_AT[3];
  const gripAt = foldE + 0.17; // the hand has the folded slip by its crease
  const carryE = sc.caseAt; // dropped into the folder on "case"
  const shutS = sc.fileAt - 0.25, shutE = sc.fileAt; // the flap closes, ending on "file"
  // two separate index-finger taps 0.25 s apart (on twos), after the left hand has left the frame
  const taps = [sc.fileAt + 0.38, sc.fileAt + 0.63];
  const LIFT = 0.17;

  const slideU = sm((tq - slideS) / (slideE - slideS));
  const carryU = sm((tq - gripAt) / (carryE - gripAt));
  // the slip slides up from below frame into the pool, left of the folder (never under it)
  let sx = lerp(SLIP_REST.x + 30, SLIP_REST.x, slideU), sy = lerp(SLIP_REST.y + 470, SLIP_REST.y, slideU);
  let rot = lerp(0.07, -0.012, slideU);
  const dropAt = { x: FOLDER.x + 4, y: FOLDER.y + 10 };
  // folded right over left, the packet is the slip's left half: its centre is sx - W/4
  sx = lerp(sx, dropAt.x + W / 4, carryU);
  sy = lerp(sy, dropAt.y, carryU);
  rot = lerp(rot, 0.02, carryU);
  const filed = tq >= carryE;
  // the folder lies open (its flap standing up, seen edge-on) from the cut; the left hand tips the flap over at
  // shutS and it falls shut, accelerating, on "file"
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
      if (!filed) {
        // the slip's soft contact shadow (wider and fainter while it is lifted and carried)
        const lift = Math.sin(Math.PI * carryU) + 0.5 * Math.sin(Math.PI * fold);
        // its footprint: the left half plus whatever of the right half has not yet gone over the crease
        const reach = fold < 0.02 ? W / 2 : Math.max(0, (W / 2) * Math.cos(Math.PI * fold));
        const fw = W / 2 + reach, fcx = (reach - W / 2) / 2;
        contactShadow(f, c, env, sx + fcx + 8 + 14 * lift, sy + 10 + 18 * lift, fw + 6, H + 6, rot, 0.5 * (1 - 0.4 * lift));
        slip(c, env, sx, sy, rot, fold, light, hl);
      } else {
        c.save();
        c.beginPath();
        c.rect(FOLDER.x - FOLDER.w / 2, FOLDER.y - FOLDER.h / 2, FOLDER.w, FOLDER.h);
        c.clip();
        slip(c, env, sx, sy, rot, 1, light);
        c.restore();
      }
    }
    if (filed) flap(c, env, open);

    // -------- the hands (short forearms from the lower edge, leaning, cuffs in frame; knuckle cut-lines)
    const arms: Arm[] = [];
    const LAMP_DIR = { x: -0.6, y: -0.8 };
    const R = (sock: Pt, shape: HandShape01, dir: number, lift = 0, bend = 0.1) => arms.push({ wrist: wristAt(sock, dir, shape, HAND_F, 'R', bend), dir, shape, side: 'R', len: HAND_F, bend, lift, light: LAMP_DIR, detail: 1 });
    const Lh = (sock: Pt, shape: HandShape01, bend = 0.15) => arms.push({ wrist: wristAt(sock, DIR_L, shape, HAND_F, 'L', bend), dir: DIR_L, shape, side: 'L', len: HAND_F, bend, light: LAMP_DIR, detail: 1 });
    const away = (p: Pt, dir: number, d: number): Pt => ({ x: p.x - Math.cos(dir) * d, y: p.y - Math.sin(dir) * d });
    // the push: fingertips on the slip's lower edge carry it up into the light, then withdraw
    if (tq >= slideS - 0.3 && tq < slideE + 0.6) {
      // (left of the attribution, on the slip's bottom margin: the fingertips never touch the type)
      const corner = { x: sx - 150, y: sy + H / 2 + 4 };
      const inU = sm((tq - (slideS - 0.3)) / 0.3);
      const outU = sm((tq - slideE - 0.05) / 0.5);
      R(lerpP(lerpP(away(corner, DIR_PUSH, 500), corner, inU), away(corner, DIR_PUSH, 620), outU), 'flat', DIR_PUSH);
    }
    // the index finger follows the reading from BENEATH the slip's lower edge (never over the words)
    const rS = sc.readStart - 0.35, rE = sc.readEnd + 0.15;
    if (tq >= rS && tq < rE + 0.45) {
      const under = SLIP_REST.y + H / 2 + 7;
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
      R(lerpP(lerpP(away(tip, DIR_READ, 420), tip, inU), away(tip, DIR_READ, 560), outU), 'press', DIR_READ, 0, 0.05);
    }
    // the fold: the right hand comes to the slip's lower right corner, lifts that edge over the crease (it follows
    // the edge through the first two drawings, so it never crosses the left half's type), lets the half fall,
    // then takes the folded slip by its crease and carries it into the folder, letting go on "case"
    if (tq >= foldS - 0.35 && tq < carryE + 0.1) {
      const cornerAt = (fv: number): Pt => ({ x: sx + (W / 2 - 14) * Math.cos(Math.PI * fv), y: sy + H / 2 - 14 - 44 * Math.sin(Math.PI * fv) });
      const crease = { x: sx - 10, y: sy + 30 };
      let p: Pt;
      let shape: HandShape01 = 'pinch';
      if (tq < foldS) p = lerpP(away(cornerAt(0), DIR_FOLD, 420), cornerAt(0), sm((tq - (foldS - 0.35)) / 0.3));
      else if (fold < 0.85) p = cornerAt(fold);
      else if (tq < gripAt) {
        // released at the top of the arc: the hand drops back and down to the crease side of the packet
        p = lerpP(cornerAt(0.6), crease, sm((tq - FOLD_AT[2]) / (gripAt - FOLD_AT[2])));
        shape = 'open';
      } else p = crease;
      if (tq >= carryE) shape = 'open';
      R(p, shape, DIR_FOLD, 0, 0.1);
    } else if (tq >= carryE + 0.1) {
      // to the closed folder: the index finger out, two separate taps (lift, strike; on twos), then the hand
      // settles flat on the file to the cut
      const rest = { x: FOLDER.x - 30, y: FOLDER.y + 36 };
      const from = { x: sx - 10, y: sy + 30 };
      const toU = sm((tq - carryE - 0.1) / (taps[0] - LIFT - carryE - 0.1));
      const lifted = taps.some((tt) => tq >= tt - LIFT && tq < tt) ? 1 : 0;
      const p = lerpP(from, rest, toU);
      const tapping = tq < taps[1] + 2 / 12;
      R({ x: p.x, y: p.y + 14 * lifted }, tapping ? 'press' : 'flat', DIR_TAP, lifted, 0.18);
    }
    // the left hand: from the lower left, fingertips to the flap standing open along the folder's lower edge; it
    // tips the flap over, lets go while the flap is still falling, and withdraws the way it came; the flap falls
    // shut on "file" by itself (the hand never reaches over the folder's face)
    if (tq >= shutS - 0.55 && tq < shutE + 0.3) {
      const F = FOLDER;
      const grip = { x: F.x - F.w / 2 + 110, y: F.y + F.h / 2 + 2 };
      const inU = sm((tq - (shutS - 0.55)) / 0.4);
      const push = sm((tq - (shutS - 0.12)) / 0.12);
      const outU = sm((tq - (shutS + 0.06)) / 0.34);
      const p = lerpP(lerpP(away(grip, DIR_L, 420), { x: grip.x + 6 * push, y: grip.y - 12 * push }, inU), away(grip, DIR_L, 520), outU);
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
  });
  // the pool falls off hard into ink toward the frame's edges (before the near planes, which keep their own light)
  {
    const c = f.c;
    c.save();
    // (the light stays on the slip until it is carried, then follows it to the folder)
    const vc = toScreen(LAYERS.L4, cam, lerp(SLIP_REST.x + 60, FOLDER.x - 40, sm((t - (sc.thatAt + 0.15)) / 1.1)), SLIP_REST.y + 20);
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
  // the near planes (L5, soft): the case books at the top-right corner, and the banker's lamp seen from above at
  // the top-left: its green half-cylinder shade with its lip lit from inside and the bulb's spill on the desk
  f.layer('L5', (c, env) => {
    deskBooks(c, env);
    lampFromAbove(c, env, flick);
  });
  // a fountain pen lying across the desk's near edge, bottom left: the nearest plane (L6, soft)
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
}

/** the banker's lamp from above (L5 world, at LAMP_TOP): the brass arm running out of frame, the long green
 *  half-cylinder shade (dark at its crown's back edge, lighter toward the open lip, a soft highlight along the
 *  curve), its rolled ends, and the lip: an arc lit from inside, with the bulb's spill fanning onto the desk */
function lampFromAbove(c: CanvasRenderingContext2D, env: PaintEnv, flick: number) {
  const m = env.mood;
  const G = shadeGreen(env, 1);
  const ink = env.fill('ink');
  c.save();
  c.translate(LAMP_TOP.x, LAMP_TOP.y);
  c.rotate(-0.32);
  // the bulb's light spilling out from under the lip onto the desk
  c.save();
  c.globalCompositeOperation = 'lighter';
  const ug = c.createRadialGradient(0, 56, 6, 0, 80, 240);
  ug.addColorStop(0, withAlpha(m.core, 0.42 * flick));
  ug.addColorStop(0.3, withAlpha(m.halo, 0.22 * flick));
  ug.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = ug;
  c.fillRect(-260, -100, 520, 420);
  c.restore();
  // the brass arm (ink with a lit edge), out past the frame's top-left corner
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
  // the shade, its open lip bowed toward the desk (the half-cylinder's mouth seen from above)
  const shade = new Path2D();
  shade.moveTo(-152, -16);
  shade.quadraticCurveTo(-152, -46, -122, -46);
  shade.lineTo(122, -46);
  shade.quadraticCurveTo(152, -46, 152, -16);
  shade.lineTo(150, 36);
  shade.quadraticCurveTo(0, 58, -150, 36);
  shade.closePath();
  const sg = c.createLinearGradient(0, -46, 0, 50);
  sg.addColorStop(0, mixLab(G.dark, ink, 0.35));
  sg.addColorStop(0.35, G.dark);
  sg.addColorStop(0.55, mixLab(G.dark, G.lip, 0.55));
  sg.addColorStop(0.8, mixLab(G.dark, G.lip, 0.4));
  sg.addColorStop(1, G.lip);
  c.fillStyle = sg;
  c.fill(shade);
  // the rolled ends (darker caps) and a soft highlight running along the curve
  c.fillStyle = withAlpha(ink, 0.5);
  c.beginPath();
  c.roundRect(-152, -46, 24, 84, [30, 0, 0, 24]);
  c.roundRect(128, -46, 24, 84, [0, 30, 24, 0]);
  c.fill();
  c.fillStyle = withAlpha(mixLab(G.lip, m.rim, 0.5), 0.4);
  c.fillRect(-118, -10, 236, 3);
  // the finial at the crown and the shade's crisp outline
  c.fillStyle = ink;
  c.beginPath();
  c.ellipse(0, -6, 9, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(ink, 0.9);
  c.lineWidth = 2;
  c.stroke(shade);
  // the lip: an arc lit from inside along the open edge, and its glow on the glass just above it
  c.strokeStyle = withAlpha(mixLab(m.core, m.halo, 0.35), 0.95 * flick);
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(-142, 37);
  c.quadraticCurveTo(0, 57, 142, 37);
  c.stroke();
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(m.core, 0.3 * flick);
  c.lineWidth = 16;
  c.beginPath();
  c.moveTo(-138, 40);
  c.quadraticCurveTo(0, 62, 138, 40);
  c.stroke();
  c.restore();
  c.restore();
}
