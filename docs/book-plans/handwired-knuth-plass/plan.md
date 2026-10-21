# Plan: handwired-knuth-plass

- **Title:** Knuth-Plass
- **Subtitle:** Optimal line breaks as a tree of min-plus matrices: one paragraph loses, many can win.
- **Animal:** barn owl (pale, silent, pins one exact target from many sounds), cover art can show an owl over a column of ruled lines
- **Accent:** `#5b8bd6` (dusk blue); supporting: greedy/red `#c0504d`, optimal/accent blue, brick sand `#d8c39a`
- **Pinned source:** chenglou/handwired @ `4ea7fcb27ebe93acf49b9f29a93e162b975bad46`, lab `lab/knuth-plass`
- **Throughline noun:** the paragraph (four bricks in chapter 1, a ribbon of break points in chapter 2, a rack of paragraphs in chapter 3).
- **Status wording (said plainly in the book):** the lab's answer to Cheng is "for many paragraphs, yes; for one paragraph, no", true only for the dense-rows kernel with positions uploaded, on one Apple chip through Metal in headless Chrome; the crossover count is NARROWED to a range that is "not a stable result"; every CPU time and ratio is HISTORICAL (measured before commits de04d25 and a1b3b7b, not re-measured); Sklansky's network, a GPU mode for the page, mixed-length batches and the demo's justified cost are OPEN. The correctness claims HOLD as far as reproduced (7 of 7 GPU tests pass; CPU tables regenerate). Note `lab/status.md` carries no explicit holds/narrowed/historical/open label for this lab; those words are the researcher's reading and the plan uses them as such.
- **Corrections applied** (research "Contradictions" and the caption review):
  - the line cost is one table read plus **two** relus, not one;
  - "10,232 to 230 layers" is stated at n = 1,024 and W = 32 only (at W = 8 it is 6,184 to 172);
  - "4.50 against 10.4 ms" is dense-rows with **positions uploaded**, W = 32, 1,000 paragraphs of 256 break points; line costs uploaded lose (23.4 vs 10.4);
  - the crossover range is stated per loop (about 105 against the plain loop, about 188 against the typed loop) and as unstable; `lab/status.md:240` overstates the plain-loop bound;
  - the CPU microsecond figures carry the pre-update caveat (README.md:187);
  - the "24.8M values" check is one of two; both are cited (730,566,480 in the two check runs);
  - greedy 13,550 vs optimal 10,058 on the demo page is cut (pretext 1.0.0 specific); the worked 4-box example replaces it.
- **Honest scope:** probe runs of the reference code on the 4-box paragraph (this planner, bun): `costs [0, 9, 0, 10, 10]`, `predecessors [0, 0, 0, 1, 3]`, `breaks [1, 3, 4]`, `totalCost 10`; W = 4 leaf matrices and states match chapter 2's tiles. `knuth-plass.test.ts` needs `@chenglou/pretext` and was not run; `bun test ./lab/knuth-plass/gpu/gpu.test.ts` passes 7 tests. GPU timings are the README's; they were not re-run (no WebGPU).
- **Cut for space (do not add):** greedy vs optimal 13,550 vs 10,058; the demo's river and hyphen penalties; the per-stage GPU timing table; 4,096-point work counts; the compile times and RSS.
- **Music (if asked):** one motif of three stepped clacks (the break points). Ch.1 sparse ticks that settle on a held chord when the total lands on ten; ch.2 a steady chain-of-clicks that is overlaid and resolved by a short tree-shaped chord at 230, a dry flat note for the amber stamp; ch.3 tension on the round-trip floor, a rising line at the dense-rows bend, an unresolved open chord on the wobble band. Machines clack, never chime.
- **Narrator note:** one mid-life voice for the whole film.

## Chapter 1: Cheapest Breaks

**Thesis:** A line costs its empty space squared; one running minimum over earlier break points finds the cheapest breaks for the whole paragraph, and beats greedy 10 to 16 on a four-box paragraph.

