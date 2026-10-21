# Handwired: User Effort

- **slug:** handwired-user-effort · **title:** User Effort
- **subtitle:** A tiny circuit learns how long a click takes, then picks the faster layout
- **animal:** three-toed sloth · **accent:** `#8a9a5b` (moss)
- **Lab:** `lab/user-effort` of chenglou/handwired @ `4ea7fcb27ebe93acf49b9f29a93e162b975bad46`
- **Throughline noun:** the click (one pointer task: a pointer, a target, a duration in milliseconds).
- **Status, said plainly:** HOLDS at the pin (README table reproduces, `bun test` 11/11). Synthetic only. [lab/status.md:198]
- **Corrections taken from the review:** "120/120" is never stated bare (only 20 of 120 situations allow all four layouts; 40 allow one); 1.68 ms is against the noise-free formula, 20.22 ms against noisy data; "dialog" and "Fitts" are not used.
- Re-define on first use only: relu is not needed here; "circuit" = fixed program of weighted sums and products (ch1).

---

## Chapter 1: A Law We Wrote
**Thesis:** The truth is a formula the authors wrote; the learner gets the same three features and must recover five coefficients.

**Visual machine: "the click bench."** Left: a pointer dot at the origin of a long track, a target bar at distance D with width W. Right: a duration-vs-difficulty plot where a mean line is drawn and a cloud of noisy dots (seeded, ±35 ms) fills in around it. Below: the circuit strip (3 feature sources, 5 parameter chips, products and a sum). Camera pushes in on the track, pulls back to the plot, then to the circuit.

**Beat sheet**
1. Track with pointer and a wide near target; a click ripple; duration readout ~short. Then target swaps to far and narrow; readout climbs. (c1)
2. The four simulator inputs appear as labelled chips over the target: distance, width, clutter, motorContext. (c2)
3. Distance and width fold: KaTeX `log2(1 + distance / targetWidth)` with a tick marker on a difficulty axis; near-wide sits low, far-narrow high. Worked example (illustrative, not a lab output): distance 440, width 40 → 3.58. (c3)
4. Build the mean formula term by term as a stacked bar: 200 base, +110·difficulty, +180·clutter segments grow. (c4)
5. Add the 80·motorContext segment and the 65·motorContext·difficulty segment; the latter swells when the context slider is high. (c5)
6. Noise: dots scatter ±35 ms around the line; a band shows ±35 and a bracket labels sd ≈ 20.21 ms. (c6)
7. Training grid dots (720) light up on the plot in one colour. (c7)
8. Held-out dots (192) appear in a second colour at interleaved, unseen x positions. (c8)
9. Camera pulls to the circuit strip: three features enter (`difficulty / 6`, `clutter`, `motorContext`); constants are shown greyed as "?" . (c9)
10. Circuit wires up: one multiply (`difficulty × motorContext`), five parameter chips p0..p4 feeding the sum; counters 8 sources, 6 operations, 3 layers. (c10)
11. Final: the circuit terms are overlaid one-to-one on the simulator formula terms with matching colours; stage quiets, a panel reads "fit to an authored law, not human behavior". (c11)

**Captions**
1. How long does it take to click a button? Close and wide is quick, far and small is slow. This lab asks whether a tiny circuit of weighted sums can learn that. [lab/user-effort/README.md:3]
2. First the lab writes the truth itself. A simulator takes the distance to a target, the target's width, a clutter number for the layout, and a motor-context number between zero and one. [lab/user-effort/simulator.ts:4-7; domain.ts:30-39]
3. Distance and width fold into one difficulty: the base-two logarithm of one plus distance over width. Far and narrow gives a big number. Near and wide gives a small one. [lab/user-effort/simulator.ts:5]
4. The mean duration starts at two hundred milliseconds, adds one hundred ten for each unit of difficulty, and adds one hundred eighty for each unit of clutter. [lab/user-effort/simulator.ts:6]
5. It adds eighty for motor context, plus sixty-five more for context times difficulty. So a hard target costs extra when the context number is high. [lab/user-effort/simulator.ts:6]
6. Then every observation gets random noise of up to thirty-five milliseconds either way. That noise alone has a standard deviation of about twenty point two one milliseconds. [lab/user-effort/simulator.ts:9,59; README.md:54]
7. The lab draws seven hundred twenty training observations from one grid of distances, widths, clutter levels and context levels. [lab/user-effort/README.md:37; simulator.ts:10-15]
8. It also draws a hundred ninety-two held-out observations at values training never used: other distances, other widths, other clutter, other contexts. [lab/user-effort/README.md:37; simulator.ts:16-21]
9. Now the learner. It sees three features: difficulty divided by six, clutter, and motor context. It is never handed the formula's constants. [lab/user-effort/predictor.ts:10]
10. Its circuit multiplies difficulty by motor context once, then sums five weighted terms. In all, six operations in three layers, with five coefficients to learn. [lab/user-effort/predictor.ts:15-29; report.ts output "circuit"]
11. Notice what that means. The circuit's terms are the simulator's own terms. This lab tests fitting an authored law, and the README says the setting is deliberately favorable. [lab/user-effort/predictor.ts:10,22-29; README.md:54; status.md:198]

