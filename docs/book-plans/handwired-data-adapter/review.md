# Data Adapter — caption review

Reviewer: fact-check pass on `book.json` captions against the pinned clone `chenglou/handwired @ 4ea7fcb27ebe93acf49b9f29a93e162b975bad46` (`.orly-work/hw-books/repo`, paths below are relative to `lab/data-adapter/` unless shown otherwise). Re-run in the clone: `bun lab/data-adapter/report.ts` (exit 0) and `bun test ./lab/data-adapter` (8 pass, 0 fail). The survivor trace (caption 8–10) was re-derived with a scratch script in `/tmp/hw-da-review/` (outside the repo and the book) and matched the research notes exactly: `anyAlive` `[34,11,11,11,11,11,8,8,8,8,8,8]`, `oneTask` `[0,6,6,6,6,6,8,8,8,8,8,8]`, per-task after scene 1 `[2,4,8,2,4,4,4,6]`, after scene 2 `[1,2,3,1,1,1,1,1]`. `fround(fround(1+2^-24)*3)` = 3, `fround((1+2^-24)*3)` = 3.000000238418579, `fround(1+2^-24)` = 1.

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | ---: | --- | --- | --- | --- |
| 1 The Lookup Circuit | 1 | OK | | README.md:3 | "exhaustive search chooses which rows to read and which arithmetic steps to apply" |
| 1 The Lookup Circuit | 2 | OK | | README.md:3 | "Nothing trains neural weights here." |
| 1 The Lookup Circuit | 3 | OK | | README.md:9 | "One circuit has 12 storage slots." |
| 1 The Lookup Circuit | 4 | OK | | README.md:13; README.md:17-19 | "select ID 20 from these active rows, regardless of their storage order" |
| 1 The Lookup Circuit | 5 | OK | | experiment.ts:129-137 | "const difference = circuit.roundAffine([[slotOffset(slot) + 1, 1], [0, -1]])" |
| 1 The Lookup Circuit | 6 | OK | | README.md:74 | "exact for this integer domain" |
| 1 The Lookup Circuit | 7 | OK | | experiment.ts:137; README.md:13-19 | "next = emitRelu(circuit, circuit.roundAffine([[absolute, -1]], 1))" |
| 1 The Lookup Circuit | 8 | OK | | README.md:11; experiment.ts:142 | "inactive rows may repeat any ID and contain misleading geometry" |
| 1 The Lookup Circuit | 9 | OK | | experiment.ts:153-155 | "const count = circuit.roundAffine(bits.map(bit => [bit, 1]))" |
| 1 The Lookup Circuit | 10 | OK | | README.md:21; experiment.ts:157-160 | "The selected left is 40; its right is 52." |
| 1 The Lookup Circuit | 11 | OK | | README.md:21; README.md:11; experiment.ts:59 | "Selecting absent ID 99 returns `found = 0` and zero for every task." |
| 1 The Lookup Circuit | 12 | OK | | experiment.ts:42; README.md:78 | "throw new Error('active IDs must be unique')" |
| 1 The Lookup Circuit | 13 | OK | | experiment.ts:121-162 | "function compileLookup(circuit: Circuit, predicates: readonly Predicate[]) {" |
| 2 868 Programs, Twelve Scenes | 1 | OK | | README.md:23-29 | "The vocabulary is deliberately small:" |
| 2 868 Programs, Twelve Scenes | 2 | OK | | README.md:27; experiment.ts:9-10 | "Zero, one, or two row predicates: active, same ID, or first storage slot." |
| 2 868 Programs, Twelve Scenes | 3 | OK | | README.md:28; experiment.ts:8 | "Read one field: left, top, width, or height." |
| 2 868 Programs, Twelve Scenes | 4 | OK | | README.md:29; experiment.ts:10 | "Apply zero, one, or two steps: add selected width, add selected height, subtract origin X, subtract origin Y, or multiply by scale." |
| 2 868 Programs, Twelve Scenes | 5 | OK | | README.md:31; experiment.test.ts:14 | "There are `7 * 4 * (1 + 5 + 25) = 868` programs." |
| 2 868 Programs, Twelve Scenes | 6 | OK | | README.md:33; experiment.ts:57-79 | "The eight target functions use native JavaScript `find` and separately written FP32 arithmetic." |
| 2 868 Programs, Twelve Scenes | 7 | OK | | README.md:66; experiment.ts:255-262 | "Training uses seeds 1 and 2, one/two/three active rows, both present and absent IDs, and integer geometry: 12 scenes" |
| 2 868 Programs, Twelve Scenes | 8 | OK | | inputs/data-adapter.md:115 (derived trace) | "candidatesWithAnyTaskAlive` = `[34,11,11,11,11,11,8,8,8,8,8,8]" |
| 2 868 Programs, Twelve Scenes | 9 | OK | | inputs/data-adapter.md:115 (derived trace) | "after scene 2 = `[1,2,3,1,1,1,1,1]`" |
| 2 868 Programs, Twelve Scenes | 10 | OK | | inputs/data-adapter.md:115 (derived trace); experiment.ts:255-262 | "`tasksWithExactlyOneSurvivor` = `[0,6,6,6,6,6,8,8,8,8,8,8]`" |
| 2 868 Programs, Twelve Scenes | 11 | OK | | report.ts:28; experiment.ts:219; README.md:66 | "Search evaluates 997 candidate/scene pairs after early rejection." |
| 2 868 Programs, Twelve Scenes | 12 | OK | | README.md:46; report.ts:29 | "None of the fitting programs omits either predicate." |
| 2 868 Programs, Twelve Scenes | 13 | OK | | report.ts:31-32; README.md:46 | "None of the fitting programs omits either predicate." |
| 3 What the Check Shows | 1 | OK | | README.md:68 | "Held-out data uses seeds 1001-1024 and counts 0, 4, 6, 9, and 12." |
| 3 What the Check Shows | 2 | OK | | README.md:68; experiment.ts:265-276 | "These 216 generated scenes use new IDs, fractional geometry, and fractional positive or negative scales." |
| 3 What the Check Shows | 3 | OK | | README.md:68; experiment.ts:278-304 | "Reversing each scene's storage adds 216 permutation checks." |
| 3 What the Check Shows | 4 | OK | | README.md:70; report.ts (allFitComparisons) | "Each answer's presence bit and coordinate are compared against both literal and compiled execution: 14,016 scalar comparisons." |
| 3 What the Check Shows | 5 | OK | | README.md:70 | "these are implementation comparisons, not additional independent samples." |
| 3 What the Check Shows | 6 | OK | | README.md:76; experiment.ts:63-76 | "Inputs are rounded to FP32 before arithmetic. Each addition, subtraction, and multiplication rounds separately." |
| 3 What the Check Shows | 7 | OK | | README.md:76; experiment.test.ts:74 | "`fround(fround(1 + 2^-24) * 3)` is 3, while rounding only after the multiplication gives a different result." |
| 3 What the Check Shows | 8 | OK | | src/runtime/numeric-ui-core.ts:414-421 | "Keep this evaluation, term order, and input wires intact, including constants." |
| 3 What the Check Shows | 9 | OK | | README.md:58; experiment.ts:168-175 | "Its row selection is computed once for all eight tasks in the combined circuit. Only four distinct fields need retrieval." |
| 3 What the Check Shows | 10 | OK | | README.md:62; experiment.test.ts:46-47 | "There is also no extra graph-size saving from naming the function." |
| 3 What the Check Shows | 11 | OK | | README.md:79-80 | "The vocabulary does not even contain enough steps for `(left + width - originX) * scale`." |
| 3 What the Check Shows | 12 | FIX | "and the answers are exact" → "and every check matches the plain lookup" | lab/status.md:199; README.md:77 | "There is no claim of exhaustive verification over every allowed FP32 value." |
| 3 What the Check Shows | 13 | OK | | lab/status.md:244; lab/ui-exploration/guide/review-and-decisions.md:254 | "The retrieval task, trained with soft attention over runtime keys, run with argmax, and compared with lab/data-adapter's authored lookup and program search." |

