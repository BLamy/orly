// The Crossover Math
//
// Grounding: src/resources/messages/messages.ts `Usage` — "Total input tokens
// in a request is the summation of `input_tokens`,
// `cache_creation_input_tokens`, and `cache_read_input_tokens`" — plus the
// documented prompt-caching price multipliers: 5-minute cache writes bill at
// 1.25× base input, 1-hour writes at 2×, and cache reads at 0.1×.
//
// Centerpiece: the RECEIPT (three metered lines with their multipliers) and
// then a live cost PLOT — the no-cache line (slope one) against the cached
// line (1.25 up front, then slope one-tenth) — crossing before request two,
// then the axes zoom out to a hundred requests and the gap becomes the story.
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
import type { CameraState, SceneState } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The two cost futures, in units of "one full read of the prefix".
// ---------------------------------------------------------------------------

const WRITE = 1.25; // 5m cache write multiplier
const READ = 0.1; // cache read multiplier

const costNo = (n: number): number => Math.max(0, n);
const costCache = (n: number): number => (n <= 0 ? 0 : n <= 1 ? WRITE * n : WRITE + READ * (n - 1));
// crossover: WRITE + READ(n-1) = n  →  n = (WRITE - READ) / (1 - READ)
const CROSS_N = (WRITE - READ) / (1 - READ); // ≈ 1.28
const AT_100_NO = costNo(100); // 100
const AT_100_CACHE = costCache(100); // 11.15

// layout
const RECEIPT = { x: 84, y: 168, w: 322, h: 252 } as const;
const PLOT = { x: 500, y: 560, w: 620, h: 400 } as const; // x,y = axes origin
const FAIL = { x: 84, y: 448, w: 322, h: 130 } as const;

const METERS = [
  { label: 'input_tokens', mult: '× 1.00', color: colors.TEXT, note: 'fresh tokens' },
  { label: 'cache_creation_input_tokens', mult: '× 1.25', color: colors.WARM, note: 'the write' },
  { label: 'cache_read_input_tokens', mult: '× 0.10', color: colors.ACCENT, note: 'the read' },
] as const;

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_RECEIPT: CameraState = { x: 330, y: 300, k: 1.35 };
const CAM_PLOT: CameraState = { x: 760, y: 360, k: 1.14 };
const CAM_CROSS: CameraState = { x: 640, y: 430, k: 1.5 };

