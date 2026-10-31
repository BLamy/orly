/**
 * Study and office props (real size at s = 1, y = the table/floor surface).
 *
 *   books({ x, y, mode?: 'stack'|'row'|'open', count?, seed?, turn?: 0..1 (open: page turn),
 *           tone?: 'ink'|'paper' (page colour) })            anchors: top, left, right (open: page centres)
 *   papers({ x, y, mode?: 'loose'|'flying', count?, seed?, time?: s since release (default env.t),
 *            wind?: cm/s (40), tone?: 'ink'|'paper' })      anchors: top. flying sheets tumble deterministically
 *   quillInkwell({ x, y, quill?: 'well'|'lying'|'none', angle?: rad })  anchors: nib, feather, well
 *   typewriter({ x, y, carriage?: 0..1, typing?: 0..1, paper?: 0..1 (sheet height), seed? })
 *       front view. anchors: paper (top of sheet), platen, keys
 *   rotaryPhone({ x, y, lifted?: 0..1, dial?: 0..1 (dial plate rotation) })  anchors: earpiece, dial, cradle
 *   chalkboard({ x, y, w?: 140, h?: 90, stand?: 'easel'|'wall', smudge?: 0..1, seed? })
 *       easel: y = floor; wall: y = chalk-tray line. anchors: areaTL, areaBR, centre, tray
 *   slideRule({ x, y, slide?: cm (-12..12), cursor?: 0..1 })  real log-scale ticks. anchors: cursor, centre
 *   clipboard({ x, y, lines?: 14, angle?: rad })               y = bottom edge. anchors: paperTL, paperBR, clip
 *   punchCards({ x, y, mode?: 'single'|'deck'|'fan', count?, holes?: number[] (80 × 12-bit columns), seed? })
 *       IBM 80-column cards. anchors: card (centre of the top card), corner
 */
