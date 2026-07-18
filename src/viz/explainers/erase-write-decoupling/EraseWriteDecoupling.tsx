// arXiv:2605.22791 — "Gated DeltaNet-2: Decoupling Erase and Write in Linear
// Attention", chapter 3: the paper's move. Baseline (paper Eq. 6):
//   S_t = alpha_t (I - beta_t k_t k_t^T) S_{t-1} + beta_t k_t v_t^T
// — one scalar beta_t scales BOTH the erase and the write. GDN-2 (Eq. 10):
//   S_t = (I - k_t (b_t ⊙ k_t)^T) D_t S_{t-1} + k_t (w_t ⊙ v_t)^T
// with a channel-wise erase gate b_t (key side) and write gate w_t (value
// side). Everything below is computed: store association A, then write an
// overlapping association B. With beta = 1 the coupled rule clobbers A
// (recall cosine 1.00 -> 0.504); the best scalar compromise (beta = 0.56)
// caps BOTH recalls at 0.856; hand-set channel-wise gates (learned in the
// paper, hand-tuned here at toy scale — labeled as such on screen) reach
// A = 0.946, B = 1.000.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import { Axes } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The toy, exactly as in the leading comment. d = 8.
// ---------------------------------------------------------------------------

const D = 8;
type Vec8 = number[];
type Mat = number[][];

const norm = (v: number[]): Vec8 => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const KEY_A = norm([1, 1, 1, 1, 0, 0, 0, 0]);
const KEY_B = norm([0, 1, 1, 1, 1, 0, 0, 0]); // overlaps A on three channels
const VAL_A = norm([1, 0, 1, 0, -1, 0, 1, 0]);
const VAL_B = norm([0, 1, 0, -1, 0, 1, 0, 1]); // orthogonal to VAL_A

const outer = (k: Vec8, v: Vec8): Mat => k.map((ki) => v.map((vj) => ki * vj));
const addM = (A: Mat, B: Mat): Mat => A.map((r, i) => r.map((x, j) => x + B[i][j]));
const readOut = (S: Mat, k: Vec8): Vec8 =>
  Array.from({ length: D }, (_, j) => k.reduce((a, ki, i) => a + ki * S[i][j], 0));
const cosine = (x: Vec8, y: Vec8): number => {
  const nx = Math.hypot(...x);
  const ny = Math.hypot(...y);
  if (nx < 1e-9 || ny < 1e-9) return 0;
  return x.reduce((a, xi, i) => a + xi * y[i], 0) / (nx * ny);
};

/** Paper Eq. 6 with alpha = 1: one scalar beta erases AND writes. */
function coupledWrite(S: Mat, k: Vec8, v: Vec8, beta: number): Mat {
  const r = readOut(S, k);
  const erased = S.map((row, i) => row.map((x, j) => x - beta * k[i] * r[j]));
  return addM(erased, outer(k, v.map((x) => beta * x)));
}

/** Paper Eq. 10 with D_t = I: channel-wise erase gate bg, write gate w. */
function decoupledWrite(S: Mat, k: Vec8, v: Vec8, bg: Vec8, w: Vec8): Mat {
  const kb = k.map((ki, i) => bg[i] * ki);
  const r = readOut(S, kb);
  const erased = S.map((row, i) => row.map((x, j) => x - k[i] * r[j]));
  return addM(erased, outer(k, v.map((x, j) => w[j] * x)));
}

const S_A = outer(KEY_A, VAL_A); // state after storing A (delta rule from zero)

/** The scalar trade-off frontier: recall of A and of B as beta sweeps 0..1. */
const N_BETA = 100;
const FRONTIER = Array.from({ length: N_BETA + 1 }, (_, i) => {
  const beta = i / N_BETA;
  const S = coupledWrite(S_A, KEY_B, VAL_B, beta);
  return {
    beta,
    A: cosine(readOut(S, KEY_A), VAL_A),
    B: cosine(readOut(S, KEY_B), VAL_B),
  };
});
const atBeta = (u: number) => FRONTIER[Math.round(Math.max(0, Math.min(1, u)) * N_BETA)];

// beta = 1 (the clobber) and the best compromise (beta = 0.56, computed)
const CLOBBER = atBeta(1); // A ≈ 0.504, B = 1.000
const BEST_BETA = FRONTIER.reduce((b, p) => (Math.min(p.A, p.B) > Math.min(b.A, b.B) ? p : b));

