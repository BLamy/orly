// The Shuffle Pays — dynamic expert update, and the reported numbers.
//
// Backed by: doc/en/kt-kernel/experts-sched-Tutorial.md ("Performance" table:
// Qwen3-Next-80B-A3B-Instruct-FP8, 4 x RTX 4090, Xeon Gold 6454S, ShareGPT —
// throughput in tokens/s at GPU expert ratios 0%..100% for random / uniform /
// front-loading / frequency / dynamic-expert-update; "Dynamic Expert Update
// Not Triggering" conditions) and kt-kernel/README.md
// ("--kt-enable-dynamic-expert-update: … During layerwise prefill, the system
// collects actual routing statistics and redistributes GPU experts
// accordingly", "Particularly effective at lower GPU expert ratios (10%-70%)").
//
// ONE machine: the benchmark plane — GPU expert ratio on x, tokens per second
// on y — with the project's own reported curves drawn on, then the dynamic
// mechanism playing out above it (statistics collected mid-prefill, seats
// reshuffled live). Real numbers, labeled reported.
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
// The REPORTED data (doc/en/kt-kernel/experts-sched-Tutorial.md, verbatim).
// ---------------------------------------------------------------------------

const RATIOS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const SERIES = [
  { key: 'random', vals: [53.01, 56.63, 58.75, 62.86, 66.81, 70.38, 71.33, 74.4, 79.71, 88.82, 112.61], color: colors.MUTED },
  { key: 'uniform', vals: [52.96, 56.57, 60.28, 62.08, 66.82, 65.25, 72.8, 76.17, 79.2, 81.06, 112.32], color: colors.ACCENT },
  { key: 'frequency', vals: [52.72, 58.6, 61.92, 66.5, 72.78, 76.19, 82.33, 89.37, 100.67, 107.15, 114.26], color: colors.WARM },
  { key: 'dynamic-expert-update', vals: [53.37, 70.22, 74.73, 75.55, 80.98, 81.17, 82.3, 88.7, 92.31, 95.04, 112.99], color: colors.POSITIVE },
] as const;

