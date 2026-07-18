// arXiv:2607.13491 — DeepLoop, chapter 5: depth as compute, revisited.
// Looping is a run-time dial: parameters stay fixed while unrolled depth
// grows. The refinement curve is genuinely computed: a single tied update
// x <- x - 0.3 (x² - 2) hunting the square root of two, error per visit on a
// log axis, from 0.586 down to ~2.7e-8 after eight visits. Bridges (without
// re-teaching) to test-time compute and to fixed-state recurrent models.
import { scaleLinear, scaleLog } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import { Axes } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real math, module scope: a tied block as a fixed-point solver.
// ---------------------------------------------------------------------------

const VISITS = 8;
/** |x_r − √2| for x <- x − 0.3(x² − 2), x_0 = 2. Computed. */
const ERRS: number[] = (() => {
  let x = 2.0;
  const out = [Math.abs(x - Math.SQRT2)];
  for (let r = 0; r < VISITS; r++) {
    x = x - 0.3 * (x * x - 2);
    out.push(Math.abs(x - Math.SQRT2));
  }
  return out;
})();
// ERRS[0] ≈ 0.586, ERRS[8] ≈ 2.7e-8.

const XPOS: number[] = (() => {
  let x = 2.0;
  const out = [x];
  for (let r = 0; r < VISITS; r++) {
    x = x - 0.3 * (x * x - 2);
    out.push(x);
  }
  return out;
})();

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

// Left: the two bars — parameters (flat) vs unrolled depth (dial).
const DIAL_X = 130;
const DIAL_Y = 210;
const DIAL_W = 360;

// Right: log-error plot.
const ERR_X = scaleLinear().domain([0, VISITS]).range([680, 1150]);
const ERR_Y = scaleLog().domain([1e-8, 1]).range([580, 300]);

// Number line for the solver, above the plot.
const NL_X = scaleLinear().domain([1.2, 2.1]).range([680, 1150]);
const NL_Y = 220;

