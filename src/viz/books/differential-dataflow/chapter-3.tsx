// The Arrangement
//
// Grounding: operators/arrange/mod.rs — "for each frontier advance, the
// operator creates a new batch, containing exactly those updates whose times
// are in advance of the previous frontier but not in advance of the new
// frontier … each batch is indexed by this key", and "the trace may merge
// batches so that the total number is kept small". arrangement.rs — Arranged
// shares one indexed trace so join/reduce/count spend the indexing resources
// "only once". writer.rs — TraceWriter::insert asserts upper == batch.lower()
// (bricks abut). agent.rs — TraceAgent shared read access + logical
// compaction. threshold.rs — distinct as another Arranged consumer.
//
// Centerpiece: the SPINE. Update chips rain into arrange and sort into keyed
// lanes; a frontier pulse SEALS them into a brick; bricks append edge-to-edge
// into the trace; two bricks zipper-merge into one; and three readers tap the
// same index. One persistent structure, built across every beat.
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
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The updates (module scope, deterministic): two waves of four, keyed a/b/c.
// Wave 1 has times 0..1 → sealed as batch [0, 2). Wave 2 times 2..3 → [2, 4).
// ---------------------------------------------------------------------------

type Key = 'a' | 'b' | 'c';
const KEY_COLOR: Record<Key, string> = { a: colors.ACCENT, b: colors.SECONDARY, c: colors.TEAL };

type Upd = { key: Key; time: number; diff: 1 | -1 };
const WAVE1: Upd[] = [
  { key: 'b', time: 0, diff: 1 },
  { key: 'a', time: 0, diff: 1 },
  { key: 'c', time: 1, diff: 1 },
  { key: 'a', time: 1, diff: -1 },
];
const WAVE2: Upd[] = [
  { key: 'c', time: 2, diff: 1 },
  { key: 'b', time: 2, diff: -1 },
  { key: 'a', time: 3, diff: 1 },
  { key: 'b', time: 3, diff: 1 },
];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const ARR = { x: 218, y: 296, w: 140, h: 60 };

// staging: keyed columns right of arrange
const LANE_X: Record<Key, number> = { a: 470, b: 610, c: 750 };
const LANE_TOP = 236;
const CHIP_H = 26;
const CHIP_W = 108;

// the trace shelf
const SHELF_Y = 500;
const BRICK_H = 68;
const B1 = { x: 400, w: 170 }; // batch [0,2)
const B2 = { x: 578, w: 170 }; // batch [2,4)  (x = left edges kiss: 400+170+8?)
const BM = { x: 489, w: 348 }; // merged [0,4)

// readers
const READERS = [
  { label: 'join', x: 1000, y: 170 },
  { label: 'count', x: 1140, y: 250 },
  { label: 'distinct', x: 1040, y: 330 },
];

const CAM_STAGE: CameraState = { x: 500, y: 300, k: 1.16 };
const CAM_BRICK: CameraState = { x: B1.x + B1.w / 2, y: SHELF_Y - 10, k: 1.85 };
const CAM_WIDE: CameraState = { x: 660, y: 360, k: 1.02 };

// rain start point
const RAIN_FROM = { x: 60, y: 120 };

// per-wave lane slot for each chip (stack order within its key lane)
function laneSlots(wave: Upd[], offset: Record<Key, number>): number[] {
  const fill: Record<Key, number> = { ...offset };
  return wave.map((u) => fill[u.key]++);
}
const SLOTS1 = laneSlots(WAVE1, { a: 0, b: 0, c: 0 });
const SLOTS2 = laneSlots(WAVE2, { a: 0, b: 0, c: 0 });

