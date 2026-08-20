// One Project, Many Environments — chapter 2: The Database Solution.
// The migration plan, shipped safely: expand (additive table), migrate
// (dry-run-first backfill into a default production environment), contract
// (drop the old columns and the fallback code).
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const STEPS = [
  { n: 1, label: 'Expand', sub: 'add the table', color: colors.ACCENT },
  { n: 2, label: 'Migrate', sub: 'backfill script', color: colors.WARM },
  { n: 3, label: 'Contract', sub: 'drop old columns', color: colors.POSITIVE },
] as const;

const PROJECT_COLS = [
  { name: 'id', keep: true },
  { name: 'name', keep: true },
  { name: 'repo', keep: true },
  { name: 'target_url', keep: false },
  { name: 'test_instructions', keep: false },
] as const;

const ENV_COLS = ['id', 'project_id  →  projects.id', 'name · kind', 'target_url', 'test_instructions'] as const;

const ENV_ROWS = [
  { name: 'production', url: 'app.example.com', color: colors.POSITIVE },
  { name: 'staging', url: 'staging.example.com', color: colors.WARM },
  { name: 'preview · PR 421', url: 'preview-421.example.com', color: colors.SECONDARY },
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const railU = tl.channel('railU', 0);        // the 3-step plan rail
  const step = tl.channel('step', 0);          // 0 none · 1 expand · 2 migrate · 3 contract
  const projectsU = tl.channel('projectsU', 0);
  const oddU = tl.channel('oddU', 0);          // highlight the two misplaced columns
  const envTableU = tl.channel('envTableU', 0);
  const fkU = tl.channel('fkU', 0);            // FK + crow's foot
  const backfillU = tl.channel('backfillU', 0);// ghost copy into production row
  const dryU = tl.channel('dryU', 0);          // dry-run → --live chip
  const flagU = tl.channel('flagU', 0);        // feature-flag read-path widget
  const flipU = tl.channel('flipU', 0);        // 0 = read old columns · 1 = read environments
  const dropU = tl.channel('dropU', 0);        // old columns struck + removed
  const rowsU = tl.channel('rowsU', 0);        // staging/preview rows appear
  const runsU = tl.channel('runsU', 0);        // test_runs.environment_id (nullable, expand)
  const runFillU = tl.channel('runFillU', 0);  // historical runs mapped to environments
  const runLockU = tl.channel('runLockU', 0);  // column becomes NOT NULL
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6.4, text: 'A change this aggressive to the data model does not ship in one commit. We propose the classic three step migration: expand, migrate, then contract.' });
  tl.tween(railU, 1, { at: 0.8, dur: 1.8, ease: ease.enter });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 6.2, text: 'For context, here is the projects table today. Two of its columns are the odd ones out: a target URL and instructions describe a deployment, not the product.' });
  tl.tween(projectsU, 1, { at: t - 5.6, dur: 1.2, ease: ease.enter });
  tl.tween(oddU, 1, { at: t - 3.4, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Step one is purely additive. We create a project environments table next to it. Nothing reads the new table yet, so this step cannot break anything.' });
  tl.tween(step, 1, { at: t - 5.8, dur: 0.4, ease: ease.move });
  tl.tween(envTableU, 1, { at: t - 5.0, dur: 1.6, ease: ease.draw });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6, text: 'The foreign key back to the project is the whole point. It turns one to one into one to many: one project, as many environments as we deploy.' });
  tl.tween(fkU, 1, { at: t - 5.4, dur: 1.4, ease: ease.draw });
  tl.tween(rowsU, 1, { at: t - 3.0, dur: 1.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Step two is a backfill script. For every existing project it copies the current target URL and instructions into a default production environment row.' });
  tl.tween(step, 2, { at: t - 5.8, dur: 0.4, ease: ease.move });
  tl.tween(backfillU, 1, { at: t - 4.6, dur: 2.2, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'The script is dry run by default. We point it at a few projects, read the report of what it would do, and only then pass the live flag for everyone.' });
  tl.tween(dryU, 1, { at: t - 5.6, dur: 1.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Which table we read from sits behind a feature flag. It ships dark: while the flag is off, every read still comes from the old columns.' });
  tl.tween(flagU, 1, { at: t - 5.6, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'The moment the backfill lands, we flip the flag and reads route to the environment rows. If anything looks wrong, flipping it back is the instant rollback.' });
  tl.tween(flipU, 1, { at: t - 4.6, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'Only when the flag has been on and quiet do we contract: drop the two old columns, then delete the flag and the old read path. That is the tech debt cleanup, done last, when it is safe.' });
  tl.tween(step, 3, { at: t - 6.0, dur: 0.4, ease: ease.move });
  tl.tween(flagU, 0.15, { at: t - 4.4, dur: 0.8, ease: ease.move });
  tl.tween(dropU, 1, { at: t - 4.0, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Test runs need the same treatment. Today a run points at a project and a raw URL. We add a nullable environment id, so new runs point at the world they executed in.' });
  tl.tween(runsU, 1, { at: t - 5.6, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 700, y: 420, k: 1.12 }, { at: t - 5.2, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'Then a second backfill maps history: a run whose URL matches an environment gets that row, and everything else defaults to production. Only when every run has one does the column become required.' });
  tl.tween(runFillU, 1, { at: t - 5.8, dur: 2.2, ease: ease.move });
  tl.tween(runLockU, 1, { at: t - 2.6, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6, text: 'That is the whole database story: one additive table, one careful script, one cleanup. Two columns move, and history starts naming its world.' });
  tl.tween(closeU, 1, { at: t - 5.2, dur: 1.0, ease: ease.enter });
  tl.tween(projectsU, 0.14, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(envTableU, 0.14, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(runsU, 0.14, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(railU, 0.2, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 340, k: 1.06 }, { at: t - 5.0, dur: 1.6, ease: ease.move });
  tl.hold(t, 1.0);
  return { tl, cam, railU, step, projectsU, oddU, envTableU, fkU, backfillU, dryU, flagU, flipU, dropU, rowsU, runsU, runFillU, runLockU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const railU = s.get(scene.railU);
  const step = s.get(scene.step);
  const projectsU = s.get(scene.projectsU);
  const oddU = s.get(scene.oddU);
  const envTableU = s.get(scene.envTableU);
  const fkU = s.get(scene.fkU);
  const backfillU = s.get(scene.backfillU);
  const dryU = s.get(scene.dryU);
  const flagU = s.get(scene.flagU);
  const flipU = s.get(scene.flipU);
  const dropU = s.get(scene.dropU);
  const rowsU = s.get(scene.rowsU);
  const runsU = s.get(scene.runsU);
  const runFillU = s.get(scene.runFillU);
  const runLockU = s.get(scene.runLockU);
  const closeU = s.get(scene.closeU);

  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {/* Step rail */}
      <g opacity={railU}>
        {STEPS.map((st, i) => {
          const active = Math.max(0, 1 - Math.abs(step - st.n));
          return <g key={st.n} transform={`translate(${105 + i * 370} 48)`}>
            <rect width={330} height={54} rx={14} fill={colors.PANEL} stroke={st.color} strokeWidth={1 + 2.4 * active} opacity={0.45 + 0.55 * active} />
            <circle cx={28} cy={27} r={13} fill={st.color} opacity={0.25 + 0.75 * active} />
            <text x={28} y={32} textAnchor="middle" fill={colors.BG} fontSize={14} fontWeight={800} opacity={0.4 + 0.6 * active}>{st.n}</text>
            <text x={52} y={24} fill={colors.TEXT} fontSize={16} fontWeight={750} opacity={0.55 + 0.45 * active}>{st.label}</text>
            <text x={52} y={43} fill={st.color} fontSize={11} fontFamily={mono} opacity={0.55 + 0.45 * active}>{st.sub}</text>
            {i < 2 && <text x={348} y={33} fill={colors.MUTED} fontSize={18}>→</text>}
          </g>;
        })}
      </g>

      {/* projects table */}
      <g opacity={projectsU}>
        <rect x={105} y={140} width={330} height={236} rx={18} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
        <text x={130} y={175} fill={colors.TEXT} fontSize={19} fontWeight={750}>projects</text>
        {PROJECT_COLS.map((col, i) => {
          const odd = !col.keep;
          const gone = odd ? dropU : 0;
          return <g key={col.name} opacity={1 - gone * 0.92} transform={`translate(${gone * 26} 0)`}>
            <rect x={128} y={190 + i * 34} width={284} height={28} rx={7}
              fill={odd && oddU > 0.05 ? colors.WARM : colors.BG}
              fillOpacity={odd && oddU > 0.05 ? 0.1 + 0.1 * oddU : 1}
              stroke={odd && oddU > 0.05 ? colors.WARM : colors.MUTED} strokeOpacity={odd ? 0.9 : 0.3} />
            <text x={144} y={209 + i * 34} fill={odd ? colors.WARM : colors.MUTED} fontSize={12.5} fontFamily={mono}>{col.name}</text>
            {odd && dropU > 0.1 && <line x1={140} y1={204 + i * 34} x2={408} y2={204 + i * 34} stroke={colors.NEGATIVE} strokeWidth={2.4} opacity={dropU}
              strokeDasharray="268" strokeDashoffset={268 * (1 - dropU)} />}
          </g>;
        })}
        {dropU > 0.6 && <text x={130} y={362} fill={colors.POSITIVE} fontSize={11.5} fontFamily={mono} opacity={(dropU - 0.6) * 2.5}>DROP COLUMN · fallback code deleted</text>}
      </g>

      {/* project_environments table */}
      <g opacity={envTableU}>
        <rect x={620} y={140} width={548} height={330} rx={18} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8}
          strokeDasharray="1756" strokeDashoffset={1756 * (1 - clamp01(envTableU))} />
        <text x={646} y={175} fill={colors.TEXT} fontSize={19} fontWeight={750}>project_environments</text>
        <text x={904} y={175} fill={colors.WARM} fontSize={11} fontFamily={mono}>new · additive</text>
        {ENV_COLS.map((col, i) => (
          <text key={col} x={646} y={205 + i * 24} fill={i === 1 ? colors.ACCENT : colors.MUTED} fontSize={12} fontFamily={mono}
            opacity={clamp01(envTableU * 5 - i)}>{col}</text>
        ))}
        {/* environment rows */}
        {ENV_ROWS.map((row, i) => {
          const rowShow = i === 0 ? clamp01(backfillU * 2) : clamp01(rowsU * 2 - (i - 1));
          return <g key={row.name} opacity={rowShow} transform={`translate(0 ${(1 - rowShow) * 12})`}>
            <rect x={646} y={330 + i * 42} width={496} height={34} rx={9} fill={colors.BG} stroke={row.color} strokeWidth={1.4} />
            <text x={664} y={352 + i * 42} fill={row.color} fontSize={12.5} fontFamily={mono}>{row.name}</text>
            <text x={860} y={352 + i * 42} fill={colors.MUTED} fontSize={12} fontFamily={mono}>{row.url}</text>
          </g>;
        })}
      </g>

      {/* FK crow's foot: projects.id 1 — ∞ project_environments.project_id */}
      {fkU > 0 && <g opacity={fkU}>
        <path d="M 435 258 C 520 258, 540 258, 620 258" fill="none" stroke={colors.ACCENT} strokeWidth={2.6}
          strokeDasharray="190" strokeDashoffset={190 * (1 - fkU)} />
        <text x={455} y={246} fill={colors.ACCENT} fontSize={13} fontWeight={700}>1</text>
        {/* crow's foot at the many end */}
        <path d="M 620 258 L 600 246 M 620 258 L 600 258 M 620 258 L 600 270" stroke={colors.ACCENT} strokeWidth={2.2} fill="none" />
        <text x={585} y={288} fill={colors.ACCENT} fontSize={13} fontWeight={700}>∞</text>
        <text x={462} y={282} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>one → many</text>
      </g>}

      {/* backfill ghosts: old columns → production row */}
      {backfillU > 0 && backfillU < 1 && <g opacity={clamp01(backfillU * 6) * clamp01((1 - backfillU) * 6)}>
        <rect x={lerp(128, 646, backfillU)} y={lerp(292, 330, backfillU)} width={lerp(284, 496, backfillU)} height={30} rx={8}
          fill="none" stroke={colors.WARM} strokeWidth={1.6} strokeDasharray="6 5" />
        <text x={lerp(150, 680, backfillU)} y={lerp(312, 350, backfillU)} fill={colors.WARM} fontSize={11.5} fontFamily={mono}>copy url + instructions</text>
      </g>}

      {/* dry-run → live chip */}
      {dryU > 0 && <g opacity={dryU * (1 - closeU)} transform="translate(105 415)">
        <rect width={330} height={64} rx={14} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.6} />
        <text x={20} y={26} fill={colors.WARM} fontSize={12.5} fontFamily={mono}>backfill --project-id … (dry run)</text>
        <text x={20} y={48} fill={colors.MUTED} fontSize={12} fontFamily={mono}>report only · mutate with <tspan fill={colors.NEGATIVE}>--live</tspan></text>
      </g>}

      {/* feature-flagged read path: env_reads off → old columns, on → environment rows */}
      {flagU > 0 && <g opacity={flagU}>
        <text x={105} y={528} fill={colors.MUTED} fontSize={12} fontFamily={mono}>read path · feature flag</text>
        <g transform="translate(105 540)">
          <rect width={168} height={44} rx={22} fill={colors.BG} stroke={flipU > 0.5 ? colors.POSITIVE : colors.MUTED} strokeWidth={1.8} />
          <circle cx={lerp(24, 144, flipU)} cy={22} r={15} fill={flipU > 0.5 ? colors.POSITIVE : colors.MUTED} />
          <text x={lerp(96, 66, flipU)} y={27} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>{flipU > 0.5 ? 'env_reads: ON' : 'env_reads: OFF'}</text>
        </g>
        {/* old route: flag → projects columns */}
        <path d="M 273 555 C 330 545, 300 470, 285 385" fill="none" stroke={colors.MUTED} strokeWidth={2.2}
          strokeDasharray="7 6" opacity={lerp(0.9, 0.12, flipU)} />
        {/* new route: flag → environment rows */}
        <path d="M 273 565 C 430 590, 600 540, 668 478" fill="none" stroke={colors.POSITIVE} strokeWidth={2.4}
          strokeDasharray="7 6" opacity={lerp(0.12, 1, flipU)} />
        <text x={300} y={600} fill={flipU > 0.5 ? colors.POSITIVE : colors.MUTED} fontSize={11.5} fontFamily={mono}>
          {flipU > 0.5 ? 'flipped after backfill · flip back = instant rollback' : 'ships dark · old columns still serve reads'}</text>
      </g>}

      {/* test_runs: expand (nullable env id) → backfill history → NOT NULL */}
      {runsU > 0 && <g opacity={runsU} transform="translate(485 495)">
        <rect width={660} height={128} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.8} />
        <text x={24} y={30} fill={colors.TEXT} fontSize={17} fontWeight={750}>test_runs</text>
        <text x={190} y={30} fill={colors.SECONDARY} fontSize={12} fontFamily={mono}>+ environment_id → project_environments.id  <tspan fill={runLockU > 0.5 ? colors.POSITIVE : colors.MUTED}>{runLockU > 0.5 ? 'NOT NULL' : 'nullable'}</tspan></text>
        <g opacity={clamp01(runFillU * 2)}>
          <text x={24} y={58} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>run 418 · app.example.com</text>
          <text x={340} y={58} fill={colors.POSITIVE} fontSize={11.5} fontFamily={mono}>→ production   (url match)</text>
        </g>
        <g opacity={clamp01(runFillU * 2 - 0.6)}>
          <text x={24} y={80} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>run 419 · staging.example.com</text>
          <text x={340} y={80} fill={colors.WARM} fontSize={11.5} fontFamily={mono}>→ staging      (url match)</text>
        </g>
        <g opacity={clamp01(runFillU * 2 - 1.2)}>
          <text x={24} y={102} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>run 302 · legacy · no match</text>
          <text x={340} y={102} fill={colors.POSITIVE} fontSize={11.5} fontFamily={mono}>→ production   (default)</text>
        </g>
        <path d="M 330 -25 C 330 -45, 700 -80, 700 -48" fill="none" stroke={colors.SECONDARY} strokeWidth={1.8} strokeDasharray="5 5" opacity={0.7} />
      </g>}

      {/* close */}
      {closeU > 0 && <g opacity={closeU}>
        <rect x={235} y={220} width={810} height={190} rx={26} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={800}>expand → migrate → contract</text>
        <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={19}>projects 1 — ∞ project_environments — test_runs</text>
        <text x={640} y={374} textAnchor="middle" fill={colors.POSITIVE} fontSize={17}>additive first · dry run before live · drop columns last</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
