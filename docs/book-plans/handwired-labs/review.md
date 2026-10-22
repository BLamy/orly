# Handwired Labs plan: caption fact-check

Source: `.orly-work/handwired-labs/repo`, HEAD `4ea7fcb27ebe93acf49b9f29a93e162b975bad46` (confirmed). Plan: `docs/book-plans/handwired-labs/plan.md`, 61 captions.

Method: each caption was checked against the cited files and, where the README gives the number, against the README table or text it was printed from. Reports and tests were not re-run, so numbers that come only from a script's printed output are checked against the README copy of that output.

Verdicts: **OK** = supported as worded. Where only the pointer is wrong, the verdict is still OK and the corrected pointer is in the source column. **FIX** = the corrected caption (≤220 characters) is in the third column. **CUT** = not used; no caption was unsupported outright.

---

## Chapter 1: Picking Exactly

| # | verdict | corrected caption (if FIX) | source file:line | verbatim quote |
| --- | --- | --- | --- | --- |
| 1 | OK | | lab/cascade-argmax/README.md:5 | "The forward construction uses ReLU, power-of-two scaling, and clamping." |
| 2 | OK | | lab/hard-attend/hard-attend.ts:65 (scores at :47) | "if (score > winnerScore) {" |
| 3 | OK | | lab/hard-attend/hard-attend.ts:141, :146 | "return sum + bit * item.value" |
| 4 | OK | | lab/hard-attend/README.md:7; lab/status.md:257 | "The folder has no tests." / "Its scored selection half, learning a shared scoring rule from changing data" |
| 5 | OK | | lab/cascade-argmax/cascade-argmax.ts:26, :41 | "Seven multiplicative stages: one after the initial relu, one after each of the six" / "fill(2 ** 23)" |
| 6 | OK | | lab/cascade-argmax/cascade-argmax.ts:29, :31 | "saturates even the smallest positive FP32 difference (2**-149) to exactly 1." / "Zero in the hard form (exact ties stay left)." |
| 7 | OK | | lab/cascade-argmax/README.md:27 (printed by report.ts:44-54) | `\| 8 \| 56 \| 196 \| 15 \| 75 \|` |
| 8 | FIX | Across ten seeds, each fitted to sixteen cases of eight candidates, the hardened circuit picked all 160 winners. | lab/cascade-argmax/report.ts:65; lab/cascade-argmax/README.md:15 | "Hardened winners: ${totalCorrect}/160 across 10 seeds." / `\| Seven-stage soft cascade \| 1-10 \| 160/160 \|` |
| 9 | OK | | lab/cascade-argmax/README.md:11, :33 (status.md:202 for "no useful gradient") | "This is fitting a 128-cell table." / "an exact tree over 8 candidates built with it is 150 operations in 57 layers" |
| 10 | OK | | lab/candidate-gallery/candidate-gallery.ts:155, :159 | "result = emitMinimum(circuit, result, values[index]!)" |
| 11 | OK | | lab/candidate-gallery/candidate-gallery.test.ts:33-35; candidate-gallery.ts:338 | "[984, 730, layout.contact]," (the test is named "wide, balanced, and tall") |
| 12 | OK | | lab/candidate-gallery/README.md:5 (status.md:228 does not mention the move; "claims no learning" is not stated in the source, it is an absence) | "It moved here from the repo root on September 17, 2026" |

Chapter notes: caption 8 needs its scope. The table cites 160/160 across ten seeds, not one fit. Caption 9's "cheaper exact compare" comes from README:33, which the caption's pointer does not name.

---

## Chapter 2: Finding the Program

