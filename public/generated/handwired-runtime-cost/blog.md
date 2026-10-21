Handwired compiles a program into layers of weighted sums, and its lab at `lab/runtime-cost` asks what a CPU pays to run one of those circuits. This book follows chenglou/handwired at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)). Most numbers below come from one run on one machine, and the text says which ones come from the README and which from a local rerun.

### Three runners, one circuit

The lab compares three ways to run the same compiled circuit: the literal reference, the tensor executor that returns a full wire array, and the tensor executor with reusable buffers that returns only the outputs you ask for. The question is how much of each call goes to allocating and copying memory. The measurement is steady-state CPU execution on an unchanged input, not event handling, GPU work, compilation or a browser frame.

{% viz scene="books/handwired-runtime-cost/chapter-1" section="chapter-1-three-runners-one-circuit" cue="0" from="0.000" to="23.487" title="Three runners execute the same circuit and differ in what each call allocates." %}
{% endviz %}

### What each call allocates

The reference allocates one fresh array on every call, sized for every source cell plus every operation, and then evaluates each operation as its own scalar step. The plain tensor executor allocates a whole new workspace on every call, runs the layers, then builds a full-width array and scatters each value into it. The reusable version builds its workspace once, plus one small output array, and each call copies out only the requested outputs.

The price is that the next call overwrites that output array, so anyone who wants to keep a frame has to copy it first.

{% viz scene="books/handwired-runtime-cost/chapter-1" section="chapter-1-what-each-call-allocates" cue="2" from="23.487" to="60.185" title="Each call allocates a fresh array, or reuses one and overwrites it." %}
{% endviz %}

### The harness and one run's numbers

All three paths check, on every call, that each source value sits inside its declared range, so that check is a shared cost and not a difference between them. The harness warms each method up 200 times, rotates the order between samples, takes seven samples, and throws if the outputs' checksums disagree.

The test circuit is the HandwiredOS window manager: 234 source cells, 4,646 live operations and 130 layers. On one run, the reference takes about 150 µs per evaluation, the full-array executor about 49 µs and the reusable one about 43 µs. Reusable is about 1.16 times faster than full array and about 3.5 times faster than the reference. That is one run on one machine in one process, and the lab itself warns against treating a single ratio as an architectural guarantee.

{% viz scene="books/handwired-runtime-cost/chapter-1" section="chapter-1-harness-and-one-runs-numbers" cue="6" from="60.185" to="113.080" title="The harness checks every call, and one run puts the reusable path about 1.16 times ahead of the full array." %}
{% endviz %}

### Sixteen thousand sums, three layer counts

The layer probe asks what a layer costs by itself. It builds the same 16,384 sums of two terms and arranges them as chains that give 64, 1,024 or 16,384 layers. With 64 layers, 256 chains run side by side, so each layer is 256 sums wide. With 16,384 layers there is one chain, one sum per layer.

A layer is a depth. Each operation sits one level above the deepest thing it reads, and the compiler gives every level its own layer. Each layer copies its inputs out of one shared array, does its sparse sums, and rounds every product and every partial sum to a 32-bit float. Then it copies its results back.

{% viz scene="books/handwired-runtime-cost/chapter-2" section="chapter-2-sixteen-thousand-sums-three-layer-counts" cue="0" from="0.000" to="53.092" title="The same sums, arranged into 64, 1,024 or 16,384 layers, isolate what a layer costs." %}
{% endviz %}

### Same totals, different layer counts

Across the three shapes the totals match: 32,768 input reads, 16,384 outputs and the same stored weights. With the totals fixed, the time difference tracks the number of layers, not the amount of arithmetic. Each shape runs in its own process, and each answer is checked against its exact value.

The README reports 54 to 55 µs per evaluation at 64 layers, 64 to 65 µs at 1,024 and 210 to 214 µs at 16,384. Those figures come from Bun 1.4.3 on an Apple M5 Max at a load average of about 4. The lab shows that the time follows the layer count; it does not test why.

