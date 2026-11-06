# candidate-gallery

**Question:** Can one numeric program build three complete photo layouts at once, score each against the current viewport, and show only the winner, with clicks and focus handled inside the same circuit?

**Mechanism:** `lab/candidate-gallery/candidate-gallery.ts` `createCandidateGalleryCircuit` builds all three layouts for 12 photos every evaluation: Cinema (hero plus a 2-column thumbnail rail), Contact (4x3 contact sheet, no hero) and Story (hero above 3-column thumbnails). Each size is multiplied by a "quality scale" (the reciprocal of a target size, e.g. `1 / 240` for a contact cell, set in `createCandidateGalleryMachine`) and clamped to 1 by `clampQuality`; a layout's score is the `bottleneck`, i.e. the minimum of its clamped qualities, built with `emitMinimum`. `emitArgmax(circuit, scores, unit)` returns a one-hot `winner.selected`; `selectValue` multiplies each candidate's geometry by its bit and sums, so every thumbnail and hero rectangle reads the winning layout. A click goes through `emitRectangleHit` per thumbnail and `emitFirstActive`, and the focused photo is 12 one-hot source cells (`focusField`) that are written back as `nextSource`.

**Result:** Tests pin the choices: a 1400x680 stage picks Cinema, 984x730 picks Contact, 610x830 picks Story (`candidate-gallery.test.ts:31-41`). The circuit has exactly 14 boolean atoms as its rounding points (`comparison.test.ts:12`), and 26 layout selection reads lower to gather reads in one one-hot group (`gather-lowering.test.ts:54-69`). lab/status.md adds that sparse weights drop "from 940 to 848" with gather lowering.

**Status:** Working demo, moved off the main line: it "moved here from the repo root on September 17, 2026 ... since the repo centers on HandwiredOS." The page is titled "Dynamic UI". runtime-cost uses it as a benchmark subject. No open/abandoned verdict beyond that.

**Visual idea:** A browser frame being dragged narrower; beside it three miniature layouts (Cinema, Contact, Story) always drawn, each with a bar made of its quality gauges where the shortest gauge sets the score. As width shrinks, the bars cross, the argmax's one-hot bit jumps from Cinema to Contact to Story, and the 12 thumbnails fly from their slots in the old layout to the new one.

**Sources:**
- lab/candidate-gallery/README.md:1-9
- lab/candidate-gallery/candidate-gallery.ts:1-160, 300-452
- lab/candidate-gallery/candidate-gallery.test.ts:31-100 (test names and expectations)
- lab/candidate-gallery/comparison.test.ts:1-15
- lab/candidate-gallery/gather-lowering.test.ts:54-69
- lab/status.md:228
- commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
