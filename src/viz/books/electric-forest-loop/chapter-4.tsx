// The Budget and the Loud Stop
//
// Backed by: .claude/workflows/work-queue.js (maxRetries default 2; refuses
// to run unless project status is "building"; thrash detection — the same
// finding set refuting twice flips invalid_loop; flipInvalid writes status,
// statusReason, updatedAt and commits), .eforest/project.json (statusValues:
// building / complete / paused / invalid_loop), .eforest/loop.md (the four
// invalid_loop triggers; "routing around it is itself a refutation of the
// loop"), and tools/verify/self_check.sh (the greenwash scanner: no
// "|| true", "|| :", "; exit 0", hardcoded VERIFY_ALLOW_SKIP=1,
// continue-on-error, or make's "-" prefix in any verify path).
//
// ONE persistent object: the loop ring — implement → verify → rework. A task
// token orbits; each refutation burns a retry pip; the greenwash scanner
// bounces a "|| true" escape; and when the budget is spent the project state
// panel flips loudly to invalid_loop and the ring freezes.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { LoopRing } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const RING = { cx: 430, cy: 330, r: 170 };
const STOPS = [
  { label: 'pick top task', color: colors.ACCENT },
  { label: 'builder', color: colors.SECONDARY },
  { label: 'claim + evidence', color: colors.SECONDARY },
  { label: 'critic', color: colors.NEGATIVE },
  { label: 'verdict', color: colors.WARM },
];
const PIPS = { x: 700, y: 160 };
const STATE = { x: 760, y: 240, w: 420, h: 210 };
const SCAN = { x: 740, y: 480, w: 460, h: 110 };

const CAM_RING: CameraState = { x: 470, y: 330, k: 1.2 };
const CAM_STATE: CameraState = { x: 900, y: 330, k: 1.25 };
const CAM_SCAN: CameraState = { x: 900, y: 480, k: 1.3 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 1.0 };

