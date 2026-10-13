/**
 * ch01-s05 — three suspects; then the study's whole apparatus in one continuous move (candleAmber, 9.33 s).
 *
 * The study is the one geography of sets/study.ts and ch01-s04: the left bookcase flanking the board, the
 * Wall of Forecasts to its right with the study window beyond (the night through it dimmed to a deep blue at
 * about L* 35, below the lamp's pool), the empty candle shelf below the board, and the green-shaded banker's lamp on
 * the desk in front, under its own pool (sets/ch01-s04-nearDesk).
 *
 * BOARD (0 → ~4.95 s): a medium on the board's left margin with the case card K beside it; the camera eases
 *   down with the dealing hand. The detective's LEFT hand (the same articulated, cuffed hand as ch01-s04, a
 *   short forearm rising from the bottom edge, leaning ~12° toward the cards, the hand over the lit cork) carries the three suspect cards and presses each one
 *   flat onto its brass pin in S1, S2, S3, top to bottom, ONE PER WORD: on "Rules", "Knowledge", "learning";
 *   then lets go and withdraws along its forearm. Each card's name, in Special Elite, is the label (≥ 28 px
 *   on the stage): RULES (a paper-cut key over a branching tree), KNOWLEDGE (a small drawer of index cards),
 *   LEARNING (an unlit paper lantern; it stays dark).
 * SHELF (on `shelf` → burning+0.5, about 2.3 s on the rings; wordless): a tilt down past the board to the
 *   long candle shelf, framed on the long sleeves (sterile, knowledge, CYC, fiddly, in-order, experts) so sleeves
 *   of clearly different lengths stand side by side, then a slow drift right toward the live flames, which flare
 *   on `burning`. The candle-clock is glimpsed as GHOSTS (solid ink stubs under pale ring-scored sleeves,
 *   unlettered, threads of smoke, one blackened match), each sleeve backlit like vellum so its length reads;
 *   as the camera rises they fade and the shelf stands empty.
 * WALL (rise arrives on `wall`): the move climbs past the board's right edge to the Wall of Forecasts, a medium on
 *   W6, the one real slip, in deep shadow with only its lower corner catching the lamp; the ghost slips fade.
 * FULL WIDE (wall+0.12 → ~`wide`, then HELD to the cut): the first of the film's three reserved wides:
 *   bookcase, board, the empty shelf (fog lying along it) and the Wall in one frame, W6's corner half-lit, the
 *   lamp on the desk in front with the manila file, a chair back blurred in the lower right corner.
 * Every mark is anchored on the clock's beats (marks()), so the move re-fits if the narration is re-recorded.
 */
