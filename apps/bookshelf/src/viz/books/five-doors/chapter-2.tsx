// Grounding: netlify/functions/lib/environment-schedules.ts (cadence → cron: nightly-weekdays is
// "0 21 * * 1-5"; the cron-environment-runs sweep wakes every 15 minutes), netlify/functions/lib/
// project-environments.ts (kind, target_url, trigger_type, environment_variables overlay by name,
// journey_exclusions), src/components/ProjectSettings.tsx EnvironmentSettingsRow copy.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const DIAL = { cx: 660, cy: 372, r: 168 };
const HOURS = Array.from({ length: 24 }, (_, i) => i);
// Journeys queued at 9 PM. One is excluded for staging.
const JOURNEYS = [
  { name: 'Guest checkout', excluded: false },
  { name: 'Sign in and view orders', excluded: false },
  { name: 'Apply coupon', excluded: false },
  { name: 'Live payment capture', excluded: true },
  { name: 'Search and filter', excluded: false },
];
const VARS = [
  { name: 'LOGIN_EMAIL', prod: 'qa@example.com', staging: 'stg-qa@example.com' },
  { name: 'LOGIN_PASSWORD', prod: '••••••••', staging: '••••••••' },
];

// Angle for an hour on the dial (0 at top = midnight, clockwise).
const hourAngle = (h: number) => -Math.PI / 2 + (h / 24) * Math.PI * 2;
const onDial = (h: number, r: number) => ({ x: DIAL.cx + Math.cos(hourAngle(h)) * r, y: DIAL.cy + Math.sin(hourAngle(h)) * r });

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const prodU = tl.channel('production card', 1);
  const stagingU = tl.channel('staging card', 0);
  const fieldsU = tl.channel('environment fields', 0);
  const varsU = tl.channel('variable overlay', 0);
  const cronU = tl.channel('cron line', 0);
  const dialU = tl.channel('dial reveal', 0);
  const sweepH = tl.channel('sweep hand (hours)', 12);
  const dueU = tl.channel('due at nine', 0);
  const queueU = tl.channel('queue fills', 0);
  const morningU = tl.channel('morning results', 0);
  const exclU = tl.channel('exclusion highlight', 0);
  const close = tl.channel('closing', 0);

  // BEAT 1 — the question, and a second card
  tl.caption({ at: 0.4, dur: 6.4, text: 'Once production has a baseline, the next question is what breaks before a release. So you add a staging environment.' });
  tl.tween(stagingU, 1, { at: 2.4, dur: 0.8, ease: ease.enter });

  // BEAT 2 — what an environment is
  tl.caption({ at: 7.2, dur: 6.6, text: 'An environment is a name, a kind, a target address, and a trigger. Staging inherits the project settings unless you override them.' });
  tl.tween(cam, { x: 330, y: 300, k: 1.3 }, { at: 7.4, dur: 1.2, ease: ease.move });
  tl.tween(fieldsU, 1, { at: 8.0, dur: 1.2, ease: ease.enter });

  // BEAT 3 — variables overlay
  tl.caption({ at: 14.2, dur: 6.6, text: 'You can layer environment variables over the project saved logins by name, so staging signs in with staging credentials.' });
  tl.tween(varsU, 1, { at: 14.6, dur: 1.0, ease: ease.enter });
  tl.hold(20.8, 0.4);

  // BEAT 4 — schedule → cron
  tl.caption({ at: 21.2, dur: 7.0, text: 'Set the trigger to a schedule. Nightly on weekdays becomes one cron line: nine in the evening, Monday through Friday, in your timezone.' });
  tl.tween(cronU, 1, { at: 21.8, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 24.2, dur: 1.3, ease: ease.move });
  tl.tween(dialU, 1, { at: 25.0, dur: 1.5, ease: ease.draw });

  // BEAT 5 — the 15 minute sweep
  tl.caption({ at: 28.6, dur: 5.6, text: 'A sweep wakes every fifteen minutes and asks each environment whether its cron is due.' });
  tl.tween(sweepH, 20.75, { at: 28.8, dur: 5.2, ease: ease.linear });

  // BEAT 6 — due at nine, queue fills
  tl.caption({ at: 34.6, dur: 6.6, text: 'When staging comes due, every approved journey that is not excluded for it is queued, and the nightly run starts.' });
  tl.tween(sweepH, 21.0, { at: 34.6, dur: 0.6, ease: ease.linear });
  tl.tween(dueU, 1, { at: 35.2, dur: 0.5, ease: ease.pop });
  tl.tween(cam, { x: 780, y: 380, k: 1.1 }, { at: 35.4, dur: 1.2, ease: ease.move });
  tl.tween(queueU, 1, { at: 36.0, dur: 2.8, ease: ease.enter });

  // BEAT 7 — exclusions
  tl.caption({ at: 41.6, dur: 6.4, text: 'Excluding a journey for one environment keeps a production only flow, like a live payment, from failing every night against staging.' });
  tl.tween(exclU, 1, { at: 42.0, dur: 0.6, ease: ease.pop });
  tl.hold(48.0, 0.4);

  // BEAT 8 — morning
  tl.caption({ at: 48.4, dur: 6.6, text: 'By morning you have a run per night, and a bug filed against staging carries the environment name, so you know where it happened.' });
  tl.tween(sweepH, 32.0, { at: 48.6, dur: 3.2, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 48.6, dur: 1.2, ease: ease.move });
  tl.tween(morningU, 1, { at: 51.2, dur: 0.8, ease: ease.enter });

  // BEAT 9 — the loop shortens
  tl.caption({ at: 55.4, dur: 5.4, text: 'Production weekly, staging nightly: the loop just got a day shorter.' });
  tl.tween(close, 1, { at: 55.8, dur: 1.0, ease: ease.move });
  tl.hold(60.8, 1.0);

  return { tl, cam, prodU, stagingU, fieldsU, varsU, cronU, dialU, sweepH, dueU, queueU, morningU, exclU, close };
}

