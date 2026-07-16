// Pipes and Plumbing
//
// Backing files: packages/effect/src/Pipeable.ts (the .pipe(...) interface and
// its doc example), packages/effect/src/Effect.ts — Effect.map (~2356) and
// Effect.flatMap (~1958) with the documented example: fetchTransactionAmount
// (resolves 100) piped through Effect.map((amount) => amount * 2) and
// Effect.flatMap((amount) => applyDiscount(amount, 5)) → 190, where
// applyDiscount fails with DiscountRateError when the rate is 0. And
// packages/effect/src/internal/effect.ts — flatMap allocates a primitive
// tagged op "OnSuccess" holding the previous effect and the function.
//
// Centerpiece: glass pipeline assembly. pipe straightens the nested-call
// tangle into a left-to-right line; map bolts on a lens, flatMap mounts a
// junction with two tracks. The assembled plumbing is INERT (it gets one big
// card border, op tag OnSuccess) — then one bead runs the happy path
// (100 → 200 → 190) and a second run with rate 0 exits the red track.
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
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Pipeline geometry — one horizontal axis, a lens, a junction, two exits.
// ---------------------------------------------------------------------------

const AXIS_Y = 352;
const SRC = { x: 96, y: AXIS_Y - 44, w: 216, h: 88 } as const;
const LENS = { cx: 480, cy: AXIS_Y, r: 54 } as const;
const JCT = { x: 660, y: AXIS_Y - 60, w: 230, h: 120 } as const;
const OUT_X = 1120;
const RED_Y = 520;

// bead path — piecewise linear along the pipeline; the sad run branches down
// at the junction. Pure function of (u, sad).
function beadPos(u: number, sad: boolean): { x: number; y: number } {
  if (u <= 0.22) return { x: lerp(SRC.x + SRC.w - 10, LENS.cx - LENS.r, u / 0.22), y: AXIS_Y };
  if (u <= 0.34) return { x: lerp(LENS.cx - LENS.r, LENS.cx + LENS.r, (u - 0.22) / 0.12), y: AXIS_Y };
  if (u <= 0.52) return { x: lerp(LENS.cx + LENS.r, JCT.x + 30, (u - 0.34) / 0.18), y: AXIS_Y };
  if (!sad) {
    if (u <= 0.72) return { x: lerp(JCT.x + 30, JCT.x + JCT.w - 20, (u - 0.52) / 0.2), y: AXIS_Y };
    return { x: lerp(JCT.x + JCT.w - 20, OUT_X, (u - 0.72) / 0.28), y: AXIS_Y };
  }
  // sad: route down the failure track inside the junction, then out
  if (u <= 0.68) return { x: lerp(JCT.x + 30, JCT.x + 115, (u - 0.52) / 0.16), y: AXIS_Y };
  if (u <= 0.84) return { x: JCT.x + 115, y: lerp(AXIS_Y, RED_Y, (u - 0.68) / 0.16) };
  return { x: lerp(JCT.x + 115, OUT_X - 100, (u - 0.84) / 0.16), y: RED_Y };
}

// the value the bead carries at each leg
function beadValue(u: number, sad: boolean): string {
  if (u <= 0.3) return '100';
  if (u <= 0.55) return '200';
  return sad ? 'DiscountRateError' : '190';
}

