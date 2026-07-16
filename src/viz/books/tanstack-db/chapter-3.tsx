// Optimistic Writes — the two-layer store
//
// Backed by: packages/db/src/collection/state.ts (CollectionStateManager:
// syncedData SortedMap + optimisticUpserts Map + optimisticDeletes Set; get()
// checks deletes → upserts → syncedData; recomputeOptimisticState re-applies
// live transactions; commitPendingTransactions clears matching optimistic
// entries so synced data wins), packages/db/src/transactions.ts (pending →
// persisting → completed | failed; mutationFn; rollback cascade across
// transactions sharing a globalKey `KEY::<collection>/<key>`), and
// packages/db/src/collection/mutations.ts (insert/update/delete build
// PendingMutations and call onInsert/onUpdate/onDelete). ONE machine: the
// collection as two stacked translucent planes — synced truth below, optimism
// above — with the component's list on the right showing the flattened view.
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
import { RequestFlow, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Layout — two skewed planes (overlay above, base below), composite list right,
// transaction card left, server top-right.
// ---------------------------------------------------------------------------

const SK = 40; // parallelogram skew
const OVER = { x: 330, y: 188, w: 380, h: 92 } as const;
const BASE = { x: 330, y: 368, w: 380, h: 118 } as const;

const planePts = (p: { x: number; y: number; w: number; h: number }): string =>
  `${p.x + SK},${p.y} ${p.x + p.w + SK},${p.y} ${p.x + p.w},${p.y + p.h} ${p.x},${p.y + p.h}`;

// Six confirmed rows on the base plane (2 rows × 3 cols).
const baseSlot = (i: number) => ({
  x: BASE.x + 34 + (i % 3) * 118 + (i < 3 ? SK * 0.55 : SK * 0.18),
  y: BASE.y + 18 + Math.floor(i / 3) * 50,
});
// Overlay slots: the inserted row and the edited row.
const OVER_INS = { x: OVER.x + 62 + SK * 0.4, y: OVER.y + 34 };
const OVER_UPD = { x: OVER.x + 232 + SK * 0.4, y: OVER.y + 34 };

const ROW_W = 96;
const ROW_H = 30;

// The component's list (the flattened view).
const LIST = { x: 856, y0: 200, w: 250, rowH: 38 } as const;

// The transaction card.
const TX = { x: 64, y: 236, w: 190, h: 168 } as const;
const TX_STATES = ['pending', 'persisting', 'completed', 'failed'] as const;

const SERVER = { x: 1116, y: 96 } as const;

const CAM_PLANES: CameraState = { x: 560, y: 320, k: 1.28 };
const CAM_TX: CameraState = { x: 350, y: 300, k: 1.42 };
const CAM_LIST: CameraState = { x: 880, y: 300, k: 1.45 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.05 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  baseU: ChannelRef<number>;
  overU: ChannelRef<number>;
  rowsU: ChannelRef<number>;
  ruleU: ChannelRef<number>;
  insU: ChannelRef<number>;
  txU: ChannelRef<number>;
  txState: ChannelRef<number>;
  reqU: ChannelRef<number>;
  syncRowU: ChannelRef<number>;
  dropU: ChannelRef<number>;
  flagU: ChannelRef<number>;
  updU: ChannelRef<number>;
  tx2State: ChannelRef<number>;
  req2U: ChannelRef<number>;
  failU: ChannelRef<number>;
  rbU: ChannelRef<number>;
  cascU: ChannelRef<number>;
  cascFailU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const baseU = tl.channel('baseU', 0); // synced plane
  const overU = tl.channel('overU', 0); // optimistic plane
  const rowsU = tl.channel('rowsU', 0); // confirmed rows stagger in
  const ruleU = tl.channel('ruleU', 0); // the get() read-rule card
  const insU = tl.channel('insU', 0); // insert chip lands on overlay
  const txU = tl.channel('txU', 0); // transaction card appears
  const txState = tl.channel('txState', 0); // 0 pending → 1 persisting → 2 completed
  const reqU = tl.channel('reqU', 0); // mutationFn round trip
  const syncRowU = tl.channel('syncRowU', 0); // confirmed row lands on base
  const dropU = tl.channel('dropU', 0); // overlay chip evaporates
  const flagU = tl.channel('flagU', 0); // $synced flips true
  const updU = tl.channel('updU', 0); // the doomed update lands on overlay
  const tx2State = tl.channel('tx2State', 0); // second tx: 0 pending → 1 persisting → 3 failed
  const req2U = tl.channel('req2U', 0); // its round trip
  const failU = tl.channel('failU', 0); // server rejection flash
  const rbU = tl.channel('rbU', 0); // rollback peel
  const cascU = tl.channel('cascU', 0); // cascade vignette appears
  const cascFailU = tl.channel('cascFailU', 0); // both cascade cards fail
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · hook —
  tl.caption({
    at: 0.5,
    dur: 7.0,
    text: 'Tap a checkbox in a well-built app and something suspicious happens: the screen updates before any server could possibly have answered. This is the machinery behind that.',
  });
  tl.tween(baseU, 1, { at: 1.0, dur: 1.2, ease: ease.draw });
  tl.tween(rowsU, 1, { at: 1.8, dur: 1.4, ease: ease.enter });
  tl.hold(7.5, 0.5);

  // — Beat 2 · two layers —
  tl.caption({
    at: 8.0,
    dur: 7.5,
    text: 'A collection is really two layers. The bottom layer holds synced truth — rows your backend has confirmed. The top layer holds your optimism: writes that have not been confirmed yet.',
  });
  tl.tween(cam, CAM_PLANES, { at: 8.2, dur: 1.5, ease: ease.move });
  tl.tween(overU, 1, { at: 9.4, dur: 1.2, ease: ease.enter });
  tl.hold(15.5, 0.5);

  // — Beat 3 · the read rule —
  tl.caption({
    at: 16.0,
    dur: 7.0,
    text: 'Every read looks down through both. A row written up top wins. A row deleted up top is gone. Otherwise, you see the synced row underneath.',
  });
  tl.tween(ruleU, 1, { at: 16.6, dur: 0.9, ease: ease.enter });
  tl.hold(23.0, 0.5);

  // — Beat 4 · insert lands up top —
  tl.caption({
    at: 23.5,
    dur: 7.0,
    text: 'So when you insert a todo, it lands in the top layer and nowhere else. The list re-renders in the same frame — the network has not even been dialed yet.',
  });
  tl.tween(insU, 1, { at: 24.6, dur: 0.8, ease: ease.pop });
  // the read-rule card has served its purpose — fade it to a whisper
  tl.tween(ruleU, 0.13, { at: 29.4, dur: 1.0, ease: ease.move });
  tl.hold(30.5, 0.5);

  // — Beat 5 · the transaction —
  tl.caption({
    at: 31.0,
    dur: 7.0,
    text: 'Behind the scenes that write opened a transaction. It starts out pending, and on commit your mutation function carries the change to the server.',
  });
  tl.tween(cam, CAM_TX, { at: 31.2, dur: 1.4, ease: ease.move });
  tl.tween(txU, 1, { at: 31.8, dur: 0.8, ease: ease.enter });
  tl.set(txState, 1, 35.2);
  tl.tween(reqU, 0.5, { at: 35.4, dur: 1.6, ease: ease.linear });
  tl.hold(38.0, 0.5);

  // — Beat 6 · persisting, but nobody waits —
  tl.caption({
    at: 38.5,
    dur: 5.5,
    text: 'While the request is out, the transaction sits in persisting. The interface is not waiting — it is already showing the new row.',
  });
  tl.hold(44.0, 0.5);

  // — Beat 7 · synced data wins —
  tl.caption({
    at: 44.5,
    dur: 7.5,
    text: 'The server says yes, and the row syncs back into the bottom layer. Then the rule fires: synced data wins, so the optimistic copy up top simply evaporates.',
  });
  tl.tween(cam, CAM_PLANES, { at: 44.7, dur: 1.4, ease: ease.move });
  tl.tween(reqU, 1, { at: 45.0, dur: 1.6, ease: ease.linear });
  tl.set(txState, 2, 46.8);
  tl.tween(syncRowU, 1, { at: 47.0, dur: 0.9, ease: ease.enter });
  tl.tween(dropU, 1, { at: 48.2, dur: 1.0, ease: ease.move });
  tl.hold(51.5, 0.5);

  // — Beat 8 · the seamless swap —
  tl.caption({
    at: 52.0,
    dur: 6.5,
    text: 'Watch the list during that swap: nothing moves. Only a hidden flag flips — the row now reads as synced instead of optimistic.',
  });
  tl.tween(cam, CAM_LIST, { at: 52.2, dur: 1.4, ease: ease.move });
  tl.tween(flagU, 1, { at: 54.0, dur: 0.7, ease: ease.pop });
  tl.hold(58.0, 0.5);

  // — Beat 9 · the other ending —
  tl.caption({
    at: 58.5,
    dur: 5.5,
    text: 'Now the other ending. An edit goes out the same way — but this time the server says no.',
  });
  tl.tween(cam, CAM_WIDE, { at: 58.7, dur: 1.4, ease: ease.move });
  tl.tween(updU, 1, { at: 59.4, dur: 0.7, ease: ease.pop });
  tl.set(tx2State, 1, 60.6);
  tl.tween(req2U, 1, { at: 60.8, dur: 2.2, ease: ease.linear });
  tl.tween(failU, 1, { at: 63.1, dur: 0.4, ease: ease.pop });
  tl.hold(63.5, 0.5);

  // — Beat 10 · rollback —
  tl.caption({
    at: 64.0,
    dur: 7.5,
    text: 'The transaction fails, and the top layer is rebuilt from the transactions still alive. The rejected write vanishes, and the list falls back to the synced truth underneath.',
  });
  tl.set(tx2State, 3, 64.8);
  tl.tween(rbU, 1, { at: 65.2, dur: 1.1, ease: ease.move });
  tl.tween(failU, 0, { at: 67.0, dur: 0.8, ease: ease.enter });
  tl.hold(71.0, 0.5);

  // — Beat 11 · the cascade —
  tl.caption({
    at: 71.5,
    dur: 7.5,
    text: 'One more safety. If two pending transactions touched the same row, rolling back one rolls back the other. They share a key, so their stories cannot be untangled.',
  });
  tl.tween(cascU, 1, { at: 72.4, dur: 0.9, ease: ease.enter });
  tl.tween(cascFailU, 1, { at: 76.2, dur: 0.7, ease: ease.pop });
  tl.hold(78.5, 0.5);

  // — Beat 12 · close —
  tl.caption({
    at: 79.0,
    dur: 6.5,
    text: 'That is an optimistic write: the interface never waits, and the truth always catches up — one way or the other.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 79.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 80.0, dur: 1.3, ease: ease.move });
  tl.hold(85.0, 1.4);

  return {
    tl,
    cam,
    baseU,
    overU,
    rowsU,
    ruleU,
    insU,
    txU,
    txState,
    reqU,
    syncRowU,
    dropU,
    flagU,
    updU,
    tx2State,
    req2U,
    failU,
    rbU,
    cascU,
    cascFailU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function RowChip({ x, y, color, label, u, evaporate = 0 }: { x: number; y: number; color: string; label: string; u: number; evaporate?: number }) {
  if (u <= 0.01 || evaporate >= 1) return null;
  const scale = 1 + evaporate * 0.35;
  const o = u * (1 - evaporate);
  return (
    <g opacity={o} transform={`translate(${x + ROW_W / 2}, ${y + ROW_H / 2}) scale(${scale}) translate(${-(x + ROW_W / 2)}, ${-(y + ROW_H / 2)})`}>
      <rect x={x} y={y} width={ROW_W} height={ROW_H} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text x={x + ROW_W / 2} y={y + ROW_H / 2 + 4} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily="ui-monospace, monospace">
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const baseU = s.get(scene.baseU);
  const overU = s.get(scene.overU);
  const rowsU = s.get(scene.rowsU);
  const ruleU = s.get(scene.ruleU);
  const insU = s.get(scene.insU);
  const txU = s.get(scene.txU);
  const txState = Math.round(s.get(scene.txState));
  const reqU = s.get(scene.reqU);
  const syncRowU = s.get(scene.syncRowU);
  const dropU = s.get(scene.dropU);
  const flagU = s.get(scene.flagU);
  const updU = s.get(scene.updU);
  const tx2State = Math.round(s.get(scene.tx2State));
  const req2U = s.get(scene.req2U);
  const failU = s.get(scene.failU);
  const rbU = s.get(scene.rbU);
  const cascU = s.get(scene.cascU);
  const cascFailU = s.get(scene.cascFailU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;

  // What the flattened list shows right now (pure function of channels):
  // 6 synced rows, +1 inserted row (optimistic until flag flips), row 2 edited
  // while updU is up and rbU hasn't peeled it.
  const insertedVisible = insU > 0.5;
  const editVisible = updU > 0.5 && rbU < 0.5;

  const listRows: Array<{ label: string; state: 'synced' | 'optimistic' | 'edited' }> = [];
  for (let i = 0; i < 4; i++) {
    listRows.push({
      label: i === 1 && editVisible ? 'todo 2 · urgent' : `todo ${i + 1}`,
      state: i === 1 && editVisible ? 'edited' : 'synced',
    });
  }
  if (insertedVisible) {
    listRows.push({ label: 'feed the beaver', state: flagU > 0.5 ? 'synced' : 'optimistic' });
  }

  const txColor = (st: number): string => (st === 3 ? colors.NEGATIVE : st === 2 ? colors.POSITIVE : st === 1 ? colors.WARM : colors.ACCENT);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- server ---- */}
        <g opacity={dimAll}>
          <ServiceNode x={SERVER.x} y={SERVER.y} kind="server" label="your backend" w={140} u={baseU} />
        </g>

        {/* ---- the two planes ---- */}
        <g opacity={dimAll}>
          {/* base: synced truth */}
          <g opacity={baseU}>
            <polygon points={planePts(BASE)} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} opacity={0.92} />
            <text x={BASE.x + 8} y={BASE.y + BASE.h + 22} fill={colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace">
              syncedData · SortedMap — confirmed by sync
            </text>
            {[0, 1, 2, 3, 4].map((i) => {
              const p = baseSlot(i);
              return <RowChip key={i} x={p.x} y={p.y} color={colors.GRID} label={`todo ${i + 1}`} u={clamp01(rowsU * 5 - i)} />;
            })}
            {/* the confirmed insert, arriving from sync */}
            <RowChip x={baseSlot(5).x} y={baseSlot(5).y} color={colors.POSITIVE} label="feed beaver" u={syncRowU} />
          </g>

          {/* overlay: optimistic state */}
          <g opacity={overU}>
            <polygon points={planePts(OVER)} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} opacity={0.62} />
            <text x={OVER.x + 8} y={OVER.y - 12} fill={colors.WARM} fontSize={12} fontFamily="ui-monospace, monospace">
              optimisticUpserts · optimisticDeletes — not confirmed yet
            </text>
            {/* the inserted row, then its evaporation once synced data wins */}
            <RowChip x={OVER_INS.x} y={OVER_INS.y} color={colors.WARM} label="feed beaver" u={insU} evaporate={dropU} />
            {/* the doomed edit, peeled off on rollback */}
            <RowChip x={OVER_UPD.x} y={OVER_UPD.y} color={colors.NEGATIVE} label="todo 2 · urgent" u={updU} evaporate={rbU} />
          </g>

          {/* look-through arrow between planes */}
          <g opacity={overU * 0.9}>
            <line x1={OVER.x + OVER.w + SK + 18} y1={OVER.y + 10} x2={BASE.x + BASE.w + 14} y2={BASE.y + 30} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="5 5" />
            <text x={OVER.x + OVER.w + SK + 24} y={(OVER.y + BASE.y) / 2 + 16} fill={colors.MUTED} fontSize={10.5} fontStyle="italic">
              reads look
            </text>
            <text x={OVER.x + OVER.w + SK + 24} y={(OVER.y + BASE.y) / 2 + 30} fill={colors.MUTED} fontSize={10.5} fontStyle="italic">
              down through
            </text>
          </g>
        </g>

        {/* ---- the read-rule card ---- */}
        <g opacity={ruleU * dimAll}>
          <rect x={64} y={452} width={330} height={116} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
          <text x={80} y={478} fill={colors.TEXT} fontSize={12.5}>
            the read rule, top to bottom
          </text>
          {[
            ['deleted up top?', 'the row is gone', colors.NEGATIVE],
            ['written up top?', 'that copy wins', colors.WARM],
            ['otherwise', 'the synced row below', colors.ACCENT],
          ].map(([q, a, c], i) => (
            <g key={i}>
              <circle cx={92} cy={498 + i * 22} r={3.4} fill={c as string} />
              <text x={106} y={502 + i * 22} fill={colors.MUTED} fontSize={11.5}>
                {q} <tspan fill={colors.TEXT}>{a}</tspan>
              </text>
            </g>
          ))}
        </g>

        {/* ---- transaction card 1 (the insert) ---- */}
        <g opacity={txU * dimAll}>
          <rect x={TX.x} y={TX.y} width={TX.w} height={TX.h} rx={12} fill={colors.PANEL} stroke={txColor(txState)} strokeWidth={1.5} />
          <text x={TX.x + 14} y={TX.y + 26} fill={colors.TEXT} fontSize={13}>
            the transaction
          </text>
          <text x={TX.x + 14} y={TX.y + 44} fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
            mutationFn · onInsert
          </text>
          {TX_STATES.map((st, i) => {
            const active = txState === i || (txState === 3 && i === 3);
            const passed = txState > i && !(txState === 3 && i === 2);
            const skip = txState !== 3 && i === 3; // happy path never shows failed
            if (skip && !active) return null;
            return (
              <g key={st}>
                <circle cx={TX.x + 26} cy={TX.y + 68 + i * 24} r={5} fill={active ? txColor(i === 3 ? 3 : i) : 'none'} stroke={passed || active ? txColor(i === 3 ? 3 : i) : colors.GRID} strokeWidth={1.4} />
                <text x={TX.x + 42} y={TX.y + 72 + i * 24} fill={active ? colors.TEXT : colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
                  {st}
                </text>
              </g>
            );
          })}
        </g>

        {/* ---- mutationFn round trips ---- */}
        {reqU > 0 && reqU < 1 && (
          <RequestFlow
            path={[
              { x: TX.x + TX.w, y: TX.y + 40 },
              { x: SERVER.x - 70, y: SERVER.y + 10 },
            ]}
            u={reqU}
            roundTrip
            color={colors.WARM}
            responseColor={colors.POSITIVE}
            r={6}
            label="the change"
            responseLabel="confirmed"
          />
        )}
        {req2U > 0 && req2U < 1 && (
          <RequestFlow
            path={[
              { x: OVER_UPD.x + ROW_W, y: OVER_UPD.y - 10 },
              { x: SERVER.x - 70, y: SERVER.y + 24 },
            ]}
            u={req2U}
            roundTrip
            color={colors.WARM}
            responseColor={colors.NEGATIVE}
            r={6}
            responseLabel="rejected"
          />
        )}
        {failU > 0.02 && (
          <g opacity={failU}>
            <circle cx={SERVER.x - 84} cy={SERVER.y + 24} r={13} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
            <text x={SERVER.x - 84} y={SERVER.y + 29} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14}>
              ✕
            </text>
          </g>
        )}
        {rbU > 0.02 && rbU < 0.98 && (
          <text x={OVER.x + OVER.w - 40} y={OVER.y - 34} textAnchor="end" fill={colors.NEGATIVE} fontSize={11} fontFamily="ui-monospace, monospace" opacity={1 - rbU * 0.6}>
            rollback → recomputeOptimisticState
          </text>
        )}

        {/* ---- the component's flattened list ---- */}
        <g opacity={dimAll * clamp01(baseU * 1.4)}>
          <text x={LIST.x} y={LIST.y0 - 34} fill={colors.TEXT} fontSize={14}>
            what the screen sees
          </text>
          <text x={LIST.x} y={LIST.y0 - 14} fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
            useLiveQuery — the flattened view
          </text>
          {listRows.map((r, i) => {
            const c = r.state === 'optimistic' ? colors.WARM : r.state === 'edited' ? colors.NEGATIVE : colors.GRID;
            return (
              <g key={i}>
                <rect x={LIST.x} y={LIST.y0 + i * LIST.rowH} width={LIST.w} height={LIST.rowH - 8} rx={7} fill={colors.PANEL} stroke={c} strokeWidth={r.state === 'synced' ? 1 : 1.6} />
                <text x={LIST.x + 14} y={LIST.y0 + i * LIST.rowH + 19} fill={colors.TEXT} fontSize={12}>
                  {r.label}
                </text>
                {r.state === 'optimistic' && (
                  <text x={LIST.x + LIST.w - 12} y={LIST.y0 + i * LIST.rowH + 19} textAnchor="end" fill={colors.WARM} fontSize={9.5} fontFamily="ui-monospace, monospace">
                    $synced: false
                  </text>
                )}
                {i === listRows.length - 1 && insertedVisible && flagU > 0.5 && (
                  <text x={LIST.x + LIST.w - 12} y={LIST.y0 + i * LIST.rowH + 19} textAnchor="end" fill={colors.POSITIVE} fontSize={9.5} fontFamily="ui-monospace, monospace" opacity={flagU}>
                    $synced: true
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* ---- the cascade vignette ---- */}
        <g opacity={cascU * dimAll}>
          {[0, 1].map((i) => {
            const x = 505 + i * 240;
            const failed = cascFailU > 0.5;
            return (
              <g key={i}>
                <rect x={x} y={506} width={210} height={58} rx={10} fill={colors.PANEL} stroke={failed ? colors.NEGATIVE : colors.WARM} strokeWidth={1.4} />
                <text x={x + 14} y={528} fill={colors.TEXT} fontSize={11.5}>
                  {i === 0 ? 'transaction A · update' : 'transaction B · delete'}
                </text>
                <text x={x + 14} y={548} fill={failed ? colors.NEGATIVE : colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
                  {failed ? 'failed (cascade)' : 'pending'}
                </text>
              </g>
            );
          })}
          <rect x={648} y={470} width={164} height={24} rx={12} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.2} />
          <text x={730} y={486} textAnchor="middle" fill={colors.SECONDARY} fontSize={10.5} fontFamily="ui-monospace, monospace">
            KEY::todos/3 — shared
          </text>
          <line x1={640} y1={494} x2={610} y2={506} stroke={colors.SECONDARY} strokeWidth={1.1} />
          <line x1={790} y1={494} x2={850} y2={506} stroke={colors.SECONDARY} strokeWidth={1.1} />
        </g>

        {/* ---- quiet closing panel ---- */}
        <g opacity={closeU}>
          <rect x={310} y={210} width={660} height={240} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={258} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the interface never waits
          </text>
          <text x={640} y={304} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
            writes land in the optimistic layer in the same frame
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
            a transaction carries them to the server behind the scenes
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
            confirmed rows sink into synced truth · rejected rows vanish
          </text>
          <text x={640} y={408} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, monospace">
            pending → persisting → completed | failed
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