import type { PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import {
  type PropAt,
  bar,
  circle,
  cut,
  defineProp,
  ellipse,
  fillInk,
  hash,
  inkLift,
  lathe,
  memo,
  paper,
  poly,
  rect,
  rrect,
  veil,
} from './_kit';
import { mulberry32 } from '../../../core';

const tone = (env: PaintEnv, t: 'ink' | 'paper' | undefined, a = 1) => (t === 'paper' ? paper(env, a) : env.fill('ink'));

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------
export interface BooksOpts extends PropAt {
  mode?: 'stack' | 'row' | 'open';
  count?: number;
  seed?: number;
  turn?: number;
  tone?: 'ink' | 'paper';
}

function stackGeom(n: number, seed: number) {
  return memo(`books:stack:${n}:${seed}`, () => {
    const r = mulberry32(seed * 977 + 3);
    const body = new Path2D();
    const pages = new Path2D();
    const cl = new Path2D();
    let y = 0;
    const tops: number[] = [];
    for (let i = 0; i < n; i++) {
      const w = 17 + r() * 12;
      const t = 2 + r() * 3.4;
      const x = (r() - 0.5) * 4;
      const foreEdge = r() < 0.35;
      if (foreEdge) {
        // fore-edge toward us: two boards and a page block
        rrect(body, x - w / 2, y - t, w, 0.45, 0.2);
        rrect(body, x - w / 2, y - 0.45, w, 0.45, 0.2);
        rect(pages, x - w / 2 + 0.35, y - t + 0.45, w - 0.7, t - 0.9);
        for (let k = 1; k < 4; k++) {
          cl.moveTo(x - w / 2 + 0.8, y - t + (t * k) / 4);
          cl.lineTo(x + w / 2 - 0.8, y - t + (t * k) / 4);
        }
      } else {
        // spine toward us: rounded spine with raised bands and a label
        rrect(body, x - w / 2, y - t, w, t, Math.min(0.8, t / 2.5));
        for (const u of [0.12, 0.2, 0.8, 0.88]) {
          cl.moveTo(x - w / 2 + w * u, y - t + 0.3);
          cl.lineTo(x - w / 2 + w * u, y - 0.3);
        }
        cl.rect(x - w * 0.18, y - t * 0.72, w * 0.36, t * 0.44);
      }
      y -= t;
      tops.push(y);
    }
    return { body, pages, cl, top: y };
  });
}

function rowGeom(n: number, seed: number) {
  return memo(`books:row:${n}:${seed}`, () => {
    const r = mulberry32(seed * 131 + 7);
    const body = new Path2D();
    const cl = new Path2D();
    let x = 0;
    const widths: number[] = [];
    for (let i = 0; i < n; i++) widths.push(2 + r() * 4.2);
    const total = widths.reduce((a, b) => a + b, 0);
    x = -total / 2;
    let maxH = 0;
    widths.forEach((w, i) => {
      const h = 20 + r() * 10;
      maxH = Math.max(maxH, h);
      const lean = i === n - 1 && r() < 0.8 ? -0.22 : 0;
      const m = new DOMMatrix().translate(x + (lean ? w : 0), 0).rotate((lean * 180) / Math.PI);
      const b = new Path2D();
      rrect(b, lean ? -w : 0, -h, w, h, 0.35);
      body.addPath(b, m);
      const c2 = new Path2D();
      for (const u of [0.1, 0.16, 0.84, 0.9]) {
        c2.moveTo((lean ? -w : 0) + 0.3, -h * u);
        c2.lineTo((lean ? -w : 0) + w - 0.3, -h * u);
      }
      c2.rect((lean ? -w : 0) + w * 0.22, -h * 0.66, w * 0.56, h * 0.2);
      cl.addPath(c2, m);
      x += w + 0.15;
    });
    return { body, cl, total, maxH };
  });
}

export const books = defineProp<BooksOpts, 'top' | 'left' | 'right'>(
  (c, o, env) => {
    const mode = o.mode ?? 'stack';
    const seed = o.seed ?? 1;
    if (mode === 'stack') {
      const G = stackGeom(o.count ?? 4, seed);
      c.fillStyle = o.tone === 'paper' ? paper(env, 0.9) : mixLab(env.fill('ink'), env.mood.set, 0.22);
      c.fill(G.pages);
      fillInk(c, env, G.body);
      cut(c, env, G.cl, 0.3, 1);
      return;
    }
    if (mode === 'row') {
      const G = rowGeom(o.count ?? 9, seed);
      fillInk(c, env, G.body);
      cut(c, env, G.cl, 0.28, 1);
      return;
    }
    // open book, seen from the front at a low angle; a page turns over the gutter
    const W = 16;
    const t = 2.4;
    const ink = env.fill('ink');
    const cov = new Path2D();
    rrect(cov, -W - 0.8, -0.7, 2 * W + 1.6, 0.7, 0.3);
    c.fillStyle = ink;
    c.fill(cov);
    const block = memo('books:open', () => {
      const p = new Path2D();
      p.moveTo(-W, -0.6);
      p.lineTo(-W, -t);
      p.bezierCurveTo(-W * 0.7, -t - 2.4, -W * 0.25, -t - 2.2, 0, -t + 0.2);
      p.bezierCurveTo(W * 0.25, -t - 2.2, W * 0.7, -t - 2.4, W, -t);
      p.lineTo(W, -0.6);
      p.closePath();
      const lines = new Path2D();
      for (let k = 1; k < 4; k++) {
        const yy = -0.6 - ((t - 0.6) * k) / 4;
        lines.moveTo(-W + 0.4, yy);
        lines.lineTo(-1.2, yy + 0.3);
        lines.moveTo(1.2, yy + 0.3);
        lines.lineTo(W - 0.4, yy);
      }
      return { p, lines };
    });
    c.fillStyle = tone(env, o.tone, 0.95);
    c.fill(block.p);
    if (o.tone === 'paper') {
      c.save();
      c.strokeStyle = withAlpha(ink, 0.25);
      c.lineWidth = 0.08;
      c.stroke(block.lines);
      c.restore();
    } else cut(c, env, block.lines, 0.2, 0.9);
    const turn = o.turn ?? 0;
    if (turn > 0.001 && turn < 0.999) {
      // the leaf: rotates about the gutter, bowing more mid-turn
      const th = Math.PI * (1 - turn); // starts flat on the right (0) -> ends on the left (π)
      const L = W * 0.98;
      const gx = 0;
      const gy = -t + 0.1;
      const tip = { x: gx + Math.cos(th) * L, y: gy - Math.sin(th) * L * 0.92 };
      const bow = Math.sin(Math.PI * turn) * 3.2;
      const nx = -Math.sin(th);
      const ny = -Math.cos(th);
      const mid = { x: (gx + tip.x) / 2 + nx * bow * (turn < 0.5 ? 1 : -1) * 0.6, y: (gy + tip.y) / 2 + ny * bow * 0.6 - bow * 0.4 };
      const leaf = new Path2D();
      leaf.moveTo(gx, gy);
      leaf.quadraticCurveTo(mid.x, mid.y, tip.x, tip.y);
      leaf.lineTo(tip.x + 0.25, tip.y + 0.35);
      leaf.quadraticCurveTo(mid.x + 0.25, mid.y + 0.45, gx + 0.3, gy + 0.2);
      leaf.closePath();
      c.fillStyle = tone(env, o.tone, 1);
      c.fill(leaf);
      c.save();
      c.strokeStyle = ink;
      c.lineWidth = 0.12;
      c.stroke(leaf);
      c.restore();
    }
  },
  (o) => {
    if (o.mode === 'open') return { top: { x: 0, y: -4.6 }, left: { x: -8, y: -4.2 }, right: { x: 8, y: -4.2 } };
    if (o.mode === 'row') {
      const G = rowGeom(o.count ?? 9, o.seed ?? 1);
      return { top: { x: 0, y: -G.maxH }, left: { x: -G.total / 2, y: -G.maxH / 2 }, right: { x: G.total / 2, y: -G.maxH / 2 } };
    }
    const G = stackGeom(o.count ?? 4, o.seed ?? 1);
    return { top: { x: 0, y: G.top }, left: { x: -12, y: G.top / 2 }, right: { x: 12, y: G.top / 2 } };
  },
  (o) => {
    if (o.mode === 'open') return { x: -17, y: -20, w: 34, h: 20 };
    if (o.mode === 'row') {
      const G = rowGeom(o.count ?? 9, o.seed ?? 1);
      return { x: -G.total / 2 - 2, y: -G.maxH, w: G.total + 4, h: G.maxH };
    }
    const G = stackGeom(o.count ?? 4, o.seed ?? 1);
    return { x: -17, y: G.top, w: 34, h: -G.top };
  },
);

// ---------------------------------------------------------------------------
// Papers
// ---------------------------------------------------------------------------
export interface PapersOpts extends PropAt {
  mode?: 'loose' | 'flying';
  count?: number;
  seed?: number;
  time?: number;
  wind?: number;
  tone?: 'ink' | 'paper';
}

function sheet(w: number, h: number, curl: number) {
  const p = new Path2D();
  p.moveTo(-w / 2, -h / 2);
  p.quadraticCurveTo(0, -h / 2 - curl, w / 2, -h / 2);
  p.quadraticCurveTo(w / 2 + curl * 0.6, 0, w / 2, h / 2);
  p.quadraticCurveTo(0, h / 2 - curl, -w / 2, h / 2);
  p.quadraticCurveTo(-w / 2 + curl * 0.6, 0, -w / 2, -h / 2);
  p.closePath();
  return p;
}

export const papers = defineProp<PapersOpts, 'top'>(
  (c, o, env) => {
    const seed = o.seed ?? 2;
    const n = o.count ?? (o.mode === 'flying' ? 7 : 6);
    const col = tone(env, o.tone, 0.95);
    if (o.mode !== 'flying') {
      // a messy pile seen from slightly above: squashed, rotated sheets with hairline edges
      for (let i = 0; i < n; i++) {
        const a = (hash(i, seed) - 0.5) * 0.5;
        c.save();
        c.translate((hash(i, seed + 1) - 0.5) * 6, -0.15 * i - 1.6);
        c.scale(1, 0.24);
        c.rotate(a);
        const s = sheet(21, 29.7, 0.4);
        c.fillStyle = col;
        c.fill(s);
        c.strokeStyle = o.tone === 'paper' ? withAlpha(env.fill('ink'), 0.35) : withAlpha(env.mood.rim, 0.3);
        c.lineWidth = 0.12;
        c.stroke(s);
        c.restore();
      }
      return;
    }
    const tau = o.time ?? env.t;
    const wind = o.wind ?? 40;
    for (let i = 0; i < n; i++) {
      const h1 = hash(i, seed);
      const h2 = hash(i, seed + 3);
      const h3 = hash(i, seed + 5);
      const tt = Math.max(0, tau - h1 * 0.6);
      const x = (h2 - 0.5) * 20 + wind * tt * (0.6 + 0.8 * h3) + Math.sin(tt * (1.3 + h2) + h1 * 6) * 9;
      const y = -6 - tt * (26 + 30 * h2) + tt * tt * (5 + 6 * h1) + Math.cos(tt * (1.7 + h3) + h2 * 5) * 5;
      const spin = (0.8 + 1.4 * h3) * (h1 < 0.5 ? 1 : -1);
      const flipY = Math.cos(tt * spin * 2 + h2 * 6);
      c.save();
      c.translate(x, y);
      c.rotate(Math.sin(tt * (0.9 + h1) + h3 * 6) * 0.9 + h2);
      c.scale(1, Math.abs(flipY) < 0.08 ? 0.08 * Math.sign(flipY || 1) : flipY);
      const s = sheet(21 * (0.8 + 0.3 * h1), 29.7 * (0.8 + 0.3 * h1), 2.2 * Math.sin(tt * 3 + i));
      c.fillStyle = col;
      c.fill(s);
      if (o.tone === 'paper') {
        c.strokeStyle = withAlpha(env.fill('ink'), 0.18);
        c.lineWidth = 0.18;
        c.beginPath();
        for (let k = 0; k < 9; k++) {
          c.moveTo(-7, -11 + k * 2.6);
          c.lineTo(5 + 2 * hash(k, i), -11 + k * 2.6);
        }
        c.stroke();
      }
      c.restore();
    }
  },
  () => ({ top: { x: 0, y: -3 } }),
  (o) => (o.mode === 'flying' ? { x: -40, y: -200, w: 300, h: 200 } : { x: -16, y: -6, w: 32, h: 6 }),
);

// ---------------------------------------------------------------------------
// Quill and inkwell
// ---------------------------------------------------------------------------
export interface QuillOpts extends PropAt {
  quill?: 'well' | 'lying' | 'none';
  angle?: number;
}

function quillPath() {
  return memo('quill', () => {
    // feather along +x from the nib (0,0) to the tip (L,0); trailing vane on +y side (drawn below, then rotated)
    const L = 30;
    const top: { x: number; y: number }[] = [];
    const bot: { x: number; y: number }[] = [];
    const N = 46;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = u * L;
      const bend = Math.sin(u * Math.PI) * 1.6 * u; // gentle curve of the rachis
      const vane = u < 0.3 ? 0 : Math.sin(Math.min(1, (u - 0.3) / 0.62) * Math.PI * 0.55 + 0.05) * (1 - Math.pow(Math.max(0, (u - 0.75) / 0.25), 2));
      const lead = 0.2 + vane * 1.1;
      let trail = 0.2 + vane * 2.7;
      // barb splits: notches in the trailing vane
      for (const nu of [0.52, 0.63, 0.77, 0.86]) if (Math.abs(u - nu) < 0.012) trail *= 0.45;
      top.push({ x, y: -bend - lead });
      bot.push({ x: x - vane * 0.8, y: -bend + trail });
    }
    const p = new Path2D();
    p.moveTo(0, 0);
    for (const q of top) p.lineTo(q.x, q.y);
    for (let i = bot.length - 1; i >= 0; i--) p.lineTo(bot[i].x, bot[i].y);
    p.closePath();
    // nib: the calamus tapers to a split point
    const nib = new Path2D();
    poly(nib, [-2.2, 0, 0.2, -0.24, 0.2, 0.24]);
    const rach = new Path2D();
    rach.moveTo(9, -Math.sin((9 / L) * Math.PI) * 1.6 * (9 / L));
    for (let i = 10; i <= 29; i++) rach.lineTo(i, -Math.sin((i / L) * Math.PI) * 1.6 * (i / L));
    // fine barbs as cut-lines on the trailing vane
    const barbs = new Path2D();
    for (let i = 11; i < 27; i += 1.3) {
      const by = -Math.sin((i / L) * Math.PI) * 1.6 * (i / L);
      barbs.moveTo(i, by + 0.2);
      barbs.lineTo(i - 1.2, by + 1.8);
    }
    return { p, nib, rach, barbs, L };
  });
}

