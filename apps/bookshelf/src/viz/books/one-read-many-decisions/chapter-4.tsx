// The difficult cases reveal the contract
//
// Book 2 "One Read, Many Decisions", chapter 4 — shared prefixes, explicit
// endings, a named scoring rule, counted continuation work, and an honest name
// for the displayed score. The paths [17], [17,42], [17,91] are SCHEMATIC token
// paths, not real Qwen tokenization; every score is an illustrative ranking
// score. No timing, speedup, or calibrated-confidence figure appears anywhere.
//
// ONE persistent mechanism: three token-path rails fold into a prefix tree
// (the shared 17 becomes one node). Only the unresolved node takes a
// continuation call; the terminal branch keeps its own explicit end leaf;
// edge scores sum along complete paths; a ledger counts every call. The
// chapter ends holding that same tree with its scores, named honestly.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 three rails share their first piece → fold into a tree: undecided
//  2 one continuation call at the shared node; A keeps an explicit end leaf
//  3 greedy path vs complete-sequence score: name the rule, then select
//  4 the ledger counts calls; branch state is owned; no silent default
//  5 normalized ranking score ≠ calibrated confidence
import { linkHorizontal, range, scaleLinear } from 'd3';
import { Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Chip, Label, MONO, ROLE, captionPlan, clamp01, hash01, heatColor, lerp } from './shared/rlcd-kit';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'Suppose two allowed answers begin with the same token. Looking at that first token cannot tell us which complete answer the model should select.',
  'We need to continue along the allowed token paths until the choice is resolved. An answer that ends at a shared prefix also needs an explicit ending rule.',
  'The scoring contract matters here. Greedily following a permitted path is not automatically the same as comparing the full likelihood of every possible answer.',
  'Every extra continuation is real model work. We count it, preserve the correct branch state, and refuse to hide an unresolved choice behind a convenient default.',
  'The displayed score also needs an honest name. A normalized set of scores is not evidence that a choice will be correct that often in actual use.',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;

/* ---------------------------------------------------------------- layout */
const ROOT = { x: 150, y: 300 };
const NODE_X = 400;
const LEAF_X = 660;
const NODE = { w: 64, h: 44 };
// illustrative log-scores: the shared first piece, then each way of going on
const S17 = -0.4;
const PATHS = [
  { id: 'A', y: 180, path: '[17]', leaf: '■ end', edge: -1.6, terminal: true },
  { id: 'B', y: 300, path: '[17, 42]', leaf: '42', edge: -0.9, terminal: false },
  { id: 'C', y: 420, path: '[17, 91]', leaf: '91', edge: -1.2, terminal: false },
];
const TOTALS = PATHS.map((p) => S17 + p.edge);
const EXP = TOTALS.map((t) => Math.exp(t));
const NORM = EXP.map((e) => e / EXP.reduce((a, c) => a + c, 0));
const BEST = TOTALS.indexOf(Math.max(...TOTALS)); // B under the complete-path rule
const BAR = scaleLinear([0, 1], [0, 200]);
const fmt = (v: number): string => v.toFixed(1).replace('-', '−');
const hlink = linkHorizontal<{ source: [number, number]; target: [number, number] }, [number, number]>();

