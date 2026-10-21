# Plan: Picking Exactly (handwired-cascade-argmax)

- Title: **Picking Exactly**. Subtitle: An exact sign cascade for argmax on 32-bit floats, its cost, and what training it really shows.
- Animal: **kingfisher** (one dive, one exact catch). Accent: `#1fa3a8`.
- Pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46, `lab/cascade-argmax`. Paths below are relative to `lab/cascade-argmax/` unless they begin with `src/` or `lab/`.
- Throughline noun: **the gap** (right score minus left score), chapters 1-2; **the table** (16 x 8 cells), chapter 3.
- Status said plainly: construction **holds** (11 tests pass); exactness is **sampled, not proven**; learning claim is **narrowed** (table fit); hard score gradients remain **open/absent**. Cost figures are **built operations** unless labeled compiled.
- Research: `.orly-work/hw-books/inputs/cascade-argmax.md`. Caption-review fix applied: "160/160" always carries "ten seeds"; "seven-stage" is the topology, training anneals through five gains.
- Re-defined briefly, not re-taught: relu, one-hot, argmax, circuit (book "Handwired" covers the rest).

---

## Chapter 1: The Sign Cascade
Thesis: one comparison becomes an exact bit: relu of the gap, then seven rounds of multiply by 2^23 and clamp.

**Visual machine: "the magnifier ladder."** A log-scale vertical gauge (exponents 2^-149 at the bottom to 2^0 at a ceiling line labeled "1") with a glowing bead at the true gap. Beside it a horizontal strip of seven stage cells (each: a x2^23 gear then a clamp gate). The bead rides up through the stages, jumping 23 binary decades per gear, and sits pinned at the ceiling. Camera pushes onto the bead's low end first, then pulls back to the whole ladder. Real computed exponents: -149, -126, -103, -80, -57, -34, -11, +12, then the clamp reads exponent 0 (value 1).

Beat sheet
1. Two score bars (0.5 and 0.5 plus one float step) side by side, difference invisible at normal zoom; a "?" over which is bigger. (1)
2. Chip legend: weighted sum, relu hinge, gated product; a small relu hinge plot highlights the bent corner. (2)
3. Target truth table appears: right > left gives 1, otherwise 0, tie row highlighted "0, left wins". (3)
4. Camera zooms on the subtraction; relu hinge applied: the gap becomes a thin sliver on the gauge. Three rows: tie, left wins (both 0), right wins (sliver). (4)
5. Gauge appears; bead drops to 2^-149 with the label; a "counts as one?" ruler at the ceiling stays far above. (5)
6. First gear x2^23 turns; bead jumps from 2^-149 to 2^-126. Exponent shift shown as the mantissa bits staying identical while the exponent field ticks. (6)
7. Clamp gate drawn: formula chip "clamp01(v) = v - relu(v - 1)"; a value 3.2 hits the gate and is cut to 1, a value 0.4 passes; bound label "exact below 2^24". (7)
8. Each gear and gate gets a small padlock "rounding point" so the stage cells stay separate; a ghost "merged into one formula" version fades out. (8)
9. All seven stage cells light in turn; counter 2^23 x 7 = 2^161. (9)
10. Bead climbs stage by stage with exponent readouts -126, -103, -80, -57, -34, -11, +12; final clamp pins it to exactly 1 at the ceiling. (10)
11. Replay with a larger gap (saturates at stage 2 or 3, then rides at 1) and a tie (bead stays at floor of the gauge, labeled 0, the left bar lights). (11)
12. Pull back: the finished bit wire with chip "no boolean atom: 0" (report column). (12)

