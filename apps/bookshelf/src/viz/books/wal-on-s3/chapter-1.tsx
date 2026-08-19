// WAL on S3, chapter 1 — "A Bucket That Cannot Lock"
//
// Grounding: chroma-core/chroma rust/wal3/README.md ("It implements a
// linearizable log that is built entirely on top of object storage. It relies
// upon the atomicity of object storage to provide the If-Match header");
// rust/wal3/src/lib.rs unprefixed_fragment_path (log/Bucket=…/FragmentSeqNo=
// ….parquet) and struct Fragment; rust/wal3/src/manifest.rs manifest_path
// (manifest/MANIFEST) and struct Manifest.
//
// Centerpiece: one field of record dots. It first pours into a single mutable
// object and gets clobbered; the SAME dots then re-form into immutable
// fragment tiles beneath one small authority tile.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------- geometry
// 84 records. Three formations, all precomputed at module scope so every
// frame is a pure lerp between fixed positions.
const N = 84;
const rand = mulberry32(0x3a17);
const RAIN = Array.from({ length: N }, (_, i) => ({
  x: 150 + (i % 14) * 62 + rand() * 14,
  y: 96 + Math.floor(i / 14) * 22 + rand() * 8,
}));

// Formation B — everything crammed into one mutable object.
const BLOB = Array.from({ length: N }, (_, i) => ({
  x: 560 + (i % 12) * 13,
  y: 300 + Math.floor(i / 12) * 13,
}));

// Formation C — six immutable fragments, 14 records each.
const FRAG_COUNT = 6;
const FRAG_W = 168;
const FRAG_X = Array.from({ length: FRAG_COUNT }, (_, f) => 116 + f * (FRAG_W + 16));
const FRAG_Y = 396;
const TILES = Array.from({ length: N }, (_, i) => {
  const f = Math.floor(i / 14);
  const k = i % 14;
  return {
    f,
    x: FRAG_X[f] + 22 + (k % 7) * 20,
    y: FRAG_Y + 42 + Math.floor(k / 7) * 22,
  };
});

// The record that gets lost when two writers stomp the same object.
const DOOMED = 47;

