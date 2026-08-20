// One Project, Many Environments — chapter 3.
// Grounded in Loop QA PR #1686: test-sessions.ts and project-environments.ts
// snapshot environment context, TestRunTable.tsx derives Source from that snapshot,
// and project-environment-migration.ts is dry-run by default with an explicit live gate.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const COLUMNS = [
  { key: 'Environment', x: 250, color: colors.ACCENT },
  { key: 'Source', x: 520, color: colors.WARM },
  { key: 'Target URL', x: 745, color: colors.SECONDARY },
  { key: 'Deployment', x: 1000, color: colors.POSITIVE },
] as const;
const RUNS = [
  ['Production', 'Manual', 'app.example.com', 'project-url'],
  ['Preview', 'GitHub App', 'preview-42.example.com', 'github-pr'],
  ['Production', 'Schedule', 'app.example.com', 'project-url'],
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const envU = tl.channel('envU', 0);
  const resolveU = tl.channel('resolveU', 0);
  const ledgerU = tl.channel('ledgerU', 0);
  const stampU = tl.channel('stampU', 0);
  const splitU = tl.channel('splitU', 0);
  const editU = tl.channel('editU', 0);
  const oldStableU = tl.channel('oldStableU', 0);
  const newRunU = tl.channel('newRunU', 0);
  const scanU = tl.channel('scanU', 0);
  const liveU = tl.channel('liveU', 0);
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6, text: 'At the moment a Test Run opens, Replay QA resolves the environment once.' });
  tl.tween(envU, 1, { at: 0.8, dur: 0.9, ease: ease.enter });
  tl.tween(resolveU, 1, { at: 2.0, dur: 2.3, ease: ease.draw });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'It stamps the environment name, address, trigger source, and deployment details into the session.' });
  tl.tween(ledgerU, 1, { at: t - 5.7, dur: 1.4, ease: ease.enter });
  tl.tween(stampU, 1, { at: t - 3.7, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 6.2, text: 'Source answers what started the run. Deployment answers what code and address the run actually used.' });
  tl.tween(splitU, 1, { at: t - 5.7, dur: 1.3, ease: ease.pop });
  tl.tween(cam, { x: 760, y: 350, k: 1.12 }, { at: t - 5.3, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6, text: 'Those are related, but they are not the same fact, so the data model keeps both.' });
  tl.tween(splitU, 0.55, { at: t - 5.5, dur: 1.0, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'Now change production from manual to a weekly schedule. The old run must not rewrite itself.' });
  tl.tween(cam, { x: 640, y: 350, k: 1.0 }, { at: t - 5.9, dur: 1.3, ease: ease.move });
  tl.tween(editU, 1, { at: t - 5.2, dur: 1.8, ease: ease.move });
  tl.tween(oldStableU, 1, { at: t - 2.9, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 6, text: 'The next run records Schedule. The earlier run still says Manual, because history is a snapshot, not a live join.' });
  tl.tween(newRunU, 1, { at: t - 5.5, dur: 1.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.5, text: 'Existing projects move into this model through a scoped migration that previews every planned Production conversion.' });
  tl.tween(scanU, 1, { at: t - 6.0, dur: 4.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 6.2, text: 'A project or user filter narrows the scan, and only the live flag is allowed to mutate data.' });
  tl.tween(liveU, 1, { at: t - 5.7, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6, text: 'One project can now cross many worlds without losing where any result came from.' });
  tl.tween(closeU, 1, { at: t - 5.5, dur: 0.9, ease: ease.enter });
  tl.tween(ledgerU, 0.12, { at: t - 5.2, dur: 1.0, ease: ease.move });
  tl.tween(envU, 0.12, { at: t - 5.2, dur: 1.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 330, k: 1.08 }, { at: t - 5.0, dur: 1.6, ease: ease.move });
  tl.hold(t, 1.0);
  return { tl, cam, envU, resolveU, ledgerU, stampU, splitU, editU, oldStableU, newRunU, scanU, liveU, closeU };
}

const scene = buildScene();

