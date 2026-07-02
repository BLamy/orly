// ---------------------------------------------------------------------------
// VIZ_SCENES — the registry of 3b1b-style explainer scenes the BOOK PLAYER can
// swap in for a step (`step.viz.scene` in a manifest). Every entry is a dynamic
// `import()` so the shelf/main bundle never eagerly grows by these scenes —
// each loads as its own chunk the first time a viz step needs it.
//
// KEEP IN SYNC with generator/viz-catalog.json (the catalog the storyboard
// pipeline validates against and shows to the storyboard author). After adding
// or renaming an entry here, update the catalog + prompt table and run
// `node generator/check-viz-catalog.mjs`.
// ---------------------------------------------------------------------------
import type { ReactNode } from 'react';
import type { SceneState, Timeline } from './core';

export type { SceneState, Timeline };

export interface VizSceneEntry {
  /** The scene's built timeline (module-scope, overrides applied). Calling it
   *  repeatedly returns the same instance — "build once per scene". */
  buildScene(): { tl: Timeline };
  /** Pure frame renderer: SVG content on the 1280×720 stage for a SceneState. */
  Render: (props: { s: SceneState }) => ReactNode;
}

/** What each explainer component module exports for embedding. */
interface VizSceneModule {
  vizScene(): { tl: Timeline };
  Render: VizSceneEntry['Render'];
}

const entry = (load: () => Promise<VizSceneModule>) => () =>
  load().then((m): VizSceneEntry => ({ buildScene: m.vizScene, Render: m.Render }));

export const VIZ_SCENES: Record<string, () => Promise<VizSceneEntry>> = {
  'fourier': entry(() => import('./explainers/fourier/Fourier')),
  'gradient-descent': entry(() => import('./explainers/gradient-descent/GradientDescent')),
  'attention': entry(() => import('./explainers/attention/Attention')),
  'diffusion': entry(() => import('./explainers/diffusion/Diffusion')),
  'raft': entry(() => import('./explainers/raft/Raft')),
  'backprop': entry(() => import('./explainers/backprop/Backprop')),
  'eigen': entry(() => import('./explainers/eigen/Eigen')),
  'convolution': entry(() => import('./explainers/convolution/Convolution')),
  'bayes': entry(() => import('./explainers/bayes/Bayes')),
  'consistent-hashing': entry(() => import('./explainers/consistent-hashing/ConsistentHashing')),
  'crdt': entry(() => import('./explainers/crdt/Crdt')),
  'central-limit': entry(() => import('./explainers/central-limit/CentralLimit')),
  'bloom-filter': entry(() => import('./explainers/bloom-filter/BloomFilter')),
  'differential-dataflow': entry(() => import('./explainers/differential-dataflow/DifferentialDataflow')),
  'replay-critic': entry(() => import('./explainers/replay-critic/ReplayCritic')),
  'almostnode-server': entry(() => import('./explainers/almostnode-server/AlmostnodeServer')),
  'almostnode-walls': entry(() => import('./explainers/almostnode-walls/AlmostnodeWalls')),
};
