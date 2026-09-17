# Orly Blender studies

Ten **review prototypes**, built in Blender 5.2.1, exported as GLB and integrated
as `Blender 3D/*` Storybook variants. Original published scenes are unchanged.
Each variant substitutes a selected spatial passage, preserves the existing
narration/timeline, and offers a Compare original button. These are not full
chapter replacements or finished fabrication/robot-simulation assets.

## Rebuild

```sh
node tools/blender/export-data.mjs
blender -b -t 2 --python tools/blender/build-models.py
npm run storybook -- --port 6007
STORYBOOK_URL=http://127.0.0.1:6007 node tools/blender/verify-studies.mjs
```

Editable `.blend` sources are regenerated under `artifacts/blender/` (gitignored).
Portable GLBs are under `apps/bookshelf/src/viz/blender/assets/`. The Blender Python
script and exact exported mathematical data are the reproducible model sources.
The GLBs carry motion bindings in node extras. `ModelViewport.tsx` samples those
bindings from the original Player; it has no independent clock. Animations are
**not baked into the .blend/GLB files**. View animated variants in Storybook.

## Scope and assumptions

1. **Shed:** bottom-edge wall pivots; 8-foot footprint and 7-foot eaves from the
   existing scene; transparent sheathing exposes the frame. Storybook replaces
   the wall-raising passage only. Roof parts are available in the asset.
2. **HiFi-UMI:** schematic shared camera origin, hand marker cubes and relative
   transform. Not measured device dimensions or reconstructed motion.
3. **Cedar bench:** spatial translation of the existing course sequence. Exploded
   spacing and dimensions are explanatory; not a fabrication model.
4. **Loss landscape:** the original seeded data and LOSS(a,b), sampled on an
   81×81 grid. Height is 0.75 world units per loss unit. Original landmark values.
5. **Table button:** enlarged joint cutaway; illustrates fastening and clearance.
6. **Pallet bar:** existing 47 + 5 + 5 + 4 + 4 = 65-inch top footprint. Fastener
   dimensions and motion exaggerated; no structural simulation.
7. **SVM:** z = x*y is one quadratic feature for XOR, not the full kernel feature
   map. Projection lines illustrate the lift; no claim of physical computation.
8. **TurboVLA:** schematic poses from the source's synthetic sinusoidal actions.
   Not measured motion, full seven-dimensional decoding, or validated kinematics.
9. **HNSW:** original node membership, edges and recorded search trace. Vertical
   position encodes layer; it is not a third embedding coordinate.
10. **Vision kernels:** the original computed image and convolution maps. Plane
    separation encodes output channels, not physical depth.

Verification checks every model loads, has no page errors, returns identical
canvas pixels after reverse seeking, and switches back to the original scene.
Representative rendered frames are visually reviewed. This is prototype QA,
not approval to replace all published chapters.

Camera framing lives in `apps/bookshelf/src/viz/blender/camera-plan.ts`.
Each model has a deliberate viewing angle and a perspective fit to its rectangular
bounds. The loss landscape moves from the overview into the saddle, local minimum,
and paired global minima; bench and tabletop detail shots expose the narrated joint.
Detail views intentionally crop unrelated geometry. Shot starts follow caption cues,
including Motion retiming, and smooth transitions are sampled from absolute time.
The camera never accumulates orbit movement between frames.

Run `node --test tools/blender/camera-plan.test.mjs` for bounds, subject targeting,
and retiming checks. Browser verification also checks loss and bench camera shots
and transitions for identical pixels after reverse seeking.

The loss-landscape variant now continues in 3D through both gradient-descent runs
and the closing beat. `loss-motion.ts` uses RUN_BAD/RUN_GOOD from the original
scene, with surface height from the same LOSS function; balls and tube trails follow
optimizer-step progress, not arc-length progress. The existing fit panel remains on
the left. No replacement D3 choreography or alternate optimizer is introduced.

For reusable mathematical geometry, see `apps/bookshelf/src/viz/three/README.md`.
