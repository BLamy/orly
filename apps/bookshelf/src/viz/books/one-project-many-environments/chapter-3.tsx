// One Project, Many Environments — chapter 3: Different Environments, Different Triggers.
// Step four of the proposal: once environments are rows, each row owns its trigger.
// Production: nightly on weekdays. Staging: deploy-to-main pipeline completion.
// Preview: PR marked ready for review AND a live preview deployment.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const PIPELINE = ['merge → main', 'build', 'deploy', 'done'] as const;

// journey × environment applicability — stripe checkout must never hit production
const JOURNEYS = ['sign in', 'search', 'checkout · stripe', 'profile'] as const;
const ENV_COLS = ['production', 'staging', 'preview'] as const;
const ALLOWED = [
  [true, true, true],
  [true, true, true],
  [false, true, true],
  [true, true, true],
] as const;

const LANES = [
  { name: 'production', y: 120, color: colors.POSITIVE, url: 'app.example.com' },
  { name: 'staging', y: 295, color: colors.WARM, url: 'staging.example.com' },
  { name: 'preview · PR 421', y: 470, color: colors.SECONDARY, url: 'preview-421.example.com' },
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const lanesU = tl.channel('lanesU', 0);
  const focus = tl.channel('focus', 0);   // 0 all · 1 production · 2 staging · 3 preview
  const weekU = tl.channel('weekU', 0);        // weekday strip lights M–F
  const prodFire = tl.channel('prodFire', 0);  // nightly run packet
  const pipeU = tl.channel('pipeU', 0);        // staging pipeline stages complete
  const stageFire = tl.channel('stageFire', 0);
  const prReadyU = tl.channel('prReadyU', 0);  // draft → ready for review
  const prDeployU = tl.channel('prDeployU', 0);// preview deployment comes up
  const gateU = tl.channel('gateU', 0);        // AND gate satisfied
  const prFire = tl.channel('prFire', 0);
  const matrixU = tl.channel('matrixU', 0);  // journey × environment applicability
  const skipU = tl.channel('skipU', 0);      // spotlight the production ✕
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6.2, text: 'Step four is the payoff. Once environments are real rows, each row can own the second thing that differs between worlds: what triggers a run.' });
  tl.tween(lanesU, 1, { at: 0.8, dur: 2.0, ease: ease.enter });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 6.2, text: 'Production watches the clock. We propose a nightly run every weekday, so each morning starts with fresh results against the live site.' });
  tl.tween(cam, { x: 640, y: 240, k: 1.18 }, { at: t - 5.8, dur: 1.3, ease: ease.move });
  tl.tween(focus, 1, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(weekU, 1, { at: t - 4.8, dur: 2.4, ease: ease.linear });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 5.8, text: 'No human in the loop. If Tuesday night breaks checkout, we know before Wednesday standup.' });
  tl.tween(prodFire, 1, { at: t - 5.2, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'Staging watches the pipeline. When a merge lands on main and the deploy pipeline finishes, that completion event is the trigger.' });
  tl.tween(cam, { x: 640, y: 340, k: 1.14 }, { at: t - 6.0, dur: 1.3, ease: ease.move });
  tl.tween(focus, 2, { at: t - 6.0, dur: 1.0, ease: ease.move });
  tl.tween(pipeU, 1, { at: t - 4.8, dur: 3.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 5.8, text: 'Not the merge itself, the deployment. We only test staging once the new code is actually serving traffic.' });
  tl.tween(stageFire, 1, { at: t - 5.0, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Pull requests watch the review state. A draft does nothing. Marking the pull request ready for review arms the trigger.' });
  tl.tween(cam, { x: 640, y: 440, k: 1.14 }, { at: t - 5.8, dur: 1.3, ease: ease.move });
  tl.tween(focus, 3, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(prReadyU, 1, { at: t - 4.4, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 6.2, text: 'Armed is not fired. The run starts only when the preview deployment is also live, so two conditions gate it: ready for review, and a resolvable preview address.' });
  tl.tween(prDeployU, 1, { at: t - 5.4, dur: 1.4, ease: ease.move });
  tl.tween(gateU, 1, { at: t - 3.6, dur: 0.6, ease: ease.pop });
  tl.tween(prFire, 1, { at: t - 2.8, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6, text: 'Notice what never changed: the journeys. Sign in, search, checkout, and profile are written once, and each trigger simply picks the world they run against.' });
  tl.tween(cam, { x: 640, y: 350, k: 1.0 }, { at: t - 5.6, dur: 1.5, ease: ease.move });
  tl.tween(focus, 0, { at: t - 5.6, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.4, text: 'Journeys need no migration at all. The exclusions table starts empty, and an empty table means every journey runs in every environment, exactly like today.' });
  tl.tween(lanesU, 0, { at: t - 6.0, dur: 1.0, ease: ease.move });
  tl.tween(matrixU, 1, { at: t - 5.2, dur: 2.4, ease: ease.enter });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 5.8, text: 'Then we exclude where a journey cannot work. Stripe checkout would run real charges in production, so one exclusion row keeps it out, and the nightly run simply skips it.' });
  tl.tween(skipU, 1, { at: t - 5.2, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'Three worlds, three trigger policies, one project. That is what this proposal buys us, and every run will finally say which world it ran in.' });
  tl.tween(closeU, 1, { at: t - 5.2, dur: 1.0, ease: ease.enter });
  tl.tween(matrixU, 0.12, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 340, k: 1.06 }, { at: t - 5.0, dur: 1.6, ease: ease.move });
  tl.hold(t, 1.0);
  return { tl, cam, lanesU, focus, weekU, prodFire, pipeU, stageFire, prReadyU, prDeployU, gateU, prFire, matrixU, skipU, closeU };
}

