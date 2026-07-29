// The Familiar Door — the OpenAI-compatible surface.
//
// Backed by: doc/en/kt-kernel/Native-Precision-Tutorial.md ("The server
// exposes an OpenAI-compatible API at http://localhost:30000/v1", the curl
// and Python client examples verbatim), doc/en/kt-kernel/
// experts-sched-Tutorial.md (Step 3: Send Inference Requests, kt chat),
// doc/en/kt-kernel/kt-cli.md (kt chat).
//
// ONE machine: the booted server with a /v1 door; three clients queue at the
// same door — curl, the Python client, and kt chat — and a token stream
// flows back out as typed chunks. The recap re-walks the whole book on a
// quiet closing panel.
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
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Connection, RequestFlow, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const SRV = { x: 950, y: 300 } as const;
const DOOR = { x: 830, y: 300 } as const;
const CLIENTS = [
  { x: 190, y: 170, label: 'curl', sub: 'chat/completions' },
  { x: 190, y: 300, label: 'Python client', sub: 'openai.OpenAI' },
  { x: 190, y: 430, label: 'kt chat', sub: 'interactive' },
] as const;

// The streamed reply, chunk by chunk (what streaming actually looks like).
const CHUNKS = ['Hello', '!', ' What', ' can', ' I', ' help', ' with', '?'];
const STREAM = { x: 420, y: 522, w: 440 } as const;

