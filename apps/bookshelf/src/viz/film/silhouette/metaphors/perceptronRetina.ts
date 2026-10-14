/**
 * perceptronRetina — Rosenblatt's Mark I as a machine of light: a 20x20 photocell
 * retina, a plugboard of random wires to 64 association units (each a lamp set in a
 * potentiometer knob), and one response unit read on a dial. The training record is
 * real (perceptronMath.ts): horizontal vs vertical bars, the perceptron rule
 * w <- w + eta * target * a applied only on mistakes.
 *   retina cells lit     <- pixels of the presented image
 *   bright wires         <- connections from lit cells into A-units that fired
 *   knob rotation        <- weight w_a (turns only on the frame the error is felt)
 *   strings to R         <- w_a for A-units that fired (width |w|, warm + / cool -)
 *   dial needle          <- R-unit input sum (left = vertical, right = horizontal)
 *
 *   perceptronRetina(c, {
 *     x?, y?, w?, h?   box (default the full 1280x720 stage)
 *     step: number     presentations, fractional: within one presentation
 *                      0-.25 image lands · .2-.45 A-units fire · .45-.65 dial swings ·
 *                      .65-.95 knobs turn if it was a mistake
 *     reveal?: number  0..1 build the machine (retina, wires, knobs, dial)
 *     tally?: boolean  "presentation n · mistakes in the last 20" readout
 *     floorY?: number  stands (easel, rack posts, dial post) run down to this y
 *   }, env)
 *   PERCEPTRON_RUN / perceptronAccuracy(n) re-exported for narration numbers.
 */
