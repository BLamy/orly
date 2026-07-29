// Written for the Ear
//
// Backed by: generator/video.mjs — speakabilityProblems() rejects captions
// containing URLs/domains/extensions, code punctuation, hex ids, machine ids,
// camelCase, function calls, and unspoken acronyms, and the build exits 1
// before any narration is bought — and generator/tts.mjs — synthesizeChapter()
// joins the clean lines with '\n\n' paragraph breaks, calls ElevenLabs
// convertWithTimestamps once per chapter, and reads each caption's cue
// straight out of characterStartTimesSeconds (then trims the tail to the
// alignment end). The gauntlet is the visual; the waveform + cue pins are the
// payoff.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { GauntletRail } from '../../agent';
import { ProgressRing, RING } from './ring';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — 1280×720; captions own the bottom ~12% (y ≳ 633).
// ---------------------------------------------------------------------------

const RAIL = { x: 200, y: 268, w: 880 } as const;
/** The real checks in speakabilityProblems(), in order. */
const GATE_LABELS = ['url', 'code punct', 'hex id', 'camelCase', 'call()', 'acronym'];
const gateX = (i: number) => RAIL.x + (RAIL.w / (GATE_LABELS.length - 1)) * i;

const CARD = { x: 340, y: 108, w: 600, h: 64 } as const;
const BAD_TEXT = 'Then registerSlot() fires again.';
const GOOD_TEXT = 'Then registering the slot fires again.';

/** Where the exact identifier lands when it moves out of the voice line. */
const CODE_SLOT = { x: 985, y: 120, w: 200, h: 46 } as const;

// ---- the waveform, precomputed at module scope ----------------------------
const WAVE = { x: 170, y: 470, w: 940, bars: 220, amp: 64 } as const;
/** Paragraph-break silences between the three spoken lines. */
const GAPS: Array<[number, number]> = [
  [68, 78],
  [138, 149],
];
/** First bar of each line = its cue (the first character's start time). */
const CUE_BARS = [2, 78, 149];
const CUE_LABELS = ['0.00s', '6.31s', '12.85s'];
const TRIM_BAR = 206; // alignment end — everything after is TTS mumble

const barH: number[] = (() => {
  const rand = mulberry32(42);
  const out: number[] = [];
  for (let i = 0; i < WAVE.bars; i++) {
    const inGap = GAPS.some(([a, b]) => i >= a && i < b);
    const speech = inGap ? 0.03 : 0.28 + 0.62 * Math.abs(Math.sin(i * 0.31) * Math.sin(i * 0.071 + 1.7));
    out.push(clamp01(speech + (rand() - 0.5) * 0.14));
  }
  return out;
})();
const barX = (i: number) => WAVE.x + (i / (WAVE.bars - 1)) * WAVE.w;

