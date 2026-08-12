// Only the Blocks You Touch
//
// Backing source: ~/Dev/wasm-vm — `crates/storage` (E3-T01 chunked image format:
// ImageManifest, ChunkIndex, Layout::Split), `docs/design/chunked-image.md`,
// `docs/design/image-pipeline.md`, `crates/storage/src/prefetch.rs` (Readahead +
// boot_prefetch), `crates/storage/src/overlay.rs` + `docs/design/cow-overlay.md`
// (OVERLAY_BLOCK = 4096), and the committed artifacts in
// `releases/chunked-alpine/`: manifest.json (image_len 805,306,368 · chunk_size
// 131,072 · layout "split" → 6,144 chunks), 3,765 distinct files under chunks/,
// and boot-profile.json — the real ordered list of the first 100 chunks a boot
// to `login:` touches. Those 100 indices are the data in BOOT_PROFILE below.
//
// Second movement (formerly its own chapter, "The Swarm Is the Mirror"): the
// same manifest published as a torrent scoped to YOUR TAILNET — peers are the
// authenticated tabs/machines of chapter 2, ACLs gate who may join, the bucket
// is demoted to web seed (R2 or S3 or both; with an active swarm the seed goes
// quiet and egress stops dominating the bill), guest reads jump the queue as
// critical pieces, and per-piece availability re-derives the boot profile.
//
// Centerpiece: the whole disk as a 6,144-cell grid. It lights up chunk by
// chunk, then parks left while the tailnet swarm forms on the right.
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
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The image, to scale: 805,306,368 bytes in 131,072-byte chunks = 6,144 chunks.
// ---------------------------------------------------------------------------

const IMAGE_LEN = 805306368;
const CHUNK = 131072;
const COUNT = IMAGE_LEN / CHUNK; // 6144
const DISTINCT = 3765; // files actually under releases/chunked-alpine/chunks/

const COLS = 96;
const ROWS = COUNT / COLS; // 64
const CELL = 8;
const GX = 640 - (COLS * CELL) / 2;
const GY = 96;
const cellX = (i: number): number => GX + (i % COLS) * CELL;
const cellY = (i: number): number => GY + Math.floor(i / COLS) * CELL;

// The real recorded boot profile: releases/chunked-alpine/boot-profile.json.
const BOOT_PROFILE = [
  0, 2, 3, 2048, 66, 67, 4, 152, 88, 89, 90, 73, 94, 92, 93, 91, 68, 69, 72, 71, 78, 82, 169,
  123, 131, 83, 79, 141, 147, 70, 84, 142, 180, 143, 80, 77, 128, 130, 129, 95, 96, 97, 5, 253,
  197, 211, 145, 81, 74, 213, 215, 216, 214, 255, 87, 153, 4095, 4094, 4093, 4092, 4083, 16,
  4088, 1, 8, 32, 246, 161, 159, 175, 133, 168, 261, 276, 277, 146, 174, 204, 205, 144, 162,
  247, 248, 166, 163, 212, 140, 240, 245, 241, 164, 242, 243, 244, 165, 260, 252, 249, 250, 251,
];
const HOT = new Set(BOOT_PROFILE);

// The single read the scene zooms in on: a 4 KiB virtio-blk request.
const READ_OFFSET = 8_781_824; // bytes
const READ_CHUNK = Math.floor(READ_OFFSET / CHUNK); // 67
const READ_INTRA = READ_OFFSET % CHUNK;

// A sequential run that trips readahead (three consecutive accesses → window 4).
const RUN = [300, 301, 302];
const AHEAD = [303, 304, 305, 306];

// Copy-on-write: 4 KiB overlay blocks written above the immutable base.
const OVERLAY_BLOCKS = [
  { i: 67, k: 0 },
  { i: 130, k: 1 },
  { i: 131, k: 2 },
  { i: 2048, k: 3 },
];

const MB = (chunks: number): string => ((chunks * CHUNK) / 1_048_576).toFixed(1);

// ---------------------------------------------------------------------------
// Movement 2 — the grid parks left (one transform over the whole field) and
// the tailnet swarm takes the right half of the stage.
// ---------------------------------------------------------------------------

// Park transform: scale about the origin plus a translate chosen so the grid
// center (640, 352) lands at (300, 360).
const PARK_S = 0.62;
const PARK_TX = 300 - 640 * PARK_S; // ≈ -96.8
const PARK_TY = 360 - 352 * PARK_S; // ≈ 141.8

