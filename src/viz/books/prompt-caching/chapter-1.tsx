// Book scene — prompt-caching, chapter 1: "Every Turn Re-Reads Everything".
// One coherent stage across 6 beats: a transcript builds turn by turn on the
// left, and on every call to client.messages.create the model RE-READS the
// whole stack (a sweep + TokenStream over ALL cards, not just the new one).
// A ContextBar fills as history grows, a per-call input_tokens chart climbs
// steeper each turn, and the closer ends on the realization: the same prefix
// is re-processed from token zero, call after call.
import { MathLabel, Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, ServiceNode } from '../../primitives';
import { ContextBar, MessageCard, ROLE_COLOR, TokenStream, messageCardHeight } from '../../agent';
import type { MessageRole } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

const CARD_X = 50;
const CARD_W = 420;
const CARD_GAP = 8;
const CARD_TOP = 64;

interface Turn {
  role: MessageRole;
  text: string;
  tokens: number;
}

const TURNS: Turn[] = [
  { role: 'system', text: "You are a concise coding assistant. Ground every answer in the project's real code.", tokens: 12000 },
  { role: 'user', text: 'Why is my build so slow?', tokens: 3000 },
  { role: 'assistant', text: 'Your bundler re-parses every module on each run — enable the persistent cache.', tokens: 9000 },
  { role: 'user', text: 'How do I turn that on?', tokens: 4000 },
  { role: 'assistant', text: "Set cache: { type: 'filesystem' } in the config; later builds reuse prior work.", tokens: 11000 },
  { role: 'user', text: 'Does that work in CI too?', tokens: 5000 },
  { role: 'assistant', text: 'Yes — restore the cache directory before the build step runs.', tokens: 14000 },
];

// stacked Y positions, computed once
const CARD_H = TURNS.map((t) => messageCardHeight(t.text, CARD_W));
const CARD_Y = TURNS.reduce<number[]>((ys, _, i) => {
  ys.push(i === 0 ? CARD_TOP : ys[i - 1] + CARD_H[i - 1] + CARD_GAP);
  return ys;
}, []);
const cardBottom = (i: number) => CARD_Y[i] + CARD_H[i];

// each call re-sends everything up through the user turn that triggered it
const CALLS = [
  { lastIdx: 1, inputTokens: 15000 }, // system + u1
  { lastIdx: 3, inputTokens: 28000 }, // + a1 + u2
  { lastIdx: 5, inputTokens: 44000 }, // + a2 + u3
];
const MAX_INPUT = CALLS[2].inputTokens;
const PREFIX_LAST = 4; // system…assistant#2 — identical prefix of the later calls

// right side: the app → model hop, then the Usage chart
const APP = { x: 640, y: 128 };
const MODEL = { x: 1122, y: 128 };
const PANEL = { x: 560, y: 244, w: 670, h: 296 };
const BAR_W = 96;
const BAR_XS = [130, 316, 502]; // relative to PANEL
const BAR_BASE = 236; // relative baseline
const BAR_MAX_H = 168;