Captions
1. Picking the biggest of several scores sounds easy. Inside a handwired circuit it has to be exact, even when two scores differ only in their very last bit. [README.md:3; cascade-argmax.ts:1-12]
2. The circuit has only weighted sums, relu, and products gated by a relu. Relu keeps a positive number as it is and turns a negative one into zero. [src/runtime/numeric-ui-core.ts:445-447]
3. We want one bit from two scores: one if the right score is strictly larger, zero otherwise. A tie must give zero, so the left candidate wins. [cascade-argmax.ts:10-11, 31]
4. Step one is relu of the right score minus the left. That is zero for a tie or a left win, and positive for a right win, but possibly absurdly small. [cascade-argmax.ts:75-76]
5. How small? The smallest positive gap between thirty-two-bit floats is two to the minus one hundred forty-nine. Nothing downstream would call that a one. [cascade-argmax.ts:28-29]
6. So the circuit multiplies by two to the twenty-third. Multiplying by a power of two only shifts the exponent, so the gap grows without losing any precision. [cascade-argmax.ts:7-9, 41]
7. Then a clamp caps the value at one. The clamp is the value minus relu of the value minus one, and it stays exact for anything below two to the twenty-fourth. [cascade-argmax.ts:9, 61-67]
8. Each multiply and each clamp is marked as its own rounding point, one the simplifier may not merge away. Otherwise the stages would collapse into one formula. [cascade-argmax.ts:55-59; src/runtime/numeric-ui-core.ts:418-420]
9. Seven multiplies by two to the twenty-third give a total gain of two to the hundred sixty-one. Watch the smallest gap climb through the stages. [cascade-argmax.ts:26-31, 81-86]
10. After the first multiply it is two to the minus one hundred twenty-six. After the seventh it is two to the twelfth, and the final clamp pins it at exactly one. [cascade-argmax.ts:28-29, 81-86; arithmetic 2^-149 x 2^23k; probe bit(0, 2**-149) = 1 in research]
11. A bigger gap saturates earlier and stays at one. A tie is zero, and zero times anything is still zero, so the left candidate keeps its win. [cascade-argmax.ts:8-10, 31; cascade-argmax.test.ts:54-68]
12. The result is a bit made only of sums, relu, and scaling. The lab's report counts zero boolean atoms in it. [cascade-argmax.ts:12; cascade-argmax.test.ts:164-172; report.ts:44-54]

On-screen labels: `emitCascadeGreaterBit`, `reglu`, `roundAffine`, `emitClampZeroOne`, `hardCascadeOptions`, `cascadeStageCount = 7`, `fill(2 ** 23)`, `rampOffset: 0`, `2**-149`, `2**-126`, `2**-103`, `2**-80`, `2**-57`, `2**-34`, `2**-11`, `2**12`, `2**161`, `clamp01(v) = v - relu(v - 1)`, "exact for v below 2**24", "boolean 0".

---

## Chapter 2: Eight Candidates, One Winner
Thesis: the bits form a tournament that matches the leftmost-argmax rule exactly, where the production argmax keeps the left candidate across a rounding band, at roughly 3.5x the built operations.

**Visual machine: "the bracket with a magnifier."** A three-round bracket of eight score cards (bars) on the left; each match is a small comparator bulb fed by the Chapter 1 bit. Winners' cards slide up the bracket along a one-hot route (a lit path). A second, lower bracket is the production argmax fed the same scores. The planted near-tie lives on the cards at positions 2 and 6. Later the stage swaps to a paired cost chart: two bar pairs growing for 8 and 64 candidates (ops and layers).

Beat sheet
1. Eight cards (slot indices 0-7) at the left; pairs bracketed; first-round bulbs appear. (1)
2. One match opens up: two bits (right-wins, left-wins = 1 - right-wins); two gated products carry the winner's score up; a one-hot route marks the path. (2)
3. Tie demo: two equal cards, bulb picks the left; label "leftmost argmax"; oracle chip `leftmostArgmax`. (3)
4. Lower bracket appears: production argmax, with a "scale to near 0.5, then boolean atom" chip; tie also goes left. (4)
5. A band is drawn around zero gap, width roughly 2.4e-7, on a gap-axis; gaps inside it all resolve left in production, none in the cascade. (5)
6. The planted vector: card 2 at 0.5, card 6 at 0.5 plus one step, rest 0.25 etc. Camera zooms on the tiny height difference; production bracket crowns position 2, cascade bracket crowns position 6. (6)
7. Test evidence ticker: counters tick for ties at many magnitudes, subnormals, adjacent floats, 2,000 random vectors at widths 3, 8, 20, 64; "reference == tensor". (7)
8. Stamp "sampled, not proven" over the ticker; a range bar 0..1 labeled "assumed score range". (8)
9. Switch to cost view: for 8 candidates two stacked bars grow: production 56 ops / 15 layers vs cascade 196 / 75. (9)
10. For 64: 504 / 33 vs 1764 / 150, bars on a shared scale, camera pulls back. (10)
11. Relabel bars "built" and add a thinner "compiled" pair 45 vs 187 for 8 candidates; ratio about 4x. (11)
12. A reference line at 150 operations / 57 layers labeled "core exact tree" (different count method noted); text "available construction, not a proof of minimality". (12)

