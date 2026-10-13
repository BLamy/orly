/**
 * ch09-s03 — Seoul, March 2016: ghost human games, then self-play under a reward pulse; move 37 lands with a ring
 * of light, and Lee Sedol's equally rare wedge answers it; then home to the study, where the Go candle goes out
 * (duskRose → candleAmber; 23.04 s; in: paper wipe out of the Coulom slip's grain).
 * Board positions are the real match records (game 2 before move 37, game 4 before move 78: sets/ch09-s03-go.ts).
 *
 *   WIDE  0       the wipe clears onto a Go board under a low hanging lamp. Lee Sedol sits on the left, chin in hand,
 *                 leaning in; the machine's side is darkness at the pool's edge (its stones simply arrive). Beyond the
 *                 pool, behind the machine's side, a small slight man in a dark jacket stands at a cool screen.
 *                 SEOUL · MARCH 2016 and Lee's name card set in (lower edge) in the lead-in
 *         'DeepMind's' the screen glow brightens on Hassabis; his name card. 'AlphaGo': 'AlphaGo · DeepMind (Google)'
 *   TOP   'human' (the TEACHING image: square-on, the grid fills the frame, lit only by the lamp) a riffle of thin
 *                 paper sheets, each a faint human game, flickers over the grid and settles
 *         'itself' the sheets clear; an anonymous hand from the machine's side sets stones for BOTH colours, fast
 *         'wins'  one warm pulse runs back from the last stone through the whole game (the reward); the grid goes plain
 *   WIDE  'Seoul' the hall again, a game under way
 *   TOP   'thirty-seven' the hand sets a black stone on the fifth line, far from the fighting; a ring of light
 *                 spreads across the grid; 'one-in-ten-thousand': '1 in 10,000' stamps beside it
 *   WIDE  Lee's chair is empty for a beat (he left the room), then he is back
 *   CLOSE 'found' his hand places a white stone in a narrow gap (move 78, the wedge): the same ring, the same caption
 *   WIDE  the machine's side still; Lee upright; wordless, the lids go on both bowls
 *   STUDY candleWipe: paper wipe home (duskRose → candleAmber under the wipe) CLOSE on the Coulom slip in slot 5 (its
 *                 typed DUE 2024 legible): the pin GLINTS (it came true about eight years early); then the shelf: the
 *                 small candle A GO MACHINE IS A DECADE AWAY is snuffed cleanly, a thread of smoke rises, its dark
 *                 sleeve two rings tall, its tag 2014–2016; its label turns to the viewer (the candle naming card:
 *                 lit 2014 · out 2016 · 2 years) and holds.
 *
 * Depth: the board close-ups carry a near plane (the two stone bowls, L5, and the hanging lamp's shade edge, L6) over
 * the table cloth (L2), so every push slides three planes.
 *
 * Name cards and the stamp are screen overlays at the lower edge, through every framing, until the wipe home.
 * Accent: Hassabis's cool screen (serverCyan) is the one saturated light; the lamp is the mood's own warmth.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { FONT, LAYERS, MOODS, PUPPET_NEAR_BLACK, defineShot, dustMotes, mixLab, nameCard, paperWipe, placeStamp, pose, softPlate, toScreen, withAlpha, withLife } from '../../../film';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { cast } from '../cast';
import { STUDY, studyCase, studyRoom } from '../sets/study';
import { beliefCandle, namedLabel, shelfFlames } from '../sets/beliefCandle';
import { SHELF_ORDER, shelfStateAt } from '../sets/studyState';
import { GAME2, GAME4, M37, M78, SELFPLAY, SIDE, TOP, bowl, castHand, ghostGame, goSide, goTop, topXY, type Ring, type Stone } from '../sets/ch09-s03-go';
import { GO, W5C, W5S, coulomSlip, frameOn, goView, mixFrame, wallPool } from '../sets/ch09-s03a-kit';
import { clamp01, compositeSub, lerp, sm, subFrame, tq12, win } from '../sets/ch02-s05b-util';
import { makeCanvas } from '../../../film/silhouette/atmosphere';

type C = CanvasRenderingContext2D;
const ID = 'ch09-s03';
const CYAN = MOODS.serverCyan;

// ------------------------------------------------------------------------------------------------ the hall (L4 world)
const FLOOR = 640;
const TABLE = { x0: 548, x1: 772, top: SIDE.near + SIDE.slab };
const LEE = { x: 486, seat: FLOOR - 74 };
const LAMP = { x: SIDE.cx, y: 318 };
const HASS = { x: 900, y: 690, s: 0.72, screen: { x: 848, y: 548 } };
const LEE_P = cast['lee-sedol'];
const HASS_P = cast.hassabis;
const SEAT = { hipF: 88, kneeF: -86, hipB: 84, kneeB: -80 };
/** chin in hand, leaning in over the board */
const CHIN: Pose = pose({ ...SEAT, torso: 16, neck: 4, head: 4, shoulderF: 26, elbowF: 150, wristF: -30, shoulderB: 20, elbowB: 70 }, { handF: 'chin' });
/** upright, hands in his lap: the match's only human game won */
const UPRIGHT: Pose = pose({ ...SEAT, torso: 3, neck: 6, head: 0, shoulderF: 22, elbowF: 64, wristF: 0, shoulderB: 16, elbowB: 62 });
const HASS_POSE: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 1, neck: 8, head: 2, shoulderF: -12, elbowF: 30, shoulderB: -16, elbowB: 26 }, { handF: 'relaxed' });

