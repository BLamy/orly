/**
 * ch07-s01 — the dinner question is settled (candleAmber, the study, night; 20.5 s, head-hold 3.6 s).
 * The two bets are named and struck as the narration says how each ended; the pen ticks each, a typed slip reads
 * both results, and the card is unpinned into the lamp's pool.
 *
 * CAMERA: BOARD. It OPENS on ch06-s08's last framing (the two question cards, k ≈ 3.2), so the crossfade never
 * double-exposes two sizes of the same cards, and eases out over ~3.7 s to ONE locked framing that holds the Q2
 * card, the bet sheet, both verdict flags, the slip and the card's landing spot; then only a slow 3 % push, with
 * one short insert (a gentle push onto the sheet's margin) for the ticks and the slip.
 * LIGHT: the green-shaded banker's lamp is a practical at the top-right corner (L5, near, blurred); it keys the
 * frame: the Q card and the bet sheet lit, the board's margins and the far-left cards falling to near-black,
 * its pool an ellipse on the desk where the card lands.
 *   0 → 3.6       HEAD-HOLD: the CHAPTER INDEX TAB 'Two Accomplices: Data and Fire' (1.25×) drops at 0.1, holds
 *                 2.5 s, slides up; the camera eases out from ch06-s08's framing
 *   'dinner'      the camera settles on the board; the question card's thread trembles
 *   'two'         a typed flag is pinned beside bet 1: JACKEL: BY 2000, NETS EXPLAINED
 *   'explain'     the pen (one hand, from the bottom centre) strikes through NETS EXPLAINED
 *   'two#2'       the flag beside bet 2: VAPNIK: BY 2005, NETS UNUSED
 *   'still'       the pen strikes through NETS UNUSED
 *   'tick'        INSERT: the camera eases onto the sheet's margin; the pen ticks bet 1 (Jackel), then bet 2
 *   'lost'        the other hand lays the typed results slip JACKEL, 2000: LOST / VAPNIK, 2005: LOST on the
 *                 sheet: the line and the slip land together
 *   'bet' end     the camera eases back; a glow runs over Jackel's line, then Vapnik's
 *   cardDown      a hand from ABOVE (never across the slip) pinches the card off its pin, draws it along the
 *                 thread and lets go; it turns once in the air and lands face up in the lamp's pool; the empty
 *                 brass pin glints; the thread twangs and settles; the paper wine glasses catch a glint; hold 1 s
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, defineShot, toLayer, toScreen, withAlpha, mixLab } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN, type HandsPose, type Pt } from '../sets/narratorHands';
import { STUDY, studyCase, studyNear, studyRoom } from '../sets/study';
import { boardStateAt } from '../sets/studyState';
import { BOARD, Q_SLOTS } from '../sets/studyState';
import { DEFAULT_POOL, drawCard, oxblood, paperTone, poolAt } from '../sets/caseBoard';
import { indexTab } from '../sets/indexTab';
import { BET, SLIP, SLIP_AT as SLIP_AT0, TICK_S, betFlag, betSheet, flagGeom, penArmTo, resultsSlip, tickAt, wineGlasses } from '../sets/ch07-s01-betSheet';
import { brassPin, clamp01, lerp, mixCam, pulse, sm, tq12, win } from '../sets/ch07-s01-kit';
import { hazeColumn, lampGrade, nearLip } from '../sets/ch07-s01-grade';

const ID = 'ch07-s01';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------------------------------------ geometry
const K = STUDY.board.k;
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };
const QX = STUDY.board.x + Q_SLOTS.Q2 * K;
const sagAt = (bx: number) => STUDY.board.y + BOARD.threadY * K + Math.sin(((bx - 40) / 920) * Math.PI) * 10 * K;
const QY = sagAt(Q_SLOTS.Q2); // where the clip meets the thread
const CARD = { w: 168, h: 44 };
const CARD_C = { x: QX, y: QY + 10 * K + 22 * K };
const Q_LIGHT = poolAt(POOL, Q_SLOTS.Q2, BOARD.threadY + 40);
const SHEET_LIGHT = poolAt(POOL, 505, 168);
const GLASSES = { x: BET.x + BET.w - 12, y: BET.y - 6 };
/** the results slip: raised onto the sheet's lower half and a touch left, so the falling card never crosses it */
const SLIP_AT = { ...SLIP_AT0, x: SLIP_AT0.x - 18, y: SLIP_AT0.y - 22 };
/** the bet's two paper wine-glass cut-outs, pinned at the board's right edge (world), clear of the flags */
const TOAST = { x: 905, y: 246 };
/** the desk top's far edge (L4 world y): in front of the board's lower half */
const DESK_Y = 286;
/** the hand draws the card along the thread to here and lets go (right of the slip, under Q3) */
const DROP = { x: QX + 172, y: QY + 4 };
/** where the card comes to rest, face up in the lamp's pool (L4 world) */
const LAND = { x: 858, y: 300 };
const STATE0 = (() => {
  const st = boardStateAt(ID, 'start');
  return { ...st, questions: st.questions.filter((q) => q.slot !== 'Q2') };
})();

