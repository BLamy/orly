import { MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { Vec } from '../../primitives';
import {
  EIG_LINES,
  EIG_N,
  EIG_SPAN_LEN,
  GRID_N,
  SAMPLES,
  SPAN_LEN,
  STD_LINES,
  V1,
  V2,
  apply,
  buildScene,
  detOf,
  matAt,
  spanOf,
  toX,
  toY,
} from './scene';
import type { Pt } from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

// KaTeX labels. Column 1 of A wears î's color, column 2 wears ĵ's — beat 2's
// whole point is that the columns ARE where the basis vectors land.
const A_TEX =
  'A=\\begin{bmatrix}\\textcolor{#38bdf8}{3}&\\textcolor{#34d399}{1}\\\\\\textcolor{#38bdf8}{0}&\\textcolor{#34d399}{2}\\end{bmatrix}';
const EIG_TEX = 'A\\vec{v}=\\lambda\\,\\vec{v}';
const DET_TEX = '\\det A=\\lambda_1\\lambda_2=3\\cdot 2=6';
const DIAG_TEX = 'P^{-1}\\!A\\,P=\\begin{bmatrix}3&0\\\\0&2\\end{bmatrix}';

// Unit square corners at rest; M(u) turns them into the (î, ĵ) parallelogram.
const SQ_CORNERS: Pt[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

// Spans are lines through the origin, so they never move under M(u): sample
// spans are frozen references, and the eigen spans are genuinely invariant.
const SAMPLE_SPANS = SAMPLES.map((v) => spanOf(v, SPAN_LEN));
const EIG_SPAN_1 = spanOf(V1, EIG_SPAN_LEN);
const EIG_SPAN_2 = spanOf(V2, EIG_SPAN_LEN);

/** Pure render: SceneState in, SVG out. */
function renderFrame(s: SceneState) {
  const u = s.get(scene.gridU);
  const m = matAt(u);
  const reveal = s.get(scene.gridReveal);
  const stdOp = s.get(scene.stdGridU);
  const eigGridOp = s.get(scene.eigGridU);
  const basisOp = s.get(scene.basisOp);
  const samplesOp = s.get(scene.samplesOp);
  const spansU = s.get(scene.spansU);
  const eigU = s.get(scene.eigU);
  const scaleU = s.get(scene.scaleU);
  const sqU = s.get(scene.sqU);

  const S = (p: Pt) => ({ x: toX(p.x), y: toY(p.y) }); // rest position
  const T = (p: Pt) => S(apply(m, p)); // through M(u)
  const lineStag = (ord: number, n: number, r: number) => clamp01(r * (n + 2) - ord);

  const O = S({ x: 0, y: 0 }); // the origin never moves
  const iTip = T({ x: 1, y: 0 });
  const jTip = T({ x: 0, y: 1 });
  const v1Tip = T(V1);
  const v2Tip = T(V2);
  const det = detOf(m);
  const sqPts = SQ_CORNERS.map(T);
  const sqCenter = T({ x: 0.5, y: 0.5 });
  const e1 = EIG_SPAN_1.map(S);
  const e2 = EIG_SPAN_2.map(S);
  const popK = 0.6 + 0.4 * scaleU;

  return (
    <g>
      {/* faint frozen copy of the grid — where space started */}
      {STD_LINES.map((l, i) => {
        const op = lineStag(l.ord, GRID_N, reveal) * stdOp;
        if (op <= 0.004) return null;
        const p = S(l.p);
        const q = S(l.q);
        return (
          <line
            key={`r${i}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke={colors.GRID}
            strokeWidth={1}
            opacity={op * (l.axis ? 0.9 : 0.5)}
          />
        );
      })}

      {/* THE deforming grid: every endpoint pushed through M(u) */}
      {STD_LINES.map((l, i) => {
        const op = lineStag(l.ord, GRID_N, reveal) * stdOp;
        if (op <= 0.004) return null;
        const p = T(l.p);
        const q = T(l.q);
        return (
          <line
            key={`g${i}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke={l.axis ? colors.MUTED : colors.ACCENT}
            strokeWidth={l.axis ? 1.8 : 1}
            opacity={op * (l.axis ? 0.85 : 0.3)}
          />
        );
      })}

      {/* the eigenbasis grid — both families run along eigendirections */}
      {eigGridOp > 0.004 &&
        EIG_LINES.map((l, i) => {
          const op = lineStag(l.ord, EIG_N, eigGridOp);
          if (op <= 0.004) return null;
          const p = T(l.p);
          const q = T(l.q);
          return (
            <line
              key={`e${i}`}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              stroke={l.dir === 'v1' ? colors.WARM : colors.SECONDARY}
              strokeWidth={l.axis ? 1.6 : 1}
              opacity={op * (l.axis ? 0.55 : 0.26)}
            />
          );
        })}

      {/* determinant aside: the unit square and its live area factor */}
      {sqU > 0.004 && (
        <g opacity={sqU}>
          <polygon
            points={sqPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill={colors.ACCENT}
            fillOpacity={0.16}
            stroke={colors.ACCENT}
            strokeOpacity={0.65}
            strokeWidth={2}
          />
          <text x={sqCenter.x} y={sqCenter.y + 6} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            area ×{det.toFixed(1)}
          </text>
        </g>
      )}

      {/* each sample vector's original span — the line it is about to leave */}
      {spansU > 0.004 &&
        SAMPLE_SPANS.map(([p, q], i) => {
          const a = S(p);
          const b = S(q);
          return (
            <line
              key={`ss${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={colors.MUTED}
              strokeWidth={1.2}
              strokeDasharray="4 7"
              opacity={0.4 * spansU}
            />
          );
        })}

      {/* sample vectors, tips at M(u)·v */}
      {samplesOp > 0.004 &&
        SAMPLES.map((v, i) => {
          const grow = s.get(scene.sampleGrow[i]);
          if (grow <= 0) return null;
          const tip = T(v);
          return (
            <Vec
              key={`sv${i}`}
              x1={O.x}
              y1={O.y}
              x2={tip.x}
              y2={tip.y}
              grow={grow}
              color={colors.MUTED}
              width={2.4}
              head={9}
              opacity={samplesOp}
            />
          );
        })}

      {/* the invariant lines — M(u) maps each span onto itself */}
      {eigU > 0.004 && (
        <g opacity={eigU}>
          <line x1={e1[0].x} y1={e1[0].y} x2={e1[1].x} y2={e1[1].y} stroke={colors.WARM} strokeWidth={1.6} strokeDasharray="5 7" opacity={0.55} />
          <line x1={e2[0].x} y1={e2[0].y} x2={e2[1].x} y2={e2[1].y} stroke={colors.SECONDARY} strokeWidth={1.6} strokeDasharray="5 7" opacity={0.55} />
        </g>
      )}

      {/* basis vectors î, ĵ */}
      {basisOp > 0.004 && (
        <g>
          <Vec x1={O.x} y1={O.y} x2={iTip.x} y2={iTip.y} grow={s.get(scene.iU)} color={colors.ACCENT} width={3.4} label="î" opacity={basisOp} />
          <Vec x1={O.x} y1={O.y} x2={jTip.x} y2={jTip.y} grow={s.get(scene.jU)} color={colors.POSITIVE} width={3.4} label="ĵ" opacity={basisOp} />
        </g>
      )}

      {/* the eigenvectors — they stretch along their spans, never off them */}
      {eigU > 0.004 && (
        <g>
          <Vec x1={O.x} y1={O.y} x2={v1Tip.x} y2={v1Tip.y} grow={eigU} color={colors.WARM} width={3.6} label="v₁" labelAt="mid" />
          <Vec x1={O.x} y1={O.y} x2={v2Tip.x} y2={v2Tip.y} grow={eigU} color={colors.SECONDARY} width={3.6} label="v₂" labelAt="mid" />
        </g>
      )}

      {/* ×3 / ×2 scale-factor pops at the stretched tips */}
      {scaleU > 0.004 && (
        <g opacity={clamp01(scaleU)}>
          <g transform={`translate(${toX(3)}, ${toY(0) - 26}) scale(${popK})`}>
            <text textAnchor="middle" fill={colors.WARM} fontSize={23} fontWeight={700}>
              ×3
            </text>
          </g>
          <g transform={`translate(${toX(2.55) + 16}, ${toY(-2.55)}) scale(${popK})`}>
            <text textAnchor="middle" fill={colors.SECONDARY} fontSize={23} fontWeight={700}>
              ×2
            </text>
          </g>
        </g>
      )}

      {/* stage math */}
      <MathLabel tex={A_TEX} x={185} y={120} fontSize={24} opacity={s.get(scene.matU)} />
      <MathLabel tex={EIG_TEX} x={1075} y={105} fontSize={28} opacity={s.get(scene.eigMathU)} />
      <MathLabel tex={DET_TEX} x={1055} y={105} fontSize={22} opacity={s.get(scene.detU)} />
      <MathLabel tex={DIAG_TEX} x={1050} y={120} fontSize={22} opacity={s.get(scene.diagU)} />
    </g>
  );
}

export function Eigen() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/eigen/overrides.json', slug: 'eigen' }}>
        {renderFrame}
      </Player>
    </div>
  );
}
