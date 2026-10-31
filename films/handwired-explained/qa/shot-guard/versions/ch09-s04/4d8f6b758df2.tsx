/**
 * ch09-s04 — A PATTERN IS CELLS, NOT A PROGRAM (serverCyan, ink bleed in from the copper line; 12.67 s).
 *   L0908 "Search patterns are what Kleene, back in 1951, called regular events."
 *   L0909 "As the code says, a new pattern “writes cells and changes no program.”"
 *
 * MATCH CUT: the ink bleed lands on the pattern field above the search map, still reading 'error' (as s03 left it);
 * then the frame bleeds again to the typed page from ch02-s03 (the RAND memorandum in its typewriter, the finite dial
 * with its fixed ring of eight stops beside it; the winterBlue paper re-tinted cyan). No portrait of Kleene.
 *
 * TEACHES, word by word:
 *   2.38 Kleene   the page, typewriter and dial in frame; the date stamp RAND · 15 DECEMBER 1951 sets in.
 *   4.84 regular  the page's typed lines lift off as fine threads and re-form into the automaton for 'error': six paper
 *                 lanterns in a row (one state per character it reads, plus one), each with its brass threshold ring,
 *                 joined by five threads lettered e · r · r · o · r; the last carries a second brass ring (accepting).
 *                 The echo caption sets in small at lower left and stays.
 *   6.77 code     the lanterns flatten onto a parchment grid, the way a loom flattens into cloth: the threads become 1s
 *                 and 0s in a transition table for each character class (one row per state, eight state rows: the
 *                 program's fixed size), the accepting ring a row of accepting-state cells, a strip of class cells
 *                 beside it; the brass counter at the grid's corner rolls to 1,097 (the pattern's cells). Beside the
 *                 grid stands the program: a fixed cut-brass plate.
 *   10.25 changes a second pattern is typed into the field ('warn', a word the documents' log levels use): only the
 *                 cells change, flickering to their new values in a wave; the brass plate does not move or relight.
 * The tables are COMPUTED (the substring automaton of each pattern over its character classes), never typed by eye.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import {
  FONT,
  cardProbe,
  defineShot,
  drawTracked,
  label,
  legibleSize,
  measureTracked,
  mixLab,
  paperLantern,
  parchmentPlate,
  placeStamp,
  softPlate,
  textProbe,
  textRole,
  thread,
  threadPoint,
  typewriter,
  withAlpha,
} from '../../../film';
import { finiteDial } from '../sets/ch02-s03-dial';
import { MAP, drawSearchMap, mapView, patternField, searchHallWall, toW } from '../sets/ch09-s03-searchMap';
import { clamp01, lerp, seg, sm, smr, twos } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch09-s04';

// ---------------------------------------------------------------- the automata (computed)
/** a pattern's character classes: its distinct characters in order, then 'other' */
function classesOf(p: string): string[] {
  const out: string[] = [];
  for (const ch of p) if (!out.includes(ch)) out.push(ch);
  return out;
}
/**
 * The substring automaton (KMP): states 0..m, m accepting and absorbing; delta[state][class] = next state.
 * Classes: the pattern's distinct characters, then 'other' (index = classes.length).
 */
function automaton(p: string) {
  const cls = classesOf(p);
  const m = p.length;
  const K = cls.length + 1;
  const delta: number[][] = [];
  const fail: number[] = [0];
  for (let i = 1, k = 0; i < m; i++) {
    while (k > 0 && p[i] !== p[k]) k = fail[k - 1];
    if (p[i] === p[k]) k++;
    fail[i] = k;
  }
  for (let s = 0; s <= m; s++) {
    delta.push([]);
    for (let ci = 0; ci < K; ci++) {
      if (s === m) {
        delta[s].push(m);
        continue;
      }
      const ch = ci < cls.length ? cls[ci] : '\0';
      let k = s;
      while (k > 0 && p[k] !== ch) k = fail[k - 1];
      delta[s].push(p[k] === ch ? k + 1 : 0);
    }
  }
  return { cls, delta, m };
}
/** the program's fixed table: 8 state rows x 8 class groups x 8 next-state cells (one-hot), accepting row, class strip */
const NS = 8;
const NG = 8;
interface Cells {
  trans: Uint8Array; // NS * NG * NS
  accept: Uint8Array; // NS
  strip: Uint8Array; // 26 letters x NG (one-hot class)
}
function cellsFor(p: string): Cells {
  const a = automaton(p);
  const trans = new Uint8Array(NS * NG * NS);
  for (let s = 0; s <= a.m; s++)
    for (let g = 0; g < a.cls.length + 1; g++) trans[(s * NG + g) * NS + a.delta[s][g]] = 1;
  const accept = new Uint8Array(NS);
  accept[a.m] = 1;
  const strip = new Uint8Array(26 * NG);
  for (let i = 0; i < 26; i++) {
    const ch = String.fromCharCode(97 + i);
    const k = a.cls.indexOf(ch);
    strip[i * NG + (k < 0 ? a.cls.length : k)] = 1;
  }
  return { trans, accept, strip };
}
const CELLS_A = cellsFor('error');
const CELLS_B = cellsFor('warn');
/** each class group's header (the machine's own structure): the pattern's characters, then '·' for any other;
 *  unused groups stay blank (the program's fixed size) */
