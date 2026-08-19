// Chapter 2 — One event, many views
//
// Centerpiece: validation and append happen once. The same event then feeds a
// projection, an audit trail, and a replay digest. The views can differ; the
// source event cannot.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  ArchitectureCard,
  ArchitectureEdge,
  ArchitectureFrame,
  ArchitectureGrid,
} from '@brett_lamy/viz-engine';

const PAPER = '#f7f7f3';
const INK = '#2b2c2a';
const MUTED = '#858780';
const BLUE = '#5b86e5';
const GREEN = '#45a56f';
const CORAL = '#ef775d';
const VIOLET = '#7d83cc';
const AMBER = '#d19b42';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const DOOR = { x: 185, y: 330 } as const;
const VALIDATOR = { x: 405, y: 330 } as const;
const STREAM = { x: 665, y: 330 } as const;
const PROJECTION = { x: 1035, y: 190 } as const;
const AUDIT = { x: 1035, y: 330 } as const;
const REPLAY = { x: 1035, y: 470 } as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const frameU = tl.channel('frameU', 0);
  const eventU = tl.channel('eventU', 0);
  const validateU = tl.channel('validateU', 0);
  const appendU = tl.channel('appendU', 0);
  const fanU = tl.channel('fanU', 0);
  const projectionU = tl.channel('projectionU', 0);
  const auditU = tl.channel('auditU', 0);
  const replayU = tl.channel('replayU', 0);
  const changeU = tl.channel('changeU', 0);
  const digestU = tl.channel('digestU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Once the stream is authoritative, every mutation has one path. It enters through a dispatch door, where the system can name it before anyone renders it.',
  });
  tl.tween(frameU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(eventU, 1, { at: 1.3, dur: 1.0, ease: ease.pop });
  tl.tween(validateU, 1, { at: 2.6, dur: 1.1, ease: ease.draw });

  tl.caption({
    at: 7.2,
    dur: 6.4,
    text: 'Validation is not a second source of truth. It is a gate: accept the event, or reject it before it enters the durable history.',
  });
  tl.tween(cam, { x: 350, y: 325, k: 1.3 }, { at: 7.4, dur: 1.2, ease: ease.move });
  tl.tween(appendU, 1, { at: 8.2, dur: 1.2, ease: ease.draw });

  tl.caption({
    at: 14.3,
    dur: 6.4,
    text: 'After acceptance, the event is appended once. The offset and canonical bytes are now the durable record; the rest of the machine reads that record.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 14.5, dur: 1.1, ease: ease.move });
  tl.tween(fanU, 1, { at: 15.5, dur: 1.6, ease: ease.draw });

  tl.caption({
    at: 21.5,
    dur: 8.0,
    text: 'One projection turns the event into the current screen. Another keeps a human-readable audit trail. A third can replay the same log into a fresh state.',
  });
  tl.tween(projectionU, 1, { at: 22.2, dur: 1.4, ease: ease.enter });
  tl.tween(auditU, 1, { at: 23.0, dur: 1.4, ease: ease.enter });
  tl.tween(replayU, 1, { at: 23.8, dur: 1.4, ease: ease.enter });

  tl.caption({
    at: 29.0,
    dur: 6.4,
    text: 'The projections are allowed to be shaped differently because they are disposable views. If one is deleted, the stream still contains the events needed to rebuild it.',
  });
  tl.tween(cam, { x: 850, y: 335, k: 1.08 }, { at: 29.2, dur: 1.2, ease: ease.move });
  tl.tween(changeU, 1, { at: 31.0, dur: 1.0, ease: ease.pop });

  tl.caption({
    at: 36.0,
    dur: 6.8,
    text: 'Replay is more than recovery. It is a test of the contract: the same canonical events reduced twice should produce the same state digest.',
  });
  tl.tween(digestU, 1, { at: 37.0, dur: 1.2, ease: ease.pop });

  tl.caption({
    at: 43.4,
    dur: 7.2,
    text: 'That gives the product a useful shape: append once, derive many times, and prove the derivation. Evidence is not a screenshot of a result; it is the history that produced it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 43.6, dur: 1.3, ease: ease.move });
  tl.tween(closeU, 1, { at: 45.0, dur: 1.0, ease: ease.pop });
  tl.hold(52.0, 1.2);

  return { tl, cam, frameU, eventU, validateU, appendU, fanU, projectionU, auditU, replayU, changeU, digestU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const frameU = s.get(scene.frameU);
  const eventU = s.get(scene.eventU);
  const validateU = s.get(scene.validateU);
  const appendU = s.get(scene.appendU);
  const fanU = s.get(scene.fanU);
  const projectionU = s.get(scene.projectionU);
  const auditU = s.get(scene.auditU);
  const replayU = s.get(scene.replayU);
  const changeU = s.get(scene.changeU);
  const digestU = s.get(scene.digestU);
  const closeU = s.get(scene.closeU);
  const protocolPulse = 0.5 + 0.5 * Math.sin(s.t * 2.4);
  const eventCells = [
    { label: 'evt-41', tone: 'blue' as const, active: 4, status: 'ready' as const },
    { label: 'evt-42', tone: changeU > 0.3 ? 'coral' as const : 'blue' as const, active: changeU > 0.3 ? 4 : 3, status: changeU > 0.3 ? 'hot' as const : 'ready' as const },
    { label: 'evt-43', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: 'evt-44', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: 'evt-45', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: 'evt-46', tone: 'neutral' as const, active: 0, status: 'idle' as const },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={PAPER} />
      <Camera {...cam}>
        <ArchitectureFrame
          x={58}
          y={44}
          w={1164}
          h={632}
          label="one event / many views"
          rightLabel="canonical bytes · offset 0042"
          footer="projections can be rebuilt · the stream cannot be rewritten"
          u={frameU}
        >
          <circle cx={1172} cy={78} r={4} fill={BLUE} opacity={0.28 + protocolPulse * 0.62} />
          <ArchitectureEdge from={{ x: DOOR.x + 92, y: DOOR.y }} to={{ x: VALIDATOR.x - 92, y: VALIDATOR.y }} tone="coral" label="dispatch" flow={eventU} u={eventU} />
          <ArchitectureEdge from={{ x: VALIDATOR.x + 92, y: VALIDATOR.y }} to={{ x: STREAM.x - 142, y: STREAM.y }} tone="amber" label="accept" flow={appendU} u={validateU} />
          <ArchitectureEdge from={{ x: STREAM.x + 142, y: STREAM.y }} to={{ x: PROJECTION.x - 94, y: PROJECTION.y }} via={[{ x: 825, y: STREAM.y }, { x: 900, y: PROJECTION.y }]} tone="green" label="reduce" flow={fanU} u={fanU} />
          <ArchitectureEdge from={{ x: STREAM.x + 142, y: STREAM.y }} to={{ x: AUDIT.x - 94, y: AUDIT.y }} via={[{ x: 860, y: STREAM.y }]} tone="violet" label="record" flow={fanU} u={fanU} />
          <ArchitectureEdge from={{ x: STREAM.x + 142, y: STREAM.y }} to={{ x: REPLAY.x - 94, y: REPLAY.y }} via={[{ x: 825, y: STREAM.y }, { x: 900, y: REPLAY.y }]} tone="blue" label="replay" flow={digestU} u={fanU} />

          <ArchitectureCard x={DOOR.x} y={DOOR.y} w={184} h={72} label="dispatch" meta="user intent" badge="WRITE" tone="coral" u={eventU} status="ready" />
          <ArchitectureCard x={VALIDATOR.x} y={VALIDATOR.y} w={184} h={72} label="validator" meta={changeU > 0.45 ? 'schema · accepted' : 'schema · checked'} badge="GATE" tone="amber" u={validateU} status="ready" />
          <ArchitectureCard x={STREAM.x} y={STREAM.y} w={284} h={112} label="durable stream" meta="append-only · offset-addressed" badge="0042" tone="blue" u={appendU} status="ready">
            <text x={-126} y={10} fill={MUTED} fontSize={11} fontFamily={MONO}>event: message.created</text>
            <text x={-126} y={32} fill={BLUE} fontSize={11.5} fontWeight={800} fontFamily={MONO}>sha-256: 7a19…</text>
          </ArchitectureCard>
          <ArchitectureCard x={PROJECTION.x} y={PROJECTION.y} w={188} h={72} label="current UI" meta="materialized view" badge="VIEW" tone="green" u={projectionU} status="ready" />
          <ArchitectureCard x={AUDIT.x} y={AUDIT.y} w={188} h={72} label="audit trail" meta="human-readable log" badge="LOG" tone="violet" u={auditU} status="ready" />
          <ArchitectureCard x={REPLAY.x} y={REPLAY.y} w={188} h={72} label="replay" meta="same log · same state" badge="PROVE" tone="blue" u={replayU} status={digestU > 0.5 ? 'ready' : undefined} />

          <ArchitectureGrid x={260} y={500} columns={6} rows={1} cells={eventCells} cellW={92} cellH={42} gap={8} u={appendU} dim={closeU * 0.4} />
          <text x={550} y={568} textAnchor="middle" fill={MUTED} fontSize={11} fontFamily={MONO}>append-only history · evt-42 is not a UI snapshot</text>

          {digestU > 0.02 && (
            <g opacity={digestU}>
              <rect x={820} y={560} width={300} height={42} rx={8} fill={PAPER} stroke={GREEN} strokeWidth={1.5} />
              <text x={970} y={586} textAnchor="middle" fill={GREEN} fontSize={12} fontWeight={800} fontFamily={MONO}>digest A = digest B · 7a19…</text>
            </g>
          )}
          {changeU > 0.02 && (
            <g opacity={changeU}>
              <circle cx={PROJECTION.x} cy={146} r={6} fill={CORAL} />
              <text x={PROJECTION.x + 16} y={150} fill={CORAL} fontSize={11.5} fontWeight={800} fontFamily={MONO}>projection may change</text>
            </g>
          )}
          {closeU > 0.02 && (
            <g opacity={closeU}>
              <rect x={355} y={105} width={570} height={56} rx={10} fill={PAPER} stroke={BLUE} />
              <text x={640} y={139} textAnchor="middle" fill={INK} fontSize={16} fontWeight={800}>append once · derive many · prove the derivation</text>
            </g>
          )}
        </ArchitectureFrame>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
