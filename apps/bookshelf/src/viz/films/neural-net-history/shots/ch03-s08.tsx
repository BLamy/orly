/**
 * ch03-s08 — Ithaca, 1961: Rosenblatt's book open on its language sentence, a caption that looks like a clue,
 * and refrain 3 of 5: "Put that in the file."
 *
 * Cut from the Wall (candleAmber); under the cut the tint crossfades to the green-shaded lamp's labGreen
 * (0.7 s, no dip). THE DESK (top-down, the FILE camera's grammar): a heavy book open under the lamp, the
 * manila file lying open beside it (two earlier slips' edges inside).
 *   0.2   the spread settles: the left page's alphabet attempt (26 capitals in two typefaces); half the letters
 *         of the second typeface blur and smear (the limit shown, not typed). Date stamp 1961.
 *   1.0   the right page's caption BACK-PROPAGATING ERROR-CORRECTION EXPERIMENTS catches the lamp
 *   1.9   the hands stamp a small oxblood question mark beside it (the false clue; silent)
 *   "Linguistic"  the sentence lifts from the left page as a quote card (held through the quote)
 *   "file"        the card settles back; a carbon copy goes into the folder in the hand; the flap closes
 *   +0.4  a whip tilt up off the desk to the case board (crossfade labGreen → candleAmber, 1.2 s, STUDY
 *         LOCK): the hands pin the caption card, with its oxblood question mark, in C1-c
 *   +1.98 WALL: the sentence is pinned in W3, just right of the chess slip in W2; held.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, ShotScene } from '../../../film';
import { FONT, LAYERS, MOODS, POSES, defineShot, dustMotes, hash1, legibleSize, mixLab, overscan, toLayer, toScreen, withAlpha } from '../../../film';
import { cast, hands } from '../cast';
import { STUDY, slotWorld, studyCase, studyRoom } from '../sets/study';
import { SLOTS, boardStateAt } from '../sets/studyState';
import { DEFAULT_POOL, drawCard, poolAt } from '../sets/caseBoard';
import { drawSlip, slotLight, wallSlotAt, WALL_SLOTS } from '../sets/wallOfForecasts';
import { handsEntry } from '../sets/narratorHands';
import { W3_VIEW, camKeys, clamp01, dateStamp, drawChessSlip, lampSpill, lerp, pinSway, sm, smearY, tq12, win } from '../sets/ch03-s06-kit';

const ID = 'ch03-s08';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------ the desk (L4 world, top-down)
const BOOK = { cx: 600, cy: 395, pw: 400, ph: 520 };
const PAGE_L = { x: BOOK.cx - BOOK.pw, y: BOOK.cy - BOOK.ph / 2 };
const PAGE_R = { x: BOOK.cx, y: BOOK.cy - BOOK.ph / 2 };
const FOLDER = { x: 1068, y: 246, w: 300, h: 330 };
const FOLDER_DROP = { x: FOLDER.x + FOLDER.w / 2 - 10, y: FOLDER.y + FOLDER.h / 2 + 10 };
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/** the 13 letters of the second typeface that smear (seeded, fixed) */
const SMEAR = new Set([1, 2, 4, 6, 8, 9, 12, 14, 17, 19, 20, 23, 25]);
const SENT = ['Linguistic capability, related to perceptual', 'experience, is of the essence.'];
const SENT_Y = [462, 481];
const CAPTION = ['BACK-PROPAGATING', 'ERROR-CORRECTION', 'EXPERIMENTS'];
const CAP_Y = [458, 488, 518];
const CAP_PX = 25;
const QMARK = { x: 968, y: 492 };
/** the lamp's hot spot on the spread (L4 world) */
const HOT = { x: 520, y: 300 };
/** the desk top: a plane just below the book's open spread (the book lies a few centimetres proud of it), so the
 *  push and the follow to the file slide the desk against the book and the near lamp shade (three planes) */
const DESK: LayerSpec = { id: 'ch03-s08-desk', z: 1060, haze: 0.04, blur: 0.5 };
/** the STUDY LOCK amber's crossfade length (starts under the whip blur) */
const STUDY_FADE = 1.2;
/** the Wall pin's brisk exit (s): the hand is gone down-right by wall + 0.25 */
const WALL_EXIT = 0.23;
/** the oxblood question mark at full value (the false clue's one accent) */
const OXBLOOD = mixLab('#7c1d1a', MOODS.emberRed.ink, 0.12);
/** the quote card's rest on screen */
/** (over the upper RIGHT page, so the left page's smeared alphabet stays in view while the sentence is read) */
const CARD = { cx: 900, cy: 168, w: 600, h: 160 };

interface Beats {
  letters: number;
  caption: number;
  falseQ: number;
  stamp0: number;
  stampDur: number;
  ling: number;
  lift0: number;
  lift1: number;
  settle0: number;
  file: number;
  file0: number;
  fileDur: number;
  flap0: number;
  flap1: number;
  whip0: number;
  cut: number;
  board: number;
  pin0: number;
  pinDur: number;
  wallCut: number;
  wall: number;
  wpin0: number;
  wpinDur: number;
}

interface Scene extends ShotScene {
  b: Beats;
  D: number;
  deskCam: (t: number) => Camera3;
  boardCam: (t: number) => Camera3;
  wallCam: (t: number) => Camera3;
  DESK_CAMS: Camera3[];
  STUDY_CAMS: Camera3[];
  /** the lamp shade's L5 position: at the frame's top-left corner for the mid-shot camera */
  shadeAt: { x: number; y: number };
  /** the blotter corner's L5 position: the frame's lower right for the mid-shot camera */
  edgeAt: { x: number; y: number };
}

