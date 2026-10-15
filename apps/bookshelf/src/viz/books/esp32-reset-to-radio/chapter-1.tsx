// From Reset to Radio — chapter 1: The Boot Conveyor.
// Grounded in esp-idf 08e0d30a: components/bootloader/subproject/main/bootloader_start.c,
// components/esp_system/port/cpu_start.c, and components/esp_system/startup.c.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const PARTITIONS = [
  { label: 'nvs', w: 96, color: colors.MUTED },
  { label: 'otadata', w: 112, color: colors.WARM },
  { label: 'factory', w: 210, color: colors.ACCENT },
  { label: 'ota_0', w: 210, color: colors.SECONDARY },
  { label: 'ota_1', w: 210, color: colors.POSITIVE },
];
// Segments are copied out of ota_0 (absolute x ≈ 609 = 86 + its centre), then fan out into rows above the bar.
const SEGMENTS = [
  { label: '.text', from: 609, to: 700, y: 215, color: colors.ACCENT },
  { label: '.rodata', from: 609, to: 820, y: 290, color: colors.SECONDARY },
  { label: '.data', from: 609, to: 940, y: 365, color: colors.POSITIVE },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const romU = tl.channel('romU', 0);
  const bootU = tl.channel('bootU', 0);
  const flashU = tl.channel('flashU', 0);
  const scanU = tl.channel('scanU', 0);
  const selectX = tl.channel('selectX', 0);
  const segmentU = tl.channel('segmentU', 0);
  const cpuU = tl.channel('cpuU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.6, text: 'Reset does not begin in your program. It begins in tiny mask read-only memory code baked into the chip.' });
  tl.tween(romU, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 240, y: 300, k: 1.12 }, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.hold(6.0, 0.7);

  tl.caption({ at: 6.7, dur: 5.5, text: 'That read-only memory pulls a second-stage bootloader from external flash, while the application core and flash cache still wait.' });
  tl.tween(bootU, 1, { at: 7.1, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 8.0, dur: 1.3, ease: ease.move });
  tl.hold(12.2, 0.7);

  tl.caption({ at: 12.9, dur: 5.2, text: 'The bootloader initializes just enough hardware to read the flash safely and decide what can run.' });
  tl.tween(flashU, 1, { at: 13.3, dur: 1.5, ease: ease.draw });
  tl.hold(18.1, 0.7);

  tl.caption({ at: 18.8, dur: 5.8, text: 'It reads the partition table: storage, update metadata, a factory image, and over-the-air update slots.' });
  tl.tween(scanU, 1, { at: 19.2, dur: 4.0, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 400, k: 1.04 }, { at: 20.0, dur: 1.3, ease: ease.move });
  tl.hold(24.6, 0.7);

  tl.caption({ at: 25.3, dur: 5.2, text: 'Update metadata moves the selector to the chosen boot partition. Here, the first update slot wins.' });
  tl.tween(selectX, 1, { at: 25.8, dur: 1.4, ease: ease.move });
  tl.hold(30.5, 0.7);

  tl.caption({ at: 31.2, dur: 5.7, text: 'The loader validates that image, copies writable segments, and maps executable code through the memory management unit.' });
  tl.tween(segmentU, 1, { at: 31.7, dur: 3.5, ease: ease.draw });
  tl.tween(cam, { x: 650, y: 345, k: 1.02 }, { at: 32.4, dur: 1.3, ease: ease.move });
  tl.hold(36.9, 0.7);

  tl.caption({ at: 37.6, dur: 5.6, text: 'Application startup clears uninitialized memory, brings up caches and external memory, then releases the system initializer.' });
  tl.tween(cpuU, 1, { at: 38.1, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 39.0, dur: 1.3, ease: ease.move });
  tl.hold(43.2, 0.7);

  tl.caption({ at: 43.9, dur: 6.3, text: 'Only now is the selected image a running program. Reset has become a trustworthy stream of instructions.' });
  tl.tween(dimU, 1, { at: 44.5, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 45.2, dur: 0.7, ease: ease.enter });
  tl.hold(50.2, 1.0);
  return { tl, cam, romU, bootU, flashU, scanU, selectX, segmentU, cpuU, dimU, endU };
}

const scene = buildScene();

function Chip({ x, y, w, label, color, u }: { x: number; y: number; w: number; label: string; color: string; u: number }) {
  const p = clamp01(u);
  return <g opacity={p} transform={`translate(${x} ${y}) scale(${0.82 + 0.18 * p})`}>
    <rect x={-w / 2} y={-32} width={w} height={64} rx={13} fill={colors.PANEL} stroke={color} strokeWidth={2.5} />
    <text y={5} textAnchor="middle" fill={color} fontFamily={MONO} fontSize={14}>{label}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  // Old content fades fully out so the closing panel sits on clean background.
  const main = 1 - s.get(scene.dimU);
  const flashU = s.get(scene.flashU);
  const scan = s.get(scene.scanU);
  // The selector starts on otadata (update metadata) and slides to ota_0 (the first update slot).
  const selectedX = 152 + 371 * s.get(scene.selectX);
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={main}><text x={640} y={54} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={800}>The boot conveyor</text><text x={640} y={80} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={14}>ROM → second-stage bootloader → selected app image</text></g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={main}>
        <Chip x={150} y={225} w={170} label="mask ROM" color={colors.WARM} u={s.get(scene.romU)} />
        <text x={150} y={292} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13} opacity={s.get(scene.romU)}>read-only, baked into</text>
        <text x={150} y={310} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13} opacity={s.get(scene.romU)}>the silicon</text>
        <path d="M235 225 H350" stroke={colors.ACCENT} strokeWidth={4} opacity={s.get(scene.bootU)} />
        <circle cx={235 + 115 * clamp01(s.get(scene.bootU))} cy={225} r={9} fill={colors.ACCENT} opacity={s.get(scene.bootU)} />
        <Chip x={450} y={225} w={210} label="call_start_cpu0" color={colors.ACCENT} u={s.get(scene.bootU)} />
        <text x={450} y={284} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13} opacity={s.get(scene.bootU)}>flash cache: recently read flash, kept in fast RAM</text>
        <Chip x={1040} y={225} w={170} label="app CPU: waiting" color={colors.MUTED} u={s.get(scene.bootU) * (1 - s.get(scene.cpuU))} />

        <g opacity={flashU} transform="translate(86 440)">
          <text x={0} y={-12} fill={colors.MUTED} fontFamily={MONO} fontSize={13}>partition table in external flash</text>
          <rect x={0} y={0} width={838} height={82} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          {PARTITIONS.map((p, i) => { const x = PARTITIONS.slice(0, i).reduce((n, q) => n + q.w, 0); return <rect key={p.label} x={x} y={0} width={p.w} height={82} fill={p.color} opacity={0.16} stroke={p.color} />; })}
          {scan > 0 && scan < 1 && <line x1={838 * scan} x2={838 * scan} y1={-8} y2={90} stroke={colors.WARM} strokeWidth={5} />}
          {PARTITIONS.map((p, i) => { const x = PARTITIONS.slice(0, i).reduce((n, q) => n + q.w, 0); return <text key={p.label} x={x + p.w / 2} y={68} textAnchor="middle" fill={p.color} fontFamily={MONO} fontSize={14}>{p.label}</text>; })}
          {s.get(scene.selectX) > 0 && <g transform={`translate(${selectedX} -10)`}><path d="M0 0 l-12 -18 h24z" fill={colors.POSITIVE} /><text x={0} y={-28} textAnchor="middle" fill={colors.POSITIVE} fontFamily={MONO} fontSize={14}>selected</text></g>}
        </g>

        <g opacity={s.get(scene.segmentU)}>
          {SEGMENTS.map((seg, i) => { const u = clamp01(s.get(scene.segmentU) * 3 - i); const x = seg.from + (seg.to - seg.from) * u; return <g key={seg.label}><path d={`M${seg.from} 436 C${seg.from + 80} 436 ${x - 80} ${seg.y} ${x} ${seg.y}`} fill="none" stroke={seg.color} strokeWidth={3} strokeDasharray="8 6" /><rect x={x - 55} y={seg.y - 23} width={110} height={46} rx={10} fill={colors.PANEL} stroke={seg.color} /><text x={x} y={seg.y + 5} textAnchor="middle" fill={seg.color} fontFamily={MONO} fontSize={14}>{seg.label}</text></g>; })}
        </g>
        <Chip x={1120} y={335} w={190} label="call_start_cpu0" color={colors.POSITIVE} u={s.get(scene.cpuU)} />
        {s.get(scene.cpuU) > 0 && <text x={1120} y={390} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13} opacity={s.get(scene.cpuU)}>BSS · cache · MMU · init</text>}
      </g>
    </Camera>
    {s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}><rect x={190} y={235} width={900} height={200} rx={26} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={3} /><text x={640} y={305} textAnchor="middle" fill={colors.TEXT} fontSize={36} fontWeight={820}>Reset → selected instructions</text><text x={640} y={355} textAnchor="middle" fill={colors.POSITIVE} fontSize={21}>ROM verifies the path; flash supplies the program.</text><text x={640} y={395} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={14}>bootloader_utility_load_boot_image()</text></g>}
  </>;
}

export const vizScene = () => scene;
