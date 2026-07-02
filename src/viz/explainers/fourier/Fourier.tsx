import { scaleLinear } from 'd3';
import { Camera, MathLabel, Player, colors } from '../../core';
import type { TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import type { SceneState } from '../../core';
import { FunctionPlot, NumberLine, Vec } from '../../primitives';
import {
  HISTORY,
  ODD,
  SHAPE,
  SHAPE_COEFS,
  SHAPE_PATH,
  SPEC,
  SQ,
  TWO_PI,
  buildScene,
  gTrace,
  harmonicAmps,
  shapeChain,
  squareChain,
} from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/fourier/overrides.json', slug: 'fourier' };

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

// Stage-space scales for the unrolled trace and the spectrum. traceY is
// pinned so traceY(g) === SQ.cy − SQ.R·g — the trace head sits exactly level
// with the epicycle tip.
const traceX = scaleLinear([0, HISTORY], [SQ.traceX0, SQ.traceX1]);
const traceY = scaleLinear([-1.25, 1.25], [SQ.cy + SQ.R * 1.25, SQ.cy - SQ.R * 1.25]);
const specX = scaleLinear([0, 26], [SPEC.x0, SPEC.x1]);

/** The finale chain: 128 DFT circles drawing a star, revealed by lap phase. */
function StarChain({ theta, opacity }: { theta: number; opacity: number }) {
  const cum = shapeChain(theta);
  const tip = cum[cum.length - 1];
  const frac = clamp01(theta / TWO_PI);
  const n = Math.max(1, Math.floor(frac * (SHAPE_PATH.length - 1)) + 1);
  const drawn = SHAPE_PATH.slice(0, n)
    .map((p) => `${(SHAPE.cx + p.x).toFixed(1)} ${(SHAPE.cy + p.y).toFixed(1)}`)
    .join(' L');
  const d =
    frac >= 1
      ? `M${drawn} Z`
      : `M${drawn} L${(SHAPE.cx + tip.x).toFixed(1)} ${(SHAPE.cy + tip.y).toFixed(1)}`;

  return (
    <g opacity={opacity}>
      {SHAPE_COEFS.map((c, i) =>
        c.amp > 1.5 ? (
          <circle
            key={i}
            cx={SHAPE.cx + cum[i].x}
            cy={SHAPE.cy + cum[i].y}
            r={c.amp}
            fill="none"
            stroke={colors.SECONDARY}
            strokeWidth={1}
            opacity={0.3}
          />
        ) : null,
      )}
      <polyline
        points={cum.map((p) => `${(SHAPE.cx + p.x).toFixed(1)},${(SHAPE.cy + p.y).toFixed(1)}`).join(' ')}
        fill="none"
        stroke={colors.MUTED}
        strokeWidth={1.2}
        opacity={0.75}
      />
      {/* glowing trace: three strokes, wide and faint → narrow and bright */}
      <path d={d} fill="none" stroke={colors.ACCENT} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" opacity={0.14} />
      <path d={d} fill="none" stroke={colors.ACCENT} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
      <path d={d} fill="none" stroke={colors.ACCENT} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={SHAPE.cx + tip.x} cy={SHAPE.cy + tip.y} r={4} fill={colors.ACCENT} />
    </g>
  );
}

/** Pure render: SceneState in, SVG out. */
function renderFrame(s: SceneState) {
  const theta = s.get(scene.phase);
  const blend = s.get(scene.blend);
  const sqU = 1 - blend;

  const amps = harmonicAmps(s.get(scene.N));
  const chain = squareChain(amps, theta);
  const tip = chain[chain.length - 1];
  const tipX = SQ.cx + tip.x;
  const tipY = SQ.cy + tip.y;
  const headY = traceY(gTrace(amps, theta)); // === tipY by construction

  return (
    <Camera {...s.get(scene.cam)}>
      {sqU > 0.002 && (
        <g opacity={sqU}>
          {/* time axis under the unrolled trace */}
          <line x1={SQ.traceX0} y1={SQ.cy} x2={SQ.traceX1} y2={SQ.cy} stroke={colors.GRID} strokeWidth={1} />

          {/* epicycle chain: circles… */}
          {ODD.map((n, i) =>
            amps[i] > 0.01 ? (
              <circle
                key={`c${n}`}
                cx={SQ.cx + chain[i].x}
                cy={SQ.cy + chain[i].y}
                r={(SQ.R * amps[i]) / n}
                fill="none"
                stroke={colors.SECONDARY}
                strokeWidth={1.5}
                opacity={0.65}
              />
            ) : null,
          )}
          {/* …and the arrows riding them */}
          {ODD.map((n, i) =>
            amps[i] > 0.01 ? (
              <Vec
                key={`v${n}`}
                x1={SQ.cx + chain[i].x}
                y1={SQ.cy + chain[i].y}
                x2={SQ.cx + chain[i + 1].x}
                y2={SQ.cy + chain[i + 1].y}
                color={colors.TEXT}
                width={2}
                head={8}
              />
            ) : null,
          )}

          {/* tip → trace connector (horizontal: the tip's height IS the wave) */}
          <line x1={tipX} y1={tipY} x2={SQ.traceX0} y2={headY} stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="3 7" opacity={0.9} />
          <circle cx={tipX} cy={tipY} r={4.5 * clamp01(amps[0])} fill={colors.ACCENT} />

          {/* the unrolled wave — closed-form partial series at (θ − offset) */}
          <FunctionPlot
            x={traceX}
            y={traceY}
            f={(d) => gTrace(amps, theta - d)}
            domain={[0, Math.max(0.02, Math.min(theta, HISTORY))]}
            samples={360}
            color={colors.ACCENT}
            width={3}
          />
          <circle cx={SQ.traceX0} cy={headY} r={4.5 * clamp01(amps[0])} fill={colors.ACCENT} />

          {/* frequency domain: same data, second view */}
          <NumberLine scale={specX} y={SPEC.y} reveal={s.get(scene.specReveal)} ticks={13} label="n" fontSize={14} />
          {ODD.map((n, i) => {
            const u = s.get(scene.bars[i]);
            if (u <= 0) return null;
            const h = Math.max(0, (SPEC.barMax / n) * u);
            return (
              <rect key={`b${n}`} x={specX(n) - 5} y={SPEC.y - h} width={10} height={h} rx={2} fill={colors.WARM} opacity={Math.min(1, u)} />
            );
          })}

          {/* stage math */}
          <MathLabel tex="e^{i\omega t}" x={SQ.cx} y={126} fontSize={30} opacity={s.get(scene.texU)} />
          <MathLabel
            tex="\sum_{n\,\mathrm{odd}}^{N} \frac{1}{n}\,\sin(n\omega t)"
            x={880}
            y={104}
            fontSize={23}
            color={colors.MUTED}
            opacity={s.get(scene.sumU)}
          />
        </g>
      )}

      {blend > 0.002 && <StarChain theta={s.get(scene.shapePhase)} opacity={blend} />}
    </Camera>
  );
}

export function Fourier() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {renderFrame}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
