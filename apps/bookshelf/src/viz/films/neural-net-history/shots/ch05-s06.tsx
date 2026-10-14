/**
 * ch05-s06 — Who invented the messenger? Several people, separately; the 1986 paper made it stick.
 *
 * Reverse flame push (no lamp change, no black): the traveller's hand-lantern flame fills the frame and the
 * camera pulls back out of it onto the case board, tint-crossfading dawnGold → candleAmber as it clears.
 *   1.4          (insert) the hands unpin THEN HOW DO YOU TRAIN THE HIDDEN LAYER? from Q1 on the oxblood
 *                thread and let it fall; (insert) it lands in the lamp's pool on the desk, curls, burns out
 *   3.3          (insert) the plant: the hands tuck a small blank card behind the case board's edge
 *   'invented'   the camera finds the inventor cards at the foot of column C2 (fountain-pen names + years)
 *   'separately' threads of light run from several of them toward the empty pin right of the Helsinki card
 *   'Helsinki'   the Helsinki card's thread lights end to end, brightest of all
 *   'stick'      the hands pin the 1986 paper's title strip on that pin; every thread converges on it
 *   'claimed'    name card: Geoffrey Hinton · writing in 2020
 *   +0.3 / +1.0  RUMELHART 1982 catches the lamp; the earlier cards to its left glow faintly together
 *   +1.4 / +2.4  music only: the 1961 caption card (C1-c) lifts off its pin; the hands turn it over:
 *                pencilled on the back, 'same name, a different procedure'
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, ShotScene } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, defineShot, glow, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { STUDY, studyCase, studyNear, studyRoom } from '../sets/study';
import { SLOTS, boardStateAt } from '../sets/studyState';
import { drawCard, paperTone, poolAt, typedText, DEFAULT_POOL } from '../sets/caseBoard';
import { lampSpill } from '../sets/ch03-s06-kit';
import { journalClipping } from '../sets/ch05-s04-loom';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { camKeys, clamp01, lerp, pulse, sm, tq12, win } from '../sets/ch05-s01-kit';

const ID = 'ch05-s06';
const BX = STUDY.board.x, BY = STUDY.board.y;
const bw = (x: number, y: number) => ({ x: BX + x, y: BY + y });
const Q_TEXT = 'THEN HOW DO YOU TRAIN THE HIDDEN LAYER?';
const Q_AT = bw(270, 34 + 10 + 22);
/** the inventor cards: two loose rows at the foot of column C2 (board units) */
const INVENTORS = [
  { n: 'KELLEY', y: '1960' },
  { n: 'BRYSON', y: '1961' },
  { n: 'DREYFUS', y: '1962' },
  { n: 'LINNAINMAA', y: '1970' },
  { n: 'WERBOS', y: '1974/82' },
  { n: 'RUMELHART', y: '1982' },
  { n: 'PARKER', y: '1985' },
  { n: 'LE CUN', y: '1985' },
].map((c, i) => ({ ...c, bx: 322 + (i % 4) * 89 + (i >= 4 ? 10 : 0), by: i < 4 ? 418 : 469, rot: ((i * 37) % 7 - 3) * 0.012 }));
const CARD_W = 87, CARD_H = 46;
/** the empty pin just right of the Helsinki card (C2-h) and the 1986 strip that goes on it */
const PIN = bw(474, 208);
const STRIP = { w: 104, h: 30 };
const HELS = SLOTS['C2-h'];
const FALSE = SLOTS['C1-c'];
/** which inventor cards send a thread on 'separately' (several, not all) */
const THREADERS = [0, 1, 3, 4, 6];

interface Beats {
  question: number;
  plant: number;
  who: number;
  threads: number;
  helsinki: number;
  stick: number;
  hinton: number;
  rumelhart: number;
  others: number;
  falseClue: number;
  falseClueTurn: number;
  /** cuts between the lead-in inserts */
  cutDesk: number;
  cutPlant: number;
  cutBoard: number;
}
interface Scene extends ShotScene {
  b: Beats;
  D: number;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const question = T.beat('question');
    const plant = T.beat('plant');
    const b: Beats = {
      question,
      plant,
      who: T.beat('who'),
      threads: T.beat('threads'),
      helsinki: T.beat('helsinki'),
      stick: T.beat('stick'),
      hinton: T.beat('hinton'),
      // the trailing wordless beats are compressed after L0512 so the false clue's pencilled back holds
      // ≥ 1.3 s before the cut (front seen lifted first, then turned)
      // (round 1: the card is lifted toward the lens so both faces read; front ~0.7 s, back ~1 s)
      rumelhart: T.line('L0512').end + 0.25,
      // the earlier cards glow together on the script's beat (~0.7 s after RUMELHART catches the lamp)
      others: T.beat('others') - 0.1,
      falseClue: T.line('L0512').end + 0.95,
      falseClueTurn: T.line('L0512').end + 1.75,
      cutDesk: question + 0.55,
      cutPlant: plant - 0.15,
      cutBoard: plant + 0.95,
    };
    const rowC = bw(470, 440);
    const cam = camKeys([
      [0, Q_AT.x - 40, Q_AT.y + 40, 530],
      [question - 0.1, Q_AT.x - 90, Q_AT.y + 66, 520],
      [b.cutDesk, Q_AT.x - 92, Q_AT.y + 76, 512],
      // (desk insert has its own camera)
      [b.cutBoard, 700, 360, 210],
      [b.who + 0.9, rowC.x, rowC.y - 60, 480],
      [b.helsinki + 1.0, rowC.x - 4, rowC.y - 70, 496],
      [b.stick + 0.6, rowC.x + 6, rowC.y - 80, 506],
      [b.others, rowC.x - 20, rowC.y - 60, 512],
      [D, rowC.x - 118, rowC.y - 28, 532],
    ]);
    tl.hold(0, D);
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 20; i++) CAMS.push(cam((D * i) / 20));
    CAMS.push({ x: BX + 960, y: 440, z: 440, lens: 1 });
    return { tl, b, D, cam, CAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t >= b.cutDesk && t < b.cutPlant) return paintDesk(f, sc, t);
    if (t >= b.cutPlant && t < b.cutBoard) return paintPlant(f, sc, t);
    paintBoard(f, sc, t);
  },
});

