# Review: Trace Compiler captions

Reviewer: Claude Haiku 5.5 (did not write the book). Source: pinned clone `.orly-work/hw-books/repo` @ `4ea7fcb27ebe93acf49b9f29a93e162b975bad46`. Paths below are relative to that clone.

**How it was checked.**
- Copied `src/`, `lab/` and `tsconfig.json` to a scratch directory outside the repo, installed `typescript6` (`typescript@6.0.2`) there, and ran `bun lab/trace-compiler/report.ts` (exit 0, about 7 s) and `bun test lab/trace-compiler` (39 pass, 0 fail). The pinned clone was not modified. The report reproduces the README counts: 1,102,635 + 68,300 + 3,556 = 1,174,491 circuit outputs with 0 circuit mismatches; 1,193,491 native outputs with 0 disagreements; 221 units; 64 compiled and verified (29.0%; 37.0% of 173 numeric); 49 candidates; 113 (65.3%) historical.
- Arithmetic and sweep checks (plain bun, scratch file `/tmp/tc-review/probe.ts`, not in the repo): the width-1732 product, the one-ulp gap, the exponent ladders and stage counts, the `emitCompare` operation count (15 for `>=` over 0..16,384), and the six widths where FP32 and float64 choose different column counts.
- Not reproduced: the 14 layers of `emitCompare` (source comment only, `src/runtime/numeric-ui-core.ts:2012`).