const groupHeads = (p: string) => {
  const cls = classesOf(p);
  return Array.from({ length: NG }, (_, g) => (g < cls.length ? cls[g] : g === cls.length ? '·' : ''));
};
const HEADS_A = groupHeads('error');
const HEADS_B = groupHeads('warn');

// ---------------------------------------------------------------- geography (L4 world ~ screen)
const PAGE = { x: 664, y: 96, w: 330, h: 470 };
const TW = { x: 652, y: 760, s: 7.2 };
const DIAL = { x: 236, y: 360, r: 72 };
const LAN = { x0: 250, dx: 156, y: 318, r: 34 };
const GRID = { x: 160, y: 300, cw: 12, ch: 21 };
const GRID_W = NG * NS * GRID.cw;
const GRID_H = NS * GRID.ch;
const STRIP = { x: GRID.x + GRID_W + 26, y: GRID.y - 44, cw: 4.6, ch: 9.4 };
const PLATE = { x: 1046, y: 222, w: 140, h: 228 };
/** the push during the write wave: ~4 % in, toward the seam between the grid and the program plate */
const PUSH_SEAM = { x: 700, y: 382 };
const FIELD_Y = 196;

interface Beats {
  D: number;
  kleene: number;
  regular: number;
  table: number;
  writes: number;
}
const BLEED = { a: 1.25, b: 2.3 };

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, kleene: T.beat('kleene'), regular: T.beat('regular'), table: T.beat('table'), writes: T.beat('writes') };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const u = smr(t / b.D);
    // a slow drift over the shot, then on 'changes' a ~4 % push toward the grid-plate seam (the still plate and the
    // moving wave share the frame)
    const pu = smr(seg(t, b.writes - 0.25, b.writes + 1.55));
    const z0 = lerp(0, 40, u);
    const k0 = 1000 / (1000 - z0);
    const z = 1000 - 1000 / (k0 * (1 + 0.04 * pu));
    const cam: Camera3 = { x: lerp(lerp(640, 646, u), PUSH_SEAM.x, pu), y: lerp(lerp(360, 352, u), PUSH_SEAM.y, pu), z, lens: 1 };
    f.camera(cam);
    f.backlight({ sunX: 700, sunY: 380, intensity: 0.8 });
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 1800, 900, (cc) => {
        cc.translate(260, 100);
        searchHallWall(cc, env);
      })(c, -260, -100);
    });
    f.fog('A');
    f.fog('B');
    const bleed = seg(t, BLEED.a, BLEED.b);
    f.layer('L4', (c, env) => {
      if (bleed < 1) fieldScene(f, c, env, t);
      if (bleed > 0) {
        c.save();
        if (bleed < 1) c.clip(bleedPath(bleed, 41));
        backdrop(c, env);
        pageScene(c, env, t, tq, b);
        automatonScene(c, env, t, b);
        tableScene(c, env, t, tq, b);
        lanterns(c, env, t, b);
        c.restore();
      }
    });
    f.rim({ x: 0, y: -1 });
    // the program plate's own steady lamp (constant: it never flickers, never relights) once the table is up
    plateLamp(f, seg(t, b.table + 0.4, b.table + 1.2) * (1 - bleedA(t)));
    // (no L5 slab at the right edge: the hall pillar of s03 is not carried into this room)
    // ---------------- type (screen-locked)
    placeStamp(f.c, { place: 'RAND', date: '15 December 1951', style: 'typewriter', x: 52, y: 64, at: b.kleene - 0.05, dur: b.table - b.kleene, fade: 0.5 }, { t, mood: f.mood, seed: 941 });
    echoCaption(f, t, b);
  },
});

