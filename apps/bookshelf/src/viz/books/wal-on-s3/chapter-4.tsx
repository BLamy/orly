// WAL on S3, chapter 4 — "A Tree That Grows Backwards"
//
// Grounding: chroma-core/chroma rust/wal3/README.md sections "Manifest
// Compaction" (the manifest is a chain of writes whose bytes written are
// quadratic in the number of writes; the writer periodically writes a snapshot
// of an immutable prefix and adopts it in the next manifest; the result is a
// four-level tree of root, two interior levels, and leaves), "Snapshotting of
// the Log", and "Zero-Action Recovery" / "Faulty Writer";
// rust/wal3/src/manifest.rs struct Snapshot and struct SnapshotPointer
// { setsum, path_to_snapshot, depth, start, limit, num_bytes } plus
// unprefixed_snapshot_path -> snapshot/SNAPSHOT.<hexdigest>;
// rust/wal3/src/lib.rs SnapshotOptions { snapshot_rollover_threshold,
// fragment_rollover_threshold }.
//
// Centerpiece: one cost curve. Manifest bytes-per-write climb along a
// quadratic; when rollover fires, the flat pointer list visibly folds into a
// snapshot node and the SAME curve flattens into a sawtooth.
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

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ------------------------------------------------------ the cost curve (real)
// Each manifest write serializes every pointer it holds. Without rollover the
// pointer count grows by one per write, so bytes-per-write is linear in the
// write index and cumulative bytes are quadratic. With rollover, the pointer
// count resets whenever it crosses the threshold. Both curves are precomputed
// here at module scope from Fragment::JSON_SIZE_ESTIMATE = 256 bytes.
const WRITES = 96;
const BYTES_PER_POINTER = 256;
const ROLLOVER = 16; // the shape of the real fragment_rollover_threshold, scaled to fit the stage

const PLOT_X0 = 700;
const PLOT_X1 = 1196;
const PLOT_Y0 = 468;
const PLOT_Y1 = 196;

const naiveSeries: number[] = [];
const rolledSeries: number[] = [];
{
  let held = 0;
  for (let i = 0; i < WRITES; i++) {
    naiveSeries.push((i + 1) * BYTES_PER_POINTER);
    held += 1;
    if (held > ROLLOVER) held = 1; // prefix folded into one snapshot pointer
    rolledSeries.push(held * BYTES_PER_POINTER);
  }
}
const MAX_BYTES = naiveSeries[WRITES - 1];
const px = (i: number) => PLOT_X0 + (i / (WRITES - 1)) * (PLOT_X1 - PLOT_X0);
const py = (b: number) => PLOT_Y0 - (b / MAX_BYTES) * (PLOT_Y0 - PLOT_Y1);

/** Draw-on path for a series, revealed by `u` in 0..1. */
function seriesPath(series: number[], u: number): string {
  const n = Math.max(2, Math.round(clamp01(u) * series.length));
  let d = `M ${px(0)} ${py(series[0])}`;
  for (let i = 1; i < n; i++) d += ` L ${px(i)} ${py(series[i])}`;
  return d;
}
const NAIVE_FULL = seriesPath(naiveSeries, 1);

// ------------------------------------------------------------------ the tree
const LEAF_N = 12;
const LEAF_X0 = 96;
const LEAF_W = 40;
const LEAF_GAP = 6;
const leafX = (i: number) => LEAF_X0 + i * (LEAF_W + LEAF_GAP);
const FOLDED = 8; // the oldest 8 leaves fold under one snapshot

