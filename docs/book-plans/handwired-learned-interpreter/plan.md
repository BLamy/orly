# Plan: Learned Program (handwired-learned-interpreter)

- Title: **Learned Program**. Subtitle: Training two instructions of a tiny interpreter, what a fixed epsilon broke, and what integer examples cannot say.
- Animal: **octopus** (many arms, one choice per arm). Accent: `#8d5fd3`.
- Pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46, `lab/learned-interpreter`. Paths below are relative to `lab/learned-interpreter/` unless they begin with `lab/` or `src/`.
- Throughline noun: **the card** (one candidate instruction) in ch. 1; **the table** (48 x 75 cells) in ch. 2-3.
- Status said plainly: the corrected optimizer result **holds** on this task (21 tests pass, tables reproduce); the claim is **narrowed** (integer training domain, one fixed two-instruction straight-line shape, 4 inputs); the grouping question is **open**; scalable synthesis is **not established**; the soft-output trainer numbers are **historical**.
- Research: `.orly-work/hw-books/inputs/learned-interpreter.md`. Fixes taken from the earlier notes:
  - The "epsilon caused it" sentence is quoted from `README.md:7` ("caused most of the reported hard-loss failure"), not from the reassessment. Captions say "most", never "the cause".
  - "Does not scale" becomes "does not establish scalable program synthesis" (`README.md:9`).
  - Circuit size is the live **250** operations (77 affine, 173 ReGLU), not the stale 240 in the committed JSON.
  - The earlier plan's "reels frozen flat" is **wrong**. A real probe run (below) shows the old-epsilon reel locks confidently on a WRONG card (coordinate) or stays diffuse (two-add) and the loss plateaus. Show that, not flat bars.
  - Soft-output trainer is told as history with its two honest numbers (11/20 coordinate, 0/20 full two-add); the add-only 20/20 -> 9/20 rows are left out of captions but the scene may show them in the chapter 3 side ledger.
- Re-defined briefly, not re-taught: relu, one-hot, argmax (leftmost wins ties), circuit. The book "Handwired" covers the rest.

## Probe data (planner-run, not in the committed JSON; Opus may use these real values)

Run with the clone read-only, script kept outside the repo. It calls `trainWithExpectedProgramLoss(seed, task, {...defaultDiscreteTrainingConfig, adamEpsilon})` and prints `phases` (`discrete-training.ts:216-220, 334-337`). Per phase: `[temperature, expectedLoss, [largest p of instruction 0, largest p of instruction 1]]`, probabilities taken at the end of each phase.

```
const d = await import('<repo>/lab/learned-interpreter/discrete-training.ts')
d.trainWithExpectedProgramLoss(541, {kind:'coordinate'}, {...d.defaultDiscreteTrainingConfig, adamEpsilon: 1e-8 | 1e-14})
d.trainWithExpectedProgramLoss(501, {kind:'two-add', thirdAddend:'distractor'}, ...same)
```

Coordinate, seed 541, **original** (epsilon 1e-8): decodes to `subtract(pointerX, panelLeft)` then `add(instruction0, instruction0)` (WRONG).
| T | expected loss | max p (instr 0, instr 1) |
|---|---|---|
| 2 | 0.1481 | 0.02756, 0.01563 |
| 1 | 0.009872 | 0.9973, 0.9878 |
| 0.5 | 0.009766 | 1, 1 |
| 0.25 | 0.009766 | 1, 1 |
| 0.125 | 0.009766 | 1, 1 |

Coordinate, seed 541, **corrected** (epsilon 1e-14): decodes to `subtract(pointerX, panelLeft)` then `multiply(instruction0, scale)`.
| T | expected loss | max p (instr 0, instr 1) |
|---|---|---|
| 2 | 0.1481 | 0.02756, 0.01563 |
| 1 | 0.009872 | 0.9973, 0.9878 |
| 0.5 | 7.423e-5 | 1, 0.5026 |
| 0.25 | 1.283e-8 | 1, 0.513 |
| 0.125 | 6.636e-16 | 1, 0.5406 |

