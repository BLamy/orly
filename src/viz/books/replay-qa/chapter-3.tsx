// Book scene — replay-qa, chapter 3: "Strip and Re-execute".
// The bug report is a STRUCTURE the server enforces: buggy_behavior, a 2+
// step chronology (screenshots + three evidence types per action step), a
// hedge-free root_cause, and a causal chain. Every evidence item is ONLY
// {tool, params, recording_id} — results are forbidden. The trust move:
// agent-written results are visibly STRIPPED to null, then the server itself
// dials the Replay MCP and re-executes every citation against the recording;
// real results fly back and fill the empty slots.
// Backing files (replayio/loop-qa): netlify/functions/lib/prompts.ts
// (buildBugSubmissionGuidelines — the analysis schema, "Do NOT include a
// result field. The server strips any results you provide and re-executes
// the MCP tool calls independently"), netlify/functions/lib/replay-mcp.ts
// (resolveEvidenceItems: item.result = null, then callTool against
// dispatch.replay.io/nut/mcp), netlify/functions/lib/bug-report-schema.ts.
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Packet, ServiceNode } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage is 1280×720; captions own the bottom ~12% (y ≳ 630). */
const REPORT = { x: 64, w: 540 };
const SECTIONS = {
  bb: { y: 92, h: 48 },
  ch1: { y: 154, h: 58 },
  ch2: { y: 226, h: 58 },
  rc: { y: 298, h: 58 },
  chain: { y: 370, h: 48 },
};
const CARDS = { x: 680, w: 316, ys: [96, 186, 276, 366] };
const MCP = { x: 1146, y: 236 };
const CLOSE = { x: 640, y: 540 };

/* ------------------------------------------------------------------ data */
/** The four cited tools — all from the prompt's valid-tools list. */
const EVIDENCE = [
  { tool: 'Screenshot', params: 'recordingId: b5f2a3c1…', claim: 'looked broken', real: 'frame @ 03:41' },
  { tool: 'NetworkRequest', params: 'mode: "requests"', claim: 'I saw a 500', real: 'POST payment → 500' },
  { tool: 'ConsoleMessages', params: 'mode: "messages"', claim: 'errors appeared', real: 'error ×1 @ 03:41' },
  { tool: 'UncaughtException', params: 'recordingId: b5f2a3c1…', claim: 'it crashed', real: 'server 500, no throw' },
];

const BB_TEXT = 'Order is never placed; server returns 500';
const CH1_TEXT = '1. Fill payment details, click Submit Payment';
const CH2_TEXT = '2. Error banner appears; no confirmation';
const RC_TEXT = 'root_cause: one definite cause, cited';
const CHAIN_TEXT = 'chain: root cause → what the user saw';