const CAM_SRV: CameraState = { x: 880, y: 300, k: 1.4 };
const CAM_CLI: CameraState = { x: 330, y: 300, k: 1.3 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  srvU: ChannelRef<number>;
  doorU: ChannelRef<number>;
  cliU: ChannelRef<number>;
  req: ChannelRef<number>[];
  streamU: ChannelRef<number>;
  sameU: ChannelRef<number>;
  swapU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const srvU = tl.channel('srvU', 0); // the server + its inner split
  const doorU = tl.channel('doorU', 0); // the /v1 door
  const cliU = tl.channel('cliU', 0); // the three clients
  const req = [0, 1, 2].map((i) => tl.channel(`req${i}`, 0));
  const streamU = tl.channel('streamU', 0); // chunk-by-chunk reply
  const sameU = tl.channel('sameU', 0); // "same door" underline
  const swapU = tl.channel('swapU', 0); // base-url swap chip
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the running server —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'The server is up: the model split across card and memory, the whole contraption humming behind one network port — thirty thousand.',
  });
  tl.tween(srvU, 1, { at: 0.7, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_SRV, { at: 1.2, dur: 1.4, ease: ease.move });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the door —
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'And it greets the world through the most boring door in the industry, on purpose: the Open A I compatible chat completions interface.',
  });
  tl.tween(doorU, 1, { at: 7.5, dur: 0.9, ease: ease.enter });
  tl.hold(13.0, 0.5);

  // — Beat 3 · three clients —
  tl.caption({
    at: 13.5,
    dur: 6.0,
    text: 'Which means every client you already have just works: a curl one-liner, the standard Python client pointed at localhost, or the built-in chat command.',
  });
  tl.tween(cam, CAM_CLI, { at: 13.7, dur: 1.4, ease: ease.move });
  tl.tween(cliU, 1, { at: 14.4, dur: 1.6, ease: ease.enter });
  tl.hold(19.5, 0.5);

  // — Beat 4 · curl knocks —
  tl.caption({
    at: 20.0,
    dur: 5.5,
    text: 'Watch the curl request knock: a plain post with a messages list, and streaming turned on.',
  });
  tl.tween(cam, CAM_WIDE, { at: 20.2, dur: 1.4, ease: ease.move });
  tl.tween(req[0], 1, { at: 20.8, dur: 2.4, ease: ease.linear });
  tl.hold(25.5, 0.5);

  // — Beat 5 · the stream —
  tl.caption({
    at: 26.0,
    dur: 6.5,
    text: 'The answer comes back the way you expect: a stream of little chunks, one burst per token, each one fresh off the circuit we walked last chapter.',
  });
  tl.tween(streamU, 1, { at: 26.6, dur: 3.6, ease: ease.linear });
  tl.hold(32.5, 0.5);

  // — Beat 6 · the other two —
  tl.caption({
    at: 33.0,
    dur: 6.0,
    text: 'The Python client and the chat command take the exact same door. Three clients, one interface, zero special cases.',
  });
  tl.tween(req[1], 1, { at: 33.4, dur: 2.0, ease: ease.linear });
  tl.tween(req[2], 1, { at: 34.4, dur: 2.0, ease: ease.linear });
  tl.tween(sameU, 1, { at: 36.6, dur: 0.6, ease: ease.pop });
  tl.hold(39.0, 0.5);

  // — Beat 7 · the point of the boring door —
  tl.caption({
    at: 39.5,
    dur: 6.5,
    text: 'That boredom is the point. Any app that talks to a hosted model can swap one base address and talk to your basement server instead — no code changes.',
  });
  tl.tween(swapU, 1, { at: 40.3, dur: 0.8, ease: ease.enter });
  tl.hold(46.0, 0.5);

  // — Beat 8 · book recap —
  tl.caption({
    at: 46.5,
    dur: 8.0,
    text: 'So that is the whole first act: a model too big for the card, split across two memories, booted with two words, answering on a door every client already knows.',
  });
  tl.tween(closeU, 1, { at: 47.3, dur: 1.4, ease: ease.move });
  tl.hold(54.5, 0.4);

  // — Beat 9 · series teaser —
  tl.caption({
    at: 54.9,
    dur: 6.5,
    text: 'The next books open the machinery: which experts earn a seat on the card, what precision buys you, and how the same rig fine-tunes the model it serves.',
  });
  tl.hold(61.4, 1.4);

  return { tl, cam, srvU, doorU, cliU, req, streamU, sameU, swapU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srvU = s.get(scene.srvU);
  const doorU = s.get(scene.doorU);
  const cliU = s.get(scene.cliU);
  const req = scene.req.map((c) => s.get(c));
  const streamU = s.get(scene.streamU);
  const sameU = s.get(scene.sameU);
  const swapU = s.get(scene.swapU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  const nChunks = Math.floor(streamU * CHUNKS.length + 1e-6);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the server ---- */}
          <Zone x={SRV.x - 130} y={SRV.y - 140} w={300} h={280} label="SGLang-KT · :30000" kind="group" u={srvU} color={colors.ACCENT} />
          <g opacity={srvU}>
            <rect x={SRV.x - 100} y={SRV.y - 92} width={110} height={70} rx={9} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
            <text x={SRV.x - 45} y={SRV.y - 62} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5}>
              GPU
            </text>
            <text x={SRV.x - 45} y={SRV.y - 44} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
              attention · hot
            </text>
            <rect x={SRV.x + 30} y={SRV.y - 92} width={110} height={70} rx={9} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.3} />
            <text x={SRV.x + 85} y={SRV.y - 62} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5}>
              CPU
            </text>
            <text x={SRV.x + 85} y={SRV.y - 44} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
              cold experts
            </text>
            <line x1={SRV.x - 45} y1={SRV.y - 22} x2={SRV.x + 85} y2={SRV.y - 22} stroke={colors.GRID} strokeWidth={2} opacity={0.7} />
            <text x={SRV.x + 20} y={SRV.y + 4} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
              the circuit from chapter three
            </text>
          </g>
          {/* the /v1 door */}
          <g opacity={doorU}>
            <rect x={DOOR.x - 34} y={DOOR.y + 30} width={78} height={64} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.6} />
            <text x={DOOR.x + 5} y={DOOR.y + 58} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily="ui-monospace, monospace">
              /v1
            </text>
            <text x={DOOR.x + 5} y={DOOR.y + 78} textAnchor="middle" fill={colors.MUTED} fontSize={8.5}>
              chat/completions
            </text>
          </g>

          {/* ---- the clients ---- */}
          {CLIENTS.map((c, i) => (
            <g key={c.label} opacity={clamp01(cliU * 3 - i * 0.6)}>
              <ServiceNode x={c.x} y={c.y} kind={i === 2 ? 'client' : i === 1 ? 'fn' : 'external'} label={c.label} sublabel={c.sub} w={150} u={1} glow={req[i] > 0 && req[i] < 1 ? 0.5 : 0} />
              <Connection
                from={{ x: c.x + 75, y: c.y }}
                to={{ x: DOOR.x - 34, y: DOOR.y + 62 }}
                via={[{ x: 560, y: c.y }, { x: 700, y: DOOR.y + 62 }]}
                u={clamp01(cliU * 3 - i * 0.6)}
                color={colors.GRID}
                width={1.1}
                dim={0.35}
              />
              {req[i] > 0 && req[i] < 1 && (
                <RequestFlow
                  path={[
                    { x: c.x + 75, y: c.y },
                    { x: 560, y: c.y },
                    { x: 700, y: DOOR.y + 62 },
                    { x: DOOR.x - 34, y: DOOR.y + 62 },
                  ]}
                  u={req[i]}
                  roundTrip
                  color={colors.ACCENT}
                  responseColor={colors.POSITIVE}
                  r={6}
                  label={i === 0 ? 'POST, stream: true' : undefined}
                />
              )}
            </g>
          ))}
          <g opacity={sameU}>
            <text x={640} y={120} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
              three clients · one door
            </text>
          </g>

          {/* ---- the stream readout ---- */}
          <g opacity={streamU > 0 ? 1 : 0}>
            <rect x={STREAM.x - 16} y={STREAM.y - 26} width={STREAM.w} height={44} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.1} opacity={Math.min(1, streamU * 4)} />
            <text x={STREAM.x} y={STREAM.y} fill={colors.TEXT} fontSize={13} fontFamily="ui-monospace, monospace">
              {CHUNKS.slice(0, nChunks).join('')}
              {streamU > 0 && streamU < 1 ? '▌' : ''}
            </text>
            <text x={STREAM.x + STREAM.w - 30} y={STREAM.y} textAnchor="end" fill={colors.MUTED} fontSize={9.5} opacity={Math.min(1, streamU * 4)}>
              {nChunks} chunks
            </text>
          </g>

          {/* ---- the swap chip ---- */}
          <g opacity={swapU}>
            <rect x={330} y={64} width={620} height={30} rx={8} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.2} />
            <text x={640} y={84} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily="ui-monospace, monospace">
              OpenAI(base_url="http://localhost:30000/v1", api_key="none")
            </text>
          </g>
        </g>

        {/* ---- close / recap ---- */}
        <g opacity={closeU}>
          <rect x={280} y={196} width={720} height={268} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={242} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            first token, start to finish
          </text>
          {[
            ['split', 'hot path on the card,\ncold experts in RAM', colors.ACCENT],
            ['boot', 'kt run resolves, tunes,\nand launches', colors.SECONDARY],
            ['circuit', 'both processors compute\nevery single layer', colors.POSITIVE],
            ['serve', 'one boring door\nevery client knows', colors.WARM],
          ].map(([head, sub, c], i) => (
            <g key={head}>
              <rect x={314 + i * 168} y={272} width={152} height={104} rx={10} fill={colors.BG} stroke={c} strokeWidth={1.4} />
              <text x={390 + i * 168} y={304} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
                {head}
              </text>
              {String(sub).split('\n').map((line, k) => (
                <text key={k} x={390 + i * 168} y={328 + k * 15} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
                  {line}
                </text>
              ))}
            </g>
          ))}
          <text x={640} y={430} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            next: The Expert Shuffle · The AMX Path · Tuning at Home
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