// cameras (L4 k = 1000 / (1000 − z))
/** ch06-s08's last frame, exactly (its camC at D): the crossfade matches size and position */
const CAM_06: Camera3 = { x: 674, y: 133.17, z: 690, lens: 1 };
/** THE framing: Q2 card, bet sheet, both flags, the slip and the landing spot (k ≈ 2.48) … */
const CAM_F0: Camera3 = { x: 700, y: 200, z: 597, lens: 1 };
/** … pushed 3 % by the end */
const CAM_F1: Camera3 = { x: 704, y: 202, z: 609, lens: 1 };
/** the tick insert: a gentle push onto the sheet's margin, the flags and the slip's place (k ≈ 3.15) */
const CAM_I0: Camera3 = { x: 688, y: 206, z: 682, lens: 1 };
const CAM_I1: Camera3 = { x: 690, y: 207, z: 690, lens: 1 };
const CAMS = [CAM_06, CAM_F0, CAM_F1, CAM_I0, CAM_I1];
const HS = 0.6; // hand scale on the board close
/** the hands' entries (screen px): the pen from the bottom centre (steep), the slip hand bottom-left, the unpin from above */
const ENTRY_PEN = { x: 800, y: 1060 };
const ENTRY_SLIP = { x: 430, y: 1080 };
const ENTRY_TOP = { x: 700, y: -360 };

interface B {
  D: number;
  ask: number;
  keys: [number, Camera3][];
  flag1: number;
  flag2: number;
  explain: number;
  still: number;
  tick1: number;
  tick2: number;
  pen0: number;
  pen1: number;
  slip0: number;
  slipDur: number;
  jackel: number;
  vapnik: number;
  /** the top hand: reach in, pinch off the pin, draw along the thread, let go (= release), withdraw */
  un0: number;
  unPinch: number;
  unOff: number;
  release: number;
  unOut: number;
  land: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const ask = T.beat('ask');
    const tick = T.beat('tick');
    const lost = T.word('L0701', 'lost');
    const release = T.beat('cardDown');
    const slipDur = 0.85;
    const explain = T.word('L0701', 'explain');
    const still = T.word('L0701', 'still');
    const push = (t: number) => mixCam(CAM_F0, CAM_F1, clamp01((t - 4.2) / (D - 4.2)));
    const ins0 = tick - 0.85, ins1 = T.wordEnd('L0701', 'bet') - 0.1;
    const b: B = {
      D,
      ask,
      keys: [
        [0, CAM_06],
        [0.5, CAM_06],
        [4.2, CAM_F0],
        [ins0, push(ins0)],
        [tick - 0.05, CAM_I0],
        [ins1, CAM_I1],
        [ins1 + 1.25, push(ins1 + 1.25)],
        [D, CAM_F1],
      ],
      flag1: T.word('L0701', 'two') - 0.2,
      flag2: T.word('L0701', 'two#2') - 0.2,
      explain,
      still,
      tick1: tick,
      tick2: tick + 0.27,
      pen0: explain - 0.75,
      pen1: tick + 0.8,
      // the other hand lays the slip down ON 'lost' (u = .45 is the moment it lies on the sheet)
      slip0: lost + 0.12 - 0.45 * slipDur,
      slipDur,
      jackel: T.beat('jackel'),
      vapnik: T.beat('vapnik'),
      un0: release - 0.95,
      unPinch: release - 0.6,
      unOff: release - 0.45,
      release,
      unOut: release + 0.6,
      land: Math.min(D - 1.0, release + 0.85),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    // one camera through the keys (eased between neighbours): out of ch06-s08's framing, a 3 % push, one insert
    const cam = camAt(t, b);
    f.camera(cam);
    studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'duskRose', kind: 'city' } });
    const tq = tq12(t);
    const entry = {
      pen: toLayer(LAYERS.L4, cam, ENTRY_PEN.x, ENTRY_PEN.y),
      slip: toLayer(LAYERS.L4, cam, ENTRY_SLIP.x, ENTRY_SLIP.y),
      top: toLayer(LAYERS.L4, cam, ENTRY_TOP.x, ENTRY_TOP.y),
    };
    studyCase(f, {
      shot: ID,
      when: 'start',
      key: ID,
      board: { state: STATE0, threadGlint: 0.4 * pulse(t, b.ask - 0.1, 0.2, 0.8) + twang(t, b) * 0.8 },
      extra: (c, env) => boardBeat(c, env, t, tq, b, entry),
    });
    // the glasses' glint and the empty pin's glint: practical sparkles, motivated by the lamp
    const gl = pulse(t, b.land - 0.1, 0.25, 0.7);
    if (gl > 0.02) f.practical({ x: TOAST.x, y: TOAST.y - 6, kind: 'led', seed: 71, intensity: 0.4 * gl, radius: 30, layer: 'L4' });
    const pg = pulse(t, b.unOff + 0.05, 0.2, 0.9);
    if (pg > 0.02) f.practical({ x: QX, y: QY + 12 * K, kind: 'led', seed: 72, intensity: 0.45 * pg, radius: 18, layer: 'L4' });
    // the near plane: the desk (L5); the shared drape/pelmet/chair would bury this close
    studyNear(f, { key: ID, cams: CAMS, file: true, occluders: false });

    // ---- screen space: haze the cropped far-left column, the desk, the card landing in its pool, the near lip
    hazeColumn(f, { x0: 0, x1: 210, blur: 3.2, alpha: 0.5 });
    const m4 = toScreen(LAYERS.L4, cam, 0, 0);
    const deskTop = m4.y + DESK_Y * m4.k;
    const pool = { x: m4.x + LAND.x * m4.k + 20, y: deskTop + 34 };
    // the KEY: the banker's lamp (top right) lights the card and the sheet; margins and far-left cards fall to near-black
    const open = sm(t / 2.6);
    lampGrade(f, { x: 820, y: 260, floor: 0.6 - 0.12 * open, core: 300, warm: 0.08, vignette: 0.25 + 0.2 * open });
    keyLight(f, { x: 620, y: 290, rx: 600, ry: 380, floor: 0.42 - 0.3 * open });
    // the desk under the shade: dark wood, the pool lit by the lamp itself (after the key), the card landing in it
    desk(f, deskTop, b, t, pool);
    fallingCard(f, t, b, m4);
    nearLip(f, { key: `${ID}/v2`, top: Math.max(deskTop + 92, 668), dx: -(cam.x - 700) * 2.6, shade: false, glow: 0 });
    bankersPractical(f, cam, t);
    // the chapter index tab (screen-locked, last), 1.25× so its type clears the legibility floor
    f.c.save();
    f.c.translate(48, 0);
    f.c.scale(1.25, 1.25);
    f.c.translate(-48, 0);
    indexTab(f.c, { title: 'Two Accomplices: Data and Fire', at: 0.1, hold: 2.5 }, { t, mood: f.mood });
    f.c.restore();
  },
});