const CH1_TAGS = ['Screenshot', 'UserInteractions', 'InspectElement'];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  // the report structure
  const scaffE = tl.channel('scaffoldEnter', 0);
  const bbU = tl.channel('buggyBehavior', 0);
  const chronU = tl.channel('chronologySteps', 0); // 0..2
  const tagsU = tl.channel('actionEvidenceTags', 0); // 0..3
  const rcU = tl.channel('rootCauseEnter', 0);
  const rcStamp = tl.channel('noHedgingStamp', 0);
  const chainU = tl.channel('chainEnter', 0);

  // the evidence rack + the strip-and-re-execute
  const rackU = tl.channel('rackCards', 0); // 0..4
  const mcpE = tl.channel('mcpEnter', 0);
  const claimU = tl.channel('agentResults', 0); // agent-written results appear
  const forbidU = tl.channel('forbiddenStamp', 0);
  const stripU = tl.channel('stripResults', 0); // tear-off → null
  const execU = tl.channel('reexecPackets', 0); // 0..4 staggered round trips
  const fillU = tl.channel('realResults', 0); // 0..4 slots fill
  const glowU = tl.channel('wireGlow', 0);
  const gReport = tl.channel('reportFade', 1);
  const gRack = tl.channel('rackFade', 1);
  const closeU = tl.channel('closePanel', 0);

  /* ---- beat 1: a report is a structure ---------------------------------- */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The agent saw a five hundred. Time to file. But a bug report here isn’t prose — it’s a structure, and the server enforces its shape.',
  });
  tl.tween(scaffE, 1, { at: t - 5.2, dur: 1.0, ease: ease.draw });
  tl.tween(bbU, 1, { at: t - 3.8, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* ---- beat 2: the chronology -------------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'First the chronology: at least two steps, in order — what the user did, then what they observed. At least one step must carry a screenshot.',
  });
  tl.tween(chronU, 2, { at: t - 5.0, dur: 2.2, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* ---- beat 3: action steps carry three evidence types ------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Steps that describe an action need three kinds of evidence: a screenshot of the element, the interaction record, and the element inspection itself.',
  });
  tl.tween(tagsU, 3, { at: t - 5.0, dur: 2.4, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* ---- beat 4: the root cause, hedge-free -------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Then the root cause. One definite, technical cause. The judge rejects hedging — no may have, no could have, no possibly, no perhaps.',
  });
  tl.tween(rcU, 1, { at: t - 5.0, dur: 0.7, ease: ease.enter });
  tl.tween(rcStamp, 1, { at: t - 3.4, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 5: the chain -------------------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.0,
    text: 'And the chain: the steps that connect that root cause to what the user saw. Every link cites evidence.',
  });
  tl.tween(chainU, 1, { at: t - 4.4, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* ---- beat 6: an evidence item is params ONLY ---------------------------- */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Now look closely at an evidence item. It’s just a tool name, parameters, and a recording id. There is no result field. Results from the agent are forbidden.',
  });
  tl.tween(gReport, 0.25, { at: t - 5.8, dur: 0.7, ease: ease.move });
  tl.tween(rackU, 4, { at: t - 5.2, dur: 2.6, ease: ease.enter });
  tl.tween(claimU, 1, { at: t - 2.6, dur: 1.2, ease: ease.enter });
  tl.tween(forbidU, 1, { at: t - 1.2, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* ---- beat 7: the strip --------------------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Because here’s the trust move: if the agent writes results anyway, the server strips them. Every result field is set to null before anything is checked.',
  });
  tl.tween(stripU, 1, { at: t - 4.6, dur: 1.6, ease: ease.move });
  tl.tween(forbidU, 0, { at: t - 1.4, dur: 0.6, ease: ease.move });
  t = tl.hold(t, 0.6);

  /* ---- beat 8: the server re-executes every citation ----------------------- */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Then the server itself dials the Replay MCP and re-executes every citation against the recording — console messages, network requests, uncaught exceptions, source searches.',
  });
  tl.tween(mcpE, 1, { at: t - 5.8, dur: 0.7, ease: ease.enter });
  tl.tween(execU, 4, { at: t - 4.8, dur: 4.2, ease: ease.linear });
  tl.tween(fillU, 4, { at: t - 3.4, dur: 3.4, ease: ease.linear });
  t = tl.hold(t, 0.6);

  /* ---- beat 9: the 500, replayed -------------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The real results fill the empty slots. The five hundred in this report is not the agent’s memory of a five hundred — it’s the wire, replayed.',
  });
  tl.tween(glowU, 1, { at: t - 4.6, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* ---- beat 10: pointers in, truth out --------------------------------------- */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Agents supply pointers. The platform computes truth. That is the deal — and it’s why a reviewer can trust a report written by something that wanted to pass.',
  });
  tl.tween(gRack, 0.15, { at: t - 5.6, dur: 0.8, ease: ease.move });
  tl.tween(gReport, 0.1, { at: t - 5.6, dur: 0.8, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.6, dur: 0.7, ease: ease.enter });
  tl.hold(t, 1.2);

  return {
    tl,
    scaffE, bbU, chronU, tagsU, rcU, rcStamp, chainU,
    rackU, mcpE, claimU, forbidU, stripU, execU, fillU, glowU,
    gReport, gRack, closeU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** One section of the analysis object — label chip + content line. */
function Section({
  y, h, tag, text, u, accent = colors.GRID,
}: {
  y: number; h: number; tag: string; text: string; u: number; accent?: string;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${REPORT.x}, ${y + (1 - uu) * 10})`} opacity={uu}>
      <rect width={REPORT.w} height={h} rx={9} fill={colors.PANEL} stroke={accent} strokeWidth={1.4} />
      <rect width={5} height={h} rx={2.5} fill={accent} opacity={0.85} />
      <text x={16} y={20} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
        {tag}
      </text>
      <text x={16} y={h - 14} fill={colors.TEXT} fontSize={13} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** The three evidence-type tags an action step must carry. */
function ActionTags({ u }: { u: number }) {
  const uu = clamp01(u / 3) * 3;
  if (uu <= 0) return null;
  let cx = REPORT.x + 240;
  return (
    <g>
      {CH1_TAGS.map((name, i) => {
        const cu = clamp01(uu - i);
        const w = name.length * 6.6 + 18;
        const x0 = cx;
        cx += w + 8;
        if (cu <= 0) return null;
        return (
          <g key={name} transform={`translate(${x0}, ${SECTIONS.ch1.y + 14})`} opacity={cu}>
            <rect y={-11} width={w} height={22} rx={11} fill={colors.BG} stroke={colors.TEAL} strokeWidth={1.3} />
            <text x={w / 2} y={4} textAnchor="middle" fill={colors.TEAL} fontSize={10.5} fontFamily={mono}>
              {name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The no-hedging stamp on root_cause. */
function NoHedging({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g
      transform={`translate(${REPORT.x + REPORT.w - 110}, ${SECTIONS.rc.y + 28}) rotate(-7) scale(${0.7 + 0.3 * uu})`}
      opacity={uu}
    >
      <rect x={-86} y={-15} width={172} height={30} rx={6} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.4} />
      <text y={5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontWeight={800} letterSpacing={1} fontFamily={mono}>
        NO “possibly”
      </text>
    </g>
  );
}

/** One evidence card: tool + params + a result slot that is stripped/refilled. */
function EvidenceCard({
  x, y, w, tool, params, claim, real, enter, claimU, stripU, fillU,
}: {
  x: number; y: number; w: number; tool: string; params: string;
  claim: string; real: string; enter: number; claimU: number; stripU: number; fillU: number;
}) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const c = clamp01(claimU);
  const st = clamp01(stripU);
  const f = clamp01(fillU);
  const h = 74;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 10})`} opacity={e}>
      <rect width={w} height={h} rx={9} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={14} y={20} fill={colors.TEXT} fontSize={12.5} fontWeight={700} fontFamily={mono}>
        {tool}
      </text>
      <text x={14} y={38} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
        {params}
      </text>
      {/* the result slot */}
      <rect x={14} y={48} width={w - 28} height={18} rx={4} fill={colors.BG} opacity={0.6} />
      {/* agent-written result: appears, then is struck through and falls away */}
      {c > 0 && st < 1 && f < 0.05 && (
        <g opacity={c * (1 - st)} transform={`translate(0, ${st * 10})`}>
          <text x={20} y={61} fill={colors.NEGATIVE} fontSize={10.5} fontFamily={mono}>
            result: “{claim}”
          </text>
          {st > 0.05 && (
            <line x1={18} y1={57.5} x2={18 + (claim.length + 10) * 6.3 * Math.min(1, st * 1.6)} y2={57.5} stroke={colors.NEGATIVE} strokeWidth={1.6} />
          )}
        </g>
      )}
      {/* null, then the recomputed truth */}
      {st > 0.6 && f < 0.5 && (
        <text x={20} y={61} fill={colors.MUTED} fontSize={10.5} fontFamily={mono} opacity={clamp01((st - 0.6) * 2.5) * (1 - clamp01(f * 2))}>
          result: null
        </text>
      )}
      {f > 0.5 && (
        <g opacity={clamp01((f - 0.5) * 2)}>
          <path d={`M 20 57 l 3 3.5 l 5.5 -6.5`} fill="none" stroke={colors.POSITIVE} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <text x={36} y={61} fill={colors.POSITIVE} fontSize={10.5} fontFamily={mono}>
            {real}
          </text>
        </g>
      )}
    </g>
  );
}

