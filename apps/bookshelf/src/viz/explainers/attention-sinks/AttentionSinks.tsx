// Explained: Long Context — chapter 3: attention sinks. The reported
// phenomenon (streaming-attention line of work): trained transformers park a
// large share of attention on the first few tokens in most deep layers,
// regardless of content — shown here as a clearly-labeled schematic replot.
// The toy demo is computed at module scope: 40 tokens with weak content
// logits (seeded normal, scale 0.5) plus one learned sink logit of 3.5 →
// softmax puts 43.5% of the mass on the sink. Evicting the sink token (what
// a naive sliding window does first) and renormalizing swings the attention
// output vector by 99% of its own length — the measured reason streaming
// with a plain window falls apart, and why keeping a few permanent sink
// tokens fixes it.
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
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real toy, module scope.
// ---------------------------------------------------------------------------

const T = 40;
const DV = 8;
const rand = mulberry32(23);
const g = gaussian(rand);

const LOGITS: number[] = Array.from({ length: T }, () => g() * 0.5);
LOGITS[0] = 3.5; // the sink

const EXPW = LOGITS.map((x) => Math.exp(x));
const Z = EXPW.reduce((a, x) => a + x, 0);
const W_FULL = EXPW.map((x) => x / Z);
const SINK_MASS = W_FULL[0]; // 0.435