export const quillInkwell = defineProp<QuillOpts, 'nib' | 'feather' | 'well'>(
  (c, o, env) => {
    const well = memo('inkwell', () => {
      const p = new Path2D();
      // saucer + squat cut-glass well with a collar and a hinged lid tipped back
      lathe([[6.4, 0, 1], [6.6, -0.5], [6.2, -0.9, 1], [3.9, -0.9, 1]], 0, p);
      lathe([[3.9, -0.8, 1], [4.1, -1.6], [4.1, -3.4], [3.4, -4.4], [1.9, -5.0], [1.3, -5.3, 1], [1.3, -6.0, 1], [1.7, -6.2, 1], [1.7, -6.7, 1]], 0, p);
      const lid = new Path2D();
      lid.moveTo(1.7, -6.7);
      lid.lineTo(2.4, -7.0);
      lid.quadraticCurveTo(3.8, -9.6, 3.1, -10.1);
      lid.lineTo(2.4, -9.9);
      lid.quadraticCurveTo(2.6, -8.2, 1.4, -6.8);
      lid.closePath();
      p.addPath(lid);
      const cl = new Path2D();
      for (const x of [-2.6, -0.9, 0.9, 2.6]) {
        cl.moveTo(x, -1.2);
        cl.lineTo(x * 1.1, -3.4);
      }
      return { p, cl };
    });
    fillInk(c, env, well.p);
    cut(c, env, well.cl, 0.3, 1);
    const q = o.quill ?? 'well';
    if (q === 'none') return;
    const Q = quillPath();
    c.save();
    if (q === 'well') {
      c.translate(0.4, -4.2);
      c.rotate(o.angle ?? -1.16);
    } else {
      c.translate(7, -0.35);
      c.rotate(o.angle ?? -0.03);
    }
    fillInk(c, env, Q.p);
    fillInk(c, env, Q.nib);
    cut(c, env, Q.rach, 0.35, 1.1);
    cut(c, env, Q.barbs, 0.18, 0.8);
    c.restore();
  },
  (o) => {
    const q = o.quill ?? 'well';
    const a = o.angle ?? (q === 'well' ? -1.16 : -0.03);
    const base = q === 'well' ? { x: 0.4, y: -4.2 } : { x: 7, y: -0.35 };
    return {
      nib: q === 'well' ? { x: 0, y: -4 } : { x: base.x - 2.2, y: base.y },
      feather: { x: base.x + Math.cos(a) * 26, y: base.y + Math.sin(a) * 26 },
      well: { x: 0, y: -6.7 },
    };
  },
  () => ({ x: -7, y: -30, w: 40, h: 30 }),
);

