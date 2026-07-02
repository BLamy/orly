// Prompt Caching · Chapter 2 — "The Prefix and the Breakpoint"
// The request assembles in FIXED order (tools → system → messages); a
// cache_control breakpoint plants at a block boundary; everything before it
// tints cacheable; a swap breaks the byte-identical prefix match; recap + ttl.
import { MathLabel, Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Brace, Vec } from '../../primitives';
import { ROLE_COLOR } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ── layout, 1280×720 stage (bottom ~12% kept clear) ─────────────────────────
const GAP = 14;
const X0 = 197;
const ROW_TOP = 314;
const ROW_H = 92;
const ROW_MID = ROW_TOP + ROW_H / 2;

const TOOLS_W = 200;
const SYS_W = 240;
const MSG_W = 130;

// natural order: tools | system | msg1 msg2 msg3
const TOOLS_X = X0; //                    197..397
const SYS_X = TOOLS_X + TOOLS_W + GAP; // 411..651
const MSG_X = [0, 1, 2].map((i) => SYS_X + SYS_W + GAP + i * (MSG_W + GAP)); // 665, 809, 953
const ROW_W = MSG_X[2] + MSG_W - X0; // 886

// swapped order (beat 5): system first, then tools — same span, new offsets
const SYS_X_SWAP = X0;
const TOOLS_X_SWAP = X0 + SYS_W + GAP;

// breakpoint boundary: after msg2 (last stable turn)
const PIN_X = MSG_X[1] + MSG_W + GAP / 2; // 946

const C_TOOLS = ROLE_COLOR.tool;
const C_SYS = ROLE_COLOR.system;
const C_MSG = [ROLE_COLOR.user, ROLE_COLOR.assistant, ROLE_COLOR.user];

