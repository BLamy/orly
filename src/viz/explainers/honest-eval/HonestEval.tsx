import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  FRESH_ERR,
  PANEL_H,
  PANEL_W,
  PANEL_Y,
  PRESSURE,
  PRESSURE_FINAL_P,
  PRESSURE_FINAL_T,
  RAIL_X0,
  RAIL_X1,
  RAIL_Y,
  REVERSALS,
  ST_X,
  buildScene,
  cardX,
} from './scene';

/**
 * The Expensive Claim — pure render. Each station's numbers are recomputed
 * miniatures of this book's real experiments (see scene.ts).
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/honest-eval/overrides.json', slug: 'honest-eval' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const ST_TITLES = ['① resample', '② fresh questions', '③ pressure'];
const ST_COLOR = [colors.ACCENT, colors.SECONDARY, colors.WARM];

function StationPanel({
  i,
  u,
  stamp,
  children,
  verdict,
}: {
  i: number;
  u: number;
  stamp: number;
  children?: React.ReactNode;
  verdict: string;
}) {
  if (u <= 0) return null;
  const x0 = ST_X[i] - PANEL_W / 2;
  return (
    <g opacity={u}>
      <rect x={x0} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={14} fill={colors.PANEL} opacity={0.94} stroke={ST_COLOR[i]} strokeWidth={1.5} />
      <text x={x0 + 20} y={PANEL_Y + 34} fill={ST_COLOR[i]} fontSize={16} fontWeight={650}>
        {ST_TITLES[i]}
      </text>
      {children}
      {stamp > 0 && (
        <g opacity={stamp} transform={`rotate(-6 ${ST_X[i]} ${PANEL_Y + PANEL_H - 34})`}>
          <rect x={x0 + 18} y={PANEL_Y + PANEL_H - 56} width={PANEL_W - 36} height={40} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <text x={ST_X[i]} y={PANEL_Y + PANEL_H - 30} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14.5} fontWeight={650}>
            {verdict}
          </text>
        </g>
      )}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const railU = s.get(scene.railU);
  const cardU = s.get(scene.cardU);
  const st1U = s.get(scene.st1U);
  const st2U = s.get(scene.st2U);
  const st3U = s.get(scene.st3U);
  const stamp1 = s.get(scene.stamp1);
  const stamp2 = s.get(scene.stamp2);
  const stamp3 = s.get(scene.stamp3);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const cx = cardX(cardU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the rail */}
          <line x1={RAIL_X0} y1={RAIL_Y} x2={RAIL_X0 + (RAIL_X1 - RAIL_X0) * railU} y2={RAIL_Y} stroke={colors.GRID} strokeWidth={2.5} />
          {ST_X.map((x, i) => (
            <g key={i} opacity={clamp01(railU * 3 - i)}>
              <circle cx={x} cy={RAIL_Y} r={7} fill={colors.BG} stroke={ST_COLOR[i]} strokeWidth={2.5} />
              <text x={x} y={RAIL_Y - 18} textAnchor="middle" fill={ST_COLOR[i]} fontSize={13.5}>
                {ST_TITLES[i]}
              </text>
            </g>
          ))}

          {/* the claim card */}
          {cardU > 0 && (
            <g>
              <rect x={cx - 74} y={RAIL_Y - 76} width={148} height={52} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
              <text x={cx} y={RAIL_Y - 54} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontWeight={650}>
                the claim
              </text>
              <text x={cx} y={RAIL_Y - 34} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
                “the metric went up: +1”
              </text>
              <line x1={cx} y1={RAIL_Y - 24} x2={cx} y2={RAIL_Y - 8} stroke={colors.WARM} strokeWidth={2} />
            </g>
          )}

          {/* station 1: resample */}
          <StationPanel i={0} u={st1U} stamp={stamp1} verdict={`reverses in ${(REVERSALS * 100).toFixed(0)}% of reruns`}>
            <g>
              {/* two overlapping bells, schematic positions but real verdict */}
              {[0, 1].map((m) => (
                <path
                  key={m}
                  d={Array.from({ length: 60 }, (_, k) => {
                    const x = ST_X[0] - 130 + k * 4.4;
                    const mu = ST_X[0] + (m === 0 ? -6 : 6);
                    const y = PANEL_Y + 150 - 88 * Math.exp(-(((x - mu) / 42) ** 2));
                    return `${k === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
                  }).join('')}
                  fill="none"
                  stroke={m === 0 ? colors.ACCENT : colors.WARM}
                  strokeWidth={2.5}
                  opacity={0.9}
                />
              ))}
              <text x={ST_X[0]} y={PANEL_Y + 172} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                1000 paired reruns, n = 100
              </text>
            </g>
          </StationPanel>

          {/* station 2: fresh questions */}
          <StationPanel i={1} u={st2U} stamp={stamp2} verdict={`fresh error ${FRESH_ERR.toFixed(2)}, was 0.00`}>
            <g>
              <rect x={ST_X[1] - 130} y={PANEL_Y + 70} width={120} height={64} rx={8} fill={colors.BG} stroke={colors.GRID} />
              <text x={ST_X[1] - 70} y={PANEL_Y + 96} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>
                leaked test
              </text>
              <text x={ST_X[1] - 70} y={PANEL_Y + 120} textAnchor="middle" fill={colors.POSITIVE} fontSize={17} fontWeight={650}>
                0.000
              </text>
              <rect x={ST_X[1] + 10} y={PANEL_Y + 70} width={120} height={64} rx={8} fill={colors.BG} stroke={colors.GRID} />
              <text x={ST_X[1] + 70} y={PANEL_Y + 96} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13}>
                fresh test
              </text>
              <text x={ST_X[1] + 70} y={PANEL_Y + 120} textAnchor="middle" fill={colors.NEGATIVE} fontSize={17} fontWeight={650}>
                {FRESH_ERR.toFixed(2)}
              </text>
              <text x={ST_X[1]} y={PANEL_Y + 164} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                where did the questions come from?
              </text>
            </g>
          </StationPanel>

          {/* station 3: pressure */}
          <StationPanel i={2} u={st3U} stamp={stamp3} verdict={`proxy ${PRESSURE_FINAL_P.toFixed(1)} · truth ${PRESSURE_FINAL_T.toFixed(3)}`}>
            <g>
              {(['p', 't'] as const).map((key) => (
                <polyline
                  key={key}
                  points={PRESSURE[key]
                    .map((v, k) => `${(ST_X[2] - 130 + (k / (PRESSURE.p.length - 1)) * 260).toFixed(1)},${(PANEL_Y + 158 - v * 34).toFixed(1)}`)
                    .join(' ')}
                  fill="none"
                  stroke={key === 'p' ? colors.ACCENT : colors.POSITIVE}
                  strokeWidth={2.5}
                  opacity={0.9}
                />
              ))}
              <text x={ST_X[2]} y={PANEL_Y + 182} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                400 steps of optimizing the metric
              </text>
            </g>
          </StationPanel>
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={200} y={200} width={880} height={250} rx={16} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Expensive Claim
          </text>
          <MathLabel
            tex={'\\text{“it broke”} \\to \\text{cheap} \\qquad \\text{“it works”} \\to \\text{prove it survived attack}'}
            x={640}
            y={330}
            fontSize={19}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={392} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            reruns, fresh questions, adversarial pressure — hostility is the method
          </text>
        </g>
      )}
    </>
  );
}

export function HonestEval() {
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