// ---------------------------------------------------------------------------
// Typewriter (front view, 1930s portable/standard)
// ---------------------------------------------------------------------------
export interface TypewriterOpts extends PropAt {
  carriage?: number;
  typing?: number;
  paper?: number;
  seed?: number;
}

function typewriterBody() {
  return memo('tw:body', () => {
    const p = new Path2D();
    // body: rubber feet, curved shoulders, the typebar segment cut-out in the top
    for (const x of [-14, 12]) rrect(p, x, -0.9, 2.2, 0.9, 0.3);
    p.moveTo(-16.5, -0.9);
    p.lineTo(16.5, -0.9);
    p.quadraticCurveTo(17.4, -5, 16.4, -9.4);
    p.quadraticCurveTo(15.6, -13.2, 12.6, -13.6);
    p.lineTo(-12.6, -13.6);
    p.quadraticCurveTo(-15.6, -13.2, -16.4, -9.4);
    p.quadraticCurveTo(-17.4, -5, -16.5, -0.9);
    p.closePath();
    const basket = new Path2D();
    basket.moveTo(-8.6, -13.6);
    basket.quadraticCurveTo(0, -6.4, 8.6, -13.6);
    basket.closePath();
    // typebars fanning in the basket
    const bars = new Path2D();
    for (let k = -9; k <= 9; k++) {
      const a = (k / 9) * 1.05;
      bars.moveTo(Math.sin(a) * 6.6, -13.4 + (1 - Math.cos(a)) * 0.5);
      bars.lineTo(Math.sin(a) * 2.2, -10.9);
    }
    // key rows: round keys on stems (stems from the body front)
    const keys: Array<{ x: number; y: number; r: number }> = [];
    const rows = [
      { y: -2.6, n: 11, x0: -11.4, dx: 2.2 },
      { y: -4.2, n: 11, x0: -12.4, dx: 2.2 },
      { y: -5.8, n: 11, x0: -11.8, dx: 2.2 },
      { y: -7.4, n: 11, x0: -12.6, dx: 2.2 },
    ];
    for (const r of rows) for (let i = 0; i < r.n; i++) keys.push({ x: r.x0 + i * r.dx + 1.1, y: r.y, r: 0.78 });
    const space = new Path2D();
    rrect(space, -7.5, -1.4, 15, 0.9, 0.45);
    rect(space, -6, -0.9, 0.4, 0.6);
    rect(space, 5.6, -0.9, 0.4, 0.6);
    const cl = new Path2D();
    cl.moveTo(-15.8, -10.4);
    cl.quadraticCurveTo(0, -9.6, 15.8, -10.4);
    return { p, basket, bars, keys, space, cl };
  });
}

function carriagePath() {
  return memo('tw:carriage', () => {
    const p = new Path2D();
    // carriage frame + platen with knobs, paper bail, return lever (left); rails down to the body
    rect(p, -19, -17.4, 38, 2.0);
    rect(p, -12, -15.6, 24, 2.2);
    poly(p, [-17, -15.4, -12, -15.4, -12, -13.4, -14.6, -13.4]);
    poly(p, [17, -15.4, 12, -15.4, 12, -13.4, 14.6, -13.4]);
    rrect(p, -18, -21.2, 36, 3.8, 1.9);
    for (const sx of [-1, 1]) {
      rrect(p, sx * 18 - (sx < 0 ? 2.6 : 0), -21.8, 2.6, 4.8, 1.0);
      rrect(p, sx * 20.4 - (sx < 0 ? 1.6 : 0) + (sx < 0 ? -0.2 : 0.2), -21.0, 1.6, 3.2, 0.6);
    }
    // return lever: a bent arm rising from the left end
    p.moveTo(-19.6, -19.4);
    p.quadraticCurveTo(-24.6, -21.2, -25.8, -26.4);
    p.lineTo(-25.0, -26.7);
    p.quadraticCurveTo(-23.8, -22.4, -19.6, -20.6);
    p.closePath();
    rrect(p, -27, -28.2, 2.6, 1.8, 0.8);
    // paper bail rod with rollers
    rect(p, -14, -22.4, 28, 0.35);
    for (const x of [-6, 6]) rrect(p, x - 0.6, -22.7, 1.2, 0.9, 0.4);
    const cl = new Path2D();
    for (const x of [-16.6, 16.6]) {
      cl.moveTo(x, -21);
      cl.lineTo(x, -17.6);
    }
    cl.moveTo(-17.4, -19.3);
    cl.lineTo(17.4, -19.3);
    return { p, cl };
  });
}