const CAM_DIAL: CameraState = { x: 340, y: 330, k: 1.3 };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  dialU: ChannelRef<number>;
  rDial: ChannelRef<number>;
  solveU: ChannelRef<number>;
  solveTok: ChannelRef<number>;
  bridgeT: ChannelRef<number>;
  bridgeS: ChannelRef<number>;
  midU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const dialU = tl.channel('dialU', 0);
  const rDial = tl.channel('rDial', 1); // loop-count dial 1..8
  const solveU = tl.channel('solveU', 0);
  const solveTok = tl.channel('solveTok', 0); // solver visits 0..8
  const bridgeT = tl.channel('bridgeT', 0); // test-time bridge chip
  const bridgeS = tl.channel('bridgeS', 0); // fixed-state bridge chip
  const midU = tl.channel('midU', 0); // "sits between" line
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the dial
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Step back, and the loop is really a dial. The parameters stay fixed. You choose at run time how deep the computation goes.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_DIAL, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(dialU, 1, { at: 1.0, dur: 1.0, ease: ease.draw });
  tl.tween(rDial, 8, { at: 2.4, dur: 3.4, ease: ease.move });
  tl.hold(6.1, 0.6);

  // Beat 2 — iteration buys precision (computed)
  tl.caption({
    at: 6.7,
    dur: 6.4,
    text: 'And iteration genuinely buys precision. Here a single tied update hunts the square root of two. Watch the error on a logarithmic axis as the visits tick by.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 6.9, dur: 1.4, ease: ease.move });
  tl.tween(solveU, 1, { at: 7.9, dur: 1.1, ease: ease.draw });
  tl.tween(solveTok, VISITS, { at: 9.4, dur: 5.6, ease: ease.linear });
  tl.caption({
    at: 13.5,
    dur: 5.8,
    text: 'Every visit runs the same rule, and the error collapses from around point six to a few parts in a hundred million after eight visits. Depth did that — not new weights.',
  });
  tl.hold(19.5, 0.7);

  // Beat 3 — the two bridges
  tl.caption({
    at: 20.2,
    dur: 5.8,
    text: 'That is the same trade the reasoning models make: spend more compute at test time to earn more accuracy, without touching a single weight.',
  });
  tl.tween(bridgeT, 1, { at: 20.8, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 26.4,
    dur: 5.6,
    text: 'Recurrent state machines make the mirror-image trade: a fixed-size state, updated in place by the same rule, carrying the whole history.',
  });
  tl.tween(bridgeS, 1, { at: 27.0, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 32.4,
    dur: 6.0,
    text: 'Looped transformers sit between the two: attention keeps its exact memory, recurrence lends its parameter thrift — but only if training survives the revisits.',
  });
  tl.tween(midU, 1, { at: 33.2, dur: 0.9, ease: ease.enter });
  tl.hold(38.6, 0.7);

  // Beat 4 — close
  tl.caption({
    at: 39.3,
    dur: 6.0,
    text: 'That is what Deep Loop supplies. Count depth as visits, anchor the residual by the square root of the unrolled depth, and the dial turns safely.',
  });
  tl.tween(dimU, 1, { at: 39.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 40.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 45.7,
    dur: 5.4,
    text: 'Depth is not how many weights you own. It is how many times the signal gets transformed.',
  });
  tl.hold(51.3, 1.2);

  return { tl, cam, titleU, dialU, rDial, solveU, solveTok, bridgeT, bridgeS, midU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/loop-as-compute/overrides.json',
  slug: 'loop-as-compute',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const dialU = s.get(scene.dialU);
  const rDial = s.get(scene.rDial);
  const solveU = s.get(scene.solveU);
  const solveTok = s.get(scene.solveTok);
  const bridgeT = s.get(scene.bridgeT);
  const bridgeS = s.get(scene.bridgeS);
  const midU = s.get(scene.midU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const R = Math.round(rDial);
  const kShown = Math.min(VISITS, solveTok);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the dial: params flat, unrolled depth grows */}
          <g opacity={dialU}>
            <text x={DIAL_X} y={DIAL_Y - 36} fill={colors.TEXT} fontSize={19}>
              the run-time dial
            </text>
            <text x={DIAL_X} y={DIAL_Y + 6} fill={colors.MUTED} fontSize={14}>
              loops R = {R}
            </text>
            {/* dial track */}
            <rect x={DIAL_X + 110} y={DIAL_Y - 6} width={DIAL_W - 110} height={10} rx={5} fill={colors.GRID} />
            <circle cx={DIAL_X + 110 + ((rDial - 1) / 7) * (DIAL_W - 110)} cy={DIAL_Y - 1} r={10} fill={colors.WARM} />
            {/* parameters bar (flat) */}
            <text x={DIAL_X} y={DIAL_Y + 66} fill={colors.MUTED} fontSize={14}>
              parameters
            </text>
            <rect x={DIAL_X + 130} y={DIAL_Y + 52} width={90} height={18} rx={4} fill={colors.ACCENT} opacity={0.75} />
            <text x={DIAL_X + 228} y={DIAL_Y + 66} fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
              M blocks — fixed
            </text>
            {/* unrolled depth bar (grows with dial) */}
            <text x={DIAL_X} y={DIAL_Y + 106} fill={colors.MUTED} fontSize={14}>
              unrolled depth
            </text>
            <rect x={DIAL_X + 130} y={DIAL_Y + 92} width={(90 / 4) * (rDial * 1)} height={18} rx={4} fill={colors.POSITIVE} opacity={0.85} />
            <text x={DIAL_X + 140 + (90 / 4) * rDial} y={DIAL_Y + 106} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
              N = M·{R}
            </text>
          </g>
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Depth you can dial
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          depth as compute, revisited
        </text>
      </g>

      {/* right: the solver, computed */}
      <g opacity={solveU * mainOp}>
        <text x={680} y={168} fill={colors.TEXT} fontSize={15}>
          one tied rule, visited eight times (computed)
        </text>
        <MathLabel
          tex="x \leftarrow x - 0.3\,(x^2 - 2)"
          x={1150}
          y={162}
          fontSize={18}
          color={colors.SECONDARY}
          anchor="end"
        />
        {/* number line of iterates */}
        <line x1={NL_X(1.2)} y1={NL_Y} x2={NL_X(2.1)} y2={NL_Y} stroke={colors.GRID} strokeWidth={1.5} />
        <line x1={NL_X(Math.SQRT2)} y1={NL_Y - 12} x2={NL_X(Math.SQRT2)} y2={NL_Y + 12} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={NL_X(Math.SQRT2)} y={NL_Y + 30} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
          √2
        </text>
        {XPOS.map((x, i) => {
          const u = clamp01(solveTok - i + 1);
          if (i > 0 && u <= 0) return null;
          return (
            <circle key={i} cx={NL_X(x)} cy={NL_Y} r={i === 0 ? 6 : 4.5} fill={i === 0 ? colors.WARM : colors.ACCENT} opacity={i === 0 ? 1 : u} />
          );
        })}
        {/* log-error plot */}
        <Axes x={ERR_X} y={ERR_Y} reveal={solveU} xTicks={4} yTicks={4} xLabel="visits" fontSize={11} />
        <text x={680} y={290} fill={colors.MUTED} fontSize={12}>
          error vs the true square root — log scale
        </text>
        <path
          d={ERRS.slice(0, Math.max(1, Math.ceil(kShown) + 1))
            .map((e, i) => `${i === 0 ? 'M' : 'L'} ${ERR_X(i)} ${ERR_Y(Math.max(1e-8, e))}`)
            .join(' ')}
          fill="none"
          stroke={colors.ACCENT}
          strokeWidth={2.6}
        />
        {ERRS.map((e, i) => {
          const u = clamp01(solveTok - i + 1);
          if (u <= 0) return null;
          return <circle key={i} cx={ERR_X(i)} cy={ERR_Y(Math.max(1e-8, e))} r={3.5} fill={colors.ACCENT} opacity={u} />;
        })}
        {kShown >= VISITS - 0.02 && (
          <text x={ERR_X(VISITS)} y={ERR_Y(Math.max(1e-8, ERRS[VISITS])) - 12} textAnchor="end" fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
            {ERRS[VISITS].toExponential(1)}
          </text>
        )}
      </g>

      {/* bridges */}
      <g opacity={mainOp}>
        <g opacity={bridgeT}>
          <rect x={110} y={430} width={410} height={54} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeOpacity={0.6} />
          <text x={130} y={452} fill={colors.SECONDARY} fontSize={13} fontWeight={600}>
            test-time compute
          </text>
          <text x={130} y={472} fill={colors.MUTED} fontSize={12}>
            more thinking per answer, same weights
          </text>
        </g>
        <g opacity={bridgeS}>
          <rect x={110} y={498} width={410} height={54} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeOpacity={0.6} />
          <text x={130} y={520} fill={colors.SECONDARY} fontSize={13} fontWeight={600}>
            fixed-state recurrence
          </text>
          <text x={130} y={540} fill={colors.MUTED} fontSize={12}>
            one state, one rule, updated in place
          </text>
        </g>
        <g opacity={midU}>
          <text x={110} y={588} fill={colors.WARM} fontSize={14}>
            looped transformers sit between the two — if training survives the revisits
          </text>
        </g>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={190} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Depth is how many times the signal is transformed —
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            not how many weights you own.
          </text>
          <text x={640} y={392} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
            The Loop That Went Deep · arXiv:2607.13491
          </text>
        </g>
      )}
    </>
  );
}

export function LoopAsCompute() {
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
