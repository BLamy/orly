/**
 * ch11-s01 — THE RECOVERY GRID, part one: the problem (winterBlue night; lampChange in from ch10's dusk; 13.92 s).
 *   L1101 "One last experiment. The search demo's JSON highlighter stops at the first mistake."
 *   L1102 "Its parser is a table, and valid input never reads most of it."
 *
 * The lab bench at night, 15 October 2026: the JSON highlighter's strict parser table lies on the bench like a paper
 * quilt of shallow wells, seen at a steep three-quarter angle (sets/ch11-s01-quilt): 40 x 39 cells, a winding,
 * branching path of warm copper cells (the entries valid JSON reads), each with a tiny frozen copper pin; the rest dark
 * wells in the winterBlue haze. L2 the cold window wall beyond the bench, L3 the bench's far edge (lamp, books, the
 * ledger cabinet), L4 the quilt (sharp), L5 the near bench lip (soft). A slow push down toward the grid, then a lift.
 *
 * TEACHES (anchored to the words):
 *   0.4  date      the date stamp types in, lower left, and stays.
 *   1.77 experiment  STEP 1: a thread of light made of abstract glyph beads enters at the grid's top-left and runs the
 *                  lit path to the far edge: valid input.
 *   5.86 stops     STEP 2: a second thread, its head bead knocked crooked (the kink), runs the same path, turns into a
 *                  dark well beside it and halts with a jolt (the dry relay clack); its beads stack up behind the stall:
 *                  a strict parser gives up at the first error. It stays stalled to the end.
 *   8.91 table     STEP 3: the camera lifts so the whole table reads; the one count label sets in beside the grid
 *                  ("≈ 240" in the lit cells' copper); on "never reads most of it" a cool sheen slides over the dark
 *                  wells, the large majority, while the lit cells hold.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, defineShot, legibleSize, mixLab, placeStamp, softPlate, textProbe, textRole, toScreen, withAlpha } from '../../../film';
import {
  ROUTE_KINK, ROUTE_VALID, WELL, cellPx, drawBeadThread, drawPins, drawQuilt, gp, litCol, quiltNear, quiltRoom,
} from '../sets/ch11-s01-quilt';

const ID = 'ch11-s01';
type C2 = CanvasRenderingContext2D;
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const CAM0: Camera3 = { x: 652, y: 372, z: 0, lens: 1 };
const CAM_IN: Camera3 = { x: 640, y: 452, z: 170, lens: 1 };
const CAM_LIFT: Camera3 = { x: 650, y: 414, z: 56, lens: 1 };
const lerpCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: lerp(a.lens, b.lens, u) });

interface Beats {
  D: number;
  date: number;
  valid: number;
  stall: number;
  counts: number;
  never: number;
  end: number;
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      date: T.beat('date'),
      valid: T.beat('valid'),
      stall: T.beat('stall'),
      counts: T.beat('counts'),
      never: T.word('L1102', 'never'),
      end: T.line('L1102').end,
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    // a slow push down toward the grid, then on 'table' a lift so the whole table reads
    const cam = t < b.counts - 0.3 ? lerpCam(CAM0, CAM_IN, smr(t / (b.counts - 0.3))) : lerpCam(CAM_IN, CAM_LIFT, smr((t - (b.counts - 0.3)) / 3.6));
    f.camera(cam);
    quiltRoom(f, ID);

    // ---- the threads
    // valid: in at the top-left on 'experiment', along every lit cell of the route, out at the far edge (constant speed)
    const v0 = b.valid - 0.12, v1 = b.valid + 3.1;
    const validHead = lerp(-2.4, ROUTE_VALID.len + 4.5, (t - v0) / (v1 - v0));
    const validA = t < v0 ? 0 : 1 - seg(t, v1 - 0.4, v1);
    // kinked: enters while the valid thread is finishing, runs the same route, turns into the well and halts on 'stops'
    const k0 = b.stall - 2.15;
    const kv = (ROUTE_KINK.len + 2.4) / (b.stall - k0);
    const kRaw = -2.4 + (t - k0) * kv;
    // the last cell eases in (the parser reaching for an entry that is not there)
    const into = ROUTE_KINK.len - 1;
    const kinkHead = kRaw < into ? kRaw : into + (1 - Math.pow(1 - clamp01((kRaw - into) / 1.6), 2)) * 1;
    const stack = sm((tq - b.stall) / 0.6);
    // the relay clack: a two-frame jolt on the stall
    const jolt = t >= b.stall && t < b.stall + 2 / 24 ? (Math.floor(t * 24) % 2 ? -1.6 : 1.6) : 0;

    f.layer('L4', (c, env) => {
      drawQuilt(f, c, env, {
        sweep: { u: seg(t, b.never - 0.3, b.never + 0.5) * (1 - seg(t, b.end + 0.4, b.end + 1.4)), x: lerp(180, 1180, seg(t, b.never - 0.3, b.end + 1.2)) },
      });
      drawPins(f, c, env);
      if (t >= v0 && validA > 0) drawBeadThread(c, env, { route: ROUTE_VALID, head: validHead, alpha: validA, seed: 11 });
      if (t >= k0) {
        drawBeadThread(c, env, { route: ROUTE_KINK, head: kinkHead, kinked: true, stack, seed: 11, jolt });
        stallMark(c, env, t, b.stall);
      }
    });
    quiltNear(f);

    // ---- type: the date stamp (lower left, from the start) and the one count label
    placeStamp(f.c, { place: '15 → 16 October 2026', date: 'a side branch of about 240 commits', style: 'mono', x: 52, y: 612, at: b.date - 0.1, fade: 0.5 }, { t, mood: f.mood, seed: 1101 });
    countLabel(f.c, f.mood, t, b, cam);
  },
});

/** the dark well where the kinked thread stalls: a dull flash on the clack, then a faint cold ring that stays */
function stallMark(c: C2, env: PaintEnv, t: number, at: number) {
  if (t < at - 0.05) return;
  const p = gp(WELL.i + 0.5, WELL.j + 0.5);
  const r = cellPx(WELL.i + 0.5, WELL.j + 0.5);
  const u = clamp01((t - at) / 0.4);
  c.save();
  // the flash (a dry snap, not a chime): pale, brief
  if (u < 1) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.6);
    g.addColorStop(0, withAlpha(env.mood.core, 0.45 * (1 - u)));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - r * 1.6, p.y - r * 1.6, r * 3.2, r * 3.2);
    c.globalCompositeOperation = 'source-over';
  }
  // the well's rim, outlined cold: the entry that was never meant to be read
  const a = gp(WELL.i + 0.08, WELL.j + 0.08), b2 = gp(WELL.i + 0.92, WELL.j + 0.08), c3 = gp(WELL.i + 0.92, WELL.j + 0.92), d = gp(WELL.i + 0.08, WELL.j + 0.92);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.75 * clamp01((t - at) / 0.15));
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(b2.x, b2.y);
  c.lineTo(c3.x, c3.y);
  c.lineTo(d.x, d.y);
  c.closePath();
  c.stroke();
  c.restore();
}

