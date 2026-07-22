// Nostr Implementation Possibilities №4 — Threads and Reactions, chapter 2.
// NIP-10 at scale: a thread is reconstructed CLIENT-SIDE from each event's
// marked e-tags. Ten notes arrive from relays in shuffled order; each one
// carries its own root/reply claims and snaps into place — including an
// orphan that must wait for its parent. The tree layout and arrival order
// are precomputed at module scope; every frame is a pure function of one
// placement channel.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { flightPos } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The thread: 10 notes, parent links, tree slots, shuffled arrival order.
// ---------------------------------------------------------------------------
interface Note {
  id: number;
  parent: number | null; // null = root
  x: number;
  y: number;
  t: string; // created_at label (illustrative clock times)
}

export const NOTES: Note[] = [
  { id: 0, parent: null, x: 640, y: 130, t: '09:00' },
  { id: 1, parent: 0, x: 430, y: 225, t: '09:04' },
  { id: 2, parent: 0, x: 850, y: 225, t: '09:02' },
  { id: 3, parent: 1, x: 320, y: 320, t: '09:11' },
  { id: 4, parent: 1, x: 540, y: 320, t: '09:07' },
  { id: 5, parent: 2, x: 760, y: 320, t: '09:15' },
  { id: 6, parent: 3, x: 320, y: 415, t: '09:20' },
  { id: 7, parent: 2, x: 940, y: 320, t: '09:09' },
  { id: 8, parent: 4, x: 540, y: 415, t: '09:18' },
  { id: 9, parent: 6, x: 320, y: 510, t: '09:26' },
];

// arrival order from three relays — deliberately not chronological.
export const ARRIVAL = [4, 2, 9, 0, 7, 1, 6, 3, 8, 5];
const arrivalIdx = (id: number) => ARRIVAL.indexOf(id);

// scattered start positions (seeded)
const rand = mulberry32(77);
const SCATTER = NOTES.map(() => ({
  x: 140 + rand() * 1000,
  y: 560 + rand() * 60,
}));

// the orphan: note 9 arrives 3rd but its parent (6) arrives 7th.
const ORPHAN_WAIT = { x: 150, y: 420 };

const NODE_COLOR = [
  colors.ACCENT, colors.POSITIVE, colors.SECONDARY, colors.POSITIVE, colors.WARM,
  colors.SECONDARY, colors.POSITIVE, colors.WARM, colors.SECONDARY, colors.NEGATIVE,
];

// time-sorted strip (the markerless alternative)
const SORTED = [...NOTES].sort((a, b) => (a.t < b.t ? -1 : 1));
const STRIP_Y = 600;
const stripX = (rank: number) => 200 + rank * 98;

