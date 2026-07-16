// One Click Instead of a Password
//
// Grounding: examples/oauth/src/app/api/auth/[provider]/route.ts (builds the
// authorize URL: client_id, redirect_uri, scope, state, response_type),
// @emulators/github routes/oauth.ts GET /login/oauth/authorize (client_id
// looked up in seeded oauthApps → error page for strangers; redirect_uri
// checked with matchesRedirectUri; then one renderUserButton per seeded
// user), @emulators/core oauth-helpers.ts matchesRedirectUri (normalize +
// compare), core ui.ts renderUserButton (avatar letter, login, name, email).
//
// Centerpiece: the authorize URL ASSEMBLES like train cars, passes two green
// gates (known client? registered return address?), and the emulator renders
// its stand-in for the password page — a picker of seeded users. A Playwright
// cursor glides in and clicks octocat. That click is the entire login.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Layout — URL bar on top, the two gates on the left, the picker on the right.
// ---------------------------------------------------------------------------

const BAR = { x: 120, y: 78, w: 1040, h: 46 } as const;
const PARAMS = [
  { key: 'client_id', val: 'emu_github_client_id' },
  { key: 'redirect_uri', val: '…/api/auth/callback/github' },
  { key: 'scope', val: 'user repo' },
  { key: 'state', val: 'random nonce' },
] as const;
const PARAM_W = 252;
const PARAM_Y = 148;

const GATE1 = { x: 120, y: 226, w: 400, h: 140 } as const;
const GATE2 = { x: 120, y: 386, w: 400, h: 140 } as const;

const PICKER = { x: 620, y: 226, w: 440, h: 336 } as const;
const BTN_H = 86;
const btnY = (i: number): number => PICKER.y + 118 + i * (BTN_H + 14);
const USERS = [
  { login: 'octocat', name: 'The Octocat', email: 'octocat@github.com' },
  { login: 'developer', name: 'Developer', email: 'dev@example.com' },
] as const;

const TESTCHIP = { x: 120, y: 546, w: 400, h: 56 } as const;

// the Playwright cursor's glide: off-stage → hover over the octocat button
const CURSOR_FROM = { x: 1250, y: 640 };
const CURSOR_TO = { x: PICKER.x + PICKER.w / 2 + 60, y: btnY(0) + BTN_H / 2 + 6 };

const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_BAR: CameraState = { x: 640, y: 170, k: 1.24 };
const CAM_GATES: CameraState = { x: 380, y: 360, k: 1.3 };
const CAM_PICKER: CameraState = { x: 800, y: 380, k: 1.22 };

