// Freeze the Machine, Restore It Anywhere
//
// Backing source: ~/Dev/wasm-vm — `crates/core/src/resume.rs` (E3-T12: the
// "WVMRESU1" TLV container, sections CPU/RAM/CLINT/PLIC/UART/VIRTIO_BLK/
// VIRTIO_NET/RTC/CLOCK, the RAM zero-elision codec, and the header's three
// coherence bindings core_hash / base_image_hash / overlay_generation with
// SnapshotHeader::validate_for), `crates/storage/src/snapmeta.rs` (E3-T12d:
// SNAPSHOT_CHUNK = 1 MiB streamed into IndexedDB, torn-chunk detection),
// `web/boot-path.js` (the three-way decision: user_snapshot /
// boot_snapshot_restore / cold_boot, and deriveBootSnapshotBaseId),
// `tools/build-boot-snapshot.sh` + `web/artifacts.json` (the shipped
// `busybox-ready.snap.gz`, 10,983,666 bytes), and `web/loader.js` / `web/main.js`
// — restore instead of executing the ~40 s Linux boot; the page reports
// "host ready in ~1s (restored, no Linux boot)".
//
// Centerpiece: a running machine collapsing into a ribbon of tagged sections,
// three locks that must all match before anyone may restore it, and the same
// blob waking up in a tab that never booted anything.
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
// The machine's sections — the real TLV tag list from resume.rs.
// ---------------------------------------------------------------------------

interface Section {
  tag: number;
  name: string;
  /** relative visual weight in the ribbon */
  w: number;
  color: string;
}
const SECTIONS: Section[] = [
  { tag: 1, name: 'CPU', w: 26, color: colors.ACCENT },
  { tag: 2, name: 'RAM', w: 430, color: colors.SECONDARY },
  { tag: 3, name: 'CLINT', w: 26, color: colors.POSITIVE },
  { tag: 4, name: 'PLIC', w: 26, color: colors.POSITIVE },
  { tag: 5, name: 'UART', w: 26, color: colors.WARM },
  { tag: 6, name: 'VIRTIO_BLK', w: 46, color: colors.WARM },
  { tag: 7, name: 'VIRTIO_NET', w: 46, color: colors.WARM },
  { tag: 8, name: 'RTC', w: 24, color: colors.MUTED },
  { tag: 9, name: 'CLOCK', w: 30, color: colors.MUTED },
];
const RIBBON_X = 190;
const RIBBON_Y = 300;
const RIBBON_H = 46;
const sectionX = (i: number): number =>
  RIBBON_X + SECTIONS.slice(0, i).reduce((s, x) => s + x.w + 4, 0);
const RIBBON_W = sectionX(SECTIONS.length) - RIBBON_X;

// RAM is mostly zeros — the codec collapses the runs. (Illustrative spans of a
// 128 MiB RAM: the non-zero islands are what actually get written out.)
const RAM_SPANS = [
  { a: 0.02, b: 0.09 },
  { a: 0.14, b: 0.19 },
  { a: 0.31, b: 0.36 },
  { a: 0.53, b: 0.57 },
  { a: 0.74, b: 0.82 },
  { a: 0.93, b: 0.97 },
];

// The three coherence bindings in the header.
const LOCKS = [
  { name: 'core_hash', what: 'the emulator build' },
  { name: 'base_image_hash', what: 'the kernel + initramfs' },
  { name: 'overlay_generation', what: 'the disk you wrote to' },
];

const SNAP_BYTES = 10_983_666;
const CHUNK_MIB = 1;

// The three-way boot decision from web/boot-path.js.
const DECISIONS = [
  { key: 'user_snapshot', label: 'your own snapshot', color: colors.POSITIVE },
  { key: 'boot_snapshot_restore', label: 'the shipped boot snapshot', color: colors.ACCENT },
  { key: 'cold_boot', label: 'boot Linux from scratch', color: colors.MUTED },
];

const BOOT_SECONDS = 40;
const RESTORE_SECONDS = 1;