/** 1 while the frame is still the field scene (before the bleed), for things that belong only to scene B */
const bleedA = (t: number) => 1 - seg(t, BLEED.a, BLEED.b);

/**
 * The steady practical on the program plate: a small hooded lamp over it and a constant warm-brass pool on its face
 * (additive, screen-locked through the camera; no flicker, no change on 'changes').
 */
function plateLamp(f: Frame, a: number) {
  if (a <= 0.01) return;
  f.layer('L4', (cc, env) => {
    const cx = PLATE.x + PLATE.w / 2, top = PLATE.y;
    // the lamp: a short arm from above and a hooded shade
    cc.save();
    cc.globalAlpha *= a;
    cc.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.2);
    cc.fillRect(cx - 2, top - 78, 4, 40);
    cc.beginPath();
    cc.moveTo(cx - 30, top - 26);
    cc.quadraticCurveTo(cx, top - 50, cx + 30, top - 26);
    cc.lineTo(cx + 24, top - 22);
    cc.lineTo(cx - 24, top - 22);
    cc.closePath();
    cc.fill();
    // the warm pool: constant intensity
    cc.globalCompositeOperation = 'lighter';
    const g = cc.createRadialGradient(cx, top + PLATE.h * 0.3, 10, cx, top + PLATE.h * 0.35, PLATE.h * 0.85);
    g.addColorStop(0, withAlpha(mixLab('#f3dfae', env.mood.halo, 0.25), 0.34));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    cc.fillStyle = g;
    cc.fillRect(cx - PLATE.h, top - 40, PLATE.h * 2, PLATE.h * 1.8);
    const bulb = cc.createRadialGradient(cx, top - 22, 0, cx, top - 22, 22);
    bulb.addColorStop(0, withAlpha('#fff1cf', 0.85));
    bulb.addColorStop(1, withAlpha(env.mood.halo, 0));
    cc.fillStyle = bulb;
    cc.fillRect(cx - 22, top - 44, 44, 44);
    cc.restore();
  });
}

// ---------------------------------------------------------------- the ink bleed (a union of seeded blots)
function bleedPath(u: number, seed: number): Path2D {
  const p = new Path2D();
  const N = 16;
  for (let i = 0; i < N; i++) {
    const h = (k: number) => {
      const s = Math.sin((i + 1) * 12.9898 + seed * 78.233 + k * 37.719) * 43758.5453;
      return s - Math.floor(s);
    };
    const x = 80 + h(1) * 1120, y = 60 + h(2) * 600;
    const d = h(3) * 0.45;
    const r = Math.max(0, (u - d) / (1 - d)) * (420 + 240 * h(4));
    if (r <= 0) continue;
    p.moveTo(x + r, y);
    // a ragged edge: a few lobes
    for (let k = 1; k <= 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const rr = r * (1 + 0.08 * Math.sin(a * 5 + i));
      p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    p.closePath();
  }
  return p;
}

// ---------------------------------------------------------------- scene A: the pattern field above the search map
const MAP_A = mapView(2.4, (MAP.cols * MAP.cw) / 2 - 40 / 2.4, 30, { x: 640, y: 360 });
function fieldScene(f: Frame, c: C2, env: PaintEnv, t: number) {
  drawSearchMap(f, c, env, MAP_A, { slot: Math.floor(Math.max(0, twos(t)) * 4) % 513, matches: 1, sweepX: 99999, key: ID });
  const top = toW(MAP_A, 0, 0).y;
  patternField(c, env, { x: 640, y: top - 64, w: 300, text: 'error', shown: 5, alpha: 1, size: legibleSize(c, `500 28px ${FONT.mono}`, 28), t, key: `${ID}-a`, caret: false });
}

// ---------------------------------------------------------------- scene B: the 1951 page, the dial, the automaton, the table
function backdrop(c: C2, env: PaintEnv) {
  // the hall again, behind the page (a darker wash so the paper carries)
  c.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.ink, 0.35), 0.9);
  c.fillRect(-200, -200, 1700, 1100);
  const g = c.createRadialGradient(660, 320, 40, 660, 320, 640);
  g.addColorStop(0, withAlpha(env.mood.haze, 0.55));
  g.addColorStop(1, withAlpha(env.mood.haze, 0));
  c.fillStyle = g;
  c.fillRect(-200, -200, 1700, 1100);
}