// ------------------------------------------------------------------ the board (the main camera)
function paintBoard(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.cam(t);
  f.camera(cam);
  f.setMood('candleAmber', { from: 'dawnGold', u: win(t, 0.25, 1.35) });
  studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'labGreen', kind: 'night' } });
  const st = boardStateAt(ID, 'start');
  // the Helsinki card lights on 'Helsinki' (lit from within from here on)
  for (const c of st.cards) if (c.id === 'C2-h') c.lit = t >= b.helsinki;
  // hands: unpin the question (lead-in), pin the 1986 strip ('stick'), turn the false clue (the hold)
  // the forearms enter close to their work, so no more than ~a third of the frame is sleeve: the unpin from
  // the lower right at a shallow angle, the pin from ABOVE-right (the case card below stays clear), the
  // turn from below
  // (the entry is pushed far out along the chosen direction: the frame edge, not the entry, limits what is
  // seen of the sleeve, and a distant entry keeps the rig's solve from folding the arm back on itself)
  const entryNear = (tx: number, ty: number, dx: number, dy: number) => {
    const p = toScreen(LAYERS.L4, cam, tx, ty);
    return { R: toLayer(LAYERS.L4, cam, p.x + dx * 2.6, p.y + dy * 2.6), L: toLayer(LAYERS.L4, cam, p.x + dx * 2.6 + 90, p.y + dy * 2.6 + 70) };
  };
  const qu = (tq - (b.question - 0.35)) / 1.4;
  const qPose = qu > 0 && qu < 1 ? hands.act('unpinDrop', qu, Q_AT, { held: 'card', scale: 0.7, entry: entryNear(Q_AT.x, Q_AT.y, 470, 210), dropAt: { x: Q_AT.x + 40, y: Q_AT.y + 260 } }) : null;
  const pinDur = 1.6;
  const pu = (tq - (b.stick - 0.45 * pinDur)) / pinDur;
  const pPose = pu > 0 && pu < 1 ? hands.act('pin', pu, PIN, { held: 'card', scale: 0.62, entry: entryNear(PIN.x, PIN.y, 330, -150) }) : null;
  const fcAt = bw(FALSE.x, FALSE.y);
  const lift = win(t, b.falseClue - 0.2, b.falseClue + 0.4);
  const flip = win(t, b.falseClueTurn - 0.3, b.falseClueTurn + 0.15);
  const settle = win(t, b.falseClueTurn + 0.62, b.falseClueTurn + 0.95);
  // lifted off its pin it comes forward, toward the lens, so its typed front and pencilled back both read
  const big = 1 + 0.92 * sm(lift) * (1 - 0.45 * settle);
  // the hand comes in as the card lifts, pinches its right edge before the turn, and HOLDS it through the
  // flip to the end of the shot (holdUp: enter over u 0–0.35, hold 0.35–0.75; we never reach the exit)
  const hIn = b.falseClue + 0.05, hGrip = b.falseClueTurn - 0.42;
  const fu = tq < hGrip ? (0.35 * (tq - hIn)) / (hGrip - hIn) : 0.35 + (0.33 * (tq - hGrip)) / Math.max(0.5, sc.D - hGrip);
  const sxNow = Math.max(0.12, Math.abs(Math.cos(Math.PI * flip)));
  const dyNow = -16 * lift * (1 - 0.6 * settle);
  const fPose = fu > 0 && fu < 1 ? hands.act('holdUp', fu, { x: fcAt.x + (FALSE.w / 2) * STUDY.board.k * big * sxNow - 3, y: fcAt.y + dyNow + 6 * big }, { held: 'none', scale: 0.66, entry: entryNear(fcAt.x, fcAt.y, 300, 330) }) : null;

  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    wall: false,
    xray: { light: 0.25 },
    board: { state: st, hide: ['C1-c', 'O'], threadGlint: win(t, b.question - 0.6, b.question) * (1 - win(t, b.question + 0.6, b.question + 1.2)) },
    extra: (c, env) => {
      const k = STUDY.board.k;
      // the question card on Q1 until it is unpinned (the shared state has it gone after ch05-s04)
      // pinned until the fingers take it (then only the held copy is drawn)
      if (!qPose || qu < 0.42) {
        if (t < b.question + 0.2) {
          const light = poolAt(DEFAULT_POOL, 270, 80);
          drawCard(c, { id: 'Q-Q1', w: 168, h: 44, icon: 'question', text: Q_TEXT }, { x: Q_AT.x, y: Q_AT.y, k, light, pin: false, rot: 0 }, env);
        }
      }
      if (qPose && qPose.released) {
        // falling away, out of frame toward the lamp's pool below
        const ft = (qu - 0.62) * 1.4;
        const y = Q_AT.y + 260 + 900 * ft * ft;
        drawCard(c, { id: 'Q-Q1', w: 168, h: 44, icon: 'question', text: Q_TEXT }, { x: Q_AT.x + 40 + 30 * Math.sin(ft * 6), y, k, light: 0.6, pin: false, rot: 0.4 * Math.sin(ft * 5) }, env);
      }
      chatBoxMuted(c, env);
      // the inventor cards (pinned in the lead-in, off camera), the pencilled note under them
      const rowA = win(t, b.who - 0.3, b.who + 0.4);
      inventorRow(c, env, t, b, rowA);
      // threads of light toward the empty pin, then onto the strip
      threadsToPin(c, env, t, b);
      // the 1986 strip on its pin
      if (pPose ? pPose.placed : t >= b.stick) titleStrip(c, env, PIN.x, PIN.y + STRIP.h / 2 - 4, 0.9, t >= b.stick ? 0.04 * Math.exp(-(t - b.stick) * 2.6) * Math.sin((t - b.stick) * 9) : 0);
      // the false clue (C1-c): lifts off its pin by itself, turned over, its pencilled back
      falseClue(c, env, fcAt, lift, flip, settle, big);
      // hands
      if (qPose) hands.draw(c, qPose, env, { heldDraw: (cc, at, _h, e) => drawCard(cc, { id: 'Q-Q1', w: 168, h: 44, icon: 'question', text: Q_TEXT }, { x: at.x, y: at.y + 18, k, light: 0.8, pin: false }, e) });
      if (pPose) hands.draw(c, pPose, env, { heldDraw: (cc, at, _h, e) => titleStrip(cc, e, at.x, at.y + STRIP.h / 2 - 4, 0.95, 0) });
      if (fPose) hands.draw(c, fPose, env);
    },
  });
  // the near planes sit behind the lens in the deep lead-in push (L5 at z 650, L6 at 400): off there
  studyNear(f, { key: ID, cams: sc.CAMS, file: true, ...(cam.z > 420 ? { occluders: false as const } : {}), ...(cam.z > 560 ? { desk: false } : {}) });
  lampSpill(f, 0.8);

  // the lamp's pool on the board: an elliptical falloff centred on the action, the rest falling to ink
  {
    const fq = t < 4.3 ? Q_AT : t < b.falseClue - 0.4 ? bw(470, 330) : bw(FALSE.x + 60, FALSE.y - 40);
    const fp = toScreen(LAYERS.L4, cam, fq.x, fq.y);
    const fx = lerp(fp.x, 640, 0.35), fy = lerp(fp.y, 360, 0.35);
    const c = f.c;
    c.save();
    c.translate(fx, fy);
    c.scale(1.45, 1);
    const g = c.createRadialGradient(0, 0, 120, 0, 0, 640);
    g.addColorStop(0, withAlpha(f.mood.ink, 0));
    g.addColorStop(0.5, withAlpha(f.mood.ink, 0.22));
    g.addColorStop(1, withAlpha(f.mood.ink, 0.62));
    c.fillStyle = g;
    c.fillRect(-900, -900, 1800, 1800);
    c.globalCompositeOperation = 'lighter';
    const h = c.createRadialGradient(0, 0, 0, 0, 0, 330);
    h.addColorStop(0, withAlpha(f.mood.halo, 0.1));
    h.addColorStop(1, withAlpha(f.mood.halo, 0));
    c.fillStyle = h;
    c.fillRect(-400, -400, 800, 800);
    c.restore();
  }
  // (they clear before the false clue comes forward, so nothing near crosses its pencilled back)
  nearPlanes(f, cam, 1 - win(t, b.falseClue - 0.5, b.falseClue + 0.1));
  // the green-shaded lamp's rim in the near foreground (L5, blurred) at the bottom right
  f.layer('L5', (c, env) => {
    const p0 = toLayer(LAYERS.L5, cam, 860, 664);
    const p1 = toLayer(LAYERS.L5, cam, 1400, 800);
    const w = p1.x - p0.x, h = p1.y - p0.y;
    c.fillStyle = env.fill('fg');
    c.beginPath();
    c.ellipse(p0.x + w * 0.62, p0.y + h * 0.95, w * 0.62, h * 0.95, 0, Math.PI, 0);
    c.fill();
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.setHaze, 0.3), 0.5);
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(p0.x + w * 0.62, p0.y + h * 0.95, w * 0.62, h * 0.95, 0, Math.PI * 1.08, Math.PI * 1.75);
    c.stroke();
  });

  // the reverse flame push: we start INSIDE the traveller's lantern flame (its white core filling the frame
  // centre, its glow ~600 px), and the camera pulls back out of it onto the board as the tint settles
  const fl = 1 - win(t, 0.0, 1.3);
  if (fl > 0.003) {
    const c = f.c;
    const k = fl * fl;
    const core = mixLab(f.mood.core, '#fff3d0', 0.3);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const R = 110 + 640 * k;
    const g = c.createRadialGradient(640, 370, 0, 640, 370, R);
    g.addColorStop(0, withAlpha(core, Math.min(1, 1.15 * fl)));
    g.addColorStop(0.28, withAlpha(core, 0.8 * fl));
    g.addColorStop(0.62, withAlpha(f.mood.halo, 0.5 * fl));
    g.addColorStop(1, withAlpha(f.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
    c.restore();
    // the flame's teardrop resolves out of the glow as it shrinks (soft-edged: gradient, never a flat shape)
    const shapeA = clamp01((1 - k) * 1.6 - 0.25) * fl;
    if (shapeA > 0.01) {
      const S = 26 + 520 * k;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.translate(640, 370 + S * 0.3);
      const tg = c.createRadialGradient(0, -S * 0.2, 0, 0, -S * 0.2, S * 0.9);
      tg.addColorStop(0, withAlpha(core, 0.9 * shapeA));
      tg.addColorStop(0.55, withAlpha(mixLab(core, f.mood.halo, 0.5), 0.55 * shapeA));
      tg.addColorStop(1, withAlpha(f.mood.halo, 0));
      c.fillStyle = tg;
      c.beginPath();
      c.moveTo(0, -S);
      c.bezierCurveTo(S * 0.42, -S * 0.45, S * 0.36, S * 0.2, 0, S * 0.26);
      c.bezierCurveTo(-S * 0.36, S * 0.2, -S * 0.42, -S * 0.45, 0, -S);
      c.fill();
      c.restore();
    }
  }

  // type: Hinton's name card at the board's edge (the words themselves are spoken)
  nameCardLg(f.c, { name: 'Geoffrey Hinton', role: 'writing in 2020', x: 1196, y: 372, align: 'right', at: b.hinton - 0.2, dur: 3.2 }, { t, mood: f.mood, seed: 2020 });
}

/** the inventor cards: paper in the lamp's pool, names and years in the hands' fountain pen */
function inventorRow(c: CanvasRenderingContext2D, env: PaintEnv, t: number, b: Beats, a: number) {
  if (a <= 0.003) return;
  const m = env.mood;
  // RUMELHART catches the lamp: a clear warm lift (paper ~+30%, a halo) held ~0.6 s, settling to a warm rest
  const ruA = win(t, b.rumelhart - 0.25, b.rumelhart + 0.05) * (1 - 0.45 * win(t, b.rumelhart + 0.75, b.rumelhart + 1.2));
  const othersA = win(t, b.others - 0.1, b.others + 0.4);
  // 'that Helsinki student': LINNAINMAA 1970 in the row lights with the Helsinki card
  const linA = pulse(t, b.helsinki - 0.1, 0.25, 1.6) + 0.25 * win(t, b.helsinki + 1.0, b.helsinki + 1.6);
  c.save();
  c.globalAlpha *= a;
  INVENTORS.forEach((card, i) => {
    const p = bw(card.bx, card.by);
    const light = poolAt(DEFAULT_POOL, card.bx, card.by);
    // RUMELHART catches the lamp; the five earlier cards (to its left in time) glow faintly together
    const catchK = Math.max(card.n === 'RUMELHART' ? ruA : i < 5 ? 0.55 * othersA : 0, card.n === 'LINNAINMAA' ? Math.min(1, linA) : 0);
    // the halo goes down FIRST (light on the cork around the card), so the fountain-pen ink stays dark on top
    if (catchK > 0.02) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      glow(c, p.x, p.y, 70 + 40 * catchK, m.halo, 0.5 * catchK);
      if (card.n === 'RUMELHART') glow(c, p.x, p.y, 140, m.core, 0.5 * catchK);
      c.restore();
    }
    c.save();
    c.translate(p.x, p.y);
    c.rotate(card.rot);
    c.fillStyle = withAlpha(m.fg, 0.35);
    c.fillRect(-CARD_W / 2 + 2.5, -CARD_H / 2 + 3, CARD_W, CARD_H);
    const isRu = card.n === 'RUMELHART';
    c.fillStyle = mixLab(paperTone(env, Math.min(1, light + (isRu ? 0.6 : 0.35) * catchK)), m.core, (isRu ? 0.6 : 0.45) * catchK);
    c.fillRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
    // brass pin
    c.fillStyle = mixLab(m.halo, m.set, 0.35);
    c.beginPath();
    c.arc(0, -CARD_H / 2 + 5, 2.6, 0, Math.PI * 2);
    c.fill();
    // fountain-pen script (IM Fell italic, ink)
    c.fillStyle = withAlpha(mixLab(m.ink, '#1d2236', 0.35), 0.92);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    let size = 14;
    c.font = `italic 400 ${size}px ${FONT.fell}`;
    while (c.measureText(card.n).width > CARD_W - 7 && size > 9) {
      size -= 0.5;
      c.font = `italic 400 ${size}px ${FONT.fell}`;
    }
    c.fillText(card.n, 0, 2);
    c.font = `italic 400 12.5px ${FONT.fell}`;
    c.fillText(card.y, 0, 17);
    c.restore();
    if (catchK > 0.02) {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(card.rot);
      c.strokeStyle = withAlpha(m.core, 0.6 * catchK);
      c.lineWidth = 1.3;
      c.strokeRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      c.restore();
    }
  });
  // 'credit still disputed', pencilled under the row
  c.font = `italic 400 13px ${FONT.fell}`;
  c.textAlign = 'center';
  c.fillStyle = withAlpha(mixLab(m.ink, m.set, 0.45), 0.85);
  c.fillText('credit still disputed', BX + 470, BY + 506);
  c.restore();
}

