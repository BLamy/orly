/**
 * ch13-s06 — the thin Cyc taper goes out at thirty-nine rings, the case card is re-pinned, and an oxblood thread leads
 * to the window, where the candle shelf's reflection settles over dark water between two shores (candleAmber, STUDY
 * LOCK; 14.67 s; in: crossfade from the three-lamp stage).
 *
 * CAMERA: the reverse FLAME PUSH out of the worry candle's flame (1.2 s, lens 1.6 → 1, bloom down, duskRose →
 * candleAmber) to SHELF (low, the worry candle at frame right, the Cyc taper at left) → a tilt up to BOARD (the K card
 * re-pinned as an insert) → along the thread to the study window.
 *   'cyc'      the shelf: the thin Cyc taper still burning, its ghost sleeve the tallest on the shelf; its tag
 *              CYC · 1984–2023 · 39
 *   'out'      on 'died' the taper's flame bows and goes out; a thread of smoke rises
 *   'sleeve'   on 'thirty-nine' a faint rim of light runs up the dark 39-ring sleeve, the tallest bar on the shelf
 *   'repin'    tilt up to the board: the hands straighten the case card WHO TAUGHT IT? and press its pin home
 *   'thread'   a new oxblood thread is drawn from the 2022 shears card (C4-b) off the board's right edge
 *   'water'    follow it to the window: dark water, two far shores with small lit windows, equal in warmth
 *   'reflect'  the lamp's reflection trembles in the glass, alone
 *   'shelf'    the right end of the candle shelf, flames and all, resolves in the glass over the water; hold
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down one
 * ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve (39 rings = 234 px).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, ShotScene } from '../../../film';
import { FONT, LAYERS, MOODS, bankersLamp, defineShot, layerXform, mixLab, textRole, toLayer, toScreen, vnoise2, withAlpha } from '../../../film';
import { hands } from '../cast';
import { STUDY, STUDY_WALL, candleX, slotWorld, studyCase, studyRoom } from '../sets/study';
import { LIT_HEIGHT, RING_PX, SLOTS, boardStateAt, shelfStateAt, wallStateAt, type CandleView } from '../sets/studyState';
import { wallOfForecasts } from '../sets/wallOfForecasts';
import { beliefCandle, candleFlame, candleShelf, type ShelfDraw } from '../sets/beliefCandle';
import { oxblood } from '../sets/caseBoard';
import { frameOn } from '../sets/ch09-s03a-kit';
import { monotone } from '../sets/ch02-s05b-util';
import { bloom, heldSlip, tq12, win, sm, clamp01, lerp } from '../sets/ch13-s01-kit';

const ID = 'ch13-s06';
type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

const V0 = shelfStateAt(ID, 'start');
const V1 = shelfStateAt(ID, 'end');
const view = (vs: CandleView[], id: string) => vs.find((v) => v.id === id)!;
const SY = STUDY.shelf.y;
const CYC_X = candleX(V0, 'cyc');
const WORRY_X = candleX(V0, 'worry');
/** the shared shelf, the Cyc taper left off (this shot draws it: cycTaper) */
// round 3: the naming rule's horizontal card is off for this shot (the CYC · 1984–2023 · 39 tag carries the words and
// stays up through 'longest'; the sleeves themselves make the comparison)
const SHELF_DRAW: ShelfDraw = { ...STUDY.shelf, views: V0.map((v) => (v.id === 'cyc' ? { ...v, state: 'unlit' as const } : v)), drawFlames: false, named: {} };
const CYC0: CandleView = { ...view(V0, 'cyc'), tag: '' };
const CYC_FLAME = candleFlame({ x: CYC_X, y: SY, view: CYC0, s: STUDY.shelf.s });
const WORRY_FLAME = candleFlame({ x: WORRY_X, y: SY, view: view(V0, 'worry'), s: STUDY.shelf.s });
/** the sleeve's extent (39 rings = 234 px) */
const SLEEVE = { top: SY - 270, bot: SY - 270 + 39 * 6 };
// the board: K and the shears card
const K_PIN = slotWorld('K', 'pin');
const K_C = slotWorld('K');
const C4B = slotWorld('C4-b');
const THREAD0 = { x: C4B.x + SLOTS['C4-b'].w / 2 - 4, y: C4B.y - 8 };
const WIN = STUDY.window;
/** the thread's far end: tied at the window's left jamb (on the study wall's plane) */
const JAMB = { x: WIN.x - 9, y: 600 };
/** final camera: the window centred in frame (on the study wall's plane, not the action plane) */
const K_WIN = 1.55;
const CAM_WIN = (() => {
  const c0 = frameOn({ x: WIN.x + WIN.w / 2, y: 572 }, { x: 640, y: 360 }, K_WIN);
  const m = layerXform(STUDY_WALL, c0);
  const sc = toScreen(STUDY_WALL, c0, WIN.x + WIN.w / 2, 572);
  return { ...c0, x: c0.x + (sc.x - 640) / m.s, y: c0.y + (sc.y - 360) / m.s };
})();
/** the repin insert: the K card's pin on the right third of frame, so the hand comes in on a short forearm */
const K_FRAME = { x: 640 - (1000 - 640) / 1.4 + (K_PIN.x - 640), y: K_PIN.y - (300 - 360) / 1.4, k: 1.4 };
/** the Cyc taper: 70% of a candle's width, a dark ring-scored 39-ring sleeve over a 6-ring stub */
const CYC_W = 21;
const RING = 6;

