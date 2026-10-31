/**
 * ch08-s03 — a photograph is a grid of lights, each light a number (candleAmber, carried from the bedroom's lamp;
 * 15.04 s; in: cut on the green LED). Round 1: L0805 now names the colour planes and the count, so the shot is
 * re-timed to it: each plane is set down on its own word, and the count lands on 'hundred and fifty thousand'.
 *
 *   0             the green status LED from ch08-s02, exactly where it was, dissolves into one photocell of the
 *                 Mark I's 20 × 20 eye (ch03), its four hundred cells glowing on a horizontal bar; BUFFALO · 1958–60;
 *                 the label 20 × 20 = 400
 *   'grid'        the camera pulls back as every cell splits, on dry-pluck steps: 400 → 40 × 40 → 112 × 112 → 224 × 224;
 *                 the husky (one of ImageNet's thousand tiles, a backlit print) emerges as a MOSAIC of luminous
 *                 squares ('lights' lands on the 112 lattice); the stamp jumps BUFFALO · 1958–60 → TORONTO · 2012
 *   'number'      push in: a lens picks out one pixel; its one value (its brightness) is typed beside it
 *   'colour'      the print turns a little in depth (tissue sheets about to part)
 *   'three'       the lens's one value becomes three: R, G, B
 *   'red'         the red tissue peels forward off the print; 'green' the print dissolves to its green sheet;
 *   'blue'        the blue sheet slides back behind it: three planes stacked in depth, each pixel a tiny lit square
 *   'One'         the planes slide back together into the one small photo
 *   'hundred'     224 × 224 × 3 = 150,528 is set in Plex Mono and held in the music
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame } from '../../../film';
import { defineShot, placeStamp, withAlpha, mixLab, hash1 } from '../../../film';
import { glow, label, MFONT } from '../../../film/silhouette/metaphors/kit';
import { monoCard } from '../sets/ch07-s01-kit';
import { BAR20, GREEN, GREEN_CORE, LED_SCREEN, clamp01, huskyCanvas, huskyValue, lerp, mixCam, sm, win } from '../sets/ch08-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s03';

/** the panel in L4 world: centre (640, 352), side P; the start cell (9, 9) of the 20 × 20 eye lands on LED_SCREEN */
const P = 340;
const PX0 = 640 - P / 2;
const PY0 = 352 - P / 2;
const CELL0 = { x: PX0 + 9.5 * (P / 20), y: PY0 + 9.5 * (P / 20) };
/** the opening sits far enough back that the whole eye and its bolted frame read as the ch03 object */
const Z0 = 400;
const S0 = 1000 / (1000 - Z0);
const CAM0: Camera3 = { x: CELL0.x - (LED_SCREEN.x - 640) / S0, y: CELL0.y - (LED_SCREEN.y - 360) / S0, z: Z0, lens: 1 };
const CAM1: Camera3 = { x: 700, y: 352, z: -40, lens: 1 };
const CAM2: Camera3 = { x: 676, y: 372, z: 30, lens: 1 };
/** on 'number': push in on the lens and its typed value (the pixel is the subject) */
const CAML: Camera3 = { x: 744, y: 414, z: 215, lens: 1 };
/** on 'red'…'blue': back out so the three sheets, stacked in depth, sit whole in frame */
const CAMP: Camera3 = { x: 664, y: 346, z: -20, lens: 1 };
/** the levels the grid passes through (400 cells, then every cell split), and when each lands (s after 'grid') */
const LEVELS = [20, 56, 112, 224];
/** 56 on 'grid', 112 on 'lights', 224 on 'each': every step a dry pluck, the mosaic held long enough to be seen */
const STEP_AT = [0, 0, 0.44, 1.16];
/** the pixel the lens picks (224-grid): a bright patch of white fur on the near cheek, below the eye */
const PICK = { i: 130, j: 134 };
/** depth offset between the colour planes (L4 px) */
const DEPTH = { x: 64, y: -44 };

