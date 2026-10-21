# Handwired: Bitonic Sorter
- **Title:** Bitonic Sorter
- **Subtitle:** Ken Batcher's fixed wiring of comparators, and what a circuit of sums and relu pays to run it.
- **Animal:** pangolin (scales that fold over each other, like the half-cleaner folding a sequence)
- **Accent:** #3e9b73
- **Source:** Wikipedia "Bitonic sorter" rev 1373262602 (cited as wiki:LINE); chenglou/handwired @ 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (`lab/ui-exploration`); exploration-branch notes at d01b763 (notes-outside, notes-runtime); numbers verified by the reference implementation in `.orly-work/hw-books/bitonic-ref/` (report.txt). Lab status: historical record of measurements; the sorting-network-versus-counting verdict holds at UI sizes; packaging a network past 64 items is open.
- **Throughline noun:** the mountain (a bitonic sequence), then the comparator in Handwired.
- **Vocabulary fixed for the whole book:** "stage" = one parallel column of comparators in a network; "layer" = one dependency level of Handwired's circuit (a stage costs three layers there); "delay"/"parallel time" are never used.
- **Honesty notes:** Credit Ken Batcher (1968). Handwired's numbers are measurements from its exploration notes, quoted as measured; the 2,752 vs 2,688 and 64 vs 63 gaps are stated as unexplained and the payload per-comparator cost is never stated. Fractional-key drift was measured on the odd-even network only. The locality claim is the article's, unmeasured. Article defects (infobox "space", inclusive loop bound, the bitonic definition gap, the correctness sketch, the "k levels" conflation, "k" as count) are never repeated; chapter 1 and 3 state the corrected forms. Chapter 3 beat 8 must recompute the inclusive-bound output by running the reference code, not from memory.
- Estimated runtime: 4 chapters x 70-110 s.

## Chapter 1: Two Wires and a Fold

**Thesis:** One fixed fold, comparing wire i with wire i plus half, turns any bitonic sequence into two halves that never need to talk to each other again.

**Visual machine:** Eight vertical bars on eight wires (heights 1 2 6 7 8 5 3 0). Four arcs link wire i to wire i+4; the comparators fire together and the bars physically slide into a low half and a high half separated by a shaded gap; recursion then folds each half again until the bars stand sorted.

**Beat sheet** (caption numbers in brackets)
1. Two wires with bars of height 3 and 7. The comparator rod between them lights; the in-order pair does not move, then the pair 7,3 crosses over on swept arcs so the smaller bar rises to the top wire. Camera tight on the pair. [captions 1, 2]
2. Pull back: a faint ghost of the 8-wire, 24-comparator network passes behind, a counter reads "24 comparators", and a plaque reads "Ken Batcher, 1968". [captions 3]
3. Eight bars [1, 2, 6, 7, 8, 5, 3, 0] grow in on wires 0 to 7. A smooth outline traces the climb and fall; a peak marker sits at wire 4 (value 8); label "bitonic: up, then down". [captions 4]
4. Camera pushes in. Four arcs link wire i to wire i+4 (0-4, 1-5, 2-6, 3-7), index labels at each end, each pair pulsing in its own hue. [captions 5]
5. The four comparators fire at once. In each pair the smaller bar slides into slots 0 to 3 and the larger into slots 4 to 7. Left half [1, 2, 3, 0] tinted cool, right half [8, 5, 6, 7] tinted warm. A small table of x[i], x[i+4], min, max builds beside it from the real values. [captions 6]
6. A divider drops between the halves. A ceiling line at height 3 on the left and a floor line at height 5 on the right; the gap between them is shaded. [captions 7]
7. The right half outline is traced as a valley (8 5 6 7). The four bars then slide around a ring so 5 comes first and the outline becomes a climb; a counter ticks up to "2,083 mountains - 415 rotated right halves - 0 failures". [captions 8, 9]
8. Recursion: arcs at distance 2 on each half, then distance 1. Left half goes [1, 2, 3, 0] to [1, 0, 3, 2] to [0, 1, 2, 3]; right half [8, 5, 6, 7] to [6, 5, 8, 7] to [5, 6, 7, 8]. Bars stand in order 0 1 2 3 5 6 7 8. [captions 10]
9. Beneath, a three-column mini network assembles with labels "distance 4", "distance 2", "distance 1", four comparators in each column; a bracket marks the 2-wire case "= one comparator". [captions 11]
10. Quiet end: the sorted bars remain, everything else fades to 0.15; label "bitonic in, sorted out". [captions 12]

