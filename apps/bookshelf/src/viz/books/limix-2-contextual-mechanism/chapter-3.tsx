// Grounding: arXiv:2609.17488 Sections 3.1–3.3; official source
// model/v2_0/transformer.py and model/v2_0/encoders.py.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ROWS = 8;
const COLS = 8;
const X0 = 246;
const Y0 = 150;
const CELL = 57;
const maskFor = (mode: number, r: number, c: number) => {
  if (mode < 0.5) return r === 5 && c === 3;
  if (mode < 1.5) return r >= 5 && c === 5;
  return r >= 5 && r <= 6 && c >= 2 && c <= 4;
};

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const tableU = tl.channel('context query table', 0);
  const splitU = tl.channel('context query split', 0);
  const maskU = tl.channel('mask opacity', 0);
  const maskMode = tl.channel('mask pattern mode', 0);
  const reconstructU = tl.channel('feature reconstruction', 0);
  const targetU = tl.channel('target prediction', 0);
  const invariantU = tl.channel('query batch invariant', 0);
  const outcomesU = tl.channel('three public tasks', 0);
  const closeU = tl.channel('joint modeling payoff', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'A normal predictor asks one fixed question: given the features, what is the label? Context-conditional masked modeling keeps changing the question.' });
  tl.tween(tableU, 1, { at: 0.8, dur: 2.0, ease: ease.draw });

  tl.caption({ at: 6.4, dur: 5.5, text: 'Each episode divides one table into context rows that keep their observations and query rows that must infer what is hidden.' });
  tl.tween(splitU, 1, { at: 7.0, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 500, y: 372, k: 1.12 }, { at: 7.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.5, text: 'First, hide one entry. Its value becomes the shared missing embedding, while its column code still says what kind of evidence belongs there.' });
  tl.tween(maskU, 1, { at: 13.0, dur: 1.0, ease: ease.pop });

  tl.caption({ at: 18.4, dur: 5.5, text: 'Then hide an entire query column. The same network must use the remaining variables and the context table to reconstruct every blank.' });
  tl.tween(maskMode, 1, { at: 19.0, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 560, y: 410, k: 1.18 }, { at: 19.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.5, text: 'Finally, hide a block. Mixing entry, column, and block masks prevents the model from specializing to one easy reconstruction pattern.' });
  tl.tween(maskMode, 2, { at: 25.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.5, text: 'Feature reconstruction attaches at a shallow layer, where local cell detail is still sharp. The missing values return as a coordinated patch.' });
  tl.tween(reconstructU, 1, { at: 31.0, dur: 2.0, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 33.2, dur: 1.3, ease: ease.move });

  tl.caption({ at: 36.4, dur: 5.5, text: 'Target prediction uses the final task slots. Classification and regression are now two choices of what to mask and which head reads the answer.' });
  tl.tween(targetU, 1, { at: 37.0, dur: 1.5, ease: ease.pop });

  tl.caption({ at: 42.4, dur: 5.5, text: 'Query rows never exchange information with each other. For fixed context, a prediction stays unchanged when unrelated queries enter or leave the batch.' });
  tl.tween(invariantU, 1, { at: 43.0, dur: 2.0, ease: ease.draw });

  tl.caption({ at: 48.4, dur: 5.5, text: 'One conditional interface now supports class probabilities, numeric prediction, and missing-value imputation without task-specific model updates.' });
  tl.tween(outcomesU, 1, { at: 49.0, dur: 1.8, ease: ease.enter });

  tl.caption({ at: 54.4, dur: 5.8, text: 'The mask is not damage. It is a question about the joint mechanism that could have generated the whole table.' });
  tl.tween(closeU, 1, { at: 55.0, dur: 1.4, ease: ease.move });
  tl.hold(60.2, 1.0);
  return { tl, cam, tableU, splitU, maskU, maskMode, reconstructU, targetU, invariantU, outcomesU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const table = s.get(scene.tableU);
  const split = s.get(scene.splitU);
  const mode = s.get(scene.maskMode);
  const mask = s.get(scene.maskU);
  const reconstruct = s.get(scene.reconstructU);
  const outcomes = s.get(scene.outcomesU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="68" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">a mask becomes a question</text>
      {Array.from({ length: ROWS * COLS }, (_, i) => {
        const r = Math.floor(i / COLS), c = i % COLS;
        const x = X0 + c * CELL, y = Y0 + r * CELL;
        const u = clamp01(table * ROWS * COLS - i);
        const m0 = maskFor(Math.round(mode), r, c);
        const restored = m0 && reconstruct > 0.15;
        return <g key={i} opacity={u}>
          <rect x={x} y={y} width="48" height="48" rx="10" fill={m0 && mask > 0.1 ? '#2b2513' : '#101827'} stroke={m0 && mask > 0.1 ? restored ? colors.POSITIVE : colors.WARM : r >= 5 ? colors.SECONDARY : colors.ACCENT} strokeWidth={m0 && mask > 0.1 ? 3 : 1.3} />
          <text x={x + 24} y={y + 29} textAnchor="middle" fill={m0 && mask > 0.1 ? restored ? colors.POSITIVE : colors.WARM : colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>{m0 && mask > 0.1 ? restored ? `x${r}${c}` : 'MASK' : `${(r * 3 + c * 5) % 19}`}</text>
        </g>;
      })}
      <g opacity={split}>
        <path d="M210 427 H744" stroke={colors.WARM} strokeWidth="3" strokeDasharray="12 8" />
        <text x="180" y="300" textAnchor="middle" fill={colors.ACCENT} fontSize="13" fontWeight="800" transform="rotate(-90 180 300)">CONTEXT Ict</text>
        <text x="180" y="510" textAnchor="middle" fill={colors.WARM} fontSize="13" fontWeight="800" transform="rotate(-90 180 510)">QUERY Ite</text>
      </g>
      <g opacity={mask}>
        <rect x="812" y="145" width="330" height="170" rx="30" fill="#141c2b" stroke={colors.WARM} strokeWidth="2.5" />
        <text x="977" y="181" textAnchor="middle" fill={colors.WARM} fontSize="15" fontWeight="800">three mask patterns</text>
        {['individual entries', 'query columns', 'entry blocks'].map((label, i) => <g key={label} opacity={Math.max(0.16, 1 - Math.abs(mode - i))}>
          <circle cx="860" cy={220 + i * 35} r="7" fill={colors.WARM} />
          <text x="880" y={225 + i * 35} fill={colors.TEXT} fontSize="13">{label}</text>
        </g>)}
      </g>
      <MathLabel tex={'q_\\theta(x_{i,j} \\mid x_{i,-\\pi_i}, X_{ct}, y_{ct})'} x={976} y={360} fontSize={20} opacity={s.get(scene.targetU)} />
      <g opacity={s.get(scene.invariantU)}>
        <rect x="804" y="402" width="346" height="78" rx="24" fill="#10261f" stroke={colors.POSITIVE} strokeWidth="2.5" />
        <text x="977" y="432" textAnchor="middle" fill={colors.POSITIVE} fontSize="13" fontWeight="800">query-batch invariant</text>
        <text x="977" y="458" textAnchor="middle" fill={colors.MUTED} fontSize="12">query → context · never query → query</text>
      </g>
      <g opacity={outcomes}>
        {['class probabilities', 'regression value', 'imputed matrix'].map((label, i) => <g key={label} transform={`translate(${830 + i * 140} 548)`}>
          <circle r="49" fill="#101827" stroke={[colors.ACCENT, colors.SECONDARY, colors.POSITIVE][i]} strokeWidth="3" />
          <text y="4" textAnchor="middle" fill={colors.TEXT} fontSize="10">{label}</text>
        </g>)}
      </g>
    </g>
    <g opacity={close}>
      <rect x="174" y="120" width="932" height="444" rx="58" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <text x="640" y="214" textAnchor="middle" fill={colors.TEXT} fontSize="50" fontWeight="880">the blank is the question</text>
      <g transform="translate(640 350)">
        <rect x="-90" y="-70" width="180" height="140" rx="34" fill="#2b2513" stroke={colors.WARM} strokeWidth="5" />
        <text y="8" textAnchor="middle" fill={colors.WARM} fontSize="24" fontFamily={colors.font.mono}>MASK</text>
        <circle cx="-126" r="12" fill={colors.ACCENT} /><circle cx="126" r="12" fill={colors.POSITIVE} />
        <path d="M-114 0 H-92 M92 0 H114" stroke={colors.MUTED} strokeWidth="4" />
      </g>
      <text x="640" y="492" textAnchor="middle" fill={colors.MUTED} fontSize="16">learn the joint structure · answer any conditional</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
