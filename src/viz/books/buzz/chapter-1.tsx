// Buzz — chapter 1: every seam loses something.
// The problem Buzz exists to solve (per Block's launch post): a team's work is
// scattered across a chat tool, a code host, a CI system, and a pile of agent
// tools. Each boundary is a seam that loses context — and agents feel it most,
// because they can only help with what they can see. Buzz collapses the seams
// onto one surface behind one identity. No invented components: this chapter is
// the framing; the mechanics (signed events, kinds, relay) come next.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// four silos across the top
const SILOS = [
  { key: 'chat', label: 'chat', sub: 'Slack', x: 120 },
  { key: 'code', label: 'code', sub: 'GitHub', x: 400 },
  { key: 'ci', label: 'CI', sub: 'pipelines', x: 680 },
  { key: 'agents', label: 'agents', sub: 'ever-changing tools', x: 960 },
];
const SILO_Y = 150;
const SILO_W = 200;
const SILO_H = 150;

const CAM_ROW: CameraState = { x: 640, y: 250, k: 1.05 };
const CAM_AGENT: CameraState = { x: 1060, y: 300, k: 1.2 };
const CAM_MERGE: CameraState = { x: 640, y: 380, k: 1.1 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const silosU = tl.channel('silosU', 0);
  const seamU = tl.channel('seamU', 0); // a context fragment falls into the seams
  const agentU = tl.channel('agentU', 0);
  const blindU = tl.channel('blindU', 0);
  const collapseU = tl.channel('collapseU', 0);
  const oneU = tl.channel('oneU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Here is how most teams work today. Conversations live in one tool. Code lives in a second. The system that builds and tests it lives in a third. And now a growing pile of agent tools sits off to the side.',
  });
  tl.tween(silosU, 1, { at: 0.8, dur: 2.6, ease: ease.enter });
  tl.tween(cam, CAM_ROW, { at: 1.0, dur: 1.6, ease: ease.move });
  tl.hold(6.7, 0.7);

  tl.caption({
    at: 7.4,
    dur: 6.4,
    text: 'Every one of those boundaries is a seam, and every seam quietly loses information. A decision made in chat never reaches the code review. The reason behind a change evaporates in the gap between two tools.',
  });
  tl.tween(seamU, 1, { at: 8.0, dur: 4.2, ease: ease.linear });
  tl.hold(13.8, 0.7);

  tl.caption({
    at: 14.5,
    dur: 6.6,
    text: 'People can paper over the gaps from memory. Agents cannot. An agent can only help with what it can actually see — and what it sees is one tool at a time, with the connections between them missing.',
  });
  tl.tween(cam, CAM_AGENT, { at: 14.8, dur: 1.5, ease: ease.move });
  tl.tween(agentU, 1, { at: 15.6, dur: 0.8, ease: ease.enter });
  tl.tween(blindU, 1, { at: 16.6, dur: 1.6, ease: ease.move });
  tl.hold(21.1, 0.7);

  tl.caption({
    at: 21.8,
    dur: 6.4,
    text: 'Buzz starts from one idea: put the people, the agents, the conversations, and the code on a single surface, behind one identity, with one shared record. Collapse the seams instead of bridging them.',
  });
  tl.tween(cam, CAM_MERGE, { at: 22.0, dur: 1.5, ease: ease.move });
  tl.tween(collapseU, 1, { at: 22.6, dur: 2.6, ease: ease.move });
  tl.tween(oneU, 1, { at: 24.8, dur: 1.2, ease: ease.enter });
  tl.hold(28.2, 0.7);

  tl.caption({
    at: 28.9,
    dur: 6.0,
    text: 'One workspace. One context. Built, in Block’s words, to reduce a team’s dependence on Slack and Github — and to let agents finally see the whole picture instead of a slice of it.',
  });
  tl.tween(dimU, 1, { at: 29.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 30.3, dur: 1.0, ease: ease.enter });
  tl.hold(34.9, 1.2);

  return { tl, cam, silosU, seamU, agentU, blindU, collapseU, oneU, dimU, closeU };
}

const scene = buildScene();