**Blurb:** A line costs its empty space squared, and a running minimum over earlier break points finds the cheapest breaks for the whole paragraph.

### Visual machine

**The Break Ladder.** A ruler 6 px wide (the column) with the four boxes drawn to scale as sand-coloured bricks (3, 2, 2 and 5 px, 1 px spaces at `lineStarts [0, 4, 7, 10]`, `lineEnds [3, 6, 9, 15]`). Under the bricks stand five numbered posts, break points 0 to 4. Candidate lines are arcs from post `from` to post `to`; each arc carries a hatched gap bar (its slack) and a cost chip. Under the posts sits a one-row table `cost[0..4]` that fills cell by cell, plus a row `pred[0..4]`. Greedy's lines glow red, the optimal lines glow the accent blue; one running tally counts up for each. The persistent object is the brick strip: it is first sliced greedily, then re-sliced optimally, then re-read through the pointers.

Camera: drive a `cam` channel with `cameraInterp`; push in on each beat's subject, pull back for comparisons and the payoff; keep y ≳ 630 free.

### Beat sheet
1. The four bricks slide onto a 6 px ruler as one ragged strip; the column edge pulses and a question mark floats over the gaps. A small tag reads `lab/knuth-plass`. Bricks measured to scale: 3, 2, 2, 5 px with 1 px spaces; the column bracket reads 6 px. Camera pushes in on the strip. *(captions 1, 2, 3)*
2. Greedy: bricks 1 and 2 snap into line one (width 6, gap 0). Brick 3 drops to line two alone and a 4 px hatched gap opens beside it; brick 4 will not fit beside it (8 > 6) and wraps to line three. Tally under red: `0 + 16 + 0`. *(captions 4)*
3. The gap bar squares itself into a square of side 4 (area 16); a full line shows a zero-size square. KaTeX `min(slack, 63)² `, `last line = 0`. Tally reads 16. *(captions 5)*
4. Rewind: bricks re-slice. Line one is brick 1 alone, with a 3 px gap square (9); line two is bricks 2 and 3 with a 1 px gap square (1); line three is brick 4, last line, no square. Blue tally `9 + 1 + 0 = 10`, beating red 16. Camera pulls back to show both strips stacked. *(captions 6)*
5. Squares compared on screen: one 4×4 square (16) next to a 3×3 plus a 1×1 (10). Red strip dims. *(captions 7)*
6. Overflow: brick 4 forced beside brick 3 pokes past the column edge and a chip reads `infeasible = 4,194,304`; a lone wide brick overflows too but its chip reads `lineCostCap = 3,969`. *(captions 8)*
7. Posts 0..4 rise under the strip and the `cost` table appears. The formula `cost[to] = min over from of cost[from] + lineCost(from, to)` is written as KaTeX; arcs fan back from post 3 as candidates. *(captions 9)*
8. The table fills: `cost[1]=9`, `cost[2]=0`, then post 3 weighs two arcs, `0+16 = 16` from post 2 against `9+1 = 10` from post 1 (post 0 is `4,194,304`, greyed). The cheaper arc thickens, `pred[3]=1` is written. A tie-rule chip: `strictly less replaces`. *(captions 10, 11)*
9. The circuit view: one arc's cost zooms into a three-op mini-circuit `squared table read → relu → relu`; the min of two numbers zooms into `excess = relu(left − right)`, `value = left − excess`. Values 16 and 10 run through it: excess 6, value 10. *(captions 12)*
10. Quiet: other arcs fade to ≤ 0.15. From post 4 a pointer hops back 4 → 3 → 1 → 0 along `pred`, lighting posts 1, 3, 4 in blue; the strip re-cuts at those posts. Final tally card: `10` over a faded `16`. *(captions 13)*

