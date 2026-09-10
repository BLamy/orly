// Grounding: arXiv:2609.08183 Sections 3.2–3.3; official NeoHorse README.md Highlights.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const CHECKS = ['readable payload', 'message structure', 'causal order', 'call/result closure'] as const;
const DIMENSIONS = [
  ['goal attainment', 'PASS', colors.POSITIVE],
  ['instruction adherence', 'PASS', colors.POSITIVE],
  ['tool use', 'WARN', colors.WARM],
  ['evidence consistency', 'PASS', colors.POSITIVE],
  ['error recovery', 'PASS', colors.POSITIVE],
  ['termination', 'NOT EVALUATED', colors.MUTED],
] as const;
const LENSES = [
  ['SCENE', 'task + context', colors.ACCENT],
  ['GOAL', 'acceptance criteria', colors.WARM],
  ['OUTCOME', 'verifiable result', colors.POSITIVE],
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const rawU = tl.channel('raw trajectory', 0);
  const dedupU = tl.channel('deduplication', 0);
  const structuralU = tl.channel('structural checks', 0);
  const lanesU = tl.channel('operational outcomes', 0);
  const recoverU = tl.channel('recoverable fragment', 0);
  const semanticU = tl.channel('semantic dimensions', 0);
  const evidenceU = tl.channel('missing evidence', 0);
  const lensU = tl.channel('scene goal outcome', 0);
  const recordU = tl.channel('structured quality record', 0);
  const closeU = tl.channel('quality close', 0);
  const scan = tl.channel('scanner', 0);
  tl.tween(scan, 1, { at: 0, dur: 59, ease: ease.linear });

  tl.caption({ at: 0.4, dur: 5.5, text: 'A recorded trajectory is rich, but rich is not the same as reliable supervision.' });
  tl.tween(rawU, 1, { at: 0.9, dur: 1.3, ease: ease.draw });
  tl.tween(cam, { x: 250, y: 330, k: 1.1 }, { at: 2.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.2, dur: 5.5, text: 'Exact and near duplicates fall away first, and matching against evaluation items keeps the training side disjoint.' });
  tl.tween(dedupU, 1, { at: 6.8, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 9.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.0, dur: 5.5, text: 'Structural validation reconstructs requests, responses, tool calls, observations, terminal events, and their causal order.' });
  tl.tween(structuralU, 1, { at: 12.6, dur: 1.5, ease: ease.draw });

  tl.caption({ at: 17.8, dur: 5.5, text: 'Its reproducible rules check that every call closes with a result and every event belongs to an unambiguous branch.' });
  tl.tween(structuralU, 2, { at: 18.4, dur: 2.0, ease: ease.move });
  tl.tween(cam, { x: 535, y: 330, k: 1.1 }, { at: 20.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 23.6, dur: 5.5, text: 'The gate separates complete traces, recoverable traces, and quarantined traces instead of pretending every record is whole.' });
  tl.tween(lanesU, 1, { at: 24.2, dur: 1.3, ease: ease.enter });

  tl.caption({ at: 29.4, dur: 5.5, text: 'A recoverable trace contributes only its causally closed fragment; ambiguous ownership never becomes a supervision target.' });
  tl.tween(recoverU, 1, { at: 30.0, dur: 1.5, ease: ease.move });

  tl.caption({ at: 35.2, dur: 5.5, text: 'Structurally usable traces then face six separate judgments: goal, instructions, tools, evidence, recovery, and termination.' });
  tl.tween(semanticU, 1, { at: 35.8, dur: 2.8, ease: ease.draw });
  tl.tween(cam, { x: 925, y: 335, k: 1.08 }, { at: 36.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 41.0, dur: 5.5, text: 'Missing evidence stays not evaluated. It never quietly turns into a passing verdict.' });
  tl.tween(evidenceU, 1, { at: 41.6, dur: 1.0, ease: ease.pop });

  tl.caption({ at: 46.8, dur: 5.5, text: 'Scene, goal, and outcome describe the subscene, while their source and confidence keep deterministic facts in charge.' });
  tl.tween(lensU, 1, { at: 47.4, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 49.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 52.6, dur: 6.0, text: 'The result is a structured quality record with coverage preserved, not one convenient score that hides uncertainty.' });
  tl.tween(recordU, 1, { at: 53.2, dur: 1.0, ease: ease.pop });
  tl.tween(closeU, 1, { at: 54.6, dur: 1.2, ease: ease.move });
  tl.hold(58.8, 1.0);

  return { tl, cam, rawU, dedupU, structuralU, lanesU, recoverU, semanticU, evidenceU, lensU, recordU, closeU, scan };
}

