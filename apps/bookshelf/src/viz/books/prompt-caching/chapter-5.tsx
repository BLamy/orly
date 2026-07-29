// The Agent's Bill, Before and After
//
// Grounding: src/lib/tools/BetaToolRunner.ts — the tool runner's own context
// accounting: totalInputTokens = usage.input_tokens +
// cache_creation_input_tokens + cache_read_input_tokens (lines ~93-96); the
// tool-loop shape from examples/tools-helpers-advanced.ts
// (client.beta.messages.toolRunner with runnable tools). Price multipliers:
// writes 1.25×, reads 0.1× (5-minute tier).
//
// Centerpiece: the SAME ten-turn tool-using conversation run in two lanes —
// top never caches (the whole context bar flashes full-price every turn),
// bottom marks the prefix (history reads back in cool cache-blue at a tenth)
// — while two odometers diverge to 175,000 vs ~53,150 token-units.
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
import { ContextBar } from '../../agent';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The model conversation: base (system + tools) = 4,000 tokens; each turn's
// exchange appends ~3,000. Cumulative input billed, computed exactly:
//   uncached turn n reads 4,000 + 3,000(n-1) at full price
//   cached   turn 1 writes the 4,000 base at 1.25×; turn n≥2 reads the prior
//            transcript at 0.1× and writes the new ~3,000 at 1.25×
// ---------------------------------------------------------------------------

const BASE = 4000;
const PER_TURN = 3000;
const TURNS = 10;
const CAPACITY = 40000;

const promptAt = (n: number): number => BASE + PER_TURN * (n - 1);

const CUM_NO: number[] = [0];
const CUM_CACHE: number[] = [0];
for (let n = 1; n <= TURNS; n++) {
  CUM_NO.push(CUM_NO[n - 1] + promptAt(n));
  const turnCost = n === 1 ? 1.25 * BASE : 0.1 * promptAt(n - 1) + 1.25 * PER_TURN;
  CUM_CACHE.push(CUM_CACHE[n - 1] + turnCost);
}
// CUM_NO[10] = 175,000 · CUM_CACHE[10] = 53,150 → ≈ 70% saved

/** cumulative cost at fractional turn t — accrues inside each turn's read window */
function costAt(cum: number[], t: number): number {
  const k = Math.min(TURNS - 1, Math.max(0, Math.floor(t)));
  const f = clamp01(t - k);
  return lerp(cum[k], cum[k + 1], clamp01((f - 0.1) / 0.7));
}
/** the read-flash pulse inside a turn: 0 → 1 → 0 */
function pulseAt(t: number): number {
  if (t <= 0 || t >= TURNS) return 0;
  const f = t - Math.floor(t);
  return Math.sin(Math.PI * clamp01((f - 0.1) / 0.7)) ** 2;
}

// layout
const LANE_X = 150;
const BAR_W = 640;
const BAR_H = 30;
const TOP_Y = 224;
const BOT_Y = 434;
const ODO_X = 1140;

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_TOP: CameraState = { x: 560, y: 250, k: 1.25 };
const CAM_BOT: CameraState = { x: 560, y: 440, k: 1.25 };

