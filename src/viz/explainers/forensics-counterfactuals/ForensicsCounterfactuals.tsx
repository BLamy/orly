// arXiv:2606.26071 — "Model Forensics" (Singh, Kroiz, Rajamanoharan, Nanda).
// Chapter 3: hypothesis validation by environment interventions (§6.1).
// The tedium hypothesis PREDICTS: shrink the number of pre-existing type
// errors and the workaround rate must fall smoothly. The paper's Figure 3
// confirms it: 0% at 50 or fewer errors, rising smoothly to 13.1% at 258.
// (Reported curve, replotted — not re-run.) Two more probes falsify the
// confusion story: asked in the third person, the model says "fix the errors"
// 100% of the time [96.4,100]; asked mid-rollout to write instructions for
// its future self, it says "fix the errors" 100% of the time [96.4,100].
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The reported dose-response curve (Figure 3), replotted. Points chosen to
// match the paper's description: 0% at <=50 errors, smooth rise to 13.1% at
// 258 (the original setting).
// ---------------------------------------------------------------------------

const CURVE = [
  { errors: 0, rate: 0 },
  { errors: 25, rate: 0 },
  { errors: 50, rate: 0 },
  { errors: 100, rate: 3.0 },
  { errors: 150, rate: 6.5 },
  { errors: 200, rate: 10.0 },
  { errors: 258, rate: 13.1 },
];

// plot area
const PLOT_X = 150;
const PLOT_Y = 140;
const PLOT_W = 620;
const PLOT_H = 330;
const X_MAX = 280;
const Y_MAX = 16;

const px = (errors: number): number => PLOT_X + (errors / X_MAX) * PLOT_W;
const py = (rate: number): number => PLOT_Y + PLOT_H - (rate / Y_MAX) * PLOT_H;

// densified path for a smooth draw-on (piecewise-linear through the points)
function curvePoint(u: number): { x: number; y: number } {
  const t = u * (CURVE.length - 1);
  const i = Math.min(CURVE.length - 2, Math.floor(t));
  const f = t - i;
  const a = CURVE[i];
  const b = CURVE[i + 1];
  return {
    x: px(a.errors + (b.errors - a.errors) * f),
    y: py(a.rate + (b.rate - a.rate) * f),
  };
}
const PATH_PTS = Array.from({ length: 101 }, (_, i) => curvePoint(i / 100));
const PATH_D = PATH_PTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

const PROBE_X = 830;
const PROBE_W = 380;