(Both runs are identical through temperature 1, then diverge. Instruction 1 ending near 0.54 fits the two equivalent coordinate programs that differ only in multiply operand order, `README.md:49`; that reading is an inference, label it so if shown.)

Two-add, seed 501, **original**: decodes to `add(pointerX, panelLeft)` then `add(panelLeft, distractor)` (WRONG), loss plateau 0.0007324, max p ends 0.3256, 0.1875 (diffuse). **Corrected**: `add(pointerX, panelLeft)` then `add(instruction0, distractor)`, loss 1.124e-10, max p 0.5629, 0.5095.
Loss values are the expected loss from the 48 x 75 table (mean of 0.5 * ((prediction - target) / 256)^2), times the loss multiplier (1).

---

## Chapter 1: A Program in 123 Cells
Thesis: a learned program here is two one-hot choices among 48 and 75 candidate instructions, held in 123 cells that are the same for every example.

**Visual machine: "the register strip and the two card fans."** Left: a strip of four input registers (`pointerX`, `panelLeft`, `scale`, `distractor`) whose values change row after row (a ticker of example rows, each showing the same fixed program column on the right). Center: instruction 0 appears as a fan of 48 small cards arranged in three op-groups (add, subtract, multiply), each group a 4 x 4 block of (left, right) pairs. Instruction 1 appears below as a fan of 75 cards (three groups of 5 x 5) whose extra row and column is `instruction0`. Each card has a thin dial bar under it (its selector cell). Camera pushes onto a single card's computation, pulls back to the two fans, then to the winning pair. A sum-bus on the right adds dial-scaled card results.

Beat sheet
1. Example-row ticker: three rows with different inputs, each ending in an answer; a column labeled "one program" stays fixed while inputs change. Caption 1 sets the question.  (1)
2. Four register cells fill with the example values; the ticker pauses on one row. (2)
3. Three op chips (`add`, `subtract`, `multiply`); a single card builds: op + left + right. (3)
4. Fan of 48 deals out in three groups; counter 3 x 4 x 4 = 48. Fan of 75 deals out; a fifth register `instruction0` slides in and the grid grows to 5 x 5; counter 3 x 5 x 5 = 75. (4)
5. Camera pushes on instruction 0: every card shows its own result number, each is multiplied by its dial, a bus sums them. Two dials at 0.5 each (subtract and add) give a visibly blended sum, tagged "soft". (5)
6. Hardening: dials sweep; all but one drop to 0, the leftmost largest rises to 1; tie demo with two equal dials, the left card wins. Sum bus now carries one exact result. (6)
7. Cell counter: 48 + 75 = 123 program cells, plus 4 input cells = 127 source cells; a "no example id, no per-example parameter" strikethrough tag. (7)
8. Two target chips slide in: coordinate = (pointerX - panelLeft) x scale and two-add = (pointerX + panelLeft) + distractor, each drawn as two steps on the register strip. (8)
9. A checker lane under the strip: `fround` badge after every step; mismatch vs match marks. (9)
10. Pull back: circuit badge, 250 operations split into 77 affine and 173 ReGLU bars; soft 8 layers, hard 6 layers. (10)
11. Quiet recap: the two fans dim to 0.15 opacity; the two winning cards (generic outline, not a claimed program) float to center with "one-hot, one-hot". (11)

