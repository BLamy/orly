/**
 * ch08-s09 — "Two towers" (serverCyan, night; 17.5 s; crossfade in from the snuffed halls of ch08-s08b).
 * The cathedral of ch08-s05/s06 (same building, sets/ch08-s05-cathedral + sets/ch08-s06-rose) splits into two
 * towers, one per graphics chip; unasked, one tower's stencils turn grey and edge-like, the other's to colour
 * blobs, run after run.
 *
 *   0 → 'chips'    the whole cathedral at night under stars, haze between it and the town's ridge. In the rose
 *                  window the mosaic of s06 (grey and colour tiles interleaved) dissolves to static during the
 *                  crossfade, finished by 'chips': the sorting the eye sees later is new.
 *   'chips'        the façade parts down the axis (the split itself was designed): one tower per card; a green
 *                  status LED wakes at each tower's base (the bedroom tower's LED of ch08-s02) and throws a faint
 *                  pool on the ground. "half the stencils on each": the left 48 panes, then the right 48, brighten.
 *   'Nobody'       light now rises inside each half on its own; the camera tilts up the façade. On 'how' a pulse in
 *                  the left half runs for the seam at conv2's level, bumps against it and dies.
 *   'divide'       light crosses ONLY on the paper's bridges (into conv3, into fc6, between fc6 and fc7, into fc8).
 *   push in        the camera eases down and in onto the window (2.4 s); the towers bracket the frame.
 *   'edges'        the left 48 resolve to grey, colourless edges and blobs; tag: largely color-agnostic.
 *   'colour-blind' the hand-set tin stencil of ch08-s04 on a soft ink plate beside the learned grey edge tile
 *                  (enlarged, the same vertical dark-to-light edge, same orientation), then gone.
 *   'colour'       the right 48 resolve to soft colour blobs; tag: largely color-specific.
 *   'Every time'   three quick replays (noise → grey left / colour right, 0.45 s each), each landing with a soft
 *                  flash and lighting one of three tally pips under the window; then the hold.
 * Tiles are ILLUSTRATIVE (procedural, shaped like the paper's Fig. 3), stamped on the window's ring.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { MOODS, defineShot, mixLab, withAlpha } from '../../../film';
import { glow, knot } from '../../../film/silhouette/metaphors/kit';
import { FONT, legibleFont, softPlate } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/silhouette/atmosphere';
import { mixCam } from '../sets/ch08-s01-kit';
import { CAT, COURSES, HALLS, CROWN, cathedral, type CathedralState } from '../sets/ch08-s05-cathedral';
import { TILE_N, TOY_K, tileAtlas, type TileAtlas } from '../sets/ch08-s06-filters';
import { clamp01, inkLabel, lerp, pulse, sm, toyStencil, win } from '../sets/ch08-s06-kit';
import {
  GL,
  SLOTS,
  S06_TILE,
  S09_TILE,
  drawTile,
  fullCathedral,
  glassPane,
  landscape,
  onScreen,
  porchColumns,
  ringGlass,
  toWorld,
  forecourt,
} from '../sets/ch08-s06-rose';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s09';
const LED = mixLab(MOODS.serverCyan.core, '#9ff0a2', 0.7);
/** the light behind the glass: a near-neutral white (the screen's own light), so grey tiles read grey and colour
 *  tiles read as colour; the cyan of the night stays on the stone */
const GLASS_LIGHT: [string, string, string] = ['#e2e9e5', '#bfcac6', '#74858a'];
const JIT = Array.from({ length: TILE_N }, (_, k) => hash1(k, 9091));
/** the seam between the halves when fully split (world px) */
/** half the seam between the parted towers, in SCREEN px (constant through the push, so the mosaic keeps a clean
 *  gutter of ~36 px in the close framing) */
const GAP_SCREEN = 18;
/** bridges across the seam (the paper's cross-GPU connections): into conv3, into fc6, fc6 → fc7, fc7 → fc8 */
const BRIDGES = [COURSES[2].y1 - 4, HALLS[0].y1 + 4, (HALLS[0].y0 + HALLS[1].y1) / 2, CROWN.y1 + 6];

