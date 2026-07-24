// The Harness Handbook (arXiv:2607.13285), chapter 1 — "Where does the behavior live?"
//
// Grounding: the paper frames behavior localization as the central bottleneck
// in harness evolution. A modern agent's harness (Fig. 2's Source Repository:
// agent-harness/, planner.py, executor.py, memory.py, tools/, parser.py)
// constructs prompts, manages state, invokes tools, and coordinates execution.
// To change ONE behavior you must first find where it lives — and a planner
// with no map sprays its attention across every file. That scatter is the cost.
//
// Centerpiece: a column of the real harness files; a modification request drops
// in; the planner fans attention to ALL of them (the baseline), lands nowhere,
// and a single true target pulses unseen. Camera pushes on the scatter.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// The real harness files (Fig. 2, Source Repository). The 4th is the one the
// request actually touches — the "true target" nobody can point to yet.
const FILES = [
  { name: 'agent-harness/', y: 150 },
  { name: 'planner.py', y: 214 },
  { name: 'executor.py', y: 278 },
  { name: 'memory.py', y: 342, target: true },
  { name: 'tools/', y: 406 },
  { name: 'parser.py', y: 470 },
] as const;
const FILE_X = 300;
const PLANNER = { x: 880, y: 310 };

// Precompute a scatter of attention rays from the planner to every file — the
// baseline "read everything" behavior. Seeded → scrub-exact.
const rand = mulberry32(2607_13285);
const RAYS = Array.from({ length: 54 }, (_, i) => ({
  file: i % FILES.length,
  delay: rand(),
  jitter: (rand() - 0.5) * 26,
}));

