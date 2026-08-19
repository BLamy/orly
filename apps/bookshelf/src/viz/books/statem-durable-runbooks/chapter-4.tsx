// StateM, chapter 4 — "What the Harness Learns"
//
// Grounding: arXiv:2608.15089 Sections 4.2-4.7, Tables 1-5, and the
// Conclusion; henryqin1997/statem public examples and verification guide.
// Exact result boundaries remain visible: 95.28% is the raw public submission
// result, 88.09% is DeepSeek under standard timeouts, frozen GPT-profile
// transfer to DeepSeek declines from 82.7% to 82.0%, and BusinessBench includes
// both positive and negative family transfer.
//
// Centerpiece: a result matrix becomes a selective-practice sieve. Nearby
// models keep concrete controls; greater model/task distance filters or
// reshapes them. The final beat retraces all four book mechanisms.
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
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const ROWS = [
  { model: 'GPT-5.5 xhigh', base: '83.1', profile: '92.1', adapted: '—', note: 'developed profile' },
  { model: 'GPT-5.6 Sol xhigh', base: '84.9', profile: '95.28', adapted: '—', note: 'frozen GPT profile · raw' },
  { model: 'GPT-5.6 Luna', base: '76.7', profile: '85.4', adapted: '—', note: 'frozen GPT profile' },
  { model: 'DeepSeek-V4 Flash', base: '82.7', profile: '82.0', adapted: '88.09', note: 'adapted · standard timeouts' },
] as const;
const ROW_Y = [215, 305, 395, 485];
const PRACTICES = [
  { label: 'state boundaries', y: 220, outcome: 'keep', color: colors.POSITIVE },
  { label: 'visible routing', y: 285, outcome: 'keep', color: colors.POSITIVE },
  { label: 'GPT-specific checks', y: 350, outcome: 'reshape', color: colors.WARM },
  { label: 'generic procedure', y: 415, outcome: 'drop', color: colors.NEGATIVE },
  { label: 'failure analysis', y: 480, outcome: 'keep', color: colors.POSITIVE },
] as const;