const C0: Camera3 = { x: 640, y: 352, z: -16, lens: 1 };
const C0b: Camera3 = { x: 640, y: 356, z: 14, lens: 1 };
const C2: Camera3 = { x: 640, y: 538, z: 545, lens: 1 };
const C3: Camera3 = { x: 640, y: 540, z: 568, lens: 1 };

interface B {
  D: number;
  split: number;
  halfA: number;
  halfB: number;
  nobody: number;
  how: number;
  divide: number;
  push: number;
  edges: number;
  toy: number;
  toyOut: number;
  colour: number;
  every: number;
  runs: number[];
}
const RUN = 0.8;
const RUN_GAP = 0.2;
/** one continuous dolly from 'the two halves' to 'edges' (~2.8 s); the tilt down lags the zoom so the bridges are
 *  still in frame, mid-push, when they light on 'divide' */
const PUSH_DUR = (b: B) => b.edges + 0.05 - b.push;

function camAt(t: number, b: B): Camera3 {
  const c = mixCam(C0, C0b, sm(t / b.push));
  const u = sm((t - b.push) / PUSH_DUR(b));
  let e = mixCam(c, C2, u);
  const ty = sm((t - (b.divide + 0.35)) / (b.edges + 0.05 - b.divide - 0.35));
  e = { ...e, y: lerp(lerp(c.y, 336, sm((t - b.push) / 0.9)), C2.y, ty) };
  const pd = b.push + PUSH_DUR(b);
  return mixCam(e, C3, sm((t - pd) / (b.D - pd)));
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const every = T.beat('every');
    const divide = T.beat('bridges');
    const colour = T.beat('colour');
    const toy = T.beat('toy');
    const b: B = {
      D,
      split: T.beat('split'),
      halfA: T.word('L0817', 'half'),
      halfB: T.word('L0817', 'each'),
      nobody: T.word('L0818', 'Nobody'),
      how: T.word('L0818', 'how'),
      divide,
      push: T.word('L0818', 'two') - 0.1,
      edges: T.beat('sort'),
      toy,
      toyOut: Math.min(colour - 0.2, toy + 1.1),
      colour,
      every,
      runs: [every + 0.04, every + 0.04 + RUN + RUN_GAP, every + 0.04 + 2 * (RUN + RUN_GAP)],
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const cam = camAt(t, b);
    f.camera(cam);
    f.backlight({ sunX: 640, sunY: 560, sunRadius: 520, intensity: 0.45 });
    // night: the sky ramp pulled down (the glow stays low behind the cathedral)
    {
      const g = f.c.createLinearGradient(0, 0, 0, 720);
      g.addColorStop(0, withAlpha(f.mood.fg, 0.6));
      g.addColorStop(0.55, withAlpha(f.mood.fg, 0.38));
      g.addColorStop(1, withAlpha(f.mood.fg, 0.16));
      f.c.fillStyle = g;
      f.c.fillRect(0, 0, 1280, 720);
    }
    landscape(f, ID, true);
    // haze between the cathedral and the ridge, and a low band where the town's lights would be
    f.fog({ yCenter: 0.68 * 720, height: 0.34 * 720, alpha: 0.26, drift: 6 });
    f.fog({ yCenter: 0.5 * 720, height: 0.14 * 720, alpha: 0.12, drift: 3 });

    const st = teach(t, b);
    const atlas = tileAtlas(ID, [1, 0.99, 0.97], 0.65);
    atlas.update(st.key, st.tileState, st.tick);

    const dx = (GAP_SCREEN / (1000 / (1000 - cam.z))) * st.split;
    f.layer('L4', (c, env) => {
      forecourt(c, env);
      // the slot between the parted towers: dark night sky, with a faint glow low in it (the backlight)
      if (st.split > 0.02) splitGap(c, env, dx);
      // the two halves, each its own tower (clip at the axis, pushed apart)
      for (const half of [0, 1] as const) {
        c.save();
        c.translate(half === 0 ? -dx : dx, 0);
        c.beginPath();
        if (half === 0) c.rect(-2000, -2000, 2000 + CAT.cx, 5000);
        else c.rect(CAT.cx, -2000, 4000, 5000);
        c.clip();
        cathedral(c, env, st.cat[half]);
        ringGlass(c, env, 0.85, 0.45);
        // earlier runs: each finished mosaic stays as a faint offset ghost disc (6 px per run, 20%), layered
        // behind the next, so the window becomes a little stack of runs that all ended the same way
        for (let i = 0; i < 3; i++) if (st.ghosts[i] > 0.01) ghostRun(c, env, cam, i, half, st.ghosts[i]);
        glassPane(c, env, { atlas, tile: st.map, light: 0.85, lift: st.lift, base: GLASS_LIGHT });
        c.restore();
      }
      if (st.split > 0.02) {
        cutEdges(c, env, dx, st.split);
        bridges(c, env, dx, st);
      }
      // the pulse that tries to cross the seam between bridges, and cannot
      if (st.stray) {
        strayBead(c, env, st.stray.x - dx, st.stray.y, st.stray.k);
        if (st.stray.ring > 0.01) {
          // the flash ring where it hits the seam
          const v = 1 - st.stray.ring;
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.strokeStyle = withAlpha(env.mood.core, 0.9 * st.stray.ring);
          c.lineWidth = 2.4;
          c.beginPath();
          c.arc(CAT.cx - dx - 2, st.stray.y, 7 + 22 * v, 0, Math.PI * 2);
          c.stroke();
          c.restore();
          glow(c, CAT.cx - dx, st.stray.y, 30, env.mood.core, 0.5 * st.stray.ring);
        }
        if (st.stray.fizz > 0.01) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 9; i++) {
            const a = Math.PI + (i - 4) * 0.36;
            const d = 3 + 15 * (1 - st.stray.fizz);
            c.fillStyle = withAlpha(env.mood.core, 0.85 * st.stray.fizz);
            c.fillRect(st.stray.x - dx + Math.cos(a) * d, st.stray.y + Math.sin(a) * d + 10 * (1 - st.stray.fizz) ** 2, 1.6, 1.6);
          }
          c.restore();
        }
      }
      // the LEDs at each tower's base, one per card, and the faint pools they throw on the ground
      if (st.led > 0.01) {
        for (const s of [-1, 1]) {
          const x = CAT.cx + s * (CAT.towerDX + dx);
          glow(c, x, CAT.ground + 2, 120, LED, 0.16 * st.led);
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = withAlpha(LED, 0.07 * st.led);
          c.beginPath();
          c.ellipse(x, CAT.ground + 4, 110, 9, 0, 0, Math.PI * 2);
          c.fill();
          c.restore();
          glow(c, x, 606, 26, LED, 0.55 * st.led);
          c.fillStyle = mixLab(LED, '#ffffff', 0.4);
          c.beginPath();
          c.arc(x, 606, 2.6, 0, Math.PI * 2);
          c.fill();
        }
      }
      // the tin toy stencil beside its learned twin, on a soft ink plate
      if (st.toyA > 0.01) toyCompare(c, env, cam, st, dx, atlas);
    });
    f.rim({ x: 0, y: -1 });
    porchColumns(f, ID, cam);

    // ---------------------------------------------------------------- type (screen-locked)
    const txt = mixLab('#efe3cf', f.mood.core, 0.2);
    const ringL = onScreen(cam, GL.x - dx - 78, GL.y);
    const ringR = onScreen(cam, GL.x + dx + 78, GL.y);
    const tagY = Math.max(150, ringL.y - 128);
    quoteTag(f.c, 'largely color-agnostic', Math.min(470, ringL.x - 14), tagY, 'right', win(t, b.edges + 0.05, b.edges + 0.6), txt, f.mood.ink);
    quoteTag(f.c, 'largely color-specific', Math.max(810, ringR.x + 14), tagY, 'left', win(t, b.colour + 0.05, b.colour + 0.6), txt, f.mood.ink);
    // tally pips under the window: one per run on "Every time"
    const close = sm(clamp01((cam.z - 300) / 200));
    if (t > b.every - 0.2) {
      const p = onScreen(cam, GL.x, GL.y + 78);
      const py = Math.min(596, p.y + 22);
      const c = f.c;
      c.save();
      softPlate(c, 640, py, 190, 50, f.mood.ink, 0.45 * win(t, b.every - 0.2, b.every));
      for (let i = 0; i < 3; i++) {
        const on = win(t, b.runs[i] + RUN - 0.05, b.runs[i] + RUN + 0.08);
        const x = 640 + (i - 1) * 46;
        c.globalAlpha = win(t, b.every - 0.2, b.every);
        c.strokeStyle = withAlpha(f.mood.rim, 0.7);
        c.lineWidth = 1.4;
        c.beginPath();
        c.arc(x, py, 12, 0, Math.PI * 2);
        c.stroke();
        if (on > 0.01) {
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = withAlpha(f.mood.core, 0.9 * on);
          c.beginPath();
          c.arc(x, py, 9.2, 0, Math.PI * 2);
          c.fill();
          glow(c, x, py, 30, f.mood.core, 0.5 * on);
          c.globalCompositeOperation = 'source-over';
        }
      }
      c.restore();
    }
    const ia = close * win(t, b.edges - 0.3, b.edges + 0.3);
    if (ia > 0.01) {
      const p = onScreen(cam, GL.x, GL.y + GL.r + 15);
      const [font, size] = legibleFont(f.c, `500 18px ${FONT.mono}`, 'ILLUSTRATIVE');
      inkLabel(f.c, 'ILLUSTRATIVE', 640, Math.min(580, p.y + 8), {
        size,
        font,
        tracking: 2.5,
        align: 'center',
        color: withAlpha(mixLab(f.mood.rim, '#efe3cf', 0.4), 0.85),
        plate: f.mood.ink,
        plateAlpha: 0.5,
        alpha: ia * 0.85,
      });
    }
  },
});

