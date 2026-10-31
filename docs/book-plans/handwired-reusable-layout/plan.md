# Reusable Layout — plan

- **Slug:** handwired-reusable-layout
- **Title:** Reusable Layout
- **Subtitle:** One 121-parameter rule picks every photo's width, taught by a slow search, close on short captions and behind on long ones.
- **Animal:** weaver bird (woven cards in rows). **Accent:** `#d6b82e`
- **Lab:** chenglou/handwired `lab/reusable-layout` @ 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
- **Status to say plainly:** *narrowed* (classification from the research; `lab/status.md` has no such vocabulary). Current, but limited to the authored objective, counts/widths, one photo set; long-caption gap recorded, not fixed. [lab/status.md:208-212]
- **Throughline noun:** the photo's width (a card whose width is set by a dial; the teacher's width is a ghost outline).
- **Shared stage (all chapters):** the SAME six-card scene throughout: `createScene(101, 6, 900, 'long')`, a 900 px viewport frame. Cards (aspect / importance): 0.7/0.524, 2.6/0.496, 2.2/0.270, 2.6/0.296, 2.6/0.476, 1.6/0.918. Widths — shared rule: 161.3, 275.7, 232.7, 254.8, 274.9, 272.4; per-layout search: 171, 290, 233, 258, 287, 286; layout loss: shared 0.13668, search 0.09806, wrapping 0.45070. [research "Visual opportunities" 1; reproduce with the lab code]
- **Scope reminders for the scene:** every result label carries "authored objective · 12 photos · held-out seeds 101–112". Timings carry "one saved run, seed 17". Do not say the study covers 320 px (demo slider only).

---

## Chapter 1 — One Rule for Every Photo

**Thesis:** one 121-parameter network of twelve relu units turns eight numbers about a photo into its width, and the same weights serve every photo.

**Visual machine:** *the width circuit*. A single photo card on the left emits eight feature chips (labelled with names and real values) that flow right into a column of twelve hidden units laid out as the layered circuit (96 products → 12 sums → 12 relu → 12 output products → 1 sum → × 400). The output lands as a pixel number that stretches the card's width. Then the circuit stays put while six cards take turns, and finally the cards flow into rows in a 900 px frame.