import { Timeline } from '../../../core';
import { LAYERS, defineShot, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { STUDY, STUDY_CAMS, STUDY_WALL, studyCase, studyRoom, wallSlotWorld } from '../sets/study';
import { LIT_HEIGHT, RINGS, RING_PX, SLOTS, shelfStateAt, wallStateAt, type SlotId } from '../sets/studyState';
import { poolAt, DEFAULT_POOL } from '../sets/caseBoard';
import { candleShelf, shelfFlames, shelfSlotX, type CandleDraw, type ShelfDraw } from '../sets/beliefCandle';
import { wallOfForecasts } from '../sets/wallOfForecasts';
import { study01Chair, study01Near, study01Shelves } from '../sets/ch01-s04-nearDesk';
import { S05_END_CAM, S05_FULL_CAM, backHaze, lampSpill, shelfBand, wideGrade, windowWash } from '../sets/ch01-s05-wide';
import { WALL_SLOTS } from '../sets/wallOfForecasts';
import { armDir, drawArm, wristAt, type HandShape01, type Pt } from '../sets/ch01-s04-hands';
import { ch01Card } from '../sets/ch01-s04-cards';

// ---------------------------------------------------------------- cameras (keyframed path)
const BOARD: Camera3 = { x: 430, y: 300, z: 380, lens: 1 };
/** the opening creep: ~30 px left toward the board's margin while the hand brings the three cards in */
const BOARD_L: Camera3 = { x: 400, y: 304, z: 382, lens: 1 };
/** lowered ~50 px by the third pin, so the cuffed hand shows under LEARNING and all three suspect cards (RULES at
 *  the top) stay wholly inside the frame on "learning" */
const BOARD2: Camera3 = { x: 440, y: 336, z: 215, lens: 1 };
/** SHELF: framed on the long sleeves (sterile 17, knowledge 7, cyc 39, fiddly 16, inorder 20, experts 13) so
 *  sleeves of clearly different lengths stand side by side; then a slow drift right toward the live flames */
const SHELF_A: Camera3 = { x: 620, y: 812, z: 215, lens: 1 };
const SHELF_B: Camera3 = { x: 1120, y: 800, z: 170, lens: 1 };
const W6P = wallSlotWorld('W6');
/** the Wall, risen to from the shelf: W6 (the one real slip, in shadow) high in frame with the shelf's far
 *  live flames (which stand beneath the Wall) along the bottom, so the flare on `burning` and the W6 linger
 *  share one framing; then a slow creep in on W6 */
const WALL: Camera3 = { x: 1590, y: 560, z: 40, lens: 1 };
const WALL2: Camera3 = { x: W6P.x - 70, y: 520, z: 72, lens: 1 };
/** the full wide (ch01-s05's own, shared with ch01-s06 through S05_END_CAM): pulled back further and raised, so
 *  the board, the candle shelf ABOVE the desk's edge and the Wall all share the frame */
const FULL: Camera3 = S05_FULL_CAM;
const FULL2: Camera3 = S05_END_CAM;
/** the rise passes the Wall with its slips at frame centre (W6's half-lit corner the brightest small shape),
 *  slowing as it grazes, then eases out into the wide */
const GRAZE: Camera3 = { x: W6P.x - 170, y: 300, z: -150, lens: 1 };
const CAMS = [BOARD, BOARD_L, BOARD2, SHELF_A, SHELF_B, WALL, WALL2, GRAZE, FULL];

/** the move's timing (review round 1, critic 2): the tilt leaves the board as LEARNING is pressed (~4.75) and
 *  takes 0.85 s to land on the rings; a ~1 s drift along them; then ONE continuous pull-back: up off the shelf
 *  (~6.55), grazing past W6 (~7.85) without stopping, easing out into the full wide by ~8.45, which then holds
 *  ~0.9 s to the cut (ch01-s06 continues the same hold). The far flames flare on `burning` during the rise. */
type Marks = { tilt0: number; tilt1: number; shelfEnd: number; graze: number; wide: number; flare: number; D: number };
function marks(B: { learning: number; burning: number; D: number }): Marks {
  const D = B.D;
  const tilt0 = B.learning + 0.07; // the LEARNING card is pressed on its pin
  const tilt1 = tilt0 + 0.85; // a real tilt (>= 0.8 s), never a cut
  // the wide lands by ~8.6 s (about 0.7 s of hold before the cut, which ch01-s06 continues)
  const wide = Math.min(D - 0.72, tilt1 + 3.0);
  const shelfEnd = wide - 2.05; // the pull-back: ~2 s, one move
  const graze = shelfEnd + 1.3;
  return { tilt0, tilt1, shelfEnd, graze, wide, flare: B.burning, D };
}

/** piecewise cubic Hermite through camera keys (time, camera, velocity per second) */
type Key = { t: number; c: Camera3; v: Camera3 };
const ZERO: Camera3 = { x: 0, y: 0, z: 0, lens: 0 };
const vel = (a: Camera3, b: Camera3, dt: number): Camera3 => ({ x: (b.x - a.x) / dt, y: (b.y - a.y) / dt, z: (b.z - a.z) / dt, lens: (b.lens - a.lens) / dt });
function hermite(keys: Key[], t: number): Camera3 {
  if (t <= keys[0].t) return keys[0].c;
  for (let i = 0; i < keys.length - 1; i++) {
    const A = keys[i], B = keys[i + 1];
    if (t > B.t) continue;
    const h = B.t - A.t;
    const u = (t - A.t) / h;
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
    const f = (k: keyof Camera3) => h00 * A.c[k] + h10 * h * A.v[k] + h01 * B.c[k] + h11 * h * B.v[k];
    return { x: f('x'), y: f('y'), z: f('z'), lens: f('lens') };
  }
  return keys[keys.length - 1].c;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const smr = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpP = (a: Pt, b: Pt, u: number): Pt => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
const lerpCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: lerp(a.lens, b.lens, u) });
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
function camAt(t: number, M: Marks): Camera3 {
  if (t < 2.9) return lerpCam(BOARD, BOARD_L, sm(t / 2.9));
  if (t < M.tilt0) return lerpCam(BOARD_L, BOARD2, smr((t - 2.9) / (M.tilt0 - 0.4 - 2.9)));
  // the drift along the rings, then the pull-back as one move: it grazes W6 at speed and only stops in the wide
  const drift = vel(SHELF_A, SHELF_B, M.shelfEnd - M.tilt1);
  const through = vel(SHELF_B, FULL, M.wide - M.shelfEnd);
  const keys: Key[] = [
    { t: M.tilt0, c: BOARD2, v: ZERO },
    { t: M.tilt1, c: SHELF_A, v: drift },
    { t: M.shelfEnd, c: SHELF_B, v: drift },
    { t: M.graze, c: GRAZE, v: { x: through.x * 0.35, y: through.y * 0.35, z: through.z * 0.9, lens: 0 } },
    { t: M.wide, c: FULL, v: ZERO },
  ];
  if (t < M.wide) return hermite(keys, t);
  // held: the slightest settle in, so the wide breathes
  return lerpCam(FULL, FULL2, sm((t - M.wide) / (M.D - M.wide)));
}

