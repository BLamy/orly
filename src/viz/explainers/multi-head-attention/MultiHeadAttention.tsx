import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { MatrixGrid } from '../../primitives';
import overrides from './overrides.json';
import {
  ARC_MIN,
  buildScene,
  LANE_YS,
  MAT_CELL,
  MAT_GAP,
  MAT_X,
  MAT_Y,
  N,
  OUT_Y,
  SINGLE_Y,
  TOKEN_XS,
  TOKENS,
  WEIGHTS,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/multi-head-attention/overrides.json',
  slug: 'multi-head-attention',
};

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const HEAD_COLORS = [colors.ACCENT, colors.SECONDARY, colors.WARM];
const HEAD_NAMES = ['head 1 · position', 'head 2 · reference', 'head 3 · description'];

/** off-diagonal arcs worth drawing, precomputed once per head */
const HEAD_ARCS: { i: number; j: number; w: number }[][] = WEIGHTS.map((W) => {
  const arcs: { i: number; j: number; w: number }[] = [];
  W.forEach((row, i) =>
    row.forEach((w, j) => {
      if (i !== j && w > ARC_MIN) arcs.push({ i, j, w });
    }),
  );
  return arcs;
});

const MAT_PITCH = MAT_CELL + MAT_GAP;
const MAT_W = N * MAT_PITCH - MAT_GAP;