| # | verdict | corrected caption (if FIX) | source file:line | verbatim quote |
| --- | --- | --- | --- | --- |
| 1 | OK | | lab/reassessment-2026-09-03.md:186 (and :7) | "Our distinctive question is what making small pieces of behavior editable and learnable enables" |
| 2 | FIX | Start without learning. Twelve slots hold rectangles. A program picks rows by up to two tests, reads a field, then does up to two steps of arithmetic: 868 programs in all. | lab/data-adapter/README.md:27, :31 (vocabulary at lab/data-adapter/experiment.ts:9-10, :82-86) | "Zero, one, or two row predicates: active, same ID, or first storage slot." / "There are `7 * 4 * (1 + 5 + 25) = 868` programs." |
| 3 | OK | | lab/data-adapter/README.md:5 (438 = 216 generated + 216 reversed + 6 extra, README:68) | "All eight programs agree exactly with an independent JavaScript lookup on 438 held-out scenes" |
| 4 | OK | | lab/data-adapter/README.md:3; lab/status.md:199 | "Nothing trains neural weights here." |
| 5 | OK | | lab/learned-interpreter/README.md:13, :15 (program.ts:54-63) | "That gives `3 * 4 * 4 = 48` candidates." / "After training, leftmost argmax turns each distribution into one exact instruction." |
| 6 | FIX | With the original optimizer setting, none of twenty runs per task recovered the program. Mostly the cause was Adam's epsilon, a tiny constant that dominated small gradients, not the architecture. | lab/learned-interpreter/README.md:7, :67-74; lab/reassessment-2026-09-03.md:9 | "An Adam epsilon that dominated small gradients caused most of the reported hard-loss failure." / "does not need a new architecture to recover two operations" |
| 7 | OK | | lab/learned-interpreter/README.md:7, :69-74 | "Correcting epsilon recovers all 60 tested coordinate programs and 59 of 60 two-add programs on the integer training domain." / "only 15 of those 60 two-add runs preserve the specified FP32 addition grouping." |
| 8 | OK | | lab/learned-interpreter/README.md:105, :9; lab/status.md:244 | "The present integer training grid cannot answer that question." / "The hard-loss method still evaluates every complete program before training." |
| 9 | OK | | lab/trace-compiler/compile.ts:4, :6, :9 | "Compile-time constants fold;" / "unroll over the static range with a per-iteration mask bit." / "Ternaries lower to two masked products" |
| 10 | OK | | lab/trace-compiler/README.md:82, :104 | "There were zero circuit mismatches." / "The slices actually compile and verify 64 units: 29.0% of all units" |
| 11 | FIX | At six of 4,097 widths, the single-precision result picks one fewer column than double precision, and the circuit matches it exactly. Users can see that precision choice. | lab/trace-compiler/README.md:27, :98 | "Reciprocal rounding selects one fewer column there" / "Circuit/interpreter agreement does not make that precision choice invisible to users." |
| 12 | OK | | lab/trace-compiler/README.md:5, :41, :108; lab/reassessment-2026-09-03.md:59-70 | "a shared interpreter bug that made an incorrect result look verified" / "Returns under a runtime condition still reject explicitly" / "spring stepping has an unbounded runtime iteration count" |

Chapter notes: caption 6 overstates. The source says epsilon "caused most of" the failure, and the diagnosis is still open ("Finish the numerical diagnosis", reassessment:132-134). Caption 11's "which is why exact bits matter" is an inference the source does not make.

---

## Chapter 3: Claims That Got Smaller

