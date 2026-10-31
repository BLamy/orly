import { CAMERA_HOME, Camera, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Connection, MatrixGrid, RequestFlow, ServiceNode, SERVICE_COLOR, Zone } from '../../primitives';
import overrides from './overrides.json';
import {
  ARR,
  BADGES,
  CAM_JOIN,
  BADGE_Y,
  BATCH_PATH,
  CHIP0,
  CHIPS,
  COUNT_POS,
  D4_IN,
  D4_OUT_A,
  D4_OUT_B,
  EDGES,
  FRONTIER,
  HOPS,
  HOP_LABELS_MINUS,
  HOP_LABELS_PLUS,
  LOOKUP_PATH,
  NODES,
  TIMER_POS,
  TRACE,
  TRACE_CELLS,
  TRACE_ROWS,
  TRACE_VALUES,
  TRIPLE_POS,
  ZONE,
  buildScene,
} from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/differential-dataflow/overrides.json', slug: 'differential-dataflow' };

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/** A little (data, time, diff) record chip — +1 POSITIVE, −1 NEGATIVE. */
function UpdateChip({ x, y, text, positive, u }: { x: number; y: number; text: string; positive: boolean; u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const color = positive ? colors.POSITIVE : colors.NEGATIVE;
  const w = text.length * 8.6 + 24;
  const s = 0.8 + 0.2 * uu;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} opacity={uu}>
      <rect x={-w / 2} y={-17} width={w} height={34} rx={17} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      <text y={5} textAnchor="middle" fill={color} fontSize={15} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

/** A timestamp badge; turns POSITIVE once the frontier has passed it. */
function TimeBadge({ x, y, t, u, final }: { x: number; y: number; t: number; u: number; final: boolean }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const color = final ? colors.POSITIVE : colors.MUTED;
  const s = 0.8 + 0.2 * uu;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} opacity={uu}>
      <rect x={-28} y={-15} width={56} height={30} rx={9} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      <text y={5} textAnchor="middle" fill={final ? colors.POSITIVE : colors.TEXT} fontSize={14} fontFamily={MONO}>
        {`t=${t}`}
      </text>
    </g>
  );
}

/** A hop's label sits under the pipeline (clear of the node boxes) and
 *  fades in and out with the delta that carries it. */
function HopTag({ x, text, color, u }: { x: number; text: string; color: string; u: number }) {
  const uu = clamp01(u);
  const o = Math.min(1, uu * 6) * Math.min(1, (1 - uu) * 6);
  if (o <= 0) return null;
  return (
    <text x={x} y={404} textAnchor="middle" fill={color} fontSize={14} fontFamily={MONO} opacity={o}>
      {text}
    </text>
  );
}

/** The wry stopwatch line under the pipeline. */
function TimerTag({ text, color, u }: { text: string; color: string; u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <text
      x={TIMER_POS.x}
      y={TIMER_POS.y + (1 - uu) * 10}
      textAnchor="middle"
      fill={color}
      fontSize={21}
      fontWeight={600}
      fontFamily={MONO}
      opacity={uu}
    >
      {text}
    </text>
  );
}

