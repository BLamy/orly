// The Precision Menu — what --kt-method actually chooses.
//
// Backed by: doc/en/kt-kernel/Native-Precision-Tutorial.md ("Supported
// Precision Formats" table: BF16 / FP8 / FP8_PERCHANNEL / RAWINT4 and the
// per-model support table), kt-kernel/README.md ("--kt-method: AMXINT4,
// AMXINT8, RAWINT4, FP8, FP8_PERCHANNEL, BF16 or LLAMAFILE", "AMXINT4: Best
// performance on AMX CPUs … May cause huge accuracy drop for some models",
// CPU requirements table: LLAMAFILE needs AVX2, RAWINT4 needs AVX512,
// AMXINT4/INT8 need AMX, FP8/BF16 need AVX512 BF16 extensions).
//
// ONE machine: a byte ruler. One expert weight rendered as a row of bytes
// that shrinks as the menu steps BF16 → FP8 → INT4, while a scale pan shows
// what each format asks of your processor. Same weight, four sizes.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The menu — real formats, real bit-widths, real CPU requirements.
// ---------------------------------------------------------------------------

const FORMATS = [
  { key: 'BF16', bits: 16, cpu: 'AVX512 + BF16 (AMX helps)', note: 'zero precision loss — the original weights', color: colors.ACCENT },
  { key: 'FP8', bits: 8, cpu: 'AVX512 + BF16 + VBMI', note: 'block-wise scales — Deepseek native format', color: colors.SECONDARY },
  { key: 'AMXINT8', bits: 8, cpu: 'AMX (Sapphire Rapids+)', note: 'converted CPU weights, higher accuracy', color: colors.POSITIVE },
  { key: 'AMXINT4 / RAWINT4', bits: 4, cpu: 'AMX / AVX512', note: 'smallest, fastest — accuracy can drop', color: colors.WARM },
  { key: 'LLAMAFILE', bits: 4.5, cpu: 'any AVX2 CPU (2013+)', note: 'GGUF weights, universal fallback', color: colors.MUTED },
] as const;

// 671B parameters at each width (GB) — simple real arithmetic.
const sizeGB = (bits: number): number => (671e9 * bits) / 8 / 1e9;

const RULER = { x: 200, y: 210, w: 760, h: 46 } as const;
const MENU = { x: 120, y: 330 } as const;

