// A Dev Server With No Port
//
// Grounding: packages/almostnode/src/frameworks/vite-dev-server.ts —
// handleRequest → needsTransform → transformAndServe (esbuild.transform with
// the tsx loader → addReactRefresh → redirectNpmImports), serveCssAsModule
// (CSS imported from code is served as a self-injecting script, decided by
// the sec-fetch-dest header), startWatching → HMRUpdate { type: 'update' |
// 'full-reload', path } posted to the iframe, HMR_CLIENT_SCRIPT implementing
// import.meta.hot via window.__vite_hot_context__; frameworks/
// code-transforms.ts — addReactRefresh injects the hot-context header and
// `$RefreshReg$(App, "/src/App.tsx App")`, redirectNpmImports rewrites bare
// imports to /_npm/<package>.
//
// Centerpiece: the TRANSFORM CONVEYOR — one request card rides a rail through
// three stations while ONE persistent code panel mutates in place at each
// stop. Then the loop closes: an edit rings chapter two's watcher bell, an
// update message crosses into the iframe, and the component hot-swaps with
// its state intact.
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
import { Connection, NodeBadge } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The conveyor + the mutating code panel
// ---------------------------------------------------------------------------

const RAIL_Y = 150;
const RAIL_X0 = 150;
const RAIL_X1 = 1130;
const STATIONS = [
  { x: 400, label: 'esbuild-wasm', sub: 'loader: tsx', color: colors.ACCENT },
  { x: 680, label: 'addReactRefresh', sub: 'code-transforms.ts', color: colors.SECONDARY },
  { x: 960, label: 'redirectNpmImports', sub: '/_npm/<pkg>', color: colors.WARM },
] as const;
// card x as a function of cardX ∈ [0..4]: entry → st1 → st2 → st3 → exit
const cardPos = (u: number): number => {
  const marks = [RAIL_X0, STATIONS[0].x, STATIONS[1].x, STATIONS[2].x, RAIL_X1];
  const f = clamp01(u / 4) * 4;
  const i = Math.min(Math.floor(f), 3);
  return lerp(marks[i], marks[i + 1], f - i);
};

const PANEL = { x: 250, y: 246, w: 780, h: 216 } as const;

// the four states of ONE file, /src/App.tsx (verbatim transform outputs)
type CodeLine = { text: string; hot?: boolean };
const STATE_RAW: CodeLine[] = [
  { text: "import React, { useState } from 'react';" },
  { text: 'export default function App() {' },
  { text: '  const [count, setCount] = useState<number>(0);' },
  { text: '  return <button onClick={inc}>{count}</button>;' },
  { text: '}' },
  { text: '' },
];
const STATE_ESBUILD: CodeLine[] = [
  { text: "import React, { useState } from 'react';" },
  { text: 'export default function App() {' },
  { text: '  const [count, setCount] = useState(0);', hot: true },
  { text: "  return React.createElement('button', { onClick: inc }, count);", hot: true },
  { text: '}' },
  { text: '' },
];
const STATE_REFRESH: CodeLine[] = [
  { text: 'import.meta.hot = window.__vite_hot_context__("/src/App.tsx");', hot: true },
  { text: "import React, { useState } from 'react';" },
  { text: 'export default function App() { /* … */ }' },
  { text: '$RefreshReg$(App, "/src/App.tsx App");', hot: true },
  { text: 'import.meta.hot.accept(() =>', hot: true },
  { text: '  window.$RefreshRuntime$.performReactRefresh());', hot: true },
];
const STATE_NPM: CodeLine[] = [
  { text: 'import.meta.hot = window.__vite_hot_context__("/src/App.tsx");' },
  { text: "import React, { useState } from '/_npm/react';", hot: true },
  { text: 'export default function App() { /* … */ }' },
  { text: '$RefreshReg$(App, "/src/App.tsx App");' },
  { text: 'import.meta.hot.accept(() =>' },
  { text: '  window.$RefreshRuntime$.performReactRefresh());' },
];
const CODE_STATES = [STATE_RAW, STATE_ESBUILD, STATE_REFRESH, STATE_NPM];

