// Grounding: arXiv:2609.02749 Sections 5.1–5.5, Tables 1–4, and Appendix A.2.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const RESULTS = [
  { name: 'MLE-bench', metric: 'Any Medal (%)', base: 31.11, skill: 72.89, max: 100, gain: '+134.3%' },
  { name: 'PaperBench', metric: 'replication score', base: 29.45, skill: 39.59, max: 100, gain: '+34.4%' },
  { name: 'FrontierCS', metric: 'Agent Track score', base: 70.63, skill: 77.14, max: 100, gain: '+9.22%' },
  { name: 'PassNet', metric: 'AS Score', base: 1.343, skill: 1.5313, max: 2, gain: '+14.0%' },
] as const;
const ROUTE = ['anchor z', 'evidence X', 'candidate G̃', 'verified G', 'routed K', 'execution'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const lockU = tl.channel('fixed controls', 0);
  const splitU = tl.channel('construction split', 0);
  const baseU = RESULTS.map((r) => tl.channel(`${r.name} baseline`, 0));
  const skillU = RESULTS.map((r) => tl.channel(`${r.name} skill`, 0));
  const gainU = tl.channel('relative gains', 0);
  const scaleU = tl.channel('scale warning', 0);
  const regressU = tl.channel('reported regressions', 0);
  const routeU = tl.channel('route recap', 0);
  const closeU = tl.channel('measured variable', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'To test the missing layer, the paper locks the version five point five model, the harness, and the downstream execution budget.' });
  tl.tween(lockU, 1, { at: 0.9, dur: 1.2, ease: ease.enter });

  tl.caption({ at: 6.6, dur: 5.8, text: 'Skill construction finishes before benchmark running begins, so the downstream comparison changes access to operating context.' });
  tl.tween(splitU, 1, { at: 7.1, dur: 1.4, ease: ease.draw });

  tl.caption({ at: 12.8, dur: 5.8, text: 'On the full machine-learning engineering benchmark, the Any Medal rate rises from thirty-one point one one percent to seventy-two point eight nine percent.' });
  tl.tween(baseU[0], 1, { at: 13.3, dur: 1.0, ease: ease.draw });
  tl.tween(skillU[0], 1, { at: 14.5, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 680, y: 320, k: 1.05 }, { at: 15.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 19.0, dur: 5.8, text: 'On the paper replication benchmark, the average score rises from twenty-nine point four five to thirty-nine point five nine.' });
  tl.tween(baseU[1], 1, { at: 19.5, dur: 1.0, ease: ease.draw });
  tl.tween(skillU[1], 1, { at: 20.7, dur: 1.4, ease: ease.move });

  tl.caption({ at: 25.2, dur: 5.8, text: 'On the algorithm optimization track, the score rises from seventy point six three to seventy-seven point one four across one hundred eighty-eight tasks.' });
  tl.tween(baseU[2], 1, { at: 25.7, dur: 1.0, ease: ease.draw });
  tl.tween(skillU[2], 1, { at: 26.9, dur: 1.4, ease: ease.move });

  tl.caption({ at: 31.4, dur: 5.8, text: 'On the compiler pass benchmark, the aggregate score rises from one point three four three to one point five three one three, while failed samples fall from fourteen to five.' });
  tl.tween(baseU[3], 1, { at: 31.9, dur: 1.0, ease: ease.draw });
  tl.tween(skillU[3], 1, { at: 33.1, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 35.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 37.6, dur: 5.8, text: 'The relative gains are one hundred thirty-four point three, thirty-four point four, nine point two two, and fourteen percent.' });
  tl.tween(gainU, 1, { at: 38.2, dur: 1.2, ease: ease.pop });

  tl.caption({ at: 43.8, dur: 5.8, text: 'Each row keeps its own metric and scale. These bars compare conditions within a benchmark, not the benchmarks against one another.' });
  tl.tween(scaleU, 1, { at: 44.4, dur: 1.0, ease: ease.enter });

  tl.caption({ at: 50.0, dur: 5.8, text: 'The result is not uniform: skills lower two of the twenty paper replication task scores, a warning that retrieval precision still matters.' });
  tl.tween(regressU, 1, { at: 50.6, dur: 1.2, ease: ease.pop });

  tl.caption({ at: 56.2, dur: 5.8, text: 'Now retrace the mechanism: choose an anchor, retain evidence, build a graph, verify it, route one branch, then execute.' });
  tl.tween(routeU, 1, { at: 56.8, dur: 3.8, ease: ease.linear });

  tl.caption({ at: 62.4, dur: 6.2, text: 'Under this matched setup, the changed variable is operational knowledge: not a new backbone, not a new harness, but better context at the moment of action.' });
  tl.tween(closeU, 1, { at: 63.1, dur: 1.2, ease: ease.move });
  tl.hold(68.8, 1.0);

  return { tl, cam, lockU, splitU, baseU, skillU, gainU, scaleU, regressU, routeU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const gains = s.get(scene.gainU);
  const route = s.get(scene.routeU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="66" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">hold everything else still</text>
      <g opacity={s.get(scene.lockU)}>
        <rect x="118" y="92" width="1044" height="74" rx="22" fill={colors.PANEL} stroke={colors.WARM} strokeWidth="3" />
        {['GPT-5.5 backbone', 'Codex harness', 'downstream budget'].map((label, i) => <g key={label} transform={`translate(${300 + i * 340} 130)`}>
          <circle cx="-92" r="11" fill={colors.WARM} />
          <path d="M-98 -2 v-8 a6 6 0 0 1 12 0 v8" fill="none" stroke={colors.WARM} strokeWidth="3" />
          <text x="-70" y="6" fill={colors.TEXT} fontSize="15" fontWeight="700">{label}</text>
        </g>)}
      </g>
      <g opacity={s.get(scene.splitU)}>
        <path d="M130 194 H510" stroke={colors.SECONDARY} strokeWidth="6" strokeLinecap="round" />
        <path d="M770 194 H1150" stroke={colors.POSITIVE} strokeWidth="6" strokeLinecap="round" />
        <text x="320" y="218" textAnchor="middle" fill={colors.SECONDARY} fontSize="13">construction · before execution</text>
        <text x="960" y="218" textAnchor="middle" fill={colors.POSITIVE} fontSize="13">running · matched downstream budget</text>
        <path d="M610 184 h60 v20 h-60 z" fill={colors.PANEL} stroke={colors.WARM} strokeWidth="2" />
        <text x="640" y="199" textAnchor="middle" fill={colors.WARM} fontSize="11">freeze</text>
      </g>

      <g transform="translate(124 252)">
        {RESULTS.map((r, i) => {
          const y = i * 86;
          const baseW = 690 * (r.base / r.max) * s.get(scene.baseU[i]);
          const skillW = 690 * (r.skill / r.max) * s.get(scene.skillU[i]);
          return <g key={r.name} transform={`translate(0 ${y})`}>
            <text x="0" y="8" fill={colors.TEXT} fontSize="16" fontWeight="800">{r.name}</text>
            <text x="0" y="29" fill={colors.MUTED} fontSize="11">{r.metric}</text>
            <line x1="165" y1="0" x2="855" y2="0" stroke={colors.GRID} strokeWidth="16" strokeLinecap="round" />
            <line x1="165" y1="-10" x2={165 + baseW} y2="-10" stroke={colors.MUTED} strokeWidth="12" strokeLinecap="round" />
            <line x1="165" y1="10" x2={165 + skillW} y2="10" stroke={colors.POSITIVE} strokeWidth="12" strokeLinecap="round" />
            <text x={180 + baseW} y="-6" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>{r.base}</text>
            <text x={180 + skillW} y="15" fill={colors.POSITIVE} fontSize="13" fontFamily={colors.font.mono}>{r.skill}</text>
            <g opacity={gains} transform="translate(930 0)">
              <rect x="-55" y="-24" width="110" height="48" rx="16" fill="#102a22" stroke={colors.POSITIVE} />
              <text y="6" textAnchor="middle" fill={colors.POSITIVE} fontSize="16" fontWeight="850">{r.gain}</text>
            </g>
          </g>;
        })}
      </g>
      <g opacity={s.get(scene.scaleU)} transform="translate(900 596)">
        <rect x="-254" y="-31" width="508" height="62" rx="18" fill={colors.PANEL} stroke={colors.ACCENT} />
        <text y="-5" textAnchor="middle" fill={colors.ACCENT} fontSize="14" fontWeight="800">WITHIN-ROW COMPARISON</text>
        <text y="18" textAnchor="middle" fill={colors.MUTED} fontSize="12">each benchmark keeps its own metric and scale</text>
      </g>
      <g opacity={s.get(scene.regressU)} transform="translate(350 596)">
        <rect x="-226" y="-31" width="452" height="62" rx="18" fill="#2a1720" stroke={colors.NEGATIVE} />
        <text y="-5" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14" fontWeight="800">2 OF 20 PAPERBENCH TASKS REGRESS</text>
        <text y="18" textAnchor="middle" fill={colors.MUTED} fontSize="12">retrieval precision remains a failure mode</text>
      </g>

      <g opacity={route}>
        <rect x="90" y="240" width="1100" height="350" rx="36" fill={colors.BG} opacity={0.96} stroke={colors.ACCENT} strokeWidth="3" />
        <text x="640" y="304" textAnchor="middle" fill={colors.TEXT} fontSize="30" fontWeight="850">the mechanism, end to end</text>
        {ROUTE.map((label, i) => {
          const u = clamp01(route * ROUTE.length - i);
          const x = 180 + i * 184;
          return <g key={label} opacity={u} transform={`translate(${x} 430) scale(${0.82 + 0.18 * u})`}>
            {i < ROUTE.length - 1 && <path d="M54 0 H125" stroke={colors.ACCENT} strokeWidth="4" />}
            <circle r="48" fill={colors.PANEL} stroke={i >= 3 ? colors.POSITIVE : colors.SECONDARY} strokeWidth="3" />
            <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="13">{label}</text>
          </g>;
        })}
      </g>
    </g>
    <g opacity={close}>
      <rect x="205" y="145" width="870" height="400" rx="44" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="235" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">the measured variable is context</text>
      <g transform="translate(640 355)">
        {[
          ['Mθ', 'fixed', colors.SECONDARY], ['H', 'fixed', colors.ACCENT], ['K', 'added', colors.POSITIVE],
        ].map(([label, state, color], i) => <g key={label} transform={`translate(${(i - 1) * 220} 0)`}>
          <circle r={label === 'K' ? 70 : 58} fill={colors.PANEL} stroke={color} strokeWidth={label === 'K' ? 5 : 3} />
          <text y="-3" textAnchor="middle" fill={color} fontSize="30" fontWeight="850">{label}</text>
          <text y="25" textAnchor="middle" fill={colors.MUTED} fontSize="13">{state}</text>
        </g>)}
      </g>
      <text x="640" y="485" textAnchor="middle" fill={colors.WARM} fontSize="21">better operating context at the moment of action</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
