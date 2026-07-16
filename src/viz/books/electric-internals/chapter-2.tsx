// Chapter 2 — Durable Proxy
//
// Grounding: packages/proxy/src/server/create-stream.ts (POST /v1/proxy:
// validate service JWT → require Upstream-URL / Upstream-Method → allowlist →
// PUT /v1/streams/{id} → 201 + pre-signed Location → background piping),
// packages/proxy/src/server/upstream.ts (pipeUpstreamBody: flush at 4096
// bytes OR 50 ms, Stream-Closed: true on end), packages/proxy/src/client/
// durable-fetch.ts (Authorization → Upstream-Authorization relabel; requestId
// credentials; resume path reads the stream, never the upstream).
//
// Centerpiece: THE FORK — one upstream response body pipes into the tape via
// a batching bucket while the client reads from the tape, never the wire.
// The chapter replays chapter 1's kill test and this time nothing is lost.
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
import { Connection, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Cast + layout
// ---------------------------------------------------------------------------
const CLIENT = { x: 175, y: 215 } as const;
const PROXY = { x: 555, y: 215 } as const;
const UPSTREAM = { x: 1075, y: 140 } as const;
const BUCKET = { x: 780, y: 215 } as const; // the batching accumulator
const TAPE_Y = 470;
const TAPE_X0 = 330;
const CELL_W = 40;
const CELL_H = 44;
const N_CELLS = 20;
const cellX = (i: number): number => TAPE_X0 + i * CELL_W;

// header chips travelling client → proxy (the durable-fetch relabel)
const CHIPS = [
  { pre: 'Upstream-URL: api.openai.com', post: 'Upstream-URL: api.openai.com' },
  { pre: 'Upstream-Method: POST', post: 'Upstream-Method: POST' },
  { pre: 'Authorization: Bearer sk-…', post: 'Upstream-Authorization: Bearer sk-…' },
] as const;

const CAM_CHIPS: CameraState = { x: 420, y: 235, k: 1.35 };
const CAM_GATE: CameraState = { x: 620, y: 215, k: 1.45 };
const CAM_BUCKET: CameraState = { x: 800, y: 300, k: 1.4 };
const CAM_TAPE: CameraState = { x: 640, y: 420, k: 1.18 };

// token flow: upstream → proxy (arrives continuously through the chapter)
function upstreamTokenPos(p: number, i: number, n: number): { x: number; y: number; u: number } {
  const u = clamp01(p * (n + 4) - i);
  return {
    x: UPSTREAM.x - 66 - u * (UPSTREAM.x - 66 - (BUCKET.x + 34)),
    y: UPSTREAM.y + 30 + u * (BUCKET.y - 58 - (UPSTREAM.y + 30)),
    u,
  };
}

// ---------------------------------------------------------------------------
// Timeline — ~84s, 11 captions.
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const castU = tl.channel('castU', 0); // nodes enter
  const chipsU = tl.channel('chipsU', 0); // header chips travel + relabel
  const gateU = tl.channel('gateU', 0); // allowlist gate check (green)
  const bounceU = tl.channel('bounceU', 0); // disallowed URL bounces (red)
  const mintU = tl.channel('mintU', 0); // PUT /v1/streams/{id} → tape appears
  const ticketU = tl.channel('ticketU', 0); // 201 + pre-signed Location back
  const pumpU = tl.channel('pumpU', 0); // upstream tokens → bucket (whole ch.)
  const fill1U = tl.channel('fill1U', 0); // bucket fill cycle sawtooth driver
  const batchN = tl.channel('batchN', 0); // cells appended so far (continuous)
  const readIdx = tl.channel('readIdx', -1.5); // client read cursor (cells)
  const readOn = tl.channel('readOn', 0);
  const killU = tl.channel('killU', 0); // client tab dies
  const resumeU = tl.channel('resumeU', 0); // requestId resume
  const closedU = tl.channel('closedU', 0); // Stream-Closed cap
  const quietU = tl.channel('quietU', 0); // finale dim

  // — beat 1 · the cast —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: "Most model endpoints already stream. The durable proxy makes them durable without changing them — you sit it between your client and the provider.",
  });
  tl.tween(castU, 1, { at: 0.7, dur: 1.4, ease: ease.enter });

  // — beat 2 · durable fetch + the relabel —
  tl.caption({
    at: 7.2,
    dur: 6.6,
    text: 'The client calls durable fetch, which wraps a normal request. The real destination and method travel in headers, and your authorization is relabeled for the upstream.',
  });
  tl.tween(cam, CAM_CHIPS, { at: 7.4, dur: 1.2, ease: ease.move });
  tl.tween(chipsU, 1, { at: 8.0, dur: 4.6, ease: ease.linear });

  // — beat 3 · the allowlist gate —
  tl.caption({
    at: 14.4,
    dur: 6.0,
    text: 'First, the gate. The proxy only forwards to hosts on its allowlist — anything else bounces before a single byte leaves.',
  });
  tl.tween(cam, CAM_GATE, { at: 14.6, dur: 1.2, ease: ease.move });
  tl.tween(gateU, 1, { at: 15.4, dur: 1.0, ease: ease.pop });
  tl.tween(bounceU, 1, { at: 17.2, dur: 1.8, ease: ease.move });

  // — beat 4 · mint the stream —
  tl.caption({
    at: 21.0,
    dur: 5.8,
    text: 'For an allowed upstream, the proxy mints a fresh stream on the durable streams server, and calls the provider itself.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 21.2, dur: 1.4, ease: ease.move });
  tl.tween(mintU, 1, { at: 21.8, dur: 1.6, ease: ease.draw });

  // — beat 5 · the ticket —
  tl.caption({
    at: 27.4,
    dur: 5.8,
    text: "The client immediately gets back a pre signed read location — a signed, expiring URL for that stream. That's its ticket.",
  });
  tl.tween(ticketU, 1, { at: 28.0, dur: 1.6, ease: ease.move });

  // — beat 6 · THE FORK: batching bucket —
  tl.caption({
    at: 33.8,
    dur: 7.0,
    text: "Here's the fork. As upstream bytes arrive, the proxy batches them — flushing at four kilobytes or fifty milliseconds, whichever comes first — and appends every batch to the tape.",
  });
  tl.tween(cam, CAM_BUCKET, { at: 34.0, dur: 1.3, ease: ease.move });
  tl.tween(pumpU, 0.45, { at: 34.4, dur: 6.4, ease: ease.linear });
  tl.tween(fill1U, 3, { at: 34.8, dur: 6.0, ease: ease.linear }); // 3 fill+flush cycles
  tl.tween(batchN, 6, { at: 35.4, dur: 5.4, ease: ease.linear });

  // — beat 7 · the client reads the tape —
  tl.caption({
    at: 41.6,
    dur: 6.0,
    text: 'And the client? It never touches the upstream wire. It reads the tape through its ticket, trailing the write head by a beat.',
  });
  tl.tween(cam, CAM_TAPE, { at: 41.8, dur: 1.3, ease: ease.move });
  tl.tween(readOn, 1, { at: 42.4, dur: 0.5, ease: ease.enter });
  tl.tween(readIdx, 7, { at: 42.8, dur: 4.4, ease: ease.linear });
  tl.tween(pumpU, 0.68, { at: 41.6, dur: 6.4, ease: ease.linear });
  tl.tween(fill1U, 5, { at: 41.6, dur: 6.4, ease: ease.linear });
  tl.tween(batchN, 9, { at: 41.6, dur: 6.4, ease: ease.linear });

  // — beat 8 · kill the tab —
  tl.caption({
    at: 48.4,
    dur: 6.2,
    text: 'Kill the tab mid generation. The upstream keeps talking, the proxy keeps appending, and the tape keeps growing. Nothing is lost.',
  });
  tl.tween(killU, 1, { at: 49.0, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 49.4, dur: 1.4, ease: ease.move });
  tl.tween(pumpU, 0.9, { at: 48.4, dur: 6.2, ease: ease.linear });
  tl.tween(fill1U, 8, { at: 48.4, dur: 6.2, ease: ease.linear });
  tl.tween(batchN, 14, { at: 48.4, dur: 6.2, ease: ease.linear });

  // — beat 9 · resume by requestId —
  tl.caption({
    at: 55.2,
    dur: 6.6,
    text: 'When the client returns with the same request identifier, its saved ticket and offset are right there. It resumes the read, catches up, and rides live again.',
  });
  tl.tween(killU, 0, { at: 55.8, dur: 0.6, ease: ease.enter });
  tl.tween(resumeU, 1, { at: 55.8, dur: 0.8, ease: ease.pop });
  tl.tween(readIdx, 16, { at: 56.8, dur: 3.4, ease: ease.move });
  tl.tween(pumpU, 1, { at: 55.2, dur: 4.2, ease: ease.linear });
  tl.tween(fill1U, 10, { at: 55.2, dur: 4.2, ease: ease.linear });
  tl.tween(batchN, 17, { at: 55.2, dur: 4.4, ease: ease.linear });

  // — beat 10 · close the stream —
  tl.caption({
    at: 62.2,
    dur: 6.2,
    text: 'When the upstream finishes, the proxy stamps the stream closed. The full response is on the tape — replayable forever, by any number of readers.',
  });
  tl.tween(batchN, N_CELLS, { at: 62.4, dur: 1.6, ease: ease.linear });
  tl.tween(readIdx, N_CELLS - 1, { at: 62.6, dur: 1.8, ease: ease.linear });
  tl.tween(closedU, 1, { at: 64.6, dur: 0.8, ease: ease.pop });

  // — beat 11 · recap —
  tl.caption({
    at: 69.0,
    dur: 5.8,
    text: 'One fork, and any streaming endpoint becomes durable. The provider never even knew you left.',
  });
  tl.tween(quietU, 1, { at: 69.2, dur: 1.0, ease: ease.enter });
  tl.hold(74.8, 1.4);

  return {
    tl,
    cam,
    castU,
    chipsU,
    gateU,
    bounceU,
    mintU,
    ticketU,
    pumpU,
    fill1U,
    batchN,
    readIdx,
    readOn,
    killU,
    resumeU,
    closedU,
    quietU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
const N_PUMP = 26; // upstream token dots over the whole chapter

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const castU = s.get(scene.castU);
  const chipsU = s.get(scene.chipsU);
  const gateU = s.get(scene.gateU);
  const bounceU = s.get(scene.bounceU);
  const mintU = s.get(scene.mintU);
  const ticketU = s.get(scene.ticketU);
  const pumpU = s.get(scene.pumpU);
  const fill1U = s.get(scene.fill1U);
  const batchN = s.get(scene.batchN);
  const readIdx = s.get(scene.readIdx);
  const readOn = s.get(scene.readOn);
  const killU = s.get(scene.killU);
  const resumeU = s.get(scene.resumeU);
  const closedU = s.get(scene.closedU);
  const quietU = s.get(scene.quietU);

  const fillFrac = fill1U > 0 ? fill1U % 1 : 0; // sawtooth: bucket fills, flushes
  const flushing = fillFrac < 0.18 && fill1U > 0.5; // brief flash right after flush
  const nCells = Math.min(batchN, N_CELLS);
  const liveEdge = cellX(nCells) - CELL_W / 2 + 18;
  const cursorX = cellX(Math.max(readIdx, -1.5)) + CELL_W / 2;
  const clientDim = killU * 0.8;
  const dimBg = quietU * 0.82; // finale: fade the machinery, keep the payoff

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= cast ================= */}
        <g opacity={1 - dimBg * 0.75}>
          <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="browser" label="client" sublabel="createDurableFetch()" u={castU} dim={clientDim} glow={resumeU * (1 - quietU)} />
          <ServiceNode x={PROXY.x} y={PROXY.y} kind="gateway" label="durable proxy" sublabel="POST /v1/proxy" u={castU} />
          <ServiceNode x={UPSTREAM.x} y={UPSTREAM.y} kind="external" label="api.openai.com" sublabel="chat/completions" u={castU} />
          <Connection from={{ x: CLIENT.x + 62, y: CLIENT.y }} to={{ x: PROXY.x - 66, y: PROXY.y }} u={castU} color={colors.GRID} />
          <Connection from={{ x: PROXY.x + 66, y: PROXY.y - 14 }} to={{ x: UPSTREAM.x - 66, y: UPSTREAM.y + 10 }} u={castU} color={colors.GRID} dashed />
        </g>

        {/* ================= header chips + relabel ================= */}
        {chipsU > 0.01 && chipsU < 1 && (
          <g>
            {CHIPS.map((chip, i) => {
              const u = clamp01(chipsU * (3 + 1.6) - i * 1.1);
              if (u <= 0 || u >= 1.65) return null;
              const t = clamp01(u / 1.4);
              const x = CLIENT.x + 60 + t * (PROXY.x - 90 - CLIENT.x - 60);
              const y = CLIENT.y - 62 - i * 34 + t * (i * 20);
              const relabeled = i === 2 && t > 0.55;
              const text = relabeled ? chip.post : chip.pre;
              return (
                <g key={i} opacity={clamp01(u * 4) * clamp01((1.65 - u) * 3)}>
                  <rect x={x - 4} y={y - 13} width={text.length * 6.6 + 14} height={24} rx={7} fill={colors.BG} stroke={relabeled ? colors.WARM : colors.ACCENT} strokeWidth={1.4} />
                  <text x={x + 3} y={y + 3} fill={relabeled ? colors.WARM : colors.ACCENT} fontSize={11} fontFamily={MONO}>
                    {text}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ================= allowlist gate ================= */}
        {gateU > 0.01 && (
          <g opacity={(1 - dimBg) * clamp01(gateU) * (1 - clamp01((mintU - 0.4) * 2.2))}>
            <rect x={PROXY.x - 10} y={PROXY.y - 118} width={252} height={64} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={PROXY.x + 116} y={PROXY.y - 94} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              allowlist: ["https://api.openai.com/**"]
            </text>
            <text x={PROXY.x + 116} y={PROXY.y - 72} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5} fontWeight={600} opacity={gateU}>
              ✓ api.openai.com allowed
            </text>
          </g>
        )}
        {bounceU > 0.01 && bounceU < 1 && (
          <g>
            {(() => {
              const t = bounceU;
              const fwd = clamp01(t * 2.2); // approaches the proxy
              const back = clamp01((t - 0.5) * 2.2); // bounces off
              const x = CLIENT.x + 60 + (fwd - back * 1.1) * (PROXY.x - 120 - CLIENT.x - 60);
              const y = PROXY.y + 58;
              return (
                <g opacity={clamp01(t * 5) * clamp01((1 - t) * 3.2)}>
                  <rect x={x - 4} y={y - 13} width={172} height={24} rx={7} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.4} />
                  <text x={x + 4} y={y + 3} fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>
                    evil.example.com → 403
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* ================= the tape ================= */}
        {mintU > 0.01 && (
          <g>
            {/* mint arrow: proxy → tape */}
            <Connection
              from={{ x: PROXY.x, y: PROXY.y + 46 }}
              to={{ x: TAPE_X0 + 120, y: TAPE_Y - CELL_H / 2 - 12 }}
              u={mintU}
              color={colors.GRID}
              dim={dimBg}
              label="PUT /v1/streams/{id}"
              labelSize={10.5}
            />
            <g opacity={1 - dimBg * 0.3}>
              <line x1={TAPE_X0 - 14} y1={TAPE_Y + CELL_H / 2 + 8} x2={TAPE_X0 + (cellX(N_CELLS) - TAPE_X0 + 20) * mintU} y2={TAPE_Y + CELL_H / 2 + 8} stroke={colors.GRID} strokeWidth={2} />
              <text x={TAPE_X0 - 22} y={TAPE_Y + 5} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={mintU}>
                durable stream
              </text>
              {Array.from({ length: N_CELLS }, (_, i) => {
                const u = clamp01(nCells - i);
                if (u <= 0.01) return null;
                const fresh = clamp01(1 - (nCells - i - 1) / 1.6);
                const read = readOn > 0 && i <= readIdx;
                return (
                  <rect
                    key={i}
                    x={cellX(i)}
                    y={TAPE_Y - CELL_H / 2 - (1 - u) * 16}
                    width={CELL_W - 6}
                    height={CELL_H}
                    rx={6}
                    fill={colors.PANEL}
                    stroke={fresh > 0.4 ? colors.ACCENT : read ? colors.POSITIVE : colors.GRID}
                    strokeWidth={fresh > 0.4 ? 2 : 1.2}
                    opacity={0.35 + 0.65 * u}
                  />
                );
              })}
              {/* write head */}
              <path d={`M${liveEdge} ${TAPE_Y - CELL_H / 2 - 18} l -8 -12 l 16 0 z`} fill={colors.ACCENT} opacity={mintU * (1 - closedU)} />
              {/* closed cap */}
              {closedU > 0.01 && (
                <g opacity={closedU}>
                  <rect x={cellX(N_CELLS) + 2} y={TAPE_Y - CELL_H / 2} width={12} height={CELL_H} rx={3} fill={colors.WARM} />
                  <text x={cellX(N_CELLS) + 26} y={TAPE_Y - 16} fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
                    Stream-Closed: true
                  </text>
                </g>
              )}
            </g>
          </g>
        )}

        {/* ================= the ticket ================= */}
        {ticketU > 0.01 && (
          <g opacity={(1 - dimBg) * (ticketU < 1 ? 1 : 1)}>
            {(() => {
              const t = ticketU;
              const x = PROXY.x - 80 - t * (PROXY.x - 80 - CLIENT.x - 8);
              const y = PROXY.y + 88 - t * 30;
              return (
                <g opacity={clamp01(t * 4)}>
                  <rect x={x - 108} y={y - 15} width={262} height={30} rx={8} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.5} />
                  <text x={x + 23} y={y + 4} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily={MONO}>
                    201 · Location: /v1/proxy/{'{id}'}?expires=…
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* ================= upstream token pump + bucket ================= */}
        {pumpU > 0.01 && (
          <g opacity={1 - dimBg}>
            {Array.from({ length: N_PUMP }, (_, i) => {
              const p = upstreamTokenPos(pumpU, i, N_PUMP);
              if (p.u <= 0.01 || p.u >= 0.99) return null;
              return <circle key={i} cx={p.x} cy={p.y} r={5.5} fill={colors.ACCENT} opacity={0.9} />;
            })}
            {/* the batching bucket */}
            <g>
              <rect x={BUCKET.x - 34} y={BUCKET.y - 58} width={68} height={92} rx={9} fill={colors.PANEL} stroke={flushing ? colors.ACCENT : colors.GRID} strokeWidth={flushing ? 2.4 : 1.4} />
              <rect x={BUCKET.x - 28} y={BUCKET.y + 28 - fillFrac * 78} width={56} height={fillFrac * 78} rx={4} fill={colors.ACCENT} opacity={0.55} />
              <text x={BUCKET.x} y={BUCKET.y - 70} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                pipeUpstreamBody()
              </text>
              <text x={BUCKET.x + 46} y={BUCKET.y - 34} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                flush ≥ 4096 B
              </text>
              <text x={BUCKET.x + 46} y={BUCKET.y - 18} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                or 50 ms
              </text>
              {/* flush pipe down to the tape's write head */}
              <path
                d={`M${BUCKET.x} ${BUCKET.y + 36} C ${BUCKET.x} ${TAPE_Y - 90}, ${liveEdge} ${TAPE_Y - 130}, ${liveEdge} ${TAPE_Y - CELL_H / 2 - 30}`}
                fill="none"
                stroke={flushing ? colors.ACCENT : colors.GRID}
                strokeWidth={flushing ? 2.6 : 1.4}
                strokeDasharray="3 6"
                opacity={0.8}
              />
            </g>
          </g>
        )}

        {/* ================= client read cursor ================= */}
        {readOn > 0.01 && (
          <g opacity={readOn * (1 - killU * 0.75) * (1 - dimBg * 0.6)}>
            {resumeU > 0.01 && resumeU < 1 && (
              <circle cx={cursorX} cy={TAPE_Y + CELL_H / 2 + 48} r={14 + 16 * (1 - resumeU)} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={1 - resumeU} />
            )}
            <path d={`M${cursorX} ${TAPE_Y + CELL_H / 2 + 40} l -9 14 l 18 0 z`} fill={killU > 0.4 ? colors.MUTED : colors.POSITIVE} />
            <text x={cursorX} y={TAPE_Y + CELL_H / 2 + 72} textAnchor="middle" fill={killU > 0.4 ? colors.MUTED : colors.POSITIVE} fontSize={12} fontWeight={600}>
              {killU > 0.4 ? 'tab closed' : 'client reads the tape'}
            </text>
            {resumeU > 0.3 && quietU < 0.5 && (
              <text x={cursorX} y={TAPE_Y + CELL_H / 2 + 90} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={resumeU * (1 - quietU * 2)}>
                requestId: conversation-123
              </text>
            )}
          </g>
        )}

        {/* ================= finale panel ================= */}
        {quietU > 0.01 && (
          <g opacity={quietU}>
            <rect x={340} y={120} width={600} height={130} rx={16} fill={colors.BG} stroke={colors.GRID} />
            <text x={640} y={172} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={700}>
              upstream → proxy → tape → any reader
            </text>
            <text x={640} y={212} textAnchor="middle" fill={colors.MUTED} fontSize={14.5}>
              resumable by ticket + offset · the upstream protocol never changed
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
