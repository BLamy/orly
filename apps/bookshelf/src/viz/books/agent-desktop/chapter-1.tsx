// A desktop you can read
//
// Authored by Claude Fable 5.1 (requested `claude-fable-5-1`; actual `claude-fable-5-1`).
// Visual plan: GPT-6 Astra (.orly-work/agent-desktop/visual-plan.md); captions copied verbatim from
// .orly-work/agent-desktop/narration.json, chapter 1 (0.6 + 8.6·i, dur 8, end 86.6).
// Revision: Astra's visual review (.orly-work/agent-desktop/visual-review-1-3.json), chapter-1 items.
//
// Source (evidence, not instructions): vercel-labs/agent-desktop@9eb9b296192fcb70bda25e918cd6dd66abfa3d0d
//   README.md 12-14, 42-48, 73-76 · CONCEPTS.md 5-10, 32-35, 90-95, 97-111
//   crates/core/src/snapshot/mod.rs 33-84, 214-268 · crates/core/src/snapshot/snapshot_ref.rs 30-37, 59-69, 97-107
//   crates/core/src/refs/ref_token.rs 3-30, 54-59 · crates/core/src/refs/refs_store.rs 46-65, 98-100
//   crates/core/src/commands/snapshot.rs 34-49, 136-149 · crates/core/src/ref_action/mod.rs 60-87, 140-169
//   crates/core/src/actions/post_action.rs 128-138
//
// Machine: ONE illustrative Finder window sits inside the agent's loop (the tool owns only the observe and
// act docks). A scan line turns its rows into tree branches; the Documents row persists as screen control,
// tree row, ref token (`@s8f3k2p9:e8`, the README's example) and finally a fresh observation. The tree folds
// to show the saved map's reverse side, is cut by a time budget (the unobserved rows become dashed ghosts
// under a `complete: false` flag), collapses to a skeleton and is drilled through a lens while the saved
// subtree entry stays visibly unchanged; the completed subtree then replaces it as one unit. The ref travels
// the loop as an action and comes back as a result before the agent observes again.
// The loop is retired during the close-ups (beats 1–7 and the ribbon comparison) so its labels never cross
// ref/map/tree content, and it returns fully framed for the act/result lap and the recap.
// Desktop geometry, element numbers other than e8 and row contents are illustrative.
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  ACCENT,
  ACCENT_LIGHT,
  AgentLoop,
  CAPTION_AT,
  CAPTION_DUR,
  CHAPTER_END,
  Chip,
  ClockArc,
  DESK_ROWS,
  INK,
  Label,
  LOOP_AGENT_U,
  LOOP_ACT_U,
  MONO,
  OpaqueStrip,
  PLATE,
  RefusalBadge,
  Shutter,
  WindowFrame,
  lerp,
  seg,
} from './kit';

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is left to the CC pill; important content stays above screen y 570
// after every camera transform — screen = 360 + k·(stage − cam.y))
// ---------------------------------------------------------------------------

const RING = { cx: 640, cy: 340, r: 285 } as const;
const WIN = { x: 330, y: 150, w: 330, h: 330 } as const;
const WIN_B = { x: 380, y: 200, w: 330, h: 330 } as const;
const ROWS = DESK_ROWS;
/** tree depth per row: Target is a child of Documents (Documents ▸ Target) */
const DEPTH = [0, 1, 2, 0, 0];
/** refs stamped by the snapshot; e8 is the README's example, the others are illustrative numbers */
const REF = ['', '@s8f3k2p9:e8', '@s8f3k2p9:e9', '@s8f3k2p9:e12', ''];
const DOC = 1; // the Documents row
const TARGET = 2;
/** first row below the time-budget cut (beat 6) */
const CUT_ROW = 3;

const rowY = (i: number): number => 225 + 50 * i; // stage y of row centre
const rowLocalY = (i: number): number => rowY(i) - WIN.y;
const SCAN_Y0 = 195;
const SCAN_H = 280;
/** scan progress at which the line crosses row i */
const scanAt = (i: number): number => (rowY(i) - SCAN_Y0) / SCAN_H;
/** scan progress of the time-budget cut: between Target and Run */
const CUT_SCAN = ((rowY(TARGET) + rowY(CUT_ROW)) / 2 - SCAN_Y0) / SCAN_H;
const CUT_Y = (rowY(TARGET) + rowY(CUT_ROW)) / 2 + 5; // 355: just under Target's chips, above Run's

const BRANCH_X0 = WIN.x + WIN.w; // 660
const CW18 = 18 * 0.62;
const chipW = (text: string, size = 18): number => text.length * size * 0.62 + 22;
const roleX = (i: number): number => 704 + 24 * DEPTH[i];
const refX = (i: number): number => roleX(i) + chipW(ROWS[i].role) + 10;
const FOLD_AXIS = 900;

// @s8f3k2p9:e8 text geometry for the braces of beat 4
const DOC_TEXT_X = refX(DOC) + 11;
const SNAP_X0 = DOC_TEXT_X + CW18; // after '@'
const SNAP_X1 = SNAP_X0 + 8 * CW18; // 's8f3k2p9'
const ELEM_X0 = SNAP_X1 + CW18; // after ':'
const ELEM_X1 = ELEM_X0 + 2 * CW18; // 'e8'