interface B {
  D: number;
  grid: number;
  number: number;
  /** 'colour': the print turns in depth */
  planes: number;
  /** 'three': the lens value splits into R, G, B */
  three: number;
  red: number;
  green: number;
  blue: number;
  /** 'One' (small photo): the planes slide back together */
  merge: number;
  /** 'hundred': the count is set */
  count: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: B = {
      D: T.duration,
      grid: T.beat('grid'),
      number: T.beat('number'),
      planes: T.beat('planes'),
      three: T.word('L0805', 'three'),
      red: T.word('L0805', 'red'),
      green: T.word('L0805', 'green'),
      blue: T.word('L0805', 'blue'),
      merge: T.word('L0805', 'One'),
      count: T.beat('count'),
    };
    tl.hold(0, T.duration);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    const cam = camAt(t, b);
    f.camera(cam);
    f.backlight({ sunX: 640, sunY: 380, sunRadius: 420, intensity: 0.35 * win(t, 0.3, 1.4) });
    // the photograph's own light is the shot's practical: a transparency lit from behind
    const photoK = win(t, b.grid, b.grid + 0.9) * (1 - 0.35 * stackK(t, b));
    f.layer('L2', (c, env) => {
      // a dim back wall (a lantern-slide room): panelling and a shelf of slide boxes, lit only by the photo's spill
      f.cached(`${ID}/L2wall/${env.mood.id}`, 3100, 1900, (g) => {
        g.translate(900, 600);
        g.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.45);
        g.fillRect(-900, -600, 3100, 1900);
        g.strokeStyle = withAlpha(env.mood.rim, 0.07);
        g.lineWidth = 2;
        for (let k = -6; k <= 10; k++) g.strokeRect(k * 210 + 16, 470, 178, 300);
        g.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.7);
        g.fillRect(-900, 452, 3100, 14);
        g.fillRect(-300, 90, 520, 10);
        g.fillRect(1060, 120, 560, 10);
        for (let k = 0; k < 14; k++) g.fillRect(-286 + k * 36, 90 - 44 - 18 * hash1(k, 83), 28, 44 + 18 * hash1(k, 83));
        for (let k = 0; k < 15; k++) g.fillRect(1074 + k * 36, 120 - 40 - 20 * hash1(k, 84), 28, 40 + 20 * hash1(k, 84));
      })(c, -900, -600);
      const g = c.createRadialGradient(650, 360, 40, 650, 360, 760);
      g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.3), 0.55 * (0.4 + 0.6 * photoK)));
      g.addColorStop(1, withAlpha(env.mood.set, 0));
      c.fillStyle = g;
      c.fillRect(-900, -600, 3100, 1900);
    });
    f.fog({ yCenter: 0.62 * 720, height: 0.4 * 720, alpha: 0.12, drift: 5 });
    f.layer('L3', (c, env) => {
      // the halo of the light box behind the transparency, bleeding round the frame
      if (photoK > 0) {
        glow(c, 640, 352, 520, env.mood.halo, 0.28 * photoK);
        glow(c, 640, 352, 300, mixLab(env.mood.halo, env.mood.core, 0.4), 0.22 * photoK);
      }
    });
    f.fog('B');
    if (photoK > 0) f.practical({ x: 640, y: 352, kind: 'screen', seed: 831, intensity: 0.55 * photoK, radius: 200 });
    f.layer('L4', (c, env) => {
      // the work table the frame stands on, the photo's light spilling forward across it
      c.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.25);
      c.fillRect(-900, PY0 + P + 40, 3100, 900);
      c.fillStyle = withAlpha(env.mood.rim, 0.3);
      c.fillRect(-900, PY0 + P + 39, 3100, 1.4);
      // the frame's foot on the table
      c.fillStyle = env.fill('ink');
      c.fillRect(640 - 90, PY0 + P + 26, 180, 16);
      if (photoK > 0) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.translate(640, PY0 + P + 70);
        c.scale(1, 0.22);
        const sp = c.createRadialGradient(0, 0, 0, 0, 0, 420);
        sp.addColorStop(0, withAlpha(env.mood.halo, 0.3 * photoK));
        sp.addColorStop(0.6, withAlpha(env.mood.halo, 0.1 * photoK));
        sp.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = sp;
        c.fillRect(-420, -420, 840, 840);
        c.restore();
      }
      paintPanel(c, env.mood.fg, env.mood.rim, env.mood.halo, env.mood.core, t, b, f);
    });
    f.layer('L5', (c, env) => {
      // the corner of a light box at lower right, near the lens: its frosted top edge glowing faintly
      c.fillStyle = env.fill('fg');
      c.fillRect(1180, 600, 600, 600);
      c.fillStyle = withAlpha(env.mood.halo, 0.2);
      c.fillRect(1180, 598, 600, 3);
      // the near edge of the bedroom desk from ch08-s02, blurred, low at left: the room the lamp has just left
      c.fillStyle = env.fill('fg');
      c.beginPath();
      c.moveTo(-600, 610);
      c.lineTo(250, 628);
      c.quadraticCurveTo(268, 629, 270, 646);
      c.lineTo(276, 1100);
      c.lineTo(-600, 1100);
      c.closePath();
      c.fill();
      c.fillStyle = withAlpha(env.mood.rim, 0.22);
      c.fillRect(-600, 609, 860, 2.5);
    });
    // the LED → cell dissolve (screen-locked: the LED stays exactly where ch08-s02 left it)
    const ledA = 1 - sm((t - 0.12) / 0.5);
    if (ledA > 0) {
      const c = f.c;
      c.save();
      c.fillStyle = withAlpha('#0b0c0a', 0.92 * ledA);
      c.fillRect(0, 0, 1280, 720);
      c.restore();
      glow(c, LED_SCREEN.x, LED_SCREEN.y, 150, GREEN, 0.16 * ledA);
      glow(c, LED_SCREEN.x, LED_SCREEN.y, 44, GREEN, 0.5 * ledA);
      c.save();
      c.globalAlpha = ledA;
      c.fillStyle = GREEN_CORE;
      c.beginPath();
      c.arc(LED_SCREEN.x, LED_SCREEN.y, 6.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    // ---- type
    const env = { t, mood: f.mood };
    // BUFFALO types out fast at the head (fully up by 0.4 s), holds while the 400 cells are the Mark I's, then the jump
    placeStamp(f.c, { place: 'BUFFALO', date: '1958–60', year: 1958, at: 0, cps: 60, dur: b.grid + 0.3, fade: 0.2 }, env);
    placeStamp(f.c, { place: 'TORONTO', date: '2012', year: 2012, at: b.grid + 0.42, cps: 40 }, env);
    // 20 × 20 = 400 belongs to the Mark I's eye: gone as the splitting starts
    const la = win(t, 0.45, 0.8) * (1 - win(t, b.grid - 0.12, 1.7));
    // beside the eye at the bar's height (never over its cells)
    if (la > 0) monoCard(f.c, { x: 1112, y: 340, lines: ['20 × 20 = 400'], size: 22, alpha: la, rise: la, seed: 84 }, f.mood);
    // the count, set on 'hundred' (inked as the words land), held through the music; above the bottom 12 %
    const ea = win(t, b.count - 0.2, b.count + 0.3);
    if (ea > 0) monoCard(f.c, { x: 640, y: 590, lines: ['224 × 224 × 3 = 150,528'], size: 26, alpha: ea, rise: ea, seed: 85 }, f.mood);
  },
});

