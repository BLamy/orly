/**
 * ch06-s08 — the detective's study, night (STUDY LOCK: candleAmber). Silent until the card: the narrator voices the
 * question once (L0616 'Put that in the file: why would anyone choose the fog?', from the end of the lead-in) and the
 * card is pinned on 'why' (ch08-s13b answers it). Three set-ups, each a slow move, cut on the action:
 *
 *   A  BOARD insert on C2-d (0 → CUT_B)      'clue' 0.2: the hands pin this chapter's clue card into C2-d at the
 *                                            foot of column C2 (a pierced tin stencil, 1989, with a small straight
 *                                            pipe); a thread of light runs up to the 1986 bead card in C2-b and,
 *                                            faintly, across to the 1958 knob card in C1-b
 *   B  FILE insert, top-down on the desk     the hands have just set two small paper pieces side by side in the
 *      (CUT_B → CUT_C)                       lamp's pool: shot 3's clean bowl (a ball resting calmly at its single
 *                                            bottom) and the misty hills in miniature (fog curling, the tiny
 *                                            traveller with his lantern still in the hollow). 'bowl' 1.4: the bowl
 *                                            catches the light — a glint runs round its one clean curve and the
 *                                            ball warms: one bowl, no fog, no traps
 *      'fog' 3.6 (as 'Put that in the file' ends): the hills' fog curls out over the bowl's right rim
 *   C  BOARD on the oxblood thread           the hands carry in a new card along the top edge; 'card' ('why'): it is
 *      (CUT_C → end)                         pinned at Q3, next to WHO PAID FOR DINNER?: WHY WOULD ANYONE CHOOSE
 *                                            THE FOG? It sways and settles under a push in that makes the card
 *                                            the subject (≥ 22 px cap) while the question is asked; the hills' fog
 *                                            creeps up into the frame below it; 'lantern' 5.6: a wisp drifts
 *                                            in front of the card and, behind it, far away, the traveller's lantern
 *                                            still glows. Hold on the suspension to the cut.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, ShotScene } from '../../../film';
import {
  LAYERS, MISTY_LR, defineShot, descentPath, fbm, glow, hash1, lossDf, lossF, mistyHills, mixLab, softSprite, toLayer,
  toScreen, withAlpha,
} from '../../../film';
import { hands } from '../cast';
import { STUDY, slotWorld, studyCase, studyNear, studyRoom } from '../sets/study';
import { BOARD, SLOTS, boardStateAt, type BoardState, type SlotId } from '../sets/studyState';
import { DEFAULT_POOL, drawCard, oxblood, poolAt, slotPin, type Pool } from '../sets/caseBoard';
import { camKeys, pinSway } from '../sets/ch03-s06-kit';
import { clamp01, compositeSub, lerp, sm, subFrame, tq12, win } from '../sets/ch02-s05b-util';
import { BET, betSheet, wineGlasses } from '../sets/ch07-s01-betSheet';
import { FONT } from '../../../film/silhouette/type';

const ID = 'ch06-s08';
type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

// ------------------------------------------------------------------ the board (L4 world)
const BK = STUDY.board.k;
/** the lamp pool exactly as studyCase hands it to caseBoard (board units) */
const POOL_B: Pool = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };
const END = boardStateAt(ID, 'end');
const Q3_TEXT = END.questions.find((q) => q.slot === 'Q3')?.text ?? 'WHY WOULD ANYONE CHOOSE THE FOG?';
/** the board as this shot shows it: everything up to the end, but Q3 is ours to hang */
const STATE: BoardState = { ...END, questions: END.questions.filter((q) => q.slot !== 'Q3') };
/** set-up A animates C2-d and redraws its neighbours so the new threads pass UNDER the cards */
const A_HIDE: SlotId[] = ['C2-d', 'C2-b', 'C2-row', 'C1-b'];
const A_REDRAW: SlotId[] = ['C1-b', 'C2-row', 'C2-b'];
const sagAt = (bx: number) => Math.sin(((bx - 40) / 920) * Math.PI) * 10;
/** the Q3 clip point on the oxblood thread (L4 world) */
const Q3X = 620;
const Q3_PIN: P = { x: STUDY.board.x + Q3X * BK, y: STUDY.board.y + (BOARD.threadY + sagAt(Q3X)) * BK };
const Q_W = 168, Q_H = 44, Q_CLIP = 10;
/** the Q3 card's centre (L4 world) */
const Q3C: P = { x: Q3_PIN.x, y: Q3_PIN.y + (Q_CLIP + Q_H / 2) * BK };
/** the 1995 bet sheet, pinned below Q2 since ch06-s05 (ch07-s01 opens on it): its lamp light and its glasses */
const SHEET_LIGHT = poolAt(POOL_B, 505, 168);
const GLASSES = { x: BET.x + BET.w - 12, y: BET.y - 6 };
/** in-shot cross-dissolves between the set-ups (s) */
const DIS = 0.3;

// ------------------------------------------------------------------ the desk (FILE camera: a flat top-down plate)
const BOWL = { x: 410, y: 404, w: 350, h: 214, rot: -0.035 };
const HILLS = { x: 822, y: 386, w: 336, h: 214, rot: 0.045 };
/** the parabola's rims sit this far below the bowl card's top edge, its bottom this far above the base */
const BOWL_RIM = 0.08, BOWL_BOT = 0.8;
/** the miniature's picture inside its ink frame */
const FRAME_IN = 12;
/** the traveller is stuck in the hollow: the timid descent, long since settled */
const T_STEP = 30;

// ------------------------------------------------------------------ the near fog plane (just in front of the board)
const FOG_NEAR: LayerSpec = { id: 'fogNear', z: 880, haze: 0, blur: 1.5 };

