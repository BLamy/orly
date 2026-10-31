# Caption review: Learned Gallery (`handwired-learned-gallery`)

Reviewer: Claude Haiku 5.5, fact-check pass. Source clone: `.orly-work/hw-books/repo`, pinned at 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, read-only. Every `path:line` below is relative to that clone's root. `lab/…` and `src/…` are the research record and the code; `TG` is `src/learned-gallery/trainable-geometry.ts`, `LG` is `src/learned-gallery/learned-gallery.ts`.

Verdicts: OK = the caption matches the cited source in number, scope and claim. FIX = edited in place in `book.json` and `plan.md`. Verdicts are per caption; 48 captions in 4 chapters, 1 FIX.

## Captions

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | --- | --- | --- | --- | --- |
| 1 Photos from a sketch | 1 | OK | | lab/learned-gallery/README.md:9 | "The sketch starts from one of three presets, Story (10 rectangles), Cinema (9) and Contact sheet (11)" |
| 1 Photos from a sketch | 2 | OK | | lab/learned-gallery/README.md:13 | "the spirit of the gallery is to learn something" (Cheng) |
| 1 Photos from a sketch | 3 | OK | | src/learned-gallery/learned-gallery.ts:15, :17 | "export const learnedSlotCount = 20" (page uses up to 12: "learnedPhotoCount = 12") |
| 1 Photos from a sketch | 4 | OK | | src/learned-gallery/trainable-geometry.ts:218-223 | "const position = slotCount === 1 ? 0 : item / (slotCount - 1) * 2 - 1" (features 1, position, sin/cos for k = 1..4, computed in the build) |
| 1 Photos from a sketch | 5 | OK | | src/learned-gallery/trainable-geometry.ts:251; src/learned-gallery/README.md:3 | "A ReGLU unit is one weighted sum times the ReLU of another" |
| 1 Photos from a sketch | 6 | OK | | lab/learned-gallery/README.md:5 | "go through two ReGLU layers of 6 units to the slot's left, top, width and height" |
| 1 Photos from a sketch | 7 | OK | | src/learned-gallery/trainable-geometry.ts:158-181; src/learned-gallery/README.md:3 | "Its 244 source cells are the trained coefficients" (layout: 2 × (6×10+6) + 2 × (6×6+6) + 4 × (6+1) = 132 + 84 + 28; `bun` run: parameterCount 244 for all three presets) |
| 1 Photos from a sketch | 8 | OK | | lab/learned-gallery/README.md:9 | "the program is 6,320 operations in 8 layers with 244 weights" (`bun` run: 6,320 operations, max depth 8, 4,080 reglu and 2,240 affine. The multipliers and Adam state are training state outside the program, so "only those 244 numbers" holds for the program) |
| 1 Photos from a sketch | 9 | OK | | src/learned-gallery/trainable-geometry.ts:471, :761-766; lab/learned-gallery/README.md:20 | "const seed = options.seed ?? 0x51_7a_9e"; "The seeded weights put the photos in a pile" |
| 1 Photos from a sketch | 10 | OK | | src/learned-gallery/trainable-geometry.ts:455, :586 | "geometryLossThreshold * (magnitude - 0.5 * geometryLossThreshold)"; "return minimumCostAssignment(costs).map(index => outputItems[index]!)" |
| 1 Photos from a sketch | 11 | OK | | lab/learned-gallery/README.md:39 | "679, 1,389 and 879, i.e. 1.1, 2.3 and 1.5 s" (one run, as the caption says. Reviewer rerun with fixed 10-step frames: Story stopped at 660 steps, inside the lab's 630 to 750 range) |
| 1 Photos from a sketch | 12 | OK | | lab/learned-gallery/README.md:9 | "An edit continues training from the current weights"; "A preset and the Retrain button start over from the seeded weights" |
| 2 Lining up without snapping | 1 | OK | | lab/learned-gallery/README.md:13 | "a bigger penalty or adjustable one for learned gallery for grid being unaligned" (Cheng's request) |
| 2 Lining up without snapping | 2 | OK | | lab/learned-gallery/README.md:13, :60 | "Snapping to some alignemtn is just a simple thought."; "ordinary code decided where every line is" |
| 2 Lining up without snapping | 3 | OK | | lab/learned-gallery/README.md:13 | "Since October 14 nothing straightens the sketch" |
| 2 Lining up without snapping | 4 | OK | | lab/learned-gallery/README.md:15; src/learned-gallery/trainable-geometry.ts:148-156 | "reads only the photos and never the sketch: every two photo edges of one kind, e.g. two tops, are charged for the gap between them" |
| 2 Lining up without snapping | 5 | OK | | src/learned-gallery/trainable-geometry.ts:90, :138-141 | "const penaltyStiffness = 5"; "return Math.max(-limit, Math.min(limit, multiplier + penaltyStiffness * gap))" (`bun` run: pairPull at reach 0.02 = 0.015 at gap 0.005, 0.01 at 0.01, 0 at 0.02) |
| 2 Lining up without snapping | 6 | OK | | assets/learned-gallery.html:68; src/learned-gallery/learned-gallery.ts:243, :436 | `min="0" max="8" step="0.5" value="4"`; "export const defaultHoldDistance = 0.04" (reach = slider / 2 = 2% × 538 px = 10.8 px) |
| 2 Lining up without snapping | 7 | OK | | src/learned-gallery/trainable-geometry.ts:603-607, :613; lab/learned-gallery/README.md:15 | "Ordinary code counts the lines from the photos' edges at the start of each frame." |
| 2 Lining up without snapping | 8 | OK | | src/learned-gallery/trainable-geometry.ts:132, :646 | "const multiplierGrowth = 0.02"; "multipliers[pair] + multiplierGrowth * steps * penaltyStiffness * gap" (0.02 × 5 = 0.1 of the gap per step) |
| 2 Lining up without snapping | 9 | OK | | lab/learned-gallery/README.md:16, :20; src/learned-gallery/trainable-geometry.ts:114-116 | "The multipliers aren't part of the loss: the loss that the page shows is the cost without them."; "const penaltyRiseSteps = 200" |
| 2 Lining up without snapping | 10 | OK | | lab/learned-gallery/README.md:30 | "372 single edits of 5 and 11 px, i.e. every rectangle of the 3 presets dragged four ways and resized two ways" (row values: penalty 0.01 median and 0.16 largest; straightening 0.04 and 0.52 px) |
| 2 Lining up without snapping | 11 | OK | | lab/learned-gallery/README.md:19 | "when one rectangle of a row of 4 is dragged 12 px down, its photo stays in the row, 9 px above its rectangle, and the row's other photos move 3 px down" |
| 2 Lining up without snapping | 12 | OK | | lab/learned-gallery/README.md:18 | "a rectangle dragged 14 px out of its row keeps its photo in the row, and after the slider went to off and back to 4%, the photo is on its rectangle" |
| 3 Taking steps back | 1 | OK | | lab/learned-gallery/README.md:22 | "Adam at a fixed learning rate doesn't come to rest once the loss is low"; "six small drags in a row made the photos jump by up to 14 px" (page before October 13) |
| 3 Taking steps back | 2 | OK | | src/learned-gallery/learned-gallery.ts:271, :280, :282 | "export const msPerTrainingStep = 1000 / 600"; "export const maximumTrainingStepsPerFrame = 20"; "export const trainingMsPerFrame = 6" |
| 3 Taking steps back | 3 | OK | | src/learned-gallery/trainable-geometry.ts:864-868; lab/learned-gallery/README.md:22 | "const before = measure(valuesBefore)" (the frame's multipliers, line counts and penalty weight are fixed by startFrame) |
| 3 Taking steps back | 4 | OK | | src/learned-gallery/trainable-geometry.ts:878-883 | "source.set(savedSource)" with "firstMoment.set(savedFirstMoment)" and "secondMoment.set(savedSecondMoment)"; "learningRateScale = Math.max(framesTakenBackAtLowRate >= 5 ? 1 / 4096 : 1 / 64, learningRateScale * 0.5)" |
| 3 Taking steps back | 5 | FIX | "the rate grows by fifteen percent." → "the rate grows by fifteen percent, or doubles below a sixty-fourth." | src/learned-gallery/trainable-geometry.ts:887; lab/learned-gallery/README.md:22 | "learningRateScale = Math.min(1, learningRateScale * (learningRateScale < 1 / 64 ? 2 : 1.15))". The caption gave the 15% rate without its exception. Below 1/64 a kept frame doubles the rate (the code's `< 1 / 64` branch, lab:22 "a kept frame doubles it until it is at 1/64 again"). The "about thirty kept frames" climb from 1/64 is correct (ln 64 / ln 1.15 = 29.75) and is unchanged |
| 3 Taking steps back | 6 | OK | | src/learned-gallery/trainable-geometry.ts:882-888; lab/learned-gallery/README.md:22 | "When 5 frames in a row at 1/64 were taken back, the rate goes on halving, down to 1/4096"; "a photo whose rectangle was just added far from it could stand still 30 px away, with every frame taken back" |
| 3 Taking steps back | 7 | OK | | lab/learned-gallery/README.md:23; src/learned-gallery/learned-gallery.ts:704 | "A frame trains 2 steps or more, or none." |
| 3 Taking steps back | 8 | OK | | lab/learned-gallery/README.md:23; src/learned-gallery/learned-gallery.ts:291-292 | "stopped after 529 steps with a line of photos 0.47 px apart on a stage of 500 px ... With frames of two steps it is 874 steps and 0.03 px" (the 500 px stage is not in the caption; "nearly half a pixel" is correct for 0.47) |
| 3 Taking steps back | 9 | OK | | lab/learned-gallery/README.md:23 | "The price: where a step takes over 3 ms, a frame's training takes up to twice the 6 ms" |
| 3 Taking steps back | 10 | OK | | lab/learned-gallery/README.md:24 | "it rests where its two parts balance, e.g. at 1e-5 with a photo held 9 px from its rectangle" |
| 3 Taking steps back | 11 | OK | | src/learned-gallery/learned-gallery.ts:247, :255, :257, :259; lab/learned-gallery/README.md:24 | "export const restDistance = 0.0001"; "training stops once no photo edge has moved more than 0.01% of the stage from where it was 100 or more steps before, and after 2,000 steps at the latest" |
| 3 Taking steps back | 12 | OK | | lab/learned-gallery/README.md:56 | "most frames are taken back: 238 of the 300 frames after Story's first fit" (one run's count. Reviewer rerun with a fixed 10-step schedule: 221 of 300 undone; the caption's "most" holds, and the 238 is the lab's recorded run) |
| 4 What held, what didn't | 1 | OK | | lab/learned-gallery/README.md:61 | "Plain forms of the penalty" (probe of October 14, 24 sessions of 40 small edits, stuck = 0.5 to 8 px apart) |
| 4 What held, what didn't | 2 | OK | | lab/learned-gallery/README.md:61 | "a fixed pull that is rounded near a gap of 0, without multipliers, 78%"; "The same rounded less, 47%"; "limit that stays full for the first 2 px of a gap, 21%" |
| 4 What held, what didn't | 3 | OK | | lab/learned-gallery/README.md:61; src/learned-gallery/trainable-geometry.ts:88-89 | "Multipliers with a limit that falls from a gap of 0, the form that is kept, 1.8%"; "with a reach of 8 px on a stage of 538 by 430 px" (8 / 538 = 1.5%; shipped reach 2%) |
| 4 What held, what didn't | 4 | OK | | lab/learned-gallery/README.md:35 | "1.1%, and 0.7% to 1.4% by batch of 24" (96 sessions; straightening 2.5% and 2.7%) |
| 4 What held, what didn't | 5 | OK | | lab/learned-gallery/README.md:37, :45 | "none of 1,600 edits"; "after 5 of 1,600 edits"; "0.5% of 1,920 mixed edits in 48 sessions" |
| 4 What held, what didn't | 6 | OK | | lab/learned-gallery/README.md:42 | "200 when training stops, the widest line at 0.15 px. 26 train all 2,000 steps" |
| 4 What held, what didn't | 7 | OK | | lab/learned-gallery/README.md:32-33 | "151." (of 180 edits of 22 px) and "0.12, 2.3 px, with 11 of the 151 over 1 px" |
| 4 What held, what didn't | 8 | OK | | lab/learned-gallery/README.md:49; src/learned-gallery/README.md:34 | "Among the 200 variants of Story's proportions, 12 end with such an edge 2 to 4 px off, 5 of them after all 2,000 steps"; "since the edges share the 244 weights, which rest where the slopes of all edges balance" |
| 4 What held, what didn't | 9 | OK | | lab/learned-gallery/README.md:47, :53 | "rests 0.15% of the stage from where it is drawn, 0.6 px"; "29 times as much" (6.7e-5 against 2.3e-6). Line 53 gives 0.72 px on the 620 × 496 stage; 0.6 px is the 538 px basis the caption uses. Reviewer rerun of Story's first fit: largest edge error 0.64 px on 538 × 430 |
| 4 What held, what didn't | 10 | OK | | lab/learned-gallery/README.md:3; lab/status.md:3 | "The measurements were made with scratch scripts that aren't in the repo" and "it describes the page as it was on October 14, 2026"; `bun test ./tests/learned-gallery`: 41 pass, 0 fail |
| 4 What held, what didn't | 11 | OK | | lab/status.md:203 | "No held-out test: the network is fitted to one sketch at a time." |
| 4 What held, what didn't | 12 | OK | | src/learned-gallery/README.md:3; lab/learned-gallery/README.md:49 | "Its 244 source cells are the trained coefficients"; "An edge that is on no line can rest farther from where it is drawn than that." |

## Visuals in plan.md

Checked every number in the visual machine, beat sheet and on-screen labels of all four chapters against the same sources. No visual shows a wrong number. Two notes for the scene authors:

- Chapter 3, beat 11 shows "238 red" frames. That is the lab's recorded count. A fixed 10-step reviewer rerun gave 221 of 300. Either number is a run's count, so label it as "one run" or keep it with the Story first fit caption.
- Chapter 4, the 0.6 px Story edge is on the 538 × 430 basis. The 620 × 496 stage gives 0.72 px (lab/learned-gallery/README.md:53). Keep the stage label next to the number on screen.