export default defineShot<Scene>({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const file = T.beat('file');
    const board = T.beat('board');
    const wall = T.beat('wall');
    const ling = T.beat('linguistic');
    const b: Beats = {
      letters: T.beat('letters'),
      caption: T.beat('caption'),
      falseQ: T.beat('false'),
      stamp0: T.beat('false') - 0.6,
      stampDur: 1.2,
      ling,
      // the card is up at full size within 0.55 s, while 'Linguistic capability' is still being spoken
      lift0: ling - 0.3,
      lift1: ling + 0.25,
      settle0: T.word('L0318', 'Put') - 0.25,
      file,
      // the card flies from its rest to the folder (settle0 → file), the hand meets it and presses the flap
      file0: file - 0.64,
      fileDur: 1.4,
      // the flap closes as one clear 0.25 s action on the twos once the carbon is in, then the closed file holds
      flap0: file + 0.15,
      flap1: file + 0.4,
      // the tilt begins once the file is shut; a near shelf board wipes down the lens and the cut lands on the board
      whip0: Math.max(file + 0.55, board - 0.36),
      cut: Math.max(file + 0.7, board - 0.12),
      board,
      pin0: board - 0.22,
      pinDur: 1.2,
      wallCut: wall - 0.5,
      wall,
      // a quick W3 pin: hand in from wall - 0.55, the pin lands at ≈wall - 0.07, a short press, and the hand is
      // gone down-right by wall + 0.25 (never crossing the typing), so the slip holds clean before the dissolve
      wpin0: wall - 0.55,
      wpinDur: 0.8,
    };
    // the desk camera: a slow push, a drift toward the caption for the clue, back over the spread for the
    // lift, then a follow of the hand to the file; the whip tilt up carries the cut
    const deskK = camKeys([
      [0, 600, 398, 36],
      [b.falseQ + 0.2, 664, 414, 108],
      [ling - 0.1, 604, 392, 128],
      // through the quote hold the desk drifts right under the card, toward the caption and the open file
      [b.settle0, 720, 404, 196],
      // the follow to the file: the folder, its carbon and the closing flap sit wholly in frame
      [file - 0.05, 978, 476, 192],
      [b.whip0, 984, 474, 196],
    ]);
    const deskCam = (t: number): Camera3 => {
      if (t <= b.whip0) return deskK(t);
      const u = clamp01((t - b.whip0) / (b.cut - b.whip0));
      const c0 = deskK(b.whip0);
      return { ...c0, y: c0.y - 220 * u * u };
    };
    // the board: arriving from below (the tilt's tail), settling on C1-c, drifting toward the Wall
    const C1c = slotWorld('C1-c', 'centre');
    const boardK = camKeys([
      // close on the caption card (the subject: its typing and the oxblood '?' ≥ 22 px cap at 1080p)
      [b.cut + 0.32, C1c.x + 8, C1c.y + 6, 712],
      [b.wallCut, C1c.x + 14, C1c.y + 2, 752],
    ]);
    // the tilt's tail is short: the board's cards are in frame from the first frame after the cut
    const boardCam = (t: number): Camera3 => {
      const k0 = boardK(b.cut + 0.32);
      if (t >= b.cut + 0.32) return boardK(t);
      const u = clamp01((t - b.cut) / 0.32);
      const e = 1 - (1 - u) ** 3;
      return { ...k0, y: lerp(k0.y + 110, k0.y, e) };
    };
    // the Wall: a slow lateral truck from W2 toward W3 (lamp outward)
    const W2 = { x: STUDY.wall.x + WALL_SLOTS.W2.x * STUDY.wall.k, y: STUDY.wall.y + WALL_SLOTS.W2.y * STUDY.wall.k };
    const W3 = { x: STUDY.wall.x + WALL_SLOTS.W3.x * STUDY.wall.k, y: STUDY.wall.y + WALL_SLOTS.W3.y * STUDY.wall.k };
    const wallK = camKeys([
      // close on W3 (its typing ≥ 22 px cap at 1080p before the crossfade out), its neighbours framing WHICH
      // slot: Turing's W1 at the left edge, the chess slip's top edge (W2) along the bottom
      [b.wallCut, W3.x - 22, W3.y + 44, 692],
      [b.wall + 0.45, W3.x - 8, W3.y + 22, 764],
      [D, W3.x - 2, W3.y + 16, 778],
    ]);
    tl.hold(0, D);
    const DESK_CAMS = [deskK(0), deskK(b.falseQ + 0.2), deskK(b.settle0), deskK(file), { ...deskK(b.whip0), y: deskK(b.whip0).y - 230 }];
    const STUDY_CAMS = [boardCam(b.cut), boardCam(b.wallCut), wallK(b.wallCut), wallK(D)];
    const shadeAt = toLayer(LAYERS.L5, deskK(ling), -70, -64);
    const edgeAt = toLayer(LAYERS.L5, deskK(b.settle0 + 1.2), 1330, 770);
    return { tl, b, D, deskCam, boardCam, wallCam: wallK, DESK_CAMS, STUDY_CAMS, shadeAt, edgeAt };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t < b.cut) paintDesk(f, sc, t);
    else if (t < b.wallCut) paintBoard(f, sc, t);
    else paintWall(f, sc, t);
    smearY(f, 16 * Math.exp(-(((t - b.cut) / 0.14) ** 2)));
    shelfWipe(f, t, b.cut);
  },
});

