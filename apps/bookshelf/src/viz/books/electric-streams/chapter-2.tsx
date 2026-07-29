// An Address for Every Byte
//
// Grounding: PROTOCOL.md §5.1 (PUT create → 201 Created, idempotent
// create-or-ensure), §5.2 (POST append → Stream-Next-Offset), §5.6 (GET
// catch-up reads), §8 (offsets: opaque, lexicographically sortable, strictly
// increasing; sentinels `-1` = stream beginning, `now` = current tail;
// "Clients MUST use the Stream-Next-Offset value returned in responses");
// packages/client/src/constants.ts (STREAM_OFFSET_HEADER = Stream-Next-Offset,
// OFFSET_QUERY_PARAM = offset). Offset tokens styled after streams.md's
// example `01JQXK5V00`.
//
// Centerpiece: the tape machine assembled from nothing — a PUT mints an empty
// tape at a URL, POSTs land cells stamped with offset ticks, and a playhead
// climbs the tape hand over hand on the ask → receive → save-offset loop.
// Sentinels rewind it to the start or vault a second reader to the tail; a
// rogue overwrite bounces off — bytes at an offset never change.
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
import { ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — writer left, reader right, the tape across the middle.
// ---------------------------------------------------------------------------

const WRITER = { x: 150, y: 470 } as const;
const READER = { x: 1130, y: 470 } as const;
const URLCHIP = { x: 640, y: 120 } as const;

const TAPE = { x0: 300, y: 330, cellW: 70, cellH: 46, n: 10 } as const;
const cellX = (i: number): number => TAPE.x0 + i * TAPE.cellW; // cell center

// the stream's messages (an agent chat) and their server-minted offsets
const MSGS = ['hello', 'plan?', 'step 1', 'step 2', 'run it', 'logs', 'diff', 'patch', 'green', 'done'] as const;
const OFFS = MSGS.map((_, i) => `01JQXK5V0${i}`);
const N = MSGS.length;
const CHUNK = 5; // cells returned by the first catch-up GET

const CAM_URL: CameraState = { x: 640, y: 250, k: 1.3 };
const CAM_TAPE: CameraState = { x: 640, y: 340, k: 1.12 };
const CAM_MAG: CameraState = { x: cellX(4), y: 400, k: 1.7 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~86s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_URL, cameraInterp);

  const urlU = tl.channel('urlU', 0); // the bare URL chip
  const writerU = tl.channel('writerU', 0); // writer node
  const putU = tl.channel('putU', 0); // PUT packet travels to the URL
  const createdU = tl.channel('createdU', 0); // 201 chip + empty rail draws
  const post1U = tl.channel('post1U', 0); // first append lands at position 0
  const ackU = tl.channel('ackU', 0); // Stream-Next-Offset response chip
  const fillU = tl.channel('fillU', 0); // appends 1..7 land, ticks stamp
  const arrowU = tl.channel('arrowU', 0); // "only ever forward" arrow
  const magU = tl.channel('magU', 0); // magnifier on one opaque token
  const readerNU = tl.channel('readerNU', 0); // reader node enters
  const getU = tl.channel('getU', 0); // first GET round trip
  const chunkU = tl.channel('chunkU', 0); // brace over the returned chunk
  const headU = tl.channel('headU', -1); // playhead position, cell units
  const loopU = tl.channel('loopU', 0); // 3 ask→receive→save hops
  const sweepU = tl.channel('sweepU', 0); // full replay highlight from -1
  const nowU = tl.channel('nowU', 0); // second reader pops at the tail
  const lastU = tl.channel('lastU', 0); // appends 8..9 land during the loop
  const bounceU = tl.channel('bounceU', 0); // overwrite attempt deflects
  const dimU = tl.channel('dimU', 0);
  const cardU = tl.channel('cardU', 0);

  // — beat 1 · a stream is just a URL —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Strip everything away, and a durable stream is just a URL. No broker to install, no special socket protocol — if you can make a web request, you can make a stream.',
  });
  tl.tween(urlU, 1, { at: 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(writerU, 1, { at: 2.2, dur: 0.7, ease: ease.enter });
  tl.hold(6.5, 0.4);

  // — beat 2 · PUT creates the tape —
  tl.caption({
    at: 6.9,
    dur: 5.8,
    text: 'One put request creates it. The server answers created, and an empty tape now lives at that address, waiting for bytes.',
  });
  tl.tween(putU, 1, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_TAPE, { at: 8.4, dur: 1.4, ease: ease.move });
  tl.tween(createdU, 1, { at: 8.8, dur: 1.4, ease: ease.draw });
  tl.hold(12.7, 0.4);

  // — beat 3 · POST appends at the end —
  tl.caption({
    at: 13.1,
    dur: 6.0,
    text: 'Writes are post requests. The body is appended at the end of the tape — never inserted, never overwritten — and the first message lands at position zero.',
  });
  tl.tween(post1U, 1, { at: 13.6, dur: 1.6, ease: ease.move });
  tl.hold(19.1, 0.4);

  // — beat 4 · the header that matters: the next offset —
  tl.caption({
    at: 19.5,
    dur: 6.4,
    text: 'The server answers with the crucial header: the next offset — the exact address where the tape now ends. Every append moves it forward, and it only ever moves forward.',
  });
  tl.tween(ackU, 1, { at: 19.9, dur: 0.7, ease: ease.pop });
  tl.tween(fillU, 1, { at: 21.2, dur: 4.2, ease: ease.linear });
  tl.tween(arrowU, 1, { at: 24.4, dur: 1.2, ease: ease.draw });
  tl.hold(25.9, 0.4);

  // — beat 5 · offsets are opaque —
  tl.caption({
    at: 26.3,
    dur: 6.4,
    text: 'Offsets look like gibberish, and that is deliberate. They are opaque tokens — you never parse one, never do math on one. You only remember it, and hand it back.',
  });
  tl.tween(cam, CAM_MAG, { at: 26.5, dur: 1.4, ease: ease.move });
  tl.tween(magU, 1, { at: 27.6, dur: 0.8, ease: ease.enter });
  tl.hold(32.3, 0.4);

  // — beat 6 · reading: a chunk plus the next offset —
  tl.caption({
    at: 32.7,
    dur: 6.0,
    text: 'Reading is a get request from any offset you like. The server returns a chunk of data — and, again, the next offset to ask from.',
  });
  tl.tween(cam, CAM_TAPE, { at: 32.9, dur: 1.3, ease: ease.move });
  tl.tween(magU, 0, { at: 32.9, dur: 0.6, ease: ease.enter });
  tl.tween(readerNU, 1, { at: 33.4, dur: 0.7, ease: ease.enter });
  tl.tween(getU, 1, { at: 34.2, dur: 2.0, ease: ease.move });
  tl.tween(chunkU, 1, { at: 36.0, dur: 1.0, ease: ease.draw });
  tl.tween(headU, CHUNK, { at: 36.6, dur: 1.2, ease: ease.move });
  tl.hold(38.3, 0.4);

  // — beat 7 · the hand-over-hand loop —
  tl.caption({
    at: 38.7,
    dur: 6.6,
    text: 'That little loop is the whole read protocol. Ask, receive, save the offset, ask again — a playhead climbing the tape hand over hand, in plain cacheable web requests.',
  });
  tl.tween(loopU, 3, { at: 39.2, dur: 5.4, ease: ease.linear });
  tl.tween(headU, CHUNK + 3, { at: 39.2, dur: 5.4, ease: ease.linear });
  tl.tween(lastU, 1, { at: 40.0, dur: 2.8, ease: ease.linear });
  tl.hold(45.3, 0.4);

  // — beat 8 · offset minus one: replay everything —
  tl.caption({
    at: 45.7,
    dur: 6.0,
    text: 'Stop anytime, and nothing is lost. Come back tomorrow with offset minus one, and the tape replays from the very beginning, byte for byte.',
  });
  tl.tween(headU, 0, { at: 46.3, dur: 0.9, ease: ease.move });
  tl.tween(sweepU, 1, { at: 47.4, dur: 3.4, ease: ease.move });
  tl.tween(headU, N, { at: 47.4, dur: 3.4, ease: ease.move });
  tl.hold(51.7, 0.4);

  // — beat 9 · offset now: skip to the tail —
  tl.caption({
    at: 52.1,
    dur: 5.8,
    text: 'Or skip the history entirely. The special offset called now vaults a brand-new reader straight to the tail, where only future appends will arrive.',
  });
  tl.tween(nowU, 1, { at: 52.7, dur: 1.2, ease: ease.pop });
  tl.hold(57.9, 0.4);

  // — beat 10 · immutable by position —
  tl.caption({
    at: 58.3,
    dur: 7.0,
    text: 'And beneath every playhead, the tape itself never changes. Bytes at an offset are immutable — a fact you can cite by address. The next chapter keeps that address live.',
  });
  tl.tween(cam, CAM_WIDE, { at: 58.5, dur: 1.4, ease: ease.move });
  tl.tween(bounceU, 1, { at: 59.4, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 61.6, dur: 1.1, ease: ease.move });
  tl.tween(cardU, 1, { at: 62.9, dur: 0.9, ease: ease.pop });
  tl.hold(65.3, 1.8);

  return {
    tl, cam, urlU, writerU, putU, createdU, post1U, ackU, fillU, arrowU,
    magU, readerNU, getU, chunkU, headU, loopU, sweepU, nowU, lastU,
    bounceU, dimU, cardU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const urlU = s.get(scene.urlU);
  const writerU = s.get(scene.writerU);
  const putU = s.get(scene.putU);
  const createdU = s.get(scene.createdU);
  const post1U = s.get(scene.post1U);
  const ackU = s.get(scene.ackU);
  const fillU = s.get(scene.fillU);
  const arrowU = s.get(scene.arrowU);
  const magU = s.get(scene.magU);
  const readerNU = s.get(scene.readerNU);
  const getU = s.get(scene.getU);
  const chunkU = s.get(scene.chunkU);
  const headU = s.get(scene.headU);
  const loopU = s.get(scene.loopU);
  const sweepU = s.get(scene.sweepU);
  const nowU = s.get(scene.nowU);
  const lastU = s.get(scene.lastU);
  const bounceU = s.get(scene.bounceU);
  const dimU = s.get(scene.dimU);
  const cardU = s.get(scene.cardU);

  const machineOp = 1 - 0.88 * dimU;
  const railX1 = cellX(N - 1) + TAPE.cellW / 2 + 26;

  // cell landing progress: cell 0 via post1U, 1..7 via fillU, 8..9 via lastU
  const landU = (i: number): number =>
    i === 0 ? post1U : i <= 7 ? win(fillU, 7, i - 1, 1.8) : win(lastU, 2, i - 8, 1.6);
  const landed = Math.max(0, Math.min(N, (post1U >= 1 ? 1 : 0) + Math.floor(fillU * 7) + Math.floor(lastU * 2)));

  // playhead
  const headOn = headU >= 0 ? 1 : 0;
  const headX = cellX(Math.min(headU, N - 0.5)) - TAPE.cellW / 2;
  const hopFrac = loopU > 0 && loopU < 3 ? loopU - Math.floor(loopU) : 0;

  // the PUT packet path: writer → URL chip
  const putP = {
    x: WRITER.x + (URLCHIP.x - 150 - WRITER.x) * putU,
    y: WRITER.y - 40 + (URLCHIP.y + 20 - (WRITER.y - 40)) * putU,
  };
  // first POST path: writer → cell 0
  const postP = {
    x: WRITER.x + (cellX(0) - WRITER.x) * post1U,
    y: WRITER.y - 40 + (TAPE.y - (WRITER.y - 40)) * post1U,
  };
  // GET round trip: reader → tape edge and back (0..0.5 out, 0.5..1 home)
  const getOut = clamp01(getU * 2);
  const getBack = clamp01(getU * 2 - 1);
  const getP = {
    x: READER.x + (railX1 - READER.x) * (getBack > 0 ? 1 - getBack : getOut),
    y: READER.y - 40 + (TAPE.y - (READER.y - 40)) * (getBack > 0 ? 1 - getBack : getOut),
  };
  // overwrite attempt: dives at cell 2, deflects down-left
  const bAim = clamp01(bounceU * 1.6);
  const bDefl = clamp01(bounceU * 1.6 - 0.6);
  const bounceP = bDefl > 0
    ? { x: cellX(2) - 60 * bDefl, y: TAPE.y - TAPE.cellH / 2 + 120 * bDefl * bDefl + 20 * bDefl }
    : { x: cellX(2), y: 120 + (TAPE.y - TAPE.cellH / 2 - 130) * bAim };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the URL — the whole address of the stream */}
        <g opacity={urlU * machineOp}>
          <rect x={URLCHIP.x - 240} y={URLCHIP.y - 26} width={480} height={52} rx={12} fill={colors.PANEL} stroke={createdU > 0.2 ? colors.TEAL : colors.GRID} strokeWidth={1.5} />
          <text x={URLCHIP.x} y={URLCHIP.y + 6} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontFamily={MONO}>
            https://streams.example.com/v1/stream/chat
          </text>
          <g opacity={createdU}>
            <rect x={URLCHIP.x + 254} y={URLCHIP.y - 15} width={112} height={30} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
            <text x={URLCHIP.x + 310} y={URLCHIP.y + 5} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
              201 Created
            </text>
          </g>
        </g>

        {/* writer + reader */}
        <g opacity={machineOp}>
          <ServiceNode x={WRITER.x} y={WRITER.y} kind="server" label="writer" sublabel="appends" u={writerU} />
          <ServiceNode x={READER.x} y={READER.y} kind="client" label="reader" sublabel="replays" u={readerNU} />
        </g>

        {/* the tape */}
        <g opacity={machineOp}>
          <Zone x={TAPE.x0 - 60} y={TAPE.y - 78} w={railX1 - TAPE.x0 + 96} h={190} label="the durable stream — append-only" kind="group" u={createdU} color={colors.TEAL} />
          <line x1={TAPE.x0 - TAPE.cellW / 2} y1={TAPE.y + TAPE.cellH / 2 + 12} x2={railX1} y2={TAPE.y + TAPE.cellH / 2 + 12} stroke={colors.GRID} strokeWidth={1.5} opacity={createdU} />

          {/* cells + offset ticks */}
          {MSGS.map((m, i) => {
            const u = landU(i);
            if (u <= 0) return null;
            const x = cellX(i) - TAPE.cellW / 2 + 3;
            const drop = (1 - u) * (1 - u) * 70;
            const swept = sweepU > 0 && headU >= i + 0.5 && cardU < 0.5;
            const inChunk = chunkU > 0 && i < CHUNK && loopU <= 0;
            const stone = bounceU > 0.3;
            return (
              <g key={i} opacity={u}>
                <rect
                  x={x}
                  y={TAPE.y - TAPE.cellH / 2 - drop}
                  width={TAPE.cellW - 6}
                  height={TAPE.cellH}
                  rx={7}
                  fill={colors.PANEL}
                  stroke={swept ? colors.WARM : inChunk ? colors.POSITIVE : colors.ACCENT}
                  strokeWidth={stone ? 2.2 : swept || inChunk ? 2 : 1.2}
                />
                <text x={x + (TAPE.cellW - 6) / 2} y={TAPE.y + 4 - drop} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
                  {m}
                </text>
                <text x={x + (TAPE.cellW - 6) / 2} y={TAPE.y + TAPE.cellH / 2 + 28} textAnchor="middle" fill={u >= 1 ? colors.MUTED : colors.GRID} fontSize={9.5} fontFamily={MONO}>
                  {`…V0${i}`}
                </text>
              </g>
            );
          })}

          {/* forward-only arrow under the ticks */}
          <g opacity={arrowU * machineOp}>
            <line x1={cellX(0)} y1={TAPE.y + TAPE.cellH / 2 + 44} x2={cellX(0) + (cellX(N - 1) - cellX(0)) * arrowU} y2={TAPE.y + TAPE.cellH / 2 + 44} stroke={colors.SECONDARY} strokeWidth={2} />
            <path d={`M ${cellX(0) + (cellX(N - 1) - cellX(0)) * arrowU} ${TAPE.y + TAPE.cellH / 2 + 44} l -10 -5 l 0 10 Z`} fill={colors.SECONDARY} />
            <text x={cellX(4)} y={TAPE.y + TAPE.cellH / 2 + 66} textAnchor="middle" fill={colors.SECONDARY} fontSize={12.5}>
              offsets only ever move forward — sorted, never reused
            </text>
          </g>

          {/* Stream-Next-Offset response chip */}
          <g opacity={ackU * (1 - 0.3 * dimU)}>
            <rect x={TAPE.x0 - 40} y={TAPE.y - 118} width={330} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} />
            <text x={TAPE.x0 + 125} y={TAPE.y - 98} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
              {`Stream-Next-Offset: ${OFFS[Math.max(0, Math.min(N - 1, landed - 1))]}`}
            </text>
          </g>

          {/* magnifier on one opaque token */}
          <g opacity={magU}>
            <circle cx={cellX(4)} cy={TAPE.y + TAPE.cellH / 2 + 26} r={54} fill="none" stroke={colors.WARM} strokeWidth={2} />
            <line x1={cellX(4) + 40} y1={TAPE.y + TAPE.cellH / 2 + 64} x2={cellX(4) + 78} y2={TAPE.y + TAPE.cellH / 2 + 100} stroke={colors.WARM} strokeWidth={3} />
            <rect x={cellX(4) - 110} y={TAPE.y + TAPE.cellH / 2 + 92} width={220} height={54} rx={10} fill={colors.PANEL} stroke={colors.WARM} />
            <text x={cellX(4)} y={TAPE.y + TAPE.cellH / 2 + 115} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
              01JQXK5V04
            </text>
            <text x={cellX(4)} y={TAPE.y + TAPE.cellH / 2 + 136} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              opaque — remember it, hand it back
            </text>
          </g>

          {/* chunk brace over cells 0..4 */}
          <g opacity={chunkU * (loopU > 0 ? clamp01(1 - loopU) : 1) * machineOp}>
            <path
              d={`M ${cellX(0) - TAPE.cellW / 2 + 4} ${TAPE.y - TAPE.cellH / 2 - 12} L ${cellX(0) - TAPE.cellW / 2 + 4} ${TAPE.y - TAPE.cellH / 2 - 22} L ${cellX(CHUNK - 1) + TAPE.cellW / 2 - 8} ${TAPE.y - TAPE.cellH / 2 - 22} L ${cellX(CHUNK - 1) + TAPE.cellW / 2 - 8} ${TAPE.y - TAPE.cellH / 2 - 12}`}
              fill="none"
              stroke={colors.POSITIVE}
              strokeWidth={1.5}
            />
            <text x={(cellX(0) + cellX(CHUNK - 1)) / 2} y={TAPE.y - TAPE.cellH / 2 - 32} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
              200 OK — one chunk
            </text>
          </g>

          {/* the playhead */}
          {headOn > 0 && (
            <g opacity={machineOp}>
              <path d={`M ${headX} ${TAPE.y - TAPE.cellH / 2 - 18} l 9 -14 l -18 0 Z`} fill={colors.POSITIVE} />
              {/* per-hop ask/receive chip above the head */}
              {hopFrac > 0 && (
                <g>
                  <rect x={headX - 92} y={TAPE.y - TAPE.cellH / 2 - 66} width={184} height={26} rx={8} fill={colors.BG} stroke={hopFrac < 0.5 ? colors.ACCENT : colors.WARM} />
                  <text x={headX} y={TAPE.y - TAPE.cellH / 2 - 48} textAnchor="middle" fill={hopFrac < 0.5 ? colors.ACCENT : colors.WARM} fontSize={11.5} fontFamily={MONO}>
                    {hopFrac < 0.5 ? 'GET ?offset=…' : 'data + next offset'}
                  </text>
                </g>
              )}
              {/* rewind chip */}
              {sweepU > 0 && sweepU < 1 && (
                <g>
                  <rect x={headX - 66} y={TAPE.y - TAPE.cellH / 2 - 66} width={132} height={26} rx={8} fill={colors.BG} stroke={colors.WARM} />
                  <text x={headX} y={TAPE.y - TAPE.cellH / 2 - 48} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
                    GET ?offset=-1
                  </text>
                </g>
              )}
            </g>
          )}

          {/* the offset=now late joiner */}
          <g opacity={nowU * machineOp}>
            <path d={`M ${railX1 - 6} ${TAPE.y - TAPE.cellH / 2 - 18} l 9 -14 l -18 0 Z`} fill={colors.WARM} />
            <rect x={railX1 - 78} y={TAPE.y - TAPE.cellH / 2 - 66} width={148} height={26} rx={8} fill={colors.BG} stroke={colors.WARM} />
            <text x={railX1 - 4} y={TAPE.y - TAPE.cellH / 2 - 48} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
              GET ?offset=now
            </text>
            <rect x={railX1 + 8} y={TAPE.y - TAPE.cellH / 2} width={TAPE.cellW - 6} height={TAPE.cellH} rx={7} fill="none" stroke={colors.GRID} strokeDasharray="5 4" />
            <text x={railX1 + 8 + (TAPE.cellW - 6) / 2} y={TAPE.y + 4} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
              future
            </text>
          </g>
        </g>

        {/* traveling request packets */}
        <g opacity={machineOp}>
          {putU > 0 && putU < 1 && (
            <g>
              <circle cx={putP.x} cy={putP.y} r={9} fill={colors.SECONDARY} />
              <text x={putP.x} y={putP.y - 14} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>
                PUT
              </text>
            </g>
          )}
          {post1U > 0 && post1U < 1 && (
            <g>
              <circle cx={postP.x} cy={postP.y} r={9} fill={colors.ACCENT} />
              <text x={postP.x} y={postP.y - 14} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>
                POST {'{'}…{'}'}
              </text>
            </g>
          )}
          {getU > 0 && getU < 1 && (
            <circle cx={getP.x} cy={getP.y} r={8} fill={getBack > 0 ? colors.POSITIVE : 'none'} stroke={colors.POSITIVE} strokeWidth={2} />
          )}
          {bounceU > 0 && bounceU < 1 && (
            <g>
              <circle cx={bounceP.x} cy={bounceP.y} r={9} fill={colors.NEGATIVE} />
              <text x={bounceP.x + 16} y={bounceP.y - 8} fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
                overwrite? no.
              </text>
            </g>
          )}
        </g>

        {/* closing card */}
        <g opacity={cardU}>
          <rect x={340} y={230} width={600} height={160} rx={16} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.5} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={700}>
            Immutable by position
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            bytes at an offset never change — a fact you can cite by address
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>
            PUT creates · POST appends · GET ?offset=… replays
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
