// Explained: Long Context — chapter 5: what long context costs. Pure
// arithmetic at module scope, same reference model as the hybrid book
// (48 layers, 8 KV heads, head dim 128, fp16 → 192 KiB of KV per token):
// cache memory is linear in T — 1.5 GiB at 8k, 24 GiB at 128k, 192 GiB at a
// million tokens — while prefill attention work is quadratic: growing the
// context 128× (8k → 1M) multiplies the attention bill by 16,384×. At decode,
// each generated token must stream the whole cache: 192 GiB per token caps
// generation near 15 tokens per second on a 3 TB/s part, from memory traffic
// alone. The alternatives replotted on the same axes: a sliding window
// (flat past its width), and the hybrid ratio from book thirty three
// (the same line divided by eight). Closing bridge to Explained: Hybrid
// Attention.
import { scaleLinear, scaleLog } from 'd3';
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
// Real arithmetic, module scope.
// ---------------------------------------------------------------------------

const KV_KIB_PER_TOK = 192; // 2 · 8 heads · 128 dim · 2 B · 48 layers / 1024
const memGiB = (tokens: number): number => (KV_KIB_PER_TOK * tokens) / 2 ** 20;
// memGiB(8192) = 1.5 · memGiB(131072) = 24 · memGiB(1048576) = 192

const WINDOW = 8192; // sliding-window width
const memWindowGiB = (tokens: number): number => memGiB(Math.min(tokens, WINDOW));
const memHybridGiB = (tokens: number): number => memGiB(tokens) / 8;

/** prefill attention work, normalized to T = 8k ( ∝ T² ). */
const prefillRel = (tokens: number): number => (tokens / 8192) ** 2;
// prefillRel(1M) = 16384

const HBM_TBS = 3; // TB/s
const DECODE_TPS = (HBM_TBS * 1024) / memGiB(1048576); // ≈ 16 tokens/s ceiling at 1M

// log-log domain: 8k .. 1M
const LOG_T = scaleLog().domain([8192, 1048576]).range([0, 1]);

// ---------------------------------------------------------------------------
// Layout. Left: memory (log-log). Right: prefill compute (log-log).
// Bottom band: the decode-speed statement.
// ---------------------------------------------------------------------------

const MEM_X = scaleLinear().domain([0, 1]).range([150, 590]); // in log-units
const MEM_Y = scaleLog().domain([0.1, 300]).range([420, 130]);

const CMP_X = scaleLinear().domain([0, 1]).range([700, 1140]);
const CMP_Y = scaleLog().domain([0.5, 30000]).range([420, 130]);

const CAM_MEM: CameraState = { x: 380, y: 280, k: 1.3 };
const CAM_CMP: CameraState = { x: 920, y: 280, k: 1.3 };
const CAM_DEC: CameraState = { x: 640, y: 500, k: 1.3 };