**Captions**
1. Most sorting looks at the data and decides what to do next. A sorting network never decides. It is a fixed list of compare-and-swap steps, wired the same way for every input. [loops.md:185]
2. The one part is the comparator. Two numbers go in. The smaller comes out on the top wire, the larger on the bottom. Already in order, nothing happens. Out of order, they trade places. [wikipedia §Bitonic sorter, wiki:26]
3. In nineteen sixty-eight, Ken Batcher showed how to wire comparators into a bitonic sorter. For eight numbers it takes twenty-four comparators, and the same twenty-four sort any list of eight. [wikipedia §intro, wiki:14; report.txt §1 n=8, §5, §5b]
4. It rests on one shape: a sequence that climbs and then falls, which the name bitonic describes. Picture a mountain: one, two, six, seven, eight, five, three, zero. [wikipedia, wiki:16; report.txt §4]
5. Here is the half-cleaner. Pair each wire in the first half with its partner in the second half: wire zero with wire four, one with five, two with six, three with seven. [wikipedia, wiki:41-42]
6. Four comparators fire at once. Each pair's smaller number drops into the left half, the larger into the right. The left half is now one, two, three, zero. The right is eight, five, six, seven. [report.txt §4 table]
7. Check the border. Everything on the left is at most three, and everything on the right is at least five. Nothing needs to cross, so the two halves can be sorted separately. [report.txt §4 (max low 3 <= min high 5); wiki:45-46]
8. Each half is still a mountain, in a wider sense. The right half, eight, five, six, seven, dips like a valley, but start reading at the five and it climbs. A rotated mountain counts. [report.txt §4 (cyclic-bitonic true)]
9. Wikipedia's definition allows only straight mountains, but the argument needs rotated ones too. Across all two thousand eighty-three eight-long mountains with values zero to three, the split never failed. [report.txt §4b; inputs/bitonic-sorter.md Article defects #3]
10. So split again. Half-clean each half into quarters, then each quarter into pairs. Run on this input, the pieces come out as zero, one, two, three, five, six, seven, eight. [wikipedia, wiki:33-36; report.txt §6b (exclusive merge output)]
11. Three rounds of this do it for eight numbers: pairs at distance four, then two, then one. Two wires is the smallest case, and a bitonic sorter of that size is simply a comparator. [report.txt §2 stages 3-5; wiki:26]
12. That is the merging machine. Hand it any mountain whose length is a power of two, and it hands back a sorted line. What it cannot do yet is make mountains. That comes next. [wiki:20, wiki:33-36]

**On-screen labels:** `x[i]` vs `x[i + 4]` (low = min, high = max); bars [1, 2, 6, 7, 8, 5, 3, 0]; low half [1, 2, 3, 0]; high half [8, 5, 6, 7]; "max(low) = 3 <= min(high) = 5"; rotated high half [5, 6, 7, 8]; counter "2,083 bitonic inputs, 415 rotated high halves, 0 failures (values 0..3, n = 8)"; "24 comparators", "Ken Batcher, 1968"; distance labels 4, 2, 1; sub-results [0, 1, 2, 3] and [5, 6, 7, 8]; final [0, 1, 2, 3, 5, 6, 7, 8].

## Chapter 2: Building the Mountains

**Thesis:** Sorting is merging mountains bottom-up: sorted-up beside sorted-down is a mountain, so alternating directions feed each merge.

**Visual machine:** An 8-wire network drawn left to right with a value disc riding each wire. Comparator rods are blue when they send the smaller value up and orange when down. Stage columns light in turn while the discs trade places; a trace table on the right fills with the real array after each stage, and brackets under the wires show block sizes 2, 4, 8.

