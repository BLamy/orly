# Caption review: handwired-runtime-cost

Reviewer: fact-check pass on `book.json` captions against the clone pinned at 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (`.orly-work/hw-books/repo`, read-only). `inputs/runtime-cost.md` is the research note; `lab/status.md` line numbers were checked with grep.

Result: 34 captions checked. 25 OK, 9 FIX. Fixes are applied in place in `book.json` and `plan.md`.

Checks run:
- Read every cited source line (`numeric-ui-core.ts`, `lab/runtime-cost/*.ts`, `README.md`, `lab/status.md`, `docs/patterns.md`, `src/handwiredos/README.md`).
- Probe from the clone (`bun`, outside the repo): compiled the window manager and the three 16,384-sum programs. Confirmed 234 sources, 4,646 live ops, 130 layers, 9,909 weights, widths `[401, 214, 90, 94, 52, 10, 7, 15]` and `[25, 26, 133, 72]`, median 26.5 (floor-index median 27), and for all three layer counts 32,768 input reads, 16,384 outputs, 32,768 weights.
- Reran `report.ts` and `layers.ts` today (load ~10, M4 Max). Structure matches. Timings moved: window manager 164.5 / 49.4 / 43.1 µs; gallery 24.8 / 7.1 / 4.9 µs; coordinate 0.091 / 0.117 / 0.075 µs; layer probe 65.1 / 75.3 / 267.3 µs. Orderings and the ~10 µs per 1,000 layers slope still hold. Captions quote the recorded run, so the "one run" framing stays.