interface B {
  D: number;
  clue: number;
  bowl: number;
  card: number;
  fog: number;
  lantern: number;
  cutB: number;
  cutC: number;
  pin0: number;
  pinDur: number;
  /** the thumb holds the pin home until here, then lets go (the bead thread lights on the release) */
  hold1: number;
  release: number;
  q0: number;
  qDur: number;
}
interface Scene extends ShotScene {
  b: B;
  camA: (t: number) => Camera3;
  camC: (t: number) => Camera3;
  CAMS: Camera3[];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const clue = T.beat('clue');
    const bowl = T.beat('bowl');
    const card = T.beat('card');
    const fog = T.beat('fog');
    const lantern = T.beat('lantern');
    const pinDur = 1.0;
    const qDur = 1.15;
    const b: B = {
      D, clue, bowl, card, fog, lantern, pinDur, qDur,
      // the pin lands (u = 0.45) on 'clue'; the hand is already reaching in on the first frame
      pin0: clue - 0.45 * pinDur,
      hold1: 0.7,
      release: 0.8,
      cutB: Math.min(bowl - 0.25, clue + 0.95),
      // the question card is placed (u = 0.45) on 'card'; we cut to it mid-reach
      q0: card - 0.45 * qDur,
      cutC: card - 0.27,
    };
    // A: the foot of column C2, framed wide enough for the threads up to C2-b and across to C1-b; a slow push
    const camA = camKeys([
      [0, 470, 470, 292],
      [b.cutB, 482, 472, 336],
    ]);
    // C: the top edge of the board, Q2 and Q3 on the thread; a slow push in to the new card
    // the Q3 card ends centred at the upper third of the frame, the bet sheet and Q2 below and beside it
    // (the card reads at ≥ 22 px cap from ~0.5 s after 'why' to the cut: k ≥ 3 at L4)
    // framed on the pair of question cards on the thread, WHO PAID FOR DINNER? and the new one beside it, whole
    // review round 1: the final push re-framed ≈ 60 px right and 30 px up (screen) so the two question cards sit
    // with clean margins and the cut-off HELSINKI card leaves the frame
    const camC = camKeys([
      [b.cutC - DIS / 2, Q3C.x - 42, Q3C.y + 27, 600],
      [card + 0.55, Q3C.x - 63, Q3C.y + 19, 672],
      [D, Q3C.x - 67, Q3C.y + 19, 690],
    ]);
    const CAMS: Camera3[] = [camA(0), camA(b.cutB), camC(b.cutC - DIS / 2), camC((b.cutC + D) / 2), camC(D)];
    tl.hold(0, D);
    return { tl, b, camA, camC, CAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    // soft cuts: a 0.3 s cross-dissolve between the set-ups so the wordless coda breathes
    const dA = (t - (b.cutB - DIS / 2)) / DIS, dB = (t - (b.cutC - DIS / 2)) / DIS;
    if (dA < 0) paintA(f, sc, t);
    else if (dA < 1) {
      const cv = subFrame(f, `${ID}/A`, 'candleAmber', (g) => paintA(g, sc, t));
      paintB(f, sc, t);
      compositeSub(f, cv, 1 - sm(dA));
    } else if (dB < 0) paintB(f, sc, t);
    else if (dB < 1) {
      const cv = subFrame(f, `${ID}/B`, 'candleAmber', (g) => paintB(g, sc, t));
      paintC(f, sc, t);
      compositeSub(f, cv, 1 - sm(dB));
    } else paintC(f, sc, t);
  },
});

/**
 * the study's near plane for this camera: the shared L6 occluders (z 400) only for cameras well short of them; the
 * close BOARD inserts here (z 290–700) sit at or past that plane, where they would blow up to fill the frame
 */
function near(f: Frame, sc: Scene, cam: Camera3) {
  if (cam.z < 250) studyNear(f, { key: `${ID}/wide`, cams: sc.CAMS.filter((q) => q.z < 250), file: true });
  else if (cam.z < 600) studyNear(f, { key: `${ID}/close`, cams: sc.CAMS.filter((q) => q.z < 600), file: true, occluders: false });
}

// =================================================================================================== threads
/** a point along a pin-to-pin thread of light (the board's own quadratic, sagging under its weight) */
function threadPts(p: P, q: P, u: number, sag = 0.08): P[] {
  const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 + Math.hypot(q.x - p.x, q.y - p.y) * sag;
  const n = 32;
  const out: P[] = [];
  const m = Math.floor(n * clamp01(u));
  for (let i = 0; i <= m; i++) {
    const s = i / n;
    out.push({ x: (1 - s) * (1 - s) * p.x + 2 * (1 - s) * s * mx + s * s * q.x, y: (1 - s) * (1 - s) * p.y + 2 * (1 - s) * s * my + s * s * q.y });
  }
  if (u < 1 && m < n) {
    const s = clamp01(u);
    out.push({ x: (1 - s) * (1 - s) * p.x + 2 * (1 - s) * s * mx + s * s * q.x, y: (1 - s) * (1 - s) * p.y + 2 * (1 - s) * s * my + s * s * q.y });
  }
  return out;
}
/** a thread of light in the board's style (three strokes, additive); a bright head while it is still running */
function thread(c: C, env: PaintEnv, p: P, q: P, u: number, a: number, head = false) {
  if (u <= 0 || a <= 0) return;
  const pts = threadPts(p, q, u);
  if (pts.length < 2) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const [lw, al] of [[6, 0.07], [2.4, 0.22], [1, 0.6]] as const) {
    c.strokeStyle = withAlpha(env.mood.core, al * a);
    c.lineWidth = lw * BK;
    c.beginPath();
    pts.forEach((pt, i) => (i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y)));
    c.stroke();
  }
  if (u < 1) {
    // the warm glint running up the thread (a faint thread's head is boosted so its run is seen)
    const h = pts[pts.length - 1];
    const ha = head ? Math.min(1, a * 2.4) : a;
    glow(c, h.x, h.y, 34, env.mood.halo, 0.5 * ha);
    glow(c, h.x, h.y, 12, env.mood.core, Math.min(1, 1.2 * ha));
  }
  c.restore();
}

