// Chapter 3 — Convergence is visible
//
// Centerpiece: one coordinator broadcasts one committed event to independent
// readers. Quorum, offline state, and catch-up are explicit state in the
// diagram, not hidden behind a green spinner.
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
  ArchitecturePhaseRail,
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

const COORDINATOR = { x: 240, y: 340 } as const;
const PARTICIPANTS = [
  { x: 1015, y: 145, label: 'client 1' },
  { x: 1015, y: 260, label: 'client 2' },
  { x: 1015, y: 375, label: 'client 3' },
  { x: 1015, y: 490, label: 'client 4' },
  { x: 1015, y: 605, label: 'client 5' },
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const frameU = tl.channel('frameU', 0);
  const castU = tl.channel('castU', 0);
  const prepareU = tl.channel('prepareU', 0);
  const phase = tl.channel('phase', 0);
  const broadcastU = tl.channel('broadcastU', 0);
  const quorum = tl.channel('quorum', 0);
  const offlineU = tl.channel('offlineU', 0);
  const catchupU = tl.channel('catchupU', 0);
  const restoreU = tl.channel('restoreU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Convergence sounds abstract until the system makes it visible. Five clients are looking at one stream, and one coordinator is about to commit one event.',
  });
  tl.tween(frameU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(castU, 1, { at: 1.3, dur: 1.1, ease: ease.enter });

  tl.caption({
    at: 7.2,
    dur: 6.0,
    text: 'First, every participant prepares. Preparation means the client has seen the event and can say whether it is ready to apply.',
  });
  tl.tween(prepareU, 1, { at: 7.5, dur: 2.8, ease: ease.linear });
  tl.set(phase, 1, 9.8);

  tl.caption({
    at: 13.8,
    dur: 6.8,
    text: 'The coordinator broadcasts a commit. The point is not that one machine is magically correct; the point is that every participant receives the same ordered event from the same stream.',
  });
  tl.tween(cam, { x: 650, y: 330, k: 1.08 }, { at: 14.0, dur: 1.2, ease: ease.move });
  tl.tween(broadcastU, 1, { at: 15.0, dur: 2.4, ease: ease.draw });
  tl.tween(quorum, 0.8, { at: 16.3, dur: 1.6, ease: ease.linear });
  tl.set(phase, 2, 18.4);

  tl.caption({
    at: 20.2,
    dur: 6.4,
    text: 'Four of five are ready, so the quorum is four. The fifth participant is offline, and the system names that fact instead of pretending the network is perfect.',
  });
  tl.tween(offlineU, 1, { at: 20.8, dur: 0.8, ease: ease.pop });
  tl.tween(quorum, 1, { at: 21.4, dur: 1.2, ease: ease.linear });

  tl.caption({
    at: 27.2,
    dur: 6.6,
    text: 'Commit is now a shared state transition. The four connected clients converge at offset forty-three while the offline client keeps its old bookmark.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 27.4, dur: 1.2, ease: ease.move });
  tl.tween(broadcastU, 1, { at: 28.0, dur: 1.0, ease: ease.linear });
  tl.set(phase, 3, 29.3);

  tl.caption({
    at: 34.8,
    dur: 6.6,
    text: 'When the fifth client reconnects, it does not ask anyone to reconstruct the transaction. It presents its bookmark and replays the missing suffix from the stream.',
  });
  tl.tween(offlineU, 0, { at: 35.4, dur: 0.8, ease: ease.move });
  tl.tween(catchupU, 1, { at: 36.2, dur: 2.8, ease: ease.move });
  tl.set(phase, 4, 39.2);

  tl.caption({
    at: 41.8,
    dur: 7.0,
    text: 'Restore is boring by design: read the durable suffix, reduce it, compare the digest, and return to the live edge. The stream makes recovery a normal read.',
  });
  tl.tween(restoreU, 1, { at: 42.6, dur: 1.5, ease: ease.pop });
  tl.tween(cam, { x: 850, y: 400, k: 1.08 }, { at: 42.8, dur: 1.2, ease: ease.move });

  tl.caption({
    at: 49.4,
    dur: 7.2,
    text: 'That is the difference between “the app looks synced” and convergence you can interrogate. Quorum, offset, offline state, and digest are all part of the product state.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 49.6, dur: 1.3, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.0, dur: 1.0, ease: ease.pop });
  tl.hold(58.0, 1.2);

  return { tl, cam, frameU, castU, prepareU, phase, broadcastU, quorum, offlineU, catchupU, restoreU, closeU };
}

const scene = buildScene();

function statusForParticipant(index: number, offlineU: number, catchupU: number): 'ready' | 'offline' | 'conflict' | undefined {
  if (index === 4 && offlineU > 0.45) return 'offline';
  if (index === 4 && catchupU > 0.35) return 'ready';
  return index < 4 ? 'ready' : undefined;
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const frameU = s.get(scene.frameU);
  const castU = s.get(scene.castU);
  const prepareU = s.get(scene.prepareU);
  const phase = Math.round(s.get(scene.phase));
  const broadcastU = s.get(scene.broadcastU);
  const quorum = s.get(scene.quorum);
  const offlineU = s.get(scene.offlineU);
  const catchupU = s.get(scene.catchupU);
  const restoreU = s.get(scene.restoreU);
  const closeU = s.get(scene.closeU);
  const phases = ['prepare', 'broadcast', 'commit', 'catch up'];
  const protocolPulse = 0.5 + 0.5 * Math.sin(s.t * 2.4);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={PAPER} />
      <Camera {...cam}>
        <ArchitectureFrame
          x={58}
          y={32}
          w={1164}
          h={650}
          label="convergence / one ordered event"
          rightLabel={`offset 0043 · quorum ${Math.round(quorum * 4)}/5`}
          footer="connected clients converge · offline clients replay the suffix"
          u={frameU}
        >
          <circle cx={1172} cy={66} r={4} fill={GREEN} opacity={0.28 + protocolPulse * 0.62} />
          <g opacity={castU}>
            <rect x={390} y={72} width={270} height={34} rx={8} fill={PAPER} stroke={GREEN} strokeWidth={1.4} />
            <text x={525} y={94} textAnchor="middle" fill={GREEN} fontSize={12} fontWeight={800} fontFamily={MONO}>QUORUM · {Math.round(quorum * 4)}/5</text>
            <rect x={675} y={72} width={135} height={34} rx={8} fill={PAPER} stroke={MUTED} strokeWidth={1.2} />
            <text x={742} y={94} textAnchor="middle" fill={INK} fontSize={11.5} fontWeight={800} fontFamily={MONO}>TX #43</text>
            <rect x={825} y={72} width={160} height={34} rx={8} fill={PAPER} stroke={CORAL} strokeWidth={1.4} />
            <text x={905} y={94} textAnchor="middle" fill={CORAL} fontSize={11.5} fontWeight={800} fontFamily={MONO}>RESTORE ALL</text>
          </g>

          {PARTICIPANTS.map((participant, index) => {
            const point = index === 4 ? { x: participant.x - 106, y: participant.y } : { x: participant.x - 106, y: participant.y };
            return (
              <ArchitectureEdge
                key={`edge-${participant.label}`}
                from={{ x: COORDINATOR.x + 105, y: COORDINATOR.y }}
                to={point}
                via={[{ x: 490, y: COORDINATOR.y }, { x: 780, y: participant.y }]}
                tone={index === 4 && offlineU > 0.45 ? 'pink' : index < 4 ? 'green' : 'blue'}
                dashed={index === 4 || prepareU < 0.5}
                label={index === 4 && catchupU > 0.35 ? 'replay suffix' : index === 4 && offlineU > 0.45 ? 'offline' : 'commit'}
                flow={index === 4 ? catchupU : broadcastU}
                u={broadcastU > 0.02 ? broadcastU : prepareU}
                dim={index === 4 ? offlineU * 0.5 : 0}
              />
            );
          })}

          <ArchitectureCard x={COORDINATOR.x} y={COORDINATOR.y} w={210} h={88} label="coordinator" meta="broadcasting commit" badge="DO COMMIT" tone="green" u={castU} status={broadcastU > 0.5 ? 'ready' : undefined} />
          {PARTICIPANTS.map((participant, index) => (
            <ArchitectureCard
              key={participant.label}
              x={participant.x}
              y={participant.y}
              w={212}
              h={72}
              label={participant.label}
              meta={index === 4 && offlineU > 0.45 ? 'offline · bookmark 0038' : index === 4 && catchupU > 0.35 ? 'catching up · 0039–0043' : index < 4 && broadcastU > 0.5 ? 'committed · digest 7a19' : 'prepared'}
              badge={index === 4 && offlineU > 0.45 ? 'AWAY' : index === 4 && catchupU > 0.35 ? 'CATCH' : index < 4 && broadcastU > 0.5 ? 'READY' : 'PREP'}
              tone={index === 4 && offlineU > 0.45 ? 'pink' : index < 4 && broadcastU > 0.5 ? 'green' : 'neutral'}
              u={castU}
              status={statusForParticipant(index, offlineU, catchupU)}
              dashed={index === 4 && offlineU > 0.45}
              dim={index === 4 ? offlineU * 0.55 : 0}
            />
          ))}

          <ArchitecturePhaseRail x={142} y={624} w={996} phases={phases} active={Math.min(3, Math.max(0, phase))} u={castU} />
          {restoreU > 0.02 && (
            <g opacity={restoreU}>
              <rect x={420} y={505} width={440} height={46} rx={9} fill={PAPER} stroke={BLUE} strokeWidth={1.5} />
              <text x={640} y={534} textAnchor="middle" fill={BLUE} fontSize={12} fontWeight={800} fontFamily={MONO}>restore: replay → reduce → digest match</text>
            </g>
          )}
          {closeU > 0.02 && (
            <g opacity={closeU}>
              <rect x={365} y={135} width={550} height={52} rx={10} fill={PAPER} stroke={GREEN} strokeWidth={1.4} />
              <text x={640} y={167} textAnchor="middle" fill={INK} fontSize={16} fontWeight={800}>convergence is a state, not a spinner</text>
            </g>
          )}
        </ArchitectureFrame>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
