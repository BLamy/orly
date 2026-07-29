// Chapter 1 — Two computers, one tree
//
// Grounding: fixtures/flight/src/App.js (renders Container, Note, Counter,
// Form from the react repo's own Flight fixture), fixtures/flight/src/Counter.js
// ('use client' directive), packages/react-server/src/ReactFlightServer.js
// (renderFunctionComponent — server components execute and are unwrapped on
// the server) and packages/react-client/src/ReactFlightClient.js (the browser
// side reassembles the stream).
//
// Centerpiece: THE MELTING TREE. One component tree is pulled apart across a
// physical gap. Server components visibly execute and dissolve into their
// output; the 'use client' Counter seals shut and crosses as a reference; a
// byte stream crosses the wire and the tree stands back up in the browser.
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
/** Per-item window over one 0..1 driver channel (the stagger trick). */
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout. One machine in the middle first; then it splits into SERVER (left)
// and CLIENT (right) with the WIRE between them.
// ---------------------------------------------------------------------------

const ONE = { x: 400, y: 120, w: 480, h: 400 } as const;
const SERVER = { x: 48, y: 110, w: 470, h: 430 } as const;
const CLIENT = { x: 762, y: 110, w: 470, h: 430 } as const;
const WIRE_Y = 330;
const WIRE_X0 = SERVER.x + SERVER.w;
const WIRE_X1 = CLIENT.x;

// The fixture tree: App renders Container > (Note, Counter, Form).
// kind: 'server' components execute on the server; 'client' = 'use client'.
interface TreeNode {
  name: string;
  file: string;
  kind: 'server' | 'client';
  /** position inside a 480x400 panel, in panel-fraction coords */
  fx: number;
  fy: number;
  parent: number | null;
}
const NODES: TreeNode[] = [
  { name: 'App', file: 'App.js', kind: 'server', fx: 0.5, fy: 0.16, parent: null },
  { name: 'Container', file: 'Container.js', kind: 'server', fx: 0.5, fy: 0.42, parent: 0 },
  { name: 'Note', file: 'cjs/Note.js', kind: 'server', fx: 0.2, fy: 0.72, parent: 1 },
  { name: 'Counter', file: 'Counter.js', kind: 'client', fx: 0.5, fy: 0.72, parent: 1 },
  { name: 'Form', file: 'Form.js', kind: 'server', fx: 0.8, fy: 0.72, parent: 1 },
];
const N = NODES.length;

const nodeXY = (panel: { x: number; y: number; w: number; h: number }, n: TreeNode) => ({
  x: panel.x + n.fx * panel.w,
  y: panel.y + n.fy * panel.h,
});

