# UI Exploration

Handwired's README rewrites one branch as arithmetic, and this book asks whether that style can carry a whole user interface. It follows [chenglou/handwired](https://github.com/chenglou/handwired) at commit [4ea7fcb27ebe93acf49b9f29a93e162b975bad46](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46), and the lab folder [`lab/ui-exploration`](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/ui-exploration), which records one night of exploration in September 2026. JavaScript only writes inputs and reads outputs.

### Rows by counting

A virtualized list has to find which row is on top, and the circuit has no search. Dividing the scroll position by the row height and rounding down gives the answer exactly. The row number is then taken modulo the number of slots, so each row always lands in the same slot.

{% viz scene="books/handwired-ui-exploration/chapter-1" section="chapter-1-rows-by-counting" cue="0" from="0.000" to="57.121" title="A scroll position picks the first row by division, and each row takes a slot by modulo." %}
{% endviz %}

JavaScript floors the scroll position onto a quarter-pixel grid before writing it. Each slot also gets a visibility bit: whether the row's top is above the viewport's bottom edge. That is one comparison per row, and the bit is exactly zero or one.

### Two hundred eighty operations

With uniform row heights and row data kept in JavaScript, the whole virtualized list is 280 operations in 19 layers. The same holds at one thousand rows or one hundred thousand.

{% viz scene="books/handwired-ui-exploration/chapter-1" section="chapter-1-two-hundred-eighty-operations" cue="5" from="57.121" to="77.253" title="The virtualized list stays at 280 operations however many rows it has." %}
{% endviz %}

Scope matters. Putting the row data into the circuit's own source cells makes the same list cost 20,305 operations.

### Fit bits instead of a walk

Breaking a paragraph into lines usually means walking word by word until one no longer fits, and the circuit cannot loop. For a line starting at a segment, though, each later segment either fits within the maximum width or does not, and those answers read one, one, one, zero, zero, zero.

{% viz scene="books/handwired-ui-exploration/chapter-1" section="chapter-1-fit-bits" cue="7" from="77.253" to="111.456" title="A line's fit bits read one, one, one, then zero, so the first miss is a count of the ones." %}
{% endviz %}

The first segment that does not fit is therefore just the count of fit bits. The next line starts that many segments along, and its painted width is a sum gated by the same bits.

### Text around a window

At lab scale, 48 words in 95 segments flow around a window in 14,760 operations and 215 layers, with 96 word springs. Lines still come one after another, so depth grows with every line.

{% viz scene="books/handwired-ui-exploration/chapter-1" section="chapter-1-text-around-a-window" cue="10" from="111.456" to="141.735" title="Text flows around a window with a spring per word, and each line waits for the one before it." %}
{% endviz %}

Walking lines is a sequential scan that the lab's rewrites shrink but do not remove. The pattern holds throughout: when a predicate flips once, count it, because counting turns a search into arithmetic that a fixed circuit can do.

### Copies versus instances

The lab ports the 221-photo gallery from chenglou.github.io. Copying the whole circuit once per photo costs 57,135 operations in 67 layers, and that grows with every photo.

{% viz scene="books/handwired-ui-exploration/chapter-2" section="chapter-2-copies-versus-instances" cue="0" from="0.000" to="57.225" title="Copying the circuit per photo grows with the photo count, while the per-photo program runs as instances." %}
{% endviz %}

Write the per-photo program once instead, and run it as instances, with reductions between stages for what photos share. Four hundred one operations are shared, and each photo then costs 233 operations at 221, 1,000 and 10,000 photos. On the processor that is 65 microseconds against 546 at 221 photos, and 4,106 against 43,027 at 10,000 photos. The timings are rough.

### Springs and arrays

Springs are the next loop. One semi-implicit Euler step updates a spring's velocity from its stiffness and damping, and that is a two-by-two matrix acting on the spring's distance from its destination and its velocity.

{% viz scene="books/handwired-ui-exploration/chapter-2" section="chapter-2-springs-and-arrays" cue="5" from="57.225" to="93.053" title="Catching up many fixed spring steps is one matrix raised to a power." %}
{% endviz %}

In the spring bank that cut the circuit from 5,253 operations to 3,580. Arrays are next: reading a value at an index used to need an integer one-hot over the table's positions, and the runtime now has an index read instruction, so reading one element is a single operation.

