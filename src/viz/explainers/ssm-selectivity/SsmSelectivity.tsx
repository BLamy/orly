// Explained: State-Space Models — chapter 2: selectivity. A real copy task
// run twice at module scope: 20 unit-vector tokens (d = 8), one of them
// flagged. A non-selective SSM with fixed gates (a = 0.85, b = 0.5) blends
// everything — recall of the flagged value ends at cosine ≈ 0.05, noise.
// A selective SSM whose gates depend on the input (write gate opens only on
// the flagged token, forget gate stays shut otherwise) ends at cosine 1.00.
// This is the failure Mamba's input-dependent gating exists to fix.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real math, module scope. d = 8, T = 20 tokens, signal at index 4.
// ---------------------------------------------------------------------------

const D = 8;
const T = 20;
const SIG = 4; // the flagged token's index (spoken as "the fifth token")
const rand = mulberry32(20260702);

function randUnit(): number[] {
  const v = Array.from({ length: D }, () => rand() * 2 - 1);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

const KEY_SIG = randUnit(); // consumed to keep the stream identical to the prototype seed
void KEY_SIG;
const VAL_SIG = randUnit();
const TOKENS: number[][] = Array.from({ length: T }, (_, t) =>
  t === SIG ? VAL_SIG : randUnit(),
);

interface Gate {
  a: number;
  b: number;
}
const GATES_FIXED: Gate[] = Array.from({ length: T }, () => ({ a: 0.85, b: 0.5 }));
const GATES_SEL: Gate[] = Array.from({ length: T }, (_, t) =>
  t === SIG ? { a: 0.0, b: 1.0 } : { a: 1.0, b: 0.0 },
);

function run(gates: Gate[]): number[][] {
  let h = new Array(D).fill(0) as number[];
  const out: number[][] = [];
  for (let t = 0; t < T; t++) {
    h = h.map((hi, i) => gates[t].a * hi + gates[t].b * TOKENS[t][i]);
    out.push([...h]);
  }
  return out;
}

const cosSim = (u: number[], v: number[]): number => {
  const n = Math.hypot(...u) * Math.hypot(...v);
  return n < 1e-12 ? 0 : u.reduce((acc, x, i) => acc + x * v[i], 0) / n;
};

const H_FIXED = run(GATES_FIXED);
const H_SEL = run(GATES_SEL);
const RECALL_FIXED = H_FIXED.map((h) => cosSim(h, VAL_SIG)); // [SIG] ≈ 0.67 → ends ≈ 0.05
const RECALL_SEL = H_SEL.map((h) => cosSim(h, VAL_SIG)); // 1.00 from SIG onward

const recallAt = (arr: number[], u: number): number => {
  const f = Math.max(0, Math.min(T - 1, u));
  const i = Math.floor(f);
  if (i >= T - 1) return arr[T - 1];
  return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
};
const stateAt = (H: number[][], u: number, ch: number): number => {
  const f = Math.max(0, Math.min(T - 1, u));
  const i = Math.floor(f);
  if (i >= T - 1) return H[T - 1][ch];
  return H[i][ch] + (H[i + 1][ch] - H[i][ch]) * (f - i);
};

// ---------------------------------------------------------------------------
// Stage layout. Two lanes: fixed gates on top, selective below.
// ---------------------------------------------------------------------------

const TOK_X0 = 120;
const TOK_DX = 30;
const LANE_FIXED_Y = 190;
const LANE_SEL_Y = 420;
const STATE_X = 790;
const CELL = 22;

const PLOT_X = scaleLinear().domain([0, T - 1]).range([120, 620]);
const PLOT_Y_FIXED = scaleLinear().domain([-0.3, 1.05]).range([300, 160]);
const PLOT_Y_SEL = scaleLinear().domain([-0.3, 1.05]).range([530, 390]);

const CAM_TOP: CameraState = { x: 480, y: 220, k: 1.3 };
const CAM_BOT: CameraState = { x: 480, y: 440, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  streamU: ChannelRef<number>;
  flagU: ChannelRef<number>;
  fixedTok: ChannelRef<number>;
  fixedPlotU: ChannelRef<number>;
  selU: ChannelRef<number>;
  selTok: ChannelRef<number>;
  gateU: ChannelRef<number>;
  eqU: ChannelRef<number>;
  verdictU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const streamU = tl.channel('streamU', 0);
  const flagU = tl.channel('flagU', 0);
  const fixedTok = tl.channel('fixedTok', 0);
  const fixedPlotU = tl.channel('fixedPlotU', 0);
  const selU = tl.channel('selU', 0);
  const selTok = tl.channel('selTok', 0);
  const gateU = tl.channel('gateU', 0);
  const eqU = tl.channel('eqU', 0);
  const verdictU = tl.channel('verdictU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the task
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Here is the simplest memory test there is: twenty tokens stream past, one of them is flagged, and at the end you must repeat the flagged one back.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(streamU, 1, { at: 1.0, dur: 1.8, ease: ease.draw });
  tl.tween(flagU, 1, { at: 4.4, dur: 0.7, ease: ease.pop });
  tl.hold(6.5, 0.6);

  // Beat 2 — the fixed-gate SSM fails
  tl.caption({
    at: 7.1,
    dur: 6.0,
    text: 'First, the model from last chapter: fixed gates. Every token decays the state by the same amount and writes in with the same weight — the model cannot tell signal from filler.',
  });
  tl.tween(cam, CAM_TOP, { at: 7.3, dur: 1.4, ease: ease.move });
  tl.tween(fixedTok, T - 1, { at: 9.0, dur: 7.0, ease: ease.linear });
  tl.tween(fixedPlotU, 1, { at: 9.2, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 13.5,
    dur: 5.8,
    text: 'Watch the recall meter. The moment the flagged token lands, similarity jumps to about point six seven. Then fifteen more tokens pile in, each one diluting it.',
  });
  tl.caption({
    at: 19.7,
    dur: 5.4,
    text: 'By the end of the stream, recall has collapsed to about point zero five. Essentially noise. The answer was blended away by tokens that never mattered.',
  });
  tl.hold(25.4, 0.7);

  // Beat 3 — selectivity
  tl.caption({
    at: 26.1,
    dur: 6.2,
    text: 'Now the fix, and it is the core idea in Mamba: let the input set the gates. A boring token gets the door slammed on it. The flagged token gets the whole state.',
  });
  tl.tween(cam, CAM_BOT, { at: 26.3, dur: 1.5, ease: ease.move });
  tl.tween(selU, 1, { at: 27.2, dur: 0.9, ease: ease.enter });
  tl.tween(eqU, 1, { at: 29.0, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 32.7,
    dur: 5.6,
    text: 'Same twenty tokens, same fixed-size state. But now the write gate opens only for the flagged token, and the forget gate protects it afterwards.',
  });
  tl.tween(gateU, 1, { at: 33.0, dur: 0.8, ease: ease.enter });
  tl.tween(selTok, T - 1, { at: 34.2, dur: 7.0, ease: ease.linear });
  tl.caption({
    at: 38.8,
    dur: 5.2,
    text: 'Recall jumps to one point zero when the flag lands — and stays there. Fifteen distractors later, the stored value is untouched. Perfect recall.',
  });
  tl.hold(44.2, 0.6);

  // Beat 4 — the verdict, side by side
  tl.caption({
    at: 44.8,
    dur: 6.0,
    text: 'Same architecture size, same task, run for real: point zero five against one point zero. The only difference is who controls the gates — a fixed schedule, or the input itself.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 45.0, dur: 1.5, ease: ease.move });
  tl.tween(verdictU, 1, { at: 46.4, dur: 0.8, ease: ease.pop });
  tl.hold(51.0, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 51.6,
    dur: 6.2,
    text: 'That is what selective means in a selective state-space model: compression you can steer. The state is still small — but now it holds what the input asked it to hold.',
  });
  tl.tween(dimU, 1, { at: 51.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 52.8, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 58.2,
    dur: 4.8,
    text: 'Next: a strange and beautiful fact — this whole recurrence can also be computed as one giant convolution.',
  });
  tl.hold(63.2, 1.2);

  return {
    tl, cam, titleU, streamU, flagU, fixedTok, fixedPlotU,
    selU, selTok, gateU, eqU, verdictU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/ssm-selectivity/overrides.json',
  slug: 'ssm-selectivity',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Lane({
  y, tok, H, recall, plotY, label, gates, showGates, color,
}: {
  y: number;
  tok: number;
  H: number[][];
  recall: number[];
  plotY: import('d3').ScaleLinear<number, number>;
  label: string;
  gates: Gate[];
  showGates: number;
  color: string;
}) {
  const curRecall = recallAt(recall, tok);
  return (
    <g>
      <text x={TOK_X0} y={y - 64} fill={colors.TEXT} fontSize={17}>
        {label}
      </text>
      {/* token stream */}
      {Array.from({ length: T }, (_, t) => {
        const consumed = tok >= t;
        return (
          <g key={t}>
            <rect
              x={TOK_X0 + t * TOK_DX}
              y={y - 44}
              width={TOK_DX - 6}
              height={18}
              rx={3}
              fill={t === SIG ? colors.WARM : colors.MUTED}
              opacity={consumed ? 0.25 : t === SIG ? 0.95 : 0.55}
            />
            {showGates > 0 && (
              <rect
                x={TOK_X0 + t * TOK_DX}
                y={y - 20}
                width={TOK_DX - 6}
                height={6 * gates[t].b + 1}
                rx={1}
                fill={colors.POSITIVE}
                opacity={showGates * 0.9}
              />
            )}
          </g>
        );
      })}
      {/* state strip */}
      {Array.from({ length: D }, (_, i) => {
        const v = stateAt(H, tok, i);
        return (
          <rect
            key={i}
            x={STATE_X + i * CELL}
            y={y - 44}
            width={CELL - 3}
            height={CELL - 3}
            rx={3}
            fill={colors.heat(clamp01(0.5 + v * 0.7))}
          />
        );
      })}
      <text x={STATE_X} y={y - 52} fill={colors.MUTED} fontSize={12}>
        state (8 numbers)
      </text>
      {/* recall meter */}
      <text x={STATE_X + D * CELL + 24} y={y - 30} fill={color} fontSize={16} fontFamily="monospace" fontWeight={600}>
        recall {curRecall.toFixed(2)}
      </text>
      {/* recall curve */}
      <Axes x={PLOT_X} y={plotY} reveal={1} xTicks={4} yTicks={2} fontSize={10} />
      <FunctionPlot
        x={PLOT_X}
        y={plotY}
        f={(u) => recallAt(recall, u)}
        domain={[0, Math.max(0.5, tok)]}
        samples={160}
        reveal={1}
        color={color}
        width={2.4}
      />
      <circle cx={PLOT_X(Math.max(0.5, tok))} cy={plotY(curRecall) as number} r={4.5} fill={color} />
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const streamU = s.get(scene.streamU);
  const flagU = s.get(scene.flagU);
  const fixedTok = s.get(scene.fixedTok);
  const fixedPlotU = s.get(scene.fixedPlotU);
  const selU = s.get(scene.selU);
  const selTok = s.get(scene.selTok);
  const gateU = s.get(scene.gateU);
  const eqU = s.get(scene.eqU);
  const verdictU = s.get(scene.verdictU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <g opacity={streamU * fixedPlotU > 0 ? streamU : streamU}>
            <g opacity={streamU}>
              <Lane
                y={LANE_FIXED_Y}
                tok={fixedTok}
                H={H_FIXED}
                recall={RECALL_FIXED}
                plotY={PLOT_Y_FIXED}
                label="fixed gates — every token treated the same"
                gates={GATES_FIXED}
                showGates={0}
                color={colors.NEGATIVE}
              />
            </g>
            {/* the flag marker */}
            <g opacity={flagU * streamU}>
              <text
                x={TOK_X0 + SIG * TOK_DX + (TOK_DX - 6) / 2}
                y={LANE_FIXED_Y - 76}
                textAnchor="middle"
                fill={colors.WARM}
                fontSize={13}
              >
                remember this one
              </text>
              <line
                x1={TOK_X0 + SIG * TOK_DX + (TOK_DX - 6) / 2}
                y1={LANE_FIXED_Y - 70}
                x2={TOK_X0 + SIG * TOK_DX + (TOK_DX - 6) / 2}
                y2={LANE_FIXED_Y - 48}
                stroke={colors.WARM}
                strokeWidth={1.5}
              />
            </g>
          </g>

          <g opacity={selU}>
            <Lane
              y={LANE_SEL_Y}
              tok={selTok}
              H={H_SEL}
              recall={RECALL_SEL}
              plotY={PLOT_Y_SEL}
              label="selective gates — the input decides"
              gates={GATES_SEL}
              showGates={gateU}
              color={colors.POSITIVE}
            />
          </g>

          {/* verdict */}
          {verdictU > 0 && (
            <g opacity={verdictU}>
              <text x={1005} y={330} fill={colors.NEGATIVE} fontSize={26} fontFamily="monospace" fontWeight={700}>
                0.05
              </text>
              <text x={1005} y={358} fill={colors.MUTED} fontSize={13}>
                fixed gates
              </text>
              <text x={1005} y={420} fill={colors.POSITIVE} fontSize={26} fontFamily="monospace" fontWeight={700}>
                1.00
              </text>
              <text x={1005} y={448} fill={colors.MUTED} fontSize={13}>
                selective gates
              </text>
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Selectivity
        </text>
        <text x={40} y={70} fill={colors.MUTED} fontSize={14}>
          the copy task, run for real
        </text>
      </g>
      <MathLabel
        tex="h_t = \bar{A}(x_t)\,h_{t-1} + \bar{B}(x_t)\,x_t"
        x={820}
        y={44}
        fontSize={22}
        color={colors.SECONDARY}
        opacity={eqU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Compression you can steer.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Fixed gates blend the flag into noise — recall 0.05.
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Input-controlled gates keep it perfectly — recall 1.00.
          </text>
        </g>
      )}
    </>
  );
}

export function SsmSelectivity() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
