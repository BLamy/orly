// WAL on S3, chapter 2 — "The Compare-and-Swap Heartbeat"
//
// Grounding: chroma-core/chroma rust/wal3/README.md ("Writer Arch Diagram":
// fragment batch manager with push_work / take_work / finish_write, manifest
// manager with assign_timestamp / apply_fragment); rust/wal3/src/writer.rs
// (OnceLogWriter, EpochWriter); rust/wal3/src/manifest.rs
// Manifest::apply_fragment (setsum += fragment.setsum; fragments.push);
// rust/wal3/src/interfaces/s3/manifest_manager.rs install() — PutMode::IfMatch
// (e_tag) when a manifest exists, PutMode::IfNotExist when creating it;
// rust/wal3/src/interfaces/batch_manager.rs (fragment upload IfNotExist);
// Error::LogContentionRetry / LogContentionFailure in rust/wal3/src/lib.rs.
//
// Centerpiece: a single conveyor. Appends stack into a batch, the batch
// solidifies into one fragment tile that slides into the bucket, and the
// manifest's version tag is the gate everything must pass. A second writer
// arrives holding a stale tag and is visibly rejected.
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
const APPEND_N = 12;
const QUEUE_X = 170;
const QUEUE_Y = 470;
const FRAG_X = 470;
const FRAG_Y = 424;
const GATE_X = 838;
const GATE_Y = 250;
const MANIFEST_X = 1010;

// Where each append sits while queued, and where it lands inside the fragment.
const QUEUE = Array.from({ length: APPEND_N }, (_, i) => ({
  x: QUEUE_X + (i % 4) * 34,
  y: QUEUE_Y + Math.floor(i / 4) * 26,
}));
const PACKED = Array.from({ length: APPEND_N }, (_, i) => ({
  x: FRAG_X + 26 + (i % 6) * 26,
  y: FRAG_Y + 46 + Math.floor(i / 6) * 24,
}));