// ---------------------------------------------------------------------------
// Timeline (~86s, nine beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_STAGE, cameraInterp);

  const pastU = tl.channel('pastU', 0); // strawman: the long past stream
  const scanU = tl.channel('scanU', 0); // re-scan flash across it
  const pastDim = tl.channel('pastDim', 0);

  const arrU = tl.channel('arrU', 0); // arrange node + lane headers
  const rain1U = tl.channel('rain1U', 0); // wave 1 chips rain + sort
  const pulse1U = tl.channel('pulse1U', 0); // frontier pulse sweeps staging
  const seal1U = tl.channel('seal1U', 0); // chips → brick 1

  const rain2U = tl.channel('rain2U', 0);
  const pulse2U = tl.channel('pulse2U', 0);
  const seal2U = tl.channel('seal2U', 0);

  const shelfU = tl.channel('shelfU', 0); // trace shelf line + label
  const kissU = tl.channel('kissU', 0); // upper==lower annotation
  const mergeU = tl.channel('mergeU', 0); // bricks 1+2 → merged
  const readersU = tl.channel('readersU', 0); // taps into the trace
  const compactU = tl.channel('compactU', 0); // old times blur together

  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — beat 1 · the problem: history on demand —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'A join receives one fresh difference for key B — and must answer: what has this key matched before? It needs everything it has ever seen about B.',
  });
  tl.tween(pastU, 1, { at: 0.7, dur: 1.6, ease: ease.enter });
  tl.caption({
    at: 7.4,
    dur: 5.6,
    text: 'Re-reading the entire input stream for every arriving difference would put us right back in batch land.',
  });
  tl.tween(scanU, 1, { at: 7.8, dur: 3.4, ease: ease.linear });

  // — beat 2 · arrange: file by key —
  tl.caption({
    at: 13.8,
    dur: 6.2,
    text: 'So differential dataflow builds an index once, and keeps it. The arrange operator takes the update triples and files them by key as they arrive.',
  });
  tl.tween(pastDim, 1, { at: 14.0, dur: 0.9, ease: ease.move });
  tl.tween(arrU, 1, { at: 14.4, dur: 0.9, ease: ease.enter });
  tl.tween(rain1U, 1, { at: 15.4, dur: 3.4, ease: ease.linear });

  // — beat 3 · the frontier seals a batch —
  tl.caption({
    at: 20.8,
    dur: 6.8,
    text: 'When the input frontier advances, arrange seals a batch: exactly the updates between the old frontier and the new one. Sorted, immutable, done.',
  });
  tl.tween(shelfU, 1, { at: 21.0, dur: 0.9, ease: ease.draw });
  tl.tween(pulse1U, 1, { at: 22.2, dur: 1.6, ease: ease.linear });
  tl.tween(seal1U, 1, { at: 23.8, dur: 1.3, ease: ease.move });

  // — beat 4 · inside a batch: an index, not a log —
  tl.caption({
    at: 28.4,
    dur: 5.8,
    text: 'Look inside. A batch is not a log — it is an index. Every update for key A, then key B, then key C, in order.',
  });
  tl.tween(cam, CAM_BRICK, { at: 28.6, dur: 1.3, ease: ease.move });
  tl.hold(33.6, 0.6);

  // — beat 5 · the trace: batches, edge to edge —
  tl.caption({
    at: 34.8,
    dur: 6.6,
    text: 'More updates arrive, the frontier advances again, and a second batch seals — beginning exactly where the first one ended. The writer refuses anything else.',
  });
  tl.tween(cam, CAM_STAGE, { at: 35.0, dur: 1.2, ease: ease.move });
  tl.tween(rain2U, 1, { at: 35.6, dur: 2.6, ease: ease.linear });
  tl.tween(pulse2U, 1, { at: 38.4, dur: 1.4, ease: ease.linear });
  tl.tween(seal2U, 1, { at: 39.8, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 42.2,
    dur: 4.6,
    text: 'This growing sequence of batches is the trace: the full history of the collection, in committed order.',
  });
  tl.tween(kissU, 1, { at: 42.6, dur: 0.8, ease: ease.enter });

  // — beat 6 · merge —
  tl.caption({
    at: 47.6,
    dur: 6.6,
    text: 'Left alone, a thousand batches would mean a thousand places to look. So the trace merges neighbors — many small batches become a few large ones, geometrically.',
  });
  tl.tween(kissU, 0, { at: 48.4, dur: 0.5, ease: ease.enter });
  tl.tween(mergeU, 1, { at: 49.6, dur: 2.4, ease: ease.move });

  // — beat 7 · one trace, many readers —
  tl.caption({
    at: 55.0,
    dur: 7.0,
    text: 'And here is the payoff: the trace is shared. Join, count, distinct — each reads the same index through a trace agent. The communication, computation, and memory are spent only once.',
  });
  tl.tween(cam, CAM_WIDE, { at: 55.2, dur: 1.4, ease: ease.move });
  tl.tween(readersU, 1, { at: 56.2, dur: 2.2, ease: ease.enter });

  // — beat 8 · compaction —
  tl.caption({
    at: 63.0,
    dur: 6.8,
    text: 'One last trick: when every reader agrees it will never again distinguish two old times, the trace merges those times too. History compacts; the index stays small.',
  });
  tl.tween(compactU, 1, { at: 64.4, dur: 1.8, ease: ease.move });

  // — beat 9 · close —
  tl.caption({
    at: 70.6,
    dur: 6.6,
    text: 'That is an arrangement: the stream of differences, remembered as an index — so the next difference finds its entire past in one lookup instead of one replay.',
  });
  tl.tween(dimU, 1, { at: 70.8, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 71.6, dur: 0.8, ease: ease.enter });
  tl.hold(77.4, 1.0);

  return {
    tl,
    cam,
    pastU,
    scanU,
    pastDim,
    arrU,
    rain1U,
    pulse1U,
    seal1U,
    rain2U,
    pulse2U,
    seal2U,
    shelfU,
    kissU,
    mergeU,
    readersU,
    compactU,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** A sealed batch brick with keyed lanes inside. */
function Brick({
  x,
  w,
  label,
  op,
  laneCounts,
  timesLabel,
}: {
  x: number;
  w: number;
  label: string;
  op: number;
  laneCounts: [number, number, number];
  timesLabel?: string;
}) {
  if (op <= 0.01) return null;
  const keys: Key[] = ['a', 'b', 'c'];
  const total = laneCounts[0] + laneCounts[1] + laneCounts[2];
  let acc = 0;
  return (
    <g opacity={op}>
      <rect x={x} y={SHELF_Y - BRICK_H} width={w} height={BRICK_H} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {keys.map((k, i) => {
        const frac = laneCounts[i] / total;
        const lx = x + 8 + acc * (w - 16);
        const lw = frac * (w - 16) - 4;
        acc += frac;
        if (laneCounts[i] === 0) return null;
        return (
          <g key={k}>
            <rect x={lx} y={SHELF_Y - BRICK_H + 22} width={Math.max(2, lw)} height={BRICK_H - 34} rx={4} fill={KEY_COLOR[k]} opacity={0.42} />
            <text x={lx + Math.max(2, lw) / 2} y={SHELF_Y - 18} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
              {k}×{laneCounts[i]}
            </text>
          </g>
        );
      })}
      <text x={x + w / 2} y={SHELF_Y - BRICK_H + 15} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
        {label}
      </text>
      {timesLabel && (
        <text x={x + w / 2} y={SHELF_Y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
          {timesLabel}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pastU = s.get(scene.pastU);
  const scanU = s.get(scene.scanU);
  const pastDim = s.get(scene.pastDim);
  const arrU = s.get(scene.arrU);
  const rain1U = s.get(scene.rain1U);
  const pulse1U = s.get(scene.pulse1U);
  const seal1U = s.get(scene.seal1U);
  const rain2U = s.get(scene.rain2U);
  const pulse2U = s.get(scene.pulse2U);
  const seal2U = s.get(scene.seal2U);
  const shelfU = s.get(scene.shelfU);
  const kissU = s.get(scene.kissU);
  const mergeU = s.get(scene.mergeU);
  const readersU = s.get(scene.readersU);
  const compactU = s.get(scene.compactU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const stageOp = 1 - 0.85 * dimU;

  // brick positions under merge: b1 and b2 slide toward BM, merged fades in
  const b1x = lerp(B1.x, BM.x, mergeU);
  const b2x = lerp(B2.x, BM.x + BM.w - B2.w, mergeU);
  const smallOp = 1 - clamp01(mergeU * 1.6 - 0.5);
  const mergedOp = clamp01(mergeU * 1.8 - 0.8);

  const renderWave = (wave: Upd[], slots: number[], rainU: number, sealU: number, brickX: number, brickW: number) =>
    wave.map((u, i) => {
      const drop = win(rainU, wave.length, i, 2.2);
      if (drop <= 0.01) return null;
      const lane = { x: LANE_X[u.key], y: LANE_TOP + slots[i] * (CHIP_H + 8) };
      // rain: from source, through arrange, to the lane slot
      const mid = { x: ARR.x, y: ARR.y };
      const p =
        drop < 0.5
          ? { x: lerp(RAIN_FROM.x, mid.x, drop * 2), y: lerp(RAIN_FROM.y, mid.y, drop * 2) }
          : { x: lerp(mid.x, lane.x, drop * 2 - 1), y: lerp(mid.y, lane.y, drop * 2 - 1) };
      // seal: from lane slot into the brick
      const tx = brickX + brickW * (0.2 + 0.2 * ['a', 'b', 'c'].indexOf(u.key)) + slots[i] * 14;
      const q = { x: lerp(p.x, tx, sealU), y: lerp(p.y, SHELF_Y - BRICK_H / 2, sealU) };
      const op = drop * (1 - clamp01(sealU * 1.7 - 0.7));
      if (op <= 0.01) return null;
      return (
        <g key={`${u.key}${u.time}${i}`} opacity={op}>
          <rect x={q.x - CHIP_W / 2} y={q.y - CHIP_H / 2} width={CHIP_W} height={CHIP_H} rx={7} fill={colors.PANEL} stroke={KEY_COLOR[u.key]} strokeWidth={1.4} />
          <text x={q.x} y={q.y + 4} textAnchor="middle" fill={KEY_COLOR[u.key]} fontSize={11.5} fontFamily={MONO}>
            ({u.key}, t={u.time}, {u.diff > 0 ? '+1' : '−1'})
          </text>
        </g>
      );
    });

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageOp}>
          {/* ---------------- beat 1: the past stream strawman ---------------- */}
          {pastU > 0.01 && pastDim < 0.99 && (
            <g opacity={pastU * (1 - pastDim)}>
              <text x={640} y={96} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
                the entire input stream, so far
              </text>
              {Array.from({ length: 26 }, (_, i) => {
                const x = 130 + i * 40;
                const flash = scanU > 0 ? clamp01(1 - Math.abs(scanU * 27 - (i + 1)) / 1.4) : 0;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={120}
                    width={30}
                    height={18}
                    rx={4}
                    fill={flash > 0.25 ? colors.WARM : colors.PANEL}
                    stroke={colors.GRID}
                    opacity={0.5 + 0.5 * flash}
                  />
                );
              })}
              <text x={640} y={172} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontStyle="italic" opacity={clamp01(scanU * 2)}>
                re-read on every new difference?
              </text>
            </g>
          )}

          {/* ---------------- arrange + staging lanes ---------------- */}
          {arrU > 0.01 && (
            <g opacity={arrU}>
              <rect x={ARR.x - ARR.w / 2} y={ARR.y - ARR.h / 2} width={ARR.w} height={ARR.h} rx={11} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
              <text x={ARR.x} y={ARR.y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={600}>
                arrange
              </text>
              <text x={ARR.x} y={ARR.y + 17} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                partition by key
              </text>
              {(['a', 'b', 'c'] as Key[]).map((k) => (
                <g key={k}>
                  <text x={LANE_X[k]} y={LANE_TOP - 26} textAnchor="middle" fill={KEY_COLOR[k]} fontSize={14} fontFamily={MONO} fontWeight={700}>
                    key {k}
                  </text>
                  <line x1={LANE_X[k]} y1={LANE_TOP - 16} x2={LANE_X[k]} y2={LANE_TOP + 96} stroke={KEY_COLOR[k]} strokeWidth={1} strokeDasharray="2 6" opacity={0.5} />
                </g>
              ))}
            </g>
          )}

          {/* the two waves of chips */}
          {renderWave(WAVE1, SLOTS1, rain1U, seal1U, B1.x, B1.w)}
          {renderWave(WAVE2, SLOTS2, rain2U, seal2U, B2.x, B2.w)}

          {/* frontier pulses over the staging area */}
          {pulse1U > 0.01 && pulse1U < 1 && (
            <g>
              <line x1={380 + pulse1U * 460} y1={LANE_TOP - 40} x2={380 + pulse1U * 460} y2={LANE_TOP + 110} stroke={colors.WARM} strokeWidth={2.5} opacity={0.9} />
              <text x={380 + pulse1U * 460} y={LANE_TOP - 50} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                frontier → 2
              </text>
            </g>
          )}
          {pulse2U > 0.01 && pulse2U < 1 && (
            <g>
              <line x1={380 + pulse2U * 460} y1={LANE_TOP - 40} x2={380 + pulse2U * 460} y2={LANE_TOP + 110} stroke={colors.WARM} strokeWidth={2.5} opacity={0.9} />
              <text x={380 + pulse2U * 460} y={LANE_TOP - 50} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                frontier → 4
              </text>
            </g>
          )}

          {/* ---------------- the trace shelf ---------------- */}
          {shelfU > 0.01 && (
            <g opacity={shelfU}>
              <line x1={250} y1={SHELF_Y + 4} x2={1030} y2={SHELF_Y + 4} stroke={colors.GRID} strokeWidth={2} />
              <text x={252} y={SHELF_Y + 34} fill={colors.MUTED} fontSize={13} fontStyle="italic">
                the trace — a sequence of sealed batches
              </text>
            </g>
          )}
          <Brick
            x={b1x}
            w={B1.w}
            label={compactU > 0.5 ? 'batch [0, 4) · times joined' : 'batch [0, 2)'}
            op={seal1U * smallOp}
            laneCounts={[2, 1, 1]}
            timesLabel={compactU > 0.5 ? 't ≈ old' : 't = 0, 1'}
          />
          <Brick x={b2x} w={B2.w} label="batch [2, 4)" op={seal2U * smallOp} laneCounts={[1, 2, 1]} timesLabel="t = 2, 3" />
          <Brick
            x={BM.x}
            w={BM.w}
            label={compactU > 0.5 ? 'batch [0, 4) · old times merged' : 'batch [0, 4) — merged'}
            op={mergedOp}
            laneCounts={[3, 3, 2]}
            timesLabel={compactU > 0.5 ? 'compacted' : 't = 0 … 3'}
          />
          {/* upper == lower annotation at the kiss point */}
          {kissU > 0.01 && (
            <g opacity={kissU}>
              <line x1={B2.x} y1={SHELF_Y - BRICK_H - 12} x2={B2.x} y2={SHELF_Y + 8} stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="4 4" />
              <text x={B2.x} y={SHELF_Y - BRICK_H - 22} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                assert!(upper == batch.lower())
              </text>
            </g>
          )}

          {/* ---------------- readers tapping the trace ---------------- */}
          {readersU > 0.01 && (
            <g opacity={readersU}>
              {READERS.map((r, i) => {
                const u = win(readersU, READERS.length, i, 1.4);
                const tapX = BM.x + BM.w - 20 - i * 30;
                return (
                  <g key={r.label} opacity={u}>
                    <rect x={r.x - 62} y={r.y - 24} width={124} height={48} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
                    <text x={r.x} y={r.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={600}>
                      {r.label}
                    </text>
                    <path
                      d={`M${r.x - 62} ${r.y} C ${tapX + 60} ${r.y}, ${tapX} ${SHELF_Y - BRICK_H - 60}, ${tapX} ${SHELF_Y - BRICK_H - 2}`}
                      fill="none"
                      stroke={colors.SECONDARY}
                      strokeWidth={1.6}
                      strokeDasharray="5 5"
                      opacity={0.8}
                    />
                  </g>
                );
              })}
              <text x={1063} y={412} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                TraceAgent — shared read access
              </text>
            </g>
          )}
        </g>

        {/* ---------------- closing panel ---------------- */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={240} y={252} width={800} height={190} rx={16} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={318} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={650}>
              Memory instead of re-scanning.
            </text>
            <text x={640} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
              seal batches at the frontier · merge them · share one index
            </text>
            <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
              Arranged {'{'} stream, trace {'}'}
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