// =================================================================================================== A: the clue card
function paintA(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.camA(t);
  f.camera(cam);
  studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'duskRose', kind: 'city' } });
  const tq = tq12(t);
  const placedAt = b.pin0 + 0.45 * b.pinDur;
  // review round 1: the thumb stays on the pin until hold1 (a 0.5 s press the eye can register after the cut), then
  // lets go and withdraws; the act's own phases: 0.45 = pressed home, 0.9 = gone
  const u = tq < placedAt ? (tq - b.pin0) / b.pinDur : tq < b.hold1 ? 0.45 + 0.03 * sm((tq - placedAt) / (b.hold1 - placedAt)) : 0.48 + 0.42 * sm((tq - b.hold1) / 0.42);
  const entry = { R: toLayer(LAYERS.L4, cam, 1420, 980), L: toLayer(LAYERS.L4, cam, 1150, 1060) };
  const def = SLOTS['C2-d'];
  const pinPt = slotWorld('C2-d', 'pin');
  const ctr = slotWorld('C2-d', 'centre');
  // the new ties: up to the bead card (full), across to the knob card (faint)
  // up to the 1986 bead card (the glint arrives ≈ 0.5 s in), then a fainter one across to the 1958 knob (≈ 0.8 s)
  // the bead thread lights on the release (≈ 0.8) and reaches the 1986 card by ≈ 1.1; the knob thread follows at
  // 30% of its strength, 0.1 s behind, over 0.4 s
  const upU = sm((t - b.release) / 0.3);
  const acrossU = sm((t - (b.release + 0.1)) / 0.4);
  const arrive = win(t, b.release + 0.26, b.release + 0.34) * (1 - win(t, b.release + 0.5, b.cutB + 0.3));
  studyCase(f, {
    shot: ID,
    when: 'end',
    key: ID,
    board: { state: STATE, hide: A_HIDE },
    shelf: false,
    extra: (c, env) => {
      pinnedSheet(c, env);
      // the old threads of the hidden cards (caseBoard skips them), then the new ones, all under the cards
      for (const [a2, q2] of END.threads) {
        if (a2 === 'C2-d' || q2 === 'C2-d') continue;
        if (!A_HIDE.includes(a2) && !A_HIDE.includes(q2)) continue;
        thread(c, env, slotPin(STUDY.board, a2), slotPin(STUDY.board, q2), 1, 0.55);
      }
      if (u >= 0.45) {
        const beadA = 0.8 + 0.2 * arrive;
        thread(c, env, pinPt, slotPin(STUDY.board, 'C2-b'), upU, beadA);
        // 30% of the bead thread's strength in light, but drawn with the bead thread's stroke weights doubled in alpha
        // so a faint tie still reads on pale card stock
        thread(c, env, pinPt, slotPin(STUDY.board, 'C1-b'), acrossU, 0.42 * beadA, true);
      }
      for (const id of A_REDRAW) {
        const s = SLOTS[id];
        const p = slotWorld(id, 'centre');
        drawCard(c, s, { x: p.x, y: p.y, k: BK, light: poolAt(POOL_B, s.x, s.y) + (id === 'C2-b' ? 0.25 * arrive : 0) }, env);
      }
      if (arrive > 0.01) {
        // the bead card answers as the thread reaches its pin
        const pb = slotPin(STUDY.board, 'C2-b');
        glow(c, pb.x, pb.y, 30, env.mood.core, 0.6 * arrive);
      }
      // the clue card: hung on its pin with a little settle swing
      if (u >= 0.45) {
        c.save();
        c.translate(pinPt.x, pinPt.y);
        c.rotate(pinSway(tq - placedAt));
        c.translate(-pinPt.x, -pinPt.y);
        clueCard(c, env, ctr.x, ctr.y, poolAt(POOL_B, def.x, def.y), true);
        c.restore();
      }
      if (u > 0 && u < 0.9) {
        const hp = hands.act('pin', u, pinPt, { held: 'card', scale: 0.74, entry });
        hands.draw(c, hp, env, { heldDraw: (cc, at, _h, e) => clueCard(cc, e, at.x, at.y + (def.h / 2 - 7) * BK, 0.85, false) });
      }
    },
  });
  // the pin's glint as the thumb presses it home
  const g = win(t, placedAt - 0.04, placedAt + 0.06) * Math.exp(-Math.max(0, t - placedAt) * 3);
  if (g > 0.02) f.practical({ x: pinPt.x, y: pinPt.y, kind: 'led', seed: 81, intensity: 0.35 * g, radius: 22, layer: 'L4' });
  deskEdge(f, cam, sc.camA(b.cutB), `${ID}/edgeA`);
  near(f, sc, cam);
  const pc = toScreen(LAYERS.L4, cam, STUDY.pool.cx, STUDY.pool.cy);
  lampFalloff(f, pc.x + 120, pc.y - 40, 0.95);
}

/** the near desk edge (a custom plane well in front of the board, out of focus) along the bottom of a board close-up:
 *  placed so that at the reference camera its lit top edge sits at y ≈ 652; it slides against the board in the push */
const EDGE: LayerSpec = { id: 'deskEdge', z: 860, haze: 0, blur: 0 };
function deskEdge(f: Frame, cam: Camera3, ref: Camera3, key: string) {
  void cam;
  void key;
  const r0 = toScreen(EDGE, ref, 0, 0);
  const P0 = toLayer(EDGE, ref, 0, 652);
  const kr = r0.k;
  f.layer(EDGE, (c, env) => {
    c.save();
    c.translate(P0.x, P0.y);
    c.scale(1 / kr, 1 / kr);
    // the slab runs far past the frame on every camera of the shot (it is one flat value, so no bitmap or blur pass:
    // only its top edge is softened, by a gradient, as the out-of-focus edge)
    const g = c.createLinearGradient(0, -10, 0, 14);
    g.addColorStop(0, withAlpha(env.fill('fg'), 0));
    g.addColorStop(0.45, withAlpha(env.fill('fg'), 0.9));
    g.addColorStop(1, env.fill('fg'));
    c.fillStyle = g;
    c.fillRect(-4000, -10, 9000, 24);
    c.fillStyle = env.fill('fg');
    c.fillRect(-4000, 14, 9000, 3000);
    // the lamp catching the edge: a soft warm line just under the top
    const r = c.createLinearGradient(0, -2, 0, 8);
    r.addColorStop(0, withAlpha(env.mood.rim, 0));
    r.addColorStop(0.5, withAlpha(env.mood.rim, 0.45));
    r.addColorStop(1, withAlpha(env.mood.rim, 0));
    c.fillStyle = r;
    c.fillRect(-4000, -2, 9000, 10);
    c.restore();
  });
}

