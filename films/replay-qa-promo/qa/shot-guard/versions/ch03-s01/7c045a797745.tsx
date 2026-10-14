// ch03-s01 · "It explores your app, in a real browser. Turns what it finds into user journeys, and runs them."
// The reference's 'Building Image' step list re-made for Replay QA: the replay.io home page's three steps, verbatim,
// resolving on the narrator's words (explores · journeys · runs), then breaking into registration dots before ch04.
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, easeOut, font, hexA, icon, measure, smooth } from '../../../film/promo';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ------------------------------------------------------------------ layout (stage px, left two-thirds only)
const X = 104; // title / Working left edge
const SPINE_X = 122;
const ICON_X = 170;
const LABEL_X = 214;
const TITLE_Y = 142;
const ROW_Y = [244, 364, 484]; // label baselines
const DETAIL_DY = 36;
const PROOF_Y = 588;
const WORK_Y = 652;
const ICON_D = 50;

type Row = { icon: 'map' | 'film' | 'bug'; label: string; detail: string };
const ROWS: Row[] = [
  { icon: 'map', label: 'Explore', detail: 'an AI agent drives your app in a real browser' },
  { icon: 'film', label: 'Test & Record', detail: 'every journey run, a Replay recording' },
  { icon: 'bug', label: 'Investigate & Report', detail: 'root cause for every bug' },
];
const PROOF = 'Insights: 89 explorations · 1151 journeys';

