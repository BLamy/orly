# Data Adapter — plan

- **Slug:** handwired-data-adapter · **Title:** Data Adapter
- **Subtitle:** Eight rectangle lookups recovered by searching 868 tiny programs
- **Animal:** beaver (a builder that fits stored pieces into a dam) · **Accent:** `#b5653a` (copper-brown; siblings use teal/amber)
- **Lab:** `lab/data-adapter` @ 4ea7fcb27ebe93acf49b9f29a93e162b975bad46. Status: **holds within its scope** (exact, reproducible, 8 tests pass; a search result, not a learning result). Next comparison: **open / not run**.
- **Throughline noun:** the lookup (a request "where is identifier 20?").
- Source paths are relative to the clone `lab/data-adapter/` unless stated. Pointers appear here only, never in captions. Numbers are from the research file or `report.ts`; "derived" ones are from the research's survivor trace (997 matches `report.ts`) or plain arithmetic.
- Re-defined briefly (not re-taught): relu (ch1 cap 5-6), one-hot (ch1 cap 12), argmax appears only in the open item (ch3 cap 13).
- Scene look: house look of `handwired/chapter-1.tsx` and `chapter-4.tsx`. Camera channel with `cameraInterp` in each chapter. Keep y ≳ 630 free.
- Pronounce "x" in "origin x" as the letter. No 12-slot rack of unreal data: use the README example only.

---

## Chapter 1 — The Lookup Circuit

**Thesis:** "Find the rectangle with this identifier" becomes arithmetic: a relu tent per slot, an active bit, a sum.

**Visual machine: the slot rack.** A rack of 12 slot cards (3 active rows in storage order, e.g. slots 0, 3, 7 holding ids 30, 10, 20; the rest empty/dim; plus one inactive decoy card repeating id 20 with misleading geometry for beat 6). Above the rack a shared id axis with a tent curve (`FunctionPlot`) that re-centres on the query marker `selectedID`. Under each card a bit gauge; below the rack a count/found readout and a field-read summation bar. Camera pushes onto one slot for the tent, pulls back for the sum.

**Beat sheet**
1. (cap 1-2) Title stage: a stack of rectangles and a query tag "id 20"; a small badge "no training: search only" stamps on at cap 2. Camera wide.
2. (cap 3) Rack builds: 12 slot cards slide in; each card's six cells (`active, id, left, top, width, height`) label themselves on the first card; camera pushes in.
3. (cap 4) The three active rows (10/20/30 with their geometry from the README table) drop into non-sorted slots; the four extra inputs `selectedID, originX, originY, scale` appear on a left rail (selectedID=20, originX=4, scale=2).
4. (cap 5) On slot with id 10: the difference `d = id − selectedID` appears; it splits into two relu ramps `ReLU(d)` and `ReLU(−d)` drawn as two small ramp plots that sum to `|d|`.
5. (cap 6) The tent `ReLU(1 − |d|)` is drawn over the id axis; integer ticks sit at the foot; the tent touches 1 only at distance 0. Equation in KaTeX.
6. (cap 7) Query marker slides to 20: slot 20's gauge fills to 1; 10 and 30 sit at distance 10, gauges 0.
7. (cap 8) Decoy inactive card (id 20, left 99 say "misleading") also gets tent=1; then the multiply-by-active gate closes over it (product bit 0). Highlight `active · tent`.
8. (cap 9) Gauges feed `count = Σ bit` (=1) then `found = count − ReLU(count − 1)` (=1).
9. (cap 10) Each card's `left` flows through its bit into a sum bar: 7×0, 40×1, −6×0 → 40. Value readout "left = 40".
10. (cap 11) Query slides to 99: all gauges 0, count 0, found 0, value gated to 0 although `originX = 4`; readout `{found: 0, value: 0}`.
11. (cap 12) A duplicate-active-id attempt bounces off an input gate labelled `active IDs must be unique`; the bit gauges group into a bracket tagged `assumeOneHot(bits, true)`.
12. (cap 13) Pull back; rack dims to ≤0.15; three chips (row tests, field, steps) hover for ch2.

