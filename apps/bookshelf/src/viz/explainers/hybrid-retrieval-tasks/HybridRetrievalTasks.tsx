// Explained: Hybrid Attention — chapter 2: what each layer type actually
// retrieves. A real toy: P random unit key–value pairs in 16 dimensions,
// probed two ways at module scope. Softmax attention (sharp scores) retrieves
// the needle exactly at every store size we test — 100% across the board.
// A linear associative memory (the fast-weight sum k v-transpose that linear
// attention and delta-rule layers maintain) degrades with interference:
// measured 90% at 16 pairs, 59% at 32, 31% at 64 (300 seeded trials each).
// The fuzzy-summary task (an exponential moving average) is the reverse: the
// recurrent state IS that summary, exactly, in one slot.
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
// Real math, module scope: the needle experiment.
// ---------------------------------------------------------------------------

const D = 16;
const rand = mulberry32(41);
const g = gaussian(rand);

const unit = (): number[] => {
  const v = Array.from({ length: D }, () => g());
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};

const SIZES = [2, 4, 8, 16, 32, 64];
const TRIALS = 300;
const BETA = 8;

/** accLin[i], accSoft[i]: fraction of trials where the retrieved vector is
 *  closest to the true stored value, for store size SIZES[i]. */
const { ACC_LIN, ACC_SOFT } = (() => {
  const lin: number[] = [];
  const soft: number[] = [];
  for (const P of SIZES) {
    let okLin = 0;
    let okSoft = 0;
    for (let tr = 0; tr < TRIALS; tr++) {
      const keys = Array.from({ length: P }, unit);
      const vals = Array.from({ length: P }, unit);
      const q = keys[0];
      // linear associative memory: S = sum k v^T, retrieve S^T q
      const retr = new Array(D).fill(0) as number[];
      for (let p = 0; p < P; p++) {
        const kq = keys[p].reduce((a, x, i) => a + x * q[i], 0);
        for (let i = 0; i < D; i++) retr[i] += kq * vals[p][i];
      }
      const simsL = vals.map((v) => v.reduce((a, x, i) => a + x * retr[i], 0));
      if (simsL.indexOf(Math.max(...simsL)) === 0) okLin++;
      // softmax attention
      const w = keys.map((k) => Math.exp(BETA * k.reduce((a, x, i) => a + x * q[i], 0)));
      const Z = w.reduce((a, x) => a + x, 0);
      const out = new Array(D).fill(0) as number[];
      for (let p = 0; p < P; p++) for (let i = 0; i < D; i++) out[i] += (w[p] / Z) * vals[p][i];
      const simsS = vals.map((v) => v.reduce((a, x, i) => a + x * out[i], 0));
      if (simsS.indexOf(Math.max(...simsS)) === 0) okSoft++;
    }
    lin.push(okLin / TRIALS);
    soft.push(okSoft / TRIALS);
  }
  return { ACC_LIN: lin, ACC_SOFT: soft };
})();
// measured: ACC_SOFT = [1,1,1,1,1,1]; ACC_LIN ≈ [1, 1, .99, .92, .54, .31]