function pinOf(card: { bx: number; by: number }) {
  return bw(card.bx, card.by - CARD_H / 2 + 5);
}

/** threads of light: several cards → the empty pin ('separately'); the Helsinki one brightest ('Helsinki') */
function threadsToPin(c: CanvasRenderingContext2D, env: PaintEnv, t: number, b: Beats) {
  const m = env.mood;
  const hp = bw(HELS.x + HELS.w / 2 - 6, HELS.y);
  const K = SLOTS.K;
  const kL = BX + K.x - K.w / 2 - 26, kR = BX + K.x + K.w / 2 + 26;
  const kTop = BY + K.y - K.h / 2;
  type Line = { from: { x: number; y: number }; at: number; k: number; helsinki?: boolean };
  const lines: Line[] = THREADERS.map((i, n) => ({ from: pinOf(INVENTORS[i]), at: b.threads + n * 0.14, k: 0.55 }));
  lines.push({ from: hp, at: b.helsinki - 0.1, k: 1.5, helsinki: true });
  const converge = win(t, b.stick - 0.1, b.stick + 0.5);
  /** the route: inventor threads bow OUT round the case card (left or right of it), then up to the pin */
  const route = (L: Line) => {
    const to = PIN;
    if (L.helsinki) {
      const mx = (L.from.x + to.x) / 2;
      const p1 = { x: mx - 10, y: Math.min(L.from.y, to.y) - 34 };
      return (v: number) => quad(L.from, p1, to, v);
    }
    const side = L.from.x <= BX + K.x ? kL : kR;
    const p1 = { x: side, y: L.from.y - 40 };
    const p2 = { x: side, y: kTop - 30 };
    return (v: number) => cubic(L.from, p1, p2, to, v);
  };
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const L of lines) {
    const u = sm((t - L.at) / (L.helsinki ? 0.7 : 0.55));
    if (u <= 0) continue;
    const at = route(L);
    const pulseK = L.helsinki ? 1 + 0.9 * pulse(t, b.helsinki, 0.3, 1.4) : 1 + 0.5 * converge * pulse(t, b.stick, 0.25, 1.0);
    // drawn in runs: full strength on the cork, 0.35 where a thread crosses the WHO TAUGHT IT? card
    const steps = 48;
    const pts: P2[] = [L.from];
    for (let s2 = 1; s2 <= steps * u; s2++) pts.push(at(s2 / steps));
    const kx0 = BX + K.x - K.w / 2 - 6, kx1 = BX + K.x + K.w / 2 + 6, ky0 = kTop - 6, ky1 = BY + K.y + K.h / 2 + 6;
    const over = (p: P2) => p.x > kx0 && p.x < kx1 && p.y > ky0 && p.y < ky1;
    for (const [lw, al] of [[6, 0.07], [2.4, 0.22], [1, 0.6]] as const) {
      c.lineWidth = lw * (L.helsinki ? 1.5 : 1);
      for (let i = 1; i < pts.length; i++) {
        const dim = over(pts[i - 1]) || over(pts[i]) ? 0.35 : 1;
        c.strokeStyle = withAlpha(m.core, Math.min(1, al * L.k * pulseK * dim));
        c.beginPath();
        c.moveTo(pts[i - 1].x, pts[i - 1].y);
        c.lineTo(pts[i].x, pts[i].y);
        c.stroke();
      }
    }
    // a bead of light running along the thread (the Helsinki one carries a bigger bead, and runs it twice)
    const beadU = L.helsinki ? ((t - L.at) / 0.7) % 1 : u;
    const beadOn = L.helsinki ? t - L.at < 1.6 : u < 1;
    if (beadOn && beadU > 0) {
      const p = at(beadU);
      glow(c, p.x, p.y, L.helsinki ? 22 : 10, m.core, L.helsinki ? 0.95 : 0.7);
    }
  }
  c.restore();
  // the Helsinki card itself glows (rim up) as its thread lights
  const hk = pulse(t, b.helsinki - 0.1, 0.25, 1.1);
  if (hk > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    glow(c, BX + HELS.x, BY + HELS.y, 90, m.halo, 0.42 * hk);
    c.strokeStyle = withAlpha(m.core, 0.75 * hk);
    c.lineWidth = 1.6;
    c.strokeRect(BX + HELS.x - HELS.w / 2, BY + HELS.y - HELS.h / 2, HELS.w, HELS.h);
    c.restore();
  }
  // the empty pin itself (until the strip covers it)
  if (t < b.stick) {
    c.fillStyle = mixLab(m.halo, m.set, 0.35);
    c.beginPath();
    c.arc(PIN.x, PIN.y, 2.8, 0, Math.PI * 2);
    c.fill();
    if (t > b.threads) glow(c, PIN.x, PIN.y, 18, m.core, 0.4 * win(t, b.threads, b.threads + 0.8));
  }
}
type P2 = { x: number; y: number };
function quad(a: P2, b: P2, c: P2, v: number): P2 {
  const w = 1 - v;
  return { x: w * w * a.x + 2 * w * v * b.x + v * v * c.x, y: w * w * a.y + 2 * w * v * b.y + v * v * c.y };
}
function cubic(a: P2, b: P2, c: P2, d: P2, v: number): P2 {
  const w = 1 - v;
  return {
    x: w * w * w * a.x + 3 * w * w * v * b.x + 3 * w * v * v * c.x + v * v * v * d.x,
    y: w * w * w * a.y + 3 * w * w * v * b.y + 3 * w * v * v * c.y + v * v * v * d.y,
  };
}

