// SSRN 6325939 — Adversarial Epistemic Incoherence (Dixon). Chapter 2: the
// regime. Grounded in §2 (Threat Model — the five durable environment
// properties) and the Kuran 1995 / Mattson 2021 citations behind them.
// The cascade and the proxy-drift plot are ILLUSTRATIVE SIMULATIONS of the
// mechanisms the paper names (Granovetter/Kuran threshold model; Goodhart
// proxy divergence) — they are computed here, not results from the paper.
// Kuran cascade (mulberry32 seed 42, 60 agents, 3 zealots): public conformity
// 3 → 60/60 in 15 rounds while private belief never changes. Verified.
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
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// S1 — Kuran-style preference falsification cascade, precomputed.
// 60 agents; agent i publicly conforms once the conforming fraction reaches
// its threshold. Three zealots seed it. Records, per agent, the round it flips.
// ---------------------------------------------------------------------------
const N_AGENTS = 60;
const flipRound: number[] = (() => {
  const rand = mulberry32(42);
  const thr = Array.from({ length: N_AGENTS }, () => rand());
  thr[0] = 0; thr[1] = 0; thr[2] = 0;
  let pub = thr.map((t) => t <= 0);
  const flips = pub.map((p) => (p ? 0 : Infinity));
  for (let step = 1; step <= 40; step++) {
    const frac = pub.filter(Boolean).length / N_AGENTS;
    const next = thr.map((t, i) => pub[i] || t <= frac);
    let changed = false;
    next.forEach((p, i) => {
      if (p && !pub[i]) { flips[i] = step; changed = true; }
    });
    pub = next;
    if (!changed) break;
  }
  return flips;
})();
const TOTAL_ROUNDS = Math.max(...flipRound.filter((r) => Number.isFinite(r))); // 15

// agent grid layout (10 x 6)
const GRID_COLS = 10;
// right-side field: clear of the five-property list in the left rail
const AG_X0 = 444;
const AG_Y0 = 210;
const AG_DX = 46;
const AG_DY = 52;
const agPos = (i: number) => ({
  x: AG_X0 + (i % GRID_COLS) * AG_DX,
  y: AG_Y0 + Math.floor(i / GRID_COLS) * AG_DY,
});

// ---------------------------------------------------------------------------
// S5 — metric capture: proxy climbs, target peaks and falls. Closed form.
// proxy(t) = 1 - e^{-3t}; target(t) = proxy(t) - 1.15 t^2. Target peaks ≈0.51
// near t=0.4 and crosses zero near t=0.9. Verified numerically.
// ---------------------------------------------------------------------------
const proxyF = (t: number) => 1 - Math.exp(-3 * t);
const targetF = (t: number) => proxyF(t) - 1.15 * t * t;
const PLOT = { x: 760, y: 200, w: 380, h: 240 };
const px = (t: number) => PLOT.x + t * PLOT.w;
const py = (v: number) => PLOT.y + PLOT.h - (v + 0.25) / 1.25 * PLOT.h;
const curvePts = (f: (t: number) => number, u: number) => {
  const n = Math.max(2, Math.round(100 * u));
  return Array.from({ length: n }, (_, i) => {
    const t = (i / 99);
    return `${px(t)},${py(f(t))}`;
  }).join(' ');
};

// The five durable properties of an AEI environment (§2, verbatim headings).
const PROPS = [
  'fragmented or unstable authority',
  'incentive-distorted truth production',
  'preference falsification & consensus illusions',
  'metric capture & post hoc evaluation drift',
  'trust-chain mimicry',
];

