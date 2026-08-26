// Grounding: plugins/tools/assign_task.py;
// tests/test_agent_team_publish_deadlock.py; Apodex 1.1 paper section 3.3.4.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const STAGES = [
  { label: 'board', color: colors.ACCENT },
  { label: 'guard', color: colors.SECONDARY },
  { label: 'reports', color: colors.POSITIVE },
  { label: 'manifest', color: colors.WARM },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const candidatesP = tl.channel('workspace candidates', 0);
  const namespaceU = tl.channel('workspace output boundary', 0);
  const manifestU = tl.channel('exact path manifest', 0);
  const leaseU = tl.channel('publisher lease', 0);
  const raceU = tl.channel('second publisher race', 0);
  const bounceU = tl.channel('undeclared path bounce', 0);
  const baselineU = tl.channel('baseline reconciliation', 0);
  const transferU = tl.channel('controlled lease transfer', 0);
  const admitP = tl.channel('declared delivery', 0);
  const recapP = tl.channel('full journey recap', 0);
  const boundaryU = tl.channel('operational boundary', 0);
  const close = tl.channel('checkable delivery', 0);

  tl.caption({ at: 0.4, dur: 6.2, text: 'The runtime separates making a candidate in the workspace from declaring a final deliverable.' });
  tl.tween(candidatesP, 4, { at: 0.9, dur: 2.6, ease: ease.enter });
  tl.tween(namespaceU, 1, { at: 2.3, dur: 1.2, ease: ease.draw });

  tl.caption({ at: 7.0, dur: 6.2, text: 'A publishing assignment names exact output paths, and that manifest itself becomes the grant.' });
  tl.tween(manifestU, 1, { at: 7.7, dur: 1.3, ease: ease.enter });
  tl.tween(cam, { x: 650, y: 332, k: 1.16 }, { at: 9.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 13.6, dur: 6.2, text: 'A run-scoped lease gives commit authority to at most one active publisher at a time.' });
  tl.tween(leaseU, 1, { at: 14.3, dur: 0.7, ease: ease.pop });

  tl.caption({ at: 20.2, dur: 6.3, text: 'If a second publisher races toward the same deliverable, the lock refuses it before dispatch.' });
  tl.tween(raceU, 1, { at: 20.9, dur: 1.5, ease: ease.move });
  tl.tween(cam, { x: 500, y: 300, k: 1.12 }, { at: 23.1, dur: 1.2, ease: ease.move });

  tl.caption({ at: 26.9, dur: 6.3, text: 'Even the lease holder can write only declared paths. An undeclared output bounces at the aperture.' });
  tl.tween(bounceU, 1, { at: 27.6, dur: 1.7, ease: ease.move });

  tl.caption({ at: 33.6, dur: 6.4, text: 'At termination, every manifest entry is compared with its baseline, so empty or stale files cannot impersonate delivery.' });
  tl.tween(baselineU, 1, { at: 34.3, dur: 1.2, ease: ease.draw });
  tl.tween(cam, { x: 910, y: 350, k: 1.13 }, { at: 36.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 40.4, dur: 6.4, text: 'The lease may move only under controlled conditions, including when the incumbent is capped or gone.' });
  tl.tween(transferU, 1, { at: 41.1, dur: 1.6, ease: ease.move });

  tl.caption({ at: 47.2, dur: 6.3, text: 'The authorized publisher now fits the declared artifact through the stencil and into final collection.' });
  tl.tween(admitP, 2, { at: 47.9, dur: 3.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 50.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 53.9, dur: 6.6, text: 'Trace the work item back: the board remembers it, the guard bounds it, and fan-in preserves its evidence.' });
  tl.tween(recapP, 3, { at: 54.6, dur: 3.4, ease: ease.draw });

  tl.caption({ at: 60.9, dur: 6.4, text: 'The manifest makes the final handoff explicit, scoped, and checkable.' });
  tl.tween(recapP, 4, { at: 61.6, dur: 1.2, ease: ease.pop });
  tl.tween(boundaryU, 1, { at: 63.1, dur: 0.9, ease: ease.enter });

  tl.caption({ at: 67.7, dur: 6.9, text: 'That contract does not prove the conclusion is correct. It proves which work was delivered and how the runtime admitted it.' });
  tl.tween(close, 1, { at: 68.4, dur: 1.1, ease: ease.move });
  tl.hold(74.8, 1.0);

  return { tl, cam, candidatesP, namespaceU, manifestU, leaseU, raceU, bounceU, baselineU, transferU, admitP, recapP, boundaryU, close };
}