// ---------------------------------------------------------------------------
// Timeline (~76s, eleven beats). One channel drives both runs in lockstep.
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const lanesU = tl.channel('lanesU', 0); // both lanes draw on
  const turnU = tl.channel('turnU', 0); // 0..10, the shared clock
  const writeChipU = tl.channel('writeChipU', 0); // turn-one write premium chip
  const ratioU = tl.channel('ratioU', 0); // the ~70% chip
  const booksU = tl.channel('booksU', 0); // tool-runner accounting chip
  const dimU = tl.channel('dimU', 0);
  const recapU = tl.channel('recapU', 0); // closing card
  const glyphsU = tl.channel('glyphsU', 0); // the four recap glyphs

  // — beat 1 · the setup —
  tl.caption({
    at: 0.5,
    dur: 6.8,
    text: 'Let us run the same agent twice and watch the meter. Ten turns, one tool call per turn: four thousand tokens of system prompt and tool definitions, plus about three thousand new tokens of transcript per turn.',
  });
  tl.tween(lanesU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.hold(7.3, 0.4);

  // — beat 2 · the uncached run —
  tl.caption({
    at: 8.0,
    dur: 6.2,
    text: 'The top run never caches. Turn one reads four thousand tokens. By turn ten it will be hauling thirty one thousand in a single request — all at full price.',
  });
  tl.tween(cam, CAM_TOP, { at: 8.2, dur: 1.3, ease: ease.move });
  tl.tween(turnU, 1, { at: 9.0, dur: 3.4, ease: ease.linear });

  // — beat 3 · the cached run pays MORE on turn one —
  tl.caption({
    at: 14.8,
    dur: 6.4,
    text: 'The bottom run pins a marker every turn. Its first request writes the prefix into the cache at a quarter premium — that is the one turn where caching is actually the more expensive run.',
  });
  tl.tween(cam, CAM_BOT, { at: 15.0, dur: 1.3, ease: ease.move });
  tl.tween(writeChipU, 1, { at: 16.2, dur: 0.7, ease: ease.pop });

  // — beat 4 · from then on, read cheap, write the suffix —
  tl.caption({
    at: 21.8,
    dur: 6.6,
    text: 'From then on, every request reads yesterday’s transcript from the shelf at a tenth, pays full rate only for the roughly three thousand new tokens, and moves the marker to the new end of the conversation.',
  });
  tl.tween(writeChipU, 0, { at: 22.0, dur: 0.5, ease: ease.enter });
  tl.tween(turnU, 4, { at: 22.4, dur: 5.4, ease: ease.linear });

  // — beat 5 · the meters separate —
  tl.caption({
    at: 28.8,
    dur: 5.4,
    text: 'Watch the meters separate. Same conversation, same replies, same tokens — different bills.',
  });
  tl.tween(cam, CAM_WIDE, { at: 29.0, dur: 1.4, ease: ease.move });
  tl.tween(turnU, 6, { at: 29.4, dur: 4.2, ease: ease.linear });

  // — beat 6 · turn ten —
  tl.caption({
    at: 34.8,
    dur: 6.0,
    text: 'By turn ten, the uncached run has billed one hundred seventy five thousand token units of input. The cached run: about fifty three thousand.',
  });
  tl.tween(turnU, 10, { at: 35.0, dur: 5.0, ease: ease.linear });

  // — beat 7 · seventy percent —
  tl.caption({
    at: 41.4,
    dur: 6.0,
    text: 'That is roughly seventy percent off the input bill. And the cached turns come back faster, too — the model skips the re-read itself, not just the charge for it.',
  });
  tl.tween(ratioU, 1, { at: 42.0, dur: 0.7, ease: ease.pop });

  // — beat 8 · honest books —
  tl.caption({
    at: 48.0,
    dur: 6.2,
    text: 'The client library keeps honest books either way. Its tool runner totals the context as fresh tokens plus cache writes plus cache reads — three fields, straight off the usage block.',
  });
  tl.tween(booksU, 1, { at: 48.6, dur: 0.8, ease: ease.enter });

  // — beat 9 · recap: the stateless tape —
  tl.caption({
    at: 54.8,
    dur: 5.6,
    text: 'So that is the whole story. A stateless interface means the model re-reads your transcript on every single turn.',
  });
  tl.tween(dimU, 1, { at: 55.0, dur: 1.0, ease: ease.move });
  tl.tween(recapU, 1, { at: 55.8, dur: 0.8, ease: ease.enter });
  tl.tween(glyphsU, 0.25, { at: 56.6, dur: 0.9, ease: ease.move });

  // — beat 10 · recap: prefix, marker, fuse —
  tl.caption({
    at: 61.0,
    dur: 6.2,
    text: 'A cache saves that read — but only for a byte identical prefix, only up to your marker, and only for five minutes at a time unless you keep it warm.',
  });
  tl.tween(glyphsU, 0.75, { at: 61.6, dur: 1.6, ease: ease.move });

  // — beat 11 · the closing law —
  tl.caption({
    at: 67.8,
    dur: 6.8,
    text: 'Writes cost a quarter more, reads cost a tenth, and a single reuse pays the difference. Keep the prefix stable, keep appending — and stop paying the model to re-read what it has already read.',
  });
  tl.tween(glyphsU, 1, { at: 68.2, dur: 1.0, ease: ease.move });
  tl.hold(74.8, 1.6);

  return { tl, cam, lanesU, turnU, writeChipU, ratioU, booksU, dimU, recapU, glyphsU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

function Odometer({ x, y, value, label, color, opacity }: { x: number; y: number; value: number; label: string; color: string; opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <text x={x} y={y} textAnchor="end" fill={color} fontSize={30} fontFamily={MONO} fontWeight={600}>
        {Math.round(value).toLocaleString('en-US')}
      </text>
      <text x={x} y={y + 20} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const lanesU = s.get(scene.lanesU);
  const turnU = s.get(scene.turnU);
  const writeChipU = s.get(scene.writeChipU);
  const ratioU = s.get(scene.ratioU);
  const booksU = s.get(scene.booksU);
  const dimU = s.get(scene.dimU);
  const recapU = s.get(scene.recapU);
  const glyphsU = s.get(scene.glyphsU);

  const machineOp = lanesU * (1 - 0.88 * dimU);
  const completed = Math.min(TURNS, Math.floor(turnU + 1e-6));
  const frac = clamp01(turnU - completed >= 0 ? turnU - completed : 0);
  const historyTokens = PER_TURN * (completed + clamp01((frac - 0.75) / 0.25));
  const pulse = pulseAt(turnU);
  const turnLabel = Math.min(TURNS, Math.floor(turnU) + (turnU > 0 ? 1 : 0));

  const costNo = costAt(CUM_NO, turnU);
  const costCa = costAt(CUM_CACHE, turnU);

  // widths (stage px) for the read-flash overlays
  const promptTokens = BASE + PER_TURN * Math.min(completed, TURNS - 1);
  const promptW = (Math.min(promptTokens, CAPACITY) / CAPACITY) * BAR_W;
  const suffixW = (PER_TURN / CAPACITY) * BAR_W;

  const topSegments = [
    { label: 'system + tools', value: BASE, color: colors.SECONDARY },
    { label: 'transcript', value: historyTokens, color: colors.MUTED },
  ];
  const botSegments = [
    { label: 'system + tools', value: BASE, color: colors.SECONDARY },
    { label: 'transcript — cached', value: historyTokens, color: colors.ACCENT },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={machineOp}>
          {/* shared clock */}
          <text x={640} y={120} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontFamily={MONO}>
            turn {Math.max(1, turnLabel)} of {TURNS}
          </text>
          <text x={640} y={142} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
            same agent, same ten turns — two billing meters
          </text>

          {/* ─ lane one: no caching ─ */}
          <text x={LANE_X} y={TOP_Y - 40} fill={colors.NEGATIVE} fontSize={14} fontWeight={700}>
            WITHOUT CACHING
          </text>
          <ContextBar x={LANE_X} y={TOP_Y} w={BAR_W} h={BAR_H} capacity={CAPACITY} segments={topSegments} reveal={lanesU} title="context — re-read in full every turn" />
          {/* full-width read flash: every token at full price */}
          <rect x={LANE_X} y={TOP_Y} width={promptW} height={BAR_H} rx={6} fill={colors.NEGATIVE} opacity={0.5 * pulse} />
          {pulse > 0.05 && (
            <text x={LANE_X + promptW + 10} y={TOP_Y + BAR_H / 2 + 4} fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO} opacity={pulse}>
              × 1.0 all of it
            </text>
          )}
          <Odometer x={ODO_X} y={TOP_Y + 14} value={costNo} label="token units billed" color={colors.NEGATIVE} opacity={lanesU} />

          {/* ─ lane two: cached ─ */}
          <text x={LANE_X} y={BOT_Y - 40} fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
            WITH CACHING
          </text>
          <ContextBar x={LANE_X} y={BOT_Y} w={BAR_W} h={BAR_H} capacity={CAPACITY} segments={botSegments} reveal={lanesU} title="context — prefix read from cache" />
          {/* prefix shimmer (cheap read) + suffix flash (the only full-price part) */}
          <rect x={LANE_X} y={BOT_Y} width={Math.max(0, promptW - suffixW)} height={BAR_H} rx={6} fill={colors.ACCENT} opacity={0.35 * pulse} />
          <rect x={LANE_X + Math.max(0, promptW - suffixW)} y={BOT_Y} width={Math.min(suffixW, promptW)} height={BAR_H} rx={3} fill={colors.WARM} opacity={0.6 * pulse} />
          {pulse > 0.05 && (
            <text x={LANE_X + promptW + 10} y={BOT_Y + BAR_H / 2 + 4} fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO} opacity={pulse}>
              × 0.1 prefix · × 1.25 new
            </text>
          )}
          <Odometer x={ODO_X} y={BOT_Y + 14} value={costCa} label="token units billed" color={colors.POSITIVE} opacity={lanesU} />

          {/* turn-one write premium chip */}
          <g opacity={writeChipU}>
            <rect x={LANE_X} y={BOT_Y + 52} width={420} height={32} rx={9} fill={colors.BG} stroke={colors.WARM} />
            <text x={LANE_X + 14} y={BOT_Y + 73} fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
              turn 1: 4,000 × 1.25 = 5,000 — the write premium
            </text>
          </g>

          {/* the ~70% chip */}
          <g opacity={ratioU}>
            <rect x={880} y={300} width={260} height={64} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
            <text x={1010} y={328} textAnchor="middle" fill={colors.POSITIVE} fontSize={20} fontWeight={700}>
              ≈ 70% saved
            </text>
            <text x={1010} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
              53,150 vs 175,000
            </text>
          </g>

          {/* the tool runner's accounting */}
          <g opacity={booksU}>
            <rect x={LANE_X} y={548} width={720} height={34} rx={9} fill={colors.BG} stroke={colors.GRID} />
            <text x={LANE_X + 14} y={570} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              total = input_tokens + cache_creation_input_tokens + cache_read_input_tokens
            </text>
          </g>
        </g>

        {/* the recap card */}
        <g opacity={recapU}>
          <rect x={250} y={190} width={780} height={260} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={240} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={600}>
            Stop paying for the re-read.
          </text>
          {/* four glyphs: the tape · the match · the fuse · the crossover */}
          {(
            [
              { label: 'stateless re-read', draw: 0 },
              { label: 'byte-identical prefix', draw: 1 },
              { label: 'marker + fuse', draw: 2 },
              { label: 'reads at a tenth', draw: 3 },
            ] as const
          ).map((g2, i) => {
            const u = clamp01(glyphsU * 4 - i);
            const gx = 320 + i * 168;
            return (
              <g key={i} opacity={u} transform={`translate(${gx}, 280)`}>
                <rect width={130} height={96} rx={12} fill={colors.BG} stroke={colors.GRID} />
                {i === 0 && (
                  <g>
                    {[0, 1, 2, 3, 4].map((j) => (
                      <rect key={j} x={14 + j * 21} y={22} width={16} height={22} rx={3} fill={colors.MUTED} opacity={0.7} />
                    ))}
                    <rect x={14 + 104 * u} y={14} width={3} height={38} fill={colors.WARM} />
                  </g>
                )}
                {i === 1 && (
                  <g>
                    {[0, 1, 2, 3, 4].map((j) => (
                      <g key={j}>
                        <rect x={14 + j * 21} y={16} width={16} height={14} rx={3} fill={colors.SECONDARY} opacity={0.55} />
                        <rect x={14 + j * 21} y={36} width={16} height={14} rx={3} fill={j < 4 ? colors.SECONDARY : colors.NEGATIVE} opacity={0.75} />
                      </g>
                    ))}
                  </g>
                )}
                {i === 2 && (
                  <g>
                    <line x1={30} y1={18} x2={30} y2={50} stroke={colors.POSITIVE} strokeWidth={2.5} />
                    <path d="M 30 18 h 30 l -6 7 l 6 7 h -30 z" fill={colors.POSITIVE} />
                    <circle cx={92} cy={34} r={16} fill="none" stroke={colors.WARM} strokeWidth={3} strokeDasharray="75 26" />
                  </g>
                )}
                {i === 3 && (
                  <g>
                    <line x1={14} y1={52} x2={116} y2={12} stroke={colors.NEGATIVE} strokeWidth={2.5} />
                    <line x1={14} y1={50} x2={116} y2={40} stroke={colors.POSITIVE} strokeWidth={2.5} />
                  </g>
                )}
                <text x={65} y={80} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                  {g2.label}
                </text>
              </g>
            );
          })}
          <text x={640} y={424} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            writes × 1.25 · reads × 0.10 · five-minute fuse, refreshed on every hit
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
