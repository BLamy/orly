// Fixed options, changing judgments
//
// Jeva: Fresh Decisions — chapter 1. Authored by Claude Fable 5.1 (claude-fable-5-1) from the
// Astra visual plan; captions are the fixed narration contract (verbatim).
//
// Source pin: LiQiiiii/Jeva@f231c9ac31ba72f2ca4ca8aac662b279f3438fdb
//   src/jeva/_runtime/collate.py 4–9        state_question_text / option_text templates
//   src/jeva/_runtime/model.py 38–78        encode_state_inputs / encode_option_inputs (shared backbone)
//   src/jeva/_runtime/matrix_decision.py 108–163  project_options (k_proj, v_proj, key normalize),
//                                               forward_from_kv (query normalize, softmax / tau_set,
//                                               weighted message, z + alpha * message, FFN residual)
//   src/jeva/_runtime/matrix_decision.py 247–275  prepare_option_cache (option_read = normalize(u))
//   src/jeva/_runtime/matrix_decision.py 348–410  forward_from_cache (scores = z_read · option_read)
//   src/jeva/inference.py 255–270            first-maximum winner, tie handling
//   paper arXiv:2610.18773v1 §3.1–3.4, Proposition 1 (set-dependent preference) and Proposition 3
//   (candidate symmetry); docs/runtime.md 83–85 (finite-precision caveat)
//
// The geometry is the paper's Proposition 1 construction, computed exactly at module scope:
// one two-dimensional head, identity Q/K/V/O projections, zero FFN output, z0=(1,0),
// A=(4,3)/5, B=(4,-3)/5, C±=(3,±4)/5, tau_set=3/20, gamma=-ln 2 so alpha=1/20. It is an
// existence construction with illustrative parameters, NOT the trained 4B model's output.
// Because the projections are the identity here, k_i = v_i = u_i; trained blocks learn W_k, W_v.
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Axes, Vec } from '../../primitives';
import { scaleLinear } from 'd3';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Proposition 1 arithmetic (exact, module scope)
// ---------------------------------------------------------------------------

type V2 = readonly [number, number];

const TAU_SET = 3 / 20; // tau_set in the construction
const ALPHA = 1 / 20; // tau_set * sigmoid(gamma) with gamma = -ln 2
const TAU_DEC = 0.2; // illustrative decision temperature for the q_i bars (beat 9)

const Z0: V2 = [1, 0];
const A: V2 = [4 / 5, 3 / 5];
const B: V2 = [4 / 5, -3 / 5];
const C_PLUS: V2 = [3 / 5, 4 / 5];

const dot = (a: V2, b: V2): number => a[0] * b[0] + a[1] * b[1];
const norm = (a: V2): V2 => {
  const n = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / n, a[1] / n];
};
const lerp2 = (a: V2, b: V2, u: number): V2 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

/** One decision block with identity projections and zero FFN: the paper's single-block head. */
function refine(z0: V2, us: V2[]) {
  const q = norm(z0); // query normalized (forward_from_kv)
  const logits = us.map((u) => dot(q, norm(u)) / TAU_SET); // keys normalized (project_options)
  const mx = Math.max(...logits);
  const ex = logits.map((l) => Math.exp(l - mx));
  const sum = ex.reduce((p, c) => p + c, 0);
  const a = ex.map((e) => e / sum); // attention over the set
  const m: V2 = [
    us.reduce((p, u, i) => p + a[i] * u[0], 0),
    us.reduce((p, u, i) => p + a[i] * u[1], 0),
  ]; // weighted message (v_i = u_i here)
  const z1: V2 = [z0[0] + ALPHA * m[0], z0[1] + ALPHA * m[1]];
  return { a, m, z1 };
}

const PLUS = refine(Z0, [A, B, C_PLUS]);
/** w = (1 + 2 e^{4/3})^{-1} ≈ 0.11645 — weight of the third option. */
const W = PLUS.a[2];
/** The paper's closed form 24 α w / 25 ≈ +0.00559 (matches the direct dot-product margin). */
const MARGIN_CLOSED = (24 * ALPHA * W) / 25;

function softmax(xs: number[], tau: number): number[] {
  const mx = Math.max(...xs);
  const ex = xs.map((x) => Math.exp((x - mx) / tau));
  const sum = ex.reduce((p, c) => p + c, 0);
  return ex.map((e) => e / sum);
}

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band; title y38, source chip y80)
// ---------------------------------------------------------------------------

const CX = 380;
const CY = 400;
const R = 170;
const sv = (v: V2): V2 => [CX + v[0] * R, CY - v[1] * R];
const AXIS_X = scaleLinear([-1.15, 1.15], [CX - 1.15 * R, CX + 1.15 * R]);
const AXIS_Y = scaleLinear([-1.15, 1.15], [CY + 1.15 * R, CY - 1.15 * R]);
const EQ_X = 380;
const EQ_Y = 195;

const OPT = [
  { name: 'A', color: colors.ACCENT },
  { name: 'B', color: colors.SECONDARY },
  { name: 'C', color: colors.WARM },
] as const;
const STATE_COLOR = '#f4f7fb';

// beat 1 ribbons
const RIB_X = 730;
const RIB_W = 400;
const RIB_H = 44;
const RIB_Y = [190, 244, 298, 352];
const ENC = { x: 730, y: 412, w: 400, h: 50 };
const RIBBONS = [
  { text: 'Decision type: choice · Question: … · State: …', chip: 'state_question_text' },
  { text: 'Option for choice: A', chip: 'option_text' },
  { text: 'Option for choice: B', chip: 'option_text' },
  { text: 'Option for choice: C', chip: 'option_text' },
];

