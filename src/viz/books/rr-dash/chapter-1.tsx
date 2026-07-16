// A Trace Is Not Yet a Tool
//
// Backed by: README.md (architecture diagram: recorder bundle →
// scripts/upload.mjs via @durable-streams/client → JSON messages into the
// Durable Streams sidecar on :6104, file-backed ./data/streams; trace.tar.zst
// → ./data/blobs/<id>/; Next.js :6100 reads streams per request),
// lib/ingest.mjs (bundle contract: recording.json, sources.json, hits.json,
// points.json, events.json, linetrace.json, stacks.json, trace.tar.zst;
// linetrace/stacks chunked ≤1000), fixtures/sample-bundle/recording.json
// (sample-cachesim-01).
//
// ONE machine: the bundle's files burst into message particles that fly into
// the sidecar's stream rows; the heavy tarball diverts down to blob storage;
// one index chip lands on recordings/index; the dashboard node starts reading.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, ParticleCloud, ServiceNode, Zone } from '../../primitives';
import type { ParticlePoint } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const BUNDLE = { x: 70, y: 120, w: 290, h: 420 };
const SIDECAR = { x: 470, y: 96, w: 440, h: 452 };
const BLOBS = { x: 1090, y: 470 };
const APP = { x: 1090, y: 200 };

/** The extractor's bundle contract (lib/ingest.mjs). */
const FILES = [
  { name: 'recording.json', kind: 'index' },
  { name: 'sources.json', kind: 'sources' },
  { name: 'hits.json', kind: 'hits' },
  { name: 'points.json', kind: 'points' },
  { name: 'events.json', kind: 'events' },
  { name: 'linetrace.json', kind: 'linetrace' },
  { name: 'stacks.json', kind: 'stacks' },
  { name: 'trace.tar.zst', kind: 'blob' },
] as const;

/** Stream rows inside the sidecar (lib/ds.ts layout). */
const ROWS = [
  { path: 'recordings/index', kind: 'index', color: colors.WARM },
  { path: 'rec/<id>/sources', kind: 'sources', color: colors.ACCENT },
  { path: 'rec/<id>/hits', kind: 'hits', color: colors.TEAL },
  { path: 'rec/<id>/points', kind: 'points', color: colors.SECONDARY },
  { path: 'rec/<id>/events', kind: 'events', color: colors.POSITIVE },
  { path: 'rec/<id>/linetrace', kind: 'linetrace', color: colors.ACCENT },
  { path: 'rec/<id>/stacks', kind: 'stacks', color: colors.SECONDARY },
] as const;
const ROW_H = 54;
const rowY = (i: number) => SIDECAR.y + 64 + i * ROW_H;
const fileY = (i: number) => BUNDLE.y + 58 + i * 44;

const CAM_BUNDLE: CameraState = { x: 330, y: 330, k: 1.3 };
const CAM_SIDECAR: CameraState = { x: 640, y: 330, k: 1.16 };
const CAM_BLOB: CameraState = { x: 850, y: 440, k: 1.2 };
const CAM_WIDE: CameraState = { x: 640, y: 352, k: 1.0 };

/* ---------------------------------------------------- message particles */
/** Every JSON message in flight: file card edge → its stream row. Chunky
 * squares for linetrace/stacks chunks, small dots otherwise. Precomputed. */