function quoteTag(c: C, text: string, x: number, y: number, align: 'left' | 'right', a: number, col: string, ink: string) {
  if (a <= 0.01) return;
  inkLabel(c, text, x, y, { size: 30, font: `italic 400 30px ${FONT.text}`, color: col, align, plate: ink, plateAlpha: 0.55, alpha: a });
  // the attribution is part of the quote: read at the legibility floor (small caps sized on its capitals)
  const [font, size] = legibleFont(c, `600 18px ${FONT.sc}`, 'KRIZHEVSKY');
  inkLabel(c, '— KRIZHEVSKY ET AL., 2012', x, y + 8 + size * 1.15, {
    size,
    font,
    tracking: 1.5,
    color: withAlpha(col, 0.8),
    align,
    alpha: a * 0.9,
  });
}

// ================================================================================================= TEACHING
interface St {
  key: string;
  tick: number;
  tileState: (k: number) => { u: number; seed: number; variant?: number; snow?: number; lift?: number };
  map: (j: number) => number;
  lift: (j: number) => number;
  split: number;
  led: number;
  cat: [CathedralState, CathedralState];
  bridgeLit: number[];
  cross: { i: number; u: number; dir: number; k: number }[];
  stray: { x: number; y: number; k: number; fizz: number; ring: number } | null;
  ghosts: number[];
  bridgeHot: number;
  toyA: number;
  toyIn: number;
}