function camAt(t: number, b: B): Camera3 {
  const k = b.keys;
  if (t <= k[0][0]) return { ...k[0][1] };
  for (let i = 1; i < k.length; i++) {
    if (t < k[i][0]) {
      const u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      // the long push segments run linearly (a constant creep); moves between framings ease
      const lin = k[i - 1][1].z < 640 && k[i][1].z < 640 && k[i][0] - k[i - 1][0] > 3;
      return mixCam(k[i - 1][1], k[i][1], lin ? u : sm(u));
    }
  }
  return { ...k[k.length - 1][1] };
}

/** the thread's twang after the card leaves: a decaying oscillation 0..1 */
function twang(t: number, b: B) {
  const dt = t - b.unOff + 0.05;
  if (dt < 0) return 0;
  return Math.exp(-dt * 2.4) * Math.abs(Math.sin(dt * 22));
}

type Entries = { pen: Pt; slip: Pt; top: Pt };

function boardBeat(c: C, env: PaintEnv, t: number, tq: number, b: B, entry: Entries) {
  const m = env.mood;
  // --- the bet sheet (pinned below the thread since ch06-s05), its ticks and the glows over each bet
  const tk1 = clamp01((tq - b.tick1) / 0.17), tk2 = clamp01((tq - b.tick2) / 0.17);
  const g1 = pulse(t, b.jackel - 0.05, 0.25, 0.8), g2 = pulse(t, b.vapnik - 0.05, 0.25, 0.8);
  // while each bet is being told, a soft lamp glow lies over its lines and its flag
  const r1 = win(t, b.flag1 - 0.1, b.flag1 + 0.5) * (1 - win(t, b.flag2 - 0.6, b.flag2));
  const r2 = win(t, b.flag2 - 0.1, b.flag2 + 0.5) * (1 - win(t, b.tick1 - 0.6, b.tick1));
  betSheet(c, env, { light: SHEET_LIGHT, tick: [tk1, tk2], glow: [Math.max(g1 * 0.8, 0.45 * r1), Math.max(g2 * 0.8, 0.45 * r2)] });
  brassPin(c, env, BET.x + BET.w / 2, BET.y + 6, SHEET_LIGHT, 0, 4.2);
  wineGlasses(c, env, { x: GLASSES.x, y: GLASSES.y, s: 0.95, light: SHEET_LIGHT });
  // the two flags in the margin: whose bet, and what it claimed; struck through as the narration says it failed
  const S = strikes(c, b);
  const f1 = clamp01((tq - b.flag1) / 0.34), f2 = clamp01((tq - b.flag2) / 0.34);
  betFlag(c, env, 0, { pin: sm(f1), strike: S.u1(tq), light: SHEET_LIGHT, glow: Math.max(0.6 * r1, g1) });
  betFlag(c, env, 1, { pin: sm(f2), strike: S.u2(tq), light: SHEET_LIGHT, glow: Math.max(0.6 * r2, g2) });
  for (const [i, u] of [[0, f1], [1, f2]] as const) if (u > 0.6) brassPin(c, env, S.g[i].x + 8, S.g[i].y + S.g[i].h / 2, SHEET_LIGHT, 0, 3.2);
  // the two paper wine-glass cut-outs at the board's right edge (the bet's 'fancy dinner'), toasting
  toastGlasses(c, env, TOAST.x, TOAST.y, pulse(t, b.land - 0.1, 0.25, 0.7));

  // --- the results slip: carried in by the left hand from the bottom-left, laid on the sheet on 'lost'
  const su = (tq - b.slip0) / b.slipDur;
  if (su >= 0.45) resultsSlip(c, env, { ...SLIP_AT, light: SHEET_LIGHT, read: [g1, g2] });

  // --- the question card's clip: hanging (trembling on 'dinner'); once the card is off, an empty brass pin
  const emptyClip = tq >= b.unOff;
  const clipSwing = twang(t, b) * 0.35;
  c.save();
  c.strokeStyle = oxblood(env);
  c.lineWidth = 1.2 * K;
  c.translate(QX, QY);
  c.rotate(emptyClip ? clipSwing * Math.sin((t - b.unOff) * 18) : 0);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 10 * K);
  c.stroke();
  if (emptyClip) brassPin(c, env, 0, 12 * K, Q_LIGHT + 0.3, 0.6 * pulse(t, b.unOff + 0.05, 0.2, 0.9), 4.6);
  else {
    c.fillStyle = mixLab(m.halo, m.set, 0.35);
    c.fillRect(-2.2, 7.5 * K, 4.4, 4);
  }
  c.restore();
  const tremble = 0.035 * pulse(t, b.ask - 0.05, 0.12, 0.5) * Math.sin((t - b.ask) * 26);
  const sway = 0.012 * Math.sin(t * 1.3);
  const len = HAND_LEN * HS;
  const card = (p: Pt, rot: number) => drawCard(c, { id: 'Q-Q2', w: CARD.w, h: CARD.h, icon: 'question', text: 'WHO PAID FOR DINNER?' }, cardAt(p, rot), env);

  // --- the unpin: a hand from ABOVE the board (never across the slip), on twos
  if (tq < b.unPinch) card(CARD_C, tremble + sway);
  if (tq >= b.un0 && tq < b.unOut) {
    const clip = { x: QX + 4, y: QY + 13 * K };
    const from = { x: lerp(entry.top.x, clip.x, 0.3), y: lerp(entry.top.y, clip.y, 0.3) };
    const drop = { x: DROP.x, y: DROP.y + 9 * K };
    const out = { x: lerp(entry.top.x, drop.x, 0.3), y: lerp(entry.top.y, drop.y, 0.3) };
    let at: Pt;
    let shape: 'open' | 'pinch' = 'open';
    let held = false;
    if (tq < b.unPinch) at = lerpPt(from, clip, sm((tq - b.un0) / (b.unPinch - b.un0)));
    else if (tq < b.unOff) {
      at = clip;
      shape = 'pinch';
      held = true;
    } else if (tq < b.release) {
      at = lerpPt(clip, drop, sm((tq - b.unOff) / (b.release - b.unOff)));
      shape = 'pinch';
      held = true;
    } else if (tq < b.release + 0.12) at = { x: drop.x, y: drop.y - 4 };
    else {
      at = lerpPt(drop, out, sm((tq - b.release - 0.12) / (b.unOut - b.release - 0.12)));
    }
    const arm = hands.reach(entry.top, at, shape, len, { held: held ? 'card' : 'none' });
    if (held) {
      const sk = hands.socket({ right: arm, scale: HS }) ?? at;
      card({ x: sk.x, y: sk.y + CARD.h / 2 - 2 }, 0.03 * Math.sin((tq - b.unPinch) * 5));
    }
    hands.draw(c, { right: arm, scale: HS }, env, { heldDraw: () => {} });
  }

  // --- the pen: two strikes, two ticks; the arm rises steeply from the bottom centre (cut by the desk's lip)
  if (tq >= b.pen0 && tq < b.pen1) {
    hands.draw(c, { right: penArmTo(entry.pen, penNib(tq, b, S), len), scale: HS }, env, { heldDraw: () => {} });
  }
  // --- the slip: the left hand from the bottom-left lays it across the sheet
  if (su > 0 && su < 1) {
    const p = hands.act('pin', su, { x: SLIP_AT.x - SLIP.w * 0.3, y: SLIP_AT.y + 4 }, { held: 'slip', scale: HS, entry: { R: entry.slip } });
    const lp: HandsPose = { left: p.right, scale: HS };
    hands.draw(c, lp, env, {
      heldDraw: (cc, at, _h, e) =>
        resultsSlip(cc, e, { x: at.x + SLIP.w * 0.3, y: at.y - 4, rot: SLIP_AT.rot + 0.07 * (1 - sm(su / 0.45)), light: SHEET_LIGHT }),
    });
  }
}

