# data-adapter

**Question:** Given a few examples of rectangle rows and desired answers, can an exhaustive search over a tiny vocabulary of exact circuit programs recover reusable lookups (find a row by ID, read a field, do arithmetic) that keep working on new data?

**Mechanism:** `lab/data-adapter/experiment.ts`. One circuit has `CAPACITY = 12` storage slots, each holding an active bit, an integer ID, and left/top/width/height. `enumeratePrograms` lists every program: a predicate subset (active, same-id, first-slot; zero to two), one field read, and zero to two steps (add width, add height, subtract origin X/Y, multiply by scale), giving `7 * 4 * (1 + 5 + 25) = 868`. `compileLookup` turns predicates into one bit per slot; same-id is `ReLU(1 - abs(id - selectedID))`, exact for integers. A read sums field times bit, and `found` counts matches clamped to 1. `buildAdapter` adds the steps with `roundAffine`/`multiply`. `synthesize` runs each candidate through the real `Circuit` on the training scenes and drops it at the first example that rules out every task. The targets come from `oracle`, a separate plain-JS `find`. `repeatedLookup` then pulls out the shared predicate prefix as one reusable `selectedField(field)`.

**Result:** "12 training scenes identify one program for each of eight tasks from 868 candidates", and all eight "agree exactly with an independent JavaScript lookup on 438 held-out scenes". The common lookup recovered is "active AND same ID". Search evaluates 997 candidate/scene pairs in about 60 ms. Verification is 14,016 scalar comparisons. Joint circuits are 200 constructed operations, versus 1,118 for eight separate circuits (README:5, 46, 62-70).

**Status:** Succeeded within its scope, but it is not learning: "Nothing trains neural weights here." The extraction rule "is authored, not a learned neural abstraction". status.md lists it as "No neural training ... Capacity is 12." It is meant as the baseline for the next experiment (decision 8: retrieving a rectangle by ID with soft attention), which is still open.

**Visual idea:** A table of 12 slots, shuffled. A grid of 868 candidate program cards streams past the table. Each card lights rows with its predicate bits, reads a column, applies steps, and is struck out the moment a training scene disagrees. Eight cards survive, all sharing the same "active AND same ID" stamp, which then lifts off and becomes one shared function box.

**Sources:**
- lab/data-adapter/README.md:1-91
- lab/data-adapter/experiment.ts:1-20, 81-227
- lab/status.md:187, 199, 244
- commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46
