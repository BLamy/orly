// Explained: The Delta Rule — chapter 4: phase. Grounded in the local LaTeX
// source of "Semidirect Fourier Delta Attention" (arXiv:2607.11897,
// sections/03_method.tex Prop. phase-memory + 06_experiments_toy.tex Exp. A):
// SFDA upgrades KDA's real diagonal decay to a complex phase-decay
// Λ_t = diag(α_t ⊙ e^{iθ_t}). We recreate the paper's training-free mod-5
// counter at toy scale, genuinely computed: 200 random increments, phase
// z_t = R(2π a_t / 5) z_{t-1}. Final norm 1.000000, decoded count 3 = true
// count 3. The real-decay baseline (α = 0.97) collapses to norm ≈ 2.3e-3 —
// no real diagonal has a bounded period-5 orbit.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real math, module scope. Mod-5 counter over 200 steps.
// ---------------------------------------------------------------------------

const M = 5;
const T = 200;
const rand = mulberry32(20260713);
const INCREMENTS: number[] = Array.from({ length: T }, () => Math.floor(rand() * M));

/** Prefix sums (the true counter) and the phase trajectory. */
const PREFIX: number[] = (() => {
  const out = [0];
  for (let t = 0; t < T; t++) out.push(out[t] + INCREMENTS[t]);
  return out;
})();
const TRUE_COUNT = PREFIX[T] % M; // 3 with this seed

/** The rotation state, computed exactly: z_t = R(2π a_t / M) z_{t-1}. */
const Z_PATH: { x: number; y: number }[] = (() => {
  const out = [{ x: 1, y: 0 }];
  let zr = 1;
  let zi = 0;
  for (let t = 0; t < T; t++) {
    const th = (2 * Math.PI * INCREMENTS[t]) / M;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const nr = zr * c - zi * s;
    const ni = zr * s + zi * c;
    zr = nr;
    zi = ni;
    out.push({ x: zr, y: zi });
  }
  return out;
})();
const FINAL_NORM = Math.hypot(Z_PATH[T].x, Z_PATH[T].y); // 1.000000 exactly (fp)
const DECODED = (() => {
  const ph = Math.atan2(Z_PATH[T].y, Z_PATH[T].x) / (2 * Math.PI);
  return ((Math.round(ph * M) % M) + M) % M; // 3
})();

/** Real-decay baseline norm: α^t. */
const ALPHA_BASE = 0.97;
const DECAY_NORM_END = Math.pow(ALPHA_BASE, T); // ≈ 2.3e-3

/** Continuous phase angle for rendering (interpolates along the arc). */
const angleAt = (u: number): number => {
  const f = Math.max(0, Math.min(T, u));
  const i = Math.floor(f);
  const base = (2 * Math.PI * PREFIX[i]) / M;
  if (i >= T) return base;
  return base + ((2 * Math.PI * INCREMENTS[i]) / M) * (f - i);
};

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const CIRC_X = 380;
const CIRC_Y = 350;
const CIRC_R = 170;

const NORM_X = scaleLinear().domain([0, T]).range([760, 1190]);
const NORM_Y = scaleLinear().domain([0, 1.1]).range([560, 260]);