const unit = (): number[] => {
  const v = Array.from({ length: DV }, () => g());
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const VALS = Array.from({ length: T }, unit);

const OUT_FULL: number[] = (() => {
  const o = new Array(DV).fill(0) as number[];
  for (let t = 0; t < T; t++) for (let i = 0; i < DV; i++) o[i] += W_FULL[t] * VALS[t][i];
  return o;
})();
const Z2 = Z - EXPW[0];
const W_EVICT = EXPW.map((x, i) => (i === 0 ? 0 : x / Z2));
const OUT_EVICT: number[] = (() => {
  const o = new Array(DV).fill(0) as number[];
  for (let t = 1; t < T; t++) for (let i = 0; i < DV; i++) o[i] += W_EVICT[t] * VALS[t][i];
  return o;
})();
const OUT_NORM = Math.hypot(...OUT_FULL); // 0.445
const SHIFT = Math.hypot(...OUT_FULL.map((x, i) => x - OUT_EVICT[i])); // 0.443
const SHIFT_PCT = (SHIFT / OUT_NORM) * 100; // ≈ 99%
// One share, used on stage and in the narration: 43.5% reads as "forty three".
const SINK_PCT = Math.floor(SINK_MASS * 100); // 43

/** Exact 2-D plane of the two output vectors: the full output lies on the
 *  x-axis and the evicted output sits in that same plane, so the drawn arrows
 *  keep their true length and angle (the shift arrow is the real 99%). */
const VEC_LEN = 230;
const VEC_S = VEC_LEN / OUT_NORM;
const EVICT_DOT = OUT_EVICT.reduce((a, x, i) => a + x * OUT_FULL[i], 0) / OUT_NORM;
const EVICT_PERP = Math.sqrt(Math.max(0, Math.hypot(...OUT_EVICT) ** 2 - EVICT_DOT ** 2));
const OUT_A = { x: VEC_LEN, y: 0 };
const OUT_B = { x: EVICT_DOT * VEC_S, y: -EVICT_PERP * VEC_S };

/** Schematic of the reported pattern (labeled as such on stage): share of
 *  attention on the first 4 tokens, shallow → deep layers. */
const REPORTED_LAYERS = [0.09, 0.18, 0.55, 0.68, 0.74, 0.71, 0.78, 0.75];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const ROW_X0 = 140;
const ROW_Y = 300;
const ROW_W = 24;
const BAR_MAX = 150;

// The softmax budget bar: full row width, sitting under the token bars.
const BUD_Y = 430;
const BUD_W = ROW_W * T;

const VEC_CX = 860;
const VEC_CY = 470;

const REP_X0 = 820;
const REP_Y0 = 150;
const REP_H = 220;
const REP_BAR_W = 34;

const CAM_ROW: CameraState = { x: 600, y: 330, k: 1.1 };
const CAM_REP: CameraState = { x: 988, y: 264, k: 1.35 };
const CAM_VEC: CameraState = { x: 900, y: 470, k: 1.35 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  repU: ChannelRef<number>;
  rowU: ChannelRef<number>;
  sinkU: ChannelRef<number>;
  evictU: ChannelRef<number>; // 0 full · 1 sink evicted
  vecU: ChannelRef<number>;
  fixU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const repU = tl.channel('repU', 0);
  const rowU = tl.channel('rowU', 0);
  const sinkU = tl.channel('sinkU', 0);
  const evictU = tl.channel('evictU', 0);
  const vecU = tl.channel('vecU', 0);
  const fixU = tl.channel('fixU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the reported phenomenon
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Stare at the attention maps of a trained transformer and a strange pattern shows up: in most of the deeper layers, a huge share of attention lands on the very first tokens — whatever those tokens are.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_REP, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(repU, 1, { at: 1.6, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 4.6,
    text: 'The streaming attention papers measured it layer by layer; this replot is a schematic of that reported shape. The first tokens act as a sink.',
  });
  tl.hold(11.5, 0.6);

  // Beat 2 — why: softmax must spend its mass
  tl.caption({
    at: 12.1,
    dur: 6.0,
    text: 'Why would a model do that? Because softmax is a budget: the weights must sum to one. When no token deserves attention, the mass still has to go somewhere — so training parks it on a token that is always there.',
  });
  tl.tween(cam, CAM_ROW, { at: 12.3, dur: 1.5, ease: ease.move });
  tl.tween(rowU, 1, { at: 13.3, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 18.4,
    dur: 5.6,
    text: 'Here is the toy version: forty tokens with weak, noisy scores, and one learned sink logit at the front. Softmax hands the sink forty three percent of the entire budget.',
  });
  tl.tween(sinkU, 1, { at: 19.2, dur: 1.0, ease: ease.pop });
  tl.hold(24.3, 0.6);

  // Beat 3 — streaming evicts the sink
  tl.caption({
    at: 24.9,
    dur: 5.8,
    text: 'Now stream. A sliding window keeps the newest tokens and drops the oldest — and the very first thing it drops is the sink. Watch the freed mass spray across thirty nine tokens that never deserved it.',
  });
  tl.tween(evictU, 1, { at: 26.2, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 31.0,
    dur: 5.8,
    text: 'Measure the damage on the layer output. Renormalizing without the sink swings the output vector by ninety nine percent of its own length. Every downstream layer now reads a vector it has never seen.',
  });
  tl.tween(cam, CAM_VEC, { at: 31.2, dur: 1.5, ease: ease.move });
  tl.tween(vecU, 1, { at: 32.2, dur: 1.2, ease: ease.draw });
  tl.hold(37.1, 0.6);

  // Beat 4 — the fix
  tl.caption({
    at: 37.7,
    dur: 5.8,
    text: 'The fix costs four slots: pin the first few tokens in the cache forever, and slide the window over everything else. The sink keeps absorbing its share, and the output barely moves.',
  });
  tl.tween(cam, CAM_ROW, { at: 37.9, dur: 1.5, ease: ease.move });
  tl.tween(evictU, 0, { at: 38.7, dur: 1.2, ease: ease.move });
  tl.tween(fixU, 1, { at: 39.5, dur: 1.0, ease: ease.enter });
  tl.hold(43.7, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 44.3,
    dur: 5.8,
    text: 'Attention sinks are a warning label for anyone who edits a cache: some entries matter not for what they say, but for the mass they quietly absorb. Next, what actually happens to retrieval as documents get deep.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 44.5, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 45.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 46.8, dur: 0.9, ease: ease.enter });
  tl.hold(50.3, 1.2);

  return { tl, cam, titleU, repU, rowU, sinkU, evictU, vecU, fixU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/attention-sinks/overrides.json',
  slug: 'attention-sinks',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const repU = s.get(scene.repU);
  const rowU = s.get(scene.rowU);
  const sinkU = s.get(scene.sinkU);
  const evictU = s.get(scene.evictU);
  const vecU = s.get(scene.vecU);
  const fixU = s.get(scene.fixU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - dimU;
  // the output vector's arrows stay the subject while the row steps back
  const rowOp = rowU * (1 - 0.8 * vecU * (1 - fixU));
  // the row's headline text steps back with it while the vector is in view
  const rowTextOp = 1 - vecU * (1 - fixU);
  // the budget bar's sink share grows in, then sprays out on eviction
  const sinkW = BUD_W * SINK_MASS * sinkU * (1 - evictU);
  // blended weights between full and evicted
  const wAt = (i: number): number => W_FULL[i] + (W_EVICT[i] - W_FULL[i]) * evictU;
  const vx = OUT_A.x + (OUT_B.x - OUT_A.x) * evictU;
  const vy = OUT_A.y + (OUT_B.y - OUT_A.y) * evictU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the reported pattern, labeled schematic */}
          <g opacity={repU * (1 - rowU)}>
            <text x={REP_X0} y={REP_Y0 - 34} fill={colors.TEXT} fontSize={16}>
              attention mass on the first 4 tokens
            </text>
            <text x={REP_X0} y={REP_Y0 - 12} fill={colors.MUTED} fontSize={14}>
              schematic replot of the reported pattern
            </text>
            {REPORTED_LAYERS.map((v, i) => (
              <g key={i}>
                <rect
                  x={REP_X0 + i * (REP_BAR_W + 8)}
                  y={REP_Y0 + REP_H * (1 - v)}
                  width={REP_BAR_W}
                  height={REP_H * v}
                  rx={3}
                  fill={colors.SECONDARY}
                  opacity={0.85}
                />
                <text x={REP_X0 + i * (REP_BAR_W + 8) + REP_BAR_W / 2} y={REP_Y0 + REP_H + 18} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                  L{i + 1}
                </text>
              </g>
            ))}
            <text x={REP_X0} y={REP_Y0 + REP_H + 44} fill={colors.MUTED} fontSize={14}>
              shallow → deep layers
            </text>
          </g>

          {/* the toy token row */}
          <g opacity={rowOp}>
            <text x={ROW_X0} y={ROW_Y - BAR_MAX - 28} fill={colors.TEXT} fontSize={17} opacity={rowTextOp}>
              40 tokens, weak scores — one learned sink
            </text>
            {W_FULL.map((_, i) => {
              const w = wAt(i);
              const h = Math.max(1, w * BAR_MAX * 2.2);
              const isSink = i === 0;
              const gone = isSink && evictU > 0.5;
              return (
                <g key={i}>
                  <rect
                    x={ROW_X0 + i * ROW_W}
                    y={ROW_Y - h}
                    width={ROW_W - 5}
                    height={h}
                    rx={2}
                    fill={isSink ? colors.WARM : colors.ACCENT}
                    opacity={gone ? 0.15 : isSink ? 0.5 + 0.5 * sinkU : 0.7}
                  />
                  <rect
                    x={ROW_X0 + i * ROW_W}
                    y={ROW_Y + 8}
                    width={ROW_W - 5}
                    height={14}
                    rx={2}
                    fill={gone ? colors.NEGATIVE : colors.PANEL}
                    opacity={gone ? 0.5 : 0.8}
                    stroke={isSink && fixU > 0 ? colors.POSITIVE : colors.GRID}
                    strokeWidth={isSink && fixU > 0 ? 1.8 : 0.6}
                  />
                </g>
              );
            })}
            {sinkU > 0 && evictU < 0.5 && (
              <text x={ROW_X0} y={ROW_Y - BAR_MAX * 2.2 * W_FULL[0] - 12} fill={colors.WARM} fontSize={14} fontWeight={600} opacity={sinkU}>
                sink: {SINK_PCT}% of all attention
              </text>
            )}
            {evictU > 0.5 && (
              <text x={ROW_X0} y={ROW_Y - 96} fill={colors.NEGATIVE} fontSize={14} fontWeight={600} opacity={evictU * rowTextOp}>
                sink evicted — its {SINK_PCT}% sprays everywhere
              </text>
            )}
            {fixU > 0 && (
              <text x={ROW_X0} y={ROW_Y + 46} fill={colors.POSITIVE} fontSize={14} opacity={fixU}>
                the fix: pin the first tokens forever + slide the window over the rest
              </text>
            )}
            <MathLabel
              tex="\textstyle\sum_i \alpha_i = 1"
              x={ROW_X0 + 700}
              y={ROW_Y - BAR_MAX - 34}
              fontSize={18}
              color={colors.MUTED}
              opacity={rowU}
            />
          </g>

          {/* the softmax budget: one bar that must sum to one */}
          <g opacity={rowU * (1 - vecU)}>
            <text x={ROW_X0} y={BUD_Y - 12} fill={colors.TEXT} fontSize={15}>
              softmax budget: every weight together sums to 1
            </text>
            <rect x={ROW_X0} y={BUD_Y} width={BUD_W} height={28} rx={4} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={ROW_X0} y={BUD_Y} width={sinkW} height={28} rx={4} fill={colors.WARM} opacity={0.9} />
            <rect x={ROW_X0 + sinkW} y={BUD_Y} width={BUD_W - sinkW} height={28} rx={4} fill={colors.ACCENT} opacity={0.35} />
            {sinkU > 0 && evictU < 0.5 && (
              <text x={ROW_X0 + 12} y={BUD_Y + 19} fill={colors.BG} fontSize={14} fontWeight={600} opacity={sinkU}>
                sink {SINK_PCT}%
              </text>
            )}
            <text x={ROW_X0 + BUD_W - 12} y={BUD_Y + 19} textAnchor="end" fill={colors.TEXT} fontSize={14} opacity={0.85}>
              {evictU > 0.5 ? '39 tokens now share all of it' : `other 39 tokens ${100 - SINK_PCT}%`}
            </text>
          </g>

          {/* the output vector swing */}
          {vecU > 0 && (
            <g opacity={vecU}>
              <text x={VEC_CX - 40} y={VEC_CY - 110} fill={colors.TEXT} fontSize={16}>
                the layer output vector
              </text>
              <circle cx={VEC_CX} cy={VEC_CY} r={3} fill={colors.MUTED} />
              {/* original */}
              <line x1={VEC_CX} y1={VEC_CY} x2={VEC_CX + OUT_A.x} y2={VEC_CY + OUT_A.y} stroke={colors.MUTED} strokeWidth={2} strokeDasharray="5 4" />
              <text x={VEC_CX + OUT_A.x + 8} y={VEC_CY + OUT_A.y + 4} fill={colors.MUTED} fontSize={14}>
                with sink
              </text>
              {/* live */}
              <line x1={VEC_CX} y1={VEC_CY} x2={VEC_CX + vx} y2={VEC_CY + vy} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round" />
              <circle cx={VEC_CX + vx} cy={VEC_CY + vy} r={5} fill={colors.NEGATIVE} />
              <text x={VEC_CX - 40} y={VEC_CY + 70} fill={colors.NEGATIVE} fontSize={15} fontWeight={600}>
                shift: {SHIFT_PCT.toFixed(0)}% of the vector’s length
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Attention sinks
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={220} width={840} height={200} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Some tokens matter for the mass they absorb.
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {SINK_PCT}% of the softmax budget on one contentless token —
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            evict it and the output swings {SHIFT_PCT.toFixed(0)}%. Pin the sinks; slide the rest.
          </text>
        </g>
      )}
    </>
  );
}

export function AttentionSinks() {
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