// =====================================================================================================
// THE DESK
// =====================================================================================================
function paintDesk(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.deskCam(t);
  f.camera(cam);
  // labGreen in from the Wall's amber; under the whip blur the STUDY LOCK amber already starts back
  f.setMood('labGreen', { from: 'candleAmber', u: sm(t / 0.7) });
  f.backlight({ sunX: 300, sunY: 120, sunRadius: 600, intensity: 0.3 });
  const stampU = (tq - b.stamp0) / b.stampDur;
  const fileU = (tq - b.file0) / b.fileDur;
  const entry = handsEntry(cam, 'L4');
  f.layer(DESK, (c, env) => {
    const r = overscan(DESK, sc.DESK_CAMS, 80);
    f.cached(`${ID}/deskTop/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      deskTop(cc, env, r);
    })(c, r.x, r.y);
  });
  const up = sm((t - b.lift0) / (b.lift1 - b.lift0));
  f.layer('L4', (c, env) => {
    // the static book art, baked
    const r = { x: -40, y: 80, w: 1100, h: 680 };
    f.cached(`${ID}/book/${env.mood.id}`, r.w, r.h, (cc) => {
      cc.translate(-r.x, -r.y);
      bookStatic(cc, env);
    })(c, r.x, r.y);
    // the printed sentence on the page: body-text texture (two darker lines among the greeked body); it is READ
    // on the card that lifts from it, and the page line goes pale while the card is up (the card took it)
    sentenceLines(c, env, 1 - up * (1 - win(t, b.file, b.file + 0.5)));
    // the lead-in: Rosenblatt's own shadow (head and shoulder) crosses the lamp's pool once, as if he leaned in
    roseShadow(f, c, env, t);
    // the lamp's pool: a hot spot on the left page, falling off hard (the far page ≈35% down, the file in
    // half shadow, the desk's far corner black)
    const fo = c.createRadialGradient(HOT.x, HOT.y, 120, HOT.x, HOT.y, 1150);
    fo.addColorStop(0, withAlpha(env.mood.fg, 0));
    fo.addColorStop(0.32, withAlpha(env.mood.fg, 0.2));
    fo.addColorStop(0.6, withAlpha(env.mood.fg, 0.46));
    fo.addColorStop(1, withAlpha(env.mood.fg, 0.78));
    c.fillStyle = fo;
    c.fillRect(-300, -300, 1900, 1400);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const hot = c.createRadialGradient(HOT.x, HOT.y, 0, HOT.x, HOT.y, 300);
    hot.addColorStop(0, withAlpha(env.mood.core, 0.16));
    hot.addColorStop(0.5, withAlpha(env.mood.halo, 0.06));
    hot.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = hot;
    c.fillRect(HOT.x - 300, HOT.y - 300, 600, 600);
    c.restore();
    // the left page's second typeface smearing (Rosenblatt's own admitted limit), alive on the twos
    alphabet(c, env, win(t, b.letters + 0.15, b.letters + 1.9), tq);
    // the caption catching the lamp
    captionGlint(c, env, t, b.caption);
    // the sentence on the page warms as it is about to lift
    sentenceGlow(c, env, win(t, b.lift0 - 0.5, b.lift0) * (1 - win(t, b.settle0 + 0.4, b.settle0 + 1.2)));
    // the stamped question mark (the false clue)
    if (stampU >= 0.5) questionMark(c, env, Math.min(1, (tq - (b.stamp0 + 0.5 * b.stampDur)) / 0.12));
    // the file: open; the flying card lands as the carbon on 'file'; the flap closes under the hand
    // the cover swings up fast from under the desk's edge and spends most of the 0.4 s closing over the panel
    const fu = clamp01((tq - b.flap0) / (b.flap1 - b.flap0));
    const flap = fu <= 0 ? 0 : fu >= 1 ? 1 : 0.5 * Math.min(1, fu / 0.28) + 0.5 * sm(clamp01((fu - 0.28) / 0.72));
    const carbonIn = t >= b.file;
    folder(c, env, { flap, carbonIn });
    // the hands
    if (stampU > 0 && stampU < 1) hands.draw(c, hands.act('stamp', stampU, QMARK, { scale: 1.05, entry }), env);
    if (fileU > 0 && fileU < 1) hands.draw(c, hands.act('fileFold', fileU, FOLDER_DROP, { held: 'none', scale: 1.05, entry, dropAt: FOLDER_DROP }), env);
  });
  // the lamp: its green shade above the desk at top-left (near plane, a little soft), and its light; a
  // blotter's leather corner at the lower right, out of focus
  f.layer('L5', (c, env) => {
    const r = { x: -460, y: -380, w: 900, h: 720 };
    f.cached(`${ID}/shade2/${env.mood.id}`, r.w, r.h, (cc) => {
      cc.translate(-r.x, -r.y);
      lampShade(cc, env);
    }, { blur: 2.5 })(c, sc.shadeAt.x + r.x, sc.shadeAt.y + r.y);
    const e = { x: -520, y: -260, w: 900, h: 520 };
    f.cached(`${ID}/blotter2/${env.mood.id}`, e.w, e.h, (cc) => {
      cc.translate(-e.x, -e.y);
      blotterCorner(cc, env);
    }, { blur: 3.5 })(c, sc.edgeAt.x + e.x, sc.edgeAt.y + e.y);
    lampMouthGlow(c, env, sc.shadeAt);
    dustMotes(c, { area: { x: -100, y: -100, w: 1500, h: 900 }, count: 26, salt: 38, size: 1.2, brightness: 0.55, drift: { x: 4, y: 2 }, color: env.mood.halo }, env);
  });
  // screen-locked: the lifting quote card, the date stamp
  quoteLift(f, sc, t, cam);
  dateStamp(f.c, f.mood, t, b.letters, b.ling - 0.3, '1961');
}

/** a soft shadow of Rosenblatt's head and shoulder sliding across the lower spread in the lead-in (0.2 → 2.3 s):
 *  the man whose book this is, passing between the lamp and his page */
function roseShadow(f: Frame, c: C, env: PaintEnv, t: number) {
  const u = (t - 0.2) / 2.1;
  if (u <= 0 || u >= 1) return;
  const S = 2.1;
  const r = { x: -150 * S, y: -340 * S, w: 300 * S, h: 360 * S };
  const draw = f.cached(`${ID}/roseShadow/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    cast.rosenblatt.draw(cc, { x: 0, y: 0, facing: 'right', pose: POSES.lean ?? POSES.stand, scale: S, ink: env.mood.fg, cutLines: false }, env);
  }, { blur: 16 });
  const e = u * u * (3 - 2 * u);
  const x = lerp(60, 900, e), y = 1240 - 70 * Math.sin(Math.PI * u);
  c.save();
  c.globalAlpha = 0.34 * Math.sin(Math.PI * Math.min(1, u * 1.15));
  draw(c, x + r.x, y + r.y);
  c.restore();
}

function deskTop(c: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const m = env.mood;
  c.fillStyle = mixLab(m.set, m.fg, 0.35);
  c.fillRect(r.x, r.y, r.w, r.h);
  // the lamp's pool on the desk (from the top-left), falling off toward the file
  const g = c.createRadialGradient(HOT.x, HOT.y, 40, HOT.x, HOT.y, 980);
  g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.55), 0.95));
  g.addColorStop(0.45, withAlpha(mixLab(m.set, m.halo, 0.25), 0.6));
  g.addColorStop(1, withAlpha(m.set, 0));
  c.fillStyle = g;
  c.fillRect(r.x, r.y, r.w, r.h);
  // wood grain as faint cut-lines
  c.strokeStyle = withAlpha(m.fg, 0.22);
  c.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const y = r.y + i * 27 + Math.sin(i * 2.3) * 5;
    c.beginPath();
    c.moveTo(r.x, y);
    c.bezierCurveTo(r.x + 500, y + Math.sin(i * 1.7) * 12, r.x + 1300, y - Math.cos(i * 1.3) * 12, r.x + r.w, y);
    c.stroke();
  }
}

/** a page outline whose top and bottom edges dip toward the gutter (sag(x) 0 at the fore-edge → 1 at the gutter) */
function pagePath(c: C, x0: number, x1: number, top: number, bot: number, sag: (x: number) => number) {
  const N = 24;
  c.moveTo(x0, top + 12 * sag(x0));
  for (let i = 1; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N;
    c.lineTo(x, top + 12 * sag(x));
  }
  for (let i = N; i >= 0; i--) {
    const x = x0 + ((x1 - x0) * i) / N;
    c.lineTo(x, bot + 9 * sag(x));
  }
  c.closePath();
}

function pagePaper(env: PaintEnv) {
  return mixLab(mixLab(env.mood.halo, env.mood.rim, 0.62), '#efe5d2', 0.28);
}

