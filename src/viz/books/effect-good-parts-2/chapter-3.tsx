// The Typed Map
//
// Grounding: packages/effect/src/Context.ts ("Stores Effect services in typed
// maps. A Context holds service implementations under Context.Service or
// Context.Reference keys, and its type records which keys are present…";
// Key<Identifier, Shape> is itself an Effect, so yielding it retrieves the
// service). ai-docs/src/01_effect/03_services/01_service.ts — class Database
// extends Context.Service, id "myapp/db/Database", query(sql) →
// Effect<Array<unknown>, DatabaseError>, Database.of({ query }).
// ai-docs/src/01_effect/03_services/10_reference.ts — Context.Reference
// "myapp/FeatureFlag" with defaultValue: () => false.
//
// Centerpiece: requirements as KEY-SHAPED HOLES. Yielding the Database key
// stamps a dashed ghost into the R slot of the live signature; the Context is
// a literal map plate with keyed sockets; providing snaps an implementation
// into the socket and the R slot drains to never — the program lights up
// runnable. Swap the map for a stub and nothing else changes.
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

const SIG = { x: 240, y: 78, w: 800, h: 66 } as const;
const SIG_CY = SIG.y + SIG.h / 2;
const R_SLOT = { cx: 812, w: 118 } as const;

const KEY_CARD = { x: 660, y: 210, w: 330, h: 128 } as const;
const PROG = { x: 128, y: 210, w: 372, h: 210 } as const;
const PROG_LINES = [
  'Effect.gen(function* () {',
  '  const db = yield* Database',
  '  return yield* db.query(',
  '    "SELECT * FROM users")',
  '})',
] as const;
const YIELD_LINE = 1; // the `yield* Database` line

const MAP = { x: 640, y: 392, w: 470, h: 180 } as const;
const SOCKET = { x: MAP.x + 34, y: MAP.y + 62, w: 250, h: 46 } as const;

const REF = { x: 700, y: 218, w: 320, h: 112 } as const;

// teaser: the dependency chain layers will build (ch 4 material)
const CHAIN = [
  { label: 'UserRepository', y: 250 },
  { label: 'SqlClient', y: 350 },
  { label: 'Config: DATABASE_URL', y: 450 },
] as const;

const CAM_SIG: CameraState = { x: 640, y: 150, k: 1.5 };
const CAM_KEY: CameraState = { x: 810, y: 262, k: 1.3 };
const CAM_PROG: CameraState = { x: 430, y: 260, k: 1.28 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.04 };
const CAM_REF: CameraState = { x: 852, y: 262, k: 1.26 };
const CAM_TEASE: CameraState = { x: 640, y: 350, k: 1.14 };

