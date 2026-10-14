/**
 * threadsOfLight — attention as threads of light between paper word-slips pegged to
 * a line. The selected (query) word carries a lantern; a fixed jug of light is poured
 * among all the threads, so thread opacity/width = the real softmax weight
 * (attentionMath.ts: q·k/√d_k over hand-built embeddings of the sentence
 * "The animal didn't cross the street because it was too tired").
 *   thread opacity + width   <- attention weight a_ij (row sums to 1)
 *   cup level under a slip   <- the same weight (the poured light; levels sum to 1)
 *   multi-head               <- one thread colour per head (low-chroma hues of the mood)
 *
 *   threadsOfLight(c, {
 *     x?, y?, w?        banner box (default spans the stage at y = 430)
 *     query: number     token index (IT_INDEX = 7 for "it"); fractional crossfades between queries
 *     heads?: number[]  which heads to draw (default [0]); 0 who? · 1 where? · 2 how? · 3 the word before
 *     reveal?: number   0..1 banner + slips hang in
 *     threads?: number  0..1 the threads draw out from the query
 *     pour?: number     0..1 cups fill with the weights
 *     weights?: boolean print each weight above its cup
 *     legend?: boolean  head names in their colours
 *   }, env)
 *   SENTENCE, IT_INDEX, ATTENTION[h][i][j], HEAD_NAMES re-exported.
 */