function Silo({ i, u, collapse }: { i: number; u: number; collapse: number }) {
  const s = SILOS[i];
  if (u <= 0) return null;
  // collapse: slide the four silos toward one centered box
  const targetX = 440;
  const x = s.x + (targetX - s.x) * collapse;
  const op = u * (1 - 0.55 * collapse);
  return (
    <g opacity={op}>
      <rect x={x} y={SILO_Y} width={SILO_W} height={SILO_H} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={x + SILO_W / 2} y={SILO_Y + 34} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={600}>{s.label}</text>
      <text x={x + SILO_W / 2} y={SILO_Y + 58} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">{s.sub}</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const silosU = s.get(scene.silosU);
  const seamU = s.get(scene.seamU);
  const agentU = s.get(scene.agentU);
  const blindU = s.get(scene.blindU);
  const collapseU = s.get(scene.collapseU);
  const oneU = s.get(scene.oneU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // a "context fragment" travelling across the seams, fading at each boundary
  const fragBounds = SILOS.map((s) => s.x + SILO_W / 2);
  const fi = Math.min(SILOS.length - 1, Math.floor(seamU * SILOS.length));
  const fragX = fragBounds[0] + (fragBounds[fragBounds.length - 1] - fragBounds[0]) * seamU;
  const fragFade = 1 - clamp01((seamU - 0.05) * 1.1); // loses substance as it crosses

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          {SILOS.map((_, i) => (
            <Silo key={i} i={i} u={silosU} collapse={collapseU} />
          ))}

          {/* seams: gaps between silos where context leaks */}
          {seamU > 0 && collapseU < 0.1 && (
            <>
              {[0, 1, 2].map((g) => {
                const x = (fragBounds[g] + fragBounds[g + 1]) / 2 - 20;
                return (
                  <text key={g} x={x} y={SILO_Y + SILO_H + 34} fill={colors.NEGATIVE} fontSize={22} opacity={0.5}>⌄</text>
                );
              })}
              <g opacity={fragFade}>
                <rect x={fragX - 44} y={SILO_Y + SILO_H + 18} width={88} height={26} rx={6} fill={colors.WARM} opacity={0.22} />
                <text x={fragX} y={SILO_Y + SILO_H + 36} textAnchor="middle" fill={colors.WARM} fontSize={12}>context</text>
              </g>
              {seamU > 0.9 && (
                <text x={fragBounds[fragBounds.length - 1]} y={SILO_Y + SILO_H + 36} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} opacity={(seamU - 0.9) * 8}>
                  …lost
                </text>
              )}
            </>
          )}

          {/* the agent, blind across seams */}
          {agentU > 0 && collapseU < 0.1 && (
            <g opacity={agentU} transform={`translate(${fragBounds[3]}, ${SILO_Y + SILO_H + 90})`}>
              <circle cx={0} cy={0} r={20} fill="none" stroke={colors.SECONDARY} strokeWidth={2} />
              <circle cx={0} cy={0} r={7} fill={colors.SECONDARY} />
              <text x={0} y={44} textAnchor="middle" fill={colors.SECONDARY} fontSize={13}>agent</text>
              {blindU > 0 && (
                <>
                  {[-3, -2, -1].map((k) => (
                    <line key={k} x1={0} y1={0} x2={k * 190} y2={-40} stroke={colors.NEGATIVE} strokeWidth={1.4} strokeDasharray="4 6" opacity={0.4 * blindU} />
                  ))}
                  <text x={0} y={64} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} opacity={blindU}>
                    can’t see across the seams
                  </text>
                </>
              )}
            </g>
          )}

          {/* the collapsed single surface */}
          {oneU > 0 && (
            <g opacity={oneU}>
              <rect x={360} y={SILO_Y} width={560} height={SILO_H + 40} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
              <text x={640} y={SILO_Y + 44} textAnchor="middle" fill={colors.ACCENT} fontSize={18} fontWeight={600}>one workspace</text>
              <text x={640} y={SILO_Y + 76} textAnchor="middle" fill={colors.TEXT} fontSize={14}>people · agents · conversations · code</text>
              <text x={640} y={SILO_Y + 104} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="monospace">behind one identity · one shared record</text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={23} fontWeight={600}>The problem is context, not chat</text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={16}>every seam between tools loses information — and agents feel it most</text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">Buzz · one surface, one identity, one record · buzz.xyz</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
