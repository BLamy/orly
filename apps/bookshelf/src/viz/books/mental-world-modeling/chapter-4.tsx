// Model the Mind - chapter 4: Find the Bottleneck in the Branches.
//
// Grounded in arXiv:2607.27201 Tables 3-8, Figures 6-9, Sections 6-8,
// and Appendix B.3. Repository grounding: README.md benchmark counts,
// mentis/config.py default_score_weights, and mentis/engine.py weighted_score.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const LADDER = [31.3, 63.3, 74.6, 77.9, 80.3, 82.6, 87.9];
const LADDER_LABELS = ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
const ABLATIONS = [87.9, 75.8, 71.4, 81.5, 87.9, 87.9, 87.9];
const ABLATION_LABELS = ['full', '−mental', '−physical', 'decoupled', '', '', ''];
const ORACLES = [90.7, 91.4, 92.4, 93.5, 94.2, 97.0, 98.5];
const ORACLE_LABELS = ['S6', 'action', 'observation', 'state', 'transition', 'all gold', 'human'];

// Ladder and oracle views use seven bars spread across the canvas. The ablation view has four,
// so those four spread out too instead of bunching on the left.
const LADDER_X = (i: number) => 190 + i * 150;
const ABLATION_X = (i: number) => (i < 4 ? 250 + i * 260 : LADDER_X(i));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const datasetU = tl.channel('datasetU', 0);
  const barsU = tl.channel('barsU', 0);
  const mode = tl.channel('mode', 0);
  const focus = tl.channel('focus', -1);
  const gapU = tl.channel('gapU', 0);
  const limitU = tl.channel('limitU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.4, text: 'The evaluation uses four hundred forty eight situated decisions across text, images, and sounding video.' });
  tl.tween(datasetU, 1, { at: 0.9, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 250, y: 360, k: 1.08 }, { at: 1.4, dur: 1.3, ease: ease.move });
  tl.hold(6.9, 0.7);

  tl.caption({ at: 7.6, dur: 6.5, text: 'Across eight tested world models, the average necessity ladder climbs from an options-only floor to full mental world modeling.' });
  tl.tween(datasetU, 0, { at: 8.1, dur: 1.0, ease: ease.move });
  tl.tween(barsU, 1, { at: 8.4, dur: 3.6, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 8.7, dur: 1.3, ease: ease.move });
  tl.hold(14.1, 0.7);

  tl.caption({ at: 14.8, dur: 6.2, text: 'Direct answering averages sixty three point three. The full Mentis pipeline reaches eighty seven point nine.' });
  tl.set(focus, 1, 15.2);
  tl.set(focus, 6, 17.8);
  tl.tween(cam, { x: 660, y: 360, k: 1.03 }, { at: 16.0, dur: 1.3, ease: ease.move });
  tl.hold(21.0, 0.7);

  tl.caption({ at: 21.7, dur: 6.1, text: 'Remove the mental channel and the average falls by twelve point one, to seventy five point eight.' });
  tl.tween(mode, 1, { at: 22.2, dur: 1.5, ease: ease.move });
  tl.set(focus, 1, 23.8);
  tl.tween(cam, { x: 640, y: 360, k: 1 }, { at: 22.5, dur: 1.3, ease: ease.move });
  tl.hold(27.8, 0.7);

  tl.caption({ at: 28.5, dur: 6.0, text: 'Remove the physical channel and it falls farther, to seventy one point four.' });
  tl.set(focus, 2, 29.0);
  tl.tween(cam, { x: 640, y: 360, k: 1 }, { at: 29.1, dur: 1.3, ease: ease.move });
  tl.hold(34.5, 0.7);

  tl.caption({ at: 35.2, dur: 6.1, text: 'Predict the two transitions independently and the score drops to eighty one point five. Their coupling is doing measurable work.' });
  tl.set(focus, 3, 35.7);
  tl.tween(cam, { x: 640, y: 360, k: 1 }, { at: 35.8, dur: 1.3, ease: ease.move });
  tl.hold(41.3, 0.7);

  tl.caption({ at: 42.0, dur: 6.4, text: 'Oracle substitutions locate the largest single recoverable gain in transition simulation: three point five F one points.' });
  tl.tween(mode, 2, { at: 42.5, dur: 1.5, ease: ease.move });
  tl.set(focus, 4, 44.1);
  tl.tween(cam, { x: 690, y: 360, k: 1.03 }, { at: 42.9, dur: 1.3, ease: ease.move });
  tl.hold(48.4, 0.7);

  tl.caption({ at: 49.1, dur: 6.4, text: 'The strongest predictive run reaches ninety point seven, while the human reference is ninety eight point five.' });
  tl.tween(gapU, 1, { at: 49.6, dur: 1.2, ease: ease.draw });
  tl.set(focus, 0, 49.8);
  tl.set(focus, 6, 52.0);
  tl.tween(cam, CAMERA_HOME, { at: 50.3, dur: 1.3, ease: ease.move });
  tl.hold(55.5, 0.7);

  tl.caption({ at: 56.2, dur: 7.0, text: 'Mentis is a one-step, prompted baseline, not a finished mind simulator. Its measurements point to the transition model as the next place to improve.' });
  tl.tween(limitU, 1, { at: 56.7, dur: 1.2, ease: ease.enter });
  tl.tween(dimU, 1, { at: 58.2, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 59.0, dur: 0.7, ease: ease.enter });
  tl.hold(63.2, 1.0);

  return { tl, cam, datasetU, barsU, mode, focus, gapU, limitU, dimU, endU };
}

