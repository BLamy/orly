# learned-interpreter

**Question:** Can learning recover one reusable two-instruction program, rather than a separate answer for each input, inside a fixed tiny interpreter?

**Mechanism:** `lab/learned-interpreter/program.ts` `createProgramLayout` gives instruction 0 a choice of 48 candidates (add/subtract/multiply times ordered pairs of `pointerX`, `panelLeft`, `scale`, `distractor`). Instruction 1 has 75 candidates, because it can also read instruction 0's result. That is 123 shared program cells in the source table. `buildProgram` evaluates every candidate (`emitCandidate`) and `emitInstruction` sums each one times its selector cell, a soft mixture that becomes a one-hot under `hardenProgram` (leftmost argmax). Targets are `fround((pointerX − panelLeft)·scale)` (coordinate) and `fround(fround(pointerX + panelLeft) + distractor)` (two adds). `lab/learned-interpreter/discrete-training.ts` `buildProgramLossMatrix` scores all 48x75 = 3,600 hard programs. `trainWithExpectedProgramLoss` runs Adam on `p0ᵀ L p1` through a temperature schedule of 2 down to 0.125, with `adamEpsilon` now 1e-14. `enumerateLossMatrix` and `coordinateDescentOnLossMatrix` serve as search baselines.

**Result:** With the old epsilon 1e-8: 0 recoveries. Corrected: coordinate 60/60, all fractionally certified. Two adds: 59/60 on integers, but only 15/60 pass fractional FP32 checks, because integer data "cannot identify which grouping is required" (e.g. `1 + 2^-24 − 1`). Building the table costs 707,472 + 53,060,400 instruction evaluations. The older soft-output trainer: coordinate 11/20, two adds 0/20. Data is in `study-results.json` (keys: configurations, hardStudies[6], programs[43], certificationCases 39,605) (README:63-101).

**Status:** Revised by the September reassessment: "An Adam epsilon that dominated small gradients caused most of the reported hard-loss failure." It still "evaluates every complete program before training", and "Neither establishes scalable program synthesis." The open question in status.md: "whether fractional training examples identify the required addition grouping."

**Visual idea:** Two slot-machine reels, one with 48 instruction cards and one with 75, each card's height showing its probability. As the temperature cools, the probability mass piles onto one card per reel. Side panel: the same run with epsilon 1e-8 shows the reels frozen flat. A final "FP32 probe" with `pointerX=1, panelLeft=2^-24, distractor=-1` flags winners whose addition grouping gives 2^-24 instead of 0.

**Sources:**
- lab/learned-interpreter/README.md:1-116
- lab/learned-interpreter/program.ts:12-153
- lab/learned-interpreter/discrete-training.ts:18-60, 191-204, 503-530 (plus function outline)
- lab/learned-interpreter/study-results.json (top-level keys only)
- lab/status.md:196, 244; lab/reassessment-2026-09-03.md:9, 36, 42-43
- commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