// plot geometry
const PLOT = { x: 170, y: 150, w: 700, h: 380 } as const;
const X = (r: number): number => PLOT.x + (r / 100) * PLOT.w;
const Y = (v: number): number => PLOT.y + PLOT.h - ((v - 40) / (120 - 40)) * PLOT.h;
const pathOf = (vals: readonly number[], reveal: number): string => {
  const n = Math.max(2, Math.ceil(reveal * vals.length));
  return vals
    .slice(0, n)
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${X(RATIOS[i])},${Y(v)}`)
    .join('');
};

// mini seat-strip for the mechanism inset: 12 seats, before/after shuffle
const SEATS = 12;
const BEFORE_HOT = [0, 3, 4, 8]; // seated experts before stats
const AFTER_HOT = [1, 2, 5, 8]; // reseated by observed routing

const CAM_PLOT: CameraState = { x: 560, y: 330, k: 1.2 };
const CAM_LOW: CameraState = { x: 360, y: 400, k: 1.55 };
const CAM_INSET: CameraState = { x: 1010, y: 260, k: 1.5 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axesU: ChannelRef<number>;
  line: ChannelRef<number>[];
  lowU: ChannelRef<number>; // low-ratio spotlight
  insetU: ChannelRef<number>; // mechanism inset
  statsU: ChannelRef<number>; // stats collect sweep
  shufU: ChannelRef<number>; // seat reshuffle
  condU: ChannelRef<number>; // trigger-conditions chip
  repU: ChannelRef<number>; // "reported" stamp
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axesU = tl.channel('axesU', 0);
  const line = SERIES.map((sr, i) => tl.channel(`line${i}`, 0));
  const lowU = tl.channel('lowU', 0);
  const insetU = tl.channel('insetU', 0);
  const statsU = tl.channel('statsU', 0);
  const shufU = tl.channel('shufU', 0);
  const condU = tl.channel('condU', 0);
  const repU = tl.channel('repU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the plane —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Time to make the strategies race. The project benchmarked them on a real rig — four consumer cards, one server processor, an eighty billion parameter Qwen — and published the table.',
  });
  tl.tween(axesU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(repU, 1, { at: 4.6, dur: 0.6, ease: ease.pop });
  tl.hold(7.0, 0.5);

  // — Beat 2 · baselines —
  tl.caption({
    at: 7.5,
    dur: 6.0,
    text: 'Across the bottom, the fraction of experts seated on the cards. Up the side, tokens per second. Random and uniform climb together — more seats, more speed, no surprises.',
  });
  tl.tween(line[0], 1, { at: 7.9, dur: 2.6, ease: ease.draw });
  tl.tween(line[1], 1, { at: 8.7, dur: 2.6, ease: ease.draw });
  tl.hold(13.5, 0.5);

  // — Beat 3 · frequency —
  tl.caption({
    at: 14.0,
    dur: 6.0,
    text: 'Frequency pulls away as the seats grow: at eighty percent it reports one hundred point six seven tokens per second, a twenty point lead over random.',
  });
  tl.tween(line[2], 1, { at: 14.4, dur: 2.8, ease: ease.draw });
  tl.hold(20.0, 0.5);

  // — Beat 4 · dynamic at low ratios —
  tl.caption({
    at: 20.5,
    dur: 7.0,
    text: 'But look at the interesting end — where seats are scarce. With just ten percent on the cards, dynamic update reports seventy tokens per second where every static strategy sits near fifty six.',
  });
  tl.tween(line[3], 1, { at: 20.9, dur: 2.8, ease: ease.draw });
  tl.tween(cam, CAM_LOW, { at: 23.0, dur: 1.5, ease: ease.move });
  tl.tween(lowU, 1, { at: 24.2, dur: 0.7, ease: ease.pop });
  tl.hold(27.0, 0.5);

  // — Beat 5 · how —
  tl.caption({
    at: 27.5,
    dur: 6.5,
    text: 'How does it cheat? It refuses to trust yesterday. During a long prefill, the server counts where the router actually sends this request’s tokens — live.',
  });
  tl.tween(cam, CAM_INSET, { at: 27.7, dur: 1.5, ease: ease.move });
  tl.tween(insetU, 1, { at: 28.6, dur: 1.0, ease: ease.enter });
  tl.tween(statsU, 1, { at: 29.8, dur: 2.4, ease: ease.linear });
  tl.hold(33.5, 0.5);

  // — Beat 6 · the reshuffle —
  tl.caption({
    at: 34.0,
    dur: 6.0,
    text: 'Then it redistributes the seats mid-flight: experts this prompt actually loves get pulled onto the cards, and the wallflowers get sent home.',
  });
  tl.tween(shufU, 1, { at: 34.5, dur: 2.2, ease: ease.move });
  tl.hold(40.0, 0.5);

  // — Beat 7 · the conditions —
  tl.caption({
    at: 40.5,
    dur: 6.5,
    text: 'It only triggers when three conditions line up: the update flag is on, a prefill threshold is set, and the prompt is long enough to cross it.',
  });
  tl.tween(condU, 1, { at: 41.2, dur: 0.9, ease: ease.enter });
  tl.hold(46.5, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 47.0,
    dur: 7.5,
    text: 'That is the expert shuffle: a budget, four ways to deal it, a deferral dial, and a live reshuffle. Next book we stop moving experts around and start shrinking them — precision is the lever.',
  });
  tl.tween(cam, CAM_WIDE, { at: 47.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.0, dur: 1.3, ease: ease.move });
  tl.hold(54.5, 1.4);

  return { tl, cam, axesU, line, lowU, insetU, statsU, shufU, condU, repU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axesU = s.get(scene.axesU);
  const line = scene.line.map((c) => s.get(c));
  const lowU = s.get(scene.lowU);
  const insetU = s.get(scene.insetU);
  const statsU = s.get(scene.statsU);
  const shufU = s.get(scene.shufU);
  const condU = s.get(scene.condU);
  const repU = s.get(scene.repU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* axes */}
          <g opacity={axesU}>
            <line x1={PLOT.x} y1={PLOT.y + PLOT.h} x2={PLOT.x + PLOT.w} y2={PLOT.y + PLOT.h} stroke={colors.GRID} strokeWidth={1.4} />
            <line x1={PLOT.x} y1={PLOT.y} x2={PLOT.x} y2={PLOT.y + PLOT.h} stroke={colors.GRID} strokeWidth={1.4} />
            {RATIOS.filter((r) => r % 20 === 0).map((r) => (
              <text key={r} x={X(r)} y={PLOT.y + PLOT.h + 20} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                {r}%
              </text>
            ))}
            {[60, 80, 100].map((v) => (
              <g key={v}>
                <line x1={PLOT.x} y1={Y(v)} x2={PLOT.x + PLOT.w} y2={Y(v)} stroke={colors.GRID} strokeWidth={0.6} opacity={0.5} />
                <text x={PLOT.x - 10} y={Y(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
                  {v}
                </text>
              </g>
            ))}
            <text x={X(50)} y={PLOT.y + PLOT.h + 42} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              GPU expert ratio
            </text>
            <text x={PLOT.x - 44} y={PLOT.y - 16} fill={colors.MUTED} fontSize={11.5}>
              tokens/s
            </text>
          </g>

          {/* reported stamp */}
          <g opacity={repU}>
            <rect x={PLOT.x + PLOT.w - 268} y={PLOT.y - 34} width={268} height={26} rx={7} fill={colors.BG} stroke={colors.GRID} strokeWidth={1} />
            <text x={PLOT.x + PLOT.w - 134} y={PLOT.y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
              reported · Qwen3-Next-80B-A3B-FP8 · 4× RTX 4090 · ShareGPT
            </text>
          </g>

          {/* curves */}
          {SERIES.map((sr, k) => (
            <g key={sr.key}>
              <path d={line[k] > 0.01 ? pathOf(sr.vals, line[k]) : ''} fill="none" stroke={sr.color} strokeWidth={k === 3 ? 3 : 2} opacity={k === 3 ? 1 : 0.8} />
              {line[k] >= 1 && (
                <text x={X(100) + 8} y={Y(sr.vals[10]) + (k === 0 ? 12 : k === 1 ? 24 : k === 2 ? -6 : 4)} fill={sr.color} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  {sr.key}
                </text>
              )}
            </g>
          ))}

          {/* low-ratio spotlight */}
          <g opacity={lowU}>
            <circle cx={X(10)} cy={Y(70.22)} r={10} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
            <text x={X(10) + 16} y={Y(70.22) - 10} fill={colors.POSITIVE} fontSize={11.5}>
              70.22 t/s at 10% · statics: ~56–58
            </text>
          </g>

          {/* mechanism inset */}
          <g opacity={insetU}>
            <rect x={900} y={140} width={286} height={250} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.3} />
            <text x={1043} y={166} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
              during layerwise prefill
            </text>
            {/* the routing counter sweep */}
            <rect x={922} y={182} width={242} height={16} rx={5} fill={colors.BG} stroke={colors.GRID} />
            <rect x={922} y={182} width={242 * statsU} height={16} rx={5} fill={colors.SECONDARY} opacity={0.8} />
            <text x={1043} y={216} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
              routing statistics collected live
            </text>
            {/* seat strip before/after */}
            {Array.from({ length: SEATS }, (_, j) => {
              const was = BEFORE_HOT.includes(j);
              const now = AFTER_HOT.includes(j);
              const on = was ? 1 - shufU * (now ? 0 : 1) : now ? shufU : 0;
              return (
                <rect
                  key={j}
                  x={922 + j * 20.5}
                  y={236}
                  width={16}
                  height={26}
                  rx={4}
                  fill={on > 0.5 ? colors.POSITIVE : colors.MUTED}
                  opacity={0.25 + 0.65 * on}
                />
              );
            })}
            <text x={1043} y={286} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
              GPU seats redistributed mid-flight
            </text>
            <g opacity={condU}>
              {['--kt-enable-dynamic-expert-update', '--kt-gpu-prefill-token-threshold 512', 'prefill length ≥ threshold'].map((t, i) => (
                <text key={t} x={922} y={314 + i * 20} fill={i === 2 ? colors.MUTED : colors.WARM} fontSize={9.5} fontFamily="ui-monospace, monospace">
                  ✓ {t}
                </text>
              ))}
            </g>
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={320} y={224} width={640} height={216} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            the expert shuffle, complete
          </text>
          <text x={640} y={310} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            a seat budget · four dealing strategies · a deferral dial
          </text>
          <text x={640} y={332} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            and a live reshuffle that beats them all when seats are scarce
          </text>
          <text x={640} y={370} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5}>
            10% of the seats, 62% of the max speed — reported
          </text>
          <text x={640} y={408} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            next: The AMX Path — precision as the lever
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