/** the 1986 paper as the same printed clipping as on the loom (sets/ch05-s04-loom journalClipping) */
function titleStrip(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, light: number, rot: number) {
  // lettered NATURE · 1986 to match ch05-s04's stamp (cap ≈ 25 px at 1080p under the board camera)
  journalClipping(c, { x, y: y - STRIP.h / 2, w: STRIP.w, h: STRIP.h, rot: -0.025 + rot, paper: mixLab(paperTone(env, light), env.mood.haze, 0.25), masthead: 'NATURE · 1986', mastSize: 12.5 }, env.mood);
}

/** C1-c: the 1961 caption card with its oxblood '?', lifting, turned over, its pencilled back */
function falseClue(c: CanvasRenderingContext2D, env: PaintEnv, at: { x: number; y: number }, lift: number, flip: number, settle: number, big = 1) {
  const m = env.mood;
  const k = STUDY.board.k;
  const light = poolAt(DEFAULT_POOL, FALSE.x, FALSE.y) * (1 - 0.45 * settle);
  const dy = -16 * lift * (1 - 0.6 * settle);
  const sx = Math.cos(Math.PI * flip); // 1 → −1: turned over
  const w = FALSE.w * k, h = FALSE.h * k;
  c.save();
  c.translate(at.x, at.y + dy);
  c.rotate(-0.05 * lift * (1 - settle));
  c.scale(big, big);
  // a soft lift shadow on the board behind it while it is held forward
  if (big > 1.02) {
    c.fillStyle = withAlpha(m.ink, 0.25 * (big - 1));
    c.fillRect(-(FALSE.w * k) / 2 + 9, -(FALSE.h * k) / 2 + 12, FALSE.w * k, FALSE.h * k);
  }
  c.scale(Math.max(0.02, Math.abs(sx)), 1);
  if (sx >= 0) {
    drawCard(c, FALSE, { x: 0, y: 0, k, light, pin: lift < 0.3 }, env);
  } else {
    // the back: plain paper, a pencilled note in the hands' script
    c.fillStyle = withAlpha(m.fg, 0.35);
    c.fillRect(-w / 2 + 2.5, -h / 2 + 3, w, h);
    c.fillStyle = paperTone(env, Math.max(0.35, light));
    c.fillRect(-w / 2, -h / 2, w, h);
    c.fillStyle = withAlpha(mixLab(m.set, m.ink, 0.55), 0.9);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.font = `italic 400 ${14 * k}px ${FONT.fell}`;
    c.fillText('same name,', 0, -8 * k);
    c.fillText('a different', 0, 9 * k);
    c.fillText('procedure', 0, 25 * k);
    // set back half in shadow: the lamp's edge falls across it
    if (settle > 0) {
      const sg = c.createLinearGradient(-w / 2, 0, w / 2, 0);
      sg.addColorStop(0, withAlpha(m.ink, 0.55 * settle));
      sg.addColorStop(0.45, withAlpha(m.ink, 0.4 * settle));
      sg.addColorStop(0.6, withAlpha(m.ink, 0));
      c.fillStyle = sg;
      c.fillRect(-w / 2, -h / 2, w, h);
    }
  }
  c.restore();
}