const CAM_LIST: CameraState = { x: 380, y: 380, k: 1.2 };
const CAM_PLOT: CameraState = { x: 940, y: 336, k: 1.22 };
const CAM_TREE: CameraState = { x: 420, y: 330, k: 1.14 };
const CAM_ORPHAN: CameraState = { x: 700, y: 430, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  listU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  naiveU: ChannelRef<number>;
  foldU: ChannelRef<number>;
  rolledU: ChannelRef<number>;
  depthU: ChannelRef<number>;
  setsumU: ChannelRef<number>;
  orphanU: ChannelRef<number>;
  recoverU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const listU = tl.channel('listU', 0);
  const plotU = tl.channel('plotU', 0);
  const naiveU = tl.channel('naiveU', 0);
  const foldU = tl.channel('foldU', 0);
  const rolledU = tl.channel('rolledU', 0);
  const depthU = tl.channel('depthU', 0);
  const setsumU = tl.channel('setsumU', 0);
  const orphanU = tl.channel('orphanU', 0);
  const recoverU = tl.channel('recoverU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // BEAT 1 — the manifest is a list, and lists get long.
  tl.caption({
    at: 0.4,
    dur: 6.3,
    text: 'The manifest holds one pointer per fragment, and every append rewrites the whole thing. That is fine for a hundred fragments and quietly disastrous for a hundred thousand.',
  });
  tl.tween(cam, CAM_LIST, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(listU, LEAF_N, { at: 0.9, dur: 3.4, ease: ease.linear });
  tl.hold(6.7, 0.7);

  // BEAT 2 — the cost curve.
  tl.caption({
    at: 7.4,
    dur: 6.4,
    text: 'Put the cost on a chart and the problem is obvious. Each write is a little more expensive than the one before it, so the bytes you spend on metadata grow with the square of the writes.',
  });
  tl.tween(cam, CAM_PLOT, { at: 7.6, dur: 1.4, ease: ease.move });
  tl.tween(plotU, 1, { at: 8.0, dur: 1.4, ease: ease.draw });
  tl.tween(naiveU, 1, { at: 8.8, dur: 3.4, ease: ease.linear });
  tl.hold(13.8, 0.6);

  // BEAT 3 — the immutable prefix.
  tl.caption({
    at: 14.4,
    dur: 6.6,
    text: 'The fix hides in something we already know. Old entries in the manifest never change again, and an immutable prefix can be lifted out into a file of its own.',
  });
  tl.tween(cam, CAM_TREE, { at: 14.6, dur: 1.4, ease: ease.move });
  tl.hold(21.0, 0.6);

  // BEAT 4 — the fold.
  tl.caption({
    at: 21.6,
    dur: 6.5,
    text: 'So the writer publishes a snapshot of that prefix, and the very next manifest replaces all of those pointers with a single pointer to the snapshot.',
  });
  tl.tween(foldU, 1, { at: 22.0, dur: 2.0, ease: ease.move });
  tl.hold(28.1, 0.6);

  // BEAT 5 — no extra round trip.
  tl.caption({
    at: 28.7,
    dur: 6.4,
    text: 'Notice the ordering. The snapshot is written first, off the hot path, and adopted later. The append that finally uses it pays no extra round trip at all.',
  });
  tl.tween(cam, CAM_PLOT, { at: 28.9, dur: 1.4, ease: ease.move });
  tl.tween(rolledU, 1, { at: 29.4, dur: 3.0, ease: ease.linear });
  tl.hold(35.1, 0.6);

  // BEAT 6 — the curve flattens.
  tl.caption({
    at: 35.7,
    dur: 6.5,
    text: 'And the cost curve stops climbing. Instead of one ever-growing list, the manifest sawtooths between a floor and a threshold, forever.',
  });
  tl.tween(rolledU, 1, { at: 36.0, dur: 0.6, ease: ease.linear });
  tl.hold(42.2, 0.6);

  // BEAT 7 — the tree.
  tl.caption({
    at: 42.8,
    dur: 6.6,
    text: 'Do that repeatedly and the log becomes a shallow tree. A root that is rewritten constantly, two levels of interior nodes that are written once, and the fragments themselves as leaves.',
  });
  tl.tween(cam, CAM_TREE, { at: 43.0, dur: 1.4, ease: ease.move });
  tl.tween(depthU, 1, { at: 43.4, dur: 1.8, ease: ease.draw });
  tl.hold(49.4, 0.6);

  // BEAT 8 — skew is the point.
  tl.caption({
    at: 50.0,
    dur: 6.5,
    text: 'The tree is deliberately lopsided. Readers chasing the tail of the log find it right there in the root, while readers doing a full scan happily walk the older branches.',
  });
  tl.tween(depthU, 1.4, { at: 50.4, dur: 1.6, ease: ease.move });
  tl.hold(56.5, 0.6);

  // BEAT 9 — the pointer carries the checksum.
  tl.caption({
    at: 57.1,
    dur: 6.5,
    text: 'Each pointer carries the checksum of what it points at, its depth, and the range of positions it covers. Folding a prefix away is therefore an accounting move you can check.',
  });
  tl.tween(setsumU, 1, { at: 57.6, dur: 1.2, ease: ease.enter });
  tl.hold(63.6, 0.6);

  // BEAT 10 — the crash.
  tl.caption({
    at: 64.2,
    dur: 6.6,
    text: 'Now kill the writer mid-flight, right after a fragment lands and before the manifest is updated. The fragment is real, it is durable, and absolutely nothing points at it.',
  });
  tl.tween(cam, CAM_ORPHAN, { at: 64.4, dur: 1.4, ease: ease.move });
  tl.tween(orphanU, 1, { at: 64.9, dur: 1.0, ease: ease.enter });
  tl.hold(70.8, 0.6);

  // BEAT 11 — zero-action recovery.
  tl.caption({
    at: 71.4,
    dur: 6.5,
    text: 'The next writer does not have to repair anything. The log was in a consistent state at every instant, and the orphan is simply extra work for the collector to notice later.',
  });
  tl.tween(recoverU, 1, { at: 71.9, dur: 1.2, ease: ease.pop });
  tl.hold(77.9, 0.6);

  // BEAT 12 — payoff.
  tl.caption({
    at: 78.5,
    dur: 6.9,
    text: 'That is what you buy by never overwriting data: recovery becomes something you skip rather than something you get right under pressure.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 78.7, dur: 1.4, ease: ease.move });
  tl.tween(endDim, 1, { at: 79.0, dur: 1.3, ease: ease.move });
  tl.tween(endU, 1, { at: 80.1, dur: 0.9, ease: ease.enter });
  tl.hold(85.5, 1.2);

  return {
    tl, cam, listU, plotU, naiveU, foldU, rolledU, depthU, setsumU, orphanU, recoverU, endDim, endU,
  };
}

const scene = buildScene();

// ------------------------------------------------------------------ render

function CostPlot({ plotU, naiveU, rolledU }: { plotU: number; naiveU: number; rolledU: number }) {
  if (plotU <= 0.02) return null;
  const axisU = clamp01(plotU);
  return (
    <g opacity={axisU}>
      <line x1={PLOT_X0} y1={PLOT_Y0} x2={lerp(PLOT_X0, PLOT_X1, axisU)} y2={PLOT_Y0} stroke={colors.GRID} strokeWidth={1.4} />
      <line x1={PLOT_X0} y1={PLOT_Y0} x2={PLOT_X0} y2={lerp(PLOT_Y0, PLOT_Y1, axisU)} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={PLOT_X0} y={PLOT_Y1 - 42} fill={colors.MUTED} fontSize={12} letterSpacing="0.11em">
        BYTES PER MANIFEST WRITE
      </text>
      <text x={PLOT_X1} y={PLOT_Y0 + 26} textAnchor="end" fill={colors.MUTED} fontSize={12}>
        manifest writes
      </text>
      {naiveU > 0.01 && (
        <>
          <path d={seriesPath(naiveSeries, naiveU)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.4} />
          <path d={NAIVE_FULL} fill="none" stroke={colors.NEGATIVE} strokeWidth={1} opacity={0.18} strokeDasharray="4 6" />
          <text x={PLOT_X1 - 6} y={PLOT_Y1 - 8} textAnchor="end" fill={colors.NEGATIVE} fontFamily={MONO} fontSize={13} opacity={clamp01(naiveU * 2)}>
            one flat list
          </text>
        </>
      )}
      {rolledU > 0.01 && (
        <>
          <path d={seriesPath(rolledSeries, rolledU)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} />
          <text x={PLOT_X0 + 12} y={py(ROLLOVER * BYTES_PER_POINTER) - 12} fill={colors.POSITIVE} fontFamily={MONO} fontSize={13} opacity={clamp01(rolledU * 2)}>
            with snapshot rollover
          </text>
        </>
      )}
    </g>
  );
}

function Tree({ listU, foldU, depthU, setsumU }: { listU: number; foldU: number; depthU: number; setsumU: number }) {
  const rootY = 236;
  const snapY = 330;
  const leafY = 430;
  return (
    <g>
      {/* root — always rewritten */}
      {listU > 0.05 && (
        <g opacity={clamp01(listU / 3)}>
          <rect x={LEAF_X0} y={rootY - 44} width={556} height={58} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.6} />
          <text x={LEAF_X0 + 16} y={rootY - 8} fill={colors.ACCENT} fontFamily={MONO} fontSize={15}>manifest/MANIFEST</text>
          <text x={LEAF_X0 + 540} y={rootY - 8} textAnchor="end" fill={colors.MUTED} fontSize={12}>rewritten every append</text>
        </g>
      )}

      {/* the folded snapshot */}
      {foldU > 0.02 && (
        <g opacity={clamp01(foldU)}>
          <rect
            x={leafX(0)}
            y={snapY}
            width={FOLDED * (LEAF_W + LEAF_GAP) - LEAF_GAP}
            height={54}
            rx={9}
            fill={colors.PANEL}
            stroke={colors.SECONDARY}
            strokeWidth={1.5}
          />
          <text x={leafX(0) + 14} y={snapY + 24} fill={colors.SECONDARY} fontFamily={MONO} fontSize={13}>SnapshotPointer</text>
          <text x={leafX(0) + 14} y={snapY + 44} fill={colors.MUTED} fontFamily={MONO} fontSize={11}>
            {setsumU > 0.05 ? 'setsum · depth · start · limit' : 'snapshot/SNAPSHOT.…'}
          </text>
        </g>
      )}

      {/* leaves */}
      {Array.from({ length: LEAF_N }, (_, i) => {
        const born = clamp01(listU - i);
        if (born <= 0) return null;
        const folded = i < FOLDED ? foldU : 0;
        const y = lerp(snapY, leafY + depthU * 26, folded);
        const w = LEAF_W;
        return (
          <g key={i} opacity={born * (1 - folded * 0.45)}>
            <rect x={leafX(i)} y={y} width={w} height={54} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={leafX(i) + w / 2} y={y + 33} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={12}>
              {String(i).padStart(2, '0')}
            </text>
          </g>
        );
      })}

      {/* edges from root/snapshot */}
      {depthU > 0.02 && (
        <g opacity={clamp01(depthU) * 0.55}>
          <line x1={leafX(0) + 90} y1={rootY + 14} x2={leafX(0) + 90} y2={snapY} stroke={colors.SECONDARY} strokeWidth={1.4} />
          {Array.from({ length: FOLDED }, (_, i) => (
            <line
              key={i}
              x1={leafX(0) + 90}
              y1={snapY + 54}
              x2={leafX(i) + LEAF_W / 2}
              y2={leafY + depthU * 26}
              stroke={colors.SECONDARY}
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: LEAF_N - FOLDED }, (_, k) => {
            const i = FOLDED + k;
            return (
              <line
                key={`t${i}`}
                x1={leafX(i) + LEAF_W / 2}
                y1={rootY + 14}
                x2={leafX(i) + LEAF_W / 2}
                y2={snapY}
                stroke={colors.ACCENT}
                strokeWidth={1}
              />
            );
          })}
        </g>
      )}
      {depthU > 1.05 && (
        <text x={LEAF_X0} y={leafY + 116} fill={colors.MUTED} fontSize={13} opacity={clamp01(depthU - 1.05)}>
          the tail lives in the root · the past lives one hop deeper
        </text>
      )}
    </g>
  );
}

function Orphan({ u, recover }: { u: number; recover: number }) {
  if (u <= 0.02) return null;
  return (
    <g opacity={clamp01(u)}>
      <rect x={620} y={492} width={352} height={104} rx={12} fill={colors.BG} stroke={recover > 0.4 ? colors.POSITIVE : colors.WARM} strokeWidth={1.5} />
      <text x={642} y={518} fill={colors.WARM} fontFamily={MONO} fontSize={13}>orphaned fragment</text>
      <text x={642} y={546} fill={colors.MUTED} fontSize={13}>durable, and referenced by nothing</text>
      <text x={642} y={578} fill={recover > 0.4 ? colors.POSITIVE : colors.MUTED} fontSize={13} opacity={0.3 + 0.7 * clamp01(recover)}>
        zero-action recovery
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const endDim = s.get(scene.endDim);
  const dim = 1 - endDim * 0.92;
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <Tree listU={s.get(scene.listU)} foldU={s.get(scene.foldU)} depthU={s.get(scene.depthU)} setsumU={s.get(scene.setsumU)} />
          <CostPlot plotU={s.get(scene.plotU)} naiveU={s.get(scene.naiveU)} rolledU={s.get(scene.rolledU)} />
          <Orphan u={s.get(scene.orphanU)} recover={s.get(scene.recoverU)} />
        </g>

        {endU > 0 && (
          <g opacity={endU}>
            <rect x={216} y={198} width={848} height={262} rx={24} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.8} />
            <text x={640} y={266} textAnchor="middle" fill={colors.ACCENT} fontSize={23} fontWeight={700}>
              THE PAST FOLDS, THE TAIL STAYS SHALLOW
            </text>
            <text x={640} y={318} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
              immutable prefixes become snapshots
            </text>
            <line x1={430} y1={350} x2={850} y2={350} stroke={colors.GRID} />
            <text x={640} y={390} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>
              every crash leaves a consistent log
            </text>
            <text x={640} y={430} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13}>
              snapshot/SNAPSHOT.&lt;setsum&gt;
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
