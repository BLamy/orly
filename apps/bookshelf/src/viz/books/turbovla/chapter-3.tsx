// Skip the Giant Model — chapter 3: Ask for Twelve Moves at Once.
//
// Grounded in arXiv:2607.27205 Section 4.3 and Figure 6;
// turbovla/models/turbovla.py StateProjector, ACTActionDecoder and forward;
// turbovla/evaluation/policy.py ACTION_CHUNK_SIZE/ACTION_DIM and chunk execution.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ACTIONS = Array.from({ length: 12 }, (_, i) => Array.from({ length: 7 }, (_, d) => Math.sin((i + 1) * 0.48 + d * 0.9) * (0.52 + d * 0.035)));
const HORIZON = [{ h: 8, score: 96.4 }, { h: 10, score: 96.9 }, { h: 12, score: 97.7 }, { h: 15, score: 95.6 }];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const memoryU = tl.channel('memoryU', 0);
  const stateU = tl.channel('stateU', 0);
  const queryU = tl.channel('queryU', 0);
  const decodeU = tl.channel('decodeU', 0);
  const vectorU = tl.channel('vectorU', 0);
  const ribbonU = tl.channel('ribbonU', 0);
  const executeU = tl.channel('executeU', 0);
  const horizonU = tl.channel('horizonU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.8, text: 'After fusion, enhanced visual tokens and enhanced instruction tokens form the decoder’s shared memory.' });
  tl.tween(memoryU, 1, { at: 0.9, dur: 1.6, ease: ease.enter });
  tl.hold(6.3, 0.6);

  tl.caption({ at: 6.9, dur: 5.7, text: 'Two projected robot-state tokens join only here, preserving the current embodiment without distracting the earlier visual grounding.' });
  tl.tween(stateU, 1, { at: 7.4, dur: 1.1, ease: ease.pop });
  tl.hold(12.6, 0.6);

  tl.caption({ at: 13.2, dur: 5.7, text: 'Above that memory sit twelve learned action queries, one slot for every future step in the action chunk.' });
  tl.tween(queryU, 1, { at: 13.7, dur: 1.8, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 302, k: 1.12 }, { at: 14.0, dur: 1.3, ease: ease.move });
  tl.hold(18.9, 0.6);

  tl.caption({ at: 19.5, dur: 5.8, text: 'All twelve queries read the same memory in parallel through a compact transformer decoder, instead of waiting for earlier action tokens.' });
  tl.tween(decodeU, 1, { at: 20.0, dur: 2.6, ease: ease.linear });
  tl.hold(25.3, 0.6);

  tl.caption({ at: 25.9, dur: 5.8, text: 'Each query becomes a seven-dimensional continuous action, bounded to the normalized action range by the final head.' });
  tl.tween(vectorU, 1, { at: 26.4, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 27.0, dur: 1.3, ease: ease.move });
  tl.hold(31.7, 0.6);

  tl.caption({ at: 32.3, dur: 5.7, text: 'The twelve vectors weave into one short motion ribbon, produced by a single forward pass and ready for denormalization.' });
  tl.tween(ribbonU, 1, { at: 32.8, dur: 2.0, ease: ease.draw });
  tl.hold(38.0, 0.6);

  tl.caption({ at: 38.6, dur: 5.7, text: 'Evaluation can execute the full ribbon or slice its first few moves, then ask the policy for another chunk from the new observation.' });
  tl.tween(executeU, 1, { at: 39.1, dur: 2.2, ease: ease.linear });
  tl.hold(44.3, 0.6);

  tl.caption({ at: 44.9, dur: 6.0, text: 'The measured horizon sweep peaks at twelve steps: shorter chunks lose temporal reach, while fifteen steps are harder to predict.' });
  tl.tween(horizonU, 1, { at: 45.4, dur: 1.8, ease: ease.enter });
  tl.tween(cam, { x: 1000, y: 350, k: 1.16 }, { at: 46.0, dur: 1.3, ease: ease.move });
  tl.hold(50.9, 0.6);

  tl.caption({ at: 51.5, dur: 6.2, text: 'One control tick therefore ends with twelve coordinated moves, not twelve rounds of sequential generation.' });
  tl.tween(dimU, 1, { at: 52.0, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 52.7, dur: 0.7, ease: ease.enter });
  tl.hold(57.7, 1.0);

  return { tl, cam, memoryU, stateU, queryU, decodeU, vectorU, ribbonU, executeU, horizonU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const memoryU = s.get(scene.memoryU);
  const queryU = s.get(scene.queryU);
  const decodeU = s.get(scene.decodeU);
  const vectorU = s.get(scene.vectorU);
  const ribbonU = s.get(scene.ribbonU);
  const executeU = s.get(scene.executeU);
  const mainOpacity = 1 - 0.9 * s.get(scene.dimU);
  const xOf = (i: number) => 112 + i * 70;

  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={mainOpacity}>
      <text x={640} y={50} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={760}>Ask for twelve moves at once</text>
      <text x={640} y={76} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>ACTActionDecoder · chunk_size = 12 · action_dim = 7</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={mainOpacity}>
        <g opacity={memoryU}>
          <rect x={80} y={406} width={835} height={82} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={2} />
          {Array.from({ length: 25 }, (_, i) => <rect key={i} x={100 + i * 31} y={426} width={24} height={38} rx={5} fill={i < 14 ? colors.ACCENT : colors.WARM} opacity={0.35 + 0.45 * clamp01(memoryU * 25 - i)} />)}
          <text x={497} y={516} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>act_memory = [visual_tokens ; text_tokens ; state_tokens]</text>
        </g>
        {s.get(scene.stateU) > 0 && <g opacity={s.get(scene.stateU)}>
          {[0, 1].map((i) => <g key={i} transform={`translate(${860 + i * 34} 445)`}>
            <rect x={-13} y={-19} width={26} height={38} rx={6} fill={colors.POSITIVE} />
          </g>)}
          <text x={878} y={396} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>2 state tokens</text>
        </g>}

        <g opacity={queryU}>
          {Array.from({ length: 12 }, (_, i) => {
            const u = clamp01(queryU * 12 - i);
            return <g key={i} opacity={u} transform={`translate(${xOf(i)} 188) scale(${0.8 + 0.2 * u})`}>
              <circle r={19} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
              <text y={5} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily={MONO}>q{i + 1}</text>
              <line x1={0} y1={24} x2={0} y2={212} stroke={colors.SECONDARY} opacity={0.18 + 0.45 * decodeU} strokeDasharray="5 6" />
              {decodeU > 0 && <circle cx={0} cy={24 + decodeU * 188} r={5} fill={colors.SECONDARY} />}
            </g>;
          })}
          <rect x={78} y={238} width={806} height={92} rx={18} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
          <text x={481} y={282} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={720}>transformer decoder</text>
          <text x={481} y={307} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>tgt = action_queries · memory = act_memory</text>
        </g>

        {vectorU > 0 && <g opacity={vectorU}>
          {ACTIONS.map((vals, i) => {
            const pts = vals.map((v, d) => `${xOf(i) - 22 + d * 7.5},${560 - v * 42}`).join(' ');
            return <g key={i} opacity={clamp01(vectorU * 12 - i)}>
              <polyline points={pts} fill="none" stroke={i < executeU * 12 ? colors.POSITIVE : colors.ACCENT} strokeWidth={2.2} />
              <circle cx={xOf(i) + 23} cy={560 - vals[6] * 42} r={3} fill={colors.ACCENT} />
            </g>;
          })}
          <text x={500} y={610} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={vectorU}>pred_actions.shape = [12, 7]</text>
        </g>}

        {ribbonU > 0 && <g opacity={ribbonU}>
          <path d={ACTIONS.map((vals, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i)} ${584 - vals[0] * 30}`).join(' ')} fill="none" stroke={colors.POSITIVE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={820} strokeDashoffset={820 * (1 - ribbonU)} />
          {executeU > 0 && <circle cx={xOf(Math.min(11, Math.floor(executeU * 11)))} cy={584 - ACTIONS[Math.min(11, Math.floor(executeU * 11))][0] * 30} r={10} fill={colors.WARM} />}
        </g>}

        {s.get(scene.horizonU) > 0 && <g transform="translate(940 190)" opacity={s.get(scene.horizonU)}>
          <rect x={0} y={0} width={270} height={300} rx={20} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={135} y={34} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={700}>action horizon sweep</text>
          <line x1={40} y1={240} x2={235} y2={240} stroke={colors.GRID} />
          <line x1={40} y1={70} x2={40} y2={240} stroke={colors.GRID} />
          <polyline points={HORIZON.map((p, i) => `${64 + i * 54},${222 - (p.score - 95) * 62}`).join(' ')} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
          {HORIZON.map((p, i) => <g key={p.h}>
            <circle cx={64 + i * 54} cy={222 - (p.score - 95) * 62} r={p.h === 12 ? 9 : 6} fill={p.h === 12 ? colors.WARM : colors.POSITIVE} />
            <text x={64 + i * 54} y={262} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>H={p.h}</text>
            <text x={64 + i * 54} y={210 - (p.score - 95) * 62} textAnchor="middle" fill={p.h === 12 ? colors.WARM : colors.TEXT} fontSize={11}>{p.score}</text>
          </g>)}
        </g>}
      </g>
    </Camera>
    {s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}>
      <rect x={200} y={234} width={880} height={198} rx={24} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={33} fontWeight={800}>One pass. Twelve moves.</text>
      <text x={640} y={346} textAnchor="middle" fill={colors.SECONDARY} fontSize={18}>12 learned queries decode in parallel</text>
      <text x={640} y={382} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>pred_actions = tanh(action_head(hidden_states))</text>
    </g>}
  </>;
}

export const vizScene = () => scene;
