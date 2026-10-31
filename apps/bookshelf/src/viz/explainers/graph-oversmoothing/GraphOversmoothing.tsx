import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import { DEPTH, N, SEP, buildScene, cx, cy, featAt, fx, fy, sepAt } from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** normalized separation as a function of depth — pure lookup for the plot */
const sepNorm = (d: number) => sepAt(d) / SEP[0];

function renderFrame(s: SceneState) {
  const axU = s.get(scene.axU);
  const dotU = s.get(scene.dotU);
  const depth = s.get(scene.depth);
  const curveU = s.get(scene.curveU);
  const markU = s.get(scene.markU);
  const noteU = s.get(scene.noteU);
  const fixU = s.get(scene.fixU);

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ── the feature plane ── */}
      <Axes x={fx} y={fy} reveal={axU} grid xTicks={5} yTicks={5} xLabel="feature 1" yLabel="feature 2" />
      <g opacity={clamp01(axU * 4)}>
        <text x={370} y={100} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
          node features · after {Math.round(depth)} layer{Math.round(depth) === 1 ? '' : 's'}
        </text>
      </g>
      {/* community halos and the gap between their centers: both shrink with depth */}
      {(() => {
        const pts = Array.from({ length: N }, (_, i) => featAt(i, depth));
        const cen = (lo: number, hi: number) => {
          let x = 0;
          let y = 0;
          for (let i = lo; i < hi; i++) {
            x += pts[i][0];
            y += pts[i][1];
          }
          return [x / (hi - lo), y / (hi - lo)] as const;
        };
        const c0 = cen(0, 5);
        const c1 = cen(5, N);
        const halo = (lo: number, hi: number, c: readonly [number, number], color: string) => {
          let r = 0;
          for (let i = lo; i < hi; i++) r = Math.max(r, Math.hypot(pts[i][0] - c[0], pts[i][1] - c[1]));
          return <circle cx={fx(c[0])} cy={fy(c[1])} r={fx(c[0] + r) - fx(c[0]) + 6} fill={color} fillOpacity={0.12} />;
        };
        return (
          <g opacity={dotU}>
            {halo(0, 5, c0, colors.NEGATIVE)}
            {halo(5, N, c1, colors.ACCENT)}
            <line
              x1={fx(c0[0])}
              y1={fy(c0[1])}
              x2={fx(c1[0])}
              y2={fy(c1[1])}
              stroke={colors.MUTED}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              opacity={0.8}
            />
          </g>
        );
      })()}
      {Array.from({ length: N }, (_, i) => {
        const [a, b] = featAt(i, depth);
        const u = clamp01(dotU * N - i * 0.5);
        return (
          <circle
            key={i}
            cx={fx(a)}
            cy={fy(b)}
            r={11 * u}
            fill={i < 5 ? colors.NEGATIVE : colors.ACCENT}
            fillOpacity={0.9}
            stroke="#0a0e1a"
            strokeWidth={1.5}
          />
        );
      })}

      {/* ── the separation curve ── */}
      <g opacity={curveU}>
        <text x={(760 + 1180) / 2} y={170} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
          community separation vs depth
        </text>
      </g>
      <Axes x={cx} y={cy} reveal={curveU} xTicks={4} yTicks={4} xLabel="layers" yLabel="separation" />
      <FunctionPlot x={cx} y={cy} f={sepNorm} domain={[0, DEPTH]} reveal={curveU} color={colors.WARM} width={3} />
      {markU > 0.01 && (
        <g opacity={markU}>
          <circle cx={cx(Math.min(depth, DEPTH))} cy={cy(sepNorm(depth))} r={7} fill={colors.WARM} />
          <text x={cx(Math.min(depth, DEPTH))} y={cy(sepNorm(depth)) - 14} textAnchor="middle" fill={colors.WARM} fontSize={13}>
            {sepNorm(depth).toFixed(2)}×
          </text>
        </g>
      )}

      {/* the contraction note */}
      <MathLabel
        tex="H^{(k+1)} = D^{-1} A\, H^{(k)}"
        x={970}
        y={580}
        fontSize={20}
        color={colors.MUTED}
        opacity={noteU}
      />
      {/* the residual fix */}
      <MathLabel
        tex="h_i' = h_i + \mathrm{mean}_{j \in N(i)}\, h_j"
        x={970}
        y={580}
        fontSize={19}
        color={colors.POSITIVE}
        opacity={fixU}
      />
    </Camera>
  );
}

export function GraphOversmoothing() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/graph-oversmoothing/overrides.json', slug: 'graph-oversmoothing' }}
      >
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
