// Model the Mind - chapter 1: The Right Scene, the Wrong Action.
//
// Grounded in arXiv:2607.27201 Figures 1-2 and Sections 1 and 3, plus
// mentis/schema.py WorldState, PhysicalState, MentalState and
// mentis/prompts.py state_prompt. The mug example is the paper's Figure 2.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const roomU = tl.channel('roomU', 0);
  const targetU = tl.channel('targetU', 0);
  const mugMove = tl.channel('mugMove', 0);
  const attention = tl.channel('attention', 0);
  const mentalU = tl.channel('mentalU', 0);
  const beliefPulse = tl.channel('beliefPulse', 0);
  const physicalGuess = tl.channel('physicalGuess', 0);
  const physicalFail = tl.channel('physicalFail', 0);
  const coupledU = tl.channel('coupledU', 0);
  const beliefGuess = tl.channel('beliefGuess', 0);
  const schemaU = tl.channel('schemaU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.1, text: 'A room can look perfectly clear and still hide the variable that decides what a person does next.' });
  tl.tween(roomU, 1, { at: 0.9, dur: 1.4, ease: ease.draw });
  tl.tween(targetU, 1, { at: 1.8, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.06 }, { at: 2.1, dur: 1.3, ease: ease.move });
  tl.hold(6.6, 0.7);

  tl.caption({ at: 7.3, dur: 6.2, text: 'The mug begins on the desk. Then someone moves it to the cabinet while the target looks away.' });
  tl.tween(attention, 1, { at: 7.8, dur: 0.7, ease: ease.enter });
  tl.tween(mugMove, 1, { at: 9.0, dur: 2.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 350, k: 1.14 }, { at: 9.3, dur: 1.3, ease: ease.move });
  tl.hold(13.5, 0.7);

  tl.caption({ at: 14.2, dur: 6.0, text: 'The physical state updates immediately. The cabinet now contains the mug.' });
  tl.tween(cam, { x: 700, y: 334, k: 1.04 }, { at: 14.7, dur: 1.3, ease: ease.move });
  tl.hold(20.2, 0.7);

  tl.caption({ at: 20.9, dur: 6.2, text: 'But the target’s belief does not move with it. In their mental state, the mug is still on the desk.' });
  tl.tween(mentalU, 1, { at: 21.4, dur: 1.3, ease: ease.draw });
  tl.tween(beliefPulse, 1, { at: 23.0, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 420, k: 1.08 }, { at: 23.2, dur: 1.3, ease: ease.move });
  tl.hold(27.1, 0.7);

  tl.caption({ at: 27.8, dur: 6.0, text: 'A physical-only model follows the object and predicts a search at the cabinet.' });
  tl.tween(physicalGuess, 1, { at: 28.3, dur: 1.8, ease: ease.move });
  tl.tween(physicalFail, 1, { at: 31.0, dur: 0.6, ease: ease.pop });
  tl.hold(33.8, 0.7);

  tl.caption({ at: 34.5, dur: 6.3, text: 'Mental world modeling couples both layers, so the predicted action follows what the target believes.' });
  tl.tween(coupledU, 1, { at: 35.0, dur: 1.4, ease: ease.draw });
  tl.tween(physicalGuess, 0.12, { at: 35.2, dur: 1.0, ease: ease.move });
  tl.tween(beliefGuess, 1, { at: 36.3, dur: 1.8, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 37.0, dur: 1.3, ease: ease.move });
  tl.hold(40.8, 0.7);

  tl.caption({ at: 41.5, dur: 6.1, text: 'Mentis makes the split explicit with typed physical state and mental state inside one world state.' });
  tl.tween(schemaU, 1, { at: 42.0, dur: 1.2, ease: ease.enter });
  tl.hold(47.6, 0.7);

  tl.caption({ at: 48.3, dur: 6.5, text: 'The next action becomes predictable for the right reason: the model tracks the world and the world as the target understands it.' });
  tl.tween(dimU, 1, { at: 48.8, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 49.6, dur: 0.7, ease: ease.enter });
  tl.hold(54.8, 1.0);

  return { tl, cam, roomU, targetU, mugMove, attention, mentalU, beliefPulse, physicalGuess, physicalFail, coupledU, beliefGuess, schemaU, dimU, endU };
}

const scene = buildScene();

function Mug({ x, y, opacity = 1, glow = 0 }: { x: number; y: number; opacity?: number; glow?: number }) {
  return <g transform={`translate(${x} ${y})`} opacity={opacity}>
    <circle r={26 + glow * 8} fill={colors.WARM} opacity={0.12 + glow * 0.16} />
    <path d="M-15 -12 H12 V12 Q12 22 0 22 H-5 Q-15 22 -15 12 Z" fill={colors.WARM} />
    <path d="M12 -5 Q28 -5 24 10 Q21 18 12 14" fill="none" stroke={colors.WARM} strokeWidth={5} />
  </g>;
}

function Place({ x, label, color }: { x: number; label: string; color: string }) {
  return <g>
    <rect x={x - 112} y={214} width={224} height={176} rx={22} fill={colors.PANEL} stroke={color} strokeWidth={2} />
    <text x={x} y={248} textAnchor="middle" fill={color} fontSize={14} fontFamily={MONO}>{label}</text>
    <line x1={x - 76} y1={336} x2={x + 76} y2={336} stroke={colors.GRID} strokeWidth={6} strokeLinecap="round" />
  </g>;
}

