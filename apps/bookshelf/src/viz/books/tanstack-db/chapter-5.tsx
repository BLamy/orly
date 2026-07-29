// Sync in Production — the txid round trip
//
// Backed by: docs/collections/electric-collection.md and packages/
// electric-db-collection/src/electric.ts (ShapeStream messages carry
// message.headers.txids into a seenTxids store; awaitTxId(txid, 5000) resolves
// when the server's txid streams back; handlers return { txid } as the
// matching strategy), plus examples/react/todo/src/api/server.ts (generateTxId:
// SELECT pg_current_xact_id()::xid::text inside the write transaction). ONE
// machine: the production circuit — browser → your API → Postgres → Electric
// (reading the replication log) → shape stream → every browser. A transaction
// id is the claim ticket that releases the optimistic overlay. Ends with the
// whole-book recap.
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
import { Connection, RequestFlow, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — the circuit.
// ---------------------------------------------------------------------------

const BROWSER = { x: 74, y: 128, w: 300, h: 260 } as const;
const OVERLAY = { x: 104, y: 196, w: 240, h: 44 } as const;
const BASEBOX = { x: 104, y: 270, w: 240, h: 84 } as const;

const API = { x: 648, y: 112 } as const;
const PG = { x: 1084, y: 128 } as const;
const ELECTRIC = { x: 1074, y: 400 } as const;

// the shape stream runs along the bottom of the diagram back to the browser
const STREAM_Y = 470;

const B2 = { x: 224, y: 500 } as const; // the second browser (payoff beat)

const TXID = 4207; // an xid the todo example's generateTxId would return

const CAM_BROWSER: CameraState = { x: 330, y: 280, k: 1.35 };
const CAM_SERVER: CameraState = { x: 840, y: 180, k: 1.35 };
const CAM_STREAM: CameraState = { x: 760, y: 420, k: 1.25 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.04 };

// The recap journey strip (book close).
const RECAP = [
  { label: 'load', sub: 'into collections' },
  { label: 'query', sub: 'pipelines, live' },
  { label: 'write', sub: 'optimistic overlay' },
  { label: 'sync', sub: 'truth catches up' },
];

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  topoU: ChannelRef<number>;
  elecU: ChannelRef<number>;
  initU: ChannelRef<number>;
  rowsU: ChannelRef<number>;
  wInsU: ChannelRef<number>;
  wReqU: ChannelRef<number>;
  txCapU: ChannelRef<number>;
  tickU: ChannelRef<number>;
  walU: ChannelRef<number>;
  streamU: ChannelRef<number>;
  matchU: ChannelRef<number>;
  dropU: ChannelRef<number>;
  b2U: ChannelRef<number>;
  b2StreamU: ChannelRef<number>;
  recapU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const topoU = tl.channel('topoU', 0); // browser + api + postgres
  const elecU = tl.channel('elecU', 0); // electric + log edge + stream edge
  const initU = tl.channel('initU', 0); // initial shape sync packet
  const rowsU = tl.channel('rowsU', 0); // synced rows appear in the base box
  const wInsU = tl.channel('wInsU', 0); // optimistic chip lands
  const wReqU = tl.channel('wReqU', 0); // post → api → response with txid
  const txCapU = tl.channel('txCapU', 0); // server captures the txid (flash)
  const tickU = tl.channel('tickU', 0); // the claim ticket held in the browser
  const walU = tl.channel('walU', 0); // change: postgres → electric
  const streamU = tl.channel('streamU', 0); // shape message → browser
  const matchU = tl.channel('matchU', 0); // tickets glow + match
  const dropU = tl.channel('dropU', 0); // overlay chip retires, synced row lands
  const b2U = tl.channel('b2U', 0); // second browser appears
  const b2StreamU = tl.channel('b2StreamU', 0); // same message to browser 2
  const recapU = tl.channel('recapU', 0); // the journey strip
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · hook —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'So far, your backend answered when asked. In production you can go one better: let the database itself push changes to every client.',
  });
  tl.tween(topoU, 1, { at: 0.8, dur: 1.8, ease: ease.draw });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the wiring —
  tl.caption({
    at: 7.0,
    dur: 7.5,
    text: 'Meet the production wiring. Your app server keeps its job — handling writes. Beside Postgres runs Electric, a sync engine that reads the database replication log.',
  });
  tl.tween(elecU, 1, { at: 8.4, dur: 1.6, ease: ease.draw });
  tl.hold(14.5, 0.5);

  // — Beat 3 · shapes —
  tl.caption({
    at: 15.0,
    dur: 7.0,
    text: 'You point a collection at a shape — a filtered slice of one table. Electric streams everything in that slice to the browser: the first load, and every change after it.',
  });
  tl.tween(initU, 1, { at: 16.2, dur: 2.4, ease: ease.linear });
  tl.tween(rowsU, 1, { at: 18.4, dur: 1.2, ease: ease.enter });
  tl.hold(22.0, 0.5);

  // — Beat 4 · the write —
  tl.caption({
    at: 22.5,
    dur: 6.0,
    text: 'A write starts exactly like before. The row lands in the optimistic layer, the screen updates, and a post goes out to your backend.',
  });
  tl.tween(cam, CAM_BROWSER, { at: 22.7, dur: 1.4, ease: ease.move });
  tl.tween(wInsU, 1, { at: 23.6, dur: 0.7, ease: ease.pop });
  tl.tween(wReqU, 0.45, { at: 24.8, dur: 1.6, ease: ease.linear });
  tl.hold(28.0, 0.5);

  // — Beat 5 · the server's one extra move —
  tl.caption({
    at: 28.5,
    dur: 7.5,
    text: 'Your server does one extra thing. Inside the insert transaction it asks Postgres for the transaction id, and it returns that number with the response.',
  });
  tl.tween(cam, CAM_SERVER, { at: 28.7, dur: 1.4, ease: ease.move });
  tl.tween(txCapU, 1, { at: 30.4, dur: 0.7, ease: ease.pop });
  tl.tween(wReqU, 1, { at: 32.6, dur: 1.6, ease: ease.linear });
  tl.tween(tickU, 1, { at: 34.4, dur: 0.6, ease: ease.pop });
  tl.hold(35.5, 0.5);

  // — Beat 6 · the claim ticket —
  tl.caption({
    at: 36.0,
    dur: 6.5,
    text: 'That number is a claim ticket. The client keeps its optimistic row on screen and simply waits for the same transaction id to appear in the stream.',
  });
  tl.tween(cam, CAM_BROWSER, { at: 36.2, dur: 1.4, ease: ease.move });
  tl.hold(42.0, 0.5);

  // — Beat 7 · the match —
  tl.caption({
    at: 42.5,
    dur: 8.0,
    text: 'Moments later the change flows out of the replication log, through Electric, into the shape stream — carrying its transaction id. Ticket matched: the overlay swaps for synced truth.',
  });
  tl.tween(cam, CAM_STREAM, { at: 42.7, dur: 1.5, ease: ease.move });
  tl.tween(walU, 1, { at: 43.4, dur: 1.4, ease: ease.linear });
  tl.tween(streamU, 1, { at: 45.0, dur: 2.0, ease: ease.linear });
  tl.tween(matchU, 1, { at: 47.2, dur: 0.6, ease: ease.pop });
  tl.tween(dropU, 1, { at: 48.4, dur: 1.0, ease: ease.move });
  tl.hold(50.5, 0.5);

  // — Beat 8 · why the ceremony —
  tl.caption({
    at: 51.0,
    dur: 7.0,
    text: 'Why the ceremony? Without the ticket, the optimistic row would be dropped before its synced copy arrived, and the screen would blink. The ticket makes the swap seamless.',
  });
  tl.tween(matchU, 0, { at: 56.5, dur: 0.8, ease: ease.enter });
  tl.hold(57.5, 0.5);

  // — Beat 9 · multiplayer —
  tl.caption({
    at: 58.0,
    dur: 7.5,
    text: 'And here is the payoff: every other browser subscribed to that shape gets the same message. Their live queries update in the same breath. Multiplayer, and you wrote none of it.',
  });
  tl.tween(cam, CAM_WIDE, { at: 58.2, dur: 1.4, ease: ease.move });
  tl.tween(b2U, 1, { at: 59.0, dur: 0.9, ease: ease.enter });
  tl.tween(b2StreamU, 1, { at: 60.2, dur: 1.8, ease: ease.linear });
  tl.hold(65.5, 0.5);

  // — Beat 10 · the recap —
  tl.caption({
    at: 66.0,
    dur: 8.5,
    text: 'And that is the whole machine. Load your data once, into collections. Query them with pipelines that never re-run. Write into an overlay the interface can trust instantly.',
  });
  tl.tween(closeU, 1, { at: 67.0, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 3, { at: 68.4, dur: 3.2, ease: ease.enter });
  tl.hold(74.5, 0.3);

  // — Beat 11 · the last word —
  tl.caption({
    at: 74.8,
    dur: 6.5,
    text: 'Then let sync settle the truth — a refetch in the simple case, a pushed transaction id in the fancy one. The interface never waits, and the truth always arrives.',
  });
  tl.tween(recapU, 4, { at: 75.6, dur: 1.0, ease: ease.enter });
  tl.hold(81.3, 1.5);

  return {
    tl,
    cam,
    topoU,
    elecU,
    initU,
    rowsU,
    wInsU,
    wReqU,
    txCapU,
    tickU,
    walU,
    streamU,
    matchU,
    dropU,
    b2U,
    b2StreamU,
    recapU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function TicketTag({ x, y, u, glow, label }: { x: number; y: number; u: number; glow: number; label: string }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      {glow > 0.02 && <rect x={x - 44} y={y - 15} width={88} height={30} rx={8} fill={colors.WARM} opacity={0.3 * glow} />}
      <rect x={x - 39} y={y - 11} width={78} height={22} rx={6} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
      <text x={x} y={y + 4} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily="ui-monospace, monospace">
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const topoU = s.get(scene.topoU);
  const elecU = s.get(scene.elecU);
  const initU = s.get(scene.initU);
  const rowsU = s.get(scene.rowsU);
  const wInsU = s.get(scene.wInsU);
  const wReqU = s.get(scene.wReqU);
  const txCapU = s.get(scene.txCapU);
  const tickU = s.get(scene.tickU);
  const walU = s.get(scene.walU);
  const streamU = s.get(scene.streamU);
  const matchU = s.get(scene.matchU);
  const dropU = s.get(scene.dropU);
  const b2U = s.get(scene.b2U);
  const b2StreamU = s.get(scene.b2StreamU);
  const recapU = s.get(scene.recapU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.9;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the browser ---- */}
          <Zone x={BROWSER.x} y={BROWSER.y} w={BROWSER.w} h={BROWSER.h} label="the browser" kind="group" u={topoU} color={colors.ACCENT} />
          <g opacity={topoU}>
            {/* optimistic strip */}
            <rect x={OVERLAY.x} y={OVERLAY.y} width={OVERLAY.w} height={OVERLAY.h} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} opacity={0.8} />
            <text x={OVERLAY.x + 4} y={OVERLAY.y - 8} fill={colors.WARM} fontSize={10.5} fontFamily="ui-monospace, monospace">
              optimistic layer
            </text>
            {/* synced base */}
            <rect x={BASEBOX.x} y={BASEBOX.y} width={BASEBOX.w} height={BASEBOX.h} rx={9} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
            <text x={BASEBOX.x + 4} y={BASEBOX.y + BASEBOX.h + 16} fill={colors.ACCENT} fontSize={10.5} fontFamily="ui-monospace, monospace">
              synced · electricCollectionOptions
            </text>
            {/* synced rows */}
            {[0, 1, 2].map((i) => (
              <rect key={i} x={BASEBOX.x + 14 + i * 74} y={BASEBOX.y + 14} width={62} height={24} rx={6} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.1} opacity={clamp01(rowsU * 3 - i)} />
            ))}
            {/* the confirmed write, landing in the base */}
            {dropU > 0.02 && (
              <g opacity={dropU}>
                <rect x={BASEBOX.x + 14} y={BASEBOX.y + 48} width={62} height={24} rx={6} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.4} />
                <text x={BASEBOX.x + 45} y={BASEBOX.y + 64} textAnchor="middle" fill={colors.POSITIVE} fontSize={9.5} fontFamily="ui-monospace, monospace">
                  synced
                </text>
              </g>
            )}
            {/* the optimistic chip */}
            {wInsU > 0.02 && dropU < 1 && (
              <g opacity={wInsU * (1 - dropU)}>
                <rect x={OVERLAY.x + 14} y={OVERLAY.y + 8} width={82} height={28} rx={7} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
                <text x={OVERLAY.x + 55} y={OVERLAY.y + 26} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily="ui-monospace, monospace">
                  new todo
                </text>
              </g>
            )}
            {/* the held claim ticket */}
            <TicketTag x={OVERLAY.x + 178} y={OVERLAY.y + 22} u={tickU} glow={matchU} label={`txid ${TXID}`} />
            {tickU > 0.5 && matchU < 0.02 && dropU < 0.02 && (
              <text x={OVERLAY.x + 178} y={OVERLAY.y + 48} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily="ui-monospace, monospace">
                awaitTxId — waiting…
              </text>
            )}
          </g>

          {/* ---- your api ---- */}
          <ServiceNode x={API.x} y={API.y} kind="server" label="your backend" sublabel="handles writes" w={150} u={topoU} glow={txCapU * 0.8} />
          {txCapU > 0.02 && (
            <g opacity={txCapU}>
              <rect x={API.x - 118} y={API.y + 44} width={236} height={26} rx={7} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.2} />
              <text x={API.x} y={API.y + 61} textAnchor="middle" fill={colors.WARM} fontSize={10} fontFamily="ui-monospace, monospace">
                SELECT pg_current_xact_id()::xid
              </text>
            </g>
          )}

          {/* ---- postgres ---- */}
          <ServiceNode x={PG.x} y={PG.y} kind="db" label="Postgres" sublabel="the truth" w={140} u={topoU} />
          <Connection from={{ x: API.x + 75, y: API.y }} to={{ x: PG.x - 70, y: PG.y }} u={topoU} color={colors.GRID} width={1.4} arrow label="writes" labelSize={10} />

          {/* ---- electric ---- */}
          <ServiceNode x={ELECTRIC.x} y={ELECTRIC.y} kind="external" label="Electric" sublabel="sync engine" w={150} u={elecU} />
          <Connection from={{ x: PG.x, y: PG.y + 32 }} to={{ x: ELECTRIC.x, y: ELECTRIC.y - 32 }} u={elecU} color={colors.SECONDARY} width={1.4} arrow label="replication log" labelSize={10} />
          {/* the shape stream back to the browser(s) */}
          <Connection
            from={{ x: ELECTRIC.x - 75, y: ELECTRIC.y + 10 }}
            to={{ x: BROWSER.x + BROWSER.w - 40, y: BROWSER.y + BROWSER.h }}
            via={[{ x: 640, y: STREAM_Y }]}
            u={elecU}
            color={colors.POSITIVE}
            width={1.5}
            arrow
            label="shape stream"
            labelSize={10}
          />

          {/* initial shape sync */}
          {initU > 0 && initU < 1 && (
            <RequestFlow
              path={[
                { x: ELECTRIC.x - 75, y: ELECTRIC.y + 10 },
                { x: 640, y: STREAM_Y },
                { x: BROWSER.x + BROWSER.w - 40, y: BROWSER.y + BROWSER.h },
              ]}
              u={initU}
              color={colors.POSITIVE}
              r={7}
              label="the shape, row by row"
            />
          )}

          {/* the write round trip (ticket comes back) */}
          {wReqU > 0 && wReqU < 1 && (
            <RequestFlow
              path={[
                { x: BROWSER.x + BROWSER.w, y: OVERLAY.y + 20 },
                { x: API.x - 75, y: API.y + 10 },
              ]}
              u={wReqU}
              roundTrip
              color={colors.WARM}
              r={6}
              label="insert"
              responseLabel={`{ txid: ${TXID} }`}
            />
          )}

          {/* the change flowing pg → electric → browser, tagged with the txid */}
          {walU > 0 && walU < 1 && (
            <RequestFlow path={[{ x: PG.x, y: PG.y + 32 }, { x: ELECTRIC.x, y: ELECTRIC.y - 32 }]} u={walU} color={colors.SECONDARY} r={6} label={`commit · txid ${TXID}`} />
          )}
          {streamU > 0 && streamU < 1 && (
            <RequestFlow
              path={[
                { x: ELECTRIC.x - 75, y: ELECTRIC.y + 10 },
                { x: 640, y: STREAM_Y },
                { x: BROWSER.x + BROWSER.w - 40, y: BROWSER.y + BROWSER.h },
              ]}
              u={streamU}
              color={colors.POSITIVE}
              r={7}
              label={`headers.txids: [${TXID}]`}
            />
          )}

          {/* ---- the second browser ---- */}
          <g opacity={b2U}>
            <ServiceNode x={B2.x} y={B2.y} kind="browser" label="another browser" sublabel="same shape" w={170} u={b2U} glow={b2StreamU >= 1 ? 0.7 : 0} />
            {b2StreamU >= 1 && (
              <text x={B2.x} y={B2.y + 52} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} opacity={b2U}>
                live queries update here too
              </text>
            )}
          </g>
          {b2StreamU > 0 && b2StreamU < 1 && (
            <RequestFlow path={[{ x: 640, y: STREAM_Y }, { x: B2.x + 90, y: B2.y }]} u={b2StreamU} color={colors.POSITIVE} r={6} />
          )}
        </g>

        {/* ---- the recap / closing panel ---- */}
        <g opacity={closeU}>
          <rect x={230} y={186} width={820} height={300} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={238} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
            the reactive client store for your app
          </text>
          {RECAP.map((r, i) => {
            const u = clamp01(recapU - i);
            const x = 285 + i * 190;
            return (
              <g key={r.label} opacity={u}>
                <rect x={x} y={280} width={165} height={110} rx={12} fill={colors.BG} stroke={[colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE][i]} strokeWidth={1.5} />
                <text x={x + 82} y={326} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
                  {r.label}
                </text>
                <text x={x + 82} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                  {r.sub}
                </text>
                {i < 3 && u >= 1 && (
                  <text x={x + 178} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={16} opacity={clamp01(recapU - i - 0.8)}>
                    →
                  </text>
                )}
              </g>
            );
          })}
          <text x={640} y={438} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, monospace">
            @tanstack/db — the interface never waits; the truth always arrives
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
