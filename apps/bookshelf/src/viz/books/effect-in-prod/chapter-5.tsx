// The Service, Assembled
//
// Grounding: packages/effect/src/Context.ts (Context.Service — a typed key
// plus an interface) and ai-docs/src/01_effect/03_services/01_service.ts
// (class Database extends Context.Service... "myapp/db/Database", static
// layer via Layer.effect). ai-docs/.../20_layer-composition.ts — the real
// UserRepository example: SqlClientLayer = PgClient.layerConfig({ url:
// Config.redacted("DATABASE_URL") }); UserRepository.layerNoDeps requires
// SqlClient.SqlClient; Layer.provide exposes only UserRepository;
// Layer.provideMerge exposes both. packages/effect/src/Layer.ts — "Layers
// can manage scoped resources, memoize shared services".
// packages/effect/src/ManagedRuntime.ts — "builds the services from a layer,
// keeps those services available for repeated effect runs, and releases
// acquired resources when it is disposed".
//
// Centerpiece: BLUEPRINTS CRYSTALLIZE INTO A RUNNING MACHINE — dashed layer
// recipes wire together, a build sweep solidifies them bottom-up (once —
// memoized), requests stream through the built graph, and dispose tears it
// down in reverse. Ends with the four-chapter recap on a quiet stage.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, Packet } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The graph — the repo's own docs example, drawn as cards.
// ---------------------------------------------------------------------------

const APP = { x: 640, y: 132, w: 330, h: 64 };
const REPO = { x: 470, y: 320, w: 360, h: 112 };
const SQL = { x: 640, y: 520, w: 400, h: 96 };

const CAM_REPO: CameraState = { x: 520, y: 330, k: 1.4 };
const CAM_SQL: CameraState = { x: 640, y: 470, k: 1.32 };
const CAM_MEMO: CameraState = { x: 700, y: 380, k: 1.15 };

// build sweep: bottom-up; each card solidifies as the line passes it
const sweepY = (u: number) => 640 - 540 * u;
const sqlBuilt = (u: number) => clamp01((u - 0.18) / 0.18);
const repoBuilt = (u: number) => clamp01((u - 0.58) / 0.18);

// recap miniatures (chapters 1–4), drawn as tiny static machines
const MINIS = [
  { x: 250, label: 'ch 1 · the fiber tree' },
  { x: 510, label: 'ch 2 · safe interruption' },
  { x: 770, label: 'ch 3 · retries + jitter' },
  { x: 1030, label: 'ch 4 · the trace' },
];
const MINI_Y = 420;

