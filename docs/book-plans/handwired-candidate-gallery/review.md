# Caption fact-check: Three Layouts (handwired-candidate-gallery)

Source: `.orly-work/hw-books/repo`, pinned at `4ea7fcb27ebe93acf49b9f29a93e162b975bad46` (read-only). Paths below are relative to that clone. Captions: `book.json`. Pointers: `plan.md`.

Method: each caption was checked against the cited source and the lab's README and status notes. Numbers were checked by hand against the formulas and by running a bun probe that imports the clone's `candidate-gallery.ts` from outside the clone (layers, layouts, thumbnail rectangles, click hits). `bun test ./lab/candidate-gallery` was run in the clone: 8 pass, and it prints `gatherReads=26`, `storedWeights=848 (dense ... 940)`.

Verdicts: **OK** = supported as worded. **FIX** = wrong scope or overclaim, corrected in `book.json` and `plan.md`.

Pointer notes: the plan's `README.md:1` and `README.md:5` point at the repo-root README, which does not say these things. The sources are `README.md:7` (root, "matrix multiplication + reglu") and `lab/candidate-gallery/README.md:5` (the move). Corrections are in the source column; the plan pointers were left unchanged.

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | OK | | README.md:7 (root; plan pointer README.md:1 is the title only) | "Handwired transforms them into matrix multiplication + reglu over floats" |
| 1 | 2 | OK | | lab/candidate-gallery/candidate-gallery.ts:324-332 | "const winner = emitArgmax(circuit, scores, unit)" |
| 1 | 3 | OK | | lab/candidate-gallery/candidate-gallery.ts:240, 644-657 | "const column = slot % 2" |
| 1 | 4 | OK | | lab/candidate-gallery/candidate-gallery.ts:177, 296 | "const column = item % 4" |
| 1 | 5 | FIX | "Every position is a weighted sum of the stage's width, its height and a 14 pixel gap. A Contact cell's width is the width minus five gaps, divided by four." → "Positions are sums of the stage's width, its height and a 14 pixel gap, with clamps along the way. A Contact cell's width is the width minus five gaps, divided by four." | lab/candidate-gallery/candidate-gallery.ts:208, 216, 268 (Story hero height is a min, Cinema rail and hero width are relus, so a position is not always a weighted sum) | "const storyHeroHeight = emitMinimum(" |
| 1 | 6 | OK | | lab/candidate-gallery/candidate-gallery.ts:165-174 (332.5 = (1400 - 5×14)/4; 208 = (680 - 4×14)/3) | "const contactCellWidth = circuit.affine([[contactInnerWidth, 1 / 4]])" |
| 1 | 7 | OK | | lab/candidate-gallery/candidate-gallery.ts:208, 226-229, 268-271 (probe: hero 1078×652; Story hero 439.2-tall at 610×830, 394.4 at 1400×680) | "const cinemaRailWidth = emitMinimum(" |
| 1 | 8 | OK | | lab/candidate-gallery/candidate-gallery.test.ts:100-122; numeric-ui-core.ts:1934-1936 (emitRelu) | "candidate geometry remains finite and bounded at tiny sizes" |
| 1 | 9 | OK | | lab/ui-exploration/guide/patterns/run-every-candidate.md:52 (compiled program: 60 layers; sum of layer outputSize = 417. The uncompiled circuit has 463 operations, so 417 is the compiled count) | "is 417 operations in 60 layers" |
| 1 | 10 | OK | | README.md:7 (root) | "Handwired transforms them into matrix multiplication + reglu over floats" |
| 2 | 1 | OK | | lab/candidate-gallery/candidate-gallery.ts:151-153, 402-414 | "return clampQuality(emitMultiply(circuit, size, scale))" |
| 2 | 2 | OK | | lab/candidate-gallery/candidate-gallery.ts:407 (probe: 208 / 240 = 0.8667, spoken 0.87) | "source[sourceField.contactCellScale] = 1 / 240" |
| 2 | 3 | OK | | lab/candidate-gallery/candidate-gallery.ts:413, 402-414 (Cinema gauges all 1 at 1400×680; Story thumbnails 50.4 / 60 = 0.84) | "source[sourceField.storyThumbnailScale] = 1 / 60" |
| 2 | 4 | OK | | lab/candidate-gallery/candidate-gallery.ts:155-163; src/runtime/numeric-ui-core.ts:1955-1963 | "const result = circuit.roundAffine([[a, 1], [emitRelu(circuit, difference), -1]])" |
| 2 | 5 | OK | | src/runtime/numeric-ui-core.ts:2710-2762 (pairwise tournament: 3 scores → comparison of Cinema vs Contact, then survivor vs Story); lab/status.md:170 | "const comparisonBias = 0.5000000596046448" |
| 2 | 6 | OK | | src/runtime/numeric-ui-core.ts:2757-2762 (assumeOneHot on exit); probe at 1400×680: selectedLayout [1,0,0], winningScore 1 | "circuit.assumeOneHot(selected)" |
| 2 | 7 | OK | | lab/candidate-gallery/candidate-gallery.test.ts:31-43 (984×730 → Contact); candidate-gallery.ts:211-239 (hero width 666.48 ÷ 900 = 0.7405); probe scores 0.7405, 0.9361, 0.9275 | "[984, 730, layout.contact]," |
| 2 | 8 | OK | | lab/candidate-gallery/candidate-gallery.ts:166-185, 198-206 (135 = (610 - 70)/4; 135/240 = 0.5625; height 258/240 clamps to 1) | "scaledQuality(contactCellWidth, sourceField.contactCellScale)," |
| 2 | 9 | OK | | lab/candidate-gallery/candidate-gallery.ts:268-322 (hero height min(439.2, 481.4) = 439.2; 439.2/440 = 0.9982; probe 0.9981818) | "scaledQuality(storyHero.height, sourceField.storyHeroHeightScale)," |
| 2 | 10 | OK | | lab/candidate-gallery/candidate-gallery.test.ts:45-52 (760×517 Contact, 600×517 Story); probe 0.5548 vs 0.5521 (0.555 vs 0.552) and 1280×800 scores [1,1,1] → Cinema; lab/status.md:170 | "test('Story takes over before the frame becomes extremely narrow'" |
| 3 | 1 | OK | | lab/candidate-gallery/candidate-gallery.ts:334-365 | "function selectValue(values: readonly Wire[]) {" |
| 3 | 2 | OK | | lab/candidate-gallery/candidate-gallery.ts:334-347 | "winner.selected[candidateIndex]!," |
| 3 | 3 | OK | | lab/candidate-gallery/candidate-gallery.ts:234-238 (cinemaRailLeft = 14 + 1078 + 14 = 1106); probe thumbnail 0 at 1400×680 = [1106, 14, 133, 97] | "const cinemaRailLeft = circuit.affine([" |
| 3 | 4 | OK | | lab/candidate-gallery/candidate-gallery.ts:205, 349-365 | "heroPresent: zero," |
| 3 | 5 | OK | | lab/candidate-gallery/candidate-gallery.ts:181, 282-285 (probe: 984×730 thumbnail 0 = [14, 14, 228.5, 224.667]; 610×830 = [14, 467.2, 184.667, 76.7]) | "const storyThumbnailRegionTop = circuit.affine([" |
| 3 | 6 | OK | | lab/candidate-gallery/gather-lowering.test.ts:54-67; lab/status.md:228 (test run: gatherReads=26, storedWeights 848 vs dense 940) | "expect(lowered.readCount).toBe(26)" |
| 3 | 7 | OK | | lab/candidate-gallery/candidate-gallery.ts:369-373, 487 | "const clicked = emitFirstActive(" |
| 3 | 8 | OK | | lab/candidate-gallery/candidate-gallery.ts:466-488 (distance = min of four edge distances, :482); probe at 1400×680 on thumbnail 7 (left 1253, top 347): left+1 → 1, left+0.25 → 0 with focus at 0. No repo test covers this; the check was run, not read from a test | "const distance = emitMinimum(circuit, horizontal, vertical)" |
| 3 | 9 | OK | | lab/candidate-gallery/comparison.test.ts:12; src/runtime/numeric-ui-core.ts:385-392 (12 thumbnail hits at :487 plus 2 argmax comparisons) | "expect(booleanWires.length).toBe(14)" |
| 3 | 10 | OK | | lab/candidate-gallery/README.md:5 (plan pointer README.md:5 is the root README, which does not say this); lab/status.md:289; README.md:3 for "no training" | "It moved here from the repo root on September 17, 2026" |
| 3 | 11 | FIX | "So the program never decides. It builds every layout, scores each by its worst gauge, and multiplies the losers by zero, every frame." → "So the program never branches. It builds every layout, scores each by its worst gauge, and multiplies the losers by zero, every frame." | lab/candidate-gallery/candidate-gallery.ts:326; lab/candidate-gallery/README.md:3. The program does decide, in its argmax (ch2 captions 5-6), so "never decides" contradicts the chapter | "`emitArgmax` picks the highest score" |