/** a forward wave climbing a half: 0..1 from the window to the crown, repeating every `period` s; -1 between */
function front(t: number, t0: number, period: number, rise: number): number {
  if (t < t0) return -1;
  const ph = (t - t0) % period;
  return ph < rise ? ph / rise : -1;
}

function teach(t: number, b: B): St {
  const split = win(t, b.split - 0.05, b.split + 0.75);
  const led = win(t, b.split + 0.1, b.split + 0.6) * (0.88 + 0.12 * Math.sin(t * 2.1));
  // ---- the run
  const sorted = t >= b.split - 0.05; // s06's interleaved mosaic until the split, then the sorted run (both static here)
  const map = sorted ? S09_TILE : S06_TILE;
  const dissolve = win(t, 0.25, 1.95); // s06's mosaic → static, finished before 'chips'
  const uL = win(t, b.edges - 0.1, b.edges + 0.6);
  const uR = win(t, b.colour - 0.25, b.colour + 0.32); // ≥ 70% by 0.2 s after 'colour'
  let run = -1;
  let ru = 0;
  for (let i = 0; i < b.runs.length; i++) if (t >= b.runs[i] - 0.02) { run = i; ru = clamp01((t - b.runs[i]) / RUN); }
  const seethe = Math.max(0.55 * (1 - dissolve) * 0, 0.5 * win(t, 0.9, 1.9));
  const tick = Math.floor(t * 12);
  const tileState = (k: number) => {
    const left = k < 48;
    if (!sorted) return { u: clamp01(1 - dissolve * (1.25 + 0.5 * JIT[k]) + 0.1), seed: 1, snow: seethe * dissolve };
    if (run >= 0) {
      // a replay: drop to static fast, then sort the same way again (a fresh draw, a different variant)
      const down = 1 - sm(ru / 0.16);
      const up = sm((ru - 0.2) / 0.75);
      const u = ru < 0.2 ? down : up;
      return { u, seed: 10 + run, variant: run + 1, snow: ru < 0.3 ? 0.4 : 0 };
    }
    const u = left ? uL : uR;
    const j = JIT[k] * 0.3;
    return { u: clamp01(u * (1 + j) - j * (u < 1 ? 1 : 0)), seed: 2, snow: (1 - u) * 0.5 };
  };
  const snowing = !sorted || run >= 0 ? true : uL < 1 || uR < 1;
  const key = `${sorted ? 1 : 0}|${run}|${run >= 0 ? ru.toFixed(3) : ''}|${uL.toFixed(3)}|${uR.toFixed(3)}|${dissolve.toFixed(3)}|${snowing ? tick : 0}`;
  // cell light: "half the stencils on each", the toy's pane, a replay's landing
  const hiL = pulse(t, b.halfA - 0.08, 0.2, 0.55);
  const hiR = pulse(t, b.halfB - 0.2, 0.2, 0.55);
  let land = 0;
  for (const r0 of b.runs) land = Math.max(land, pulse(t, r0 + RUN - 0.04, 0.05, 0.3));
  const toyIn = win(t, b.toy - 0.3, b.toy + 0.15);
  const toyA = toyIn * (1 - win(t, b.toyOut, b.toyOut + 0.35));
  const lift = (j: number) => (SLOTS[j].half === 0 ? hiL : hiR) * 0.9 + land * 0.6 + (sorted && j === TOY_K ? 0.6 * toyA : 0);

  // ---- forward light, each half on its own after 'Nobody'
  const fr = [0, 1].map((g) => (t < b.nobody ? front(t, 0.4, 2.8, 1.9) : front(t, b.nobody + (g === 0 ? 0.05 : 0.7), 2.2 + g * 0.35, 1.5)));
  const cat = [0, 1].map((g) => {
    const lit = [0.3, 0.3, 0.3, 0.3, 0.3, 0.32, 0.32, 0.22];
    if (fr[g] >= 0) for (let k = 0; k < 8; k++) lit[k] = Math.max(lit[k], 0.85 * Math.exp(-((k - fr[g] * 8.4 + 0.2) ** 2) / 0.9));
    return fullCathedral({ lit, t, threads: 0.28 });
  }) as [CathedralState, CathedralState];
  // ---- bridges: a wave crossing a bridge's level lights it; on 'divide' each carries light across in turn
  const bridgeLv = [2, 5, 6, 7];
  const cross: St['cross'] = [];
  const bridgeLit = bridgeLv.map((li, i) => {
    let v = 0;
    for (const g of [0, 1]) if (fr[g] >= 0) v = Math.max(v, 0.6 * Math.exp(-((li - (fr[g] * 8.4 - 0.2)) ** 2) / 0.4));
    const at = b.divide - 0.05 + i * 0.18;
    if (t >= at && t < at + 0.55) cross.push({ i, u: (t - at) / 0.55, dir: i % 2 === 0 ? 1 : -1, k: 1 });
    return Math.max(v, pulse(t, at, 0.1, 0.8));
  });
  // on 'divide' all four spans burn rim-bright together for ~1.2 s
  const bridgeHot = win(t, b.divide - 0.12, b.divide + 0.12) * (1 - win(t, b.divide + 1.0, b.divide + 1.3));
  // ---- the stray pulse: leaves conv2's face in the left half for the seam, bumps it and dies
  let stray: St['stray'] = null;
  const s0 = b.how - 0.5;
  if (t > s0 && t < s0 + 1.15) {
    const co = COURSES[1];
    const x0 = CAT.cx - co.w / 2 + 30;
    const xs = CAT.cx - 5;
    const u = clamp01((t - s0) / 0.55);
    const bump = t > s0 + 0.55 ? Math.sin(Math.PI * clamp01((t - s0 - 0.55) / 0.25)) : 0;
    const fizz = t > s0 + 0.62 ? 1 - clamp01((t - s0 - 0.62) / 0.5) : 0;
    const ring = t > s0 + 0.53 ? 1 - clamp01((t - s0 - 0.53) / 0.55) : 0;
    stray = { x: lerp(x0, xs - 4, sm(u)) - 8 * bump, y: (co.y0 + co.y1) / 2, k: (t < s0 + 0.62 ? 1 : fizz) * win(t, s0, s0 + 0.12), fizz, ring };
  }
  // each finished replay leaves its mosaic as a ghost (fading a little toward the end so the hold resolves)
  const ghosts = b.runs.map((r0) => 0.3 * win(t, r0 + RUN - 0.05, r0 + RUN + 0.25) * (1 - 0.4 * win(t, b.D - 1.6, b.D - 0.4)));
  return { key, tick, tileState, map, lift, split, led, cat, bridgeLit, cross, stray, toyA, toyIn, ghosts, bridgeHot };
}

