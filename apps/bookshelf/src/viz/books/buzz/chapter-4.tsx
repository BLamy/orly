// Buzz — chapter 4: an agent as an equal teammate.
// Because an agent has the same signed identity as a person, it can do real
// work — search history, open a repo, send a patch, review code, run a
// workflow, edit a canvas — and every action is a signed, attributable event
// on the same relay. Buzz ships harnesses for Goose, Codex, and Claude Code
// (model-agnostic). Honest status per the launch post: approval gates are only
// partially built, so a human sign-off still belongs on the risky steps.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { TokenFlight, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// the agent's stream of signed actions → the relay's audit log
const ACTIONS = [
  { verb: 'search', detail: 'history: “cold start” across the workspace' },
  { verb: 'open', detail: 'repo auth/ · read session.rs' },
  { verb: 'patch', detail: 'send patch 4a2f · signed' },
  { verb: 'review', detail: 'comment on 4a2f · signed' },
  { verb: 'workflow', detail: 'run “verify” · step recorded' },
];
const AGENT = { x: 260, y: 330 };
const LOG = { x: 780, y: 150, w: 400, rowH: 62 };
const HARNESSES = ['Goose', 'Codex', 'Claude Code'];

const CAM_AGENT: CameraState = { x: 300, y: 330, k: 1.15 };
const CAM_LOG: CameraState = { x: 800, y: 320, k: 1.05 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const agentU = tl.channel('agentU', 0);
  const actU = tl.channel('actU', 0); // actions stream out
  const logU = tl.channel('logU', 0); // land in the audit log
  const attrU = tl.channel('attrU', 0);
  const harnessU = tl.channel('harnessU', 0);
  const gateU = tl.channel('gateU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Because an agent carries the same signed identity as a person, it is not stuck watching. It can actually do the work — and here is Goose, about to.',
  });
  tl.tween(cam, CAM_AGENT, { at: 0.8, dur: 1.5, ease: ease.move });
  tl.tween(agentU, 1, { at: 1.0, dur: 1.0, ease: ease.enter });
  tl.hold(6.5, 0.7);

  tl.caption({
    at: 7.2,
    dur: 7.0,
    text: 'It searches the whole workspace history for prior discussion of the bug. It opens the repository and reads the file. It sends a patch. It reviews that patch. It runs a workflow. Five ordinary teammate actions.',
  });
  tl.tween(actU, 1, { at: 7.6, dur: 5.6, ease: ease.linear });
  tl.tween(cam, CAM_LOG, { at: 8.4, dur: 1.6, ease: ease.move });
  tl.tween(logU, 1, { at: 8.8, dur: 5.2, ease: ease.linear });
  tl.hold(14.8, 0.7);

  tl.caption({
    at: 15.5,
    dur: 6.4,
    text: 'Every one of those actions is a signed event landing in the same audit log as everyone else’s. Nothing the agent does is anonymous or off the record. It is all attributable to its key — which is exactly what makes it trustworthy.',
  });
  tl.tween(attrU, 1, { at: 16.0, dur: 2.0, ease: ease.enter });
  tl.hold(22.1, 0.7);

  tl.caption({
    at: 22.8,
    dur: 6.4,
    text: 'And Buzz does not care which model is driving. It ships harnesses for Goose, for Codex, and for Claude Code, and it is model agnostic by design — no lock-in, including to Block itself.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 23.0, dur: 1.4, ease: ease.move });
  tl.tween(harnessU, 1, { at: 23.8, dur: 1.6, ease: ease.enter });
  tl.hold(29.2, 0.7);

  tl.caption({
    at: 29.9,
    dur: 6.2,
    text: 'One honest note: fine-grained approval gates are still only partly built. So for now, a human sign-off belongs on the steps that matter — and because the whole record is signed, that sign-off is itself just another attributable event.',
  });
  tl.tween(gateU, 1, { at: 30.4, dur: 1.4, ease: ease.enter });
  tl.hold(36.1, 0.7);

  tl.caption({
    at: 36.8,
    dur: 5.2,
    text: 'A real member of the team, doing real work, with every move on the record. That is what “agents as equal members” actually means.',
  });
  tl.tween(dimU, 1, { at: 37.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 38.2, dur: 1.0, ease: ease.enter });
  tl.hold(42.0, 1.2);

  return { tl, cam, agentU, actU, logU, attrU, harnessU, gateU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const agentU = s.get(scene.agentU);
  const actU = s.get(scene.actU);
  const logU = s.get(scene.logU);
  const attrU = s.get(scene.attrU);
  const harnessU = s.get(scene.harnessU);
  const gateU = s.get(scene.gateU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);
  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the agent */}
          {agentU > 0 && (
            <g opacity={agentU}>
              <circle cx={AGENT.x + 40} cy={AGENT.y} r={22} fill="none" stroke={colors.SECONDARY} strokeWidth={2} />
              <circle cx={AGENT.x + 40} cy={AGENT.y} r={8} fill={colors.SECONDARY} />
              <text x={AGENT.x + 40} y={AGENT.y + 48} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontWeight={600}>goose</text>
              <text x={AGENT.x + 40} y={AGENT.y + 68} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">agent · {shortHex('2f7a1c9e', 6, 2)}</text>
            </g>
          )}

          {/* audit log receiving signed actions */}
          {logU > 0 && (
            <text x={LOG.x} y={LOG.y - 18} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={logU}>
              relay audit log — one record, signed
            </text>
          )}
          {ACTIONS.map((a, i) => {
            const outU = clamp01(actU * ACTIONS.length - i);
            const inU = clamp01(logU * ACTIONS.length - i);
            if (outU <= 0) return null;
            const ly = LOG.y + i * LOG.rowH;
            return (
              <g key={i}>
                {/* the action flying from agent to log */}
                <TokenFlight
                  from={{ x: AGENT.x + 70, y: AGENT.y }}
                  to={{ x: LOG.x + 90, y: ly + 22 }}
                  u={inU}
                  text={a.verb}
                  fill={colors.SECONDARY}
                  fontSize={13}
                  lift={70}
                  fadeOut
                />
                {/* the landed log row */}
                {inU >= 1 && (
                  <g>
                    <rect x={LOG.x} y={ly} width={LOG.w} height={LOG.rowH - 10} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                    <text x={LOG.x + 16} y={ly + 24} fill={colors.SECONDARY} fontSize={12} fontWeight={600} fontFamily="monospace">{a.verb}</text>
                    <text x={LOG.x + 16} y={ly + 42} fill={colors.TEXT} fontSize={12}>{a.detail}</text>
                    {attrU > 0 && (
                      <text x={LOG.x + LOG.w - 14} y={ly + 24} textAnchor="end" fill={colors.POSITIVE} fontSize={10} fontFamily="monospace" opacity={attrU}>✓ signed</text>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* harnesses */}
          {harnessU > 0 && (
            <g opacity={harnessU}>
              <text x={AGENT.x + 40} y={AGENT.y + 108} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">model-agnostic harnesses</text>
              {HARNESSES.map((h, i) => (
                <g key={h}>
                  <rect x={AGENT.x - 6 + i * 108} y={AGENT.y + 122} width={98} height={30} rx={7} fill={colors.PANEL} stroke={colors.SECONDARY} />
                  <text x={AGENT.x + 43 + i * 108} y={AGENT.y + 142} textAnchor="middle" fill={colors.SECONDARY} fontSize={12}>{h}</text>
                </g>
              ))}
            </g>
          )}

          {/* approval gate honesty */}
          {gateU > 0 && (
            <g opacity={gateU}>
              <text x={780} y={520} fill={colors.WARM} fontSize={13} fontWeight={600}>approval gates — partially built</text>
              <text x={780} y={542} fill={colors.MUTED} fontSize={12}>human sign-off on risky steps = another signed event</text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={23} fontWeight={600}>An agent that does the work</text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={16}>search · patch · review · run — every action signed and attributable</text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">harnesses: Goose · Codex · Claude Code · model-agnostic</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
