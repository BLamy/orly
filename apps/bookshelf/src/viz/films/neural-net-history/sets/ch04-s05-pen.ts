/**
 * ch04-s05 — a handwritten line in pen: a small monoline cursive drawn as real pen strokes (centre-lines through
 * hand-placed points, Catmull-Rom smoothed, cusps kept sharp), so the dedication reads as written by hand, not set
 * in a book face. Only the letters the dedication needs are drawn.
 *
 *   penText(lines)                         → a prepared PenText (polylines in x-height units, slanted)
 *   drawPen(c, pen, o, env)                draws it at (x, y) = first line's baseline start, x-height `xh` px,
 *                                          revealed left to right by `reveal` (0..1 over the whole text, the nib's
 *                                          front moving along each line in turn); the ink is iron-gall dark with a
 *                                          warm wet glint (the candle's light on wet ink) just behind the nib
 *
 *   penFront(pen, o)                       the nib's point for a reveal (for the shot's glint), null once written
 *
 * Units: x-height 1, baseline 0, y UP; capitals and ascenders ~2, descenders ~ -1.05.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';

type P = [number, number];
/** a glyph: strokes joined end-to-start (cusps between strokes); `lift` = separate pen paths drawn after (bars) */
interface Glyph {
  adv: number;
  strokes: P[][];
  /** pen lift before this glyph (capitals start a new path) */
  lift?: boolean;
  /** extra separate paths (crossbars, the top of a capital) */
  extra?: P[][];
  /** the glyph ends high (o, b): the next glyph enters at x-height */
  exitHigh?: boolean;
}