## Notes on the FIX and on borderline OK rows

- **Ch 3 #12 (FIX).** The README states there is no claim of exhaustive verification over every FP32 value (README.md:77), so "the answers are exact" overstates the scope. The caption now says every check matches the plain lookup. The plan.md line for this caption (line 128) is abbreviated and does not carry the claim, so it was left unchanged.
- **Ch 1 #12 (OK, scope noted).** The one-hot declaration is made only for programs whose predicates include both `active` and `same-id` (experiment.ts:148-151), not for every bit. The caption's use of "the bits" is read as the lookup's active-and-ID bits in this chapter.
- **Ch 2 #11 (OK, wording noted).** The 997 figure counts candidate-scene circuit evaluations (report.ts:28 `circuitEvaluations`), and the 10,416 comparator is 868 × 12 arithmetic, not a measured run. "About sixty milliseconds" carries the author's-machine caveat (README.md:66), and the run here gave 57 ms.

## Visuals in plan.md with a wrong number

- **plan.md:70, ch 2 beat 10 (wrong number, not edited).** The beat reads "curve reads 11 (scenes 3-6)". The trace gives 11 after scene 2 through scene 6 (`anyAlive` index 1 to 5), and 8 from scene 7. The correct range is **scenes 2-6**. The curve string in the same beat, `868 → 34 → 11 → 11 → 11 → 11 → 11 → 8 → 8 …`, is already correct.
- Checked and correct: ch 1 rows (`10: 7,3,5,9`, `20: 40,10,12,8`, `30: -6,24,20,4`, `selectedID = 20`, `originX = 4`, `scale = 2`, `left = 40`, `{found: 0, value: 0}` for id 99); ch 2 per-task bars `[2,4,8,2,4,4,4,6]` and `[1,2,3,1,1,1,1,1]`, `7 × 4 × 31 = 868`, `997` vs `868 × 12 = 10,416`, the eight survivor strings, controls `0` and `0`; ch 3 `438 = 216 + 216 + 6`, `14,016 = 438 × 8 × 2 × 2`, float ruler values, `200 / 200 / 1,118` (with "not a saving"), `gatherReads: 4`, `capacity: 12`.
