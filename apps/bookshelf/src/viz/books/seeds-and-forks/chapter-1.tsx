// The Obvious Shop Loses Receipts
//
// Backed by: plans/deterministic-simulation-testing.md (the obvious shop, and the
// 2,000-seed run that found 1,978 failures), scripts/shop-race.ts (read the stock,
// work it out, write it back, then read the orders list, append, write it back),
// and scripts/sim.js with two requests (seed 5: the twelve actions the simulator
// chose, in order).
//
// Machine: a KV shelf and an orders ledger, and one tape with two lanes. The
// playhead walks the twelve actions. Both requests read the orders list before
// either one writes it, so the second write erases the first receipt. Then the
// camera pulls back and the same race is counted over two thousand seeds.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/* ---------------------------------------------------------------- layout */
const SHELF = { x: 90, y: 150, w: 380, h: 180 };
const LEDGER = { x: 810, y: 150, w: 380, h: 180 };
const CODE = { x: 250, y: 150, w: 780, h: 300 };
const TAPE_X0 = 150; // left edge of action 1
const TAPE_DX = 86; // spacing between actions
const LANE_A = 430; // centre y of request A (espresso)
const LANE_B = 520; // centre y of request B (bagel)
const CHIP_W = 80;
const CHIP_H = 46;
const TAPE_STEP = 1.4; // seconds per action on the tape
const N = 12; // actions in seed five

const CAM_WIDE: CameraState = { ...CAMERA_HOME };
const CAM_SHELF: CameraState = { x: 290, y: 250, k: 1.35 };
// Each camera keeps every label it shows inside the frame, including while panning.
const CAM_TAPE: CameraState = { x: 620, y: 470, k: 1.06 };
const CAM_LEDGER: CameraState = { x: 615, y: 300, k: 1.1 };
const CAM_COUNT: CameraState = { x: 640, y: 330, k: 1.0 };

/* ------------------------------------------------------------------ data */
// Seed five, two requests. Lane A is request r0 (espresso), lane B is r1 (bagel).
// Values are what the shop read or wrote at that action.
type Action = { lane: 'A' | 'B'; top: string; bottom: string };
const ACTIONS: Action[] = [
  { lane: 'A', top: 'deliver', bottom: 'espresso' },
  { lane: 'A', top: 'GET', bottom: 'espresso 3' },
  { lane: 'B', top: 'deliver', bottom: 'bagel' },
  { lane: 'B', top: 'GET', bottom: 'bagel 2' },
  { lane: 'B', top: 'PUT', bottom: 'bagel 1' },
  { lane: 'A', top: 'PUT', bottom: 'espresso 2' },
  { lane: 'A', top: 'GET', bottom: 'orders' },
  { lane: 'B', top: 'GET', bottom: 'orders' },
  { lane: 'B', top: 'PUT', bottom: 'orders' },
  { lane: 'B', top: 'reply', bottom: 'receipt' },
  { lane: 'A', top: 'PUT', bottom: 'orders' },
  { lane: 'A', top: 'reply', bottom: 'receipt' },
];

// The three-line recipe from scripts/shop-race.ts, abridged to the reads and writes.
const RECIPE = [
  { code: 'const left = Number(await kv().get(line.item)) - line.quantity;', tag: 'read, work out', color: colors.ACCENT },
  { code: 'await kv().put(line.item, String(left));', tag: 'write', color: colors.WARM },
  { code: 'const orders = JSON.parse((await kv().get("orders")) ?? "[]");', tag: 'read the list', color: colors.ACCENT },
  { code: 'orders.push(receipt);', tag: 'add the receipt', color: colors.SECONDARY },
  { code: 'await kv().put("orders", JSON.stringify(orders));', tag: 'write the list', color: colors.WARM },
];

const C1 =
  'Here is a shop, the kind you could write in an afternoon. Its stock and its orders live in a key-value store, and every buy is a short read, then a write.';
const C2 =
  'Read the stock. Work out what is left, and write it back. Then read the orders list, add the receipt, and write that back too.';
const C3 =
  'Two customers press Buy at nearly the same moment. Each request waits on the store, and while one waits, the other one runs.';
const C4 =
  'Customer A buys an espresso and reads three left. Customer B buys a bagel and reads two. Both read the orders list before either one writes it back.';
const C5 =
  'The bagel write lands first. Then the espresso customer writes back its own copy, made before the bagel receipt existed, and the bagel receipt is gone.';
const C6 =
  'A seed is the number that fixes every choice of order, so each one is a single schedule. Run two thousand seeds of six requests, and 1,978 of them break.';
