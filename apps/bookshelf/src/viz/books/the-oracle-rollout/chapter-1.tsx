// Grounding: paper §3.2–3.3; verl/trainer/ray_trainer.py::_build_oracle_append_rows;
// orarl/rewards; configs/orarl_9b.yaml.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const POLICY = Array.from({ length: 8 }, (_, i) => ({
  x: 456 + (i % 4) * 184,
  y: 264 + Math.floor(i / 4) * 154,
  label: `o${i + 1}`,
}));
const ORACLE = { x: 1008, y: 495 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const videoU = tl.channel('video query', 0);
  const annotationU = tl.channel('task annotation', 0);
  const policyP = tl.channel('policy rollouts', 0);
  const serializeU = tl.channel('serialize annotation', 0);
  const oracleJoinU = tl.channel('append oracle row', 0);
  const rewardSweep = tl.channel('task reward sweep', 0);
  const oracleMarkU = tl.channel('is oracle row', 0);
  const splitU = tl.channel('sampled versus oracle', 0);
  const close = tl.channel('complete group', 0);

  tl.caption({ at: 0.4, dur: 6.0, text: 'A video task usually gives its annotation one job: score the answers a model samples.' });
  tl.tween(videoU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(annotationU, 1, { at: 2.1, dur: 0.7, ease: ease.enter });

  tl.caption({ at: 6.8, dur: 6.1, text: 'The model still samples eight answers, preserving the full on-policy comparison.' });
  tl.tween(policyP, 8, { at: 7.5, dur: 3.6, ease: ease.enter });
  tl.tween(cam, { x: 730, y: 352, k: 1.08 }, { at: 10.8, dur: 1.3, ease: ease.move });

  tl.caption({ at: 13.3, dur: 6.2, text: 'The method gives the annotation a second job: serialize it into the model’s own response format.' });
  tl.tween(serializeU, 1, { at: 14.0, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 318, y: 396, k: 1.18 }, { at: 15.9, dur: 1.3, ease: ease.move });

  tl.caption({ at: 19.9, dur: 6.2, text: 'That known-correct response is appended as an oracle rollout. None of the eight sampled answers is replaced.' });
  tl.tween(oracleJoinU, 1, { at: 20.6, dur: 2.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 23.2, dur: 1.3, ease: ease.move });

  tl.caption({ at: 26.5, dur: 6.2, text: 'One task adapter evaluates every row, so an interval, a box, or a text answer keeps its own reward semantics.' });
  tl.tween(rewardSweep, 1, { at: 27.2, dur: 4.3, ease: ease.linear });

  tl.caption({ at: 33.1, dur: 6.0, text: 'The batch marks exactly one row as the oracle, while every row keeps the same group identity.' });
  tl.tween(oracleMarkU, 1, { at: 33.8, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: 1002, y: 472, k: 1.25 }, { at: 35.2, dur: 1.3, ease: ease.move });

  tl.caption({ at: 39.5, dur: 6.2, text: 'The oracle is not another model sample. It is a detached optimization target derived from ground truth.' });
  tl.tween(splitU, 1, { at: 40.2, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 43.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 46.1, dur: 6.3, text: 'One annotation now does both jobs: it judges the rollout group and enters that group as reliable positive guidance.' });
  tl.tween(close, 1, { at: 46.9, dur: 1.1, ease: ease.move });
  tl.hold(52.7, 1.0);

  return { tl, cam, videoU, annotationU, policyP, serializeU, oracleJoinU, rewardSweep, oracleMarkU, splitU, close };
}

const scene = buildScene();

function ResponseCard({ x, y, label, u, oracle = false, dim = 0 }: { x: number; y: number; label: string; u: number; oracle?: boolean; dim?: number }) {
  const color = oracle ? colors.WARM : colors.ACCENT;
  return <g opacity={u * (1 - dim * 0.78)} transform={`translate(${x} ${y + (1 - u) * 18}) scale(${0.86 + u * 0.14})`}>
    <rect x="-70" y="-42" width="140" height="84" rx="18" fill="#101a2d" stroke={color} strokeWidth={oracle ? 3 : 2} />
    <text y="-12" textAnchor="middle" fill={color} fontSize="14" fontWeight="800" fontFamily={colors.font.mono}>{label}</text>
    <rect x="-46" y="2" width="92" height="9" rx="4.5" fill={color} opacity="0.28" />
    <rect x="-36" y="20" width="72" height="7" rx="3.5" fill={colors.MUTED} opacity="0.25" />
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const annotationU = s.get(scene.annotationU);
  const serializeU = s.get(scene.serializeU);
  const oracleJoin = s.get(scene.oracleJoinU);
  const split = s.get(scene.splitU);
  const oracleX = 258 + (ORACLE.x - 258) * oracleJoin;
  const oracleY = 466 + (ORACLE.y - 466) * oracleJoin;
  const sweep = s.get(scene.rewardSweep);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="58" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">The annotation joins the group</text>

      <g opacity={s.get(scene.videoU)}>
        <text x="82" y="116" fill={colors.MUTED} fontSize="14" fontWeight="700">multimodal query q = (v, x)</text>
        {Array.from({ length: 7 }, (_, i) => <g key={i}>
          <rect x={82 + i * 46} y="136" width="40" height="80" rx="7" fill="#12223a" stroke={i === 3 ? colors.ACCENT : colors.GRID} strokeWidth="2" />
          <circle cx={102 + i * 46} cy={164 + (i % 3) * 8} r={9 + (i % 2) * 4} fill={i === 3 ? colors.ACCENT : colors.SECONDARY} opacity={0.25 + i * 0.06} />
          <path d={`M${88 + i * 46} 200 L${99 + i * 46} ${180 - (i % 2) * 8} L${116 + i * 46} 200 Z`} fill={colors.POSITIVE} opacity="0.24" />
        </g>)}
        <rect x="82" y="136" width="316" height="80" rx="9" fill="none" stroke={colors.ACCENT} strokeWidth="2.5" />
      </g>

      <g opacity={annotationU * (1 - oracleJoin * 0.7)}>
        <rect x="82" y="286" width="352" height="132" rx="24" fill="#171526" stroke={colors.WARM} strokeWidth="3" />
        <text x="108" y="324" fill={colors.WARM} fontSize="15" fontWeight="800" fontFamily={colors.font.mono}>ground_truth</text>
        <text x="108" y="356" fill={colors.TEXT} fontSize="18">annotation y</text>
        <g opacity={serializeU}>
          <path d="M108 380 H390" stroke={colors.GRID} strokeWidth="2" />
          <text x="249" y="404" textAnchor="middle" fill={colors.POSITIVE} fontSize="13" fontFamily={colors.font.mono}>build_oracle_response_from_ground_truth</text>
        </g>
      </g>

      <g>
        <text x="456" y="126" fill={colors.MUTED} fontSize="14" fontWeight="700">on-policy rollouts Oop</text>
        {POLICY.map((p, i) => <ResponseCard key={p.label} {...p} u={clamp01(s.get(scene.policyP) - i)} dim={split} />)}
        <ResponseCard x={oracleX} y={oracleY} label="ogt = Ttask(y)" u={serializeU} oracle />
        <g opacity={s.get(scene.oracleMarkU)} transform={`translate(${ORACLE.x + 58} ${ORACLE.y - 54})`}>
          <rect x="-72" y="-15" width="144" height="30" rx="15" fill="#2d240e" stroke={colors.WARM} />
          <text y="5" textAnchor="middle" fill={colors.WARM} fontSize="12" fontWeight="800" fontFamily={colors.font.mono}>is_oracle_row = true</text>
        </g>
      </g>

      {sweep > 0 && <g opacity={clamp01(sweep * 5) * (1 - clamp01((sweep - 0.94) * 16))}>
        <line x1={444 + sweep * 714} y1="184" x2={444 + sweep * 714} y2="560" stroke={colors.POSITIVE} strokeWidth="5" strokeLinecap="round" />
        <rect x={476 + sweep * 620} y="164" width="214" height="34" rx="17" fill="#0d2c25" stroke={colors.POSITIVE} />
        <text x={583 + sweep * 620} y="186" textAnchor="middle" fill={colors.POSITIVE} fontSize="12" fontFamily={colors.font.mono}>RewardAdapter.compute_reward</text>
      </g>}

      <g opacity={split}>
        <path d="M445 586 H927" stroke={colors.ACCENT} strokeWidth="5" strokeLinecap="round" />
        <text x="686" y="610" textAnchor="middle" fill={colors.ACCENT} fontSize="15">sampled exploration</text>
        <path d="M950 586 H1124" stroke={colors.WARM} strokeWidth="5" strokeLinecap="round" />
        <text x="1037" y="610" textAnchor="middle" fill={colors.WARM} fontSize="15">detached target</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="214" y="132" width="852" height="414" rx="40" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <text x="640" y="204" textAnchor="middle" fill={colors.MUTED} fontSize="20">one annotation</text>
      <g transform="translate(340 334)">
        <circle r="72" fill="#152238" stroke={colors.ACCENT} strokeWidth="4" />
        <text y="-5" textAnchor="middle" fill={colors.ACCENT} fontSize="24" fontWeight="850">scores</text>
        <text y="25" textAnchor="middle" fill={colors.MUTED} fontSize="15">eight samples</text>
      </g>
      <path d="M422 334 H546" stroke={colors.GRID} strokeWidth="5" />
      <g transform="translate(640 334)">
        <circle r="72" fill="#2b240d" stroke={colors.WARM} strokeWidth="4" />
        <text y="-5" textAnchor="middle" fill={colors.WARM} fontSize="24" fontWeight="850">becomes</text>
        <text y="25" textAnchor="middle" fill={colors.MUTED} fontSize="15">the oracle</text>
      </g>
      <path d="M714 334 H838" stroke={colors.GRID} strokeWidth="5" />
      <g transform="translate(940 334)">
        <circle r="72" fill="#122b24" stroke={colors.POSITIVE} strokeWidth="4" />
        <text y="-5" textAnchor="middle" fill={colors.POSITIVE} fontSize="24" fontWeight="850">guides</text>
        <text y="25" textAnchor="middle" fill={colors.MUTED} fontSize="15">the update</text>
      </g>
      <text x="640" y="478" textAnchor="middle" fill={colors.TEXT} fontSize="27" fontWeight="750">score the group · join the group</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
