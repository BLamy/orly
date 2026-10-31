/**
 * ch11-s01b — THE RECOVERY GRID, part two: the fix, given room to be seen (winterBlue; cut in closer; 13.38 s).
 *   L1103 "Train only the unread entries, to keep going after a mistake, and valid JSON parses exactly as before."
 *         (a held 3.8 s breath after "keep going": the gap is the picture's)
 *
 * The same quilt (sets/ch11-s01-quilt), closer; the kinked thread still sits stalled at its dark well.
 *   1.00 Train     STEP 4: both of the narrator's hands carry a night-dark paper stencil in from the lower left, holding
 *                  it by its near-left corner and its left edge, fully in frame by 1.3 s, and lay it over the table
 *                  (the 'place' action): solid over the dark paper, cut open over every dark well, so training can reach
 *                  only the unread entries; the 240 lit cells and their pins stay painted ABOVE it at constant
 *                  brightness the whole shot (they never flicker). Backlight glows through the holes (brighter than the
 *                  paper). The training label sets in on its plate. Through the holes each dark well fills with a soft,
 *                  shimmering blend of three or four faint copper tiles (the free entry softened into a weighted mix).
 *   3.42 wave      THE HELD WAVE (through the breath after "keep going", on into the next words): a soft band of light
 *                  crosses the grid on twos; each well it reaches snaps to its single strongest tile with a one-frame
 *                  brightness tick (the detent). Then the two hands come back and carry the stencil away (~8.4 s).
 *   9.84 exactly   STEP 5: the valid thread runs again; a translucent ghost of its first run (35 %) lies exactly on the
 *                  path and the two match bead for bead: unchanged by construction.
 *  11.30           the well where the kinked thread stalled (now holding a filled tile) lifts for ~0.4 s: why it can go on.
 *  11.75 pass      the kinked thread's stack loosens; it steps onto its well and keeps going to the far edge.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, defineShot, legibleSize, mixLab, softPlate, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { drawRimmedHands } from '../sets/ch11-s01b-handrim';
import type { HandsPose, HandShapeN, Pt } from '../sets/narratorHands';
import {
  FRONT_MAX, FRONT_SLOPE, QCOLS, QROWS, ROUTE_KINK, ROUTE_RECOVER, ROUTE_VALID, WELL, cellPx, drawBeadThread, drawHoleGlow,
  drawLitCells, drawQuilt, drawStencil, frontCells, glyph, gp, makeRoute, quiltNear, quiltRoom, tileCol, tilesOf,
} from '../sets/ch11-s01-quilt';

const ID = 'ch11-s01b';
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

// cut in closer than ch11-s01's lift, framed so the stencil's near-left corner and the training label's bench margin
// (above the quilt's far edge) are both in frame; a slow push across the shot
const CAM_A: Camera3 = { x: 604, y: 414, z: 200, lens: 1 };
const CAM_B: Camera3 = { x: 640, y: 426, z: 236, lens: 1 };
const lerpCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: lerp(a.lens, b.lens, u) });

/** where the two hands hold the stencil (L4 rest px): two points on its near-left quarter, so both hands are in
 *  frame while they carry and lay it (in this closer framing its corners lie outside the frame) */
const GRIP_R = gp(9, 14);
const GRIP_L = gp(3, 26);
/** the stencil arrives from, and leaves toward, the lower left (offset, L4 px) */
const OFF = { x: -720, y: 400 };
const HAND_SCALE = 1.45;
/** the kinked thread's whole way: in, astray into the well, and (after training) on along the route */
const ROUTE_KINK_ON = makeRoute([...ROUTE_KINK.pts, ...ROUTE_RECOVER.pts.slice(1)]);

