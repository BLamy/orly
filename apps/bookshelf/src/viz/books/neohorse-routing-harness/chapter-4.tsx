// Grounding: arXiv:2609.08183 Sections 3.5, 4.3, and 5; Equations 3–4; official NeoHorse README.md.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const STUDENT = [0.34, 0.25, 0.17, 0.12, 0.07, 0.05];
const TEACHER = [0.28, 0.31, 0.16, 0.11, 0.08, 0.06];
const UPDATED = STUDENT.map((p, i) => p + (TEACHER[i] - p) * 0.72);
const DEFICIENCY = [
  [0.22, 0.40, 0.72, 0.31],
  [0.55, 0.83, 0.48, 0.67],
  [0.36, 0.61, 0.29, 0.76],
  [0.18, 0.44, 0.58, 0.34],
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const contextU = tl.channel('scheduled contexts', 0);
  const generateU = tl.channel('student generation', 0);
  const teacherU = tl.channel('teacher scoring', 0);
  const binsU = tl.channel('shared top k bins', 0);
  const divergenceU = tl.channel('reverse divergence', 0);
  const updateU = tl.channel('student update', 0);
  const refreshU = tl.channel('refreshed rollout', 0);
  const profileU = tl.channel('deficiency profile', 0);
  const allocateU = tl.channel('next data mixture', 0);
  const resultU = tl.channel('reported results', 0);
  const closeU = tl.channel('feedback close', 0);
  const flow = tl.channel('loop flow', 0);
  tl.tween(flow, 1, { at: 0, dur: 65, ease: ease.linear });

  tl.caption({ at: 0.4, dur: 5.5, text: 'Supervised fine-tuning learns recorded responses, but deployment makes the student walk across prefixes it generated itself.' });
  tl.tween(contextU, 1, { at: 0.9, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 300, y: 330, k: 1.08 }, { at: 2.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.2, dur: 5.5, text: 'The method starts from recorded pre-response contexts and schedules them with the same three-stage routing progression.' });
  tl.tween(generateU, 1, { at: 6.8, dur: 2.8, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 9.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.0, dur: 5.5, text: 'For each context, the student generates one response containing whatever reasoning, tool calls, or visible text it actually chooses.' });
  tl.tween(generateU, 2, { at: 12.6, dur: 2.8, ease: ease.linear });

  tl.caption({ at: 17.8, dur: 5.5, text: 'A fixed teacher then supplies a next-token distribution at every position along that student-generated prefix.' });
  tl.tween(teacherU, 1, { at: 18.4, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 650, y: 320, k: 1.04 }, { at: 20.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 23.6, dur: 5.5, text: 'Both distributions share the rollout student’s top candidates and collect the remaining probability in one other bin.' });
  tl.tween(binsU, 1, { at: 24.2, dur: 1.4, ease: ease.move });

  tl.caption({ at: 29.4, dur: 5.5, text: 'Response-normalized reverse divergence measures the gap across those bins, while prompt tokens and padding receive no loss.' });
  tl.tween(divergenceU, 1, { at: 30.0, dur: 1.3, ease: ease.pop });

  tl.caption({ at: 35.2, dur: 5.5, text: 'Only the student updates. Refreshed checkpoints generate later rollouts, so supervision follows newer student behavior.' });
  tl.tween(updateU, 1, { at: 35.8, dur: 1.8, ease: ease.move });
  tl.tween(refreshU, 1, { at: 38.0, dur: 1.0, ease: ease.pop });

  tl.caption({ at: 41.0, dur: 5.5, text: 'Evaluation then builds a deficiency profile across attributes, quality dimensions, outcomes, and routing tiers.' });
  tl.tween(profileU, 1, { at: 41.6, dur: 2.4, ease: ease.draw });
  tl.tween(cam, { x: 850, y: 350, k: 1.04 }, { at: 42.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 46.8, dur: 5.5, text: 'The next training mixture shifts toward underperforming regions while preserving broad coverage and adding new harness trajectories.' });
  tl.tween(allocateU, 1, { at: 47.4, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 49.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 52.6, dur: 5.8, text: 'The paper reports macro averages rising from 58.94 to 64.87 at four billion parameters, and from 65.60 to 69.04 at nine billion.' });
  tl.tween(resultU, 1, { at: 53.2, dur: 2.0, ease: ease.draw });

  tl.caption({ at: 58.7, dur: 6.2, text: 'This closes one evaluation, selection, and update loop. Sustaining the gains across successive iterations remains the next experiment.' });
  tl.tween(closeU, 1, { at: 59.4, dur: 1.3, ease: ease.move });
  tl.hold(65.1, 1.0);

  return { tl, cam, contextU, generateU, teacherU, binsU, divergenceU, updateU, refreshU, profileU, allocateU, resultU, closeU, flow };
}

