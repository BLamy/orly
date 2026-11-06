# user-effort

**Question:** Can a tiny learned model predict how long a pointer task takes, and can that prediction, kept separate from the goals, then choose among permitted layouts for an explicitly stated task mix?

**Mechanism:** `lab/user-effort/simulator.ts` `meanDurationMs` is an authored, Fitts-style formula: `200 + 110·difficulty + 180·clutter + 80·motorContext + 65·motorContext·difficulty`, where difficulty is `log2(1 + distance/targetWidth)`, plus uniform noise of ±35 ms (`createObservations`). `lab/user-effort/predictor.ts` `createPredictor` builds a six-operation, three-layer circuit with five learned coefficients (`parameterNames`) held in source cells, using `circuit.multiply` and `roundAffine`. `trainPredictor` runs full-batch Adam (800 epochs, lr 0.04, eps 1e-8) through `backpropagateReference`. `lab/user-effort/selection.ts` `selectLayout` drops candidates that violate the constraints (`layoutViolations`) and picks the lowest probability-weighted predicted duration (`expectedCost`) among four authored `candidates`: near-small, wide-confirm, wide-details and balanced.

**Result:** Held-out RMSE against the simulator mean is 1.68 ms, versus 133.94 ms for a constant baseline. Noisy held-out error is 20.22 ms, close to the noise level of about 20.21 ms. Selection: learned effort averages 606.37 ms and matches the best candidate in 120/120 situations, while shortest-distance averages 624.08 ms and matches 88/120. In the 20 unrestricted cases the learned model matches 20/20 and distance 0/20, at an extra 102.58 ms (README:47-64).

**Status:** Works in a "deliberately favorable setting": "Predictor features deliberately match the simulator. No human observations, error prediction, or usability claim." The README frames it as "a test of the separation between prediction and goals."

**Visual idea:** Four dialog layouts side by side, each with confirm, details and cancel buttons. A probability dial sets the task mix (e.g. 80% confirm). For each layout, ghost pointers travel from the start point to each button, and each trail's length is weighted by the dial to fill an "expected ms" bar. Turning the dial to 80% details makes the shortest bar jump from wide-confirm to wide-details with no retraining. A "min width 72px" switch greys out every layout but balanced.

**Sources:**
- lab/user-effort/README.md:1-76
- lab/user-effort/predictor.ts:1-85
- lab/user-effort/selection.ts:1-44
- lab/user-effort/simulator.ts:1-20
- lab/status.md:198
- commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
