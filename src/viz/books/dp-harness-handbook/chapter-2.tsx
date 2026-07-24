// The Harness Handbook (arXiv:2607.13285), chapter 2 — "Three clean levels."
//
// Grounding: Fig. 1 — the Handbook represents the harness with progressive
// disclosure across three levels: L1 System Overview (architecture, execution
// model, stage overview, global state flow), L2 Component Overview (the working
// units, their roles, inputs/outputs, dependencies), and L3 Unit Deep Dive
// (per-unit internal logic, state transitions, edge cases, code anchors). The
// spine is a shallow→deep gradient: read only as far down as the task needs.
//
// We show the authors' REAL Fig. 1 as the artifact, then animate the same three
// levels as a persistent spine the camera drills into, L1 → L2 → L3.
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
import { Figure } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const LEVELS = [
  {
    tag: 'L1',
    title: 'System Overview',
    x: 210,
    items: ['architecture', 'execution model', 'stage overview', 'global state flow'],
  },
  {
    tag: 'L2',
    title: 'Component Overview',
    x: 570,
    items: ['working units', 'roles & goals', 'inputs / outputs', 'dependencies'],
  },
  {
    tag: 'L3',
    title: 'Unit Deep Dive',
    x: 930,
    items: ['internal logic', 'state transitions', 'edge cases', 'code anchors'],
  },
] as const;
const CARD_W = 300;
const CARD_TOP = 168;

const CAM_FIG: CameraState = { x: 640, y: 300, k: 1.0 };
const CAM_SPINE: CameraState = { x: 640, y: 360, k: 1.02 };
const CAM_L1: CameraState = { x: 260, y: 340, k: 1.5 };
const CAM_L2: CameraState = { x: 620, y: 340, k: 1.5 };
const CAM_L3: CameraState = { x: 980, y: 340, k: 1.5 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  figU: ChannelRef<number>;
  spineU: ChannelRef<number>;
  l1U: ChannelRef<number>;
  l2U: ChannelRef<number>;
  l3U: ChannelRef<number>;
  depthU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_FIG, cameraInterp);
  const figU = tl.channel('figU', 0); // the real Fig. 1
  const spineU = tl.channel('spineU', 0); // the shallow→deep gradient arrow
  const l1U = tl.channel('l1U', 0);
  const l2U = tl.channel('l2U', 0);
  const l3U = tl.channel('l3U', 0);
  const depthU = tl.channel('depthU', 0); // gradient sweep along the spine
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the artifact itself —
  tl.caption({
    at: 0.4,
    dur: 6.4,
    text: "This is the Handbook the authors build for a harness. Not a summary bolted on top — a structured guide to the system's own behavior, laid out as three levels of zoom.",
  });
  tl.tween(figU, 1, { at: 0.6, dur: 1.4, ease: ease.enter });
  tl.hold(6.8, 0.6);

  // — Beat 2 · progressive disclosure, the spine —
  tl.caption({
    at: 7.4,
    dur: 6.0,
    text: "The idea is progressive disclosure. The same system, described shallow to deep, so a reader travels only as far down as the question in front of them demands.",
  });
  tl.tween(figU, 0.16, { at: 7.6, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_SPINE, { at: 7.6, dur: 1.3, ease: ease.move });
  tl.tween(spineU, 1, { at: 8.2, dur: 1.4, ease: ease.draw });
  tl.tween(depthU, 1, { at: 8.6, dur: 3.6, ease: ease.linear });
  tl.hold(13.4, 0.5);

  // — Beat 3 · L1 —
  tl.caption({
    at: 14.0,
    dur: 6.2,
    text: "Level one is the system overview: the architecture, the execution model, how state flows through the whole loop. Enough to orient, and nothing more.",
  });
  tl.tween(cam, CAM_L1, { at: 14.2, dur: 1.4, ease: ease.move });
  tl.tween(l1U, 1, { at: 14.8, dur: 1.2, ease: ease.enter });
  tl.hold(20.2, 0.5);

  // — Beat 4 · L2 —
  tl.caption({
    at: 20.8,
    dur: 6.2,
    text: "Drop to level two and the working units appear — each with its role, its inputs and outputs, and who it depends on. This is the map you navigate by.",
  });
  tl.tween(cam, CAM_L2, { at: 21.0, dur: 1.4, ease: ease.move });
  tl.tween(l2U, 1, { at: 21.6, dur: 1.2, ease: ease.enter });
  tl.hold(27.0, 0.5);

  // — Beat 5 · L3 —
  tl.caption({
    at: 27.6,
    dur: 6.4,
    text: "Only at level three do you open the unit itself: its internal logic, its state transitions and edge cases, and anchors pointing straight at the lines of code.",
  });
  tl.tween(cam, CAM_L3, { at: 27.8, dur: 1.4, ease: ease.move });
  tl.tween(l3U, 1, { at: 28.4, dur: 1.2, ease: ease.enter });
  tl.hold(34.0, 0.5);

  // — Beat 6 · the payoff —
  tl.caption({
    at: 34.6,
    dur: 6.2,
    text: "So localization stops being a search. Read L1 to place the behavior, follow L2 to the right unit, open L3 only there. Right information, right level, right amount.",
  });
  tl.tween(cam, CAM_SPINE, { at: 34.8, dur: 1.5, ease: ease.move });
  tl.hold(40.2, 0.5);

  // — Beat 7 · close —
  tl.caption({
    at: 40.8,
    dur: 5.6,
    text: "A readable map is worth little if it's wrong. So the next question is the hard one: how do you build this Handbook so it actually matches the code — and does it pay off?",
  });
  tl.tween(closeU, 1, { at: 41.0, dur: 1.2, ease: ease.enter });
  tl.hold(46.0, 1.2);

  return { tl, cam, figU, spineU, l1U, l2U, l3U, depthU, closeU };
}

