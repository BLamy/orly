// Grounding: arXiv:2609.02749 Sections 1–2, Equations 1–4; AREX-Skill README.md.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const FIELD = [
  [0, 1, 0, 2, 0, 1, 0],
  [1, 0, 2, 0, 1, 0, 2],
  [0, 2, 0, 1, 0, 2, 0],
  [2, 0, 1, 0, 2, 0, 1],
];
const UNGUIDED = [
  [250, 384], [360, 300], [470, 468], [582, 300], [694, 468], [805, 300], [916, 468], [1030, 384],
] as const;
const GUIDED = [
  [250, 384], [382, 384], [514, 384], [646, 384], [778, 384], [910, 384], [1030, 384],
] as const;

function pointOnPath(path: readonly (readonly [number, number])[], u: number) {
  const p = clamp01(u) * (path.length - 1);
  const i = Math.min(path.length - 2, Math.floor(p));
  const f = p - i;
  return { x: path[i][0] + (path[i + 1][0] - path[i][0]) * f, y: path[i][1] + (path[i + 1][1] - path[i][1]) * f };
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const stackU = tl.channel('model and harness', 0);
  const fieldU = tl.channel('decision field', 0);
  const unknownU = tl.channel('unknown choices', 0);
  const wanderU = tl.channel('unguided path', 0);
  const budget = tl.channel('remaining budget', 1);
  const missingU = tl.channel('missing layer', 0);
  const knowledgeU = tl.channel('operational knowledge', 0);
  const skillU = tl.channel('skill card', 0);
  const guidedU = tl.channel('guided path', 0);
  const finishU = tl.channel('verified result', 0);
  const closeU = tl.channel('controlled close', 0);
  const flowU = tl.channel('route motion', 0);

  // Keep the route itself gently alive across narration holds. This is part of
  // the visual argument—the agent is still spending budget while it searches.
  tl.tween(flowU, 1, { at: 0, dur: 57.2, ease: ease.linear });

  tl.caption({ at: 0.4, dur: 5.8, text: 'An autonomous research agent already has two engines: a model that reasons, and a harness that plans, runs tools, remembers, and checks.' });
  tl.tween(stackU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 300, y: 330, k: 1.05 }, { at: 3.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 6.6, dur: 5.8, text: 'An unfamiliar machine-learning task still asks practical questions: which method, package, settings, and failure checks actually fit?' });
  tl.tween(cam, CAMERA_HOME, { at: 7.0, dur: 1.3, ease: ease.move });
  tl.tween(fieldU, 1, { at: 7.4, dur: 1.3, ease: ease.draw });
  tl.tween(unknownU, 1, { at: 9.2, dur: 1.0, ease: ease.enter });

  tl.caption({ at: 12.8, dur: 5.8, text: 'Without that know-how, the task wanders through trials, discovers a dead end, and pays again.' });
  tl.tween(wanderU, 1, { at: 13.2, dur: 4.6, ease: ease.linear });
  tl.tween(budget, 0.22, { at: 13.2, dur: 4.6, ease: ease.linear });

  tl.caption({ at: 19.0, dur: 5.8, text: 'The paper names the missing layer operational knowledge: guidance that turns domain facts into actions.' });
  tl.tween(missingU, 1, { at: 19.5, dur: 1.1, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 330, k: 1.05 }, { at: 21.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 25.2, dur: 5.8, text: 'Add K to the agent. It carries both capability and the policy for choosing and using that capability.' });
  tl.tween(knowledgeU, 1, { at: 25.8, dur: 1.3, ease: ease.enter });

  tl.caption({ at: 31.4, dur: 5.8, text: 'A skill makes that knowledge portable: an entry point, deeper references, and executable helpers that open only when needed.' });
  tl.tween(skillU, 1, { at: 32.0, dur: 1.2, ease: ease.move });
  tl.tween(unknownU, 0.12, { at: 34.2, dur: 1.0, ease: ease.move });

  tl.caption({ at: 37.6, dur: 5.8, text: 'Now run the same task with the same model and harness. The relevant operating context lights a route before the expensive experiment begins.' });
  tl.tween(cam, CAMERA_HOME, { at: 38.0, dur: 1.3, ease: ease.move });
  tl.tween(guidedU, 1, { at: 38.8, dur: 3.8, ease: ease.linear });
  tl.tween(budget, 0.84, { at: 38.8, dur: 3.8, ease: ease.move });

  tl.caption({ at: 43.8, dur: 5.6, text: 'The token reaches a verified result with more of its execution budget intact.' });
  tl.tween(finishU, 1, { at: 44.4, dur: 0.7, ease: ease.pop });

  tl.caption({ at: 49.8, dur: 6.2, text: 'That makes the idea testable: hold the backbone, harness, and budget steady, then change only the operating context.' });
  tl.tween(closeU, 1, { at: 50.5, dur: 1.2, ease: ease.move });
  tl.hold(56.2, 1.0);

  return { tl, cam, stackU, fieldU, unknownU, wanderU, budget, missingU, knowledgeU, skillU, guidedU, finishU, closeU, flowU };
}

