// Chapter 4 — Branches are views, not copies
//
// Centerpiece: shared immutable history feeds a tree and an object store. A
// feature branch adds a suffix and then collides on one object; the conflict is
// explicit protocol state rather than a mysterious merge surprise.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  ArchitectureCard,
  ArchitectureEdge,
  ArchitectureFrame,
  ArchitectureGrid,
} from '@brett_lamy/viz-engine';

const PAPER = '#f7f7f3';
const INK = '#2b2c2a';
const MUTED = '#858780';
const BLUE = '#5b86e5';
const GREEN = '#45a56f';
const CORAL = '#ef775d';
const PINK = '#d94879';
const VIOLET = '#7d83cc';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const MAIN = { x: 185, y: 215 } as const;
const FEATURE = { x: 185, y: 380 } as const;
const UNKNOWN = { x: 185, y: 545 } as const;
const ROOT = { x: 500, y: 300 } as const;
const TREE = { x: 665, y: 300 } as const;
const GRID = { x: 810, y: 190 } as const;
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const frameU = tl.channel('frameU', 0);
  const historyU = tl.channel('historyU', 0);
  const treeU = tl.channel('treeU', 0);
  const objectsU = tl.channel('objectsU', 0);
  const forkU = tl.channel('forkU', 0);
  const featureU = tl.channel('featureU', 0);
  const conflictU = tl.channel('conflictU', 0);
  const bisectU = tl.channel('bisectU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Git gives us a useful picture of history: commits form a directed graph, and a branch is a name for a place in that graph. Electric keeps that compatibility, but changes what is authoritative.',
  });
  tl.tween(frameU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(historyU, 1, { at: 1.3, dur: 1.8, ease: ease.draw });

  tl.caption({
    at: 7.4,
    dur: 6.2,
    text: 'A stream can project the same history as a commit graph, a working tree, or a key-value object store. These are views over events, not three independent truths.',
  });
  tl.tween(cam, { x: 560, y: 310, k: 1.12 }, { at: 7.6, dur: 1.2, ease: ease.move });
  tl.tween(treeU, 1, { at: 8.5, dur: 1.4, ease: ease.enter });
  tl.tween(objectsU, 1, { at: 9.5, dur: 1.5, ease: ease.linear });

  tl.caption({
    at: 14.2,
    dur: 6.4,
    text: 'Main and feature share the same prefix. The feature branch is not a copied repository; it is a second suffix attached to the same durable history.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 14.4, dur: 1.2, ease: ease.move });
  tl.tween(forkU, 1, { at: 15.6, dur: 1.3, ease: ease.draw });
  tl.tween(featureU, 1, { at: 16.8, dur: 2.0, ease: ease.linear });

  tl.caption({
    at: 22.0,
    dur: 6.6,
    text: 'Now feature writes a new version of server code. Shared objects stay shared; only the feature suffix and its derived tree move forward.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 22.2, dur: 1.3, ease: ease.move });
  tl.tween(objectsU, 1, { at: 23.0, dur: 2.2, ease: ease.linear });

  tl.caption({
    at: 29.0,
    dur: 6.8,
    text: 'If main changes the same object, the system does not silently choose a winner. It marks the conflicting event and keeps both inputs available for review.',
  });
  tl.tween(conflictU, 1, { at: 30.0, dur: 1.0, ease: ease.pop });
  tl.tween(cam, { x: 900, y: 370, k: 1.24 }, { at: 30.2, dur: 1.2, ease: ease.move });

  tl.caption({
    at: 36.2,
    dur: 7.0,
    text: 'That is where the stream model differs from “Git, but online.” The branch, conflict, and resolution are events with offsets, digests, and evidence — not only files moved between folders.',
  });
  tl.tween(bisectU, 1, { at: 37.3, dur: 1.3, ease: ease.move });

  tl.caption({
    at: 44.2,
    dur: 7.2,
    text: 'Git remains a great shape for exchanging code. The stream is a better authority for live collaboration because every client can replay the same mutation history and converge on the same state.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 44.4, dur: 1.3, ease: ease.move });
  tl.tween(closeU, 1, { at: 46.0, dur: 1.0, ease: ease.pop });
  tl.hold(54.0, 1.2);

  return { tl, cam, frameU, historyU, treeU, objectsU, forkU, featureU, conflictU, bisectU, closeU };
}

const scene = buildScene();

function objectCells(conflictU: number, objectsU: number) {
  return [
    { label: 'AA42', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: 'A112', tone: 'blue' as const, active: 3, status: 'ready' as const },
    { label: 'C8F3', tone: 'green' as const, active: 4, status: 'ready' as const },
    { label: 'E816', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: 'F021', tone: conflictU > 0.4 ? 'pink' as const : 'neutral' as const, active: conflictU > 0.4 ? 4 : 0, status: conflictU > 0.4 ? 'conflict' as const : 'idle' as const },
    { label: '4B70', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: 'E8C4', tone: conflictU > 0.4 ? 'coral' as const : 'neutral' as const, active: conflictU > 0.4 ? 2 : 0, status: conflictU > 0.4 ? 'conflict' as const : 'idle' as const },
    { label: '87AB', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '19B4', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: 'D5C2', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '77B4', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '2DC8', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '21AA', tone: 'blue' as const, active: 3, status: 'ready' as const },
    { label: '729A', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '0DB5', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '0F62', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '7CF1', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '91FE', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '3E81', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: 'B190', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '92D0', tone: 'blue' as const, active: 2, status: 'ready' as const },
    { label: '80A5', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: 'F311', tone: 'neutral' as const, active: 0, status: 'idle' as const },
    { label: '34E0', tone: 'neutral' as const, active: 0, status: 'idle' as const },
  ].map((cell, index) => ({ ...cell, active: objectsU > index / 24 ? cell.active : 0 }));
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const frameU = s.get(scene.frameU);
  const historyU = s.get(scene.historyU);
  const treeU = s.get(scene.treeU);
  const objectsU = s.get(scene.objectsU);
  const forkU = s.get(scene.forkU);
  const featureU = s.get(scene.featureU);
  const conflictU = s.get(scene.conflictU);
  const bisectU = s.get(scene.bisectU);
  const closeU = s.get(scene.closeU);
  const protocolPulse = 0.5 + 0.5 * Math.sin(s.t * 2.4);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={PAPER} />
      <Camera {...cam}>
        <ArchitectureFrame
          x={58}
          y={44}
          w={1164}
          h={632}
          label="commit dag / tree / object network"
          rightLabel="objects 14/54 · round-trips 8"
          footer="shared prefix · explicit suffix · conflict is state"
          u={frameU}
        >
          <circle cx={1172} cy={78} r={4} fill={BLUE} opacity={0.28 + protocolPulse * 0.62} />
          <text x={120} y={114} fill={MUTED} fontSize={11} fontFamily={MONO}>COMMIT DAG</text>
          <text x={450} y={114} fill={MUTED} fontSize={11} fontFamily={MONO}>TREE /</text>
          <text x={790} y={114} fill={MUTED} fontSize={11} fontFamily={MONO}>NETWORK</text>
          <text x={960} y={114} fill={MUTED} fontSize={11} fontFamily={MONO}>KEY / VALUE STORE</text>

          <ArchitectureEdge from={{ x: MAIN.x, y: MAIN.y + 38 }} to={{ x: FEATURE.x, y: FEATURE.y - 38 }} tone="green" label="fork" flow={forkU} u={historyU} />
          <ArchitectureEdge from={{ x: FEATURE.x + 90, y: FEATURE.y }} to={{ x: ROOT.x - 90, y: ROOT.y }} via={[{ x: 320, y: FEATURE.y }, { x: 390, y: ROOT.y }]} tone="coral" label="checkout" flow={featureU} u={treeU} />
          <ArchitectureEdge from={{ x: MAIN.x + 90, y: MAIN.y }} to={{ x: ROOT.x - 90, y: ROOT.y }} via={[{ x: 320, y: MAIN.y }, { x: 390, y: ROOT.y }]} tone="green" label="shared root" flow={treeU} u={treeU} />
          <ArchitectureEdge from={{ x: ROOT.x + 90, y: ROOT.y }} to={{ x: TREE.x - 88, y: TREE.y }} tone="coral" label="tree" flow={treeU} u={treeU} />
          <ArchitectureEdge from={{ x: TREE.x + 88, y: TREE.y }} to={{ x: GRID.x - 16, y: GRID.y + 146 }} via={[{ x: 760, y: TREE.y }, { x: 760, y: GRID.y + 146 }]} tone="blue" label="objects" flow={objectsU} u={objectsU} />

          <ArchitectureCard x={MAIN.x} y={MAIN.y} w={172} h={70} label="main~1" meta="commit · 9D2A" badge="HEAD" tone="green" u={historyU} status="ready" />
          <ArchitectureCard x={FEATURE.x} y={FEATURE.y} w={184} h={70} label="feature" meta="commit · 74B1" badge="FORK" tone={featureU > 0.35 ? 'green' : 'neutral'} u={forkU} status={featureU > 0.5 ? 'ready' : undefined} />
          <ArchitectureCard x={UNKNOWN.x} y={UNKNOWN.y} w={172} h={70} label="?" meta="commit · 5AC0" badge="MISSING" tone="green" u={bisectU} dashed dim={0.2} />

          <ArchitectureCard x={ROOT.x} y={ROOT.y} w={178} h={70} label="root /" meta="tree · E8C4" badge="TREE" tone="coral" u={treeU} status="ready" />
          <ArchitectureCard x={TREE.x} y={TREE.y} w={178} h={70} label="server.ts" meta={conflictU > 0.45 ? 'blob · CONFLICT' : 'blob · D431'} badge={conflictU > 0.45 ? 'BOTH' : 'BLOB'} tone={conflictU > 0.45 ? 'pink' : 'blue'} u={objectsU} status={conflictU > 0.45 ? 'conflict' : 'ready'} dashed={conflictU > 0.45} />

          <ArchitectureGrid x={GRID.x} y={GRID.y} columns={4} rows={6} cells={objectCells(conflictU, objectsU)} cellW={76} cellH={38} gap={6} u={objectsU} dim={closeU * 0.35} />
          {conflictU > 0.02 && (
            <g opacity={conflictU}>
              <rect x={700} y={505} width={430} height={48} rx={9} fill={PAPER} stroke={PINK} strokeWidth={1.5} />
              <text x={915} y={535} textAnchor="middle" fill={PINK} fontSize={12} fontWeight={800} fontFamily={MONO}>conflict: two event suffixes · resolve explicitly</text>
            </g>
          )}
          {bisectU > 0.02 && (
            <g opacity={bisectU}>
              <path d="M268 545 C 340 510, 350 430, 360 380" fill="none" stroke={GREEN} strokeWidth={1.5} strokeDasharray="4 6" />
              <text x={290} y={600} fill={MUTED} fontSize={11} fontFamily={MONO}>first divergent offset → 0005</text>
            </g>
          )}
          {closeU > 0.02 && (
            <g opacity={closeU}>
              <rect x={340} y={135} width={600} height={52} rx={10} fill={PAPER} stroke={BLUE} strokeWidth={1.4} />
              <text x={640} y={168} textAnchor="middle" fill={INK} fontSize={16} fontWeight={800}>Git shape at the edge · stream authority underneath</text>
            </g>
          )}
        </ArchitectureFrame>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