import type { PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { MFONT, PARCH, glow, headHues, label, paperLantern, ramp, smooth } from './kit';
import { ATTENTION, HEAD_NAMES, IT_INDEX, SENTENCE } from './attentionMath';

export { ATTENTION, HEAD_NAMES, IT_INDEX, SENTENCE };

export interface ThreadsOfLightOpts {
  x?: number;
  y?: number;
  w?: number;
  query: number;
  heads?: number[];
  reveal?: number;
  threads?: number;
  pour?: number;
  weights?: boolean;
  legend?: boolean;
}

const N = SENTENCE.length;
const CHAR_W = 12.2; // EB Garamond 26px average advance (layout only)

export function slipLayout(o: Pick<ThreadsOfLightOpts, 'x' | 'y' | 'w'>) {
  const X = o.x ?? 70;
  const W = o.w ?? 1140;
  const Y = o.y ?? 430;
  const widths = SENTENCE.map((w) => 30 + w.length * CHAR_W);
  const total = widths.reduce((a, b) => a + b, 0);
  const gap = (W - total) / (N - 1);
  let x = X;
  const slips = widths.map((sw, i) => {
    const cx = x + sw / 2;
    x += sw + gap;
    // the line sags: a catenary-ish parabola between the two end posts
    const u = (cx - X) / W;
    const sag = 26 * 4 * u * (1 - u);
    return { cx, w: sw, top: Y + sag, i };
  });
  return { X, Y, W, slips };
}

export function threadsOfLight(c: CanvasRenderingContext2D, o: ThreadsOfLightOpts, env: PaintEnv): void {
  const m = env.mood;
  const ink = env.fill('ink');
  const reveal = o.reveal ?? 1;
  const thr = o.threads ?? 1;
  const pour = o.pour ?? 0;
  const heads = o.heads ?? [0];
  const hues = headHues(m, 4);
  const L = slipLayout(o);
  const qi = Math.max(0, Math.min(N - 1, o.query));
  const q0 = Math.floor(qi);
  const q1 = Math.min(N - 1, q0 + 1);
  const qu = smooth(qi - q0);
  const SH = 54; // slip height

  // ---------------------------------------------------------------- the line and posts
  const lineA = smooth(ramp(reveal, 0, 0.25));
  if (lineA > 0) {
    c.save();
    c.globalAlpha *= lineA;
    c.strokeStyle = ink;
    c.lineWidth = 1.6;
    c.beginPath();
    const n = 40;
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      const x = L.X - 30 + u * (L.W + 60);
      const uu = (x - L.X) / L.W;
      const y = L.Y + 26 * 4 * uu * (1 - uu) - 6;
      if (k === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    c.fillStyle = ink;
    for (const px of [L.X - 34, L.X + L.W + 30]) {
      c.fillRect(px - 4, L.Y - 22, 8, 260);
      c.beginPath();
      c.arc(px, L.Y - 26, 7, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // ---------------------------------------------------------------- threads (behind the slips)
  if (thr > 0 && reveal > 0.5) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    heads.forEach((h, hi) => {
      const col = heads.length > 1 ? hues[h] : mixLab(m.core, m.halo, 0.25);
      for (const [qq, wq] of [
        [q0, 1 - qu],
        [q1, qu],
      ] as const) {
        if (wq <= 0.001) continue;
        const from = L.slips[qq];
        const row = ATTENTION[h][qq];
        for (let j = 0; j < N; j++) {
          const a = row[j];
          if (a < 0.004) continue;
          const to = L.slips[j];
          const x0 = from.cx;
          const y0 = from.top - 54;
          const x1 = to.cx;
          const y1 = to.top - 6;
          const dist = Math.abs(x1 - x0);
          const lift = (60 + dist * 0.32) * (1 + hi * 0.16);
          const cx = (x0 + x1) / 2;
          const cy = Math.min(y0, y1) - lift;
          // draw progressively from the query outward
          const d = smooth(ramp(thr, 0, 0.6 + 0.4 * (dist / L.W)));
          if (d <= 0) continue;
          const steps = 24;
          c.beginPath();
          for (let k = 0; k <= steps * d; k++) {
            const u = k / steps;
            const v = 1 - u;
            const x = v * v * x0 + 2 * v * u * cx + u * u * x1;
            const y = v * v * y0 + 2 * v * u * cy + u * u * y1;
            if (k === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          const alpha = Math.min(1, 0.08 + a * 1.6) * wq;
          c.strokeStyle = withAlpha(col, alpha * 0.35);
          c.lineWidth = 1 + a * 22;
          c.stroke();
          c.strokeStyle = withAlpha(col, alpha);
          c.lineWidth = 0.8 + a * 6;
          c.stroke();
          if (d > 0.98 && a > 0.15) glow(c, x1, y1 - 2, 30 + a * 60, col, 0.35 * a * wq);
        }
      }
    });
    c.restore();
  }

  // ---------------------------------------------------------------- slips
  c.save();
  L.slips.forEach((sl, i) => {
    const a = smooth(ramp(reveal, 0.1 + i * 0.04, 0.35 + i * 0.04));
    if (a <= 0) return;
    const isQ = (i === q0 ? 1 - qu : 0) + (i === q1 && q1 !== q0 ? qu : 0);
    const swing = (1 - a) * 0.4 * (i % 2 ? 1 : -1);
    c.save();
    c.globalAlpha *= a;
    c.translate(sl.cx, sl.top);
    c.rotate(swing);
    // peg
    c.fillStyle = ink;
    c.fillRect(-3, -14, 6, 18);
    // the paper slip (parchment, slightly ragged bottom)
    const w = sl.w;
    c.fillStyle = mixLab(PARCH.sky[1], m.halo, 0.15 + 0.35 * isQ);
    c.beginPath();
    c.moveTo(-w / 2, 0);
    c.lineTo(w / 2, 0);
    c.lineTo(w / 2, SH - 3);
    c.lineTo(w / 4, SH);
    c.lineTo(0, SH - 4);
    c.lineTo(-w / 4, SH);
    c.lineTo(-w / 2, SH - 2);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(PARCH.ink, 0.25);
    c.lineWidth = 0.8;
    c.stroke();
    label(c, SENTENCE[i], 0, 35, { size: 25, color: PARCH.ink, align: 'center' });
    c.restore();
  });
  c.restore();

  // the query lantern above its slip (moves with the query)
  const qx = L.slips[q0].cx + (L.slips[q1].cx - L.slips[q0].cx) * qu;
  const qy = Math.min(L.slips[q0].top, L.slips[q1].top) - 72;
  const lA = smooth(ramp(reveal, 0.5, 0.8));
  if (lA > 0) paperLantern(c, { x: qx, y: qy, r: 18, act: 0.9, alpha: lA, hang: 0, halo: 0.6 }, env);

  // ---------------------------------------------------------------- cups (the poured light)
  if (pour > 0) {
    heads.slice(0, 1).forEach((h) => {
      const row = ATTENTION[h][q0].map((v, j) => v * (1 - qu) + ATTENTION[h][q1][j] * qu);
      L.slips.forEach((sl, j) => {
        const cx = sl.cx;
        const cy = sl.top + SH + 88;
        const cw = 26;
        const ch = 58;
        const lvl = Math.min(1, row[j] / 0.75) * smooth(ramp(pour, 0, 1));
        c.save();
        // glass cup outline (ink), light inside
        c.strokeStyle = ink;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cx - cw / 2, cy - ch);
        c.lineTo(cx - cw * 0.38, cy);
        c.lineTo(cx + cw * 0.38, cy);
        c.lineTo(cx + cw / 2, cy - ch);
        c.stroke();
        c.fillStyle = withAlpha(ink, 0.5);
        c.fill();
        if (lvl > 0) {
          const top = cy - ch * lvl;
          const wt = cw / 2 - (cw / 2 - cw * 0.38) * (1 - lvl);
          c.fillStyle = mixLab(m.halo, m.core, 0.4 + 0.6 * lvl);
          c.beginPath();
          c.moveTo(cx - wt, top);
          c.lineTo(cx - cw * 0.38, cy);
          c.lineTo(cx + cw * 0.38, cy);
          c.lineTo(cx + wt, top);
          c.closePath();
          c.fill();
          glow(c, cx, top + ch * lvl * 0.5, 22 + 40 * lvl, m.halo, 0.25 * lvl);
        }
        c.fillStyle = ink;
        c.fillRect(cx - cw * 0.42, cy, cw * 0.84, 4);
        c.restore();
        if (o.weights) label(c, row[j].toFixed(2), cx, cy + 26, { size: 18, color: row[j] > 0.15 ? m.core : m.rim, align: 'center', alpha: smooth(ramp(pour, 0.5, 1)) });
      });
    });
  }

  if (o.legend && heads.length > 0) {
    const la = smooth(ramp(reveal, 0.7, 1));
    heads.forEach((h, k) => {
      const lx = L.X + k * 230;
      const ly = 64;
      const col = heads.length > 1 ? hues[h] : m.core;
      c.save();
      c.globalAlpha *= la;
      c.strokeStyle = col;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(lx, ly - 7);
      c.lineTo(lx + 34, ly - 7);
      c.stroke();
      c.restore();
      label(c, `head ${h + 1} · ${HEAD_NAMES[h]}`, lx + 44, ly, { size: 19, italic: true, color: col, alpha: la });
    });
  }
}