**Beat sheet** (caption numbers in brackets)
1. Eight discs [3, 7, 4, 8, 6, 2, 1, 5] sit on eight bare wires. Brackets of size 2 appear under pairs, each labelled as a tiny mountain. [captions 1]
2. Stage 0 column: four rods, 0-1 blue, 2-3 orange, 4-5 blue, 6-7 orange. Discs trade; the table row reads [3, 7, 8, 4, 2, 6, 5, 1]. [captions 2]
3. Brackets grow to size 4. Stages 1 and 2 light with distances 2 then 1: rods 0-2, 1-3 blue, 4-6, 5-7 orange; then 0-1, 2-3 blue, 4-5, 6-7 orange. Table rows [3, 4, 8, 7, 5, 6, 2, 1] then [3, 4, 7, 8, 6, 5, 2, 1]. [captions 3]
4. Silhouette of the two blocks: 3 4 7 8 climbing, 6 5 2 1 falling; an outline traces the mountain they form together. [captions 4]
5. Stage 3: four long rods at distance 4, all blue. Camera pushes in; the 4 smallest values slide to the left half. Row [3, 4, 2, 1, 6, 5, 7, 8]. [captions 5]
6. Stages 4 and 5 (distance 2, then 1), all blue. Row [2, 1, 3, 4, 6, 5, 7, 8] then [1, 2, 3, 4, 5, 6, 7, 8]; the final line flashes sorted. [captions 6]
7. All six columns visible; each lights all four rods simultaneously. Counter: "6 stages x 4 comparators = 24". [captions 7]
8. Distance ribbon under the columns: 1 | 2 1 | 4 2 1, grouped by merge; the sum "1 + 2 + 3 = 6" appears; ghost of the n = 16 version (10 stages) fades in beside it. [captions 8]
9. Replay with another input: the same 24 rods in the same places, different discs swapping. Label "wiring fixed, swaps data-dependent". [captions 9]
10. Two counters tick up: "256 / 256 zero-one lists sorted at 8 wires", "65,536 / 65,536 at 16 wires", then a sample strip "2,000 random lists per size, 2 to 64 wires, 0 mismatches" with 32 and 64 marked "sampled". [captions 10, 11]

**Captions**
1. A shuffled list is not a mountain, so build them from the bottom up. Any two numbers form a mountain already, and one comparator can set them to climb or to fall. [wiki:80-82; report.txt §2]
2. Take three, seven, four, eight, six, two, one, five. Stage zero compares neighbors, and the second and fourth pairs run downhill. Out comes three, seven, eight, four, two, six, five, one. [report.txt §3, §2 stage 0]
3. Now there are two mountains of four. Merge each with a half-cleaner, across a distance of two and then one. The first block sorts upward, the second downward. [report.txt §2 stages 1-2]
4. That gives three, four, seven, eight, then six, five, two, one. Sorted up beside sorted down is exactly a mountain, which is why the directions alternate. Two sorted runs became one bigger mountain. [report.txt §3 after stage 2; wiki:80-82]
5. Stage three is the half-cleaner from before, across a distance of four. The four smallest values land on the left, three, four, two, one, and the four largest on the right. [report.txt §3 after stage 3, §2 stage 3]
6. Two more stages finish it, at distance two and then one. After the sixth stage: one, two, three, four, five, six, seven, eight. [report.txt §3 after stages 4-5]
7. Count the work. Six stages, each with four comparators on separate wires, so all four fire at the same moment. Twenty-four comparators, but only six steps in time. [report.txt §1 n=8]
8. The distances tell the story: one, then two and one, then four, two and one. Each merge is one stage longer than the last, so eight numbers take one plus two plus three, six stages. [report.txt §2; wiki:138]
9. Notice what the comparators never do: choose where to look. The wiring is the same for every input, and only the swaps depend on the values. That is what lets a fixed machine run it. [report.txt §2 (stage list is input-independent); loops.md:185]
10. Does it sort everything? We ran all two hundred fifty-six lists of zeros and ones through eight wires, and all sixty-five thousand five hundred thirty-six through sixteen. Every one came out sorted. [report.txt §5]
11. Two thousand random lists per size, from two up to sixty-four wires, also matched the built-in sort. Thirty-two and sixty-four wires were sampled this way, not checked exhaustively. [report.txt §5b; inputs/bitonic-sorter.md "What the checks cover"]