**Captions (book.json order)**
1. Programs look things up constantly… circuit of weighted sums and relu. `[README.md:3,5]`
2. Nothing here is trained… keeps the ones whose answers match. `[README.md:3,31]`
3. The circuit has twelve storage slots… `[README.md:9; experiment.ts:7,26-52]`
4. Three rows are active, ids ten, twenty, thirty… `[README.md:9,13-19; experiment.ts:7]`
5. Each slot needs a bit… two relu ramps… `[experiment.ts:129-137]`
6. Then relu of one minus that distance makes a tent… exact. `[experiment.ts:132-137; README.md:74]`
7. Ask for twenty… tents are zero. `[experiment.ts:132-137; rule applied by hand to README.md:13-19]`
8. Now a trap: an inactive row… `[README.md:11; experiment.ts:127-142]`
9. Add the bits to get a count… `[experiment.ts:153-155]`
10. To read a field… left edge comes out as forty. `[experiment.ts:157-160; README.md:21]`
11. Ask for ninety-nine instead… `[README.md:11,21; experiment.ts:59,184]`
12. Two active rows may never share an identifier… `[experiment.ts:42,147-151; README.md:11,78]`
13. That is the machinery every candidate is built from… `[experiment.ts:121-162,81-101]`

**On-screen labels:** `active`, `id`, `left`, `top`, `width`, `height`; `selectedID = 20`, `originX = 4`, `originY`, `scale = 2`; `d = id − selectedID`; `|d| = ReLU(d) + ReLU(−d)`; `bit = ReLU(1 − |d|)`; `bit × active`; `count = Σ bit`; `found = count − ReLU(count − 1)`; `read(left) = Σ bit·left = 40`; `{found: 0, value: 0}` for id 99; `active IDs must be unique`; `circuit.assumeOneHot(bits, true)`. Rows: (10: 7,3,5,9) (20: 40,10,12,8) (30: −6,24,20,4).

---

## Chapter 2 — 868 Programs, Twelve Scenes

**Thesis:** A tiny vocabulary, exhaustive search and twelve scenes leave one program per task; the controls show both row tests are required.

**Visual machine: the program wall.** An 868-cell grid (a 7×4 block grid; each block is a 31-cell strip) glowing as candidate cards. Twelve scene tokens sit in a row at the bottom. Each scene sweeps the wall; cards that no longer match any task grey out; a survivor-count curve (`Axes` + line) climbs down beside it; eight task lanes on the right each show their survivor count (a small bar per task).

**Beat sheet**
1. (cap 1) Stage: the wall is empty frame with three headings (rows / field / steps) and eight task chips on the right.
2. (cap 2) Left column: seven predicate-subset chips lit (`[]`, `[active]`, `[active,same-id]`, `[active,first-slot]`, `[same-id]`, `[same-id,first-slot]`, `[first-slot]`).
3. (cap 3) Four field chips (left, top, width, height) fan out from each subset.
4. (cap 4) Five step chips; the 31 step sequences fan: 1 (no steps) + 5 + 25. Counter `1 + 5 + 25 = 31`.
5. (cap 5) The wall fills: 868 cells flood in; KaTeX `7 × 4 × 31 = 868`; camera pulls back to the full wall.
6. (cap 6) Eight target chips light, each tagged "plain find + separate float arithmetic"; a wall between them and the circuits.
7. (cap 7) Twelve scene tokens slide in (small card with 1-3 rows, a "present/absent" flag).
8. (cap 8) Scene 1 sweeps: wall dims to 34 lit; per-task bars show `[2,4,8,2,4,4,4,6]` (order: left, top, right, bottom, local-left, local-top, scaled-right, scaled-bottom). Curve point 34.
9. (cap 9) Scene 2 sweeps: bars become `[1,2,3,1,1,1,1,1]`; six bars highlight "1".
10. (cap 10) Scenes 3-12 tick; curve reads 11 (scenes 3-6), 8 from scene 7, flat after; eight cells remain lit with a bracket "scenes 8-12 remove nothing".
11. (cap 11) Early-rejection overlay: each card runs a short scene strip and drops out as soon as nothing matches; counter `997` vs ghost `868 × 12 = 10,416`. Footnote chip "~60 ms on the author's machine (README); not a benchmark".
12. (cap 12) Camera pushes to the eight survivor cards, each shown as `active & same-id -> read left -> add-width` etc. (exact strings below).
13. (cap 13) Two control runs: wall rebuilt without `active` → zero lit, without `same-id` → zero lit; counters `fitsWithoutActivePredicate: 0`, `fitsWithoutIDPredicate: 0`. End: wall quiet, scope tag "this vocabulary · these eight authored targets".