import type { PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { MFONT, cachedArt, clamp01, glow, label, paperLantern, ramp, smooth, thread, weightColor, weightWidth } from './kit';
import { N_A, PERCEPTRON_RUN, RETINA, TASK, TASK_NAMES, perceptronAccuracy } from './perceptronMath';

export { PERCEPTRON_RUN, perceptronAccuracy };

export interface PerceptronRetinaOpts {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  step: number;
  reveal?: number;
  tally?: boolean;
  /** where the stands meet the floor (stage px); default y + 0.8 * h */
  floorY?: number;
}

const RUN = PERCEPTRON_RUN;
const W_MAX = (() => {
  let m = 1;
  for (const s of RUN.steps) for (let i = 0; i <= N_A; i++) m = Math.max(m, Math.abs(s.wAfter[i]));
  return m;
})();

interface Geo {
  rx: number;
  ry: number;
  cell: number;
  kx: number;
  ky: number;
  kp: number;
  kr: number;
  dx: number;
  dy: number;
  dr: number;
  s: number;
}
function geo(o: PerceptronRetinaOpts): Geo {
  const X = o.x ?? 0;
  const Y = o.y ?? 0;
  const s = (o.w ?? 1280) / 1280;
  const cell = 15.5 * s;
  return {
    s,
    rx: X + 64 * s,
    ry: Y + 180 * s,
    cell,
    kx: X + 528 * s,
    ky: Y + 196 * s,
    kp: 41 * s,
    kr: 14.5 * s,
    dx: X + 1062 * s,
    dy: Y + 372 * s,
    dr: 158 * s,
  };
}
const knobPos = (g: Geo, i: number) => ({ x: g.kx + (i % 8) * g.kp, y: g.ky + Math.floor(i / 8) * g.kp });
const cellPos = (g: Geo, k: number) => ({ x: g.rx + ((k % RETINA) + 0.5) * g.cell, y: g.ry + (Math.floor(k / RETINA) + 0.5) * g.cell });

function wirePath(g: Geo, i: number, k: number, p: Path2D) {
  const a = cellPos(g, k);
  const b = knobPos(g, i);
  const mx = (a.x + b.x) / 2;
  p.moveTo(a.x, a.y);
  p.bezierCurveTo(mx, a.y, mx - 20 * g.s, b.y, b.x - g.kr, b.y);
}

export function perceptronRetina(c: CanvasRenderingContext2D, o: PerceptronRetinaOpts, env: PaintEnv): void {
  const g = geo(o);
  const m = env.mood;
  const ink = env.fill('ink');
  const reveal = o.reveal ?? 1;
  const N = RUN.steps.length;
  const sc = Math.max(0, Math.min(N - 1e-6, o.step));
  const k = Math.floor(sc);
  const u = o.step >= N ? 1 : sc - k;
  const st = RUN.steps[k];
  const imgU = smooth(ramp(u, 0, 0.22));
  const aU = smooth(ramp(u, 0.2, 0.42));
  const dialU = smooth(ramp(u, 0.45, 0.65));
  const turnU = st.error ? smooth(ramp(u, 0.68, 0.92)) : 0;
  const w = new Float32Array(N_A + 1);
  for (let i = 0; i <= N_A; i++) w[i] = st.wBefore[i] + (st.wAfter[i] - st.wBefore[i]) * turnU;

  const rv = (a: number, b: number) => smooth(ramp(reveal, a, b));
  // ---------------------------------------------------------------- stands (ink furniture grounding the machine)
  const floorY = o.floorY ?? (o.y ?? 0) + (o.h ?? 720) * 0.8;
  const standA = rv(0, 0.3);
  if (standA > 0) {
    c.save();
    c.globalAlpha *= standA;
    c.fillStyle = ink;
    c.strokeStyle = ink;
    const RS0 = g.cell * RETINA;
    // retina easel: splayed legs and a cross-bar
    c.lineWidth = 7 * g.s;
    c.lineCap = 'butt';
    c.beginPath();
    c.moveTo(g.rx + RS0 * 0.25, g.ry + RS0);
    c.lineTo(g.rx + RS0 * 0.12, floorY);
    c.moveTo(g.rx + RS0 * 0.75, g.ry + RS0);
    c.lineTo(g.rx + RS0 * 0.88, floorY);
    c.moveTo(g.rx + RS0 * 0.5, g.ry + RS0);
    c.lineTo(g.rx + RS0 * 0.5, floorY - 6 * g.s);
    c.stroke();
    c.lineWidth = 4 * g.s;
    c.beginPath();
    c.moveTo(g.rx + RS0 * 0.18, floorY - (floorY - g.ry - RS0) * 0.45);
    c.lineTo(g.rx + RS0 * 0.82, floorY - (floorY - g.ry - RS0) * 0.45);
    c.stroke();
    // A-unit rack: posts, rails with rivets
    const kx0 = g.kx - g.kp * 0.75;
    const kx1 = g.kx + g.kp * 7.75;
    const ky0 = g.ky - g.kp * 0.8;
    const ky1 = g.ky + g.kp * 7.7;
    c.fillRect(kx0 - 8 * g.s, ky0 - 14 * g.s, 9 * g.s, floorY - ky0 + 14 * g.s);
    c.fillRect(kx1 - 1 * g.s, ky0 - 14 * g.s, 9 * g.s, floorY - ky0 + 14 * g.s);
    c.fillRect(kx0 - 14 * g.s, ky0 - 14 * g.s, kx1 - kx0 + 28 * g.s, 10 * g.s);
    c.fillRect(kx0 - 8 * g.s, ky1, kx1 - kx0 + 16 * g.s, 8 * g.s);
    c.fillRect(kx0 - 8 * g.s, floorY - 40 * g.s, kx1 - kx0 + 16 * g.s, 8 * g.s);
    // finials on the posts
    for (const px of [kx0 - 3.5 * g.s, kx1 + 3.5 * g.s]) {
      c.beginPath();
      c.arc(px, ky0 - 20 * g.s, 6 * g.s, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = withAlpha(m.rim, 0.5);
    for (let i = 0; i <= 8; i++) {
      const x = kx0 + ((kx1 - kx0) * i) / 8;
      c.beginPath();
      c.arc(x, ky0 - 9 * g.s, 1.6 * g.s, 0, Math.PI * 2);
      c.arc(x, ky1 + 4 * g.s, 1.6 * g.s, 0, Math.PI * 2);
      c.fill();
    }
    // dial column with a plinth, and a bracket arm for the response lantern
    c.fillStyle = ink;
    c.fillRect(g.dx - 7 * g.s, g.dy, 14 * g.s, floorY - g.dy);
    c.fillRect(g.dx - 34 * g.s, floorY - 12 * g.s, 68 * g.s, 12 * g.s);
    c.fillRect(g.dx - 22 * g.s, floorY - 20 * g.s, 44 * g.s, 8 * g.s);
    c.lineWidth = 5 * g.s;
    c.beginPath();
    c.moveTo(g.dx, g.dy + g.dr * 0.42);
    c.quadraticCurveTo(g.dx + g.dr * 0.4, g.dy + g.dr * 0.3, g.dx + g.dr * 0.78, g.dy + g.dr * 0.36);
    c.stroke();
    c.restore();
  }

  // ---------------------------------------------------------------- retina plate
  const plateA = rv(0, 0.25);
  const RS = g.cell * RETINA;
  if (plateA > 0) {
    c.save();
    c.globalAlpha *= plateA;
    // the plate: an ink frame with rivets, the cells are lenses
    cachedArt(c, `retina:${m.id}`, g.rx - 18 * g.s, g.ry - 18 * g.s, RS + 36 * g.s, RS + 36 * g.s, env.pxScale * Math.max(1, g.s), (q) => {
      const S = RS + 36 * g.s;
      q.fillStyle = ink;
      q.beginPath();
      q.roundRect(0, 0, S, S, 6 * g.s);
      q.fill();
      q.strokeStyle = withAlpha(m.rim, 0.35);
      q.lineWidth = 1;
      q.strokeRect(9 * g.s, 9 * g.s, S - 18 * g.s, S - 18 * g.s);
      q.fillStyle = withAlpha(m.rim, 0.45);
      for (const [x, y] of [
        [5, 5],
        [S / g.s - 5, 5],
        [5, S / g.s - 5],
        [S / g.s - 5, S / g.s - 5],
      ]) {
        q.beginPath();
        q.arc(x * g.s, y * g.s, 2.2 * g.s, 0, Math.PI * 2);
        q.fill();
      }
      for (let j = 0; j < RETINA * RETINA; j++) {
        const x = 18 * g.s + ((j % RETINA) + 0.5) * g.cell;
        const y = 18 * g.s + (Math.floor(j / RETINA) + 0.5) * g.cell;
        q.fillStyle = mixLab(m.set, m.ink, 0.3);
        q.beginPath();
        q.arc(x, y, g.cell * 0.4, 0, Math.PI * 2);
        q.fill();
        q.strokeStyle = withAlpha(m.rim, 0.18);
        q.lineWidth = 0.6;
        q.stroke();
      }
    });
    // lit photocells
    if (imgU > 0) {
      const px = st.img.px;
      c.fillStyle = m.core;
      for (let j = 0; j < px.length; j++) {
        if (!px[j]) continue;
        const p = cellPos(g, j);
        const d = clamp01(imgU * 1.6 - (Math.floor(j / RETINA) / RETINA) * 0.6);
        if (d <= 0) continue;
        c.globalAlpha = plateA * d;
        c.beginPath();
        c.arc(p.x, p.y, g.cell * 0.36, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = plateA;
      glow(c, g.rx + RS / 2, g.ry + RS / 2, RS * 0.75, m.halo, 0.18 * imgU);
    }
    c.restore();
    label(c, 'RETINA · 20 × 20 PHOTOCELLS', g.rx + RS / 2, g.ry - 52 * g.s, { size: 17 * Math.max(1, g.s), font: MFONT.sc, weight: 600, color: m.rim, align: 'center', alpha: plateA * 0.9, tracking: 2.5 });
  }

  // ---------------------------------------------------------------- plugboard wires
  const wireA = rv(0.2, 0.5);
  if (wireA > 0) {
    const key = `${g.rx},${g.ry},${g.s}`;
    const faint = WIRES.get(key) ?? (() => {
      const p = new Path2D();
      RUN.units.forEach((un, i) => un.cells.forEach((cc) => wirePath(g, i, cc, p)));
      WIRES.set(key, p);
      return p;
    })();
    c.save();
    c.globalAlpha *= wireA * 0.22;
    c.strokeStyle = mixLab(m.set, m.rim, 0.25);
    c.lineWidth = 0.5;
    c.stroke(faint);
    c.restore();
    // live wires: lit cells feeding A-units that fire
    if (aU > 0) {
      const live = new Path2D();
      RUN.units.forEach((un, i) => {
        if (!st.a[i]) return;
        un.cells.forEach((cc, kk) => {
          if (st.img.px[cc] && un.sign[kk] > 0) wirePath(g, i, cc, live);
        });
      });
      c.save();
      c.globalAlpha *= aU * 0.75 * wireA;
      c.strokeStyle = mixLab(m.rim, m.core, 0.5);
      c.lineWidth = 0.9;
      c.stroke(live);
      c.restore();
    }
  }

  // ---------------------------------------------------------------- strings A -> R
  const dial = { x: g.dx, y: g.dy };
  const strA = rv(0.5, 0.8);
  if (strA > 0) {
    for (let i = 0; i < N_A; i++) {
      const p = knobPos(g, i);
      const on = st.a[i] ? aU : 0;
      const wi = w[i];
      thread(
        c,
        {
          x0: p.x + g.kr,
          y0: p.y,
          x1: dial.x - g.dr * 0.92,
          y1: dial.y - g.dr * 0.15,
          sag: (14 * g.s) / (1 + Math.abs(wi) * 0.3),
          w: weightWidth(wi, W_MAX) * (0.4 + 0.6 * on),
          color: weightColor(m, wi),
          alpha: strA * (0.07 + 0.6 * on * Math.min(1, Math.abs(wi) / 2 + 0.25)),
        },
        env,
      );
    }
  }

  // ---------------------------------------------------------------- knobs (A-units)
  const knA = rv(0.3, 0.6);
  if (knA > 0) {
    c.save();
    c.globalAlpha *= knA;
    for (let i = 0; i < N_A; i++) {
      const p = knobPos(g, i);
      const fired = st.a[i] ? aU : 0;
      const ang = (-Math.PI / 2) + Math.max(-1, Math.min(1, w[i] / W_MAX)) * (Math.PI * 0.8);
      const turning = st.error && st.a[i] ? turnU * (1 - turnU) * 4 : 0;
      // skirt with ticks
      c.fillStyle = ink;
      c.beginPath();
      c.arc(p.x, p.y, g.kr, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha(m.rim, 0.32 + 0.5 * turning);
      c.lineWidth = 0.8;
      c.beginPath();
      for (let t = -4; t <= 4; t++) {
        const a = -Math.PI / 2 + (t / 4) * Math.PI * 0.8;
        c.moveTo(p.x + Math.cos(a) * g.kr * 1.05, p.y + Math.sin(a) * g.kr * 1.05);
        c.lineTo(p.x + Math.cos(a) * g.kr * 1.3, p.y + Math.sin(a) * g.kr * 1.3);
      }
      c.stroke();
      // the lamp jewel at the centre lights when the A-unit fires
      if (fired > 0) glow(c, p.x, p.y, g.kr * 2.2, m.halo, 0.45 * fired);
      c.fillStyle = mixLab(mixLab(m.set, m.ink, 0.2), m.core, fired * 0.9);
      c.beginPath();
      c.arc(p.x, p.y, g.kr * 0.42, 0, Math.PI * 2);
      c.fill();
      // pointer
      c.strokeStyle = w[i] === 0 ? withAlpha(m.rim, 0.45) : weightColor(m, w[i]);
      c.lineWidth = 2 * g.s;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(p.x + Math.cos(ang) * g.kr * 0.55, p.y + Math.sin(ang) * g.kr * 0.55);
      c.lineTo(p.x + Math.cos(ang) * g.kr * 0.95, p.y + Math.sin(ang) * g.kr * 0.95);
      c.stroke();
    }
    c.restore();
    label(c, 'ASSOCIATION UNITS · WEIGHTS AS KNOBS', g.kx + g.kp * 3.5, g.ry - 52 * g.s, { size: 17 * Math.max(1, g.s), font: MFONT.sc, weight: 600, color: m.rim, align: 'center', alpha: knA * 0.9, tracking: 2.5 });
  }

  // ---------------------------------------------------------------- response dial
  const dA = rv(0.6, 0.9);
  if (dA > 0) {
    const sum = st.sum + (u > 0.65 ? 0 : 0);
    const needle = Math.tanh(sum / 6) * dialU;
    c.save();
    c.globalAlpha *= dA;
    // dial face: an arc of parchment lit from within
    const R = g.dr;
    c.fillStyle = ink;
    c.beginPath();
    c.arc(dial.x, dial.y, R * 1.08, Math.PI, 0);
    c.lineTo(dial.x + R * 1.08, dial.y + R * 0.18);
    c.lineTo(dial.x - R * 1.08, dial.y + R * 0.18);
    c.closePath();
    c.fill();
    const face = c.createRadialGradient(dial.x, dial.y, R * 0.1, dial.x, dial.y, R);
    face.addColorStop(0, withAlpha(m.core, 0.75));
    face.addColorStop(1, withAlpha(m.halo, 0.55));
    c.fillStyle = face;
    c.beginPath();
    c.arc(dial.x, dial.y, R * 0.96, Math.PI, 0);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(m.ink, 0.8);
    c.lineWidth = 1;
    for (let t = -10; t <= 10; t++) {
      const a = -Math.PI / 2 + (t / 10) * Math.PI * 0.42;
      const r0 = R * (t % 5 === 0 ? 0.74 : 0.82);
      c.beginPath();
      c.moveTo(dial.x + Math.cos(a) * r0, dial.y + Math.sin(a) * r0);
      c.lineTo(dial.x + Math.cos(a) * R * 0.9, dial.y + Math.sin(a) * R * 0.9);
      c.stroke();
    }
    const fs = 17 * Math.max(1, g.s);
    label(c, TASK_NAMES[TASK[1]].toUpperCase(), dial.x - R * 0.62, dial.y + R * 0.13, { size: fs, font: MFONT.sc, weight: 600, color: m.rim, align: 'center', tracking: 1.5 });
    label(c, TASK_NAMES[TASK[0]].toUpperCase(), dial.x + R * 0.62, dial.y + R * 0.13, { size: fs, font: MFONT.sc, weight: 600, color: m.rim, align: 'center', tracking: 1.5 });
    label(c, '–', dial.x - R * 0.62, dial.y - R * 0.18, { size: fs * 1.6, color: m.ink, align: 'center' });
    label(c, '+', dial.x + R * 0.62, dial.y - R * 0.18, { size: fs * 1.6, color: m.ink, align: 'center' });
    label(c, `Σ w·a = ${st.sum > 0 ? '+' : st.sum < 0 ? '−' : ''}${Math.abs(st.sum).toFixed(0)}`, dial.x, dial.y - R * 1.16, { size: fs * 1.15, italic: true, color: m.core, align: 'center', alpha: dialU });
    const na = -Math.PI / 2 + needle * Math.PI * 0.42;
    c.strokeStyle = ink;
    c.lineWidth = 3 * g.s;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(dial.x, dial.y);
    c.lineTo(dial.x + Math.cos(na) * R * 0.88, dial.y + Math.sin(na) * R * 0.88);
    c.stroke();
    c.fillStyle = ink;
    c.beginPath();
    c.arc(dial.x, dial.y, 9 * g.s, 0, Math.PI * 2);
    c.fill();
    c.restore();
    // the response lamp: lit for a correct call, a flare + knob turn for a mistake
    const verdictU = smooth(ramp(u, 0.6, 0.7));
    const lampX = dial.x + R * 0.78;
    const lampY = dial.y + R * 0.95;
    c.save();
    c.globalAlpha *= dA;
    c.strokeStyle = ink;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(lampX, dial.y + R * 0.36);
    c.lineTo(lampX, lampY - 30 * g.s * 1.15);
    c.stroke();
    c.restore();
    paperLantern(c, { x: lampX, y: lampY, r: 30 * g.s, act: verdictU * (st.error ? 0.3 : 1), flare: st.error ? 0 : verdictU, tassel: true, alpha: dA }, env);
    if (verdictU > 0) {
      const said = TASK_NAMES[st.out === 1 ? TASK[0] : TASK[1]];
      const txt = st.error ? `said “${said}” — wrong: the knobs turn` : `said “${said}” — correct`;
      label(c, txt, dial.x, floorY + 44 * g.s, { size: 19 * Math.max(1, g.s), italic: true, color: st.error ? m.rim : m.core, align: 'center', alpha: verdictU * dA });
    }
    label(c, 'RESPONSE UNIT', dial.x, dial.y - R * 1.42, { size: 17 * Math.max(1, g.s), font: MFONT.sc, weight: 600, color: m.rim, align: 'center', alpha: dA * 0.9, tracking: 2.5 });
  }

  if (o.tally) {
    const n = Math.min(N, k + (u > 0.65 ? 1 : 0));
    const errs = n === 0 ? 0 : RUN.steps[Math.max(0, n - 1)].recentErrors;
    label(c, `presentation ${k + 1}   ·   mistakes in the last 20: ${errs}`, (o.x ?? 0) + (o.w ?? 1280) / 2, (o.y ?? 0) + (o.h ?? 720) - 34 * g.s, {
      size: 21 * Math.max(1, g.s),
      italic: true,
      color: m.rim,
      align: 'center',
      alpha: rv(0.85, 1),
    });
  }
}
const WIRES = new Map<string, Path2D>();