const CAM_CIRC: CameraState = { x: 420, y: 350, k: 1.3 };
const CAM_NORM: CameraState = { x: 960, y: 400, k: 1.25 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  circU: ChannelRef<number>;
  marksU: ChannelRef<number>;
  spinTok: ChannelRef<number>;
  eqU: ChannelRef<number>;
  normU: ChannelRef<number>;
  normTok: ChannelRef<number>;
  verdictU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const circU = tl.channel('circU', 0);
  const marksU = tl.channel('marksU', 0);
  const spinTok = tl.channel('spinTok', 0);
  const eqU = tl.channel('eqU', 0);
  const normU = tl.channel('normU', 0);
  const normTok = tl.channel('normTok', 0);
  const verdictU = tl.channel('verdictU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the task pure decay cannot do
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Here is a memory task that sounds trivial: keep a running count, modulo five. Five, ten, fifteen — back to zero. Now try to hold that in a channel that can only shrink or stay.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 7.1,
    dur: 6.0,
    text: 'A real decay multiplies by a number between zero and one. Shrink, and the count fades to nothing. Hold at one, and the value never moves. There is no real number whose powers cycle through five states.',
  });
  tl.hold(13.3, 0.6);

  // Beat 2 — the rotation
  tl.caption({
    at: 13.9,
    dur: 6.0,
    text: 'The paper behind this chapter makes the decay complex. A complex number has a magnitude and an angle — and multiplying by a unit phase rotates without shrinking anything.',
  });
  tl.tween(cam, CAM_CIRC, { at: 14.1, dur: 1.4, ease: ease.move });
  tl.tween(circU, 1, { at: 14.7, dur: 1.2, ease: ease.draw });
  tl.tween(marksU, 1, { at: 16.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 20.3,
    dur: 5.4,
    text: 'Store the counter as a position on a circle with five marks. Each increment rotates the state by that many fifths of a turn. Counting becomes geometry.',
  });
  tl.tween(spinTok, 12, { at: 20.7, dur: 5.2, ease: ease.linear });
  tl.hold(26.1, 0.6);

  // Beat 3 — the long run
  tl.caption({
    at: 26.7,
    dur: 5.8,
    text: 'Now the stress test, computed for real: two hundred random increments. Watch the norm — the length of the state — while the phase does all the remembering.',
  });
  tl.tween(cam, CAM_NORM, { at: 26.9, dur: 1.5, ease: ease.move });
  tl.tween(normU, 1, { at: 27.7, dur: 1.1, ease: ease.draw });
  tl.tween(normTok, T, { at: 28.9, dur: 5.5, ease: ease.linear });
  tl.tween(spinTok, T, { at: 28.9, dur: 5.5, ease: ease.linear });
  tl.caption({
    at: 34.8,
    dur: 6.0,
    text: 'After two hundred steps the rotating state still has norm exactly one, and decoding its angle gives count three — the true answer is three. The decay baseline has shrunk to two thousandths, and decodes at chance.',
  });
  tl.tween(verdictU, 1, { at: 36.2, dur: 0.8, ease: ease.pop });
  tl.hold(41.0, 0.7);

  // Beat 4 — the SFDA form
  tl.caption({
    at: 41.7,
    dur: 6.4,
    text: 'Semidirect Fourier Delta Attention drops this rotation into the delta-rule recurrence itself: the decay becomes a magnitude times a phase, per channel, per token. Set the angles to zero and you get the previous chapter back, exactly.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.9, dur: 1.5, ease: ease.move });
  tl.tween(eqU, 1, { at: 43.1, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 48.5,
    dur: 5.8,
    text: 'One honest note: what you just watched is the paper’s constructed counter — a hand-built proof of expressivity at toy scale, not a trained language model. The claim is precise, and it is proved: rotations hold cyclic state that decay cannot.',
  });
  tl.hold(54.5, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 55.1,
    dur: 5.4,
    text: 'Decay forgets by shrinking. Phase remembers by turning. Giving the state both is what phase-controlled delta memory means.',
  });
  tl.tween(dimU, 1, { at: 55.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.3, dur: 0.9, ease: ease.enter });
  tl.hold(60.9, 1.2);

  return { tl, cam, titleU, circU, marksU, spinTok, eqU, normU, normTok, verdictU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/delta-phase-rotation/overrides.json',
  slug: 'delta-phase-rotation',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const circU = s.get(scene.circU);
  const marksU = s.get(scene.marksU);
  const spinTok = s.get(scene.spinTok);
  const eqU = s.get(scene.eqU);
  const normU = s.get(scene.normU);
  const normTok = s.get(scene.normTok);
  const verdictU = s.get(scene.verdictU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const ang = angleAt(spinTok);
  const px = CIRC_X + CIRC_R * Math.cos(-ang);
  const py = CIRC_Y + CIRC_R * Math.sin(-ang);
  const nTok = Math.max(0.5, normTok);
  const stepShown = Math.round(Math.min(T, spinTok));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the phase circle */}
          <g opacity={circU}>
            <circle cx={CIRC_X} cy={CIRC_Y} r={CIRC_R} fill="none" stroke={colors.GRID} strokeWidth={2} />
            <text x={CIRC_X} y={CIRC_Y - CIRC_R - 26} textAnchor="middle" fill={colors.TEXT} fontSize={17}>
              the counter lives on a circle
            </text>
            {/* five marks */}
            <g opacity={marksU}>
              {Array.from({ length: M }, (_, i) => {
                const a = (-2 * Math.PI * i) / M;
                const mx = CIRC_X + CIRC_R * Math.cos(a);
                const my = CIRC_Y + CIRC_R * Math.sin(a);
                return (
                  <g key={i}>
                    <circle cx={mx} cy={my} r={5} fill={colors.SECONDARY} />
                    <text
                      x={CIRC_X + (CIRC_R + 26) * Math.cos(a)}
                      y={CIRC_Y + (CIRC_R + 26) * Math.sin(a) + 5}
                      textAnchor="middle"
                      fill={colors.SECONDARY}
                      fontSize={15}
                      fontFamily="monospace"
                    >
                      {i}
                    </text>
                  </g>
                );
              })}
            </g>
            {/* state vector */}
            <line x1={CIRC_X} y1={CIRC_Y} x2={px} y2={py} stroke={colors.ACCENT} strokeWidth={3} />
            <circle cx={px} cy={py} r={9} fill={colors.ACCENT} />
            <text x={CIRC_X} y={CIRC_Y + CIRC_R + 44} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="monospace">
              step {stepShown} · count so far {PREFIX[Math.min(T, Math.max(0, stepShown))] % M}
            </text>
          </g>

          {/* norm plot */}
          {normU > 0 && (
            <g opacity={normU}>
              <text x={760} y={236} fill={colors.TEXT} fontSize={16}>
                state norm over 200 steps
              </text>
              <Axes x={NORM_X} y={NORM_Y} reveal={normU} xTicks={4} yTicks={2} xLabel="step" fontSize={10} />
              <FunctionPlot
                x={NORM_X}
                y={NORM_Y}
                f={() => 1}
                domain={[0, nTok]}
                samples={40}
                reveal={1}
                color={colors.ACCENT}
                width={2.6}
              />
              <FunctionPlot
                x={NORM_X}
                y={NORM_Y}
                f={(t) => Math.pow(ALPHA_BASE, t)}
                domain={[0, nTok]}
                samples={160}
                reveal={1}
                color={colors.NEGATIVE}
                width={2.2}
              />
              <text x={NORM_X(60)} y={NORM_Y(1) - 12} fill={colors.ACCENT} fontSize={13}>
                rotation — norm 1, forever
              </text>
              <text x={NORM_X(80)} y={NORM_Y(Math.pow(ALPHA_BASE, 80)) - 12} fill={colors.NEGATIVE} fontSize={13}>
                real decay α = 0.97
              </text>
              {verdictU > 0 && (
                <g opacity={verdictU}>
                  <rect x={780} y={580} width={400} height={44} rx={8} fill={colors.PANEL} stroke={colors.GRID} opacity={0.95} />
                  <text x={980} y={607} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily="monospace">
                    decoded {DECODED} = true {TRUE_COUNT} · norm {FINAL_NORM.toFixed(2)} vs {DECAY_NORM_END.toExponential(1)}
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Phase — rotations instead of decay
        </text>
        <text x={40} y={70} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
          arXiv:2607.11897 · SFDA
        </text>
      </g>
      <MathLabel
        tex="S_t = (I - \beta_t k_t k_t^{*})\,\Lambda_t S_{t-1} + \beta_t k_t v_t^{*},\quad \Lambda_t = \mathrm{diag}(\alpha_t \odot e^{i\theta_t})"
        x={640}
        y={110}
        fontSize={19}
        color={colors.SECONDARY}
        anchor="middle"
        opacity={eqU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={190} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Decay shrinks. Phase turns.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            A unit rotation holds cyclic state with no norm drift —
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            two hundred steps, decoded exactly; pure decay is at 0.002.
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
            Semidirect Fourier Delta Attention · arXiv:2607.11897
          </text>
        </g>
      )}
    </>
  );
}

export function DeltaPhaseRotation() {
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
