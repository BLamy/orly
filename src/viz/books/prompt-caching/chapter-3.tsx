// Prompt Caching — Chapter 3: "Hit, Miss, and the Five-Minute Clock"
// Prefix matching, the 5-minute TTL, and invalidation, told over one row of
// abstract token chips. 7 beats ↔ the chapter's 7 non-cover storyboard steps.
import { interpolateRgb } from 'd3';
import { Timeline, colors, ease, mulberry32 } from '../../core';
import type { SceneState } from '../../core';
import { NodeBadge, TimerArc, Vec } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

// ── layout (1280×720 stage; bottom ~12% — y ≳ 633 — stays clear) ──────────
const N = 27; // 24-chip cached prefix + 3-chip new turn
const PREFIX_N = 24;
const CHANGED = 8; // the "one early token changed" chip (inside `system`)
const CHIP = { w: 34, h: 34, gap: 4 };
const ROW_Y = 250;
const X0 = 640 - (N * (CHIP.w + CHIP.gap) - CHIP.gap) / 2; // ≈ 129
const chipX = (i: number) => X0 + i * (CHIP.w + CHIP.gap) + CHIP.w / 2;

const SEGMENTS = [
  { label: 'tools', from: 0, to: 5 },
  { label: 'system', from: 6, to: 11 },
  { label: 'history', from: 12, to: 23 },
  { label: 'new turn', from: 24, to: 26 },
];
const BREAKPOINTS = [5, 11, 23]; // cache_control boundaries (after chip i)
const LONGEST_BP = 23; // the longest matching breakpoint — end of the prefix

const TTL_CLOCK = { cx: 170, cy: 455, r: 34 };
const VERDICT = { x: 380, y: 452, w: 250, h: 42 };
const MODEL = { x: 800, y: 455 };
const USAGE = { x: 990, y: 452, w: 130, h: 42 };
const COST_W = { x: 450, y: 565, w: 380, h: 52 };
const COST_R = { x: 840, y: 565, w: 380, h: 52 };
const RECAP_Y = 622;
const BRACKET_Y = ROW_Y + CHIP.h / 2 + 10;

// deterministic 2-char pseudo-token labels (mono chips stay abstract)
const rand = mulberry32(1103);
const TOKENS = Array.from({ length: N }, () =>
  Math.floor(rand() * 1296).toString(36).padStart(2, '0'),
);
const CHANGED_TOKEN = 'q7'; // what chip 8 mutates into in the miss case

