import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { BitField, EcCurve, ecPlot, shortHex } from '../../primitives';
import { CURVE_VIEW, D_LINE, DIGEST, HOPS, MSG, MSG_BITS, MSG_HEX, buildScene } from './scene';
import overrides from './overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/nostr-keys/overrides.json',
  slug: 'nostr-keys',
};

const P = ecPlot(CURVE_VIEW);
const hopPt = (i: number) => ({ x: P.sx(HOPS[i]), y: P.sy(P.curveY(HOPS[i])) });

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dU = s.get(scene.dU);
  const curveU = s.get(scene.curveU);
  const hopU = s.get(scene.hopU);
  const pU = s.get(scene.pU);
  const oneWayU = s.get(scene.oneWayU);
  const msgU = s.get(scene.msgU);
  const settleU = s.get(scene.settleU);
  const sigU = s.get(scene.sigU);
  const verifyU = s.get(scene.verifyU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the secret number */}
          {dU > 0 && (
            <g opacity={dU}>
              <text x={D_LINE.x} y={D_LINE.y - 34} fill={colors.NEGATIVE} fontSize={15} fontWeight={600}>
                nsec — keep this one
              </text>
              <rect x={D_LINE.x} y={D_LINE.y - 20} width={D_LINE.w} height={34} rx={8} fill={colors.PANEL} stroke={colors.NEGATIVE} opacity={0.9} />
              <text x={D_LINE.x + 14} y={D_LINE.y + 2} fill={colors.TEXT} fontSize={14} fontFamily="monospace">
                d = 4c96…d1e2
              </text>
              <MathLabel tex={'d \\in [1, n)'} x={D_LINE.x + 4} y={D_LINE.y + 46} opacity={dU * 0.8} />
            </g>
          )}

          <EcCurve view={CURVE_VIEW} reveal={curveU} />

          {/* hop chain d·G */}
          {HOPS.map((_, i) => {
            if (i === 0) return null;
            const u = clamp01(hopU * (HOPS.length - 1) - (i - 1));
            if (u <= 0) return null;
            const a = hopPt(i - 1);
            const b = hopPt(i);
            const mx = (a.x + b.x) / 2;
            const my = Math.min(a.y, b.y) - 52;
            return (
              <path
                key={i}
                d={`M${a.x},${a.y} Q${mx},${my} ${a.x + (b.x - a.x) * u},${a.y + (b.y - a.y) * u}`}
                fill="none"
                stroke={colors.SECONDARY}
                strokeWidth={1.8}
                opacity={0.85}
              />
            );
          })}
          {curveU > 0.5 && (
            <g>
              <circle cx={hopPt(0).x} cy={hopPt(0).y} r={7} fill={colors.SECONDARY} />
              <text x={hopPt(0).x - 4} y={hopPt(0).y - 14} fill={colors.SECONDARY} fontSize={15} fontWeight={600}>
                G
              </text>
            </g>
          )}
          {pU > 0 && (
            <g opacity={pU}>
              <circle cx={hopPt(HOPS.length - 1).x} cy={hopPt(HOPS.length - 1).y} r={8} fill={colors.WARM} />
              <text x={hopPt(HOPS.length - 1).x - 16} y={hopPt(HOPS.length - 1).y - 10} textAnchor="end" fill={colors.WARM} fontSize={15} fontWeight={600}>
                P = d·G — your npub
              </text>
            </g>
          )}

          {/* one-way street */}
          {oneWayU > 0 && (
            <g opacity={oneWayU}>
              <text x={620} y={560} textAnchor="middle" fill={colors.POSITIVE} fontSize={14}>
                d → P: microseconds
              </text>
              <text x={920} y={560} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14}>
                P → d: the discrete log problem
              </text>
            </g>
          )}

          {/* real message digest */}
          {msgU > 0 && (
            <g opacity={msgU}>
              <text x={DIGEST.x} y={DIGEST.y - 30} fill={colors.TEXT} fontSize={14} fontFamily="monospace">
                "{MSG}"
              </text>
              <text x={DIGEST.x} y={DIGEST.y - 12} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                SHA-256 → {shortHex(MSG_HEX, 10, 6)}
              </text>
              <BitField
                bits={MSG_BITS}
                x={DIGEST.x}
                y={DIGEST.y}
                cell={DIGEST.cell}
                gap={DIGEST.gap}
                reveal={msgU}
                settle={settleU}
                seed={11}
              />
            </g>
          )}

          {/* schnorr */}
          {sigU > 0 && (
            <g opacity={sigU}>
              <rect x={310} y={488} width={170} height={40} rx={9} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={395} y={513} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
                sig = (R, s)
              </text>
              <MathLabel tex={'s \\cdot G = R + H(R \\,\\|\\, P \\,\\|\\, m) \\cdot P'} x={730} y={496} opacity={sigU} />
            </g>
          )}
          {verifyU > 0 && (
            <g opacity={verifyU}>
              <circle cx={1075} cy={508} r={14} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} />
              <path d="M1067 508 l6 6 l10 -12" fill="none" stroke={colors.POSITIVE} strokeWidth={2.6} strokeLinecap="round" />
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            One secret number, one public point
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            identity with no account, verified by an equation anyone can run
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-01 · schnorr over secp256k1 · P = d·G
          </text>
        </g>
      )}
    </>
  );
}

export function NostrKeys() {
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
