/**
 * ch09-s05 — TWO PASSES THROUGH A FIXED READING HEAD (serverCyan, cut in from ch09-s04's parchment grid; 12.92 s).
 *   L0910 "A program can't go back, so search walks each document twice."
 *   L0911 "From the end, then the start: a longest match is only known after reading past its end."
 *
 * REAL DATA: the strip is one generated log-event document from the repo's own generator,
 * documentAt(20261013, 2848) in src/json-search/documents.ts (a logEvent, no defect, 160 code points), printed cell by
 * cell as its characters cut out above their code points. The match of the pattern 'error' is COMPUTED below (a
 * literal pattern's longest match is its plain occurrence: TEXT.indexOf), never placed by eye.
 *
 * The search (src/json-search/search-step.ts): a reverse pass from the last position down, then a forward pass from
 * position 0 up; the forward pass knows at every position whether a longer match continues, so a match is only known
 * once the head has read past its end.
 *
 * Planes: L2 the search hall's window wall (shared), fog, L3 the search map faint behind (its beads stepping), fog,
 * L4 the bench, the strip and the brass READING HEAD (a gantry with a slot, a reading window, a lamp; on its side a
 * one-way RATCHET wheel with a pawl, the host ratchet's language from ch06), L5 a soft hall pillar at the left edge.
 *
 * TEACHES, word by word:
 *   0.76 program   the ratchet catches the light: a glint runs round its teeth and it clicks one tooth forward (one way).
 *   1.6 -> 3.1     the strip is fed in from the left, turned end for end: its LAST character leads into the slot.
 *   3.15 walks     PASS 1: the strip feeds left to right through the fixed head, one cell per tick at first, then fast;
 *                  every cell it has read stays faintly lit (only that it was read). The ratchet turns one tooth a cell.
 *                  Label 'pass 1: from the end'.
 *   5.25 -> 6.6    between passes: the strip is lifted clear out of the slot, turned end for end in the air (its back:
 *                  the cut-out characters now seen mirrored), carried back over the head and lowered at the left; the
 *                  ratchet's pawl lifts and drops: one clean click, a new pass.
 *   6.72 start     PASS 2: fed left to right again, first character leading, one cell per tick (a slight push in).
 *                  Label 'pass 2: from the start' replaces pass 1's.
 *   10.32 past     the head has read one cell past the end of 'error': the whole matched span lights copper at once,
 *                  a little larger than its cells. The feed goes on; hold.
 * One accent: copper (the match). Head, ratchet and strip only ever move forward.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, PUPPET_NEAR_BLACK, defineShot, drawTracked, legibleSize, measureTracked, mixLab, softPlate, textProbe, textRole, textSwap, withAlpha } from '../../../film';
import { MAP, drawSearchMap, mapView, searchHallWall } from '../sets/ch09-s03-searchMap';
import { clamp01, lerp, seg, sm, smr, twos } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch09-s05';

// ---------------------------------------------------------------- the document (real, from the repo's generator)
/** documentAt(20261013, 2848): a logEvent, no defect, 160 code points (src/json-search/documents.ts) */
export const TEXT =
  '{"ts":"2026-12-16T17:23:47Z","level":"error","service":"search","msg":"connection reset by peer","durationMs":2315.84,"host":"search-4.internal","sampleRate":1}';
export const CHARS = [...TEXT];
export const N = CHARS.length;
export const CODES = CHARS.map((ch) => ch.codePointAt(0) ?? 0);
export const PATTERN = 'error';
/** every occurrence of the literal pattern (a literal's longest match is its occurrence), computed */
export const MATCHES: [number, number][] = (() => {
  const out: [number, number][] = [];
  let i = TEXT.indexOf(PATTERN);
  while (i >= 0) {
    out.push([i, i + PATTERN.length - 1]);
    i = TEXT.indexOf(PATTERN, i + PATTERN.length);
  }
  return out;
})();
const M0 = MATCHES[0][0];
const M1 = MATCHES[0][1];

// ---------------------------------------------------------------- geometry (L4 rest px)
export const HX = 640;
export const CW = 40;
const STRIP = { y0: 396, y1: 458 } as const;
const BENCH_Y = 520;
const GANTRY = { x0: 583, x1: 697, top: 292, bridge: 20 } as const;
export const RATCHET = { x: 742, y: 302, r: 40, teeth: 24 } as const;

