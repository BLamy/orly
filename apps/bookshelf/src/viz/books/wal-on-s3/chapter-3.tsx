// WAL on S3, chapter 3 — "Pins and the Three-Phase Dance"
//
// Grounding: chroma-core/chroma rust/wal3/README.md sections "Cursoring",
// "Separate Files", "Garbage Collection Dance", and "Timing Assumptions";
// rust/wal3/src/cursors.rs (struct Cursor { position, epoch_us, writer },
// CursorStore save/init with PutMode::IfMatch(witness.e_tag) and IfNotExist,
// INTRINSIC_CURSOR whose path is cursor/compaction.json, CursorWitness);
// rust/wal3/src/gc.rs (GARBAGE_PATH = "gc/GARBAGE", struct Garbage with
// snapshots_to_drop, snapshots_to_make, fragments_to_drop_start /
// fragments_to_drop_limit, setsum_to_discard, first_to_keep);
// rust/wal3/src/writer.rs garbage_collect_phase1_compute_garbage /
// phase2_update_manifest / phase3_delete_garbage.
//
// Centerpiece: one rail of fragment tiles that stays on stage the whole
// chapter. Cursors drop onto it as pins, the leftmost pin becomes a cutoff
// line that sweeps in, and the three phases then play out on the same rail
// with a crash marker dropped into each to show what would be lost.
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

// ---------------------------------------------------------------- geometry
const RAIL_N = 16;
const RAIL_X0 = 96;
const RAIL_W = 64;
const RAIL_GAP = 8;
const RAIL_Y = 362;
const railX = (i: number) => RAIL_X0 + i * (RAIL_W + RAIL_GAP);

// Two cursors pin the log. compaction sits at fragment 5, a second, older
// "emergency" style pin sits at fragment 3 — the minimum wins.
const CURSOR_COMPACTION = 5;
const CURSOR_HELD = 3;
const CUTOFF_I = Math.min(CURSOR_COMPACTION, CURSOR_HELD);