Captions
1. One bit compares two candidates. Eight candidates need a tournament: pair them up, compare each pair, and send the winners on to the next round. [cascade-argmax.ts:99-137]
2. Each match makes a right-wins bit and a left-wins bit, which is one minus it. The winner's score rises through two gated products, and the route is kept as a one-hot. [cascade-argmax.ts:99-149 (122-127, 139-149)]
3. Both argmax versions aim at the same rule: the leftmost maximum wins. The lab's test oracle is simply that rule written in plain code. [cascade-argmax.ts:186-192]
4. The production argmax scales the gap to near one half and rounds it with a boolean atom. A tie goes left there too. [src/runtime/numeric-ui-core.ts:2735-2743; cascade-argmax.ts:1-4]
5. But that encoding also keeps the left candidate across a rounding band. The lab's header puts it at roughly two point four in ten million, and its test bounds it under two point five. [cascade-argmax.ts:3-4; cascade-argmax.test.ts:30-34] (Not reproduced exactly by the research probe: largest seen was 1.86e-7. Show "the lab's own figure".)
6. Plant one candidate a single float step above the leader. In the lab's test the cascade picks it, at position six, while production keeps position two. [cascade-argmax.test.ts:137-149]
7. The tests cover ties at many magnitudes, tiny subnormal gaps, adjacent floats, and two thousand random vectors at each of four widths. Both evaluators agree. [README.md:5; cascade-argmax.test.ts:54-68, 70-101, 103-135]
8. Say it plainly: that is sampled testing, not a proof for every pair of scores. It also assumes scores stay between zero and one. [cascade-argmax.test.ts:36-52, 103-135; cascade-argmax.ts:26-28]
9. Now the price. At eight candidates, production builds fifty-six operations in fifteen layers. The cascade builds one hundred ninety-six in seventy-five. [README.md:26-29; report.ts:44-54]
10. At sixty-four candidates it is five hundred four against one thousand seven hundred sixty-four operations, and thirty-three layers against one hundred fifty. [README.md:26-29; report.ts:44-54]
11. Those are built operations, counted before compiling. Compiled, the cascade is still about four times larger: forty-five against one hundred eighty-seven at eight candidates. [research "Other probes" (compileTensorProgram, selected-only roots); lab/ui-exploration/guide/examples/patterns/selection/highest-score-tree.test.ts:155]
12. The lab calls the cascade an available construction, not a proof of minimality. The core's own exact tree is one hundred fifty operations in fifty-seven layers, counted after compiling. [README.md:31, 33; highest-score-tree.test.ts:155-156]

On-screen labels: `emitCascadeArgmax`, `routeCascade`, `leftmostArgmax`, `emitArgmax`, `comparisonBias = 0.5000000596046448`, `comparisonScale = 0.4999999403953552`, "roughly 2.4e-7 (header)", `productionBandBound = 2.5e-7`, scores `0.5` and `0.5 + 2**-24`, "production: 2, cascade: 6", test counts "2,000 random vectors x widths 3, 8, 20, 64", cost table rows `8 | production | 56 | 15`, `8 | cascade | 196 | 75`, `64 | production | 504 | 33`, `64 | cascade | 1764 | 150`, "built" vs "compiled 45 / 187", "core exact tree: 150 ops, 57 layers". Do NOT show the report's timing column.

---

## Chapter 3: Training It Soft
Thesis: soften the cascade so gradient flows, fit a 16 x 8 table, harden it to exact picks, and see why that is table fitting, not a learned rule.

**Visual machine: "the table that sharpens."** A 16 x 8 heat grid (cases x candidates, 128 cells). Next to it a single comparator whose ramp curve is plotted: a steep-to-gentle ramp whose slope steepens as the gain anneals (2^3, 2^6, 2^10, 2^15, 2^21), then snaps to a hard step. Cells settle so each row has one bright winner column; at the end a hard-check sweep lights all 160 results (10 seeds x 16 cases).