const SW_CX = 930;
const SW_CY = 368;
const SW_R = 168;
const ORIGIN = { x: SW_CX, y: 108 }; // the bucket, above the ring
const YOU = 0;
const PEERS = Array.from({ length: 8 }, (_, k) => {
  const a = -Math.PI / 2 + (k * 2 * Math.PI) / 8;
  return { x: SW_CX + SW_R * Math.cos(a), y: SW_CY + SW_R * Math.sin(a) };
});
const MESH: Array<[number, number]> = [
  [0, 3], [0, 5], [1, 4], [1, 6], [2, 5], [2, 7], [3, 6], [4, 7], [0, 2], [5, 7],
];

// Per-piece availability (seeder count out of 8) for the heat-map beat.
const availability = (i: number): number =>
  HOT.has(i) ? 7 + (i % 2) : (i * 2654435761) % 8 < 2 ? 1 + (i % 2) : 0;

const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };
const CAM_CELL: CameraState = { x: cellX(READ_CHUNK) + 40, y: cellY(READ_CHUNK) + 120, k: 1.75 };
const CAM_RUN: CameraState = { x: cellX(RUN[0]) + 40, y: cellY(RUN[0]) + 30, k: 2.2 };
const CAM_OVERLAY: CameraState = { x: 640, y: 400, k: 1.15 };
const CAM_SWARM: CameraState = { x: SW_CX - 50, y: SW_CY - 40, k: 1.3 };
const CAM_PARK: CameraState = { x: 310, y: 380, k: 1.45 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  imageU: ChannelRef<number>;
  monoU: ChannelRef<number>;
  splitU: ChannelRef<number>;
  hashU: ChannelRef<number>;
  dedupeU: ChannelRef<number>;
  readU: ChannelRef<number>;
  mathU: ChannelRef<number>;
  verifyU: ChannelRef<number>;
  bootU: ChannelRef<number>;
  raU: ChannelRef<number>;
  cowU: ChannelRef<number>;
  shiftU: ChannelRef<number>;
  originU: ChannelRef<number>;
  stormU: ChannelRef<number>;
  mapU: ChannelRef<number>;
  swarmU: ChannelRef<number>;
  seedU: ChannelRef<number>;
  econU: ChannelRef<number>;
  prioU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  availU: ChannelRef<number>;
  trustU: ChannelRef<number>;
  giveU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);
  const imageU = tl.channel('imageU', 0);
  const monoU = tl.channel('monoU', 0);
  const splitU = tl.channel('splitU', 0);
  const hashU = tl.channel('hashU', 0);
  const dedupeU = tl.channel('dedupeU', 0);
  const readU = tl.channel('readU', 0);
  const mathU = tl.channel('mathU', 0);
  const verifyU = tl.channel('verifyU', 0);
  const bootU = tl.channel('bootU', 0);
  const raU = tl.channel('raU', 0);
  const cowU = tl.channel('cowU', 0);
  const shiftU = tl.channel('shiftU', 0);
  const originU = tl.channel('originU', 0);
  const stormU = tl.channel('stormU', 0);
  const mapU = tl.channel('mapU', 0);
  const swarmU = tl.channel('swarmU', 0);
  const seedU = tl.channel('seedU', 0);
  const econU = tl.channel('econU', 0);
  const prioU = tl.channel('prioU', 0);
  const fillU = tl.channel('fillU', 0);
  const availU = tl.channel('availU', 0);
  const trustU = tl.channel('trustU', 0);
  const giveU = tl.channel('giveU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // ======================= movement 1 · the lazy disk =======================

  // — Beat 1 · the disk —
  tl.caption({
    at: 0.5,
    dur: 6.95,
    text: 'This is the Alpine disk image that wasm-vm boots in a browser tab. Seven hundred and sixty-eight megabytes of ext4, and the browser needs to behave as though all of it is available at once.',
  });
  tl.tween(imageU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.hold(6.9, 0.6);

  // — Beat 2 · the naive way —
  tl.caption({
    at: 7.5,
    dur: 6.75,
    text: 'The obvious approach is to download the whole thing before you boot. On a good connection that is a minute of staring at a progress bar, and on a bad one it is a reason to close the tab.',
  });
  tl.tween(monoU, 1, { at: 7.8, dur: 3.4, ease: ease.linear });
  tl.hold(13.7, 0.6);

  // — Beat 3 · cut it up —
  tl.caption({
    at: 14.3,
    dur: 6.95,
    text: 'So the image is cut into fixed chunks of a hundred and twenty-eight kilobytes each. Six thousand one hundred and forty-four of them, and a manifest that lists a cryptographic hash of every single one, in order.',
  });
  tl.tween(monoU, 0, { at: 14.5, dur: 0.8, ease: ease.move });
  tl.tween(splitU, 1, { at: 15.0, dur: 1.8, ease: ease.draw });
  tl.tween(hashU, 1, { at: 17.2, dur: 1.6, ease: ease.enter });
  tl.hold(20.7, 0.6);

  // — Beat 4 · content addressing —
  tl.caption({
    at: 21.3,
    dur: 7.15,
    text: 'Each chunk is stored under its own hash, so two identical chunks become one file. Six thousand chunks collapse to three thousand seven hundred and sixty-five distinct objects, and every one of them can be cached forever, because its name is its content.',
  });
  tl.tween(dedupeU, 1, { at: 21.8, dur: 2.0, ease: ease.move });
  tl.hold(27.9, 0.6);

  // — Beat 5 · what the guest actually asks for —
  tl.caption({
    at: 28.5,
    dur: 6.95,
    text: 'Now watch what the guest actually asks for. Linux never requests a disk image. It requests a block: four kilobytes, at some byte offset, through virtio.',
  });
  tl.tween(cam, CAM_CELL, { at: 28.7, dur: 1.8, ease: ease.move });
  tl.tween(readU, 1, { at: 29.6, dur: 1.0, ease: ease.pop });
  tl.hold(34.9, 0.6);

  // — Beat 6 · the division —
  tl.caption({
    at: 35.5,
    dur: 6.95,
    text: 'And turning that offset into a chunk is one division. The offset over the chunk size is which chunk; the remainder is how far into it. One four-kilobyte read touches exactly one chunk.',
  });
  tl.tween(mathU, 1, { at: 36.0, dur: 1.4, ease: ease.enter });
  tl.hold(41.9, 0.6);

  // — Beat 7 · fetch and verify —
  tl.caption({
    at: 42.5,
    dur: 6.75,
    text: 'That one chunk gets fetched, hashed, and compared against the manifest before a single byte reaches the guest. A mismatch is a typed error and a refetch — never a panic, and never silently wrong data.',
  });
  tl.tween(verifyU, 1, { at: 43.0, dur: 1.6, ease: ease.pop });
  tl.hold(48.7, 0.6);

  // — Beat 8 · the boot profile —
  tl.caption({
    at: 49.3,
    dur: 7.55,
    text: 'Do that for a whole boot and the picture is startling. The recorded profile of booting this image to a login prompt is one hundred chunks. Twelve and a half megabytes of a seven hundred and sixty-eight megabyte disk — about one and a half percent.',
  });
  tl.tween(cam, CAM_WIDE, { at: 49.5, dur: 1.6, ease: ease.move });
  tl.tween(bootU, 1, { at: 50.4, dur: 3.4, ease: ease.linear });
  tl.hold(56.3, 0.6);

  // — Beat 9 · readahead —
  tl.caption({
    at: 56.9,
    dur: 6.95,
    text: 'Streaming reads get help. Three consecutive chunks in a row is treated as a stream rather than a coincidence, and the next four are fetched before the guest asks — so copying a large file does not pay a round trip per block.',
  });
  tl.tween(cam, CAM_RUN, { at: 57.1, dur: 1.6, ease: ease.move });
  tl.tween(raU, 1, { at: 58.0, dur: 2.0, ease: ease.move });
  tl.hold(63.3, 0.6);

  // — Beat 10 · writes never touch the base —
  tl.caption({
    at: 63.9,
    dur: 7.15,
    text: 'And when the guest writes, none of this is invalidated, because the base image is immutable. Writes land in a copy-on-write overlay in four kilobyte blocks, and reads merge the overlay over the chunks underneath.',
  });
  tl.tween(cam, CAM_OVERLAY, { at: 64.1, dur: 1.8, ease: ease.move });
  tl.tween(cowU, 1, { at: 65.2, dur: 2.0, ease: ease.pop });
  tl.hold(70.5, 0.6);

  // ==================== movement 2 · the swarm is the mirror ====================

  // — Beat 11 · one origin —
  tl.caption({
    at: 71.1,
    dur: 7.0,
    text: 'That disk has one more trick in it. Where do the chunks come from? Today, every one of them comes from the same place: a public bucket behind a content delivery network. One origin, many tabs.',
  });
  tl.tween(cam, CAM_WIDE, { at: 71.3, dur: 1.6, ease: ease.move });
  tl.tween(cowU, 0, { at: 71.3, dur: 0.9, ease: ease.move });
  tl.tween(readU, 0, { at: 71.3, dur: 0.9, ease: ease.move });
  tl.tween(mathU, 0, { at: 71.3, dur: 0.9, ease: ease.move });
  tl.tween(raU, 0, { at: 71.3, dur: 0.9, ease: ease.move });
  tl.tween(shiftU, 1, { at: 71.6, dur: 2.0, ease: ease.move });
  tl.tween(originU, 1, { at: 73.4, dur: 1.6, ease: ease.enter });
  tl.hold(77.5, 0.6);

  // — Beat 12 · the popularity tax —
  tl.caption({
    at: 78.1,
    dur: 7.35,
    text: 'Now let a thousand tabs boot at once. Each fetches the same hundred hot chunks from the same origin — identical bytes shipped a hundred thousand times. The more loved the image, the more it costs to serve.',
  });
  tl.tween(stormU, 1, { at: 78.4, dur: 2.6, ease: ease.move });
  tl.hold(84.9, 0.6);

  // — Beat 13 · it is already a torrent —
  tl.caption({
    at: 85.5,
    dur: 7.15,
    text: 'But look at what the chunk store already is. Fixed-size pieces, each named by its own hash, listed in order by a manifest. That is a torrent — the modern torrent format even hashes its pieces with the same function our manifest uses.',
  });
  tl.tween(stormU, 0, { at: 85.7, dur: 0.9, ease: ease.move });
  tl.tween(mapU, 1, { at: 86.4, dur: 1.6, ease: ease.enter });
  tl.hold(92.1, 0.6);

  // — Beat 14 · the swarm forms, inside the tailnet —
  tl.caption({
    at: 92.7,
    dur: 7.55,
    text: 'So publish the same manifest as a torrent — but scope the swarm to your tailnet. The peers are not strangers on the internet; they are the tabs and machines your own network gave identities. Everyone on the tailnet who booted this image announces which pieces they hold, and a chunk comes from the nearest teammate instead of a distant origin.',
  });
  tl.tween(cam, CAM_SWARM, { at: 92.9, dur: 1.8, ease: ease.move });
  tl.tween(mapU, 0, { at: 92.9, dur: 0.9, ease: ease.move });
  tl.tween(swarmU, 1, { at: 93.6, dur: 2.4, ease: ease.draw });
  tl.hold(99.7, 0.6);

  // — Beat 15 · the bucket becomes the web seed —
  tl.caption({
    at: 100.3,
    dur: 7.35,
    text: 'The bucket does not go away. It becomes the web seed: a permanent peer of last resort that speaks plain requests. If nobody on your tailnet is awake at three in the morning, the torrent quietly degrades into exactly what ships today. The tailnet swarm is an accelerator, never a dependency.',
  });
  tl.tween(seedU, 1, { at: 100.8, dur: 1.8, ease: ease.move });
  tl.hold(107.1, 0.6);

  // — Beat 16 · seed economics —
  tl.caption({
    at: 107.7,
    dur: 7.75,
    text: 'And the seed is just an object store, so it can be R2, or S3, or both seeding the same manifest. R2 charges nothing for egress, which wins while the origin serves every boot. But a busy tailnet serves the hot chunks itself and the seed goes quiet — and once egress stops mattering, S3 and its cheaper cold tiers become the better seat. The busier your swarm, the cheaper the seed.',
  });
  tl.tween(econU, 1, { at: 108.2, dur: 1.6, ease: ease.enter });
  tl.hold(114.9, 0.6);

  // — Beat 17 · a read is a deadline —
  tl.caption({
    at: 115.5,
    dur: 7.55,
    text: 'Here is where the lazy filesystem changes the client. A plain torrent downloads pieces in whatever order suits the swarm. But when the guest issues a read, that read is a deadline: the piece it needs jumps the whole queue, marked critical, and is requested from every source at once. First answer wins.',
  });
  tl.tween(cam, CAM_WIDE, { at: 115.7, dur: 1.6, ease: ease.move });
  tl.tween(econU, 0, { at: 115.7, dur: 0.9, ease: ease.move });
  tl.tween(prioU, 1, { at: 116.6, dur: 1.6, ease: ease.pop });
  tl.hold(122.5, 0.6);

  // — Beat 18 · background fill —
  tl.caption({
    at: 123.1,
    dur: 6.95,
    text: 'And while no read is blocked, the client keeps pulling the rest of the image in the background, so the disk quietly approaches complete. The guest never waits on background traffic. It only ever waits on its own reads, and those always go first.',
  });
  tl.tween(cam, CAM_PARK, { at: 123.3, dur: 1.6, ease: ease.move });
  tl.tween(prioU, 0, { at: 123.3, dur: 0.9, ease: ease.move });
  tl.tween(fillU, 1, { at: 124.0, dur: 4.6, ease: ease.linear });
  tl.hold(129.5, 0.6);

  // — Beat 19 · availability is a heat map —
  tl.caption({
    at: 130.1,
    dur: 7.35,
    text: 'The swarm also tells us something the origin never could: how many peers hold each piece. The boot path is held by nearly everyone, so availability is a crowd-sourced heat map — read it backwards and the swarm is telling us what to prefetch.',
  });
  tl.tween(fillU, 0, { at: 130.3, dur: 0.9, ease: ease.move });
  tl.tween(availU, 1, { at: 131.0, dur: 2.2, ease: ease.move });
  tl.hold(136.9, 0.6);

  // — Beat 20 · trust is layered —
  tl.caption({
    at: 137.5,
    dur: 7.15,
    text: 'Trust is layered, not assumed. The tailnet authenticates every peer and its access rules decide who may join at all — no trackers, no strangers. And every chunk is still hashed against the manifest before a byte reaches the guest, so a compromised teammate can waste our time but cannot corrupt the disk.',
  });
  tl.tween(cam, CAM_WIDE, { at: 137.7, dur: 1.4, ease: ease.move });
  tl.tween(availU, 0, { at: 137.7, dur: 0.9, ease: ease.move });
  tl.tween(trustU, 1, { at: 138.5, dur: 1.4, ease: ease.pop });
  tl.hold(144.1, 0.6);

  // — Beat 21 · every reader becomes a mirror —
  tl.caption({
    at: 144.7,
    dur: 7.15,
    text: 'And the moment your tab has verified a chunk, it can serve it. After one boot you hold the exact hundred pieces the next tab needs first — every reader becomes a mirror of the hottest part of the image.',
  });
  tl.tween(trustU, 0, { at: 144.9, dur: 0.8, ease: ease.move });
  tl.tween(giveU, 1, { at: 145.4, dur: 2.0, ease: ease.move });
  tl.hold(151.3, 0.6);

  // — Beat 22 · close —
  tl.caption({
    at: 151.9,
    dur: 7.0,
    text: 'One and a half percent of a disk gets you a login prompt, and one manifest travels two transports: the bucket when you are alone, your tailnet when you are not. The image your team boots every day is the one that boots fastest.',
  });
  tl.tween(dimAll, 0.12, { at: 152.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 153.4, dur: 0.9, ease: ease.enter });
  tl.hold(158.4, 1.6);

  return {
    tl, cam, imageU, monoU, splitU, hashU, dedupeU, readU, mathU, verifyU, bootU, raU, cowU,
    shiftU, originU, stormU, mapU, swarmU, seedU, econU, prioU, fillU, availU, trustU, giveU,
    dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Cell({ i, fill, u, stroke }: { i: number; fill: string; u: number; stroke?: string }) {
  if (u <= 0) return null;
  return (
    <rect
      x={cellX(i)}
      y={cellY(i)}
      width={CELL - 1}
      height={CELL - 1}
      fill={fill}
      opacity={u}
      stroke={stroke}
      strokeWidth={stroke ? 1 : 0}
    />
  );
}

function Bucket({ u, demoted, econ }: { u: number; demoted: number; econ: number }) {
  if (u <= 0) return null;
  const c = demoted > 0.5 ? colors.MUTED : colors.WARM;
  return (
    <g opacity={u}>
      <rect x={ORIGIN.x - 52} y={ORIGIN.y - 26} width={104} height={52} rx={9} fill={colors.PANEL} stroke={c} strokeWidth={1.8} />
      <text x={ORIGIN.x} y={ORIGIN.y - 2} textAnchor="middle" fill={c} fontSize={13.5} fontWeight={700}>
        {econ > 0.4 ? 'R2 · S3' : 'bucket'}
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
  const imageU = s.get(scene.imageU);
  const monoU = s.get(scene.monoU);
  const splitU = s.get(scene.splitU);
  const hashU = s.get(scene.hashU);
  const dedupeU = s.get(scene.dedupeU);
  const readU = s.get(scene.readU);
  const mathU = s.get(scene.mathU);
  const verifyU = s.get(scene.verifyU);
  const bootU = s.get(scene.bootU);
  const raU = s.get(scene.raU);
  const cowU = s.get(scene.cowU);
  const shiftU = s.get(scene.shiftU);
  const originU = s.get(scene.originU);
  const stormU = s.get(scene.stormU);
  const mapU = s.get(scene.mapU);
  const swarmU = s.get(scene.swarmU);
  const seedU = s.get(scene.seedU);
  const econU = s.get(scene.econU);
  const prioU = s.get(scene.prioU);
  const fillU = s.get(scene.fillU);
  const availU = s.get(scene.availU);
  const trustU = s.get(scene.trustU);
  const giveU = s.get(scene.giveU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const gridW = COLS * CELL;
  const gridH = ROWS * CELL;

  // how many boot-profile chunks are resident right now
  const bootN = Math.floor(bootU * BOOT_PROFILE.length);
  const resident = bootN + (verifyU > 0.5 ? 1 : 0);

  // park transform for movement 2
  const ps = lerp(1, PARK_S, shiftU);
  const ptx = lerp(0, PARK_TX, shiftU);
  const pty = lerp(0, PARK_TY, shiftU);

  // background fill sweeps rows during the fill beat
  const fillRows = Math.floor(fillU * ROWS);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ================ the disk field (parks left in movement 2) ================ */}
          <g transform={`translate(${ptx} ${pty}) scale(${ps})`}>
            <g opacity={imageU}>
              <rect x={GX} y={GY} width={gridW} height={gridH} fill="#16202e" stroke={colors.GRID} strokeWidth={1.4} />
              {monoU > 0 && (
                <>
                  <rect x={GX} y={GY} width={gridW} height={gridH * monoU} fill={colors.NEGATIVE} opacity={0.28} />
                  <text x={GX + gridW / 2} y={GY - 16} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16} fontWeight={700}>
                    downloading {MB(COUNT * monoU)} MB of {MB(COUNT)} MB
                  </text>
                </>
              )}
              {splitU > 0 && (
                <g opacity={splitU * 0.5}>
                  {Array.from({ length: COLS - 1 }, (_, c) => (
                    <line key={`v${c}`} x1={GX + (c + 1) * CELL} y1={GY} x2={GX + (c + 1) * CELL} y2={GY + gridH} stroke={colors.GRID} strokeWidth={0.6} />
                  ))}
                  {Array.from({ length: ROWS - 1 }, (_, r) => (
                    <line key={`h${r}`} x1={GX} y1={GY + (r + 1) * CELL} x2={GX + gridW} y2={GY + (r + 1) * CELL} stroke={colors.GRID} strokeWidth={0.6} />
                  ))}
                </g>
              )}
            </g>

            {/* labels around the field (movement 1 only) */}
            {imageU > 0.5 && monoU < 0.2 && shiftU < 0.4 && (
              <g opacity={clamp01(imageU * 2 - 1) * (1 - clamp01(readU * 1.4)) * (1 - clamp01(shiftU * 2.5))}>
                <text x={GX} y={GY - 40} fill={colors.TEXT} fontSize={15}>
                  alpine-rootfs.ext4 — 805,306,368 bytes
                </text>
                {splitU > 0.3 && (
                  <text x={GX} y={GY - 18} fill={colors.ACCENT} fontSize={14} opacity={splitU}>
                    {COUNT.toLocaleString()} chunks × 131,072 bytes
                  </text>
                )}
                {hashU > 0.3 && (
                  <text x={GX + gridW} y={GY - 40} textAnchor="end" fill={colors.MUTED} fontSize={13.5} fontFamily="monospace" opacity={hashU}>
                    chunks/&lt;sha256&gt;.bin
                  </text>
                )}
                {dedupeU > 0.3 && (
                  <text x={GX + gridW} y={GY - 18} textAnchor="end" fill={colors.POSITIVE} fontSize={14} fontWeight={700} opacity={dedupeU}>
                    {COUNT.toLocaleString()} chunks → {DISTINCT.toLocaleString()} distinct objects
                  </text>
                )}
              </g>
            )}
            {shiftU > 0.6 && (
              <text x={GX} y={GY - 24} fill={colors.TEXT} fontSize={17} opacity={clamp01(shiftU * 3 - 2)}>
                the same image — hot boot path always faintly lit
              </text>
            )}

            {/* ---- the one read ---- */}
            {readU > 0 && (
              <g opacity={readU}>
                <rect x={cellX(READ_CHUNK) - 2} y={cellY(READ_CHUNK) - 2} width={CELL + 3} height={CELL + 3} fill="none" stroke={colors.WARM} strokeWidth={2} />
                <line x1={cellX(READ_CHUNK) + CELL / 2} y1={cellY(READ_CHUNK) - 44} x2={cellX(READ_CHUNK) + CELL / 2} y2={cellY(READ_CHUNK) - 6} stroke={colors.WARM} strokeWidth={2} />
                <text x={cellX(READ_CHUNK) + CELL / 2} y={cellY(READ_CHUNK) - 52} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700}>
                  virtio-blk read · 4 KiB
                </text>
              </g>
            )}
            {mathU > 0 && (
              <g opacity={mathU}>
                <rect x={cellX(READ_CHUNK) - 150} y={cellY(READ_CHUNK) + 26} width={330} height={78} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} />
                <text x={cellX(READ_CHUNK) - 136} y={cellY(READ_CHUNK) + 52} fill={colors.TEXT} fontSize={13.5} fontFamily="monospace">
                  offset {READ_OFFSET.toLocaleString()}
                </text>
                <text x={cellX(READ_CHUNK) - 136} y={cellY(READ_CHUNK) + 74} fill={colors.ACCENT} fontSize={13.5} fontFamily="monospace">
                  ÷ 131,072 → chunk {READ_CHUNK}
                </text>
                <text x={cellX(READ_CHUNK) - 136} y={cellY(READ_CHUNK) + 94} fill={colors.SECONDARY} fontSize={13.5} fontFamily="monospace">
                  remainder → byte {READ_INTRA.toLocaleString()}
                </text>
              </g>
            )}
            {verifyU > 0 && shiftU < 0.4 && (
              <g opacity={verifyU * (1 - clamp01(shiftU * 2.5))}>
                <Cell i={READ_CHUNK} fill={colors.ACCENT} u={1} />
                <text x={cellX(READ_CHUNK) + 22} y={cellY(READ_CHUNK) + 6} fill={colors.POSITIVE} fontSize={13} fontWeight={700}>
                  sha256 ✓ cached
                </text>
              </g>
            )}

            {/* ---- the boot profile lighting up (stays lit as the hot set) ---- */}
            {bootU > 0 &&
              BOOT_PROFILE.slice(0, bootN).map((i, k) => (
                <Cell
                  key={i}
                  i={i}
                  fill={colors.ACCENT}
                  u={clamp01(0.55 + k / BOOT_PROFILE.length) * (availU > 0 ? 0.25 : 1)}
                />
              ))}

            {/* ---- readahead ---- */}
            {raU > 0 && (
              <g>
                {RUN.map((i, k) => (
                  <Cell key={i} i={i} fill={colors.ACCENT} u={clamp01(raU * 3 - k * 0.3)} />
                ))}
                {AHEAD.map((i, k) => (
                  <Cell key={i} i={i} fill={colors.SECONDARY} u={clamp01(raU * 2 - 0.9 - k * 0.18)} />
                ))}
                {raU > 0.55 && (
                  <text x={cellX(RUN[0]) - 6} y={cellY(RUN[0]) - 16} fill={colors.SECONDARY} fontSize={13} fontWeight={700} opacity={clamp01(raU * 3 - 1.7)}>
                    run of 3 → prefetch the next 4
                  </text>
                )}
              </g>
            )}

            {/* ---- the copy-on-write overlay ---- */}
            {cowU > 0 && (
              <g opacity={cowU}>
                <rect x={GX} y={GY + gridH + 34} width={gridW} height={54} rx={6} fill="#16202e" stroke={colors.POSITIVE} strokeWidth={1.4} />
                <text x={GX + 12} y={GY + gridH + 26} fill={colors.POSITIVE} fontSize={13.5}>
                  write overlay — 4 KiB blocks, sparse
                </text>
                {OVERLAY_BLOCKS.map((b, k) => {
                  const u = clamp01(cowU * 3 - k * 0.4);
                  if (u <= 0) return null;
                  return (
                    <g key={b.i} opacity={u}>
                      <rect x={GX + 24 + k * 78} y={GY + gridH + 48} width={26} height={26} rx={3} fill={colors.POSITIVE} />
                      <line
                        x1={GX + 37 + k * 78}
                        y1={GY + gridH + 44}
                        x2={cellX(b.i) + CELL / 2}
                        y2={cellY(b.i) + CELL}
                        stroke={colors.POSITIVE}
                        strokeWidth={1.2}
                        strokeDasharray="4 4"
                        opacity={0.6}
                      />
                    </g>
                  );
                })}
                <text x={GX + gridW - 12} y={GY + gridH + 26} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                  the base image is never modified
                </text>
              </g>
            )}

            {/* ---- movement 2 grid overlays: fill sweep + availability heat ---- */}
            {fillU > 0 &&
              Array.from({ length: fillRows }, (_, r) => (
                <rect key={`f${r}`} x={GX} y={GY + r * CELL} width={gridW} height={CELL - 0.8} fill={colors.SECONDARY} opacity={0.22} />
              ))}
            {fillU > 0.05 && fillU < 1 && (
              <text x={GX + gridW / 2} y={GY + gridH + 30} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} opacity={0.9}>
                background fill — {Math.floor(fillU * 100)}% resident, never blocking a read
              </text>
            )}
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
                      width={CELL - 1}
                      height={CELL - 1}
                      fill={HOT.has(i) ? colors.WARM : colors.SECONDARY}
                      opacity={0.12 + (a / 8) * 0.8}
                    />
                  );
                })}
                <text x={GX + gridW / 2} y={GY + gridH + 30} textAnchor="middle" fill={colors.WARM} fontSize={15} fontWeight={700}>
                  brightness = how many peers hold the piece
                </text>
                <text x={GX + gridW / 2} y={GY + gridH + 56} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                  the swarm rediscovers the boot profile on its own
                </text>
              </g>
            )}

            {/* ---- the running byte counter (movement 1) ---- */}
            {(bootU > 0 || verifyU > 0) && shiftU < 0.4 && (
              <g opacity={clamp01(Math.max(bootU * 4, verifyU)) * (1 - clamp01(shiftU * 2.5))}>
                <text x={GX + gridW / 2} y={GY + gridH + 24} textAnchor="middle" fill={colors.ACCENT} fontSize={19} fontWeight={700} opacity={cowU > 0.3 ? 0.25 : 1}>
                  {MB(resident)} MB fetched · {MB(COUNT)} MB image
                </text>
              </g>
            )}
          </g>

          {/* ================ movement 2 · the swarm (unparked coordinates) ================ */}
          {swarmU > 0 && (
            <g>
              {/* the tailnet boundary */}
              <circle cx={SW_CX} cy={SW_CY} r={SW_R + 58} fill="none" stroke={colors.TEAL} strokeWidth={1.4} strokeDasharray="8 7" opacity={swarmU * 0.55} />
              <text x={SW_CX} y={SW_CY - SW_R - 68} textAnchor="middle" fill={colors.TEAL} fontSize={13.5} fontWeight={700} opacity={swarmU}>
                your tailnet — authenticated peers, access rules gate the swarm
              </text>
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
                <Tab key={k} x={p.x} y={p.y} u={clamp01(swarmU * 2 - k * 0.12)} you={k === YOU} label={k === YOU ? 'you' : 'tab'} />
              ))}
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
              {/* seeding back */}
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
          )}

          {/* the origin and the request storm */}
          <Bucket u={originU} demoted={seedU} econ={econU} />
          {originU > 0.3 && swarmU < 0.3 && (
            <g opacity={clamp01(originU * 2 - 0.6) * (1 - clamp01(mapU * 1.5))}>
              <line x1={GX * PARK_S + PARK_TX + gridW * PARK_S + 8} y1={330} x2={ORIGIN.x - 58} y2={ORIGIN.y + 12} stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="5 5" opacity={0.7} />
              <text x={700} y={200} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
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

          {/* chunked image ↔ torrent mapping */}
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

          {/* seed economics: R2 vs S3 */}
          {econU > 0 && (
            <g opacity={econU}>
              <rect x={SW_CX - 250} y={SW_CY + SW_R + 66} width={500} height={118} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={SW_CX} y={SW_CY + SW_R + 94} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700}>
                who should hold the seed?
              </text>
              <text x={SW_CX - 228} y={SW_CY + SW_R + 122} fill={colors.ACCENT} fontSize={12.5} fontFamily="monospace">
                quiet swarm → R2: free egress wins
              </text>
              <text x={SW_CX - 228} y={SW_CY + SW_R + 146} fill={colors.WARM} fontSize={12.5} fontFamily="monospace">
                busy swarm → seed idle → S3 cold tiers win
              </text>
              <text x={SW_CX - 228} y={SW_CY + SW_R + 170} fill={colors.MUTED} fontSize={12}>
                same manifest either way — or both at once
              </text>
            </g>
          )}

          {/* a read is a deadline */}
          {prioU > 0 && (
            <g opacity={prioU}>
              <rect x={370} y={470} width={620} height={64} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={388} y={496} fill={colors.WARM} fontSize={13.5} fontWeight={700}>
                guest read → chunk 67 · CRITICAL
              </text>
              <text x={388} y={518} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
                ask: 3 peers + web seed, in parallel — first verified answer wins
              </text>
              <text x={972} y={496} textAnchor="end" fill={colors.MUTED} fontSize={12.5}>
                queue: background pieces wait
              </text>
              {[PEERS[2], PEERS[5], PEERS[7]].map((p, k) => (
                <line
                  key={k}
                  x1={p.x - 20}
                  y1={p.y}
                  x2={cellX(READ_CHUNK) * PARK_S + PARK_TX + CELL}
                  y2={cellY(READ_CHUNK) * PARK_S + PARK_TY + CELL / 2}
                  stroke={colors.WARM}
                  strokeWidth={1.3}
                  strokeDasharray="3 4"
                  opacity={clamp01(prioU * 2 - 0.4 - k * 0.2) * 0.6}
                />
              ))}
            </g>
          )}

          {/* trust is layered */}
          {trustU > 0 && (
            <g opacity={trustU}>
              <rect x={SW_CX - 210} y={SW_CY + SW_R + 66} width={420} height={58} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
              <text x={SW_CX} y={SW_CY + SW_R + 90} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={700}>
                every chunk: sha256 vs manifest, whoever sent it
              </text>
              <text x={SW_CX} y={SW_CY + SW_R + 110} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                tailnet identity to join · hash mismatch → drop and re-request
              </text>
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={300} y={262} width={680} height={144} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={316} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              content-addressed · hash-verified · one manifest, two transports
            </text>
            <text x={640} y={360} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              1.5% boots you — your team makes it fast
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
