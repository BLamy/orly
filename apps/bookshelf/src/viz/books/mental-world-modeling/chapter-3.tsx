// Model the Mind - chapter 3: Fork Every Possible Future.
//
// Grounded in arXiv:2607.27201 Figure 5 and Sections 5.1-5.5, plus
// mentis/engine.py _decompose_actions, _simulate_branch, _score_branches,
// gather_limited usage, and the returned successor_states/error fields.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const BRANCHES = [
  { id: 'A', action: 'hide the folder', physical: 'moves folder', mental: 'conceals location', color: colors.ACCENT },
  { id: 'C', action: 'redirect Bob', physical: 'speaks + points', mental: 'misleads search', color: colors.POSITIVE },
  { id: 'E', action: 'hand it over', physical: 'hands folder', mental: 'reveals location', color: colors.WARM },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const optionsU = tl.channel('optionsU', 0);
  const splitU = tl.channel('splitU', 0);
  const fanU = tl.channel('fanU', 0);
  const physicalU = tl.channel('physicalU', 0);
  const mentalU = tl.channel('mentalU', 0);
  const mergeU = tl.channel('mergeU', 0);
  const inspectU = tl.channel('inspectU', 0);
  const failureU = tl.channel('failureU', 0);
  const scoringU = tl.channel('scoringU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.2, text: 'Mentis does not choose from the option text first. It opens a separate future for every candidate action.' });
  tl.tween(optionsU, 1, { at: 0.9, dur: 1.5, ease: ease.enter });
  tl.tween(cam, { x: 260, y: 370, k: 1.10 }, { at: 1.4, dur: 1.3, ease: ease.move });
  tl.hold(6.7, 0.7);

  tl.caption({ at: 7.4, dur: 6.3, text: 'Each option is decomposed into a physical carrier and a mental or social effect.' });
  tl.tween(splitU, 1, { at: 7.9, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 465, y: 370, k: 1.13 }, { at: 8.5, dur: 1.3, ease: ease.move });
  tl.hold(13.7, 0.7);

  tl.caption({ at: 14.4, dur: 6.0, text: 'The branch fan-out runs with a bounded concurrency limit, so the candidates advance without becoming one blended story.' });
  tl.tween(fanU, 1, { at: 14.9, dur: 3.0, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 15.3, dur: 1.3, ease: ease.move });
  tl.hold(20.4, 0.7);

  tl.caption({ at: 21.1, dur: 6.1, text: 'Inside every branch, the physical transition runs first: what moves, who speaks, and what the environment permits.' });
  tl.tween(physicalU, 1, { at: 21.6, dur: 2.4, ease: ease.draw });
  tl.tween(cam, { x: 740, y: 370, k: 1.11 }, { at: 22.0, dur: 1.3, ease: ease.move });
  tl.hold(27.2, 0.7);

  tl.caption({ at: 27.9, dur: 6.3, text: 'That predicted physical future becomes input to the mental transition, where beliefs, goals, emotions, and norms can change.' });
  tl.tween(mentalU, 1, { at: 28.4, dur: 2.5, ease: ease.draw });
  tl.tween(cam, { x: 915, y: 370, k: 1.12 }, { at: 28.8, dur: 1.3, ease: ease.move });
  tl.hold(34.2, 0.7);

  tl.caption({ at: 34.9, dur: 6.0, text: 'The two results rejoin as one successor world state for that option, never as an untraceable rationale.' });
  tl.tween(mergeU, 1, { at: 35.4, dur: 1.8, ease: ease.move });
  tl.tween(cam, { x: 1060, y: 370, k: 1.16 }, { at: 35.8, dur: 1.3, ease: ease.move });
  tl.hold(40.9, 0.7);

  tl.caption({ at: 41.6, dur: 6.1, text: 'Every surviving future is written into the successor states output, so a wrong choice can be inspected branch by branch.' });
  tl.tween(inspectU, 1, { at: 42.1, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 42.7, dur: 1.3, ease: ease.move });
  tl.hold(47.7, 0.7);

  tl.caption({ at: 48.4, dur: 6.0, text: 'If one branch fails, its error is recorded while the remaining branches stay available for scoring.' });
  tl.tween(failureU, 1, { at: 48.9, dur: 0.7, ease: ease.pop });
  tl.tween(scoringU, 1, { at: 50.0, dur: 2.0, ease: ease.draw });
  tl.hold(54.4, 0.7);

  tl.caption({ at: 55.1, dur: 6.6, text: 'The design principle is strict: construct the future you are selecting before you select it.' });
  tl.tween(dimU, 1, { at: 55.6, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 56.4, dur: 0.7, ease: ease.enter });
  tl.hold(61.7, 1.0);

  return { tl, cam, optionsU, splitU, fanU, physicalU, mentalU, mergeU, inspectU, failureU, scoringU, dimU, endU };
}

const scene = buildScene();

function Box({ x, y, w, h, label, sublabel, color, u }: { x: number; y: number; w: number; h: number; label: string; sublabel?: string; color: string; u: number }) {
  const uu = clamp01(u);
  return <g opacity={uu} transform={`translate(${x} ${y}) scale(${0.84 + uu * 0.16}) translate(${-x} ${-y})`}>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={16} fill={colors.PANEL} stroke={color} strokeWidth={2} />
    <text x={x} y={y - (sublabel ? 7 : -5)} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={700}>{label}</text>
    {sublabel && <text x={x} y={y + 17} textAnchor="middle" fill={color} fontSize={10} fontFamily={MONO}>{sublabel}</text>}
  </g>;
}

