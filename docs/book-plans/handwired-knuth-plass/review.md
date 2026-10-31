# Caption review: handwired-knuth-plass

Reviewer: fact-check pass (Claude Haiku 5.5), not the author of the book.

Source paths are relative to `.orly-work/hw-books/repo`, pinned at `4ea7fcb27ebe93acf49b9f29a93e162b975bad46`. The "verbatim quote" column is a verbatim fragment of that source file, with `\|` escaping pipes inside table rows. `lab/status.md` is in the same clone.

Verdicts: 38 captions checked, 4 FIX, 34 OK. Each FIX was edited in place in `book.json` and `plan.md`. Nothing else was edited.

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | --- | --- | --- | --- | --- |
| 1 Cheapest Breaks | 1 | OK | | lab/knuth-plass/reference.ts:26 | "cost[to] = min over from of cost[from] + lineCost(from, to)" |
| 1 Cheapest Breaks | 2 | FIX | "a fixed program of sums and relu" → "a fixed program of sums, table lookups and relus". The program also reads from tables, which the caption 1.12 later says. | lab/knuth-plass/program.ts:83 | "const squared = circuit.indexReadAffine(" |
| 1 Cheapest Breaks | 3 | OK | | lab/knuth-plass/knuth-plass.test.ts:16 | "Boxes 3, 2, 2 and 5 px wide with 1 px spaces, at 6 px" |
| 1 Cheapest Breaks | 4 | OK | | lab/knuth-plass/knuth-plass.test.ts:16 | `greedy fills "3 2" and leaves 4 px on the second line` |
| 1 Cheapest Breaks | 5 | OK | | lab/knuth-plass/reference.ts:10 | "return Math.min(slack, slackLimit) ** 2" |
| 1 Cheapest Breaks | 6 | OK | | lab/knuth-plass/knuth-plass.test.ts:17 | `while "3" then "2 2" costs 9 + 1` |
| 1 Cheapest Breaks | 7 | OK | | lab/knuth-plass/reference.ts:10 | "return Math.min(slack, slackLimit) ** 2" |
| 1 Cheapest Breaks | 8 | OK | | lab/knuth-plass/paragraph.ts:21 | "A line that doesn't fit costs `infeasible`, except a line of one box, which" |
| 1 Cheapest Breaks | 9 | OK | Note: the window bound (lines of at most W boxes) is not stated. The 4-box example uses W = 4, so the caption is not wrong for it. | lab/knuth-plass/reference.ts:26 | "for lines of at most `window` boxes" |
| 1 Cheapest Breaks | 10 | OK | | lab/knuth-plass/reference.ts:38 | "const total = costs[from]! + lineCost(paragraph, from, to, maxWidth)" |
| 1 Cheapest Breaks | 11 | OK | | lab/knuth-plass/reference.ts:39 | "if (total < best) {" |
| 1 Cheapest Breaks | 12 | OK | | lab/knuth-plass/program.ts:86 | "const overflows = circuit.reglu([], 1, [[ramp, -1]], 1)" |
| 1 Cheapest Breaks | 13 | OK | | lab/knuth-plass/knuth-plass.test.ts:26 | "const expected = {breaks: [1, 3, 4], totalCost: 10}" |
| 2 Chain Or Tree | 1 | OK | | lab/knuth-plass/reference.ts:67 | "row 0 of M[to]: M[to][0][m] = lineCost(to - 1 - m, to)" |
| 2 Chain Or Tree | 2 | OK | | lab/knuth-plass/reference.ts:101 | "best = Math.min(best, matrix[r * window + m]! + vector[m]!)" |
| 2 Chain Or Tree | 3 | OK | | lab/knuth-plass/reference.ts:69 | "Clamping every sum at `infeasible` keeps the product associative" |
| 2 Chain Or Tree | 4 | OK | | lab/knuth-plass/README.md:167 | `chain \| 1,024 \| 32 \| 277,068 \| 10,232` |
| 2 Chain Or Tree | 5 | OK | | lab/knuth-plass/README.md:168 | `tree \| 1,024 \| 32 \| 2,823,382 \| 230` |
| 2 Chain Or Tree | 6 | OK | | lab/knuth-plass/README.md:185 | "10.2 times at n = 1,024 and W = 32" |
| 2 Chain Or Tree | 7 | OK | Scope is the lab's CPU executor, pre-update. Caption 9 carries the historical caveat. | lab/knuth-plass/README.md:185 | "takes 1.7 to 7.7 times the chain's µs" |
| 2 Chain Or Tree | 8 | OK | Present tense, but historical. Caption 9 directly after carries the caveat. | lab/knuth-plass/README.md:188 | "e.g. 75 µs against 2,925 µs at n = 1,024 and W = 32" |
| 2 Chain Or Tree | 9 | FIX | "They predate two later fixes that cut the executor's cost per layer, so the gaps are probably smaller now." → "One later commit cut the executor's cost per layer, and another cut compile time and memory. So the chain is probably faster now." The second fix (a1b3b7b) is in compileTensorProgram, not the executor. The "probably faster" is the README's own estimate: 10,232 layers at about 100 µs, not about 360 µs. | lab/knuth-plass/README.md:187 | "which removed an array of the circuit's width that `compileTensorProgram` allocated for every layer" |
| 2 Chain Or Tree | 10 | OK | Lab-reported. The test file was not re-run (needs @chenglou/pretext). | lab/status.md:240 | "costs, pointers and breaks equal the reference exactly on random paragraphs with ties" |
| 2 Chain Or Tree | 11 | OK | Probe by hand: predecessors [0, 0, 0, 1, 3], so jumps[1][4] = predecessors[predecessors[4]] = 1. | lab/knuth-plass/program.ts:192 | "jumps[level][at] is predecessors applied 2^level times to `at`" |
| 2 Chain Or Tree | 12 | OK | | lab/knuth-plass/program.ts:199 | "whether `to` is on the path from breakCount back to 0" |
| 3 Many At Once | 1 | OK | | lab/knuth-plass/README.md:254 | "one dispatch of its matrix products and one of its matrix-vector products, across every paragraph" |
| 3 Many At Once | 2 | OK | | lab/knuth-plass/README.md:382 | "takes 0.3 to 0.6 ms, medians of 0.31 to 0.64 ms" |
| 3 Many At Once | 3 | OK | | lab/knuth-plass/README.md:352 | "0.016 (0.013 to 0.016)" |
| 3 Many At Once | 4 | OK | | lab/knuth-plass/README.md:355 | "42.3 (40.5 to 42.9)" |
| 3 Many At Once | 5 | OK | | lab/knuth-plass/README.md:262 | "So the kernel stores and reads only the first min(B, W) rows of a block." |
| 3 Many At Once | 6 | FIX | "The chip's time stays near its round trip while the loops' time grows with every paragraph." → "The chip's time grows far more slowly than the loops' time as paragraphs are added." At 1,000 paragraphs the chip is 4.50 ms, about 10 times the 0.3 to 0.6 ms round trip, so "stays near" is contradicted. | lab/knuth-plass/README.md:449 | "one GPU evaluation stays close to its round trip" |
| 3 Many At Once | 7 | OK | | lab/knuth-plass/README.md:457 | "Computing the line costs in JavaScript and uploading them never beats `knuthPlassTyped`" |
| 3 Many At Once | 8 | OK | Six sessions, positions uploaded. | lab/knuth-plass/README.md:450 | "than `knuthPlassTyped` in Bun from about 38 to 188" |
| 3 Many At Once | 9 | OK | | lab/knuth-plass/README.md:450 | "Across the 6 sessions, the counts per W aren't a stable result" |
| 3 Many At Once | 10 | OK | Lab-reported. Totals are 24,823,200 + 705,743,280 = 730,566,480 values. | lab/knuth-plass/README.md:302 | "with 0 mismatched values and 0 mismatched breaks" |
| 3 Many At Once | 11 | FIX | "The yes holds for one kernel and one input" → "The yes holds for one kernel, with positions or widths uploaded". The lab's README gives both inputs, not one. | lab/knuth-plass/README.md:454 | "When only the widths change, it crosses from below 30 to about 125 paragraphs." |
| 3 Many At Once | 12 | OK | The plan's pointer, lab/status.md:261, is not a "still open" list. It is a ui-exploration proposals entry. The claim itself is supported by the README sections at lines 225 and 462. | lab/knuth-plass/README.md:225 | "Sklansky's network, and the argmin pointers carried inside the matrix products" |
| 3 Many At Once | 13 | OK | | lab/knuth-plass/README.md:185 | "while it has 4 to 44 times fewer layers, e.g. 230 against 10,232" |

