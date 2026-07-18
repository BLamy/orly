// Explained: Long Context — chapter 4: context rot. A toy needle test,
// actually run at module scope: a 100-token document, one needle fact at
// depth p, 99 distractors. Every token's retrieval score carries the
// positional biases long-context models exhibit — a primacy bump at the
// start (the sink chapter) and a recency bump at the end — plus seeded noise.
// 500 trials per depth. The measured curve is the reported U-shape: 98%
// recall with the needle at the very start (96% at the end), 76% at depth
// ten, and 31% with the needle buried mid-document. The toy reproduces the
// "lost in the middle" shape honestly — it is labeled as a toy on stage.
// (The durable-evals book on this shelf runs this same needle idea as an
// evaluation harness.)
import { scaleLinear } from 'd3';
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
  gaussian,
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
// Real toy, module scope.
// ---------------------------------------------------------------------------

const T = 100;
const TRIALS = 500;
const S0 = 1.5; // the needle's true relevance edge
const SIG = 0.55; // distractor noise
const AMP = 0.7; // positional bias amplitude
const TAU = 12;

const rand = mulberry32(31);
const g = gaussian(rand);

const bias = (i: number): number =>
  AMP * Math.exp(-i / TAU) + AMP * Math.exp(-(T - 1 - i) / TAU);

const accAtDepth = (p: number): number => {
  let ok = 0;
  for (let tr = 0; tr < TRIALS; tr++) {
    const needle = S0 + bias(p);
    let isBest = true;
    for (let i = 0; i < T; i++) {
      if (i === p) continue;
      if (g() * SIG + bias(i) >= needle) isBest = false;
    }
    if (isBest) ok++;
  }
  return ok / TRIALS;
};

const DEPTHS: number[] = [0, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 85, 90, 95, 99];
const ACC: number[] = DEPTHS.map(accAtDepth);
// measured (seed 31): [.98, .89, .76, .63, .54, .41, .34, .31, .36, .40, .55, .67, .77, .92, .96]

const accAt = (depth: number): number => {
  const d = Math.max(0, Math.min(99, depth));
  let i = 0;
  while (i < DEPTHS.length - 2 && DEPTHS[i + 1] < d) i++;
  const d0 = DEPTHS[i];
  const d1 = DEPTHS[i + 1];
  const u = (d - d0) / (d1 - d0);
  return ACC[i] + (ACC[i + 1] - ACC[i]) * Math.max(0, Math.min(1, u));
};

// ---------------------------------------------------------------------------
// Layout. Top: the document strip with the needle marker (persistent).
// Middle: the positional-bias profile. Bottom: the measured U-curve.
// ---------------------------------------------------------------------------

const DOC_X = scaleLinear().domain([0, 99]).range([160, 1120]);
const DOC_Y = 170;
const DOC_H = 40;

const BIAS_Y = scaleLinear().domain([0, 1.5]).range([340, 250]);

const ACC_Y = scaleLinear().domain([0, 1.05]).range([600, 400]);