const C7 =
  'Most of the failures lose a receipt. Fifty-three sell more espresso or bagels than the shelf held. It is the same race, counted on the stock.';
const C8 = 'Two requests are enough. Seed five breaks in twelve actions, and the whole trace fits on one screen.';
const C9 = 'One request at a time has nothing to interleave with. The bug exists only in the order the steps happen in.';

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  shelfU: ChannelRef<number>;
  codeU: ChannelRef<number>;
  codeHi: ChannelRef<number>;
  ledgerU: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  tapeFadeU: ChannelRef<number>;
  countU: ChannelRef<number>;
  barU: ChannelRef<number>;
  splitU: ChannelRef<number>;
  endU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const shelfU = tl.channel('shelfU', 0);
  const codeU = tl.channel('codeU', 0);
  const codeHi = tl.channel('codeHi', 0); // which recipe line is lit (0..4)
  const ledgerU = tl.channel('ledgerU', 0);
  const tapeU = tl.channel('tapeU', 0); // 0..1 across the twelve actions
  const tapeFadeU = tl.channel('tapeFadeU', 0); // the tape steps aside for the count
  const countU = tl.channel('countU', 0);
  const barU = tl.channel('barU', 0);
  const splitU = tl.channel('splitU', 0);
  const endU = tl.channel('endU', 0); // everything steps back for the closing card
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · a shop, and the store behind it —
  tl.tween(shelfU, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_SHELF, { at: 1.2, dur: 1.8, ease: ease.move });
  let t = 0.4;
  t = tl.caption({ at: t, dur: 7.2, text: C1 });
  t = tl.hold(t, 0.4);

  // — Beat 2 · the recipe, three steps of it, one line lit at a time —
  tl.tween(cam, CAM_WIDE, { at: t + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(codeU, 1, { at: t + 0.4, dur: 0.8, ease: ease.enter });
  tl.set(codeHi, 1, t + 1.6);
  tl.set(codeHi, 2, t + 2.6);
  tl.set(codeHi, 3, t + 3.6);
  tl.set(codeHi, 4, t + 4.6);
  t = tl.caption({ at: t, dur: 8.0, text: C2 });
  tl.tween(codeU, 0, { at: t - 1.2, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.4);

  // — Beat 3 · two customers, one tape —
  tl.tween(cam, CAM_TAPE, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(tapeU, 1, { at: t + 0.6, dur: N * TAPE_STEP, ease: ease.linear });
  t = tl.caption({ at: t, dur: 7.0, text: C3 });

  // — Beat 4 · both read the orders list —
  tl.tween(ledgerU, 1, { at: t - 0.4, dur: 1.2, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.6, text: C4 });

  // — Beat 5 · the second write erases the bagel receipt —
  tl.tween(cam, CAM_LEDGER, { at: t - 1.6, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_TAPE, { at: t + 2.4, dur: 1.4, ease: ease.move });
  t = tl.caption({ at: t, dur: 6.6, text: C5 });

  // — Beat 6 · the same race, counted over two thousand seeds —
  tl.tween(tapeFadeU, 1, { at: t - 0.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_COUNT, { at: t - 0.4, dur: 1.4, ease: ease.move });
  tl.tween(countU, 1, { at: t + 0.2, dur: 1.0, ease: ease.enter });
  tl.tween(barU, 1, { at: t + 1.2, dur: 1.6, ease: ease.move });
  t = tl.caption({ at: t, dur: 7.0, text: C6 });

  // — Beat 7 · lost receipts, and the oversold sliver —
  tl.tween(splitU, 1, { at: t + 0.4, dur: 1.6, ease: ease.move });
  t = tl.caption({ at: t, dur: 6.4, text: C7 });

  // — Beat 8 · the whole trace, back on one screen —
  tl.tween(countU, 0, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(tapeFadeU, 0, { at: t + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: t, dur: 1.4, ease: ease.move });
  t = tl.caption({ at: t, dur: 6.0, text: C8 });

  // — Beat 9 · clean ending: everything steps back, one opaque card remains —
  tl.tween(endU, 1, { at: t + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 1.0, dur: 1.0, ease: ease.enter });
  t = tl.caption({ at: t, dur: 6.4, text: C9 });
  t = tl.hold(t, 0.8);

  return { tl, cam, shelfU, codeU, codeHi, ledgerU, tapeU, tapeFadeU, countU, barU, splitU, endU, closeU };
}

const scene = buildScene();

/* ------------------------------------------------------------- drawing */
function Shelf({ opacity, espresso, bagel }: { opacity: number; espresso: number; bagel: number }) {
  if (opacity <= 0) return null;
  const items: [string, number][] = [
    ['espresso', espresso],
    ['bagel', bagel],
  ];
  return (
    <g opacity={opacity}>
      <rect x={SHELF.x} y={SHELF.y} width={SHELF.w} height={SHELF.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={SHELF.x + 22} y={SHELF.y + 34} fill={colors.TEXT} fontFamily={SANS} fontSize={18} fontWeight={600}>
        KV · stock
      </text>
      {items.map(([name, n], j) => {
        const y = SHELF.y + 62 + j * 52;
        return (
          <g key={name}>
            <rect x={SHELF.x + 22} y={y} width={SHELF.w - 44} height={40} rx={8} fill={colors.BG} stroke={colors.GRID} />
            <text x={SHELF.x + 40} y={y + 26} fill={colors.TEXT} fontFamily={MONO} fontSize={16}>
              {name}
            </text>
            <text
              x={SHELF.x + SHELF.w - 40}
              y={y + 27}
              textAnchor="end"
              fill={colors.ACCENT}
              fontFamily={MONO}
              fontSize={20}
              fontWeight={700}
            >
              {n}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Ledger({ opacity, p }: { opacity: number; p: number }) {
  if (opacity <= 0) return null;
  // The bagel receipt lands after action 9 and is erased by action 11's write.
  const bagelRow = clamp01((p - 9) * 4) * (1 - clamp01((p - 10) * 3));
  const erasedTag = clamp01((p - 10.1) * 4) * (1 - clamp01((p - 11.2) * 3));
  const espressoRow = clamp01((p - 10.6) * 3);
  const rowY = (j: number) => LEDGER.y + 74 + j * 40;
  return (
    <g opacity={opacity}>
      <rect x={LEDGER.x} y={LEDGER.y} width={LEDGER.w} height={LEDGER.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={LEDGER.x + 22} y={LEDGER.y + 34} fill={colors.TEXT} fontFamily={SANS} fontSize={18} fontWeight={600}>
        KV · orders
      </text>
      <g opacity={bagelRow}>
        <rect x={LEDGER.x + 22} y={rowY(0)} width={LEDGER.w - 44} height={32} rx={6} fill={colors.BG} />
        <text x={LEDGER.x + 36} y={rowY(0) + 21} fill={colors.WARM} fontFamily={MONO} fontSize={15}>
          bagel · 275¢
        </text>
      </g>
      <g opacity={erasedTag}>
        <text x={LEDGER.x + LEDGER.w - 36} y={rowY(0) + 21} textAnchor="end" fill={colors.NEGATIVE} fontFamily={SANS} fontSize={15} fontWeight={700}>
          erased
        </text>
      </g>
      <g opacity={espressoRow}>
        <rect x={LEDGER.x + 22} y={rowY(1)} width={LEDGER.w - 44} height={32} rx={6} fill={colors.BG} />
        <text x={LEDGER.x + 36} y={rowY(1) + 21} fill={colors.ACCENT} fontFamily={MONO} fontSize={15}>
          espresso · 350¢
        </text>
      </g>
    </g>
  );
}

function CodeCard({ opacity, hi }: { opacity: number; hi: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <rect x={CODE.x} y={CODE.y} width={CODE.w} height={CODE.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={CODE.x + 30} y={CODE.y + 44} fill={colors.MUTED} fontFamily={MONO} fontSize={14}>
        scripts/shop-race.ts · the obvious version
      </text>
      {RECIPE.map((line, i) => {
        const y = CODE.y + 90 + i * 44;
        const active = i === hi;
        return (
          <g key={i} opacity={active ? 1 : 0.42}>
            {active && <rect x={CODE.x + 18} y={y - 24} width={CODE.w - 36} height={34} rx={6} fill={line.color} fillOpacity={0.14} />}
            <text x={CODE.x + 30} y={y} fill={colors.TEXT} fontFamily={MONO} fontSize={15}>
              {line.code}
            </text>
            <text x={CODE.x + CODE.w - 30} y={y} textAnchor="end" fill={line.color} fontFamily={SANS} fontSize={14} fontWeight={600}>
              {line.tag}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Tape({ opacity, p }: { opacity: number; p: number }) {
  // The lanes appear with the first action, not before.
  if (opacity <= 0 || p <= 0) return null;
  const headX = TAPE_X0 + p * TAPE_DX;
  return (
    <g opacity={opacity}>
      <line x1={TAPE_X0 - 10} x2={TAPE_X0 + N * TAPE_DX} y1={LANE_A} y2={LANE_A} stroke={colors.GRID} />
      <line x1={TAPE_X0 - 10} x2={TAPE_X0 + N * TAPE_DX} y1={LANE_B} y2={LANE_B} stroke={colors.GRID} />
      <text x={40} y={LANE_A + 5} fill={colors.ACCENT} fontFamily={SANS} fontSize={14} fontWeight={600}>
        A · espresso
      </text>
      <text x={40} y={LANE_B + 5} fill={colors.WARM} fontFamily={SANS} fontSize={14} fontWeight={600}>
        B · bagel
      </text>
      {ACTIONS.map((a, i) => {
        const vis = clamp01(p - i + 0.4);
        if (vis <= 0) return null;
        const x = TAPE_X0 + i * TAPE_DX;
        const cy = a.lane === 'A' ? LANE_A : LANE_B;
        const color = a.lane === 'A' ? colors.ACCENT : colors.WARM;
        return (
          <g key={i} opacity={vis}>
            <rect x={x} y={cy - CHIP_H / 2} width={CHIP_W} height={CHIP_H} rx={8} fill={color} fillOpacity={0.14} stroke={color} strokeWidth={1.2} />
            <text x={x + 9} y={cy - 6} fill={color} fontFamily={MONO} fontSize={11} fontWeight={700}>
              {a.top}
            </text>
            <text x={x + 9} y={cy + 12} fill={colors.TEXT} fontFamily={MONO} fontSize={11}>
              {a.bottom}
            </text>
            <text x={x + CHIP_W / 2} y={LANE_B + 52} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={11}>
              {i + 1}
            </text>
          </g>
        );
      })}
      <line x1={headX} x2={headX} y1={384} y2={556} stroke={colors.TEXT} strokeOpacity={0.6} strokeDasharray="3 4" />
    </g>
  );
}

function CountPanel({ opacity, bar, split }: { opacity: number; bar: number; split: number }) {
  if (opacity <= 0) return null;
  const W = 700;
  const X = 290;
  const failW = W * (1978 / 2000) * bar;
  const lostW = W * (1925 / 2000) * split;
  const oversoldW = W * (53 / 2000) * split;
  return (
    <g opacity={opacity}>
      <rect x={240} y={170} width={800} height={340} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={640} y={214} textAnchor="middle" fill={colors.TEXT} fontFamily={SANS} fontSize={24} fontWeight={600}>
        Two thousand seeds, six requests each
      </text>
      <text x={X} y={262} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        2,000 schedules
      </text>
      <rect x={X} y={272} width={W * bar} height={28} rx={6} fill={colors.MUTED} fillOpacity={0.35} />
      <text x={X} y={330} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        1,978 broke
      </text>
      <rect x={X} y={340} width={failW} height={28} rx={6} fill={colors.NEGATIVE} fillOpacity={0.85} />
      <text x={X} y={398} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        1,925 lost a receipt · 53 sold more than the stock held
      </text>
      <rect x={X} y={408} width={lostW} height={28} rx={6} fill={colors.NEGATIVE} fillOpacity={0.85} />
      <rect x={X + lostW} y={408} width={oversoldW} height={28} fill={colors.WARM} />
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={240} y={250} width={800} height={180} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontFamily={SANS} fontSize={26} fontWeight={600}>
        One request at a time: nothing to interleave.
      </text>
      <text x={640} y={370} textAnchor="middle" fill={colors.WARM} fontFamily={SANS} fontSize={26} fontWeight={600}>
        Two requests, in any order: a receipt can vanish.
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const code = clamp01(s.get(scene.codeU));
  const tapeFade = clamp01(s.get(scene.tapeFadeU));
  const end = clamp01(s.get(scene.endU));
  const dim = (1 - 0.85 * tapeFade) * (1 - 0.85 * end);
  const p = clamp01(s.get(scene.tapeU)) * N;
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <Shelf
          opacity={clamp01(s.get(scene.shelfU)) * (1 - 0.82 * code) * dim}
          espresso={p >= 6 ? 2 : 3}
          bagel={p >= 5 ? 1 : 2}
        />
        <Ledger opacity={clamp01(s.get(scene.ledgerU)) * dim} p={p} />
        <Tape opacity={dim} p={p} />
        <CodeCard opacity={code} hi={Math.floor(s.get(scene.codeHi))} />
        <CountPanel opacity={clamp01(s.get(scene.countU))} bar={clamp01(s.get(scene.barU))} split={clamp01(s.get(scene.splitU))} />
        <ClosingCard u={clamp01(s.get(scene.closeU))} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