## Visuals in plan.md

No visual in plan.md shows a wrong number. I checked these against the tables and the probe:

- Chapter 1 beats 2, 4, 6, 8, 9, 10: gap squares 4, 3 and 1; tallies 16, 10 and 10; the excess of 6 and value of 10; `infeasible` 4,194,304; `lineCostCap` 3,969; `pred[3] = 1`; the backtrack 4, 3, 1, 0.
- Chapter 1 on-screen labels: the line costs (0,1)=9, (0,2)=0, (1,2)=16, (1,3)=1, (2,3)=16, (3,4)=0, which the probe confirmed, and `costs = [0, 9, 0, 10, 10]`, `predecessors = [0, 0, 0, 1, 3]`, `breaks = [1, 3, 4]`.
- Chapter 2 beats 1 to 3 and labels: `M3` top row `[16, 1, inf, inf]` (probe), `M3 ⊗ M2` top row `[1, 16, inf, inf]` (computed from the probe's matrices), `s[3] = [10, 0, 9, 0]`, operations 277,068 and 2,823,382, `2^24`, `jumps[0]` and `jumps[1]`.
- Chapter 2 beat 7 clock bars 2,925, 22,445 and 75 µs; the ratio tag 1.7 to 7.7×. These are historical, and the amber tag says so.
- Chapter 3 chart series, values read from the table at README.md:352 to 355: plain loop 0.016, 0.18, 1.90, 18.2; typed 0.008, 0.10, 1.01, 10.4; dense-rows positions 0.39, 0.68, 0.90, 4.50; full kernel 0.57, 0.75, 3.43, 42.3; line costs uploaded 0.42, 0.88, 4.61, 23.4.
- Chapter 3 crossover tags `below 30 to about 105` and `about 38 to 188`, the `730,566,480` total, `270,532`, and the session-dependent repeat value 0.54 at W = 32 and 100 paragraphs.

One non-number issue for the scene authors: the plan's "Status wording" paragraph says the yes holds "only for the dense-rows kernel with positions uploaded". README.md:454 also gives widths, which crosses from below 30 to about 125 paragraphs. The caption 11 fix now says "positions or widths". I did not edit the status paragraph, because the task limited edits to captions.

## Not run

- `knuth-plass.test.ts` needs `@chenglou/pretext`, so I did not run it.
- The GPU tests and the Chrome timings were not re-run, since there is no WebGPU here. The GPU numbers rest on the lab's README.
- Probe: `bun` on `reference.ts` with the four-box paragraph. Output: `costs [0,9,0,10,10]`, `predecessors [0,0,0,1,3]`, `breaks [1,3,4]`, `totalCost 10`, `lineCost` (0,1)=9, (0,2)=0, (1,2)=16, (1,3)=1, (2,3)=16, (3,4)=0, (0,3)=4,194,304, `lineCostCap` 3,969, and `M3` row 0 `[16, 1, 4194304, 4194304]`.
