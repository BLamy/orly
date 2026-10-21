# Caption review: Learned Program (handwired-learned-interpreter)

Reviewer: fact-check pass (Claude Haiku 5.5), against the clone pinned at `4ea7fcb27ebe93acf49b9f29a93e162b975bad46`, read-only, at `.orly-work/hw-books/repo`. Source paths below are relative to that clone root, with `lab/learned-interpreter/` abbreviated as the file name. Quotes are verbatim from the cited file.

Checks run:
- Read every cited file for each caption. Read `lab/status.md` lines 196 and 244 and `lab/reassessment-2026-09-03.md` around line 132.
- `bun test lab/learned-interpreter`: 21 pass, 0 fail.
- Ran the probe from the plan (`trainWithExpectedProgramLoss`, seed 541 coordinate and seed 501 two-add, epsilon `1e-8` and `1e-14`). Phase values match the plan's tables.
- Ran the live circuit count (`buildProgram(2, 'soft' | 'hard')`): 250 operations, 77 affine, 173 ReGLU, 8 soft layers, 6 hard layers.
- Ran `createCertificationCases()`: 39,605 cases (37,188 integer, 2,401 fractional, 16 input-rounding).
- Checked the float grouping cases directly. `(1 + 2^-24) + (-1)` gives 0, and `(2^-24 + (-1)) + 1` gives 2^-24.
- Read `study-results.json` for the hard-study rows: scoreboard counts, 124 lookups in one sweep, the seed 519 row, the 120 paired agreements, and the enumeration programs.

## Verdicts

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | ---: | --- | --- | --- | --- |
| 1 | 1 | OK | | README.md:5 | "Can learning recover a reusable program, rather than a separate answer for each input?" |
| 1 | 2 | OK | | README.md:5 | "Four runtime inputs change on every example; the same program must work across examples." |
| 1 | 3 | OK | | README.md:13 | "Instruction 0 chooses an operation and an ordered pair from four runtime inputs" |
| 1 | 4 | OK | | README.md:13 | "Instruction 1 also sees instruction 0's result, giving `3 * 5 * 5 = 75` candidates." |
| 1 | 5 | OK | | README.md:15 | "The fixed circuit evaluates candidate instructions and sums their masked outputs." |
| 1 | 6 | OK | | README.md:15 | "After training, leftmost argmax turns each distribution into one exact instruction." |
| 1 | 7 | OK | | README.md:15 | "The source table contains four runtime cells and 123 shared program cells." |
| 1 | 8 | OK | | README.md:24, :31 | "const translatedX = Math.fround(Math.fround(pointerX) - Math.fround(panelLeft))" |
| 1 | 9 | OK | | README.md:19 | "All source values are rounded to FP32 when written, including in the independent oracle." |
| 1 | 10 | OK (live count) | | program.ts:117 (live run) | live output: "soft operations 250 affine 77 reglu 173 layers 8" |
| 1 | 11 | OK | | program.ts:196 | "hardened[group.parameterOffset + groupWinner(group, softProgram)] = 1" |
| 2 | 1 | OK | | README.md:55 | "The hard-loss matrix stores the mean of `0.5 * ((prediction - target) / lossScale)^2` for every complete program." |
| 2 | 2 | OK | | discrete-training.test.ts:30 | "assert.equal(twoAdd.exampleCount, 14_739)" |
| 2 | 3 | OK | | discrete-training.test.ts:36 | "assert.equal(coordinate.exactProgramCount, 2)" |
| 2 | 4 | OK | | README.md:55 | "Separate instruction probabilities optimize `p0^T L p1`;" |
| 2 | 5 | OK | | training.ts:45-49 | "{steps: 500, temperature: 0.125, learningRate: 0.002}," |
| 2 | 6 | OK | | discrete-training.ts:334-337 (live probe) | probe: `{"operation":"add","left":"instruction0","right":"instruction0"}`, and the loss stays at 0.009765625 from T=0.5 |
| 2 | 7 | OK (mechanism is arithmetic, not measured) | | discrete-training.ts:314; README.md:7 | "An Adam epsilon that dominated small gradients caused most of the reported hard-loss failure." |
| 2 | 8 | OK | | discrete-training.ts:202; live probe | "adamEpsilon: 1e-14," and probe: loss 6.636001980794054e-16 at T=0.125 |
| 2 | 9 | OK (the "fits" reading is inference) | | README.md:49; live probe | "Enumeration finds two coordinate programs, differing only in the operand order of multiplication." Probe: final instruction-1 max probability 0.5405781089459256 |
| 2 | 10 | OK | | README.md:61 | "All 120 paired runs choose identical hardened programs." |
| 2 | 11 | OK | | README.md:69, :72 | "\| Two adds, original 501-520 \| 0 (0) \| 19 (5) \| 19 (5) \| 20 (6) \| 20 (6) \|" and "\| Coordinate, original 541-560 \| 0 (0) \| 20 (20) \| 20 (20) \| 20 (20) \| 20 (20) \|" (the two-add rows 1001-1020 and 4001-4020 give 20 and 20) |
| 2 | 12 | OK | | README.md:76 | "Seed 519 remains a two-add failure with the corrected settings." |
| 3 | 1 | OK | | program.test.ts:116 | "assert.equal(integerResult.exactPrograms.length, 12)" |
| 3 | 2 | OK | | README.md:41 | "Certification now contains 39,605 cases:" |
| 3 | 3 | OK | | program.test.ts:118 | "assert.equal(fullResult.exactPrograms.length, 4)" |
| 3 | 4 | OK | | README.md:51 | "For example, `pointerX = 1`, `panelLeft = 2^-24`, and `distractor = -1` give zero for `(pointerX + panelLeft) + distractor` after FP32 rounding." |
| 3 | 5 | OK | | README.md:51 | "Computing `(panelLeft + distractor) + pointerX` gives `2^-24`." |
| 3 | 6 | **FIX** | "Small whole numbers add exactly in either grouping, which means no integer example can tell the groupings apart." → "Small whole numbers add exactly in either grouping, so this lab's small integer examples cannot tell the groupings apart." | README.md:39, :51 | "Training remains the original integer domain: coordinates from `-16` through `16` in steps of two, scales `2`, `4`, and `6`, and an independent distractor." / "Integer examples alone cannot identify which grouping is required." |
| 3 | 7 | OK | | README.md:9; status.md:196 | "Those are two different results: an optimizer improvement and a training-domain limitation." |
| 3 | 8 | OK | | README.md:80 | "Direct enumeration uses 3,600 table reads and chooses the first minimum." |
| 3 | 9 | OK | | README.md:78 | "Every original failure reaches zero integer-domain loss in one sweep: 124 table reads including the starting score." |
| 3 | 10 | **FIX** | "And every route reuses the table," → "And every hard-loss route reuses the table," | README.md:80; discrete-training.ts:48 | "Every trainer and search baseline reuses that cost." |
| 3 | 11 | OK | | README.md:94 | "\| Coordinate, original 101-120 \| 11/20 \| 11/20 \|" |
| 3 | 12 | OK | | lab/status.md:196, :244 | "Corrected hard-loss optimizer: coordinate 60/60; two adds 59/60 on integers, 15/60 with fractional FP32 checks" |
| 3 | 13 | OK | | README.md:9 | "Neither establishes scalable program synthesis." |