const G: Record<string, Glyph> = {
  I: {
    adv: 0.8,
    lift: true,
    extra: [
      [
        [0.14, 1.9],
        [0.42, 2.0],
        [0.76, 1.98],
      ],
      [
        [0.0, 0.04],
        [0.26, -0.02],
        [0.56, 0.02],
      ],
    ],
    strokes: [
      [
        [0.5, 1.98],
        [0.42, 1.0],
        [0.32, 0.0],
      ],
    ],
  },
  F: {
    adv: 1.1,
    lift: true,
    extra: [
      [
        [0.14, 1.84],
        [0.44, 2.02],
        [0.82, 1.96],
        [1.1, 2.08],
      ],
      [
        [0.24, 1.08],
        [0.56, 1.15],
        [0.92, 1.1],
      ],
    ],
    strokes: [
      [
        [0.66, 1.98],
        [0.58, 1.1],
        [0.48, 0.3],
        [0.44, 0.0],
      ],
    ],
  },
  R: {
    adv: 1.16,
    lift: true,
    extra: [
      [
        [0.36, 1.96],
        [0.3, 1.0],
        [0.2, 0.0],
      ],
    ],
    strokes: [
      [
        [0.08, 1.58],
        [0.36, 1.96],
        [0.8, 2.0],
        [0.96, 1.66],
        [0.74, 1.24],
        [0.36, 1.06],
      ],
      [
        [0.36, 1.06],
        [0.56, 0.86],
        [0.74, 0.38],
        [0.88, 0.04],
        [1.02, 0.0],
        [1.16, 0.14],
      ],
    ],
  },
  n: {
    adv: 0.9,
    strokes: [
      [
        [0, 0],
        [0.1, 0.5],
        [0.22, 1.0],
      ],
      [
        [0.22, 1.0],
        [0.2, 0.5],
        [0.18, 0],
      ],
      [
        [0.18, 0],
        [0.26, 0.6],
        [0.42, 0.98],
        [0.56, 0.86],
        [0.6, 0.42],
        [0.62, 0.1],
        [0.72, 0.0],
        [0.9, 0.14],
      ],
    ],
  },
  m: {
    adv: 1.22,
    strokes: [
      [
        [0, 0],
        [0.1, 0.5],
        [0.22, 1.0],
      ],
      [
        [0.22, 1.0],
        [0.2, 0.5],
        [0.18, 0],
      ],
      [
        [0.18, 0],
        [0.25, 0.6],
        [0.38, 0.98],
        [0.5, 0.82],
        [0.52, 0],
      ],
      [
        [0.52, 0],
        [0.59, 0.6],
        [0.72, 0.98],
        [0.86, 0.86],
        [0.9, 0.42],
        [0.92, 0.1],
        [1.02, 0.0],
        [1.22, 0.14],
      ],
    ],
  },
  e: {
    adv: 0.72,
    strokes: [
      [
        [0, 0],
        [0.22, 0.3],
        [0.44, 0.56],
        [0.5, 0.82],
        [0.4, 0.98],
        [0.26, 0.9],
        [0.18, 0.6],
        [0.2, 0.24],
        [0.34, 0.03],
        [0.54, 0.0],
        [0.72, 0.14],
      ],
    ],
  },
  o: {
    adv: 0.9,
    exitHigh: true,
    strokes: [
      [
        [0, 0],
        [0.12, 0.42],
        [0.28, 0.86],
        [0.46, 1.0],
        [0.6, 0.84],
      ],
      [
        [0.6, 0.84],
        [0.58, 0.36],
        [0.42, 0.03],
        [0.24, 0.06],
        [0.18, 0.42],
        [0.3, 0.86],
        [0.48, 0.98],
        [0.66, 0.92],
        [0.9, 0.9],
      ],
    ],
  },
  r: {
    adv: 0.64,
    strokes: [
      [
        [0, 0],
        [0.12, 0.55],
        [0.24, 1.02],
      ],
      [
        [0.24, 1.02],
        [0.33, 0.9],
        [0.44, 0.96],
      ],
      [
        [0.44, 0.96],
        [0.4, 0.5],
        [0.38, 0.05],
        [0.5, 0.0],
        [0.64, 0.14],
      ],
    ],
  },
  y: {
    adv: 0.86,
    strokes: [
      [
        [0, 0],
        [0.08, 0.5],
        [0.16, 1.0],
      ],
      [
        [0.16, 1.0],
        [0.14, 0.44],
        [0.22, 0.05],
        [0.36, 0.05],
        [0.5, 0.4],
        [0.58, 1.0],
      ],
      [
        [0.58, 1.0],
        [0.56, 0.2],
        [0.52, -0.6],
        [0.42, -1.04],
        [0.3, -0.94],
        [0.32, -0.6],
        [0.5, -0.24],
        [0.7, 0.0],
        [0.86, 0.14],
      ],
    ],
  },
  f: {
    adv: 0.62,
    strokes: [
      [
        [0, 0],
        [0.2, 0.6],
        [0.4, 1.4],
        [0.52, 1.9],
        [0.48, 2.08],
        [0.36, 1.94],
        [0.32, 1.4],
        [0.3, 0.6],
        [0.28, 0.0],
        [0.26, -0.6],
        [0.2, -1.0],
        [0.1, -0.94],
        [0.14, -0.6],
        [0.32, -0.14],
        [0.48, 0.12],
        [0.62, 0.26],
      ],
    ],
  },
  a: {
    adv: 0.84,
    strokes: [
      [
        [0, 0],
        [0.22, 0.46],
        [0.52, 0.92],
      ],
      [
        [0.52, 0.92],
        [0.3, 0.98],
        [0.12, 0.7],
        [0.1, 0.3],
        [0.22, 0.03],
        [0.4, 0.1],
        [0.52, 0.5],
        [0.57, 0.96],
      ],
      [
        [0.57, 0.96],
        [0.53, 0.4],
        [0.55, 0.05],
        [0.67, 0.0],
        [0.84, 0.14],
      ],
    ],
  },
  k: {
    adv: 0.86,
    strokes: [
      [
        [0, 0],
        [0.2, 0.8],
        [0.38, 1.7],
        [0.42, 2.04],
        [0.3, 2.0],
        [0.24, 1.5],
        [0.2, 0.8],
        [0.16, 0],
      ],
      [
        [0.16, 0],
        [0.26, 0.56],
        [0.46, 0.96],
        [0.6, 0.86],
        [0.52, 0.6],
        [0.32, 0.5],
      ],
      [
        [0.32, 0.5],
        [0.5, 0.3],
        [0.58, 0.05],
        [0.7, 0.0],
        [0.86, 0.14],
      ],
    ],
  },
  s: {
    adv: 0.66,
    strokes: [
      [
        [0, 0],
        [0.2, 0.52],
        [0.38, 1.02],
      ],
      [
        [0.38, 1.02],
        [0.5, 0.6],
        [0.52, 0.24],
        [0.4, 0.0],
        [0.2, 0.02],
        [0.12, 0.16],
      ],
      [
        [0.12, 0.16],
        [0.3, 0.06],
        [0.5, 0.05],
        [0.66, 0.14],
      ],
    ],
  },
  b: {
    adv: 0.78,
    exitHigh: true,
    strokes: [
      [
        [0, 0],
        [0.2, 0.8],
        [0.36, 1.7],
        [0.4, 2.04],
        [0.28, 2.0],
        [0.22, 1.5],
        [0.18, 0.8],
        [0.16, 0.1],
      ],
      [
        [0.16, 0.1],
        [0.32, 0.0],
        [0.52, 0.1],
        [0.6, 0.5],
        [0.5, 0.86],
        [0.34, 0.72],
        [0.48, 0.74],
        [0.64, 0.86],
        [0.78, 0.88],
      ],
    ],
  },
  l: {
    adv: 0.48,
    strokes: [
      [
        [0, 0],
        [0.2, 0.8],
        [0.36, 1.7],
        [0.4, 2.04],
        [0.28, 2.0],
        [0.22, 1.5],
        [0.18, 0.8],
        [0.18, 0.1],
        [0.28, 0.0],
        [0.48, 0.14],
      ],
    ],
  },
  t: {
    adv: 0.56,
    extra: [
      [
        [0.06, 1.0],
        [0.3, 1.05],
        [0.54, 1.02],
      ],
    ],
    strokes: [
      [
        [0, 0],
        [0.18, 0.8],
        [0.3, 1.56],
      ],
      [
        [0.3, 1.56],
        [0.25, 0.8],
        [0.22, 0.1],
        [0.32, 0.0],
        [0.56, 0.14],
      ],
    ],
  },
};
const SPACE = 0.6;
const SLANT = 0.26;

