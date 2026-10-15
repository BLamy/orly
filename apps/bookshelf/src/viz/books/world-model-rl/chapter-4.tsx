// Grounding: arXiv:2608.12564 Equation 5, Sections 3.3–3.4, and Table 1;
// official WMRL files wmrl/denoise.py, wmrl/advantage.py, wmrl/loop.py,
// ml_research/cluster/verl_patches.py, and ml_research/configs/wmrl_9b.yaml.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const WM_ANGLES = [-32, 22, -18, 37, -41, 12, 29, -27, 16, -11, 33, -24];
const STEPS = ['select anchors', 'score twice', 'refit map', 'measure residual', 'calibrate rest', 'form advantages'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const streamsU = tl.channel('gradient streams', 0);
  const jitterU = tl.channel('world model jitter', 0);
  const residualU = tl.channel('measured disagreement', 0);
  const memoryU = tl.channel('running estimate', 0);
  const weightU = tl.channel('anchor weight', 0);
  const fuseU = tl.channel('fused gradient', 0);
  const orderU = tl.channel('correction order', 0);
  const resultsU = tl.channel('paper results', 0);
  const retraceU = tl.channel('full loop', 0);
  const closeU = tl.channel('closing title', 0);
  const pulse = tl.channel('stream pulse', 0);
  tl.tween(pulse, 1, { at: 0, dur: 70, ease: ease.linear });

  tl.caption({ at: 0.4, dur: 5.6, text: 'Calibration removes systematic error, but the remaining world-model grades still wobble around the truth.' });
  tl.tween(streamsU, 1, { at: 0.8, dur: 1.3, ease: ease.draw });
  tl.tween(jitterU, 1, { at: 2.0, dur: 2.2, ease: ease.linear });
  tl.tween(cam, { x: 560, y: 326, k: 1.2 }, { at: 2.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.6, text: 'The world-model stream is abundant and noisy. The anchor stream is scarce and measured.' });
  tl.tween(cam, CAMERA_HOME, { at: 8.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.6, text: 'On anchor groups, the code compares calibrated predictions with real scores after centering each group.' });
  tl.tween(residualU, 1, { at: 12.9, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: 700, y: 326, k: 1.1 }, { at: 14.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.4, dur: 5.6, text: 'That normalized disagreement enters an exponential running estimate with a half-life of sixty-four observations.' });
  tl.tween(memoryU, 1, { at: 19.0, dur: 2.0, ease: ease.linear });

  tl.caption({ at: 24.4, dur: 5.6, text: 'After thirty-two warmup observations, the estimate sets how much extra weight trusted anchor advantages receive.' });
  // Warmup ends at the baseline weight of one; the next beat raises it from there.
  tl.tween(weightU, 0, { at: 25.0, dur: 1.5, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.6, text: 'More disagreement raises the anchor weight from one toward its target of two, with a hard ceiling at four.' });
  tl.tween(weightU, 1, { at: 31.0, dur: 2.0, ease: ease.move });

  tl.caption({ at: 36.4, dur: 5.6, text: 'The two gradient streams then combine by inverse variance, so the fused update is steadier than either stream alone.' });
  tl.tween(fuseU, 1, { at: 37.0, dur: 1.5, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 39.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.6, text: 'The order matters: choose anchors, score them twice, refit, measure the residual, calibrate the rest, then form advantages.' });
  tl.tween(orderU, 1, { at: 43.0, dur: 3.6, ease: ease.linear });

  tl.caption({ at: 48.4, dur: 5.6, text: 'In the paper, the nine-billion-parameter run used three hundred forty-nine graphics processor hours instead of one thousand one hundred seventy-four.' });
  tl.tween(resultsU, 1, { at: 49.0, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 360, k: 1.06 }, { at: 50.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 54.4, dur: 5.6, text: 'Its held-out averages also rose from eighteen point eight to twenty-one point six, and from thirty-one point two to thirty-two point eight.' });
  tl.tween(cam, CAMERA_HOME, { at: 54.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 60.4, dur: 6.2, text: 'Generate the experiment, imagine the outcome, anchor a few, bend the bias, weigh the residual noise, and update.' });
  tl.tween(retraceU, 1, { at: 61.0, dur: 3.8, ease: ease.linear });

  tl.caption({ at: 66.9, dur: 5.6, text: 'World Model Reinforcement Learning scales the cheap path, while every correction remains tied to outcomes the real world actually produced.' });
  tl.tween(closeU, 1, { at: 67.4, dur: 1.3, ease: ease.move });
  tl.hold(72.6, 1.0);

  return { tl, cam, streamsU, jitterU, residualU, memoryU, weightU, fuseU, orderU, resultsU, retraceU, closeU, pulse };
}