**Changes made.** Four captions were FIXed, in `book.json` and in the matching lines of `plan.md`. Nothing else was edited.

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | --- | --- | --- | --- | --- |
| 1 Source Becomes Wires | 1 | OK | | `lab/trace-compiler/README.md:15` | "That revision reproduces the reported statement locations and 221-photo count." |
| 1 Source Becomes Wires | 2 | OK | | `lab/trace-compiler/fixtures/README.md:3` | "(June 20, 2026, "Require finite photo gallery container width")" |
| 1 Source Becomes Wires | 3 | OK | | `lab/trace-compiler/compile.ts:4-5` | "The compiler walks the TypeScript AST with symbolic values. Compile-time constants fold;" |
| 1 Source Becomes Wires | 4 | OK | | `lab/trace-compiler/compile.ts:676` | "The substrate has no division; a / b lowers to a * (1/b)." |
| 1 Source Becomes Wires | 5 | OK | | `lab/trace-compiler/compile.ts:680`; `lab/trace-compiler/twin.ts:498` | `const reciprocal = f32(1 / b.value)` |
| 1 Source Becomes Wires | 6 | OK | | `lab/trace-compiler/compile.ts:237`; `:264-270` (`subtract`) | `const wire = this.circuit.roundAffine(wireTerms, foldedBias)` |
| 1 Source Becomes Wires | 7 | OK | | `lab/trace-compiler/compile.ts:373` | "products multiply by exact 1 or 0 and the final addition adds an exact zero." |
| 1 Source Becomes Wires | 8 | FIX | "The older form added the bit times a difference." → "The older library select form added the bit times a difference." | `lab/reassessment-2026-09-03.md:92`; `lab/status.md:217` | ``its `off + bit * (on - off)` expansion can overflow the subtraction`` |
| 1 Source Becomes Wires | 9 | OK | | `lab/trace-compiler/compile.ts:380` | "Both branches are computed even when masked off, so both must stay representable in FP32" |
| 1 Source Becomes Wires | 10 | OK | | `lab/trace-compiler/compile.ts:6`; `lab/trace-compiler/README.md:41` | "integers with @fit bounds unroll over the static range with a per-iteration mask bit." |
| 1 Source Becomes Wires | 11 | OK | | `lab/trace-compiler/README.md:62` (scope cite; `compile.ts:1-20` in plan does not say it) | "The circuit now contains affine operations as well as ReGLUs" |
| 1 Source Becomes Wires | 12 | OK | | `lab/trace-compiler/README.md:3` | "it is not a runtime tracer and does not compile arbitrary JavaScript." |
| 2 One Step Below Seven | 1 | OK | | `lab/trace-compiler/compile.ts:515-524` | "where (1732-24)*fround(1/244) lands one FP32 ulp" (reproduced: product 6.999999523162842) |
| 2 One Step Below Seven | 2 | OK | | `lab/trace-compiler/README.md:72` | "lands one FP32 step below seven" (reproduced: 7 − d = 4.76837158203125e-7 = ulp(7)) |
| 2 One Step Below Seven | 3 | OK | | `lab/trace-compiler/README.md:72`; `lab/trace-compiler/compile.ts:515-524` | "the score loses that small difference" |
| 2 One Step Below Seven | 4 | OK | | `lab/trace-compiler/compile.ts:514` | "relu(d) keeps positive values" |
| 2 One Step Below Seven | 5 | OK | | `lab/trace-compiler/compile.ts:545` | `const firstExponent = Math.min(23 - Math.ceil(Math.log2(magnitude)), 120)` (23 − 3 = 20; 2^-21 × 2^20 = 0.5) |
| 2 One Step Below Seven | 6 | OK | | `lab/trace-compiler/compile.ts:552`; `:564-571` (clamp) | `value = this.multiplyConstant(node, value, 2 ** 23)` (0.5 × 2^23 = 2^22 = 4194304) |
| 2 One Step Below Seven | 7 | OK | | `lab/trace-compiler/compile.ts:516` | "Multiplying by a power of two is exact in FP32" |
| 2 One Step Below Seven | 8 | OK | | `lab/trace-compiler/compile.ts:547`, `:550` | "keep scaling by 2**23 until even that"; `while (totalExponent < 150) {` (reproduced: 6 stages for magnitude 7) |
| 2 One Step Below Seven | 9 | FIX | "So the bit agrees with a native comparison on every input in range, ties included." → "The lab's argument is that the bit then matches a native comparison on every input in range, ties included." | `lab/trace-compiler/compile.ts:520-521`; `lab/trace-compiler/README.md:76` | "so this bit agrees with the native comparison on every" (a code-comment argument; no check samples it, README:76 calls it an "exact forward construction under the compiler's numeric assumptions") |
| 2 One Step Below Seven | 10 | OK | | `lab/trace-compiler/compile.ts:558`; `lab/trace-compiler/README.md:96` | "The cascade produces exactly 0 or 1, so downstream logic may treat the wire as integral." / "All rows emit zero boolean atoms." |
| 2 One Step Below Seven | 11 | OK | | `lab/trace-compiler/README.md:76` | "It does not make hard comparisons usefully differentiable, nor prove that a long cascade is the fastest execution method." |
| 2 One Step Below Seven | 12 | OK | | `lab/trace-compiler/README.md:78`; `src/runtime/numeric-ui-core.ts:2012` | "for operands within 0..16,384 is 15 operations and 14 layers." (reproduced: 15 operations; layers not counted) |
| 3 Five Calculations | 1 | OK | | `lab/trace-compiler/README.md:19` | "Every sampled trial runs five calculations:" |
| 3 Five Calculations | 2 | FIX | "Three run the circuit side: a literal reference evaluator, the compiled execution path, which is still Java Script and not a graphics chip, and an interpreter of the source in single precision. They must agree." → "Three must agree on the circuit's outputs: a literal reference evaluator, the compiled execution path, which is still Java Script and not a graphics chip, and a single-precision interpreter of the source." | `lab/trace-compiler/README.md:27` | "The first three must agree on the circuit outputs." (the FP32 source interpreter is one of the three; it does not run the circuit, see caption 3) |
| 3 Five Calculations | 3 | OK | | `lab/trace-compiler/README.md:29` | "The float64 interpreter must separately agree with native JS." |
| 3 Five Calculations | 4 | OK | | `lab/reassessment-2026-09-03.md:70` | "Both modes of the source interpreter share the compiler's mistake: a copied block context loses the return." (also "Its harness nevertheless reports zero mismatches"; regressions per `README.md:5`) |
| 3 Five Calculations | 5 | OK | | `lab/trace-compiler/README.md:82` | "The complete report checks 1,174,491 circuit outputs" (reproduced: 1102635 / 68300 / 3556; 0 circuit mismatches) |
| 3 Five Calculations | 6 | OK | | `lab/trace-compiler/README.md:82` | "The larger native count includes unchanged object fields and uses a different nullable representation." (reproduced: 1193491, 0 disagreements) |
| 3 Five Calculations | 7 | OK | | `lab/trace-compiler/README.md:35`; `lab/trace-compiler/report.ts` (`runRealSlices(20260706, source)`) | "These checks are sampled evidence within declared input ranges, not a proof for every supported program." |
| 3 Five Calculations | 8 | OK | | `lab/trace-compiler/README.md:31` | "Drift is reported, not treated as a compiler error." |
| 3 Five Calculations | 9 | OK | | `lab/trace-compiler/README.md:98`; `lab/trace-compiler/real-slice.ts:170-177` (widths 0..4096, 4097 trials) | "The column calculation intentionally differs between FP32 and native float64 at six of the 4,097 integer widths: 512, 756, 1000, 1244, 1488, and 1732." (reproduced by sweep) |
| 3 Five Calculations | 10 | OK | | `lab/trace-compiler/README.md:98` | "the per-column width can differ by about 240 pixels." (reproduced: max drift 2.4e+2 on the column slice; 244 px at width 512 but only about 41 px at 1732; see visual note) |
| 3 Five Calculations | 11 | OK | | `lab/trace-compiler/README.md:31` | "`(100000000 + 1) - 100000000` is zero with a rounding step after each FP32 operation, but one in native JS." |
| 3 Five Calculations | 12 | OK | | `lab/trace-compiler/compile.test.ts:387`, `:396` | "test('native validation detects an interpreter error even when circuit and twin agree', () => {" (`outputs.set('return', outputs.get('return')! + 1)`; test passes) |
| 4 How Much Is Covered | 1 | OK | | `lab/trace-compiler/README.md:104` | "The frozen render path contains 221 statement units." (reproduced: 221) |
| 4 How Much Is Covered | 2 | OK | | `lab/trace-compiler/README.md:104` | "The slices actually compile and verify 64 units: 29.0% of all units, or 37.0% of the 173 units classified as numeric." (reproduced) |
| 4 How Much Is Covered | 3 | OK | | `lab/trace-compiler/README.md:106` | "A syntax-based classifier identifies another 49 numeric candidates." (reproduced: 49) |
| 4 How Much Is Covered | 4 | OK | | `lab/trace-compiler/README.md:106` | "Adding those candidates gives the historical 113/173, or 65.3%, but those 49 have not been compiled and verified." (reproduced: 113, 65.3%) |
| 4 How Much Is Covered | 5 | OK | | `lab/trace-compiler/README.md:89`, `:91`, `:93` | `\| spring snap \| 0 \| 0 \| 0 \| 0 \| 2,000 \|`; `occlusion bits \| 25,416` (reproduced: 0, 25416, 24894) |
| 4 How Much Is Covered | 6 | OK | | `lab/trace-compiler/README.md:110` | "The deepest slice still has 1,580 layers because it accumulates positions sequentially through 221 photos." (reproduced: 1580) |
| 4 How Much Is Covered | 7 | OK | | `lab/trace-compiler/README.md:110` | "A parallel prefix sum would change rounding order, so it is not automatically interchangeable under this exactness policy." |
| 4 How Much Is Covered | 8 | OK | | `lab/trace-compiler/README.md:108`; `lab/trace-compiler/real-slice.ts:24` | "hitTest2DMode (early return from a search loop) and stepSpring (data-dependent loop bound) are" (reproduced: both rejected) |
| 4 How Much Is Covered | 9 | OK | | `lab/trace-compiler/README.md:108`; `lab/trace-compiler/compile.ts:29-43` | "Other remaining restrictions include dynamic array access, runtime allocation, string encoding, nonfinite sentinels, and browser I/O." (reproduced: probes carry named categories `[early return]`, `[dynamic loop bound]`) |
| 4 How Much Is Covered | 10 | OK | | `lab/trace-compiler/README.md:100`; `:110` | "This is not the entire application compiled unchanged." / "Neither measurement establishes GPU performance." |
| 4 How Much Is Covered | 11 | OK | | `lab/trace-compiler/README.md:112` | "Increasing coverage is an experiment to measure; it should not be inferred from syntax alone." |
| 4 How Much Is Covered | 12 | FIX | "As for standing, the status page lists the trace compiler under runtime studies with no verdict row. On its frozen fixture the checks held; coverage is still open." → "As for standing, the status page lists the trace compiler under runtime studies, with no verdict row. Its correctness note says the interpreter is checked against native JavaScript. Coverage is not on that page." | `lab/status.md:289`; `lab/status.md:220` | "runtime studies (runtime-cost, trace-compiler), each with a README"; "Its source interpreter is independently checked against native JavaScript" (status.md never says "held" or "coverage open"; that is the plan's reading, per plan.md line 6) |
| 4 How Much Is Covered | 13 | OK | | `lab/trace-compiler/README.md:104` | "The slices actually compile and verify 64 units" (recap of 64 of 221; reproduced) |

**Visuals in plan.md that show a wrong number (for the scene authors).**

1. **Chapter 3, "the five lanes", beat 9 (caption 10) and its on-screen label:** "For 1732, camera pushes on one notch … width gap labelled `≈ 240 px`." At 1732 the column-width gap is about **41 px** (220 px vs 260.7 px; 6 columns vs 7). The 240-pixel figure is the width-512 case (220 px vs 464 px = 244 px), and the report's max drift on the column slice is 2.4e+2. Fix: either label the 512 notch with ≈ 240 px, or keep 1732 and label ≈ 41 px.
2. **Chapter 2, beat 11 label `15 ops · 14 layers`:** the 15 operations are reproduced; the 14 layers come only from a source comment (`numeric-ui-core.ts:2012`) and were not measured. Fine to show, but the layer count is unverified.
3. **Chapter 4, beat 10 stamp "held on frozen fixture · coverage open":** not a number, but it puts the same status claim that caption 12 was fixed for onto the status card. Use the text in the new caption 12, or drop the stamp.

Every other number in the plan's visuals checked out against the source or the reproduced report: the `6.999999523162842`, `0.004098360426723957`, `3.0000000054977558e+38` and `NaN`/`-Infinity` values; `2^-21`, `firstExponent` 20, `4194304`; the exponent ladder `20 · 43 · 66 · 89 · 112 · 135 · 158`, the stage counts 6/6/6/7, and `2^9` for the second bar; `1,174,491 = 1,102,635 + 68,300 + 3,556`; `1,193,491`; the six widths `512 … 1732` of `4,097`; `hitTest2DMode` and `stepSpring`; and every slice op, ReGLU and layer count on the ch4 wall.