const lerpPt = (a: Pt, b: Pt, u: number): Pt => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });

/** the two strikes: geometry (measured in this context) and their 0..1 progress against the words */
const STRIKE_DUR = 0.6;
function strikes(c: C, b: B) {
  const g = [flagGeom(c, 0), flagGeom(c, 1)];
  const s1 = b.explain - 0.05, s2 = b.still - 0.05;
  return {
    g,
    s1,
    s2,
    u1: (tq: number) => sm(clamp01((tq - s1) / STRIKE_DUR)),
    u2: (tq: number) => sm(clamp01((tq - s2) / STRIKE_DUR)),
  };
}
type Strikes = ReturnType<typeof strikes>;

/**
 * the nib's long performance: up from below to flag 1, strike; rest low below the flags, breathing; over to
 * flag 2, strike; across to the sheet's right margin, tick bet 1, hop, tick bet 2; drop away down-frame
 */
function penNib(tq: number, b: B, S: Strikes): Pt {
  const A1 = { x: S.g[0].strike.x0, y: S.g[0].strike.y }, Z1 = { x: S.g[0].strike.x1, y: S.g[0].strike.y - 1.4 };
  const A2 = { x: S.g[1].strike.x0, y: S.g[1].strike.y }, Z2 = { x: S.g[1].strike.x1, y: S.g[1].strike.y - 1.4 };
  const REST = { x: S.g[1].x + S.g[1].w * 0.55, y: S.g[1].y + S.g[1].h + 34 };
  const breathe = (p: Pt) => ({ x: p.x + 1.5 * Math.sin(tq * 1.7), y: p.y + 2 * Math.sin(tq * 1.1 + 0.6) });
  const go = (p: Pt, q: Pt, t0: number, t1: number, arc = 0): Pt => {
    const u = sm((tq - t0) / (t1 - t0));
    return { x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u) - arc * Math.sin(Math.PI * u) };
  };
  const T1 = tickAt(0), T2 = tickAt(1);
  const k = TICK_S;
  const tickPath = (p: Pt, u: number): Pt => {
    const a1 = clamp01(u / 0.4), a2 = clamp01((u - 0.4) / 0.6);
    return a2 > 0 ? { x: p.x + 7 * a2 * k, y: p.y + (2 - 9 * a2) * k } : { x: p.x + (-3 + 3 * a1) * k, y: p.y + (-2 + 4 * a1) * k };
  };
  const strikeAt = (p: Pt, q: Pt, u: number): Pt => ({ x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u) + 0.6 * Math.sin(u * 7) });
  // in from below, strike 1
  if (tq < S.s1) return go({ x: A1.x + 40, y: A1.y + 190 }, { x: A1.x, y: A1.y - 2 }, b.pen0, S.s1);
  if (tq < S.s1 + STRIKE_DUR) return strikeAt(A1, Z1, S.u1(tq));
  // rest, low below the flags
  const r0 = S.s1 + STRIKE_DUR;
  if (tq < r0 + 0.8) return go(Z1, REST, r0, r0 + 0.8, 6);
  const m0 = S.s2 - 0.75;
  if (tq < m0) return breathe(REST);
  // over to flag 2, strike 2
  if (tq < S.s2) return go(breathe(REST), { x: A2.x, y: A2.y - 2 }, m0, S.s2, 10);
  if (tq < S.s2 + STRIKE_DUR) return strikeAt(A2, Z2, S.u2(tq));
  // across to the sheet's margin: tick 1, hop, tick 2, drop away
  const e2 = S.s2 + STRIKE_DUR;
  const t1a = { x: T1.x - 3 * k, y: T1.y - 2 * k };
  if (tq < b.tick1) return go(Z2, t1a, e2, b.tick1, 18);
  if (tq < b.tick1 + 0.17) return tickPath(T1, (tq - b.tick1) / 0.17);
  if (tq < b.tick2) {
    const u = sm((tq - b.tick1 - 0.17) / (b.tick2 - b.tick1 - 0.17));
    const a = tickPath(T1, 1);
    return { x: lerp(a.x, T2.x - 3 * k, u), y: lerp(a.y, T2.y - 2 * k, u) - 6 * Math.sin(Math.PI * u) };
  }
  if (tq < b.tick2 + 0.17) return tickPath(T2, (tq - b.tick2) / 0.17);
  const u = sm((tq - b.tick2 - 0.17) / (b.pen1 - b.tick2 - 0.17));
  const a = tickPath(T2, 1);
  return { x: lerp(a.x, a.x + 60, u), y: lerp(a.y, a.y + 230, u) };
}