// ---------------------------------------------------------------------------
// Timeline (~80s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_BAR, cameraInterp);

  const barU = tl.channel('barU', 0); // the authorize URL base
  const paramU = tl.channel('paramU', 0); // four param cars snap on
  const arriveU = tl.channel('arriveU', 0); // "arrives at the emulator" pulse
  const gate1U = tl.channel('gate1U', 0); // known client? check
  const gate2U = tl.channel('gate2U', 0); // registered return address? check
  const pickerU = tl.channel('pickerU', 0); // the picker page renders
  const noPassU = tl.channel('noPassU', 0); // "no password field" note
  const cursorU = tl.channel('cursorU', 0); // Playwright cursor glide
  const clickU = tl.channel('clickU', 0); // click ripple + button highlight
  const postU = tl.channel('postU', 0); // the chosen login posts back
  const dimU = tl.channel('dimU', 0);
  const teaseU = tl.channel('teaseU', 0);

  // — beat 1 · the test clicks sign in —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'The cast is seeded. Now the test clicks sign in, and the app starts a completely standard authorization request — nothing about it knows an emulator is listening.',
  });
  tl.tween(barU, 1, { at: 0.8, dur: 1.2, ease: ease.draw });
  tl.hold(6.7, 0.5);

  // — beat 2 · the URL assembles —
  tl.caption({
    at: 7.2,
    dur: 7.2,
    text: 'The request is just a web address with claims bolted on: which client is asking, where to send the browser back, what access it wants, and a random state to keep the round trip honest.',
  });
  tl.tween(paramU, 1, { at: 7.6, dur: 4.2, ease: ease.move });
  tl.hold(14.4, 0.6);

  // — beat 3 · it lands on the emulator —
  tl.caption({
    at: 15.0,
    dur: 5.4,
    text: 'The browser follows that address — not out to the public internet, but to the emulator sitting on its local port.',
  });
  tl.tween(cam, CAM_WIDE, { at: 15.2, dur: 1.3, ease: ease.move });
  tl.tween(arriveU, 1, { at: 16.6, dur: 0.8, ease: ease.pop });
  tl.hold(20.4, 0.5);

  // — beat 4 · gate one: known client —
  tl.caption({
    at: 20.9,
    dur: 6.4,
    text: 'Gate one: the client id must match an app registered in the seed. Strangers get an error page, exactly as they would in production.',
  });
  tl.tween(cam, CAM_GATES, { at: 21.1, dur: 1.2, ease: ease.move });
  tl.tween(gate1U, 1, { at: 22.3, dur: 1.6, ease: ease.move });
  tl.hold(27.3, 0.5);

  // — beat 5 · gate two: registered return address —
  tl.caption({
    at: 27.8,
    dur: 6.8,
    text: 'Gate two: the return address must be one the app registered. The emulator normalizes both addresses and compares them — a real protocol check, not a formality.',
  });
  tl.tween(gate2U, 1, { at: 28.6, dur: 1.8, ease: ease.move });
  tl.hold(34.6, 0.6);

  // — beat 6 · the picker renders —
  tl.caption({
    at: 35.2,
    dur: 6.6,
    text: 'And then, where the real provider would demand a password, the emulator renders something friendlier: a picker. One button for every user in the seed.',
  });
  tl.tween(cam, CAM_PICKER, { at: 35.4, dur: 1.4, ease: ease.move });
  tl.tween(pickerU, 1, { at: 36.4, dur: 2.4, ease: ease.move });
  tl.hold(41.8, 0.5);

  // — beat 7 · no password exists —
  tl.caption({
    at: 42.3,
    dur: 6.2,
    text: 'There is no password box because there are no passwords — identity here is a choice, not a proof. That inversion is the entire trick.',
  });
  tl.tween(noPassU, 1, { at: 43.5, dur: 0.8, ease: ease.enter });
  tl.hold(48.5, 0.5);

  // — beat 8 · the test clicks octocat —
  tl.caption({
    at: 49.0,
    dur: 6.4,
    text: 'For a test this page is heaven: stable markup, known names. The script finds the button that says octocat, and clicks it.',
  });
  tl.tween(cursorU, 1, { at: 49.6, dur: 2.2, ease: ease.move });
  tl.tween(clickU, 1, { at: 52.4, dur: 0.6, ease: ease.pop });
  tl.hold(55.4, 0.5);

  // — beat 9 · the click posts the choice back —
  tl.caption({
    at: 55.9,
    dur: 6.2,
    text: 'That click posts the chosen login back to the emulator, together with everything the request carried in — return address, scope, state, client id.',
  });
  tl.tween(postU, 1, { at: 57.1, dur: 1.4, ease: ease.move });
  tl.hold(62.1, 0.6);

  // — beat 10 · one click is the whole login —
  tl.caption({
    at: 62.7,
    dur: 6.6,
    text: 'One click. That is the whole login. What the emulator mints in response — a code, a token, and finally a session — is the next chapter.',
  });
  tl.tween(dimU, 1, { at: 63.1, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 63.1, dur: 1.4, ease: ease.move });
  tl.tween(teaseU, 1, { at: 64.5, dur: 0.7, ease: ease.pop });
  tl.hold(69.3, 1.4);

  return { tl, cam, barU, paramU, arriveU, gate1U, gate2U, pickerU, noPassU, cursorU, clickU, postU, dimU, teaseU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const barU = s.get(scene.barU);
  const paramU = s.get(scene.paramU);
  const arriveU = s.get(scene.arriveU);
  const gate1U = s.get(scene.gate1U);
  const gate2U = s.get(scene.gate2U);
  const pickerU = s.get(scene.pickerU);
  const noPassU = s.get(scene.noPassU);
  const cursorU = s.get(scene.cursorU);
  const clickU = s.get(scene.clickU);
  const postU = s.get(scene.postU);
  const dimU = s.get(scene.dimU);
  const teaseU = s.get(scene.teaseU);

  const floorOp = 1 - 0.87 * dimU;
  const cx = lerp(CURSOR_FROM.x, CURSOR_TO.x, cursorU);
  const cy = lerp(CURSOR_FROM.y, CURSOR_TO.y, cursorU) - 40 * Math.sin(Math.PI * cursorU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the authorize URL bar */}
        <g opacity={barU * floorOp}>
          <rect x={BAR.x} y={BAR.y} width={BAR.w} height={BAR.h} rx={12} fill={colors.PANEL} stroke={arriveU > 0.4 ? colors.ACCENT : colors.GRID} strokeWidth={1.4} />
          <circle cx={BAR.x + 24} cy={BAR.y + 23} r={6} fill="none" stroke={colors.MUTED} strokeWidth={1.5} />
          <text x={BAR.x + 44} y={BAR.y + 29} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
            http://localhost:4001/login/oauth/authorize
          </text>
          <text x={BAR.x + 480} y={BAR.y + 29} fill={colors.ACCENT} fontSize={15} fontFamily={MONO} opacity={clamp01(paramU * 3)}>
            ?client_id=…&redirect_uri=…&scope=…&state=…
          </text>
        </g>

        {/* the param cars snapping on */}
        <g opacity={floorOp}>
          {PARAMS.map((p, i) => {
            const u = win(paramU, PARAMS.length, i, 1.6);
            if (u <= 0) return null;
            const x = lerp(STAGE_W + 40, BAR.x + 10 + i * (PARAM_W + 10), u);
            return (
              <g key={p.key} opacity={u}>
                <rect x={x} y={PARAM_Y} width={PARAM_W} height={52} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
                <text x={x + 14} y={PARAM_Y + 21} fill={colors.ACCENT} fontSize={12.5} fontFamily={MONO}>
                  {p.key}
                </text>
                <text x={x + 14} y={PARAM_Y + 41} fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
                  {p.val}
                </text>
              </g>
            );
          })}
        </g>

        {/* gate one: known client */}
        <g opacity={Math.max(gate1U, 0) * floorOp}>
          <rect x={GATE1.x} y={GATE1.y} width={GATE1.w} height={GATE1.h} rx={12} fill={colors.PANEL} stroke={gate1U > 0.8 ? colors.POSITIVE : colors.GRID} strokeWidth={1.4} />
          <text x={GATE1.x + 18} y={GATE1.y + 28} fill={colors.MUTED} fontSize={13} fontStyle="italic">
            gate one — is the client registered?
          </text>
          <text x={GATE1.x + 18} y={GATE1.y + 58} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
            client_id: emu_github_client_id
          </text>
          <text x={GATE1.x + 18} y={GATE1.y + 82} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
            seeded oauth_apps: emu_github_client_id
          </text>
          <text x={GATE1.x + 18} y={GATE1.y + 114} fill={gate1U > 0.8 ? colors.POSITIVE : colors.MUTED} fontSize={14} fontWeight={700} opacity={clamp01(gate1U * 1.4 - 0.4)}>
            {gate1U > 0.8 ? '✓ found in the seed' : 'looking up…'}
          </text>
        </g>

        {/* gate two: registered return address */}
        <g opacity={Math.max(gate2U, 0) * floorOp}>
          <rect x={GATE2.x} y={GATE2.y} width={GATE2.w} height={GATE2.h} rx={12} fill={colors.PANEL} stroke={gate2U > 0.8 ? colors.POSITIVE : colors.GRID} strokeWidth={1.4} />
          <text x={GATE2.x + 18} y={GATE2.y + 28} fill={colors.MUTED} fontSize={13} fontStyle="italic">
            gate two — is the return address registered?
          </text>
          <text x={GATE2.x + 18} y={GATE2.y + 58} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
            incoming: …/api/auth/callback/github
          </text>
          <text x={GATE2.x + 18} y={GATE2.y + 82} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
            registered: …/api/auth/callback/github
          </text>
          <text x={GATE2.x + 18} y={GATE2.y + 114} fill={gate2U > 0.8 ? colors.POSITIVE : colors.MUTED} fontSize={14} fontWeight={700} opacity={clamp01(gate2U * 1.4 - 0.4)}>
            {gate2U > 0.8 ? '✓ matchesRedirectUri' : 'normalizing…'}
          </text>
        </g>

        {/* the picker — the emulator's stand-in for the password page */}
        <g opacity={pickerU * floorOp}>
          <rect x={PICKER.x} y={PICKER.y} width={PICKER.w} height={PICKER.h} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={PICKER.x + PICKER.w / 2} y={PICKER.y + 44} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={600}>
            Sign in to GitHub
          </text>
          <text x={PICKER.x + PICKER.w / 2} y={PICKER.y + 72} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            Authorize Code App to access your account.
          </text>
          {USERS.map((u, i) => {
            const hot = i === 0 && clickU > 0.05;
            const bu = win(clamp01(pickerU * 1.3 - 0.3), USERS.length, i, 1.5);
            return (
              <g key={u.login} opacity={bu}>
                <rect
                  x={PICKER.x + 24}
                  y={btnY(i)}
                  width={PICKER.w - 48}
                  height={BTN_H}
                  rx={12}
                  fill={hot ? colors.BG : colors.BG}
                  stroke={hot ? colors.WARM : colors.GRID}
                  strokeWidth={hot ? 2 : 1.2}
                />
                <circle cx={PICKER.x + 60} cy={btnY(i) + BTN_H / 2} r={19} fill={colors.PANEL} stroke={hot ? colors.WARM : colors.ACCENT} />
                <text x={PICKER.x + 60} y={btnY(i) + BTN_H / 2 + 6} textAnchor="middle" fill={hot ? colors.WARM : colors.ACCENT} fontSize={16} fontWeight={700}>
                  {u.login[0].toUpperCase()}
                </text>
                <text x={PICKER.x + 94} y={btnY(i) + 32} fill={colors.TEXT} fontSize={15.5} fontFamily={MONO}>
                  {u.login}
                </text>
                <text x={PICKER.x + 94} y={btnY(i) + 52} fill={colors.MUTED} fontSize={12.5}>
                  {u.name}
                </text>
                <text x={PICKER.x + 94} y={btnY(i) + 70} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                  {u.email}
                </text>
              </g>
            );
          })}
          {/* the missing password field */}
          <text x={PICKER.x + PICKER.w / 2} y={PICKER.y + PICKER.h + 26} textAnchor="middle" fill={colors.SECONDARY} fontSize={13.5} opacity={noPassU}>
            no password field — identity is a choice, not a proof
          </text>
        </g>

        {/* the Playwright cursor + click ripple */}
        {cursorU > 0.02 && (
          <g opacity={floorOp}>
            {clickU > 0.05 && clickU < 1 && (
              <circle cx={CURSOR_TO.x} cy={CURSOR_TO.y} r={10 + 26 * clickU} fill="none" stroke={colors.WARM} strokeWidth={2.5 * (1 - clickU)} opacity={1 - clickU} />
            )}
            <path
              d={`M ${cx} ${cy} l 0 20 l 5.5 -5 l 4.5 10 l 4 -2 l -4.5 -10 l 7.5 -0.5 Z`}
              fill={colors.TEXT}
              stroke={colors.BG}
              strokeWidth={1.2}
            />
          </g>
        )}

        {/* the test's line of code */}
        <g opacity={clamp01(cursorU * 2) * floorOp}>
          <rect x={TESTCHIP.x} y={TESTCHIP.y} width={TESTCHIP.w} height={TESTCHIP.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={TESTCHIP.x + 16} y={TESTCHIP.y + 24} fill={colors.MUTED} fontSize={11.5} fontStyle="italic">
            your Playwright test
          </text>
          <text x={TESTCHIP.x + 16} y={TESTCHIP.y + 44} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
            {"await page.getByText('octocat').click()"}
          </text>
        </g>

        {/* the choice posting back */}
        <g opacity={postU * floorOp}>
          <rect x={PICKER.x + 24} y={PICKER.y + PICKER.h + 40} width={PICKER.w - 48} height={54} rx={10} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.3} />
          <text x={PICKER.x + 40} y={PICKER.y + PICKER.h + 62} fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
            POST /login/oauth/callback
          </text>
          <text x={PICKER.x + 40} y={PICKER.y + PICKER.h + 82} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            login=octocat · redirect_uri · scope · state · client_id
          </text>
        </g>

        {/* closing card */}
        <g opacity={teaseU}>
          <rect x={370} y={250} width={540} height={150} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={640} y={315} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            One click. Now mint it.
          </text>
          <text x={640} y={355} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            next: code → token → session cookie
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