/** Pure render: SceneState in, SVG out. */
function renderFrame(s: SceneState) {
  const dim = s.get(scene.pipeDim);
  const connU = s.get(scene.connU);
  const connFlow = s.get(scene.connFlow);
  const chipsU = s.get(scene.chipsU);
  const arrU = s.get(scene.arrU);
  const traceU = s.get(scene.traceU);
  const countU = s.get(scene.countU);
  const pop = s.get(scene.countPop);
  const badgesU = s.get(scene.badgesU);
  const frontierU = s.get(scene.frontierU);
  const fx = s.get(scene.frontierX);
  // the input panel lives at home zoom; it fades out as the camera moves in on the join
  const cam = s.get(scene.cam);
  const inputFade = clamp01((CAM_JOIN.k - cam.k) / (CAM_JOIN.k - CAMERA_HOME.k));

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ---- the query, drawn as a dataflow ------------------------------ */}
      <Zone {...ZONE} label="the query" kind="group" u={s.get(scene.zoneU)} dim={dim} />
      {/* the input collection the source stands for: fills the empty top band */}
      {inputFade > 0 && (
        <g opacity={s.get(scene.zoneU) * (1 - 0.5 * dim) * inputFade}>
          <rect x={36} y={100} width={160} height={100} rx={10} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.5} />
          <text x={48} y={120} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
            orders
          </text>
          {['alice', 'bob', 'carol'].map((name, i) => (
            <text key={name} x={48} y={138 + i * 16} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
              {name}
            </text>
          ))}
          <text x={48} y={188} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
            + 9,999,997 more
          </text>
        </g>
      )}
      {EDGES.map((e, i) => (
        <Connection
          key={`e${i}`}
          from={e.from}
          to={e.to}
          u={clamp01(connU * 4 - i)}
          flow={connFlow}
          color={colors.MUTED}
          dim={dim}
        />
      ))}
      <ServiceNode {...NODES.orders} kind="db" label="orders" sublabel="source" u={s.get(scene.nodeU[0])} dim={dim} />
      <ServiceNode {...NODES.map} kind="server" label="map" sublabel="transform" u={s.get(scene.nodeU[1])} glow={s.get(scene.mapGlow)} dim={dim} />
      <ServiceNode {...NODES.join} kind="server" label="join" sublabel="⋈ users" u={s.get(scene.nodeU[2])} glow={s.get(scene.joinGlow)} dim={dim} />
      <ServiceNode {...NODES.count} kind="server" label="count" sublabel="Σ by key" u={s.get(scene.nodeU[3])} glow={s.get(scene.countGlow)} dim={dim} />
      <ServiceNode {...NODES.dash} kind="db" label="dashboard" sublabel="sink" u={s.get(scene.nodeU[4])} glow={s.get(scene.dashGlow)} dim={dim} />

      {/* live count above the sink — ticks 41 → 42 → 41, never recomputed */}
      {countU > 0 && (
        <g transform={`translate(${COUNT_POS.x}, ${COUNT_POS.y}) scale(${1 + 0.3 * pop})`} opacity={countU}>
          <text textAnchor="middle" fill={colors.WARM} fontSize={34} fontWeight={700} fontFamily={MONO}>
            {Math.round(s.get(scene.countVal))}
          </text>
        </g>
      )}

      {/* ---- beat 1: one changed row, then the everything-sweep ---------- */}
      <UpdateChip x={CHIP0.x} y={CHIP0.y} text={CHIP0.text} positive u={s.get(scene.chip0U)} />
      <RequestFlow path={BATCH_PATH} u={s.get(scene.batchU)} r={14} label="10M rows" color={colors.ACCENT} labelSize={15} />
      <TimerTag text="took: minutes" color={colors.NEGATIVE} u={s.get(scene.timer1U)} />
      <TimerTag text="took: microseconds" color={colors.POSITIVE} u={s.get(scene.timer2U)} />

      {/* ---- beat 2: the unit of work is (data, time, diff) --------------- */}
      <text
        x={TRIPLE_POS.x}
        y={TRIPLE_POS.y + 9}
        textAnchor="middle"
        fill={colors.TEXT}
        fontSize={26}
        fontFamily={MONO}
        opacity={s.get(scene.tripleU)}
      >
        (data, time, diff)
      </text>
      {CHIPS.map((c, i) => (
        <UpdateChip key={`chip${i}`} x={c.x} y={c.y} text={c.text} positive={c.positive} u={clamp01(chipsU - i)} />
      ))}

      {/* ---- beat 3: a +1 delta hops operator to operator ------------------ */}
      {HOPS.map((path, i) => (
        <RequestFlow key={`d3${i}`} path={path} u={s.get(scene.d3[i])} r={7} color={colors.POSITIVE} />
      ))}
      {HOPS.map((path, i) => (
        <HopTag key={`d3t${i}`} x={(path[0].x + path[1].x) / 2} text={HOP_LABELS_PLUS[i]} color={colors.POSITIVE} u={s.get(scene.d3[i])} />
      ))}

      {/* ---- beat 4: the join's arrangement (indexed history) -------------- */}
      <Connection
        from={LOOKUP_PATH[0]}
        to={LOOKUP_PATH[1]}
        u={s.get(scene.arrConnU)}
        dashed
        arrow={false}
        color={SERVICE_COLOR.cache}
      />
      <ServiceNode x={ARR.x} y={ARR.y} w={ARR.w} kind="cache" label="arrangement" sublabel="indexed history" u={arrU} />
      {traceU > 0 && (
        <g>
          <text x={TRACE.x} y={TRACE.y - 14} fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={clamp01(traceU * 2)}>
            key → stored rows
          </text>
          <MatrixGrid
            x={TRACE.x}
            y={TRACE.y}
            values={TRACE_VALUES}
            cell={TRACE.cell}
            gap={TRACE.gap}
            rowLabels={TRACE_ROWS}
            labelSize={14}
            cellU={(i, j) => clamp01(traceU * TRACE_CELLS - (i * TRACE_VALUES[0].length + j))}
            highlight={{ row: 1, color: colors.WARM, u: s.get(scene.arrHi) }}
          />
        </g>
      )}
      <RequestFlow path={D4_IN} u={s.get(scene.d4in)} r={7} color={colors.POSITIVE} label={'("bob", t=5, +1)'} />
      <RequestFlow
        path={LOOKUP_PATH}
        u={s.get(scene.d4look)}
        roundTrip
        r={6}
        color={colors.WARM}
        responseColor={colors.POSITIVE}
        label="lookup: bob"
        responseLabel="2 rows"
        labelSize={12}
      />
      <RequestFlow path={D4_OUT_A} u={s.get(scene.d4outA)} r={6} color={colors.POSITIVE} label="+1" labelSize={12} />
      <RequestFlow path={D4_OUT_B} u={s.get(scene.d4outB)} r={6} color={colors.POSITIVE} label="+1" labelSize={12} />

      {/* ---- beat 5: retraction — a −1 rides the same rails ---------------- */}
      {HOPS.map((path, i) => (
        <RequestFlow key={`d5${i}`} path={path} u={s.get(scene.d5[i])} r={7} color={colors.NEGATIVE} />
      ))}
      {HOPS.map((path, i) => (
        <HopTag key={`d5t${i}`} x={(path[0].x + path[1].x) / 2} text={HOP_LABELS_MINUS[i]} color={colors.NEGATIVE} u={s.get(scene.d5[i])} />
      ))}

      {/* ---- beat 6: timestamps & the frontier ----------------------------- */}
      {BADGES.map((b, i) => (
        <TimeBadge key={`t${b.t}`} x={b.x} y={BADGE_Y} t={b.t} u={clamp01(badgesU - i)} final={b.x + 24 < fx} />
      ))}
      {frontierU > 0 && (
        <g opacity={frontierU}>
          <line x1={fx} y1={FRONTIER.y0} x2={fx} y2={FRONTIER.y1} stroke={colors.WARM} strokeWidth={2.5} />
          <text x={fx} y={FRONTIER.y0 - 12} textAnchor="middle" fill={colors.WARM} fontSize={12} fontWeight={700} letterSpacing="0.1em">
            FRONTIER
          </text>
        </g>
      )}
    </Camera>
  );
}

export function DifferentialDataflow() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
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
