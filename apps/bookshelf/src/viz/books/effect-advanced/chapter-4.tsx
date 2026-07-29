// All or Nothing
//
// Backing files: packages/effect/src/TxRef.ts (a TxRef stores value + version;
// reads and writes inside Effect.tx are recorded in a transaction journal and
// committed together only when the outermost transaction succeeds; conflicts
// retry), packages/effect/src/Effect.ts (Effect.tx — optimistic with retry,
// Effect.txRetry, the Transaction service holding { journal, retry }),
// packages/effect/src/TxQueue.ts (take on an empty open queue retries
// transactionally), TxPubSub.ts / TxChunk.ts / TxSemaphore.ts (the family).
//
// Centerpiece: the journal machine — two account cells with version badges,
// a private journal panel per fiber where reads record versions and writes
// stay in pencil, a commit flash that lands everything at once, and a losing
// race that wipes the journal and re-runs the body on fresh values.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Geometry + the two-fiber script (checking → savings transfer vs deposit).
// ---------------------------------------------------------------------------

const CELLS = [
  { name: 'checking', x: 330, y: 230 },
  { name: 'savings', x: 330, y: 380 },
] as const;
const CELL_W = 250;
const CELL_H = 96;

const PANEL_A = { x: 720, y: 130, w: 430, h: 220 } as const;
const PANEL_B = { x: 720, y: 380, w: 430, h: 130 } as const;

const ROWS_A1 = [
  'read  checking   v1 → 100',
  'write checking   ← 90',
  'read  savings    v1 → 20',
  'write savings    ← 30',
] as const;
const ROWS_B = ['read  savings    v1 → 20', 'write savings    ← 25'] as const;
const ROWS_A2 = [
  'read  checking   v1 → 100',
  'write checking   ← 90',
  'read  savings    v2 → 25',
  'write savings    ← 35',
] as const;

const FAMILY = ['TxQueue', 'TxPubSub', 'TxChunk', 'TxSemaphore'] as const;