## Visuals in plan.md

No visual shows a wrong number. Checked against the probe and the formulas:
- Chapter 1 visual: Contact cell 332.5 × 208; Cinema rail 280, hero 1078 × 652, thumbnail 133 × 97; Story hero 394.4, hero width 1372, thumbnail 448 × 50.4; counter 417 operations · 60 layers (compiled).
- Chapter 2 visual: targets 900, 560, 90, 240, 560, 440, 60 match the scale constants (`candidate-gallery.ts:407-413`); gauges 0.87, 0.84, 0.90 (0.896), 0.74, 0.94, 0.93, 0.56, 0.998; hero 666.5 at 984 × 730; Contact cell 135 at 610 × 830.
- Chapter 3 visual: thumbnail 0 at 1400 × 680 = left 1106, top 14, 133 × 97; at 984 × 730 = left 14, top 14, 228.5 × 224.67; at 610 × 830 = top 467.2, width 184.67; thumbnail 7 at 1400 × 680 = left 1253, top 347, 133 × 97; counter 26 reads, stored weights 940 → 848; boolean atoms 14.
- Top "Verified numbers" table in plan.md: all six rows match the probe (scores to 4 digits; 1280 × 800 tie → Cinema).

## Other notes

- `inputs/caption-review.md` in the work folder covers the handwired-labs book, not this one. It was not used as evidence.
- "Nothing is learned" (ch3 #10) is OK because the root README says "no training" (README.md:3) and the scales are constants (candidate-gallery.ts:403-414). The plan's "claims no learning" wording is not a repo statement, so the narration only uses the code-level version.
