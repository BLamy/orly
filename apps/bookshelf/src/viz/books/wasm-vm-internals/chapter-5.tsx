// The Swarm Is the Mirror
//
// Backing source: ~/Dev/wasm-vm — the chunked base image this chapter builds
// on is chapter 1's: `crates/storage` (ImageManifest: version 1, image_len
// 805,306,368, chunk_size 131,072, layout "split" → 6,144 chunks, ordered
// sha256 per chunk), served today from a single origin — the public R2 bucket
// (`web/main.js` R2_ASSETS → …r2.dev/chunked-alpine/manifest.json) with
// `chunks/{sha256}.bin` objects. BOOT_PROFILE below is the same recorded
// 100-chunk boot path as chapter 1 (releases/chunked-alpine/boot-profile.json).
//
// The chapter is a DESIGN chapter: the same manifest distributed as a torrent.
// The mapping is structural, not aspirational — a torrent piece is a fixed-size
// hashed unit listed in order, which is exactly what ImageManifest already is
// (BitTorrent v2 even uses SHA-256 per piece). WebTorrent-style browser peers
// exchange chunks directly; R2 stays in the swarm as the HTTP web seed
// (seed of last resort); the lazy filesystem sits on top by turning each
// guest read into a critical-priority piece while background fill continues
// rarest-first; per-piece availability (how many peers hold it) becomes a
// crowd-sourced popularity map that mirrors the boot profile.
//
// Centerpiece: chapter 1's chunk grid, now on the left — and on the right the
// thing that changes: one origin becoming a swarm of tabs that all hold, and
// serve, the hot one and a half percent.
import {
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The image, same scale as chapter 1: 6,144 × 128 KiB chunks — smaller cells,
// parked on the left so the swarm has the right half of the stage.
// ---------------------------------------------------------------------------

const IMAGE_LEN = 805306368;
const CHUNK = 131072;
const COUNT = IMAGE_LEN / CHUNK; // 6144

const COLS = 96;
const ROWS = COUNT / COLS; // 64
const CELL = 5.5;
const GX = 64;
const GY = 128;
const GRID_W = COLS * CELL;
const GRID_H = ROWS * CELL;
const cellX = (i: number): number => GX + (i % COLS) * CELL;
const cellY = (i: number): number => GY + Math.floor(i / COLS) * CELL;

// The real recorded boot profile (releases/chunked-alpine/boot-profile.json) —
// the 100 chunks a boot to `login:` touches, i.e. the hot set every peer holds.
const BOOT_PROFILE = [
  0, 2, 3, 2048, 66, 67, 4, 152, 88, 89, 90, 73, 94, 92, 93, 91, 68, 69, 72, 71, 78, 82, 169,
  123, 131, 83, 79, 141, 147, 70, 84, 142, 180, 143, 80, 77, 128, 130, 129, 95, 96, 97, 5, 253,
  197, 211, 145, 81, 74, 213, 215, 216, 214, 255, 87, 153, 4095, 4094, 4093, 4092, 4083, 16,
  4088, 1, 8, 32, 246, 161, 159, 175, 133, 168, 261, 276, 277, 146, 174, 204, 205, 144, 162,
  247, 248, 166, 163, 212, 140, 240, 245, 241, 164, 242, 243, 244, 165, 260, 252, 249, 250, 251,
];
const HOT = new Set(BOOT_PROFILE);

// The demand read the priority beat zooms on — same 4 KiB virtio read as ch1.
const READ_CHUNK = 67;

// ---------------------------------------------------------------------------
// The swarm: an origin (the bucket) and a ring of tabs on the right half.
// ---------------------------------------------------------------------------

const SW_CX = 940;
const SW_CY = 368;
const SW_R = 176;

const ORIGIN = { x: SW_CX, y: 118 }; // the bucket, above the ring
const YOU = 0; // index of "your tab" in the ring

const PEERS = Array.from({ length: 8 }, (_, k) => {
  const a = -Math.PI / 2 + (k * 2 * Math.PI) / 8;
  return { x: SW_CX + SW_R * Math.cos(a), y: SW_CY + SW_R * Math.sin(a) };
});

// Peer-to-peer exchange edges shown when the swarm forms (a sparse mesh, not
// the full clique — enough to read as "tabs talk to each other").
const MESH: Array<[number, number]> = [
  [0, 3], [0, 5], [1, 4], [1, 6], [2, 5], [2, 7], [3, 6], [4, 7], [0, 2], [5, 7],
];

// Per-piece availability (seeder count out of 8) for the heat-map beat:
// the recorded boot path is held by nearly everyone; the long tail by few.
const availability = (i: number): number =>
  HOT.has(i) ? 7 + (i % 2) : (i * 2654435761) % 8 < 2 ? 1 + (i % 2) : 0;

const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };
const CAM_SWARM: CameraState = { x: SW_CX - 40, y: SW_CY - 40, k: 1.35 };
const CAM_GRID: CameraState = { x: GX + GRID_W / 2 + 60, y: GY + GRID_H / 2 + 40, k: 1.3 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  originU: ChannelRef<number>;
  stormU: ChannelRef<number>;
  mapU: ChannelRef<number>;
  swarmU: ChannelRef<number>;
  seedU: ChannelRef<number>;
  prioU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  availU: ChannelRef<number>;
  verifyU: ChannelRef<number>;
  giveU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const originU = tl.channel('originU', 0);
  const stormU = tl.channel('stormU', 0);
  const mapU = tl.channel('mapU', 0);
  const swarmU = tl.channel('swarmU', 0);
  const seedU = tl.channel('seedU', 0);
  const prioU = tl.channel('prioU', 0);
  const fillU = tl.channel('fillU', 0);
  const availU = tl.channel('availU', 0);
  const verifyU = tl.channel('verifyU', 0);
  const giveU = tl.channel('giveU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · one origin —
  tl.caption({
    at: 0.5,
    dur: 6.95,
    text: 'Where do the chunks come from? Chapter one cut the disk into six thousand pieces, but every one of them still comes from the same place: a public bucket behind a content delivery network. One origin, many tabs.',
  });
  tl.tween(gridU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(originU, 1, { at: 2.2, dur: 1.6, ease: ease.enter });
  tl.hold(6.9, 0.6);

  // — Beat 2 · the popularity tax —
  tl.caption({
    at: 7.5,
    dur: 7.35,
    text: 'Now let a thousand tabs boot at once. Each fetches the same hundred hot chunks from the same origin, so the origin ships identical bytes a hundred thousand times. The cost and the latency both scale with popularity: the more loved the image, the more it costs to serve.',
  });
  tl.tween(stormU, 1, { at: 7.8, dur: 2.6, ease: ease.move });
  tl.hold(14.3, 0.6);

  // — Beat 3 · it is already a torrent —
  tl.caption({
    at: 14.9,
    dur: 7.15,
    text: 'But look at what the chunk store already is. Fixed-size pieces, each named by its own hash, listed in order by a manifest. That is a torrent. The modern torrent format even hashes its pieces with the same function our manifest uses — the two formats agree without either one trying.',
  });
  tl.tween(stormU, 0, { at: 15.1, dur: 0.9, ease: ease.move });
  tl.tween(mapU, 1, { at: 15.8, dur: 1.6, ease: ease.enter });
  tl.hold(21.5, 0.6);

  // — Beat 4 · the swarm forms —
  tl.caption({
    at: 22.1,
    dur: 7.35,
    text: 'So publish the same manifest as a torrent, and let the tabs connect to each other. Every tab that booted this image is already holding the hot chunks in its cache. Peers announce which pieces they hold, and a chunk can come from the nearest tab instead of a distant origin.',
  });
  tl.tween(cam, CAM_SWARM, { at: 22.3, dur: 1.8, ease: ease.move });
  tl.tween(mapU, 0, { at: 22.3, dur: 0.9, ease: ease.move });
  tl.tween(swarmU, 1, { at: 23.0, dur: 2.4, ease: ease.draw });
  tl.hold(28.9, 0.6);

  // — Beat 5 · the bucket becomes the web seed —
  tl.caption({
    at: 29.5,
    dur: 7.35,
    text: 'The bucket does not go away. It becomes the web seed: a permanent peer of last resort that speaks plain requests. If the swarm is empty at three in the morning, the torrent quietly degrades into exactly what ships today. The swarm is an accelerator, never a dependency.',
  });
  tl.tween(seedU, 1, { at: 30.0, dur: 1.8, ease: ease.move });
  tl.hold(36.3, 0.6);

  // — Beat 6 · a read is a deadline —
  tl.caption({
    at: 36.9,
    dur: 7.55,
    text: 'Here is where the lazy filesystem changes the client. A plain torrent downloads pieces in whatever order suits the swarm. But when the guest issues a read, that read is a deadline: the piece it needs jumps the whole queue, marked critical, and is requested from every source at once. First answer wins.',
  });
  tl.tween(cam, CAM_WIDE, { at: 37.1, dur: 1.6, ease: ease.move });
  tl.tween(prioU, 1, { at: 38.0, dur: 1.6, ease: ease.pop });
  tl.hold(43.9, 0.6);

  // — Beat 7 · background fill —
  tl.caption({
    at: 44.5,
    dur: 6.95,
    text: 'And while no read is blocked, the client keeps pulling the rest of the image in the background, so the disk quietly approaches complete. The guest never waits on background traffic. It only ever waits on its own reads, and those always go first.',
  });
  tl.tween(cam, CAM_GRID, { at: 44.7, dur: 1.6, ease: ease.move });
  tl.tween(fillU, 1, { at: 45.4, dur: 4.6, ease: ease.linear });
  tl.hold(50.9, 0.6);

  // — Beat 8 · availability is a heat map —
  tl.caption({
    at: 51.5,
    dur: 7.35,
    text: 'The swarm also tells us something the origin never could: how many peers hold each piece. The chunks on the boot path are held by nearly everyone, so availability is a crowd-sourced heat map of the image. Read it backwards, and the swarm is telling us what to prefetch.',
  });
  tl.tween(fillU, 0, { at: 51.7, dur: 0.9, ease: ease.move });
  tl.tween(availU, 1, { at: 52.4, dur: 2.2, ease: ease.move });
  tl.hold(58.3, 0.6);

  // — Beat 9 · trust is unchanged —
  tl.caption({
    at: 58.9,
    dur: 6.75,
    text: 'None of this touches trust. Every chunk is still hashed and checked against the manifest before a single byte reaches the guest, no matter who sent it. A malicious peer can waste a little of our time. It cannot corrupt the disk.',
  });
  tl.tween(cam, CAM_WIDE, { at: 59.1, dur: 1.4, ease: ease.move });
  tl.tween(verifyU, 1, { at: 59.9, dur: 1.4, ease: ease.pop });
  tl.hold(65.1, 0.6);

  // — Beat 10 · every reader becomes a mirror —
  tl.caption({
    at: 65.7,
    dur: 7.15,
    text: 'And the moment your tab has verified a chunk, it can serve it. After one boot you hold the exact hundred pieces the next tab needs first. Every reader becomes a mirror of the hottest part of the image, which means the popular chunks become the cheapest ones.',
  });
  tl.tween(verifyU, 0, { at: 65.9, dur: 0.8, ease: ease.move });
  tl.tween(giveU, 1, { at: 66.4, dur: 2.0, ease: ease.move });
  tl.hold(72.3, 0.6);

  // — Beat 11 · close —
  tl.caption({
    at: 72.9,
    dur: 6.35,
    text: 'One manifest, two transports. The bucket when you are alone; the swarm when you are not. The image that everyone wants becomes the image that is fastest to boot.',
  });
  tl.tween(dimAll, 0.12, { at: 73.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 74.4, dur: 0.9, ease: ease.enter });
  tl.hold(78.7, 1.6);

  return {
    tl, cam, gridU, originU, stormU, mapU, swarmU, seedU, prioU, fillU, availU, verifyU, giveU,
    dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Bucket({ u, demoted }: { u: number; demoted: number }) {
  if (u <= 0) return null;
  const c = demoted > 0.5 ? colors.MUTED : colors.WARM;
  return (
    <g opacity={u}>
      <rect x={ORIGIN.x - 44} y={ORIGIN.y - 26} width={88} height={52} rx={9} fill={colors.PANEL} stroke={c} strokeWidth={1.8} />
      <text x={ORIGIN.x} y={ORIGIN.y - 2} textAnchor="middle" fill={c} fontSize={13.5} fontWeight={700}>
        bucket
      </text>
      <text x={ORIGIN.x} y={ORIGIN.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
        chunks/&lt;sha256&gt;
      </text>
      {demoted > 0 && (
        <text x={ORIGIN.x} y={ORIGIN.y - 38} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontWeight={700} opacity={demoted}>
          web seed — peer of last resort
        </text>
      )}
    </g>
  );
}

function Tab({ x, y, u, you, label }: { x: number; y: number; u: number; you?: boolean; label?: string }) {
  if (u <= 0) return null;
  const c = you ? colors.ACCENT : colors.SECONDARY;
  return (
    <g opacity={u}>
      <rect x={x - 26} y={y - 18} width={52} height={36} rx={6} fill={colors.PANEL} stroke={c} strokeWidth={you ? 2 : 1.3} />
      <rect x={x - 26} y={y - 18} width={52} height={9} rx={4} fill={c} opacity={0.35} />
      <text x={x} y={y + 9} textAnchor="middle" fill={c} fontSize={11} fontWeight={you ? 700 : 400}>
        {label ?? 'tab'}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const originU = s.get(scene.originU);
  const stormU = s.get(scene.stormU);
  const mapU = s.get(scene.mapU);
  const swarmU = s.get(scene.swarmU);
  const seedU = s.get(scene.seedU);
  const prioU = s.get(scene.prioU);
  const fillU = s.get(scene.fillU);
  const availU = s.get(scene.availU);
  const verifyU = s.get(scene.verifyU);
  const giveU = s.get(scene.giveU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  // background fill sweeps the non-hot cells row by row
  const fillN = Math.floor(fillU * COUNT);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the image, chapter 1's grid ---- */}
          <g opacity={gridU}>
            <rect x={GX} y={GY} width={GRID_W} height={GRID_H} fill="#16202e" stroke={colors.GRID} strokeWidth={1.3} />
            <text x={GX} y={GY - 34} fill={colors.TEXT} fontSize={14.5}>
              the same image — 6,144 chunks × 128 KiB
            </text>
            <text x={GX} y={GY - 14} fill={colors.ACCENT} fontSize={12.5} opacity={0.9}>
              hot boot path: 100 chunks, 1.5%
            </text>
            {/* the hot set is always faintly visible — it is the protagonist */}
            {BOOT_PROFILE.map((i) => (
              <rect
                key={`h${i}`}
                x={cellX(i)}
                y={cellY(i)}
                width={CELL - 0.8}
                height={CELL - 0.8}
                fill={colors.ACCENT}
                opacity={availU > 0 ? 0.15 : 0.55}
              />
            ))}
          </g>

          {/* ---- background fill ---- */}
          {fillU > 0 &&
            Array.from({ length: Math.floor(fillN / COLS) }, (_, r) => (
              <rect
                key={`f${r}`}
                x={GX}
                y={GY + r * CELL}
                width={GRID_W}
                height={CELL - 0.6}
                fill={colors.SECONDARY}
                opacity={0.22}
              />
            ))}
          {fillU > 0.05 && fillU < 1 && (
            <text x={GX + GRID_W / 2} y={GY + GRID_H + 22} textAnchor="middle" fill={colors.SECONDARY} fontSize={13.5} opacity={0.9}>
              background fill — {Math.floor(fillU * 100)}% resident, never blocking a read
            </text>
          )}

          {/* ---- availability heat map ---- */}
          {availU > 0 && (
            <g opacity={availU}>
              {Array.from({ length: COUNT }, (_, i) => {
                const a = availability(i);
                if (a === 0) return null;
                return (
                  <rect
                    key={`a${i}`}
                    x={cellX(i)}
                    y={cellY(i)}
                    width={CELL - 0.8}
                    height={CELL - 0.8}
                    fill={HOT.has(i) ? colors.WARM : colors.SECONDARY}
                    opacity={0.12 + (a / 8) * 0.8}
                  />
                );
              })}
              <text x={GX + GRID_W / 2} y={GY + GRID_H + 22} textAnchor="middle" fill={colors.WARM} fontSize={13.5} fontWeight={700}>
                brightness = how many peers hold the piece
              </text>
              <text x={GX + GRID_W / 2} y={GY + GRID_H + 42} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                the swarm rediscovers the boot profile on its own
              </text>
            </g>
          )}

          {/* ---- beat 1–2: the origin and the request storm ---- */}
          <Bucket u={originU} demoted={seedU} />
          {originU > 0.3 && swarmU < 0.3 && (
            <g opacity={clamp01(originU * 2 - 0.6) * (1 - clamp01(mapU * 1.5))}>
              <line x1={GX + GRID_W + 8} y1={GY + 60} x2={ORIGIN.x - 52} y2={ORIGIN.y + 8} stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="5 5" opacity={0.7} />
              <text x={(GX + GRID_W + ORIGIN.x) / 2 - 16} y={GY + 8} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                every chunk, one source
              </text>
            </g>
          )}
          {stormU > 0 && (
            <g opacity={stormU}>
              {PEERS.map((p, k) => (
                <g key={k}>
                  <Tab x={p.x} y={p.y} u={clamp01(stormU * 2 - k * 0.12)} />
                  <line
                    x1={p.x}
                    y1={p.y - 20}
                    x2={ORIGIN.x + (k % 2 ? 30 : -30)}
                    y2={ORIGIN.y + 28}
                    stroke={colors.NEGATIVE}
                    strokeWidth={1.6}
                    opacity={clamp01(stormU * 2 - k * 0.12) * 0.65}
                  />
                </g>
              ))}
              <text x={SW_CX} y={SW_CY + SW_R + 52} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={700}>
                1,000 boots × 100 chunks = 100,000 fetches of the same bytes
              </text>
            </g>
          )}

          {/* ---- beat 3: manifest ↔ torrent ---- */}
          {mapU > 0 && (
            <g opacity={mapU}>
              <rect x={SW_CX - 240} y={238} width={480} height={190} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
              <text x={SW_CX - 218} y={272} fill={colors.TEXT} fontSize={15} fontWeight={700}>
                chunked image
              </text>
              <text x={SW_CX + 218} y={272} textAnchor="end" fill={colors.WARM} fontSize={15} fontWeight={700}>
                torrent
              </text>
              {[
                ['128 KiB chunk', 'piece'],
                ['manifest hash list', 'piece hashes (v2: sha-256)'],
                ['chunk index', 'piece index'],
                ['immutable base image', 'the shared file'],
              ].map(([l, r], k) => (
                <g key={k}>
                  <text x={SW_CX - 218} y={302 + k * 27} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                    {l}
                  </text>
                  <text x={SW_CX} y={302 + k * 27} textAnchor="middle" fill={colors.ACCENT} fontSize={13}>
                    =
                  </text>
                  <text x={SW_CX + 218} y={302 + k * 27} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily="monospace">
                    {r}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* ---- beat 4–5: the swarm ---- */}
          {swarmU > 0 && (
            <g>
              {MESH.map(([a, b], k) => (
                <line
                  key={k}
                  x1={PEERS[a].x}
                  y1={PEERS[a].y}
                  x2={PEERS[b].x}
                  y2={PEERS[b].y}
                  stroke={colors.SECONDARY}
                  strokeWidth={1.3}
                  opacity={clamp01(swarmU * 2 - 0.5 - k * 0.1) * 0.55}
                />
              ))}
              {PEERS.map((p, k) => (
                <Tab
                  key={k}
                  x={p.x}
                  y={p.y}
                  u={clamp01(swarmU * 2 - k * 0.12)}
                  you={k === YOU}
                  label={k === YOU ? 'you' : 'tab'}
                />
              ))}
              {/* the web-seed link, dashed, quiet */}
              {seedU > 0 && (
                <line
                  x1={ORIGIN.x}
                  y1={ORIGIN.y + 28}
                  x2={PEERS[YOU].x}
                  y2={PEERS[YOU].y - 20}
                  stroke={colors.MUTED}
                  strokeWidth={1.4}
                  strokeDasharray="6 6"
                  opacity={seedU * 0.8}
                />
              )}
              {swarmU > 0.6 && seedU < 0.3 && (
                <text x={SW_CX} y={SW_CY + SW_R + 52} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontWeight={700} opacity={clamp01(swarmU * 3 - 2)}>
                  peers trade the pieces they already hold
                </text>
              )}
            </g>
          )}

          {/* ---- beat 6: the critical piece ---- */}
          {prioU > 0 && (
            <g opacity={prioU}>
              <rect
                x={cellX(READ_CHUNK) - 2}
                y={cellY(READ_CHUNK) - 2}
                width={CELL + 3}
                height={CELL + 3}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={2}
              />
              <rect x={GX + 40} y={GY + GRID_H + 56} width={620} height={64} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={GX + 58} y={GY + GRID_H + 82} fill={colors.WARM} fontSize={13.5} fontWeight={700}>
                guest read → chunk 67 · CRITICAL
              </text>
              <text x={GX + 58} y={GY + GRID_H + 104} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
                ask: 3 peers + web seed, in parallel — first verified answer wins
              </text>
              <text x={GX + 640} y={GY + GRID_H + 82} textAnchor="end" fill={colors.MUTED} fontSize={12.5}>
                queue: background pieces wait
              </text>
              {/* the parallel race: three peers + the seed converge on the cell */}
              {[PEERS[2], PEERS[5], PEERS[7]].map((p, k) => (
                <line
                  key={k}
                  x1={p.x - 20}
                  y1={p.y}
                  x2={cellX(READ_CHUNK) + CELL}
                  y2={cellY(READ_CHUNK) + CELL / 2}
                  stroke={colors.WARM}
                  strokeWidth={1.3}
                  strokeDasharray="3 4"
                  opacity={clamp01(prioU * 2 - 0.4 - k * 0.2) * 0.6}
                />
              ))}
            </g>
          )}

          {/* ---- beat 9: verification ---- */}
          {verifyU > 0 && (
            <g opacity={verifyU}>
              <rect x={SW_CX - 210} y={SW_CY + SW_R + 24} width={420} height={58} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
              <text x={SW_CX} y={SW_CY + SW_R + 48} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={700}>
                every chunk: sha256 vs manifest, whoever sent it
              </text>
              <text x={SW_CX} y={SW_CY + SW_R + 68} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                bad peer → hash mismatch → drop and re-request
              </text>
            </g>
          )}

          {/* ---- beat 10: seeding back ---- */}
          {giveU > 0 && (
            <g opacity={giveU}>
              {[PEERS[1], PEERS[3], PEERS[6]].map((p, k) => (
                <line
                  key={k}
                  x1={PEERS[YOU].x}
                  y1={PEERS[YOU].y + 18}
                  x2={p.x}
                  y2={p.y - 16}
                  stroke={colors.ACCENT}
                  strokeWidth={1.7}
                  opacity={clamp01(giveU * 2 - k * 0.25) * 0.8}
                />
              ))}
              <text x={SW_CX} y={SW_CY + SW_R + 52} textAnchor="middle" fill={colors.ACCENT} fontSize={14.5} fontWeight={700}>
                you hold the hot 100 — now you serve them
              </text>
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={300} y={262} width={680} height={144} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={316} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              one manifest · web seed + swarm · reads jump the queue
            </text>
            <text x={640} y={360} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              the most popular image is the fastest one
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
