# Generative Fields

This book follows the lab `lab/generative-fields` in Cheng Lou's [handwired](https://github.com/chenglou/handwired) repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)). One fixed circuit is steered by seventy-two numbers to lay out a page. The lab asks whether those numbers can be found automatically, and whether the layouts they produce are any good.

### Seventy-two numbers, one circuit

A page needs a layout: which items are big, which come first, and where each row breaks. The field vector behind this lab has seventy-two numbers, which are eight global knobs plus four fields for each of sixteen slots. The viewport size is held aside as context. Each slot has an importance, an order key, a visibility and a height preference, all from zero to one. What makes one slot differ from another lives only in those cells, never in a code branch.

{% viz scene="books/handwired-generative-fields/chapter-1" section="chapter-1-seventy-two-numbers" cue="0" from="0.000" to="31.150" title="Seventy-two numeric cells steer one fixed circuit." %}
{% endviz %}

Every slot runs the same sub-circuit. The only things that tell one slot from another are its field values and its slot index, which enters as the tie-break.

### Importance, order and rows

Importance becomes size. A slot's span is a base span plus its importance times a coefficient, capped at one full row by a relu trick. Its height follows the same pattern, scaled by its height preference. Order keys decide who goes first. The circuit compares every pair of keys, and when two keys are exactly equal, the lower slot number wins.

{% viz scene="books/handwired-generative-fields/chapter-1" section="chapter-1-importance-order-and-rows" cue="3" from="31.150" to="61.533" title="Importance sets width, order keys set sequence, and rows wrap." %}
{% endviz %}

Then the slots flow like words in a paragraph. A slot that would overflow the current row starts a new row, and each row is as tall as its tallest member.

### One numeric change, many layouts

A hero is just an importance peak. One slot with a big importance gets a wide span, and it crowds the others out of its row. Now change only numbers. The same sixteen slots reshape into a uniform grid, then a hero with a rail, a mosaic, a list and a filmstrip.

{% viz scene="books/handwired-generative-fields/chapter-1" section="chapter-1-one-change-many-layouts" cue="6" from="61.533" to="100.229" title="Changing only numbers reshapes the same sixteen slots." %}
{% endviz %}

Between those five families the code reports zero new operations. The program is not small: the code prints 8,421 operations in 201 layers. The flow costs depth, because each wrap decision feeds the next cursor.

### Five scores and one short list

Every family gets a fitness score. The grid scores 0.894 and the mosaic 0.823. The list shows six of sixteen slots, because its visibility hides the rest, since sixteen rows would overflow.

{% viz scene="books/handwired-generative-fields/chapter-1" section="chapter-1-five-scores-and-the-list" cue="10" from="100.229" to="124.320" title="Each family gets a fitness score, and the list hides ten slots." %}
{% endviz %}

So the first claim is narrow and solid: one program, five layouts, set only by numbers. Whether those numbers can be found automatically, and whether they are any good, comes next.

### The circuit grades its own output

The circuit grades its own work. It outputs a validity bit that is exactly one or zero, plus a depth in pixels saying how badly a layout breaks the rules. Three rules are checked: no two visible slots overlap, nothing runs past the bottom or right edge, and nothing is too small. The right edge allows a small wrap margin, and a half-pixel tolerance applies. Sideways overlap is impossible by construction, since the cursor only moves forward and spans are capped.

{% viz scene="books/handwired-generative-fields/chapter-2" section="chapter-2-circuit-grades-its-output" cue="0" from="0.000" to="35.921" title="The circuit scores its own validity and depth." %}
{% endviz %}

Overlap never occurred in four thousand samples. Only a crafted triple of almost-equal keys can cause it, so the claim holds by construction with that one exception.

### Search draws four thousand layouts

The first way to find a layout is search. Draw four thousand random field vectors, and test each one. Only one thousand seventy-eight are valid, about twenty-seven percent. The most common failure is spilling out of the viewport: two thousand eight hundred eighty-six samples.

{% viz scene="books/handwired-generative-fields/chapter-2" section="chapter-2-search-draws-four-thousand" cue="3" from="35.921" to="76.893" title="Random search finds valid layouts and ranks them." %}
{% endviz %}

To rank the valid ones, seven weighted terms add up: fill, vertical fit, importance match, balance, size comfort, row evenness and content richness. Any valid layout beats any invalid one. Search's best layout scores 0.875, and the whole four-thousand-sample search took about a quarter second on this machine.