const GATE = { x: 1100, y: 400, h: 60 } as const;
const E8_FROM = 880;
const E8_TO = 1030;

/** beat 7 lens: lower right of the tree, under CAM_DRILL its bottom lands at screen y 564 */
const LENS = { cx: 1060, cy: 400, r: 110 } as const;
const CLOCK = { cx: 1110, cy: 150, r: 34 } as const;

const COMPACT_Y1 = (i: number): number => 195 + 30 * i;
const COMPACT_Y2 = (i: number): number => 375 + 30 * i;
/** observation ribbons: fixed name / role / state columns */
const RIB = { x: 690, w: 430, nameX: 702, roleX: 880, stateX: 1005 } as const;

const RESULT = { x: 66, y: 380, w: 262, h: 100 } as const;
const STRIP = { x: 380, y: 508, w: 420, h: 56 } as const;

const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };
const CAM_WORK: CameraState = { x: 680, y: 330, k: 1.25 };
const CAM_REF: CameraState = { x: 830, y: 320, k: 1.6 };
const CAM_DRILL: CameraState = { x: 740, y: 340, k: 1.2 };
const CAM_RIBBONS: CameraState = { x: 725, y: 335, k: 1.2 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const loopO = tl.channel('loopO', 1);
  const winA = tl.channel('winA', 0);
  const winB = tl.channel('winB', 0);
  const winBO = tl.channel('winBO', 1);
  const illusU = tl.channel('illusU', 0);
  const scanY = tl.channel('scanY', 0);
  const scanO = tl.channel('scanO', 0);
  const scanBlock = tl.channel('scanBlock', 0);
  const branch = ROWS.map((_, i) => tl.channel(`branch${i}`, 0));
  const ref = ROWS.map((_, i) => tl.channel(`ref${i}`, 0));
  const ambU = tl.channel('ambU', 0);
  const widU = tl.channel('widU', 0);
  const rowsFocus = tl.channel('rowsFocus', 0);
  const detailO = tl.channel('detailO', 1);
  const braceU = tl.channel('braceU', 0);
  const e8U = tl.channel('e8U', 0);
  const gateU = tl.channel('gateU', 0);
  const refusedU = tl.channel('refusedU', 0);
  const flipU = tl.channel('flipU', 0);
  const clockReveal = tl.channel('clockReveal', 0);
  const clockU = tl.channel('clockU', 0);
  const cutU = tl.channel('cutU', 0);
  const skelU = tl.channel('skelU', 0);
  const drillFocus = tl.channel('drillFocus', 0);
  const lensU = tl.channel('lensU', 0);
  const drillU = tl.channel('drillU', 0);
  const replaceU = tl.channel('replaceU', 1);
  const replacedU = tl.channel('replacedU', 0);
  const flashU = tl.channel('flashU', 0);
  const treeDim = tl.channel('treeDim', 0);
  const tokenU = tl.channel('tokenU', -1);
  const tokenKind = tl.channel('tokenKind', 0);
  const actGlow = tl.channel('actGlow', 0);
  const resultU = tl.channel('resultU', 0);
  const squeezeU = tl.channel('squeezeU', 0);
  const ribbon2U = tl.channel('ribbon2U', 0);
  const stripU = tl.channel('stripU', 0);

  const CAPS = [
    'Agent Desktop lets an agent read and operate desktop applications. The agent decides what to do; this tool supplies observations and actions.',
    'The starting point is the accessibility tree: structured controls, names, and actions exposed by the operating system.',
    'First choose the window. If several windows match, the tool returns the candidates instead of guessing which one you meant.',
    'The snapshot walks that window and returns a tree. Each actionable or drillable node can receive a short reference, called a ref.',
    'That ref includes its snapshot identity. The element number alone is rejected, because it does not say which observation it came from.',
    'Behind the short ref, a saved map keeps identity evidence. Later commands use that evidence to look for the live element again.',
    'A full snapshot can run out of time and return a partial tree. Its completeness flag keeps missing branches from pretending to be empty.',
    'For a dense window, take a shallow skeleton and drill into one ref. A drill must finish before replacing that subtree in the saved map.',
    'The agent sends an action using the qualified ref. The tool resolves the target and returns a structured result about that command.',
    'Then the agent observes again. A command response is evidence about an operation; the next snapshot helps check what the application actually shows.',
  ];
  CAPS.forEach((text, i) => tl.caption({ at: CAPTION_AT(i), dur: CAPTION_DUR, text }));

  // BEAT 0 (0.6) — the window inside the agent's loop; the tool is only two docks
  tl.tween(winA, 1, { at: 0.6, dur: 1.0, ease: ease.enter });
  tl.tween(illusU, 1, { at: 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(ringU, 1, { at: 1.6, dur: 1.6, ease: ease.draw });

  // BEAT 1 (9.2) — scan line; the Documents row extrudes into a branch. The loop retires for the close-ups.
  tl.tween(cam, CAM_WORK, { at: 9.2, dur: 1.3, ease: ease.move });
  tl.tween(loopO, 0, { at: 9.2, dur: 1.0, ease: ease.move });
  tl.tween(scanO, 1, { at: 9.3, dur: 0.3, ease: ease.enter });
  tl.tween(scanY, 1, { at: 9.4, dur: 3.2, ease: ease.linear });
  tl.tween(branch[DOC], 1, { at: 9.4 + 3.2 * scanAt(DOC), dur: 0.8, ease: ease.draw });
  tl.tween(scanO, 0, { at: 12.8, dur: 0.6, ease: ease.move });

  // BEAT 2 (17.8) — a second Finder window; AMBIGUOUS_TARGET; --window-id picks one
  tl.tween(winB, 1, { at: 17.9, dur: 0.8, ease: ease.enter });
  tl.set(scanY, 0, 19.0);
  tl.tween(scanO, 1, { at: 19.2, dur: 0.3, ease: ease.enter });
  tl.tween(scanBlock, 1, { at: 19.4, dur: 0.4, ease: ease.enter });
  tl.tween(ambU, 1, { at: 19.8, dur: 0.5, ease: ease.pop });
  tl.tween(widU, 1, { at: 22.0, dur: 0.5, ease: ease.pop });
  tl.tween(ambU, 0, { at: 22.6, dur: 0.6, ease: ease.move });
  tl.tween(winBO, 0, { at: 22.6, dur: 1.2, ease: ease.move });
  tl.tween(scanBlock, 0, { at: 23.4, dur: 0.4, ease: ease.move });

  // BEAT 3 (26.4) — the walk: branches in depth order, refs stamped on actionable/drillable rows
  tl.tween(scanY, 1, { at: 26.6, dur: 4.0, ease: ease.linear });
  ROWS.forEach((row, i) => {
    const at = 26.6 + 4.0 * scanAt(i);
    if (i !== DOC) tl.tween(branch[i], 1, { at, dur: 0.7, ease: ease.draw });
    if (row.actionable) tl.tween(ref[i], 1, { at: at + 0.5, dur: 0.45, ease: ease.pop });
  });
  tl.tween(scanO, 0, { at: 30.8, dur: 0.6, ease: ease.move });

  // BEAT 4 (35.0) — push into @s8f3k2p9:e8; @e8 alone hits INVALID_ARGS. The window-id label has done
  // its job and retires with the push; only the active target and token stay in the close-up.
  tl.tween(cam, CAM_REF, { at: 35.0, dur: 1.3, ease: ease.move });
  tl.tween(widU, 0, { at: 35.0, dur: 0.6, ease: ease.move });
  tl.tween(rowsFocus, 1, { at: 35.2, dur: 0.8, ease: ease.move });
  tl.tween(braceU, 1, { at: 36.6, dur: 1.0, ease: ease.draw });
  tl.tween(gateU, 1, { at: 38.2, dur: 0.5, ease: ease.enter });
  tl.tween(e8U, 1, { at: 38.6, dur: 1.2, ease: ease.move });
  tl.tween(refusedU, 1, { at: 39.8, dur: 0.4, ease: ease.pop });
  tl.tween(detailO, 0, { at: 42.6, dur: 0.8, ease: ease.move });
  tl.tween(rowsFocus, 0, { at: 43.0, dur: 0.8, ease: ease.move });

  // BEAT 5 (43.6) — fold the tree; the reverse side is the saved map's evidence
  tl.tween(cam, CAM_WORK, { at: 43.6, dur: 1.3, ease: ease.move });
  tl.tween(flipU, 1, { at: 44.6, dur: 1.4, ease: ease.move });

  // BEAT 6 (52.2) — full snapshot against a time budget; the walk stops between Target and Run; the rows
  // below the cut become dashed "unobserved" ghosts under `complete: false`, held readable until the beat ends
  tl.tween(flipU, 0, { at: 52.3, dur: 1.0, ease: ease.move });
  tl.tween(clockReveal, 1, { at: 53.0, dur: 0.5, ease: ease.enter });
  tl.set(scanY, 0, 53.2);
  tl.tween(scanO, 1, { at: 53.4, dur: 0.3, ease: ease.enter });
  tl.tween(scanY, CUT_SCAN, { at: 53.6, dur: 2.2, ease: ease.linear });
  tl.tween(clockU, 1, { at: 53.6, dur: 2.2, ease: ease.linear });
  tl.tween(cutU, 1, { at: 55.8, dur: 0.6, ease: ease.enter });
  tl.tween(scanO, 0, { at: 60.4, dur: 0.6, ease: ease.move });

  // BEAT 7 (60.8) — skeleton; the lens drills Documents while the saved subtree entry stays unchanged;
  // only when the drill completes does the subtree replace that entry (as one unit), then the view holds
  tl.tween(cam, CAM_DRILL, { at: 60.8, dur: 1.3, ease: ease.move });
  tl.tween(clockReveal, 0, { at: 60.8, dur: 0.6, ease: ease.move });
  tl.set(clockU, 0, 61.4);
  tl.tween(cutU, 0, { at: 61.0, dur: 0.8, ease: ease.move });
  tl.set(replaceU, 0, 61.0);
  tl.tween(skelU, 1, { at: 61.0, dur: 1.0, ease: ease.move });
  tl.tween(drillFocus, 1, { at: 62.4, dur: 0.6, ease: ease.move });
  tl.tween(lensU, 1, { at: 62.6, dur: 0.8, ease: ease.enter });
  tl.tween(drillU, 1, { at: 63.3, dur: 1.8, ease: ease.linear });
  tl.tween(lensU, 0, { at: 66.0, dur: 0.6, ease: ease.move });
  tl.tween(skelU, 0, { at: 66.2, dur: 0.6, ease: ease.move });
  tl.tween(replaceU, 1, { at: 66.2, dur: 0.5, ease: ease.pop });
  tl.tween(replacedU, 1, { at: 66.4, dur: 0.5, ease: ease.enter });
  tl.set(flashU, 1, 66.2);
  tl.tween(flashU, 0, { at: 66.8, dur: 1.0, ease: ease.move });
  tl.tween(drillFocus, 0, { at: 66.4, dur: 0.6, ease: ease.move });

  // BEAT 8 (69.4) — the loop returns fully framed; the ref travels to act and comes back as a result
  tl.tween(cam, CAM_HOME, { at: 69.4, dur: 1.4, ease: ease.move });
  tl.tween(loopO, 1, { at: 69.4, dur: 1.0, ease: ease.move });
  tl.tween(treeDim, 1, { at: 69.6, dur: 0.8, ease: ease.move });
  tl.tween(replacedU, 0, { at: 69.6, dur: 0.8, ease: ease.move });
  tl.set(tokenKind, 0, 70.4);
  tl.set(tokenU, LOOP_AGENT_U, 70.4);
  tl.tween(tokenU, LOOP_ACT_U, { at: 70.6, dur: 2.4, ease: ease.move });
  tl.tween(actGlow, 1, { at: 73.0, dur: 0.5, ease: ease.pop });
  tl.set(tokenKind, 1, 73.6);
  tl.tween(tokenU, LOOP_AGENT_U, { at: 73.8, dur: 2.2, ease: ease.move });
  tl.tween(resultU, 1, { at: 76.0, dur: 0.6, ease: ease.enter });

  // BEAT 9 (78.0) — observe again: a second ribbon under the first (loop and result card step aside for the
  // comparison and return with the pull-back); Observe again.
  tl.set(tokenKind, 2, 78.1);
  tl.tween(tokenU, 1, { at: 78.2, dur: 1.8, ease: ease.move });
  tl.tween(cam, CAM_RIBBONS, { at: 79.6, dur: 1.2, ease: ease.move });
  tl.tween(treeDim, 0, { at: 79.6, dur: 0.8, ease: ease.move });
  tl.tween(squeezeU, 1, { at: 79.6, dur: 1.2, ease: ease.move });
  tl.set(scanY, 0, 79.9);
  tl.set(tokenU, -1, 80.0);
  tl.tween(loopO, 0, { at: 80.0, dur: 0.8, ease: ease.move });
  tl.tween(resultU, 0, { at: 80.0, dur: 0.6, ease: ease.move });
  tl.tween(scanO, 1, { at: 80.0, dur: 0.2, ease: ease.enter });
  tl.tween(scanY, 1, { at: 80.1, dur: 1.5, ease: ease.linear });
  tl.tween(ribbon2U, 1, { at: 80.1, dur: 1.5, ease: ease.linear });
  tl.tween(scanO, 0, { at: 81.7, dur: 0.4, ease: ease.move });
  tl.tween(cam, CAM_HOME, { at: 82.6, dur: 1.4, ease: ease.move });
  tl.tween(loopO, 1, { at: 82.6, dur: 1.2, ease: ease.move });
  tl.tween(resultU, 1, { at: 82.8, dur: 0.8, ease: ease.enter });
  tl.tween(stripU, 1, { at: 84.2, dur: 0.7, ease: ease.enter });
  tl.hold(CHAPTER_END - 0.6, 0.6);

  return {
    tl, cam, ringU, loopO, winA, winB, winBO, illusU, scanY, scanO, scanBlock, branch, ref, ambU, widU,
    rowsFocus, detailO, braceU, e8U, gateU, refusedU, flipU, clockReveal, clockU, cutU, skelU, drillFocus,
    lensU, drillU, replaceU, replacedU, flashU, treeDim, tokenU, tokenKind, actGlow, resultU, squeezeU,
    ribbon2U, stripU,
  };
}

const scene = buildScene();
export const vizScene = () => scene;

// ---------------------------------------------------------------------------
// Render — every frame a pure function of the sampled state
// ---------------------------------------------------------------------------

const TOKEN_LABEL = ['@s8f3k2p9:e8', 'result', 'snapshot'];
const TOKEN_COLOR = [ACCENT_LIGHT, colors.POSITIVE, ACCENT_LIGHT];

/** A dashed placeholder chip: an unobserved node or an unchanged saved-map entry. */
function GhostChip({ x, y, text, color, opacity, size = 18 }: { x: number; y: number; text: string; color: string; opacity: number; size?: number }) {
  if (opacity <= 0.001) return null;
  const w = chipW(text, size);
  return (
    <g opacity={opacity}>
      <rect x={x} y={y - size * 0.95} width={w} height={size * 1.5} rx={size * 0.45} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="5 4" />
      <text x={x + 11} y={y + size * 0.15} fill={color} fontSize={size} fontFamily={MONO} fontWeight={600} opacity={0.9}>
        {text}
      </text>
    </g>
  );
}

/** one tree row: branch connector and/or role chip + ref chip (or "no ref"); below the cut it is a ghost */
function TreeRow({
  i,
  branchU,
  refU,
  opacity,
  cut,
  scale = 1,
  showConnector,
  showChips,
}: {
  i: number;
  branchU: number;
  refU: number;
  opacity: number;
  cut: number;
  scale?: number;
  showConnector: boolean;
  showChips: boolean;
}) {
  if (opacity <= 0.001 || branchU <= 0) return null;
  const y = rowY(i);
  const x1 = roleX(i) - 6;
  const len = (x1 - BRANCH_X0) * branchU;
  const row = ROWS[i];
  const chipO = seg(branchU, 0.6, 1) * (1 - cut);
  return (
    <g opacity={opacity} transform={`translate(${BRANCH_X0}, ${y}) scale(${scale}) translate(${-BRANCH_X0}, ${-y})`}>
      {showConnector && (
        <line
          x1={BRANCH_X0}
          y1={y}
          x2={BRANCH_X0 + len}
          y2={y}
          stroke={cut > 0.5 ? colors.WARM : ACCENT_LIGHT}
          strokeWidth={2.5}
          strokeDasharray={cut > 0.5 ? '6 6' : undefined}
          opacity={cut > 0.5 ? 0.7 : 0.9}
        />
      )}
      {showChips && (
        <g>
          <Chip x={roleX(i)} y={y} text={row.role} color={colors.MUTED} opacity={chipO} />
          {row.actionable ? (
            <Chip x={refX(i)} y={y} text={REF[i]} opacity={refU * (1 - cut)} />
          ) : (
            <Label x={refX(i) + 6} y={y + 8} text="no ref" color={colors.MUTED} opacity={0.55 * chipO} weight={500} />
          )}
          {/* below the time-budget cut: not an empty branch, an unobserved one */}
          <GhostChip x={roleX(i)} y={y} text="unobserved" color={colors.WARM} opacity={cut * seg(branchU, 0.6, 1)} />
        </g>
      )}
    </g>
  );
}

function CompactRibbon({ yOf, u, title, from, selected }: { yOf: (i: number) => number; u: number; title: string; from: number; selected: number }) {
  if (u <= 0.001) return null;
  return (
    <g>
      <Label x={RIB.x} y={yOf(0) - 27} text={title} color={ACCENT_LIGHT} opacity={seg(u, 0, 0.3)} />
      {ROWS.map((row, i) => {
        const o = seg(u, Math.max(0, scanAt(i) - 0.05) * from, Math.min(1, scanAt(i) + 0.1) * from + (1 - from));
        const y = yOf(i);
        const sel = i === DOC ? selected : 0;
        return (
          <g key={row.name} opacity={o}>
            <rect x={RIB.x} y={y - 19} width={RIB.w} height={26} rx={6} fill={PLATE} />
            <rect x={RIB.x} y={y - 19} width={RIB.w} height={26} rx={6} fill={sel > 0.5 ? colors.POSITIVE : ACCENT} opacity={sel > 0.5 ? 0.22 : 0.14} />
            <Label x={RIB.nameX + 16 * DEPTH[i]} y={y + 6} text={row.name} size={20} />
            <Label x={RIB.roleX} y={y + 6} text={row.role} size={20} color={colors.MUTED} weight={500} />
            {sel > 0.5 && <Label x={RIB.stateX} y={y + 6} text="selected" size={20} color={colors.POSITIVE} />}
          </g>
        );
      })}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const loopO = s.get(scene.loopO);
  const rowsFocus = s.get(scene.rowsFocus);
  const detailO = s.get(scene.detailO);
  const flipU = s.get(scene.flipU);
  const cutU = s.get(scene.cutU);
  const skelU = s.get(scene.skelU);
  const drillFocus = s.get(scene.drillFocus);
  const lensU = s.get(scene.lensU);
  const drillU = s.get(scene.drillU);
  const replaceU = s.get(scene.replaceU);
  const replacedU = s.get(scene.replacedU);
  const flashU = s.get(scene.flashU);
  const treeDim = s.get(scene.treeDim);
  const squeezeU = s.get(scene.squeezeU);
  const ribbon2U = s.get(scene.ribbon2U);
  const actGlow = s.get(scene.actGlow);
  const scanY = s.get(scene.scanY);
  const scanO = s.get(scene.scanO);
  const scanBlock = s.get(scene.scanBlock);
  const clockU = s.get(scene.clockU);
  const tokenU = s.get(scene.tokenU);
  const kind = Math.round(s.get(scene.tokenKind));
  const winBO = s.get(scene.winBO);
  const e8U = s.get(scene.e8U);
  const refusedU = s.get(scene.refusedU);
  const illusU = s.get(scene.illusU);

  const sx = Math.cos(Math.PI * flipU); // fold: +1 front … −1 back
  const treeO = (1 - 0.85 * treeDim) * (1 - squeezeU);
  const connectorO = 1 - 0.8 * flipU;
  const scanLineY = SCAN_Y0 + SCAN_H * scanY;
  const scanColor = scanBlock > 0.01 ? colors.NEGATIVE : clockU >= 0.999 ? colors.WARM : ACCENT_LIGHT;
  const lensR = LENS.r * lensU;
  /** Target (the drilled subtree) is hidden by the skeleton and returns only with the replacement */
  const targetVis = Math.max(1 - skelU, replaceU);
  const drillDone = drillU >= 0.999;
  /** per-row quieting: beat 4 keeps Documents, beat 7 keeps Documents (and its returning child) */
  const rowO = (i: number): number => {
    const focus = i === DOC ? 1 : 1 - 0.94 * rowsFocus;
    const drill = i === DOC || i === TARGET ? 1 : 1 - 0.75 * drillFocus;
    return focus * drill;
  };

  return (
    <Camera {...s.get(scene.cam)}>
      {/* the agent's loop; the tool is only the two docks. Retired during the close-ups. */}
      {loopO > 0.001 && (
        <g opacity={loopO}>
          <AgentLoop
            cx={RING.cx}
            cy={RING.cy}
            r={RING.r}
            reveal={s.get(scene.ringU)}
            tokenU={tokenU}
            tokenColor={TOKEN_COLOR[kind] ?? ACCENT_LIGHT}
            tokenLabel={TOKEN_LABEL[kind]}
          />
        </g>
      )}

      {/* the second, ambiguous window (behind) */}
      <WindowFrame x={WIN_B.x} y={WIN_B.y} w={WIN_B.w} h={WIN_B.h} title="Finder" reveal={s.get(scene.winB)} opacity={winBO} accent={colors.NEGATIVE}>
        <rect x={10} y={50} width={85} height={270} rx={8} fill="#131b2e" />
        {ROWS.map((row, i) => (
          <Label key={row.name} x={110 + 24 * (DEPTH[i] > 1 ? 1 : 0)} y={rowLocalY(i) + 8} text={row.name} color={colors.MUTED} />
        ))}
      </WindowFrame>

      {/* the chosen window: the one persistent screen */}
      <WindowFrame x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} title="Finder" reveal={s.get(scene.winA)}>
        <rect x={10} y={50} width={85} height={270} rx={8} fill="#131b2e" />
        {ROWS.map((row, i) => {
          // rows below the time-budget cut were never walked: they stay on screen but are not evidence
          const o = (i === DOC ? 1 : 1 - 0.9 * rowsFocus) * (i >= CUT_ROW ? 1 - 0.65 * cutU : 1);
          return (
            <g key={row.name} opacity={o}>
              {i === DOC && actGlow > 0 && (
                <rect x={100} y={rowLocalY(i) - 20} width={WIN.w - 110} height={40} rx={8} fill={colors.POSITIVE} opacity={0.22 * actGlow} />
              )}
              <Label x={110 + 24 * (DEPTH[i] > 1 ? 1 : 0)} y={rowLocalY(i) + 8} text={row.name} />
            </g>
          );
        })}
      </WindowFrame>
      <Label x={WIN.x} y={WIN.y - 12} text="illustrative desktop" size={20} color={colors.MUTED} opacity={0.7 * illusU * (1 - rowsFocus)} weight={500} />
      <Chip x={WIN.x + WIN.w} y={WIN.y - 14} text="--window-id" anchor="end" opacity={s.get(scene.widU)} />
      <RefusalBadge x={600} y={120} code="AMBIGUOUS_TARGET" u={s.get(scene.ambU)} />

      {/* scan line */}
      {scanO > 0.001 && (
        <g opacity={scanO}>
          <line x1={WIN.x + 8} y1={scanLineY} x2={WIN.x + WIN.w - 8} y2={scanLineY} stroke={scanColor} strokeWidth={3} strokeLinecap="round" />
          <rect x={WIN.x + 8} y={scanLineY - 18} width={WIN.w - 16} height={18} fill={scanColor} opacity={0.12} />
        </g>
      )}

      {/* the tree: branches paired to the rows they came from */}
      <g opacity={treeO}>
        {/* connectors never fold; they fade while the ribbon is turned over */}
        <g opacity={connectorO}>
          {ROWS.map((row, i) => (
            <TreeRow
              key={row.name}
              i={i}
              branchU={s.get(scene.branch[i]) * (i === TARGET ? targetVis : 1)}
              refU={0}
              opacity={rowO(i) * (i === TARGET ? targetVis : 1)}
              cut={i >= CUT_ROW ? cutU : 0}
              showConnector
              showChips={false}
            />
          ))}
        </g>
        {/* front side of the ribbon: chips (the Documents ref is the anchor and never folds) */}
        {sx > 0 && (
          <g transform={`translate(${FOLD_AXIS}, 0) scale(${sx}, 1) translate(${-FOLD_AXIS}, 0)`}>
            {ROWS.map((row, i) => (
              <TreeRow
                key={row.name}
                i={i}
                branchU={s.get(scene.branch[i]) * (i === TARGET ? targetVis : 1)}
                refU={i === DOC ? 0 : s.get(scene.ref[i])}
                opacity={rowO(i) * (i === TARGET ? targetVis : 1)}
                cut={i >= CUT_ROW ? cutU : 0}
                scale={i === TARGET ? lerp(0.6, 1, replaceU) : 1}
                showConnector={false}
                showChips
              />
            ))}
            {/* BEAT 6: the cut boundary and the completeness flag, held while the partial tree is on screen */}
            {cutU > 0.001 && (
              <g opacity={cutU}>
                <line x1={BRANCH_X0} y1={CUT_Y} x2={1050} y2={CUT_Y} stroke={colors.WARM} strokeWidth={2} strokeDasharray="8 6" opacity={0.8} />
                <Chip x={860} y={rowY(CUT_ROW)} text="complete: false" color={colors.WARM} />
              </g>
            )}
            {/* BEAT 7: the saved map's entry for the subtree stays unchanged until the drill completes */}
            <GhostChip
              x={roleX(TARGET)}
              y={rowY(TARGET)}
              text="subtree: unchanged"
              color={drillDone ? colors.WARM : colors.MUTED}
              opacity={skelU * (1 - replaceU)}
            />
            <Label x={1052} y={rowY(TARGET) + 7} text="replaced" size={18} color={colors.POSITIVE} opacity={replacedU} />
          </g>
        )}
        {/* reverse side: the saved map's evidence for the anchor */}
        {sx < 0 && (
          <g transform={`translate(${FOLD_AXIS}, 0) scale(${-sx}, 1) translate(${-FOLD_AXIS}, 0)`} opacity={0.92}>
            <rect x={690} y={200} width={480} height={255} rx={14} fill="rgba(15, 23, 42, 0.88)" stroke={ACCENT_LIGHT} strokeWidth={1.5} strokeDasharray="8 6" />
            <Chip x={702} y={232} text="RefMap entry" color={colors.WARM} />
            {[
              ['process', 'process identity'],
              ['identity', 'role · text · identifiers'],
              ['source', 'window · tree path · geometry'],
            ].map(([k, v], j) => (
              <g key={k}>
                <Label x={706} y={330 + 45 * j} text={k} color={colors.WARM} />
                <Label x={840} y={330 + 45 * j} text={v} weight={500} />
              </g>
            ))}
          </g>
        )}
        {/* the anchor: Documents' qualified ref */}
        <Chip x={refX(DOC)} y={rowY(DOC)} text={REF[DOC]} opacity={s.get(scene.ref[DOC])} color={actGlow > 0.5 ? colors.POSITIVE : ACCENT_LIGHT} />
        {/* flash bracket when the drilled subtree lands as one unit */}
        {flashU > 0.001 && (
          <rect x={roleX(TARGET) - 14} y={rowY(TARGET) - 24} width={refX(TARGET) + chipW(REF[TARGET]) - roleX(TARGET) + 28} height={48} rx={10} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} opacity={flashU} />
        )}
      </g>

      {/* BEAT 4 detail: braces and the INVALID_ARGS gate */}
      {detailO > 0.001 && (
        <g opacity={detailO}>
          <g opacity={s.get(scene.braceU)}>
            <path d={`M ${SNAP_X0} 294 L ${SNAP_X0} 302 L ${SNAP_X1} 302 L ${SNAP_X1} 294`} fill="none" stroke={colors.WARM} strokeWidth={2} />
            <Label x={(SNAP_X0 + SNAP_X1) / 2} y={330} text="snapshot" color={colors.WARM} anchor="middle" />
            <path d={`M ${ELEM_X0} 256 L ${ELEM_X0} 248 L ${ELEM_X1} 248 L ${ELEM_X1} 256`} fill="none" stroke={ACCENT_LIGHT} strokeWidth={2} />
            <Label x={(ELEM_X0 + ELEM_X1) / 2 + 20} y={240} text="element" color={ACCENT_LIGHT} anchor="middle" />
          </g>
          <Shutter x={GATE.x} y={GATE.y} h={GATE.h} open={0} label="" reveal={s.get(scene.gateU)} refused={refusedU} />
          <Chip x={lerp(E8_FROM, E8_TO, e8U)} y={GATE.y} text="@e8" color={refusedU > 0.5 ? colors.NEGATIVE : ACCENT_LIGHT} opacity={seg(e8U, 0, 0.15)} />
          <RefusalBadge x={GATE.x} y={GATE.y - 60} code="INVALID_ARGS" u={refusedU} />
        </g>
      )}

      {/* BEAT 6 time budget */}
      <ClockArc cx={CLOCK.cx} cy={CLOCK.cy} r={CLOCK.r} u={clockU} reveal={s.get(scene.clockReveal)} label="" />
      <Label x={CLOCK.cx} y={CLOCK.cy + CLOCK.r + 30} text="time budget" color={colors.WARM} anchor="middle" opacity={s.get(scene.clockReveal)} />

      {/* BEAT 7 lens: drilling one ref — the chosen root and the children it reveals, then the completed subtree */}
      {lensR > 1 && (
        <g>
          <defs>
            <clipPath id="ad-c1-lens">
              <circle cx={LENS.cx} cy={LENS.cy} r={lensR} />
            </clipPath>
          </defs>
          <circle cx={LENS.cx} cy={LENS.cy} r={lensR} fill={PLATE} stroke={drillDone ? colors.POSITIVE : ACCENT_LIGHT} strokeWidth={2} />
          <circle
            cx={LENS.cx}
            cy={LENS.cy}
            r={lensR + 7}
            fill="none"
            stroke={drillDone ? colors.POSITIVE : colors.WARM}
            strokeWidth={4}
            strokeDasharray={`${2 * Math.PI * (lensR + 7) * drillU} ${2 * Math.PI * (lensR + 7)}`}
            transform={`rotate(-90 ${LENS.cx} ${LENS.cy})`}
          />
          {/* the lens title sits above the lens, clear of the e8 chip and of the caption band */}
          <Chip x={1016} y={LENS.cy - LENS.r - 14} text="drill @s8f3k2p9:e8" color={colors.WARM} size={16} opacity={seg(lensU, 0.7, 1)} />
          {/* clip first, then position: the clip circle must live in stage space, not in the lens's local space */}
          <g clipPath="url(#ad-c1-lens)">
            <g transform={`translate(${LENS.cx}, ${LENS.cy})`} opacity={seg(lensU, 0.6, 1)}>
              {/* root: the drilled ref's node */}
              <Label x={-96} y={-34} text="Documents" size={18} opacity={seg(drillU, 0, 0.15)} />
              <Chip x={2} y={-40} text="treeitem" color={colors.MUTED} size={14} opacity={seg(drillU, 0.05, 0.2)} />
              {/* the child branch grows as the drill walks it */}
              <path
                d={`M -88 -24 L -88 ${lerp(-24, 10, seg(drillU, 0.2, 0.45))} L ${lerp(-88, -76, seg(drillU, 0.4, 0.5))} 10`}
                fill="none"
                stroke={ACCENT_LIGHT}
                strokeWidth={2.5}
                opacity={seg(drillU, 0.2, 0.3)}
              />
              <Label x={-70} y={16} text="Target" size={18} opacity={seg(drillU, 0.45, 0.6)} />
              <Chip x={-2} y={10} text="treeitem" color={colors.MUTED} size={14} opacity={seg(drillU, 0.55, 0.7)} />
              <Chip x={-70} y={46} text={REF[TARGET]} size={16} opacity={seg(drillU, 0.8, 1)} />
              <Label
                x={0}
                y={84}
                text={drillDone ? 'drill complete' : 'drilling…'}
                size={16}
                color={drillDone ? colors.POSITIVE : colors.WARM}
                anchor="middle"
              />
            </g>
          </g>
        </g>
      )}

      {/* BEAT 8 result card, on the agent's side of the ring */}
      <OpaqueStrip x={RESULT.x} y={RESULT.y} w={RESULT.w} h={RESULT.h} opacity={s.get(scene.resultU)} stroke={colors.POSITIVE}>
        <Chip x={RESULT.x + 14} y={RESULT.y + 24} text="result" color={colors.POSITIVE} />
        <Label x={RESULT.x + 14} y={RESULT.y + 60} text="target resolved" />
        <Label x={RESULT.x + 14} y={RESULT.y + 88} text="action completed" />
      </OpaqueStrip>

      {/* BEAT 9 ribbons: the first observation squeezed, the second beneath it */}
      <g opacity={1 - 0.7 * treeDim}>
        <CompactRibbon yOf={(i) => lerp(rowY(i), COMPACT_Y1(i), squeezeU)} u={squeezeU} title="observation 1" from={0} selected={0} />
        <CompactRibbon yOf={COMPACT_Y2} u={ribbon2U} title="observation 2" from={1} selected={seg(ribbon2U, scanAt(DOC), scanAt(DOC) + 0.1)} />
      </g>

      {/* closing strip (above the caption band) */}
      <OpaqueStrip x={STRIP.x} y={STRIP.y} w={STRIP.w} h={STRIP.h} opacity={s.get(scene.stripU)}>
        <text x={STRIP.x + STRIP.w / 2} y={STRIP.y + 38} textAnchor="middle" fill={INK} fontSize={30} fontFamily={MONO} fontWeight={700}>
          Observe again.
        </text>
      </OpaqueStrip>
    </Camera>
  );
}