const cardAt = (p: Pt, rot: number) => ({ x: p.x, y: p.y, k: K, light: Q_LIGHT, pin: false, rot });

/** two paper wine-glass cut-outs, pinned, leaning toward each other (≈ 19 world px tall each) */
function toastGlasses(c: C, env: PaintEnv, x: number, y: number, glint: number) {
  const m = env.mood;
  const paper = mixLab(paperTone(env, 0.55), m.halo, 0.2);
  for (const [dx, rot] of [[-8.5, 0.2], [8.5, -0.2]] as const) {
    c.save();
    c.translate(x + dx, y);
    c.rotate(rot);
    const glass = (cc: C) => {
      cc.beginPath();
      cc.moveTo(-6.2, -11);
      cc.bezierCurveTo(-6.6, -3, -4, 0.5, -0.8, 1);
      cc.lineTo(-0.7, 8);
      cc.lineTo(-4.6, 9.6);
      cc.lineTo(4.6, 9.6);
      cc.lineTo(0.7, 8);
      cc.lineTo(0.8, 1);
      cc.bezierCurveTo(4, 0.5, 6.6, -3, 6.2, -11);
      cc.closePath();
    };
    // a contact shadow, the paper cut-out, a faint wine line, its pin
    c.fillStyle = withAlpha(m.fg, 0.4);
    c.save();
    c.translate(1.6, 2.2);
    glass(c);
    c.fill();
    c.restore();
    c.fillStyle = paper;
    glass(c);
    c.fill();
    c.strokeStyle = withAlpha(m.ink, 0.45);
    c.lineWidth = 0.7;
    c.stroke();
    c.fillStyle = withAlpha(mixLab(m.ink, '#5a1e22', 0.4), 0.55);
    c.beginPath();
    c.moveTo(-5.6, -5);
    c.bezierCurveTo(-5, -1, -3, 0.4, 0, 0.6);
    c.bezierCurveTo(3, 0.4, 5, -1, 5.6, -5);
    c.closePath();
    c.fill();
    brassPin(c, env, 0, -8.5, 0.6, 0, 1.8);
    if (glint > 0.01) {
      c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(-3, -7, 0, -3, -7, 9);
      gr.addColorStop(0, withAlpha(m.core, 0.9 * glint));
      gr.addColorStop(1, withAlpha(m.core, 0));
      c.fillStyle = gr;
      c.fillRect(-12, -16, 18, 18);
    }
    c.restore();
  }
}

