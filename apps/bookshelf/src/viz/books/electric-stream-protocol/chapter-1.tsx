// Chapter 1 — The stream is the product
//
// Centerpiece: one mutation enters a durable append-only stream, receives an
// offset, and becomes available to multiple readers. One reader disappears;
// the stream keeps the event and the reader resumes from its bookmark.
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
const PINK = '#d94879';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const ACTOR = { x: 190, y: 260 } as const;
const STREAM = { x: 640, y: 330 } as const;
const READER_A = { x: 1040, y: 195 } as const;
const READER_B = { x: 1040, y: 470 } as const;
const EVENT_CELLS = [
  { label: '0001', tone: 'blue' as const, active: 4, status: 'ready' as const },
  { label: '0002', tone: 'blue' as const, active: 4, status: 'ready' as const },
  { label: '0003', tone: 'green' as const, active: 4, status: 'ready' as const },
  { label: '0004', tone: 'green' as const, active: 4, status: 'ready' as const },
  { label: '0005', tone: 'coral' as const, active: 3, status: 'hot' as const },
  { label: '0006', tone: 'neutral' as const, active: 0, status: 'idle' as const },
  { label: '0007', tone: 'neutral' as const, active: 0, status: 'idle' as const },
  { label: '0008', tone: 'neutral' as const, active: 0, status: 'idle' as const },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const frameU = tl.channel('frameU', 0);
  const wireU = tl.channel('wireU', 0);
  const eventU = tl.channel('eventU', 0);
  const appendU = tl.channel('appendU', 0);
  const readerU = tl.channel('readerU', 0);
  const offlineU = tl.channel('offlineU', 0);
  const resumeU = tl.channel('resumeU', 0);
  const digestU = tl.channel('digestU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Start with one mutation: an agent writes a new message, a file changes, or a user presses save. The important decision is where that mutation becomes real.',
  });
  tl.tween(frameU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(wireU, 1, { at: 1.5, dur: 1.1, ease: ease.draw });
  tl.tween(eventU, 1, { at: 2.8, dur: 1.0, ease: ease.pop });

  tl.caption({
    at: 7.2,
    dur: 6.2,
    text: 'A conventional app treats the request as the moment of truth. Once the response leaves the server, the connection has done its job and disappears.',
  });
  tl.tween(cam, { x: 405, y: 290, k: 1.28 }, { at: 7.4, dur: 1.3, ease: ease.move });
  tl.tween(wireU, 0.25, { at: 8.0, dur: 1.2, ease: ease.move });

  tl.caption({
    at: 14.2,
    dur: 6.8,
    text: 'Electric makes a different move: the mutation is appended to a durable stream first. The stream has its own address, its own order, and its own history.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 14.4, dur: 1.2, ease: ease.move });
  tl.tween(wireU, 1, { at: 15.2, dur: 0.8, ease: ease.enter });
  tl.tween(appendU, 0.55, { at: 16.0, dur: 3.5, ease: ease.linear });

  tl.caption({
    at: 21.4,
    dur: 6.8,
    text: 'Every append receives an offset. That offset is a bookmark: a reader can say exactly which prefix it has seen, and ask for the suffix after it.',
  });
  tl.tween(appendU, 1, { at: 22.0, dur: 3.8, ease: ease.linear });
  tl.tween(readerU, 1, { at: 22.5, dur: 1.2, ease: ease.enter });

  tl.caption({
    at: 28.8,
    dur: 6.4,
    text: 'That means one stream can feed many projections. The first reader tails the live edge; a second reader can arrive later and replay the same events without asking the writer to run again.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 29.0, dur: 1.2, ease: ease.move });
  tl.tween(digestU, 1, { at: 31.0, dur: 1.0, ease: ease.pop });

  tl.caption({
    at: 35.8,
    dur: 6.8,
    text: 'Now remove reader two. The reader is gone, but the stream is not. The writer keeps appending because a reader is a view of history, not the owner of history.',
  });
  tl.tween(offlineU, 1, { at: 36.6, dur: 0.8, ease: ease.pop });
  tl.tween(appendU, 1, { at: 37.2, dur: 2.5, ease: ease.linear });

  tl.caption({
    at: 43.2,
    dur: 6.6,
    text: 'When the reader returns, it presents its last offset. The stream replays only the missing suffix, then lets the reader catch the live edge. No duplicate mutation and no second request to reconstruct the past.',
  });
  tl.tween(cam, { x: 850, y: 400, k: 1.12 }, { at: 43.4, dur: 1.2, ease: ease.move });
  tl.tween(offlineU, 0, { at: 44.3, dur: 0.7, ease: ease.move });
  tl.tween(resumeU, 1, { at: 45.0, dur: 2.6, ease: ease.move });

  tl.caption({
    at: 50.5,
    dur: 7.4,
    text: 'This is why the stream is the product. Transport is replaceable; the durable ordered history is what gives every client, projection, and replay the same source of truth.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.7, dur: 1.3, ease: ease.move });
  tl.tween(closeU, 1, { at: 52.0, dur: 1.0, ease: ease.pop });
  tl.hold(59.0, 1.2);

  return { tl, cam, frameU, wireU, eventU, appendU, readerU, offlineU, resumeU, digestU, closeU };
}

const scene = buildScene();

function OffsetBadge({ x, y, label, u, tone = BLUE }: { x: number; y: number; label: string; u: number; tone?: string }) {
  const reveal = clamp01(u);
  if (reveal <= 0.01) return null;
  return (
    <g opacity={reveal}>
      <rect x={x - 96} y={y - 15} width={192} height={30} rx={8} fill={PAPER} stroke={tone} />
      <text x={x} y={y + 5} textAnchor="middle" fill={tone} fontSize={11.5} fontWeight={800} fontFamily={MONO}>
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const frameU = s.get(scene.frameU);
  const wireU = s.get(scene.wireU);
  const eventU = s.get(scene.eventU);
  const appendU = s.get(scene.appendU);
  const readerU = s.get(scene.readerU);
  const offlineU = s.get(scene.offlineU);
  const resumeU = s.get(scene.resumeU);
  const digestU = s.get(scene.digestU);
  const closeU = s.get(scene.closeU);
  const streamOpacity = 1 - closeU * 0.35;
  const readerBStatus = offlineU > 0.45 ? 'offline' : resumeU > 0.45 ? 'ready' : undefined;
  const protocolPulse = 0.5 + 0.5 * Math.sin(s.t * 2.4);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={PAPER} />
      <Camera {...cam}>
        <ArchitectureFrame
          x={58}
          y={44}
          w={1164}
          h={632}
          label="stream / source of truth"
          rightLabel="offset 0042 · digest 7a19"
          footer="every reader is a view · the log is the authority"
          u={frameU}
        >
          <circle cx={1172} cy={78} r={4} fill={GREEN} opacity={0.28 + protocolPulse * 0.62} />
          <ArchitectureEdge
            from={{ x: ACTOR.x + 94, y: ACTOR.y }}
            to={{ x: STREAM.x - 142, y: STREAM.y }}
            via={[{ x: 360, y: ACTOR.y }, { x: 470, y: STREAM.y }]}
            tone="coral"
            label="append"
            flow={appendU}
            u={wireU}
          />
          <ArchitectureEdge
            from={{ x: STREAM.x + 142, y: STREAM.y - 28 }}
            to={{ x: READER_A.x - 94, y: READER_A.y }}
            via={[{ x: 800, y: STREAM.y - 28 }, { x: 895, y: READER_A.y }]}
            tone="blue"
            label="tail"
            flow={readerU}
            u={readerU}
            dim={offlineU * 0.5}
          />
          <ArchitectureEdge
            from={{ x: STREAM.x + 142, y: STREAM.y + 28 }}
            to={{ x: READER_B.x - 94, y: READER_B.y }}
            via={[{ x: 800, y: STREAM.y + 28 }, { x: 895, y: READER_B.y }]}
            tone={offlineU > 0.45 ? 'pink' : 'green'}
            label={offlineU > 0.45 ? 'paused' : resumeU > 0.4 ? 'replay suffix' : 'tail'}
            flow={resumeU}
            u={readerU}
            dim={offlineU * 0.7}
          />

          <ArchitectureCard
            x={ACTOR.x}
            y={ACTOR.y}
            w={188}
            h={72}
            label="writer"
            meta="mutation · accepted"
            badge="POST"
            tone="coral"
            u={eventU}
            status={eventU > 0.5 ? 'ready' : undefined}
          />
          <ArchitectureCard
            x={STREAM.x}
            y={STREAM.y}
            w={286}
            h={116}
            label="durable stream"
            meta="append-only · addressable"
            badge="LOG"
            tone="blue"
            u={appendU}
            status="ready"
          >
            <text x={-126} y={8} fill={MUTED} fontSize={11} fontFamily={MONO}>
              /streams/project-main
            </text>
            <text x={-126} y={31} fill={BLUE} fontSize={12} fontWeight={800} fontFamily={MONO}>
              offset → next offset
            </text>
          </ArchitectureCard>
          <ArchitectureCard
            x={READER_A.x}
            y={READER_A.y}
            w={188}
            h={72}
            label="reader A"
            meta="live projection"
            badge="LIVE"
            tone="green"
            u={readerU}
            status="ready"
          />
          <ArchitectureCard
            x={READER_B.x}
            y={READER_B.y}
            w={188}
            h={72}
            label="reader B"
            meta={offlineU > 0.45 ? 'bookmark · 0038' : resumeU > 0.4 ? 'replaying · 0039–0042' : 'audit projection'}
            badge={offlineU > 0.45 ? 'AWAY' : resumeU > 0.4 ? 'CATCH' : 'VIEW'}
            tone={offlineU > 0.45 ? 'pink' : 'green'}
            u={readerU}
            status={readerBStatus}
            dim={offlineU * 0.45}
            dashed={offlineU > 0.45}
          />

          <ArchitectureGrid x={426} y={465} columns={8} rows={1} cells={EVENT_CELLS} cellW={88} cellH={42} gap={7} u={appendU} dim={closeU * 0.5} />
          <text x={462} y={535} fill={MUTED} fontSize={11} fontFamily={MONO}>
            append-only event log · opaque offsets sort left → right
          </text>

          <OffsetBadge x={STREAM.x} y={224} label="Stream-Next-Offset: 0042" u={digestU} tone={BLUE} />
          {offlineU > 0.02 && (
            <g opacity={offlineU}>
              <path d="M945 448 l28 0" stroke={PINK} strokeWidth={2.5} strokeDasharray="4 5" />
              <text x={1010} y={548} textAnchor="middle" fill={PINK} fontSize={12} fontWeight={800} fontFamily={MONO}>
                reader disappears · writer continues
              </text>
            </g>
          )}
          {resumeU > 0.02 && (
            <g opacity={resumeU}>
              <circle cx={880} cy={420} r={26 + 12 * (1 - resumeU)} fill="none" stroke={GREEN} strokeWidth={2} opacity={1 - resumeU} />
              <text x={860} y={590} textAnchor="middle" fill={GREEN} fontSize={12} fontWeight={800} fontFamily={MONO}>
                replay the gap
              </text>
            </g>
          )}
          {closeU > 0.02 && (
            <g opacity={closeU}>
              <rect x={380} y={112} width={520} height={54} rx={10} fill={PAPER} stroke={GREEN} strokeWidth={1.5} />
              <text x={640} y={145} textAnchor="middle" fill={INK} fontSize={16} fontWeight={800}>
                durable · ordered · replayable
              </text>
            </g>
          )}
        </ArchitectureFrame>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
