import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  CLIP_Y,
  FLEX,
  FLEX_LEDGER,
  GAP_XS,
  MEAN_FLEX,
  MEAN_STIFF,
  N_SETS,
  PANEL_H,
  PANEL_W,
  PANEL_X,
  PANEL_Y,
  SETS,
  STIFF,
  STIFF_LEDGER,
  TRUE_F,
  X0,
  buildScene,
  clipped,
  evalPoly,
  singleFitAt,
  xScale,
  yScale,
} from './scene';
import type { Ledger } from './scene';

/**
 * Bias and Variance — the decomposition.
 * Pure render: every value comes from the sampled SceneState or a module-scope
 * precomputation in scene.ts (30 real least-squares fits per model class).
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/bias-variance/overrides.json', slug: 'bias-variance' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// stable per-curve entrance stagger for the spaghetti clouds
const SPAG_STAGGER = 0.6;
const spagOpacity = (u: number, i: number): number =>
  clamp01(u * (1 + SPAG_STAGGER) - (i / (N_SETS - 1)) * SPAG_STAGGER);

// precomputed clipped curve functions (module scope — stable identities)
const FLEX_FNS = FLEX.map((c) => (x: number) => clipped(evalPoly(c, x)));
const STIFF_FNS = STIFF.map((c) => (x: number) => clipped(evalPoly(c, x)));
const MEAN_FLEX_FN = (x: number): number => clipped(evalPoly(MEAN_FLEX, x));
const MEAN_STIFF_FN = (x: number): number => clipped(evalPoly(MEAN_STIFF, x));
const TRUTH_FN = (x: number): number => TRUE_F(x);

// the probe slice geometry
const SLICE_X = xScale(X0);
const TRUTH_Y = yScale(TRUE_F(X0));
// deterministic horizontal jitter so 30 dots read as a column, not a smear
const jitter = (i: number): number => (((i * 37) % 13) - 6) * 1.1;

// ledger bars — linear scale shared by both stacks
const BAR_MAX = 0.075; // > stiff total 0.0678
const BAR_H = 300;
const BAR_W = 84;
const BAR_BASE = PANEL_Y + 420;
const barPx = (v: number): number => (v / BAR_MAX) * BAR_H;
const fmt4 = (v: number): string => v.toFixed(4);

/** One vertical bracket with end caps (the spread annotation at the slice). */
function VBracket({
  x,
  y0,
  y1,
  u,
  color,
  label,
}: {
  x: number;
  y0: number;
  y1: number;
  u: number;
  color: string;
  label: string;
}) {
  if (u <= 0) return null;
  const mid = (y0 + y1) / 2;
  const half = (Math.abs(y1 - y0) / 2) * u;
  return (
    <g opacity={u}>
      <line x1={x} y1={mid - half} x2={x} y2={mid + half} stroke={color} strokeWidth={2} />
      <line x1={x - 6} y1={mid - half} x2={x + 6} y2={mid - half} stroke={color} strokeWidth={2} />
      <line x1={x - 6} y1={mid + half} x2={x + 6} y2={mid + half} stroke={color} strokeWidth={2} />
      <text x={x + 12} y={mid + 5} fill={color} fontSize={15} fontStyle="italic">
        {label}
      </text>
    </g>
  );
}

