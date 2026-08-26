// Grounding: plugins/tools/task_board.py; Apodex 1.1 paper section 3.3.2.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const ROWS = [
  { id: 't1', owner: 'researcher', color: colors.ACCENT },
  { id: 't2', owner: 'runtime-reader', color: colors.SECONDARY },
  { id: 't3', owner: 'verifier', color: colors.POSITIVE },
  { id: 't4', owner: 'publisher', color: colors.WARM },
];
const FIELDS = ['description', 'owners', 'group', 'resolution'];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const objectiveU = tl.channel('objective ribbon', 0);
  const historyU = tl.channel('message history', 0);
  const historyCompress = tl.channel('history compaction', 0);
  const boardP = tl.channel('task rows', 0);
  const fieldsP = tl.channel('task fields', 0);
  const runtimeU = tl.channel('runtime status', 0);
  const phaseU = tl.channel('planning boundary', 0);
  const resolutionP = tl.channel('resolutions', 0);
  const reinjectU = tl.channel('board reinjection', 0);
  const close = tl.channel('closing board', 0);

  tl.caption({ at: 0.4, dur: 6.1, text: 'Long work begins as one objective, but the conversation carrying it will not stay small.' });
  tl.tween(objectiveU, 1, { at: 0.8, dur: 1.3, ease: ease.draw });
  tl.tween(historyU, 1, { at: 2.0, dur: 2.8, ease: ease.enter });

  tl.caption({ at: 6.9, dur: 6.2, text: 'Tool results arrive, messages accumulate, and eventually old context must be compacted.' });
  tl.tween(historyCompress, 1, { at: 7.7, dur: 2.0, ease: ease.move });
  tl.tween(cam, { x: 410, y: 330, k: 1.16 }, { at: 9.6, dur: 1.3, ease: ease.move });

  tl.caption({ at: 13.5, dur: 6.3, text: 'Agent Team moves the plan into a run-scoped task board outside that message history.' });
  tl.tween(boardP, 4, { at: 14.2, dur: 2.5, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 17.1, dur: 1.3, ease: ease.move });

  tl.caption({ at: 20.2, dur: 6.3, text: 'Every item gets a stable identifier, a concrete description, owners, a group, and a resolution.' });
  tl.tween(fieldsP, 4, { at: 20.9, dur: 2.2, ease: ease.enter });
  tl.tween(cam, { x: 690, y: 330, k: 1.1 }, { at: 23.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 26.9, dur: 6.4, text: 'The coordinator owns semantic resolution. The runtime separately owns whether an execution is queued, running, or reported.' });
  tl.tween(runtimeU, 1, { at: 27.6, dur: 1.2, ease: ease.enter });

  tl.caption({ at: 33.7, dur: 6.2, text: 'Planning mode keeps dispatch and file mutation locked until the board is ready.' });
  tl.tween(phaseU, 1, { at: 34.4, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 640, y: 410, k: 1.15 }, { at: 36.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 40.3, dur: 6.2, text: 'Finishing planning opens execution, while the same board can still absorb new subquestions.' });
  tl.tween(phaseU, 2, { at: 41.0, dur: 1.3, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 43.3, dur: 1.2, ease: ease.move });

  tl.caption({ at: 46.9, dur: 6.6, text: 'A reported process does not resolve its item by itself. Returned work stays open until the coordinator judges it sufficient.' });
  tl.tween(resolutionP, 4, { at: 47.6, dur: 3.1, ease: ease.move });

  tl.caption({ at: 53.9, dur: 6.3, text: 'When history compacts again, the runtime re-injects the board, so the plan remains visible.' });
  tl.tween(historyCompress, 2, { at: 54.6, dur: 1.5, ease: ease.move });
  tl.tween(reinjectU, 1, { at: 56.2, dur: 1.0, ease: ease.pop });

  tl.caption({ at: 60.6, dur: 6.7, text: 'The board is external memory and a finalization gate: every active item must end resolved or cancelled.' });
  tl.tween(close, 1, { at: 61.3, dur: 1.1, ease: ease.move });
  tl.hold(67.5, 1.0);

  return { tl, cam, objectiveU, historyU, historyCompress, boardP, fieldsP, runtimeU, phaseU, resolutionP, reinjectU, close };
}

const scene = buildScene();

