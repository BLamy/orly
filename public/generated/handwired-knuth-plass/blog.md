# Knuth-Plass

Knuth-Plass chooses where a paragraph's lines break, by the cheapest total for the whole paragraph rather than one line at a time. Cheng Lou's `chenglou/handwired` repository writes that method as a fixed program of sums, table lookups and relus, in its `lab/knuth-plass` directory. This book follows the repository at commit 4ea7fcb ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)).

### Greedy filling pays for its gap

Fitting a paragraph to a column means choosing where each line breaks. Take four boxes, three, two, two and five pixels wide, with one pixel spaces, in a column six pixels wide. Greedy filling packs each line until the next box won't fit, so the first two boxes fill six pixels exactly and the third sits alone, leaving four pixels empty.

{% viz scene="books/handwired-knuth-plass/chapter-1" section="chapter-1-greedy-filling-pays-for-its-gap" cue="0" from="0.000" to="63.147" title="Greedy filling leaves four empty pixels, and that line costs sixteen." %}
{% endviz %}

A line's cost is its empty space, squared. Four empty pixels cost sixteen, a full line costs zero, and so does the last line. Greedy's total is zero plus sixteen plus zero, which is sixteen.

### Breaking early costs less

Break after the first box instead. That line leaves three pixels empty and costs nine. The next two boxes leave one pixel and cost one, and the last line is free, so the total is ten, beating sixteen.

{% viz scene="books/handwired-knuth-plass/chapter-1" section="chapter-1-breaking-early-costs-less" cue="5" from="63.147" to="103.201" title="Breaking after the first box totals ten, against greedy's sixteen." %}
{% endviz %}

Squaring is why. One big gap costs more than two small ones: four squared is sixteen, but three squared plus one squared is ten. A line that overflows the column costs a huge number and is never chosen, except a single box wider than the column, which costs 3,969 so that every paragraph has a solution.

### A running best finds the cheapest path

To find the cheapest breaks overall, keep a running best. The cost of reaching a break point is the cheapest, over every earlier break point, of that point's cost plus the line from there. Point one costs nine, point two costs zero, and point three has two candidates: sixteen from point two, or nine plus one, ten, from point one. Ten wins and remembers point one.

{% viz scene="books/handwired-knuth-plass/chapter-1" section="chapter-1-running-best-finds-the-cheapest-path" cue="8" from="103.201" to="138.879" title="Point three keeps ten from point one, because ten beats sixteen." %}
{% endviz %}

On equal totals, the shortest last line wins. A later candidate replaces the best only when it is strictly cheaper, and the shortest line is tried first.

### The circuit keeps the minimum with relus

In the circuit, a line's cost is one table lookup and two relus. Each minimum is a relu too: left minus right, clipped at zero, is the excess, and the winner is left minus that excess.

{% viz scene="books/handwired-knuth-plass/chapter-1" section="chapter-1-circuit-keeps-the-minimum-with-relus" cue="11" from="138.879" to="168.623" title="Point four costs ten, and following the remembered points back gives the breaks." %}
{% endviz %}

Point four costs ten, from point three. Following the remembered points back gives four, three, one and zero, so the lines end after box one, after box three, and at the end. The total is ten, against greedy's sixteen.

### Each step is a min-plus matrix

Each step of that running minimum can be written as a matrix. The state holds the latest costs, one per box in the window. The matrix has this break point's line costs on top and shifts older costs down.

{% viz scene="books/handwired-knuth-plass/chapter-2" section="chapter-2-each-step-is-a-min-plus-matrix" cue="0" from="0.000" to="34.888" title="A step multiplies the state, keeping the smallest sum in each row." %}
{% endviz %}

Multiplying is min-plus: add the entries, then keep the smallest. Min-plus products are associative once sums are clamped at the infeasible value, so two steps merge into one matrix of the same size, and any grouping of steps gives the same answer.

### Merging steps trades layers for work

The chain form takes the steps in order. At 1,024 break points and a window of 32 boxes, that is 10,232 layers, each waiting on the one before. The tree form merges neighbours, then merges the merged pairs, in Brent-Kung's prefix network, and the same breaks come out in 230 layers.

{% viz scene="books/handwired-knuth-plass/chapter-2" section="chapter-2-merging-steps-trades-layers-for-work" cue="3" from="34.888" to="82.256" title="The tree has 230 layers, against the chain's 10,232." %}
{% endviz %}

The price is work. The tree totals 2,823,382 operations, about ten times the chain's 277,068. On the lab's own executor the chain is the cheaper form at every size measured, and the tree takes 1.7 to 7.7 times the chain's time.

### A plain loop beats both, on these timings

A plain loop beats both. For 1,024 break points it takes about 75 microseconds, against 2,925 microseconds for the chain.

{% viz scene="books/handwired-knuth-plass/chapter-2" section="chapter-2-plain-loop-beats-both-on-these-timings" cue="7" from="82.256" to="103.619" title="A plain loop takes about 75 microseconds, against 2,925 for the chain." %}
{% endviz %}

