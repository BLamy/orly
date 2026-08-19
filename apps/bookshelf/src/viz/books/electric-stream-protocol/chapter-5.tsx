// Chapter 5 — Git at the edge
//
// Centerpiece: an ordinary Git clone remains a friendly entry point. A
// post-clone activation discovers the stream and installs a local bridge; Git
// writes become stream events, while export/mirror remains available as an
// escape hatch.
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
const VIOLET = '#7d83cc';
const AMBER = '#d19b42';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const GIT = { x: 180, y: 250 } as const;
const HOOK = { x: 420, y: 250 } as const;
const STREAM = { x: 680, y: 340 } as const;
const PEER_A = { x: 1015, y: 195 } as const;
const PEER_B = { x: 1015, y: 340 } as const;
const PEER_C = { x: 1015, y: 485 } as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const frameU = tl.channel('frameU', 0);
  const castU = tl.channel('castU', 0);
  const cloneU = tl.channel('cloneU', 0);
  const hookU = tl.channel('hookU', 0);
  const handshakeU = tl.channel('handshakeU', 0);
  const eventU = tl.channel('eventU', 0);
  const peerU = tl.channel('peerU', 0);
  const exportU = tl.channel('exportU', 0);
  const phase = tl.channel('phase', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'This does not require everyone to learn a new command line. Git can stay the front door: clone a repository, open the working tree, and start working.',
  });
  tl.tween(frameU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(castU, 1, { at: 1.3, dur: 1.0, ease: ease.enter });
  tl.tween(cloneU, 1, { at: 2.3, dur: 1.0, ease: ease.pop });

  tl.caption({
    at: 7.2,
    dur: 6.8,
    text: 'After clone, a small activation hook discovers the stream identity and installs the local bridge. This is the electric moment: the folder becomes a live participant.',
  });
  tl.tween(hookU, 1, { at: 7.6, dur: 1.2, ease: ease.draw });
  tl.tween(handshakeU, 1, { at: 9.0, dur: 1.5, ease: ease.linear });
  tl.set(phase, 1, 10.8);

  tl.caption({
    at: 13.8,
    dur: 6.8,
    text: 'From then on, a Git-origin change is not a special side channel. The bridge turns it into the same validated event that every other writer uses.',
  });
  tl.tween(cam, { x: 560, y: 305, k: 1.12 }, { at: 14.0, dur: 1.2, ease: ease.move });
  tl.tween(eventU, 1, { at: 15.0, dur: 1.5, ease: ease.draw });
  tl.set(phase, 2, 17.2);

  tl.caption({
    at: 20.2,
    dur: 6.8,
    text: 'The peers do not pull a mysterious “latest branch.” They receive an ordered event, replay it through their reducers, and expose the resulting offset and digest.',
  });
  tl.tween(peerU, 1, { at: 21.0, dur: 2.2, ease: ease.draw });
  tl.set(phase, 3, 23.6);

  tl.caption({
    at: 27.2,
    dur: 6.8,
    text: 'Git is still useful at the boundary. Export a snapshot for a code host, mirror a branch for a conventional review, or hand the working tree to a tool that only understands Git.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 27.4, dur: 1.2, ease: ease.move });
  tl.tween(exportU, 1, { at: 28.6, dur: 2.4, ease: ease.move });

  tl.caption({
    at: 34.0,
    dur: 7.0,
    text: 'But those exports are mirrors, not the authority. The stream keeps the mutation history, the evidence, and the convergence protocol even when a Git snapshot is moving between systems.',
  });
  tl.tween(cam, { x: 780, y: 370, k: 1.1 }, { at: 34.2, dur: 1.2, ease: ease.move });
  tl.tween(exportU, 1, { at: 35.2, dur: 1.0, ease: ease.linear });

  tl.caption({
    at: 41.4,
    dur: 7.6,
    text: 'That is the practical compromise: keep the Git commands people already know, then let the stream provide what Git does not — live readers, durable events, explicit conflicts, and replayable proof.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.6, dur: 1.3, ease: ease.move });
  tl.tween(closeU, 1, { at: 43.0, dur: 1.0, ease: ease.pop });
  tl.hold(51.0, 1.2);

  return { tl, cam, frameU, castU, cloneU, hookU, handshakeU, eventU, peerU, exportU, phase, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const frameU = s.get(scene.frameU);
  const castU = s.get(scene.castU);
  const cloneU = s.get(scene.cloneU);
  const hookU = s.get(scene.hookU);
  const handshakeU = s.get(scene.handshakeU);
  const eventU = s.get(scene.eventU);
  const peerU = s.get(scene.peerU);
  const exportU = s.get(scene.exportU);
  const phase = Math.round(s.get(scene.phase));
  const closeU = s.get(scene.closeU);
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
          label="git at the edge / stream underneath"
          rightLabel="active bridge"
          footer="Git is a compatibility substrate · the stream is authority"
          u={frameU}
        >
          <circle cx={1172} cy={78} r={4} fill={GREEN} opacity={0.28 + protocolPulse * 0.62} />
          <ArchitectureEdge from={{ x: GIT.x + 92, y: GIT.y }} to={{ x: HOOK.x - 92, y: HOOK.y }} tone="coral" label="clone" flow={cloneU} u={cloneU} />
          <ArchitectureEdge from={{ x: HOOK.x + 92, y: HOOK.y }} to={{ x: STREAM.x - 142, y: STREAM.y }} via={[{ x: 520, y: HOOK.y }, { x: 560, y: STREAM.y }]} tone="amber" label="activate" flow={handshakeU} u={hookU} />
          <ArchitectureEdge from={{ x: HOOK.x + 92, y: HOOK.y }} to={{ x: STREAM.x - 142, y: STREAM.y }} via={[{ x: 520, y: HOOK.y + 30 }, { x: 560, y: STREAM.y + 30 }]} tone="coral" label="append event" flow={eventU} u={eventU} />
          <ArchitectureEdge from={{ x: STREAM.x + 142, y: STREAM.y }} to={{ x: PEER_A.x - 106, y: PEER_A.y }} via={[{ x: 830, y: STREAM.y }, { x: 880, y: PEER_A.y }]} tone="green" label="replay" flow={peerU} u={peerU} />
          <ArchitectureEdge from={{ x: STREAM.x + 142, y: STREAM.y }} to={{ x: PEER_B.x - 106, y: PEER_B.y }} via={[{ x: 840, y: STREAM.y }]} tone="green" label="digest" flow={peerU} u={peerU} />
          <ArchitectureEdge from={{ x: STREAM.x + 142, y: STREAM.y }} to={{ x: PEER_C.x - 106, y: PEER_C.y }} via={[{ x: 830, y: STREAM.y }, { x: 880, y: PEER_C.y }]} tone="green" label="catch up" flow={peerU} u={peerU} />
          <ArchitectureEdge from={{ x: STREAM.x - 142, y: STREAM.y + 46 }} to={{ x: GIT.x + 92, y: 548 }} via={[{ x: 560, y: 520 }, { x: 320, y: 548 }]} tone="violet" label="export / mirror" flow={exportU} u={exportU} />

          <ArchitectureCard x={GIT.x} y={GIT.y} w={184} h={84} label="git clone" meta="ordinary working tree" badge="EDGE" tone="coral" u={cloneU} status="ready" />
          <ArchitectureCard x={HOOK.x} y={HOOK.y} w={184} h={84} label="activation" meta="post-clone hook" badge="HOOK" tone="amber" u={hookU} status={handshakeU > 0.5 ? 'ready' : undefined} />
          <ArchitectureCard x={STREAM.x} y={STREAM.y} w={284} h={116} label="authoritative stream" meta="events · offsets · digests" badge="LIVE" tone="blue" u={eventU} status="ready">
            <text x={-126} y={10} fill={MUTED} fontSize={11} fontFamily={MONO}>/streams/project-main</text>
            <text x={-126} y={32} fill={BLUE} fontSize={11.5} fontWeight={800} fontFamily={MONO}>bridge → normal dispatch door</text>
          </ArchitectureCard>

          <ArchitectureCard x={PEER_A.x} y={PEER_A.y} w={212} h={70} label="peer A" meta="reduced · digest 7a19" badge="SYNC" tone="green" u={peerU} status="ready" />
          <ArchitectureCard x={PEER_B.x} y={PEER_B.y} w={212} h={70} label="peer B" meta="reduced · offset 0043" badge="SYNC" tone="green" u={peerU} status="ready" />
          <ArchitectureCard x={PEER_C.x} y={PEER_C.y} w={212} h={70} label="peer C" meta="reduced · evidence attached" badge="PROVE" tone="green" u={peerU} status="ready" />

          <ArchitectureCard x={GIT.x} y={548} w={184} h={66} label="git mirror" meta="snapshot / review / escape" badge="EXPORT" tone="violet" u={exportU} status="ready" />
          <ArchitecturePhaseRail x={150} y={624} w={980} phases={['clone', 'activate', 'append', 'converge']} active={Math.min(3, Math.max(0, phase))} u={castU} />

          {handshakeU > 0.02 && (
            <g opacity={handshakeU}>
              <rect x={295} y={132} width={520} height={48} rx={9} fill={PAPER} stroke={AMBER} strokeWidth={1.4} />
              <text x={555} y={162} textAnchor="middle" fill={INK} fontSize={14} fontWeight={800} fontFamily={MONO}>stream identity discovered · bridge installed</text>
            </g>
          )}
          {closeU > 0.02 && (
            <g opacity={closeU}>
              <rect x={315} y={235} width={650} height={58} rx={10} fill={PAPER} stroke={BLUE} strokeWidth={1.5} />
              <text x={640} y={271} textAnchor="middle" fill={INK} fontSize={16} fontWeight={800}>familiar commands at the edge · electric history underneath</text>
            </g>
          )}
        </ArchitectureFrame>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