/** nothing on the shelf is labelled in this glimpse: no lettering, and the base tags hang BLANK (no years) */
const UNLETTERED: Record<string, Partial<CandleDraw>> = Object.fromEntries(shelfStateAt('ch01-s05', 'start').map((v) => [v.id, { letters: 0, view: { ...v, tag: v.tag ? ' ' : '' } }]));
/** where the match lies: in the gap right of the shelf candle nearest the drift's end (past its tag) */
function MATCH_X(o: ShelfDraw) {
  // just left of the far live flames (the chokepoint candle's), lying flat at the front of the plank
  const v = o.views.find((x) => x.id === 'chokepoint');
  return v ? shelfSlotX(o, v.slot) - 92 * (o.s ?? 1) : 1280;
}
/** a struck match lying flat (x = its unstruck end): a pale stick charred along its far half, a black head */
function blackMatch(c: CanvasRenderingContext2D, x: number, y: number, env: PaintEnv) {
  c.save();
  c.translate(x, y);
  c.scale(1.55, 1.55);
  c.translate(-x, -y);
  c.fillStyle = mixLab(env.fill('ink'), env.mood.setHaze, 0.45);
  c.fillRect(x, y - 4, 48, 3.6);
  c.fillStyle = env.mood.fg;
  c.fillRect(x + 26, y - 4, 22, 3.6);
  c.beginPath();
  c.ellipse(x + 50, y - 3.4, 5.4, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.45);
  c.fillRect(x, y - 4.2, 26, 1);
  c.restore();
}
/** the one blackened match lying flat at the front of the plank, among the far candles (its tag blank) */
const MATCH = (() => {
  const v = shelfStateAt('ch01-s05', 'start').find((x) => x.kind === 'match');
  return v ? { ...v, tag: ' ' } : null;
})();

/** the ghost sleeves backlit (review round 1, story: raise the ghost-candle exposure): an additive wash on each
 *  sleeve, brightest at the join where the years end, and a pale paper edge, from the candle rule's own geometry
 *  (45 rings of 6 px, sleeve = rings burned). Out candles keep a darker sleeve (the rule), lit only at the edge. */
