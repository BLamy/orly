// The Stream That Survives
//
// Grounding: electric.ax/streams.md ("Streaming needs to be durable": SSE
// drops on a refresh, tokens get lost on flaky networks, resuming means
// re-running the request and re-billing the LLM) and PROTOCOL.md §1
// (durable, append-only byte streams with offset-based replay; use case:
// "AI conversation histories and token streaming").
//
// Centerpiece: the same token stream twice. First a direct pipe — a refresh
// snaps it, in-flight tokens fall off the stage, the bill doubles on the
// re-run. Then the durable tape is interposed: tokens append to the tape at
// numbered positions, the reader tails with a bookmark, and the same refresh
// costs nothing — resume from the offset, replay only what was missed.
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
import { Connection, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
/** Per-item window over one 0..1 driver channel (the stagger trick). */
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — model and browser up top, the tape machine below.
// ---------------------------------------------------------------------------

const MODEL = { x: 200, y: 190 } as const;
const BROWSER = { x: 1080, y: 190 } as const;
const PIPE_Y = 190;
const PIPE_X0 = MODEL.x + 78;
const PIPE_X1 = BROWSER.x - 78;

const BILL = { x: 640, y: 76 } as const;

const TAPE = { x0: 330, y: 452, cellW: 47, cellH: 42, n: 14 } as const;
const TAPE_ZONE = { x: 280, y: 396, w: 760, h: 150 } as const;
const cellX = (i: number): number => TAPE.x0 + i * TAPE.cellW;

// the agent's answer, one token per append (the throughline data)
const TOKENS = [
  'The', 'spike', 'comes', 'from', 'a', 'cache', 'miss', 'storm',
  'after', 'the', 'mid', 'night', 'key', 'flush',
] as const;
const N = TOKENS.length;
const FIRST_WAVE = 8; // tokens delivered before the refresh snaps the pipe
const READ_BOOKMARK = 8; // cells the reader has consumed when it vanishes

// camera marks
const CAM_PIPE: CameraState = { x: 640, y: 210, k: 1.22 };
const CAM_BREAK: CameraState = { x: 640, y: 220, k: 1.55 };
const CAM_TAPE: CameraState = { x: 655, y: 400, k: 1.18 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~68s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PIPE, cameraInterp);

  const nodesU = tl.channel('nodesU', 0); // model + browser enter
  const pipeU = tl.channel('pipeU', 0); // direct connection draw-on
  const flow1U = tl.channel('flow1U', 0); // first token wave along the pipe
  const snapU = tl.channel('snapU', 0); // the refresh — pipe breaks
  const fallU = tl.channel('fallU', 0); // in-flight tokens fall away
  const flow2U = tl.channel('flow2U', 0); // the re-run wave
  const twiceU = tl.channel('twiceU', 0); // "billed twice" flash
  const wireU = tl.channel('wireU', 0); // "remembers nothing" ghost label
  const phaseU = tl.channel('phaseU', 0); // direct-pipe layer fades away
  const tapeU = tl.channel('tapeU', 0); // durable stream zone + rail draw-on
  const appendU = tl.channel('appendU', 0); // cells 0..9 land on the tape
  const readerU = tl.channel('readerU', 0); // playhead enters + consumes
  const goneU = tl.channel('goneU', 0); // reader vanishes (second refresh)
  const append2U = tl.channel('append2U', 0); // cells 10..13 land while gone
  const backU = tl.channel('backU', 0); // reader returns with its bookmark
  const catchU = tl.channel('catchU', 0); // replay sweep bookmark → tail
  const flatU = tl.channel('flatU', 0); // "meter did not move" chip
  const dimU = tl.channel('dimU', 0); // machine fades under the closing card
  const cardU = tl.channel('cardU', 0); // durable · addressable · replayable

  // — beat 1 · an agent mid-answer, tokens on a live wire —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Here is an agent halfway through an answer. The model is streaming tokens to the browser, one at a time, over a single live connection.',
  });
  tl.tween(nodesU, 1, { at: 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(pipeU, 1, { at: 1.2, dur: 1.2, ease: ease.draw });
  tl.tween(flow1U, FIRST_WAVE / N, { at: 2.4, dur: 5.4, ease: ease.linear });
  tl.hold(6.5, 0.3);

  // — beat 2 · the refresh: the pipe snaps —
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'Now the user refreshes the page. The connection dies with the tab, and every token still in flight dies with it.',
  });
  tl.tween(flow1U, (FIRST_WAVE + 2.6) / N, { at: 6.8, dur: 2.2, ease: ease.linear });
  tl.tween(snapU, 1, { at: 9.0, dur: 0.5, ease: ease.pop });
  tl.tween(fallU, 1, { at: 9.3, dur: 1.8, ease: ease.move });
  tl.hold(12.2, 0.4);

  // — beat 3 · the only fix is to pay again —
  tl.caption({
    at: 12.6,
    dur: 6.2,
    text: 'There is no way to ask for just the missing piece. The only move is to run the whole request again — and pay the model for every token a second time.',
  });
  tl.tween(snapU, 0, { at: 13.4, dur: 0.8, ease: ease.move }); // new connection
  tl.tween(flow2U, 1, { at: 14.4, dur: 3.6, ease: ease.linear });
  tl.tween(twiceU, 1, { at: 16.6, dur: 0.6, ease: ease.pop });
  tl.hold(18.8, 0.6);

  // — beat 4 · diagnosis: the wire remembers nothing —
  tl.caption({
    at: 19.4,
    dur: 5.8,
    text: 'The problem is not the model or the browser. The wire between them remembered nothing — the moment a byte left it, that byte was gone.',
  });
  tl.tween(cam, CAM_BREAK, { at: 19.6, dur: 1.4, ease: ease.move });
  tl.tween(wireU, 1, { at: 21.4, dur: 0.8, ease: ease.enter });
  tl.hold(25.2, 0.4);

  // — beat 5 · interpose the durable stream —
  tl.caption({
    at: 25.6,
    dur: 6.4,
    text: 'So Electric gives the stream a memory. Between writer and reader sits a durable stream — an append-only tape living at its own URL on the server.',
  });
  tl.tween(cam, CAM_WIDE, { at: 25.8, dur: 1.5, ease: ease.move });
  tl.tween(phaseU, 1, { at: 25.8, dur: 1.2, ease: ease.move });
  tl.tween(tapeU, 1, { at: 27.2, dur: 1.6, ease: ease.draw });
  tl.hold(32.0, 0.4);

  // — beat 6 · appends land, numbered and permanent —
  tl.caption({
    at: 32.4,
    dur: 6.2,
    text: 'Now the model appends every token to the tape first. Once a token lands at a position, it is acknowledged, numbered, and permanent.',
  });
  tl.tween(cam, CAM_TAPE, { at: 32.6, dur: 1.4, ease: ease.move });
  tl.tween(appendU, 1, { at: 33.0, dur: 5.4, ease: ease.linear });
  tl.hold(38.6, 0.4);

  // — beat 7 · the reader and its bookmark —
  tl.caption({
    at: 39.0,
    dur: 5.8,
    text: 'The browser reads from the tape instead, and keeps one bookmark: the offset of the last position it has seen.',
  });
  tl.tween(readerU, 1, { at: 39.4, dur: 4.6, ease: ease.move });
  tl.hold(44.8, 0.4);

  // — beat 8 · refresh again: nothing is lost —
  tl.caption({
    at: 45.2,
    dur: 6.0,
    text: 'Refresh again. The reader vanishes — and nothing is lost. The tape keeps recording, because the writer never even notices that the reader left.',
  });
  tl.tween(goneU, 1, { at: 45.8, dur: 0.7, ease: ease.enter });
  tl.tween(append2U, 1, { at: 46.8, dur: 3.8, ease: ease.linear });
  tl.hold(51.2, 0.4);

  // — beat 9 · resume from the offset, replay the gap —
  tl.caption({
    at: 51.6,
    dur: 6.2,
    text: 'When the tab comes back, it hands over the bookmark and replays only what it missed. No second run, no second bill — the meter does not move.',
  });
  tl.tween(backU, 1, { at: 52.0, dur: 0.8, ease: ease.enter });
  tl.tween(catchU, 1, { at: 53.0, dur: 2.6, ease: ease.move });
  tl.tween(flatU, 1, { at: 55.8, dur: 0.6, ease: ease.pop });
  tl.hold(57.8, 0.6);

  // — beat 10 · the properties, on a quiet stage —
  tl.caption({
    at: 58.6,
    dur: 7.0,
    text: 'That is the whole trick, and this book unpacks it. A stream that survives is durable, addressable, and replayable — and this platform builds everything else on top of it.',
  });
  tl.tween(cam, CAM_WIDE, { at: 58.8, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 58.8, dur: 1.2, ease: ease.move });
  tl.tween(cardU, 1, { at: 60.4, dur: 0.9, ease: ease.pop });
  tl.hold(65.6, 1.6);

  return {
    tl, cam, nodesU, pipeU, flow1U, snapU, fallU, flow2U, twiceU, wireU,
    phaseU, tapeU, appendU, readerU, goneU, append2U, backU, catchU, flatU,
    dimU, cardU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

/** Position of token i on the direct pipe for a wave driver p. */
function pipePos(p: number, i: number): { u: number; x: number; y: number } {
  const u = win(p, N, i, 3.2);
  return { u, x: PIPE_X0 + (PIPE_X1 - PIPE_X0) * u, y: PIPE_Y };
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const nodesU = s.get(scene.nodesU);
  const pipeU = s.get(scene.pipeU);
  const flow1U = s.get(scene.flow1U);
  const snapU = s.get(scene.snapU);
  const fallU = s.get(scene.fallU);
  const flow2U = s.get(scene.flow2U);
  const twiceU = s.get(scene.twiceU);
  const wireU = s.get(scene.wireU);
  const phaseU = s.get(scene.phaseU);
  const tapeU = s.get(scene.tapeU);
  const appendU = s.get(scene.appendU);
  const readerU = s.get(scene.readerU);
  const goneU = s.get(scene.goneU);
  const append2U = s.get(scene.append2U);
  const backU = s.get(scene.backU);
  const catchU = s.get(scene.catchU);
  const flatU = s.get(scene.flatU);
  const dimU = s.get(scene.dimU);
  const cardU = s.get(scene.cardU);

  const machineOp = 1 - 0.88 * dimU;
  const pipeLayerOp = (1 - 0.92 * phaseU) * machineOp;

  // ---- billing meter: wave 1 departures + the re-run pays for everything again
  const departed1 = Math.min(N, Math.floor(flow1U * (N + 3.2)));
  const departed2 = Math.min(N, Math.floor(flow2U * (N + 3.2)));
  const billed = departed1 + departed2;

  // ---- durable-phase appends: 10 cells, then 4 more while the reader is gone
  const CELLS_A = 10;
  const CELLS_B = N - CELLS_A;
  const landedA = appendU * CELLS_A;
  const landedB = append2U * CELLS_B;
  const landedTotal = Math.floor(landedA) + Math.floor(landedB);

  // reader playhead: consumes cells up to READ_BOOKMARK, then returns + catches up
  const readPos = readerU * READ_BOOKMARK; // cells consumed pre-refresh
  const headCell = backU > 0 ? READ_BOOKMARK + catchU * (N - READ_BOOKMARK) : readPos;
  const headX = cellX(Math.min(headCell, N)) - TAPE.cellW / 2 + 2;
  const readerOp = (backU > 0 ? backU : readerU > 0 ? 1 - goneU : 0) * machineOp;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* model + browser */}
        <g opacity={machineOp}>
          <ServiceNode x={MODEL.x} y={MODEL.y} kind="external" label="model" sublabel="token stream" u={nodesU} />
          <ServiceNode
            x={BROWSER.x}
            y={BROWSER.y}
            kind="browser"
            label="browser"
            sublabel="the user's tab"
            u={nodesU}
            status={snapU > 0.5 || (goneU > 0.5 && backU < 0.3) ? 'down' : 'ok'}
          />
        </g>

        {/* billing meter — the stakes */}
        <g opacity={clamp01(flow1U * 8) * machineOp}>
          <text x={BILL.x} y={BILL.y} textAnchor="middle" fill={twiceU > 0.3 && flatU < 0.3 ? colors.NEGATIVE : colors.TEXT} fontSize={26} fontFamily={MONO} fontWeight={600}>
            {billed}
          </text>
          <text x={BILL.x} y={BILL.y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
            tokens billed
          </text>
          <g opacity={twiceU * (1 - 0.6 * phaseU)}>
            <rect x={BILL.x + 42} y={BILL.y - 22} width={104} height={26} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} />
            <text x={BILL.x + 94} y={BILL.y - 4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontWeight={600}>
              paid twice
            </text>
          </g>
          <g opacity={flatU}>
            <rect x={BILL.x + 42} y={BILL.y - 22} width={140} height={26} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
            <text x={BILL.x + 112} y={BILL.y - 4} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontWeight={600}>
              meter unchanged
            </text>
          </g>
        </g>

        {/* ---- phase A: the direct pipe ---- */}
        <g opacity={pipeLayerOp}>
          {/* the wire, whole or snapped */}
          {snapU < 0.5 ? (
            <Connection from={{ x: PIPE_X0, y: PIPE_Y }} to={{ x: PIPE_X1, y: PIPE_Y }} u={pipeU} label="one live connection" color={colors.ACCENT} />
          ) : (
            <g>
              <line x1={PIPE_X0} y1={PIPE_Y} x2={620 - 26 * snapU} y2={PIPE_Y + 10 * snapU} stroke={colors.NEGATIVE} strokeWidth={2} />
              <line x1={660 + 26 * snapU} y1={PIPE_Y + 14 * snapU} x2={PIPE_X1} y2={PIPE_Y} stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={640} y={PIPE_Y - 20} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={600}>
                refresh
              </text>
            </g>
          )}

          {/* wave 1 tokens: delivered, in-flight (falling on snap), or unsent */}
          {TOKENS.map((tok, i) => {
            const p = pipePos(flow1U, i);
            if (p.u <= 0) return null;
            const inFlight = p.u > 0.02 && p.u < 0.98;
            const dropped = snapU > 0.5 && inFlight;
            const dy = dropped ? fallU * fallU * 320 : 0;
            const op = dropped ? Math.max(0, 1 - fallU * 1.1) : p.u >= 0.98 ? 0.85 : 1;
            if (op <= 0) return null;
            return (
              <g key={i} opacity={op}>
                <rect x={p.x - 20} y={p.y - 12 + dy} width={40} height={22} rx={6} fill={dropped ? colors.NEGATIVE : colors.ACCENT} opacity={0.92} />
                <text x={p.x} y={p.y + 3 + dy} textAnchor="middle" fill={colors.BG} fontSize={11} fontFamily={MONO}>
                  {tok}
                </text>
              </g>
            );
          })}

          {/* the re-run wave */}
          {flow2U > 0 &&
            TOKENS.map((tok, i) => {
              const p = pipePos(flow2U, i);
              if (p.u <= 0 || p.u >= 0.98) return null;
              return (
                <g key={`r${i}`}>
                  <rect x={p.x - 20} y={p.y + 16} width={40} height={22} rx={6} fill={colors.WARM} opacity={0.92} />
                  <text x={p.x} y={p.y + 31} textAnchor="middle" fill={colors.BG} fontSize={11} fontFamily={MONO}>
                    {tok}
                  </text>
                </g>
              );
            })}

          {/* diagnosis label on the wire */}
          <g opacity={wireU * (1 - phaseU)}>
            <rect x={470} y={252} width={340} height={34} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={640} y={274} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
              the wire remembers nothing
            </text>
          </g>
        </g>

        {/* ---- phase B: the durable tape ---- */}
        <g opacity={machineOp}>
          <Zone
            x={TAPE_ZONE.x}
            y={TAPE_ZONE.y}
            w={TAPE_ZONE.w}
            h={TAPE_ZONE.h}
            label="durable stream — Electric Streams server"
            kind="group"
            u={tapeU}
            color={colors.TEAL}
          />
          <g opacity={tapeU}>
            <text x={TAPE_ZONE.x + TAPE_ZONE.w - 14} y={TAPE_ZONE.y + 24} textAnchor="end" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
              PUT /v1/stream/chat
            </text>
            {/* the empty rail */}
            <line x1={TAPE.x0 - TAPE.cellW / 2} y1={TAPE.y + TAPE.cellH / 2 + 12} x2={cellX(N) - TAPE.cellW / 2 + 14} y2={TAPE.y + TAPE.cellH / 2 + 12} stroke={colors.GRID} strokeWidth={1.5} />
          </g>

          {/* writer + reader connections into the tape */}
          <g opacity={tapeU * phaseU}>
            <Connection from={{ x: MODEL.x, y: MODEL.y + 52 }} to={{ x: TAPE_ZONE.x - 6, y: TAPE.y + 8 }} elbow="v" u={tapeU} label="append" color={colors.SECONDARY} arrow />
            <Connection from={{ x: TAPE_ZONE.x + TAPE_ZONE.w + 6, y: TAPE.y + 8 }} to={{ x: BROWSER.x, y: BROWSER.y + 52 }} elbow="h" u={tapeU} label="read" color={colors.POSITIVE} arrow dim={goneU > 0.5 && backU < 0.3 ? 0.8 : 0} />
          </g>

          {/* cells: wave A then wave B while the reader is away */}
          {TOKENS.map((tok, i) => {
            const u = i < CELLS_A ? win(appendU, CELLS_A, i, 1.6) : win(append2U, CELLS_B, i - CELLS_A, 1.6);
            if (u <= 0) return null;
            const x = cellX(i) - TAPE.cellW / 2 + 2;
            const drop = (1 - u) * (1 - u) * 60;
            const replayed = catchU > 0 && i >= READ_BOOKMARK && headCell >= i;
            const consumed = i < readPos || replayed;
            return (
              <g key={`c${i}`} opacity={u}>
                <rect
                  x={x}
                  y={TAPE.y - TAPE.cellH / 2 - drop}
                  width={TAPE.cellW - 5}
                  height={TAPE.cellH}
                  rx={6}
                  fill={consumed ? colors.PANEL : colors.PANEL}
                  stroke={replayed ? colors.WARM : i < CELLS_A ? colors.ACCENT : colors.SECONDARY}
                  strokeWidth={replayed ? 2 : 1.2}
                />
                <text x={x + (TAPE.cellW - 5) / 2} y={TAPE.y + 4 - drop} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>
                  {tok}
                </text>
                {/* offset tick — positions are numbered, opaque tokens on the wire */}
                <text x={x + (TAPE.cellW - 5) / 2} y={TAPE.y + TAPE.cellH / 2 + 26} textAnchor="middle" fill={u >= 1 ? colors.MUTED : colors.GRID} fontSize={9.5} fontFamily={MONO}>
                  {`…${String(i).padStart(2, '0')}`}
                </text>
              </g>
            );
          })}

          {/* acknowledged count chip — bottom-left of the zone, clear of its label */}
          <g opacity={clamp01(appendU * 6) * tapeU}>
            <text x={TAPE_ZONE.x + 14} y={TAPE_ZONE.y + TAPE_ZONE.h - 14} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
              {`Stream-Next-Offset: …${String(landedTotal).padStart(2, '0')}`}
            </text>
          </g>

          {/* the reader playhead + bookmark */}
          {readerU > 0 && (
            <g opacity={readerOp}>
              <path d={`M ${headX} ${TAPE.y - TAPE.cellH / 2 - 26} l 9 -14 l -18 0 Z`} fill={colors.POSITIVE} />
              <rect x={headX - 58} y={TAPE.y - TAPE.cellH / 2 - 70} width={116} height={24} rx={7} fill={colors.BG} stroke={colors.POSITIVE} />
              <text x={headX} y={TAPE.y - TAPE.cellH / 2 - 53} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
                {`offset=…${String(Math.floor(Math.min(headCell, N - 0.001))).padStart(2, '0')}`}
              </text>
            </g>
          )}

          {/* while gone: the bookmark survives on the browser side */}
          <g opacity={goneU * (1 - backU) * machineOp}>
            <rect x={BROWSER.x - 70} y={BROWSER.y + 62} width={140} height={26} rx={8} fill={colors.BG} stroke={colors.WARM} />
            <text x={BROWSER.x} y={BROWSER.y + 80} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
              saved: offset=…08
            </text>
          </g>
        </g>

        {/* closing card on a quiet stage */}
        <g opacity={cardU}>
          <rect x={340} y={250} width={600} height={190} rx={16} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.5} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700}>
            Electric Streams
          </text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            the data primitive for the agent loop
          </text>
          {['durable', 'addressable', 'replayable'].map((w, i) => (
            <g key={w}>
              <rect x={392 + i * 172} y={366} width={152} height={38} rx={10} fill={colors.BG} stroke={[colors.ACCENT, colors.SECONDARY, colors.POSITIVE][i]} />
              <text x={468 + i * 172} y={391} textAnchor="middle" fill={[colors.ACCENT, colors.SECONDARY, colors.POSITIVE][i]} fontSize={16} fontWeight={600}>
                {w}
              </text>
            </g>
          ))}
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