/** The four real invalid_loop triggers from .eforest/loop.md. */
const TRIGGERS = [
  'refuted past the retry budget',
  'a gate only goes green if weakened',
  'the board is lying (roadmap audit)',
  'same finding refutes twice — thrash',
];

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ringU: ChannelRef<number>;
  orbitU: ChannelRef<number>; // laps around the loop
  pipsU: ChannelRef<number>;
  pip1: ChannelRef<number>; // retry pips burning
  pip2: ChannelRef<number>;
  stateU: ChannelRef<number>;
  scanU: ChannelRef<number>;
  escU: ChannelRef<number>; // the "|| true" escape approaching
  bounceU: ChannelRef<number>; // scanner bounce
  trigU: ChannelRef<number>; // trigger list
  flipU: ChannelRef<number>; // building → invalid_loop
  ringDim: ChannelRef<number>;
  humanU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const orbitU = tl.channel('orbitU', 0);
  const pipsU = tl.channel('pipsU', 0);
  const pip1 = tl.channel('pip1', 0);
  const pip2 = tl.channel('pip2', 0);
  const stateU = tl.channel('stateU', 0);
  const scanU = tl.channel('scanU', 0);
  const escU = tl.channel('escU', 0);
  const bounceU = tl.channel('bounceU', 0);
  const trigU = tl.channel('trigU', 0);
  const flipU = tl.channel('flipU', 0);
  const ringDim = tl.channel('ringDim', 0);
  const humanU = tl.channel('humanU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the loop as a ring —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Zoom out and the whole thing is one loop: take the top task, build, submit the claim and the evidence, face the critic, get a verdict. Then do it again.',
  });
  tl.tween(cam, CAM_RING, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(ringU, 1, { at: 1.2, dur: 2.2, ease: ease.draw });
  tl.tween(orbitU, 1, { at: 3.8, dur: 3.0, ease: ease.linear });
  tl.hold(7.0, 0.6);

  // — Beat 2 · refuted loops back —
  tl.caption({
    at: 7.6,
    dur: 6.5,
    text: 'A refuted task is not a dead task. It loops back to the builder with the critic’s report as fresh context, and the builder reworks and re-records.',
  });
  tl.tween(orbitU, 2, { at: 8.0, dur: 4.5, ease: ease.linear });
  tl.hold(14.1, 0.6);

  // — Beat 3 · but the budget is finite —
  tl.caption({
    at: 14.7,
    dur: 7,
    text: 'But the loop carries a budget. The work queue allows two reworks per task by default — each refutation burns one — and it will not spend a third on wishful thinking.',
  });
  tl.tween(pipsU, 1, { at: 15.2, dur: 0.8, ease: ease.enter });
  tl.tween(orbitU, 3, { at: 16.0, dur: 3.0, ease: ease.linear });
  tl.tween(pip1, 1, { at: 17.2, dur: 0.5, ease: ease.pop });
  tl.tween(pip2, 1, { at: 19.6, dur: 0.5, ease: ease.pop });
  tl.hold(21.7, 0.6);

  // — Beat 4 · thrash detection —
  tl.caption({
    at: 22.3,
    dur: 6.5,
    text: 'It also watches for thrashing: if the critic refutes twice with the identical finding set, the rework is not converging, and no third identical attempt is allowed.',
  });
  tl.hold(28.8, 0.6);

  // — Beat 5 · the project states —
  tl.caption({
    at: 29.4,
    dur: 7,
    text: 'Because the project itself has a state, committed next to the code. Building means the queue has honest work. Complete means every task is verified. Paused means a human said stop.',
  });
  tl.tween(cam, CAM_STATE, { at: 29.6, dur: 1.4, ease: ease.move });
  tl.tween(stateU, 1, { at: 30.4, dur: 1.2, ease: ease.enter });
  tl.hold(36.4, 0.6);

  // — Beat 6 · the greenwash scanner —
  tl.caption({
    at: 37.0,
    dur: 7.5,
    text: 'And the fourth state guards against the oldest temptation: making a red gate green by weakening it. A scanner walks every verify path hunting for silenced failures — the always true escape, the swallowed exit code, the skipped test.',
  });
  tl.tween(cam, CAM_SCAN, { at: 37.2, dur: 1.4, ease: ease.move });
  tl.tween(scanU, 1, { at: 38.0, dur: 1.2, ease: ease.draw });
  tl.tween(escU, 1, { at: 40.4, dur: 1.6, ease: ease.linear });
  tl.tween(bounceU, 1, { at: 42.2, dur: 0.8, ease: ease.pop });
  tl.hold(45.1, 0.6);

  // — Beat 7 · the triggers —
  tl.caption({
    at: 45.7,
    dur: 7.5,
    text: 'So four things can trip the alarm: a task refuted past its budget, a gate that only passes when weakened, a roadmap audit that catches the board lying, or the same finding thrashing twice.',
  });
  tl.tween(cam, CAM_STATE, { at: 45.9, dur: 1.3, ease: ease.move });
  tl.tween(trigU, 1, { at: 46.6, dur: 3.2, ease: ease.draw });
  tl.hold(53.8, 0.6);

  // — Beat 8 · the flip —
  tl.caption({
    at: 54.4,
    dur: 7,
    text: 'When any of them fires, the loop does the only honest thing left: it flips the project to invalid loop, writes down exactly why, commits, and freezes.',
  });
  tl.tween(flipU, 1, { at: 55.2, dur: 1.0, ease: ease.pop });
  tl.tween(ringDim, 1, { at: 55.6, dur: 1.2, ease: ease.move });
  tl.hold(61.0, 0.6);

  // — Beat 9 · a loud stop for a human —
  tl.caption({
    at: 61.6,
    dur: 7,
    text: 'That state is a loud stop for a human. The loop must not resume itself, and it must never route around the stop — routing around it would itself refute the loop.',
  });
  tl.tween(cam, CAM_WIDE, { at: 61.8, dur: 1.4, ease: ease.move });
  tl.tween(humanU, 1, { at: 62.6, dur: 0.9, ease: ease.enter });
  tl.hold(68.2, 0.6);

  // — Beat 10 · close —
  tl.caption({
    at: 68.8,
    dur: 6.5,
    text: 'A loop that can say I am stuck, out loud, in writing, is a loop you can leave running. The alternative — an agent quietly lowering the bar until everything passes — is how boards start lying.',
  });
  tl.tween(endDim, 1, { at: 69.1, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 70.0, dur: 0.9, ease: ease.enter });
  tl.hold(74.8, 1.2);

  return {
    tl, cam, ringU, orbitU, pipsU, pip1, pip2, stateU, scanU, escU,
    bounceU, trigU, flipU, ringDim, humanU, endDim, endU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

const STATES = ['building', 'complete', 'paused', 'invalid_loop'];

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ringU = s.get(scene.ringU);
  const orbitU = s.get(scene.orbitU);
  const pipsU = s.get(scene.pipsU);
  const pip1 = s.get(scene.pip1);
  const pip2 = s.get(scene.pip2);
  const stateU = s.get(scene.stateU);
  const scanU = s.get(scene.scanU);
  const escU = s.get(scene.escU);
  const bounceU = s.get(scene.bounceU);
  const trigU = s.get(scene.trigU);
  const flipU = s.get(scene.flipU);
  const ringDim = s.get(scene.ringDim);
  const humanU = s.get(scene.humanU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const worldOp = 1 - 0.85 * endDim;

  // the escape token rides toward the scanner, then bounces back
  const escX = SCAN.x + 40 + (bounceU > 0 ? (1 - bounceU) * 160 : escU * 160);
  const escOp = escU > 0 ? Math.min(1, escU * 3) * (bounceU >= 1 ? 0 : 1) : 0;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the loop ring ---- */}
          <LoopRing
            cx={RING.cx}
            cy={RING.cy}
            r={RING.r}
            stops={STOPS}
            u={ringDim > 0.5 ? 0 : orbitU}
            reveal={ringU}
            color={colors.ACCENT}
            dim={ringDim}
            labelSize={13}
          />
          {ringU > 0.9 && (
            <text x={RING.cx} y={RING.cy + 6} textAnchor="middle" fill={ringDim > 0.5 ? colors.NEGATIVE : colors.MUTED} fontSize={12.5} fontFamily={MONO} opacity={0.9}>
              {ringDim > 0.5 ? 'loop frozen' : 'work-queue — the gauntlet, looped'}
            </text>
          )}

          {/* ---- the retry budget pips ---- */}
          {pipsU > 0 && (
            <g opacity={pipsU * (1 - 0.6 * ringDim)} transform={`translate(${PIPS.x} ${PIPS.y})`}>
              <text x={0} y={-14} fill={colors.MUTED} fontSize={12}>
                rework budget
              </text>
              {[0, 1].map((i) => {
                const burned = i === 0 ? pip1 : pip2;
                return (
                  <g key={i}>
                    <circle cx={i * 34} cy={8} r={11} fill={burned > 0.5 ? colors.NEGATIVE : colors.PANEL} stroke={burned > 0.5 ? colors.NEGATIVE : colors.MUTED} strokeWidth={2} opacity={burned > 0.5 ? 0.9 : 1} />
                    {burned > 0.5 && (
                      <g stroke={colors.BG} strokeWidth={2} strokeLinecap="round" opacity={burned}>
                        <line x1={i * 34 - 4} y1={4} x2={i * 34 + 4} y2={12} />
                        <line x1={i * 34 + 4} y1={4} x2={i * 34 - 4} y2={12} />
                      </g>
                    )}
                  </g>
                );
              })}
              <text x={76} y={13} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                maxRetries: 2
              </text>
            </g>
          )}

          {/* ---- the project state panel ---- */}
          {stateU > 0 && (
            <g opacity={stateU}>
              <rect x={STATE.x} y={STATE.y} width={STATE.w} height={STATE.h} rx={14} fill={colors.PANEL} stroke={flipU > 0.5 ? colors.NEGATIVE : colors.GRID} strokeWidth={flipU > 0.5 ? 2 : 1.5} />
              <text x={STATE.x + 18} y={STATE.y + 28} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                .eforest/project.json — status
              </text>
              {STATES.map((st, i) => {
                const active = flipU > 0.5 ? st === 'invalid_loop' : st === 'building';
                const color = st === 'invalid_loop' ? colors.NEGATIVE : st === 'complete' ? colors.POSITIVE : st === 'paused' ? colors.WARM : colors.ACCENT;
                return (
                  <g key={st} transform={`translate(${STATE.x + 18 + (i % 2) * 200} ${STATE.y + 52 + Math.floor(i / 2) * 44})`}>
                    <rect width={186} height={32} rx={9} fill={active ? color : 'none'} opacity={active ? 0.16 : 1} stroke={active ? color : colors.GRID} strokeWidth={active ? 1.8 : 1} />
                    <circle cx={18} cy={16} r={5} fill={active ? color : colors.GRID} />
                    <text x={34} y={21} fill={active ? colors.TEXT : colors.MUTED} fontSize={12.5} fontFamily={MONO} fontWeight={active ? 700 : 400}>
                      {st}
                    </text>
                  </g>
                );
              })}
              {flipU > 0.5 && (
                <text x={STATE.x + 18} y={STATE.y + 168} fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO} opacity={flipU}>
                  statusReason: “refuted twice with the identical finding set”
                </text>
              )}
              <text x={STATE.x + 18} y={STATE.y + 192} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={flipU}>
                committed — the stop is part of the history
              </text>
            </g>
          )}

          {/* ---- the invalid_loop triggers ---- */}
          {trigU > 0 && (
            <g opacity={trigU}>
              {TRIGGERS.map((t, i) => {
                const u = clamp01(trigU * (TRIGGERS.length + 1) - i);
                if (u <= 0) return null;
                return (
                  <g key={t} opacity={u} transform={`translate(${STATE.x} ${STATE.y - 116 + i * 26})`}>
                    <path d={`M 8 6 l 6 10 h -12 Z`} fill={colors.NEGATIVE} opacity={0.9} />
                    <text x={24} y={15} fill={colors.TEXT} fontSize={12}>
                      {t}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ---- the greenwash scanner ---- */}
          {scanU > 0 && (
            <g opacity={scanU}>
              <rect x={SCAN.x} y={SCAN.y} width={SCAN.w} height={SCAN.h} rx={14} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.6} />
              <text x={SCAN.x + 18} y={SCAN.y + 26} fill={colors.POSITIVE} fontSize={12} fontFamily={MONO} fontWeight={700}>
                tools/verify/self_check.sh — the greenwash scanner
              </text>
              <text x={SCAN.x + 18} y={SCAN.y + 48} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                bans: || true · || : · ; exit 0 · VERIFY_ALLOW_SKIP=1 · continue-on-error
              </text>
              {/* the scanner gate */}
              <line x1={SCAN.x + 260} y1={SCAN.y + 58} x2={SCAN.x + 260} y2={SCAN.y + 100} stroke={colors.POSITIVE} strokeWidth={2.5} />
              {/* the escape token */}
              {escOp > 0 && (
                <g opacity={escOp} transform={`translate(${escX} ${SCAN.y + 78})`}>
                  <rect x={-38} y={-13} width={76} height={26} rx={7} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
                  <text y={4.5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO} fontWeight={700}>
                    || true
                  </text>
                </g>
              )}
              {bounceU > 0.3 && (
                <text x={SCAN.x + 275} y={SCAN.y + 83} fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO} fontWeight={700} opacity={bounceU}>
                  REJECTED
                </text>
              )}
            </g>
          )}

          {/* ---- the human ---- */}
          {humanU > 0 && (
            <g opacity={humanU} transform={`translate(640 ${586 - (1 - humanU) * 10})`}>
              <rect x={-260} y={-24} width={520} height={40} rx={20} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
              <text y={2} textAnchor="middle" fill={colors.WARM} fontSize={13.5} fontWeight={700}>
                only a human flips it back to building
              </text>
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={310} y={262} width={660} height={124} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              bounded retries · honest states · a loud stop
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              the loop would rather halt than lie
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