function bookStatic(c: C, env: PaintEnv) {
  const m = env.mood;
  const { cx, cy, pw, ph } = BOOK;
  // the boards (cover) under the block, with a soft cast shadow toward the lower right
  const top = cy - ph / 2, bot = cy + ph / 2;
  c.save();
  c.fillStyle = withAlpha(m.fg, 0.6);
  c.filter = 'blur(10px)';
  c.fillRect(cx - pw + 4, top + 14, pw * 2 + 30, ph + 30);
  c.restore();
  c.fillStyle = mixLab(m.ink, m.set, 0.35);
  c.beginPath();
  c.roundRect(cx - pw - 16, top - 12, pw * 2 + 32, ph + 30, 5);
  c.fill();
  c.fillStyle = withAlpha(m.rim, 0.18);
  c.fillRect(cx - pw - 14, top - 12, pw * 2 + 28, 1.4);
  const paper = pagePaper(env);
  // the page block's THICKNESS: stacked leaves showing along the bottom and the fore-edges, each a hair
  // lower, the lowest in shadow (the book is a couple of centimetres thick, lying open near its middle)
  const sag = (x: number) => {
    const u = 1 - Math.min(1, Math.abs(x - cx) / pw);
    return u * u * u;
  };
  for (let i = 7; i >= 0; i--) {
    c.fillStyle = mixLab(paper, m.set, 0.18 + i * 0.07);
    c.beginPath();
    pagePath(c, cx - pw - 2 - i * 0.6, cx + pw + 2 + i * 0.6, top + i * 1.2, bot + 2 + i * 1.6, sag);
    c.fill();
    c.strokeStyle = withAlpha(m.fg, 0.18);
    c.lineWidth = 0.6;
    c.stroke();
  }
  // the two pages, each curving down into the gutter (curved top and bottom edges, a soft shadow)
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? cx - pw : cx;
    c.save();
    c.beginPath();
    pagePath(c, x0, x0 + pw, top, bot, sag);
    c.fillStyle = paper;
    c.fill();
    c.clip();
    const g = c.createLinearGradient(side < 0 ? cx - 90 : cx + 90, 0, cx, 0);
    g.addColorStop(0, withAlpha(m.set, 0));
    g.addColorStop(0.6, withAlpha(m.set, 0.26));
    g.addColorStop(1, withAlpha(m.fg, 0.62));
    c.fillStyle = g;
    c.fillRect(side < 0 ? cx - 90 : cx, top - 20, 90, ph + 40);
    // the page lifts a little at its fore-edge: a faint highlight just inside the outer edge
    const hx = side < 0 ? cx - pw : cx + pw;
    const hg = c.createLinearGradient(hx, 0, hx - side * 40, 0);
    hg.addColorStop(0, withAlpha(m.fg, 0.16));
    hg.addColorStop(0.3, withAlpha(m.core, 0.05));
    hg.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = hg;
    c.fillRect(Math.min(hx, hx - side * 40), top - 20, 40, ph + 40);
    // the far page sits outside the hot spot: about a third darker toward its outer edge
    if (side > 0) {
      const rg = c.createLinearGradient(cx, 0, cx + pw, 0);
      rg.addColorStop(0, withAlpha(m.fg, 0.12));
      rg.addColorStop(1, withAlpha(m.fg, 0.38));
      c.fillStyle = rg;
      c.fillRect(cx, top - 20, pw, ph + 40);
    }
    c.restore();
  }
  // the gutter crease
  c.strokeStyle = withAlpha(m.fg, 0.55);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(cx, top + 10);
  c.lineTo(cx, bot + 10);
  c.stroke();
  const ink = mixLab(m.ink, paper, 0.12);
  const grey = withAlpha(mixLab(m.ink, paper, 0.55), 0.55);
  const greek = (x: number, y: number, w: number) => {
    c.fillStyle = grey;
    c.fillRect(x, y - 4, w, 3.2);
  };
  // LEFT PAGE: running head, the alphabet figure (typeface A), its frame, then body text with the sentence
  const L0 = PAGE_L.x + 24, L1 = PAGE_L.x + BOOK.pw - 24;
  greek(L0 + 120, 160, 112);
  c.strokeStyle = withAlpha(ink, 0.6);
  c.lineWidth = 0.9;
  c.strokeRect(L0, 178, L1 - L0, 156);
  const cw = (L1 - L0) / 13;
  c.fillStyle = ink;
  c.font = `600 21px ${FONT.display}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  for (let i = 0; i < 26; i++) c.fillText(ALPHA[i], L0 + cw * (i % 13 + 0.5), i < 13 ? 214 : 242);
  greek(L0 + 70, 352, 212);
  const body = (y0: number, n: number, last?: number) => {
    for (let i = 0; i < n; i++) greek(L0, y0 + i * 19, i === n - 1 && last ? last : L1 - L0);
  };
  body(386, 3, 230);
  greek(L0 + SENT_W[1] + 6, SENT_Y[1], L1 - L0 - SENT_W[1] - 6);
  body(506, 7, 160);
  // page number
  greek((L0 + L1) / 2 - 10, 640, 20);

  // RIGHT PAGE: the figure — Rosenblatt's own layout: a retina of S-points (squares), sparse RANDOM wires
  // to the A-units, every A-unit wired to ONE R-unit; the error correction (dashed) comes back from R only
  // as far as the A→R wires (the last layer's knobs, as in ch03-s04). Not a picture of modern backprop.
  const R0 = PAGE_R.x + 24, R1 = PAGE_R.x + BOOK.pw - 24;
  greek(R0 + 110, 160, 132);
  c.strokeStyle = withAlpha(ink, 0.6);
  c.lineWidth = 0.9;
  c.strokeRect(R0, 178, R1 - R0, 240);
  const S: { x: number; y: number }[] = [];
  for (let r = 0; r < 6; r++) for (let q = 0; q < 4; q++) S.push({ x: R0 + 26 + q * 15, y: 214 + r * 25 });
  const A = Array.from({ length: 7 }, (_, i) => ({ x: R0 + 188, y: 210 + i * 26 }));
  const R = { x: R1 - 46, y: 288 };
  c.strokeStyle = withAlpha(ink, 0.4);
  c.lineWidth = 0.7;
  for (let i = 0; i < S.length; i++)
    for (let j = 0; j < A.length; j++) {
      if (hash1(i * 13 + j * 7, 911) < 0.62) continue; // sparse, random S→A wiring (fixed, not learned)
      c.beginPath();
      c.moveTo(S[i].x + 5, S[i].y);
      c.lineTo(A[j].x - 6, A[j].y);
      c.stroke();
    }
  c.strokeStyle = withAlpha(ink, 0.75);
  c.lineWidth = 1.1;
  for (const a of A) {
    c.beginPath();
    c.moveTo(a.x + 6, a.y);
    c.lineTo(R.x - 10, R.y);
    c.stroke();
  }
  c.fillStyle = ink;
  for (const p of S) c.fillRect(p.x - 5, p.y - 5, 10, 10);
  for (const a of A) {
    c.beginPath();
    c.arc(a.x, a.y, 6, 0, Math.PI * 2);
    c.fill();
  }
  c.beginPath();
  c.arc(R.x, R.y, 10, 0, Math.PI * 2);
  c.fill();
  // tiny unit letters under each column
  c.font = `italic 400 12px ${FONT.text}`;
  c.textAlign = 'center';
  c.fillStyle = withAlpha(ink, 0.8);
  c.fillText('S', R0 + 48, 382);
  c.fillText('A', A[0].x, 382);
  c.fillText('R', R.x, 382);
  // the error correction: dashed, from R back onto the A→R wires only (it stops short of the A-units)
  const ex = (A[0].x + R.x) / 2 + 8;
  c.strokeStyle = withAlpha(ink, 0.85);
  c.lineWidth = 1.3;
  c.setLineDash([5, 4]);
  c.beginPath();
  c.moveTo(R.x, R.y + 14);
  c.quadraticCurveTo(R.x - 4, 372, ex + 14, 366);
  c.quadraticCurveTo(ex - 6, 362, ex - 4, 336);
  c.stroke();
  c.setLineDash([]);
  c.beginPath();
  c.moveTo(ex - 4, 330);
  c.lineTo(ex - 9, 340);
  c.moveTo(ex - 4, 330);
  c.lineTo(ex + 2, 339);
  c.stroke();
  // the caption, in caps
  c.fillStyle = ink;
  c.font = `600 ${CAP_PX}px ${FONT.display}`;
  c.textAlign = 'center';
  c.letterSpacing = '1.2px';
  CAPTION.forEach((ln, i) => c.fillText(ln, (R0 + R1) / 2, CAP_Y[i]));
  c.letterSpacing = '0px';
  for (let i = 0; i < 5; i++) greek(R0, 548 + i * 19, i === 4 ? 150 : R1 - R0);
  greek((R0 + R1) / 2 - 10, 640, 20);
}

/** the second typeface (typed caps): half its letters blur and smear as the page settles (u 0 → 1) */
function alphabet(c: C, env: PaintEnv, u: number, tq: number) {
  // the smear is re-cut on every drawing (twos): each ghost shifts 1–2 px, so the limit stays alive
  const tick = Math.round(tq * 12);
  const L0 = PAGE_L.x + 24, L1 = PAGE_L.x + BOOK.pw - 24;
  const cw = (L1 - L0) / 13;
  const paper = pagePaper(env);
  const ink = mixLab(env.mood.ink, paper, 0.12);
  c.save();
  c.font = `400 20px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  for (let i = 0; i < 26; i++) {
    const x = L0 + cw * (i % 13 + 0.5), y = i < 13 ? 286 : 316;
    const sm_ = SMEAR.has(i) ? u * (0.6 + 0.4 * Math.sin(i * 2.1) ** 2) : 0;
    if (sm_ <= 0.01) {
      c.globalAlpha = 1;
      c.fillStyle = ink;
      c.fillText(ALPHA[i], x, y);
      continue;
    }
    // a smear: the letter dragged sideways and down into ghosts of itself, its core fading
    const d = 9 * sm_;
    for (let k = 0; k < 6; k++) {
      const jx = hash1(i * 17 + k * 5 + tick * 131, 71) * 1.6 * sm_, jy = hash1(i * 23 + k * 3 + tick * 97, 72) * 0.9 * sm_;
      c.globalAlpha = (0.42 - k * 0.05) * (0.4 + 0.6 * sm_);
      c.fillStyle = ink;
      c.fillText(ALPHA[i], x + (k - 1.5) * d * 0.45 + jx, y + k * d * 0.12 + jy);
    }
    c.globalAlpha = 1 - 0.6 * sm_;
    c.fillText(ALPHA[i], x, y);
  }
  c.restore();
}