// ------------------------------------------------------------------ insert: the desk in the lamp's pool
function paintDesk(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  f.camera(CAMERA3_HOME);
  f.setMood('candleAmber');
  f.backlight({ sunX: 980, sunY: 200, sunRadius: 500, intensity: 0.3 });
  const t0 = b.cutDesk;
  // lands, is read for a beat (its question is answered), then burns from one corner
  const land = t0 + 0.15;
  const burn0 = land + 0.42;
  const burnU = clamp01((t - burn0) / 0.62);
  f.layer('L4', (c, env) => {
    const m = env.mood;
    // the desk top seen low, receding: dark wood, the lamp's pool warm on it
    c.fillStyle = mixLab(m.set, m.fg, 0.4);
    c.fillRect(-100, -100, 1480, 920);
    const g = c.createRadialGradient(700, 470, 20, 700, 470, 640);
    g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.6), 0.95));
    g.addColorStop(0.5, withAlpha(mixLab(m.set, m.halo, 0.3), 0.6));
    g.addColorStop(1, withAlpha(m.set, 0));
    c.fillStyle = g;
    c.fillRect(-100, -100, 1480, 920);
    c.strokeStyle = withAlpha(m.fg, 0.28);
    c.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) {
      const y = 140 + i * i * 2.2;
      c.beginPath();
      c.moveTo(-100, y);
      c.bezierCurveTo(400, y + 6, 900, y - 6, 1380, y);
      c.stroke();
    }
    // the card falls in, lands, curls, burns from one corner
    const W = 380, H = 100;
    let x = 640, y = 470, rot = -0.12, sq = 1;
    if (t < land) {
      const u = (t - t0) / (land - t0);
      y = lerp(-80, 470, u * u);
      x = lerp(700, 640, u);
      rot = lerp(0.6, -0.12, u);
    }
    // curling: the card lifts at its ends (a slight squash and bow)
    const curl = win(t, land, land + 0.5);
    sq = 1 - 0.18 * curl;
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(1 - 0.06 * curl, sq);
    // the burn front sweeps from the right-hand corner
    const front = lerp(W / 2 + 20, -W / 2 - 30, burnU);
    c.save();
    c.beginPath();
    c.moveTo(-W / 2 - 40, -H);
    c.lineTo(front - 18, -H);
    c.quadraticCurveTo(front + 14, 0, front - 10, H);
    c.lineTo(-W / 2 - 40, H);
    c.closePath();
    c.clip();
    c.fillStyle = withAlpha(m.fg, 0.4);
    c.fillRect(-W / 2 + 4, -H / 2 + 6, W, H);
    c.fillStyle = mixLab(m.halo, m.rim, 0.6);
    c.beginPath();
    c.moveTo(-W / 2, -H / 2 + 6 * curl);
    c.quadraticCurveTo(0, -H / 2 - 4 * curl, W / 2, -H / 2 + 6 * curl);
    c.lineTo(W / 2, H / 2 - 6 * curl);
    c.quadraticCurveTo(0, H / 2 + 4 * curl, -W / 2, H / 2 - 6 * curl);
    c.closePath();
    c.fill();
    typedText(c, Q_TEXT, 0, 2, W * 0.86, H * 0.72, withAlpha(m.ink, 0.88), 32);
    c.restore();
    // the ember edge, the char behind it
    if (burnU > 0 && burnU < 1) {
      // a scorched band ahead of the ember, then the glowing edge itself
      c.save();
      c.globalCompositeOperation = 'lighter';
      glow(c, front - 6, 0, 70, mixLab(m.core, '#ffb060', 0.3), 0.55);
      c.restore();
      c.strokeStyle = withAlpha(mixLab(m.ink, m.halo, 0.25), 0.55);
      c.lineWidth = 16;
      c.beginPath();
      c.moveTo(front - 30, -H / 2);
      c.quadraticCurveTo(front + 2, 0, front - 22, H / 2);
      c.stroke();
      c.strokeStyle = withAlpha(mixLab(m.core, '#ffb060', 0.25), 0.95);
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(front - 18, -H / 2);
      c.quadraticCurveTo(front + 14, 0, front - 10, H / 2);
      c.stroke();
      c.fillStyle = withAlpha(m.ink, 0.75);
      c.fillRect(front - 4, -H / 2 + 4, 26 * (1 - burnU) + 6, H - 8);
    }
    c.restore();
    // smoke rising off the burning edge
    if (burnU > 0) {
      const sa = Math.sin(Math.PI * Math.min(1, burnU * 1.1));
      const fx = x + lerp(W / 2 + 20, -W / 2 - 30, burnU) * 0.94;
      for (let k = 0; k < 3; k++) {
        c.strokeStyle = withAlpha(m.haze, (0.35 - k * 0.08) * sa);
        c.lineWidth = 3 - k * 0.6;
        c.beginPath();
        for (let j = 0; j <= 16; j++) {
          const yy = y - 40 - j * 16;
          const xx = fx + k * 14 + 12 * Math.sin(j * 0.55 + t * 4 + k);
          if (j === 0) c.moveTo(xx, yy);
          else c.lineTo(xx, yy);
        }
        c.stroke();
      }
    }
    // a curl of ash and a thread of smoke after it has gone
    const after = win(t, burn0 + 0.75, burn0 + 1.0);
    if (after > 0) {
      c.fillStyle = withAlpha(m.ink, 0.6 * after);
      c.beginPath();
      c.ellipse(x - 150, y + 8, 34, 9, -0.1, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha(m.haze, 0.5 * after);
      c.lineWidth = 2;
      c.beginPath();
      for (let k = 0; k <= 20; k++) {
        const yy = y - k * 14;
        const xx = x - 150 + 10 * Math.sin(k * 0.6 + t * 3);
        if (k === 0) c.moveTo(xx, yy);
        else c.lineTo(xx, yy);
      }
      c.stroke();
    }
  });
  if (burnU > 0 && burnU < 1) {
    const front = 640 + lerp(190 + 20, -190 - 30, burnU) * 0.94;
    f.practical({ x: front, y: 452, kind: 'candle', seed: 1986, intensity: 0.85 * Math.sin(Math.PI * burnU), radius: 46 });
  }
  lampSpill(f, 0.9, false);
}

