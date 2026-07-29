import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BAR_BASE,
  BAR_SCALE,
  CHARS,
  METERS,
  STEP,
  TAPE,
  TOTAL_BIGRAM,
  TOTAL_UNIFORM,
  TOTAL_UNIGRAM,
  buildScene,
  costAt,
  totalAt,
} from './scene';

/**
 * Compression is Prediction — the bridge chapter.
 * Pure render: a 50-character tape whose per-character cost bars are the real
 * coding costs under a uniform, unigram, then bigram model (190 → 163 → 120
 * bits), with the running total as the model gets smarter.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/compression-prediction/overrides.json', slug: 'compression-prediction' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const barsU = s.get(scene.barsU);
  const mix = s.get(scene.mix);
  const meterU = s.get(scene.meterU);
  const spotU = s.get(scene.spotU);
  const texU = s.get(scene.texU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const total = totalAt(mix);
  const modelName = mix < 0.5 ? 'flat code (knows nothing)' : mix < 1.5 ? 'letter frequencies' : 'predict from the previous character';

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the tape */}
          {CHARS.map((c, i) => {
            const u = clamp01(tapeU * 1.8 - i / 70);
            const x = TAPE.x + i * STEP + STEP / 2;
            const cost = costAt(mix, i);
            const cheap = mix > 1.5 && cost < 1.4;
            return (
              <g key={i} opacity={u}>
                <text
                  x={x}
                  y={TAPE.y}
                  textAnchor="middle"
                  fill={cheap && spotU > 0 ? colors.POSITIVE : colors.TEXT}
                  fontSize={16}
                  fontFamily="ui-monospace, monospace"
                >
                  {c === ' ' ? '·' : c}
                </text>
                {/* cost bar */}
                {barsU > 0 && (
                  <rect
                    x={x - STEP * 0.32}
                    y={BAR_BASE - cost * BAR_SCALE * barsU}
                    width={STEP * 0.64}
                    height={cost * BAR_SCALE * barsU}
                    rx={3}
                    fill={cheap && spotU > 0 ? colors.POSITIVE : colors.ACCENT}
                    opacity={cheap && spotU > 0 ? 0.95 : 0.7}
                  />
                )}
              </g>
            );
          })}
          {barsU > 0 && (
            <g opacity={barsU}>
              <line x1={TAPE.x} y1={BAR_BASE} x2={TAPE.x + TAPE.w} y2={BAR_BASE} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={TAPE.x} y={BAR_BASE + 24} fill={colors.MUTED} fontSize={13.5}>
                {`bits per character — model: ${modelName}`}
              </text>
            </g>
          )}

          {/* running total meter */}
          {meterU > 0 && (
            <g opacity={meterU}>
              <text x={METERS.x} y={METERS.y - 12} fill={colors.TEXT} fontSize={15}>
                total bits for the line
              </text>
              <rect x={METERS.x} y={METERS.y} width={TOTAL_UNIFORM * METERS.scale + 4} height={METERS.h} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={METERS.x + 2} y={METERS.y + 2} width={total * METERS.scale} height={METERS.h - 4} rx={6} fill={colors.WARM} opacity={0.85} />
              <text x={METERS.x + TOTAL_UNIFORM * METERS.scale + 20} y={METERS.y + 19} fill={colors.TEXT} fontSize={16} fontFamily="ui-monospace, monospace">
                {`${total.toFixed(0)} bits`}
              </text>
              {/* reference ticks */}
              {[
                { v: TOTAL_UNIFORM, l: 'flat 190' },
                { v: TOTAL_UNIGRAM, l: 'frequencies 163' },
                { v: TOTAL_BIGRAM, l: 'bigram 120' },
              ].map((m) => (
                <g key={m.l}>
                  <line x1={METERS.x + m.v * METERS.scale} y1={METERS.y - 4} x2={METERS.x + m.v * METERS.scale} y2={METERS.y + METERS.h + 4} stroke={colors.MUTED} strokeWidth={1.4} opacity={0.8} />
                  <text x={METERS.x + m.v * METERS.scale} y={METERS.y + METERS.h + 22} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                    {m.l}
                  </text>
                </g>
              ))}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel tex={'\\text{cost}(x_i) = -\\log_2\\, q(x_i \\mid x_{i-1})'} x={640} y={62} fontSize={18} opacity={texU * dimU} />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={225} width={820} height={200} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Compression is Prediction
          </text>
          <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            same line, three beliefs: 190 → 163 → 120 bits
          </text>
          <text x={640} y={374} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            a model is exactly as good as the bits it saves
          </text>
        </g>
      )}
    </>
  );
}

export function CompressionPrediction() {
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