/** a rounded token chip; `u` drives the enter pop */
function Chip({
  x,
  y,
  label,
  u = 1,
  w = 100,
  h = 36,
  stroke = colors.GRID,
  text = colors.TEXT,
  fill = colors.PANEL,
  fontSize = 16,
  opacity = 1,
}: {
  x: number;
  y: number;
  label: string;
  u?: number;
  w?: number;
  h?: number;
  stroke?: string;
  text?: string;
  fill?: string;
  fontSize?: number;
  opacity?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  return (
    <g transform={`translate(${x}, ${y}) scale(${0.7 + 0.3 * uu})`} opacity={uu * opacity}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={9} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text y={fontSize / 3} textAnchor="middle" fill={text} fontSize={fontSize}>
        {label}
      </text>
    </g>
  );
}

/** a directed attention arc above a lane; width and opacity carry the REAL weight */
function Arc({
  x1,
  x2,
  baseY,
  w,
  color,
  u,
  opacity = 1,
}: {
  x1: number;
  x2: number;
  baseY: number;
  w: number;
  color: string;
  u: number;
  opacity?: number;
}) {
  if (u <= 0 || opacity <= 0) return null;
  const y = baseY - 22;
  const rise = Math.min(84, 24 + Math.abs(x2 - x1) * 0.16);
  const d = `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - rise} ${x2} ${y}`;
  return (
    <g opacity={opacity * (0.3 + 0.7 * w)}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1 + 5 * w}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - clamp01(u)}
      />
      {u >= 0.98 && <circle cx={x2} cy={y} r={2.5 + 4 * w} fill={color} />}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const chip = s.get(scene.chipU);
  const split = s.get(scene.splitU);
  const limit = s.get(scene.limitU);
  const visit = s.get(scene.visitU);
  const hi = scene.hiU.map((c) => s.get(c));
  const arcs = scene.arcU.map((c) => s.get(c));
  const tag = s.get(scene.laneTagU);
  const matUv = s.get(scene.matU);
  const matP = s.get(scene.matP);
  const stripe = s.get(scene.stripeU);
  const merge = s.get(scene.mergeU);
  const out = s.get(scene.outU);
  const end = s.get(scene.endDim);

  const machineDim = 1 - 0.85 * end; // beat 7 fades the whole machine to a whisper

  // lane opacity: the visiting spotlight dims the two other lanes; the merge
  // beat then folds all three lanes down as their content flows to the output.
  const laneOp = (h: number) => {
    const spot = lerp(1, lerp(0.18, 1, hi[h]), visit);
    return spot * (1 - 0.75 * merge) * machineDim;
  };
  // matrix beat also whispers the lower lanes behind the panel
  const matShade = (h: number) => (h > 0 ? 1 - 0.5 * matUv : 1);

  const laneY = (h: number) => lerp(SINGLE_Y, LANE_YS[h], split);
  const cellU = (i: number, j: number) => clamp01(matP * (N * N) * 0.35 - (i * N + j) * 0.28);

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ── the three lanes (collapsed to one before the split) ── */}
      {[0, 1, 2].map((h) => {
        const y = laneY(h);
        const op = laneOp(h) * matShade(h);
        // before the split only the middle lane (the recap head) is visible
        const laneVis = h === 1 ? 1 : split;
        if (op * laneVis <= 0.01) return null;
        return (
          <g key={`lane${h}`} opacity={op * laneVis}>
            {/* head tag */}
            <text x={54} y={y + 5} fill={HEAD_COLORS[h]} fontSize={15} fontWeight={600} opacity={tag}>
              {HEAD_NAMES[h]}
            </text>
            {/* token chips */}
            {TOKENS.map((tok, i) => (
              <Chip
                key={i}
                x={TOKEN_XS[i]}
                y={y}
                label={tok}
                u={clamp01(chip * 1.7 - i * 0.1)}
                w={Math.max(58, tok.length * 11 + 22)}
                stroke={split > 0.05 && h !== 1 ? HEAD_COLORS[h] : colors.GRID}
              />
            ))}
            {/* the REAL attention arcs — width and glow are the softmax weights */}
            {HEAD_ARCS[h].map(({ i, j, w }, k) => (
              <Arc
                key={k}
                x1={TOKEN_XS[i]}
                x2={TOKEN_XS[j]}
                baseY={y}
                w={w}
                color={HEAD_COLORS[h]}
                u={arcs[h]}
                opacity={h === 1 ? 1 - 0.45 * limit : 1}
              />
            ))}
          </g>
        );
      })}

      {/* ── beat 2: the "one relation" squeeze ── */}
      {limit > 0.01 && (
        <g opacity={limit * (1 - split)}>
          <rect x={410} y={SINGLE_Y - 132} width={460} height={44} rx={10} fill={colors.PANEL} fillOpacity={0.92} stroke={colors.NEGATIVE} />
          <text x={640} y={SINGLE_Y - 104} textAnchor="middle" fill={colors.NEGATIVE} fontSize={17}>
            one head · one relation
          </text>
        </g>
      )}

      {/* ── beat 5: head one's weight matrix as heat — the matrix IS the arcs ── */}
      {matUv > 0.01 && (
        <g opacity={matUv}>
          <rect
            x={MAT_X - 64}
            y={MAT_Y - 40}
            width={MAT_W + 84}
            height={MAT_W + 60}
            rx={12}
            fill={colors.BG}
            fillOpacity={0.88}
            stroke={colors.GRID}
          />
          <MatrixGrid
            x={MAT_X}
            y={MAT_Y}
            values={WEIGHTS[0]}
            cell={MAT_CELL}
            gap={MAT_GAP}
            cellU={cellU}
            emphasize={0.55}
            rowLabels={TOKENS}
            colLabels={TOKENS}
            labelSize={11}
            highlight={{
              cell: [Math.min(N - 1, Math.max(1, Math.round(stripe * (N - 1)))), Math.min(N - 2, Math.max(0, Math.round(stripe * (N - 1)) - 1))] as [number, number],
              color: HEAD_COLORS[0],
              u: stripe > 0 ? Math.min(1, stripe * 4) : 0,
            }}
            opacity={matUv}
          />
        </g>
      )}

      {/* ── beat 6: three streams weave back into one ── */}
      {merge > 0.01 &&
        TOKENS.map((tok, i) => {
          const u = clamp01(merge * 1.35 - i * 0.05);
          if (u <= 0) return null;
          return (
            <g key={`m${i}`}>
              {[0, 1, 2].map((h) => {
                const y0 = LANE_YS[h];
                const cx = TOKEN_XS[i] + (h - 1) * 46; // the weave: side lanes bow outward
                // quadratic bezier from lane to the merged stream
                const t = u;
                const mt = 1 - t;
                const px = mt * mt * TOKEN_XS[i] + 2 * mt * t * cx + t * t * TOKEN_XS[i];
                const py = mt * mt * y0 + 2 * mt * t * (y0 + OUT_Y) * 0.5 + t * t * OUT_Y;
                const fade = t < 0.82 ? 1 : clamp01(1 - (t - 0.82) / 0.18);
                return <circle key={h} cx={px} cy={py} r={7} fill={HEAD_COLORS[h]} opacity={fade * 0.95 * machineDim} />;
              })}
            </g>
          );
        })}

      {/* the merged output row */}
      {out > 0.01 &&
        TOKENS.map((tok, i) => (
          <g key={`o${i}`}>
            <Chip
              x={TOKEN_XS[i]}
              y={OUT_Y}
              label={`${tok}′`}
              u={clamp01(out * 1.7 - i * 0.1)}
              w={Math.max(58, tok.length * 11 + 26)}
              stroke={colors.POSITIVE}
              text={colors.POSITIVE}
              opacity={machineDim + 0.15 * (1 - machineDim)}
            />
            {/* tri-color seam under each merged token: three heads, stitched */}
            <g opacity={clamp01(out * 1.7 - i * 0.1) * machineDim}>
              {[0, 1, 2].map((h) => (
                <rect key={h} x={TOKEN_XS[i] - 27 + h * 18} y={OUT_Y + 22} width={16} height={4} rx={2} fill={HEAD_COLORS[h]} />
              ))}
            </g>
          </g>
        ))}

      {/* ── math labels ── */}
      <MathLabel
        tex="\mathrm{softmax}\!\left(\dfrac{QK^\top}{\sqrt{d_k}}\right)V"
        x={1060}
        y={120}
        fontSize={24}
        opacity={s.get(scene.recapTexU)}
      />
      <MathLabel
        tex="\mathrm{head}_i=\mathrm{softmax}\!\left(\dfrac{Q_iK_i^\top}{\sqrt{d_k}}\right)V_i"
        x={1020}
        y={300}
        fontSize={23}
        opacity={s.get(scene.headTexU)}
      />
      <MathLabel
        tex="\mathrm{MultiHead}=\mathrm{Concat}(\mathrm{head}_1,\ldots,\mathrm{head}_h)\,W^{O}"
        x={640}
        y={470}
        fontSize={24}
        opacity={s.get(scene.concatTexU)}
      />

      {/* ── closing card ── */}
      {s.get(scene.endU) > 0.01 && (
        <g opacity={s.get(scene.endU)}>
          <text x={640} y={230} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={700}>
            many conversations, one stream
          </text>
          <MathLabel
            tex="\mathrm{MultiHead}(Q,K,V)=\mathrm{Concat}(\mathrm{head}_1,\ldots,\mathrm{head}_h)\,W^{O}"
            x={640}
            y={300}
            fontSize={25}
            opacity={s.get(scene.endU)}
          />
        </g>
      )}
    </Camera>
  );
}

export function MultiHeadAttention() {
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