// ------------------------------------------------------------------ insert: the plant (a blank card tucked behind the board)
function paintPlant(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam: Camera3 = { x: BX + 1000 * STUDY.board.k - 40, y: 440, z: 440, lens: 1 };
  f.camera(cam);
  f.setMood('candleAmber');
  studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'labGreen', kind: 'night' } });
  const tq = tq12(t);
  // the hand is already in, card held, at the cut; the tuck itself is slow enough to read (~0.3 s), on 'plant'
  const u = (tq - (b.cutPlant - 0.3)) / 1.15;
  const edge = { x: BX + 1000 * STUDY.board.k, y: 440 };
  const target = { x: edge.x - 8, y: edge.y };
  const tp = toScreen(LAYERS.L4, cam, target.x, target.y);
  const entry = { R: toLayer(LAYERS.L4, cam, tp.x + 700, tp.y + 620), L: toLayer(LAYERS.L4, cam, tp.x + 790, tp.y + 690) };
  const pose = u > 0 && u < 1 ? hands.act('pin', u, target, { held: 'none', scale: 0.62, entry }) : null;
  // the blank card: in the hand (in front) as it comes in, then slid BEHIND the board's edge (drawn before
  // the board, so the frame hides it), a sliver of its corner left showing: the plant, unexplained
  const sock = pose ? hands.socket(pose) : null;
  const slide = clamp01((u - 0.42) / 0.3);
  const behind = u >= 0.42;
  const blank = (c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number) => {
    c.fillStyle = withAlpha(env.mood.fg, 0.35);
    c.fillRect(x - 38, y - 22, 80, 50);
    c.fillStyle = mixLab(env.mood.halo, env.mood.rim, 0.55);
    c.fillRect(x - 40, y - 25, 80, 50);
  };
  f.layer('L4', (c, env) => {
    if (!behind && u < 1) return;
    const x = lerp(edge.x + 30, edge.x - 18, sm(slide));
    blank(c, env, x, edge.y + 4);
  });
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    wall: false,
    xray: false,
    board: { hide: ['O'] },
    extra: (c, env) => {
      chatBoxMuted(c, env);
      if (!behind && sock) blank(c, env, sock.x - 28, sock.y + 6);
      if (pose) hands.draw(c, pose, env);
    },
  });
  studyNear(f, { key: ID, cams: sc.CAMS, file: true });
  lampSpill(f, 0.7, false);
}

