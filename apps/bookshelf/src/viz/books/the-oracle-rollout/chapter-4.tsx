// Grounding: verl/utils/multimodal_contract.py; verl/workers/rollout/vllm_rollout_spmd.py;
// verl/trainer/ray_trainer.py; paper Fig. 7 and Appendix B.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const GROUP = Array.from({ length: 9 }, (_, i) => ({
  x: 174 + i * 116,
  oracle: i === 8,
  keep: i === 0 || i === 2 || i === 3 || i === 8,
}));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const videoU = tl.channel('video source', 0);
  const decodeP = tl.channel('decoded frames', 0);
  const contractU = tl.channel('inline multimodal contract', 0);
  const reuseP = tl.channel('reuse contract', 0);
  const groupP = tl.channel('eight plus oracle', 0);
  const oracleU = tl.channel('append oracle', 0);
  const overlapU = tl.channel('reward and old log probabilities', 0);
  const advantagesU = tl.channel('driver advantages', 0);
  const selectU = tl.channel('select before actor', 0);
  const actorU = tl.channel('four row update', 0);
  const compareU = tl.channel('step time comparison', 0);
  const close = tl.channel('full method recap', 0);

  tl.caption({ at: 0.4, dur: 6.0, text: 'Video frames are the expensive input. The repository’s multimodal contract can decode them once.' });
  tl.tween(videoU, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(decodeP, 8, { at: 1.8, dur: 3.2, ease: ease.linear });

  tl.caption({ at: 6.8, dur: 6.2, text: 'The inline contract carries frame tensors, metadata, and the original paths for traceability.' });
  tl.tween(contractU, 1, { at: 7.5, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 640, y: 276, k: 1.18 }, { at: 9.5, dur: 1.3, ease: ease.move });

  tl.caption({ at: 13.4, dur: 6.2, text: 'The rollout worker hands those tensors to the video model without sampling or resizing the frames again.' });
  tl.tween(reuseP, 3, { at: 14.1, dur: 2.4, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 17.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 20.0, dur: 6.3, text: 'The model generates eight policy responses, then the trainer appends one serialized oracle with the same group identity.' });
  tl.tween(groupP, 8, { at: 20.7, dur: 3.6, ease: ease.enter });
  tl.tween(oracleU, 1, { at: 24.0, dur: 0.7, ease: ease.pop });

  tl.caption({ at: 26.7, dur: 6.1, text: 'Reward computation overlaps with old policy probability work, so the two branches meet without waiting in series.' });
  tl.tween(overlapU, 1, { at: 27.4, dur: 1.3, ease: ease.move });
  tl.tween(cam, { x: 640, y: 420, k: 1.1 }, { at: 29.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 33.2, dur: 6.2, text: 'The driver constructs advantages, applies the detached anchor, and runs sign-balanced selection.' });
  tl.tween(advantagesU, 1, { at: 33.9, dur: 1.1, ease: ease.draw });
  tl.tween(selectU, 1, { at: 35.4, dur: 1.4, ease: ease.move });

  tl.caption({ at: 39.8, dur: 6.2, text: 'Nine evaluated rows collapse to four update rows before the actor performs forward and backward passes.' });
  tl.tween(actorU, 1, { at: 40.5, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 43.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 46.4, dur: 6.5, text: 'In the paper’s matched comparison, this step takes sixty-two point four seconds, versus one hundred thirty-five point six with chain-of-thought group training.' });
  tl.tween(compareU, 1, { at: 47.1, dur: 1.3, ease: ease.move });

  tl.caption({ at: 53.3, dur: 7.0, text: 'Serialize the annotation, protect the policy baseline, keep both signs, reuse the video, and spend the update only on the rows that teach.' });
  tl.tween(close, 1, { at: 54.1, dur: 1.1, ease: ease.move });
  tl.hold(60.7, 1.0);

  return { tl, cam, videoU, decodeP, contractU, reuseP, groupP, oracleU, overlapU, advantagesU, selectU, actorU, compareU, close };
}

const scene = buildScene();