{% viz scene="books/handwired-runtime-cost/chapter-2" section="chapter-2-same-totals-different-layer-counts" cue="5" from="53.092" to="85.774" title="The totals stay fixed, so the layer count is the variable that moves the time." %}
{% endviz %}

### A slope, a local rerun and an older figure

The README puts the layer cost at about 10 µs per 1,000 layers. A local rerun on an Apple M4 Max at a load of about 9 gave 67, 77 and 250 µs for the three shapes. The slope stayed near ten, but the absolute numbers moved.

The docs blame copying values for that cost. Copy volume is the same in all three shapes, though, so the part that grows is fixed work per layer. That reading is ours, and the lab does not test it. The status page adds one historical figure: an earlier executor took 709 µs at 16,384 layers, and after a change to how each layer's outputs are copied the same probe took 250 µs. That supports the view that layer overhead is real, but it is one measurement.

{% viz scene="books/handwired-runtime-cost/chapter-2" section="chapter-2-a-slope-a-local-rerun-and-an-older-figure" cue="8" from="85.774" to="128.128" title="The published slope holds on a rerun, and the cause stays an inference." %}
{% endviz %}

### The window manager's layer shape

The window manager is neither tall nor wide. In a local compile, its first layer holds 401 operations and its sixth holds 10, and near the end it widens again to 133. The status page gives its median layer as 26.5 operations, and the widths add up to 4,646.

So the layer toll is paid 130 times in this circuit, not 16,384. That may be part of why the real circuit sits so far from the worst case, but the lab does not test that link.

{% viz scene="books/handwired-runtime-cost/chapter-3" section="chapter-3-the-window-managers-layer-shape" cue="0" from="0.000" to="29.070" title="The window manager's layers are uneven, so it pays the per-layer toll far fewer times than the worst case." %}
{% endviz %}

### Smaller circuits and the copy loop

Two smaller circuits show the same ordering in a local run. On the candidate gallery the reference takes about 19 µs, the full array 4.6 and the reusable evaluator 3.2. The coordinate transform, four operations in three layers, gains little: about 93 ns for the reference, 78 for the reusable path, and 29 for plain scalar JavaScript. Reusable beats full array by about 1.53 times there, 1.46 on the gallery and 1.16 on the window manager. In this one run the smallest circuit gains most.

There is a caveat in the harness. The reference and full-array runners are wrapped in a `select()` that copies the requested roots on each call, and the reusable runner is not. Part of the gap may be that copy. Its size has not been measured.

{% viz scene="books/handwired-runtime-cost/chapter-3" section="chapter-3-smaller-circuits-and-the-copy-loop" cue="3" from="29.070" to="76.230" title="Smaller circuits order the same way, but the harness wraps two runners in an extra copy." %}
{% endviz %}

### The lab's status and its limits

The README warns that timing several programs in one process can distort later timings. A standalone run of the window manager alone gave about 47 µs, against about 43 in the shared run. That is within noise, so it neither confirms nor refutes the warning.

The status is plain. Reusable buffers hold as an interface, on the CPU only. The layer probe is narrowed to one local figure at a stated load. The three-way absolute timings come from one run, not a standing result. Events, GPU work, compilation and browser frames are not measured. Smarter layer scheduling is parked, because the latest-legal version increased gathered inputs.

To recap: a call can allocate or reuse its buffers, a layer costs about 10 µs per 1,000 layers, and real circuits are wide at first, thin in the middle and wider again at the end. Rerun locally before trusting any one ratio.

{% viz scene="books/handwired-runtime-cost/chapter-3" section="chapter-3-the-labs-status-and-its-limits" cue="7" from="76.230" to="127.012" title="Status, plainly: one run, one machine, and layer scheduling parked." %}
{% endviz %}

### Sources

The main sources are the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, especially its [lab README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/runtime-cost/README.md), its [layer probe](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/runtime-cost/layers.ts) and [report harness](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/runtime-cost/report.ts), the [tensor executor](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/src/runtime/numeric-ui-core.ts), the [window manager README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/src/handwiredos/README.md), the [patterns doc](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/docs/patterns.md) and the [status page](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md). The sources page under the player lists each spoken claim with its file and lines.