// ------------------------------------------------------------------ the chat box, muted (one accent: the lamp)
/** the board's output card (slot O) drawn by the shot, its cyan pulled ~50% toward grey: here it is not the subject */
function chatBoxMuted(c: CanvasRenderingContext2D, env: PaintEnv) {
  const O = SLOTS.O;
  const k = STUDY.board.k;
  const x = BX + O.x * k, y = BY + O.y * k;
  drawCard(c, O, { x, y, k, light: poolAt(DEFAULT_POOL, O.x, O.y), pin: true }, env);
  c.save();
  c.beginPath();
  c.rect(x - (O.w * k) / 2 - 4, y - (O.h * k) / 2 - 4, O.w * k + 8, O.h * k + 8);
  c.clip();
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = withAlpha('#808080', 0.5);
  c.fillRect(x - (O.w * k) / 2 - 4, y - (O.h * k) / 2 - 4, O.w * k + 8, O.h * k + 8);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = withAlpha(env.mood.halo, 0.25);
  c.fillRect(x - (O.w * k) / 2 - 4, y - (O.h * k) / 2 - 4, O.w * k + 8, O.h * k + 8);
  c.restore();
}

// ------------------------------------------------------------------ near planes in front of the board
/** two planes between the lens and the board (the board camera sits at z ~480–530, so L5/L6 are behind
 *  the lens): a fountain pen and the desk's near edge out of focus at the lower left, and a loose index
 *  card's corner at the top left, nearer still. Fixed in their own worlds, they slide against the board as
 *  the camera drifts (three planes: card corner, pen/desk, board). */
