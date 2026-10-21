# Learned Program

This book follows the [handwired](https://github.com/chenglou/handwired) repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)), and its `lab/learned-interpreter` experiment. The question is whether training can recover one program that works across examples, instead of a separate answer for each input.

### Two instructions, one choice each

Four runtime inputs change on every example: `pointerX`, `panelLeft`, `scale` and `distractor`. The same program has to work for all of them. A program here is two instructions. Each picks one operation, add, subtract or multiply, and an ordered pair of values to apply it to.

{% viz scene="books/handwired-learned-interpreter/chapter-1" section="chapter-1-two-instructions" cue="0" from="0.000" to="30.825" title="A learned program is two instructions, each with one operation and an ordered pair." %}
{% endviz %}

The learned object is the program itself, not a table of answers, so the same two choices have to serve every example.

### Cards with dials, and one winner

Instruction zero reads the four inputs, so it has 3 × 4 × 4 = 48 candidates. Instruction one can also read instruction zero's result, which makes 3 × 5 × 5 = 75. Every candidate gets a dial. The circuit computes all the candidate results, multiplies each by its dial and adds them up, and that weighted sum is the soft program.

Training pushes one dial per instruction toward one, and the leftmost largest dial wins, so the mixture becomes one exact instruction. The count is 48 + 75 = 123 shared program cells beside four input cells. There is no example number and no per-example setting to cheat with.

{% viz scene="books/handwired-learned-interpreter/chapter-1" section="chapter-1-cards-and-dials" cue="3" from="30.825" to="78.704" title="Forty-eight and seventy-five candidates each get a dial, and the leftmost largest dial wins." %}
{% endviz %}

### Two targets and a strict checker

Two tasks test the program. The coordinate task subtracts the left edge from the pointer, then multiplies by the scale. The two-add task adds the pointer to the left edge, then adds the distractor. A separate checker computes each answer and rounds to a thirty-two-bit float after every step, so a learned program has to match it, not just land close.

The circuit has 250 operations today: 77 weighted sums and 173 ReLU-gated products. The soft and hard versions have the same count. A learned program is therefore just a pair of one-hot choices among those cards.

{% viz scene="books/handwired-learned-interpreter/chapter-1" section="chapter-1-targets-and-checker" cue="7" from="78.704" to="121.718" title="Two targets, a checker that rounds at every step, and a pair of one-hot choices." %}
{% endviz %}

The next chapter asks how training finds those two choices, and what went wrong the first time.

### Score every program once

Before training, the lab runs every one of the 3,600 possible programs on every training example and records each program's average error in one table. The table has 48 rows and 75 columns, and each cell averages over 14,739 training examples. For the coordinate task, exactly two cells are zero on every example. For the two-add task, twelve are.

Training never touches a program directly. It keeps one probability per row and one per column, and minimizes the expected error: row probability times cell error times column probability, summed.

{% viz scene="books/handwired-learned-interpreter/chapter-2" section="chapter-2-score-every-program" cue="0" from="0.000" to="46.416" title="Every program is scored once, and training works over the table of those scores." %}
{% endviz %}

The hard-loss method evaluates every complete program before training starts. Nothing in this chapter avoids that cost.

### The old epsilon locks one reel on the wrong card

Training runs five phases of 500 steps. The temperature starts at 2 and cools to one eighth, sharpening each reel toward a single card. In one coordinate run with the original setting, seed 541 at epsilon 1e-8, the first reel finds subtracting the left edge from the pointer. The second reel locks onto the wrong card, add of instruction zero with itself, and the loss stops falling at 0.009765625.

The optimizer is Adam, which divides each step by the gradient's recent size plus a small constant, epsilon. The lab reports that the old epsilon dominated the small gradients here, so steps shrank.

{% viz scene="books/handwired-learned-interpreter/chapter-2" section="chapter-2-the-old-epsilon" cue="4" from="46.416" to="82.709" title="At epsilon 1e-8, the second reel locks onto the wrong card and the loss stops falling." %}
{% endviz %}

The loss table is the same in both runs. Only the optimizer's constant changed.

### Shrink epsilon, and the reel escapes

Shrink epsilon to 1e-14, and the same seed escapes. The second reel leaves the wrong card, and the loss falls from about 0.0099 at temperature one to 6.6e-16 at one eighth. The second reel ends near one half, not one. That fits two equivalent coordinate programs that differ only in the order of the multiplication. That reading is an inference, not a measured fact.

You can get the same effect without touching epsilon: multiply the loss by a million. All 120 paired runs then choose identical programs.

{% viz scene="books/handwired-learned-interpreter/chapter-2" section="chapter-2-the-corrected-epsilon" cue="7" from="82.709" to="113.546" title="At epsilon 1e-14 the same seed escapes, and scaling the loss gives the same programs." %}
{% endviz %}

For Adam, multiplying the loss and dividing epsilon are equivalent, apart from numerical rounding.

### The scoreboard

With the original epsilon, none of the 120 hard-loss runs recovered a program. Corrected, all 60 coordinate runs do, and 59 of 60 two-add runs get every integer example right.

One two-add seed still fails, seed 519, and the settings were not retuned for it. The lab says epsilon caused most of the failure, not all of it, and the reassessment's numerical diagnosis is unfinished.

{% viz scene="books/handwired-learned-interpreter/chapter-2" section="chapter-2-the-scoreboard" cue="10" from="113.546" to="139.971" title="The scoreboard: none of 120 original runs succeed, and corrected settings recover 119 of 120 on integers." %}
{% endviz %}

The status is narrow. The optimizer fix holds on this task, and one seed still fails.

### Twelve pass on integers, four pass the checker

Training counts a program as recovered once it gets every integer example right. For the two-add task, twelve different programs do that.

The strict checker is larger: 39,605 cases, made of whole numbers, fractions and input-rounding tests, each compared against the independent oracle. Only four of the twelve survive it. All four add the pointer to the left edge first, then add the distractor, and each addition may swap its two operands.

{% viz scene="books/handwired-learned-interpreter/chapter-3" section="chapter-3-twelve-and-four" cue="0" from="0.000" to="27.574" title="Twelve programs pass on integers, and four survive the strict checker." %}
{% endviz %}

The 39,605 cases split into 37,188 integer, 2,401 fractional and 16 input-rounding cases.

### The grouping decides, and integers cannot tell it

Set the pointer to one, the left edge to two to the minus twenty-fourth, and the distractor to minus one. Adding the pointer and the edge first rounds back to exactly one, and minus one gives zero. Group them the other way, with the edge plus minus one, and that sum is exact. Adding the pointer then leaves two to the minus twenty-fourth. Same three numbers, same two additions, a different answer.

Small whole numbers add exactly in either grouping, so this lab's integer examples cannot tell the groupings apart. In the lab's words, integer examples alone cannot identify which grouping is required.

{% viz scene="books/handwired-learned-interpreter/chapter-3" section="chapter-3-the-grouping-decides" cue="3" from="27.574" to="76.998" title="The same three numbers give zero or 2^-24, depending on how the additions are grouped." %}
{% endviz %}

So the tally splits. Of sixty corrected two-add runs, only fifteen pass the full checks, while all sixty coordinate runs still do. The training data, not the optimizer, is the limit here.

### Baselines, and the table they share

Reading the table directly is a baseline too. Direct enumeration reads all 3,600 entries, and the first minimum wins. On these tasks that program also passes the full checks.

Starting from each failed run, one sweep of exact coordinate updates reaches zero integer error in 124 table reads. That repairs a run. It does not search from scratch.

Every hard-loss route reuses the table, which took over fifty-three million second-instruction evaluations to build. Nothing here avoids scoring every complete program first.

{% viz scene="books/handwired-learned-interpreter/chapter-3" section="chapter-3-baselines-and-the-table" cue="7" from="76.998" to="111.700" title="Enumeration and one coordinate sweep both read the same table, and the table is the expensive part." %}
{% endviz %}

Every hard-loss method here reuses the table, so its cost is paid once.

### Status and limits

The earlier soft-output trainer, which averages candidate outputs and follows the error, recovered eleven of twenty coordinate runs and none of twenty full two-add runs. Those results are historical.

The status, plainly: the corrected optimizer result holds on this two-instruction task, narrowed to integer data. The open question is whether fractional training examples can identify the grouping. Untested are data-dependent choices, loops, varying lengths, longer programs, and training without a full loss table. In the lab's words, neither result establishes scalable program synthesis.

{% viz scene="books/handwired-learned-interpreter/chapter-3" section="chapter-3-status-and-limits" cue="10" from="111.700" to="149.212" title="The soft trainer is historical, the optimizer result holds on integers, and scalable synthesis is not established." %}
{% endviz %}

The main sources are the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, especially the lab's [README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/learned-interpreter/README.md), its [program](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/learned-interpreter/program.ts), [training](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/learned-interpreter/discrete-training.ts) and [oracle](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/learned-interpreter/oracle.ts) code and their tests, the lab's [status page](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md), and the September [reassessment](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/reassessment-2026-09-03.md). The sources page under the player lists each spoken claim with its file and lines.
