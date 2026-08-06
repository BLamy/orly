// Initialize the Witness
//
// Backed by: slack-clone/.replay/config.json (`qa-project-id`),
// loop-qa/netlify/functions/mcp.ts (`create_project`, duplicate-target guard,
// queueJourneyTasksForProject, createExploration), and slack-clone/AGENTS.md
// (Durable Streams are authoritative for Slack workspace facts and evidence).
//
// Machine: one project seed becomes a persistent Replay QA catalog. Inputs
// converge on it, duplicate targets bounce away, journeys orbit it, and an
// initial exploration lays down a recording. A second tape then grows below
// it for the Slack app's Durable Streams history. The tapes remain visibly
// separate: correlated evidence, not one shared database.
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
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const CONFIG = { x: 90, y: 175, w: 330, h: 190 };
const PROJECT = { x: 710, y: 300 };
const EXPLORE = { x: 465, y: 488, w: 520, h: 24 };
const STREAM = { x: 120, y: 575, w: 1040 };

const CAM_CONFIG: CameraState = { x: 360, y: 275, k: 1.24 };
const CAM_PROJECT: CameraState = { x: 690, y: 285, k: 1.18 };
const CAM_CATALOG: CameraState = { x: 690, y: 340, k: 1.0 };
const CAM_SPLIT: CameraState = { x: 640, y: 405, k: 0.97 };
const CAM_CLOSE: CameraState = { x: 640, y: 350, k: 1.0 };

const RECORDING_POINTS: RecordingPoint[] = [
  { at: 0.08, kind: 'interaction', label: 'open' },
  { at: 0.24, kind: 'network' },
  { at: 0.4, kind: 'render', label: 'journey' },
  { at: 0.58, kind: 'interaction' },
  { at: 0.73, kind: 'network' },
  { at: 0.9, kind: 'render', label: 'recorded' },
];

const CATALOG_ITEMS = [
  { label: 'journeys', color: colors.WARM, angle: -150 },
  { label: 'test runs', color: colors.POSITIVE, angle: -55 },
  { label: 'explorations', color: colors.SECONDARY, angle: 35 },
  { label: 'recordings', color: colors.ACCENT, angle: 135 },
] as const;

