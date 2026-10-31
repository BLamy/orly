# Trace Compiler

**Slug:** handwired-trace-compiler · **Subtitle:** Can a real gallery's layout code become exact circuits? · **Animal:** leafcutter ant · **Accent:** `#b5532f`
**Lab:** `lab/trace-compiler` of chenglou/handwired @ `4ea7fcb27ebe93acf49b9f29a93e162b975bad46` (MIT, Cheng Lou).
**Throughline noun:** the *comparison* in a layout (is this width below the threshold?), traced from source to wire to exact bit to checked answer.
**Status said plainly (ch4):** on its frozen September 2026 fixture the checks held; coverage is partial and open (64 of 221 units). `lab/status.md` has no status-table row for it; it appears only under "runtime studies" (`lab/status.md:289`) and in a correctness bullet (`:220`). "Partial and open" is our reading, not a status.md term.

**Honesty notes for the implementer.** The research could not run the lab (no `node_modules`, `typescript6` missing). Every count below (1,174,491; 1,193,491; 64/221; the slice table) is README-reported and was NOT reproduced. Captions say "the report checked", never "we ran". Arithmetic that the research did run in plain JS with `Math.fround` (the 1732 example, the select overflow) is exact and may be drawn as computed values. The cascade stage counts are computed from the formula at `compile.ts:545-554`, not from running the compiler. Frozen source = gallery commit `f315d58` (June 20, 2026), not the live gallery. The earlier plan's "twelve-category taxonomy" is wrong (code has 15 rejection categories); do not use. Do not say "ledger".

Chapter arc: ch1 how source becomes wires, ch2 the one hard operator (comparison), ch3 how the claim is attacked, ch4 how much is covered and where it stands. Four chapters because ch3 (a checking machine) and ch4 (a coverage wall) are different machines with 12+ captions each.

---

## Chapter 1: Source Becomes Wires
**Thesis:** The compiler reads real gallery source as a syntax tree, folds what is known, turns what is not into wires, and gives each operator a fixed single-precision-safe lowering.

**Visual machine: "the walker".** A frozen-source strip across the top (token chips for the expression `(width - 24) / 244`, a ternary, a bounded loop header). A glowing cursor walks the chips left to right. Each chip lands in one of two places: grey constant tray (left, "constant") or a growing circuit panel (right, "wire"). A circuit panel builds node by node; rounding-point flags glow on affine nodes.

**Beat sheet**
1. (cap 1, 2) Open on a photo-grid thumbnail wall (221 small tiles) fading to a stamp "chenglou.github.io @ f315d58 · June 20, 2026 · frozen fixture". Question card: "same answers, as a circuit?"
2. (cap 3) The source strip slides in; the cursor appears; two chip styles introduced: `constant` (grey) and `wire` (accent). Caption names "tree, not tracer": a small tree glyph above the strip with the cursor on its nodes.
3. (cap 4, 5) Cursor reaches `/ 244`: `24` and `244` drop into the constant tray; `1/244` computes into `0.004098360426723957` (f32). Label the rounding `f32(1 / b.value)`; a tag "policy, not JS division".
4. (cap 6) `width` arrives as an input wire; `width - 24` becomes a node `roundAffine` with a "rounding point kept" lock icon; a ghost "merge into consumer" arrow is struck out. Then the `multiplyConstant` node with `0.004098360426723957`. Show worked values for width 1732: `1708` then `6.999999523162842` (this foreshadows ch2).
5. (cap 7) Cursor reaches the ternary. A bit slider toggles 0/1; two product nodes `on·bit` and `off·(1−bit)` feed an `add`; the unselected product shows an exact 0.
6. (cap 8, 9) Split panel: left "old form `off + bit*(on-off)`", right "two products". Inputs `off = 3.0000000054977558e+38` (f32 of 3e38), `on = -3.0000000054977558e+38`. Bit 0: left node shows `on-off` overflowing to `-Infinity`, times 0, ends `NaN` (red); right returns `3.0000000054977558e+38`. Bit 1: left `-Infinity`, right `-3.0000000054977558e+38`. A small reject stamp `non-finite branch` appears when a branch range is out of f32.
7. (cap 10) Loop header chip `for … < n` with `n` bounded by a finite range: the loop body copies stack as columns, each with a mask bit chip `m0 m1 m2 …`; writes in a masked-off column dim.
8. (cap 11) Pull back (camera): the circuit panel shows folded weighted sums and relu nodes only; label "weighted sums and relu".
9. (cap 12) A boundary fence around the circuit with labels "numbers · fixed arrays · bounded loops · ternaries" inside and "arbitrary Java Script" outside, crossed out.