/** the typed page's lines (texture: the memorandum's shape, never its words): [x0, x1, y] in page px */
const PAGE_LINES: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let y = 64;
  for (let i = 0; i < 17; i++) {
    const para = i === 4 || i === 10;
    if (para) y += 10;
    const h = Math.sin((i + 3) * 91.7) * 43758.5453;
    const r = h - Math.floor(h);
    out.push([34 + (para || i === 0 ? 22 : 0), PAGE.w - 34 - (i === 16 || i === 9 ? 90 + r * 40 : r * 18), y]);
    y += 17.5;
  }
  return out;
})();

function pageScene(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const dimU = 0.8 * seg(t, b.regular + 0.2, b.regular + 1.3);
  const gone = seg(t, b.table - 0.2, b.table + 0.6);
  const a = 1 - gone;
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  // the dial with its fixed ring of eight stops (ch02-s03), quietly lit
  finiteDial(c, env, { x: DIAL.x, y: DIAL.y, r: DIAL.r, lit: 0.55, pointer: Math.floor(tq * 1.5) % 8 });
  // the page standing in the typewriter: cool paper (winterBlue re-tinted cyan), typed lines (texture), a header rule
  const lift = seg(t, b.regular - 0.05, b.regular + 0.9);
  c.fillStyle = withAlpha(env.mood.ink, 0.35);
  c.fillRect(PAGE.x - PAGE.w / 2 + 6, PAGE.y + 8, PAGE.w, PAGE.h);
  // the paper: the bible's warm paper value, first with ch02's winterBlue tint, re-tinting serverCyan as the voice
  // reaches 'regular' (one value step brighter than the hall around it)
  const tint = seg(t, b.kleene - 0.4, b.regular);
  const warmPaper = '#f2ecdc';
  const paper = mixLab(mixLab(warmPaper, '#b9cadb', 0.26), mixLab(warmPaper, env.mood.core, 0.22), tint);
  const pg = c.createLinearGradient(0, PAGE.y, 0, PAGE.y + PAGE.h);
  pg.addColorStop(0, mixLab(paper, '#ffffff', 0.12));
  pg.addColorStop(1, mixLab(paper, env.mood.set, 0.1));
  c.fillStyle = pg;
  c.fillRect(PAGE.x - PAGE.w / 2, PAGE.y, PAGE.w, PAGE.h);
  // the paper's grain: a few long fibres, very faint, and a crease
  c.strokeStyle = withAlpha(mixLab('#22282b', env.mood.ink, 0.2), 0.05);
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i < 14; i++) {
    const y = PAGE.y + 20 + i * 33 + ((i * 37) % 13);
    c.moveTo(PAGE.x - PAGE.w / 2, y);
    c.bezierCurveTo(PAGE.x - 40, y + 4, PAGE.x + 60, y - 3, PAGE.x + PAGE.w / 2, y + 2);
  }
  c.moveTo(PAGE.x - PAGE.w / 2, PAGE.y + PAGE.h * 0.36);
  c.lineTo(PAGE.x + PAGE.w / 2, PAGE.y + PAGE.h * 0.355);
  c.stroke();
  // the page is typed from the first frame it is seen (its lines are drawn as struck type, texture)
  cardProbe(c, `${ID}-page`, PAGE.x - PAGE.w / 2, PAGE.y, PAGE.w, PAGE.h, a * (1 - dimU), a * (1 - lift));
  textRole(c, 'texture', () => {
    c.fillStyle = withAlpha(mixLab('#22282b', env.mood.ink, 0.2), 0.75);
    for (let i = 0; i < PAGE_LINES.length; i++) {
      const [x0, x1, y] = PAGE_LINES[i];
      // a line's ink thins as it lifts off as a thread
      const li = 1 - seg(lift, i / 34, i / 34 + 0.45);
      if (li <= 0.01) continue;
      c.globalAlpha = a * li;
      typedLine(c, PAGE.x - PAGE.w / 2 + x0, PAGE.y + y, x1 - x0, i);
    }
  });
  c.globalAlpha = a;
  c.restore();
  // the typewriter (kit prop), big, the page in its platen
  c.save();
  c.globalAlpha *= a;
  typewriter(c, { x: TW.x, y: TW.y, s: TW.s, carriage: 0.42, typing: 0, paper: 0 }, env);
  c.restore();
  // as the lines lift away, the 1951 room sinks back into the dark (an overlay: nothing turns translucent)
  if (dimU > 0.01) {
    c.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.ink, 0.45), dimU * a);
    c.fillRect(-200, -200, 1700, 1100);
  }
}
/**
 * a typed line as texture: words of struck characters (each a small glyph-like mark with its own height, weight and
 * baseline jitter: x-height letters, ascenders, the odd descender), never legible words
 */
