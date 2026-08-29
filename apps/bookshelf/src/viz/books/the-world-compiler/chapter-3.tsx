// Grounding: paper section 5 and appendix protocol; agentic_artifacts/
// ARTIFACT_POLICY.md; schemas/REVIEWER_SCORE_SCHEMA.md; manifest_summary.json.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const FIELDS = [
  { key: 'b', label: 'intent', color: colors.ACCENT },
  { key: 'oₜ', label: 'object id', color: colors.WARM },
  { key: 'sₜ', label: 'state', color: colors.SECONDARY },
  { key: 'aₜ', label: 'action', color: colors.ACCENT },
  { key: 'gₜ', label: 'engine output', color: colors.WARM },
  { key: 'vₜ', label: 'rendered evidence', color: colors.TEAL },
  { key: 'hₜ', label: 'human review', color: colors.NEGATIVE },
  { key: 'ρₜ', label: 'repair link', color: colors.POSITIVE },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const flatU = tl.channel('accepted image only', 0);
  const tapeP = tl.channel('trajectory tuple fields', 0);
  const objectU = tl.channel('stable object identity', 0);
  const evidenceU = tl.channel('engine and render evidence', 0);
  const rejectU = tl.channel('human rejection', 0);
  const repairP = tl.channel('repair link rewind', 0);
  const compileU = tl.channel('compiled training forms', 0);
  const boundaryU = tl.channel('public release boundary', 0);
  const close = tl.channel('keep the repair', 0);

  tl.caption({ at: 0.4, dur: 6.0, text: 'If training keeps only the accepted screenshot, it throws away the decisions that made the scene work.' });
  tl.tween(flatU, 1, { at: 0.9, dur: 1.0, ease: ease.enter });

  tl.caption({ at: 6.4, dur: 6.3, text: 'The paper stores each development step as a structured tuple, so intent, state, action, evidence, and review stay together.' });
  tl.tween(tapeP, FIELDS.length, { at: 6.9, dur: 4.1, ease: ease.enter });
  tl.tween(cam, { x: 620, y: 248, k: 1.06 }, { at: 9.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.7, dur: 6.2, text: 'A stable object identifier follows the same asset across states, instead of losing it between screenshots.' });
  tl.tween(objectU, 1, { at: 13.2, dur: 1.3, ease: ease.draw });
  tl.tween(cam, { x: 294, y: 322, k: 1.16 }, { at: 14.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.9, dur: 6.2, text: 'Engine output and rendered evidence attach to that exact step, giving the learner both a diagnosis and what the developer saw.' });
  tl.tween(evidenceU, 1, { at: 19.4, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 750, y: 322, k: 1.12 }, { at: 21.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 25.1, dur: 6.2, text: 'A rejection remains in the record. It is useful supervision, not a mistake to delete from the dataset.' });
  tl.tween(rejectU, 1, { at: 25.6, dur: 0.6, ease: ease.pop });

  tl.caption({ at: 31.3, dur: 6.3, text: 'The repair link folds that rejection back to the object and action that caused it, then points forward to the corrected state.' });
  tl.tween(repairP, 1, { at: 31.9, dur: 2.2, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 34.1, dur: 1.2, ease: ease.move });

  tl.caption({ at: 37.6, dur: 6.3, text: 'Accepted endings become targets, failed steps become critiques, and linked repairs become recovery examples.' });
  tl.tween(compileU, 1, { at: 38.2, dur: 1.5, ease: ease.move });

  tl.caption({ at: 43.9, dur: 6.5, text: 'The public package keeps sanitized metrics, manifests, and provenance, while deliberately excluding raw prompts and reviewer traces.' });
  tl.tween(boundaryU, 1, { at: 44.5, dur: 1.3, ease: ease.draw });
  tl.tween(close, 1, { at: 48.3, dur: 1.0, ease: ease.move });
  tl.hold(50.6, 1.0);

  return { tl, cam, flatU, tapeP, objectU, evidenceU, rejectU, repairP, compileU, boundaryU, close };
}

