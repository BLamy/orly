# Handwired

Handwired is Cheng Lou's repository for writing programs by hand as neural-net-style arithmetic: weighted sums, products with a ReLU, and a fixed table of cells that plain JavaScript reads and writes. Its README rewrites one branch, `const result = (a > 4) ? 10 : 12`, so that both answers are computed and a 0 or 1 picks one. This book follows the repository at commit 4ea7fcb ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)).

### Two ramps make a bit

The README's ternary becomes a difference of two ReLU ramps, `const above4 = Math.max(0, a - 4) - Math.max(0, a - 5)`. For whole numbers this is 0 up to four and exactly 1 from five on. Both answers are then computed and weighted by that bit: `const result = above4 * 10 + (1 - above4) * 12`. The bit only decides which product survives.

{% viz scene="books/handwired/chapter-1" section="chapter-1-two-ramps-make-a-bit" cue="0" from="0.000" to="62.333" title="Both branches compute, and a bit picks one." %}
{% endviz %}

The README assumes whole numbers. At a = 4.5 the same formulas give 0.5 and a result of 11, a blend of the two answers.

### Builder code appends the operations

No tool converts existing JavaScript. Builder code is plain JavaScript that executes a single time and adds operations to a circuit, with one familiar expression per line, such as `const not = (bit: Wire) => circuit.affine([[bit, -1]], 1)`.

There are four kinds of operation: a weighted sum, a product with a ReLU, a score rounded to 0 or 1, and a table read. Independent operations share a layer, and each layer is one sparse matrix multiply followed by the gates. The result is a stack of layers with no runtime branch or loop. So if every branch always runs, what happens to a loop?

{% viz scene="books/handwired/chapter-1" section="chapter-1-builder-code-and-layers" cue="8" from="62.333" to="108.623" title="Builder code appends operations, and a program is a stack of layers." %}
{% endviz %}

### A toggle is a table of cells

The toggle's table has 20 cells: the viewport, the pointer inputs, the on and armed bits, the spring matrix, the settle and snap bits, and the thumb. JavaScript writes the inputs, and the program computes the states.

{% viz scene="books/handwired/chapter-2" section="chapter-2-toggle-cells-and-hit-tests" cue="0" from="0.000" to="56.226" title="A press lands on the track only when all four edge bits are one." %}
{% endviz %}

A press lands on the track when four edge comparisons all hold. With pointer coordinates on a 1/64 px grid and track edges on a 1/2 px grid, each comparison takes two operations. The four bits combine as `relu(sum of bits - (N - 1))`, so only an all-ones result survives. Both hit tests run in every evaluation, whether or not an event arrived.

### Memory, a flip and a spring

Where JavaScript reassigns a variable, builder code makes a new wire. `armedAfterDown` holds the value after a press, while the armed cell keeps the previous evaluation's value. An `if` that assigns a cell becomes `emitSelect`, which computes both sides and picks one. The flip of the on bit is a select, and a release or a cancel disarms the switch.

{% viz scene="books/handwired/chapter-2" section="chapter-2-memory-flip-and-spring" cue="7" from="56.226" to="106.439" title="A flip is a select, and the spring is one matrix power." %}
{% endviz %}

A spring step is a 2 × 2 matrix on displacement and velocity, so n steps are that matrix to the power n. The host computes that power and writes its four numbers into four cells. The program applies it in 14 operations across three layers, for any step count, so a frame that needs many steps costs the program no more than a frame that needs one.

### The host queues, plans and writes

A program cannot wait, listen or loop, so the host does those things. Event handlers only queue events with their timestamps. Each frame, `advanceFrame` plans one evaluation per distinct event time, one at the frame, and a settle check every 64 ms of simulated time.

{% viz scene="books/handwired/chapter-3" section="chapter-3-host-plans-the-frame" cue="0" from="0.000" to="56.075" title="The host queues events, plans evaluations and writes the table." %}
{% endviz %}

Before each evaluation the host writes the spring matrix, the bits, the viewport and any event into the table. Then `evaluate` runs every operation. The host copies the next values back only when the evaluation writes back.

### Stored state follows events

A frame's own evaluation runs on a copy of the table. With the template's policy, only event, settle-check and snap evaluations write state back, so stored state depends on events and not on frame rate. The repository's replay tests run timestamped sessions at 10, 30, 60 and 120 frames a second and find every stored table identical in every bit, provided events arrive in timestamp order and no object is snapped onto its destination. Under the alternative, where every evaluation writes back, FP32 rounds the stored state once per evaluation, by amounts that differ between frame rates.

{% viz scene="books/handwired/chapter-3" section="chapter-3-stored-state-and-the-check" cue="6" from="56.075" to="113.870" title="Stored state follows events, and the plain JavaScript version agrees on every decision." %}
{% endviz %}

