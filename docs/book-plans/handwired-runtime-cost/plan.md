# handwired-runtime-cost: "Runtime Cost"

- Subtitle: What a CPU pays to run a handwired circuit: allocation, copying, and layers
- Animal: cheetah. Accent: #e0457b
- Lab: `lab/runtime-cost` of chenglou/handwired @ 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
- Throughline noun: **one evaluation** (one call of a compiled circuit, timed with a stopwatch).
- Lab status, said plainly in ch3: reusable buffers HOLD as an API (CPU only); the layer probe is NARROWED (one machine, stated load, per-layer cause untested); `report.ts` absolute timings are HISTORICAL (ratios from one run only); layer scheduling is PARKED.
- Scope for every number: Bun, CPU, steady state on an unchanged input. Today's numbers (window manager, gallery, coordinate transform, and the 67/77/250 layer figures) are ONE run on an Apple M4 Max at load about 9; README numbers are Apple M5 Max, load about 4, Bun 1.4.3. Put a small scope stamp on screen whenever timings show.
- Re-defined briefly (from book 1): a "layer" = one depth of weighted sums; a "wire" = one value in the circuit. Do not re-teach relu/argmax; this book never needs them.

## Chapter 1: Three ways to run one circuit
Thesis: the same circuit, run three ways, differs mainly in what each call allocates and copies.

**Machine: "three lanes, one call each."** Three horizontal lanes (reference, tensor full array, tensor reusable roots) share a left-hand circuit thumbnail (the window manager as a 130-column skyline, dimmed). Each lane shows memory as stacked slabs that get allocated per call (a slab = a `Float32Array`). A stopwatch ticks per lane at the end. Camera pushes into each lane in turn, then pulls back for the bar race.

Beat sheet:
1. (cap 1) Skyline fades in; a single CPU chip pulses. Label: "arithmetic vs bookkeeping?" Split bar half/half with question marks.
2. (cap 2) Three lanes slide in, each stamped with its name: `reference`, `tensor full array`, `tensor reusable roots`. Camera wide.
3. (cap 3) Push into lane 1. One long slab `Float32Array(sourceSize + operations.length)` allocates; a dot walks the operations one at a time. Slab is discarded (fades) when the call ends.
4. (cap 4) Push into lane 2. A fresh workspace of five slabs (`packedValues`, `input`, `projection`, two gather arrays) allocates, layers sweep left to right, then a full-width slab `Float32Array(program.width)` allocates and every value scatters into it. All discarded.
5. (cap 5) Lane 3. Workspace slabs are drawn once, solid, with a "built once" badge, plus a tiny `outputs` slab (`roots.length`). Per call only layers sweep and the root positions copy out; nothing is allocated (a "0 allocations per call" counter).
6. (cap 6) Second call replays in lane 3: the same output slab flashes, values overwritten, a hand tries to hold the old frame; a "copy it first" chip appears.
7. (cap 7) A gate icon labelled `validateSourceRanges` flashes in all three lanes at the start of each call, same color: shared cost.
8. (cap 8) Harness strip below: counters "200 warm-ups", "7 samples", "median", a rotating order wheel, a checksum equality sign across three results.
9. (cap 9) Circuit stats card reveals: 234 sources, 4,646 live operations, 130 layers, 9,909 stored weights.
10. (cap 10) Stopwatches run in the three lanes at relative speed; bars grow to 149.65 / 49.48 / 42.81 µs. Scope stamp: "one run, M4 Max, load ~9".
11. (cap 11) Ratio chips: reusable vs full 1.16×, reusable vs reference 3.5×. Stage quiets (lanes fade to 0.15) under the chips.

