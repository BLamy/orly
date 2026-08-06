// The Long Game — chapter 4: Activity Is Not Coherence.
//
// Grounded in arXiv:2607.28956v2 Table 1, Figures 4-6, and Sections 4.2-4.4,
// plus eval/run_eval.py and env/web/leaderboard.py final-net-assets evaluation.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const HUMAN = 217.61;
const BEST = 59.46;
const RULE = 24.48;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axisU = tl.channel('axisU', 0);
  const bestU = tl.channel('bestU', 0);
  const humanU = tl.channel('humanU', 0);
  const ratioU = tl.channel('ratioU', 0);
  const sustainedU = tl.channel('sustainedU', 0);
  const decayU = tl.channel('decayU', 0);
  const operationalU = tl.channel('operationalU', 0);
  const beliefU = tl.channel('beliefU', 0);
  const abandonU = tl.channel('abandonU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.1, text: 'The strongest model configuration ends the year with fifty-nine point four six thousand renminbi in net assets.' });
  tl.tween(axisU, 1, { at: 0.9, dur: 1.2, ease: ease.draw });
  tl.tween(bestU, 1, { at: 1.7, dur: 2.1, ease: ease.draw });
  tl.tween(cam, { x: 560, y: 350, k: 1.10 }, { at: 2.0, dur: 1.3, ease: ease.move });
  tl.hold(6.6, 0.8);

  tl.caption({ at: 7.4, dur: 6.3, text: 'The human mean reaches two hundred seventeen point six one thousand, leaving the best model at twenty-seven point three percent.' });
  tl.tween(humanU, 1, { at: 7.9, dur: 2.4, ease: ease.draw });
  tl.tween(ratioU, 1, { at: 10.4, dur: 0.7, ease: ease.pop });
  tl.hold(13.7, 0.8);

  tl.caption({ at: 14.5, dur: 6.4, text: 'Human operators act in every sustained window, while model configurations range from barely one tenth to roughly two thirds or more.' });
  tl.tween(sustainedU, 1, { at: 15.0, dur: 2.0, ease: ease.draw });
  tl.tween(cam, { x: 885, y: 350, k: 1.13 }, { at: 15.5, dur: 1.3, ease: ease.move });
  tl.hold(20.9, 0.8);

  tl.caption({ at: 21.7, dur: 6.4, text: 'For Qwen under Hermes, effective windows fall from sixty-two to thirty-seven percent between the first and fourth quarters.' });
  tl.tween(decayU, 1, { at: 22.2, dur: 2.8, ease: ease.draw });
  tl.tween(cam, { x: 920, y: 355, k: 1.08 }, { at: 23.0, dur: 1.3, ease: ease.move });
  tl.hold(28.1, 0.8);

  tl.caption({ at: 28.9, dur: 6.2, text: 'That is an operational coherence failure: intervention fades, and delayed outcomes no longer receive follow-up.' });
  tl.tween(operationalU, 1, { at: 29.4, dur: 1.5, ease: ease.move });
  tl.hold(35.1, 0.8);

  tl.caption({ at: 35.9, dur: 6.5, text: 'Strategic coherence can fail even while tools keep firing. One false traffic theory shrinks a shelf from forty-seven listings to three.' });
  tl.tween(beliefU, 1, { at: 36.4, dur: 3.0, ease: ease.draw });
  tl.tween(cam, { x: 385, y: 415, k: 1.15 }, { at: 37.0, dur: 1.3, ease: ease.move });
  tl.hold(42.4, 0.8);

  tl.caption({ at: 43.2, dur: 6.5, text: 'Another agent declares the store unrecoverable on day one hundred four, then stays silent for three hundred fifty-five remaining windows.' });
  tl.tween(abandonU, 1, { at: 43.7, dur: 2.6, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 355, k: 1.04 }, { at: 44.5, dur: 1.3, ease: ease.move });
  tl.hold(49.7, 0.8);

  tl.caption({ at: 50.5, dur: 6.7, text: 'The benchmark separates staying alive from staying coherent: the claim must survive a year of delayed evidence and close on the terminal ledger.' });
  tl.tween(dimU, 1, { at: 51.0, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 51.8, dur: 0.7, ease: ease.enter });
  tl.hold(57.2, 1.0);

  return { tl, cam, axisU, bestU, humanU, ratioU, sustainedU, decayU, operationalU, beliefU, abandonU, dimU, endU };
}

const scene = buildScene();

