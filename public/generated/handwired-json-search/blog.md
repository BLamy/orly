# JSON Search

Cheng asked whether regex search or a JSON highlighter could be clearly faster on a graphics chip. Handwired's lab in [`lab/json-search`](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/json-search/README.md) runs both programs over 100,000 generated JSON documents, from the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)). The answer depends on how many documents there are and on what the GPU is raced against.

### One document is no case, a crowd is

For one document the GPU loses. The highlighter takes 80 µs on the CPU executor, and a round trip to the GPU alone takes 0.6 ms or more. Many documents are another story: every document runs the same operations, and no document reads another one's values. That makes one GPU thread per document a natural shape.

{% viz scene="books/handwired-json-search/chapter-1" section="chapter-1-one-thread" cue="0" from="0.000" to="30.766" title="One GPU thread takes one document, and no thread reads another's values." %}
{% endviz %}

### Each row holds one document, and a tenth of them are broken

Each document is a row of up to 512 code points, followed by the text's length, in [`json-step.ts`](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/src/json-search/json-step.ts). Of the 100,000 documents, 89,943 are valid and 10,057 are broken, spread over sixteen kinds of defect. The highlighter has to handle both, and one thread reads its own row and nobody else's.

{% viz scene="books/handwired-json-search/chapter-1" section="chapter-1-row-and-defects" cue="3" from="30.766" to="54.323" title="Each thread reads its own row, valid or broken." %}
{% endviz %}

### The step is written once, and the loop does the rest

The highlighter does 37 operations per position, and 17 more to close the document, so a full row costs 18,961 operations. Written once inside a loop over positions, its shader is 107 statements and compiles in 0.04 s. The first version, with every position written out, took about 2 s to compile, so the loop turned a compile limit into a detail.

Across 100,000 documents, 18,961 operations each is about 1.9 billion operations in one pass. That multiplication is our arithmetic on the lab's count, not a measurement.

{% viz scene="books/handwired-json-search/chapter-1" section="chapter-1-one-step" cue="5" from="54.323" to="96.154" title="One step is written once, and a loop runs it over every position." %}
{% endviz %}

### The GPU pass takes 2.2 ms, and every value matches the CPU

With the documents already on the GPU, validating and highlighting all 100,000 takes 2.2 ms when passes follow each other. The same program as generated JavaScript takes about 2.1 s, extrapolated from 5,000 documents, and 8.4 to 9.2 s on the CPU executor. Every value the GPU returned matched the CPU's: 51.6 million values, 0 different.

These are for one Apple M5 Max through Metal, in headless Chrome. The lab says another GPU or browser may differ.

{% viz scene="books/handwired-json-search/chapter-1" section="chapter-1-results" cue="9" from="96.154" to="131.007" title="The highlighter's pass is 2.2 ms, and every value matches the CPU." %}
{% endviz %}

### The pattern lives in cells, so a new pattern writes cells

Search is the harder program. Its automaton sits in cells beside the text, so a new pattern writes cells and changes no program. A pattern has one state per character or class it reads, plus one: `error` has 6 states, and `connection reset` has 17. A pattern may use up to sixteen classes and thirty-two class boundaries.

{% viz scene="books/handwired-json-search/chapter-2" section="chapter-2-pattern-cells" cue="0" from="0.000" to="29.014" title="The automaton sits in cells, and a new pattern writes cells." %}
{% endviz %}

### Each step is a zero-one matrix product

Each code point first becomes a class, found by counting the class boundaries it has passed. The class picks a transition matrix of zeros and ones, which says which state leads to which. The live states form a zero-one vector, and one step multiplies the two.

Each product in that multiply is one table read. A search step takes one table read per pair of states, so that is 64 reads at 8 states and 1,024 at 32.

{% viz scene="books/handwired-json-search/chapter-2" section="chapter-2-matrix-product" cue="3" from="29.014" to="50.991" title="A code point's class picks a matrix, and one step multiplies it by the live states." %}
{% endviz %}

### Two passes find the match without backtracking

The reverse pass walks from the end of the text: `reach[j][s]` is 1 when some path from state s at position j reads at least one code point and ends in an accepting state. The forward pass walks from the start, and `reached[j][s]` tracks the match in progress. When no match continues, a new one starts where the reverse pass marks the initial state, so the forward pass already knows whether a longer match exists and never backtracks.

Worked by hand from those rules, the word `error` in "no error found" marks five positions. We did not run this example, so treat it as a reading of the code.

{% viz scene="books/handwired-json-search/chapter-2" section="chapter-2-two-passes" cue="5" from="50.991" to="89.977" title="A reverse pass marks reachable states, and a forward pass carries the match." %}
{% endviz %}

### The cost is fixed per position, and every value is exact

Per position the two passes cost 240 operations at 8 states, 664 at 16 and 2,280 at 32, whatever the length of the text. Over a full 512-position document that is 122,888 operations at 8 states and 1,167,392 at 32. Every value is an integer, so 32-bit floats hold them exactly.

The search can also read the highlighter's display kinds, so a match of a string or a key never crosses an escape or a key boundary.

{% viz scene="books/handwired-json-search/chapter-2" section="chapter-2-costs-and-kinds" cue="9" from="89.977" to="125.527" title="The cost per position is fixed by the state count, and matches stay inside one run." %}
{% endviz %}

### The first search was slow for long patterns

For 100,000 documents the first working search took 7.81, 68.8 and 945 ms at 8, 16 and 32 states. The reason is the arithmetic: at 32 states a pass has 1,025 table reads, and the shader holds 4,648 statements, each a separate 32-bit float operation.