const mmss = (u: number) => {
  const sec = Math.max(0, Math.round(u * 300));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

// ── timeline ───────────────────────────────────────────────────────────────
export function buildScene() {
  const tl = new Timeline();

  const rowU = tl.channel('rowU', 0); // staggered chip entrance
  const newGlow = tl.channel('newGlow', 0); // pulse on the 3 new-turn chips
  const segU = tl.channel('segU', 0); // segment labels + breakpoint ticks
  const sweep1 = tl.channel('sweep1', 0); // beat 1: match pointer, POSITIVE trail
  const s1Vis = tl.channel('s1Vis', 0); // pointer visibility for sweep 1
  const bpGlow = tl.channel('bpGlow', 0); // longest-breakpoint highlight
  const hitU = tl.channel('hitU', 0); // HIT verdict chip
  const readTint = tl.channel('readTint', 0); // prefix settles into cheap tint
  const modelU = tl.channel('modelU', 0);
  const sendU = tl.channel('sendU', 0); // new turn → model arrow
  const usageU = tl.channel('usageU', 0);
  const bracketU = tl.channel('bracketU', 0); // "cached prefix" bracket
  const arcIn = tl.channel('arcIn', 0); // TTL clock entrance
  const ttl = tl.channel('ttl', 1); // remaining TTL fraction (1 = 5:00)
  const refreshPulse = tl.channel('refreshPulse', 0); // ring pop on refresh
  const writeU = tl.channel('writeU', 0); // 1.25× cost chip
  const warmPulse = tl.channel('warmPulse', 0); // WARM wash over prefix (write)
  const readU = tl.channel('readU', 0); // 0.1× cost chip
  const grayU = tl.channel('grayU', 0); // expired prefix grays out
  const missU = tl.channel('missU', 0); // MISS (expired) verdict chip
  const sweep2 = tl.channel('sweep2', 0); // WARM full-row re-write sweep
  const s2Vis = tl.channel('s2Vis', 0);
  const changedU = tl.channel('changedU', 0); // chip 8 mutates, NEGATIVE flash
  const sweep3 = tl.channel('sweep3', 0); // pointer stops dead at chip 8
  const s3Vis = tl.channel('s3Vis', 0);
  const stopFlash = tl.channel('stopFlash', 0); // NEGATIVE flash at the stop
  const cascade = tl.channel('cascade', 0); // everything after 8 dims
  const miss2U = tl.channel('miss2U', 0); // MISS (invalidated) verdict chip
  const invalidU = tl.channel('invalidU', 0); // "everything after…" label
  const recapU = tl.channel('recapU', 0); // rule-of-thumb recap

  // BEAT 0 — the same prefix comes back, plus one new turn
  tl.caption({ at: 0.3, dur: 4.6, text: 'A second create() arrives — same tools, system, and history, plus one new turn.' });
  tl.tween(rowU, 1, { at: 0.5, dur: 1.8, ease: ease.linear });
  tl.tween(newGlow, 1, { at: 2.6, dur: 0.5, ease: ease.pop });
  tl.tween(newGlow, 0.35, { at: 4.2, dur: 0.8, ease: ease.move });
  tl.hold(5.0, 2.5);

  // BEAT 1 — scan for the longest matching prefix breakpoint
  tl.caption({ at: 7.5, dur: 4.6, text: 'The API scans for the longest matching prefix at your cache_control breakpoints.' });
  tl.tween(segU, 1, { at: 7.7, dur: 1.2, ease: ease.draw });
  tl.tween(s1Vis, 1, { at: 9.0, dur: 0.3, ease: ease.enter });
  tl.tween(sweep1, 1, { at: 9.2, dur: 2.8, ease: ease.linear });
  tl.tween(bpGlow, 1, { at: 12.0, dur: 0.5, ease: ease.pop });
  tl.tween(s1Vis, 0, { at: 13.0, dur: 0.6, ease: ease.move });
  tl.hold(13.6, 1.4);

  // BEAT 2 — HIT: read the prefix from cache; only the new turn goes to the model
  tl.caption({ at: 15.0, dur: 4.6, text: 'Hit: the prefix is read from cache — only the new turn reaches the model.' });
  tl.tween(hitU, 1, { at: 15.4, dur: 0.5, ease: ease.pop });
  tl.tween(readTint, 1, { at: 15.6, dur: 1.0, ease: ease.move });
  tl.tween(modelU, 1, { at: 16.4, dur: 0.6, ease: ease.enter });
  tl.tween(sendU, 1, { at: 17.0, dur: 1.2, ease: ease.draw });
  tl.tween(usageU, 1, { at: 18.6, dur: 0.5, ease: ease.pop });
  tl.hold(19.1, 3.4);

  // BEAT 3 — the cached prefix carries a 5-minute clock; a hit refreshes it
  tl.caption({ at: 22.5, dur: 4.6, text: 'A warm read is ~10× cheaper, and it refreshes the five-minute TTL.' });
  tl.tween(bracketU, 1, { at: 22.8, dur: 1.2, ease: ease.draw });
  tl.tween(arcIn, 1, { at: 24.0, dur: 0.6, ease: ease.enter });
  tl.tween(ttl, 0.55, { at: 24.6, dur: 3.6, ease: ease.linear }); // clock drains…
  tl.tween(ttl, 1, { at: 28.4, dur: 0.5, ease: ease.pop }); // …a hit snaps it full
  tl.tween(refreshPulse, 1, { at: 28.4, dur: 0.45, ease: ease.enter });
  tl.tween(refreshPulse, 0, { at: 28.9, dur: 0.7, ease: ease.move });
  tl.hold(29.6, 1.4);

  // BEAT 4 — the write price: ~1.25×, cache_creation_input_tokens
  tl.caption({ at: 31.0, dur: 4.6, text: 'The first write costs ~1.25× — reported as cache_creation_input_tokens.' });
  tl.tween(writeU, 1, { at: 31.4, dur: 0.5, ease: ease.pop });
  tl.tween(warmPulse, 1, { at: 31.8, dur: 0.8, ease: ease.enter });
  tl.tween(warmPulse, 0, { at: 33.6, dur: 1.0, ease: ease.move });
  tl.hold(34.6, 3.9);

  // BEAT 5 — the read price: ~0.1×, cache_read_input_tokens (and another refresh)
  tl.caption({ at: 38.5, dur: 4.2, text: 'Each read costs ~0.1× — reported as cache_read_input_tokens.' });
  tl.tween(readU, 1, { at: 38.9, dur: 0.5, ease: ease.pop });
  tl.tween(ttl, 0.7, { at: 39.2, dur: 2.4, ease: ease.linear });
  tl.tween(ttl, 1, { at: 41.8, dur: 0.5, ease: ease.pop });
  tl.tween(refreshPulse, 1, { at: 41.8, dur: 0.45, ease: ease.enter });
  tl.tween(refreshPulse, 0, { at: 42.3, dur: 0.7, ease: ease.move });
  tl.hold(43.0, 3.0);

  // BEAT 6 — the two ways to miss: idle past the TTL, or change the prefix
  tl.caption({ at: 46.0, dur: 6.5, text: 'Idle past 5:00, or change one early token, and you miss — and pay to re-write.' });
  tl.tween(hitU, 0, { at: 46.4, dur: 0.5, ease: ease.move });
  tl.tween(ttl, 0, { at: 46.4, dur: 3.0, ease: ease.linear }); // (a) the clock runs out
  tl.tween(grayU, 1, { at: 49.4, dur: 0.8, ease: ease.move }); // …the entry is gone
  tl.tween(missU, 1, { at: 49.8, dur: 0.5, ease: ease.pop });
  tl.tween(s2Vis, 1, { at: 50.4, dur: 0.3, ease: ease.enter });
  tl.tween(sweep2, 1, { at: 50.6, dur: 2.0, ease: ease.linear }); // full-price re-write
  tl.tween(s2Vis, 0, { at: 53.8, dur: 0.8, ease: ease.move });
  tl.tween(grayU, 0, { at: 54.2, dur: 0.7, ease: ease.move }); // reset for case (b)
  tl.tween(missU, 0, { at: 54.2, dur: 0.5, ease: ease.move });
  tl.tween(changedU, 1, { at: 55.4, dur: 0.5, ease: ease.pop }); // (b) one token mutates
  tl.tween(s3Vis, 1, { at: 55.8, dur: 0.3, ease: ease.enter });
  tl.tween(sweep3, 1, { at: 56.0, dur: 1.2, ease: ease.linear }); // pointer stops dead
  tl.tween(stopFlash, 1, { at: 57.2, dur: 0.5, ease: ease.pop });
  tl.tween(cascade, 1, { at: 57.6, dur: 1.4, ease: ease.move }); // all that follows dims
  tl.tween(invalidU, 1, { at: 57.8, dur: 0.6, ease: ease.enter });
  tl.tween(miss2U, 1, { at: 58.2, dur: 0.5, ease: ease.pop });
  tl.tween(recapU, 1, { at: 60.2, dur: 0.7, ease: ease.enter });
  tl.hold(60.9, 1.6);

  return {
    tl, rowU, newGlow, segU, sweep1, s1Vis, bpGlow, hitU, readTint, modelU,
    sendU, usageU, bracketU, arcIn, ttl, refreshPulse, writeU, warmPulse,
    readU, grayU, missU, sweep2, s2Vis, changedU, sweep3, s3Vis, stopFlash,
    cascade, miss2U, invalidU, recapU,
  };
}

const scene = buildScene();

// ── render helpers (pure functions of sampled values) ──────────────────────
const posMix = interpolateRgb(colors.MUTED, colors.POSITIVE);
const warmMix = interpolateRgb(colors.MUTED, colors.WARM);
const arcColor = (u: number) => interpolateRgb(colors.NEGATIVE, colors.POSITIVE)(clamp01((u - 0.15) / 0.5));

function VerdictChip({ x, y, w, h, text, color, u }: { x: number; y: number; w: number; h: number; text: string; color: string; u: number }) {
  if (u <= 0.002) return null;
  const v = clamp01(u);
  return (
    <g opacity={v} transform={`translate(${x}, ${y}) scale(${0.85 + 0.15 * u})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={2} />
      <text textAnchor="middle" y={6} fill={color} fontSize={18} fontWeight={600}>{text}</text>
    </g>
  );
}

function Pointer({ x, color, u }: { x: number; color: string; u: number }) {
  if (u <= 0.002) return null;
  const top = ROW_Y - CHIP.h / 2 - 20;
  return (
    <g opacity={clamp01(u)}>
      <path d={`M ${x - 8} ${top} L ${x + 8} ${top} L ${x} ${top + 12} Z`} fill={color} />
    </g>
  );
}

function renderFrame(s: SceneState) {
  const rowU = clamp01(s.get(scene.rowU));
  const newGlow = clamp01(s.get(scene.newGlow));
  const segU = clamp01(s.get(scene.segU));
  const sweep1 = clamp01(s.get(scene.sweep1));
  const s1Vis = clamp01(s.get(scene.s1Vis));
  const bpGlow = clamp01(s.get(scene.bpGlow));
  const readTint = clamp01(s.get(scene.readTint));
  const warmPulse = clamp01(s.get(scene.warmPulse));
  const grayU = clamp01(s.get(scene.grayU));
  const sweep2 = clamp01(s.get(scene.sweep2));
  const s2Vis = clamp01(s.get(scene.s2Vis));
  const changedU = clamp01(s.get(scene.changedU));
  const sweep3 = clamp01(s.get(scene.sweep3));
  const s3Vis = clamp01(s.get(scene.s3Vis));
  const stopFlash = clamp01(s.get(scene.stopFlash));
  const cascade = clamp01(s.get(scene.cascade));
  const bracketU = clamp01(s.get(scene.bracketU));
  const arcIn = clamp01(s.get(scene.arcIn));
  const ttl = clamp01(s.get(scene.ttl));
  const refreshPulse = clamp01(s.get(scene.refreshPulse));
  const invalidU = clamp01(s.get(scene.invalidU));
  const recapU = clamp01(s.get(scene.recapU));

  // pointer x positions — pure functions of the sweep channels
  const p1x = chipX(0) + sweep1 * (chipX(LONGEST_BP) - chipX(0));
  const p2x = chipX(0) + sweep2 * (chipX(N - 1) - chipX(0));
  const p3x = chipX(0) + sweep3 * (chipX(CHANGED) - chipX(0));

  return (
    <g>
      {/* ── segment labels + cache_control breakpoints ── */}
      {SEGMENTS.map((seg) => {
        const mid = (chipX(seg.from) + chipX(seg.to)) / 2;
        const isNew = seg.from >= PREFIX_N;
        return (
          <text key={seg.label} x={mid} y={ROW_Y - CHIP.h / 2 - 32} textAnchor="middle"
            fill={isNew ? colors.WARM : colors.MUTED} fontSize={15} opacity={segU * (isNew ? 1 : 0.9)}>
            {seg.label}
          </text>
        );
      })}
      {BREAKPOINTS.map((b) => {
        const x = (chipX(b) + chipX(b + 1)) / 2;
        const isLongest = b === LONGEST_BP;
        const glow = isLongest ? bpGlow : 0;
        return (
          <g key={`bp${b}`} opacity={segU}>
            <line x1={x} y1={ROW_Y - CHIP.h / 2 - 8} x2={x} y2={ROW_Y + CHIP.h / 2 + 8}
              stroke={isLongest ? posMix(glow) : colors.MUTED} strokeWidth={isLongest ? 2 + glow : 1.5}
              strokeDasharray="4 3" opacity={0.5 + 0.5 * glow} />
            {isLongest && glow > 0.02 && (
              <text x={x} y={ROW_Y - CHIP.h / 2 - 14} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} opacity={glow}>
                cache_control · longest match
              </text>
            )}
          </g>
        );
      })}

      {/* ── the token chips ── */}
      {TOKENS.map((tok, i) => {
        const u = clamp01((rowU * (N + 4) - i) / 4); // staggered entrance
        if (u <= 0) return null;
        const isNew = i >= PREFIX_N;
        const isChanged = i === CHANGED && changedU > 0.02;

        // match trail (beat 1) + settled cheap tint (beat 2+)
        const matched = clamp01(sweep1 * PREFIX_N - i);
        const pos = isNew ? 0 : Math.max(matched * (0.4 + 0.6 * s1Vis), readTint * 0.8);
        // WARM washes: write pulse (beat 4) + full-price re-write sweep (beat 6a)
        const warm = isNew ? 0 : Math.max(warmPulse, clamp01(sweep2 * N - i) * s2Vis);
        // dims: expiry gray (6a) + invalidation cascade after the changed chip (6b)
        const casc = !isNew && i > CHANGED ? clamp01(cascade * 1.6 - ((i - CHANGED) / (PREFIX_N - CHANGED)) * 0.6) : 0;
        const dim = Math.max(grayU * 0.72, casc * 0.7);

        let stroke = posMix(pos);
        if (warm > 0.02) stroke = warmMix(Math.max(warm, pos * 0.3));
        if (isNew) stroke = warmMix(0.45 + 0.55 * newGlow);
        if (isChanged) stroke = colors.NEGATIVE;

        const scale = (0.7 + 0.3 * u) * (isChanged ? 1 + 0.12 * changedU : 1);
        return (
          <g key={i} opacity={u * (1 - dim)} transform={`translate(${chipX(i)}, ${ROW_Y}) scale(${scale})`}>
            <rect x={-CHIP.w / 2} y={-CHIP.h / 2} width={CHIP.w} height={CHIP.h} rx={7}
              fill={colors.PANEL} stroke={stroke} strokeWidth={isChanged ? 2.5 : 1.5} />
            <text y={6} textAnchor="middle" fill={stroke} fontSize={15}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
              {isChanged && changedU > 0.5 ? CHANGED_TOKEN : tok}
            </text>
          </g>
        );
      })}

      {/* changed-chip NEGATIVE flash ring + dead-stop flash (beat 6b) */}
      {Math.max(changedU, stopFlash) > 0.02 && (
        <rect x={chipX(CHANGED) - CHIP.w / 2 - 6} y={ROW_Y - CHIP.h / 2 - 6}
          width={CHIP.w + 12} height={CHIP.h + 12} rx={10} fill="none"
          stroke={colors.NEGATIVE} strokeWidth={3}
          opacity={0.9 * Math.max(changedU * 0.7, stopFlash)} />
      )}

      {/* match pointers — one per sweep, each a pure function of its channel */}
      <Pointer x={p1x} color={colors.POSITIVE} u={s1Vis} />
      <Pointer x={p2x} color={colors.WARM} u={s2Vis} />
      <Pointer x={p3x} color={colors.NEGATIVE} u={s3Vis} />

      {/* ── "cached prefix" bracket (beat 3) ── */}
      {bracketU > 0.002 && (
        <g opacity={bracketU}>
          <path
            d={`M ${chipX(0) - CHIP.w / 2} ${BRACKET_Y} v 8 H ${chipX(PREFIX_N - 1) + CHIP.w / 2} v -8`}
            fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={(chipX(0) + chipX(PREFIX_N - 1)) / 2} y={BRACKET_Y + 28} textAnchor="middle"
            fill={colors.ACCENT} fontSize={14}>
            cached prefix — tools → system → history
          </text>
        </g>
      )}

      {/* invalidation callout (beat 6b) */}
      {invalidU > 0.002 && (
        <text x={chipX(CHANGED)} y={BRACKET_Y + 52} textAnchor="middle" fill={colors.NEGATIVE}
          fontSize={15} fontWeight={600} opacity={invalidU}>
          one changed token — everything after it is invalidated
        </text>
      )}

      {/* ── the five-minute clock ── */}
      {arcIn > 0.002 && (
        <g opacity={arcIn}>
          <TimerArc cx={TTL_CLOCK.cx} cy={TTL_CLOCK.cy} r={TTL_CLOCK.r} u={ttl} color={arcColor(ttl)} width={6} />
          <text x={TTL_CLOCK.cx} y={TTL_CLOCK.cy + 6} textAnchor="middle" fill={arcColor(ttl)}
            fontSize={17} fontWeight={600} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
            {mmss(ttl)}
          </text>
          <text x={TTL_CLOCK.cx} y={TTL_CLOCK.cy - TTL_CLOCK.r - 12} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            ttl
          </text>
          {refreshPulse > 0.002 && (
            <circle cx={TTL_CLOCK.cx} cy={TTL_CLOCK.cy} r={TTL_CLOCK.r + 6 + 10 * (1 - refreshPulse)}
              fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} opacity={refreshPulse} />
          )}
        </g>
      )}

      {/* ── verdicts, model, usage ── */}
      <VerdictChip {...VERDICT} text="HIT — cache read" color={colors.POSITIVE} u={s.get(scene.hitU)} />
      <VerdictChip {...VERDICT} text="MISS — expired, re-write" color={colors.WARM} u={s.get(scene.missU)} />
      <VerdictChip {...VERDICT} text="MISS — prefix changed" color={colors.NEGATIVE} u={s.get(scene.miss2U)} />
      <Vec x1={chipX(25)} y1={ROW_Y + CHIP.h / 2 + 4} x2={MODEL.x + 30} y2={MODEL.y - 34}
        grow={clamp01(s.get(scene.sendU))} color={colors.WARM} width={2.5} head={9}
        label="only the new turn" labelAt="mid" labelSize={14} opacity={0.9} />
      <NodeBadge x={MODEL.x} y={MODEL.y} w={150} h={54} label="model" color={colors.SECONDARY}
        u={clamp01(s.get(scene.modelU))} />
      <VerdictChip {...USAGE} text="Usage" color={colors.ACCENT} u={s.get(scene.usageU)} />

      {/* ── the price tags ── */}
      {clamp01(s.get(scene.writeU)) > 0.002 && (
        <g opacity={clamp01(s.get(scene.writeU))}
          transform={`translate(${COST_W.x}, ${COST_W.y}) scale(${0.9 + 0.1 * clamp01(s.get(scene.writeU))})`}>
          <rect x={-COST_W.w / 2} y={-COST_W.h / 2} width={COST_W.w} height={COST_W.h} rx={10}
            fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
          <text textAnchor="middle" y={-4} fill={colors.WARM} fontSize={17} fontWeight={600}>write ≈ 1.25× input</text>
          <text textAnchor="middle" y={17} fill={colors.MUTED} fontSize={13}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">cache_creation_input_tokens</text>
        </g>
      )}
      {clamp01(s.get(scene.readU)) > 0.002 && (
        <g opacity={clamp01(s.get(scene.readU))}
          transform={`translate(${COST_R.x}, ${COST_R.y}) scale(${0.9 + 0.1 * clamp01(s.get(scene.readU))})`}>
          <rect x={-COST_R.w / 2} y={-COST_R.h / 2} width={COST_R.w} height={COST_R.h} rx={10}
            fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
          <text textAnchor="middle" y={-4} fill={colors.POSITIVE} fontSize={17} fontWeight={600}>read ≈ 0.1× input</text>
          <text textAnchor="middle" y={17} fill={colors.MUTED} fontSize={13}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">cache_read_input_tokens</text>
        </g>
      )}

      {/* ── rule of thumb ── */}
      {recapU > 0.002 && (
        <text x={640} y={RECAP_Y} textAnchor="middle" fill={colors.TEXT} fontSize={17} opacity={recapU}>
          Same bytes, inside the TTL → ~0.1×. Idle out or change the prefix → full price again.
        </text>
      )}
    </g>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
/** The module-scope scene; its `.tl` drives embedding (beats = caption starts). */
export const vizScene = () => scene;