const CAM_RAIN: CameraState = { x: 640, y: 300, k: 1.04 };
const CAM_BLOB: CameraState = { x: 620, y: 330, k: 1.28 };
// Keep the full six-fragment row inside the stage while the manifest links
// are visible; the player sidebar leaves no room for a label to hang over
// the right edge.
const CAM_SPLIT: CameraState = { x: 640, y: 360, k: 0.75 };
// The mid-chapter preview lands here while the six fragments are on screen;
// keep their labels inside the 1300px player stage beside the chapter rail.
const CAM_FRAG: CameraState = { x: 560, y: 430, k: 0.95 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rainU: ChannelRef<number>;
  blobU: ChannelRef<number>;
  stompU: ChannelRef<number>;
  lossU: ChannelRef<number>;
  etagU: ChannelRef<number>;
  tileU: ChannelRef<number>;
  fragU: ChannelRef<number>;
  manU: ChannelRef<number>;
  linkU: ChannelRef<number>;
  pathU: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rainU = tl.channel('rainU', 0);
  const blobU = tl.channel('blobU', 0);
  const stompU = tl.channel('stompU', 0);
  const lossU = tl.channel('lossU', 0);
  const etagU = tl.channel('etagU', 0);
  const tileU = tl.channel('tileU', 0);
  const fragU = tl.channel('fragU', 0);
  const manU = tl.channel('manU', 0);
  const linkU = tl.channel('linkU', 0);
  const pathU = tl.channel('pathU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // BEAT 1 — the stakes.
  tl.caption({
    at: 0.4,
    dur: 6.6,
    text: 'You want a durable, strictly ordered log. The only storage you have is a bucket, and a bucket has no locks and no transactions.',
  });
  tl.tween(cam, CAM_RAIN, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(rainU, N, { at: 0.9, dur: 4.6, ease: ease.linear });
  tl.hold(7.0, 0.7);

  // BEAT 2 — the naive design.
  tl.caption({
    at: 7.7,
    dur: 6.4,
    text: 'The obvious move is to keep one object and rewrite it after every append. That works beautifully right up until two writers try it at once.',
  });
  tl.tween(cam, CAM_BLOB, { at: 7.9, dur: 1.4, ease: ease.move });
  tl.tween(blobU, 1, { at: 8.2, dur: 1.6, ease: ease.move });
  tl.hold(14.1, 0.6);

  // BEAT 3 — the loss.
  tl.caption({
    at: 14.7,
    dur: 6.5,
    text: 'Both read the old object, both write their own version back, and the second one wins. An acknowledged append is simply gone.',
  });
  tl.tween(stompU, 1, { at: 15.2, dur: 1.6, ease: ease.move });
  tl.tween(lossU, 1, { at: 17.4, dur: 0.9, ease: ease.pop });
  tl.hold(21.2, 0.7);

  // BEAT 4 — the one primitive you do get.
  tl.caption({
    at: 21.9,
    dur: 6.8,
    text: 'Object storage does give you one sharp tool. Every object carries a version tag, and you can ask it to accept your write only if that tag still matches.',
  });
  tl.tween(etagU, 1, { at: 22.4, dur: 1.0, ease: ease.enter });
  tl.tween(lossU, 0.15, { at: 23.6, dur: 1.0, ease: ease.move });
  tl.hold(28.7, 0.7);

  // BEAT 5 — the split.
  tl.caption({
    at: 29.4,
    dur: 6.6,
    text: 'That tool is far too precious to spend on bulk data. So the log splits itself in two, and this split is the whole idea of the book.',
  });
  tl.tween(cam, CAM_SPLIT, { at: 29.6, dur: 1.5, ease: ease.move });
  tl.tween(blobU, 0, { at: 30.2, dur: 1.2, ease: ease.move });
  tl.tween(stompU, 0, { at: 30.2, dur: 0.8, ease: ease.move });
  tl.tween(etagU, 0.25, { at: 30.4, dur: 0.8, ease: ease.move });
  tl.tween(tileU, 1, { at: 30.6, dur: 2.2, ease: ease.move });
  tl.hold(36.0, 0.7);

  // BEAT 6 — fragments.
  tl.caption({
    at: 36.7,
    dur: 6.9,
    text: 'The records themselves land in fragments: ordinary files, written once, never touched again. Nothing about them needs coordination, so they can be written as fast as the bucket allows.',
  });
  tl.tween(cam, CAM_FRAG, { at: 36.9, dur: 1.5, ease: ease.move });
  tl.tween(fragU, 1, { at: 37.2, dur: 2.0, ease: ease.draw });
  tl.hold(43.6, 0.6);

  // BEAT 7 — the manifest.
  tl.caption({
    at: 44.2,
    dur: 6.8,
    text: 'Above them sits one small file, the manifest. It is a list: which fragments belong to this log, in what order, and covering which offsets.',
  });
  tl.tween(cam, CAM_SPLIT, { at: 44.4, dur: 1.4, ease: ease.move });
  tl.tween(manU, 1, { at: 44.9, dur: 1.0, ease: ease.enter });
  tl.tween(linkU, 1, { at: 45.9, dur: 1.6, ease: ease.draw });
  tl.hold(51.0, 0.6);

  // BEAT 8 — the layout is real.
  tl.caption({
    at: 51.6,
    dur: 6.6,
    text: 'A fragment is a parquet file named by its sequence number under a bucket prefix. The manifest lives at one fixed key, and it is the only object in the log that ever changes.',
  });
  tl.tween(pathU, 1, { at: 52.0, dur: 1.2, ease: ease.enter });
  tl.hold(58.2, 0.7);

  // BEAT 9 — writers and readers.
  tl.caption({
    at: 58.9,
    dur: 6.5,
    text: 'A writer appends and a reader scans, and neither blocks the other. The reader follows the manifest to the fragments it needs and pulls them straight from storage.',
  });
  tl.tween(cam, CAM_SPLIT, { at: 59.1, dur: 1.2, ease: ease.move });
  tl.tween(linkU, 1.6, { at: 59.6, dur: 2.4, ease: ease.move });
  tl.hold(65.4, 0.7);

  // BEAT 10 — payoff, clean stage.
  tl.caption({
    at: 66.1,
    dur: 7.2,
    text: 'Remember the shape, because it keeps coming back: a mountain of immutable data, and one tiny authority record that a single conditional write is allowed to advance.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 66.3, dur: 1.4, ease: ease.move });
  tl.tween(endDim, 1, { at: 66.6, dur: 1.3, ease: ease.move });
  tl.tween(endU, 1, { at: 67.7, dur: 0.9, ease: ease.enter });
  tl.hold(73.3, 1.2);

  return {
    tl, cam, rainU, blobU, stompU, lossU, etagU, tileU, fragU, manU, linkU, pathU, endDim, endU,
  };
}

const scene = buildScene();

// ------------------------------------------------------------------ render

function Records({
  rainU, blobU, tileU, stompU, lossU,
}: { rainU: number; blobU: number; tileU: number; stompU: number; lossU: number }) {
  return (
    <g>
      {RAIN.map((r, i) => {
        const born = clamp01(rainU - i);
        if (born <= 0) return null;
        const b = BLOB[i];
        const t = TILES[i];
        // rain → blob → tiles, a pure two-stage lerp
        // the two writers shove the single object back and forth as they race
        const shove = Math.sin(stompU * Math.PI) * 9 * blobU;
        const bx = lerp(r.x, b.x, blobU) + shove;
        const by = lerp(r.y, b.y, blobU);
        const x = lerp(bx, t.x, tileU);
        const y = lerp(by, t.y, tileU);
        const doomed = i === DOOMED;
        const gone = doomed ? lossU * (1 - tileU) : 0;
        const fill = doomed && lossU > 0.02 ? colors.NEGATIVE : colors.ACCENT;
        return (
          <rect
            key={i}
            x={x - 5}
            y={y - 4}
            width={10}
            height={8}
            rx={2}
            fill={fill}
            opacity={born * (0.42 + 0.5 * tileU) * (1 - gone * 0.95)}
          />
        );
      })}
    </g>
  );
}

function MutableObject({ u, stomp, loss }: { u: number; stomp: number; loss: number }) {
  if (u <= 0.01) return null;
  const shove = Math.sin(stomp * Math.PI) * 9;
  return (
    <g opacity={u}>
      <rect
        x={540 + shove}
        y={280}
        width={200}
        height={128}
        rx={12}
        fill={colors.PANEL}
        stroke={loss > 0.4 ? colors.NEGATIVE : colors.GRID}
        strokeWidth={1.6}
      />
      <text x={640 + shove} y={268} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13}>
        one mutable object
      </text>
      {stomp > 0.05 && (
        <g opacity={clamp01(stomp * 1.6)}>
          <text x={400} y={252} textAnchor="middle" fill={colors.WARM} fontFamily={MONO} fontSize={13}>writer A</text>
          <text x={880} y={252} textAnchor="middle" fill={colors.SECONDARY} fontFamily={MONO} fontSize={13}>writer B</text>
          <line x1={430} y1={262} x2={545} y2={300} stroke={colors.WARM} strokeWidth={1.4} opacity={0.8} />
          <line x1={850} y1={262} x2={738} y2={300} stroke={colors.SECONDARY} strokeWidth={1.4} opacity={0.8} />
        </g>
      )}
      {loss > 0.3 && (
        <text x={640 + shove} y={430} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} opacity={clamp01(loss * 1.4)}>
          one acknowledged append lost
        </text>
      )}
    </g>
  );
}

function EtagChip({ u }: { u: number }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      <rect x={938} y={128} width={266} height={72} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
      <text x={958} y={154} fill={colors.MUTED} fontSize={11} letterSpacing="0.11em">THE ONE ATOMIC PRIMITIVE</text>
      <text x={958} y={182} fill={colors.POSITIVE} fontFamily={MONO} fontSize={16}>If-Match: ETag</text>
    </g>
  );
}

function Fragments({ u, pathU }: { u: number; pathU: number }) {
  if (u <= 0.005) return null;
  return (
    <g>
      {FRAG_X.map((x, f) => {
        const fu = clamp01(u * 7 - f);
        if (fu <= 0) return null;
        return (
          <g key={f} opacity={fu}>
            <rect x={x} y={FRAG_Y} width={FRAG_W} height={116} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
            <text x={x + 14} y={FRAG_Y + 24} fill={colors.MUTED} fontFamily={MONO} fontSize={12}>
              {`FragmentSeqNo=${String(f).padStart(4, '0')}`}
            </text>
            <text x={x + 14} y={FRAG_Y + 108} fill={colors.POSITIVE} fontFamily={MONO} fontSize={11} opacity={0.85}>
              immutable
            </text>
          </g>
        );
      })}
      <text x={116} y={FRAG_Y - 18} fill={colors.MUTED} fontSize={12} letterSpacing="0.12em" opacity={u}>
        FRAGMENTS · WRITTEN ONCE
      </text>
      {pathU > 0.02 && (
        <text x={116} y={FRAG_Y + 148} fill={colors.MUTED} fontFamily={MONO} fontSize={12} opacity={pathU * 0.9}>
          log/Bucket=0000000000000000/FragmentSeqNo=0000000000000001.parquet
        </text>
      )}
    </g>
  );
}

function ManifestCard({ u, linkU, pathU }: { u: number; linkU: number; pathU: number }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      <rect x={392} y={196} width={496} height={122} rx={14} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.8} />
      <text x={414} y={224} fill={colors.MUTED} fontSize={11} letterSpacing="0.11em">THE AUTHORITY RECORD</text>
      <text x={414} y={256} fill={colors.ACCENT} fontFamily={MONO} fontSize={17}>Manifest</text>
      <text x={414} y={284} fill={colors.TEXT} fontFamily={MONO} fontSize={13}>fragments · snapshots · setsum</text>
      {pathU > 0.02 && (
        <text x={414} y={306} fill={colors.MUTED} fontFamily={MONO} fontSize={12} opacity={pathU}>
          manifest/MANIFEST
        </text>
      )}
      {FRAG_X.map((x, f) => {
        const lu = clamp01(linkU * 7 - f);
        if (lu <= 0) return null;
        return (
          <line
            key={f}
            x1={640}
            y1={318}
            x2={x + FRAG_W / 2}
            y2={FRAG_Y - 4}
            stroke={colors.ACCENT}
            strokeWidth={1.1}
            opacity={lu * 0.5}
          />
        );
      })}
      {linkU > 1.05 && (
        <g opacity={clamp01(linkU - 1.05)}>
          <text x={1096} y={252} textAnchor="middle" fill={colors.SECONDARY} fontFamily={MONO} fontSize={14}>LogReader</text>
          <text x={186} y={252} textAnchor="middle" fill={colors.WARM} fontFamily={MONO} fontSize={14}>LogWriter</text>
        </g>
      )}
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
          <Fragments u={s.get(scene.fragU)} pathU={s.get(scene.pathU)} />
          <Records
            rainU={s.get(scene.rainU)}
            blobU={s.get(scene.blobU)}
            tileU={s.get(scene.tileU)}
            stompU={s.get(scene.stompU)}
            lossU={s.get(scene.lossU)}
          />
          <MutableObject u={s.get(scene.blobU)} stomp={s.get(scene.stompU)} loss={s.get(scene.lossU)} />
          <EtagChip u={s.get(scene.etagU)} />
          <ManifestCard u={s.get(scene.manU)} linkU={s.get(scene.linkU)} pathU={s.get(scene.pathU)} />
        </g>

        {endU > 0 && (
          <g opacity={endU}>
            <rect x={216} y={198} width={848} height={266} rx={24} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.8} />
            <text x={640} y={268} textAnchor="middle" fill={colors.ACCENT} fontSize={23} fontWeight={700}>
              THE SHAPE OF A LOG ON OBJECT STORAGE
            </text>
            <text x={640} y={320} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
              immutable fragments · unlimited, uncoordinated
            </text>
            <line x1={430} y1={352} x2={850} y2={352} stroke={colors.GRID} />
            <text x={640} y={392} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>
              one manifest · advanced by one conditional write
            </text>
            <text x={640} y={432} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={13}>
              rust/wal3
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