export const typewriter = defineProp<TypewriterOpts, 'paper' | 'platen' | 'keys'>(
  (c, o, env) => {
    const B = typewriterBody();
    const C = carriagePath();
    const ink = env.fill('ink');
    const off = -((o.carriage ?? 0.3) - 0.5) * 16;
    // paper (behind the platen), rising by `paper`
    const ph = 8 + 18 * (o.paper ?? 0.7);
    c.save();
    c.translate(off, 0);
    const sh = new Path2D();
    sh.moveTo(-10.5, -20);
    sh.lineTo(-10.5, -20 - ph);
    sh.quadraticCurveTo(-10.2, -20 - ph - 1.4, -9.2, -20 - ph - 1.2);
    sh.lineTo(10.5, -20 - ph - 0.6);
    sh.lineTo(10.5, -20);
    sh.closePath();
    c.fillStyle = paper(env, 0.92);
    c.fill(sh);
    // typed lines on the sheet (fake text bars)
    c.fillStyle = withAlpha(ink, 0.35);
    const lines = Math.floor(ph / 1.6) - 2;
    for (let k = 0; k < lines; k++) {
      const yy = -20 - ph + 2.2 + k * 1.6;
      const len = 8 + 9 * hash(k, o.seed ?? 4);
      c.fillRect(-8.6, yy, len, 0.5);
    }
    c.fillStyle = ink;
    c.fill(C.p);
    cut(c, env, C.cl, 0.32, 1);
    c.restore();
    // body with the pierced basket opening
    const body = new Path2D();
    body.addPath(B.p);
    body.addPath(B.basket);
    c.fillStyle = inkLift(env, 0.35);
    c.fill(B.basket);
    c.save();
    c.strokeStyle = ink;
    c.lineWidth = 0.28;
    c.stroke(B.bars);
    c.restore();
    c.fillStyle = ink;
    c.fill(body, 'evenodd');
    cut(c, env, B.cl, 0.3, 1);
    // keys on stems; pressed keys dip
    const ty = o.typing ?? 0;
    const tq = Math.floor(env.t * 12);
    const keys = new Path2D();
    const rings = new Path2D();
    B.keys.forEach((k, i) => {
      const down = ty > 0 && hash(i * 13 + tq * 71, o.seed ?? 4) < ty * 0.05;
      const y = k.y + (down ? 0.55 : 0);
      rect(keys, k.x - 0.12, y, 0.24, 1.6);
      circle(keys, k.x, y, k.r);
      circle(rings, k.x, y, k.r * 0.68);
    });
    c.fillStyle = ink;
    c.fill(keys);
    c.fill(B.space);
    cut(c, env, rings, 0.28, 0.8);
  },
  (o) => {
    const off = -((o.carriage ?? 0.3) - 0.5) * 16;
    const ph = 8 + 18 * (o.paper ?? 0.7);
    return { paper: { x: off, y: -20 - ph }, platen: { x: off, y: -19.3 }, keys: { x: 0, y: -5 } };
  },
  () => ({ x: -28, y: -48, w: 54, h: 48 }),
);

// ---------------------------------------------------------------------------
// Rotary telephone (front view)
// ---------------------------------------------------------------------------
export interface PhoneDeskOpts extends PropAt {
  lifted?: number;
  dial?: number;
}

