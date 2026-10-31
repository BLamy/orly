# Reusable Layout: caption fact-check

Source: `.orly-work/hw-books/repo`, HEAD `4ea7fcb27ebe93acf49b9f29a93e162b975bad46` (confirmed). Captions: `book.json`, 36 total. Paths below are relative to `lab/reusable-layout/` unless shown otherwise.

Checks run: every cited file read; `bun test lab/reusable-layout` (6 pass); `measureWidthSweep` and the six-card scene re-run with the saved parameters via a probe outside the clone (widths, 121 parameters, 133 operations and depths `{1:96, 2:12, 3:12, 4:12, 5:1}`, sweep counts 6/35/53, movements 939.38/369.55/359.26); `results.json` read for seeds 17, 41 and 73 (all invariants zero across both sets, 96 scenes each).

Verdicts: **OK** = supported as worded. **FIX** = corrected caption (≤220 characters) is in `book.json` and `plan.md`.

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | --- | --- | --- | --- | --- |
| 1 One Rule for Every Photo | 1 | OK | | README.md:3 | "A gallery has to decide" is narration; source: "This experiment learns one small function that proposes a photo's width from changing content and viewport features." |
| 1 One Rule for Every Photo | 2 | OK | | README.md:3 | "The same parameters are reused for every item and every collection" |
| 1 One Rule for Every Photo | 3 | OK | | model.ts:12-30 | "item.text.totalWidth / 1000" (eight features listed in `itemFeatures`) |
| 1 One Rule for Every Photo | 4 | FIX | "Notice what's missing. No photo identifier enters the function, so it can't memorize which picture is which. It only sees numbers that describe the situation." → "Notice what's missing. No photo identifier enters the function, so it has no ID to key on. It only sees numbers that describe the situation." | README.md:11; model.ts:12-30 | "Stable IDs do not enter the learned function." (Reason: "can't memorize" is an inference the source does not make; caption width and aspect ratio are per-photo values, so the function can still tell photos apart. Pointer `README.md:13` in the plan is wrong; the sentence is at `README.md:11`.) |
| 1 One Rule for Every Photo | 5 | OK | | model.ts:36-41 | "circuit.multiply(neuron * featureCount + feature, parameterCount + feature)" (12 × 8 = 96 products, 12 sums) |
| 1 One Rule for Every Photo | 6 | OK | | model.ts:42-47, 58; numeric-ui-core.ts:1683-1690 | "hidden.push(circuit.reglu([], 1, [[sum, 1]], 0))"; "return evaluate(source)[0]! * 400" |
| 1 One Rule for Every Photo | 7 | OK | | README.md:13; model.ts:5-10 | "133 operations and five dependency layers per item in this checkout" (probe: 121 parameters, 133 operations, depths 1–5) |
| 1 One Rule for Every Photo | 8 | OK | | .orly-work/hw-books/inputs/reusable-layout.md:213-215 (probe) | "Shared-rule widths (`model.ts:58`): 161.3, 275.7, 232.7, 254.8, 274.9, 272.4 px." (probe reproduced 161.3, 275.7, 232.7; card 1 aspect 0.7, card 2 aspect 2.6 importance 0.496, card 3 aspect 2.2 importance 0.270) |
| 1 One Rule for Every Photo | 9 | OK | | layout.ts:32-61; text.ts:14-35 | "export function wrapLayout(scene: PreparedScene, preferences: readonly number[]): Layout {" |
| 1 One Rule for Every Photo | 10 | OK | | model.ts:53-63; layout.test.ts:41 | "storage permutation and arbitrary IDs do not change the learned layout" (test passes) |
| 1 One Rule for Every Photo | 11 | OK | | README.md:21-23 | "Per-layout search starts from ordinary wrapping" (question; no factual claim) |
| 2 A Teacher That Searches | 1 | OK | | README.md:23; layout.ts:80 | "export function optimizeInstance(scene: PreparedScene) {" |
| 2 A Teacher That Searches | 2 | OK | | layout.ts:63-64; README.md:21 | "This is an authored preference, not a model of human taste." / "not human examples or click logs" |
| 2 A Teacher That Searches | 3 | OK | | layout.ts:68 | "const targetArea = 22000 * (0.7 + 1.5 * placed.item.importance)" |
| 2 A Teacher That Searches | 4 | FIX | "Second, a caption longer than three lines is penalized, squared. Third, a small charge for unused row width. Add these per layout and average over the photos." → "Second, a caption longer than three lines is penalized, squared. Third, a small charge for unused row width. Photo terms are averaged; the row charge is added once per layout." | layout.ts:70-73 | "return total / layout.items.length + 0.08 * layout.unusedRowFraction" (The row charge is added once per layout, not averaged over photos.) |
| 2 A Teacher That Searches | 5 | OK | | layout.ts:68-69; probe | "const targetArea = 22000 * (0.7 + 1.5 * placed.item.importance)" (importance 0.496 gives target 31,753, about 31,800; area-only width sqrt(31,753 × 2.6) = 287.3 px) |
| 2 A Teacher That Searches | 6 | OK | | layout.ts:85, 88 | "for (let pass = 0; pass < 2; pass++) {" / "for (const width of widthChoices) {" (widthChoices 128…416 step 32; keeps the best width per pass) |
| 2 A Teacher That Searches | 7 | OK | | layout.ts:102-107; probe | "for (const step of [16, 8, 4, 2, 1]) {" (probe: search width 290 px for the 2.6 card) |
| 2 A Teacher That Searches | 8 | OK | | layout.ts:84, 121; probe | "let evaluations = 1" (probe: 1 + 30n = 181, 361, 481 for 6, 12, 16 items) |
| 2 A Teacher That Searches | 9 | OK | | study.ts:15-17 | "for (let seed = 1; seed <= 16; seed++) {" (16 × 2 counts × 3 widths = 96 layouts; 576 examples, test passes) |
| 2 A Teacher That Searches | 10 | OK | | model.ts:71-111 | "export function trainRule(examples: readonly TrainingExample[], seed: number, epochs = 160) {" (Adam, 160 epochs) |
| 2 A Teacher That Searches | 11 | FIX | "For the first seed, the normalized loss falls from about 0.0091 to 0.00008 in under a second. Training is seeded, so the saved model reproduces exactly." → "For seed 17, the normalized loss falls from about 0.0091 to 0.00008 in under a second of training. Training is seeded, so the saved model reproduces exactly." | results.json (seed 17); README.md:29; layout.test.ts:74 | "training is reproducible and the saved model is the first declared seed, not a held-out selection" (Reason: "first seed" collides with collection seeds 1–16; the saved model is seed 17. "Under a second" excludes target generation, per README.md:29. Values: initialLoss 0.0090918, finalLoss 0.0000800, trainingMilliseconds 799.4.) |
| 2 A Teacher That Searches | 12 | OK | | study.ts:27-35 | "export function heldOutScenes(content: ContentKind): PreparedScene[] {" |
| 3 Close, and Where It Slips | 1 | OK | | study.ts:27-31; README.md:31 | "for (let seed = 101; seed <= 112; seed++) {" (12 seeds × 2 counts × 4 widths = 96 layouts per set) |
| 3 Close, and Where It Slips | 2 | OK | | README.md:41-43; results.json (seeds 17/41/73) | "\| Ordinary 224-pixel wrapping \| 0.3727 \| 1.0530 \|" (shared short: 0.026555 / 0.025906 / 0.026123, i.e. 0.0259–0.0266) |
| 3 Close, and Where It Slips | 3 | OK | | README.md:45; data.ts (photoCaptions, 12 entries) | "The shared rule transferred substantially better than ordinary wrapping, stayed close to the search objective on the easier set" |
| 3 Close, and Where It Slips | 4 | OK | | README.md:51-53; results.json (seeds 17/41/73) | "\| Shared rule \| 18.3 / 14.0 microseconds \|" (seed 17 medians: search short 317.4, seed 41 350.4, seed 73 421.0; scope "one saved run" is in the caption) |
| 3 Close, and Where It Slips | 5 | OK | | data.ts:39; study.ts:18 | "const ratios = content === 'short' ? [0.8, 1, 1.4, 1.8] : [0.55, 0.7, 1.15, 1.6, 2.2, 2.6]" (training uses 'short' captions and the 0.8–1.8 crops; 0.55–2.6 appear only in the long set) |
| 3 Close, and Where It Slips | 6 | OK | | README.md:43; results.json (seeds 17/41/73, long) | "\| Shared learned rule \| 0.0259-0.0266 \| 0.2854-0.3079 \|" (long shared: 0.285358 / 0.307921 / 0.296864) |
| 3 Close, and Where It Slips | 7 | OK | | README.md:71 | "the current model receives total caption width but not the widths of individual words, so it cannot exactly predict line breaks" |
| 3 Close, and Where It Slips | 8 | OK | | README.md:35; layout.test.ts:20 | "Every method retained every required item and reading order" (192 = 96 short + 96 long scenes; results.json shows zero missing, text overflow, horizontal overflow and overlap in all seeds) |
| 3 Close, and Where It Slips | 9 | OK | | study.ts:96; README.md:59 | "for (let width = 361; width <= 1180; width++) {" / "using both caption families: 1,640 transitions per method" (820 steps × 2 families) |
| 3 Close, and Where It Slips | 10 | FIX | "Wrapping has 6 such jumps, the shared rule 35, search 53. But one wrapping step moves photos 939 pixels on average. The README says it plainly: all three methods reflow abruptly." → "In the saved model, wrapping has 6 such jumps, the shared rule 35, search 53. The worst wrapping step moves photos 939 pixels on average. The README says it plainly: all three methods reflow abruptly." | README.md:63-67; results.json widthSweep (seed 17); probe | "\| Wrapping \| 2.01 px \| 939.38 px \| 6 / 1640 \|" (939.38 is the largest mean item movement in one transition, not a typical step. The 35 shared count is seed 17; seed 41 gives 33. Probe reproduced 6 / 35 / 53 and 939.376.) |
| 3 Close, and Where It Slips | 11 | OK | | README.md:47; lab/status.md:212 | "They do not establish that a neural network is necessary or better than a hand-written sizing rule." (no human ratings: README.md:21) |
| 3 Close, and Where It Slips | 12 | OK | | lab/status.md:212; README.md:71 | "Resize sweeps still find abrupt reflow." (Note: "narrowed" is the book's classification from the research note; it is not status.md vocabulary, and nothing in status.md contradicts it.) |
| 3 Close, and Where It Slips | 13 | OK | | lab/status.md:212; README.md:45, 67 | "the shared rule transfers well to new counts and widths and leaves a visible gap with longer captions and unfamiliar crops" |

## Visuals in plan.md with a wrong or unscoped number

No wrong number found. The scene numbers (161.3 / 275.7 / 232.7 / 254.8 / 274.9 / 272.4; search 171 / 290 / 233 / 258 / 287 / 286; losses 0.13668 / 0.09806 / 0.45070), the sweep values (6 / 35 / 53; 939.376 / 369.553 / 359.261), the timing values, the seed ranges and the evaluation counts all match the probe or `results.json`.

Scope item for the scene author: **Chapter 3, beat 10** shows the counts 6 / 35 / 53. These are the seed-17 saved model; the seed-41 shared count is 33. Tag this beat "one saved run, seed 17", as the timing bars already are.