interface Beats {
  D: number;
  stencil: number;
  wave: number;
  after: number;
  same: number;
  pass: number;
  /** stencil carried in (p0 -> p1, lands), hands release (p1 -> p2) and withdraw (p2 -> p3) */
  p0: number;
  p1: number;
  p2: number;
  p3: number;
  /** hands come back (l0 -> l1), pinch (l1 -> l2), carry it away (l2 -> l3) */
  l0: number;
  l1: number;
  l2: number;
  l3: number;
  waveEnd: number;
  wellLift: number;
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const stencil = T.beat('stencil');
    const wave = T.beat('wave');
    const after = T.word('L1103', 'after');
    const pass = T.beat('pass');
    const b: Beats = {
      D: T.duration,
      stencil,
      wave,
      after,
      same: T.beat('same'),
      pass,
      // carried in from the lower left: both hands fully in frame by ~1.3 s, the stencil down half a second after "Train"
      p0: Math.max(0.02, stencil - 1.0),
      p1: stencil + 0.5,
      p2: stencil + 0.72,
      p3: stencil + 1.55,
      // the wave crosses the whole table through the breath and on into "after a mistake"
      waveEnd: after + 0.75,
      l0: after + 0.35,
      l1: after + 0.95,
      l2: after + 1.15,
      l3: after + 2.25,
      wellLift: pass - 0.45,
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = lerpCam(CAM_A, CAM_B, smr(t / b.D));
    f.camera(cam);
    quiltRoom(f, ID);

    // ---- training state
    const blend = seg(t, b.p1 + 0.05, b.wave - 0.2);
    // the wave front, on twos (cells along the diagonal)
    const front = tq < b.wave ? -1 : lerp(0, FRONT_MAX, clamp01((tq - b.wave) / (b.waveEnd - b.wave)));
    const sst = stencilState(tq, b, cam);

    // ---- threads
    // the kinked thread: stalled in its well (stacked) until 'pass', then it loosens and goes on
    const rel0 = b.pass - 0.45;
    const stack = 1 - seg(tq, rel0, b.pass);
    const kHead = tq < b.pass ? ROUTE_KINK.len : ROUTE_KINK.len + (tq - b.pass) * ((ROUTE_KINK_ON.len - ROUTE_KINK.len + 4.5) / Math.max(0.6, b.D - 0.25 - b.pass));
    const kinkedBead = tq < b.pass + 0.05;
    // the valid thread again, on 'exactly', with the ghost of its first run lying exactly on it
    const v0 = b.same - 0.4, v1 = v0 + 2.6;
    const vHead = lerp(-2.4, ROUTE_VALID.len + 4.5, (t - v0) / (v1 - v0));
    const vA = t < v0 ? 0 : 1 - seg(t, v1 - 0.35, v1);

    f.layer('L4', (c, env) => {
      drawQuilt(f, c, env, { blend, shimmer: tq, front, glow: false });
      if (front > 0) waveBand(c, env, front, t, tq, b);
      // the stencil lies over everything on the table; the backlight glows through its holes; the 240 lit cells stay
      // painted above it, steady
      if (sst.st) {
        drawStencil(f, c, env, sst.st);
        drawHoleGlow(f, c, env, sst.onTable);
      }
      drawLitCells(f, c, env);
      if (t >= v0 && vA > 0) {
        drawBeadThread(c, env, { route: ROUTE_VALID, head: vHead, alpha: vA, seed: 11, n: 18 });
        drawBeadThread(c, env, { route: ROUTE_VALID, head: vHead, alpha: vA * 0.35 * seg(t, b.same - 0.3, b.same), seed: 11, n: 18, ghost: true });
      }
      drawBeadThread(c, env, { route: ROUTE_KINK_ON, head: kHead, kinked: kinkedBead, stack, seed: 11, n: 7, alpha: 1 - seg(t, b.D - 0.5, b.D - 0.1) });
      // the stall well (its cold ring carried over from ch11-s01), then its filled tile lifting into view before the pass
      wellLift(c, env, t, b.wellLift, b.pass);
      if (sst.hands) drawRimmedHands(c, sst.hands, env);
    });
    quiltNear(f);
    nightVignette(f.c);
    trainingLabel(f.c, f.mood, t, b);
  },
});