| # | verdict | corrected caption (if FIX) | source file:line | verbatim quote |
| --- | --- | --- | --- | --- |
| 1 | OK | | lab/status.md:200, :201, :204 (the three rows of "What learns") | "Historical repair could hide content, and valid samples do not establish a smooth valid interpolation." |
| 2 | OK | | lab/event-window/README.md:23, :33; lab/event-window/circuit.ts:136-230 | "moves beyond the 4-pixel slop threshold" / "Written by the pointer-down write gate" |
| 3 | OK | | lab/event-window/train.ts:153, :156 (comment at :142-148) | "{untilProgress: 0.4, sharpness: 1 / 32, learningRateScale: 1}," / "{untilProgress: 1, sharpness: 4, learningRateScale: 0.1}," |
| 4 | FIX | Twenty of twenty seeds recovered the boundaries, and each recovered circuit matched plain TypeScript over 30,000 held-out frames with zero divergences. | lab/event-window/README.md:44, :50, :73, :77, :98 | "recovery = zero divergence over three held-out 10,000-frame traces" / `\| 1 \| 12.86 \| 85.95 \| 4.500 \| 29.702 \| 1001 ✓ \| 0/30000 \| yes \|` / "closed loop, tensor evaluator, 12 seeds × 10,000 frames" (under "Closed-loop exactness (hand-authored parameters)") |
| 5 | FIX | Start from the true values with the ramp held fixed, and training drifts off them, diverging nine thousand times in ten thousand frames. Annealing is what makes it work. | lab/event-window/README.md:69, :71 | "starting FROM THE AUTHORED TRUTH drifts the title boundary to ≈30.01" / "the hardened result diverges from the oracle 9,120 times over a 10,000-frame held-out trace." / "The fix is annealing" |
| 6 | OK | | lab/event-window/README.md:7; lab/reassessment-2026-09-03.md:86 | "Positions, focus, maximization, and press state still recur between frames" / "replaces consecutive pointer moves with the final move" |
| 7 | OK | | lab/generative-fields/README.md:13, :19, :47-55 | "The same compiled program produces a uniform grid, a hero layout, an importance-weighted mosaic, a list, and a filmstrip" / "= 72 dimensions" |
| 8 | OK | | lab/generative-fields/README.md:61, :78 | "1,078 of 4,000 (26.9%) were valid" / "the best shows 6, not 16" |
| 9 | OK | | lab/reassessment-2026-09-03.md:100; lab/generative-fields/README.md:7, :9 | "Of 4,154 repairs in the original study configuration, 1,408 hid previously visible items." / "The samples do not establish smooth motion" |
| 10 | OK (pointer) | | lab/generative-fields/README.md:136-137 (lab/status.md:201 names neither the second flow region nor learned weights) | "Second flow region (hero column + rail flow) selected by fields" / "Learn fitness weights instead of hand-tuning" |
| 11 | OK | | lab/ui-exploration/README.md:5, :17, :72; lab/status.md:290 | "This folder holds one night of exploration (September 12-13, 2026)" / "8 of the 24 prototype folders and the notes were removed, or merged" / "Virtualized list, 10,000 rows" (280 operations) |
| 12 | FIX | Combining the wins was richer but not cheaper. Learned logic gates were weak: none of 48 runs learned a task exactly at base settings. "Zero mismatches" covers only the traces named. | lab/ui-exploration/README.md:39, :157, :220; lab/status.md:204 | "Combining the wins makes UI richer but not cheaper." / "0 of 48 runs learned a task exactly at base settings." / "\"0 mismatches\" always means over the traces and samples each README names, not a proof." (README:157 also says the Tab rule was learned exactly for 2 controls) |

Chapter notes: caption 4 credits the 120,000-frame closed-loop result to the trained circuit. That number is for the hand-authored parameters (README:44-50). Each trained seed was checked on 30,000 frames (README:77). Caption 12 "zero of forty-eight" is correct only for "at base settings"; the README records an exact 2-control result.

---

## Chapter 4: Learning What We Wrote Down

