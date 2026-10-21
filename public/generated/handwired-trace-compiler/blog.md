# Trace Compiler

Cheng Lou's [handwired](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46) repository, pinned at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, has a lab for a numeric compiler, `lab/trace-compiler`. The question is whether real layout code from Cheng's photo gallery, the widths, columns and positions of 221 photos, can become a fixed circuit that gives the same answers. The lab works on a frozen copy of the gallery's source from June 20, 2026, so its measurements can be repeated. This post follows the lab's four chapters and says where its claims hold and where they stop.

### The compiler reads a syntax tree

The compiler is not a tracer that watches the program run. It reads the source as a syntax tree and carries symbolic values, each one a constant or a wire. It does not compile arbitrary JavaScript; the subset is numbers, fixed arrays, bounded loops and ternaries.

{% viz scene="books/handwired-trace-compiler/chapter-1" section="chapter-1-source-as-tree" cue="0" from="0.000" to="32.043" title="The compiler walks the source as a syntax tree, folding constants and turning the rest into wires." %}
{% endviz %}

Anything known in advance folds away. In a width minus 24, divided by 244, the 24 and the 244 are constants, so the division becomes one multiply by one over 244. The substrate has no division, so `a / b` lowers to `a * (1/b)`.

### Folding and rounding

The reciprocal of 244 is rounded once to single precision, about four thousandths, and the lab's interpreter does the same. That is an explicit arithmetic policy, not JavaScript's own division.

{% viz scene="books/handwired-trace-compiler/chapter-1" section="chapter-1-folding-and-rounding" cue="3" from="32.043" to="64.343" title="The reciprocal is rounded once, and the width becomes a wire whose subtraction is kept as a rounding point." %}
{% endviz %}

The width is only known at run time, so it becomes a wire. Each subtraction is tagged as a rounding point, so the builder can't merge it into the next step and erase the rounding.

### A conditional becomes two products

A conditional becomes two products and a sum: the chosen value times the bit, plus the other value times one minus the bit. Both multiply by exactly one or zero, so nothing re-rounds.

{% viz scene="books/handwired-trace-compiler/chapter-1" section="chapter-1-conditional-as-products" cue="6" from="64.343" to="98.418" title="A conditional is two products and a sum, and a branch too large for single precision is rejected up front." %}
{% endviz %}

The older library select form added the bit times a difference. With plus and minus three times ten to the thirty-eighth, that difference overflows, and a bit of zero returned not a number. The two-product form hands back the first value untouched. Because both branches always compute, a branch that can't fit in single precision is rejected up front.

### Loops and the subset

A loop with a finite integer bound unrolls across every possible count, and a mask bit for each pass decides which writes actually count. What comes out is the kind of circuit the first book built, weighted sums and relu, now generated from real source instead of written by hand.

{% viz scene="books/handwired-trace-compiler/chapter-1" section="chapter-1-loops-and-the-subset" cue="9" from="98.418" to="125.388" title="A bounded loop unrolls with a mask bit per pass, and the result is a circuit of weighted sums and relu." %}
{% endviz %}

The subset is small on purpose: numbers, fixed arrays, bounded loops, ternaries. It does not compile arbitrary JavaScript.

### The gap at width 1732

Back to the width of 1732. After the multiply, the value lands just under seven, and the compiler has to say whether it is below seven. The two numbers sit one step apart, a gap of about 4.8 times ten to the minus seven, which is the smallest difference single precision can express here.

{% viz scene="books/handwired-trace-compiler/chapter-2" section="chapter-2-the-gap-at-1732" cue="0" from="0.000" to="33.797" title="At width 1732 the product lands one single-precision step below seven, and the comparison has to tell them apart." %}
{% endviz %}

The July design scaled the difference into a score near one half and rounded it. At exact column boundaries it lost that tiny step, and the column count came out wrong.

### Relu and powers of two