function MiniFrame({ x, y, i, u }: { x: number; y: number; i: number; u: number }) {
  return <g opacity={u} transform={`translate(${x} ${y + (1 - u) * 16})`}>
    <rect x="-31" y="-34" width="62" height="68" rx="8" fill="#12223a" stroke={i === 4 ? colors.ACCENT : colors.GRID} strokeWidth="2" />
    <circle cx={-7 + (i % 4) * 5} cy={-7 + (i % 3) * 4} r="10" fill={colors.SECONDARY} opacity="0.4" />
    <path d="M-24 23 L-5 4 L8 15 L24 -4 V23 Z" fill={colors.POSITIVE} opacity="0.28" />
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const contract = s.get(scene.contractU);
  const select = s.get(scene.selectU);
  const actor = s.get(scene.actorU);
  const compare = s.get(scene.compareU);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet * (1 - compare)}>
      <text x="640" y="58" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">Decode once, update four</text>

      <g opacity={s.get(scene.videoU)}>
        <rect x="72" y="104" width="160" height="82" rx="22" fill="#171526" stroke={colors.WARM} strokeWidth="3" />
        <circle cx="112" cy="145" r="22" fill={colors.WARM} opacity="0.28" />
        <path d="M106 132 L126 145 L106 158 Z" fill={colors.WARM} />
        <text x="158" y="141" textAnchor="middle" fill={colors.TEXT} fontSize="15" fontWeight="800">video path</text>
        <text x="158" y="163" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>source_type: path</text>
      </g>
      <path d={`M236 145 H${Math.max(236, 286 + clamp01(s.get(scene.decodeP) / 8) * 78)}`} stroke={colors.ACCENT} strokeWidth="4" strokeDasharray="8 7" />
      {Array.from({ length: 8 }, (_, i) => <MiniFrame key={i} x={330 + i * 92} y={145} i={i} u={clamp01(s.get(scene.decodeP) - i)} />)}
      <text x="654" y="204" textAnchor="middle" fill={colors.ACCENT} fontSize="13" opacity={clamp01(s.get(scene.decodeP) / 8)}>decoded tensors + frames_indices</text>

      <g opacity={contract} transform={`translate(0 ${(1 - contract) * 24})`}>
        <rect x="348" y="236" width="584" height="94" rx="26" fill="#10263a" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="640" y="267" textAnchor="middle" fill={colors.ACCENT} fontSize="15" fontWeight="800" fontFamily={colors.font.mono}>multi_modal_data['video']</text>
        {['source_type: inline', 'frames', 'metadatas', 'paths'].map((label, i) => <g key={label} transform={`translate(${448 + i * 128} 301)`}>
          <rect x="-56" y="-15" width="112" height="30" rx="15" fill="#08131f" stroke={i === 0 ? colors.POSITIVE : colors.MUTED} />
          <text y="5" textAnchor="middle" fill={i === 0 ? colors.POSITIVE : colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>{label}</text>
        </g>)}
      </g>

      <g opacity={clamp01(s.get(scene.reuseP))}>
        {['vLLM rollout', 'FSDP forward', 'oracle row'].map((label, i) => {
          const u = clamp01(s.get(scene.reuseP) - i);
          const x = 418 + i * 222;
          return <g key={label} opacity={u}>
            <path d={`M640 332 C640 356 ${x} 342 ${x} 382`} fill="none" stroke={i === 2 ? colors.WARM : colors.SECONDARY} strokeWidth="3" strokeDasharray="7 6" />
            <rect x={x - 72} y="374" width="144" height="42" rx="18" fill="#111827" stroke={i === 2 ? colors.WARM : colors.SECONDARY} />
            <text x={x} y="400" textAnchor="middle" fill={i === 2 ? colors.WARM : colors.SECONDARY} fontSize="13">{label}</text>
          </g>;
        })}
      </g>

      <g>
        {GROUP.map((row, i) => {
          const u = row.oracle ? s.get(scene.oracleU) : clamp01(s.get(scene.groupP) - i);
          const keep = row.keep;
          const x = row.x;
          const selectedY = 520;
          const y = 458 + (selectedY - 458) * actor * (keep ? 1 : 0);
          const dim = select * (keep ? 0 : 0.9);
          const color = row.oracle ? colors.WARM : keep ? colors.POSITIVE : colors.ACCENT;
          return <g key={i} opacity={u * (1 - dim)} transform={`translate(${x} ${y}) scale(${0.82 + u * 0.18})`}>
            <circle r={keep && select > 0 ? 22 : 17} fill={color} stroke="#07101d" strokeWidth="3" />
            <text y="5" textAnchor="middle" fill="#07101d" fontSize="11" fontWeight="900">{row.oracle ? 'GT' : i + 1}</text>
            {keep && select > 0 && <circle r="29" fill="none" stroke={colors.WARM} strokeWidth="2" strokeDasharray="6 5" />}
          </g>;
        })}
        <text x="640" y="490" textAnchor="middle" fill={colors.MUTED} fontSize="13" opacity={clamp01(s.get(scene.groupP) / 8)}>eight policy rows + one oracle row</text>
      </g>

      <g opacity={s.get(scene.overlapU)}>
        <path d="M260 430 C330 382 420 382 492 430" fill="none" stroke={colors.POSITIVE} strokeWidth="4" />
        <path d="M788 430 C860 382 950 382 1020 430" fill="none" stroke={colors.SECONDARY} strokeWidth="4" />
        <text x="376" y="374" textAnchor="middle" fill={colors.POSITIVE} fontSize="13">reward future</text>
        <text x="904" y="374" textAnchor="middle" fill={colors.SECONDARY} fontSize="13">old log probabilities</text>
      </g>

      <g opacity={s.get(scene.advantagesU)}>
        <path d="M244 512 H1036" stroke={colors.WARM} strokeWidth="4" strokeDasharray="9 7" />
        <text x="640" y="548" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>driver: advantages → detached anchor → selection</text>
      </g>
      <g opacity={actor}>
        <rect x="458" y="562" width="364" height="54" rx="24" fill="#0d2a23" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="640" y="595" textAnchor="middle" fill={colors.POSITIVE} fontSize="16" fontWeight="850">actor update · 4 retained rows</text>
      </g>
    </g>

    <g opacity={compare * quiet}>
      <text x="640" y="98" textAnchor="middle" fill={colors.TEXT} fontSize="32" fontWeight="850">Matched step time in the paper</text>
      <g transform="translate(250 218)">
        <text x="0" y="0" fill={colors.MUTED} fontSize="16">GRPO + chain of thought</text>
        <rect x="0" y="28" width={690} height="62" rx="18" fill={colors.NEGATIVE} opacity="0.72" />
        <text x="714" y="68" fill={colors.NEGATIVE} fontSize="23" fontWeight="850" fontFamily={colors.font.mono}>135.6 s</text>
      </g>
      <g transform="translate(250 374)">
        <text x="0" y="0" fill={colors.MUTED} fontSize="16">OraRL</text>
        <rect x="0" y="28" width={690 * (62.4 / 135.6)} height="62" rx="18" fill={colors.POSITIVE} opacity="0.84" />
        <text x={690 * (62.4 / 135.6) + 24} y="68" fill={colors.POSITIVE} fontSize="23" fontWeight="850" fontFamily={colors.font.mono}>62.4 s</text>
      </g>
      <text x="640" y="536" textAnchor="middle" fill={colors.MUTED} fontSize="18">answer-only rollouts · sign-balanced update group</text>
    </g>

    <g opacity={close}>
      <rect x="160" y="136" width="960" height="408" rx="40" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <text x="640" y="204" textAnchor="middle" fill={colors.TEXT} fontSize="36" fontWeight="850">the annotation’s second life</text>
      {[
        { label: 'serialize', color: colors.WARM },
        { label: 'compare', color: colors.ACCENT },
        { label: 'balance', color: colors.SECONDARY },
        { label: 'reuse', color: colors.POSITIVE },
        { label: 'update', color: colors.WARM },
      ].map((item, i) => <g key={item.label} transform={`translate(${280 + i * 180} 350)`}>
        {i < 4 && <path d="M60 0 H120" stroke={colors.GRID} strokeWidth="5" />}
        <circle r="52" fill="#111827" stroke={item.color} strokeWidth="4" />
        <text y="6" textAnchor="middle" fill={item.color} fontSize="16" fontWeight="850">{item.label}</text>
      </g>)}
      <text x="640" y="478" textAnchor="middle" fill={colors.MUTED} fontSize="20">nine evaluated · four updated · one video decode</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
