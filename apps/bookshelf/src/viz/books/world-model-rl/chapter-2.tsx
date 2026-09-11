// Grounding: arXiv:2608.12564 Sections 3.2–3.3; official WMRL files
// ml_research/world_model/server.py, ml_research/world_model/prompts.py,
// ml_research/cluster/train_entry.py, wmrl/anchor.py, and wmrl/scorer.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const SCORES = [0.18, 0.42, 0.31, 0.67, 0.56, 0.74, 0.49, 0.86];
const ANCHORS = [2, 6];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const fieldU = tl.channel('experiment groups', 0);
  const interfaceU = tl.channel('shared grade interface', 0);
  const lensU = tl.channel('world model lens', 0);
  const batchU = tl.channel('continuous batch', 0);
  const scoreU = tl.channel('predicted score ribbons', 0);
  const backboneU = tl.channel('same backbone', 0);
  const anchorU = tl.channel('anchor selection', 0);
  const splitU = tl.channel('paired grading', 0);
  const pairU = tl.channel('score pairs', 0);
  const budgetU = tl.channel('anchor budget', 0);
  const errorU = tl.channel('bias and noise', 0);
  const closeU = tl.channel('closing pair', 0);
  const pulse = tl.channel('flow pulse', 0);
  tl.tween(pulse, 1, { at: 0, dur: 68, ease: ease.linear });

  tl.caption({ at: 0.4, dur: 5.6, text: 'Keep the same experiments, but replace the expensive grader with a model that predicts what execution would return.' });
  tl.tween(fieldU, 1, { at: 0.8, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 390, y: 340, k: 1.06 }, { at: 2.2, dur: 1.3, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.6, text: 'The released service keeps the same health check and grade request contract as the real sandbox.' });
  tl.tween(interfaceU, 1, { at: 6.9, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 9.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.6, text: 'Instead of running code, it reads the task and solution, then predicts the execution outcome as structured data.' });
  tl.tween(lensU, 1, { at: 12.9, dur: 1.0, ease: ease.pop });
  tl.tween(batchU, 1, { at: 14.0, dur: 3.0, ease: ease.linear });

  tl.caption({ at: 18.4, dur: 5.6, text: 'Many grade requests enter one asynchronous engine, where continuous batching turns the old queue into shared inference.' });
  tl.tween(scoreU, 1, { at: 19.0, dur: 2.8, ease: ease.linear });
  tl.tween(cam, { x: 810, y: 330, k: 1.08 }, { at: 20.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.6, text: 'At each scale, the world model uses the same frozen backbone as the agent. No stronger teacher supplies the answers.' });
  tl.tween(backboneU, 1, { at: 25.0, dur: 0.7, ease: ease.enter });

  tl.caption({ at: 30.4, dur: 5.6, text: 'Fast prediction is not truth, so the scheduler still buys a small stream of real outcomes.' });
  tl.tween(cam, CAMERA_HOME, { at: 30.8, dur: 1.3, ease: ease.move });
  tl.tween(anchorU, 1, { at: 31.2, dur: 1.2, ease: ease.pop });

  tl.caption({ at: 36.4, dur: 5.6, text: 'The nine-billion-parameter recipe anchors two groups per step. Those groups visit both graders.' });
  tl.tween(splitU, 1, { at: 36.9, dur: 2.4, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.6, text: 'Each anchored trajectory yields a pair: what the world model predicted and what the sandbox measured.' });
  tl.tween(pairU, 1, { at: 43.0, dur: 2.0, ease: ease.draw });
  tl.tween(cam, { x: 880, y: 430, k: 1.08 }, { at: 44.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 48.4, dur: 5.6, text: 'A concurrency cap of twenty-four prevents that trusted stream from swallowing the very capacity the method is saving.' });
  tl.tween(cam, CAMERA_HOME, { at: 47.2, dur: 1.2, ease: ease.move });
  tl.tween(budgetU, 1, { at: 49.0, dur: 1.4, ease: ease.draw });

  tl.caption({ at: 54.4, dur: 5.6, text: 'Now the cheap scores are abundant and the real scores are scarce, but the pairs reveal both offset and jitter.' });
  tl.tween(errorU, 1, { at: 55.0, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 56.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 60.4, dur: 6.2, text: 'Those paired grades are the anchor signal. Every correction in the method is learned from that thin line of ground truth.' });
  tl.tween(closeU, 1, { at: 61.0, dur: 1.3, ease: ease.move });
  tl.hold(66.8, 1.0);

  return { tl, cam, fieldU, interfaceU, lensU, batchU, scoreU, backboneU, anchorU, splitU, pairU, budgetU, errorU, closeU, pulse };
}

