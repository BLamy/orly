# Bitonic Sorter

A bitonic sorter is Ken Batcher's fixed wiring of comparators, published in 1968 in *Sorting networks and their applications*. This post follows the Wikipedia article at revision 1373262602, and it checks the article against Handwired, Cheng Lou's repository for writing programs as one fixed circuit of weighted sums and ReLU. The repository is pinned at commit 4ea7fcb, and the measurements come from its exploration notes at d01b763.

### A comparator is the only part

A sorting network never decides. It is a fixed list of compare-and-swap steps, wired the same way for every input. The one part is the comparator: two numbers go in, the smaller comes out on the top wire, and the larger on the bottom. The bitonic construction works on a sequence that climbs and then falls, which the name describes. One, two, six, seven, eight, five, three, zero is such a mountain.

{% viz scene="books/handwired-bitonic-sorter/chapter-1" section="chapter-1-comparator-and-mountain" cue="0" from="0.000" to="45.976" title="A comparator orders two wires, and a bitonic sequence climbs and then falls." %}
{% endviz %}

Ken Batcher's bitonic construction is built from comparators like this one. For a sorter of two wires, the article says, it is simply a comparator.

### The half-cleaner splits a mountain in two

The half-cleaner pairs each wire in the first half with its partner in the second half. On eight wires, wire zero meets wire four, one meets five, two meets six, and three meets seven. On the example, the four comparators leave the low values one, two, three, zero on the left and the high values eight, five, six, seven on the right.

{% viz scene="books/handwired-bitonic-sorter/chapter-1" section="chapter-1-half-cleaner-splits" cue="4" from="45.976" to="89.675" title="Four comparators fire at once and split the mountain into two halves." %}
{% endviz %}

The border is clean. The largest value on the left is three and the smallest on the right is five, so nothing needs to cross. The article says all elements of one bitonic subsequence are guaranteed to be higher than all elements of the other, so the two halves can be sorted separately.

### Split again until the line is sorted

The right half, eight, five, six, seven, dips like a valley. Read from the five, it climbs, so it is a mountain in a wider sense. The article's definition allows only straight mountains, but the argument needs rotated ones too. Across all 2,083 eight-long mountains with values zero to three, our check found no split that failed.

Halving each half again gives quarters and then pairs. On the example the pieces come out as zero, one, two, three, five, six, seven, eight. Three rounds at distances four, two and one do the job for eight numbers.

{% viz scene="books/handwired-bitonic-sorter/chapter-1" section="chapter-1-split-again" cue="8" from="89.675" to="136.673" title="Recursive halving leaves a sorted line of eight values." %}
{% endviz %}

That is the merging machine. Give it a mountain whose length is a power of two, and it hands back a sorted line. What it cannot do yet is make mountains.

### Pairs are tiny mountains

A shuffled list is not a mountain, so the network builds them from the bottom up. Any two numbers already form a bitonic pair, and one comparator sets them to climb or to fall. The article describes its recursive sorters as producing two monotonic sequences, one decreasing and one increasing, which feed the next stage.

Take three, seven, four, eight, six, two, one, five. Stage zero compares neighbors, and the second and fourth pairs run downhill. The output is three, seven, eight, four, two, six, five, one.

{% viz scene="books/handwired-bitonic-sorter/chapter-2" section="chapter-2-pairs-are-mountains" cue="0" from="0.000" to="42.075" title="Stage zero sorts pairs up and down, and the output is already a row of mountains." %}
{% endviz %}

Sorted up beside sorted down is exactly a mountain, which is why the directions alternate. Two sorted runs become one bigger bitonic series for the next stage.

### Merging the blocks, stage by stage

Two blocks of four merge with half-cleaners at distance four, then two, then one. After the third stage the four smallest values sit on the left: three, four, two, one. Two more stages finish the job, and after the sixth stage the line reads one, two, three, four, five, six, seven, eight.

Count the work. Six stages, each with four comparators on separate wires, make 24 comparators, and all four in a stage fire together, so the whole sort takes six steps in time. The distances go one; two, one; four, two, one. That is one plus two plus three, six stages in all.

{% viz scene="books/handwired-bitonic-sorter/chapter-2" section="chapter-2-merging-blocks" cue="4" from="42.075" to="86.483" title="Three merges at distances four, two and one finish a sorted eight-wire line." %}
{% endviz %}

### The wiring never looks at the data

The comparators never choose where to look. The wiring depends only on the number of wires, and only the swaps depend on the values. That is what lets a fixed machine run the same sort on any input.

The check is exhaustive where it can be. All 256 zero-one lists at eight wires came out sorted, and all 65,536 at sixteen did too. Random lists at every size from two to sixty-four wires matched the built-in sort. Thirty-two and sixty-four wires were sampled that way, not checked exhaustively.

{% viz scene="books/handwired-bitonic-sorter/chapter-2" section="chapter-2-wiring-never-looks" cue="8" from="86.483" to="120.373" title="The same fixed comparators sort every input; only the swaps change." %}
{% endviz %}

### Stages grow like k(k+1)/2

Let the list have two to the k wires. The last merge takes k stages, the merge before it k minus one, and so on down to one. Add them up and you get k times k plus one, over two. For two through sixty-four wires that is one, three, six, ten, fifteen and twenty-one stages, so each doubling adds only a few more.

Every stage has half as many comparators as wires. The total is the number of wires times k times k plus one, over four: one, six, 24, 80, 240 and 672 comparators.

