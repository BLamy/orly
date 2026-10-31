// Closer Wins
//
// Hard Attend — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/hard-attend/hard-attend.ts:7-27 (the three items: Aster 10, Banyan 20, Cobalt 30)
//   lab/hard-attend/hard-attend.ts:46-48 (scoreFor = 2·q·j − j²), 50-52 (keyFor = (2j, −j²))
//   lab/hard-attend/hard-attend.ts:58-71 (winnerIndexFor, set-up for chapter 2)
//   lab/hard-attend/hard-attend.html:19-20 (#query-slider, min 0, max 2, step 0.01)
//   lab/hard-attend/README.md:3 (plain JavaScript, not a numeric program; key (2j, −j²), query (q, 1),
//     "highest at the item nearest the query")
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). Every score, key and readout on screen is computed below from the lab's
// own scoreFor/keyFor, with the query quantized to the slider's 0.01 step so every label reconciles.
//
// The machine: three item cards sit on the query slider's track (positions 0, 1, 2), lift into a score
// plot, grow signed score bars, and a parabola over the item axis glides with the query pin, its peak
// always on the pin. The key panel on the left does the dot product the bars show.
import 'katex/dist/katex.min.css';
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SAND = '#e2c799'; // the query pin
const FAINT = 'rgba(148, 163, 184, 0.12)';

// ---------------------------------------------------------------------------
// The lab's arithmetic (hard-attend.ts:7-27, 46-52), exact
// ---------------------------------------------------------------------------

const ITEMS = [
  { index: 0, name: 'Aster', value: 10, color: colors.TEAL },
  { index: 1, name: 'Banyan', value: 20, color: colors.WARM },
  { index: 2, name: 'Cobalt', value: 30, color: colors.SECONDARY },
];

function scoreFor(queryIndex: number, itemIndex: number) {
  return 2 * queryIndex * itemIndex - itemIndex * itemIndex;
}
function keyFor(itemIndex: number): [number, number] {
  return [2 * itemIndex, -itemIndex * itemIndex];
}
/** the page's slider moves in 0.01 steps (hard-attend.html:20) */
const quant = (q: number): number => Math.round(q * 100) / 100;
const scoresAt = (q: number): number[] => ITEMS.map((it) => scoreFor(quant(q), it.index));

const KEYS = ITEMS.map((it) => keyFor(it.index));
// the probes the captions narrate
const PROBES: Array<[number, number[]]> = [
  [1, [0, 1, 0]],
  [0, [0, -1, -4]],
  [2, [0, 3, 4]],
  [1.25, [0, 1.5, 1]],
  [0.5, [0, 0, -2]],
];
for (const [q, want] of PROBES) {
  const got = scoresAt(q);
  if (got.some((s, j) => Math.abs(s - want[j]) > 1e-9)) throw new Error(`scoreFor probe q=${q}`);
  // the dot product of key and query (q, 1) is the same number, and so is q² − (j − q)²
  KEYS.forEach(([a, b], j) => {
    if (Math.abs(a * q + b * 1 - got[j]) > 1e-9 || Math.abs(q * q - (j - q) * (j - q) - got[j]) > 1e-9) {
      throw new Error(`identity at q=${q}, j=${j}`);
    }
  });
}

const minus = (s: string): string => s.replace(/-/g, '−');
/** two decimals, trailing zeros trimmed, never "−0" */
const fmt = (v: number): string => {
  const r = Math.round(v * 100) / 100;
  if (Math.abs(r) < 1e-9) return '0';
  return minus(r.toFixed(2).replace(/\.?0+$/, ''));
};
const keyText = (j: number): string => `(${fmt(KEYS[j][0])}, ${fmt(KEYS[j][1])})`;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const X = scaleLinear([-0.5, 2.5], [420, 1180]);
const Y = scaleLinear([-4.6, 4.6], [548, 178]);
const PLOT = { x: 420, y: 158, w: 760, h: 400 };
const TRACK_Y = 572;
const CARD = { w: 150, h: 50, low: 480, high: 117 };
const BAR_W = 60;
const PANEL = { x: 36, y: 162, w: 328, h: 362 };
const ROW_Y = [270, 350, 430];
const KEY_CHIP = { x: 236, w: 112 };