| chapter | # | verdict | old → new | source path:line | verbatim quote |
|---|---|---|---|---|---|
| 1 | 1 | FIX | "how much time is arithmetic, and how much is bookkeeping?" → "how much of each call goes to allocating and copying memory?" (source pointer now README.md:9) | lab/runtime-cost/README.md:9 | "The purpose is to measure simple allocation and output-copying costs before pursuing a more elaborate layer scheduler." The lab never splits arithmetic from bookkeeping. |
| 1 | 2 | OK | | lab/runtime-cost/README.md:3 | "compares literal reference execution, the existing tensor executor returning a full wire array, and the tensor executor with reusable buffers returning only requested outputs." |
| 1 | 3 | OK | | src/runtime/numeric-ui-core.ts:1678; :649-652 | `const values = new Float32Array(circuit.sourceSize + circuit.operations.length)` |
| 1 | 4 | OK | | src/runtime/numeric-ui-core.ts:751-754, :1708, :1710 | `const values = new Float32Array(program.width)` |
| 1 | 5 | OK | | src/runtime/numeric-ui-core.ts:770, :772, :776-778 | `const outputs = new Float32Array(program.roots.length)` |
| 1 | 6 | OK | | src/runtime/numeric-ui-core.ts:756 | "The returned output array is reused and overwritten on the next call." |
| 1 | 7 | OK | | src/runtime/numeric-ui-core.ts:650, :752, :774 | `this.validateSourceRanges(source)` (all three paths call it on every evaluation) |
| 1 | 8 | OK | | lab/runtime-cost/report.ts:29, :33, :42 | `for (let warm = 0; warm < 200; warm++) run(source)`; `throw new Error(\`${name}: runtime result disagreement\`)` |
| 1 | 9 | OK | | src/handwiredos/README.md:13 | "The program has 234 source cells, 4,646 live operations in 130 layers and 9,909 stored weights" |
| 1 | 10 | OK | | .orly-work/hw-books/inputs/runtime-cost.md:104-106 (run 2) | `"reference": 149.65083400000003`, `"tensor full array": 49.480334000000305`, `"tensor reusable roots": 42.808915999999954`. Rerun today gave 164.5 / 49.4 / 43.1, so "one run" is the right scope. |
| 1 | 11 | OK | | lab/runtime-cost/README.md:9; run 2 at runtime-cost.md:105-106 | 49.48 / 42.81 = 1.16; 149.65 / 42.81 = 3.50. "rather than treating a single ratio as an architectural guarantee." |
| 2 | 1 | OK | | lab/runtime-cost/layers.ts:1 | "What a layer costs on the CPU executor besides its operations: the same 16,384 sums of two terms" |
| 2 | 2 | OK | | lab/runtime-cost/layers.ts:12-13, :16, :27 | `const operationCount = 16_384`; `const layerCounts = [64, 1024, 16_384]`; `total = circuit.roundAffine([[total, 1], [cell(), 1]])` |
| 2 | 3 | OK | | lab/runtime-cost/layers.ts:16; probe | `const chainCount = operationCount / layerCount`. Probe widths: 256 (64 layers), 16 (1,024), 1 (16,384). |
| 2 | 4 | OK | | src/runtime/numeric-ui-core.ts:625, :824 | `depth: depth + 1,`; `const layerIndex = depth - 1` |
| 2 | 5 | OK | | src/runtime/numeric-ui-core.ts:1746, :1773, :1882 | `input[column] = packedValues[layer.inputIndices[column]!]!`; `packedValues[availableValues + row] = projection[row]!`; `value = Math.fround(value + product)` |
| 2 | 6 | OK | | .orly-work/hw-books/inputs/runtime-cost.md:126-128 (run 6); probe | "64 layers: layers 64, total input reads 32768, total outputs 16384, stored weights 32768". Probe reproduces it for all three shapes. |
| 2 | 7 | FIX | "So any time difference comes from the number of layers, not the amount of arithmetic." → "So with the totals fixed, the time difference tracks the number of layers, not the amount of arithmetic." | lab/runtime-cost/layers.ts:8-9, :44-45 | "Each layer count runs in its own process, since timing programs of different sizes in one process can distort the later timings". The lab shows a correlation with layer count only; the cause is not tested (ch2 caption 11 says so). |
| 2 | 8 | OK | | lab/runtime-cost/README.md:13 | "54 to 55 µs per evaluation in 64 layers, 64 to 65 µs in 1,024 and 210 to 214 µs in 16,384" |
| 2 | 9 | OK | | lab/runtime-cost/README.md:13; docs/patterns.md:7 | "about 10 µs per 1,000 layers"; "at a load average of about 4". (210 − 55) / (16,384 − 64) × 1,000 ≈ 9.5. |
| 2 | 10 | OK | | .orly-work/hw-books/inputs/runtime-cost.md:51-53 (run 1) | "16384 operations in 64 layers: 67.4 µs per evaluation, median of 9 (60.5 to 87.9)". Derived slopes 9.6 and 11.2 per 1,000 layers. Rerun today: 65.1 / 75.3 / 267.3. |
| 2 | 11 | OK | | docs/patterns.md:7; .orly-work/hw-books/inputs/runtime-cost.md:161 | "for copying the values that it reads and the results that it writes"; the inference is labelled as one. |
| 2 | 12 | FIX | "After a change to how outputs are copied, it takes two hundred fifty." → "After a change to how outputs are copied, the same probe took two hundred fifty." | lab/status.md:89 | "16,384 layers went from 709 to 250 µs". That is a historical figure from an earlier measurement, not the current executor. |
| 3 | 1 | FIX | "then widths shrink to ten, seven, and fifteen." → "and by the sixth layer it is down to ten." | .orly-work/hw-books/inputs/runtime-cost.md:122; probe | "first 8 widths [401, 214, 90, 94, 52, 10, 7, 15]". The caption skipped 214, 90, 94, 52. |
| 3 | 2 | FIX | "The median layer holds twenty-seven operations" → "twenty-six and a half operations" (plan source tag: median 27 → 26.5) | lab/status.md:34; probe | "Its layers hold a median of 26.5 operations each". Probe: true median 26.5; the floor-index value 27 is not the median. |
| 3 | 3 | FIX | "Which means the layer toll ... That is why the real circuit sits so far from the worst case." → "So the layer toll ... That may be part of why ..." | src/handwiredos/README.md:13; src/runtime/numeric-ui-core.ts:824 | "The program has 234 source cells, 4,646 live operations in 130 layers and 9,909 stored weights". Nothing measured ties the 130 layers to the gap. The plan marks this as an inference. |
| 3 | 4 | OK | | lab/runtime-cost/report.ts:72; runtime-cost.md:88-90 (run 2) | `"reference": 18.96324999999996`; `"tensor full array": 4.6469999999999905`; `"tensor reusable roots": 3.18312499999999`. Rerun today: 24.8 / 7.1 / 4.9, same ordering. |
| 3 | 5 | OK | | lab/runtime-cost/report.ts:68; runtime-cost.md:63-74 (run 2) | `"operations": 4,` and `"layers": 3,`; `"direct scalar JS": 0.028630409999999957`; `"reference": 0.09305915999999996`; `"tensor reusable roots": 0.07824124999999996` |
| 3 | 6 | FIX | "Which means the saving is largest where the circuit is smallest." → "In this one run, the smallest circuit gains most." | lab/runtime-cost/README.md:9; runtime-cost.md:146-149 (run 2) | "rather than treating a single ratio as an architectural guarantee". Three points from one run do not establish a general rule. |
| 3 | 7 | OK | | lab/runtime-cost/report.ts:22, :24; src/runtime/numeric-ui-core.ts:776-778 | `['reference', select(input => circuit.evaluateReference(input))],`; `['tensor reusable roots', circuit.createTensorEvaluator(roots)],`. The reusable path still copies its roots inside the evaluator (:776-778); what it lacks is the harness's extra loop. The caption's wording is accurate. |
| 3 | 8 | OK | | lab/runtime-cost/README.md:11; .orly-work/hw-books/inputs/runtime-cost.md:118 | "timing several programs in one process can distort later timings"; "window manager alone, reusable roots: median 47.47 µs of 7 (39.44 to 73.70)" |
| 3 | 9 | FIX | "The three-way absolute timings are historical." → "The three-way absolute timings are one run, not a standing result." | lab/status.md:230, :160 | "reuses execution buffers and returns only requested outputs"; "Running code for two numbers of docs/patterns.md". `lab/status.md` never calls the report.ts timings historical. Its only general rule is line 3: "Old measurements remain historical". The caption also presents the same timings as current in ch1 caption 10. |
| 3 | 10 | OK | | lab/runtime-cost/README.md:5; lab/status.md:256 | "not event processing, GPU execution, compilation, or a browser frame benchmark"; "latest-legal scheduling increased gathered inputs. Retry after the circuit shape changes" |
| 3 | 11 | FIX | "real circuits are wide on top and thin below" → "wide at first, thin in the middle, and swell near the end"; "trust ratios over absolute numbers" → "Rerun locally before trusting any one ratio." | lab/runtime-cost/README.md:9; .orly-work/hw-books/inputs/runtime-cost.md:122-124 | "rather than treating a single ratio as an architectural guarantee". The README argues against trusting one ratio, so "trust ratios" had no source. The layer widths swell again to 133 near the end. |

## Visuals in plan.md that show a wrong number (not edited; scene authors)

- **Chapter 3, beat 2** (`plan.md`, "Beat sheet"): "a median line at 27 draws". Should be **26.5** (true median of the 130 layer widths; `lab/status.md:34` says 26.5).
- **Chapter 3, machine description** (`plan.md`, "Machine: the window manager skyline"): "median 27; total 4,646". Should read **median 26.5**.
- **Chapter 3, on-screen labels** (`plan.md`, end of chapter 3): "130 layers · median 27 · 4,646 live ops". Should read **median 26.5**.
- **Chapter 3, beat 9** (status board): the stamp "absolute `report.ts` timings HISTORICAL" no longer matches the caption, which now says "one run, not a standing result". Suggest the stamp read "ONE RUN". This is a label, not a number.

All other numbers in plan.md visuals (ch1 beats 9–11 and labels, ch2 beats 2, 6, 8–10, 12 and labels, ch3 beats 1, 3–6, 8 and labels) match the sources.