/** "≈ 240 of ≈ 1,560 entries read by valid JSON", screen-locked beside the grid's far-right corner, on a soft plate;
 *  "≈ 240" in the lit cells' copper so the label keys itself to the picture */
function countLabel(c: C2, mood: PaintEnv['mood'], t: number, b: Beats, cam: Camera3) {
  const at = b.counts + 0.1;
  const A = smr((t - at) / 0.5);
  if (A <= 0.001) return;
  // anchor: just above the far-right corner of the quilt, wherever the camera has it
  const corner = toScreen(LAYERS.L4, cam, gp(40, 0).x, gp(40, 0).y);
  const xR = Math.min(1218, corner.x + 250);
  const y = Math.max(78, corner.y - 60);
  const envLike = { mood } as PaintEnv;
  textRole(c, 'subject', () => {
    c.save();
    const base = `500 24px ${FONT.text}`;
    const size = legibleSize(c, base, 24, '≈ 240 of ≈ 1,560');
    c.font = `500 ${size}px ${FONT.text}`;
    const p1 = '≈ 240';
    const p2 = ' of ≈ 1,560 entries read by valid JSON';
    const w1 = c.measureText(p1).width, w2 = c.measureText(p2).width;
    const W = w1 + w2;
    const x0 = xR - W;
    softPlate(c, x0 + W / 2, y - size * 0.32, W + 90, size * 2.6, mixLab(mood.ink, '#000000', 0.3), 0.62 * A);
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.globalAlpha = A;
    c.fillStyle = mixLab(litCol(envLike, 0.45), '#ffffff', 0.1);
    c.fillText(p1, x0, y);
    c.fillStyle = mixLab(mood.rim, '#f3ead6', 0.55);
    c.fillText(p2, x0 + w1, y);
    textProbe(c, `${ID}-count`, x0, y - size * 0.75, W, size, A);
    c.restore();
  });
}