const scene = buildScene();

function LevelCard({ i, u }: { i: number; u: number }) {
  const L = LEVELS[i];
  if (u <= 0) return null;
  const depthTint = [colors.ACCENT, colors.TEAL, colors.SECONDARY][i];
  return (
    <g opacity={u} transform={`translate(0 ${(1 - u) * 14})`}>
      <rect x={L.x - CARD_W / 2} y={CARD_TOP} width={CARD_W} height={300} rx={14} fill={colors.PANEL} stroke={depthTint} strokeWidth={1.6} />
      <rect x={L.x - CARD_W / 2 + 18} y={CARD_TOP + 20} width={40} height={26} rx={6} fill={depthTint} />
      <text x={L.x - CARD_W / 2 + 38} y={CARD_TOP + 38} textAnchor="middle" fill={colors.BG} fontSize={15} fontWeight={700}>
        {L.tag}
      </text>
      <text x={L.x - CARD_W / 2 + 74} y={CARD_TOP + 39} fill={colors.TEXT} fontSize={18}>
        {L.title}
      </text>
      {L.items.map((it, j) => {
        const iu = clamp01(u * 5 - 1 - j);
        return (
          <g key={j} opacity={iu}>
            <circle cx={L.x - CARD_W / 2 + 30} cy={CARD_TOP + 80 + j * 44} r={3.5} fill={depthTint} />
            <text x={L.x - CARD_W / 2 + 48} y={CARD_TOP + 85 + j * 44} fill={colors.MUTED} fontSize={15}>
              {it}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const figU = s.get(scene.figU);
  const spineU = s.get(scene.spineU);
  const l1U = s.get(scene.l1U);
  const l2U = s.get(scene.l2U);
  const l3U = s.get(scene.l3U);
  const depthU = s.get(scene.depthU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.9;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the shallow → deep spine ---- */}
        <g opacity={spineU * dimAll}>
          <defs>
            <linearGradient id="hh-depth" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={colors.POSITIVE} />
              <stop offset="50%" stopColor={colors.TEAL} />
              <stop offset="100%" stopColor={colors.SECONDARY} />
            </linearGradient>
          </defs>
          <rect x={110} y={506} width={1060 * clamp01(depthU)} height={8} rx={4} fill="url(#hh-depth)" opacity={0.9} />
          <text x={116} y={540} fill={colors.MUTED} fontSize={13}>
            shallow · high-level
          </text>
          <text x={1170} y={540} textAnchor="end" fill={colors.MUTED} fontSize={13}>
            deep · implementation
          </text>
        </g>

        {/* ---- the three animated levels ---- */}
        <g opacity={dimAll}>
          <LevelCard i={0} u={l1U} />
          <LevelCard i={1} u={l2U} />
          <LevelCard i={2} u={l3U} />
        </g>
        {/* connectors between levels */}
        {[0, 1].map((i) => {
          const u = i === 0 ? Math.min(l1U, l2U) : Math.min(l2U, l3U);
          if (u <= 0.05) return null;
          const x1 = LEVELS[i].x + CARD_W / 2;
          const x2 = LEVELS[i + 1].x - CARD_W / 2;
          return (
            <g key={i} opacity={u * dimAll}>
              <line x1={x1} y1={CARD_TOP + 34} x2={x2} y2={CARD_TOP + 34} stroke={colors.GRID} strokeWidth={1.4} />
              <path d={`M ${x2 - 12} ${CARD_TOP + 29} L ${x2} ${CARD_TOP + 34} L ${x2 - 12} ${CARD_TOP + 39} Z`} fill={colors.GRID} />
            </g>
          );
        })}

        {/* ---- the authors' real Fig. 1 ---- */}
        <Figure
          src="/generated/dp-harness-handbook/figures/fig-01.png"
          x={330}
          y={96}
          w={620}
          h={349}
          reveal={figU}
          opacity={figU}
          caption="Fig. 1 — the Harness Handbook: progressive disclosure, L1 → L3"
          accent={colors.ACCENT}
        />

        {/* ---- close ---- */}
        <g opacity={closeU}>
          <text x={640} y={330} textAnchor="middle" fill={colors.TEXT} fontSize={24}>
            right information, right level, right amount
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            but only if the map is true — how is it built?
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