const TICKS = [8192, 32768, 131072, 524288, 1048576];
const tickLabel = (t: number): string => (t >= 1048576 ? '1M' : t >= 1024 ? `${Math.round(t / 1024)}k` : `${t}`);

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  memU: ChannelRef<number>;
  memSweep: ChannelRef<number>;
  altU: ChannelRef<number>;
  cmpU: ChannelRef<number>;
  cmpSweep: ChannelRef<number>;
  decU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const memU = tl.channel('memU', 0);
  const memSweep = tl.channel('memSweep', 0);
  const altU = tl.channel('altU', 0);
  const cmpU = tl.channel('cmpU', 0);
  const cmpSweep = tl.channel('cmpSweep', 0);
  const decU = tl.channel('decU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the memory line
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Time to pay for all of it. Take the same reference model as before — forty eight layers, a hundred ninety two kilobytes of cache per token — and slide the context from eight thousand tokens to a million.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_MEM, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(memU, 1, { at: 1.6, dur: 1.3, ease: ease.draw });
  tl.caption({
    at: 6.6,
    dur: 5.6,
    text: 'The cache is a straight tax: one and a half gigabytes at eight thousand tokens, twenty four at a hundred twenty eight thousand, one hundred ninety two gigabytes at a million. That last number no longer fits on any single accelerator.',
  });
  tl.tween(memSweep, 1, { at: 7.0, dur: 4.6, ease: ease.move });
  tl.hold(12.6, 0.6);

  // Beat 2 — the quadratic bill
  tl.caption({
    at: 13.2,
    dur: 6.0,
    text: 'Memory is the gentle part. Reading a prompt, every token attends to every earlier token, so the attention work grows with the square of the length.',
  });
  tl.tween(cam, CAM_CMP, { at: 13.4, dur: 1.5, ease: ease.move });
  tl.tween(cmpU, 1, { at: 14.4, dur: 1.3, ease: ease.draw });
  tl.caption({
    at: 19.4,
    dur: 5.6,
    text: 'Grow the context one hundred twenty eight times and the attention bill grows sixteen thousand three hundred eighty four times. That is the quadratic curve, and it is why million-token prompts are measured in minutes and dollars.',
  });
  tl.tween(cmpSweep, 1, { at: 19.8, dur: 4.4, ease: ease.move });
  tl.hold(25.6, 0.7);

  // Beat 3 — decode bandwidth
  tl.caption({
    at: 26.3,
    dur: 6.0,
    text: 'And generation pays per token: each new token streams the entire cache through the chip. At a million tokens that is one hundred ninety two gigabytes per token — on a three terabyte per second part, memory traffic alone caps you near sixteen tokens a second.',
  });
  tl.tween(cam, CAM_DEC, { at: 26.5, dur: 1.5, ease: ease.move });
  tl.tween(decU, 1, { at: 27.5, dur: 1.0, ease: ease.enter });
  tl.hold(32.6, 0.6);

  // Beat 4 — the alternatives on the same axes
  tl.caption({
    at: 33.2,
    dur: 6.0,
    text: 'Now replot the escape routes on the same axes. A sliding window flattens the line at its width — cheap, but chapter three showed what careless windows do, and the middle of the document is simply gone.',
  });
  tl.tween(cam, CAM_MEM, { at: 33.4, dur: 1.5, ease: ease.move });
  tl.tween(altU, 1, { at: 34.4, dur: 1.3, ease: ease.draw });
  tl.caption({
    at: 39.5,
    dur: 5.4,
    text: 'And the hybrid from the previous book keeps the straight line but divides it by eight — twenty four gigabytes at a million tokens instead of one hundred ninety two. Full recall where it counts, a fixed state everywhere else.',
  });
  tl.hold(45.2, 0.7);

  // Beat 5 — series close
  tl.caption({
    at: 45.9,
    dur: 6.0,
    text: 'That is the whole long-context story: a rotating ruler, stretched carefully; sinks you must not evict; a middle that rots; and a bill that grows faster than the window. The models that tame it are the hybrids — book thirty three on this shelf.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 46.1, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 47.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.6, dur: 0.9, ease: ease.enter });
  tl.hold(51.9, 1.2);

  return { tl, cam, titleU, memU, memSweep, altU, cmpU, cmpSweep, decU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/context-cost/overrides.json',
  slug: 'context-cost',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const memU = s.get(scene.memU);
  const memSweep = s.get(scene.memSweep);
  const altU = s.get(scene.altU);
  const cmpU = s.get(scene.cmpU);
  const cmpSweep = s.get(scene.cmpSweep);
  const decU = s.get(scene.decU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const memT = 8192 * Math.pow(128, memSweep); // 8k → 1M along the log axis
  const cmpT = 8192 * Math.pow(128, cmpSweep);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* memory panel */}
          {memU > 0 && (
            <g opacity={memU}>
              <text x={150} y={100} fill={colors.TEXT} fontSize={17}>
                cache memory vs context length
              </text>
              <text x={150} y={122} fill={colors.MUTED} fontSize={12}>
                log–log · 192 KiB per token, full attention
              </text>
              <line x1={150} y1={420} x2={590} y2={420} stroke={colors.GRID} strokeWidth={1.2} />
              <line x1={150} y1={420} x2={150} y2={130} stroke={colors.GRID} strokeWidth={1.2} />
              {TICKS.map((t) => (
                <text key={t} x={MEM_X(LOG_T(t))} y={440} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                  {tickLabel(t)}
                </text>
              ))}
              {[1, 10, 100].map((v) => (
                <text key={v} x={142} y={MEM_Y(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11}>
                  {v} GiB
                </text>
              ))}
              <FunctionPlot
                x={MEM_X}
                y={MEM_Y}
                f={(u) => memGiB(8192 * Math.pow(128, u))}
                domain={[0, Math.max(0.01, memSweep)]}
                samples={120}
                reveal={1}
                color={colors.ACCENT}
                width={2.6}
              />
              {altU > 0 && (
                <>
                  <FunctionPlot
                    x={MEM_X}
                    y={MEM_Y}
                    f={(u) => memWindowGiB(8192 * Math.pow(128, u))}
                    domain={[0, 1]}
                    samples={120}
                    reveal={altU}
                    color={colors.MUTED}
                    width={2.2}
                  />
                  <FunctionPlot
                    x={MEM_X}
                    y={MEM_Y}
                    f={(u) => memHybridGiB(8192 * Math.pow(128, u))}
                    domain={[0, 1]}
                    samples={120}
                    reveal={altU}
                    color={colors.POSITIVE}
                    width={2.4}
                  />
                  <text x={MEM_X(1) - 4} y={MEM_Y(memHybridGiB(1048576)) - 10} textAnchor="end" fill={colors.POSITIVE} fontSize={12} opacity={altU}>
                    hybrid ⅛: {memHybridGiB(1048576).toFixed(0)} GiB
                  </text>
                  <text x={MEM_X(1) - 4} y={MEM_Y(memWindowGiB(1048576)) + 20} textAnchor="end" fill={colors.MUTED} fontSize={12} opacity={altU}>
                    window 8k: flat at {memWindowGiB(1048576).toFixed(1)} GiB
                  </text>
                </>
              )}
              {memSweep > 0.02 && (
                <>
                  <circle cx={MEM_X(LOG_T(memT))} cy={MEM_Y(memGiB(memT))} r={5} fill={colors.WARM} />
                  <text x={MEM_X(LOG_T(memT)) + 10} y={MEM_Y(memGiB(memT)) - 10} fill={colors.WARM} fontSize={13} fontWeight={600}>
                    {memGiB(memT) >= 10 ? memGiB(memT).toFixed(0) : memGiB(memT).toFixed(1)} GiB
                  </text>
                </>
              )}
            </g>
          )}

          {/* compute panel */}
          {cmpU > 0 && (
            <g opacity={cmpU}>
              <text x={700} y={100} fill={colors.TEXT} fontSize={17}>
                prefill attention work (relative)
              </text>
              <text x={700} y={122} fill={colors.MUTED} fontSize={12}>
                log–log · normalized to 8k = 1
              </text>
              <line x1={700} y1={420} x2={1140} y2={420} stroke={colors.GRID} strokeWidth={1.2} />
              <line x1={700} y1={420} x2={700} y2={130} stroke={colors.GRID} strokeWidth={1.2} />
              {TICKS.map((t) => (
                <text key={t} x={CMP_X(LOG_T(t))} y={440} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                  {tickLabel(t)}
                </text>
              ))}
              {[1, 100, 10000].map((v) => (
                <text key={v} x={692} y={CMP_Y(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11}>
                  {v}×
                </text>
              ))}
              <FunctionPlot
                x={CMP_X}
                y={CMP_Y}
                f={(u) => prefillRel(8192 * Math.pow(128, u))}
                domain={[0, Math.max(0.01, cmpSweep)]}
                samples={120}
                reveal={1}
                color={colors.NEGATIVE}
                width={2.6}
              />
              <MathLabel tex="\text{work} \propto T^2" x={730} y={166} fontSize={17} color={colors.NEGATIVE} opacity={cmpU} />
              {cmpSweep > 0.02 && (
                <>
                  <circle cx={CMP_X(LOG_T(cmpT))} cy={CMP_Y(prefillRel(cmpT))} r={5} fill={colors.WARM} />
                  <text x={CMP_X(LOG_T(cmpT)) - 10} y={CMP_Y(prefillRel(cmpT)) - 12} textAnchor="end" fill={colors.WARM} fontSize={13} fontWeight={600}>
                    {prefillRel(cmpT) >= 100 ? prefillRel(cmpT).toFixed(0) : prefillRel(cmpT).toFixed(1)}×
                  </text>
                </>
              )}
            </g>
          )}

          {/* decode-speed statement */}
          {decU > 0 && (
            <g opacity={decU}>
              <text x={280} y={505} fill={colors.TEXT} fontSize={16}>
                decode at 1M tokens: every token streams the whole cache
              </text>
              <MathLabel
                tex="\frac{3\ \text{TB/s}}{192\ \text{GiB/token}} \approx 16\ \text{tokens/s}"
                x={430}
                y={560}
                fontSize={20}
                color={colors.WARM}
                opacity={decU}
              />
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The bill
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={220} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={278} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            The window grows; the bill grows faster.
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Rotations · stretched rulers · pinned sinks · a rotting middle ·
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            192 GiB and 16,384× the work at a million tokens.
          </text>
          <text x={640} y={392} textAnchor="middle" fill={colors.SECONDARY} fontSize={15}>
            How frontier models tame it: Explained — Hybrid Attention, №33.
          </text>
        </g>
      )}
    </>
  );
}

export function ContextCost() {
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