const CAM_BAG: CameraState = { x: 640, y: 430, k: 1.15 };
const CAM_TREE: CameraState = { x: 630, y: 300, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  bagU: ChannelRef<number>;
  placeU: ChannelRef<number>;
  edgeU: ChannelRef<number>;
  tallyU: ChannelRef<number>;
  stripU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const bagU = tl.channel('bagU', 0);
  const placeU = tl.channel('placeU', 0);
  const edgeU = tl.channel('edgeU', 0);
  const tallyU = tl.channel('tallyU', 0);
  const stripU = tl.channel('stripU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the bag.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Ten notes of one conversation arrive from three different relays — and they arrive in whatever order the sockets deliver them. Nine oh seven before nine oh two. The end before the beginning.',
  });
  tl.tween(cam, CAM_BAG, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(bagU, 1, { at: 1.0, dur: 2.2, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — no coordinator.
  tl.caption({
    at: 7.0,
    dur: 5.4,
    text: 'No server is going to sort this out, because no server owns the thread. But every note carries its own claim about where it belongs — a tag marked root, a tag marked reply.',
  });
  tl.hold(12.6, 0.7);

  // Beat 3 — placement begins.
  tl.caption({
    at: 13.3,
    dur: 6.2,
    text: 'So the client just reads the claims. First arrival: a note whose reply marker points at a parent it has never seen — it waits. Next: a branch off the root. Then the root itself lands, and the tree has a trunk.',
  });
  tl.tween(cam, CAM_TREE, { at: 13.5, dur: 1.5, ease: ease.move });
  tl.tween(placeU, 0.4, { at: 14.2, dur: 4.6, ease: ease.linear });
  tl.hold(19.7, 0.7);

  // Beat 4 — the rest snap in.
  tl.caption({
    at: 20.4,
    dur: 6.0,
    text: 'The rest snap in as they land, each pulled by its own markers. And watch the red one on the left: the moment its missing parent finally arrives, the orphan finds its branch. Nobody asked; the tags knew.',
  });
  tl.tween(placeU, 1, { at: 20.8, dur: 4.8, ease: ease.linear });
  tl.tween(edgeU, 1, { at: 21.2, dur: 5.0, ease: ease.linear });
  tl.hold(26.6, 0.7);

  // Beat 5 — the payoff pull-back.
  tl.caption({
    at: 27.3,
    dur: 5.2,
    text: 'Pull back and count what just happened: ten notes, three relays, zero questions asked, one thread. Every client that receives these same events rebuilds exactly this shape.',
  });
  tl.tween(tallyU, 1, { at: 28.4, dur: 0.8, ease: ease.pop });
  tl.hold(32.7, 0.7);

  // Beat 6 — the markerless alternative.
  tl.caption({
    at: 33.4,
    dur: 6.2,
    text: 'Strip the markers away and all you can do is sort by timestamp. Same ten notes, flattened into a line — who answered whom is gone. A feed is what a conversation looks like when the tags stay silent.',
  });
  tl.tween(stripU, 1, { at: 34.4, dur: 2.4, ease: ease.draw });
  tl.hold(39.8, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 40.5,
    dur: 5.6,
    text: 'This is the quiet trick of the whole protocol: structure lives in the events, not in the infrastructure. Relays stay dumb, clients stay smart, and the conversation survives any path it takes to reach you.',
  });
  tl.tween(dimU, 1, { at: 40.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 41.9, dur: 1.0, ease: ease.enter });
  tl.hold(46.1, 1.2);

  return { tl, cam, bagU, placeU, edgeU, tallyU, stripU, dimU, closeU };
}

const scene = buildScene();

// per-note placement progress, honoring the orphan's wait
function notePos(id: number, bagU: number, placeU: number): { x: number; y: number; waiting: boolean } {
  const note = NOTES[id];
  const k = arrivalIdx(id);
  const appearU = clamp01(bagU * NOTES.length * 0.5 - k * 0.5);
  const start = SCATTER[id];
  if (appearU <= 0) return { x: start.x, y: start.y, waiting: false };
  const snapU = clamp01(placeU * NOTES.length - k);
  if (id === 9) {
    // orphan: flies to a waiting spot on its own turn, joins once parent 6 is placed
    const parentSnapped = clamp01(placeU * NOTES.length - arrivalIdx(6)) >= 1;
    const waitP = flightPos(start, ORPHAN_WAIT, snapU, 60);
    if (!parentSnapped) return { x: waitP.x, y: waitP.y, waiting: snapU >= 1 };
    const joinU = clamp01(placeU * NOTES.length - arrivalIdx(6) - 0.6);
    const p = flightPos(ORPHAN_WAIT, { x: note.x, y: note.y }, joinU, 60);
    return { x: p.x, y: p.y, waiting: joinU < 1 };
  }
  const p = flightPos(start, { x: note.x, y: note.y }, snapU, 80);
  return { x: p.x, y: p.y, waiting: false };
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const bagU = s.get(scene.bagU);
  const placeU = s.get(scene.placeU);
  const edgeU = s.get(scene.edgeU);
  const tallyU = s.get(scene.tallyU);
  const stripU = s.get(scene.stripU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const treeOp = 1 - 0.45 * stripU; // recede slightly while the strip speaks

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <g opacity={treeOp}>
            {/* edges — drawn only once both ends are snapped */}
            {NOTES.map((n) => {
              if (n.parent === null) return null;
              const childSnap = n.id === 9
                ? clamp01(placeU * NOTES.length - arrivalIdx(6) - 0.6)
                : clamp01(placeU * NOTES.length - arrivalIdx(n.id));
              const parentSnap = clamp01(placeU * NOTES.length - arrivalIdx(n.parent));
              const u = Math.min(childSnap >= 1 ? 1 : 0, parentSnap >= 1 ? 1 : 0) * clamp01(edgeU * 2);
              if (u <= 0) return null;
              const p = NOTES[n.parent];
              return (
                <line
                  key={n.id}
                  x1={p.x} y1={p.y + 16} x2={n.x} y2={n.y - 16}
                  stroke={colors.GRID} strokeWidth={1.6} opacity={u}
                />
              );
            })}

            {/* notes */}
            {NOTES.map((n) => {
              const k = arrivalIdx(n.id);
              const appearU = clamp01(bagU * NOTES.length * 0.5 - k * 0.5);
              if (appearU <= 0) return null;
              const pos = notePos(n.id, bagU, placeU);
              const snapped = (n.id === 9
                ? clamp01(placeU * NOTES.length - arrivalIdx(6) - 0.6)
                : clamp01(placeU * NOTES.length - k)) >= 1;
              return (
                <g key={n.id} opacity={appearU}>
                  <circle cx={pos.x} cy={pos.y} r={15} fill={colors.PANEL} stroke={NODE_COLOR[n.id]} strokeWidth={2} />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={NODE_COLOR[n.id]} fontSize={11} fontFamily="monospace">
                    {n.t.slice(3)}
                  </text>
                  {pos.waiting && (
                    <text x={pos.x} y={pos.y - 24} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5}>
                      parent unseen — waiting
                    </text>
                  )}
                  {snapped && n.parent !== null && n.id !== 9 && (
                    <text x={pos.x + 20} y={pos.y - 12} fill={colors.MUTED} fontSize={9} fontFamily="monospace" opacity={0.8}>
                      reply
                    </text>
                  )}
                </g>
              );
            })}
            {clamp01(placeU * NOTES.length - arrivalIdx(0)) >= 1 && (
              <text x={NOTES[0].x} y={NOTES[0].y - 28} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily="monospace">
                root
              </text>
            )}
          </g>

          {/* tally */}
          {tallyU > 0 && (
            <g opacity={tallyU * treeOp}>
              <text x={1090} y={150} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={600}>
                10 notes · 3 relays
              </text>
              <text x={1090} y={176} textAnchor="middle" fill={colors.POSITIVE} fontSize={14}>
                0 questions asked
              </text>
              <text x={1090} y={202} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                1 thread
              </text>
            </g>
          )}

          {/* the markerless strip */}
          {stripU > 0 && (
            <g opacity={stripU}>
              <text x={200} y={STRIP_Y - 26} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                without markers: sort by created_at and hope
              </text>
              {SORTED.map((n, rank) => {
                const u = clamp01(stripU * SORTED.length - rank);
                if (u <= 0) return null;
                return (
                  <g key={n.id} opacity={u}>
                    <circle cx={stripX(rank)} cy={STRIP_Y} r={13} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                    <text x={stripX(rank)} y={STRIP_Y + 4} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                      {n.t.slice(3)}
                    </text>
                    {rank > 0 && (
                      <line x1={stripX(rank - 1) + 13} y1={STRIP_Y} x2={stripX(rank) - 13} y2={STRIP_Y} stroke={colors.GRID} strokeWidth={1} opacity={0.6} />
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Structure lives in the events
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            every client rebuilds the same tree from the same tags
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-10 · relays stay dumb, clients stay smart
          </text>
        </g>
      )}
    </>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
