// Three clues before an answer
//
// Backing (Nandakishor M, arXiv:2510.01237v1, user-supplied four-page PDF; no repository):
//   p.2 eq. 1 — cosine between the PROJECTED final hidden state and a reference embedding
//               (all-MiniLM-L6-v2, 384 dimensions, a separate reference model).
//   p.2 eq. 2 — early/late layer variance ratio with an epsilon in the denominator.
//   p.2 eq. 3 — learned confidence head on the final internal state
//               (p.2–3: 72 training examples, 30 epochs, SmolLM2-360M-Instruct).
//   p.2 eq. 4 — weighted combination; weights learned on labeled validation data.
//   p.2 eq. 5 — routing thresholds 0.75 / 0.55 / 0.35 (shown here only as dial ticks).
//
// Accuracy contract: raw cosine can be negative and the variance ratio can exceed 1; the
// paper does not fully specify how they are normalized into one bounded score, so the
// adapter in beat 8 is an outlined '?' and the weights stay symbolic (no coefficients).
// Equation notation paraphrases the paper's symbols. "Before generation" means before
// ANSWER generation — the prompt forward pass still runs (beat 2).
//
// Illustrative inputs: the vector angles, layer traces, head wiring and the dial's 0.62
// are deterministic illustrations, labeled as such on screen — not model measurements.
//
// Machine: one activation ribbon → fans into three instruments → rejoins as a dial in
// front of a closed answer gate.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Vec } from '../../primitives';
import {
  ACT,
  ActivationRibbon,
  LAYERS,
  Label,
  Note,
  ROUTES,
  ROWS,
  THRESHOLDS,
  Tag,
  clamp01,
  lerp,
  routeIndex,
  seg,
} from './shared/machines';

const { ACCENT, SECONDARY, WARM, MUTED, TEXT, PANEL, font, ink } = colors;

export const CAPTIONS = [
  'A fluent answer can still be wrong. This paper asks whether we can choose a safer route before the answer starts.',
  'The model first processes the question. Its internal activations supply clues, so this is before answer generation, not before computation.',
  'The first clue compares two directions: a projected model state and an embedding from a separate reference model.',
  'When those directions line up, semantic alignment rises. Similarity is a useful clue, but it does not establish that an answer is true.',
  'The second clue compares variation in earlier and later layers. The paper treats reduced variation as evidence of convergence.',
  "The third clue is learned. A small neural network predicts confidence from the model's final internal state.",
  'A weighted combination joins the three clues. The paper says the weights are learned using labeled validation data.',
  'There is a missing detail: raw similarity and variance ratios do not naturally share a zero-to-one scale. The paper leaves that normalization underspecified.',
  'Read the resulting score as a routing signal. It is not a demonstrated probability that the answer will be correct.',
] as const;

// ---------------------------------------------------------------------------
// Module-scope math (all illustrative, all deterministic)
// ---------------------------------------------------------------------------

const RAD = Math.PI / 180;

// eq. 1 — real cosine of the angle between the two drawn directions
const REF_DEG = -18;
const THETA_START = -112;
const THETA_END = -30;
export const cosineOf = (thetaDeg: number): number => Math.cos((thetaDeg - REF_DEG) * RAD);

// eq. 2 — seven traces across twelve layers, narrowing; variances are computed from them
const N_TRACES = 7;
const spread = (l: number) => 0.16 + 0.84 * Math.exp(-l / 3.2);
const TRACES: number[][] = Array.from({ length: N_TRACES }, (_, j) =>
  Array.from({ length: LAYERS }, (_, l) => {
    const off = (j - (N_TRACES - 1) / 2) / ((N_TRACES - 1) / 2);
    return (off + 0.22 * Math.sin(1.3 * l + 2.1 * j)) * spread(l);
  }),
);
const variance = (xs: number[]) => {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return xs.reduce((a, b) => a + (b - m) * (b - m), 0) / xs.length;
};
const HALF = LAYERS / 2;
const VAR_EARLY = variance(TRACES.flatMap((tr) => tr.slice(0, HALF)));
const VAR_LATE = variance(TRACES.flatMap((tr) => tr.slice(HALF)));
const EPS = 1e-6;
export const VAR_RATIO = VAR_EARLY / (VAR_LATE + EPS); // > 1 for these traces