// camera marks
const CAM_ONE: CameraState = { x: 640, y: 330, k: 1.12 };
const CAM_SERVER: CameraState = { x: 340, y: 330, k: 1.35 };
const CAM_COUNTER: CameraState = { x: 400, y: 420, k: 1.6 };
const CAM_WIRE: CameraState = { x: 640, y: 340, k: 1.25 };
const CAM_CLIENT: CameraState = { x: 950, y: 330, k: 1.3 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// byte stream across the wire: 18 dots, seeded offsets
const STREAM_DOTS = Array.from({ length: 18 }, (_, i) => ({
  lane: (i % 3) - 1, // -1, 0, 1
  phase: i / 18,
}));

// roadmap cards for the closing beat
const ROADMAP = [
  { t: 'Rows on a tape', s: 'the wire format' },
  { t: 'The customs gate', s: 'what can cross' },
  { t: 'Chunks that wake up', s: 'reassembly' },
  { t: 'The wire, reversed', s: 'server actions' },
];

// ---------------------------------------------------------------------------
// Timeline (~92s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_ONE, cameraInterp);

  const oneU = tl.channel('oneU', 0); // the single machine
  const treeU = tl.channel('treeU', 0); // tree draws in (staggered)
  const splitU = tl.channel('splitU', 0); // machine splits into two
  const homesU = tl.channel('homesU', 0); // db + cursor affordances
  const badU = tl.channel('badU', 0); // the two struck-out old answers
  const tintU = tl.channel('tintU', 0); // server nodes tint violet
  const meltU = tl.channel('meltU', 0); // Note executes and dissolves
  const sealU = tl.channel('sealU', 0); // Counter seals shut
  const streamU = tl.channel('streamU', 0); // bytes cross the wire
  const rebuildU = tl.channel('rebuildU', 0); // client tree stands up
  const chunkU = tl.channel('chunkU', 0); // Counter code chunk arrives
  const clickU = tl.channel('clickU', 0); // interactivity ripple
  const dimU = tl.channel('dimU', 0); // stage quiets for the roadmap
  const mapU = tl.channel('mapU', 0); // roadmap cards

  // — beat 1 · the question —
  tl.caption({
    at: 0.5,
    dur: 8.4,
    text: 'For thirty years the web has asked one question: where should the user interface live? React server components give a strange answer — in two places at once, as a single program.',
  });
  tl.tween(oneU, 1, { at: 0.7, dur: 1.2, ease: ease.draw });
  tl.hold(8.9, 0.6);

  // — beat 2 · one tree, one computer —
  tl.caption({
    at: 9.5,
    dur: 7.6,
    text: "Here is a page from React's own test fixture. An app renders a container, a note pulled from data, a counter, and a form. One tree, one computer, one bundle.",
  });
  tl.tween(treeU, 1, { at: 9.9, dur: 2.6, ease: ease.move });
  tl.hold(17.1, 0.6);

  // — beat 3 · the pieces want different homes —
  tl.caption({
    at: 17.7,
    dur: 8.2,
    text: 'But the pieces want different homes. The note needs the data sitting next to the server. The counter needs to live in the browser, where the clicks are. So the machine splits in two.',
  });
  tl.tween(homesU, 1, { at: 18.1, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_WIDE, { at: 20.2, dur: 1.4, ease: ease.move });
  tl.tween(splitU, 1, { at: 20.6, dur: 1.8, ease: ease.move });
  tl.hold(25.9, 0.6);

  // — beat 4 · the old answers pick a side —
  tl.caption({
    at: 26.5,
    dur: 8.0,
    text: 'The old answers pick a side. Ship everything to the browser, and the bundle swells with code that only reads data. Render plain markup on the server, and the counter forgets how to count.',
  });
  tl.tween(badU, 1, { at: 27.0, dur: 1.2, ease: ease.enter });
  tl.hold(34.5, 0.6);

  // — beat 5 · run each component where it belongs —
  tl.caption({
    at: 35.1,
    dur: 7.2,
    text: "React's answer is to run each component where it belongs. Everything above the boundary runs on the server, at request time. Those components execute — and then they vanish.",
  });
  tl.tween(badU, 0, { at: 35.3, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_SERVER, { at: 35.5, dur: 1.4, ease: ease.move });
  tl.tween(tintU, 1, { at: 36.6, dur: 1.4, ease: ease.move });
  tl.hold(41.7, 0.6);

  // — beat 6 · the note melts into its output —
  tl.caption({
    at: 42.3,
    dur: 8.2,
    text: 'Watch the note component. It runs once, reads its data, and dissolves into its output. No trace of its code ever leaves the server. What survives is only what it rendered.',
  });
  tl.tween(meltU, 1, { at: 42.9, dur: 3.2, ease: ease.move });
  tl.hold(49.9, 0.6);

  // — beat 7 · the counter seals shut —
  tl.caption({
    at: 50.5,
    dur: 8.2,
    text: 'The counter is different. Its file opens with the directive use client. React seals it shut on the server — it becomes a reference, not a function — with a promise to ship its real code to the browser.',
  });
  tl.tween(cam, CAM_COUNTER, { at: 50.7, dur: 1.3, ease: ease.move });
  tl.tween(sealU, 1, { at: 52.0, dur: 1.6, ease: ease.move });
  tl.hold(58.1, 0.6);

  // — beat 8 · a description crosses the wire —
  tl.caption({
    at: 58.7,
    dur: 8.2,
    text: 'So what crosses the wire is neither the markup nor the program. It is a description of the user interface — a stream React calls Flight — with holes where client code will land.',
  });
  tl.tween(cam, CAM_WIRE, { at: 58.9, dur: 1.4, ease: ease.move });
  tl.tween(streamU, 1, { at: 60.0, dur: 6.0, ease: ease.linear });
  tl.hold(66.3, 0.6);

  // — beat 9 · the tree stands back up —
  tl.caption({
    at: 66.9,
    dur: 8.6,
    text: "In the browser, React reads the description, downloads the counter's code into its hole, and stands the tree back up. Server data, client interactivity — one tree again.",
  });
  tl.tween(cam, CAM_CLIENT, { at: 67.1, dur: 1.4, ease: ease.move });
  tl.tween(rebuildU, 1, { at: 67.5, dur: 2.6, ease: ease.move });
  tl.tween(chunkU, 1, { at: 70.4, dur: 1.8, ease: ease.move });
  tl.tween(clickU, 1, { at: 72.6, dur: 1.2, ease: ease.pop });
  tl.hold(74.9, 0.6);

  // — beat 10 · the roadmap —
  tl.caption({
    at: 75.5,
    dur: 8.6,
    text: 'That wire is where the whole story lives. Next: the tape of rows that carries a React tree between two computers, the gate that decides what may cross, and the trip back.',
  });
  tl.tween(cam, CAM_WIDE, { at: 75.7, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 76.0, dur: 1.2, ease: ease.move });
  tl.tween(mapU, 1, { at: 77.2, dur: 2.2, ease: ease.enter });
  tl.hold(84.1, 1.4);

  return {
    tl,
    cam,
    oneU,
    treeU,
    splitU,
    homesU,
    badU,
    tintU,
    meltU,
    sealU,
    streamU,
    rebuildU,
    chunkU,
    clickU,
    dimU,
    mapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function NodePill({
  x,
  y,
  name,
  color,
  u,
  sealed = 0,
  melt = 0,
  ghost = 0,
}: {
  x: number;
  y: number;
  name: string;
  color: string;
  u: number;
  sealed?: number;
  melt?: number;
  ghost?: number;
}) {
  if (u <= 0) return null;
  const w = 24 + name.length * 9.5;
  const op = u * (1 - 0.82 * melt);
  return (
    <g opacity={op} transform={`translate(${x},${y}) scale(${0.75 + 0.25 * u})`}>
      <rect
        x={-w / 2}
        y={-16}
        width={w}
        height={32}
        rx={9}
        fill={ghost > 0 ? 'none' : colors.PANEL}
        stroke={color}
        strokeWidth={1.6 + sealed}
        strokeDasharray={ghost > 0 ? '4 4' : undefined}
      />
      <text x={0} y={5} textAnchor="middle" fill={color} fontSize={14.5} fontFamily={MONO} fontWeight={600}>
        {name}
      </text>
      {sealed > 0 && (
        <g opacity={sealed} transform={`translate(${w / 2 - 2},${-18})`}>
          <rect x={-7} y={-6} width={14} height={11} rx={2.5} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.4} />
          <path d="M -4 -6 v -3 a 4 4 0 0 1 8 0 v 3" fill="none" stroke={colors.ACCENT} strokeWidth={1.4} />
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const oneU = s.get(scene.oneU);
  const treeU = s.get(scene.treeU);
  const splitU = s.get(scene.splitU);
  const homesU = s.get(scene.homesU);
  const badU = s.get(scene.badU);
  const tintU = s.get(scene.tintU);
  const meltU = s.get(scene.meltU);
  const sealU = s.get(scene.sealU);
  const streamU = s.get(scene.streamU);
  const rebuildU = s.get(scene.rebuildU);
  const chunkU = s.get(scene.chunkU);
  const clickU = s.get(scene.clickU);
  const dimU = s.get(scene.dimU);
  const mapU = s.get(scene.mapU);

  // the panel the tree lives in: ONE lerps to SERVER as splitU goes 0->1
  const panel = {
    x: ONE.x + (SERVER.x - ONE.x) * splitU,
    y: ONE.y + (SERVER.y - ONE.y) * splitU,
    w: ONE.w + (SERVER.w - ONE.w) * splitU,
    h: ONE.h + (SERVER.h - ONE.h) * splitU,
  };
  const mainOp = 1 - 0.9 * dimU;

  const nodeColor = (n: TreeNode) =>
    n.kind === 'client' ? colors.ACCENT : tintU > 0 ? colors.SECONDARY : colors.TEXT;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={mainOp}>
          {/* the machine / server panel */}
          <Zone
            x={panel.x}
            y={panel.y}
            w={panel.w}
            h={panel.h}
            label={splitU > 0.5 ? 'SERVER — runs at request time' : 'one computer'}
            kind={splitU > 0.5 ? 'region' : 'group'}
            u={oneU}
            color={splitU > 0.5 ? colors.SECONDARY : colors.GRID}
          />

          {/* client panel slides in */}
          {splitU > 0.02 && (
            <g opacity={splitU}>
              <Zone
                x={CLIENT.x + (1 - splitU) * 220}
                y={CLIENT.y}
                w={CLIENT.w}
                h={CLIENT.h}
                label="CLIENT — the browser"
                kind="region"
                u={splitU}
                color={colors.ACCENT}
              />
            </g>
          )}

          {/* the wire between them */}
          {splitU > 0.6 && (
            <g opacity={(splitU - 0.6) / 0.4}>
              <line x1={WIRE_X0} y1={WIRE_Y} x2={WIRE_X1} y2={WIRE_Y} stroke={colors.GRID} strokeWidth={2} strokeDasharray="3 6" />
              <text x={(WIRE_X0 + WIRE_X1) / 2} y={WIRE_Y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                the wire
              </text>
            </g>
          )}

          {/* affordances: data next to the server, clicks next to the client */}
          <g opacity={homesU * (splitU > 0.02 ? 1 : 0.9)}>
            {/* db cylinder near the Note */}
            <g transform={`translate(${panel.x + 0.06 * panel.w},${panel.y + 0.86 * panel.h})`}>
              <ellipse cx={0} cy={-12} rx={16} ry={6} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
              <path d="M -16 -12 v 18 a 16 6 0 0 0 32 0 v -18" fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
              <text x={0} y={26} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                data
              </text>
            </g>
            {/* cursor near the client edge */}
            <g transform={`translate(${splitU > 0.02 ? CLIENT.x + CLIENT.w - 46 : ONE.x + ONE.w - 40},${splitU > 0.02 ? CLIENT.y + CLIENT.h - 60 : ONE.y + ONE.h - 56})`}>
              <path d="M 0 0 l 0 18 l 4.6 -4.2 l 3.4 7.4 l 4 -1.9 l -3.5 -7.3 l 6.3 -0.6 z" fill={colors.ACCENT} opacity={0.95} />
              <text x={8} y={30} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                clicks
              </text>
            </g>
          </g>

          {/* edges of the tree */}
          {NODES.map((n, i) => {
            if (n.parent === null) return null;
            const u = win(treeU, N, i, 2.2);
            if (u <= 0) return null;
            const p = nodeXY(panel, NODES[n.parent]);
            const c = nodeXY(panel, n);
            const meltHere = n.name === 'Note' ? meltU : 0;
            return (
              <line
                key={`e${i}`}
                x1={p.x}
                y1={p.y + 16}
                x2={p.x + (c.x - p.x) * u}
                y2={p.y + 16 + (c.y - 20 - p.y - 16) * u}
                stroke={colors.GRID}
                strokeWidth={1.4}
                opacity={0.9 * (1 - 0.8 * meltHere)}
              />
            );
          })}

          {/* nodes of the tree */}
          {NODES.map((n, i) => {
            const u = win(treeU, N, i, 2.2);
            const { x, y } = nodeXY(panel, n);
            const isNote = n.name === 'Note';
            const isCounter = n.kind === 'client';
            return (
              <g key={n.name}>
                <NodePill
                  x={x}
                  y={y}
                  name={n.name}
                  color={nodeColor(n)}
                  u={u}
                  sealed={isCounter ? sealU : 0}
                  melt={isNote ? meltU : n.kind === 'server' ? 0.0 : 0}
                />
                {/* file chip under each node, only while zoomed on server */}
                {u > 0.9 && tintU > 0.3 && !isNote && (
                  <text x={x} y={y + 30} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO} opacity={tintU * (1 - 0.85 * (isCounter ? 0 : meltU * 0))}>
                    {n.file}
                  </text>
                )}
              </g>
            );
          })}

          {/* the Note's melt: code runs -> output chip remains */}
          {meltU > 0.02 &&
            (() => {
              const { x, y } = nodeXY(panel, NODES[2]);
              const rise = 46 * clamp01(meltU * 1.2);
              return (
                <g>
                  {/* execution flash */}
                  <circle cx={x} cy={y} r={22 * clamp01(meltU * 3) * (1 - clamp01((meltU - 0.4) / 0.6))} fill="none" stroke={colors.WARM} strokeWidth={1.6} opacity={0.8 * (1 - meltU)} />
                  {/* the surviving output */}
                  <g opacity={clamp01((meltU - 0.35) / 0.5)} transform={`translate(${x},${y + rise})`}>
                    <rect x={-66} y={-14} width={132} height={28} rx={7} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.3} />
                    <text x={0} y={5} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
                      rendered output
                    </text>
                  </g>
                </g>
              );
            })()}

          {/* the 'use client' directive chip over Counter */}
          {sealU > 0.02 &&
            (() => {
              const { x, y } = nodeXY(panel, NODES[3]);
              return (
                <g opacity={sealU}>
                  <rect x={x - 56} y={y - 62} width={112} height={26} rx={7} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.3} />
                  <text x={x} y={y - 44} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontFamily={MONO}>
                    'use client'
                  </text>
                  <text x={x} y={y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
                    a reference, not a function
                  </text>
                </g>
              );
            })()}

          {/* the two struck-out old answers */}
          {badU > 0.02 && (
            <g opacity={badU * 0.95}>
              {[
                { x: 590, y: 150, t: 'ship ALL the code', s: 'bundle swells' },
                { x: 590, y: 220, t: 'ship only markup', s: 'nothing is alive' },
              ].map((b, i) => (
                <g key={i}>
                  <rect x={b.x - 92} y={b.y - 20} width={184} height={40} rx={9} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.2} opacity={0.9} />
                  <text x={b.x} y={b.y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
                    {b.t}
                  </text>
                  <text x={b.x} y={b.y + 13} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
                    {b.s}
                  </text>
                  <line x1={b.x - 92} y1={b.y + 12} x2={b.x + 92} y2={b.y - 12} stroke={colors.NEGATIVE} strokeWidth={2} opacity={0.85} />
                </g>
              ))}
            </g>
          )}

          {/* the byte stream crossing the wire */}
          {streamU > 0 &&
            STREAM_DOTS.map((d, i) => {
              const u = clamp01(streamU * 1.5 - d.phase);
              if (u <= 0 || u >= 1) return null;
              return (
                <circle
                  key={i}
                  cx={WIRE_X0 + (WIRE_X1 - WIRE_X0) * u}
                  cy={WIRE_Y + d.lane * 9}
                  r={3.2}
                  fill={colors.WARM}
                  opacity={0.95}
                />
              );
            })}
          {streamU > 0.15 && (
            <g opacity={clamp01((streamU - 0.15) / 0.3) * (1 - dimU)}>
              <rect x={(WIRE_X0 + WIRE_X1) / 2 - 42} y={WIRE_Y - 46} width={84} height={24} rx={7} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.2} />
              <text x={(WIRE_X0 + WIRE_X1) / 2} y={WIRE_Y - 29} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                Flight
              </text>
            </g>
          )}

          {/* the client-side tree standing back up */}
          {rebuildU > 0.02 &&
            NODES.map((n, i) => {
              const u = win(rebuildU, N, i, 2.2);
              if (u <= 0) return null;
              const { x, y } = nodeXY(CLIENT, n);
              const isCounter = n.kind === 'client';
              // Counter's slot is a dashed hole until its chunk arrives
              const filled = isCounter ? chunkU : 1;
              return (
                <g key={`c${n.name}`}>
                  {n.parent !== null &&
                    (() => {
                      const p = nodeXY(CLIENT, NODES[n.parent!]);
                      return <line x1={p.x} y1={p.y + 16} x2={x} y2={y - 20} stroke={colors.GRID} strokeWidth={1.4} opacity={u * 0.9} />;
                    })()}
                  <NodePill
                    x={x}
                    y={y}
                    name={isCounter && filled < 0.5 ? '?' : n.name}
                    color={n.kind === 'client' ? colors.ACCENT : colors.MUTED}
                    u={u}
                    ghost={isCounter ? 1 - filled : 0}
                  />
                  {/* interactivity ripple on the mounted Counter */}
                  {isCounter && clickU > 0.02 && clickU < 1 && (
                    <circle cx={x} cy={y} r={14 + 26 * clickU} fill="none" stroke={colors.ACCENT} strokeWidth={2 * (1 - clickU)} opacity={1 - clickU} />
                  )}
                </g>
              );
            })}

          {/* the Counter chunk packet: server edge -> client hole */}
          {chunkU > 0.02 &&
            chunkU < 0.98 &&
            (() => {
              const from = { x: WIRE_X0, y: WIRE_Y - 60 };
              const to = nodeXY(CLIENT, NODES[3]);
              const x = from.x + (to.x - from.x) * chunkU;
              const y = from.y + (to.y - from.y) * chunkU - 60 * Math.sin(Math.PI * chunkU);
              return (
                <g>
                  <rect x={x - 46} y={y - 12} width={92} height={24} rx={6} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.3} />
                  <text x={x} y={y + 4} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5} fontFamily={MONO}>
                    Counter.js
                  </text>
                </g>
              );
            })()}
        </g>

        {/* closing roadmap on a quiet stage */}
        {mapU > 0.02 && (
          <g>
            <text x={640} y={168} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700} opacity={mapU}>
              One tree. Two computers. One wire.
            </text>
            {ROADMAP.map((r, i) => {
              const u = win(mapU, ROADMAP.length, i, 2.0);
              const x = 208 + i * 290;
              return (
                <g key={r.t} opacity={u} transform={`translate(${x},${300 + 14 * (1 - u)})`}>
                  <rect x={-125} y={-46} width={250} height={100} rx={13} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
                  <text x={0} y={-30} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                    {`chapter ${i + 2}`}
                  </text>
                  <text x={0} y={0} textAnchor="middle" fill={i === 0 ? colors.WARM : colors.TEXT} fontSize={16} fontWeight={650}>
                    {r.t}
                  </text>
                  <text x={0} y={26} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                    {r.s}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