// ── timeline ─────────────────────────────────────────────────────────────────
export function buildScene() {
  const tl = new Timeline();
  const titleU = tl.channel('titleU', 0);
  const toolsU = tl.channel('toolsU', 0);
  const sysU = tl.channel('sysU', 0);
  const msgP = tl.channel('msgP', 0); // one channel staggers the 3 turn chips
  const orderU = tl.channel('orderU', 0); // "read order →" arrow under the row
  const newTagU = tl.channel('newTagU', 0);
  const pinU = tl.channel('pinU', 0); // breakpoint flag drop
  const jsonU = tl.channel('jsonU', 0); // cache_control snippet
  const braceU = tl.channel('braceU', 0); // prefix brace
  const sweepU = tl.channel('sweepU', 0); // cacheable tint, left→pin
  const storeU = tl.channel('storeU', 0); // "stored prefix" label
  const swapU = tl.channel('swapU', 0); // 0 natural order, 1 swapped
  const scanVis = tl.channel('scanVis', 0); // match pointer visibility
  const scanU = tl.channel('scanU', 0); // match pointer progress along prefix
  const missU = tl.channel('missU', 0); // NEGATIVE flash + miss label
  const ttlU = tl.channel('ttlU', 0); // ttl chip
  const recapU = tl.channel('recapU', 0); // warm glow on the planted pin

  // BEAT 0 — step 1: tools come first, read before everything else
  tl.caption({ at: 0.4, dur: 4.6, text: 'First in the prompt: tools — read before everything else.' });
  tl.tween(titleU, 1, { at: 0.5, dur: 0.6, ease: ease.enter });
  tl.tween(toolsU, 1, { at: 1.2, dur: 0.7, ease: ease.enter });
  tl.tween(orderU, 1, { at: 2.2, dur: 1.2, ease: ease.draw });

  // BEAT 1 — step 2: then system, long and stable
  tl.caption({ at: 5.6, dur: 4.6, text: 'Then system: long, stable instructions repeated call after call.' });
  tl.tween(sysU, 1, { at: 5.8, dur: 0.7, ease: ease.enter });

  // BEAT 2 — step 3: last come messages; only the newest turn differs
  tl.caption({ at: 10.8, dur: 5.2, text: 'Last, messages — early turns are stable; only the newest differs.' });
  tl.tween(msgP, 1, { at: 11.0, dur: 1.6, ease: ease.move });
  tl.tween(newTagU, 1, { at: 13.2, dur: 0.5, ease: ease.pop });

  // BEAT 3 — step 4: plant cache_control at a block boundary
  tl.caption({ at: 16.6, dur: 5.2, text: "cache_control: { type: 'ephemeral' } marks where the prefix ends." });
  tl.tween(pinU, 1, { at: 16.8, dur: 0.8, ease: ease.enter });
  tl.tween(jsonU, 1, { at: 17.6, dur: 0.6, ease: ease.enter });
  tl.tween(orderU, 0, { at: 18.2, dur: 0.5, ease: ease.enter });
  tl.tween(braceU, 1, { at: 18.4, dur: 1.2, ease: ease.draw });

  // BEAT 4 — step 5: everything before the breakpoint becomes a stored prefix
  tl.caption({ at: 22.4, dur: 5.2, text: 'Everything before the breakpoint is stored — read once, reused next call.' });
  tl.tween(sweepU, 1, { at: 22.6, dur: 1.6, ease: ease.draw });
  tl.tween(storeU, 1, { at: 24.4, dur: 0.6, ease: ease.enter });

  // BEAT 5 — step 6: order matters; a swap breaks the match at the first byte
  tl.caption({ at: 28.2, dur: 5.8, text: 'Matching is byte-identical: reorder anything and everything after misses.' });
  tl.tween(swapU, 1, { at: 28.5, dur: 1.1, ease: ease.move });
  tl.tween(scanVis, 1, { at: 29.8, dur: 0.4, ease: ease.enter });
  tl.tween(scanU, 0.05, { at: 30.2, dur: 0.5, ease: ease.linear }); // pointer stops immediately
  tl.tween(missU, 1, { at: 30.9, dur: 0.4, ease: ease.pop });
  tl.tween(sweepU, 0, { at: 30.9, dur: 0.8, ease: ease.move }); // the stored tint no longer applies
  tl.tween(missU, 0.6, { at: 32.0, dur: 0.6, ease: ease.move });

  // BEAT 6 — step 7: restore the order; ttl keeps the well-placed prefix warm
  tl.caption({ at: 34.6, dur: 5.4, text: "ttl '5m' or '1h' — how long a well-placed prefix stays warm." });
  tl.tween(swapU, 0, { at: 34.9, dur: 1.0, ease: ease.move });
  tl.tween(missU, 0, { at: 34.9, dur: 0.6, ease: ease.move });
  tl.tween(scanU, 1, { at: 36.0, dur: 1.4, ease: ease.draw }); // pointer sweeps clean to the pin
  tl.tween(sweepU, 1, { at: 36.0, dur: 1.4, ease: ease.draw });
  tl.tween(ttlU, 1, { at: 37.6, dur: 0.6, ease: ease.enter });
  tl.tween(recapU, 1, { at: 37.6, dur: 0.6, ease: ease.pop });
  tl.hold(40.0, 0.6);

  return {
    tl, titleU, toolsU, sysU, msgP, orderU, newTagU, pinU, jsonU, braceU,
    sweepU, storeU, swapU, scanVis, scanU, missU, ttlU, recapU,
  };
}

const scene = buildScene();

// ── local subcomponents ──────────────────────────────────────────────────────

