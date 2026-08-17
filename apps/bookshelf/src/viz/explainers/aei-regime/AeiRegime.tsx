// SSRN 6325939 — Adversarial Epistemic Incoherence (Dixon). Chapter 2: the
// regime. Grounded in §2 (Threat Model — the five durable environment
// properties) and the Kuran 1995 / Mattson 2021 citations behind them.
// The cascade and the proxy-drift plot are ILLUSTRATIVE SIMULATIONS of the
// mechanisms the paper names (Granovetter/Kuran threshold model; Goodhart
// proxy divergence) — they are computed here, not results from the paper.
// Kuran cascade (mulberry32 seed 42, 60 agents, 3 zealots): public conformity
// 3 → 60/60 in 15 rounds while private belief never changes. Verified.
//
// STAGING — one ROOM per subject on a 2-D world grid (see the room helpers
// below). Rooms are further apart than the viewport is wide/tall, so no two
// rooms can ever share a frame and every beat is drawn on a clean background.
import {
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
import { Figure } from '../../primitives';
import overrides from './overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Room grid — room (c, r) owns 0..1280 × 0..720 translated by (c*1600, r*900).
// ---------------------------------------------------------------------------
const ROOM_DX = 1600;
const ROOM_DY = 900;
// Room bodies are pushed down by BODY_DY so the graphic sits centred in the
// 16:9 frame instead of hugging the top edge; the header is lifted back up by
// the same amount so it still renders at y = 62 on screen.
const BODY_DY = 45;
const roomAt = (c: number, r = 0) =>
  `translate(${c * ROOM_DX}, ${r * ROOM_DY + BODY_DY})`;
const camAt = (c: number, r = 0, k = 1): CameraState => ({
  x: c * ROOM_DX + STAGE_W / 2,
  y: r * ROOM_DY + STAGE_H / 2,
  k,
});

// Zoom stays ≤ 1.08: at k the leftmost visible world x is 640 - 640/k, and the
// room header sits at x = 60, so anything tighter shaves the title.
const CAM_PROPS = camAt(0, 0);
const CAM_AGENTS = camAt(1, 0, 1.08);
const CAM_PLOT = camAt(2, 0);
const CAM_TRUST = camAt(2, 1);
const CAM_CLOSE = camAt(1, 1);

const FIG = '/generated/ssrn-aei/figures';

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

// agent grid layout (10 × 6), centred in its own room
const GRID_COLS = 10;
const AG_X0 = 430;
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
const PLOT = { x: 300, y: 190, w: 520, h: 280 };
const px = (t: number) => PLOT.x + t * PLOT.w;
const py = (v: number) => PLOT.y + PLOT.h - ((v + 0.25) / 1.25) * PLOT.h;
const curvePts = (f: (t: number) => number, u: number) => {
  const n = Math.max(2, Math.round(100 * u));
  return Array.from({ length: n }, (_, i) => {
    const t = i / 99;
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

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  propsU: ChannelRef<number>;
  threatFigU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  cascadeU: ChannelRef<number>;
  countU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  proxyU: ChannelRef<number>;
  targetU: ChannelRef<number>;
  shiftU: ChannelRef<number>;
  provU: ChannelRef<number>;
  closeU: ChannelRef<number>;
  advFigU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PROPS, cameraInterp);
  const propsU = tl.channel('propsU', 0);
  const threatFigU = tl.channel('threatFigU', 0);
  const gridU = tl.channel('gridU', 0);
  const cascadeU = tl.channel('cascadeU', 0);
  const countU = tl.channel('countU', 0);
  const plotU = tl.channel('plotU', 0);
  const proxyU = tl.channel('proxyU', 0);
  const targetU = tl.channel('targetU', 0);
  const shiftU = tl.channel('shiftU', 0);
  const provU = tl.channel('provU', 0);
  const closeU = tl.channel('closeU', 0);
  const advFigU = tl.channel('advFigU', 0);

  // Beat 1 — ROOM (0,0): the five properties, beside the paper's own §2.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'The paper defines adversarial epistemic incoherence as an environment with five durable properties. None of them is exotic. Each one is a well-studied distortion from organizational research.',
  });
  tl.tween(propsU, 1, { at: 0.8, dur: 3.2, ease: ease.enter });
  tl.tween(threatFigU, 1, { at: 2.4, dur: 1.0, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — ROOM (1,0): preference falsification, sixty people.
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'Take one of them: preference falsification. Here are sixty people in an organization. The blue core is what each one privately believes — say, that a system is not ready. The outer ring is what they say in public.',
  });
  // Each room change starts ~1.5s BEFORE its line, so the camera has settled
  // and the room is dressed by the time the narration reaches it.
  tl.tween(cam, CAM_AGENTS, { at: 5.5, dur: 1.4, ease: ease.move });
  tl.tween(gridU, 1, { at: 5.8, dur: 2.2, ease: ease.enter });
  tl.hold(13.0, 0.7);

  // Beat 3 — same room: run the cascade. One object, transformed.
  tl.caption({
    at: 13.7,
    dur: 6.6,
    text: 'This is a threshold model from the literature the paper cites, computed for real: each person conforms in public once enough colleagues already have. Three eager voices start it. Watch the rings flip, round by round.',
  });
  tl.tween(cascadeU, 1, { at: 15.2, dur: 6.5, ease: ease.linear });
  tl.tween(countU, 1, { at: 15.2, dur: 6.5, ease: ease.linear });

  // Beat 4 — same room: the result.
  tl.caption({
    at: 20.8,
    dur: 6.2,
    text: 'Fifteen rounds later, all sixty publicly agree the system is ready. Not one private belief has moved. The paper calls the result a consensus illusion: dissent became strategically costly, so it disappeared from view.',
  });
  tl.hold(27.0, 0.8);

  // Beat 5 — ROOM (2,0): metric capture.
  tl.caption({
    at: 27.8,
    dur: 6.2,
    text: 'A second property: metric capture. In this illustrative simulation, an optimizer climbs a proxy score. The proxy keeps rising. The thing it was a proxy for peaks halfway through — then falls below where it started.',
  });
  tl.tween(cam, CAM_PLOT, { at: 26.3, dur: 1.4, ease: ease.move });
  tl.tween(plotU, 1, { at: 26.6, dur: 1.0, ease: ease.draw });
  tl.tween(proxyU, 1, { at: 28.6, dur: 2.4, ease: ease.linear });
  tl.tween(targetU, 1, { at: 28.6, dur: 2.4, ease: ease.linear });

  // Beat 6 — same room: the bar moves after the fact.
  tl.caption({
    at: 34.2,
    dur: 5.6,
    text: 'The paper adds the institutional twist: the evaluation criteria themselves shift after outcomes are visible. Whatever the system just achieved gets redrawn as the bar it was supposed to clear.',
  });
  tl.tween(shiftU, 1, { at: 33.6, dur: 1.6, ease: ease.move });
  tl.hold(39.8, 0.7);

  // Beat 7 — ROOM (2,1): trust-chain mimicry.
  tl.caption({
    at: 40.5,
    dur: 6.0,
    text: 'And the fifth property: trust-chain mimicry. Untrusted content dressed as authoritative information. The provenance line between data, instruction, and constraint — collapsed. Hold that one; it returns in chapter four as prompt injection.',
  });
  tl.tween(cam, CAM_TRUST, { at: 39.0, dur: 1.4, ease: ease.move });
  tl.tween(provU, 1, { at: 39.3, dur: 1.2, ease: ease.enter });
  tl.hold(46.5, 0.7);

  // Beat 8 — ROOM (1,1): the close, on an empty stage.
  tl.caption({
    at: 47.2,
    dur: 6.4,
    text: 'Here is the paper’s sharpest move. This regime is adversarial without a single antagonist. Incentives, authority dynamics, and reputational pressure generate predictable epistemic attacks as an emergent property. Nobody has to be lying.',
  });
  tl.tween(cam, CAM_CLOSE, { at: 45.7, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 46.0, dur: 1.0, ease: ease.enter });
  tl.tween(advFigU, 1, { at: 46.6, dur: 0.9, ease: ease.enter });
  tl.hold(53.6, 1.2);

  return {
    tl, cam, propsU, threatFigU, gridU, cascadeU, countU,
    plotU, proxyU, targetU, shiftU, provU, closeU, advFigU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/aei-regime/overrides.json',
  slug: 'aei-regime',
};

function RoomHeader({ title, sub, u = 1 }: { title: string; sub: string; u?: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <text x={60} y={62 - BODY_DY} fill={colors.TEXT} fontSize={24} fontWeight={600}>
        {title}
      </text>
      <text x={60} y={88 - BODY_DY} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
        {sub}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const propsU = s.get(scene.propsU);
  const threatFigU = s.get(scene.threatFigU);
  const gridU = s.get(scene.gridU);
  const cascadeU = s.get(scene.cascadeU);
  const countU = s.get(scene.countU);
  const plotU = s.get(scene.plotU);
  const proxyU = s.get(scene.proxyU);
  const targetU = s.get(scene.targetU);
  const shiftU = s.get(scene.shiftU);
  const provU = s.get(scene.provU);
  const closeU = s.get(scene.closeU);
  const advFigU = s.get(scene.advFigU);

  const round = cascadeU * TOTAL_ROUNDS;
  const flipped = flipRound.filter((r) => r <= round).length;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        {/* ---------- ROOM (0,0) — the five durable properties ---------- */}
        <g transform={roomAt(0, 0)} opacity={propsU}>
          <RoomHeader title="The regime" sub="AEI threat model — SSRN 6325939 §2" />
          {PROPS.map((p, i) => {
            const u = clamp01(propsU * PROPS.length - i);
            if (u <= 0) return null;
            const y = 200 + i * 52;
            return (
              <g key={p} opacity={u}>
                <circle cx={80} cy={y} r={5} fill={colors.WARM} />
                <text x={102} y={y + 6} fill={colors.TEXT} fontSize={17}>
                  {p}
                </text>
              </g>
            );
          })}
          <Figure
            src={`${FIG}/threat-model.png`}
            x={760} y={130} w={390} h={367}
            reveal={threatFigU} opacity={threatFigU}
            accent={colors.WARM}
            caption="§2 — the five properties, as published"
          />
        </g>

        {/* ---------- ROOM (1,0) — the sixty agents ---------- */}
        <g transform={roomAt(1, 0)} opacity={gridU}>
          <RoomHeader
            title="Preference falsification"
            sub="illustrative simulation — threshold conformity model (Kuran 1995)"
          />
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
          <text x={AG_X0 - 14} y={AG_Y0 - 34} fill={colors.MUTED} fontSize={14}>
            outer ring = what they say · core = what they believe
          </text>
          {countU > 0 && (
            <g opacity={Math.min(1, countU * 4)}>
              <text x={AG_X0 - 14} y={AG_Y0 + 5 * AG_DY + 64} fill={colors.TEXT} fontSize={17}
                fontFamily="monospace">
                public “ready”: {flipped}/60 · round {Math.floor(round)}
              </text>
              <text x={AG_X0 - 14} y={AG_Y0 + 5 * AG_DY + 94} fill={colors.ACCENT} fontSize={17}
                fontFamily="monospace">
                private belief moved: 0/60
              </text>
            </g>
          )}
        </g>

        {/* ---------- ROOM (2,0) — metric capture ---------- */}
        <g transform={roomAt(2, 0)} opacity={plotU}>
          <RoomHeader
            title="Metric capture"
            sub="illustrative — optimize the proxy, watch the target (Mattson et al. 2021)"
          />
          <line x1={PLOT.x} y1={py(0)} x2={PLOT.x + PLOT.w} y2={py(0)} stroke={colors.GRID} strokeWidth={1} />
          <line x1={PLOT.x} y1={PLOT.y} x2={PLOT.x} y2={PLOT.y + PLOT.h} stroke={colors.GRID} strokeWidth={1.5} />
          {proxyU > 0 && (
            <>
              <polyline points={curvePts(proxyF, proxyU)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
              <text x={px(0.74)} y={py(proxyF(0.74)) - 16} fill={colors.POSITIVE} fontSize={15}
                opacity={clamp01(proxyU * 2 - 1)}>
                proxy score
              </text>
            </>
          )}
          {targetU > 0 && (
            <>
              <polyline points={curvePts(targetF, targetU)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
              <text x={px(0.60)} y={py(targetF(0.60)) + 30} fill={colors.NEGATIVE} fontSize={15}
                opacity={clamp01(targetU * 2 - 1)}>
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
              {/* left-anchored: the right end of this band is where the proxy
                  curve's own label lives, and the two used to collide */}
              <text x={PLOT.x + 10} y={py(0.55 + 0.38 * shiftU) - 12} textAnchor="start"
                fill={colors.WARM} fontSize={15}>
                “the bar” — redrawn post hoc
              </text>
            </g>
          )}
          <text x={PLOT.x} y={PLOT.y + PLOT.h + 34} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
            optimization pressure →
          </text>
        </g>

        {/* ---------- ROOM (2,1) — trust-chain mimicry ---------- */}
        <g transform={roomAt(2, 1)} opacity={provU}>
          <RoomHeader title="Trust-chain mimicry" sub="SSRN 6325939 §2 — Power 1997" />
          <rect x={330} y={190} width={620} height={230} rx={14} fill={colors.PANEL} stroke={colors.SECONDARY} />
          <text x={640} y={244} textAnchor="middle" fill={colors.SECONDARY} fontSize={19} fontWeight={600}>
            untrusted content, dressed as authority
          </text>
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontFamily="monospace">
            data | instruction | constraint
          </text>
          <line x1={370} y1={314} x2={910} y2={314} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="4 5" />
          <text x={640} y={358} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16}>
            provenance distinctions collapse
          </text>
          <text x={640} y={388} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            returns in chapter four as prompt injection
          </text>
        </g>

        {/* ---------- ROOM (1,1) — the close, on an empty stage ---------- */}
        <g transform={roomAt(1, 1)}>
          <g opacity={closeU}>
            <rect x={190} y={140} width={900} height={210} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={640} y={204} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={600}>
              Adversarial — without an antagonist
            </text>
            <text x={640} y={250} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
              incentives + authority dynamics + reputational pressure
            </text>
            <text x={640} y={280} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
              → predictable epistemic attacks, as an emergent property
            </text>
            <text x={640} y={320} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
              SSRN 6325939 §2 — sims illustrative, not the paper's results
            </text>
          </g>
          <Figure
            src={`${FIG}/adversarial.png`}
            x={190} y={400} w={900} h={103}
            reveal={advFigU} opacity={advFigU}
            accent={colors.WARM}
            caption="the paper's own sentence (§2)"
          />
        </g>
      </Camera>
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
