import { interpolateRgb } from 'd3';
import { MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { MatrixGrid, NodeBadge, Packet } from '../../primitives';
import overrides from './overrides.json';
import type { Pt } from './scene';
import {
  A,
  B,
  BADGE_H,
  BADGE_W,
  BREAK_GAP,
  CELL,
  COUNTER_DY,
  GAP,
  GHOST_DY,
  GRID_DY,
  GRID_W,
  INCOMING_AT_A,
  INCOMING_AT_B,
  LINK_A,
  LINK_B,
  LINK_MID,
  MERGE_AB,
  MERGE_BA,
  REG,
  REPLAY_RESULT,
  REPLAY_ROWS,
  RX,
  TAP_A,
  TAP_B,
  WRITE_A,
  WRITE_B,
  buildScene,
} from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/** Link tint: neutral while connected, rose while partitioned. */
const linkTint = interpolateRgb(colors.MUTED, colors.NEGATIVE);
/** A losing register value drifts from its author's color toward amber. */
const loserTint = interpolateRgb(colors.ACCENT, colors.WARM);

/** LWW state packets travel register-to-register on offset lanes. */
const LWW_AB = {
  from: { x: A.x + REG.w / 2 + 10, y: A.y + REG.boxDy - 8 },
  to: { x: B.x - REG.w / 2 - 10, y: B.y + REG.boxDy - 8 },
};
const LWW_BA = {
  from: { x: B.x - REG.w / 2 - 10, y: B.y + REG.boxDy + 8 },
  to: { x: A.x + REG.w / 2 + 10, y: A.y + REG.boxDy + 8 },
};

/** The dashed sync link — one line while whole, two retracting halves offline. */
function SyncLink({ linkIn, brk }: { linkIn: number; brk: number }) {
  if (linkIn <= 0.002) return null;
  const color = linkTint(clamp01(brk));
  const dash = '9 7';
  if (brk <= 0.004) {
    const x2 = LINK_A.x + (LINK_B.x - LINK_A.x) * linkIn;
    return (
      <line
        x1={LINK_A.x}
        y1={LINK_A.y}
        x2={x2}
        y2={LINK_B.y}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dash}
        opacity={0.8}
      />
    );
  }
  const gap = BREAK_GAP * brk;
  return (
    <g opacity={0.8 - 0.25 * brk}>
      <line x1={LINK_A.x} y1={LINK_A.y} x2={LINK_MID - gap} y2={LINK_A.y} stroke={color} strokeWidth={2} strokeDasharray={dash} />
      <line x1={LINK_MID + gap} y1={LINK_B.y} x2={LINK_B.x} y2={LINK_B.y} stroke={color} strokeWidth={2} strokeDasharray={dash} />
      <text x={LINK_MID} y={LINK_A.y + 5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} opacity={brk}>
        offline
      </text>
    </g>
  );
}

/** The incoming (just-received) vector, drawn as a dashed ghost row. */
function GhostRow({ cx, y, vals, u }: { cx: number; y: number; vals: readonly [number, number]; u: number }) {
  if (u <= 0.002) return null;
  const x0 = cx - GRID_W / 2;
  return (
    <g opacity={u}>
      <text x={x0 - 12} y={y + CELL / 2 + 4} textAnchor="end" fill={colors.MUTED} fontSize={13}>
        in
      </text>
      {vals.map((v, j) => (
        <g key={j}>
          <rect
            x={x0 + j * (CELL + GAP)}
            y={y}
            width={CELL}
            height={CELL}
            rx={6}
            fill="none"
            stroke={colors.SECONDARY}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text
            x={x0 + j * (CELL + GAP) + CELL / 2}
            y={y + CELL / 2 + 5}
            textAnchor="middle"
            fill={colors.SECONDARY}
            fontSize={14}
            fontFamily={MONO}
          >
            {v}
          </text>
        </g>
      ))}
    </g>
  );
}

interface ReplicaView {
  p: Pt;
  cells: [number, number];
  incoming: readonly [number, number];
  pop: number;
  ghost: number;
}

