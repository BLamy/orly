import { Camera, MathLabel, Player, colors } from '../../core';
import type { TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import type { SceneState } from '../../core';
import { MatrixGrid, Vec } from '../../primitives';
import {
  buildScene,
  CELL,
  DOM_COL,
  EMBED,
  FAN_Y,
  FOCUS,
  GAP,
  K_Y,
  MATRIX_X,
  MATRIX_Y,
  N,
  OUT_X,
  OUT_Y,
  Q_Y,
  RAW_MAX,
  RAW_NORM,
  TOKEN_XS,
  TOKEN_Y,
  TOKENS,
  V_Y,
  WEIGHTS,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/attention/overrides.json', slug: 'attention' };

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const PITCH = CELL + GAP;
const MAT_W = N * PITCH - GAP;
const MAT_H = N * PITCH - GAP;

/** A rounded-rect token chip; `u` drives the enter pop, `scale` any extra sizing. */
function Chip({
  x,
  y,
  label,
  u = 1,
  w = 74,
  h = 42,
  scale = 1,
  fill = colors.PANEL,
  stroke = colors.GRID,
  text = colors.TEXT,
  fontSize = 17,
  strokeWidth = 1.5,
  opacity = 1,
}: {
  x: number;
  y: number;
  label: string;
  u?: number;
  w?: number;
  h?: number;
  scale?: number;
  fill?: string;
  stroke?: string;
  text?: string;
  fontSize?: number;
  strokeWidth?: number;
  opacity?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  const s = (0.7 + 0.3 * uu) * scale;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} opacity={uu * opacity}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <text y={fontSize / 3} textAnchor="middle" fill={text} fontSize={fontSize}>
        {label}
      </text>
    </g>
  );
}

const QKV_ROWS = [
  { y: Q_Y, letter: 'Q', color: colors.ACCENT, ch: scene.qRowU },
  { y: K_Y, letter: 'K', color: colors.SECONDARY, ch: scene.kRowU },
  { y: V_Y, letter: 'V', color: colors.POSITIVE, ch: scene.vRowU },
] as const;

function Frame({ s }: { s: SceneState }) {
  const b = s.get(scene.blend);
  const gp = s.get(scene.glideP);
  const fp = s.get(scene.fullP);
  const matUv = s.get(scene.matU);
  const dim = 1 - 0.55 * s.get(scene.dimU);
  const fan = s.get(scene.fanU);
  const gather = s.get(scene.vGather);
  const qsatUv = s.get(scene.qsatU);

  // ── matrix state, derived per frame from sampled channels ──
  // The derived-stagger pattern: all 36 cells cascade from ONE channel.
  const cellU = (i: number, j: number) => {
    const full = clamp01(fp * 36 - (i * N + j));
    return i === FOCUS ? Math.max(clamp01(gp * N - j), full) : full;
  };
  // Focus row crossfades raw scores → real softmax weights; other rows fill
  // (in beat 6, when blend is already 1) straight to weights.
  const values = WEIGHTS.map((row, i) =>
    i === FOCUS ? row.map((w, j) => lerp(RAW_NORM[i][j], w, b)) : row,
  );
  // Displayed numbers ride the same blend: raw q·k/√dk at b=0, weights at b=1.
  const valueScale = lerp(RAW_MAX, 1, b);
  const fmtCell = (v: number) => (v * valueScale).toFixed(2);
  // Emphasis threshold sweeps down with the blend so the dominant cell
  // "catches fire" (HEAT_MAX) as softmax sharpens; in beat 6 every row's
  // winner (all ≥ 0.52, runners-up ≤ 0.26) crosses it too.
  const emphasize = 2 - 1.55 * b;

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ── token chips across the top ── */}
      {TOKENS.map((tok, i) => (
        <Chip key={`t${i}`} x={TOKEN_XS[i]} y={TOKEN_Y} label={tok} u={s.get(scene.chipU[i])} />
      ))}
      {/* focus ring on "sat" */}
      <rect
        x={TOKEN_XS[FOCUS] - 42}
        y={TOKEN_Y - 26}
        width={84}
        height={52}
        rx={12}
        fill="none"
        stroke={colors.WARM}
        strokeWidth={2}
        opacity={s.get(scene.satU)}
      />

      {/* ── vector fans: "each word is a vector" ── */}
      <g opacity={dim}>
        {TOKENS.map((_, i) => {
          const fu = clamp01(fan * 1.6 - i * 0.12);
          if (fu <= 0) return null;
          return (
            <g key={`f${i}`}>
              {[0, 1, 2].map((k) => {
                const a = Math.PI / 2 + (k - 1) * 0.55 + EMBED[i][k] * 0.25;
                const len = 20 + 6 * Math.abs(EMBED[i][k + 1]);
                return (
                  <Vec
                    key={k}
                    x1={TOKEN_XS[i]}
                    y1={FAN_Y}
                    x2={TOKEN_XS[i] + Math.cos(a) * len}
                    y2={FAN_Y + Math.sin(a) * len}
                    grow={fu}
                    color={colors.MUTED}
                    width={2}
                    head={7}
                    opacity={0.9}
                  />
                );
              })}
            </g>
          );
        })}
      </g>

      {/* ── Q / K / V rows sliding down out of the tokens ── */}
      <g opacity={dim}>
        {QKV_ROWS.map((row) => {
          const rowU = s.get(row.ch);
          return (
            <g key={row.letter}>
              <text x={66} y={row.y + 6} textAnchor="middle" fill={row.color} fontSize={20} fontWeight={700} opacity={rowU}>
                {row.letter}
              </text>
              {TOKENS.map((tok, i) => {
                const u = clamp01(rowU * 1.45 - i * 0.09);
                if (u <= 0) return null;
                const yBase = lerp(TOKEN_Y, row.y, u);
                // beat 5: the V row converges into the output chip, scaled by
                // the focus row's REAL softmax weights
                const isV = row.letter === 'V';
                const g = isV ? gather : 0;
                const x = lerp(TOKEN_XS[i], OUT_X, g);
                const y = lerp(yBase, OUT_Y, g);
                const sc = lerp(1, 0.35 + 1.35 * WEIGHTS[FOCUS][i], g);
                const fade = g < 0.75 ? 1 : clamp01(1 - (g - 0.75) / 0.25);
                // beat 3: K chips pulse as the roaming query sweeps past
                const pulse =
                  row.letter === 'K' ? Math.max(0, 1 - Math.abs(gp - i / (N - 1)) * 6) * qsatUv : 0;
                const tagU = isV ? clamp01(g * 5) * clamp01((0.82 - g) * 6) : 0;
                return (
                  <g key={i}>
                    <Chip
                      x={x}
                      y={y}
                      label={tok}
                      u={u}
                      w={58}
                      h={32}
                      fontSize={14}
                      scale={sc * (1 + 0.16 * pulse)}
                      stroke={row.color}
                      text={row.color}
                      opacity={fade}
                    />
                    {tagU > 0 && (
                      <text x={x} y={y + 32} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} opacity={tagU}>
                        ×{WEIGHTS[FOCUS][i].toFixed(2)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>

      {/* ── the score matrix, center-right ── */}
      <g opacity={matUv}>
        <rect
          x={MATRIX_X - 10}
          y={MATRIX_Y - 10}
          width={MAT_W + 20}
          height={MAT_H + 20}
          rx={12}
          fill={colors.PANEL}
          fillOpacity={0.5}
          stroke={colors.GRID}
        />
        {TOKENS.map((tok, j) => (
          <text
            key={`c${j}`}
            x={MATRIX_X + j * PITCH + CELL / 2}
            y={MATRIX_Y - 18}
            textAnchor="middle"
            fill={colors.MUTED}
            fontSize={15}
          >
            {tok}
          </text>
        ))}
        {TOKENS.map((tok, i) => (
          <text
            key={`r${i}`}
            x={MATRIX_X - 16}
            y={MATRIX_Y + i * PITCH + CELL / 2 + 5}
            textAnchor="end"
            fill={i === FOCUS ? colors.WARM : colors.MUTED}
            fontSize={15}
            opacity={i === FOCUS ? 1 : cellU(i, 0)}
          >
            {tok}
          </text>
        ))}
      </g>
      <MatrixGrid
        x={MATRIX_X}
        y={MATRIX_Y}
        values={values}
        cell={CELL}
        gap={GAP}
        cellU={cellU}
        emphasize={emphasize}
        showValues={fmtCell}
        highlight={{ cell: [FOCUS, DOM_COL] as [number, number], color: colors.HEAT_MAX, u: s.get(scene.domU) }}
        opacity={matUv}
      />

      {/* ── the roaming query chip (beat 3) ── */}
      <Chip
        x={s.get(scene.qsatX)}
        y={s.get(scene.qsatY)}
        label="q·sat"
        u={qsatUv}
        w={58}
        h={32}
        fontSize={13}
        fill={colors.ACCENT}
        stroke={colors.ACCENT}
        text="#08101f"
      />

      {/* ── the output chip (beat 5) ── */}
      <Chip
        x={OUT_X}
        y={OUT_Y}
        label="sat′"
        u={s.get(scene.outU)}
        w={84}
        h={40}
        stroke={colors.POSITIVE}
        text={colors.POSITIVE}
        strokeWidth={2}
      />

      {/* ── math labels ── */}
      <MathLabel
        tex="Q = XW_Q,\;\; K = XW_K,\;\; V = XW_V"
        x={372}
        y={428}
        fontSize={24}
        opacity={s.get(scene.qkvTexU)}
      />
      <MathLabel
        tex="\dfrac{q_{\text{sat}}\cdot k_j}{\sqrt{d_k}}"
        x={MATRIX_X + MAT_W / 2}
        y={556}
        fontSize={24}
        opacity={s.get(scene.scoreTexU)}
      />
      <MathLabel
        tex="\mathrm{softmax}\!\left(\dfrac{q\cdot k}{\sqrt{d_k}}\right)"
        x={MATRIX_X + MAT_W / 2}
        y={556}
        fontSize={24}
        opacity={s.get(scene.softTexU)}
      />
      <MathLabel
        tex="\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\dfrac{QK^\top}{\sqrt{d_k}}\right)V"
        x={372}
        y={448}
        fontSize={23}
        opacity={s.get(scene.formulaU)}
      />
    </Camera>
  );
}

export function Attention() {
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