function typedLine(c: C2, x: number, y: number, w: number, seed: number) {
  const base = c.globalAlpha;
  let cx = x;
  let k = 0;
  while (cx < x + w - 6) {
    const h = Math.sin((seed * 31 + k) * 12.9898) * 43758.5453;
    const r = h - Math.floor(h);
    const n = Math.max(2, Math.round(2 + r * 7));
    for (let j = 0; j < n && cx < x + w - 3; j++) {
      const q = Math.sin((seed * 131 + k * 17 + j) * 78.233) * 43758.5453;
      const v = q - Math.floor(q);
      const asc = v > 0.78 ? 3 : 0, desc = v < 0.1 ? 2 : 0;
      c.globalAlpha = base * (0.62 + 0.38 * ((v * 7.3) % 1));
      c.fillRect(cx, y - 5 - asc + (v - 0.5) * 0.8, 3.6, 5.2 + asc + desc);
      cx += 4.6;
    }
    cx += 5.5;
    k++;
  }
  c.globalAlpha = base;
}

/** the five threads' endpoints (lantern i -> i + 1) and the lantern centres */
const lanX = (i: number) => LAN.x0 + i * LAN.dx;
const LETTERS = ['e', 'r', 'r', 'o', 'r'];

function automatonScene(c: C2, env: PaintEnv, t: number, b: Beats) {
  const lift = seg(t, b.regular - 0.05, b.regular + 0.9);
  const form = seg(t, b.regular + 0.35, b.regular + 1.15);
  const flat = seg(t, b.table - 0.05, b.table + 0.75);
  if (lift <= 0) return;
  const threadCol = mixLab(env.mood.rim, env.mood.core, 0.4);
  // the lifting threads: each page line flies to one of the five threads (two lines per thread, the rest fade)
  if (form < 1) {
    for (let i = 0; i < 10; i++) {
      const [x0, x1, y] = PAGE_LINES[i + 3];
      const k = i % 5;
      const u = smr((lift - i * 0.03) / 0.8) * (1 - flat);
      if (u <= 0) continue;
      const ax = lerp(PAGE.x - PAGE.w / 2 + x0, lanX(k) + LAN.r, u), ay = lerp(PAGE.y + y, LAN.y, u);
      const bx = lerp(PAGE.x - PAGE.w / 2 + x1, lanX(k + 1) - LAN.r, u), by = lerp(PAGE.y + y, LAN.y, u);
      thread(c, { x0: ax, y0: ay, x1: bx, y1: by, w: 1.7, sag: 6 * u, color: threadCol, alpha: Math.min(1, 1.6 * u) * (1 - form) }, env);
    }
  }
  if (form <= 0) return;
  const a = form * (1 - flat);
  // the five lettered threads
  for (let k = 0; k < 5; k++) {
    const o = { x0: lanX(k) + LAN.r * 0.9, y0: LAN.y, x1: lanX(k + 1) - LAN.r * 0.9, y1: LAN.y, sag: 7 };
    thread(c, { ...o, w: 2, color: threadCol, alpha: a }, env);
    const m = threadPoint(o, 0.5);
    textRole(c, 'subject', () => {
      const sz = legibleSize(c, `italic 600 36px ${FONT.display}`, 36, 'x');
      label(c, LETTERS[k], m.x, m.y - 18, { size: sz, font: FONT.display, weight: 600, italic: true, color: mixLab(env.mood.core, '#ffffff', 0.2), align: 'center', alpha: a, shadow: withAlpha(env.mood.ink, 0.8) });
      textProbe(c, `${ID}-letter${k}`, m.x - 12, m.y - 18 - sz, 24, sz, a);
    });
  }
}

