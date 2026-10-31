# Data Adapter

Data Adapter is a small experiment in Cheng Lou's [Handwired](https://github.com/chenglou/handwired) repository. It asks whether a search over tiny programs can recover a rectangle lookup as a circuit of weighted sums and ReLU, with no training of any weights. This book follows the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)).

### Twelve slots, one tent per slot

Nothing here is trained. The circuit has twelve storage slots, and each holds an active bit, an integer ID, and four numbers: left, top, width and height. The README's example selects ID 20 from three active rows, 10, 20 and 30, wherever they sit in storage. For each slot the lab computes the difference between its ID and the wanted one, splits that difference into two ReLU ramps, and forms a tent, ReLU(1 − |d|). The tent is one at distance zero and zero at every other whole number.

{% viz scene="books/handwired-data-adapter/chapter-1" section="chapter-1-the-slot-tent" cue="0" from="0.000" to="64.145" title="Each slot measures its ID distance, then a tent picks the match." %}
{% endviz %}

For whole-number IDs that tent is exact, and the README says so because the construction is an integer equality, not a general continuous comparison.

### The decoy and the count

Asking for ID 20 leaves that slot's tent at one, while IDs 10 and 30 sit ten away and get zero, when the rule is applied by hand to the README example. An inactive row may repeat the wanted ID and carry misleading geometry, so every bit is multiplied by its slot's active bit, which silences the decoy. The bits add into a count, and found is the count minus ReLU(count − 1), which caps it at one. Reading a field multiplies each slot's value by its bit and sums the results, so the selected left edge is 40.

{% viz scene="books/handwired-data-adapter/chapter-1" section="chapter-1-the-trap-and-the-count" cue="6" from="64.145" to="99.741" title="A decoy row is silenced, then the count and the field read follow." %}
{% endviz %}

### Absent IDs and one-hot bits

Ask for ID 99 instead. Every bit is zero, so found and value are both zero, even though the coordinate origin is not zero. Duplicate active IDs are rejected at input, and that promise lets the bits be declared one-hot, with all zeros allowed. The lab makes that declaration only for the active-and-ID pair, because only there does it have a justification for arbitrary slot order. Every candidate in the search is built from the same pattern: some row tests, then a field read.

{% viz scene="books/handwired-data-adapter/chapter-1" section="chapter-1-absent-and-one-hot" cue="10" from="99.741" to="127.756" title="An absent ID reads zero, and duplicate active IDs are refused at input." %}
{% endviz %}

### 868 programs from one small vocabulary

The search chooses three things: which row tests to apply, which field to read, and which arithmetic steps to apply after. Row tests come from active, same ID and first storage slot, combined by AND and used none, one or two at a time, which gives seven choices. The field is one of four: left, top, width or height. Then zero, one or two steps are drawn from five: add width, add height, subtract origin X, subtract origin Y, or multiply by scale. That is 1 + 5 + 25 = 31 sequences, and 7 × 4 × 31 = 868 programs. Each one runs through the existing circuit implementation, with no heuristic score.

The eight targets are computed by a plain `find` and separately written FP32 arithmetic, never by the circuits. Training uses twelve scenes, with one to three active rows, present and absent IDs, and whole-number geometry.

{% viz scene="books/handwired-data-adapter/chapter-2" section="chapter-2-the-search-space" cue="0" from="0.000" to="72.213" title="The search space is seven row tests, four fields and thirty-one step sequences." %}
{% endviz %}

### Scenes narrow the field

After the first scene, 34 programs still match at least one task. Right still has eight candidates and left has two. After the second scene, six tasks are down to a single candidate, with top at two and right at three. By the seventh scene exactly eight programs remain, one per task, and scenes eight through twelve eliminate nothing more.

Candidates are dropped as soon as no task still matches them. So the search runs 997 candidate-and-scene evaluations, not 868 times 12, which is 10,416. The README reports about 60 ms for that bounded search on the development machine and says it is not a controlled benchmark. The per-scene counts above are not printed by the repository's report; they come from tracing the same search loop.