function setType(c: CanvasRenderingContext2D, size: number, weight = 400) {
  c.font = font(weight, size);
  (c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(-0.022 * size).toFixed(2)}px`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
}

/** text that slides up `rise` px and un-blurs from `blur0` px as u goes 0 → 1 */
function arrive(c: CanvasRenderingContext2D, text: string, x: number, y: number, u: number, o: { size: number; weight?: number; color: string | CanvasGradient; blur0?: number; rise?: number }) {
  if (u <= 0) return;
  const e = easeOut(u);
  c.save();
  setType(c, o.size, o.weight);
  c.globalAlpha *= e;
  const b = (1 - e) * (o.blur0 ?? 10);
  if (b > 0.25) c.filter = `blur(${b.toFixed(2)}px)`;
  c.fillStyle = o.color;
  c.fillText(text, x, y + (1 - e) * (o.rise ?? 8));
  c.restore();
}

/** deterministic 0..1 hash */
function h01(a: number, b: number, k = 1) {
  const r = Math.sin(a * 127.1 + b * 311.7 + k * 74.7) * 43758.5453;
  return r - Math.floor(r);
}

/**
 * the break-up: a front sweeps right → left across the box; everything right of it is cut away and, along the front,
 * the content turns into small square registration dots that scatter up-right and fade.
 */
function breakup(c: CanvasRenderingContext2D, box: { x0: number; x1: number; y0: number; y1: number }, p: number, draw: () => void, color: string) {
  if (p >= 1) return;
  const w = box.x1 - box.x0;
  // the front is already 15% in on the first frame after the beat, so the break reads at speed
  const front = box.x1 + 6 - (0.15 + 0.85 * (0.7 * p + 0.3 * p * p)) * (w + 40);
  c.save();
  if (p > 0) {
    c.beginPath();
    c.rect(0, 0, Math.max(0, front), 720);
    c.clip();
  }
  draw();
  c.restore();
  if (p <= 0) return;
  // dots: grid points right of the front, emitted when the front passed them
  const step = 8;
  const fadeAll = 1 - p * p * p; // nothing left at p = 1
  c.save();
  c.fillStyle = color;
  for (let gx = box.x0; gx <= box.x1; gx += step) {
    if (gx < front) continue;
    const passed = (gx - front) / (w + 40); // 0 at the front → older further right
    for (let gy = box.y0; gy <= box.y1; gy += step) {
      const r = h01(gx, gy);
      if (r < 0.2) continue; // a broken grid, not a solid block
      const age = passed * 3.2 + r * 0.3;
      const a = clamp(1 - age) * (0.55 + 0.45 * r) * fadeAll;
      if (a <= 0.02) continue;
      const dx = age * (14 + 26 * h01(gx, gy, 2));
      const dy = -age * (6 + 22 * h01(gx, gy, 3));
      const s = 5 + Math.round(r * 2); // 5–7 px
      c.globalAlpha = a;
      c.fillRect(Math.round(gx + dx - s / 2), Math.round(gy + dy - s / 2), s, s);
    }
  }
  c.restore();
}

/** a three-cell film strip whose frames advance by `adv` cells (0..1) */
function filmIcon(c: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, adv: number) {
  const k = s * 0.3;
  const cw = (k * 2) / 3;
  c.save();
  c.translate(x, y);
  c.strokeStyle = color;
  c.lineWidth = Math.max(1.4, s * 0.06);
  c.lineJoin = 'round';
  c.beginPath();
  c.rect(-k, -k * 0.72, k * 2, k * 1.44);
  c.stroke();
  c.beginPath();
  c.rect(-k, -k * 0.72, k * 2, k * 1.44);
  c.clip();
  const off = easeOut(adv) * cw;
  c.beginPath();
  for (let i = -1; i <= 3; i++) {
    const lx = -k + i * cw - off;
    c.moveTo(lx, -k * 0.72);
    c.lineTo(lx, k * 0.72);
  }
  c.stroke();
  // sprocket ticks
  c.fillStyle = color;
  for (let i = -2; i <= 7; i++) {
    const sx = -k + i * (cw / 2) - off + cw * 0.12;
    c.fillRect(sx, -k * 0.62, cw * 0.18, k * 0.16);
    c.fillRect(sx, k * 0.46, cw * 0.18, k * 0.16);
  }
  c.restore();
}

/** a check that draws itself (u 0 → 1) */
function drawCheck(c: CanvasRenderingContext2D, x: number, y: number, s: number, u: number, color: string) {
  if (u <= 0) return;
  const k = s * 0.3;
  const p0 = { x: x - k * 0.85, y: y + k * 0.02 };
  const p1 = { x: x - k * 0.2, y: y + k * 0.66 };
  const p2 = { x: x + k * 0.95, y: y - k * 0.62 };
  const l1 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const l2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const L = (l1 + l2) * easeOut(u);
  c.save();
  c.strokeStyle = color;
  c.lineWidth = Math.max(2.6, s * 0.075);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(p0.x, p0.y);
  if (L <= l1) c.lineTo(lerp(p0.x, p1.x, L / l1), lerp(p0.y, p1.y, L / l1));
  else {
    c.lineTo(p1.x, p1.y);
    const v = (L - l1) / l2;
    c.lineTo(lerp(p1.x, p2.x, v), lerp(p1.y, p2.y, v));
  }
  c.stroke();
  c.restore();
}

export default defineShot({
  id: 'ch03-s01',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const titleAt = T.beat('b-title'); // 0.1
    const rowsAt = T.beat('b-rows'); // 0.4
    const rowAt = [rowsAt, rowsAt + 0.15, rowsAt + 0.3];
    const workingAt = T.beat('b-working'); // 0.7
    // checks: the stroke starts just before the word and is complete inside it. Row one must have arrived first.
    const explores = T.word('L0301', 'explores');
    const check = [
      Math.max(explores + 0.06, rowAt[0] + 0.28),
      T.word('L0302', 'journeys') - 0.06,
      T.word('L0302', 'runs') - 0.06,
    ];
    const realAt = T.word('L0301', 'real') - 0.08; // 'in a real browser' darkens on the words
    const findsAt = T.word('L0302', 'finds'); // row two's label lifts toward ink: the eye moves down
    const journeyAt = T.word('L0302', 'user') - 0.02; // row two: 'journey' darkens across 'user journeys'
    const runAt = T.word('L0302', 'runs') - 0.08; // row two: 'run' darkens on 'runs'
    const dotsAt = T.beat('b-dots'); // 0.5 s after L0302 ends
    tl.hold(0, T.duration);
    return { tl, titleAt, rowAt, workingAt, check, realAt, findsAt, journeyAt, runAt, dotsAt, dur: T.duration };
  },
  paint(f, _s, sc) {
    const c = f.c;
    const t = f.t;
    const { titleAt, rowAt, workingAt, check, realAt, findsAt, journeyAt, runAt, dotsAt, dur } = sc as unknown as {
      titleAt: number; rowAt: number[]; workingAt: number; check: number[]; realAt: number;
      findsAt: number; journeyAt: number; runAt: number; dotsAt: number; dur: number;
    };

    // bare studio paper + two faint hairlines drifting across
    c.fillStyle = PROMO.paper;
    c.fillRect(0, 0, 1280, 720);
    // two faint full-width hairlines drifting slowly apart, framing the list above the title and below Working
    c.save();
    c.lineWidth = 0.8;
    c.strokeStyle = 'rgba(150,145,156,0.32)';
    for (const y of [78 - 4.5 * t, 688 + 3.5 * t]) {
      c.beginPath();
      c.moveTo(0, Math.round(y) + 0.5);
      c.lineTo(1280, Math.round(y) + 0.5);
      c.stroke();
    }
    c.restore();

    // break-up schedule (dots): rows bottom-up from their right edges, proof line with row three, Done last
    const left = dur - dotsAt; // ≈ 0.24 s to the cut
    const bp = (k: number, len: number) => clamp((t - (dotsAt + k * left)) / (len * left));
    const pRow = [bp(0.2, 0.5), bp(0.1, 0.5), bp(0, 0.5)];
    const pProof = bp(0, 0.5);
    const pTitle = bp(0.3, 0.5);
    const pDone = bp(0.45, 0.55);

    // ---- title: 'Testing your app' resolves from a 12 px blur, plain ink
    const tu = clamp((t - titleAt) / 0.5);
    const titleW = measure(c, 'Testing your app', 46, 400);
    breakup(
      c,
      { x0: X, x1: X + titleW, y0: TITLE_Y - 34, y1: TITLE_Y + 6 },
      pTitle,
      () => arrive(c, 'Testing your app', X, TITLE_Y, tu, { size: 46, color: PROMO.ink, blur0: 12, rise: 6 }),
      PROMO.ink,
    );

    // ---- the hairline spine draws downward from the title to the Working line
    const su = easeOut(clamp((t - rowAt[0]) / 0.7));
    const spineTop = TITLE_Y + 24;
    const spineBot = WORK_Y - 34;
    const spineFade = 1 - clamp((t - dotsAt) / (0.7 * left));
    if (su > 0 && spineFade > 0) {
      c.save();
      c.globalAlpha = spineFade;
      c.fillStyle = PROMO.faint;
      c.fillRect(SPINE_X, spineTop, 1.2, (spineBot - spineTop) * su);
      c.restore();
    }

    // ---- the three rows
    ROWS.forEach((row, i) => {
      const u = clamp((t - rowAt[i]) / 0.35);
      if (u <= 0) return;
      const y = ROW_Y[i];
      const iy = y - 11;
      const cu = clamp((t - check[i]) / 0.18); // check draw
      const done = t >= check[i];
      const labelW = measure(c, row.label, 32, 400);
      const detailW = measure(c, row.detail, 22, 400);
      const x1 = Math.max(LABEL_X + labelW, LABEL_X + detailW);
      breakup(
        c,
        { x0: ICON_X - ICON_D / 2, x1, y0: y - 30, y1: y + DETAIL_DY + 4 },
        pRow[i],
        () => {
          const e = easeOut(u);
          const rise = (1 - e) * 8;
          // pale circle; fills pale green as the check lands
          c.save();
          c.globalAlpha *= e;
          c.beginPath();
          c.arc(ICON_X, iy + rise, ICON_D / 2, 0, Math.PI * 2);
          c.fillStyle = done ? hexA(PROMO.green, 0.06 + 0.1 * easeOut(cu)) : 'rgba(255,255,255,0.55)';
          c.fill();
          c.lineWidth = 1;
          c.strokeStyle = done ? hexA(PROMO.green, 0.18 + 0.2 * easeOut(cu)) : hexA(PROMO.ink, 0.08);
          c.stroke();
          // the line icon shrinks to 0.6 and fades fully out over the check draw (no ghost glyph under the check);
          // the film strip advances one frame while it goes
          const iconA = 1 - smooth(cu);
          if (iconA > 0.01) {
            c.globalAlpha *= iconA;
            const is = 40 * (1 - 0.4 * easeOut(cu));
            const ic = '#6f6875';
            if (row.icon === 'film') filmIcon(c, ICON_X, iy + rise, is, ic, clamp((t - check[i]) / 0.13));
            else icon(c, row.icon, ICON_X, iy + rise, is, ic, false);
          }
          c.restore();
          drawCheck(c, ICON_X, iy + rise, 44, cu, PROMO.green);
          // label: near-black, a notch darker once checked
          // row two lifts most of the way toward ink on 'finds', so the eye moves down before its check lands
          const lift = i === 1 ? 0.7 * smooth((t - findsAt) / 0.3) : 0;
          const dark = Math.max(lift, easeOut(cu));
          const lc = dark > 0 ? `rgb(${Math.round(lerp(58, 20, dark))},${Math.round(lerp(54, 18, dark))},${Math.round(lerp(64, 22, dark))})` : '#3a3640';
          arrive(c, row.label, LABEL_X, y, u, { size: 32, color: lc, blur0: 10 });
          // grey detail (22 px)
          const du = clamp(u * 1.25 - 0.15);
          arrive(c, row.detail, LABEL_X, y + DETAIL_DY, du, { size: 22, color: '#8a8590', blur0: 8 });
          // row one: 'in a real browser' darkens as the narrator says it
          if (i === 0) {
            const ru = smooth((t - realAt) / 0.35);
            if (ru > 0 && du >= 1) {
              const pre = 'an AI agent drives your app ';
              const px = LABEL_X + measure(c, pre, 22, 400);
              c.save();
              setType(c, 22, 400);
              c.globalAlpha = ru;
              c.fillStyle = '#3a3640';
              c.fillText('in a real browser', px, y + DETAIL_DY);
              c.restore();
            }
          }
          // row two: 'journey' darkens on 'user journeys', 'run' on 'runs' (same 0.35 s ramp)
          if (i === 1 && du >= 1) {
            const marks: [string, string, number][] = [
              ['every ', 'journey', journeyAt],
              ['every journey ', 'run', runAt],
            ];
            for (const [pre, word, at] of marks) {
              const wu2 = smooth((t - at) / 0.35);
              if (wu2 <= 0) continue;
              c.save();
              setType(c, 22, 400);
              c.globalAlpha = wu2;
              c.fillStyle = '#3a3640';
              c.fillText(word, LABEL_X + measure(c, pre, 22, 400), y + DETAIL_DY);
              c.restore();
            }
          }
        },
        PROMO.ink,
      );
    });

    // ---- the grey proof line (unspoken), fades in as the first check lands
    const pu = clamp((t - (check[0] + 0.12)) / 0.45);
    if (pu > 0) {
      const pw = measure(c, PROOF, 20, 400);
      breakup(
        c,
        { x0: LABEL_X, x1: LABEL_X + pw, y0: PROOF_Y - 16, y1: PROOF_Y + 4 },
        pProof,
        () => arrive(c, PROOF, LABEL_X, PROOF_Y, pu, { size: 20, color: '#8f8a95', blur0: 6, rise: 4 }),
        '#8f8a95',
      );
    }

    // ---- Working (shimmer) → Done (green, still)
    const wu = clamp((t - workingAt) / 0.4);
    const swap = clamp((t - check[2]) / 0.2);
    if (wu > 0 && swap < 1) {
      c.save();
      setType(c, 22, 400);
      const w = c.measureText('Working').width;
      const p = (((t - workingAt) * 0.9) % 1.3) - 0.15;
      const g = c.createLinearGradient(X, 0, X + w, 0);
      g.addColorStop(0, PROMO.mute);
      g.addColorStop(clamp(p - 0.18), PROMO.mute);
      g.addColorStop(clamp(p), '#2a2630');
      g.addColorStop(clamp(p + 0.18), PROMO.mute);
      g.addColorStop(1, PROMO.mute);
      c.fillStyle = g;
      c.globalAlpha = easeOut(wu) * (1 - swap);
      if (swap > 0) c.filter = `blur(${(swap * 4).toFixed(2)}px)`;
      c.fillText('Working', X, WORK_Y);
      c.restore();
    }
    if (swap > 0) {
      const dw = measure(c, 'Done', 22, 500);
      breakup(
        c,
        { x0: X, x1: X + dw, y0: WORK_Y - 18, y1: WORK_Y + 4 },
        pDone,
        () => arrive(c, 'Done', X, WORK_Y, swap, { size: 22, weight: 500, color: PROMO.green, blur0: 6, rise: 3 }),
        PROMO.green,
      );
    }
  },
});