const CAM_RULER: CameraState = { x: 640, y: 250, k: 1.35 };
const CAM_MENU: CameraState = { x: 640, y: 420, k: 1.25 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rulerU: ChannelRef<number>;
  fmtK: ChannelRef<number>; // 0..4 which format the ruler shows (lerped)
  menuU: ChannelRef<number>;
  reqU: ChannelRef<number>; // CPU requirement column
  warnU: ChannelRef<number>; // the int4 accuracy warning
  fitU: ChannelRef<number>; // "fits in RAM" chip
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rulerU = tl.channel('rulerU', 0);
  const fmtK = tl.channel('fmtK', 0);
  const menuU = tl.channel('menuU', 0);
  const reqU = tl.channel('reqU', 0);
  const warnU = tl.channel('warnU', 0);
  const fitU = tl.channel('fitU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the ruler —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Every expert in the model is, in the end, a slab of numbers. Here is one weight as bytes on a ruler — sixteen bits each in the format the model was trained in.',
  });
  tl.tween(rulerU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_RULER, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(7.0, 0.5);

  // — Beat 2 · the arithmetic —
  tl.caption({
    at: 7.5,
    dur: 6.0,
    text: 'At that width, six hundred seventy one billion parameters cost over thirteen hundred gigabytes. Precision is not a detail; it is the biggest number on the invoice.',
  });
  tl.hold(13.5, 0.5);

  // — Beat 3 · fp8 —
  tl.caption({
    at: 14.0,
    dur: 6.0,
    text: 'Halve the bits to eight, with a shared scale per block of weights, and the same slab fits in half the space. That is the eight bit floating point family.',
  });
  tl.tween(fmtK, 1, { at: 14.4, dur: 1.4, ease: ease.move });
  tl.hold(20.0, 0.5);

  // — Beat 4 · int4 —
  tl.caption({
    at: 20.5,
    dur: 6.0,
    text: 'Halve them again to four bit integers and the ruler shrinks to a quarter. Four times the model in the same memory — or the same model at four times less cost.',
  });
  tl.tween(fmtK, 3, { at: 20.9, dur: 1.6, ease: ease.move });
  tl.tween(fitU, 1, { at: 23.0, dur: 0.6, ease: ease.pop });
  tl.hold(26.5, 0.5);

  // — Beat 5 · the menu —
  tl.caption({
    at: 27.0,
    dur: 6.5,
    text: 'The server exposes this as one flag with a menu: native sixteen bit, two eight bit variants, two four bit variants, and a universal fallback that reads community weights.',
  });
  tl.tween(cam, CAM_MENU, { at: 27.2, dur: 1.4, ease: ease.move });
  tl.tween(menuU, 1, { at: 28.0, dur: 2.2, ease: ease.enter });
  tl.hold(33.5, 0.5);

  // — Beat 6 · the hardware column —
  tl.caption({
    at: 34.0,
    dur: 7.0,
    text: 'Each row also names its hardware: the four bit and eight bit matrix formats want the matrix extensions on recent server chips, while the fallback runs on any processor from the past ten years.',
  });
  tl.tween(reqU, 1, { at: 34.6, dur: 1.4, ease: ease.enter });
  tl.hold(41.0, 0.5);

  // — Beat 7 · the fine print —
  tl.caption({
    at: 41.5,
    dur: 6.0,
    text: 'And the fine print is printed honestly: the documentation warns that four bit weights can cost real accuracy on some models. Cheaper bits are not free bits.',
  });
  tl.tween(warnU, 1, { at: 42.1, dur: 0.7, ease: ease.pop });
  tl.hold(47.5, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 48.0,
    dur: 6.5,
    text: 'So the menu trades bytes for fidelity. What makes the cheap formats fast — not just small — is a patch of silicon most people have never met. That is the next chapter.',
  });
  tl.tween(cam, CAM_WIDE, { at: 48.2, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.8, dur: 1.3, ease: ease.move });
  tl.hold(54.5, 1.4);

  return { tl, cam, rulerU, fmtK, menuU, reqU, warnU, fitU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const N_BYTES = 32; // byte cells drawn for the 16-bit slab

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rulerU = s.get(scene.rulerU);
  const fmtK = s.get(scene.fmtK);
  const menuU = s.get(scene.menuU);
  const reqU = s.get(scene.reqU);
  const warnU = s.get(scene.warnU);
  const fitU = s.get(scene.fitU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  const kLo = Math.min(4, Math.max(0, Math.floor(fmtK)));
  const kHi = Math.min(4, kLo + 1);
  const kFrac = clamp01(fmtK - kLo);
  const bits = FORMATS[kLo].bits * (1 - kFrac) + FORMATS[kHi].bits * kFrac;
  const frac = bits / 16; // ruler length fraction
  const liveK = kFrac < 0.5 ? kLo : kHi;
  const gb = sizeGB(bits);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the byte ruler ---- */}
          <g opacity={rulerU}>
            <text x={RULER.x} y={RULER.y - 40} fill={colors.TEXT} fontSize={14}>
              one expert weight tensor, as bytes
            </text>
            <text x={RULER.x} y={RULER.y - 18} fill={FORMATS[liveK].color} fontSize={12} fontFamily="ui-monospace, monospace">
              --kt-method {FORMATS[liveK].key} · {FORMATS[liveK].bits} bits / weight
            </text>
            {/* full-width ghost (the BF16 outline, always visible) */}
            <rect x={RULER.x} y={RULER.y} width={RULER.w} height={RULER.h} rx={8} fill="none" stroke={colors.GRID} strokeWidth={1} strokeDasharray="5 4" opacity={0.6} />
            {/* live bytes */}
            {Array.from({ length: N_BYTES }, (_, b) => {
              const cellW = RULER.w / N_BYTES;
              const on = b / N_BYTES < frac;
              const cellIn = clamp01(rulerU * N_BYTES * 1.2 - b);
              return (
                <rect
                  key={b}
                  x={RULER.x + b * cellW + 1.5}
                  y={RULER.y + 4}
                  width={cellW - 3}
                  height={RULER.h - 8}
                  rx={4}
                  fill={FORMATS[liveK].color}
                  opacity={cellIn * (on ? 0.85 : 0.06)}
                />
              );
            })}
            {/* size readout */}
            <text x={RULER.x + RULER.w} y={RULER.y + RULER.h + 26} textAnchor="end" fill={colors.TEXT} fontSize={13.5} fontFamily="ui-monospace, monospace">
              671B params × {bits.toFixed(0)} bit ≈ {gb.toFixed(0)} GB
            </text>
            <g opacity={fitU}>
              <text x={RULER.x} y={RULER.y + RULER.h + 26} fill={colors.POSITIVE} fontSize={12}>
                {gb < 512 ? '✓ fits a 512 GB workstation' : '✗ needs the terabyte class'}
              </text>
            </g>
          </g>

          {/* ---- the menu ---- */}
          <g opacity={menuU}>
            {FORMATS.map((f, i) => {
              const rowU = clamp01(menuU * FORMATS.length * 1.1 - i);
              const live = i === liveK ? 1 : 0;
              return (
                <g key={f.key} opacity={rowU}>
                  <rect x={MENU.x} y={MENU.y + i * 44} width={1040} height={38} rx={9} fill={live ? colors.PANEL : 'none'} stroke={live ? f.color : colors.GRID} strokeWidth={live ? 1.6 : 0.9} />
                  <text x={MENU.x + 16} y={MENU.y + 24 + i * 44} fill={f.color} fontSize={12.5} fontFamily="ui-monospace, monospace">
                    {f.key}
                  </text>
                  {/* bits bar */}
                  <rect x={MENU.x + 240} y={MENU.y + 10 + i * 44} width={(120 * f.bits) / 16} height={18} rx={5} fill={f.color} opacity={0.7} />
                  <text x={MENU.x + 372} y={MENU.y + 24 + i * 44} fill={colors.MUTED} fontSize={10.5}>
                    {f.bits === 4.5 ? '~4.5' : f.bits} bit
                  </text>
                  <g opacity={reqU}>
                    <text x={MENU.x + 448} y={MENU.y + 24 + i * 44} fill={colors.TEXT} fontSize={10.5}>
                      {f.cpu}
                    </text>
                  </g>
                  <text x={MENU.x + 700} y={MENU.y + 24 + i * 44} fill={i === 3 && warnU > 0.3 ? colors.NEGATIVE : colors.MUTED} fontSize={10.5}>
                    {f.note}
                  </text>
                </g>
              );
            })}
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={340} y={238} width={600} height={186} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            bytes for fidelity — a menu, not a dogma
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            sixteen → eight → four bits: 1342 → 671 → 336 gigabytes
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            what makes the cheap bits fast: the matrix tiles, next
          </text>
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            BF16 · FP8 · FP8_PERCHANNEL · AMXINT8 · AMXINT4 · RAWINT4 · LLAMAFILE
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
