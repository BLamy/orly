// One Project, Many Environments — chapter 2: The Database Solution.
// The overlay design, presented on its own terms: project fields are the
// project-wide defaults; project_environments rows shadow them per world with
// resolution-time fallback; test_runs gains one nullable column; journeys get
// an exclusions table. Everything additive.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const PROJECT_COLS = [
  { name: 'id', dfl: false },
  { name: 'name', dfl: false },
  { name: 'repo', dfl: false },
  { name: 'target_url', dfl: true },
  { name: 'test_instructions', dfl: true },
  { name: 'global_variables · logins', dfl: true },
] as const;

const ENV_COLS = [
  { name: 'project_id → projects.id', opt: false },
  { name: 'name · kind', opt: false },
  { name: 'target_url', opt: true },
  { name: 'test_instructions', opt: true },
  { name: 'environment_variables', opt: true },
  { name: 'trigger_config', opt: false },
] as const;

const CARDS = [
  { key: 'projects', x: 90, y: 96, w: 330, h: 218, color: colors.ACCENT, tag: 'defaults' },
  { key: 'project_environments', x: 640, y: 96, w: 470, h: 218, color: colors.WARM, tag: 'overlay' },
  { key: 'test_runs', x: 90, y: 478, w: 460, h: 104, color: colors.SECONDARY, tag: '+ one column' },
  { key: 'journey_exclusions', x: 640, y: 478, w: 470, h: 104, color: colors.POSITIVE, tag: 'new' },
] as const;

