# trace-compiler

**Question:** Can a defined numeric subset of ordinary TypeScript (here, the real photo-gallery layout code of chenglou.github.io) be compiled straight into circuit operations that agree exactly with the source?

**Mechanism:** `compile.ts` walks the TypeScript AST with symbolic values: constants fold, runtime numbers become wires, bounded loops unroll with a per-iteration mask bit, and helper functions inline. It is "not a runtime tracer and does not compile arbitrary JavaScript" (README). The `Emitter` class lowers each construct: affine steps through `Circuit.roundAffine` (to keep each FP32 rounding point), ternaries to `on * bit + off * (1 - bit)` (`select`), division by a constant to a reciprocal multiply, integer comparisons to `relu(d) - relu(d - 1)`, and continuous comparisons to the "sign cascade" in `exactPositiveBit` (ReLU, scale by 2^23, clamp, repeat until even 2^-149 saturates to 1). `annotations.ts` supplies `@fit` input ranges. `twin.ts` has FP32 and float64 source interpreters, `native.ts` runs the source in the JS engine, and `harness.ts` compares five calculations per trial. `real-slice.ts` compiles slices of a frozen copy in `fixtures/` (gallery commit f315d58). `residue-census.ts` classifies what is left.

**Result:** README "September Fixture Results": 1,174,491 circuit outputs checked, zero circuit mismatches; 1,193,491 native-JS checks, zero disagreements. Slices range from a 14-op spring step to a 25,416-op occlusion pass and a 1,580-layer 1D layout; "All rows emit zero boolean atoms." FP32 picks one fewer column than float64 at six widths (512, 756, 1000, 1244, 1488, 1732). Coverage: 64 of 221 statement units verified (29.0%, or 37.0% of the 173 numeric units).

**Status:** Partial and open. The September reassessment found bugs (block returns, nullable equality, conditional side effects, and an interpreter bug "that made an incorrect result look verified"); they now have regressions. Rejections remain: "first-match hit testing returns under a runtime condition, and spring stepping has an unbounded runtime iteration count." lab/research-sweep.md credits it with having "Falsified the margin policy for continuous comparisons and produced the relu sign cascade." lab/status.md lists it among "runtime studies".

**Visual idea:** The viewport-1732 bug: a number line near 7 where `(1732-24)*fround(1/244)` lands one FP32 step below 7. Show the old 0.5-centered score rounding it to the wrong side, then the sign cascade's stacked multiply-by-2^23-and-clamp stages amplifying that tiny gap until it slams to exactly 1.

**Sources:**
- lab/trace-compiler/README.md:1-125
- lab/trace-compiler/compile.ts:1-20, 520-562 (plus method list 141-760)
- lab/trace-compiler/fixtures/README.md:1-11
- lab/research-sweep.md:29
- lab/reassessment-2026-09-03.md:53-93
- lab/status.md:281, 289
- commit 4ea7fcb