function camAt(t: number, b: B): Camera3 {
  let a = mixCam(CAM0, CAM1, sm((t - b.grid + 0.45) / 1.6));
  a = mixCam(a, CAML, sm((t - b.number + 0.5) / 1.3));
  a = mixCam(a, CAMP, sm((t - b.red + 0.9) / 1.5));
  return mixCam(a, CAM2, sm((t - b.merge) / (b.D - b.merge)));
}

/** 0..1 how far the print has become a stack of sheets (the turn on 'colour', undone on 'One') */
function stackK(t: number, b: B): number {
  return sm((t - b.planes + 0.1) / 0.7) * (1 - sm((t - b.merge - 0.2) / 0.8));
}
/** each sheet's own peel: on its word, undone as the planes slide back together */
function peel(t: number, at: number, b: B): number {
  return sm((t - at + 0.12) / 0.55) * (1 - sm((t - b.merge) / 0.7));
}

/** the grid level at time t: index into LEVELS and the 0..1 dissolve into it (two frames: a pluck, on twos) */
function levelAt(t: number, b: B): { i: number; u: number } {
  const x = t - b.grid;
  if (x < 0) return { i: 0, u: 1 };
  let i = 1;
  for (let k = 1; k < LEVELS.length; k++) if (x >= STEP_AT[k]) i = k;
  const tq = Math.floor((x - STEP_AT[i]) * 12) / 12;
  return { i, u: clamp01(tq / 0.17 + 0.34) };
}

