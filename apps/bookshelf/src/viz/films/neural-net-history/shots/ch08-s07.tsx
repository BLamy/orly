/**
 * ch08-s07 — "a weir" (dawnGold; 16.8 s; in on a paperWipe). A parchment plate under its own plate lamp, drawn
 * in ink and cut paper: the S-curve squashes a tall wave flat, the weir lets it pass at full height, the
 * messenger's ring stays bright across the weir, and the rectifier's paper boat wins the race.
 *
 *   0 → 'squashed'  two streams on the plate. In the upper one the older S-shaped switch (tanh) inks in as a gate
 *                   with its S-curve pierced through it, a ceiling (+1) dashed downstream. A tall wave travels in
 *                   and, on "strong signals flat", leaves the gate flattened against the ceiling.
 *   'weir'          the lower stream gets its weir: a cut-paper lip at zero (the stencil shot's "below zero counts
 *                   as zero", now named as a picture); max(0, x) is plotted faintly beneath; the label sets in.
 *                   A train of signed waves arrives: everything below the lip stops dead, everything above
 *                   flows over unchanged.
 *   'undimmed'      the same tall wave runs down both streams at once: flattened at the S gate, full height over
 *                   the weir.
 *   'tug'           the backward messenger (ch05's bead) runs back up both streams: across the weir its ring of
 *                   light stays bright; across the S gate it shrinks to a glint (the squashed slope).
 *   'six'           two paper boats race; the weir's boat crosses the finish when the S boat has gone about a
 *                   sixth of the way (their four-layer test on small pictures, CIFAR-10; not AlexNet itself).
 * Camera: a slow push and drift right with the flow (z 0 → 55).
 */
import { Timeline } from '../../../core';
import type { Camera3 } from '../../../film';
import { LAYERS, MOODS, defineShot, mixLab, overscan, withAlpha } from '../../../film';
import { glow, parchmentPlate } from '../../../film/silhouette/metaphors/kit';
import { FONT } from '../../../film/silhouette/type';
import { INK, LANE, finishFlag, paperBoat, plateBead, plotGlyph, sGate, stream, wakeCurls, weirLip } from '../sets/ch08-s07-weir';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch08-s06-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s07';
const P = MOODS.parchment;
const PLATE = { x: 70, y: 58, w: 1140, h: 590 };
const V = 240; // px/s, the waves' speed
const HUMP = 2.0;