Captions
1. Here's the question: can training find one reusable program, instead of a separate answer for every input? This lab fixes a tiny interpreter and lets learning choose what it runs. [README.md:3-5]
2. Four inputs change on every example: the pointer position, the panel's left edge, a scale, and a distractor. The same program has to work for all of them. [program.ts:12; README.md:5]
3. A program is two instructions. Each picks one operation, add, subtract, or multiply, and an ordered pair of values to apply it to. [program.ts:15-16, 54-64]
4. Instruction zero reads the four inputs, so it has three operations times four times four: forty-eight candidates. Instruction one can also read instruction zero's result, which makes seventy-five. [README.md:13; program.ts:71]
5. Every candidate gets its own dial. The circuit computes all the candidates' results, multiplies each by its dial, and adds them up. That weighted sum is the soft program. [program.ts:93-115; README.md:13]
6. Training will push one dial per instruction toward one, and the rest toward zero. Then the leftmost largest dial wins, and the soft mixture becomes one exact instruction. [program.ts:127, 179-199; README.md:13]
7. Count the cells. Forty-eight plus seventy-five is one hundred twenty-three program cells, beside four input cells. There is no example number and no per-example setting to cheat with. [program.ts:66-91; README.md:15]
8. Two tasks test it. The coordinate task subtracts the left edge from the pointer, then multiplies by the scale. The two-add task adds the pointer to the left edge, then adds the distractor. [oracle.ts:16-27; README.md:23-36]
9. A separate checker computes each answer, rounding to a thirty-two-bit float after every step. A learned program has to match that checker, not just land close. [oracle.ts:16-27; README.md:19]
10. Run today, the circuit has two hundred fifty operations: seventy-seven weighted sums and one hundred seventy-three relu-gated products. The soft and hard versions have the same count. [`bun lab/learned-interpreter/report.ts` "Measured circuit" table; README.md:17]
11. So a learned program is just a pair of one-hot choices among those cards. The next chapter asks how training finds them, and what went wrong the first time. [program.ts:189-218]

On-screen labels: `inputNames`, `pointerX`, `panelLeft`, `scale`, `distractor`, `add`, `subtract`, `multiply`, `3 x 4 x 4 = 48`, `3 x 5 x 5 = 75`, `instruction0`, `createProgramLayout`, `emitCandidate`, `emitInstruction`, `hardenProgram`, `groupWinner` ("leftmost argmax, strict >"), `assumeOneHot`, "123 program cells", "4 runtime cells", `Math.fround`, "250 operations / 77 affine / 173 reglu", "soft: 8 layers / hard: 6 layers". Example input values on the ticker are illustrative (label them "example"); the formulas are the lab's.

---

## Chapter 2: Cooling the Reels
Thesis: the lab scores all 3,600 programs once, trains row and column probabilities against that table, and a tiny Adam constant decided whether the reels ever moved.

**Visual machine: "the 48 x 75 loss table with a reel on each edge."** A heat grid of 3,600 cells (rows = instruction 0, columns = instruction 1). Along the left edge a vertical reel of 48 bars, along the top a horizontal reel of 75 bars (bar height = probability). A temperature dial (2 -> 0.125) with five tick marks sits top right, and a loss readout (log scale) bottom right. In the second half the stage splits into two panels (OLD epsilon 1e-8, left; NEW epsilon 1e-14, right) driven by the same seed, sharing the grid. Camera: wide on the grid, push into the cell fill, push onto the reels, split-screen pull back for the scoreboard.

Beat sheet
1. Grid builds: a scan sweeps through example columns; two counters tick up toward 707,472 and 53,060,400 evaluations while cells light by loss. (1)
2. Grid settles at 48 x 75, 14,739 examples label; storage tag 28,800 bytes. (2)
3. Zero-loss cells go dark and ring: toggling task shows 2 cells (coordinate) then 12 cells (two-add). (3)
4. Reel bars rise on both edges (uniform, tiny); their outer product paints a transparent overlay on the grid; a sum bar labeled expected loss. (4)
5. Temperature dial turns from 2 through 1, 0.5, 0.25, 0.125, five phases of 500 steps; reels' bars start sharpening (real probe values for seed 541). (5)
6. Split screen "original epsilon". Coordinate seed 541 old run: reel 1 locks on `subtract(pointerX, panelLeft)` by T=1 (0.9973); reel 2 locks on the wrong card `add(instruction0, instruction0)` (0.9878 at T=1, then 1); the loss line goes flat at 0.009766 while the right panel is identical up to T=1. (6)
7. Zoom on the Adam update line `lr * m̂ / (sqrt(v̂) + adamEpsilon)`; the denominator bar shows epsilon term dominating when the gradient term is short (diagrammatic; no measured magnitude). A small "shrinks the step" arrow. (7)
8. Right panel, epsilon 1e-14: after T=0.5 reel 2 slides off the wrong card, the loss line drops 0.009872 -> 7.4e-5 -> 1.3e-8 -> 6.6e-16. (8)
9. Reel 2's final top bar at 0.5406: two near-equal tall bars (`multiply(scale, instruction0)` and `multiply(instruction0, scale)`) share the mass. Tag "inference: two equivalent orderings". (9)
10. Equivalence demo: a "loss x 1e6, epsilon 1e-8" dial next to "epsilon 1e-14"; the two runs overlay and a counter shows 120 paired runs, 0 different programs, max probability gap 7.1e-7 (two-add) / 1.1e-13 (coordinate). (10)
11. Scoreboard: six rows (3 coordinate seed sets, 3 two-add seed sets) x columns original / corrected; original column all 0 (total 0 of 120), corrected coordinate 20/20 x 3 = 60/60, two-add 19 + 20 + 20 = 59/60. (11)
12. Seed 519 highlighted in the first two-add row as a standing failure (corrected loss 0.000732421875, program 27); status tag "holds on this task, diagnosis unfinished". Grid fades to 0.15 under the closing text. (12)

