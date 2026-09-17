// Read the shared context once
//
// Book 2 "One Read, Many Decisions", chapter 2 — INTENDED RLCD CONTRACT,
// grounded in the native reference. Sources: native engine
// run_parallel_generation (one traced "prefill" call, then the prompt cache is
// handed to a batch of field suffixes); charter — Qwen foundation invariants
// 1–3; Reference and architecture decisions. Pieces and layers are SCHEMATIC;
// the cost bars are unscaled. No zero-copy, speedup or memory figure is claimed.
//
// ONE persistent mechanism: the shared-context tape presses down into a layered
// key/value matrix on the same d3 band scale (the trunk). That trunk is then
// inspected (one position = keys + values at every layer), defended against
// per-field re-reads, branched into two short field questions with their own
// state, stretched into a long page to show its real cost, and finally asked
// the awkward question: how does each branch actually receive it?
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 the shared tape drops into the matrix; prefill sweeps layer by layer
//  2 push in: one position holds keys and values — state, not a summary
//  3 instructions + note are shared; ghost per-field re-reads fold away
//  4 one logical prefill; two short field questions of unequal length
//  5 both branches leave the same trunk, each with its own state
//  6 a long page: the same matrix, many more positions — compute and memory
//  7 shared, copied or broadcast? an open slab on every branch: measure it
//  8 cleared stage: organize around decisions, count what remains
import { linkHorizontal, range, scaleBand } from 'd3';
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Cell, Chip, Label, NOTE_PIECES, Panel, ROLE, StatusTag, captionPlan, clamp01, hash01, heatColor, lerp } from './shared/rlcd-kit';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'The first stage is called prefill. The model processes the shared input and builds internal state that later computations can reuse.',
  'In a transformer, part of that state is a cache of keys and values. Think of it as reusable context, rather than a summary written in ordinary language.',
  'For our support note, the text and the common instructions belong in that shared context. The model should not need a separate full reading for every field.',
  'The constrained engine performs one logical shared prefill, then prepares a short question for each field we want to classify.',
  'One branch asks for the topic. Another asks for urgency. Both start from the same common context, but each has its own question and continuation state.',
  'This reuse does not make the input free. A long page can still be expensive to process, and the stored state can consume substantial memory.',
  'It also does not guarantee that memory is shared without copies. The implementation must measure how it stores and supplies that state to each branch.',
  'The gain we are investigating comes from organizing the work around the decisions we need, while accounting honestly for the work that remains.',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;

/* ---------------------------------------------------------------- layout */
const INSTR = ['Class', 'ify', 'this', 'note', ':'];
const PIECES = [...INSTR, ...NOTE_PIECES];
const NC = PIECES.length; // 18 shared positions
const LAYERS = 6;
const TRUNK = { x0: 100, x1: 874, tapeY: 84, tapeH: 38, y: 190, layerH: 38, rowH: 15 };
const X = scaleBand<number>().domain(range(NC)).range([TRUNK.x0, TRUNK.x1]).paddingInner(0.08);
const BW = X.bandwidth();
const TRUNK_BOTTOM = TRUNK.y + LAYERS * TRUNK.layerH - 8;
const KV_COL = 6; // the "export" position, inspected in beat 2

// beat 6 — a long page: 54 more positions squeezed into the same width
const LONG_N = 54;
const LONG_SX = 0.25;
const XL = scaleBand<number>().domain(range(LONG_N)).range([TRUNK.x0 + (TRUNK.x1 - TRUNK.x0) * LONG_SX + 4, TRUNK.x1]).paddingInner(0.15);

interface Branch {
  name: string;
  pieces: string[];
  y: number;
}
const BRANCHES: Branch[] = [
  { name: 'topic', pieces: ['"', 'topic', '":', '"'], y: 206 },
  { name: 'urgency', pieces: ['"', 'urg', 'ency', '":', '"'], y: 346 },
];
const SUF = { x: 985, step: 43, w: 39, slabX: 905, slabW: 70 };
const hlink = linkHorizontal<{ source: [number, number]; target: [number, number] }, [number, number]>();
const BRANCH_LINKS = BRANCHES.map((b) => hlink({ source: [TRUNK.x1 + 6, 300], target: [SUF.slabX - 5, b.y + 65] }) ?? '');