{% viz scene="books/handwired-data-adapter/chapter-2" section="chapter-2-scenes-narrow-the-field" cue="7" from="72.213" to="106.822" title="Each scene removes candidates until one program remains per task." %}
{% endviz %}

### Survivors and controls

Every survivor starts with the same selector, active and same ID. Right reads left and then adds width. Local left reads left, subtracts origin X, and then multiplies by scale. Drop the active test, or drop the same-ID test, and zero programs fit. So within this vocabulary and these eight authored targets, both tests are needed.

{% viz scene="books/handwired-data-adapter/chapter-2" section="chapter-2-survivors-and-controls" cue="11" from="106.822" to="132.446" title="Each survivor is a short chain of reads and steps, and both controls fail." %}
{% endviz %}

### Held-out scenes, then the counts

A recovered program only counts if it works on scenes it never saw. The held-out set uses seeds 1001 to 1024 and 216 generated scenes, with new IDs, counts of zero, four, six, nine and twelve, and fractional geometry and scales, positive or negative. Each scene also runs with its storage reversed, which adds 216 more, and six hand-picked boundary cases bring the total to 438. All eight programs match the plain lookup on every one. Each fitting answer's presence bit and coordinate are compared in both literal and compiled execution, which is 14,016 scalar comparisons.

Those comparisons are implementation checks, not additional independent samples. Only the 216 generated scenes are fresh draws, checked in many different ways.

{% viz scene="books/handwired-data-adapter/chapter-3" section="chapter-3-held-out-checks" cue="0" from="0.000" to="49.227" title="Four hundred thirty-eight held-out checks, and 14,016 comparisons across execution paths." %}
{% endviz %}

### Float rounding, and the reuse that saves nothing

The numbers are 32-bit floats, and inputs are rounded before arithmetic. Each addition, subtraction and multiplication rounds separately, and that rounding is part of the specification. Add about one part in sixteen million to one and the float rounds back to one. Multiplying by three then gives exactly three, while skipping that rounding step leaves three plus a speck. So `roundAffine` keeps the rounding steps in the order written, and later graph construction cannot remove them.

All eight programs share one row selection, computed once, with four field reads feeding eight outputs. Naming that shared function saves nothing, though. The core already merges identical expressions, so both joint circuits have 200 operations, against 1,118 for eight separate circuits. That last figure measures sharing between separate computations, not an advantage over the core's existing deduplication.

{% viz scene="books/handwired-data-adapter/chapter-3" section="chapter-3-rounding-and-reuse" cue="5" from="49.227" to="96.631" title="Float rounding is part of the spec, and naming the shared function saves nothing." %}
{% endviz %}

### Limits and the open test

The limits are plain. Nothing is learned, and there is no neural search guide. The graph is fixed at twelve slots, with no strings or joins, and the vocabulary cannot express `(left + width − originX) × scale`. The status is that it holds within its scope: the lab's eight tests pass, and every check matches the plain lookup. It is a search result, not a learning result, and the predicates and the extraction rule are authored.

The open experiment is retrieval by identifier with soft attention and argmax, compared against this exact baseline. It is proposed and has not been run.

{% viz scene="books/handwired-data-adapter/chapter-3" section="chapter-3-limits-and-status" cue="10" from="96.631" to="133.098" title="The limits are plain, and the next experiment is proposed, not run." %}
{% endviz %}

The main sources are the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46: the lab's [README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/data-adapter/README.md), its [search code](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/data-adapter/experiment.ts), its [tests](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/data-adapter/experiment.test.ts) and [report](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/data-adapter/report.ts), the lab's [status table](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md), and the [FP32 rounding runtime](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/src/runtime/numeric-ui-core.ts). The sources page under the player lists each spoken claim with its file and lines.