// eq. 3 — a small head: 5 → 4 → 1 (illustrative wiring strengths)
const HEAD = [ROWS, 4, 1];
const wire = (a: number, b: number, k: number) => 0.2 + 0.8 * Math.abs(Math.sin(2.9 * a + 1.7 * b + 4.1 * k));

// the dial's illustrative resting value (lands in the 0.55–0.75 band)
const DIAL_SCORE = 0.62;

// ---------------------------------------------------------------------------
// Layout. Captions own y ≥ 633; the machine lives in y = 45…615.
// ---------------------------------------------------------------------------

const RIB = { x: 80, y: 285, w: 336, h: 90 };
const MID_Y = 330;
const BOX = { x: 470, w: 360, h: 170 };
const BOX_CY = [130, 330, 530];
const DIAL = { x: 930, y: 338, r: 56 };
const GATE = { x: 1040, y0: 250, y1: 410 };

type Pt = { x: number; y: number };
const cubic = (p0: Pt, c1: Pt, c2: Pt, p3: Pt, u: number): Pt => {
  const v = 1 - u;
  return {
    x: v * v * v * p0.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * p3.x,
    y: v * v * v * p0.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * p3.y,
  };
};
const FAN = BOX_CY.map((cy) => {
  const pts: [Pt, Pt, Pt, Pt] = [
    { x: RIB.x + RIB.w + 6, y: MID_Y }, { x: 450, y: MID_Y }, { x: 440, y: cy }, { x: BOX.x, y: cy },
  ];
  return { pts, d: `M${pts[0].x},${pts[0].y} C${pts[1].x},${pts[1].y} ${pts[2].x},${pts[2].y} ${pts[3].x},${pts[3].y}` };
});
const JOIN = BOX_CY.map((cy) => {
  const pts: [Pt, Pt, Pt, Pt] = [
    { x: BOX.x + BOX.w, y: cy }, { x: 862, y: cy }, { x: 848, y: DIAL.y - 8 }, { x: DIAL.x - DIAL.r - 6, y: DIAL.y - 8 },
  ];
  return { pts, d: `M${pts[0].x},${pts[0].y} C${pts[1].x},${pts[1].y} ${pts[2].x},${pts[2].y} ${pts[3].x},${pts[3].y}` };
});
const TINTS = [ACCENT, WARM, SECONDARY];

// instrument A
const VO = { x: 532, y: 192 };
const VLEN = 112;
// instrument B
const TR = { x: 486, dx: 15, amp: 62 };
const TRACE_D = TRACES.map(
  (tr) => 'M' + tr.map((v, l) => `${TR.x + l * TR.dx},${(BOX_CY[1] + v * TR.amp).toFixed(2)}`).join(' L'),
);
// instrument C
const HEAD_X = [570, 626, 682];
const headY = (layer: number, i: number) => BOX_CY[2] + (i - (HEAD[layer] - 1) / 2) * 22;
const COL = { x: 494, w: 18 };

const LANE_Y = [405, 355, 305, 255]; // ROUTES index 0…3 (human … local), local on top