// ------------------------------------------------------------------------------------------------ cameras
const WIDE0 = frameOn({ x: 690, y: 455 }, { x: 640, y: 360 }, 1.32);
const WIDE1 = frameOn({ x: 676, y: 462 }, { x: 640, y: 360 }, 1.4);
const TOPC0: Camera3 = { x: TOP.cx, y: TOP.cy, z: 0, lens: 1 };
const TOPC1: Camera3 = { x: TOP.cx + 6, y: TOP.cy + 4, z: 50, lens: 1 };
const T37a = frameOn(topXY(12, 9), { x: 640, y: 360 }, 1.1);
const T37b = frameOn(topXY(12.8, 9), { x: 640, y: 360 }, 1.3);
const GAP = topXY(M78.c, M78.r);
/** move 78 opens on exactly the move-37 framing (same scale, same position: a new game on the same board), then
 *  pushes in slowly toward the gap as Lee's hand comes in */
const CLOSE0 = T37b;
const CLOSE1 = frameOn(GAP, { x: 600, y: 340 }, 1.45);
/** CLOSE on the Coulom slip (its typed DUE 2024 at the legibility floor), as ch09-s03a left it before the grain */
const WALLC0 = frameOn(W5C, { x: 630, y: 352 }, 4.1);
const WALLC1 = frameOn(W5C, { x: 636, y: 356 }, 4.35);
const SHELFC0 = frameOn(GO.flame, { x: 560, y: 236 }, 1.5);
const SHELFC1 = frameOn(GO.flame, { x: 556, y: 250 }, 1.68);
const STUDY_CAMS = [WALLC0, WALLC1, SHELFC0, SHELFC1];

interface B {
  D: number;
  in: number;
  makers: number;
  machine: number;
  top0: number;
  human: number;
  itself: number;
  wins: number;
  wide2: number;
  top37: number;
  m37: number;
  rare: number;
  wide3: number;
  away0: number;
  away1: number;
  close: number;
  m78: number;
  wide4: number;
  lids: number;
  wipe0: number;
  wipe1: number;
  glint: number;
  dis0: number;
  dis1: number;
  snuff: number;
  selfTimes: number[];
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const human = T.beat('humanGames');
    const itself = T.beat('selfPlay');
    const wins = T.beat('reward');
    const m37 = T.beat('move37');
    const m78 = T.beat('move78');
    const wipe0 = T.beat('candleWipe');
    // self-play: the hand sets the stones from 'itself' until just before 'rewarded'
    const s0 = itself + 0.05, s1 = T.word('L0905b', 'rewarded') - 0.05;
    const selfTimes = SELFPLAY.map((_, i) => s0 + ((s1 - s0) * i) / (SELFPLAY.length - 1));
    const b: B = {
      D,
      in: T.beat('seoulIn'),
      makers: T.beat('makers'),
      machine: T.beat('machineCard'),
      // the ghost sheets start 0.2 s before 'human', so the cut lands a beat earlier
      top0: human - 0.55,
      human,
      itself,
      wins,
      // the reward pulse needs room to run back through every stone (≈ 1.2 s) before we leave the board
      wide2: T.line('L0905b').end + 0.55,
      top37: m37 - 0.7,
      m37,
      rare: T.beat('rare37'),
      // hold the top-down move-37 view and its '1 in 10,000' caption a full 2 s
      wide3: T.beat('rare37') + 2.0,
      // back in the wide, Lee's chair is empty for a beat (he left the room), then he is back
      away0: T.beat('rare37') + 1.7,
      away1: m78 - 0.95,
      close: m78 - 0.4,
      m78,
      wide4: m78 + 2.1,
      lids: T.beat('lids'),
      wipe0,
      wipe1: wipe0 + 0.62,
      // a clear 0.4 s star glint on the slot-5 pin; the snuff a touch early so the dark candle holds ≥ 1.5 s
      glint: T.beat('pinGlint') - 0.15,
      // round 1: a quick 0.2 s dissolve to the shelf, then the LIVE Go flame holds ≥ 0.3 s on screen before the snuff
      // (the viewer sees the flame go out, never arrives on a dark wick)
      dis0: T.beat('pinGlint') + 0.15,
      dis1: T.beat('pinGlint') + 0.35,
      snuff: Math.max(T.beat('pinGlint') + 0.7, T.beat('goSnuff') - 0.05),
      selfTimes,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    if (t < b.wipe0) {
      paintSeoul(f, b, t);
    } else if (t < b.wipe1) {
      // the paper wipe home: the Seoul hall lifts away like a sheet, the study is under it (mood under the wipe)
      const a = subFrame(f, `${ID}/seoul`, 'duskRose', (g) => paintSeoul(g, b, t));
      const s = subFrame(f, `${ID}/study`, 'candleAmber', (g) => paintStudy(g, b, t));
      const u = sm((t - b.wipe0) / (b.wipe1 - b.wipe0));
      f.setMood('candleAmber', { from: 'duskRose', u });
      paperWipe(f.c, a, s, u, { W: 1280, H: 720, pxScale: f.pxScale, seed: 9031, frame: f.frame, mood: f.mood });
    } else {
      paintStudy(f, b, t);
    }
    overlays(f, b, t);
  },
});

// ================================================================================================ SEOUL
function paintSeoul(f: Frame, b: B, t: number) {
  if (t < b.top0) wide(f, b, t, 'A');
  else if (t < b.wide2) top(f, b, t);
  else if (t < b.top37) wide(f, b, t, 'B');
  else if (t < b.wide3) top37(f, b, t);
  else if (t < b.close) wide(f, b, t, 'C');
  else if (t < b.wide4) close78(f, b, t);
  else wide(f, b, t, 'D');
}

/** which game is on the board at time t (in the WIDE camera) */
function boardAt(b: B, t: number): Stone[] {
  if (t < b.wide2) return [];
  if (t < b.close) return t >= b.m37 ? [...GAME2, M37] : GAME2;
  return [...GAME4, M78];
}

