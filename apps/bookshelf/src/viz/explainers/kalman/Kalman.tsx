import { scaleLinear } from 'd3';
import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { FunctionPlot, NumberLine } from '../../primitives';
import overrides from './overrides.json';
import { BASE_Y, POST, R, SCATTER, WORLD, Z, buildScene } from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const { ch } = scene;

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Hallway world coords → stage x. */
const wx = scaleLinear([WORLD.min, WORLD.max], [120, 1160]);
/** Curve height in px above the hallway line. */
const py = scaleLinear([0, 320], [BASE_Y, BASE_Y - 320]);

/** Display peak: taller = more certain, capped so tight beliefs stay on stage. */
const peakOf = (v: number) => Math.min(300, 62 / Math.sqrt(v));
const gauss = (x: number, mu: number, v: number) =>
  peakOf(v) * Math.exp(-((x - mu) * (x - mu)) / (2 * v));

/** A little ✕ where a measurement landed on the hallway line. */
function Ping({ x, color, opacity, size = 7 }: { x: number; color: string; opacity: number; size?: number }) {
  if (opacity <= 0.002) return null;
  return (
    <g opacity={opacity} stroke={color} strokeWidth={2.4} strokeLinecap="round">
      <line x1={x - size} y1={BASE_Y - size} x2={x + size} y2={BASE_Y + size} />
      <line x1={x - size} y1={BASE_Y + size} x2={x + size} y2={BASE_Y - size} />
    </g>
  );
}

function renderFrame(s: SceneState) {
  const robotU = s.get(ch.robotU);
  const rx = wx(s.get(ch.robotX));
  const scatterP = s.get(ch.scatterP);
  const scatterFade = s.get(ch.scatterFade);
  const beliefU = s.get(ch.beliefU);
  const mu = s.get(ch.muC);
  const v = s.get(ch.varC);
  const measU = s.get(ch.measU);
  const glow = s.get(ch.glow);
  const cyclesP = s.get(ch.cyclesP);

  return (
    <Camera {...s.get(ch.cam)}>
      {/* the hallway */}
      <NumberLine
        scale={wx}
        y={BASE_Y}
        reveal={s.get(ch.lineU)}
        ticks={11}
        fontSize={14}
        label="hallway position"
      />

      {/* beat-1 scatter: pings around the parked robot */}
      {SCATTER.map((z, i) => (
        <Ping
          key={i}
          x={wx(z)}
          color={colors.WARM}
          opacity={clamp01(scatterP * 6 - i) * scatterFade}
        />
      ))}

      {/* the belief Gaussian — THE protagonist */}
      {beliefU > 0.002 && (
        <FunctionPlot
          x={wx}
          y={py}
          f={(x) => gauss(x, mu, v)}
          domain={[WORLD.min, WORLD.max]}
          samples={200}
          reveal={beliefU}
          color={colors.ACCENT}
          width={2.6 + glow * 1.6}
          opacity={0.9}
          area={{ sweep: beliefU, opacity: 0.1 + glow * 0.1 }}
        />
      )}

      {/* the measurement's Gaussian (beat 4) */}
      {measU > 0.002 && (
        <g opacity={measU}>
          <FunctionPlot
            x={wx}
            y={py}
            f={(x) => gauss(x, Z[2], R)}
            domain={[WORLD.min, WORLD.max]}
            samples={200}
            color={colors.SECONDARY}
            width={2.2}
            dash
          />
          <Ping x={wx(Z[2])} color={colors.SECONDARY} opacity={measU} />
          <text
            x={wx(Z[2])}
            y={py(gauss(Z[2], Z[2], R)) - 12}
            textAnchor="middle"
            fill={colors.SECONDARY}
            fontSize={17}
            fontWeight={600}
          >
            z
          </text>
        </g>
      )}

      {/* beat-5 trails: raw pings (✕) vs the filter's estimates (dots) */}
      {Array.from({ length: 7 }, (_, j) => {
        const k = j + 3;
        const pingU = clamp01((cyclesP - (j + 0.55)) * 3);
        const estU = clamp01((cyclesP - (j + 1.0)) * 3);
        return (
          <g key={k}>
            <Ping x={wx(Z[k])} color={colors.WARM} opacity={pingU * 0.55} size={6} />
            {estU > 0.002 && (
              <circle cx={wx(POST[k].mu)} cy={BASE_Y - 7} r={5} fill={colors.ACCENT} opacity={estU * 0.9} />
            )}
          </g>
        );
      })}

      {/* the robot — ground truth on wheels */}
      {robotU > 0.002 && (
        <g opacity={robotU}>
          <line x1={rx} y1={BASE_Y - 4} x2={rx} y2={BASE_Y + 4} stroke={colors.POSITIVE} strokeWidth={2} />
          <circle cx={rx} cy={BASE_Y - 20} r={11} fill={colors.POSITIVE} />
          <circle cx={rx - 5} cy={BASE_Y - 23} r={2} fill="#0a0e1a" />
          <circle cx={rx + 5} cy={BASE_Y - 23} r={2} fill="#0a0e1a" />
          <text x={rx} y={BASE_Y - 40} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} opacity={0.85}>
            truth
          </text>
        </g>
      )}

      {/* equations, as they earn their screen time */}
      <MathLabel
        tex="\text{belief} = \mathcal N(\mu,\ \sigma^2)"
        x={280}
        y={120}
        fontSize={24}
        opacity={s.get(ch.muTexU)}
      />
      <MathLabel
        tex="\mu \leftarrow \mu + v\,\Delta t \qquad \sigma^2 \leftarrow \sigma^2 + q"
        x={640}
        y={92}
        fontSize={22}
        opacity={s.get(ch.predTexU)}
      />
      <MathLabel
        tex="K=\tfrac{\sigma^2}{\sigma^2+R} \qquad \mu \leftarrow \mu + K\,(z-\mu)"
        x={640}
        y={150}
        fontSize={22}
        opacity={s.get(ch.kTexU)}
      />
    </Camera>
  );
}

export function Kalman() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/kalman/overrides.json', slug: 'kalman' }}
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