/**
 * The six lanterns (state i = lantern i). On 'code' each drops onto ITS OWN state row of the table: it shrinks as it
 * travels and settles as a small glowing disc just left of row i's number, then gives way to the numeral (the mapping
 * is seen, not told). Drawn over the parchment.
 */
function lanterns(c: C2, env: PaintEnv, t: number, b: Beats) {
  const form = seg(t, b.regular + 0.35, b.regular + 1.15);
  const flat = seg(t, b.table - 0.05, b.table + 0.75);
  if (form <= 0) return;
  const a = form * (1 - flat);
  const settle = seg(t, b.table + 0.75, b.table + 1.4);
  for (let i = 0; i < 6; i++) {
    const tx = GRID.x - 46, ty = GRID.y + (i + 0.5) * GRID.ch;
    const fu = smr(seg(t, b.table + 0.05 + i * 0.06, b.table + 0.7 + i * 0.06));
    const x = lerp(lanX(i), tx, fu), y = lerp(LAN.y, ty, fu);
    const sc = lerp(1, 0.24, fu);
    const la = form * (1 - settle);
    if (la > 0.01) {
      c.save();
      c.translate(x, y);
      c.scale(sc, sc);
      c.translate(-x, -y);
      paperLantern(c, { x, y, r: LAN.r, act: 0.45 + 0.25 * (i === 5 ? 1 : 0), threshold: 0.5, hang: 0, tassel: false, alpha: la }, env);
      c.restore();
    }
    if (i === 5 && flat < 1 && fu < 0.99) {
      // the accepting ring: a second brass ring round the last lantern
      c.strokeStyle = withAlpha(mixLab('#b08d4a', '#f3dfae', 0.4), 0.9 * a);
      c.lineWidth = 2.6;
      c.beginPath();
      c.ellipse(x, y, LAN.r * 1.35 * sc, LAN.r * 1.55 * sc, 0, 0, Math.PI * 2);
      c.stroke();
    }
  }
}