export const rotaryPhone = defineProp<PhoneDeskOpts, 'earpiece' | 'dial' | 'cradle'>(
  (c, o, env) => {
    const ink = env.fill('ink');
    const G = memo('rphone', () => {
      const p = new Path2D();
      // body: broad base, domed shoulders, cradle prongs
      p.moveTo(-11.5, 0);
      p.lineTo(11.5, 0);
      p.quadraticCurveTo(12, -2.4, 10.4, -4);
      p.bezierCurveTo(9, -9.6, 6.2, -11.6, 4.6, -11.8);
      p.lineTo(-4.6, -11.8);
      p.bezierCurveTo(-6.2, -11.6, -9, -9.6, -10.4, -4);
      p.quadraticCurveTo(-12, -2.4, -11.5, 0);
      p.closePath();
      for (const sx of [-1, 1]) {
        p.moveTo(sx * 4.2, -11.6);
        p.quadraticCurveTo(sx * 6.0, -13.2, sx * 7.4, -14.4);
        p.lineTo(sx * 8.2, -13.8);
        p.quadraticCurveTo(sx * 7.0, -12.0, sx * 5.8, -11.2);
        p.closePath();
      }
      const cl = new Path2D();
      cl.moveTo(-10.6, -1.6);
      cl.lineTo(10.6, -1.6);
      return { p, cl };
    });
    c.fillStyle = ink;
    c.fill(G.p);
    cut(c, env, G.cl, 0.28, 1);
    // dial plate with ten finger holes (pierced), finger stop, centre card
    const D = memo('rphone:dial', () => {
      const plate = new Path2D();
      circle(plate, 0, 0, 4.4);
      const holes = new Path2D();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI * 0.42 + (k / 9) * Math.PI * 1.5;
        circle(holes, Math.cos(a) * 3.15, Math.sin(a) * 3.15, 0.66);
      }
      const card = new Path2D();
      circle(card, 0, 0, 1.6);
      return { plate, holes, card };
    });
    c.save();
    c.translate(0, -6.0);
    c.fillStyle = inkLift(env, 0.3);
    const face = new Path2D();
    circle(face, 0, 0, 4.7);
    c.fill(face);
    c.save();
    c.rotate((o.dial ?? 0) * Math.PI * 1.4);
    const pl = new Path2D();
    pl.addPath(D.plate);
    pl.addPath(D.holes);
    c.fillStyle = ink;
    c.fill(pl, 'evenodd');
    c.restore();
    c.fillStyle = paper(env, 0.55);
    c.fill(D.card);
    // finger stop
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(3.4, 2.8);
    c.lineTo(4.9, 3.4);
    c.lineTo(4.6, 3.9);
    c.closePath();
    c.fill();
    c.restore();
    // handset: dumbbell across the cradle, lifts and tilts
    const lift = Math.max(0, Math.min(1, o.lifted ?? 0));
    const H = memo('rphone:handset', () => {
      const p = new Path2D();
      p.moveTo(-9.6, -1.2);
      p.bezierCurveTo(-5, -2.4, 5, -2.4, 9.6, -1.2);
      p.lineTo(9.6, 0.6);
      p.bezierCurveTo(5, -0.4, -5, -0.4, -9.6, 0.6);
      p.closePath();
      // ear and mouth cups
      for (const sx of [-1, 1]) {
        p.moveTo(sx * 7.4, -0.4);
        p.bezierCurveTo(sx * 7.6, 2.4, sx * 12.2, 2.6, sx * 12.4, -0.2);
        p.bezierCurveTo(sx * 12.4, -1.6, sx * 8.0, -1.8, sx * 7.4, -0.4);
        p.closePath();
      }
      return p;
    });
    c.save();
    c.translate(lift * 6, -14.6 - lift * 22);
    c.rotate(-lift * 0.9);
    c.fillStyle = ink;
    c.fill(H);
    c.restore();
    // coiled cord from the base's left side to the handset's mouth end
    const ex = lift * 6 + Math.cos(Math.PI - lift * 0.9) * 11;
    const ey = -14.6 - lift * 22 + Math.sin(-lift * 0.9) * -11 * -1;
    c.save();
    c.strokeStyle = ink;
    c.lineWidth = 0.32;
    c.beginPath();
    const sx = -11.2;
    const sy = -2;
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const bx = sx + (ex - sx) * u - Math.sin(u * Math.PI) * (6 + 4 * (1 - lift));
      const by = sy + (ey - sy) * u + Math.sin(u * Math.PI) * 3 * (1 - lift);
      const ang = u * 70;
      const x = bx + Math.cos(ang) * 0.55;
      const y = by + Math.sin(ang) * 0.55;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    c.restore();
  },
  (o) => {
    const lift = o.lifted ?? 0;
    return { earpiece: { x: -10 + lift * 6, y: -14 - lift * 22 }, dial: { x: 0, y: -6 }, cradle: { x: 0, y: -13 } };
  },
  () => ({ x: -13, y: -16, w: 26, h: 16 }),
);

// ---------------------------------------------------------------------------
// Chalkboard
// ---------------------------------------------------------------------------
export interface ChalkboardOpts extends PropAt {
  w?: number;
  h?: number;
  stand?: 'easel' | 'wall';
  smudge?: number;
  seed?: number;
}

function boardGeom(w: number, h: number, easel: boolean) {
  return memo(`board:${w}:${h}:${easel}`, () => {
    const base = easel ? -62 : 0; // tray line
    const p = new Path2D();
    const f = 3.2;
    rect(p, -w / 2 - f, base - h - f, w + 2 * f, h + 2 * f);
    const area = new Path2D();
    rect(area, -w / 2, base - h, w, h);
    // chalk tray ledge
    rect(p, -w / 2 - f - 1, base + f - 0.4, w + 2 * f + 2, 1.6);
    poly(p, [-w / 2 - f - 1, base + f + 1.2, w / 2 + f + 1, base + f + 1.2, w / 2 + f - 1, base + f + 2.6, -w / 2 - f + 1, base + f + 2.6]);
    if (easel) {
      // A-frame easel: two front legs, a back leg, pegs holding the board
      bar(p, -w * 0.32, base - h - 10, -w * 0.46, 0, 3.2);
      bar(p, w * 0.32, base - h - 10, w * 0.46, 0, 3.2);
      bar(p, 0, base - h - 6, 6, 0, 2.6);
      rrect(p, -w * 0.36, base - h - 13, w * 0.72, 3, 1.2);
      for (const sx of [-1, 1]) rect(p, sx * w * 0.42 - 1.6, base + f + 2.6, 3.2, 2.2);
      bar(p, -w * 0.4, -18, w * 0.4, -18, 1.4);
    }
    const cl = new Path2D();
    cl.rect(-w / 2 - f + 0.8, base - h - f + 0.8, w + 2 * f - 1.6, h + 2 * f - 1.6);
    const chalk = new Path2D();
    rect(chalk, -w * 0.3, base + f - 1.3, 6, 0.9);
    rect(chalk, -w * 0.3 + 8, base + f - 1.3, 3.4, 0.9);
    const eraser = new Path2D();
    rrect(eraser, w * 0.2, base + f - 2.8, 12, 2.6, 0.6);
    return { p, area, cl, chalk, eraser, base };
  });
}