The page draws only from output numbers. To check the host, the repository runs the same switch in plain float64 JavaScript over a scripted trace and compares every frame. The on and armed bits and the track position must match exactly. The thumb must stay within 1e-5 px, and the measured error is 1.3e-6 px over the 20 px travel. The trace presses exactly on the edges, where an inexact decision shows up first.

### First hit by counting

A JavaScript loop can stop early. The program cannot, since every operation runs on every evaluation. So a loop becomes a count, a tree, a table, or the same work on every item. To find the pointed row, test every row at once. With bottoms 40, 80, 80, 140 and 180 and a pointer at 90, the bits `rowBottom <= pointerY` read 1, 1, 1, 0, 0.

{% viz scene="books/handwired/chapter-4" section="chapter-4-first-hit-by-counting" cue="0" from="0.000" to="50.422" title="Testing every row at once turns the first hit into a count." %}
{% endviz %}

The count of ones, 3, is the loop's index, because the bits never go back from 0 to 1. At 64 rows this costs 195 operations in 3 layers, against 447 in 34 for a tree built for the first hit. The count is right only for monotone bits. With bottoms 40, 30 and 80 at pointer 35, the count is 1 while the loop returns 0, and no error is raised.

### Running totals and ranks

Running totals form a chain: at 1,024 rows, 1,023 operations in 1,023 layers. A Brent-Kung network gives every total in 18 layers for 2,036 operations. That matches the loop only when the combine is associative and every partial sum is exact. Integers below 2^24 pass that test in any grouping, but fractions do not. With row heights 229, 167.4, 208.5 and 194.4 px, the loop's content height is 799.300048828125, and adding in pairs gives 799.2999877929688.

{% viz scene="books/handwired/chapter-4" section="chapter-4-running-totals-and-ranks" cue="6" from="50.422" to="119.071" title="Running totals take a tree only when grouping cannot change the bits." %}
{% endviz %}

Sorting needs no sort: an item's rank is the count of items before it. One comparison per pair, on keys on a grid, feeds one sum per item, which is 4,096 operations in 3 layers at 64 items. When data changes only between frames, the host can run the loop for every input and write the answers into cells, which the program reads in one operation. Fewer layers is not always faster: on the CPU executor the tree loses, while on a graphics card one level of the tree is a single dispatch.

### Exact comparisons and gradients

Chapter one's ramps were right only for whole numbers. For every pair of FP32 values in the declared ranges, a comparison bit equals JavaScript's comparison. On a declared grid, `a >= b` is `relu(1 - relu(-D))`, with D = (a - b) / grid, which costs 2 operations in 2 layers. Without a grid, a sign cascade costs 15 operations in 14 layers and returns the same bits. Exact means equal to the stated FP32 calculation, not to float64 arithmetic, so positions carry a tolerance.

{% viz scene="books/handwired/chapter-5" section="chapter-5-exact-comparisons-and-gradients" cue="0" from="0.000" to="53.615" title="A comparison bit is exact, and backpropagation needs a stated exception for hard decisions." %}
{% endviz %}

Most operations are weighted sums or ReLU products, so backpropagation can run through the program. Boolean atoms and index reads are the exceptions. A boolean atom throws unless the caller passes the straight-through option, which passes the output gradient unchanged to the atom's score. An index read throws by default when a nonzero gradient reaches it. A sign cascade gives its operands gradient 0, the derivative of a step.

### Three demos and the recap

The desktop demo is frozen: three windows and a dock, run by one compiled program of 234 source cells, 4,646 live operations in 130 layers and 9,909 stored weights. Builder code writes every weight, and none is trained. The learned gallery unfreezes its 244 cells, the coefficients of a small network, and Adam trains those coefficients at 600 steps a second.

{% viz scene="books/handwired/chapter-5" section="chapter-5-three-demos-and-recap" cue="5" from="53.615" to="122.276" title="Three demos make three different claims, and the program never decides anything." %}
{% endviz %}

The JSON search is the demo on the graphics card. Its GPU code lives in `src/json-search`, since `src/runtime` has no GPU backend. It searches 100,000 generated documents per keystroke, the default for a window 720 px wide or wider, with two fixed numeric programs. On an Apple M5 Max in Chrome 155, a search takes 11 to 15 ms per keystroke. Ordinary RegExp takes 8 to 28 ms, and `([a-z]+)+x` takes 2.1 s because it backtracks, so neither is always faster.

To recap: a decision runs both branches and a bit picks one. The program never decides anything. It computes every answer, and a bit that is exactly zero or one lets one of them through.

The main sources are the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, especially its [tutorial](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/docs/tutorial.md), [execution model](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/docs/execution-model.md) and [patterns](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/docs/patterns.md) docs, and the [live demos](https://chenglou.me/handwired/). The sources page under the player lists each spoken claim with its file and lines.

[Watch all five narrated chapters](?bundle=handwired).
