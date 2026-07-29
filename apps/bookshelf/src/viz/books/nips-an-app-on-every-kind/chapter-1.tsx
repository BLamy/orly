// The Kind Number Is a Schema — chapter 1 of "An App on Every Kind".
//
// Grounded in NIP-01's kind ranges (regular 1000–9999, replaceable
// 10000–19999, ephemeral 20000–29999, addressable/parameterized
// 30000–39999, plus the small fixed kinds 0/1/3/…) and the real kinds minted
// across the ecosystem. ONE machine: a single event whose ONLY changing field
// is `kind` gets read four different ways; then the camera pulls back to
// reveal the whole populated namespace — colonies of real kinds, colored by
// range — and the closing question: who decides which app opens a kind?
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
import { JsonDoc, layoutJson } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// One event, read four ways — only `kind` changes (module scope)
// ---------------------------------------------------------------------------
const READINGS = [
  { kind: 1, label: 'a short note', reader: 'a microblog client renders a post' },
  { kind: 0, label: 'a profile', reader: 'the content is your name and picture' },
  { kind: 7, label: 'a reaction', reader: 'the content is a single “+”' },
  { kind: 30023, label: 'an article', reader: 'the content is long-form markdown' },
];
const baseEvent = (kind: number) => ({
  kind,
  pubkey: '8e0d3d3e…5e0ed7',
  created_at: 1700900000,
  tags: [] as string[][],
  content: '…',
});
const READING_LAYOUTS = READINGS.map((r) =>
  layoutJson(baseEvent(r.kind), { x: 150, y: 150, fontSize: 17 }),
);

// ---------------------------------------------------------------------------
// The populated namespace — real kinds, positioned in range bands
// ---------------------------------------------------------------------------
type Band = 'fixed' | 'regular' | 'replaceable' | 'ephemeral' | 'addressable';
const BAND_COLOR: Record<Band, string> = {
  fixed: colors.MUTED,
  regular: colors.ACCENT,
  replaceable: colors.POSITIVE,
  ephemeral: colors.WARM,
  addressable: colors.SECONDARY,
};
const bandOf = (k: number): Band =>
  k >= 30000 && k < 40000 ? 'addressable'
  : k >= 20000 && k < 30000 ? 'ephemeral'
  : k >= 10000 && k < 20000 ? 'replaceable'
  : k >= 1000 && k < 10000 ? 'regular'
  : 'fixed';

const KINDS: Array<{ k: number; label: string }> = [
  { k: 0, label: 'profile' },
  { k: 1, label: 'note' },
  { k: 3, label: 'follows' },
  { k: 5, label: 'delete' },
  { k: 6, label: 'repost' },
  { k: 7, label: 'reaction' },
  { k: 1059, label: 'gift wrap' },
  { k: 1111, label: 'comment' },
  { k: 1311, label: 'live chat' },
  { k: 1617, label: 'git patch' },
  { k: 1621, label: 'git issue' },
  { k: 9734, label: 'zap request' },
  { k: 9735, label: 'zap receipt' },
  { k: 10002, label: 'relay list' },
  { k: 27235, label: 'http auth' },
  { k: 30023, label: 'article' },
  { k: 30078, label: 'app data' },
  { k: 30311, label: 'live event' },
  { k: 30617, label: 'git repo' },
  { k: 31922, label: 'calendar' },
  { k: 31989, label: 'handler rec' },
  { k: 31990, label: 'handler info' },
];
const NS_COLS = 6;
const NS = { x: 150, y: 150, dx: 168, dy: 92 };
const nsPos = (i: number) => ({
  x: NS.x + (i % NS_COLS) * NS.dx,
  y: NS.y + Math.floor(i / NS_COLS) * NS.dy,
});