function SearchDot({ fromX, toX, u, y, color, label }: { fromX: number; toX: number; u: number; y: number; color: string; label: string }) {
  const uu = clamp01(u);
  if (uu <= 0.002) return null;
  const x = lerp(fromX, toX, uu);
  return <g opacity={uu > 0 ? 1 : 0}>
    <circle cx={x} cy={y} r={12} fill={color} />
    <circle cx={x} cy={y} r={21} fill="none" stroke={color} opacity={0.3} />
    <text x={x} y={y - 28} textAnchor="middle" fill={color} fontSize={12} fontFamily={MONO}>{label}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const roomU = s.get(scene.roomU);
  const move = s.get(scene.mugMove);
  const mentalU = s.get(scene.mentalU);
  const dim = 1 - 0.9 * s.get(scene.dimU);
  const mugX = lerp(340, 920, move);
  const targetAngle = s.get(scene.attention) * 180;

  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={50} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800}>The right scene can produce the wrong action</text>
      <text x={640} y={76} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>one world · two coupled state channels</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim * roomU}>
        <Place x={340} label="desk" color={colors.ACCENT} />
        <Place x={920} label="cabinet" color={colors.SECONDARY} />
        <Mug x={mugX} y={310} />

        <g opacity={s.get(scene.targetU)} transform="translate(640 318)">
          <circle cy={-28} r={21} fill={colors.POSITIVE} />
          <path d="M0 -5 V58 M0 12 L-32 38 M0 12 L32 38 M0 58 L-24 92 M0 58 L24 92" stroke={colors.POSITIVE} strokeWidth={9} strokeLinecap="round" />
          <path d={`M-4 -30 L${Math.cos((targetAngle * Math.PI) / 180) * 42} ${-30 + Math.sin((targetAngle * Math.PI) / 180) * 42}`} stroke={colors.TEXT} strokeWidth={3} strokeLinecap="round" />
          <text y={124} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>target agent</text>
        </g>

        <g transform="translate(140 448)">
          <rect width={1000} height={62} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
          <text x={22} y={24} fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>physical_state</text>
          <text x={22} y={46} fill={colors.TEXT} fontSize={14}>mug position</text>
          <line x1={240} y1={36} x2={834} y2={36} stroke={colors.GRID} strokeWidth={5} strokeLinecap="round" />
          <circle cx={lerp(300, 790, move)} cy={36} r={10} fill={colors.ACCENT} />
          <text x={300} y={22} textAnchor="middle" fill={colors.MUTED} fontSize={11}>desk</text>
          <text x={790} y={22} textAnchor="middle" fill={colors.MUTED} fontSize={11}>cabinet</text>
        </g>

        <g transform="translate(140 528)" opacity={mentalU}>
          <rect width={1000} height={62} rx={16} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2 + s.get(scene.beliefPulse) * 1.5} />
          <text x={22} y={24} fill={colors.WARM} fontSize={12} fontFamily={MONO}>mental_state</text>
          <text x={22} y={46} fill={colors.TEXT} fontSize={14}>target belief</text>
          <line x1={240} y1={36} x2={834} y2={36} stroke={colors.GRID} strokeWidth={5} strokeLinecap="round" />
          <circle cx={300} cy={36} r={10 + s.get(scene.beliefPulse) * 4} fill={colors.WARM} />
          <text x={300} y={22} textAnchor="middle" fill={colors.MUTED} fontSize={11}>desk</text>
          <text x={790} y={22} textAnchor="middle" fill={colors.MUTED} fontSize={11}>cabinet</text>
        </g>

        <path d="M134 478 C95 500 95 538 134 560" fill="none" stroke={colors.POSITIVE} strokeWidth={3} opacity={s.get(scene.coupledU)} />
        <text x={70} y={523} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily={MONO} opacity={s.get(scene.coupledU)}>WorldState</text>

        <SearchDot fromX={640} toX={920} y={188} u={s.get(scene.physicalGuess)} color={colors.NEGATIVE} label="physical-only guess" />
        <SearchDot fromX={640} toX={340} y={188} u={s.get(scene.beliefGuess)} color={colors.POSITIVE} label="belief-grounded guess" />
        <g opacity={s.get(scene.physicalFail)} transform="translate(920 150)">
          <circle r={25} fill={colors.NEGATIVE} opacity={0.2} />
          <path d="M-10 -10 L10 10 M10 -10 L-10 10" stroke={colors.NEGATIVE} strokeWidth={5} strokeLinecap="round" />
        </g>

        <g opacity={s.get(scene.schemaU)} transform="translate(388 102)">
          <rect width={504} height={58} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={252} y={23} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>mentis/schema.py</text>
          <text x={252} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>WorldState(physical_state, mental_state)</text>
        </g>
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={190} y={236} width={900} height={196} rx={26} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={36} fontWeight={850}>One world state, two coupled truths</text>
      <text x={640} y={350} textAnchor="middle" fill={colors.ACCENT} fontSize={19}>where the mug is</text>
      <text x={640} y={384} textAnchor="middle" fill={colors.WARM} fontSize={19}>where the target believes it is</text>
    </g>
  </>;
}

export const vizScene = () => scene;
