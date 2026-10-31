// Which answer, or no answer?
//
// Jeva: Fresh Decisions — chapter 2. Authored by Claude Fable 5.1 (claude-fable-5-1) from the
// Astra visual plan; captions are the fixed narration contract (verbatim).
//
// Source pin: LiQiiiii/Jeva@f231c9ac31ba72f2ca4ca8aac662b279f3438fdb
//   src/jeva/_runtime/matrix_decision.py 385–410  forward_from_cache: scores = z_read · option_read,
//                                               q = softmax(scores / tau_dec), coverage =
//                                               sigmoid((max score − coverage_bias) / tau_cov),
//                                               p_null = 1 − coverage, p_candidates = coverage · q
//   src/jeva/inference.py 163–180            typed questions: Choice / Noul (["false","true"],
//                                               positive_index 1) / Score (rubric values)
//   src/jeva/inference.py 250–270            probabilities = (1 − p_null)·q; choice = None when
//                                               allow_null and p_null >= probabilities[best];
//                                               noul = q[positive_index]; score = Σ q_i · v_i
//   paper arXiv:2610.18773v1 §3.3 (Figure 4, Proposition 2), Appendix A.3
//
// Every number on screen is an ILLUSTRATIVE final-score example (the paper's Figure 4 setting:
// tau_dec = 0.20, tau_cov = 0.15, b_cov = 0.50), computed at module scope — never a trained
// model's prediction. The Noul and Score readouts use their own independent illustrative q.
import type { ReactNode } from 'react';
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Axes, FunctionPlot, NumberLine, Vec } from '../../primitives';
import { scaleLinear } from 'd3';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The arithmetic (module scope, exact)
// ---------------------------------------------------------------------------

const TAU_DEC = 0.2;
const TAU_COV = 0.15;
const B_COV = 0.5;
const HIGH = { a: 0.8, b: 0.6 };
const LOW = { a: 0.3, b: 0.1 };
const S_C = 0.4;

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
function softmax(xs: number[], tau: number): number[] {
  const mx = Math.max(...xs);
  const ex = xs.map((x) => Math.exp((x - mx) / tau));
  const sum = ex.reduce((p, c) => p + c, 0);
  return ex.map((e) => e / sum);
}
/** q, coverage rho, p_candidates and p_null for a list of final scores (forward_from_cache). */
function decide(scores: number[]) {
  const q = softmax(scores, TAU_DEC);
  const rho = sigmoid((Math.max(...scores) - B_COV) / TAU_COV);
  return { q, rho, p: q.map((v) => rho * v), pNull: 1 - rho };
}
const RHO_OF = (sMax: number): number => sigmoid((sMax - B_COV) / TAU_COV);

// independent illustrative typed readouts (inference.py 265–270)
const NOUL_Q = [0.2, 0.8]; // options ["false", "true"], positive_index = 1
const NOUL_OUT = NOUL_Q[1];
const SCORE_Q = [0.2, 0.3, 0.5];
const SCORE_V = [0, 1, 2];
const SCORE_OUT = SCORE_Q.reduce((p, c, i) => p + c * SCORE_V[i], 0); // 1.3

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band; title y38, source chip y80)
// ---------------------------------------------------------------------------

const RULER_Y = 272;
const SX = scaleLinear([-0.2, 1.0], [180, 1100]);
const RIB = { x: 180, y: 340, w: 920, h: 56 };
const LABEL_Y = RIB.y + RIB.h + 26;

// lower-left: the coverage sigmoid
const SIG_X = scaleLinear([0, 1], [200, 560]);
const SIG_Y = scaleLinear([0, 1], [585, 475]);
// lower-right: the coverage meter + formula
const METER = { x: 660, y: 482, w: 440, h: 22 };
const EQ = { x: 880, y: 556 };

const COL = {
  A: colors.ACCENT,
  B: colors.SECONDARY,
  C: colors.WARM,
  NULL: colors.NEGATIVE,
  FALSE: '#8da2be',
  TRUE: colors.POSITIVE,
  V0: colors.ACCENT,
  V1: colors.TEAL,
  V2: colors.POSITIVE,
};

const CAM_RULER: CameraState = { x: 640, y: 320, k: 1.12 };
const CAM_WIDE: CameraState = { x: 640, y: 395, k: 1.0 };
const CAM_LOWER: CameraState = { x: 640, y: 420, k: 1.04 };
const CAM_LEFT: CameraState = { x: 560, y: 420, k: 1.06 };

const PIN = 'LiQiiiii/Jeva@f231c9ac31ba72f2ca4ca8aac662b279f3438fdb';
const SOURCES = [
  '_runtime/matrix_decision.py:391-404 · paper §3.3',
  '_runtime/matrix_decision.py:391-397 · q = softmax(scores/tau_dec)',
  '_runtime/matrix_decision.py:391-404 · paper Fig. 4(a)',
  '_runtime/matrix_decision.py:399-403 · coverage sigmoid',
  '_runtime/matrix_decision.py:399-404 · illustrative scores',
  '_runtime/matrix_decision.py:399-410 · p_null, p_candidates',
  '_runtime/matrix_decision.py:391-404 · paper §3.3 Prop. 2',
  '_runtime/matrix_decision.py:366-388 · state precedes scores',
  'inference.py:250-270 · closed / open Choice, null tie',
  'inference.py:163-180, 265-270 · Noul and Score readouts',
  '_runtime/matrix_decision.py:391-410',
];