**Captions**
1. Given example scenes… `[README.md:3,23-29]`
2. Row tests come from three… `[README.md:27; experiment.ts:9-10,81-101]`
3. The field read is one of four… `[README.md:28; experiment.ts:81-101]`
4. Then zero, one, or two steps… thirty-one sequences. `[README.md:29; experiment.test.ts:14]`
5. Seven times four times thirty-one… `[README.md:31; experiment.test.ts:14; experiment.ts:204-226]`
6. Eight goals… `[README.md:33,35-44; experiment.ts:57-79]`
7. Training is twelve scenes… `[README.md:66; experiment.ts:255-262]`
8. After the first scene, thirty-four… `[derived survivor trace in research data-adapter.md, "Derived survivor trace"; consistent with report.ts]`
9. After the second scene… `[derived trace, same]`
10. By the seventh scene exactly eight programs remain… `[derived trace; scene order experiment.ts:255-262]`
11. Candidates are dropped once… 997 vs 10,416 (= 868 × 12, arithmetic) `[experiment.ts:219; README.md:66; report.ts "circuitEvaluations": 997]`
12. Every survivor starts with the same selector… `[report.ts "solutions"; README.md:35-46]`
13. Controls… `[report.ts "controls"; README.md:46]`

**On-screen labels (exact):** `7 × 4 × 31 = 868`; `1 + 5 + 25`; predicates `active`, `same-id`, `first-slot`; fields `left, top, width, height`; steps `add-width, add-height, subtract-origin-x, subtract-origin-y, multiply-scale`; tasks `left, top, right, bottom, local-left, local-top, scaled-right, scaled-bottom`; survivor strings:
`left: active & same-id -> read left`; `top: active & same-id -> read top`; `right: … read left -> add-width`; `bottom: … read top -> add-height`; `local-left: … read left -> subtract-origin-x -> multiply-scale`; `local-top: … read top -> subtract-origin-y -> multiply-scale`; `scaled-right: … read left -> add-width -> multiply-scale`; `scaled-bottom: … read top -> add-height -> multiply-scale`. Curve `868 → 34 → 11 → 11 → 11 → 11 → 11 → 8 → 8 …` (first point after scene 1 is 34; 868 is the start). `997 circuit evaluations`.

---

## Chapter 3 — What the Check Shows

**Thesis:** The eight programs are exact on 438 held-out checks (216 genuinely new scenes); the reuse claim was retracted by the lab; the lab holds within a narrow scope and its next step is open.

**Visual machine: the ledger wall.** One grid of 438 tiles that persists: first coloured 216 generated / 216 reversed / 6 boundary; then a comparison counter ticking to 14,016; the six boundary tiles lift out onto a float ruler; the tiles dim and a selector-with-four-reads diagram appears; finally the tiles regroup under a status stamp.