Captions:
1. Handwired turns a program into layers of weighted sums. This lab asks a plain question: when that circuit runs on a CPU, how much of each call goes to allocating and copying memory? [lab/runtime-cost/README.md:9]
2. Three runners get the same circuit. The reference walks operations one at a time. The tensor executor runs layer by layer. The third is that executor with its buffers kept between calls. [README.md:3; lab/runtime-cost/report.ts:22-24]
3. The reference allocates one fresh array on every call, sized for every source cell plus every operation, then evaluates each operation as its own scalar step. [src/runtime/numeric-ui-core.ts:649-652, :1673-1703]
4. The plain tensor executor allocates a whole new workspace on every call, runs the layers, then builds a full array holding every wire and scatters each value into it. [numeric-ui-core.ts:751-754, :1704-1731]
5. The reusable version builds its workspace once, plus one small output array. Each call runs the layers and copies out only the outputs you asked for. [numeric-ui-core.ts:757-762, :769-785]
6. The price is that the next call overwrites that output array. Anyone who wants to keep a frame has to copy it first. [numeric-ui-core.ts:756; README.md:7]
7. All three also check, on every call, that each source value sits inside its declared range. That check is inside every timing, so it is a shared cost, not a difference. [numeric-ui-core.ts:650, :752, :774, :788]
8. The harness is careful. Each method warms up two hundred times, the order rotates between samples, seven samples are taken, and if the checksums of the outputs disagree, the run throws. [report.ts:29-42; README.md:5]
9. The test circuit is the Handwired OS window manager: two hundred thirty-four source cells, four thousand six hundred forty-six live operations, one hundred thirty layers. [README (src/handwiredos/README.md:5-13); report.ts:73; research run 2]
10. On one run, the reference takes about one hundred fifty microseconds per evaluation, the full-array executor about forty-nine, and the reusable one about forty-three. [research run 2: 149.65 / 49.48 / 42.81 µs]
11. So reusable is about one point one six times faster than full array, and three and a half times faster than the reference. One run, one machine, one process. [derived from run 2; README.md:9]

On-screen labels: `reference`, `tensor full array`, `tensor reusable roots`, `evaluateReference`, `evaluateTensorProgram`, `createTensorEvaluator(roots)`, `createTensorWorkspace`, `validateSourceRanges`, `Float32Array(program.width)`, "234 sources · 4,646 live ops · 130 layers · 9,909 weights", "149.65 / 49.48 / 42.81 µs", "1.16×", "3.5×", scope stamp "Bun 1.4.3 · M4 Max · load ≈ 9 · one run".

## Chapter 2: What a layer costs by itself
Thesis: with arithmetic and copy volume held fixed, only the layer count changes, and the clock follows it, at about ten microseconds per thousand layers.

**Machine: "tall tower vs wide floor."** 16,384 small cells (a 128×128 grid, each cell a sum) re-arranged by a morph into three layouts: 64 rows of 256, 1,024 rows of 16, 16,384 rows of 1. A layer-sweep cursor fills rows one at a time while a `packedValues` strip at the bottom fills. A log-x chart (layers vs µs) then plots three points with min–max bars and the slope line.

Beat sheet:
1. (cap 1) Grid of 16,384 cells appears, lit uniformly; a magnifier isolates "one layer" with a question mark.
2. (cap 2) Grid morphs into the 64-row floor, then to 1,024 rows, then to a 16,384-row thin column; counters show 64 / 1,024 / 16,384. Camera zooms out to fit.
3. (cap 3) Back to the 64-row layout: 256 chains highlighted as vertical threads, one thread recolored; then the 16,384 layout with one thread running the full tower.
4. (cap 4) A single sum is clicked: its dependency arrows show depth = 1 + max depth of inputs; `const layerIndex = depth - 1` chip.
5. (cap 5) One layer zoomed: copy-in arrows from `packedValues` into `input`, a row computing `fround(bias + fround(w·x))` with a number ticking, copy-out arrows. Real arithmetic: running sum reaches `(k+1)/1024`.
6. (cap 6) Three identical tally cards slide side by side: "32,768 input reads · 16,384 outputs · 32,768 stored weights" with equals signs between.
7. (cap 7) Three processes shown as three separate boxes (each spawns its own run); a check mark on "output == fround((layerCount + 1) / 1024)".
8. (cap 8) Chart axes appear; three README points plot with bars: 54–55, 64–65, 210–214 µs.
9. (cap 9) The slope line is drawn through them; label "≈ 10 µs per 1,000 layers"; stamp "README: M5 Max · load ≈ 4".
10. (cap 10) Today's three points (67.4, 76.6, 249.9) overlay in a second color with stamp "this run: M4 Max · load ≈ 9"; derived slopes 9.6 and 11.2.
11. (cap 11) The docs sentence about "copying" is quoted, then the three tally cards return with the same numbers; an arrow labelled "what changes: layers only" points to fixed per-layer work. Tag: "inference, not tested".
12. (cap 12) Bar "709 → 250 µs" at 16,384 layers shrinks with the label "indexed copy instead of `set` on a new view". Stage quiets before the chapter ends.