function wide(f: Frame, b: B, t: number, part: 'A' | 'B' | 'C' | 'D') {
  // one continuous slow push across all four WIDE visits (the hall never jumps)
  const cam = mixFrame(WIDE0, WIDE1, sm(t / b.wipe0));
  f.camera(cam);
  f.setMood('duskRose');
  f.backlight({ sunX: 620, sunY: 330, sunRadius: 460, intensity: 0.36 });
  f.layer('L2', (c, env) => hallWall(f, c, env));
  f.fog({ yCenter: 0.6 * 720, height: 0.4 * 720, alpha: 0.24, drift: 5 });
  // Hassabis beyond the pool, at a cool screen behind the machine's side (L3)
  const makers = 0.35 + 0.65 * win(t, b.makers - 0.15, b.makers + 0.5);
  f.layer('L3', (c, env) => {
    const tq = tq12(t);
    // a small desk and a monitor seen edge-on
    c.fillStyle = env.fill('ink');
    c.fillRect(HASS.screen.x - 46, HASS.screen.y + 36, 92, 6);
    c.fillRect(HASS.screen.x - 40, HASS.screen.y + 42, 5, HASS.y - HASS.screen.y - 42);
    c.fillRect(HASS.screen.x + 35, HASS.screen.y + 42, 5, HASS.y - HASS.screen.y - 42);
    c.fillRect(HASS.screen.x - 3, HASS.screen.y - 26, 6, 62);
    c.fillRect(HASS.screen.x - 14, HASS.screen.y - 30, 28, 4);
    HASS_P.draw(c, { x: HASS.x, y: HASS.y, facing: 'left', pose: withLife(HASS_POSE, tq, 903, 0.7), scale: HASS.s, ink: mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.25), light: { x: -1, y: -0.2, floor: 0.1 } }, env);
    // the cool screen light on him (the one cyan in the hall)
    glow(c, HASS.screen.x + 6, HASS.screen.y - 4, 150, CYAN.halo, 0.22 * makers);
    glow(c, HASS.screen.x + 2, HASS.screen.y - 6, 34, CYAN.core, 0.55 * makers);
    c.fillStyle = withAlpha(CYAN.core, 0.85 * makers);
    c.fillRect(HASS.screen.x - 1.5, HASS.screen.y - 24, 3, 46);
  });
  f.fog({ yCenter: 0.72 * 720, height: 0.22 * 720, alpha: 0.12, drift: 9 });
  // the lamp's light under the shade, before the action plane (its halo must not wash Lee)
  f.practical({ x: LAMP.x, y: LAMP.y + 18, kind: 'lamp', seed: 9032, intensity: 0.8, radius: 70 });
  const stones = boardAt(b, t);
  const tq = tq12(t);
  f.layer('L4', (c, env) => {
    const m = env.mood;
    // the floor, the lamp's pool on it (warm in the middle, the machine's side falling to dark)
    c.fillStyle = mixLab(env.fill('set'), m.fg, 0.5);
    c.fillRect(-200, FLOOR, 1700, 300);
    pool(c, env);
    // the hanging lamp: a cord from the dark and a wide shallow shade
    c.fillStyle = env.fill('ink');
    c.fillRect(LAMP.x - 1, -200, 2, LAMP.y + 200);
    c.beginPath();
    c.moveTo(LAMP.x - 8, LAMP.y - 6);
    c.lineTo(LAMP.x + 8, LAMP.y - 6);
    c.lineTo(LAMP.x + 64, LAMP.y + 18);
    c.lineTo(LAMP.x - 64, LAMP.y + 18);
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha(m.rim, 0.4);
    c.fillRect(LAMP.x - 64, LAMP.y + 17, 128, 1.4);
    // Lee's chair and the table
    chair(c, env);
    table(c, env);
    goSide(c, env, { stones, rings: part === 'C' ? [{ c: M37.c, r: M37.r, u: clamp01((t - b.m37) / 1.6), k: 0.6 }] : [] });
    const lidsU = (dt: number) => sm((tq - b.lids - dt) / 0.42);
    bowl(c, env, { x: TABLE.x0 + 24, y: TABLE.top, col: 'w', lid: part === 'D' ? lidsU(0) : 0, side: -1 });
    bowl(c, env, { x: TABLE.x1 - 24, y: TABLE.top, col: 'b', lid: part === 'D' ? lidsU(0.22) : 0, side: 1 });
    // Lee Sedol (absent for a beat in part C: he left the room)
    let away = 0;
    if (part === 'C') away = win(tq, b.away0, b.away0 + 0.25) * (1 - win(tq, b.away1 - 0.25, b.away1));
    if (away < 0.999) {
      const p = part === 'D' ? withLife(UPRIGHT, tq, 904, 0.8) : withLife(CHIN, tq, 904, 0.8);
      c.save();
      c.globalAlpha *= 1 - away;
      LEE_P.draw(c, { x: LEE.x, y: FLOOR, facing: 'right', pose: p, ink: PUPPET_NEAR_BLACK, light: { x: 0.5, y: -0.85, floor: 0.12 }, edgeRim: { x: 0.6, y: -0.8, px: 1.5, alpha: 0.6 } }, env);
      c.restore();
    }
  });
  f.rim({ x: 0.2, y: -1 });
  f.layer('L4', (c, env) => dustMotes(c, { area: { x: LAMP.x - 260, y: LAMP.y, w: 520, h: 300 }, count: 26, drift: { x: -2, y: -3 }, brightness: 0.45, salt: 903 }, env));
  // near plane: a column edge at frame right, soft (the hall's frame)
  f.layer('L6', (c, env) => {
    c.fillStyle = env.fill('fg');
    c.fillRect(1180, -200, 260, 1200);
  });
}

