// Grounding: src/looparena/harness/packet_compiler.py, validation.py, rendering.py;
// LoopArena paper Appendix C, especially the Evidence Packet construction protocol.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const TURNS = ['E12 · inspected parser', 'E13 · changed validation', 'E14 · ran focused tests', 'E15 · claimed completion', 'E16 · found missing matrix row'];
const FIELDS = ['task_context_and_constraints', 'work_history_and_current_state', 'verification_and_evidence', 'open_issues_and_uncertainty'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const tapeU = tl.channel('worker transcript tape', 0);
  const forkU = tl.channel('temporary reporter copy', 0);
  const fieldsU = tl.channel('four report fields', 0);
  const scanP = tl.channel('citation scan', 0);
  const rejectU = tl.channel('unknown citation rejected', 0);
  const quoteU = tl.channel('quoted turns lifted', 0);
  const contextU = tl.channel('packet context', 0);
  const budgetU = tl.channel('remaining budget', 0);
  const actionsU = tl.channel('allowed actions', 0);
  const foldU = tl.channel('packet fold', 0);
  const closeU = tl.channel('packet close', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'The Controller never gets a second, hidden version of the repository. It gets a packet built from visible evidence.' });
  tl.tween(tapeU, TURNS.length, { at: 0.9, dur: 3.4, ease: ease.enter });

  tl.caption({ at: 6.5, dur: 5.8, text: 'The Reporter works from a temporary copy of the Worker conversation, so reporting cannot rewrite the persistent history.' });
  tl.tween(forkU, 1, { at: 7.1, dur: 1.3, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 350, k: 1.06 }, { at: 8.8, dur: 1.3, ease: ease.move });

  tl.caption({ at: 12.6, dur: 5.8, text: 'Its report has four required parts: task context, current state, verification evidence, and unresolved uncertainty.' });
  tl.tween(fieldsU, FIELDS.length, { at: 13.2, dur: 2.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 16.1, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.7, dur: 5.8, text: 'Material claims cite Worker turns with evidence labels, and the compiler scans those labels in first appearance order.' });
  tl.tween(scanP, TURNS.length, { at: 19.3, dur: 4.0, ease: ease.linear });

  tl.caption({ at: 24.8, dur: 5.8, text: 'An unknown label is rejected. The compiler does not guess which turn the Reporter might have meant.' });
  tl.tween(rejectU, 1, { at: 25.4, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 350, k: 1.1 }, { at: 27.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.9, dur: 5.8, text: 'Known labels lift the complete cited Worker turns into quoted evidence without changing their contents.' });
  tl.tween(rejectU, 0, { at: 31.2, dur: 0.5, ease: ease.enter });
  tl.tween(quoteU, 1, { at: 31.5, dur: 2.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 34.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 37.0, dur: 5.8, text: 'The packet also records the previous action, the round number, and how many Worker responses remain.' });
  tl.tween(contextU, 1, { at: 37.5, dur: 0.7, ease: ease.pop });
  tl.tween(budgetU, 1, { at: 38.6, dur: 1.2, ease: ease.draw });

  tl.caption({ at: 43.1, dur: 5.8, text: 'Finally it stamps the only legal decisions: advance, verify, or stop, then validates the complete structure.' });
  tl.tween(actionsU, 1, { at: 43.7, dur: 1.2, ease: ease.enter });
  tl.tween(foldU, 1, { at: 45.4, dur: 1.4, ease: ease.move });

  tl.caption({ at: 49.2, dur: 6.2, text: 'The result is compact, read only, and traceable. A claim stays attached to the Worker turn that supports it.' });
  tl.tween(closeU, 1, { at: 50.1, dur: 1.2, ease: ease.move });
  tl.hold(55.4, 1.2);

  return { tl, cam, tapeU, forkU, fieldsU, scanP, rejectU, quoteU, contextU, budgetU, actionsU, foldU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const fold = s.get(scene.foldU);
  const close = s.get(scene.closeU);
  const scan = s.get(scene.scanP);
  const fork = s.get(scene.forkU);
  const fields = s.get(scene.fieldsU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="68" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">compile evidence, do not invent it</text>
      <g transform={`translate(${40 + fold * 200} 110) scale(${1 - fold * 0.35})`} opacity={1 - fold * 0.5}>
        <rect width="480" height="480" rx="28" fill="#0f192b" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="240" y="38" textAnchor="middle" fill={colors.ACCENT} fontSize="15" fontFamily={colors.font.mono}>persistent Worker conversation</text>
        {TURNS.map((turn, i) => {
          const u = clamp01(s.get(scene.tapeU) - i);
          const hot = Math.max(0, 1 - Math.abs(scan - i - 0.5));
          return <g key={turn} opacity={u} transform={`translate(24 ${70 + i * 70 + (1 - u) * 14})`}>
            <rect width="432" height="52" rx="13" fill={i === 4 ? '#291923' : '#15223a'} stroke={hot ? colors.WARM : i === 4 ? colors.NEGATIVE : colors.GRID} strokeWidth={hot ? 3 : 1.5} />
            <text x="18" y="32" fill={i === 4 ? colors.NEGATIVE : colors.TEXT} fontSize="14" fontFamily={colors.font.mono}>{turn}</text>
          </g>;
        })}
        <line x1="16" y1={61 + clamp01(scan) * 70} x2="464" y2={61 + clamp01(scan) * 70} stroke={colors.WARM} strokeWidth="4" strokeLinecap="round" opacity={clamp01(scan * 4) * clamp01((5 - scan) * 4) * 0.8} />
      </g>

      <path d="M520 250 C560 210 560 210 600 200" fill="none" stroke={colors.SECONDARY} strokeWidth="4" strokeDasharray="9 7" opacity={s.get(scene.forkU)} />
      <g transform="translate(600 110)" opacity={1 - fold * 0.4}>
        <rect width="600" height="480" rx="28" fill="#141a2d" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="300" y="38" textAnchor="middle" fill={colors.SECONDARY} fontSize="15" fontFamily={colors.font.mono}>compile_packet_from_reporter</text>
        <text x="300" y="262" textAnchor="middle" fill={colors.MUTED} fontSize="14" opacity={1 - fork}>packet waits for the Reporter</text>
        <g opacity={fork * (1 - clamp01(fields))}>
          <text x="22" y="62" fill={colors.MUTED} fontSize="14" fontFamily={colors.font.mono}>temporary copy of the Worker turns</text>
          {TURNS.map((turn, i) => <g key={turn} transform={`translate(22 ${80 + i * 30})`}>
            <rect width="556" height="24" rx="8" fill="none" stroke={colors.MUTED} strokeDasharray="4 4" />
            <text x="12" y="17" fill={colors.TEXT} fontSize="14" fontFamily={colors.font.mono}>{turn}</text>
          </g>)}
        </g>
        {FIELDS.map((field, i) => {
          const u = clamp01(fields - i);
          return <g key={field} transform={`translate(22 ${60 + i * 44})`} opacity={u}>
            <rect width="556" height="38" rx="12" fill="#1a2439" stroke={colors.MUTED} />
            <text x="16" y="25" fill={colors.TEXT} fontSize="14" fontFamily={colors.font.mono}>{field}</text>
          </g>;
        })}
        <g transform="translate(22 244)" opacity={clamp01((scan - 2) * 2)}>
          <rect width="556" height="40" rx="12" fill="#16233a" stroke={colors.WARM} strokeWidth="2" />
          <text x="16" y="25" fill={colors.TEXT} fontSize="14" fontFamily={colors.font.mono}>claim: ran focused tests</text>
          <rect x="250" y="8" width="72" height="24" rx="8" fill="#2b2415" stroke={colors.WARM} />
          <text x="286" y="25" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>E14</text>
          <text x="336" y="25" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>→ quoted turn</text>
        </g>
        <g transform="translate(22 312)" opacity={s.get(scene.contextU)}>
          <rect width="174" height="48" rx="12" fill="#26203a" stroke={colors.SECONDARY} />
          <text x="87" y="20" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontFamily={colors.font.mono}>round_index</text>
          <text x="87" y="38" textAnchor="middle" fill={colors.TEXT} fontSize="14" fontFamily={colors.font.mono}>previous_action</text>
        </g>
        <g transform="translate(214 312)" opacity={s.get(scene.budgetU)}>
          <rect width="364" height="48" rx="12" fill="#2b2415" stroke={colors.WARM} />
          <rect x="14" y="30" width="336" height="8" rx="4" fill={colors.GRID} />
          <rect x="14" y="30" width="202" height="8" rx="4" fill={colors.WARM} />
          <text x="182" y="22" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>remaining_inner_react_turns</text>
        </g>
        <g transform="translate(22 378)" opacity={s.get(scene.quoteU)}>
          {[12, 14, 16].map((n, i) => <g key={n} transform={`translate(${i * 148} 0)`}><rect width="136" height="34" rx="10" fill="#102a22" stroke={colors.POSITIVE} /><text x="68" y="22" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>{`quoted E${n}`}</text></g>)}
        </g>
        <g opacity={s.get(scene.rejectU)} transform="translate(22 432)"><rect width="200" height="34" rx="12" fill="#341723" stroke={colors.NEGATIVE} strokeWidth="3" /><text x="100" y="22" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14" fontFamily={colors.font.mono}>unknown E99 rejected</text></g>
        <g transform="translate(0 432)" opacity={s.get(scene.actionsU)}>
          {['advance', 'verify', 'stop'].map((a, i) => <g key={a} transform={`translate(${240 + i * 114} 0)`}><rect width="106" height="34" rx="15" fill="#102a22" stroke={colors.POSITIVE} /><text x="53" y="22" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>{a}</text></g>)}
        </g>
      </g>
    </g>
    <g opacity={close}>
      <rect x="220" y="118" width="840" height="450" rx="46" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="192" textAnchor="middle" fill={colors.TEXT} fontSize="36" fontWeight="850">an Evidence Packet preserves provenance</text>
      <g transform="translate(330 264)">
        {FIELDS.map((field, i) => <g key={field} transform={`translate(0 ${i * 54})`}><rect width="290" height="40" rx="10" fill="#16233a" stroke={colors.SECONDARY} /><text x="14" y="25" fill={colors.TEXT} fontSize="13" fontFamily={colors.font.mono}>{field}</text></g>)}
        <text x="145" y="218" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontFamily={colors.font.mono}>round_report</text>
      </g>
      <path d="M646 354 H770" stroke={colors.WARM} strokeWidth="7" /><polygon points="770,354 746,340 746,368" fill={colors.WARM} />
      <g transform="translate(884 354)"><rect x="-98" y="-94" width="196" height="188" rx="28" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="4" /><text y="-30" textAnchor="middle" fill={colors.POSITIVE} fontSize="16" fontWeight="800">quoted turns</text><text y="2" textAnchor="middle" fill={colors.TEXT} fontSize="14" fontFamily={colors.font.mono}>E12 · E14 · E16</text><text y="48" textAnchor="middle" fill={colors.TEXT} fontSize="14">complete · unchanged</text></g>
      <text x="640" y="542" textAnchor="middle" fill={colors.MUTED} fontSize="17">structured report · validated citations · finite budget</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