const CTX = { x: 50, y: 602, w: 1180, capacity: 200000 };
const THRESHOLD = 100000; // CompactionControl's DEFAULT_TOKEN_THRESHOLD

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const appU = tl.channel('appU', 0);
  const modelU = tl.channel('modelU', 0);
  const connU = tl.channel('connU', 0);
  const connFlow = tl.channel('connFlow', 0);
  const callN = tl.channel('callN', 0);

  const cardE = TURNS.map((_, i) => tl.channel(`card${i}E`, 0));
  const cardT = TURNS.map((_, i) => tl.channel(`card${i}T`, 0));

  const braceU = tl.channel('braceU', 0);
  const ctxU = tl.channel('ctxU', 0);
  const statelessU = tl.channel('statelessU', 0);

  const sweeps = CALLS.map((_, i) => tl.channel(`sweep${i + 1}U`, 0));
  const streams = CALLS.map((_, i) => tl.channel(`stream${i + 1}U`, 0));

  const usageU = tl.channel('usageU', 0);
  const bars = CALLS.map((_, i) => tl.channel(`bar${i + 1}U`, 0));
  const tokCount = tl.channel('tokCount', 0);
  const mathInU = tl.channel('mathInU', 0);

  const thresholdU = tl.channel('thresholdU', 0);
  const mathSumU = tl.channel('mathSumU', 0);

  const dimU = tl.channel('dimU', 0);
  const prefixSweep = tl.channel('prefixSweep', 0);
  const mathPrefixU = tl.channel('mathPrefixU', 0);

  // BEAT 0 — one call to the model: messages.create(), the single entry point
  tl.caption({ at: 0.4, dur: 4.5, text: 'One entry point: client.messages.create({ model, messages }).' });
  tl.tween(appU, 1, { at: 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(modelU, 1, { at: 0.9, dur: 0.6, ease: ease.enter });
  tl.tween(connU, 1, { at: 1.5, dur: 1.2, ease: ease.draw });
  tl.tween(cardE[0], 1, { at: 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(cardT[0], 1, { at: 3.0, dur: 0.9, ease: ease.linear });
  tl.tween(cardE[1], 1, { at: 4.2, dur: 0.6, ease: ease.enter });
  tl.tween(cardT[1], 1, { at: 4.4, dur: 0.6, ease: ease.linear });
  tl.set(callN, 1, 5.4);
  tl.tween(sweeps[0], 1, { at: 5.6, dur: 1.4, ease: ease.linear });
  tl.tween(streams[0], 1, { at: 5.8, dur: 2.2, ease: ease.linear });
  tl.tween(connFlow, 1, { at: 5.8, dur: 2.2, ease: ease.linear });
  tl.hold(8.6, 1.0);

  // BEAT 1 — the whole transcript: Array<MessageParam>, every prior turn
  tl.caption({ at: 10.4, dur: 4.5, text: 'The request carries the whole messages array — every prior turn.' });
  tl.tween(cardE[2], 1, { at: 10.8, dur: 0.6, ease: ease.enter });
  tl.tween(cardT[2], 1, { at: 11.0, dur: 1.8, ease: ease.linear });
  tl.tween(cardE[3], 1, { at: 13.4, dur: 0.6, ease: ease.enter });
  tl.tween(cardT[3], 1, { at: 13.6, dur: 0.6, ease: ease.linear });
  tl.tween(braceU, 1, { at: 14.8, dur: 1.2, ease: ease.draw });
  tl.tween(ctxU, 1, { at: 16.4, dur: 1.0, ease: ease.draw });
  tl.hold(17.8, 1.0);

  // BEAT 2 — stateless: the full prompt ships, processed from scratch
  tl.caption({ at: 20.4, dur: 4.5, text: 'The API is stateless: the model reads the full prompt from scratch.' });
  tl.set(callN, 2, 21.0);
  tl.tween(statelessU, 1, { at: 21.2, dur: 0.5, ease: ease.pop });
  tl.tween(sweeps[1], 1, { at: 21.8, dur: 3.0, ease: ease.linear });
  tl.tween(streams[1], 1, { at: 22.2, dur: 3.2, ease: ease.linear });
  tl.tween(connFlow, 2, { at: 22.2, dur: 3.2, ease: ease.linear });
  tl.hold(26.2, 1.0);

  // BEAT 3 — the bill comes back: Usage.input_tokens counts the whole prompt
  tl.caption({ at: 30.4, dur: 4.5, text: 'Usage.input_tokens counts the entire prompt the model just read.' });
  tl.tween(cardE[4], 1, { at: 30.8, dur: 0.6, ease: ease.enter });
  tl.tween(cardT[4], 1, { at: 31.0, dur: 1.8, ease: ease.linear });
  tl.tween(usageU, 1, { at: 33.0, dur: 0.7, ease: ease.enter });
  tl.tween(bars[0], 1, { at: 33.8, dur: 0.5, ease: ease.pop });
  tl.tween(bars[1], 1, { at: 34.4, dur: 0.5, ease: ease.pop });
  tl.tween(tokCount, CALLS[1].inputTokens, { at: 34.4, dur: 1.6, ease: ease.linear });
  tl.tween(mathInU, 1, { at: 36.2, dur: 0.6, ease: ease.enter });
  tl.hold(37.4, 1.0);

  // BEAT 4 — it only ever grows: threshold marker + steeper per-call bill
  tl.caption({ at: 40.4, dur: 4.5, text: 'The transcript only grows — compaction waits at 100,000 tokens.' });
  tl.tween(cardE[5], 1, { at: 40.8, dur: 0.6, ease: ease.enter });
  tl.tween(cardT[5], 1, { at: 41.0, dur: 0.6, ease: ease.linear });
  tl.tween(cardE[6], 1, { at: 42.0, dur: 0.6, ease: ease.enter });
  tl.tween(cardT[6], 1, { at: 42.2, dur: 1.6, ease: ease.linear });
  tl.tween(thresholdU, 1, { at: 43.0, dur: 1.0, ease: ease.draw });
  tl.set(callN, 3, 44.0);
  tl.tween(sweeps[2], 1, { at: 44.2, dur: 2.4, ease: ease.linear });
  tl.tween(streams[2], 1, { at: 44.4, dur: 2.6, ease: ease.linear });
  tl.tween(connFlow, 3, { at: 44.4, dur: 2.6, ease: ease.linear });
  tl.tween(bars[2], 1, { at: 47.2, dur: 0.5, ease: ease.pop });
  tl.tween(tokCount, CALLS[2].inputTokens, { at: 47.2, dur: 0.8, ease: ease.linear });
  tl.tween(mathSumU, 1, { at: 48.0, dur: 0.6, ease: ease.enter });
  tl.hold(48.8, 1.0);

  // BEAT 5 — the same tokens, over and over: dim all but the identical prefix
  tl.caption({ at: 50.4, dur: 5.0, text: 'The same prefix, re-read from token zero on every call.' });
  tl.tween(dimU, 1, { at: 50.8, dur: 1.0, ease: ease.move });
  tl.tween(prefixSweep, 3, { at: 52.2, dur: 6.0, ease: ease.linear });
  tl.tween(mathPrefixU, 1, { at: 55.2, dur: 0.6, ease: ease.enter });
  tl.hold(58.8, 1.6);

  return {
    tl,
    appU,
    modelU,
    connU,
    connFlow,
    callN,
    cardE,
    cardT,
    braceU,
    ctxU,
    statelessU,
    sweeps,
    streams,
    usageU,
    bars,
    tokCount,
    mathInU,
    thresholdU,
    mathSumU,
    dimU,
    prefixSweep,
    mathPrefixU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

/** The model's read head sweeping down the transcript — over ALL the cards. */
function ReadSweep({ top, bottom, u, color = colors.ACCENT }: { top: number; bottom: number; u: number; color?: string }) {
  const uu = clamp01(u);
  if (uu <= 0 || uu >= 1) return null;
  const y = top + (bottom - top) * uu;
  return (
    <g>
      <rect x={CARD_X - 8} y={top - 4} width={CARD_W + 16} height={y - top + 4} rx={6} fill={color} opacity={0.07} />
      <line x1={CARD_X - 8} y1={y} x2={CARD_X + CARD_W + 8} y2={y} stroke={color} strokeWidth={2} opacity={0.85} />
      <circle cx={CARD_X + CARD_W + 8} cy={y} r={3.5} fill={color} opacity={0.9} />
    </g>
  );
}

/** Left bracket on the transcript: this whole stack is ONE messages array. */
function TranscriptBrace({ u, bottom, dim }: { u: number; bottom: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const top = CARD_TOP;
  const yEnd = top + (bottom - top) * uu;
  const x = CARD_X - 18;
  const mid = (top + yEnd) / 2;
  return (
    <g opacity={uu * (1 - 0.6 * clamp01(dim))}>
      <path d={`M ${x + 7} ${top} h -7 V ${yEnd} h 7`} fill="none" stroke={colors.MUTED} strokeWidth={1.5} />
      <text transform={`translate(${x - 8}, ${mid}) rotate(-90)`} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        {'Array<MessageParam>'}
      </text>
    </g>
  );
}

/** Usage — the per-call input_tokens chart, climbing steeper every turn. */
function UsagePanel({
  enter,
  barU,
  count,
  mathIn,
  mathSum,
  dim,
}: {
  enter: number;
  barU: number[];
  count: number;
  mathIn: number;
  mathSum: number;
  dim: number;
}) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const alpha = e * (1 - 0.75 * clamp01(dim));
  const { x, y, w, h } = PANEL;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={alpha}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={20} y={30} fill={colors.MUTED} fontSize={13}>
        Usage — input_tokens per call
      </text>
      <text x={w - 20} y={30} textAnchor="end" fill={colors.WARM} fontSize={15} fontWeight={700} fontFamily={mono} opacity={count > 1 ? 1 : 0}>
        {Math.round(count).toLocaleString()} tokens
      </text>
      <line x1={20} y1={BAR_BASE} x2={w - 20} y2={BAR_BASE} stroke={colors.GRID} strokeWidth={1.5} />
      {CALLS.map((call, i) => {
        const u = clamp01(barU[i]);
        if (u <= 0) return null;
        const bh = (call.inputTokens / MAX_INPUT) * BAR_MAX_H * u;
        const bx = BAR_XS[i];
        return (
          <g key={i}>
            <rect x={bx} y={BAR_BASE - bh} width={BAR_W} height={bh} rx={5} fill={colors.ACCENT} opacity={0.28 + 0.18 * i} />
            <rect x={bx} y={BAR_BASE - bh} width={BAR_W} height={bh} rx={5} fill="none" stroke={colors.ACCENT} strokeWidth={1.4} />
            <text x={bx + BAR_W / 2} y={BAR_BASE - bh - 8} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={mono} opacity={u}>
              {(call.inputTokens / 1000).toFixed(0)}k
            </text>
            <text x={bx + BAR_W / 2} y={BAR_BASE + 20} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={mono}>
              call {i + 1}
            </text>
          </g>
        );
      })}
      {mathIn > 0 && (
        <MathLabel tex={'\\texttt{input\\_tokens} = 28{,}000'} x={26} y={BAR_BASE + 44} fontSize={16} color={colors.WARM} opacity={clamp01(mathIn) * (mathSum > 0 ? 1 - clamp01(mathSum) : 1)} anchor="start" />
      )}
      {mathSum > 0 && (
        <MathLabel
          tex={'15\\text{k} + 28\\text{k} + 44\\text{k} = 87\\text{k}\\ \\text{tokens billed}'}
          x={26}
          y={BAR_BASE + 44}
          fontSize={16}
          color={colors.WARM}
          opacity={clamp01(mathSum)}
          anchor="start"
        />
      )}
    </g>
  );
}

/** Small status chip. */
function Chip({ x, y, text, u, color }: { x: number; y: number; text: string; u: number; color: string }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * 6.9 + 22;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * -6})`} opacity={uu}>
      <rect x={-w / 2} y={-12} width={w} height={24} rx={12} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fill={color} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const callN = Math.round(s.get(scene.callN));
  const enters = scene.cardE.map((ch) => s.get(ch));

  // the transcript's current extent (for the brace), from sampled enters only
  let stackBottom = CARD_TOP + 40;
  enters.forEach((e, i) => {
    if (e > 0.01) stackBottom = cardBottom(i);
  });

  // beat 5 — repeated passes over the identical prefix
  const ps = s.get(scene.prefixSweep);
  const prefixActive = ps > 0.001 && ps < 2.999;
  const passN = Math.min(3, Math.floor(ps) + 1);

  const ctxSegments = TURNS.map((turn, i) => ({
    label: turn.role === 'system' ? 'system' : turn.role,
    value: turn.tokens * clamp01(enters[i]),
    color: ROLE_COLOR[turn.role],
  }));
  const thresholdX = CTX.x + (THRESHOLD / CTX.capacity) * CTX.w;
  const thU = clamp01(s.get(scene.thresholdU)) * (1 - 0.6 * dim);

  return (
    <>
      {/* app → model — every call crosses this hop with the FULL prompt */}
      <ServiceNode {...APP} kind="client" label="your app" sublabel="Claude SDK" u={s.get(scene.appU)} dim={dim} />
      <ServiceNode {...MODEL} kind="external" label="model" sublabel="stateless" u={s.get(scene.modelU)} dim={dim} />
      <Connection from={{ x: APP.x + 62, y: APP.y }} to={{ x: MODEL.x - 62, y: MODEL.y }} u={s.get(scene.connU)} flow={s.get(scene.connFlow)} label="messages.create()" dim={dim} />
      <Chip x={(APP.x + MODEL.x) / 2} y={APP.y - 42} text={`call #${callN}`} u={callN > 0 ? 1 : 0} color={colors.ACCENT} />
      <Chip x={(APP.x + MODEL.x) / 2} y={APP.y + 46} text="stateless — processed from scratch" u={s.get(scene.statelessU) * (1 - 0.7 * dim)} color={colors.WARM} />

      {/* the transcript — the messages array, stacked */}
      <TranscriptBrace u={s.get(scene.braceU)} bottom={stackBottom} dim={dim} />
      {TURNS.map((turn, i) => (
        <MessageCard
          key={i}
          x={CARD_X}
          y={CARD_Y[i]}
          w={CARD_W}
          role={turn.role}
          text={turn.text}
          u={s.get(scene.cardT[i])}
          enter={enters[i]}
          dim={i > PREFIX_LAST ? dim : 0}
          glow={i <= PREFIX_LAST && prefixActive ? 0.35 : 0}
        />
      ))}

      {/* each call's read: a sweep over ALL prior cards + tokens to the model */}
      {CALLS.map((call, i) => {
        const region = { top: CARD_TOP, bottom: cardBottom(call.lastIdx) };
        const mid = (region.top + region.bottom) / 2;
        return (
          <g key={i}>
            <ReadSweep top={region.top} bottom={region.bottom} u={s.get(scene.sweeps[i])} />
            <TokenStream
              from={{ x: CARD_X + CARD_W + 14, y: mid }}
              to={{ x: MODEL.x - 30, y: MODEL.y + 34 }}
              u={s.get(scene.streams[i])}
              count={8 + i * 6}
              bend={-0.12}
              seed={11 + i}
            />
          </g>
        );
      })}

      {/* usage chart — the bill climbs steeper every turn */}
      <UsagePanel
        enter={s.get(scene.usageU)}
        barU={scene.bars.map((b) => s.get(b))}
        count={s.get(scene.tokCount)}
        mathIn={s.get(scene.mathInU)}
        mathSum={s.get(scene.mathSumU)}
        dim={dim}
      />

      {/* the context window filling as history grows */}
      <ContextBar
        x={CTX.x}
        y={CTX.y}
        w={CTX.w}
        capacity={CTX.capacity}
        segments={ctxSegments}
        reveal={s.get(scene.ctxU)}
        title="context window (messages array)"
        dim={dim}
      />
      {thU > 0 && (
        <g opacity={thU}>
          <line x1={thresholdX} y1={CTX.y - 4} x2={thresholdX} y2={CTX.y + 30} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={thresholdX + 8} y={CTX.y - 10} fill={colors.NEGATIVE} fontSize={11.5} fontFamily={mono}>
            DEFAULT_TOKEN_THRESHOLD = 100_000
          </text>
        </g>
      )}

      {/* beat 5 — the identical prefix, re-swept again and again */}
      {prefixActive && (
        <g>
          <ReadSweep top={CARD_TOP} bottom={cardBottom(PREFIX_LAST)} u={ps % 1} color={colors.WARM} />
          <text x={CARD_X + CARD_W + 24} y={CARD_TOP + 14} fill={colors.WARM} fontSize={13} fontWeight={700} fontFamily={mono}>
            pass {passN} / 3
          </text>
        </g>
      )}
      {dim > 0.01 && (
        <g opacity={clamp01(s.get(scene.mathPrefixU))}>
          <MathLabel tex={'\\text{same prefix} \\times 3'} x={780} y={340} fontSize={30} color={colors.WARM} anchor="middle" />
          <text x={780} y={382} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            re-read from token zero, every single call — caching targets exactly this
          </text>
        </g>
      )}
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/prompt-caching/chapter-1', beat: i }
export const vizScene = () => scene;
