// Grounding: netlify/functions/lib/projects.ts (reverse-proxy projects start paused with
// paused_reason 'awaiting_start'), src/components/ProjectSettings.tsx ("Awaiting start" /
// "Connect your local computer in the chat to start QA."), src/components/chat/ReverseProxyChatCard.tsx
// ("Local computer connected" / "QA can now reach your app and has started."), netlify/functions/v1.ts
// (connection_purpose 'interactive' creates a Local environment), src/lib/projectEnvironment.ts.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { RecordingStrip } from '../../agent';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const LAPTOP = { x: 250, y: 330 };
const QA = { x: 1000, y: 330 };
const STEPS = ['open storefront', 'add to cart', 'apply coupon', 'confirm order'];
const REC_POINTS = [
  { at: 0.12, kind: 'interaction' as const },
  { at: 0.38, kind: 'network' as const, label: 'POST /coupon' },
  { at: 0.62, kind: 'exception' as const, label: 'TypeError' },
  { at: 0.84, kind: 'render' as const },
];
// The recap rings: environment → loop length. Radii shrink as the loop tightens.
const RINGS = [
  { label: 'production · weekly', color: colors.POSITIVE, r: 150 },
  { label: 'staging · nightly', color: colors.WARM, r: 118 },
  { label: 'preview · per pull request', color: colors.TEAL, r: 86 },
  { label: 'CI tunnel · per job', color: colors.SECONDARY, r: 56 },
  { label: 'laptop · per save', color: colors.ACCENT, r: 28 },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const laptopU = tl.channel('laptop', 0);
  const pausedU = tl.channel('project awaiting start', 0);
  const cmdU = tl.channel('proxy command', 0);
  const tunnelU = tl.channel('tunnel connects', 0);
  const connectedU = tl.channel('local computer connected', 0);
  const startU = tl.channel('start qa unlocks', 0);
  const localEnvU = tl.channel('local environment', 0);
  const runU = tl.channel('journey runs (first)', 0);
  const failU = tl.channel('step fails', 0);
  const fixU = tl.channel('fix lands', 0);
  const rerunU = tl.channel('journey runs (rerun)', 0);
  const passU = tl.channel('rerun passes', 0);
  const recU = tl.channel('recording playhead', 0);
  const close = tl.channel('recap', 0);
  const ringsU = tl.channel('rings tighten', 0);

  // BEAT 1 — skip deployment
  tl.caption({ at: 0.4, dur: 5.8, text: 'The shortest loop skips deployment entirely: test the fix while it is still on your laptop.' });
  tl.tween(laptopU, 1, { at: 0.8, dur: 0.9, ease: ease.enter });

  // BEAT 2 — paused, awaiting start
  tl.caption({ at: 6.6, dur: 5.6, text: 'A project onboarded for a local app starts paused, awaiting its first connection.' });
  tl.tween(pausedU, 1, { at: 7.0, dur: 0.7, ease: ease.enter });

  // BEAT 3 — run the command, connect
  tl.caption({ at: 12.6, dur: 6.6, text: 'Run the proxy command from the machine that hosts the app. It connects, the project sees your local computer, and QA can start.' });
  tl.tween(cam, { x: 420, y: 380, k: 1.2 }, { at: 12.8, dur: 1.2, ease: ease.move });
  tl.tween(cmdU, 1, { at: 13.2, dur: 0.8, ease: ease.enter });
  tl.tween(tunnelU, 1, { at: 14.6, dur: 1.4, ease: ease.draw });
  tl.tween(connectedU, 1, { at: 16.2, dur: 0.6, ease: ease.pop });
  tl.tween(startU, 1, { at: 17.4, dur: 0.6, ease: ease.pop });
  tl.tween(pausedU, 0, { at: 17.4, dur: 0.5, ease: ease.enter });

  // BEAT 4 — local environment, journeys rerun against working copy
  tl.caption({ at: 19.6, dur: 6.8, text: 'That connection creates a local environment, and the journeys you recorded against production now run against your working copy.' });
  tl.tween(cam, CAMERA_HOME, { at: 19.8, dur: 1.3, ease: ease.move });
  tl.tween(localEnvU, 1, { at: 20.6, dur: 0.8, ease: ease.enter });
  tl.tween(runU, 1, { at: 21.8, dur: 3.6, ease: ease.linear });
  tl.tween(failU, 1, { at: 25.4, dur: 0.5, ease: ease.pop });

  // BEAT 5 — fix, rerun
  tl.caption({ at: 26.8, dur: 6.8, text: 'Fix the bug, keep the command running, and rerun the journey. The recording tells you whether the fix held.' });
  tl.tween(recU, 0.7, { at: 27.0, dur: 1.6, ease: ease.linear });
  tl.tween(fixU, 1, { at: 28.6, dur: 0.8, ease: ease.enter });
  tl.tween(rerunU, 1, { at: 29.8, dur: 3.0, ease: ease.linear });
  tl.tween(failU, 0, { at: 29.8, dur: 0.4, ease: ease.enter });
  tl.tween(passU, 1, { at: 32.8, dur: 0.5, ease: ease.pop });
  tl.hold(33.6, 0.6);

  // BEAT 6 — recap: every environment shortened the loop
  tl.caption({ at: 34.2, dur: 7.4, text: 'Each environment you added shortened the loop: weekly on production, nightly on staging, per pull request, per CI job, and now per save.' });
  tl.tween(close, 1, { at: 34.6, dur: 1.0, ease: ease.move });
  tl.tween(ringsU, RINGS.length, { at: 35.6, dur: 5.4, ease: ease.linear });

  // BEAT 7 — closing line
  tl.caption({ at: 42.0, dur: 6.2, text: 'Same journeys, same evidence, five doors into the same app. Start with production, and tighten from there.' });
  tl.hold(48.2, 1.2);

  return { tl, cam, laptopU, pausedU, cmdU, tunnelU, connectedU, startU, localEnvU, runU, failU, fixU, rerunU, passU, recU, close, ringsU };
}

