// One Project, Many Environments — chapter 2: The Database Solution.
// The FULL migration footprint: four tables (projects and test_runs changed in
// place, project_environments and journey_environments brand new), shipped as
// expand → migrate → contract with a dry-run-first backfill and a read-path
// feature flag as the cutover/rollback switch.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const STEPS = [
  { n: 1, label: 'Expand', sub: 'additive only', color: colors.ACCENT },
  { n: 2, label: 'Migrate', sub: 'backfill + flag flip', color: colors.WARM },
  { n: 3, label: 'Contract', sub: 'drop old columns', color: colors.POSITIVE },
] as const;

// the four table cards — the whole footprint of the migration
const TABLES = [
  { key: 'projects', x: 90, y: 132, w: 300, h: 214, color: colors.ACCENT, tag: 'changed' },
  { key: 'project_environments', x: 640, y: 132, w: 470, h: 254, color: colors.WARM, tag: 'new' },
  { key: 'test_runs', x: 90, y: 430, w: 470, h: 164, color: colors.SECONDARY, tag: 'changed' },
  { key: 'journey_environments', x: 640, y: 452, w: 470, h: 128, color: colors.POSITIVE, tag: 'new' },
] as const;

const PROJECT_COLS = [
  { name: 'id', moves: false },
  { name: 'name', moves: false },
  { name: 'repo', moves: false },
  { name: 'target_url', moves: true },
  { name: 'test_instructions', moves: true },
  { name: 'login_variables', moves: true },
] as const;