interface B {
  D: number;
  squashed: number;
  gate: number;
  e1: number; // tall hump crosses the gate (upper only)
  weir: number;
  train0: number; // ripple packet front enters
  train1: number; // ripple packet tail enters
  e2: number; // tall hump crosses gate/weir (both)
  tug: number;
  beadT0: number;
  beadGate: number; // both beads reach the gates
  beadT1: number; // the hold after the crossing ends, the beads fade
  learned: number;
  six: number;
  race0: number;
  raceWin: number;
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const squashed = T.beat('squash');
    const weir = T.beat('weir');
    const undimmed = T.beat('undimmed');
    const tug = T.beat('tug');
    const six = T.beat('six');
    const flat = T.word('L0813', 'flat');
    const b: B = {
      D,
      squashed,
      gate: squashed - 0.45,
      e1: lerp(squashed, flat, 0.55),
      weir,
      train0: weir - 1.5,
      train1: weir - 0.05,
      e2: undimmed - 0.17, // the crest crosses the lip just before the word, so 'undimmed' shows it full height downstream
      tug,
      beadT0: tug - 0.3,
      beadGate: Math.max(tug + 0.35, T.word('L0813', 'stays') + 0.1),
      beadT1: Math.max(tug + 0.35, T.word('L0813', 'stays') + 0.1) + 1.0,
      learned: T.word('L0813', 'learned'),
      six,
      race0: six,
      raceWin: six + 1.9,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const u = sm(t / b.D);
    const cam: Camera3 = { x: lerp(628, 664, u), y: lerp(356, 362, u), z: lerp(0, 55, u), lens: 1 };
    const cams: Camera3[] = [{ x: 628, y: 356, z: 0, lens: 1 }, { x: 664, y: 362, z: 55, lens: 1 }];
    f.camera(cam);
    f.backlight({ sunX: 640, sunY: 200, sunRadius: 520, intensity: 0.5 });
    // L2: the dark panelled wall behind the plate, warmed where the lamp falls
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, cams, 40);
      f.cached(`${ID}/L2/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        const wall = mixLab(env.fill('set'), env.mood.fg, 0.45);
        cc.fillStyle = wall;
        cc.fillRect(r.x, r.y, r.w, r.h);
        cc.strokeStyle = withAlpha(env.mood.rim, 0.07);
        cc.lineWidth = 1;
        for (let x = Math.floor(r.x / 160) * 160; x < r.x + r.w; x += 160) {
          cc.strokeRect(x + 14, r.y + 30, 132, 300);
          cc.strokeRect(x + 14, r.y + 350, 132, 420);
        }
        const pool = cc.createRadialGradient(640, 120, 20, 640, 220, 820);
        pool.addColorStop(0, withAlpha(env.mood.halo, 0.32));
        pool.addColorStop(1, withAlpha(env.mood.halo, 0));
        cc.fillStyle = pool;
        cc.fillRect(r.x, r.y, r.w, r.h);
      })(c, r.x, r.y);
    });
    f.fog({ yCenter: 0.62 * 720, height: 0.4 * 720, alpha: 0.12, drift: 6 });
    // L4: the plate and its diagram (the one sharp plane)
    f.layer('L4', (c, env) => {
      parchmentPlate(c, { ...PLATE, seed: 807 }, env);
      // the plate lamp's pool: warm centre, the paper's edges falling into shadow
      c.save();
      c.beginPath();
      c.rect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
      c.clip();
      const pool = c.createRadialGradient(640, 110, 40, 640, 300, 700);
      pool.addColorStop(0, withAlpha(P.halo, 0.34));
      pool.addColorStop(0.45, withAlpha(P.halo, 0.1));
      pool.addColorStop(1, withAlpha(P.halo, 0));
      c.fillStyle = pool;
      c.fillRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
      // the lamp's pool falls off toward the plate's corners (about 18% darker at the edges)
      const edge = c.createRadialGradient(640, 300, 260, 640, 330, 700);
      edge.addColorStop(0, withAlpha(env.mood.ink, 0));
      edge.addColorStop(0.45, withAlpha(env.mood.ink, 0.12));
      edge.addColorStop(0.8, withAlpha(env.mood.ink, 0.34));
      edge.addColorStop(1, withAlpha(env.mood.ink, 0.5));
      c.fillStyle = edge;
      c.fillRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
      c.restore();
      diagram(c, t, b);
    });
    f.rim({ x: 0, y: -1 });
    f.practical({ x: 640, y: 34, kind: 'lamp', seed: 807, intensity: 0.65, radius: 56, layer: 'L4' });
    // L5: the plate lamp's shade hanging into the top of frame (blurred)
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, cams, 30);
      f.cached(`${ID}/L5/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = env.fill('fg');
        // the shade hangs above the plate's top edge (its rim at y 30): the cord never crosses the parchment
        cc.fillRect(637, r.y, 6, 6 - r.y);
        cc.beginPath();
        cc.moveTo(600, 30);
        cc.quadraticCurveTo(604, 8, 626, 4);
        cc.lineTo(654, 4);
        cc.quadraticCurveTo(676, 8, 680, 30);
        cc.closePath();
        cc.fill();
        cc.fillStyle = withAlpha(env.mood.core, 0.55);
        cc.beginPath();
        cc.ellipse(640, 31, 38, 3.5, 0, 0, Math.PI * 2);
        cc.fill();
      })(c, r.x, r.y);
    });
  },
});