function hallWall(f: Frame, c: C, env: PaintEnv) {
  const draw = f.cached(`${ID}/hall/${env.mood.id}`, 1900, 1000, (cc) => {
    cc.translate(300, 200);
    const m = env.mood;
    const wall = mixLab(env.fill('set'), m.fg, 0.3);
    // three tall paper screens, softly backlit, in a dark wall (holes with a lattice)
    cc.fillStyle = wall;
    cc.beginPath();
    cc.rect(-300, -200, 1900, 1000);
    const panels = [[250, 120], [560, 120], [870, 120]];
    for (const [x, y] of panels) cc.rect(x, y, 220, 400);
    cc.fill('evenodd');
    cc.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.5), 0.12);
    for (const [x, y] of panels) cc.fillRect(x, y, 220, 400);
    cc.fillStyle = env.fill('ink');
    for (const [x, y] of panels) {
      for (let k = 1; k < 4; k++) cc.fillRect(x + (k * 220) / 4 - 2, y, 4, 400);
      for (let k = 1; k < 7; k++) cc.fillRect(x, y + (k * 400) / 7 - 2, 220, 4);
      cc.fillRect(x - 8, y - 8, 236, 8);
      cc.fillRect(x - 8, y + 400, 236, 10);
    }
    cc.fillStyle = withAlpha(m.fg, 0.6);
    cc.fillRect(-300, 586, 1900, 14);
    cc.fillStyle = mixLab(wall, m.fg, 0.4);
    cc.fillRect(-300, 600, 1900, 400);
  });
  draw(c, -300, -200);
}

function pool(c: C, env: PaintEnv) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(LAMP.x - 30, FLOOR + 6);
  c.scale(1, 0.14);
  const R = 360;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.32));
  g.addColorStop(0.6, withAlpha(env.mood.halo, 0.12));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(-R, -R, 2 * R, 2 * R);
  c.restore();
  // the soft cone of the lamp in the haze
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g2 = c.createLinearGradient(0, LAMP.y + 18, 0, TABLE.top);
  g2.addColorStop(0, withAlpha(env.mood.halo, 0.12));
  g2.addColorStop(1, withAlpha(env.mood.halo, 0.03));
  c.fillStyle = g2;
  c.beginPath();
  c.moveTo(LAMP.x - 62, LAMP.y + 18);
  c.lineTo(LAMP.x + 62, LAMP.y + 18);
  c.lineTo(LAMP.x + 190, TABLE.top);
  c.lineTo(LAMP.x - 190, TABLE.top);
  c.closePath();
  c.fill();
  c.restore();
}

function chair(c: C, env: PaintEnv) {
  c.fillStyle = env.fill('ink');
  const x = LEE.x - 34;
  c.fillRect(x, LEE.seat, 74, 7);
  c.fillRect(x + 2, LEE.seat + 7, 5, FLOOR - LEE.seat - 7);
  c.fillRect(x + 64, LEE.seat + 7, 5, FLOOR - LEE.seat - 7);
  c.fillRect(x - 4, LEE.seat - 150, 6, 157);
  c.fillRect(x - 6, LEE.seat - 152, 10, 4);
}

function table(c: C, env: PaintEnv) {
  c.fillStyle = env.fill('ink');
  c.fillRect(TABLE.x0, TABLE.top, TABLE.x1 - TABLE.x0, 8);
  c.fillRect(TABLE.x0 + 10, TABLE.top + 8, TABLE.x1 - TABLE.x0 - 20, 18);
  c.fillRect(TABLE.x0 + 16, TABLE.top + 26, 8, FLOOR - TABLE.top - 26);
  c.fillRect(TABLE.x1 - 24, TABLE.top + 26, 8, FLOOR - TABLE.top - 26);
  c.fillStyle = withAlpha(env.mood.rim, 0.32);
  c.fillRect(TABLE.x0, TABLE.top - 0.6, TABLE.x1 - TABLE.x0, 1.2);
}

// ------------------------------------------------------------------------------------------------ the TEACHING camera
function topRoom(f: Frame, cam: Camera3) {
  f.camera(cam);
  f.setMood('duskRose');
  f.backlight({ sunX: 640, sunY: 360, sunRadius: 300, intensity: 0.15 });
  f.layer('L2', (c, env) => {
    // the table top far below the lamp: dark cloth
    c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.55);
    c.fillRect(-400, -300, 2100, 1400);
  });
}