function sleeveLight(c: CanvasRenderingContext2D, o: ShelfDraw, env: PaintEnv) {
  const s = o.s ?? 1;
  const H = LIT_HEIGHT * s;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const v of o.views) {
    if (v.state === 'unlit' || v.rings <= 0 || (v.kind !== 'candle' && v.kind !== 'taper')) continue;
    const w = (v.kind === 'taper' ? 13 : 30) * s;
    const x = shelfSlotX(o, v.slot) - w / 2;
    const top = o.y - H;
    const join = top + Math.min(RINGS, v.rings) * RING_PX * s;
    const out = v.state === 'out' || v.state === 'guttered';
    const g = c.createLinearGradient(0, top, 0, join);
    g.addColorStop(0, withAlpha(env.mood.halo, out ? 0.05 : 0.1));
    g.addColorStop(1, withAlpha(env.mood.halo, out ? 0.1 : 0.24));
    c.fillStyle = g;
    c.fillRect(x, top, w, join - top);
    c.strokeStyle = withAlpha(env.mood.rim, out ? 0.3 : 0.42);
    c.lineWidth = 1.2 * s;
    c.strokeRect(x + 0.6 * s, top + 0.6 * s, w - 1.2 * s, join - top - 1.2 * s);
    // the ring scores across the sleeve, one per year burned (clearly counted, so its length reads as a chart)
    c.strokeStyle = withAlpha(env.mood.rim, out ? 0.22 : 0.34);
    c.lineWidth = 0.9 * s;
    c.beginPath();
    for (let y = top + RING_PX * s; y < join - 0.5; y += RING_PX * s) {
      c.moveTo(x + 2 * s, y);
      c.lineTo(x + w - 2 * s, y);
    }
    c.stroke();
  }
  c.restore();
}

const SUSPECTS: SlotId[] = ['S1', 'S2', 'S3'];
const HAND = 165;
const DIR = armDir(-12);
/** the hand holds each card from beneath: fingertips behind it, the knuckles just above its lower edge, so the
 *  palm and cuff show below the card over the lit cork and the name is never covered */
const gripOf = (id: SlotId) => ({ x: 12, y: SLOTS[id].h / 2 - 20 });
const cardC = (id: SlotId) => ({ x: STUDY.board.x + SLOTS[id].x, y: STUDY.board.y + SLOTS[id].y });
const POOL = { ...DEFAULT_POOL, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y, r: STUDY.pool.r };

