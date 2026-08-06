// The Catalog Remembers
//
// Backed by: Loop QA's persistent explorations, journey_versions, and
// test_runs records; journey creation/update scheduling a recorded run for
// the exact saved version; and the current exploration entry points in the
// product UI, REST surface, project chat, and local Replay QA MCP UI.
//
// Machine: one exploratory trail becomes a crystalline catalog without
// losing its origin. The same discovery beads reorganize into immutable
// journey-version rows. Every new version grows a linked test-run record and
// recording ID, while the exploration recording remains a distinct account
// of where the journey came from.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

interface Point {
  x: number;
  y: number;
}

const lerpPoint = (a: Point, b: Point, u: number): Point => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u,
});

/* ---------------------------------------------------------------- data */
const EXPLORATION_POINTS: RecordingPoint[] = [
  { at: 0.06, kind: 'interaction', label: 'open' },
  { at: 0.2, kind: 'network' },
  { at: 0.36, kind: 'render', label: 'message' },
  { at: 0.53, kind: 'interaction', label: 'mention' },
  { at: 0.7, kind: 'network' },
  { at: 0.88, kind: 'render', label: 'thread' },
];

const RUN_POINTS: RecordingPoint[] = [
  { at: 0.08, kind: 'interaction', label: 'open' },
  { at: 0.28, kind: 'interaction', label: 'send' },
  { at: 0.48, kind: 'network' },
  { at: 0.68, kind: 'render', label: 'posted' },
  { at: 0.9, kind: 'render', label: 'assert' },
];

const TRAIL_POINTS: Point[] = [
  { x: 118, y: 354 },
  { x: 196, y: 282 },
  { x: 282, y: 390 },
  { x: 370, y: 252 },
  { x: 458, y: 338 },
  { x: 546, y: 232 },
  { x: 636, y: 320 },
  { x: 724, y: 245 },
  { x: 812, y: 346 },
  { x: 900, y: 258 },
  { x: 988, y: 368 },
  { x: 1072, y: 290 },
];

const CATALOG_POINTS: Point[] = Array.from({ length: 12 }, (_, i) => ({
  x: 352 + (i % 4) * 68,
  y: 218 + Math.floor(i / 4) * 140,
}));

const DISCOVERIES = [
  { index: 1, label: 'send a message' },
  { index: 4, label: 'mention an agent' },
  { index: 7, label: 'reply in thread' },
  { index: 10, label: 'edit safely' },
] as const;

const JOURNEYS = [
  { id: 'journey_12', label: 'send-message', y: 162 },
  { id: 'journey_19', label: 'mention-agent', y: 302 },
  { id: 'journey_24', label: 'edit-message', y: 442 },
] as const;

const RUNS = [
  { id: 'run_104', version: 'send-message@v1', recording: 'rec_run_104', source: 0, y: 154 },
  { id: 'run_109', version: 'mention-agent@v1', recording: 'rec_run_109', source: 1, y: 246 },
  { id: 'run_113', version: 'edit-message@v1', recording: 'rec_run_113', source: 2, y: 338 },
  { id: 'run_117', version: 'send-message@v2', recording: 'rec_run_117', source: 0, y: 430 },
] as const;

const ENTRY_POINTS = ['Replay QA UI', 'REST', 'project chat', 'local Replay QA MCP UI'] as const;