// camera marks
const CAM_TANGLE: CameraState = { x: 420, y: 190, k: 1.42 };
const CAM_PIPE: CameraState = { x: 620, y: 360, k: 1.16 };
const CAM_LENS: CameraState = { x: 490, y: 340, k: 1.5 };
const CAM_JCT: CameraState = { x: 780, y: 390, k: 1.42 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tangleU: ChannelRef<number>;
  tangleDim: ChannelRef<number>;
  pipeCodeU: ChannelRef<number>;
  srcU: ChannelRef<number>;
  mapU: ChannelRef<number>;
  stillU: ChannelRef<number>; // "still a description" flash after map
  flatU: ChannelRef<number>;
  opTagU: ChannelRef<number>; // OnSuccess internals
  wholeU: ChannelRef<number>; // the one-big-card border
  bead1: ChannelRef<number>;
  rate0U: ChannelRef<number>;
  bead2: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 640, y: 340, k: 1.06 }, cameraInterp);
  const tangleU = tl.channel('tangleU', 0);
  const tangleDim = tl.channel('tangleDim', 1);
  const pipeCodeU = tl.channel('pipeCodeU', 0);
  const srcU = tl.channel('srcU', 0);
  const mapU = tl.channel('mapU', 0);
  const stillU = tl.channel('stillU', 0);
  const flatU = tl.channel('flatU', 0);
  const opTagU = tl.channel('opTagU', 0);
  const wholeU = tl.channel('wholeU', 0);
  const bead1 = tl.channel('bead1', 0);
  const rate0U = tl.channel('rate0U', 0);
  const bead2 = tl.channel('bead2', 0);
  const dimU = tl.channel('dimU', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · hook —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'You now have descriptions. The next question is how to build big ones out of small ones, without running anything. Effect answers with a pipeline.',
  });
  tl.tween(srcU, 1, { at: 0.7, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_PIPE, { at: 0.9, dur: 2.2, ease: ease.move });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the tangle vs pipe —
  tl.caption({
    at: 7.2,
    dur: 7.2,
    text: 'Without help, composing means nesting calls inside out, reading from the innermost parentheses outward. Pipe straightens the nest: start with a value, read the steps left to right, like a story.',
  });
  tl.tween(tangleU, 1, { at: 7.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_TANGLE, { at: 7.6, dur: 1.4, ease: ease.move });
  tl.tween(pipeCodeU, 1, { at: 10.8, dur: 1.0, ease: ease.move });
  tl.tween(tangleDim, 0.15, { at: 10.8, dur: 1.0, ease: ease.move });
  tl.hold(14.4, 0.4);

  // — Beat 3 · map —
  tl.caption({
    at: 15.0,
    dur: 6.6,
    text: 'Map is the first verb. It bolts a pure transformation onto the pipe: whatever value flows out, apply this function to it. Fetch the amount, then double it.',
  });
  tl.tween(cam, CAM_LENS, { at: 15.2, dur: 1.4, ease: ease.move });
  tl.tween(mapU, 1, { at: 15.8, dur: 1.2, ease: ease.draw });
  tl.hold(21.2, 0.4);

  // — Beat 4 · still a description —
  tl.caption({
    at: 21.8,
    dur: 5.8,
    text: 'But notice what map returned: another description. Nothing has been fetched yet. We have described a fetch, followed by a doubling.',
  });
  tl.tween(stillU, 1, { at: 22.6, dur: 0.7, ease: ease.pop });
  tl.tween(stillU, 0, { at: 26.4, dur: 0.8, ease: ease.move });
  tl.hold(27.2, 0.4);

  // — Beat 5 · flatMap —
  tl.caption({
    at: 27.8,
    dur: 7.2,
    text: 'Flat map is the second verb. It chains a step that is itself an effect: take the amount, and run a whole new program chosen by that value. Here, apply a discount that might fail.',
  });
  tl.tween(cam, CAM_JCT, { at: 28.0, dur: 1.4, ease: ease.move });
  tl.tween(flatU, 1, { at: 28.6, dur: 1.2, ease: ease.draw });
  tl.hold(34.6, 0.4);

  // — Beat 6 · honest data: op "OnSuccess" —
  tl.caption({
    at: 35.2,
    dur: 7.0,
    text: 'Under the hood this is honest data. Flat map allocates a node tagged on success, holding the previous step and your function. The pipeline is a linked structure, not a running process.',
  });
  tl.tween(opTagU, 1, { at: 35.8, dur: 0.9, ease: ease.enter });
  tl.tween(wholeU, 1, { at: 38.6, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAM_PIPE, { at: 38.4, dur: 1.4, ease: ease.move });
  tl.hold(41.8, 0.4);

  // — Beat 7 · run: the happy path —
  tl.caption({
    at: 42.6,
    dur: 7.2,
    text: 'Now run it. One hundred flows in, the map doubles it to two hundred, the discount knocks off five percent, and one hundred ninety drops out the green chute.',
  });
  tl.tween(opTagU, 0, { at: 42.4, dur: 0.6, ease: ease.move });
  tl.tween(wholeU, 0, { at: 42.4, dur: 0.6, ease: ease.move });
  tl.tween(bead1, 1, { at: 43.4, dur: 5.4, ease: ease.linear });
  tl.hold(49.4, 0.4);

  // — Beat 8 · run: the sad path —
  tl.caption({
    at: 50.2,
    dur: 7.4,
    text: 'Run it again with a discount rate of zero, and the junction takes its other track: a typed discount rate error slides out the red chute. Same pipeline, both endings described up front.',
  });
  tl.tween(rate0U, 1, { at: 50.6, dur: 0.6, ease: ease.pop });
  tl.tween(bead2, 1, { at: 51.6, dur: 5.4, ease: ease.linear });
  tl.hold(57.8, 0.4);

  // — Beat 9 · close —
  tl.caption({
    at: 58.6,
    dur: 7.0,
    text: 'Two verbs cover most of the plumbing. Map transforms the value. Flat map chains another effect. And everything stays a description until you say run.',
  });
  tl.tween(cam, CAM_WIDE, { at: 58.8, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 59.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 60.6, dur: 0.9, ease: ease.enter });
  tl.hold(65.4, 1.4);

  return {
    tl,
    cam,
    tangleU,
    tangleDim,
    pipeCodeU,
    srcU,
    mapU,
    stillU,
    flatU,
    opTagU,
    wholeU,
    bead1,
    rate0U,
    bead2,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Bead({ u, sad, dim }: { u: number; sad: boolean; dim: number }) {
  if (u <= 0.005 || u >= 0.995) return null;
  const p = beadPos(u, sad);
  const label = beadValue(u, sad);
  const failing = sad && u > 0.55;
  return (
    <g opacity={dim}>
      <circle cx={p.x} cy={p.y} r={11} fill={failing ? colors.NEGATIVE : colors.WARM} />
      <text x={p.x} y={p.y - 18} textAnchor="middle" fill={failing ? colors.NEGATIVE : colors.WARM} fontSize={12.5} fontFamily="monospace" fontWeight={700}>
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tangleU = s.get(scene.tangleU);
  const tangleDim = s.get(scene.tangleDim);
  const pipeCodeU = s.get(scene.pipeCodeU);
  const srcU = s.get(scene.srcU);
  const mapU = s.get(scene.mapU);
  const stillU = s.get(scene.stillU);
  const flatU = s.get(scene.flatU);
  const opTagU = s.get(scene.opTagU);
  const wholeU = s.get(scene.wholeU);
  const bead1 = s.get(scene.bead1);
  const rate0U = s.get(scene.rate0U);
  const bead2 = s.get(scene.bead2);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const pipeAfterLens = clamp01(mapU * 1.2);
  const greenExit = clamp01(flatU * 1.2);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the tangle vs pipe (top strip) ---- */}
        {tangleU > 0.01 && (
          <g opacity={tangleU * dimU}>
            <g opacity={tangleDim}>
              <text x={110} y={120} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                Effect.flatMap(Effect.map(fetchTransactionAmount,
              </text>
              <text x={110} y={140} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                {'  (amount) => amount * 2), (amount) => applyDiscount(amount, 5))'}
              </text>
              <text x={110} y={98} fill={colors.NEGATIVE} fontSize={12.5} opacity={0.9}>
                nested — read inside out
              </text>
            </g>
            {pipeCodeU > 0.01 && (
              <g opacity={pipeCodeU}>
                <rect x={90} y={158} width={560} height={104} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={108} y={182} fill={colors.TEXT} fontSize={12} fontFamily="monospace">
                  const finalAmount = <tspan fill={colors.ACCENT}>pipe</tspan>(
                </text>
                <text x={126} y={202} fill={colors.TEXT} fontSize={12} fontFamily="monospace">
                  fetchTransactionAmount,
                </text>
                <text x={126} y={222} fill={colors.TEXT} fontSize={12} fontFamily="monospace">
                  <tspan fill={colors.ACCENT}>Effect.map</tspan>{'((amount) => amount * 2),'}
                </text>
                <text x={126} y={242} fill={colors.TEXT} fontSize={12} fontFamily="monospace">
                  <tspan fill={colors.ACCENT}>Effect.flatMap</tspan>{'((amount) => applyDiscount(amount, 5)))'}
                </text>
                <text x={664} y={182} fill={colors.POSITIVE} fontSize={12.5}>
                  ← left to right, like a story
                </text>
              </g>
            )}
          </g>
        )}

        {/* ---- one big card border: the whole pipeline is ONE description ---- */}
        {wholeU > 0.01 && (
          <g opacity={wholeU * dimU}>
            <rect x={70} y={270} width={1110} height={180} rx={18} fill="none" stroke={colors.ACCENT} strokeWidth={1.6} strokeDasharray="12 8" />
            <rect x={92} y={256} width={190} height={26} rx={13} fill={colors.BG} stroke={colors.GRID} />
            <text x={187} y={274} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
              still one description
            </text>
          </g>
        )}

        {/* ---- source: fetchTransactionAmount ---- */}
        <g opacity={srcU * dimU}>
          <rect x={SRC.x} y={SRC.y} width={SRC.w} height={SRC.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={SRC.x + SRC.w / 2} y={SRC.y + 34} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
            fetchTransactionAmount
          </text>
          <text x={SRC.x + SRC.w / 2} y={SRC.y + 58} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
            {'Effect<number>  · resolves 100'}
          </text>
          {/* pipe to the lens */}
          <line x1={SRC.x + SRC.w} y1={AXIS_Y} x2={LENS.cx - LENS.r} y2={AXIS_Y} stroke={colors.GRID} strokeWidth={10} strokeLinecap="round" opacity={0.7} />
        </g>

        {/* ---- map lens ---- */}
        {mapU > 0.01 && (
          <g opacity={mapU * dimU}>
            <circle cx={LENS.cx} cy={LENS.cy} r={LENS.r} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.8} />
            <circle cx={LENS.cx} cy={LENS.cy} r={LENS.r - 12} fill="none" stroke={colors.POSITIVE} strokeWidth={1} opacity={0.5} strokeDasharray="4 5" />
            <text x={LENS.cx} y={LENS.cy - 4} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
              map
            </text>
            <text x={LENS.cx} y={LENS.cy + 16} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily="monospace">
              {'(amount) => amount * 2'}
            </text>
            <text x={LENS.cx} y={LENS.cy - LENS.r - 14} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              a pure transform — value in, value out
            </text>
            <line x1={LENS.cx + LENS.r} y1={AXIS_Y} x2={JCT.x} y2={AXIS_Y} stroke={colors.GRID} strokeWidth={10} strokeLinecap="round" opacity={0.7 * pipeAfterLens} />
          </g>
        )}
        {stillU > 0.01 && (
          <g opacity={stillU * dimU}>
            <rect x={330} y={430} width={310} height={40} rx={10} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
            <text x={485} y={455} textAnchor="middle" fill={colors.WARM} fontSize={14}>
              still a description — nothing ran
            </text>
          </g>
        )}

        {/* ---- flatMap junction ---- */}
        {flatU > 0.01 && (
          <g opacity={flatU * dimU}>
            <rect x={JCT.x} y={JCT.y} width={JCT.w} height={JCT.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.8} />
            <text x={JCT.x + JCT.w / 2} y={JCT.y - 14} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
              flatMap
            </text>
            <text x={JCT.x + JCT.w / 2} y={JCT.y + 30} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily="monospace">
              {'(amount) =>'}
            </text>
            <text x={JCT.x + JCT.w / 2} y={JCT.y + 48} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily="monospace">
              applyDiscount(amount, 5)
            </text>
            <text x={JCT.x + JCT.w / 2} y={JCT.y + 74} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
              {'→ Effect<number, DiscountRateError>'}
            </text>
            {/* two tracks out */}
            <line x1={JCT.x + JCT.w} y1={AXIS_Y} x2={OUT_X} y2={AXIS_Y} stroke={colors.GRID} strokeWidth={10} strokeLinecap="round" opacity={0.7 * greenExit} />
            <path d={`M ${JCT.x + 115} ${JCT.y + JCT.h} L ${JCT.x + 115} ${RED_Y} L ${OUT_X - 100} ${RED_Y}`} fill="none" stroke={colors.GRID} strokeWidth={8} strokeLinecap="round" opacity={0.5 * greenExit} />
            {/* exit labels */}
            <g opacity={greenExit}>
              <circle cx={OUT_X + 18} cy={AXIS_Y} r={12} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={OUT_X + 40} y={AXIS_Y + 5} fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace">
                A
              </text>
              <circle cx={OUT_X - 76} cy={RED_Y} r={12} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={OUT_X - 54} y={RED_Y + 5} fill={colors.NEGATIVE} fontSize={12.5} fontFamily="monospace">
                E
              </text>
            </g>
          </g>
        )}

        {/* ---- op tag chips: the honest data ---- */}
        {opTagU > 0.01 && (
          <g opacity={opTagU * dimU}>
            {[{ x: 600, label: 'op: "OnSuccess"' }, { x: 920, label: 'op: "OnSuccess"' }].map((c, i) => (
              <g key={i}>
                <rect x={c.x - 74} y={AXIS_Y + 34} width={148} height={26} rx={13} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.2} />
                <text x={c.x} y={AXIS_Y + 51} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontFamily="monospace">
                  {c.label}
                </text>
              </g>
            ))}
            <text x={640} y={AXIS_Y + 92} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
              each joint is a real object holding the previous step and your function
            </text>
          </g>
        )}

        {/* ---- rate = 0 chip for the sad run ---- */}
        {rate0U > 0.01 && (
          <g opacity={rate0U * dimU}>
            <rect x={JCT.x + 20} y={JCT.y - 62} width={190} height={30} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.4} />
            <text x={JCT.x + 115} y={JCT.y - 42} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontFamily="monospace">
              discountRate = 0
            </text>
          </g>
        )}

        {/* ---- the running beads ---- */}
        <Bead u={bead1} sad={false} dim={dimU} />
        <Bead u={bead2} sad={true} dim={dimU} />
        {/* landed results */}
        {bead1 >= 0.995 && (
          <text x={OUT_X + 40} y={AXIS_Y - 24} fill={colors.POSITIVE} fontSize={15} fontFamily="monospace" fontWeight={700} opacity={dimU}>
            190
          </text>
        )}
        {bead2 >= 0.995 && (
          <text x={OUT_X - 76} y={RED_Y + 36} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontFamily="monospace" fontWeight={700} opacity={dimU}>
            DiscountRateError
          </text>
        )}

        {/* ---- closing panel ---- */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={320} y={240} width={640} height={170} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={300} textAnchor="middle" fill={colors.POSITIVE} fontSize={20} fontFamily="monospace">
              map — transform the value
            </text>
            <text x={640} y={338} textAnchor="middle" fill={colors.SECONDARY} fontSize={20} fontFamily="monospace">
              flatMap — chain another effect
            </text>
            <text x={640} y={380} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              everything stays a description until you say run
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
