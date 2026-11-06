# cascade-argmax

**Question:** Can argmax be made exact for every pair of distinct FP32 scores using only ReLU, power-of-two scaling and clamping, and can such a selector still be trained?

**Mechanism:** `lab/cascade-argmax/cascade-argmax.ts` `emitCascadeGreaterBit` computes `relu(right - left)` and then seven stages of "multiply by 2^23, then clamp to [0, 1]" (`emitClampZeroOne`, i.e. `v - relu(v - 1)`). The total gain 2^161 pushes even the smallest positive FP32 difference (2^-149) to exactly 1, while a tie stays exactly 0, so the bit is exact and left wins ties. Each stage goes through `circuit.roundAffine` (`frozenStep`) so the simplifier cannot merge the stages. `emitCascadeArgmax` arranges these bits in a pairwise tree, carries the winner's score up with a two-product select, and `routeCascade` turns the tree into a one-hot. For training, `softCascadeOptions` shrinks the gain so each clamp becomes a ramp centered on a tie; `lab/cascade-argmax/training.ts` `trainSelection` fits a 16-case x 8-candidate score table through the soft ramps, anneals the gain (2^3 up to 2^21), then checks the hard circuit's winners.

**Result:** From the README and `report.ts`: seven-stage soft cascade, seeds 1-10, 160/160 correct hard winners; single clipped ramp, seeds 101-110, 160/160, with "less than half as many operations" in the soft tree. Exact cascade cost vs production `emitArgmax`: 8 candidates is 196 vs 56 operations and 75 vs 15 layers; 64 candidates is 1,764 vs 504 operations and 150 vs 33 layers.

**Status:** Construction works, but the learning claim is narrow: "This is fitting a 128-cell table. There is no learned shared query/key function". The README says "The hard cascade does not provide useful score gradients", and status.md says "Hard score gradients still provide no useful learning signal." Superseded for cost: since September 14, 2026 core `emitCompare` builds an 8-candidate exact tree in 150 operations and 57 layers, or 52 in 18 on a 1/64 grid.

**Visual idea:** Two score bars almost the same height feed a tiny difference into a vertical pipe of seven magnifier stages. At each stage the sliver is doubled 23 times and hits a ceiling at 1. A difference of 2^-149 climbs to a full "1" by the top, while an exact tie stays a flat 0. Then shrink the magnifiers and the step softens into a ramp that gradients can slide along.

**Sources:**
- lab/cascade-argmax/README.md:1-37
- lab/cascade-argmax/cascade-argmax.ts:1-152, 186-245 (helpers outline)
- lab/cascade-argmax/training.ts:34-130
- lab/cascade-argmax/report.ts:23-71
- lab/status.md:202; lab/reassessment-2026-09-03.md:120,126
- commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
