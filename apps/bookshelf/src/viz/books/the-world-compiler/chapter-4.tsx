// Grounding: scripts/verify_release_reproduction.py;
// REPRODUCTION_CHECK_REPORT.md; paper_generalization_table.csv;
// FINAL_MAIN_METRIC_TOTAL_TABLE_20260706.md.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const HASHES = Array.from({ length: 52 }, (_, i) => ({ col: i % 13, row: Math.floor(i / 13) }));
const TRANSFER = [
  { label: 'Distribution Unity OOD', scratch: 0.25, adapted: 0.75 },
  { label: 'Unity → Unreal', scratch: 0.25, adapted: 0.35 },
  { label: 'Unity → Godot', scratch: 0.15, adapted: 0.35 },
];
const EMBODIED = [
  { label: 'R2R success %', before: 76.0057, after: 76.6071, max: 80 },
  { label: 'MuJoCo return', before: 1568.4401, after: 1724.7304, max: 1900 },
  { label: 'D4RL score', before: 18.2952, after: 27.1553, max: 32 },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const packageU = tl.channel('released package', 0);
  const hashesP = tl.channel('sha manifest checks', 0);
  const scriptsP = tl.channel('syntax checks', 0);
  const passU = tl.channel('verifier pass', 0);
  const meanU = tl.channel('eight seed mean', 0);
  const figureU = tl.channel('single figure seed', 0);
  const trueGenU = tl.channel('true generation results', 0);
  const transferU = tl.channel('generalization panels', 0);
  const embodiedU = tl.channel('embodied diagnostics', 0);
  const boundaryU = tl.channel('verification boundary', 0);
  const close = tl.channel('auditable loop', 0);

  tl.caption({ at: 0.4, dur: 6.1, text: 'A claim becomes auditable when its result tables, scripts, and provenance can all be checked together.' });
  tl.tween(packageU, 1, { at: 0.9, dur: 1.1, ease: ease.enter });

  tl.caption({ at: 6.5, dur: 6.3, text: 'The release verifier checks fifty-two file hashes, compiles ten Python scripts, inspects one shell script, and scans for private traces.' });
  tl.tween(hashesP, HASHES.length, { at: 7.0, dur: 3.4, ease: ease.linear });
  tl.tween(scriptsP, 11, { at: 9.4, dur: 1.6, ease: ease.enter });
  tl.tween(passU, 1, { at: 11.1, dur: 0.5, ease: ease.pop });

  tl.caption({ at: 12.8, dur: 6.3, text: 'For the main benchmark, the report separates the eight-seed mean from the stronger single seed used in one figure.' });
  tl.tween(meanU, 1, { at: 13.3, dur: 1.5, ease: ease.draw });
  tl.tween(figureU, 1, { at: 15.2, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: 414, y: 364, k: 1.1 }, { at: 16.3, dur: 1.2, ease: ease.move });

  tl.caption({ at: 19.1, dur: 6.2, text: 'The same checker reads fresh-generation quality and pass rate from the released Unity-backed result files.' });
  tl.tween(trueGenU, 1, { at: 19.6, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 23.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 25.3, dur: 6.3, text: 'Transfer rows stay explicit: adaptation raises the reviewer score for held-out Unity, Unreal, and Godot targets in these released evaluations.' });
  tl.tween(transferU, 1, { at: 25.8, dur: 2.0, ease: ease.draw });
  tl.tween(cam, { x: 700, y: 340, k: 1.04 }, { at: 28.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 31.6, dur: 6.3, text: 'The embodied diagnostics move by different amounts, so the report preserves each benchmark’s own metric and sample count.' });
  tl.tween(embodiedU, 1, { at: 32.1, dur: 1.8, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 35.7, dur: 1.2, ease: ease.move });

  tl.caption({ at: 37.9, dur: 6.2, text: 'This quick verifier reproduces numbers from released artifacts. It does not rerun the full graphics engines or the original training jobs.' });
  tl.tween(boundaryU, 1, { at: 38.4, dur: 1.1, ease: ease.enter });

  tl.caption({ at: 44.1, dur: 6.5, text: 'That is the full loop: execute the world, combine two judges, keep the repair, and publish enough evidence to audit the claim.' });
  tl.tween(close, 1, { at: 44.8, dur: 1.1, ease: ease.move });
  tl.hold(50.7, 1.0);

  return { tl, cam, packageU, hashesP, scriptsP, passU, meanU, figureU, trueGenU, transferU, embodiedU, boundaryU, close };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const hashesP = s.get(scene.hashesP);
  const scriptsP = s.get(scene.scriptsP);
  const mean = s.get(scene.meanU);
  const figure = s.get(scene.figureU);
  const trueGen = s.get(scene.trueGenU);
  const transfer = s.get(scene.transferU);
  const embodied = s.get(scene.embodiedU);
  const boundary = s.get(scene.boundaryU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="72" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">A claim should survive its own verifier</text>

      <g opacity={s.get(scene.packageU)}>
        <rect x="58" y="104" width="382" height="224" rx="30" fill="#101b2d" stroke={s.get(scene.passU) ? colors.POSITIVE : colors.ACCENT} strokeWidth="3" />
        <text x="249" y="138" textAnchor="middle" fill={colors.ACCENT} fontSize="13" fontFamily={colors.font.mono}>FILE_MANIFEST.sha256</text>
        <g transform="translate(88 160)">
          {HASHES.map((cell, i) => {
            const u = clamp01(hashesP - i);
            return <rect key={i} x={cell.col * 24} y={cell.row * 24} width="16" height="16" rx="4" fill={u ? colors.POSITIVE : colors.GRID} opacity={0.25 + u * 0.75} />;
          })}
        </g>
        <text x="249" y="286" textAnchor="middle" fill={colors.MUTED} fontSize="12">52 files</text>
      </g>

      <g opacity={clamp01(scriptsP)}>
        <rect x="58" y="350" width="382" height="176" rx="30" fill="#111b2d" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="249" y="384" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontWeight="780">syntax and release-policy checks</text>
        <g transform="translate(91 410)">{Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 30} width="20" height="58" rx="7" fill={i < scriptsP ? colors.ACCENT : colors.GRID} opacity={i < scriptsP ? 0.85 : 0.25} />)}</g>
        <text x="110" y="496" fill={colors.MUTED} fontSize="12">10 Python</text>
        <rect x="322" y="410" width="66" height="58" rx="14" fill={scriptsP > 10 ? colors.WARM : colors.GRID} opacity={scriptsP > 10 ? 0.85 : 0.25} />
        <text x="355" y="496" textAnchor="middle" fill={colors.MUTED} fontSize="12">1 shell</text>
      </g>

      <g opacity={mean * (1 - boundary)}>
        <rect x="474" y="102" width="352" height="200" rx="30" fill="#0f1a2b" stroke={colors.GRID} strokeWidth="2" />
        <text x="650" y="138" textAnchor="middle" fill={colors.TEXT} fontSize="15" fontWeight="780">UnitySceneBench primary</text>
        <text x="502" y="182" fill={colors.MUTED} fontSize="12">eight-seed mean</text>
        <rect x="502" y="196" width="274" height="28" rx="14" fill={colors.GRID} opacity="0.5" />
        <rect x="502" y="196" width={274 * (0.5509 / 0.7) * mean} height="28" rx="14" fill={colors.POSITIVE} />
        <text x="786" y="216" textAnchor="end" fill={colors.TEXT} fontSize="13" fontFamily={colors.font.mono}>0.5509 ± 0.0727</text>
        <g opacity={figure}>
          <text x="502" y="258" fill={colors.MUTED} fontSize="12">Figure 4 source seed</text>
          <rect x="502" y="272" width={274 * (0.681 / 0.7)} height="28" rx="14" fill={colors.WARM} opacity="0.85" />
          <text x="786" y="292" textAnchor="end" fill={colors.TEXT} fontSize="13" fontFamily={colors.font.mono}>0.681 · seed 2026070501</text>
        </g>
      </g>

      <g opacity={trueGen * (1 - boundary)}>
        <rect x="852" y="102" width="366" height="200" rx="30" fill="#0f241e" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="1035" y="138" textAnchor="middle" fill={colors.POSITIVE} fontSize="15" fontWeight="780">true Unity generation · 720</text>
        <text x="880" y="182" fill={colors.WARM} fontSize="12">engine only</text>
        <text x="1000" y="182" fill={colors.TEXT} fontSize="12">quality 0.7934 · pass 0.9375</text>
        <text x="880" y="228" fill={colors.POSITIVE} fontSize="12">full RLHEV</text>
        <text x="1000" y="228" fill={colors.TEXT} fontSize="12">quality 0.8197 · pass 0.9688</text>
        <text x="1035" y="286" textAnchor="middle" fill={colors.MUTED} fontSize="11">128 generated payloads per method</text>
      </g>

      <g opacity={transfer * (1 - boundary)}>
        <rect x="474" y="318" width="366" height="178" rx="30" fill="#111a2b" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="657" y="348" textAnchor="middle" fill={colors.ACCENT} fontSize="15" fontWeight="780">target-adapted transfer</text>
        {TRANSFER.map((row, i) => <g key={row.label}>
          <text x="496" y={367 + i * 40} fill={colors.MUTED} fontSize="10">{row.label}</text>
          <rect x="496" y={373 + i * 40} width={row.scratch * 240} height="11" rx="6" fill={colors.MUTED} />
          <rect x="496" y={387 + i * 40} width={row.adapted * 240 * transfer} height="11" rx="6" fill={colors.POSITIVE} />
          <text x="814" y={383 + i * 40} textAnchor="end" fill={colors.MUTED} fontSize="10">{row.scratch.toFixed(2)}</text>
          <text x="814" y={397 + i * 40} textAnchor="end" fill={colors.POSITIVE} fontSize="10">{row.adapted.toFixed(2)}</text>
        </g>)}
      </g>

      <g opacity={embodied * (1 - boundary)}>
        <rect x="866" y="318" width="352" height="178" rx="30" fill="#18162b" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="1042" y="348" textAnchor="middle" fill={colors.SECONDARY} fontSize="15" fontWeight="780">embodied diagnostics</text>
        {EMBODIED.map((row, i) => <g key={row.label}>
          <text x="890" y={376 + i * 39} fill={colors.MUTED} fontSize="10">{row.label}</text>
          <rect x="890" y={384 + i * 39} width="270" height="28" rx="14" fill={colors.GRID} opacity="0.45" />
          <rect x="890" y={384 + i * 39} width={(row.before / row.max) * 270} height="12" rx="6" fill={colors.MUTED} />
          <rect x="890" y={400 + i * 39} width={(row.after / row.max) * 270 * embodied} height="12" rx="6" fill={colors.SECONDARY} />
          <text x="1178" y={402 + i * 39} textAnchor="end" fill={colors.TEXT} fontSize="10" fontFamily={colors.font.mono}>{row.before.toFixed(2)} → {row.after.toFixed(2)}</text>
        </g>)}
      </g>

      <g opacity={s.get(scene.passU) * (1 - boundary)} transform="translate(248 474)">
        <rect x="-130" y="-28" width="260" height="56" rx="28" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="3" />
        <text textAnchor="middle" y="6" fill={colors.POSITIVE} fontSize="18" fontWeight="850">PASS · released artifacts</text>
      </g>

      <g opacity={boundary}>
        <rect x="442" y="90" width="790" height="410" rx="36" fill={colors.BG} fillOpacity="0.96" stroke={colors.WARM} strokeWidth="4" />
        <text x="837" y="148" textAnchor="middle" fill={colors.WARM} fontSize="28" fontWeight="850">what this PASS means</text>
        <g transform="translate(604 254)"><circle r="66" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="5" /><path d="M-28 0 L-8 22 L34 -26" fill="none" stroke={colors.POSITIVE} strokeWidth="10" strokeLinecap="round" /><text y="102" textAnchor="middle" fill={colors.POSITIVE} fontSize="15">released files agree</text></g>
        <g transform="translate(1036 254)"><circle r="66" fill="#32141c" stroke={colors.NEGATIVE} strokeWidth="5" /><path d="M-28 -28 L28 28 M28 -28 L-28 28" stroke={colors.NEGATIVE} strokeWidth="10" strokeLinecap="round" /><text y="102" textAnchor="middle" fill={colors.NEGATIVE} fontSize="15">full jobs not rerun</text></g>
        <text x="837" y="432" textAnchor="middle" fill={colors.MUTED} fontSize="17">integrity and arithmetic are reproducible</text>
        <text x="837" y="464" textAnchor="middle" fill={colors.MUTED} fontSize="17">training and engine execution remain separate evidence</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="150" y="118" width="980" height="448" rx="44" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="192" textAnchor="middle" fill={colors.TEXT} fontSize="41" fontWeight="850">the verifiable data engine</text>
      {[
        { x: 286, label: 'EXECUTE', sub: 'world', color: colors.ACCENT },
        { x: 522, label: 'JUDGE', sub: 'engine + human', color: colors.WARM },
        { x: 758, label: 'REPAIR', sub: 'linked trace', color: colors.SECONDARY },
        { x: 994, label: 'AUDIT', sub: 'released evidence', color: colors.POSITIVE },
      ].map((step, i) => <g key={step.label} transform={`translate(${step.x} 348)`}>
        <circle r="72" fill={step.color} fillOpacity="0.12" stroke={step.color} strokeWidth="5" />
        <text textAnchor="middle" y="-4" fill={step.color} fontSize="17" fontWeight="850">{step.label}</text>
        <text textAnchor="middle" y="24" fill={colors.MUTED} fontSize="12">{step.sub}</text>
        {i < 3 && <g><path d="M78 0 H150" stroke={colors.GRID} strokeWidth="7" /><polygon points="150,0 132,-12 132,12" fill={colors.GRID} /></g>}
      </g>)}
      <text x="640" y="516" textAnchor="middle" fill={colors.MUTED} fontSize="17">the claim is strongest where every arrow leaves evidence</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
