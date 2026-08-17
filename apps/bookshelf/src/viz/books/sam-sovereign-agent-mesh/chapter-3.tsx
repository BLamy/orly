// Sovereign Agent Mesh — chapter 3: Interest finds the tool.
//
// Grounded in google/sam at 0fb93d87b89881977cc77589b35c98444b6b5270:
// internal/node/discovery/discovery.go, internal/node/mcp_handlers.go,
// internal/node/mcp.go, and api/sam.proto. The centerpiece is one
// ServiceAnnounce table that stays on stage while interest narrows it from a
// field announcement into a namespaced tool result.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, MatrixGrid, NodeBadge, Packet, RequestFlow } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

type Pt = { x: number; y: number };

const LOCAL: Pt = { x: 154, y: 356 };
const TABLE_ORIGIN = { x: 356, y: 208 };
const PROVIDER: Pt = { x: 1080, y: 356 };
const TABLE_VALUES = [
  [0.9, 0.2, 0.15],
  [0.75, 0.68, 0.3],
  [0.95, 0.86, 0.52],
  [0.42, 0.72, 0.78],
  [0.62, 0.5, 0.92],
];
const ROWS = ['type', 'service_name', 'keys', 'labels', 'load'];
const COLS = ['announce', 'interest', 'catalog'];