**Beat sheet**
1. (cap 1) 438 tiles appear grey; a single wave "unseen" label.
2. (cap 2) 216 tiles turn teal and are labelled seeds 1001–1024, counts `0,4,6,9,12`, fractional geometry/scale (small tile glyphs show decimals).
3. (cap 3) Another 216 tiles (reversed-storage twins: each shows a card strip flipped) then the 6 boundary tiles light: ids `0`, `65535`, `1+2^-24` rounding, `2^-149`, signed zero, limits. Counter `438`.
4. (cap 4) Eight program badges sweep every tile; counter climbs to `14,016` (438 × 8 tasks × 2 outputs × 2 paths).
5. (cap 5) Only 216 tiles keep full colour; the rest fade with "same draws, run again" tag.
6. (cap 6) Camera pushes on the six boundary tiles; a 32-bit float chip (`Float32Array`) with each op wrapped in `fround`.
7. (cap 7) Float ruler near 3: `fround(fround(1 + 2^-24) × 3) = 3` vs `fround((1 + 2^-24) × 3) = 3.000000238418579`; one-ulp step `2^-22` marked.
8. (cap 8) Chip `roundAffine` locks the ruler's rounding blocks in order.
9. (cap 9) Tiles fade; selector box `active AND same-id` with four reads (left, top, width, height) fans to 8 outputs.
10. (cap 10) Two bars: `joint unfactored: 200 operations`, `factored: 200 operations`; third bar `eight separate: 1,118` drawn hollow with a strike "not a saving".
11. (cap 11) Limits list slides in as five locks: `no weights`, `no neural guide`, `capacity 12`, `no strings / joins`, `(left + width − originX) × scale needs 3 steps`.
12. (cap 12) Status stamp `holds within its scope`; chips `8 tests pass`, `authored predicates + extraction rule`.
13. (cap 13) Ghosted box `soft attention → argmax` beside the exact baseline, tagged `proposed · not run`; camera pulls back to a quiet frame.

**Captions**
1. A recovered program only counts… `[README.md:68-70]`
2. The held-out set has two hundred sixteen… `[README.md:68; experiment.ts:265-276]`
3. Each scene is also run reversed… 438 `[README.md:68; experiment.ts:278-304]`
4. All eight programs match… fourteen thousand and sixteen `[README.md:5,70; report.ts "allFitComparisons": 14016; experiment.ts:306-329]`
5. Those are comparisons, not independent samples… `[README.md:70; research contradiction 1: 216 seeded draws]`
6. Numbers are thirty-two-bit floats… `[README.md:76; experiment.ts:63-76]`
7. Add about one part in sixteen million… `[README.md:76; experiment.test.ts:74; checked: 3 vs 3.000000238418579]`
8. So the circuit keeps its rounding steps… `[README.md:76; src/runtime/numeric-ui-core.ts:414-421]`
9. Reuse: all eight programs share one selector… `[README.md:58-60; experiment.ts:168-175,193-202; report.ts "reuse": gatherReads 4]`
10. But naming that function saves nothing… `[README.md:62; experiment.test.ts:46-47; report.ts "reuse": 200 / 200 / 1118; numeric-ui-core.ts:614]`
11. The limits are plain… `[README.md:3,60,79-80; report.ts "neuralGuide"]`
12. Status: it holds within its scope… `[lab/status.md:199; bun test ./lab/data-adapter: 8 pass]`
13. Still open… `[lab/status.md:244; ui-exploration/guide/review-and-decisions.md:250-254 (a recommendation, not a recorded choice)]`

**On-screen labels (exact):** `438 = 216 + 216 + 6`; `seeds 1001-1024`; `counts 0, 4, 6, 9, 12`; `14,016 comparisons = 438 × 8 × 2 × 2`; `fround(fround(1 + 2^-24) * 3) = 3`; `fround((1 + 2^-24) * 3) = 3.000000238418579`; `roundAffine`; `jointUnfactored: 200 operations, 14 layers`; `factored: 200 operations, 14 layers`; `separateOperations: 1118`; `gatherReads: 4`; `capacity: 12`; `neuralGuide: not implemented`; `lab/status.md: Data adapters — Exact search over 868 programs`.
Do NOT show a machine time without the "author's machine" caveat; do NOT show 1,118 vs 200 as a payoff.

---

## Claim → source (for sources.json)
All claims are listed per caption above. Repo: `chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46`, paths under `lab/data-adapter/` (README.md, experiment.ts, experiment.test.ts, report.ts), plus `lab/status.md`, `src/runtime/numeric-ui-core.ts`, `ui-exploration/guide/review-and-decisions.md`.
Verbatim quotes available: README.md:3 "Nothing trains neural weights here."; README.md:46 "The recovered common lookup is **active AND same ID**."; README.md:62 "There is also no extra graph-size saving from naming the function."; README.md:70 "these are implementation comparisons, not additional independent samples."
