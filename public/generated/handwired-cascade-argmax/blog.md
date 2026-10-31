Picking the biggest of several scores is easy to say and hard to make exact inside a handwired circuit. This book follows the lab at `lab/cascade-argmax` in [chenglou/handwired](https://github.com/chenglou/handwired), pinned to commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)). Its exact sign cascade picks a winner over 32-bit floats, and the lab is candid about what that costs and what training really shows.

### Two scores become one bit

The cascade circuit has only weighted sums, ReLUs, and products gated by a ReLU. A ReLU keeps a positive number as it is and turns a negative one into zero. The job here is one bit from two scores: one if the right score is strictly larger, zero otherwise, so a tie gives zero and the left candidate wins.

{% viz scene="books/handwired-cascade-argmax/chapter-1" section="chapter-1-two-scores-one-bit" cue="0" from="0.000" to="40.739" title="The first step is a ReLU of right minus left, which is zero for a tie or a left win." %}
{% endviz %}

The first step is a ReLU of right minus left. That is zero for a tie or a left win, and positive for a right win, but the positive value can be absurdly small.

### Seven stages stretch the gap to one

The smallest positive gap between thirty-two-bit floats is 2^-149, and nothing downstream would call that a one. Multiplying by a power of two only shifts the exponent, so the circuit multiplies by 2^23 and clamps the value at one. The clamp is the value minus the ReLU of the value minus one, and it stays exact below 2^24. Each multiply and each clamp is marked as its own rounding point, so the simplifier cannot merge the stages into one formula.

{% viz scene="books/handwired-cascade-argmax/chapter-1" section="chapter-1-seven-stages" cue="4" from="40.739" to="92.937" title="Each stage multiplies the gap by 2^23 and clamps it, seven times in all." %}
{% endviz %}

Seven multiplies by 2^23 give a total gain of 2^161, which the lab's header says saturates even the smallest positive FP32 difference to exactly one.

### The gap ends at one, and a tie stays zero

Watch the smallest gap climb through the stages. After the first multiply it is 2^-126. After the seventh it is 2^12, and the final clamp pins it at exactly one. A bigger gap saturates earlier and stays at one. A tie is zero, and zero times anything is still zero, so the left candidate keeps its win.

{% viz scene="books/handwired-cascade-argmax/chapter-1" section="chapter-1-gap-pinned-at-one" cue="9" from="92.937" to="119.674" title="The smallest gap climbs stage by stage and is pinned to exactly one." %}
{% endviz %}

The result is a bit made only of sums, ReLUs and scaling. The lab's test asserts that the cascade has zero boolean atoms.

### One winner from a tournament

One bit compares two candidates. Eight candidates need a tournament: pair them up, compare each pair, and send the winners on to the next round. Each match makes a right-wins bit and a left-wins bit, which is one minus it. The winner's score rises through two gated products, and the route is kept as a one-hot.

{% viz scene="books/handwired-cascade-argmax/chapter-2" section="chapter-2-tournament" cue="0" from="0.000" to="31.277" title="Eight candidates are paired, and each match sends its winner upward." %}
{% endviz %}

Both argmax versions aim at the same rule: the leftmost maximum wins. The lab's test oracle is that rule written in plain code.

### Where production keeps the left candidate

The production argmax scales the gap to near one half and rounds it with a boolean atom. A tie goes left there too, but that encoding also keeps the left candidate across a rounding band. The lab's header puts the band at roughly 2.4e-7, and its test bounds it under 2.5e-7. That is the lab's own figure. A scratch probe in the research found the largest kept-left difference at about 1.86e-7, so the exact number is not reproduced.

{% viz scene="books/handwired-cascade-argmax/chapter-2" section="chapter-2-rounding-band" cue="3" from="31.277" to="58.328" title="A candidate one float step above the leader is picked by the cascade and missed by production." %}
{% endviz %}

Plant one candidate a single float step above the leader. In the lab's test the cascade picks it at position six, while production keeps position two.

### Tests sample, they do not prove

The tests cover ties at many magnitudes, tiny subnormal gaps, adjacent floats, and two thousand random vectors at each of four widths. Both evaluators agree.

{% viz scene="books/handwired-cascade-argmax/chapter-2" section="chapter-2-sampled-tests" cue="6" from="58.328" to="78.877" title="The exactness tests sample ties, subnormals, adjacent floats and random vectors." %}
{% endviz %}

Say it plainly: that is sampled testing, not a proof for every pair of scores. It also assumes scores stay between zero and one.

### The price in built operations

At eight candidates, production builds 56 operations in 15 layers. The cascade builds 196 in 75. At 64 candidates it is 504 against 1764 operations, and 33 against 150 layers.

{% viz scene="books/handwired-cascade-argmax/chapter-2" section="chapter-2-cost" cue="8" from="78.877" to="122.043" title="Built operations: 56 for production against 196 for the cascade at eight candidates." %}
{% endviz %}

Those are built operations, counted before compiling. Compiled, the cascade is still about four times larger: 45 against 187 at eight candidates. The lab calls the cascade an available construction, not a proof of minimality. The core's own exact tree is 150 operations in 57 layers, counted after compiling.

### Two ramps make training possible

A hard decision hands back no useful gradient. The lab measured it: for separated scores, a tie, and the smallest possible gap, the gradient reaching the scores was exactly zero. So training uses the same topology, soft. The seven scale factors shrink from 2^23 to a gentle gain, and each clamp turns into a ramp. The ramp is centered on a zero gap, so a tie sits mid-ramp and a wrong decision gets gradient from both orderings.

{% viz scene="books/handwired-cascade-argmax/chapter-3" section="chapter-3-soft-ramp" cue="0" from="0.000" to="36.548" title="The hard step has no gradient, and the soft ramp gives one on both sides of a tie." %}
{% endviz %}

The gradient test checks the gradient at the two score wires, and for the hard form it reads zero. That is why the training uses the soft form of the same topology.

### A 128-cell table, annealed

The task is small. Sixteen cases, eight candidates, and one learned score for every case and candidate: a table of 128 cells. Training anneals the total gain in five steps, from 8 up to about two million, with up to 150 epochs at each, stopping early once every case is right.

{% viz scene="books/handwired-cascade-argmax/chapter-3" section="chapter-3-annealed-table" cue="4" from="36.548" to="65.747" title="The table is trained while the total gain anneals in five steps." %}
{% endviz %}

The weights start close together near one half, so every comparison sits inside the widest ramp and receives gradient from the first epoch.

### Hardening and ten seeds

Then comes hardening. The same weights go into the exact cascade, and every winner must come out exact in both evaluators. Across ten seeds, all 160 winners came out right after hardening. That result holds for this table and these seeds.

{% viz scene="books/handwired-cascade-argmax/chapter-3" section="chapter-3-hardening" cue="7" from="65.747" to="93.970" title="All 160 winners come out right after hardening, across ten seeds." %}
{% endviz %}

A control with a single clipped ramp, with under half the operations, also reaches 160 of 160 on ten fresh seeds.

### What the table does not show

So this is per-case table fitting. There is no shared query and key rule, and no claim about contexts the table never saw.

{% viz scene="books/handwired-cascade-argmax/chapter-3" section="chapter-3-scorecard" cue="10" from="93.970" to="109.598" title="The table fits each case separately, and the hard cascade still gives no useful gradient." %}
{% endviz %}

The scorecard: the exact forward construction holds, the learning claim is narrow, and useful gradients through the hard cascade are still missing.

The main sources are the lab at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46: its [README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/cascade-argmax/README.md), the [cascade source](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/cascade-argmax/cascade-argmax.ts), the [training code](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/cascade-argmax/training.ts) and its [tests](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/cascade-argmax/cascade-argmax.test.ts), plus the core's [highest-score tree test](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/ui-exploration/guide/examples/patterns/selection/highest-score-tree.test.ts) and the lab's [status page](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md). The sources page under the player lists each spoken claim with its file and lines.

[Watch all three narrated chapters](?bundle=handwired-cascade-argmax).