// k/y chosen so the round counter under the grid stays above the caption band
const CAM_AGENTS: CameraState = { x: AG_X0 + 4.5 * AG_DX, y: AG_Y0 + 155, k: 1.15 };
const CAM_PLOT: CameraState = { x: PLOT.x + PLOT.w / 2, y: PLOT.y + PLOT.h / 2, k: 1.3 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  propsU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  cascadeU: ChannelRef<number>;
  countU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  proxyU: ChannelRef<number>;
  targetU: ChannelRef<number>;
  shiftU: ChannelRef<number>;
  provU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const propsU = tl.channel('propsU', 0);
  const gridU = tl.channel('gridU', 0);
  const cascadeU = tl.channel('cascadeU', 0);
  const countU = tl.channel('countU', 0);
  const plotU = tl.channel('plotU', 0);
  const proxyU = tl.channel('proxyU', 0);
  const targetU = tl.channel('targetU', 0);
  const shiftU = tl.channel('shiftU', 0);
  const provU = tl.channel('provU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — name the regime, list its five properties.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'The paper defines adversarial epistemic incoherence as an environment with five durable properties. None of them is exotic. Each one is a well-studied distortion from organizational research.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(propsU, 1, { at: 1.4, dur: 3.4, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — preference falsification: introduce the agent grid.
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'Take one of them: preference falsification. Here are sixty people in an organization. The blue core is what each one privately believes — say, that a system is not ready. The outer ring is what they say in public.',
  });
  tl.tween(gridU, 1, { at: 7.6, dur: 2.2, ease: ease.enter });
  tl.tween(cam, CAM_AGENTS, { at: 7.8, dur: 1.4, ease: ease.move });
  tl.hold(13.0, 0.7);

  // Beat 3 — run the cascade.
  tl.caption({
    at: 13.7,
    dur: 6.6,
    text: 'This is a threshold model from the literature the paper cites, computed for real: each person conforms in public once enough colleagues already have. Three eager voices start it. Watch the rings flip, round by round.',
  });
  tl.tween(cascadeU, 1, { at: 15.2, dur: 6.5, ease: ease.linear });
  tl.tween(countU, 1, { at: 15.2, dur: 6.5, ease: ease.linear });
  tl.caption({
    at: 20.8,
    dur: 6.2,
    text: 'Fifteen rounds later, all sixty publicly agree the system is ready. Not one private belief has moved. The paper calls the result a consensus illusion: dissent became strategically costly, so it disappeared from view.',
  });
  tl.hold(27.0, 0.8);

  // Beat 4 — metric capture and post hoc drift.
  tl.caption({
    at: 27.8,
    dur: 6.2,
    text: 'A second property: metric capture. In this illustrative simulation, an optimizer climbs a proxy score. The proxy keeps rising. The thing it was a proxy for peaks halfway through — then falls below where it started.',
  });
  tl.tween(cam, CAM_PLOT, { at: 28.0, dur: 1.4, ease: ease.move });
  tl.tween(plotU, 1, { at: 28.4, dur: 1.0, ease: ease.draw });
  tl.tween(proxyU, 1, { at: 29.6, dur: 2.4, ease: ease.linear });
  tl.tween(targetU, 1, { at: 29.6, dur: 2.4, ease: ease.linear });
  tl.caption({
    at: 34.2,
    dur: 5.6,
    text: 'The paper adds the institutional twist: the evaluation criteria themselves shift after outcomes are visible. Whatever the system just achieved gets redrawn as the bar it was supposed to clear.',
  });
  tl.tween(shiftU, 1, { at: 35.4, dur: 1.6, ease: ease.move });
  tl.hold(39.8, 0.7);

  // Beat 5 — trust-chain mimicry.
  tl.caption({
    at: 40.5,
    dur: 6.0,
    text: 'And the fifth property: trust-chain mimicry. Untrusted content dressed as authoritative information. The provenance line between data, instruction, and constraint — collapsed. Hold that one; it returns in chapter four as prompt injection.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 40.7, dur: 1.4, ease: ease.move });
  tl.tween(provU, 1, { at: 41.8, dur: 1.2, ease: ease.enter });
  tl.hold(46.5, 0.7);

  // Beat 6 — adversarial without an antagonist.
  tl.caption({
    at: 47.2,
    dur: 6.4,
    text: 'Here is the paper’s sharpest move. This regime is adversarial without a single antagonist. Incentives, authority dynamics, and reputational pressure generate predictable epistemic attacks as an emergent property. Nobody has to be lying.',
  });
  tl.tween(dimU, 1, { at: 47.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.6, dur: 1.0, ease: ease.enter });
  tl.hold(53.6, 1.2);

  return {
    tl, cam, titleU, propsU, gridU, cascadeU, countU,
    plotU, proxyU, targetU, shiftU, provU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/aei-regime/overrides.json',
  slug: 'aei-regime',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const propsU = s.get(scene.propsU);
  const gridU = s.get(scene.gridU);
  const cascadeU = s.get(scene.cascadeU);
  const countU = s.get(scene.countU);
  const plotU = s.get(scene.plotU);
  const proxyU = s.get(scene.proxyU);
  const targetU = s.get(scene.targetU);
  const shiftU = s.get(scene.shiftU);
  const provU = s.get(scene.provU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const round = cascadeU * TOTAL_ROUNDS;
  const flipped = flipRound.filter((r) => r <= round).length;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the five properties, left rail */}
          {PROPS.map((p, i) => {
            const u = clamp01(propsU * PROPS.length - i);
            if (u <= 0) return null;
            const y = 140 + i * 34;
            const active =
              (i === 2 && gridU > 0.5 && plotU < 0.5) ||
              (i === 3 && plotU > 0.5 && provU < 0.5) ||
              (i === 4 && provU > 0.5);
            return (
              <g key={p} opacity={u * (active ? 1 : 0.55)}>
                <circle cx={70} cy={y} r={4} fill={active ? colors.WARM : colors.MUTED} />
                <text x={86} y={y + 5} fill={active ? colors.WARM : colors.TEXT} fontSize={13}>
                  {p}
                </text>
              </g>
            );
          })}

          {/* the sixty agents — recede once the proxy plot shares the right field */}
          {gridU > 0 && (
            <g opacity={1 - 0.8 * clamp01(plotU * 2)}>
              <text x={AG_X0 - 20} y={AG_Y0 - 44} fill={colors.MUTED} fontSize={13} fontFamily="monospace" opacity={gridU}>
                illustrative simulation — threshold conformity model (Kuran 1995)
              </text>
              {flipRound.map((fr, i) => {
                const u = clamp01(gridU * N_AGENTS * 0.4 - i * 0.4);
                if (u <= 0) return null;
                const { x, y } = agPos(i);
                const flippedNow = fr <= round;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={x} cy={y} r={14} fill="none" strokeWidth={4}
                      stroke={flippedNow ? colors.POSITIVE : colors.ACCENT}
                      opacity={flippedNow ? 0.95 : 0.5}
                    />
                    <circle cx={x} cy={y} r={6} fill={colors.ACCENT} />
                  </g>
                );
              })}
              {countU > 0 && (
                <g opacity={Math.min(1, countU * 4)}>
                  <text x={AG_X0 - 20} y={AG_Y0 + 5.6 * AG_DY + 10} fill={colors.TEXT} fontSize={14} fontFamily="monospace">
                    public "ready": {flipped}/60 · round {Math.floor(round)}
                  </text>
                  <text x={AG_X0 + 250} y={AG_Y0 + 5.6 * AG_DY + 10} fill={colors.ACCENT} fontSize={14} fontFamily="monospace">
                    private belief moved: 0/60
                  </text>
                </g>
              )}
            </g>
          )}

          {/* proxy vs target plot */}
          {plotU > 0 && (
            <g opacity={plotU}>
              <line x1={PLOT.x} y1={py(0)} x2={PLOT.x + PLOT.w} y2={py(0)} stroke={colors.GRID} strokeWidth={1} />
              <line x1={PLOT.x} y1={PLOT.y} x2={PLOT.x} y2={PLOT.y + PLOT.h} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={PLOT.x} y={PLOT.y - 26} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                illustrative — optimize the proxy, watch the target
              </text>
              {proxyU > 0 && (
                <>
                  <polyline points={curvePts(proxyF, proxyU)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
                  <text x={px(0.72)} y={py(proxyF(0.72)) - 12} fill={colors.POSITIVE} fontSize={13} opacity={clamp01(proxyU * 2 - 1)}>
                    proxy score
                  </text>
                </>
              )}
              {targetU > 0 && (
                <>
                  <polyline points={curvePts(targetF, targetU)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
                  <text x={px(0.62)} y={py(targetF(0.62)) + 26} fill={colors.NEGATIVE} fontSize={13} opacity={clamp01(targetU * 2 - 1)}>
                    the thing it measured
                  </text>
                </>
              )}
              {shiftU > 0 && (
                <g opacity={shiftU}>
                  <line
                    x1={PLOT.x} x2={PLOT.x + PLOT.w}
                    y1={py(0.55 + 0.38 * shiftU)} y2={py(0.55 + 0.38 * shiftU)}
                    stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="6 5"
                  />
                  <text x={PLOT.x + PLOT.w} y={py(0.55 + 0.38 * shiftU) - 8} textAnchor="end" fill={colors.WARM} fontSize={13}>
                    "the bar" — redrawn post hoc
                  </text>
                </g>
              )}
            </g>
          )}

          {/* trust-chain mimicry chip */}
          {provU > 0 && (
            <g opacity={provU}>
              <rect x={760} y={448} width={380} height={92} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={780} y={478} fill={colors.SECONDARY} fontSize={14} fontWeight={600}>
                trust-chain mimicry
              </text>
              <text x={780} y={502} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                data | instruction | constraint
              </text>
              <line x1={780} y1={510} x2={1120} y2={510} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="3 4" opacity={provU} />
              <text x={780} y={530} fill={colors.NEGATIVE} fontSize={12}>
                provenance distinctions collapse (§2)
              </text>
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The regime
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
          AEI threat model — SSRN 6325939 §2
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={225} width={860} height={200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={295} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Adversarial — without an antagonist
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            incentives + authority dynamics + reputational pressure
          </text>
          <text x={640} y={368} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            → predictable epistemic attacks, as an emergent property
          </text>
          <text x={640} y={406} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            SSRN 6325939 §2 — sims illustrative, not the paper's results
          </text>
        </g>
      )}
    </>
  );
}

export function AeiRegime() {
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