Beat sheet
1. The hard step curve plotted flat on both sides; a gradient arrow dies on it. (1)
2. Three probes (separated, tie, 2^-149 gap) each show the arrow reading exactly 0. (2)
3. Seven gears slide down from 2^23 to a gentle gain; the step morphs into a slanted ramp (clamp becomes ramp). (3)
4. The ramp slides so its midpoint sits at the zero gap; a tie dot sits mid-ramp with arrows pushing both ways. (4)
5. The 16 x 8 grid appears with one cell highlighted; counter 16 x 8 = 128. (5)
6. Five annealing steps: ramp steepens at each (gains 2^3 ... 2^21); epoch counter up to 150 per step, ending early once all cases are right; the grid separates. (6)
7. Initial weights shown as a faint band around 0.5; the widest ramp covers that band. (7)
8. Hardening: ramp snaps to the exact step; both evaluator checks tick per row. (8)
9. Ten seed lanes each show 16/16; total counter 160/160 "across 10 seeds". (9)
10. A second, smaller circuit (single clipped ramp; "70 vs 196 ops" is NOT shown unless stated as a probe; use "under half") yields the same 160/160 over seeds 101-110. (10)
11. A new, unseen row appended to the grid appears greyed with "?" ; no formula links rows. (11)
12. Closing scorecard: four labeled chips with plain status tags: construction holds; exactness sampled; learning narrowed to table; hard gradients absent. Stage quiet under it. (12)

Captions
1. Writing a circuit by hand is one thing. Can its scores be learned? The hard cascade is exact, but a hard decision hands back no useful gradient. [README.md:9; lab/status.md:202]
2. The lab measured it. For separated scores, a tie, and the smallest possible gap, the gradient reaching the scores was exactly zero. [ramp.test.ts:16-24]
3. So training uses the same topology, soft. The seven scale factors shrink from two to the twenty-third to a gentle gain, and each clamp turns into a ramp. [cascade-argmax.ts:14-19, 44-53]
4. The ramp is centered on a zero gap, so a tie sits mid-ramp and a wrong decision gets gradient from both orderings. [cascade-argmax.ts:14-19, 31-33, 46-53]
5. The task is small. Sixteen cases, eight candidates, and one learned score for every case and candidate: a table of one hundred twenty-eight cells. [README.md:11; training.ts:44-50, 62-100]
6. Training anneals the total gain in five steps, from eight up to about two million, with up to one hundred fifty epochs at each, stopping early once every case is right. [training.ts:47-49, 165]
7. The weights start close together near one half, so every comparison sits inside the widest ramp and receives gradient from the first epoch. [training.ts:115-119]
8. Then comes hardening. The same weights go into the exact cascade, and every winner must come out exact in both evaluators. [training.ts:170-188]
9. Across ten seeds, all one hundred sixty winners came out right after hardening. That result holds for this table and these seeds. [README.md:15; report.ts:56-71 ("Hardened winners: 160/160 across 10 seeds.")]
10. A control with a single clipped ramp, with under half the operations, also reaches one hundred sixty of one hundred sixty on ten fresh seeds. [README.md:16, 18; ramp.test.ts:5-14; lab/status.md:202]
11. So this is per-case table fitting. There is no shared query and key rule, and no claim about contexts the table never saw. [README.md:11; report.ts ("per-case table fitting, not unseen-context generalization"); lab/status.md:202; lab/reassessment-2026-09-03.md:126]
12. The scorecard: the exact forward construction holds, the learning claim is narrow, and useful gradients through the hard cascade are still missing. [lab/status.md:202; README.md:3, 9, 11]

On-screen labels: `softCascadeOptions`, `hardCascadeOptions`, `rampOffset = 0.5 / totalGain`, `trainSelection`, `buildSelectionCircuit`, `defaultTrainingConfig` (16 cases, 8 candidates, 150 epochs), gains `2**3, 2**6, 2**10, 2**15, 2**21`, weights `0.5 + 0.04*(u - 0.5)`, "Hardened winners: 160/160 across 10 seeds." (seeds 1-10), "Single-ramp hardened winners: 160/160" (seeds 101-110), "This is per-case table fitting, not unseen-context generalization." Do not state any operation count for the single ramp.

---

## Honesty notes for the implementer
- Exactness: say "sampled", never "every pair". Band figure is the lab's own statement; the research probe saw 1.86e-7 at most.
- 196 vs 56 are built counts; 187 vs 45 compiled (research probes, selected-only roots). Keep the "built"/"compiled" labels visible.
- 160/160 is across ten seeds; the single-ramp control is separate seeds (101-110).
- The soft form at 2^161 would not equal the hard form (stage scale is 8388607.999999993 before rounding to float); don't claim it does.
- Timing column is machine-dependent: never shown.