**Captions**
1. Cheng Lou's photo gallery lays out 221 photos with plain number code: widths, columns, positions. This lab asks whether that real code can become a fixed circuit with the same answers. [lab/trace-compiler/README.md:15]
2. It works on a frozen copy of the gallery's source from June 20, 2026, so every measurement can be repeated. [lab/trace-compiler/README.md:15; fixtures/README.md:3]
3. The compiler is not a tracer that watches the program run. It reads the source as a syntax tree and carries symbolic values, each one a constant or a wire. [lab/trace-compiler/README.md:3; compile.ts:99-108]
4. Anything known in advance folds away. In a width minus 24, divided by 244, the 24 and the 244 are constants, so the division becomes one multiply by one over 244. [compile.ts:673-680]
5. That reciprocal is rounded once to single precision, about four thousandths, and the lab's interpreter does the same. It's an explicit policy, not Java Script's own division. [compile.ts:676-680; twin.ts:498; README.md "Precision drift"]
6. The width is only known at run time, so it becomes a wire. Each subtraction is tagged as a rounding point, so the builder can't merge it into the next step and erase the rounding. [compile.ts:210-237; README.md "Lowering And Rounding"]
7. A conditional becomes two products and a sum: the chosen value times the bit, plus the other value times one minus the bit. Both multiply by exactly one or zero, so nothing re-rounds. [compile.ts:372-373, :391-393]
8. The older library select form added the bit times a difference. With plus and minus three times ten to the thirty-eighth, that difference overflows, and a bit of zero returned not a number. [reassessment-2026-09-03.md:92; research probe]
9. The two-product form hands back the first value untouched. Because both branches always compute, a branch that can't fit in single precision is rejected up front. [compile.ts:385-387; research probe]
10. A loop with a finite integer bound unrolls across every possible count, and a mask bit for each pass decides which writes actually count. [compile.ts:4-6; README.md:41]
11. What comes out is the kind of circuit the first book built, weighted sums and relu, only now generated from real source instead of written by hand. [compile.ts:1-20]
12. And the subset is small on purpose: numbers, fixed arrays, bounded loops, ternaries. It does not compile arbitrary Java Script. [README.md:3; README.md "Supported Constructs"]

**On-screen labels (exact):** `chenglou.github.io @ f315d58`, `fixtures/index.ts.txt`, `compile.ts`, `constant`, `wire`, `Emitter`, `affineStep`, `circuit.roundAffine`, `multiplyConstant`, `f32 = Math.fround`, `recip = f32(1/244) = 0.004098360426723957`, `1732 − 24 = 1708`, `1708 × recip = 6.999999523162842`, `select(bit, off, on) = on*bit + off*(1-bit)`, `off + bit*(on-off)`, `off = 3.0000000054977558e+38`, `NaN`, `-Infinity`, `non-finite branch`, `static range · mask bit`.

---

## Chapter 2: One Step Below Seven
**Thesis:** A comparison on continuous numbers is made exact by relu, power-of-two scaling and clamps, and the case that forced it is a viewport width of 1732.

**Visual machine: "the staircase".** Stage 1: a number line zoomed by camera push-in onto the gap between `6.999999523162842` and `7`. Stage 2: a log-scale staircase on the right where two bars (the one-step gap and the smallest positive single-precision value) climb through scale-and-clamp stages until each hits a ceiling line at 1.