/** the desk top between its far edge and the near lip: dark wood, the lamp's pool an ellipse on it (screen px) */
function desk(f: Frame, top: number, b: B, t: number, pool: Pt) {
  if (top >= 724) return;
  const c = f.c;
  const m = f.mood;
  c.save();
  c.fillStyle = mixLab(m.fg, m.ink, 0.25);
  c.fillRect(0, top, 1280, 730 - top);
  // the lamp's pool: an ellipse on the desk under the shade
  const land = pulse(t, b.land - 0.05, 0.12, 1.2);
  c.save();
  c.translate(pool.x, pool.y);
  c.scale(1, 0.16);
  const g = c.createRadialGradient(0, 0, 10, 0, 0, 330);
  g.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.25), 0.85));
  g.addColorStop(0.5, withAlpha(mixLab(m.set, m.halo, 0.45), 0.5));
  g.addColorStop(1, withAlpha(m.set, 0));
  c.fillStyle = g;
  c.fillRect(-340, -340, 680, 680);
  if (land > 0.01) {
    c.globalCompositeOperation = 'lighter';
    const h = c.createRadialGradient(-20, 0, 10, -20, 0, 220);
    h.addColorStop(0, withAlpha(m.halo, 0.16 * land));
    h.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = h;
    c.fillRect(-260, -260, 520, 520);
  }
  c.restore();
  // the far edge: a rim of lamp light, a soft contact shadow on the board above it
  const sh = c.createLinearGradient(0, top - 26, 0, top);
  sh.addColorStop(0, withAlpha(m.fg, 0));
  sh.addColorStop(1, withAlpha(m.fg, 0.5));
  c.fillStyle = sh;
  c.fillRect(0, top - 26, 1280, 26);
  const rim = c.createLinearGradient(0, 0, 1280, 0);
  rim.addColorStop(0, withAlpha(m.rim, 0.05));
  rim.addColorStop(0.75, withAlpha(m.rim, 0.55));
  rim.addColorStop(1, withAlpha(m.rim, 0.3));
  c.fillStyle = rim;
  c.fillRect(0, top - 1, 1280, 1.6);
  c.restore();
}

