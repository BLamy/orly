# event-window

**Question:** Can multi-frame window behavior (drag with pointer ownership, focus, click-versus-drag, a maximize toggle) be a pure feedforward function of the current input plus a small bank of latched events, trained without backpropagation through time and hardened to bit-exact agreement with plain TypeScript?

**Mechanism:** `oracle.ts` (`oracleTick`) is the plain-TS ground truth: four rectangles in a 1280x800 viewport, a 4 px slop, a 30 px title bar, and a 2x2 relation table (title = drag, body = click-toggle). `circuit.ts` (`buildEventWindowCircuit`) compiles the same behavior into 502 ops, depth 38, 6 boolean atoms. State is a "latch bank": a live press record written only on pointer-down, a drag-begin latch written when a move crosses slop, and stored state (positions, maximized, focus) written only on events. Every threshold is one form, `bit(clamp01((boundary - measure) x sharpness + 0.5))`, rounded in exact mode, a ramp in soft mode. `train.ts` (`harvestTrainingPairs`, `trainBehaviorParameters`) trains six cells (slop boundary, title boundary, four relation cells) with Adam on single-frame pairs supervising 21 decision bits, annealing sharpness 1/32 -> 0.25 -> 1 -> 4. `hardenParameterValues` rounds relations; `verifyHardenedParameters` runs closed loop against the oracle (`harness.ts` `runClosedLoop`).

**Result:** Closed loop: 0 divergences over 120,000 frames (12 seeds x 10,000), all 16 relation-table settings, 200 sequential drags (README table, `exactness.test.ts`). Training sweep: "20/20 seeds recovered", every slop in (4, 5] and title in [29, 30), 0/30000 divergences each (`training-sweep.ts`). Fixed-ramp training fails: from the true values it drifts to ~30.01 / ~3.97 and diverges 9,120 times in 10,000 frames. `boundary-probe.test.ts` proves no window of K raw inputs (K up to 256) suffices; a latched aggregate does. Cost grows +36 ops per extra press record, depth constant (`measure-cost.ts`).

**Status:** Succeeded within limits. lab/status.md: training "supplies correct internal state and decision labels. Persistent state and temporal dependencies remain." README: "Training recovers parameter cells, not structure." Next steps (double-click from archive record 1) are open.

**Visual idea:** A title-boundary line sliding along a window's y axis while a translucent sigmoid band around it narrows in four snaps (32 px, 4 px, 1 px, a quarter pixel); red/green dots for title/body presses straddle it, and the line settles inside the [29, 30) band, next to a second run where the band stays fixed and the line drifts out to 30.01.

**Sources:**
- lab/event-window/README.md:1-197
- lab/event-window/circuit.ts:136-230
- lab/event-window/train.ts:130-175
- lab/event-window (function list via grep: oracle.ts:101-294, harness.ts:21-112, train.ts:56-315)
- lab/status.md:200, 289
- commit 4ea7fcb
