// The Login Dance
//
// Grounding: examples/oauth/README.md (the five-step flow: authorize URL →
// user picker → callback with code → token exchange → session cookie),
// examples/oauth/src/lib/providers.ts (GITHUB_EMULATOR_URL ?? localhost:4001,
// authorizeUrl/tokenUrl/userInfoUrl), README.md (services on localhost ports).
//
// Centerpiece: the OAuth three-party "dance floor". A test's request packet
// does the redirect legs and slams into a wall of human proof (password,
// two-factor, device check). Then the chameleon swap: the real provider
// dissolves and the emulator fades in AT THE SAME SPOT while the app's three
// provider URLs visibly re-point. The dance replays and glides through.
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
import { Connection, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — three stations, the wall of human proof, the config panel.
// ---------------------------------------------------------------------------

const TEST = { x: 56, y: 64, w: 316, h: 128 } as const;

const BROWSER = { x: 250, y: 392 } as const;
const APP = { x: 640, y: 392 } as const;
const PROVIDER = { x: 1030, y: 392 } as const;

const WALL = { x: 872, y: 118, w: 316, h: 196 } as const;
const WALL_ROWS = ['password', 'two-factor code', 'device check'] as const;

const CFG = { x: 56, y: 448, w: 400, h: 158 } as const;

// the dance: browser → app → browser → provider's door
const DANCE_PATH = [
  { x: BROWSER.x + 60, y: BROWSER.y },
  { x: APP.x - 62, y: APP.y },
  { x: APP.x - 62, y: APP.y - 40 },
  { x: BROWSER.x + 60, y: BROWSER.y - 40 },
  { x: BROWSER.x + 60, y: BROWSER.y - 74 },
  { x: PROVIDER.x - 66, y: PROVIDER.y - 74 },
  { x: PROVIDER.x - 66, y: PROVIDER.y - 30 },
] as const;

// the return leg after the swap: provider → browser with the session
const RETURN_PATH = [
  { x: PROVIDER.x - 66, y: PROVIDER.y + 34 },
  { x: BROWSER.x + 60, y: BROWSER.y + 34 },
] as const;

const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_WALL: CameraState = { x: 940, y: 280, k: 1.32 };
const CAM_CFG: CameraState = { x: 420, y: 430, k: 1.28 };
const CAM_FLOOR: CameraState = { x: 640, y: 360, k: 1.06 };

/** Piecewise-linear travel along waypoints, u in 0..1. */
function along(pts: readonly { x: number; y: number }[], u: number): { x: number; y: number } {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.min(Math.floor(f), pts.length - 2);
  const t = f - i;
  return {
    x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
    y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
  };
}

// ---------------------------------------------------------------------------
// Timeline (~92s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);

  const testU = tl.channel('testU', 0); // the e2e test card
  const stationsU = tl.channel('stationsU', 0); // the three dancers
  const legU = tl.channel('legU', 0); // packet along DANCE_PATH
  const wallU = tl.channel('wallU', 0); // the human wall rises
  const stampU = tl.channel('stampU', 0); // 0..3 red ✕ stamps
  const stallU = tl.channel('stallU', 0); // packet flashes red, test fails
  const swapU = tl.channel('swapU', 0); // provider → emulator crossfade
  const cfgU = tl.channel('cfgU', 0); // providers config panel
  const cfgSwapU = tl.channel('cfgSwapU', 0); // urls re-point
  const legU2 = tl.channel('legU2', 0); // the replayed dance
  const retU = tl.channel('retU', 0); // return leg with the session
  const dashU = tl.channel('dashU', 0); // dashboard check on the browser
  const dimU = tl.channel('dimU', 0); // quiet the floor for the closing
  const teaseU = tl.channel('teaseU', 0); // closing question card

  // — beat 1 · a boring test that can't run —
  tl.caption({
    at: 0.5,
    dur: 7.0,
    text: 'Here is a test that should be boring: open the app, sign in, land on the dashboard. In continuous integration it fails before it even starts.',
  });
  tl.tween(testU, 1, { at: 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(stationsU, 1, { at: 3.2, dur: 1.4, ease: ease.draw });
  tl.hold(7.5, 0.6);

  // — beat 2 · sign-in is a dance for three —
  tl.caption({
    at: 8.1,
    dur: 7.2,
    text: 'Because sign-in is a dance for three: the browser, your app, and the identity provider. Your app never sees a password — it hands the browser over and waits.',
  });
  tl.tween(cam, CAM_FLOOR, { at: 8.3, dur: 1.2, ease: ease.move });
  tl.tween(legU, 0.62, { at: 9.4, dur: 3.4, ease: ease.move }); // browser → app → back
  tl.hold(15.3, 0.5);

  // — beat 3 · redirected to the real provider —
  tl.caption({
    at: 15.8,
    dur: 5.4,
    text: 'So the browser gets redirected to the real provider, out on the public internet, and the dance leaves your hands.',
  });
  tl.tween(legU, 1, { at: 16.2, dur: 2.6, ease: ease.move }); // → provider door
  tl.hold(21.2, 0.4);

  // — beat 4 · the wall rises —
  tl.caption({
    at: 21.6,
    dur: 7.4,
    text: 'And there it stops. A password box, a two-factor prompt, a device check — the provider is built to keep robots out, and your test is, proudly, a robot.',
  });
  tl.tween(cam, CAM_WALL, { at: 21.8, dur: 1.3, ease: ease.move });
  tl.tween(wallU, 1, { at: 22.4, dur: 1.2, ease: ease.draw });
  tl.tween(stampU, 3, { at: 24.6, dur: 3.2, ease: ease.linear });
  tl.tween(stallU, 1, { at: 27.4, dur: 0.8, ease: ease.pop });
  tl.hold(29.0, 0.8);

  // — beat 5 · the bold move: replace the provider —
  tl.caption({
    at: 29.8,
    dur: 7.6,
    text: 'Real credentials in CI, rate limits, flaky networks — most teams give up here and stub the login. Emulate does something bolder: it replaces the provider itself.',
  });
  tl.tween(cam, CAM_WIDE, { at: 30.2, dur: 1.4, ease: ease.move });
  tl.tween(wallU, 0.14, { at: 33.4, dur: 1.2, ease: ease.move });
  tl.tween(stallU, 0, { at: 33.4, dur: 0.8, ease: ease.enter });
  tl.tween(legU, 0, { at: 33.4, dur: 0.01, ease: ease.enter });
  tl.tween(swapU, 1, { at: 34.6, dur: 1.8, ease: ease.move });
  tl.hold(37.4, 0.6);

  // — beat 6 · what the emulator is —
  tl.caption({
    at: 38.0,
    dur: 7.0,
    text: 'The emulator is a stand-in server that speaks the provider’s exact protocol — same endpoints, same response shapes — running on a local port right next to your tests.',
  });
  tl.hold(45.0, 0.6);

  // — beat 7 · the three-address swap —
  tl.caption({
    at: 45.6,
    dur: 7.6,
    text: 'And your app changes almost nothing. Three addresses in its provider config — authorize, token, and user info — now point at localhost instead of the real thing.',
  });
  tl.tween(cam, CAM_CFG, { at: 45.8, dur: 1.3, ease: ease.move });
  tl.tween(cfgU, 1, { at: 46.6, dur: 0.9, ease: ease.enter });
  tl.tween(cfgSwapU, 1, { at: 49.4, dur: 1.6, ease: ease.move });
  tl.hold(53.2, 0.8);

  // — beat 8 · the dance replays and glides through —
  tl.caption({
    at: 54.0,
    dur: 6.6,
    text: 'Run the dance again. Same redirect, same three parties — but this time the provider is yours, and there is no wall.',
  });
  tl.tween(cam, CAM_FLOOR, { at: 54.2, dur: 1.4, ease: ease.move });
  tl.tween(legU2, 1, { at: 55.4, dur: 4.0, ease: ease.move });
  tl.hold(60.6, 0.5);

  // — beat 9 · the session comes home —
  tl.caption({
    at: 61.1,
    dur: 6.8,
    text: 'The browser comes back carrying a signed-in session, and the dashboard finally renders. The rest of this book is what happens inside that swap.',
  });
  tl.tween(retU, 1, { at: 61.6, dur: 2.2, ease: ease.move });
  tl.tween(dashU, 1, { at: 64.2, dur: 0.6, ease: ease.pop });
  tl.hold(67.9, 0.7);

  // — beat 10 · signed in as whom? —
  tl.caption({
    at: 68.6,
    dur: 7.2,
    text: 'Which leaves the first real question: signed in as whom? The emulator needs a cast of users before anyone can pick one. That cast is where we start.',
  });
  tl.tween(dimU, 1, { at: 68.8, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 68.8, dur: 1.4, ease: ease.move });
  tl.tween(teaseU, 1, { at: 70.4, dur: 0.8, ease: ease.pop });
  tl.hold(75.8, 1.6);

  return {
    tl,
    cam,
    testU,
    stationsU,
    legU,
    wallU,
    stampU,
    stallU,
    swapU,
    cfgU,
    cfgSwapU,
    legU2,
    retU,
    dashU,
    dimU,
    teaseU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const testU = s.get(scene.testU);
  const stationsU = s.get(scene.stationsU);
  const legU = s.get(scene.legU);
  const wallU = s.get(scene.wallU);
  const stampU = s.get(scene.stampU);
  const stallU = s.get(scene.stallU);
  const swapU = s.get(scene.swapU);
  const cfgU = s.get(scene.cfgU);
  const cfgSwapU = s.get(scene.cfgSwapU);
  const legU2 = s.get(scene.legU2);
  const retU = s.get(scene.retU);
  const dashU = s.get(scene.dashU);
  const dimU = s.get(scene.dimU);
  const teaseU = s.get(scene.teaseU);

  const floorOp = 1 - 0.87 * dimU;
  const p1 = along(DANCE_PATH, legU);
  const p2 = along(DANCE_PATH, legU2);
  const pr = along(RETURN_PATH, retU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the end-to-end test card */}
        <g opacity={testU * floorOp}>
          <rect x={TEST.x} y={TEST.y} width={TEST.w} height={TEST.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={TEST.x + 20} y={TEST.y + 32} fill={colors.MUTED} fontSize={13} fontStyle="italic">
            the end-to-end test
          </text>
          <text x={TEST.x + 20} y={TEST.y + 62} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
            1 · open the app
          </text>
          <text x={TEST.x + 20} y={TEST.y + 86} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
            2 · sign in with GitHub
          </text>
          <text x={TEST.x + 20} y={TEST.y + 110} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
            3 · expect the dashboard
          </text>
          {/* verdict chip: fails against the wall, passes after the swap */}
          {(stallU > 0.02 || dashU > 0.02) && (
            <g>
              <rect
                x={TEST.x + TEST.w - 96}
                y={TEST.y + 14}
                width={80}
                height={28}
                rx={8}
                fill={colors.BG}
                stroke={dashU > 0.02 ? colors.POSITIVE : colors.NEGATIVE}
                opacity={Math.max(stallU, dashU)}
              />
              <text
                x={TEST.x + TEST.w - 56}
                y={TEST.y + 33}
                textAnchor="middle"
                fill={dashU > 0.02 ? colors.POSITIVE : colors.NEGATIVE}
                fontSize={13.5}
                fontWeight={700}
                opacity={Math.max(stallU, dashU)}
              >
                {dashU > 0.02 ? 'PASS' : 'FAIL'}
              </text>
            </g>
          )}
        </g>

        {/* the dance floor */}
        <g opacity={floorOp}>
          <Zone
            x={120}
            y={300}
            w={660}
            h={180}
            label="your machine / CI runner"
            kind="group"
            u={stationsU}
            color={colors.GRID}
          />
          <ServiceNode
            x={BROWSER.x}
            y={BROWSER.y}
            kind="browser"
            label="Playwright browser"
            sublabel="the test's hands"
            u={stationsU}
            glow={clamp01(dashU)}
          />
          <ServiceNode
            x={APP.x}
            y={APP.y}
            kind="server"
            label="your app"
            sublabel="localhost:3000"
            u={clamp01(stationsU * 1.4 - 0.2)}
          />

          {/* the real provider … */}
          <g opacity={1 - swapU}>
            <ServiceNode
              x={PROVIDER.x}
              y={PROVIDER.y}
              kind="external"
              label="real provider"
              sublabel="github.com"
              u={clamp01(stationsU * 1.8 - 0.6)}
              status={stallU > 0.4 ? 'down' : undefined}
            />
          </g>
          {/* … dissolves into the emulator at the very same spot */}
          <g opacity={swapU}>
            <ServiceNode
              x={PROVIDER.x}
              y={PROVIDER.y}
              kind="server"
              label="emulator"
              sublabel="localhost:4001"
              u={swapU}
              glow={clamp01(swapU * (1 - dimU) * 0.8)}
            />
            <text
              x={PROVIDER.x}
              y={PROVIDER.y - 58}
              textAnchor="middle"
              fill={colors.ACCENT}
              fontSize={12.5}
              fontFamily={MONO}
              opacity={swapU}
            >
              npx emulate
            </text>
          </g>

          {/* the redirect legs */}
          <Connection
            from={{ x: BROWSER.x + 62, y: BROWSER.y }}
            to={{ x: APP.x - 64, y: APP.y }}
            u={clamp01(legU * 6)}
            label="GET /api/auth/github"
            color={colors.GRID}
            labelSize={11}
          />
          <Connection
            from={{ x: BROWSER.x + 60, y: BROWSER.y - 74 }}
            to={{ x: PROVIDER.x - 66, y: PROVIDER.y - 74 }}
            via={[{ x: PROVIDER.x - 66, y: PROVIDER.y - 74 }]}
            u={clamp01((legU - 0.62) * 4)}
            label="302 → authorize"
            color={colors.GRID}
            labelSize={11}
          />

          {/* the traveling request — attempt one */}
          {legU > 0.01 && legU < 1 && (
            <circle cx={p1.x} cy={p1.y} r={8} fill={stallU > 0.3 ? colors.NEGATIVE : colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
          )}
          {legU >= 1 && swapU < 0.5 && (
            <circle cx={p1.x} cy={p1.y} r={8 + 2 * stallU} fill={colors.NEGATIVE} opacity={1 - 0.4 * stallU} stroke={colors.BG} strokeWidth={1.5} />
          )}

          {/* the traveling request — attempt two, gliding through */}
          {legU2 > 0.01 && legU2 < 1 && (
            <circle cx={p2.x} cy={p2.y} r={8} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
          )}
          {/* the session coming home */}
          {retU > 0.01 && (
            <g>
              <circle cx={pr.x} cy={pr.y} r={8} fill={colors.POSITIVE} stroke={colors.BG} strokeWidth={1.5} />
              <text x={pr.x} y={pr.y + 24} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                session cookie
              </text>
            </g>
          )}
        </g>

        {/* the wall of human proof */}
        <g opacity={wallU > 0.15 ? wallU * floorOp : wallU * floorOp}>
          <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} rx={14} fill={colors.PANEL} stroke={stallU > 0.3 ? colors.NEGATIVE : colors.GRID} strokeWidth={1.5} />
          <text x={WALL.x + 20} y={WALL.y + 30} fill={colors.MUTED} fontSize={13} fontStyle="italic">
            what the real sign-in page wants
          </text>
          {WALL_ROWS.map((row, i) => {
            const stamped = clamp01(stampU - i);
            return (
              <g key={row}>
                <rect
                  x={WALL.x + 20}
                  y={WALL.y + 46 + i * 46}
                  width={WALL.w - 40}
                  height={36}
                  rx={8}
                  fill={colors.BG}
                  stroke={stamped > 0.5 ? colors.NEGATIVE : colors.GRID}
                />
                <text x={WALL.x + 36} y={WALL.y + 70 + i * 46} fill={colors.TEXT} fontSize={14.5} fontFamily={MONO}>
                  {row}
                </text>
                {stamped > 0 && (
                  <text
                    x={WALL.x + WALL.w - 44}
                    y={WALL.y + 72 + i * 46}
                    fill={colors.NEGATIVE}
                    fontSize={20}
                    fontWeight={700}
                    opacity={stamped}
                    transform={`rotate(${-8 + 8 * stamped} ${WALL.x + WALL.w - 44} ${WALL.y + 72 + i * 46})`}
                  >
                    ✕
                  </text>
                )}
              </g>
            );
          })}
          <text x={WALL.x + 20} y={WALL.y + WALL.h - 14} fill={colors.NEGATIVE} fontSize={12.5} opacity={clamp01(stampU - 2.5)}>
            a robot can do none of these
          </text>
        </g>

        {/* the provider config — the only thing that changes */}
        <g opacity={cfgU * floorOp}>
          <rect x={CFG.x} y={CFG.y} width={CFG.w} height={CFG.h} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
          <text x={CFG.x + 20} y={CFG.y + 28} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            examples/oauth/src/lib/providers.ts
          </text>
          {(['authorizeUrl', 'tokenUrl', 'userInfoUrl'] as const).map((k, i) => (
            <g key={k}>
              <text x={CFG.x + 20} y={CFG.y + 58 + i * 26} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                {k}:
              </text>
              {/* old value fades out, localhost fades in */}
              <text x={CFG.x + 150} y={CFG.y + 58 + i * 26} fill={colors.MUTED} fontSize={13.5} fontFamily={MONO} opacity={1 - cfgSwapU}>
                https://github.com/…
              </text>
              <text x={CFG.x + 150} y={CFG.y + 58 + i * 26} fill={colors.ACCENT} fontSize={13.5} fontFamily={MONO} opacity={cfgSwapU}>
                http://localhost:4001/…
              </text>
            </g>
          ))}
          <text x={CFG.x + 20} y={CFG.y + 136} fill={colors.SECONDARY} fontSize={12.5} fontFamily={MONO} opacity={cfgSwapU}>
            GITHUB_EMULATOR_URL ?? "http://localhost:4001"
          </text>
        </g>

        {/* closing question card — quiet stage beneath it */}
        <g opacity={teaseU}>
          <rect x={370} y={230} width={540} height={150} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={640} y={295} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Signed in… as whom?
          </text>
          <text x={640} y={335} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            next: seeding the cast of users
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