// ---------------------------------------------------------------------------
// Timeline (~78s, 12 beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const cardU = tl.channel('cardU', 0); // UserRepository service card
  const layerU = tl.channel('layerU', 0); // "a Layer is the recipe" framing
  const holeU = tl.channel('holeU', 0); // the SqlClient requirement port
  const sqlU = tl.channel('sqlU', 0); // SqlClientLayer card
  const wireU = tl.channel('wireU', 0); // Layer.provide wiring + seal
  const mergeU = tl.channel('mergeU', 0); // provideMerge note
  const sweepU = tl.channel('sweepU', 0); // ManagedRuntime build sweep
  const appU = tl.channel('appU', 0); // program node + edges
  const memoU = tl.channel('memoU', 0); // "built once · shared" flag
  const flowU = tl.channel('flowU', 0); // requests stream through
  const disposeU = tl.channel('disposeU', 0); // reverse teardown
  const miniU = tl.channel('miniU', 0); // recap miniatures
  const finalU = tl.channel('finalU', 0); // closing title

  // — beat 1 · a million requests —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: "Everything so far was one request's story. A service is that story told a million times — and every telling needs the same wiring: a database, a repository, a tracer.",
  });

  // — beat 2 · a service is a typed key —
  tl.caption({
    at: 7.0,
    dur: 5.6,
    text: "In Effect, a dependency is a service: a typed key plus an interface. Here's a user repository — one method, find by id.",
  });
  tl.tween(cam, CAM_REPO, { at: 7.2, dur: 1.3, ease: ease.move });
  tl.tween(cardU, 1, { at: 7.6, dur: 0.9, ease: ease.enter });

  // — beat 3 · a layer is the recipe —
  tl.caption({
    at: 13.1,
    dur: 5.6,
    text: 'A layer is the recipe for building it: what it produces, what it needs, and how construction can fail. Dashed means not built yet — a plan, not a thing.',
  });
  tl.tween(layerU, 1, { at: 13.5, dur: 0.8, ease: ease.enter });

  // — beat 4 · the hole in the recipe —
  tl.caption({
    at: 19.2,
    dur: 5.4,
    text: "This recipe has a hole in it: the repository needs a database client. The requirement is part of the type — you can't pretend it away.",
  });
  tl.tween(holeU, 1, { at: 19.6, dur: 1.0, ease: ease.pop });

  // — beat 5 · the client's own recipe —
  tl.caption({
    at: 25.1,
    dur: 5.4,
    text: 'The client has its own recipe, built from configuration — the connection string comes in as config, not as a hardcoded secret.',
  });
  tl.tween(cam, CAM_SQL, { at: 25.3, dur: 1.3, ease: ease.move });
  tl.tween(sqlU, 1, { at: 25.7, dur: 0.9, ease: ease.enter });

  // — beat 6 · Layer.provide —
  tl.caption({
    at: 31.0,
    dur: 5.8,
    text: "Compose them: provide plugs the client's recipe into the repository's hole and seals it. From outside, only the repository is visible.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 31.2, dur: 1.4, ease: ease.move });
  tl.tween(wireU, 1, { at: 31.8, dur: 1.6, ease: ease.draw });
  tl.tween(mergeU, 1, { at: 34.4, dur: 0.8, ease: ease.enter });

  // — beat 7 · ManagedRuntime builds it once —
  tl.caption({
    at: 37.3,
    dur: 5.6,
    text: 'Now build it — once. A managed runtime takes the composed layer and constructs every service, dependencies first.',
  });
  tl.tween(sweepU, 1, { at: 37.9, dur: 4.2, ease: ease.move });

  // — beat 8 · memoized —
  tl.caption({
    at: 43.4,
    dur: 5.8,
    text: "And here's the quiet superpower: layers are memoized. If two parts of your app both need the client, they get the same single instance — not two connection pools.",
  });
  tl.tween(cam, CAM_MEMO, { at: 43.6, dur: 1.3, ease: ease.move });
  tl.tween(appU, 1, { at: 44.0, dur: 1.2, ease: ease.enter });
  tl.tween(memoU, 1, { at: 45.6, dur: 0.8, ease: ease.pop });

  // — beat 9 · requests just run —
  tl.caption({
    at: 49.7,
    dur: 5.4,
    text: 'From then on, requests just run. The wiring is settled — every request from every chapter flows through the same built services.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 49.9, dur: 1.3, ease: ease.move });
  tl.tween(flowU, 3, { at: 50.1, dur: 8.0, ease: ease.linear });

  // — beat 10 · dispose, in reverse —
  tl.caption({
    at: 55.6,
    dur: 5.6,
    text: 'When the service shuts down, dispose releases everything in reverse order — the repository lets go before the client closes its connections.',
  });
  tl.tween(disposeU, 1, { at: 56.4, dur: 3.0, ease: ease.move });

  // — beat 11 · step back —
  tl.caption({
    at: 61.6,
    dur: 5.4,
    text: 'Step back and look at what you assembled across this whole book.',
  });
  tl.tween(miniU, 1, { at: 62.2, dur: 2.6, ease: ease.enter });

  // — beat 12 · Effect in prod —
  tl.caption({
    at: 67.4,
    dur: 7.2,
    text: 'Fork the work and own every fiber. Cancel between the steps. Retry with jitter and a budget. Trace every hop. Build the wiring once. That is Effect in production.',
  });
  tl.tween(finalU, 1, { at: 68.2, dur: 1.0, ease: ease.enter });
  tl.hold(74.6, 1.4);

  return {
    tl,
    cam,
    cardU,
    layerU,
    holeU,
    sqlU,
    wireU,
    mergeU,
    sweepU,
    appU,
    memoU,
    flowU,
    disposeU,
    miniU,
    finalU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Card({
  cx,
  cy,
  w,
  h,
  title,
  lines,
  builtU,
  tornU = 0,
  u,
  color,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  title: string;
  lines: string[];
  builtU: number; // 0 = dashed blueprint, 1 = solid lit service
  tornU?: number; // dispose: back to dim
  u: number;
  color: string;
}) {
  if (u <= 0.001) return null;
  const lit = builtU * (1 - tornU);
  return (
    <g opacity={u * (1 - tornU * 0.55)}>
      {lit > 0.01 && (
        <rect x={cx - w / 2 - 5} y={cy - h / 2 - 5} width={w + 10} height={h + 10} rx={16} fill={color} opacity={0.14 * lit} />
      )}
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={12}
        fill={colors.PANEL}
        stroke={color}
        strokeWidth={lit > 0.5 ? 2.2 : 1.5}
        strokeDasharray={lit > 0.5 ? undefined : '7 5'}
      />
      <text x={cx - w / 2 + 16} y={cy - h / 2 + 26} fill={color} fontSize={15} fontFamily={MONO} fontWeight={600}>
        {title}
      </text>
      {lines.filter(Boolean).map((ln, i) => (
        <text key={i} x={cx - w / 2 + 16} y={cy - h / 2 + 48 + i * 19} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
          {ln}
        </text>
      ))}
    </g>
  );
}

/** tiny static machines for the recap */
function Mini({ i, x, u }: { i: number; x: number; u: number }) {
  const y = MINI_Y;
  const c = [colors.SECONDARY, colors.WARM, colors.ACCENT, colors.TEAL][i];
  return (
    <g opacity={u}>
      <rect x={x - 105} y={y - 70} width={210} height={118} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
      {i === 0 && (
        <g stroke={c} strokeWidth={2.5} fill="none" strokeLinecap="round">
          <path d={`M${x - 80} ${y} h130`} />
          <path d={`M${x - 45} ${y} l18 -24 h60`} />
          <path d={`M${x - 20} ${y} l18 22 h45`} />
        </g>
      )}
      {i === 1 && (
        <g>
          <rect x={x - 80} y={y - 12} width={160} height={24} rx={6} fill="none" stroke={c} strokeWidth={2} />
          <rect x={x - 30} y={y - 12} width={52} height={24} rx={6} fill={c} opacity={0.3} />
          {[0, 1, 2].map((k) => (
            <line key={k} x1={x - 24 + k * 16} y1={y - 9} x2={x - 15 + k * 16} y2={y + 9} stroke={c} strokeWidth={1.4} />
          ))}
          <circle cx={x - 38} cy={y} r={5} fill={colors.NEGATIVE} />
        </g>
      )}
      {i === 2 && (
        <g fill={c} opacity={0.85}>
          {[8, 16, 32, 56].map((h, k) => (
            <rect key={k} x={x - 60 + k * 32} y={y + 16 - h} width={20} height={h} rx={3} />
          ))}
        </g>
      )}
      {i === 3 && (
        <g fill="none" stroke={c} strokeWidth={5} strokeLinecap="round">
          <path d={`M${x - 75} ${y - 18} h130`} />
          <path d={`M${x - 55} ${y} h70`} />
          <path d={`M${x - 35} ${y + 18} h55`} opacity={0.7} />
        </g>
      )}
      <text x={x} y={y + 38} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
        {MINIS[i].label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cardU = s.get(scene.cardU);
  const layerU = s.get(scene.layerU);
  const holeU = s.get(scene.holeU);
  const sqlU = s.get(scene.sqlU);
  const wireU = s.get(scene.wireU);
  const mergeU = s.get(scene.mergeU);
  const sweepU = s.get(scene.sweepU);
  const appU = s.get(scene.appU);
  const memoU = s.get(scene.memoU);
  const flowU = s.get(scene.flowU);
  const disposeU = s.get(scene.disposeU);
  const miniU = s.get(scene.miniU);
  const finalU = s.get(scene.finalU);

  const sqlB = sqlBuilt(sweepU);
  const repoB = repoBuilt(sweepU);
  const repoTear = clamp01(disposeU * 2);
  const sqlTear = clamp01(disposeU * 2 - 1);
  const graphDim = 1 - miniU * 0.9;
  const portY = REPO.y + REPO.h / 2;
  const flowing = flowU > 0.01 && disposeU < 0.05;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={graphDim}>
          {/* ---------------- the graph ---------------- */}
          {/* wiring repo → sql */}
          {wireU > 0.01 && (
            <g opacity={clamp01(wireU * 1.4)}>
              <Connection
                from={{ x: REPO.x, y: portY }}
                to={{ x: SQL.x, y: SQL.y - SQL.h / 2 }}
                elbow="v"
                u={wireU}
                flow={flowing ? flowU * 2 : 0}
                color={sqlB > 0.5 ? colors.TEAL : colors.MUTED}
              />
              <text x={REPO.x - 24} y={(portY + SQL.y - SQL.h / 2) / 2 + 26} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                Layer.provide(SqlClientLayer)
              </text>
            </g>
          )}
          {/* app edges */}
          {appU > 0.01 && (
            <g opacity={appU}>
              <Connection
                from={{ x: APP.x - 60, y: APP.y + APP.h / 2 }}
                to={{ x: REPO.x + 40, y: REPO.y - REPO.h / 2 }}
                elbow="v"
                u={appU}
                flow={flowing ? flowU * 2 : 0}
                color={colors.GRID}
              />
              <Connection
                from={{ x: APP.x + 130, y: APP.y + APP.h / 2 }}
                via={[{ x: 1010, y: 400 }]}
                to={{ x: SQL.x + SQL.w / 2, y: SQL.y - 14 }}
                u={appU}
                flow={flowing ? flowU * 2 : 0}
                color={colors.GRID}
                label={mergeU > 0.3 ? 'Layer.provideMerge → SqlClient exposed too' : undefined}
                labelSize={11}
              />
            </g>
          )}

          {/* the program */}
          {appU > 0.01 && (
            <g opacity={appU}>
              <rect x={APP.x - APP.w / 2} y={APP.y - APP.h / 2} width={APP.w} height={APP.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
              <text x={APP.x} y={APP.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={14.5} fontFamily={MONO}>
                your program
              </text>
              <text x={APP.x} y={APP.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                runtime.runPromise(handle(req))
              </text>
            </g>
          )}

          {/* UserRepository card */}
          <Card
            cx={REPO.x}
            cy={REPO.y}
            w={REPO.w}
            h={REPO.h}
            title="UserRepository"
            lines={['Context.Service · "myapp/UserRepository"', 'findById(id) → Option<User>', layerU > 0.3 ? 'Layer.effect(UserRepository, …)' : '']}
            builtU={repoB}
            tornU={repoTear}
            u={cardU}
            color={colors.SECONDARY}
          />
          {/* the requirement port */}
          {holeU > 0.01 && (
            <g opacity={holeU * (1 - wireU * 0.4)}>
              <circle
                cx={REPO.x}
                cy={portY}
                r={11}
                fill={wireU > 0.6 ? colors.TEAL : colors.BG}
                stroke={wireU > 0.6 ? colors.TEAL : colors.NEGATIVE}
                strokeWidth={2.2}
                strokeDasharray={wireU > 0.6 ? undefined : '4 3'}
              />
              <text x={REPO.x + 20} y={portY + 5} fill={wireU > 0.6 ? colors.TEAL : colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>
                {wireU > 0.6 ? 'sealed' : 'needs: SqlClient.SqlClient'}
              </text>
            </g>
          )}

          {/* SqlClient card */}
          <Card
            cx={SQL.x}
            cy={SQL.y}
            w={SQL.w}
            h={SQL.h}
            title="SqlClient"
            lines={['PgClient.layerConfig({', '  url: Config.redacted("DATABASE_URL") })']}
            builtU={sqlB}
            tornU={sqlTear}
            u={sqlU}
            color={colors.TEAL}
          />

          {/* memo flag */}
          {memoU > 0.01 && (
            <g opacity={memoU * (1 - disposeU)}>
              <rect x={SQL.x + SQL.w / 2 - 10} y={SQL.y - 66} width={190} height={36} rx={9} fill={colors.BG} stroke={colors.POSITIVE} />
              <text x={SQL.x + SQL.w / 2 + 85} y={SQL.y - 43} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO}>
                memoized · built once
              </text>
            </g>
          )}

          {/* build sweep */}
          {sweepU > 0.005 && sweepU < 0.995 && (
            <g>
              <line x1={90} y1={sweepY(sweepU)} x2={1190} y2={sweepY(sweepU)} stroke={colors.POSITIVE} strokeWidth={2} opacity={0.7} strokeDasharray="10 7" />
              <text x={1186} y={sweepY(sweepU) - 8} textAnchor="end" fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO}>
                ManagedRuntime.make(UserRepository.layer)
              </text>
            </g>
          )}

          {/* requests streaming */}
          {flowing && (
            <g>
              {[0, 1, 2].map((k) => (
                <Packet
                  key={k}
                  from={{ x: 120, y: APP.y }}
                  to={{ x: APP.x - APP.w / 2, y: APP.y }}
                  u={(flowU * 0.9 + k * 0.33) % 1}
                  r={6}
                  color={colors.WARM}
                />
              ))}
              <text x={120} y={APP.y - 24} fill={colors.MUTED} fontSize={12}>
                requests
              </text>
            </g>
          )}

          {/* dispose sweep */}
          {disposeU > 0.01 && (
            <g opacity={clamp01(disposeU * 1.6)}>
              <rect x={430} y={228} width={420} height={34} rx={9} fill={colors.BG} stroke={colors.NEGATIVE} opacity={0.9} />
              <text x={640} y={250} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                runtime.dispose() → release in reverse order
              </text>
              {repoTear > 0.5 && (
                <text x={REPO.x - REPO.w / 2 - 14} y={REPO.y} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO} opacity={repoTear}>
                  1st
                </text>
              )}
              {sqlTear > 0.5 && (
                <text x={SQL.x - SQL.w / 2 - 14} y={SQL.y} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO} opacity={sqlTear}>
                  2nd
                </text>
              )}
            </g>
          )}
        </g>

        {/* ---------------- the recap ---------------- */}
        {miniU > 0.01 && (
          <g opacity={miniU}>
            <rect x={0} y={0} width={STAGE_W} height={STAGE_H} fill={colors.BG} opacity={0.88} />
            {MINIS.map((m, i) => (
              <Mini key={i} i={i} x={m.x} u={clamp01(miniU * 4 - i * 0.8)} />
            ))}
            {finalU > 0.01 && (
              <g opacity={finalU}>
                <text x={640} y={210} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={700}>
                  Effect in Prod
                </text>
                <text x={640} y={248} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                  fork it · cancel it safely · retry it with jitter · trace it · build it once
                </text>
              </g>
            )}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