### Captions (spoken verbatim)
1. Fitting a paragraph to a column means choosing where each line breaks. Knuth-Plass picks the cheapest set of breaks for the whole paragraph, instead of filling one line at a time. `[lab/knuth-plass/README.md:5; lab/knuth-plass/reference.ts:29-48]`
2. This lab writes that method as a fixed program of sums, table lookups and relus, which clip negatives to zero. Cheng asked whether many paragraphs at once would then run faster on a graphics chip. `[lab/knuth-plass/README.md:5 (Cheng's question, 'yes to both'); lab/knuth-plass/program.ts:79-119 (sums and relu)]`
3. Take a tiny paragraph: four boxes, three, two, two and five pixels wide, with one pixel spaces, in a column six pixels wide. Where should the lines break? `[lab/knuth-plass/knuth-plass.test.ts:12-14 (classicParagraph, boxes 3,2,2,5 at 6 px); lab/knuth-plass/paragraph.ts:4-11]`
4. Greedy filling packs each line until the next box won't fit. The first two boxes fill six pixels exactly. The third then sits alone, leaving four pixels empty, because the fourth is too wide to join it. `[lab/knuth-plass/knuth-plass.test.ts:12-14 comment (greedy fills '3 2'); probe: lineCost(0,2)=0, lineCost(2,3)=16, lineCost(3,4)=0]`
5. A line's cost is its empty space, squared. Four empty pixels cost sixteen. A full line costs zero, and so does the last line. Greedy's total is zero plus sixteen plus zero: sixteen. `[lab/knuth-plass/reference.ts:6-11; lab/knuth-plass/paragraph.ts:15-18; probe totals 0+16+0]`
6. Break after the first box instead. That line leaves three pixels empty and costs nine. The next two boxes leave one pixel and cost one. The last line is free. The total is ten, beating sixteen. `[lab/knuth-plass/knuth-plass.test.ts:13-14 ('while "3" then "2 2" costs 9 + 1'); probe: lineCost(0,1)=9, lineCost(1,3)=1, lineCost(3,4)=0, total 10]`
7. Squaring is why. One big gap costs more than two small ones: four squared is sixteen, but three squared plus one squared is ten. Greedy can't see that a worse early line buys a better later one. `[arithmetic on the probe values (4²=16; 3²+1²=10); lab/knuth-plass/reference.ts:10]`
8. A line that overflows the column costs a huge number, so it is never chosen. The one exception is a single box wider than the column, at three thousand nine hundred sixty-nine, so every paragraph has a solution. `[lab/knuth-plass/paragraph.ts:21-23, :25-31; lab/knuth-plass/reference.ts:8]`
9. To find the cheapest breaks overall, keep a running best. The cost of reaching a break point is the cheapest, over every earlier break point, of that point's cost plus the line from there. `[lab/knuth-plass/reference.ts:24-28 (cost[to] = min over from of cost[from] + lineCost)]`
10. Walk the break points left to right. Point one costs nine. Point two costs zero. Point three has two candidates: sixteen from point two, or nine plus one, ten, from point one. Ten wins and remembers point one. `[probe (bun run of knuthPlass on classicParagraph, W=4, 6 px): costs [0,9,0,10,10], predecessors [0,0,0,1,3]; lab/knuth-plass/reference.ts:29-48]`
11. On equal totals, the shortest last line wins. A later candidate replaces the best only when it is strictly cheaper, and the shortest line is tried first. `[lab/knuth-plass/reference.ts:26-28 and :39 ('if (total < best)')]`
12. In the circuit, a line's cost is one table lookup and two relus. Each minimum is a relu too: left minus right, clipped at zero, is the excess, and the winner is left minus that excess. `[lab/knuth-plass/program.ts:79-92 (squared table read, ramp = relu(1-D), overflows = relu(1-ramp)); :96-119 (excess = relu(left-right), value = left-excess)]`
13. Point four costs ten, from point three. Follow the remembered points back: four, three, one, zero. Lines end after box one, after box three, and at the end. Total ten, against greedy's sixteen. `[lab/knuth-plass/reference.ts:50-55 backtrack; probe breaks [1,3,4], totalCost 10; lab/knuth-plass/knuth-plass.test.ts:26]`