Those times are historical. One later commit cut the executor's cost per layer, and another cut compile time and memory, so the chain is probably faster now. The notes did not measure again.

### Exact integers, and doubling the table

Every value is a whole number below sixteen million, so 32-bit floats hold it exactly. The lab reports that costs, pointers and breaks equal the plain reference on random paragraphs, ties included.

{% viz scene="books/handwired-knuth-plass/chapter-2" section="chapter-2-exact-integers-and-doubling-the-table" cue="9" from="103.619" to="144.381" title="The circuit doubles the predecessor table, so each entry hops two steps." %}
{% endviz %}

Reading the answer uses the same trick. The remembered points are zero, zero, zero, one, three, and from point four one doubled hop lands on point one. A few such tables let every break point check, in a fixed number of steps, whether it lies on the path back from the end. Doubling is the tree idea again: depth that grows slowly.

### One paragraph loses to the round trip

Back to the question: do many paragraphs at once run faster on the graphics chip? Here the tree runs one level per dispatch, with every paragraph's matrices going through together. For one paragraph, the answer is no. At 256 break points and a window of 32, the plain loop needs 0.016 ms, and the chip needs about 0.39 ms.

{% viz scene="books/handwired-knuth-plass/chapter-3" section="chapter-3-one-paragraph-loses-to-the-round-trip" cue="0" from="0.000" to="32.926" title="One paragraph is 0.016 ms on the plain loop, and 0.39 ms on the chip." %}
{% endviz %}

Up to 4,096 break points, one evaluation on the GPU takes 0.3 to 0.6 milliseconds, mostly the round trip, and the plain loop takes less. Only a big batch can hide that fixed trip.

### Dense rows make the kernel cheap enough

The first kernel computes every entry of every product. At a thousand paragraphs it takes 42.3 milliseconds, losing to the typed-array loop's 10.4 and the plain loop's 18.2. Most rows of those tiles only slide old costs down, so the dense-rows kernel stores and multiplies just the rows that hold costs. With break positions uploaded, it takes 4.50 milliseconds for the same thousand paragraphs.

{% viz scene="books/handwired-knuth-plass/chapter-3" section="chapter-3-dense-rows-make-the-kernel-cheap-enough" cue="3" from="32.926" to="82.871" title="At 1,000 paragraphs, dense rows with uploaded positions take 4.5 ms, against 10.4 and 18.2." %}
{% endviz %}

That beats both loops, by 2.3 times for the typed-array loop and about four times for the plain loop. What gets uploaded matters. Send the positions and the chip computes line costs itself, and it wins. Compute line costs in plain code and upload them, and it loses: 23.4 milliseconds against 10.4.

### The crossover depends on the session

Where does the win start? Across six Chrome sessions, with positions uploaded, the GPU takes less time than the plain loop from below 30 paragraphs to about 105, and than the typed loop from about 38 to 188.

{% viz scene="books/handwired-knuth-plass/chapter-3" section="chapter-3-the-crossover-depends-on-the-session" cue="7" from="82.871" to="120.418" title="With positions uploaded, the crossover is a range, not a single count." %}
{% endviz %}

The lab itself says those counts are not a stable result. Near a hundred paragraphs the time is mostly the round trip, and that round trip changed about two times between sessions. The answers are exact: in Chrome the chip's totals and breaks matched the reference with zero mismatches, over 730 million values, up to 270,532 break points.

### Many can win, within a range that shifts

The lab's answer to Cheng is: for many paragraphs, yes; for one paragraph, no. The yes holds for one kernel, with positions or widths uploaded, on one Apple chip through Metal in headless Chrome.

{% viz scene="books/handwired-knuth-plass/chapter-3" section="chapter-3-many-can-win-within-a-range-that-shifts" cue="10" from="120.418" to="158.081" title="Many paragraphs can win on the chip, and one paragraph cannot." %}
{% endviz %}

Still open, by the notes, are Sklansky's prefix network, a graphics mode for the page, batches of different lengths, and the demo's own justified cost. None of them was done. So optimal breaks are a running minimum. As matrix products they form a tree, with ten thousand layers shrinking to two hundred thirty. One paragraph loses, and many can win, within a range that shifts.

### Sources

The main sources are the lab's code and notes at the pinned commit. `lab/knuth-plass/reference.ts` gives the line cost, the running minimum, the matrix form and the tie rule. `lab/knuth-plass/program.ts` gives the circuit: the table reads, the relus, the pairwise minimum and the doubled jump tables. `lab/knuth-plass/knuth-plass.test.ts` gives the four-box paragraph and its expected breaks. `lab/knuth-plass/README.md` gives the layer counts, operation counts, timings, crossover ranges and the list of work not done. `lab/status.md` gives the lab's reported agreement with the reference, and the repository's root README gives the definition of a ReLU. The timings are the lab's own; the GPU and Chrome numbers were not re-run for this book.
