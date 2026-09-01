// Grounding: results/0.1.0/manifest.json and outcomes.jsonl;
// src/looparena/commands/results_summarize.py; LoopArena paper Sections 4 and 5 and Table 2.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const METHODS = ['Qwen3.7-Plus', 'DeepSeek-V4-Flash-0731', 'GLM 5.2', 'GPT-5.5', 'Claude Opus 4.8'];
const TYPE1 = [72.22, 77.78, 74.44, 87.78, 76.67];
const TYPE2 = [48.15, 45.68, 37.04, 51.85, 48.15];
const TYPE3 = [23.46, 19.75, 16.05, 24.69, 20.99];
const COST2 = [4.3, 2.1, 1.63, 5.0, 5.87];
const COST3 = [6.89, 10.24, 4.86, 18.84, 16.82];
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const protocolU = tl.channel('strict protocol gate', 0);
  const rowsU = tl.channel('controller rows', 0);
  const mode = tl.channel('result setting', 0);
  const refsU = tl.channel('reference policies', 0);
  const costU = tl.channel('paired costs', 0);
  const savingU = tl.channel('cost reduction', 0);
  const rankU = tl.channel('rank threads', 0);
  const ceilingU = tl.channel('full task ceiling', 0);
  const closeU = tl.channel('benchmark recap', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'A run counts only when the task evaluator passes and the control protocol stays valid, across three repeats per task.' });
  tl.tween(protocolU, 1, { at: 0.9, dur: 1.3, ease: ease.draw });

  tl.caption({ at: 6.5, dur: 5.8, text: 'Type One asks for exactly one of four Contracts. The five Controller scores range from seventy two to nearly eighty eight percent.' });
  tl.tween(rowsU, METHODS.length, { at: 7.1, dur: 2.8, ease: ease.enter });

  tl.caption({ at: 12.6, dur: 5.8, text: 'Now the same rows become Type Two Strict Success Rates, with one fixed Worker and Reporter behind every Controller.' });
  tl.tween(mode, 1, { at: 13.2, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: 670, y: 330, k: 1.05 }, { at: 15.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.7, dur: 5.8, text: 'Switch to complete Type Three tasks and the Controller range collapses to sixteen point zero five through twenty four point six nine percent.' });
  tl.tween(mode, 2, { at: 19.3, dur: 1.5, ease: ease.move });
  tl.tween(ceilingU, 1, { at: 21.0, dur: 0.8, ease: ease.pop });

  tl.caption({ at: 24.8, dur: 5.8, text: 'Fixed goal restatement beats no control on slices, but both finish full tasks at exactly eighteen point five two percent.' });
  tl.tween(refsU, 1, { at: 25.4, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 28.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.9, dur: 5.8, text: 'The paired cost bars show why the slice matters: Type Two reduces estimated inference cost by sixty four point four percent on average.' });
  tl.tween(costU, 1, { at: 31.5, dur: 1.2, ease: ease.draw });
  tl.tween(savingU, 1, { at: 33.0, dur: 0.7, ease: ease.pop });

  tl.caption({ at: 37.0, dur: 5.8, text: 'Its Controller ordering still tracks the full tasks closely, with a Spearman rank correlation of zero point nine seven four seven.' });
  tl.tween(rankU, 1, { at: 37.6, dur: 2.4, ease: ease.draw });

  tl.caption({ at: 43.1, dur: 5.8, text: 'But correlation is not completion. The strongest observed full task result still succeeds on fewer than one run in four.' });
  tl.tween(cam, { x: 855, y: 240, k: 1.28 }, { at: 43.7, dur: 1.2, ease: ease.move });
  tl.tween(ceilingU, 1.5, { at: 45.1, dur: 0.6, ease: ease.pop });

  tl.caption({ at: 49.2, dur: 6.2, text: 'Task, evidence, Contract, evaluator. Loop Arena makes runtime control measurable, while its own results show how much remains unsolved.' });
  tl.tween(cam, CAMERA_HOME, { at: 49.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.0, dur: 1.2, ease: ease.move });
  tl.hold(55.4, 1.2);

  return { tl, cam, protocolU, rowsU, mode, refsU, costU, savingU, rankU, ceilingU, closeU };
}

const scene = buildScene();