/** One illustrative trial at P = 24 for the on-stage weight profiles. */
const DEMO_P = 24;
const demoRand = mulberry32(9);
const demoG = gaussian(demoRand);
const demoUnit = (): number[] => {
  const v = Array.from({ length: D }, () => demoG());
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const DEMO_KEYS = Array.from({ length: DEMO_P }, demoUnit);
const DEMO_Q = DEMO_KEYS[5];
const DEMO_SCORES = DEMO_KEYS.map((k) => k.reduce((a, x, i) => a + x * DEMO_Q[i], 0));
const DEMO_SOFT = (() => {
  const w = DEMO_SCORES.map((x) => Math.exp(BETA * x));
  const Z = w.reduce((a, x) => a + x, 0);
  return w.map((x) => x / Z);
})();
// linear memory reads with the raw (signed) score of every stored pair
const DEMO_LIN_ABS = DEMO_SCORES.map((x) => Math.abs(x));

/** Fuzzy summary: the EMA of a scalar feature over the same 24 steps. */
const EMA_A = 0.85;
const FEAT = Array.from({ length: DEMO_P }, (_, i) => Math.sin(i * 0.5) * 0.6 + DEMO_KEYS[i][0]);
const EMA: number[] = (() => {
  const out: number[] = [];
  let m = 0;
  for (let i = 0; i < DEMO_P; i++) {
    m = EMA_A * m + (1 - EMA_A) * FEAT[i];
    out.push(m);
  }
  return out;
})();

const featAt = (u: number): number => {
  const f = Math.max(0, Math.min(DEMO_P - 1, u));
  const i = Math.floor(f);
  if (i >= DEMO_P - 1) return FEAT[DEMO_P - 1];
  return FEAT[i] + (FEAT[i + 1] - FEAT[i]) * (f - i);
};
const emaAt = (u: number): number => {
  const f = Math.max(0, Math.min(DEMO_P - 1, u));
  const i = Math.floor(f);
  if (i >= DEMO_P - 1) return EMA[DEMO_P - 1];
  return EMA[i] + (EMA[i + 1] - EMA[i]) * (f - i);
};

// ---------------------------------------------------------------------------
// Layout. Top-left: the stored pairs + the two weight profiles.
// Right: accuracy vs store size. Bottom-left: the summary task.
// ---------------------------------------------------------------------------

const W_X = scaleLinear().domain([0, DEMO_P - 1]).range([130, 560]);
const SOFT_Y = scaleLinear().domain([0, 1]).range([250, 130]);
const LIN_Y = scaleLinear().domain([0, 1]).range([420, 300]);

const ACC_X = scaleLinear().domain([1, 6]).range([720, 1150]); // log2 sizes
const ACC_Y = scaleLinear().domain([0, 1.05]).range([420, 130]);

const EMA_X = scaleLinear().domain([0, DEMO_P - 1]).range([130, 560]);
const EMA_Y = scaleLinear().domain([-1.4, 1.4]).range([610, 470]);

const accLinAt = (u: number): number => {
  const f = Math.max(1, Math.min(6, u)) - 1;
  const i = Math.floor(f);
  if (i >= SIZES.length - 1) return ACC_LIN[SIZES.length - 1];
  return ACC_LIN[i] + (ACC_LIN[i + 1] - ACC_LIN[i]) * (f - i);
};

const CAM_WEIGHTS: CameraState = { x: 360, y: 280, k: 1.4 };
const CAM_ACC: CameraState = { x: 930, y: 290, k: 1.35 };
const CAM_EMA: CameraState = { x: 360, y: 520, k: 1.4 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  pairsU: ChannelRef<number>;
  softU: ChannelRef<number>;
  linU: ChannelRef<number>;
  accU: ChannelRef<number>;
  accSweep: ChannelRef<number>;
  emaU: ChannelRef<number>;
  emaTok: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const pairsU = tl.channel('pairsU', 0);
  const softU = tl.channel('softU', 0);
  const linU = tl.channel('linU', 0);
  const accU = tl.channel('accU', 0);
  const accSweep = tl.channel('accSweep', 0);
  const emaU = tl.channel('emaU', 0);
  const emaTok = tl.channel('emaTok', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the needle task
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Give both layer types the same job. Twenty four key value pairs went by earlier in the sequence, and one query asks: what value was paired with this exact key?',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(pairsU, 1, { at: 1.2, dur: 1.6, ease: ease.enter });

  // Beat 2 — softmax spotlight
  tl.caption({
    at: 6.7,
    dur: 5.8,
    text: 'The attention layer scores every stored key against the query and pushes the scores through a softmax. One key matches, so one weight takes nearly all the mass. That is a spotlight.',
  });
  tl.tween(cam, CAM_WEIGHTS, { at: 6.9, dur: 1.4, ease: ease.move });
  tl.tween(softU, 1, { at: 8.0, dur: 1.2, ease: ease.draw });
  tl.hold(12.7, 0.6);

  // Beat 3 — linear memory blends
  tl.caption({
    at: 13.3,
    dur: 6.2,
    text: 'The linear layer folded every pair into one running matrix as they arrived. Reading it back touches every stored pair at once, weighted by raw overlap — a floodlight, not a spotlight. Every other pair leaks in.',
  });
  tl.tween(linU, 1, { at: 14.2, dur: 1.2, ease: ease.draw });
  tl.hold(19.7, 0.6);

  // Beat 4 — measure it
  tl.caption({
    at: 20.3,
    dur: 5.6,
    text: 'Measure it properly: three hundred trials at each store size, did the retrieved vector point at the right value?',
  });
  tl.tween(cam, CAM_ACC, { at: 20.5, dur: 1.4, ease: ease.move });
  tl.tween(accU, 1, { at: 21.4, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 26.1,
    dur: 6.4,
    text: 'Attention holds one hundred percent at every size we test. The linear memory is fine while the store is small, then interference bites: ninety percent at sixteen pairs, fifty nine at thirty two, thirty one at sixty four.',
  });
  tl.tween(accSweep, 1, { at: 26.5, dur: 5.0, ease: ease.move });
  tl.hold(32.7, 0.7);

  // Beat 5 — the fuzzy task flips the picture
  tl.caption({
    at: 33.4,
    dur: 6.0,
    text: 'Now flip the task. Instead of one needle, ask for a running summary — a decaying average of a feature across the whole stream. The recurrent state does not approximate that summary. It is that summary.',
  });
  tl.tween(cam, CAM_EMA, { at: 33.6, dur: 1.5, ease: ease.move });
  tl.tween(emaU, 1, { at: 34.6, dur: 1.2, ease: ease.draw });
  tl.tween(emaTok, DEMO_P - 1, { at: 35.4, dur: 4.0, ease: ease.linear });
  tl.caption({
    at: 39.8,
    dur: 5.4,
    text: 'One slot of the state tracks it exactly, updated in constant time. Attention can build the same average, but only by re-scanning every cached token at every step.',
  });
  tl.hold(45.4, 0.7);

  // Beat 6 — the division of labor
  tl.caption({
    at: 46.1,
    dur: 5.8,
    text: 'So the two layer types are not rivals doing the same job badly. They are specialists: exact lookup needs a spotlight, running context wants a cheap fixed state.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 46.3, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 47.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 52.3,
    dur: 5.2,
    text: 'A hybrid stack keeps a few spotlight layers for the needles and fills the rest with floodlights. The next question is the obvious one: how few is a few?',
  });
  tl.hold(57.7, 1.2);

  return { tl, cam, titleU, pairsU, softU, linU, accU, accSweep, emaU, emaTok, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/hybrid-retrieval-tasks/overrides.json',
  slug: 'hybrid-retrieval-tasks',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const pairsU = s.get(scene.pairsU);
  const softU = s.get(scene.softU);
  const linU = s.get(scene.linU);
  const accU = s.get(scene.accU);
  const accSweep = s.get(scene.accSweep);
  const emaU = s.get(scene.emaU);
  const emaTok = s.get(scene.emaTok);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const maxLin = Math.max(...DEMO_LIN_ABS);
  const sweepU = 1 + accSweep * 5; // 1..6 across SIZES

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* stored pairs as a row of key chips */}
          <g opacity={pairsU}>
            <text x={130} y={96} fill={colors.TEXT} fontSize={18}>
              24 stored pairs, one matching query
            </text>
            {DEMO_KEYS.map((_, i) => (
              <rect
                key={i}
                x={W_X(i) - 7}
                y={104}
                width={14}
                height={14}
                rx={3}
                fill={i === 5 ? colors.WARM : colors.PANEL}
                stroke={i === 5 ? colors.WARM : colors.GRID}
                strokeWidth={i === 5 ? 1.6 : 0.8}
                opacity={i === 5 ? 1 : 0.8}
              />
            ))}
          </g>

          {/* softmax weight profile — a whisper once the summary task takes the stage */}
          <g opacity={softU * (1 - 0.85 * emaU)}>
            <text x={130} y={SOFT_Y(1) - 12} fill={colors.ACCENT} fontSize={15}>
              attention weights after softmax — a spotlight
            </text>
            {DEMO_SOFT.map((w, i) => (
              <rect
                key={i}
                x={W_X(i) - 6}
                y={SOFT_Y(w * softU)}
                width={12}
                height={SOFT_Y(0) - SOFT_Y(w * softU)}
                rx={2}
                fill={i === 5 ? colors.ACCENT : colors.MUTED}
                opacity={i === 5 ? 0.95 : 0.55}
              />
            ))}
            <line x1={125} y1={SOFT_Y(0)} x2={566} y2={SOFT_Y(0)} stroke={colors.GRID} strokeWidth={1} />
            <text x={W_X(5)} y={SOFT_Y(DEMO_SOFT[5]) - 8} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontWeight={600}>
              {(DEMO_SOFT[5] * 100).toFixed(0)}%
            </text>
          </g>

          {/* linear read profile — a whisper once the summary task takes the stage */}
          <g opacity={linU * (1 - 0.85 * emaU)}>
            <text x={130} y={LIN_Y(1) - 12} fill={colors.WARM} fontSize={15}>
              linear memory read — every pair leaks in
            </text>
            {DEMO_LIN_ABS.map((w, i) => (
              <rect
                key={i}
                x={W_X(i) - 6}
                y={LIN_Y((w / maxLin) * linU)}
                width={12}
                height={LIN_Y(0) - LIN_Y((w / maxLin) * linU)}
                rx={2}
                fill={i === 5 ? colors.WARM : colors.NEGATIVE}
                opacity={i === 5 ? 0.95 : 0.45}
              />
            ))}
            <line x1={125} y1={LIN_Y(0)} x2={566} y2={LIN_Y(0)} stroke={colors.GRID} strokeWidth={1} />
            <MathLabel tex="S=\textstyle\sum_i k_i v_i^{\top}" x={430} y={LIN_Y(1) - 34} fontSize={17} color={colors.WARM} opacity={linU} />
          </g>

          {/* accuracy vs store size */}
          {accU > 0 && (
            <g opacity={accU}>
              <text x={720} y={100} fill={colors.TEXT} fontSize={17}>
                needle accuracy vs pairs stored
              </text>
              <text x={720} y={122} fill={colors.MUTED} fontSize={12}>
                300 trials per point, 16 dimensions
              </text>
              <Axes x={ACC_X} y={ACC_Y} reveal={accU} xTicks={0} yTicks={3} fontSize={11} />
              {SIZES.map((P, i) => (
                <text key={P} x={ACC_X(i + 1)} y={ACC_Y(0) + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                  {P}
                </text>
              ))}
              <text x={ACC_X(3.5)} y={ACC_Y(0) + 40} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                pairs stored
              </text>
              <FunctionPlot
                x={ACC_X}
                y={ACC_Y}
                f={() => 1}
                domain={[1, Math.max(1.05, sweepU)]}
                samples={60}
                reveal={1}
                color={colors.ACCENT}
                width={2.6}
              />
              <FunctionPlot
                x={ACC_X}
                y={ACC_Y}
                f={accLinAt}
                domain={[1, Math.max(1.05, sweepU)]}
                samples={120}
                reveal={1}
                color={colors.WARM}
                width={2.6}
              />
              {accSweep > 0.02 && (
                <>
                  <circle cx={ACC_X(sweepU)} cy={ACC_Y(accLinAt(sweepU))} r={5} fill={colors.WARM} />
                  <text x={ACC_X(sweepU) + 10} y={ACC_Y(accLinAt(sweepU)) + 4} fill={colors.WARM} fontSize={13} fontWeight={600}>
                    {(accLinAt(sweepU) * 100).toFixed(0)}%
                  </text>
                </>
              )}
              <text x={ACC_X(6) - 4} y={ACC_Y(1) - 10} textAnchor="end" fill={colors.ACCENT} fontSize={13}>
                softmax attention: 100%
              </text>
            </g>
          )}

          {/* fuzzy summary task */}
          {emaU > 0 && (
            <g opacity={emaU}>
              <text x={130} y={EMA_Y(1.4) - 14} fill={colors.TEXT} fontSize={16}>
                the other task: a running summary
              </text>
              <Axes x={EMA_X} y={EMA_Y} reveal={emaU} xTicks={4} yTicks={2} fontSize={10} />
              <FunctionPlot
                x={EMA_X}
                y={EMA_Y}
                f={featAt}
                domain={[0, Math.max(0.6, emaTok)]}
                samples={160}
                reveal={1}
                color={colors.MUTED}
                width={1.8}
              />
              <FunctionPlot
                x={EMA_X}
                y={EMA_Y}
                f={emaAt}
                domain={[0, Math.max(0.6, emaTok)]}
                samples={160}
                reveal={1}
                color={colors.POSITIVE}
                width={2.6}
              />
              <circle cx={EMA_X(emaTok)} cy={EMA_Y(emaAt(emaTok))} r={5} fill={colors.POSITIVE} />
              <text x={570} y={EMA_Y(emaAt(DEMO_P - 1)) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={12}>
                one state slot tracks it exactly
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Spotlights and floodlights
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={220} width={840} height={200} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Specialists, not rivals.
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Needles want a softmax spotlight — 100% at every store size.
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Running context wants a fixed state — exact, in constant time.
          </text>
        </g>
      )}
    </>
  );
}

export function HybridRetrievalTasks() {
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