export default defineShot({
  id: 'ch01-s05',
  mood: 'candleAmber',
  build({ timing: TT }) {
    const tl = new Timeline();
    tl.hold(0, TT.duration);
    const pins = [TT.beat('rules'), TT.beat('knowledge'), TT.beat('learning')];
    const burning = TT.beat('burning');
    const M = marks({ learning: pins[2], burning, D: TT.duration });
    return { tl, D: TT.duration, pins, burning, M };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = q2(t);
    const M = sc.M;
    const cam = camAt(t, M);
    f.camera(cam);
    studyRoom(f, { key: 'ch01-s05', cams: CAMS, outside: { mood: 'winterBlue', kind: 'city', city: 0.3 } });
    study01Shelves(f, { key: 'ch01-s05', cams: CAMS });
    windowWash(f, cam);
    // before the wide the window must not bring a second hue into the amber shot: nearly neutral (C* ~8) until the
    // pull-back reaches the wide, where it settles to the night blue ch01-s06 opens on
    windowNeutral(f, cam, 1 - sm((t - (M.graze + 0.05)) / 0.5));

    // ---------------- the left hand dealing the three suspect cards (on twos)
    const pins = sc.pins;
    const away = (p: Pt, d: number): Pt => ({ x: p.x - Math.cos(DIR) * d, y: p.y - Math.sin(DIR) * d });
    const sockAt = (i: number) => {
      const id = SUSPECTS[i];
      const g = gripOf(id);
      const C = cardC(id);
      return { x: C.x + g.x, y: C.y + g.y };
    };
    let sock: Pt | null = null;
    let shape: HandShape01 = 'pinch';
    let carrying = -1; // index of the card in the fingers (the rest of the stack behind it)
    let lift = 1;
    // the hand brings the three-card fan up from the bottom edge from ~1.0 s, so "three suspects" is seen first
    const t0 = 1.0;
    const PRESS = 0.12;
    if (tq >= t0 && tq < pins[2] + 0.75) {
      let i = 0;
      while (i < 2 && tq >= pins[i] + PRESS) i++;
      if (tq < pins[0] - 0.14) {
        // rising into frame with the fan (in by ~1.9 s, low in frame), then up toward S1
        const tgt = { x: sockAt(0).x - 6, y: sockAt(0).y + 8 };
        const T1 = 1.9;
        if (tq < T1) sock = lerpP(away(tgt, 520), away(tgt, 230), 1 - Math.pow(1 - clamp01((tq - t0) / (T1 - t0)), 2));
        else sock = lerpP(away(tgt, 230), tgt, sm((tq - T1) / (pins[0] - 0.14 - T1)));
        carrying = 0;
      } else if (tq >= pins[i] - 0.1 && tq < pins[i] + PRESS) {
        // settle and press flat on the word
        const u = sm((tq - pins[i] + 0.1) / 0.1);
        sock = lerpP({ x: sockAt(i).x - 6, y: sockAt(i).y + 8 }, sockAt(i), u);
        carrying = i;
        lift = tq < pins[i] ? 1 - u : 0;
      } else if (i < 3 && i > 0 && tq < pins[i] - 0.1) {
        // carrying the next card down from the last pin to the next slot (a small arc away from the board);
        // the hand waits just off the last pin and makes the carry in the last ~0.45 s, so the card travels
        // and presses flat on its word
        const a = sockAt(i - 1), b = { x: sockAt(i).x - 6, y: sockAt(i).y + 8 };
        const c0 = Math.max(pins[i - 1] + PRESS, pins[i] - 0.55);
        const wait = sm((tq - (pins[i - 1] + PRESS)) / 0.18);
        const u = sm((tq - c0) / (pins[i] - 0.1 - c0));
        // the hover: down and to the right of the pinned card, so it never covers the name just pinned
        const hover = { x: a.x + 160 * wait, y: lerp(a.y, b.y, 0.62 * wait) };
        sock = { x: lerp(hover.x, b.x, u) + 22 * Math.sin(Math.PI * u), y: lerp(hover.y, b.y, u) };
        carrying = i;
      } else {
        // let go of the last card, then withdraw along the forearm: quickly (accelerating), so the hand is out
        // of frame before the tilt reaches the shelf (it withdraws down-left, the way the camera is going)
        const u = clamp01((tq - pins[2] - PRESS) / 0.42);
        sock = away(sockAt(2), 40 + 900 * u * u);
        shape = 'rest';
      }
    }

    // ---------------- the ghosts: visible from the tilt, gone once the camera has left them
    // the shelf's ghosts at full exposure from the tilt's landing until the rise (about 2 s), fading as we climb
    const shelfGhost = sm((t - (M.tilt0 + 0.2)) / 0.45) * (1 - sm((t - M.shelfEnd - 0.35) / 0.6));
    const wallGhost = 1 - sm((t - M.graze - 0.1) / 0.6);
    // the far flames flare while the camera is with them (the clock's 'burning' beat falls after the rise)
    const flare = 1 + 0.6 * Math.exp(-(((t - M.flare - 0.08) / 0.22) ** 2));
    const views = shelfStateAt('ch01-s05', 'start');
    // the stubs SOLID ink and the sleeves pale ring-scored paper with their rim edge (candle ghost 0), so the
    // stub-versus-sleeve split, which is the chart, reads against the darkened wall band; the glimpse's
    // ghostliness is the whole shelf's fade (unlettered: nothing is labelled; the base tags hang blank)
    // (critic 2: the stubs lifted a step toward the haze, so the row reads as pale ghosts, not black pillars)
    // (critic round 1, fifth set: the stubs are translucent PAPER, about half alpha with a rim edge, not black posts)
    const shelf: ShelfDraw = { ...STUDY.shelf, views, ghost: 0.9, drawFlames: false, named: {}, over: UNLETTERED };
    const slips = wallStateAt('ch01-s05', 'start');
    const ghostSlots = slips.filter((v) => v.ghost).map((v) => v.slot);

    studyCase(f, {
      shot: 'ch01-s05',
      when: 'end',
      key: 'ch01-s05',
      shelf: false,
      wall: false,
      board: { hide: [...SUSPECTS, 'K'] },
      extra: (c, env) => {
        // the Wall: solid (W6's real slip, the empty W8 pin) + the ghost slips fading out over it
        const wallO = { ...STUDY.wall, slips, light: 1 };
        wallOfForecasts(c, { ...wallO, hide: ghostSlots }, env);
        if (wallGhost > 0.01) {
          c.save();
          c.globalAlpha *= wallGhost;
          wallOfForecasts(c, wallO, env);
          // the ghost slips outlined a step stronger (~8-10 L*), each on its pin, so the Wall reads as a wall of
          // pinned forecasts in the glimpse (W6, the one real slip, keeps its half-lit corner as the brightest)
          ghostSlipEdges(c, env, ghostSlots);
          c.restore();
        }
        // the wall darkened in a band behind the shelf, then the plank; the ghost candles show only while the
        // camera is with them
        shelfBand(c, env);
        candleShelf(c, { ...shelf, only: [] }, env);
        // the glimpse's cut-paper shelf lip and brackets over the plank's apron (they fade once the shelf has left
        // the frame on the rise, so the wide matches ch01-s06's plank)
        const lipK = 1 - sm((t - M.shelfEnd - 0.45) / 0.5);
        if (lipK > 0.01) shelfLip(c, env, shelf, lipK);
        if (shelfGhost > 0.01) {
          c.save();
          c.globalAlpha *= shelfGhost;
          candleShelf(c, shelf, env);
          // review round 1: the ghosts' exposure raised: each sleeve backlit like vellum, so its length reads
          sleeveLight(c, shelf, env);
          // the one blackened match, lying flat on the plank under a candle's tag, near the live flames
          if (MATCH) blackMatch(c, MATCH_X(shelf), STUDY.shelf.y, env);
          c.restore();
        }
        // the board's cork in the medium: the same tight lamp pool as ch01-s04, centred near K and falling to about
        // L* 20 at the left margin, laid UNDER the cards (they catch the pool's edge at about L* 70)
        const corkK = 1 - sm((t - M.tilt0) / 0.6);
        if (corkK > 0.01) corkPool(c, env, corkK);
        // the hand first: it works from behind the cards (fingertips behind the one it holds)
        if (sock) drawArm(c, env, { wrist: wristAt(sock, DIR, shape, HAND, 'L', 0.1), dir: DIR, shape, side: 'L', len: HAND, bend: 0.1 });
        // the case card, lettered as ch01-s04 pinned it
        ch01Card(c, SLOTS.K, { x: cardC('K').x, y: cardC('K').y, light: poolAt(POOL, SLOTS.K.x, SLOTS.K.y) }, env);
        // the suspect cards, each on its pin from its word
        SUSPECTS.forEach((id, i) => {
          if (tq < pins[i]) return;
          const k = t - pins[i];
          const swing = 0.06 * Math.exp(-k * 4) * Math.sin(k * 14);
          ch01Card(c, SLOTS[id], { x: cardC(id).x, y: cardC(id).y, light: poolAt(POOL, SLOTS[id].x, SLOTS[id].y), rot: swing }, env);
        });
        if (sock && carrying >= 0) {
          // the remaining cards behind the one in the fingers, edges showing
          for (let j = 2; j > carrying; j--) {
            const id = SUSPECTS[j];
            const g = gripOf(id);
            // fanned (a hand of cards), so all three suspects show from the moment it enters
          ch01Card(c, SLOTS[id], { x: sock.x - g.x + 22 * (j - carrying), y: sock.y - g.y - 10 * (j - carrying), light: 0.55, pin: false, rot: 0.11 * (j - carrying), lift: 1 }, env);
          }
          const id = SUSPECTS[carrying];
          const g = gripOf(id);
          ch01Card(c, SLOTS[id], { x: sock.x - g.x, y: sock.y - g.y, light: 0.85, rot: -0.02 * lift, lift }, env);
        }
      },
      flames: false,
    });
    // the live flames at the shelf's far end (ghost candles still burning), flaring once on `burning`
    if (shelfGhost > 0.02) {
      for (const fl of shelfFlames(shelf)) f.practical({ x: fl.x, y: fl.y + 6, kind: 'candle', seed: fl.seed, intensity: 0.75 * shelfGhost * flare, radius: 36 });
    }
    // a haze band lying in FRONT of the stubs during the glimpse (the candles stand back in the air)
    if (shelfGhost > 0.01) {
      const sy = toScreen(LAYERS.L4, cam, 0, STUDY.shelf.y - 110).y;
      f.fog({ yCenter: sy, height: 210, alpha: 0.3 * shelfGhost, drift: 6 });
    }
    // fog lying along the shelf in the wide
    const wideK = sm((t - (M.graze - 0.25)) / 0.7);
    if (wideK > 0.01) {
      const sy = toScreen(LAYERS.L4, cam, 0, STUDY.shelf.y).y;
      f.fog({ yCenter: sy - 10, height: 150, alpha: 0.4 * wideK, drift: 8 });
    }
    // the desk + lamp + file (near plane): kept out of the low shelf glimpse, where the near lamp would
    // stand in front of the candles (it leaves during the tilt's fastest frames and returns in the pull-back)
    const nearA = (1 - sm((t - M.tilt0 - 0.07) / 0.28)) + sm((t - M.graze + 0.3) / 0.45);
    // the amber backlight and haze behind the board area (brightest ~0.6H): the lamp and desk stand against it
    backHaze(f, wideK);
    study01Near(f, { key: 'ch01-s05', cams: CAMS, lamp: 1, file: true, alpha: Math.min(1, nearA) });
    if (wideK > 0.01) lampSpill(f, cam, wideK);
    if (wideK > 0.01) wideGrade(f, cam, wideK, t);
    study01Chair(f, { key: 'ch01-s05', cams: CAMS, alpha: wideK });

    // the board medium's near plane: the desk's front edge and a chair finial, ink and blurred (L5)
    boardNear(f, 1 - sm((t - M.tilt0) / 0.3));
    // the lamp's pool on the board: the light falls off hard toward the frame edges (fades as we leave); the wall
    // away from the pool sits ~8 L* deeper than before, so the pool is the one bright shape
    const c = f.c;
    {
      const vA = 1 - sm((t - M.tilt0) / 0.8);
      if (vA > 0) {
        const pc = toScreen(LAYERS.L4, cam, STUDY.pool.cx - 60, STUDY.pool.cy);
        const g = c.createRadialGradient(pc.x, pc.y, 130, pc.x, pc.y, 1000);
        g.addColorStop(0, withAlpha(f.mood.fg, 0));
        g.addColorStop(0.4, withAlpha(f.mood.fg, 0.2 * vA));
        g.addColorStop(1, withAlpha(f.mood.fg, 0.8 * vA));
        c.save();
        c.fillStyle = g;
        c.fillRect(-20, -20, 1320, 760);
        c.restore();
      }
    }
  },
});