{% viz scene="books/handwired-bitonic-sorter/chapter-3" section="chapter-3-stages-grow" cue="0" from="0.000" to="41.215" title="The stage count grows like k(k+1)/2 as the wires double." %}
{% endviz %}

### Comparators nearly triple as the list doubles

In the usual shorthand, comparators grow like n log squared n, and stages like log squared n. Going from 32 to 64 wires takes the stages from 15 to 21 and the comparators from 240 to 672, about 2.8 times as many. Each stage holds 32 comparators at 64 wires, and all of them can act in the same instant.

That suits hardware with many units in lockstep. The article points to a typical GPU. It also says many consecutive operations in a bitonic sort keep locality of reference, which makes implementations more cache-friendly. That is the article's claim, and we did not measure it.

{% viz scene="books/handwired-bitonic-sorter/chapter-3" section="chapter-3-comparators-triple" cue="3" from="41.215" to="81.839" title="Stages rise gently, but comparators climb steeply with the list length." %}
{% endviz %}

### Lengths that are not powers of two

The original design needs a list whose length is a power of two. For other lengths the article suggests sentinel values. Pad with a value bigger than everything, sort, and drop the extras. Our check ran that for every length from one to sixty-four.

It is easy to get a stage wrong. Read literally, the article's loop uses an inclusive bound and runs one comparison too far, into the neighboring block. At eight wires that fails eight of the 256 zero-one lists. Batcher's odd-even merge sort needs fewer comparators, 543 at 64 wires against bitonic's 672, though the article says bitonic is typically higher.

The staircase in one sentence: half as many comparators as wires per stage, k times k plus one over two stages, and wiring that never looks at the data.

{% viz scene="books/handwired-bitonic-sorter/chapter-3" section="chapter-3-lengths-and-traps" cue="6" from="81.839" to="132.122" title="Padding fixes the length, but one loop bound breaks the sort." %}
{% endviz %}

### A circuit of sums and ReLU

Handwired writes a program as one fixed circuit of weighted sums and ReLU, over 32-bit floats. ReLU keeps a positive number and turns a negative one into zero. The circuit is cut into layers: operations that do not depend on each other share a layer, and each layer reads only earlier ones. So a program's cost has two numbers, the operations in all and the layers deep.

{% viz scene="books/handwired-bitonic-sorter/chapter-4" section="chapter-4-circuit-of-sums" cue="0" from="0.000" to="41.053" title="A program is a fixed circuit of sums and ReLU, cut into layers." %}
{% endviz %}

### A comparator is four operations in three layers

A sort that branches on comparisons cannot be written that way. A sorting network can, because its comparators never depend on the data. A compare-exchange on keys alone is a minimum and a maximum: subtract the two keys, run the difference through ReLU, subtract that from the first key for the minimum, and add it to the second for the maximum. That is four operations in three layers.

Twenty-one stages at three layers each predicts 63 layers for 64 keys. Handwired measured 64 layers and 2,752 operations for the bitonic network on keys only. The notes do not explain the small gap to the 2,688 that four times 672 would give, so read these as measurements, not a derivation.

{% viz scene="books/handwired-bitonic-sorter/chapter-4" section="chapter-4-comparator-in-three-layers" cue="3" from="41.053" to="81.677" title="One comparator is four operations in three layers, and the measured network costs what the notes say." %}
{% endviz %}

### Payloads, ranks, and the race

Real lists carry a payload, like a photo that travels with its key. With one payload value per item, the bitonic network at 16 items measured 1,248 operations in 50 layers. The rival needs no network. A rank counts the items ahead of this one, comparing every pair. Equal keys break ties by index, and that count is the sorted position. A one-hot read then fetches the payload.

At 16 items counting wins on work, 1,056 operations against 1,248, and in five layers against 50. At 64 items the network wins on work, 10,624 operations against 16,512, but it is 105 layers deep while counting stays at five. Pairs grow with the square of the item count. The notes still call counting the better formulation for the item counts UIs usually have, with trouble starting around hundreds of items.

{% viz scene="books/handwired-bitonic-sorter/chapter-4" section="chapter-4-payloads-and-ranks" cue="6" from="81.677" to="144.673" title="Counting ranks wins at 16 items, and the network wins on work at 64." %}
{% endviz %}

### Caveats and the open question

One caveat: minimum and maximum built from arithmetic drift on fractional keys. On the odd-even network, 20 to 24 percent of outputs were not bit-equal to any sorted input, with errors up to six in a hundred thousand. Integer keys are exact.

The verdict, from that historical record, is that at interface sizes counting ranks is the better choice. Whether to package a sorting network for apps that sort well past 64 items is still an open question.

{% viz scene="books/handwired-bitonic-sorter/chapter-4" section="chapter-4-caveats-and-verdict" cue="11" from="144.673" to="171.085" title="Fractional keys drift, and at interface sizes counting ranks." %}
{% endviz %}

The main sources are the Wikipedia article [Bitonic sorter](https://en.wikipedia.org/w/index.php?title=Bitonic_sorter&oldid=1373262602) at revision 1373262602, and Batcher's paper [Sorting networks and their applications](https://doi.org/10.1145/1468075.1468121), which we cite through the article. The Handwired claims come from the repository at commit [4ea7fcb](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46), especially its [execution model](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/docs/execution-model.md) and [patterns](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/docs/patterns.md) docs, and from the exploration notes at commit d01b763. The sources page under the player lists each spoken claim with its file and lines.
