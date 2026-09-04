// Grounding: arXiv:2609.02749 Sections 3.1–3.3 and Appendix A.1;
// cli/.../create-repo-skill/SKILL.md; planning-and-writing.md; verify-repo-skill/SKILL.md.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const STAGES = [
  { x: 205, label: 'scope', symbol: 'Q' },
  { x: 465, label: 'ground', symbol: 'X' },
  { x: 725, label: 'construct', symbol: 'G̃' },
  { x: 985, label: 'verify', symbol: 'G, R' },
] as const;
const EVIDENCE = [
  ['README', true], ['docs/', true], ['tests/', true], ['scripts/', true],
  ['build/', false], ['vendor/', false], ['cache/', false],
] as const;
const GRAPH = [
  { x: 725, y: 360, label: 'entry skill' },
  { x: 600, y: 490, label: 'setup' },
  { x: 725, y: 520, label: 'evaluation' },
  { x: 850, y: 490, label: 'recovery' },
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const anchorU = tl.channel('anchor', 0);
  const modeU = tl.channel('anchor forms', 0);
  const scopeU = tl.channel('capability scope', 0);
  const evidenceU = tl.channel('evidence tiles', 0);
  const filterU = tl.channel('evidence filter', 0);
  const skillU = tl.channel('three layer skill', 0);
  const graphU = tl.channel('candidate graph', 0);
  const verifyU = tl.channel('verification checks', 0);
  const gapU = tl.channel('skill gap', 0);
  const repairU = tl.channel('localized repair', 0);
  const recordU = tl.channel('construction record', 0);
  const acceptU = tl.channel('accepted graph', 0);
  const closeU = tl.channel('pipeline close', 0);

  tl.caption({ at: 0.4, dur: 5.7, text: 'Creator mode begins with an anchor: a source to distill ahead of time, or a task whose missing capabilities must be found on demand.' });
  tl.tween(anchorU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(modeU, 1, { at: 2.3, dur: 1.1, ease: ease.draw });

  tl.caption({ at: 6.5, dur: 5.7, text: 'First, scope the capabilities worth exposing. A repository directory tree is not yet a useful skill boundary.' });
  tl.tween(scopeU, 1, { at: 7.0, dur: 1.2, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 330, k: 1.02 }, { at: 8.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.6, dur: 5.8, text: 'Next, ground those capabilities in admissible evidence: source, documentation, examples, tests, configuration, and repository-owned scripts.' });
  tl.tween(cam, CAMERA_HOME, { at: 13.0, dur: 1.2, ease: ease.move });
  tl.tween(evidenceU, 7, { at: 13.2, dur: 2.4, ease: ease.enter });
  tl.tween(filterU, 1, { at: 15.8, dur: 1.2, ease: ease.draw });

  tl.caption({ at: 18.8, dur: 5.6, text: 'Generated output, vendored dependencies, caches, and unrelated internals stay outside the evidence boundary.' });
  tl.tween(filterU, 2, { at: 19.3, dur: 2.2, ease: ease.move });

  tl.caption({ at: 24.8, dur: 5.8, text: 'Construction folds the retained evidence into three layers: the entry instructions, deeper references, and executable helpers.' });
  tl.tween(evidenceU, 0, { at: 24.0, dur: 0.8, ease: ease.move });
  tl.tween(skillU, 1, { at: 25.3, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 650, y: 330, k: 1.04 }, { at: 27.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 31.0, dur: 5.8, text: 'If one source covers several workflows, a concise entry skill routes to focused component skills for setup, evaluation, diagnosis, or repair.' });
  tl.tween(skillU, 0, { at: 31.4, dur: 0.8, ease: ease.move });
  tl.tween(graphU, 1, { at: 31.5, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 34.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 37.2, dur: 5.8, text: 'Verification now attacks the candidate with assertion-backed usability cases, safe native checks, and static quality gates.' });
  tl.tween(verifyU, 1, { at: 37.8, dur: 2.0, ease: ease.linear });

  tl.caption({ at: 43.4, dur: 5.8, text: 'When a check finds a skill gap, the failing edge travels backward and only its owning skill, reference, script, or route is repaired.' });
  tl.tween(gapU, 1, { at: 43.9, dur: 1.2, ease: ease.pop });
  tl.tween(repairU, 1, { at: 45.2, dur: 2.1, ease: ease.linear });
  tl.tween(gapU, 0, { at: 47.5, dur: 0.6, ease: ease.move });

  tl.caption({ at: 49.6, dur: 5.6, text: 'Any unresolved limitation is written into construction record R instead of being smoothed over.' });
  tl.tween(recordU, 1, { at: 50.2, dur: 1.0, ease: ease.enter });

  tl.caption({ at: 55.6, dur: 6.0, text: 'Only the accepted graph G enters the library. Verification is what separates distillation from a summary.' });
  tl.tween(acceptU, 1, { at: 56.2, dur: 1.0, ease: ease.pop });
  tl.tween(closeU, 1, { at: 59.0, dur: 1.2, ease: ease.move });
  tl.hold(61.8, 1.0);

  return { tl, cam, anchorU, modeU, scopeU, evidenceU, filterU, skillU, graphU, verifyU, gapU, repairU, recordU, acceptU, closeU };
}

const scene = buildScene();

function Stage({ x, label, symbol, u, active }: { x: number; label: string; symbol: string; u: number; active: number }) {
  return <g opacity={clamp01(u)} transform={`translate(${x} 348) scale(${0.85 + 0.15 * clamp01(u)})`}>
    <circle r="57" fill={colors.PANEL} stroke={active > 0.01 ? colors.WARM : colors.ACCENT} strokeWidth={2.5 + active * 2.5} />
    <text y="-5" textAnchor="middle" fill={active > 0.01 ? colors.WARM : colors.TEXT} fontSize="27" fontWeight="850">{symbol}</text>
    <text y="82" textAnchor="middle" fill={colors.MUTED} fontSize="15" fontFamily={colors.font.mono}>{label}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const evidence = s.get(scene.evidenceU);
  const filter = s.get(scene.filterU);
  const skill = s.get(scene.skillU);
  const graph = s.get(scene.graphU);
  const verify = s.get(scene.verifyU);
  const gap = s.get(scene.gapU);
  const repair = s.get(scene.repairU);
  const close = s.get(scene.closeU);
  const stageU = [s.get(scene.scopeU), clamp01(evidence / 2), skill, verify];
  const tokenX = 205 + 780 * clamp01(verify);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="90" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">scope → ground → construct → verify</text>
      <g opacity={s.get(scene.anchorU)}>
        <rect x="80" y="112" width="182" height="72" rx="20" fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="171" y="143" textAnchor="middle" fill={colors.SECONDARY} fontSize="20" fontWeight="800">anchor z</text>
        <text x="171" y="168" textAnchor="middle" fill={colors.MUTED} fontSize="13">source or task</text>
      </g>
      <g opacity={s.get(scene.modeU)}>
        <path d="M262 148 C330 148 320 112 390 112 M262 148 C330 148 320 184 390 184" fill="none" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="404" y="118" fill={colors.TEXT} fontSize="14">task-agnostic</text>
        <text x="404" y="190" fill={colors.TEXT} fontSize="14">task-oriented</text>
      </g>
      <MathLabel tex={'z \\to Q \\to X \\to \\widetilde G \\to (G,R)'} x={810} y={150} fontSize={27} opacity={s.get(scene.anchorU)} />
      <line x1="205" y1="348" x2="985" y2="348" stroke={colors.GRID} strokeWidth="8" strokeLinecap="round" />
      {STAGES.map((stage, i) => <Stage key={stage.label} {...stage} u={Math.max(s.get(scene.anchorU) * 0.35, stageU[i])} active={i === 3 ? verify : 0} />)}

      <g opacity={clamp01(evidence / 2)}>
        {EVIDENCE.map(([label, keep], i) => {
          const u = clamp01(evidence - i);
          const rejected = !keep && filter > 1;
          const x = 330 + (i % 4) * 105;
          const y = 230 + Math.floor(i / 4) * 58;
          return <g key={label} opacity={u * (rejected ? 0.18 : 1)} transform={`translate(${x} ${y})`}>
            <rect x="-44" y="-18" width="88" height="36" rx="10" fill={colors.PANEL} stroke={keep ? colors.POSITIVE : colors.NEGATIVE} />
            <text y="5" textAnchor="middle" fill={keep ? colors.TEXT : colors.NEGATIVE} fontSize="12" fontFamily={colors.font.mono}>{label}</text>
            {rejected && <path d="M-32 -12 L32 12 M-32 12 L32 -12" stroke={colors.NEGATIVE} strokeWidth="3" />}
          </g>;
        })}
        <rect x={300 + 115 * Math.min(filter, 1)} y="202" width="350" height="132" rx="22" fill="none" stroke={colors.WARM} strokeWidth="3" strokeDasharray="9 7" opacity={clamp01(filter)} />
      </g>

      <g opacity={skill}>
        {([
          ['SKILL.md', 555, colors.WARM], ['references/', 735, colors.SECONDARY], ['scripts/', 915, colors.POSITIVE],
        ] as const).map(([label, x, color], i) => <g key={label} transform={`translate(${x + (1 - skill) * (i - 1) * 120} 240)`}>
          <rect x="-82" y="-30" width="164" height="60" rx="15" fill={colors.PANEL} stroke={color} strokeWidth="2.5" />
          <text y="6" textAnchor="middle" fill={color} fontSize="17" fontWeight="750" fontFamily={colors.font.mono}>{label}</text>
        </g>)}
      </g>

      <g opacity={graph}>
        {GRAPH.slice(1).map((n, i) => <line key={`edge-${i}`} x1={GRAPH[0].x} y1={GRAPH[0].y + 40} x2={n.x} y2={n.y - 28} stroke={gap > 0 && i === 2 ? colors.NEGATIVE : colors.SECONDARY} strokeWidth="3" opacity={clamp01(graph * 3 - i)} />)}
        {GRAPH.map((n, i) => <g key={n.label} opacity={clamp01(graph * 4 - i)}>
          <rect x={n.x - 68} y={n.y - 28} width="136" height="56" rx="16" fill={colors.PANEL} stroke={i === 0 ? colors.WARM : colors.ACCENT} strokeWidth="2.5" />
          <text x={n.x} y={n.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize="15">{n.label}</text>
        </g>)}
      </g>

      {verify > 0 && <g opacity={verify}>
        <circle cx={tokenX} cy="348" r="11" fill={gap > 0 ? colors.NEGATIVE : colors.WARM} />
        {['usability', 'native', 'static'].map((label, i) => <g key={label} transform={`translate(${902 + i * 98} 245)`} opacity={clamp01(verify * 3 - i)}>
          <rect x="-42" y="-18" width="84" height="36" rx="12" fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="12">{label}</text>
        </g>)}
      </g>}
      <g opacity={gap}>
        <rect x="945" y="452" width="225" height="62" rx="18" fill="#2a1720" stroke={colors.NEGATIVE} strokeWidth="3" />
        <text x="1058" y="480" textAnchor="middle" fill={colors.NEGATIVE} fontSize="17" fontWeight="800" fontFamily={colors.font.mono}>SKILL_GAP</text>
        <text x="1058" y="500" textAnchor="middle" fill={colors.MUTED} fontSize="12">unsupported recovery edge</text>
      </g>
      {repair > 0 && <path d={`M 1050 450 C ${980 - 180 * repair} ${560 + 40 * Math.sin(repair * Math.PI)} ${850 - 120 * repair} ${488 + 2 * repair}`} fill="none" stroke={colors.WARM} strokeWidth="5" strokeDasharray="10 8" opacity={repair} />}
      <g opacity={s.get(scene.recordU)} transform="translate(1080 560)">
        <rect x="-108" y="-30" width="216" height="60" rx="16" fill={colors.PANEL} stroke={colors.WARM} />
        <text y="-3" textAnchor="middle" fill={colors.WARM} fontSize="16" fontWeight="800">record R</text>
        <text y="19" textAnchor="middle" fill={colors.MUTED} fontSize="12">evidence · checks · gaps</text>
      </g>
      <g opacity={s.get(scene.acceptU)} transform="translate(985 348)">
        <circle r="69" fill="none" stroke={colors.POSITIVE} strokeWidth="7" />
        <text y="6" textAnchor="middle" fill={colors.POSITIVE} fontSize="18" fontWeight="900">ACCEPTED</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="210" y="148" width="860" height="390" rx="42" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="228" textAnchor="middle" fill={colors.TEXT} fontSize="39" fontWeight="850">distillation is a gate, not a summary</text>
      <MathLabel tex={'z \\xrightarrow{scope} Q \\xrightarrow{ground} X \\xrightarrow{construct} \\widetilde G \\xrightarrow{verify} (G,R)'} x={640} y={340} fontSize={27} opacity={close} />
      <text x="640" y="435" textAnchor="middle" fill={colors.POSITIVE} fontSize="22">accepted graph + inspectable record</text>
      <text x="640" y="480" textAnchor="middle" fill={colors.MUTED} fontSize="16">unsupported claims travel backward</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