interface Msg {
  emit: number; // 0..1 of uploadP when it departs
  fi: number; // file index (source)
  ri: number; // row index (target)
  big: boolean;
  jitter: number;
}
const rand = mulberry32(41);
const MSGS: Msg[] = (() => {
  const out: Msg[] = [];
  const plan: [string, number, boolean][] = [
    // [kind, messages, chunked]
    ['sources', 5, false],
    ['hits', 9, false],
    ['points', 6, false],
    ['events', 8, false],
    ['linetrace', 5, true],
    ['stacks', 4, true],
    ['index', 1, false],
  ];
  let t = 0.02;
  for (const [kind, n, big] of plan) {
    const fi = FILES.findIndex((f) => f.kind === kind);
    const ri = ROWS.findIndex((r) => r.kind === kind);
    for (let k = 0; k < n; k++) {
      out.push({ emit: t, fi, ri, big, jitter: rand() * 8 - 4 });
      t += big ? 0.028 : 0.02;
    }
  }
  return out;
})();
const FLIGHT = 0.1;
/** How many messages have landed on row ri at upload progress p. */
function landedOn(ri: number, p: number): number {
  let n = 0;
  for (const m of MSGS) if (m.ri === ri && m.emit + FLIGHT <= p) n++;
  return n;
}

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const bundleU = tl.channel('bundleU', 0);
  const promiseU = tl.channel('promiseU', 0);
  const filesU = tl.channel('filesU', 0); // staggers the file cards' focus
  const sidecarU = tl.channel('sidecarU', 0);
  const uploadP = tl.channel('uploadP', 0); // THE clock of the upload
  const blobU = tl.channel('blobU', 0); // tarball departs for blobs
  const indexPopU = tl.channel('indexPopU', 0);
  const appU = tl.channel('appU', 0);
  const readFlow = tl.channel('readFlow', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  /* — beat 1 · the opaque bundle — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'A deterministic recording holds an entire execution — every instruction, every system call, replayable forever. And on disk, it is a folder you can do nothing with.',
  });
  tl.tween(bundleU, 1, { at: t - 5.8, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_BUNDLE, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.6);

  /* — beat 2 · the promise — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The promise of this dashboard is simple. Every line of source should know how often it ran, and every moment should have an address you can jump back to.',
  });
  tl.tween(promiseU, 1, { at: t - 4.8, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 3 · the bundle contract — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The recorder already flattened the trace into structured files: the sources, per line hit counts, first hit points, system call events, the full line trace, and sampled stacks.',
  });
  tl.tween(filesU, 1, { at: t - 5.6, dur: 2.4, ease: ease.move });
  tl.tween(promiseU, 0, { at: t - 5.8, dur: 0.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 4 · the sidecar appears — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The upload script reads each file and appends it, message by message, onto durable streams — one append-only log per kind, served by a small sidecar on port sixty one zero four.',
  });
  tl.tween(sidecarU, 1, { at: t - 5.4, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAM_SIDECAR, { at: t - 4.8, dur: 1.6, ease: ease.move });
  tl.tween(uploadP, 0.16, { at: t - 2.6, dur: 2.6, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 5 · messages land — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Sources land on the sources stream, hit counts on hits, first hit points on points, events on events. Each message is one small structured record.',
  });
  tl.tween(uploadP, 0.62, { at: t - 5.4, dur: 5.4, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 6 · chunks — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The line trace can run to fifty thousand entries, so it travels in chunks of up to a thousand at a time. Readers just flatten the chunks back into one sequence.',
  });
  tl.tween(uploadP, 0.96, { at: t - 5.2, dur: 5.2, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 7 · the tarball diverts — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'One file refuses to become messages: the packed trace itself, the compressed determinism. It is copied aside into a blob directory instead, keyed by recording id.',
  });
  tl.tween(cam, CAM_BLOB, { at: t - 5.4, dur: 1.4, ease: ease.move });
  tl.tween(blobU, 1, { at: t - 4.2, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 8 · the index entry — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Last, a single entry is appended to the recordings index: the id, the title, the command, the counts. The index is how the dashboard knows this recording exists at all.',
  });
  tl.tween(cam, CAM_SIDECAR, { at: t - 5.2, dur: 1.2, ease: ease.move });
  tl.tween(uploadP, 1, { at: t - 3.8, dur: 1.2, ease: ease.linear });
  tl.tween(indexPopU, 1, { at: t - 2.4, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 9 · the reader — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Now a web app on port sixty one hundred reads those streams on every request. No relational database, no migrations — the streams are the database.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.4, dur: 1.6, ease: ease.move });
  tl.tween(appU, 1, { at: t - 4.6, dur: 0.7, ease: ease.enter });
  tl.tween(readFlow, 3, { at: t - 3.8, dur: 3.8, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 10 · close — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The trace is still on disk, untouched. But the recording is no longer opaque — it has become addressable data. Next: the shape that data takes.',
  });
  tl.tween(dimU, 1, { at: t - 5.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.6, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.2);

  return { tl, cam, bundleU, promiseU, filesU, sidecarU, uploadP, blobU, indexPopU, appU, readFlow, dimU, closeU };
}

const scene = buildScene();

/* --------------------------------------------- per-frame particle flight */
const PTS: ParticlePoint[] = MSGS.map(() => ({ x: 0, y: 0, r: 3, alpha: 0, color: colors.MUTED }));
const OUT: ParticlePoint[] = [];
function computeMsgs(s: SceneState): ParticlePoint[] {
  const p = s.get(scene.uploadP);
  OUT.length = 0;
  if (p <= 0) return OUT;
  for (let i = 0; i < MSGS.length; i++) {
    const m = MSGS[i];
    const u = (p - m.emit) / FLIGHT;
    if (u <= 0 || u >= 1) continue;
    const uu = ease.move(clamp01(u));
    const x0 = BUNDLE.x + BUNDLE.w - 14;
    const y0 = fileY(m.fi) + 14;
    const x1 = SIDECAR.x + 26;
    const y1 = rowY(m.ri) + 26 + m.jitter;
    const mx = (x0 + x1) / 2;
    const my = Math.min(y0, y1) - 34;
    const a = 1 - uu;
    const pt = PTS[i];
    pt.x = a * a * x0 + 2 * a * uu * mx + uu * uu * x1;
    pt.y = a * a * y0 + 2 * a * uu * my + uu * uu * y1;
    pt.r = m.big ? 5 : 3;
    pt.color = ROWS[m.ri].color;
    pt.alpha = Math.min(1, u * 6);
    OUT.push(pt);
  }
  return OUT;
}

/* -------------------------------------------------- local subcomponents */

/** The recorder bundle: a directory listing of the extractor's contract. */
function BundleDir({ u, filesU, blobU, dim }: { u: number; filesU: number; blobU: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g transform={`translate(${BUNDLE.x}, ${BUNDLE.y + (1 - e) * 14})`} opacity={e * (1 - 0.85 * dim)}>
      <rect width={BUNDLE.w} height={BUNDLE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={18} y={28} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        recorder bundle · sample-cachesim-01/
      </text>
      {FILES.map((f, i) => {
        const focus = clamp01(filesU * (FILES.length + 1) - i);
        const isBlob = f.kind === 'blob';
        const gone = isBlob ? clamp01(blobU * 1.4) : 0;
        return (
          <g key={f.name} transform={`translate(18, ${fileY(i) - BUNDLE.y})`} opacity={1 - 0.85 * gone}>
            <rect
              width={BUNDLE.w - 36}
              height={30}
              rx={7}
              fill={isBlob ? colors.WARM : colors.ACCENT}
              opacity={0.08 + 0.1 * focus}
            />
            <rect
              width={BUNDLE.w - 36}
              height={30}
              rx={7}
              fill="none"
              stroke={isBlob ? colors.WARM : colors.GRID}
              strokeWidth={1.2}
              opacity={0.4 + 0.6 * focus}
            />
            <text x={12} y={20} fill={focus > 0.4 ? colors.TEXT : colors.MUTED} fontSize={12.5} fontFamily={mono}>
              {f.name}
            </text>
            {isBlob && (
              <text x={BUNDLE.w - 48} y={20} textAnchor="end" fill={colors.WARM} fontSize={11} fontFamily={mono} opacity={0.9}>
                214 MB
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** The promise card — the two invariants the dashboard exists for. */
function PromiseCard({ u }: { u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g transform={`translate(470, ${170 + (1 - e) * 12})`} opacity={e}>
      <rect width={430} height={120} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={24} y={36} fill={colors.MUTED} fontSize={12}>
        the promise
      </text>
      <text x={24} y={66} fill={colors.TEXT} fontSize={15} fontWeight={600}>
        every line knows how often it ran
      </text>
      <text x={24} y={94} fill={colors.TEXT} fontSize={15} fontWeight={600}>
        every moment has an address
      </text>
    </g>
  );
}

/** The Durable Streams sidecar: labeled stream rows filling with ticks. */
function Sidecar({ u, uploadP, indexPop, dim }: { u: number; uploadP: number; indexPop: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g opacity={1 - 0.8 * dim}>
      <Zone
        x={SIDECAR.x}
        y={SIDECAR.y}
        w={SIDECAR.w}
        h={SIDECAR.h}
        label="Durable Streams sidecar :6104 · ./data/streams"
        kind="group"
        u={e}
      />
      {ROWS.map((r, i) => {
        const ru = clamp01(e * 1.6 - i * 0.08);
        const landed = landedOn(i, uploadP);
        const isIndex = r.kind === 'index';
        return (
          <g key={r.path} transform={`translate(${SIDECAR.x + 18}, ${rowY(i)})`} opacity={ru}>
            <text y={14} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
              {r.path}
              {(r.kind === 'linetrace' || r.kind === 'stacks') && (
                <tspan fill={colors.MUTED} opacity={0.7}>
                  {'  · chunks ≤1000'}
                </tspan>
              )}
            </text>
            <rect y={20} width={SIDECAR.w - 36} height={14} rx={4} fill={colors.BG} stroke={colors.GRID} strokeWidth={1} />
            {Array.from({ length: landed }, (_, k) => {
              const big = r.kind === 'linetrace' || r.kind === 'stacks';
              return (
                <rect key={k} x={4 + k * (big ? 26 : 14)} y={23} width={big ? 20 : 9} height={8} rx={2} fill={r.color} opacity={0.85} />
              );
            })}
            {isIndex && indexPop > 0 && (
              <g transform={`translate(${SIDECAR.w - 190}, ${27 + (1 - clamp01(indexPop)) * 6})`} opacity={clamp01(indexPop)}>
                <rect x={-8} y={-13} width={162} height={22} rx={11} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
                <text y={2} fill={colors.WARM} fontSize={10.5} fontFamily={mono}>
                  {'{ id, title, cmd, … }'}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** The tarball's flight down to blob storage. */
function BlobFlight({ u }: { u: number }) {
  const p = clamp01(u);
  if (p <= 0 || p >= 1) return null;
  const uu = ease.move(p);
  const x0 = BUNDLE.x + BUNDLE.w - 20;
  const y0 = fileY(7) + 14;
  const x1 = BLOBS.x - 60;
  const y1 = BLOBS.y;
  const mx = (x0 + x1) / 2;
  const my = Math.max(y0, y1) + 80;
  const a = 1 - uu;
  const x = a * a * x0 + 2 * a * uu * mx + uu * uu * x1;
  const y = a * a * y0 + 2 * a * uu * my + uu * uu * y1;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={Math.min(1, p * 5)}>
      <rect x={-34} y={-12} width={68} height={24} rx={6} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
      <text y={4} textAnchor="middle" fill={colors.WARM} fontSize={9.5} fontFamily={mono}>
        trace.tar.zst
      </text>
    </g>
  );
}

/** Closing card — the chapter's thesis, on a quiet stage. */
function CloseCard({ u }: { u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g transform={`translate(640, ${300 + (1 - e) * 10})`} opacity={e}>
      <rect x={-330} y={-56} width={660} height={112} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text y={-12} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
        the trace has become addressable data
      </text>
      <text y={24} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={mono}>
        bundle → JSON messages → streams · trace.tar.zst → blobs
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const uploadP = s.get(scene.uploadP);
  const blobU = s.get(scene.blobU);
  const appU = clamp01(s.get(scene.appU));
  return (
    <Camera {...s.get(scene.cam)}>
      <BundleDir u={s.get(scene.bundleU)} filesU={s.get(scene.filesU)} blobU={blobU} dim={dim} />
      <PromiseCard u={s.get(scene.promiseU)} />
      <Sidecar u={s.get(scene.sidecarU)} uploadP={uploadP} indexPop={s.get(scene.indexPopU)} dim={dim} />
      <ParticleCloud state={s} compute={computeMsgs} />
      <BlobFlight u={blobU} />
      <g opacity={1 - 0.8 * dim}>
        <ServiceNode
          x={BLOBS.x}
          y={BLOBS.y}
          kind="storage"
          label="./data/blobs/<id>/"
          sublabel="trace.tar.zst"
          u={clamp01(blobU * 2)}
          glow={blobU > 0.9 ? 0.5 : 0}
        />
        <ServiceNode x={APP.x} y={APP.y} kind="server" label="Next.js :6100" sublabel="reads per request" u={appU} />
        {appU > 0.1 && (
          <Connection
            from={{ x: APP.x - 70, y: APP.y }}
            to={{ x: SIDECAR.x + SIDECAR.w, y: 240 }}
            u={appU}
            flow={s.get(scene.readFlow)}
            label="@durable-streams/client"
            color={colors.ACCENT}
            arrow
          />
        )}
      </g>
      <CloseCard u={s.get(scene.closeU)} />
    </Camera>
  );
}
export const vizScene = () => scene;
