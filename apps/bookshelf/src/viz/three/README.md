# Composable 3D math library

Storybook → **3D Library / Compositions** contains AlexNet, Convolution,
Neural Network and Math Primitives. Each is a composition of the same geometry
factories in `primitives/index.ts`, rendered by `ThreeLibrary.tsx` with the existing
Player clock. Astra owns these Three.js models and integration; Fable 5.1 owns
any new D3/SVG choreography. See `docs/authoring-models.md` at the repository root.

## Available pieces

- `tensorVolume`: logical shape, bounded display sampling, per-cell values and activity.
- `featureMap`: a numerical array as a plane of colored cells.
- `neuronLayer`: instanced neurons with computed activation colors.
- `connectionBundle`: an explicit edge list (complete or caller-selected sample).
- `activationPackets`: seekable transport along those edges.
- `receptiveField`: transparent patch selector.
- `parametricSurface`: sampled analytic height field.
- `coordinateAxes` / `vectorArrow`: mathematical frames and vectors.
- `probabilityBars`: validated distributions, with probabilities stored in metadata.
- `wireBox`: volume outlines.

A composition returns `root`, `beats`, `duration`, `labels`, `disclosure` and
`sample(t)`. Construct geometry and calculate numerical data once. Sampling must
set every animated property from absolute time, including visibility when seeking
backward. Do not add an animation loop, random values, physics stepping, or D3
transitions. The common viewer fits subjects and interpolates between shot poses.
Name focus objects and use `focus: ['name']` on a beat for a close-up.

```ts
const map = featureMap(values, 8, 8, 4);
map.root.name = 'input';
root.add(map.root);
const selector = receptiveField([0.3, 1.5, 1.5]);
root.add(selector);
// In sample(t), position selector from the chosen convolution step.
```

**Export frame as GLB** downloads the currently sampled geometry, including
material colors and primitive metadata. Open it in Blender or reuse it elsewhere.
The export is a static frame; runtime camera motion, HTML labels, and time-dependent
behavior live in the composition source. Large models use explicit display sampling,
not millions of hidden meshes. This is an initial reusable library, not a claim
of production parity with the supplied reference film.

## Data contract

AlexNet shows architecture with illustrative activation patterns and sampled
connections. It does not load weights or run ImageNet inference. Its labels state
that distinction. Convolution computes three exact filters over an explicit 8×8
array. Neural Network computes a 4→6→3 forward pass using the matrices in
`examples/data.ts`; those weights are untrained. Math Primitives uses an analytic
saddle, an explicit vector and computed softmax. See `SOURCES.md`.

To add a trained network, provide real intermediate tensors through `value`, retain
logical tensor dimensions separately from display sampling, and label the weight
checkpoint, input preprocessing and class index mapping. Do not manufacture a
classifier result from decorative activations.

## Verification

`node --test tools/three/primitives.test.mjs`

`node tools/three/verify.mjs` (Storybook on port 6007)

The browser check renders all compositions, checks identical pixels after backward
seeks, records page errors, and downloads a GLB from each composition. Screenshots
and exports land under ignored `artifacts/three/` for visual review.

For editable Blender snapshots after browser verification, run
`blender -b -t 2 --python tools/three/import-blender.py`. This imports each exported
GLB and saves a matching `.blend` in `artifacts/three/`. Source compositions remain
the authoritative procedural models; snapshots are exports of one sampled frame.
