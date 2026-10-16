# generative-fields

**Question:** Can one fixed 16-slot layout circuit produce grids, heroes, mosaics, lists and filmstrips purely from numbers in its source table, score its own validity, and be steered by search, gradient and interpolation?

**Mechanism:** `fields.ts` defines a 72-dimension field vector: 8 global knobs (paddings, gaps, `baseSpan`, `spanFromImportance`, `baseHeight`, `heightFromImportance`) plus 4 per-slot fields (`importance`, `orderKey`, `visibility`, `heightPreference`) for 16 slots; `buildSource` writes it into the table. `flow-layout.ts` (`createFlowLayoutCircuit`) turns importance into a width span and height, ranks slots by pairwise order-key comparisons (`emitKeyOrderBit`), and places them by greedy line breaking, the same rule as CSS flow. It also computes overlap, containment and minimum-size checks, a `validBit` and a continuous `violationDepth`. `fitness.ts` (`scoreFitness`) is a seven-term Duplo-style score. `search.ts` (`runSearch`) samples seeded vectors; `optimize.ts` (`ascendFitness`) climbs fitness through `ste-backprop.ts`, which calls `backpropagateReference` with `booleanGradient: 'straight-through'`; `projectToValidity` descends `violationDepth` with Adam plus a proximal pull until `validBit === 1`; `interpolation.ts` (`walkPath`) walks straight lines between layouts and repairs invalid points.

**Result:** Circuit: 8,385 operations (336 boolean), 147 layers. Five families run on one compiled program with zero recompilation. Search: 1,078 of 4,000 valid, best fitness 0.875. Gradient: 12/12 starts valid, best 0.922, but the best shows only 6 of 16 slots; without the richness term ascent collapsed to 0.998 with 2 visible slots. Interpolation: valid before projection 1,906/6,060 (31.5%), after 6,060/6,060, mean 1.9 repair steps; every invalid point was vertical overflow. All from README tables pinned in `generation.test.ts` and `interpolation.test.ts`.

**Status:** Historical, with caveats. README September 2026 corrections: "Of the July study's 4,154 repairs, 1,408 hid previously visible items; one reduced sixteen visible items to six," and "The samples do not establish smooth motion." lab/status.md: "Historical repair could hide content, and valid samples do not establish a smooth valid interpolation." Next steps (a second flow region, learned fitness weights) are open.

**Visual idea:** Hero migration: 16 boxes reflowing as t slides 0 to 1, slot 2 shrinking from 129,064 px² while slot 11 grows, the two meeting at 66,443 px² each at t = 0.5 in separate rows. Then a straight-line path where a red box overflows the viewport bottom and a projection nudge snaps it back inside, with a counter showing a slot quietly hidden.

**Sources:**
- lab/generative-fields/README.md:1-140
- lab/generative-fields/ste-backprop.ts:1-10
- lab/generative-fields/optimize.ts:212-250
- lab/generative-fields/interpolation.ts:32-60
- function lists (grep) of fields.ts, flow-layout.ts, fitness.ts, search.ts, content-audit.ts
- lab/status.md:201
- commit 4ea7fcb
