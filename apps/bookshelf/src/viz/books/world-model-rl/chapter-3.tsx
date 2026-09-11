// Grounding: arXiv:2608.12564 Equation 4 and Appendix D; official WMRL
// files wmrl/debias.py, ml_research/cluster/train_entry.py, and
// ml_research/configs/wmrl_9b.yaml.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const PLOT = { x: 190, y: 100, w: 720, h: 430 };
const RAW = [0.12, 0.21, 0.28, 0.26, 0.42, 0.50, 0.48, 0.67, 0.76, 0.86];
const MONO = [0.12, 0.21, 0.27, 0.27, 0.42, 0.49, 0.49, 0.67, 0.76, 0.86];
const PAIRS = Array.from({ length: 60 }, (_, i) => {
  const x = 0.035 + (i % 10) * 0.098 + Math.floor(i / 10) * 0.004;
  const noise = [0.025, -0.032, 0.041, -0.018, 0.012, -0.027][Math.floor(i / 10)];
  const y = clamp01(0.045 + 0.78 * x + 0.10 * x * x + noise);
  return { x, y };
});
const sx = (v: number) => PLOT.x + v * PLOT.w;
const sy = (v: number) => PLOT.y + PLOT.h - v * PLOT.h;
const linePath = (ys: number[]) => ys.map((y, i) => `${i ? 'L' : 'M'} ${sx((i + 0.5) / 10)} ${sy(y)}`).join(' ');

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const axesU = tl.channel('score axes', 0);
  const pairsU = tl.channel('anchor pairs', 0);
  const identityU = tl.channel('identity target', 0);
  const counterU = tl.channel('pair counter', 0);
  const binsU = tl.channel('ten bin means', 0);
  const poolU = tl.channel('pooled monotone means', 0);
  const mapU = tl.channel('calibration map', 0);
  const applyU = tl.channel('recast scores', 0);
  const rankU = tl.channel('rank preserved', 0);
  const refitU = tl.channel('refit odometer', 0);
  const recentU = tl.channel('recent buffer', 0);
  const closeU = tl.channel('closing map', 0);

  tl.caption({ at: 0.4, dur: 5.6, text: 'A predicted score can be consistently wrong even when it ranks two solutions in the right order.' });
  tl.tween(axesU, 1, { at: 0.8, dur: 1.3, ease: ease.draw });
  tl.tween(pairsU, 0.35, { at: 2.0, dur: 2.2, ease: ease.linear });
  tl.tween(cam, { x: 535, y: 330, k: 1.05 }, { at: 2.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.6, text: 'Anchor pairs plot the model prediction against the real execution score. The diagonal is perfect agreement.' });
  tl.tween(pairsU, 0.65, { at: 6.8, dur: 1.8, ease: ease.linear });
  tl.tween(identityU, 1, { at: 8.2, dur: 1.3, ease: ease.draw });

  tl.caption({ at: 12.4, dur: 5.6, text: 'The implementation stays at the identity map until two hundred paired scores have accumulated.' });
  tl.tween(pairsU, 1, { at: 12.8, dur: 2.4, ease: ease.linear });
  tl.tween(counterU, 1, { at: 13.0, dur: 2.2, ease: ease.linear });

  tl.caption({ at: 18.4, dur: 5.6, text: 'It divides predicted scores into ten equal-width bins, then averages the real scores inside each populated bin.' });
  tl.tween(binsU, 1, { at: 18.9, dur: 1.8, ease: ease.enter });
  tl.tween(cam, { x: 555, y: 340, k: 1.11 }, { at: 20.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.6, text: 'If two neighboring means descend, pool-adjacent-violators merges them until the staircase can only rise.' });
  tl.tween(poolU, 1, { at: 25.0, dur: 1.5, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.6, text: 'That monotone staircase becomes a piecewise calibration map from predicted reward to expected real reward.' });
  tl.tween(cam, CAMERA_HOME, { at: 29.8, dur: 1.2, ease: ease.move });
  tl.tween(mapU, 1, { at: 31.0, dur: 1.5, ease: ease.draw });
  tl.tween(identityU, 0.18, { at: 32.2, dur: 0.8, ease: ease.move });

  tl.caption({ at: 36.4, dur: 5.6, text: 'Every cheap score passes through the map before group advantages are formed.' });
  tl.tween(applyU, 1, { at: 37.0, dur: 2.6, ease: ease.linear });
  tl.tween(cam, { x: 760, y: 345, k: 1.04 }, { at: 38.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.6, text: 'Because the map is monotone, it preserves the ordering the world model got right while correcting the spacing.' });
  tl.tween(rankU, 1, { at: 43.0, dur: 1.3, ease: ease.pop });

  tl.caption({ at: 48.4, dur: 5.6, text: 'After sixty-four new pairs arrive, the map is fit again so it can follow a policy whose behavior is still changing.' });
  tl.tween(refitU, 1, { at: 49.0, dur: 1.8, ease: ease.linear });
  tl.tween(recentU, 1, { at: 50.2, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 51.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 54.4, dur: 6.2, text: 'Online debiasing bends systematic error back toward truth, using only the real outcomes the anchor stream already bought.' });
  tl.tween(closeU, 1, { at: 55.0, dur: 1.3, ease: ease.move });
  tl.hold(60.8, 1.2);

  return { tl, cam, axesU, pairsU, identityU, counterU, binsU, poolU, mapU, applyU, rankU, refitU, recentU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const pairReveal = s.get(scene.pairsU);
  const pool = s.get(scene.poolU);
  const apply = s.get(scene.applyU);
  const refit = s.get(scene.refitU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="64" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">bend the scores back</text>
      <g opacity={s.get(scene.axesU)}>
        <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} rx="18" fill="#101827" stroke={colors.GRID} strokeWidth="2" />
        {[0.2, 0.4, 0.6, 0.8].map((v) => <g key={v} opacity="0.35"><line x1={sx(v)} y1={PLOT.y} x2={sx(v)} y2={PLOT.y + PLOT.h} stroke={colors.GRID} /><line x1={PLOT.x} y1={sy(v)} x2={PLOT.x + PLOT.w} y2={sy(v)} stroke={colors.GRID} /></g>)}
        <text x={PLOT.x + PLOT.w / 2} y={PLOT.y + PLOT.h + 34} textAnchor="middle" fill={colors.SECONDARY} fontSize="13">world-model score r̂</text>
        <text x={PLOT.x - 42} y={PLOT.y + PLOT.h / 2} textAnchor="middle" transform={`rotate(-90 ${PLOT.x - 42} ${PLOT.y + PLOT.h / 2})`} fill={colors.WARM} fontSize="13">execution score r</text>
      </g>

      <line x1={sx(0)} y1={sy(0)} x2={sx(s.get(scene.identityU))} y2={sy(s.get(scene.identityU))} stroke={colors.MUTED} strokeWidth="2" strokeDasharray="8 7" opacity={s.get(scene.identityU)} />
      {PAIRS.map((p, i) => {
        const u = clamp01(pairReveal * PAIRS.length - i);
        const mapped = MONO[Math.min(9, Math.floor(p.x * 10))];
        const y = p.y + (mapped - p.y) * apply;
        return <circle key={i} cx={sx(p.x)} cy={sy(y)} r={4.5} fill={i % 6 === 0 ? colors.WARM : colors.ACCENT} opacity={0.2 + 0.68 * u} />;
      })}

      <g opacity={s.get(scene.counterU)}>
        <rect x="954" y="108" width="238" height="72" rx="22" fill="#172236" stroke={colors.ACCENT} />
        <text x="1073" y="137" textAnchor="middle" fill={colors.MUTED} fontSize="11">anchor-pair threshold</text>
        <text x="1073" y="164" textAnchor="middle" fill={colors.ACCENT} fontSize="25" fontWeight="850" fontFamily={colors.font.mono}>{Math.round(200 * s.get(scene.counterU))} / 200</text>
      </g>

      <g opacity={s.get(scene.binsU)}>
        {RAW.map((y, i) => {
          const yy = y + (MONO[i] - y) * pool;
          return <g key={i}>
            <rect x={sx(i / 10) + 3} y={PLOT.y + 3} width={PLOT.w / 10 - 6} height={PLOT.h - 6} fill={i % 2 ? '#172133' : '#131c2b'} opacity="0.28" />
            <circle cx={sx((i + 0.5) / 10)} cy={sy(yy)} r={9} fill={pool > 0.5 ? colors.POSITIVE : colors.WARM} />
          </g>;
        })}
        <path d={linePath(RAW)} fill="none" stroke={colors.WARM} strokeWidth="3" opacity={1 - pool} />
        <path d={linePath(MONO)} fill="none" stroke={colors.POSITIVE} strokeWidth="5" opacity={pool} />
      </g>
      <path d={linePath(MONO)} fill="none" stroke={colors.POSITIVE} strokeWidth="6" strokeDasharray={`${760 * s.get(scene.mapU)} 760`} opacity={s.get(scene.mapU)} />
      <MathLabel tex={'\\hat f = \\operatorname{isotonic}(\\hat r, r)'} x={1048} y={232} fontSize={22} opacity={s.get(scene.mapU)} />

      <g opacity={apply * (1 - s.get(scene.rankU))}>
        {[0.24, 0.52, 0.78].map((x, i) => <g key={x} transform={`translate(${970 + i * 72} 330)`}>
          <circle cy={60 - 28 * apply} r="13" fill={colors.SECONDARY} />
          <path d="M0 44 V-32" stroke={colors.POSITIVE} strokeWidth="3" markerEnd="url(#wmrl-arrow)" />
          <text y="86" textAnchor="middle" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>{x.toFixed(2)}</text>
        </g>)}
        <text x="1042" y="438" textAnchor="middle" fill={colors.POSITIVE} fontSize="12">recast before advantages</text>
      </g>

      <g opacity={s.get(scene.rankU)}>
        <rect x="946" y="316" width="270" height="132" rx="24" fill="#12291f" stroke={colors.POSITIVE} />
        <text x="1081" y="344" textAnchor="middle" fill={colors.POSITIVE} fontSize="12">order preserved</text>
        {[0, 1, 2].map((i) => <g key={i}><circle cx={1014 + i * 68} cy="384" r={10} fill={colors.ACCENT} /><text x={1014 + i * 68} y="411" textAnchor="middle" fill={colors.MUTED} fontSize="10">{i + 1}</text></g>)}
      </g>

      <g opacity={s.get(scene.refitU)}>
        <path d="M965 472 H1178" stroke="#202c40" strokeWidth="14" strokeLinecap="round" />
        <path d="M965 472 H1178" stroke={colors.SECONDARY} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${213 * refit} 213`} />
        <text x="1072" y="494" textAnchor="middle" fill={colors.SECONDARY} fontSize="11" fontFamily={colors.font.mono}>refit_every: 64 · cap: 5000</text>
      </g>
      <defs><marker id="wmrl-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill={colors.POSITIVE} /></marker></defs>
    </g>
    <g opacity={close}>
      <rect x="215" y="135" width="850" height="410" rx="48" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="220" textAnchor="middle" fill={colors.TEXT} fontSize="42" fontWeight="850">online debiasing</text>
      <g transform="translate(640 360)">
        <line x1="-290" y1="110" x2="290" y2="-110" stroke={colors.MUTED} strokeWidth="2" strokeDasharray="9 8" />
        <path d="M-290 76 C-190 70 -150 50 -92 35 C-30 18 0 18 48 -3 C120 -34 190 -42 290 -94" fill="none" stroke={colors.POSITIVE} strokeWidth="7" />
        {[[-230, 65], [-120, 42], [-18, 16], [85, -20], [210, -68]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="10" fill={i % 2 ? colors.WARM : colors.ACCENT} />)}
      </g>
      <text x="640" y="500" textAnchor="middle" fill={colors.MUTED} fontSize="17">monotone correction · current anchor pairs · no reordered ranks</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