### An index read lands

The README says the index read changes the cost of lists, text and slot routing more than anything else measured. That is its comparison, not a ranking, and the instruction has landed in the runtime.

{% viz scene="books/handwired-ui-exploration/chapter-2" section="chapter-2-an-index-read-lands" cue="8" from="93.053" to="114.090" title="Pointer jumping gets a paragraph's line count and widest line in 66 layers at 1,023 segments." %}
{% endviz %}

It doesn't remove every scan. The pointer jumping measurement gives the line count and widest line only, not the line starts, and it costs 35,914 operations beyond the table.

### A band of pointers

The gallery also has a catch. Far down it, pointers inside a 0.18 px band between index.ts's box edges and the circuit's box edges get a different hover and click.

{% viz scene="books/handwired-ui-exploration/chapter-2" section="chapter-2-a-band-of-pointers" cue="10" from="114.090" to="137.461" title="Far down the gallery, a thin band of pointers hovers and clicks differently from the native boxes." %}
{% endviz %}

So the instance axis, matrix powers and index reads each trade a loop for arithmetic, and each has a scope. The gallery is the one UI where exact order of operations mattered beyond rounding points: in the other six of seven, strict FP32 order mattered only at rounding points.

### Gradient steps on a drag

When a designer drags a card's edge, one backward pass asks which of five design numbers should move: padding, gap, minimum card width, sidebar width or title scale. The solver then takes a gradient step.

{% viz scene="books/handwired-ui-exploration/chapter-3" section="chapter-3-gradient-steps-on-a-drag" cue="0" from="0.000" to="57.075" title="A gradient step is exact inside a decision region and misleading across one." %}
{% endviz %}

The test is 500 scripted drags of six frames each, with 2,999 frames that actually move. With booleans frozen, one gradient step solved 63.6 percent of them on the app shell. The same strategy solved 37.6 percent of 1,500 moving frames on the candidate gallery. Decisions are why: at the start, every unlocked knob had a zero gradient in 24.6 percent of app shell frames.

### Search takes over

Where the gradient fails, search takes over. 256 candidate knob settings run as instances of the same circuit, and the closest valid one wins.

{% viz scene="books/handwired-ui-exploration/chapter-3" section="chapter-3-search-takes-over" cue="5" from="57.075" to="91.290" title="Search evaluates 256 knob settings as instances, and keeps the closest one that is valid." %}
{% endviz %}

Most of the UI logic the prototypes ported became a circuit: lists, springs, layout, the gallery and a comment thread. Combining those wins was richer, not cheaper, at 19,854 operations with word springs and 18,027 without, against 5,253 before.

### Learning and timing

Learning was weak. None of 48 runs learned a task exactly at base settings, though counting units learned one rung exactly when trained on every case.

{% viz scene="books/handwired-ui-exploration/chapter-3" section="chapter-3-learning-and-timing" cue="8" from="91.290" to="128.871" title="Learning stays inexact at base settings, and chenguini's demos drift with frame rate." %}
{% endviz %}

In chenguini's demos, a new spring destination mid-animation lands 157 pixels apart between 30 and 120 frames per second. The runtime now steps springs to each event's time. And zero mismatches always means over the traces named, not a proof: in lists at 100 cards, 7 of 20 runs flipped a settle decision, and positions differed by up to 21 pixels.

### The record of an exploration

The status page calls this folder the record of that exploration: its measurements describe the code as it was then. Index reads have landed, while what agents build apps from stays open.

{% viz scene="books/handwired-ui-exploration/chapter-3" section="chapter-3-the-record-of-an-exploration" cue="11" from="128.871" to="151.534" title="The folder is a dated record: index reads have landed, and what agents build apps from is still open." %}
{% endviz %}

So: a fixed circuit can write much of a user interface, by counting, instancing and matrix powers. It is richer, not cheaper, and learning it is still mostly open.

### Where the claims come from

The main sources are the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46: the lab's [overnight README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/ui-exploration/README.md), the lists, text-walker, instanced-items, event-time and drag-knobs READMEs, the list, walker and spring-math sources, and the [status page](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md). The sources page under the player lists each spoken claim with its file and lines.

[Watch all three narrated chapters](?bundle=handwired-ui-exploration).
