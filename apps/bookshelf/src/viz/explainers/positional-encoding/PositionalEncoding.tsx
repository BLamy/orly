import { scaleLinear } from 'd3';
import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot, MatrixGrid } from '../../primitives';
import overrides from './overrides.json';
import {
  D_MODEL,
  FOCUS_TOKEN,
  MAX_OFFSET,
  N_POS,
  PE_HEAT,
  ROW_A,
  ROW_FAR,
  ROW_NEAR,
  SHUFFLE,
  WAVE_DIMS,
  WORDS,
  buildScene,
  colWave,
  simAt,
} from './scene';

/**
 * Positional Encoding — order from sinusoids.
 * Pure render: every visual value comes from the sampled SceneState or the
 * module-scope precomputation in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/positional-encoding/overrides.json',
  slug: 'positional-encoding',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// — the sentence row (bag-of-tokens beats) ————————————————————————————————
const TOKEN_Y = 250;
const TOKEN_W = 92;
const TOKEN_H = 44;
const SLOT_DX = 108;
const slotX = (i: number): number => 640 - 2.5 * SLOT_DX + i * SLOT_DX;

// — the fingerprint strip under the focus token ———————————————————————————
const STRIP_CELL = 8;
const STRIP_W = D_MODEL * STRIP_CELL;
const STRIP_Y = 336;

// — the encoding matrix heatmap ————————————————————————————————————————————
const CELL = 15;
const GAP = 1.5;
const PITCH = CELL + GAP;
const GRID_X = 160;
const GRID_Y = 88;
const GRID_W = D_MODEL * PITCH - GAP;
const GRID_H = N_POS * PITCH - GAP;

const ROW_LABELS = Array.from({ length: N_POS }, (_, i) => (i % 8 === 0 ? String(i) : ''));
const COL_LABELS = Array.from({ length: D_MODEL }, (_, j) => (j % 8 === 0 ? String(j) : ''));

const WAVE_COLORS = [colors.ACCENT, colors.POSITIVE, colors.WARM] as const;

// — the pulled-out waveforms (right panel) —————————————————————————————————
const xWave = scaleLinear().domain([0, N_POS - 1]).range([680, 1180]);
const WAVE_CY = [170, 320, 470] as const;
const WAVE_AMP = 52;

// — the similarity panel (replaces the waves in the row beats) —————————————
const SIM_PANEL = { x: 660, y: 130, w: 540, h: 440 } as const;
const xSim = scaleLinear().domain([0, MAX_OFFSET]).range([720, 1160]);
const ySim = scaleLinear().domain([-0.5, 1]).range([SIM_PANEL.y + 390, SIM_PANEL.y + 60]);

function TokenPill({ x, word, glow, opacity }: { x: number; word: string; glow?: number; opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      {(glow ?? 0) > 0 && (
        <rect
          x={x - TOKEN_W / 2 - 5}
          y={TOKEN_Y - TOKEN_H / 2 - 5}
          width={TOKEN_W + 10}
          height={TOKEN_H + 10}
          rx={14}
          fill="none"
          stroke={colors.WARM}
          strokeWidth={2}
          opacity={glow}
        />
      )}
      <rect
        x={x - TOKEN_W / 2}
        y={TOKEN_Y - TOKEN_H / 2}
        width={TOKEN_W}
        height={TOKEN_H}
        rx={10}
        fill={colors.PANEL}
        stroke={colors.GRID}
      />
      <text x={x} y={TOKEN_Y + 6} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
        {word}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tokensU = s.get(scene.tokensU);
  const shuffleU = s.get(scene.shuffleU);
  const tokensOp = s.get(scene.tokensOp);
  const chipsU = s.get(scene.chipsU);
  const fpU = s.get(scene.fpU);
  const addTexU = s.get(scene.addTexU);
  const gridU = s.get(scene.gridU);
  const gridOp = s.get(scene.gridOp);
  const gridTexU = s.get(scene.gridTexU);
  const colHiU = s.get(scene.colHiU);
  const wavesU = s.get(scene.wavesU);
  const wavesOp = s.get(scene.wavesOp);
  const rowFarU = s.get(scene.rowFarU);
  const rowNearU = s.get(scene.rowNearU);
  const simU = s.get(scene.simU);
  const simReveal = s.get(scene.simReveal);
  const recapU = s.get(scene.recapU);

  const rowY = (r: number): number => GRID_Y + r * PITCH;
  const colX = (c: number): number => GRID_X + c * PITCH;

  const rowHighlights: Array<{ row: number; color: string; u: number; tex: string }> = [
    { row: ROW_A, color: colors.ACCENT, u: Math.max(rowFarU, rowNearU), tex: 'p = 8' },
    { row: ROW_FAR, color: colors.NEGATIVE, u: rowFarU, tex: 'p = 20' },
    { row: ROW_NEAR, color: colors.POSITIVE, u: rowNearU, tex: 'p = 10' },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        {/* — the sentence: pills live in slots; the shuffle lerps them over — */}
        {tokensOp > 0 && tokensU > 0 && (
          <g opacity={tokensOp}>
            {WORDS.map((w, i) => {
              const x = lerp(slotX(i), slotX(SHUFFLE[i]), shuffleU);
              return (
                <TokenPill
                  key={i}
                  x={x}
                  word={w}
                  glow={i === FOCUS_TOKEN ? fpU : 0}
                  opacity={clamp01(tokensU * 6 - i)}
                />
              );
            })}
            {/* position chips label the SLOTS, not the words */}
            {chipsU > 0 &&
              WORDS.map((_, i) => (
                <g key={`chip-${i}`} opacity={chipsU}>
                  <circle cx={slotX(i)} cy={TOKEN_Y - 46} r={13} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} />
                  <text x={slotX(i)} y={TOKEN_Y - 41} textAnchor="middle" fill={colors.SECONDARY} fontSize={13}>
                    {i}
                  </text>
                </g>
              ))}
            {/* the focus token's actual fingerprint row, as a mini heat strip */}
            {fpU > 0 && (
              <g opacity={fpU}>
                {PE_HEAT[FOCUS_TOKEN].map((v, j) => (
                  <rect
                    key={j}
                    x={slotX(FOCUS_TOKEN) - STRIP_W / 2 + j * STRIP_CELL}
                    y={STRIP_Y}
                    width={STRIP_CELL - 1}
                    height={14}
                    rx={2}
                    fill={colors.heat(v)}
                  />
                ))}
                <text
                  x={slotX(FOCUS_TOKEN)}
                  y={STRIP_Y + 34}
                  textAnchor="middle"
                  fill={colors.MUTED}
                  fontSize={13}
                  fontStyle="italic"
                >
                  the fingerprint of position {FOCUS_TOKEN}
                </text>
                <MathLabel
                  tex="+"
                  x={slotX(FOCUS_TOKEN)}
                  y={TOKEN_Y + 42}
                  fontSize={22}
                  color={colors.WARM}
                  opacity={fpU}
                />
              </g>
            )}
          </g>
        )}
        <MathLabel
          tex="x_p = e_{\text{word}} + \mathrm{PE}_p"
          x={640}
          y={150}
          fontSize={26}
          color={colors.WARM}
          opacity={addTexU * tokensOp}
        />

        {/* — the encoding matrix: the real 32 × 24 table, column by column — */}
        {gridU > 0 && (
          <g opacity={gridOp}>
            <MatrixGrid
              x={GRID_X}
              y={GRID_Y}
              values={PE_HEAT}
              cell={CELL}
              gap={GAP}
              cellU={(_i, j) => clamp01(gridU * (D_MODEL + 2) - j)}
              rowLabels={ROW_LABELS}
              colLabels={COL_LABELS}
              labelSize={10}
            />
            <g opacity={gridTexU}>
              <MathLabel
                tex="\mathrm{PE} \in \mathbb{R}^{32 \times 24}"
                x={GRID_X + GRID_W / 2}
                y={GRID_Y - 42}
                fontSize={19}
                opacity={gridTexU}
              />
              <text
                x={GRID_X - 46}
                y={GRID_Y + GRID_H / 2}
                fill={colors.MUTED}
                fontSize={13}
                textAnchor="middle"
                transform={`rotate(-90 ${GRID_X - 46} ${GRID_Y + GRID_H / 2})`}
              >
                position p
              </text>
              <text
                x={GRID_X + GRID_W / 2}
                y={GRID_Y + GRID_H + 34}
                fill={colors.MUTED}
                fontSize={13}
                textAnchor="middle"
              >
                dimension k
              </text>
            </g>

            {/* featured wave columns */}
            {colHiU > 0 &&
              WAVE_DIMS.map((k, i) => (
                <rect
                  key={k}
                  x={colX(k) - 2}
                  y={GRID_Y - 2}
                  width={CELL + 4}
                  height={GRID_H + 4}
                  rx={4}
                  fill="none"
                  stroke={WAVE_COLORS[i]}
                  strokeWidth={2}
                  opacity={colHiU}
                />
              ))}

            {/* compared rows */}
            {rowHighlights.map(({ row, color, u, tex }) =>
              u <= 0 ? null : (
                <g key={row} opacity={u}>
                  <rect
                    x={GRID_X - 2}
                    y={rowY(row) - 2}
                    width={GRID_W + 4}
                    height={CELL + 4}
                    rx={4}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                  />
                  <MathLabel
                    tex={tex}
                    x={GRID_X + GRID_W + 46}
                    y={rowY(row) + CELL / 2 + 1}
                    fontSize={15}
                    color={color}
                    opacity={u}
                  />
                </g>
              ),
            )}
          </g>
        )}

        {/* — three real column waveforms, pulled out to the right — */}
        {wavesU > 0 && wavesOp > 0 && (
          <g opacity={wavesOp}>
            {WAVE_DIMS.map((k, i) => {
              const u = clamp01(wavesU * 3 - i);
              if (u <= 0) return null;
              const yW = scaleLinear()
                .domain([-1.2, 1.2])
                .range([WAVE_CY[i] + WAVE_AMP, WAVE_CY[i] - WAVE_AMP]);
              return (
                <g key={k}>
                  <line
                    x1={xWave(0)}
                    x2={xWave(N_POS - 1)}
                    y1={WAVE_CY[i]}
                    y2={WAVE_CY[i]}
                    stroke={colors.GRID}
                    opacity={u}
                  />
                  <FunctionPlot
                    x={xWave}
                    y={yW}
                    f={colWave(k)}
                    domain={[0, N_POS - 1]}
                    reveal={u}
                    color={WAVE_COLORS[i]}
                    width={2.6}
                  />
                  <MathLabel
                    tex={`k = ${k}`}
                    x={xWave(N_POS - 1) + 44}
                    y={WAVE_CY[i] + 5}
                    fontSize={15}
                    color={WAVE_COLORS[i]}
                    opacity={u}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* — the real cosine-similarity falloff — */}
        {simU > 0 && (
          <g opacity={simU}>
            <rect
              x={SIM_PANEL.x}
              y={SIM_PANEL.y}
              width={SIM_PANEL.w}
              height={SIM_PANEL.h}
              rx={12}
              fill={colors.PANEL}
              opacity={0.92}
              stroke={colors.GRID}
            />
            <text x={SIM_PANEL.x + 26} y={SIM_PANEL.y + 36} fill={colors.TEXT} fontSize={16}>
              how alike two fingerprints are, by distance
            </text>
            <Axes x={xSim} y={ySim} reveal={simU} xTicks={5} yTicks={4} xLabel="offset" fontSize={11} />
            <FunctionPlot
              x={xSim}
              y={ySim}
              f={simAt}
              domain={[0, MAX_OFFSET]}
              reveal={simReveal}
              color={colors.POSITIVE}
              width={2.8}
            />
            <MathLabel
              tex="\cos(\mathrm{PE}_8, \mathrm{PE}_{8+o})"
              x={SIM_PANEL.x + SIM_PANEL.w - 118}
              y={SIM_PANEL.y + 66}
              fontSize={15}
              color={colors.POSITIVE}
              opacity={simReveal}
            />
          </g>
        )}
      </Camera>

      {/* — recap, over everything faded to a whisper — */}
      {recapU > 0 && (
        <g opacity={recapU}>
          <MathLabel
            tex="x_p = e_{\text{word}} + \mathrm{PE}_p"
            x={640}
            y={300}
            fontSize={38}
            color={colors.TEXT}
            opacity={recapU}
          />
          <text x={640} y={368} textAnchor="middle" fill={colors.MUTED} fontSize={19} fontStyle="italic">
            order rides along with meaning
          </text>
        </g>
      )}
    </>
  );
}

export function PositionalEncoding() {
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
