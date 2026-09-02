// Grounding: netlify/functions/lib/reverse-proxy-instructions.ts (npx --yes replayqa proxy … --allow,
// "Leave the command running for the entire test"), docs/frp-tunnel/overview.md (one tunnel server
// per connection, public port 7000, allowlisted local forward proxy), netlify/functions/v1.ts +
// netlify/functions/lib/reverse-proxy-environment.ts (connection_purpose 'ci' creates a Preview
// environment with trigger_type github-action and keeps the PR on the run).
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, RequestFlow } from '../../primitives';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// Layout: runner (left) — forward proxy (in runner) — tunnel — tunnel server (right) — QA browsers.
const RUNNER = { x: 110, y: 200, w: 380, h: 300 };
const APP = { x: 190, y: 300 };
const FWD = { x: 400, y: 300 };
const FRPS = { x: 830, y: 300 };
const BROWSERS = [{ x: 1080, y: 230 }, { x: 1080, y: 300 }, { x: 1080, y: 370 }];
const PATH = [{ x: BROWSERS[1]!.x - 40, y: 300 }, { x: FRPS.x + 90, y: 300 }, { x: FRPS.x - 90, y: 300 }, { x: FWD.x + 70, y: 300 }, { x: FWD.x - 70, y: 300 }, { x: APP.x + 70, y: APP.y }];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const runnerU = tl.channel('ci runner', 0);
  const appU = tl.channel('app on localhost', 0);
  const noPreviewU = tl.channel('no public preview', 0);
  const cmdU = tl.channel('proxy command', 0);
  const fwdU = tl.channel('forward proxy + allowlist', 0);
  const frpsU = tl.channel('tunnel server provisioned', 0);
  const tunnelU = tl.channel('tunnel draws', 0);
  const browsersU = tl.channel('qa browsers', 0);
  const reqU = tl.channel('request through tunnel', 0);
  const envU = tl.channel('preview env github-action', 0);
  const keepU = tl.channel('keep running warning', 0);
  const resultU = tl.channel('results post back', 0);
  const close = tl.channel('closing', 0);

  // BEAT 1 — the app lives only in CI
  tl.caption({ at: 0.4, dur: 6.0, text: 'Some apps never get a public preview. They boot inside the CI job, and only that runner can reach them.' });
  tl.tween(runnerU, 1, { at: 0.8, dur: 0.9, ease: ease.enter });
  tl.tween(appU, 1, { at: 1.6, dur: 0.7, ease: ease.enter });
  tl.tween(noPreviewU, 1, { at: 3.4, dur: 0.6, ease: ease.pop });

  // BEAT 2 — the runner runs the proxy
  tl.caption({ at: 6.8, dur: 6.4, text: 'So the runner brings the app to QA instead. It runs the Replay QA command line proxy, with a connection purpose of CI.' });
  tl.tween(noPreviewU, 0, { at: 7.0, dur: 0.5, ease: ease.enter });
  tl.tween(cam, { x: 330, y: 360, k: 1.22 }, { at: 7.0, dur: 1.2, ease: ease.move });
  tl.tween(cmdU, 1, { at: 7.6, dur: 0.9, ease: ease.enter });

  // BEAT 3 — forward proxy with allowlist
  tl.caption({ at: 13.6, dur: 6.6, text: 'The command uses your login, installs the tunnel client, and starts a local forward proxy that only allows the hosts you list.' });
  tl.tween(fwdU, 1, { at: 14.0, dur: 0.9, ease: ease.enter });
  tl.hold(20.2, 0.4);

  // BEAT 4 — tunnel server + browsers
  tl.caption({ at: 20.6, dur: 6.8, text: 'On the other side, Replay QA provisions a tunnel server for this connection, and its test browsers route through it into your runner.' });
  tl.tween(cam, CAMERA_HOME, { at: 20.8, dur: 1.3, ease: ease.move });
  tl.tween(frpsU, 1, { at: 21.6, dur: 0.8, ease: ease.enter });
  tl.tween(tunnelU, 1, { at: 22.4, dur: 1.4, ease: ease.draw });
  tl.tween(browsersU, 1, { at: 23.6, dur: 0.8, ease: ease.enter });
  tl.tween(reqU, 1, { at: 24.4, dur: 3.0, ease: ease.linear });

  // BEAT 5 — preview env stamped github-action
  tl.caption({ at: 27.8, dur: 6.6, text: 'A CI connection creates a preview environment triggered by the Github action, and keeps the pull request on the run for provenance.' });
  tl.tween(envU, 1, { at: 28.2, dur: 0.9, ease: ease.enter });
  tl.tween(reqU, 2, { at: 28.4, dur: 3.0, ease: ease.linear });

  // BEAT 6 — keep it running
  tl.caption({ at: 34.8, dur: 5.6, text: 'Leave the command running for the whole test. Stopping it disconnects the browsers from your app.' });
  tl.tween(keepU, 1, { at: 35.2, dur: 0.6, ease: ease.pop });
  tl.tween(reqU, 3, { at: 35.2, dur: 3.0, ease: ease.linear });

  // BEAT 7 — results post back
  tl.caption({ at: 40.8, dur: 6.4, text: 'When the run finishes, the results post back like any other preview run, even though the app never left the runner.' });
  tl.tween(keepU, 0, { at: 41.0, dur: 0.5, ease: ease.enter });
  tl.tween(resultU, 1, { at: 41.6, dur: 0.9, ease: ease.enter });
  tl.hold(47.2, 0.4);

  // BEAT 8 — closing
  tl.caption({ at: 47.6, dur: 5.2, text: 'Per pull request became per CI job, with no public deployment required.' });
  tl.tween(close, 1, { at: 48.0, dur: 1.0, ease: ease.move });
  tl.hold(52.8, 1.0);

  return { tl, cam, runnerU, appU, noPreviewU, cmdU, fwdU, frpsU, tunnelU, browsersU, reqU, envU, keepU, resultU, close };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const runner = s.get(scene.runnerU);
  const app = s.get(scene.appU);
  const noPreview = s.get(scene.noPreviewU);
  const cmd = s.get(scene.cmdU);
  const fwd = s.get(scene.fwdU);
  const frps = s.get(scene.frpsU);
  const tunnel = s.get(scene.tunnelU);
  const browsers = s.get(scene.browsersU);
  const req = s.get(scene.reqU);
  const env = s.get(scene.envU);
  const keep = s.get(scene.keepU);
  const result = s.get(scene.resultU);
  const close = s.get(scene.close);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close * 0.9}>
      <text x="640" y="64" textAnchor="middle" fill={colors.TEXT} fontSize="32" fontWeight="850">Bring CI into the tunnel</text>

      {/* CI runner */}
      <g opacity={runner}>
        <rect x={RUNNER.x} y={RUNNER.y} width={RUNNER.w} height={RUNNER.h} rx="22" fill="#0d1727" stroke={colors.MUTED} strokeWidth="2" strokeDasharray="8 6" />
        <text x={RUNNER.x + 20} y={RUNNER.y + 28} fill={colors.MUTED} fontSize="11" fontWeight="700" letterSpacing="1.5">CI RUNNER · pull request job</text>
      </g>
      <g opacity={app} transform={`translate(${APP.x} ${APP.y})`}>
        <rect x="-70" y="-30" width="140" height="60" rx="14" fill="#102033" stroke={colors.POSITIVE} strokeWidth="2.5" />
        <text x="0" y="-6" textAnchor="middle" fill={colors.POSITIVE} fontSize="12" fontWeight="700">the app</text>
        <text x="0" y="14" textAnchor="middle" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>localhost:3000</text>
      </g>
      <g opacity={noPreview} transform={`translate(${APP.x - 80} ${APP.y + 48})`}>
        <rect width="200" height="44" rx="12" fill="#1a0f18" stroke={colors.NEGATIVE} strokeWidth="2" />
        <text x="100" y="19" textAnchor="middle" fill={colors.NEGATIVE} fontSize="11" fontWeight="700">no public preview URL</text>
        <text x="100" y="35" textAnchor="middle" fill={colors.MUTED} fontSize="10">nothing outside can reach it</text>
      </g>

      {/* The command */}
      <g opacity={cmd} transform={`translate(${RUNNER.x + 20} ${RUNNER.y + RUNNER.h - 92 + (1 - cmd) * 10})`}>
        <rect width={RUNNER.w - 40} height="74" rx="12" fill="#0a0e1a" stroke={colors.GRID} strokeWidth="1.5" />
        <text x="14" y="22" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>$ npx --yes replayqa proxy --project prj_7c1 \</text>
        <text x="14" y="40" fill={colors.TEXT} fontSize="10" fontFamily={colors.font.mono}>    --qa-url https://qa.replay.io \</text>
        <text x="14" y="58" fill={colors.WARM} fontSize="10" fontFamily={colors.font.mono}>    --allow "app.example.com,api.example.com"</text>
      </g>

      {/* Forward proxy with allowlist */}
      <g opacity={fwd} transform={`translate(${FWD.x} ${FWD.y})`}>
        <rect x="-70" y="-34" width="140" height="68" rx="14" fill="#13233a" stroke={colors.ACCENT} strokeWidth="2.5" />
        <text y="-10" textAnchor="middle" fill={colors.ACCENT} fontSize="12" fontWeight="700">forward proxy</text>
        <text y="8" textAnchor="middle" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>tunnel client · frpc</text>
        <text y="24" textAnchor="middle" fill={colors.WARM} fontSize="10" fontFamily={colors.font.mono}>allow: 2 hosts</text>
      </g>
      <g opacity={fwd}>
        <Connection from={{ x: FWD.x - 70, y: FWD.y }} to={{ x: APP.x + 70, y: APP.y }} u={fwd} color={colors.POSITIVE} />
        <text x={(FWD.x - 70 + APP.x + 70) / 2} y={FWD.y - 44} textAnchor="middle" fill={colors.POSITIVE} fontSize="10" fontFamily={colors.font.mono}>only allowlisted hosts</text>
      </g>

      {/* Tunnel server */}
      <g opacity={frps} transform={`translate(${FRPS.x} ${FRPS.y})`}>
        <rect x="-90" y="-40" width="180" height="80" rx="16" fill="#221c35" stroke={colors.SECONDARY} strokeWidth="2.5" />
        <text y="-14" textAnchor="middle" fill={colors.SECONDARY} fontSize="12" fontWeight="700">tunnel server</text>
        <text y="6" textAnchor="middle" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>one per connection</text>
        <text y="24" textAnchor="middle" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>public :7000 · private :6000</text>
      </g>
      {/* Tunnel */}
      <g opacity={tunnel}>
        <rect x={FWD.x + 70} y={FRPS.y - 22} width={(FRPS.x - 90 - FWD.x - 70) * tunnel} height="44" rx="22" fill="rgba(167,139,250,0.08)" stroke={colors.SECONDARY} strokeWidth="2" strokeDasharray="10 8" />
        <text x={(FWD.x + FRPS.x) / 2} y={FRPS.y - 34} textAnchor="middle" fill={colors.SECONDARY} fontSize="11" fontFamily={colors.font.mono} opacity={clamp01(tunnel * 2 - 1)}>encrypted tunnel · outbound</text>
      </g>
      {/* QA browsers */}
      {BROWSERS.map((b, i) => <g key={i} opacity={clamp01(browsers * 3 - i)} transform={`translate(${b.x} ${b.y})`}>
        <rect x="-40" y="-22" width="150" height="44" rx="10" fill="#102033" stroke={colors.ACCENT} strokeWidth="2" />
        <text x="35" y="-3" textAnchor="middle" fill={colors.ACCENT} fontSize="11" fontWeight="700">QA browser {i + 1}</text>
        <text x="35" y="13" textAnchor="middle" fill={colors.MUTED} fontSize="9" fontFamily={colors.font.mono}>proxy → tunnel</text>
      </g>)}
      {browsers > 0 && [0, 2].map((i) => <line key={i} x1={BROWSERS[i]!.x - 40} y1={BROWSERS[i]!.y} x2={FRPS.x + 90} y2={FRPS.y} stroke={colors.GRID} strokeWidth="1.5" opacity={browsers} />)}
      {req > 0 && <RequestFlow path={PATH} u={req % 1} roundTrip color={colors.ACCENT} responseColor={colors.POSITIVE} opacity={browsers} />}

      {/* Preview env stamped */}
      <g opacity={env} transform={`translate(600 ${430 + (1 - env) * 12})`}>
        <rect width="300" height="98" rx="16" fill="#102033" stroke={colors.TEAL} strokeWidth="2.5" />
        <text x="16" y="24" fill={colors.TEAL} fontSize="11" fontWeight="700" letterSpacing="1.5">PREVIEW · created by CI connection</text>
        <text x="16" y="48" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>connection_purpose: ci</text>
        <text x="16" y="66" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>trigger_type: github-action</text>
        <text x="16" y="84" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>provenance: PR #128</text>
      </g>

      {/* Keep running */}
      <g opacity={keep} transform={`translate(${RUNNER.x + 20} ${RUNNER.y + RUNNER.h + 16})`}>
        <rect width={RUNNER.w - 40} height="40" rx="12" fill="#2a2416" stroke={colors.WARM} strokeWidth="2" />
        <text x={(RUNNER.w - 40) / 2} y="25" textAnchor="middle" fill={colors.WARM} fontSize="12" fontWeight="700">keep it running until the test ends</text>
      </g>

      {/* Results */}
      <g opacity={result} transform={`translate(930 ${430 + (1 - result) * 12})`}>
        <rect width="260" height="98" rx="16" fill="#13233a" stroke={colors.GRID} strokeWidth="2" />
        <text x="16" y="24" fill={colors.TEXT} fontSize="12" fontWeight="700">replay-qa commented</text>
        <text x="16" y="48" fill={colors.POSITIVE} fontSize="12">✓ 3 journeys passed on 9f3c2a1</text>
        <text x="16" y="70" fill={colors.ACCENT} fontSize="12" textDecoration="underline">recordings → · check: neutral</text>
      </g>
    </g>

    {/* Closing */}
    <g opacity={close}>
      <rect x="200" y="140" width="880" height="400" rx="40" fill="#0a0e1a" stroke={colors.SECONDARY} strokeWidth="3" />
      <text x="640" y="220" textAnchor="middle" fill={colors.TEXT} fontSize="36" fontWeight="850">no public deployment required</text>
      <g transform="translate(640 380)">
        <circle r="120" fill="none" stroke={colors.POSITIVE} strokeWidth="4" opacity="0.4" />
        <circle r="84" fill="none" stroke={colors.WARM} strokeWidth="4" opacity="0.5" />
        <circle r="54" fill="none" stroke={colors.TEAL} strokeWidth="4" opacity="0.7" />
        <circle r={32 * clamp01(close * 1.4 - 0.3)} fill="none" stroke={colors.SECONDARY} strokeWidth="4" />
        <text y="-132" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>production · weekly</text>
        <text y="-94" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>staging · nightly</text>
        <text y="-64" textAnchor="middle" fill={colors.TEAL} fontSize="14" fontFamily={colors.font.mono}>preview · per PR</text>
        <text y="6" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontFamily={colors.font.mono} opacity={clamp01(close * 2 - 1)}>CI tunnel</text>
      </g>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
