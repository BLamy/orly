# Plan: Generative Fields (handwired-generative-fields)

- Title: **Generative Fields**. Subtitle: One fixed layout program, seventy-two numbers, and what searching, climbing and repairing really showed.
- Animal: **chameleon** (one body, many colors: one program, many layouts). Accent: `#7fb33a`.
- Pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46, `lab/generative-fields`. Source pointers are relative to the repo root.
- Throughline noun: **the field vector** (72 numbers), chapters 1-3; the slots are "slots" or "items", never "photos".
- Status said plainly: the mechanisms **hold** as reproduced counts (19 tests pass, 2 skip without PRETEXT_SRC); the July results are **narrowed** by the September corrections; the lab is best read as **historical** (`lab/status.md` gives no tag, only limits, so the book says so); next steps are **open**.
- Research: `.orly-work/hw-books/inputs/generative-fields.md`. Fixes taken from it and from `caption-review.md`: "photos" becomes slots; the July 1,408 figure is labeled July; operation count is the printed 8,421 (README's 8,385 is stale); gradient numbers are today's printed run, not the README's; the collapse is a hand-built two-slot test layout, not a re-run of ascent.
- Re-defined briefly, not re-taught: relu, one-hot, argmax, circuit (book "Handwired" covers the rest). Only relu is needed here, in chapter 1 (the cap on span).
- Model-side note for the scene author: do not show hardware timings as guarantees; the 265 ms and 236 ms figures are this machine's.

---

## Chapter 1: Seventy-Two Numbers, One Program
Thesis: One compiled circuit, 72 numeric fields, five layout families, zero recompilation.

**Visual machine: "the dial bank and the viewport."** Left: a strip of 72 cells, grouped as 8 global knobs then 16 columns of 4 (importance, orderKey, visibility, heightPreference), each cell a small vertical bar showing its 0..1 value. Right: an 800 px viewport frame with 16 numbered slot cards. Changing bars changes the cards; a counter 'new operations: 0' stays pinned.

Beat sheet (captions by number)
1. A blank viewport and the question 'who decides?'; the 72-cell strip slides in, cells empty. (1)
2. Strip groups label themselves: 8 knobs (paddingX, paddingY, gapX, gapY, baseSpan, spanFromImportance, baseHeight, heightFromImportance), then 16 slot columns; viewportWidth and viewportHeight sit to the side as 'context'. (2)
3. Camera pushes on slot 3's four cells; they fill with values and a card pops in the viewport. (3)
4. Formula chips type in over one slot: span = raw − relu(raw − 1) with a small hinge plot showing the cap at 1; height = (baseHeight + heightFromImportance·importance)·(0.5 + heightPreference); the card stretches to match. (4)
5. Sixteen order-key bars sort into a rank line; a pair with equal keys is highlighted, the lower slot number jumps ahead. (5)
6. A cursor runs along row one; the slot whose right edge passes 1 + wrapSlack drops to row two; row heights snap to the tallest card. (6)
7. Importance of slot 2 rises in the strip; its card widens until it fills the row and the neighbors drop below. (7)
8. Camera pulls back; five presets cycle (grid, heroRail, mosaic, list, filmstrip), cells in the strip morph, cards reflow; the list preset shows only six cards, the rest hidden below the frame. (8, 9)
9. Counter 'new operations: 0' ticks beside a 'same tensor program' badge. Circuit stats card: 8421 operations, 201 layers, 336 boolean. (9, 10)
10. A five-row scoreboard fills with fitness numbers; the list row shows 'visible 6'. The strip fades to 0.15 and a single recap line lands on an opaque panel. (11, 12)

Captions
1. A page needs a layout: which items are big, which come first, where each row breaks. This lab asks whether one fixed circuit can decide all of that, steered by nothing but numbers. [lab/generative-fields/README.md:13]
2. Those numbers are seventy-two generative fields: eight global knobs, plus four fields for each of sixteen slots. The viewport size is held aside as context. [lab/generative-fields/README.md:19; lab/generative-fields/fields.ts:18,20-30]
3. Each slot has an importance, an order key, a visibility and a height preference, all from zero to one. What makes one slot differ from another lives only in these cells, never in a code branch. [lab/generative-fields/README.md:17; lab/generative-fields/fields.ts:38-43]
4. Importance becomes size. Span is a base span plus importance times a coefficient, capped at one full row by a relu trick. Height follows the same pattern, scaled by the height preference. [lab/generative-fields/flow-layout.ts:193-211; lab/generative-fields/README.md:21]
5. Order keys decide who goes first. The circuit compares every pair of keys, and when two keys are exactly equal, the lower slot number wins. [lab/generative-fields/flow-layout.ts:106-116]
6. Then the slots flow like words in a paragraph. A slot that would pass the right edge starts a new row, and each row is as tall as its tallest member. [lab/generative-fields/flow-layout.ts:263-271; lab/generative-fields/README.md:21]
7. A hero is just an importance peak. One slot with a big importance gets a wide span, and it crowds the others out of its row. [lab/generative-fields/README.md:21]
8. Now change only numbers. The same sixteen slots reshape into a uniform grid, then a hero with a rail, a mosaic, a list and a filmstrip. [lab/generative-fields/README.md:13; printed family table (experiments.ts)]
9. Between those five families the code reports zero new operations. It is the same compiled program every time, and only the source cells differ. [printed run: 'recompilations between families: 0 new operations'; lab/generative-fields/README.md:13]
10. The program is not small: the code prints eight thousand four hundred twenty-one operations in two hundred one layers. The flow costs depth, because each wrap decision feeds the next. [printed run: operations 8421, layers 201 (README.md:31 still says 8,385 / 147: stale); lab/generative-fields/flow-layout.ts]
11. Every family gets a fitness score. The grid scores point eight nine four, the mosaic point eight two three. The list shows six of sixteen slots: its visibility hides the rest, since sixteen rows would overflow. [printed family table; lab/generative-fields/README.md:129]
12. So the first claim is narrow and solid: one program, five layouts, set only by numbers. Whether those numbers can be found automatically, and whether they are any good, comes next. [synthesis (no new claim)]

On-screen labels: `slotCount = 16`, `72 = 8 + 16×4`, `importance`, `orderKey`, `visibility`, `heightPreference`, `span = raw − relu(raw − 1)`, `height = (baseHeight + heightFromImportance·importance)·(0.5 + heightPreference)`, `wrap when cursor + span ≥ 1 + wrapSlack`, `ties: lower slot index wins`, `grid 0.894 · heroRail 0.863 · mosaic 0.823 · list 0.826 (visible 6) · filmstrip 0.870`, `operations 8421 (4003 affine, 4082 reglu, 336 boolean) · layers 201`, `recompilations between families: 0`

---

## Chapter 2: Scored, Searched, Climbed
Thesis: The circuit scores itself, and search and gradient both find valid layouts that disagree about taste.

**Visual machine: "four thousand tries and twelve climbs."** Left: a 40×100 dot field, one dot per sampled field vector, lit when the circuit's validBit is 1. Right: a score axis from 0.6 to 1.0 with a dotted line at the search best 0.875. Later twelve trails climb that axis over 150 steps.

Beat sheet (captions by number)
1. Two output lights appear on a layout card: validBit (0/1) and violationDepth (px). (1)
2. Three rule chips: overlap, containment, minimum size; a half-pixel slack band drawn on a slot edge. (2)
3. A tiny cursor moving only right, spans capped at 1: a ghosted overlap attempt cannot occur; counter 'overlap: 0'. (3)
4. 4000 dots fill the grid in waves, seed 0x5EED; labeled 'search'. (4)
5. Valid dots light: 1,078 (26.9%); the rest dim with category counters containment 2,886 and minimum size 44. (5)
6. A stacked weight bar slides in (fill 0.25, verticalFit 0.2, importanceMatch 0.15, balanceX 0.1, sizeComfort 0.1, rowEvenness 0.05, contentRichness 0.15); a scale shows valid above invalid. (6)
7. The dotted line at 0.875 snaps in at the top sample; '265 ms'. (7)
8. Dots fade; the score axis takes over; twelve start points appear at scattered heights; a loss formula chip: −fitness + 0.002·violationDepth. (8)
9. A bit-node on a wire has a flat step plot; a replacement slope 'identity' draws over it; badge 'straight-through'. (9)
10. Small gauge: 173 vs 120, caption 'phantom gradient'. (10)
11. Twelve trails climb over 150 steps; all end in the valid color; markers at 0.849, 0.888, 0.919 above the 0.875 line. (11)
12. The best trail's layout opens: only six cards visible out of sixteen; a ghost two-slab layout with 'old weights: 1.000'. (12)
13. contentRichness cap line at 10 slots; two arrows labelled 'search' and 'gradient' point at different layouts; text 'same number, different taste'. (13)

Captions
1. The circuit grades its own work. It outputs a validity bit that is exactly one or zero, plus a depth in pixels saying how badly a layout breaks the rules. [lab/generative-fields/flow-layout.ts:433-436; lab/generative-fields/README.md (Validity is self-scored)]
2. Three rules are checked: no two visible slots overlap, nothing runs past the bottom or right edge, and nothing is too small. The right edge allows a small wrap margin, and a half-pixel tolerance applies. [lab/generative-fields/flow-layout.ts:49; lab/generative-fields/README.md (Validity is self-scored)]
3. Sideways overlap is impossible by construction, since the cursor only moves forward and spans are capped. Overlap never occurred in four thousand samples; only a crafted triple of almost-equal keys can cause it. [lab/generative-fields/README.md:37; lab/generative-fields/generation.test.ts:20]
4. The first way to find a layout is search. Draw four thousand random field vectors, and test each one. [lab/generative-fields/experiments.ts:26; lab/generative-fields/search.ts:82]
5. Only one thousand seventy-eight are valid, about twenty-seven percent. The most common failure is spilling out of the viewport: two thousand eight hundred eighty-six samples. [lab/generative-fields/generation.test.ts:17,20-22]
6. To rank the valid ones, seven weighted terms add up: fill, vertical fit, importance match, balance, size comfort, row evenness and content richness. Any valid layout beats any invalid one. [lab/generative-fields/fitness.ts:30-37, 358-364]
7. Search's best layout scores point eight seven five. The whole four-thousand-sample search took about a quarter second on this machine. [printed run (4000 samples in 265ms); lab/generative-fields/generation.test.ts:24]
8. The second way is to slide uphill. Gradient ascent minimizes minus fitness plus a small penalty on violation depth, taking one hundred fifty steps from each of twelve random starts. [lab/generative-fields/optimize.ts:148-190; lab/generative-fields/experiments.ts:28-33]
9. But decisions in this circuit are bits, and bits have no slope. So the backward pass fakes one, a straight-through estimate: forward values stay exact, and the derivative through a decision is set to one. [lab/generative-fields/ste-backprop.ts:3-10]
10. That fake slope is biased. On one probe the readme measured one hundred seventy-three where the true local slope was one hundred twenty, so the magnitudes are not derivatives. [lab/generative-fields/README.md:80,126]
11. In today's run, all twelve climbs end valid, with a best of point nine one nine, a median of point eight eight eight, and a worst of point eight four nine. Search's best was point eight seven five. [printed run (best 0.919, median 0.888, worst 0.849; README says 0.922/0.887/0.865); lab/generative-fields/generation.test.ts:62-66]
12. Yet the best climbed layout shows only six slots out of sixteen. Fitness can be gamed: with the richness term removed, a hand-built layout with just two visible slots scored a perfect one. [printed run 'best ascent layout: visible 6'; lab/generative-fields/generation.test.ts:75, 78-105]
13. The richness term now rewards up to ten visible slots, but climbing still prefers six. Search and gradient optimize the same number and disagree about taste, so the fitness function is the bottleneck. [lab/generative-fields/fitness.ts:28,190; lab/generative-fields/README.md:127]

On-screen labels: `validBit`, `violationDepth`, `violationSlackPixels = 0.5`, `sampleCount: 4000`, `seed: 0x5EED`, `valid 1078 (26.9%)`, `overlap 0 · containment 2886 · minimum size 44`, `weights fill 0.25 / verticalFit 0.2 / importanceMatch 0.15 / balanceX 0.1 / sizeComfort 0.1 / rowEvenness 0.05 / contentRichness 0.15`, `contentRichness = min(1, visibleCount / 10)`, `search top 0.875 (sample 1731, visible 9)`, `startCount: 12 · steps: 150 · learningRate: 0.02`, `loss = −fitness + 0.002·violationDepth`, `backpropagateStraightThrough`, `173 vs 120`, `best 0.919 · median 0.888 · worst 0.849 · visible 6`, `ended valid: 12/12`, `README (July) 0.922 / 0.887 / 0.865 shown as a small struck-through note`

---

## Chapter 3: The Path Between
Thesis: Repair makes every interpolated point valid, but it can hide content, so the lab is historical and narrowed.

**Visual machine: "the hundred-and-one-tick path."** A horizontal ribbon of 101 ticks between layout A and layout B, each tick colored valid or broken, with a mini viewport above that morphs along the ribbon, and a visible-slot counter beneath.

Beat sheet (captions by number)
1. 21 mini viewports in a row for the hero migration: slot 2's card shrinks, slot 11's grows; green ticks under all of them. (1, 2, 3)
2. Wipe to a fresh ribbon: 101 ticks for one random pair; most turn red as the mini viewport sprouts a slot over the bottom edge. (4)
3. Sixty ribbons stack into a tile wall; counters: valid 1,906/6,060 (31.5%); fully valid paths 1/60. (5)
4. Red ticks flash a bottom-overflow marker; counters: containment 4,154, overlap 0, minimum size 0. (6)
5. One red tick expands: the violationDepth arrow, a pull-back spring to the start, and up to 40 small steps; stop on validBit == 1. (7)
6. The tick turns green after about 2 steps; the wall flips to all green: 6,060/6,060, failed 0; mean 1.9 steps. (8)
7. The visible-slot counter under one repaired tick drops from 16 to 6; cards vanish from the mini viewport; small tally '1,408 of 4,154 (July)'. (9)
8. Two new audit lights next to validBit: requiredContentRetained and strictlyContained; the repaired tick is green on the old light, red on the new two. (10)
9. The ribbon is scrubbed in fine steps; neighbouring mini viewports jump where order, visibility or wrap flip. (11)
10. The wall fades to 0.15; a ledger panel states: July counts reproduce · narrowed by September corrections · status table gives limits, no tag. (12)
11. Three open items stamp in under the ledger: 60 Hz transition, second flow region, learned fitness weights; final one-line recap. (13)

Captions
1. Moving between layouts is what an interface does all the time, so the layouts in between should be valid too. Start with one careful case. [lab/generative-fields/README.md:7]
2. In the hero migration, importance slides from slot two to slot eleven over twenty-one frames. Slot two falls from about one hundred twenty-nine thousand square pixels to twenty-four thousand; slot eleven rises. [lab/generative-fields/interpolation.test.ts:44-66; printed hero migration]
3. They cross at sixty-six thousand four hundred forty-three square pixels each, and all twenty-one frames are valid. But that is one chosen pair, and it says nothing about layouts in general. [lab/generative-fields/interpolation.test.ts:44-78]
4. Now more pairs. The study walks sixty pairs of layouts, ten among the authored families and fifty random ones, each a straight line of a hundred and one points: six thousand sixty points in all. [lab/generative-fields/experiments.ts:35-42; lab/generative-fields/interpolation.ts:32-80]
5. Straight lines mostly fail. Only nineteen hundred six points are valid, thirty-one percent, and just one of the sixty paths is valid from end to end. [printed run; lab/generative-fields/interpolation.test.ts:26-29]
6. Every one of the four thousand one hundred fifty-four invalid points is the same kind: the layout spills past the bottom of the viewport. No point has overlapping slots. [printed run (overlap 0, containment 4154, minimum size 0); lab/generative-fields/README.md:37]
7. The repair is a projection. Take small steps downhill on violation depth, with a gentle pull back toward where the point started, and stop the moment the validity bit reads one. [lab/generative-fields/optimize.ts:212-248 (229: stop at validBit==1; 236-244: proximal pull)]
8. It works. On average it takes one point nine steps, out of forty allowed, and all six thousand sixty points end valid. Not one repair fails. [printed run (mean 1.9 steps); lab/generative-fields/interpolation.test.ts:26-29,36; lab/generative-fields/optimize.ts:218]
9. But the validity bit never asked for content to stay. The July study counted fourteen hundred eight of those repairs hiding visible slots, and one cut sixteen visible slots to six. [lab/generative-fields/README.md:7 (July figure 1,408; scratch recount on current code 1,406, not in repo)]
10. The September audit adds separate reports: required content retained, and strict containment with no slack. A layout can pass the old validity bit and fail both. [lab/generative-fields/content-audit.ts:4-29; lab/generative-fields/README.md:5-7]
11. And valid points still do not make smooth motion. Sorting, visibility and wrapping can jump between neighbors, so the readme says the samples do not establish smooth motion. [lab/generative-fields/README.md:9]
12. The status table gives this lab no tag, only its limits. A fair reading is historical and narrowed: the July counts reproduce, but the readme calls them not promises about the corrected optimizer. [lab/status.md:201; lab/generative-fields/README.md:5]
13. Still open are a sixty-hertz transition driven by the projection, a second flow region, and learned fitness weights. Today: one program, many layouts, repaired to valid, not yet proven smooth. [lab/generative-fields/README.md:135-139]

On-screen labels: `heroMigrationPair`, `slot 2: 129,064 → 24,191 px²`, `slot 11: 24,191 → 129,064 px²`, `t = 0.5: 66,443 each`, `row tops 111.52 and 413.92`, `60 pairs × 101 points = 6060`, `valid before 1906/6060 (31.5%)`, `fully valid naive paths 1/60`, `containment 4154 · overlap 0 · minimum size 0`, `projectToValidity: maxSteps 40 · learningRate 0.02 · proximalWeight 0.05`, `repaired 4154, failed 0 · mean 1.9 steps`, `July: 1,408 of 4,154 hid visible items; one 16 → 6`, `(scratch recount on current code: 1,406; label as scratch if shown)`, `auditContent: requiredContentRetained · strictlyContained`