function captionGlint(c: C, env: PaintEnv, t: number, at: number) {
  const u = (t - (at - 0.1)) / 0.9;
  const hold = win(t, at, at + 0.4) * (1 - win(t, at + 1.4, at + 2.6));
  const R0 = PAGE_R.x + 24, R1 = PAGE_R.x + BOOK.pw - 24;
  c.save();
  c.globalCompositeOperation = 'lighter';
  // a warm wash that stays a moment on the caption
  if (hold > 0) {
    const g = c.createRadialGradient((R0 + R1) / 2, 486, 10, (R0 + R1) / 2, 486, 190);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.2 * hold));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect((R0 + R1) / 2 - 190, 486 - 190, 380, 380);
  }
  // the sweep of light along the lines: the band glides on and off (it never meets a hard edge; it fades in
  // and out at the ends of its travel)
  if (u > 0 && u < 1) {
    const sx = lerp(R0 + 40 + 46, R1 - 40 - 46, sm(u));
    const fade = Math.sin(Math.PI * u);
    // a soft elliptical band (no hard edge on any side)
    const cy = (CAP_Y[0] + CAP_Y[2]) / 2 - 6, hy = (CAP_Y[2] - CAP_Y[0]) / 2 + 26;
    c.translate(sx, cy);
    c.scale(1, hy / 46);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 46);
    g.addColorStop(0, withAlpha(env.mood.core, 0.24 * fade));
    g.addColorStop(0.55, withAlpha(env.mood.core, 0.12 * fade));
    g.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(-46, -46, 92, 92);
  }
  c.restore();
}

/** the sentence's printed extent on the page (14 px book type): line 1 indented */
const SENT_W = [292, 196];
function sentenceLines(c: C, env: PaintEnv, k: number) {
  if (k <= 0.01) return;
  const L0 = PAGE_L.x + 24;
  const ink = mixLab(env.mood.ink, pagePaper(env), 0.42);
  c.save();
  c.fillStyle = withAlpha(ink, 0.62 * k);
  c.fillRect(L0 + 20, SENT_Y[0] - 4.5, SENT_W[0], 3.4);
  c.fillRect(L0, SENT_Y[1] - 4.5, SENT_W[1], 3.4);
  c.restore();
}