/** the cork's lamp pool (board medium only): a dark laid over the board (clipped to the cork), clear at K and
 *  deepening outward, so the cork matches ch01-s04's tight pool and the left margin sinks to about L* 20 */
function corkPool(c: CanvasRenderingContext2D, env: PaintEnv, k: number) {
  const B = STUDY.board;
  const K = { x: B.x + SLOTS.K.x, y: B.y + SLOTS.K.y + 20 };
  c.save();
  c.beginPath();
  c.rect(B.x, B.y, 1000, 620);
  c.clip();
  c.translate(K.x, K.y);
  c.scale(1.15, 1);
  const g = c.createRadialGradient(0, 0, 150, 0, 0, 560);
  g.addColorStop(0, withAlpha(env.mood.fg, 0));
  g.addColorStop(0.35, withAlpha(env.mood.fg, 0.32 * k));
  g.addColorStop(0.75, withAlpha(env.mood.fg, 0.62 * k));
  g.addColorStop(1, withAlpha(env.mood.fg, 0.72 * k));
  c.fillStyle = g;
  c.fillRect(-1000, -800, 2000, 1600);
  c.restore();
}

/** the shelf's lip in the glimpse: a straight cut-paper plank edge (covering the scalloped apron) with a moulding
 *  line catching the lamp, and three plain cut brackets with a pierced round */