const scene = buildScene();

function FirePacket({ u, y, color, url }: { u: number; y: number; color: string; url: string }) {
  if (u <= 0) return null;
  const x = lerp(830, 1110, clamp01(u));
  return <g>
    <line x1={830} y1={y} x2={x} y2={y} stroke={color} strokeWidth={2.4} opacity={0.7} />
    <circle cx={x} cy={y} r={9} fill={color} />
    {u > 0.92 && <g opacity={(u - 0.92) * 12.5} transform={`translate(1120 ${y - 16})`}>
      <rect width={54} height={32} rx={9} fill={color} opacity={0.16} />
      <text x={27} y={21} textAnchor="middle" fill={color} fontSize={12} fontWeight={750}>run</text>
    </g>}
    <text x={832} y={y - 12} fill={color} fontSize={10.5} fontFamily={mono} opacity={clamp01(u * 3)}>{url}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const lanesU = s.get(scene.lanesU);
  const focus = s.get(scene.focus);
  // 1 when this lane is the camera's subject (or no lane is), else dimmed to a whisper
  const laneOp = (i: number) => {
    const active = clamp01(1 - Math.abs(focus - (i + 1)));
    return lerp(1, lerp(0.1, 1, active), clamp01(focus));
  };
  const weekU = s.get(scene.weekU);
  const pipeU = s.get(scene.pipeU);
  const prReadyU = s.get(scene.prReadyU);
  const prDeployU = s.get(scene.prDeployU);
  const gateU = s.get(scene.gateU);
  const matrixU = s.get(scene.matrixU);
  const skipU = s.get(scene.skipU);
  const closeU = s.get(scene.closeU);

  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {LANES.map((lane, i) => {
        const show = clamp01(lanesU * 3 - i * 0.8);
        return <g key={lane.name} opacity={show * laneOp(i)}>
          <rect x={85} y={lane.y - 42} width={1110} height={150} rx={20} fill={colors.PANEL} stroke={lane.color} strokeWidth={1.6} opacity={0.5} />
          <text x={112} y={lane.y - 12} fill={colors.TEXT} fontSize={19} fontWeight={750}>{lane.name}</text>
          <text x={112} y={lane.y + 10} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>{lane.url}</text>
        </g>;
      })}

      {/* production: weekday nightly schedule */}
      <g opacity={clamp01(lanesU * 3) * laneOp(0)}>
        {DAYS.map((d, i) => {
          const lit = i < 5 ? clamp01(weekU * 6 - i) : 0;
          return <g key={i} transform={`translate(${400 + i * 56} ${LANES[0].y + 8})`}>
            <rect width={44} height={44} rx={10} fill={i < 5 ? colors.POSITIVE : colors.MUTED}
              opacity={i < 5 ? 0.1 + 0.5 * lit : 0.07} stroke={i < 5 && lit > 0.5 ? colors.POSITIVE : colors.MUTED} strokeOpacity={0.5} />
            <text x={22} y={28} textAnchor="middle" fill={i < 5 && lit > 0.3 ? colors.POSITIVE : colors.MUTED} fontSize={15} fontWeight={700}>{d}</text>
            {i < 5 && lit > 0.7 && <circle cx={22} cy={-8} r={3.5} fill={colors.POSITIVE} opacity={(lit - 0.7) * 3.3} />}
          </g>;
        })}
        <text x={400} y={LANES[0].y + 78} fill={colors.POSITIVE} fontSize={11.5} fontFamily={mono} opacity={weekU}>schedule: nightly · weekdays · 02:00 UTC</text>
        <FirePacket u={s.get(scene.prodFire)} y={LANES[0].y + 30} color={colors.POSITIVE} url="nightly run" />
      </g>

      {/* staging: deploy pipeline completion */}
      <g opacity={clamp01(lanesU * 3 - 0.8) * laneOp(1)}>
        {PIPELINE.map((stage, i) => {
          const done = clamp01(pipeU * 4.4 - i);
          const isLast = i === PIPELINE.length - 1;
          return <g key={stage} transform={`translate(${400 + i * 112} ${LANES[1].y + 8})`}>
            <rect width={96} height={44} rx={10} fill={isLast && done > 0.6 ? colors.WARM : colors.BG}
              fillOpacity={isLast && done > 0.6 ? 0.2 : 1}
              stroke={done > 0.3 ? colors.WARM : colors.MUTED} strokeOpacity={done > 0.3 ? 0.95 : 0.35} strokeWidth={1.6} />
            <text x={48} y={26} textAnchor="middle" fill={done > 0.3 ? colors.TEXT : colors.MUTED} fontSize={11} fontFamily={mono}>{stage}</text>
            {i < PIPELINE.length - 1 && <line x1={96} y1={22} x2={112} y2={22} stroke={done > 0.8 ? colors.WARM : colors.MUTED} strokeWidth={2} opacity={done > 0.8 ? 1 : 0.3} />}
          </g>;
        })}
        <text x={400} y={LANES[1].y + 78} fill={colors.WARM} fontSize={11.5} fontFamily={mono} opacity={clamp01(pipeU * 2)}>trigger: deployment pipeline completed on main</text>
        <FirePacket u={s.get(scene.stageFire)} y={LANES[1].y + 30} color={colors.WARM} url="post-deploy run" />
      </g>

      {/* preview: ready-for-review AND live preview deployment */}
      <g opacity={clamp01(lanesU * 3 - 1.6) * laneOp(2)}>
        <g transform={`translate(400 ${LANES[2].y + 8})`}>
          <rect width={150} height={44} rx={10} fill={prReadyU > 0.5 ? colors.SECONDARY : colors.BG}
            fillOpacity={prReadyU > 0.5 ? 0.18 : 1} stroke={prReadyU > 0.5 ? colors.SECONDARY : colors.MUTED} strokeWidth={1.6} strokeOpacity={prReadyU > 0.5 ? 1 : 0.4} />
          <text x={75} y={26} textAnchor="middle" fill={prReadyU > 0.5 ? colors.TEXT : colors.MUTED} fontSize={11.5} fontFamily={mono}>
            {prReadyU > 0.5 ? 'ready for review' : 'draft'}</text>
        </g>
        <g transform={`translate(570 ${LANES[2].y + 8})`}>
          <rect width={150} height={44} rx={10} fill={prDeployU > 0.5 ? colors.SECONDARY : colors.BG}
            fillOpacity={prDeployU > 0.5 ? 0.18 : 1} stroke={prDeployU > 0.5 ? colors.SECONDARY : colors.MUTED} strokeWidth={1.6} strokeOpacity={prDeployU > 0.5 ? 1 : 0.4} />
          <text x={75} y={26} textAnchor="middle" fill={prDeployU > 0.5 ? colors.TEXT : colors.MUTED} fontSize={11.5} fontFamily={mono}>
            {prDeployU > 0.5 ? 'preview deployed' : 'deploying…'}</text>
        </g>
        {/* AND gate */}
        <g transform={`translate(745 ${LANES[2].y + 8})`}>
          <path d="M 0 0 L 26 0 A 22 22 0 0 1 26 44 L 0 44 Z" fill={gateU > 0.5 ? colors.SECONDARY : colors.BG}
            fillOpacity={gateU > 0.5 ? 0.25 : 1} stroke={colors.SECONDARY} strokeWidth={1.8} strokeOpacity={0.5 + 0.5 * gateU} />
          <text x={20} y={27} textAnchor="middle" fill={gateU > 0.5 ? colors.TEXT : colors.MUTED} fontSize={10.5} fontWeight={700}>AND</text>
        </g>
        <text x={400} y={LANES[2].y + 78} fill={colors.SECONDARY} fontSize={11.5} fontFamily={mono} opacity={clamp01(prReadyU * 2)}>trigger: ready_for_review ∧ preview deployment live</text>
        <FirePacket u={s.get(scene.prFire)} y={LANES[2].y + 30} color={colors.SECONDARY} url="preview run" />
      </g>

      {/* journey × environment applicability matrix */}
      {matrixU > 0 && <g opacity={matrixU}>
        <text x={365} y={130} fill={colors.TEXT} fontSize={21} fontWeight={750}>Which journeys run where</text>
        <text x={365} y={152} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>journey_exclusions · runs everywhere unless excluded</text>
        {ENV_COLS.map((env, c) => (
          <text key={env} x={700 + c * 130} y={192} textAnchor="middle" fill={c === 0 ? colors.POSITIVE : c === 1 ? colors.WARM : colors.SECONDARY}
            fontSize={13} fontWeight={700} fontFamily={mono} opacity={clamp01(matrixU * 3 - c * 0.5)}>{env}</text>
        ))}
        {JOURNEYS.map((j, r) => {
          const stripe = r === 2;
          return <g key={j} opacity={clamp01(matrixU * 3 - r * 0.5)}>
            <rect x={355} y={208 + r * 62} width={730} height={50} rx={12} fill={colors.PANEL}
              stroke={stripe && skipU > 0.1 ? colors.NEGATIVE : colors.MUTED} strokeOpacity={stripe && skipU > 0.1 ? 0.9 : 0.3}
              strokeWidth={stripe ? 1 + skipU * 1.4 : 1} />
            <text x={380} y={239 + r * 62} fill={colors.TEXT} fontSize={14.5} fontFamily={mono}>{j}</text>
            {ENV_COLS.map((env, c) => {
              const ok = ALLOWED[r]![c]!;
              const cellShow = clamp01(matrixU * 8 - (r * 3 + c) * 0.5);
              return <g key={env} opacity={cellShow} transform={`translate(${700 + c * 130} ${233 + r * 62})`}>
                {!ok && skipU > 0.05 && <circle r={15 + 3 * skipU} fill={colors.NEGATIVE} opacity={0.14 * skipU} />}
                <text textAnchor="middle" y={6} fill={ok || skipU < 0.5 ? colors.POSITIVE : colors.NEGATIVE} fontSize={ok || skipU < 0.5 ? 15 : 17} fontWeight={800}>{ok || skipU < 0.5 ? '✓' : '✕'}</text>
              </g>;
            })}
          </g>;
        })}
        {skipU < 0.5 && <text x={365} y={492} fill={colors.POSITIVE} fontSize={12.5} fontFamily={mono} opacity={clamp01(matrixU * 2 - 1) * (1 - skipU * 2)}>no exclusions yet: every journey runs everywhere</text>}
        {skipU > 0.3 && <text x={365} y={492} fill={colors.NEGATIVE} fontSize={12.5} fontFamily={mono} opacity={(skipU - 0.3) * 1.4}>exclusion row: production skips it · no real charges</text>}
      </g>}

      {/* close */}
      {closeU > 0 && <g opacity={closeU}>
        <rect x={235} y={215} width={810} height={200} rx={26} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={2} />
        <text x={640} y={285} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={800}>three worlds · three triggers · one project</text>
        <text x={640} y={331} textAnchor="middle" fill={colors.MUTED} fontSize={18}>nightly weekdays · deploy to main · ready for review + preview</text>
        <text x={640} y={373} textAnchor="middle" fill={colors.SECONDARY} fontSize={17}>and every run names the world it ran in</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