interface B {
  D: number;
  land: number;
  cyc: number;
  out: number;
  sleeve: number;
  end: number;
  repin: number;
  thread: number;
  water: number;
  reflect: number;
  shelf: number;
  longest: number;
}
interface Scene extends ShotScene {
  b: B;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const end = T.line('L1316').end;
    const b: B = {
      D,
      land: 1.2,
      cyc: T.beat('cyc'),
      out: T.beat('out'),
      sleeve: T.beat('sleeve'),
      end,
      repin: T.beat('repin'),
      thread: T.beat('thread'),
      water: T.beat('water'),
      reflect: T.beat('reflect'),
      shelf: T.beat('shelf'),
      longest: T.word('L1316', 'longest'),
    };
    const SHELF: [number, number, number] = [(CYC_X + WORRY_X) / 2 - 46, 836, 1.24];
    // round 3: the shelf for the whole line, framed as the CHART: the Cyc taper on the left third, the live worry
    // candle's flame on the right third (the one new burning belief against the 39-year one just put out), at least
    // five neighbours between and beside them; a slow ease in through the line (the tag reads at >= 25 px cap); the
    // tilt up to the board starts during 'our shelf'; after the repin ONE eased move along the thread to the window
    const tilt0 = T.word('L1316', 'our') + 0.05;
    const keys: [number, number, number, number][] = [
      [0, WORRY_FLAME.x, WORRY_FLAME.y + 4, 4.2],
      [b.land, ...SHELF],
      [b.out - 0.15, SHELF[0] - 2, 834, 1.25],
      [tilt0, SHELF[0] - 8, 832, 1.29],
      [b.repin + 0.15, K_FRAME.x, K_FRAME.y, K_FRAME.k],
      [b.thread + 0.05, K_FRAME.x + 12, K_FRAME.y + 2, 1.4],
      // follow the new thread off the board's right edge and across the wall, straight to the window in one 1.35 s
      // ease (no stop at the board's right side), landing before 'reflect'
      [b.thread + 1.4, CAM_WIN.x - 20, CAM_WIN.y - 6, K_WIN - 0.06],
      [D, CAM_WIN.x, CAM_WIN.y, K_WIN],
    ];
    const fx = monotone(keys.map((k) => [k[0], k[1]]));
    const fy = monotone(keys.map((k) => [k[0], k[2]]));
    const fk = monotone(keys.map((k) => [k[0], Math.log(k[3])]));
    const cam = (t: number) => frameOn({ x: fx(t), y: fy(t) }, { x: 640, y: 360 }, Math.exp(fk(t)));
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 40; i++) CAMS.push(cam(b.land * 0.5 + ((D - b.land * 0.5) * i) / 40));
    tl.hold(0, D);
    return { tl, b, cam, CAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const tq = tq12(t);
    const base = sc.cam(t);
    const pu = 1 - win(t, 0, b.land);
    const cam = { ...base, lens: lerp(1, 1.6, pu * pu) };
    f.camera(cam);
    f.setMood('candleAmber', { from: 'duskRose', u: win(t, 0, b.land) });
    studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'winterBlue', kind: 'strait' } });
    // round 1: more haze between the candles and the back wall while we are on the shelf (a second depth plane)
    const onShelf = 1 - win(t, b.end - 0.2, b.repin);
    if (onShelf > 0.01) f.fog({ yCenter: toScreen(LAYERS.L4, cam, CYC_X, SY - 150).y, height: 300, alpha: 0.13 * onShelf, drift: 5 });
    // the Cyc taper: live → bows on 'died' → out, a thread of smoke
    const outK = win(t, b.out - 0.05, b.out + 0.4);
    const isOut = t >= b.out + 0.4;
    // the K card: straightened and pressed home
    const uK = (tq - b.repin - 0.2) / 1.05;
    const st = boardStateAt(ID, 'start');
    const board = { ...st, kTilt: lerp(st.kTilt, 0, sm((uK - 0.28) / 0.17)) };
    // the hand comes in from frame right, above the card, on a short forearm: the title stays readable
    const ps = toScreen(LAYERS.L4, cam, K_PIN.x, K_PIN.y);
    const entry = { R: toLayer(LAYERS.L4, cam, 1280 + 420, ps.y - Math.tan(0.24) * (1700 - ps.x)), L: toLayer(LAYERS.L4, cam, 1700, 900) };
    const hp = uK > 0 && uK < 1 ? hands.act('pin', uK, { x: K_PIN.x, y: K_PIN.y }, { entry, scale: 0.72, held: 'none' }) : null;
    studyCase(f, {
      shot: ID,
      when: 'start',
      key: ID,
      board: { state: board },
      // round 2 (legibility): the shelf's older lettering (a 'years' on a 1960s candle) and the Wall of Forecasts are
      // the study's texture, not this line's subject: both are drawn here inside textRole 'texture' (neither overlaps
      // the board, so the stacking is unchanged). The subject is the Cyc tag and its naming card.
      shelf: false,
      wall: false,
      flames: false,
      xray: t < b.end ? false : { light: 0.08 },
      extra: (c, env) => {
        textRole(c, 'texture', () => {
          wallOfForecasts(c, { ...STUDY.wall, slips: wallStateAt(ID, 'start'), light: 1 }, env);
          candleShelf(c, SHELF_DRAW, env);
        });
        // the naming (rule + verdict): the neighbours dim around the Cyc taper as it goes out, and again while it is
        // named; the camera's push does the rest
        focusVeil(c, env, 0.9 * win(t, b.out - 0.1, b.out + 0.9) * (1 - win(t, b.sleeve + 0.6, b.longest - 0.5)));
        // 'the longest candle on our shelf': every sleeve brightens to its ghost-paper value for ~1.5 s (the bars of the
        // chart), the 39-ring Cyc sleeve reaching far below all of them
        sleeveChart(c, env, chartK(t, b));
        cycTaper(c, env, t, b, outK, isOut);
        sleeveRim(c, env, t, b);
        cycChart(c, env, chartK(t, b));
        longestGuide(c, env, t, b);
        cycTag(c, env, t, b);
        thread(c, env, t, b, cam);
        if (hp) {
          c.save();
          c.filter = `blur(${(1.0 * env.pxScale).toFixed(2)}px)`;
          hands.draw(c, hp, env);
          c.restore();
        }
      },
    });
    // practicals: the live candles (the Cyc flame bowing out), the lamp
    for (const v of V0) {
      if (v.state !== 'live' || v.id === 'cyc') continue;
      const p = candleFlame({ x: candleX(V0, v.id), y: SY, view: v, s: STUDY.shelf.s });
      f.practical({ x: p.x, y: p.y - 4, kind: 'candle', seed: 300 + v.slot * 7, intensity: 0.85, radius: 36 });
    }
    if (outK < 0.99) f.practical({ x: CYC_FLAME.x + 5 * outK, y: CYC_FLAME.y - 4 + 6 * outK, kind: 'candle', seed: 1984, intensity: 0.9 * (1 - outK), radius: 30 * (1 - 0.6 * outK) });
    // the reflections in the glass (lamp first, then the right end of the shelf)
    glass(f, t, b);
    // the near plane: on the shelf, its soft front lip; at the window, the desk corner with the green-shaded banker's
    // lamp and its pool, Hinton's taken-down slip lying flat under it (the echo of ch13-s01), and the chair's wing
    shelfLip(f, cam, sc.cam(b.out + 2.1), onShelf);
    windowNear(f, t, b);
    bloom(f, 0.85 * (1 - win(t, 0, 0.45)));
  },
});