**On-screen labels:** input [3, 7, 4, 8, 6, 2, 1, 5]; trace [3, 7, 8, 4, 2, 6, 5, 1], [3, 4, 8, 7, 5, 6, 2, 1], [3, 4, 7, 8, 6, 5, 2, 1], [3, 4, 2, 1, 6, 5, 7, 8], [2, 1, 3, 4, 6, 5, 7, 8], [1, 2, 3, 4, 5, 6, 7, 8]; stage labels "stage 0" to "stage 5" with pairs e.g. "(0,1 asc) (2,3 desc) (4,5 asc) (6,7 desc)"; legend asc / desc; "6 stages x 4 comparators = 24"; distance ribbon 1 | 2 1 | 4 2 1; "256 inputs, 0 not sorted (n = 8)"; "65536 inputs, 0 not sorted (n = 16)"; "2000 random arrays per size, 0 mismatches". Calls: `bitonicSort(a, 0, n, 1)`, `bitonicMerge`.

## Chapter 3: The Staircase

**Thesis:** Stages grow like k(k+1)/2 and comparators like n times k(k+1)/4, so doubling the list adds a handful of stages but nearly triples the comparators.

**Visual machine:** A bitonic network that grows: 8 wires and 6 columns morph to 16 wires and 10 columns, then 32 and 64 (21 columns). Columns are colored by comparator distance. A sweeping highlight lights one whole column at a time, and a stage staircase (bars 1, 3, 6, 10, 15, 21) plus a comparator counter sit beside it.

**Beat sheet** (caption numbers in brackets)
1. Start from the 8-wire, 6-column network of chapter 2. Under it, merge brackets of 1, 2, 3 columns; the sum "k = 3: 1 + 2 + 3" appears as "k(k+1)/2 = 6". [captions 1]
2. Network morphs to 16 wires (new wires splice in, new columns slide in, 10 columns); a staircase on the right grows one step per size: 1, 3, 6, 10, 15, 21 for 2, 4, 8, 16, 32, 64 wires, each step labelled with its increment. [captions 2]
3. Camera pushes to a single column: half as many rods as wires; a counter reads n/2 per column and multiplies out to 1, 6, 24, 80, 240, 672 comparators as the sizes cycle. [captions 3]
4. Two curves share an axis on log2 n: stages (gentle) and comparators (steep). Marker at 32 to 64 wires: stages 15 to 21, comparators 240 to 672 ("about 2.8 times"). [captions 4]
5. Full 64-wire network (21 columns); a sweep lights one column at a time; each lit column flashes 32 rods at once with a counter "32 comparators per step, 21 steps". A row of lockstep lanes labelled "parallel units" lights in unison. [captions 5]
6. A small quote card, attributed: "the article's claim: locality of reference, cache-friendly". Label "not measured here". [captions 6]
7. Seven values pad to eight: a bar of infinity ("sentinel") joins at the end, the 8-wire network runs, and the extra bar is trimmed. A strip "m = 1 to 64, 3,200 arrays, 0 mismatches". [captions 7]
8. Inset on the 8-wire network: a ghost comparator reaches from the last wire of a block into the next block; the zero-one list 1 1 1 1 0 0 0 0 fails with the extra rod, passes without it. Counter "8 of 256 fail". Recompute the failing output by running the inclusive-bound variant in bitonic-ref/bitonic.ts and show only what it prints. [captions 8]
9. Second network overlay in a different hue: odd-even merge, 64 wires, with counter "543 comparators" beside "672". [captions 9]
10. Quiet: the staircase and two formulas remain; the network fades to 0.15. [captions 10]

**Captions**
1. Let the list have two to the k wires. The last merge takes k stages, the merge before it k minus one, and so on down to one. Add them up: k times k plus one, over two. [wiki:138; report.txt §1]
2. For two, four, eight, sixteen, thirty-two and sixty-four wires, that is one, three, six, ten, fifteen and twenty-one stages. Each doubling adds only a few more stages. [report.txt §1]
3. Every stage has half as many comparators as wires. So the total is the number of wires times k times k plus one, over four: one, six, twenty-four, eighty, two hundred forty, six hundred seventy-two. [report.txt §1]
4. In the usual shorthand, comparators grow like n times log n squared, and stages like log n squared. From thirty-two to sixty-four wires, comparators nearly triple, while stages go only from fifteen to twenty-one. [wiki:14; report.txt §1]
5. That gap is why hardware likes it. A graphics processor has many units running in lockstep, and each stage gives all of them, thirty-two comparators for sixty-four numbers, work in the same instant. [wiki:14 ("such as a typical GPU"); report.txt §1]
6. The article also says many consecutive operations keep locality of reference, which makes them cache-friendly in practice. That is the article's claim, citing Batcher. We did not measure it. [wiki:140; inputs/bitonic-sorter.md fact 7]
7. The original design needs a length that is a power of two. For other lengths, pad with a sentinel bigger than everything, then drop the extras. That worked for every length from one to sixty-four in our check. [wiki:20, wiki:99; report.txt §7]
8. It is easy to get a stage wrong. The article's loop, read literally, runs one comparison too far, reaching into the neighboring block. At eight wires that fails eight of the two hundred fifty-six zeros-and-ones lists. [wiki:109; report.txt §6; Article defects #2]
9. Bitonic is not the only Batcher network. His odd-even merge sort needs fewer comparators: five hundred forty-three at sixty-four wires, against six hundred seventy-two. [report.txt §1 odd-even line; loops.md:185]
10. So the picture so far: half as many comparators as wires per stage, k times k plus one over two stages, and wiring that never looks at the data. Now a stranger machine, one with no swaps at all. [report.txt §1; loops.md:185]