function top(f: Frame, b: B, t: number) {
  const cam = mixFrame(TOPC0, TOPC1, sm((t - b.top0) / (b.wide2 - b.top0)));
  topRoom(f, cam);
  const tq = tq12(t);
  // the human games: seven thin sheets riffle in, then settle square and fade to pinpricks; cleared on 'itself'
  const clear = 1 - win(tq, b.itself - 0.15, b.itself + 0.2);
  const settle = win(tq, b.itself - 0.6, b.itself - 0.15);
  const ghosts = GHOSTS.map((g, i) => {
    const at = b.human - 0.2 + i * 0.13;
    const on = win(tq, at, at + 0.08);
    const flick = i === Math.floor((tq - b.human + 0.2) / 0.13) ? 1 : 0.55;
    return { stones: g, a: on * clear * lerp(flick * 0.9, 0.35, settle), dx: lerp(hash(i, 1) * 18, 0, settle), dy: lerp(hash(i, 2) * 14, 0, settle), rot: lerp(hash(i, 3) * 0.03, 0, settle) };
  });
  // self-play: stones placed at selfTimes; the reward pulse runs back through them; then the grid goes plain
  const n = SELFPLAY.length;
  const runBack = (n - 1) * 0.08;
  const plain = 1 - win(tq, b.wins + runBack + 0.25, b.wins + runBack + 0.6);
  const alpha = (i: number) => (tq >= b.selfTimes[i] ? plain : 0);
  // the reward runs BACK through the game, last move first, one stone every 0.08 s, each flashing warm
  const glowAt = (i: number) => {
    const at = b.wins + (n - 1 - i) * 0.08;
    return t < at ? 0 : 1.15 * Math.exp(-(t - at) * 3.2) * win(t, at, at + 0.06);
  };
  f.layer('L4', (c, env) => {
    goTop(c, env, { stones: SELFPLAY, alpha, glow: glowAt, ghosts });
    // the anonymous hand from the machine's side (right edge), moving on twos between its moves
    const h = handPath(b, tq);
    if (h) castHand(c, env, { ...h, who: 'machine', len: 112 });
  });
  f.rim({ x: -0.4, y: -0.9 });
  // the reward: one warm ring from the last stone, running back over the board
  const last = SELFPLAY[n - 1];
  f.layer('L4', (c, env) => {
    const u = clamp01((t - b.wins) / 1.2);
    if (u > 0 && u < 1) {
      const p = topXY(last.c, last.r);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const R = 40 + 560 * sm(u);
      const a = 0.7 * Math.min(1, u * 6) * (1 - u);
      const g = c.createRadialGradient(p.x, p.y, R * 0.55, p.x, p.y, R);
      g.addColorStop(0, withAlpha(env.mood.halo, 0));
      g.addColorStop(0.88, withAlpha(env.mood.core, a));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
      // each stone the pulse reaches flashes warm (a small halo on top of goTop's own stone glow)
      for (let i = 0; i < n; i++) {
        const k = glowAt(i);
        if (k < 0.02) continue;
        const q = topXY(SELFPLAY[i].c, SELFPLAY[i].r);
        glow(c, q.x, q.y, TOP.step * 1.3, env.mood.halo, 0.55 * Math.min(1, k));
      }
      c.restore();
    }
  });
  lampOnBoard(f, cam);
  topNear(f);
}
const GHOSTS = [11, 23, 37, 41, 53, 67, 71].map((s) => ghostGame(s));
const hash = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5;

/** where the anonymous hand's fingertip is during self-play (and which stone it carries), on twos */
function handPath(b: B, tq: number): { x: number; y: number; angle: number; stone: 'b' | 'w' | null } | null {
  const T = b.selfTimes;
  const enter = T[0] - 0.3, exit = T[T.length - 1] + 0.4;
  if (tq < enter || tq > exit) return null;
  const off = { x: 1420, y: 520 };
  const at = (i: number) => topXY(SELFPLAY[i].c, SELFPLAY[i].r);
  let p: { x: number; y: number };
  let stone: 'b' | 'w' | null = null;
  if (tq < T[0]) {
    const u = sm((tq - enter) / 0.3);
    p = { x: lerp(off.x, at(0).x, u), y: lerp(off.y, at(0).y, u) };
    stone = SELFPLAY[0].col;
  } else if (tq >= T[T.length - 1]) {
    const u = sm((tq - T[T.length - 1]) / 0.4);
    p = { x: lerp(at(T.length - 1).x, off.x, u), y: lerp(at(T.length - 1).y, off.y, u) };
  } else {
    let i = 0;
    while (i < T.length - 2 && tq >= T[i + 1]) i++;
    const u = sm((tq - T[i]) / (T[i + 1] - T[i]));
    // lift off the placed stone, swing to the next point (an arc toward the bowl side and back)
    const a = at(i), z = at(i + 1);
    const lift = Math.sin(Math.PI * u) * 40;
    p = { x: lerp(a.x, z.x, u) + lift, y: lerp(a.y, z.y, u) - lift * 0.4 };
    stone = u > 0.3 ? SELFPLAY[i + 1].col : null;
  }
  return { x: p.x, y: p.y, angle: Math.atan2(p.y - off.y, p.x - off.x), stone } as const;
}

/** the near planes of the board close-ups: the two stone bowls at the board's sides (L5, soft) and the hanging lamp's
 *  shade edge cutting the top corner (L6, softest): with the cloth on L2 every push slides three planes */