Captions
1. Here's what makes training possible. Before learning anything, the lab runs every one of the three thousand six hundred possible programs on every training example, and records the error in one table. [discrete-training.ts:48-106; README.md:55, :80]
2. The table has forty-eight rows and seventy-five columns. Each cell holds one complete program's average error over fourteen thousand seven hundred thirty-nine training examples. [oracle.ts:57-58; discrete-training.ts:60, 89; discrete-training.test.ts:30]
3. Most cells glow with error. For the coordinate task exactly two cells go dark, zero error on every training example. For the two-add task, twelve do. [discrete-training.test.ts:32, 36; program.test.ts:116-118]
4. Training never touches a program directly. It keeps one probability per row and one per column, and minimizes the expected error: row probability, times cell error, times column probability, summed. [discrete-training.ts:145-174; README.md:55]
5. A temperature starts hot, at two, so the probabilities stay spread out. It cools through five phases of five hundred steps, down to one eighth, sharpening each reel toward a single card. [training.ts:44-50; README.md:53]
6. Now one coordinate run with the original optimizer setting. The first reel finds subtracting the left edge from the pointer. The second reel locks onto the wrong card, and the error stops falling. [probe: coordinate seed 541, original, phases table above; discrete-training.ts:334-337]
7. The optimizer is Adam, which divides each step by the gradient's recent size plus a tiny constant, epsilon. The lab reports that the old epsilon dominated the small gradients here, so steps shrank. [discrete-training.ts:300-315; README.md:7]
8. Shrink epsilon to ten to the minus fourteen, and the same run escapes. The second reel leaves the wrong card, and the error falls toward zero. [probe: coordinate seed 541, corrected; discrete-training.ts:198-203]
9. The second reel ends near one half, not one. That fits the two equivalent coordinate programs, which differ only in the order of the multiplication. [probe max p 0.5406 (inference); README.md:49]
10. You can get the same effect without touching epsilon: multiply the loss by a million. All one hundred twenty paired runs then choose identical programs, and their final probabilities differ by almost nothing. [README.md:57-61; study-results.json epsilonScalingAgreement; report.ts:81-85]
11. The scoreboard: with the original epsilon, none of one hundred twenty runs recovered a program. Corrected, all sixty coordinate runs do, and fifty-nine of sixty two-add runs get every integer example right. [README.md:65-72, :7; lab/status.md:196]
12. One two-add seed still fails, and the settings were not retuned for it. The lab says epsilon caused most of the failure, not all of it, and the reassessment's numerical diagnosis is unfinished. [README.md:7, :76; lab/reassessment-2026-09-03.md:132-134]

On-screen labels: `buildProgramLossMatrix`, "3,600 programs", "14,739 examples", "707,472 first-instruction evaluations", "53,060,400 second-instruction evaluations", "28,800 bytes", "coordinate: 2 zero-loss programs", "two-add: 12 zero-loss programs", `p0ᵀ L p1`, `trainWithExpectedProgramLoss`, temperatures `2, 1, 0.5, 0.25, 0.125`, learning rates `0.02, 0.02, 0.01, 0.005, 0.002`, "500 steps per phase", `adamEpsilon: 1e-8` vs `1e-14`, `lossMultiplier: 1e6`, `lr * m̂ / (sqrt(v̂) + adamEpsilon)`, `lossScale: 256`, "120 paired runs, 0 different programs", "max probability gap 7.1e-7 / 1.1e-13", the scoreboard numbers, "seed 519". Probe values are labeled "one run: coordinate, seed 541".