### On-screen labels

`lab/knuth-plass`, `classicParagraph`, `lineStarts [0, 4, 7, 10]`, `lineEnds [3, 6, 9, 15]`, column `6 px`, `lineCost(from, to) = min(slack, 63)²`, last line `0`, `slackLimit 63`, `lineCostCap 3,969`, `infeasible 2^22 = 4,194,304`, line costs (probe-verified): `(0,1)=9`, `(0,2)=0`, `(1,2)=16`, `(1,3)=1`, `(2,3)=16`, `(3,4)=0`; `costs = [0, 9, 0, 10, 10]`, `predecessors = [0, 0, 0, 1, 3]`, `breaks = [1, 3, 4]`, `totalCost 10`, greedy `0 + 16 + 0 = 16`, `excess = relu(left − right)`, `value = left − excess`. Keep y ≳ 630 free.

## Chapter 2: Chain Or Tree

**Thesis:** The running minimum is a product of min-plus matrices, so the steps can be merged in a tree: 10,232 layers become 230, for about ten times the operations, and on the lab's own CPU executor the chain and a plain loop are faster.

**Blurb:** Each step of the running minimum is a min-plus matrix, so the steps can be merged in a tree: far fewer layers, about ten times the work.

### Visual machine

**The Chain-and-Tree Race.** Stage left shows one real min-plus step as a W = 4 tile, then the stage widens to a row of break-point dots standing for the 1,024-point paragraph. Two lanes run the same paragraph: the chain lane, a lit token that steps dot by dot, a layer counter ticking up to `10,232`; and the tree lane, tiles that pair up level by level into a Brent-Kung bracket, its counter reaching `230`. Because 10,232 steps cannot be drawn one by one, the chain token runs at accelerating speed with the counter and the dots compress into a ribbon; the tree is drawn as a real bracket on 16 dots to show the shape. The persistent object is the tile: it starts as `M3`, merges with `M2`, then becomes a node of the tree. A work bar and a clock bar fill beside the lanes at the end.

Camera: drive a `cam` channel with `cameraInterp`; push in on each beat's subject, pull back for comparisons and the payoff; keep y ≳ 630 free.

### Beat sheet
1. The 4-box state from chapter 1 reappears as a 4-slot column `s[2] = [0, 9, 0, inf]`; the matrix `M3` slides in beside it with real entries: top row `16, 1, inf, inf`, rows below shift (`0` on a diagonal). Camera pushes in on the tile. *(captions 1)*
2. Min-plus multiply plays on the top row: `16 + 0` and `1 + 9` light, `inf` slots grey out; the smaller, `10`, drops into `s[3] = [10, 0, 9, 0]`. Other rows shift down. *(captions 2)*
3. `M3` and `M2` slide together and merge into one tile of the same size, top row `1, 16, inf, inf` (probe). A KaTeX `(M₃ ⊗ M₂) ⊗ s = M₃ ⊗ (M₂ ⊗ s)` with an `associative` badge; the `clamp at infeasible` note appears. *(captions 3)*
4. Camera pulls back to the 1,024-dot ribbon. The chain token begins walking from dot 0, hits full speed; the layer counter races to `10,232`. Label: `chain`, `W = 32`, `n = 1,024`. *(captions 4)*
5. Reset. On the tree lane the tiles pair, then the pairs pair: a bracket of levels draws itself over a 16-dot sample; the counter reads `230`. The chain's counter parks at 10,232 beside it. Label: `tree` / `brentKungPrefix`. *(captions 5)*
6. Work bars grow: chain `277,068` operations, tree `2,823,382`, about ten times longer; a 32×32 tile is drawn merging, to show why. Layers (short) vs operations (long) flip. *(captions 6)*
7. Clock bars: chain 2,925 µs, tree 22,445 µs on the CPU executor; ratio tag `1.7 to 7.7×`. The tree bar is the longer. A third, tiny bar appears: the plain loop, 75 µs, a sliver next to the chain's bar. Camera holds. *(captions 7, 8)*
8. An amber stamp slides across the three clock bars: `measured before de04d25 and a1b3b7b`, `not re-measured`. The bars fade to ≤ 0.3. *(captions 9)*
9. Integer card: a number line to `2^24 = 16,777,216` with the largest cost marked far below it; badge `exact in 32-bit floats`; second badge `equals reference` (lab-reported). *(captions 10)*
10. The 4-box example returns: `pred = [0, 0, 0, 1, 3]` as arrows. A second row of arrows, `jumps[1]`, is built by applying the first to itself: from 4 one long arrow to 1, from 3 to 0. The descent from post 4 tests each post against the arrows (fixed steps, not one per line); posts 1, 3, 4 light in blue and post 2 stays dark. Everything else is faded to ≤ 0.15 under the closing frame. *(captions 11, 12)*

