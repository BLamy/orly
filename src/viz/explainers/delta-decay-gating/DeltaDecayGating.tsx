// Explained: The Delta Rule — chapter 3: decay and gating. The KDA-form
// recurrence S_t = (I − β k kᵀ) diag(α) S_{t−1} + β k vᵀ with a real
// diagonal decay, actually run (d = 16, 24 writes, seed 20260712). Without
// decay (α = 1) the state saturates: recall of the four newest pairs
// averages 0.70 and of the four oldest 0.59 — everything mediocre. With
// α = 0.85 the old melts and the new sharpens: newest four at 0.96, oldest
// four at −0.07. The recall-by-age curves below are those measured values.
// Grounds KDA's diag(α) (arXiv:2607.11897, background section).
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
// Real math, module scope.
// ---------------------------------------------------------------------------

const D = 16;
const T = 24;
const rand = mulberry32(20260712);

function randUnit(): number[] {
  const v = Array.from({ length: D }, () => rand() * 2 - 1);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

const KEYS: number[][] = Array.from({ length: T }, randUnit);
const VALS: number[][] = Array.from({ length: T }, randUnit);

type Mat = number[][];
const readK = (S: Mat, k: number[]): number[] =>
  Array.from({ length: D }, (_, j) => k.reduce((acc, ki, i) => acc + ki * S[i][j], 0));
const cosSim = (u: number[], v: number[]): number => {
  const n = Math.hypot(...u) * Math.hypot(...v);
  return n < 1e-12 ? 0 : u.reduce((acc, x, i) => acc + x * v[i], 0) / n;
};

function snapshots(alpha: number): Mat[] {
  const out: Mat[] = [Array.from({ length: D }, () => new Array(D).fill(0) as number[])];
  let S = out[0].map((r) => [...r]);
  for (let t = 0; t < T; t++) {
    S = S.map((r) => r.map((x) => x * alpha));
    S = S.map((r, i) => r.map((x, j) => x + KEYS[t][i] * VALS[t][j]));
    out.push(S.map((r) => [...r]));
  }
  return out;
}

const NO_DECAY = snapshots(1.0);
const DECAY = snapshots(0.85);

/** Final recall of each pair, by write position (age). */
const recallByPos = (states: Mat[]): number[] =>
  Array.from({ length: T }, (_, t) => cosSim(readK(states[T], KEYS[t]), VALS[t]));
const RECALL_NO = recallByPos(NO_DECAY);
const RECALL_DEC = recallByPos(DECAY);

const avg = (a: number[]): number => a.reduce((x, y) => x + y, 0) / a.length;
const NO_RECENT = avg(RECALL_NO.slice(T - 4)); // 0.70
const NO_OLD = avg(RECALL_NO.slice(0, 4)); // 0.59
const DEC_RECENT = avg(RECALL_DEC.slice(T - 4)); // 0.96
const DEC_OLD = avg(RECALL_DEC.slice(0, 4)); // -0.07

const lerpArr = (arr: number[], u: number): number => {
  const f = Math.max(0, Math.min(T - 1, u));
  const i = Math.floor(f);
  if (i >= T - 1) return arr[T - 1];
  return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
};
const matAt = (states: Mat[], u: number): Mat => {
  const f = Math.max(0, Math.min(T, u));
  const i = Math.floor(f);
  if (i >= T) return states[T];
  const t = f - i;
  return states[i].map((r, a) => r.map((x, b) => x + (states[i + 1][a][b] - x) * t));
};

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const CELL = 12;
const GRID_NO_X = 170;
const GRID_DEC_X = 480;
const GRID_Y = 170;

const PLOT_X = scaleLinear().domain([0, T - 1]).range([820, 1200]);
const PLOT_Y = scaleLinear().domain([-0.45, 1.05]).range([560, 200]);

const CAM_GRIDS: CameraState = { x: 470, y: 300, k: 1.3 };
const CAM_PLOT: CameraState = { x: 990, y: 380, k: 1.25 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  noU: ChannelRef<number>;
  decU: ChannelRef<number>;
  tok: ChannelRef<number>;
  eqU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  gateU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const noU = tl.channel('noU', 0);
  const decU = tl.channel('decU', 0);
  const tok = tl.channel('tok', 0);
  const eqU = tl.channel('eqU', 0);
  const plotU = tl.channel('plotU', 0);
  const curveU = tl.channel('curveU', 0);
  const gateU = tl.channel('gateU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the saturation problem
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Error correction fixes rewrites of the same key. But a state that never forgets still fills with strangers. Here come twenty four writes, all different keys.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_GRIDS, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(noU, 1, { at: 1.2, dur: 1.0, ease: ease.draw });
  tl.tween(decU, 1, { at: 1.6, dur: 1.0, ease: ease.draw });
  tl.tween(tok, T, { at: 2.6, dur: 7.5, ease: ease.linear });
  tl.caption({
    at: 7.0,
    dur: 5.4,
    text: 'On the left, no forgetting. On the right, the same stream through one extra ingredient: a diagonal decay that shrinks every channel a little before each write.',
  });
  tl.tween(eqU, 1, { at: 8.4, dur: 0.8, ease: ease.enter });
  tl.hold(12.6, 0.6);

  // Beat 2 — the measurement
  tl.caption({
    at: 13.2,
    dur: 6.0,
    text: 'Now interrogate both memories: recall every pair, sorted by age. The measured curves are worth staring at.',
  });
  tl.tween(cam, CAM_PLOT, { at: 13.4, dur: 1.5, ease: ease.move });
  tl.tween(plotU, 1, { at: 14.2, dur: 1.1, ease: ease.draw });
  tl.tween(curveU, 1, { at: 15.4, dur: 3.6, ease: ease.linear });
  tl.caption({
    at: 19.4,
    dur: 6.2,
    text: 'Without decay, everything is mediocre: the four newest facts read back around point seven, and even the four oldest hover near point six. The state is a crowded room where nobody is heard.',
  });
  tl.caption({
    at: 26.0,
    dur: 6.2,
    text: 'With decay at point eight five, the trade is stark: the newest four recall at point nine six, and the oldest four are simply gone — their recall is roughly zero. Old interference melted away.',
  });
  tl.hold(32.4, 0.7);

  // Beat 3 — from decay to gating
  tl.caption({
    at: 33.1,
    dur: 6.2,
    text: 'A fixed decay rate is a blunt instrument — it forgets your best fact on the same schedule as noise. So the modern layers make alpha a decision: a gate, computed from the token, per channel.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 33.3, dur: 1.5, ease: ease.move });
  tl.tween(gateU, 1, { at: 34.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 39.7,
    dur: 6.0,
    text: 'That is the exact form of Kimi Delta Attention: a delta-rule write, wrapped around a learned diagonal decay. Erase by content, forget by time — both under the input’s control.',
  });
  tl.hold(45.9, 0.6);

  // Beat 4 — the cliffhanger
  tl.caption({
    at: 46.5,
    dur: 6.0,
    text: 'But a real decay can only do two things to a channel: shrink it or keep it. Some memories are not amounts at all — they are positions in a cycle. Next chapter, we let the decay rotate.',
  });
  tl.tween(dimU, 1, { at: 47.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.9, dur: 0.9, ease: ease.enter });
  tl.hold(52.9, 1.2);

  return { tl, cam, titleU, noU, decU, tok, eqU, plotU, curveU, gateU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/delta-decay-gating/overrides.json',
  slug: 'delta-decay-gating',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const HEAT_SCALE = 1.0;

function StateGrid({ S, x, y, u }: { S: Mat; x: number; y: number; u: number }) {
  return (
    <g opacity={u}>
      {S.map((row, i) =>
        row.map((v, j) => (
          <rect
            key={`${i}-${j}`}
            x={x + j * CELL}
            y={y + i * CELL}
            width={CELL - 1.5}
            height={CELL - 1.5}
            rx={2}
            fill={colors.heat(clamp01(0.5 + v / (2 * HEAT_SCALE)))}
            opacity={clamp01(u * D * D - (i * D + j)) * 0.95}
          />
        )),
      )}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const noU = s.get(scene.noU);
  const decU = s.get(scene.decU);
  const tok = s.get(scene.tok);
  const eqU = s.get(scene.eqU);
  const plotU = s.get(scene.plotU);
  const curveU = s.get(scene.curveU);
  const gateU = s.get(scene.gateU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const gridW = D * CELL;
  const curT = Math.max(0.5, curveU * (T - 1));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* no-decay grid */}
          <g opacity={noU}>
            <text x={GRID_NO_X} y={GRID_Y - 28} fill={colors.TEXT} fontSize={16}>
              no forgetting
            </text>
            <text x={GRID_NO_X} y={GRID_Y - 10} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
              α = 1
            </text>
            <StateGrid S={matAt(NO_DECAY, tok)} x={GRID_NO_X} y={GRID_Y} u={noU} />
            <rect x={GRID_NO_X - 5} y={GRID_Y - 5} width={gridW + 8} height={gridW + 8} rx={6} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} opacity={0.7} />
          </g>

          {/* decay grid */}
          <g opacity={decU}>
            <text x={GRID_DEC_X} y={GRID_Y - 28} fill={colors.TEXT} fontSize={16}>
              diagonal decay
            </text>
            <text x={GRID_DEC_X} y={GRID_Y - 10} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
              α = 0.85
            </text>
            <StateGrid S={matAt(DECAY, tok)} x={GRID_DEC_X} y={GRID_Y} u={decU} />
            <rect x={GRID_DEC_X - 5} y={GRID_Y - 5} width={gridW + 8} height={gridW + 8} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} opacity={0.7} />
          </g>

          <text x={GRID_NO_X} y={GRID_Y + gridW + 30} fill={colors.MUTED} fontSize={13} opacity={noU}>
            writes: {Math.round(Math.min(T, tok))} / {T}
          </text>

          {/* recall-by-age plot */}
          {plotU > 0 && (
            <g opacity={plotU}>
              <text x={820} y={168} fill={colors.TEXT} fontSize={16}>
                final recall, by write position
              </text>
              <Axes x={PLOT_X} y={PLOT_Y} reveal={plotU} xTicks={5} yTicks={3} xLabel="write position (old → new)" fontSize={10} />
              <FunctionPlot
                x={PLOT_X}
                y={PLOT_Y}
                f={(u) => lerpArr(RECALL_NO, u)}
                domain={[0, curT]}
                samples={200}
                reveal={1}
                color={colors.NEGATIVE}
                width={2.4}
              />
              <FunctionPlot
                x={PLOT_X}
                y={PLOT_Y}
                f={(u) => lerpArr(RECALL_DEC, u)}
                domain={[0, curT]}
                samples={200}
                reveal={1}
                color={colors.POSITIVE}
                width={2.4}
              />
              {curveU > 0.98 && (
                <g>
                  <text x={PLOT_X(T - 1) + 4} y={PLOT_Y(RECALL_NO[T - 1])} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">
                    {NO_RECENT.toFixed(2)}
                  </text>
                  <text x={PLOT_X(T - 1) + 4} y={PLOT_Y(RECALL_DEC[T - 1]) - 14} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
                    {DEC_RECENT.toFixed(2)}
                  </text>
                  <text x={PLOT_X(0) - 4} y={PLOT_Y(RECALL_DEC[0]) + 18} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
                    {DEC_OLD.toFixed(2)}
                  </text>
                  <text x={PLOT_X(0) - 4} y={PLOT_Y(RECALL_NO[0]) - 10} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">
                    {NO_OLD.toFixed(2)}
                  </text>
                </g>
              )}
              <text x={830} y={600} fill={colors.NEGATIVE} fontSize={13}>
                α = 1 — crowded
              </text>
              <text x={1010} y={600} fill={colors.POSITIVE} fontSize={13}>
                α = 0.85 — recency
              </text>
            </g>
          )}

          {/* gating note */}
          {gateU > 0 && (
            <g opacity={gateU}>
              <text x={170} y={620} fill={colors.MUTED} fontSize={14}>
                gating: α becomes a per-channel, per-token decision — the input chooses what survives
              </text>
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Decay and gating
        </text>
      </g>
      <MathLabel
        tex="S_t = (I - \beta_t k_t k_t^{\top})\,\mathrm{diag}(\alpha_t)\,S_{t-1} + \beta_t k_t v_t^{\top}"
        x={640}
        y={44}
        fontSize={20}
        color={colors.SECONDARY}
        opacity={eqU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Forgetting is a feature.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Decay melts old interference: recent recall 0.70 → 0.96.
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            But a real decay can only shrink. What if it could rotate?
          </text>
        </g>
      )}
    </>
  );
}

export function DeltaDecayGating() {
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
