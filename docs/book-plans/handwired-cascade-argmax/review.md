# Caption review: handwired-cascade-argmax ("Picking Exactly")

Reviewer: fact-check pass (Haiku 5.5), did not write the book. Pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46, `lab/cascade-argmax/`, checked in `.orly-work/hw-books/repo` (SHA verified). Paths below are relative to the repo root.

Checks run: `bun test ./lab/cascade-argmax` gives 11 pass, 0 fail. `bun lab/cascade-argmax/report.ts` matches the book's counts (ops 56/196, 504/1764; layers 15/75, 33/150; training 160/160 over seeds 1-10; single ramp 160/160 over seeds 101-110). Scratch probes: `bit(0, 2**-149) = 1`, `bit(0.5, 0.5) = 0`, `bit(0.25, 0.75) = 1`. Gap exponent chain: -149, -126, -103, -80, -57, -34, -11, +12, then the final clamp gives 1. Compiled selected-only counts at 8 candidates: production 45, cascade 187. At 64: production 437, cascade 1699.

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | OK | | README.md:3 | "resolves distinct FP32 scores in `[0, 1]` and keeps the leftmost winner on ties" |
| 1 | 2 | OK | | src/runtime/numeric-ui-core.ts:445 | "reglu(leftTerms: Terms, leftBias: number, gateTerms: Terms, gateBias: number): Wire {" |
| 1 | 3 | OK | | lab/cascade-argmax/cascade-argmax.ts:11 | "The result is an exact bit of [right > left]" |
| 1 | 4 | OK | | lab/cascade-argmax/cascade-argmax.ts:75 | "relu(right - left + offset) in one operation: the difference forms the gate." |
| 1 | 5 | OK | | lab/cascade-argmax/cascade-argmax.ts:29 | "saturates even the smallest positive FP32 difference (2**-149) to exactly 1." |
| 1 | 6 | OK | | lab/cascade-argmax/cascade-argmax.ts:8 | "multiplying by a power of two only shifts the exponent" |
| 1 | 7 | OK | | lab/cascade-argmax/cascade-argmax.ts:9 | "clamp01(v) = v - relu(v - 1) is exact for v below 2**24" |
| 1 | 8 | OK | | lab/cascade-argmax/cascade-argmax.ts:56; src/runtime/numeric-ui-core.ts:1634 | "roundAffine replaces the former unit-gated ReGLU workaround and prevents affine composition." |
| 1 | 9 | OK | | lab/cascade-argmax/cascade-argmax.ts:28-29 | "The total gain 2**161 saturates even the smallest positive FP32 difference (2**-149) to exactly 1." |
| 1 | 10 | OK | | lab/cascade-argmax/cascade-argmax.ts:86 | "return emitClampZeroOne(circuit, value)" (exponent chain checked by probe, see notes) |
| 1 | 11 | OK | | lab/cascade-argmax/cascade-argmax.ts:31; lab/cascade-argmax/cascade-argmax.test.ts:54-68 | "Zero in the hard form (exact ties stay left)." |
| 1 | 12 | OK | | lab/cascade-argmax/cascade-argmax.ts:11-12; lab/cascade-argmax/cascade-argmax.test.ts:164-172 | "No boolean atom appears anywhere." |
| 2 | 1 | OK | | lab/cascade-argmax/cascade-argmax.ts:93, 112-132 | "Same tree shape and result contract as emitArgmax: a one-hot over the candidates plus the winning score." |
| 2 | 2 | OK | | lab/cascade-argmax/cascade-argmax.ts:122-127, 139-141 | "const leftPart = circuit.reglu([[left.score, 1]], 0, [[leftWins, 1]], 0)" |
| 2 | 3 | FIX | "follow the same rule" → "aim at the same rule" | lab/cascade-argmax/README.md:3 | "Production argmax still has a small comparison band that can keep the left candidate even when the right is slightly larger." |
| 2 | 4 | OK | | src/runtime/numeric-ui-core.ts:2735-2743 | "One FP32 step above 0.5 makes exact ties choose left without exceeding 1." ; "const leftWins = circuit.boolean(comparison)" |
| 2 | 5 | OK | | lab/cascade-argmax/cascade-argmax.ts:3-4; lab/cascade-argmax/cascade-argmax.test.ts:34 | "keeps the left candidate throughout a rounding band of roughly 2.4e-7 in absolute score" ; "const productionBandBound = 2.5e-7" |
| 2 | 6 | OK | | lab/cascade-argmax/cascade-argmax.test.ts:137-149 | "scores[6] = f32(base + ulpAt(base))" ; "assert.equal(runArgmaxTree(production, scores, backend).winner, 2)" |
| 2 | 7 | OK | | lab/cascade-argmax/cascade-argmax.test.ts:54-135; lab/cascade-argmax/README.md:5 | "Exactness tests include ties, subnormals, adjacent FP32 values, random vectors, and reference/tensor agreement." |
| 2 | 8 | OK | | lab/cascade-argmax/cascade-argmax.ts:27-28, 110 | "scores live in [0, 1]" ; "argmax scores must be within zero and one" (sampled, not exhaustive: see notes) |
| 2 | 9 | OK | | lab/cascade-argmax/README.md:27 | "\| 8 \| 56 \| 196 \| 15 \| 75 \|" (report.ts run matches) |
| 2 | 10 | OK | | lab/cascade-argmax/README.md:29 | "\| 64 \| 504 \| 1764 \| 33 \| 150 \|" (report.ts run matches) |
| 2 | 11 | FIX | "the gap is similar" → "the cascade is still about four times larger" | lab/ui-exploration/guide/examples/patterns/selection/highest-score-tree.test.ts:155 | "'45 operations, 15 layers, 88 weights'" ; probe: cascade 187 with selected-only roots. Built ratio is 3.5x (196/56), compiled is 4.2x (187/45), so "similar" blurs the number. |
| 2 | 12 | FIX | "not a minimal one. The core now has an exact tree…" → "not a proof of minimality. The core's own exact tree is … counted after compiling." | lab/cascade-argmax/README.md:31, 33 | "The long exact cascade is an available construction, not a proof of minimality." ; the 150 count is pinned by measureProgram (compiled, selected roots), not the built count |
| 3 | 1 | OK | | lab/cascade-argmax/README.md:9; lab/status.md:202 | "The hard cascade does not provide useful score gradients." |
| 3 | 2 | OK | | lab/cascade-argmax/ramp.test.ts:16-24 | "for (const scores of [[0.4, 0.6], [0.6, 0.4], [0.5, 0.5], [0, 2 ** -149]])" ; "expect([...gradient.subarray(0, 2)]).toEqual([0, 0])" |
| 3 | 3 | OK | | lab/cascade-argmax/cascade-argmax.ts:15-16 | "shrink the seven scale factors from 2**23 to an annealed gain and each clamp01 stage becomes a ramp" |
| 3 | 4 | OK | | lab/cascade-argmax/cascade-argmax.ts:17-18, 50 | "softCascadeOptions also centers the ramp on zero difference so both sides of a wrong decision receive gradient" ; "rampOffset: 0.5 / totalGain," |
| 3 | 5 | OK | | lab/cascade-argmax/training.ts:44-47; lab/cascade-argmax/README.md:11 | "The task has sixteen cases and eight candidates, with one learned score per case and candidate." |
| 3 | 6 | FIX | "with one hundred fifty epochs at each" → "with up to one hundred fifty epochs at each, stopping early once every case is right" | lab/cascade-argmax/training.ts:47, 165 | "if (stageCorrect === caseCount && epoch > 10) break" (overclaim: the loop can exit early) |
| 3 | 7 | FIX | "learns from the first epoch" → "receives gradient from the first epoch" | lab/cascade-argmax/training.ts:115-116 | "Weights start close together so every comparison sits inside the widest soft ramp and receives gradient from the first epoch." (the lab never measures learning at epoch 1) |
| 3 | 8 | OK | | lab/cascade-argmax/training.ts:170, 183-184 | "Harden: same weights, exact cascade. Winners must be exact through both evaluators." |
| 3 | 9 | OK | | lab/cascade-argmax/report.ts:65 | "Hardened winners: ${totalCorrect}/160 across 10 seeds." (run output: 160/160) |
| 3 | 10 | OK | | lab/cascade-argmax/ramp.test.ts:5-14; lab/cascade-argmax/README.md:16, 18 | "expect(ramp.circuit.operations.length).toBeLessThan(cascade.circuit.operations.length / 2)" ; "\| Single clipped ramp \| 101-110 \| 160/160 \|" |
| 3 | 11 | OK | | lab/cascade-argmax/README.md:11 | "There is no learned shared query/key function and no claim about unseen contexts." |
| 3 | 12 | OK | | lab/status.md:202 | "This fits a table, not a shared query/key rule. Hard score gradients still provide no useful learning signal." |