const CAM_MATRIX: CameraState = { x: 640, y: 360, k: 1.02 };
const CAM_PROVIDER: CameraState = { x: 640, y: 430, k: 1.08 };
const CAM_SIEVE: CameraState = { x: 640, y: 355, k: 1.05 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  frameU: ChannelRef<number>;
  rowsU: ChannelRef<number>;
  activeRow: ChannelRef<number>;
  transferU: ChannelRef<number>;
  providerU: ChannelRef<number>;
  adaptU: ChannelRef<number>;
  caveatU: ChannelRef<number>;
  matrixDim: ChannelRef<number>;
  sieveU: ChannelRef<number>;
  businessU: ChannelRef<number>;
  practiceU: ChannelRef<number>;
  recapU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const frameU = tl.channel('frameU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const activeRow = tl.channel('activeRow', 0);
  const transferU = tl.channel('transferU', 0);
  const providerU = tl.channel('providerU', 0);
  const adaptU = tl.channel('adaptU', 0);
  const caveatU = tl.channel('caveatU', 0);
  const matrixDim = tl.channel('matrixDim', 0);
  const sieveU = tl.channel('sieveU', 0);
  const businessU = tl.channel('businessU', 0);
  const practiceU = tl.channel('practiceU', 0);
  const recapU = tl.channel('recapU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({
    at: 0.4,
    dur: 6.8,
    text: 'Hold the model fixed first. With the developed runtime profile, model version five point five rises from eighty-three point one to ninety-two point one percent.',
  });
  tl.tween(cam, CAM_MATRIX, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(frameU, 1, { at: 0.8, dur: 1.3, ease: ease.draw });
  tl.tween(rowsU, 1, { at: 1.6, dur: 0.9, ease: ease.enter });
  tl.hold(7.2, 0.6);

  tl.caption({
    at: 7.8,
    dur: 7.0,
    text: 'Freeze that profile and move to the next model generation. Sol reaches ninety-five point two eight raw, while Luna rises from seventy-six point seven to eighty-five point four.',
  });
  tl.tween(rowsU, 3, { at: 8.2, dur: 2.4, ease: ease.enter });
  tl.tween(activeRow, 2, { at: 8.2, dur: 2.4, ease: ease.move });
  tl.tween(transferU, 1, { at: 10.0, dur: 1.2, ease: ease.draw });
  tl.hold(14.8, 0.6);

  tl.caption({
    at: 15.4,
    dur: 6.4,
    text: 'That headline needs its boundary. The ninety-five point two eight figure is a raw public submission score, not a finalized leaderboard result.',
  });
  tl.tween(caveatU, 1, { at: 15.8, dur: 0.9, ease: ease.enter });
  tl.hold(21.8, 0.6);

  tl.caption({
    at: 22.4,
    dur: 6.6,
    text: 'Cross the provider boundary and exact transfer fails. The frozen profile moves the other provider model from eighty-two point seven down to eighty-two point zero.',
  });
  tl.tween(caveatU, 0, { at: 21.9, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_PROVIDER, { at: 22.6, dur: 1.4, ease: ease.move });
  tl.tween(rowsU, 4, { at: 22.9, dur: 0.9, ease: ease.enter });
  tl.tween(activeRow, 3, { at: 23.0, dur: 1.2, ease: ease.move });
  tl.tween(providerU, 1, { at: 24.0, dur: 0.8, ease: ease.pop });
  tl.hold(29.0, 0.6);

  tl.caption({
    at: 29.6,
    dur: 6.8,
    text: 'Keep the runtime, runbook structure, and failure-analysis method, then adapt the concrete practices. Under standard timeouts, the other provider model reaches eighty-eight point zero nine.',
  });
  tl.tween(adaptU, 1, { at: 30.0, dur: 1.4, ease: ease.move });
  tl.hold(36.4, 0.6);

  tl.caption({
    at: 37.0,
    dur: 6.8,
    text: 'So transfer is a hierarchy. Exact controls travel nearby; structure and development principles travel farther; model-specific rules must pass through a filter.',
  });
  tl.tween(cam, CAM_SIEVE, { at: 37.2, dur: 1.4, ease: ease.move });
  tl.tween(matrixDim, 1, { at: 37.4, dur: 1.0, ease: ease.move });
  tl.tween(sieveU, 1, { at: 38.0, dur: 3.8, ease: ease.move });
  tl.hold(43.8, 0.6);

  tl.caption({
    at: 44.4,
    dur: 7.0,
    text: 'Task transfer follows the same rule. Budget approval and machine operating improve strongly, while mismatched profiles regress on other families.',
  });
  tl.tween(businessU, 1, { at: 44.8, dur: 1.4, ease: ease.enter });
  tl.hold(51.4, 0.6);

  tl.caption({
    at: 52.0,
    dur: 6.6,
    text: 'The harness should not remember every failure. It should preserve the consequential boundary, revise the wrong abstraction, and remove generic procedure that does not fit.',
  });
  tl.tween(practiceU, 1, { at: 52.4, dur: 1.2, ease: ease.enter });
  tl.hold(58.6, 0.6);

  tl.caption({
    at: 59.2,
    dur: 7.0,
    text: 'Now retrace the run: a durable phase holds its place, a checked gate protects handoff, a ledger enables recovery, and selected practices carry lessons forward.',
  });
  tl.tween(matrixDim, 1.25, { at: 59.4, dur: 1.0, ease: ease.move });
  tl.tween(businessU, 0, { at: 59.4, dur: 0.8, ease: ease.move });
  tl.tween(sieveU, 0, { at: 59.4, dur: 0.8, ease: ease.move });
  tl.tween(recapU, 1, { at: 60.0, dur: 3.4, ease: ease.draw });
  tl.hold(66.2, 0.6);

  tl.caption({
    at: 66.8,
    dur: 7.2,
    text: 'Harness scaling complements model scaling. It does not make one runbook universal; it makes procedural control explicit enough to test, adapt, and reuse.',
  });
  tl.tween(endDim, 1, { at: 67.0, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 68.0, dur: 0.9, ease: ease.enter });
  tl.hold(74.0, 1.2);

  return { tl, cam, frameU, rowsU, activeRow, transferU, providerU, adaptU, caveatU, matrixDim, sieveU, businessU, practiceU, recapU, endDim, endU };
}

const scene = buildScene();

function ScoreCell({ x, y, value, label, color, u, active }: { x: number; y: number; value: string; label: string; color: string; u: number; active?: boolean }) {
  if (u <= 0.002) return null;
  return (
    <g opacity={u} transform={`translate(0 ${lerp(10, 0, u)})`}>
      <rect x={x - 82} y={y - 28} width={164} height={56} rx={10} fill={colors.PANEL} stroke={active ? color : colors.GRID} strokeWidth={active ? 2.2 : 1.1} />
      <text x={x} y={y - 2} textAnchor="middle" fill={color} fontFamily={MONO} fontSize={19} fontWeight={700}>{value}</text>
      <text x={x} y={y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={10}>{label}</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const frameU = s.get(scene.frameU);
  const rowsU = s.get(scene.rowsU);
  const activeRow = s.get(scene.activeRow);
  const transferU = s.get(scene.transferU);
  const providerU = s.get(scene.providerU);
  const adaptU = s.get(scene.adaptU);
  const caveatU = s.get(scene.caveatU);
  const matrixDim = s.get(scene.matrixDim);
  const sieveU = s.get(scene.sieveU);
  const businessU = s.get(scene.businessU);
  const practiceU = s.get(scene.practiceU);
  const recapU = s.get(scene.recapU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);
  const dim = 1 - endDim * 0.9;
  const matrixOpacity = (1 - matrixDim * 0.88) * dim;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={frameU * matrixOpacity}>
          <text x={78} y={95} fill={colors.MUTED} fontSize={12} letterSpacing="0.12em">TERMINAL-BENCH 2.1 · TRIAL SUCCESS RATE (%)</text>
          <text x={440} y={145} textAnchor="middle" fill={colors.MUTED} fontSize={12}>reference / baseline</text>
          <text x={705} y={145} textAnchor="middle" fill={colors.ACCENT} fontSize={12}>StateM profile</text>
          <text x={970} y={145} textAnchor="middle" fill={colors.WARM} fontSize={12}>adapted profile</text>
          {ROWS.map((row, i) => {
            const rowU = clamp01(rowsU - i);
            const active = Math.abs(activeRow - i) < 0.55;
            return (
              <g key={row.model} opacity={rowU}>
                <text x={72} y={ROW_Y[i] - 4} fill={active ? colors.TEXT : colors.MUTED} fontFamily={MONO} fontSize={13}>{row.model}</text>
                <text x={72} y={ROW_Y[i] + 17} fill={colors.MUTED} fontSize={10}>{row.note}</text>
                <ScoreCell x={440} y={ROW_Y[i]} value={row.base} label={i === 3 ? 'baseline' : 'reference'} color={colors.MUTED} u={rowU} active={active && i === 3 && providerU > 0} />
                <ScoreCell x={705} y={ROW_Y[i]} value={row.profile} label={i === 0 ? 'developed' : 'frozen GPT profile'} color={i === 3 ? colors.NEGATIVE : colors.ACCENT} u={rowU} active={active} />
                {i === 3 && <ScoreCell x={970} y={ROW_Y[i]} value={row.adapted} label="standard timeouts" color={colors.POSITIVE} u={rowU * adaptU} active={adaptU > 0.5} />}
              </g>
            );
          })}
          {transferU > 0 && (
            <path d={`M 705 245 C 770 260, 770 350, 705 375`} fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeDasharray="8 6" opacity={transferU} />
          )}
          {providerU > 0 && (
            <text x={705} y={540} textAnchor="middle" fill={colors.NEGATIVE} fontFamily={MONO} fontSize={12} opacity={providerU}>exact-profile transfer: −0.7 points</text>
          )}
          {caveatU > 0 && (
            <g opacity={caveatU}>
              <rect x={355} y={548} width={600} height={50} rx={10} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={655} y={570} textAnchor="middle" fill={colors.WARM} fontSize={12}>95.28% raw public submission · pre-adjudication · submission PR remains open</text>
              <text x={655} y={588} textAnchor="middle" fill={colors.MUTED} fontSize={10}>the paper reports adjudication-sensitive alternatives separately</text>
            </g>
          )}
        </g>

        {sieveU > 0 && (
          <g opacity={clamp01(sieveU) * dim}>
            <text x={640} y={115} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>TRANSFER DISTANCE FILTERS PROCEDURE</text>
            <line x1={640} y1={165} x2={640} y2={535} stroke={colors.SECONDARY} strokeWidth={5} />
            <path d="M 620 185 L 660 205 L 620 225 M 620 315 L 660 335 L 620 355 M 620 445 L 660 465 L 620 485" fill="none" stroke={colors.SECONDARY} strokeWidth={3} />
            <text x={470} y={575} textAnchor="middle" fill={colors.MUTED} fontSize={12}>nearby model</text>
            <text x={810} y={575} textAnchor="middle" fill={colors.MUTED} fontSize={12}>new provider or task family</text>
            {PRACTICES.map((practice, i) => {
              const u = clamp01(sieveU * 1.7 - i * 0.12);
              const pass = practice.outcome !== 'drop';
              const reshape = practice.outcome === 'reshape';
              const x0 = 325;
              const x1 = pass ? 940 : 610;
              const x = lerp(x0, x1, u);
              const w = 210;
              return (
                <g key={practice.label} transform={`translate(${x} ${practice.y})`} opacity={u}>
                  <rect x={-w / 2} y={-20} width={w} height={40} rx={10} fill={colors.PANEL} stroke={practice.color} strokeWidth={1.4} />
                  <text y={5} textAnchor="middle" fill={practice.color} fontFamily={MONO} fontSize={12}>{practice.label}</text>
                  {u > 0.92 && <text x={w / 2 + 18} y={5} fill={practice.color} fontSize={11}>{reshape ? 'adapt' : practice.outcome}</text>}
                </g>
              );
            })}
          </g>
        )}

        {businessU > 0 && (
          <g opacity={businessU * dim}>
            <rect x={95} y={145} width={500} height={410} rx={20} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.5} />
            <text x={345} y={185} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontWeight={700}>MECHANISM MATCH</text>
            <text x={130} y={235} fill={colors.TEXT} fontSize={14}>Budget Approval</text>
            <text x={550} y={235} textAnchor="end" fill={colors.POSITIVE} fontFamily={MONO} fontSize={16}>+12.21</text>
            <text x={130} y={285} fill={colors.TEXT} fontSize={14}>Machine Operating</text>
            <text x={550} y={285} textAnchor="end" fill={colors.POSITIVE} fontFamily={MONO} fontSize={16}>+9.21</text>
            <text x={130} y={342} fill={colors.MUTED} fontSize={12}>explicit constraints · intermediate state</text>
            <text x={130} y={370} fill={colors.MUTED} fontSize={12}>completion conditions · fresh evidence</text>

            <rect x={685} y={145} width={500} height={410} rx={20} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.5} />
            <text x={935} y={185} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16} fontWeight={700}>WRONG BOUNDARY</text>
            <text x={720} y={235} fill={colors.TEXT} fontSize={14}>RefactorBench</text>
            <text x={1140} y={235} textAnchor="end" fill={colors.NEGATIVE} fontFamily={MONO} fontSize={16}>−2.78</text>
            <text x={720} y={285} fill={colors.TEXT} fontSize={14}>WooCommerce Stock</text>
            <text x={1140} y={285} textAnchor="end" fill={colors.NEGATIVE} fontFamily={MONO} fontSize={16}>−3.70</text>
            <text x={720} y={342} fill={colors.MUTED} fontSize={12}>generic compatibility procedure</text>
            <text x={720} y={370} fill={colors.MUTED} fontSize={12}>missed the consequential invariant</text>
            {practiceU > 0 && (
              <g opacity={practiceU}>
                <path d="M 650 410 C 600 450, 520 470, 430 490" fill="none" stroke={colors.WARM} strokeWidth={3} />
                <path d="M 650 410 C 700 450, 780 470, 870 490" fill="none" stroke={colors.WARM} strokeWidth={3} />
                <text x={650} y={430} textAnchor="middle" fill={colors.WARM} fontSize={13}>revise · remove · narrow</text>
              </g>
            )}
          </g>
        )}

        {recapU > 0 && (
          <g opacity={recapU * dim}>
            {[
              { x: 190, label: 'DURABLE PHASE', color: colors.ACCENT },
              { x: 490, label: 'CHECKED GATE', color: colors.POSITIVE },
              { x: 790, label: 'RUN LEDGER', color: colors.SECONDARY },
              { x: 1090, label: 'SELECTED PRACTICE', color: colors.WARM },
            ].map((item, i, all) => (
              <g key={item.label} opacity={clamp01(recapU * 5 - i)}>
                {i < all.length - 1 && <line x1={item.x + 58} y1={350} x2={all[i + 1].x - 58} y2={350} stroke={colors.GRID} strokeWidth={3} />}
                <circle cx={item.x} cy={350} r={54} fill={colors.PANEL} stroke={item.color} strokeWidth={2.2} />
                <text x={item.x} y={355} textAnchor="middle" fill={item.color} fontSize={11} fontWeight={700}>{item.label}</text>
              </g>
            ))}
            <text x={640} y={205} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={700}>THE RUNBOOK REMEMBERS THE RUN</text>
          </g>
        )}

        {endU > 0 && (
          <g opacity={endU}>
            <rect x={235} y={200} width={810} height={285} rx={24} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.6} />
            <text x={640} y={278} textAnchor="middle" fill={colors.WARM} fontSize={24} fontWeight={700}>HARNESS SCALING IS SELECTIVE</text>
            <text x={640} y={334} textAnchor="middle" fill={colors.TEXT} fontSize={18}>make control explicit · test the boundary</text>
            <line x1={420} y1={371} x2={860} y2={371} stroke={colors.GRID} />
            <text x={640} y={415} textAnchor="middle" fill={colors.POSITIVE} fontSize={17}>adapt what does not transfer · keep what does</text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