const CAM_RAIL: CameraState = { x: 620, y: 380, k: 1.1 };
const CAM_PINS: CameraState = { x: 400, y: 356, k: 1.32 };
const CAM_GARBAGE: CameraState = { x: 640, y: 420, k: 1.06 };
const CAM_TAIL: CameraState = { x: 820, y: 380, k: 1.16 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  railU: ChannelRef<number>;
  growU: ChannelRef<number>;
  pinA: ChannelRef<number>;
  pinB: ChannelRef<number>;
  cutU: ChannelRef<number>;
  garbU: ChannelRef<number>;
  phase: ChannelRef<number>;
  manifestU: ChannelRef<number>;
  waitU: ChannelRef<number>;
  deleteU: ChannelRef<number>;
  crashU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const railU = tl.channel('railU', 0);
  const growU = tl.channel('growU', 0);
  const pinA = tl.channel('pinA', 0);
  const pinB = tl.channel('pinB', 0);
  const cutU = tl.channel('cutU', 0);
  const garbU = tl.channel('garbU', 0);
  const phase = tl.channel('phase', 0);
  const manifestU = tl.channel('manifestU', 0);
  const waitU = tl.channel('waitU', 0);
  const deleteU = tl.channel('deleteU', 0);
  const crashU = tl.channel('crashU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // BEAT 1 — the log grows forever.
  tl.caption({
    at: 0.4,
    dur: 6.3,
    text: 'A log that only ever appends has one obvious problem. Left alone it grows forever, and you are paying storage rent on every record you have already consumed.',
  });
  tl.tween(cam, CAM_RAIL, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(railU, RAIL_N, { at: 0.9, dur: 4.2, ease: ease.linear });
  tl.tween(growU, 1, { at: 3.4, dur: 2.2, ease: ease.move });
  tl.hold(6.7, 0.7);

  // BEAT 2 — who is allowed to say "done"?
  tl.caption({
    at: 7.4,
    dur: 6.4,
    text: 'So who gets to say a record is finished with? Not the writer, which has already moved on. It has to be the readers, and readers disagree.',
  });
  tl.tween(cam, CAM_PINS, { at: 7.6, dur: 1.4, ease: ease.move });
  tl.hold(13.8, 0.6);

  // BEAT 3 — cursors as pins.
  tl.caption({
    at: 14.4,
    dur: 6.6,
    text: 'Each reader keeps a cursor: a tiny file holding one position, a timestamp, and the name of whoever wrote it. A cursor pins that position and everything after it.',
  });
  tl.tween(pinA, 1, { at: 14.9, dur: 0.9, ease: ease.pop });
  tl.hold(21.0, 0.6);

  // BEAT 4 — separate files, cheap to write.
  tl.caption({
    at: 21.6,
    dur: 6.5,
    text: 'Cursors live in their own files, not inside the manifest. Pinning the log in a hurry should never mean fighting the writer for the one object it needs.',
  });
  tl.tween(pinB, 1, { at: 22.2, dur: 0.9, ease: ease.pop });
  tl.hold(28.1, 0.6);

  // BEAT 5 — the minimum wins.
  tl.caption({
    at: 28.7,
    dur: 6.4,
    text: 'Collection takes the earliest pin across every cursor and treats it as the cutoff. Anything strictly older than that is a candidate; anything newer is untouchable.',
  });
  tl.tween(cam, CAM_RAIL, { at: 28.9, dur: 1.3, ease: ease.move });
  tl.tween(cutU, 1, { at: 29.6, dur: 1.4, ease: ease.move });
  tl.hold(35.1, 0.6);

  // BEAT 6 — phase one: write the garbage file.
  tl.caption({
    at: 35.7,
    dur: 6.7,
    text: 'Phase one writes down its intentions and changes nothing else. A garbage file records which snapshots to drop, which fragments fall in the doomed range, and the checksum being discarded.',
  });
  tl.tween(cam, CAM_GARBAGE, { at: 35.9, dur: 1.4, ease: ease.move });
  tl.tween(phase, 1, { at: 36.2, dur: 0.4, ease: ease.enter });
  tl.tween(garbU, 1, { at: 36.4, dur: 1.4, ease: ease.enter });
  tl.hold(42.4, 0.6);

  // BEAT 7 — crash test one.
  tl.caption({
    at: 43.0,
    dur: 6.3,
    text: 'Crash here and the collector has taken no meaningful action at all. A file full of plans that nobody acted on is not a corruption; it is a note you can throw away.',
  });
  tl.tween(crashU, 1, { at: 43.6, dur: 0.7, ease: ease.pop });
  tl.tween(crashU, 0.2, { at: 47.4, dur: 1.0, ease: ease.move });
  tl.hold(49.3, 0.6);

  // BEAT 8 — phase two: the writer moves the manifest.
  tl.caption({
    at: 49.9,
    dur: 6.6,
    text: 'Phase two hands the work to the writer. Using the ordinary append protocol, the writer publishes a manifest that no longer references any of the doomed files.',
  });
  tl.tween(phase, 2, { at: 50.2, dur: 0.4, ease: ease.enter });
  tl.tween(manifestU, 1, { at: 50.6, dur: 1.6, ease: ease.move });
  tl.hold(56.5, 0.6);

  // BEAT 9 — the waiting.
  tl.caption({
    at: 57.1,
    dur: 6.5,
    text: 'Then phase three waits. Somewhere a reader is still holding a manifest it fetched a moment ago, and that reader must be allowed to finish before a single byte disappears.',
  });
  tl.tween(cam, CAM_TAIL, { at: 57.3, dur: 1.4, ease: ease.move });
  tl.tween(phase, 3, { at: 57.6, dur: 0.4, ease: ease.enter });
  tl.tween(waitU, 1, { at: 58.0, dur: 2.4, ease: ease.linear });
  tl.hold(63.6, 0.6);

  // BEAT 10 — the deletion.
  tl.caption({
    at: 64.2,
    dur: 6.4,
    text: 'Only then do the deletes go out, and only for files the collector affirmatively proved are unreferenced. Deleting is the last step and the least clever one.',
  });
  tl.tween(deleteU, 1, { at: 64.7, dur: 2.0, ease: ease.move });
  tl.hold(70.6, 0.6);

  // BEAT 11 — why three.
  tl.caption({
    at: 71.2,
    dur: 6.6,
    text: 'Three phases exist so that exactly one service is ever allowed to delete. Every other participant only ever adds files or advances a pointer.',
  });
  tl.tween(cam, CAM_RAIL, { at: 71.4, dur: 1.4, ease: ease.move });
  tl.hold(77.8, 0.6);

  // BEAT 12 — payoff.
  tl.caption({
    at: 78.4,
    dur: 6.9,
    text: 'Reclaiming space is where log designs usually go wrong, and the fix here is not cleverness. It is refusing to delete anything until somebody has positively proved it is unreachable.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 78.6, dur: 1.4, ease: ease.move });
  tl.tween(endDim, 1, { at: 78.9, dur: 1.3, ease: ease.move });
  tl.tween(endU, 1, { at: 80.0, dur: 0.9, ease: ease.enter });
  tl.hold(85.3, 1.2);

  return {
    tl, cam, railU, growU, pinA, pinB, cutU, garbU, phase, manifestU, waitU, deleteU, crashU, endDim, endU,
  };
}

const scene = buildScene();

// ------------------------------------------------------------------ render

function Pin({ x, u, label, sub, color }: { x: number; u: number; label: string; sub: string; color: string }) {
  if (u <= 0.02) return null;
  const drop = lerp(-26, 0, clamp01(u));
  return (
    <g opacity={clamp01(u)} transform={`translate(${x} ${drop})`}>
      <line x1={0} y1={252} x2={0} y2={RAIL_Y} stroke={color} strokeWidth={1.8} />
      <circle cx={0} cy={250} r={7} fill={color} />
      <rect x={-96} y={196} width={192} height={46} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.3} />
      <text x={0} y={216} textAnchor="middle" fill={color} fontFamily={MONO} fontSize={12}>{label}</text>
      <text x={0} y={234} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={11}>{sub}</text>
    </g>
  );
}

function Rail({
  railU, growU, cutU, deleteU, manifestU,
}: { railU: number; growU: number; cutU: number; deleteU: number; manifestU: number }) {
  return (
    <g>
      {Array.from({ length: RAIL_N }, (_, i) => {
        const born = clamp01(railU - i);
        if (born <= 0) return null;
        const doomed = i < CUTOFF_I;
        // doomed tiles first lose their manifest link, then vanish
        const unlinked = doomed ? manifestU : 0;
        const gone = doomed ? deleteU : 0;
        const h = 84 + growU * 10;
        return (
          <g key={i} opacity={born * (1 - gone * 0.92)}>
            <rect
              x={railX(i)}
              y={RAIL_Y}
              width={RAIL_W}
              height={h}
              rx={8}
              fill={colors.PANEL}
              stroke={doomed && cutU > 0.5 ? colors.NEGATIVE : colors.GRID}
              strokeWidth={1.3}
              opacity={1 - unlinked * 0.55}
            />
            <text x={railX(i) + RAIL_W / 2} y={RAIL_Y + h / 2 + 5} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={12}>
              {String(i).padStart(2, '0')}
            </text>
          </g>
        );
      })}
      <text x={RAIL_X0} y={RAIL_Y - 96} fill={colors.MUTED} fontSize={12} letterSpacing="0.12em" opacity={clamp01(railU / 4)}>
        FRAGMENTS · OLDEST AT LEFT
      </text>
    </g>
  );
}

function Cutoff({ u }: { u: number }) {
  if (u <= 0.02) return null;
  const x = railX(CUTOFF_I) - RAIL_GAP / 2;
  return (
    <g opacity={clamp01(u)}>
      <line x1={x} y1={288} x2={x} y2={498} stroke={colors.WARM} strokeWidth={2} strokeDasharray="7 6" />
      <text x={x - 10} y={520} textAnchor="end" fill={colors.WARM} fontFamily={MONO} fontSize={13}>
        first_to_keep
      </text>
      <text x={x - 10} y={540} textAnchor="end" fill={colors.MUTED} fontSize={12}>
        earliest pin wins
      </text>
    </g>
  );
}

function GarbageFile({ u, phase, manifestU, waitU, deleteU }: { u: number; phase: number; manifestU: number; waitU: number; deleteU: number }) {
  if (u <= 0.02) return null;
  const rows: Array<[string, string, number]> = [
    ['snapshots_to_drop', '1', 1],
    ['fragments_to_drop_start', '00', 1],
    ['fragments_to_drop_limit', '03', 1],
    ['setsum_to_discard', 'balanced', clamp01(manifestU)],
  ];
  return (
    <g opacity={clamp01(u)}>
      <rect x={772} y={488} width={410} height={132} rx={12} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
      <text x={794} y={512} fill={colors.WARM} fontFamily={MONO} fontSize={14}>gc/GARBAGE</text>
      {rows.map(([k, v, o], i) => (
        <g key={k} opacity={0.35 + 0.65 * o}>
          <text x={794} y={536 + i * 21} fill={colors.MUTED} fontFamily={MONO} fontSize={12}>{k}</text>
          <text x={1158} y={536 + i * 21} textAnchor="end" fill={colors.TEXT} fontFamily={MONO} fontSize={12}>{v}</text>
        </g>
      ))}
      <text x={772} y={472} fill={colors.MUTED} fontSize={12} letterSpacing="0.11em">
        {phase >= 2.5
          ? `PHASE THREE · DELETE${deleteU > 0.5 ? '' : waitU > 0.2 ? ' · WAITING OUT READERS' : ''}`
          : phase >= 1.5
            ? 'PHASE TWO · WRITER PUBLISHES A NEW MANIFEST'
            : 'PHASE ONE · COMPUTE GARBAGE'}
      </text>
    </g>
  );
}

function CrashMark({ u }: { u: number }) {
  if (u <= 0.03) return null;
  return (
    <g opacity={clamp01(u)}>
      <rect x={860} y={196} width={300} height={72} rx={12} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.5} />
      <text x={880} y={222} fill={colors.NEGATIVE} fontFamily={MONO} fontSize={14}>collector crashes</text>
      <text x={880} y={250} fill={colors.POSITIVE} fontSize={13}>no stateful action taken</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const endDim = s.get(scene.endDim);
  const dim = 1 - endDim * 0.92;
  const endU = s.get(scene.endU);
  const manifestU = s.get(scene.manifestU);
  const deleteU = s.get(scene.deleteU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <Rail
            railU={s.get(scene.railU)}
            growU={s.get(scene.growU)}
            cutU={s.get(scene.cutU)}
            deleteU={deleteU}
            manifestU={manifestU}
          />
          <Cutoff u={s.get(scene.cutU)} />
          <Pin
            x={railX(CURSOR_COMPACTION) + RAIL_W / 2}
            u={s.get(scene.pinA)}
            label="cursor/compaction.json"
            sub="position · epoch_us · writer"
            color={colors.ACCENT}
          />
          <Pin
            x={railX(CURSOR_HELD) + RAIL_W / 2}
            u={s.get(scene.pinB)}
            label="cursor/emergency.json"
            sub="held by a long read"
            color={colors.SECONDARY}
          />
          <GarbageFile
            u={s.get(scene.garbU)}
            phase={s.get(scene.phase)}
            manifestU={manifestU}
            waitU={s.get(scene.waitU)}
            deleteU={deleteU}
          />
          <CrashMark u={s.get(scene.crashU)} />

          {manifestU > 0.05 && (
            <text x={RAIL_X0} y={288} fill={colors.POSITIVE} fontFamily={MONO} fontSize={13} opacity={clamp01(manifestU)}>
              manifest/MANIFEST no longer references the doomed range
            </text>
          )}
        </g>

        {endU > 0 && (
          <g opacity={endU}>
            <rect x={216} y={198} width={848} height={264} rx={24} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.8} />
            <text x={640} y={266} textAnchor="middle" fill={colors.ACCENT} fontSize={23} fontWeight={700}>
              NOTHING IS DELETED ON A HUNCH
            </text>
            <text x={640} y={318} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
              cursors pin · the earliest pin is the cutoff
            </text>
            <line x1={430} y1={350} x2={850} y2={350} stroke={colors.GRID} />
            <text x={640} y={390} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>
              compute · unlink · then, much later, delete
            </text>
            <text x={640} y={430} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13}>
              gc/GARBAGE
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
