// Grounding: plugins/tools/collect_reports.py;
// frontier_agent/components/agent_bus/bus.py;
// frontier_agent/core/runtime/loop/tool_exec.py; Apodex 1.1 paper section 3.3.3.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const REPORTS = [
  { name: 'researcher', color: colors.ACCENT, y: 178, finish: 0.32 },
  { name: 'code-reader', color: colors.SECONDARY, y: 286, finish: 0.64 },
  { name: 'verifier', color: colors.POSITIVE, y: 394, finish: 0.48 },
  { name: 'publisher', color: colors.WARM, y: 502, finish: 0.88 },
];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const workersP = tl.channel('asynchronous workers', 0);
  const progressU = tl.channel('uneven progress', 0);
  const drainU = tl.channel('nonblocking drain', 0);
  const firstU = tl.channel('first completed wake', 0);
  const faninP = tl.channel('report braid', 0);
  const partialU = tl.channel('partial evidence', 0);
  const interventionU = tl.channel('live intervention', 0);
  const contextU = tl.channel('context tape', 0);
  const compactU = tl.channel('tiered compaction', 0);
  const deadlineU = tl.channel('soft deadline', 0);
  const consolidateU = tl.channel('bounded consolidation', 0);
  const close = tl.channel('protected evidence', 0);

  tl.caption({ at: 0.4, dur: 6.2, text: 'Parallel workers finish at different times, so fan-in begins as a race rather than a synchronized batch.' });
  tl.tween(workersP, 4, { at: 0.9, dur: 2.4, ease: ease.enter });
  tl.tween(progressU, 1, { at: 2.1, dur: 3.8, ease: ease.linear });

  tl.caption({ at: 7.0, dur: 6.1, text: 'The collector first drains reports that are already ready, without paying for a wait.' });
  tl.tween(drainU, 1, { at: 7.7, dur: 1.1, ease: ease.draw });
  tl.tween(cam, { x: 560, y: 332, k: 1.15 }, { at: 9.7, dur: 1.2, ease: ease.move });

  tl.caption({ at: 13.5, dur: 6.3, text: 'If work is still running, the bus waits for the first completion, not for every branch.' });
  tl.tween(firstU, 1, { at: 14.2, dur: 0.65, ease: ease.pop });
  tl.tween(faninP, 1, { at: 15.0, dur: 1.5, ease: ease.draw });

  tl.caption({ at: 20.2, dur: 6.3, text: 'That first report wakes the coordinator, then the collector drains any companions that finished during the wait.' });
  tl.tween(faninP, 4, { at: 20.9, dur: 3.4, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 23.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 26.9, dur: 6.4, text: 'Incomplete and failed reports are not discarded. They remain labeled as partial evidence for the next decision.' });
  tl.tween(partialU, 1, { at: 27.6, dur: 1.0, ease: ease.enter });

  tl.caption({ at: 33.7, dur: 6.3, text: 'A live follow-up can interrupt the wait and enter history before the next model call, while the workers keep running.' });
  tl.tween(interventionU, 1, { at: 34.4, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 720, y: 225, k: 1.15 }, { at: 36.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 40.4, dur: 6.4, text: 'As context fills, the cheap compaction tier evicts old tool bodies but preserves protected fan-in reports.' });
  tl.tween(contextU, 1, { at: 41.1, dur: 1.0, ease: ease.enter });
  tl.tween(compactU, 1, { at: 42.3, dur: 2.0, ease: ease.move });

  tl.caption({ at: 47.2, dur: 6.3, text: 'Near the soft deadline, waits shrink to the remaining budget and the active agent is asked to consolidate.' });
  tl.tween(deadlineU, 1, { at: 47.9, dur: 2.4, ease: ease.linear });
  tl.tween(cam, { x: 950, y: 356, k: 1.1 }, { at: 50.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 53.9, dur: 6.4, text: 'A bounded finalization pass recovers useful partial work before hard cancellation becomes the last resort.' });
  tl.tween(consolidateU, 1, { at: 54.6, dur: 1.2, ease: ease.pop });

  tl.caption({ at: 60.7, dur: 6.7, text: 'The result is a braided evidence tape: asynchronous work returns early, stays labeled, and survives a long trajectory.' });
  tl.tween(cam, CAMERA_HOME, { at: 60.2, dur: 1.0, ease: ease.move });
  tl.tween(close, 1, { at: 61.4, dur: 1.1, ease: ease.move });
  tl.hold(67.6, 1.0);

  return { tl, cam, workersP, progressU, drainU, firstU, faninP, partialU, interventionU, contextU, compactU, deadlineU, consolidateU, close };
}

const scene = buildScene();