/** the thin Cyc taper, drawn here at 70% of a candle's width so it reads beside the others: a dark, ring-scored
 *  39-ring ghost sleeve from the lit height down to a 6-ring stub; the flame bows out on 'died', a thread of smoke */
function cycTaper(c: C, env: PaintEnv, t: number, b: B, outK: number, isOut: boolean) {
  const m = env.mood;
  const x0 = CYC_X - CYC_W / 2, x1 = CYC_X + CYC_W / 2;
  const top = SLEEVE.top, join = SLEEVE.bot;
  // the sleeve: dark paper, ring-scored, its edges and top lip in rim
  c.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.22);
  c.fillRect(x0, top, CYC_W, join - top);
  c.strokeStyle = withAlpha(m.rim, 0.3);
  c.lineWidth = 0.9;
  c.beginPath();
  for (let i = 1; i < 45; i++) {
    const yy = SY - i * RING;
    if (yy <= top + 0.5 || yy >= join - 0.5) continue;
    const major = i % 5 === 0;
    c.moveTo(x0 + (major ? 1 : 4), yy);
    c.lineTo(x1 - (major ? 1 : 4), yy);
  }
  c.stroke();
  c.strokeStyle = withAlpha(m.rim, 0.42);
  c.lineWidth = 1.1;
  c.strokeRect(x0, top, CYC_W, join - top);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(x0 - 1, top - 1.2, CYC_W + 2, 1.8);
  // the lettering, faint on the sleeve
  c.save();
  c.translate(CYC_X, join - 14);
  c.rotate(-Math.PI / 2);
  c.font = `400 9px ${FONT.phosphor}`;
  c.textBaseline = 'middle';
  c.fillStyle = withAlpha(m.rim, 0.42);
  c.fillText('CYC', 0, 0.5);
  c.restore();
  // the 6-ring stub: ink, scored, warm at its lip while it burns
  c.fillStyle = env.fill('ink');
  c.fillRect(x0, join, CYC_W, SY - join);
  c.strokeStyle = withAlpha(m.rim, 0.22);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let i = 1; i < 6; i++) {
    c.moveTo(x0 + 3, SY - i * RING);
    c.lineTo(x1 - 3, SY - i * RING);
  }
  c.stroke();
  const live = 1 - outK;
  if (live > 0.01) {
    const g = c.createLinearGradient(0, join, 0, join + 26);
    g.addColorStop(0, withAlpha(m.core, 0.45 * live));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(x0, join, CYC_W, 26);
  }
  // the wick, and once out a thread of smoke
  c.fillStyle = env.fill('ink');
  c.fillRect(CYC_X - 0.8, join - 5, 1.6, 6);
  if (isOut || outK > 0.6) {
    const sm2 = win(t, b.out + 0.2, b.out + 0.8) * (1 - 0.6 * win(t, b.end, b.end + 2));
    c.strokeStyle = withAlpha(mixLab(m.haze, m.rim, 0.3), 0.36 * sm2);
    c.lineWidth = 1.3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(CYC_X, join - 5);
    for (let i = 1; i <= 24; i++) {
      const u = i / 24;
      c.lineTo(CYC_X + Math.sin(u * 7 - t * 1.3 + 3) * (2 + 14 * u) + Math.sin(u * 3.1 - t * 0.6 + 6) * 6 * u, join - 5 - u * 160);
    }
    c.stroke();
  }
}