**Beat sheet**
1. (cap 1) Recall the width-1732 value `6.999999523162842` from ch1 on a wide number line 0…8; the question "is it below 7?" as a marker.
2. (cap 2) Camera pushes in to the neighbourhood of 7, tick spacing shrinking; two ticks resolve: `6.999999523162842` and `7`, gap bracket `4.76837158203125e-7` = 2^-21, labelled "one step".
3. (cap 3) A gauge 0…1 with a fuzzy band around 0.5 labelled "July policy: score near 0.5"; the tiny gap sinks inside the band's rounding step and the verdict flickers red `column count wrong`.
4. (cap 4) Gauge fades. The difference `7 − d = 4.76837158203125e-7` is drawn as a bar on a log axis (`2^-21`) through a `relu` gate (a small hinge plot); negatives would clamp to zero.
5. (cap 5) Stage 1 scale by `2^20` (magnitude 7: `firstExponent = 23 − ceil(log2 7) = 20`): bar jumps to `0.5`. Label `relu(d) * 2^firstExponent`.
6. (cap 5, 6) Clamp gate (`v − relu(v − 1)`, tiny hinge plot) leaves 0.5 alone; scale by `2^23` → `4194304` (2^22); clamp → `1`; bar locks at the ceiling line.
7. (cap 7) Overlay "exact" badge: exponent shift only, mantissa untouched; clamp exact below `2^24`.
8. (cap 8) Second bar enters: the smallest positive single-precision value `2^-149`. Staircase has stages at total exponent 20 → 43 → 66 → 89 → 112 → 135 → 158; the second bar stays under the ceiling until the last stage, where `2^9` clamps to `1`. Counter "6 stages" (magnitude 7).
9. (cap 9) Zero input: bar at 0 stays 0 all the way. Equal values: `d = 0` → bit 0.
10. (cap 10) Output wire stamped `assumeRange(0,1)`, `integer: true`, with the label "no boolean atom".
11. (cap 11, 12) Camera pulls back; two side notes: "forward only, not differentiable-friendly", "operands ≥ 2^23 rejected", and a library card `emitCompare` with `a >= b` in `0..16,384`: `15 ops · 14 layers`, dimmed with "compile.ts does not use it".

**Captions**
1. Back to the width of 1732. After the multiply, the value lands just under seven, and the compiler has to say whether it is below seven. [compile.ts:515-524; research probe]
2. Zoom in and the two numbers sit exactly one step apart, a gap of about four point eight times ten to the minus seven. That is the smallest difference single precision can express here. [research probe; README.md "The Sign Cascade"]
3. The July design scaled the difference into a score near one half and rounded it. At exact column boundaries it lost that tiny step, and the column count came out wrong. [README.md "The Sign Cascade"; compile.ts:520-523]
4. The replacement first keeps only positive differences with relu. Zero or negative differences come out as zero, so equal values never register as less. [compile.ts:512-514, :541-543]
5. Then it scales by a power of two chosen from the value's declared range. For a difference bounded by seven, that's two to the twentieth, and our one-step gap becomes one half. [compile.ts:545-546; computed from the formula]
6. A clamp holds anything above one at one. Another scale by two to the twenty-third turns one half into four million, and the next clamp pins it to exactly one. [compile.ts:550-555, :564-571]
7. This is exact because scaling by a power of two only shifts the exponent, and the clamp, a value minus relu of the value minus one, stays exact below two to the twenty-fourth. [compile.ts:515-519]
8. The loop doesn't stop there. It keeps scaling until even the smallest positive single-precision number would reach one, six scale stages for a range of seven. [compile.ts:548-554; computed from the formula]
9. If the difference is zero, it stays zero through every stage. The lab's argument is that the bit then matches a native comparison on every input in range, ties included. [compile.ts:519-521]
10. What comes out is a clean zero or one, marked as an integer in the range zero to one. The current test circuits use no boolean atoms. [compile.ts:556-558; README.md:96]
11. The lab is careful about scope. This is exact going forward, but it doesn't make hard comparisons usefully differentiable, and it doesn't prove a long cascade is the fastest way to run. [README.md "The Sign Cascade"]
12. A newer library routine plans these stages from declared ranges, fifteen operations for a comparison over zero to sixteen thousand. The compiler still builds its own cascade. [README.md "Update, September 15, 2026"]

**On-screen labels (exact):** `compile.ts:525 exactPositiveBit`, `(1732-24)*fround(1/244)`, `d = 6.999999523162842`, `7`, `7 − d = 4.76837158203125e-7 = 2^-21`, `ulp(7) = 4.76837158203125e-7`, `firstExponent = min(23 − ceil(log2(magnitude)), 120)`, `while (totalExponent < 150)`, `clampZeroOneContinuous = v − relu(v − 1)`, exponent ladder `20 · 43 · 66 · 89 · 112 · 135 · 158`, `2^-149`, `assumeRange(0, 1)`, `emitCompare`, `15 operations · 14 layers`. Table of stage counts (computed from the formula): magnitude 1 → 6, 7 → 6, 1732 → 6, 16384 → 7.

---

## Chapter 3: Five Calculations
**Thesis:** The lab attacks its own exactness claim with five independent calculations per trial, and the checks hold on the fixture, with precision drift reported honestly.

**Visual machine: "the five lanes".** Five horizontal lanes (circuit reference evaluator, compiled execution, FP32 interpreter, float64 interpreter, native JS). A trial input (a viewport width) slides in from the left and splits across lanes; at the right a verdict column joins lanes 1-3 with a bracket and lanes 4-5 with a second bracket; mismatch counters tick. Lower half later becomes a 4,097-notch width ruler.