const CAM_EVENT: CameraState = { x: 360, y: 300, k: 1.35 };
const CAM_NS: CameraState = { x: 640, y: 320, k: 1.0 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const eventU = tl.channel('eventU', 0);
  const readF = tl.channel('readF', 0); // floored → which reading is showing
  const readerU = tl.channel('readerU', 0);
  const nsU = tl.channel('nsU', 0);
  const bandsU = tl.channel('bandsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — one event, one field decides everything.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'By now the shape is familiar: one signed event, the same seven fields every time. But there is a single integer inside it that changes what the whole thing means.',
  });
  tl.tween(eventU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_EVENT, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.6);

  // Beat 2 — flip the kind, get four readers.
  tl.caption({
    at: 6.9,
    dur: 6.6,
    text: 'The kind number. Set it to one and clients read a short note. Set it to zero and the same event is a profile. Seven, a reaction. Thirty thousand twenty three, a long-form article — nothing else changed.',
  });
  tl.tween(readerU, 1, { at: 7.2, dur: 0.5, ease: ease.enter });
  tl.set(readF, 0, 7.4);
  tl.set(readF, 1, 9.2);
  tl.set(readF, 2, 11.0);
  tl.set(readF, 3, 12.6);
  tl.hold(13.5, 0.7);

  // Beat 3 — the kind is a promise about how to read it.
  tl.caption({
    at: 14.2,
    dur: 5.8,
    text: 'So the kind is not a label stuck on afterward. It is a promise about how to read the tags and the content — a tiny schema identifier that every client agrees to honor.',
  });
  tl.hold(20.0, 0.6);

  // Beat 4 — pull back: the whole namespace.
  tl.caption({
    at: 20.6,
    dur: 6.4,
    text: 'And there is not one schema — there are thousands. Pull back and the number line fills in: every kind a colony, every colony an agreement about a kind of thing you can say.',
  });
  tl.tween(cam, CAM_NS, { at: 20.8, dur: 1.6, ease: ease.move });
  tl.tween(eventU, 0, { at: 20.8, dur: 0.8, ease: ease.move });
  tl.tween(readerU, 0, { at: 20.8, dur: 0.6, ease: ease.move });
  tl.tween(nsU, 1, { at: 21.8, dur: 3.4, ease: ease.linear });
  tl.hold(27.0, 0.7);

  // Beat 5 — the ranges organize the map (recall book 1).
  tl.caption({
    at: 27.7,
    dur: 6.4,
    text: 'The map has districts. Regular kinds a relay keeps; replaceable kinds where only the newest survives; ephemeral kinds a relay forwards and forgets; and the addressable district, where an event has a lasting address.',
  });
  tl.tween(bandsU, 1, { at: 28.0, dur: 2.0, ease: ease.enter });
  tl.hold(34.1, 0.7);

  // Beat 6 — the open frontier.
  tl.caption({
    at: 34.8,
    dur: 6.0,
    text: 'Most of this number line is empty. Anyone can settle an unused kind, publish the agreement, and mint a brand-new kind of event — one every other client can already carry, because it is still just an event.',
  });
  tl.hold(40.8, 0.6);

  // Beat 7 — close / the question.
  tl.caption({
    at: 41.4,
    dur: 5.8,
    text: 'Which raises the question this book is about. If anyone can invent a kind, and your client meets one it has never seen — how does it know which app in the world is meant to open it?',
  });
  tl.tween(dimU, 1, { at: 41.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.8, dur: 1.0, ease: ease.enter });
  tl.hold(47.2, 1.2);

  return { tl, cam, eventU, readF, readerU, nsU, bandsU, dimU, closeU };
}

const scene = buildScene();

const BANDS: Array<{ band: Band; label: string }> = [
  { band: 'regular', label: 'regular — kept' },
  { band: 'replaceable', label: 'replaceable — newest wins' },
  { band: 'ephemeral', label: 'ephemeral — forwarded, forgotten' },
  { band: 'addressable', label: 'addressable — has an address' },
];

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const eventU = s.get(scene.eventU);
  const readF = Math.round(s.get(scene.readF));
  const readerU = s.get(scene.readerU);
  const nsU = s.get(scene.nsU);
  const bandsU = s.get(scene.bandsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const ri = Math.max(0, Math.min(readF, READINGS.length - 1));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* one event, kind flipping */}
          {eventU > 0 && (
            <g opacity={eventU}>
              <JsonDoc layout={READING_LAYOUTS[ri]} reveal={1} focus={['kind']} focusU={readerU} />
              {readerU > 0 && (
                <g opacity={readerU}>
                  <rect x={150} y={470} width={430} height={64} rx={10} fill={colors.PANEL} stroke={BAND_COLOR[bandOf(READINGS[ri].kind)]} />
                  <text x={170} y={500} fill={colors.TEXT} fontSize={16} fontWeight={600}>
                    read as {READINGS[ri].label}
                  </text>
                  <text x={170} y={522} fill={colors.MUTED} fontSize={13}>
                    {READINGS[ri].reader}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* the populated namespace */}
          {nsU > 0 &&
            KINDS.map((kd, i) => {
              const u = clamp01(nsU * KINDS.length * 1.1 - i);
              if (u <= 0) return null;
              const p = nsPos(i);
              const c = BAND_COLOR[bandOf(kd.k)];
              return (
                <g key={kd.k} opacity={u}>
                  <rect x={p.x} y={p.y} width={140} height={64} rx={9} fill={colors.PANEL} stroke={c} strokeWidth={1.4} opacity={0.9} />
                  <text x={p.x + 14} y={p.y + 28} fill={c} fontSize={17} fontWeight={700} fontFamily="monospace">
                    {kd.k}
                  </text>
                  <text x={p.x + 14} y={p.y + 50} fill={colors.TEXT} fontSize={13}>
                    {kd.label}
                  </text>
                </g>
              );
            })}

          {/* range legend */}
          {bandsU > 0 && (
            <g opacity={bandsU}>
              {BANDS.map((b, i) => (
                <g key={b.band} transform={`translate(${180 + i * 245}, 560)`}>
                  <rect x={0} y={0} width={16} height={16} rx={4} fill={BAND_COLOR[b.band]} opacity={0.9} />
                  <text x={24} y={13} fill={colors.MUTED} fontSize={12.5}>
                    {b.label}
                  </text>
                </g>
              ))}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The kind number is a schema
          </text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            one open namespace — anyone can mint a kind every client can carry
          </text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            kind ranges per NIP-01 · which app opens a kind? →
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