const CAM_TRAIL: CameraState = { x: 640, y: 320, k: 1.08 };
const CAM_CATALOG: CameraState = { x: 640, y: 340, k: 0.97 };
const CAM_RUNS: CameraState = { x: 780, y: 342, k: 1.08 };
const CAM_HISTORY: CameraState = { x: 640, y: 340, k: 1.0 };
const CAM_ENTRY: CameraState = { x: 640, y: 315, k: 1.04 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const explorationU = tl.channel('explorationU', 0);
  const explorationSweep = tl.channel('explorationSweep', 0);
  const trailU = tl.channel('trailU', 0);
  const discoveriesU = tl.channel('discoveriesU', 0);
  const notCertifiedU = tl.channel('notCertifiedU', 0);
  const crystalU = tl.channel('crystalU', 0);
  const catalogU = tl.channel('catalogU', 0);
  const versionsU = tl.channel('versionsU', 0);
  const scheduleU = tl.channel('scheduleU', 0);
  const runsU = tl.channel('runsU', 0);
  const runTapeU = tl.channel('runTapeU', 0);
  const runSweep = tl.channel('runSweep', 0);
  const provenanceU = tl.channel('provenanceU', 0);
  const updateU = tl.channel('updateU', 0);
  const entryDim = tl.channel('entryDim', 0);
  const entryU = tl.channel('entryU', 0);
  const publicBoundaryU = tl.channel('publicBoundaryU', 0);
  const closeDim = tl.channel('closeDim', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · exploration leaves a trail —
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.5,
    text: 'An exploration is reconnaissance. It roams the product, tries useful behavior, and leaves a fixed recording of what it discovered.',
  });
  tl.tween(cam, CAM_TRAIL, { at: t - 6.0, dur: 1.4, ease: ease.move });
  tl.tween(explorationU, 1, { at: t - 5.7, dur: 1.4, ease: ease.draw });
  tl.tween(explorationSweep, 1, { at: t - 5.1, dur: 4.5, ease: ease.linear });
  tl.tween(trailU, 1, { at: t - 4.9, dur: 3.8, ease: ease.draw });
  tl.tween(discoveriesU, 1, { at: t - 3.7, dur: 2.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  // — Beat 2 · discovery is not certification —
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'That exploration can discover a regression test, but it does not certify one. Its recording explains the origin of an idea, not repeatable execution of a contract.',
  });
  tl.tween(notCertifiedU, 1, { at: t - 5.4, dur: 0.65, ease: ease.pop });
  t = tl.hold(t, 0.6);

  // — Beat 3 · findings crystallize into persistent journeys —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Useful findings crystallize into persistent journeys. An exploration may create a journey or improve one that already exists, without discarding its earlier shape.',
  });
  tl.tween(notCertifiedU, 0, { at: t - 6.5, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_CATALOG, { at: t - 6.2, dur: 1.5, ease: ease.move });
  tl.tween(crystalU, 1, { at: t - 5.8, dur: 3.2, ease: ease.move });
  tl.tween(catalogU, 3, { at: t - 3.5, dur: 2.3, ease: ease.enter });
  t = tl.hold(t, 0.6);

  // — Beat 4 · versions accumulate —
  t = tl.caption({
    at: t,
    dur: 6.5,
    text: 'Every saved shape becomes a durable row in journey versions. Version one remains addressable after version two arrives, because history is part of the test.',
  });
  tl.tween(versionsU, 3, { at: t - 5.8, dur: 2.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 5 · exact-version run is automatic —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Creating or updating a journey automatically schedules a recorded test run for that exact version. The catalog links the specification it ran to the recording it produced.',
  });
  tl.tween(cam, CAM_RUNS, { at: t - 6.5, dur: 1.4, ease: ease.move });
  tl.tween(scheduleU, 3, { at: t - 5.8, dur: 4.4, ease: ease.linear });
  tl.tween(runsU, 3, { at: t - 5.4, dur: 4.0, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 6 · origin recording versus proof recording —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Now there are two honest recordings. The exploration recording explains where the journey came from; the journey run recording proves that exact saved version executed.',
  });
  tl.tween(cam, CAM_HISTORY, { at: t - 6.5, dur: 1.4, ease: ease.move });
  tl.tween(runTapeU, 1, { at: t - 5.8, dur: 1.3, ease: ease.draw });
  tl.tween(runSweep, 1, { at: t - 4.9, dur: 4.0, ease: ease.linear });
  tl.tween(provenanceU, 1, { at: t - 3.6, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 7 · an update appends; it does not replace —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'When send message gains version two, version one and its run stay put. A new test run and replay recording identifier append beside them.',
  });
  tl.tween(updateU, 1, { at: t - 5.9, dur: 0.7, ease: ease.pop });
  tl.tween(scheduleU, 4, { at: t - 5.0, dur: 2.8, ease: ease.linear });
  tl.tween(runsU, 4, { at: t - 4.8, dur: 2.5, ease: ease.enter });
  t = tl.hold(t, 0.6);

  // — Beat 8 · where later explorations begin —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Later explorations currently begin through the Replay QA interface, its application programming interface, project chat, or the local Replay QA Model Context Protocol interface.',
  });
  tl.tween(cam, CAM_ENTRY, { at: t - 6.5, dur: 1.4, ease: ease.move });
  tl.tween(entryDim, 1, { at: t - 6.0, dur: 1.0, ease: ease.move });
  tl.tween(entryU, 1, { at: t - 5.0, dur: 3.3, ease: ease.draw });
  t = tl.hold(t, 0.5);

  // — Beat 9 · public MCP boundary —
  t = tl.caption({
    at: t,
    dur: 6.5,
    text: 'The public Loop QA Model Context Protocol tool list currently inspects this catalog. It is not the public start-exploration button, so the boundary should stay explicit.',
  });
  tl.tween(publicBoundaryU, 1, { at: t - 5.7, dur: 0.75, ease: ease.pop });
  t = tl.hold(t, 0.6);

  // — Beat 10 · close —
  t = tl.caption({
    at: t,
    dur: 6.5,
    text: 'The catalog remembers discovery, every journey version, and every run. That growing history turns today’s exploration into tomorrow’s regression evidence.',
  });
  tl.tween(closeDim, 1, { at: t - 5.9, dur: 1.1, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.8, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.2);

  return {
    tl,
    cam,
    explorationU,
    explorationSweep,
    trailU,
    discoveriesU,
    notCertifiedU,
    crystalU,
    catalogU,
    versionsU,
    scheduleU,
    runsU,
    runTapeU,
    runSweep,
    provenanceU,
    updateU,
    entryDim,
    entryU,
    publicBoundaryU,
    closeDim,
    closeU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */
function ExplorationTape({ reveal, sweep, crystal, dim }: { reveal: number; sweep: number; crystal: number; dim: number }) {
  const c = clamp01(crystal);
  const x = 140 + (96 - 140) * c;
  const y = 94 + (74 - 94) * c;
  const w = 1000 + (548 - 1000) * c;
  return (
    <g opacity={1 - 0.76 * dim}>
      <RecordingStrip
        x={x}
        y={y}
        w={w}
        h={24}
        points={EXPLORATION_POINTS}
        reveal={reveal}
        u={sweep}
        title="explorations · exp_027 · replay_recording_id = rec_origin_027"
      />
    </g>
  );
}

function MemoryRibbon({ reveal, discoveries, crystal, dim }: { reveal: number; discoveries: number; crystal: number; dim: number }) {
  const r = clamp01(reveal);
  const c = clamp01(crystal);
  if (r <= 0) return null;
  const points = TRAIL_POINTS.map((point, i) => lerpPoint(point, CATALOG_POINTS[i], c));
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <g opacity={1 - 0.78 * dim}>
      <polyline
        points={line}
        fill="none"
        stroke={c > 0.55 ? colors.SECONDARY : colors.ACCENT}
        strokeWidth={2.2}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - r}
        opacity={0.5 + 0.35 * c}
      />
      {points.map((point, i) => {
        const u = clamp01(r * 1.8 - i * 0.065);
        if (u <= 0) return null;
        const size = 5 + 2.5 * c;
        return (
          <g key={i} transform={`translate(${point.x}, ${point.y}) scale(${0.72 + 0.28 * u})`} opacity={u}>
            <circle r={7 + 4 * (1 - c)} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.2} opacity={1 - c} />
            <rect
              x={-size}
              y={-size}
              width={size * 2}
              height={size * 2}
              rx={1.5}
              fill={i % 4 === 0 ? colors.WARM : colors.SECONDARY}
              stroke={colors.TEXT}
              strokeWidth={0.8}
              transform={`rotate(${45 * c})`}
              opacity={0.3 + 0.7 * c}
            />
          </g>
        );
      })}
      {DISCOVERIES.map((item, i) => {
        const u = clamp01(discoveries * 4.4 - i * 0.9) * (1 - c);
        if (u <= 0) return null;
        const point = points[item.index];
        const w = item.label.length * 7 + 22;
        return (
          <g key={item.label} transform={`translate(${point.x}, ${point.y + 30 + (1 - u) * 8})`} opacity={u}>
            <rect x={-w / 2} y={-13} width={w} height={26} rx={13} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.1} />
            <text y={4} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>
              {item.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function NotCertified({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${520 + (1 - uu) * 10}) scale(${0.9 + uu * 0.1})`} opacity={uu}>
      <rect x={-250} y={-31} width={500} height={62} rx={13} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={2} />
      <text y={-5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO} fontWeight={800} letterSpacing={1.1}>
        EXPLORATION DISCOVERS · IT DOES NOT CERTIFY
      </text>
      <text y={18} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
        origin recording ≠ repeatable journey-run proof
      </text>
    </g>
  );
}

function JourneyCatalog({ catalog, versions, update, dim }: { catalog: number; versions: number; update: number; dim: number }) {
  const headU = clamp01(catalog * 2);
  if (headU <= 0) return null;
  return (
    <g opacity={1 - 0.78 * dim}>
      <text x={90} y={140} fill={colors.SECONDARY} fontSize={12.5} fontFamily={MONO} fontWeight={800} opacity={headU}>
        journey_versions
      </text>
      <text x={628} y={140} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={headU}>
        immutable saved specifications
      </text>
      {JOURNEYS.map((journey, i) => {
        const u = clamp01(catalog - i);
        const vu = clamp01(versions - i);
        if (u <= 0) return null;
        return (
          <g key={journey.id} transform={`translate(88, ${journey.y + (1 - u) * 12})`} opacity={u}>
            <rect width={558} height={112} rx={13} fill={colors.PANEL} stroke={i === 0 && update > 0 ? colors.WARM : colors.GRID} strokeWidth={1.4 + (i === 0 ? update : 0)} />
            <text x={18} y={28} fill={colors.TEXT} fontSize={14} fontWeight={750}>
              {journey.label}
            </text>
            <text x={18} y={49} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              {journey.id}
            </text>
            <g transform={`translate(188, 34) scale(${0.82 + 0.18 * vu})`} opacity={vu}>
              <rect x={-25} y={-14} width={50} height={28} rx={14} fill={colors.ACCENT} opacity={0.15} />
              <rect x={-25} y={-14} width={50} height={28} rx={14} fill="none" stroke={colors.ACCENT} strokeWidth={1.2} />
              <text y={4} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO} fontWeight={700}>
                v1
              </text>
            </g>
            {i === 0 && update > 0 && (
              <g transform={`translate(250, 34) scale(${0.78 + 0.22 * update})`} opacity={update}>
                <rect x={-25} y={-14} width={50} height={28} rx={14} fill={colors.WARM} opacity={0.15} />
                <rect x={-25} y={-14} width={50} height={28} rx={14} fill="none" stroke={colors.WARM} strokeWidth={1.4} />
                <text y={4} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={MONO} fontWeight={800}>
                  v2
                </text>
                <text x={45} y={4} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                  appended · v1 retained
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

function cubicPoint(a: Point, b: Point, u: number): Point {
  const c1 = { x: a.x + 62, y: a.y };
  const c2 = { x: b.x - 62, y: b.y };
  const v = 1 - u;
  return {
    x: v * v * v * a.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * b.x,
    y: v * v * v * a.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * b.y,
  };
}

function ScheduleLinks({ u, dim }: { u: number; dim: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={1 - 0.8 * dim}>
      <g transform="translate(714, 126)" opacity={clamp01(u * 2)}>
        <rect x={-70} y={-13} width={140} height={26} rx={13} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.1} />
        <text y={4} textAnchor="middle" fill={colors.WARM} fontSize={9.7} fontFamily={MONO}>
          auto-schedule exact version
        </text>
      </g>
      {RUNS.map((run, i) => {
        const p = clamp01(u - i);
        if (p <= 0) return null;
        const from = { x: 646, y: JOURNEYS[run.source].y + 56 };
        const to = { x: 782, y: run.y + 34 };
        const d = `M ${from.x} ${from.y} C ${from.x + 62} ${from.y}, ${to.x - 62} ${to.y}, ${to.x} ${to.y}`;
        const dot = cubicPoint(from, to, ease.move(p));
        return (
          <g key={run.id}>
            <path d={d} fill="none" stroke={colors.WARM} strokeWidth={1.4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.65} />
            {p < 0.98 && <circle cx={dot.x} cy={dot.y} r={5.5} fill={colors.WARM} opacity={Math.min(1, p * 5)} />}
          </g>
        );
      })}
    </g>
  );
}

function TestRunCatalog({ u, dim }: { u: number; dim: number }) {
  const headU = clamp01(u * 2);
  if (headU <= 0) return null;
  return (
    <g opacity={1 - 0.78 * dim}>
      <text x={784} y={126} fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO} fontWeight={800} opacity={headU}>
        test_runs
      </text>
      {RUNS.map((run, i) => {
        const p = clamp01(u - i);
        if (p <= 0) return null;
        return (
          <g key={run.id} transform={`translate(782, ${run.y + (1 - p) * 10}) scale(${0.96 + 0.04 * p})`} opacity={p}>
            <rect width={410} height={68} rx={11} fill={colors.PANEL} stroke={i === 3 ? colors.WARM : colors.POSITIVE} strokeWidth={1.3} />
            <text x={15} y={24} fill={i === 3 ? colors.WARM : colors.POSITIVE} fontSize={11.2} fontFamily={MONO} fontWeight={750}>
              {run.id} · {run.version}
            </text>
            <text x={15} y={48} fill={colors.MUTED} fontSize={10.2} fontFamily={MONO}>
              replay_recording_id · {run.recording}
            </text>
            <rect x={330} y={20} width={62} height={24} rx={12} fill={colors.POSITIVE} opacity={0.12} />
            <text x={361} y={36} textAnchor="middle" fill={colors.POSITIVE} fontSize={9.5} fontFamily={MONO}>
              recorded
            </text>
          </g>
        );
      })}
    </g>
  );
}

function RunTape({ reveal, sweep, provenance, dim }: { reveal: number; sweep: number; provenance: number; dim: number }) {
  if (reveal <= 0) return null;
  return (
    <g opacity={1 - 0.78 * dim}>
      <RecordingStrip
        x={784}
        y={548}
        w={408}
        h={22}
        points={RUN_POINTS}
        reveal={reveal}
        u={sweep}
        title="journey run · send-message@v1 · execution proof"
      />
      {provenance > 0 && (
        <g transform={`translate(650, 92) scale(${0.9 + 0.1 * provenance})`} opacity={provenance}>
          <rect x={-87} y={-14} width={174} height={28} rx={14} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.2} />
          <text y={4} textAnchor="middle" fill={colors.ACCENT} fontSize={10} fontFamily={MONO}>
            origin, not certification
          </text>
        </g>
      )}
    </g>
  );
}

function ExplorationEntrypoints({ u, boundary, dim }: { u: number; boundary: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const target = { x: 640, y: 420 };
  return (
    <g opacity={1 - 0.9 * dim}>
      <rect x={142} y={132} width={996} height={430} rx={20} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} opacity={0.97} />
      <text x={640} y={174} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={750}>
        How a later exploration starts today
      </text>
      {ENTRY_POINTS.map((label, i) => {
        const p = clamp01(uu * 4.5 - i * 0.85);
        if (p <= 0) return null;
        const x = 260 + i * 252;
        const w = Math.max(128, label.length * 7.1 + 28);
        const from = { x, y: 256 };
        const path = `M ${from.x} ${from.y + 18} C ${from.x} 330, ${target.x} 338, ${target.x} ${target.y - 27}`;
        return (
          <g key={label}>
            <path d={path} fill="none" stroke={colors.SECONDARY} strokeWidth={1.4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.55} />
            <g transform={`translate(${x}, ${256 + (1 - p) * -9})`} opacity={p}>
              <rect x={-w / 2} y={-18} width={w} height={36} rx={18} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.3} />
              <text y={4.5} textAnchor="middle" fill={colors.TEXT} fontSize={11.2} fontFamily={MONO}>
                {label}
              </text>
            </g>
          </g>
        );
      })}
      <g transform={`translate(${target.x}, ${target.y}) scale(${0.82 + 0.18 * uu})`} opacity={uu}>
        <rect x={-112} y={-27} width={224} height={54} rx={27} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
        <text y={5} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={MONO} fontWeight={800}>
          explorations
        </text>
      </g>
      {boundary > 0 && (
        <g transform={`translate(640, ${507 + (1 - boundary) * 10})`} opacity={boundary}>
          <rect x={-364} y={-30} width={728} height={60} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
          <text y={-6} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={MONO} fontWeight={750}>
            public LoopQA MCP tool list → inspect the catalog
          </text>
          <text y={17} textAnchor="middle" fill={colors.MUTED} fontSize={11.2} fontFamily={MONO}>
            start exploration → UI / REST / project chat / local Replay QA MCP UI
          </text>
        </g>
      )}
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${330 + (1 - uu) * 14})`} opacity={uu}>
      <rect x={-390} y={-112} width={780} height={224} rx={20} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.8} />
      <text y={-58} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={780}>
        The Catalog Remembers
      </text>
      <text y={-13} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontFamily={MONO}>
        explorations → where the journey came from
      </text>
      <text y={22} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO}>
        journey_versions + test_runs → what exact contract executed
      </text>
      <text y={61} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700}>
        every version stays · every recording remains addressable
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const entryDim = clamp01(s.get(scene.entryDim));
  const closeDim = clamp01(s.get(scene.closeDim));
  const machineDim = Math.max(entryDim, closeDim);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={1 - 0.92 * closeDim}>
          <JourneyCatalog
            catalog={s.get(scene.catalogU)}
            versions={s.get(scene.versionsU)}
            update={s.get(scene.updateU)}
            dim={entryDim}
          />
          <ScheduleLinks u={s.get(scene.scheduleU)} dim={entryDim} />
          <TestRunCatalog u={s.get(scene.runsU)} dim={entryDim} />
          <MemoryRibbon
            reveal={s.get(scene.trailU)}
            discoveries={s.get(scene.discoveriesU)}
            crystal={s.get(scene.crystalU)}
            dim={entryDim}
          />
          <ExplorationTape
            reveal={s.get(scene.explorationU)}
            sweep={s.get(scene.explorationSweep)}
            crystal={s.get(scene.crystalU)}
            dim={entryDim}
          />
          <RunTape
            reveal={s.get(scene.runTapeU)}
            sweep={s.get(scene.runSweep)}
            provenance={s.get(scene.provenanceU)}
            dim={entryDim}
          />
          <NotCertified u={s.get(scene.notCertifiedU) * (1 - machineDim)} />
          <ExplorationEntrypoints
            u={s.get(scene.entryU)}
            boundary={s.get(scene.publicBoundaryU)}
            dim={closeDim}
          />
        </g>
        <ClosingCard u={s.get(scene.closeU)} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