The replacement first keeps only positive differences with relu. Zero or negative differences come out as zero, so equal values never register as less.

{% viz scene="books/handwired-trace-compiler/chapter-2" section="chapter-2-relu-and-powers-of-two" cue="3" from="33.797" to="77.833" title="A relu keeps positive differences, then powers of two and clamps lift them to exactly one." %}
{% endviz %}

Then it scales by a power of two chosen from the value's declared range. For a difference bounded by seven, that's two to the twentieth, and the one-step gap becomes one half. A clamp holds anything above one at one. Another scale by two to the twenty-third turns one half into four million, and the next clamp pins it to exactly one. This is exact because scaling by a power of two only shifts the exponent, and the clamp, a value minus relu of the value minus one, stays exact below two to the twenty-fourth.

### Stages and the zero bit

The loop doesn't stop there. It keeps scaling until even the smallest positive single-precision number would reach one, six scale stages for a range of seven. If the difference is zero, it stays zero through every stage. The lab's argument is that the bit then matches a native comparison on every input in range, ties included.

{% viz scene="books/handwired-trace-compiler/chapter-2" section="chapter-2-stages-and-the-zero-bit" cue="7" from="77.833" to="107.241" title="Six scale stages take the smallest positive value to one, and a zero difference never leaves zero." %}
{% endviz %}

What comes out is a clean zero or one, marked as an integer in the range zero to one. The current test circuits use no boolean atoms.

### Scope, and a library routine

The lab is careful about scope. This is exact going forward, but it doesn't make hard comparisons usefully differentiable, and it doesn't prove a long cascade is the fastest way to run.

{% viz scene="books/handwired-trace-compiler/chapter-2" section="chapter-2-scope-and-library" cue="10" from="107.241" to="129.381" title="The comparison is exact going forward, while the library's planned routine is a separate lowering choice." %}
{% endviz %}

A newer library routine plans these stages from declared ranges, fifteen operations for a comparison over zero to sixteen thousand. The compiler still builds its own cascade.

### Five calculations, one trial

Exactness is a claim, so the lab tries to break it. Every sampled trial feeds one input through five separate calculations. Three must agree on the circuit's outputs: a literal reference evaluator, the compiled execution path, which is still JavaScript and not a graphics chip, and a single-precision interpreter of the source. The other two ignore the circuit. One interprets the source in double precision, and one runs the real source natively in the JavaScript engine. Those two must agree with each other.

{% viz scene="books/handwired-trace-compiler/chapter-3" section="chapter-3-five-calculations" cue="0" from="0.000" to="44.617" title="One input runs through five calculations, and three of them must agree on the circuit's outputs." %}
{% endviz %}

That native lane exists because of a September review. The compiler and its interpreter had both dropped a return, so a wrong answer looked verified. Those cases now have regression tests.

### Counts, and their limits

The report checked 1,174,491 circuit outputs and found zero mismatches. Most had all three comparisons; some were constants, and some were absent optional values.

{% viz scene="books/handwired-trace-compiler/chapter-3" section="chapter-3-counts-and-limits" cue="4" from="44.617" to="91.022" title="The report checks 1,174,491 circuit outputs and 1,193,491 native outputs, inside declared ranges and on one fixed seed." %}
{% endviz %}

Natively, it checked 1,193,491 double-precision outputs and found zero disagreements. The larger count includes object fields the program left unchanged. Scope matters. These are sampled trials inside declared input ranges, on the frozen fixture, with a fixed seed. The lab says plainly it is not a proof for every supported program. Precision is a separate question. Single and double precision are allowed to differ, and the report lists where, rather than calling it a compiler error.

### Six widths that differ

Of 4,097 integer widths, six differ: 512, 756, 1000, 1244, 1488 and 1732. At those widths the single-precision reciprocal rounds so that one fewer column is chosen.