/** FORBIDDEN — the rule, stamped over the agent-written results. */
function ForbiddenStamp({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g
      transform={`translate(${CARDS.x + CARDS.w / 2}, ${CARDS.ys[1] + 120}) rotate(-10) scale(${0.7 + 0.3 * uu})`}
      opacity={uu}
    >
      <rect x={-158} y={-24} width={316} height={48} rx={8} fill={colors.BG} opacity={0.55} />
      <rect x={-158} y={-24} width={316} height={48} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={3.5} />
      <text y={7} textAnchor="middle" fill={colors.NEGATIVE} fontSize={17} fontWeight={800} letterSpacing={2} fontFamily={mono}>
        results: FORBIDDEN
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const gReport = s.get(scene.gReport);
  const gRack = s.get(scene.gRack);
  const chron = s.get(scene.chronU);
  const rack = s.get(scene.rackU);
  const exec = s.get(scene.execU);
  const fill = s.get(scene.fillU);
  const glow = s.get(scene.glowU);
  const closeU = s.get(scene.closeU);

  return (
    <>
      {/* the report structure */}
      {gReport > 0.002 && (
        <g opacity={gReport}>
          <g opacity={s.get(scene.scaffE)}>
            <text x={REPORT.x} y={64} fill={colors.MUTED} fontSize={12}>
              bugs.analysis — the structured report (JSONB)
            </text>
            <rect
              x={REPORT.x - 14}
              y={74}
              width={REPORT.w + 28}
              height={SECTIONS.chain.y + SECTIONS.chain.h - 60}
              rx={12}
              fill="none"
              stroke={colors.GRID}
              strokeWidth={1}
              opacity={0.5}
            />
          </g>
          <Section {...SECTIONS.bb} tag="buggy_behavior" text={BB_TEXT} u={s.get(scene.bbU)} accent={colors.NEGATIVE} />
          <Section {...SECTIONS.ch1} tag="chronology · action step · screenshot ✓" text={CH1_TEXT} u={clamp01(chron)} accent={colors.ACCENT} />
          <Section {...SECTIONS.ch2} tag="chronology · observation · screenshot ✓" text={CH2_TEXT} u={clamp01(chron - 1)} accent={colors.ACCENT} />
          <ActionTags u={s.get(scene.tagsU)} />
          <Section {...SECTIONS.rc} tag="root_cause" text={RC_TEXT} u={s.get(scene.rcU)} accent={colors.WARM} />
          <NoHedging u={s.get(scene.rcStamp)} />
          <Section {...SECTIONS.chain} tag="chain" text={CHAIN_TEXT} u={s.get(scene.chainU)} accent={colors.SECONDARY} />
        </g>
      )}

      {/* the evidence rack + the Replay MCP */}
      {gRack > 0.002 && (
        <g opacity={gRack}>
          {EVIDENCE.map((ev, i) => (
            <EvidenceCard
              key={ev.tool}
              x={CARDS.x}
              y={CARDS.ys[i]}
              w={CARDS.w}
              tool={ev.tool}
              params={ev.params}
              claim={ev.claim}
              real={ev.real}
              enter={clamp01(rack - i)}
              claimU={s.get(scene.claimU)}
              stripU={s.get(scene.stripU)}
              fillU={clamp01(fill - i)}
            />
          ))}
          <ServiceNode
            x={MCP.x}
            y={MCP.y}
            kind="external"
            label="Replay MCP"
            sublabel="dispatch.replay.io/nut/mcp"
            u={s.get(scene.mcpE)}
            glow={0.35 * clamp01(exec) * (1 - clamp01(exec - 3.6) * 2)}
          />
          {/* re-execution round trips: card → MCP (params), MCP → card (result) */}
          {EVIDENCE.map((_, i) => {
            const eu = clamp01(exec - i);
            if (eu <= 0 || eu >= 1) return null;
            const cardEdge = { x: CARDS.x + CARDS.w, y: CARDS.ys[i] + 56 };
            const mcpEdge = { x: MCP.x - 66, y: MCP.y };
            return eu < 0.5 ? (
              <Packet key={`out${i}`} from={cardEdge} to={mcpEdge} u={eu * 2} color={colors.MUTED} r={5} />
            ) : (
              <Packet key={`back${i}`} from={mcpEdge} to={cardEdge} u={(eu - 0.5) * 2} color={colors.POSITIVE} r={5} />
            );
          })}
          {/* the wire, replayed — highlight the NetworkRequest card's truth */}
          {glow > 0.01 && (
            <rect
              x={CARDS.x - 5}
              y={CARDS.ys[1] - 5}
              width={CARDS.w + 10}
              height={84}
              rx={12}
              fill="none"
              stroke={colors.POSITIVE}
              strokeWidth={2}
              opacity={glow * 0.9}
            />
          )}
        </g>
      )}
      <ForbiddenStamp u={s.get(scene.forbidU)} />

      {/* close — the deal */}
      {closeU > 0.01 && (
        <g transform={`translate(${CLOSE.x}, ${CLOSE.y})`} opacity={closeU}>
          <rect x={-320} y={-40} width={640} height={80} rx={12} fill={colors.BG} opacity={0.92} />
          <rect x={-320} y={-40} width={640} height={80} rx={12} fill="none" stroke={colors.TEAL} strokeWidth={1.6} />
          <text y={-8} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={700}>
            agents supply pointers · the platform computes truth
          </text>
          <text y={20} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
            resolveEvidenceItems(): result = null → re-run via Replay MCP
          </text>
        </g>
      )}
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