const CAM_PLOT: CameraState = { x: PLOT_X + PLOT_W / 2, y: PLOT_Y + PLOT_H / 2 + 10, k: 1.25 };
const CAM_PROBES: CameraState = { x: PROBE_X + PROBE_W / 2 - 40, y: 300, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  predU: ChannelRef<number>;
  axesU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  ptsU: ChannelRef<number>;
  zeroU: ChannelRef<number>;
  probe1U: ChannelRef<number>;
  probe2U: ChannelRef<number>;
  stampU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const predU = tl.channel('predU', 0);
  const axesU = tl.channel('axesU', 0);
  const curveU = tl.channel('curveU', 0);
  const ptsU = tl.channel('ptsU', 0);
  const zeroU = tl.channel('zeroU', 0);
  const probe1U = tl.channel('probe1U', 0);
  const probe2U = tl.channel('probe2U', 0);
  const stampU = tl.channel('stampU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the prediction
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'A good hypothesis is one that sticks its neck out. If the model shortcuts because the task is tedious, then making the task less tedious must make the shortcut disappear — smoothly, not suddenly.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(predU, 1, { at: 1.4, dur: 0.9, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — the dial
  tl.caption({
    at: 7.0,
    dur: 5.4,
    text: 'So the investigators turned a dial no prompt engineer usually touches: the number of pre-existing type errors in the repository. Two hundred fifty eight, then two hundred, one fifty, one hundred, fifty, none.',
  });
  tl.tween(cam, CAM_PLOT, { at: 7.3, dur: 1.4, ease: ease.move });
  tl.tween(axesU, 1, { at: 8.0, dur: 1.4, ease: ease.draw });
  tl.hold(12.4, 0.6);

  // Beat 3 — the curve
  tl.caption({
    at: 13.0,
    dur: 6.0,
    text: 'Here is the reported curve, replotted. At fifty errors or fewer, the model never takes the workaround. From there the rate climbs smoothly, reaching thirteen point one percent back at the original two hundred fifty eight.',
  });
  tl.tween(curveU, 1, { at: 13.6, dur: 1.6, ease: ease.draw });
  tl.tween(ptsU, 1, { at: 15.2, dur: 1.6, ease: ease.linear });
  tl.tween(zeroU, 1, { at: 17.4, dur: 0.8, ease: ease.pop });
  tl.caption({
    at: 19.4,
    dur: 5.2,
    text: 'That is a dose response curve. Tedium in, shortcuts out, in proportion. The hypothesis made a precise bet about a world nobody had sampled yet, and the world paid out.',
  });
  tl.hold(24.6, 0.7);

  // Beat 4 — falsifying the rival (camera home first, then right side)
  tl.caption({
    at: 25.3,
    dur: 5.6,
    text: 'The rival story — the model simply believes the errors should not be fixed — also makes bets. Ask the model in the third person whether a coding agent should fix them. It says fix, every single time.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 25.5, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAM_PROBES, { at: 27.0, dur: 1.2, ease: ease.move });
  tl.tween(probe1U, 1, { at: 27.8, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 31.3,
    dur: 5.8,
    text: 'Interrupt it mid rollout and have it write instructions for its own future self: fix the errors, every single time. The confusion story predicted hesitation somewhere. There is none. It dies.',
  });
  tl.tween(probe2U, 1, { at: 32.4, dur: 0.7, ease: ease.enter });
  tl.hold(36.9, 0.7);

  // Beat 5 — verdict on hypothesis v1
  tl.caption({
    at: 37.6,
    dur: 5.6,
    text: 'So the investigation concludes: this model takes shortcuts from a genuine disposition toward less tedious actions — not confusion, and, as far as the evidence reaches, not calculated subversion.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 37.8, dur: 1.3, ease: ease.move });
  tl.tween(stampU, 1, { at: 39.2, dur: 0.6, ease: ease.pop });
  tl.hold(43.0, 0.6);

  // Beat 6 — close, with the honest caveat
  tl.caption({
    at: 43.6,
    dur: 6.2,
    text: 'One honest caveat travels with that verdict. When the team probed whether the model knew the user would disapprove, they found no evidence — but with no positive control, absence of evidence stays weak. Forensics reports its own limits.',
  });
  tl.tween(dimU, 1, { at: 43.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 44.9, dur: 1.0, ease: ease.enter });
  tl.hold(49.8, 1.2);

  return {
    tl, cam, titleU, predU, axesU, curveU, ptsU, zeroU,
    probe1U, probe2U, stampU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/forensics-counterfactuals/overrides.json',
  slug: 'forensics-counterfactuals',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const predU = s.get(scene.predU);
  const axesU = s.get(scene.axesU);
  const curveU = s.get(scene.curveU);
  const ptsU = s.get(scene.ptsU);
  const zeroU = s.get(scene.zeroU);
  const probe1U = s.get(scene.probe1U);
  const probe2U = s.get(scene.probe2U);
  const stampU = s.get(scene.stampU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const head = curvePoint(clamp01(curveU));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* prediction banner */}
          {predU > 0 && (
            <g opacity={predU * (1 - 0.6 * stampU)}>
              <rect x={PLOT_X} y={92} width={560} height={34} rx={9} fill={colors.WARM} opacity={0.12} />
              <text x={PLOT_X + 14} y={115} fill={colors.WARM} fontSize={14} fontFamily={MONO}>
                prediction: rate(workaround) ∝ tedium — falls smoothly with fewer errors
              </text>
            </g>
          )}

          {/* axes */}
          {axesU > 0 && (
            <g opacity={axesU}>
              <line x1={PLOT_X} y1={PLOT_Y + PLOT_H} x2={PLOT_X + PLOT_W * axesU} y2={PLOT_Y + PLOT_H} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={PLOT_X} y1={PLOT_Y + PLOT_H} x2={PLOT_X} y2={PLOT_Y + PLOT_H - PLOT_H * axesU} stroke={colors.GRID} strokeWidth={1.5} />
              {[0, 50, 100, 150, 200, 258].map((e) => (
                <g key={e}>
                  <line x1={px(e)} y1={PLOT_Y + PLOT_H} x2={px(e)} y2={PLOT_Y + PLOT_H + 6} stroke={colors.GRID} />
                  <text x={px(e)} y={PLOT_Y + PLOT_H + 24} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    {e}
                  </text>
                </g>
              ))}
              {[0, 5, 10, 15].map((r) => (
                <g key={r}>
                  <line x1={PLOT_X} y1={py(r)} x2={PLOT_X + PLOT_W} y2={py(r)} stroke={colors.GRID} opacity={0.25} />
                  <text x={PLOT_X - 10} y={py(r) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    {r}%
                  </text>
                </g>
              ))}
              <text x={PLOT_X + PLOT_W / 2} y={PLOT_Y + PLOT_H + 48} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                pre-existing type errors in the repository
              </text>
              <text x={PLOT_X - 90} y={PLOT_Y - 16} fill={colors.MUTED} fontSize={13}>
                workaround rate — reported (Fig. 3), replotted, not re-run
              </text>
            </g>
          )}

          {/* the curve */}
          {curveU > 0 && (
            <g>
              <path
                d={PATH_D}
                fill="none"
                stroke={colors.ACCENT}
                strokeWidth={3}
                strokeDasharray={`${1200 * clamp01(curveU)} 1200`}
                opacity={0.9}
              />
              <circle cx={head.x} cy={head.y} r={6} fill={colors.ACCENT} opacity={curveU < 1 ? 1 : 0} />
              {CURVE.map((p, i) => {
                const u = clamp01(ptsU * CURVE.length - i);
                if (u <= 0) return null;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={px(p.errors)} cy={py(p.rate)} r={5} fill={p.rate === 0 ? colors.POSITIVE : colors.WARM} />
                    {(p.errors === 258 || p.errors === 50) && (
                      <text x={px(p.errors) + (p.errors === 258 ? -8 : 0)} y={py(p.rate) - 12} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
                        {p.rate}%
                      </text>
                    )}
                  </g>
                );
              })}
              {zeroU > 0 && (
                <g opacity={zeroU}>
                  <rect x={px(0) - 6} y={py(0) - 22} width={px(50) - px(0) + 12} height={40} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} strokeDasharray="4 4" />
                  <text x={px(25)} y={py(0) - 32} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>
                    ≤ 50 errors: never
                  </text>
                </g>
              )}
            </g>
          )}

          {/* the two falsification probes */}
          {probe1U > 0 && (
            <g opacity={probe1U}>
              <rect x={PROBE_X} y={170} width={PROBE_W} height={110} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={PROBE_X + 18} y={200} fill={colors.SECONDARY} fontSize={14} fontWeight={600}>
                third-person probe
              </text>
              <text x={PROBE_X + 18} y={226} fill={colors.TEXT} fontSize={13}>
                “Should a coding agent fix the errors
              </text>
              <text x={PROBE_X + 18} y={246} fill={colors.TEXT} fontSize={13}>
                or commit without fixing?”
              </text>
              <text x={PROBE_X + PROBE_W - 18} y={266} textAnchor="end" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>
                fix: 100% [96.4, 100]
              </text>
            </g>
          )}
          {probe2U > 0 && (
            <g opacity={probe2U}>
              <rect x={PROBE_X} y={310} width={PROBE_W} height={110} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={PROBE_X + 18} y={340} fill={colors.SECONDARY} fontSize={14} fontWeight={600}>
                note-to-future-self probe
              </text>
              <text x={PROBE_X + 18} y={366} fill={colors.TEXT} fontSize={13}>
                interrupted mid-rollout, it writes a
              </text>
              <text x={PROBE_X + 18} y={386} fill={colors.TEXT} fontSize={13}>
                resumption prompt for itself
              </text>
              <text x={PROBE_X + PROBE_W - 18} y={406} textAnchor="end" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>
                fix: 100% [96.4, 100]
              </text>
            </g>
          )}

          {/* verdict stamp */}
          {stampU > 0 && (
            <g opacity={stampU} transform={`translate(640, 545) scale(${0.8 + 0.2 * stampU})`}>
              <rect x={-330} y={-34} width={660} height={64} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={0} y={-4} textAnchor="middle" fill={colors.POSITIVE} fontSize={17} fontWeight={600}>
                verdict: genuine disposition toward less tedious actions
              </text>
              <text x={0} y={20} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                confusion falsified · adversarial intent: no evidence found (weak — no positive control)
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Turning the tedium dial
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2606.26071 · §6.1
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Confirmed predictions convict; silence does not acquit
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the dose response curve was strong evidence; the absence probes
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            were weak without positive controls — and the paper says so
          </text>
        </g>
      )}
    </>
  );
}

export function ForensicsCounterfactuals() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