/** the lamp's pool on the board: the corners fall away into ink (screen space, after every layer) */
function lampFalloff(f: Frame, x: number, y: number, a: number) {
  const c = f.c;
  const m = f.mood;
  const g = c.createRadialGradient(x, y, 160, x, y, 980);
  g.addColorStop(0, withAlpha(m.ink, 0));
  g.addColorStop(0.45, withAlpha(m.ink, 0.25 * a));
  g.addColorStop(1, withAlpha(m.ink, a));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
}

/** the bet sheet and its paper wine glasses where ch06-s05 pinned them (below Q2); ch07-s01 opens on them */
function pinnedSheet(c: C, env: PaintEnv) {
  betSheet(c, env, { light: SHEET_LIGHT });
  wineGlasses(c, env, { x: GLASSES.x, y: GLASSES.y, s: 0.95, light: SHEET_LIGHT });
}

/** the clue card C2-d: a pierced tin stencil (a 3×3 kernel of holes, rhyming with the stencil lantern) and a small
 *  straight pipe with its self-loop (the protected pipe of ch06-s06); typed 1989 */
function clueCard(c: C, env: PaintEnv, x: number, y: number, light: number, pin: boolean) {
  const def = SLOTS['C2-d'];
  const m = env.mood;
  const k = BK;
  // the card itself (blank face), then the icon and the year in the card's own frame
  drawCard(c, { id: def.id, w: def.w, h: def.h, icon: 'question', text: '' }, { x, y, k, light, pin }, env);
  const rot = hash1(def.id.length * 31 + def.id.charCodeAt(def.id.length - 1), 17) * 0.025;
  const paper = mixLab(m.halo, m.set, 0.35);
  const ink = mixLab(m.ink, paper, 0.08);
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(k, k);
  // the tin plate, pierced
  c.fillStyle = ink;
  c.beginPath();
  c.roundRect(-44, -33, 40, 40, 3);
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.4 * light);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-43, -32.4);
  c.lineTo(-5, -32.4);
  c.stroke();
  const holes = [2.6, 1.4, 2.6, 1.4, 3.4, 1.4, 2.6, 1.4, 2.6];
  c.fillStyle = mixLab(paper, m.halo, 0.4);
  holes.forEach((r, i) => {
    c.beginPath();
    c.arc(-35 + (i % 3) * 11, -24 + Math.floor(i / 3) * 11, r, 0, Math.PI * 2);
    c.fill();
  });
  // the pipe (review round 1): a plain straight tube — two long ink edges and rounded ends — with a tiny closed
  // self-loop standing on its top, mid-length (the × 1 loop of ch06-s06), no brackets, no arrowheads
  const py0 = -10, ph = 8;
  c.fillStyle = mixLab(paper, m.rim, 0.15);
  c.strokeStyle = ink;
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(3, py0, 42, ph, ph / 2);
  c.fill();
  c.stroke();
  c.lineWidth = 1.5;
  c.beginPath();
  c.ellipse(24, py0 - 4.6, 3.6, 4.4, 0, Math.PI * 0.62, Math.PI * 2.38);
  c.stroke();
  c.font = `400 ${11}px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('1989', 0, def.h / 2 - 11);
  c.restore();
}

// =================================================================================================== B: the desk
function paintB(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const u = clamp01((t - b.cutB) / (b.cutC - b.cutB));
  // the FILE camera: top-down, a slow descent toward the two pieces (the lamp's shade passes overhead in L5)
  f.camera({ x: 640 + 14 * sm(u), y: 372, z: 18 + 34 * sm(u), lens: 1 });
  f.backlight({ intensity: 0.12 });
  const tq = tq12(t);
  f.layer('L4', (c, env) => {
    desk(f, c, env);
    bowlPiece(c, env, t, b);
    hillsPiece(f, c, env, t, b, 1);
    // 'fog' (as 'Put that in the file' ends): the hills' fog spills over the gap and curls across the bowl's right rim
    const fu = win(t, b.fog - 1.0, b.fog + 0.1);
    if (fu > 0.01) {
      const rim = toBowl(bowlLocal(0.92));
      c.save();
      c.globalAlpha = fu;
      curls(c, env, t, { x: rim.x + 70, y: rim.y + 40 }, 1.35, 0.7);
      curls(c, env, t + 2.7, { x: rim.x + 10, y: rim.y + 70 }, 1.1, 0.5);
      c.restore();
    }
    // the hand that set the hills down lifts away toward the lamp side
    const len = 118 * 1.55;
    const E: P = { x: 1500, y: 880 };
    const rest: P = { x: HILLS.x + HILLS.w / 2 - 26, y: HILLS.y + HILLS.h / 2 - 30 };
    const w = sm((tq - (b.cutB + 0.12)) / 0.62);
    if (w < 1) {
      const at: P = { x: lerp(rest.x, lerp(E.x, rest.x, 0.1), w), y: lerp(rest.y, lerp(E.y, rest.y, 0.1), w) };
      hands.draw(c, { right: hands.reach(E, at, w < 0.12 ? 'flat' : 'rest', len, { bend: 0.1 }), scale: 1.55 }, env);
    }
  });
  // the ball catches the lamp
  const catchK = win(t, b.bowl - 0.1, b.bowl + 0.25) * (1 - 0.55 * win(t, b.bowl + 0.5, b.bowl + 1.1));
  const ball = ballAt();
  f.practical({ x: ball.x, y: ball.y, kind: 'lamp', seed: 83, intensity: 0.18 + 0.32 * catchK, radius: 34 + 26 * catchK, layer: 'L4' });
  // dust turning in the lamp's cone between us and the desk (nearest plane, soft)
  f.layer('L6', (c, env) => {
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 22; i++) {
      const x = -60 + 1400 * (0.5 + 0.5 * hash1(i * 3 + 1, 851)) + 30 * Math.sin(t * 0.23 + i);
      const y = -40 + 800 * (0.5 + 0.5 * hash1(i * 3 + 2, 852)) + 20 * Math.cos(t * 0.19 + i * 1.3);
      const r = 4 + 9 * (0.5 + 0.5 * hash1(i * 3 + 3, 853));
      const a = 0.05 + 0.07 * (0.5 + 0.5 * hash1(i, 854)) * (0.6 + 0.4 * Math.sin(t * 0.8 + i * 2.1));
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, withAlpha(env.mood.halo, a));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    c.restore();
  });
  // the green shade of the banker's lamp overhead (near, out of focus): the source of the pool
  f.layer('L5', (c, env) => {
    const m = env.mood;
    const shade = mixLab(env.fill('fg'), '#2c4a36', 0.22);
    c.fillStyle = shade;
    c.beginPath();
    c.ellipse(1330, -40, 330, 210, -0.32, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(m.rim, 0.35);
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(1330, -40, 330, 210, -0.32, Math.PI * 0.55, Math.PI * 1.02);
    c.stroke();
  });
}

/** the desk top under the lamp, a shut manila file at the right edge (baked) */
function desk(f: Frame, c: C, env: PaintEnv) {
  const m = env.mood;
  f.cached(`${ID}/desk/${m.id}`, 1480, 920, (cc) => {
    cc.translate(100, 100);
    cc.fillStyle = mixLab(m.set, m.fg, 0.35);
    cc.fillRect(-100, -100, 1480, 920);
    const g = cc.createRadialGradient(610, 380, 40, 610, 380, 760);
    g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.5), 0.95));
    g.addColorStop(0.45, withAlpha(mixLab(m.set, m.halo, 0.22), 0.6));
    g.addColorStop(1, withAlpha(m.set, 0));
    cc.fillStyle = g;
    cc.fillRect(-100, -100, 1480, 920);
    // faint wood grain, broken (not a ruled sheet)
    cc.strokeStyle = withAlpha(m.fg, 0.1);
    cc.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const yy = -60 + i * 22 + hash1(i, 13) * 9;
      const x0 = -100 + hash1(i, 16) * 500;
      cc.beginPath();
      cc.moveTo(x0, yy);
      cc.bezierCurveTo(x0 + 250, yy + hash1(i, 14) * 10, x0 + 600, yy - hash1(i, 15) * 10, x0 + 700 + hash1(i, 17) * 500, yy + 3);
      cc.stroke();
    }
    // the leather blotter in the pool, its four darker corner pockets
    const bx = 150, by = 214, bw = 930, bh = 420;
    cc.fillStyle = withAlpha(m.fg, 0.4);
    cc.fillRect(bx + 6, by + 8, bw, bh);
    cc.fillStyle = mixLab(mixLab(m.set, m.fg, 0.5), '#3d4a34', 0.18);
    cc.fillRect(bx, by, bw, bh);
    const sheen = cc.createRadialGradient(560, 360, 30, 560, 360, 560);
    sheen.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.4), 0.5));
    sheen.addColorStop(1, withAlpha(m.setHaze, 0));
    cc.fillStyle = sheen;
    cc.fillRect(bx, by, bw, bh);
    cc.fillStyle = mixLab(m.fg, m.set, 0.25);
    for (const [cx, cy, sx, sy] of [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]] as const) {
      cc.beginPath();
      cc.moveTo(cx, cy);
      cc.lineTo(cx + 74 * sx, cy);
      cc.lineTo(cx, cy + 74 * sy);
      cc.closePath();
      cc.fill();
    }
    cc.strokeStyle = withAlpha(m.rim, 0.2);
    cc.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    // the desk's front edge along the bottom of frame, rim-lit
    cc.fillStyle = env.fill('ink');
    cc.fillRect(-100, 690, 1480, 140);
    cc.fillStyle = withAlpha(m.rim, 0.35);
    cc.fillRect(-100, 689, 1480, 1.5);
    // the shut file at the right edge, its tab toward us
    const manila = mixLab(m.halo, '#b08a52', 0.35);
    cc.save();
    cc.translate(1220, 470);
    cc.rotate(0.06);
    cc.fillStyle = withAlpha(m.fg, 0.35);
    cc.fillRect(-150 + 8, -170 + 10, 420, 300);
    cc.fillStyle = mixLab(manila, m.set, 0.45);
    cc.fillRect(-150, -170, 420, 300);
    cc.fillRect(-120, -192, 110, 24);
    cc.fillStyle = withAlpha(m.rim, 0.25);
    cc.fillRect(-150, -170, 420, 1.2);
    cc.restore();
    // the edges of the desk fall into the dark
    const v = cc.createRadialGradient(600, 330, 200, 600, 360, 860);
    v.addColorStop(0, withAlpha(m.fg, 0));
    v.addColorStop(0.5, withAlpha(m.fg, 0.4));
    v.addColorStop(1, withAlpha(m.ink, 0.92));
    cc.fillStyle = v;
    cc.fillRect(-100, -100, 1480, 920);
  })(c, -100, -100);
}

// ------------------------------------------------------------------ the bowl piece (flat, top-down)
const bowlLocal = (x: number) => {
  // x in −1..1 across the card; the curve f(x) = x², rims at ±1
  const w = BOWL.w * 0.84;
  const top = -BOWL.h / 2 + BOWL.h * BOWL_RIM;
  const bot = -BOWL.h / 2 + BOWL.h * BOWL_BOT;
  return { x: x * (w / 2), y: bot - (bot - top) * x * x };
};
function toBowl(p: P): P {
  const cs = Math.cos(BOWL.rot), sn = Math.sin(BOWL.rot);
  return { x: BOWL.x + p.x * cs - p.y * sn, y: BOWL.y + p.x * sn + p.y * cs };
}
function ballAt(): P {
  const p = bowlLocal(0);
  return toBowl({ x: p.x, y: p.y - 10 });
}
function bowlPiece(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const w = BOWL.w, h = BOWL.h;
  c.save();
  c.translate(BOWL.x, BOWL.y);
  c.rotate(BOWL.rot);
  // the paper, lying flat: a soft contact shadow, then the cut piece (the ground under the curve)
  const outline = new Path2D();
  outline.moveTo(-w / 2, h / 2);
  outline.lineTo(-w / 2, -h / 2 + h * 0.26);
  outline.bezierCurveTo(-w / 2 + 6, -h / 2 + 10, -w * 0.46, -h / 2 + h * BOWL_RIM - 4, bowlLocal(-1).x, bowlLocal(-1).y);
  for (let i = -40; i <= 40; i++) {
    const p = bowlLocal(i / 40);
    outline.lineTo(p.x, p.y);
  }
  outline.bezierCurveTo(w * 0.46, -h / 2 + h * BOWL_RIM - 4, w / 2 - 6, -h / 2 + 10, w / 2, -h / 2 + h * 0.26);
  outline.lineTo(w / 2, h / 2);
  outline.closePath();
  // a soft cast shadow (the paper lies on the blotter; the lamp is above and to the right)
  c.save();
  c.translate(-9, 13);
  c.filter = 'blur(6px)';
  c.fillStyle = withAlpha(m.ink, 0.55);
  c.fill(outline);
  c.restore();
  c.save();
  c.translate(-2, 3);
  c.fillStyle = withAlpha(m.ink, 0.45);
  c.fill(outline);
  c.restore();
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, mixLab(m.setHaze, m.halo, 0.55));
  g.addColorStop(1, mixLab(m.setHaze, m.halo, 0.3));
  c.fillStyle = g;
  c.fill(outline);
  // layered-paper contour cut-lines, and the curve's lit edge
  c.strokeStyle = withAlpha(m.fg, 0.22);
  c.lineWidth = 1.1;
  for (let k = 1; k <= 3; k++) {
    c.beginPath();
    for (let i = -40; i <= 40; i++) {
      const p = bowlLocal(i / 40);
      if (i === -40) c.moveTo(p.x, p.y + k * 17);
      else c.lineTo(p.x, p.y + k * 17);
    }
    c.stroke();
  }
  c.strokeStyle = withAlpha(m.rim, 0.65);
  c.lineWidth = 2;
  c.beginPath();
  for (let i = -40; i <= 40; i++) {
    const p = bowlLocal(i / 40);
    if (i === -40) c.moveTo(p.x, p.y);
    else c.lineTo(p.x, p.y);
  }
  c.stroke();
  // 'bowl': a glint runs round the one clean curve, rim to rim, settling at the bottom
  const run = clamp01((t - (b.bowl - 0.08)) / 0.7);
  const ga = win(t, b.bowl - 0.1, b.bowl + 0.05) * (1 - win(t, b.bowl + 0.75, b.bowl + 1.4));
  if (ga > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const side of [-1, 1]) {
      const x = side * (1 - sm(run));
      const p = bowlLocal(x);
      glow(c, p.x, p.y, 34, m.core, 0.55 * ga);
      // a short bright stretch of the edge behind the glint
      c.strokeStyle = withAlpha(m.core, 0.7 * ga);
      c.lineWidth = 2.6;
      c.beginPath();
      for (let i = 0; i <= 10; i++) {
        const q = bowlLocal(x + side * 0.22 * (i / 10));
        if (i === 0) c.moveTo(q.x, q.y);
        else c.lineTo(q.x, q.y);
      }
      c.stroke();
    }
    c.restore();
  }
  c.restore();
  // the ball, resting calmly at its single bottom
  const bp = ballAt();
  const warm = 0.35 + 0.65 * win(t, b.bowl + 0.35, b.bowl + 0.7);
  glow(c, bp.x, bp.y, 46, m.halo, 0.35 * warm);
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.beginPath();
  c.arc(bp.x + 3, bp.y + 4, 9, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(m.core, '#fff4d8', 0.3 * warm);
  c.beginPath();
  c.arc(bp.x, bp.y, 9, 0, Math.PI * 2);
  c.fill();
}

// ------------------------------------------------------------------ the misty hills in miniature (flat, framed)
/** the traveller's lantern within a mistyHills box (mirrors the kit's own placement) */
function lanternIn(X: number, Y: number, W: number, H: number): P {
  const path = descentPath(MISTY_LR.timid, -5.3, 60);
  const a = path[T_STEP], bb = path[T_STEP + 1];
  const facing = Math.sign(bb - a) || Math.sign(-lossDf(a)) || 1;
  const sx = X + ((a + 6.4) / 12.8) * W;
  const sy = Y + H * 0.9 - (lossF(a) / 3.6) * H * 0.48;
  const s = (80 * (W / 1280)) / 100;
  return { x: sx + facing * 44 * s, y: sy - 102 * s };
}
const HILLS_PIC = { w: HILLS.w - 2 * FRAME_IN, h: HILLS.h - 2 * FRAME_IN };
/** the picture itself (baked: the timid traveller long since settled in the hollow) */
function hillsPicture(f: Frame, env: PaintEnv): (c: C, x: number, y: number) => void {
  const m = env.mood;
  const { w, h } = HILLS_PIC;
  return f.cached(`${ID}/hills/${m.id}`, w, h, (cc) => {
    cc.fillStyle = mixLab(m.sky[1], m.set, 0.35);
    cc.fillRect(0, 0, w, h);
    mistyHills(cc, { x: 0, y: 0, w, h, lr: MISTY_LR.timid, step: T_STEP, fog: 0.95, tangent: 0, trail: false, labels: false, reveal: 1 }, env);
  });
}
function toHills(p: P): P {
  const cs = Math.cos(HILLS.rot), sn = Math.sin(HILLS.rot);
  return { x: HILLS.x + p.x * cs - p.y * sn, y: HILLS.y + p.x * sn + p.y * cs };
}
function hillsPiece(f: Frame, c: C, env: PaintEnv, t: number, _b: B, a: number, framed = true) {
  const m = env.mood;
  const w = HILLS.w, h = HILLS.h;
  c.save();
  c.globalAlpha *= a;
  c.translate(HILLS.x, HILLS.y);
  c.rotate(HILLS.rot);
  if (framed) {
    // a paper mount lying flat on the blotter, with its cast shadow (not an upright frame)
    c.save();
    c.filter = 'blur(6px)';
    c.fillStyle = withAlpha(m.ink, 0.55);
    c.fillRect(-w / 2 - 9, -h / 2 + 13, w, h);
    c.restore();
    c.fillStyle = withAlpha(m.ink, 0.45);
    c.fillRect(-w / 2 - 2, -h / 2 + 3, w, h);
    c.fillStyle = mixLab(m.setHaze, m.halo, 0.42);
    c.fillRect(-w / 2, -h / 2, w, h);
    c.fillStyle = withAlpha(m.fg, 0.35);
    c.fillRect(-w / 2 + FRAME_IN - 1.5, -h / 2 + FRAME_IN - 1.5, w - 2 * FRAME_IN + 3, h - 2 * FRAME_IN + 3);
  }
  hillsPicture(f, env)(c, -w / 2 + FRAME_IN, -h / 2 + FRAME_IN);
  if (framed) hillsRidges(c, env);
  if (framed) {
    c.strokeStyle = withAlpha(m.rim, 0.3);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-w / 2, -h / 2 + 0.6);
    c.lineTo(w / 2, -h / 2 + 0.6);
    c.stroke();
  }
  c.restore();
  // the traveller's lantern, still lit in the hollow
  const L = toHills(lanternIn(-w / 2 + FRAME_IN, -h / 2 + FRAME_IN, HILLS_PIC.w, HILLS_PIC.h));
  const fl = 0.85 + 0.15 * fbm(t * 3.1, 77);
  glow(c, L.x, L.y, 16, m.core, 0.7 * a * fl);
  // fog curling over the picture, a few curls leaning out past its left edge toward the bowl
  c.save();
  c.globalAlpha *= a;
  curls(c, env, t, toHills({ x: -w / 2 + 40, y: 30 }), 1, 0.4);
  c.restore();
}
/** three cut-paper ridges laid over the picture's lower edge, each offset with its own drop shadow, so the miniature
 *  reads as layered paper (rhyming with the paper bowl beside it) rather than a flat photograph. They stay below the
 *  hollow where the traveller stands. */
function hillsRidges(c: C, env: PaintEnv) {
  const m = env.mood;
  const x0 = -HILLS.w / 2 + FRAME_IN, x1 = HILLS.w / 2 - FRAME_IN;
  const yb = HILLS.h / 2 - FRAME_IN;
  const layers: [number, number, number, number][] = [
    // [base height above the bottom, amplitude, frequency seed, darkness]
    [30, 9, 1, 0.35],
    [20, 8, 2, 0.55],
    [10, 6, 3, 0.78],
  ];
  c.save();
  c.beginPath();
  c.rect(x0, -HILLS.h / 2 + FRAME_IN, x1 - x0, HILLS.h - 2 * FRAME_IN);
  c.clip();
  for (const [hb, amp, sd, dk] of layers) {
    const path = new Path2D();
    path.moveTo(x0 - 4, yb + 4);
    for (let i = 0; i <= 40; i++) {
      const x = x0 + ((x1 - x0) * i) / 40;
      const y = yb - hb - amp * (0.6 * Math.sin(i * 0.33 + sd * 1.7) + 0.4 * Math.sin(i * 0.81 + sd * 2.9));
      path.lineTo(x, y);
    }
    path.lineTo(x1 + 4, yb + 4);
    path.closePath();
    c.save();
    c.translate(-1.5, 2.5);
    c.fillStyle = withAlpha(m.ink, 0.45);
    c.fill(path);
    c.restore();
    c.fillStyle = mixLab(mixLab(m.setHaze, m.halo, 0.25), m.fg, dk);
    c.fill(path);
  }
  c.restore();
}

/** slow curls of fog: soft blobs drifting on a curling path (deterministic) */
function curls(c: C, env: PaintEnv, t: number, at: P, k: number, alpha = 0.32) {
  const m = env.mood;
  const spr = softSprite(mixLab(m.haze, m.halo, 0.25));
  for (let i = 0; i < 9; i++) {
    const ph = hash1(i, 31) * 0.5 + 0.5;
    const life = ((t * 0.16 + ph) % 1 + 1) % 1;
    const ang = 2.6 + hash1(i, 32) * 0.7 + life * 1.1;
    const R = 30 + 110 * life;
    const x = at.x + Math.cos(ang) * R * 1.4 + fbm(t * 0.4 + i, 33) * 14;
    const y = at.y + Math.sin(ang) * R * 0.55 + fbm(t * 0.37 + i, 34) * 10;
    const r = (34 + 40 * life) * k;
    c.globalAlpha = alpha * Math.sin(Math.PI * life);
    c.drawImage(spr, x - r, y - r * 0.7, 2 * r, 1.4 * r);
  }
  c.globalAlpha = 1;
}

// =================================================================================================== C: the question card
function paintC(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.camC(t);
  f.camera(cam);
  studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'duskRose', kind: 'city' } });
  const tq = tq12(t);
  const u = (tq - b.q0) / b.qDur;
  const placedAt = b.q0 + 0.45 * b.qDur;
  // the hands come in along the top edge for the thread (the card never crosses the board's middle)
  const topEntry = { R: toLayer(LAYERS.L4, cam, 1980, -60), L: toLayer(LAYERS.L4, cam, 1980, 40) };
  let envL4: PaintEnv | null = null;
  studyCase(f, {
    shot: ID,
    when: 'end',
    key: ID,
    board: { state: STATE },
    shelf: false,
    xray: { light: 0.3 },
    extra: (c, env) => {
      envL4 = env;
      pinnedSheet(c, env);
      // 'lantern': far away, below and behind the card, the traveller's lantern still glows — soft, seen through the
      // fog that rises in front of it and the wisp (both painted after it); it stays on to the cut
      const la = win(t, b.lantern - 0.4, b.lantern + 0.3);
      if (la > 0.01) {
        const fl = 0.88 + 0.12 * fbm(t * 3.3, 91);
        const lx = Q3C.x + 30, ly = Q3C.y + (Q_H / 2 + 12) * BK;
        glow(c, lx, ly, 120, env.mood.halo, 0.26 * la * fl);
        glow(c, lx, ly, 46, env.mood.halo, 0.3 * la * fl);
        glow(c, lx, ly, 14, env.mood.core, 0.55 * la * fl);
      }
      if (u >= 0.45) {
        const dt = tq - placedAt;
        const sway = pinSway(dt) * 1.4 + 0.012 * Math.sin(t * 1.4 + 0.3) * win(t, placedAt + 0.8, placedAt + 2);
        c.save();
        c.translate(Q3_PIN.x, Q3_PIN.y);
        c.rotate(sway);
        c.translate(-Q3_PIN.x, -Q3_PIN.y);
        qCard(c, env, Q3_PIN.x, Q3_PIN.y, Math.max(0.65, poolAt(POOL_B, Q3X, BOARD.threadY + 40)), true);
        c.restore();
      }
      if (u > 0 && u < 0.9) {
        const hp = hands.act('pin', u, Q3_PIN, { held: 'card', scale: 0.8, entry: topEntry });
        hands.draw(c, hp, env, { heldDraw: (cc, at, _h, e) => qCard(cc, e, at.x, at.y, 0.85, false) });
      }
    },
  });
  // the hills' fog creeps up into the study and a wisp drifts across in front of the card
  const rise = win(t, b.fog - 0.15, b.fog + 1.6);
  // review round 1: the wisp rises from 'lantern' − 0.4 and holds to the end, still crossing the card in the silence
  const wisp = win(t, b.lantern - 0.4, b.lantern + 0.3);
  f.layer(FOG_NEAR, (c, env) => {
    fogRise(c, env, t, rise);
  });
  void envL4;
  fogWisp(f, t, b, wisp);
  deskEdge(f, cam, sc.camC(b.D), `${ID}/edgeC`);
  near(f, sc, cam);
  // chiaroscuro: the pool round the question, the corners to ink, the green-shaded lamp at the top edge
  const qc = toScreen(LAYERS.L4, cam, Q3C.x, Q3C.y);
  lampFalloff(f, qc.x - 60, qc.y + 90, 0.95);
  lampShade(f, t);
}

/** the banker's lamp's green shade just in at the top edge of frame (near, soft), its warm light spilling down */
function lampShade(f: Frame, t: number) {
  const c = f.c;
  const m = f.mood;
  const fl = 0.95 + 0.05 * fbm(t * 1.7, 61);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(1010, 10, 10, 1010, 10, 420);
  g.addColorStop(0, withAlpha(m.halo, 0.42 * fl));
  g.addColorStop(0.4, withAlpha(m.halo, 0.12 * fl));
  g.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = g;
  c.fillRect(560, -20, 900, 460);
  c.restore();
  c.save();
  c.filter = `blur(${5 * f.pxScale}px)`;
  c.fillStyle = mixLab(m.fg, '#2c4a36', 0.3);
  c.beginPath();
  c.ellipse(1060, -64, 300, 92, -0.05, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(m.core, 0.55 * fl);
  c.lineWidth = 3;
  c.beginPath();
  c.ellipse(1060, -64, 300, 92, -0.05, Math.PI * 0.2, Math.PI * 0.85);
  c.stroke();
  c.restore();
}

/** the question card with its clip, its top (the clip point) at (x, y) */
function qCard(c: C, env: PaintEnv, x: number, y: number, light: number, clip: boolean) {
  const k = BK;
  if (clip) {
    c.strokeStyle = oxblood(env);
    c.lineWidth = 1.2 * k;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y + Q_CLIP * k);
    c.stroke();
  }
  drawCard(c, { id: 'Q-Q3', w: Q_W, h: Q_H, icon: 'question', text: Q3_TEXT }, { x, y: y + (Q_CLIP + Q_H / 2) * k, k, light, pin: false }, env);
}

/** the fog bank rising from below the frame (world coords of the near fog plane) */
function fogRise(c: C, env: PaintEnv, t: number, a: number) {
  if (a <= 0.01) return;
  const m = env.mood;
  const spr = softSprite(mixLab(m.haze, m.halo, 0.3));
  const base = 300 - 110 * a;
  for (let i = 0; i < 16; i++) {
    const ph = hash1(i, 41) * 0.5 + 0.5;
    const x = 500 + i * 34 + 8 * t + fbm(t * 0.3 + i * 1.7, 42) * 12;
    const y = base + 22 * ph + fbm(t * 0.25 + i * 2.3, 43) * 7 - 11 * Math.sin(i * 0.9 + t * 0.35);
    const r = 30 + 28 * ph;
    c.globalAlpha = a * (0.22 + 0.16 * ph);
    c.drawImage(spr, x - r * 1.3, y - r * 0.6, 2.6 * r, 1.2 * r);
  }
  c.globalAlpha = 1;
}
/** one long wisp (screen-locked, nearest of all): it curls in from the left and drifts across the card's centre line.
 *  Review round 1: a pale, cool mist (lighter and greyer than the warm card, so it reads as fog IN FRONT of it, veiling
 *  the type), two braided strands, per-puff alpha ≈ 0.55, from 'lantern' − 0.4 through the silent hold to the cut. */
function fogWisp(f: Frame, t: number, b: B, a: number) {
  if (a <= 0.01) return;
  const m = f.mood;
  const c = f.c;
  const q = toScreen(LAYERS.L4, f.cam, Q3_PIN.x, Q3_PIN.y);
  const cy = q.y + (Q_CLIP + Q_H * 0.5) * q.k;
  const spr = softSprite(mixLab(mixLab(m.haze, '#e9e6df', 0.55), m.halo, 0.12), 0.15);
  const head = q.x + 60 + 40 * (t - (b.lantern - 0.4));
  c.save();
  for (const [dy, ph, len, al] of [[0, 0, 620, 0.55], [22, 1.9, 460, 0.38]] as const) {
    const n = 22;
    for (let i = 0; i < n; i++) {
      const s = i / (n - 1);
      const x = head - s * len;
      const y = cy + dy - 8 + 18 * Math.sin(s * 4.2 + t * 0.7 + ph) + fbm(t * 0.5 + i + ph, 44) * 7 + 14 * s;
      const r = 22 + 38 * Math.sin(Math.PI * Math.min(1, s * 1.05 + 0.05));
      c.globalAlpha = a * al * 0.8 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.1 + 0.03)), 0.6);
      c.drawImage(spr, x - r * 2.2, y - r * 0.95, 4.4 * r, 1.9 * r);
    }
  }
  c.restore();
}
