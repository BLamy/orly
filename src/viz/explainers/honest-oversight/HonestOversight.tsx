import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  AT_64,
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

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* — the audit desk — */}
          {deskU > 0 && (
            <g opacity={deskU}>
              <rect x={DESK_X - 20} y={DESK_Y - 46} width={420} height={370} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
              <text x={DESK_X} y={DESK_Y - 16} fill={colors.TEXT} fontSize={15.5} fontWeight={650}>
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
                    <text x={DESK_X + 16} y={DESK_Y + 32 + i * 74} fill={colors.ACCENT} fontSize={13.5}>
                      {`reward model score ${d.rm.toFixed(2)}${i === 0 ? ' — its favorite' : ''}`}
                    </text>
                    <text x={DESK_X + 16} y={DESK_Y + 54 + i * 74} fill={audited ? (d.loop ? colors.NEGATIVE : colors.POSITIVE) : colors.MUTED} fontSize={13.5}>
                      {audited
                        ? `audit: ${d.audit.toFixed(2)} — ${d.loop ? 'a loophole' : 'genuine'} (true ${d.truth.toFixed(2)})`
                        : 'awaiting audit…'}
                    </text>
                    {isPick && (
                      <text x={DESK_X + 300} y={DESK_Y + 32 + i * 74} fill={colors.POSITIVE} fontSize={13.5} fontWeight={650}>
                        ✓ wins
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* — the curves — */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(NS.length - 1) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <text x={chX(2.5)} y={CH_Y0 + 24} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                optimization pressure (best of n) →
              </text>
              <text x={CH_X0 - 8} y={chY(1) - 10} fill={colors.MUTED} fontSize={12.5}>
                true quality of the winner
              </text>
            </g>
          )}
          {sweepP > 0 && (
            <g>
              <path d={curvePath('passive', sweepP)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} opacity={0.5} />
              <text
                x={chX(Math.min(NS.length - 1, sweepP)) + 8}
                y={chY(CURVE[Math.min(NS.length - 1, Math.round(sweepP))].passive) + 4}
                fill={colors.POSITIVE}
                fontSize={13}
                opacity={0.8}
              >
                {`passive ${CURVE[Math.min(NS.length - 1, Math.round(sweepP))].passive.toFixed(2)}`}
              </text>
            </g>
          )}
          {sweepA > 0 && (
            <g>
              <path d={curvePath('audited', sweepA)} fill="none" stroke={colors.ACCENT} strokeWidth={3.5} />
              <text
                x={chX(Math.min(NS.length - 1, sweepA)) + 8}
                y={chY(CURVE[Math.min(NS.length - 1, Math.round(sweepA))].audited) - 8}
                fill={colors.ACCENT}
                fontSize={13}
              >
                {`audited ${CURVE[Math.min(NS.length - 1, Math.round(sweepA))].audited.toFixed(2)}`}
              </text>
            </g>
          )}
          {sweepA > 2.9 && (
            <text x={chX(3)} y={chY(AT_64.audited) - 26} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5}>
              {`n = 64: ${AT_64.audited.toFixed(2)} vs ${AT_64.passive.toFixed(2)}`}
            </text>
          )}
          {sagU > 0 && (
            <g opacity={sagU}>
              <circle cx={chX(NS.length - 1)} cy={chY(FINAL.audited)} r={9} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
              <text x={chX(NS.length - 1) - 8} y={chY(FINAL.audited) + 28} textAnchor="end" fill={colors.WARM} fontSize={12.5}>
                even audits sag under extreme pressure
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={200} y={200} width={880} height={250} rx={16} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Honest Oversight
          </text>
          <MathLabel
            tex={'\\text{applaud nothing you have not tried to break}'}
            x={640}
            y={330}
            fontSize={21}
            color={colors.ACCENT}
            opacity={endU}
          />
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