// camera marks
const CAM_CELLS: CameraState = { x: 430, y: 300, k: 1.35 };
const CAM_BOTH: CameraState = { x: 660, y: 300, k: 1.12 };
const CAM_A: CameraState = { x: 800, y: 250, k: 1.28 };
const CAM_B: CameraState = { x: 760, y: 380, k: 1.3 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  cellsU: ChannelRef<number>;
  panelAU: ChannelRef<number>;
  rowsA1: ChannelRef<number>;
  panelBU: ChannelRef<number>;
  rowsB: ChannelRef<number>;
  bCommitU: ChannelRef<number>;
  staleU: ChannelRef<number>;
  wipeU: ChannelRef<number>;
  rowsA2: ChannelRef<number>;
  aCommitU: ChannelRef<number>;
  ruleU: ChannelRef<number>;
  txDim: ChannelRef<number>;
  retryU: ChannelRef<number>;
  offerU: ChannelRef<number>;
  retryOut: ChannelRef<number>;
  famU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CELLS, cameraInterp);
  const cellsU = tl.channel('cellsU', 0);
  const panelAU = tl.channel('panelAU', 0);
  const rowsA1 = tl.channel('rowsA1', 0);
  const panelBU = tl.channel('panelBU', 0);
  const rowsB = tl.channel('rowsB', 0);
  const bCommitU = tl.channel('bCommitU', 0);
  const staleU = tl.channel('staleU', 0);
  const wipeU = tl.channel('wipeU', 0);
  const rowsA2 = tl.channel('rowsA2', 0);
  const aCommitU = tl.channel('aCommitU', 0);
  const ruleU = tl.channel('ruleU', 0);
  const txDim = tl.channel('txDim', 1);
  const retryU = tl.channel('retryU', 0);
  const offerU = tl.channel('offerU', 0);
  const retryOut = tl.channel('retryOut', 0);
  const famU = tl.channel('famU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the stakes —
  tl.caption({
    at: 0.5,
    dur: 7.5,
    text: 'Move ten dollars between two balances and you need two writes. Any fiber that peeks between them sees money that has vanished, or doubled. Locks are the old answer. Effect has a better one.',
  });
  tl.tween(cellsU, 1, { at: 0.7, dur: 1.2, ease: ease.draw });
  tl.hold(8.0, 0.5);

  // — Beat 2 · transactional references —
  tl.caption({
    at: 8.5,
    dur: 5,
    text: 'These are transactional references. Each holds a value — and a version number that counts every committed change.',
  });

  // — Beat 3 · the journal —
  tl.caption({
    at: 13.9,
    dur: 6,
    text: 'A fiber opens a transaction. Nothing locks; instead a private journal appears, and every read and write inside the boundary lands there first.',
  });
  tl.tween(cam, CAM_BOTH, { at: 14.1, dur: 1.3, ease: ease.move });
  tl.tween(panelAU, 1, { at: 14.7, dur: 0.9, ease: ease.enter });

  // — Beat 4 · reads record versions —
  tl.caption({
    at: 20.3,
    dur: 5.5,
    text: 'Reads record the version they saw: checking at version one, savings at version one. The journal is a bet that nothing changes underneath.',
  });
  tl.tween(rowsA1, 0.5, { at: 20.7, dur: 2.2, ease: ease.move });

  // — Beat 5 · writes stay in pencil —
  tl.caption({
    at: 26.2,
    dur: 6.5,
    text: 'Writes stay in pencil. The journal says ninety and thirty — but look at the cells: still one hundred, still twenty. Nobody outside can see a half-finished transfer.',
  });
  tl.tween(rowsA1, 1, { at: 26.6, dur: 2.2, ease: ease.move });
  tl.hold(33.1, 0.4);

  // — Beat 6 · commit is a version check —
  tl.caption({
    at: 33.5,
    dur: 5.5,
    text: 'Commit is a version check: every reference still at the version we read? Then all the writes land in one indivisible step. All, or nothing.',
  });

  // — Beat 7 · the race —
  tl.caption({
    at: 39.4,
    dur: 5.5,
    text: 'But first, a race. A second fiber deposits five into savings and commits before we do — savings jumps to version two.',
  });
  tl.tween(cam, CAM_B, { at: 39.6, dur: 1.2, ease: ease.move });
  tl.tween(panelBU, 1, { at: 39.8, dur: 0.8, ease: ease.enter });
  tl.tween(rowsB, 1, { at: 40.6, dur: 1.4, ease: ease.move });
  tl.tween(bCommitU, 1, { at: 42.6, dur: 0.9, ease: ease.pop });

  // — Beat 8 · stale, wipe, re-run —
  tl.caption({
    at: 45.3,
    dur: 7,
    text: 'Now the first fiber goes to commit, and its bet fails: it read savings at version one, and the world moved on. So the journal is thrown away, and the body simply runs again on fresh values.',
  });
  tl.tween(cam, CAM_A, { at: 45.5, dur: 1.2, ease: ease.move });
  tl.tween(staleU, 1, { at: 45.9, dur: 0.7, ease: ease.pop });
  tl.tween(wipeU, 1, { at: 48.4, dur: 0.9, ease: ease.move });
  tl.tween(rowsA2, 1, { at: 49.6, dur: 2.0, ease: ease.move });

  // — Beat 9 · optimistic, so keep effects out —
  tl.caption({
    at: 52.7,
    dur: 7,
    text: 'Run again, commit clean. That is optimistic concurrency: no locks held, and conflicts cost something only when they happen. It also means a body can run twice — so keep real side effects out of it.',
  });
  tl.tween(aCommitU, 1, { at: 53.3, dur: 0.9, ease: ease.pop });
  tl.tween(ruleU, 1, { at: 57.2, dur: 0.7, ease: ease.enter });
  tl.hold(60.1, 0.4);

  // — Beat 10 · transactions can wait —
  tl.caption({
    at: 60.5,
    dur: 6,
    text: 'Transactions can also wait. Take from an empty transactional queue and it calls retry: the fiber parks — no polling — until something it read changes.',
  });
  tl.tween(cam, CAM_WIDE, { at: 60.7, dur: 1.3, ease: ease.move });
  tl.tween(txDim, 0.12, { at: 60.9, dur: 1.0, ease: ease.move });
  tl.tween(retryU, 1, { at: 61.7, dur: 0.9, ease: ease.enter });

  // — Beat 11 · the wake-up —
  tl.caption({
    at: 66.9,
    dur: 6,
    text: 'The moment a producer offers a value, the version ticks, the sleeper wakes, and the take runs again — and succeeds. Coordination without a single lock.',
  });
  tl.tween(offerU, 1, { at: 67.5, dur: 2.6, ease: ease.linear });

  // — Beat 12 · the family —
  tl.caption({
    at: 73.3,
    dur: 7,
    text: 'The whole transactional family — queues, hubs, chunks, semaphores — is built from these references. One transaction can move a value through several of them in a single atomic step.',
  });
  tl.tween(retryOut, 1, { at: 73.5, dur: 0.8, ease: ease.move });
  tl.tween(famU, 1, { at: 74.4, dur: 1.0, ease: ease.enter });
  tl.tween(closeU, 1, { at: 78.0, dur: 0.8, ease: ease.enter });
  tl.hold(80.9, 1.5);

  return {
    tl,
    cam,
    cellsU,
    panelAU,
    rowsA1,
    panelBU,
    rowsB,
    bCommitU,
    staleU,
    wipeU,
    rowsA2,
    aCommitU,
    ruleU,
    txDim,
    retryU,
    offerU,
    retryOut,
    famU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

const pulse = (u: number): number => (u <= 0 || u >= 1 ? 0 : 1 - Math.abs(u - 0.5) * 2);

function Cell({ x, y, name, value, version, flash, u }: {
  x: number;
  y: number;
  name: string;
  value: number;
  version: number;
  flash: number;
  u: number;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect
        x={x - CELL_W / 2}
        y={y - CELL_H / 2}
        width={CELL_W}
        height={CELL_H}
        rx={12}
        fill={colors.PANEL}
        stroke={flash > 0.05 ? colors.POSITIVE : colors.GRID}
        strokeWidth={1 + flash * 2.5}
      />
      <text x={x - CELL_W / 2 + 16} y={y - CELL_H / 2 + 24} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
        {name} — TxRef
      </text>
      <text x={x} y={y + 16} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={700}>
        {value}
      </text>
      <g>
        <rect x={x + CELL_W / 2 - 46} y={y - CELL_H / 2 + 10} width={36} height={20} rx={10} fill={colors.BG} stroke={colors.SECONDARY} />
        <text x={x + CELL_W / 2 - 28} y={y - CELL_H / 2 + 24} textAnchor="middle" fill={colors.SECONDARY} fontSize={10.5} fontFamily="monospace">
          v{version}
        </text>
      </g>
    </g>
  );
}

function Journal({ x, y, w, h, title, rows, rowU, u, stale, staleU, wipeX, commit }: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  rows: readonly string[];
  rowU: number; // 0..1 staggered reveal
  u: number;
  stale?: readonly boolean[];
  staleU?: number;
  wipeX?: number; // 0..1 slide rows off
  commit?: number;
}) {
  if (u <= 0) return null;
  const flash = commit ? pulse(commit) : 0;
  return (
    <g opacity={u}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={colors.PANEL} stroke={flash > 0.05 ? colors.POSITIVE : colors.ACCENT} strokeWidth={flash > 0.05 ? 2.5 : 1.2} />
      <text x={x + 16} y={y + 24} fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
        {title}
      </text>
      <text x={x + w - 16} y={y + 24} textAnchor="end" fill={colors.MUTED} fontSize={10}>
        journal — pencil until commit
      </text>
      {rows.map((r, i) => {
        const ru = clamp01(rowU * rows.length - i);
        if (ru <= 0) return null;
        const off = (wipeX ?? 0) * (w + 60);
        const isStale = stale?.[i] && (staleU ?? 0) > 0;
        return (
          <g key={i} opacity={ru * (1 - (wipeX ?? 0))}>
            <text
              x={x + 22 + off}
              y={y + 50 + i * 22}
              fill={isStale ? colors.NEGATIVE : r.startsWith('write') ? colors.WARM : colors.MUTED}
              fontSize={12}
              fontFamily="monospace"
              fontStyle={r.startsWith('write') ? 'italic' : 'normal'}
            >
              {r}
            </text>
            {isStale && (
              <text x={x + w - 20 + off} y={y + 50 + i * 22} textAnchor="end" fill={colors.NEGATIVE} fontSize={11} fontFamily="monospace" opacity={staleU}>
                stale ✗
              </text>
            )}
          </g>
        );
      })}
      {flash > 0.05 && (
        <text x={x + w - 16} y={y + h - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} opacity={flash}>
          ✓ committed
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cellsU = s.get(scene.cellsU);
  const panelAU = s.get(scene.panelAU);
  const rowsA1 = s.get(scene.rowsA1);
  const panelBU = s.get(scene.panelBU);
  const rowsB = s.get(scene.rowsB);
  const bCommitU = s.get(scene.bCommitU);
  const staleU = s.get(scene.staleU);
  const wipeU = s.get(scene.wipeU);
  const rowsA2 = s.get(scene.rowsA2);
  const aCommitU = s.get(scene.aCommitU);
  const ruleU = s.get(scene.ruleU);
  const txDim = s.get(scene.txDim);
  const retryU = s.get(scene.retryU);
  const offerU = s.get(scene.offerU);
  const retryOut = s.get(scene.retryOut);
  const famU = s.get(scene.famU);
  const closeU = s.get(scene.closeU);

  // cell values as pure functions of the commit channels
  const bDone = bCommitU > 0.5;
  const aDone = aCommitU > 0.5;
  const checking = { value: aDone ? 90 : 100, version: aDone ? 2 : 1 };
  const savings = {
    value: aDone ? 35 : bDone ? 25 : 20,
    version: 1 + (bDone ? 1 : 0) + (aDone ? 1 : 0),
  };
  const cellFlash = Math.max(pulse(bCommitU), pulse(aCommitU));

  // second attempt rows replace the wiped first attempt
  const showA2 = rowsA2 > 0;

  // retry strip: parked until the offered value arrives
  const parked = retryU > 0.5 && offerU < 0.75;
  const retryAlpha = retryU * (1 - retryOut);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={txDim}>
          <Cell x={CELLS[0].x} y={CELLS[0].y} name={CELLS[0].name} value={checking.value} version={checking.version} flash={pulse(aCommitU)} u={cellsU} />
          <Cell x={CELLS[1].x} y={CELLS[1].y} name={CELLS[1].name} value={savings.value} version={savings.version} flash={cellFlash} u={cellsU} />
          {cellsU > 0 && (
            <text x={CELLS[0].x} y={CELLS[0].y - 78} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace" opacity={cellsU}>
              TxRef.make(100) · TxRef.make(20)
            </text>
          )}

          {/* fiber A journal — attempt 1, then the re-run */}
          {!showA2 ? (
            <Journal
              x={PANEL_A.x}
              y={PANEL_A.y}
              w={PANEL_A.w}
              h={PANEL_A.h}
              title="Effect.tx — fiber A: transfer 10"
              rows={ROWS_A1}
              rowU={rowsA1}
              u={panelAU}
              stale={[false, false, true, false]}
              staleU={staleU}
              wipeX={wipeU}
            />
          ) : (
            <Journal
              x={PANEL_A.x}
              y={PANEL_A.y}
              w={PANEL_A.w}
              h={PANEL_A.h}
              title="Effect.tx — fiber A: run 2"
              rows={ROWS_A2}
              rowU={rowsA2}
              u={panelAU}
              commit={aCommitU}
            />
          )}

          {/* fiber B journal */}
          <Journal
            x={PANEL_B.x}
            y={PANEL_B.y}
            w={PANEL_B.w}
            h={PANEL_B.h}
            title="Effect.tx — fiber B: deposit 5"
            rows={ROWS_B}
            rowU={rowsB}
            u={panelBU}
            commit={bCommitU}
          />

          {/* the run-twice rule */}
          {ruleU > 0 && (
            <g opacity={ruleU}>
              <rect x={PANEL_A.x} y={PANEL_A.y + PANEL_A.h + 12} width={PANEL_A.w} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} />
              <text x={PANEL_A.x + PANEL_A.w / 2} y={PANEL_A.y + PANEL_A.h + 32} textAnchor="middle" fill={colors.WARM} fontSize={11.5}>
                bodies may run twice — pure state changes only
              </text>
            </g>
          )}
        </g>

        {/* ---- the retry strip (opaque panel over the dimmed stage) ---- */}
        {retryAlpha > 0 && (
          <g opacity={retryAlpha}>
            <rect x={230} y={240} width={820} height={190} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={260} y={272} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
              TxQueue.take — on an empty queue
            </text>
            <text x={1020} y={272} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
              Effect.txRetry
            </text>
            {/* producer, rack, sleeper */}
            <rect x={280} y={310} width={130} height={44} rx={10} fill={colors.BG} stroke={offerU > 0.05 ? colors.ACCENT : colors.GRID} />
            <text x={345} y={330} textAnchor="middle" fill={colors.TEXT} fontSize={11.5}>
              producer fiber
            </text>
            <text x={345} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">
              TxQueue.offer
            </text>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={560 + i * 50} y={312} width={42} height={40} rx={7} fill="none" stroke={colors.GRID} />
            ))}
            <rect x={880} y={310} width={130} height={44} rx={10} fill={colors.BG} stroke={parked ? colors.WARM : colors.POSITIVE} strokeWidth={1.8} />
            <text x={945} y={330} textAnchor="middle" fill={colors.TEXT} fontSize={11.5}>
              consumer fiber
            </text>
            <text x={945} y={346} textAnchor="middle" fill={parked ? colors.WARM : colors.POSITIVE} fontSize={9.5}>
              {parked ? '⏸ parked — waiting on retry' : offerU >= 0.75 ? '✓ woke and took the value' : 'taking…'}
            </text>
            {/* the offered value travels producer → slot → consumer */}
            {offerU > 0.05 && (
              <circle
                cx={offerU < 0.55 ? lerp(420, 581, offerU / 0.55) : offerU < 0.75 ? 581 : lerp(581, 872, (offerU - 0.75) / 0.25)}
                cy={332}
                r={12}
                fill={colors.ACCENT}
                opacity={offerU > 0.97 ? (1 - offerU) / 0.03 : 0.9}
              />
            )}
            <text x={640} y={410} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontStyle="italic">
              parked fibers wake when a reference they read changes version
            </text>
          </g>
        )}

        {/* ---- the family ---- */}
        {famU > 0 && (
          <g opacity={famU}>
            <rect x={230} y={240} width={820} height={190} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={640} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
              one journal, one commit — across the whole family
            </text>
            <rect x={565} y={300} width={150} height={36} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={2} />
            <text x={640} y={323} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily="monospace" fontWeight={700}>
              TxRef
            </text>
            {FAMILY.map((f, i) => {
              const u = clamp01(famU * 4 - i * 0.6);
              const x = 300 + i * 180;
              return (
                <g key={f} opacity={u}>
                  <line x1={x + 60} y1={368} x2={640} y2={336} stroke={colors.GRID} strokeWidth={1} />
                  <rect x={x - 10} y={368} width={140} height={32} rx={9} fill={colors.BG} stroke={colors.SECONDARY} />
                  <text x={x + 60} y={389} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontFamily="monospace">
                    {f}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* closing line under the family panel */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={330} y={470} width={620} height={70} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={513} textAnchor="middle" fill={colors.ACCENT} fontSize={20} fontWeight={700}>
              read · write · commit — all or nothing
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