/** on 'thirty-nine' a rim of light runs UP the whole dark sleeve (stub to lit height) in 0.8 s, then stays faintly */
function sleeveRim(c: C, env: PaintEnv, t: number, b: B) {
  const t0 = b.sleeve - 0.05;
  const u = clamp01((t - t0) / 0.8);
  if (t < t0) return;
  const x0 = CYC_X - CYC_W / 2, x1 = CYC_X + CYC_W / 2;
  const head = lerp(SLEEVE.bot, SLEEVE.top, sm(u));
  const after = 1 - 0.55 * win(t, t0 + 0.9, t0 + 1.8);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const col = mixLab(env.mood.core, env.mood.rim, 0.35);
  c.strokeStyle = withAlpha(col, 0.85 * after);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(x0, SLEEVE.bot);
  c.lineTo(x0, head);
  c.moveTo(x1, SLEEVE.bot);
  c.lineTo(x1, head);
  if (u >= 1) {
    c.moveTo(x0 - 1, SLEEVE.top - 0.5);
    c.lineTo(x1 + 1, SLEEVE.top - 0.5);
  }
  c.stroke();
  // the travelling head
  if (u < 1) {
    const g = c.createRadialGradient(CYC_X, head, 0, CYC_X, head, 30);
    g.addColorStop(0, withAlpha(col, 0.7));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(CYC_X - 30, head - 30, 60, 60);
  }
  // a faint wash over the whole sleeve once lit: the bar of the chart
  c.fillStyle = withAlpha(col, 0.1 * after * sm(u));
  c.fillRect(x0, head, CYC_W, SLEEVE.bot - head);
  c.restore();
}

/** on 'longest candle on our shelf': a faint ruled guide where the Cyc sleeve ends, across its neighbours: every other
 *  sleeve stops above it (the sleeves are the bars of the chart) */
function longestGuide(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.longest - 0.1, b.longest + 0.3) * (1 - win(t, b.longest + 1.25, b.longest + 1.6));
  if (a <= 0.01) return;
  const y = SLEEVE.bot;
  c.save();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.6 * a);
  c.lineWidth = 1;
  c.setLineDash([5, 5]);
  c.beginPath();
  c.moveTo(CYC_X - 230, y);
  c.lineTo(WORRY_X + 30, y);
  c.stroke();
  c.restore();
}

/** the Cyc taper's tag, hung on a string from the taper's base over the shelf's lip: CYC · 1984–2023 · 39 */
function cycTag(c: C, env: PaintEnv, t: number, b: B) {
  // up as the shelf lands, held through 'longest' (round 3: it carries the words; no separate naming card)
  const a = win(t, b.cyc - 0.2, b.cyc + 0.4) * (1 - win(t, b.end - 0.6, b.end - 0.2));
  if (a <= 0.01) return;
  const m = env.mood;
  const text = 'CYC · 1984–2023 · 39';
  // round 1: 1.5x (about 27 px cap height at 1080p under the shelf camera, 33 px in the push-in)
  const size = 21;
  c.save();
  c.globalAlpha *= a;
  c.font = `500 ${size}px ${FONT.mono}`;
  const w = c.measureText(text).width + 12;
  const h = size + 9;
  const tie = { x: CYC_X + CYC_W / 2 - 2, y: SY - 3 };
  const sw = 0.03 * Math.sin(tq12(t) * 1.1);
  // the string from the base, over the shelf edge, to the tag's eyelet
  const eye = { x: tie.x + 4, y: SY + 22 };
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(tie.x, tie.y);
  c.quadraticCurveTo(tie.x + 5, SY + 2, eye.x, eye.y);
  c.stroke();
  c.translate(eye.x, eye.y);
  c.rotate(0.06 + sw);
  const paper = mixLab(m.setHaze, m.halo, 0.6);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(2, 2, w, h);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(-4, h / 2);
  c.lineTo(2, 0);
  c.lineTo(w, 0);
  c.lineTo(w, h);
  c.lineTo(2, h);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(m.ink, paper, 0.12);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(text, 6, h / 2 + size * 0.35);
  c.restore();
}

/** the Cyc sleeve in the chart: the palest, longest bar (39 rings), its ring scores showing through */
function cycChart(c: C, env: PaintEnv, k: number) {
  if (k <= 0.003) return;
  const m = env.mood;
  const paper = mixLab(mixLab(m.haze, m.halo, 0.6), '#efe4cc', 0.4);
  const x0 = CYC_X - CYC_W / 2;
  c.save();
  c.fillStyle = withAlpha(paper, 0.62 * k);
  c.fillRect(x0, SLEEVE.top, CYC_W, SLEEVE.bot - SLEEVE.top);
  c.strokeStyle = withAlpha(mixLab(m.ink, m.set, 0.4), 0.35 * k);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let i = 7; i < 45; i++) {
    const yy = SY - i * RING;
    if (i % 5 !== 0) continue;
    c.moveTo(x0 + 1, yy);
    c.lineTo(x0 + CYC_W - 1, yy);
  }
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.45), 0.9 * k);
  c.lineWidth = 1.4;
  c.strokeRect(x0 - 0.5, SLEEVE.top - 0.5, CYC_W + 1, SLEEVE.bot - SLEEVE.top + 1);
  c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.5), 0.95 * k);
  c.fillRect(x0 - 2, SLEEVE.bot - 1.2, CYC_W + 4, 2.4);
  c.restore();
}

/** the sleeve chart's strength: up on 'longest', held ~1.5 s, settled back before the tilt */
function chartK(t: number, b: B): number {
  return win(t, b.longest - 0.15, b.longest + 0.2) * (1 - win(t, b.longest + 1.25, b.longest + 1.6));
}
/** every burned sleeve on the shelf lifted to its ghost-paper value (a pale ring-scored bar from the lit height down to
 *  its stub); the Cyc sleeve (drawn by cycTaper) is lifted brightest by sleeveRim's wash */
