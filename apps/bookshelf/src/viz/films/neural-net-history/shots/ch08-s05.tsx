/**
 * ch08-s05 — a cathedral of stencils rises from the photograph's rose window: five courses of detectors built
 * from detectors, then two great halls and a last hall of a thousand lanterns (dawnGold; 20.71 s; in: crossfade).
 * The paper's five convolutional and three fully connected layers, true shapes (sets/ch08-s05-cathedral).
 *
 *   'Ninety-six'  the husky photograph is the ROSE WINDOW; the first course (face width 55) rises and 96 tiny
 *                 11 × 11 tiles flicker in on the window's tracery (the first-layer stencils)
 *   'four'        the second course (27) rises, then three at 13, 13, 13, block by block; as each face narrows a
 *                 tiny wordless 3 × 3 window passes over the course below and keeps its brightest cell (pooling)
 *   'stencilling' bright spots of each course feed up as the picture the next course's stencils slide over
 *   'edges' …     the rose window shows, one at a time, what such a layer responds to: oriented strokes; woven
 *   'things'      textures; a fur patch and an eye; a whole dog's head; then the photograph again
 *   'halls'       TWO great halls (fc6, fc7) rise between the towers; threads from every lantern to every lantern
 *                 below; card (inked on 'halls'): 5 stencil layers → 2 great halls of 4,096 → 1,000 answers,
 *                 its last line brightening on 'thousand'
 *   'last'        the last hall, a band of a thousand small lanterns, one per answer (nothing above it), as the
 *                 camera pulls back to the whole cathedral; ≈ 60 million numbers · 650,000 neurons
 *   hold          light climbs from window to crown course by course; the window replays each course's vignette
 *                 and settles to the photograph as the crown lights (one lantern burns brightest)
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame } from '../../../film';
import { MOODS, defineShot, mixLab, withAlpha, forestBand, ridgePath, legibleSize, FONT, tree } from '../../../film';
import { capSize, monoCard } from '../sets/ch07-s01-kit';
import { clamp01, mixCam, sm, win } from '../sets/ch08-s01-kit';
import { CAT, cathedral, type CathedralState } from '../sets/ch08-s05-cathedral';

const ID = 'ch08-s05';
/** a slow tilt-up following the courses as they rise (y −64 over 0 → 10 s) with a slight dolly in, the rose window
 *  low in frame, the courses filling above it; the near hill-crest trees (L5) slide against the façade */
/** the tilt-up also trucks right ≈ 40 px, so the near gate pier (lower left) slides out against the façade */
/** REVIEW r1 (teacher): from 'four more layers above' through 'things' all FIVE courses stay in frame — course 5's
 *  gablets (world y 192) sit ≥ 40 px (1080p) below the frame top and the rose window's ring (y 638) above the bottom
 *  12 %: screen y = 360 + k·(y − cam.y), k = 1000 / (1000 − z) → C1 k 1.333 (192 → 30, 638 → 625), C2 k 1.351 */
const C0: Camera3 = { x: 600, y: 512, z: 360, lens: 1 };
const C1: Camera3 = { x: 612, y: 440, z: 250, lens: 1 };
const C2: Camera3 = { x: 622, y: 436, z: 260, lens: 1 };
/** on 'halls': the whole façade from the rose window to the crown, base kept in frame (never a half-clipped rose).
 *  REVIEW r1 (artistry): pulled back far enough that both towers (buttresses at world x 325 / 955) stand clear of the
 *  two cards at the safe margins, and a continued truck (x +30 over 'halls' → the end) slides the façade against the
 *  gate pier (NEAR) and the ridges */
const C3: Camera3 = { x: 626, y: 352, z: -60, lens: 1 };
const C4: Camera3 = { x: 644, y: 356, z: -100, lens: 1 };
const C5: Camera3 = { x: 656, y: 356, z: -70, lens: 1 };
const CAMS = [C0, C1, C2, C3, C4, C5];
/** the near plane: a churchyard gate pier, a stub of wall and a yew at lower left. Between the action plane and L5
 *  (z 900) so it stays a lower-left frame in the wide: in the tight tilt-up it fills the left edge and slides out of
 *  frame, then slides back in on the pull-back to frame the whole cathedral (never in front of the façade) */
