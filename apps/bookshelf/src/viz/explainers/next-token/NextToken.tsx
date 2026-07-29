import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BITS_PER_CHAR,
  DIST_BAR_W,
  DIST_X,
  DIST_Y0,
  METER_X,
  N_STEPS,
  STEPS,
  TAPE_Y,
  TEST,
  UNIFORM_BITS,
  UNIFORM_TOTAL,
  buildScene,
  distScale,
  meterY,
  tapeX,
} from './scene';

/**
 * Next-Token Prediction as Compression.
 * Pure render: the predicted next-char distribution, the per-char bit cost,
 * and the running bit meter all come from the REAL bigram model in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/next-token/overrides.json', slug: 'next-token' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const show = (c: string) => (c === ' ' ? '␣' : c);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const cursorRaw = s.get(scene.cursor);
  const distU = s.get(scene.distU);
  const meterU = s.get(scene.meterU);
  const uniformU = s.get(scene.uniformU);
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const cur = Math.max(0, Math.min(N_STEPS - 1, Math.round(cursorRaw)));
  const step = STEPS[cur];
  const chars = TEST.split('');

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the character tape; the cursor sits between ctx and next */}
          {chars.map((c, i) => {
            const u = clamp01(tapeU * 2 - i / chars.length);
            if (u <= 0) return null;
            const isCtx = i === cur;
            const isNext = i === cur + 1;
            const seen = i <= cur;
            return (
              <g key={i} opacity={u}>
                <rect
                  x={tapeX(i)}
                  y={TAPE_Y - 24}
                  width={40}
                  height={48}
                  rx={7}
                  fill={isCtx ? colors.PANEL : colors.BG}
                  stroke={isCtx ? colors.ACCENT : isNext ? colors.WARM : colors.GRID}
                  strokeWidth={isCtx || isNext ? 2.4 : 1.2}
                  opacity={seen || isNext ? 1 : 0.4}
                />
                <text
                  x={tapeX(i) + 20}
                  y={TAPE_Y + 6}
                  textAnchor="middle"
                  fill={isCtx ? colors.ACCENT : isNext ? colors.WARM : seen ? colors.TEXT : colors.MUTED}
                  fontSize={22}
                  fontFamily="ui-monospace, monospace"
                >
                  {show(c)}
                </text>
              </g>
            );
          })}
          <text x={tapeX(0)} y={TAPE_Y - 40} fill={colors.MUTED} fontSize={14}>
            predict the next character, one at a time
          </text>

          {/* predicted distribution bars for the current context */}
          {distU > 0 && (
            <g opacity={distU}>
              <text x={DIST_X + 3 * (DIST_BAR_W + 14)} y={DIST_Y0 - 250} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                {`model's guess after "${show(step.ctx)}"`}
              </text>
              {step.dist.map((d, i) => {
                const x = DIST_X + i * (DIST_BAR_W + 14);
                const h = distScale(d.p);
                const isTrue = d.ch === step.next;
                return (
                  <g key={i}>
                    <rect x={x} y={DIST_Y0 - h} width={DIST_BAR_W} height={h} rx={5} fill={isTrue ? colors.WARM : colors.ACCENT} opacity={isTrue ? 0.95 : 0.55} />
                    <text x={x + DIST_BAR_W / 2} y={DIST_Y0 - h - 8} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
                      {(d.p * 100).toFixed(0)}
                    </text>
                    <text x={x + DIST_BAR_W / 2} y={DIST_Y0 + 22} textAnchor="middle" fill={isTrue ? colors.WARM : colors.MUTED} fontSize={16} fontFamily="ui-monospace, monospace">
                      {show(d.ch)}
                    </text>
                  </g>
                );
              })}
              {/* the cost of the true next character */}
              <text x={DIST_X} y={DIST_Y0 + 58} fill={colors.WARM} fontSize={16}>
                {`true next "${show(step.next)}" costs ${step.bits.toFixed(1)} bits`}
              </text>
            </g>
          )}

          {/* the bits meter */}
          {meterU > 0 && (
            <g opacity={meterU}>
              <line x1={METER_X} y1={meterY(0)} x2={METER_X} y2={meterY(UNIFORM_TOTAL)} stroke={colors.GRID} strokeWidth={2} />
              {/* uniform baseline */}
              {uniformU > 0 && (
                <g opacity={uniformU}>
                  <line x1={METER_X - 60} y1={meterY(UNIFORM_TOTAL)} x2={METER_X + 60} y2={meterY(UNIFORM_TOTAL)} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="6 5" />
                  <text x={METER_X + 68} y={meterY(UNIFORM_TOTAL) + 4} fill={colors.NEGATIVE} fontSize={13}>
                    blind: {UNIFORM_BITS.toFixed(1)} / char
                  </text>
                </g>
              )}
              {/* accumulated bits bar */}
              <rect x={METER_X - 26} y={meterY(step.cum)} width={52} height={meterY(0) - meterY(step.cum)} rx={5} fill={colors.POSITIVE} opacity={0.8} />
              <text x={METER_X} y={meterY(step.cum) - 10} textAnchor="middle" fill={colors.POSITIVE} fontSize={15}>
                {`${step.cum.toFixed(0)} bits`}
              </text>
              <text x={METER_X} y={meterY(0) + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                total cost
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math + badge */}
      <MathLabel tex={'\\text{bits} = -\\log_2 p(\\text{next})'} x={1030} y={70} fontSize={21} opacity={s.get(scene.texU) * dimU} />
      {badgeU > 0 && (
        <g opacity={badgeU * dimU}>
          <rect x={48} y={110} width={210} height={38} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={135} fill={colors.TEXT} fontSize={15}>
            {`character ${cur + 1} / ${N_STEPS}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={210} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Prediction is Compression
          </text>
          <MathLabel tex={'\\text{better prediction} \\;=\\; \\text{fewer bits}'} x={640} y={342} fontSize={21} color={colors.WARM} opacity={endU} />
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`blind ${UNIFORM_BITS.toFixed(1)} → bigram ${BITS_PER_CHAR.toFixed(1)} bits per character — the gap is what the model knows`}
          </text>
        </g>
      )}
    </>
  );
}

export function NextToken() {
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