const BOWL_L = { x: 196, y: 548 };
const BOWL_R = { x: 1088, y: 182 };
function topNear(f: Frame) {
  f.layer('L5', (c, env) => {
    const m = env.mood;
    for (const [p, col] of [[BOWL_L, 'w'], [BOWL_R, 'b']] as const) {
      // a lacquered bowl from above: dark rim, its lid on, a thin lamp-lit lip
      c.fillStyle = withAlpha(m.fg, 0.5);
      c.beginPath();
      c.arc(p.x + 8, p.y + 12, 92, 0, Math.PI * 2);
      c.fill();
      // the bowl's dark flank, then its turned-wood lid (lamp-lit from the board side), a knob ring at its centre
      c.fillStyle = env.fill('ink');
      c.beginPath();
      c.arc(p.x, p.y, 90, 0, Math.PI * 2);
      c.fill();
      const wood = mixLab(mixLab(m.set, m.halo, 0.32), '#7a5634', 0.25);
      const toward = { x: 640 - p.x, y: 360 - p.y };
      const n = Math.hypot(toward.x, toward.y);
      const lg = c.createRadialGradient(p.x + (toward.x / n) * 34, p.y + (toward.y / n) * 34, 6, p.x, p.y, 84);
      lg.addColorStop(0, wood);
      lg.addColorStop(1, mixLab(wood, m.fg, 0.55));
      c.fillStyle = lg;
      c.beginPath();
      c.arc(p.x, p.y, 80, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha(mixLab(wood, m.fg, 0.5), 0.8);
      c.lineWidth = 2;
      for (const r of [56, 22]) {
        c.beginPath();
        c.arc(p.x, p.y, r, 0, Math.PI * 2);
        c.stroke();
      }
      c.strokeStyle = withAlpha(m.rim, 0.5);
      c.lineWidth = 2.4;
      const a0 = Math.atan2(toward.y, toward.x);
      c.beginPath();
      c.arc(p.x, p.y, 79, a0 - 0.8, a0 + 0.8);
      c.stroke();
      void col;
    }
  });
  f.layer('L6', (c, env) => {
    // the lamp's shade, seen from below its rim: a dark arc across the top-left corner, its lit inner lip
    c.fillStyle = env.fill('fg');
    c.beginPath();
    c.ellipse(-60, -150, 560, 250, 0.05, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(env.mood.halo, 0.35);
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(-60, -150, 556, 246, 0.05, Math.PI * 0.08, Math.PI * 0.62);
    c.stroke();
  });
}

/** dim the whole board but a pool around one stone (evenodd): the new move reads as standing apart */
function dimAround(c: C, env: PaintEnv, p: { x: number; y: number }, k: number) {
  c.save();
  c.fillStyle = withAlpha(env.mood.fg, k * 2.2);
  c.beginPath();
  c.rect(TOP.cx - 600, TOP.cy - 600, 1200, 1200);
  c.arc(p.x, p.y, TOP.step * 1.1, 0, Math.PI * 2);
  c.fill('evenodd');
  c.restore();
}

/** the hanging lamp's warm light on the board (screen space) */
function lampOnBoard(f: Frame, cam: Camera3) {
  const p = toScreen(LAYERS.L4, cam, TOP.cx - 30, TOP.cy - 40);
  glow(f.c, p.x, p.y, 420 * p.k, f.mood.halo, 0.12);
}

function top37(f: Frame, b: B, t: number) {
  const cam = mixFrame(T37a, T37b, sm((t - b.top37) / (b.wide3 - b.top37)));
  topRoom(f, cam);
  const tq = tq12(t);
  const placed = tq >= b.m37;
  const stones = placed ? [...GAME2, M37] : GAME2;
  const ring: Ring = { c: M37.c, r: M37.r, u: clamp01((t - b.m37) / 1.5), k: 1, reach: 18 };
  // round 1: back on the board the stones CROSSFADE (0.4 s) from the self-play game to game 2's position (a bridge,
  // not a hard swap); after the ring the move-37 stone keeps a faint warm halo through 'one-in-ten-thousand'
  const xf = sm((t - b.top37) / 0.4);
  const ghosts = xf < 1 ? [{ stones: SELFPLAY, a: 1 - xf, dx: 0, dy: 0, rot: 0 }] : [];
  f.layer('L4', (c, env) => {
    goTop(c, env, { stones, rings: [ring], ghosts, alpha: (i) => (i === GAME2.length ? 1 : xf), glow: (i) => (i === GAME2.length ? Math.max(0.6 * Math.exp(-Math.max(0, t - b.m37) * 2), 0.5 * win(t, b.m37 + 0.3, b.m37 + 0.8)) : 0) });
    // 'far from the fighting': for 1.2 s after it lands, the rest of the board drops ~15% while the new stone stays lit
    const dk = 0.15 * win(t, b.m37 + 0.05, b.m37 + 0.3) * (1 - win(t, b.m37 + 1.25, b.m37 + 1.6));
    if (dk > 0.005) dimAround(c, env, topXY(M37.c, M37.r), dk);
    // the hand brings the black stone from the machine's side and withdraws
    const target = topXY(M37.c, M37.r);
    const off = { x: 1460, y: 470 };
    let u = 0;
    if (tq < b.m37) u = sm((tq - b.top37) / (b.m37 - b.top37));
    else u = 1 - sm((tq - b.m37 - 0.12) / 0.5);
    if (u > 0.01) {
      const p = { x: lerp(off.x, target.x, u), y: lerp(off.y, target.y, u) };
      castHand(c, env, { x: p.x, y: p.y, angle: Math.atan2(target.y - off.y, target.x - off.x), who: 'machine', stone: tq < b.m37 ? 'b' : null, len: 112 });
    }
  });
  f.rim({ x: -0.4, y: -0.9 });
  lampOnBoard(f, cam);
  topNear(f);
}

function close78(f: Frame, b: B, t: number) {
  const cam = mixFrame(CLOSE0, CLOSE1, sm((t - b.close) / (b.wide4 - b.close)));
  topRoom(f, cam);
  const tq = tq12(t);
  const placed = tq >= b.m78;
  const stones = placed ? [...GAME4, M78] : GAME4;
  const ring: Ring = { c: M78.c, r: M78.r, u: clamp01((t - b.m78) / 1.5), k: 1, reach: 18 };
  f.layer('L4', (c, env) => {
    // the same faint warm halo as move 37 holds on the wedge (the visual rhyme for 'just as rare')
    goTop(c, env, { stones, rings: [ring], glow: (i) => (i === GAME4.length ? Math.max(0.6 * Math.exp(-Math.max(0, t - b.m78) * 2), 0.5 * win(t, b.m78 + 0.3, b.m78 + 0.8)) : 0) });
    // Lee's hand from his side (left), a suit sleeve and a pale cuff; it sets the white stone in the gap
    const off = { x: GAP.x - 330, y: GAP.y + 120 };
    let u = 0;
    if (tq < b.m78) u = sm((tq - b.close + 0.2) / (b.m78 - b.close + 0.2));
    else u = 1 - sm((tq - b.m78 - 0.15) / 0.55);
    if (u > 0.01) {
      const p = { x: lerp(off.x, GAP.x, u), y: lerp(off.y, GAP.y, u) };
      castHand(c, env, { x: p.x, y: p.y, angle: Math.atan2(GAP.y - off.y, GAP.x - off.x), who: 'lee', stone: tq < b.m78 ? 'w' : null, len: 104 });
    }
  });
  f.rim({ x: -0.4, y: -0.9 });
  lampOnBoard(f, cam);
  topNear(f);
}

// ================================================================================================ STUDY
function paintStudy(f: Frame, b: B, t: number) {
  if (t < b.dis0) wallView(f, b, t);
  else if (t < b.dis1) {
    const u = sm((t - b.dis0) / (b.dis1 - b.dis0));
    const cv = subFrame(f, `${ID}/wallSub`, 'candleAmber', (g) => wallView(g, b, t));
    shelfView(f, b, t);
    compositeSub(f, cv, 1 - u);
  } else shelfView(f, b, t);
}

function wallView(f: Frame, b: B, t: number) {
  const cam = mixFrame(WALLC0, WALLC1, sm((t - b.wipe0) / (b.dis1 - b.wipe0)));
  f.camera(cam);
  f.setMood('candleAmber');
  studyRoom(f, { key: ID, cams: STUDY_CAMS, outside: { mood: 'duskRose', kind: 'night' } });
  f.fog('B');
  // the pin glint: a clear 0.4 s star (up fast, held, then gone)
  const g = win(t, b.glint - 0.04, b.glint + 0.08) * (1 - win(t, b.glint + 0.26, b.glint + 0.44));
  studyCase(f, {
    shot: ID,
    when: 'end',
    key: ID,
    flames: false,
    board: false,
    shelf: false,
    xray: { light: 0.15 },
    wall: { hide: ['W5'] },
    extra: (c, env) => coulomSlip(c, env, { pinGlint: g, light: 0.8 }),
  });
  wallPool(f, cam, W5C, 360, 1.1);
  if (g > 0.01) {
    // the star itself, in screen space on the pin head: long thin rays and a hot core
    const pin = toScreen(LAYERS.L4, cam, W5C.x, W5C.y - W5S.h / 2 + 6 * STUDY.wall.k);
    const c = f.c;
    c.save();
    c.globalCompositeOperation = 'lighter';
    glow(c, pin.x, pin.y, 60, f.mood.core, 0.7 * g);
    c.strokeStyle = withAlpha(mixLab(f.mood.core, '#fff4da', 0.5), 0.9 * g);
    c.lineCap = 'round';
    for (const [len, a, lw] of [[64, 0, 1.6], [64, Math.PI / 2, 1.6], [26, Math.PI / 4, 1], [26, -Math.PI / 4, 1]] as const) {
      const r = len * (0.6 + 0.4 * g);
      c.lineWidth = lw;
      c.beginPath();
      c.moveTo(pin.x - Math.cos(a) * r, pin.y - Math.sin(a) * r);
      c.lineTo(pin.x + Math.cos(a) * r, pin.y + Math.sin(a) * r);
      c.stroke();
    }
    c.restore();
  }
}

/** every lit candle on the shelf except the Go candle (drawn by the shot) */
const SHELF_ONLY = SHELF_ORDER.filter((id) => id !== 'go');
function shelfView(f: Frame, b: B, t: number) {
  const cam = mixFrame(SHELFC0, SHELFC1, sm((t - b.dis0) / (b.D - b.dis0)));
  f.camera(cam);
  f.setMood('candleAmber');
  studyRoom(f, { key: ID, cams: STUDY_CAMS, outside: { mood: 'duskRose', kind: 'night' } });
  const tq = tq12(t);
  // the snuff: the flame shrinks to nothing over three twos-ticks; the smoke thread rises from then on
  const fk = 1 - sm((tq - b.snuff) / 0.25);
  const out = tq >= b.snuff + 0.25;
  const smoke = win(t, b.snuff + 0.1, b.snuff + 0.6);
  studyCase(f, {
    shot: ID,
    when: 'end',
    key: ID,
    flames: false,
    board: false,
    wall: false,
    xray: false,
    shelf: { drawFlames: false, only: SHELF_ONLY },
    extra: (c, env) => {
      const v = out ? goView('out') : { ...goView('lit'), rings: 2 };
      beliefCandle(c, { x: GO.x, y: GO.y, view: v, s: STUDY.shelf.s, flame: out ? undefined : fk, smoke: out ? smoke : 0, letters: 0.85, drawFlame: false, named: 0 }, env);
      // the candle naming card once it is out: the belief and its span (lit 2014 · out 2016 · 2 years), held to the cut
      const nk = win(t, b.snuff + 0.32, b.snuff + 0.62);
      if (nk > 0) namedLabel(c, { x: GO.x, y: GO.y, view: { ...goView('out'), tag: '2014' }, s: STUDY.shelf.s, named: nk }, env);
    },
  });
  // live flames on the shelf (the nets' candle beside it), and the Go flame until it is snuffed
  const views = shelfFlamePoints();
  for (const p of views) f.practical({ x: p.x, y: p.y, kind: 'candle', seed: p.seed, intensity: 0.85, radius: 34 });
  if (!out) {
    const fl = { x: GO.flame.x, y: GO.flame.y + 2 * 6 * STUDY.shelf.s };
    f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 2016, intensity: 0.9 * fk, radius: 32 * (0.4 + 0.6 * fk) });
  }
}
const SHELF_END = shelfStateAt(ID, 'end');
function shelfFlamePoints() {
  return shelfFlames({ ...STUDY.shelf, views: SHELF_END, only: SHELF_ONLY });
}