/** One replica's G-Counter: big total, per-device cells, incoming ghost row. */
function CounterBlock({
  r,
  cellsIn,
  opacity,
  flash0,
  flash1,
}: {
  r: ReplicaView;
  cellsIn: number;
  opacity: number;
  flash0: number;
  flash1: number;
}) {
  if (opacity <= 0.002) return null;
  const gridX = r.p.x - GRID_W / 2;
  const gridY = r.p.y + GRID_DY;
  const ghostY = gridY + GHOST_DY;
  const total = Math.round(r.cells[0]) + Math.round(r.cells[1]);
  const popS = 1 + 0.22 * r.pop;
  return (
    <g opacity={opacity}>
      <g transform={`translate(${r.p.x}, ${r.p.y + COUNTER_DY}) scale(${popS})`} opacity={cellsIn}>
        <text y={6} textAnchor="middle" fill={colors.TEXT} fontSize={23} fontWeight={700}>
          likes: {total}
        </text>
      </g>
      <MatrixGrid
        x={gridX}
        y={gridY}
        values={[[r.cells[0] / 3, r.cells[1] / 3]]}
        cell={CELL}
        gap={GAP}
        cellU={() => cellsIn}
        emphasize={1.01}
        showValues={(v) => String(Math.round(v * 3))}
        colLabels={['A', 'B']}
        labelSize={14}
      />
      <GhostRow cx={r.p.x} y={ghostY} vals={r.incoming} u={r.ghost} />
      {/* per-slot compare flash spans the local cell and the incoming ghost cell */}
      {[flash0, flash1].map((f, j) =>
        f > 0.002 ? (
          <rect
            key={j}
            x={gridX + j * (CELL + GAP) - 5}
            y={gridY - 5}
            width={CELL + 10}
            height={GHOST_DY + CELL + 10}
            rx={9}
            fill="none"
            stroke={colors.WARM}
            strokeWidth={2.5}
            opacity={f * r.ghost}
          />
        ) : null,
      )}
    </g>
  );
}