**On-screen labels:** `meanDurationMs`, `log2(1 + distance / targetWidth)`, `200 + 110·difficulty + 180·clutter + 80·motorContext + 65·motorContext·difficulty`, `noiseHalfWidthMs = 35`, `720 training`, `192 held-out`, `Float32Array.of(log2(1+d/w)/6, clutter, motorContext)`, `circuit.multiply(difficulty, motorContext)`, `sources 8 · operations 6 · layers 3`, pointer `(64, 288)`.

---

## Chapter 2: Fitting It, Then Testing It
**Thesis:** Eight hundred Adam steps move five coefficients from zero to within about a hundredth of the authored ones; held-out error is 1.68 ms against the formula and sits on the noise floor against noisy data.

**Visual machine: "the curve that finds the cloud."** Left: the noisy dot cloud from ch1 with a prediction line starting flat on zero that tilts and rises into the cloud as steps tick (800-step counter). Right: loss curve on a log axis with a marker riding it. Then five paired bars (authored vs learned). Then an error ladder with a dashed noise-floor line.

**Beat sheet**
1. Prediction line lies flat at 0 ms; five coefficient dials all at 0; loss readout 0.593. (c1)
2. A forward pulse sweeps the 720 dots, residual ticks drawn as short vertical lines, then a backward pulse returns along the circuit strip. (c2)
3. Dials start turning; step counter runs 0→800; labelled `Adam · lr 0.04 · 800 steps`. (c3)
4. Camera pushes to the log loss plot: marker passes step 10 (0.0253), 100 (0.00105), 400 (0.000415); curve flattens; the prediction line has settled in the cloud. (c4)
5. Five bars rise, learned coefficients labelled: 0.1998, 0.6640, 0.1791, 0.0753, 0.3999. (c5)
6. Authored ghost bars slide in beside each: 0.2, 0.66, 0.18, 0.08, 0.39; small gap marks. (c6)
7. Cut to held-out dots (192) with the line through them; error ladder bar 1.68 ms vs constant baseline bar 133.94 ms. (c7)
8. Noisy-data bar 20.22 ms rises to meet a dashed noise-floor line at 20.21 ms; the 1.68 bar remains for contrast. (c8)
9. Three small bars for seeds 1731, 2731, 3731: 0.76, 0.67, 0.86 ms. (c9)
10. Stage quiets; panel: "one simulator · one authored formula · same-family held-out points". (c10)

**Captions**
1. Training starts with all five coefficients at zero, so the circuit predicts zero for everything. Its mean squared error begins at about point five nine, in seconds squared. [lab/user-effort/predictor.ts:13; report.ts "initialMseSecondsSquared" 0.5930691683488131]
2. Each step runs the circuit on all seven hundred twenty durations, then backpropagates exact gradients through the same six operations. [lab/user-effort/predictor.ts:55-60]
3. Adam nudges each coefficient, with a learning rate of point zero four, for eight hundred steps. The README says those settings were not tuned on the test cases. [lab/user-effort/predictor.ts:42,65-69; README.md:33,41]
4. The loss collapses: about point zero two five at step ten, point zero zero one at step one hundred, and flat near point zero zero zero four from step four hundred on. [lab/user-effort/predictor.ts:42-74 via trainPredictor; research probe values 0.02526, 0.001047, 0.000415, 0.000412]
5. Learned coefficients, in seconds, are point one nine nine eight for the base, point six six four for difficulty, point one seven nine for clutter, point zero seven five for context, point four for the interaction. [lab/user-effort/report.ts output "parametersSeconds"]
6. The authored values, converted the same way, are point two, point six six, point one eight, point zero eight and point three nine. Each is within about a hundredth. Close, and the README never claims exact recovery. [lab/user-effort/simulator.ts:6 (110·6/1000, 65·6/1000); report.ts output]
7. Now the held-out test. Against the noise-free formula, the error is one point six eight milliseconds. A constant guess at the training average misses by about one hundred thirty-four. [lab/user-effort/README.md:51; report.ts "heldOutSimulatorMean", "constantBaselineHeldOutMean"]
8. Against the noisy observations, the error is twenty point two two milliseconds. That matches the injected noise of twenty point two one. The circuit sits on the noise floor and can't go below it. [lab/user-effort/README.md:54; report.ts "heldOutNoisy"]
9. Three fresh training seeds give point seven six, point six seven and point eight six milliseconds against the noise-free formula, so one lucky run isn't the story. [lab/user-effort/report.ts output seeds 1731, 2731, 3731]
10. The scope is narrow: one simulator, one authored formula, held-out points from the same family. This shows fitting recovers a law we wrote. It says nothing about how people move. [lab/user-effort/README.md:70; status.md:198]