### Captions (spoken verbatim)
1. Each step of that running minimum can be written as a matrix. The state holds the latest costs, one per box in the window. The matrix has this break point's line costs on top and shifts older costs down. `[lab/knuth-plass/reference.ts:64-70 (state s[to], row 0 line costs, rows r>=1 shift)]`
2. Multiplying is min-plus: add the entries, then keep the smallest. For point three, sixteen plus zero, or one plus nine. The smaller, ten, becomes the new top cost, and the others shift down. `[probe: leafMatrices W=4, M3 row 0 = [16,1,inf,inf], s[2]=[0,9,0,inf] -> s[3]=[10,0,9,0]; lab/knuth-plass/reference.ts:97-105 (minPlusApply)]`
3. Min-plus products are associative, once sums are clamped at the infeasible value. So two steps merge into one matrix of the same size, and any grouping of steps gives the same answer. `[lab/knuth-plass/reference.ts:68-70 ('Clamping every sum at infeasible keeps the product associative, so any grouping of the matrices gives the same states')]`
4. The chain form takes the steps in order. At one thousand twenty-four break points and a window of thirty-two boxes, that is ten thousand two hundred thirty-two layers, each waiting on the one before. `[lab/knuth-plass/README.md:167 (chain, 1,024, 32: 277,068 ops, 10,232 layers); lab/knuth-plass/program.ts:137-142]`
5. The tree form merges neighbours, then merges the merged pairs, in Brent-Kung's prefix network. The same breaks come out in only two hundred thirty layers. `[lab/knuth-plass/README.md:168 (tree: 2,823,382 ops, 230 layers); lab/knuth-plass/program.ts:143-182; lab/knuth-plass/reference.ts:109-125 (brentKungPrefix)]`
6. The price is work. Merging two tiles of thirty-two by thirty-two is expensive. The tree totals two million eight hundred twenty-three thousand operations, about ten times the chain's two hundred seventy-seven thousand. `[lab/knuth-plass/README.md:167-168, :185 ('10.2 times at n = 1,024 and W = 32'); 2,823,382 / 277,068 = 10.19]`
7. On the lab's own executor, the tree is slower than the chain at every size measured, taking one point seven to seven point seven times as long. Fewer layers did not buy speed there. `[lab/knuth-plass/README.md:185 ('takes 1.7 to 7.7 times the chain's µs'); scope: the CPU executor, pre-update times]`
8. A plain loop beats both. For one thousand twenty-four break points it takes about seventy-five microseconds, against two thousand nine hundred twenty-five for the chain. `[lab/knuth-plass/README.md:188 ('75 µs against 2,925 µs at n = 1,024 and W = 32'); probe: reference 71.5 µs, report.ts one time]`
9. Those times are historical. One later commit cut the executor's cost per layer, and another cut compile time and memory. So the chain is probably faster now. The notes did not measure again. `[lab/knuth-plass/README.md:187 (commits de04d25 and a1b3b7b; 'none was measured again'); lab/status.md:51-58]`
10. Every value is a whole number below sixteen million, so thirty-two-bit floats hold it exactly. The lab reports that costs, pointers and breaks equal the plain reference on random paragraphs, ties included. `[lab/knuth-plass/paragraph.ts:27-29 ('within 2^24, where FP32 holds every integer'); lab/status.md:240 ('costs, pointers and breaks equal the reference exactly on random paragraphs with ties'); test file not re-run here (missing pretext)]`
11. Last, reading the answer. Our remembered points are zero, zero, zero, one, three. The circuit doubles them: apply the table to itself, and each entry hops two steps. From point four, one hop lands on point one. `[probe by hand from lab/knuth-plass/program.ts:192-197 (jumps[level] = jumps[level-1] applied to itself): jumps[0]=[0,0,0,1,3], jumps[1]=[0,0,0,0,1]]`
12. A few such tables let every break point check, in a fixed number of steps, whether it lies on the path back from the end. Points one, three and four do. Doubling is the tree idea again: depth that grows slowly. `[lab/knuth-plass/program.ts:199-216 (binary descent, 'chosen' per break point); lab/knuth-plass/README.md:110]`

### On-screen labels

`M3 ⊗ s[2] = s[3]`, `s[2] = [0, 9, 0, inf]`, `M3` top row `[16, 1, inf, inf]`, `s[3] = [10, 0, 9, 0]`, `M3 ⊗ M2` top row `[1, 16, inf, inf]` (all probe-verified, W = 4), `chain 1,024 / 32: 277,068 ops, 10,232 layers`, `tree 1,024 / 32: 2,823,382 ops, 230 layers`, `reference 75 µs`, `chain 2,925 µs`, `tree 22,445 µs`, `1.7 to 7.7×`, `minPlusProduct`, `statesByProductTree`, `brentKungPrefix`, `jumps[0] = [0, 0, 0, 1, 3]`, `jumps[1] = [0, 0, 0, 0, 1]`, `2^24`. The µs bars carry the amber tag `pre-update, README.md:187`. Do not draw a speed claim for the chain-vs-tree layer count.

## Chapter 3: Many At Once

**Thesis:** One paragraph loses to the round trip, a kernel over every entry loses even in a batch, and the dense-rows kernel with uploaded positions wins at a thousand paragraphs: 4.50 ms against 10.4 and 18.2, within a crossover range that moves between sessions.

**Blurb:** One paragraph loses to the round trip; a thousand paragraphs win with the dense-rows kernel and uploaded positions, but only within a shifting range.

### Visual machine

**The Crossover Chart.** A log-log chart: x is paragraphs per batch (1, 10, 100, 1,000), y is milliseconds per evaluation, for 256-break-point paragraphs at W = 32. Lines are drawn in as the narration reaches them, from the real table: the plain loop `knuthPlass`, the typed-array loop `knuthPlassTyped`, the chip with `dense-rows`/positions, the full kernel, and dense-rows with line costs uploaded. A flat floor band near 0.4 ms marks the round trip. A small rack of paragraph strips at left feeds one dispatch gate: one strip at a time shows a lone paragraph, then a growing rack of a thousand. At the crossover the chip's line dips below the loops and a shaded wobble band spans the sessions' range. The persistent object is the chart; late beats add the status stamps.

Camera: drive a `cam` channel with `cameraInterp`; push in on each beat's subject, pull back for comparisons and the payoff; keep y ≳ 630 free.

### Beat sheet
1. Chart axes enter. Left: a paragraph strip and a gate marked `1 dispatch per tree level`; the rack starts to fill. Camera on the gate. *(captions 1)*
2. x = 1: the chip's point sits at 0.39 ms, high above the loops' points (0.016 and 0.008). A floor band `round trip` shades under the chip's line. A tag `up to 4,096 break points: 0.3 to 0.6 ms` appears. The vertical gap at x = 1 is measured with a bracket, 16 µs vs 390 µs; the rack fills to show the trip being shared. *(captions 2, 3)*
3. The full-kernel line (red) plots 0.57, 0.75, 3.43, 42.3; at 1,000 it climbs above both loops (10.4 and 18.2). Camera pushes in on that point; a W×W tile is drawn fully shaded, every entry computing. *(captions 4)*
4. The tile now shows only its top rows shaded; the rows that just shift costs stay pale, shifted copies. The dense-rows line (accent blue) plots 0.39, 0.68, 0.90, 4.50 and bends under the loops at 1,000. *(captions 5)*
5. At x = 1,000 a three-way bracket: 4.50 (chip), 10.4 (typed), 18.2 (plain), with ratio tags `2.3×` and `4.0×`. The loops' lines slope up faster than the chip's. *(captions 6)*
6. A fifth line, amber, 'line costs uploaded': 0.42, 0.88, 4.61, 23.4; it ends above the typed loop at 1,000. Tag: `positions` vs `line costs`. *(captions 7)*
7. A zoom around x = 100: the crossing points are marked and a horizontal wobble band stretches from `<30` to `105` (plain) and `38` to `188` (typed). Six faint session ticks sit inside it. The wobble band breathes (animated between sessions' extremes) and a tag reads `not a stable result`; the round-trip floor band is labelled `0.3 to 0.6 ms`. *(captions 8, 9)*
8. A check-mark ribbon streams under the chart: `0 mismatched` over `24,823,200` and `705,743,280` values; a last tick at `270,532 break points`. *(captions 10)*
9. Camera pulls back; the chart fades to ≤ 0.15. A scope card slides in: `for many paragraphs, yes · for one paragraph, no`, plus `Apple chip, Metal, headless Chrome 153`. An open-items list types in over the quiet stage: `Sklansky's network`, `a GPU mode for the page`, `batches of different lengths`, `the demo's justified cost`, each with a grey `not done` tag. *(captions 11, 12)*
10. Recap strip, left to right, with the Break Ladder icon, the tile, the tree bracket, and the chart's crossover: `running minimum → min-plus matrices → 10,232 → 230 layers → many paragraphs`. Final frame is the strip only. *(captions 13)*

### Captions (spoken verbatim)
1. Back to the question: do many paragraphs at once run faster on the graphics chip? Here the tree runs one level per dispatch, with every paragraph's matrices going through together. `[lab/knuth-plass/README.md:5, :232; lab/knuth-plass/gpu/plan.ts:41-75]`
2. For one paragraph, no. Up to four thousand ninety-six break points, one evaluation takes three tenths to six tenths of a millisecond, mostly the round trip, and a plain loop takes less. `[lab/knuth-plass/README.md:414, :455 ('For one paragraph, no.'; '0.3 to 0.6 ms, most of it the round trip'; closest 0.51 ms vs 303 µs at 4,096)]`
3. At two hundred fifty-six break points and thirty-two boxes, the plain loop needs sixteen microseconds. The chip needs about three hundred ninety. Only a big batch can hide that fixed trip. `[lab/knuth-plass/README.md:337-355, rows W=32, P=1: dense-rows positions 0.39 ms, knuthPlass 0.016 ms]`
4. The first kernel computes every entry of every product. At a thousand paragraphs it takes forty-two milliseconds, losing to the typed-array loop's ten and the plain loop's eighteen. That is too much work. `[lab/knuth-plass/README.md:355 (full kernel 42.3 ms; knuthPlassTyped 10.4; knuthPlass 18.2), :456]`
5. Most rows of those tiles only slide old costs down. The dense-rows kernel multiplies just the rows that hold costs. Same thousand paragraphs, with break positions uploaded: four and a half milliseconds. `[lab/knuth-plass/gpu/plan.ts:22-27 ('dense-rows' stores only rows that hold costs); lab/knuth-plass/README.md:355 (4.50 ms, 3.97 to 4.72); inputs: positions]`
6. That beats both loops, by two point three times for the typed-array loop and four times for the plain loop. The chip's time grows far more slowly than the loops' time as paragraphs are added. `[lab/knuth-plass/README.md:389-412 ('2.3 times at 1,000 paragraphs and W = 32, 4.50 against 10.4 ms ... Against knuthPlass in Bun ... 4.0 times'); repeat note on round trip at README.md:418, :448]`
7. What gets uploaded matters. Send the positions and the chip computes line costs itself, and it wins. Compute line costs in plain code and upload them, and it loses: twenty-three milliseconds against ten. `[lab/knuth-plass/README.md:355 (line costs uploaded: 23.4 vs 10.4); :457, :384]`
8. Where does the win start? Across six Chrome sessions, with positions uploaded: from below thirty to about one hundred five paragraphs against the plain loop, and thirty-eight to one eighty-eight against the typed one. `[lab/knuth-plass/README.md:450 ('from below 30 to about 105 ... and than knuthPlassTyped in Bun from about 38 to 188'); six Chrome sessions per README.md:448]`
9. The lab itself says those counts are not a stable result. Near a hundred paragraphs the time is mostly the round trip, and the round trip changed about two times between sessions. `[lab/knuth-plass/README.md:450, :418 ('aren't a stable result'); lab/knuth-plass/README.md:452 and lab/status.md:240 ('changed about 2 times between sessions')]`
10. The answers are exact. In Chrome, the chip's totals and breaks matched the reference with zero mismatches across two check runs, over seven hundred thirty million values, up to two hundred seventy thousand break points. `[lab/knuth-plass/README.md:301-302 (24,823,200 and 705,743,280 values, 0 mismatched; second run up to 270,532 break points); sum 730,566,480; lab/knuth-plass/gpu/plan.ts:19]`
11. The lab's answer to Cheng: for many paragraphs, yes; for one paragraph, no. The yes holds for one kernel, with positions or widths uploaded, on one Apple chip through Metal in headless Chrome. `[lab/knuth-plass/README.md:453-455 ('For many paragraphs, yes' / 'For one paragraph, no.'); :470 (Apple GPU through Metal in headless Chrome 153)]`
12. Still open, by the notes: Sklansky's prefix network, a graphics mode for the page, batches of different lengths, and the demo's own justified cost. None of them was done. `[lab/knuth-plass/README.md:218, :223-226, :460-470; lab/status.md:261]`
13. So: optimal breaks are a running minimum. As matrix products they form a tree, ten thousand layers shrinking to two hundred thirty. One paragraph loses. Many can win, within a range that shifts. `[lab/knuth-plass/README.md:167-168, :355, :453-455; synthesis]`

### On-screen labels

x axis `paragraphs of 256 break points`, y axis `ms per evaluation (W = 32)`; series (README.md:337-355 medians, mixed sessions; do not interpolate unlabelled points): plain loop `knuthPlass` 0.016, 0.18, 1.90, 18.2; typed loop `knuthPlassTyped` 0.008, 0.10, 1.01, 10.4; `dense-rows, positions` 0.39, 0.68, 0.90, 4.50; `full kernel` 0.57, 0.75, 3.43, 42.3; `dense-rows, line costs` 0.42, 0.88, 4.61, 23.4 (at P = 1, 10, 100, 1,000). Crossover range tags `below 30 to about 105` and `about 38 to 188`; `not a stable result`; `0 mismatched in 730,566,480 values`; `largestGpuBreakCount 270,532`; scope tag `Apple M5 Max · Metal · headless Chrome 153`; `kernel: 'dense-rows'`. The 100-paragraph chip point is from the first sessions; a repeat gave 0.54, so label the dot `session-dependent`.