const CAM_OPEN: CameraState = { x: 760, y: 500, k: 1.25 };
const HOME: CameraState = CAMERA_HOME;
const CAM_PANEL: CameraState = { x: 452, y: 340, k: 1.4 };
const CAM_PEAK: CameraState = { x: 800, y: 375, k: 1.15 };
const CAM_TIE: CameraState = { x: 690, y: 380, k: 1.15 };

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions, ≈118 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);
  const trackU = tl.channel('trackU', 0);
  const cardsU = tl.channel('cardsU', 0);
  const pinU = tl.channel('pinU', 0);
  const q = tl.channel('q', 1.6);
  const tagU = tl.channel('browserTag', 0);
  const askDim = tl.channel('askDim', 0);
  const panelU = tl.channel('panelU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const spot = tl.channel('banyanSpot', 0);
  const lensOp = tl.channel('lensOp', 0);
  const queryU = tl.channel('queryChip', 0);
  const exprU = tl.channel('exprU', 0);
  const scoreForU = tl.channel('scoreForU', 0);
  const texA = tl.channel('texA', 0);
  const texAHide = tl.channel('texAHide', 0);
  const panelFocus = tl.channel('panelFocus', 0);
  const liftU = tl.channel('liftU', 0);
  const axesU = tl.channel('axesU', 0);
  const qLineU = tl.channel('qLineU', 0);
  const barsU = tl.channel('barsU', 0);
  const resU = tl.channel('resU', 0);
  const litU = tl.channel('litU', 0);
  const panelDim = tl.channel('panelDim', 0);
  const barDim = tl.channel('barDim', 0);
  const texB = tl.channel('texB', 0);
  const curveU = tl.channel('curveU', 0);
  const peakU = tl.channel('peakU', 0);
  const peakTag = tl.channel('peakTag', 0);
  const pulse = tl.channel('tiePulse', 0);
  const tieU = tl.channel('tieU', 0);
  const quietU = tl.channel('quietU', 0);
  const endU = tl.channel('endU', 0);

  let t = 0.4;
  /** one spoken line, then a short breath; returns the line's start */
  const say = (dur: number, text: string): number => {
    const at = t;
    tl.caption({ at, dur, text });
    t = tl.hold(at + dur, 0.5);
    return at;
  };

  // — B0 · three items on a line, a query near them —
  let a = say(11.9, 'Three items sit on a line: Aster is worth ten, Banyan twenty, Cobalt thirty. A query lands somewhere near them, and you want the value of the nearest one.');
  tl.tween(trackU, 1, { at: a + 0.2, dur: 1.2, ease: ease.draw });
  tl.tween(cardsU, 1, { at: a + 1.0, dur: 3.2, ease: ease.linear });
  tl.tween(pinU, 1, { at: a + 5.8, dur: 0.6, ease: ease.enter });
  tl.tween(cam, HOME, { at: a + 8.4, dur: 1.4, ease: ease.move });

  // — B1 · a plain page, not a circuit —
  a = say(9.9, 'This lab is a teaching page, plain web code rather than a numeric program. It turns that nearness question into scores, then picks exactly.');
  tl.tween(tagU, 1, { at: a + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(q, 1.4, { at: a + 4.4, dur: 1.6, ease: ease.move });
  tl.tween(askDim, 1, { at: a + 5.2, dur: 0.8, ease: ease.move });

  // — B2 · a key of two numbers per item —
  a = say(10.3, 'Give each item a key of two numbers: twice its position, and minus its position squared. Banyan, at position one, gets two and minus one.');
  tl.tween(cam, CAM_PANEL, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(panelU, 1, { at: a + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(panelFocus, 1, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(rowsU, 1, { at: a + 1.4, dur: 1.8, ease: ease.linear });
  tl.tween(spot, 1, { at: a + 6.4, dur: 0.5, ease: ease.move });
  tl.tween(lensOp, 1, { at: a + 6.6, dur: 0.5, ease: ease.enter });

  // — B3 · the query (q, 1) dotted with each key —
  a = say(11.1, 'The query is the pair query and one. Multiply the pairs and add, and the score is twice the query times the position, minus the position squared.');
  tl.tween(spot, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(lensOp, 0, { at: a, dur: 0.4, ease: ease.move });
  tl.tween(queryU, 1, { at: a + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(exprU, 1, { at: a + 3.6, dur: 1.4, ease: ease.linear });
  tl.tween(scoreForU, 1, { at: a + 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(texA, 1, { at: a + 7.0, dur: 0.6, ease: ease.enter });

  // — B4 · park the query at one: the bars —
  a = say(9.5, 'Park the query at one. Aster scores zero, Banyan scores one, Cobalt scores zero. Banyan is the tallest, and Banyan is the nearest.');
  tl.tween(cam, HOME, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(askDim, 0, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(panelFocus, 0, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(tagU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(liftU, 1, { at: a + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(axesU, 1, { at: a + 0.8, dur: 1.2, ease: ease.draw });
  tl.tween(qLineU, 1, { at: a + 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(q, 1, { at: a + 1.0, dur: 1.0, ease: ease.move });
  tl.tween(barsU, 1, { at: a + 2.2, dur: 1.0, ease: ease.move });
  tl.tween(resU, 1, { at: a + 2.4, dur: 0.6, ease: ease.enter });
  tl.tween(litU, 1, { at: a + 5.6, dur: 0.5, ease: ease.enter });

  // — B5 · the scores trace a parabola that peaks at the query —
  a = say(11.1, 'Across the positions, that score is the query squared minus the squared distance to the query. So the scores trace a parabola that peaks at the query.');
  tl.tween(cam, CAM_PEAK, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(panelDim, 1, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(barDim, 1, { at: a + 0.4, dur: 0.6, ease: ease.move });
  tl.tween(texAHide, 1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(texB, 1, { at: a + 2.0, dur: 0.6, ease: ease.enter });
  tl.tween(curveU, 1, { at: a + 5.6, dur: 1.6, ease: ease.draw });
  tl.tween(peakU, 1, { at: a + 8.6, dur: 0.5, ease: ease.pop });
  tl.tween(peakTag, 1, { at: a + 8.9, dur: 0.6, ease: ease.enter });

  // — B6 · slide down to zero —
  a = say(9.5, 'Slide the query down to zero. Aster takes the lead with zero, while Banyan falls to minus one and Cobalt to minus four.');
  tl.tween(cam, HOME, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(barDim, 0.55, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(peakTag, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(texB, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(texAHide, 0, { at: a + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(q, 0, { at: a + 0.6, dur: 1.6, ease: ease.move });

  // — B7 · up to two —
  a = say(6.7, 'Slide it up to two. Cobalt leads with four, Banyan has three, and Aster has zero.');
  tl.tween(q, 2, { at: a + 0.2, dur: 1.6, ease: ease.move });

  // — B8 · in between, at one and a quarter —
  a = say(10.7, 'In between, the curve slides smoothly. At one and a quarter, Banyan scores one and a half and Cobalt scores one, so Banyan is still nearest.');
  tl.tween(q, 1.25, { at: a + 0.3, dur: 2.4, ease: ease.move });

  // — B9 · exactly one half: a tie —
  a = say(9.5, 'At exactly one half, Aster and Banyan are equally near, and both score zero. The scores alone cannot name a single winner there.');
  tl.tween(cam, CAM_TIE, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(texAHide, 1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(q, 0.5, { at: a + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(pulse, 1, { at: a + 2.4, dur: 0.4, ease: ease.enter });
  tl.tween(pulse, 0, { at: a + 3.0, dur: 0.8, ease: ease.move });
  tl.tween(tieU, 1, { at: a + 5.6, dur: 0.5, ease: ease.pop });

  // — B10 · nearest becomes highest; next, one winner —
  a = say(8.3, 'So scoring turns nearest into highest. Next comes the harder part: choosing one winner exactly, even when two scores tie.');
  tl.tween(cam, HOME, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(quietU, 1, { at: a + 0.3, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: a + 1.6, dur: 0.7, ease: ease.enter });
  tl.hold(t, 2.0);

  return {
    tl, cam, trackU, cardsU, pinU, q, tagU, askDim, panelU, rowsU, spot, lensOp, queryU, exprU, scoreForU, texA,
    liftU, texAHide, panelFocus, axesU, qLineU, barsU, resU, litU, panelDim, barDim, texB, curveU, peakU, peakTag, pulse, tieU, quietU, endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/** Thin white ring with a short leader: the spotlight (never a box). */
function LensRing({ x, y, r, opacity }: { x: number; y: number; r: number; opacity: number }) {
  if (opacity <= 0.005) return null;
  const ang = -Math.PI / 4;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#ffffff" strokeWidth={2} />
      <line x1={x + r * Math.cos(ang)} y1={y + r * Math.sin(ang)} x2={x + (r + 16) * Math.cos(ang)} y2={y + (r + 16) * Math.sin(ang)} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function ItemCard({ cx, cy, name, value, color, lit, opacity }: {
  cx: number; cy: number; name: string; value: number; color: string; lit: number; opacity: number;
}) {
  if (opacity <= 0.005) return null;
  const x = cx - CARD.w / 2;
  const y = cy - CARD.h / 2;
  return (
    <g opacity={opacity}>
      {lit > 0.01 && <rect x={x - 6} y={y - 6} width={CARD.w + 12} height={CARD.h + 12} rx={14} fill={color} opacity={0.22 * lit} />}
      <rect x={x} y={y} width={CARD.w} height={CARD.h} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.5 + 1.5 * lit} />
      <text x={x + 16} y={cy + 6} fontSize={18} fontWeight={700} fill={color}>
        {name}
      </text>
      <text x={x + CARD.w - 16} y={cy + 7} textAnchor="end" fontSize={20} fontFamily={MONO} fontWeight={650} fill={colors.TEXT}>
        {value}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  const qRaw = v(scene.q);
  const qQ = quant(qRaw);
  const qx = X(qRaw);
  const scores = scoresAt(qRaw);
  const maxS = Math.max(...scores);

  const quiet = v(scene.quietU);
  const fadeQ = lerp(1, 0.12, quiet);
  const lift = v(scene.liftU);
  const cardY = lerp(CARD.low, CARD.high, lift);
  const askDim = v(scene.askDim);
  const spot = v(scene.spot);
  const focus = v(scene.panelFocus);
  const trackOp = fadeQ * lerp(1, 0.12, focus);
  const qLine = v(scene.qLineU);
  const litU = v(scene.litU);
  const pulse = v(scene.pulse);
  const barsU = v(scene.barsU);
  const barOp = lerp(1, 0.12, v(scene.barDim)) * fadeQ;
  const axesU = v(scene.axesU);
  const y0 = Y(0);

  const panelOp = v(scene.panelU) * lerp(1, 0.12, v(scene.panelDim)) * (1 - quiet);
  const rowsU = v(scene.rowsU);
  const exprU = v(scene.exprU);
  const resU = v(scene.resU);

  // the parabola over the item axis for the current query: scoreFor(q, j), drawn left to right
  const curveU = v(scene.curveU);
  const curveN = Math.round(160 * curveU);
  const curve: string[] = [];
  for (let i = 0; i <= curveN; i++) {
    const j = -0.5 + (3 * i) / 160;
    curve.push(`${X(j).toFixed(1)},${Y(scoreFor(qQ, j)).toFixed(1)}`);
  }
  const peakY = Y(qQ * qQ);

  const lit = (j: number): number => litU * clamp01(1 - (maxS - scores[j]) / 0.3);
  const tieU = v(scene.tieU);
  const endU = v(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="hha1-plot-clip">
          <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= the score plot frame ================= */}
        {axesU > 0.005 && (
          <g opacity={fadeQ}>
            <line x1={PLOT.x} y1={y0} x2={lerp(PLOT.x, PLOT.x + PLOT.w, axesU)} y2={y0} stroke={colors.MUTED} strokeWidth={1.5} opacity={0.7} />
            <line x1={PLOT.x} y1={Y(-4.4)} x2={PLOT.x} y2={lerp(Y(-4.4), Y(4.4), axesU)} stroke={colors.MUTED} strokeWidth={1.5} opacity={0.7} />
            {[-4, -2, 2, 4].map((tk) => (
              <g key={tk} opacity={axesU}>
                <line x1={PLOT.x} y1={Y(tk)} x2={PLOT.x + PLOT.w} y2={Y(tk)} stroke={FAINT} strokeWidth={1} />
                <text x={PLOT.x - 8} y={Y(tk) + 4.5} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  {fmt(tk)}
                </text>
              </g>
            ))}
            <text x={PLOT.x - 8} y={y0 + 4.5} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={axesU}>
              0
            </text>
            <text x={PLOT.x + 8} y={Y(4.4) + 4} fontSize={14} fill={colors.MUTED} fontStyle="italic" opacity={axesU}>
              score
            </text>
          </g>
        )}

        {/* ================= the signed score bars + the dots at their tops ================= */}
        {barsU > 0.005 &&
          ITEMS.map((it, j) => {
            const sc = scores[j] * barsU;
            const top = Y(sc);
            const h = Math.max(3, Math.abs(top - y0));
            const yBar = Math.abs(top - y0) < 3 ? y0 - 1.5 : Math.min(top, y0);
            const labelY = sc >= -0.005 ? top - 14 : top + 24;
            return (
              <g key={it.name}>
                <rect x={X(j) - BAR_W / 2} y={yBar} width={BAR_W} height={h} rx={3} fill={it.color} opacity={0.55 * barOp} />
                <rect x={X(j) - BAR_W / 2} y={yBar} width={BAR_W} height={h} rx={3} fill="none" stroke={it.color} strokeWidth={1.5} opacity={barOp} />
                <g opacity={fadeQ}>
                  <circle cx={X(j)} cy={top} r={6.5} fill={colors.BG} stroke={it.color} strokeWidth={2.5} opacity={clamp01(barsU * 3)} />
                  <text
                    x={X(j)}
                    y={labelY}
                    textAnchor="middle"
                    fontSize={17}
                    fontFamily={MONO}
                    fontWeight={700}
                    fill={colors.TEXT}
                    stroke="#0a0e1a"
                    strokeWidth={4}
                    paintOrder="stroke"
                    opacity={clamp01(v(scene.resU))}
                  >
                    {fmt(scores[j])}
                  </text>
                </g>
              </g>
            );
          })}

        {/* ================= the parabola, peak on the pin ================= */}
        {curveU > 0.005 && (
          <g clipPath="url(#hha1-plot-clip)" opacity={fadeQ}>
            <polyline points={curve.join(' ')} fill="none" stroke={colors.ACCENT} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        <MathLabel tex={'2qj - j^2 = q^2 - (j - q)^2'} x={1010} y={214} fontSize={24} boxWidth={360} color={colors.ACCENT} opacity={v(scene.texB) * fadeQ} />

        {/* ================= the query: line, pin, readout ================= */}
        {qLine > 0.005 && (
          <line x1={qx} y1={TRACK_Y} x2={qx} y2={PLOT.y + 22} stroke={SAND} strokeWidth={1.5} strokeDasharray="5 6" opacity={0.6 * qLine * fadeQ} />
        )}
        {v(scene.peakU) > 0.005 && (
          <g opacity={v(scene.peakU) * fadeQ}>
            <path d={`M ${qx} ${peakY - 9} L ${qx + 9} ${peakY} L ${qx} ${peakY + 9} L ${qx - 9} ${peakY} Z`} fill="#ffffff" stroke="#0a0e1a" strokeWidth={1.5} />
            <text x={qx + 18} y={peakY - 16} fontSize={15} fill="#ffffff" stroke="#0a0e1a" strokeWidth={4} paintOrder="stroke" opacity={v(scene.peakTag)}>
              peak at the query
            </text>
          </g>
        )}

        {/* ================= the query-slider track (positions 0, 1, 2) ================= */}
        {v(scene.trackU) > 0.005 && (
          <g opacity={trackOp}>
            <line x1={X(0)} y1={TRACK_Y} x2={lerp(X(0), X(2), v(scene.trackU))} y2={TRACK_Y} stroke={colors.MUTED} strokeWidth={4} strokeLinecap="round" opacity={0.55} />
            {[0, 1, 2].map((j) => (
              <g key={j} opacity={staggerU(v(scene.trackU), j, 3, 0.2, 0.6)}>
                <line x1={X(j)} y1={TRACK_Y - 7} x2={X(j)} y2={TRACK_Y + 7} stroke={colors.MUTED} strokeWidth={1.5} />
                <text x={X(j)} y={TRACK_Y + 22} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  {j}
                </text>
              </g>
            ))}
            <text x={X(0) - 22} y={TRACK_Y + 5} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.trackU)}>
              #query-slider · 0 to 2, step 0.01
            </text>
            <text x={X(2) + 22} y={TRACK_Y + 5} fontSize={14} fill={colors.MUTED} fontStyle="italic" opacity={v(scene.trackU)}>
              position
            </text>
          </g>
        )}
        {v(scene.pinU) > 0.005 && (
          <g opacity={v(scene.pinU) * trackOp}>
            <circle cx={qx} cy={TRACK_Y} r={9} fill={SAND} stroke="#0a0e1a" strokeWidth={2} />
            <text x={qx + 14} y={lerp(TRACK_Y - 12, PLOT.y + 12, qLine)} fontSize={14} fontFamily={MONO} fontWeight={700} fill={SAND} stroke="#0a0e1a" strokeWidth={4} paintOrder="stroke">
              q = {qQ.toFixed(2)}
            </text>
          </g>
        )}

        {/* ================= the three item cards (on the track, then above the plot) ================= */}
        {ITEMS.map((it, j) => {
          const u = staggerU(v(scene.cardsU), j, 3, 0.9, 1.4);
          const l = lit(j);
          const isSpot = j === 1 ? 1 : lerp(1, 0.12, focus);
          const op = u * lerp(1, 0.55, askDim) * isSpot * (endU > 0 && l < 0.5 ? lerp(1, 0.4, endU) : 1);
          return (
            <ItemCard
              key={it.name}
              cx={X(j)}
              cy={cardY - 40 * (1 - ease.enter(u))}
              name={it.name}
              value={it.value}
              color={it.color}
              lit={Math.min(1, l * (1 + 0.6 * pulse))}
              opacity={op}
            />
          );
        })}
        {tieU > 0.005 && (
          <g opacity={tieU} transform={`translate(${X(0.5)}, ${CARD.high}) scale(${lerp(0.6, 1, tieU)})`}>
            <rect x={-34} y={-17} width={68} height={34} rx={17} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
            <text x={0} y={6} textAnchor="middle" fontSize={17} fontWeight={700} fill={colors.WARM}>
              tie?
            </text>
          </g>
        )}

        {/* ================= the key panel: key · query = score ================= */}
        {panelOp > 0.005 && (
          <g opacity={panelOp}>
            <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={56} y={194} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
              keyFor(j) = (2j, −j²)
            </text>
            <text x={56} y={224} fontSize={15} fontFamily={MONO} fill={SAND} opacity={v(scene.queryU)}>
              query = (q, 1)
            </text>
            {ITEMS.map((it, j) => {
              const u = staggerU(rowsU, j, 3, 0.4, 1.0);
              const y = ROW_Y[j];
              const rowOp = u * (j === 1 ? 1 : lerp(1, 0.12, spot));
              const k = KEYS[j];
              const sym = `${fmt(k[0])}·q − ${fmt(-k[1])}`;
              const num = `${fmt(k[0])}·${qQ.toFixed(2)} − ${fmt(-k[1])} = ${fmt(scores[j])}`;
              return (
                <g key={it.name} opacity={rowOp}>
                  <circle cx={60} cy={y - 5} r={5} fill={it.color} />
                  <text x={74} y={y} fontSize={16} fontWeight={700} fill={it.color}>
                    {it.name}
                  </text>
                  <text x={146} y={y} fontSize={14} fontFamily={MONO} fill={colors.MUTED}>
                    j = {j}
                  </text>
                  <rect x={KEY_CHIP.x} y={y - 18} width={KEY_CHIP.w} height={26} rx={6} fill="none" stroke={it.color} strokeOpacity={0.7} />
                  <text x={KEY_CHIP.x + KEY_CHIP.w / 2} y={y} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                    {keyText(j)}
                  </text>
                  <text x={74} y={y + 32} fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={staggerU(exprU, j, 3, 0.3, 0.6) * (1 - resU)}>
                    {sym}
                  </text>
                  <text x={74} y={y + 32} fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={resU}>
                    {num}
                  </text>
                </g>
              );
            })}
            <line x1={56} y1={482} x2={344} y2={482} stroke={colors.GRID} strokeWidth={1} opacity={v(scene.scoreForU)} />
            <text x={56} y={508} fontSize={14} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.scoreForU)}>
              scoreFor(q, j) = 2·q·j − j²
            </text>
          </g>
        )}
        <LensRing x={KEY_CHIP.x + KEY_CHIP.w / 2} y={ROW_Y[1] - 5} r={64} opacity={v(scene.lensOp)} />

        {/* ================= closing card ================= */}
        {endU > 0.005 && (
          <g opacity={endU}>
            <rect x={470} y={262} width={660} height={124} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={800} y={314} textAnchor="middle" fontSize={26} fill={colors.TEXT}>
              nearest becomes highest
            </text>
            <text x={800} y={352} textAnchor="middle" fontSize={17} fill={colors.MUTED}>
              next: choose one winner exactly, even when two scores tie
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip, the page, the formula ================= */}
      <rect x={40} y={18} width={150} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · Closer Wins
      </text>
      {v(scene.tagU) > 0.005 && (
        <g opacity={v(scene.tagU) * lerp(1, 0.6, clamp01(v(scene.liftU)))} transform={`translate(${lerp(40, 0, v(scene.tagU))}, 0)`}>
          <rect x={790} y={18} width={450} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={804} y={35} fontSize={13} fontFamily={MONO} fill={colors.TEXT}>
            hard-attend.html
          </text>
          <text x={950} y={35} fontSize={13} fill={colors.MUTED}>
            plain JavaScript, not a numeric program
          </text>
        </g>
      )}
      <MathLabel tex={'\\mathrm{score}(q, j) = 2qj - j^2'} x={800} y={64} fontSize={23} boxWidth={420} opacity={v(scene.texA) * (1 - v(scene.texAHide)) * (1 - quiet)} />
    </>
  );
}

export const vizScene = () => scene;