On October 14 a second code writer, [`bit-emit.ts`](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/src/json-search/bit-emit.ts), rewrote only the shader text. The search program as written did not change, and it is still weighted sums, ReGLU gates and index reads.

{% viz scene="books/handwired-json-search/chapter-3" section="chapter-3-slow-first" cue="0" from="0.000" to="40.195" title="The first writer spends one float statement per operation at every size." %}
{% endviz %}

### Bits turn a subtraction and a clamp into one logic operation

When both inputs are known to be bits, relu of a minus b is just a AND the flip of b. A row of up to 32 states fits one 32-bit word, so a gate reading many table entries of one row becomes one AND of two words, then a test against zero.

The writer only does this where the declared ranges prove a value is a whole number or a bit. Everywhere else it falls back to the same float statements.

{% viz scene="books/handwired-json-search/chapter-3" section="chapter-3-bit-identity" cue="3" from="40.195" to="73.318" title="A relu of two bits is one logic operation, and unproven values stay floats." %}
{% endviz %}

### Back to back, the search takes about five milliseconds at every size

At 8 states the search went from 7.81 to 4.60 ms, and at 16 states from 68.8 to 4.72 ms. At 32 states it went from 945 to 5.24 ms, which is 1.7, 15 and 180 times less back to back, with no change to the program.

{% viz scene="books/handwired-json-search/chapter-3" section="chapter-3-back-to-back" cue="6" from="73.318" to="97.571" title="Back to back, all three pattern sizes sit near five milliseconds." %}
{% endviz %}

### A flat floor, a pause, and two writers that agree

Searches of 100 to 10,000 documents take 0.6 to 1.9 ms at any of the three sizes, so the search no longer slows as the pattern grows. Those are back-to-back times, where each search starts as soon as the last answer arrives. A search after a pause of 200 ms or more takes 2.4 to 3.2 times as long, and the lab did not find out why.

The searcher uses the bit writer for search and keeps the first writer for the highlighter, which the bit writer did not speed up. Both writers give the same answers: 2.4 million match counts and marks across 18 searches, and 103 million highlighter values, with no differences.

{% viz scene="books/handwired-json-search/chapter-3" section="chapter-3-floor-and-agreement" cue="8" from="97.571" to="138.438" title="The floor is flat across sizes, and both writers return the same values." %}
{% endviz %}

### Against the CPU the GPU wins by a wide margin

So is the GPU clearly faster? That depends on who it races. Against the same programs on the CPU, the answer is yes. The highlighter takes about 2.1 s as generated JavaScript, and a search of up to 8 states takes 14 s. Against the GPU's 2.2 ms pass and 4.5 ms search, those are roughly 950 and 3,100 times. These ratios are our arithmetic from the lab's times.

Against the browser's RegExp on one thread, counting every match of nine ordinary patterns takes 8 to 43 ms. Back to back, the GPU is 1.5 to 9 times faster on every one of them.

{% viz scene="books/handwired-json-search/chapter-4" section="chapter-4-cpu-and-regexp" cue="0" from="0.000" to="35.016" title="Against the CPU and RegExp back to back, the GPU is faster." %}
{% endviz %}

### After a pause, the scoreboard is mixed, and RegExp backtracks

At a keystroke, after a pause, the search takes 11 to 16 ms. It beats RegExp on seven of the ten patterns, ties one, and loses on a date pattern and on connection reset.

On a pattern that makes RegExp backtrack, RegExp takes 2.1 s, and the GPU takes 5 to 12 ms. The crossover against RegExp is about 2,000 to 13,000 documents back to back and 15,000 to 54,000 after a pause, interpolated between four measured sizes.

{% viz scene="books/handwired-json-search/chapter-4" section="chapter-4-keystroke-and-backtracking" cue="3" from="35.016" to="65.771" title="After a pause the GPU is mixed against RegExp, and it wins on backtracking." %}
{% endviz %}

### Workers win, and a review narrowed the first write-up

Against JavaScript in several workers, the GPU does not win. Eight workers count a pattern's matches in 1.9 to 6.7 ms, where the GPU takes 4.5 to 5.2 ms back to back, and the workers were not timed after a pause. For validating from raw text, the GPU takes 0.15 s, where a plain JavaScript highlighter takes 0.12 to 0.15 s.

A review of the write-up found problems. The first answer claimed more than the measurements show, and the CPU times and crossover counts were narrowed.

{% viz scene="books/handwired-json-search/chapter-4" section="chapter-4-workers" cue="6" from="65.771" to="102.076" title="Eight workers match or beat the GPU, and the raw-text validation is a tie." %}
{% endviz %}

### So the GPU is faster than the CPU, often faster than RegExp, and not faster than workers

Still open: why a search after a pause takes longer, and how any other GPU or browser compares. The first-stage programs were removed, and they survive at the tag `json-regex-experiments-2026-10`.

The shape that worked is one thread per document, a pattern kept as data, and states packed into words. The lab says a demo is honest if it says what it shows, and not if it claims to beat RegExp on every pattern or JavaScript in several workers.

{% viz scene="books/handwired-json-search/chapter-4" section="chapter-4-verdict" cue="9" from="102.076" to="135.419" title="The verdict holds for the CPU and RegExp, and fails against workers." %}
{% endviz %}

The main sources are the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, especially its [json-search lab write-up](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/json-search/README.md), its [status log](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md), and the source files [`search-step.ts`](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/src/json-search/search-step.ts), [`bit-emit.ts`](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/src/json-search/bit-emit.ts) and [`searcher.ts`](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/src/json-search/searcher.ts). The sources page under the player lists each spoken claim with its file and lines.

[Watch all four narrated chapters](?bundle=handwired-json-search).