const scene = buildScene();

function StepRail({ x, y, u, failAt, fail, pass }: { x: number; y: number; u: number; failAt: number; fail: number; pass: number }) {
  return <g transform={`translate(${x} ${y})`}>
    {STEPS.map((label, i) => {
      const reached = u * STEPS.length >= i + 1 ? 1 : u * STEPS.length > i ? 0.5 : 0;
      const isFail = i === failAt && fail > 0;
      const c = isFail ? colors.NEGATIVE : reached >= 1 ? (pass > 0 || i < failAt ? colors.POSITIVE : colors.ACCENT) : reached > 0 ? colors.WARM : '#2a3650';
      return <g key={label} transform={`translate(0 ${i * 34})`}>
        {i < STEPS.length - 1 && <line x1="10" y1="12" x2="10" y2="34" stroke={colors.GRID} strokeWidth="2" />}
        <circle cx="10" cy="10" r={9 + (isFail ? fail * 3 : 0)} fill="#13233a" stroke={c} strokeWidth="2.5" />
        <text x="10" y="14" textAnchor="middle" fill={c} fontSize="10" fontWeight="700">{i + 1}</text>
        <text x="30" y="14" fill={reached > 0 ? colors.TEXT : colors.MUTED} fontSize="12">{label}</text>
      </g>;
    })}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const laptop = s.get(scene.laptopU);
  const paused = s.get(scene.pausedU);
  const cmd = s.get(scene.cmdU);
  const tunnel = s.get(scene.tunnelU);
  const connected = s.get(scene.connectedU);
  const start = s.get(scene.startU);
  const localEnv = s.get(scene.localEnvU);
  const run = s.get(scene.runU);
  const fail = s.get(scene.failU);
  const fix = s.get(scene.fixU);
  const rerun = s.get(scene.rerunU);
  const pass = s.get(scene.passU);
  const rec = s.get(scene.recU);
  const close = s.get(scene.close);
  const rings = s.get(scene.ringsU);
  const railU = rerun > 0 ? rerun : run;

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="64" textAnchor="middle" fill={colors.TEXT} fontSize="32" fontWeight="850">The tightest loop: your laptop</text>

      {/* Laptop with the app */}
      <g opacity={laptop} transform={`translate(${LAPTOP.x} ${LAPTOP.y})`}>
        <rect x="-150" y="-100" width="300" height="196" rx="18" fill="#0d1727" stroke={colors.MUTED} strokeWidth="2.5" />
        <rect x="-190" y="98" width="380" height="14" rx="7" fill="#1b2a44" stroke={colors.MUTED} strokeWidth="1.5" />
        <text x="0" y="-74" textAnchor="middle" fill={colors.MUTED} fontSize="11" fontWeight="700" letterSpacing="1.5">YOUR LAPTOP</text>
        <rect x="-130" y="-58" width="260" height="46" rx="10" fill="#102033" stroke={colors.POSITIVE} strokeWidth="2" />
        <text x="0" y="-38" textAnchor="middle" fill={colors.POSITIVE} fontSize="12" fontWeight="700">the app · working copy</text>
        <text x="0" y="-21" textAnchor="middle" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>http://localhost:3000</text>
        <g opacity={cmd}>
          <rect x="-130" y="0" width="260" height="80" rx="10" fill="#0a0e1a" stroke={colors.GRID} strokeWidth="1.5" />
          <text x="-118" y="18" fill={colors.MUTED} fontSize="9.5" fontFamily={colors.font.mono}>$ npx --yes replayqa proxy \</text>
          <text x="-118" y="33" fill={colors.TEXT} fontSize="9.5" fontFamily={colors.font.mono}>    --project prj_7c1 \</text>
          <text x="-118" y="48" fill={colors.TEXT} fontSize="9.5" fontFamily={colors.font.mono}>    --qa-url https://qa.replay.io</text>
          <text x="-118" y="68" fill={connected > 0 ? colors.POSITIVE : colors.WARM} fontSize="9.5" fontFamily={colors.font.mono}>{connected > 0 ? '✓ tunnel ready · leave this running' : 'waiting for the tunnel…'}</text>
        </g>
      </g>

      {/* Fix lands on the laptop */}
      <g opacity={fix} transform={`translate(${LAPTOP.x - 130} ${LAPTOP.y + 126 + (1 - fix) * 10})`}>
        <rect width="300" height="52" rx="10" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="2" />
        <text x="12" y="20" fill={colors.NEGATIVE} fontSize="9.5" fontFamily={colors.font.mono}>- const total = cart.total.toFixed(2)</text>
        <text x="12" y="38" fill={colors.POSITIVE} fontSize="9.5" fontFamily={colors.font.mono}>+ const total = (cart.total ?? 0).toFixed(2)</text>
      </g>

      {/* QA side: project card */}
      <g opacity={laptop} transform={`translate(${QA.x} ${QA.y})`}>
        <rect x="-160" y="-100" width="320" height="200" rx="18" fill="#0d1727" stroke={colors.ACCENT} strokeWidth="2.5" />
        <text x="0" y="-74" textAnchor="middle" fill={colors.ACCENT} fontSize="11" fontWeight="700" letterSpacing="1.5">REPLAY QA · PROJECT</text>
        <g opacity={paused}>
          <rect x="-130" y="-56" width="260" height="40" rx="10" fill="#1b2a44" stroke={colors.MUTED} strokeWidth="1.5" />
          <text x="-118" y="-32" fill={colors.MUTED} fontSize="12"><tspan fontWeight="700">Awaiting start</tspan> · connect your local computer</text>
        </g>
        <g opacity={connected}>
          <rect x="-130" y="-56" width="260" height="40" rx="10" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="2" />
          <text x="-118" y="-32" fill={colors.POSITIVE} fontSize="12" fontWeight="700">Local computer connected</text>
        </g>
        <g opacity={start} transform={`translate(0 ${(1 - start) * 8})`}>
          <rect x="-70" y="-6" width="140" height="34" rx="17" fill={colors.ACCENT} />
          <text x="0" y="16" textAnchor="middle" fill="#0a0e1a" fontSize="13" fontWeight="800">Start QA</text>
        </g>
        <g opacity={localEnv} transform={`translate(-130 ${44 + (1 - localEnv) * 8})`}>
          <rect width="260" height="42" rx="10" fill="#102033" stroke={colors.ACCENT} strokeWidth="2" />
          <text x="12" y="17" fill={colors.ACCENT} fontSize="10" fontWeight="700" letterSpacing="1.5">LOCAL</text>
          <text x="12" y="33" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>kind: local · trigger: manual</text>
        </g>
      </g>

      {/* Tunnel between them */}
      <g opacity={tunnel}>
        <rect x={LAPTOP.x + 190} y={QA.y - 22} width={(QA.x - 160 - LAPTOP.x - 190) * tunnel} height="44" rx="22" fill="rgba(56,189,248,0.06)" stroke={colors.ACCENT} strokeWidth="2" strokeDasharray="10 8" />
        <text x={(LAPTOP.x + QA.x) / 2 + 15} y={QA.y - 34} textAnchor="middle" fill={colors.ACCENT} fontSize="11" fontFamily={colors.font.mono} opacity={clamp01(tunnel * 2 - 1)}>tunnel · outbound from your laptop</text>
        {/* traffic */}
        {railU > 0 && railU < 1 && [0, 1, 2].map((k) => {
          const u = (railU * 3 + k / 3) % 1;
          const x = lerp(QA.x - 160, LAPTOP.x + 190, u);
          return <circle key={k} cx={x} cy={QA.y} r="5" fill={colors.ACCENT} opacity={0.9} />;
        })}
      </g>

      {/* The journey rail */}
      <g opacity={clamp01(run * 4)} transform="translate(560 430)">
        <text x="0" y="0" fill={colors.MUTED} fontSize="11" fontWeight="700" letterSpacing="1.5">{rerun > 0 ? 'GUEST CHECKOUT · RERUN' : 'GUEST CHECKOUT · RUN 1'}</text>
        <StepRail x={0} y={16} u={railU} failAt={2} fail={fail} pass={pass} />
      </g>
      <g opacity={clamp01(fail * 2) * (1 - fix * 0.6)} transform="translate(760 430)">
        <rect width="330" height="90" rx="12" fill="#1a0f18" stroke={colors.NEGATIVE} strokeWidth="2" />
        <text x="14" y="22" fill={colors.NEGATIVE} fontSize="11" fontWeight="700" letterSpacing="1.5">BUG · LOCAL</text>
        <text x="14" y="42" fill={colors.TEXT} fontSize="12">Coupon step throws before the total renders</text>
        <RecordingStrip x={14} y={52} w={300} h={26} points={REC_POINTS} u={rec} title="recording" />
      </g>
      <g opacity={pass} transform="translate(760 430)">
        <rect width="330" height="60" rx="12" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="2.5" />
        <text x="14" y="24" fill={colors.POSITIVE} fontSize="11" fontWeight="700" letterSpacing="1.5">RERUN · PASSED</text>
        <text x="14" y="46" fill={colors.TEXT} fontSize="12">4 of 4 steps · the fix held, on the recording</text>
      </g>
    </g>

    {/* Recap: the rings tighten */}
    <g opacity={close}>
      <rect x="130" y="96" width="1020" height="500" rx="44" fill="#0a0e1a" stroke={colors.ACCENT} strokeWidth="3" />
      <text x="640" y="160" textAnchor="middle" fill={colors.TEXT} fontSize="36" fontWeight="850">five doors, one loop</text>
      <g transform="translate(470 390)">
        {RINGS.map((ring, i) => {
          const u = clamp01(rings - i);
          return <g key={ring.label} opacity={u}>
            <circle r={ring.r * (0.6 + 0.4 * u)} fill="none" stroke={ring.color} strokeWidth="4" opacity={0.9} />
          </g>;
        })}
        <circle r="6" fill={colors.TEXT} opacity={clamp01(rings - 4.5)} />
      </g>
      <g transform="translate(700 262)">
        {RINGS.map((ring, i) => {
          const u = clamp01(rings - i);
          return <g key={ring.label} opacity={u} transform={`translate(${(1 - u) * 20} ${i * 52})`}>
            <circle cx="10" cy="10" r="9" fill="none" stroke={ring.color} strokeWidth="3.5" />
            <text x="34" y="15" fill={colors.TEXT} fontSize="18" fontWeight="600">{ring.label}</text>
          </g>;
        })}
      </g>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