const NEAR = { id: 'L5', z: 900, haze: 0, blur: 2.5 };

interface B {
  D: number;
  l1: number;
  l2: number;
  stack: number;
  edges: number;
  textures: number;
  parts: number;
  things: number;
  halls: number;
  every: number;
  everything: number;
  last: number;
  thousand: number;
  end: number;
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: B = {
      D: T.duration,
      l1: T.beat('l1'),
      l2: T.beat('l2'),
      stack: T.beat('stack'),
      edges: T.beat('edges'),
      textures: T.beat('textures'),
      parts: T.beat('parts'),
      things: T.beat('things'),
      halls: T.beat('halls'),
      every: T.word('L0810', 'every'),
      everything: T.wordEnd('L0810', 'everything'),
      last: T.beat('lastHall'),
      thousand: T.word('L0810', 'thousand'),
      end: T.line('L0810').end,
    };
    tl.hold(0, b.D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    f.camera(camAt(t, b));
    f.backlight({ sunX: 640, sunY: 470, sunRadius: 560, intensity: 0.95 });
    landscape(f);
    f.fog({ yCenter: 0.66 * 720, height: 0.36 * 720, alpha: 0.22, drift: 7 });
    const st = stateAt(t, b);
    f.layer('L4', (c, env) => cathedral(c, env, st));
    f.rim({ x: 0, y: -1 });
    f.layer(NEAR, (c, env) => {
      f.cached(`${ID}/near2/${env.mood.id}`, 700, 700, (g) => {
        g.translate(0, -300);
        nearGate(g, env.fill('fg'), env.mood.rim);
      })(c, -34, 300);
    });
    f.layer('L5', (c, env) => {
      // two bare trees on the hill crest beyond the frame edges in the wide (blurred, near the lens)
      f.cached(`${ID}/L5near3/${env.mood.id}`, 3400, 1500, (g) => {
        g.translate(1000, 400);
        const fe = { ...env, fill: (r: Parameters<typeof env.fill>[0]) => (r === 'set' || r === 'ink' ? env.fill('fg') : env.fill(r)) };
        tree(g, { x: -70, y: 770, h: 380, kind: 'oak', seed: 1851, detail: 0.7 }, fe);
        tree(g, { x: 1350, y: 775, h: 330, kind: 'oak', seed: 1852, detail: 0.7 }, fe);
      })(c, -1000, -400);
    });
    // ---- type
    // both cards at the legibility floor (22 px cap height at 1080p), their outer edges on the 5 % safe margin
    const ls = legibleSize(f.c, `500 19px ${FONT.mono}`, 19);
    // the script's fact-checked label, in words: the five stencil courses, the two great halls of 4,096 lanterns,
    // and the last hall of 1,000 answers (review r3: words, not the bare face widths)
    const L1 = ['5 stencil layers', '→ 2 great halls of 4,096', '→ 1,000 answers'];
    const L2 = ['≈ 60 million numbers', '650,000 neurons'];
    // REVIEW r1 (artistry): the cards stay clear of the towers' silhouettes, so each long line is set on two (the
    // same words, a narrower measure: '→ 2 great halls' / 'of 4,096'), with a tighter pad and tracking
    const S1 = [L1[0], ...wrapAt(L1[1], ' of '), L1[2]];
    const S2 = [...wrapAt(L2[0], ' numbers'), L2[1]];
    const CARD = { pad: 16, tracking: 0.2 };
    // inked ON 'halls' (the halls rise into a frame that is still widening); the paper and its first line come up
    // together; '→ 1,000 answers' waits dim and brightens on 'thousand'
    const a1 = win(t, b.halls - 0.22, b.halls + 0.08);
    if (a1 > 0) {
      const cx = 64 + cardW(f.c, S1, ls, CARD) / 2;
      // the card carries all four lines' height; its last line is inked separately so it can brighten
      monoCard(f.c, { x: cx, y: 318, lines: [...S1.slice(0, 3), ''], size: ls, alpha: a1, rise: a1, seed: 88, ...CARD }, f.mood);
      const lit3 = 0.42 + 0.58 * win(t, b.thousand - 0.2, b.thousand + 0.15);
      monoLine(f.c, { x: cx, y: 318, n: 4, i: 3, text: S1[3], size: ls, alpha: a1 * lit3, rise: a1, ...CARD });
    }
    // REVIEW r1 (sync): the numbers card inks its first line on 'last' (14.70), fully up by 14.9
    const a2 = win(t, b.last - 0.15, b.last + 0.15);
    if (a2 > 0) monoCard(f.c, { x: 1216 - cardW(f.c, S2, ls, CARD) / 2, y: 318, lines: S2, size: ls, alpha: a2, rise: a2, seed: 89, ...CARD }, f.mood);
  },
});