// beat 2+ memory rows
const NAME_X = 745;
const U_X = 765;
const K_X = 860;
const V_X = 955;
const CELL = 40;
const GAP = 3;
const ABAR_X = 1046;
const ABAR_W = 48;
const QBAR_X = 1138;
const QBAR_W = 44;
const HEADER_Y = 185;
const SLOT_Y = [215, 258, 301];
const NOTE_Y = 336;
/** row slot after the beat-8 permutation [A,B,C] → [C,A,B] */
const PERM_SLOT = [1, 2, 0];

// beat 4+ inset (equal scales) and score panel
const IN = { x: 740, y: 350, s: 220 };
const IN_C: V2 = [IN.x + IN.s / 2, IN.y + IN.s / 2];
const IN_WINDOW = 0.06; // ±0.03 around x = 1.02
const IN_X0 = 1.02;
const IN_SCALE = IN.s / IN_WINDOW; // equal px per unit on both axes
const iv = (v: V2): V2 => [IN_C[0] + (v[0] - IN_X0) * IN_SCALE, IN_C[1] - v[1] * IN_SCALE];

const SR_X = 1010; // score ruler
const SR = scaleLinear([0.6, 0.86], [560, 375]);
const MB_X = 1115; // signed margin bar
const MB_Y0 = 468;
const MB_SCALE = 85 / 0.006;

const CAM_OPEN: CameraState = { x: 560, y: 400, k: 1.06 };
const CAM_WIDE: CameraState = { x: 640, y: 385, k: 1.0 };
const CAM_MEM: CameraState = { x: 780, y: 370, k: 1.06 };
const CAM_DETAIL: CameraState = { x: 700, y: 400, k: 1.08 };
const CAM_MATH: CameraState = { x: 760, y: 400, k: 1.04 };

const PIN = 'LiQiiiii/Jeva@f231c9ac31ba72f2ca4ca8aac662b279f3438fdb';
const SOURCES = [
  'README.md:17-22 · paper §3',
  '_runtime/collate.py:4-9 · _runtime/model.py:38-48',
  '_runtime/matrix_decision.py:247-275 prepare_option_cache',
  '_runtime/matrix_decision.py:124-159 forward_from_kv',
  'paper §3.2 Proposition 1 · construction, not model output',
  'paper §3.2 Proposition 1 · construction, not model output',
  'paper §3.2 Proposition 1 · construction, not model output',
  'paper §3.1–3.2 eq. 2 and 5',
  '_runtime/matrix_decision.py:137-159 · paper §3.4 Prop. 3',
  'inference.py:255-268 · docs/runtime.md:83-85 · paper B.5',
  'README.md:17-29',
];