### Notes on the FIX rows

- **Ch 3 #6.** The caption said no integer example can tell the groupings apart. That is false outside the lab's small-integer range. With `pointerX = 2^24`, `panelLeft = 1`, `distractor = -1`, the two groupings give 16777215 and 16777216, so large integers do separate them. The scope now matches README.md:39 (the integer training domain) and keeps the lab's own quote.
- **Ch 3 #10.** The caption said every route reuses the table. The soft-output trainer in `training.ts` does not import or read the loss table (its imports are at training.ts:1-23). Only the hard-loss trainers and the enumeration and coordinate-descent baselines read it. The README sentence it came from (README.md:80) is broader than the code. The caption now says "hard-loss route."
- Both FIX captions were edited in `docs/book-plans/handwired-learned-interpreter/book.json` and in `plan.md`. All 36 captions are at most 213 characters.

## Visuals in plan.md

No visual shows a wrong number. Every number in the chapter 1-3 visual labels and beat sheets was checked against the sources above or against the live runs. That includes 250 / 77 / 173 / 8 / 6 layers, 127 source cells, the probe values, 707,472 and 53,060,400 evaluations, 28,800 bytes, 124 reads, the 59/60 and 15/60 tallies, the 11/20 and 0/20 soft rows, the 39,605-case split, and the seed 519 loss and program index.

## Source issues found (not edited; outside this review's scope)

- `study-results.json` still records 240 operations (67 affine) for both soft and hard circuits. The live build gives 250 (77 affine), so the committed report is stale. The captions and plan use the live count, which is correct.
- README.md:61 says the largest probability gap is "about `7.2e-7` for two-add and `1.2e-13` for coordinate." The committed JSON gives 7.148e-7 and 1.133e-13, which round to 7.1e-7 and 1.1e-13. The plan's visual label uses the JSON values, which is correct. The README figures should be corrected by the lab's author.
- README.md:80 says "Every trainer and search baseline reuses that cost." It is accurate for the hard-loss trainers but not for the soft-output trainer (see Ch 3 #10 above).