/** one line of a monoCard inked on its own (monoCard's own geometry: Plex Mono 500, 0.6 px tracking, 22 px pad,
 *  1.35 leading, rise 14 px), so a line can brighten on its word */
function monoLine(c: CanvasRenderingContext2D, o: { x: number; y: number; n: number; i: number; text: string; size: number; alpha: number; rise: number; pad?: number; tracking?: number }) {
  if (o.alpha <= 0.003) return;
  const size = capSize(c, `500 21px ${FONT.mono}`, o.size);
  const pad = o.pad ?? 22;
  const lh = size * 1.35;
  const H = Math.round(o.n * lh + pad * 1.6);
  const y0 = o.y - H / 2 + (1 - sm(o.rise)) * 14;
  c.save();
  c.globalAlpha *= o.alpha;
  c.fillStyle = MOODS.parchment.ink;
  c.font = `500 ${size}px ${FONT.mono}`;
  (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${o.tracking ?? 0.6}px`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText(o.text, o.x, y0 + pad * 0.8 + size + o.i * lh);
  c.restore();
}

/** a monoCard's width (its own metrics: Plex Mono 500 at monoCard's cap-floored size, tracking, pad) */
function cardW(c: CanvasRenderingContext2D, lines: string[], size: number, o: { pad?: number; tracking?: number } = {}): number {
  const s = capSize(c, `500 21px ${FONT.mono}`, size);
  const tr = o.tracking ?? 0.6;
  c.save();
  c.font = `500 ${s}px ${FONT.mono}`;
  const w = Math.max(...lines.map((l) => c.measureText(l).width + tr * l.length));
  c.restore();
  return Math.round(w + 2 * (o.pad ?? 22));
}

/** one line set on two at a break phrase ('→ 2 great halls of 4,096' → '→ 2 great halls' / 'of 4,096'): the words
 *  are unchanged, only the measure narrows */
function wrapAt(line: string, brk: string): string[] {
  const i = line.indexOf(brk);
  if (i < 0) return [line];
  return [line.slice(0, i), line.slice(i + 1)];
}

function camAt(t: number, b: B): Camera3 {
  let c = mixCam(C0, C1, sm(t / b.stack));
  c = mixCam(c, C2, sm((t - b.stack) / (b.things - 0.6 - b.stack)));
  // REVIEW r1 (sync): the pull-back to the whole façade begins at 'things' + 0.6 (the dog's head has read) and runs
  // ≈ 2.4 s to ≈ 13.0, so the halls rise into a frame that is still widening; most of the move is spent by 'halls'
  // (the left card inks there, clear of the receding tower), the rest settles slowly
  const pb0 = b.things + 0.6;
  const pb = clamp01((t - pb0) / (b.halls + 1.27 - pb0));
  c = mixCam(c, C3, 0.8 * sm(clamp01(pb / 0.6)) + 0.2 * sm(pb));
  c = mixCam(c, C4, sm((t - b.last + 0.3) / 2.4));
  return mixCam(c, C5, sm((t - b.end) / (b.D - b.end)));
}

function stateAt(t: number, b: B): CathedralState {
  const tq = Math.floor(t * 12) / 12; // the stone courses rise on twos (paper props)
  const rise = (at: number, d = 0.4) => sm((tq - at) / d);
  // the 27 course rises on 'four'; the 13s follow, the last up by 'stencilling'
  const course = [rise(b.l1 + 0.05, 0.7), rise(b.l2 - 0.1), rise(b.l2 + 0.66), rise(b.l2 + 1.08), rise(b.l2 + 1.46)];
  // 'halls': the first great hall is clearly up by halls − 0.1, the second follows; the last hall rises on 'last'
  // and is complete on 'thousand'
  const hall = [rise(b.halls - 0.55, 0.45), rise(b.halls - 0.05, 0.45)];
  const crown = rise(b.last - 0.2, 0.9);
  // pooling: as each face narrows (55 → 27 while the 27 rises, 27 → 13 while the 13s rise) a 3 × 3 window snaps
  // across the lower course on twos and keeps its brightest cell. REVIEW r1 (teacher): drawn as a loupe 1.6 × the
  // window, each position HELD ≈ 0.4 s so 'keep the brightest' reads (3 positions, then 2)
  let pool: CathedralState['pool'] = null;
  const POOL = [
    { k: 1, at: b.l2 - 0.17, steps: 3 },
    { k: 2, at: b.l2 + 1.0, steps: 2 },
  ];
  for (const P of POOL) {
    const dur = P.steps * 0.42;
    if (tq >= P.at && tq < P.at + dur) pool = { k: P.k, u: (tq - P.at) / dur, steps: P.steps, dur, mag: 1.6 };
  }
  // light: modest while built; 'stencilling' feeds up; the hold's flow climbs window → crown, one stage at a time,
  // slowly enough that the rose window replays each course's vignette for ≥ 0.5 s
  // (the replay ends by ≈ 19.6 s with the crown lit; the photograph holds the last ≈ 1 s)
  const FLOW = [0.0, 0.36, 0.72, 0.9, 1.08, 1.2, 1.3, 1.4];
  const flowAt = (k: number) => b.end + FLOW[k];
  const lit = Array.from({ length: 8 }, (_, k) => {
    let v = k < 5 ? 0.35 * course[k] : 0;
    // the courses warm one after another as the climb passes (after the stencilling close-up)
    if (k < 5) v = Math.max(v, 0.4 * win(t, b.stack + 0.8 + k * 0.22, b.stack + 1.2 + k * 0.22) * (1 - 0.6 * win(t, b.halls - 0.5, b.halls)));
    if (k >= 5 && k < 7) v = Math.max(v, 0.6 * hall[k - 5]);
    // the last hall is the brightest of the three: a band of lit lanterns
    if (k === 7) v = Math.max(v, 0.8 * crown);
    v = Math.max(v, win(t, flowAt(k), flowAt(k) + 0.3));
    return clamp01(v);
  });
  // the rose-window vignettes: one per noun, FULL on the word (opened by the narration's breaths), then the replay
  const V = [
    { kind: 'strokes' as const, at: b.edges },
    { kind: 'textures' as const, at: b.textures },
    { kind: 'parts' as const, at: b.parts },
    { kind: 'things' as const, at: b.things },
  ];
  let vignette: CathedralState['vignette'] = { kind: null, k: 0 };
  for (let i = 0; i < V.length; i++) {
    const next = i + 1 < V.length ? V[i + 1].at : b.things + 1.3;
    const k = win(t, V[i].at - 0.3, V[i].at - 0.06) * (1 - win(t, next - 0.32, next - 0.3 + 0.02));
    if (k > 0.001) vignette = { kind: V[i].kind, k };
  }
  // the replay in the hold, course by course (strokes, textures, fur and eye, the head), settling as the crown lights
  const replay: [number, 'strokes' | 'textures' | 'parts' | 'things'][] = [[0, 'strokes'], [1, 'textures'], [2, 'parts'], [4, 'things']];
  for (let i = 0; i < replay.length; i++) {
    const a = flowAt(replay[i][0]);
    const z = i + 1 < replay.length ? flowAt(replay[i + 1][0]) : flowAt(7);
    const k = win(t, a - 0.06, a + 0.06) * (1 - win(t, z - 0.06, z + 0.02)) * 0.92;
    if (k > 0.001) vignette = { kind: replay[i][1], k };
  }
  // threads: every lantern to everything below. The faint all-pairs sheet (≈ 0.06 per thread) plus a FAN of ≈ 55
  // brighter rim threads per hall that draws on 'every' at 0.25 and rises to 0.4 by 'everything', then settles to
  // 0.22 for the rest of the shot (the halls stay visibly wired to what is below)
  const threads = 0.06 * win(t, b.every - 0.2, b.every + 0.3);
  const fan = win(t, b.every - 0.15, b.every + 0.2) * (0.25 + 0.15 * win(t, b.every + 0.2, b.everything) - 0.18 * win(t, b.everything + 0.4, b.everything + 1.4));
  return {
    course,
    hall,
    crown,
    tiles: clamp01((t - b.l1 - 0.1) / 1.0),
    lit,
    threads,
    fan,
    // REVIEW r1 (teacher), 'stencilling': first the close-up of one stencil at work (a 3 × 3 cluster of course 1's
    // bright spots lifts onto course 2's face; a course-2 stencil tile slides over it in three steps on twos and,
    // matched, its cell lights: 1.2 s from 'stencilling' − 0.1), THEN the light climbs course 2 → 5 (0.9 s, on twos)
    stencil: Math.max(0, (tq - b.stack + 0.1) / 1.2),
    feed: Math.max(0, Math.min(2, (tq - b.stack - 1.1) / 0.9)),
    feedFrom: 1,
    pool,
    vignette,
    t,
  };
}

/** the near churchyard gate (world px of the NEAR plane): a stone pier with a ball finial (x 236–296), a low wall
 *  running left from it with an iron rail, and a dark yew behind the wall */
function nearGate(g: CanvasRenderingContext2D, ink: string, rim: string) {
  g.fillStyle = ink;
  // the yew: a dark, ragged cone
  g.beginPath();
  g.moveTo(70, 1000);
  for (let k = 0; k <= 12; k++) {
    const u = k / 12;
    const y = 1000 - u * 520;
    g.lineTo(160 - 95 * (1 - u) - (k % 2) * 10, y);
  }
  for (let k = 12; k >= 0; k--) {
    const u = k / 12;
    const y = 1000 - u * 520;
    g.lineTo(160 + 80 * (1 - u) + (k % 2) * 10, y);
  }
  g.closePath();
  g.fill();
  // the wall and its iron rail
  g.fillRect(-20, 620, 260, 400);
  g.fillRect(-26, 612, 270, 12);
  for (let x = -10; x < 236; x += 14) g.fillRect(x, 560, 3, 56);
  g.fillRect(-20, 566, 256, 3);
  // the pier: plinth, shaft, cornice, ball
  g.fillRect(226, 600, 80, 400);
  g.fillRect(236, 540, 60, 64);
  g.fillRect(230, 528, 72, 14);
  g.beginPath();
  g.arc(266, 512, 16, 0, Math.PI * 2);
  g.fill();
  g.fillRect(258, 524, 16, 6);
  // the dawn catches the pier's top edges
  g.fillStyle = withAlpha(rim, 0.35);
  g.fillRect(230, 528, 72, 1.6);
  g.fillRect(-26, 612, 252, 1.4);
}

// ================================================================================================= THE LANDSCAPE
function landscape(f: Frame) {
  f.layer('L1', (c, env) => {
    f.cached(`${ID}/L1/${env.mood.id}`, 3600, 1400, (g) => {
      g.translate(1200, 400);
      g.fillStyle = env.fill('set');
      g.fill(ridgePath({ x0: -1200, x1: 2400, y: 560, amp: 90, seed: 857, scale: 320, ground: 900 }));
      g.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.3);
      g.fillRect(-1200, 600, 3600, 800);
    })(c, -1200, -400);
  });
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/L2/${env.mood.id}`, 3200, 1200, (g) => {
      g.translate(1000, 300);
      forestBand(g, { x0: -1000, x1: 2200, y: 640, h: 120, kind: 'bare', density: 2, seed: 858 }, env);
      g.fillStyle = env.fill('set');
      g.fillRect(-1000, 636, 3200, 600);
    })(c, -1000, -300);
  });
  void CAT;
  void withAlpha;
}