const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };
const CAM_TRUNK: CameraState = { x: 480, y: 290, k: 1.12 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const tapeU = tl.channel('tapeU', 0);
  const dropU = tl.channel('dropU', 0);
  const prefillU = tl.channel('prefillU', 0);
  const kvU = tl.channel('kvU', 0);
  const kvNoteU = tl.channel('kvNoteU', 0);
  const notSummaryU = tl.channel('notSummaryU', 0);
  const groupU = tl.channel('groupU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const mergeU = tl.channel('mergeU', 0);
  const intendedU = tl.channel('intendedU', 0);
  const sufU = tl.channel('sufU', 0);
  const linkU = tl.channel('linkU', 0);
  const branchU = tl.channel('branchU', 0);
  const startU = tl.channel('startU', 0);
  const longU = tl.channel('longU', 0);
  const barsU = tl.channel('barsU', 0);
  const slabU = tl.channel('slabU', 0);
  const refU = tl.channel('refU', 0);
  const closeU = tl.channel('closeU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · prefill — */
  let b = AT[0];
  tl.tween(tapeU, 1, { at: b + 0.3, dur: 1.8, ease: ease.linear });
  tl.tween(dropU, 1, { at: b + 2.6, dur: 1.0, ease: ease.move });
  tl.tween(prefillU, 1, { at: b + 3.3, dur: 3.6, ease: ease.linear });

  /* — beat 2 · keys and values, not a summary — */
  b = AT[1];
  tl.tween(cam, CAM_TRUNK, { at: b + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(kvU, 1, { at: b + 1.2, dur: 0.8, ease: ease.enter });
  tl.tween(kvNoteU, 1, { at: b + 4.2, dur: 0.6, ease: ease.enter });
  tl.tween(notSummaryU, 1, { at: b + 7.0, dur: 0.5, ease: ease.pop });

  /* — beat 3 · shared context; no separate full read per field — */
  b = AT[2];
  tl.tween(kvU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(kvNoteU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(notSummaryU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(groupU, 1, { at: b + 0.9, dur: 1.2, ease: ease.draw });
  tl.tween(ghostU, 1, { at: b + 5.2, dur: 0.9, ease: ease.enter });
  tl.tween(mergeU, 1, { at: b + 8.2, dur: 1.3, ease: ease.move });

  /* — beat 4 · one logical prefill, then a short question per field — */
  b = AT[3];
  tl.tween(intendedU, 1, { at: b + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(sufU, 1, { at: b + 3.4, dur: 2.0, ease: ease.linear });

  /* — beat 5 · two branches, one trunk — */
  b = AT[4];
  tl.tween(linkU, 1, { at: b + 0.4, dur: 1.5, ease: ease.draw });
  tl.tween(branchU, 1, { at: b + 2.0, dur: 2.4, ease: ease.linear });
  tl.tween(startU, 1, { at: b + 5.4, dur: 0.6, ease: ease.enter });

  /* — beat 6 · the input is not free — */
  b = AT[5];
  tl.tween(startU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(groupU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(longU, 1, { at: b + 0.9, dur: 2.6, ease: ease.move });
  tl.tween(barsU, 1, { at: b + 1.2, dur: 0.6, ease: ease.enter });

  /* — beat 7 · no promise of copy-free sharing — */
  b = AT[6];
  tl.tween(longU, 0, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(barsU, 0, { at: b + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(slabU, 1, { at: b + 1.7, dur: 0.8, ease: ease.enter });
  tl.tween(refU, 1, { at: b + 6.0, dur: 0.6, ease: ease.enter });

  /* — beat 8 · organize around decisions; count what remains — */
  b = AT[7];
  tl.tween(intendedU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(refU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(closeU, 1, { at: b + 1.2, dur: 0.9, ease: ease.enter });
  tl.hold(PLAN.end, 1.0);

  return {
    tl, cam, tapeU, dropU, prefillU, kvU, kvNoteU, notSummaryU, groupU, ghostU, mergeU, intendedU, sufU, linkU, branchU,
    startU, longU, barsU, slabU, refU, closeU,
  };
}

const scene = buildScene();

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const tapeU = s.get(scene.tapeU);
  const dropU = s.get(scene.dropU);
  const prefillU = s.get(scene.prefillU);
  const kvU = s.get(scene.kvU);
  const groupU = s.get(scene.groupU);
  const ghostU = s.get(scene.ghostU);
  const mergeU = s.get(scene.mergeU);
  const sufU = s.get(scene.sufU);
  const linkU = s.get(scene.linkU);
  const branchU = s.get(scene.branchU);
  const longU = s.get(scene.longU);
  const barsU = s.get(scene.barsU);
  const slabU = s.get(scene.slabU);
  const closeU = s.get(scene.closeU);

  const sx = lerp(1, LONG_SX, longU);
  const layerY = (l: number) => TRUNK.y + l * TRUNK.layerH;
  const scanY = TRUNK.y + prefillU * LAYERS * TRUNK.layerH;
  const ghostShow = ghostU * (1 - mergeU);
  const groups = [
    { a: 0, b: INSTR.length - 1, text: 'common instructions' },
    { a: INSTR.length, b: NC - 1, text: 'the support note' },
  ];

  return (
    <Camera {...s.get(scene.cam)}>
      <Label x={TRUNK.x0} y={62} text="shared context" u={clamp01(tapeU * 4) * (1 - longU)} size={18} weight={700} />
      <Label x={TRUNK.x0 + 140} y={62} text="schematic pieces · not real tokenization" u={clamp01(tapeU * 4) * (1 - longU)} size={13} color={ROLE.PENDING} mono />
      <Label x={TRUNK.x0} y={62} text="a long page: the same read, many more positions" u={longU} size={18} weight={700} />

      {/* the shared tape — and its ghost pressing down into the matrix */}
      <g opacity={1 - 0.85 * longU}>
        {PIECES.map((p, i) => (
          <Cell key={i} x={X(i)!} y={TRUNK.tapeY} w={BW} h={TRUNK.tapeH} text={p} size={10.5} u={clamp01(tapeU * (NC + 2) - i)} tone={ROLE.OBSERVE} fill="#0b1a2b" />
        ))}
      </g>
      {dropU > 0.002 && dropU < 0.998 &&
        PIECES.map((_, i) => (
          <rect key={i} x={X(i)!} y={lerp(TRUNK.tapeY, TRUNK.y, dropU)} width={BW} height={lerp(TRUNK.tapeH, TRUNK.rowH, dropU)} rx={5} fill={ROLE.OBSERVE} opacity={0.35 * (1 - dropU)} />
        ))}

      {/* beat 3 — what belongs in the shared context */}
      {groups.map((g) => {
        const xa = X(g.a)!;
        const xb = X(g.b)! + BW;
        return (
          <g key={g.text} opacity={groupU}>
            <path d={`M${xa} 130v8H${xb}v-8`} fill="none" stroke={ROLE.OBSERVE} strokeWidth={1.8} pathLength={1} strokeDasharray={`${groupU} 1`} />
            <Label x={(xa + xb) / 2} y={160} anchor="middle" text={g.text} size={15} color={ROLE.OBSERVE} />
          </g>
        );
      })}

      {/* beat 3 — ghost re-reads that the shared trunk makes unnecessary */}
      {ghostShow > 0.002 &&
        [2, 1].map((n) => {
          const off = n * 16 * (1 - mergeU);
          return <rect key={n} x={TRUNK.x0 - 4 + off} y={TRUNK.y - 4 + off} width={TRUNK.x1 - TRUNK.x0 + 8} height={TRUNK_BOTTOM - TRUNK.y + 8} rx={8} fill="#0a0e1a" fillOpacity={0.7} stroke={ROLE.INVALID} strokeWidth={1.6} strokeDasharray="7 5" opacity={ghostShow} />;
        })}
      <Chip x={TRUNK.x1} y={470} anchor="end" text="✕ not needed: a separate full read per field" color={ROLE.INVALID} fill="#2a0c14" size={14} u={ghostShow} />
      <Chip x={TRUNK.x1} y={470} anchor="end" text="✓ one trunk, read once" color={ROLE.CHECKED} fill="#062a1e" size={14} u={clamp01(mergeU * 2 - 1) * (1 - clamp01(sufU * 4))} />

      {/* THE TRUNK: keys and values for every position at every layer */}
      <g transform={`translate(${TRUNK.x0} 0) scale(${sx} 1) translate(${-TRUNK.x0} 0)`}>
        {range(NC).map((c) => (
          <g key={c} opacity={c === KV_COL ? 1 : 1 - 0.7 * kvU}>
            {range(LAYERS).map((l) => {
              const uk = clamp01(prefillU * LAYERS - l);
              const uv = clamp01(prefillU * LAYERS - l - 0.4);
              if (uk <= 0.002) return null;
              return (
                <g key={l}>
                  <rect x={X(c)!} y={layerY(l)} width={BW} height={TRUNK.rowH} rx={3} fill={heatColor(0.3 + 0.7 * hash01(c, l))} opacity={uk} />
                  <rect x={X(c)!} y={layerY(l) + TRUNK.rowH + 2} width={BW} height={TRUNK.rowH} rx={3} fill={heatColor(0.2 + 0.6 * hash01(c + 31, l))} stroke={ROLE.MODEL} strokeWidth={0.8} opacity={uv * 0.85} />
                </g>
              );
            })}
          </g>
        ))}
      </g>
      {/* long-page positions fill the freed width */}
      {longU > 0.002 &&
        range(LONG_N).map((c) => {
          const u = clamp01(longU * 1.25 * LONG_N - c) * longU;
          if (u <= 0.002) return null;
          return (
            <g key={c} opacity={u}>
              {range(LAYERS).map((l) => (
                <rect key={l} x={XL(c)!} y={layerY(l)} width={XL.bandwidth()} height={TRUNK.rowH * 2 + 2} rx={2} fill={heatColor(0.25 + 0.7 * hash01(c + 70, l))} />
              ))}
            </g>
          );
        })}
      {range(LAYERS).map((l) => (
        <g key={l} opacity={clamp01(prefillU * LAYERS - l)}>
          <Label x={72} y={layerY(l) + 22} anchor="end" text={`L${l + 1}`} size={13} color={colors.MUTED} mono />
          <Label x={93} y={layerY(l) + 12} anchor="end" text="K" size={11} color={ROLE.MODEL} mono />
          <Label x={93} y={layerY(l) + 29} anchor="end" text="V" size={11} color={ROLE.MODEL} mono />
        </g>
      ))}
      {prefillU > 0.002 && prefillU < 0.998 && (
        <g>
          <line x1={TRUNK.x0 - 6} x2={TRUNK.x1 + 6} y1={scanY} y2={scanY} stroke={colors.TEXT} strokeWidth={2} opacity={0.85} />
          <Label x={TRUNK.x1 + 14} y={scanY + 5} text="PREFILL · every position, layer by layer" size={15} color={ROLE.MODEL} weight={650} />
        </g>
      )}
      <Label x={TRUNK.x0} y={TRUNK_BOTTOM + 28} text="prefill × 1 → reusable state (schematic layers)" u={clamp01(prefillU * 8 - 7) * (1 - s.get(scene.kvNoteU)) * (1 - ghostU) * (1 - barsU)} size={15} color={ROLE.MODEL} />

      {/* beat 2 — one position, inspected */}
      {kvU > 0.002 && (
        <g opacity={kvU}>
          <rect x={X(KV_COL)! - 4} y={TRUNK.y - 5} width={BW + 8} height={TRUNK_BOTTOM - TRUNK.y + 10} rx={7} fill="none" stroke={colors.TEXT} strokeWidth={2} />
          <path d={`M${X(KV_COL)! + BW + 4} ${TRUNK.y + 7}H${TRUNK.x1 + 22}M${X(KV_COL)! + BW + 4} ${TRUNK.y + 24}H${TRUNK.x1 + 22}`} stroke={colors.TEXT} strokeWidth={1.4} />
          <Label x={TRUNK.x1 + 30} y={TRUNK.y + 12} text="K · keys" size={17} weight={650} />
          <Label x={TRUNK.x1 + 30} y={TRUNK.y + 34} text="V · values" size={17} weight={650} />
          <Label x={TRUNK.x1 + 30} y={TRUNK.y + 62} text="one position," size={14} color={colors.MUTED} />
          <Label x={TRUNK.x1 + 30} y={TRUNK.y + 80} text="every layer" size={14} color={colors.MUTED} />
        </g>
      )}
      <Label x={TRUNK.x0} y={TRUNK_BOTTOM + 28} text="reusable context: numbers the model can attend to again" u={s.get(scene.kvNoteU)} size={16} weight={650} />
      <Chip x={TRUNK.x1 + 150} y={TRUNK_BOTTOM + 50} anchor="end" text="✕ not a summary written in ordinary language" color={ROLE.INVALID} fill="#2a0c14" size={14} u={s.get(scene.notSummaryU)} />

      {/* beats 4–5 — two short field questions, each with its own state */}
      {linkU > 0.002 &&
        BRANCH_LINKS.map((d, k) => <path key={k} d={d} fill="none" stroke={ROLE.MODEL} strokeWidth={2.4} pathLength={1} strokeDasharray={`${clamp01(linkU * 1.3 - k * 0.3)} 1`} />)}
      {BRANCHES.map((br, k) => {
        const u = clamp01(sufU * 2 - k * 0.8);
        if (u <= 0.002) return null;
        return (
          <g key={br.name}>
            <Label x={SUF.slabX} y={br.y - 12} text={`${br.name} question · ${br.pieces.length} pieces`} u={u} size={15} weight={650} />
            {br.pieces.map((p, i) => (
              <Cell key={i} x={SUF.x + i * SUF.step} y={br.y} w={SUF.w} h={38} text={p} size={11} u={clamp01(u * 3 - i * 0.4)} />
            ))}
            {/* the branch's own continuation state */}
            {br.pieces.map((_, i) =>
              range(LAYERS).map((l) => {
                const bu = clamp01(branchU * 2.4 - i * 0.2 - l * 0.08);
                if (bu <= 0.002) return null;
                return <rect key={`${i}-${l}`} x={SUF.x + i * SUF.step} y={br.y + 44 + l * 7} width={SUF.w} height={5} rx={1.5} fill={heatColor(0.3 + 0.7 * hash01(i + 9 * k, l + 3))} opacity={bu} />;
              }),
            )}
            <Label x={SUF.x + br.pieces.length * SUF.step + 4} y={br.y + 70} text="◆ own" u={clamp01(branchU * 2 - 1)} size={13} color={ROLE.MODEL} mono />
            {/* how the trunk reaches this branch is an open, measurable question */}
            <g opacity={slabU}>
              <rect x={SUF.slabX} y={br.y + 44} width={SUF.slabW} height={40} rx={5} fill="#1a1405" stroke={ROLE.PENDING} strokeWidth={1.5} strokeDasharray="5 4" />
              <Label x={SUF.slabX + SUF.slabW / 2} y={br.y + 69} anchor="middle" text="trunk ?" size={13} color={ROLE.PENDING} mono />
            </g>
          </g>
        );
      })}
      <Label x={TRUNK.x1} y={TRUNK_BOTTOM + 28} anchor="end" text="both branches start from this state ▸" u={s.get(scene.startU)} size={15} color={ROLE.MODEL} weight={650} />
      <Label x={SUF.slabX} y={462} text="shared, copied, or broadcast? measure it" u={slabU * (1 - closeU)} size={15} color={ROLE.PENDING} weight={650} />

      {/* beat 6 — the costs that remain (unscaled) */}
      {barsU > 0.002 && (
        <g opacity={barsU}>
          <Label x={TRUNK.x0} y={450} text="prefill compute grows with the input" size={14} />
          <rect x={TRUNK.x0} y={456} width={lerp(190, 770, longU)} height={13} rx={4} fill={ROLE.MODEL} />
          <Label x={TRUNK.x0} y={494} text="stored keys + values: every position × every layer" size={14} />
          <rect x={TRUNK.x0} y={500} width={lerp(190, 770, longU)} height={13} rx={4} fill="none" stroke={ROLE.PENDING} strokeWidth={1.6} />
          <rect x={TRUNK.x0} y={500} width={lerp(190, 770, longU)} height={13} rx={4} fill={ROLE.PENDING} opacity={0.45} />
          <Label x={TRUNK.x0} y={536} text="unscaled · illustrative, not measured" size={13} color={ROLE.PENDING} mono />
        </g>
      )}

      <StatusTag x={TRUNK.x0} y={540} kind="INTENDED" text="one logical shared prefill, then field questions" u={s.get(scene.intendedU) * (1 - barsU)} />
      <StatusTag x={700} y={540} kind="REFERENCE" text="native engine broadcasts cache rows" u={s.get(scene.refU)} />

      {/* beat 8 — closing on an opaque panel */}
      <Panel x={230} y={446} w={820} h={110} u={closeU} stroke={ROLE.MODEL}>
        <text x={640} y={492} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={750}>
          Organize the work around the decisions.
        </text>
        <text x={640} y={528} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
          Still counted: the prefill · the stored state · every branch
        </text>
      </Panel>
    </Camera>
  );
}

export const vizScene = () => scene;