/** the stone bridges across the seam (only where the paper's GPUs talk), lit when light crosses */
function bridges(c: C, env: PaintEnv, dx: number, st: St) {
  const m = env.mood;
  const ink = env.fill('ink');
  BRIDGES.forEach((y, i) => {
    const x0 = CAT.cx - dx - 8;
    const x1 = CAT.cx + dx + 8;
    c.fillStyle = ink;
    c.fillRect(x0, y - 3.5, x1 - x0, 7);
    // a little arch under the span
    c.beginPath();
    c.moveTo(x0 + 6, y + 3.5);
    c.quadraticCurveTo(CAT.cx, y + 10, x1 - 6, y + 3.5);
    c.closePath();
    c.fill();
    const L = Math.max(st.bridgeLit[i], st.bridgeHot);
    if (L > 0.02) {
      c.fillStyle = mixLab(m.set, mixLab(m.rim, m.core, 0.5), Math.min(1, L));
      c.fillRect(x0 + 2, y - 2.2, x1 - x0 - 4, 4.4);
      glow(c, CAT.cx, y, 44 + dx * 1.4, m.core, 0.55 * L + 0.25 * st.bridgeHot);
    }
  });
  for (const cr of st.cross) {
    const y = BRIDGES[cr.i];
    const x0 = CAT.cx - dx - 26;
    const x1 = CAT.cx + dx + 26;
    const x = cr.dir > 0 ? lerp(x0, x1, sm(cr.u)) : lerp(x1, x0, sm(cr.u));
    knot(c, x, y - 0.5, 4.6, Math.min(1, 1.6 * Math.sin(Math.PI * cr.u)) * cr.k, env);
  }
}