// ---------------------------------------------------------------------------
// Timeline — nine fixed captions, ≈ 87 authored seconds.
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const n = (k: string, v = 0) => tl.channel(k, v);
  const to = (ch: ChannelRef<number>, v: number, at: number, dur = 0.7, e = ease.enter) =>
    tl.tween(ch, v, { at, dur, ease: e });
  const look = (c: CameraState, at: number, dur = 1.4) => tl.tween(cam, c, { at, dur, ease: ease.move });
  const B = (i: number) => 0.5 + 9.6 * (i - 1);
  const DUR = 8.4;

  const ribO = n('ribO');
  const tokenIn = n('tokenIn');
  const gateO = n('gateO');
  const wordsO = n('wordsO');
  const guideU = n('guideU');
  const guideO = n('guideO', 1);
  const lit = n('lit');
  const scopeLbl = n('scopeLbl');
  const boxA = n('boxA');
  const boxB = n('boxB');
  const boxC = n('boxC');
  const fanA = n('fanA');
  const fanB = n('fanB');
  const fanC = n('fanC');
  const vecU = n('vecU');
  const mapLbl = n('mapLbl');
  const eq1 = n('eq1');
  const theta = n('theta', THETA_START);
  const arcO = n('arcO');
  const caveatA = n('caveatA');
  const traceU = n('traceU');
  const bandU = n('bandU');
  const eq2 = n('eq2');
  const colU = n('colU');
  const headU = n('headU');
  const eq3 = n('eq3');
  const joinU = n('joinU');
  const pktU = n('pktU');
  const dialO = n('dialO');
  const dialV = n('dialV');
  const eq4 = n('eq4');
  const eqDim = n('eqDim', 1);
  const rulerO = n('rulerO');
  const approachU = n('approachU');
  const adapterO = n('adapterO');
  const routeLbl = n('routeLbl');
  const laneU = n('laneU');

  CAPTIONS.forEach((text, i) => tl.caption({ at: B(i + 1), dur: DUR, text }));

  // 1 — the query arrives; the answer waits, uncommitted, behind a closed gate
  to(ribO, 1, 0.5);
  to(tokenIn, 1, 0.9, 1.2, ease.move);
  to(gateO, 1, 2.2);
  to(guideU, 1, 2.6, 1.6, ease.draw);
  to(wordsO, 1, 4.0);
  tl.hold(B(1) + DUR, 1.2);

  // 2 — follow the query across the layers; columns light in order; the gate stays shut
  look({ x: 190, y: MID_Y, k: 2.1 }, B(2), 1.4);
  to(lit, LAYERS, B(2) + 1.2, 5.6, ease.linear);
  look({ x: 330, y: MID_Y, k: 2.1 }, B(2) + 1.4, 5.4);
  to(scopeLbl, 1, B(2) + 3.0);
  tl.hold(B(2) + DUR, 1.2);

  // 3 — instrument one: two directions from a shared origin, eq. 1
  to(scopeLbl, 0, B(3), 0.5);
  to(guideO, 0, B(3), 0.5);
  to(fanA, 1, B(3) + 0.2, 1.2, ease.draw);
  to(boxA, 1, B(3) + 0.6);
  look({ x: 650, y: BOX_CY[0], k: 2.3 }, B(3) + 0.2, 1.5);
  to(vecU, 1, B(3) + 1.8, 1.0, ease.draw);
  to(mapLbl, 1, B(3) + 3.0);
  to(eq1, 1, B(3) + 4.4);
  tl.hold(B(3) + DUR, 1.2);

  // 4 — the model direction turns; the readout is the real cosine of the drawn angle
  to(arcO, 1, B(4) + 0.2);
  look({ x: 640, y: BOX_CY[0] + 4, k: 2.55 }, B(4), 1.2);
  to(theta, THETA_END, B(4) + 1.2, 3.4, ease.move);
  to(caveatA, 1, B(4) + 5.2);
  tl.hold(B(4) + DUR, 1.2);

  // 5 — instrument two: the ribbon fans into traces that narrow, eq. 2
  to(boxA, 0.15, B(5));
  look({ x: 600, y: BOX_CY[1], k: 1.9 }, B(5), 1.5);
  to(fanB, 1, B(5) + 0.4, 1.0, ease.draw);
  to(boxB, 1, B(5) + 0.8);
  to(traceU, 1, B(5) + 1.6, 2.2, ease.draw);
  to(bandU, 1, B(5) + 4.0, 1.0, ease.move);
  to(eq2, 1, B(5) + 5.2);
  tl.hold(B(5) + DUR, 1.2);

  // 6 — instrument three: the final column enters a small learned head, eq. 3
  to(boxB, 0.15, B(6));
  look({ x: 650, y: BOX_CY[2] - 6, k: 2.2 }, B(6), 1.5);
  to(fanC, 1, B(6) + 0.4, 1.0, ease.draw);
  to(boxC, 1, B(6) + 0.8);
  to(colU, 1, B(6) + 1.6, 1.4, ease.move);
  to(headU, 1, B(6) + 3.2, 2.2, ease.linear);
  to(eq3, 1, B(6) + 5.6);
  tl.hold(B(6) + DUR, 1.2);

  // 7 — three readings rejoin: eq. 4 with symbolic weights
  to(boxA, 1, B(7));
  to(boxB, 1, B(7));
  look({ x: 640, y: 385, k: 1 }, B(7), 1.5);
  to(joinU, 1, B(7) + 1.2, 1.4, ease.draw);
  to(dialO, 1, B(7) + 1.8);
  to(pktU, 1, B(7) + 2.8, 1.6, ease.linear);
  to(eq4, 1, B(7) + 3.6);
  to(dialV, DIAL_SCORE, B(7) + 4.4, 1.6, ease.move);
  tl.hold(B(7) + DUR, 1.2);

  // 8 — mismatched rulers meet an outlined '?' adapter
  to(boxA, 0.15, B(8));
  to(boxB, 0.15, B(8));
  to(boxC, 0.15, B(8));
  to(eq4, 0.15, B(8));
  look({ x: 900, y: 250, k: 1.35 }, B(8), 1.5);
  to(rulerO, 1, B(8) + 1.0);
  to(adapterO, 1, B(8) + 2.6);
  to(approachU, 1, B(8) + 3.4, 1.6, ease.move);
  tl.hold(B(8) + DUR, 1.2);

  // 9 — pull back: a routing score, not a probability; the gate starts choosing a lane
  to(rulerO, 0.12, B(9));
  to(adapterO, 0.12, B(9));
  to(eqDim, 0.12, B(9));
  to(joinU, 1, B(9), 0.1);
  to(wordsO, 0, B(9), 0.6);
  look(CAMERA_HOME, B(9), 1.6);
  to(routeLbl, 1, B(9) + 1.6);
  to(laneU, 1, B(9) + 3.0, 1.6, ease.draw);
  tl.hold(B(9) + DUR, 1.4);

  return {
    tl, cam, ribO, tokenIn, gateO, wordsO, guideU, guideO, lit, scopeLbl, boxA, boxB, boxC, fanA, fanB,
    fanC, vecU, mapLbl, eq1, theta, arcO, caveatA, traceU, bandU, eq2, colU, headU, eq3, joinU, pktU,
    dialO, dialV, eq4, eqDim, rulerO, approachU, adapterO, routeLbl, laneU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state
// ---------------------------------------------------------------------------

function Frame({ i, title }: { i: number; title: string }) {
  const cy = BOX_CY[i];
  return (
    <g>
      <rect x={BOX.x} y={cy - BOX.h / 2} width={BOX.w} height={BOX.h} rx={10} fill={PANEL} stroke={TINTS[i]} strokeOpacity={0.55} />
      <text x={BOX.x + BOX.w - 10} y={cy - BOX.h / 2 + 16} fill={TINTS[i]} fontFamily={font.mono} fontSize={9} textAnchor="end">
        {title}
      </text>
    </g>
  );
}

function draw(u: number) {
  return { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp01(u) };
}

export function Render({ s }: { s: SceneState }) {
  const g = <T,>(ch: ChannelRef<T>) => s.get(ch);
  const lit = g(scene.lit);
  const tokenIn = g(scene.tokenIn);
  const theta = g(scene.theta);
  const cosv = cosineOf(theta);
  const eqDim = g(scene.eqDim);
  const vecU = g(scene.vecU);
  const bandU = g(scene.bandU);
  const colU = g(scene.colU);
  const headU = g(scene.headU);
  const pktU = g(scene.pktU);
  const dialV = g(scene.dialV);
  const approach = g(scene.approachU);
  const laneU = g(scene.laneU);
  const routeLbl = g(scene.routeLbl);

  // query token: enters, then rides the lit front across the ribbon
  const tokX = lerp(lerp(-30, RIB.x - 34, tokenIn), RIB.x + RIB.w, lit / LAYERS);
  const tokY = lit > 0 ? RIB.y - 22 : MID_Y;

  // instrument A geometry
  const refTip = { x: VO.x + VLEN * Math.cos(REF_DEG * RAD), y: VO.y + VLEN * Math.sin(REF_DEG * RAD) };
  const modTip = { x: VO.x + VLEN * Math.cos(theta * RAD), y: VO.y + VLEN * Math.sin(theta * RAD) };
  const ar = 40;
  const a0 = { x: VO.x + ar * Math.cos(theta * RAD), y: VO.y + ar * Math.sin(theta * RAD) };
  const a1 = { x: VO.x + ar * Math.cos(REF_DEG * RAD), y: VO.y + ar * Math.sin(REF_DEG * RAD) };

  // final column flying into the head
  const colP = cubic(FAN[2].pts[0], FAN[2].pts[1], FAN[2].pts[2], { x: COL.x + COL.w / 2, y: BOX_CY[2] }, colU);

  // dial needle
  const na = Math.PI * (1 - dialV);
  const needle = { x: DIAL.x + (DIAL.r - 8) * Math.cos(na), y: DIAL.y - (DIAL.r - 8) * Math.sin(na) };
  const sel = routeIndex(dialV);
  const sh = 24 * approach;

  return (
    <g>
      <Camera {...g(scene.cam)}>
        {/* beat-1 guide: the paused answer path from ribbon to gate */}
        <g opacity={g(scene.guideO)}>
          <line x1={RIB.x + RIB.w + 8} y1={MID_Y} x2={lerp(RIB.x + RIB.w + 8, GATE.x - 8, g(scene.guideU))} y2={MID_Y}
            stroke={MUTED} strokeWidth={1.4} strokeDasharray="5 7" strokeOpacity={0.6} />
          <Label x={730} y={MID_Y - 12} text="answer path · paused" o={seg(g(scene.guideU), 0.6, 1)} anchor="middle" size={11} />
        </g>

        {/* the persistent activation ribbon */}
        <ActivationRibbon {...RIB} lit={lit} o={g(scene.ribO)} color={ACCENT} />
        <Label x={RIB.x} y={RIB.y + RIB.h + 24} text={`${LAYERS} layers shown · illustrative activations`} o={g(scene.ribO) * 0.9} size={10} />
        <Label x={RIB.x + RIB.w / 2} y={RIB.y - 44} text="prompt forward pass runs · no answer token yet" o={g(scene.scopeLbl)} anchor="middle" size={9} color={TEXT} />
        <g opacity={g(scene.ribO)}>
          <circle cx={tokX} cy={tokY} r={lit > 0 ? 6 : 11} fill={WARM} />
          {lit <= 0 ? <Label x={tokX} y={MID_Y - 20} text="query" anchor="middle" color={WARM} size={12} /> : null}
        </g>

        {/* fan: ribbon → three instruments */}
        {[scene.fanA, scene.fanB, scene.fanC].map((ch, i) => (
          <path key={i} d={FAN[i].d} fill="none" stroke={TINTS[i]} strokeWidth={1.6} strokeOpacity={0.75} {...draw(g(ch))} />
        ))}

        {/* instrument A — semantic alignment (eq. 1) */}
        <g opacity={g(scene.boxA)}>
          <Frame i={0} title="clue 1 · semantic alignment" />
          <Vec x1={VO.x} y1={VO.y} x2={refTip.x} y2={refTip.y} grow={vecU} color={MUTED} width={2.4} head={8} />
          <Vec x1={VO.x} y1={VO.y} x2={modTip.x} y2={modTip.y} grow={vecU} color={ACCENT} width={2.4} head={8} />
          <circle cx={VO.x} cy={VO.y} r={2.6} fill={TEXT} opacity={vecU} />
          <path d={`M${a0.x},${a0.y} A${ar},${ar} 0 0 1 ${a1.x},${a1.y}`} fill="none" stroke={WARM} strokeWidth={1.6} opacity={g(scene.arcO)} />
          <g opacity={g(scene.mapLbl)}>
            <MathLabel tex={'P\\,h_L'} x={modTip.x + 4} y={modTip.y - 10} fontSize={10} color={ACCENT} boxWidth={80} />
            <MathLabel tex={'e_{\\text{ref}}'} x={refTip.x - 6} y={refTip.y + 16} fontSize={10} color={MUTED} boxWidth={80} />
            <Label x={678} y={150} text="P : model state → 384-d" size={8} color={TEXT} />
            <Label x={678} y={162} text="reference space (all-MiniLM-L6-v2)" size={8} />
          </g>
          <MathLabel tex={'s_{\\text{sem}}=\\cos\\!\\big(P\\,h_L,\\;e_{\\text{ref}}\\big)'} x={748} y={92} fontSize={12}
            opacity={g(scene.eq1) * eqDim} boxWidth={220} />
          <g opacity={g(scene.arcO)}>
            <Label x={678} y={126} text={`cos θ = ${cosv >= 0 ? '+' : '−'}${Math.abs(cosv).toFixed(2)}`} size={11} color={WARM} />
          </g>
          <Tag x={678} y={196} text="Illustrative geometry" size={8} o={g(scene.mapLbl)} />
          <Label x={678} y={180} text="alignment ≠ verified truth" size={8} color={TEXT} o={g(scene.caveatA)} />
        </g>

        {/* instrument B — layer convergence (eq. 2) */}
        <g opacity={g(scene.boxB)}>
          <Frame i={1} title="clue 2 · convergence" />
          {/* early / late variance bands: half-height = one standard deviation of the drawn traces */}
          {[{ l0: 0, v: VAR_EARLY, name: 'early' }, { l0: HALF, v: VAR_LATE, name: 'late' }].map((b) => {
            const hh = Math.sqrt(b.v) * TR.amp * bandU;
            return (
              <g key={b.name} opacity={clamp01(bandU * 2)}>
                <rect x={TR.x + b.l0 * TR.dx - 4} y={BOX_CY[1] - hh} width={(HALF - 1) * TR.dx + 8} height={hh * 2} rx={3}
                  fill={WARM} fillOpacity={0.14} stroke={WARM} strokeOpacity={0.6} strokeWidth={0.8} />
                <Label x={TR.x + (b.l0 + (HALF - 1) / 2) * TR.dx} y={BOX_CY[1] + 76} text={`${b.name} layers`} anchor="middle" size={8} color={WARM} />
              </g>
            );
          })}
          {TRACE_D.map((d, j) => (
            <path key={j} d={d} fill="none" stroke={WARM} strokeOpacity={0.85} strokeWidth={1.2} {...draw(g(scene.traceU))} />
          ))}
          <MathLabel tex={'s_{\\text{conv}}=\\dfrac{\\sigma^2_{\\text{early}}}{\\sigma^2_{\\text{late}}+\\epsilon}'} x={752} y={298} fontSize={12}
            opacity={g(scene.eq2) * eqDim} boxWidth={200} />
          <g opacity={g(scene.eq2)}>
            <Label x={752} y={352} text={`ratio ≈ ${VAR_RATIO.toFixed(1)}  (can exceed 1)`} size={9} color={WARM} anchor="middle" />
          </g>
          <Tag x={752} y={396} text="Illustrative geometry" size={8} anchor="middle" o={clamp01(g(scene.traceU) * 2)} />
        </g>

        {/* instrument C — learned head (eq. 3) */}
        <g opacity={g(scene.boxC)}>
          <Frame i={2} title="clue 3 · learned head" />
          {HEAD.slice(0, -1).map((cnt, layer) =>
            Array.from({ length: cnt }, (_, a) =>
              Array.from({ length: HEAD[layer + 1] }, (_, b) => {
                const u = seg(headU, layer * 0.45, layer * 0.45 + 0.5);
                return (
                  <line key={`${layer}-${a}-${b}`} x1={HEAD_X[layer]} y1={headY(layer, a)} x2={HEAD_X[layer + 1]} y2={headY(layer + 1, b)}
                    stroke={SECONDARY} strokeWidth={0.9} strokeOpacity={0.08 + 0.6 * wire(a, b, layer) * u} />
                );
              }),
            ),
          )}
          {HEAD.map((cnt, layer) =>
            Array.from({ length: cnt }, (_, a) => {
              const u = seg(headU, layer * 0.4, layer * 0.4 + 0.25);
              const last = layer === HEAD.length - 1;
              return (
                <circle key={`${layer}-${a}`} cx={HEAD_X[layer]} cy={headY(layer, a)} r={last ? 6 : 4}
                  fill={last ? TEXT : SECONDARY} fillOpacity={0.2 + 0.8 * u} />
              );
            }),
          )}
          <line x1={COL.x + COL.w + 4} y1={BOX_CY[2]} x2={HEAD_X[0] - 8} y2={BOX_CY[2]} stroke={SECONDARY} strokeOpacity={0.5} strokeWidth={1} />
          <MathLabel tex={'s_{\\text{learn}}'} x={HEAD_X[2] + 30} y={BOX_CY[2]} fontSize={10} color={TEXT} opacity={seg(headU, 0.85, 1)} boxWidth={70} />
          <MathLabel tex={'s_{\\text{learn}}=f_{\\phi}(h_L)'} x={764} y={486} fontSize={12} opacity={g(scene.eq3) * eqDim} boxWidth={200} />
          <Label x={COL.x + COL.w / 2} y={BOX_CY[2] + 66} text="final state" anchor="middle" size={8} />
          <Label x={764} y={560} text="Paper-reported: 72 training" size={8} anchor="middle" o={g(scene.eq3)} color={TEXT} />
          <Label x={764} y={572} text="examples · 30 epochs" size={8} anchor="middle" o={g(scene.eq3)} color={TEXT} />
          <Tag x={764} y={600} text="Illustrative geometry" size={8} anchor="middle" />
        </g>
        {/* the ribbon's final column, carried into the head */}
        {colU > 0 ? (
          <g opacity={g(scene.boxC)}>
            {ACT[LAYERS - 1].map((v, r) => (
              <rect key={r} x={colP.x - COL.w / 2} y={colP.y + (r - ROWS / 2) * 20 + 1} width={COL.w} height={18} rx={3}
                fill={ACCENT} fillOpacity={0.15 + 0.8 * v} />
            ))}
          </g>
        ) : null}

        {/* rejoin: three readings → dial (eq. 4) */}
        {JOIN.map((j, i) => {
          const p = cubic(j.pts[0], j.pts[1], j.pts[2], j.pts[3], pktU);
          return (
            <g key={i} opacity={Math.max(0.15, eqDim)}>
              <path d={j.d} fill="none" stroke={TINTS[i]} strokeWidth={1.6} strokeOpacity={0.75} {...draw(g(scene.joinU))} />
              {pktU > 0 && pktU < 1 ? <circle cx={p.x} cy={p.y} r={4.5} fill={TINTS[i]} /> : null}
            </g>
          );
        })}
        <MathLabel tex={'C = w_1\\,s_{\\text{sem}} + w_2\\,s_{\\text{conv}} + w_3\\,s_{\\text{learn}}'} x={990} y={436} fontSize={14}
          opacity={g(scene.eq4)} boxWidth={320} />
        <Label x={990} y={464} text="weights: learned on labeled validation data · symbolic here" size={9} anchor="middle"
          o={g(scene.eq4)} />

        <g opacity={g(scene.dialO)}>
          <path d={`M${DIAL.x - DIAL.r},${DIAL.y} A${DIAL.r},${DIAL.r} 0 0 1 ${DIAL.x + DIAL.r},${DIAL.y}`} fill={PANEL}
            stroke={ink.axis} strokeWidth={2} />
          {/* threshold ticks (paper eq. 5) arrive with the routing reading in beat 9 */}
          {THRESHOLDS.map((th, i) => {
            const a = Math.PI * (1 - th);
            return (
              <line key={th} opacity={routeLbl}
                x1={DIAL.x + (DIAL.r - 7) * Math.cos(a)} y1={DIAL.y - (DIAL.r - 7) * Math.sin(a)}
                x2={DIAL.x + (DIAL.r + 5) * Math.cos(a)} y2={DIAL.y - (DIAL.r + 5) * Math.sin(a)}
                stroke={ROUTES[i + 1].color} strokeWidth={2.4} />
            );
          })}
          <line x1={DIAL.x} y1={DIAL.y} x2={needle.x} y2={needle.y} stroke={TEXT} strokeWidth={2.6} strokeLinecap="round" />
          <circle cx={DIAL.x} cy={DIAL.y} r={4.5} fill={TEXT} />
          <Label x={DIAL.x - DIAL.r} y={DIAL.y + 16} text="0" anchor="middle" size={10} />
          <Label x={DIAL.x + DIAL.r} y={DIAL.y + 16} text="1" anchor="middle" size={10} />
          <MathLabel tex={'C'} x={DIAL.x} y={DIAL.y + 20} fontSize={14} opacity={1 - routeLbl} boxWidth={60} />
          <Note x={DIAL.x} y={DIAL.y + 26} text="routing score" anchor="middle" size={14} weight={600} o={routeLbl} />
          <Label x={DIAL.x} y={DIAL.y + 42} text="not a calibrated probability" anchor="middle" size={9} o={routeLbl} />
          <Tag x={DIAL.x} y={DIAL.y - DIAL.r - 12} text="Illustrative score" size={9} anchor="middle" o={seg(dialV, 0.1, 0.4)} />
        </g>

        {/* beat 8 — mismatched rulers and the unspecified adapter */}
        <g opacity={g(scene.rulerO)}>
          <g transform={`translate(${sh}, 0)`}>
            <Label x={860} y={88} text="raw cosine" size={10} color={ACCENT} />
            <line x1={860} y1={108} x2={1010} y2={108} stroke={ACCENT} strokeWidth={1.6} />
            {[-1, 0, 1].map((v) => (
              <g key={v}>
                <line x1={935 + v * 75} y1={102} x2={935 + v * 75} y2={114} stroke={ACCENT} strokeWidth={1.4} />
                <Label x={935 + v * 75} y={128} text={v === -1 ? '−1' : String(v)} anchor="middle" size={9} />
              </g>
            ))}
            <Label x={860} y={160} text="variance ratio" size={10} color={WARM} />
            <Vec x1={860} y1={180} x2={1036} y2={180} color={WARM} width={1.6} head={7} />
            {[0, 1].map((v) => (
              <g key={v}>
                <line x1={860 + v * 100} y1={174} x2={860 + v * 100} y2={186} stroke={WARM} strokeWidth={1.4} />
                <Label x={860 + v * 100} y={200} text={String(v)} anchor="middle" size={9} />
              </g>
            ))}
            <Label x={1016} y={200} text="> 1" anchor="middle" size={9} color={WARM} />
          </g>
        </g>
        <g opacity={g(scene.adapterO)}>
          <rect x={1082} y={96} width={54} height={96} rx={8} fill="none" stroke={TEXT} strokeWidth={1.6} strokeDasharray="5 4" />
          <Note x={1109} y={154} text="?" anchor="middle" size={30} weight={600} />
          <line x1={1136} y1={144} x2={1166} y2={144} stroke={MUTED} strokeWidth={1.2} strokeDasharray="3 4" />
          <line x1={1170} y1={144} x2={1250} y2={144} stroke={TEXT} strokeWidth={2} />
          <Label x={1170} y={164} text="0" anchor="middle" size={9} />
          <Label x={1250} y={164} text="1" anchor="middle" size={9} />
          <Label x={1210} y={130} text="bounded score" anchor="middle" size={9} />
          <Label x={1109} y={222} text="normalization: not fully specified in the paper" anchor="middle" size={9} color={TEXT} />
        </g>

        {/* the closed answer gate, with uncommitted answer slots behind it */}
        <g opacity={g(scene.gateO)}>
          <line x1={GATE.x} y1={GATE.y0} x2={GATE.x} y2={GATE.y1} stroke={TEXT} strokeWidth={5} strokeLinecap="round" />
          <line x1={GATE.x - 8} y1={GATE.y0} x2={GATE.x + 8} y2={GATE.y0} stroke={TEXT} strokeWidth={2} />
          <line x1={GATE.x - 8} y1={GATE.y1} x2={GATE.x + 8} y2={GATE.y1} stroke={TEXT} strokeWidth={2} />
          <Label x={GATE.x} y={GATE.y0 - 12} text="answer gate · closed" anchor="middle" size={10} color={TEXT} />
        </g>
        <g opacity={g(scene.wordsO)}>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={1066 + i * 64} y={MID_Y - 13} width={52} height={26} rx={6} fill="none" stroke={MUTED}
              strokeOpacity={0.7 - i * 0.18} strokeDasharray="4 4" />
          ))}
          <Label x={1156} y={MID_Y + 36} text="answer words · uncommitted" anchor="middle" size={10} />
        </g>
        {/* beat 9 — lanes beyond the gate; the routing score picks one */}
        {laneU > 0
          ? ROUTES.map((r, i) => {
              const on = i === sel;
              const d = `M${GATE.x + 6},${MID_Y} C${GATE.x + 50},${MID_Y} ${GATE.x + 40},${LANE_Y[i]} ${GATE.x + 86},${LANE_Y[i]}`;
              return (
                <g key={r.key} opacity={on ? 1 : 0.15}>
                  <path d={d} fill="none" stroke={r.color} strokeWidth={on ? 2.6 : 1.6} {...draw(laneU)} />
                  <Label x={GATE.x + 94} y={LANE_Y[i] + 4} text={r.label} size={11} color={r.color} o={seg(laneU, 0.6, 1)} />
                </g>
              );
            })
          : null}
      </Camera>
    </g>
  );
}

export const vizScene = () => scene;
