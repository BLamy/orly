// The Anchor Test — chapter 4: Six trips through the last mile.
// Grounded in EVALUATION.md's T0–T5 definitions, metadata/release_inventory.json,
// and metadata/ra_bench_lastmile.csv. The persistent paired filmstrip traverses
// every condition while its identity thread remains attached to the anchor.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const GATES = [
  { key: 'T0', title: 'standardized', sub: 'original' },
  { key: 'T1', title: 'VP9 → H.264', sub: 'transcode' },
  { key: 'T2', title: '0.5× size', sub: '+ T1' },
  { key: 'T3', title: '8 fps', sub: '+ T1' },
  { key: 'T4', title: 'news badge', sub: '+ T1' },
  { key: 'T5', title: 'full chain', sub: 'all operations' },
];
const X = [124, 324, 524, 724, 924, 1124];

function ProcessedClip({ x, y, p, u }: { x: number; y: number; p: number; u: number }) {
  const q = clamp01(u); if (q <= 0.002) return null;
  const stage = Math.min(5, Math.floor(p + 0.08));
  const small = stage === 2 || stage === 5;
  const w = small ? 98 : 132, h = small ? 62 : 82;
  const frames = stage === 3 || stage === 5 ? 8 : 16;
  return <g transform={`translate(${x} ${y})`} opacity={q}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
    <path d={`M${-w / 2 + 10} ${h / 2 - 11} L${-w / 4} 0 L0 ${h / 4} L${w / 5} ${-h / 4} L${w / 2 - 10} ${h / 2 - 11} Z`} fill={colors.ACCENT} opacity={0.32} />
    <circle cx={w / 4} cy={-h / 4} r={5} fill={colors.WARM} />
    {(stage === 4 || stage === 5) && <g><rect x={-w / 2 + 5} y={h / 2 - 24} width={w - 10} height={18} fill={colors.NEGATIVE} opacity={0.9} /><text y={h / 2 - 11} textAnchor="middle" fill="white" fontSize={9} fontWeight={700}>BREAKING NEWS</text></g>}
    <g transform={`translate(${-w / 2} ${h / 2 + 11})`}>
      {Array.from({ length: frames }, (_, i) => <rect key={i} x={i * (w / frames)} width={Math.max(2, w / frames - 2)} height={5} fill={stage >= 3 ? colors.WARM : colors.MUTED} opacity={0.75} />)}
    </g>
    <text y={h / 2 + 34} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>{stage >= 1 ? 'H.264' : 'standardized'}</text>
  </g>;
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gatesU = tl.channel('gatesU', 0);
  const clipU = tl.channel('clipU', 0);
  const processP = tl.channel('processP', 0);
  const identityU = tl.channel('identityU', 0);
  const scaleU = tl.channel('scaleU', 0);
  const matrixU = tl.channel('matrixU', 0);
  const difficultyU = tl.channel('difficultyU', 0);
  const stageDim = tl.channel('stageDim', 0);
  const payoffU = tl.channel('payoffU', 0);

  tl.caption({ at: 0.3, dur: 5.2, text: 'A detector rarely sees a video exactly as its generator produced it. The last mile changes the evidence.' });
  tl.tween(gatesU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(clipU, 1, { at: 1.5, dur: 0.7, ease: ease.enter });
  tl.caption({ at: 5.9, dur: 4.7, text: 'The zero condition preserves the standardized original.' });
  tl.tween(cam, { x: X[0], y: 342, k: 1.32 }, { at: 6.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 11.0, dur: 5.0, text: 'Condition one encodes with V P nine, then transcodes to H two sixty-four.' });
  tl.tween(processP, 1, { at: 11.4, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: X[1], y: 342, k: 1.28 }, { at: 11.4, dur: 1.4, ease: ease.move });
  tl.caption({ at: 16.5, dur: 4.8, text: 'Condition two first halves the spatial size, then runs that codec chain.' });
  tl.tween(processP, 2, { at: 16.9, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: X[2], y: 342, k: 1.28 }, { at: 16.9, dur: 1.4, ease: ease.move });

  tl.caption({ at: 21.8, dur: 4.8, text: 'Condition three converts the clip to eight frames per second before transcoding.' });
  tl.tween(processP, 3, { at: 22.2, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: X[3], y: 342, k: 1.28 }, { at: 22.2, dur: 1.4, ease: ease.move });
  tl.caption({ at: 27.0, dur: 4.8, text: 'Condition four adds a news badge, then repeats the codec chain.' });
  tl.tween(processP, 4, { at: 27.4, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: X[4], y: 342, k: 1.28 }, { at: 27.4, dur: 1.4, ease: ease.move });

  tl.caption({ at: 32.2, dur: 5.3, text: 'Condition five combines downsampling, eight-frame playback, the badge, and transcoding.' });
  tl.tween(processP, 5, { at: 32.6, dur: 1.7, ease: ease.move });
  tl.tween(cam, { x: X[5], y: 342, k: 1.25 }, { at: 32.6, dur: 1.5, ease: ease.move });
  tl.tween(identityU, 1, { at: 35.6, dur: 0.8, ease: ease.enter });

  tl.caption({ at: 38.0, dur: 5.8, text: 'The track repeats six conditions across one hundred fifty anchors and all nine benchmark sources.' });
  tl.tween(cam, CAMERA_HOME, { at: 38.4, dur: 1.3, ease: ease.move });
  tl.tween(scaleU, 1, { at: 39.0, dur: 0.8, ease: ease.enter });
  tl.tween(matrixU, 1, { at: 40.0, dur: 1.6, ease: ease.draw });
  tl.caption({ at: 44.3, dur: 6.5, text: 'Across the paper, social dissemination makes detection harder. The anchor lets every damaged copy remain a fair comparison.' });
  tl.tween(difficultyU, 1, { at: 44.8, dur: 1.4, ease: ease.draw });
  tl.caption({ at: 51.2, dur: 6.8, text: 'One real anchor, nine sources, five human judgments, and six last-mile conditions: that is the whole test under pressure.' });
  tl.tween(stageDim, 1, { at: 51.7, dur: 1.0, ease: ease.move });
  tl.tween(payoffU, 1, { at: 52.5, dur: 0.7, ease: ease.enter });
  tl.hold(58.5, 1.1);
  return { tl, cam, gatesU, clipU, processP, identityU, scaleU, matrixU, difficultyU, stageDim, payoffU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const dim = 1 - s.get(scene.stageDim) * 0.88;
  const p = s.get(scene.processP);
  const x = X[Math.floor(Math.min(5, p))] + (X[Math.min(5, Math.ceil(p))] - X[Math.floor(Math.min(5, p))]) * (p - Math.floor(p));
  return <Camera {...s.get(scene.cam)}>
    <g opacity={dim}>
      <text x={74} y={72} fill={colors.TEXT} fontSize={25} fontWeight={700}>six trips through the last mile</text>
      <path d={`M${X[0]} 342 L${X[5]} 342`} stroke={colors.MUTED} strokeWidth={3} opacity={s.get(scene.gatesU) * 0.42} />
      {GATES.map((g, i) => <g key={g.key} opacity={s.get(scene.gatesU)}>
        <rect x={X[i] - 76} y={170} width={152} height={88} rx={15} fill={colors.PANEL} stroke={p >= i ? colors.ACCENT : colors.MUTED} strokeWidth={p >= i ? 2 : 1} />
        <text x={X[i]} y={198} textAnchor="middle" fill={p >= i ? colors.ACCENT : colors.MUTED} fontSize={14} fontWeight={800} fontFamily={MONO}>{g.key}</text>
        <text x={X[i]} y={222} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily={MONO}>{g.title}</text>
        <text x={X[i]} y={242} textAnchor="middle" fill={colors.MUTED} fontSize={10}>{g.sub}</text>
      </g>)}
      <ProcessedClip x={x} y={365} p={p} u={s.get(scene.clipU)} />
      <g opacity={s.get(scene.identityU)}>
        <path d={`M${X[0]} 470 C${X[0]} 520 ${X[5]} 520 ${X[5]} 470`} fill="none" stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="8 6" />
        <text x={640} y={526} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>same norm_clip_id through T0 … T5</text>
      </g>
      <g opacity={s.get(scene.scaleU)}>
        <rect x={70} y={554} width={250} height={66} rx={14} fill={colors.PANEL} stroke={colors.SECONDARY} />
        <text x={195} y={582} textAnchor="middle" fill={colors.SECONDARY} fontSize={23} fontWeight={750}>150 anchors</text>
        <text x={195} y={607} textAnchor="middle" fill={colors.TEXT} fontSize={13}>nine sources · six conditions</text>
      </g>
      <g opacity={s.get(scene.matrixU)}>
        {Array.from({ length: 6 }, (_, row) => Array.from({ length: 9 }, (_, col) => <rect key={`${row}-${col}`} x={450 + col * 38} y={552 + row * 12} width={30} height={8} rx={3} fill={colors.heat((row + col) / 14)} opacity={0.75} />))}
        <text x={791} y={616} textAnchor="end" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>condition × source</text>
      </g>
      <g opacity={s.get(scene.difficultyU)}>
        <path d="M860 570 C920 548 975 552 1020 578 C1060 602 1100 614 1190 618" fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
        <path d="M1178 610 L1190 618 L1176 623" fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
        <text x={1020} y={544} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13}>detection gets harder</text>
      </g>
    </g>
    {s.get(scene.payoffU) > 0 && <g opacity={s.get(scene.payoffU)}>
      <rect x={190} y={206} width={900} height={256} rx={26} fill="#0a0e1a" stroke={colors.POSITIVE} strokeWidth={2} />
      <text x={640} y={272} textAnchor="middle" fill={colors.MUTED} fontSize={15} letterSpacing="0.15em">THE ANCHOR TEST</text>
      <text x={640} y={326} textAnchor="middle" fill={colors.POSITIVE} fontSize={34} fontWeight={760}>real evidence held fixed</text>
      <text x={640} y={371} textAnchor="middle" fill={colors.TEXT} fontSize={18}>nine sources · five judgments · six conditions</text>
      <text x={640} y={418} textAnchor="middle" fill={colors.ACCENT} fontSize={16}>RA-Bench · arXiv:2608.14391</text>
    </g>}
  </Camera>;
}
export const vizScene = () => scene;