---

## Chapter 3: What Integers Cannot Say
Thesis: twelve programs pass on whole numbers, only four survive exact float checks, because integer data cannot tell which way to group the additions; and every search route still scores the full table first.

**Visual machine: "the funnel and the float ladder."** Top: a row of 12 program chips (integer-exact two-add programs) drops through a strip labeled with the 39,605 certification cases; 8 chips are struck (red), 4 survive. Bottom: a two-row "float ladder" for the probe (`pointerX = 1`, `panelLeft = 2^-24`, `distractor = -1`) showing the two groupings on a number line near 1 with the half-step 2^-24 gap enlarged. Later a log-scale bar chart (reads vs evaluations) and a final status ledger. Camera: wide on funnel, push onto the ladder rungs, pull back to the bars and the ledger.

Beat sheet
1. Twelve chips appear, each labeled with its two instructions in short form, all ticked "integer exact". (1)
2. A scanner bar sweeps across a stack of 37,188 + 2,401 + 16 = 39,605 case dots (three colors). (2)
3. Eight chips are struck out; four remain, each a variant: first add `pointerX, panelLeft` (either order), second add `distractor, instruction0` (either order). (3)
4. Camera drops to the ladder, row A: `1 + 2^-24` lands exactly midway between 1 and the next float, rounds to 1; then `+ (-1)` gives 0. (4)
5. Row B: `2^-24 + (-1)` is exactly representable; `+ 1` gives 2^-24. Row A and B results sit side by side, 0 vs 2^-24, with the target marked from row A. (5)
6. A grid of small integer sums shows both groupings agreeing in every cell (tick marks), next to the one probe cell where they disagree. Caption quote "Integer examples alone cannot identify which grouping is required" on a plate. (6)
7. Tally bars: coordinate 20 + 20 + 20 integer and full; two-add integer 19 + 20 + 20 = 59 vs full 5 + 3 + 7 = 15 of 60. (7)
8. Enumeration scan: a cursor reads 3,600 table entries left to right, first minimum wins, stops marked on the winner (`add(pointerX, panelLeft)` then `add(distractor, instruction0)` for two-add; index 0). (8)
9. Coordinate-descent move on the grid: a cross-hair scans the 75 entries of a row, then the 48 of a column; counter 1 + 75 + 48 = 124. A tag "repair, not search from scratch". (9)
10. Log-scale bars: 124 reads, 3,600 reads, 53,060,400 evaluations; the last bar towers and is labeled "paid before any method runs". (10)
11. Side ledger: soft-output trainer rows, coordinate 11/20 and 11/20, two adds full vocabulary 0/20 and 0/20, stamped "historical". (11)
12. Status ledger: four stamps — "holds" (corrected hard-loss tables, 21 tests), "narrowed" (integer domain, two instructions), "open" (does fractional data identify the grouping?), "historical" (soft trainer). Stage fades to 0.15 beneath. (12)
13. Closing plate listing untested: data-dependent choices, loops, varying lengths, longer programs, scoring without a full table, with the README sentence "Neither establishes scalable program synthesis." (13)