/** the stencil's offset/lift and the two hands that carry it, as a function of t (on twos) */
function stencilState(tq: number, b: Beats, cam: Camera3): { st: { dx: number; dy: number; lift: number; alpha: number } | null; onTable: number; hands: HandsPose | null } {
  const entry = hands.entry(cam, 'L4');
  const len = 118 * HAND_SCALE;
  const pose = (off: Pt, shape: HandShapeN, rise = 0): HandsPose => ({
    // the working hand (entering further left) takes the lower grip, the support hand the far corner: the two
    // forearms run side by side out of the lower left and never cross
    right: hands.reach(entry.R, { x: GRIP_L.x + off.x, y: GRIP_L.y + off.y - rise }, shape, len, { sleeve: 'linen', bend: -0.1 }),
    left: hands.reach(entry.L, { x: GRIP_R.x + off.x, y: GRIP_R.y + off.y - rise }, shape, len, { sleeve: 'linen', bend: 0.05 }),
    scale: HAND_SCALE,
  });
  const at = (u: number): Pt => ({ x: OFF.x * u, y: OFF.y * u });
  if (tq < b.p0) return { st: null, onTable: 0, hands: null };
  if (tq < b.p1) {
    // carried in, lifted a little off the table, set down in the last quarter
    const u = smr((tq - b.p0) / (b.p1 - b.p0));
    const off = at(1 - u);
    return { st: { dx: off.x, dy: off.y, lift: 1 - seg(u, 0.72, 1), alpha: 1 }, onTable: 0, hands: pose(off, 'pinch') };
  }
  const st = { dx: 0, dy: 0, lift: 0, alpha: 1 };
  if (tq < b.p2) return { st, onTable: seg(tq, b.p1, b.p2 + 0.4), hands: pose(at(0), seg(tq, b.p1, b.p2) < 0.5 ? 'press' : 'open', 8 * seg(tq, b.p1, b.p2)) };
  if (tq < b.p3) {
    const u = sm((tq - b.p2) / (b.p3 - b.p2));
    return { st, onTable: seg(tq, b.p1, b.p2 + 0.4), hands: pose(at(0.85 * u), 'rest', 8) };
  }
  if (tq < b.l0) return { st, onTable: 1, hands: null };
  if (tq < b.l1) {
    const u = sm((tq - b.l0) / (b.l1 - b.l0));
    return { st, onTable: 1, hands: pose(at(0.85 * (1 - u)), 'open', 8 * (1 - u)) };
  }
  if (tq < b.l2) return { st, onTable: 1 - seg(tq, b.l1, b.l2), hands: pose(at(0), 'pinch') };
  if (tq < b.l3) {
    const u = smr((tq - b.l2) / (b.l3 - b.l2));
    const off = at(u);
    return { st: { dx: off.x, dy: off.y, lift: seg(u, 0, 0.25), alpha: 1 }, onTable: 0, hands: pose(off, 'pinch') };
  }
  return { st: null, onTable: 0, hands: null };
}

/** the wavefront: a soft band of light along the snapping front (no glyph-shaped highlights), and a one-frame
 *  brightness tick on each well as it snaps (the detent), on twos */
function waveBand(c: C2, env: PaintEnv, front: number, t: number, tq: number, b: Beats) {
  if (tq > b.waveEnd + 0.1) return;
  const u = 1 - seg(tq, b.waveEnd - 0.2, b.waveEnd + 0.1);
  if (u <= 0.001) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  // the band: between i = front - SLOPE*j - 3.2 and i = front - SLOPE*j + 0.4, brightest at the front edge
  const strip = (w0: number, w1: number, a: number) => {
    c.beginPath();
    const n = 13;
    for (let k = 0; k <= n; k++) {
      const j = (QROWS * k) / n;
      const p = gp(Math.max(0, Math.min(QCOLS, front - FRONT_SLOPE * j + w1)), j);
      if (k) c.lineTo(p.x, p.y);
      else c.moveTo(p.x, p.y);
    }
    for (let k = n; k >= 0; k--) {
      const j = (QROWS * k) / n;
      const p = gp(Math.max(0, Math.min(QCOLS, front - FRONT_SLOPE * j + w0)), j);
      c.lineTo(p.x, p.y);
    }
    c.closePath();
    c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.rim, 0.3), a * u);
    c.fill();
  };
  strip(-3.2, 0.4, 0.05);
  strip(-1.8, 0.3, 0.06);
  strip(-0.7, 0.2, 0.07);
  // the detent tick: the wells that snapped on this twos step, one frame bright (a flat quad, not a glyph)
  if (t - tq < 1 / 24) {
    c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.1), 0.28 * u);
    c.beginPath();
    for (const [i, j] of frontCells(front)) {
      const a = gp(i + 0.1, j + 0.1), b2 = gp(i + 0.9, j + 0.1), c3 = gp(i + 0.9, j + 0.9), d = gp(i + 0.1, j + 0.9);
      c.moveTo(a.x, a.y);
      c.lineTo(b2.x, b2.y);
      c.lineTo(c3.x, c3.y);
      c.lineTo(d.x, d.y);
      c.closePath();
    }
    c.fill();
  }
  c.restore();
}