// ---------------------------------------------------------------------------
// Timeline — 88 s, eleven fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const src = tl.channel('src', 0);

  const rulerU = tl.channel('rulerU', 0);
  const markU = tl.channel('markU', 0);
  const ribbonU = tl.channel('ribbonU', 0);
  const plantU = tl.channel('plantU', 0); // "best available ≠ available answer"
  const sA = tl.channel('sA', HIGH.a);
  const sB = tl.channel('sB', HIGH.b);
  const cU = tl.channel('cU', 0); // third candidate present
  const gapU = tl.channel('gapU', 0);
  const thrU = tl.channel('thrU', 0); // threshold marker: 0 hidden, 0.3 dim, 1 lit
  const distU = tl.channel('distU', 0); // max-score → threshold bracket
  const sigU = tl.channel('sigU', 0);
  const meterU = tl.channel('meterU', 0);
  const splitU = tl.channel('splitU', 0); // ribbon: q only → rho·q + null
  const ghostU = tl.channel('ghostU', 0); // translucent before-state markers
  const sumU = tl.channel('sumU', 0); // "= 1" + null-wins badge
  const lockU = tl.channel('lockU', 0); // lock chip: 0 hidden, 1 closed, 2 open
  const repU = tl.channel('repU', 0); // mini state reprise: C added, z moves
  const shiftU = tl.channel('shiftU', 0); // illustrative score shift on the ruler
  const lowerDim = tl.channel('lowerDim', 0);
  const readU = tl.channel('readU', 0); // readout toggle labels
  const tieU = tl.channel('tieU', 0);
  const typedU = tl.channel('typedU', 0); // 0 choice → 1 Noul → 2 Score
  const pivotU = tl.channel('pivotU', 0);
  const eqQ = tl.channel('eqQ', 0);
  const eqRho = tl.channel('eqRho', 0);
  const eqP = tl.channel('eqP', 0);
  const stageDim = tl.channel('stageDim', 0);
  const closeU = tl.channel('closeU', 0);

  for (let i = 0; i < SOURCES.length; i++) tl.set(src, i, 0.5 + i * 8 - 0.1);

  // — beat 0 · a favorite among poor options —
  tl.caption({ at: 0.5, dur: 7.2, text: "A favorite among poor options can still be a poor answer. Jeva separates competition between candidates from coverage of the request." });
  tl.tween(rulerU, 1, { at: 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(markU, 1, { at: 1.8, dur: 0.8, ease: ease.enter });
  tl.tween(ribbonU, 1, { at: 2.8, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 330, k: 1.04 }, { at: 0.8, dur: 1.8, ease: ease.move });
  tl.tween(plantU, 1, { at: 4.6, dur: 0.6, ease: ease.enter });

  // — beat 1 · competition: differences → relative probabilities —
  tl.caption({ at: 8.5, dur: 7.2, text: "Competition turns score differences into relative probabilities. In this illustrative example, the first option gets about seventy three percent." });
  tl.tween(cam, CAM_RULER, { at: 8.3, dur: 1.3, ease: ease.move });
  tl.tween(plantU, 0, { at: 8.3, dur: 0.5, ease: ease.move });
  tl.tween(gapU, 1, { at: 9.0, dur: 1.0, ease: ease.draw });
  tl.tween(eqQ, 1, { at: 10.4, dur: 0.6, ease: ease.enter });

  // — beat 2 · lower both scores: q does not move —
  tl.caption({ at: 16.5, dur: 7.2, text: "Lower both scores by the same amount. Their relative probabilities do not move, although their absolute support has fallen." });
  tl.tween(sA, LOW.a, { at: 17.0, dur: 1.4, ease: ease.move });
  tl.tween(sB, LOW.b, { at: 17.0, dur: 1.4, ease: ease.move });
  tl.tween(thrU, 0.3, { at: 19.0, dur: 0.6, ease: ease.enter });

  // — beat 3 · coverage: the strongest score against a learned threshold —
  tl.caption({ at: 24.5, dur: 7.2, text: "Coverage looks at the strongest final score against a learned threshold. A sigmoid converts that margin into an estimate of answer availability." });
  tl.tween(cam, CAM_WIDE, { at: 24.3, dur: 1.3, ease: ease.move });
  tl.tween(eqQ, 0, { at: 24.3, dur: 0.5, ease: ease.move });
  tl.tween(sA, HIGH.a, { at: 24.5, dur: 0.9, ease: ease.move });
  tl.tween(sB, HIGH.b, { at: 24.5, dur: 0.9, ease: ease.move });
  tl.tween(thrU, 1, { at: 25.4, dur: 0.6, ease: ease.enter });
  tl.tween(distU, 1, { at: 26.0, dur: 0.9, ease: ease.draw });
  tl.tween(sigU, 1, { at: 27.0, dur: 1.4, ease: ease.draw });
  tl.tween(meterU, 1, { at: 28.2, dur: 0.8, ease: ease.enter });
  tl.tween(eqRho, 1, { at: 28.6, dur: 0.6, ease: ease.enter });

  // — beat 4 · replay high → low: coverage falls, q stays —
  tl.caption({ at: 32.5, dur: 7.2, text: "With the lower scores, coverage falls from about eighty eight percent to twenty one percent. The relative preference still stays the same." });
  tl.tween(ghostU, 1, { at: 32.8, dur: 0.5, ease: ease.enter });
  tl.tween(sA, LOW.a, { at: 33.4, dur: 1.6, ease: ease.move });
  tl.tween(sB, LOW.b, { at: 33.4, dur: 1.6, ease: ease.move });

  // — beat 5 · the ribbon splits: covered mass vs null —
  tl.caption({ at: 40.5, dur: 7.2, text: "For an open choice, coverage scales every candidate probability. The remaining probability belongs to null: no acceptable candidate is present." });
  tl.tween(cam, CAM_LOWER, { at: 40.3, dur: 1.3, ease: ease.move });
  tl.tween(ghostU, 0, { at: 40.3, dur: 0.5, ease: ease.move });
  tl.tween(gapU, 0, { at: 40.3, dur: 0.5, ease: ease.move });
  tl.tween(distU, 0, { at: 40.3, dur: 0.5, ease: ease.move });
  tl.tween(eqRho, 0, { at: 40.3, dur: 0.5, ease: ease.move });
  tl.tween(splitU, 1, { at: 41.0, dur: 1.4, ease: ease.move });
  tl.tween(eqP, 1, { at: 42.6, dur: 0.6, ease: ease.enter });
  tl.tween(sumU, 1, { at: 44.0, dur: 0.6, ease: ease.pop });

  // — beat 6 · restore the high scores, THEN add C = 0.4 at fixed scores —
  tl.caption({ at: 48.5, dur: 7.2, text: "Adding a weaker candidate leaves coverage unchanged when final scores are held fixed. Competition still redistributes probability among the candidates." });
  tl.tween(cam, CAM_WIDE, { at: 48.3, dur: 1.2, ease: ease.move });
  tl.tween(sA, HIGH.a, { at: 48.5, dur: 1.0, ease: ease.move });
  tl.tween(sB, HIGH.b, { at: 48.5, dur: 1.0, ease: ease.move });
  tl.tween(lockU, 1, { at: 49.4, dur: 0.5, ease: ease.enter });
  tl.tween(cU, 1, { at: 49.9, dur: 0.8, ease: ease.enter });

  // — beat 7 · the fixed-score condition opens —
  tl.caption({ at: 56.5, dur: 7.2, text: "That fixed score condition matters. In a full request, adding an option can change the refined state and therefore change the scores." });
  tl.tween(cam, CAM_LEFT, { at: 56.3, dur: 1.3, ease: ease.move });
  tl.tween(eqP, 0, { at: 56.3, dur: 0.5, ease: ease.move });
  tl.tween(sumU, 0, { at: 56.3, dur: 0.5, ease: ease.move });
  tl.tween(lowerDim, 1, { at: 56.5, dur: 0.8, ease: ease.move });
  tl.tween(lockU, 2, { at: 57.2, dur: 0.6, ease: ease.pop });
  tl.tween(repU, 1, { at: 58.2, dur: 1.6, ease: ease.move });
  tl.tween(shiftU, 1, { at: 59.4, dur: 1.2, ease: ease.move });

  // — beat 8 · closed vs open readout —
  tl.caption({ at: 64.5, dur: 7.2, text: "A closed choice selects from the conditional probabilities. An open choice compares candidates and null, with null winning an exact tie." });
  tl.tween(cam, CAM_WIDE, { at: 64.3, dur: 1.3, ease: ease.move });
  tl.tween(repU, 0, { at: 64.3, dur: 0.6, ease: ease.move });
  tl.tween(shiftU, 0, { at: 64.3, dur: 0.8, ease: ease.move });
  tl.tween(lockU, 0, { at: 64.3, dur: 0.5, ease: ease.move });
  tl.tween(lowerDim, 0, { at: 64.3, dur: 0.8, ease: ease.move });
  tl.tween(readU, 1, { at: 65.0, dur: 0.6, ease: ease.enter });
  tl.tween(splitU, 0, { at: 65.4, dur: 1.0, ease: ease.move }); // closed: q only
  tl.tween(splitU, 1, { at: 68.2, dur: 1.0, ease: ease.move }); // open: p and p_null
  tl.tween(tieU, 1, { at: 69.6, dur: 0.6, ease: ease.enter });

  // — beat 9 · Noul, then Score (staged halves) —
  tl.caption({ at: 72.5, dur: 7.2, text: "The Boolean interface returns the true candidate’s probability. The score interface averages numeric rubric values using the conditional probabilities." });
  tl.tween(readU, 0, { at: 72.3, dur: 0.5, ease: ease.move });
  tl.tween(tieU, 0, { at: 72.3, dur: 0.5, ease: ease.move });
  tl.tween(lowerDim, 1, { at: 72.3, dur: 0.6, ease: ease.move });
  tl.tween(typedU, 1, { at: 72.8, dur: 1.2, ease: ease.move });
  tl.tween(typedU, 2, { at: 76.3, dur: 1.2, ease: ease.move });
  tl.tween(pivotU, 1, { at: 77.6, dur: 0.9, ease: ease.draw });

  // — beat 10 · close —
  tl.caption({ at: 80.5, dur: 7.2, text: "These are different readings of the same decision. Relative preference answers which option; coverage asks whether the set contains an answer." });
  tl.tween(stageDim, 1, { at: 80.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 80.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 81.3, dur: 0.8, ease: ease.enter });
  tl.hold(87.8, 0.2);

  return {
    tl, cam, src, rulerU, markU, ribbonU, plantU, sA, sB, cU, gapU, thrU, distU, sigU, meterU, splitU, ghostU, sumU,
    lockU, repU, shiftU, lowerDim, readU, tieU, typedU, pivotU, eqQ, eqRho, eqP, stageDim, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const pct = (v: number): string => `${(v * 100).toFixed(1)}%`;

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srcIdx = Math.round(s.get(scene.src));
  const rulerU = s.get(scene.rulerU);
  const markU = s.get(scene.markU);
  const ribbonU = s.get(scene.ribbonU);
  const plantU = s.get(scene.plantU);
  const cU = s.get(scene.cU);
  const gapU = s.get(scene.gapU);
  const thrU = s.get(scene.thrU);
  const distU = s.get(scene.distU);
  const sigU = s.get(scene.sigU);
  const meterU = s.get(scene.meterU);
  const splitU = s.get(scene.splitU);
  const ghostU = s.get(scene.ghostU);
  const sumU = s.get(scene.sumU);
  const lockU = s.get(scene.lockU);
  const repU = s.get(scene.repU);
  const shiftU = s.get(scene.shiftU);
  const lowerDim = s.get(scene.lowerDim);
  const readU = s.get(scene.readU);
  const tieU = s.get(scene.tieU);
  const typedU = s.get(scene.typedU);
  const pivotU = s.get(scene.pivotU);
  const eqQ = s.get(scene.eqQ);
  const eqRho = s.get(scene.eqRho);
  const eqP = s.get(scene.eqP);
  const stageDim = s.get(scene.stageDim);
  const closeU = s.get(scene.closeU);

  // beat 7's illustrative shift: the refined state changed, so the scores moved a little
  const sA = s.get(scene.sA) - 0.05 * shiftU;
  const sB = s.get(scene.sB) + 0.04 * shiftU;
  const cOn = cU > 0.5;
  const scores = cOn ? [sA, sB, S_C] : [sA, sB];
  const d = decide(scores);
  const sMax = Math.max(...scores);
  const covered = lerp(1, d.rho, splitU); // ribbon fraction owned by candidates
  const choiceShares = [d.q[0] * covered, d.q[1] * covered, (cOn ? d.q[2] : 0) * covered];
  const nullShare = splitU * (1 - d.rho);

  // typed morph: widths lerp choice → Noul → Score; colors crossfade
  const noulShares = [NOUL_Q[0], NOUL_Q[1], 0];
  const scoreShares = SCORE_Q;
  const tU = clamp01(typedU);
  const t2 = clamp01(typedU - 1);
  const shares = choiceShares.map((c, i) => lerp(lerp(c, noulShares[i], tU), scoreShares[i], t2));
  const nullW = nullShare * (1 - tU);
  const mode: 'choice' | 'noul' | 'score' = typedU < 0.5 ? 'choice' : typedU < 1.5 ? 'noul' : 'score';
  const typedCf = clamp01(typedU * 2); // color crossfade choice → typed
  const scoreCf = clamp01((typedU - 1) * 2); // noul → score colors
  const choiceCols = [COL.A, COL.B, COL.C];
  const noulCols = [COL.FALSE, COL.TRUE, COL.TRUE];
  const scoreCols = [COL.V0, COL.V1, COL.V2];

  const stageOp = 1 - stageDim;
  const lowerOp = 1 - 0.88 * lowerDim;
  // beat 9: the Choice ruler (A/B/C scores, b_cov, header) does not produce the typed q —
  // fade it while a Noul / Score example is up, following typedU (0 → 1 over 72.8–74.0 s)
  const rulerOp = 1 - 0.88 * clamp01(typedU);
  const chip = `${PIN} · ${SOURCES[Math.max(0, Math.min(SOURCES.length - 1, srcIdx))]}`;
  const chipW = chip.length * 9 + 24;

  const markers = [
    { v: sA, c: COL.A, n: 'A', on: 1 },
    { v: sB, c: COL.B, n: 'B', on: 1 },
    { v: S_C, c: COL.C, n: 'C', on: cU },
  ];

  // segment labels
  const segLabel = (i: number): string => {
    if (mode === 'noul') return i === 0 ? `false  q=${NOUL_Q[0].toFixed(1)}` : `true  q=${NOUL_Q[1].toFixed(1)}`;
    if (mode === 'score') return `v=${SCORE_V[i]}  q=${SCORE_Q[i].toFixed(1)}`;
    const n = ['A', 'B', 'C'][i];
    return splitU > 0.5 ? `p_${n} = ρ·q = ${d.p[i].toFixed(3)}` : `q_${n} = ${d.q[i].toFixed(3)}`;
  };

  // lock chip geometry (above the ruler, right end)
  const lockOpen = clamp01(lockU - 1);
  const lockOp = clamp01(lockU);

  // mini reprise (beat 7) in the lower-left
  const RP = { ox: 300, oy: 548, r: 44 };
  const ang = (12 * Math.PI) / 180;
  const zx = RP.ox + RP.r * Math.cos(ang * repU);
  const zy = RP.oy - RP.r * Math.sin(ang * repU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageOp}>
          {/* ================= the score ruler (dimmed under the typed Noul / Score examples) ================= */}
          <g opacity={rulerOp}>
          <text x={SX(-0.2)} y={226} fill={colors.MUTED} fontSize={15}>
            final scores sᵢ = z_read · uᵢ
            <tspan fill={colors.WARM} fontStyle="italic">
              {'  '}illustrative, not model predictions
            </tspan>
          </text>
          <NumberLine scale={SX} y={RULER_Y} reveal={rulerU} ticks={6} fontSize={13} tickFormat={(v) => v.toFixed(1)} />
          {/* threshold */}
          {thrU > 0.01 && (
            <g opacity={thrU}>
              <line x1={SX(B_COV)} y1={RULER_Y - 46} x2={SX(B_COV)} y2={RULER_Y + 8} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="5 4" />
              <text x={SX(B_COV)} y={RULER_Y - 52} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>
                b_cov = 0.50
              </text>
            </g>
          )}
          {/* ghost (before) markers for the replay */}
          {ghostU > 0.01 && (
            <g opacity={ghostU * 0.35}>
              {[
                { v: HIGH.a, c: COL.A },
                { v: HIGH.b, c: COL.B },
              ].map((m, i) => (
                <circle key={i} cx={SX(m.v)} cy={RULER_Y - 14} r={9} fill="none" stroke={m.c} strokeWidth={2} strokeDasharray="3 3" />
              ))}
            </g>
          )}
          {/* markers */}
          {markers.map((m, i) => {
            const op = markU * m.on;
            if (op <= 0.01) return null;
            const x = SX(m.v);
            return (
              <g key={i} opacity={op}>
                <line x1={x} y1={RULER_Y - 14} x2={x} y2={RULER_Y} stroke={m.c} strokeWidth={2} />
                <circle cx={x} cy={RULER_Y - 14} r={9} fill={m.c} />
                <text x={x} y={RULER_Y - 32} textAnchor="middle" fill={m.c} fontSize={22} fontWeight={650}>
                  {m.n}
                </text>
                <text x={x} y={RULER_Y + 40} textAnchor="middle" fill={m.c} fontSize={13.5} fontFamily={MONO}>
                  {m.v.toFixed(2)}
                </text>
              </g>
            );
          })}
          {/* dotted gap between A and B */}
          {gapU > 0.01 && (
            <g opacity={gapU}>
              <line x1={SX(sB) + 12} y1={RULER_Y - 14} x2={SX(sB) + 12 + (SX(sA) - SX(sB) - 24) * gapU} y2={RULER_Y - 14} stroke={colors.TEXT} strokeWidth={1.5} strokeDasharray="2 5" />
              <text x={(SX(sA) + SX(sB)) / 2} y={RULER_Y + 58} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
                Δs = {(sA - sB).toFixed(2)} → same q
              </text>
            </g>
          )}
          {/* max score → threshold bracket */}
          {distU > 0.01 && (
            <g opacity={distU}>
              <line x1={SX(B_COV)} y1={RULER_Y - 70} x2={SX(B_COV) + (SX(sMax) - SX(B_COV)) * distU} y2={RULER_Y - 70} stroke={colors.NEGATIVE} strokeWidth={2} />
              <circle cx={SX(sMax)} cy={RULER_Y - 70} r={4} fill={colors.NEGATIVE} opacity={clamp01(distU * 2 - 1)} />
              <text x={(SX(B_COV) + SX(sMax)) / 2} y={RULER_Y - 78} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>
                max sᵢ − b_cov = {(sMax - B_COV) >= 0 ? '+' : '−'}{Math.abs(sMax - B_COV).toFixed(2)}
              </text>
            </g>
          )}
          {/* lock chip: final scores held fixed */}
          {lockOp > 0.01 && (
            <g opacity={lockOp}>
              <rect x={790} y={198} width={310} height={26} rx={7} fill={colors.PANEL} stroke={lockOpen > 0.5 ? colors.WARM : colors.GRID} strokeWidth={1.2} />
              <rect x={802} y={207} width={12} height={10} rx={2} fill={lockOpen > 0.5 ? colors.WARM : colors.MUTED} />
              <path d={`M ${804} ${207} v -4 a 4 4 0 0 1 8 0 v ${lerp(4, -2, lockOpen)}`} fill="none" stroke={lockOpen > 0.5 ? colors.WARM : colors.MUTED} strokeWidth={2} />
              <text x={822} y={216} fill={colors.TEXT} fontSize={14}>
                {lockOpen > 0.5 ? 'scores not fixed: the set changed z₁' : 'final scores held fixed (illustrative)'}
              </text>
            </g>
          )}
          {plantU > 0.01 && (
            <text x={900} y={206} textAnchor="middle" fill={colors.WARM} fontSize={17} fontStyle="italic" opacity={plantU}>
              best available ≠ an available answer
            </text>
          )}
          {/* readout toggle (beat 8) */}
          {readU > 0.01 && (
            <g opacity={readU}>
              <rect x={790} y={198} width={310} height={26} rx={7} fill={colors.PANEL} stroke={splitU > 0.5 ? COL.NULL : COL.A} strokeWidth={1.2} />
              <text x={802} y={216} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                {splitU > 0.5 ? 'allow_null=True → p_i vs p_null' : 'allow_null=False → argmax q'}
              </text>
            </g>
          )}
          </g>

          {/* ================= the probability ribbon ================= */}
          {ribbonU > 0.01 && (
            <g>
              <text x={RIB.x} y={RIB.y - 12} fill={colors.MUTED} fontSize={15} opacity={ribbonU * (1 - clamp01(splitU * 2))}>
                probability mass · total 1
              </text>
              {(() => {
                let x = RIB.x;
                const out = [] as ReactNode[];
                const widths = [...shares, nullW];
                const drawn = RIB.w * ribbonU;
                widths.forEach((w, i) => {
                  const px = w * RIB.w;
                  const isNull = i === 3;
                  const x0 = x;
                  x += px;
                  if (px < 0.5) return;
                  const vis = clamp01((drawn - (x0 - RIB.x)) / Math.max(1, px));
                  const cA = isNull ? COL.NULL : choiceCols[i];
                  const cB = isNull ? COL.NULL : lerpColorPick(noulCols[i], scoreCols[i], scoreCf);
                  out.push(
                    <g key={i} opacity={vis}>
                      <rect x={x0} y={RIB.y} width={px} height={RIB.h} fill={cA} opacity={isNull ? 0.55 : 0.8} />
                      {typedCf > 0.01 && !isNull && <rect x={x0} y={RIB.y} width={px} height={RIB.h} fill={cB} opacity={0.8 * typedCf} />}
                      <rect x={x0} y={RIB.y} width={px} height={RIB.h} fill="none" stroke={colors.BG} strokeWidth={2} />
                      {px > 40 && (
                        <text x={x0 + px / 2} y={LABEL_Y + (px < 150 && !isNull && i > 0 ? 18 : 0)} textAnchor="middle" fill={isNull ? COL.NULL : colors.TEXT} fontSize={14} fontFamily={MONO}>
                          {isNull ? `p_null = 1−ρ = ${d.pNull.toFixed(3)}` : segLabel(i)}
                        </text>
                      )}
                      {px > 54 && px < 230 && !isNull && mode === 'choice' && (
                        <text x={x0 + px / 2} y={RIB.y + RIB.h / 2 + 7} textAnchor="middle" fill="#08101f" fontSize={18} fontWeight={700}>
                          {['A', 'B', 'C'][i]}
                        </text>
                      )}
                      {px >= 230 && !isNull && mode === 'choice' && (
                        <text x={x0 + px / 2} y={RIB.y + RIB.h / 2 + 7} textAnchor="middle" fill="#08101f" fontSize={18} fontWeight={700}>
                          {['A', 'B', 'C'][i]} · {pct(d.q[i])} of candidates
                        </text>
                      )}
                      {isNull && px > 80 && (
                        <text x={x0 + px / 2} y={RIB.y + RIB.h / 2 + 7} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={700}>
                          {sumU > 0.5 && px > 400 && d.pNull >= Math.max(...d.p) ? `null wins · p_null ${d.pNull.toFixed(3)} ≥ max pᵢ ${Math.max(...d.p).toFixed(3)}` : 'null'}
                        </text>
                      )}
                      {mode !== 'choice' && (
                        <text x={x0 + px / 2} y={RIB.y + RIB.h / 2 + 7} textAnchor="middle" fill="#08101f" fontSize={18} fontWeight={700}>
                          {mode === 'noul' ? ['false', 'true', ''][i] : `${SCORE_V[i]}`}
                        </text>
                      )}
                    </g>,
                  );
                });
                return out;
              })()}
              {/* coverage bracket over the covered region */}
              {splitU > 0.3 && mode === 'choice' && (
                <g opacity={clamp01((splitU - 0.3) / 0.7)}>
                  <line x1={RIB.x} y1={RIB.y - 4} x2={RIB.x + RIB.w * covered} y2={RIB.y - 4} stroke={colors.POSITIVE} strokeWidth={2.5} />
                  <text x={RIB.x + (RIB.w * covered) / 2} y={RIB.y - 12} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>
                    coverage ρ = {d.rho.toFixed(3)} · p_candidates
                  </text>
                </g>
              )}
              {sumU > 0.01 && mode === 'choice' && (
                <g opacity={sumU}>
                  <text x={RIB.x + RIB.w + 12} y={RIB.y + RIB.h / 2 + 7} fill={colors.TEXT} fontSize={20} fontWeight={650}>
                    = 1
                  </text>
                </g>
              )}
              {tieU > 0.01 && (
                <g opacity={tieU}>
                  <text x={EQ.x} y={EQ.y} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                    choice = None if allow_null and p_null {'>='} probabilities[best]
                  </text>
                  <text x={EQ.x} y={EQ.y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                    an exact tie goes to null
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ================= lower-left: coverage sigmoid ================= */}
          {sigU > 0.01 && (
            <g opacity={sigU * lowerOp}>
              <Axes x={SIG_X} y={SIG_Y} reveal={sigU} grid={false} xTicks={5} yTicks={2} fontSize={12} />
              <FunctionPlot x={SIG_X} y={SIG_Y} f={RHO_OF} reveal={sigU} color={colors.POSITIVE} width={2.5} />
              <line x1={SIG_X(B_COV)} y1={SIG_Y(0)} x2={SIG_X(B_COV)} y2={SIG_Y(1)} stroke={colors.NEGATIVE} strokeWidth={1.2} strokeDasharray="4 4" opacity={0.7} />
              <line x1={SIG_X(Math.max(0, sMax))} y1={SIG_Y(0)} x2={SIG_X(Math.max(0, sMax))} y2={SIG_Y(d.rho)} stroke={colors.MUTED} strokeWidth={1} strokeDasharray="3 4" />
              <circle cx={SIG_X(Math.max(0, sMax))} cy={SIG_Y(d.rho)} r={7} fill={colors.POSITIVE} />
              <text x={SIG_X(0)} y={SIG_Y(1) - 14} fill={colors.MUTED} fontSize={14}>
                ρ against the strongest score · τ_cov = 0.15
              </text>
              <text x={SIG_X(1) + 6} y={SIG_Y(0) + 4} fill={colors.MUTED} fontSize={12}>
                max sᵢ
              </text>
            </g>
          )}

          {/* ================= lower-right: coverage meter + formula ================= */}
          {meterU > 0.01 && (
            <g opacity={meterU * lowerOp}>
              <text x={METER.x} y={METER.y - 12} fill={colors.MUTED} fontSize={15}>
                coverage ρ
                <tspan fill={colors.POSITIVE} fontFamily={MONO}>
                  {'  '}
                  {d.rho.toFixed(3)}
                </tspan>
                <tspan fill={colors.MUTED}>{'   '}p_null</tspan>
                <tspan fill={COL.NULL} fontFamily={MONO}>
                  {'  '}
                  {d.pNull.toFixed(3)}
                </tspan>
              </text>
              <rect x={METER.x} y={METER.y} width={METER.w} height={METER.h} rx={6} fill={COL.NULL} opacity={0.35} />
              <rect x={METER.x} y={METER.y} width={METER.w * d.rho} height={METER.h} rx={6} fill={colors.POSITIVE} opacity={0.85} />
              <text x={METER.x} y={METER.y + METER.h + 18} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                an estimate, not an oracle · b_cov and τ_cov are learned
              </text>
            </g>
          )}
          <MathLabel tex={'q_i = \\frac{e^{s_i/\\tau_{\\mathrm{dec}}}}{\\sum_j e^{s_j/\\tau_{\\mathrm{dec}}}},\\quad \\tau_{\\mathrm{dec}} = 0.20'} x={640} y={470} fontSize={25} opacity={eqQ} boxWidth={700} />
          <MathLabel tex={'\\rho = \\sigma\\big((\\max_i s_i - b_{\\mathrm{cov}})/\\tau_{\\mathrm{cov}}\\big)'} x={EQ.x} y={EQ.y} fontSize={23} opacity={eqRho * lowerOp} boxWidth={470} />
          <MathLabel tex={'p_i = \\rho\\, q_i,\\qquad p_{\\varnothing} = 1 - \\rho'} x={EQ.x} y={EQ.y} fontSize={25} opacity={eqP * lowerOp} boxWidth={460} />

          {/* ================= beat 7: the state reprise (lower-left, over the dimmed sigmoid) ================= */}
          {repU > 0.01 && (
            <g opacity={clamp01(repU * 3)}>
              <rect x={180} y={458} width={420} height={138} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={200} y={480} fill={colors.TEXT} fontSize={15}>
                in a full request the set refines z₁ first
              </text>
              <text x={200} y={498} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                z₁ = z₀ + α·Σ aᵢvᵢ → sᵢ = z_read·uᵢ · illustrative
              </text>
              <circle cx={RP.ox} cy={RP.oy} r={RP.r} fill="none" stroke={colors.GRID} strokeDasharray="3 5" />
              <Vec x1={RP.ox} y1={RP.oy} x2={RP.ox + RP.r} y2={RP.oy} color={colors.TEXT} width={2} head={8} opacity={0.3} />
              <Vec x1={RP.ox} y1={RP.oy} x2={zx} y2={zy} color={colors.TEXT} width={2.6} head={9} />
              <circle cx={RP.ox + RP.r * 0.8} cy={RP.oy - RP.r * 0.6} r={6} fill={COL.A} />
              <circle cx={RP.ox + RP.r * 0.8} cy={RP.oy + RP.r * 0.6} r={6} fill={COL.B} />
              <circle cx={RP.ox + RP.r * 0.6} cy={RP.oy - RP.r * 0.8} r={6} fill={COL.C} opacity={repU} />
              <text x={RP.ox + RP.r * 0.6 + 12} y={RP.oy - RP.r * 0.8 + 5} fill={COL.C} fontSize={14} opacity={repU}>
                + C
              </text>
              <text x={zx + 10} y={zy + 4} fill={colors.TEXT} fontSize={14} fontStyle="italic">
                z₁ moves
              </text>
              <text x={445} y={532} fill={colors.MUTED} fontSize={13.5}>
                → A and B scores shift
              </text>
              <text x={445} y={552} fill={colors.MUTED} fontSize={13.5}>
                → ρ and q both change
              </text>
              <text x={445} y={580} fill={colors.WARM} fontSize={12.5} fontStyle="italic">
                Prop. 2 holds only at fixed scores
              </text>
            </g>
          )}

          {/* ================= beat 9: typed readouts (opaque lower panel): Noul, then Score ================= */}
          {typedU > 0.3 && (
            <g opacity={clamp01((typedU - 0.3) / 0.3)}>
              <rect x={300} y={458} width={680} height={130} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
              {mode !== 'score' && (
                <g opacity={1 - scoreCf}>
                  <text x={640} y={484} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
                    Noul · the probability of the positive Boolean candidate
                  </text>
                  <text x={640} y={514} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                    options ["false","true"] · positive_index = 1 · noul = q[1] = {NOUL_OUT.toFixed(1)}
                  </text>
                  <text x={640} y={540} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
                    independent illustrative q, not the Choice example above · not a null probability
                  </text>
                </g>
              )}
              {mode === 'score' && (
                <g opacity={scoreCf}>
                  <text x={640} y={484} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
                    Score · expected rubric value under q
                  </text>
                  <text x={640} y={506} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    Σ qᵢ·vᵢ = 0.2·0 + 0.3·1 + 0.5·2 = {SCORE_OUT.toFixed(1)} · independent illustrative q
                  </text>
                </g>
              )}
            </g>
          )}
          {pivotU > 0.01 && (
            <g opacity={pivotU}>
              {(() => {
                const PX = scaleLinear([0, 2], [360, 920]);
                return (
                  <>
                    <NumberLine scale={PX} y={548} reveal={pivotU} ticks={2} fontSize={12} tickFormat={(v) => `v = ${v}`} />
                    {SCORE_V.map((v, i) => (
                      <rect key={i} x={PX(v) - 14} y={548 - 8 - SCORE_Q[i] * 50 * pivotU} width={28} height={SCORE_Q[i] * 50 * pivotU} fill={scoreCols[i]} opacity={0.8} />
                    ))}
                    <polygon points={`${PX(SCORE_OUT)},${550} ${PX(SCORE_OUT) - 9},${566} ${PX(SCORE_OUT) + 9},${566}`} fill={colors.WARM} opacity={clamp01(pivotU * 2 - 1)} />
                    <text x={PX(SCORE_OUT)} y={584} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO} opacity={clamp01(pivotU * 2 - 1)}>
                      score = {SCORE_OUT.toFixed(1)}
                    </text>
                  </>
                );
              })()}
            </g>
          )}
        </g>

        {/* ================= closing panel ================= */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={250} y={250} width={780} height={230} rx={16} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={470} y={330} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={650}>
              Which?
            </text>
            <MathLabel tex={'q'} x={470} y={386} fontSize={40} color={COL.A} boxWidth={200} />
            <text x={470} y={440} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
              relative preference among candidates
            </text>
            <text x={810} y={330} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={650}>
              Any?
            </text>
            <MathLabel tex={'\\rho'} x={810} y={386} fontSize={40} color={colors.POSITIVE} boxWidth={200} />
            <text x={810} y={440} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
              coverage · the rest is
              <tspan fill={COL.NULL} fontFamily={MONO}>
                {' '}
                null
              </tspan>
            </text>
            <line x1={640} y1={290} x2={640} y2={450} stroke={colors.GRID} strokeWidth={1.5} />
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title + source chip ================= */}
      <text x={640} y={38} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={650} opacity={1 - 0.6 * stageDim}>
        Which answer, or no answer?
      </text>
      <g opacity={1 - 0.6 * stageDim}>
        <rect x={640 - chipW / 2} y={66} width={chipW} height={26} rx={7} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={640} y={84} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
          {chip}
        </text>
      </g>
    </>
  );
}

/** Pick between two colors by crossfade threshold — used only for the typed ribbon fill. */
function lerpColorPick(a: string, b: string, u: number): string {
  return u < 0.5 ? a : b;
}

export const vizScene = () => scene;