**Beat sheet**
1. (cap 1) A trial token labelled `width = 1732` enters; five empty lanes slide in.
2. (cap 2) Lanes 1-3 light in turn and a bracket joins them: "must agree", with tags `Java Script, not a GPU` on lane 2 and `FP32` on lane 3.
3. (cap 3) Lanes 4-5 light; second bracket: "must agree".
4. (cap 4) A flashback card at the left: "September 2026 review: compiler and interpreter both lost the return" with the circuit's wrong value stamped green by lanes 1-3 until lane 5 would have disagreed; regression stamp.
5. (cap 5) Counter races to `1,174,491` circuit outputs with a three-part split `1,102,635 · 68,300 · 3,556`, mismatch counter fixed at `0`.
6. (cap 6) Second counter `1,193,491` native, disagreements `0`.
7. (cap 7) Scope tags pop onto the counters: `sampled`, `declared input ranges`, `seed 20260706`, `frozen fixture`, `not a proof`.
8. (cap 8, 9) Lanes 3 and 5 slide apart into a "drift" view; a ruler of 4,097 notches (widths) appears; six notches flash `512 756 1000 1244 1488 1732` and a column-count pair (single precision one fewer).
9. (cap 10) For 1732, camera pushes on one notch: two column layouts side by side, width gap labelled `≈ 240 px`.
10. (cap 11) Small drift example card: `(100000000 + 1) - 100000000` → `0` single precision, `1` native.
11. (cap 12) Test replay: float64 lane outputs get `+1`; lane 5 shows mismatch `3`, lanes 1-3 still agree; green "caught".

**Captions**
1. Exactness is a claim, so the lab tries to break it. Every sampled trial feeds one input through five separate calculations. [lab/trace-compiler/README.md "What Is Checked"]
2. Three must agree on the circuit's outputs: a literal reference evaluator, the compiled execution path, which is still Java Script and not a graphics chip, and a single-precision interpreter of the source. [README.md:19-27]
3. The other two ignore the circuit. One interprets the source in double precision, and one runs the real source natively in the Java Script engine. Those two must agree with each other. [README.md:23-30]
4. That native lane exists because of a September review. The compiler and its interpreter had both dropped a return, so a wrong answer looked verified. Those cases now have regression tests. [README.md:5; reassessment-2026-09-03.md:70]
5. The report checked 1,174,491 circuit outputs and found zero mismatches. Most had all three comparisons; some were constants, and some were absent optional values. [README.md:82]
6. Natively, it checked 1,193,491 double-precision outputs and found zero disagreements. The larger count includes object fields the program left unchanged. [README.md:82]
7. Scope matters. These are sampled trials inside declared input ranges, on the frozen fixture, with a fixed seed. The lab says plainly it is not a proof for every supported program. [README.md:35; report.ts seed 20260706]
8. Precision is a separate question. Single and double precision are allowed to differ, and the report lists where, rather than calling it a compiler error. [README.md:31]
9. Of 4,097 integer widths, six differ: 512, 756, 1000, 1244, 1488 and 1732. At those widths the single-precision reciprocal rounds so that one fewer column is chosen. [README.md:98; caption-review.md row 11]
10. Then each column's width can differ by about two hundred forty pixels. The circuit matches single precision exactly, but that agreement doesn't hide the choice from a user. [README.md:98]
11. A smaller case: one hundred million plus one, minus one hundred million, is zero with a rounding step after each single-precision operation, but one in native Java Script. [README.md:31]
12. One regression adds one to the double-precision outputs, and the test confirms the native check catches it, even while the circuit and the single-precision interpreter still agree. [compile.test.ts:387]

**On-screen labels (exact):** lane names `circuit reference evaluator`, `compiled execution (Java Script)`, `FP32 source interpreter`, `float64 source interpreter`, `native JS`; `1,174,491 = 1,102,635 + 68,300 + 3,556`, `circuit mismatches: 0`, `1,193,491`, `disagreements: 0`, `seed 20260706`, `sourceSemantics.mismatchCount`, widths `512, 756, 1000, 1244, 1488, 1732` of `4,097`, `≈ 240 px`, `(100000000 + 1) - 100000000`, `compile.test.ts:387`.

---

## Chapter 4: How Much Is Covered
**Thesis:** The checked slices cover 64 of 221 statement units (29.0%), what remains is named, and the status is "held on the fixture, open for coverage".