const scene = buildScene();

function blendValues(mode: number): number[] {
  if (mode <= 1) return LADDER.map((v, i) => lerp(v, ABLATIONS[i], clamp01(mode)));
  return ABLATIONS.map((v, i) => lerp(v, ORACLES[i], clamp01(mode - 1)));
}

// Category labels cross-fade between the two views instead of swapping at a single frame.
function labelsAt(mode: number): [string[], string[], number] {
  if (mode <= 1) return [LADDER_LABELS, ABLATION_LABELS, clamp01(mode)];
  return [ABLATION_LABELS, ORACLE_LABELS, clamp01(mode - 1)];
}

// The ablation view has no content for S4-S6, so those bars fade out there and back in for the oracle view.
function presenceOf(i: number, mode: number): number {
  const ablationHas = ABLATION_LABELS[i] ? 1 : 0;
  return mode <= 1 ? lerp(1, ablationHas, clamp01(mode)) : lerp(ablationHas, 1, clamp01(mode - 1));
}

// Bars glide between the ladder layout and the ablation layout along with their values.
function xOf(i: number, mode: number): number {
  if (mode <= 1) return lerp(LADDER_X(i), ABLATION_X(i), clamp01(mode));
  return lerp(ABLATION_X(i), LADDER_X(i), clamp01(mode - 1));
}