function AssetBar({ x, label, value, u, color }: { x: number; label: string; value: number; u: number; color: string }) {
  const h = (value / HUMAN) * 350 * clamp01(u);
  return <g>
    <rect x={x} y={525 - h} width={112} height={h} rx={12} fill={color} opacity={0.84} />
    <text x={x + 56} y={552} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={700}>{label}</text>
    <text x={x + 56} y={505 - h} textAnchor="middle" fill={color} fontSize={15} fontFamily={MONO}>{(value * clamp01(u)).toFixed(2)}k</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const dim = 1 - 0.9 * s.get(scene.dimU);
  const decayU = s.get(scene.decayU);
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={850}>Activity is not coherence</text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>Table 1 · final net assets after 365 simulated days</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        <g opacity={s.get(scene.axisU)}>
          <line x1={110} y1={525} x2={650} y2={525} stroke={colors.GRID} strokeWidth={3} />
          <line x1={110} y1={150} x2={110} y2={525} stroke={colors.GRID} strokeWidth={3} />
          <text x={105} y={135} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>thousand RMB</text>
        </g>
        <AssetBar x={175} label="Rule-based" value={RULE} u={s.get(scene.bestU)} color={colors.MUTED} />
        <AssetBar x={345} label="Best model" value={BEST} u={s.get(scene.bestU)} color={colors.ACCENT} />
        <AssetBar x={515} label="Human" value={HUMAN} u={s.get(scene.humanU)} color={colors.POSITIVE} />
        <g opacity={s.get(scene.ratioU)} transform="translate(322 105)">
          <rect width={250} height={62} rx={18} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
          <text x={125} y={26} textAnchor="middle" fill={colors.MUTED} fontSize={11}>best model ÷ human mean</text>
          <text x={125} y={51} textAnchor="middle" fill={colors.WARM} fontSize={24} fontWeight={850}>27.3%</text>
        </g>

        <g transform="translate(730 140)" opacity={s.get(scene.sustainedU)}>
          <rect width={430} height={140} rx={20} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={215} y={27} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={800}>Sustained Window Rate</text>
          {[
            { label: 'Human', lo: 100, hi: 100, color: colors.POSITIVE },
            { label: 'ReAct models', lo: 10.6, hi: 99.4, color: colors.ACCENT },
            { label: 'Hermes models', lo: 17.8, hi: 66.1, color: colors.SECONDARY },
          ].map((r, i) => <g key={r.label} transform={`translate(0 ${48 + i * 29})`}>
            <text x={18} y={10} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>{r.label}</text>
            <line x1={145 + r.lo * 2.3} y1={5} x2={145 + r.hi * 2.3} y2={5} stroke={r.color} strokeWidth={10} strokeLinecap="round" />
            <circle cx={145 + r.lo * 2.3} cy={5} r={6} fill={r.color} />
            <circle cx={145 + r.hi * 2.3} cy={5} r={6} fill={r.color} />
          </g>)}
        </g>

        <g transform="translate(730 330)" opacity={decayU}>
          <rect width={430} height={210} rx={20} fill={colors.PANEL} stroke={colors.SECONDARY} />
          <text x={215} y={29} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={800}>Qwen effective windows</text>
          <text x={50} y={178} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>Q1</text>
          <text x={370} y={178} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>Q4</text>
          <line x1={70} y1={76} x2={lerp(70, 360, decayU)} y2={lerp(76, 126, decayU)} stroke={colors.SECONDARY} strokeWidth={5} />
          <circle cx={70} cy={76} r={8} fill={colors.SECONDARY} />
          <circle cx={lerp(70, 360, decayU)} cy={lerp(76, 126, decayU)} r={8} fill={colors.SECONDARY} />
          <text x={70} y={60} textAnchor="middle" fill={colors.SECONDARY} fontSize={13}>62%</text>
          <text x={360} y={150} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} opacity={decayU}>37%</text>
          <line x1={70} y1={65} x2={lerp(70, 360, decayU)} y2={lerp(65, 155, decayU)} stroke={colors.ACCENT} strokeWidth={3} strokeDasharray="7 6" />
          <text x={215} y={197} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>Hermes: 62 → 37 · ReAct: 68 → 23</text>
        </g>

        <g opacity={s.get(scene.operationalU)} transform="translate(750 560)">
          <text x={200} y={0} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={800}>operational loop narrows</text>
          {[0, 1, 2, 3].map((i) => <circle key={i} cx={80 + i * 82} cy={30} r={20 - i * 4} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} opacity={1 - i * 0.18} />)}
        </g>

        <g opacity={s.get(scene.beliefU)} transform="translate(110 570)">
          <text x={0} y={-14} fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>false belief → shelf contraction</text>
          {Array.from({ length: 47 }, (_, i) => {
            const keep = i < Math.round(47 - 44 * s.get(scene.beliefU));
            return <rect key={i} x={(i % 24) * 20} y={Math.floor(i / 24) * 22} width={15} height={15} rx={3} fill={keep ? colors.WARM : colors.GRID} opacity={keep ? 0.85 : 0.12} />;
          })}
          <text x={500} y={16} fill={colors.WARM} fontSize={13} fontFamily={MONO}>47 → 3 listings</text>
        </g>

        <g opacity={s.get(scene.abandonU)} transform="translate(340 535)">
          <rect width={600} height={76} rx={18} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
          <text x={20} y={28} fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>Day 104 · “store cannot recover”</text>
          <rect x={20} y={43} width={540} height={12} rx={6} fill={colors.GRID} />
          <rect x={20} y={43} width={540 * (355 / 523) * s.get(scene.abandonU)} height={12} rx={6} fill={colors.NEGATIVE} />
          <text x={580} y={55} textAnchor="end" fill={colors.NEGATIVE} fontSize={11}>355 silent windows</text>
        </g>
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={150} y={214} width={980} height={238} rx={30} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={283} textAnchor="middle" fill={colors.TEXT} fontSize={36} fontWeight={850}>A year makes coherence measurable</text>
      <text x={640} y={334} textAnchor="middle" fill={colors.ACCENT} fontSize={18}>keep acting · keep the objective</text>
      <text x={640} y={371} textAnchor="middle" fill={colors.WARM} fontSize={18}>revise when delayed evidence arrives</text>
      <text x={640} y={410} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>close the terminal ledger</text>
    </g>
  </>;
}

export const vizScene = () => scene;