const ENV_ROWS = [
  { name: 'production', color: colors.POSITIVE },
  { name: 'staging', color: colors.WARM },
  { name: 'preview · PR 421', color: colors.SECONDARY },
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const focus = tl.channel('focus', 0);       // 0 all · 1..4 = CARDS index+1
  const projU = tl.channel('projU', 0);       // projects card + columns
  const defaultU = tl.channel('defaultU', 0); // the three default badges
  const envU = tl.channel('envU', 0);         // overlay table
  const fkU = tl.channel('fkU', 0);           // 1—∞
  const rowsU = tl.channel('rowsU', 0);       // production/staging/preview chips
  const resolveU = tl.channel('resolveU', 0); // fallback-chain panel
  const look1U = tl.channel('look1U', 0);     // staging overrides login
  const look2U = tl.channel('look2U', 0);     // staging inherits instructions
  const safeU = tl.channel('safeU', 0);       // no envs → works like today
  const runsU = tl.channel('runsU', 0);       // test_runs nullable env id
  const jeU = tl.channel('jeU', 0);           // exclusions table
  const jeRowU = tl.channel('jeRowU', 0);     // the stripe × production row
  const footU = tl.channel('footU', 0);       // additive footprint line
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6.4, text: 'Here is the design. The project keeps its target URL, its test instructions, and its global variables — and they take on a clear role: the project wide defaults.' });
  tl.tween(projU, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 430, y: 260, k: 1.22 }, { at: 1.2, dur: 1.4, ease: ease.move });
  tl.tween(focus, 1, { at: 1.2, dur: 0.8, ease: ease.move });
  tl.tween(defaultU, 1, { at: 3.4, dur: 1.4, ease: ease.enter });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 6.4, text: 'Next to it, project environments. An environment is an overlay: a name, a kind, a trigger, and three optional fields that shadow the defaults.' });
  tl.tween(focus, 2, { at: t - 6.0, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 750, y: 260, k: 1.16 }, { at: t - 5.8, dur: 1.3, ease: ease.move });
  tl.tween(envU, 1, { at: t - 5.2, dur: 1.6, ease: ease.draw });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'The foreign key makes it one project, many environments: production, staging, and a preview for every pull request, all standing on the same defaults.' });
  tl.tween(fkU, 1, { at: t - 5.6, dur: 1.2, ease: ease.draw });
  tl.tween(rowsU, 1, { at: t - 3.8, dur: 1.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Reading configuration is a fallback chain. If the environment defines a value, it wins. If it does not, the run inherits the project default.' });
  tl.tween(focus, 0, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 640, y: 320, k: 1.08 }, { at: t - 5.6, dur: 1.3, ease: ease.move });
  tl.tween(resolveU, 1, { at: t - 4.8, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'So staging can override just the login while inheriting the instructions, and a preview can override just the URL. Each environment states only what makes it different.' });
  tl.tween(look1U, 1, { at: t - 5.6, dur: 1.2, ease: ease.move });
  tl.tween(look2U, 1, { at: t - 3.6, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6, text: 'And a project with no environments resolves every field to its own defaults. Existing projects keep working exactly as they do today, without touching a single row.' });
  tl.tween(safeU, 1, { at: t - 5.0, dur: 0.8, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'Test runs record which environment they ran in, through one nullable column. Null means the project defaults, which keeps every run we have ever recorded truthful.' });
  tl.tween(focus, 3, { at: t - 6.0, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 460, y: 450, k: 1.16 }, { at: t - 5.8, dur: 1.3, ease: ease.move });
  tl.tween(runsU, 1, { at: t - 5.0, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Journeys get an exclusions table. Empty means a journey runs everywhere. One row keeps stripe checkout out of production.' });
  tl.tween(focus, 4, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 780, y: 460, k: 1.16 }, { at: t - 5.6, dur: 1.3, ease: ease.move });
  tl.tween(jeU, 1, { at: t - 4.8, dur: 1.2, ease: ease.enter });
  tl.tween(jeRowU, 1, { at: t - 2.4, dur: 0.8, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'Two new tables, one nullable column, and every change is additive. Environments are overlays, and the defaults we already have are the floor they stand on.' });
  tl.tween(focus, 0, { at: t - 6.0, dur: 0.9, ease: ease.move });
  tl.tween(cam, { x: 640, y: 340, k: 1.0 }, { at: t - 5.8, dur: 1.5, ease: ease.move });
  tl.tween(footU, 1, { at: t - 4.6, dur: 0.9, ease: ease.enter });
  tl.tween(closeU, 1, { at: t - 2.6, dur: 1.0, ease: ease.enter });
  tl.tween(projU, 0.15, { at: t - 2.8, dur: 1.0, ease: ease.move });
  tl.tween(envU, 0.15, { at: t - 2.8, dur: 1.0, ease: ease.move });
  tl.tween(runsU, 0.15, { at: t - 2.8, dur: 1.0, ease: ease.move });
  tl.tween(jeU, 0.15, { at: t - 2.8, dur: 1.0, ease: ease.move });
  tl.tween(resolveU, 0.12, { at: t - 2.8, dur: 1.0, ease: ease.move });
  tl.tween(footU, 0, { at: t - 2.8, dur: 0.8, ease: ease.move });
  tl.hold(t, 1.0);
  return { tl, cam, focus, projU, defaultU, envU, fkU, rowsU, resolveU, look1U, look2U, safeU, runsU, jeU, jeRowU, footU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const focus = s.get(scene.focus);
  const projU = s.get(scene.projU);
  const defaultU = s.get(scene.defaultU);
  const envU = s.get(scene.envU);
  const fkU = s.get(scene.fkU);
  const rowsU = s.get(scene.rowsU);
  const resolveU = s.get(scene.resolveU);
  const look1U = s.get(scene.look1U);
  const look2U = s.get(scene.look2U);
  const safeU = s.get(scene.safeU);
  const runsU = s.get(scene.runsU);
  const jeU = s.get(scene.jeU);
  const jeRowU = s.get(scene.jeRowU);
  const footU = s.get(scene.footU);
  const closeU = s.get(scene.closeU);

  const cardOp = (i: number) => {
    const active = clamp01(1 - Math.abs(focus - (i + 1)));
    return lerp(1, lerp(0.15, 1, active), clamp01(focus));
  };
  const cardU = [projU, envU, runsU, jeU];

  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {/* card frames */}
      {CARDS.map((c, i) => cardU[i]! > 0 && <g key={c.key} opacity={cardU[i]! * cardOp(i)}>
        <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={18} fill={colors.PANEL} stroke={c.color}
          strokeWidth={1.8 + 1.6 * footU} />
        <text x={c.x + 24} y={c.y + 32} fill={colors.TEXT} fontSize={17} fontWeight={750}>{c.key}</text>
        <text x={c.x + c.w - 24} y={c.y + 30} textAnchor="end" fill={c.color} fontSize={10.5} fontFamily={mono}>{c.tag}</text>
      </g>)}

      {/* projects — the defaults */}
      <g opacity={projU * cardOp(0)}>
        {PROJECT_COLS.map((col, i) => <g key={col.name}>
          <rect x={112} y={140 + i * 28} width={286} height={23} rx={6}
            fill={col.dfl && defaultU > 0.05 ? colors.POSITIVE : colors.BG}
            fillOpacity={col.dfl && defaultU > 0.05 ? 0.07 + 0.07 * defaultU : 1}
            stroke={col.dfl && defaultU > 0.05 ? colors.POSITIVE : colors.MUTED} strokeOpacity={col.dfl ? 0.75 : 0.3} />
          <text x={126} y={156 + i * 28} fill={col.dfl && defaultU > 0.05 ? colors.POSITIVE : colors.MUTED} fontSize={11.5} fontFamily={mono}>{col.name}</text>
          {col.dfl && defaultU > 0.5 && <text x={392} y={156 + i * 28} textAnchor="end" fill={colors.POSITIVE} fontSize={9.5} fontFamily={mono} opacity={(defaultU - 0.5) * 2}>default</text>}
        </g>)}
        {safeU > 0 && <g opacity={safeU} transform="translate(112 322)">
          <rect width={286} height={26} rx={13} fill={colors.POSITIVE} opacity={0.12} />
          <text x={143} y={17.5} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily={mono}>no environments? works like today ✓</text>
        </g>}
      </g>

      {/* project_environments — the overlay */}
      <g opacity={envU * cardOp(1)}>
        {ENV_COLS.map((col, i) => <g key={col.name} opacity={clamp01(envU * 5 - i * 0.5)}>
          <text x={666} y={146 + i * 27} fill={i === 0 ? colors.ACCENT : colors.MUTED} fontSize={11.5} fontFamily={mono}>{col.name}</text>
          {col.opt && <text x={1084} y={146 + i * 27} textAnchor="end" fill={colors.WARM} fontSize={9.5} fontFamily={mono}>optional · shadows default</text>}
        </g>)}
        {/* environment chips */}
        {ENV_ROWS.map((row, i) => {
          const u = clamp01(rowsU * 3 - i * 0.7);
          return <g key={row.name} opacity={u} transform={`translate(${666 + i * 152} ${330 - 10 * (1 - u)})`}>
            <rect width={140} height={30} rx={15} fill={colors.BG} stroke={row.color} strokeWidth={1.4} />
            <text x={70} y={20} textAnchor="middle" fill={row.color} fontSize={11} fontFamily={mono}>{row.name}</text>
          </g>;
        })}
      </g>

      {/* FK 1—∞ */}
      {fkU > 0 && <g opacity={fkU * Math.min(cardOp(0), cardOp(1))}>
        <path d="M 420 206 C 500 206, 560 206, 640 206" fill="none" stroke={colors.ACCENT} strokeWidth={2.4}
          strokeDasharray="230" strokeDashoffset={230 * (1 - fkU)} />
        <text x={438} y={194} fill={colors.ACCENT} fontSize={13} fontWeight={700}>1</text>
        <path d="M 640 206 L 620 194 M 640 206 L 620 206 M 640 206 L 620 218" stroke={colors.ACCENT} strokeWidth={2} fill="none" />
        <text x={604} y={236} fill={colors.ACCENT} fontSize={13} fontWeight={700}>∞</text>
      </g>}

      {/* the fallback chain */}
      {resolveU > 0 && <g opacity={resolveU}>
        <rect x={250} y={382} width={780} height={88} rx={16} fill={colors.PANEL} stroke={colors.TEXT} strokeOpacity={0.25} />
        <text x={276} y={409} fill={colors.TEXT} fontSize={13.5} fontFamily={mono}>resolve(field) = environment.field <tspan fill={colors.WARM}>??</tspan> project.field</text>
        <g opacity={look1U}>
          <text x={276} y={434} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>staging · login_email</text>
          <text x={560} y={434} fill={colors.WARM} fontSize={11.5} fontFamily={mono}>→ env defines it · overrides ✓</text>
        </g>
        <g opacity={look2U}>
          <text x={276} y={456} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>staging · test_instructions</text>
          <text x={560} y={456} fill={colors.POSITIVE} fontSize={11.5} fontFamily={mono}>→ env unset · inherits the project default ✓</text>
        </g>
      </g>}

      {/* test_runs: one nullable column */}
      <g opacity={runsU * cardOp(2)}>
        <text x={114} y={526} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>id · project_id · url</text>
        <text x={114} y={548} fill={colors.SECONDARY} fontSize={11.5} fontFamily={mono}>+ environment_id → project_environments.id · <tspan fill={colors.MUTED}>nullable</tspan></text>
        <text x={114} y={570} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>null = project defaults — every recorded run still reads true</text>
      </g>

      {/* journey_exclusions */}
      <g opacity={jeU * cardOp(3)}>
        <text x={664} y={526} fill={colors.MUTED} fontSize={11} fontFamily={mono}>journey_id → journeys.id · environment_id → project_environments.id</text>
        <text x={664} y={548} fill={colors.POSITIVE} fontSize={11} fontFamily={mono}>empty table → every journey runs everywhere ✓</text>
        <text x={664} y={570} fill={jeRowU > 0.3 ? colors.NEGATIVE : colors.MUTED} fontSize={11} fontFamily={mono} opacity={0.4 + 0.6 * jeRowU}>exclude: checkout · stripe × production</text>
      </g>

      {/* additive footprint line */}
      {footU > 0 && <text x={640} y={62} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={mono} opacity={footU * (1 - closeU)}>+ 2 tables · + 1 nullable column · everything additive</text>}

      {/* close */}
      {closeU > 0 && <g opacity={closeU}>
        <rect x={235} y={225} width={810} height={185} rx={26} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={800}>defaults below · overlays above</text>
        <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={17} fontFamily={mono}>environment.field ?? project.field</text>
        <text x={640} y={376} textAnchor="middle" fill={colors.POSITIVE} fontSize={17}>one project · many environments · every run names its world</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
