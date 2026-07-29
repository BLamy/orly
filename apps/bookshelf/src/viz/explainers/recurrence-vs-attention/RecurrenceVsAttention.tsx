import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  DEP_FROM,
  DEP_HOPS,
  DEP_SURVIVE,
  DEP_TO,
  N_TOK,
  RACE_STEPS,
  TOKENS,
  TOK_Y,
  buildScene,
  survive,
  tokX,
} from './scene';

/**
 * Why Attention Replaced Recurrence — pure render. Relay leakage, the decay
 * curve, and the 12-vs-1 race are the closed-form quantities from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/recurrence-vs-attention/overrides.json',
  slug: 'recurrence-vs-attention',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function arcPath(i: number, j: number, lift: number): string {
  const x1 = tokX(i);
  const x2 = tokX(j);
  const midY = TOK_Y - 40 - Math.abs(x2 - x1) * lift;
  return `M${x1} ${TOK_Y - 22} Q${(x1 + x2) / 2} ${midY} ${x2} ${TOK_Y - 22}`;
}

// decay curve points (closed form)
const DECAY = Array.from({ length: 51 }, (_, d) => ({ d, v: survive(d) }));

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tokU = s.get(scene.tokU);
  const chainU = s.get(scene.chainU);
  const relayU = s.get(scene.relayU);
  const arcU = s.get(scene.arcU);
  const allArcsU = s.get(scene.allArcsU);
  const raceU = s.get(scene.raceU);
  const decayU = s.get(scene.decayU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const relayHop = Math.min(DEP_HOPS, Math.max(0, relayU));
  const relayI = Math.floor(relayHop);
  const relayT = relayHop - relayI;
  const relaySignal = survive(relayHop);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* tokens */}
          {TOKENS.map((w, i) => {
            const u = clamp01(tokU * (N_TOK + 2) - i);
            const key = i === DEP_FROM || i === DEP_TO;
            return (
              <g key={i} opacity={u}>
                <rect
                  x={tokX(i) - 42}
                  y={TOK_Y - 20}
                  width={84}
                  height={40}
                  rx={9}
                  fill={colors.PANEL}
                  stroke={key ? colors.WARM : colors.GRID}
                  strokeWidth={key ? 2.5 : 1}
                />
                <text x={tokX(i)} y={TOK_Y + 6} textAnchor="middle" fill={key ? colors.WARM : colors.TEXT} fontSize={15}>
                  {w}
                </text>
              </g>
            );
          })}

          {/* recurrent chain edges */}
          {Array.from({ length: N_TOK - 1 }, (_, i) => (
            <line
              key={i}
              x1={tokX(i) + 44}
              y1={TOK_Y}
              x2={tokX(i + 1) - 44}
              y2={TOK_Y}
              stroke={colors.GRID}
              strokeWidth={2}
              opacity={chainU * clamp01(chainU * N_TOK - i)}
            />
          ))}

          {/* the relayed signal — leaks per hop, size/opacity = real survival */}
          {relayU > 0.01 && (
            <g>
              <circle
                cx={tokX(DEP_FROM + relayI) + (tokX(DEP_FROM + relayI + 1) - tokX(DEP_FROM + relayI)) * relayT}
                cy={TOK_Y - 34}
                r={5 + 9 * relaySignal}
                fill={colors.NEGATIVE}
                opacity={0.35 + 0.65 * relaySignal}
              />
              <text
                x={tokX(DEP_FROM + relayHop)}
                y={TOK_Y - 54}
                textAnchor="middle"
                fill={colors.NEGATIVE}
                fontSize={13}
              >
                {`${(relaySignal * 100).toFixed(0)}%`}
              </text>
            </g>
          )}
          {relayU >= DEP_HOPS - 0.05 && (
            <text x={tokX(DEP_TO)} y={TOK_Y - 74} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13}>
              {`${(DEP_SURVIVE * 100).toFixed(0)}% arrives`}
            </text>
          )}

          {/* the single attention arc */}
          {arcU > 0 && (
            <g opacity={Math.min(1, arcU)}>
              <path d={arcPath(DEP_FROM, DEP_TO, 0.14)} fill="none" stroke={colors.ACCENT} strokeWidth={3.5} />
              <text
                x={(tokX(DEP_FROM) + tokX(DEP_TO)) / 2}
                y={TOK_Y - 40 - Math.abs(tokX(DEP_TO) - tokX(DEP_FROM)) * 0.14 + 18}
                textAnchor="middle"
                fill={colors.ACCENT}
                fontSize={14}
                opacity={arcU}
              >
                one hop — 90% at any distance
              </text>
            </g>
          )}

          {/* every-pair arcs */}
          {allArcsU > 0.01 &&
            TOKENS.flatMap((_, j) =>
              Array.from({ length: j }, (_, i) => {
                if (j - i < 2 || (i === DEP_FROM && j === DEP_TO)) return null;
                const order = (j * (j - 1)) / 2 + i;
                const u = clamp01(allArcsU * 70 - order);
                if (u <= 0) return null;
                return (
                  <path
                    key={`${i}-${j}`}
                    d={arcPath(i, j, 0.1)}
                    fill="none"
                    stroke={colors.SECONDARY}
                    strokeWidth={1.2}
                    opacity={0.32 * u * allArcsU}
                  />
                );
              }),
            )}

          {/* the parallelism race */}
          {raceU > 0 && (
            <g>
              <text x={120} y={470} fill={colors.NEGATIVE} fontSize={14}>
                recurrence — one step per tick
              </text>
              <text x={120} y={560} fill={colors.ACCENT} fontSize={14}>
                attention — every position, tick one
              </text>
              {Array.from({ length: RACE_STEPS }, (_, i) => {
                const seqDone = raceU >= i + 1;
                const seqPart = clamp01(raceU - i);
                const parDone = clamp01(raceU * RACE_STEPS - i * 0.25);
                return (
                  <g key={i}>
                    <rect
                      x={140 + i * 82}
                      y={482}
                      width={70}
                      height={26}
                      rx={6}
                      fill={seqDone ? colors.NEGATIVE : colors.PANEL}
                      opacity={seqDone ? 0.85 : 0.25 + 0.5 * seqPart}
                      stroke={colors.GRID}
                    />
                    <rect
                      x={140 + i * 82}
                      y={572}
                      width={70}
                      height={26}
                      rx={6}
                      fill={colors.ACCENT}
                      opacity={0.85 * parDone}
                      stroke={colors.GRID}
                    />
                  </g>
                );
              })}
              {raceU > 1.2 && (
                <text x={1130} y={560} fill={colors.ACCENT} fontSize={14} opacity={clamp01(raceU - 1.2)}>
                  done
                </text>
              )}
              {raceU >= RACE_STEPS - 0.05 && (
                <text x={1130} y={470} fill={colors.NEGATIVE} fontSize={14}>
                  done
                </text>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'0.9^{9} \\approx 0.39 \\qquad 0.9^{50} \\approx 0.005 \\qquad 0.9^{1} = 0.9'}
        x={985}
        y={70}
        fontSize={19}
        color={colors.WARM}
        opacity={s.get(scene.fadeMath)}
      />

      {/* decay curve inset */}
      {decayU > 0 && (
        <g opacity={decayU * dimU}>
          <rect x={62} y={64} width={270} height={150} rx={12} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
          <polyline
            points={DECAY.slice(0, Math.max(2, Math.ceil(decayU * DECAY.length)))
              .map((p) => `${80 + p.d * 4.7},${192 - p.v * 108}`)
              .join(' ')}
            fill="none"
            stroke={colors.NEGATIVE}
            strokeWidth={2.5}
          />
          <line x1={80} y1={192 - 0.9 * 108} x2={315} y2={192 - 0.9 * 108} stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="5 5" />
          <text x={197} y={86} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
            signal vs distance
          </text>
          <text x={230} y={102} fill={colors.ACCENT} fontSize={11.5}>
            attention: always one hop
          </text>
          <text x={230} y={190} fill={colors.NEGATIVE} fontSize={11.5}>
            recurrence
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Why Attention Won
          </text>
          <MathLabel
            tex={'\\text{path length } d \\to 1 \\qquad \\text{depth } T \\to 1'}
            x={640}
            y={340}
            fontSize={21}
            color={colors.ACCENT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            shorter gradient paths, and every position computed in parallel
          </text>
        </g>
      )}
    </>
  );
}

export function RecurrenceVsAttention() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