/** the tin toy stencil of ch08-s04 beside the learned grey edge tile (enlarged, same orientation) on a soft ink
 *  plate left of the window, clear of the tower door; a fine leader to the pane it came from */
function toyCompare(c: C, env: PaintEnv, cam: Camera3, st: St, dx: number, atlas: TileAtlas) {
  const m = env.mood;
  const slide = (1 - sm(st.toyIn)) * -60;
  // plate in screen px: 250 × 120, centred at (300 + slide, 420)
  const scx = 300 + slide;
  const scy = 420;
  const w = toWorld(cam, scx, scy);
  const k = w.k;
  const big = 92 / k;
  c.save();
  c.globalAlpha *= st.toyA;
  softPlate(c, w.x, w.y, 300 / k, 150 / k, env.fill('ink'), 0.82);
  // leader from the plate to the learned pane in the glass
  const sl = SLOTS[TOY_K];
  const px = sl.x - dx;
  c.strokeStyle = withAlpha(m.rim, 0.7);
  c.lineWidth = 1.2 / k * 1.5;
  c.strokeRect(px - 4.6, sl.y - 4.6, 9.2, 9.2);
  c.beginPath();
  c.moveTo(w.x + 125 / k, w.y);
  c.lineTo(px - 4.6, sl.y);
  c.stroke();
  // the learned tile, enlarged: a vertical edge, dark left, light right
  const ex = w.x + 58 / k;
  c.fillStyle = env.fill('ink');
  c.fillRect(ex - big / 2 - 3 / k, w.y - big / 2 - 3 / k, big + 6 / k, big + 6 / k);
  drawTile(c, atlas, TOY_K, ex, w.y, big);
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 1 / k;
  c.strokeRect(ex - big / 2, w.y - big / 2, big, big);
  // a hand-drawn ≈ between the two: the same edge
  c.strokeStyle = withAlpha(mixLab(m.rim, '#efe3cf', 0.5), 0.9);
  c.lineWidth = 2 / k;
  c.lineCap = 'round';
  for (const oy of [-3.2, 3.2]) {
    c.beginPath();
    c.moveTo(w.x - 7 / k, w.y + oy / k);
    c.bezierCurveTo(w.x - 3 / k, w.y + (oy - 3) / k, w.x + 1 / k, w.y + (oy + 3) / k, w.x + 7 / k, w.y + oy / k);
    c.stroke();
  }
  c.restore();
  // the toy: the hand-set 3 × 3 vertical-edge stencil (negative column left, positive right)
  toyStencil(c, env, w.x - 58 / k, w.y, big, st.toyA);
}