const CAM_QUEUE: CameraState = { x: 400, y: 440, k: 1.24 };
const CAM_FRAG: CameraState = { x: 600, y: 430, k: 1.16 };
const CAM_GATE: CameraState = { x: 930, y: 268, k: 1.3 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 0.98 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  queueU: ChannelRef<number>;
  packU: ChannelRef<number>;
  uploadU: ChannelRef<number>;
  applyU: ChannelRef<number>;
  gateU: ChannelRef<number>;
  swapU: ChannelRef<number>;
  tagN: ChannelRef<number>;
  rivalU: ChannelRef<number>;
  bounceU: ChannelRef<number>;
  retryU: ChannelRef<number>;
  loopU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const queueU = tl.channel('queueU', 0);
  const packU = tl.channel('packU', 0);
  const uploadU = tl.channel('uploadU', 0);
  const applyU = tl.channel('applyU', 0);
  const gateU = tl.channel('gateU', 0);
  const swapU = tl.channel('swapU', 0);
  const tagN = tl.channel('tagN', 0);
  const rivalU = tl.channel('rivalU', 0);
  const bounceU = tl.channel('bounceU', 0);
  const retryU = tl.channel('retryU', 0);
  const loopU = tl.channel('loopU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // BEAT 1 — appends arrive.
  tl.caption({
    at: 0.4,
    dur: 6.3,
    text: 'Watch a single append make its way to durability. It starts as one message handed to the writer, and it is not durable yet, no matter what the caller hopes.',
  });
  tl.tween(cam, CAM_QUEUE, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(queueU, APPEND_N, { at: 0.9, dur: 3.6, ease: ease.linear });
  tl.hold(6.7, 0.7);

  // BEAT 2 — batching.
  tl.caption({
    at: 7.4,
    dur: 6.5,
    text: 'It waits in the batch manager with its neighbours. Writing one file per append would be ruinous, so the writer trades a little latency for a lot of throughput.',
  });
  tl.tween(gateU, 0.35, { at: 8.0, dur: 1.0, ease: ease.enter });
  tl.hold(13.9, 0.6);

  // BEAT 3 — the batch becomes a fragment.
  tl.caption({
    at: 14.5,
    dur: 6.4,
    text: 'When the batch is big enough, or has waited long enough, it hardens into one fragment and gets a range of log positions all to itself.',
  });
  tl.tween(cam, CAM_FRAG, { at: 14.7, dur: 1.4, ease: ease.move });
  tl.tween(packU, 1, { at: 15.1, dur: 1.8, ease: ease.move });
  tl.hold(20.9, 0.6);

  // BEAT 4 — upload, write-if-absent.
  tl.caption({
    at: 21.5,
    dur: 6.6,
    text: 'The fragment goes to storage with a write-if-absent condition. Its name is derived from its sequence number, so nobody can quietly overwrite somebody else’s work.',
  });
  tl.tween(uploadU, 1, { at: 21.9, dur: 1.6, ease: ease.move });
  tl.hold(28.1, 0.6);

  // BEAT 5 — still not durable.
  tl.caption({
    at: 28.7,
    dur: 6.4,
    text: 'And still nothing is durable. A fragment nobody points at is just an unloved file sitting in a bucket. Durability begins one step later.',
  });
  tl.tween(gateU, 1, { at: 29.2, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_GATE, { at: 29.4, dur: 1.5, ease: ease.move });
  tl.hold(35.1, 0.6);

  // BEAT 6 — apply_fragment.
  tl.caption({
    at: 35.7,
    // Keep the manifest-manager line visible until the next audio cue after
    // the recorded pause; the published player retimes captions to ElevenLabs.
    dur: 7.5,
    text: 'The manifest manager folds the fragment in: it appends the pointer and adds the fragment’s checksum into the running checksum for the whole log.',
  });
  tl.tween(applyU, 1, { at: 36.1, dur: 1.4, ease: ease.enter });
  tl.hold(42.2, 0.6);

  // BEAT 7 — the conditional install.
  tl.caption({
    at: 42.8,
    dur: 6.6,
    text: 'Then the new manifest is put back, but only on one condition: the version tag on the stored object must still be the tag the writer read. Match, and the append is durable.',
  });
  tl.tween(swapU, 1, { at: 43.4, dur: 1.6, ease: ease.move });
  tl.tween(tagN, 1, { at: 45.0, dur: 0.5, ease: ease.pop });
  tl.hold(49.6, 0.7);

  // BEAT 8 — the rival.
  tl.caption({
    at: 50.3,
    dur: 6.6,
    text: 'Now suppose a second writer believed it owned this log. It read the same manifest a moment ago and it is still holding that older tag.',
  });
  tl.tween(cam, CAM_WIDE, { at: 50.5, dur: 1.4, ease: ease.move });
  tl.tween(rivalU, 1, { at: 51.0, dur: 1.2, ease: ease.enter });
  tl.hold(56.9, 0.6);

  // BEAT 9 — the bounce.
  tl.caption({
    at: 57.5,
    dur: 6.5,
    text: 'Its write is rejected before it touches anything. The tag no longer matches, the bucket refuses it, and the writer gets a contention error instead of a silent overwrite.',
  });
  tl.tween(bounceU, 1, { at: 58.0, dur: 1.3, ease: ease.move });
  tl.tween(retryU, 1, { at: 59.4, dur: 0.8, ease: ease.pop });
  tl.hold(64.0, 0.6);

  // BEAT 10 — leader election can be sloppy.
  tl.caption({
    at: 64.6,
    dur: 6.7,
    text: 'That is why the leader election in front of this log only has to be good enough. If two writers ever overlap, at most one of them can win, and correctness never depended on the election.',
  });
  tl.tween(loopU, 1, { at: 65.2, dur: 2.2, ease: ease.move });
  tl.hold(71.3, 0.7);

  // BEAT 11 — payoff.
  tl.caption({
    at: 72.0,
    dur: 6.9,
    text: 'The entire concurrency story of this log fits in one request header. Everything else is just files that were only ever written once.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 72.2, dur: 1.4, ease: ease.move });
  tl.tween(endDim, 1, { at: 72.5, dur: 1.3, ease: ease.move });
  tl.tween(endU, 1, { at: 73.6, dur: 0.9, ease: ease.enter });
  tl.hold(78.9, 1.2);

  return {
    tl, cam, queueU, packU, uploadU, applyU, gateU, swapU, tagN, rivalU, bounceU, retryU, loopU, endDim, endU,
  };
}

const scene = buildScene();

// ------------------------------------------------------------------ render

function Appends({ queueU, packU, uploadU }: { queueU: number; packU: number; uploadU: number }) {
  // once packed, the records ride upward with the fragment tile as it uploads
  const drift = -uploadU * 8;
  return (
    <g>
      {QUEUE.map((q, i) => {
        const born = clamp01(queueU - i);
        if (born <= 0) return null;
        const p = PACKED[i];
        const x = lerp(q.x, p.x, packU);
        const y = lerp(q.y, p.y, packU) + drift * packU;
        return (
          <rect key={i} x={x - 6} y={y - 5} width={12} height={10} rx={2} fill={colors.ACCENT} opacity={born * (0.5 + 0.4 * packU)} />
        );
      })}
      <text x={QUEUE_X - 4} y={QUEUE_Y - 34} fill={colors.MUTED} fontSize={12} letterSpacing="0.12em" opacity={clamp01(queueU / 3)}>
        APPENDS · BatchManager
      </text>
    </g>
  );
}

function FragmentTile({ packU, uploadU }: { packU: number; uploadU: number }) {
  if (packU <= 0.02) return null;
  const y = FRAG_Y - uploadU * 8;
  return (
    <g opacity={clamp01(packU * 1.4)}>
      <rect
        x={FRAG_X}
        y={y}
        width={192}
        height={124}
        rx={10}
        fill={colors.PANEL}
        stroke={uploadU > 0.5 ? colors.POSITIVE : colors.GRID}
        strokeWidth={1.5}
      />
      <text x={FRAG_X + 16} y={y + 26} fill={colors.MUTED} fontFamily={MONO} fontSize={12}>Fragment</text>
      <text x={FRAG_X + 16} y={y + 112} fill={colors.MUTED} fontFamily={MONO} fontSize={11}>start · limit · setsum</text>
      {uploadU > 0.35 && (
        <text x={FRAG_X + 96} y={y - 14} textAnchor="middle" fill={colors.POSITIVE} fontFamily={MONO} fontSize={13} opacity={clamp01(uploadU * 1.6 - 0.5)}>
          PutMode::IfNotExist
        </text>
      )}
    </g>
  );
}

function Gate({ u, swapU, applyU, tagN }: { u: number; swapU: number; applyU: number; tagN: number }) {
  if (u <= 0.02) return null;
  const tag = tagN > 0.5 ? '"a91c"' : '"7f30"';
  return (
    <g opacity={clamp01(u)}>
      <rect x={GATE_X} y={GATE_Y - 62} width={330} height={198} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
      <text x={GATE_X + 22} y={GATE_Y - 34} fill={colors.MUTED} fontSize={11} letterSpacing="0.11em">MANIFEST MANAGER</text>
      <text x={GATE_X + 22} y={GATE_Y - 2} fill={colors.ACCENT} fontFamily={MONO} fontSize={16}>manifest/MANIFEST</text>
      <text x={GATE_X + 22} y={GATE_Y + 32} fill={applyU > 0.4 ? colors.POSITIVE : colors.MUTED} fontFamily={MONO} fontSize={14} opacity={0.2 + 0.8 * clamp01(applyU)}>
        apply_fragment
      </text>
      <text x={GATE_X + 22} y={GATE_Y + 62} fill={colors.MUTED} fontFamily={MONO} fontSize={13} opacity={0.2 + 0.8 * clamp01(applyU)}>
        setsum += fragment.setsum
      </text>
      <line x1={GATE_X + 22} y1={GATE_Y + 78} x2={GATE_X + 306} y2={GATE_Y + 78} stroke={colors.GRID} />
      <text x={GATE_X + 22} y={GATE_Y + 106} fill={swapU > 0.4 ? colors.POSITIVE : colors.MUTED} fontFamily={MONO} fontSize={14}>
        {`If-Match: ${tag}`}
      </text>
      {swapU > 0.55 && (
        <text x={GATE_X + 22} y={GATE_Y + 128} fill={colors.POSITIVE} fontSize={12} opacity={clamp01(swapU * 2 - 1.1)}>
          durable
        </text>
      )}
    </g>
  );
}

function Rival({ u, bounce, retry }: { u: number; bounce: number; retry: number }) {
  if (u <= 0.02) return null;
  // advances toward the gate, then is thrown back
  const travel = clamp01(u) * 0.55 - bounce * 0.42;
  const x = lerp(MANIFEST_X - 690, MANIFEST_X - 220, clamp01(travel * 1.9));
  return (
    <g opacity={clamp01(u)}>
      <rect x={x - 92} y={534} width={184} height={62} rx={12} fill={colors.PANEL} stroke={bounce > 0.4 ? colors.NEGATIVE : colors.SECONDARY} strokeWidth={1.5} />
      <text x={x} y={558} textAnchor="middle" fill={colors.SECONDARY} fontFamily={MONO} fontSize={13}>second writer</text>
      <text x={x} y={580} textAnchor="middle" fill={bounce > 0.4 ? colors.NEGATIVE : colors.MUTED} fontFamily={MONO} fontSize={12}>
        If-Match: &quot;7f30&quot;
      </text>
      {retry > 0.1 && (
        <g opacity={clamp01(retry)}>
          <rect x={x - 108} y={604} width={216} height={34} rx={17} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.2} />
          <text x={x} y={626} textAnchor="middle" fill={colors.NEGATIVE} fontFamily={MONO} fontSize={13}>LogContentionRetry</text>
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const endDim = s.get(scene.endDim);
  const dim = 1 - endDim * 0.92;
  const endU = s.get(scene.endU);
  const loopU = s.get(scene.loopU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <Appends queueU={s.get(scene.queueU)} packU={s.get(scene.packU)} uploadU={s.get(scene.uploadU)} />
          <FragmentTile packU={s.get(scene.packU)} uploadU={s.get(scene.uploadU)} />
          <Gate u={s.get(scene.gateU)} swapU={s.get(scene.swapU)} applyU={s.get(scene.applyU)} tagN={s.get(scene.tagN)} />
          <Rival u={s.get(scene.rivalU)} bounce={s.get(scene.bounceU)} retry={s.get(scene.retryU)} />

          {s.get(scene.uploadU) > 0.05 && (
            <line
              x1={FRAG_X + 192}
              y1={FRAG_Y + 40}
              x2={lerp(FRAG_X + 192, GATE_X, clamp01(s.get(scene.uploadU)))}
              y2={lerp(FRAG_Y + 40, GATE_Y + 30, clamp01(s.get(scene.uploadU)))}
              stroke={colors.POSITIVE}
              strokeWidth={1.6}
              opacity={0.7}
            />
          )}

          {loopU > 0.05 && (
            <text x={200} y={198} fill={colors.MUTED} fontSize={13} opacity={clamp01(loopU)}>
              best-effort leader election · at most one writer can win
            </text>
          )}
        </g>

        {endU > 0 && (
          <g opacity={endU}>
            <rect x={232} y={206} width={816} height={252} rx={24} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.8} />
            <text x={640} y={274} textAnchor="middle" fill={colors.ACCENT} fontSize={23} fontWeight={700}>
              ONE HEADER IS THE WHOLE PROTOCOL
            </text>
            <text x={640} y={326} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
              fragments written once, never rewritten
            </text>
            <line x1={430} y1={356} x2={850} y2={356} stroke={colors.GRID} />
            <text x={640} y={398} textAnchor="middle" fill={colors.POSITIVE} fontFamily={MONO} fontSize={18}>
              install(If-Match: ETag) → durable
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
