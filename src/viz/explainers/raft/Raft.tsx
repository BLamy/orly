import { interpolateRgb } from 'd3';
import { Player, colors } from '../../core';
import type { TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { NodeBadge, Packet, TimerArc } from '../../primitives';
import {
  ARC_DX,
  ARC_DY,
  BADGE_H,
  BADGE_W,
  BLOCKED1,
  BLOCKED2,
  buildScene,
  CELL,
  CELL_GAP,
  CLIENT,
  HB2,
  MAJORITY,
  PART_LEN,
  PART_X,
  PART_Y0,
  PEERS1,
  PEERS2,
  RESET2,
  SERVERS,
  SLOTS,
  STRIP_DY,
  STRIP_W,
  T1,
  T2,
  WALL1,
  WALL2,
} from './scene';
import type { Pt } from './scene';

const sc = buildScene();
sc.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/raft/overrides.json', slug: 'raft' };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Log-entry color: amber (uncommitted) → emerald (committed). */
const warmToPos = interpolateRgb(colors.WARM, colors.POSITIVE);
/** Timer arcs get nervous (amber) as they run low. */
const arcTint = interpolateRgb(colors.WARM, colors.MUTED);

const S3 = SERVERS[2];
const S4 = SERVERS[3];

function Cross({ p, opacity }: { p: Pt; opacity: number }) {
  return (
    <g opacity={opacity} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round">
      <line x1={p.x - 7} y1={p.y - 7} x2={p.x + 7} y2={p.y + 7} />
      <line x1={p.x - 7} y1={p.y + 7} x2={p.x + 7} y2={p.y - 7} />
    </g>
  );
}

export function Raft() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={sc.tl} loop motion={MOTION}>
        {(s) => {
          // Election-timer remaining: a pure derivation of the shared clocks.
          const arcRem = (i: number): number => {
            const rem1 = clamp01(1 - s.get(sc.clock1) / T1[i]);
            const p1 =
              i === 2
                ? Math.max(rem1, s.get(sc.refill3))
                : Math.max(rem1, s.get(sc.refill1));
            if (!MAJORITY.includes(i)) return p1;
            const rem2 = clamp01(1 - s.get(sc.clock2) / T2[i]);
            const p2 = Math.min(p1, rem2);
            return RESET2.includes(i) ? Math.max(p2, s.get(sc.refill2)) : p2;
          };

          const pu = s.get(sc.partU);
          const bf = s.get(sc.blockFlash);
          const bf2 = s.get(sc.blockFlash2);
          const termN = Math.floor(s.get(sc.term) + 1e-6);
          const dims = SERVERS.map((_, i) => clamp01(s.get(sc.dim[i])));

          return (
            <g>
              {/* term counter, top-center */}
              <text
                x={640}
                y={54}
                textAnchor="middle"
                fill={colors.TEXT}
                fontSize={26}
                fontWeight={700}
                opacity={0.92}
              >
                term {termN}
              </text>

              {/* servers: badge + election-timer arc + mini log strip */}
              {SERVERS.map((p, i) => {
                const su = s.get(sc.srvU[i]);
                const rem = arcRem(i);
                const stripX = p.x - STRIP_W / 2;
                const stripY = p.y + STRIP_DY;
                return (
                  <g key={i}>
                    <NodeBadge
                      x={p.x}
                      y={p.y}
                      w={BADGE_W}
                      h={BADGE_H}
                      label={`S${i + 1}`}
                      sublabel={s.get(sc.role[i])}
                      color={s.get(sc.color[i])}
                      u={su}
                      glow={s.get(sc.glow[i])}
                      dim={dims[i]}
                      labelSize={16}
                    />
                    <TimerArc
                      cx={p.x + ARC_DX}
                      cy={p.y + ARC_DY}
                      r={11}
                      u={rem}
                      color={arcTint(clamp01(rem / 0.45))}
                      opacity={su * s.get(sc.arcOp[i]) * (1 - 0.55 * dims[i])}
                    />
                    {/* empty log slots */}
                    {Array.from({ length: SLOTS }, (_, j) => (
                      <rect
                        key={j}
                        x={stripX + j * (CELL + CELL_GAP)}
                        y={stripY}
                        width={CELL}
                        height={CELL}
                        rx={3.5}
                        fill="none"
                        stroke={colors.GRID}
                        strokeWidth={1.5}
                        opacity={su * (1 - 0.4 * dims[i])}
                      />
                    ))}
                    {/* log entries (2 used in this drama) */}
                    {[0, 1].map((j) => {
                      const u = s.get(sc.cellU[i][j]);
                      if (u <= 0.001) return null;
                      const c = s.get(sc.cellC[i][j]);
                      const col = warmToPos(c);
                      const cx = stripX + j * (CELL + CELL_GAP) + CELL / 2;
                      const cy = stripY + CELL / 2;
                      return (
                        <g
                          key={j}
                          transform={`translate(${cx}, ${cy}) scale(${0.55 + 0.45 * clamp01(u)})`}
                          opacity={clamp01(u) * (1 - 0.5 * dims[i])}
                        >
                          <rect
                            x={-CELL / 2}
                            y={-CELL / 2}
                            width={CELL}
                            height={CELL}
                            rx={3.5}
                            fill={col}
                            fillOpacity={0.2 + 0.65 * c}
                            stroke={col}
                            strokeWidth={1.8}
                            strokeDasharray={c < 0.98 ? '3.5 2.5' : undefined}
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* the client, far left */}
              <NodeBadge
                x={CLIENT.x}
                y={CLIENT.y}
                w={118}
                h={48}
                label="client"
                color={colors.SECONDARY}
                u={s.get(sc.clientU)}
                labelSize={16}
              />

              {/* ---- packets: term-2 election ---- */}
              {PEERS1.map((i, k) => (
                <g key={`p1-${i}`}>
                  <Packet
                    from={S3}
                    to={SERVERS[i]}
                    u={s.get(sc.rv[k])}
                    color={colors.WARM}
                    r={6}
                    label={i === 1 ? 'vote for me?' : undefined}
                  />
                  <Packet
                    from={SERVERS[i]}
                    to={S3}
                    u={s.get(sc.vt[k])}
                    color={colors.POSITIVE}
                    r={5.5}
                    label={i === 0 ? 'aye' : i === 4 ? 'aye (late)' : undefined}
                  />
                  <Packet from={S3} to={SERVERS[i]} u={s.get(sc.hb[k])} color={colors.ACCENT} r={4} />
                  <Packet
                    from={S3}
                    to={SERVERS[i]}
                    u={s.get(sc.ae[k])}
                    color={colors.ACCENT}
                    r={6}
                    label={i === 3 ? 'append x=5' : undefined}
                  />
                  <Packet from={SERVERS[i]} to={S3} u={s.get(sc.ack[k])} color={colors.POSITIVE} r={4.5} />
                </g>
              ))}

              {/* ---- packets: client writes ---- */}
              <Packet from={CLIENT} to={S3} u={s.get(sc.cw1)} color={colors.SECONDARY} r={7} label="set x=5" />
              <Packet from={CLIENT} to={S3} u={s.get(sc.cw2)} color={colors.SECONDARY} r={7} label="set x=7" />
              <Packet from={CLIENT} to={S4} u={s.get(sc.cw3)} color={colors.SECONDARY} r={7} label="set x=8" />

              {/* ---- packets: blocked at the wall ---- */}
              {BLOCKED1.map((i, k) => (
                <Packet key={`b1-${i}`} from={S3} to={WALL1[k]} u={s.get(sc.bp[k])} color={colors.WARM} r={5} />
              ))}
              {BLOCKED2.map((i, k) => (
                <Packet
                  key={`b2-${i}`}
                  from={S4}
                  to={WALL2[k]}
                  u={s.get(sc.bp2[k])}
                  color={colors.WARM}
                  r={5}
                  opacity={0.85}
                />
              ))}

              {/* ---- packets: term-3 election + replication (majority side) ---- */}
              {PEERS2.map((i, k) => (
                <g key={`p2-${i}`}>
                  <Packet
                    from={S4}
                    to={SERVERS[i]}
                    u={s.get(sc.rv2[k])}
                    color={colors.WARM}
                    r={6}
                    label={k === 0 ? 'vote for me?' : undefined}
                  />
                  <Packet from={SERVERS[i]} to={S4} u={s.get(sc.vt2[k])} color={colors.POSITIVE} r={5.5} />
                  <Packet
                    from={S4}
                    to={SERVERS[i]}
                    u={s.get(sc.ae2[k])}
                    color={colors.ACCENT}
                    r={6}
                    label={k === 0 ? 'append x=8' : undefined}
                  />
                  <Packet from={SERVERS[i]} to={S4} u={s.get(sc.ack2[k])} color={colors.POSITIVE} r={4.5} />
                </g>
              ))}

              {/* ---- packets: term-3 heartbeats + catch-up appends ---- */}
              {HB2.map((i, k) => (
                <Packet
                  key={`h2-${i}`}
                  from={S4}
                  to={SERVERS[i]}
                  u={s.get(sc.hb2[k])}
                  color={colors.ACCENT}
                  r={4}
                  label={i === 2 ? 'term 3' : undefined}
                />
              ))}
              <Packet from={S4} to={SERVERS[0]} u={s.get(sc.aem[0])} color={colors.ACCENT} r={6} />
              <Packet
                from={S4}
                to={S3}
                u={s.get(sc.aem[1])}
                color={colors.ACCENT}
                r={6}
                label="append x=8"
              />

              {/* the partition wall (sweeps down, later lifts) */}
              {pu > 0.001 && (
                <line
                  x1={PART_X}
                  y1={PART_Y0}
                  x2={PART_X}
                  y2={PART_Y0 + PART_LEN * pu}
                  stroke={colors.NEGATIVE}
                  strokeWidth={3}
                  strokeDasharray="10 8"
                  opacity={Math.min(1, pu * 3) * 0.85}
                />
              )}
              {bf > 0.003 && WALL1.map((p, k) => <Cross key={k} p={p} opacity={bf} />)}
              {bf2 > 0.003 && WALL2.map((p, k) => <Cross key={k} p={p} opacity={bf2} />)}

              {/* vote tallies */}
              <text
                x={S3.x}
                y={S3.y - 64}
                textAnchor="middle"
                fill={colors.WARM}
                fontSize={21}
                fontWeight={700}
                opacity={s.get(sc.tallyU)}
              >
                {Math.floor(s.get(sc.tallyN) + 1e-6)}/5
              </text>
              <text
                x={S4.x}
                y={S4.y - 64}
                textAnchor="middle"
                fill={colors.WARM}
                fontSize={21}
                fontWeight={700}
                opacity={s.get(sc.tally2U)}
              >
                {Math.floor(s.get(sc.tally2N) + 1e-6)}/5
              </text>
            </g>
          );
        }}
      </Player>
    </div>
  );
}