function sentenceGlow(c: C, env: PaintEnv, k: number) {
  if (k <= 0) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const cx = PAGE_L.x + 160, cy = (SENT_Y[0] + SENT_Y[1]) / 2 - 5;
  c.translate(cx, cy);
  c.scale(3.6, 1);
  const g = c.createRadialGradient(0, 0, 2, 0, 0, 52);
  g.addColorStop(0, withAlpha(env.mood.core, 0.28 * k));
  g.addColorStop(0.6, withAlpha(env.mood.halo, 0.12 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(-52, -52, 104, 104);
  c.restore();
}

/** the oxblood question mark, stamped beside the caption (low-chroma, ink-textured) */
function questionMark(c: C, env: PaintEnv, k: number) {
  const ox = OXBLOOD;
  c.save();
  c.globalAlpha = 0.92 * k;
  c.translate(QMARK.x, QMARK.y);
  c.rotate(0.12);
  c.font = `700 46px ${FONT.display}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = ox;
  c.fillText('?', 0, 0);
  // the rubber stamp's frame, a little uneven
  c.strokeStyle = withAlpha(ox, 0.8);
  c.lineWidth = 1.6;
  c.beginPath();
  c.roundRect(-17, -24, 34, 46, 4);
  c.stroke();
  c.restore();
}

/** the manila file, top-down: back panel with earlier slips' edges, the front cover lying open below the
 *  spine; flap 0 (open) → 1 (closed over the panel) */
function folder(c: C, env: PaintEnv, o: { flap: number; carbonIn: boolean }) {
  const m = env.mood;
  const { x, y, w, h } = FOLDER;
  const manila = mixLab(mixLab(m.halo, '#b08a52', 0.45), m.set, 0.15);
  const inside = mixLab(manila, m.rim, 0.12);
  const spine = y + h;
  // contact shadow + back panel + tab
  c.fillStyle = withAlpha(m.fg, 0.45);
  c.fillRect(x + 8, y + 10, w, h);
  c.fillStyle = inside;
  c.fillRect(x, y, w, h);
  c.fillRect(x + 26, y - 22, 104, 24);
  // the earlier slips (two refrains already filed): their edges, a little askew
  for (let i = 0; i < 2; i++) {
    c.save();
    c.translate(x + w / 2, y + 60 + i * 16);
    c.rotate(-0.02 + i * 0.03);
    c.fillStyle = withAlpha(m.fg, 0.3);
    c.fillRect(-w * 0.38 + 3, -8 + 4, w * 0.76, 120);
    c.fillStyle = mixLab(pagePaper(env), '#efe5d2', 0.2 + i * 0.2);
    c.fillRect(-w * 0.38, -8, w * 0.76, 120);
    c.fillStyle = withAlpha(m.ink, 0.35);
    for (let j = 0; j < 3; j++) c.fillRect(-w * 0.3, 8 + j * 12, w * (0.5 - j * 0.1), 2.4);
    c.restore();
  }
  if (o.carbonIn) carbonSlip(c, env, x + 40, y + 110, -0.04);
  // the front cover: rotating about the spine (a = π·flap), projected top-down
  const a = Math.PI * o.flap;
  const edgeY = spine + h * Math.cos(a);
  const y0 = Math.min(spine, edgeY), y1 = Math.max(spine, edgeY);
  const showInside = o.flap < 0.5;
  const tilt = Math.abs(Math.cos(a));
  c.fillStyle = mixLab(showInside ? inside : manila, m.set, 0.35 * (1 - tilt));
  c.fillRect(x, y0, w, y1 - y0);
  // the moving cover reads as a separate leaf: its leading edge casts a soft shadow onto what it is about to
  // cover, and the edge itself catches the lamp
  if (o.flap > 0.02 && o.flap < 0.98) {
    const dir = edgeY < spine ? -1 : 1;
    const sh = c.createLinearGradient(0, edgeY, 0, edgeY + dir * 34);
    sh.addColorStop(0, withAlpha(m.fg, 0.5 * tilt + 0.2));
    sh.addColorStop(1, withAlpha(m.fg, 0));
    c.fillStyle = sh;
    c.fillRect(x, Math.min(edgeY, edgeY + dir * 34), w, 34);
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.75);
    c.fillRect(x, edgeY - 1.5, w, 3);
    // the cover's outside is a shade darker than the panel it closes over
    if (!showInside) {
      c.fillStyle = withAlpha(m.fg, 0.16);
      c.fillRect(x, y0, w, y1 - y0);
    }
  }
  c.fillStyle = withAlpha(m.rim, 0.25);
  c.fillRect(x, spine - 0.6, w, 1.2);
  if (!showInside && tilt > 0.6) {
    // the closed cover's own tab line + a crease
    c.fillStyle = withAlpha(m.fg, 0.25);
    c.fillRect(x + 12, y0 + 14, w - 24, 1.2);
  }
  // the file lies at the pool's edge: its far half in shadow
  const sg = c.createLinearGradient(x + w * 0.25, 0, x + w + 10, 0);
  sg.addColorStop(0, withAlpha(m.fg, 0));
  sg.addColorStop(0.55, withAlpha(m.fg, 0.32));
  sg.addColorStop(1, withAlpha(m.fg, 0.55));
  c.fillStyle = sg;
  c.fillRect(x, y - 30, w + 12, h * 2 + 40);
}

/** the carbon copy: thin, blue-black, faintly lettered */
function carbonSlip(c: C, env: PaintEnv, x: number, y: number, rot: number) {
  const m = env.mood;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(3, 4, 230, 58);
  c.fillStyle = mixLab(mixLab(m.ink, '#1d2433', 0.6), m.set, 0.25);
  c.fillRect(0, 0, 230, 58);
  c.fillStyle = withAlpha(m.rim, 0.35);
  c.font = `italic 400 12px ${FONT.text}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText('“Linguistic capability, related to perceptual', 12, 24);
  c.fillText('experience, is of the essence…”', 12, 42);
  c.fillStyle = withAlpha(m.rim, 0.25);
  c.fillRect(0, 0, 230, 1);
  c.restore();
}

/** the green-shaded lamp's SHADE, seen from above-front in the near plane at the frame's top-left: a long
 *  glass cone pointing down at the spread, its mouth's near lip catching the bulb (a hot rim), the brass arm
 *  running back off frame. Local coords: (0, 0) = the screen's top-left corner at the mid-shot camera. */
const SHADE = (() => {
  const A = { x: -110, y: -110 }, M = { x: 170, y: 130 };
  const L = Math.hypot(M.x - A.x, M.y - A.y);
  const d = { x: (M.x - A.x) / L, y: (M.y - A.y) / L };
  const p = { x: -d.y, y: d.x };
  return { A, M, d, p, wA: 52, wM: 168, ry: 52, rot: Math.atan2(p.y, p.x) };
})();
function lampShade(c: C, env: PaintEnv) {
  const m = env.mood;
  const { A, M, d, p, wA, wM, ry, rot } = SHADE;
  const glass = mixLab(m.fg, MOODS.labGreen.set, 0.45);
  // the brass arm and its knuckle, back up off frame
  c.strokeStyle = m.fg;
  c.lineCap = 'round';
  c.lineWidth = 26;
  c.beginPath();
  c.moveTo(A.x - d.x * 20, A.y - d.y * 20);
  c.lineTo(A.x - d.x * 260 + p.x * 40, A.y - d.y * 260 + p.y * 40);
  c.stroke();
  // the cone: apex collar → mouth, plus the mouth's ellipse
  c.fillStyle = glass;
  c.beginPath();
  c.moveTo(A.x + p.x * wA, A.y + p.y * wA);
  c.lineTo(M.x + p.x * wM, M.y + p.y * wM);
  c.ellipse(M.x, M.y, wM, ry, rot, 0, Math.PI, true);
  c.lineTo(A.x - p.x * wA, A.y - p.y * wA);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(M.x, M.y, wM, ry, rot, 0, Math.PI * 2);
  c.fill();
  // the green glass's sheen: a long highlight along the cone's upper flank
  const sh = c.createLinearGradient(A.x + p.x * wA, A.y + p.y * wA, A.x - p.x * wA, A.y - p.y * wA);
  sh.addColorStop(0, withAlpha(MOODS.labGreen.rim, 0));
  sh.addColorStop(0.3, withAlpha(MOODS.labGreen.rim, 0.22));
  sh.addColorStop(0.55, withAlpha(MOODS.labGreen.rim, 0));
  c.fillStyle = sh;
  c.beginPath();
  c.moveTo(A.x + p.x * wA, A.y + p.y * wA);
  c.lineTo(M.x + p.x * wM, M.y + p.y * wM);
  c.lineTo(M.x - p.x * wM, M.y - p.y * wM);
  c.lineTo(A.x - p.x * wA, A.y - p.y * wA);
  c.closePath();
  c.fill();
  // the collar at the apex
  c.strokeStyle = withAlpha(m.rim, 0.35);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(A.x + p.x * (wA + 4), A.y + p.y * (wA + 4));
  c.lineTo(A.x - p.x * (wA + 4), A.y - p.y * (wA + 4));
  c.stroke();
  // the mouth's near lip, lit hot by the bulb inside
  c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.5), 0.95);
  c.lineWidth = 6;
  c.beginPath();
  c.ellipse(M.x, M.y, wM, ry, rot, Math.PI * 1.04, Math.PI * 1.96);
  c.stroke();
  c.strokeStyle = withAlpha(m.core, 0.8);
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(M.x, M.y, wM - 2, ry - 2, rot, Math.PI * 1.15, Math.PI * 1.85);
  c.stroke();
}

/** the bulb's spill out of the shade's mouth (additive, per frame) */
function lampMouthGlow(c: C, env: PaintEnv, at: { x: number; y: number }) {
  const { M, d } = SHADE;
  const x = at.x + M.x + d.x * 70, y = at.y + M.y + d.y * 70;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 10, x, y, 260);
  g.addColorStop(0, withAlpha(env.mood.core, 0.22));
  g.addColorStop(0.4, withAlpha(env.mood.halo, 0.08));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - 260, y - 260, 520, 520);
  c.restore();
}

/** the desk blotter's near corner (L5, local (0,0) = just past the frame's lower-right corner at the mid-shot
 *  camera): a leather pad whose STRAIGHT top edge enters ≈18% of the frame width from the right, its stitched
 *  leather corner-guard, and a 1 px rim where the lamp grazes the top edge */