const scene = buildScene();
const fieldX = (i: number) => 104 + i * 145;

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const tapeP = s.get(scene.tapeP);
  const objectU = s.get(scene.objectU);
  const evidence = s.get(scene.evidenceU);
  const reject = s.get(scene.rejectU);
  const repair = s.get(scene.repairP);
  const compile = s.get(scene.compileU);
  const boundary = s.get(scene.boundaryU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="72" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">A useful trajectory keeps the failure</text>

      <g opacity={s.get(scene.flatU) * (1 - clamp01(tapeP))}>
        <rect x="390" y="128" width="500" height="330" rx="34" fill="#111d30" stroke={colors.ACCENT} strokeWidth="3" />
        <path d="M430 394 H850 M468 394 V236 M622 394 V276 M752 394 V214" stroke={colors.WARM} strokeWidth="14" strokeLinecap="round" />
        <circle cx="806" cy="288" r="38" fill={colors.SECONDARY} opacity="0.75" />
        <rect x="512" y="184" width="206" height="48" rx="24" fill="#102a22" stroke={colors.POSITIVE} />
        <text x="615" y="214" textAnchor="middle" fill={colors.POSITIVE} fontSize="15">accepted screenshot</text>
        <text x="640" y="506" textAnchor="middle" fill={colors.NEGATIVE} fontSize="17">the repair history is gone</text>
      </g>

      <MathLabel tex={'u_t=(b,o_t,s_t,a_t,g_t,v_t,h_t,\\rho_t)'} x={640} y={118} fontSize={24} opacity={clamp01(tapeP)} />
      <g>
        <path d="M74 234 H1206" stroke={colors.GRID} strokeWidth="8" strokeLinecap="round" opacity={clamp01(tapeP)} />
        {FIELDS.map((field, i) => {
          const u = clamp01(tapeP - i);
          const hi = field.key === 'oₜ' ? objectU : (field.key === 'gₜ' || field.key === 'vₜ') ? evidence : field.key === 'hₜ' ? reject : field.key === 'ρₜ' ? repair : 0;
          return <g key={field.key} opacity={u} transform={`translate(${fieldX(i)} 234) translate(0 ${(1 - u) * 30}) scale(${0.82 + u * 0.18 + hi * 0.06})`}>
            <rect x="-57" y="-50" width="114" height="100" rx="22" fill={field.color} fillOpacity={0.13 + hi * 0.1} stroke={field.color} strokeWidth={2 + hi * 2} />
            <text y="-8" textAnchor="middle" fill={field.color} fontSize="25" fontWeight="850">{field.key}</text>
            <text y="23" textAnchor="middle" fill={colors.TEXT} fontSize="11">{field.label}</text>
          </g>;
        })}
      </g>

      <g opacity={objectU}>
        <path d="M249 290 V388 H438" fill="none" stroke={colors.WARM} strokeWidth="5" strokeDasharray="9 7" />
        <rect x="438" y="352" width="226" height="72" rx="20" fill="#251d0f" stroke={colors.WARM} strokeWidth="3" />
        <text x="551" y="382" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>objectId: phone_booth_07</text>
        <text x="551" y="407" textAnchor="middle" fill={colors.MUTED} fontSize="12">same object across states</text>
      </g>

      <g opacity={evidence}>
        <rect x="676" y="338" width="226" height="102" rx="22" fill="#211b10" stroke={colors.WARM} strokeWidth="3" />
        <text x="789" y="368" textAnchor="middle" fill={colors.WARM} fontSize="12" fontFamily={colors.font.mono}>gₜ: asset_overlap</text>
        <rect x="926" y="338" width="214" height="102" rx="22" fill="#10262a" stroke={colors.TEAL} strokeWidth="3" />
        <path d="M958 406 H1108 M980 406 V366 M1032 406 V380" stroke={colors.TEAL} strokeWidth="7" strokeLinecap="round" />
        <text x="1033" y="458" textAnchor="middle" fill={colors.TEAL} fontSize="12" fontFamily={colors.font.mono}>vₜ: rendered evidence</text>
      </g>

      <g opacity={reject * (1 - boundary) * (1 - compile)} transform="translate(956 458)">
        <rect x="-154" y="-34" width="308" height="68" rx="22" fill="#32141c" stroke={colors.NEGATIVE} strokeWidth="4" />
        <text textAnchor="middle" y="-5" fill={colors.NEGATIVE} fontSize="15" fontWeight="800">REJECT · preserve this step</text>
        <text textAnchor="middle" y="20" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>hₜ = revise placement</text>
      </g>

      {repair > 0 && <g opacity={repair * (1 - boundary) * (1 - compile)}>
        <path d={`M${fieldX(7)} 286 C${1120 - repair * 420} ${570 - repair * 170}, ${600 - repair * 210} ${570 - repair * 120}, ${fieldX(1)} 292`} fill="none" stroke={colors.POSITIVE} strokeWidth="6" strokeDasharray="12 9" />
        <circle cx={fieldX(7) - repair * (fieldX(7) - fieldX(1))} cy={286 + Math.sin(repair * Math.PI) * 170} r="12" fill={colors.POSITIVE} />
        <text x="638" y="488" textAnchor="middle" fill={colors.POSITIVE} fontSize="13" fontFamily={colors.font.mono}>ρₜ links failure → object → repair</text>
      </g>}

      <g opacity={compile * (1 - boundary)}>
        {[
          { x: 258, title: 'accepted state', sub: 'generation target', color: colors.POSITIVE },
          { x: 550, title: 'failed step', sub: 'critique example', color: colors.NEGATIVE },
          { x: 842, title: 'linked repair', sub: 'recovery example', color: colors.WARM },
        ].map((card) => <g key={card.title} transform={`translate(${card.x} 466) translate(0 ${(1 - compile) * 24})`}>
          <rect x="-124" y="-30" width="248" height="60" rx="20" fill={card.color} fillOpacity="0.12" stroke={card.color} strokeWidth="2" />
          <text textAnchor="middle" y="-4" fill={card.color} fontSize="14" fontWeight="780">{card.title}</text>
          <text textAnchor="middle" y="18" fill={colors.MUTED} fontSize="11">{card.sub}</text>
        </g>)}
      </g>

      <g opacity={boundary}>
        <rect x="80" y="266" width="1118" height="234" rx="32" fill={colors.BG} fillOpacity="0.96" stroke={colors.ACCENT} strokeWidth="4" />
        <line x1="640" y1="284" x2="640" y2="478" stroke={colors.GRID} strokeWidth="3" />
        <text x="360" y="308" textAnchor="middle" fill={colors.POSITIVE} fontSize="18" fontWeight="800">PUBLIC RELEASE KEEPS</text>
        <text x="920" y="308" textAnchor="middle" fill={colors.NEGATIVE} fontSize="18" fontWeight="800">PUBLIC RELEASE EXCLUDES</text>
        {['aggregate metric tables', 'split and feature manifests', 'sanitized reviewer scores', 'provenance and checkpoint pointers'].map((label, i) => <text key={label} x="158" y={348 + i * 36} fill={colors.TEXT} fontSize="14">✓ {label}</text>)}
        {['raw interactive prompts', 'reviewer prompt templates', 'raw reviewer responses', 'worker traces and render dumps'].map((label, i) => <text key={label} x="718" y={348 + i * 36} fill={colors.MUTED} fontSize="14">— {label}</text>)}
      </g>
    </g>

    <g opacity={close}>
      <rect x="196" y="126" width="888" height="430" rx="42" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="204" textAnchor="middle" fill={colors.TEXT} fontSize="41" fontWeight="850">keep the repair</text>
      <path d="M296 350 H984" stroke={colors.GRID} strokeWidth="9" strokeLinecap="round" />
      {[
        { x: 334, text: 'intent', color: colors.ACCENT },
        { x: 486, text: 'failure', color: colors.NEGATIVE },
        { x: 638, text: 'review', color: colors.SECONDARY },
        { x: 790, text: 'repair', color: colors.WARM },
        { x: 942, text: 'accept', color: colors.POSITIVE },
      ].map((n) => <g key={n.text} transform={`translate(${n.x} 350)`}><circle r="28" fill={colors.BG} stroke={n.color} strokeWidth="5" /><text y="58" textAnchor="middle" fill={n.color} fontSize="14">{n.text}</text></g>)}
      <path d="M790 316 C730 240 536 240 486 316" fill="none" stroke={colors.WARM} strokeWidth="6" strokeDasharray="12 8" />
      <text x="640" y="500" textAnchor="middle" fill={colors.MUTED} fontSize="17">failure is training data when identity and provenance survive</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
