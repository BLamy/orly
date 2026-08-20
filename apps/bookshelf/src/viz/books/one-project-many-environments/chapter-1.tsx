// One Project, Many Environments — chapter 1: The Problem.
// Proposal framing: a project today stores exactly one target_url and one set of
// test instructions; a per-run override URL exists but nothing records which
// environment a run executed in.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const WANT_URLS = [
  { label: 'staging.example.com', color: colors.WARM },
  { label: 'preview-421.example.com', color: colors.SECONDARY },
  { label: 'localhost:3000', color: colors.ACCENT },
] as const;

const RUNS = [
  { id: 'run 418', url: 'app.example.com', note: 'project url' },
  { id: 'run 419', url: 'staging.example.com', note: 'override' },
  { id: 'run 420', url: 'preview-421.example.com', note: 'override' },
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const projectU = tl.channel('projectU', 0);      // project card + its two slots
  const queueU = tl.channel('queueU', 0);          // other URLs that want a home
  const rejectU = tl.channel('rejectU', 0);        // the single slot bounces them
  const overrideU = tl.channel('overrideU', 0);    // packet: override url → run ledger
  const ledgerU = tl.channel('ledgerU', 0);        // run history table
  const mysteryU = tl.channel('mysteryU', 0);      // environment column of dashes
  const instrU = tl.channel('instrU', 0);          // instructions share the same flaw
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6.4, text: 'Today a Replay QA project stores exactly two facts about where it runs: one target URL, and one set of testing instructions.' });
  tl.tween(projectU, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 610, y: 330, k: 1.1 }, { at: 1.2, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 6, text: 'One of each. That is fine while the product lives at one address, but our products do not live at one address.' });
  tl.tween(queueU, 1, { at: t - 5.2, dur: 2.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Staging, pull request previews, and local builds all want a home, and the schema has a single slot. Typing a new URL overwrites the last answer.' });
  tl.tween(rejectU, 1, { at: t - 5.4, dur: 2.8, ease: ease.linear });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 5.8, text: 'We do have an escape hatch. A test run can override the target URL at launch time.' });
  tl.tween(cam, { x: 640, y: 400, k: 1.0 }, { at: t - 5.4, dur: 1.3, ease: ease.move });
  tl.tween(ledgerU, 1, { at: t - 4.6, dur: 1.2, ease: ease.enter });
  tl.tween(overrideU, 1, { at: t - 3.2, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'But a URL is just an address. It carries no knowledge of how to test that world: not which login to use, not which steps differ, and no record of which environment it was supposed to be.' });
  tl.tween(mysteryU, 1, { at: t - 5.4, dur: 1.6, ease: ease.enter });
  tl.tween(cam, { x: 800, y: 430, k: 1.22 }, { at: t - 4.6, dur: 1.4, ease: ease.move });
  tl.tween(projectU, 0.12, { at: t - 6.2, dur: 0.8, ease: ease.move });
  tl.tween(queueU, 0.05, { at: t - 6.2, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6, text: 'So slight environmental differences quietly break: the staging login fails against the preview build, and no one can filter production history from staging noise.' });
  tl.tween(mysteryU, 1.6, { at: t - 5.2, dur: 0.5, ease: ease.pop });
  tl.tween(mysteryU, 1, { at: t - 4.5, dur: 0.5, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Instructions have the same flaw. Staging needs its own login steps and test accounts, and there is only one instructions field to share.' });
  tl.tween(cam, { x: 610, y: 330, k: 1.1 }, { at: t - 5.8, dur: 1.3, ease: ease.move });
  tl.tween(projectU, 1, { at: t - 5.4, dur: 0.9, ease: ease.move });
  tl.tween(instrU, 1, { at: t - 4.4, dur: 1.4, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'So that is the problem. One URL slot, one instructions slot, and a run history that cannot name its world. This proposal fixes all three.' });
  tl.tween(closeU, 1, { at: t - 5.6, dur: 1.0, ease: ease.enter });
  tl.tween(projectU, 0.12, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(queueU, 0.1, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(ledgerU, 0.12, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(instrU, 0.1, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 340, k: 1.06 }, { at: t - 5.4, dur: 1.6, ease: ease.move });
  tl.hold(t, 1.0);
  return { tl, cam, projectU, queueU, rejectU, overrideU, ledgerU, mysteryU, instrU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const projectU = s.get(scene.projectU);
  const queueU = s.get(scene.queueU);
  const rejectU = s.get(scene.rejectU);
  const overrideU = s.get(scene.overrideU);
  const ledgerU = s.get(scene.ledgerU);
  const mysteryRaw = s.get(scene.mysteryU);
  const mysteryU = clamp01(mysteryRaw);
  const pulse = Math.max(0, mysteryRaw - 1);
  const instrU = s.get(scene.instrU);
  const closeU = s.get(scene.closeU);

  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {/* The project record, with its two single slots */}
      <g opacity={projectU}>
        <rect x={100} y={80} width={470} height={230} rx={22} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
        <text x={130} y={122} fill={colors.TEXT} fontSize={23} fontWeight={750}>Project · Checkout App</text>
        <text x={130} y={146} fill={colors.MUTED} fontSize={12} fontFamily={mono}>projects · one row</text>

        <rect x={130} y={168} width={410} height={52} rx={12} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.6} />
        <text x={148} y={189} fill={colors.MUTED} fontSize={11} fontFamily={mono}>target_url</text>
        <text x={148} y={209} fill={colors.POSITIVE} fontSize={14} fontFamily={mono}>app.example.com</text>

        <rect x={130} y={232} width={410} height={52} rx={12} fill={colors.BG} stroke={instrU > 0.05 ? colors.NEGATIVE : colors.MUTED} strokeWidth={1.6} opacity={0.6 + 0.4 * Math.max(projectU, instrU)} />
        <text x={148} y={253} fill={colors.MUTED} fontSize={11} fontFamily={mono}>test_instructions</text>
        <text x={148} y={273} fill={colors.TEXT} fontSize={13}>“Sign in as demo user, then…”</text>
      </g>

      {/* URLs that need a home, bouncing off the single slot */}
      {WANT_URLS.map((want, i) => {
        const shown = clamp01(queueU * 3 - i * 0.7);
        const approach = clamp01(rejectU * 3 - i * 0.85);
        // ease out toward the slot, then bounce back
        const travel = approach < 0.6 ? approach / 0.6 : 1 - (approach - 0.6) * 0.6;
        const x = lerp(880, 585, travel);
        const y = 118 + i * 62;
        const bounced = approach >= 0.6;
        return <g key={want.label} opacity={shown * clamp01((projectU - 0.12) / 0.88) * (1 - clamp01(s.get(scene.closeU) * 4))}>
          <g transform={`translate(${x} ${y})`}>
            <rect width={250} height={40} rx={10} fill={colors.PANEL} stroke={want.color} strokeWidth={1.4} opacity={0.95} />
            <text x={16} y={25} fill={want.color} fontSize={12.5} fontFamily={mono}>{want.label}</text>
          </g>
          {bounced && <text x={600} y={y + 26} fill={colors.NEGATIVE} fontSize={20} fontWeight={800} opacity={clamp01((approach - 0.6) * 4)}>✕</text>}
        </g>;
      })}
      {rejectU > 0.85 && <text x={620} y={70} fill={colors.NEGATIVE} fontSize={13} fontFamily={mono} opacity={clamp01((rejectU - 0.85) * 6) * clamp01((projectU - 0.12) / 0.88) * (1 - closeU)}>one slot · last write wins</text>}

      {/* Run history ledger */}
      <g opacity={ledgerU}>
        <text x={110} y={392} fill={colors.TEXT} fontSize={20} fontWeight={750} opacity={1 - 0.9 * mysteryU}>Test run history</text>
        <text x={340} y={415} fill={colors.MUTED} fontSize={12} fontWeight={700} fontFamily={mono}>url used</text>
        <text x={700} y={415} fill={colors.MUTED} fontSize={12} fontWeight={700} fontFamily={mono}>source</text>
        <text x={900} y={415} fill={colors.WARM} fontSize={12} fontWeight={700} fontFamily={mono}>environment?</text>
        {RUNS.map((run, i) => {
          const rowU = i === 0 ? ledgerU : clamp01(overrideU * 2 - (i - 1));
          return <g key={run.id} opacity={rowU} transform={`translate(0 ${(1 - rowU) * 14})`}>
            <rect x={110} y={428 + i * 56} width={1030} height={46} rx={10} fill={colors.PANEL} stroke={colors.MUTED} strokeOpacity={0.3} />
            <text x={135} y={457 + i * 56} fill={colors.TEXT} fontSize={13} fontFamily={mono}>{run.id}</text>
            <text x={340} y={457 + i * 56} fill={i === 0 ? colors.POSITIVE : WANT_URLS[i - 1]!.color} fontSize={13} fontFamily={mono}>{run.url}</text>
            <text x={700} y={457 + i * 56} fill={colors.MUTED} fontSize={13} fontFamily={mono}>{run.note}</text>
            <g opacity={mysteryU}>
              <rect x={895} y={438 + i * 56} width={150 + 14 * pulse} height={28} rx={14} fill={colors.WARM} opacity={0.1 + 0.12 * pulse} />
              <text x={970} y={457 + i * 56} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={mono}>— unknown —</text>
            </g>
          </g>;
        })}
        <text x={565} y={614} fill={colors.NEGATIVE} fontSize={12.5} fontFamily={mono} opacity={mysteryU * (1 - closeU)}>a url carries no logins · no instructions · no environment</text>
      </g>

      {/* Override packet: a URL diving into run 419 */}
      {overrideU > 0 && overrideU < 1 && <g opacity={clamp01(overrideU * 5) * clamp01((1 - overrideU) * 5)}>
        <circle cx={lerp(760, 400, overrideU)} cy={lerp(180, 512, overrideU)} r={9} fill={colors.WARM} />
        <text x={lerp(760, 400, overrideU) + 16} y={lerp(180, 512, overrideU) + 4} fill={colors.WARM} fontSize={11} fontFamily={mono}>override url</text>
      </g>}

      {/* The closing problem statement */}
      {closeU > 0 && <g opacity={closeU}>
        <rect x={225} y={215} width={830} height={200} rx={26} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={2} />
        <text x={640} y={282} textAnchor="middle" fill={colors.TEXT} fontSize={31} fontWeight={800}>The problem</text>
        <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={19}>one URL slot · one instructions slot</text>
        <text x={640} y={370} textAnchor="middle" fill={colors.WARM} fontSize={19}>runs that cannot name their environment</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
