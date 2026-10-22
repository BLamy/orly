# reusable-layout

**Question:** Can one small shared network, trained once, predict each photo's preferred width from content and viewport features well enough to transfer to new collections, counts, widths and captions?

**Mechanism:** `lab/reusable-layout/model.ts` `itemFeatures` gives each photo eight numbers: viewport width, aspect ratio, measured caption width, importance, item count, mean aspect, reading position and mean importance. `createRule` builds a 12-unit ReLU (`circuit.reglu`) hidden layer and one output (times 400 px) as a numeric circuit: 121 parameters held in source cells, 133 operations and 5 layers per item. One compiled evaluator runs once per item. Targets come from `lab/reusable-layout/layout.ts` `optimizeInstance`, a per-layout coordinate search: it starts at 224 px, scans `widthChoices` twice, then refines in 16/8/4/2/1 px steps against the authored `preferenceLoss` (image area proportional to importance, a penalty for captions over 3 lines, a small penalty for unused row width). `trainRule` fits the network by squared error with Adam. Ordinary JS `wrapLayout` then flows the rows, and `text.ts` `wrapCaption` breaks captions using Arial 14 widths from `font-metrics.json`.

**Result:** Preference loss on held-out sets (lower is better): 224 px wrapping 0.3727 / 1.0530, per-layout search 0.0229 / 0.1987, shared rule 0.0259-0.0266 / 0.2854-0.3079 (short captions / long captions plus new crops, three seeds). Median CPU time is 1.8 µs for wrapping, 317 µs for search and 18.3 µs for the shared rule (short). Every method has zero missing items, overflow and overlap. `model.json` holds `{version, seed: 17, epochs: 160, parameters[121]}`, and `results.json` is a 3-element array, one per seed (17/41/73).

**Status:** A partial success: the rule "transferred substantially better than ordinary wrapping ... and lost ground on the longer-caption/crop shift." "All three methods reflow abruptly." status.md: "Learns an authored preference objective, not human taste." The next step it names is a held-out long-caption split or better caption features.

**Visual idea:** A row of photos re-flowing as a viewport handle drags from 360 to 1180 px. Each photo has a small dial (the network's width proposal) beside a "search" ghost outline it is chasing. On short captions the dial tracks the ghost closely. When long captions appear, visible gaps open between the dial and the ghost.

**Sources:**
- lab/reusable-layout/README.md:1-73
- lab/reusable-layout/model.ts:1-68
- lab/reusable-layout/layout.ts:1-123
- lab/reusable-layout/model.json, results.json (shape and first entry only)
- lab/status.md:197, 212
- commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