function sleeveChart(c: C, env: PaintEnv, k: number) {
  if (k <= 0.003) return;
  const m = env.mood;
  const paper = mixLab(mixLab(m.haze, m.halo, 0.55), '#efe4cc', 0.25);
  const top = SY - LIT_HEIGHT;
  c.save();
  for (const v of V0) {
    if (v.id === 'cyc' || v.kind !== 'candle' || v.state === 'unlit') continue;
    const r = Math.min(v.years ?? 45, v.rings);
    if (r <= 0) continue;
    const x = candleX(V0, v.id), w = 30;
    const bot = top + r * RING_PX;
    c.fillStyle = withAlpha(paper, 0.42 * k);
    c.fillRect(x - w / 2, top, w, bot - top);
    c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.6 * k);
    c.lineWidth = 1;
    c.strokeRect(x - w / 2 + 0.5, top + 0.5, w - 1, bot - top - 1);
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.4), 0.8 * k);
    c.fillRect(x - w / 2 - 1, bot - 1, w + 2, 2);
  }
  c.restore();
}
/** the neighbours dim around the Cyc taper (a dark radial veil over the shelf, clear at the taper) */
function focusVeil(c: C, env: PaintEnv, k: number) {
  if (k <= 0.003) return;
  // clear air around the taper (its whole 270 px height and its tag), dark beyond: a soft-edged vertical slot over
  // the shelf (the finish pass lifts the blacks, so the far side runs to ~85% to read as a real dim)
  const cx = CYC_X + 16;
  const dark = mixLab(env.mood.fg, '#000000', 0.6);
  const R = 360;
  const g = c.createLinearGradient(cx - R, 0, cx + R, 0);
  g.addColorStop(0, withAlpha(dark, 0.85 * k));
  g.addColorStop(0.3, withAlpha(dark, 0.62 * k));
  g.addColorStop(0.43, withAlpha(dark, 0));
  g.addColorStop(0.57, withAlpha(dark, 0));
  // the right side stays lighter: the live worry candle on the right third keeps its warm light
  g.addColorStop(0.7, withAlpha(dark, 0.4 * k));
  g.addColorStop(1, withAlpha(dark, 0.3 * k));
  c.save();
  c.fillStyle = g;
  c.fillRect(cx - 1600, SY - 452, 3200, 482);
  c.restore();
}

/** the new oxblood thread, drawn from the shears card off the board's right edge, across the wall, and tied at the
 *  window's jamb (on the wall's own plane, so it really reaches the window whatever the camera does); its last run
 *  catches the window light */
