// Minting the Identity
//
// Grounding: @emulators/github routes/oauth.ts — POST /login/oauth/callback
// (randomBytes(20) code → pendingCodes map with PENDING_CODE_TTL_MS = 10 min,
// 302 back to redirect_uri with ?code&state) and POST /login/oauth/access_token
// (constantTimeSecretEqual(client_secret), pending code consumed and deleted,
// "gho_" + randomBytes token minted into the TokenMap, oauthGrant recorded);
// @emulators/core middleware/auth.ts authMiddleware (Bearer → tokenMap →
// authUser); examples/oauth callback route (token exchange + user info fetch
// → Session), examples/oauth/src/lib/session.ts encodeSession (JSON →
// base64url cookie), examples/oauth/src/app/dashboard/page.tsx.
//
// Centerpiece: a mint. The click stamps a one-time code into a pending tray
// under a ten-minute timer; the code rides back to the app, is traded server
// to server (secret compared in constant time), burns on use, and a fresh
// token coin is struck into the token map. The app spends the coin once on
// the user endpoint and FOLDS the returned profile into a session cookie.
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
import { TimerArc, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Layout — emulator mint on the left, the app on the right, one corridor.
// ---------------------------------------------------------------------------

const EMU = { x: 60, y: 92, w: 520, h: 476 } as const;
const APP = { x: 700, y: 92, w: 520, h: 476 } as const;

const TRAY = { x: 96, y: 136, w: 300, h: 104 } as const;
const TIMER = { cx: 470, cy: 188, r: 30 } as const;
const SECRET = { x: 96, y: 272, w: 448, h: 116 } as const;
const TOKMAP = { x: 96, y: 420, w: 448, h: 120 } as const;

const CB = { x: 736, y: 136, w: 448, h: 62 } as const;
const PROFILE = { x: 736, y: 250, w: 360, h: 152 } as const;
const COOKIE = { x: 756, y: 460, w: 408, h: 48 } as const;

// corridors (stage coords)
const CARRY_PATH = [
  { x: TRAY.x + TRAY.w - 10, y: 168 },
  { x: 640, y: 168 },
  { x: CB.x + 10, y: 168 },
] as const;
const XCHG_PATH = [
  { x: CB.x + 40, y: CB.y + CB.h + 12 },
  { x: 640, y: 232 },
  { x: SECRET.x + SECRET.w - 6, y: 310 },
] as const;
const COIN_PATH = [
  { x: TOKMAP.x + TOKMAP.w - 10, y: 452 },
  { x: 660, y: 430 },
  { x: PROFILE.x + 20, y: 402 },
] as const;

const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_TRAY: CameraState = { x: 330, y: 210, k: 1.3 };
const CAM_SECRET: CameraState = { x: 360, y: 340, k: 1.3 };
const CAM_APP: CameraState = { x: 900, y: 330, k: 1.2 };

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
// Timeline (~96s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TRAY, cameraInterp);

  const zonesU = tl.channel('zonesU', 0); // both party zones
  const codeU = tl.channel('codeU', 0); // code stamped into the tray
  const timerU = tl.channel('timerU', 1); // TTL arc, remaining fraction
  const carryU = tl.channel('carryU', 0); // browser carries code to the app
  const xchgU = tl.channel('xchgU', 0); // app → emulator token exchange
  const secretU = tl.channel('secretU', 0); // constant-time comparison
  const burnU = tl.channel('burnU', 0); // the code is consumed
  const coinU = tl.channel('coinU', 0); // token minted + row appears
  const spendU = tl.channel('spendU', 0); // token spent on the user endpoint
  const profileU = tl.channel('profileU', 0); // the seeded profile arrives
  const foldU = tl.channel('foldU', 0); // JSON folds into the cookie
  const dashU = tl.channel('dashU', 0); // dashboard verdict
  const dimU = tl.channel('dimU', 0);
  const recapU = tl.channel('recapU', 0); // journey strip

  // — beat 1 · the click leaves the picker —
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'The click leaves the picker, and the emulator starts doing exactly what the real provider would do: it mints a one-time code.',
  });
  tl.tween(zonesU, 1, { at: 0.7, dur: 1.3, ease: ease.draw });
  tl.tween(codeU, 1, { at: 3.4, dur: 0.7, ease: ease.pop });
  tl.hold(6.1, 0.5);

  // — beat 2 · pending, and expiring —
  tl.caption({
    at: 6.6,
    dur: 6.6,
    text: 'The code is random, remembered in a pending map next to the chosen login, and it expires in ten minutes — the emulator is exactly as nervous as a real provider.',
  });
  tl.tween(timerU, 0.965, { at: 6.6, dur: 6.0, ease: ease.linear });
  tl.hold(13.2, 0.5);

  // — beat 3 · the browser carries it home —
  tl.caption({
    at: 13.7,
    dur: 5.8,
    text: 'The browser is bounced back to your app’s callback address, carrying the code and the state it left with.',
  });
  tl.tween(cam, CAM_WIDE, { at: 13.9, dur: 1.3, ease: ease.move });
  tl.tween(carryU, 1, { at: 14.9, dur: 2.2, ease: ease.move });
  tl.tween(timerU, 0.955, { at: 13.7, dur: 5.4, ease: ease.linear });
  tl.hold(19.5, 0.5);

  // — beat 4 · the quiet leg —
  tl.caption({
    at: 20.0,
    dur: 5.8,
    text: 'Now the quiet part: your server trades the code for a token, server to server. The browser never sees this leg.',
  });
  tl.tween(xchgU, 1, { at: 21.0, dur: 2.0, ease: ease.move });
  tl.hold(25.8, 0.5);

  // — beat 5 · the secret, compared in constant time —
  tl.caption({
    at: 26.3,
    dur: 6.4,
    text: 'First the emulator checks the client secret — compared in constant time, the same defensive habit real providers have.',
  });
  tl.tween(cam, CAM_SECRET, { at: 26.5, dur: 1.2, ease: ease.move });
  tl.tween(secretU, 1, { at: 27.5, dur: 2.4, ease: ease.move });
  tl.hold(32.7, 0.6);

  // — beat 6 · one code, one use —
  tl.caption({
    at: 33.3,
    dur: 6.4,
    text: 'Then the code is looked up and destroyed. One code, one use. Replay it and you get the same error text the real provider would send you.',
  });
  tl.tween(cam, CAM_TRAY, { at: 33.5, dur: 1.2, ease: ease.move });
  tl.tween(burnU, 1, { at: 35.0, dur: 1.4, ease: ease.move });
  tl.hold(39.7, 0.5);

  // — beat 7 · the coin is struck —
  tl.caption({
    at: 40.2,
    dur: 6.6,
    text: 'In its place a fresh access token is struck — and written into the token map, pointing at octocat, carrying the scopes the request asked for.',
  });
  tl.tween(cam, CAM_WIDE, { at: 40.4, dur: 1.3, ease: ease.move });
  tl.tween(coinU, 1, { at: 41.6, dur: 1.6, ease: ease.move });
  tl.hold(46.8, 0.5);

  // — beat 8 · the injection point —
  tl.caption({
    at: 47.3,
    dur: 6.0,
    text: 'That map is the injection point. The token means nothing anywhere else on earth — but inside this emulator, it simply is octocat.',
  });
  tl.hold(53.3, 0.6);

  // — beat 9 · the token is spent —
  tl.caption({
    at: 53.9,
    dur: 6.4,
    text: 'Your app spends the token once on the user endpoint. The middleware looks it up in the map, and the seeded profile comes back as plain data.',
  });
  tl.tween(cam, CAM_APP, { at: 54.1, dur: 1.3, ease: ease.move });
  tl.tween(spendU, 1, { at: 54.9, dur: 1.8, ease: ease.move });
  tl.tween(profileU, 1, { at: 57.1, dur: 1.4, ease: ease.move });
  tl.hold(60.3, 0.5);

  // — beat 10 · folded into a cookie —
  tl.caption({
    at: 60.8,
    dur: 6.8,
    text: 'The app folds that identity into a session cookie — the profile is encoded and handed to the browser. From here on, the app trusts the cookie, not the provider.',
  });
  tl.tween(foldU, 1, { at: 62.0, dur: 1.8, ease: ease.move });
  tl.tween(dashU, 1, { at: 64.4, dur: 0.7, ease: ease.pop });
  tl.hold(67.6, 0.6);

  // — beat 11 · the whole injection, end to end —
  tl.caption({
    at: 68.2,
    dur: 7.6,
    text: 'And that is the whole injection: a seed entry became a picker button, the button became a code, the code became a token, and the token became a session. The dashboard greets octocat.',
  });
  tl.tween(dimU, 1, { at: 68.6, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 68.6, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 1, { at: 70.0, dur: 2.8, ease: ease.move });
  tl.hold(75.8, 1.6);

  return {
    tl,
    cam,
    zonesU,
    codeU,
    timerU,
    carryU,
    xchgU,
    secretU,
    burnU,
    coinU,
    spendU,
    profileU,
    foldU,
    dashU,
    dimU,
    recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const RECAP = ['seed entry', 'picker click', 'one-time code', 'access token', 'session cookie'] as const;

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const zonesU = s.get(scene.zonesU);
  const codeU = s.get(scene.codeU);
  const timerU = s.get(scene.timerU);
  const carryU = s.get(scene.carryU);
  const xchgU = s.get(scene.xchgU);
  const secretU = s.get(scene.secretU);
  const burnU = s.get(scene.burnU);
  const coinU = s.get(scene.coinU);
  const spendU = s.get(scene.spendU);
  const profileU = s.get(scene.profileU);
  const foldU = s.get(scene.foldU);
  const dashU = s.get(scene.dashU);
  const dimU = s.get(scene.dimU);
  const recapU = s.get(scene.recapU);

  const floorOp = 1 - 0.88 * dimU;
  const pc = along(CARRY_PATH, carryU);
  const px = along(XCHG_PATH, xchgU);
  const pk = along(COIN_PATH, clamp01(spendU)); // the coin rides out on the spend
  const codeOp = codeU * (1 - burnU);

  // constant-time bars: both fill fully in lockstep, then verdict
  const barFill = clamp01(secretU * 1.25);
  const verdict = clamp01(secretU * 4 - 3);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <Zone x={EMU.x} y={EMU.y} w={EMU.w} h={EMU.h} label="emulator — localhost:4001" kind="group" u={zonesU} color={colors.ACCENT} dim={0.85 * dimU} />
        <Zone x={APP.x} y={APP.y} w={APP.w} h={APP.h} label="your app — localhost:3000" kind="group" u={zonesU} color={colors.GRID} dim={0.85 * dimU} />

        <g opacity={floorOp}>
          {/* the pending-codes tray */}
          <g opacity={clamp01(zonesU * 1.4 - 0.3)}>
            <rect x={TRAY.x} y={TRAY.y} width={TRAY.w} height={TRAY.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={TRAY.x + 16} y={TRAY.y + 26} fill={colors.MUTED} fontSize={12.5} fontStyle="italic">
              pending codes — one use each
            </text>
            {/* the code chip; burns on use */}
            <g opacity={codeOp}>
              <rect x={TRAY.x + 16} y={TRAY.y + 42} width={200} height={40} rx={9} fill={colors.BG} stroke={burnU > 0.05 ? colors.NEGATIVE : colors.WARM} strokeWidth={1.5} />
              <text x={TRAY.x + 32} y={TRAY.y + 67} fill={burnU > 0.05 ? colors.NEGATIVE : colors.WARM} fontSize={13.5} fontFamily={MONO}>
                code 3f9a1c… → octocat
              </text>
            </g>
            {burnU > 0.05 && burnU < 1 && (
              <text x={TRAY.x + 116} y={TRAY.y + 67} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={700} opacity={Math.sin(Math.PI * burnU)}>
                consumed
              </text>
            )}
            {burnU > 0.9 && (
              <text x={TRAY.x + 16} y={TRAY.y + 67} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO} opacity={burnU}>
                (empty — replay gets an error)
              </text>
            )}
          </g>

          {/* the ten-minute clock */}
          <g opacity={codeU}>
            <TimerArc cx={TIMER.cx} cy={TIMER.cy} r={TIMER.r} u={timerU} color={colors.WARM} />
            <text x={TIMER.cx} y={TIMER.cy + 5} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
              10 min
            </text>
            <text x={TIMER.cx} y={TIMER.cy + TIMER.r + 18} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              then it expires
            </text>
          </g>

          {/* the secret check */}
          <g opacity={clamp01(secretU * 2.5)}>
            <rect x={SECRET.x} y={SECRET.y} width={SECRET.w} height={SECRET.h} rx={12} fill={colors.PANEL} stroke={verdict > 0.5 ? colors.POSITIVE : colors.GRID} strokeWidth={1.4} />
            <text x={SECRET.x + 16} y={SECRET.y + 26} fill={colors.MUTED} fontSize={12.5} fontStyle="italic">
              client secret — compared in constant time
            </text>
            <text x={SECRET.x + 16} y={SECRET.y + 52} fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
              sent
            </text>
            <rect x={SECRET.x + 70} y={SECRET.y + 40} width={330} height={14} rx={4} fill={colors.BG} stroke={colors.GRID} />
            <rect x={SECRET.x + 70} y={SECRET.y + 40} width={330 * barFill} height={14} rx={4} fill={colors.SECONDARY} opacity={0.85} />
            <text x={SECRET.x + 16} y={SECRET.y + 80} fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
              seeded
            </text>
            <rect x={SECRET.x + 70} y={SECRET.y + 68} width={330} height={14} rx={4} fill={colors.BG} stroke={colors.GRID} />
            <rect x={SECRET.x + 70} y={SECRET.y + 68} width={330 * barFill} height={14} rx={4} fill={colors.SECONDARY} opacity={0.85} />
            <text x={SECRET.x + 16} y={SECRET.y + 104} fill={verdict > 0.5 ? colors.POSITIVE : colors.MUTED} fontSize={13} fontWeight={700} opacity={Math.max(0.3, verdict)}>
              {verdict > 0.5 ? '✓ constantTimeSecretEqual — every byte, every time' : 'comparing every byte, no early exit…'}
            </text>
          </g>

          {/* the token map — the injection point */}
          <g opacity={clamp01(zonesU * 1.4 - 0.4)}>
            <rect x={TOKMAP.x} y={TOKMAP.y} width={TOKMAP.w} height={TOKMAP.h} rx={12} fill={colors.PANEL} stroke={coinU > 0.5 ? colors.WARM : colors.GRID} strokeWidth={1.3} />
            <text x={TOKMAP.x + 16} y={TOKMAP.y + 26} fill={colors.MUTED} fontSize={12.5} fontStyle="italic">
              token map — token → identity
            </text>
            <text x={TOKMAP.x + 16} y={TOKMAP.y + 52} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
              gho_test_token_admin → admin
            </text>
            {/* the freshly struck row */}
            <g opacity={clamp01(coinU * 2 - 0.6)}>
              <rect x={TOKMAP.x + 10} y={TOKMAP.y + 64} width={TOKMAP.w - 20} height={30} rx={7} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={TOKMAP.x + 20} y={TOKMAP.y + 84} fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
                gho_Zk4… → octocat · user repo
              </text>
            </g>
            <text x={TOKMAP.x + 16} y={TOKMAP.y + 112} fill={colors.MUTED} fontSize={11}>
              fresh mint — meaningless outside, authoritative inside
            </text>
          </g>

          {/* the app: callback route */}
          <g opacity={clamp01(zonesU * 1.4 - 0.3)}>
            <rect x={CB.x} y={CB.y} width={CB.w} height={CB.h} rx={12} fill={colors.PANEL} stroke={carryU > 0.9 ? colors.ACCENT : colors.GRID} strokeWidth={1.3} />
            <text x={CB.x + 16} y={CB.y + 26} fill={colors.MUTED} fontSize={12} fontStyle="italic">
              callback route
            </text>
            <text x={CB.x + 16} y={CB.y + 48} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
              GET /api/auth/callback/github?code=…&state=…
            </text>
          </g>

          {/* profile JSON → folds into the cookie */}
          <g opacity={profileU * (1 - foldU)}>
            <rect x={PROFILE.x} y={PROFILE.y} width={PROFILE.w} height={PROFILE.h} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.3} />
            <text x={PROFILE.x + 16} y={PROFILE.y + 26} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              GET /user · Authorization: Bearer gho_Zk4…
            </text>
            <text x={PROFILE.x + 16} y={PROFILE.y + 54} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              {'{ "login": "octocat",'}
            </text>
            <text x={PROFILE.x + 16} y={PROFILE.y + 78} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              {'  "name": "The Octocat",'}
            </text>
            <text x={PROFILE.x + 16} y={PROFILE.y + 102} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              {'  "email": "octocat@github.com" }'}
            </text>
            <text x={PROFILE.x + 16} y={PROFILE.y + 132} fill={colors.POSITIVE} fontSize={11.5}>
              straight from the seed — via the middleware lookup
            </text>
          </g>

          {/* the cookie the profile folds into */}
          <g opacity={clamp01(foldU * 1.6)}>
            <rect x={COOKIE.x} y={COOKIE.y} width={COOKIE.w} height={COOKIE.h} rx={12} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.5} />
            <text x={COOKIE.x + 16} y={COOKIE.y + 20} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              Set-Cookie (encoded profile, base sixty-four)
            </text>
            <text x={COOKIE.x + 16} y={COOKIE.y + 38} fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO}>
              session=eyJwcm92aWRlciI6ImdpdGh1YiIs…
            </text>
          </g>
          {/* the fold itself: profile panel shrinking toward the cookie */}
          {foldU > 0.02 && foldU < 0.98 && (
            <rect
              x={lerp(PROFILE.x, COOKIE.x, foldU)}
              y={lerp(PROFILE.y, COOKIE.y, foldU)}
              width={lerp(PROFILE.w, COOKIE.w, foldU)}
              height={lerp(PROFILE.h, COOKIE.h, foldU)}
              rx={12}
              fill="none"
              stroke={colors.POSITIVE}
              strokeWidth={1.5}
              opacity={0.8 * Math.sin(Math.PI * foldU) + 0.2}
            />
          )}

          {/* dashboard verdict */}
          <g opacity={dashU}>
            <rect x={CB.x + 300} y={CB.y - 4} width={148} height={34} rx={9} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.4} />
            <text x={CB.x + 374} y={CB.y + 18} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontWeight={700}>
              dashboard ✓
            </text>
          </g>

          {/* traveling packets */}
          {carryU > 0.01 && carryU < 1 && (
            <g>
              <circle cx={pc.x} cy={pc.y} r={8} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
              <text x={pc.x} y={pc.y - 14} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
                ?code&state
              </text>
            </g>
          )}
          {xchgU > 0.01 && xchgU < 1 && (
            <g>
              <circle cx={px.x} cy={px.y} r={8} fill={colors.SECONDARY} stroke={colors.BG} strokeWidth={1.5} />
              <text x={px.x} y={px.y - 14} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontFamily={MONO}>
                POST /login/oauth/access_token
              </text>
            </g>
          )}
          {spendU > 0.01 && spendU < 1 && (
            <g>
              <circle cx={pk.x} cy={pk.y} r={9} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
              <text x={pk.x} y={pk.y + 22} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
                Bearer gho_Zk4…
              </text>
            </g>
          )}
        </g>

        {/* the recap strip — the identity's whole journey */}
        <g opacity={clamp01(recapU * 1.2)}>
          <rect x={140} y={250} width={1000} height={160} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={600}>
            Dashboard — signed in as octocat
          </text>
          {RECAP.map((step, i) => {
            const u = clamp01(recapU * RECAP.length - i);
            const x = 216 + i * 190;
            return (
              <g key={step} opacity={u}>
                <rect x={x - 62} y={322} width={124} height={40} rx={9} fill={colors.BG} stroke={colors.ACCENT} />
                <text x={x} y={347} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
                  {step}
                </text>
                {i < RECAP.length - 1 && (
                  <text x={x + 92} y={347} textAnchor="middle" fill={colors.MUTED} fontSize={15} opacity={u}>
                    →
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