// ================================================================================================= THE PARTING
/** the slot between the parted towers: deep night (darker than the sky around the building), a thin sliver of
 *  backlight down its middle and a faint glow at its foot, so the parting reads as a gap, not a slab */
function splitGap(c: C, env: PaintEnv, dx: number) {
  const m = env.mood;
  const top = 18;
  c.fillStyle = mixLab(m.ink, m.fg, 0.3);
  c.fillRect(CAT.cx - dx - 1, top, dx * 2 + 2, CAT.ground - top);
  const g = c.createLinearGradient(0, top, 0, CAT.ground);
  g.addColorStop(0, withAlpha(m.halo, 0.05));
  g.addColorStop(0.7, withAlpha(m.halo, 0.22));
  g.addColorStop(1, withAlpha(m.core, 0.45));
  c.fillStyle = g;
  const w = Math.max(0.6, dx * 0.16);
  c.fillRect(CAT.cx - w / 2, top, w, CAT.ground - top);
  glow(c, CAT.cx, CAT.ground - 40, 20 + dx * 2.5, m.halo, 0.2);
}

/** the inner faces of the two halves catch the glow in the slot: a thin rim line on each cut edge */
function cutEdges(c: C, env: PaintEnv, dx: number, split: number) {
  c.save();
  c.strokeStyle = withAlpha(env.mood.rim, 0.45 * split);
  c.lineWidth = 1.2;
  c.beginPath();
  for (const s of [-1, 1]) {
    const x = CAT.cx + s * (dx - 0.6);
    c.moveTo(x, 40);
    c.lineTo(x, CAT.ground - 2);
  }
  c.stroke();
  c.restore();
}

/** the stray pulse: a 14 px bead in a ring of light (the same messenger language as the bridges' knots) */
function strayBead(c: C, env: PaintEnv, x: number, y: number, k: number) {
  if (k <= 0.01) return;
  const m = env.mood;
  glow(c, x, y, 24, m.core, 0.55 * k);
  c.save();
  c.globalAlpha *= Math.min(1, k);
  c.fillStyle = mixLab(m.core, '#ffffff', 0.3);
  c.beginPath();
  c.arc(x, y, 7, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.4;
  c.stroke();
  c.restore();
}

/** a finished replay's mosaic, as a faint ghost disc offset 6 screen px per run (the oldest furthest back);
 *  drawn inside the half's clip, before the live glass, so only its offset edge shows beside the window */
function ghostRun(c: C, env: PaintEnv, cam: Camera3, i: number, half: 0 | 1, a: number) {
  const k = 1000 / (1000 - cam.z);
  const at = tileAtlas(`${ID}-ghost${i}`, [1, 0.99, 0.97], 0.65);
  at.update('done', () => ({ u: 1, seed: 10 + i, variant: i + 1 }));
  const off = (6 * (3 - i)) / k;
  c.save();
  c.globalAlpha *= a;
  c.translate((half === 0 ? -1 : 1) * off * 0.75, off * 0.75); // outward, away from the seam
  glassPane(c, env, { atlas: at, tile: S09_TILE, light: 0.85, base: GLASS_LIGHT });
  c.restore();
}