**On-screen labels:** n = 2, 4, 8, 16, 32, 64; k = 1..6; stages k(k+1)/2 = 1, 3, 6, 10, 15, 21; comparators n*k(k+1)/4 = 1, 6, 24, 80, 240, 672; "32 comparators per stage at n = 64"; "240 to 672 comparators, 15 to 21 stages"; "O(n log^2 n) comparators, O(log^2 n) stages"; sentinel +Infinity, "m = 1..64, 3200 arrays, 0 mismatches"; loop bound `i < low + k` (correct) versus `i <= low + k` (as printed): "8 of 256 zero-one inputs fail at n = 8, 256 of 65,536 at n = 16"; failing input [1, 1, 1, 1, 0, 0, 0, 0]; odd-even "543 comparators, n = 64".

## Chapter 4: What Handwired Pays

**Thesis:** A sorting network fits a circuit of sums and relu, but measured against ranks by counting it costs more depth and, past sixty-four items, an open question.

**Visual machine:** A circuit-to-scoreboard machine. First a two-input compare-exchange drawn as nodes (a, b, difference, relu, minimum, maximum). Then the circuit tiles into a tower of layers, one slab per layer, growing upward. Finally two towers per item count (16 and 64) stand side by side, bitonic versus counting, with a horizontal operations bar under each and a heatmap of the pairwise comparison grid for counting.

**Beat sheet** (caption numbers in brackets)
1. A bare grid of cells labelled "weighted sum" and a relu curve (flat at zero, then rising) draw in; three slabs stack, labelled layer 1, 2, 3, each reading only the slab below. [captions 1, 2]
2. A conventional branching sort flow dims with an "X"; a fixed 8-wire network fades in with the stamp "measurements from exploration notes, September 2026". [captions 3]
3. Zoom to the compare-exchange: a and b into a subtract node (d = a - b), relu node (relu(d)), then two outputs: min = a - relu(d), max = b + relu(d). Counters "4 operations", "3 layers". Numeric example a = 7, b = 3 flowing through (d = 4, relu = 4, min = 3, max = 7). [captions 4]
4. 21 stage slabs of 3 layers pile into a tower to 63 layers, ghosted; beside it the measured 64-layer tower overlays with the extra layer highlighted; operations bar "2,688 predicted" vs "2,752 measured" with a "?" gap marker labelled "notes do not explain". [captions 5, 6]
5. Photos (cards) ride along with their keys through the comparator: a payload tag on each disc. Towers for 16 items (50 layers, 1,248 ops) and 64 items (105 layers, 10,624 ops) rise. [captions 7]
6. Counting grid: an 8 x 8 matrix of compare bits lights `x_j < x_i`; row sums print as ranks 0..7; each card slides straight to its rank slot (a one-hot read). [captions 8]
7. Race at 16 items: bitonic ops bar 1,248 vs counting 1,056 (counting shorter), towers 50 vs 5. [captions 9]
8. Race at 64 items: bitonic 10,624 vs counting 16,512 (network shorter), towers 105 vs 5. Item-count axis sketch shows n squared curve rising past the network curve; marker "hundreds of items". [captions 10]
9. Fractional-key inset: a number line with rounding error ticks; labels "20-24% of outputs not bit-equal, errors up to 6e-5 (odd-even network, measured)" and "integers: exact"; counting grid shown unaffected. [captions 11]
10. Status stamps appear on the scoreboard: "historical record" on the measurements, "holds: count ranks at UI sizes", "open: package a network past 64 items". [captions 12]
11. Quiet recap strip fading in left to right: comparator, mountain fold, k(k+1)/2 staircase, 3 layers per comparator, two towers; everything else at 0.15. [captions 13]

