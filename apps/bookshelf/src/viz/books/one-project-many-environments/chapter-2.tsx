// One Project, Many Environments — chapter 2.
// Grounded in Loop QA PR #1686: environment-schedules.ts, ci-runs.ts,
// github-app/store.ts, versions.releaseVersionTaskAwaitingDeploy, and
// tasks.scheduleSharedJourneysForVersion.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MatrixGrid } from '../../primitives';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TRIGGERS = [
  { label: 'Manual', code: 'manual', color: colors.MUTED },
  { label: 'Schedule', code: 'cron', color: colors.WARM },
  { label: 'GitHub App', code: 'github-app', color: colors.POSITIVE },
  { label: 'GitHub Actions', code: 'github-action', color: colors.SECONDARY },
] as const;
const VALUES = Array.from({ length: 4 }, () => Array.from({ length: 6 }, () => 0.18));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dialU = tl.channel('dialU', 0);
  const selected = tl.channel('selected', 0);
  const gateU = tl.channel('gateU', 0);
  const installU = tl.channel('installU', 0);
  const previewU = tl.channel('previewU', 0);
  const waitU = tl.channel('waitU', 0);
  const urlU = tl.channel('urlU', 0);
  const releaseU = tl.channel('releaseU', 0);
  const matrixU = tl.channel('matrixU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const runU = tl.channel('runU', 0);
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6, text: 'An environment is not only an address. It also says what is allowed to start a run.' });
  tl.tween(dialU, 1, { at: 0.8, dur: 1.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6, text: 'Manual, a recurring schedule, the Git Hub App, and Git Hub Actions are four explicit trigger sources.' });
  tl.tween(selected, 3, { at: t - 5.5, dur: 3.6, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6, text: 'Choosing the Git Hub App is guarded by a real installation check for the project repository.' });
  tl.tween(selected, 2, { at: t - 5.5, dur: 1.2, ease: ease.move });
  tl.tween(gateU, 1, { at: t - 4.0, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 5.5, text: 'Without the installation, the trigger stops here instead of pretending the repository can be reached.' });
  tl.tween(installU, 1, { at: t - 4.8, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'For a pull request, the preview environment opens a Test Run, then waits for a deployment address.' });
  tl.tween(cam, { x: 670, y: 375, k: 1.08 }, { at: t - 5.7, dur: 1.3, ease: ease.move });
  tl.tween(previewU, 1, { at: t - 5.3, dur: 0.8, ease: ease.enter });
  tl.tween(waitU, 1, { at: t - 3.8, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 6, text: 'When the preview address arrives, the parked version is released at that exact edge.' });
  tl.tween(urlU, 1, { at: t - 5.4, dur: 1.8, ease: ease.draw });
  tl.tween(waitU, 0, { at: t - 3.3, dur: 0.6, ease: ease.move });
  tl.tween(releaseU, 1, { at: t - 2.8, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.5, text: 'The release function now schedules the project’s shared journeys for that preview version.' });
  tl.tween(matrixU, 1, { at: t - 5.9, dur: 1.4, ease: ease.enter });
  tl.tween(sweepU, 1, { at: t - 4.2, dur: 3.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 6, text: 'The preview address is no longer collected and left idle. The journeys actually run against it.' });
  tl.tween(runU, 1, { at: t - 5.4, dur: 0.7, ease: ease.pop });
  tl.tween(cam, { x: 760, y: 390, k: 1.16 }, { at: t - 4.5, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 5.5, text: 'The trigger chooses the world. The shared catalog supplies the work.' });
  tl.tween(closeU, 1, { at: t - 5.0, dur: 0.9, ease: ease.enter });
  tl.tween(dialU, 0.12, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(previewU, 0.12, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(matrixU, 0.12, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.hold(t, 1.0);
  return { tl, cam, dialU, selected, gateU, installU, previewU, waitU, urlU, releaseU, matrixU, sweepU, runU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const dialU = s.get(scene.dialU);
  const selected = s.get(scene.selected);
  const previewU = s.get(scene.previewU);
  const matrixU = s.get(scene.matrixU);
  const sweepU = s.get(scene.sweepU);
  const closeU = s.get(scene.closeU);
  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      <g opacity={dialU}>
        <text x={90} y={82} fill={colors.MUTED} fontSize={13} fontFamily={mono}>project_environments.trigger_type</text>
        {TRIGGERS.map((trigger, i) => {
          const active = Math.max(0, 1 - Math.abs(selected - i));
          return <g key={trigger.code} transform={`translate(90 ${110 + i * 82})`}>
            <rect width={300} height={60} rx={15} fill={colors.PANEL} stroke={trigger.color} strokeWidth={1.2 + active * 3} opacity={0.55 + active * 0.45} />
            <circle cx={30} cy={30} r={8 + active * 5} fill={trigger.color} />
            <text x={55} y={27} fill={colors.TEXT} fontSize={17} fontWeight={700}>{trigger.label}</text>
            <text x={55} y={46} fill={trigger.color} fontSize={11} fontFamily={mono}>{trigger.code}</text>
          </g>;
        })}
      </g>

      {s.get(scene.gateU) > 0 && <g opacity={s.get(scene.gateU)} transform="translate(430 240)">
        <rect width={245} height={88} rx={16} fill={colors.PANEL} stroke={s.get(scene.installU) ? colors.NEGATIVE : colors.POSITIVE} />
        <text x={122} y={32} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={700}>Repository installation</text>
        <text x={122} y={60} textAnchor="middle" fill={s.get(scene.installU) ? colors.NEGATIVE : colors.POSITIVE} fontFamily={mono} fontSize={12}>{s.get(scene.installU) ? 'required · blocked' : 'getInstallationIdForRepo'}</text>
      </g>}

      {previewU > 0 && <g opacity={previewU} transform="translate(720 90)">
        <rect width={430} height={145} rx={22} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
        <text x={26} y={37} fill={colors.TEXT} fontSize={21} fontWeight={750}>Preview · pull request</text>
        <text x={26} y={69} fill={colors.MUTED} fontFamily={mono} fontSize={12}>status: {s.get(scene.waitU) > 0.1 ? 'awaiting deployment' : s.get(scene.urlU) > 0.1 ? 'deployment ready' : 'opened'}</text>
        <line x1={28} y1={107} x2={28 + 365 * s.get(scene.urlU)} y2={107} stroke={colors.SECONDARY} strokeWidth={5} strokeLinecap="round" />
        <text x={26} y={132} fill={colors.SECONDARY} fontFamily={mono} fontSize={11} opacity={s.get(scene.urlU)}>preview.example.com</text>
        {s.get(scene.releaseU) > 0 && <g opacity={s.get(scene.releaseU)} transform={`translate(365 40) scale(${0.8 + 0.2 * s.get(scene.releaseU)})`}>
          <circle r={25} fill={colors.POSITIVE} opacity={0.16} /><text textAnchor="middle" y={6} fill={colors.POSITIVE} fontSize={24}>✓</text>
        </g>}
      </g>}

      {matrixU > 0 && <g opacity={matrixU}>
        <text x={720} y={300} fill={colors.MUTED} fontFamily={mono} fontSize={12}>scheduleSharedJourneysForVersion</text>
        <MatrixGrid x={720} y={325} values={VALUES} cell={42} gap={5} rowLabels={['auth', 'search', 'cart', 'profile']} cellU={(i, j) => clamp01(matrixU * 18 - (i * 6 + j) * 0.5)} highlight={{ row: Math.min(3, Math.floor(sweepU * 4)), color: colors.ACCENT, u: sweepU }} />
        <text x={1010} y={510} fill={colors.POSITIVE} fontSize={18} fontWeight={750} opacity={s.get(scene.runU)}>journeys queued</text>
      </g>}

      {closeU > 0 && <g opacity={closeU}>
        <rect x={250} y={235} width={780} height={170} rx={26} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={2} />
        <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={32} fontWeight={800}>trigger → environment → shared journeys</text>
        <text x={640} y={356} textAnchor="middle" fill={colors.SECONDARY} fontSize={21}>the preview URL now starts real work</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