// hand-set channel-wise gates (labeled on screen as hand-tuned at toy scale)
const ERASE_GATE: Vec8 = [1, 1, 1, 1, 0.4, 0.4, 0.4, 0.4];
const WRITE_GATE: Vec8 = [1, 0.2, 0.2, 0.2, 0.5, 0.2, 1, 0.2];
const S_DEC = decoupledWrite(S_A, KEY_B, VAL_B, ERASE_GATE, WRITE_GATE);
const DEC = {
  A: cosine(readOut(S_DEC, KEY_A), VAL_A), // 0.946
  B: cosine(readOut(S_DEC, KEY_B), VAL_B), // 1.000
};

/** State along the coupled write, interpolated in beta for the animation. */
const stateAtBeta = (u: number): Mat => coupledWrite(S_A, KEY_B, VAL_B, Math.max(0, Math.min(1, u)));

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const CELL = 26;
const GRID = { x: 150, y: 190 };
const HEAT = 0.9;

const PLOT_X = scaleLinear().domain([0, 1]).range([700, 1150]); // recall B
const PLOT_Y = scaleLinear().domain([0, 1]).range([560, 200]); // recall A

const BAR = { x: 150, w: 220, h: 20 };

const CAM_GRID: CameraState = { x: 380, y: 330, k: 1.25 };
const CAM_PLOT: CameraState = { x: 880, y: 370, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  betaU: ChannelRef<number>;
  eqU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  frontU: ChannelRef<number>;
  frontDraw: ChannelRef<number>;
  gatesU: ChannelRef<number>;
  decU: ChannelRef<number>;
  eq2U: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const gridU = tl.channel('gridU', 0);
  const betaU = tl.channel('betaU', 0);
  const eqU = tl.channel('eqU', 0);
  const barsU = tl.channel('barsU', 0);
  const frontU = tl.channel('frontU', 0);
  const frontDraw = tl.channel('frontDraw', 0);
  const gatesU = tl.channel('gatesU', 0);
  const decU = tl.channel('decU', 0);
  const eq2U = tl.channel('eq2U', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — setup: one memory already stored
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'The state already holds one memory. Call it memory A: its key lives on the first four channels, and recall of it is perfect.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(gridU, 1, { at: 0.8, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAM_GRID, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(barsU, 1, { at: 3.4, dur: 0.8, ease: ease.enter });
  tl.hold(6.1, 0.5);

  // Beat 2 — the clobber
  tl.caption({
    at: 6.6,
    dur: 6.2,
    text: 'Now a second memory arrives, and its key overlaps the first on three channels. The old rule commits it with one scalar, which erases and writes in the same stroke.',
  });
  tl.tween(eqU, 1, { at: 7.0, dur: 0.8, ease: ease.enter });
  tl.tween(betaU, 1, { at: 9.4, dur: 2.6, ease: ease.move });
  tl.caption({
    at: 13.0,
    dur: 6.0,
    text: 'Watch the damage. Memory B lands perfectly — but erasing at the write address reached through the overlap and clobbered memory A. Its recall just fell from one point zero to zero point five.',
  });
  tl.hold(19.0, 0.7);

  // Beat 3 — the scalar trade-off frontier
  tl.caption({
    at: 19.7,
    dur: 5.6,
    text: 'Maybe the scalar was just too aggressive? Sweep it from zero to one and plot both recalls against each other.',
  });
  tl.tween(cam, CAM_PLOT, { at: 20.0, dur: 1.4, ease: ease.move });
  tl.tween(frontU, 1, { at: 20.6, dur: 1.0, ease: ease.draw });
  tl.tween(frontDraw, 1, { at: 21.8, dur: 3.6, ease: ease.linear });
  tl.caption({
    at: 25.4,
    dur: 6.4,
    text: 'The curve is the whole story: protect the old memory and the new one is barely written. Commit the new one and the old one dies. The best compromise caps both at zero point eight six.',
  });
  tl.hold(31.8, 0.7);

  // Beat 4 — the decoupled rule
  tl.caption({
    at: 32.5,
    dur: 6.4,
    text: 'The paper cuts the weld. Erasing gets its own channel-wise gate on the key side, and writing gets its own channel-wise gate on the value side. They no longer have to agree.',
  });
  tl.tween(eqU, 0, { at: 32.7, dur: 0.8, ease: ease.move });
  tl.tween(eq2U, 1, { at: 33.1, dur: 0.9, ease: ease.enter });
  tl.tween(gatesU, 1, { at: 35.4, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 39.3,
    dur: 6.2,
    text: 'Erase hard on the channels the new memory truly owns, barely touch the ones the old memory needs, and write the value through its own mask. We set these gates by hand; the model learns them.',
  });
  tl.tween(decU, 1, { at: 41.6, dur: 1.0, ease: ease.pop });
  tl.caption({
    at: 45.9,
    dur: 5.8,
    text: 'The decoupled point lands off the frontier entirely: the new memory at one point zero, the old one at zero point nine five. Same state size. No scalar can reach it.',
  });
  tl.hold(51.7, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 52.4,
    dur: 5.6,
    text: 'That is the whole paper in one picture: erase where the old memory is not, write where the new one belongs — two decisions, finally allowed to disagree.',
  });
  tl.tween(closeU, 1, { at: 53.0, dur: 1.0, ease: ease.enter });
  tl.hold(58.0, 1.2);

  return { tl, cam, titleU, gridU, betaU, eqU, barsU, frontU, frontDraw, gatesU, decU, eq2U, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/erase-write-decoupling/overrides.json',
  slug: 'erase-write-decoupling',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function RecallBar({ y, label, value, color, u }: { y: number; label: string; value: number; color: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <text x={BAR.x} y={y - 6} fill={colors.MUTED} fontSize={13}>
        {label}
      </text>
      <rect x={BAR.x} y={y} width={BAR.w} height={BAR.h} rx={4} fill={colors.PANEL} stroke={colors.GRID} />
      <rect x={BAR.x} y={y} width={BAR.w * clamp01(value)} height={BAR.h} rx={4} fill={color} opacity={0.85} />
      <text x={BAR.x + BAR.w + 10} y={y + 15} fill={color} fontSize={14} fontFamily="monospace">
        {value.toFixed(2)}
      </text>
    </g>
  );
}

function GateStrip({ x, y, g, label, color, u }: { x: number; y: number; g: Vec8; label: string; color: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <text x={x} y={y - 8} fill={color} fontSize={13}>
        {label}
      </text>
      {g.map((v, i) => (
        <rect key={i} x={x + i * 24} y={y} width={20} height={20} rx={3} fill={color} opacity={0.15 + 0.75 * v} />
      ))}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const gridU = s.get(scene.gridU);
  const betaU = s.get(scene.betaU);
  const eqU = s.get(scene.eqU);
  const barsU = s.get(scene.barsU);
  const frontU = s.get(scene.frontU);
  const frontDraw = s.get(scene.frontDraw);
  const gatesU = s.get(scene.gatesU);
  const decU = s.get(scene.decU);
  const eq2U = s.get(scene.eq2U);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;

  // state grid: coupled sweep while betaU animates; snaps to decoupled state when decU rises
  const Scur = decU > 0.5 ? S_DEC : stateAtBeta(betaU);
  const cur = atBeta(betaU);
  const recA = decU > 0.5 ? DEC.A : cur.A;
  const recB = decU > 0.5 ? DEC.B : cur.B;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the state grid */}
          <g opacity={gridU}>
            <text x={GRID.x} y={GRID.y - 40} fill={colors.TEXT} fontSize={18}>
              the state, eight by eight
            </text>
            <text x={GRID.x} y={GRID.y - 18} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
              rows: key channels · cols: value channels
            </text>
            {Scur.map((row, i) =>
              row.map((v, j) => (
                <rect
                  key={`${i}-${j}`}
                  x={GRID.x + j * CELL}
                  y={GRID.y + i * CELL}
                  width={CELL - 2}
                  height={CELL - 2}
                  rx={3}
                  fill={colors.heat(clamp01(0.5 + v / (2 * HEAT)))}
                />
              )),
            )}
            {/* A's key support marker */}
            <rect
              x={GRID.x - 10}
              y={GRID.y}
              width={5}
              height={4 * CELL - 2}
              rx={2}
              fill={colors.ACCENT}
            />
            <text x={GRID.x - 18} y={GRID.y + 2 * CELL} textAnchor="end" fill={colors.ACCENT} fontSize={13}>
              key A
            </text>
            <rect
              x={GRID.x + D * CELL + 5}
              y={GRID.y + CELL}
              width={5}
              height={4 * CELL - 2}
              rx={2}
              fill={colors.WARM}
            />
            <text x={GRID.x + D * CELL + 16} y={GRID.y + 3 * CELL} fill={colors.WARM} fontSize={13}>
              key B
            </text>
          </g>

          {/* recall bars */}
          <RecallBar y={452} label="recall of memory A" value={recA} color={recA > 0.9 ? colors.POSITIVE : colors.NEGATIVE} u={barsU * gridU} />
          <RecallBar y={518} label="recall of memory B" value={recB} color={colors.WARM} u={barsU * gridU} />

          {/* gates */}
          <GateStrip x={460} y={452} g={ERASE_GATE} label="erase gate, key side (hand-set at toy scale)" color={colors.NEGATIVE} u={gatesU} />
          <GateStrip x={460} y={524} g={WRITE_GATE} label="write gate, value side (hand-set at toy scale)" color={colors.POSITIVE} u={gatesU} />

          {/* the trade-off frontier */}
          {frontU > 0 && (
            <g opacity={frontU}>
              <text x={700} y={168} fill={colors.TEXT} fontSize={16}>
                one scalar: recall A versus recall B, beta swept zero to one
              </text>
              <Axes x={PLOT_X} y={PLOT_Y} reveal={frontU} xTicks={4} yTicks={4} xLabel="recall B" yLabel="recall A" fontSize={11} />
              {/* frontier as a polyline (parametric in beta) */}
              <path
                d={FRONTIER.slice(0, Math.max(2, Math.round(frontDraw * N_BETA)))
                  .map((p, i) => `${i === 0 ? 'M' : 'L'}${PLOT_X(p.B).toFixed(1)} ${PLOT_Y(p.A).toFixed(1)}`)
                  .join('')}
                fill="none"
                stroke={colors.SECONDARY}
                strokeWidth={2.6}
              />
              {frontDraw > 0.98 && (
                <g>
                  <circle cx={PLOT_X(BEST_BETA.B)} cy={PLOT_Y(BEST_BETA.A)} r={5} fill={colors.SECONDARY} />
                  <text x={PLOT_X(BEST_BETA.B) - 10} y={PLOT_Y(BEST_BETA.A) - 12} textAnchor="end" fill={colors.SECONDARY} fontSize={12}>
                    best compromise · {BEST_BETA.A.toFixed(2)} / {BEST_BETA.B.toFixed(2)}
                  </text>
                  <circle cx={PLOT_X(CLOBBER.B)} cy={PLOT_Y(CLOBBER.A)} r={5} fill={colors.NEGATIVE} />
                  <text x={PLOT_X(CLOBBER.B) - 10} y={PLOT_Y(CLOBBER.A) + 20} textAnchor="end" fill={colors.NEGATIVE} fontSize={12}>
                    full write · A clobbered to {CLOBBER.A.toFixed(2)}
                  </text>
                </g>
              )}
              {decU > 0 && (
                <g opacity={decU}>
                  <circle cx={PLOT_X(DEC.B)} cy={PLOT_Y(DEC.A)} r={7 * Math.min(1, decU)} fill={colors.POSITIVE} />
                  <circle cx={PLOT_X(DEC.B)} cy={PLOT_Y(DEC.A)} r={13} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={0.6} />
                  <text x={PLOT_X(DEC.B) - 14} y={PLOT_Y(DEC.A) - 16} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontWeight={600}>
                    decoupled · {DEC.A.toFixed(2)} / {DEC.B.toFixed(2)}
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Erase, then write
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2605.22791 · Eq. 6 vs Eq. 10
        </text>
      </g>
      <MathLabel
        tex="S_t = \alpha_t (I - \beta_t k_t k_t^{\top}) S_{t-1} + \beta_t k_t v_t^{\top}"
        x={640}
        y={70}
        anchor="start"
        fontSize={20}
        color={colors.SECONDARY}
        opacity={eqU * mainOp}
      />
      <MathLabel
        tex="S_t = (I - k_t (b_t \odot k_t)^{\top})\, D_t S_{t-1} + k_t (w_t \odot v_t)^{\top}"
        x={620}
        y={70}
        anchor="start"
        fontSize={20}
        color={colors.POSITIVE}
        opacity={eq2U * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Two gates beat one scalar.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Coupled best compromise: 0.86 / 0.86 — decoupled: 0.95 / 1.00,
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            computed here at toy scale, learned end to end in the paper.
          </text>
        </g>
      )}
    </>
  );
}

export function EraseWriteDecoupling() {
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