const scene = buildScene();

function AgentBlock({ x, label, sublabel, u, color }: { x: number; label: string; sublabel: string; u: number; color: string }) {
  const k = 0.82 + 0.18 * clamp01(u);
  return <g transform={`translate(${x} 170) scale(${k})`} opacity={clamp01(u)}>
    <rect x="-92" y="-44" width="184" height="88" rx="24" fill={colors.PANEL} stroke={color} strokeWidth="3" />
    <text y="-5" textAnchor="middle" fill={color} fontSize="22" fontWeight="800">{label}</text>
    <text y="22" textAnchor="middle" fill={colors.MUTED} fontSize="13">{sublabel}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const field = s.get(scene.fieldU);
  const unknown = s.get(scene.unknownU);
  const wander = s.get(scene.wanderU);
  const guided = s.get(scene.guidedU);
  const close = s.get(scene.closeU);
  const wp = pointOnPath(UNGUIDED, wander);
  const gp = pointOnPath(GUIDED, guided);
  const guidedPath = GUIDED.map(([x, y]) => `${x},${y}`).join(' ');
  const unguidedPath = UNGUIDED.map(([x, y]) => `${x},${y}`).join(' ');
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="90" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">what does the agent know before it starts?</text>
      <AgentBlock x={160} label="Mθ" sublabel="reason · plan · act" u={s.get(scene.stackU)} color={colors.SECONDARY} />
      <AgentBlock x={380} label="H" sublabel="tools · memory · checks" u={s.get(scene.stackU)} color={colors.ACCENT} />
      <g opacity={s.get(scene.missingU)}>
        <rect x="492" y="126" width="184" height="88" rx="24" fill="#241d10" stroke={colors.WARM} strokeWidth="3" strokeDasharray="8 7" />
        <text x="584" y="165" textAnchor="middle" fill={colors.WARM} fontSize="22" fontWeight="800">K ?</text>
        <text x="584" y="192" textAnchor="middle" fill={colors.MUTED} fontSize="13">operating context</text>
      </g>
      <g opacity={s.get(scene.knowledgeU)}>
        <rect x="492" y="126" width="184" height="88" rx="24" fill="#10251f" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="584" y="165" textAnchor="middle" fill={colors.POSITIVE} fontSize="22" fontWeight="800">K</text>
        <text x="584" y="192" textAnchor="middle" fill={colors.TEXT} fontSize="13">capability + usage policy</text>
      </g>
      <MathLabel tex={'A=(M_\\theta,H)'} x={830} y={150} fontSize={27} opacity={s.get(scene.stackU) * (1 - s.get(scene.knowledgeU))} />
      <MathLabel tex={'A_{res}=(M_\\theta,H,K)'} x={865} y={150} fontSize={27} opacity={s.get(scene.knowledgeU)} />

      <g opacity={field}>
        <rect x="190" y="254" width="900" height="270" rx="34" fill={colors.PANEL} stroke={colors.GRID} strokeWidth="2" />
        {FIELD.flatMap((row, r) => row.map((kind, c) => <g key={`${r}-${c}`} opacity={0.25 + unknown * 0.7}>
          <rect x={280 + c * 112} y={282 + r * 58} width="78" height="38" rx="12" fill={kind === 0 ? '#152234' : kind === 1 ? '#2b1c28' : '#25210f'} stroke={kind === 0 ? colors.ACCENT : kind === 1 ? colors.NEGATIVE : colors.WARM} />
          <text x={319 + c * 112} y={307 + r * 58} textAnchor="middle" fill={colors.TEXT} fontSize="13">{['method', 'package', 'setting'][kind]}</text>
        </g>))}
        <text x="218" y="390" fill={colors.ACCENT} fontSize="14" fontFamily={colors.font.mono}>task τ</text>
        <text x="1058" y="390" textAnchor="end" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>goal g</text>
        <polyline points={unguidedPath} fill="none" stroke={colors.NEGATIVE} strokeWidth="5" strokeDasharray="9 9" strokeDashoffset={-28 * s.get(scene.flowU)} opacity={wander * (1 - guided) * 0.9} />
        <polyline points={guidedPath} fill="none" stroke={colors.POSITIVE} strokeWidth="7" strokeLinecap="round" strokeDasharray="18 8" strokeDashoffset={-28 * s.get(scene.flowU)} opacity={guided * 0.95} />
        {wander > 0 && guided < 0.01 && <circle cx={wp.x} cy={wp.y} r="13" fill={colors.NEGATIVE} />}
        {guided > 0 && <circle cx={gp.x} cy={gp.y} r="13" fill={colors.POSITIVE} />}
        <g transform="translate(640 548)">
          <rect x="-230" y="-16" width="460" height="24" rx="12" fill="#1b2231" />
          <rect x="-230" y="-16" width={460 * s.get(scene.budget)} height="24" rx="12" fill={s.get(scene.budget) < 0.4 ? colors.NEGATIVE : colors.POSITIVE} />
          <text y="32" textAnchor="middle" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>execution budget</text>
        </g>
      </g>
      <g opacity={s.get(scene.skillU)} transform={`translate(965 215) rotate(${-4 + 4 * s.get(scene.skillU)})`}>
        <rect x="-105" y="-53" width="210" height="106" rx="18" fill="#13281f" stroke={colors.POSITIVE} strokeWidth="3" />
        <text y="-18" textAnchor="middle" fill={colors.POSITIVE} fontSize="21" fontWeight="800">SKILL.md</text>
        <text y="10" textAnchor="middle" fill={colors.TEXT} fontSize="13">references/</text>
        <text y="32" textAnchor="middle" fill={colors.TEXT} fontSize="13">scripts/</text>
      </g>
      <g opacity={s.get(scene.finishU)} transform="translate(1058 384)">
        <circle r={24 + 8 * s.get(scene.finishU)} fill="#102a22" stroke={colors.POSITIVE} strokeWidth="4" />
        <path d="M-11 0 L-2 9 L14 -11" fill="none" stroke={colors.POSITIVE} strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
    <g opacity={close}>
      <rect x="230" y="145" width="820" height="390" rx="42" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="230" textAnchor="middle" fill={colors.TEXT} fontSize="39" fontWeight="850">hold everything else still</text>
      {[
        ['Mθ', 'same backbone', colors.SECONDARY],
        ['H', 'same harness', colors.ACCENT],
        ['K', 'operating context changes', colors.POSITIVE],
      ].map(([a, b, c], i) => <g key={a} transform={`translate(${385 + i * 255} 355)`}>
        <circle r="57" fill={colors.PANEL} stroke={c} strokeWidth="3" />
        <text y="-5" textAnchor="middle" fill={c} fontSize="25" fontWeight="800">{a}</text>
        <text y="25" textAnchor="middle" fill={colors.MUTED} fontSize="12">{b}</text>
      </g>)}
      <text x="640" y="480" textAnchor="middle" fill={colors.WARM} fontSize="21">compare the trajectories</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