/** One stacked error bar: noise at the base, bias² and variance above it. */
function ErrorStack({
  x,
  led,
  title,
  accent,
  u,
  numbersU,
}: {
  x: number;
  led: Ledger;
  title: string;
  accent: string;
  u: number;
  numbersU: number;
}) {
  const noiseH = barPx(led.noise) * u;
  const biasH = barPx(led.bias2) * u;
  const varH = barPx(led.variance) * u;
  const yNoise = BAR_BASE - noiseH;
  const yBias = yNoise - biasH;
  const yVar = yBias - varH;
  const num = (y: number, v: number, color: string, h: number) =>
    numbersU > 0 && h > 10 ? (
      <text x={x + BAR_W / 2} y={y + h / 2 + 4} textAnchor="middle" fill={color} fontSize={11.5} opacity={numbersU}>
        {fmt4(v)}
      </text>
    ) : null;
  return (
    <g>
      <rect x={x} y={yNoise} width={BAR_W} height={noiseH} fill={colors.MUTED} opacity={0.55} />
      <rect x={x} y={yBias} width={BAR_W} height={biasH} fill={colors.NEGATIVE} opacity={0.85} />
      <rect x={x} y={yVar} width={BAR_W} height={varH} fill={colors.SECONDARY} opacity={0.85} />
      {num(yNoise, led.noise, colors.TEXT, noiseH)}
      {num(yBias, led.bias2, colors.BG, biasH)}
      {num(yVar, led.variance, colors.BG, varH)}
      <text x={x + BAR_W / 2} y={BAR_BASE + 22} textAnchor="middle" fill={accent} fontSize={14.5}>
        {title}
      </text>
      <g opacity={numbersU}>
        <text x={x + BAR_W / 2} y={yVar - 12} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
          {'sum ' + fmt4(led.sum)}
        </text>
        <text x={x + BAR_W / 2} y={BAR_BASE + 42} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
          {'measured ' + fmt4(led.measured)}
        </text>
      </g>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axesU = s.get(scene.axesU);
  const ptsU = s.get(scene.ptsU);
  const morph = s.get(scene.dataMorph);
  const singleFitU = s.get(scene.singleFitU);
  const truthU = s.get(scene.truthU);
  const spagFlexU = s.get(scene.spagFlexU);
  const meanFlexU = s.get(scene.meanFlexU);
  const flexDim = s.get(scene.flexDim);
  const spagStiffU = s.get(scene.spagStiffU);
  const meanStiffU = s.get(scene.meanStiffU);
  const stiffDim = s.get(scene.stiffDim);
  const gapU = s.get(scene.gapU);
  const probeU = s.get(scene.probeU);
  const dotsStiffU = s.get(scene.dotsStiffU);
  const dotsFlexU = s.get(scene.dotsFlexU);
  const bracketU = s.get(scene.bracketU);
  const panelU = s.get(scene.panelU);
  const barU = s.get(scene.barU);
  const numbersU = s.get(scene.numbersU);
  const mainDim = s.get(scene.mainDim);
  const closeU = s.get(scene.closeU);

  // beat-1 points: dataset 0 lerped to dataset 1
  const d0 = SETS[0];
  const d1 = SETS[1];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainDim}>
        <Camera {...cam}>
          <Axes x={xScale} y={yScale} reveal={axesU} xTicks={6} yTicks={5} fontSize={12} />

          {/* the hidden truth — a dashed ghost */}
          <FunctionPlot
            x={xScale}
            y={yScale}
            f={TRUTH_FN}
            domain={[-1.02, 1.02]}
            reveal={truthU}
            color={colors.POSITIVE}
            width={2.2}
            dash
            opacity={0.75 * Math.min(1, truthU)}
          />

          {/* beat 1: one dataset (morphing to a second) and one flexible fit */}
          {ptsU > 0 &&
            d0.xs.map((_, i) => {
              const px = xScale(d0.xs[i] + (d1.xs[i] - d0.xs[i]) * morph);
              const py = yScale(clipped(d0.ys[i] + (d1.ys[i] - d0.ys[i]) * morph));
              const u = clamp01(ptsU * 1.6 - (i / (d0.xs.length - 1)) * 0.6);
              return (
                <circle key={i} cx={px} cy={py} r={5.5 * u} fill={colors.TEXT} opacity={0.9 * u} />
              );
            })}
          {singleFitU > 0 && (
            <FunctionPlot
              x={xScale}
              y={yScale}
              f={(x) => singleFitAt(morph, x)}
              domain={[-1.02, 1.02]}
              reveal={singleFitU}
              color={colors.WARM}
              width={2.8}
              opacity={Math.min(1, singleFitU)}
            />
          )}

          {/* the flexible ensemble: 30 real degree-9 fits + their mean */}
          <g opacity={flexDim}>
            {spagFlexU > 0 &&
              FLEX_FNS.map((f, i) => (
                <FunctionPlot
                  key={i}
                  x={xScale}
                  y={yScale}
                  f={f}
                  domain={[-1.02, 1.02]}
                  samples={140}
                  color={colors.WARM}
                  width={1.3}
                  opacity={0.2 * spagOpacity(spagFlexU, i)}
                />
              ))}
            {meanFlexU > 0 && (
              <FunctionPlot
                x={xScale}
                y={yScale}
                f={MEAN_FLEX_FN}
                domain={[-1.02, 1.02]}
                reveal={meanFlexU}
                color={colors.WARM}
                width={3.2}
                opacity={0.95}
              />
            )}
          </g>

          {/* the stiff ensemble: 30 real degree-2 fits + their mean */}
          <g opacity={stiffDim}>
            {spagStiffU > 0 &&
              STIFF_FNS.map((f, i) => (
                <FunctionPlot
                  key={i}
                  x={xScale}
                  y={yScale}
                  f={f}
                  domain={[-1.02, 1.02]}
                  samples={80}
                  color={colors.ACCENT}
                  width={1.3}
                  opacity={0.22 * spagOpacity(spagStiffU, i)}
                />
              ))}
            {meanStiffU > 0 && (
              <FunctionPlot
                x={xScale}
                y={yScale}
                f={MEAN_STIFF_FN}
                domain={[-1.02, 1.02]}
                reveal={meanStiffU}
                color={colors.ACCENT}
                width={3.2}
                opacity={0.95}
              />
            )}
          </g>

          {/* whiskers: where the stiff mean misses the truth's bends */}
          {gapU > 0 && (
            <g opacity={gapU}>
              {GAP_XS.map((gx, i) => {
                const yTruth = yScale(TRUE_F(gx));
                const yMean = yScale(MEAN_STIFF_FN(gx));
                return (
                  <line
                    key={i}
                    x1={xScale(gx)}
                    y1={yTruth}
                    x2={xScale(gx)}
                    y2={yMean}
                    stroke={colors.NEGATIVE}
                    strokeWidth={2.4}
                    strokeDasharray="4 3"
                  />
                );
              })}
              <text
                x={xScale(0.62) + 14}
                y={(yScale(TRUE_F(0.62)) + yScale(MEAN_STIFF_FN(0.62))) / 2}
                fill={colors.NEGATIVE}
                fontSize={16}
                fontStyle="italic"
              >
                bias
              </text>
            </g>
          )}

          {/* the probe slice at x0 */}
          {probeU > 0 && (
            <g>
              <line
                x1={SLICE_X}
                y1={yScale(-CLIP_Y)}
                x2={SLICE_X}
                y2={yScale(-CLIP_Y) - (yScale(-CLIP_Y) - yScale(CLIP_Y)) * probeU}
                stroke={colors.TEXT}
                strokeWidth={1.6}
                strokeDasharray="6 5"
                opacity={0.55 * probeU}
              />
              <MathLabel
                tex="x_0"
                x={SLICE_X + 4}
                y={yScale(-CLIP_Y) + 26}
                fontSize={17}
                opacity={probeU}
              />
              {/* the truth at the slice */}
              <circle
                cx={SLICE_X}
                cy={TRUTH_Y}
                r={6}
                fill="none"
                stroke={colors.POSITIVE}
                strokeWidth={2.2}
                opacity={probeU}
              />
            </g>
          )}

          {/* prediction dots: one per model, columns beside the slice */}
          {dotsStiffU > 0 &&
            STIFF_LEDGER.preds.map((p, i) => {
              const u = clamp01(dotsStiffU * 1.5 - (i / (N_SETS - 1)) * 0.5);
              return (
                <circle
                  key={i}
                  cx={SLICE_X - 26 + jitter(i)}
                  cy={yScale(clipped(p))}
                  r={3.4 * u}
                  fill={colors.ACCENT}
                  opacity={0.8 * u * Math.min(1, dotsStiffU)}
                />
              );
            })}
          {dotsFlexU > 0 &&
            FLEX_LEDGER.preds.map((p, i) => {
              const u = clamp01(dotsFlexU * 1.5 - (i / (N_SETS - 1)) * 0.5);
              return (
                <circle
                  key={i}
                  cx={SLICE_X + 26 + jitter(i)}
                  cy={yScale(clipped(p))}
                  r={3.4 * u}
                  fill={colors.WARM}
                  opacity={0.8 * u * Math.min(1, dotsFlexU)}
                />
              );
            })}

          {/* bias arrow (stiff) and spread bracket (flexible) at the slice */}
          {bracketU > 0 && (
            <g>
              <VBracket
                x={SLICE_X - 62}
                y0={TRUTH_Y}
                y1={yScale(STIFF_LEDGER.mean)}
                u={bracketU}
                color={colors.NEGATIVE}
                label="bias"
              />
              <VBracket
                x={SLICE_X + 62}
                y0={yScale(clipped(FLEX_LEDGER.lo))}
                y1={yScale(clipped(FLEX_LEDGER.hi))}
                u={bracketU}
                color={colors.SECONDARY}
                label="spread"
              />
            </g>
          )}
        </Camera>

        {/* screen-fixed model labels (top-left, clear of the panel) */}
        <g opacity={Math.max(spagFlexU * flexDim, 0)}>
          <MathLabel
            tex="\deg 9 \;\; \text{(flexible)}"
            x={116}
            y={96}
            anchor="start"
            fontSize={17}
            color={colors.WARM}
            opacity={spagFlexU}
          />
        </g>
        <g opacity={spagStiffU}>
          <MathLabel
            tex="\deg 2 \;\; \text{(stiff)}"
            x={116}
            y={130}
            anchor="start"
            fontSize={17}
            color={colors.ACCENT}
            opacity={spagStiffU}
          />
        </g>

        {/* the ledger panel */}
        {panelU > 0 && (
          <g opacity={panelU}>
            <rect
              x={PANEL_X}
              y={PANEL_Y}
              width={PANEL_W}
              height={PANEL_H}
              rx={12}
              fill={colors.PANEL}
              opacity={0.88}
              stroke={colors.GRID}
            />
            <text x={PANEL_X + 26} y={PANEL_Y + 38} fill={colors.TEXT} fontSize={17}>
              error at the probe point
            </text>
            <MathLabel
              tex="\mathrm{Bias}^2 + \mathrm{Var} + \sigma^2"
              x={PANEL_X + 26}
              y={PANEL_Y + 72}
              anchor="start"
              fontSize={17}
              color={colors.MUTED}
              opacity={panelU}
            />
            {/* legend */}
            <g fontSize={12.5}>
              <rect x={PANEL_X + 26} y={PANEL_Y + 92} width={12} height={12} fill={colors.NEGATIVE} opacity={0.85} />
              <text x={PANEL_X + 44} y={PANEL_Y + 102} fill={colors.TEXT} fontSize={12.5}>
                squared bias
              </text>
              <rect x={PANEL_X + 148} y={PANEL_Y + 92} width={12} height={12} fill={colors.SECONDARY} opacity={0.85} />
              <text x={PANEL_X + 166} y={PANEL_Y + 102} fill={colors.TEXT} fontSize={12.5}>
                variance
              </text>
              <rect x={PANEL_X + 252} y={PANEL_Y + 92} width={12} height={12} fill={colors.MUTED} opacity={0.55} />
              <text x={PANEL_X + 270} y={PANEL_Y + 102} fill={colors.TEXT} fontSize={12.5}>
                noise
              </text>
            </g>
            <line
              x1={PANEL_X + 30}
              y1={BAR_BASE}
              x2={PANEL_X + PANEL_W - 30}
              y2={BAR_BASE}
              stroke={colors.GRID}
              strokeWidth={1.5}
            />
            <ErrorStack
              x={PANEL_X + 62}
              led={STIFF_LEDGER}
              title="stiff"
              accent={colors.ACCENT}
              u={barU}
              numbersU={numbersU}
            />
            <ErrorStack
              x={PANEL_X + PANEL_W - 62 - BAR_W}
              led={FLEX_LEDGER}
              title="flexible"
              accent={colors.WARM}
              u={barU}
              numbersU={numbersU}
            />
          </g>
        )}
      </g>

      {/* closing card */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <text x={STAGE_W / 2} y={318} textAnchor="middle" fill={colors.TEXT} fontSize={30}>
            Error has two habits.
          </text>
          <text x={STAGE_W / 2} y={366} textAnchor="middle" fill={colors.MUTED} fontSize={19}>
            Wrong the same way every time — bias. Wrong a different way each time — variance.
          </text>
          <text x={STAGE_W / 2} y={412} textAnchor="middle" fill={colors.MUTED} fontSize={19}>
            Valleys, schedules, batches — training is the art of balancing the two.
          </text>
        </g>
      )}
    </>
  );
}

export function BiasVariance() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export { Frame as Render };
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