**Visual machine: "the coverage wall".** 221 small tiles (statement units, in rows) fill: 64 solid accent, 49 hatched "classified, not compiled", rest dark. A side panel of nine slice bars (ops) with a layer ruler. Then two locked doors for the rejected probes, and a final status card.

**Beat sheet**
1. (cap 1) 221 dark tiles tile in, row by row, labelled "render-path statement units (frozen fixture)".
2. (cap 2) 64 light up (accent) with a counter `64 / 221 = 29.0%`; a second bracket around the 173 numeric tiles `64 / 173 = 37.0%`.
3. (cap 3) 49 tiles hatch: "classified, not compiled".
4. (cap 4) A struck-through label `113 / 173 = 65.3%` "historical"; the hatched tiles lose their fill counting.
5. (cap 5) Camera moves to the slice bars, ops: `spring snap 0`, `occlusion bits 25,416`, `2D layout 24,894`, `1D layout 21,213`, others small.
6. (cap 6, 7) Layer ruler: `1D layout 1,580` towers; a chain of 221 photo nodes accumulates left to right; a faded parallel-prefix tree alternative with "changes rounding order" stamp.
7. (cap 8, 9) Two doors with padlocks: `hitTest2DMode` (early return from a search loop) and `stepSpring` (loop bound unknown at run time), each stamped with its reject category; a list of five unsupported items drifts in below.
8. (cap 10) Banner "not the entire app" and "no GPU performance claim".
9. (cap 11) "Next" card: bounded first-match selection, explicit gather declarations; note "measure coverage, don't infer from syntax".
10. (cap 12) Status card: `runtime studies` list line from `lab/status.md`, no verdict row; stamp "held on frozen fixture · coverage open".
11. (cap 13) Recap strip replays four mini-thumbnails of ch1-ch3 and the 64/221 tile count; stage quiet, tiles fade to ≤0.15 under the recap text.

**Captions**
1. How much of the gallery's code gets through? The frozen render path has 221 statement units, and each one is either compiled and checked, or it isn't. [lab/trace-compiler/README.md:104]
2. The slices actually compile and verify 64 of them. That's 29.0 percent of all units, or 37.0 percent of the 173 that are classified as numeric. [README.md:104]
3. A syntax-based classifier finds 49 more numeric candidates. They look compilable, but they haven't been compiled and verified, so they don't count. [README.md:106]
4. An earlier figure, 113 of 173, or 65.3 percent, added those candidates in. The lab now calls it historical, since a candidate is not compiled code. [README.md:106]
5. Cost varies enormously. The spring snap needs zero operations, while the occlusion pass takes 25,416 and the two-dimensional layout 24,894. [README.md:84-94]
6. Depth is a different story. The one-dimensional layout takes 1,580 layers, because positions accumulate one photo after another through all 221. [README.md:110]
7. A parallel prefix sum would shorten that chain, but it would change the rounding order, so under this exactness rule it is not a free swap. [README.md:110]
8. Two rejection probes remain on purpose: hit testing that returns early from a search, and spring stepping with no bound on its loop. [README.md:108; real-slice.ts:24-25]
9. The compiler rejects them under a named category instead of guessing. Also unsupported: dynamic array access, runtime allocation, string encoding, nonfinite sentinels and browser input and output. [compile.ts:29-43; README.md:108]
10. This is not the entire application compiled unchanged, and neither measurement says anything about graphics-chip speed. [README.md:100, :110]
11. The lab's next steps are bounded first-match selection and explicit gather declarations, with coverage treated as something to measure, not to infer from syntax. [README.md:110-112]
12. As for standing, the status page lists the trace compiler under runtime studies, with no verdict row. Its correctness note says the interpreter is checked against native JavaScript. Coverage is not on that page. [lab/status.md:220, :289]
13. So the route runs from source to a syntax walk, to wires, to an exact comparison, to five checks. Sixty-four of 221 units went all the way through. [recap of ch1-ch4]

**On-screen labels (exact):** `221 statement units`, `64 verified · 29.0%`, `37.0% of 173 numeric`, `49 classified, not compiled`, `113/173 = 65.3% (historical)`, slice names and ops `clamp 60`, `column calculation 524`, `spring step 14`, `spring snap 0`, `1D hit test 117`, `2D layout, seven column variants 24,894`, `1D layout, masked loops 21,213`, `occlusion bits 25,416`, `scroll compensation 222`; layers `1,580`, `600`, `91`, `32`, `31`, `8`, `2`, `0`; `hitTest2DMode`, `stepSpring`, `lab/status.md:289 runtime studies (runtime-cost, trace-compiler)`.