const NEAR_A: LayerSpec = { id: 'nearA', z: 780, haze: 0, blur: 3 };
const NEAR_B: LayerSpec = { id: 'nearB', z: 640, haze: 0, blur: 7 };
const REF_CAM: Camera3 = { x: BX + 470, y: BY + 440 - 66, z: 496, lens: 1 };
function nearPlanes(f: Frame, cam: Camera3, alpha: number) {
  if (cam.z < 440 || cam.z > 600 || alpha <= 0.003) return;
  f.layer(NEAR_A, (c, env) => {
    c.globalAlpha *= alpha;
    // the desk's near edge (a dark slab low left) and a pen lying across it, its clip catching the lamp
    const a = toLayer(NEAR_A, REF_CAM, -60, 640);
    const b2 = toLayer(NEAR_A, REF_CAM, 330, 760);
    c.fillStyle = env.fill('fg');
    c.beginPath();
    c.moveTo(a.x, a.y + 8);
    c.quadraticCurveTo((a.x + b2.x) / 2, a.y - 4, b2.x, a.y + 30);
    c.lineTo(b2.x, b2.y + 200);
    c.lineTo(a.x, b2.y + 200);
    c.closePath();
    c.fill();
    const p0 = toLayer(NEAR_A, REF_CAM, 20, 612), p1 = toLayer(NEAR_A, REF_CAM, 250, 655);
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x), len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    c.save();
    c.translate(p0.x, p0.y);
    c.rotate(ang);
    c.fillStyle = mixLab(env.mood.ink, env.mood.set, 0.2);
    c.beginPath();
    c.moveTo(0, -5);
    c.lineTo(len * 0.8, -6);
    c.quadraticCurveTo(len, -3, len, 0);
    c.quadraticCurveTo(len, 3, len * 0.8, 6);
    c.lineTo(0, 5);
    c.closePath();
    c.fill();
    // the cap band and clip catching the lamp, the steel nib at the tip
    c.fillStyle = withAlpha(env.mood.rim, 0.8);
    c.fillRect(len * 0.06, -6.5, len * 0.32, 2);
    c.fillRect(len * 0.42, -6, 3, 12);
    c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.75);
    c.beginPath();
    c.moveTo(len * 0.86, -2.5);
    c.lineTo(len + 9, 0);
    c.lineTo(len * 0.86, 2.5);
    c.closePath();
    c.fill();
    c.restore();
  });
  f.layer(NEAR_B, (c, env) => {
    c.globalAlpha *= alpha;
    // a loose index card's corner hanging into the top-left of frame, nearer still and soft
    const q = toLayer(NEAR_B, REF_CAM, -40, -40);
    const r = toLayer(NEAR_B, REF_CAM, 210, 105);
    c.fillStyle = mixLab(paperTone(env, 0.5), env.mood.fg, 0.12);
    c.beginPath();
    c.moveTo(q.x, q.y);
    c.lineTo(r.x, q.y);
    c.lineTo(q.x + (r.x - q.x) * 0.55, r.y);
    c.lineTo(q.x, r.y - (r.y - q.y) * 0.1);
    c.closePath();
    c.fill();
  });
}