// ================================================================================================ type
/** is the camera on one of the top-down board views (the teaching image, move 37, move 78)? */
function onBoard(b: B, t: number) {
  return t < b.wipe0 && ((t >= b.top0 && t < b.wide2) || (t >= b.top37 && t < b.wide3) || (t >= b.close && t < b.wide4));
}

/** 0..1: how much of a board view is on screen (1 inside, eased over 0.2 s at its cuts) */
function boardPlate(b: B, t: number) {
  let k = 0;
  for (const [a, z] of [[b.top0, b.wide2], [b.top37, b.wide3], [b.close, b.wide4]] as const) k = Math.max(k, win(t, a - 0.01, a + 0.2) * (1 - win(t, z - 0.2, z)));
  return t < b.wipe0 ? k : 0;
}

let cardCanvas: HTMLCanvasElement | null = null;
function overlays(f: Frame, b: B, t: number) {
  const env = { t, mood: f.mood };
  const until = b.wipe0 + 0.1;
  // the stamp and the three name cards stay to the wipe home; on the top-down board close-ups they dim to ~60% once
  // each has been read (3 s), so they never compete with the board
  const cards: [number, (c: C) => void][] = [
    [b.in, (c) => placeStamp(c, { place: 'Seoul', date: 'March 2016', year: 2016, at: b.in, dur: until - b.in, fade: 0.35 }, env)],
    [b.in + 0.05, (c) => nameCard(c, { name: 'Lee Sedol', role: 'professional Go player (9-dan)', at: b.in + 0.05, dur: until - b.in, x: 48, y: 586, fade: 0.35 }, env)],
    [b.makers, (c) => nameCard(c, { name: 'Demis Hassabis', role: 'DeepMind co-founder', at: b.makers, dur: until - b.makers, x: 1232, y: 506, align: 'right', fade: 0.35 }, env)],
    [b.machine, (c) => nameCard(c, { name: 'AlphaGo', role: 'DeepMind (Google)', at: b.machine, dur: until - b.machine, x: 1232, y: 598, align: 'right', fade: 0.35 }, env)],
  ];
  const board = onBoard(b, t);
  // round 1: on the top-down board views the two card stacks sit over stones and grid lines, so each gets a soft
  // ink plate (0.55) under it, easing in and out with the board framing
  if (board || (t < b.wipe0 + 0.1 && t >= b.top0 - 0.3)) {
    const pk = boardPlate(b, t);
    if (pk > 0.01) {
      f.c.save();
      f.c.globalAlpha = pk;
      // (doubled: the plate is radial, so its core reaches ~0.8 under the type and feathers out over the board)
      for (let i = 0; i < 2; i++) {
        softPlate(f.c, 200, 628, 560, 230, f.mood.ink, 0.55);
        softPlate(f.c, 1090, 556, 560, 300, f.mood.ink, 0.55);
      }
      f.c.restore();
    }
  }
  for (const [at, draw] of cards) {
    // (with their plates under them the cards no longer fight the stones: they dim only ~15% once read)
    const dim = board ? 1 - 0.15 * win(t, at + 3, at + 3.4) : 1;
    if (dim >= 0.999) draw(f.c);
    else {
      const W = f.c.canvas.width, H = f.c.canvas.height;
      if (!cardCanvas || cardCanvas.width !== W || cardCanvas.height !== H) cardCanvas = makeCanvas(W, H);
      const g = cardCanvas.getContext('2d')!;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.clearRect(0, 0, W, H);
      g.setTransform(f.c.getTransform());
      draw(g);
      compositeSub(f, cardCanvas, dim);
    }
  }
  // '1 in 10,000': stamped beside move 37 (0.15 s before the word), and again beside move 78; always clear of the
  // right-hand card stack
  const r37 = b.rare - 0.15;
  if (t >= r37 && t < b.wide3) rareStamp(f, toScreen(LAYERS.L4, mixFrame(T37a, T37b, sm((t - b.top37) / (b.wide3 - b.top37))), topXY(M37.c, M37.r).x, topXY(M37.c, M37.r).y), t - r37);
  const r78 = b.m78 + 0.28;
  if (t >= r78 && t < b.wide4) rareStamp(f, toScreen(LAYERS.L4, mixFrame(CLOSE0, CLOSE1, sm((t - b.close) / (b.wide4 - b.close))), GAP.x, GAP.y), t - r78);
}