const ENV_COLS = [
  'id',
  'project_id → projects.id',
  'name · kind',
  'is_default ✦',
  'target_url',
  'test_instructions',
  'login_variables',
  'trigger_config',
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const railU = tl.channel('railU', 0);
  const step = tl.channel('step', 0);          // 0 none · 1 expand · 2 migrate · 3 contract
  const focus = tl.channel('focus', 0);        // 0 all · 1..4 = TABLES index+1
  const skeletonU = tl.channel('skeletonU', 0);// all four cards as ghosts
  const projU = tl.channel('projU', 0);        // projects columns
  const oddU = tl.channel('oddU', 0);          // the three deployment columns
  const envU = tl.channel('envU', 0);          // project_environments detail
  const fkU = tl.channel('fkU', 0);            // 1—∞ crow's foot
  const inheritU = tl.channel('inheritU', 0);  // default row + inheritance
  const runsAddU = tl.channel('runsAddU', 0);  // + environment_id (nullable)
  const jeAddU = tl.channel('jeAddU', 0);      // journey_environments detail
  const backfillU = tl.channel('backfillU', 0);// url classification into env rows
  const dryU = tl.channel('dryU', 0);          // dry run → --live chip
  const flagU = tl.channel('flagU', 0);        // env_reads flag widget
  const flipU = tl.channel('flipU', 0);        // 0 old columns · 1 environments
  const runFillU = tl.channel('runFillU', 0);  // historical runs mapped
  const runLockU = tl.channel('runLockU', 0);  // NOT NULL
  const jeFillU = tl.channel('jeFillU', 0);    // journeys × envs backfill
  const dropU = tl.channel('dropU', 0);        // strike + remove old columns
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6.4, text: 'A change this aggressive to the data model does not ship in one commit. We propose the classic three step migration: expand, migrate, then contract.' });
  tl.tween(railU, 1, { at: 0.8, dur: 1.8, ease: ease.enter });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 6, text: 'And it is wider than one table. Four tables are touched: two brand new, two changed in place. Here is the whole footprint.' });
  tl.tween(skeletonU, 1, { at: t - 5.4, dur: 2.2, ease: ease.draw });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'The projects table is where the trouble lives. Its target URL, its instructions, and its login variables all describe a deployment, not the product.' });
  tl.tween(focus, 1, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 420, y: 300, k: 1.28 }, { at: t - 5.6, dur: 1.3, ease: ease.move });
  tl.tween(projU, 1, { at: t - 5.0, dur: 1.0, ease: ease.enter });
  tl.tween(oddU, 1, { at: t - 3.2, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 7, text: 'Step one is purely additive. A new project environments table takes those three fields, plus a kind, a default marker, and trigger configuration. Its foreign key turns one project into many environments.' });
  tl.tween(step, 1, { at: t - 6.6, dur: 0.4, ease: ease.move });
  tl.tween(focus, 2, { at: t - 6.4, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 760, y: 280, k: 1.18 }, { at: t - 6.2, dur: 1.3, ease: ease.move });
  tl.tween(envU, 1, { at: t - 5.6, dur: 1.6, ease: ease.draw });
  tl.tween(fkU, 1, { at: t - 3.2, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'One of those rows will be marked as the default environment. Every other environment inherits instructions and logins from the default, unless it defines its own.' });
  tl.tween(inheritU, 1, { at: t - 5.6, dur: 1.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 7, text: 'Still in step one: test runs gain a nullable environment id, and a new journey environments table joins each journey to the worlds it may run in. Additive columns, additive tables, zero behavior change.' });
  tl.tween(focus, 3.5, { at: t - 6.6, dur: 0.9, ease: ease.move });
  tl.tween(cam, { x: 620, y: 460, k: 1.14 }, { at: t - 6.4, dur: 1.3, ease: ease.move });
  tl.tween(runsAddU, 1, { at: t - 5.4, dur: 1.0, ease: ease.enter });
  tl.tween(jeAddU, 1, { at: t - 3.6, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.6, text: 'Step two migrates the data. The backfill inspects each project URL: a reachable address means production, a pull request address means preview, and localhost means local development.' });
  tl.tween(step, 2, { at: t - 6.2, dur: 0.4, ease: ease.move });
  tl.tween(focus, 2, { at: t - 6.0, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 660, y: 300, k: 1.12 }, { at: t - 5.8, dur: 1.3, ease: ease.move });
  tl.tween(backfillU, 1, { at: t - 4.8, dur: 2.2, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 5.8, text: 'It is dry run by default. We scope it to a few projects, read the report of what it would do, then pass the live flag for everyone.' });
  tl.tween(dryU, 1, { at: t - 5.2, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.6, text: 'Which table reads come from sits behind a feature flag that ships dark. The moment the backfill lands we flip it, and flipping it back is the instant rollback.' });
  tl.tween(flagU, 1, { at: t - 6.0, dur: 1.0, ease: ease.enter });
  tl.tween(flipU, 1, { at: t - 3.0, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.6, text: 'Historical test runs are mapped the same way: match the run URL to an environment, classify the rest by inspection, and only when every run has one does the column become required.' });
  tl.tween(focus, 3, { at: t - 6.2, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 480, y: 440, k: 1.2 }, { at: t - 6.0, dur: 1.3, ease: ease.move });
  tl.tween(runFillU, 1, { at: t - 5.0, dur: 2.0, ease: ease.move });
  tl.tween(runLockU, 1, { at: t - 2.4, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 5.8, text: 'Journeys are backfilled as applicable to every environment, so day one behaves exactly like today. Opting out comes later, journey by journey.' });
  tl.tween(focus, 4, { at: t - 5.4, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 780, y: 480, k: 1.2 }, { at: t - 5.2, dur: 1.3, ease: ease.move });
  tl.tween(jeFillU, 1, { at: t - 4.0, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'Only then does step three contract: drop the three old columns from projects and delete the flag and the fallback reads. The tech debt is paid down last, when it is safe.' });
  tl.tween(step, 3, { at: t - 6.0, dur: 0.4, ease: ease.move });
  tl.tween(focus, 1, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 420, y: 300, k: 1.22 }, { at: t - 5.6, dur: 1.3, ease: ease.move });
  tl.tween(flagU, 0.15, { at: t - 4.6, dur: 0.8, ease: ease.move });
  tl.tween(dropU, 1, { at: t - 4.2, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Four tables, three steps, no flag day. That is the whole database story, and every run afterward names the world it ran in.' });
  tl.tween(closeU, 1, { at: t - 5.2, dur: 1.0, ease: ease.enter });
  tl.tween(focus, 0, { at: t - 5.6, dur: 1.0, ease: ease.move });
  tl.tween(skeletonU, 0.15, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(railU, 0.2, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 340, k: 1.06 }, { at: t - 5.2, dur: 1.6, ease: ease.move });
  tl.hold(t, 1.0);
  return { tl, cam, railU, step, focus, skeletonU, projU, oddU, envU, fkU, inheritU, runsAddU, jeAddU, backfillU, dryU, flagU, flipU, runFillU, runLockU, jeFillU, dropU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const railU = s.get(scene.railU);
  const step = s.get(scene.step);
  const focus = s.get(scene.focus);
  const skeletonU = clamp01(s.get(scene.skeletonU));
  const skeletonRaw = s.get(scene.skeletonU);
  const projU = s.get(scene.projU);
  const oddU = s.get(scene.oddU);
  const envU = s.get(scene.envU);
  const fkU = s.get(scene.fkU);
  const inheritU = s.get(scene.inheritU);
  const runsAddU = s.get(scene.runsAddU);
  const jeAddU = s.get(scene.jeAddU);
  const backfillU = s.get(scene.backfillU);
  const dryU = s.get(scene.dryU);
  const flagU = s.get(scene.flagU);
  const flipU = s.get(scene.flipU);
  const runFillU = s.get(scene.runFillU);
  const runLockU = s.get(scene.runLockU);
  const jeFillU = s.get(scene.jeFillU);
  const dropU = s.get(scene.dropU);
  const closeU = s.get(scene.closeU);

  // per-table spotlight: 1 when this table (or nothing) is the subject, whisper otherwise
  const tblOp = (i: number) => {
    const active = clamp01(1 - Math.abs(focus - (i + 1)));
    return lerp(1, lerp(0.15, 1, active), clamp01(focus)) * skeletonRaw;
  };

  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {/* Step rail */}
      <g opacity={railU}>
        {STEPS.map((st, i) => {
          const active = Math.max(0, 1 - Math.abs(step - st.n));
          return <g key={st.n} transform={`translate(${105 + i * 370} 42)`}>
            <rect width={330} height={54} rx={14} fill={colors.PANEL} stroke={st.color} strokeWidth={1 + 2.4 * active} opacity={0.45 + 0.55 * active} />
            <circle cx={28} cy={27} r={13} fill={st.color} opacity={0.25 + 0.75 * active} />
            <text x={28} y={32} textAnchor="middle" fill={colors.BG} fontSize={14} fontWeight={800} opacity={0.4 + 0.6 * active}>{st.n}</text>
            <text x={52} y={24} fill={colors.TEXT} fontSize={16} fontWeight={750} opacity={0.55 + 0.45 * active}>{st.label}</text>
            <text x={52} y={43} fill={st.color} fontSize={11} fontFamily={mono} opacity={0.55 + 0.45 * active}>{st.sub}</text>
            {i < 2 && <text x={348} y={33} fill={colors.MUTED} fontSize={18}>→</text>}
          </g>;
        })}
      </g>

      {/* card frames — the whole footprint, drawn as ghosts first */}
      {TABLES.map((tb, i) => {
        const perimeter = 2 * (tb.w + tb.h);
        return <g key={tb.key} opacity={tblOp(i)}>
          <rect x={tb.x} y={tb.y} width={tb.w} height={tb.h} rx={18} fill={colors.PANEL} stroke={tb.color} strokeWidth={1.8}
            strokeDasharray={perimeter} strokeDashoffset={perimeter * (1 - clamp01(skeletonU * 2 - i * 0.25))} />
          <text x={tb.x + 24} y={tb.y + 32} fill={colors.TEXT} fontSize={17} fontWeight={750}>{tb.key}</text>
          <text x={tb.x + tb.w - 24} y={tb.y + 30} textAnchor="end" fill={tb.tag === 'new' ? tb.color : colors.MUTED} fontSize={10.5} fontFamily={mono}>
            {tb.tag === 'new' ? '+ new table' : '~ changed'}</text>
        </g>;
      })}

      {/* projects columns */}
      <g opacity={tblOp(0) * projU}>
        {PROJECT_COLS.map((col, i) => {
          const gone = col.moves ? dropU : 0;
          return <g key={col.name} opacity={1 - gone * 0.92} transform={`translate(${gone * 22} 0)`}>
            <rect x={112} y={176 + i * 27} width={256} height={22} rx={6}
              fill={col.moves && oddU > 0.05 ? colors.WARM : colors.BG}
              fillOpacity={col.moves && oddU > 0.05 ? 0.08 + 0.1 * oddU : 1}
              stroke={col.moves && oddU > 0.05 ? colors.WARM : colors.MUTED} strokeOpacity={col.moves ? 0.9 : 0.3} />
            <text x={126} y={192 + i * 27} fill={col.moves ? colors.WARM : colors.MUTED} fontSize={11.5} fontFamily={mono}>{col.name}</text>
            {col.moves && dropU > 0.1 && <line x1={122} y1={187 + i * 27} x2={362} y2={187 + i * 27} stroke={colors.NEGATIVE} strokeWidth={2.2} opacity={dropU}
              strokeDasharray="240" strokeDashoffset={240 * (1 - dropU)} />}
          </g>;
        })}
        {dropU > 0.6 && <text x={112} y={338} fill={colors.POSITIVE} fontSize={10.5} fontFamily={mono} opacity={(dropU - 0.6) * 2.5}>DROP COLUMN ×3 · fallback deleted</text>}
      </g>

      {/* project_environments columns + backfilled rows note */}
      <g opacity={tblOp(1) * envU}>
        {ENV_COLS.map((col, i) => (
          <text key={col} x={666} y={178 + i * 22} fill={i === 1 ? colors.ACCENT : i === 3 ? colors.POSITIVE : colors.MUTED} fontSize={11.5} fontFamily={mono}
            opacity={clamp01(envU * 6 - i * 0.5)}>{col}</text>
        ))}
        <g opacity={inheritU}>
          <text x={905} y={244} fill={colors.POSITIVE} fontSize={10.5} fontFamily={mono}>✦ one default row</text>
          <text x={905} y={264} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>others inherit instructions</text>
          <text x={905} y={282} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>+ logins unless they set their own</text>
          <path d="M 910 250 C 890 262, 890 268, 908 276" fill="none" stroke={colors.POSITIVE} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.8} />
        </g>
        <g opacity={clamp01(backfillU * 2 - 0.5)}>
          <line x1={664} y1={332} x2={1086} y2={332} stroke={colors.MUTED} strokeOpacity={0.3} />
          <text x={666} y={356} fill={colors.WARM} fontSize={11} fontFamily={mono}>backfill rows:</text>
          <text x={666} y={374} fill={colors.MUTED} fontSize={10.5} fontFamily={mono} opacity={clamp01(backfillU * 3 - 1)}>
            reachable → <tspan fill={colors.POSITIVE}>production ✦</tspan> · PR url → <tspan fill={colors.SECONDARY}>preview</tspan> · localhost → <tspan fill={colors.ACCENT}>local dev</tspan></text>
        </g>
      </g>

      {/* test_runs: nullable env id → backfill → NOT NULL */}
      <g opacity={tblOp(2) * runsAddU}>
        <text x={114} y={478} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>id · project_id · url</text>
        <text x={114} y={502} fill={colors.SECONDARY} fontSize={11.5} fontFamily={mono}>+ environment_id → project_environments.id
          <tspan fill={runLockU > 0.5 ? colors.POSITIVE : colors.MUTED}>  {runLockU > 0.5 ? 'NOT NULL' : 'nullable'}</tspan></text>
        <g opacity={clamp01(runFillU * 2)}>
          <text x={114} y={532} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>run 418 · app.example.com <tspan fill={colors.POSITIVE}>→ production (match)</tspan></text>
        </g>
        <g opacity={clamp01(runFillU * 2 - 0.7)}>
          <text x={114} y={552} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>run 302 · localhost:3000 <tspan fill={colors.ACCENT}>→ local dev (classified)</tspan></text>
        </g>
        {runLockU > 0.5 && <text x={114} y={580} fill={colors.POSITIVE} fontSize={10.5} fontFamily={mono} opacity={(runLockU - 0.5) * 2}>every run has a world → SET NOT NULL</text>}
      </g>

      {/* journey_environments: join table, backfilled everywhere */}
      <g opacity={tblOp(3) * jeAddU}>
        <text x={664} y={498} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>journey_id → journeys.id</text>
        <text x={664} y={520} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>environment_id → project_environments.id</text>
        <g opacity={jeFillU}>
          <text x={664} y={550} fill={colors.POSITIVE} fontSize={10.5} fontFamily={mono}>backfill: every journey × every environment ✓</text>
          <text x={664} y={568} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>day one = today · opt-outs come later</text>
        </g>
      </g>

      {/* relationships */}
      {fkU > 0 && <g opacity={fkU * Math.min(tblOp(0), tblOp(1))}>
        <path d="M 390 240 C 480 240, 540 240, 640 240" fill="none" stroke={colors.ACCENT} strokeWidth={2.4}
          strokeDasharray="250" strokeDashoffset={250 * (1 - fkU)} />
        <text x={410} y={228} fill={colors.ACCENT} fontSize={13} fontWeight={700}>1</text>
        <path d="M 640 240 L 620 228 M 640 240 L 620 240 M 640 240 L 620 252" stroke={colors.ACCENT} strokeWidth={2} fill="none" />
        <text x={604} y={270} fill={colors.ACCENT} fontSize={13} fontWeight={700}>∞</text>
        <text x={452} y={262} fill={colors.MUTED} fontSize={10} fontFamily={mono}>one → many</text>
      </g>}
      {runsAddU > 0 && <path d="M 560 500 C 600 500, 620 440, 660 400" fill="none" stroke={colors.SECONDARY} strokeWidth={1.6}
        strokeDasharray="5 5" opacity={0.6 * runsAddU * Math.min(tblOp(1), tblOp(2))} />}
      {jeAddU > 0 && <path d="M 875 452 C 875 430, 875 410, 875 386" fill="none" stroke={colors.POSITIVE} strokeWidth={1.6}
        strokeDasharray="5 5" opacity={0.6 * jeAddU * Math.min(tblOp(1), tblOp(3))} />}

      {/* dry-run chip + read-path feature flag, in the mid band */}
      {dryU > 0 && <g opacity={dryU * tblOp(1) * (1 - closeU)} transform="translate(420 356)">
        <rect width={205} height={58} rx={12} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
        <text x={16} y={24} fill={colors.WARM} fontSize={11} fontFamily={mono}>backfill --project-id …</text>
        <text x={16} y={44} fill={colors.MUTED} fontSize={11} fontFamily={mono}>dry run · mutate with <tspan fill={colors.NEGATIVE}>--live</tspan></text>
      </g>}
      {flagU > 0 && <g opacity={flagU}>
        <g transform="translate(420 560)">
          <rect width={168} height={40} rx={20} fill={colors.BG} stroke={flipU > 0.5 ? colors.POSITIVE : colors.MUTED} strokeWidth={1.8} />
          <circle cx={lerp(22, 146, flipU)} cy={20} r={13} fill={flipU > 0.5 ? colors.POSITIVE : colors.MUTED} />
          <text x={lerp(94, 70, flipU)} y={25} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily={mono}>{flipU > 0.5 ? 'env_reads: ON' : 'env_reads: OFF'}</text>
        </g>
        <text x={420} y={620} fill={flipU > 0.5 ? colors.POSITIVE : colors.MUTED} fontSize={10.5} fontFamily={mono}>
          {flipU > 0.5 ? 'flipped after backfill · flip back = instant rollback' : 'ships dark · old columns still serve reads'}</text>
      </g>}

      {/* close */}
      {closeU > 0 && <g opacity={closeU}>
        <rect x={235} y={220} width={810} height={190} rx={26} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={800}>four tables · three steps · no flag day</text>
        <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={17} fontFamily={mono}>projects ~ · project_environments + · test_runs ~ · journey_environments +</text>
        <text x={640} y={374} textAnchor="middle" fill={colors.POSITIVE} fontSize={17}>additive first · dry run before live · drop columns last</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