// ---------------------------------------------------------------------------
// Timeline (~64s, eight beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SIG, cameraInterp);

  const sigU = tl.channel('sigU', 0); // signature chip + R pulse
  const keyU = tl.channel('keyU', 0); // the Database key card stamps in
  const progU = tl.channel('progU', 0); // the generator program panel
  const yieldU = tl.channel('yieldU', 0); // ghost key flies into the R slot
  const mapU = tl.channel('mapU', 0); // the Context map plate
  const provU = tl.channel('provU', 0); // impl snaps in, R drains, program glows
  const swapU = tl.channel('swapU', 0); // the test map swap
  const refU = tl.channel('refU', 0); // Context.Reference card
  const teaseU = tl.channel('teaseU', 0); // dependency-chain teaser

  // — beat 1 · the third slot —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Two slots tracked how a program ends. The third tracks what it needs before it can even start. R is the set of requirements — and like everything in Effect, it lives in the type.',
  });
  tl.tween(sigU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });

  // — beat 2 · a service starts as a key —
  tl.caption({
    at: 7.6,
    dur: 7.6,
    text: 'A service starts as a key. You declare the database service with an identifier string and an interface: one query method that returns rows or a database error. No implementation yet — just a shaped hole waiting to be filled.',
  });
  tl.tween(cam, CAM_KEY, { at: 7.8, dur: 1.3, ease: ease.move });
  tl.tween(keyU, 1, { at: 8.4, dur: 0.8, ease: ease.pop });

  // — beat 3 · yield the key, gain a requirement —
  tl.caption({
    at: 16.0,
    dur: 7.6,
    text: 'Inside a generator you yield the key itself, because a key is an effect that resolves to its service. The moment you do, the requirement appears: the R slot now says Database.',
  });
  tl.tween(cam, CAM_PROG, { at: 16.2, dur: 1.3, ease: ease.move });
  tl.tween(progU, 1, { at: 16.6, dur: 1.2, ease: ease.enter });
  tl.tween(yieldU, 1, { at: 19.2, dur: 1.8, ease: ease.move });

  // — beat 4 · the Context is a typed map —
  tl.caption({
    at: 24.4,
    dur: 7.0,
    text: 'A Context is a typed map from keys to implementations — and its type records exactly which keys are present. Effects run against the map their fiber carries.',
  });
  tl.tween(cam, CAM_WIDE, { at: 24.6, dur: 1.4, ease: ease.move });
  tl.tween(mapU, 1, { at: 25.2, dur: 1.0, ease: ease.enter });

  // — beat 5 · provide: the socket fills, R drains —
  tl.caption({
    at: 32.2,
    dur: 7.8,
    text: 'Build the real implementation, put it in the map, and provide it. The socket fills, the R slot drains to never — and only now will Effect agree to run the program.',
  });
  tl.tween(provU, 1, { at: 33.0, dur: 2.6, ease: ease.move });

  // — beat 6 · same program, different map —
  tl.caption({
    at: 40.6,
    dur: 7.4,
    text: 'The program never named a concrete database — only the key. Hand it a different map in tests, a stub that returns two fixed rows, and nothing else changes. Dependency injection with no framework: just types and a map.',
  });
  tl.tween(swapU, 1, { at: 41.4, dur: 1.6, ease: ease.move });

  // — beat 7 · references have defaults —
  tl.caption({
    at: 48.6,
    dur: 6.6,
    text: 'Some keys carry defaults. A reference, like a feature flag that defaults to false, can always be read — so it never shows up in R at all.',
  });
  tl.tween(cam, CAM_REF, { at: 48.8, dur: 1.3, ease: ease.move });
  tl.tween(refU, 1, { at: 49.4, dur: 0.9, ease: ease.enter });

  // — beat 8 · teaser: services need services —
  tl.caption({
    at: 55.8,
    dur: 7.6,
    text: 'Real programs need dozens of services, and the services need each other: the repository needs the client, the client needs config. Building those maps by hand is the next problem. Layers are the answer.',
  });
  tl.tween(cam, CAM_TEASE, { at: 56.0, dur: 1.5, ease: ease.move });
  tl.tween(teaseU, 1, { at: 56.6, dur: 2.2, ease: ease.move });
  tl.hold(63.4, 1.2);

  return { tl, cam, sigU, keyU, progU, yieldU, mapU, provU, swapU, refU, teaseU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

/** A key silhouette: rounded head + toothed blade, engraved with its id. */
function KeyGlyph({ x, y, w, color, opacity, dashed = false }: { x: number; y: number; w: number; color: string; opacity: number; dashed?: boolean }) {
  if (opacity <= 0.01) return null;
  const r = w * 0.16;
  const blade = w * 0.62;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y})`}>
      <circle cx={r} cy={0} r={r} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dashed ? '4 4' : undefined} />
      <path
        d={`M${r * 2} 0 h${blade} v${r * 0.7} h${-r * 0.5} v${-r * 0.35} h${-r * 0.5} v${r * 0.35} h${-r * 0.5} v${-r * 0.35}`}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dashed ? '4 4' : undefined}
        strokeLinejoin="round"
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const sigU = s.get(scene.sigU);
  const keyU = s.get(scene.keyU);
  const progU = s.get(scene.progU);
  const yieldU = s.get(scene.yieldU);
  const mapU = s.get(scene.mapU);
  const provU = s.get(scene.provU);
  const swapU = s.get(scene.swapU);
  const refU = s.get(scene.refU);
  const teaseU = s.get(scene.teaseU);

  const stageDim = clamp01(teaseU * 1.2); // everything but the chip quiets for the teaser
  const keyDim = clamp01(progU + stageDim); // key card yields the stage to the program
  const snap = clamp01(provU * 1.6); // impl card flight
  const drain = clamp01(provU * 2 - 0.9); // R slot → never
  const glow = clamp01(provU * 2.2 - 1.2); // program runnable glow

  // ghost key flight: from the yield line into the R slot
  const gx = lerp(PROG.x + 210, R_SLOT.cx, yieldU);
  const gy = lerp(PROG.y + 58 + YIELD_LINE * 26, SIG_CY, yieldU);

  const mapTitle = swapU > 0.5 ? 'Context — the test map' : 'Context — a typed map';
  const implLabel = swapU > 0.5 ? 'stub: two fixed rows' : 'Database.of({ query })';

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- the live signature ---------------- */}
        {sigU > 0.01 && (
          <g opacity={sigU}>
            <rect x={SIG.x} y={SIG.y} width={SIG.w} height={SIG.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={SIG.x + 28} y={SIG_CY + 6} fill={colors.TEXT} fontSize={18} fontFamily={MONO}>
              Effect&lt;
            </text>
            <g>
              <rect x={392} y={SIG_CY - 15} width={158} height={30} rx={7} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.5} />
              <text x={471} y={SIG_CY + 4} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
                Array&lt;unknown&gt;
              </text>
            </g>
            <text x={556} y={SIG_CY + 5} fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
              ,
            </text>
            <g>
              <rect x={572} y={SIG_CY - 15} width={140} height={30} rx={7} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.5} />
              <text x={642} y={SIG_CY + 4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
                DatabaseError
              </text>
            </g>
            <text x={718} y={SIG_CY + 5} fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
              ,
            </text>
            {/* R slot: empty → dashed Database → never */}
            <g>
              <rect
                x={R_SLOT.cx - R_SLOT.w / 2}
                y={SIG_CY - 15}
                width={R_SLOT.w}
                height={30}
                rx={7}
                fill={colors.BG}
                stroke={colors.ACCENT}
                strokeWidth={1.5}
                strokeDasharray={drain > 0.5 ? undefined : '5 4'}
                opacity={0.45 + 0.55 * clamp01(yieldU + drain)}
              />
              <text x={R_SLOT.cx} y={SIG_CY + 4} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO} opacity={yieldU * (1 - drain)}>
                Database
              </text>
              <text x={R_SLOT.cx} y={SIG_CY + 4} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO} opacity={drain}>
                never
              </text>
              {/* idle pulse before anything is demanded */}
              {yieldU < 0.05 && (
                <circle cx={R_SLOT.cx} cy={SIG_CY} r={34 + 8 * Math.sin(Math.PI * clamp01(sigU))} fill="none" stroke={colors.ACCENT} strokeWidth={1.2} opacity={0.4 * sigU * (1 - keyU)} />
              )}
            </g>
            <text x={R_SLOT.cx + R_SLOT.w / 2 + 14} y={SIG_CY + 6} fill={colors.TEXT} fontSize={18} fontFamily={MONO}>
              &gt;
            </text>
            <text x={R_SLOT.cx} y={SIG.y + SIG.h + 18} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5}>
              R · requirements
            </text>
          </g>
        )}

        {/* ---------------- beat 2: the key card ---------------- */}
        {keyU > 0.01 && (
          <g opacity={keyU * (1 - 0.82 * keyDim)} transform={`translate(0 ${10 * (1 - keyU)})`}>
            <rect x={KEY_CARD.x} y={KEY_CARD.y} width={KEY_CARD.w} height={KEY_CARD.h} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <KeyGlyph x={KEY_CARD.x + 22} y={KEY_CARD.y + 34} w={70} color={colors.ACCENT} opacity={1} />
            <text x={KEY_CARD.x + 108} y={KEY_CARD.y + 38} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              class Database extends
            </text>
            <text x={KEY_CARD.x + 108} y={KEY_CARD.y + 56} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              Context.Service
            </text>
            <text x={KEY_CARD.x + 22} y={KEY_CARD.y + 84} fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
              &quot;myapp/db/Database&quot;
            </text>
            <text x={KEY_CARD.x + 22} y={KEY_CARD.y + 106} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              query(sql) → rows | DatabaseError
            </text>
          </g>
        )}

        {/* ---------------- beat 3: the program yields the key ---------------- */}
        {progU > 0.01 && (
          <g opacity={progU * (1 - 0.85 * stageDim)}>
            <rect x={PROG.x} y={PROG.y} width={PROG.w} height={PROG.h} rx={14} fill={colors.PANEL} stroke={glow > 0.3 ? colors.POSITIVE : colors.GRID} strokeWidth={glow > 0.3 ? 2 : 1} />
            {glow > 0.05 && <rect x={PROG.x - 5} y={PROG.y - 5} width={PROG.w + 10} height={PROG.h + 10} rx={18} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} opacity={0.5 * glow} />}
            {PROG_LINES.map((line, i) => (
              <text
                key={i}
                x={PROG.x + 24}
                y={PROG.y + 46 + i * 26}
                fill={i === YIELD_LINE ? colors.ACCENT : colors.TEXT}
                fontSize={13.5}
                fontFamily={MONO}
                fontWeight={i === YIELD_LINE ? 600 : 400}
              >
                {line}
              </text>
            ))}
            {yieldU > 0.05 && yieldU < 0.98 && <KeyGlyph x={gx} y={gy} w={54} color={colors.ACCENT} opacity={0.9} dashed />}
            <text x={PROG.x + 24} y={PROG.y + PROG.h - 16} fill={glow > 0.3 ? colors.POSITIVE : colors.MUTED} fontSize={11} fontStyle="italic">
              {glow > 0.3 ? 'runnable — all requirements met' : 'not runnable yet — needs Database'}
            </text>
          </g>
        )}

        {/* ---------------- beats 4–6: the Context map plate ---------------- */}
        {mapU > 0.01 && (
          <g opacity={mapU * (1 - 0.85 * stageDim)}>
            <rect x={MAP.x} y={MAP.y} width={MAP.w} height={MAP.h} rx={16} fill={colors.PANEL} stroke={swapU > 0.5 ? colors.SECONDARY : colors.GRID} strokeWidth={swapU > 0.5 ? 2 : 1} />
            <text x={MAP.x + 26} y={MAP.y + 32} fill={swapU > 0.5 ? colors.SECONDARY : colors.TEXT} fontSize={14} fontWeight={600}>
              {mapTitle}
            </text>
            <text x={MAP.x + MAP.w - 24} y={MAP.y + 32} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              type records its keys
            </text>
            {/* the keyed socket */}
            <rect x={SOCKET.x} y={SOCKET.y} width={SOCKET.w} height={SOCKET.h} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.5} strokeDasharray={snap > 0.9 ? undefined : '6 5'} />
            <text x={SOCKET.x + 12} y={SOCKET.y - 8} fill={colors.ACCENT} fontSize={10.5} fontFamily={MONO}>
              myapp/db/Database
            </text>
            {/* the implementation card snapping in */}
            {snap > 0.02 && (
              <g opacity={clamp01(snap * 2)}>
                <rect
                  x={lerp(MAP.x + MAP.w - 270, SOCKET.x + 6, snap)}
                  y={lerp(MAP.y + 124, SOCKET.y + 6, snap)}
                  width={SOCKET.w - 12}
                  height={SOCKET.h - 12}
                  rx={7}
                  fill={swapU > 0.5 ? colors.SECONDARY : colors.ACCENT}
                  opacity={0.28}
                  stroke={swapU > 0.5 ? colors.SECONDARY : colors.ACCENT}
                  strokeWidth={1.5}
                />
                <text
                  x={lerp(MAP.x + MAP.w - 270, SOCKET.x + 6, snap) + (SOCKET.w - 12) / 2}
                  y={lerp(MAP.y + 124, SOCKET.y + 6, snap) + 22}
                  textAnchor="middle"
                  fill={colors.TEXT}
                  fontSize={11.5}
                  fontFamily={MONO}
                >
                  {implLabel}
                </text>
              </g>
            )}
            {/* second, unclaimed socket hints the map holds many services */}
            <rect x={SOCKET.x} y={SOCKET.y + 62} width={170} height={38} rx={10} fill={colors.BG} stroke={colors.GRID} strokeDasharray="6 5" opacity={0.5} />
            <text x={SOCKET.x + 12} y={SOCKET.y + 86} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={0.6}>
              …more keys
            </text>
            {/* the provide pipe: map → program */}
            {snap > 0.6 && (
              <g opacity={clamp01(snap * 3 - 1.9)}>
                <path
                  d={`M${MAP.x} ${MAP.y + 84} h-58 v-${MAP.y + 84 - (PROG.y + PROG.h / 2)} h-${MAP.x - 58 - (PROG.x + PROG.w)}`}
                  fill="none"
                  stroke={colors.ACCENT}
                  strokeWidth={2}
                  strokeDasharray="7 5"
                />
                <text x={(MAP.x + PROG.x + PROG.w) / 2 - 26} y={PROG.y + PROG.h / 2 - 12} fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
                  provide
                </text>
              </g>
            )}
          </g>
        )}

        {/* ---------------- beat 7: Context.Reference ---------------- */}
        {refU > 0.01 && (
          <g opacity={refU * (1 - 0.85 * stageDim)} transform={`translate(0 ${8 * (1 - refU)})`}>
            <rect x={REF.x} y={REF.y} width={REF.w} height={REF.h} rx={14} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.5} />
            <text x={REF.x + 22} y={REF.y + 30} fill={colors.TEAL} fontSize={13.5} fontFamily={MONO} fontWeight={600}>
              Context.Reference
            </text>
            <text x={REF.x + 22} y={REF.y + 56} fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
              &quot;myapp/FeatureFlag&quot;
            </text>
            <text x={REF.x + 22} y={REF.y + 80} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              defaultValue: () =&gt; false
            </text>
            <text x={REF.x + REF.w - 20} y={REF.y + 80} textAnchor="end" fill={colors.TEAL} fontSize={11} fontStyle="italic">
              never enters R
            </text>
          </g>
        )}

        {/* ---------------- beat 8: teaser — the dependency chain ---------------- */}
        {teaseU > 0.01 && (
          <g opacity={teaseU}>
            {CHAIN.map((c, i) => {
              const u = clamp01(teaseU * 2.4 - i * 0.5);
              if (u <= 0.01) return null;
              return (
                <g key={c.label} opacity={u} transform={`translate(0 ${14 * (1 - u)})`}>
                  <rect x={640 - 130} y={c.y - 26} width={260} height={52} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
                  <text x={640} y={c.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                    {c.label}
                  </text>
                  {i < CHAIN.length - 1 && (
                    <g opacity={clamp01(u * 2 - 1)}>
                      <line x1={640} y1={c.y + 26} x2={640} y2={c.y + 68} stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="3 5" />
                      <text x={658} y={c.y + 54} fill={colors.MUTED} fontSize={11} fontStyle="italic">
                        needs
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
