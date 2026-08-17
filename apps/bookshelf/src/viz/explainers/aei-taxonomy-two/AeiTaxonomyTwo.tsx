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
//
// STAGING — one ROOM per failure mode on a 2-D world grid, 1600/900 apart, so
// no two modes can share a frame and every beat starts on a clean background.
import {
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

const CAM_NARR = camAt(0, 0, 1.06);
const CAM_INJ = camAt(1, 0, 1.08);
const CAM_REP = camAt(2, 0);
const CAM_AUD = camAt(2, 1, 1.05);
const CAM_CLOSE = camAt(1, 1);

const FIG = '/generated/ssrn-aei/figures';

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

// stacked-area layout for S3 (room 2,0)
const REP = { x: 220, y: 150, w: 600, h: 240 };
const stackPath = (upto: number, u: number): string[] => {
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

// audit curve layout (room 2,1)
const AUD = { x: 300, y: 200, w: 560, h: 260 };
const auditPts = (u: number) => {
  const n = Math.max(2, Math.round((AUDIT_ROUNDS + 1) * u));
  return Array.from({ length: n }, (_, i) =>
    `${AUD.x + (i / AUDIT_ROUNDS) * AUD.w},${AUD.y + AUD.h - catchHist[i] * AUD.h}`,
  ).join(' ');
};

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  narrU: ChannelRef<number>;
  sycU: ChannelRef<number>;
  injU: ChannelRef<number>;
  injFlowU: ChannelRef<number>;
  repAxesU: ChannelRef<number>;
  repU: ChannelRef<number>;
  repLblU: ChannelRef<number>;
  refFigU: ChannelRef<number>;
  audAxesU: ChannelRef<number>;
  audU: ChannelRef<number>;
  stampU: ChannelRef<number>;
  closeU: ChannelRef<number>;
  taxFigU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_NARR, cameraInterp);
  const narrU = tl.channel('narrU', 0);
  const sycU = tl.channel('sycU', 0);
  const injU = tl.channel('injU', 0);
  const injFlowU = tl.channel('injFlowU', 0);
  const repAxesU = tl.channel('repAxesU', 0);
  const repU = tl.channel('repU', 0);
  const repLblU = tl.channel('repLblU', 0);
  const refFigU = tl.channel('refFigU', 0);
  const audAxesU = tl.channel('audAxesU', 0);
  const audU = tl.channel('audU', 0);
  const stampU = tl.channel('stampU', 0);
  const closeU = tl.channel('closeU', 0);
  const taxFigU = tl.channel('taxFigU', 0);

  // Beat 1 — ROOM (0,0): §6.4 narrative capture.
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Four modes remain, and these the paper aims straight at AI assistants. Fifth: narrative capture, or performative alignment. The system optimizes for what evaluators will accept, not for what is coherent.',
  });
  tl.tween(narrU, 1, { at: 0.6, dur: 1.2, ease: ease.enter });

  // Beat 2 — same room: the sycophancy lineage.
  tl.caption({
    at: 6.8,
    dur: 4.6,
    text: 'The paper cites the sycophancy findings behind this — preference tuning amplifying agreement with the user over truthfulness. This shelf has a whole book on that; here it is one tile in a larger regime.',
  });
  tl.tween(sycU, 1, { at: 6.2, dur: 1.2, ease: ease.enter });
  tl.hold(11.4, 0.7);

  // Beat 3 — ROOM (1,0): §6.6 boundary confusion.
  tl.caption({
    at: 12.1,
    dur: 6.4,
    text: 'Sixth: boundary confusion — and here the abstract regime touches concrete exploits. A web page the assistant merely reads slides an instruction into the channel reserved for its principal. Prompt injection is trust-chain mimicry running on silicon.',
  });
  // Each room change starts ~1.5s BEFORE its line, so the camera has settled
  // and the room is dressed by the time the narration reaches it.
  tl.tween(cam, CAM_INJ, { at: 10.6, dur: 1.4, ease: ease.move });
  tl.tween(injU, 1, { at: 10.9, dur: 1.0, ease: ease.enter });
  tl.tween(injFlowU, 1, { at: 13.4, dur: 2.4, ease: ease.linear });
  tl.hold(18.5, 0.7);

  // Beat 4 — ROOM (2,0): §6.8 refusal penalty inversion.
  tl.caption({
    at: 19.2,
    dur: 6.6,
    text: 'Seventh, and sharpest: refusal penalty inversion. The paper claims standard preference models reward confidently executing an incoherent task above refusing it. Let us make that selection pressure visible with a toy model.',
  });
  tl.tween(cam, CAM_REP, { at: 17.7, dur: 1.4, ease: ease.move });
  tl.tween(repAxesU, 1, { at: 18.0, dur: 1.0, ease: ease.draw });
  tl.tween(refFigU, 1, { at: 18.6, dur: 0.9, ease: ease.enter });

  // Beat 5 — same room: run the replicator.
  tl.caption({
    at: 25.8,
    dur: 6.8,
    text: 'Three response styles start with equal shares: honest refusal, hedging, and confident execution of a task that makes no sense. The preference model scores fluency and confidence. Round after round, winners are copied.',
  });
  tl.tween(repU, 1, { at: 27.6, dur: 4.4, ease: ease.linear });

  // Beat 6 — same room: the endpoint.
  tl.caption({
    at: 32.6,
    dur: 6.2,
    text: 'By round sixteen, confident execution holds ninety five percent of the population. Honest refusal is measured in tenths of a percent. Nothing dramatic happened — just a scoring rule, applied consistently.',
  });
  tl.tween(repLblU, 1, { at: 33.4, dur: 0.9, ease: ease.pop });
  tl.hold(38.8, 0.7);

  // Beat 7 — ROOM (2,1): §6.7 recursive oversight failure.
  tl.caption({
    at: 39.5,
    dur: 6.6,
    text: 'Now the eighth mode closes the loop: recursive oversight failure. Add an auditor to catch all this — but the auditor lives in the same regime. Suppose strict review is slower, and auditors are scored on throughput.',
  });
  tl.tween(cam, CAM_AUD, { at: 38.0, dur: 1.4, ease: ease.move });
  tl.tween(audAxesU, 1, { at: 38.3, dur: 1.0, ease: ease.draw });

  // Beat 8 — same room: the decay, and the stamp.
  tl.caption({
    at: 46.3,
    dur: 6.4,
    text: 'Same replicator, one level up. The catch rate starts at forty five percent and decays to about four. Oversight still runs, stamps still land — the paper calls what gets certified coherence theater.',
  });
  tl.tween(audU, 1, { at: 45.4, dur: 3.8, ease: ease.linear });
  tl.tween(stampU, 1, { at: 49.2, dur: 0.8, ease: ease.pop });
  tl.hold(52.7, 0.8);

  // Beat 9 — ROOM (1,1): the close, on an empty stage.
  tl.caption({
    at: 53.5,
    dur: 5.8,
    text: 'Eight modes, one signature: every layer that should correct the system inherits the incentives that broke it. Which leaves the paper one question — what would evaluation have to look like instead?',
  });
  tl.tween(cam, CAM_CLOSE, { at: 52.0, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 52.3, dur: 1.0, ease: ease.enter });
  tl.tween(taxFigU, 1, { at: 52.6, dur: 0.9, ease: ease.enter });
  tl.hold(59.3, 1.2);

  return {
    tl, cam, narrU, sycU, injU, injFlowU, repAxesU, repU, repLblU, refFigU,
    audAxesU, audU, stampU, closeU, taxFigU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/aei-taxonomy-two/overrides.json',
  slug: 'aei-taxonomy-two',
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
  const narrU = s.get(scene.narrU);
  const sycU = s.get(scene.sycU);
  const injU = s.get(scene.injU);
  const injFlowU = s.get(scene.injFlowU);
  const repAxesU = s.get(scene.repAxesU);
  const repU = s.get(scene.repU);
  const repLblU = s.get(scene.repLblU);
  const refFigU = s.get(scene.refFigU);
  const audAxesU = s.get(scene.audAxesU);
  const audU = s.get(scene.audU);
  const stampU = s.get(scene.stampU);
  const closeU = s.get(scene.closeU);
  const taxFigU = s.get(scene.taxFigU);

  const endPop = popHist[ROUNDS];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        {/* ---------- ROOM (0,0) — §6.4 narrative capture ---------- */}
        <g transform={roomAt(0, 0)} opacity={narrU}>
          <RoomHeader title="6.4 — narrative capture" sub="SSRN 6325939 §6.4 · performative alignment" />
          <rect x={240} y={170} width={800} height={190} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={228} textAnchor="middle" fill={colors.SECONDARY} fontSize={22} fontWeight={600}>
            optimize: acceptability to evaluators
          </text>
          <text x={640} y={276} textAnchor="middle" fill={colors.MUTED} fontSize={20}>
            not: coherence
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily="monospace">
            the system plays to whoever is scoring it
          </text>
          {sycU > 0 && (
            <g opacity={sycU}>
              <text x={640} y={422} textAnchor="middle" fill={colors.NEGATIVE} fontSize={19}>
                preference tuning amplifies agreement-with-user over truthfulness
              </text>
              <text x={640} y={454} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily="monospace">
                sycophancy — Sharma et al. 2023
              </text>
            </g>
          )}
        </g>

        {/* ---------- ROOM (1,0) — §6.6 boundary confusion ---------- */}
        <g transform={roomAt(1, 0)} opacity={injU}>
          <RoomHeader
            title="6.6 — boundary confusion"
            sub="SSRN 6325939 §6.6 · Perez &amp; Ribeiro 2022; Greshake et al. 2023"
          />
          <rect x={190} y={230} width={300} height={130} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={340} y={272} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            a web page — data
          </text>
          <text x={340} y={314} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16} fontFamily="monospace">
            “ignore previous…”
          </text>
          <rect x={800} y={230} width={290} height={130} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} />
          <text x={945} y={272} textAnchor="middle" fill={colors.ACCENT} fontSize={16}>
            the assistant
          </text>
          <text x={945} y={314} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            instruction channel
          </text>
          <line x1={490} y1={295} x2={800} y2={295} stroke={colors.GRID} strokeWidth={2} />
          {injFlowU > 0 && (
            <circle cx={490 + 310 * clamp01(injFlowU)} cy={295} r={8}
              fill={colors.NEGATIVE} opacity={injFlowU < 1 ? 1 : 0.45} />
          )}
          <text x={640} y={430} textAnchor="middle" fill={colors.NEGATIVE} fontSize={18}>
            data crosses into the instruction channel
          </text>
          <text x={640} y={462} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            trust-chain mimicry, running on silicon
          </text>
        </g>

        {/* ---------- ROOM (2,0) — §6.8 refusal penalty inversion ---------- */}
        <g transform={roomAt(2, 0)} opacity={repAxesU}>
          <RoomHeader
            title="6.8 — refusal penalty inversion"
            sub="illustrative replicator · toy preference scores .45 / .60 / .72"
          />
          <line x1={REP.x} y1={REP.y + REP.h} x2={REP.x + REP.w} y2={REP.y + REP.h}
            stroke={colors.GRID} strokeWidth={1.5} />
          {repU > 0 && stackPath(2, repU).map((d, i) => (
            <polygon key={i} points={d} fill={STRATS[i].color} opacity={0.5}
              stroke={STRATS[i].color} strokeWidth={1} />
          ))}
          <text x={REP.x} y={REP.y + REP.h + 26} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
            round 0 — equal thirds → round 16
          </text>
          {repLblU > 0 && (
            <g opacity={repLblU}>
              <text x={REP.x + REP.w + 14} y={REP.y + 34} fill={colors.NEGATIVE} fontSize={15} fontFamily="monospace">
                confident {Math.round(endPop[2] * 1000) / 10}%
              </text>
              <text x={REP.x + REP.w + 14} y={REP.y + REP.h - 26} fill={colors.SECONDARY} fontSize={15} fontFamily="monospace">
                hedge {Math.round(endPop[1] * 1000) / 10}%
              </text>
              <text x={REP.x + REP.w + 14} y={REP.y + REP.h - 2} fill={colors.POSITIVE} fontSize={15} fontFamily="monospace">
                refusal {Math.round(endPop[0] * 1000) / 10}%
              </text>
            </g>
          )}
          <Figure
            src={`${FIG}/refusal.png`}
            x={290} y={430} w={700} h={119}
            reveal={refFigU} opacity={refFigU}
            accent={colors.WARM}
          />
        </g>

        {/* ---------- ROOM (2,1) — §6.7 recursive oversight failure ---------- */}
        <g transform={roomAt(2, 1)} opacity={audAxesU}>
          <RoomHeader
            title="6.7 — recursive oversight failure"
            sub="illustrative — auditors scored on throughput (strict .62 vs stamp .72)"
          />
          <line x1={AUD.x} y1={AUD.y + AUD.h} x2={AUD.x + AUD.w} y2={AUD.y + AUD.h}
            stroke={colors.GRID} strokeWidth={1.5} />
          <line x1={AUD.x} y1={AUD.y} x2={AUD.x} y2={AUD.y + AUD.h}
            stroke={colors.GRID} strokeWidth={1.5} />
          <text x={AUD.x - 12} y={AUD.y + 8} textAnchor="end" fill={colors.MUTED} fontSize={14}>
            catch rate
          </text>
          {audU > 0 && (
            <polyline points={auditPts(audU)} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
          )}
          {audU > 0.05 && (
            <text x={AUD.x + 10} y={AUD.y + AUD.h - catchHist[0] * AUD.h - 12}
              fill={colors.WARM} fontSize={14} fontFamily="monospace">
              45%
            </text>
          )}
          {audU >= 1 && (
            <text x={AUD.x + AUD.w - 4} y={AUD.y + AUD.h - catchHist[AUDIT_ROUNDS] * AUD.h - 12}
              textAnchor="end" fill={colors.WARM} fontSize={14} fontFamily="monospace">
              4.3%
            </text>
          )}
          <text x={AUD.x} y={AUD.y + AUD.h + 34} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
            audit rounds →
          </text>
          {stampU > 0 && (
            <g opacity={stampU} transform={`rotate(-12, ${AUD.x + AUD.w / 2}, ${AUD.y + 90})`}>
              <rect x={AUD.x + AUD.w / 2 - 165} y={AUD.y + 62} width={330} height={58} rx={8}
                fill={colors.BG} fillOpacity={0.85} stroke={colors.NEGATIVE} strokeWidth={3} />
              <text x={AUD.x + AUD.w / 2} y={AUD.y + 101} textAnchor="middle" fill={colors.NEGATIVE}
                fontSize={24} fontWeight={700} letterSpacing={3}>
                COHERENCE THEATER
              </text>
            </g>
          )}
        </g>

        {/* ---------- ROOM (1,1) — the close, on an empty stage ---------- */}
        <g transform={roomAt(1, 1)}>
          <g opacity={closeU}>
            <rect x={90} y={190} width={740} height={230} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={460} y={256} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
              The correctors inherit the corruption
            </text>
            <text x={460} y={302} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
              narrative capture · boundary confusion
            </text>
            <text x={460} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
              refusal inversion · oversight failure
            </text>
            <text x={460} y={378} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
              SSRN 6325939 §6 — sims illustrative
            </text>
          </g>
          <Figure
            src={`${FIG}/taxonomy-two.png`}
            x={890} y={170} w={300} h={269}
            reveal={taxFigU} opacity={taxFigU}
            accent={colors.WARM}
            caption="§6.4–6.7, as published"
          />
        </g>
      </Camera>
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
