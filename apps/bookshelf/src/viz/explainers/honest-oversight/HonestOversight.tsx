import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  AT_64,
  CAM_CURVES,
  CAM_DESK,
  CH_X0,
  CH_Y0,
  CURVE,
  DESK_SHORT,
  DESK_X,
  DESK_Y,
  FINAL,
  NS,
  buildScene,
  chX,
  chY,
} from './scene';

/**
 * Honest Oversight — pure render. Both curves and the audit-desk shortlist
 * are the real simulations from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/honest-oversight/overrides.json',
  slug: 'honest-oversight',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(key: 'passive' | 'audited', upTo: number): string {
  const n = Math.max(2, Math.min(CURVE.length, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${chX(i).toFixed(1)} ${chY(CURVE[i][key]).toFixed(1)}`;
  }
  return d;
}

// the audit's real pick among the shortlist
const AUDIT_PICK = DESK_SHORT.reduce((b, d, i) => (d.audit > DESK_SHORT[b].audit ? i : b), 0);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const deskU = s.get(scene.deskU);
  const auditP = s.get(scene.auditP);
  const axU = s.get(scene.axU);
  const sweepP = s.get(scene.sweepP);
  const sweepA = s.get(scene.sweepA);
  const sagU = s.get(scene.sagU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  // the camera's trip from the desk to the curves: the desk fades out and the
  // curves fade in as it moves, so neither is clipped at the stage edge
  const toCurves = clamp01((cam.x - CAM_DESK.x) / (CAM_CURVES.x - CAM_DESK.x));
  const deskFade = 1 - toCurves;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* — the audit desk — */}
          {deskU > 0 && deskFade > 0 && (
            <g opacity={deskU * deskFade}>
              <rect x={DESK_X - 20} y={DESK_Y - 46} width={420} height={370} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
              <text x={DESK_X} y={DESK_Y - 16} fill={colors.TEXT} fontSize={16} fontWeight={650}>
                the audit desk — a real shortlist
              </text>
              {DESK_SHORT.map((d, i) => {
                const audited = auditP >= i + 1;
                const isPick = audited && i === AUDIT_PICK && auditP >= 4;
                return (
                  <g key={i}>
                    <rect
                      x={DESK_X}
                      y={DESK_Y + 8 + i * 74}
                      width={380}
                      height={62}
                      rx={10}
                      fill={colors.BG}
                      stroke={isPick ? colors.POSITIVE : audited && d.loop ? colors.NEGATIVE : colors.GRID}
                      strokeWidth={isPick || (audited && d.loop) ? 2.5 : 1}
                    />
                    <text x={DESK_X + 16} y={DESK_Y + 32 + i * 74} fill={colors.ACCENT} fontSize={14}>
                      {`reward model score ${d.rm.toFixed(2)}${i === 0 ? ' — its favorite' : ''}`}
                    </text>
                    <text x={DESK_X + 16} y={DESK_Y + 54 + i * 74} fill={audited ? (d.loop ? colors.NEGATIVE : colors.POSITIVE) : colors.MUTED} fontSize={14}>
                      {audited
                        ? `audit: ${d.audit.toFixed(2)} — ${d.loop ? 'a loophole' : 'genuine'} (true ${d.truth.toFixed(2)})`
                        : 'awaiting audit…'}
                    </text>
                    {isPick && (
                      <text x={DESK_X + 300} y={DESK_Y + 54 + i * 74} fill={colors.POSITIVE} fontSize={14} fontWeight={650}>
                        ✓ wins
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* — the curves — */}
          <g opacity={toCurves}>
            {axU > 0 && (
              <g opacity={axU}>
                <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(NS.length - 1) + 10} y2={CH_Y0} stroke={colors.GRID} />
                {NS.map((n, i) => (
                  <text key={n} x={chX(i)} y={CH_Y0 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                    {n}
                  </text>
                ))}
                <text x={chX(2.5)} y={CH_Y0 + 46} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                  optimization pressure (best of n) →
                </text>
                {[0, 0.5, 1].map((v) => (
                  <text key={v} x={CH_X0 - 12} y={chY(v) + 5} textAnchor="end" fill={colors.MUTED} fontSize={14}>
                    {v.toFixed(1)}
                  </text>
                ))}
                <text x={CH_X0 - 8} y={chY(1) - 12} fill={colors.MUTED} fontSize={14}>
                  true quality of the winner
                </text>
              </g>
            )}
            {sweepP > 0 && (
              <g>
                <path d={curvePath('passive', sweepP)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} opacity={0.5} />
                <text
                  x={chX(Math.min(NS.length - 1, sweepP)) + 14}
                  y={chY(CURVE[Math.min(NS.length - 1, Math.round(sweepP))].passive) + 5}
                  fill={colors.POSITIVE}
                  fontSize={14}
                  opacity={0.9}
                >
                  {`passive ${CURVE[Math.min(NS.length - 1, Math.round(sweepP))].passive.toFixed(2)}`}
                </text>
              </g>
            )}
            {sweepA > 0 && (
              <g>
                <path d={curvePath('audited', sweepA)} fill="none" stroke={colors.ACCENT} strokeWidth={3.5} />
                <text
                  x={chX(Math.min(NS.length - 1, sweepA)) + 14}
                  y={chY(CURVE[Math.min(NS.length - 1, Math.round(sweepA))].audited) - 8}
                  fill={colors.ACCENT}
                  fontSize={14}
                >
                  {`audited ${CURVE[Math.min(NS.length - 1, Math.round(sweepA))].audited.toFixed(2)}`}
                </text>
              </g>
            )}
            {sweepA > 2.9 && (
              <text x={chX(3)} y={chY(AT_64.audited) - 26} textAnchor="middle" fill={colors.ACCENT} fontSize={14}>
                {`n = 64: ${AT_64.audited.toFixed(2)} vs ${AT_64.passive.toFixed(2)}`}
              </text>
            )}
            {sagU > 0 && (
              <g opacity={sagU}>
                <line x1={chX(NS.length - 1)} y1={142} x2={chX(NS.length - 1)} y2={chY(FINAL.audited) - 12} stroke={colors.WARM} strokeWidth={1.5} />
                <circle cx={chX(NS.length - 1)} cy={chY(FINAL.audited)} r={9} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
                <text x={chX(NS.length - 1)} y={118} textAnchor="end" fill={colors.WARM} fontSize={14}>
                  even audits sag
                </text>
                <text x={chX(NS.length - 1)} y={135} textAnchor="end" fill={colors.WARM} fontSize={14}>
                  under extreme pressure
                </text>
              </g>
            )}
          </g>
        </g>
      </Camera>

      {/* clean ending card: a backdrop clears the faded chart, then a solid panel */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={0} y={0} width={STAGE_W} height={STAGE_H} fill={colors.BG} />
          <rect x={200} y={200} width={880} height={250} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Honest Oversight
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.ACCENT} fontSize={21}>
            applaud nothing you have not tried to break
          </text>
          <text x={640} y={392} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            independent checks, fresh tests, deepest scrutiny on whatever is currently winning
          </text>
        </g>
      )}
    </>
  );
}

export function HonestOversight() {
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