interface Beats {
  D: number;
  quote: number;
  walks: number;
  start: number;
  known: number;
  /** pass 1 begins (cell 0 under the head) and ends (trailing cell past the head) */
  p1a: number;
  p1slow: number;
  p1b: number;
  /** the turnover */
  tA: number;
  tB: number;
  /** pass 2 begins (p = 0) and its rate (cells / s) */
  p2a: number;
  rate2: number;
}

/** pass 1 progress (cells read, continuous): fed in from the left (negative), slow on twos, then fast on ones */
function p1At(t: number, b: Beats): number {
  if (t < b.p1a) {
    // the strip slides in from the left until its leading cell meets the slot
    const u = smr((t - (b.p1a - 1.45)) / 1.4);
    return lerp(-9, -0.5, u);
  }
  if (t < b.p1slow) return 12 * (twos(t) - b.p1a) - 0.5 + 0.5;
  // accelerate (ones: a blur of cells) to the trailing cell past the head at p1b
  const p0 = 12 * (b.p1slow - b.p1a);
  const S = b.p1b - b.p1slow;
  const v0 = 12;
  const k = (N + 1 - p0 - v0 * S) / (S * S);
  const s = Math.min(t, b.p1b) - b.p1slow;
  return p0 + v0 * s + k * s * s;
}
function p1Speed(t: number, b: Beats): number {
  if (t < b.p1slow || t > b.p1b) return 0;
  const p0 = 12 * (b.p1slow - b.p1a);
  const S = b.p1b - b.p1slow;
  const k = (N + 1 - p0 - 12 * S) / (S * S);
  return 12 + 2 * k * (t - b.p1slow);
}
/** pass 2 progress: one cell per twos tick, timed so the cell after the match is under the head on 'past' */
function p2At(t: number, b: Beats): number {
  // once the head stands one cell past the match's end (on 'past') the feed stops and holds: the lit span stays in view
  const tt = Math.min(twos(t), b.known + 0.02);
  return Math.max(0, Math.min(N + 1, Math.floor(b.rate2 * (tt - b.p2a) + 1e-6) + 0.5));
}

// ---------------------------------------------------------------- camera
const CAM0: Camera3 = { x: 652, y: 392, z: 210, lens: 1 };
const CAM1: Camera3 = { x: 650, y: 394, z: 236, lens: 1 };
const CAM2: Camera3 = { x: 692, y: 404, z: 318, lens: 1 };
const CAM3: Camera3 = { x: 698, y: 405, z: 336, lens: 1 };
function camAt(t: number, b: Beats): Camera3 {
  const mix = (a: Camera3, z: Camera3, u: number): Camera3 => ({ x: lerp(a.x, z.x, u), y: lerp(a.y, z.y, u), z: lerp(a.z, z.z, u), lens: 1 });
  if (t < b.tA) return mix(CAM0, CAM1, sm(t / b.tA));
  if (t < b.start + 2.6) return mix(CAM1, CAM2, smr((t - b.tA) / (b.start + 2.6 - b.tA)));
  return mix(CAM2, CAM3, sm((t - b.start - 2.6) / Math.max(0.1, b.D - b.start - 2.6)));
}