const CAM_MACHINE: CameraState = { x: 600, y: 300, k: 1.06 };
const CAM_RAM: CameraState = { x: 470, y: 322, k: 1.6 };
const CAM_HEADER: CameraState = { x: 560, y: 210, k: 1.34 };
const CAM_STORE: CameraState = { x: 620, y: 430, k: 1.16 };
const CAM_RACE: CameraState = { x: 640, y: 400, k: 1.05 };
const CAM_WIDE: CameraState = { x: 620, y: 330, k: 0.92 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  machineU: ChannelRef<number>;
  collapseU: ChannelRef<number>;
  ramU: ChannelRef<number>;
  elideU: ChannelRef<number>;
  headerU: ChannelRef<number>;
  lockU: ChannelRef<number>;
  mismatchU: ChannelRef<number>;
  storeU: ChannelRef<number>;
  decideU: ChannelRef<number>;
  raceU: ChannelRef<number>;
  bootBar: ChannelRef<number>;
  restoreBar: ChannelRef<number>;
  liveU: ChannelRef<number>;
  portU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_MACHINE, cameraInterp);
  const machineU = tl.channel('machineU', 0);
  const collapseU = tl.channel('collapseU', 0);
  const ramU = tl.channel('ramU', 0);
  const elideU = tl.channel('elideU', 0);
  const headerU = tl.channel('headerU', 0);
  const lockU = tl.channel('lockU', 0);
  const mismatchU = tl.channel('mismatchU', 0);
  const storeU = tl.channel('storeU', 0);
  const decideU = tl.channel('decideU', 0);
  const raceU = tl.channel('raceU', 0);
  const bootBar = tl.channel('bootBar', 0);
  const restoreBar = tl.channel('restoreBar', 0);
  const liveU = tl.channel('liveU', 0);
  const portU = tl.channel('portU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · what a running machine is —
  tl.caption({
    at: 0.5,
    dur: 6.75,
    text: 'A running virtual machine is not mysterious. It is a program counter, thirty-two registers, some guest memory, and a handful of devices that each hold a little state.',
  });
  tl.tween(machineU, 1, { at: 0.7, dur: 1.8, ease: ease.enter });
  tl.hold(6.7, 0.6);

  // — Beat 2 · collapse it into a blob —
  tl.caption({
    at: 7.3,
    dur: 6.95,
    text: 'Which means you can write all of it down. Each component serializes into a tagged section — the processor, the memory, the interrupt controllers, the serial port, the virtual devices, the clocks — laid end to end in one container.',
  });
  tl.tween(collapseU, 1, { at: 7.8, dur: 2.2, ease: ease.move });
  tl.hold(13.7, 0.6);

  // — Beat 3 · the RAM problem —
  tl.caption({
    at: 14.3,
    dur: 6.95,
    text: 'Memory is the awkward one, because most of it is zero. Writing a hundred and twenty-eight megabytes of mostly nothing would make snapshots useless, so runs of zero are stored as a length instead of as bytes.',
  });
  tl.tween(cam, CAM_RAM, { at: 14.5, dur: 1.6, ease: ease.move });
  tl.tween(ramU, 1, { at: 15.2, dur: 1.2, ease: ease.enter });
  tl.tween(elideU, 1, { at: 17.0, dur: 2.0, ease: ease.move });
  tl.hold(20.7, 0.6);

  // — Beat 4 · the size —
  tl.caption({
    at: 21.3,
    dur: 6.35,
    text: 'The result for a booted machine is about eleven megabytes — smaller than most photo albums, and it contains an entire operating system in mid-thought.',
  });
  tl.hold(27.1, 0.6);

  // — Beat 5 · the three locks —
  tl.caption({
    at: 27.7,
    dur: 7.35,
    text: 'Restoring one is where it gets dangerous, so the header carries three bindings: which emulator build wrote it, which kernel and disk it belongs to, and which generation of your writes it saw.',
  });
  tl.tween(cam, CAM_HEADER, { at: 27.9, dur: 1.6, ease: ease.move });
  tl.tween(headerU, 1, { at: 28.6, dur: 1.2, ease: ease.enter });
  tl.tween(lockU, 1, { at: 30.0, dur: 2.0, ease: ease.pop });
  tl.hold(34.5, 0.6);

  // — Beat 6 · a mismatch is a cold boot —
  tl.caption({
    at: 35.1,
    dur: 7.15,
    text: 'If any one of them disagrees, the snapshot is refused and the machine boots normally instead. That is the whole safety argument: a stale snapshot restored over a different disk would corrupt the guest silently, and silent is the one thing it must never be.',
  });
  tl.tween(mismatchU, 1, { at: 35.6, dur: 1.4, ease: ease.pop });
  tl.hold(41.7, 0.6);

  // — Beat 7 · storing it —
  tl.caption({
    at: 42.3,
    dur: 6.95,
    text: 'Storing eleven megabytes in a browser has its own rule: never hold a second copy. The blob is streamed into the database a megabyte at a time, and a missing or short piece is detected on the way back out.',
  });
  tl.tween(cam, CAM_STORE, { at: 42.5, dur: 1.6, ease: ease.move });
  tl.tween(mismatchU, 0, { at: 42.5, dur: 0.6, ease: ease.move });
  tl.tween(storeU, 1, { at: 43.4, dur: 2.4, ease: ease.linear });
  tl.hold(48.7, 0.6);

  // — Beat 8 · the decision on load —
  tl.caption({
    at: 49.3,
    dur: 6.95,
    text: 'So every page load asks one question in order. Do you have your own snapshot? No — is the one shipped with this build still coherent? No — then boot Linux the slow way.',
  });
  tl.tween(decideU, 1, { at: 49.8, dur: 2.0, ease: ease.pop });
  tl.hold(55.7, 0.6);

  // — Beat 9 · the race —
  tl.caption({
    at: 56.3,
    dur: 7.15,
    text: 'And that is the number that changes what this feels like to use. Executing the boot is about forty seconds of a kernel doing real work. Restoring the same machine from its snapshot is about one.',
  });
  tl.tween(cam, CAM_RACE, { at: 56.5, dur: 1.6, ease: ease.move });
  tl.tween(raceU, 1, { at: 57.2, dur: 0.8, ease: ease.enter });
  tl.tween(bootBar, 1, { at: 58.0, dur: 4.0, ease: ease.linear });
  tl.tween(restoreBar, 1, { at: 58.0, dur: 0.1, ease: ease.linear });
  tl.hold(62.9, 0.6);

  // — Beat 10 · what does not get frozen —
  tl.caption({
    at: 63.5,
    dur: 6.95,
    text: 'Not everything is restored from the blob, and that is deliberate. Wall-clock time and randomness are read live from the browser, so a machine that wakes up an hour later knows what time it is instead of believing a frozen one.',
  });
  tl.tween(liveU, 1, { at: 64.0, dur: 1.6, ease: ease.pop });
  tl.hold(69.9, 0.6);

  // — Beat 11 · portability —
  tl.caption({
    at: 70.5,
    dur: 7.55,
    text: 'And because the blob is self-contained and identity-checked, where it lives is an implementation detail. Today it ships from the build and loads over the network — put the same bytes in object storage and any browser with the matching build wakes up at the exact instruction you froze.',
  });
  tl.tween(cam, CAM_WIDE, { at: 70.7, dur: 1.8, ease: ease.move });
  tl.tween(portU, 1, { at: 71.6, dur: 2.4, ease: ease.move });
  tl.hold(77.5, 0.6);

  // — Beat 12 · close —
  tl.caption({
    at: 78.1,
    dur: 6.0,
    text: 'A disk you barely download, a network that belongs to the tab, and a machine you can put in a bucket. That is Linux as a page load.',
  });
  tl.tween(dimAll, 0.12, { at: 78.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 79.6, dur: 0.9, ease: ease.enter });
  tl.hold(84.1, 1.6);

  return {
    tl, cam, machineU, collapseU, ramU, elideU, headerU, lockU, mismatchU, storeU, decideU,
    raceU, bootBar, restoreBar, liveU, portU, dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const machineU = s.get(scene.machineU);
  const collapseU = s.get(scene.collapseU);
  const ramU = s.get(scene.ramU);
  const elideU = s.get(scene.elideU);
  const headerU = s.get(scene.headerU);
  const lockU = s.get(scene.lockU);
  const mismatchU = s.get(scene.mismatchU);
  const storeU = s.get(scene.storeU);
  const decideU = s.get(scene.decideU);
  const raceU = s.get(scene.raceU);
  const bootBar = s.get(scene.bootBar);
  const restoreBar = s.get(scene.restoreBar);
  const liveU = s.get(scene.liveU);
  const portU = s.get(scene.portU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  // the components start scattered as a "running machine" and collapse into the ribbon
  const SCATTER = [
    { x: 250, y: 150 },
    { x: 470, y: 128 },
    { x: 760, y: 150 },
    { x: 880, y: 196 },
    { x: 250, y: 452 },
    { x: 430, y: 486 },
    { x: 640, y: 486 },
    { x: 840, y: 452 },
    { x: 950, y: 300 },
  ];

  const ramIdx = 1;
  const ramX = sectionX(ramIdx);
  const ramW = SECTIONS[ramIdx].w;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the container, once collapsed ---- */}
          {collapseU > 0.15 && (
            <g opacity={clamp01(collapseU * 2 - 0.3)}>
              <text x={RIBBON_X} y={RIBBON_Y - 58} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                WVMRESU1 · one tagged section per component
              </text>
            </g>
          )}

          {/* ---- the sections ---- */}
          {SECTIONS.map((sec, i) => {
            const u = clamp01(machineU * 2 - i * 0.08);
            if (u <= 0) return null;
            const sx = lerp(SCATTER[i].x, sectionX(i), collapseU);
            const sy = lerp(SCATTER[i].y, RIBBON_Y, collapseU);
            const w = lerp(96, sec.w, collapseU);
            const h = lerp(52, RIBBON_H, collapseU);
            const isRam = i === ramIdx;
            return (
              <g key={sec.name} opacity={u}>
                <rect x={sx} y={sy} width={w} height={h} rx={collapseU > 0.5 ? 3 : 8} fill={colors.PANEL} stroke={sec.color} strokeWidth={1.6} />
                {/* RAM's contents: mostly zero, with islands of real data */}
                {isRam && ramU > 0 && (
                  <g opacity={ramU}>
                    {RAM_SPANS.map((sp, k) => (
                      <rect
                        key={k}
                        x={sx + sp.a * w}
                        y={sy + 4}
                        width={(sp.b - sp.a) * w}
                        height={h - 8}
                        fill={sec.color}
                        opacity={0.85}
                      />
                    ))}
                  </g>
                )}
                {(() => {
                  // Narrow sections alternate above/below the ribbon so their
                  // labels never collide once everything is packed together.
                  const packed = collapseU > 0.55;
                  const below = packed && sec.w < 60 && i % 2 === 1;
                  return (
                    <text
                      x={sx + w / 2}
                      y={packed ? (below ? sy + h + 16 : sy - 8) : sy + h / 2 + 5}
                      textAnchor={packed ? 'start' : 'middle'}
                      transform={packed ? `rotate(-42, ${sx + w / 2}, ${below ? sy + h + 16 : sy - 8})` : undefined}
                      fill={sec.color}
                      fontSize={packed ? 11.5 : 14}
                      fontFamily="monospace"
                    >
                      {sec.name}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* zero-elision: the written form of RAM */}
          {elideU > 0 && (
            <g opacity={elideU}>
              <text x={ramX} y={RIBBON_Y + RIBBON_H + 30} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
                zero runs → [kind 0][len] — no payload
              </text>
              {(() => {
                // the elided form: only the non-zero spans, packed to the left
                let cursor = 0;
                return RAM_SPANS.map((sp, k) => {
                  const w = (sp.b - sp.a) * ramW;
                  const x = ramX + cursor;
                  cursor += w + 2;
                  return (
                    <rect key={k} x={lerp(ramX + sp.a * ramW, x, elideU)} y={RIBBON_Y + RIBBON_H + 44} width={w} height={20} fill={colors.SECONDARY} opacity={0.9} />
                  );
                });
              })()}
              <text x={ramX} y={RIBBON_Y + RIBBON_H + 84} fill={colors.POSITIVE} fontSize={15} fontWeight={700}>
                snapshot on disk ≈ {(SNAP_BYTES / 1_048_576).toFixed(1)} MB
              </text>
            </g>
          )}

          {/* ---- the header's three locks ---- */}
          {headerU > 0 && (
            <g opacity={headerU}>
              <rect x={RIBBON_X} y={RIBBON_Y - 176} width={RIBBON_W} height={100} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={RIBBON_X + 14} y={RIBBON_Y - 148} fill={colors.TEXT} fontSize={14} fontWeight={700}>
                header — the restore may only proceed if all three match
              </text>
              {LOCKS.map((l, i) => {
                const u = clamp01(lockU * 3 - i * 0.5);
                if (u <= 0) return null;
                const bad = mismatchU > 0.5 && i === 1;
                return (
                  <g key={l.name} opacity={u}>
                    <rect x={RIBBON_X + 14 + i * 230} y={RIBBON_Y - 132} width={214} height={44} rx={7} fill={colors.BG} stroke={bad ? colors.NEGATIVE : colors.POSITIVE} strokeWidth={1.6} />
                    <text x={RIBBON_X + 26 + i * 230} y={RIBBON_Y - 114} fill={bad ? colors.NEGATIVE : colors.POSITIVE} fontSize={12.5} fontFamily="monospace">
                      {l.name}
                    </text>
                    <text x={RIBBON_X + 26 + i * 230} y={RIBBON_Y - 96} fill={colors.MUTED} fontSize={12}>
                      {l.what}
                    </text>
                  </g>
                );
              })}
              {mismatchU > 0.5 && (
                <text x={RIBBON_X + RIBBON_W / 2} y={RIBBON_Y - 190} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={700}>
                  different kernel → refused → cold boot
                </text>
              )}
            </g>
          )}

          {/* ---- streaming into the browser store ---- */}
          {storeU > 0 && (
            <g opacity={storeU}>
              <text x={RIBBON_X} y={RIBBON_Y + 132} fill={colors.MUTED} fontSize={13}>
                streamed to IndexedDB in {CHUNK_MIB} MiB chunks — never a second whole copy
              </text>
              {Array.from({ length: 11 }, (_, k) => {
                const u = clamp01(storeU * 11 - k);
                if (u <= 0) return null;
                return (
                  <rect key={k} x={RIBBON_X + k * 54} y={RIBBON_Y + 146} width={46} height={30} rx={4} fill={colors.ACCENT} opacity={0.35 + 0.5 * u} />
                );
              })}
              <text x={RIBBON_X + 11 * 54 + 14} y={RIBBON_Y + 168} fill={colors.ACCENT} fontSize={14} fontWeight={700}>
                {Math.round(storeU * 11)} / 11 MB
              </text>
            </g>
          )}

          {/* ---- the three-way decision ---- */}
          {decideU > 0 && (
            <g opacity={decideU}>
              {DECISIONS.map((d, i) => {
                const u = clamp01(decideU * 3 - i * 0.6);
                if (u <= 0) return null;
                return (
                  <g key={d.key} opacity={u}>
                    <rect x={RIBBON_X + i * 250} y={RIBBON_Y + 208} width={232} height={46} rx={8} fill={colors.PANEL} stroke={d.color} strokeWidth={i === 1 ? 2.2 : 1.3} />
                    <text x={RIBBON_X + 16 + i * 250} y={RIBBON_Y + 230} fill={d.color} fontSize={13} fontFamily="monospace">
                      {d.key}
                    </text>
                    <text x={RIBBON_X + 16 + i * 250} y={RIBBON_Y + 247} fill={colors.MUTED} fontSize={12}>
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ---- the race: boot vs restore ---- */}
          {raceU > 0 && (
            <g opacity={raceU}>
              <rect x={250} y={150} width={780} height={44} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={252} y={152} width={776 * clamp01(bootBar)} height={40} rx={7} fill={colors.NEGATIVE} opacity={0.75} />
              <text x={266} y={178} fill={colors.TEXT} fontSize={15} fontWeight={700}>
                cold boot — {(BOOT_SECONDS * clamp01(bootBar)).toFixed(0)}s of kernel
              </text>

              <rect x={250} y={214} width={780} height={44} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={252} y={216} width={776 * (RESTORE_SECONDS / BOOT_SECONDS) * clamp01(restoreBar)} height={40} rx={7} fill={colors.POSITIVE} />
              <text x={266} y={242} fill={colors.TEXT} fontSize={15} fontWeight={700}>
                restore — {RESTORE_SECONDS}s, no Linux boot at all
              </text>
            </g>
          )}

          {/* ---- live sources ---- */}
          {liveU > 0 && (
            <g opacity={liveU}>
              {['wall clock', 'entropy', 'DHCP lease'].map((n, i) => {
                const u = clamp01(liveU * 3 - i * 0.5);
                if (u <= 0) return null;
                return (
                  <g key={n} opacity={u}>
                    <rect x={330 + i * 220} y={300} width={196} height={40} rx={8} fill={colors.BG} stroke={colors.WARM} />
                    <text x={428 + i * 220} y={325} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
                      {n} — read live
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ---- portability: one blob, many tabs ---- */}
          {portU > 0 && (
            <g opacity={portU}>
              <rect x={560} y={392} width={160} height={54} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
              <text x={640} y={424} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontWeight={700}>
                one snapshot blob
              </text>
              {[-1, 0, 1].map((k, i) => {
                const u = clamp01(portU * 3 - 0.8 - i * 0.4);
                if (u <= 0) return null;
                const x = 640 + k * 250 - 90;
                return (
                  <g key={i} opacity={u}>
                    <line x1={640} y1={446} x2={x + 90} y2={514} stroke={colors.ACCENT} strokeWidth={1.4} strokeDasharray="5 5" opacity={0.6} />
                    <rect x={x} y={514} width={180} height={54} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
                    <text x={x + 90} y={538} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>
                      another browser
                    </text>
                    <text x={x + 90} y={556} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                      same pc, same RAM
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={300} y={256} width={680} height={144} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              tagged sections · three locks · eleven megabytes
            </text>
            <text x={640} y={354} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              a machine you can put in a bucket
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