{% viz scene="books/handwired-trace-compiler/chapter-3" section="chapter-3-six-widths-that-differ" cue="8" from="91.022" to="117.180" title="Six of 4,097 integer widths choose one fewer column in single precision." %}
{% endviz %}

Then each column's width can differ by about two hundred forty pixels. The circuit matches single precision exactly, but that agreement doesn't hide the choice from a user.

### Drift, and a regression that is caught

A smaller case: one hundred million plus one, minus one hundred million, is zero with a rounding step after each single-precision operation, but one in native JavaScript. One regression adds one to the double-precision outputs, and the test confirms the native check catches it, even while the circuit and the single-precision interpreter still agree.

{% viz scene="books/handwired-trace-compiler/chapter-3" section="chapter-3-drift-and-regression" cue="10" from="117.180" to="138.902" title="Single precision drifts on a small sum, and a planted error is caught by the native check alone." %}
{% endviz %}

### The coverage wall

How much of the gallery's code gets through? The frozen render path has 221 statement units, and each one is either compiled and checked, or it isn't. The slices actually compile and verify 64 of them. That's 29.0 percent of all units, or 37.0 percent of the 173 that are classified as numeric.

{% viz scene="books/handwired-trace-compiler/chapter-4" section="chapter-4-the-coverage-wall" cue="0" from="0.000" to="41.646" title="Of 221 statement units, 64 are compiled and verified, and 49 more candidates have not been compiled." %}
{% endviz %}

A syntax-based classifier finds 49 more numeric candidates. They look compilable, but they haven't been compiled and verified, so they don't count. An earlier figure, 113 of 173, or 65.3 percent, added those candidates in. The lab now calls it historical, since a candidate is not compiled code.

### Cost and depth

Cost varies enormously. The spring snap needs zero operations, while the occlusion pass takes 25,416 and the two-dimensional layout 24,894.

{% viz scene="books/handwired-trace-compiler/chapter-4" section="chapter-4-cost-and-depth" cue="4" from="41.646" to="79.912" title="Operation counts vary by slice, and the one-dimensional layout is the deepest chain at 1,580 layers." %}
{% endviz %}

Depth is a different story. The one-dimensional layout takes 1,580 layers, because positions accumulate one photo after another through all 221. A parallel prefix sum would shorten that chain, but it would change the rounding order, so under this exactness rule it is not a free swap. Two rejection probes remain on purpose: hit testing that returns early from a search, and spring stepping with no bound on its loop.

### Named rejections, and what is next

The compiler rejects them under a named category instead of guessing. Also unsupported: dynamic array access, runtime allocation, string encoding, nonfinite sentinels and browser input and output.

{% viz scene="books/handwired-trace-compiler/chapter-4" section="chapter-4-named-rejections-and-next" cue="8" from="79.912" to="114.939" title="Unsupported constructs are rejected under named categories, and the next changes are measured rather than inferred." %}
{% endviz %}

This is not the entire application compiled unchanged, and neither measurement says anything about graphics-chip speed. The lab's next steps are bounded first-match selection and explicit gather declarations, with coverage treated as something to measure, not to infer from syntax.

### Standing

As for standing, the status page lists the trace compiler under runtime studies, with no verdict row. Its correctness note says the interpreter is checked against native JavaScript. Coverage is not on that page.

{% viz scene="books/handwired-trace-compiler/chapter-4" section="chapter-4-standing" cue="11" from="114.939" to="138.949" title="The status page names the trace compiler without a verdict, and the recap counts 64 of 221 units through the route." %}
{% endviz %}

So the route runs from source to a syntax walk, to wires, to an exact comparison, to five checks. Sixty-four of 221 units went all the way through.

The main sources are the lab's own files at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46: its [trace-compiler README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/trace-compiler/README.md), `compile.ts`, `compile.test.ts`, the frozen fixture's README, the [status page](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md) and the September 3, 2026 [reassessment](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/reassessment-2026-09-03.md). The sources page under the player lists each spoken claim with its file and lines.