const scene = buildScene();

function EnvCard({ x, y, name, kind, url, trigger, color, u, fields }: { x: number; y: number; name: string; kind: string; url: string; trigger: string; color: string; u: number; fields: number }) {
  if (u <= 0) return null;
  return <g opacity={u} transform={`translate(${x} ${y + (1 - u) * 18})`}>
    <rect width="230" height={90 + fields * 44} rx="16" fill="#102033" stroke={color} strokeWidth="2.5" />
    <text x="18" y="28" fill={color} fontSize="12" fontWeight="700" letterSpacing="1.5">{name.toUpperCase()}</text>
    <text x="18" y="50" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>kind: {kind}</text>
    <text x="18" y="70" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>{url}</text>
    <g opacity={fields}>
      <text x="18" y="96" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>trigger: {trigger}</text>
      <text x="18" y="116" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>testing_guidelines: inherits</text>
    </g>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const staging = s.get(scene.stagingU);
  const fields = s.get(scene.fieldsU);
  const vars = s.get(scene.varsU);
  const cron = s.get(scene.cronU);
  const dial = s.get(scene.dialU);
  const sweepH = s.get(scene.sweepH);
  const due = s.get(scene.dueU);
  const queue = s.get(scene.queueU);
  const morning = s.get(scene.morningU);
  const excl = s.get(scene.exclU);
  const close = s.get(scene.close);
  const hand = onDial(sweepH % 24, DIAL.r - 14);
  const nine = onDial(21, DIAL.r);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close * 0.9}>
      <text x="640" y="64" textAnchor="middle" fill={colors.TEXT} fontSize="32" fontWeight="850">Add staging, test every night</text>

      {/* Environment cards */}
      <g opacity={1 - dial * 0.6}>
        <EnvCard x={90} y={110} name="Production" kind="production" url="app.example.com" trigger="schedule · weekly" color={colors.POSITIVE} u={1} fields={fields} />
        <EnvCard x={90} y={300} name="Staging" kind="staging" url="staging.example.com" trigger="schedule" color={colors.WARM} u={staging} fields={fields} />
      </g>

      {/* Variable overlay */}
      <g opacity={vars * (1 - dial * 0.88)} transform={`translate(340 ${300 + (1 - vars) * 12})`}>
        <rect width="260" height="118" rx="14" fill="#13233a" stroke={colors.SECONDARY} strokeWidth="2" />
        <text x="16" y="24" fill={colors.SECONDARY} fontSize="11" fontWeight="700" letterSpacing="1.5">ENVIRONMENT VARIABLES</text>
        {VARS.map((v, i) => <g key={v.name} transform={`translate(16 ${50 + i * 30})`}>
          <text fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>{v.name}</text>
          <text y="14" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono} opacity="0.6" textDecoration="line-through">{v.prod}</text>
          <text x="112" y="14" fill={colors.WARM} fontSize="10" fontFamily={colors.font.mono}>{v.staging}</text>
        </g>)}
        <text x="16" y="110" fill={colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>overlaid on global_variables by name</text>
      </g>

      {/* Cron line */}
      <g opacity={cron * (1 - dial * 0.88)} transform={`translate(340 ${226 + (1 - cron) * 10})`}>
        <rect width="240" height="56" rx="12" fill="#1b2a44" stroke={colors.WARM} strokeWidth="2" />
        <text x="16" y="22" fill={colors.MUTED} fontSize="10" fontWeight="700" letterSpacing="1.5">NIGHTLY · WEEKDAYS</text>
        <text x="16" y="44" fill={colors.WARM} fontSize="15" fontFamily={colors.font.mono} fontWeight="700">0 21 * * 1-5</text>
      </g>

      {/* The 24-hour dial */}
      <g opacity={dial}>
        <circle cx={DIAL.cx} cy={DIAL.cy} r={DIAL.r} fill="#0d1727" stroke={colors.GRID} strokeWidth="2" strokeDasharray={`${2 * Math.PI * DIAL.r * dial} ${2 * Math.PI * DIAL.r}`} transform={`rotate(-90 ${DIAL.cx} ${DIAL.cy})`} />
        {HOURS.map((h) => {
          const a = onDial(h, DIAL.r - 6), b = onDial(h, DIAL.r - (h % 6 === 0 ? 22 : 12));
          return <line key={h} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={h === 21 ? colors.WARM : colors.MUTED} strokeWidth={h === 21 ? 3 : 1.2} opacity={clamp01(dial * 24 - h)} />;
        })}
        {[0, 6, 12, 18].map((h) => { const p = onDial(h, DIAL.r + 22); return <text key={h} x={p.x} y={p.y + 5} textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>{h === 0 ? '00:00' : `${h}:00`}</text>; })}
        <text x={nine.x + 30} y={nine.y - 10} fill={colors.WARM} fontSize="13" fontWeight="700">21:00</text>
        {/* 15-minute sweep ticks trail */}
        {Array.from({ length: 96 }, (_, i) => i / 4).filter((h) => h <= sweepH && h >= 12 && h > sweepH - 9).map((h) => {
          const p = onDial(h % 24, DIAL.r - 40);
          return <circle key={h} cx={p.x} cy={p.y} r="2.4" fill={colors.ACCENT} opacity={0.25 + 0.75 * clamp01(1 - (sweepH - h) / 9)} />;
        })}
        <line x1={DIAL.cx} y1={DIAL.cy} x2={hand.x} y2={hand.y} stroke={colors.ACCENT} strokeWidth="3" strokeLinecap="round" />
        <circle cx={DIAL.cx} cy={DIAL.cy} r="7" fill={colors.ACCENT} />
        <text x={DIAL.cx} y={DIAL.cy + 60} textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>sweep: every 15 min</text>
        <g opacity={due}>
          <circle cx={nine.x} cy={nine.y} r={16 + due * 6} fill="none" stroke={colors.WARM} strokeWidth="3" />
          <text x={DIAL.cx} y={DIAL.cy - 40} textAnchor="middle" fill={colors.WARM} fontSize="16" fontWeight="800">staging is due</text>
        </g>
      </g>

      {/* Queue */}
      <g opacity={clamp01(queue * 3)} transform="translate(880 190)">
        <text x="0" y="0" fill={colors.MUTED} fontSize="11" fontWeight="700" letterSpacing="1.5">QUEUED FOR STAGING</text>
        {JOURNEYS.map((j, i) => {
          const u = clamp01(queue * JOURNEYS.length - i);
          const ex = j.excluded ? excl : 0;
          return <g key={j.name} opacity={u} transform={`translate(${(1 - u) * 30} ${16 + i * 46})`}>
            <rect width="290" height="36" rx="10" fill={ex > 0 ? '#1a0f18' : '#13233a'} stroke={ex > 0 ? colors.NEGATIVE : colors.ACCENT} strokeWidth="2" strokeDasharray={ex > 0 ? '6 5' : undefined} />
            <text x="14" y="23" fill={ex > 0 ? colors.MUTED : colors.TEXT} fontSize="13" textDecoration={ex > 0 ? 'line-through' : undefined}>{j.name}</text>
            {ex > 0 && <text x="278" y="23" textAnchor="end" fill={colors.NEGATIVE} fontSize="10" fontFamily={colors.font.mono}>excluded</text>}
            {ex === 0 && morning > 0 && <circle cx="272" cy="18" r="6" fill={i === 2 ? colors.NEGATIVE : colors.POSITIVE} opacity={morning} />}
          </g>;
        })}
      </g>

      {/* Morning bug */}
      <g opacity={morning} transform={`translate(880 ${452 + (1 - morning) * 14})`}>
        <rect width="290" height="84" rx="14" fill="#1a0f18" stroke={colors.NEGATIVE} strokeWidth="2.5" />
        <text x="16" y="24" fill={colors.NEGATIVE} fontSize="11" fontWeight="700" letterSpacing="1.5">BUG · MEDIUM</text>
        <rect x="200" y="10" width="76" height="20" rx="10" fill="#2a2416" stroke={colors.WARM} />
        <text x="238" y="24" textAnchor="middle" fill={colors.WARM} fontSize="10" fontWeight="700">Staging</text>
        <text x="16" y="50" fill={colors.TEXT} fontSize="13" fontWeight="600">Coupon field rejects valid code</text>
        <text x="16" y="70" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>found 06:12 · nightly run</text>
      </g>
    </g>

    {/* Closing */}
    <g opacity={close}>
      <rect x="200" y="140" width="880" height="400" rx="40" fill="#0a0e1a" stroke={colors.WARM} strokeWidth="3" />
      <text x="640" y="220" textAnchor="middle" fill={colors.TEXT} fontSize="36" fontWeight="850">the loop gets a day shorter</text>
      <g transform="translate(640 380)">
        <circle r="120" fill="none" stroke={colors.POSITIVE} strokeWidth="4" opacity="0.8" />
        <text y="-132" textAnchor="middle" fill={colors.POSITIVE} fontSize="15" fontFamily={colors.font.mono}>production · weekly</text>
        <circle r={120 * clamp01(close * 1.4 - 0.3) * 0.6} fill="none" stroke={colors.WARM} strokeWidth="4" />
        <text y="6" textAnchor="middle" fill={colors.WARM} fontSize="15" fontFamily={colors.font.mono} opacity={clamp01(close * 2 - 1)}>staging · nightly</text>
      </g>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