export const chalkboard = defineProp<ChalkboardOpts, 'areaTL' | 'areaBR' | 'centre' | 'tray'>(
  (c, o, env) => {
    const w = o.w ?? 140;
    const h = o.h ?? 90;
    const G = boardGeom(w, h, o.stand !== 'wall');
    const ink = env.fill('ink');
    c.fillStyle = ink;
    c.fill(G.p);
    // slate: a lifted near-black with chalk ghosts
    c.fillStyle = mixLab(ink, env.mood.set, 0.42);
    c.fill(G.area);
    const sm = o.smudge ?? 0.6;
    if (sm > 0) {
      c.save();
      c.clip(G.area);
      const seed = o.seed ?? 3;
      for (let i = 0; i < 7; i++) {
        const p = new Path2D();
        ellipse(p, -w / 2 + w * hash(i, seed), G.base - h + h * hash(i, seed + 1), 12 + 20 * hash(i, seed + 2), 3 + 5 * hash(i, seed + 3), (hash(i, seed + 4) - 0.5) * 0.5);
        c.fillStyle = withAlpha(env.mood.rim, 0.035 * sm);
        c.fill(p);
      }
      // half-erased old lines
      c.strokeStyle = withAlpha(env.mood.rim, 0.06 * sm);
      c.lineWidth = 0.5;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const y = G.base - h + 10 + i * 12;
        c.moveTo(-w / 2 + 8 + 6 * hash(i, seed + 9), y);
        c.lineTo(-w / 2 + 30 + 50 * hash(i, seed + 10), y + 1);
      }
      c.stroke();
      c.restore();
    }
    cut(c, env, G.cl, 0.26, 1);
    c.fillStyle = paper(env, 0.8);
    c.fill(G.chalk);
    c.fillStyle = ink;
    c.fill(G.eraser);
  },
  (o) => {
    const w = o.w ?? 140;
    const h = o.h ?? 90;
    const base = o.stand === 'wall' ? 0 : -62;
    return { areaTL: { x: -w / 2, y: base - h }, areaBR: { x: w / 2, y: base }, centre: { x: 0, y: base - h / 2 }, tray: { x: 0, y: base + 3 } };
  },
  (o) => {
    const w = (o.w ?? 140) + 8;
    const h = o.h ?? 90;
    const top = (o.stand === 'wall' ? 0 : -62) - h - 14;
    return { x: -w / 2, y: top, w, h: o.stand === 'wall' ? -top + 6 : -top };
  },
);

// ---------------------------------------------------------------------------
// Slide rule
// ---------------------------------------------------------------------------
export interface SlideRuleOpts extends PropAt {
  slide?: number;
  cursor?: number;
}

const SRL = { L: 30, scale: 25 };

function ruleTicks(y: number, down: boolean) {
  const p = new Path2D();
  const x0 = -SRL.scale / 2;
  for (let v = 1; v < 10.001; v += 0.1) {
    const x = x0 + SRL.scale * Math.log10(v);
    const major = Math.abs(v - Math.round(v)) < 1e-6;
    const half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6;
    const L = major ? 0.55 : half ? 0.38 : 0.22;
    if (v > 5 && !major && !half && Math.round(v * 10) % 2) continue;
    p.moveTo(x, y);
    p.lineTo(x, y + (down ? L : -L));
  }
  return p;
}

export const slideRule = defineProp<SlideRuleOpts, 'cursor' | 'centre'>(
  (c, o, env) => {
    const G = memo('srule', () => {
      const body = new Path2D();
      rrect(body, -SRL.L / 2, -4.2, SRL.L, 4.2, 0.3);
      const faceTop = new Path2D();
      rect(faceTop, -SRL.L / 2 + 0.9, -3.95, SRL.L - 1.8, 1.15);
      const faceBot = new Path2D();
      rect(faceBot, -SRL.L / 2 + 0.9, -1.4, SRL.L - 1.8, 1.15);
      const slideFace = new Path2D();
      rect(slideFace, -SRL.L / 2, -2.7, SRL.L, 1.2);
      return { body, faceTop, faceBot, slideFace, tA: ruleTicks(-2.8, false), tC: ruleTicks(-2.62, true), tD: ruleTicks(-1.4, true), tB: ruleTicks(-1.58, false) };
    });
    const ink = env.fill('ink');
    const face = paper(env, 0.95);
    c.fillStyle = ink;
    c.fill(G.body);
    c.fillStyle = face;
    c.fill(G.faceTop);
    c.fill(G.faceBot);
    c.save();
    c.strokeStyle = ink;
    c.lineWidth = 0.05;
    c.stroke(G.tA);
    c.stroke(G.tD);
    c.restore();
    // the slide
    const sl = o.slide ?? 3;
    c.save();
    c.translate(sl, 0);
    c.fillStyle = mixLab(face, ink, 0.08);
    c.fill(G.slideFace);
    c.strokeStyle = ink;
    c.lineWidth = 0.05;
    c.stroke(G.tC);
    c.stroke(G.tB);
    c.fillStyle = ink;
    c.fillRect(-SRL.L / 2, -2.72, 0.5, 1.24);
    c.fillRect(SRL.L / 2 - 0.5, -2.72, 0.5, 1.24);
    c.restore();
    // end brackets
    c.fillStyle = ink;
    c.fillRect(-SRL.L / 2, -4.2, 0.9, 4.2);
    c.fillRect(SRL.L / 2 - 0.9, -4.2, 0.9, 4.2);
    // cursor: glass with a hairline
    const cx = -SRL.scale / 2 + SRL.scale * Math.max(0, Math.min(1, o.cursor ?? 0.47));
    const gl = new Path2D();
    rrect(gl, cx - 1.2, -4.6, 2.4, 5.0, 0.3);
    veil(c, env, gl, 0.22);
    c.fillStyle = ink;
    c.fillRect(cx - 1.25, -4.65, 2.5, 0.45);
    c.fillRect(cx - 1.25, -0.05, 2.5, 0.45);
    c.fillStyle = mixLab(env.mood.core, '#c03a2a', 0.6);
    c.fillRect(cx - 0.03, -4.2, 0.06, 4.2);
  },
  (o) => ({ cursor: { x: -SRL.scale / 2 + SRL.scale * (o.cursor ?? 0.47), y: -2.1 }, centre: { x: 0, y: -2.1 } }),
  () => ({ x: -SRL.L / 2, y: -4.7, w: SRL.L, h: 5.2 }),
);

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------
export interface ClipboardOpts extends PropAt {
  lines?: number;
  angle?: number;
}