## Visuals in plan.md with wrong or unclear numbers

- Chapter 1 visual ("magnifier ladder"): "then clamp to 0" read as value 0, which is wrong. Changed to "then the clamp reads exponent 0 (value 1)". The exponents -149 through +12 are correct (checked by probe).
- Chapter 2 visual, beat 12: the label "available construction, not minimal" repeated the overclaim. Changed to "not a proof of minimality".
- Chapter 3 visual, beat 6: "epoch counter 150 per step" implied every stage runs all 150 epochs. Changed to "up to 150 per step, ending early once all cases are right".
- Other visual numbers checked and correct: 56/15, 196/75, 504/33, 1764/150, 45 vs 187 (labelled compiled), 2^-24 planted step (positions 2 and 6), 2^161, 16 x 8 = 128, 160 = 10 seeds x 16 cases. The 2.4e-7 band is labelled "(header)".

## Notes

- The band figure "roughly 2.4e-7" (caption 2.5, row 2/5) is the lab's own header statement and is attributed as such. A scratch probe found the largest kept-left difference at 1.86e-7 and did not reproduce 2.4e-7 exactly. The test bound of 2.5e-7 holds. Kept as OK because the caption cites the header.
- The 187 compiled count (row 2/11) is not pinned by any lab test. It reproduces with `compileTensorProgram(selected)` on the 8-candidate cascade tree. The 45 and 150 counts are test-pinned.
- Exactness is sampled, not proven (rows 2/7 and 2/8). No caption says "every pair".
- Source clone: the research notes cite `.orly-work/screencast/handwired-labs-workshop/repo` at the same SHA. This review used `.orly-work/hw-books/repo`, whose HEAD was confirmed as 4ea7fcb27ebe93acf49b9f29a93e162b975bad46.
- Chapter blurbs in book.json are not captions and were not edited. The chapter 2 blurb's "about three and a half times the built operations" (196/56) is consistent with the checked counts.