**On-screen labels:** `trainPredictor(observations, epochs = 800)`, `initialMseSecondsSquared 0.593`, `finalPreUpdateMseSecondsSquared 0.000412`, `Adam β1 0.9 · β2 0.999 · lr 0.04 · eps 1e-8`, `parametersSeconds`, authored vs learned table (0.2/0.1998, 0.66/0.6640, 0.18/0.1791, 0.08/0.0753, 0.39/0.3999), `heldOutSimulatorMean 1.68 ms`, `constantBaselineHeldOutMean 133.94 ms`, `heldOutNoisy 20.22 ms`, noise sd `35/√3 ≈ 20.21`, seeds 731 train / 947 held-out, retrain seeds 1731 / 2731 / 3731. Note on screen: loss values at steps 10/100/400 come from a probe run of `trainPredictor`, not from `report.ts`.

---

## Chapter 3: Choosing a Layout
**Thesis:** The fitted model scores four authored layouts for a stated task mix and picks the cheapest. It matches the formula's best in all 120 situations, but only 20 of them offered a real four-way choice.

**Visual machine: "the layout race."** Four 800×600 layout thumbnails in a row (control positions from `candidates`), the pointer at (96, 300). Under each, an expected-cost bar that fills from three ghost-pointer trips (one per task), each trip's length weighted by the task probability. A mix dial (confirm/details/cancel) at top. Later, a 120-cell grid coloured by valid-layout count.

**Beat sheet**
1. Four thumbnails drop in; a pointer sits at the left; a "choose" arrow hovers over them. (c1, c2)
2. Names and shapes highlighted in turn: near-small (three 32-px buttons, clutter 0.85), wide-confirm (104-px confirm), wide-details, balanced (three 72-px). (c2)
3. Mix dial appears; a bar per layout begins to fill from three weighted trips. (c3)
4. Dial at confirm 0.8: bars settle at 546.27 / 589.51 / 659.46 / 685.33 (wide-confirm, balanced, wide-details, near-small); wide-confirm glows. (c4)
5. Dial swings to details 0.8 with a "no retraining" tag: bars re-settle, wide-details 546.27 glows. (c5)
6. A second row labelled `shortest-distance` replaces cost with pixels; near-small glows there (120.49), then a pointer shows its predicted-duration rank is last in the confirm-heavy mix. (c6)
7. Constraint switches `minimumTargetWidth` and `maximumClutter` grey out layouts; a tie flag shows "earlier entry wins". (c7)
8. Camera pulls back: 120 cells fill a 5×24 grid; matched cells turn green for predicted-effort (120) and for shortest-distance (88 green, 32 grey). Means 606.37 vs 624.08 ms. (c8)
9. Cells recolour by number of valid layouts: 40 one-layout, 60 three-layout, 20 four-layout; the headline "120/120" is overlaid with the breakdown. (c9)
10. Isolate the 20 four-layout cells: learned 20/20, shortest-distance 0/20, regret bar 102.58 ms. (c10)
11. Caveat overlay: oracle = true formula = the learner's features; the cells get a thin "same formula" bracket. (c11)
12. Status board: tests 11/11, README reproduced, label HOLDS (synthetic), and a missing-items list: human data, error prediction, uncertainty, layout generation. (c12)
13. Stage quiets (≤0.15 opacity); the three-step recap strip (law → coefficients → chooser) lands on a clean panel. (c13)