/** the parchment grid: transition cells (8 state rows x 8 class groups x 8 next-state cells), accepting row, class strip */
function tableScene(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const ink = seg(t, b.table + 0.1, b.table + 1.1);
  if (ink <= 0) return;
  const pad = 26;
  parchmentPlate(c, { x: GRID.x - pad - 44, y: STRIP.y - 30, w: STRIP.x + 8 * STRIP.cw + pad - (GRID.x - pad - 44) + 10, h: GRID_H + 2 * pad + 56 + 64, seed: 9, ornament: false, alpha: ink }, env);
  const P_INK = '#2a211b';
  const wave = (x: number) => clamp01((t - (b.writes + 0.05) - (x - GRID.x) / 900) / 0.32);
  // the program: a fixed cut-brass plate beside the grid (never moves, never relights)
  programPlate(c, env, ink);
  c.save();
  c.globalAlpha *= ink;
  textRole(c, 'texture', () => {
    c.font = `600 11px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    // transition cells
    for (let s = 0; s < NS; s++) {
      const rowIn = seg(t, b.table + 0.15 + s * 0.08, b.table + 0.55 + s * 0.08);
      if (rowIn <= 0) continue;
      for (let g = 0; g < NG; g++)
        for (let n = 0; n < NS; n++) {
          const i = (s * NG + g) * NS + n;
          const x = GRID.x + (g * NS + n) * GRID.cw, y = GRID.y + s * GRID.ch;
          const w = wave(x);
          const flick = w > 0 && w < 1 && Math.floor(tq * 12 + i) % 2 === 0;
          const v = w >= 1 ? CELLS_B.trans[i] : flick ? 1 - CELLS_A.trans[i] : CELLS_A.trans[i];
          cell(c, x, y, GRID.cw, GRID.ch, v, rowIn, n === 0, P_INK);
        }
    }
    // the accepting-state row (under the table: one cell per state)
    const ay = GRID.y + GRID_H + 22;
    for (let s = 0; s < NS; s++) {
      const x = GRID.x + s * GRID.cw * NS;
      const w = wave(x);
      const v = w >= 1 ? CELLS_B.accept[s] : CELLS_A.accept[s];
      cell(c, x, ay, GRID.cw * NS, GRID.ch, v, seg(t, b.table + 0.6, b.table + 1.0), true, P_INK);
    }
    // the class strip beside the table: 26 letters x 8 classes (one-hot)
    for (let r = 0; r < 26; r++)
      for (let g = 0; g < NG; g++) {
        const x = STRIP.x + g * STRIP.cw, y = STRIP.y + r * STRIP.ch;
        const w = wave(x);
        const v = w >= 1 ? CELLS_B.strip[r * NG + g] : CELLS_A.strip[r * NG + g];
        c.fillStyle = v ? withAlpha(P_INK, 0.85) : withAlpha(P_INK, 0.12);
        c.fillRect(x + 0.6, y + 0.6, STRIP.cw - 1.2, STRIP.ch - 1.2);
      }
  });
  // structural headers (part of the machine): state numbers 0-7 down the left (the lanterns land on them), each class
  // group's character above its 8 cells; the group heads are cells too, so they change with the wave
  textRole(c, 'subject', () => {
    const hs = legibleSize(c, `600 13px ${FONT.mono}`, 13);
    c.font = `600 ${hs}px ${FONT.mono}`;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    const na = seg(t, b.table + 0.8, b.table + 1.3) * ink;
    c.fillStyle = withAlpha(P_INK, 0.8 * na);
    for (let s = 0; s < NS; s++) c.fillText(String(s), GRID.x - 10, GRID.y + (s + 0.5) * GRID.ch + 0.5);
    textProbe(c, `${ID}-states`, GRID.x - 10 - hs, GRID.y, hs, GRID_H, na);
    c.textAlign = 'center';
    const ga = seg(t, b.table + 0.5, b.table + 1.0) * ink;
    for (let g = 0; g < NG; g++) {
      const x = GRID.x + (g + 0.5) * NS * GRID.cw;
      const w = wave(GRID.x + g * NS * GRID.cw);
      const flick = w > 0 && w < 1 && Math.floor(tq * 12 + g) % 2 === 0;
      const hd = w >= 1 ? HEADS_B[g] : flick ? '' : HEADS_A[g];
      if (!hd) continue;
      c.fillStyle = withAlpha(P_INK, 0.85 * ga);
      c.fillText(hd, x, GRID.y - 12);
    }
  });
  // class-group separators (fine rules every 8 cells)
  c.strokeStyle = withAlpha(P_INK, 0.5);
  c.lineWidth = 1;
  c.beginPath();
  for (let g = 0; g <= NG; g++) {
    const x = GRID.x + g * NS * GRID.cw;
    c.moveTo(x, GRID.y - 4);
    c.lineTo(x, GRID.y + GRID_H + 4);
  }
  c.stroke();
  c.restore();
  // the brass counter at the grid's corner: rolls to 1,097 (the pattern's cells)
  counter(c, env, t, b, ink);
  // the field returns above the grid: 'error', then 'warn' typed over it on 'changes'
  const fa = seg(t, b.table + 0.9, b.table + 1.4);
  const erase = seg(t, b.writes - 0.6, b.writes - 0.25);
  const typed = (twos(t) - (b.writes - 0.2)) * 10;
  const text = t < b.writes - 0.2 ? 'error'.slice(0, Math.ceil(5 * (1 - erase))) : 'warn';
  const shown = t < b.writes - 0.2 ? 5 : typed;
  patternField(c, env, { x: GRID.x + GRID_W / 2, y: FIELD_Y, w: 260, text, shown, alpha: fa, size: legibleSize(c, `500 24px ${FONT.mono}`, 24), t, key: `${ID}-b`, caret: t > b.writes - 0.7 && t < b.writes + 1.2 });
}
function cell(c: C2, x: number, y: number, w: number, h: number, v: number, a: number, edge: boolean, ink: string) {
  c.globalAlpha = a;
  c.strokeStyle = withAlpha(ink, edge ? 0.35 : 0.16);
  c.lineWidth = 0.7;
  c.strokeRect(x + 0.35, y + 0.35, w - 0.7, h - 0.7);
  if (v) {
    // a 1: an inked cell with its numeral reversed out
    c.fillStyle = withAlpha(ink, 0.88);
    c.fillRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4);
    c.fillStyle = '#efe3c8';
  } else c.fillStyle = withAlpha(ink, 0.28);
  c.fillText(v ? '1' : '0', x + w / 2, y + h / 2 + 0.5);
  c.globalAlpha = 1;
}

/** the program: a cut-brass plate, pierced in a fixed pattern (a plain prop; it never moves or relights) */
function programPlate(c: C2, env: PaintEnv, a: number) {
  const brass = mixLab(mixLab('#b08d4a', env.mood.halo, 0.2), '#f3dfae', 0.2);
  c.save();
  c.globalAlpha *= a;
  const p = new Path2D();
  p.rect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
  for (let r = 0; r < 9; r++)
    for (let k = 0; k < 5; k++) {
      const h = Math.sin((r * 5 + k) * 12.9898) * 43758.5453;
      if (h - Math.floor(h) < 0.38) continue;
      const x = PLATE.x + 22 + k * 26, y = PLATE.y + 24 + r * 23;
      p.rect(x - 6, y - 4, 12, 8);
    }
  c.fillStyle = withAlpha(env.mood.ink, 0.45);
  c.fillRect(PLATE.x + 5, PLATE.y + 6, PLATE.w, PLATE.h);
  c.fillStyle = brass;
  c.fill(p, 'evenodd');
  c.strokeStyle = withAlpha(mixLab(brass, '#fff1cf', 0.4), 0.8);
  c.lineWidth = 1.5;
  c.strokeRect(PLATE.x + 0.75, PLATE.y + 0.75, PLATE.w - 1.5, PLATE.h - 1.5);
  // four rivets
  c.fillStyle = mixLab(brass, '#3a2a14', 0.45);
  for (const [x, y] of [[8, 8], [PLATE.w - 8, 8], [8, PLATE.h - 8], [PLATE.w - 8, PLATE.h - 8]]) {
    c.beginPath();
    c.arc(PLATE.x + x, PLATE.y + y, 3, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** the brass gauge at the grid's top-left corner: its digits roll up to 1,097 */
function counter(c: C2, env: PaintEnv, t: number, b: Beats, a: number) {
  const u = sm((t - (b.table + 0.35)) / 1.3);
  const n = Math.round(1097 * u);
  const text = n.toLocaleString('en-US');
  const x = GRID.x + GRID_W - 6, y = GRID.y - 40;
  c.save();
  c.globalAlpha *= a;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 22px ${FONT.mono}`, 22);
    c.font = `600 ${size}px ${FONT.mono}`;
    const w = c.measureText('0,000').width + 20;
    const brass = mixLab(mixLab('#b08d4a', env.mood.halo, 0.2), '#f3dfae', 0.25);
    c.fillStyle = brass;
    c.beginPath();
    c.roundRect(x - w, y - size * 0.95, w, size * 1.5, 4);
    c.fill();
    c.fillStyle = '#1a1510';
    c.fillRect(x - w + 5, y - size * 0.75, w - 10, size * 1.1);
    c.fillStyle = mixLab('#f3e6c4', env.mood.core, 0.15);
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    c.fillText(text, x - 10, y - size * 0.18);
    textProbe(c, `${ID}-counter`, x - w, y - size * 0.95, w, size * 1.5, a);
  });
  c.restore();
}

/** the echo caption, small, lower left, from 'regular' to the end */
function echoCaption(f: Frame, t: number, b: Beats) {
  const a = seg(t, b.regular + 0.1, b.regular + 0.7);
  if (a <= 0) return;
  const c = f.c;
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `italic 500 22px ${FONT.text}`, 22);
    const o = { font: `italic 500 ${size}px ${FONT.text}`, size, tracking: 0.01, align: 'left' as const };
    const text = 'an echo, not a citation: the repo does not cite Kleene';
    const w = measureTracked(c, text, o);
    c.globalAlpha = a;
    softPlate(c, 52 + w / 2, 606, w + 120, size + 48, f.mood.ink, 0.5);
    c.fillStyle = mixLab('#e6eeea', f.mood.core, 0.15);
    drawTracked(c, text, 52, 612, o);
    textProbe(c, `${ID}-echo`, 52, 612 - size, w, size * 1.2, a);
    c.restore();
  });
}
