# Caption fact-check: handwired-user-effort

Reviewer: fact-check pass (role: review). Scope: all 34 captions in `book.json`, checked against the lab at `4ea7fcb27ebe93acf49b9f29a93e162b975bad46` (clone at `.orly-work/hw-books/repo`). Paths below are relative to that clone's root.

Evidence run:
- `bun lab/user-effort/report.ts` (1.5 s): every number in the report matches the captions and the README, including 0.5931, 0.0004124, the five parameters, 1.68 / 20.22 / 133.94 ms, the seed errors, and 606.37 / 624.08 ms with 120 and 88 matches.
- `bun test lab/user-effort`: 11 pass, 0 fail.
- Probe `/tmp/hw-review-probe/probe.ts` (imports the lab's own `trainPredictor`, `selectionSituations`, `expectedCost`): loss by step, the 40/60/20 valid-layout split, and per-layout costs at motor context 0.375.

Result: 31 OK, 3 FIX (ch2 #4, ch3 #4, ch3 #9).

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | OK | | lab/user-effort/README.md:3 | "then choose a permitted layout for explicitly supplied tasks" (this row's quote is the README's framing; the caption's question is narration) |
| 1 | 2 | OK | | lab/user-effort/simulator.ts:4-7; lab/user-effort/README.md:29 | "`clutter` and `motorContext` are authored numbers between zero and one." |
| 1 | 3 | OK | | lab/user-effort/simulator.ts:5 | "const difficulty = Math.log2(1 + input.distance / input.targetWidth)" |
| 1 | 4 | OK | | lab/user-effort/simulator.ts:6 | "return 200 + 110 * difficulty + 180 * input.clutter + 80 * input.motorContext + 65 * input.motorContext * difficulty" |
| 1 | 5 | OK | | lab/user-effort/simulator.ts:6 | "80 * input.motorContext + 65 * input.motorContext * difficulty" |
| 1 | 6 | OK | | lab/user-effort/simulator.ts:9,59; lab/user-effort/README.md:54 | "export const noiseHalfWidthMs = 35" ; "The injected uniform noise has a standard deviation of about `20.21` ms" (35/√3 = 20.207) |
| 1 | 7 | OK | | lab/user-effort/README.md:37; lab/user-effort/simulator.ts:10-15 | "There are 720 training observations and 192 held-out observations." (5 × 4 × 3 × 3 combinations × 4 repetitions = 720) |
| 1 | 8 | OK | | lab/user-effort/README.md:37; lab/user-effort/simulator.ts:16-21; lab/user-effort/user-effort.test.ts:30-36 | "The held-out distances, widths, clutter values, and motor contexts do not appear in training" |
| 1 | 9 | OK | | lab/user-effort/predictor.ts:10,13 | "return Float32Array.of(Math.log2(1 + input.distance / input.targetWidth) / 6, input.clutter, input.motorContext)" ; "export function createPredictor(parameters: readonly number[] = [0, 0, 0, 0, 0]) {" |
| 1 | 10 | OK | | lab/user-effort/predictor.ts:15-29; lab/user-effort/report.ts:24 | "circuit: {sources: model.circuit.sourceSize, operations: model.circuit.operations.length, layers: Math.max(...model.circuit.depths)}" (report output: sources 8, operations 6, layers 3) |
| 1 | 11 | OK | | lab/user-effort/README.md:54; lab/user-effort/README.md:3 | "so the noise-level observation error is expected in this deliberately favorable setting." |
| 2 | 1 | OK | | lab/user-effort/predictor.ts:13; lab/user-effort/report.ts:23 | "initialMseSecondsSquared: trained.losses[0]" (report output 0.5930691683488131) |
| 2 | 2 | OK | | lab/user-effort/predictor.ts:54-60 | "const backward = model.circuit.backpropagateReference(values, outputGradients)" |
| 2 | 3 | OK | | lab/user-effort/predictor.ts:42,69; lab/user-effort/README.md:33,41 | "The study does not tune hyperparameters against these test cases." |
| 2 | 4 | FIX | "The loss collapses: about point zero two five after ten steps, point zero zero one after a hundred, and flat near point zero zero zero four from step four hundred on." → "The loss collapses: about point zero two five at step ten, point zero zero one at step one hundred, and flat near point zero zero zero four from step four hundred on." | lab/user-effort/predictor.ts:71 | "losses.push(loss)" (see note 1: the value at step ten is losses[9] = 0.02526; after ten updates the next recorded value is losses[10] = 0.04236, so "after ten steps" was wrong) |
| 2 | 5 | OK | | lab/user-effort/report.ts:25 | "parametersSeconds: parameterNames.map((name, index) => ({name, value: trained.parameters[index]}))" (report output 0.19978737831115723, 0.6640243530273438, 0.17910219728946686, 0.07529772818088531, 0.3998945951461792) |
| 2 | 6 | OK | | lab/user-effort/simulator.ts:6; lab/user-effort/predictor.ts:10 | "return 200 + 110 * difficulty + 180 * input.clutter + 80 * input.motorContext + 65 * input.motorContext * difficulty" (authored in seconds on the feature scale: 0.2, 110·6/1000 = 0.66, 0.18, 0.08, 65·6/1000 = 0.39; largest gap is 0.0099 on the interaction) |
| 2 | 7 | OK | | lab/user-effort/README.md:51-52; lab/user-effort/report.ts:29-30 | "Held-out, simulator mean" ; "Constant training-mean baseline, held-out simulator mean" (report RMSE 1.6846 and 133.9439 ms; these are root-mean-square errors, which the caption calls "the error") |
| 2 | 8 | OK | | lab/user-effort/README.md:50,54; lab/user-effort/report.ts:27 | "Held-out, noisy observations" (report RMSE 20.2175 ms) ; "standard deviation of about `20.21` ms" (the noise floor is an expectation, so "can't go below it" is read as "no predictor can do better in expectation") |
| 2 | 9 | OK | | lab/user-effort/README.md:54; lab/user-effort/report.ts:33-41 | "Three fresh training seeds give held-out mean errors of `0.76`, `0.67`, and `0.86` ms." (report 0.7597, 0.6666, 0.8626) |
| 2 | 10 | OK | | lab/user-effort/README.md:37,70; lab/status.md:198 | "This is interpolation, not a test of unfamiliar human behavior." ; "No human observations, error prediction, or usability claim." |
| 3 | 1 | OK | | lab/user-effort/README.md:3; lab/user-effort/selection.ts:29-43 | "then choose a permitted layout for explicitly supplied tasks" |
| 3 | 2 | OK | | lab/user-effort/selection.ts:8-11 | "control('confirm', 190, 220, 32)" (near-small, 32 px buttons) ; "control('confirm', 430, 200, 72)" (balanced, 72 px buttons in a column) |
| 3 | 3 | OK | | lab/user-effort/selection.ts:22-25 | "for (const task of controlIDs) total += situation.taskProbabilities[task] * cost(effortInput(layout, task, situation.pointer, situation.motorContext))" |
| 3 | 4 | FIX | "Say eighty percent of users confirm. Wide-confirm wins at about five hundred forty-six milliseconds. Balanced follows at five eighty-nine, then wide-details, and near-small last at six eighty-five." → "At motor context point three seven five, say eighty percent confirm. Wide-confirm wins at about five hundred forty-six milliseconds, balanced at five eighty-nine, wide-details next, near-small last at six eighty-five." | lab/user-effort/selection.ts:22-43; lab/user-effort/report.ts:42 | "\"motorContext\": 0.375" ; "\"optimumMs\": 546.2650285664621" (the costs depend on motor context, and the report's examples are at 0.375, minimum target width 32, maximum clutter 1; probe: balanced 589.51, wide-details 659.46, near-small 685.33) |
| 3 | 5 | OK | | lab/user-effort/selection.ts:9-10; lab/user-effort/user-effort.test.ts:113-119; lab/user-effort/report.ts:42 | "control('details', 340, 240, 104)" (wide-details is wide-confirm with the confirm and details ids swapped, so the same 546.27 follows by construction; report details-heavy row: wide-details 546.2650285664621) |
| 3 | 6 | OK | | lab/user-effort/selection.ts:66-70 | "{name: 'shortest-distance', cost: (input: EffortInput) => input.distance}," (probe, confirm-heavy at 0.375: near-small expected distance 120.49 px vs 279.70, 372.97, 347.18; near-small simulator cost 685.33 is last of four) |
| 3 | 7 | OK | | lab/user-effort/domain.ts:45-65; lab/user-effort/selection.ts:34-41 | "if (layoutViolations(layout, situation.constraints).length !== 0) continue" ; "if (value < minimum) {" (strict, so the earlier layout wins a tie) |
| 3 | 8 | OK | | lab/user-effort/README.md:58-64; lab/user-effort/report.ts (allSituations) | "Learned effort | 606.37 ms | 120/120" (report meanDurationMs 606.3737, matchesOptimal 120) ; "Shortest expected distance | 624.08 ms | 88/120" (report 624.0845, matchesOptimal 88) |
| 3 | 9 | FIX | "But count the real choices. Forty situations allow only one valid layout, sixty allow three, and just twenty allow all four. So that one hundred twenty of one hundred twenty is padded with trivial cases." → "But count the real choices. Forty situations allow only one valid layout, sixty allow three, and just twenty allow all four. So forty of the one hundred twenty are trivial wins." | lab/user-effort/README.md:64; lab/user-effort/selection.ts:55-57 | "Some constraints allow only one candidate, making those cases trivial." (the split is 40 one-layout, 60 three-layout, 20 four-layout, verified by probe; only the 40 are trivial, so "padded with trivial cases" overstated the 60 three-way cases) |
| 3 | 10 | OK | | lab/user-effort/README.md:64; lab/user-effort/report.ts (allCandidatesAllowed) | "learned effort matches the simulator's choice 20/20; shortest distance matches 0/20 and costs an extra `102.58` ms on average." |
| 3 | 11 | OK | | lab/user-effort/selection.ts:66-69; lab/user-effort/predictor.ts:10; lab/user-effort/report.ts:16 | "Synthetic durations only; the simulator formula and predictor features are deliberately matched." |
| 3 | 12 | OK | | lab/status.md:198; lab/user-effort/README.md:70-74; bun test | "Predictor features deliberately match the simulator. No human observations, error prediction, or usability claim." ; bun test "11 pass" "0 fail" (see note 2 on the word "holds") |
| 3 | 13 | OK | | lab/user-effort/README.md:3,70; lab/status.md:198 | "It does not learn what the user should want." |

## Notes

1. **Loss steps.** `losses[k]` is the loss computed at the start of step k+1, before that step's update (`predictor.ts:51-71`). So "step ten" is `losses[9]` = 0.02526, "step one hundred" is `losses[99]` = 0.001047, and step four hundred is `losses[399]` = 0.000415. After ten updates the next recorded value is `losses[10]` = 0.04236, so the early curve is not monotone. The plan's ch2 beat 4 (`step 10 (0.0253)`, `100 (0.00105)`, `400 (0.000415)`) uses this same convention and is consistent after the fix. The probe values are not printed by `report.ts`; the plan's on-screen note already says so.
2. **"Holds."** `lab/status.md:198` contains no "HOLDS" label. Its row says 1.68 ms error, 120/120 with 20/20 unrestricted, and no human observations, error prediction, or usability claim. Ch3 #12 ("The status is that it holds") is kept as OK because it rests on the 11/11 test run and the reproduced report, but the word "status" comes from the author, not from `status.md`. The plan's header line ("HOLDS at the pin [lab/status.md:198]") and the ch3 visual's `label "HOLDS (synthetic)"` are therefore not sourced from `status.md`.
3. **40/60/20 split.** Not printed by `report.ts` or the README. It follows from the constraint grid in `selection.ts:55-57` (5 goals × 4 contexts × 3 widths × 2 clutter caps) and was reproduced by the probe: `{1: 40, 3: 60, 4: 20}`.

## Visuals in plan.md (for the scene authors)

Checked every number in the visual sections against the report and the probe. No visual shows a wrong number. Items to know:

- **Ch1, beat 3:** worked example `distance 440, width 40 → 3.58`. log2(12) = 3.585; 3.58 is the correct two-decimal truncation. It is marked illustrative, and it is not a lab output.
- **Ch2, beat 4:** markers at step 10 (0.0253), step 100 (0.00105) and step 400 (0.000415) are correct under the step convention in note 1. Do not label them "after ten updates", which would be 0.0424.
- **Ch3, beat 4:** bars 546.27 / 589.51 / 659.46 / 685.33 are correct for motor context 0.375, minimum width 32, maximum clutter 1. Show that setting on screen, since the caption now states it.
- **Ch3, beat 6:** near-small distance 120.49 is correct.
- **Ch3, beats 8-10 and the status board:** 606.37 vs 624.08, 120 and 88 matches, 40 / 60 / 20 split, 20/20 vs 0/20, regret 102.58 and 11/11 are all correct. The beat 9 headline `"120/120"` is overlaid with the breakdown, which is consistent with the caption fix. The status board label `"HOLDS (synthetic)"` is not in `status.md` (note 2).
- **Ch2 on-screen labels:** `finalPreUpdateMseSecondsSquared 0.000412`, `initialMseSecondsSquared 0.593`, `heldOutNoisy 20.22 ms`, the seeds 1731 / 2731 / 3731 and the parameter values are all correct.