const CAM_DOC: CameraState = { x: 640, y: 210, k: 1.3 };
const CAM_CURVE: CameraState = { x: 640, y: 470, k: 1.25 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  docU: ChannelRef<number>;
  needle: ChannelRef<number>; // needle depth 0..99
  biasU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  sweep: ChannelRef<number>; // draws the curve as the needle sweeps
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const docU = tl.channel('docU', 0);
  const needle = tl.channel('needle', 0);
  const biasU = tl.channel('biasU', 0);
  const curveU = tl.channel('curveU', 0);
  const sweep = tl.channel('sweep', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the test
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A long context window is a promise: put a fact anywhere in here and I will find it. The classic way to audit that promise is a needle test — hide one fact in a document and ask for it back.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_DOC, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(docU, 1, { at: 1.4, dur: 1.4, ease: ease.enter });
  tl.hold(6.1, 0.5);

  // Beat 2 — the biases
  tl.caption({
    at: 6.6,
    dur: 6.0,
    text: 'Here is a hundred-token toy of that game, built from the biases the previous chapters measured: retrieval scores get a bump near the start of the document and another near the end, with noisy distractors everywhere.',
  });
  tl.tween(biasU, 1, { at: 7.4, dur: 1.3, ease: ease.draw });
  tl.hold(12.9, 0.6);

  // Beat 3 — sweep the needle, measure
  tl.caption({
    at: 13.5,
    dur: 5.8,
    text: 'Now run it properly: five hundred trials at every depth, sliding the needle from the first token to the last, counting how often the needle outscores all ninety nine distractors.',
  });
  tl.tween(cam, CAM_CURVE, { at: 13.7, dur: 1.5, ease: ease.move });
  tl.tween(curveU, 1, { at: 14.7, dur: 1.0, ease: ease.draw });
  tl.tween(needle, 99, { at: 15.9, dur: 8.0, ease: ease.linear });
  tl.tween(sweep, 1, { at: 15.9, dur: 8.0, ease: ease.linear });
  tl.caption({
    at: 19.7,
    dur: 5.4,
    text: 'The shape that emerges is the one long-context papers keep reporting: a U. Ninety eight percent recall at the very start. Seventy six a tenth of the way in. Thirty one percent at the bottom of the middle.',
  });
  tl.hold(25.4, 0.7);

  // Beat 4 — what the U means
  tl.caption({
    at: 26.1,
    dur: 6.0,
    text: 'And then the climb back: the last stretch of the document recovers to ninety six, riding the recency bump. Context does not fail at a hard wall — it rots quietly in the middle, where neither bias helps.',
  });
  tl.hold(32.4, 0.6);

  tl.caption({
    at: 33.0,
    dur: 5.6,
    text: 'The practical readings: a million-token window is not a million tokens of equal memory; where you place the critical fact matters as much as whether it fits. Retrieval-augmented systems exploit exactly this.',
  });
  tl.hold(38.9, 0.6);

  // Beat 5 — close + bridge
  tl.caption({
    at: 39.5,
    dur: 5.6,
    text: 'If you want this game run as a real evaluation harness — with confidence intervals and regressions over time — the durable evals book on this shelf does exactly that. Here, one question remains: what does all this context cost?',
  });
  tl.tween(cam, CAMERA_HOME, { at: 39.7, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 40.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.0, dur: 0.9, ease: ease.enter });
  tl.hold(45.3, 1.2);

  return { tl, cam, titleU, docU, needle, biasU, curveU, sweep, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/context-rot/overrides.json',
  slug: 'context-rot',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const docU = s.get(scene.docU);
  const needle = s.get(scene.needle);
  const biasU = s.get(scene.biasU);
  const curveU = s.get(scene.curveU);
  const sweep = s.get(scene.sweep);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const sweepDepth = sweep * 99;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* document strip */}
          <g opacity={docU}>
            <text x={160} y={DOC_Y - 26} fill={colors.TEXT} fontSize={17}>
              a 100-token document, one needle — a toy, run for real
            </text>
            {Array.from({ length: T }, (_, i) => (
              <rect
                key={i}
                x={DOC_X(i) - 4}
                y={DOC_Y}
                width={8}
                height={DOC_H}
                rx={2}
                fill={colors.PANEL}
                opacity={0.35 + 0.4 * bias(i)}
                stroke={colors.GRID}
                strokeWidth={0.4}
              />
            ))}
            {/* the needle */}
            <rect x={DOC_X(needle) - 5} y={DOC_Y - 8} width={10} height={DOC_H + 16} rx={3} fill={colors.WARM} />
            <text x={DOC_X(needle)} y={DOC_Y - 16} textAnchor="middle" fill={colors.WARM} fontSize={12} fontWeight={600}>
              needle
            </text>
            <text x={160} y={DOC_Y + DOC_H + 24} fill={colors.MUTED} fontSize={12}>
              depth 0
            </text>
            <text x={1120} y={DOC_Y + DOC_H + 24} textAnchor="end" fill={colors.MUTED} fontSize={12}>
              depth 99
            </text>
          </g>

          {/* positional bias profile */}
          {biasU > 0 && (
            <g opacity={biasU * (1 - 0.6 * curveU)}>
              <FunctionPlot
                x={DOC_X}
                y={BIAS_Y}
                f={bias}
                domain={[0, 99]}
                samples={200}
                reveal={biasU}
                color={colors.SECONDARY}
                width={2.2}
              />
              <text x={200} y={BIAS_Y(bias(0)) - 10} fill={colors.SECONDARY} fontSize={12}>
                primacy bump
              </text>
              <text x={1080} y={BIAS_Y(bias(99)) - 10} textAnchor="end" fill={colors.SECONDARY} fontSize={12}>
                recency bump
              </text>
            </g>
          )}

          {/* the measured U-curve */}
          {curveU > 0 && (
            <g opacity={curveU}>
              <text x={160} y={ACC_Y(1.05) - 14} fill={colors.TEXT} fontSize={16}>
                needle recall vs depth — 500 trials per point
              </text>
              <Axes x={DOC_X} y={ACC_Y} reveal={curveU} xTicks={5} yTicks={3} xLabel="needle depth" fontSize={11} />
              <FunctionPlot
                x={DOC_X}
                y={ACC_Y}
                f={accAt}
                domain={[0, Math.max(0.6, sweepDepth)]}
                samples={220}
                reveal={1}
                color={colors.WARM}
                width={2.8}
              />
              {sweep > 0.02 && (
                <>
                  <circle cx={DOC_X(sweepDepth)} cy={ACC_Y(accAt(sweepDepth))} r={5} fill={colors.WARM} />
                  <text
                    x={sweepDepth > 80 ? DOC_X(sweepDepth) - 10 : DOC_X(sweepDepth) + 10}
                    textAnchor={sweepDepth > 80 ? 'end' : 'start'}
                    y={ACC_Y(accAt(sweepDepth)) - 10}
                    fill={colors.WARM}
                    fontSize={13}
                    fontWeight={600}
                  >
                    {(accAt(sweepDepth) * 100).toFixed(0)}%
                  </text>
                </>
              )}
              {sweep > 0.9 && (
                <text x={DOC_X(50)} y={ACC_Y(accAt(50)) + 26} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} opacity={(sweep - 0.9) / 0.1}>
                  lost in the middle
                </text>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Context rot
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={220} width={840} height={200} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            The window is not flat.
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            98% at the edges, 31% in the middle — measured, 500 trials a point.
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Placement is part of the prompt.
          </text>
        </g>
      )}
    </>
  );
}

export function ContextRot() {
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