export function Render({ s }: { s: SceneState }) {
  const datasetU = s.get(scene.datasetU);
  const barsU = s.get(scene.barsU);
  const mode = s.get(scene.mode);
  const values = blendValues(mode);
  const [labelA, labelB, labelU] = labelsAt(mode);
  const focus = Math.round(s.get(scene.focus));
  const dim = 1 - 0.9 * s.get(scene.dimU);
  const baseY = 556;
  const maxH = 350;
  const axisL = 130;
  const axisR = 1150;

  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800}>Measure the structure, then find its limit</text>
      <text x={640} y={74} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>final-action F1 (points) · Menti-Bench</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        <g opacity={datasetU} transform="translate(70 142)">
          <rect width={360} height={430} rx={24} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={2} />
          <text x={180} y={46} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={800}>448 records</text>
          {[
            { n: 320, label: 'text', color: colors.ACCENT },
            { n: 100, label: 'image', color: colors.SECONDARY },
            { n: 28, label: 'sounding video', color: colors.WARM },
          ].map((d, i) => {
            const y = 112 + i * 104;
            const w = (d.n / 320) * 276;
            return <g key={d.label}>
              <text x={36} y={y} fill={d.color} fontSize={14} fontFamily={MONO}>{d.label}</text>
              <text x={324} y={y} textAnchor="end" fill={colors.TEXT} fontSize={14} fontWeight={750}>{d.n}</text>
              <rect x={36} y={y + 16} width={276} height={30} rx={8} fill={colors.BG} stroke={colors.GRID} />
              <rect x={36} y={y + 16} width={w} height={30} rx={8} fill={d.color} opacity={0.78} />
            </g>;
          })}
        </g>

        <g opacity={barsU}>
          <line x1={axisL} y1={baseY} x2={axisR} y2={baseY} stroke={colors.GRID} strokeWidth={2} />
          {[40, 60, 80, 100].map((tick) => {
            const y = baseY - (tick / 100) * maxH;
            return <g key={tick}>
              <line x1={axisL} y1={y} x2={axisR} y2={y} stroke={colors.GRID} strokeWidth={1} opacity={0.32} />
              <text x={120} y={y + 5} textAnchor="end" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>{tick}</text>
            </g>;
          })}
          <text transform={`translate(94 ${baseY - maxH / 2}) rotate(-90)`} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>F1 points</text>
          {values.map((value, i) => {
            const reveal = clamp01(barsU * values.length - i);
            const h = (value / 100) * maxH * reveal;
            const x = xOf(i, mode);
            const isFocus = i === focus;
            const color = mode < 0.5 ? (i === 6 ? colors.POSITIVE : colors.ACCENT) : mode < 1.5 ? (i === 0 ? colors.POSITIVE : colors.NEGATIVE) : (i === 4 ? colors.WARM : i === 6 ? colors.POSITIVE : colors.ACCENT);
            const labelAOpacity = labelA[i] ? 1 - labelU : 0;
            const labelBOpacity = labelB[i] ? labelU : 0;
            return <g key={i} opacity={presenceOf(i, mode)}>
              {isFocus && <rect x={x - 48} y={baseY - h - 28} width={96} height={h + 54} rx={16} fill={color} opacity={0.09} />}
              <rect x={x - 32} y={baseY - h} width={64} height={h} rx={9} fill={color} opacity={isFocus ? 1 : 0.66} />
              <text x={x} y={baseY - h - 12} textAnchor="middle" fill={isFocus ? color : colors.TEXT} fontSize={isFocus ? 18 : 14} fontWeight={800} opacity={reveal}>{value.toFixed(1)}</text>
              <text x={x} y={baseY + 26} textAnchor="middle" fill={isFocus ? color : colors.MUTED} fontSize={14} fontFamily={MONO} opacity={labelAOpacity}>{labelA[i]}</text>
              <text x={x} y={baseY + 26} textAnchor="middle" fill={isFocus ? color : colors.MUTED} fontSize={14} fontFamily={MONO} opacity={labelBOpacity}>{labelB[i]}</text>
            </g>;
          })}

          <g opacity={s.get(scene.gapU)}>
            <path d={`M${LADDER_X(0) - 32} ${baseY - (90.7 / 100) * maxH} H${LADDER_X(6) + 32}`} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="7 7" />
          </g>
        </g>

        <g opacity={s.get(scene.limitU)}>
          <text x={640} y={618} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>prompt sensitivity · schema failures · error propagation · one-step options</text>
        </g>
      </g>
    </Camera>
    <g opacity={dim}>
      {mode < 0.8 && <g opacity={clamp01(1 - mode * 2.5)}>
        <text x={640} y={112} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>necessity ladder: S0 is options only, S6 is full mental world modeling</text>
      </g>}
      {mode > 0.8 && mode < 1.55 && <g opacity={clamp01(1 - Math.abs(mode - 1) * 2.5)}>
        <text x={640} y={112} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>ablation: remove one channel, measure the drop vs full</text>
        <text x={640} y={138} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16}>mental −12.1 · physical −16.5 · decoupled −6.4</text>
      </g>}
      {mode > 1.55 && <g opacity={clamp01((mode - 1.55) * 3)}>
        <text x={640} y={112} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>oracle substitution: swap in the correct answer for one stage to see its ceiling</text>
        <text x={640} y={138} textAnchor="middle" fill={colors.WARM} fontSize={16}>transition +3.5 · state +2.8 · observation +1.7 · action +0.7</text>
      </g>}
      <g opacity={s.get(scene.gapU)}>
        <text x={640} y={164} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>dashed line: strongest predictive run 90.7 · human 98.5 · gap 7.8</text>
      </g>
    </g>
    <g opacity={s.get(scene.endU)}>
      <rect width={1280} height={720} fill={colors.BG} opacity={0.88} />
      <rect x={172} y={226} width={936} height={220} rx={26} fill={colors.BG} />
      <rect x={172} y={226} width={936} height={220} rx={26} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
      <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={850}>The structure works. The transition still leaks.</text>
      <text x={640} y={346} textAnchor="middle" fill={colors.WARM} fontSize={19}>largest oracle gain: transition simulation</text>
      <text x={640} y={388} textAnchor="middle" fill={colors.MUTED} fontSize={15}>MENTIS is an inspectable baseline, not a finished architecture</text>
    </g>
  </>;
}

export const vizScene = () => scene;
