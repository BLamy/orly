// Byte-Identical or Bust
//
// Grounding: src/resources/beta/messages/messages.ts —
// `BetaDiagnosticsParam.previous_message_id` opts a request into prompt-cache
// divergence reporting, and `BetaDiagnostics.cache_miss_reason` comes back as
// one of `tools_changed` | `system_changed` | `messages_changed` |
// `model_changed` | `previous_message_not_found` | `unavailable`, each
// carrying `cache_missed_input_tokens` ("what you would have saved").
// The request prefix order (tools → system → messages) is the cache key.
//
// Centerpiece: a PREFIX COMPARATOR — the stored request held against today's,
// a scanline walking left to right, green matched pairs, and a red flare at
// the first divergent byte that turns everything after it full-price.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The two tapes. 32 cells: TOOLS 8 · SYSTEM 8 · MESSAGES 16.
// Scenario A reorders tools (diverges at cell 3), B edits the system prompt
// (diverges at cell 12), C is append-only (full match + 6 new cells).
// ---------------------------------------------------------------------------

const N_TOOLS = 8;
const N_SYS = 8;
const N_MSG = 16;
const N = N_TOOLS + N_SYS + N_MSG;

const CELL_W = 20;
const PITCH = 22;
const CELL_H = 30;
const TAPE_X = 168;
const TOP_Y = 208; // the stored request (what the cache remembers)
const BOT_Y = 330; // today's request
const cellX = (i: number): number => TAPE_X + i * PITCH;

type Section = 'tools' | 'system' | 'messages';
const sectionOf = (i: number): Section => (i < N_TOOLS ? 'tools' : i < N_TOOLS + N_SYS ? 'system' : 'messages');
const SECTION_FILL: Record<Section, string> = {
  tools: colors.WARM,
  system: colors.SECONDARY,
  messages: colors.ACCENT,
};

interface Scenario {
  key: 'A' | 'B' | 'C';
  diffAt: number; // first divergent cell; N = no divergence
  missType: string;
  missedTokens: number;
  appended: number; // extra cells on today's tape past the stored end
}
const SCENARIOS: Scenario[] = [
  { key: 'A', diffAt: 3, missType: 'tools_changed', missedTokens: 41200, appended: 0 },
  { key: 'B', diffAt: 12, missType: 'system_changed', missedTokens: 36900, appended: 0 },
  { key: 'C', diffAt: N, missType: '', missedTokens: 0, appended: 6 },
];

const BRACKETS: { label: string; from: number; to: number }[] = [
  { label: 'tools', from: 0, to: N_TOOLS },
  { label: 'system', from: N_TOOLS, to: N_TOOLS + N_SYS },
  { label: 'messages', from: N_TOOLS + N_SYS, to: N },
];

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_TAPES: CameraState = { x: 560, y: 280, k: 1.22 };
const CAM_MISS_A: CameraState = { x: 380, y: 280, k: 1.45 };
const CAM_CHIP: CameraState = { x: 700, y: 380, k: 1.15 };

