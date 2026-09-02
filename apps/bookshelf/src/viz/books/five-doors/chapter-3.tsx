// Grounding: docs/github-app/overview.md (webhook → createVersion + in_progress "Replay QA" check
// run + sticky comment; version parks until deployment_status / commit status supplies the preview
// URL; check concludes neutral/success/failure), src/lib/githubTestRun.ts (githubPrRunStatus →
// 'awaiting-deployment'), src/lib/githubTestingOptions.ts (prTesting 'events' copy),
// docs/issue-trackers.md (github | linear | jira).
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const LANE_Y = 300;
const GATE_X = 640;
const JOURNEYS = ['Guest checkout', 'Apply coupon', 'Search and filter'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const nightU = tl.channel('nightly bug already merged', 0);
  const appU = tl.channel('github app installed', 0);
  const prU = tl.channel('pull request opens', 0);
  const commitX = tl.channel('commit travels', 120);
  const checkU = tl.channel('check run posted', 0);
  const parkU = tl.channel('parked at gate', 0);
  const deployU = tl.channel('deployment status arrives', 0);
  const gateU = tl.channel('gate opens', 0);
  const runU = tl.channel('journeys run on preview', 0);
  const commentU = tl.channel('comment fills in', 0);
  const concludeU = tl.channel('check concludes', 0);
  const bugU = tl.channel('bug tagged with pr', 0);
  const trackerU = tl.channel('issue filed', 0);
  const close = tl.channel('closing', 0);

  // BEAT 1 — nightly finds bugs after the merge
  tl.caption({ at: 0.4, dur: 6.2, text: 'Nightly is good, but a bug found at night is already merged. The next step is testing each change before it lands.' });
  tl.tween(nightU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(nightU, 0.12, { at: 5.6, dur: 0.8, ease: ease.enter });

  // BEAT 2 — install the app
  tl.caption({ at: 6.8, dur: 5.6, text: 'Install the Replay QA Github App, and point pull request testing at Github events.' });
  tl.tween(appU, 1, { at: 7.2, dur: 0.8, ease: ease.enter });

  // BEAT 3 — PR opens, version + check
  tl.caption({ at: 12.6, dur: 6.6, text: 'When a pull request opens, QA records a version for that commit and posts a check that says it is waiting for a deployment.' });
  tl.tween(prU, 1, { at: 12.8, dur: 0.7, ease: ease.enter });
  tl.tween(commitX, GATE_X - 60, { at: 13.4, dur: 2.2, ease: ease.move });
  tl.tween(checkU, 1, { at: 15.0, dur: 0.6, ease: ease.pop });
  tl.tween(parkU, 1, { at: 15.6, dur: 0.6, ease: ease.enter });

  // BEAT 4 — parked until deployment
  tl.caption({ at: 19.4, dur: 6.4, text: 'The version parks until Github reports a preview deployment, from Vercel, Netlify, or your own workflow.' });
  tl.tween(cam, { x: 660, y: 300, k: 1.1 }, { at: 19.6, dur: 1.2, ease: ease.move });
  tl.tween(deployU, 1, { at: 22.4, dur: 2.0, ease: ease.linear });

  // BEAT 5 — preview URL, run
  tl.caption({ at: 26.0, dur: 6.4, text: 'That deployment carries the preview address, and QA runs your journeys against it as a preview environment.' });
  tl.tween(gateU, 1, { at: 26.2, dur: 0.8, ease: ease.move });
  tl.tween(commitX, 900, { at: 27.0, dur: 1.6, ease: ease.move });
  tl.tween(runU, 1, { at: 28.4, dur: 3.6, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 28.8, dur: 1.3, ease: ease.move });

  // BEAT 6 — comment + check conclude
  tl.caption({ at: 32.6, dur: 7.0, text: 'The sticky comment updates with which journeys passed, which failed, and a link to the recording. The check turns green, neutral, or red.' });
  tl.tween(commentU, 1, { at: 33.0, dur: 1.4, ease: ease.enter });
  tl.tween(concludeU, 1, { at: 37.2, dur: 0.6, ease: ease.pop });

  // BEAT 7 — bugs tagged + issue tracker
  tl.caption({ at: 39.8, dur: 6.8, text: 'Bugs found this way are tagged with the pull request number, and with issue filing on they land in Github, Linear, or Jira.' });
  tl.tween(bugU, 1, { at: 40.2, dur: 0.8, ease: ease.enter });
  tl.tween(trackerU, 1, { at: 43.4, dur: 0.8, ease: ease.enter });
  tl.hold(46.8, 0.4);

  // BEAT 8 — loop closes per PR
  tl.caption({ at: 47.2, dur: 5.6, text: 'Now the loop closes per pull request, before anything reaches staging.' });
  tl.tween(close, 1, { at: 47.6, dur: 1.0, ease: ease.move });
  tl.hold(52.8, 1.0);

  return { tl, cam, nightU, appU, prU, commitX, checkU, parkU, deployU, gateU, runU, commentU, concludeU, bugU, trackerU, close };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const night = s.get(scene.nightU);
  const app = s.get(scene.appU);
  const pr = s.get(scene.prU);
  const commitX = s.get(scene.commitX);
  const check = s.get(scene.checkU);
  const park = s.get(scene.parkU);
  const deploy = s.get(scene.deployU);
  const gate = s.get(scene.gateU);
  const run = s.get(scene.runU);
  const comment = s.get(scene.commentU);
  const conclude = s.get(scene.concludeU);
  const bug = s.get(scene.bugU);
  const tracker = s.get(scene.trackerU);
  const close = s.get(scene.close);
  const failed = run >= 0.66 ? 1 : 0;
  const packetY = lerp(150, LANE_Y - 4, deploy);
  const packetX = lerp(GATE_X + 330, GATE_X + 130, deploy);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close * 0.9}>
      <text x="640" y="64" textAnchor="middle" fill={colors.TEXT} fontSize="32" fontWeight="850">Let Github open the door</text>

      {/* Nightly regret */}
      <g opacity={night} transform="translate(90 96)">
        <rect width="270" height="64" rx="14" fill="#1a0f18" stroke={colors.NEGATIVE} strokeWidth="2" />
        <text x="16" y="24" fill={colors.NEGATIVE} fontSize="11" fontWeight="700" letterSpacing="1.5">NIGHTLY · STAGING</text>
        <text x="16" y="48" fill={colors.TEXT} fontSize="12">Bug found 02:14 · merged yesterday 16:40</text>
      </g>

      {/* GitHub App */}
      <g opacity={app} transform={`translate(920 ${96 + (1 - app) * 12})`}>
        <rect width="270" height="64" rx="14" fill="#13233a" stroke={colors.SECONDARY} strokeWidth="2" />
        <text x="16" y="24" fill={colors.SECONDARY} fontSize="11" fontWeight="700" letterSpacing="1.5">REPLAY QA GITHUB APP</text>
        <text x="16" y="48" fill={colors.TEXT} fontSize="12" fontFamily={colors.font.mono}>prTesting: events · fileIssues: on</text>
      </g>

      {/* PR lane */}
      <g opacity={pr}>
        <rect x="80" y={LANE_Y - 40} width="1120" height="80" rx="20" fill="#0d1727" stroke={colors.GRID} strokeWidth="2" />
        <text x="100" y={LANE_Y - 52} fill={colors.MUTED} fontSize="11" fontWeight="700" letterSpacing="1.5">PULL REQUEST 128 · rework coupon flow</text>
        <line x1="100" y1={LANE_Y} x2="1180" y2={LANE_Y} stroke={colors.MUTED} strokeWidth="2" strokeDasharray="6 8" opacity="0.6" />
        {/* the gate */}
        <g transform={`translate(${GATE_X} ${LANE_Y})`}>
          <rect x="-6" y="-40" width="12" height={80 * (1 - gate)} fill={colors.WARM} rx="4" />
          <text y="-50" textAnchor="middle" fill={gate > 0.5 ? colors.POSITIVE : colors.WARM} fontSize="12" fontWeight="700">{gate > 0.5 ? 'deployment detected' : 'Awaiting Deployment'}</text>
        </g>
        {/* the commit */}
        <g transform={`translate(${commitX} ${LANE_Y})`}>
          <circle r="16" fill={colors.ACCENT} />
          <text y="34" textAnchor="middle" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>version · sha 9f3c2a1</text>
        </g>
        {/* check run pill */}
        <g opacity={check} transform={`translate(${commitX - 70} ${LANE_Y + 52})`}>
          <rect width="140" height="24" rx="12" fill={conclude > 0 ? (failed ? '#2a1218' : '#102a22') : '#1b2a44'} stroke={conclude > 0 ? (failed ? colors.NEGATIVE : colors.POSITIVE) : colors.MUTED} />
          <circle cx="14" cy="12" r="5" fill={conclude > 0 ? (failed ? colors.NEGATIVE : colors.POSITIVE) : colors.WARM} />
          <text x="26" y="16" fill={colors.TEXT} fontSize="11" fontFamily={colors.font.mono}>Replay QA · {conclude > 0 ? (failed ? 'failure' : 'neutral') : 'in progress'}</text>
        </g>
        {/* parked marker */}
        <g opacity={park * (1 - gate)} transform={`translate(${GATE_X - 60} ${LANE_Y - 92})`}>
          <rect x="-90" width="180" height="26" rx="13" fill="#2a2416" stroke={colors.WARM} />
          <text y="17" textAnchor="middle" fill={colors.WARM} fontSize="11" fontFamily={colors.font.mono}>parked · waiting for deploy</text>
        </g>
      </g>

      {/* deployment_status packet */}
      <g opacity={deploy > 0 && deploy < 1 ? 1 : deploy >= 1 ? clamp01(1 - gate) : 0} transform={`translate(${packetX} ${packetY})`}>
        <rect x="-96" y="-14" width="192" height="28" rx="14" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="2" />
        <text y="5" textAnchor="middle" fill={colors.POSITIVE} fontSize="11" fontFamily={colors.font.mono}>deployment_status: success</text>
      </g>

      {/* Preview environment + runs */}
      <g opacity={clamp01(gate)} transform="translate(880 392)">
        <rect width="310" height={64 + JOURNEYS.length * 30} rx="16" fill="#102033" stroke={colors.TEAL} strokeWidth="2.5" />
        <text x="16" y="24" fill={colors.TEAL} fontSize="11" fontWeight="700" letterSpacing="1.5">PREVIEW · PR 128</text>
        <text x="16" y="44" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>pr-128.preview.example.com</text>
        {JOURNEYS.map((j, i) => {
          const u = clamp01(run * JOURNEYS.length - i);
          const bad = i === 1;
          return <g key={j} transform={`translate(16 ${64 + i * 30})`} opacity={0.3 + 0.7 * clamp01(run * JOURNEYS.length - i + 1)}>
            <circle cx="6" cy="8" r="6" fill={u >= 1 ? (bad ? colors.NEGATIVE : colors.POSITIVE) : u > 0 ? colors.WARM : '#2a3650'} />
            <text x="20" y="12" fill={colors.TEXT} fontSize="12">{j}</text>
          </g>;
        })}
      </g>

      {/* Sticky comment */}
      <g opacity={comment} transform={`translate(90 ${392 + (1 - comment) * 14})`}>
        <rect width="380" height="150" rx="16" fill="#13233a" stroke={colors.GRID} strokeWidth="2" />
        <circle cx="26" cy="26" r="10" fill={colors.SECONDARY} />
        <text x="44" y="30" fill={colors.TEXT} fontSize="12" fontWeight="700">replay-qa</text>
        <text x="116" y="30" fill={colors.MUTED} fontSize="11">commented · edited</text>
        <text x="20" y="60" fill={colors.TEXT} fontSize="12">2 journeys passed · 1 failed on 9f3c2a1</text>
        <text x="20" y="82" fill={colors.NEGATIVE} fontSize="12">✕ Apply coupon — code rejected at step 3</text>
        <text x="20" y="104" fill={colors.ACCENT} fontSize="12" textDecoration="underline">Watch the recording → · Full report →</text>
        <rect x="20" y="118" width="108" height="20" rx="10" fill={conclude > 0 ? '#2a1218' : '#1b2a44'} stroke={colors.NEGATIVE} opacity={conclude} />
        <text x="74" y="132" textAnchor="middle" fill={colors.NEGATIVE} fontSize="10" fontWeight="700" opacity={conclude}>check: failure</text>
      </g>

      {/* Bug tagged + issue tracker */}
      <g opacity={bug} transform={`translate(500 ${392 + (1 - bug) * 14})`}>
        <rect width="350" height="82" rx="14" fill="#1a0f18" stroke={colors.NEGATIVE} strokeWidth="2.5" />
        <text x="16" y="24" fill={colors.NEGATIVE} fontSize="11" fontWeight="700" letterSpacing="1.5">BUG · MEDIUM</text>
        <rect x="270" y="10" width="64" height="20" rx="10" fill="#0f2a2a" stroke={colors.TEAL} />
        <text x="302" y="24" textAnchor="middle" fill={colors.TEAL} fontSize="10" fontWeight="700">PR #128</text>
        <text x="16" y="50" fill={colors.TEXT} fontSize="13" fontWeight="600">Coupon field rejects valid code</text>
        <text x="16" y="70" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>version 9f3c2a1 · preview</text>
      </g>
      <g opacity={tracker} transform={`translate(500 ${486 + (1 - tracker) * 10})`}>
        {[['Github issue', colors.TEXT], ['Linear', colors.SECONDARY], ['Jira', colors.ACCENT]].map(([name, c], i) => <g key={name} transform={`translate(${i * 118} 0)`}>
          <rect width="108" height="30" rx="15" fill="#13233a" stroke={c} strokeWidth={i === 0 ? 2.5 : 1.5} opacity={i === 0 ? 1 : 0.55} />
          <text x="54" y="20" textAnchor="middle" fill={c} fontSize="12" fontWeight="600">{name}</text>
        </g>)}
      </g>
    </g>

    {/* Closing */}
    <g opacity={close}>
      <rect x="200" y="140" width="880" height="400" rx="40" fill="#0a0e1a" stroke={colors.TEAL} strokeWidth="3" />
      <text x="640" y="220" textAnchor="middle" fill={colors.TEXT} fontSize="36" fontWeight="850">the loop closes per pull request</text>
      <g transform="translate(640 380)">
        <circle r="120" fill="none" stroke={colors.POSITIVE} strokeWidth="4" opacity="0.5" />
        <circle r="84" fill="none" stroke={colors.WARM} strokeWidth="4" opacity="0.7" />
        <circle r={54 * clamp01(close * 1.4 - 0.3)} fill="none" stroke={colors.TEAL} strokeWidth="4" />
        <text y="-132" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>production · weekly</text>
        <text y="-94" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>staging · nightly</text>
        <text y="6" textAnchor="middle" fill={colors.TEAL} fontSize="14" fontFamily={colors.font.mono} opacity={clamp01(close * 2 - 1)}>preview · per PR</text>
      </g>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