function blotterCorner(c: C, env: PaintEnv) {
  const m = env.mood;
  const TL = { x: -232, y: -96 }, TR = { x: 420, y: -112 }, BL = { x: -268, y: 320 };
  // the pad
  c.fillStyle = mixLab(m.fg, m.set, 0.12);
  c.beginPath();
  c.moveTo(TL.x, TL.y);
  c.lineTo(TR.x, TR.y);
  c.lineTo(TR.x, 320);
  c.lineTo(BL.x, BL.y);
  c.closePath();
  c.fill();
  // the leather corner-guard: a darker triangle over the pad's corner, its diagonal edge stitched
  const g1 = { x: TL.x + 120, y: TL.y - 3 }, g2 = { x: TL.x - 12, y: TL.y + 116 };
  c.fillStyle = m.fg;
  c.beginPath();
  c.moveTo(TL.x - 3, TL.y - 2);
  c.lineTo(g1.x, g1.y);
  c.lineTo(g2.x, g2.y);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.16);
  c.lineWidth = 1;
  c.setLineDash([5, 4]);
  c.beginPath();
  c.moveTo(g1.x - 10, g1.y + 7);
  c.lineTo(g2.x + 5, g2.y - 10);
  c.stroke();
  c.setLineDash([]);
  // the top edge's rim (and a touch down the left edge): the lamp grazing the leather
  c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.3), 0.55);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(TL.x + (BL.x - TL.x) * 0.12, TL.y + (BL.y - TL.y) * 0.12);
  c.lineTo(TL.x, TL.y);
  c.lineTo(TR.x, TR.y);
  c.stroke();
}

/** the tilt's near-plane wipe: a dark shelf board in front of the lens slides DOWN the frame (the camera tilting
 *  up past it) and covers the cut for two frames; its lit lower edge leads */
function shelfWipe(f: Frame, t: number, cut: number) {
  const span = 0.44;
  const H = 980, Y0 = -H - 40, Y1 = 760;
  const uCut = (-Y0 - H * 0.5 + 360) / (Y1 - Y0);
  const t0 = cut - uCut * span;
  if (t < t0 || t > t0 + span) return;
  const u = (t - t0) / span;
  const y = lerp(Y0, Y1, u);
  const c = f.c;
  const m = f.mood;
  c.save();
  const g = c.createLinearGradient(0, y, 0, y + H);
  g.addColorStop(0, withAlpha(m.fg, 0));
  g.addColorStop(0.04, withAlpha(m.fg, 0.95));
  g.addColorStop(0.95, m.fg);
  g.addColorStop(1, withAlpha(m.fg, 0));
  c.fillStyle = g;
  c.fillRect(-10, y, 1300, H);
  // the board's front edge (its lower edge) catching the lamp, out of focus
  const e = c.createLinearGradient(0, y + H * 0.93, 0, y + H * 0.97);
  e.addColorStop(0, withAlpha(m.rim, 0));
  e.addColorStop(0.5, withAlpha(m.rim, 0.12));
  e.addColorStop(1, withAlpha(m.rim, 0));
  c.fillStyle = e;
  c.fillRect(-10, y + H * 0.93, 1300, H * 0.04);
  c.restore();
}

/** the carbon's resting place inside the open file (L4 world): centre, size, tilt (see folder()) */
const CARBON = { x: FOLDER.x + 40 + 115, y: FOLDER.y + 110 + 29, w: 230, h: 58, rot: -0.04 };

/** the sentence lifts from the left page as a quote card and holds through the quote; on "Put that in the
 *  file" it flies straight from its rest into the open file, shrinking and darkening into the carbon copy,
 *  and lands on 'file' (no text ever dissolves over other text) */
function quoteLift(f: Frame, sc: Scene, t: number, cam: Camera3) {
  const b = sc.b;
  const up = sm((t - b.lift0) / (b.lift1 - b.lift0));
  if (up <= 0 || t >= b.file) return;
  const fly = Math.max(0, Math.min(1, (t - b.settle0) / (b.file - b.settle0)));
  const fe = fly * fly * (3 - 2 * fly) * 0.35 + fly * fly * 0.65; // eases out of the hold, accelerates into the drop
  const c = f.c;
  const m = f.mood;
  // where the sentence sits on screen now (the page rect) → the card's rest
  const a = toScreen(LAYERS.L4, cam, PAGE_L.x + BOOK.pw / 2, (SENT_Y[0] + SENT_Y[1]) / 2 - 5);
  const s0 = ((BOOK.pw - 30) * a.k) / CARD.w;
  let cx = lerp(a.x, CARD.cx, up), cy = lerp(a.y, CARD.cy, up) - Math.sin(Math.PI * up) * 30;
  let sw = lerp(s0, 1, up), sh = sw;
  let rot = -0.012 * (1 - up);
  let lift = up; // height above the desk (drives the shadow)
  if (fly > 0) {
    const d = toScreen(LAYERS.L4, cam, CARBON.x, CARBON.y);
    cx = lerp(CARD.cx, d.x, fe);
    cy = lerp(CARD.cy, d.y, fe) - Math.sin(Math.PI * fe) * 50;
    sw = lerp(1, (CARBON.w * d.k) / CARD.w, fe);
    sh = lerp(1, (CARBON.h * d.k) / CARD.h, fe);
    rot = lerp(0, CARBON.rot, fe);
    lift = 1 - fe;
  }
  const alpha = Math.min(1, up * 3);
  const ATTR = '— rosenblatt, 1961';
  const attrPx = legibleSize(c, `600 22px ${FONT.sc}`, 22, ATTR);
  c.save();
  c.globalAlpha = alpha;
  // the lifted card's shadow on the desk: grows with the lift, tightens as it lands
  const so = 4 + 26 * lift;
  c.fillStyle = withAlpha(m.fg, 0.38 * Math.max(lift, 0.3));
  c.filter = `blur(${(3 + 17 * lift) * f.pxScale}px)`;
  c.fillRect(cx - (CARD.w * sw) / 2 + so, cy - (CARD.h * sh) / 2 + so * 1.2, CARD.w * sw, CARD.h * sh);
  c.filter = 'none';
  c.translate(cx, cy);
  c.rotate(rot);
  c.scale(sw, sh);
  const paper0 = mixLab(pagePaper({ mood: m } as PaintEnv), '#f1e8d6', 0.55);
  const carbon = mixLab(mixLab(m.ink, '#1d2433', 0.6), m.set, 0.25);
  const paper = mixLab(paper0, carbon, sm(fly * 1.25));
  c.fillStyle = paper;
  c.fillRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h);
  c.fillStyle = withAlpha(m.fg, 0.12);
  c.fillRect(-CARD.w / 2, CARD.h / 2 - 3, CARD.w, 3);
  // the type: ink on paper → the carbon's faint pale lettering
  const ink = mixLab(mixLab(m.ink, paper0, 0.08), m.rim, sm(fly * 1.25) * 0.45);
  c.globalAlpha = alpha * (1 - 0.6 * sm(fly * 1.25));
  c.fillStyle = ink;
  c.font = `italic 400 29px ${FONT.text}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText('“Linguistic capability, related to perceptual', 0, -24);
  c.fillText('experience, is of the essence…”', 0, 14);
  const ka = win(t, b.lift1, b.lift1 + 0.5) * (1 - win(t, b.settle0, b.settle0 + 0.3));
  if (ka > 0) {
    c.globalAlpha = alpha * (0.35 + 0.65 * ka) * (fly > 0 ? ka : 1);
    c.font = `600 ${attrPx}px ${FONT.sc}`;
    c.letterSpacing = '2px';
    c.fillStyle = mixLab(ink, paper, 0.18);
    c.fillText(ATTR, 0, 60);
    c.letterSpacing = '0px';
  }
  c.restore();
}

// =====================================================================================================
// THE STUDY: the board (C1-c), then the Wall (W3)
// =====================================================================================================
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };

function paintBoard(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.boardCam(t);
  f.camera(cam);
  // the STUDY LOCK amber lands ON the board (from the cut)
  f.setMood('candleAmber', { from: 'labGreen', u: win(t, b.cut, b.cut + STUDY_FADE) });
  studyRoom(f, { key: ID, cams: sc.STUDY_CAMS, outside: { mood: 'labGreen', kind: 'night' } });
  const st = boardStateAt(ID, 'start');
  const def = SLOTS['C1-c'];
  const pinPt = slotWorld('C1-c', 'pin');
  const ctr = slotWorld('C1-c', 'centre');
  const u = (tq - b.pin0) / b.pinDur;
  // the hand comes in from the frame's lower right and grips the card by its RIGHT EDGE (below the oxblood
  // '?'), so the forearm lies over the cork below-right of the card and never covers the typing or the clue
  const k = STUDY.board.k;
  const grip = { x: ctr.x + (def.w / 2 - 5) * k, y: ctr.y + def.h * 0.4 * k };
  const entry = handsEntry(cam, 'L4');
  const hp = u > 0 && u < 1 ? hands.act('pin', u, grip, { held: 'card', scale: 0.8, entry }) : null;
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: { state: st, hide: ['C1-c'] },
    wall: false,
    shelf: false,
    xray: false,
    extra: (c, env) => {
      const light = poolAt(POOL, def.x, def.y);
      if (u >= 0.45) {
        const dt = tq - (b.pin0 + 0.45 * b.pinDur);
        c.save();
        c.translate(pinPt.x, pinPt.y);
        c.rotate(pinSway(dt));
        c.translate(-pinPt.x, -pinPt.y);
        drawCard(c, def, { x: ctr.x, y: ctr.y, k, light }, env);
        cardQ(c, def, { x: ctr.x, y: ctr.y, k });
        c.restore();
      }
      if (hp)
        hands.draw(c, hp, env, {
          heldDraw: (cc, at, _h, e) => {
            const o = { x: at.x - grip.x + ctr.x, y: at.y - grip.y + ctr.y, k };
            drawCard(cc, def, { ...o, light: 0.85, pin: false }, e);
            cardQ(cc, def, o);
          },
        });
    },
  });
  lampSpill(f, win(t, b.cut, b.cut + 0.5));
}

/** C1-c's question-mark tag re-inked at full oxblood value (over the shared card's pale tag) */
function cardQ(c: C, def: { id: string; w: number; h: number }, o: { x: number; y: number; k: number }) {
  const w = def.w * o.k, h = def.h * o.k;
  const seedRot = hash1(def.id.length * 31 + def.id.charCodeAt(def.id.length - 1), 17) * 0.025;
  c.save();
  c.translate(o.x, o.y);
  c.rotate(seedRot);
  c.fillStyle = OXBLOOD;
  c.font = `700 ${17 * o.k}px ${FONT.display}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', w / 2 - 9 * o.k, -h / 2 + 12 * o.k);
  c.restore();
}