function reportPath(y: number, lane: number) {
  const endY = 250 + lane * 54;
  return `M178 ${y} C360 ${y} 420 ${endY} 590 ${endY}`;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const progress = s.get(scene.progressU);
  const faninP = s.get(scene.faninP);
  const compact = s.get(scene.compactU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="66" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="800">Fan in without erasing the evidence</text>

      {REPORTS.map((report, i) => {
        const u = clamp01(s.get(scene.workersP) - i);
        const done = clamp01((progress - report.finish) * 5);
        const pathU = clamp01(faninP - i);
        const partial = s.get(scene.partialU) > 0 && (i === 1 || i === 3);
        return <g key={report.name} opacity={u}>
          <circle cx="118" cy={report.y} r="34" fill="#111827" stroke={report.color} strokeWidth="3" />
          <circle cx="118" cy={report.y} r={8 + done * 12} fill={report.color} opacity={0.3 + 0.7 * done} />
          <text x="166" y={report.y - 5} fill={report.color} fontSize="14" fontWeight="700">{report.name}</text>
          <text x="166" y={report.y + 18} fill={colors.MUTED} fontSize="12">{done > 0.8 ? 'report ready' : 'running'}</text>
          <path d={reportPath(report.y, i)} fill="none" stroke={report.color} strokeWidth={6 + (i === 0 ? s.get(scene.firstU) * 4 : 0)} strokeLinecap="round" strokeDasharray={`${Math.max(1, pathU * 520)} 540`} opacity={0.25 + 0.75 * pathU} />
          {partial && <g opacity={s.get(scene.partialU)}>
            <rect x="432" y={230 + i * 54} width="124" height="30" rx="15" fill="#301822" stroke={colors.NEGATIVE} />
            <text x="494" y={250 + i * 54} textAnchor="middle" fill={colors.NEGATIVE} fontSize="12">partial evidence</text>
          </g>}
        </g>;
      })}

      <g opacity={s.get(scene.drainU)}>
        <path d="M238 126 H526" stroke={colors.ACCENT} strokeWidth="4" strokeDasharray={`${Math.max(1, s.get(scene.drainU) * 290)} 300`} />
        <text x="382" y="112" textAnchor="middle" fill={colors.ACCENT} fontSize="14" fontFamily={colors.font.mono}>non-blocking drain</text>
      </g>

      <g>
        <rect x="590" y="188" width="238" height="284" rx="30" fill="#0d1526" stroke={colors.SECONDARY} strokeWidth="4" />
        <text x="709" y="224" textAnchor="middle" fill={colors.SECONDARY} fontSize="16" fontFamily={colors.font.mono}>collect_reports()</text>
        <text x="709" y="252" textAnchor="middle" fill={colors.MUTED} fontSize="13">FIRST_COMPLETED</text>
        {REPORTS.map((report, i) => {
          const u = clamp01(faninP - i);
          return <g key={report.name} opacity={u} transform={`translate(0 ${(1 - u) * 26})`}>
            <rect x="620" y={274 + i * 42} width="178" height="30" rx="15" fill={report.color} opacity="0.2" />
            <circle cx="638" cy={289 + i * 42} r="7" fill={report.color} />
            <text x="654" y={294 + i * 42} fill={colors.TEXT} fontSize="12">report {i + 1}</text>
          </g>;
        })}
      </g>

      <g opacity={s.get(scene.interventionU)}>
        <path d="M752 116 V182" stroke={colors.WARM} strokeWidth="5" strokeDasharray="8 7" />
        <rect x="642" y="82" width="220" height="44" rx="22" fill="#332214" stroke={colors.WARM} strokeWidth="3" />
        <text x="752" y="109" textAnchor="middle" fill={colors.WARM} fontSize="14" fontWeight="800">live follow-up wakes wait</text>
      </g>

      <g opacity={s.get(scene.contextU)}>
        <rect x="876" y="132" width="314" height="400" rx="28" fill="#0d1526" stroke={colors.GRID} strokeWidth="3" />
        <text x="1033" y="166" textAnchor="middle" fill={colors.MUTED} fontSize="15">trajectory context</text>
        {Array.from({ length: 8 }, (_, i) => {
          const protectedBand = i === 2 || i === 5;
          const h = compact > 0 && !protectedBand ? 8 : 28;
          const y = 192 + i * 40;
          return <g key={i}>
            <rect x="906" y={y} width={protectedBand ? 252 : 214 - i * 9} height={h} rx={h / 2} fill={protectedBand ? colors.POSITIVE : colors.ACCENT} opacity={protectedBand ? 0.72 : 0.14 + i * 0.025} />
            {protectedBand && <text x="1032" y={y + 19} textAnchor="middle" fill="#07140f" fontSize="11" fontWeight="800">protected fan-in report</text>}
          </g>;
        })}
        <text x="1033" y="514" textAnchor="middle" fill={colors.POSITIVE} fontSize="12" fontFamily={colors.font.mono}>PROTECTED_FANIN_TOOLS</text>
      </g>

      <g opacity={s.get(scene.deadlineU)}>
        <path d="M842 552 A76 76 0 0 1 994 552" fill="none" stroke={colors.NEGATIVE} strokeWidth="7" strokeDasharray={`${Math.max(1, s.get(scene.deadlineU) * 240)} 250`} />
        <text x="918" y="584" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14">soft deadline · clamp waits</text>
      </g>

      <g opacity={s.get(scene.consolidateU)}>
        <rect x="1008" y="548" width="190" height="46" rx="23" fill="#0c2a22" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="1103" y="576" textAnchor="middle" fill={colors.POSITIVE} fontSize="13" fontWeight="800">bounded finalization</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="196" y="142" width="888" height="390" rx="40" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="212" textAnchor="middle" fill={colors.TEXT} fontSize="39" fontWeight="850">evidence returns as a braid</text>
      {REPORTS.map((report, i) => <path key={report.name} d={`M288 ${294 + i * 26} C470 ${294 + i * 26} 520 ${388 - i * 25} 716 350 C820 330 892 342 980 350`} fill="none" stroke={report.color} strokeWidth="10" strokeLinecap="round" />)}
      <circle cx="980" cy="350" r="36" fill={colors.POSITIVE} />
      <text x="980" y="357" textAnchor="middle" fill="#07140f" fontSize="18" fontWeight="900">✓</text>
      <text x="640" y="456" textAnchor="middle" fill={colors.MUTED} fontSize="22">early · labeled · protected through compaction</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
