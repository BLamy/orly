// SSRN 6325939 — Adversarial Epistemic Incoherence (Dixon). Chapter 4:
// taxonomy part two — §6.4 Narrative Capture / Performative Alignment
// (Sharma et al. 2023), §6.6 Boundary Confusion (Perez & Ribeiro 2022;
// Greshake et al. 2023), §6.8 Refusal Penalty Inversion (Ouyang et al. 2022),
// §6.7 Recursive Oversight Failure ("coherence theater").
// ILLUSTRATIVE SIMULATIONS, computed here (not the paper's results):
//  - Refusal penalty inversion: replicator dynamics over three response
//    strategies under a toy preference model scoring fluent confidence above
//    honest refusal (refuse .45 / hedge .60 / confident .72). From a uniform
//    start, "confident execution" reaches 94.8% of the population by round 16;
//    refusal falls to 0.1%. Verified numerically.
//  - Recursive oversight: strict vs rubber-stamp auditors under a throughput
//    metric (.62 vs .72); catch rate = 0.9 * strict fraction decays from 45%
//    to 4.3% over 20 rounds. Verified numerically.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// S3 — refusal penalty inversion: replicator dynamics, precomputed.
// ---------------------------------------------------------------------------
const STRATS = [
  { key: 'refuse', label: 'honest refusal', score: 0.45, color: colors.POSITIVE },
  { key: 'hedge', label: 'hedge', score: 0.6, color: colors.SECONDARY },
  { key: 'confident', label: 'confident execution', score: 0.72, color: colors.NEGATIVE },
] as const;
const ROUNDS = 16;
const popHist: number[][] = (() => {
  let pop = [1 / 3, 1 / 3, 1 / 3];
  const hist = [pop.slice()];
  for (let t = 0; t < ROUNDS; t++) {
    const avg = pop.reduce((a, p, i) => a + p * STRATS[i].score, 0);
    pop = pop.map((p, i) => (p * STRATS[i].score) / avg);
    hist.push(pop.slice());
  }
  return hist;
})();
// endpoint sanity: popHist[16] ≈ [0.001, 0.051, 0.948]

// ---------------------------------------------------------------------------
// S4 — recursive oversight: auditor catch-rate decay, precomputed.
// ---------------------------------------------------------------------------
const AUDIT_ROUNDS = 20;
const catchHist: number[] = (() => {
  const sc = { strict: 0.62, stamp: 0.72 };
  let strict = 0.5;
  const hist: number[] = [];
  for (let t = 0; t <= AUDIT_ROUNDS; t++) {
    hist.push(strict * 0.9);
    const avg = strict * sc.strict + (1 - strict) * sc.stamp;
    strict = (strict * sc.strict) / avg;
  }
  return hist;
})();
// endpoint sanity: 45.0% → 4.3%

// stacked-area layout for S3
const REP = { x: 140, y: 330, w: 460, h: 220 };
const stackPath = (upto: number, u: number): string[] => {
  // returns per-strategy polygon paths of the stacked area up to fraction u of rounds
  const nPts = Math.max(2, Math.round((ROUNDS + 1) * u));
  const xs = Array.from({ length: nPts }, (_, i) => REP.x + (i / ROUNDS) * REP.w);
  const paths: string[] = [];
  for (let sIdx = 0; sIdx < 3; sIdx++) {
    const top: string[] = [];
    const bot: string[] = [];
    for (let i = 0; i < nPts; i++) {
      const p = popHist[i];
      const y0 = p.slice(0, sIdx).reduce((a, b) => a + b, 0);
      const y1 = y0 + p[sIdx];
      bot.push(`${xs[i]},${REP.y + REP.h - y0 * REP.h}`);
      top.push(`${xs[i]},${REP.y + REP.h - y1 * REP.h}`);
    }
    paths.push([...bot, ...top.reverse()].join(' '));
  }
  return paths.slice(0, upto + 1);
};