const scene = buildScene();

function TraceStrip({ x, y, u, dim = 0 }: { x: number; y: number; u: number; dim?: number }) {
  const cells = ['U', 'A', 'CALL', 'OBS', 'A', 'END'];
  return <g transform={`translate(${x} ${y})`} opacity={clamp01(u) * (1 - dim * 0.85)}>
    {cells.map((label, i) => <g key={`${label}-${i}`} transform={`translate(${i * 54} 0)`}>
      <rect width="46" height="40" rx="10" fill={label === 'OBS' ? '#13291f' : '#15243a'} stroke={label === 'CALL' ? colors.WARM : label === 'OBS' ? colors.POSITIVE : colors.ACCENT} />
      <text x="23" y="25" textAnchor="middle" fill={colors.TEXT} fontSize="9" fontFamily={colors.font.mono}>{label}</text>
    </g>)}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const dedup = s.get(scene.dedupU);
  const structural = s.get(scene.structuralU);
  const lanes = s.get(scene.lanesU);
  const semantic = s.get(scene.semanticU);
  const scanX = 90 + 1040 * s.get(scene.scan);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="72" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">quality is a stack of evidence</text>
      <rect x="70" y="120" width="1140" height="470" rx="38" fill="#0e1626" stroke={colors.GRID} strokeWidth="2" />
      <line x1={scanX} y1="128" x2={scanX} y2="580" stroke={colors.ACCENT} strokeWidth="2" opacity={0.18 + s.get(scene.rawU) * 0.2} />

      <g opacity={s.get(scene.rawU)}>
        <text x="115" y="165" fill={colors.ACCENT} fontSize="13" fontFamily={colors.font.mono}>raw trajectories</text>
        <TraceStrip x={112} y={190} u={1} />
        <TraceStrip x={112} y={244} u={1} dim={dedup} />
        <TraceStrip x={112} y={298} u={1} dim={dedup} />
        <text x="274" y="360" textAnchor="middle" fill={colors.NEGATIVE} fontSize="12" opacity={dedup}>exact / near duplicate</text>
        <path d="M128 354 H420" stroke={colors.NEGATIVE} strokeWidth="5" opacity={dedup} />
        <rect x="132" y="392" width="278" height="64" rx="20" fill="#2a1921" stroke={colors.NEGATIVE} opacity={dedup} />
        <text x="271" y="420" textAnchor="middle" fill={colors.NEGATIVE} fontSize="12" fontFamily={colors.font.mono}>evaluation overlap</text>
        <text x="271" y="441" textAnchor="middle" fill={colors.TEXT} fontSize="11">remove from training</text>
      </g>

      <g opacity={clamp01(structural)}>
        <rect x="454" y="142" width="324" height="330" rx="30" fill="#111c2c" stroke={colors.WARM} strokeWidth="3" />
        <text x="616" y="178" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>structural validation</text>
        {CHECKS.map((check, i) => {
          const u = clamp01(structural * 2 - i * 0.22);
          return <g key={check} transform={`translate(490 ${214 + i * 52})`} opacity={u}>
            <circle cx="12" cy="0" r="11" fill="#143329" stroke={colors.POSITIVE} />
            <path d="M6 0 L11 5 L19 -6" fill="none" stroke={colors.POSITIVE} strokeWidth="3" />
            <text x="38" y="5" fill={colors.TEXT} fontSize="12">{check}</text>
          </g>;
        })}
        <g opacity={clamp01(structural - 1)}>
          <path d="M510 430 H720" stroke={colors.ACCENT} strokeWidth="4" />
          <circle cx="560" cy="430" r="8" fill={colors.ACCENT} />
          <circle cx="668" cy="430" r="8" fill={colors.POSITIVE} />
          <text x="615" y="453" textAnchor="middle" fill={colors.MUTED} fontSize="11">call id ↔ result id</text>
        </g>
      </g>

      <g opacity={lanes}>
        {[['COMPLETE', colors.POSITIVE, 494], ['RECOVERABLE', colors.WARM, 616], ['QUARANTINED', colors.NEGATIVE, 738]].map(([label, color, x], i) => <g key={String(label)} transform={`translate(${x} 510)`}>
          <rect x="-57" y="-22" width="114" height="44" rx="15" fill={colors.PANEL} stroke={String(color)} strokeWidth="2" />
          <text y="5" textAnchor="middle" fill={String(color)} fontSize="10" fontFamily={colors.font.mono}>{String(label)}</text>
          {i === 1 && <path d="M-50 35 H50" stroke={colors.WARM} strokeWidth={4} strokeDasharray="7 6" opacity={s.get(scene.recoverU)} />}
        </g>)}
      </g>

      <g opacity={clamp01(semantic)}>
        <rect x="812" y="132" width="348" height="348" rx="30" fill="#111a2b" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="986" y="168" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontFamily={colors.font.mono}>six independent dimensions</text>
        {DIMENSIONS.map(([label, verdict, color], i) => {
          const u = clamp01(semantic * 2.3 - i * 0.22);
          return <g key={label} transform={`translate(840 ${205 + i * 43})`} opacity={u}>
            <text y="4" fill={colors.TEXT} fontSize="11">{label}</text>
            <rect x="178" y="-14" width="112" height="28" rx="12" fill={verdict === 'PASS' ? '#143329' : verdict === 'WARN' ? '#312512' : '#202838'} stroke={color} />
            <text x="234" y="4" textAnchor="middle" fill={color} fontSize="9" fontFamily={colors.font.mono}>{verdict}</text>
          </g>;
        })}
        <circle cx="1132" cy="420" r={18 + s.get(scene.evidenceU) * 7} fill="#222a38" stroke={colors.MUTED} strokeWidth="3" opacity={s.get(scene.evidenceU)} />
      </g>

      <g opacity={s.get(scene.lensU)} transform="translate(846 512)">
        {LENSES.map(([name, desc, color], i) => <g key={name} transform={`translate(${i * 112} 0)`}>
          <circle r="42" fill={colors.PANEL} stroke={color} strokeWidth="3" />
          <text y="-3" textAnchor="middle" fill={color} fontSize="11" fontFamily={colors.font.mono}>{name}</text>
          <text y="18" textAnchor="middle" fill={colors.MUTED} fontSize="8">{desc}</text>
        </g>)}
      </g>
      <g opacity={s.get(scene.recordU)} transform="translate(640 596)">
        <rect x="-240" y="-28" width="480" height="56" rx="20" fill="#13291f" stroke={colors.POSITIVE} strokeWidth="3" />
        <text y="5" textAnchor="middle" fill={colors.POSITIVE} fontSize="13" fontFamily={colors.font.mono}>structure + six verdicts + coverage + provenance</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="215" y="126" width="850" height="420" rx="48" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="212" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">uncertainty stays visible</text>
      <g transform="translate(360 356)"><circle r="92" fill="#13291f" stroke={colors.POSITIVE} strokeWidth="4" /><text y="-8" textAnchor="middle" fill={colors.POSITIVE} fontSize="18">deterministic facts</text><text y="22" textAnchor="middle" fill={colors.MUTED} fontSize="13">cannot be overwritten</text></g>
      <path d="M458 356 H550" stroke={colors.WARM} strokeWidth="6" /><polygon points="550,356 528,343 528,369" fill={colors.WARM} />
      <g transform="translate(735 356)"><circle r="92" fill="#202838" stroke={colors.MUTED} strokeWidth="4" /><text y="-8" textAnchor="middle" fill={colors.MUTED} fontSize="18">missing evidence</text><text y="22" textAnchor="middle" fill={colors.TEXT} fontSize="13">not evaluated</text></g>
      <text x="640" y="500" textAnchor="middle" fill={colors.POSITIVE} fontSize="19">no magic score hides the gap</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