function thread(c: C, env: PaintEnv, t: number, b: B, cam: Camera3) {
  const u = sm((tq12(t) - b.thread) / 1.6);
  if (u <= 0.002) return;
  const js = toScreen(STUDY_WALL, cam, JAMB.x, JAMB.y);
  const end = toLayer(LAYERS.L4, cam, js.x, js.y);
  const n = 64;
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) {
    const q = i / n;
    pts.push({ x: lerp(THREAD0.x, end.x, q), y: lerp(THREAD0.y, end.y, q) + Math.sin(q * Math.PI) * 86 });
  }
  const m = Math.max(1, Math.floor(n * u));
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = oxblood(env, 0.18);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i <= m; i++) c.lineTo(pts[i].x, pts[i].y);
  c.stroke();
  // its catch-light: faint along the wall, warming as it nears the window
  for (let i = 1; i <= m; i++) {
    const q = i / n;
    const k = 0.18 + 0.7 * sm((q - 0.6) / 0.4) * win(t, b.water - 0.4, b.water + 0.8);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#c9d6dc', 0.35 * sm((q - 0.6) / 0.4)), k);
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(pts[i - 1].x, pts[i - 1].y - 0.8);
    c.lineTo(pts[i].x, pts[i].y - 0.8);
    c.stroke();
  }
  // the knot at the card; at the jamb, a small tack once it arrives
  c.fillStyle = oxblood(env, 0.1);
  c.beginPath();
  c.arc(pts[0].x, pts[0].y, 3.2, 0, Math.PI * 2);
  c.fill();
  if (u > 0.98) {
    c.beginPath();
    c.arc(end.x, end.y, 2.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha('#d8e2e6', 0.6);
    c.beginPath();
    c.arc(end.x - 0.8, end.y - 0.8, 1, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** the night beyond the glass (study-wall coords, clipped to the window): dark sky, dark water, and two low far
 *  headlands, left and right, each with a few small lit windows of EQUAL warmth, open water between them */
const HZ = 548;
function strait(c: C, t: number, b: B) {
  const a = 0.35 + 0.65 * win(t, b.water - 0.6, b.water + 0.8);
  const W = MOODS.winterBlue;
  const sky = c.createLinearGradient(0, WIN.y, 0, HZ);
  sky.addColorStop(0, mixLab(W.fg, W.set, 0.3));
  sky.addColorStop(1, mixLab(W.set, W.haze, 0.35));
  c.fillStyle = sky;
  c.fillRect(WIN.x, WIN.y, WIN.w, HZ - WIN.y);
  const sea = c.createLinearGradient(0, HZ, 0, WIN.y + WIN.h);
  sea.addColorStop(0, mixLab(W.set, W.haze, 0.15));
  sea.addColorStop(0.35, mixLab(W.set, W.fg, 0.45));
  sea.addColorStop(1, mixLab(W.fg, '#000000', 0.35));
  c.fillStyle = sea;
  c.fillRect(WIN.x, HZ, WIN.w, WIN.y + WIN.h - HZ);
  const land = mixLab(W.fg, W.set, 0.3);
  const warm = MOODS.candleAmber.core;
  const headland = (side: -1 | 1) => {
    // from the window edge (high) sloping down to the strait (low); ends ~38% of the way across
    const xEdge = side < 0 ? WIN.x - 4 : WIN.x + WIN.w + 4;
    const xTip = side < 0 ? WIN.x + WIN.w * 0.38 : WIN.x + WIN.w * 0.62;
    c.fillStyle = land;
    c.beginPath();
    c.moveTo(xEdge, HZ + 4);
    for (let i = 0; i <= 30; i++) {
      const q = i / 30;
      const hgt = 4 + 34 * Math.pow(1 - q, 1.6) + 2.2 * Math.sin(q * 11 + (side < 0 ? 1 : 4));
      c.lineTo(lerp(xEdge, xTip, q), HZ - hgt);
    }
    c.lineTo(xTip + side * -2, HZ + 4);
    c.closePath();
    c.fill();
    // five small lit windows, the same warmth on both shores
    const spots = [[0.12, 22], [0.24, 16], [0.36, 21], [0.52, 9], [0.66, 6]];
    for (const [q, dy] of spots) {
      const x = lerp(xEdge, xTip, q);
      const y = HZ - dy;
      const g = c.createRadialGradient(x, y, 0, x, y, 7);
      g.addColorStop(0, withAlpha(warm, 0.6 * a));
      g.addColorStop(1, withAlpha(warm, 0));
      c.fillStyle = g;
      c.fillRect(x - 7, y - 7, 14, 14);
      c.fillStyle = withAlpha(warm, 0.95 * a);
      c.fillRect(x - 1.2, y - 1.6, 2.4, 3.2);
      // its trembling streak on the water
      c.fillStyle = withAlpha(warm, 0.18 * a);
      c.fillRect(x - 0.8, HZ + 5, 1.6, 10 + 6 * (q * 7 % 1));
    }
  };
  headland(-1);
  headland(1);
  c.fillStyle = withAlpha(W.haze, 0.12 * a);
  for (let i = 0; i < 12; i++) c.fillRect(WIN.x, HZ + 8 + i * i * 3, WIN.w, 0.8);
}

/** the right end of the candle shelf as it shows in the glass: six candles (mirrored, as a reflection is), baked once
 *  into an offscreen sheet; drawn in thin horizontal bands, each shifted a little, so it ripples like old glass over
 *  water. Flames are added live. */
const REFL_IDS = ['worry', 'scale', 'go', 'learned', 'warmup'];
/** round 1: big enough to read as the shelf (plank + five candles, the worry candle included), mirrored */
const REFL = { s: 0.66, pitch: 56, w: 300, h: 210, base: 196, res: 3 };
let reflSheet: { key: string; canvas: HTMLCanvasElement | OffscreenCanvas } | null = null;
function reflectionSheet(env: PaintEnv) {
  const key = env.mood.id;
  if (reflSheet && reflSheet.key === key) return reflSheet.canvas;
  const W = REFL.w * REFL.res, H = REFL.h * REFL.res;
  const cv: HTMLCanvasElement | OffscreenCanvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
  const cc = cv.getContext('2d') as CanvasRenderingContext2D;
  cc.scale(REFL.res, REFL.res);
  const m = env.mood;
  const pale = mixLab(m.set, m.haze, 0.45);
  const genv: PaintEnv = { ...env, t: 0, fill: (r) => (r === 'ink' ? pale : env.fill(r)) };
  // mirrored, as a reflection is: the worry candle (the shelf's right end) lands at the left of the glass
  cc.translate(REFL.w, 0);
  cc.scale(-1, 1);
  cc.fillStyle = pale;
  cc.fillRect(0, REFL.base, REFL.w, 7);
  cc.fillRect(0, REFL.base + 7, REFL.w, 3);
  REFL_IDS.forEach((id, i) => {
    const v = { ...view(V1, id), tag: '', smoke: false };
    beliefCandle(cc, { x: REFL.w - 36 - i * REFL.pitch, y: REFL.base, view: v, s: REFL.s, letters: 0, drawFlame: false, smoke: 0 }, genv);
  });
  reflSheet = { key, canvas: cv };
  return cv;
}
function reflection(c: C, env: PaintEnv, t: number, a: number) {
  const sheet = reflectionSheet(env);
  // the plank lies across the water below the far shores; the flames sit just under the horizon like lights on it
  const x0 = WIN.x, y0 = HZ + 200 - REFL.base;
  const band = 3;
  c.save();
  c.globalAlpha *= 0.2 * a;
  for (let y = 0; y < REFL.h; y += band) {
    const dx = 0.7 * Math.sin(y * 0.045 + t * 1.2) + 0.5 * vnoise2(y * 0.05, t * 0.8);
    c.drawImage(sheet as CanvasImageSource, 0, y * REFL.res, REFL.w * REFL.res, band * REFL.res, x0 + dx, y0 + y, REFL.w, band);
  }
  c.restore();
  // the flames: live, rippled with the glass
  c.save();
  c.globalCompositeOperation = 'lighter';
  const m = env.mood;
  REFL_IDS.forEach((id, i) => {
    const v = view(V1, id);
    if (v.state !== 'live') return;
    const fl = candleFlame({ x: 36 + i * REFL.pitch, y: REFL.base, view: v, s: REFL.s });
    const fx = x0 + fl.x + 0.7 * Math.sin((fl.y - 3) * 0.045 + t * 1.2), fy = y0 + fl.y - 3;
    const tr = 1 + 0.08 * vnoise2(t * 3 + i, i * 2.2);
    // round 3: unmistakably FLAMES floating over the water (ch14's candle device): a warm halo, a teardrop flame
    // with a bright core (~0.6), and a long broken shimmer below
    const g = c.createRadialGradient(fx, fy, 0, fx, fy, 24 * tr);
    g.addColorStop(0, withAlpha(m.core, 0.7 * a));
    g.addColorStop(0.3, withAlpha(m.halo, 0.32 * a));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(fx - 26, fy - 26, 52, 52);
    const fh = 9 * tr, fw = 3.2;
    c.fillStyle = withAlpha(mixLab(m.core, '#fff4d8', 0.4), 0.62 * a);
    c.beginPath();
    c.moveTo(fx, fy - fh);
    c.quadraticCurveTo(fx + fw * 1.4, fy - fh * 0.2, fx, fy + fw);
    c.quadraticCurveTo(fx - fw * 1.4, fy - fh * 0.2, fx, fy - fh);
    c.fill();
    for (let k = 0; k < 5; k++) {
      const yy = fy + 10 + k * 8;
      const ww = 4.5 - k * 0.6;
      c.fillStyle = withAlpha(m.core, (0.26 - k * 0.04) * a);
      c.fillRect(fx - ww / 2 + 1.1 * vnoise2(t * 4 + k, i * 1.7), yy, ww, 1.6);
    }
  });
  c.restore();
}

/** reflections in the window glass (on the study wall's plane, clipped to the window): the lamp alone first, then the
 *  right end of the candle shelf, flames and all, laid over the dark water */
function glass(f: Frame, t: number, b: B) {
  const aL = win(t, b.reflect - 0.2, b.reflect + 0.6);
  const aS = win(t, b.shelf - 0.2, b.shelf + 0.9);
  f.layer(STUDY_WALL, (c, env) => {
    c.save();
    c.beginPath();
    c.rect(WIN.x, WIN.y, WIN.w, WIN.h);
    c.clip();
    strait(c, t, b);
    const m = env.mood;
    // the lamp's reflection, alone: round 3: in the MIDDLE pane, on the water, twice as strong, with a 1-2 px
    // horizontal tremble (the old glass is uneven): a green-shaded glow over a small warm core and its streak
    if (aL > 0.003) {
      const jx = 1.6 * vnoise2(t * 7.3, 1.7), jy = 0.8 * vnoise2(t * 3.9, 4.1);
      const lx = WIN.x + WIN.w * 0.5 + jx, ly = HZ + 92 + jy;
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(lx, ly, 0, lx, ly, 50);
      g.addColorStop(0, withAlpha(mixLab(m.core, '#b8d8a0', 0.25), 0.95 * aL));
      g.addColorStop(0.18, withAlpha(mixLab(m.core, '#9cc890', 0.4), 0.6 * aL));
      g.addColorStop(0.5, withAlpha(mixLab(m.halo, '#6aa874', 0.35), 0.25 * aL));
      g.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = g;
      c.fillRect(lx - 54, ly - 54, 108, 108);
      // the shade's lit lip, a small bright bar, and its broken streak down the water
      c.fillStyle = withAlpha(mixLab('#9cc890', m.core, 0.3), 0.8 * aL);
      c.fillRect(lx - 11, ly - 2, 22, 3);
      for (let i = 0; i < 6; i++) {
        const yy = ly + 12 + i * 9;
        const ww = 12 - i * 1.5 + 2 * vnoise2(t * 2 + i, i * 3.1);
        c.fillStyle = withAlpha(mixLab(m.core, '#9cc890', 0.3), (0.32 - i * 0.04) * aL);
        c.fillRect(lx - ww / 2 + 1.2 * vnoise2(t * 5 + i, 9.3), yy, ww, 1.6);
      }
      c.globalCompositeOperation = 'source-over';
    }
    if (aS > 0.003) reflection(c, env, t, aS);
    // the glazing bars, in front of everything seen in (or on) the glass
    c.globalAlpha = 1;
    c.fillStyle = env.fill('ink');
    for (let i = 1; i < 3; i++) c.fillRect(WIN.x + (WIN.w * i) / 3 - 4.5, WIN.y, 9, WIN.h);
    for (let j = 1; j < 6; j++) c.fillRect(WIN.x, WIN.y + (WIN.h * j) / 6 - 4.5, WIN.w, 9);
    c.restore();
  });
}

/** the shelf's soft front lip on L5 (laid out at `ref`, 40% of its true parallax), while we are on the shelf */
function shelfLip(f: Frame, cam: Camera3, ref: Camera3, k: number) {
  if (k <= 0.01) return;
  const L5 = LAYERS.L5;
  const at = (sx: number, sy: number) => {
    const a = toLayer(L5, ref, sx, sy);
    const n = toScreen(L5, cam, a.x, a.y);
    const cl = (v: number) => Math.max(-60, Math.min(60, v));
    return toLayer(L5, cam, sx + cl(0.4 * (n.x - sx)), sy + cl(0.4 * (n.y - sy)));
  };
  const lip = at(640, 676);
  const l0 = toLayer(L5, cam, -300, 0).x, l1 = toLayer(L5, cam, 1580, 0).x, lb = toLayer(L5, cam, 0, 900).y;
  const one = toLayer(L5, cam, 1, 0).x - toLayer(L5, cam, 0, 0).x;
  f.layer('L5', (c, env) => {
    const m = env.mood;
    c.save();
    c.globalAlpha *= k;
    c.filter = `blur(${(4 * env.pxScale).toFixed(1)}px)`;
    const lg = c.createLinearGradient(0, lip.y, 0, lip.y + 44 * one);
    lg.addColorStop(0, mixLab(m.fg, m.halo, 0.3));
    lg.addColorStop(0.2, mixLab(m.fg, m.set, 0.32));
    lg.addColorStop(1, m.fg);
    c.fillStyle = lg;
    c.fillRect(l0, lip.y, l1 - l0, lb - lip.y);
    c.restore();
  });
}

/** at the window, the near plane (L5, true parallax, laid out at the final window camera): the desk's corner across
 *  the lower right, the green-shaded banker's lamp on it with its warm pool, Hinton's darkened 30-to-50-years slip
 *  lying flat in the pool (the echo of ch13-s01), and the curtain's edge at frame left. All soft. */
function windowNear(f: Frame, t: number, b: B) {
  // it arrives with the window: faded in as the pan settles, with 40% of its true parallax (never a black wall
  // sweeping across the glass)
  const A = win(t, b.water - 0.1, b.water + 0.8);
  if (A <= 0.01) return;
  const L5 = LAYERS.L5;
  const cam = f.cam;
  const at = (sx: number, sy: number) => {
    const a = toLayer(L5, CAM_WIN, sx, sy);
    const n = toScreen(L5, cam, a.x, a.y);
    const cl = (v: number) => Math.max(-80, Math.min(80, v));
    return toLayer(L5, cam, sx + cl(0.4 * (n.x - sx)), sy + cl(0.4 * (n.y - sy)));
  };
  const one = toLayer(L5, cam, 1, 0).x - toLayer(L5, cam, 0, 0).x;
  const desk = at(700, 628);
  const lamp = at(1010, 630);
  const slip = at(842, 650);
  const cur = at(118, 0);
  f.layer('L5', (c, env) => {
    const m = env.mood;
    c.save();
    c.globalAlpha *= A;
    c.filter = `blur(${(3.5 * env.pxScale).toFixed(1)}px)`;
    // the curtain's edge at frame left: velvet folds, its inner edge catching the window light
    const cg = c.createLinearGradient(cur.x, 0, cur.x - 200 * one, 0);
    cg.addColorStop(0, mixLab(m.fg, m.set, 0.3));
    cg.addColorStop(0.1, m.fg);
    cg.addColorStop(0.4, mixLab(m.fg, m.set, 0.2));
    cg.addColorStop(1, m.fg);
    c.fillStyle = cg;
    c.beginPath();
    c.moveTo(cur.x, at(0, -400).y);
    c.bezierCurveTo(cur.x + 10 * one, at(0, 200).y, cur.x - 14 * one, at(0, 500).y, cur.x + 22 * one, at(0, 1100).y);
    c.lineTo(cur.x - 900 * one, at(0, 1100).y);
    c.lineTo(cur.x - 900 * one, at(0, -400).y);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(mixLab(m.rim, '#c9d6dc', 0.3), 0.3);
    c.lineWidth = 2 * one;
    c.stroke();
    // the desk's corner: a dark slab, its top face catching the lamp
    const dTop = desk.y, dx0 = desk.x, dx1 = at(1700, 0).x, dBot = at(0, 1100).y;
    c.fillStyle = mixLab(m.fg, m.set, 0.25);
    c.fillRect(dx0, dTop, dx1 - dx0, dBot - dTop);
    const tg = c.createLinearGradient(0, dTop, 0, dTop + 26 * one);
    tg.addColorStop(0, mixLab(m.set, m.halo, 0.45));
    tg.addColorStop(1, mixLab(m.fg, m.set, 0.25));
    c.fillStyle = tg;
    c.fillRect(dx0, dTop, dx1 - dx0, 26 * one);
    c.fillStyle = withAlpha(m.rim, 0.5);
    c.fillRect(dx0, dTop - one, dx1 - dx0, 2 * one);
    c.fillRect(dx0 - one, dTop, 2 * one, dBot - dTop);
    // the lamp's warm pool on the desk top
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(lamp.x - 60 * one, dTop + 12 * one);
    c.scale(1, 0.16);
    const pg = c.createRadialGradient(0, 0, 10 * one, 0, 0, 300 * one);
    pg.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.35), 0.55));
    pg.addColorStop(0.5, withAlpha(m.halo, 0.2));
    pg.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = pg;
    c.fillRect(-300 * one, -300 * one, 600 * one, 600 * one);
    c.restore();
    // Hinton's slip, flat in the pool: darkened, curled, seen at a low angle
    c.save();
    c.translate(slip.x, slip.y);
    c.scale(1, 0.3);
    heldSlip(c, env, { x: 0, y: 0, k: 1.7 * one, rot: -0.1, light: 0.62, dark: 1, curl: 1 });
    c.restore();
    // the banker's lamp: a silhouette on the desk, its green glass shade glowing low at the lip
    const s = (190 / 42.2) * one;
    bankersLamp(c, { x: lamp.x, y: lamp.y, s, lit: true, seed: 41 }, env);
    c.globalCompositeOperation = 'lighter';
    const bl = bankersLamp.anchors({ x: lamp.x, y: lamp.y, s }).bulb;
    const sx = lamp.x, sy = bl.y - (lamp.y - bl.y) * 0.12;
    const gg = c.createRadialGradient(sx, sy, 2, sx, sy, 15 * s);
    gg.addColorStop(0, withAlpha(mixLab('#6aa874', m.core, 0.2), 0.42));
    gg.addColorStop(0.5, withAlpha('#3f7a4c', 0.16));
    gg.addColorStop(1, withAlpha('#3f7a4c', 0));
    c.fillStyle = gg;
    c.fillRect(sx - 15 * s, sy - 15 * s, 30 * s, 30 * s);
    c.restore();
  });
  // the lamp's bulb under the shade
  const bulb = bankersLamp.anchors({ x: lamp.x, y: lamp.y, s: (190 / 42.2) * one }).bulb;
  f.practical({ x: bulb.x, y: bulb.y + 6 * one, kind: 'lamp', seed: 41, intensity: 0.6 * A, radius: 70, layer: 'L5' });
}