function HistoryTape({ reveal, compact }: { reveal: number; compact: number }) {
  const count = Math.max(1, Math.round(8 - compact * 5));
  return <g opacity={reveal}>
    <text x="148" y="148" fill={colors.MUTED} fontSize="15" fontWeight="700">model message history</text>
    {Array.from({ length: count }, (_, i) => {
      const w = 170 - i * 8;
      return <rect key={i} x={92} y={174 + i * 34} width={w} height="20" rx="10" fill={i % 2 ? colors.SECONDARY : colors.ACCENT} opacity={0.18 + i * 0.035} />;
    })}
    <rect x="88" y="166" width="188" height={Math.max(64, count * 34 + 16)} rx="20" fill="none" stroke={colors.GRID} strokeWidth="2" strokeDasharray="7 7" />
    <text x="182" y={206 + count * 34} textAnchor="middle" fill={colors.WARM} fontSize="14" opacity={compact}>compact old bodies</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const boardP = s.get(scene.boardP);
  const fieldsP = s.get(scene.fieldsP);
  const resolutionP = s.get(scene.resolutionP);
  const phase = s.get(scene.phaseU);
  const resolved = Math.floor(resolutionP);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="68" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="800">The board outside the conversation</text>
      <path d="M82 106 C290 92 330 120 356 178" fill="none" stroke={colors.WARM} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${Math.max(1, s.get(scene.objectiveU) * 310)} 330`} />
      <circle cx="82" cy="106" r="16" fill={colors.WARM} opacity={s.get(scene.objectiveU)} />
      <text x="112" y="112" fill={colors.WARM} fontSize="16" fontWeight="700" opacity={s.get(scene.objectiveU)}>objective</text>
      <HistoryTape reveal={s.get(scene.historyU)} compact={s.get(scene.historyCompress) % 1} />

      <g>
        <rect x="320" y="126" width="866" height="420" rx="30" fill="#0d1526" stroke={s.get(scene.reinjectU) > 0 ? colors.WARM : colors.ACCENT} strokeWidth={3 + s.get(scene.reinjectU) * 4} />
        <text x="354" y="164" fill={colors.ACCENT} fontSize="16" fontFamily={colors.font.mono} fontWeight="700">_BOARDS[task_id]</text>
        <text x="1150" y="164" textAnchor="end" fill={colors.MUTED} fontSize="14">outside LLM history</text>
        {ROWS.map((row, i) => {
          const u = clamp01(boardP - i);
          const y = 188 + i * 82;
          const rowResolved = i < resolved;
          const runtime = ['reported', 'running', 'queued', 'created'][i];
          return <g key={row.id} opacity={u} transform={`translate(${(1 - u) * 70} 0)`}>
            <rect x="344" y={y} width="818" height="64" rx="16" fill="#111c31" stroke={rowResolved ? colors.POSITIVE : row.color} strokeWidth="2.5" />
            <circle cx="376" cy={y + 32} r="16" fill={rowResolved ? colors.POSITIVE : row.color} opacity="0.9" />
            <text x="376" y={y + 38} textAnchor="middle" fill="#08101e" fontSize="13" fontWeight="900">{rowResolved ? '✓' : '○'}</text>
            <text x="408" y={y + 27} fill={colors.TEXT} fontSize="17" fontFamily={colors.font.mono} fontWeight="700">{row.id}</text>
            <text x="408" y={y + 49} fill={colors.MUTED} fontSize="13">one concrete, checkable work item</text>
            <text x="742" y={y + 36} fill={row.color} fontSize="14">{row.owner}</text>
            <g opacity={s.get(scene.runtimeU)}>
              <rect x="932" y={y + 17} width="112" height="30" rx="15" fill="#08101e" stroke={colors.SECONDARY} />
              <text x="988" y={y + 37} textAnchor="middle" fill={colors.SECONDARY} fontSize="13">{runtime}</text>
            </g>
            <text x="1134" y={y + 37} textAnchor="end" fill={rowResolved ? colors.POSITIVE : colors.WARM} fontSize="13" fontWeight="700">{rowResolved ? 'resolved' : 'open'}</text>
          </g>;
        })}
        <g opacity={clamp01(fieldsP)}>
          {FIELDS.map((field, i) => {
            const u = clamp01(fieldsP - i);
            return <g key={field} opacity={u} transform={`translate(${430 + i * 178} 514)`}>
              <rect x="-72" y="-16" width="144" height="32" rx="16" fill="#08101e" stroke={colors.MUTED} />
              <text y="5" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>{field}</text>
            </g>;
          })}
        </g>
      </g>

      <g opacity={clamp01(phase)}>
        <rect x="486" y="558" width="308" height="48" rx="24" fill={phase < 1.5 ? '#321824' : '#0c2a22'} stroke={phase < 1.5 ? colors.NEGATIVE : colors.POSITIVE} strokeWidth="3" />
        <text x="640" y="588" textAnchor="middle" fill={phase < 1.5 ? colors.NEGATIVE : colors.POSITIVE} fontSize="16" fontWeight="800">{phase < 1.5 ? 'PLANNING · writes locked' : 'EXECUTION · board stays live'}</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="220" y="142" width="840" height="390" rx="38" fill={colors.BG} stroke={colors.ACCENT} strokeWidth="4" />
      <text x="640" y="214" textAnchor="middle" fill={colors.MUTED} fontSize="22">messages may shrink</text>
      <text x="640" y="276" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">the board does not</text>
      <path d="M346 350 H934" stroke={colors.GRID} strokeWidth="6" strokeLinecap="round" />
      {ROWS.map((row, i) => <g key={row.id} transform={`translate(${410 + i * 154} 350)`}>
        <circle r="28" fill={colors.POSITIVE} />
        <text y="7" textAnchor="middle" fill="#07140f" fontSize="18" fontWeight="900">✓</text>
        <text y="56" textAnchor="middle" fill={colors.MUTED} fontSize="14">{row.id}</text>
      </g>)}
      <text x="640" y="464" textAnchor="middle" fill={colors.ACCENT} fontSize="24" fontWeight="700">external memory · finalization gate</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