const LEDGER = { x: 1040, y: 170, rows: ['prefill', 'suffix batch', 'continuation'] };
const CAM_TREE: CameraState = { x: 470, y: 300, k: 1.15 };
const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TREE, cameraInterp);
  const treeU = tl.channel('treeU', 0);
  const mergeU = tl.channel('mergeU', 0);
  const ambigU = tl.channel('ambigU', 0);
  const contU = tl.channel('contU', 0);
  const callU = tl.channel('callU', 0);
  const edgeU = tl.channel('edgeU', 0);
  const endU = tl.channel('endU', 0);
  const resolvedU = tl.channel('resolvedU', 0);
  const rulesU = tl.channel('rulesU', 0);
  const sumU = tl.channel('sumU', 0);
  const texU = tl.channel('texU', 0);
  const pickU = tl.channel('pickU', 0);
  const ledgerU = tl.channel('ledgerU', 0);
  const ledgerVis = tl.channel('ledgerVis', 0);
  const stateU = tl.channel('stateU', 0);
  const noDefaultU = tl.channel('noDefaultU', 0);
  const barsU = tl.channel('barsU', 0);
  const badNameU = tl.channel('badNameU', 0);
  const goodNameU = tl.channel('goodNameU', 0);
  const calibU = tl.channel('calibU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · a shared first piece — */
  let b = AT[0];
  tl.tween(treeU, 1, { at: b + 0.3, dur: 1.4, ease: ease.enter });
  tl.tween(mergeU, 1, { at: b + 4.6, dur: 1.6, ease: ease.move });
  tl.tween(ambigU, 1, { at: b + 7.0, dur: 0.5, ease: ease.pop });

  /* — beat 2 · continue the unresolved node; an explicit end leaf — */
  b = AT[1];
  tl.tween(ambigU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(contU, 1, { at: b + 0.8, dur: 1.4, ease: ease.linear });
  tl.tween(callU, 1, { at: b + 2.0, dur: 0.5, ease: ease.enter });
  tl.tween(edgeU, 1, { at: b + 3.2, dur: 1.4, ease: ease.draw });
  tl.tween(endU, 1, { at: b + 6.2, dur: 0.6, ease: ease.pop });
  tl.tween(resolvedU, 1, { at: b + 8.6, dur: 0.6, ease: ease.enter });

  /* — beat 3 · name the scoring rule — */
  b = AT[2];
  tl.tween(cam, CAM_HOME, { at: b + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(callU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(rulesU, 1, { at: b + 1.4, dur: 0.7, ease: ease.enter });
  tl.tween(sumU, 1, { at: b + 4.4, dur: 0.8, ease: ease.enter });
  tl.tween(texU, 1, { at: b + 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(pickU, 1, { at: b + 8.0, dur: 0.5, ease: ease.pop });

  /* — beat 4 · count the work; own the state; no silent default — */
  b = AT[3];
  tl.tween(rulesU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(texU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(ledgerVis, 1, { at: b + 0.5, dur: 0.6, ease: ease.enter });
  tl.tween(ledgerU, 1, { at: b + 1.0, dur: 2.6, ease: ease.linear });
  tl.tween(stateU, 1, { at: b + 4.4, dur: 0.7, ease: ease.enter });
  tl.tween(noDefaultU, 1, { at: b + 7.2, dur: 0.5, ease: ease.pop });

  /* — beat 5 · an honest name for the score — */
  b = AT[4];
  tl.tween(noDefaultU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(barsU, 1, { at: b + 0.6, dur: 1.0, ease: ease.enter });
  tl.tween(badNameU, 1, { at: b + 1.8, dur: 0.6, ease: ease.enter });
  tl.tween(goodNameU, 1, { at: b + 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(calibU, 1, { at: b + 7.0, dur: 0.6, ease: ease.enter });

  // clean ending: hold the scored tree, settled, just past the fifth caption
  tl.hold(PLAN.end, 0.6);

  return {
    tl, cam, treeU, mergeU, ambigU, contU, callU, edgeU, endU, resolvedU, rulesU, sumU, texU, pickU, ledgerU, ledgerVis,
    stateU, noDefaultU, barsU, badNameU, goodNameU, calibU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------- local subcomponents */
function TokenNode({ x, y, text, tone, u, textU, dashed = false, strong = 0 }: { x: number; y: number; text: string; tone: string; u: number; textU: number; dashed?: boolean; strong?: number }) {
  if (u <= 0.002) return null;
  return (
    <g transform={`translate(${x - NODE.w / 2} ${y - NODE.h / 2})`} opacity={u}>
      <rect width={NODE.w} height={NODE.h} rx={8} fill="#15122e" stroke={tone} strokeWidth={1.6 + 1.6 * strong} strokeDasharray={dashed ? '5 4' : undefined} />
      <text x={NODE.w / 2} y={28} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontFamily={MONO} fontWeight={700} opacity={textU}>
        {text}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const treeU = s.get(scene.treeU);
  const m = s.get(scene.mergeU);
  const contU = s.get(scene.contU);
  const callU = s.get(scene.callU);
  const edgeU = s.get(scene.edgeU);
  const endU = s.get(scene.endU);
  const sumU = s.get(scene.sumU);
  const pickU = s.get(scene.pickU);
  const ledgerU = s.get(scene.ledgerU);
  const barsU = s.get(scene.barsU);
  const badNameU = s.get(scene.badNameU);

  const railY = (py: number) => lerp(py, ROOT.y, m); // rails fold onto the shared node

  return (
    <Camera {...s.get(scene.cam)}>
      {/* THE STRUCTURE: three rails → one prefix tree */}
      {treeU > 0.002 && (
        <g opacity={treeU}>
          {PATHS.map((p, i) => {
            const y = railY(p.y);
            const showLeaf = p.terminal ? endU : 1;
            return (
              <g key={p.id}>
                <path d={hlink({ source: [ROOT.x + 30, y], target: [NODE_X - NODE.w / 2, y] }) ?? ''} fill="none" stroke={ROLE.MODEL} strokeWidth={2.2} opacity={i === 1 ? 1 : 1 - m} />
                <path d={hlink({ source: [NODE_X + NODE.w / 2, y], target: [LEAF_X - NODE.w / 2, p.y] }) ?? ''} fill="none" stroke={p.terminal ? ROLE.PENDING : ROLE.MODEL} strokeWidth={2.2} strokeDasharray={p.terminal ? '6 5' : undefined} opacity={showLeaf} />
                <TokenNode x={NODE_X} y={y} text="17" tone={ROLE.MODEL} u={i === 1 ? 1 : 1 - 0.999 * clamp01(m * 1.2 - 0.2)} textU={1} strong={i === 1 ? m : 0} />
                <TokenNode x={LEAF_X} y={p.y} text={p.leaf} tone={p.terminal ? ROLE.PENDING : i === BEST && pickU > 0.5 ? ROLE.CHECKED : ROLE.MODEL} u={showLeaf} textU={1} dashed={p.terminal} strong={i === BEST ? pickU : 0} />
              </g>
            );
          })}
          <circle cx={ROOT.x} cy={ROOT.y} r={13} fill={ROLE.MODEL} opacity={m} />
          <circle cx={ROOT.x} cy={ROOT.y} r={20} fill="none" stroke={ROLE.MODEL} strokeWidth={1.6} opacity={m} />
          {contU > 0.002 && contU < 0.998 && <circle cx={lerp(ROOT.x + 30, NODE_X - NODE.w / 2, contU)} cy={ROOT.y} r={8} fill={colors.TEXT} />}
        </g>
      )}

      {/* ANNOTATIONS on the full-size tree */}
      {treeU > 0.002 && (
        <g opacity={clamp01(treeU * 2)}>
          <Label x={110} y={62} text="schematic token paths · not real Qwen tokenization" size={14} color={ROLE.PENDING} mono />
          {/* on from the first visible score: the numbers are synthetic */}
          <Label x={110} y={84} text="scores: illustrative, not measured" u={clamp01(edgeU * 3)} size={14} color={ROLE.PENDING} mono weight={700} />
          <Label x={110} y={104} text="values chosen to demonstrate ranking" u={clamp01(edgeU * 3)} size={13} color={ROLE.PENDING} mono />
          {PATHS.map((p, i) => (
            <g key={p.id}>
              <Label x={720} y={p.y + 5} text={`${p.id} = ${p.path}`} size={16} mono weight={i === BEST && pickU > 0.5 ? 800 : 500} color={i === BEST && pickU > 0.5 ? ROLE.CHECKED : colors.TEXT} />
              <Label x={612} y={i === 2 ? p.y + 24 : p.y - 12} anchor="end" text={fmt(p.edge)} u={clamp01(edgeU * 3 - i) * (p.terminal ? endU : 1)} size={15} mono color={ROLE.MODEL} />
              <Label x={846} y={p.y + 5} text={`Σ ${fmt(TOTALS[i])}`} u={clamp01(sumU * 3 - i)} size={16} mono weight={700} />
              {barsU > 0.002 && <rect x={935} y={p.y - 9} width={BAR(NORM[i]) * barsU} height={18} rx={4} fill={ROLE.MODEL} opacity={0.9} />}
            </g>
          ))}
          <Label x={ROOT.x} y={ROOT.y + 46} anchor="middle" text="decision" u={m} size={14} color={colors.MUTED} />
          <Label x={275} y={ROOT.y - 12} anchor="middle" text={fmt(S17)} u={clamp01(edgeU * 3)} size={15} mono color={ROLE.MODEL} />
          <Chip x={440} y={372} anchor="end" text="? first piece is 17 for all three" color={ROLE.PENDING} fill="#1a1405" u={s.get(scene.ambigU)} />
          {callU > 0.002 && (
            <g opacity={callU}>
              <rect x={NODE_X - 44} y={ROOT.y - 34} width={88} height={68} rx={12} fill="none" stroke={colors.TEXT} strokeWidth={2} strokeDasharray="7 5" />
              <Label x={NODE_X} y={252} anchor="middle" text="continuation call" size={15} weight={650} />
            </g>
          )}
          <Label x={560} y={140} text="■ A ends here: needs an explicit end rule" u={endU} size={15} color={ROLE.PENDING} weight={650} />
          <Chip x={560} y={58} text="✓ topic row: resolved — untouched" color={ROLE.CHECKED} fill="#062a1e" u={s.get(scene.resolvedU)} />
          <Label x={720} y={PATHS[BEST].y + 28} text="✓ selected under the named rule" u={pickU} size={14} color={ROLE.CHECKED} />

          {/* beat 3 — two different rules with two different names */}
          <g opacity={s.get(scene.rulesU)}>
            <Chip x={110} y={492} text="greedy: best next piece, step by step" size={14} />
            <Label x={470} y={498} anchor="middle" text="≠" size={24} weight={800} color={ROLE.PENDING} />
            <Chip x={500} y={492} text="complete: score of the whole answer" size={14} color={ROLE.CHECKED} fill="#062a1e" />
          </g>
          <MathLabel tex={'\\log p(B)=\\log p(17)+\\log p(42\\mid 17)'} x={1020} y={492} fontSize={19} opacity={s.get(scene.texU)} boxWidth={420} />

          {/* beat 4 — branch state is owned by its branch */}
          <g opacity={s.get(scene.stateU)}>
            {range(4).map((l) => (
              <rect key={l} x={NODE_X - 32} y={ROOT.y + 30 + l * 7} width={64} height={5} rx={1.5} fill={heatColor(0.4 + 0.5 * hash01(l, 8))} />
            ))}
            <Label x={NODE_X} y={ROOT.y + 76} anchor="middle" text="this branch's own state" size={13} color={ROLE.MODEL} mono />
          </g>
          <Chip x={110} y={492} text="✕ never: silently default to the first choice" color={ROLE.INVALID} fill="#2a0c14" size={14} u={s.get(scene.noDefaultU)} />

          {/* beat 5 — what may this number be called? */}
          <g opacity={badNameU}>
            <Label x={1135} y={88} anchor="end" text={`“${Math.round(NORM[BEST] * 100)}% sure it is right”`} size={16} color={ROLE.INVALID} />
            <line x1={935} x2={935 + 200 * clamp01(badNameU * 2 - 1)} y1={83} y2={83} stroke={ROLE.INVALID} strokeWidth={2.4} />
          </g>
          <Label x={1135} y={112} anchor="end" text="✓ normalized ranking score · illustrative" u={s.get(scene.goodNameU)} size={15} color={ROLE.CHECKED} weight={650} />
          <Chip x={110} y={492} text="? calibration = measured reliability · a separate claim" color={ROLE.PENDING} fill="#1a1405" dashed size={14} u={s.get(scene.calibU)} />
        </g>
      )}

      {/* the ledger: every model call is counted (counts, not time) */}
      <g opacity={s.get(scene.ledgerVis)}>
        <Label x={LEDGER.x} y={LEDGER.y} text="model calls · counted" size={15} weight={700} />
        {LEDGER.rows.map((r, i) => {
          const u = clamp01(ledgerU * 3 - i);
          return (
            <g key={r} transform={`translate(${LEDGER.x} ${LEDGER.y + 22 + i * 46})`}>
              <rect width={22} height={22} rx={4} fill={ROLE.MODEL} fillOpacity={u} stroke={ROLE.MODEL} strokeWidth={1.5} />
              <Label x={32} y={17} text={`${r} × ${u > 0.5 ? 1 : 0}`} size={15} mono color={i === 2 ? ROLE.PENDING : colors.TEXT} />
            </g>
          );
        })}
        <rect x={LEDGER.x} y={LEDGER.y + 160} width={22} height={22} rx={4} fill="none" stroke={ROLE.PENDING} strokeWidth={1.5} strokeDasharray="4 3" />
        <Label x={LEDGER.x + 32} y={LEDGER.y + 177} text="+1 per deeper level" size={14} color={ROLE.PENDING} />
        <Label x={LEDGER.x} y={LEDGER.y + 214} text="counts, not timings" size={13} color={colors.MUTED} mono />
      </g>
    </Camera>
  );
}

export const vizScene = () => scene;
