// Queries Drive the Sync
//
// Backing: packages/zql/src/query/query.ts (Query.where/.orderBy/.limit —
// example at query.ts:218), packages/zql/src/ivm/ (filter.ts, join.ts,
// take.ts — the incremental view maintenance operators),
// packages/zero-protocol/src/change-desired-queries.ts
// ('changeDesiredQueries'), src/poke.ts ('pokeStart'/'pokePart'/'pokeEnd',
// pokePart.rowsPatch), packages/zero-cache/src/services/view-syncer/
// {view-syncer.ts, cvr.ts, cvr-store.ts, client-handler.ts} (the client view
// record — CVR tables queries/desires/rows in ZERO_CVR_DB Postgres).
//
// Machine: the query as a STENCIL. The replica is a wall of dim rows; the
// client's query rises to zero-cache, registers as a standing order, and a
// stencil sweeps the wall — exactly the matching rows shine through and
// stream to the device. A ledger (the client view record) writes down every
// row the client now holds. When one new row lands from the tape, the
// standing query catches it and ships ONLY the diff as a three-part poke.
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
import { Connection, Packet, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout. Captions own y ≳ 630.
// ---------------------------------------------------------------------------

// the replica wall: every cell is a row of the issue table
// the wall is centred in the zone (zone centre x = 779, wall centre x = 779)
const GRID = { x0: 424, y0: 118, cols: 16, rows: 8, cw: 46, ch: 36, w: 40, h: 28 } as const;
const ZONE = { x: 366, y: 76, w: 826, h: 372 } as const;
const DEVICE = { x: 168, y: 500 };
const LEDGER = { x: 880, y: 470, w: 360, h: 148 } as const;
const TAPE_IN = { x: 320, y: 250 }; // where chapter 2's tape enters

// the query, broken over two lines so the chip reads at full size
const QUERY_LINES = ["z.query.issue.where('status', 'open')", '.limit(20)'];

// which rows match the query — 20 cells, seeded
const rand = mulberry32(20260716);
const N_CELLS = GRID.cols * GRID.rows;
const MATCHES: number[] = (() => {
  const set = new Set<number>();
  while (set.size < 20) set.add(Math.floor(rand() * N_CELLS));
  return [...set].sort((a, b) => a - b);
})();
const MATCH_SET = new Set(MATCHES);
// the row that arrives later from the tape — a cell that wasn't a match
const NEW_CELL = (() => {
  let i = 37;
  while (MATCH_SET.has(i)) i++;
  return i;
})();

const cellPos = (i: number) => ({
  x: GRID.x0 + (i % GRID.cols) * GRID.cw,
  y: GRID.y0 + Math.floor(i / GRID.cols) * GRID.ch,
});

// six representative packets for the row stream (targets among MATCHES)
const STREAMERS = MATCHES.filter((_, k) => k % 4 === 0).slice(0, 6);

// each framing keeps the device, the wall and the ledger inside the stage and above the caption (y < 630)
const CAM_GRID: CameraState = { x: 655, y: 360, k: 1.05 };
const CAM_LEDGER: CameraState = { x: 662, y: 395, k: 1.05 };
// the close-up on the new row keeps the whole wall in frame; the device and ledger fade out (see Render)
const CAM_NEW: CameraState = { x: 760, y: 280, k: 1.3 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  zoneU: ChannelRef<number>;
  devU: ChannelRef<number>;
  queryU: ChannelRef<number>;
  sendU: ChannelRef<number>;
  stencilU: ChannelRef<number>;
  streamU: ChannelRef<number>;
  cacheN: ChannelRef<number>;
  ledgerU: ChannelRef<number>;
  ledgerN: ChannelRef<number>;
  chipU: ChannelRef<number>;
  newU: ChannelRef<number>;
  pokeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0); // wall cascade
  const zoneU = tl.channel('zoneU', 0);
  const devU = tl.channel('devU', 0);
  const queryU = tl.channel('queryU', 0); // query chip at the device
  const sendU = tl.channel('sendU', 0); // chip rides up the socket
  const stencilU = tl.channel('stencilU', 0); // stencil sweeps the wall top→bottom
  const streamU = tl.channel('streamU', 0); // matched rows stream to the device
  const cacheN = tl.channel('cacheN', 0); // device cache row counter
  const ledgerU = tl.channel('ledgerU', 0); // CVR panel reveal
  const ledgerN = tl.channel('ledgerN', 0); // CVR entries ticking in
  const chipU = tl.channel('chipU', 0); // tape chip arriving from ch2
  const newU = tl.channel('newU', 0); // the new row lights up
  const pokeU = tl.channel('pokeU', 0); // the three-part poke to the device
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the wall —
  tl.caption({
    at: 0.5,
    dur: 5.5,
    text: 'Behind zero-cache sits the replica: every row of every published table. You cannot ship that wall to a phone.',
  });
  tl.tween(zoneU, 1, { at: 0.7, dur: 1.1, ease: ease.draw });
  tl.tween(gridU, 1, { at: 1.2, dur: 2.2, ease: ease.enter });
  tl.tween(devU, 1, { at: 2.6, dur: 0.7, ease: ease.enter });

  // — Beat 2 · queries, not tables —
  tl.caption({
    at: 6.4,
    dur: 5.5,
    text: 'So Zero syncs nothing by default. The client asks questions, and the questions themselves decide what moves.',
  });
  tl.tween(queryU, 1, { at: 7.4, dur: 0.7, ease: ease.enter });

  // — Beat 3 · the standing order —
  tl.caption({
    at: 12.3,
    dur: 6.5,
    text: 'Here is one, in Zero Query Language: open issues, twenty of them. It rides the socket up and registers as a standing order.',
  });
  tl.tween(sendU, 1, { at: 13.2, dur: 1.6, ease: ease.linear });
  tl.hold(18.8, 0.5);

  // — Beat 4 · the stencil drops —
  tl.caption({
    at: 19.3,
    dur: 6,
    text: 'Think of the query as a stencil lowered over the wall. Exactly the rows that match shine through — no more, no less.',
  });
  tl.tween(cam, CAM_GRID, { at: 19.5, dur: 1.4, ease: ease.move });
  tl.tween(stencilU, 1, { at: 20.2, dur: 3.2, ease: ease.draw });
  tl.hold(25.3, 0.5);

  // — Beat 5 · the stream —
  tl.caption({
    at: 25.8,
    dur: 5.5,
    text: 'Those twenty rows — and only those — stream down into the cache on the device. That is the entire download.',
  });
  tl.tween(streamU, 1, { at: 26.2, dur: 3.6, ease: ease.linear });
  tl.tween(cacheN, 20, { at: 26.4, dur: 3.6, ease: ease.move });
  tl.hold(31.3, 0.5);

  // — Beat 6 · the ledger —
  tl.caption({
    at: 31.8,
    dur: 6.5,
    text: 'And zero-cache writes down what each client now holds, in a ledger called the client view record — kept in a small Postgres of its own.',
  });
  tl.tween(cam, CAM_LEDGER, { at: 32.0, dur: 1.4, ease: ease.move });
  tl.tween(ledgerU, 1, { at: 32.6, dur: 0.8, ease: ease.enter });
  tl.tween(ledgerN, 20, { at: 33.4, dur: 2.6, ease: ease.move });
  tl.caption({
    at: 38.5,
    dur: 4,
    text: 'That ledger is what makes everything that follows cheap.',
  });
  tl.hold(42.5, 0.5);

  // — Beat 7 · a change arrives —
  tl.caption({
    at: 43.0,
    dur: 6,
    text: 'Now a change rides in on the tape from chapter two: someone, somewhere, opens a new issue. It lands in the replica like any other row.',
  });
  tl.tween(cam, CAM_WIDE, { at: 43.2, dur: 1.4, ease: ease.move });
  tl.tween(chipU, 1, { at: 44.2, dur: 2.0, ease: ease.linear });
  tl.tween(newU, 1, { at: 46.3, dur: 0.6, ease: ease.pop });

  // — Beat 8 · caught, incrementally —
  tl.caption({
    at: 49.4,
    dur: 6.5,
    text: 'The standing query catches it. Nothing re-runs against the whole wall — the view is maintained incrementally, so one changed row costs one changed row.',
  });
  tl.tween(cam, CAM_NEW, { at: 49.6, dur: 1.5, ease: ease.move });
  tl.hold(55.9, 0.5);

  // — Beat 9 · the diff poke —
  tl.caption({
    at: 56.4,
    dur: 6,
    text: 'zero-cache checks the ledger — the client has twenty rows, the answer now has twenty-one — and ships just the difference, as a poke.',
  });
  tl.tween(cam, CAM_WIDE, { at: 56.6, dur: 1.5, ease: ease.move });
  tl.tween(pokeU, 1, { at: 57.6, dur: 3.4, ease: ease.linear });
  tl.set(cacheN, 21, 60.6);
  tl.tween(ledgerN, 21, { at: 60.6, dur: 0.4, ease: ease.pop });
  tl.caption({
    at: 62.8,
    dur: 5,
    text: 'A poke starts, carries a patch of rows, and ends. One row crossed the wire; the other million never moved.',
  });
  tl.hold(67.8, 0.5);

  // — Beat 10 · the law —
  tl.caption({
    at: 68.3,
    dur: 5.5,
    text: 'Ask for twenty rows, sync twenty rows. In Zero, the query is the unit of sync — not the table, not the database.',
  });
  tl.tween(dimU, 1, { at: 68.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 69.8, dur: 0.8, ease: ease.enter });
  tl.hold(73.8, 1.2);

  return {
    tl, cam, gridU, zoneU, devU, queryU, sendU, stencilU, streamU,
    cacheN, ledgerU, ledgerN, chipU, newU, pokeU, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

// the poke's three parts, shown as a legend under the wall so the packets stay unlabelled
const POKE_STEPS = [
  { label: 'pokeStart', x: 390, w: 104 },
  { label: 'pokePart · rowsPatch', x: 508, w: 196 },
  { label: 'pokeEnd', x: 718, w: 92 },
];

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const zoneU = s.get(scene.zoneU);
  const devU = s.get(scene.devU);
  const queryU = s.get(scene.queryU);
  const sendU = s.get(scene.sendU);
  const stencilU = s.get(scene.stencilU);
  const streamU = s.get(scene.streamU);
  const cacheN = s.get(scene.cacheN);
  const ledgerU = s.get(scene.ledgerU);
  const ledgerN = s.get(scene.ledgerN);
  const chipU = s.get(scene.chipU);
  const newU = s.get(scene.newU);
  const pokeU = s.get(scene.pokeU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const faded = 1 - 0.87 * dimU;
  // the stencil's sweep line, in grid rows
  const sweepRow = stencilU * GRID.rows;
  // 0 when the camera shows the device and ledger, 1 on the close-up of the new row
  const focus = clamp01((cam.k - 1.05) / 0.2);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={faded}>
          {/* zero-cache zone + the replica wall */}
          <Zone x={ZONE.x} y={ZONE.y} w={ZONE.w} h={ZONE.h} label="zero-cache · view syncer" u={zoneU} color={colors.ACCENT} />
          {Array.from({ length: N_CELLS }, (_, i) => {
            const p = cellPos(i);
            const appear = clamp01(gridU * 2.2 - (i / N_CELLS) * 1.2);
            if (appear <= 0.01) return null;
            const row = Math.floor(i / GRID.cols);
            const isMatch = MATCH_SET.has(i);
            const lit = isMatch ? clamp01((sweepRow - row) * 2) : 0;
            const isNew = i === NEW_CELL;
            const newLit = isNew ? newU : 0;
            const on = Math.max(lit, newLit);
            return (
              <rect
                key={i}
                x={p.x}
                y={p.y}
                width={GRID.w}
                height={GRID.h}
                rx={4}
                fill={on > 0.02 ? (isNew ? colors.POSITIVE : colors.ACCENT) : colors.PANEL}
                opacity={appear * (0.45 + 0.55 * on)}
                stroke={on > 0.02 ? (isNew ? colors.POSITIVE : colors.ACCENT) : colors.MUTED}
                strokeWidth={on > 0.02 ? 1.4 : 0.8}
              />
            );
          })}
          <g opacity={gridU}>
            <text x={ZONE.x + ZONE.w / 2} y={ZONE.y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
              the replica — every row, dim until asked for
            </text>
          </g>

          {/* the stencil bar sweeping the wall */}
          {stencilU > 0.01 && stencilU < 1 && (
            <g>
              <rect
                x={GRID.x0 - 10}
                y={GRID.y0 + sweepRow * GRID.ch - 3}
                width={GRID.cols * GRID.cw + 14}
                height={5}
                rx={2.5}
                fill={colors.WARM}
                opacity={0.85}
              />
              <text x={GRID.x0 + GRID.cols * GRID.cw + 12} y={GRID.y0 + sweepRow * GRID.ch + 5} fill={colors.WARM} fontSize={14} fontFamily="ui-monospace, monospace">
                where(…)
              </text>
            </g>
          )}

          {/* the device */}
          <g opacity={devU * (1 - focus)}>
            <ServiceNode x={DEVICE.x} y={DEVICE.y} kind="client" label="device" sublabel="zero-client" />
            {cacheN > 0 && (
              <text x={DEVICE.x} y={DEVICE.y + 64} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={700} fontFamily="ui-monospace, monospace">
                cache: {Math.floor(cacheN)} rows
              </text>
            )}
            {/* the query chip, sitting above the device until it rides up */}
            <g opacity={queryU * (1 - Math.min(1, sendU * 8))}>
              <rect x={20} y={DEVICE.y - 128} width={318} height={52} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
              {QUERY_LINES.map((line, k) => (
                <text key={line} x={179} y={DEVICE.y - 128 + 22 + k * 20} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontFamily="ui-monospace, monospace">
                  {line}
                </text>
              ))}
            </g>
          </g>

          {/* the socket up to zero-cache */}
          <g opacity={1 - focus}>
            <Connection from={{ x: DEVICE.x + 40, y: DEVICE.y - 30 }} to={{ x: ZONE.x + 40, y: ZONE.y + ZONE.h - 10 }} u={devU} color={colors.GRID} dashed label="socket" labelSize={14} dim={0.5} />
          </g>
          {/* the query riding up */}
          <Packet
            from={{ x: DEVICE.x + 40, y: DEVICE.y - 40 }}
            to={{ x: ZONE.x + 60, y: ZONE.y + ZONE.h - 20 }}
            u={sendU}
            r={7}
            color={colors.ACCENT}
            label={sendU > 0.15 && sendU < 0.98 ? 'changeDesiredQueries' : undefined}
            labelSize={14}
          />

          {/* matched rows streaming down to the device */}
          {streamU > 0 && streamU < 1 &&
            STREAMERS.map((ci, k) => {
              const p = cellPos(ci);
              const u = clamp01(streamU * 2.2 - k * 0.22);
              if (u <= 0 || u >= 1) return null;
              return (
                <Packet
                  key={k}
                  from={{ x: p.x + GRID.w / 2, y: p.y + GRID.h / 2 }}
                  to={{ x: DEVICE.x, y: DEVICE.y - 24 }}
                  u={u}
                  r={4.5}
                  color={colors.ACCENT}
                  opacity={0.9}
                />
              );
            })}

          {/* the ledger — the client view record */}
          <g opacity={ledgerU * (1 - focus)}>
            <rect x={LEDGER.x} y={LEDGER.y} width={LEDGER.w} height={LEDGER.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
            <text x={LEDGER.x + LEDGER.w / 2} y={LEDGER.y + 26} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} fontWeight={700}>
              client view record
            </text>
            <text x={LEDGER.x + LEDGER.w / 2} y={LEDGER.y + 46} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="ui-monospace, monospace">
              cvr: queries · desires · rows — ZERO_CVR_DB
            </text>
            {/* tally marks: one per row the client holds */}
            {Array.from({ length: Math.min(21, Math.floor(ledgerN)) }, (_, k) => (
              <rect
                key={k}
                x={LEDGER.x + 18 + (k % 11) * 28}
                y={LEDGER.y + 60 + Math.floor(k / 11) * 30}
                width={20}
                height={22}
                rx={3}
                fill={k === 20 ? colors.POSITIVE : colors.SECONDARY}
                opacity={0.8}
              />
            ))}
            <text x={LEDGER.x + LEDGER.w - 16} y={LEDGER.y + LEDGER.h - 12} textAnchor="end" fill={colors.TEXT} fontSize={14} fontFamily="ui-monospace, monospace">
              {Math.floor(ledgerN)} rows held
            </text>
          </g>

          {/* the tape chip from chapter 2 */}
          {chipU > 0 && chipU < 1 && (
            <g>
              {/* rides in from the left and stops short of the wall's edge */}
              <rect x={20 + 220 * chipU} y={TAPE_IN.y - 14} width={124} height={28} rx={6} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.6} />
              <text x={82 + 220 * chipU} y={TAPE_IN.y + 5} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily="ui-monospace, monospace">
                insert · issue
              </text>
            </g>
          )}

          {/* the three-part poke */}
          {pokeU > 0 && pokeU < 1 &&
            POKE_STEPS.map((_, k) => {
              const u = clamp01(pokeU * 1.9 - k * 0.28);
              if (u <= 0 || u >= 1) return null;
              return (
                <Packet
                  key={k}
                  from={{ x: ZONE.x + 60, y: ZONE.y + ZONE.h - 20 }}
                  to={{ x: DEVICE.x + 40, y: DEVICE.y - 40 }}
                  u={u}
                  r={k === 1 ? 7 : 5}
                  color={k === 1 ? colors.POSITIVE : colors.MUTED}
                />
              );
            })}
          {/* the poke legend: the active part lights up, finished parts stay readable */}
          {pokeU > 0 && (
            <g opacity={Math.min(1, pokeU * 6)}>
              {POKE_STEPS.map((step, k) => {
                const active = pokeU < 1 && k === Math.min(2, Math.floor(pokeU * 3));
                const color = active ? colors.POSITIVE : colors.MUTED;
                return (
                  <g key={step.label} opacity={pokeU >= 1 || active || k < Math.floor(pokeU * 3) ? 1 : 0.45}>
                    <rect x={step.x} y={524} width={step.w} height={30} rx={15} fill={colors.PANEL} stroke={color} strokeWidth={active ? 1.8 : 1.2} />
                    <text x={step.x + step.w / 2} y={544} textAnchor="middle" fill={color} fontSize={14} fontFamily="ui-monospace, monospace">
                      {step.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {/* closing panel */}
        <g opacity={closeU}>
          <rect x={330} y={215} width={620} height={200} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={280} textAnchor="middle" fill={colors.ACCENT} fontSize={26} fontWeight={800} letterSpacing={1}>
            the query is the unit of sync
          </text>
          <text x={640} y={320} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            ask for twenty rows, sync twenty rows — then only the diffs
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily="ui-monospace, monospace">
            query → stencil → client view record → poke
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