const INPUTS = [
  { label: 'target_url', x: 1050, y: 145, color: colors.ACCENT },
  { label: 'instructions', x: 1070, y: 255, color: colors.WARM },
  { label: 'design_document', x: 1035, y: 365, color: colors.SECONDARY },
] as const;

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  configU: ChannelRef<number>;
  keyU: ChannelRef<number>;
  projectU: ChannelRef<number>;
  inputsU: ChannelRef<number>;
  duplicateU: ChannelRef<number>;
  queueU: ChannelRef<number>;
  exploreU: ChannelRef<number>;
  recordingU: ChannelRef<number>;
  catalogU: ChannelRef<number>;
  streamU: ChannelRef<number>;
  correlationU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const configU = tl.channel('configU', 0);
  const keyU = tl.channel('keyU', 0);
  const projectU = tl.channel('projectU', 0);
  const inputsU = tl.channel('inputsU', 0);
  const duplicateU = tl.channel('duplicateU', 0);
  const queueU = tl.channel('queueU', 0);
  const exploreU = tl.channel('exploreU', 0);
  const recordingU = tl.channel('recordingU', 0);
  const catalogU = tl.channel('catalogU', 0);
  const streamU = tl.channel('streamU', 0);
  const correlationU = tl.channel('correlationU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · choose one stable witness —
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'A project does not begin with a test. It begins by choosing one stable witness: the Replay QA project that every later run will return to.',
  });
  tl.tween(cam, CAM_CONFIG, { at: t - 5.9, dur: 1.4, ease: ease.move });
  tl.tween(configU, 1, { at: t - 5.4, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  // — Beat 2 · the local bookmark —
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The local Replay configuration keeps only that project identifier. It is a bookmark, not a database and not a copy of the test catalog.',
  });
  tl.tween(keyU, 1, { at: t - 5.5, dur: 1.2, ease: ease.draw });
  tl.tween(projectU, 1, { at: t - 4.6, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 3 · create-project inputs converge —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'If the project does not exist yet, the Model Context Protocol call supplies a stable target address, plus testing instructions or a design document.',
  });
  tl.tween(cam, CAM_PROJECT, { at: t - 6.5, dur: 1.4, ease: ease.move });
  tl.tween(inputsU, 3, { at: t - 5.9, dur: 5.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 4 · duplicate target bounces —
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Replay QA rejects a second project for the same target. That refusal keeps one history from splitting into two catalogs.',
  });
  tl.tween(duplicateU, 1, { at: t - 5.8, dur: 4.2, ease: ease.linear });
  t = tl.hold(t, 0.6);

  // — Beat 5 · known journeys queue —
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'When the new project is active, it queues the journeys already known for that project and wakes the workers that can run them.',
  });
  tl.tween(cam, CAM_CATALOG, { at: t - 5.5, dur: 1.4, ease: ease.move });
  tl.tween(queueU, 1, { at: t - 5.0, dur: 3.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 6 · one initial exploration —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'If the call also carries instructions or a design document, Replay QA starts one initial exploration to browse and record the application.',
  });
  tl.tween(exploreU, 1, { at: t - 6.4, dur: 1.2, ease: ease.draw });
  tl.tween(recordingU, 1, { at: t - 5.0, dur: 4.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 7 · the project becomes a catalog —
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'From then on, journeys, test runs, explorations, and recordings collect around the same project identifier.',
  });
  tl.tween(catalogU, 1, { at: t - 5.8, dur: 2.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 8 · a second authority appears —
  t = tl.caption({
    at: t,
    dur: 6.5,
    text: 'The Slack app keeps a different truth below it. Durable Streams record messages and offsets as the application’s event-sourced history.',
  });
  tl.tween(cam, CAM_SPLIT, { at: t - 6.0, dur: 1.5, ease: ease.move });
  tl.tween(streamU, 1, { at: t - 5.5, dur: 4.2, ease: ease.draw });
  t = tl.hold(t, 0.6);

  // — Beat 9 · correlated, never conflated —
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'Replay QA does not use those streams as its database. A ticket cites both layers: the recording for behavior, and stream offsets and digests for state.',
  });
  tl.tween(correlationU, 1, { at: t - 6.4, dur: 2.0, ease: ease.draw });
  t = tl.hold(t, 0.6);

  // — Beat 10 · close —
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Initialize those two anchors once, and every later builder and critic returns to the same witness instead of inventing a new one.',
  });
  tl.tween(cam, CAM_CLOSE, { at: t - 6.1, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: t - 5.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.5, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return {
    tl,
    cam,
    configU,
    keyU,
    projectU,
    inputsU,
    duplicateU,
    queueU,
    exploreU,
    recordingU,
    catalogU,
    streamU,
    correlationU,
    dimU,
    closeU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */
function ConfigCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${CONFIG.x}, ${CONFIG.y + (1 - uu) * 14})`} opacity={uu}>
      <rect width={CONFIG.w} height={CONFIG.h} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
      <rect x={0} y={0} width={CONFIG.w} height={38} rx={14} fill={colors.ACCENT} opacity={0.09} />
      <text x={18} y={25} fill={colors.TEXT} fontSize={13} fontFamily={MONO} fontWeight={700}>
        .replay/config.json
      </text>
      <text x={22} y={76} fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
        {'{'}
      </text>
      <text x={42} y={108} fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>
        &quot;qa-project-id&quot;
      </text>
      <text x={184} y={108} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
        :
      </text>
      <text x={202} y={108} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
        &quot;proj-slack…&quot;
      </text>
      <text x={22} y={140} fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
        {'}'}
      </text>
      <text x={18} y={171} fill={colors.MUTED} fontSize={11.5}>
        one bookmark into the Replay QA catalog
      </text>
    </g>
  );
}

function InputFlights({ u, dim }: { u: number; dim: number }) {
  return (
    <g opacity={1 - 0.8 * dim}>
      {INPUTS.map((item, i) => {
        const p = clamp01(u - i);
        if (p <= 0 || p >= 1) return null;
        const q = ease.move(p);
        const x = item.x + (PROJECT.x - item.x) * q;
        const y = item.y + (PROJECT.y - item.y) * q;
        const w = item.label.length * 8 + 24;
        return (
          <g key={item.label} transform={`translate(${x}, ${y})`} opacity={Math.min(1, p * 5, (1 - p) * 5)}>
            <rect x={-w / 2} y={-15} width={w} height={30} rx={15} fill={colors.PANEL} stroke={item.color} strokeWidth={1.5} />
            <text y={5} textAnchor="middle" fill={item.color} fontSize={12} fontFamily={MONO}>
              {item.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ProjectMachine({
  u,
  queue,
  catalog,
  duplicate,
  dim,
}: {
  u: number;
  queue: number;
  catalog: number;
  duplicate: number;
  dim: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const du = clamp01(duplicate);
  const incoming = du < 0.56 ? du / 0.56 : 1 - (du - 0.56) / 0.44;
  const bounce = clamp01(incoming);
  const dx = 1050 + (PROJECT.x + 112 - 1050) * ease.move(bounce);
  const glow = du > 0.43 && du < 0.75 ? Math.sin(((du - 0.43) / 0.32) * Math.PI) : 0;

  return (
    <g opacity={1 - 0.82 * dim}>
      <g transform={`translate(${PROJECT.x}, ${PROJECT.y}) scale(${0.82 + uu * 0.18})`} opacity={uu}>
        <circle r={145} fill="none" stroke={colors.GRID} strokeWidth={1.2} strokeDasharray="3 8" />
        <circle r={92} fill={colors.PANEL} stroke={glow > 0 ? colors.NEGATIVE : colors.ACCENT} strokeWidth={2 + glow * 2} />
        <circle r={72} fill="none" stroke={colors.ACCENT} strokeWidth={1.2} opacity={0.25 + 0.45 * catalog} />
        <text y={-20} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
          LOOPQA PROJECT
        </text>
        <text y={8} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={700}>
          Slack Clone
        </text>
        <text y={31} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
          qa-project-id
        </text>
        <text y={52} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
          target_url fingerprint
        </text>

        {CATALOG_ITEMS.map((item, i) => {
          const reveal = clamp01((Math.max(queue * 0.55, catalog) * 4.8) - i * 0.9);
          if (reveal <= 0) return null;
          const a = (item.angle * Math.PI) / 180;
          const x = Math.cos(a) * 145;
          const y = Math.sin(a) * 145;
          return (
            <g key={item.label} transform={`translate(${x}, ${y + (1 - reveal) * 10})`} opacity={reveal}>
              <circle r={28} fill={colors.PANEL} stroke={item.color} strokeWidth={1.6} />
              <text y={4} textAnchor="middle" fill={item.color} fontSize={10.5} fontWeight={700}>
                {item.label}
              </text>
            </g>
          );
        })}
      </g>

      {du > 0 && du < 1 && (
        <g transform={`translate(${dx}, ${PROJECT.y - 92})`} opacity={Math.min(1, du * 5, (1 - du) * 5)}>
          <rect x={-78} y={-17} width={156} height={34} rx={17} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.6} />
          <text y={5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
            same target_url
          </text>
        </g>
      )}
      {glow > 0.2 && (
        <g transform={`translate(${PROJECT.x + 192}, ${PROJECT.y - 95})`} opacity={glow}>
          <rect x={-116} y={-22} width={232} height={44} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} />
          <text y={5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
            duplicate refused · reuse existing ID
          </text>
        </g>
      )}
    </g>
  );
}

function ConfigKey({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const x1 = CONFIG.x + CONFIG.w;
  const y1 = CONFIG.y + 102;
  const x2 = PROJECT.x - 90;
  const y2 = PROJECT.y;
  return (
    <g opacity={(1 - 0.8 * dim) * uu}>
      <path
        d={`M ${x1} ${y1} C ${x1 + 90} ${y1}, ${x2 - 80} ${y2}, ${x1 + (x2 - x1) * uu} ${y1 + (y2 - y1) * uu}`}
        fill="none"
        stroke={colors.ACCENT}
        strokeWidth={2}
        strokeDasharray="5 6"
      />
      {uu > 0.85 && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 14} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5} fontFamily={MONO}>
          stable project key
        </text>
      )}
    </g>
  );
}

function StreamLedger({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const entries = [
    { at: 0.18, label: 'offset 128 · message.appended' },
    { at: 0.48, label: 'offset 129 · agent.invoked' },
    { at: 0.78, label: 'offset 130 · agent.replied' },
  ];
  return (
    <g opacity={(1 - 0.38 * dim) * uu}>
      <text x={STREAM.x} y={STREAM.y - 18} fill={colors.TEAL} fontSize={12.5} fontWeight={700}>
        Slack app authority · Durable Streams
      </text>
      <line
        x1={STREAM.x}
        y1={STREAM.y}
        x2={STREAM.x + STREAM.w * uu}
        y2={STREAM.y}
        stroke={colors.TEAL}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {entries.map((entry, i) => {
        const e = clamp01((uu - entry.at) * 7);
        if (e <= 0) return null;
        const x = STREAM.x + STREAM.w * entry.at;
        return (
          <g key={entry.label} opacity={e} transform={`translate(${x}, ${STREAM.y})`}>
            <circle r={7} fill={colors.TEAL} />
            <text y={27 + (i % 2) * 14} textAnchor="middle" fill={colors.MUTED} fontSize={9.8} fontFamily={MONO}>
              {entry.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${328 + (1 - uu) * 14})`} opacity={uu}>
      <rect x={-355} y={-92} width={710} height={184} rx={18} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.7} />
      <text y={-43} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={750}>
        Initialize one witness. Preserve two truths.
      </text>
      <text y={-3} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
        qa-project-id → Replay QA catalog + deterministic recording
      </text>
      <text y={29} textAnchor="middle" fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
        stream offsets + digests → Slack event-sourced state
      </text>
      <text y={62} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
        correlated in ticket evidence · never conflated as one database
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const correlation = clamp01(s.get(scene.correlationU));
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <ConfigCard u={s.get(scene.configU) * (1 - 0.8 * dim)} />
        <ConfigKey u={s.get(scene.keyU)} dim={dim} />
        <InputFlights u={s.get(scene.inputsU)} dim={dim} />
        <ProjectMachine
          u={s.get(scene.projectU)}
          queue={s.get(scene.queueU)}
          catalog={s.get(scene.catalogU)}
          duplicate={s.get(scene.duplicateU)}
          dim={dim}
        />

        <g opacity={1 - 0.82 * dim}>
          <RecordingStrip
            x={EXPLORE.x}
            y={EXPLORE.y}
            w={EXPLORE.w}
            h={EXPLORE.h}
            points={RECORDING_POINTS}
            reveal={s.get(scene.exploreU)}
            u={s.get(scene.recordingU)}
            title="initial exploration · Replay recording"
          />
          {s.get(scene.queueU) > 0 && (
            <text x={PROJECT.x} y={448} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO} opacity={s.get(scene.queueU)}>
              queueJourneyTasksForProject() · triggerSpawnForProject()
            </text>
          )}
        </g>

        <StreamLedger u={s.get(scene.streamU)} dim={dim} />
        {correlation > 0 && (
          <g opacity={correlation * (1 - 0.75 * dim)}>
            <line
              x1={PROJECT.x - 45}
              y1={EXPLORE.y + 33}
              x2={PROJECT.x - 45}
              y2={STREAM.y - 28}
              stroke={colors.WARM}
              strokeWidth={1.6}
              strokeDasharray="3 5"
            />
            <rect x={PROJECT.x - 153} y={526} width={216} height={30} rx={15} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
            <text x={PROJECT.x - 45} y={546} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
              ticket evidence correlates both
            </text>
          </g>
        )}
        <ClosingCard u={s.get(scene.closeU)} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