Captions:
1. Now a sharper question: what does a layer cost on its own, apart from the arithmetic inside it? The lab builds a clean experiment to isolate that. [README.md:3; lab/runtime-cost/layers.ts:1-13]
2. Take sixteen thousand three hundred eighty-four sums, each adding two numbers. Chain them into sixty-four layers, or one thousand twenty-four, or sixteen thousand three hundred eighty-four. [layers.ts:12-13, :27]
3. With sixty-four layers, two hundred fifty-six chains run side by side, so every layer is two hundred fifty-six sums wide. With sixteen thousand layers there is one chain, and one sum per layer. [layers.ts:12-13; research run 6 widths 256 / 16 / 1]
4. A layer is just a depth. Each operation sits one level above the deepest thing it reads, and the compiler gives every level its own layer. [numeric-ui-core.ts:617-629, :824]
5. Each layer copies its inputs out of one shared array, does its sparse sums, rounding every product and every partial sum to a thirty-two-bit float, then copies its results back. [numeric-ui-core.ts:1743-1746, :1870-1885, :1773]
6. Across all three shapes the totals are identical: thirty-two thousand seven hundred sixty-eight input reads, sixteen thousand three hundred eighty-four outputs, the same stored weights. [research run 6: 32,768 / 16,384 / 32,768]
7. So with the totals fixed, the time difference tracks the number of layers, not the amount of arithmetic. Each shape runs in its own process, and the answer is checked against its exact value. [layers.ts:8-9, :44-45, :54-57]
8. The readme reports fifty-four to fifty-five microseconds at sixty-four layers, sixty-four to sixty-five at one thousand twenty-four, and two hundred ten to two hundred fourteen at sixteen thousand. [README.md:13]
9. That works out to about ten microseconds for every thousand layers, measured on an Apple M five Max at a load average of about four. [README.md:13; docs/patterns.md:7]
10. Rerun here, on an M four Max at a load of about nine, it gave sixty-seven, seventy-seven, and two hundred fifty. The slope held near ten, but the absolute numbers shifted. [research run 1: 67.4 / 76.6 / 249.9 µs; derived 9.6 and 11.2 per 1,000]
11. The docs blame copying values. But copy volume is the same in all three shapes, so what grows is fixed work per layer. That reading is our inference; the lab doesn't test it. [docs/patterns.md:7; research run 6 and "per-layer cost is not decomposed"]
12. An older executor needed seven hundred nine microseconds for the sixteen thousand layer case. After a change to how outputs are copied, the same probe took two hundred fifty. Layer overhead is real. [lab/status.md:89]

On-screen labels: `operationCount = 16_384`, `layerCounts = [64, 1024, 16_384]`, `roundAffine`, `compileTensorProgram`, `createTensorProgramEvaluator`, `sparseMatmulAddBias`, `packedValues`, `layerIndex = depth - 1`, "256 wide / 16 wide / 1 wide", "32,768 reads · 16,384 outputs · 32,768 weights", chart points 54–55 / 64–65 / 210–214 µs (README) and 67.4 / 76.6 / 249.9 µs (this run), "≈ 10 µs per 1,000 layers", "709 → 250 µs". Counts are shown as counts, not timings.

## Chapter 3: Real circuits, honest limits
Thesis: a real circuit pays the layer toll a hundred or so times, reusable buffers help most on small circuits, and the lab's own claims are narrower than a benchmark headline.

**Machine: "the window manager skyline."** 130 columns whose heights are the real operation counts per layer (401, 214, 90, 94, 52, 10, 7, 15 … 25, 26, 133, 72; median 27; total 4,646). A cursor sweeps it as a layer counter ticks. Later, bar triples for the other circuits and a final status board with four stamped rows.