// camera marks
const CAM_RAIL: CameraState = { x: 640, y: 226, k: 1.3 };
const CAM_BOUNCE: CameraState = { x: gateX(3), y: 250, k: 1.55 };
const CAM_WAVE: CameraState = { x: 640, y: 440, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  railU: ChannelRef<number>;
  sweep: ChannelRef<number>;
  cardU: ChannelRef<number>;
  tokU: ChannelRef<number>;
  gates: ChannelRef<number>[];
  arcU: ChannelRef<number>;
  exitU: ChannelRef<number>;
  rewriteU: ChannelRef<number>;
  codeMove: ChannelRef<number>;
  railDim: ChannelRef<number>;
  waveU: ChannelRef<number>;
  joinU: ChannelRef<number>;
  alignU: ChannelRef<number>;
  pinU: ChannelRef<number>;
  chipU: ChannelRef<number>;
  trimU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  ringU: ChannelRef<number>;
  litU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const railU = tl.channel('railU', 0);
  const sweep = tl.channel('sweep', 0); // gate labels pulse left → right
  const cardU = tl.channel('cardU', 0);
  const tokU = tl.channel('tokU', -1); // token position in gate units
  const gates = GATE_LABELS.map((_, i) => tl.channel(`g${i}`, 0));
  const arcU = tl.channel('arcU', 0);
  const exitU = tl.channel('exitU', 0);
  const rewriteU = tl.channel('rewriteU', 0);
  const codeMove = tl.channel('codeMove', 0);
  const railDim = tl.channel('railDim', 0);
  const waveU = tl.channel('waveU', 0);
  const joinU = tl.channel('joinU', 0);
  const alignU = tl.channel('alignU', 0);
  const pinU = tl.channel('pinU', 0);
  const chipU = tl.channel('chipU', 0);
  const trimU = tl.channel('trimU', 0);
  const dimU = tl.channel('dimU', 0);
  const ringU = tl.channel('ringU', 0);
  const litU = tl.channel('litU', 0);

  // — Beat 1 · the rule —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Station three: the voice. Eleven Labs reads every caption exactly as written — so the build refuses to narrate anything a voice would mangle.',
  });
  tl.tween(cam, CAM_RAIL, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(railU, 1, { at: 1.0, dur: 2.2, ease: ease.draw });

  // — Beat 2 · the gauntlet —
  tl.caption({
    at: 7.5,
    dur: 7,
    text: 'Before a cent is spent on audio, every line runs this gauntlet: no web addresses, no code punctuation, no hex, no identifiers, no alphabet soup.',
  });
  tl.tween(sweep, 1, { at: 8.0, dur: 4.5, ease: ease.linear });
  tl.hold(14.5, 0.6);

  // — Beat 3 · a bad line arrives —
  tl.caption({
    at: 15.1,
    dur: 6,
    text: 'Here comes a line with a function name inside it. It reads fine on screen — but a narrator would choke on it.',
  });
  tl.tween(cardU, 1, { at: 15.4, dur: 0.7, ease: ease.enter });
  tl.set(tokU, 0, 16.6);
  tl.tween(tokU, 2, { at: 16.8, dur: 2.4, ease: ease.linear });
  tl.tween(gates[0], 1, { at: 17.0, dur: 0.5, ease: ease.pop });
  tl.tween(gates[1], 1, { at: 18.0, dur: 0.5, ease: ease.pop });
  tl.tween(gates[2], 1, { at: 19.0, dur: 0.5, ease: ease.pop });

  // — Beat 4 · bounced —
  tl.caption({
    at: 21.4,
    dur: 6,
    text: "Bounced. The gate flags the identifier, the build exits with an error, and no narration is bought until it's fixed.",
  });
  tl.tween(cam, CAM_BOUNCE, { at: 21.5, dur: 1.2, ease: ease.move });
  tl.tween(tokU, 3, { at: 21.6, dur: 1.0, ease: ease.linear });
  tl.tween(gates[3], -1, { at: 22.6, dur: 0.4, ease: ease.pop });
  tl.set(tokU, -1, 23.0);
  tl.tween(arcU, 1, { at: 23.0, dur: 1.3, ease: ease.move });
  tl.tween(exitU, 1, { at: 23.4, dur: 0.5, ease: ease.pop });
  tl.hold(26.8, 0.6);

  // — Beat 5 · move the code, keep the meaning —
  tl.caption({
    at: 27.4,
    dur: 7,
    text: 'The fix is not to delete the name — it is to move it. The exact code goes on screen, where text belongs. The voice gets plain words.',
  });
  tl.tween(cam, CAM_RAIL, { at: 27.6, dur: 1.3, ease: ease.move });
  tl.tween(gates[3], 0, { at: 27.8, dur: 0.8, ease: ease.move });
  tl.tween(gates[0], 0, { at: 27.8, dur: 0.8, ease: ease.move });
  tl.tween(gates[1], 0, { at: 27.8, dur: 0.8, ease: ease.move });
  tl.tween(gates[2], 0, { at: 27.8, dur: 0.8, ease: ease.move });
  tl.set(arcU, 0, 28.4);
  tl.tween(exitU, 0, { at: 28.0, dur: 0.6, ease: ease.move });
  tl.tween(codeMove, 1, { at: 29.4, dur: 1.4, ease: ease.move });
  tl.tween(rewriteU, 1, { at: 31.2, dur: 1.2, ease: ease.move });

  // — Beat 6 · the clean run —
  tl.caption({
    at: 34.8,
    dur: 5.5,
    text: 'Same line, rewritten for the ear. This time it clears every gate.',
  });
  tl.set(tokU, 0, 35.2);
  tl.tween(tokU, 5, { at: 35.4, dur: 3.6, ease: ease.linear });
  GATE_LABELS.forEach((_, i) => {
    tl.tween(gates[i], 1, { at: 35.6 + i * 0.7, dur: 0.5, ease: ease.pop });
  });
  tl.hold(40.4, 0.6);

  // — Beat 7 · one request per chapter —
  tl.caption({
    at: 41.0,
    dur: 7,
    text: 'The clean lines are joined with paragraph breaks — a natural breath between sentences — and sent to the voice in one request per chapter.',
  });
  tl.tween(railDim, 1, { at: 41.2, dur: 1.0, ease: ease.move });
  tl.tween(cardU, 0, { at: 41.2, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_WAVE, { at: 41.4, dur: 1.5, ease: ease.move });
  tl.tween(joinU, 1, { at: 42.0, dur: 1.4, ease: ease.enter });
  tl.tween(waveU, 1, { at: 43.6, dur: 3.4, ease: ease.linear });

  // — Beat 8 · character timestamps —
  tl.caption({
    at: 48.6,
    dur: 6,
    text: 'The answer comes back with a timestamp for every single character. Not every word — every character.',
  });
  tl.tween(alignU, 1, { at: 49.2, dur: 3.6, ease: ease.linear });

  // — Beat 9 · cues are lookups —
  tl.caption({
    at: 55.2,
    dur: 6,
    text: 'So finding where each caption begins is just a lookup — the second its first character starts. Those three numbers are the cues.',
  });
  tl.tween(pinU, 1, { at: 55.8, dur: 2.4, ease: ease.move });

  // — Beat 10 · the recording becomes the clock —
  tl.caption({
    at: 61.8,
    dur: 6.5,
    text: "The cues ship in the book's manifest. At playback the recording is the clock, and every caption waits for its own first word.",
  });
  tl.tween(chipU, 1, { at: 62.4, dur: 1.6, ease: ease.move });

  // — Beat 11 · the trim + station three —
  tl.caption({
    at: 68.9,
    dur: 7.5,
    text: 'One last trim — the voice sometimes mumbles past the end, so the file is cut where the alignment stops. Station three is done: the book can speak.',
  });
  tl.tween(trimU, 1, { at: 69.4, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 71.4, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 71.8, dur: 1.2, ease: ease.move });
  tl.tween(ringU, 1, { at: 72.8, dur: 1.8, ease: ease.draw });
  tl.tween(litU, 1, { at: 75.0, dur: 0.8, ease: ease.pop });
  tl.hold(77.5, 1.5);

  return {
    tl, cam, railU, sweep, cardU, tokU, gates, arcU, exitU, rewriteU, codeMove,
    railDim, waveU, joinU, alignU, pinU, chipU, trimU, dimU, ringU, litU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const railU = s.get(scene.railU);
  const sweep = s.get(scene.sweep);
  const cardU = s.get(scene.cardU);
  const tokU = s.get(scene.tokU);
  const gateStates = scene.gates.map((g) => s.get(g));
  const arcU = s.get(scene.arcU);
  const exitU = s.get(scene.exitU);
  const rewriteU = s.get(scene.rewriteU);
  const codeMove = s.get(scene.codeMove);
  const railDim = s.get(scene.railDim);
  const waveU = s.get(scene.waveU);
  const joinU = s.get(scene.joinU);
  const alignU = s.get(scene.alignU);
  const pinU = s.get(scene.pinU);
  const chipU = s.get(scene.chipU);
  const trimU = s.get(scene.trimU);
  const dimU = s.get(scene.dimU);
  const ringU = s.get(scene.ringU);
  const litU = s.get(scene.litU);

  const worldOp = 1 - 0.88 * dimU;
  const cardText = rewriteU > 0.5 ? GOOD_TEXT : BAD_TEXT;
  const cardStroke = rewriteU > 0.5 ? colors.POSITIVE : exitU > 0.3 ? colors.NEGATIVE : colors.GRID;

  // the identifier chip slides from inside the card to the on-screen slot
  const chipX0 = CARD.x + 120;
  const chipY0 = CARD.y + CARD.h + 10;
  const chipX = chipX0 + (CODE_SLOT.x - chipX0) * codeMove;
  const chipY = chipY0 + (CODE_SLOT.y + 12 - chipY0) * codeMove;

  const trimBarX = barX(TRIM_BAR);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the caption card on trial ---- */}
          {cardU > 0 && (
            <g opacity={cardU}>
              <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={12} fill={colors.PANEL} stroke={cardStroke} strokeWidth={1.6} />
              <text x={CARD.x + 20} y={CARD.y + 26} fill={colors.MUTED} fontSize={11.5}>
                spoken line
              </text>
              <text x={CARD.x + 20} y={CARD.y + 48} fill={colors.TEXT} fontSize={16} fontFamily={rewriteU > 0.5 ? undefined : MONO}>
                {cardText}
              </text>
              {/* the identifier, escorted out of the voice and onto the stage */}
              {codeMove > 0 && (
                <g>
                  <rect x={chipX - 92} y={chipY - 16} width={184} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
                  <text x={chipX} y={chipY + 4} textAnchor="middle" fill={colors.WARM} fontSize={13.5} fontFamily={MONO}>
                    registerSlot()
                  </text>
                </g>
              )}
              {codeMove > 0.8 && (
                <text x={CODE_SLOT.x} y={CODE_SLOT.y - 22} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontStyle="italic" opacity={(codeMove - 0.8) * 5}>
                  on-screen label — where code belongs
                </text>
              )}
            </g>
          )}

          {/* ---- the gauntlet ---- */}
          <g opacity={1 - 0.75 * railDim}>
            <GauntletRail
              x={RAIL.x}
              y={RAIL.y}
              w={RAIL.w}
              gates={GATE_LABELS.map((label, i) => ({ label, state: gateStates[i] }))}
              u={tokU}
              reveal={railU}
              arcU={arcU}
              arcFrom={3}
              tokenColor={rewriteU > 0.5 ? colors.POSITIVE : colors.ACCENT}
            />
            {/* sweep pulse over the gate labels */}
            {sweep > 0 && sweep < 1 && (
              <circle cx={RAIL.x + RAIL.w * sweep} cy={RAIL.y} r={16} fill={colors.ACCENT} opacity={0.18} />
            )}
            {railU > 0.9 && (
              <text x={640} y={RAIL.y - 62} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={(railU - 0.9) * 10 * (1 - railDim)}>
                speakabilityProblems() · generator/video.mjs
              </text>
            )}
            {exitU > 0 && (
              <g opacity={exitU}>
                <rect x={gateX(3) - 40} y={RAIL.y + 62} width={80} height={28} rx={7} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.5} />
                <text x={gateX(3)} y={RAIL.y + 81} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5} fontFamily={MONO} fontWeight={700}>
                  exit 1
                </text>
              </g>
            )}
          </g>

          {/* ---- the waveform ---- */}
          {joinU > 0 && (
            <g opacity={joinU}>
              <rect x={WAVE.x - 30} y={368} width={WAVE.w + 60} height={228} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={WAVE.x} y={394} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
                one chapter, one recording
              </text>
              <text x={WAVE.x + WAVE.w} y={394} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                convertWithTimestamps · generator/tts.mjs
              </text>

              {/* bars */}
              {barH.map((h, i) => {
                const u = clamp01(waveU * (WAVE.bars + 30) - i);
                if (u <= 0) return null;
                const cut = trimU > 0 && i > TRIM_BAR;
                const H = WAVE.amp * h * u * (cut ? 1 - trimU : 1);
                if (H < 0.4) return null;
                const inGap = GAPS.some(([a, b]) => i >= a && i < b);
                return (
                  <rect
                    key={i}
                    x={barX(i) - 1.4}
                    y={WAVE.y - H}
                    width={2.8}
                    height={H * 2}
                    rx={1.4}
                    fill={cut ? colors.NEGATIVE : inGap ? colors.MUTED : colors.ACCENT}
                    opacity={cut ? 0.75 : inGap ? 0.4 : 0.85}
                  />
                );
              })}

              {/* paragraph-break markers */}
              {waveU > 0.6 &&
                GAPS.map(([a, b], k) => (
                  <text key={k} x={(barX(a) + barX(b)) / 2} y={WAVE.y - WAVE.amp - 10} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={(waveU - 0.6) * 2.5}>
                    ¶
                  </text>
                ))}

              {/* per-character alignment ticks */}
              {alignU > 0 && (
                <g>
                  {Array.from({ length: 110 }, (_, i) => {
                    const u = clamp01(alignU * 120 - i);
                    if (u <= 0) return null;
                    const x = WAVE.x + (i / 109) * WAVE.w;
                    return <line key={i} x1={x} y1={WAVE.y + WAVE.amp + 12} x2={x} y2={WAVE.y + WAVE.amp + 18} stroke={colors.SECONDARY} strokeWidth={1.2} opacity={0.35 + 0.5 * u} />;
                  })}
                  <text x={WAVE.x} y={WAVE.y + WAVE.amp + 36} fill={colors.SECONDARY} fontSize={11} fontFamily={MONO} opacity={clamp01(alignU * 3)}>
                    characterStartTimesSeconds
                  </text>
                </g>
              )}

              {/* cue pins */}
              {CUE_BARS.map((b, i) => {
                const u = clamp01(pinU * (CUE_BARS.length + 0.5) - i);
                if (u <= 0) return null;
                const x = barX(b);
                const yTop = 402;
                const y = yTop + (WAVE.y - WAVE.amp - 14 - yTop) * u;
                return (
                  <g key={i}>
                    <line x1={x} y1={y} x2={x} y2={WAVE.y + WAVE.amp * barH[b]} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="2 4" opacity={0.8 * u} />
                    <circle cx={x} cy={y} r={11} fill={colors.WARM} opacity={u} />
                    <text x={x} y={y + 4.5} textAnchor="middle" fill={colors.BG} fontSize={12} fontWeight={700} opacity={u}>
                      {i + 1}
                    </text>
                    {u > 0.8 && (
                      <text x={x + 16} y={y + 4} fill={colors.WARM} fontSize={11.5} fontFamily={MONO} opacity={(u - 0.8) * 5}>
                        {CUE_LABELS[i]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* the manifest chip: cues become data */}
              {chipU > 0 && (
                <g opacity={chipU}>
                  <rect x={640 - 190} y={WAVE.y + WAVE.amp + 44} width={380} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
                  <text x={640} y={WAVE.y + WAVE.amp + 64} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                    manifest.json · cues: [0.00, 6.31, 12.85]
                  </text>
                </g>
              )}

              {/* the trim */}
              {trimU > 0 && (
                <g opacity={clamp01(trimU * 2)}>
                  <line x1={trimBarX} y1={WAVE.y - WAVE.amp - 16} x2={trimBarX} y2={WAVE.y + WAVE.amp + 8} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="5 4" />
                  <text x={trimBarX + 6} y={WAVE.y - WAVE.amp - 4} fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>
                    ✂ audio end
                  </text>
                </g>
              )}
            </g>
          )}
        </g>

        {/* ---- ring finale ---- */}
        <ProgressRing ringU={ringU} lit={3} litU={litU} />
        {litU > 0 && (
          <text x={RING.cx} y={RING.cy + 8} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic" opacity={litU}>
            the book can speak
          </text>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