function shelfLip(c: CanvasRenderingContext2D, env: PaintEnv, o: ShelfDraw, k: number) {
  const s = o.s ?? 1;
  const m = env.mood;
  const ink = env.fill('ink');
  const n = o.views.length;
  const L = shelfSlotX(o, n - 1) - o.x + 80 * s;
  c.save();
  c.globalAlpha *= k;
  c.fillStyle = ink;
  c.fillRect(o.x - 6 * s, o.y, L + 12 * s, 26 * s);
  c.fillStyle = withAlpha(m.rim, 0.42);
  c.fillRect(o.x - 6 * s, o.y + 12 * s, L + 12 * s, 1.2 * s);
  c.fillStyle = withAlpha(m.rim, 0.2);
  c.fillRect(o.x - 6 * s, o.y + 25 * s, L + 12 * s, 1 * s);
  for (const bx of [o.x + 70 * s, o.x + L * 0.5, o.x + L - 70 * s]) {
    const br = new Path2D();
    br.moveTo(bx - 5 * s, o.y + 26 * s);
    br.lineTo(bx + 5 * s, o.y + 26 * s);
    br.lineTo(bx + 5 * s, o.y + 86 * s);
    br.lineTo(bx - 1 * s, o.y + 86 * s);
    br.lineTo(bx - 46 * s, o.y + 30 * s);
    br.lineTo(bx - 46 * s, o.y + 26 * s);
    br.closePath();
    br.moveTo(bx - 10 * s + 7 * s, o.y + 46 * s);
    br.arc(bx - 10 * s, o.y + 46 * s, 7 * s, 0, Math.PI * 2, true);
    c.fillStyle = ink;
    c.fill(br, 'evenodd');
    c.fillStyle = withAlpha(m.rim, 0.3);
    c.fillRect(bx - 46 * s, o.y + 26 * s, 51 * s, 1 * s);
  }
  c.restore();
}

