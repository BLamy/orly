import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  DOCS,
  OX,
  OY,
  PIPE_X,
  PIPE_Y0,
  Q_FIX,
  Q_HIT,
  Q_MISS,
  R,
  buildScene,
  cosSim,
  dirX,
  dirY,
  rank,
} from './scene';

/**
 * RAG and Its Failure Modes — pure render. Query direction, rankings, and
 * the reader's answer are the real cosine geometry from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/rag-failure/overrides.json', slug: 'rag-failure' };

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const DOC_COLOR = [colors.POSITIVE, colors.ACCENT, colors.NEGATIVE];

function queryState(qMode: number): { deg: number; text: string } {
  if (qMode <= 1) {
    return {
      deg: lerp(Q_HIT.deg, Q_MISS.deg, clamp01(qMode)),
      text: qMode < 0.5 ? Q_HIT.text : Q_MISS.text,
    };
  }
  return {
    deg: lerp(Q_MISS.deg, Q_FIX.deg, clamp01(qMode - 1)),
    text: qMode < 1.5 ? Q_MISS.text : Q_FIX.text,
  };
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const wedgeU = s.get(scene.wedgeU);
  const qMode = s.get(scene.qMode);
  const qU = s.get(scene.qU);
  const simU = s.get(scene.simU);
  const pipeU = s.get(scene.pipeU);
  const ansU = s.get(scene.ansU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const q = queryState(qMode);
  const ranking = rank(q.deg);
  const top = ranking[0];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the meaning wedge */}
          <g opacity={wedgeU}>
            <path
              d={`M${OX} ${OY} L${dirX(0)} ${dirY(0)} A${R} ${R} 0 0 0 ${dirX(62)} ${dirY(62)} Z`}
              fill={colors.PANEL}
              opacity={0.25}
              stroke={colors.GRID}
            />
            <text x={OX + 24} y={OY - 14} fill={colors.MUTED} fontSize={13}>
              the meaning circle (a wedge of it)
            </text>
          </g>

          {/* documents */}
          {DOCS.map((d, i) => {
            const u = clamp01(wedgeU * 3 - i);
            if (u <= 0) return null;
            const hot = simU > 0 && top.idx === i;
            return (
              <g key={i} opacity={u}>
                <line x1={OX} y1={OY} x2={dirX(d.deg, R * 0.94)} y2={dirY(d.deg, R * 0.94)} stroke={DOC_COLOR[i]} strokeWidth={hot ? 3.5 : 2} opacity={hot ? 1 : 0.65} />
                <circle cx={dirX(d.deg, R * 0.94)} cy={dirY(d.deg, R * 0.94)} r={hot ? 10 : 7} fill={DOC_COLOR[i]} />
                <text x={dirX(d.deg, R * 1.02)} y={dirY(d.deg, R * 1.02)} fill={DOC_COLOR[i]} fontSize={14} fontWeight={600}>
                  {d.name}
                </text>
                <text x={dirX(d.deg, R * 1.02)} y={dirY(d.deg, R * 1.02) + 19} fill={colors.MUTED} fontSize={12.5}>
                  {d.fact}
                </text>
              </g>
            );
          })}

          {/* the query arrow */}
          {qU > 0 && (
            <g opacity={qU}>
              <line x1={OX} y1={OY} x2={dirX(q.deg, R * 0.8)} y2={dirY(q.deg, R * 0.8)} stroke={colors.WARM} strokeWidth={4} strokeDasharray="10 6" />
              <circle cx={dirX(q.deg, R * 0.8)} cy={dirY(q.deg, R * 0.8)} r={9} fill={colors.WARM} stroke={colors.BG} strokeWidth={2} />
              <text x={dirX(q.deg, R * 0.55) - 10} y={dirY(q.deg, R * 0.55) - 14} fill={colors.WARM} fontSize={14.5} fontWeight={600}>
                {`“${q.text}”`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* the pipeline panel — screen-fixed */}
      {pipeU > 0 && (
        <g opacity={pipeU * dimU}>
          <rect x={PIPE_X + 130} y={PIPE_Y0 - 40} width={330} height={230} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={PIPE_X + 152} y={PIPE_Y0 - 10} fill={colors.TEXT} fontSize={15} fontWeight={650}>
            retriever → reader
          </text>
          {simU > 0 &&
            ranking.map((r0, pos) => {
              const d = DOCS[r0.idx];
              return (
                <g key={r0.idx} opacity={simU}>
                  <text x={PIPE_X + 152} y={PIPE_Y0 + 22 + pos * 28} fill={pos === 0 ? DOC_COLOR[r0.idx] : colors.MUTED} fontSize={14} fontWeight={pos === 0 ? 650 : 400}>
                    {`${pos === 0 ? '▶ ' : '   '}${d.name}`}
                  </text>
                  <text x={PIPE_X + 392} y={PIPE_Y0 + 22 + pos * 28} fill={pos === 0 ? DOC_COLOR[r0.idx] : colors.MUTED} fontSize={13.5}>
                    {r0.sim.toFixed(4)}
                  </text>
                </g>
              );
            })}
          {ansU > 0 && (
            <g opacity={ansU}>
              <rect x={PIPE_X + 152} y={PIPE_Y0 + 112} width={286} height={54} rx={10} fill={colors.BG} stroke={DOC_COLOR[top.idx]} strokeWidth={2} />
              <text x={PIPE_X + 168} y={PIPE_Y0 + 134} fill={colors.MUTED} fontSize={12.5}>
                the reader answers, confidently:
              </text>
              <text x={PIPE_X + 168} y={PIPE_Y0 + 156} fill={DOC_COLOR[top.idx]} fontSize={16} fontWeight={650}>
                {DOCS[top.idx].answer}
              </text>
            </g>
          )}
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            RAG's Fine Print
          </text>
          <MathLabel
            tex={'\\text{nearest neighbor} \\;\\ne\\; \\text{answers the question}'}
            x={640}
            y={340}
            fontSize={21}
            color={colors.NEGATIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            semantically close, factually irrelevant — the reader believes whatever it is handed
          </text>
        </g>
      )}
    </>
  );
}

export function RagFailure() {
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