function Rail({ y, color, u }: { y: number; color: string; u: number }) {
  const uu = clamp01(u);
  const x2 = lerp(230, 1120, uu);
  return <g>
    <line x1={230} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.26} />
    {uu > 0.002 && <>
      <circle cx={x2} cy={y} r={9} fill={color} />
      <circle cx={x2} cy={y} r={17} fill="none" stroke={color} opacity={0.28} />
    </>}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const optionsU = s.get(scene.optionsU);
  const splitU = s.get(scene.splitU);
  const fanU = s.get(scene.fanU);
  const physicalU = s.get(scene.physicalU);
  const mentalU = s.get(scene.mentalU);
  const mergeU = s.get(scene.mergeU);
  const dim = 1 - 0.9 * s.get(scene.dimU);

  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800}>Every option earns its own future</text>
      <text x={640} y={74} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>_decompose_actions → _simulate_branch → _score_branches</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        {BRANCHES.map((b, i) => {
          const y = 214 + i * 164;
          const branchU = clamp01(optionsU * BRANCHES.length - i);
          const splitP = clamp01(splitU * BRANCHES.length - i);
          const physicalP = clamp01(physicalU * BRANCHES.length - i);
          const mentalP = clamp01(mentalU * BRANCHES.length - i);
          const mergeP = clamp01(mergeU * BRANCHES.length - i);
          const failed = i === 0 && s.get(scene.failureU) > 0;
          return <g key={b.id} opacity={failed ? 0.24 : 1}>
            <Rail y={y} color={b.color} u={fanU} />
            <Box x={128} y={y} w={150} h={72} label={`option ${b.id}`} sublabel={b.action} color={b.color} u={branchU} />
            <text x={222} y={y - 18} fill={colors.MUTED} fontSize={11} opacity={splitP}>split</text>
            <path d={`M205 ${y} C245 ${y} 250 ${y - 38} 286 ${y - 38}`} fill="none" stroke={colors.ACCENT} strokeWidth={2.5} opacity={splitP} />
            <path d={`M205 ${y} C245 ${y} 250 ${y + 38} 286 ${y + 38}`} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={splitP} />
            <Box x={382} y={y - 38} w={178} h={54} label={b.physical} sublabel="physical_action" color={colors.ACCENT} u={splitP} />
            <Box x={382} y={y + 38} w={178} h={54} label={b.mental} sublabel="mental_action" color={colors.WARM} u={splitP} />
            <Box x={672} y={y} w={178} h={74} label="physical future" sublabel="PhysicalState" color={colors.ACCENT} u={physicalP} />
            <path d={`M470 ${y - 38} C540 ${y - 38} 560 ${y} 580 ${y}`} fill="none" stroke={colors.ACCENT} strokeWidth={3} opacity={physicalP} />
            <Box x={884} y={y} w={176} h={74} label="mental future" sublabel="MentalState" color={colors.WARM} u={mentalP} />
            <path d={`M760 ${y} H796`} stroke={colors.ACCENT} strokeWidth={3} opacity={mentalP} />
            <path d={`M470 ${y + 38} C600 ${y + 38} 720 ${y + 28} 796 ${y + 12}`} fill="none" stroke={colors.WARM} strokeWidth={3} opacity={mentalP} />
            <Box x={1094} y={y} w={168} h={82} label="successor state" sublabel={`successor_states[${b.id}]`} color={b.color} u={mergeP} />
            <path d={`M972 ${y} H1010`} stroke={b.color} strokeWidth={4} opacity={mergeP} />
            {failed && <g transform={`translate(1094 ${y})`} opacity={s.get(scene.failureU)}>
              <circle r={34} fill={colors.NEGATIVE} opacity={0.2} />
              <path d="M-13 -13 L13 13 M13 -13 L-13 13" stroke={colors.NEGATIVE} strokeWidth={6} strokeLinecap="round" />
              <text y={58} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>branch.error</text>
            </g>}
          </g>;
        })}

        <g opacity={s.get(scene.inspectU)} transform="translate(430 110)">
          <rect width={420} height={62} rx={15} fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text x={210} y={24} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>result payload</text>
          <text x={210} y={46} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>successor_states · score_table · decision_trace</text>
        </g>

        <g opacity={s.get(scene.scoringU)} transform="translate(470 604)">
          <line x1={0} y1={0} x2={340} y2={0} stroke={colors.GRID} strokeWidth={3} />
          <text x={170} y={-14} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>surviving branches → comparative scoring</text>
        </g>
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={174} y={234} width={932} height={202} rx={26} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={850}>Simulate first. Select second.</text>
      <text x={640} y={356} textAnchor="middle" fill={colors.ACCENT} fontSize={17}>physical carrier → physical future</text>
      <text x={640} y={390} textAnchor="middle" fill={colors.WARM} fontSize={17}>mental effect → mental future</text>
    </g>
  </>;
}

export const vizScene = () => scene;
