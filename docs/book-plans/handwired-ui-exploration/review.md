# Caption review: UI Exploration (handwired-ui-exploration)

Reviewed against the pinned clone `.orly-work/hw-books/repo` at 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (checked with `git rev-parse HEAD`). Paths below are relative to `lab/ui-exploration/` unless they start with `src/`. Edits made: 13 captions, in `book.json` and the matching caption in `plan.md`. Nothing else was edited.

## Caption verdicts

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | OK | | README.md:5 | with JS only recording inputs and projecting outputs onto the DOM |
| 1 | 2 | OK | | README.md:49-52 | Count instead of search when a predicate flips once. |
| 1 | 3 | OK | | lists/list.ts:68 | first = floor(scrollTop / rowHeight), exact, then offset = first mod slotCount. |
| 1 | 4 | FIX | "snaps" → "floors" (the code floors scrollTop to the 1/4 px grid; it does not round to nearest) | lists/list.ts:21-22 | JS floors scrollTop onto / that grid before writing it |
| 1 | 5 | FIX | "is the row's top below the viewport's top and above its bottom?" → "is the row's top above the viewport's bottom edge?" (the bit tests one edge only) | lists/list.ts:91 | integerAtLeastOne(circuit, [[scrollTop, scrollGrid], [viewportHeight, scrollGrid], [row, -scrollGrid * rowHeight]], 0) |
| 1 | 6 | FIX | added "With uniform row heights" (280 / 19 is the uniform-row variant; variable heights are 6,177 operations at 1,000 rows) | lists/README.md:82-84, :88; README.md:72 | uniform, row data in JS |
| 1 | 7 | OK | scope is the 10,000-row list defined in caption 3 | README.md:72; lists/README.md:86 | (20,305 operations with row data in source cells) |
| 1 | 8 | OK | | text-walker/fast-walker.ts:19-20; lab README.md:94 | Line walks and flex-wrap are still sequential scans (README.md:94) |
| 1 | 9 | OK | | text-walker/fast-walker.ts:19-20 | is monotone in o / (1..1 0..0) |
| 1 | 10 | OK | | text-walker/fast-walker.ts:22-23 | next(s)  = s + 1 + skip(s+1) + sum_o fits(o) * (1 + skip(s+o+1) - skip(s+o)) |
| 1 | 11 | OK | | text-walker/README.md:164; README.md:80 | 14,760 / 215 (95 segments, 96 word springs) |
| 1 | 12 | OK | | README.md:94 | Line walks and flex-wrap are still sequential scans |
| 1 | 13 | OK | | README.md:49-52 | Count instead of search when a predicate flips once. |
| 2 | 1 | FIX | "forty-eight thousand four hundred eleven operations in sixty-one layers" → "fifty-seven thousand one hundred thirty-five operations in sixty-seven layers". 48,411 / 61 is gallery-circuit.ts, one circuit with triangle prefix sums, not copies. The duplicated circuit at 221 photos is 57,135 / 67 with Brent-Kung prefix sums, the setting the timing table uses. | instanced-items/README.md:180, :116 | duplicated circuit: live operations / layers ; 57,135 / 67 |
| 2 | 2 | OK | | instanced-items/README.md:5 | one program per item, run over every item, with a small set of reductions across items between those programs |
| 2 | 3 | OK | | instanced-items/README.md:110, :178 | shared stages, of which the clock and spring matrix are 248 ; staged program: per-photo operations |
| 2 | 4 | OK | | instanced-items/README.md:179, :183; README.md:219 | 65 µs ; 546 µs ; treat them as rough |
| 2 | 5 | OK | | instanced-items/README.md:179, :183, :266 | 4,106 µs ; 43,027 µs |
| 2 | 6 | FIX | "a two-by-two matrix acting on position and velocity" → "acting on its distance from the destination and its velocity" (the lane is displacement from the destination, not position) | event-time/spring-math.ts:4-8, :33-39 | A spring lane is (displacement from its destination, velocity). |
| 2 | 7 | OK | | README.md:53; README.md:135; event-time/spring-math.ts:44 | in spring-bank's copy of HandwiredOS, the circuit went from 5,253 operations and 192 layers to 3,580 and 137 |
| 2 | 8 | OK | | src/runtime/numeric-ui-core.ts:467-470; README.md:29 | indexRead(index: Wire, candidates: readonly Wire[], options ; values[index] becomes 1 operation |
| 2 | 9 | OK | | README.md:134 | It changes the cost of lists, text, and slot routing more than anything else measured. |
| 2 | 10 | FIX | "pointer jumping gets the lines of a paragraph" → "gets the line count and widest line of a paragraph" (the 66 layers measure lineCount and maxLineWidth only; line starts were not built) | text-walker/README.md:217, :68 | gave lineCount and maxLineWidth in 35,914 operations beyond the table and 66 layers at 1,023 segments |
| 2 | 11 | FIX | added "Far down it," (the 0.18 px band is far down the gallery, not everywhere) | README.md:23 | and far down the gallery, pointers inside a 0.18 px band |
| 2 | 12 | FIX | "the gallery is where exact order of operations mattered most" → "the gallery is the one UI where exact order of operations mattered beyond rounding points" (the README says the gallery was the exception among seven UIs, not the most) | README.md:41 | The gallery was the exception |
| 3 | 1 | FIX | "takes a single gradient step" → "takes a gradient step" (solveFrame runs up to 3 steps, then search) | drag-knobs/README.md:26 | `solveFrame` runs up to 3 projected minimal-norm steps |
| 3 | 2 | OK | | drag-knobs/README.md:66, :80; drag-knobs/report.ts:172 | 500 drags on the app shell |
| 3 | 3 | OK | | drag-knobs/README.md:73, :80 | B: frozen booleans, otherwise as A. |
| 3 | 4 | OK | | drag-knobs/README.md:207 | B (frozen, line) |
| 3 | 5 | FIX | "Inside a column count the gradient is exact" → "Inside a decision region the gradient is the true slope" (the README's wording, and it is about a decision region, not only a column count) | drag-knobs/README.md:5, :233 | Inside a decision region, the frozen-boolean gradient is the true slope. |
| 3 | 6 | OK | | drag-knobs/README.md:7, :235 | evaluates 256 knob candidates as instances of the same circuit and keeps the closest valid one |
| 3 | 7 | OK | source pointer should read README.md:21, not README.md:45-46 (45-46 is about pixel drawing and learning; the claim is in the Short answer). plan.md still cites 45-46; left as is | README.md:21 | Most of the UI logic the prototypes ported became a circuit |
| 3 | 8 | OK | | README.md:39 | Combining the wins makes UI richer but not cheaper. |
| 3 | 9 | OK | | learned-bits/README.md:101, :129; lab/status.md:204 | No base run learned any rung exactly, for either unit type. ; 0 of 48 |
| 3 | 10 | FIX | "Timing is open too... until retargeting is deferred" → "In chenguini's demos, ... The runtime now steps springs to each event's time." (lab/status.md:12 records that advanceFrame steps springs to each event's timestamp, so timing is not open in the runtime; the 157 px figure is chenguini's demo semantics) | lab/status.md:12; README.md:110 | advanceFrame steps springs to each event's timestamp before applying the event |
| 3 | 11 | FIX | added "at one hundred cards" (the 7 of 20 runs and 21 px are at 100 cards) | README.md:108; README.md:220 | In lists, 7 of 20 runs at 100 cards had such a flip ; "0 mismatches" always means over the traces and samples each README names, not a proof. |
| 3 | 12 | FIX | "calls this folder a historical record" → "calls this folder the record of that exploration" (status.md does not say "historical"; it says "the record of the September 12-14, 2026 exploration") | lab/status.md:290; README.md:134 | the record of the September 12-14, 2026 exploration ; Its measurements describe the code as it was then. |
| 3 | 13 | OK | | README.md:39; lab/status.md:181-190 | richer but not cheaper ; 8. The next learning experiment |

Summary: 38 captions, 13 FIX, 25 OK. Caption lengths after edits: all at or under 220 characters (longest 220, chapter 3 caption 5).

## Visuals in plan.md with wrong numbers

1. **Chapter 2, visual machine and beat sheet 1, and on-screen labels: "left stack of circuit copies reads 48,411 ops / 61 layers" is wrong.** The duplicated circuit at 221 photos is 57,135 operations in 67 layers (Brent-Kung prefix sums, instanced-items/README.md:180; re-run of `instanced-items/report.ts sizes` gave liveOperations 57135, layers 67). 48,411 / 61 is gallery-circuit.ts (instanced-items/README.md:116), a single circuit, not copies. Use 57,135 / 67 on the stack.

I did not edit plan.md's visual text; this is for the scene authors.

## Visuals with scope or wording problems (numbers correct)

- Chapter 1, beat sheet 1 and on-screen labels: "scrollTop snaps to 1/4 px" should read "floors" (lists/list.ts:21-22).
- Chapter 1, beat sheet 2 and on-screen labels: "counter reads 280 ops / 19 layers" holds for uniform row heights with row data in JS only (lists/README.md:82-84). Say so on the label.
- Chapter 2, beat sheet 5 and on-screen labels: "pointer jumping chain 1,023 segments in 66 layers" is a line-count and widest-line measurement, not line starts (text-walker/README.md:217, :68). Do not show line starts on that chain.
- Chapter 2, beat sheet 5: the "0.18 px band on a hover edge" holds only far down the gallery (README.md:23).
- Chapter 3, beat sheet 3: "157 px apart 30 vs 120 frames per second" is chenguini's demo semantics (README.md:110). Label it that way; the runtime now steps springs to each event's time (lab/status.md:12).
- Chapter 3, beat sheet 4 and on-screen labels: "Status stamp: Historical" is not the status page's word. Use "record of the exploration" (lab/status.md:290).

## Notes for the source and the research notes (not edited)

- lab/ui-exploration/README.md:30 says the gallery "writes its per-photo program out 221 times (48,411 operations)". The 48,411 figure is gallery-circuit.ts, not the copied circuit (57,135 at Brent-Kung, 55,627 with sequential sums; instanced-items/report.ts sizes).
- lab/ui-exploration/README.md:94 says pointer jumping "recovers a 1,023-segment paragraph's lines in 66 layers". The measured 66 layers are for lineCount and maxLineWidth only (text-walker/README.md:217, :68). The research note carried the same overstatement.
- lab/ui-exploration/README.md:30 gives "2 to 4 ms per frame at 10,000 photos". The table gives 4,106 µs for the staged executor at 10,000 (instanced-items/README.md:179). An earlier run on a quieter machine gave 2,222 µs at 10,000 (instanced-items/README.md, the "Earlier exploratory runs" paragraph). Timings are machine-dependent; the captions use the table with "rough".
- Dates: lab/ui-exploration/README.md:5 says September 12-13; lab/status.md:290 says September 12-14. The captions avoid the range.
- Research-note pointer errors, now corrected here: caption 3.7 cites README.md:45-46, which should be README.md:21; caption 3.11's caveat is README.md:220 as well as README.md:108.

## Verification performed

- Pinned clone checked with `git rev-parse HEAD`: 4ea7fcb27ebe93acf49b9f29a93e162b975bad46.
- Re-ran `lab/ui-exploration/drag-knobs/report.ts` and `lab/ui-exploration/instanced-items/report.ts sizes` in a temporary copy (/tmp/hw-verify-ui), so the clone was not written. Matches: app shell strategy B 63.6% of 2,999 moving frames, 24.6% gradient-0 at start; candidate gallery B 37.6% of 1,500 moving frames; staged gallery shared 401, per-photo 233; duplicated 57,135 / 67 (Brent-Kung); gallery-circuit.ts 48,411 / 61.
- Read from source and README tables, not re-run: list sizes (lists/report.ts takes minutes), text-walker sizes (minutes), learned-bits ladder (about 7 minutes), all timings, GPU and browser checks.