/** Catmull-Rom through the points (centripetal-ish uniform), sampled; keeps the end points */
function smooth(pts: P[], per = 6): P[] {
  if (pts.length < 3) return pts.slice();
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export interface PenText {
  /** per line: pen paths (polylines in units, slanted, y up), the line's width in units */
  lines: { paths: P[][]; width: number }[];
}

export function penText(lines: string[]): PenText {
  return {
    lines: lines.map((line, li) => {
      const paths: P[][] = [];
      const extras: P[][] = [];
      let x = 0;
      let cur: P[] | null = null;
      let prevHigh = false;
      for (const ch of line) {
        if (ch === ' ') {
          x += SPACE;
          cur = null;
          prevHigh = false;
          continue;
        }
        const g = G[ch];
        if (!g) throw new Error(`pen: no glyph for '${ch}'`);
        if (g.lift || !cur) {
          cur = [];
          paths.push(cur);
        }
        const jit = (k: number) => hash1(k + li * 131 + x * 17, 77) * 0.025;
        g.strokes.forEach((s, si) => {
          let pts = s.map(([px, py], k) => [px + x + jit(k), py + jit(k + 9)] as P);
          // a glyph entered from a high exit (after o, b) starts at x-height, not on the baseline
          if (si === 0 && prevHigh && !g.lift && pts[0][1] < 0.2) pts = [[pts[0][0], 0.9], ...pts.slice(1)];
          const sm = smooth(pts);
          // strokes join end-to-start (a cusp between them)
          if (cur!.length) sm.shift();
          cur!.push(...sm);
        });
        for (const e of g.extra ?? []) extras.push(smooth(e.map(([px, py]) => [px + x, py] as P)));
        prevHigh = !!g.exitHigh;
        x += g.adv;
      }
      const all = [...paths, ...extras].map((p) => p.map(([px, py]) => [px + SLANT * py, py] as P));
      return { paths: all, width: x };
    }),
  };
}

export interface PenDraw {
  /** first line's baseline start (layer px) */
  x: number;
  y: number;
  /** x-height in layer px */
  xh: number;
  /** line spacing in layer px */
  lead: number;
  /** 0..1: how much of the text the nib has written (by advance, line after line) */
  reveal: number;
  /** centre each line on x (default false: left-aligned at x) */
  center?: boolean;
  /** pen width in layer px (default 0.09 × xh) */
  width?: number;
  /** 0..1 how wet the freshest ink still is (the shot fades it once the line is written; default 1) */
  wet?: number;
}

/** iron-gall ink, near black with a blue cast; the wet glint is the candle's warm core */
export function drawPen(c: CanvasRenderingContext2D, pen: PenText, o: PenDraw, env: PaintEnv, warm: { core: string; halo: string }) {
  const total = pen.lines.reduce((s, l) => s + l.width, 0);
  let done = o.reveal * total;
  const ink = mixLab('#141a24', env.mood.ink, 0.3);
  const w0 = o.width ?? o.xh * 0.09;
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  pen.lines.forEach((line, li) => {
    const front = Math.max(0, Math.min(line.width + 0.6, done)); // units along this line
    done -= line.width;
    if (front <= 0) return;
    const ox = o.center ? o.x - (line.width * o.xh) / 2 : o.x;
    const oy = o.y + li * o.lead;
    const X = (u: number) => ox + u * o.xh;
    const Y = (v: number) => oy - v * o.xh;
    for (const path of line.paths) {
      for (let i = 1; i < path.length; i++) {
        const [ax, ay] = path[i - 1];
        const [bx, by] = path[i];
        // the nib's front: what lies left of it (in unslanted advance) is written; a soft 0.25-unit edge
        const ux = (ax + bx) / 2 - SLANT * ((ay + by) / 2);
        const k = Math.max(0, Math.min(1, (front - ux) / 0.25));
        if (k <= 0) continue;
        // pressure: downstrokes (y falling) a touch heavier, upstrokes hairline-ish
        const dy = by - ay;
        const len = Math.hypot(bx - ax, dy) || 1;
        const press = 0.75 + 0.55 * Math.max(0, -dy / len);
        // the wet glint just behind the nib, fading over ~1.2 units
        const wet = Math.max(0, 1 - (front - ux) / 1.2) * (o.wet ?? 1);
        c.strokeStyle = wet > 0.01 ? mixLab(ink, warm.halo, 0.55 * wet) : ink;
        c.globalAlpha = k * 0.94;
        c.lineWidth = w0 * press;
        c.beginPath();
        c.moveTo(X(ax), Y(ay));
        c.lineTo(X(bx), Y(by));
        c.stroke();
      }
    }
  });
  c.restore();
}

/** the nib's current point (layer px) for a reveal, or null once written: for a glint that rides the pen front */
export function penFront(pen: PenText, o: PenDraw): { x: number; y: number } | null {
  const total = pen.lines.reduce((s, l) => s + l.width, 0);
  let done = o.reveal * total;
  for (let li = 0; li < pen.lines.length; li++) {
    const line = pen.lines[li];
    if (done < line.width) {
      const ox = o.center ? o.x - (line.width * o.xh) / 2 : o.x;
      return { x: ox + (done + 0.3) * o.xh, y: o.y + li * o.lead - 0.5 * o.xh };
    }
    done -= line.width;
  }
  return null;
}
