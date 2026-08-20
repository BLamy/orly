// Agent CODEOWNERS — chapter 4: The Worked Example, End to End.
// Grounded in "End-to-end run, one worked example": four changed files, a
// CODEOWNERS-derived plan, two agents running in parallel on only their
// matched files, one blocking finding (the migration) and one warning (the
// dependency), one sticky comment, a failing then a passing required check
// after a fix and a rerun against the new head SHA.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const FILES = [
  'prisma/migrations/20260820_add_event_status/migration.sql',
  'package.json',
  'pnpm-lock.yaml',
  'src/components/EventStatus.tsx',
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const filesU = tl.channel('filesU', 0);
  const planU = tl.channel('planU', 0);
  const asideU = tl.channel('asideU', 0);
  const laneU = tl.channel('laneU', 0);
  const spinU = tl.channel('spinU', 0);
  const findCodexU = tl.channel('findCodexU', 0);
  const claudeStage = tl.channel('claudeStage', 0); // 0 hidden · 1 finding · 2 fix · 3 resolved
  const stickyU = tl.channel('stickyU', 0);
  const checkU = tl.channel('checkU', 0);
  const checkGreenU = tl.channel('checkGreenU', 0);
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6.2, text: "Here's a pull request with four changed files: a new migration, a dependency bump, its lockfile, and one interface component." });
  tl.tween(filesU, 1, { at: 0.7, dur: 1.6, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 150, k: 1.05 }, { at: 0.9, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.4, text: 'The ownership file turns that into a plan. The migration goes to database review. The dependency files go to the package file reviewer.' });
  tl.tween(planU, 1, { at: t - 5.6, dur: 1.6, ease: ease.enter });
  tl.tween(asideU, 1, { at: t - 3.6, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 230, k: 1.05 }, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.4, text: 'Each agent runs once, in parallel, seeing only its own matched files and the relevant diff — never the whole repository.' });
  tl.tween(laneU, 1, { at: t - 5.6, dur: 1.4, ease: ease.enter });
  tl.tween(spinU, 1, { at: t - 4.6, dur: 3.4, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 320, k: 1.05 }, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 7.0, text: 'Database review finds a blocking problem: a new not null column, with no default, that will break every row already sitting in the table.' });
  tl.tween(claudeStage, 1, { at: t - 6.2, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 430, y: 400, k: 1.15 }, { at: t - 6.0, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.2, text: 'The package file reviewer finds an unused new dependency. Worth a comment, but not risky enough to block anything — it warns, and it passes.' });
  tl.tween(findCodexU, 1, { at: t - 5.4, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 850, y: 400, k: 1.15 }, { at: t - 5.2, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.6, text: 'One blocking finding and one warning collapse into a single sticky comment on the pull request, updated in place on every push.' });
  tl.tween(stickyU, 1, { at: t - 5.8, dur: 1.6, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 470, k: 1.02 }, { at: t - 5.6, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.2, text: 'The one required check, agent code review, fails — because of the blocking migration finding, and only because of it.' });
  tl.tween(checkU, 1, { at: t - 5.4, dur: 1.2, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 550, k: 1.0 }, { at: t - 5.2, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.6, text: 'The author fixes it with the known safe sequence: add the column nullable, backfill the existing rows, then constrain it not null.' });
  tl.tween(claudeStage, 2, { at: t - 5.8, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 430, y: 400, k: 1.15 }, { at: t - 5.6, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.2, text: 'A new commit means a fresh head revision. A new push event cancels the stale run and starts both agents again from scratch.' });
  tl.tween(spinU, 2, { at: t - 5.4, dur: 2.0, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 320, k: 1.05 }, { at: t - 5.2, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.8, text: 'Database review reruns against the fixed migration and finds nothing this time. The sticky comment marks the old finding resolved since the previous push.' });
  tl.tween(claudeStage, 3, { at: t - 6.0, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 430, y: 400, k: 1.15 }, { at: t - 5.8, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.4, text: 'The package file reviewer still warns about the same dependency, but nothing left is blocking. The required check turns green.' });
  tl.tween(checkGreenU, 1, { at: t - 5.6, dur: 1.2, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 550, k: 1.0 }, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.6, text: 'One blocking finding, one fix, one rerun, one green check — ownership file routing, real agents, real code, start to finish.' });
  tl.tween(closeU, 1, { at: t - 5.6, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 400, k: 0.86 }, { at: t - 5.4, dur: 1.5, ease: ease.move });
  tl.tween(filesU, 0.14, { at: t - 5.6, dur: 1.0, ease: ease.move });
  tl.tween(planU, 0.14, { at: t - 5.6, dur: 1.0, ease: ease.move });
  tl.tween(asideU, 0.1, { at: t - 5.6, dur: 1.0, ease: ease.move });
  tl.tween(laneU, 0.14, { at: t - 5.6, dur: 1.0, ease: ease.move });
  tl.tween(findCodexU, 0.14, { at: t - 5.6, dur: 1.0, ease: ease.move });
  tl.tween(stickyU, 0.14, { at: t - 5.6, dur: 1.0, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, cam, filesU, planU, asideU, laneU, spinU, findCodexU, claudeStage, stickyU, checkU, checkGreenU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const filesU = s.get(scene.filesU);
  const planU = s.get(scene.planU);
  const asideU = s.get(scene.asideU);
  const laneU = s.get(scene.laneU);
  const spinU = s.get(scene.spinU);
  const findCodexU = s.get(scene.findCodexU);
  const claudeStage = s.get(scene.claudeStage);
  const stickyU = s.get(scene.stickyU);
  const checkU = s.get(scene.checkU);
  const checkGreenU = s.get(scene.checkGreenU);
  const closeU = s.get(scene.closeU);
  const dim = 1 - closeU;

  const findingOp = clamp01(1 - Math.abs(claudeStage - 1)) * (claudeStage < 1.5 ? 1 : 0.15);
  const fixOp = clamp01(1 - Math.abs(claudeStage - 2));
  const resolvedOp = clamp01(claudeStage - 2.2);
  const spinAngle = (spinU % 1) * 360;

  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {/* files */}
      <g opacity={filesU * dim}>
        {FILES.map((f, i) => <g key={f} opacity={clamp01(filesU * 5 - i * 0.6)} transform={`translate(${140 + (i % 2) * 500} ${90 + Math.floor(i / 2) * 34})`}>
          <text fill={i === 3 ? colors.MUTED : colors.WARM} fontSize={12} fontFamily={mono}>{f}</text>
        </g>)}
      </g>

      {/* plan */}
      <g opacity={planU * dim}>
        <g transform="translate(150 150)">
          <rect width={430} height={70} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
          <text x={20} y={26} fill={colors.ACCENT} fontSize={13} fontFamily={mono} fontWeight={700}>@claude/db-review</text>
          <text x={20} y={48} fill={colors.MUTED} fontSize={11} fontFamily={mono}>migration.sql</text>
        </g>
        <g transform="translate(700 150)">
          <rect width={430} height={70} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
          <text x={20} y={26} fill={colors.WARM} fontSize={13} fontFamily={mono} fontWeight={700}>@codex/package-json-review</text>
          <text x={20} y={48} fill={colors.MUTED} fontSize={11} fontFamily={mono}>package.json · pnpm-lock.yaml</text>
        </g>
      </g>
      <g opacity={asideU * dim}>
        <text x={640} y={244} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>EventStatus.tsx matches no agent rule · normal human review only</text>
      </g>

      {/* agent lanes running */}
      <g opacity={laneU * dim}>
        <g transform="translate(230 300)">
          <circle r={18} fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeDasharray="70 40" transform={`rotate(${spinAngle})`} opacity={0.85} />
          <text x={34} y={6} fill={colors.ACCENT} fontSize={12.5} fontFamily={mono}>database review · running</text>
        </g>
        <g transform="translate(780 300)">
          <circle r={18} fill="none" stroke={colors.WARM} strokeWidth={3} strokeDasharray="70 40" transform={`rotate(${-spinAngle})`} opacity={0.85} />
          <text x={34} y={6} fill={colors.WARM} fontSize={12.5} fontFamily={mono}>package json review · running</text>
        </g>
      </g>

      {/* claude finding / fix / resolved — one persistent card */}
      {claudeStage > 0 && <g transform="translate(150 370)" opacity={dim}>
        <rect width={430} height={110} rx={16} fill={colors.PANEL}
          stroke={resolvedOp > 0.5 ? colors.MUTED : colors.NEGATIVE} strokeWidth={2} opacity={resolvedOp > 0.5 ? 0.5 : 1} />
        <g opacity={findingOp}>
          <text x={20} y={28} fill={colors.NEGATIVE} fontSize={12.5} fontWeight={750} fontFamily={mono}>blocking</text>
          <text x={20} y={52} fill={colors.TEXT} fontSize={12} fontFamily={mono}>organization_id UUID NOT NULL</text>
          <text x={20} y={72} fill={colors.MUTED} fontSize={11} fontFamily={mono}>breaks every existing row</text>
        </g>
        <g opacity={fixOp}>
          <text x={20} y={28} fill={colors.WARM} fontSize={12.5} fontWeight={750} fontFamily={mono}>fix · safe sequence</text>
          <text x={20} y={52} fill={colors.POSITIVE} fontSize={12} fontFamily={mono}>add nullable → backfill → constrain not null</text>
        </g>
        <g opacity={resolvedOp}>
          <text x={20} y={28} fill={colors.MUTED} fontSize={12.5} fontWeight={750} fontFamily={mono}>resolved since the previous push</text>
          <text x={20} y={52} fill={colors.POSITIVE} fontSize={12} fontFamily={mono}>✓ nothing blocking on rerun</text>
        </g>
      </g>}

      {/* codex finding — warns, always passes */}
      <g opacity={findCodexU * dim} transform="translate(700 370)">
        <rect width={430} height={110} rx={16} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
        <text x={20} y={28} fill={colors.WARM} fontSize={12.5} fontWeight={750} fontFamily={mono}>warning</text>
        <text x={20} y={52} fill={colors.TEXT} fontSize={12} fontFamily={mono}>unused new production dependency</text>
        <text x={20} y={72} fill={colors.POSITIVE} fontSize={11} fontFamily={mono}>passes</text>
      </g>

      {/* sticky comment */}
      <g opacity={stickyU * dim} transform="translate(290 500)">
        <rect width={700} height={62} rx={14} fill={colors.PANEL} stroke={colors.TEXT} strokeOpacity={0.3} />
        <text x={20} y={26} fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>Agent Code Review · sticky comment</text>
        <text x={20} y={46} fill={colors.MUTED} fontSize={11} fontFamily={mono}>updates in place on every push · never piles up new comments</text>
      </g>

      {/* required check badge */}
      {checkU > 0 && <g opacity={checkU * dim} transform="translate(460 560)">
        <rect width={360} height={48} rx={24} fill={colors.PANEL}
          stroke={checkGreenU > 0.5 ? colors.POSITIVE : colors.NEGATIVE}
          strokeWidth={2.2} />
        <circle cx={30} cy={24} r={7} fill={checkGreenU > 0.5 ? colors.POSITIVE : colors.NEGATIVE} />
        <text x={50} y={29} fill={colors.TEXT} fontSize={13} fontFamily={mono} fontWeight={700}>Agent Code Review</text>
        <text x={330} y={29} textAnchor="end" fill={checkGreenU > 0.5 ? colors.POSITIVE : colors.NEGATIVE} fontSize={13} fontFamily={mono}>
          {checkGreenU > 0.5 ? '✓' : '✕'}
        </text>
      </g>}

      {closeU > 0 && <g opacity={closeU}>
        <rect x={215} y={300} width={850} height={180} rx={26} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={640} y={368} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={800}>fix, rerun, green</text>
        <text x={640} y={408} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={mono}>a blocking finding disappears only when the code actually changes</text>
        <text x={640} y={442} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={mono}>same PR · new head SHA · fresh review</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