const CAM_WALL: CameraState = { x: 560, y: 320, k: 1.12 };
const CAM_SCATTER: CameraState = { x: 620, y: 320, k: 1.05 };
const CAM_TARGET: CameraState = { x: 360, y: 342, k: 1.5 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  wallU: ChannelRef<number>;
  reqU: ChannelRef<number>;
  scatterU: ChannelRef<number>;
  lostU: ChannelRef<number>;
  targetU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const wallU = tl.channel('wallU', 0); // files slide in
  const reqU = tl.channel('reqU', 0); // modification request drops in
  const scatterU = tl.channel('scatterU', 0); // attention sprays everywhere
  const lostU = tl.channel('lostU', 0); // the "?" — localization fails
  const targetU = tl.channel('targetU', 0); // the true file pulses, unseen
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the harness is a living codebase —
  tl.caption({
    at: 0.4,
    dur: 6.5,
    text: "A modern agent is more than its model. Around it sits the harness: the code that builds prompts, holds state, calls tools, and keeps the whole loop running.",
  });
  tl.tween(cam, CAM_WALL, { at: 0.6, dur: 1.5, ease: ease.move });
  tl.tween(wallU, 1, { at: 0.8, dur: 2.0, ease: ease.draw });
  tl.hold(7.0, 0.6);

  // — Beat 2 · a change request arrives —
  tl.caption({
    at: 7.6,
    dur: 6.2,
    text: "And this harness keeps changing. Someone files a request: adjust how the agent remembers past tool results. Simple to say — but where in all of this does that behavior actually live?",
  });
  tl.tween(reqU, 1, { at: 8.0, dur: 1.0, ease: ease.pop });
  tl.hold(13.8, 0.5);

  // — Beat 3 · the baseline sprays attention —
  tl.caption({
    at: 14.4,
    dur: 6.6,
    text: "With no map of itself, the planner does the only thing it can. It reads everything, spreading its attention across every file at once, hoping the right lines are somewhere in the flood.",
  });
  tl.tween(cam, CAM_SCATTER, { at: 14.6, dur: 1.3, ease: ease.move });
  tl.tween(scatterU, 1, { at: 15.0, dur: 4.6, ease: ease.linear });
  tl.hold(21.0, 0.5);

  // — Beat 4 · localization fails —
  tl.caption({
    at: 21.6,
    dur: 6.4,
    text: "This is the real bottleneck the paper names: behavior localization. Attention everywhere is attention nowhere. Tokens burn, and the planner still can't say which file to open.",
  });
  tl.tween(lostU, 1, { at: 22.0, dur: 0.8, ease: ease.pop });
  tl.hold(28.0, 0.5);

  // — Beat 5 · the true target, hidden in plain sight —
  tl.caption({
    at: 28.6,
    dur: 6.2,
    text: "The change lived in one place all along — the memory module. The trouble was never the edit. It was finding the edit inside a system that had no readable map of its own behavior.",
  });
  tl.tween(scatterU, 0.12, { at: 28.8, dur: 1.0, ease: ease.move });
  tl.tween(lostU, 0.1, { at: 28.8, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_TARGET, { at: 29.0, dur: 1.5, ease: ease.move });
  tl.tween(targetU, 1, { at: 30.0, dur: 1.0, ease: ease.pop });
  tl.hold(34.8, 0.6);

  // — Beat 6 · close / the promise —
  tl.caption({
    at: 35.4,
    dur: 6.2,
    text: "So the Harness Handbook gives the system that map: one readable, navigable guide to its own behavior. Next, we open it — and watch a wall of code become three clean levels.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 35.6, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 36.2, dur: 1.2, ease: ease.enter });
  tl.hold(41.6, 1.4);

  return { tl, cam, wallU, reqU, scatterU, lostU, targetU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const wallU = s.get(scene.wallU);
  const reqU = s.get(scene.reqU);
  const scatterU = s.get(scene.scatterU);
  const lostU = s.get(scene.lostU);
  const targetU = s.get(scene.targetU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.9;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the wall of harness files ---- */}
        {FILES.map((f, i) => {
          const u = clamp01(wallU * FILES.length * 1.1 - i);
          if (u <= 0) return null;
          const isTarget = 'target' in f && f.target;
          const pulse = isTarget ? targetU : 0;
          const stroke = pulse > 0.05 ? colors.ACCENT : colors.GRID;
          return (
            <g key={i} opacity={u * dimAll} transform={`translate(${lerp(-40, 0, u)} 0)`}>
              <rect
                x={FILE_X - 130}
                y={f.y - 24}
                width={260}
                height={48}
                rx={9}
                fill={colors.PANEL}
                stroke={stroke}
                strokeWidth={pulse > 0.05 ? 1.4 + pulse * 1.6 : 1.2}
                opacity={pulse > 0.05 ? 1 : 0.9}
              />
              <text
                x={FILE_X - 108}
                y={f.y + 6}
                fill={pulse > 0.05 ? colors.ACCENT : colors.TEXT}
                fontSize={16}
                fontFamily="ui-monospace, monospace"
              >
                {f.name}
              </text>
              {isTarget && pulse > 0.05 && (
                <text x={FILE_X + 150} y={f.y + 6} fill={colors.ACCENT} fontSize={13} opacity={pulse}>
                  ← the behavior lived here
                </text>
              )}
            </g>
          );
        })}

        {/* ---- the planner ---- */}
        <g opacity={reqU * dimAll}>
          <rect x={PLANNER.x - 92} y={PLANNER.y - 44} width={184} height={88} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.8} />
          <text x={PLANNER.x} y={PLANNER.y - 12} textAnchor="middle" fill={colors.SECONDARY} fontSize={15}>
            planner
          </text>
          <text x={PLANNER.x} y={PLANNER.y + 12} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            "where do I edit?"
          </text>
          {/* the modification request card */}
          <g opacity={clamp01(reqU * 1.4)} transform={`translate(${PLANNER.x - 92} ${PLANNER.y - 118})`}>
            <rect x={0} y={0} width={184} height={54} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
            <text x={92} y={22} textAnchor="middle" fill={colors.WARM} fontSize={12}>
              modification request
            </text>
            <text x={92} y={40} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              "change how memory is kept"
            </text>
          </g>
        </g>

        {/* ---- attention scatter (the baseline: read everything) ---- */}
        {scatterU > 0 &&
          RAYS.map((ray, i) => {
            const u = clamp01((scatterU - ray.delay * 0.7) * 2.6);
            if (u <= 0 || u >= 1) return null;
            const f = FILES[ray.file];
            const tx = FILE_X + 130;
            const ty = f.y + ray.jitter;
            return (
              <circle
                key={i}
                cx={lerp(PLANNER.x - 92, tx, u)}
                cy={lerp(PLANNER.y, ty, u)}
                r={3}
                fill={colors.SECONDARY}
                opacity={0.5 * (1 - u) + 0.15}
              />
            );
          })}

        {/* ---- the "?" of failed localization ---- */}
        <g opacity={lostU * dimAll}>
          <text x={PLANNER.x} y={PLANNER.y + 92} textAnchor="middle" fill={colors.NEGATIVE} fontSize={40} fontWeight={700}>
            ?
          </text>
          <text x={PLANNER.x} y={PLANNER.y + 122} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>
            attention everywhere = nowhere
          </text>
        </g>

        {/* ---- closing line ---- */}
        <g opacity={closeU}>
          <text x={640} y={330} textAnchor="middle" fill={colors.TEXT} fontSize={26}>
            behavior localization
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            the bottleneck a Handbook is built to remove
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
