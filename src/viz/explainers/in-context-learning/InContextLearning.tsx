import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  A_TRUE,
  B_TRUE,
  EXAMPLES,
  FITS,
  MAX_K,
  QUERY_X,
  QUERY_Y,
  buildScene,
  errX,
  errY,
  fitAt,
  promptX,
  xScale,
  yScale,
} from './scene';

/**
 * In-Context Learning — a new task, learned from the prompt alone.
 * Pure render: the fitted line, the query prediction, and the error meter all
 * come from the exact least-squares fit over the first k prompt examples in
 * scene.ts — inference-time adaptation with weights frozen.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/in-context-learning/overrides.json', slug: 'in-context-learning' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const PROMPT_Y = 70;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const planeU = s.get(scene.planeU);
  const kProg = s.get(scene.kProg);
  const lineU = s.get(scene.lineU);
  const queryU = s.get(scene.queryU);
  const truthU = s.get(scene.truthU);
  const errU = s.get(scene.errU);
  const promptU = s.get(scene.promptU);
  const frozenU = s.get(scene.frozenU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const kShown = Math.max(1, Math.min(MAX_K, Math.round(kProg)));
  const fit = fitAt(kProg);
  const lineY = (x: number) => fit.a * x + x * 0 + fit.b;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      {/* the prompt strip (screen-fixed feel, inside camera for the plane push) */}
      <g opacity={promptU * dimU}>
        <text x={130} y={PROMPT_Y - 24} fill={colors.MUTED} fontSize={14}>
          the prompt — examples of the hidden task
        </text>
        {EXAMPLES.slice(0, kShown).map((e, i) => (
          <g key={i} opacity={clamp01(kProg - i)}>
            <rect x={promptX(i)} y={PROMPT_Y - 16} width={104} height={34} rx={7} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
            <text x={promptX(i) + 52} y={PROMPT_Y + 7} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily="ui-monospace, monospace">
              {`${e.x.toFixed(1)} → ${e.y.toFixed(1)}`}
            </text>
          </g>
        ))}
        {/* the query chip */}
        <g opacity={queryU}>
          <rect x={promptX(kShown) + 8} y={PROMPT_Y - 16} width={104} height={34} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
          <text x={promptX(kShown) + 60} y={PROMPT_Y + 7} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily="ui-monospace, monospace">
            {`${QUERY_X.toFixed(1)} → ?`}
          </text>
        </g>
      </g>

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the x-y plane */}
          {planeU > 0 && (
            <g opacity={planeU}>
              <line x1={xScale(-3)} y1={yScale(0)} x2={xScale(3)} y2={yScale(0)} stroke={colors.GRID} strokeWidth={1.3} />
              <line x1={xScale(0)} y1={yScale(-5)} x2={xScale(0)} y2={yScale(5)} stroke={colors.GRID} strokeWidth={1.3} />
              <text x={xScale(2.8)} y={yScale(0) - 10} fill={colors.MUTED} fontSize={14}>
                input x
              </text>
              <text x={xScale(0) + 12} y={yScale(4.6)} fill={colors.MUTED} fontSize={14}>
                output y
              </text>
            </g>
          )}

          {/* the hidden true line, revealed at the end */}
          {truthU > 0 && (
            <line
              x1={xScale(-3)}
              y1={yScale(A_TRUE * -3 + B_TRUE)}
              x2={xScale(3)}
              y2={yScale(A_TRUE * 3 + B_TRUE)}
              stroke={colors.POSITIVE}
              strokeWidth={2}
              strokeDasharray="9 7"
              opacity={0.85 * truthU}
            />
          )}

          {/* the model's fitted line */}
          {lineU > 0 && (
            <line
              x1={xScale(-3)}
              y1={yScale(lineY(-3))}
              x2={xScale(-3) + (xScale(3) - xScale(-3)) * lineU}
              y2={yScale(lineY(-3 + 6 * lineU))}
              stroke={colors.WARM}
              strokeWidth={3}
              opacity={0.95}
            />
          )}

          {/* the example points currently in context */}
          {EXAMPLES.slice(0, kShown).map((e, i) => (
            <circle key={i} cx={xScale(e.x)} cy={yScale(e.y)} r={6 * clamp01(kProg - i)} fill={colors.ACCENT} stroke={colors.BG} strokeWidth={1.5} />
          ))}

          {/* the query: true target (ring) and model prediction (dot) */}
          {queryU > 0 && (
            <g opacity={queryU}>
              <line x1={xScale(QUERY_X)} y1={yScale(-5)} x2={xScale(QUERY_X)} y2={yScale(5)} stroke={colors.WARM} strokeWidth={1} strokeDasharray="3 5" opacity={0.5} />
              <circle cx={xScale(QUERY_X)} cy={yScale(QUERY_Y)} r={9} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} />
              <circle cx={xScale(QUERY_X)} cy={yScale(fit.pred)} r={8} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
            </g>
          )}
        </g>
      </Camera>

      {/* error meter */}
      {errU > 0 && (
        <g opacity={errU * dimU}>
          <line x1={errX(1)} y1={errY(0)} x2={errX(MAX_K)} y2={errY(0)} stroke={colors.GRID} strokeWidth={1.3} />
          <line x1={errX(1)} y1={errY(0)} x2={errX(1)} y2={errY(FITS[0].err)} stroke={colors.GRID} strokeWidth={1.3} />
          <text x={errX(MAX_K / 2)} y={errY(0) + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            examples in prompt
          </text>
          <text x={errX(1) - 8} y={errY(FITS[0].err) - 10} fill={colors.MUTED} fontSize={13}>
            query error
          </text>
          {FITS.map((f, i) =>
            i < kProg ? <circle key={i} cx={errX(i + 1)} cy={errY(Math.min(f.err, FITS[0].err))} r={3.4} fill={colors.NEGATIVE} opacity={0.85} /> : null,
          )}
        </g>
      )}

      {/* screen-fixed math + frozen badge */}
      <MathLabel tex={'\\text{fit } y = a\\,x + b \\text{ from the prompt — no weight updates}'} x={1000} y={120} fontSize={17} opacity={s.get(scene.texU) * dimU} />
      {frozenU > 0 && (
        <g opacity={frozenU * dimU}>
          <rect x={1020} y={30} width={196} height={40} rx={9} fill={colors.PANEL} opacity={0.9} stroke={colors.POSITIVE} />
          <text x={1118} y={56} textAnchor="middle" fill={colors.POSITIVE} fontSize={15}>
            weights frozen ❄
          </text>
        </g>
      )}
      {errU > 0 && (
        <text x={errX(MAX_K)} y={errY(0) - 8} textAnchor="end" fill={colors.NEGATIVE} fontSize={14} opacity={errU * dimU}>
          {`error ${fit.err.toFixed(2)} · ${kShown} shown`}
        </text>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={210} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            In-Context Learning
          </text>
          <MathLabel tex={'\\text{adapt to a new task in one forward pass}'} x={640} y={342} fontSize={21} color={colors.WARM} opacity={endU} />
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`the true rule y = ${A_TRUE}x − ${Math.abs(B_TRUE)}, learned from the prompt — weights never touched`}
          </text>
        </g>
      )}
    </>
  );
}

export function InContextLearning() {
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