// ---------------------------------------------------------------------------
// Timeline — 88 s, eleven fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const src = tl.channel('src', 0);

  const axesU = tl.channel('axesU', 0);
  const z0U = tl.channel('z0U', 0);
  const ringU = tl.channel('ringU', 0);
  const heroU = tl.channel('heroU', 0);
  const ribU = tl.channel('ribU', 0);
  const encU = tl.channel('encU', 0); // ribbons → encoder → endpoints, 0..4
  const ribDim = tl.channel('ribDim', 0);
  const memU = tl.channel('memU', 0);
  const kvU = tl.channel('kvU', 0);
  const leaderU = tl.channel('leaderU', 0);
  const fixedU = tl.channel('fixedU', 0);
  const queryU = tl.channel('queryU', 0);
  const attnU = tl.channel('attnU', 0);
  const chainU = tl.channel('chainU', 0);
  const stateU = tl.channel('stateU', 0); // z0 → z1
  const cU = tl.channel('cU', 1); // third option present
  const cSign = tl.channel('cSign', 1); // +1 = C+, −1 = C−
  const ffnU = tl.channel('ffnU', 0);
  const eqAttn = tl.channel('eqAttn', 0);
  const eqMargin = tl.channel('eqMargin', 0);
  const eqPerm = tl.channel('eqPerm', 0);
  const paperU = tl.channel('paperU', 0);
  const insetU = tl.channel('insetU', 0);
  const scoresU = tl.channel('scoresU', 0);
  const flipU = tl.channel('flipU', 0);
  const panelDim = tl.channel('panelDim', 0); // inset + score panel step aside
  const geomDim = tl.channel('geomDim', 0);
  const indepU = tl.channel('indepU', 0);
  const permU = tl.channel('permU', 0);
  const probU = tl.channel('probU', 0);
  const winU = tl.channel('winU', 0);
  const caveatU = tl.channel('caveatU', 0);
  const stageDim = tl.channel('stageDim', 0);
  const closeU = tl.channel('closeU', 0);

  for (let i = 0; i < SOURCES.length; i++) tl.set(src, i, 0.5 + i * 8 - 0.1);

  // — beat 0 · a request faces a ring of fixed options —
  tl.caption({ at: 0.5, dur: 7.2, text: "Jeva makes a decision by changing its view of a request while keeping the available options fixed." });
  tl.tween(axesU, 1, { at: 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_OPEN, { at: 0.8, dur: 1.6, ease: ease.move });
  tl.tween(z0U, 1, { at: 1.6, dur: 0.9, ease: ease.enter });
  tl.tween(ringU, 1, { at: 2.6, dur: 1.0, ease: ease.enter });
  tl.tween(heroU, 1, { at: 3.6, dur: 0.6, ease: ease.enter });

  // — beat 1 · one encoder, separate reads —
  tl.caption({ at: 8.5, dur: 7.2, text: "The same language encoder reads the request and each option separately. An option sees its type and text, but no current request." });
  tl.tween(cam, CAM_WIDE, { at: 8.3, dur: 1.2, ease: ease.move });
  tl.tween(ribU, 1, { at: 8.6, dur: 0.8, ease: ease.enter });
  tl.tween(encU, 4, { at: 9.6, dur: 5.4, ease: ease.linear });
  tl.tween(ribDim, 1, { at: 15.3, dur: 0.6, ease: ease.move });

  // — beat 2 · the option memory and its projections —
  tl.caption({ at: 16.5, dur: 7.2, text: "The resulting option vectors become a memory. Each decision block projects that memory into keys and values without rewriting the options." });
  tl.tween(cam, CAM_MEM, { at: 16.3, dur: 1.3, ease: ease.move });
  tl.tween(memU, 1, { at: 16.8, dur: 1.6, ease: ease.enter });
  tl.tween(leaderU, 1, { at: 17.6, dur: 1.0, ease: ease.draw });
  tl.tween(kvU, 1, { at: 18.8, dur: 1.2, ease: ease.enter });
  tl.tween(fixedU, 1, { at: 20.6, dur: 0.6, ease: ease.enter });

  // — beat 3 · query, weights, weighted sum, nudge —
  tl.caption({ at: 24.5, dur: 7.2, text: "The request supplies a query. Similarity weights the option values, and their weighted sum nudges the request state." });
  tl.tween(cam, CAM_WIDE, { at: 24.3, dur: 1.3, ease: ease.move });
  tl.tween(leaderU, 0, { at: 24.3, dur: 0.6, ease: ease.move });
  tl.tween(fixedU, 0, { at: 24.3, dur: 0.5, ease: ease.move });
  tl.tween(queryU, 1, { at: 24.8, dur: 0.6, ease: ease.enter });
  tl.tween(eqAttn, 1, { at: 25.4, dur: 0.6, ease: ease.enter });
  tl.tween(attnU, 1, { at: 25.6, dur: 1.0, ease: ease.enter });
  tl.tween(chainU, 1, { at: 27.0, dur: 1.4, ease: ease.draw });
  tl.tween(stateU, 1, { at: 28.8, dur: 1.0, ease: ease.move });
  tl.tween(ffnU, 1, { at: 30.0, dur: 0.5, ease: ease.enter });

  // — beat 4 · the paper's exact example: reset to the tie —
  tl.caption({ at: 32.5, dur: 7.2, text: "Here is the paper’s exact two dimensional example, not a measured model output. Two options initially tie against the same request." });
  tl.tween(eqAttn, 0, { at: 32.5, dur: 0.5, ease: ease.move });
  tl.tween(ffnU, 0, { at: 32.5, dur: 0.4, ease: ease.move });
  tl.tween(heroU, 0, { at: 32.5, dur: 0.4, ease: ease.move });
  tl.tween(paperU, 1, { at: 32.7, dur: 0.7, ease: ease.enter });
  tl.tween(chainU, 0, { at: 32.8, dur: 0.6, ease: ease.move });
  tl.tween(attnU, 0, { at: 32.8, dur: 0.6, ease: ease.move });
  tl.tween(stateU, 0, { at: 32.8, dur: 0.8, ease: ease.move });
  tl.tween(cU, 0, { at: 32.8, dur: 0.7, ease: ease.move });
  tl.tween(queryU, 0, { at: 32.8, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_DETAIL, { at: 33.2, dur: 1.4, ease: ease.move });
  tl.tween(insetU, 1, { at: 34.4, dur: 1.0, ease: ease.enter });
  tl.tween(scoresU, 1, { at: 35.8, dur: 0.9, ease: ease.enter });

  // — beat 5 · C+ pulls the state upward; A wins —
  tl.caption({ at: 40.5, dur: 7.2, text: "A third option above the axis pulls the refined state upward. The upper option now wins, even though neither original option moved." });
  tl.tween(cU, 1, { at: 40.6, dur: 0.7, ease: ease.enter });
  tl.tween(attnU, 1, { at: 41.3, dur: 0.8, ease: ease.enter });
  tl.tween(chainU, 1, { at: 41.7, dur: 1.2, ease: ease.draw });
  tl.tween(stateU, 1, { at: 43.1, dur: 1.2, ease: ease.move });
  tl.tween(eqMargin, 1, { at: 44.6, dur: 0.6, ease: ease.enter });

  // — beat 6 · reflect only C; B wins —
  tl.caption({ at: 48.5, dur: 7.2, text: "Replace only the third option with its reflection. The state moves downward, and the lower option wins instead." });
  tl.tween(cSign, -1, { at: 48.6, dur: 1.6, ease: ease.move });
  tl.tween(flipU, 1, { at: 50.5, dur: 0.5, ease: ease.pop });

  // — beat 7 · why an independent scorer cannot —
  tl.caption({ at: 56.5, dur: 7.2, text: "That reversal comes from reading the whole set. Independently scoring each retained option cannot reverse their relative preference this way." });
  tl.tween(eqMargin, 0, { at: 56.4, dur: 0.5, ease: ease.move });
  tl.tween(flipU, 0, { at: 56.4, dur: 0.5, ease: ease.move });
  tl.tween(panelDim, 1, { at: 56.4, dur: 0.8, ease: ease.move });
  tl.tween(geomDim, 1, { at: 56.4, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_MATH, { at: 56.4, dur: 1.2, ease: ease.move });
  tl.tween(indepU, 1, { at: 57.2, dur: 0.8, ease: ease.enter });

  // — beat 8 · permute rows and weights; same sum —
  tl.caption({ at: 64.5, dur: 7.2, text: "Now reorder the same options. Their weights move with them, so the weighted sum and the refined state stay the same." });
  tl.tween(indepU, 0, { at: 64.3, dur: 0.6, ease: ease.move });
  tl.tween(insetU, 0, { at: 64.3, dur: 0.6, ease: ease.move });
  tl.tween(scoresU, 0, { at: 64.3, dur: 0.6, ease: ease.move });
  tl.tween(paperU, 0, { at: 64.3, dur: 0.6, ease: ease.move });
  tl.tween(geomDim, 0, { at: 64.3, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 64.3, dur: 1.3, ease: ease.move });
  tl.tween(permU, 1, { at: 66.0, dur: 1.5, ease: ease.move });
  tl.tween(eqPerm, 1, { at: 67.8, dur: 0.6, ease: ease.enter });

  // — beat 9 · probabilities follow identity —
  tl.caption({ at: 72.5, dur: 7.2, text: "Probabilities follow option identity, and a unique winner survives reordering. Exact ties use input order; floating point arithmetic can perturb near ties." });
  tl.tween(probU, 1, { at: 72.8, dur: 0.9, ease: ease.enter });
  tl.tween(winU, 1, { at: 74.0, dur: 0.5, ease: ease.pop });
  tl.tween(caveatU, 1, { at: 75.6, dur: 0.6, ease: ease.enter });

  // — beat 10 · close —
  tl.caption({ at: 80.5, dur: 7.2, text: "The options are reusable, but the judgment remains sensitive to the available set. Next, we must ask whether any option belongs at all." });
  tl.tween(stageDim, 1, { at: 80.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 80.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 81.3, dur: 0.8, ease: ease.enter });
  tl.hold(87.8, 0.2);

  return {
    tl, cam, src, axesU, z0U, ringU, heroU, ribU, encU, ribDim, memU, kvU, leaderU, fixedU, queryU, attnU, chainU,
    stateU, cU, cSign, ffnU, eqAttn, eqMargin, eqPerm, paperU, insetU, scoresU, flipU, panelDim, geomDim, indepU,
    permU, probU, winU, caveatU, stageDim, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const fmt = (v: number, d = 1): string => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
const fmtSigned = (v: number, d: number): string => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(d);

function ValueCells({ x, y, v, color, u }: { x: number; y: number; v: V2; color: string; u: number }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      {[v[0], v[1]].map((c, j) => (
        <g key={j}>
          <rect x={x + j * (CELL + GAP)} y={y - CELL / 2} width={CELL} height={CELL} rx={6} fill={color} opacity={0.16} />
          <rect x={x + j * (CELL + GAP)} y={y - CELL / 2} width={CELL} height={CELL} rx={6} fill="none" stroke={color} strokeWidth={1.2} opacity={0.6} />
          <text x={x + j * (CELL + GAP) + CELL / 2} y={y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
            {fmt(c, 1)}
          </text>
        </g>
      ))}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srcIdx = Math.round(s.get(scene.src));
  const axesU = s.get(scene.axesU);
  const z0U = s.get(scene.z0U);
  const ringU = s.get(scene.ringU);
  const heroU = s.get(scene.heroU);
  const ribU = s.get(scene.ribU);
  const encU = s.get(scene.encU);
  const ribDim = s.get(scene.ribDim);
  const memU = s.get(scene.memU);
  const kvU = s.get(scene.kvU);
  const leaderU = s.get(scene.leaderU);
  const fixedU = s.get(scene.fixedU);
  const queryU = s.get(scene.queryU);
  const attnU = s.get(scene.attnU);
  const chainU = s.get(scene.chainU);
  const stateU = s.get(scene.stateU);
  const cU = s.get(scene.cU);
  const cSign = s.get(scene.cSign);
  const ffnU = s.get(scene.ffnU);
  const eqAttn = s.get(scene.eqAttn);
  const eqMargin = s.get(scene.eqMargin);
  const eqPerm = s.get(scene.eqPerm);
  const paperU = s.get(scene.paperU);
  const insetU = s.get(scene.insetU);
  const scoresU = s.get(scene.scoresU);
  const flipU = s.get(scene.flipU);
  const panelDim = s.get(scene.panelDim);
  const geomDim = s.get(scene.geomDim);
  const indepU = s.get(scene.indepU);
  const permU = s.get(scene.permU);
  const probU = s.get(scene.probU);
  const winU = s.get(scene.winU);
  const caveatU = s.get(scene.caveatU);
  const stageDim = s.get(scene.stageDim);
  const closeU = s.get(scene.closeU);

  // ---- the live arithmetic for this frame (exact at every sampled C direction) ----
  const cVec = norm([3 / 5, (4 / 5) * cSign]);
  const cOn = cU > 0.5;
  const us: V2[] = cOn ? [A, B, cVec] : [A, B];
  const res = refine(Z0, us);
  const z = lerp2(Z0, res.z1, stateU); // displayed request state
  const scoreOf = (u: V2) => dot(z, u);
  const sA = scoreOf(A);
  const sB = scoreOf(B);
  const sC = scoreOf(cVec);
  const margin = sA - sB;
  const weights = cOn ? res.a : [res.a[0], res.a[1], 0];
  const q = softmax([sA, sB, sC], TAU_DEC);
  const winner = sA >= sB ? 0 : 1; // first maximum wins exact ties
  const moved = stateU > 0.02;

  // weighted vectors a_i u_i and their chain starts in both orders (identity-indexed)
  const vecs: V2[] = [A, B, cVec].map((u, i) => [weights[i] * u[0], weights[i] * u[1]]);
  const startABC: V2[] = [[0, 0], vecs[0], [vecs[0][0] + vecs[1][0], vecs[0][1] + vecs[1][1]]];
  const startCAB: V2[] = [vecs[2], [vecs[2][0] + vecs[0][0], vecs[2][1] + vecs[0][1]], [0, 0]];

  const stageOp = 1 - stageDim;
  const geomOp = 1 - 0.85 * geomDim;
  const o = sv([0, 0]);
  const zTip = sv(z);
  const chip = `${PIN} · ${SOURCES[Math.max(0, Math.min(SOURCES.length - 1, srcIdx))]}`;
  const chipW = chip.length * 9 + 24;

  // option endpoints + solidity (beat 1 landings)
  const flight = (i: number) => clamp01((encU - i * 0.9) / 1.3);
  const solid = (i: number) => (encU <= 0 ? 0 : clamp01((flight(i + 1) - 0.92) / 0.08));
  const optVec = (i: number): V2 => (i === 0 ? A : i === 1 ? B : cVec);
  const optOp = (i: number) => (i === 2 ? cU : 1);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageOp}>
          {/* ================= the compass ================= */}
          <g opacity={geomOp}>
            <Axes x={AXIS_X} y={AXIS_Y} reveal={axesU} grid={false} xTicks={4} yTicks={4} fontSize={13} opacity={0.9} />
            {axesU > 0.3 && (
              <circle cx={o[0]} cy={o[1]} r={R} fill="none" stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="4 6" opacity={clamp01((axesU - 0.3) / 0.7)} />
            )}

            {/* hollow ring of options (beat 0) → solid dots (beat 1) */}
            {[0, 1, 2].map((i) => {
              const p = sv(optVec(i));
              const sol = solid(i);
              const op = optOp(i);
              if (op <= 0.01) return null;
              const hollow = ringU * (1 - sol);
              return (
                <g key={i} opacity={op}>
                  {hollow > 0.01 && <circle cx={p[0]} cy={p[1]} r={9} fill="none" stroke={OPT[i].color} strokeWidth={2} opacity={hollow * 0.55} />}
                  {sol > 0.01 && (
                    <>
                      <Vec x1={o[0]} y1={o[1]} x2={p[0]} y2={p[1]} grow={sol} color={OPT[i].color} width={2.6} opacity={0.9} />
                      <circle cx={p[0]} cy={p[1]} r={7} fill={OPT[i].color} opacity={sol} />
                    </>
                  )}
                  <text x={p[0] + (i === 2 ? -4 : 20)} y={p[1] + (i === 1 ? 26 : i === 2 ? lerp(30, -16, (cSign + 1) / 2) : -12)} textAnchor="middle" fill={OPT[i].color} fontSize={24} fontWeight={650} opacity={Math.max(hollow, sol)}>
                    {OPT[i].name}
                    {i === 2 && paperU > 0.5 ? (cSign > 0 ? '₊' : '₋') : ''}
                  </text>
                </g>
              );
            })}

            {/* weighted message chain m = Σ a_i v_i, drawn from the origin (identity-indexed, order lerps) */}
            {chainU > 0.01 &&
              [0, 1, 2].map((i) => {
                const st = lerp2(startABC[i], startCAB[i], permU);
                const en: V2 = [st[0] + vecs[i][0], st[1] + vecs[i][1]];
                const p0 = sv(st);
                const p1 = sv(en);
                const order = permU < 0.5 ? i : PERM_SLOT[i];
                const g = clamp01(chainU * 3 - order);
                return <Vec key={i} x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} grow={g} color={OPT[i].color} width={2.2} head={8} opacity={0.85} />;
              })}
            {chainU > 0.6 && (
              <g opacity={clamp01((chainU - 0.6) / 0.4)}>
                {(() => {
                  const m = sv(res.m);
                  return (
                    <>
                      <circle cx={m[0]} cy={m[1]} r={5} fill={colors.TEXT} />
                      <text x={m[0]} y={m[1] + (res.m[1] >= 0 ? -14 : 26)} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontStyle="italic">
                        m = Σ aᵢ vᵢ
                      </text>
                    </>
                  );
                })()}
              </g>
            )}

            {/* the request state: z0 ghost + the live arrow */}
            {moved && <Vec x1={o[0]} y1={o[1]} x2={sv(Z0)[0]} y2={sv(Z0)[1]} color={STATE_COLOR} width={2} head={9} opacity={0.3} />}
            <Vec x1={o[0]} y1={o[1]} x2={zTip[0]} y2={zTip[1]} grow={z0U} color={STATE_COLOR} width={3.4} head={12} />
            {z0U > 0.6 && (
              <text x={zTip[0] + 14} y={zTip[1] + 30} fill={STATE_COLOR} fontSize={22} fontStyle="italic" opacity={clamp01((z0U - 0.6) / 0.4)}>
                {moved ? 'z₁' : 'z₀'}
                <tspan fontSize={15} fontStyle="normal" fill={colors.MUTED}>
                  {' '}
                  request state
                </tspan>
              </text>
            )}
            {queryU > 0.01 && (
              <text x={zTip[0] + 14} y={zTip[1] + 52} fill={colors.MUTED} fontSize={15} fontFamily={MONO} opacity={queryU}>
                q = normalize(q_proj · z₀)
              </text>
            )}

            {/* hero labels (beat 0) */}
            {heroU > 0.01 && (
              <g opacity={heroU}>
                <text x={300} y={268} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
                  option memory
                </text>
                <text x={300} y={290} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
                  u_i · fixed this decision
                </text>
              </g>
            )}
            {paperU > 0.01 && (
              <g opacity={paperU}>
                <rect x={140} y={250} width={320} height={64} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
                <text x={300} y={269} textAnchor="middle" fill={colors.WARM} fontSize={15} fontWeight={600}>
                  paper construction · illustrative parameters
                </text>
                <text x={300} y={288} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                  z₀=(1,0) · A,B=(4,±3)/5 · C±=(3,±4)/5
                </text>
                <text x={300} y={305} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                  τ=3/20 · α=1/20 · identity projections
                </text>
              </g>
            )}
            {ffnU > 0.01 && (
              <text x={300} y={540} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO} opacity={ffnU}>
                + depth_scale · ffn(norm(z)) in the full block
              </text>
            )}
          </g>

          {/* ================= equation strip (one at a time) ================= */}
          <MathLabel
            tex={'z_1 = z_0 + \\alpha \\sum_i a_i v_i,\\qquad a_i = \\mathrm{softmax}_i\\!\\left(q\\cdot k_i/\\tau_{\\mathrm{set}}\\right)'}
            x={EQ_X}
            y={EQ_Y}
            fontSize={24}
            opacity={eqAttn}
            boxWidth={640}
          />
          <MathLabel
            tex={`s_A - s_B = ${cSign > 0 ? '+' : '-'}\\,\\frac{24\\,\\alpha\\, w}{25} = ${fmtSigned(MARGIN_CLOSED * Math.sign(cSign || 1), 5)}`}
            x={EQ_X}
            y={EQ_Y}
            fontSize={24}
            opacity={eqMargin * (1 - geomDim)}
            boxWidth={640}
          />
          <MathLabel
            tex={'\\sum_i a_i v_i = \\sum_i a_{\\pi(i)} v_{\\pi(i)} \\;\\Rightarrow\\; z_1 \\text{ unchanged}'}
            x={EQ_X}
            y={EQ_Y}
            fontSize={24}
            opacity={eqPerm}
            boxWidth={640}
          />

          {/* ================= beat 1: ribbons → shared encoder → endpoints ================= */}
          {ribU > 0.01 && ribDim < 0.99 && (
            <g opacity={ribU * (1 - ribDim)}>
              <rect x={ENC.x} y={ENC.y} width={ENC.w} height={ENC.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={ENC.x + ENC.w / 2} y={ENC.y + 21} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={600}>
                shared encoder E_θ
              </text>
              <text x={ENC.x + ENC.w / 2} y={ENC.y + 40} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                backbone.encode → context_proj | option_proj
              </text>
              {RIBBONS.map((r, i) => {
                const u = flight(i);
                const slide = clamp01(u / 0.45);
                const fly = clamp01((u - 0.45) / 0.55);
                const y = lerp(RIB_Y[i], ENC.y + ENC.h / 2, ease.move(slide));
                const ribOp = 1 - clamp01((slide - 0.7) / 0.3);
                const target = i === 0 ? sv(Z0) : sv(optVec(i - 1));
                const from: V2 = [ENC.x, ENC.y + ENC.h / 2];
                const px = lerp(from[0], target[0], ease.move(fly));
                const py = lerp(from[1], target[1], ease.move(fly));
                const dotColor = i === 0 ? STATE_COLOR : OPT[i - 1].color;
                return (
                  <g key={i}>
                    {ribOp > 0.01 && (
                      <g opacity={ribOp}>
                        <rect x={RIB_X} y={y - RIB_H / 2} width={RIB_W} height={RIB_H} rx={8} fill={colors.PANEL} stroke={dotColor} strokeWidth={1.4} />
                        <text x={RIB_X + 12} y={y - 2} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                          {r.text}
                        </text>
                        <text x={RIB_X + 12} y={y + 15} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                          {r.chip}
                        </text>
                      </g>
                    )}
                    {fly > 0.01 && fly < 0.99 && <circle cx={px} cy={py} r={7} fill={dotColor} />}
                  </g>
                );
              })}
              <text x={ENC.x + ENC.w / 2} y={ENC.y + ENC.h + 24} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
                an option's text never contains the current request
              </text>
            </g>
          )}

          {/* ================= beats 2–3, 8–9: the memory rows ================= */}
          {memU > 0.01 && (
            <g opacity={1 - 0.85 * geomDim}>
              <g opacity={clamp01(memU * 2)}>
                <text x={U_X + CELL + GAP / 2} y={HEADER_Y} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic">
                  uᵢ
                </text>
                <text x={K_X + CELL + GAP / 2} y={HEADER_Y} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic" opacity={kvU}>
                  kᵢ
                </text>
                <text x={V_X + CELL + GAP / 2} y={HEADER_Y} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic" opacity={kvU}>
                  vᵢ
                </text>
                <text x={ABAR_X + ABAR_W / 2} y={HEADER_Y} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic" opacity={attnU}>
                  aᵢ
                </text>
                <text x={QBAR_X + QBAR_W / 2} y={HEADER_Y} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic" opacity={probU}>
                  qᵢ
                </text>
              </g>
              {[0, 1, 2].map((i) => {
                const rowU = clamp01(memU * 3 - i);
                const op = rowU * optOp(i);
                if (op <= 0.01) return null;
                const y = lerp(SLOT_Y[i], SLOT_Y[PERM_SLOT[i]], ease.move(permU));
                const u = optVec(i);
                const uN = norm(u);
                const aW = weights[i] * ABAR_W * 1.6;
                const qW = q[i] * QBAR_W * 1.4;
                return (
                  <g key={i} opacity={op}>
                    <text x={NAME_X} y={y + 7} textAnchor="middle" fill={OPT[i].color} fontSize={22} fontWeight={650}>
                      {OPT[i].name}
                    </text>
                    <ValueCells x={U_X} y={y} v={u} color={OPT[i].color} u={1} />
                    <ValueCells x={K_X} y={y} v={uN} color={OPT[i].color} u={kvU} />
                    <ValueCells x={V_X} y={y} v={u} color={OPT[i].color} u={kvU} />
                    {attnU > 0.01 && (
                      <g opacity={attnU}>
                        <rect x={ABAR_X} y={y - 9} width={Math.max(0.001, aW * attnU)} height={18} rx={4} fill={OPT[i].color} opacity={0.75} />
                        <text x={ABAR_X + aW * attnU + 4} y={y + 5} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                          {weights[i].toFixed(3)}
                        </text>
                      </g>
                    )}
                    {probU > 0.01 && (
                      <g opacity={probU}>
                        <rect x={QBAR_X} y={y - 9} width={Math.max(0.001, qW * probU)} height={18} rx={4} fill={OPT[i].color} opacity={0.75} />
                        <text x={QBAR_X + qW * probU + 4} y={y + 5} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                          {q[i].toFixed(3)}
                        </text>
                        {winU > 0.01 && i === winner && (
                          <g opacity={winU}>
                            <rect x={QBAR_X - 6} y={y - 15} width={QBAR_W + 60} height={30} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
                          </g>
                        )}
                      </g>
                    )}
                    {/* leader to the compass endpoint */}
                    {leaderU > 0.01 && (
                      <line x1={U_X - 24} y1={y} x2={sv(u)[0] + 10} y2={sv(u)[1]} stroke={OPT[i].color} strokeWidth={1} strokeDasharray="3 6" opacity={leaderU * 0.5} />
                    )}
                  </g>
                );
              })}
              {kvU > 0.01 && permU < 0.99 && insetU < 0.99 && (
                <g opacity={kvU * (1 - permU) * (1 - insetU)}>
                  <text x={U_X} y={NOTE_Y} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
                    kᵢ = normalize(k_proj uᵢ) · vᵢ = v_proj uᵢ
                  </text>
                  <text x={U_X} y={NOTE_Y + 18} fill={colors.WARM} fontSize={13.5} fontFamily={MONO}>
                    identity W_k, W_v in this construction → kᵢ = vᵢ = uᵢ
                  </text>
                  <text x={U_X} y={NOTE_Y + 36} fill={colors.MUTED} fontSize={13.5} fontFamily={MONO}>
                    trained blocks learn W_k, W_v
                  </text>
                </g>
              )}
              {fixedU > 0.01 && (
                <g opacity={fixedU}>
                  <rect x={NAME_X - 22} y={HEADER_Y - 36} width={300} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={NAME_X - 10} y={HEADER_Y - 19} fill={colors.TEXT} fontSize={14}>
                    fixed during this decision · weights stay trainable
                  </text>
                </g>
              )}
              {eqPerm > 0.01 && (
                <text x={NAME_X - 10} y={NOTE_Y + 4} fill={colors.POSITIVE} fontSize={15} fontFamily={MONO} opacity={eqPerm}>
                  rows [A,B,C₋] → [C₋,A,B] · state unchanged
                </text>
              )}
              {caveatU > 0.01 && (
                <g opacity={caveatU}>
                  <text x={NAME_X - 10} y={NOTE_Y + 34} fill={colors.MUTED} fontSize={14.5}>
                    unique winner survives reordering · exact tie → first index
                  </text>
                  <text x={NAME_X - 10} y={NOTE_Y + 54} fill={colors.MUTED} fontSize={14.5}>
                    finite precision may perturb near ties
                  </text>
                  <text x={NAME_X - 10} y={NOTE_Y + 74} fill={colors.MUTED} fontSize={13.5} fontFamily={MONO}>
                    best = max(range(len(q)), key=q.__getitem__)
                  </text>
                  <text x={NAME_X - 10} y={NOTE_Y + 94} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                    qᵢ = softmax(sᵢ/τ_dec) · τ_dec = 0.20 illustrative
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ================= beats 4–6: inset (equal scales) + score panel ================= */}
          {insetU > 0.01 && (
            <g opacity={insetU * (1 - 0.85 * panelDim)}>
              {/* dashed leader from the compass state to the inset */}
              <line x1={zTip[0] + 8} y1={zTip[1]} x2={IN.x} y2={IN_C[1]} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="4 6" opacity={0.6} />
              <rect x={IN.x} y={IN.y} width={IN.s} height={IN.s} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={IN_C[0]} y={IN.y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                state detail · equal scales · ±0.03
              </text>
              {/* axis through y = 0 with ticks at 1.00, 1.02, 1.04 */}
              <line x1={IN.x + 8} y1={IN_C[1]} x2={IN.x + IN.s - 8} y2={IN_C[1]} stroke={colors.GRID} strokeWidth={1.5} />
              {[1.0, 1.02, 1.04].map((xv) => (
                <g key={xv}>
                  <line x1={iv([xv, 0])[0]} y1={IN_C[1] - 4} x2={iv([xv, 0])[0]} y2={IN_C[1] + 4} stroke={colors.MUTED} strokeWidth={1.2} />
                  <text x={iv([xv, 0])[0]} y={IN.y + IN.s - 12} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                    {xv.toFixed(2)}
                  </text>
                </g>
              ))}
              {[0.02, -0.02].map((yv) => (
                <g key={yv}>
                  <line x1={IN.x + 8} y1={iv([IN_X0, yv])[1]} x2={IN.x + 16} y2={iv([IN_X0, yv])[1]} stroke={colors.MUTED} strokeWidth={1.2} />
                  <text x={IN.x + 20} y={iv([IN_X0, yv])[1] + 4} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                    {fmtSigned(yv, 2)}
                  </text>
                </g>
              ))}
              {/* z0 hollow marker, live state arrow */}
              <circle cx={iv(Z0)[0]} cy={iv(Z0)[1]} r={6} fill="none" stroke={STATE_COLOR} strokeWidth={2} />
              <text x={iv(Z0)[0]} y={iv(Z0)[1] - 12} textAnchor="middle" fill={STATE_COLOR} fontSize={16} fontStyle="italic">
                z₀
              </text>
              {moved && (
                <>
                  <Vec x1={iv(Z0)[0]} y1={iv(Z0)[1]} x2={iv(z)[0]} y2={iv(z)[1]} color={STATE_COLOR} width={3} head={10} />
                  <circle cx={iv(z)[0]} cy={iv(z)[1]} r={5} fill={STATE_COLOR} />
                  <text x={iv(z)[0] + 2} y={iv(z)[1] + (z[1] >= 0 ? -14 : 24)} textAnchor="middle" fill={STATE_COLOR} fontSize={16} fontStyle="italic">
                    z₁
                  </text>
                  <text x={IN.x + 14} y={IN.y + IN.s - 54} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    α·m = ({fmtSigned(z[0] - 1, 4)}, {fmtSigned(z[1], 4)})
                  </text>
                </>
              )}
            </g>
          )}
          {scoresU > 0.01 && (
            <g opacity={scoresU * (1 - 0.85 * panelDim)}>
              {/* score ruler */}
              <text x={SR_X} y={IN.y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                sᵢ = z·uᵢ
              </text>
              <line x1={SR_X} y1={SR(0.6)} x2={SR_X} y2={SR(0.86)} stroke={colors.MUTED} strokeWidth={1.5} />
              {[0.6, 0.7, 0.8].map((v) => (
                <g key={v}>
                  <line x1={SR_X - 5} y1={SR(v)} x2={SR_X + 5} y2={SR(v)} stroke={colors.MUTED} strokeWidth={1.2} />
                  <text x={SR_X - 10} y={SR(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                    {v.toFixed(1)}
                  </text>
                </g>
              ))}
              {[
                { v: sA, c: OPT[0].color, n: 'A', dx: 22 },
                { v: sB, c: OPT[1].color, n: 'B', dx: 22 },
                { v: sC, c: OPT[2].color, n: 'C', dx: 22 },
              ].map((m, i) => {
                const op = i === 2 ? cU : 1;
                if (op <= 0.01) return null;
                const y = SR(Math.max(0.6, Math.min(0.86, m.v)));
                const hollow = !moved && i < 2;
                const isWin = moved && i === winner;
                // the A/B labels stack by rank so near-ties never overprint
                const abTop = i < 2 ? (i === 0 ? sA >= sB : sB > sA) : false;
                return (
                  <g key={i} opacity={op}>
                    <circle cx={SR_X} cy={y} r={isWin ? 7 : 6} fill={hollow ? 'none' : m.c} stroke={m.c} strokeWidth={2} />
                    <text x={SR_X + m.dx} y={y + (i === 2 ? 5 : abTop ? -3 : 13)} fill={m.c} fontSize={13} fontFamily={MONO}>
                      {m.n} {m.v.toFixed(4)}
                    </text>
                  </g>
                );
              })}
              {!moved && (
                <text x={SR_X + 22} y={SR(0.8) + 30} fill={colors.MUTED} fontSize={13} fontStyle="italic">
                  tie: z₀·A = z₀·B = 0.8
                </text>
              )}
              {/* signed margin bar */}
              <text x={MB_X} y={IN.y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                s_A − s_B
              </text>
              <line x1={MB_X - 22} y1={MB_Y0} x2={MB_X + 22} y2={MB_Y0} stroke={colors.MUTED} strokeWidth={1.5} />
              <text x={MB_X + 28} y={MB_Y0 + 4} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                0
              </text>
              {Math.abs(margin) > 1e-7 && (
                <rect
                  x={MB_X - 12}
                  y={margin > 0 ? MB_Y0 - margin * MB_SCALE : MB_Y0}
                  width={24}
                  height={Math.abs(margin) * MB_SCALE}
                  rx={4}
                  fill={margin > 0 ? OPT[0].color : OPT[1].color}
                  opacity={0.85}
                />
              )}
              <text x={MB_X} y={IN.y + IN.s + 12} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
                {fmtSigned(margin, 5)}
              </text>
              <text x={MB_X + 28} y={MB_Y0 - 62} fill={OPT[0].color} fontSize={12.5} fontFamily={MONO}>
                ↑ A
              </text>
              <text x={MB_X + 28} y={MB_Y0 + 70} fill={OPT[1].color} fontSize={12.5} fontFamily={MONO}>
                ↓ B
              </text>
              {flipU > 0.01 && (
                <g opacity={flipU}>
                  <rect x={IN.x} y={IN.y - 34} width={430} height={26} rx={7} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.2} />
                  <text x={IN.x + 215} y={IN.y - 16} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={600}>
                    C changes → winner flips · A and B never moved
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ================= beat 7: set-aware vs set-independent (opaque panel) ================= */}
          {indepU > 0.01 && (
            <g opacity={indepU}>
              <rect x={730} y={345} width={440} height={238} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={950} y={374} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={650}>
                why an independent scorer cannot do this
              </text>
              <MathLabel tex={'\\text{Jeva: } s_i = z_1(\\mathcal{O})\\cdot u_i'} x={950} y={414} fontSize={23} boxWidth={420} />
              <text x={950} y={440} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
                the refined state read the whole set
              </text>
              <MathLabel tex={'\\text{eq. 2: } \\log\\frac{p_A}{p_B} = g(x,A) - g(x,B)'} x={950} y={488} fontSize={23} boxWidth={420} />
              <text x={950} y={524} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
                the shared denominator cancels: a retained pair keeps its order
              </text>
              <text x={950} y={556} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
                (adding options still rescales each independent pᵢ — it cannot reverse A vs B)
              </text>
            </g>
          )}
        </g>

        {/* ================= closing panel ================= */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={250} y={250} width={780} height={230} rx={16} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
              Fixed option memory.
            </text>
            <text x={640} y={352} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
              Set-aware judgment.
            </text>
            <Vec x1={430} y1={424} x2={560} y2={424} color={STATE_COLOR} width={2.6} head={10} opacity={0.6} />
            <text x={600} y={433} fill={colors.NEGATIVE} fontSize={26} fontWeight={650} textAnchor="middle">
              ?
            </text>
            <text x={700} y={432} fill={colors.NEGATIVE} fontSize={22} fontFamily={MONO} textAnchor="middle">
              null
            </text>
            <text x={840} y={432} fill={colors.MUTED} fontSize={16} fontStyle="italic" textAnchor="middle">
              does any option belong?
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title + source chip ================= */}
      <text x={640} y={38} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={650} opacity={1 - 0.6 * stageDim}>
        Fixed options, changing judgments
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

export const vizScene = () => scene;