function Chip({ x, y, text, color = colors.MUTED, opacity = 1, w, fontSize = 11 }: { x: number; y: number; text: string; color?: string; opacity?: number; w?: number; fontSize?: number }) {
  const width = w ?? Math.max(62, text.length * fontSize * 0.62 + 18);
  return (
    <g opacity={clamp01(opacity)}>
      <rect x={x - width / 2} y={y - 13} width={width} height={26} rx={13} fill={colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={x} y={y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={fontSize} fontFamily={MONO}>{text}</text>
    </g>
  );
}

function InterestBeam({ u, highlight, opacity = 1 }: { u: number; highlight: number; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  const x = 208 + uu * 802;
  return (
    <g opacity={uu * opacity}>
      <path d={`M208 356 C 380 246, 500 466, ${x} 356`} fill="none" stroke={colors.WARM} strokeWidth={2.5} strokeDasharray="8 8" strokeDashoffset={-uu * 80} />
      <circle cx={x} cy={356} r={14 + 7 * clamp01(highlight)} fill={colors.WARM} opacity={0.18} />
      <circle cx={x} cy={356} r={6} fill={colors.WARM} />
      <text x={x} y={332} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>review_pr</text>
    </g>
  );
}

function AnnouncementCard({ u, selected, opacity = 1 }: { u: number; selected: number; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  return (
    <g opacity={uu * opacity}>
      <rect x={846} y={140} width={374} height={112} rx={18} fill={colors.PANEL} stroke={selected > 0.2 ? colors.WARM : colors.SECONDARY} strokeWidth={selected > 0.2 ? 2.3 : 1.4} />
      <text x={1033} y={170} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={740}>ServiceAnnounce</text>
      <text x={1033} y={193} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>signed routing hint · never authorization</text>
      <Chip x={916} y={226} text="mcp" color={colors.ACCENT} w={64} />
      <Chip x={1002} y={226} text="code-reviewer" color={colors.SECONDARY} w={118} fontSize={10} />
      <Chip x={1130} y={226} text="review_pr" color={colors.WARM} w={96} fontSize={10} />
    </g>
  );
}

function ResultCard({ u, opacity = 1 }: { u: number; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  return (
    <g opacity={uu * opacity}>
      <rect x={846} y={470} width={374} height={108} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
      <text x={1033} y={502} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={720}>gossipToolRows</text>
      <text x={1033} y={532} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>mcp://code-reviewer/review_pr</text>
      <text x={1033} y={557} textAnchor="middle" fill={colors.MUTED} fontSize={10}>peer identity · service · tool name</text>
    </g>
  );
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tableU = tl.channel('tableU', 0);
  const announceU = tl.channel('announceU', 0);
  const interestU = tl.channel('interestU', 0);
  const highlightU = tl.channel('highlightU', 0);
  const fastU = tl.channel('fastU', 0);
  const fanU = tl.channel('fanU', 0);
  const catalogU = tl.channel('catalogU', 0);
  const selectedU = tl.channel('selectedU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  // BEAT 1 — announcements wait for interest.
  tl.caption({ at: 0.4, dur: 5.0, text: 'The mesh does not dump every tool into every node; it waits for a reason to look.' });
  tl.tween(tableU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(announceU, 1, { at: 1.6, dur: 1.0, ease: ease.enter });
  tl.hold(5.8, 0.4);

  // BEAT 2 — the provider's persistent announcement fills the table.
  tl.caption({ at: 6.2, dur: 5.0, text: 'A provider announces its service, its tool keys, its labels, and a hint about current load.' });
  tl.tween(announceU, 1, { at: 6.5, dur: 0.8, ease: ease.pop });
  tl.tween(tableU, 1, { at: 6.9, dur: 1.5, ease: ease.linear });
  tl.tween(cam, { x: 730, y: 330, k: 1.12 }, { at: 7.1, dur: 1.2, ease: ease.move });
  tl.hold(11.5, 0.4);

  // BEAT 3 — one key creates interest.
  tl.caption({ at: 11.9, dur: 5.0, text: 'A local search for one review tool creates a single highlighted interest key.' });
  tl.tween(interestU, 1, { at: 12.2, dur: 1.4, ease: ease.move });
  tl.tween(highlightU, 1, { at: 13.0, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: 650, y: 330, k: 1.24 }, { at: 13.2, dur: 1.2, ease: ease.move });
  tl.hold(17.3, 0.4);

  // BEAT 4 — discovery follows the key, not the whole mesh.
  tl.caption({ at: 17.7, dur: 5.1, text: 'The discovery layer subscribes only to that key, so the cost follows interest instead of mesh size.' });
  tl.tween(fastU, 1, { at: 18.0, dur: 1.0, ease: ease.enter });
  tl.tween(highlightU, 0.35, { at: 19.3, dur: 0.7, ease: ease.move });
  tl.hold(22.8, 0.4);

  // BEAT 5 — the fast path turns the announcement into a namespaced row.
  tl.caption({ at: 23.2, dur: 5.0, text: 'A fresh announcement becomes a routing hint, never the authorization decision.' });
  tl.tween(selectedU, 1, { at: 23.5, dur: 0.9, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 24.0, dur: 1.3, ease: ease.move });
  tl.tween(fastU, 1, { at: 24.5, dur: 1.1, ease: ease.linear });
  tl.hold(28.2, 0.4);

  // BEAT 6 — if gossip is empty, fetch the catalogs.
  tl.caption({ at: 28.6, dur: 5.1, text: 'When the fast path is empty, service discovery fans out and asks the candidate peers for their catalogs.' });
  tl.tween(fastU, 0.1, { at: 28.9, dur: 0.7, ease: ease.move });
  tl.tween(fanU, 1, { at: 29.5, dur: 1.8, ease: ease.linear });
  tl.tween(cam, { x: 850, y: 350, k: 1.12 }, { at: 29.7, dur: 1.2, ease: ease.move });
  tl.hold(34.1, 0.4);

  // BEAT 7 — catalog calls expand the same selected row.
  tl.caption({ at: 34.5, dur: 5.1, text: 'Each catalog call lists local services, then lists tools on the matching Model Context Protocol service.' });
  tl.tween(catalogU, 1, { at: 34.8, dur: 2.4, ease: ease.draw });
  tl.tween(selectedU, 1, { at: 36.0, dur: 0.8, ease: ease.enter });
  tl.hold(40.0, 0.4);

  // BEAT 8 — clean close on one result.
  tl.caption({ at: 40.4, dur: 4.8, text: 'The selected peer and tool survive the search; everything else can fade away.' });
  tl.tween(dimU, 1, { at: 40.8, dur: 0.9, ease: ease.move });
  tl.tween(endU, 1, { at: 41.5, dur: 0.7, ease: ease.enter });
  tl.hold(47.1, 1.0);

  return { tl, cam, tableU, announceU, interestU, highlightU, fastU, fanU, catalogU, selectedU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const mainOpacity = 1 - 0.9 * s.get(scene.dimU);
  const tableOpacity = s.get(scene.tableU);
  const fastOpacity = s.get(scene.fastU);
  const fanOpacity = s.get(scene.fanU);
  const catalogOpacity = s.get(scene.catalogU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={760}>Interest finds the tool</text>
        <text x={640} y={75} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>ServiceAnnounce · Discovery.Ensure · find_remote_tools · list_local_services</text>

        <Connection from={{ x: LOCAL.x + 84, y: LOCAL.y }} to={{ x: TABLE_ORIGIN.x - 26, y: 356 }} u={tableOpacity} flow={s.get(scene.interestU)} color={colors.ACCENT} label="interest" />
        <Connection from={{ x: TABLE_ORIGIN.x + 3 * 49 + 28, y: 356 }} to={{ x: PROVIDER.x - 96, y: PROVIDER.y }} u={tableOpacity} flow={catalogOpacity} color={colors.SECONDARY} label="provider rows" />

        <NodeBadge x={LOCAL.x} y={LOCAL.y} w={168} h={72} label="sam-node" sublabel="consumer" color={colors.ACCENT} u={tableOpacity} glow={s.get(scene.interestU)} />
        <NodeBadge x={PROVIDER.x} y={PROVIDER.y} w={192} h={72} label="provider" sublabel="remote service" color={colors.SECONDARY} u={tableOpacity} glow={s.get(scene.selectedU)} />

        <g transform={`translate(${TABLE_ORIGIN.x} ${TABLE_ORIGIN.y})`} opacity={tableOpacity}>
          <rect x={-30} y={-40} width={394} height={304} rx={20} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
          <text x={166} y={-12} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={740}>provider table</text>
          <MatrixGrid
            x={0}
            y={28}
            values={TABLE_VALUES}
            cell={40}
            gap={7}
            cellU={(i, j) => clamp01(tableOpacity * 15 - (i * 3 + j) * 0.24)}
            rowLabels={ROWS}
            colLabels={COLS}
            highlight={{ row: s.get(scene.interestU) > 0.2 ? 2 : undefined, color: colors.WARM, u: s.get(scene.highlightU) }}
            labelSize={10}
            opacity={0.95}
          />
          <text x={166} y={244} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>Provider · Keys · Load · LastSeen</text>
        </g>

        <AnnouncementCard u={s.get(scene.announceU)} selected={s.get(scene.selectedU)} />
        <ResultCard u={s.get(scene.selectedU)} />
        <InterestBeam u={s.get(scene.interestU)} highlight={s.get(scene.highlightU)} />

        <Packet from={LOCAL} to={{ x: TABLE_ORIGIN.x + 120, y: 356 }} u={s.get(scene.interestU)} color={colors.WARM} r={6} label="Ensure" />
        <RequestFlow path={[LOCAL, { x: 640, y: 356 }, PROVIDER]} u={Math.max(fastOpacity, fanOpacity)} roundTrip color={colors.WARM} responseColor={colors.POSITIVE} label={fastOpacity > 0.5 ? 'gossip' : 'catalog'} responseLabel="tool row" hold />

        <g opacity={fastOpacity}>
          <Chip x={510} y={142} text="gossipToolRows" color={colors.POSITIVE} w={132} />
          <Chip x={652} y={142} text="fast path" color={colors.POSITIVE} w={96} />
        </g>
        <g opacity={fanOpacity}>
          <Chip x={520} y={596} text="DiscoverRemoteServices" color={colors.SECONDARY} w={174} fontSize={10} />
          <Chip x={720} y={596} text="fanOutFetch" color={colors.SECONDARY} w={112} />
        </g>
        <g opacity={catalogOpacity}>
          <Chip x={940} y={618} text="fetchRemoteToolCatalogue" color={colors.POSITIVE} w={198} fontSize={10} />
        </g>
      </g>

      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={206} y={226} width={868} height={210} rx={26} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={31} fontWeight={800}>Search becomes a route</text>
          <text x={640} y={334} textAnchor="middle" fill={colors.POSITIVE} fontSize={17}>interest key · fresh hint · selected provider</text>
          <text x={640} y={378} textAnchor="middle" fill={colors.MUTED} fontSize={14}>discovery narrows the mesh before authorization begins</text>
          <text x={640} y={410} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>mcp://code-reviewer/review_pr</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
