import { scaleLinear } from 'd3';
import { MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  BARS,
  CODES,
  CURVE,
  LABELS,
  METER,
  STREAM_BITS,
  buildScene,
  clamp01,
  entropyOf,
  probsAt,
  surprise,
} from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const { ch } = scene;

/** The surprise curve's stage scales. */
const sx = scaleLinear([0, 1], [110, 590]);
const sy = scaleLinear([0, CURVE.iMax], [560, 170]);

const iOf = (p: number) => Math.min(CURVE.iMax, surprise(p));

/** Pixel width of the scrolling bit stream (monospace, ~13px per char). */
const STREAM_W = STREAM_BITS.length * 13;

function renderFrame(s: SceneState) {
  const axesU = s.get(ch.axesU);
  const dotU = s.get(ch.dotU);
  const p = s.get(ch.dotP);
  const surpP = s.get(ch.surpP);
  const codeP = s.get(ch.codeP);
  const streamP = s.get(ch.streamP);
  const meterU = s.get(ch.meterU);

  const probs = probsAt(s.get(ch.m1), s.get(ch.m2), s.get(ch.m3));
  const H = entropyOf(probs);
  const streamAlpha = Math.min(1, streamP * 10, (1 - streamP) * 6);

  return (
    <g>
      {/* ------- left: the surprise curve I(p) ------- */}
      <Axes
        x={sx}
        y={sy}
        reveal={axesU}
        xTicks={5}
        yTicks={6}
        xLabel="p — how likely"
        yLabel="surprise (bits)"
      />
      <FunctionPlot
        x={sx}
        y={sy}
        f={iOf}
        domain={[CURVE.pMin, 1]}
        samples={200}
        reveal={s.get(ch.curveU)}
        color={colors.ACCENT}
        width={2.5}
      />
      <MathLabel
        tex="I(p)=\log_2\tfrac{1}{p}"
        x={400}
        y={132}
        fontSize={26}
        opacity={s.get(ch.texIU)}
      />

      {/* the sliding "one event" dot, with guides back to both axes */}
      {dotU > 0.002 && (
        <g opacity={dotU}>
          <line
            x1={sx(p)}
            y1={sy(iOf(p))}
            x2={sx(p)}
            y2={sy(0)}
            stroke={colors.MUTED}
            strokeWidth={1}
            strokeDasharray="3 5"
            opacity={0.6}
          />
          <line
            x1={sx(0)}
            y1={sy(iOf(p))}
            x2={sx(p)}
            y2={sy(iOf(p))}
            stroke={colors.MUTED}
            strokeWidth={1}
            strokeDasharray="3 5"
            opacity={0.6}
          />
          <circle cx={sx(p)} cy={sy(iOf(p))} r={8} fill={colors.WARM} />
          <text
            x={sx(p) + 16}
            y={sy(iOf(p)) - 12}
            fill={colors.TEXT}
            fontSize={18}
            fontWeight={600}
          >
            {iOf(p).toFixed(1)} bits
          </text>
        </g>
      )}

      {/* small guide dots where each outcome's p meets the curve */}
      {probs.map((pi, i) => {
        const u = clamp01(surpP * 4 - i);
        return u > 0.002 ? (
          <circle
            key={i}
            cx={sx(pi)}
            cy={sy(iOf(pi))}
            r={4.5}
            fill={colors.SECONDARY}
            opacity={u * 0.9}
          />
        ) : null;
      })}

      {/* ------- right: the forecast distribution as bars ------- */}
      {probs.map((pi, i) => {
        const u = s.get(ch.barPop[i]);
        if (u <= 0.002) return null;
        const x = BARS.x0 + i * BARS.step;
        const h = Math.max(0, pi * BARS.hMax * u);
        const chipU = clamp01(surpP * 4 - i);
        const codeU = clamp01(codeP * 4 - i);
        return (
          <g key={LABELS[i]} opacity={Math.min(1, u * 2)}>
            <rect
              x={x}
              y={BARS.base - h}
              width={BARS.w}
              height={h}
              rx={5}
              fill={colors.WARM}
              opacity={0.85}
            />
            <text
              x={x + BARS.w / 2}
              y={BARS.base + 22}
              textAnchor="middle"
              fill={colors.MUTED}
              fontSize={15}
            >
              {LABELS[i]}
            </text>
            {chipU > 0.002 && (
              <text
                x={x + BARS.w / 2}
                y={BARS.base - h - 12}
                textAnchor="middle"
                fill={colors.SECONDARY}
                fontSize={16}
                fontWeight={600}
                opacity={chipU}
              >
                {surprise(pi).toFixed(1)}b
              </text>
            )}
            {codeU > 0.002 && (
              <text
                x={x + BARS.w / 2}
                y={BARS.base + 46}
                textAnchor="middle"
                fill={colors.TEAL}
                fontSize={17}
                fontFamily="ui-monospace, monospace"
                fontWeight={600}
                opacity={codeU}
              >
                {CODES[i]}
              </text>
            )}
          </g>
        );
      })}

      {/* ------- top right: the live entropy meter ------- */}
      {meterU > 0.002 && (
        <g opacity={meterU}>
          <text x={METER.x} y={METER.y - 10} fill={colors.MUTED} fontSize={14}>
            entropy
          </text>
          <rect
            x={METER.x}
            y={METER.y}
            width={METER.w}
            height={METER.h}
            rx={6}
            fill="none"
            stroke={colors.GRID}
            strokeWidth={1.5}
          />
          <rect
            x={METER.x}
            y={METER.y}
            width={Math.max(0, (H / METER.hMax) * METER.w) * meterU}
            height={METER.h}
            rx={6}
            fill={colors.POSITIVE}
            opacity={0.8}
          />
          <text
            x={METER.x + METER.w}
            y={METER.y - 10}
            textAnchor="end"
            fill={colors.TEXT}
            fontSize={17}
            fontWeight={600}
          >
            H = {H.toFixed(2)} bits
          </text>
        </g>
      )}

      {/* the entropy formula, once it has earned the screen time */}
      <MathLabel
        tex="H(P)=\sum_i p_i\,\log_2\tfrac{1}{p_i}"
        x={940}
        y={58}
        fontSize={25}
        opacity={s.get(ch.texHU)}
      />

      {/* ------- beat 5: mean code length = H, plus the broadcast ------- */}
      <MathLabel
        tex="\bar{\ell}=\sum_i p_i\,|c_i|=1.75=H"
        x={940}
        y={300}
        fontSize={23}
        opacity={s.get(ch.texAvgU)}
      />
      {streamAlpha > 0.002 && (
        <g opacity={streamAlpha}>
          <clipPath id="entropy-stream-clip">
            <rect x={METER.x} y={METER.y + 34} width={METER.w} height={34} />
          </clipPath>
          <g clipPath="url(#entropy-stream-clip)">
            <text
              x={METER.x + METER.w + 10 - streamP * (STREAM_W + METER.w + 20)}
              y={METER.y + 58}
              fill={colors.TEAL}
              fontSize={20}
              fontFamily="ui-monospace, monospace"
            >
              {STREAM_BITS}
            </text>
          </g>
        </g>
      )}
    </g>
  );
}

export function Entropy() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/entropy/overrides.json', slug: 'entropy' }}
      >
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