// ================================================================================================= DIAGRAM
/** the signed level arriving at x (upstream coordinates; downstream shows F of the same travelling value) */
function level(x: number, t: number, lane: 0 | 1, b: B): number {
  const G = LANE.gx;
  let v = 0;
  const hump = (tc: number, a: number, w: number) => {
    const xc = G + V * (t - tc);
    const d = (x - xc) / w;
    return a * Math.exp(-d * d);
  };
  if (lane === 0) v += hump(b.e1, HUMP, 46);
  v += hump(b.e2, HUMP, 46);
  // the signed wave train: a packet whose front enters at train0 and tail at train1
  const front = LANE.x0 + V * (t - b.train0);
  const tail = LANE.x0 + V * (t - b.train1);
  if (x < front && x > tail) {
    const env = sm(clamp01((front - x) / 60)) * sm(clamp01((x - tail) / 60));
    v += 0.95 * env * Math.sin((2 * Math.PI * (x - V * t)) / 168);
  }
  // the race water: a gentle positive flow (passes both gates almost unchanged) for the boats to sail on
  v += raceWater(t, b);
  // a breath of surface ripple so the water lives
  if (x < G) v += (0.035 * Math.sin(x * 0.045 - t * 3.1) + 0.02 * Math.sin(x * 0.11 + t * 2.3)) * sm(clamp01((G - x) / 80));
  return v;
}

const raceWater = (t: number, b: B) => 0.32 * win(t, b.learned - 0.7, b.learned + 0.3);