// ---------------------------------------------------------------------------
// Timeline (~68s, ten beats). One scan channel per scenario keeps every
// frame a pure function of sampled values.
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);

  const tapesU = tl.channel('tapesU', 0); // both tapes draw on
  const bracketsU = tl.channel('bracketsU', 0); // tools | system | messages
  const scen = tl.channel('scen', 0); // 0 | 1 | 2 — which bottom tape is mounted
  const swapU = tl.channel('swapU', 1); // bottom tape opacity through swaps
  const scanA = tl.channel('scanA', 0); // scanline, cells scanned (scenario A)
  const scanB = tl.channel('scanB', 0);
  const scanC = tl.channel('scanC', 0);
  const flareA = tl.channel('flareA', 0); // divergence flare + full-price tint
  const flareB = tl.channel('flareB', 0);
  const chipU = tl.channel('chipU', 0); // the diagnostics chip
  const exactU = tl.channel('exactU', 0); // "ninety-nine percent still misses"
  const appendU = tl.channel('appendU', 0); // scenario C's new suffix
  const hitU = tl.channel('hitU', 0); // full-match celebration
  const dimU = tl.channel('dimU', 0);
  const moralU = tl.channel('moralU', 0); // closing discipline card

  // — beat 1 · what the cache actually is —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'The cache is not magic memory. It is the model’s saved state after reading one specific sequence of bytes — and it only helps if your next request begins with exactly those bytes.',
  });
  tl.tween(tapesU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_TAPES, { at: 1.2, dur: 1.5, ease: ease.move });
  tl.hold(7.1, 0.4);

  // — beat 2 · the fixed layout —
  tl.caption({
    at: 7.8,
    dur: 6.2,
    text: 'Every request lays out the same way: tool definitions first, then the system prompt, then the messages. The cache key is this entire prefix, in this exact order.',
  });
  tl.tween(bracketsU, 1, { at: 8.2, dur: 1.2, ease: ease.draw });

  // — beat 3 · the comparator starts walking —
  tl.caption({
    at: 14.6,
    dur: 6.2,
    text: 'So the server holds your previous request against this one and walks left to right, byte for byte. Green means identical — it reuses work only as far as the match runs.',
  });
  tl.tween(scanA, 2.6, { at: 15.4, dur: 3.6, ease: ease.linear });

  // — beat 4 · scenario A: tools reordered —
  tl.caption({
    at: 21.4,
    dur: 6.6,
    text: 'These two requests reordered two tools. The match dies three cells in, and everything to the right — the system prompt, the entire history — is re-processed at full price.',
  });
  tl.tween(cam, CAM_MISS_A, { at: 21.6, dur: 1.2, ease: ease.move });
  tl.tween(scanA, 3, { at: 22.0, dur: 0.7, ease: ease.linear });
  tl.tween(flareA, 1, { at: 22.7, dur: 0.9, ease: ease.pop });
  tl.hold(28.0, 0.4);

  // — beat 5 · the diagnostics chip —
  tl.caption({
    at: 28.8,
    dur: 6.4,
    text: 'The interface will even tell you why. Opt into diagnostics and the miss comes back labeled: the tools changed — and roughly this many tokens would have been read from cache instead.',
  });
  tl.tween(cam, CAM_CHIP, { at: 29.0, dur: 1.3, ease: ease.move });
  tl.tween(chipU, 1, { at: 29.6, dur: 0.8, ease: ease.enter });

  // — beat 6 · scenario B: one system word —
  tl.caption({
    at: 35.8,
    dur: 6.4,
    text: 'Same story one layer down. Edit a single word of the system prompt and the mismatch just moves later in the tape. One changed token invalidates every token after it.',
  });
  tl.tween(cam, CAM_TAPES, { at: 36.0, dur: 1.2, ease: ease.move });
  tl.tween(swapU, 0, { at: 36.0, dur: 0.4, ease: ease.enter });
  tl.set(scen, 1, 36.5);
  tl.set(chipU, 0, 36.5);
  tl.set(flareA, 0, 36.5);
  tl.tween(swapU, 1, { at: 36.6, dur: 0.4, ease: ease.enter });
  tl.tween(scanB, 12, { at: 37.2, dur: 2.8, ease: ease.linear });
  tl.tween(flareB, 1, { at: 40.2, dur: 0.9, ease: ease.pop });

  // — beat 7 · exact, not approximate —
  tl.caption({
    at: 42.8,
    dur: 5.6,
    text: 'Notice what never mattered: how similar the requests are. Ninety nine percent identical still misses. The comparison is exact, not approximate.',
  });
  tl.tween(exactU, 1, { at: 43.4, dur: 0.7, ease: ease.pop });
  tl.hold(48.6, 0.4);

  // — beat 8 · the one safe move —
  tl.caption({
    at: 49.4,
    dur: 5.6,
    text: 'There is exactly one safe move: append. Keep everything you already sent untouched, and add the new messages at the end.',
  });
  tl.tween(swapU, 0, { at: 49.6, dur: 0.4, ease: ease.enter });
  tl.set(scen, 2, 50.1);
  tl.set(exactU, 0, 50.1);
  tl.set(flareB, 0, 50.1);
  tl.tween(swapU, 1, { at: 50.2, dur: 0.4, ease: ease.enter });
  tl.tween(appendU, 1, { at: 51.6, dur: 1.0, ease: ease.enter });

  // — beat 9 · the full-length match —
  tl.caption({
    at: 55.4,
    dur: 6.2,
    text: 'Now the match runs the entire length of the stored prefix. The only fresh work is the new suffix hanging off the end — the history itself becomes a cache read.',
  });
  tl.tween(scanC, N, { at: 55.8, dur: 3.6, ease: ease.linear });
  tl.tween(hitU, 1, { at: 59.8, dur: 0.7, ease: ease.pop });

  // — beat 10 · the discipline —
  tl.caption({
    at: 62.4,
    dur: 6.6,
    text: 'That is the whole discipline. Same model, same tools, same system prompt, same message order. Caching rewards conversations that only ever grow.',
  });
  tl.tween(cam, CAM_WIDE, { at: 62.6, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 62.8, dur: 1.0, ease: ease.move });
  tl.tween(moralU, 1, { at: 63.8, dur: 0.8, ease: ease.enter });
  tl.hold(69.0, 1.4);

  return {
    tl,
    cam,
    tapesU,
    bracketsU,
    scen,
    swapU,
    scanA,
    scanB,
    scanC,
    flareA,
    flareB,
    chipU,
    exactU,
    appendU,
    hitU,
    dimU,
    moralU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

function Tape({ y, ghost, diffAt, flare, opacity }: { y: number; ghost: boolean; diffAt: number; flare: number; opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      {Array.from({ length: N }, (_, i) => {
        const isDiff = i === diffAt && flare > 0;
        const dead = i > diffAt ? flare : 0; // right of the divergence: full price
        return (
          <rect
            key={i}
            x={cellX(i)}
            y={y - (isDiff ? 4 * flare : 0)}
            width={CELL_W}
            height={CELL_H + (isDiff ? 8 * flare : 0)}
            rx={3}
            fill={isDiff ? colors.NEGATIVE : SECTION_FILL[sectionOf(i)]}
            opacity={(ghost ? 0.3 : 0.5) * (1 - 0.45 * dead) + (isDiff ? 0.45 : 0)}
            stroke={isDiff ? colors.NEGATIVE : 'none'}
            strokeWidth={1.4}
          />
        );
      })}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapesU = s.get(scene.tapesU);
  const bracketsU = s.get(scene.bracketsU);
  const scenIdx = Math.round(s.get(scene.scen));
  const swapU = s.get(scene.swapU);
  const scans = [s.get(scene.scanA), s.get(scene.scanB), s.get(scene.scanC)];
  const flares = [s.get(scene.flareA), s.get(scene.flareB), 0];
  const chipU = s.get(scene.chipU);
  const exactU = s.get(scene.exactU);
  const appendU = s.get(scene.appendU);
  const hitU = s.get(scene.hitU);
  const dimU = s.get(scene.dimU);
  const moralU = s.get(scene.moralU);

  const sc = SCENARIOS[Math.max(0, Math.min(2, scenIdx))];
  const scan = scans[Math.max(0, Math.min(2, scenIdx))];
  const flare = flares[Math.max(0, Math.min(2, scenIdx))];
  const machineOp = tapesU * (1 - 0.88 * dimU);
  const scanX = cellX(Math.min(scan, N)) + CELL_W / 2;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={machineOp}>
          {/* labels */}
          <text x={TAPE_X} y={TOP_Y - 40} fill={colors.MUTED} fontSize={13}>
            what the cache remembers — your previous request
          </text>
          <text x={TAPE_X} y={BOT_Y + CELL_H + 34} fill={colors.MUTED} fontSize={13}>
            this request
          </text>

          {/* stored tape (ghost) — never changes */}
          <Tape y={TOP_Y} ghost diffAt={N + 1} flare={0} opacity={1} />
          {/* today's tape — swaps per scenario */}
          <Tape y={BOT_Y} ghost={false} diffAt={sc.diffAt} flare={flare} opacity={swapU} />

          {/* scenario C: the appended suffix past the stored end */}
          {sc.appended > 0 && (
            <g opacity={appendU * swapU}>
              {Array.from({ length: sc.appended }, (_, j) => (
                <rect key={j} x={cellX(N + j)} y={BOT_Y} width={CELL_W} height={CELL_H} rx={3} fill={colors.POSITIVE} opacity={0.65} />
              ))}
              <text x={cellX(N)} y={BOT_Y - 10} fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
                new suffix — the only new work
              </text>
            </g>
          )}

          {/* section brackets over the stored tape */}
          <g opacity={bracketsU}>
            {BRACKETS.map((b) => (
              <g key={b.label}>
                <path
                  d={`M ${cellX(b.from)} ${TOP_Y - 18} v -8 H ${cellX(b.to) - PITCH + CELL_W} v 8`}
                  fill="none"
                  stroke={SECTION_FILL[sectionOf(b.from)]}
                  strokeWidth={1.5}
                />
                <text
                  x={(cellX(b.from) + cellX(b.to) - PITCH + CELL_W) / 2}
                  y={TOP_Y - 32}
                  textAnchor="middle"
                  fill={SECTION_FILL[sectionOf(b.from)]}
                  fontSize={12}
                  fontFamily={MONO}
                >
                  {b.label}
                </text>
              </g>
            ))}
          </g>

          {/* matched-pair ticks + link lines behind the scanline */}
          {Array.from({ length: Math.min(Math.floor(scan), sc.diffAt) }, (_, i) => (
            <g key={i} opacity={swapU}>
              <line x1={cellX(i) + CELL_W / 2} y1={TOP_Y + CELL_H} x2={cellX(i) + CELL_W / 2} y2={BOT_Y} stroke={colors.POSITIVE} strokeWidth={1.2} opacity={0.5} />
              <circle cx={cellX(i) + CELL_W / 2} cy={(TOP_Y + CELL_H + BOT_Y) / 2} r={3} fill={colors.POSITIVE} />
            </g>
          ))}

          {/* the scanline */}
          {scan > 0 && scan < N - 0.01 && flare < 0.5 && (
            <g opacity={swapU}>
              <line x1={scanX} y1={TOP_Y - 14} x2={scanX} y2={BOT_Y + CELL_H + 14} stroke={colors.TEXT} strokeWidth={2} opacity={0.85} />
              <text x={scanX} y={TOP_Y - 22} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                compare
              </text>
            </g>
          )}

          {/* divergence flare + full-price banner */}
          {flare > 0 && (
            <g opacity={flare * swapU}>
              <circle cx={cellX(sc.diffAt) + CELL_W / 2} cy={BOT_Y + CELL_H / 2} r={16 + 6 * flare} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} opacity={0.8} />
              <rect x={cellX(sc.diffAt + 1)} y={BOT_Y + CELL_H + 8} width={cellX(N) - cellX(sc.diffAt + 1)} height={4} rx={2} fill={colors.NEGATIVE} opacity={0.7} />
              <text x={cellX(sc.diffAt + 1)} y={BOT_Y + CELL_H + 26} fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>
                re-processed at full price
              </text>
            </g>
          )}

          {/* full-match celebration (scenario C) */}
          <g opacity={hitU}>
            <rect x={TAPE_X} y={TOP_Y - 70} width={N * PITCH - 2} height={3} rx={1.5} fill={colors.POSITIVE} opacity={0.8} />
            <text x={TAPE_X + (N * PITCH) / 2} y={TOP_Y - 80} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={600}>
              prefix reused, end to end
            </text>
          </g>
        </g>

        {/* the diagnostics chip — real field names from the beta surface */}
        <g opacity={chipU * (1 - 0.88 * dimU)}>
          <rect x={560} y={430} width={470} height={118} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.4} />
          <text x={582} y={460} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            request: diagnostics: {'{'} previous_message_id {'}'}
          </text>
          <text x={582} y={488} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>
            cache_miss_reason: {'{'} type: '{sc.missType || 'tools_changed'}',
          </text>
          <text x={582} y={512} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>
            {'  '}cache_missed_input_tokens: {(sc.missedTokens || 41200).toLocaleString('en-US')} {'}'}
          </text>
          <text x={582} y={538} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
            also: system_changed · messages_changed · model_changed
          </text>
        </g>

        {/* "exact, not approximate" chip */}
        <g opacity={exactU * (1 - 0.88 * dimU)}>
          <rect x={430} y={470} width={420} height={54} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
          <text x={640} y={503} textAnchor="middle" fill={colors.WARM} fontSize={16} fontWeight={600}>
            99% identical is still a miss
          </text>
        </g>

        {/* the closing discipline card */}
        <g opacity={moralU}>
          <rect x={290} y={230} width={700} height={180} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={600}>
            The prefix is the cache key.
          </text>
          {['same model', 'same tools', 'same system', 'append only'].map((t, i) => (
            <g key={t}>
              <rect x={330 + i * 158} y={318} width={146} height={40} rx={10} fill={colors.BG} stroke={colors.POSITIVE} />
              <text x={330 + i * 158 + 73} y={343} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5}>
                {t}
              </text>
            </g>
          ))}
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
