// Spot the Difference
//
// Grounding: the whole flow from chapters 1–4 — @emulators/github
// routes/oauth.ts (authorize → code → access_token → /user; the token route
// honors Accept: application/x-www-form-urlencoded exactly like GitHub),
// @emulators/core store.ts (in-memory Store), packages/emulate
// __tests__/api.test.ts (reset() wipes and re-seeds between tests),
// examples/oauth callback route + session.ts (the app code is identical in
// both worlds — only the three provider URLs differ).
//
// Centerpiece: two lanes replay the SAME sign-in in lockstep — the real
// provider above, the emulator below — one packet per lane, stations lighting
// green together. Then the three real differences pulse exactly where they
// live: the proof of identity, the memory behind it, and what time does to
// state. Final pull-back: from the app's side of the wire, the lanes are
// indistinguishable.
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
import { ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — one app, two lanes, four shared stations.
// ---------------------------------------------------------------------------

const APP = { x: 170, y: 356 } as const;
const LANE_REAL_Y = 216;
const LANE_EMU_Y = 496;
const STATIONS = [
  { x: 430, label: 'authorize', sub: '/login/oauth/authorize' },
  { x: 650, label: 'code', sub: '?code=…&state=…' },
  { x: 870, label: 'token', sub: '/login/oauth/access_token' },
  { x: 1090, label: 'user info', sub: '/user' },
] as const;

// difference badges: (above the real lane, below the emulated lane)
const D1 = { x: STATIONS[0].x, topY: 106, botY: 566 } as const;
const D2 = { x: STATIONS[2].x, topY: 106, botY: 566 } as const;
const D3 = { x: STATIONS[3].x + 40, topY: 106, botY: 566 } as const;

const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_D1: CameraState = { x: 470, y: 356, k: 1.1 };
const CAM_D2: CameraState = { x: 860, y: 356, k: 1.1 };

/** packet x for a lockstep step value 0..4 (0 = at the app, i = at station i-1) */
function packetX(stepU: number): number {
  const stops = [APP.x + 70, ...STATIONS.map((st) => st.x)];
  const f = clamp01(stepU / 4) * (stops.length - 1);
  const i = Math.min(Math.floor(f), stops.length - 2);
  return stops[i] + (stops[i + 1] - stops[i]) * (f - i);
}

// ---------------------------------------------------------------------------
// Timeline (~78s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);

  const lanesU = tl.channel('lanesU', 0); // lanes + app draw on
  const stepU = tl.channel('stepU', 0); // 0..4 lockstep packet advance
  const quirkU = tl.channel('quirkU', 0); // the form-encoded quirk chip
  const d1U = tl.channel('d1U', 0); // proof: wall vs picker
  const d2U = tl.channel('d2U', 0); // memory: datacenter vs in-memory
  const d3U = tl.channel('d3U', 0); // time: forever vs reset-to-seed
  const appGlowU = tl.channel('appGlowU', 0); // "your code is identical"
  const dimU = tl.channel('dimU', 0);
  const recapU = tl.channel('recapU', 0); // journey strip
  const endU = tl.channel('endU', 0); // closing line

  // — beat 1 · same test, two worlds —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'One question remains: how much of what your test exercised was real? Run the same sign-in against both worlds, side by side, and watch closely.',
  });
  tl.tween(lanesU, 1, { at: 0.8, dur: 1.8, ease: ease.draw });
  tl.hold(6.9, 0.5);

  // — beat 2 · lockstep, step for step —
  tl.caption({
    at: 7.4,
    dur: 7.4,
    text: 'Both lanes speak the same protocol. An authorize request, a redirect carrying a code, a token exchange, a user info call — step for step, shape for shape.',
  });
  tl.tween(stepU, 4, { at: 8.0, dur: 6.2, ease: ease.linear });
  tl.hold(14.8, 0.5);

  // — beat 3 · the quirks come too —
  tl.caption({
    at: 15.3,
    dur: 6.4,
    text: 'The emulator even copies the quirks. Ask for a form-encoded token response and that is what you get, because the real provider answers that way too.',
  });
  tl.tween(cam, CAM_D2, { at: 15.5, dur: 1.2, ease: ease.move });
  tl.tween(quirkU, 1, { at: 16.7, dur: 0.8, ease: ease.enter });
  tl.hold(21.7, 0.5);

  // — beat 4 · difference one: the proof —
  tl.caption({
    at: 22.2,
    dur: 7.0,
    text: 'The differences live in exactly three places. First, the proof: the real lane demands a password and a second factor. The emulated lane offers a one-click picker.',
  });
  tl.tween(cam, CAM_D1, { at: 22.4, dur: 1.3, ease: ease.move });
  tl.tween(quirkU, 0, { at: 22.4, dur: 0.8, ease: ease.enter });
  tl.tween(d1U, 1, { at: 23.8, dur: 1.4, ease: ease.move });
  tl.hold(29.2, 0.5);

  // — beat 5 · difference two: the memory —
  tl.caption({
    at: 29.7,
    dur: 6.8,
    text: 'Second, the memory: the real provider keeps accounts in a datacenter you cannot see. The emulator keeps them in an in-memory store booted from your seed file.',
  });
  tl.tween(cam, CAM_D2, { at: 29.9, dur: 1.3, ease: ease.move });
  tl.tween(d2U, 1, { at: 31.2, dur: 1.4, ease: ease.move });
  tl.hold(36.5, 0.5);

  // — beat 6 · difference three: time —
  tl.caption({
    at: 37.0,
    dur: 6.6,
    text: 'Third, time: the real world accumulates state forever. The emulated one resets to the seed between tests, so every run begins at the same instant.',
  });
  tl.tween(d3U, 1, { at: 38.2, dur: 1.4, ease: ease.move });
  tl.hold(43.6, 0.5);

  // — beat 7 · what is NOT on the list —
  tl.caption({
    at: 44.1,
    dur: 6.4,
    text: 'Notice what is not on the list: your application code. It ran the same routes, parsed the same fields, and stored the same session either way.',
  });
  tl.tween(cam, CAM_WIDE, { at: 44.3, dur: 1.4, ease: ease.move });
  tl.tween(appGlowU, 1, { at: 45.5, dur: 1.2, ease: ease.move });
  tl.hold(50.5, 0.5);

  // — beat 8 · the bet —
  tl.caption({
    at: 51.0,
    dur: 7.0,
    text: 'That is the bet emulate makes: fidelity on the wire, convenience behind it. The test exercises every line you own, and skips only the parts a robot was never going to do.',
  });
  tl.hold(58.0, 0.5);

  // — beat 9 · the recap —
  tl.caption({
    at: 58.5,
    dur: 7.4,
    text: 'So the journey holds end to end: a seed file declared octocat, a picker chose them, a code became a token, and the token became the session your dashboard trusted.',
  });
  tl.tween(dimU, 1, { at: 58.9, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 1, { at: 60.3, dur: 2.8, ease: ease.move });
  tl.hold(65.9, 0.5);

  // — beat 10 · the closing line —
  tl.caption({
    at: 66.4,
    dur: 5.6,
    text: 'Same dance, tamer partner. That is emulate: the signed-in test, without the login.',
  });
  tl.tween(endU, 1, { at: 67.4, dur: 0.8, ease: ease.pop });
  tl.hold(72.0, 1.6);

  return { tl, cam, lanesU, stepU, quirkU, d1U, d2U, d3U, appGlowU, dimU, recapU, endU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const RECAP = ['seed file', 'picker click', 'one-time code', 'access token', 'session cookie'] as const;

function Lane({
  y,
  label,
  color,
  lanesU,
  stepU,
  dim,
}: {
  y: number;
  label: string;
  color: string;
  lanesU: number;
  stepU: number;
  dim: number;
}) {
  const px = packetX(stepU);
  return (
    <g opacity={(1 - 0.85 * dim) * lanesU}>
      <line x1={APP.x + 70} y1={y} x2={1180} y2={y} stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="1 0" opacity={0.8} />
      <text x={APP.x + 70} y={y - 46} fill={color} fontSize={13.5} fontWeight={600}>
        {label}
      </text>
      {STATIONS.map((st, i) => {
        const passed = stepU >= i + 1 - 0.04;
        return (
          <g key={st.label}>
            <circle cx={st.x} cy={y} r={9} fill={passed ? colors.POSITIVE : colors.BG} stroke={passed ? colors.POSITIVE : colors.GRID} strokeWidth={1.6} />
            <text x={st.x} y={y - 20} textAnchor="middle" fill={passed ? colors.TEXT : colors.MUTED} fontSize={13}>
              {st.label}
            </text>
            <text x={st.x} y={y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={passed ? 0.9 : 0.45}>
              {st.sub}
            </text>
          </g>
        );
      })}
      {stepU > 0.02 && stepU < 3.98 && <circle cx={px} cy={y} r={7.5} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const lanesU = s.get(scene.lanesU);
  const stepU = s.get(scene.stepU);
  const quirkU = s.get(scene.quirkU);
  const d1U = s.get(scene.d1U);
  const d2U = s.get(scene.d2U);
  const d3U = s.get(scene.d3U);
  const appGlowU = s.get(scene.appGlowU);
  const dimU = s.get(scene.dimU);
  const recapU = s.get(scene.recapU);
  const endU = s.get(scene.endU);

  const floorOp = 1 - 0.88 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the one app, wired to both worlds */}
        <g opacity={floorOp}>
          <ServiceNode
            x={APP.x}
            y={APP.y}
            kind="server"
            label="your app"
            sublabel="same code, both worlds"
            u={lanesU}
            glow={appGlowU}
          />
          <line x1={APP.x + 8} y1={APP.y - 42} x2={APP.x + 70} y2={LANE_REAL_Y} stroke={colors.GRID} strokeWidth={1.5} opacity={lanesU * 0.8} />
          <line x1={APP.x + 8} y1={APP.y + 42} x2={APP.x + 70} y2={LANE_EMU_Y} stroke={colors.GRID} strokeWidth={1.5} opacity={lanesU * 0.8} />
        </g>

        <Lane y={LANE_REAL_Y} label="the real provider — github.com" color={colors.NEGATIVE} lanesU={lanesU} stepU={stepU} dim={dimU} />
        <Lane y={LANE_EMU_Y} label="the emulator — localhost:4001" color={colors.ACCENT} lanesU={lanesU} stepU={stepU} dim={dimU} />

        {/* the quirk chip at the token station */}
        <g opacity={quirkU * floorOp}>
          <rect x={STATIONS[2].x - 150} y={340} width={300} height={44} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.2} />
          <text x={STATIONS[2].x} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
            Accept: application/x-www-form-urlencoded
          </text>
          <text x={STATIONS[2].x} y={376} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontFamily={MONO}>
            access_token=…&token_type=bearer — both lanes
          </text>
        </g>

        {/* difference one: the proof of identity */}
        <g opacity={d1U * floorOp}>
          <rect x={D1.x - 130} y={D1.topY} width={260} height={56} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.3} />
          <text x={D1.x} y={D1.topY + 24} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontWeight={600}>
            password + second factor
          </text>
          <text x={D1.x} y={D1.topY + 42} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            a human proves who they are
          </text>
          <rect x={D1.x - 130} y={D1.botY} width={260} height={56} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
          <text x={D1.x} y={D1.botY + 24} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontWeight={600}>
            one-click user picker
          </text>
          <text x={D1.x} y={D1.botY + 42} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            a test chooses who it is
          </text>
        </g>

        {/* difference two: the memory */}
        <g opacity={d2U * floorOp}>
          <rect x={D2.x - 130} y={D2.topY} width={260} height={56} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.3} />
          <text x={D2.x} y={D2.topY + 24} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontWeight={600}>
            account database — datacenter
          </text>
          <text x={D2.x} y={D2.topY + 42} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            opaque, remote, rate-limited
          </text>
          <rect x={D2.x - 130} y={D2.botY} width={260} height={56} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
          <text x={D2.x} y={D2.botY + 24} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontWeight={600}>
            in-memory store
          </text>
          <text x={D2.x} y={D2.botY + 42} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            boots from your seed in milliseconds
          </text>
        </g>

        {/* difference three: time */}
        <g opacity={d3U * floorOp}>
          <rect x={D3.x - 110} y={D3.topY} width={220} height={56} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.3} />
          <text x={D3.x} y={D3.topY + 24} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontWeight={600}>
            state lives forever
          </text>
          <text x={D3.x} y={D3.topY + 42} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            yesterday leaks into today
          </text>
          <rect x={D3.x - 110} y={D3.botY} width={220} height={56} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
          <text x={D3.x} y={D3.botY + 24} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontWeight={600}>
            reset() → back to the seed
          </text>
          <text x={D3.x} y={D3.botY + 42} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            every test starts at the same instant
          </text>
        </g>

        {/* the recap strip */}
        <g opacity={clamp01(recapU * 1.2)}>
          <rect x={140} y={240} width={1000} height={168} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={640} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={600}>
            The identity’s whole journey
          </text>
          {RECAP.map((step, i) => {
            const u = clamp01(recapU * RECAP.length - i);
            const x = 216 + i * 190;
            return (
              <g key={step} opacity={u}>
                <rect x={x - 62} y={316} width={124} height={40} rx={9} fill={colors.BG} stroke={colors.ACCENT} />
                <text x={x} y={341} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
                  {step}
                </text>
                {i < RECAP.length - 1 && (
                  <text x={x + 92} y={341} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                    →
                  </text>
                )}
              </g>
            );
          })}
          <text x={640} y={388} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} opacity={endU}>
            same dance, tamer partner — the signed-in test, without the login
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