/** One labeled request block: mono name + type sublabel + read-order index. */
function Block({
  x, w, label, sub, color, u = 1, dashed = false, tint = 0,
}: {
  x: number; w: number; label: string; sub: string; color: string;
  u?: number; dashed?: boolean; tint?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const stroke = tint > 0.5 ? colors.POSITIVE : color;
  return (
    <g transform={`translate(${x}, ${ROW_TOP + (1 - uu) * 14})`} opacity={uu}>
      <rect
        width={w}
        height={ROW_H}
        rx={10}
        fill={colors.PANEL}
        stroke={stroke}
        strokeWidth={1.5}
        strokeOpacity={0.9}
        strokeDasharray={dashed ? '6 5' : undefined}
      />
      {tint > 0 && (
        <rect width={w} height={ROW_H} rx={10} fill={colors.POSITIVE} opacity={0.14 * clamp01(tint)} />
      )}
      <text x={w / 2} y={ROW_H / 2 - 4} textAnchor="middle" fill={color} fontSize={18} fontWeight={700} fontFamily={mono}>
        {label}
      </text>
      <text x={w / 2} y={ROW_H / 2 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
        {sub}
      </text>
    </g>
  );
}

/** Small mono pill (used for the ttl chip). */
function MonoChip({ x, y, label, color, u = 1 }: { x: number; y: number; label: string; color: string; u?: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = label.length * 8.6 + 26;
  return (
    <g transform={`translate(${x}, ${y}) scale(${0.8 + 0.2 * uu})`} opacity={uu}>
      <rect x={-w / 2} y={-15} width={w} height={30} rx={15} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      <text y={5} textAnchor="middle" fill={color} fontSize={14} fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

// ── render (pure function of the sampled state) ──────────────────────────────
export function Render({ s }: { s: SceneState }) {
  const swap = s.get(scene.swapU);
  const sweep = s.get(scene.sweepU);
  const miss = s.get(scene.missU);
  const pin = s.get(scene.pinU);
  const scan = s.get(scene.scanU);
  const scanVis = s.get(scene.scanVis);
  const msgP = s.get(scene.msgP);
  const braceUv = s.get(scene.braceU) * (1 - 0.5 * miss);
  const recap = s.get(scene.recapU);

  const toolsX = lerp(TOOLS_X, TOOLS_X_SWAP, swap);
  const sysX = lerp(SYS_X, SYS_X_SWAP, swap);
  // tint fades in behind each block as the sweep front passes its center
  const tintAt = (cx: number) => clamp01((X0 + sweep * (PIN_X - X0) - cx) / 40);
  const scanX = X0 + scan * (PIN_X - X0);
  const scanColor = miss > 0.01 ? colors.NEGATIVE : colors.POSITIVE;

  return (
    <>
      {/* title */}
      <text x={640} y={86} textAnchor="middle" fill={colors.TEXT} fontSize={24} opacity={s.get(scene.titleU)}>
        One request, assembled in a fixed order
      </text>
      <text x={640} y={112} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={mono} opacity={s.get(scene.titleU)}>
        MessageCreateParams
      </text>

      {/* cacheable-region sweep, behind the blocks */}
      <rect
        x={X0 - 8}
        y={ROW_TOP - 8}
        width={(PIN_X - X0 + 4) * sweep + 8 * clamp01(sweep * 8)}
        height={ROW_H + 16}
        rx={12}
        fill={colors.POSITIVE}
        opacity={0.08 * clamp01(sweep * 4)}
      />

      {/* the three sections, in read order */}
      <Block x={toolsX} w={TOOLS_W} label="tools" sub="Array<ToolUnion>" color={C_TOOLS} u={s.get(scene.toolsU)} tint={tintAt(toolsX + TOOLS_W / 2)} />
      <Block x={sysX} w={SYS_W} label="system" sub="TextBlockParam[]" color={C_SYS} u={s.get(scene.sysU)} tint={tintAt(sysX + SYS_W / 2)} />
      {MSG_X.map((mx, i) => (
        <Block
          key={i}
          x={mx}
          w={MSG_W}
          label={['user', 'asst', 'user'][i]}
          sub={i === 2 ? 'newest turn' : `turn ${i + 1}`}
          color={C_MSG[i]}
          u={clamp01(msgP * 3 - i * 0.8)}
          dashed={i === 2}
          tint={i < 2 ? tintAt(mx + MSG_W / 2) : 0}
        />
      ))}

      {/* "new this turn" tag over the newest message */}
      <text x={MSG_X[2] + MSG_W / 2} y={ROW_TOP - 16} textAnchor="middle" fill={colors.WARM} fontSize={13} opacity={s.get(scene.newTagU)}>
        changes every call
      </text>

      {/* read-order arrow (fades once the breakpoint takes the stage) */}
      <g opacity={s.get(scene.orderU)}>
        <Vec x1={X0} y1={ROW_TOP + ROW_H + 34} x2={X0 + ROW_W * 0.98} y2={ROW_TOP + ROW_H + 34} grow={s.get(scene.orderU)} color={colors.MUTED} width={2} head={9} />
        <text x={X0} y={ROW_TOP + ROW_H + 58} fill={colors.MUTED} fontSize={13}>
          read order — byte after byte
        </text>
      </g>

      {/* the breakpoint pin at the block boundary */}
      <g opacity={pin}>
        <line
          x1={PIN_X}
          y1={lerp(ROW_TOP - 34, ROW_TOP - 44, pin)}
          x2={PIN_X}
          y2={ROW_TOP + ROW_H + 22}
          stroke={colors.WARM}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        {/* flag */}
        <path d={`M ${PIN_X} ${ROW_TOP - 44} l 30 9 l -30 9 z`} fill={colors.WARM} />
        {recap > 0 && (
          <circle cx={PIN_X} cy={ROW_TOP - 44 + 9} r={20 + 6 * recap} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={0.5 * recap} />
        )}
      </g>
      <MathLabel
        tex="\texttt{cache\_control: \{ type: 'ephemeral' \}}"
        x={PIN_X - 60}
        y={190}
        fontSize={19}
        color={colors.WARM}
        opacity={s.get(scene.jsonU)}
      />

      {/* prefix brace under the cacheable span */}
      <Brace x0={X0} x1={PIN_X} y={ROW_TOP + ROW_H + 26} below u={braceUv} color={colors.POSITIVE} label="the cacheable prefix — up to and including the marked block" fontSize={14} />

      {/* stored-prefix note */}
      <text x={(X0 + PIN_X) / 2} y={252} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} opacity={s.get(scene.storeU) * (1 - miss)}>
        stored prefix — read once, reusable while it stays warm
      </text>

      {/* match pointer: scans the prefix for byte-identical bytes */}
      {scanVis > 0 && (
        <g opacity={scanVis}>
          <path d={`M ${scanX} ${ROW_TOP - 4} l -7 -12 l 14 0 z`} fill={scanColor} />
          <text x={scanX} y={ROW_TOP - 24} textAnchor="middle" fill={scanColor} fontSize={13} fontFamily={mono}>
            {miss > 0.01 ? '✗ first differing byte' : scan > 0.98 ? '✓ prefix hit' : 'matching…'}
          </text>
        </g>
      )}

      {/* cache-miss flash: everything after the first differing byte */}
      {miss > 0 && (
        <g opacity={miss}>
          <rect x={X0 - 8} y={ROW_TOP - 8} width={ROW_W + 16} height={ROW_H + 16} rx={12} fill={colors.NEGATIVE} opacity={0.16} />
          <text x={X0 + ROW_W / 2} y={ROW_TOP + ROW_H + 78} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15}>
            swap tools and system → the prefix diverges at its very first block: full re-read
          </text>
        </g>
      )}

      {/* ttl recap chip by the pin */}
      <MonoChip x={PIN_X - 40} y={ROW_TOP + ROW_H + 92} label="ttl: '5m' | '1h'  (default 5m)" color={colors.WARM} u={s.get(scene.ttlU)} />
    </>
  );
}

/** Module-scope scene; `.tl` drives the book player's beat windows. */
export const vizScene = () => scene;