/** the well where the kinked thread stalled, now holding its filled tile, lifts for ~0.4 s before the thread passes
 *  (so the viewer sees why it can go on), then the tile catches the light as the thread steps over it */
function wellLift(c: C2, env: PaintEnv, t: number, at: number, pass: number) {
  const p = gp(WELL.i + 0.5, WELL.j + 0.5);
  const r = cellPx(WELL.i + 0.5, WELL.j + 0.5);
  const tt = tilesOf(WELL.i, WELL.j);
  const up = Math.sin(Math.PI * clamp01((t - at) / 0.55));
  const glint = Math.sin(Math.PI * clamp01((t - (pass - 0.1)) / 0.9));
  const k = Math.max(up, glint * 0.6);
  // the cold ring from ch11-s01 stays on the stall well until its tile lifts
  const ringA = 0.8 * (1 - seg(t, at, at + 0.3));
  if (ringA > 0.01) {
    const a = gp(WELL.i + 0.08, WELL.j + 0.08), b2 = gp(WELL.i + 0.92, WELL.j + 0.08), c3 = gp(WELL.i + 0.92, WELL.j + 0.92), d = gp(WELL.i + 0.08, WELL.j + 0.92);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#dfeaf6', 0.2), ringA);
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b2.x, b2.y);
    c.lineTo(c3.x, c3.y);
    c.lineTo(d.x, d.y);
    c.closePath();
    c.stroke();
  }
  if (k <= 0.001) return;
  c.save();
  // the well itself brightens a little (light on its floor)
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.5);
  g.addColorStop(0, withAlpha(env.mood.core, 0.4 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(p.x - r * 1.5, p.y - r * 1.5, r * 3, r * 3);
  c.restore();
  // the tile rises out of its well above the stalled bead (shadow below, lifted toward us, enlarged), then settles
  const lift = r * 0.6 * up;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5 * up);
  glyph(c, tt.kinds[tt.best], p.x + lift * 0.35, p.y + lift * 0.25, r * (0.3 + 0.12 * up));
  c.fill();
  c.fillStyle = mixLab(tileCol(env), env.mood.core, 0.55 * k);
  glyph(c, tt.kinds[tt.best], p.x, p.y - lift, r * (0.27 + 0.15 * up));
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.4), 0.8 * up);
  c.lineWidth = 1.2;
  c.stroke();
}

/** the night falls off at the frame's edges and toward the far edge (no flat grey frame) */
function nightVignette(c: C2) {
  c.save();
  const g = c.createRadialGradient(620, 420, 220, 640, 400, 860);
  g.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0));
  g.addColorStop(0.6, withAlpha(PUPPET_NEAR_BLACK, 0.18));
  g.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0.55));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  c.restore();
}

/** "training: about 40,000 broken payloads, 55 kinds of mistake" (screen-locked, upper right, over the bench beyond the
 *  quilt's far edge, on a dark soft plate); gone (under 0.15) well before the last frame */
function trainingLabel(c: C2, mood: PaintEnv['mood'], t: number, b: Beats) {
  const at = b.stencil + 0.15;
  const A = smr((t - at) / 0.5) * (1 - smr((t - (b.D - 1.7)) / 0.6));
  if (A <= 0.001) return;
  textRole(c, 'subject', () => {
    c.save();
    const base = `500 24px ${FONT.text}`;
    const size = legibleSize(c, base, 24);
    const txt = 'training: about 40,000 broken payloads, 55 kinds of mistake';
    c.font = `500 ${size}px ${FONT.text}`;
    const W = c.measureText(txt).width;
    const xR = 1210, y = 66;
    softPlate(c, xR - W / 2, y - size * 0.32, W + 130, size * 3, mixLab(mood.ink, '#000000', 0.45), 0.85 * A);
    c.globalAlpha = A;
    c.textAlign = 'right';
    c.textBaseline = 'alphabetic';
    c.fillStyle = mixLab(mood.rim, '#f3ead6', 0.6);
    c.fillText(txt, xR, y);
    textProbe(c, `${ID}-train`, xR - W, y - size * 0.75, W, size, A);
    c.restore();
  });
}