### Gradient ascent needs a fake slope

The second way is to slide uphill. Gradient ascent minimizes minus fitness plus a small penalty on violation depth, taking one hundred fifty steps from each of twelve random starts. But decisions in this circuit are bits, and bits have no slope. So the backward pass fakes one, a straight-through estimate: forward values stay exact, and the derivative through a decision is set to one.

{% viz scene="books/handwired-generative-fields/chapter-2" section="chapter-2-gradient-needs-a-fake-slope" cue="7" from="76.893" to="111.989" title="Straight-through gradients climb through bit decisions." %}
{% endviz %}

That fake slope is biased. On one probe the readme measured one hundred seventy-three where the true local slope was one hundred twenty, so the magnitudes are not derivatives.

### Search and climbing disagree about taste

In today's run, all twelve climbs end valid, with a best of 0.919, a median of 0.888, and a worst of 0.849. Search's best was 0.875. Yet the best climbed layout shows only six slots out of sixteen.

{% viz scene="books/handwired-generative-fields/chapter-2" section="chapter-2-search-and-climbing-disagree" cue="10" from="111.989" to="146.146" title="Twelve climbs end valid, but they prefer slab-like layouts." %}
{% endviz %}

Fitness can be gamed. With the richness term removed, a hand-built layout with just two visible slots scored a perfect one. The richness term now rewards up to ten visible slots, but climbing still prefers six. Search and gradient optimize the same number and disagree about taste, so the fitness function is the bottleneck.

### One hero migration stays valid

Moving between layouts is what an interface does all the time, so the layouts in between should be valid too. Start with one careful case. In the hero migration, importance slides from slot two to slot eleven over twenty-one points along the path. Slot two falls from about one hundred twenty-nine thousand square pixels to twenty-four thousand, and slot eleven rises.

{% viz scene="books/handwired-generative-fields/chapter-3" section="chapter-3-one-hero-migration" cue="0" from="0.000" to="32.485" title="One hero hands its importance to another, and every point stays valid." %}
{% endviz %}

They cross at sixty-six thousand four hundred forty-three square pixels each, and all twenty-one points are valid. That is one chosen pair, and it says nothing about layouts in general.

### Straight lines mostly fail

Now more pairs. The study walks sixty pairs of layouts, ten among the authored families and fifty random ones, each a straight line of a hundred and one points: six thousand sixty points in all. Straight lines mostly fail. Only nineteen hundred six points are valid, thirty-one percent, and just one of the sixty paths is valid from end to end.

{% viz scene="books/handwired-generative-fields/chapter-3" section="chapter-3-straight-lines-mostly-fail" cue="3" from="32.485" to="65.004" title="Most straight paths between layouts break the page." %}
{% endviz %}

Every one of the four thousand one hundred fifty-four invalid points is the same kind: the layout spills past the bottom of the viewport. No point has overlapping slots.

### A projection repairs every point

The repair is a projection. Take small steps downhill on violation depth, with a gentle pull back toward where the point started, and stop the moment the validity bit reads one. It works. On average it takes one point nine steps, out of forty allowed, and all six thousand sixty points end valid. Not one repair fails.

{% viz scene="books/handwired-generative-fields/chapter-3" section="chapter-3-a-projection-repairs-every-point" cue="6" from="65.004" to="98.325" title="A short projection repairs every invalid point." %}
{% endviz %}

But the validity bit never asked for content to stay. In the July study, 1,408 of the 4,154 repairs hid visible slots, and one cut sixteen visible slots to six.

### Valid is not the same as smooth

The September audit adds separate reports: required content retained, and strict containment with no slack. A layout can pass the old validity bit and fail both. And valid points still do not make smooth motion. Sorting, visibility and wrapping can jump between neighbors.

{% viz scene="books/handwired-generative-fields/chapter-3" section="chapter-3-valid-is-not-smooth" cue="9" from="98.325" to="147.540" title="Valid samples are not yet a smooth transition." %}
{% endviz %}

The status table gives this lab no tag, only its limits, so the fair reading is historical and narrowed. Still open are a sixty-hertz transition driven by the projection, a second flow region, and learned fitness weights. Today: one program, many layouts, repaired to valid, not yet proven smooth.

The main sources are the handwired repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, especially its [generative fields README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/generative-fields/README.md), and its [status table](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md). The numbers in this post come from one run of the lab's experiments script at that commit, except the July figures, which the README records as historical. The sources page under the player lists each spoken claim with its file and lines.