**Beat sheet**
1. (caption 1) The 900 px frame appears with six cards at equal 224 px width, rows ragged; a width handle hovers over one card. Camera wide.
2. (2) A small "θ · 121" badge glows; six card outlines each draw a dotted line to the same badge — one rule, many photos.
3. (3) Camera pushes to card 1; eight chips peel off the card and viewport, in order, labelled `viewport/1280`, `aspect/3`, `caption px/1000`, `importance`, `count/16`, `mean aspect/3`, `position`, `mean importance`.
4. (4) A greyed "id" chip tries to enter and bounces off a gate labelled "no stable ID" (`README.md:13`).
5. (5) Chips fan into twelve hidden units; 96 product dots pulse along the wires and collapse into twelve sums (`sum_j`).
6. (6) A relu ramp icon appears on each unit; negative sums flatten to zero (units visibly go dark), positive pass. Twelve outputs merge into one number, then `× 400` pops, becoming "161.3 px" for card 1.
7. (7) Layer counter ticks along the depths `1:96 · 2:12 · 3:12 · 4:12 · 5:1`; totals `121 parameters`, `133 operations`, `5 layers` land.
8. (8) Circuit stays; the other cards slide through it in turn; each width number sets its card's width: 161.3, 275.7, 232.7 …
9. (9) Cards re-flow into rows in the 900 px frame; a "plain web code" label tags the row-break step (not the network).
10. (10) Card order scrambles and ids are rewritten; the final layout does not change (cards return to the same spots).
11. (11) A ghost outline (the teacher's widths) fades in behind each card, with a "?" gap; camera pulls back.

**Captions** (source pointers are plan-only)
1. A gallery has to decide how wide each photo should be, and the right answer shifts with the screen, the caption and how many photos share the page. [lab/reusable-layout/README.md:3]
2. This lab trains one small function to propose that width. The same parameters are reused for every photo and every collection, so there is one rule, not one per page. [lab/reusable-layout/README.md:3]
3. For each photo it reads eight numbers: viewport width, aspect ratio, caption width, importance, photo count, mean aspect ratio, reading position and mean importance. [lab/reusable-layout/model.ts:12-30]
4. Notice what's missing. No photo identifier enters the function, so it has no ID to key on. It only sees numbers that describe the situation. [lab/reusable-layout/README.md:13; model.ts:12-30]
5. Twelve hidden units each take a weighted sum of those eight numbers, plus a bias. That's ninety-six multiplications feeding twelve sums. [lab/reusable-layout/model.ts:36-41; operation count from probe, inferred mapping]
6. Each sum goes through relu, which keeps positive values and zeroes the rest. One more weighted sum of the twelve results, times four hundred, is a width in pixels. [lab/reusable-layout/model.ts:42-47,58; src/runtime/numeric-ui-core.ts:1683-1690]
7. Count the parts: a hundred and twenty-one parameters, a hundred and thirty-three operations, five layers deep. It's the kind of circuit the first book built, now with learned weights. [lab/reusable-layout/README.md:11,13; model.ts:5-10]
8. Try six photos on a nine-hundred-pixel screen. The rule answers about 161 pixels for the narrow portrait, 276 for a wide crop, and 233 for a wide one that matters less. [probe of `createScene(101, 6, 900, 'long')` through model.ts:58; research Visual opportunities 1]
9. The cards take those widths and wrap into rows. Row breaks and caption measuring are ordinary web code. The network only proposes widths. [lab/reusable-layout/layout.ts:32-61; text.ts:14-35; lab/status.md:197]
10. The same twelve units run once per photo, and only the eight inputs change. Shuffle how the photos are stored, or rename their identifiers, and the layout comes out the same. [lab/reusable-layout/model.ts:53-63; layout.test.ts "storage permutation and arbitrary IDs do not change the learned layout"]
11. So here's the question. Can one cheap rule behave like an expensive search that tunes every page separately? First, what is that search trying to please? [lab/reusable-layout/README.md:21-23]

**On-screen labels:** `reusable-layout`; `featureCount = 8`, `hiddenWidth = 12`, `parameterCount = 121` (`model.ts:5-10`); the eight feature names (`model.ts:12-30`); `sum_j = b1_j + Σ θ[j,k]·f_k`; `h_j = ReLU(sum_j)` (ReGLU, `numeric-ui-core.ts:1683`); `y = b_out + Σ w_j·h_j`; `width = y × 400`; `133 ops · depth 1–5 · {1:96, 2:12, 3:12, 4:12, 5:1}`; widths 161.3 / 275.7 / 232.7 / 254.8 / 274.9 / 272.4 with aspect/importance per card; "layout: ordinary code" tag; `padding = gap = 16`, `max width 416`.

---

## Chapter 2 — A Teacher That Searches

**Thesis:** the training targets come from a slow coordinate search over an authored objective; the network is fit to imitate those answers.

**Visual machine:** *the loss landscape of one photo*. A curve of preference loss against width (128 → 416 px) is drawn for the wide card (aspect 2.6, importance 0.496) from the real `preferenceLoss`; a marker walks along it — ten coarse tries, then shrinking steps — and drops to the minimum. Alongside, an evaluations counter runs. Later the curve shrinks to a corner while the six-card scene returns: a dial (student) chases a ghost (teacher) as a training-loss counter falls.

**Beat sheet**
1. (1) Teacher gear icon labelled "per-layout search" beside the six cards; student dial greyed out. Camera wide, then push to one card.
2. (2) A stamp "authored preference, not human taste" lands; crossed-out chips: "human examples", "click logs".
3. (3) The area term draws: a target-area rectangle (22000 × (0.7 + 1.5 × importance)) vs the card's actual `width × imageHeight`; the gap `areaError` shades red.
4. (4) Two more terms stack beside it: a caption box with a 3-line limit line and red `excessLines` beyond it; a row with an unused tail shaded. A sum bar "per item + 0.08 × unused row".
5. (5) The loss-vs-width curve for the wide card draws itself; its area-only minimum (~287 px) is marked, with the target-area math shown in KaTeX.
6. (6) Marker starts at 224; ten ticks (128, 160 … 416) light in sequence, marker jumps to the best; second pass repeats.
7. (7) Step-size ladder 16 → 8 → 4 → 2 → 1: marker wiggles ±step, ghost outline snaps to 290 px on the card.
8. (8) Evaluations counter: `1 + 30n`, three tallies 181 / 361 / 481 for 6 / 12 / 16 cards; "coordinate search — not a guarantee of the global optimum" tag.
9. (9) Camera pulls back; training-set grid appears: 16 seeds × counts 4, 8 × widths 480 / 768 / 1080 → 96 layout thumbnails fill into 576 example dots.
10. (10) Each example dot becomes a (features → target) pair feeding the Chapter-1 circuit; Adam steps shown as weight pulses; epoch counter to 160.
11. (11) Training-loss counter falls 0.0091 → 0.00008; student dial converges onto the ghost for the six cards; "seeded · reproducible".
12. (12) Held-out frame (seeds 101–112, counts 6 and 12, widths 420 / 620 / 900 / 1180) slides in, all unseen; student dial and ghost wait side by side.

**Captions**
1. To train the rule you need right answers. They come from a teacher: a slow search that tunes one layout at a time against a written-down objective. [lab/reusable-layout/README.md:21-23; layout.ts:80-122]
2. That objective is the lab's own invention. The code calls it an authored preference, not a model of human taste. No people, examples or click logs are involved. [lab/reusable-layout/layout.ts:63-64; README.md:21]
3. First preference: a photo's area should follow its importance. Target area is twenty-two thousand square pixels times point seven plus one point five times importance. [lab/reusable-layout/layout.ts:68-69]
4. Second, a caption longer than three lines is penalized, squared. Third, a small charge for unused row width. Photo terms are averaged; the row charge is added once per layout. [lab/reusable-layout/layout.ts:70-73]
5. Take the wide photo with aspect ratio 2.6 and importance about a half. Its target area is about 31,800 square pixels, so area alone asks for roughly 287 pixels of width. [derived from layout.ts:68-69 with importance 0.496; check by computing]
6. Search starts every photo at 224 pixels. Then it tries ten widths, from 128 to 416, and keeps any that lowers the loss. It makes two such passes. [lab/reusable-layout/layout.ts:8,76-78,93]
7. Then it nudges each photo by plus or minus sixteen, eight, four, two and one pixel. Here it settles at 290 pixels, close to that area-only answer. [lab/reusable-layout/layout.ts:102-119; probe: search width 290 for this card]
8. That costs thirty evaluations per photo, plus one: 181 for six photos, 361 for twelve, 481 for sixteen. And it's coordinate search, with no promise of the global best. [lab/reusable-layout/layout.ts:80-122; README.md:23]
9. Now the student learns to imitate. Training uses sixteen collections of four or eight photos at three widths, short captions only: 96 layouts, 576 photo examples. [lab/reusable-layout/study.ts:13-25; README.md:29; layout.test.ts:10]
10. Each example pairs eight features with the search's width. An optimizer called Adam adjusts the 121 parameters over 160 passes, shrinking the squared error. [lab/reusable-layout/model.ts:71-111]
11. For seed 17, the normalized loss falls from about 0.0091 to 0.00008 in under a second of training. Training is seeded, so the saved model reproduces exactly. [results.json seed 17: 0.009091756 → 0.0000799598, 799.4 ms; layout.test.ts "training is reproducible…"]
12. Now the fair test: held-out scenes with new collections, counts and widths. Does a student that never saw them land near its teacher? [lab/reusable-layout/study.ts:27-35]

**On-screen labels:** `preferenceLoss` (`layout.ts:65-74`); `targetArea = 22000 × (0.7 + 1.5·importance)`; `areaError = (w·h − targetArea)/targetArea`; `excessLines = max(0, lines − 3)`; per item `areaError² + 0.035·excessLines²`; `+ 0.08·unusedRowFraction`; `widthChoices 128…416 step 32`; refinement steps `16 · 8 · 4 · 2 · 1`; `evaluations = 1 + 30n` → 181 / 361 / 481; search width 290 px vs shared 275.7 px for the 2.6 card; training `seeds 1–16 · counts 4, 8 · widths 480, 768, 1080 · 96 layouts · 576 examples`; Adam `batch 32 · step 0.008 · 160 epochs`; loss `0.0091 → 0.00008`; held-out `seeds 101–112 · counts 6, 12 · widths 420, 620, 900, 1180`.

---

## Chapter 3 — Close, and Where It Slips

**Thesis:** the shared rule nearly matches its teacher on short captions, loses ground on longer captions and new crops, and every method still reflows abruptly — a narrowed result.

**Visual machine:** *the gauge race*. Three horizontal loss bars (wrapping, search, shared) race on a log-friendly axis for short captions, then the set changes to long captions and new crops and the bars re-run; the shared bar is drawn as a range (three seeds), the gap to search shaded. Then a resize-sweep strip: a width scrubber from 360 → 1180 with three rows of tick marks showing jumps over 10 px.

**Beat sheet**
1. (1) 96 layout thumbnails of the held-out short set; three empty bars labelled wrapping / search / shared.
2. (2) Bars grow to 0.3727 / 0.0229 and a range band 0.0259–0.0266; numbers land.
3. (3) Shared bar shown next to search: small gap shaded; "authored objective · 12 photos" scope tag pins to the corner.
4. (4) Microsecond bars: shared 18 vs search 317 (tagged "one saved run, seed 17"); seed spread ticks 350, 421 appear on search.
5. (5) Cards morph: captions grow longer, crops change shape (aspect 0.55 … 2.6); the bars reset.
6. (6) Long-set bars: wrapping 1.0530, search 0.1987, shared range 0.2854–0.3079; the gap to search shaded in warning colour; "README: lost ground".
7. (7) A caption card shows a single total-width number (the model's input) while the word-by-word widths and the line breaks stay greyed out and unseen by the network.
8. (8) A checklist ticks for all three methods × 192 layouts: missing 0 · text overflow 0 · horizontal overflow 0 · overlap 0.
9. (9) Resize strip appears: scrubber 360 → 1180 sweeping, 1,640 steps per method; tick rows draw as it moves.
10. (10) Counts land: wrapping 6, shared 35, search 53 jumps over 10 px; wrapping's biggest jump (939 px) flares; stamp "all three methods reflow abruptly".
11. (11) "Not shown" list fades in: network necessary? beats tuned formula? human ratings? — each with a question mark; stage otherwise quiet.
12. (12) Status stamp "narrowed" with its three limits (objective, counts and widths, one photo set) beside the recorded long-caption gap.
13. (13) Recap: stage fades to ≤ 0.15 opacity; a single row retraces eight features → 121 parameters → width → ghost and bars as small icons under one line of text, on an opaque panel.

**Captions**
1. The held-out test has two sets of 96 layouts: six or twelve photos at four new widths. Lower preference loss is better. Short captions first. [lab/reusable-layout/study.ts:27-35; README.md:37]
2. Ordinary wrapping at a fixed 224 pixels scores 0.3727. Per-layout search scores 0.0229. The shared rule, across three training seeds, scores 0.0259 to 0.0266. [lab/reusable-layout/README.md:41-43; results.json]
3. So the one-shot rule stays close to its teacher, a little worse, and far better than wrapping. That's measured on the lab's own objective and its twelve photos. [lab/reusable-layout/README.md:45; layout.ts:63-64]
4. It's cheaper too. In one saved run, the shared rule takes a median of 18 microseconds on short captions and search takes 317. Other seeds put search at 350 and 421. [lab/reusable-layout/README.md:49-53; results.json seeds 17/41/73]
5. Now change the test: longer captions and new crops, with aspect ratios from 0.55 to 2.6. The rule never trained on either. [lab/reusable-layout/data.ts:39; study.ts:31]
6. Wrapping scores 1.0530 and search 0.1987. The shared rule scores 0.2854 to 0.3079: far ahead of wrapping, but clearly behind its teacher. The README names this as where it loses ground. [lab/reusable-layout/README.md:43,45]
7. One limit it names: the network gets a caption's total width, not each word's width, so it can't predict exactly where lines break. [lab/reusable-layout/README.md:71]
8. The safety checks hold everywhere. Across all 192 held-out layouts, all three methods keep every photo in reading order, with zero text overflow, zero horizontal overflow and zero overlap. [lab/reusable-layout/README.md:35; layout.test.ts:20-39]
9. Resizing is a separate test. Sweep every pixel width from 360 to 1180, for short and long captions: 1,640 one-pixel steps per method. Count the steps where photos jump more than ten pixels. [lab/reusable-layout/study.ts:90-108; README.md:59]
10. In the saved model, wrapping has 6 such jumps, the shared rule 35, search 53. The worst wrapping step moves photos 939 pixels on average. The README says it plainly: all three methods reflow abruptly. [lab/reusable-layout/README.md:61-67; results.json widthSweep]
11. What isn't shown: that a network is necessary, or that it beats a carefully tuned responsive formula. The 224-pixel wrapper isn't tuned, and no human ratings are involved. [lab/reusable-layout/README.md:47; lab/status.md:212]
12. The status is narrowed. The result is current, but limited to this objective, these counts and widths, and one photo set. The long-caption gap is recorded, not fixed. [lab/status.md:197,208-212; README.md:71 — "narrowed" is the classification in the research, not status.md vocabulary]
13. So: one rule of 121 parameters, taught by a slow search. Close on short captions, behind on long ones, abrupt on resize, and learned sizing inside a fixed flow layout. [lab/status.md:212; README.md:45,67]

**On-screen labels:** Loss table — short: wrapping `0.3727`, search `0.0229`, shared `0.0259–0.0266` (seeds 17 / 41 / 73: 0.026555 / 0.025906 / 0.026123); long + new crops: `1.0530`, `0.1987`, `0.2854–0.3079` (0.285358 / 0.307921 / 0.296864). Timing (one saved run, seed 17, warm serial Bun, short): shared `18.3 µs`, search `317 µs`; search medians other seeds `350`, `421`. Invariants: `192 layouts · missing 0 · textOverflow 0 · horizontalOverflow 0 · overlaps 0`. Sweep: `seed 113 · 12 items · 360–1180 px · 1,640 transitions`; over 10 px: `6 / 35 / 53`; largest mean item movement `939.376 / 369.553 / 359.261 px`. Status stamp `narrowed`. Scope tags on every result.

## Authoring cautions for the scene builder
- Do not claim the model sees photo identity, or that the study covers 320 px.
- Timing bars must be labelled "one saved run" and never drawn as a fresh measurement.
- The derived numbers (area-only ~287 px, target area ~31,800) come from the formula in `layout.ts:68-69` with importance 0.496; recompute at module scope.
- Do not claim the test asserts crop differences (it asserts counts, widths and caption length); the crop shift is real in the data only.
