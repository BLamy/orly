// Book scene — prompt-caching, chapter 4: "Reading the Usage".
// The `usage` object as a token receipt: three input buckets, three prices,
// the cumulative-cost crossover, and the one field that proves caching works.
// 7 beats = the chapter's 7 non-cover steps (captions define the beats).
import { MathLabel, Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { TokenStream } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------- layout ---
// 1280×720 stage; keep y ≳ 633 clear for captions.
const CARD = { x: 64, y: 118, w: 470, h: 252 };
const ROW_Y = (i: number) => 200 + i * 38; // the four usage fields
const VAL_X = CARD.x + CARD.w - 26; // right-aligned values
const BAR_X0 = 580; // cost-bar panel, right of the card
const PX = 0.022; // tokens → px (25,000 token-cost ≈ 550 px)

// Field metadata, in card order. mult = price multiplier per input token.
const FIELDS = [
  { key: 'input_tokens', color: colors.ACCENT, mult: 1, multTex: '\\times\\,1' },
  { key: 'cache_creation_input_tokens', color: colors.WARM, mult: 1.25, multTex: '\\times\\,1.25' },
  { key: 'cache_read_input_tokens', color: colors.POSITIVE, mult: 0.1, multTex: '\\times\\,0.1' },
  { key: 'output_tokens', color: colors.MUTED, mult: 0, multTex: '' },
] as const;

// Crossover chart: cumulative input cost (thousands of token-cost) over six
// turns of a 20k-token conversation. No cache: 20k × 1 every turn. Cached:
// 25k once (the 1.25× write), then 2k per turn (0.1× reads).
const NO_CACHE = [20, 40, 60, 80, 100, 120];
const CACHED = [25, 27, 29, 31, 33, 35];
const TURNS = NO_CACHE.length;
const CHART = { x0: 480, baseY: 545, groupW: 112, barW: 30, pxPerK: 2.7 };
const groupX = (t: number) => CHART.x0 + 40 + t * CHART.groupW;
// First turn where the cached cumulative total dips below no-cache: turn 2.
const CROSS_T = 1;

// -------------------------------------------------------------- timeline ---
export function buildScene() {
  const tl = new Timeline();
  const ch = {
    cardU: tl.channel('cardU', 0),
    // live values on the receipt (they count up, then flip cold → warm)
    vIn: tl.channel('vIn', 0),
    vWrite: tl.channel('vWrite', 0),
    vRead: tl.channel('vRead', 0),
    vOut: tl.channel('vOut', 0),
    flipU: tl.channel('flipU', 0), // call #1 (cold) → call #2 (warm) chip
    // row highlights + bar entrances (input, write, read)
    hlIn: tl.channel('hlIn', 0),
    hlWrite: tl.channel('hlWrite', 0),
    hlRead: tl.channel('hlRead', 0),
    rowInU: tl.channel('rowInU', 0),
    rowWriteU: tl.channel('rowWriteU', 0),
    rowReadU: tl.channel('rowReadU', 0),
    barsO: tl.channel('barsO', 1), // bar panel fade-out for the chart beat
    cardDim: tl.channel('cardDim', 0),
    // beat 4: total equation + crossover chart
    eqU: tl.channel('eqU', 0),
    chartU: tl.channel('chartU', 0),
    chartO: tl.channel('chartO', 1),
    pulseT: tl.channel('pulseT', 0),
    // beat 5: streaming MessageDeltaUsage
    deltaU: tl.channel('deltaU', 0),
    deltaO: tl.channel('deltaO', 1),
    streamU: tl.channel('streamU', 0),
    dvRead: tl.channel('dvRead', 0),
    dvOut: tl.channel('dvOut', 0),
    // beat 6: the verdict — glow the field you watch
    finaleU: tl.channel('finaleU', 0),
    glowT: tl.channel('glowT', 0),
  };

  // BEAT 0 — every Message carries usage: the receipt appears, values count up
  tl.caption({ at: 0.4, dur: 5, text: 'Every Message carries usage — the token receipt for that request.' });
  tl.tween(ch.cardU, 1, { at: 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(ch.vIn, 200, { at: 2.0, dur: 1.2, ease: ease.move });
  tl.tween(ch.vWrite, 20000, { at: 2.6, dur: 1.6, ease: ease.move });
  tl.tween(ch.vOut, 500, { at: 3.4, dur: 1.0, ease: ease.move });
  tl.hold(9.6, 0.9);

  // BEAT 1 — cache_creation_input_tokens: the 1.25× write, big when cold
  tl.caption({ at: 10.5, dur: 5, text: 'cache_creation_input_tokens: written to cache at 1.25× — big when cold.' });
  tl.tween(ch.hlWrite, 1, { at: 10.7, dur: 0.5, ease: ease.enter });
  tl.tween(ch.rowWriteU, 1, { at: 10.9, dur: 1.2, ease: ease.move });
  tl.hold(19.8, 1.2);

  // BEAT 2 — cache_read_input_tokens: the warm call flips the weight to 0.1×
  tl.caption({ at: 21, dur: 5, text: 'cache_read_input_tokens: served from cache at 0.1× — bigger is better.' });
  tl.tween(ch.hlWrite, 0.15, { at: 21.2, dur: 0.6, ease: ease.move });
  tl.tween(ch.hlRead, 1, { at: 21.2, dur: 0.5, ease: ease.enter });
  tl.tween(ch.rowReadU, 1, { at: 21.4, dur: 1.0, ease: ease.move });
  tl.tween(ch.flipU, 1, { at: 22.6, dur: 0.6, ease: ease.move });
  tl.tween(ch.vWrite, 0, { at: 23.0, dur: 1.2, ease: ease.move });
  tl.tween(ch.vRead, 20000, { at: 23.0, dur: 1.4, ease: ease.move });
  tl.hold(30.8, 1.2);

  // BEAT 3 — input_tokens: genuinely new tokens at the plain 1× rate
  tl.caption({ at: 32, dur: 5, text: 'input_tokens: the genuinely new tokens, at the normal 1× rate.' });
  tl.tween(ch.hlRead, 0.15, { at: 32.2, dur: 0.6, ease: ease.move });
  tl.tween(ch.hlIn, 1, { at: 32.2, dur: 0.5, ease: ease.enter });
  tl.tween(ch.rowInU, 1, { at: 32.4, dur: 0.9, ease: ease.move });
  tl.hold(40.8, 1.2);

  // BEAT 4 — the sum, and the crossover: steep no-cache vs nearly-flat cached
  tl.caption({ at: 42, dur: 5.5, text: 'Total input = new + written + read — caching shifts weight to the cheap bucket.' });
  tl.tween(ch.hlIn, 0.15, { at: 42.2, dur: 0.6, ease: ease.move });
  tl.tween(ch.barsO, 0, { at: 42.2, dur: 0.8, ease: ease.move });
  tl.tween(ch.cardDim, 1, { at: 42.2, dur: 0.8, ease: ease.move });
  tl.tween(ch.eqU, 1, { at: 43.0, dur: 0.8, ease: ease.enter });
  tl.tween(ch.chartU, 1, { at: 43.6, dur: 3.6, ease: ease.move });
  tl.tween(ch.pulseT, 1, { at: 47.4, dur: 6, ease: ease.linear });
  tl.hold(53.2, 0.8);

  // BEAT 5 — streaming: MessageDeltaUsage reports the same fields, cumulatively
  tl.caption({ at: 54, dur: 5, text: 'Streaming? MessageDeltaUsage reports the same fields, cumulatively.' });
  tl.tween(ch.chartO, 0, { at: 54.2, dur: 0.7, ease: ease.move });
  tl.tween(ch.eqU, 0, { at: 54.2, dur: 0.7, ease: ease.move });
  tl.tween(ch.deltaU, 1, { at: 55.0, dur: 0.7, ease: ease.enter });
  tl.tween(ch.streamU, 1, { at: 55.6, dur: 8, ease: ease.linear });
  tl.tween(ch.dvRead, 20000, { at: 55.8, dur: 7, ease: ease.linear });
  tl.tween(ch.dvOut, 500, { at: 56.5, dur: 6.5, ease: ease.linear });
  tl.hold(64.8, 1.2);

  // BEAT 6 — write once, read forever: the field you watch glows
  tl.caption({ at: 66, dur: 6, text: "Write once, read forever — cache_read_input_tokens > 0 means it's working." });
  tl.tween(ch.deltaO, 0, { at: 66.2, dur: 0.7, ease: ease.move });
  tl.tween(ch.cardDim, 0, { at: 66.4, dur: 0.8, ease: ease.move });
  tl.tween(ch.hlRead, 1, { at: 66.8, dur: 0.6, ease: ease.enter });
  tl.tween(ch.finaleU, 1, { at: 67.0, dur: 0.8, ease: ease.enter });
  tl.tween(ch.glowT, 1, { at: 67.2, dur: 9, ease: ease.linear });
  tl.hold(77.5, 1.0);

  return { tl, ch };
}

const scene = buildScene();

// ---------------------------------------------------------------- render ---
export function Render({ s }: { s: SceneState }) {
  const { ch } = scene;
  const cardU = s.get(ch.cardU);
  const cardAlpha = cardU * (1 - 0.65 * clamp01(s.get(ch.cardDim)));
  const values = [s.get(ch.vIn), s.get(ch.vWrite), s.get(ch.vRead), s.get(ch.vOut)];
  const hl = [s.get(ch.hlIn), s.get(ch.hlWrite), s.get(ch.hlRead), 0];
  const rowU = [s.get(ch.rowInU), s.get(ch.rowWriteU), s.get(ch.rowReadU)];
  const flipU = clamp01(s.get(ch.flipU));
  const barsO = s.get(ch.barsO);
  const eqU = s.get(ch.eqU);
  const chartU = clamp01(s.get(ch.chartU));
  const chartO = s.get(ch.chartO);
  const pulseP = (clamp01(s.get(ch.pulseT)) * 3) % 1; // three pure ping rings
  const deltaA = s.get(ch.deltaU) * s.get(ch.deltaO);
  const streamU = s.get(ch.streamU);
  const finaleU = s.get(ch.finaleU);
  const glowP = (clamp01(s.get(ch.glowT)) * 3) % 1;

  return (
    <>
      {/* ------------------------------------------- the usage receipt --- */}
      {cardU > 0.002 && (
        <g transform={`translate(0, ${(1 - cardU) * 14})`} opacity={cardAlpha}>
          <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={10} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.4} strokeOpacity={0.5} />
          <text x={CARD.x + 16} y={CARD.y + 26} fill={colors.MUTED} fontSize={12} fontWeight={700} fontFamily={MONO}>
            Message
          </text>
          {/* cold ↔ warm call chip (top right), crossfaded on the flip */}
          <g fontFamily={MONO} fontSize={12} fontWeight={700} textAnchor="end">
            <text x={CARD.x + CARD.w - 16} y={CARD.y + 26} fill={colors.WARM} opacity={cardU * (1 - flipU)}>
              call #1 · cold
            </text>
            <text x={CARD.x + CARD.w - 16} y={CARD.y + 26} fill={colors.POSITIVE} opacity={cardU * flipU}>
              call #2 · warm
            </text>
          </g>
          <text x={CARD.x + 16} y={ROW_Y(0) - 32} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
            {'"usage": {'}
          </text>
          {FIELDS.map((f, i) => {
            const h = clamp01(hl[i]);
            const glowRead = i === 2 ? finaleU : 0;
            return (
              <g key={f.key}>
                {h > 0.002 && (
                  <rect x={CARD.x + 10} y={ROW_Y(i) - 20} width={CARD.w - 20} height={28} rx={6} fill={f.color} opacity={0.14 * h} />
                )}
                {glowRead > 0.002 && (
                  <rect
                    x={CARD.x + 7}
                    y={ROW_Y(i) - 23}
                    width={CARD.w - 14}
                    height={34}
                    rx={8}
                    fill="none"
                    stroke={colors.POSITIVE}
                    strokeWidth={2}
                    opacity={glowRead * (0.45 + 0.4 * Math.sin(glowP * Math.PI))}
                  />
                )}
                <text x={CARD.x + 30} y={ROW_Y(i)} fill={h > 0.3 ? f.color : colors.TEXT} fontSize={15} fontFamily={MONO} opacity={0.6 + 0.4 * h}>
                  {`"${f.key}":`}
                </text>
                <text x={VAL_X} y={ROW_Y(i)} textAnchor="end" fill={h > 0.3 ? f.color : colors.TEXT} fontSize={15} fontWeight={600} fontFamily={MONO}>
                  {fmt(values[i])}
                </text>
              </g>
            );
          })}
          <text x={CARD.x + 16} y={ROW_Y(3) + 32} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
            {'}'}
          </text>
        </g>
      )}

      {/* --------------------------- cost bars: tokens (ghost) × price --- */}
      {barsO > 0.002 && (
        <g opacity={barsO}>
          {([1, 2, 0] as const).map((i) => {
            // bars enter in narration order: write, read, input
            const u = clamp01(rowU[i]);
            if (u <= 0.002) return null;
            const f = FIELDS[i];
            const v = values[i];
            const ghostW = v * PX;
            const costW = v > 0 ? Math.max(3, v * f.mult * PX) : 0;
            const y = ROW_Y(i) - 13;
            return (
              <g key={f.key} opacity={u}>
                <rect x={BAR_X0} y={y} width={ghostW * u} height={16} rx={4} fill={colors.MUTED} opacity={0.22} />
                <rect x={BAR_X0} y={y} width={costW * u} height={16} rx={4} fill={f.color} opacity={0.9} />
                <MathLabel tex={f.multTex} x={BAR_X0 + ghostW + 18} y={y + 8} fontSize={17} color={f.color} opacity={u} anchor="start" />
                <text x={1218} y={y + 13} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={u * 0.9}>
                  {v > 0 ? `≈ ${fmt(v * f.mult)} billed` : '0 billed'}
                </text>
              </g>
            );
          })}
          {clamp01(rowU[1]) > 0.5 && (
            <text x={BAR_X0} y={ROW_Y(0) - 30} fill={colors.MUTED} fontSize={13} opacity={clamp01(rowU[1] * 2 - 1) * 0.9}>
              faint bar = tokens · solid bar = what you pay
            </text>
          )}
        </g>
      )}

      {/* --------------------- beat 4: the sum + the crossover chart --- */}
      {eqU > 0.002 && chartO > 0.002 && (
        <MathLabel
          tex="\underbrace{200}_{\times 1}\;+\;\underbrace{0}_{\times 1.25}\;+\;\underbrace{20{,}000}_{\times 0.1}\;=\;20{,}200\ \text{input tokens}"
          x={830}
          y={112}
          fontSize={21}
          opacity={eqU * chartO}
          anchor="middle"
        />
      )}
      {chartU > 0.002 && chartO > 0.002 && (
        <g opacity={chartO}>
          {/* baseline */}
          <line x1={CHART.x0} y1={CHART.baseY} x2={CHART.x0 + 60 + TURNS * CHART.groupW} y2={CHART.baseY} stroke={colors.MUTED} strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray={`${chartU * 800} 800`} />
          {NO_CACHE.map((nc, t) => {
            const u = clamp01((chartU - t * 0.1) / 0.4);
            if (u <= 0) return null;
            const gx = groupX(t);
            const hN = nc * CHART.pxPerK * u;
            const hC = CACHED[t] * CHART.pxPerK * u;
            return (
              <g key={t}>
                <rect x={gx} y={CHART.baseY - hN} width={CHART.barW} height={hN} rx={4} fill={colors.NEGATIVE} opacity={0.8} />
                <rect x={gx + CHART.barW + 5} y={CHART.baseY - hC} width={CHART.barW} height={hC} rx={4} fill={colors.POSITIVE} opacity={0.85} />
                <text x={gx + CHART.barW + 2.5} y={CHART.baseY + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={u}>
                  {`turn ${t + 1}`}
                </text>
              </g>
            );
          })}
          {/* legend */}
          <g opacity={clamp01(chartU * 3)} fontSize={14}>
            <rect x={CHART.x0 + 6} y={166} width={14} height={14} rx={3} fill={colors.NEGATIVE} opacity={0.8} />
            <text x={CHART.x0 + 27} y={178} fill={colors.TEXT}>no cache — cumulative input cost</text>
            <rect x={CHART.x0 + 6} y={190} width={14} height={14} rx={3} fill={colors.POSITIVE} opacity={0.85} />
            <text x={CHART.x0 + 27} y={202} fill={colors.TEXT}>cached — write once, cheap reads</text>
          </g>
          {/* first call costs more (the write) */}
          <text x={groupX(0) + CHART.barW + 2.5} y={CHART.baseY - CACHED[0] * CHART.pxPerK - 12} textAnchor="middle" fill={colors.WARM} fontSize={13} opacity={clamp01(chartU * 4 - 2.4)}>
            first call costs more (the write)
          </text>
          {/* the crossover point, pinging */}
          {chartU > 0.55 && (
            <g>
              {(() => {
                const cx = groupX(CROSS_T) + CHART.barW + 5 + CHART.barW / 2;
                const cy = CHART.baseY - CACHED[CROSS_T] * CHART.pxPerK;
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={5} fill={colors.POSITIVE} />
                    <circle cx={cx} cy={cy} r={7 + 16 * pulseP} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={(1 - pulseP) * 0.8} />
                    <text x={cx + 16} y={cy - 8} fill={colors.POSITIVE} fontSize={13} opacity={clamp01(chartU * 4 - 3)}>
                      break-even: first reuse
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </g>
      )}

      {/* ------------------- beat 5: streaming MessageDeltaUsage --- */}
      {deltaA > 0.002 && (
        <g opacity={deltaA} transform={`translate(0, ${(1 - clamp01(s.get(ch.deltaU))) * 14})`}>
          <TokenStream from={{ x: 1190, y: 128 }} to={{ x: 930, y: 218 }} u={streamU} count={14} color={colors.POSITIVE} opacity={deltaA} />
          <text x={1190} y={112} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
            stream
          </text>
          <rect x={690} y={218} width={480} height={172} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} strokeOpacity={0.5} />
          <text x={706} y={244} fill={colors.POSITIVE} fontSize={12} fontWeight={700} fontFamily={MONO}>
            message_delta · usage (cumulative)
          </text>
          <text x={706} y={286} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
            {'"cache_read_input_tokens":'}
          </text>
          <text x={1150} y={286} textAnchor="end" fill={colors.POSITIVE} fontSize={15} fontWeight={600} fontFamily={MONO}>
            {fmt(s.get(ch.dvRead))}
          </text>
          <text x={706} y={324} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
            {'"output_tokens":'}
          </text>
          <text x={1150} y={324} textAnchor="end" fill={colors.TEXT} fontSize={15} fontWeight={600} fontFamily={MONO}>
            {fmt(s.get(ch.dvOut))}
          </text>
          <text x={706} y={364} fill={colors.MUTED} fontSize={13} opacity={0.9}>
            same fields as Usage — running totals as the response arrives
          </text>
        </g>
      )}

      {/* ------------------------------- beat 6: the field you watch --- */}
      {finaleU > 0.002 && (
        <g opacity={finaleU}>
          <line x1={CARD.x + CARD.w + 6} y1={ROW_Y(2) - 6} x2={640} y2={252} stroke={colors.POSITIVE} strokeWidth={1.5} strokeOpacity={0.6} />
          <MathLabel tex="\texttt{cache\_read\_input\_tokens} > 0" x={910} y={252} fontSize={26} color={colors.POSITIVE} opacity={finaleU} anchor="middle" />
          <text x={910} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={600}>
            write once — read forever
          </text>
          <text x={910} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            the first call pays the 1.25× write; every later call is ~10× cheaper reads
          </text>
          <text x={910} y={366} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            watch this field to confirm caching is actually working
          </text>
        </g>
      )}
    </>
  );
}

/** The module-scope scene; the book player samples its timeline per beat. */
export const vizScene = () => scene;