/** the faint map behind the line of sight (L3 rest px): the same hall grain as s03b, every bead stepping */
const MAP_L3 = mapView(1180 / (MAP.cols * MAP.cw), (MAP.cols * MAP.cw) / 2, (MAP.rows * MAP.ch) / 2, { x: 640, y: 250 });

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const walks = T.beat('backward');
    const start = T.beat('forward');
    const known = T.beat('known');
    const p1a = walks - 0.05;
    const tA = p1a + 2.15;
    const tB = start - 0.1;
    // pass 2: cell 0 under the head on 'start'; the cell after the match under the head on 'past'
    const rate2 = (M1 + 1 - 0) / (known - start);
    const p2a = start - 0.5 / rate2;
    const b: Beats = { D: T.duration, quote: T.beat('quote'), walks, start, known, p1a, p1slow: p1a + 0.75, p1b: tA - 0.06, tA, tB, p2a, rate2 };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(t, b);
    f.camera(cam);
    f.backlight({ sunX: 640, sunY: 360, intensity: 0.85 });
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 1800, 900, (cc) => {
        cc.translate(260, 100);
        searchHallWall(cc, env);
      })(c, -260, -100);
    });
    f.fog('A');
    f.layer('L3', (c, env) => {
      drawSearchMap(f, c, env, MAP_L3, { slot: Math.floor(Math.max(0, tq) * 4) % 513, matches: 1, sweepX: 99999, key: ID, alpha: 0.5 });
    });
    f.fog({ yCenter: 300, height: 460, alpha: 0.2, drift: 6 });

    const st = stripState(t, b);
    f.layer('L4', (c, env) => {
      bench(f, c, env);
      gantryBack(c, env);
      drawStrip(c, env, st, t, b);
      gantryFront(c, env, st, t, b);
      ratchet(c, env, st, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // the head's reading lamp (the mood's own cyan; brightens as a cell is read)
    const lampK = 0.55 + 0.25 * st.pulse;
    f.practical({ x: HX, y: 352, kind: 'led', seed: 951, intensity: lampK, radius: 46, layer: 'L4' });
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 220, 1300, (cc) => {
        cc.translate(60, 260);
        cc.fillStyle = mixLab(env.fill('fg'), env.fill('set'), 0.25);
        cc.fillRect(-60, -260, 104, 1300);
        cc.fillRect(-70, 520, 126, 26);
        cc.strokeStyle = withAlpha(env.mood.rim, 0.16);
        cc.lineWidth = 2;
        cc.beginPath();
        cc.moveTo(43, -260);
        cc.lineTo(43, 520);
        cc.stroke();
      })(c, 330, -260);
    });
    passLabels(f, t, b);
  },
});

// ---------------------------------------------------------------- the strip's state
interface StripState {
  /** which pass: 1, 'turn' (in the air), 2 */
  phase: 1 | 'turn' | 2;
  /** cells read (continuous, cell j under the head when p in [j, j+1]) */
  p: number;
  /** motion smear (cells per frame, 0 = sharp) */
  smear: number;
  /** turnover u 0..1 */
  turn: number;
  /** 0..1 a cell has just been read (the lamp's pulse, on twos) */
  pulse: number;
  /** the ratchet's angle (radians, only increases) */
  ang: number;
  /** 0..1 the pawl lifted (the reset) */
  pawl: number;
}
const TOOTH = (Math.PI * 2) / RATCHET.teeth;
function stripState(t: number, b: Beats): StripState {
  const glintTooth = t >= b.quote + 0.12 ? 1 : 0;
  if (t < b.tA) {
    const p = p1At(t, b);
    const v = p1Speed(t, b);
    const read = Math.max(0, Math.floor(p + 0.5));
    return { phase: 1, p, smear: v / 24, turn: 0, pulse: t >= b.p1a && t < b.p1slow ? 1 - ((twos(t) * 12) % 1) : 0, ang: (glintTooth + read) * TOOTH, pawl: 0 };
  }
  const total1 = glintTooth + N + 1;
  if (t < b.tB) {
    const u = clamp01((twos(t) - b.tA) / (b.tB - b.tA));
    // the reset: the pawl lifts as the strip lowers and drops with one click; the wheel indexes FORWARD to its home
    const pawl = Math.sin(Math.PI * seg(u, 0.72, 0.98));
    const home = Math.ceil(total1 / RATCHET.teeth) * RATCHET.teeth;
    const ang = (u < 0.97 ? total1 : home) * TOOTH;
    return { phase: 'turn', p: N + 1, smear: 0, turn: u, pulse: 0, ang, pawl };
  }
  const home = Math.ceil(total1 / RATCHET.teeth) * RATCHET.teeth;
  const p = p2At(t, b);
  const ph = (twos(t) - b.p2a) * b.rate2;
  const feeding = t < b.known + 0.02;
  return { phase: 2, p, smear: 0, turn: 1, pulse: feeding ? Math.max(0, 1 - (ph - Math.floor(ph)) * 1.6) : 0, ang: (home + Math.floor(p)) * TOOTH, pawl: 0 };
}

// ---------------------------------------------------------------- painters
const paper = (env: PaintEnv) => mixLab(mixLab('#dfe9e4', env.mood.rim, 0.45), env.mood.haze, 0.16);
const slotInk = (env: PaintEnv) => mixLab('#18211f', env.mood.ink, 0.3);
const brass = (env: PaintEnv, k = 0) => mixLab(mixLab('#a8823e', env.mood.halo, 0.32), mixLab(env.mood.core, '#f3dfae', 0.5), k);
const copper = (env: PaintEnv, k = 0) => mixLab(mixLab('#c27a43', env.mood.halo, 0.12), '#ffd9a8', 0.5 * k);
function lw(c: C2, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}