function valuesAt(mode: number) {
  if (mode <= 1) return TYPE1.map((v, i) => lerp(v, TYPE2[i], clamp01(mode)));
  return TYPE2.map((v, i) => lerp(v, TYPE3[i], clamp01(mode - 1)));
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const mode = s.get(scene.mode);
  const values = valuesAt(mode);
  const cost = s.get(scene.costU);
  const setting = mode < 0.5 ? 'TYPE I · CONTRACT ACCURACY' : mode < 1.5 ? 'TYPE II · STRICT SUCCESS RATE' : 'TYPE III · STRICT SUCCESS RATE';
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="62" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">strict success is the expensive claim</text>
      <g opacity={s.get(scene.protocolU)} transform="translate(110 88)">
        <rect width="1060" height="48" rx="24" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="2" />
        <text x="530" y="30" textAnchor="middle" fill={colors.POSITIVE} fontSize="13" fontFamily={colors.font.mono}>evaluator pass  AND  protocol valid  AND  3 repeats per task</text>
      </g>
      <text x="180" y="180" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>{setting}</text>
      <line x1="390" y1="470" x2="1080" y2="470" stroke={colors.GRID} strokeWidth="2" />
      {[0, 25, 50, 75, 100].map((v) => <g key={v}><line x1={390 + v * 6.7} y1="168" x2={390 + v * 6.7} y2="470" stroke={colors.GRID} strokeWidth="1" opacity="0.45" /><text x={390 + v * 6.7} y="492" textAnchor="middle" fill={colors.MUTED} fontSize="10">{v}%</text></g>)}
      {METHODS.map((method, i) => {
        const u = clamp01(s.get(scene.rowsU) - i);
        const y = 198 + i * 60;
        const val = values[i];
        const top = mode > 1.5 && i === 3;
        return <g key={method} opacity={u}>
          <text x="365" y={y + 7} textAnchor="end" fill={top ? colors.WARM : colors.TEXT} fontSize="12" fontFamily={colors.font.mono}>{method}</text>
          <rect x="390" y={y - 17} width={val * 6.7} height="34" rx="9" fill={top ? colors.WARM : i % 2 ? colors.SECONDARY : colors.ACCENT} opacity="0.78" />
          <text x={405 + val * 6.7} y={y + 6} fill={top ? colors.WARM : colors.TEXT} fontSize="12" fontWeight="800">{val.toFixed(2)}%</text>
          {cost > 0 && <g opacity={cost}><rect x="390" y={y + 22} width={COST3[i] * 24} height="7" rx="3.5" fill={colors.NEGATIVE} opacity="0.28" /><rect x="390" y={y + 22} width={COST2[i] * 24} height="7" rx="3.5" fill={colors.POSITIVE} /><text x="1080" y={y + 29} textAnchor="end" fill={colors.MUTED} fontSize="9" fontFamily={colors.font.mono}>{`$${COST2[i].toFixed(2)} / $${COST3[i].toFixed(2)}`}</text></g>}
        </g>;
      })}
      <g opacity={s.get(scene.refsU) * (1 - 0.85 * cost)} transform="translate(900 380)">
        <rect width="270" height="82" rx="18" fill="#151d2f" stroke={colors.MUTED} />
        <text x="18" y="27" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>Type II  fixed 46.91 · none 39.51</text>
        <text x="18" y="55" fill={colors.WARM} fontSize="11" fontFamily={colors.font.mono}>Type III fixed 18.52 · none 18.52</text>
      </g>
      <g opacity={s.get(scene.savingU)} transform="translate(1090 178)"><circle r="58" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="4" /><text y="-2" textAnchor="middle" fill={colors.POSITIVE} fontSize="22" fontWeight="900">−64.4%</text><text y="22" textAnchor="middle" fill={colors.MUTED} fontSize="9">paired cost</text></g>
      <g opacity={s.get(scene.rankU)}>
        <path d="M916 220 C990 245 930 276 865 288 S990 338 916 356 S990 410 865 424 S990 470 916 492" fill="none" stroke={colors.SECONDARY} strokeWidth="4" strokeDasharray="10 7" />
        <rect x="1010" y="360" width="168" height="56" rx="18" fill="#221c35" stroke={colors.SECONDARY} /><text x="1094" y="385" textAnchor="middle" fill={colors.SECONDARY} fontSize="17" fontWeight="850">ρ = 0.9747</text><text x="1094" y="404" textAnchor="middle" fill={colors.MUTED} fontSize="9">Controller ranks only</text>
      </g>
      <g opacity={s.get(scene.ceilingU)} transform="translate(910 158)"><rect x="-94" y="-25" width="188" height="50" rx="16" fill="#2b2415" stroke={colors.WARM} strokeWidth="3" /><text y="6" textAnchor="middle" fill={colors.WARM} fontSize="16" fontWeight="900">best Type III: 24.69%</text></g>
    </g>
    <g opacity={close}>
      <rect x="156" y="118" width="968" height="446" rx="44" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="192" textAnchor="middle" fill={colors.TEXT} fontSize="39" fontWeight="850">runtime control becomes measurable</text>
      {['task', 'evidence', 'Contract', 'evaluator'].map((label, i) => <g key={label} transform={`translate(${280 + i * 240} 350)`}><circle r="68" fill="#111c2e" stroke={[colors.ACCENT, colors.WARM, colors.SECONDARY, colors.POSITIVE][i]} strokeWidth="4" /><text y="6" textAnchor="middle" fill={[colors.ACCENT, colors.WARM, colors.SECONDARY, colors.POSITIVE][i]} fontSize="15" fontWeight="800">{label}</text>{i < 3 && <><line x1="70" y1="0" x2="168" y2="0" stroke={colors.MUTED} strokeWidth="5" /><polygon points="168,0 148,-11 148,11" fill={colors.MUTED} /></>}</g>)}
      <text x="640" y="506" textAnchor="middle" fill={colors.MUTED} fontSize="17">best observed full-task strict success: 24.69 percent</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