| # | verdict | corrected caption (if FIX) | source file:line | verbatim quote |
| --- | --- | --- | --- | --- |
| 1 | OK | | lab/status.md:197, :212 | "Learns an authored preference objective, not human taste." |
| 2 | OK | | lab/reusable-layout/model.ts:5-6; lab/reusable-layout/README.md:11 | "export const featureCount = 8" / "export const hiddenWidth = 12" / "A 12-unit ReLU hidden layer predicts one preferred width." |
| 3 | OK | | lab/reusable-layout/README.md:21 (objective in layout.ts:64-73; search is per layout, README:23) | "The objective prefers image area proportional to importance, penalizes captions longer than three lines, and mildly penalizes unused row width." |
| 4 | OK | | lab/reusable-layout/README.md:37, :43, :52-53 | "Lower preference loss is better." / "Per-layout search \| 317 / 761 microseconds" / "Shared rule \| 18.3 / 14.0 microseconds" |
| 5 | OK | | lab/reusable-layout/README.md:41-43 | "Shared learned rule \| 0.0259-0.0266 \| 0.2854-0.3079" / "Ordinary 224-pixel wrapping \| 0.3727 \| 1.0530" / "Per-layout search \| 0.0229 \| 0.1987" |
| 6 | OK | | lab/reusable-layout/README.md:71; lab/status.md:197 | "The next useful change is a held-out long-caption training split or a better caption-width feature" |
| 7 | OK | | lab/learned-gallery/README.md:5, :7 | "whose coefficients are the program's source cells" / "and from there into src/learned-gallery on October 14, 2026" |
| 8 | OK | | lab/learned-gallery/README.md:15-16 | "every two photo edges of one kind, e.g. two tops, are charged for the gap between them" / "grows it by a tenth of the pair's gap per training step" |
| 9 | FIX | Presets stop after 579 to 1,932 steps, depending on frame timing, with lines within a tenth of a pixel. After small edits, other photos move a median 2.8 px, and 1.1% of edits end neither aligned nor a reach apart. | lab/learned-gallery/README.md:31, :35, :39, :40; lab/status.md:203 | "579 to 763, 1,299 to 1,932 and 860 to 1,021" / "679, 1,389 and 879" / "The same edits: how far the other photos moved" (value "2.8, 6.9 px", median and largest by the table's format) / "96 sessions of 40 small edits: edits that end with two photo edges" (value 1.1%, of edits, not sessions) |
| 10 | OK | | lab/learned-gallery/README.md:13, :18, :60 | "A photo joins a line at half the distance at which it leaves one" / "the spirit of the gallery is to learn something" / "Straightening the sketch before training" (tried, not kept) |
| 11 | OK | | lab/status.md:203 | "No held-out test: the network is fitted to one sketch at a time." |
| 12 | FIX | User effort separates prediction from goals. A six-operation circuit with five coefficients learned a duration formula we wrote, with held-out error of 1.68 ms against the simulator's mean. | lab/user-effort/README.md:33, :51 | "The circuit has six operations and three layers." / "Held-out, simulator mean \| 1.68" |
| 13 | FIX | Given a stated task mix and size limits, it picks the layout with lowest expected time. It matches the simulator's best in 120 of 120 situations, against 88 for shortest distance. | lab/user-effort/README.md:58-64 | "Some constraints allow only one candidate, making those cases trivial." / "Among the 20 situations where all four candidates are allowed, learned effort matches the simulator's choice 20/20" |
| 14 | OK | | lab/user-effort/README.md:70; lab/status.md:198 | "There are no human usability results." |

Chapter notes: caption 9 has three errors. "Under 1,400 steps" is false for the Cinema runs (1,299 to 1,932). "2.8 pixels" is the first of two figures in the table, not a stated median. "1.1 percent of sessions" is a percentage of edits. Caption 12's "error under two milliseconds" needs its reference: the 1.68 ms is against the simulator's noise-free mean, while noisy observations had 20.22 ms RMSE (README:50-51). Caption 13 says "best of four", but only 20 of the 120 situations had all four candidates allowed (README:64), so the corrected caption says "matches the simulator's best" without that phrase.

---

## Chapter 5: Does It Go Faster?

| # | verdict | corrected caption (if FIX) | source file:line | verbatim quote |
| --- | --- | --- | --- | --- |
| 1 | OK | | lab/knuth-plass/README.md:5 (status.md:103, :230, :240 for the same point) | "one paragraph on the GPU loses" |
| 2 | OK | | lab/runtime-cost/README.md:13; lab/runtime-cost/layers.ts:12-13 | "54 to 55 µs per evaluation in 64 layers, 64 to 65 µs in 1,024 and 210 to 214 µs in 16,384" |
| 3 | OK | | lab/runtime-cost/README.md:9, :11, :13 (status.md:160) | "rerun locally rather than treating a single ratio as an architectural guarantee" / "about 10 µs per 1,000 layers" |
| 4 | OK | | lab/knuth-plass/README.md:167-168 | `\| tree \| 1,024 \| 32 \| 2,823,382 \| 230 \|` (chain: 10,232 layers, same row set) |
| 5 | OK | | lab/knuth-plass/README.md:185, :188 | "takes 1.7 to 7.7 times the chain's µs" / "e.g. 75 µs against 2,925 µs at n = 1,024 and W = 32" |
| 6 | FIX | On the GPU one paragraph loses. For many, it wins: at W = 32, a thousand paragraphs take 4.5 ms with the dense-rows kernel, against 10.4 ms for a typed-array loop. | lab/knuth-plass/README.md:355, :411 | "4.50 against 10.4 ms" / row `\| 32 \| 1,000 \| 42.3 ... \| 4.50 (3.97 to 4.72) \| ...` (4.50 is dense-rows, positions; the full kernel is 42.3) |
| 7 | OK | | lab/knuth-plass/README.md:454 | "from below 30 to about 190 paragraphs of 256 break points, depending on W, on which loop and on the Chrome session" |
| 8 | OK | | lab/json-search/README.md:177, :916 | "Every keystroke searches all 100,000 documents in 4.5 to 5.2 ms when searches follow each other" / "One document's operations run one after the other in one GPU thread" |
| 9 | OK | | lab/json-search/README.md:56, :156 | "loop-emit.ts's shaders take 8, 69 and 945 ms" / "bit-emit.ts's" ... "take 4.6, 4.7 and 5.2 ms" / `\| 17 to 32 states \| 945; 948 ms \| 5.24; 13.2 ms \|` |
| 10 | OK (pointer) | | lab/json-search/README.md:121, :181; lab/status.md:116-120 (status.md:107 is the superseded October 13 answer, "about even") | "faster when searches follow each other, and faster for most patterns at a keystroke" / "Against JavaScript in 8 workers: still no." (status.md:120) |
| 11 | OK (pointer) | | lab/json-search/README.md:162, :787; lab/status.md:107, :114 | "11 to 16 ms instead of 4.5 to 5.2 ms" / "## What the review found, and what changed" / "Why an evaluation after a pause takes longer wasn't found." (status.md:114) |

Chapter notes: caption 6 is the only number error. Captions 10 and 11 need pointer fixes. Caption 11's pointer, README:896-950, covers "What fit well" and "What got awkward"; the review is at README:787.

---

## Beats that contradict the source

I found no beat whose number is simply wrong. Three beats need changes:

- **Chapter 1, beat 6:** the "160/160" check has no seed count. Source: lab/cascade-argmax/report.ts:65, "Hardened winners: ${totalCorrect}/160 across 10 seeds." Add "ten seeds" to the stamp, or say it in the beat.
- **Chapter 3, beat 4:** the "120,000 frames, 0 divergences" stamp is the hand-authored-parameter result (lab/event-window/README.md:44-50). Trained seeds were checked on 30,000 frames each (README:77). Show "30,000 per seed" for the trained circuit, or label the stamp as hand-set.
- **Chapter 4, beat 5:** "Springs between same-kind edges fade at the 'reach' distance" describes the wrong mechanism. The learned gallery uses a misalignment penalty, not springs, and the pull is "0 from a gap of one reach on" (lab/learned-gallery/README.md:15). Replace "springs" with "penalty" or "pull".

Beat numbers that check out: Chapter 1 beats 5 (196/75 vs 56/15), 9 (12 thumbnails); Chapter 2 beats 2 (868 cards), 4 (48 and 75), 6 (59/60 and 15/60), 9 (29%); Chapter 3 beats 2 (four snaps, 32 px to a quarter pixel), 3 (drifts to 30.01), 5 (72 knobs, 8 + 4×16), 7 (1,078 of 4,000; 6 of 16), 8 (24 boxes, eight out, sixteen remain); Chapter 4 beat 4 (9 px above, 3 px sag) and beat 8 (72 px); Chapter 5 beats 1 (16,384, 55 µs, 212 µs), 3 (10,232 and 230 layers), 4 (75 µs), 7 (945 to 5.2 ms).