const scene = buildScene();

function bars(values: number[], x: number, y: number, u: number, color: string, label: string) {
  return <g transform={`translate(${x} ${y})`} opacity={clamp01(u)}>
    <text x="126" y="-108" textAnchor="middle" fill={color} fontSize="12" fontFamily={colors.font.mono}>{label}</text>
    {values.map((p, i) => <g key={i} transform={`translate(${i * 43} 0)`}>
      <rect y={-p * 260 * clamp01(u)} width="30" height={p * 260 * clamp01(u)} rx="8" fill={color} opacity={0.82} />
      <text x="15" y="20" textAnchor="middle" fill={colors.MUTED} fontSize="9">{i === 5 ? 'other' : i + 1}</text>
    </g>)}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const generated = s.get(scene.generateU);
  const update = clamp01(s.get(scene.updateU));
  const result = s.get(scene.resultU);
  const workingOpacity = 1 - result * 0.9;
  const studentValues = STUDENT.map((p, i) => p + (UPDATED[i] - p) * update);
  const alloc = s.get(scene.allocateU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="70" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">the student walks; the teacher measures</text>
      <g opacity={s.get(scene.contextU) * workingOpacity} transform="translate(78 116)">
        {[0, 1, 2].map((stage) => <g key={stage} transform={`translate(0 ${stage * 75})`}>
          <rect width="220" height="56" rx="18" fill="#142238" stroke={[colors.POSITIVE, colors.ACCENT, colors.SECONDARY][stage]} strokeWidth="2.5" />
          <text x="18" y="25" fill={[colors.POSITIVE, colors.ACCENT, colors.SECONDARY][stage]} fontSize="11" fontFamily={colors.font.mono}>{`context stage ${stage + 1}`}</text>
          <text x="18" y="43" fill={colors.MUTED} fontSize="10">pre-response state</text>
        </g>)}
        <path d="M225 103 H340" stroke={colors.ACCENT} strokeWidth="5" strokeDasharray="12 8" strokeDashoffset={-36 * s.get(scene.flow)} />
      </g>

      <g transform="translate(330 116)" opacity={clamp01(generated) * workingOpacity}>
        <rect width="306" height="236" rx="30" fill="#111a2c" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="153" y="36" textAnchor="middle" fill={colors.ACCENT} fontSize="13" fontFamily={colors.font.mono}>student prefix</text>
        {['reason', 'call', 'result', 'answer'].map((token, i) => {
          const u = clamp01(generated * 2.3 - i * 0.34);
          return <g key={token} transform={`translate(${30 + i * 67} 92)`} opacity={u}>
            <rect width="54" height="86" rx="15" fill="#192742" stroke={i === 2 ? colors.POSITIVE : colors.ACCENT} />
            <text x="27" y="48" textAnchor="middle" fill={colors.TEXT} fontSize="10" transform="rotate(-90 27 48)">{token}</text>
          </g>;
        })}
        <circle cx="276" cy="210" r={12 + s.get(scene.refreshU) * 7} fill={colors.POSITIVE} opacity={s.get(scene.refreshU)} />
      </g>

      <g transform="translate(682 206)" opacity={workingOpacity}>
        {bars(studentValues, 0, 116, s.get(scene.teacherU), colors.ACCENT, 'student P')}
        {bars(TEACHER, 286, 116, s.get(scene.teacherU), colors.SECONDARY, 'fixed teacher Q')}
        <g opacity={s.get(scene.binsU)}>
          <path d="M18 136 H534" stroke={colors.WARM} strokeWidth="3" strokeDasharray="8 7" />
          <text x="276" y="160" textAnchor="middle" fill={colors.WARM} fontSize="11" fontFamily={colors.font.mono}>shared top-K candidates + other</text>
        </g>
        <g opacity={s.get(scene.divergenceU)}>
          <rect x="147" y="-48" width="245" height="52" rx="18" fill="#2a1f35" stroke={colors.SECONDARY} strokeWidth="2" />
          <MathLabel tex={String.raw`D_{\mathrm{KL}}(P\,\|\,Q)`} x={270} y={-20} fontSize={23} opacity={1} />
        </g>
      </g>

      <g opacity={s.get(scene.profileU) * workingOpacity} transform="translate(720 390)">
        <rect width="448" height="198" rx="28" fill="#111a2b" stroke={colors.WARM} strokeWidth="3" />
        <text x="224" y="32" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>model deficiency profile</text>
        {DEFICIENCY.map((row, r) => row.map((v, c) => {
          const u = clamp01(s.get(scene.profileU) * 2.4 - (r * 4 + c) * 0.08);
          const hot = v > 0.65;
          return <g key={`${r}-${c}`} transform={`translate(${38 + c * 96} ${52 + r * 32})`} opacity={u}>
            <rect width="78" height="24" rx="8" fill={hot ? '#472016' : '#162842'} stroke={hot ? colors.NEGATIVE : colors.ACCENT} />
            <rect width={78 * v} height="24" rx="8" fill={hot ? colors.NEGATIVE : colors.ACCENT} opacity="0.55" />
          </g>;
        }))}
        <g opacity={alloc}>
          <path d="M406 70 C470 70 470 168 406 168" fill="none" stroke={colors.POSITIVE} strokeWidth="5" />
          <polygon points="405,168 425,156 425,180" fill={colors.POSITIVE} />
          <text x="390" y="188" textAnchor="end" fill={colors.POSITIVE} fontSize="10">rebalance next mixture</text>
        </g>
      </g>

      <g opacity={result} transform="translate(360 286)">
        <rect width="560" height="176" rx="28" fill="#111a2a" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="280" y="34" textAnchor="middle" fill={colors.POSITIVE} fontSize="13" fontFamily={colors.font.mono}>reported ten-benchmark macro average</text>
        {[['4B', 58.94, 64.87, colors.ACCENT], ['9B', 65.60, 69.04, colors.SECONDARY]].map(([label, before, after, color], i) => <g key={String(label)} transform={`translate(46 ${64 + i * 54})`}>
          <text x="0" y="17" fill={String(color)} fontSize="13" fontFamily={colors.font.mono}>{String(label)}</text>
          <rect x="48" width={Number(before) * 5.6} height="18" rx="9" fill="#263246" />
          <rect x="48" width={Number(after) * 5.6 * s.get(scene.resultU)} height="18" rx="9" fill={String(color)} />
          <text x="446" y="15" fill={colors.TEXT} fontSize="11" fontFamily={colors.font.mono}>{`${Number(before).toFixed(2)} → ${Number(after).toFixed(2)}`}</text>
        </g>)}
      </g>
    </g>
    <g opacity={close}>
      <rect x="195" y="112" width="890" height="448" rx="50" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="165" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">one loop closes</text>
      {['HARNESS', 'EVALUATE', 'ALLOCATE', 'UPDATE'].map((label, i) => {
        const a = -Math.PI / 2 + i * Math.PI / 2;
        const x = 640 + Math.cos(a) * 220;
        const y = 370 + Math.sin(a) * 70;
        return <g key={label} transform={`translate(${x} ${y})`}>
          <circle r="60" fill={colors.PANEL} stroke={[colors.ACCENT, colors.WARM, colors.SECONDARY, colors.POSITIVE][i]} strokeWidth="4" />
          <text y="5" textAnchor="middle" fill={[colors.ACCENT, colors.WARM, colors.SECONDARY, colors.POSITIVE][i]} fontSize="12" fontFamily={colors.font.mono}>{label}</text>
        </g>;
      })}
      <path d="M705 300 C880 310 900 380 795 440 C665 515 435 480 420 375 C405 305 520 290 575 300" fill="none" stroke={colors.POSITIVE} strokeWidth="6" strokeDasharray="16 10" strokeDashoffset={-52 * s.get(scene.flow)} />
      <text x="640" y="530" textAnchor="middle" fill={colors.WARM} fontSize="18">successive iterations remain the next experiment</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