/** the Wall pin: in (U 0 → .6, the pin lands at .45) over `dIn`, then a brisk exit (U .6 → 1) over `dOut` */
function wallPinU(tq: number, t0: number, dIn: number, dOut: number) {
  const x = tq - t0;
  if (x <= 0) return 0;
  if (x < dIn) return (0.6 * x) / dIn;
  return Math.min(1, 0.6 + (0.4 * (x - dIn)) / dOut);
}

function paintWall(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.wallCam(t);
  f.camera(cam);
  f.setMood('candleAmber');
  studyRoom(f, { key: ID, cams: sc.STUDY_CAMS, outside: { mood: 'labGreen', kind: 'night' } });
  const k = STUDY.wall.k;
  const s2 = WALL_SLOTS.W2, s3 = WALL_SLOTS.W3;
  const c2 = { x: STUDY.wall.x + s2.x * k, y: STUDY.wall.y + s2.y * k };
  const c3 = { x: STUDY.wall.x + s3.x * k, y: STUDY.wall.y + s3.y * k };
  const pin3 = wallSlotAt(STUDY.wall, 'W3');
  const u = wallPinU(tq, b.wpin0, b.wpinDur - WALL_EXIT, WALL_EXIT);
  const pinAt = b.wpin0 + (0.45 / 0.6) * (b.wpinDur - WALL_EXIT);
  // the hand holds the slip by its right edge (the typing stays in view the whole time)
  const grip3 = { x: c3.x + (s3.w / 2 - 5) * k, y: c3.y + s3.h * 0.2 * k };
  // the exit is a rigid slide of the resting hand DOWN and RIGHT off frame (away from the typing; the kit's own
  // exit swings the wrist back toward the entry, and its forearm then sweeps across the slip)
  const exitK = u > 0.6 ? (u - 0.6) / 0.4 : 0;
  const hp = u > 0 && u < 1 ? hands.act('pin', Math.min(u, 0.6), grip3, { held: 'slip', scale: 0.66, entry: handsEntry(cam, 'L4') }) : null;
  const sk = toScreen(LAYERS.L4, cam, grip3.x, grip3.y).k || 1;
  const exitOff = { x: (560 * exitK ** 1.6) / sk, y: (420 * exitK ** 1.6) / sk };
  const light3 = slotLight('W3');
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: false,
    shelf: false,
    wall: { hide: ['W2', 'W3'] },
    extra: (c, env) => {
      drawChessSlip(c, { x: c2.x, y: c2.y, k, light: slotLight('W2'), tagSway: 0.02 * Math.sin(t * 1.3) }, env);
      if (u >= 0.45) {
        const dt = tq - pinAt;
        c.save();
        c.translate(pin3.x, pin3.y);
        c.rotate(pinSway(dt));
        c.translate(-pin3.x, -pin3.y);
        drawSlip(c, W3_VIEW, { x: c3.x, y: c3.y, k, light: light3 }, env);
        c.restore();
      }
      if (hp) {
        c.save();
        c.translate(exitOff.x, exitOff.y);
        hands.draw(c, hp, env, { heldDraw: (cc, at, _h, e) => drawSlip(cc, W3_VIEW, { x: at.x - grip3.x + c3.x, y: at.y - grip3.y + c3.y, k, light: 0.85, pin: false }, e) });
        c.restore();
      }
    },
  });
  // the lamp pools on W2–W3; the far Wall falls into shadow
  const p = toScreen(LAYERS.L4, cam, (c2.x + c3.x) / 2, (c2.y + c3.y) / 2);
  const c = f.c;
  c.save();
  const g = c.createRadialGradient(p.x, p.y, 160 * p.k, p.x, p.y, 900);
  g.addColorStop(0, withAlpha(f.mood.fg, 0));
  g.addColorStop(1, withAlpha(f.mood.fg, 0.42));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  c.restore();
  lampSpill(f);
}