function LedgerRow({ row, y, u, stamp }: { row: readonly string[]; y: number; u: number; stamp: number }) {
  if (u <= 0) return null;
  return <g opacity={u} transform={`translate(0 ${(1 - u) * 16})`}>
    <rect x={110} y={y} width={1060} height={58} rx={12} fill={colors.PANEL} stroke={colors.MUTED} strokeOpacity={0.35} />
    <text x={135} y={y + 35} fill={colors.MUTED} fontSize={12} fontFamily={mono}>run {Math.round((y - 300) / 72) + 1}</text>
    {row.map((value, i) => <text key={value} x={COLUMNS[i]!.x} y={y + 35} fill={COLUMNS[i]!.color} fontSize={13} fontFamily={mono} opacity={clamp01(stamp * 5 - i)}>{value}</text>)}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const ledgerU = s.get(scene.ledgerU);
  const editU = s.get(scene.editU);
  const scanU = s.get(scene.scanU);
  const closeU = s.get(scene.closeU);
  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      <g opacity={s.get(scene.envU)}>
        <rect x={95} y={85} width={420} height={130} rx={22} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
        <text x={125} y={125} fill={colors.TEXT} fontSize={22} fontWeight={750}>Production</text>
        <text x={125} y={156} fill={colors.MUTED} fontSize={12} fontFamily={mono}>app.example.com</text>
        <text x={125} y={187} fill={editU > 0.5 ? colors.WARM : colors.MUTED} fontSize={13} fontFamily={mono}>source: {editU > 0.5 ? 'cron · weekly' : 'manual'}</text>
      </g>
      {s.get(scene.resolveU) > 0 && <g opacity={s.get(scene.resolveU)}>
        <path d="M 515 150 C 620 150, 610 260, 705 260" fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeDasharray="7 7" />
        <circle cx={515 + 190 * s.get(scene.resolveU)} cy={150 + 110 * s.get(scene.resolveU)} r={7} fill={colors.ACCENT} />
        <text x={600} y={130} fill={colors.ACCENT} fontFamily={mono} fontSize={11}>resolveRunEnvironment</text>
      </g>}

      <g opacity={ledgerU}>
        <text x={110} y={270} fill={colors.TEXT} fontSize={22} fontWeight={750}>Test Run provenance ledger</text>
        {COLUMNS.map(column => <text key={column.key} x={column.x} y={290} fill={column.color} fontSize={12} fontWeight={700}>{column.key}</text>)}
        <LedgerRow row={RUNS[0]} y={310} u={ledgerU} stamp={s.get(scene.stampU)} />
        <LedgerRow row={RUNS[1]} y={382} u={ledgerU} stamp={s.get(scene.stampU)} />
        <LedgerRow row={RUNS[2]} y={454} u={s.get(scene.newRunU)} stamp={1} />
        {s.get(scene.oldStableU) > 0 && <g opacity={s.get(scene.oldStableU)} transform="translate(510 340)">
          <rect x={-70} y={-18} width={140} height={36} rx={18} fill={colors.POSITIVE} opacity={0.14} />
          <text textAnchor="middle" y={5} fill={colors.POSITIVE} fontSize={12} fontWeight={700}>snapshot unchanged</text>
        </g>}
        {s.get(scene.splitU) > 0 && <>
          <rect x={490} y={275} width={145} height={255} rx={16} fill="none" stroke={colors.WARM} strokeWidth={2 * s.get(scene.splitU)} />
          <rect x={935} y={275} width={210} height={255} rx={16} fill="none" stroke={colors.POSITIVE} strokeWidth={2 * s.get(scene.splitU)} />
        </>}
      </g>

      {scanU > 0 && <g opacity={clamp01(scanU * 3)}>
        <line x1={110 + scanU * 1060} y1={285} x2={110 + scanU * 1060} y2={535} stroke={colors.SECONDARY} strokeWidth={3} />
        <text x={110} y={570} fill={colors.SECONDARY} fontFamily={mono} fontSize={13}>WOULD convert to Production · dry run</text>
        <text x={110} y={598} fill={colors.MUTED} fontFamily={mono} fontSize={11}>--project-id · --user-id · --all</text>
        {s.get(scene.liveU) > 0 && <g opacity={s.get(scene.liveU)} transform="translate(925 570)">
          <rect width={220} height={42} rx={12} fill={colors.NEGATIVE} opacity={0.14} /><text x={110} y={27} textAnchor="middle" fill={colors.NEGATIVE} fontFamily={mono} fontSize={14}>--live mutates</text>
        </g>}
      </g>}

      {closeU > 0 && <g opacity={closeU}>
        <rect x={230} y={230} width={820} height={180} rx={28} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={32} fontWeight={800}>every run remembers its world</text>
        <text x={640} y={352} textAnchor="middle" fill={colors.POSITIVE} fontSize={20}>environment · source · URL · deployment</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