/** the Wall's ghost slips, a step stronger: a pale outline and a brass pin on each */
function ghostSlipEdges(c: CanvasRenderingContext2D, env: PaintEnv, ids: string[]) {
  const m = env.mood;
  const k = STUDY.wall.k;
  for (const id of ids) {
    const S = WALL_SLOTS[id as keyof typeof WALL_SLOTS];
    if (!S) continue;
    const cx = STUDY.wall.x + S.x * k, cy = STUDY.wall.y + S.y * k;
    const w = S.w * k, h = S.h * k;
    c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.3), 0.42);
    c.lineWidth = 1.4;
    c.strokeRect(cx - w / 2, cy - h / 2, w, h);
    c.fillStyle = withAlpha(mixLab(m.setHaze, m.halo, 0.4), 0.14);
    c.fillRect(cx - w / 2, cy - h / 2, w, h);
    c.fillStyle = mixLab(m.halo, m.set, 0.35);
    c.beginPath();
    c.arc(cx, cy - h / 2 + 6, 3.2, 0, Math.PI * 2);
    c.fill();
  }
}

/** the board medium's near plane (L5, blurred by the layer), authored in screen px at the BOARD camera: the
 *  edge of a heavy curtain hanging full height at the right of frame, clear of the cards and the dealing hand
 *  (authored at BOARD2: it enters from the right edge as the camera eases back) */
function boardNear(f: Frame, a: number) {
  if (a <= 0.01) return;
  f.layer('L5', (c, env) => {
    const P = (sx: number, sy: number) => toLayer(LAYERS.L5, BOARD2, sx, sy);
    const ink = mixLab(env.fill('ink'), env.mood.fg, 0.35);
    c.save();
    c.globalAlpha *= a;
    c.fillStyle = ink;
    // a heavy curtain edge hanging full height at the right of frame (the room's near plane): it slides in from the
    // right edge as the camera eases back for the third pin and frames the board's right side (authored at BOARD2)
    const t0 = P(1222, -200), t1 = P(1520, 1000);
    c.beginPath();
    c.moveTo(t1.x, t0.y);
    c.lineTo(t0.x, t0.y);
    for (let k = 0; k <= 12; k++) {
      const u = k / 12;
      c.lineTo(t0.x + 10 * Math.sin(u * 7.1) + 26 * u * u, t0.y + (t1.y - t0.y) * u);
    }
    c.lineTo(t1.x, t1.y);
    c.closePath();
    c.fill();
    // one fold catching the lamp
    c.strokeStyle = withAlpha(env.mood.rim, 0.14);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(t0.x + 34, t0.y);
    c.lineTo(t0.x + 46, t1.y);
    c.stroke();
    c.restore();
  });
}

/** the study window taken toward neutral (a strong desaturation over its glass), k = 1 before the wide */
function windowNeutral(f: Frame, cam: Camera3, k: number) {
  if (k <= 0.01) return;
  const W = STUDY.window;
  const a = toScreen(STUDY_WALL, cam, W.x, W.y);
  const b = toScreen(STUDY_WALL, cam, W.x + W.w, W.y + W.h);
  if (b.x < 0 || a.x > 1280) return;
  const c = f.c;
  c.save();
  c.beginPath();
  c.rect(a.x, a.y, b.x - a.x, b.y - a.y);
  c.clip();
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = withAlpha('#808080', 0.85 * k);
  c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = withAlpha(mixLab(f.mood.haze, f.mood.fg, 0.5), 0.25 * k);
  c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
  c.restore();
}