function diagram(c: C, t: number, b: B) {
  const G = LANE.gx;
  const up = LANE.up.y0;
  const lo = LANE.lo.y0;
  const drawIn = win(t, 0.05, 1.0);
  const gateA = win(t, b.gate, b.gate + 0.5) * 0.92;
  const weirRise = win(t, b.weir - 0.3, b.weir + 0.25);
  // upper: the S switch
  stream(c, up, (x) => level(x, t, 0, b), gateA > 0.5 ? (v) => Math.tanh(v) : null, { draw: drawIn, floor: 'minus1', alpha: 1 });
  sGate(c, G, up, gateA);
  // the old switch's own curve inks in beside its gate (above the ceiling, downstream)
  plotGlyph(c, 'tanh', 776, 132, 120, 92, 0.75 * win(t, b.squashed - 0.2, b.squashed + 0.5), win(t, b.squashed - 0.2, b.squashed + 0.7));
  // lower: the weir; only a 15% ghost until 'weir', so the first beat is only about the old switch
  const loA = 0.15 + 0.85 * win(t, b.weir - 0.3, b.weir + 0.45);
  stream(c, lo, (x) => level(x, t, 1, b), weirRise > 0.5 ? (v) => Math.max(0, v) : null, { draw: drawIn, floor: 'lip', alpha: loA });
  // max(0, x) plotted faintly beneath the weir's dry floor, as its kinked line
  plotGlyph(c, 'relu', 776, 546, 120, 78, 0.75 * win(t, b.weir + 0.05, b.weir + 0.6), win(t, b.weir + 0.05, b.weir + 0.8));
  // the weir, with the rectifier's kink cut through its face (the twin of the S on the old gate)
  weirLip(c, G, lo, weirRise, win(t, b.weir + 0.05, b.weir + 0.75));
  // the label: the rectifier and its measured speed-up
  const la = win(t, b.weir + 0.15, b.weir + 0.8);
  if (la > 0.01) {
    c.save();
    c.globalAlpha *= la;
    c.fillStyle = INK;
    c.textAlign = 'center';
    c.font = `italic 400 25px ${FONT.text}`;
    c.fillText('f(x) = max(0, x)   ·   ≈ 6× faster (their 4-layer test, CIFAR-10)', 640, 616);
    c.restore();
  }
  // the messengers running back up both streams: they reach the gates together just after 'tug', cross, and hold
  // for a beat (the top ring dimmed to a glint, the bottom ring still bright) before fading
  if (t > b.beadT0 && t < b.beadT1 + 0.45) {
    const x =
      t < b.beadGate
        ? lerp(LANE.x1 - 20, G, sm(clamp01((t - b.beadT0) / (b.beadGate - b.beadT0))) * 0.85 + 0.15 * clamp01((t - b.beadT0) / (b.beadGate - b.beadT0)))
        : G - 78 * sm(clamp01((t - b.beadGate) / 0.45)) - 10 * clamp01((t - b.beadGate - 0.45) / 1.0);
    const appear = win(t, b.beadT0, b.beadT0 + 0.2) * (1 - win(t, b.beadT1, b.beadT1 + 0.45));
    const crossed = sm(clamp01((G + 4 - x) / 32));
    plateBead(c, x, up - 34, 12, lerp(1, 0.08, crossed), appear);
    plateBead(c, x, lo - 34, 12, 1, appear);
  }
  // the race
  // the boats and their finish flags come in on 'learned', so the race starts on 'six' with both boats in place
  const ra = win(t, b.learned - 0.1, b.learned + 0.4);
  if (ra > 0.01) {
    const FIN = 1100;
    finishFlag(c, FIN, up - 8, ra, Math.sin(t * 5));
    finishFlag(c, FIN, lo - 8, ra, Math.sin(t * 5 + 1));
    const tq = tq12(t);
    const X0 = LANE.x0 + 30;
    const span = FIN - X0;
    // bound to the label's 6×: the S boat covers a sixth of the course in the time the weir's boat covers all of
    // it, and FREEZES when the weir's boat finishes, so the closing hold shows the ratio the label claims
    const tR = Math.min(tq, b.raceWin);
    const uW = clamp01((tq - b.race0) / (b.raceWin - b.race0)); // both boats at constant speed: the ratio holds throughout
    const uS = clamp01((tR - b.race0) / ((b.raceWin - b.race0) * 6));
    const over = Math.max(0, tq - b.raceWin);
    const xW = X0 + span * Math.max(0, uW) + 34 * (1 - Math.exp(-over * 1.6));
    const xS = X0 + span * uS;
    const rw = LANE.A * raceWater(t, b);
    const bob = (x: number) => Math.sin(x * 0.08 + tq * 4) * 1.5 - rw;
    const hop = (x: number) => -Math.exp(-(((x - G) / 26) ** 2)) * 8;
    const runS = tq > b.race0 && tq < b.raceWin ? 1 : 0;
    const runW = tq > b.race0 ? Math.exp(-over * 2) : 0;
    wakeCurls(c, xS, up + bob(xS), 1.15, ra * runS * 0.8, tq, 0.35);
    wakeCurls(c, Math.min(xW, LANE.x1 - 10), lo + bob(xW), 1.15, ra * runW, tq, 1);
    paperBoat(c, xS, up + bob(xS) + hop(xS), 1.15, ra, withAlpha(INK, 0.62), runS * Math.sin(tq * 3) * 0.04);
    paperBoat(c, Math.min(xW, LANE.x1 - 10), lo + bob(xW) + hop(xW), 1.15, ra, INK, Math.sin(tq * 3 + 1) * 0.04 * runW);
    // the ink tick on the top lane at its 1/6 mark, inking in as the weir's boat crosses the line
    const tk = win(t, b.raceWin - 0.1, b.raceWin + 0.4);
    if (tk > 0.01) {
      const x6 = X0 + span / 6;
      c.save();
      c.globalAlpha *= tk;
      c.strokeStyle = INK;
      c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(x6, up + 22);
      c.lineTo(x6, up + 22 + 34 * tk);
      c.stroke();
      // a fine bracket from the start to the tick: the distance the old switch covered
      c.lineWidth = 1.8;
      c.strokeStyle = withAlpha(INK, 0.75);
      c.beginPath();
      c.moveTo(X0, up + 46);
      c.lineTo(X0, up + 54);
      c.lineTo(x6, up + 54);
      c.moveTo(x6, up + 46);
      c.lineTo(x6, up + 54);
      c.stroke();
      c.restore();
    }
    // a quiet gold glint as the weir's boat crosses the finish
    const won = clamp01((tq - b.raceWin) / 0.6);
    if (won > 0 && won < 1) glow(c, FIN, lo - 20, 60, P.halo, 0.5 * Math.sin(Math.PI * won));
  }
}