// audit curve layout
const AUD = { x: 730, y: 330, w: 420, h: 220 };
const auditPts = (u: number) => {
  const n = Math.max(2, Math.round((AUDIT_ROUNDS + 1) * u));
  return Array.from({ length: n }, (_, i) =>
    `${AUD.x + (i / AUDIT_ROUNDS) * AUD.w},${AUD.y + AUD.h - catchHist[i] * AUD.h}`,
  ).join(' ');
};

// fits the 6.4 card (world x 140) and the 6.6 citation line (ends ≈ x 1155)
const CAM_TOP: CameraState = { x: 647, y: 190, k: 1.15 };
const CAM_REP: CameraState = { x: REP.x + REP.w / 2, y: REP.y + REP.h / 2 - 40, k: 1.25 };
const CAM_AUD: CameraState = { x: AUD.x + AUD.w / 2, y: AUD.y + AUD.h / 2 - 40, k: 1.25 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  narrU: ChannelRef<number>;
  injU: ChannelRef<number>;
  injFlowU: ChannelRef<number>;
  repAxesU: ChannelRef<number>;
  repU: ChannelRef<number>;
  repLblU: ChannelRef<number>;
  audAxesU: ChannelRef<number>;
  audU: ChannelRef<number>;
  stampU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const narrU = tl.channel('narrU', 0);
  const injU = tl.channel('injU', 0);
  const injFlowU = tl.channel('injFlowU', 0);
  const repAxesU = tl.channel('repAxesU', 0);
  const repU = tl.channel('repU', 0);
  const repLblU = tl.channel('repLblU', 0);
  const audAxesU = tl.channel('audAxesU', 0);
  const audU = tl.channel('audU', 0);
  const stampU = tl.channel('stampU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — narrative capture.
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Four modes remain, and these the paper aims straight at AI assistants. Fifth: narrative capture, or performative alignment. The system optimizes for what evaluators will accept, not for what is coherent.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_TOP, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(narrU, 1, { at: 1.8, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 6.8,
    dur: 4.6,
    text: 'The paper cites the sycophancy findings behind this — preference tuning amplifying agreement with the user over truthfulness. This shelf has a whole book on that; here it is one tile in a larger regime.',
  });
  tl.hold(11.4, 0.7);

  // Beat 2 — boundary confusion.
  tl.caption({
    at: 12.1,
    dur: 6.4,
    text: 'Sixth: boundary confusion — and here the abstract regime touches concrete exploits. A web page the assistant merely reads slides an instruction into the channel reserved for its principal. Prompt injection is trust-chain mimicry running on silicon.',
  });
  tl.tween(injU, 1, { at: 13.2, dur: 1.2, ease: ease.enter });
  tl.tween(injFlowU, 1, { at: 15.0, dur: 2.4, ease: ease.linear });
  tl.hold(18.5, 0.7);

  // Beat 3 — refusal penalty inversion: the toy preference model.
  tl.caption({
    at: 19.2,
    dur: 6.6,
    text: 'Seventh, and sharpest: refusal penalty inversion. The paper claims standard preference models reward confidently executing an incoherent task above refusing it. Let us make that selection pressure visible with a toy model.',
  });
  tl.tween(cam, CAM_REP, { at: 20.0, dur: 1.5, ease: ease.move });
  tl.tween(repAxesU, 1, { at: 21.4, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 25.8,
    dur: 6.8,
    text: 'Three response styles start with equal shares: honest refusal, hedging, and confident execution of a task that makes no sense. The preference model scores fluency and confidence. Round after round, winners are copied.',
  });
  tl.tween(repU, 1, { at: 27.6, dur: 4.4, ease: ease.linear });
  tl.caption({
    at: 32.6,
    dur: 6.2,
    text: 'By round sixteen, confident execution holds ninety five percent of the population. Honest refusal is measured in tenths of a percent. Nothing dramatic happened — just a scoring rule, applied consistently.',
  });
  tl.tween(repLblU, 1, { at: 33.4, dur: 0.9, ease: ease.pop });
  tl.hold(38.8, 0.7);

  // Beat 4 — recursive oversight failure.
  tl.caption({
    at: 39.5,
    dur: 6.6,
    text: 'Now the eighth mode closes the loop: recursive oversight failure. Add an auditor to catch all this — but the auditor lives in the same regime. Suppose strict review is slower, and auditors are scored on throughput.',
  });
  tl.tween(cam, CAM_AUD, { at: 40.2, dur: 1.5, ease: ease.move });
  tl.tween(audAxesU, 1, { at: 41.6, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 46.3,
    dur: 6.4,
    text: 'Same replicator, one level up. The catch rate starts at forty five percent and decays to about four. Oversight still runs, stamps still land — the paper calls what gets certified coherence theater.',
  });
  tl.tween(audU, 1, { at: 47.2, dur: 3.8, ease: ease.linear });
  tl.tween(stampU, 1, { at: 51.4, dur: 0.8, ease: ease.pop });
  tl.hold(52.7, 0.8);

  // Beat 5 — close.
  tl.caption({
    at: 53.5,
    dur: 5.8,
    text: 'Eight modes, one signature: every layer that should correct the system inherits the incentives that broke it. Which leaves the paper one question — what would evaluation have to look like instead?',
  });
  tl.tween(cam, CAMERA_HOME, { at: 53.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 54.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.0, dur: 1.0, ease: ease.enter });
  tl.hold(59.3, 1.2);

  return {
    tl, cam, titleU, narrU, injU, injFlowU, repAxesU, repU, repLblU,
    audAxesU, audU, stampU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/aei-taxonomy-two/overrides.json',
  slug: 'aei-taxonomy-two',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const narrU = s.get(scene.narrU);
  const injU = s.get(scene.injU);
  const injFlowU = s.get(scene.injFlowU);
  const repAxesU = s.get(scene.repAxesU);
  const repU = s.get(scene.repU);
  const repLblU = s.get(scene.repLblU);
  const audAxesU = s.get(scene.audAxesU);
  const audU = s.get(scene.audU);
  const stampU = s.get(scene.stampU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const fadeTop = 1 - 0.75 * clamp01(repAxesU * 2);
  const endPop = popHist[ROUNDS];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <g opacity={fadeTop}>
            {/* 6.4 narrative capture */}
            {narrU > 0 && (
              <g opacity={narrU}>
                <text x={140} y={110} fill={colors.SECONDARY} fontSize={15} fontWeight={600}>
                  6.4 narrative capture / performative alignment
                </text>
                <rect x={140} y={128} width={430} height={96} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={160} y={158} fill={colors.TEXT} fontSize={13}>
                  optimize: acceptability to evaluators
                </text>
                <text x={160} y={182} fill={colors.MUTED} fontSize={13}>
                  not: coherence
                </text>
                <text x={160} y={208} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                  sycophancy under preference tuning — Sharma et al. 2023
                </text>
              </g>
            )}

            {/* 6.6 boundary confusion */}
            {injU > 0 && (
              <g opacity={injU}>
                <text x={680} y={110} fill={colors.NEGATIVE} fontSize={15} fontWeight={600}>
                  6.6 boundary confusion — prompt injection
                </text>
                <rect x={680} y={128} width={140} height={64} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={750} y={155} textAnchor="middle" fill={colors.MUTED} fontSize={12}>web page</text>
                <text x={750} y={175} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily="monospace">"ignore previous…"</text>
                <rect x={900} y={128} width={120} height={64} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} />
                <text x={960} y={155} textAnchor="middle" fill={colors.ACCENT} fontSize={12}>assistant</text>
                <text x={960} y={175} textAnchor="middle" fill={colors.MUTED} fontSize={11}>instruction channel</text>
                <line x1={820} y1={160} x2={900} y2={160} stroke={colors.GRID} strokeWidth={1.5} />
                {injFlowU > 0 && (
                  <circle cx={820 + 80 * clamp01(injFlowU)} cy={160} r={6} fill={colors.NEGATIVE} opacity={injFlowU < 1 ? 1 : 0.4} />
                )}
                <text x={680} y={218} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                  data crosses into instruction — Perez &amp; Ribeiro 2022; Greshake et al. 2023
                </text>
              </g>
            )}
          </g>

          {/* 6.8 refusal penalty inversion — stacked replicator */}
          {repAxesU > 0 && (
            <g opacity={repAxesU}>
              <text x={REP.x} y={REP.y - 60} fill={colors.NEGATIVE} fontSize={16} fontWeight={600}>
                6.8 refusal penalty inversion
              </text>
              <text x={REP.x} y={REP.y - 38} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                illustrative — replicator under a toy preference model (scores .45 / .60 / .72)
              </text>
              <line x1={REP.x} y1={REP.y + REP.h} x2={REP.x + REP.w} y2={REP.y + REP.h} stroke={colors.GRID} strokeWidth={1.5} />
              {repU > 0 && stackPath(2, repU).map((d, i) => (
                <polygon key={i} points={d} fill={STRATS[i].color} opacity={0.5} stroke={STRATS[i].color} strokeWidth={1} />
              ))}
              <text x={REP.x} y={REP.y + REP.h + 24} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                round 0 — equal thirds
              </text>
              {repLblU > 0 && (
                <g opacity={repLblU}>
                  <text x={REP.x + REP.w + 10} y={REP.y + 30} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                    confident {Math.round(endPop[2] * 1000) / 10}%
                  </text>
                  <text x={REP.x + REP.w + 10} y={REP.y + REP.h - 24} fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
                    hedge {Math.round(endPop[1] * 1000) / 10}%
                  </text>
                  <text x={REP.x + REP.w + 10} y={REP.y + REP.h - 2} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                    refusal {Math.round(endPop[0] * 1000) / 10}%
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 6.7 recursive oversight failure */}
          {audAxesU > 0 && (
            <g opacity={audAxesU}>
              <text x={AUD.x} y={AUD.y - 60} fill={colors.WARM} fontSize={16} fontWeight={600}>
                6.7 recursive oversight failure
              </text>
              <text x={AUD.x} y={AUD.y - 38} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                illustrative — auditors scored on throughput (strict .62 vs stamp .72)
              </text>
              <line x1={AUD.x} y1={AUD.y + AUD.h} x2={AUD.x + AUD.w} y2={AUD.y + AUD.h} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={AUD.x} y1={AUD.y} x2={AUD.x} y2={AUD.y + AUD.h} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={AUD.x - 8} y={AUD.y + 8} textAnchor="end" fill={colors.MUTED} fontSize={11}>
                catch rate
              </text>
              {audU > 0 && (
                <polyline points={auditPts(audU)} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
              )}
              {audU > 0.05 && (
                <text x={AUD.x + 8} y={AUD.y + AUD.h - catchHist[0] * AUD.h - 10} fill={colors.WARM} fontSize={12} fontFamily="monospace">
                  45%
                </text>
              )}
              {audU >= 1 && (
                <text x={AUD.x + AUD.w - 4} y={AUD.y + AUD.h - catchHist[AUDIT_ROUNDS] * AUD.h - 10} textAnchor="end" fill={colors.WARM} fontSize={12} fontFamily="monospace">
                  4.3%
                </text>
              )}
              {stampU > 0 && (
                <g opacity={stampU} transform={`rotate(-12, ${AUD.x + AUD.w / 2}, ${AUD.y + 80})`}>
                  <rect x={AUD.x + AUD.w / 2 - 130} y={AUD.y + 56} width={260} height={48} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
                  <text x={AUD.x + AUD.w / 2} y={AUD.y + 88} textAnchor="middle" fill={colors.NEGATIVE} fontSize={20} fontWeight={700} letterSpacing={3}>
                    COHERENCE THEATER
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The taxonomy, part two
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
          SSRN 6325939 §6.4, §6.6–6.8
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={225} width={860} height={200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The correctors inherit the corruption
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            narrative capture · boundary confusion · refusal inversion · oversight failure
          </text>
          <text x={640} y={378} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            SSRN 6325939 §6 — replicator + audit sims illustrative
          </text>
        </g>
      )}
    </>
  );
}

export function AeiTaxonomyTwo() {
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