/** A vector chip for the replay strip: [a b] in a small outlined pill. */
function VecChip({ x, y, v, color }: { x: number; y: number; v: readonly [number, number]; color: string }) {
  const w = 62;
  return (
    <g>
      <rect x={x - w / 2} y={y - 17} width={w} height={34} rx={8} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      <text x={x} y={y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
        {`[${v[0]} ${v[1]}]`}
      </text>
    </g>
  );
}

/** Beat 5: the merge, replayed three ways over a dimming overlay. */
function ReplayStrip({ s }: { s: SceneState }) {
  const u = s.get(scene.replayU);
  if (u <= 0.002) return null;
  return (
    <g>
      <rect x={0} y={0} width={1280} height={720} fill={colors.BG} opacity={0.86 * u} />
      <g opacity={u}>
        <text x={640} y={172} textAnchor="middle" fill={colors.MUTED} fontSize={14} letterSpacing="0.3em">
          SAME MERGE, THREE WAYS
        </text>
        {REPLAY_ROWS.map((row, i) => {
          const lu = s.get(scene.lines[i]);
          if (lu <= 0.002) return null;
          return (
            <g key={i} opacity={lu} transform={`translate(${(1 - lu) * 26}, 0)`}>
              <VecChip x={RX.chipA} y={row.y} v={row.a} color={colors.ACCENT} />
              <text x={RX.op} y={row.y + 6} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
                ⊔
              </text>
              <VecChip x={RX.chipB} y={row.y} v={row.b} color={colors.POSITIVE} />
              <text x={RX.eq} y={row.y + 6} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
                =
              </text>
              <VecChip x={RX.res} y={row.y} v={REPLAY_RESULT} color={colors.WARM} />
              <text x={RX.check} y={row.y + 6} textAnchor="middle" fill={colors.POSITIVE} fontSize={19}>
                ✓
              </text>
              {row.note && (
                <text x={RX.note} y={row.y + 5} fill={colors.MUTED} fontSize={15} fontStyle="italic">
                  {row.note}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </g>
  );
}

/** A register slot: value + timestamp in a pill; dashed when empty or losing. */
function RegisterBox({
  cx,
  cy,
  color,
  u,
  value,
  tstamp,
  dashed = false,
}: {
  cx: number;
  cy: number;
  color: string;
  u: number;
  value?: string;
  tstamp?: string;
  dashed?: boolean;
}) {
  const uu = clamp01(u);
  if (uu <= 0.002) return null;
  const sc = 0.85 + 0.15 * uu;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${sc})`} opacity={uu}>
      <rect
        x={-REG.w / 2}
        y={-REG.h / 2}
        width={REG.w}
        height={REG.h}
        rx={10}
        fill={colors.PANEL}
        stroke={color}
        strokeWidth={1.8}
        strokeDasharray={dashed ? '6 5' : undefined}
      />
      {value === undefined ? (
        <text y={6} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
          —
        </text>
      ) : (
        <>
          <text x={-REG.w / 2 + 14} y={6} fill={colors.TEXT} fontSize={17} fontWeight={600}>
            {value}
          </text>
          <text x={REG.w / 2 - 12} y={6} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
            {tstamp}
          </text>
        </>
      )}
    </g>
  );
}

/** Beat 6: the LWW "title" register — the later clock wins, the loser bows out. */
function RegisterBlock({ s }: { s: SceneState }) {
  const u = s.get(scene.regU);
  if (u <= 0.002) return null;
  const draftA = s.get(scene.draftA);
  const draftOut = s.get(scene.draftAOut);
  const finalA = s.get(scene.finalA);
  const finalB = s.get(scene.finalB);
  const gIn = s.get(scene.bGhostIn);
  const gOut = s.get(scene.bGhostOut);
  const draftY = A.y + REG.boxDy + (REG.ghostDy - REG.boxDy) * draftOut;

  return (
    <g opacity={u}>
      {[A, B].map((p, i) => (
        <text key={i} x={p.x} y={p.y + REG.labelDy} textAnchor="middle" fill={colors.MUTED} fontSize={13} letterSpacing="0.22em">
          TITLE
        </text>
      ))}

      {/* empty slots give way as writes land */}
      <RegisterBox cx={A.x} cy={A.y + REG.boxDy} color={colors.MUTED} u={1 - Math.max(draftA, finalA)} dashed />
      <RegisterBox cx={B.x} cy={B.y + REG.boxDy} color={colors.MUTED} u={1 - finalB} dashed />

      {/* A: "Draft"@10 lands, then bows out — dashed, amber — as "Final"@12 wins */}
      <RegisterBox
        cx={A.x}
        cy={draftY}
        color={loserTint(clamp01(draftOut))}
        u={draftA * (1 - 0.62 * draftOut)}
        value="Draft"
        tstamp="t=10"
        dashed={draftOut > 0.02}
      />
      <RegisterBox cx={A.x} cy={A.y + REG.boxDy} color={colors.POSITIVE} u={finalA} value="Final" tstamp="t=12" />

      {/* B: "Final"@12 stays; incoming "Draft"@10 loses on clocks */}
      <RegisterBox cx={B.x} cy={B.y + REG.boxDy} color={colors.POSITIVE} u={finalB} value="Final" tstamp="t=12" />
      <RegisterBox
        cx={B.x}
        cy={B.y + REG.ghostDy}
        color={loserTint(clamp01(gOut))}
        u={gIn * (1 - 0.68 * gOut)}
        value="Draft"
        tstamp="t=10"
        dashed
      />
      <text x={B.x + REG.w / 2 + 14} y={B.y + REG.ghostDy + 5} fill={colors.WARM} fontSize={14} fontFamily={MONO} opacity={gOut}>
        {'10 < 12'}
      </text>

      {/* the offline writes, then the register exchange */}
      <Packet from={WRITE_A.from} to={WRITE_A.to} u={s.get(scene.wPktA)} color={colors.ACCENT} label={'write "Draft"'} r={8} />
      <Packet from={WRITE_B.from} to={WRITE_B.to} u={s.get(scene.wPktB)} color={colors.POSITIVE} label={'write "Final"'} r={8} />
      <Packet from={LWW_AB.from} to={LWW_AB.to} u={s.get(scene.lwwAB)} color={colors.ACCENT} label="Draft · t=10" r={8} />
      <Packet from={LWW_BA.from} to={LWW_BA.to} u={s.get(scene.lwwBA)} color={colors.POSITIVE} label="Final · t=12" r={8} />
    </g>
  );
}

/** Pure render: SceneState in, SVG out. */
function renderFrame(s: SceneState) {
  const counterU = 1 - s.get(scene.regU);
  const cellsIn = s.get(scene.cellsIn);
  const flash0 = s.get(scene.flash0);
  const flash1 = s.get(scene.flash1);

  const repA: ReplicaView = {
    p: A,
    cells: [s.get(scene.aA), s.get(scene.aB)],
    incoming: INCOMING_AT_A,
    pop: s.get(scene.popA),
    ghost: s.get(scene.ghostA),
  };
  const repB: ReplicaView = {
    p: B,
    cells: [s.get(scene.bA), s.get(scene.bB)],
    incoming: INCOMING_AT_B,
    pop: s.get(scene.popB),
    ghost: s.get(scene.ghostB),
  };

  return (
    <g>
      <SyncLink linkIn={s.get(scene.linkIn)} brk={s.get(scene.linkBreak)} />

      {/* idle sync pulses along the link */}
      <Packet from={LINK_A} to={LINK_B} u={s.get(scene.pulseAB)} r={5} color={colors.ACCENT} opacity={0.65} />
      <Packet from={LINK_B} to={LINK_A} u={s.get(scene.pulseBA)} r={5} color={colors.POSITIVE} opacity={0.65} />

      <NodeBadge x={A.x} y={A.y} w={BADGE_W} h={BADGE_H} label="A" sublabel="laptop" color={colors.ACCENT} u={s.get(scene.uA)} glow={s.get(scene.glowA)} />
      <NodeBadge x={B.x} y={B.y} w={BADGE_W} h={BADGE_H} label="B" sublabel="phone" color={colors.POSITIVE} u={s.get(scene.uB)} glow={s.get(scene.glowB)} />

      <CounterBlock r={repA} cellsIn={cellsIn} opacity={counterU} flash0={flash0} flash1={flash1} />
      <CounterBlock r={repB} cellsIn={cellsIn} opacity={counterU} flash0={flash0} flash1={flash1} />

      {/* taps arrive as packets from off to the side */}
      <Packet from={TAP_A.from} to={TAP_A.to} u={s.get(scene.tapA1)} color={colors.ACCENT} label="+1" r={8} />
      <Packet from={TAP_A.from} to={TAP_A.to} u={s.get(scene.tapA2)} color={colors.ACCENT} label="+1" r={8} />
      <Packet from={TAP_B.from} to={TAP_B.to} u={s.get(scene.tapB1)} color={colors.POSITIVE} label="+1" r={8} />
      <Packet from={TAP_B.from} to={TAP_B.to} u={s.get(scene.tapB2)} color={colors.POSITIVE} label="+1" r={8} />
      <Packet from={TAP_B.from} to={TAP_B.to} u={s.get(scene.tapB3)} color={colors.POSITIVE} label="+1" r={8} />

      {/* the merge: each side mails its whole vector */}
      <Packet from={MERGE_AB.from} to={MERGE_AB.to} u={s.get(scene.pktAB)} color={colors.ACCENT} label="[2 0]" r={9} />
      <Packet from={MERGE_BA.from} to={MERGE_BA.to} u={s.get(scene.pktBA)} color={colors.POSITIVE} label="[0 3]" r={9} />

      <RegisterBlock s={s} />
      <ReplayStrip s={s} />

      {/* flavor heading + the merge rule stay above the replay overlay */}
      <text x={640} y={62} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontWeight={600} letterSpacing="0.32em" opacity={s.get(scene.flavorG)}>
        G-COUNTER
      </text>
      <text x={640} y={62} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontWeight={600} letterSpacing="0.32em" opacity={s.get(scene.flavorL)}>
        LWW REGISTER
      </text>
      <MathLabel tex="\operatorname{merge}(a,b)_i = \max(a_i,\, b_i)" x={640} y={128} fontSize={25} opacity={s.get(scene.texU)} />
    </g>
  );
}

export function Crdt() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/crdt/overrides.json', slug: 'crdt' }}>
        {renderFrame}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