Beat sheet:
1. (cap 1) Skyline rises left to right, tallest column first (401); cursor sweeps, counter at 130.
2. (cap 2) Camera pushes to the right edge; the 133 spike highlights; a median line at 27 draws; a sum chip 4,646 totals.
3. (cap 3) The 130-tick comb is held beside the 16,384-tick comb from chapter 2; the long one is dimmed; "130 vs 16,384 layer tolls" label.
4. (cap 4) Triple bars for candidate gallery: 18.96 / 4.65 / 3.18 µs (log scale), with "463 ops · 417 live · 60 layers".
5. (cap 5) Triple bars for the coordinate transform (ns): 93 / 120 / 78, plus a short fourth bar `direct scalar JS` at 29 ns. "4 ops · 3 layers".
6. (cap 6) Three ratio chips pop in: 1.53× (coordinate), 1.46× (gallery), 1.16× (window manager), ordered by circuit size.
7. (cap 7) Harness code lines `select(...)` highlighted on two lanes and absent on the third; a root-copy loop icon attaches to two lanes.
8. (cap 8) Two process boxes: shared (42.81 µs) vs standalone (47.47 µs, 39.44–73.70); ranges overlap; label "within noise". README quote chip "can distort".
9. (cap 9) Status board assembles: four rows, each with a stamp: reusable buffers HOLDS (CPU only); layer probe NARROWED; absolute `report.ts` timings HISTORICAL; layer scheduling PARKED.
10. (cap 10) Greyed list of "not measured": events, GPU, compilation, browser frames; scheduling note "latest-legal scheduling increased gathered inputs".
11. (cap 11) Recap: board and skyline fade to ≤ 0.15; three recap tiles in order (lane → tower → skyline) re-trace the book on a clean stage with one closing line.

Captions:
1. Back to a real program. The window manager is neither tall nor wide: its first layer holds four hundred one operations, and by the sixth layer it is down to ten. [research run 6: widths 401, 214, 90, 94, 52, 10, 7, 15]
2. Near the end it swells again to one hundred thirty-three. The median layer holds twenty-six and a half operations, and all the widths add up to four thousand six hundred forty-six. [research run 6: last widths 25, 26, 133, 72; median 26.5; sum 4,646]
3. So the layer toll is paid one hundred thirty times here, not sixteen thousand. That may be part of why the real circuit sits so far from the worst case. [inference from research runs 2 and 6; numeric-ui-core.ts:824]
4. Two smaller circuits show the same ordering. On the candidate gallery, the reference takes nineteen microseconds, the full array four point six five, and reusable three point one eight. [research run 2; report.ts:72]
5. The tiny coordinate transform, four operations in three layers, gains little: ninety-three nanoseconds for the reference, seventy-eight reusable. Plain scalar code beats them all, at twenty-nine. [research run 2; report.ts:68]
6. Reusable beats full array by one point five three times there, one point four six on the gallery, and one point one six on the window manager. In this one run, the smallest circuit gains most. [derived from run 2]
7. One caveat hides in the harness: the reference and full-array runners copy their outputs in an extra loop, and the reusable runner doesn't. Part of the gap is that copy. [report.ts:22-24]
8. The readme warns that timing several programs in one process can distort later timings. A standalone check here landed within noise of the shared run, so we could not confirm it. [README.md:11; research run 5]
9. Status, plainly. Reusable buffers hold as an interface, on the CPU only. The layer probe is narrowed to a local figure at a stated load. The three-way absolute timings are one run, not a standing result. [lab/status.md:160, :230; research "Status"]
10. Not measured: events, graphics processors, compilation, or browser frames. Smarter layer scheduling is parked, because the latest-legal version increased gathered inputs. [README.md:5; lab/status.md:256]
11. To recap: a call can allocate or reuse, a layer costs about ten microseconds per thousand, and real circuits are wide at first, thin in the middle, and swell near the end. Rerun locally before trusting any one ratio. [README.md:9, :13; chapters 1–3]

On-screen labels: "130 layers · median 27 · 4,646 live ops", widths `401 214 90 94 52 10 7 15 … 25 26 133 72`, "candidate gallery 18.96 / 4.65 / 3.18 µs", "coordinate transform 0.093 / 0.120 / 0.078 µs, direct scalar 0.0286 µs", ratio chips `1.53×  1.46×  1.16×`, `select(...)`, "shared process 42.81 µs · standalone 47.47 µs (39.44–73.70)", status stamps HOLDS / NARROWED / HISTORICAL / PARKED, scope stamp "one run · M4 Max · load ≈ 9".

## Cuts (do not say)
- The 35.76 / 35.96 µs figure (status.md:34 is about Standalone Photos, not `report.ts`).
- The gather-lowering "19.6 to 43.5 µs" and "distorted by up to 10 times" (external branch, unverifiable at this pin).
- "Two-operation coordinate transform" (the report prints 4 operations).
- Index-array type selection ("program size": the code picks per array by its maximum value) is omitted.
- Never call the README's 54 / 210 µs figures a result "today"; they are the README's, M5 Max, load about 4.
