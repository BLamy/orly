// The Wiring Diagram
//
// Grounding: ai-docs/src/01_effect/03_services/20_layer-composition.ts —
// SqlClientLayer = PgClient.layerConfig({ url: Config.redacted("DATABASE_URL") })
// : Layer<PgClient | SqlClient, ConfigError | SqlError>;
// UserRepository.layerNoDeps : Layer<UserRepository, never, SqlClient> (maps
// SqlError into UserRespositoryError); .layer = layerNoDeps.pipe(
// Layer.provide(SqlClientLayer)) exposes ONLY UserRepository;
// .layerWithSqlClient = Layer.provideMerge(...) exposes both.
// ai-docs/src/01_effect/03_services/20_layer-unwrap.ts — MessageStore.layer =
// Layer.unwrap(reads Config.boolean("MESSAGE_STORE_IN_MEMORY") and returns
// layerInMemory or layerRemote(url)).
//
// Centerpiece: layers as factory blocks with typed PORTS — solid lugs on top
// (what a layer provides), dashed notches on the bottom (what it still
// needs), a red risk tag (how construction can fail). Layer.provide slides
// one block INSIDE another (need gone, risk absorbed); provideMerge welds
// them side by side (both surfaces kept); unwrap flips a block's face at
// build time; the finished app is one block with no open notches.
import {
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const LEGEND = { x: 430, y: 210, w: 420, h: 170 } as const;

const REPO = { x: 170, y: 200, w: 340, h: 132 } as const;
const SQL = { x: 170, y: 424, w: 340, h: 132 } as const;

const MERGE = { x: 610, y: 260, w: 520, h: 150 } as const; // the welded pair

const STORE = { x: 400, y: 210, w: 480, h: 190 } as const; // MessageStore (unwrap)

const APP = { x: 430, y: 280, w: 420, h: 160 } as const; // the finished app block

const CAM_LEGEND: CameraState = { x: 640, y: 300, k: 1.26 };
const CAM_LEFT: CameraState = { x: 348, y: 380, k: 1.18 };
const CAM_PROV: CameraState = { x: 348, y: 300, k: 1.26 };
const CAM_MERGE: CameraState = { x: 870, y: 340, k: 1.2 };
const CAM_STORE: CameraState = { x: 640, y: 320, k: 1.22 };
const CAM_APP: CameraState = { x: 640, y: 360, k: 1.14 };
const CAM_END: CameraState = { x: 640, y: 366, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline (~64s, eight beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_LEGEND, cameraInterp);

  const legendU = tl.channel('legendU', 0); // Layer<Out, Err, In> anatomy
  const sqlU = tl.channel('sqlU', 0); // SqlClientLayer block
  const repoU = tl.channel('repoU', 0); // UserRepository.layerNoDeps block
  const provU = tl.channel('provU', 0); // provide: client slides inside
  const mergeU = tl.channel('mergeU', 0); // provideMerge welded pair
  const storeU = tl.channel('storeU', 0); // MessageStore block (left/right fade)
  const flipU = tl.channel('flipU', 0); // 0→1 flip to in-memory, 1→2 back to remote
  const appU = tl.channel('appU', 0); // the finished one-block app
  const teaseU = tl.channel('teaseU', 0); // the scope bracket teaser

  // — beat 1 · construction gets a type —
  tl.caption({
    at: 0.5,
    dur: 7.2,
    text: 'You could build every service by hand at the top of the program. But construction can fail, needs config, and needs other services — so Effect gives construction its own type.',
  });
  tl.caption({
    at: 8.0,
    dur: 5.2,
    text: 'A layer is a recipe with three parts: what it builds, how the building can fail, and what it needs to start.',
  });
  tl.tween(legendU, 1, { at: 0.8, dur: 0.9, ease: ease.enter });

  // — beat 2 · the client layer, built from config —
  tl.caption({
    at: 13.8,
    dur: 7.0,
    text: 'The database client layer is built from config. It reads the database URL and connects — and it can fail before your app even starts. That risk sits right in its type.',
  });
  tl.tween(legendU, 0, { at: 14.0, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_LEFT, { at: 14.1, dur: 1.3, ease: ease.move });
  tl.tween(sqlU, 1, { at: 14.6, dur: 0.9, ease: ease.enter });

  // — beat 3 · the repository still needs the client —
  tl.caption({
    at: 21.4,
    dur: 7.4,
    text: 'The user repository yields the client from context and wraps every query, mapping low-level failures into its own tagged error. Its bottom edge says what it still needs: the client.',
  });
  tl.tween(repoU, 1, { at: 21.9, dur: 0.9, ease: ease.enter });

  // — beat 4 · provide: plug in and hide —
  tl.caption({
    at: 29.4,
    dur: 8.0,
    text: 'Layer dot provide plugs one recipe into another and hides it. The client slides inside; from outside, only the repository is visible. Its need is gone from the type, and the construction risk is absorbed upward.',
  });
  tl.tween(cam, CAM_PROV, { at: 29.6, dur: 1.3, ease: ease.move });
  tl.tween(provU, 1, { at: 30.4, dur: 2.4, ease: ease.move });

  // — beat 5 · provideMerge: keep both surfaces —
  tl.caption({
    at: 38.0,
    dur: 7.0,
    text: 'Provide merge is the same wiring with both surfaces kept: the client stays exposed for anyone else who needs it. You choose your surface area, and the type states it exactly.',
  });
  tl.tween(cam, CAM_MERGE, { at: 38.2, dur: 1.4, ease: ease.move });
  tl.tween(mergeU, 1, { at: 38.8, dur: 1.4, ease: ease.move });

  // — beat 6 · unwrap: choose the recipe at build time —
  tl.caption({
    at: 45.6,
    dur: 8.2,
    text: 'Recipes can even be chosen while the app boots. Unwrap runs an effect that reads config and returns whichever layer fits — an in-memory store under test, a remote store in production. Consumers never see the seam.',
  });
  tl.tween(cam, CAM_STORE, { at: 45.8, dur: 1.4, ease: ease.move });
  tl.tween(storeU, 1, { at: 46.2, dur: 1.0, ease: ease.enter });
  tl.tween(flipU, 1, { at: 48.4, dur: 1.2, ease: ease.move });
  tl.tween(flipU, 2, { at: 51.4, dur: 1.2, ease: ease.move });

  // — beat 7 · one block, no open notches —
  tl.caption({
    at: 54.4,
    dur: 6.8,
    text: 'Keep composing until nothing is left unmet. The whole application becomes one block with no open notches — every requirement filled, every risk accounted for, ready to launch.',
  });
  tl.tween(cam, CAM_APP, { at: 54.6, dur: 1.4, ease: ease.move });
  tl.tween(storeU, 0, { at: 54.7, dur: 0.8, ease: ease.enter });
  tl.tween(appU, 1, { at: 55.4, dur: 2.0, ease: ease.move });

  // — beat 8 · teaser: the teardown promise —
  tl.caption({
    at: 61.8,
    dur: 6.4,
    text: 'And layers make one more promise, quietly: everything they build, they will tear down. That promise has a name — a scope — and it is the last good part in this book.',
  });
  tl.tween(cam, CAM_END, { at: 62.2, dur: 1.5, ease: ease.move });
  tl.tween(teaseU, 1, { at: 63.0, dur: 1.6, ease: ease.draw });
  tl.hold(67.4, 1.2);

  return { tl, cam, legendU, sqlU, repoU, provU, mergeU, storeU, flipU, appU, teaseU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers — the factory block
// ---------------------------------------------------------------------------

interface BlockSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  outs: string[];
  ins: string[];
  err: string;
  op: number;
  scale?: number;
  accent?: string;
}

function Block({ x, y, w, h, title, sub, outs, ins, err, op, scale = 1, accent = colors.ACCENT }: BlockSpec) {
  if (op <= 0.01) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const errRisky = err !== 'never';
  return (
    <g opacity={op} transform={scale === 1 ? undefined : `translate(${cx * (1 - scale)} ${cy * (1 - scale)}) scale(${scale})`}>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      {/* output lugs (top edge, solid) */}
      {outs.map((o, i) => {
        const lw = 24 + o.length * 7;
        const lx = x + 28 + i * (w / Math.max(outs.length, 1)) * 0.52;
        return (
          <g key={o}>
            <rect x={lx} y={y - 22} width={lw} height={26} rx={7} fill={colors.BG} stroke={accent} strokeWidth={1.6} />
            <text x={lx + lw / 2} y={y - 4} textAnchor="middle" fill={accent} fontSize={11} fontFamily={MONO}>
              {o}
            </text>
          </g>
        );
      })}
      {/* input notches (bottom edge, dashed) */}
      {ins.map((nIn, i) => {
        const lw = 24 + nIn.length * 7;
        const lx = x + 40 + i * (w * 0.46);
        return (
          <g key={nIn}>
            <rect x={lx} y={y + h - 4} width={lw} height={26} rx={7} fill={colors.BG} stroke={accent} strokeWidth={1.6} strokeDasharray="5 4" />
            <text x={lx + lw / 2} y={y + h + 14} textAnchor="middle" fill={accent} fontSize={11} fontFamily={MONO} opacity={0.85}>
              {nIn}
            </text>
          </g>
        );
      })}
      {/* risk tag */}
      <text x={x + w - 14} y={y + 24} textAnchor="end" fill={errRisky ? colors.NEGATIVE : colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={errRisky ? 1 : 0.7}>
        {err}
      </text>
      <text x={x + 20} y={y + 30} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO} fontWeight={600}>
        {title}
      </text>
      {sub && (
        <text x={x + 20} y={y + 54} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
          {sub}
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const legendU = s.get(scene.legendU);
  const sqlU = s.get(scene.sqlU);
  const repoU = s.get(scene.repoU);
  const provU = s.get(scene.provU);
  const mergeU = s.get(scene.mergeU);
  const storeU = s.get(scene.storeU);
  const flipU = s.get(scene.flipU);
  const appU = s.get(scene.appU);
  const teaseU = s.get(scene.teaseU);

  const leftDim = clamp01(storeU + appU); // provide diagram quiets later
  const mergeDim = clamp01(storeU + appU);
  const provided = provU > 0.6;

  // the sliding client block (provide)
  const slide = clamp01(provU);
  const sqlX = SQL.x + (REPO.x + 34 - SQL.x) * slide;
  const sqlY = SQL.y + (REPO.y + 58 - SQL.y) * slide;
  const sqlScale = lerp(1, 0.5, slide);

  // unwrap faces: flipU 0..1 → in-memory face, 1..2 → remote face
  const faceMem = flipU <= 1 ? clamp01(flipU * 2 - 0.8) : clamp01(1 - (flipU - 1) * 2);
  const faceRemote = flipU <= 1 ? 0 : clamp01((flipU - 1) * 2 - 0.8);
  const switchOn = flipU > 0.5 && flipU < 1.5; // MESSAGE_STORE_IN_MEMORY = true

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- beat 1: anatomy of a layer ---------------- */}
        {legendU > 0.01 && (
          <g opacity={legendU}>
            <Block
              x={LEGEND.x}
              y={LEGEND.y}
              w={LEGEND.w}
              h={LEGEND.h}
              title="a layer"
              sub="a recipe for building services"
              outs={['what it provides']}
              ins={['what it needs']}
              err="how it can fail"
              op={1}
            />
            <text x={640} y={LEGEND.y + LEGEND.h + 74} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontFamily={MONO}>
              Layer&lt;
              <tspan fill={colors.ACCENT}>Out</tspan>, <tspan fill={colors.NEGATIVE}>Err</tspan>, <tspan fill={colors.ACCENT}>In</tspan>
              &gt;
            </text>
          </g>
        )}

        {/* ---------------- beats 2–4: provide (left diagram) ---------------- */}
        <g opacity={1 - 0.87 * leftDim}>
          <Block
            x={REPO.x}
            y={REPO.y}
            w={REPO.w}
            h={REPO.h}
            title={provided ? 'UserRepository.layer' : 'UserRepository.layerNoDeps'}
            sub={provided ? 'Layer.provide(SqlClientLayer)' : 'maps SqlError → UserRespositoryError'}
            outs={['UserRepository']}
            ins={provided ? [] : ['SqlClient']}
            err={provided ? 'ConfigError | SqlError' : 'never'}
            op={repoU}
          />
          {/* the client block — standalone, then sliding inside */}
          {sqlU > 0.01 && (
            <g opacity={slide > 0.9 ? 0.45 : 1}>
              <Block
                x={sqlX}
                y={sqlY}
                w={SQL.w}
                h={SQL.h}
                title="SqlClientLayer"
                sub={'url: Config.redacted("DATABASE_URL")'}
                outs={slide > 0.5 ? ['SqlClient'] : ['PgClient', 'SqlClient']}
                ins={[]}
                err="ConfigError | SqlError"
                op={sqlU}
                scale={sqlScale}
              />
            </g>
          )}
          {/* the wire from client lug to repository notch, pre-provide */}
          {repoU > 0.5 && slide < 0.05 && (
            <line x1={SQL.x + 80} y1={SQL.y - 22} x2={REPO.x + 80} y2={REPO.y + REPO.h + 24} stroke={colors.ACCENT} strokeWidth={1.6} strokeDasharray="3 6" opacity={repoU * 0.7} />
          )}
          {slide > 0.6 && (
            <text x={REPO.x + REPO.w / 2} y={REPO.y + REPO.h + 44} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO} opacity={clamp01(slide * 3 - 2)}>
              Layer.provide — hidden inside
            </text>
          )}
        </g>

        {/* ---------------- beat 5: provideMerge (right diagram) ---------------- */}
        {mergeU > 0.01 && (
          <g opacity={mergeU * (1 - 0.87 * mergeDim)}>
            <rect x={MERGE.x - 16} y={MERGE.y - 44} width={MERGE.w + 32} height={MERGE.h + 88} rx={18} fill="none" stroke={colors.GRID} strokeDasharray="6 6" />
            <Block
              x={MERGE.x}
              y={MERGE.y}
              w={244}
              h={MERGE.h}
              title="UserRepository"
              outs={['UserRepository']}
              ins={[]}
              err=""
              op={1}
            />
            <Block
              x={MERGE.x + 268}
              y={MERGE.y}
              w={244}
              h={MERGE.h}
              title="SqlClientLayer"
              outs={['SqlClient']}
              ins={[]}
              err="ConfigError | SqlError"
              op={1}
            />
            {/* the internal weld */}
            <line x1={MERGE.x + 244} y1={MERGE.y + MERGE.h / 2} x2={MERGE.x + 268} y2={MERGE.y + MERGE.h / 2} stroke={colors.ACCENT} strokeWidth={3} />
            <text x={MERGE.x + MERGE.w / 2} y={MERGE.y + MERGE.h + 66} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>
              Layer.provideMerge — both surfaces exposed
            </text>
          </g>
        )}

        {/* ---------------- beat 6: unwrap (MessageStore) ---------------- */}
        {storeU > 0.01 && (
          <g opacity={storeU}>
            <rect x={STORE.x} y={STORE.y} width={STORE.w} height={STORE.h} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={STORE.x + 22} y={STORE.y + 32} fill={colors.TEXT} fontSize={14} fontFamily={MONO} fontWeight={600}>
              MessageStore.layer = Layer.unwrap(…)
            </text>
            {/* the config switch */}
            <g>
              <text x={STORE.x + 22} y={STORE.y + 64} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                MESSAGE_STORE_IN_MEMORY
              </text>
              <rect x={STORE.x + 232} y={STORE.y + 52} width={52} height={20} rx={10} fill={switchOn ? colors.POSITIVE : colors.GRID} opacity={0.85} />
              <circle cx={STORE.x + 232 + (switchOn ? 40 : 12)} cy={STORE.y + 62} r={8} fill={colors.TEXT} />
              <text x={STORE.x + 296} y={STORE.y + 66} fill={switchOn ? colors.POSITIVE : colors.MUTED} fontSize={11} fontFamily={MONO}>
                {switchOn ? 'true' : 'false'}
              </text>
            </g>
            {/* the two faces */}
            <g opacity={Math.max(0.12, faceMem)}>
              <rect x={STORE.x + 24} y={STORE.y + 92} width={200} height={72} rx={12} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={faceMem > 0.5 ? 2 : 1} />
              <text x={STORE.x + 124} y={STORE.y + 122} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO}>
                layerInMemory
              </text>
              <text x={STORE.x + 124} y={STORE.y + 144} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontStyle="italic">
                fast, for tests
              </text>
            </g>
            <g opacity={Math.max(0.12, flipU < 0.5 ? 0.5 : faceRemote)}>
              <rect x={STORE.x + 252} y={STORE.y + 92} width={200} height={72} rx={12} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={faceRemote > 0.5 ? 2 : 1} />
              <text x={STORE.x + 352} y={STORE.y + 122} textAnchor="middle" fill={colors.SECONDARY} fontSize={12.5} fontFamily={MONO}>
                layerRemote(url)
              </text>
              <text x={STORE.x + 352} y={STORE.y + 144} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontStyle="italic">
                MESSAGE_STORE_URL
              </text>
            </g>
            <text x={STORE.x + STORE.w / 2} y={STORE.y + STORE.h - 8} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              one effect decides which recipe is built
            </text>
          </g>
        )}

        {/* ---------------- beats 7–8: the finished app + scope teaser ---------------- */}
        {appU > 0.01 && (
          <g opacity={appU}>
            {/* fragments flying together */}
            {appU < 0.95 &&
              (
                [
                  { label: 'UserRepository.layer', from: { x: 320, y: 250 } },
                  { label: 'MessageStore.layer', from: { x: 960, y: 250 } },
                  { label: 'SqlClientLayer', from: { x: 640, y: 560 } },
                ] as const
              ).map((f, i) => {
                const u = clamp01(appU * 1.4 - i * 0.12);
                return (
                  <g key={f.label} opacity={1 - clamp01(u * 1.2 - 0.4)}>
                    <rect x={lerp(f.from.x, 640, u) - 90} y={lerp(f.from.y, APP.y + APP.h / 2, u) - 18} width={180} height={36} rx={9} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
                    <text x={lerp(f.from.x, 640, u)} y={lerp(f.from.y, APP.y + APP.h / 2, u) + 4} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>
                      {f.label}
                    </text>
                  </g>
                );
              })}
            <g opacity={clamp01(appU * 2 - 0.9)}>
              <Block
                x={APP.x}
                y={APP.y}
                w={APP.w}
                h={APP.h}
                title="the application layer"
                sub="every notch filled — nothing left unmet"
                outs={['main']}
                ins={[]}
                err="ConfigError | SqlError"
                op={1}
                accent={colors.POSITIVE}
              />
            </g>
          </g>
        )}
        {teaseU > 0.01 && (
          <g opacity={teaseU}>
            <rect
              x={APP.x - 42}
              y={APP.y - 58}
              width={APP.w + 84}
              height={APP.h + 116}
              rx={24}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={2}
              strokeDasharray={1}
              pathLength={1}
              strokeDashoffset={1 - teaseU}
            />
            <text x={APP.x - 42 + 18} y={APP.y - 58 - 10} fill={colors.WARM} fontSize={12.5} fontFamily={MONO} opacity={clamp01(teaseU * 2 - 1)}>
              scope — the teardown promise
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
