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
// Centerpiece: the whole disk image as a 6,144-cell grid. It starts dark. The
// guest's reads light it up, one 128 KiB cell at a time, and the byte counter
// never gets anywhere near 768 MB.
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

const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };
const CAM_CELL: CameraState = { x: cellX(READ_CHUNK) + 40, y: cellY(READ_CHUNK) + 120, k: 1.75 };
const CAM_RUN: CameraState = { x: cellX(RUN[0]) + 40, y: cellY(RUN[0]) + 30, k: 2.2 };
const CAM_OVERLAY: CameraState = { x: 640, y: 400, k: 1.15 };

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
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

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

  // — Beat 11 · close —
  tl.caption({
    at: 71.1,
    dur: 6.0,
    text: 'A disk that is only ever partly present, addressed by content, verified on arrival, and never written to. Next: how that guest gets a network.',
  });
  tl.tween(dimAll, 0.12, { at: 71.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 72.6, dur: 0.9, ease: ease.enter });
  tl.hold(77.1, 1.6);

  return {
    tl, cam, imageU, monoU, splitU, hashU, dedupeU, readU, mathU, verifyU, bootU, raU, cowU,
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
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  const gridW = COLS * CELL;
  const gridH = ROWS * CELL;

  // how many boot-profile chunks are resident right now
  const bootN = Math.floor(bootU * BOOT_PROFILE.length);
  const resident = bootN + (verifyU > 0.5 ? 1 : 0);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the image as a field of chunks ---- */}
          <g opacity={imageU}>
            <rect x={GX} y={GY} width={gridW} height={gridH} fill="#16202e" stroke={colors.GRID} strokeWidth={1.4} />
            {/* the monolithic download crawling across it */}
            {monoU > 0 && (
              <>
                <rect x={GX} y={GY} width={gridW} height={gridH * monoU} fill={colors.NEGATIVE} opacity={0.28} />
                <text x={GX + gridW / 2} y={GY - 16} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16} fontWeight={700}>
                  downloading {MB(COUNT * monoU)} MB of {MB(COUNT)} MB
                </text>
              </>
            )}
            {/* chunk boundaries */}
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

          {/* labels around the field */}
          {imageU > 0.5 && monoU < 0.2 && (
            <g opacity={clamp01(imageU * 2 - 1) * (1 - clamp01(readU * 1.4))}>
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

          {/* ---- the one read ---- */}
          {readU > 0 && (
            <g opacity={readU}>
              <rect
                x={cellX(READ_CHUNK) - 2}
                y={cellY(READ_CHUNK) - 2}
                width={CELL + 3}
                height={CELL + 3}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={2}
              />
              <line
                x1={cellX(READ_CHUNK) + CELL / 2}
                y1={cellY(READ_CHUNK) - 44}
                x2={cellX(READ_CHUNK) + CELL / 2}
                y2={cellY(READ_CHUNK) - 6}
                stroke={colors.WARM}
                strokeWidth={2}
              />
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
          {verifyU > 0 && (
            <g opacity={verifyU}>
              <Cell i={READ_CHUNK} fill={colors.ACCENT} u={1} />
              <text x={cellX(READ_CHUNK) + 22} y={cellY(READ_CHUNK) + 6} fill={colors.POSITIVE} fontSize={13} fontWeight={700}>
                sha256 ✓ cached
              </text>
            </g>
          )}

          {/* ---- the boot profile lighting up ---- */}
          {bootU > 0 &&
            BOOT_PROFILE.slice(0, bootN).map((i, k) => (
              <Cell key={i} i={i} fill={colors.ACCENT} u={clamp01(0.55 + k / BOOT_PROFILE.length)} />
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

          {/* ---- the running byte counter ---- */}
          {(bootU > 0 || verifyU > 0) && (
            <g opacity={clamp01(Math.max(bootU * 4, verifyU))}>
              <text x={GX + gridW / 2} y={GY + gridH + 24} textAnchor="middle" fill={colors.ACCENT} fontSize={19} fontWeight={700} opacity={cowU > 0.3 ? 0.25 : 1}>
                {MB(resident)} MB fetched · {MB(COUNT)} MB image
              </text>
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={300} y={262} width={680} height={144} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={316} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              128 KiB chunks · content-addressed · hash-verified
            </text>
            <text x={640} y={360} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              1.5% of the disk gets you a login prompt
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
