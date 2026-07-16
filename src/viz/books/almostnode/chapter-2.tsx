// A Filesystem in RAM
//
// Grounding: packages/almostnode/src/virtual-fs.ts — FSNode { type,
// content?: Uint8Array, children?: Map, mtime, ino }, mkdirSync/writeFileSync/
// readFileSync, toSnapshot()/VirtualFS.fromSnapshot(), watch() with
// WatchEventType 'change' | 'rename'; src/worker/runtime-worker.ts (init
// restores a VFS snapshot inside the Web Worker, syncFile keeps it fresh);
// src/worker-runtime.ts (comlink wrap, VFS change listeners). The project
// files are the exact fixture from tests/dev-server-jsdom.test.ts.
//
// Centerpiece: a LIVING TREE. Calls arrive as chips on the left and the tree
// grows node by node; a read probe walks root → children Map → leaf; then the
// whole tree flattens into a snapshot tape, crosses a worker boundary, and
// regrows on the other side. A watcher bell planted here rings again in
// chapter 4 (hot reload).
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
import type { CameraState, SceneState } from '../../core';
import { Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Layout — call chips left, the tree center, FSNode card top right,
// snapshot tape lower third, worker twin right.
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

interface TreeNode {
  id: string;
  label: string;
  kind: 'dir' | 'file';
  x: number;
  y: number;
  parent: string | null;
  bytes?: number;
}

// the exact project the jsdom test writes into the VFS
const NODES: TreeNode[] = [
  { id: 'root', label: '/', kind: 'dir', x: 590, y: 175, parent: null },
  { id: 'src', label: 'src/', kind: 'dir', x: 450, y: 285, parent: 'root' },
  { id: 'index', label: 'index.html', kind: 'file', x: 745, y: 285, parent: 'root', bytes: 561 },
  { id: 'main', label: 'main.jsx', kind: 'file', x: 315, y: 395, parent: 'src', bytes: 163 },
  { id: 'app', label: 'App.jsx', kind: 'file', x: 470, y: 395, parent: 'src', bytes: 305 },
  { id: 'style', label: 'style.css', kind: 'file', x: 620, y: 395, parent: 'src', bytes: 297 },
];
const N = (id: string): TreeNode => NODES.find((n) => n.id === id)!;

const CALLS = [
  { text: "mkdirSync('/src')", y: 150 },
  { text: "writeFileSync('/index.html', …)", y: 200 },
  { text: "writeFileSync('/src/App.jsx', …)", y: 250 },
  { text: "readFileSync('/src/App.jsx')", y: 300 },
  { text: 'toSnapshot()', y: 350 },
  { text: "syncFile('/src/App.jsx')", y: 400 },
] as const;
const CALL_X = 82;
const CALL_W = 268;

// FSNode type card (verbatim from virtual-fs.ts)
const CARD = { x: 880, y: 96, w: 316, h: 158 } as const;
const CARD_LINES = [
  'interface FSNode {',
  "  type: 'file' | 'directory'",
  '  content?: Uint8Array',
  '  children?: Map<string, FSNode>',
  '  mtime: number;  ino: number',
  '}',
] as const;

// the read walk: root → src → App.jsx (order of nodes visited)
const WALK: TreeNode[] = [N('root'), N('src'), N('app')];

// snapshot tape — five file/dir entries sliding into cells
const TAPE = { x: 120, y: 545, w: 640, h: 46, cellW: 124, gap: 6 } as const;
const TAPE_ENTRIES = ['/src', '/index.html', '/src/main.jsx', '/src/App.jsx', '/src/style.css'] as const;

// worker zone + twin tree (same shape, scaled down)
const WORKER = { x: 830, y: 330, w: 370, h: 250 } as const;
const TWIN_C = { x: 1015, y: 380 } as const; // twin root position
const twinPos = (n: TreeNode): { x: number; y: number } => ({
  x: TWIN_C.x + (n.x - N('root').x) * 0.42,
  y: TWIN_C.y + (n.y - N('root').y) * 0.62,
});

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_CARD: CameraState = { x: 860, y: 230, k: 1.28 };
const CAM_TREE: CameraState = { x: 540, y: 300, k: 1.25 };
const CAM_WORKER: CameraState = { x: 860, y: 420, k: 1.2 };

// ---------------------------------------------------------------------------
// Timeline (~86s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);

  const diskU = tl.channel('diskU', 0); // the crossed-out disk
  const diskOp = tl.channel('diskOp', 1);
  const cardU = tl.channel('cardU', 0); // FSNode card
  const call = CALLS.map((_, i) => tl.channel(`call${i}`, 0));

  // per-node entrance channels (root first, then growth)
  const nodeU = NODES.map((n) => tl.channel(`n_${n.id}`, 0));
  const walkU = tl.channel('walkU', 0); // the read probe, 0..1 across WALK
  const getChip = tl.channel('getChip', 0); // children.get('src') label
  const bytesU = tl.channel('bytesU', 0); // Uint8Array flies back
  const tapeU = tl.channel('tapeU', 0); // tree flattens into the tape
  const shipU = tl.channel('shipU', 0); // tape slides toward the worker
  const workerU = tl.channel('workerU', 0); // worker zone draws
  const twinU = tl.channel('twinU', 0); // twin tree regrows (windowed)
  const syncU = tl.channel('syncU', 0); // syncFile packet crosses
  const twinGlow = tl.channel('twinGlow', 0);
  const watchU = tl.channel('watchU', 0); // watch('/src') chip
  const bellU = tl.channel('bellU', 0); // the bell rings (pulse)
  const dimU = tl.channel('dimU', 0); // everything dims for the closer
  const closeU = tl.channel('closeU', 0);

  // — beat 1 · no down there —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'Every line of Node code assumes a disk is down there somewhere. In a browser tab there is no down there — so the filesystem has to be built out of thin air.',
  });
  tl.tween(diskU, 1, { at: 0.8, dur: 1.2, ease: ease.draw });
  tl.hold(7.1, 0.5);

  // — beat 2 · one recursive value —
  tl.caption({
    at: 7.6,
    dur: 6.6,
    text: 'Here is the whole trick, in one recursive value. A node is either a file holding raw bytes, or a directory holding a map from names to more nodes.',
  });
  tl.tween(cam, CAM_CARD, { at: 7.8, dur: 1.3, ease: ease.move });
  tl.tween(diskOp, 0, { at: 7.8, dur: 0.9, ease: ease.move });
  tl.tween(cardU, 1, { at: 8.4, dur: 1.4, ease: ease.draw });
  tl.tween(nodeU[0], 1, { at: 12.2, dur: 0.7, ease: ease.enter }); // the root appears
  tl.hold(14.2, 0.4);

  // — beat 3 · mkdir grows a hub —
  tl.caption({
    at: 14.6,
    dur: 4.6,
    text: 'Make a directory, and a new hub appears in its parent map.',
  });
  tl.tween(cam, CAM_TREE, { at: 14.7, dur: 1.3, ease: ease.move });
  tl.tween(call[0], 1, { at: 15.0, dur: 0.5, ease: ease.enter });
  tl.tween(nodeU[1], 1, { at: 16.0, dur: 0.8, ease: ease.enter }); // src/
  tl.hold(19.2, 0.4);

  // — beat 4 · writes hang leaves —
  tl.caption({
    at: 19.6,
    dur: 6.2,
    text: 'Write a file, and its bytes hang off the tree as a typed array — every byte accounted for, all of it in memory.',
  });
  tl.tween(call[1], 1, { at: 19.9, dur: 0.5, ease: ease.enter });
  tl.tween(nodeU[2], 1, { at: 20.6, dur: 0.8, ease: ease.enter }); // index.html
  tl.tween(call[2], 1, { at: 21.6, dur: 0.5, ease: ease.enter });
  tl.tween(nodeU[3], 1, { at: 22.4, dur: 0.7, ease: ease.enter }); // main.jsx
  tl.tween(nodeU[4], 1, { at: 23.0, dur: 0.7, ease: ease.enter }); // App.jsx
  tl.tween(nodeU[5], 1, { at: 23.6, dur: 0.7, ease: ease.enter }); // style.css
  tl.hold(25.8, 0.5);

  // — beat 5 · reading is a walk —
  tl.caption({
    at: 26.3,
    dur: 6.0,
    text: 'Reading is a walk. Start at the root, look up each path segment in the children map, and land on the node.',
  });
  tl.tween(call[3], 1, { at: 26.6, dur: 0.5, ease: ease.enter });
  tl.tween(walkU, 0.5, { at: 27.4, dur: 1.4, ease: ease.move }); // root → src
  tl.tween(getChip, 1, { at: 27.6, dur: 0.5, ease: ease.pop });
  tl.tween(walkU, 1, { at: 29.4, dur: 1.4, ease: ease.move }); // src → App.jsx
  tl.tween(getChip, 0, { at: 30.6, dur: 0.6, ease: ease.move });
  tl.hold(32.3, 0.4);

  // — beat 6 · the bytes come back —
  tl.caption({
    at: 32.7,
    dur: 5.6,
    text: 'The bytes come straight back. No disk ever spins, because there is no disk — just pointers chasing pointers.',
  });
  tl.tween(bytesU, 1, { at: 33.2, dur: 1.6, ease: ease.linear });
  tl.hold(38.3, 0.5);

  // — beat 7 · flatten to a snapshot —
  tl.caption({
    at: 38.8,
    dur: 6.2,
    text: "And because the disk is a value, you can do something a real disk can't: flatten the entire filesystem into a snapshot, in one call.",
  });
  tl.tween(cam, CAM_WIDE, { at: 39.0, dur: 1.3, ease: ease.move });
  tl.tween(call[4], 1, { at: 39.4, dur: 0.5, ease: ease.enter });
  tl.tween(tapeU, 1, { at: 40.2, dur: 2.8, ease: ease.linear });
  tl.hold(45.0, 0.5);

  // — beat 8 · ship it to a worker —
  tl.caption({
    at: 45.5,
    dur: 6.6,
    text: 'Ship that snapshot into a web worker, and the exact same tree regrows on the other side — ready to run code without ever blocking the page.',
  });
  tl.tween(workerU, 1, { at: 45.8, dur: 1.2, ease: ease.draw });
  tl.tween(shipU, 1, { at: 47.0, dur: 1.6, ease: ease.linear });
  tl.tween(cam, CAM_WORKER, { at: 47.6, dur: 1.3, ease: ease.move });
  tl.tween(twinU, 1, { at: 48.8, dur: 2.4, ease: ease.linear });
  tl.hold(52.1, 0.5);

  // — beat 9 · twins in step —
  tl.caption({
    at: 52.6,
    dur: 5.4,
    text: 'From then on every edit is synced across, file by file, so the twin never drifts from the original.',
  });
  tl.tween(call[5], 1, { at: 52.9, dur: 0.5, ease: ease.enter });
  tl.tween(syncU, 1, { at: 53.6, dur: 1.8, ease: ease.linear });
  tl.tween(twinGlow, 1, { at: 55.4, dur: 0.4, ease: ease.pop });
  tl.tween(twinGlow, 0, { at: 56.4, dur: 0.8, ease: ease.move });
  tl.hold(58.0, 0.4);

  // — beat 10 · the watcher bell —
  tl.caption({
    at: 58.4,
    dur: 7.0,
    text: 'One more thing rides along: watchers. Anyone can subscribe to a directory, and every write rings their bell. Remember that bell — hot reload is going to live on it.',
  });
  tl.tween(cam, CAM_TREE, { at: 58.6, dur: 1.3, ease: ease.move });
  tl.tween(watchU, 1, { at: 59.2, dur: 0.6, ease: ease.enter });
  tl.tween(bellU, 1, { at: 61.0, dur: 0.5, ease: ease.pop });
  tl.tween(bellU, 0, { at: 62.2, dur: 0.6, ease: ease.move });
  tl.tween(bellU, 1, { at: 63.0, dur: 0.5, ease: ease.pop });
  tl.tween(bellU, 0, { at: 64.2, dur: 0.8, ease: ease.move });
  tl.hold(65.4, 0.4);

  // — beat 11 · the closer —
  tl.caption({
    at: 65.8,
    dur: 5.6,
    text: 'A filesystem, it turns out, is just a data structure with good manners.',
  });
  tl.tween(cam, CAM_WIDE, { at: 66.0, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 66.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 67.2, dur: 0.9, ease: ease.enter });
  tl.hold(71.4, 1.4);

  return {
    tl,
    cam,
    diskU,
    diskOp,
    cardU,
    call,
    nodeU,
    walkU,
    getChip,
    bytesU,
    tapeU,
    shipU,
    workerU,
    twinU,
    syncU,
    twinGlow,
    watchU,
    bellU,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function TreeNodeBox({
  n,
  u,
  hot,
  scale = 1,
  at,
}: {
  n: TreeNode;
  u: number;
  hot?: boolean;
  scale?: number;
  at?: { x: number; y: number };
}) {
  if (u <= 0) return null;
  const p = at ?? { x: n.x, y: n.y };
  const w = (n.kind === 'dir' ? 86 : 108) * scale;
  const h = 40 * scale;
  return (
    <g opacity={u}>
      <rect
        x={p.x - w / 2}
        y={p.y - h / 2}
        width={w}
        height={h}
        rx={n.kind === 'dir' ? h / 2 : 8 * scale}
        fill={colors.PANEL}
        stroke={hot ? colors.WARM : n.kind === 'dir' ? colors.ACCENT : colors.GRID}
        strokeWidth={hot ? 2.2 : 1.4}
      />
      <text x={p.x} y={p.y + 4.5 * scale} textAnchor="middle" fill={hot ? colors.WARM : colors.TEXT} fontSize={13.5 * scale} fontFamily={MONO}>
        {n.label}
      </text>
      {n.kind === 'file' && n.bytes !== undefined && scale > 0.7 && (
        <text x={p.x} y={p.y + h / 2 + 15} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
          {n.bytes} B
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const diskU = s.get(scene.diskU) * s.get(scene.diskOp);
  const cardU = s.get(scene.cardU);
  const walkU = s.get(scene.walkU);
  const bytesU = s.get(scene.bytesU);
  const tapeU = s.get(scene.tapeU);
  const shipU = s.get(scene.shipU);
  const workerU = s.get(scene.workerU);
  const twinU = s.get(scene.twinU);
  const syncU = s.get(scene.syncU);
  const twinGlow = s.get(scene.twinGlow);
  const watchU = s.get(scene.watchU);
  const bellU = s.get(scene.bellU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);
  const machineOp = 1 - 0.9 * dimU;

  // the read probe rides root → src → App.jsx
  const probe =
    walkU <= 0.5
      ? { x: lerp(N('root').x, N('src').x, walkU * 2), y: lerp(N('root').y, N('src').y, walkU * 2) }
      : { x: lerp(N('src').x, N('app').x, (walkU - 0.5) * 2), y: lerp(N('src').y, N('app').y, (walkU - 0.5) * 2) };
  const walkHot = (id: string): boolean =>
    (id === 'root' && walkU > 0) || (id === 'src' && walkU >= 0.45) || (id === 'app' && walkU >= 0.95);

  // bytes fly App.jsx → the read call chip
  const bytesP = {
    x: lerp(N('app').x, CALL_X + CALL_W, bytesU),
    y: lerp(N('app').y, CALLS[3].y + 15, bytesU),
  };

  // sync packet: call chip → across the boundary → twin app node
  const twinApp = twinPos(N('app'));
  const syncP = {
    x: lerp(CALL_X + CALL_W, twinApp.x, syncU),
    y: lerp(CALLS[5].y + 15, twinApp.y, syncU),
  };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* beat 1 — the disk that isn't there */}
        <g opacity={diskU}>
          <ellipse cx={640} cy={330} rx={150} ry={44} fill="none" stroke={colors.MUTED} strokeWidth={1.6} />
          <ellipse cx={640} cy={300} rx={150} ry={44} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.6} />
          <text x={640} y={306} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            /dev/sda
          </text>
          <line x1={500} y1={400} x2={780} y2={230} stroke={colors.NEGATIVE} strokeWidth={4} opacity={clamp01(diskU * 2 - 0.8)} />
          <line x1={500} y1={230} x2={780} y2={400} stroke={colors.NEGATIVE} strokeWidth={4} opacity={clamp01(diskU * 2 - 0.8)} />
        </g>

        <g opacity={machineOp}>
          {/* FSNode card — verbatim from virtual-fs.ts */}
          <g opacity={cardU}>
            <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
            <text x={CARD.x + 18} y={CARD.y - 10} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              virtual-fs.ts
            </text>
            {CARD_LINES.map((line, i) => (
              <text key={i} x={CARD.x + 18} y={CARD.y + 30 + i * 22} fill={i === 2 || i === 3 ? colors.ACCENT : colors.TEXT} fontSize={13} fontFamily={MONO}>
                {line}
              </text>
            ))}
          </g>

          {/* call chips */}
          {CALLS.map((c, i) => {
            const u = s.get(scene.call[i]);
            if (u <= 0) return null;
            return (
              <g key={c.text} opacity={u * 0.95}>
                <rect x={CALL_X} y={c.y - 4 * (1 - u)} width={CALL_W} height={34} rx={8} fill={colors.BG} stroke={colors.GRID} />
                <text x={CALL_X + 12} y={c.y + 18} fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
                  {c.text}
                </text>
              </g>
            );
          })}

          {/* tree edges */}
          {NODES.filter((n) => n.parent).map((n) => {
            const u = s.get(scene.nodeU[NODES.indexOf(n)]);
            const p = N(n.parent!);
            const hot = walkHot(n.id) && walkHot(p.id);
            return (
              <line
                key={`e-${n.id}`}
                x1={p.x}
                y1={p.y + 20}
                x2={n.x}
                y2={n.y - 20}
                stroke={hot ? colors.WARM : colors.GRID}
                strokeWidth={hot ? 2.2 : 1.3}
                opacity={u * (1 - 0.55 * tapeU)}
              />
            );
          })}

          {/* the children.get chip riding the walk */}
          <g opacity={s.get(scene.getChip)}>
            <rect x={probe.x + 16} y={probe.y - 40} width={168} height={26} rx={7} fill={colors.BG} stroke={colors.WARM} />
            <text x={probe.x + 100} y={probe.y - 22} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
              {walkU <= 0.5 ? "children.get('src')" : "children.get('App.jsx')"}
            </text>
          </g>

          {/* tree nodes — they sink toward the tape as tapeU rises */}
          {NODES.map((n, i) => {
            const u = s.get(scene.nodeU[i]);
            const cellI = n.id === 'src' ? 0 : n.id === 'index' ? 1 : n.id === 'main' ? 2 : n.id === 'app' ? 3 : 4;
            const tapeP = {
              x: TAPE.x + cellI * (TAPE.cellW + TAPE.gap) + TAPE.cellW / 2 + shipU * 240,
              y: TAPE.y + TAPE.h / 2,
            };
            const sinkU = n.id === 'root' ? 0 : clamp01(tapeU * 1.4 - cellI * 0.08);
            const at = { x: lerp(n.x, tapeP.x, sinkU), y: lerp(n.y, tapeP.y, sinkU) };
            return (
              <TreeNodeBox
                key={n.id}
                n={n}
                u={u * (n.id === 'root' ? 1 - 0.7 * tapeU : 1)}
                hot={walkHot(n.id) && walkU > 0 && tapeU < 0.1}
                scale={1 - 0.28 * sinkU}
                at={at}
              />
            );
          })}

          {/* the read probe + returning bytes */}
          {walkU > 0 && walkU < 1 && <circle cx={probe.x} cy={probe.y} r={7} fill="none" stroke={colors.WARM} strokeWidth={2.2} />}
          {bytesU > 0 && bytesU < 1 && (
            <g>
              <circle cx={bytesP.x} cy={bytesP.y} r={8} fill={colors.POSITIVE} stroke={colors.BG} strokeWidth={1.5} />
              <text x={bytesP.x} y={bytesP.y - 14} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                Uint8Array(305)
              </text>
            </g>
          )}

          {/* the snapshot tape rail */}
          <g opacity={clamp01(tapeU * 3) * (1 - shipU * 0.4)}>
            <rect x={TAPE.x - 14} y={TAPE.y - 8} width={TAPE.w + 28} height={TAPE.h + 16} rx={10} fill="none" stroke={colors.GRID} strokeDasharray="5 5" />
            <text x={TAPE.x - 14} y={TAPE.y - 18} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              {'VFSSnapshot · files: [{ path, content }]'}
            </text>
          </g>
          {/* tape cell outlines under the sunk nodes */}
          {TAPE_ENTRIES.map((_, i) => (
            <rect
              key={i}
              x={TAPE.x + i * (TAPE.cellW + TAPE.gap) + shipU * 240}
              y={TAPE.y}
              width={TAPE.cellW}
              height={TAPE.h}
              rx={8}
              fill="none"
              stroke={colors.SECONDARY}
              opacity={clamp01(tapeU * 1.4 - i * 0.08) * 0.7}
            />
          ))}

          {/* the worker zone + twin tree */}
          <Zone x={WORKER.x} y={WORKER.y} w={WORKER.w} h={WORKER.h} label="Web Worker · runtime-worker.ts" kind="group" u={workerU} color={colors.SECONDARY} />
          <g opacity={clamp01(workerU * 2 - 0.5)}>
            <text x={WORKER.x + 16} y={WORKER.y + WORKER.h - 16} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              VirtualFS.fromSnapshot(snapshot)
            </text>
          </g>
          {NODES.map((n, i) => {
            const order = NODES.indexOf(n);
            const u = clamp01(twinU * (NODES.length + 1) - order) * s.get(scene.nodeU[i]);
            if (u <= 0) return null;
            const p = twinPos(n);
            return (
              <g key={`twin-${n.id}`}>
                {n.parent && (
                  <line
                    x1={twinPos(N(n.parent)).x}
                    y1={twinPos(N(n.parent)).y + 10}
                    x2={p.x}
                    y2={p.y - 10}
                    stroke={colors.GRID}
                    strokeWidth={1}
                    opacity={u}
                  />
                )}
                <TreeNodeBox n={n} u={u} scale={0.55} at={p} hot={twinGlow > 0.2 && n.id === 'app'} />
              </g>
            );
          })}

          {/* the sync packet */}
          {syncU > 0 && syncU < 1 && (
            <g>
              <circle cx={syncP.x} cy={syncP.y} r={7} fill={colors.ACCENT} stroke={colors.BG} strokeWidth={1.5} />
              <text x={syncP.x} y={syncP.y - 13} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>
                syncFile
              </text>
            </g>
          )}

          {/* the watcher bell on /src */}
          <g opacity={watchU}>
            <rect x={N('src').x - 170} y={N('src').y - 16} width={116} height={30} rx={8} fill={colors.BG} stroke={bellU > 0.15 ? colors.WARM : colors.GRID} strokeWidth={1.2 + bellU} />
            <text x={N('src').x - 112} y={N('src').y + 4} textAnchor="middle" fill={bellU > 0.15 ? colors.WARM : colors.MUTED} fontSize={12} fontFamily={MONO}>
              {"watch('/src')"}
            </text>
            {bellU > 0.02 && (
              <circle cx={N('src').x} cy={N('src').y} r={26 + 18 * bellU} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={(1 - bellU) * 0.8} />
            )}
            <text x={N('src').x - 112} y={N('src').y + 36} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO} opacity={bellU}>
              'change'
            </text>
          </g>
        </g>

        {/* the closer */}
        <g opacity={closeU}>
          <rect x={340} y={280} width={600} height={120} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
          <text x={640} y={332} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={650}>
            A filesystem is a data structure
          </text>
          <text x={640} y={366} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
            {'FSNode → children: Map → content: Uint8Array'}
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