const scene = buildScene();

function Arrow({ x, y, angle, len, color, opacity = 1, width = 3 }: { x: number; y: number; angle: number; len: number; color: string; opacity?: number; width?: number }) {
  const r = angle * Math.PI / 180;
  const x2 = x + Math.cos(r) * len;
  const y2 = y - Math.sin(r) * len;
  return <g opacity={opacity}><line x1={x} y1={y} x2={x2} y2={y2} stroke={color} strokeWidth={width} /><polygon points={`${x2},${y2} ${x2 - 11},${y2 - 5} ${x2 - 9},${y2 + 7}`} fill={color} transform={`rotate(${-angle} ${x2} ${y2})`} /></g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const streams = s.get(scene.streamsU);
  const jitter = s.get(scene.jitterU);
  const residual = s.get(scene.residualU);
  const memory = s.get(scene.memoryU);
  const weight = s.get(scene.weightU);
  const fuse = s.get(scene.fuseU);
  const order = s.get(scene.orderU);
  const results = s.get(scene.resultsU);
  const retrace = s.get(scene.retraceU);
  // Each scene hands off in turn: the outgoing layer clears before the incoming one builds, so no two are ghosted together.
  const orderAlpha = clamp01((order - 0.12) * 4);
  const introFade = 1 - clamp01(order * 8);
  const orderFade = 1 - clamp01(results * 4);
  const resultsFade = 1 - clamp01(retrace * 4);
  const retraceFade = 1 - clamp01(close * 3);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - clamp01(close * 2)}>
      <text x="640" y="64" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">let reliability set the weight</text>
      <g opacity={streams * introFade}>
        <rect x="70" y="105" width="525" height="310" rx="32" fill="#15152a" stroke={colors.SECONDARY} strokeWidth="2" />
        <text x="332" y="137" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontFamily={colors.font.mono}>abundant world-model gradients</text>
        {WM_ANGLES.map((a, i) => <Arrow key={i} x={118 + (i % 4) * 116} y={205 + Math.floor(i / 4) * 82} angle={a * jitter} len={58} color={colors.SECONDARY} opacity={clamp01(streams * 2 - i / 10)} />)}
        <rect x="70" y="430" width="525" height="90" rx="32" fill="#281f11" stroke={colors.WARM} strokeWidth="2" />
        <text x="332" y="461" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>scarce anchor gradients</text>
        {[0, 1, 2].map((i) => <Arrow key={i} x={170 + i * 150} y={498} angle={8 - i * 5} len={74 + weight * 15} color={colors.WARM} width={4} />)}
      </g>

      <g opacity={streams * introFade}>
        <rect x="650" y="105" width="560" height="418" rx="32" fill="#101827" stroke={colors.GRID} strokeWidth="2" />
        <text x="930" y="137" textAnchor="middle" fill={colors.MUTED} fontSize="14">one anchor group audits the prediction</text>
        <text x="676" y="160" fill={colors.SECONDARY} fontSize="14" opacity={residual}>calibrated prediction</text>
        <text x="1184" y="160" textAnchor="end" fill={colors.WARM} fontSize="14" opacity={residual}>real score</text>
        {[0.18, 0.43, 0.61, 0.78, 0.55, 0.34, 0.70, 0.49].map((v, i) => {
          const measured = clamp01(v + [0.08, -0.11, 0.05, -0.06][i % 4]);
          return <g key={i} transform={`translate(${700 + i * 58} 290)`}>
            <line y1={-90 * v} y2={0} stroke={colors.SECONDARY} strokeWidth="8" opacity="0.8" />
            <line x1="14" x2="14" y1={-90 * measured} y2={0} stroke={colors.WARM} strokeWidth="8" opacity="0.9" />
            <line x1="-5" x2="19" y1={-90 * v} y2={-90 * measured} stroke={colors.NEGATIVE} strokeWidth="2.5" opacity={residual} />
          </g>;
        })}
        <text x="930" y="318" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14" opacity={residual}>normalized within-group disagreement</text>
        <g opacity={memory}>
          <g transform="translate(0 10)">
            <path d="M710 360 C770 325 820 388 875 345 S980 315 1040 350 S1120 375 1165 330" fill="none" stroke={colors.ACCENT} strokeWidth="4" />
            <path d="M710 390 C790 372 880 370 955 354 S1080 348 1165 342" fill="none" stroke={colors.POSITIVE} strokeWidth="5" />
          </g>
          <text x="930" y="438" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>EWMA · half_life: 64 · warmup: 32</text>
          <text x="730" y="418" fill={colors.ACCENT} fontSize="14">disagreement</text>
          <text x="1130" y="418" textAnchor="end" fill={colors.POSITIVE} fontSize="14">running estimate</text>
        </g>
        <g opacity={clamp01(memory)}>
          <path d="M730 466 H1130" stroke="#202c40" strokeWidth="18" strokeLinecap="round" />
          <path d="M730 466 H1130" stroke={colors.WARM} strokeWidth="18" strokeLinecap="round" strokeDasharray={`${400 * clamp01(weight / 3)} 400`} />
          <circle cx={730 + 400 * clamp01(weight / 3)} cy="466" r="17" fill={colors.WARM} />
          <text x="730" y="494" textAnchor="middle" fill={colors.MUTED} fontSize="14">1</text>
          <text x="1130" y="494" textAnchor="middle" fill={colors.MUTED} fontSize="14">4</text>
          <text x="930" y="504" textAnchor="middle" fill={colors.WARM} fontSize="16" fontFamily={colors.font.mono}>anchor weight {Math.min(4, 1 + weight).toFixed(2)} · cap 4</text>
        </g>
        <text x="930" y="184" textAnchor="middle" fill={colors.TEXT} fontSize="24" fontStyle="italic" opacity={clamp01(memory)}>w = clip(1 + c s², 1, 4)</text>
      </g>

      <g opacity={fuse * introFade}>
        <rect x="455" y="530" width="370" height="40" rx="20" fill="#12291f" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="470" y="555" fill={colors.POSITIVE} fontSize="15">steadier fused policy update</text>
        <Arrow x={690} y={550} angle={0} len={120} color={colors.POSITIVE} width={7} />
      </g>

      <g opacity={orderAlpha * orderFade}>
        <rect x="65" y="150" width="1150" height="350" rx="42" fill="#101827" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="640" y="205" textAnchor="middle" fill={colors.TEXT} fontSize="27" fontWeight="800">the order is the algorithm</text>
        {STEPS.map((label, i) => {
          const u = clamp01(order * STEPS.length - i);
          const x = 150 + i * 194;
          return <g key={label} transform={`translate(${x} 340)`} opacity={u}>
            <circle r="54" fill={i < 2 ? '#2c2111' : i < 5 ? '#251d34' : '#12291f'} stroke={i < 2 ? colors.WARM : i < 5 ? colors.SECONDARY : colors.POSITIVE} strokeWidth="3" />
            <text y="-3" textAnchor="middle" fill={colors.TEXT} fontSize="16" fontWeight="750">{label.split(' ')[0]}</text>
            <text y="18" textAnchor="middle" fill={colors.MUTED} fontSize="14">{label.split(' ').slice(1).join(' ')}</text>
            {i < 5 && <path d="M58 0 H132" stroke={colors.MUTED} strokeWidth="4" />}
          </g>;
        })}
      </g>

      <g opacity={results * resultsFade}>
        <rect x="76" y="104" width="1128" height="480" rx="38" fill="#101827" stroke={colors.GRID} strokeWidth="2" />
        <text x="640" y="154" textAnchor="middle" fill={colors.TEXT} fontSize="28" fontWeight="850">nine-billion-parameter results</text>
        <text x="150" y="208" fill={colors.MUTED} fontSize="15">training compute · GPU-hours</text>
        <text x="150" y="232" fill={colors.NEGATIVE} fontSize="16">real execution · 1,174</text>
        <rect x="150" y="242" width={360 * results} height="46" rx="14" fill={colors.NEGATIVE} />
        <text x="150" y="324" fill={colors.POSITIVE} fontSize="16">WMRL · 349</text>
        <rect x="150" y="334" width={(360 * 349 / 1174) * results} height="46" rx="14" fill={colors.POSITIVE} />
        <text x="900" y="208" textAnchor="middle" fill={colors.MUTED} fontSize="15">held-out leaderboard percentile · before → after</text>
        {[{ label: 'MLE-Dojo', a: 18.8, b: 21.6, y: 270 }, { label: 'DSBench', a: 31.2, b: 32.8, y: 370 }].map((r) => <g key={r.label}>
          <text x="660" y={r.y} fill={colors.TEXT} fontSize="16">{r.label}</text>
          <line x1="780" y1={r.y - 5} x2="1130" y2={r.y - 5} stroke={colors.GRID} strokeWidth="12" strokeLinecap="round" />
          <line x1={780 + r.a * 8.75} y1={r.y - 5} x2={780 + r.b * 8.75} y2={r.y - 5} stroke={colors.POSITIVE} strokeWidth="4" />
          <circle cx={780 + r.a * 8.75} cy={r.y - 5} r="7" fill={colors.NEGATIVE} />
          <circle cx={780 + r.b * 8.75} cy={r.y - 5} r="7" fill={colors.POSITIVE} />
          <text x="780" y={r.y + 30} fill={colors.TEXT} fontSize="15">{r.a} → {r.b}</text>
        </g>)}
        <text x="640" y="520" textAnchor="middle" fill={colors.POSITIVE} fontSize="20">3.4× less compute while both held-out averages rise</text>
      </g>

      <g opacity={retrace * retraceFade}>
        <ellipse cx="640" cy="340" rx="215" ry="170" fill="none" stroke={colors.GRID} strokeWidth="2" strokeDasharray="6 8" />
        {['generate', 'imagine', 'anchor', 'calibrate', 'weight', 'update'].map((label, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const x = 640 + Math.cos(a) * 215;
          const y = 340 + Math.sin(a) * 170;
          return <g key={label} opacity={clamp01(retrace * 6 - i)}><circle cx={x} cy={y} r="42" fill={colors.BG} stroke={[colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE, colors.WARM, colors.ACCENT][i]} strokeWidth="3" /><text x={x} y={y + 5} textAnchor="middle" fill={colors.TEXT} fontSize="14">{label}</text></g>;
        })}
      </g>
    </g>
    <g opacity={clamp01((close - 0.5) * 2)}>
      <rect x="190" y="110" width="900" height="470" rx="52" fill={colors.BG} stroke={colors.ACCENT} strokeWidth="4" />
      <text x="640" y="196" textAnchor="middle" fill={colors.TEXT} fontSize="44" fontWeight="850">The Imagined Experiment</text>
      <text x="640" y="232" textAnchor="middle" fill={colors.ACCENT} fontSize="20">World Model Reinforcement Learning</text>
      {['generate', 'imagine', 'anchor', 'calibrate', 'weight', 'update'].map((label, i) => {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const x = 640 + Math.cos(a) * 200;
        const y = 380 + Math.sin(a) * 88;
        return <g key={label}><circle cx={x} cy={y} r="42" fill="#111a2a" stroke={[colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE, colors.WARM, colors.ACCENT][i]} strokeWidth="3" /><text x={x} y={y + 5} textAnchor="middle" fill={colors.TEXT} fontSize="14">{label}</text></g>;
      })}
      <text x="640" y="546" textAnchor="middle" fill={colors.MUTED} fontSize="17">cheap scale · measured corrections · trusted outcomes</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