/** the bench the head stands on: its top edge (rim-lit), its dark face, a guide rail the strip rides over */
function bench(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/bench/${env.mood.id}`, 2000, 320, (cc) => {
    cc.translate(360, -BENCH_Y + 10);
    const top = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.45);
    cc.fillStyle = top;
    cc.fillRect(-360, BENCH_Y - 10, 2000, 12);
    cc.fillStyle = mixLab(top, PUPPET_NEAR_BLACK, 0.5);
    cc.fillRect(-360, BENCH_Y + 2, 2000, 320);
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.35), 0.55);
    cc.lineWidth = 1.5;
    cc.beginPath();
    cc.moveTo(-360, BENCH_Y - 10);
    cc.lineTo(1640, BENCH_Y - 10);
    cc.stroke();
    // the guide rail under the strip, on little posts
    cc.fillStyle = mixLab(top, env.mood.ink, 0.3);
    cc.fillRect(-360, STRIP.y1 + 10, 2000, 5);
    for (let x = -340; x < 1640; x += 120) cc.fillRect(x, STRIP.y1 + 14, 6, BENCH_Y - STRIP.y1 - 24);
  })(c, -360, BENCH_Y - 10);
}

/** the gantry's back parts (behind the strip): the rear uprights and the bridge's shadow side */
function gantryBack(c: C2, env: PaintEnv) {
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.25);
  c.fillRect(GANTRY.x0 + 8, GANTRY.top + 8, 8, BENCH_Y - GANTRY.top - 8);
  c.fillRect(GANTRY.x1 - 16, GANTRY.top + 8, 8, BENCH_Y - GANTRY.top - 8);
}

/** one cell: a paper cell with its character cut out (light shows through) above its code point */
function cell(c: C2, env: PaintEnv, x: number, idx: number, mirror: boolean, read: number, head: number, mono: string, small: string) {
  const y0 = STRIP.y0, h = STRIP.y1 - STRIP.y0;
  const w = CW;
  // the paper
  c.fillStyle = paper(env);
  c.fillRect(x - w / 2, y0, w, h);
  if (read > 0) {
    c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.16 * read);
    c.fillRect(x - w / 2, y0, w, h);
  }
  if (head > 0) {
    c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.35), 0.34 * head);
    c.fillRect(x - w / 2, y0, w, h);
  }
  c.strokeStyle = withAlpha(slotInk(env), 0.3);
  c.lineWidth = lw(c, 1);
  c.strokeRect(x - w / 2 + 0.5, y0 + 0.5, w - 1, h - 1);
  const ch = CHARS[idx];
  c.save();
  c.translate(x, y0 + 26);
  if (mirror) c.scale(-1, 1);
  c.fillStyle = slotInk(env);
  c.font = mono;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText(ch, 0, 0);
  c.font = small;
  c.fillStyle = withAlpha(slotInk(env), 0.62);
  c.fillText(String(CODES[idx]), 0, 26);
  c.restore();
}

/** the strip at its state: pass 1 (front: text reads left to right, the last character leading at the right), the
 *  turnover (lifted, turned end for end, carried back over the head), pass 2 (its back: characters mirrored, the first
 *  character leading) */
function drawStrip(c: C2, env: PaintEnv, st: StripState, t: number, b: Beats) {
  const mono = `500 ${legibleSize(c, `500 22px ${FONT.mono}`, 22).toFixed(2)}px ${FONT.mono}`;
  const small = `400 11px ${FONT.mono}`;
  const leftX = -120, rightX = 1420;
  // the strip's shadow on the guide rail
  textRole(c, st.phase === 2 || st.phase === 1 ? 'subject' : 'texture', () => {
    if (st.phase === 1 || st.phase === 2) {
      const mirror = st.phase === 2;
      const p = st.p;
      // feed index j's centre x
      const xOf = (j: number) => HX + (p - j - 0.5) * CW;
      const jLo = Math.max(0, Math.ceil(p - 0.5 - (rightX - HX) / CW));
      const jHi = Math.min(N - 1, Math.floor(p - 0.5 + (HX - leftX) / CW));
      if (jHi < jLo) return;
      const xa = xOf(jHi) - CW / 2, xb = xOf(jLo) + CW / 2;
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
      c.fillRect(xa + 3, STRIP.y0 + 5, xb - xa, STRIP.y1 - STRIP.y0);
      const smear = Math.min(10, st.smear);
      const ghosts = smear > 0.4 ? 4 : 1;
      for (let g = ghosts - 1; g >= 0; g--) {
        c.save();
        c.globalAlpha *= ghosts > 1 ? (g === 0 ? 0.55 : 0.22) : 1;
        const dx = ghosts > 1 ? -g * (smear * CW) / ghosts : 0;
        c.translate(dx, 0);
        for (let j = jLo; j <= jHi; j++) {
          const idx = mirror ? j : N - 1 - j;
          const x = xOf(j);
          const read = p > j + 0.5 ? 1 : 0;
          const head = Math.max(0, 1 - Math.abs(x - HX) / (CW * 0.75));
          cell(c, env, x, idx, mirror, read, head, mono, small);
        }
        c.restore();
      }
      // the match, once the head has read past its end (pass 2 only): the whole span lights at once
      if (mirror && t >= b.known - 0.02) matchSpan(c, env, (i) => xOf(i), t, b);
      // pass 1: a faint copper-free 'read' wake is all; no marks of meaning
      return;
    }
    // the turnover: the visible chunk (the document's first cells, at the right of the head when pass 1 ends)
    const u = st.turn;
    const K = 18;
    const lift = 172 * smr(u / 0.32) * (1 - smr((u - 0.74) / 0.26));
    const flipU = smr((u - 0.3) / 0.44);
    const cx0 = HX + CW / 2 + ((K - 1) / 2) * CW;
    const cx1 = HX - CW / 2 - ((K - 1) / 2) * CW;
    const cx = lerp(cx0, cx1, smr((u - 0.24) / 0.56));
    const sx = Math.cos(Math.PI * flipU);
    c.save();
    c.translate(cx, -lift);
    // a little sag in the air (the far end hangs)
    c.rotate(0.02 * Math.sin(Math.PI * u));
    c.scale(Math.max(0.03, Math.abs(sx)), 1);
    const mirror = sx < 0;
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
    c.fillRect(-(K / 2) * CW + 4, STRIP.y0 + 8, K * CW, STRIP.y1 - STRIP.y0);
    for (let i = 0; i < K; i++) {
      // before the flip: index i at local x (i - (K-1)/2) * CW, the document reading left to right
      const lx = (i - (K - 1) / 2) * CW;
      cell(c, env, mirror ? -lx : lx, i, mirror, 1, 0, mono, small);
    }
    // the paper's edge catching the light as it turns edge-on
    if (Math.abs(sx) < 0.3) {
      c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6 * (1 - Math.abs(sx) / 0.3));
      c.fillRect(-(K / 2) * CW, STRIP.y0 - 1, K * CW, 2);
    }
    c.restore();
    // the strip's tail still runs off frame right (it is long): a soft ribbon rising out of frame with the chunk
    if (u < 0.3) {
      c.save();
      c.globalAlpha *= 1 - u / 0.3;
      c.fillStyle = paper(env);
      c.fillRect(HX + CW / 2 + K * CW, STRIP.y0 - lift, 600, STRIP.y1 - STRIP.y0);
      c.restore();
    }
    void t;
    void b;
  });
}

/** the matched span lights copper at once, a little larger than its cells (drawn over the strip) */
function matchSpan(c: C2, env: PaintEnv, xOf: (j: number) => number, t: number, b: Beats) {
  const u = clamp01((t - b.known + 0.02) / 0.12);
  const flare = Math.exp(-Math.max(0, t - b.known) * 2.2);
  for (const [a, z] of MATCHES) {
    const xa = xOf(z) - CW / 2, xb = xOf(a) + CW / 2;
    const pad = 4 + 3 * flare;
    const y0 = STRIP.y0 - pad, y1 = STRIP.y1 + pad;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient((xa + xb) / 2, (y0 + y1) / 2, 4, (xa + xb) / 2, (y0 + y1) / 2, (xb - xa) * 0.9);
    g.addColorStop(0, withAlpha(copper(env, 1), 0.5 * u * (0.5 + 0.5 * flare)));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(xa - 120, y0 - 100, xb - xa + 240, y1 - y0 + 200);
    c.restore();
    c.save();
    c.globalAlpha *= u;
    c.fillStyle = withAlpha(copper(env, 0.6), 0.42);
    c.fillRect(xa - pad, y0, xb - xa + 2 * pad, y1 - y0);
    c.strokeStyle = copper(env, 0.9);
    c.lineWidth = Math.max(lw(c, 2.4), 1.6);
    c.strokeRect(xa - pad, y0, xb - xa + 2 * pad, y1 - y0);
    c.restore();
  }
}

/** the gantry's front: uprights, the bridge, the reading window round the cell under the head, rollers */
function gantryFront(c: C2, env: PaintEnv, st: StripState, t: number, b: Beats) {
  const ink = PUPPET_NEAR_BLACK;
  const rimC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.45), 0.8);
  c.fillStyle = ink;
  // uprights (front), feet on the bench
  c.fillRect(GANTRY.x0, GANTRY.top, 12, BENCH_Y - GANTRY.top);
  c.fillRect(GANTRY.x1 - 12, GANTRY.top, 12, BENCH_Y - GANTRY.top);
  c.fillRect(GANTRY.x0 - 10, BENCH_Y - 10, 32, 10);
  c.fillRect(GANTRY.x1 - 22, BENCH_Y - 10, 32, 10);
  // the bridge, with a pierced band of round holes (backlight through)
  const br = new Path2D();
  br.rect(GANTRY.x0 - 14, GANTRY.top, GANTRY.x1 - GANTRY.x0 + 28, GANTRY.bridge);
  for (let i = 0; i < 7; i++) {
    const hx = GANTRY.x0 + 6 + i * ((GANTRY.x1 - GANTRY.x0 - 12) / 6);
    br.moveTo(hx + 3, GANTRY.top + 10);
    br.arc(hx, GANTRY.top + 10, 3, 0, Math.PI * 2);
  }
  c.fill(br, 'evenodd');
  // the lamp housing on the bridge and its stem to the reading window
  c.fillRect(HX - 4, GANTRY.top + GANTRY.bridge, 8, 40);
  c.beginPath();
  c.moveTo(HX - 22, 360);
  c.lineTo(HX + 22, 360);
  c.lineTo(HX + 14, 344);
  c.lineTo(HX - 14, 344);
  c.closePath();
  c.fill();
  // the reading window: a brass frame round the cell under the head (open in the middle: the cell shows)
  const wx0 = HX - CW / 2 - 5, wx1 = HX + CW / 2 + 5, wy0 = STRIP.y0 - 9, wy1 = STRIP.y1 + 9;
  const win = new Path2D();
  win.rect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  win.rect(wx0 + 5, wy0 + 6, wx1 - wx0 - 10, wy1 - wy0 - 12);
  c.fillStyle = brass(env, 0.15 + 0.3 * st.pulse);
  c.fill(win, 'evenodd');
  c.strokeStyle = withAlpha(brass(env, 0.8), 0.9);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.moveTo(wx0, wy0);
  c.lineTo(wx1, wy0);
  c.stroke();
  // rollers at the slot's mouths (above and below the strip), turning with the feed (a spoke mark)
  const rot = st.p * 0.9;
  for (const x of [GANTRY.x0 + 6, GANTRY.x1 - 6]) {
    for (const y of [STRIP.y0 - 8, STRIP.y1 + 8]) {
      c.fillStyle = ink;
      c.beginPath();
      c.arc(x, y, 8, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha(brass(env, 0.4), 0.8);
      c.lineWidth = lw(c, 1.4);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(rot + y) * 6.5, y + Math.sin(rot + y) * 6.5);
      c.stroke();
    }
  }
  // top rims
  c.strokeStyle = rimC;
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(GANTRY.x0 - 14, GANTRY.top + 0.5);
  c.lineTo(GANTRY.x1 + 14, GANTRY.top + 0.5);
  c.stroke();
  void t;
  void b;
}

/** the one-way ratchet on the head's side: saw teeth (one tooth a cell), a pierced brass disc, the pawl; on 'program'
 *  a glint runs round the teeth */
function ratchet(c: C2, env: PaintEnv, st: StripState, t: number, b: Beats) {
  const { x, y, r, teeth } = RATCHET;
  // the axle bracket from the upright
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(GANTRY.x1 - 4, y - 5, x - GANTRY.x1 + 4, 10);
  c.save();
  c.translate(x, y);
  c.rotate(st.ang);
  const p = new Path2D();
  const ri = r * 0.84;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * TOOTH, a1 = (i + 1) * TOOTH;
    // a saw tooth: rises slowly, drops sharply (it turns one way: clockwise)
    const ax = Math.cos(a0) * ri, ay = Math.sin(a0) * ri;
    const bx = Math.cos(a1 - 0.02) * r, by = Math.sin(a1 - 0.02) * r;
    if (i === 0) p.moveTo(ax, ay);
    else p.lineTo(ax, ay);
    p.lineTo(bx, by);
    p.lineTo(Math.cos(a1) * ri, Math.sin(a1) * ri);
  }
  p.closePath();
  // pierced: six round holes and the hub hole
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const hx = Math.cos(a) * r * 0.5, hy = Math.sin(a) * r * 0.5;
    p.moveTo(hx + r * 0.16, hy);
    p.arc(hx, hy, r * 0.16, 0, Math.PI * 2);
  }
  p.moveTo(r * 0.09, 0);
  p.arc(0, 0, r * 0.09, 0, Math.PI * 2);
  c.fillStyle = brass(env, 0.05);
  c.fill(p, 'evenodd');
  c.strokeStyle = withAlpha(mixLab(brass(env, 0), PUPPET_NEAR_BLACK, 0.5), 0.7);
  c.lineWidth = lw(c, 1);
  c.stroke(p);
  // the home mark (a notch filled dark at one tooth): shows the wheel turning
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(r * 0.72, 0, 2.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // the glint on 'program': a short warm arc running round the teeth (additive)
  const gu = (t - (b.quote - 0.05)) / 0.6;
  if (gu > 0 && gu < 1) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(mixLab(env.mood.core, '#fff2d0', 0.45), 0.85 * Math.sin(Math.PI * gu));
    c.lineWidth = lw(c, 3);
    c.lineCap = 'round';
    const a0 = -Math.PI * 0.95 + gu * Math.PI * 1.4;
    c.beginPath();
    c.arc(x, y, r - 1, a0, a0 + 0.7);
    c.stroke();
    c.restore();
  }
  // a top-edge rim on the wheel
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.arc(x, y, r + 0.5, -Math.PI * 0.85, -Math.PI * 0.15);
  c.stroke();
  // the pawl: a dark lever from the bridge's end, its tip in the teeth at the wheel's top; lifts at the reset
  const pv = { x: x - r * 0.95, y: y - r * 1.25 };
  const lift = 0.32 * st.pawl;
  c.save();
  c.translate(pv.x, pv.y);
  c.rotate(-lift);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(-4, -3);
  c.lineTo(r * 1.0, r * 0.36);
  c.lineTo(r * 0.92, r * 0.48);
  c.lineTo(-4, 4);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(0, 0, 5, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // the click: a small flash where the pawl drops into a tooth at the reset
  if (st.phase === 'turn' && st.turn > 0.9) {
    const k = 1 - (st.turn - 0.9) / 0.1;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const px = x + r * 0.05, py = y - r * 0.85;
    const g = c.createRadialGradient(px, py, 0, px, py, 16);
    g.addColorStop(0, withAlpha(env.mood.core, 0.7 * k));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(px - 16, py - 16, 32, 32);
    c.restore();
  }
}

/** 'pass 1: from the end' (backward -> forward), then 'pass 2: from the start' (lower left, on a soft plate) */
function passLabels(f: Frame, t: number, b: Beats) {
  const sw = textSwap(t, b.start - 0.05, 0.35);
  const a1 = seg(t, b.walks - 0.1, b.walks + 0.25) * sw.out;
  const a2 = sw.in;
  const one = (text: string, a: number, id: string) => {
    if (a <= 0.01) return;
    const c = f.c;
    textRole(c, 'subject', () => {
      c.save();
      const size = legibleSize(c, `italic 500 30px ${FONT.text}`, 30);
      const o = { font: `italic 500 ${size}px ${FONT.text}`, size, tracking: 0.02, align: 'left' as const };
      const w = measureTracked(c, text, o);
      c.globalAlpha = a;
      softPlate(c, 76 + w / 2, 598, w + 130, size + 56, f.mood.ink, 0.55);
      c.fillStyle = mixLab('#e6eeea', f.mood.core, 0.2);
      drawTracked(c, text, 76, 607, o);
      textProbe(c, id, 76, 607 - size, w, size * 1.2, a);
      c.restore();
    });
  };
  one('pass 1: from the end', a1, `${ID}-pass1`);
  one('pass 2: from the start', a2, `${ID}-pass2`);
}
