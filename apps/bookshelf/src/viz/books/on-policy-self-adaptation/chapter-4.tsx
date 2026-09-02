// Grounding: slime/backends/megatron_utils/{loss,opsa}.py; examples/opsa/run_opsa.sh; README.md results table.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const STAGES = ['actor logp', 'actor entropy', 'CP gather', 'compute_opsa', 'opsa_loss_mask', 'policy loss', 'weight update'];
const CELLS = Array.from({ length: 80 }, (_, i) => ({ row: Math.floor(i / 10), col: i % 10, score: ((i * 37) % 101) / 100 }));
const RESULTS = [
  { label: 'AIME24 Avg@32', base: 13.44, opsa: 48.85 },
  { label: 'AIME24 Pass@32', base: 40.0, opsa: 80.0 },
  { label: 'AIME25 Avg@32', base: 9.69, opsa: 35.31 },
  { label: 'HMMT25 Avg@32', base: 5.73, opsa: 23.33 },
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const matrixU = tl.channel('packed response matrix', 0);
  const stageU = tl.channel('training stages', 0);
  const scanP = tl.channel('selector scan', 0);
  const selectedU = tl.channel('selected mask', 0);
  const lossU = tl.channel('masked policy loss', 0);
  const updateU = tl.channel('actor update', 0);
  const loopU = tl.channel('next rollout', 0);
  const launcherU = tl.channel('launcher resources', 0);
  const resultU = tl.channel('reported results', 0);
  const cautionU = tl.channel('validation boundary', 0);
  const closeU = tl.channel('whole method recap', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'In Slime, On-Policy Self-Adaptation joins the normal actor training loop at the response-token loss.' });
  tl.tween(matrixU, 1, { at: 0.9, dur: 1.3, ease: ease.enter });
  tl.tween(stageU, 1, { at: 2.4, dur: 1.4, ease: ease.draw });

  tl.caption({ at: 6.5, dur: 5.8, text: 'The current Megatron actor recomputes sampled-token log probabilities and, in entropy mode, actor entropy.' });
  tl.tween(scanP, 1.8, { at: 7.1, dur: 3.6, ease: ease.linear });
  tl.tween(cam, { x: 540, y: 360, k: 1.08 }, { at: 9.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.6, dur: 5.8, text: 'With context parallelism, those response values are gathered before one local packed-batch selection runs.' });
  tl.tween(scanP, 3.5, { at: 13.2, dur: 3.0, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 16.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.7, dur: 5.8, text: 'The selector writes advantages and a new loss mask, then the standard reducer slices them back for each context-parallel rank.' });
  tl.tween(selectedU, 1, { at: 19.3, dur: 1.6, ease: ease.enter });
  tl.tween(scanP, 5.0, { at: 20.8, dur: 2.0, ease: ease.linear });

  tl.caption({ at: 24.8, dur: 5.8, text: 'Only selected cells contribute to policy loss; the actor update changes the policy that generates the next rollout.' });
  tl.tween(lossU, 1, { at: 25.4, dur: 1.2, ease: ease.pop });
  tl.tween(updateU, 1, { at: 27.0, dur: 1.1, ease: ease.move });
  tl.tween(loopU, 1, { at: 28.2, dur: 1.4, ease: ease.linear });

  tl.caption({ at: 30.9, dur: 5.8, text: 'The canonical small-model launcher splits one machine into four actor graphics processors and four rollout graphics processors for seven hundred steps.' });
  tl.tween(launcherU, 1, { at: 31.5, dur: 1.5, ease: ease.enter });

  tl.caption({ at: 37.0, dur: 5.8, text: 'For the one-point-seven-billion-parameter model, the manuscript reports large gains on three mathematical reasoning benchmarks.' });
  tl.tween(resultU, 1, { at: 37.6, dur: 2.0, ease: ease.move });
  tl.tween(cam, { x: 760, y: 360, k: 1.08 }, { at: 39.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 43.1, dur: 5.8, text: 'The open-source cleanup validates the selector and launchers with processor and command-line checks, but it does not claim a fresh end-to-end training reproduction.' });
  tl.tween(cautionU, 1, { at: 43.7, dur: 1.1, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 46.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 49.2, dur: 6.2, text: 'Roll out, measure the actor, select the lowest fifth, apply entropy-ranked pressure, update, and repeat.' });
  tl.tween(closeU, 1, { at: 50.0, dur: 1.2, ease: ease.move });
  tl.hold(55.4, 1.2);

  return { tl, cam, matrixU, stageU, scanP, selectedU, lossU, updateU, loopU, launcherU, resultU, cautionU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const scan = s.get(scene.scanP);
  const selected = s.get(scene.selectedU);
  const result = s.get(scene.resultU);
  return <><text x="640" y="76" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850" opacity={1 - close}>the selector inside the training loop</text><Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <g transform="translate(62 124)" opacity={s.get(scene.matrixU)}>
        <rect width="600" height="390" rx="30" fill="#101a2b" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="300" y="40" textAnchor="middle" fill={colors.ACCENT} fontSize="14" fontFamily={colors.font.mono}>DP-local packed response batch</text>
        {CELLS.map(({ row, col, score }, i) => {
          const chosen = score < 0.2;
          const u = clamp01(s.get(scene.matrixU) * 80 - i);
          const hot = Math.max(0, 1 - Math.abs(scan * 20 - i) / 8);
          return <rect key={i} x={38 + col * 52} y={68 + row * 36} width="42" height="26" rx="7" fill={chosen && selected ? colors.NEGATIVE : colors.ACCENT} opacity={u * (chosen && selected ? 0.92 : 0.18 + hot * 0.55)} stroke={chosen && selected ? colors.WARM : 'none'} strokeWidth="2" />;
        })}
        <g opacity={s.get(scene.lossU)} transform="translate(300 360)">
          <rect x="-190" y="-24" width="380" height="48" rx="18" fill="#102a22" stroke={colors.POSITIVE} />
          <text y="7" textAnchor="middle" fill={colors.POSITIVE} fontSize="13" fontFamily={colors.font.mono}>policy loss uses opsa_loss_mask</text>
        </g>
      </g>
      <g transform="translate(704 118)" opacity={s.get(scene.stageU)}>
        {STAGES.map((label, i) => {
          const active = scan >= i * 0.72;
          return <g key={label} transform={`translate(0 ${i * 62})`}>
            <rect width="440" height="46" rx="16" fill={active ? '#17283b' : '#111827'} stroke={active ? (i >= 3 ? colors.POSITIVE : colors.SECONDARY) : colors.GRID} strokeWidth={active ? 2.5 : 1.2} />
            <text x="220" y="29" textAnchor="middle" fill={active ? colors.TEXT : colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>{label}</text>
            {i < STAGES.length - 1 && <path d="M220 47 V61" stroke={colors.MUTED} strokeWidth="3" />}
          </g>;
        })}
        <path d="M440 403 C505 403 505 16 440 16" fill="none" stroke={colors.WARM} strokeWidth="5" strokeDasharray="10 8" opacity={s.get(scene.loopU)} />
        <polygon points="440,16 462,5 462,27" fill={colors.WARM} opacity={s.get(scene.loopU)} />
      </g>
      <g opacity={s.get(scene.launcherU)} transform="translate(286 510)">
        {[0, 1, 2, 3].map((i) => <rect key={`a${i}`} x={i * 54} y="-22" width="44" height="44" rx="10" fill="#14243a" stroke={colors.ACCENT} />)}
        {[0, 1, 2, 3].map((i) => <rect key={`r${i}`} x={254 + i * 54} y="-22" width="44" height="44" rx="10" fill="#241d38" stroke={colors.SECONDARY} />)}
        <text x="82" y="43" textAnchor="middle" fill={colors.ACCENT} fontSize="12">4 actor GPUs</text>
        <text x="336" y="43" textAnchor="middle" fill={colors.SECONDARY} fontSize="12">4 rollout GPUs</text>
      </g>
      <g opacity={result} transform="translate(690 132)">
        <rect width="480" height="430" rx="30" fill="#0f1728" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="240" y="42" textAnchor="middle" fill={colors.POSITIVE} fontSize="14">Qwen3-1.7B · manuscript results</text>
        {RESULTS.map((item, i) => <g key={item.label} transform={`translate(28 ${86 + i * 78})`}>
          <text x="0" y="0" fill={colors.TEXT} fontSize="12">{item.label}</text>
          <rect x="0" y="12" width={item.base * 3.8 * result} height="16" rx="8" fill={colors.MUTED} />
          <rect x="0" y="34" width={item.opsa * 3.8 * result} height="16" rx="8" fill={colors.POSITIVE} />
          <text x="420" y="27" textAnchor="end" fill={colors.MUTED} fontSize="10">{item.base.toFixed(2)}</text>
          <text x="420" y="50" textAnchor="end" fill={colors.POSITIVE} fontSize="10">{item.opsa.toFixed(2)}</text>
        </g>)}
        <g opacity={s.get(scene.cautionU)} transform="translate(240 398)"><rect x="-210" y="-24" width="420" height="48" rx="18" fill="#2d2117" stroke={colors.WARM} /><text y="6" textAnchor="middle" fill={colors.WARM} fontSize="12">CPU/CLI validated · not a fresh GPU reproduction</text></g>
      </g>
    </g>
    <g opacity={close}>
      <rect x="160" y="112" width="960" height="456" rx="48" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="186" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">self-adaptation is a closed loop</text>
      {['roll out', 'actor logp', 'lowest 20%', 'entropy rank', 'update'].map((label, i) => <g key={label} transform={`translate(${250 + i * 195} 350)`}>
        <circle r="58" fill="#13243a" stroke={i === 2 ? colors.WARM : i === 3 ? colors.SECONDARY : colors.ACCENT} strokeWidth="3" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="13" fontWeight="750">{label}</text>
        {i < 4 && <><line x1="60" y1="0" x2="132" y2="0" stroke={colors.MUTED} strokeWidth="4" /><polygon points="132,0 114,-10 114,10" fill={colors.MUTED} /></>}
      </g>)}
      <path d="M1030 420 C1030 510 250 510 250 412" fill="none" stroke={colors.WARM} strokeWidth="5" strokeDasharray="10 8" />
      <text x="640" y="532" textAnchor="middle" fill={colors.POSITIVE} fontSize="17" fontFamily={colors.font.mono}>teacher-free · reward-free · reference-free</text>
    </g>
  </Camera></>;
}

export const vizScene = () => scene;