// ---------------------------------------------------------------------------
// Timeline (~61s, nine beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_RECEIPT, cameraInterp);

  const receiptU = tl.channel('receiptU', 0); // the three-meter receipt
  const metersU = tl.channel('metersU', 0); // staggered meter reveal
  const writeU = tl.channel('writeU', 0); // write-premium spotlight
  const readU = tl.channel('readU', 0); // read-bargain spotlight
  const axesU = tl.channel('axesU', 0); // plot axes draw-on
  const lineNoU = tl.channel('lineNoU', 0); // no-cache line reveal
  const lineCaU = tl.channel('lineCaU', 0); // cached line reveal
  const crossU = tl.channel('crossU', 0); // crossover dot + inequality
  const zoomU = tl.channel('zoomU', 0); // axes rescale 8 → 100 requests
  const gapU = tl.channel('gapU', 0); // the ≈9× chip
  const failU = tl.channel('failU', 0); // write-once-never-reuse bar
  const dimU = tl.channel('dimU', 0);
  const ruleU = tl.channel('ruleU', 0); // closing rule of thumb

  // — beat 1 · three meters —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'Time to talk price. The receipt splits input into three meters: fresh tokens, tokens written into the cache, and tokens read back out of it. The total is simply the sum of the three.',
  });
  tl.tween(receiptU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(metersU, 1, { at: 1.8, dur: 2.2, ease: ease.move });
  tl.hold(7.1, 0.4);

  // — beat 2 · the write premium —
  tl.caption({
    at: 7.8,
    dur: 5.6,
    text: 'Writing costs a premium — a quarter more than the base rate — because the server does the normal read plus the filing.',
  });
  tl.tween(writeU, 1, { at: 8.2, dur: 0.6, ease: ease.pop });

  // — beat 3 · the read bargain —
  tl.caption({
    at: 13.8,
    dur: 5.2,
    text: 'Reading is the bargain: about a tenth of the base rate for every token the cache already knows.',
  });
  tl.tween(writeU, 0, { at: 14.0, dur: 0.5, ease: ease.enter });
  tl.tween(readU, 1, { at: 14.2, dur: 0.6, ease: ease.pop });

  // — beat 4 · future one: no cache —
  tl.caption({
    at: 19.6,
    dur: 6.0,
    text: 'So here are your two futures for one long prefix. Without caching, every request pays full price again — cost climbs in a straight line.',
  });
  tl.tween(cam, CAM_PLOT, { at: 19.8, dur: 1.4, ease: ease.move });
  tl.tween(readU, 0, { at: 19.8, dur: 0.5, ease: ease.enter });
  tl.tween(receiptU, 0.12, { at: 19.8, dur: 1.0, ease: ease.move }); // the plot is the subject now
  tl.tween(axesU, 1, { at: 20.2, dur: 1.2, ease: ease.draw });
  tl.tween(lineNoU, 1, { at: 21.6, dur: 1.8, ease: ease.draw });

  // — beat 5 · future two: cached —
  tl.caption({
    at: 26.2,
    dur: 5.8,
    text: 'With caching, you pay one and a quarter up front — and then the line nearly flattens, a tenth per request from there on.',
  });
  tl.tween(lineCaU, 1, { at: 26.6, dur: 1.8, ease: ease.draw });

  // — beat 6 · the crossover —
  tl.caption({
    at: 32.6,
    dur: 5.8,
    text: 'The lines cross before your second request is even done. If a prefix gets reused once, the write has already paid for itself.',
  });
  tl.tween(cam, CAM_CROSS, { at: 32.8, dur: 1.3, ease: ease.move });
  tl.tween(crossU, 1, { at: 33.6, dur: 0.8, ease: ease.pop });
  tl.hold(38.4, 0.4);

  // — beat 7 · zoom to a hundred —
  tl.caption({
    at: 39.0,
    dur: 6.4,
    text: 'Zoom out to a hundred requests and it is not close: one hundred units of cost against about eleven. Nine times cheaper, for not re-reading the same bytes.',
  });
  tl.tween(cam, CAM_PLOT, { at: 39.2, dur: 1.3, ease: ease.move });
  tl.tween(crossU, 0.25, { at: 39.4, dur: 0.8, ease: ease.enter });
  tl.tween(zoomU, 1, { at: 39.8, dur: 2.6, ease: ease.move });
  tl.tween(gapU, 1, { at: 43.0, dur: 0.7, ease: ease.pop });

  // — beat 8 · the only losing move —
  tl.caption({
    at: 45.8,
    dur: 5.8,
    text: 'The only losing move is a prefix nobody reuses. Cache a one-off prompt and the quarter premium buys you nothing.',
  });
  tl.tween(cam, CAM_WIDE, { at: 46.0, dur: 1.3, ease: ease.move });
  tl.tween(receiptU, 1, { at: 46.2, dur: 0.8, ease: ease.enter });
  tl.tween(failU, 1, { at: 46.6, dur: 0.8, ease: ease.enter });

  // — beat 9 · the rule of thumb —
  tl.caption({
    at: 52.2,
    dur: 6.6,
    text: 'Hence the rule of thumb: mark what repeats — the tools, the system prompt, the growing history — and let the crossover do the work. Next, we run a real agent on both meters.',
  });
  tl.tween(dimU, 1, { at: 52.6, dur: 1.0, ease: ease.move });
  tl.tween(ruleU, 1, { at: 53.6, dur: 0.8, ease: ease.enter });
  tl.hold(59.2, 1.4);

  return {
    tl,
    cam,
    receiptU,
    metersU,
    writeU,
    readU,
    axesU,
    lineNoU,
    lineCaU,
    crossU,
    zoomU,
    gapU,
    failU,
    dimU,
    ruleU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const receiptU = s.get(scene.receiptU);
  const metersU = s.get(scene.metersU);
  const writeU = s.get(scene.writeU);
  const readU = s.get(scene.readU);
  const axesU = s.get(scene.axesU);
  const lineNoU = s.get(scene.lineNoU);
  const lineCaU = s.get(scene.lineCaU);
  const crossU = s.get(scene.crossU);
  const zoomU = s.get(scene.zoomU);
  const gapU = s.get(scene.gapU);
  const failU = s.get(scene.failU);
  const dimU = s.get(scene.dimU);
  const ruleU = s.get(scene.ruleU);

  const machineOp = 1 - 0.88 * dimU;

  // the plot's animated window: 8 requests → 100 requests
  const xMax = lerp(8, 100, zoomU);
  const yMax = lerp(9, 108, zoomU);
  const xs = scaleLinear().domain([0, xMax]).range([PLOT.x, PLOT.x + PLOT.w]);
  const ys = scaleLinear().domain([0, yMax]).range([PLOT.y, PLOT.y - PLOT.h]);

  const spotlight = (i: number): number => (i === 1 ? writeU : i === 2 ? readU : 0);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the receipt */}
        <g opacity={receiptU * machineOp}>
          <rect x={RECEIPT.x} y={RECEIPT.y} width={RECEIPT.w} height={RECEIPT.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={RECEIPT.x + 18} y={RECEIPT.y + 30} fill={colors.TEXT} fontSize={14.5} fontWeight={600}>
            usage — the input bill
          </text>
          {METERS.map((m, i) => {
            const u = clamp01(metersU * 4 - i);
            const glow = spotlight(i);
            return (
              <g key={m.label} opacity={u} transform={`translate(${RECEIPT.x + 18}, ${RECEIPT.y + 62 + i * 58})`}>
                <rect x={-6} y={-18} width={RECEIPT.w - 24} height={48} rx={9} fill={glow > 0.05 ? colors.BG : 'none'} stroke={glow > 0.05 ? m.color : 'none'} strokeWidth={1.4} />
                <text fill={m.color} fontSize={12.5} fontFamily={MONO}>
                  {m.label}
                </text>
                <text y={20} fill={colors.MUTED} fontSize={11.5}>
                  {m.note}
                </text>
                <text x={RECEIPT.w - 44} y={8} textAnchor="end" fill={m.color} fontSize={16} fontFamily={MONO} fontWeight={700}>
                  {m.mult}
                </text>
              </g>
            );
          })}
          <text x={RECEIPT.x + 18} y={RECEIPT.y + RECEIPT.h - 14} fill={colors.MUTED} fontSize={11.5}>
            total input = the sum of all three
          </text>
        </g>

        {/* the cost plot */}
        <g opacity={axesU * machineOp}>
          <Axes x={xs} y={ys} reveal={axesU} xTicks={5} yTicks={4} xLabel="requests reusing the prefix" yLabel="cumulative cost (prefix reads)" />
          <FunctionPlot x={xs} y={ys} f={costNo} domain={[0, xMax]} reveal={lineNoU} color={colors.NEGATIVE} width={3} />
          <FunctionPlot x={xs} y={ys} f={costCache} domain={[0, xMax]} reveal={lineCaU} color={colors.POSITIVE} width={3} />
          {lineNoU > 0.9 && (
            <text x={xs(xMax * 0.72)} y={ys(costNo(xMax * 0.72)) - 12} fill={colors.NEGATIVE} fontSize={13}>
              no cache
            </text>
          )}
          {lineCaU > 0.9 && (
            <text x={xs(xMax * 0.72)} y={ys(costCache(xMax * 0.72)) - 12} fill={colors.POSITIVE} fontSize={13}>
              cached
            </text>
          )}

          {/* crossover */}
          <g opacity={crossU}>
            <line x1={xs(CROSS_N)} y1={ys(0)} x2={xs(CROSS_N)} y2={ys(costNo(CROSS_N))} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="5 5" />
            <circle cx={xs(CROSS_N)} cy={ys(costNo(CROSS_N))} r={7} fill={colors.WARM} stroke={colors.BG} strokeWidth={2} />
            <MathLabel tex={'1.25 + 0.1\\,(n-1) \\;<\\; n'} x={xs(CROSS_N) + 26} y={ys(costNo(CROSS_N)) - 44} fontSize={17} color={colors.WARM} opacity={crossU} />
          </g>

          {/* endpoint labels at 100 */}
          <g opacity={gapU}>
            <text x={xs(100) + 8} y={ys(AT_100_NO) + 5} fill={colors.NEGATIVE} fontSize={15} fontFamily={MONO} fontWeight={700}>
              100×
            </text>
            <text x={xs(100) + 8} y={ys(AT_100_CACHE) + 5} fill={colors.POSITIVE} fontSize={15} fontFamily={MONO} fontWeight={700}>
              11.2×
            </text>
            <rect x={xs(58)} y={ys(58)} width={168} height={40} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
            <text x={xs(58) + 84} y={ys(58) + 26} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={700}>
              ≈ 9× cheaper
            </text>
          </g>
        </g>

        {/* the losing move */}
        <g opacity={failU * machineOp}>
          <rect x={FAIL.x} y={FAIL.y} width={FAIL.w} height={FAIL.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={FAIL.x + 18} y={FAIL.y + 28} fill={colors.TEXT} fontSize={13.5} fontWeight={600}>
            written once, never reused
          </text>
          <rect x={FAIL.x + 18} y={FAIL.y + 44} width={200} height={20} rx={5} fill={colors.MUTED} opacity={0.5} />
          <text x={FAIL.x + 224} y={FAIL.y + 59} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            1.00 uncached
          </text>
          <rect x={FAIL.x + 18} y={FAIL.y + 72} width={250} height={20} rx={5} fill={colors.WARM} opacity={0.7} />
          <rect x={FAIL.x + 218} y={FAIL.y + 72} width={50} height={20} rx={5} fill={colors.NEGATIVE} opacity={0.9} />
          <text x={FAIL.x + 274} y={FAIL.y + 87} fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
            1.25 — wasted
          </text>
        </g>

        {/* closing rule */}
        <g opacity={ruleU}>
          <rect x={300} y={250} width={680} height={150} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={600}>
            Reused once, the write has paid for itself.
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            writes × 1.25 · reads × 0.10 · crossover before request two
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
