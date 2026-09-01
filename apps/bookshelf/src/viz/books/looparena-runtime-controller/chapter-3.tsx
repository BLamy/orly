// Grounding: LoopArena paper Sections 2 and 3 and Table 1;
// src/looparena/harness/type1_benchmark.py and commands/type2_run.py and type3_run.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const TASKS = Array.from({ length: 27 }, (_, i) => ({ source: i < 11 ? 'SCBench' : 'BeyondSWE', x: 155 + i * 36 }));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const tasksU = tl.channel('paired task ribbon', 0);
  const fullU = tl.channel('type three full task', 0);
  const fullStatsU = tl.channel('full task ranges', 0);
  const sliceU = tl.channel('type two slice', 0);
  const sliceStatsU = tl.channel('slice ranges', 0);
  const savingU = tl.channel('cost reduction', 0);
  const freezeU = tl.channel('type one frozen point', 0);
  const candidatesU = tl.channel('four contracts', 0);
  const replayP = tl.channel('matched replay schedules', 0);
  const winnerU = tl.channel('stable unique winner', 0);
  const closeU = tl.channel('three setting recap', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'Loop Arena starts with twenty seven paired tasks: eleven from one benchmark and sixteen from another.' });
  tl.tween(tasksU, TASKS.length, { at: 0.9, dur: 3.8, ease: ease.enter });

  tl.caption({ at: 6.5, dur: 5.8, text: 'Type Three opens one task at its original state and follows the full run through implementation, verification, and stopping.' });
  tl.tween(fullU, 1, { at: 7.1, dur: 1.3, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 350, k: 1.18 }, { at: 9.2, dur: 1.3, ease: ease.move });

  tl.caption({ at: 12.6, dur: 5.8, text: 'Across Controllers, those runs average roughly one hundred forty to two hundred eighty nine Worker turns.' });
  tl.tween(fullStatsU, 1, { at: 13.2, dur: 1.0, ease: ease.pop });

  tl.caption({ at: 18.7, dur: 5.8, text: 'Type Two crops the same task to one coherent stage, beginning from a prepared intermediate workspace.' });
  tl.tween(sliceU, 1, { at: 19.3, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 560, y: 350, k: 1.38 }, { at: 20.9, dur: 1.3, ease: ease.move });

  tl.caption({ at: 24.8, dur: 5.8, text: 'Its evaluator still checks cumulative requirements through that stage, while average Worker turns fall to about fifty one through eighty.' });
  tl.tween(sliceStatsU, 1, { at: 25.4, dur: 0.8, ease: ease.pop });

  tl.caption({ at: 30.9, dur: 5.8, text: 'For the evaluated panel, that shorter scope cuts estimated inference cost by sixty four point four percent on average.' });
  tl.tween(savingU, 1, { at: 31.5, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 34.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 37.0, dur: 5.8, text: 'Type One freezes a restorable control point, then presents four complete Loop Contracts for the next Worker round.' });
  tl.tween(freezeU, 1, { at: 37.6, dur: 0.6, ease: ease.pop });
  tl.tween(candidatesU, 4, { at: 38.4, dur: 2.0, ease: ease.enter });
  tl.tween(cam, { x: 720, y: 350, k: 1.08 }, { at: 40.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 43.1, dur: 5.8, text: 'Construction replays all four under two matched schedules. An item survives only when both schedules find the same unique winner.' });
  tl.tween(replayP, 2, { at: 43.7, dur: 3.0, ease: ease.linear });
  tl.tween(winnerU, 1, { at: 46.4, dur: 0.5, ease: ease.pop });

  tl.caption({ at: 49.2, dur: 6.2, text: 'One decision, one task slice, one full task. The three views measure control at different costs without pretending they are identical.' });
  tl.tween(cam, CAMERA_HOME, { at: 49.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.0, dur: 1.2, ease: ease.move });
  tl.hold(55.4, 1.2);

  return { tl, cam, tasksU, fullU, fullStatsU, sliceU, sliceStatsU, savingU, freezeU, candidatesU, replayP, winnerU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const slice = s.get(scene.sliceU);
  const freeze = s.get(scene.freezeU);
  const replay = s.get(scene.replayP);
  const fullLayerOpacity = (1 - 0.85 * slice) * (1 - 0.85 * freeze);
  const sliceLayerOpacity = slice * (1 - 0.85 * freeze);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="68" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">one task at three magnifications</text>
      <g transform="translate(0 58)">
        <line x1="140" y1="325" x2="1140" y2="325" stroke={colors.GRID} strokeWidth="8" strokeLinecap="round" />
        {TASKS.map((task, i) => {
          const u = clamp01(s.get(scene.tasksU) - i);
          return <g key={i} opacity={u} transform={`translate(${task.x} 325) scale(${0.75 + u * 0.25})`}><circle r="11" fill={task.source === 'SCBench' ? colors.ACCENT : colors.SECONDARY} /><text y="29" textAnchor="middle" fill={colors.MUTED} fontSize="8">{i + 1}</text></g>;
        })}
        <text x="155" y="376" fill={colors.ACCENT} fontSize="12" fontFamily={colors.font.mono}>11 SCBench</text>
        <text x="860" y="376" fill={colors.SECONDARY} fontSize="12" fontFamily={colors.font.mono}>16 BeyondSWE</text>

        <g opacity={s.get(scene.fullU) * fullLayerOpacity}>
          <rect x="132" y="244" width="1018" height="162" rx="34" fill="none" stroke={colors.POSITIVE} strokeWidth="4" />
          <text x="640" y="205" textAnchor="middle" fill={colors.POSITIVE} fontSize="17" fontWeight="800">TYPE III · full task from original state</text>
          <text x="640" y="454" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono} opacity={s.get(scene.fullStatsU)}>139.81–288.90 Worker turns · 8.60–13.46 control cycles</text>
        </g>
        <g opacity={sliceLayerOpacity}>
          <rect x={330 + slice * 70} y="262" width={540 - slice * 130} height="126" rx="28" fill="#2b2415" fillOpacity="0.22" stroke={colors.WARM} strokeWidth="5" />
          <text x="560" y="238" textAnchor="middle" fill={colors.WARM} fontSize="17" fontWeight="800">TYPE II · prepared task slice</text>
          <text x="560" y="425" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono} opacity={s.get(scene.sliceStatsU)}>51.38–80.12 Worker turns · cumulative stage checks</text>
        </g>
        <g transform="translate(888 122)" opacity={s.get(scene.savingU)}>
          <circle r="76" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="4" />
          <text y="-4" textAnchor="middle" fill={colors.POSITIVE} fontSize="28" fontWeight="900">−64.4%</text>
          <text y="24" textAnchor="middle" fill={colors.MUTED} fontSize="11">mean estimated cost</text>
        </g>
        <g opacity={freeze}>
          <line x1="760" y1="246" x2="760" y2="404" stroke={colors.NEGATIVE} strokeWidth="6" />
          <circle cx="760" cy="325" r="24" fill={colors.NEGATIVE} fillOpacity="0.25" stroke={colors.NEGATIVE} strokeWidth="3" />
          <text x="760" y="216" textAnchor="middle" fill={colors.NEGATIVE} fontSize="16" fontWeight="800">TYPE I · frozen control point</text>
        </g>
        {['advance', 'verify', 'recover', 'stop'].map((label, i) => {
          const u = clamp01(s.get(scene.candidatesU) - i);
          const x = 565 + i * 130;
          const win = i === 1 && s.get(scene.winnerU) > 0;
          return <g key={label} transform={`translate(${x} 450)`} opacity={u}><rect x="-55" y="-25" width="110" height="50" rx="16" fill={win ? '#102a22' : '#141d2f'} stroke={win ? colors.POSITIVE : colors.MUTED} strokeWidth={win ? 4 : 2} /><text y="5" textAnchor="middle" fill={win ? colors.POSITIVE : colors.TEXT} fontSize="12" fontFamily={colors.font.mono}>{label}</text>{replay > 0 && <g><circle cx="-18" cy="40" r="6" fill={replay >= 0.8 ? colors.POSITIVE : colors.MUTED} /><circle cx="18" cy="40" r="6" fill={replay >= 1.8 ? colors.POSITIVE : colors.MUTED} /></g>}</g>;
        })}
      </g>
    </g>
    <g opacity={close}>
      <rect x="154" y="120" width="972" height="442" rx="44" fill={colors.BG} stroke={colors.ACCENT} strokeWidth="4" />
      <text x="640" y="196" textAnchor="middle" fill={colors.TEXT} fontSize="39" fontWeight="850">three costs, three questions</text>
      {[{ x: 316, n: '90', t: 'Type I decisions', c: colors.NEGATIVE }, { x: 640, n: '27', t: 'Type II slices', c: colors.WARM }, { x: 964, n: '27', t: 'Type III full tasks', c: colors.POSITIVE }].map((d) => <g key={d.t} transform={`translate(${d.x} 356)`}><circle r="94" fill="#111c2e" stroke={d.c} strokeWidth="5" /><text y="-2" textAnchor="middle" fill={d.c} fontSize="44" fontWeight="900">{d.n}</text><text y="34" textAnchor="middle" fill={colors.TEXT} fontSize="14">{d.t}</text></g>)}
      <text x="640" y="512" textAnchor="middle" fill={colors.MUTED} fontSize="17">decision quality · closed-loop slice · end-to-end control</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