/**
 * the lamp's KEY as a multiply pass (screen px): an ellipse of full light on the subject (the Q card, the sheet,
 * the flags), falling to `floor` at its rim and beyond, so the board's margins and the far-left cards sink
 * to near-black: the silhouette value structure (bright paper in a dark room)
 */
function keyLight(f: Frame, o: { x: number; y: number; rx: number; ry: number; floor: number }) {
  const c = f.c;
  const lo = Math.round(255 * o.floor);
  const shade = mixLab(`rgb(${lo},${lo},${lo})`, mixLab(f.mood.fg, f.mood.halo, 0.35), 0.15);
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.translate(o.x, o.y);
  c.scale(o.rx / o.ry, 1);
  const g = c.createRadialGradient(0, 0, o.ry * 0.42, 0, 0, o.ry);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.45, mixLab('#ffffff', shade, 0.45));
  g.addColorStop(1, shade);
  c.fillStyle = g;
  c.fillRect(-2000, -1200, 4000, 2400);
  c.restore();
}

/**
 * THE PRACTICAL: the green-shaded banker's lamp on the near desk, its shade hanging into the top-right corner
 * (L5: blurred, near-black, a little parallax), the underside of the shade glowing, a soft cone of light falling
 * down-left onto the board. Baked once per mood; the glow flickers on its own seed.
 */
function bankersPractical(f: Frame, cam: Camera3, t: number) {
  const c = f.c;
  const m = f.mood;
  const dx = -(cam.x - 700) * 1.2, dy = -(cam.y - 200) * 1.2;
  const sc = 1 + (cam.z - 597) / 900;
  const art = f.cached(`ch07-s01/banker/${m.id}`, 860, 1500, (cc) => {
    // local: the shade's centre at (430, 150); a half-cylinder seen from slightly below, its lower lip lit
    const ink = mixLab(m.ink, '#13241a', 0.35);
    cc.fillStyle = ink;
    cc.beginPath();
    cc.moveTo(60, 236);
    cc.bezierCurveTo(70, 90, 210, 30, 430, 26);
    cc.bezierCurveTo(650, 30, 790, 90, 800, 236);
    cc.quadraticCurveTo(430, 214, 60, 236);
    cc.closePath();
    cc.fill();
    // rolled ends and the glass ribs (cut lines), a brass finial
    cc.strokeStyle = withAlpha(mixLab(m.rim, '#4f7a5c', 0.35), 0.4);
    cc.lineWidth = 3;
    cc.beginPath();
    cc.moveTo(110, 150);
    cc.bezierCurveTo(230, 92, 630, 92, 750, 150);
    cc.stroke();
    cc.fillStyle = ink;
    cc.fillRect(424, 0, 12, 30);
    // the underside: the lit lip of the shade (the bulb's glow on the inner glass)
    const g = cc.createLinearGradient(0, 212, 0, 252);
    g.addColorStop(0, withAlpha(m.core, 0));
    g.addColorStop(0.5, withAlpha(m.core, 0.95));
    g.addColorStop(1, withAlpha(m.halo, 0.2));
    cc.fillStyle = g;
    cc.beginPath();
    cc.moveTo(70, 236);
    cc.quadraticCurveTo(430, 212, 790, 236);
    cc.quadraticCurveTo(430, 262, 70, 236);
    cc.closePath();
    cc.fill();
    // the harp's yoke below the shade, and the stem dropping out of frame
    cc.fillStyle = ink;
    cc.fillRect(421, 246, 18, 1254);
    cc.beginPath();
    cc.moveTo(300, 236);
    cc.lineTo(430, 300);
    cc.lineTo(560, 236);
    cc.lineTo(548, 236);
    cc.lineTo(430, 288);
    cc.lineTo(312, 236);
    cc.closePath();
    cc.fill();
  }, { blur: 5 });
  const ox = 1000 + dx, oy = -42 + dy;
  c.save();
  // the cone of light falling down-left from the lip onto the board (additive, very soft)
  const k = 0.9 + 0.1 * Math.sin(t * 7.3) * Math.sin(t * 2.9 + 1);
  c.globalCompositeOperation = 'lighter';
  const lx = ox + 430 * sc * 0.55, ly = oy + 238 * sc * 0.55;
  const cone = c.createRadialGradient(lx, ly, 10, lx - 120, ly + 160, 620);
  cone.addColorStop(0, withAlpha(m.halo, 0.2 * k));
  cone.addColorStop(0.35, withAlpha(m.halo, 0.07 * k));
  cone.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = cone;
  c.beginPath();
  c.moveTo(lx - 230, ly);
  c.lineTo(lx + 240, ly);
  c.lineTo(lx + 60, 760);
  c.lineTo(lx - 900, 760);
  c.closePath();
  c.fill();
  // the bulb's halo under the shade
  const h = c.createRadialGradient(lx, ly + 6, 4, lx, ly + 6, 150);
  h.addColorStop(0, withAlpha(m.core, 0.55 * k));
  h.addColorStop(0.4, withAlpha(m.halo, 0.18 * k));
  h.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = h;
  c.fillRect(lx - 160, ly - 150, 320, 320);
  c.globalCompositeOperation = 'source-over';
  c.translate(ox, oy);
  c.scale(0.55 * sc, 0.55 * sc);
  art(c, 0, 0);
  c.restore();
}