export const clipboard = defineProp<ClipboardOpts, 'paperTL' | 'paperBR' | 'clip'>(
  (c, o, env) => {
    const ink = env.fill('ink');
    c.save();
    if (o.angle) c.rotate(o.angle);
    const G = memo('clipboard', () => {
      const board = new Path2D();
      rrect(board, -11.5, -32, 23, 32, 0.9);
      const sheet = new Path2D();
      rect(sheet, -10.5, -29, 21, 28);
      const clip = new Path2D();
      clip.moveTo(-5.5, -28.5);
      clip.lineTo(5.5, -28.5);
      clip.lineTo(4.2, -31.2);
      clip.quadraticCurveTo(0, -34.2, -4.2, -31.2);
      clip.closePath();
      const hole = new Path2D();
      ellipse(hole, 0, -31.4, 1.6, 0.8);
      clip.addPath(hole);
      rrect(clip, -6.2, -29.4, 12.4, 1.4, 0.7);
      return { board, sheet, clip };
    });
    c.fillStyle = ink;
    c.fill(G.board);
    c.fillStyle = paper(env, 0.92);
    c.fill(G.sheet);
    c.fillStyle = withAlpha(ink, 0.3);
    const n = o.lines ?? 14;
    for (let k = 0; k < n; k++) c.fillRect(-8.6, -25 + k * 1.6, 9 + 7 * hash(k, 7), 0.35);
    c.fillStyle = ink;
    c.fill(G.clip, 'evenodd');
    c.restore();
  },
  () => ({ paperTL: { x: -10.5, y: -27 }, paperBR: { x: 10.5, y: -1 }, clip: { x: 0, y: -30 } }),
  () => ({ x: -11.5, y: -34, w: 23, h: 34 }),
);

// ---------------------------------------------------------------------------
// Punch cards
// ---------------------------------------------------------------------------
export interface PunchCardOpts extends PropAt {
  mode?: 'single' | 'deck' | 'fan';
  count?: number;
  holes?: number[];
  seed?: number;
}

const PC = { w: 18.73, h: 8.26 };

function cardPath(holes: number[] | undefined, seed: number) {
  const key = holes ? `pc:h:${holes.join(',')}` : `pc:s:${seed}`;
  return memo(key, () => {
    const p = new Path2D();
    // card with the clipped top-left corner
    p.moveTo(-PC.w / 2 + 0.6, -PC.h);
    p.lineTo(PC.w / 2 - 0.15, -PC.h);
    p.quadraticCurveTo(PC.w / 2, -PC.h, PC.w / 2, -PC.h + 0.15);
    p.lineTo(PC.w / 2, -0.15);
    p.quadraticCurveTo(PC.w / 2, 0, PC.w / 2 - 0.15, 0);
    p.lineTo(-PC.w / 2 + 0.15, 0);
    p.quadraticCurveTo(-PC.w / 2, 0, -PC.w / 2, -0.15);
    p.lineTo(-PC.w / 2, -PC.h + 0.6);
    p.closePath();
    const r = mulberry32(seed * 31 + 1);
    const cw = (PC.w - 0.8) / 80;
    const rh = (PC.h - 0.9) / 12;
    for (let col = 0; col < 80; col++) {
      const bits = holes ? holes[col] ?? 0 : r() < 0.82 ? (1 << Math.floor(r() * 12)) | (r() < 0.4 ? 1 << Math.floor(r() * 3) : 0) : 0;
      for (let row = 0; row < 12; row++) if (bits & (1 << row)) rect(p, -PC.w / 2 + 0.4 + col * cw + cw * 0.25, -PC.h + 0.45 + row * rh + rh * 0.15, cw * 0.5, rh * 0.62);
    }
    return p;
  });
}

export const punchCards = defineProp<PunchCardOpts, 'card' | 'corner'>(
  (c, o, env) => {
    const mode = o.mode ?? 'single';
    const seed = o.seed ?? 5;
    const ink = env.fill('ink');
    if (mode === 'deck') {
      // a deck lying on the table, seen from slightly above: the stack side + top card
      const n = o.count ?? 300;
      const th = Math.max(0.6, n * 0.018);
      const side = new Path2D();
      rect(side, -PC.w / 2, -th, PC.w, th);
      c.fillStyle = paper(env, 0.85);
      c.fill(side);
      c.save();
      c.strokeStyle = withAlpha(ink, 0.25);
      c.lineWidth = 0.03;
      c.beginPath();
      for (let y = -th + 0.12; y < 0; y += 0.12 + 0.06 * hash(Math.floor(y * 100), seed)) {
        c.moveTo(-PC.w / 2, y);
        c.lineTo(PC.w / 2, y);
      }
      c.stroke();
      c.restore();
      c.save();
      c.translate(0, -th);
      c.scale(1, 0.32);
      c.translate(0, 0);
      const top = cardPath(o.holes, seed);
      c.fillStyle = paper(env, 0.95);
      c.fill(top, 'evenodd');
      c.restore();
      return;
    }
    const n = mode === 'fan' ? o.count ?? 5 : 1;
    for (let i = 0; i < n; i++) {
      c.save();
      if (mode === 'fan') {
        c.translate(-PC.w / 2, 0);
        c.rotate(-0.42 + (i / Math.max(1, n - 1)) * 0.5);
        c.translate(PC.w / 2, 0);
      }
      const p = cardPath(i === n - 1 ? o.holes : undefined, seed + i);
      c.fillStyle = paper(env, 0.95);
      c.fill(p, 'evenodd');
      c.strokeStyle = withAlpha(ink, 0.35);
      c.lineWidth = 0.04;
      c.stroke(p);
      c.restore();
    }
  },
  (o) => (o.mode === 'deck' ? { card: { x: 0, y: -Math.max(0.6, (o.count ?? 300) * 0.018) - 1.3 }, corner: { x: -PC.w / 2, y: 0 } } : { card: { x: 0, y: -PC.h / 2 }, corner: { x: -PC.w / 2, y: -PC.h } }),
  (o) => (o.mode === 'fan' ? { x: -PC.w / 2 - 4, y: -PC.h - 8, w: PC.w + 6, h: PC.h + 8 } : { x: -PC.w / 2, y: -PC.h - 6, w: PC.w, h: PC.h + 6 }),
);