/** the caption '1 in 10,000' in Plex Mono, stamped (a quick overshoot) beside a stone: to its right, unless that
 *  would put it near the right-hand name cards, then to its left; kept above the lower card band */
function rareStamp(f: Frame, p: { x: number; y: number; k: number }, dt: number) {
  // round 1: the SAME offset from its stone for move 37 and move 78 (up and to the right), so the two captions rhyme,
  // with a 1 px leader from the caption to the stone it names
  const side = p.x > 1000 ? -1 : 1;
  const c = f.c;
  const a = Math.min(1, dt / 0.08);
  const s = 1 + 0.22 * Math.exp(-dt * 14);
  const text = '1 in 10,000';
  c.save();
  c.font = `500 28px ${FONT.mono}`;
  const w = c.measureText(text).width;
  const x = p.x + side * (36 * p.k + 14 + w / 2);
  const y = Math.max(70, Math.min(440, p.y - 34 * p.k - 34));
  c.globalAlpha = a;
  softPlate(c, x, y - 9, w + 120, 76, f.mood.ink, 0.6);
  // the leader: from the caption's near lower corner to the stone's rim
  {
    const x0 = x - side * (w / 2 + 4), y0 = y + 6;
    const ang = Math.atan2(y0 - p.y, x0 - p.x);
    const r = TOP.step * 0.55 * p.k;
    const k = Math.min(1, dt / 0.25);
    const x1 = p.x + Math.cos(ang) * r, y1 = p.y + Math.sin(ang) * r;
    c.strokeStyle = withAlpha(mixLab('#f4e8d4', f.mood.core, 0.2), 0.85);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(lerp(x0, x1, k), lerp(y0, y1, k));
    c.stroke();
  }
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(-0.02 * side);
  c.fillStyle = mixLab('#f4e8d4', f.mood.core, 0.2);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText(text, 0, 0);
  c.restore();
}