const scene = buildScene();

function GroupRow({ i, u, anchor, split }: { i: number; u: number; anchor: number; split: number }) {
  return <g transform={`translate(110 ${150 + i * 50})`} opacity={u}>
    <text x="-22" y="5" textAnchor="end" fill={anchor ? colors.WARM : colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>G{i + 1}</text>
    {Array.from({ length: 8 }, (_, j) => <circle key={j} cx={j * 38} r={6} fill={anchor ? colors.WARM : colors.ACCENT} opacity={0.45 + 0.55 * u} />)}
    {anchor > 0 && <rect x="-14" y="-16" width="294" height="32" rx="14" fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={anchor} />}
    {split > 0 && <path d={`M292 0 C350 0 350 ${anchor ? 54 : 0} 410 ${anchor ? 54 : 0}`} fill="none" stroke={colors.WARM} strokeWidth="2.5" opacity={anchor * split} />}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const anchor = s.get(scene.anchorU);
  const split = s.get(scene.splitU);
  const score = s.get(scene.scoreU);
  const error = s.get(scene.errorU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="68" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">a grader that imagines</text>
      <rect x="66" y="105" width="365" height="446" rx="30" fill="#101827" stroke={colors.GRID} strokeWidth="2" opacity={s.get(scene.fieldU)} />
      {Array.from({ length: 8 }, (_, i) => <GroupRow key={i} i={i} u={clamp01(s.get(scene.fieldU) * 2 - i / 8)} anchor={ANCHORS.includes(i) ? anchor : 0} split={split} />)}

      <g opacity={s.get(scene.interfaceU)}>
        <rect x="456" y="106" width="230" height="48" rx="18" fill="#12243a" stroke={colors.ACCENT} strokeWidth="2" />
        <text x="571" y="135" textAnchor="middle" fill={colors.ACCENT} fontSize="13" fontFamily={colors.font.mono}>POST /grade · same contract</text>
      </g>

      <g opacity={s.get(scene.lensU)}>
        <ellipse cx="615" cy="325" rx="78" ry="166" fill="#261d36" stroke={colors.SECONDARY} strokeWidth="4" />
        <ellipse cx="615" cy="325" rx="46" ry="125" fill="none" stroke={colors.SECONDARY} strokeWidth="2" opacity="0.5" />
        <text x="615" y="315" textAnchor="middle" fill={colors.SECONDARY} fontSize="15" fontWeight="800">WORLD</text>
        <text x="615" y="338" textAnchor="middle" fill={colors.SECONDARY} fontSize="15" fontWeight="800">MODEL</text>
        <text x="615" y="369" textAnchor="middle" fill={colors.MUTED} fontSize="10">predicts outcome</text>
      </g>

      <g opacity={s.get(scene.batchU)}>
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M430 ${150 + i * 50} C505 ${150 + i * 50} 515 ${265 + (i % 3) * 60} 540 ${265 + (i % 3) * 60}`} fill="none" stroke={colors.ACCENT} strokeWidth="2" strokeDasharray="8 7" strokeDashoffset={-50 * s.get(scene.pulse)} />)}
      </g>

      <g opacity={score}>
        <rect x="720" y="112" width="465" height="438" rx="30" fill="#111a2a" stroke={colors.GRID} strokeWidth="2" />
        <text x="952" y="142" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>predicted score r̂ · continuous batch</text>
        {SCORES.map((v, i) => <g key={i} transform={`translate(760 ${174 + i * 43})`}>
          <rect width="360" height="18" rx="9" fill="#172236" />
          <rect width={360 * v * clamp01(score * 1.8 - i / 12)} height="18" rx="9" fill={ANCHORS.includes(i) ? colors.WARM : colors.SECONDARY} />
          <text x="380" y="14" fill={colors.TEXT} fontSize="11" fontFamily={colors.font.mono}>{v.toFixed(2)}</text>
          {error > 0 && <line x1={360 * v} y1="-5" x2={360 * v + (i % 2 ? 22 : -16) * error} y2="23" stroke={colors.NEGATIVE} strokeWidth="2" />}
        </g>)}
      </g>

      <g opacity={s.get(scene.backboneU)}>
        <rect x="490" y="526" width="250" height="48" rx="18" fill="#211d31" stroke={colors.SECONDARY} />
        <text x="615" y="547" textAnchor="middle" fill={colors.SECONDARY} fontSize="12" fontFamily={colors.font.mono}>WM_MODEL = agent base model</text>
        <text x="615" y="565" textAnchor="middle" fill={colors.MUTED} fontSize="10">frozen · prompted · no distillation</text>
      </g>

      <g opacity={s.get(scene.pairU)}>
        {ANCHORS.map((i, k) => <g key={i} transform={`translate(${825 + k * 230} 455)`}>
          <circle cx="-38" r="15" fill={colors.SECONDARY} /><circle cx="38" r="15" fill={colors.WARM} />
          <path d="M-20 0 H20" stroke={colors.TEXT} strokeWidth="3" />
          <text x="-38" y="4" textAnchor="middle" fill={colors.BG} fontSize="9">r̂</text><text x="38" y="4" textAnchor="middle" fill={colors.BG} fontSize="9">r</text>
          <text y="31" textAnchor="middle" fill={colors.MUTED} fontSize="10">anchor pair {k + 1}</text>
        </g>)}
      </g>

      <g opacity={s.get(scene.budgetU)}>
        <path d="M86 454 H430" stroke="#202c40" strokeWidth="18" strokeLinecap="round" />
        <path d="M86 454 H344" stroke={colors.WARM} strokeWidth="18" strokeLinecap="round" />
        <text x="258" y="484" textAnchor="middle" fill={colors.WARM} fontSize="11" fontFamily={colors.font.mono}>anchor_concurrency_cap: 24</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="220" y="135" width="840" height="410" rx="48" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <text x="640" y="225" textAnchor="middle" fill={colors.TEXT} fontSize="42" fontWeight="850">the anchor signal</text>
      <g transform="translate(405 360)"><circle r="74" fill="#251d34" stroke={colors.SECONDARY} strokeWidth="4" /><text y="-5" textAnchor="middle" fill={colors.SECONDARY} fontSize="15">predicted</text><text y="20" textAnchor="middle" fill={colors.MUTED} fontSize="12">fast · abundant</text></g>
      <path d="M483 360 H797" stroke={colors.TEXT} strokeWidth="4" />
      {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={530 + i * 55} cy="360" r="7" fill={i % 2 ? colors.WARM : colors.SECONDARY} />)}
      <g transform="translate(875 360)"><circle r="74" fill="#2c2111" stroke={colors.WARM} strokeWidth="4" /><text y="-5" textAnchor="middle" fill={colors.WARM} fontSize="15">measured</text><text y="20" textAnchor="middle" fill={colors.MUTED} fontSize="12">slow · trusted</text></g>
      <text x="640" y="488" textAnchor="middle" fill={colors.MUTED} fontSize="17">paired grades reveal the model's error</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