**Captions**
1. Handwired writes a program as one fixed circuit of weighted sums and relu, over thirty-two-bit floats. Relu keeps a positive number and turns a negative one into zero. No loops, no branches. [README.md:5 (lab/ui-exploration); README.md:18]
2. The circuit is cut into layers. Operations that do not depend on each other share a layer, and each layer reads only earlier ones. So cost has two numbers: operations in all, and layers deep. [docs/execution-model.md:40]
3. A sort that branches on comparisons cannot be written that way, but a sorting network can, because its comparators never depend on the data. The numbers ahead are measurements from Handwired's own exploration notes. [docs/patterns.md:358; loops.md:185; notes-outside:109]
4. A comparator becomes arithmetic. Subtract the two keys, run the difference through relu, subtract that from the first key for the minimum, and add it to the second for the maximum. Four operations, three layers. [loops.md:185; notes-runtime:66]
5. Twenty-one stages at three layers each predicts sixty-three layers for sixty-four keys. Handwired measured the bitonic network, keys only, at sixty-four layers and two thousand seven hundred fifty-two operations. [notes-outside:32; report.txt §1 n=64]
6. Four operations times six hundred seventy-two comparators would be two thousand six hundred eighty-eight. The notes do not explain the small gap, so read these as measurements, not a derivation. [notes-outside:32; report.txt §1; inputs/bitonic-sorter.md "Handwired's measurements"]
7. Real lists carry a payload, like a photo that travels with its key. With one payload value per item, the bitonic network measured one thousand two hundred forty-eight operations in fifty layers at sixteen items. [loops.md:189]
8. The rival needs no network. A rank counts the items ahead of this one, so compare every pair and add. Equal keys break ties by index, and that count is the sorted position. A one-hot read fetches the payload. [notes-runtime:238; docs/patterns.md:358; ranks-instead-of-sorting.md:73]
9. At sixteen items, counting wins on work: one thousand fifty-six operations against one thousand two hundred forty-eight, in five layers against fifty. [loops.md:189, :192]
10. At sixty-four, the network wins on work: ten thousand six hundred twenty-four operations against sixteen thousand five hundred twelve. But it is one hundred five layers deep, and counting stays at five. [loops.md:190, :192]
11. Pairs grow with the square of the item count. Handwired's notes still call counting the better choice for the item counts interfaces usually have, with trouble starting around hundreds of items. [notes-outside:113; ranks-instead-of-sorting.md:84]
12. One caveat. Minimum and maximum built from arithmetic drift on fractional keys. On the odd-even network, twenty to twenty-four percent of outputs matched no input bit for bit, with errors up to six in a hundred thousand. [loops.md:194; notes-runtime:237; execution-model.md:282]
13. The verdict, from that historical record: at interface sizes, count ranks. Whether to package a sorting network for apps that sort well past sixty-four items is still an open question. [review-and-decisions.md:269; notes-outside:113; loops.md:192]

**On-screen labels:** `emitMinimum`, `emitMaximum`, `emitCompare`; "min = a - relu(a - b)", "max = b + relu(a - b)"; "4 operations, 3 layers"; example a = 7, b = 3; rank formula `rank_i = sum_j [x_j < x_i or (x_j = x_i and j < i)]` (ties break by index); table (measured, integer keys): 16 items with payload: bitonic 1,248 operations / 50 layers, counting 1,056 / 5; 64 items with payload: bitonic 10,624 / 105, counting 16,512 / 5; 64 keys only: bitonic 2,752 / 64, odd-even 2,172 / 63 (Batcher network); predicted 21 x 3 = 63 layers, 672 x 4 = 2,688 operations (arithmetic, not measured); counting alone 4,096 operations in 3 layers (ranks only, different conditions); float drift "20-24% not bit-equal, errors up to 6e-5 (odd-even, fractional keys)"; stamps "measurements from exploration notes", "historical", "holds at UI sizes", "open past 64 items". Source tag "chenglou/handwired @ 4ea7fcb27ebe", notes tag exploration-2026-09.