**Captions**
1. Prediction alone picks nothing. The second job is to take four authored layouts and a stated mix of tasks, then choose the layout with the lowest expected duration. [lab/user-effort/README.md:3; selection.ts:7-27]
2. The four layouts are near-small, with three tiny buttons close to the pointer, wide-confirm, wide-details, and balanced, with three medium buttons in a column. [lab/user-effort/selection.ts:7-12]
3. A task mix gives a probability to confirm, details and cancel. A layout's expected cost is each task's probability times its predicted duration, summed. [lab/user-effort/selection.ts:22-27]
4. At motor context point three seven five, say eighty percent confirm. Wide-confirm wins at about five hundred forty-six milliseconds, balanced at five eighty-nine, wide-details next, near-small last at six eighty-five. [lab/user-effort/selection.ts:22-43; research "Examples" (context 0.375, min width 32, max clutter 1)]
5. Now make details the common task, with the same trained weights. Wide-details wins at the same five hundred forty-six. Only the probabilities changed. Nothing was retrained. [lab/user-effort/user-effort.test.ts:113-119; research "Examples"]
6. Compare a rule that just minimizes distance from the pointer. It loves near-small, whose buttons sit closest, though predicted duration puts that layout last in the confirm-heavy case. [lab/user-effort/selection.ts:66-70; research "Examples" (distance 120.49)]
7. Designers can also forbid layouts: a minimum target width, a maximum clutter. Invalid layouts are skipped. If two valid layouts tie exactly, the earlier one in the list wins. [lab/user-effort/domain.ts:45-65; selection.ts:33-41]
8. Across one hundred twenty situations, the learned model picks the simulator's best layout every time, averaging six hundred six milliseconds. Shortest distance matches eighty-eight, averaging six twenty-four. [lab/user-effort/README.md:58-64; selection.ts:45-64; report.ts "allSituations"]
9. But count the real choices. Forty situations allow only one valid layout, sixty allow three, and just twenty allow all four. So forty of the one hundred twenty are trivial wins. [lab/user-effort/README.md:64; research probe `{"1":40,"3":60,"4":20}`]
10. In those twenty open situations, learned effort matches the best layout twenty times out of twenty. Shortest distance matches zero, and costs one hundred two milliseconds extra on average. [lab/user-effort/README.md:64; user-effort.test.ts:134-138]
11. Even that is a soft win. The best layout is judged by the true formula, and the learner's features are that formula. Matching it here is close to what you'd expect. [lab/user-effort/selection.ts:66-107; predictor.ts:10; README.md:54]
12. The status is that it holds. At the pinned commit the eleven tests pass, and the report reproduces the README's numbers. There are no human results, no error prediction, and no uncertainty. [lab/status.md:198; README.md:70-74; bun test 11 pass]
13. So: a law we wrote, five coefficients that recover it, and a chooser that follows a stated task mix without retraining. It's a clean pipeline test, not evidence about real users. [lab/status.md:198; README.md:3,70]

**On-screen labels:** `candidates`: `near-small` (clutter 0.85, 32 px), `wide-confirm` (0.25, confirm 104 px), `wide-details` (0.25, details 104 px), `balanced` (0.1, 72 px); `expectedCost = Σ taskProbabilities[task] · cost(effortInput(...))`; `selectLayout` (strict `<`, first wins, `null` if none valid); pointer `(96, 300)`; `motorContext 0.375`; the example cost tables above (ms); `predicted-effort` / `shortest-distance` / `simulator-optimal`; `situations: 5 mixes × 4 contexts × 3 min widths × 2 max clutters = 120`; `meanDurationMs 606.37` vs `624.08`; `matchesOptimal 120` vs `88`; valid-count split `1:40 · 3:60 · 4:20`; `allCandidatesAllowed: 20/20 vs 0/20 · regret 102.58 ms`; `bun test: 11 pass`; label "HOLDS (synthetic)".

---

## Source list (for sources.json)
All code: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46, `lab/user-effort/{README.md, simulator.ts, domain.ts, predictor.ts, selection.ts, report.ts, user-effort.test.ts}` and `lab/status.md:198`. Numbers marked "report.ts output" were reproduced by running `bun lab/user-effort/report.ts`; the loss-by-epoch values and the 40/60/20 split come from a scratch probe that imports the lab's own functions (flagged on screen).