Captions
1. Training counts a program as recovered once it gets every integer example right. For the two-add task, twelve different programs do that. [program.test.ts:116-118; discrete-training.test.ts:32]
2. Then comes the strict checker: thirty-nine thousand six hundred five cases, whole numbers, fractions, and input-rounding tests, each compared against the independent oracle. [oracle.ts:90-160; README.md:40-47; training.ts:273-310]
3. Only four of the twelve survive. All four add the pointer to the left edge first, then add the distractor, and each addition may swap its two operands. [README.md:49; program.test.ts:111-124]
4. Why do the others fail? Set the pointer to one, the left edge to two to the minus twenty-fourth, and the distractor to minus one. Adding pointer and edge first rounds back to exactly one, and minus one gives zero. [program.test.ts:126-132; README.md:51]
5. Group them the other way and the edge plus minus one is exact. Adding the pointer then leaves two to the minus twenty-fourth. Same three numbers, same two additions, a different answer. [program.test.ts:126-132; README.md:51]
6. Small whole numbers add exactly in either grouping, so this lab's small integer examples cannot tell the groupings apart. In the lab's words, integer examples alone cannot identify which grouping is required. [README.md:51, :105; inference: "which means" clause]
7. So the tally splits. Of sixty corrected two-add runs, only fifteen pass the full checks, while all sixty coordinate runs still do. The training data, not the optimizer, is the limit here. [README.md:7, :65-72; lab/status.md:196]
8. Reading the table directly is a baseline too: all three thousand six hundred entries, the first minimum wins. On these tasks that program also passes the full checks. [discrete-training.ts:503-522; README.md:80]
9. Starting from each failed run, one sweep of exact coordinate updates reaches zero integer error in one hundred twenty-four table reads. That repairs a run. It does not search from scratch. [discrete-training.ts:524-564; README.md:78]
10. And every hard-loss route reuses the table, which took over fifty-three million second-instruction evaluations to build. Nothing here avoids scoring every complete program first. [README.md:80; lab/status.md:196]
11. The earlier soft-output trainer, which averages candidate outputs and follows the error, recovered eleven of twenty coordinate runs and none of twenty full two-add runs. Those results are historical. [README.md:88-101; training.ts:39-41]
12. The status, plainly: the corrected optimizer result holds on this two-instruction task. It is narrowed to integer data, and the open question is whether fractional examples can identify the grouping. [lab/status.md:196, :244]
13. Untested: data-dependent choices, loops, varying lengths, longer programs, or training without a full loss table. In the lab's words, neither result establishes scalable program synthesis. [README.md:9, :107; lab/status.md:244]

On-screen labels: "12 integer-exact", "4 full-certification", "39,605 cases = 37,188 integer + 2,401 fractional + 16 input-rounding", `createCertificationCases`, `verifyProgram`, `pointerX = 1`, `panelLeft = 2^-24`, `distractor = -1`, `(pointerX + panelLeft) + distractor = 0`, `(panelLeft + distractor) + pointerX = 2^-24`, `enumerateLossMatrix` ("3,600 reads, first minimum wins"), `coordinateDescentOnLossMatrix` ("124 reads, 1 sweep"), "53,060,400", tally "59/60 integer, 15/60 full (5 + 3 + 7)", "coordinate 60/60 both", soft trainer "11/20, 0/20", status stamps "holds / narrowed / open / historical", "Neither establishes scalable program synthesis." (README:9). Reassociation reading on the ladder (row A vs row B) is exact arithmetic checked by `program.test.ts:126-132`.

---

## Claim -> source notes
- 48/75 candidates, 123 cells, one-hot via leftmost argmax: `README.md:13-15`; `program.ts:54-91, 179-218`.
- Table: 3,600 entries, 28,800 bytes, 14,739 examples, 707,472 / 53,060,400 evaluations: `discrete-training.ts:48-106`; `discrete-training.test.ts:30`; `README.md:80`; live `report.ts` output.
- Zero-loss counts 2 (coordinate) and 12 (two-add): `discrete-training.test.ts:32-37`; `program.test.ts:116-118`.
- Schedule: temperatures 2, 1, 0.5, 0.25, 0.125, 500 steps each: `training.ts:44-50`; `README.md:53`.
- Epsilon: old 1e-8, hard-loss default 1e-14, equivalent to loss x 1e6: `discrete-training.ts:198-203`; `report.ts:81-85`; `README.md:57-61`.
- Scoreboard 0 of 120 / 60 of 60 / 59 of 60 / 15 of 60: `README.md:65-72`; `study-results.json hardStudies[*].summary`; `lab/status.md:196`.
- Open question and untested scope: `lab/status.md:244`; `README.md:105-107`.
- Pin mismatch to avoid: committed JSON shows 240 operations; use live 250.