const scene = buildScene();

function Artifact({ x, y, label, color, opacity = 1 }: { x: number; y: number; label: string; color: string; opacity?: number }) {
  return <g opacity={opacity} transform={`translate(${x} ${y})`}>
    <path d="M-38 -30 H22 L38 -14 V30 H-38 Z" fill="#111827" stroke={color} strokeWidth="3" />
    <path d="M22 -30 V-14 H38" fill="none" stroke={color} strokeWidth="3" />
    <text y="7" textAnchor="middle" fill={colors.TEXT} fontSize="12">{label}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const candidatesP = s.get(scene.candidatesP);
  const bounce = s.get(scene.bounceU);
  const baseline = s.get(scene.baselineU);
  const workspaceQuiet = 1 - baseline;
  const admit = s.get(scene.admitP);
  const transfer = s.get(scene.transferU);
  const recap = s.get(scene.recapP);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="66" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="800">One manifest owns the finish</text>

      <g opacity={s.get(scene.namespaceU) * workspaceQuiet}>
        <rect x="70" y="124" width="390" height="442" rx="32" fill="#0d1526" stroke={colors.ACCENT} strokeWidth="3" strokeDasharray="9 8" />
        <text x="265" y="160" textAnchor="middle" fill={colors.ACCENT} fontSize="17" fontFamily={colors.font.mono}>/workspace</text>
        <text x="265" y="184" textAnchor="middle" fill={colors.MUTED} fontSize="13">candidate production</text>
      </g>
      <g opacity={s.get(scene.namespaceU)}>
        <rect x="872" y="124" width="338" height="442" rx="32" fill="#0d1526" stroke={colors.POSITIVE} strokeWidth="3" strokeDasharray="9 8" />
        <text x="1041" y="160" textAnchor="middle" fill={colors.POSITIVE} fontSize="17" fontFamily={colors.font.mono}>/outputs</text>
        <text x="1041" y="184" textAnchor="middle" fill={colors.MUTED} fontSize="13">final collection</text>
      </g>

      {[0, 1, 2, 3].map((i) => {
        const u = clamp01(candidatesP - i);
        const positions = [[164, 262], [342, 260], [164, 436], [342, 436]];
        return <Artifact key={i} x={positions[i][0]} y={positions[i][1]} label="candidate" color={[colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.WARM][i]} opacity={u * workspaceQuiet} />;
      })}

      <g opacity={s.get(scene.manifestU)}>
        <rect x="516" y="168" width="300" height="352" rx="34" fill="#171429" stroke={colors.SECONDARY} strokeWidth="5" />
        <text x="666" y="210" textAnchor="middle" fill={colors.SECONDARY} fontSize="16" fontWeight="800">exact manifest gate</text>
        <text x="666" y="246" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>AgentTeamAssignmentSpec.output_paths</text>
        <rect x="548" y="276" width="236" height="58" rx="16" fill="#0d1526" stroke={colors.WARM} strokeWidth="3" />
        <text x="666" y="311" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>/outputs/answer.md</text>
        <path d="M666 360 V472" stroke={colors.SECONDARY} strokeWidth="16" strokeLinecap="round" />
        <path d="M638 416 H694" stroke={colors.BG} strokeWidth="7" strokeLinecap="round" />
        <text x="666" y="500" textAnchor="middle" fill={colors.MUTED} fontSize="13">declared paths only</text>
      </g>

      <g opacity={s.get(scene.leaseU)}>
        <circle cx={584 + transfer * 164} cy="142" r="28" fill={colors.WARM} />
        <text x={584 + transfer * 164} y="148" textAnchor="middle" fill="#151006" fontSize="16" fontWeight="900">LEASE</text>
        <text x="666" y="110" textAnchor="middle" fill={colors.WARM} fontSize="13">one active publisher</text>
      </g>

      <g opacity={s.get(scene.raceU) * workspaceQuiet}>
        <path d="M280 330 C410 330 450 250 538 250" fill="none" stroke={colors.ACCENT} strokeWidth="5" />
        <path d="M280 386 C420 386 452 442 538 442" fill="none" stroke={colors.NEGATIVE} strokeWidth="5" strokeDasharray={`${Math.max(1, s.get(scene.raceU) * 270)} 290`} />
        <path d="M500 420 l34 22 -38 12" fill="none" stroke={colors.NEGATIVE} strokeWidth="5" />
        <text x="410" y="468" textAnchor="middle" fill={colors.NEGATIVE} fontSize="13">second publisher refused</text>
      </g>

      <g opacity={bounce * workspaceQuiet}>
        <Artifact x={420 + 126 * Math.sin(bounce * Math.PI)} y={540 - 128 * bounce} label="undeclared" color={colors.NEGATIVE} />
        <path d="M522 392 l26 20 -32 12" fill="none" stroke={colors.NEGATIVE} strokeWidth="5" />
      </g>

      <g opacity={s.get(scene.baselineU)}>
        <rect x="910" y="236" width="262" height="102" rx="22" fill="#111827" stroke={colors.MUTED} strokeWidth="3" />
        <text x="1041" y="270" textAnchor="middle" fill={colors.MUTED} fontSize="14">baseline snapshot</text>
        <text x="1041" y="300" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14">empty or stale ≠ delivered</text>
        <path d="M938 318 H1144" stroke={colors.NEGATIVE} strokeWidth="4" />
      </g>

      <g opacity={transfer}>
        <text x="666" y="586" textAnchor="middle" fill={colors.WARM} fontSize="13">lease transfer: incumbent capped or gone</text>
      </g>

      <g opacity={clamp01(admit)}>
        <Artifact x={786 + clamp01(admit - 1) * 250} y={390} label="answer.md" color={colors.POSITIVE} />
        <path d="M792 390 H1004" stroke={colors.POSITIVE} strokeWidth="5" strokeDasharray={`${Math.max(1, clamp01(admit - 1) * 215)} 230`} />
      </g>

      <g opacity={clamp01(recap)}>
        <rect x="172" y="576" width="936" height="38" rx="19" fill="#08101e" stroke={colors.GRID} />
        {STAGES.map((stage, i) => {
          const u = clamp01(recap - i);
          const x = 270 + i * 246;
          return <g key={stage.label} opacity={u}>
            <circle cx={x} cy="595" r="13" fill={stage.color} />
            <text x={x + 22} y="600" fill={stage.color} fontSize="13" fontWeight="700">{stage.label}</text>
          </g>;
        })}
      </g>
    </g>

    <g opacity={close}>
      <rect x="188" y="136" width="904" height="404" rx="42" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <text x="640" y="208" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">delivery becomes checkable</text>
      <path d="M278 336 H1002" stroke={colors.GRID} strokeWidth="8" strokeLinecap="round" />
      {STAGES.map((stage, i) => <g key={stage.label} transform={`translate(${338 + i * 202} 336)`}>
        <circle r="45" fill="#111827" stroke={stage.color} strokeWidth="5" />
        <circle r="18" fill={stage.color} />
        <text y="82" textAnchor="middle" fill={stage.color} fontSize="16" fontWeight="800">{stage.label}</text>
      </g>)}
      <text x="640" y="480" textAnchor="middle" fill={colors.MUTED} fontSize="21">explicit handoff ≠ automatic correctness</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