// the CSS aside
const CSS = { x: 250, y: 500, w: 560, h: 92 } as const;

// ---------------------------------------------------------------------------
// The HMR loop (second half) — editor → VFS bell → server → iframe
// ---------------------------------------------------------------------------

const ED = { x: 100, y: 240, w: 310, h: 190 } as const;
const VFS_B = { x: 530, y: 336 } as const;
const SRV_B = { x: 720, y: 336 } as const;
const PREV = { x: 880, y: 240, w: 290, h: 210 } as const;

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_RAIL: CameraState = { x: 640, y: 300, k: 1.12 };
const CAM_ST = (i: number): CameraState => ({ x: STATIONS[i].x, y: 300, k: 1.28 });
const CAM_PREV: CameraState = { x: 900, y: 340, k: 1.25 };

// ---------------------------------------------------------------------------
// Timeline (~92s, twelve beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_RAIL, cameraInterp);

  const railU = tl.channel('railU', 0);
  const panelU = tl.channel('panelU', 0);
  const archU = tl.channel('archU', 0); // three stations (windowed)
  const cardX = tl.channel('cardX', 0); // the request card along the rail
  const st1U = tl.channel('st1U', 0); // panel morph: raw → esbuild output
  const st2U = tl.channel('st2U', 0); // → react refresh
  const st3U = tl.channel('st3U', 0); // → npm redirect
  const cssU = tl.channel('cssU', 0); // the stylesheet aside
  const cssOutU = tl.channel('cssOutU', 0);
  const convOp = tl.channel('convOp', 1); // conveyor fades for the HMR act

  const edU = tl.channel('edU', 0); // editor card
  const editU = tl.channel('editU', 0); // the color literal flips
  const vfsU = tl.channel('vfsU', 0);
  const srvU = tl.channel('srvU', 0);
  const prevU = tl.channel('prevU', 0);
  const bellU = tl.channel('bellU', 0); // chapter two's bell rings again
  const writeU = tl.channel('writeU', 0); // write packet editor → vfs
  const updU = tl.channel('updU', 0); // HMRUpdate packet server → iframe
  const applyU = tl.channel('applyU', 0); // the hot swap flash
  const keepU = tl.channel('keepU', 0); // "state kept" chip
  const fullU = tl.channel('fullU', 0); // the full-reload contrast chip
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — beat 1 · raw source can't ship —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'The preview iframe just asked for a component file. Raw source — types, markup in the middle of the code, bare imports. No browser can run it as it stands.',
  });
  tl.tween(panelU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.hold(6.7, 0.5);

  // — beat 2 · three stations —
  tl.caption({
    at: 7.2,
    dur: 4.8,
    text: 'So before the file leaves the main thread, the dev server runs it through three stations.',
  });
  tl.tween(railU, 1, { at: 7.4, dur: 1.2, ease: ease.draw });
  tl.tween(archU, 1, { at: 8.0, dur: 2.0, ease: ease.linear });
  tl.tween(cardX, 0.5, { at: 9.4, dur: 1.2, ease: ease.linear });
  tl.hold(11.6, 0.4);

  // — beat 3 · esbuild —
  tl.caption({
    at: 12.0,
    dur: 6.4,
    text: 'Station one: esbuild, compiled to run inside the tab itself, strips the types and turns the markup into plain function calls.',
  });
  tl.tween(cam, CAM_ST(0), { at: 12.2, dur: 1.2, ease: ease.move });
  tl.tween(cardX, 1, { at: 12.4, dur: 0.8, ease: ease.linear });
  tl.tween(st1U, 1, { at: 13.6, dur: 1.6, ease: ease.move });
  tl.hold(18.0, 0.4);

  // — beat 4 · react refresh —
  tl.caption({
    at: 18.4,
    dur: 5.8,
    text: 'Station two wires the file for hot reload: a hook at the top, and a registration for every component it finds inside.',
  });
  tl.tween(cam, CAM_ST(1), { at: 18.6, dur: 1.2, ease: ease.move });
  tl.tween(cardX, 2, { at: 18.8, dur: 1.0, ease: ease.linear });
  tl.tween(st2U, 1, { at: 20.2, dur: 1.6, ease: ease.move });
  tl.hold(23.8, 0.4);

  // — beat 5 · npm redirect —
  tl.caption({
    at: 24.2,
    dur: 6.2,
    text: "Station three rewrites the bare import. React doesn't come from a registry here — it lives behind a path the service worker knows how to route.",
  });
  tl.tween(cam, CAM_ST(2), { at: 24.4, dur: 1.2, ease: ease.move });
  tl.tween(cardX, 3, { at: 24.6, dur: 1.0, ease: ease.linear });
  tl.tween(st3U, 1, { at: 26.0, dur: 1.6, ease: ease.move });
  tl.hold(30.0, 0.4);

  // — beat 6 · stylesheets too —
  tl.caption({
    at: 30.4,
    dur: 6.4,
    text: 'Stylesheets get their own trick. Imported from code, a stylesheet is served as a little script that injects itself into the page and exports its own text.',
  });
  tl.tween(cam, CAM_WIDE, { at: 30.6, dur: 1.3, ease: ease.move });
  tl.tween(cssU, 1, { at: 31.2, dur: 0.8, ease: ease.enter });
  tl.tween(cssOutU, 1, { at: 33.4, dur: 1.2, ease: ease.move });
  tl.hold(37.2, 0.4);

  // — beat 7 · ship it —
  tl.caption({
    at: 37.6,
    dur: 4.6,
    text: 'The transformed file ships back through the worker, and the page runs. That was a request. Now for the loop.',
  });
  tl.tween(cardX, 4, { at: 38.0, dur: 1.4, ease: ease.linear });
  tl.hold(42.6, 0.4);

  // — beat 8 · edit the file —
  tl.caption({
    at: 43.0,
    dur: 4.6,
    text: 'Edit the file. One color, blue to green, saved in the editor.',
  });
  tl.tween(convOp, 0, { at: 43.1, dur: 1.1, ease: ease.move });
  tl.tween(edU, 1, { at: 43.8, dur: 0.8, ease: ease.enter });
  tl.tween(prevU, 1, { at: 44.2, dur: 0.8, ease: ease.enter });
  tl.tween(editU, 1, { at: 45.6, dur: 0.8, ease: ease.move });
  tl.hold(47.6, 0.4);

  // — beat 9 · the bell rings —
  tl.caption({
    at: 48.0,
    dur: 5.6,
    text: 'The save is just a write into the virtual filesystem — and the watcher bell from chapter two rings.',
  });
  tl.tween(vfsU, 1, { at: 48.2, dur: 0.7, ease: ease.enter });
  tl.tween(srvU, 1, { at: 48.6, dur: 0.7, ease: ease.enter });
  tl.tween(writeU, 1, { at: 49.4, dur: 1.4, ease: ease.linear });
  tl.tween(bellU, 1, { at: 50.9, dur: 0.5, ease: ease.pop });
  tl.tween(bellU, 0, { at: 52.0, dur: 0.7, ease: ease.move });
  tl.hold(53.6, 0.4);

  // — beat 10 · the update message —
  tl.caption({
    at: 54.0,
    dur: 5.4,
    text: 'The server posts an update message across to the iframe: this one path changed — swap it hot.',
  });
  tl.tween(updU, 1, { at: 54.6, dur: 1.8, ease: ease.linear });
  tl.hold(59.4, 0.4);

  // — beat 11 · the hot swap —
  tl.caption({
    at: 59.8,
    dur: 7.0,
    text: 'Inside the iframe, the hot module hook re-imports just that file, and the refresh runtime repaints the component. The counter keeps its state. Nothing reloads.',
  });
  tl.tween(cam, CAM_PREV, { at: 60.0, dur: 1.3, ease: ease.move });
  tl.tween(applyU, 1, { at: 61.0, dur: 1.0, ease: ease.move });
  tl.tween(keepU, 1, { at: 63.2, dur: 0.6, ease: ease.pop });
  tl.tween(fullU, 1, { at: 65.0, dur: 0.7, ease: ease.enter });
  tl.hold(66.8, 0.4);

  // — beat 12 · the closer —
  tl.caption({
    at: 67.2,
    dur: 6.0,
    text: 'A dev server with no port, no process, and no disk — and the feedback loop is still instant.',
  });
  tl.tween(cam, CAM_WIDE, { at: 67.4, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 67.6, dur: 1.1, ease: ease.move });
  tl.tween(closeU, 1, { at: 68.6, dur: 0.9, ease: ease.enter });
  tl.hold(72.8, 1.4);

  return {
    tl,
    cam,
    railU,
    panelU,
    archU,
    cardX,
    st1U,
    st2U,
    st3U,
    cssU,
    cssOutU,
    convOp,
    edU,
    editU,
    vfsU,
    srvU,
    prevU,
    bellU,
    writeU,
    updU,
    applyU,
    keepU,
    fullU,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function CodeBlend({ from, to, u }: { from: CodeLine[]; to: CodeLine[]; u: number }) {
  const rows = Math.max(from.length, to.length);
  return (
    <>
      {Array.from({ length: rows }, (_, i) => {
        const a = from[i]?.text ?? '';
        const b = to[i]?.text ?? '';
        const y = PANEL.y + 36 + i * 30;
        if (a === b) {
          return (
            <text key={i} x={PANEL.x + 22} y={y} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
              {a}
            </text>
          );
        }
        return (
          <g key={i}>
            {a && (
              <text x={PANEL.x + 22} y={y} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO} opacity={1 - u}>
                {a}
              </text>
            )}
            {b && (
              <text x={PANEL.x + 22} y={y} fill={to[i]?.hot ? colors.WARM : colors.TEXT} fontSize={13.5} fontFamily={MONO} opacity={u}>
                {b}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const railU = s.get(scene.railU);
  const panelU = s.get(scene.panelU);
  const archU = s.get(scene.archU);
  const cardX = s.get(scene.cardX);
  const st1U = s.get(scene.st1U);
  const st2U = s.get(scene.st2U);
  const st3U = s.get(scene.st3U);
  const cssU = s.get(scene.cssU);
  const cssOutU = s.get(scene.cssOutU);
  const convOp = s.get(scene.convOp);
  const dimU = s.get(scene.dimU);
  const machineOp = 1 - 0.88 * dimU;

  // which panel blend is active?
  const blend =
    st3U > 0
      ? { from: CODE_STATES[2], to: CODE_STATES[3], u: st3U }
      : st2U > 0
        ? { from: CODE_STATES[1], to: CODE_STATES[2], u: st2U }
        : { from: CODE_STATES[0], to: CODE_STATES[1], u: st1U };

  const cx = cardPos(cardX);
  const cardVisible = cardX > 0.01 && cardX < 3.98;

  const edU = s.get(scene.edU);
  const editU = s.get(scene.editU);
  const vfsU = s.get(scene.vfsU);
  const srvU = s.get(scene.srvU);
  const prevU = s.get(scene.prevU);
  const bellU = s.get(scene.bellU);
  const writeU = s.get(scene.writeU);
  const updU = s.get(scene.updU);
  const applyU = s.get(scene.applyU);
  const keepU = s.get(scene.keepU);
  const fullU = s.get(scene.fullU);
  const closeU = s.get(scene.closeU);

  // packets in the HMR act
  const writeP = { x: lerp(ED.x + ED.w, VFS_B.x - 66, writeU), y: lerp(ED.y + 90, VFS_B.y, writeU) };
  const updP = { x: lerp(SRV_B.x + 66, PREV.x + 20, updU), y: lerp(SRV_B.y, PREV.y + 100, updU) };
  const btnColor = applyU > 0.5 ? colors.POSITIVE : colors.ACCENT;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ============ act one — the conveyor ============ */}
        <g opacity={convOp * machineOp}>
          {/* the rail */}
          <line x1={RAIL_X0} y1={RAIL_Y} x2={lerp(RAIL_X0, RAIL_X1, railU)} y2={RAIL_Y} stroke={colors.GRID} strokeWidth={2} />

          {/* the stations */}
          {STATIONS.map((st, i) => {
            const u = clamp01(archU * 3 - i);
            if (u <= 0) return null;
            const active = (i === 0 && st1U > 0 && st1U < 1) || (i === 1 && st2U > 0 && st2U < 1) || (i === 2 && st3U > 0 && st3U < 1);
            return (
              <g key={st.label} opacity={u}>
                <rect x={st.x - 105} y={RAIL_Y - 62} width={210} height={46} rx={10} fill={colors.PANEL} stroke={st.color} strokeWidth={active ? 2.4 : 1.4} />
                <text x={st.x} y={RAIL_Y - 42} textAnchor="middle" fill={st.color} fontSize={13.5} fontFamily={MONO}>
                  {st.label}
                </text>
                <text x={st.x} y={RAIL_Y - 26} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                  {st.sub}
                </text>
                <line x1={st.x} y1={RAIL_Y - 16} x2={st.x} y2={RAIL_Y - 4} stroke={st.color} strokeWidth={1.5} opacity={0.7} />
              </g>
            );
          })}

          {/* the request card */}
          {cardVisible && (
            <g>
              <rect x={cx - 82} y={RAIL_Y + 12} width={164} height={32} rx={8} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.6} />
              <text x={cx} y={RAIL_Y + 33} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontFamily={MONO}>
                GET /src/App.tsx
              </text>
            </g>
          )}

          {/* THE code panel — one file, mutating in place */}
          <g opacity={panelU}>
            <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={PANEL.x + 18} y={PANEL.y - 10} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              /src/App.tsx · one file, transformed in place
            </text>
            <CodeBlend from={blend.from} to={blend.to} u={blend.u} />
          </g>

          {/* the stylesheet aside */}
          <g opacity={cssU}>
            <rect x={CSS.x} y={CSS.y} width={CSS.w} height={CSS.h} rx={10} fill={colors.PANEL} stroke={colors.TEAL ?? colors.ACCENT} strokeWidth={1.2} />
            <text x={CSS.x + 16} y={CSS.y + 26} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
              GET /src/style.css · sec-fetch-dest: script
            </text>
            <g opacity={cssOutU}>
              <text x={CSS.x + 16} y={CSS.y + 52} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                {"→ style.setAttribute('data-vite-dev-id', '/src/style.css')"}
              </text>
              <text x={CSS.x + 16} y={CSS.y + 74} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                {'→ document.head.appendChild(style); export default css'}
              </text>
            </g>
          </g>
        </g>

        {/* ============ act two — the HMR loop ============ */}
        <g opacity={machineOp}>
          {/* the editor */}
          <g opacity={edU}>
            <rect x={ED.x} y={ED.y} width={ED.w} height={ED.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={ED.x + 16} y={ED.y - 10} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              editor · /src/App.tsx
            </text>
            <text x={ED.x + 18} y={ED.y + 36} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              {'<button style={{'}
            </text>
            <g>
              <text x={ED.x + 34} y={ED.y + 64} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                color:
              </text>
              <text x={ED.x + 92} y={ED.y + 64} fill={colors.ACCENT} fontSize={13} fontFamily={MONO} opacity={1 - editU}>
                'blue'
              </text>
              <text x={ED.x + 92} y={ED.y + 64} fill={colors.POSITIVE} fontSize={13} fontFamily={MONO} opacity={editU}>
                'green'
              </text>
            </g>
            <text x={ED.x + 18} y={ED.y + 92} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              {'}}>{count}</button>'}
            </text>
            <g opacity={editU}>
              <rect x={ED.x + 18} y={ED.y + 124} width={92} height={28} rx={7} fill="none" stroke={colors.POSITIVE} />
              <text x={ED.x + 64} y={ED.y + 143} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5}>
                saved ⌘S
              </text>
            </g>
          </g>

          {/* VFS + server badges */}
          <NodeBadge x={VFS_B.x} y={VFS_B.y} w={124} h={56} label="VirtualFS" sublabel="watch('/src')" color={colors.POSITIVE} u={vfsU} glow={bellU} />
          <NodeBadge x={SRV_B.x} y={SRV_B.y} w={124} h={56} label="ViteDevServer" sublabel="startWatching" color={colors.ACCENT} u={srvU} />
          <Connection from={{ x: VFS_B.x + 62, y: VFS_B.y }} to={{ x: SRV_B.x - 62, y: SRV_B.y }} u={Math.min(vfsU, srvU)} color={colors.GRID} />
          {bellU > 0.02 && (
            <circle cx={VFS_B.x} cy={VFS_B.y} r={34 + 22 * bellU} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={(1 - bellU) * 0.8} />
          )}

          {/* the write packet */}
          {writeU > 0 && writeU < 1 && (
            <g>
              <circle cx={writeP.x} cy={writeP.y} r={7} fill={colors.POSITIVE} stroke={colors.BG} strokeWidth={1.5} />
              <text x={writeP.x} y={writeP.y - 13} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                writeFileSync
              </text>
            </g>
          )}

          {/* the HMRUpdate packet */}
          {updU > 0 && updU < 1 && (
            <g>
              <circle cx={updP.x} cy={updP.y} r={8} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
              <text x={updP.x} y={updP.y - 14} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                {"{ type: 'update', path: '/src/App.tsx' }"}
              </text>
            </g>
          )}

          {/* the preview iframe */}
          <g opacity={prevU}>
            <rect x={PREV.x} y={PREV.y} width={PREV.w} height={PREV.h} rx={12} fill={colors.PANEL} stroke={applyU > 0.5 ? colors.POSITIVE : colors.GRID} strokeWidth={1.4 + applyU} />
            <text x={PREV.x + 16} y={PREV.y - 10} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              preview iframe · import.meta.hot
            </text>
            <rect x={PREV.x + 16} y={PREV.y + 18} width={PREV.w - 32} height={20} rx={5} fill={colors.GRID} opacity={0.35} />
            {/* the counter button — color swaps, count stays */}
            <rect x={PREV.x + 70} y={PREV.y + 78} width={150} height={48} rx={10} fill="none" stroke={btnColor} strokeWidth={2.2} />
            <text x={PREV.x + 145} y={PREV.y + 108} textAnchor="middle" fill={btnColor} fontSize={17} fontFamily={MONO}>
              count: 3
            </text>
            <g opacity={keepU}>
              <rect x={PREV.x + 58} y={PREV.y + 146} width={174} height={30} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
              <text x={PREV.x + 145} y={PREV.y + 166} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5}>
                state kept — no reload
              </text>
            </g>
          </g>

          {/* the full-reload contrast chip */}
          <g opacity={fullU * 0.9}>
            <rect x={490} y={470} width={330} height={34} rx={8} fill={colors.BG} stroke={colors.GRID} />
            <text x={655} y={492} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
              {"index.html changed → { type: 'full-reload' }"}
            </text>
          </g>
        </g>

        {/* the closer */}
        <g opacity={closeU}>
          <rect x={340} y={280} width={600} height={110} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={640} y={328} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={650}>
            No port. No process. No disk. Still instant.
          </text>
          <text x={640} y={362} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
            {'transform → serve → watch → hot update'}
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