const cellCanvases = new Map<string, HTMLCanvasElement>();
/** the 20 × 20 eye as round photocells (bar lit), or the husky at n as round cells (n ≤ 40) */
function cellsCanvas(n: number, bar: boolean, lit: string, dark: string): HTMLCanvasElement {
  const key = `${n}|${bar}|${lit}|${dark}`;
  let cv = cellCanvases.get(key);
  if (cv) return cv;
  const px = 12;
  cv = document.createElement('canvas');
  cv.width = cv.height = n * px;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#0a0907';
  g.fillRect(0, 0, n * px, n * px);
  const src = bar ? null : huskyCanvas(n).getContext('2d')!.getImageData(0, 0, n, n).data;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      let col: string;
      if (bar) col = BAR20[j * 20 + i] ? lit : dark;
      else {
        const q = (j * n + i) * 4;
        col = `rgb(${src![q]},${src![q + 1]},${src![q + 2]})`;
      }
      g.fillStyle = col;
      g.beginPath();
      g.arc(i * px + px / 2, j * px + px / 2, px * 0.4, 0, Math.PI * 2);
      g.fill();
    }
  cellCanvases.set(key, cv);
  return cv;
}

function paintPanel(c: C, fg: string, rim: string, halo: string, core: string, t: number, b: B, f: Frame) {
  const { i: li, u: lu } = levelAt(t, b);
  const turn = stackK(t, b);
  const uR = peel(t, b.red, b), uG = peel(t, b.green, b), uB = peel(t, b.blue, b);
  // the sheets fade out only once they are home again (the photo returns in full colour under them)
  const home = 1 - sm((t - b.merge - 0.45) / 0.4);
  // the Mark I eye's frame: a heavy bolted ink border that thins to a plain print frame as the photograph emerges
  // (it stays: the lights always sit in something; no easel)
  const thin = win(t, b.grid + 0.2, b.grid + 1.0);
  const bw = lerp(26, 9, thin);
  const frameA = 1 - 0.85 * turn;
  c.save();
  c.globalAlpha = frameA;
  c.fillStyle = fg;
  c.fillRect(PX0 - bw, PY0 - bw, P + 2 * bw, P + 2 * bw);
  c.strokeStyle = withAlpha(rim, 0.3);
  c.lineWidth = 1;
  c.strokeRect(PX0 - bw + 0.5, PY0 - bw + 0.5, P + 2 * bw - 1, P + 2 * bw - 1);
  c.fillStyle = withAlpha(rim, 0.35 * (1 - thin));
  for (const [x, y] of [[PX0 - 13, PY0 - 13], [PX0 + P + 13, PY0 - 13], [PX0 - 13, PY0 + P + 13], [PX0 + P + 13, PY0 + P + 13]]) {
    c.beginPath();
    c.arc(x, y, 3.2, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  const litCell = mixLab(halo, core, 0.75);
  const darkCell = mixLab(fg, halo, 0.12);
  c.save();
  c.imageSmoothingEnabled = false;
  if (turn <= 0.001) {
    // one image: the current level, dissolving (a pluck, two frames) from the previous
    drawLevel(c, li - 1, 1 - lu, litCell, darkCell);
    drawLevel(c, li, lu, litCell, darkCell);
    if (li === 0) {
      // the Mark I's 20 × 20 lattice
      c.strokeStyle = withAlpha('#000000', 0.35);
      c.lineWidth = 1.2;
      c.beginPath();
      for (let k = 0; k <= 20; k++) {
        c.moveTo(PX0 + (k * P) / 20, PY0);
        c.lineTo(PX0 + (k * P) / 20, PY0 + P);
        c.moveTo(PX0, PY0 + (k * P) / 20);
        c.lineTo(PX0 + P, PY0 + (k * P) / 20);
      }
      c.stroke();
    }
  } else {
    // three dyed tissue sheets: red peels FORWARD off the print on 'red', the print dissolves to its green sheet on
    // 'green', the blue sheet slides BACK out from behind it on 'blue' (back to front: blue, green, print, red)
    if (uB > 0.001) planePath(c, uB, turn, uB * home, () => c.drawImage(huskyCanvas(224, 'b'), PX0, PY0, P, P), rim);
    if (uG > 0.001) planePath(c, 0, turn, Math.min(1, uG * 2) * home, () => c.drawImage(huskyCanvas(224, 'g'), PX0, PY0, P, P), rim);
    const photoA = Math.max(1 - uG, 1 - home);
    if (photoA > 0.003) planePath(c, 0, turn, photoA, () => c.drawImage(huskyCanvas(224), PX0, PY0, P, P), rim);
    if (uR > 0.001) planePath(c, -uR, turn, Math.min(1, uR * 3) * home, () => c.drawImage(huskyCanvas(224, 'r'), PX0, PY0, P, P), rim);
  }
  // a faint pixel lattice stays on the print (224 × 224) from the last split through the 'number' beat: the photo is
  // still visibly a grid of lights while the lens reads one of them
  const latA = 0.12 * win(t, b.grid + STEP_AT[3], b.grid + STEP_AT[3] + 0.2) * (1 - win(t, b.number + 0.5, b.number + 1.2)) * (1 - turn);
  if (latA > 0.003) {
    c.globalAlpha = latA;
    c.drawImage(latticeLines(), PX0, PY0, P, P);
    c.globalAlpha = 1;
  }
  c.restore();
  // a soft halo of the photograph's light on its frame edge
  if (li >= 3 && turn < 0.5) glow(c, 640, 352, P * 0.75, halo, 0.05);
  // the lens on 'number'
  lens(c, t, b, turn, fg, rim, core, f);
}

/**
 * The photograph at n × n as a lattice of luminous squares: each cell a lit square with a dark gap round it (≈ 6 px
 * cells with 1-2 px gaps at 1080p on the 112 level), plus a soft per-cell glow baked from a blurred copy. Cached.
 */
const lattices = new Map<number, { cells: HTMLCanvasElement; glow: HTMLCanvasElement }>();
function lattice(n: number) {
  let L = lattices.get(n);
  if (L) return L;
  const px = n <= 40 ? 24 : n <= 112 ? 8 : 4;
  const gap = n <= 40 ? 4 : n <= 112 ? 2 : 0.8;
  const W = n * px;
  const cells = document.createElement('canvas');
  cells.width = cells.height = W;
  const g = cells.getContext('2d')!;
  g.fillStyle = '#0a0907';
  g.fillRect(0, 0, W, W);
  const src = huskyCanvas(n).getContext('2d')!.getImageData(0, 0, n, n).data;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const q = (j * n + i) * 4;
      g.fillStyle = `rgb(${src[q]},${src[q + 1]},${src[q + 2]})`;
      g.fillRect(i * px + gap / 2, j * px + gap / 2, px - gap, px - gap);
    }
  const glowC = document.createElement('canvas');
  glowC.width = glowC.height = W;
  const h = glowC.getContext('2d')!;
  h.filter = `blur(${Math.max(1.5, px * 0.45)}px)`;
  h.drawImage(cells, 0, 0);
  h.filter = 'none';
  L = { cells, glow: glowC };
  lattices.set(n, L);
  return L;
}

let LAT: HTMLCanvasElement | null = null;
/** 224 × 224 lattice lines (dark), drawn at 6 px a cell so it downsamples to a fine screen, not a moiré */
function latticeLines(): HTMLCanvasElement {
  if (LAT) return LAT;
  const n = 224, px = 6;
  LAT = document.createElement('canvas');
  LAT.width = LAT.height = n * px;
  const g = LAT.getContext('2d')!;
  g.fillStyle = '#000';
  for (let k = 0; k <= n; k++) {
    g.fillRect(k * px - 0.75, 0, 1.5, n * px);
    g.fillRect(0, k * px - 0.75, n * px, 1.5);
  }
  return LAT;
}

function drawLevel(c: C, li: number, a: number, lit: string, dark: string) {
  if (li < 0 || a <= 0.003) return;
  const n = LEVELS[li];
  c.globalAlpha = a;
  if (li === 0) c.drawImage(cellsCanvas(20, true, lit, dark), PX0, PY0, P, P);
  else {
    const L = lattice(n);
    c.imageSmoothingEnabled = true;
    c.drawImage(L.cells, PX0, PY0, P, P);
    // each square glows a little into its gaps: the grid is a grid of LIGHTS
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = a * 0.45;
    c.drawImage(L.glow, PX0, PY0, P, P);
    c.restore();
  }
  c.globalAlpha = 1;
}

/** the transform of a colour plane: turned (a slight perspective shear) and pushed back by d (−1 = forward) */
function planeMatrix(d: number, turnK: number): DOMMatrix {
  const turn = sm(Math.min(1, turnK * 1.4));
  const cx = 640, cy = 352;
  return new DOMMatrix()
    .translate(cx + d * DEPTH.x - 40 * turn, cy + d * DEPTH.y + 20 * turn)
    .multiply(new DOMMatrix([1 - 0.16 * turn, -0.16 * turn, 0, 1 - 0.04 * turn, 0, 0]))
    .translate(-cx, -cy);
}
function planePath(c: C, d: number, turn: number, alpha: number, draw: () => void, rim: string) {
  c.save();
  const m = planeMatrix(d, turn);
  c.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  c.globalAlpha = alpha;
  // a thin paper edge and a shadow on the plane behind
  c.fillStyle = withAlpha('#000', 0.35 * turn);
  c.fillRect(PX0 + 6, PY0 + 8, P, P);
  c.globalAlpha = alpha * 0.96;
  draw();
  c.globalAlpha = alpha;
  c.strokeStyle = withAlpha(rim, 0.55);
  c.lineWidth = 1.2;
  c.strokeRect(PX0, PY0, P, P);
  c.restore();
}

function lens(c: C, t: number, b: B, turn: number, fg: string, rim: string, core: string, _f: Frame) {
  // in on 'number', out just before the red sheet peels (the sheets are the subject from then on)
  const a = sm((t - b.number + 0.3) / 0.3) * (1 - sm((t - b.red + 0.55) / 0.35));
  if (a <= 0.003) return;
  // where the picked pixel lands on the print
  const m = planeMatrix(0, turn);
  const px = PX0 + ((PICK.i + 0.5) * P) / 224;
  const py = PY0 + ((PICK.j + 0.5) * P) / 224;
  const q = m.transformPoint(new DOMPoint(px, py));
  const R = 62;
  const lx = q.x + 98, ly = q.y + 66;
  const enter = 1 - sm((t - b.number + 0.3) / 0.3);
  const cx = lx + 60 * enter, cy = ly + 50 * enter;
  c.save();
  c.globalAlpha = a;
  // the magnified pixels inside the lens (11 × 11 around the pick, in colour, the pick outlined)
  c.save();
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.clip();
  c.imageSmoothingEnabled = false;
  const k = 11;
  c.drawImage(huskyCanvas(224), PICK.i - 5, PICK.j - 5, k, k, cx - R, cy - R, 2 * R, 2 * R);
  const cs = (2 * R) / k;
  c.strokeStyle = withAlpha('#000', 0.45);
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i <= k; i++) {
    c.moveTo(cx - R + i * cs, cy - R);
    c.lineTo(cx - R + i * cs, cy + R);
    c.moveTo(cx - R, cy - R + i * cs);
    c.lineTo(cx + R, cy - R + i * cs);
  }
  c.stroke();
  c.strokeStyle = core;
  c.lineWidth = 2.4;
  c.strokeRect(cx - cs / 2, cy - cs / 2, cs, cs);
  c.restore();
  // the brass lens ring and its handle
  c.strokeStyle = fg;
  c.lineWidth = 9;
  c.beginPath();
  c.arc(cx, cy, R + 4, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(rim, 0.6);
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(cx, cy, R + 8, Math.PI * 1.05, Math.PI * 1.7);
  c.stroke();
  c.fillStyle = fg;
  c.save();
  c.translate(cx, cy);
  c.rotate(0.75);
  c.fillRect(R + 6, -7, 92, 14);
  c.restore();
  // a fine leader from the lens back to the pixel on the print
  c.strokeStyle = withAlpha(core, 0.8);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(q.x, q.y);
  c.lineTo(cx - (cx - q.x) * (R / Math.hypot(cx - q.x, cy - q.y)), cy - (cy - q.y) * (R / Math.hypot(cx - q.x, cy - q.y)));
  c.stroke();
  c.fillStyle = core;
  c.fillRect(q.x - 1.8, q.y - 1.8, 3.6, 3.6);
  // the typed reading beside the lens (Plex Mono, like a gauge): ONE number (its brightness) on 'number'; on
  // 'three' it becomes three, one per colour: red, green, blue (the real values of that pixel)
  const vr = huskyValue(224, PICK.i, PICK.j, 'r'), vg = huskyValue(224, PICK.i, PICK.j, 'g'), vb = huskyValue(224, PICK.i, PICK.j, 'b');
  const lum = 0.299 * vr + 0.587 * vg + 0.114 * vb;
  const one = sm((t - b.number) / 0.25) * (1 - sm((t - b.three + 0.15) / 0.2));
  const three = sm((t - b.three + 0.05) / 0.3);
  const bx = cx + R + 18;
  if (one > 0.003) {
    c.globalAlpha = a * one;
    c.fillStyle = withAlpha('#0b0a08', 0.6);
    c.fillRect(bx, cy - 24, 94, 44);
    label(c, lum.toFixed(2), bx + 47, cy + 10, { size: 30, font: MFONT.mono, weight: 500, color: core, align: 'center' });
  }
  if (three > 0.003) {
    const rows: [string, number, string][] = [
      ['R', vr, '#e3a493'],
      ['G', vg, '#a9d1a6'],
      ['B', vb, '#a3b7e0'],
    ];
    c.globalAlpha = a * three;
    c.fillStyle = withAlpha('#0b0a08', 0.62);
    c.fillRect(bx, cy - 62, 128, 124);
    rows.forEach(([ch, v, tint], r) => {
      const ry = cy - 30 + r * 38 + 10;
      const ra = sm((t - b.three + 0.05 - r * 0.12) / 0.25);
      label(c, ch, bx + 14, ry, { size: 26, font: MFONT.mono, weight: 600, color: mixLab(tint, core, 0.25), align: 'left', alpha: ra });
      label(c, v.toFixed(2), bx + 114, ry, { size: 30, font: MFONT.mono, weight: 500, color: core, align: 'right', alpha: ra });
    });
  }
  c.restore();
}
