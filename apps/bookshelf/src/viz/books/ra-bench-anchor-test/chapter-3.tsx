// The Anchor Test — chapter 3: The five-person sieve.
// Grounded in metadata/ra_bench_humanproof.csv, README.md, EVALUATION.md,
// and scripts/evaluate_predictions.py::humanproof_pairs. The persistent
// generated-video token must receive five "real" judgments to survive.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const REVIEWERS = [270, 430, 590, 780, 940];

function ClipToken({ x, y, u, color = colors.ACCENT, label = 'generated' }: { x: number; y: number; u: number; color?: string; label?: string }) {
  const p = clamp01(u); if (p <= 0.002) return null;
  return <g transform={`translate(${x} ${y}) scale(${0.8 + 0.2 * p})`} opacity={p}>
    <rect x={-48} y={-29} width={96} height={58} rx={9} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
    <path d="M-36 14 L-18 -4 L-3 7 L16 -13 L37 14 Z" fill={color} opacity={0.35} />
    <text y={47} textAnchor="middle" fill={color} fontSize={14} fontFamily={MONO}>{label}</text>
  </g>;
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pairU = tl.channel('pairU', 0);
  const railU = tl.channel('railU', 0);
  const stageOneP = tl.channel('stageOneP', 0);
  const stageTwoP = tl.channel('stageTwoP', 0);
  const rejectU = tl.channel('rejectU', 0);
  const survivorP = tl.channel('survivorP', 0);
  const countU = tl.channel('countU', 0);
  const repairU = tl.channel('repairU', 0);
  const metricsU = tl.channel('metricsU', 0);
  const stageDim = tl.channel('stageDim', 0);
  const payoffU = tl.channel('payoffU', 0);

  tl.caption({ at: 0.3, dur: 5.4, text: 'Some generated crisis videos fool people. Human Proof isolates the ones that do so consistently.' });
  tl.tween(pairU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.caption({ at: 6.1, dur: 5.0, text: 'The generated clip begins beside its matched real anchor. The pairing never disappears.' });
  tl.tween(railU, 1, { at: 6.5, dur: 1.4, ease: ease.draw });

  tl.caption({ at: 11.6, dur: 5.4, text: 'Three reviewers judge the clip in the first stage. Each one must call it real.' });
  tl.tween(stageOneP, 3, { at: 12.0, dur: 2.4, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 12.2, dur: 1.2, ease: ease.move });
  tl.caption({ at: 17.5, dur: 5.0, text: 'Two more reviewers repeat the test in the second stage.' });
  tl.tween(stageTwoP, 2, { at: 18.0, dur: 1.8, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 18.1, dur: 1.2, ease: ease.move });

  tl.caption({ at: 23.0, dur: 5.3, text: 'A single generated judgment ejects a clip. Four fooled reviewers are not enough.' });
  tl.tween(rejectU, 1, { at: 23.5, dur: 0.6, ease: ease.pop });
  tl.tween(rejectU, 0, { at: 26.4, dur: 0.8, ease: ease.move });
  tl.caption({ at: 28.8, dur: 5.6, text: 'Only clips judged real by all five reviewers enter the Human Proof subset.' });
  tl.tween(cam, CAMERA_HOME, { at: 29.0, dur: 1.2, ease: ease.move });
  tl.tween(survivorP, 12, { at: 29.6, dur: 2.8, ease: ease.enter });
  tl.tween(countU, 1, { at: 32.0, dur: 0.6, ease: ease.pop });

  tl.caption({ at: 34.9, dur: 5.5, text: 'The release records six hundred thirty-three such generated videos, each linked back to a real anchor.' });
  tl.tween(repairU, 1, { at: 35.4, dur: 1.3, ease: ease.draw });
  tl.caption({ at: 40.9, dur: 5.8, text: 'The evaluator reports pooled Human Proof metrics first, with source-specific and equal-source results as diagnostics.' });
  tl.tween(metricsU, 1, { at: 41.4, dur: 1.4, ease: ease.enter });
  tl.caption({ at: 47.2, dur: 6.1, text: 'Human Proof asks the detector to face the exact videos that already passed a five-person authenticity test.' });
  tl.tween(stageDim, 1, { at: 47.7, dur: 1.0, ease: ease.move });
  tl.tween(payoffU, 1, { at: 48.5, dur: 0.7, ease: ease.enter });
  tl.hold(53.6, 1.0);
  return { tl, cam, pairU, railU, stageOneP, stageTwoP, rejectU, survivorP, countU, repairU, metricsU, stageDim, payoffU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const dim = 1 - s.get(scene.stageDim) * 0.88;
  const p1 = s.get(scene.stageOneP), p2 = s.get(scene.stageTwoP);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={dim}>
      <text x={76} y={72} fill={colors.TEXT} fontSize={25} fontWeight={700}>the five-person sieve</text>
      <ClipToken x={112} y={310} u={s.get(scene.pairU)} />
      <ClipToken x={112} y={460} u={s.get(scene.pairU)} color={colors.POSITIVE} label="matched real" />
      <path d="M160 310 L1048 310" stroke={colors.MUTED} strokeWidth={3} opacity={s.get(scene.railU) * 0.45} />
      <path d="M160 460 L1048 460" stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="7 6" opacity={s.get(scene.railU) * 0.55} />
      {REVIEWERS.map((x, i) => {
        const u = i < 3 ? clamp01(p1 - i) : clamp01(p2 - (i - 3));
        return <g key={i} opacity={Math.max(0.2, u)}>
          <circle cx={x} cy={310} r={44} fill={colors.PANEL} stroke={u > 0.5 ? colors.POSITIVE : colors.MUTED} strokeWidth={2} />
          <text x={x} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={14}>reviewer {i + 1}</text>
          <text x={x} y={326} textAnchor="middle" fill={u > 0.5 ? colors.POSITIVE : colors.TEXT} fontSize={15} fontWeight={700}>{u > 0.5 ? 'REAL' : '…'}</text>
        </g>;
      })}
      <g opacity={Math.max(0.3, s.get(scene.railU))}>
        <path d={`M${REVIEWERS[0] - 44} 368 V376 H${REVIEWERS[2] + 44} V368`} fill="none" stroke={colors.TEXT} strokeWidth={1.5} opacity={0.6} />
        <text x={(REVIEWERS[0] + REVIEWERS[2]) / 2} y={396} textAnchor="middle" fill={colors.TEXT} fontSize={14}>stage one · reviewers 1–3</text>
        <path d={`M${REVIEWERS[3] - 44} 368 V376 H${REVIEWERS[4] + 44} V368`} fill="none" stroke={colors.TEXT} strokeWidth={1.5} opacity={0.6} />
        <text x={(REVIEWERS[3] + REVIEWERS[4]) / 2} y={396} textAnchor="middle" fill={colors.TEXT} fontSize={14}>stage two · reviewers 4–5</text>
      </g>
      <g opacity={s.get(scene.rejectU)} transform={`translate(${940 + 40 * s.get(scene.rejectU)} ${310 - 150 * s.get(scene.rejectU)}) rotate(${18 * s.get(scene.rejectU)})`}>
        <ClipToken x={0} y={0} u={1} color={colors.NEGATIVE} label="ejected" />
        <text y={88} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14}>one GENERATED vote</text>
      </g>
      <g opacity={s.get(scene.repairU)}>
        <path d="M158 492 C158 620 600 600 740 586" fill="none" stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="7 6" />
        <text x={420} y={618} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>humanproof_pairs()</text>
      </g>
      <text x={192} y={488} fill={colors.TEXT} fontSize={14} opacity={clamp01(s.get(scene.survivorP))}>five reviewer verdicts per clip</text>
      {Array.from({ length: 12 }, (_, i) => {
        const u = clamp01(s.get(scene.survivorP) - i);
        const x = 240 + (i % 6) * 100, y = 512 + Math.floor(i / 6) * 48;
        return <g key={i} transform={`translate(${x} ${y})`} opacity={u}>
          <rect x={-48} y={-15} width={96} height={30} rx={7} fill={colors.PANEL} stroke={colors.ACCENT} />
          {[-42, -31, -20, -9, 2].map(dx => <circle key={dx} cx={dx} cy={0} r={3.5} fill={colors.POSITIVE} />)}
          <text x={22} y={5} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>5/5</text>
        </g>;
      })}
      <g opacity={s.get(scene.countU)}>
        <text x={820} y={566} fill={colors.ACCENT} fontSize={42} fontWeight={750}>633</text>
        <text x={820} y={592} fill={colors.TEXT} fontSize={15}>HumanProof videos</text>
      </g>
      <g opacity={s.get(scene.metricsU)}>
        <rect x={1010} y={430} width={210} height={178} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} />
        <text x={1115} y={464} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontWeight={700}>reported metrics</text>
        <rect x={1038} y={487} width={154} height={30} rx={8} fill={colors.ACCENT} opacity={0.3} />
        <text x={1115} y={507} textAnchor="middle" fill={colors.TEXT} fontSize={14}>pooled · primary</text>
        <text x={1115} y={548} textAnchor="middle" fill={colors.TEXT} fontSize={14} opacity={0.8}>source-specific</text>
        <text x={1115} y={576} textAnchor="middle" fill={colors.TEXT} fontSize={14} opacity={0.8}>equal-source diagnostic</text>
      </g>
    </g>
    {s.get(scene.payoffU) > 0 && <g opacity={s.get(scene.payoffU)}>
      <rect x={230} y={230} width={820} height={210} rx={24} fill="#0a0e1a" stroke={colors.ACCENT} strokeWidth={2} />
      <text x={640} y={294} textAnchor="middle" fill={colors.MUTED} fontSize={15} letterSpacing="0.15em">RA-BENCH-HUMANPROOF</text>
      <text x={640} y={349} textAnchor="middle" fill={colors.ACCENT} fontSize={36} fontWeight={750}>five people said “real”</text>
      <text x={640} y={396} textAnchor="middle" fill={colors.TEXT} fontSize={18}>now ask the detector</text>
    </g>}
  </Camera>;
}
export const vizScene = () => scene;