/** released: the card slips, turns once in the air (a flip about its long axis) and lands face up in the pool */
function fallingCard(f: Frame, t: number, b: B, m4: { x: number; y: number; k: number }) {
  if (t < b.release) return;
  const c = f.c;
  const env = { mood: f.mood, fill: () => f.mood.set, pxScale: f.pxScale } as unknown as PaintEnv;
  const D = b.land - b.release;
  const dt = Math.min(D, Math.floor((t - b.release) * 24) / 24); // a real paper fall: on ones
  const u = dt / D;
  const y0 = DROP.y + 9 * K + CARD.h / 2 - 2;
  // x drifts toward the lamp with a sway; y accelerates then brakes as the air catches it
  const x = lerp(DROP.x, LAND.x, 1 - (1 - u) * (1 - u)) + 8 * Math.abs(Math.sin(u * Math.PI * 1.6)) * (1 - u);
  const y = lerp(y0, LAND.y, u * u * (1.6 - 0.6 * u));
  const flip = Math.cos(Math.min(1, u / 0.82) * Math.PI * 2); // one full turn, face up at the end
  const lie = sm((u - 0.78) / 0.22); // flattening onto the desk (foreshortened)
  const sx = m4.x + x * m4.k, sy = m4.y + y * m4.k;
  c.save();
  c.translate(sx, sy);
  c.scale(m4.k, m4.k);
  c.rotate((0.06 + 0.3 * Math.sin(u * 4.1)) * (1 - lie) + 0.08 * lie);
  const fy = Math.max(0.06, Math.abs(flip)) * (1 - 0.58 * lie);
  if (lie > 0.02) {
    // its shadow on the desk, closing in as it lands
    c.fillStyle = withAlpha(f.mood.fg, 0.4 * lie);
    c.fillRect(-CARD.w / 2 + 3 + (1 - lie) * 10, -CARD.h * fy / 2 + 3 + (1 - lie) * 14, CARD.w, CARD.h * fy);
  }
  c.scale(1, fy);
  if (flip >= 0) drawCard(c, { id: 'Q-Q2', w: CARD.w, h: CARD.h, icon: 'question', text: 'WHO PAID FOR DINNER?' }, { x: 0, y: 0, k: K, light: Q_LIGHT + 0.25 * lie, pin: false }, env);
  else {
    c.fillStyle = mixLab(f.mood.halo, f.mood.set, 0.45);
    c.fillRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h);
  }
  if (Math.abs(flip) < 0.35) {
    c.fillStyle = withAlpha(f.mood.fg, 0.45 * (1 - Math.abs(flip) / 0.35));
    c.fillRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h);
  }
  c.restore();
}
