
# Three Layouts

Handwired is Cheng Lou's repository for writing programs as neural-net-style arithmetic: weighted sums, products with a ReLU, and no branch to skip. This book follows its candidate gallery, the lab in `lab/candidate-gallery`, at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)).

### Every answer is built, because nothing can be skipped

A gallery has to fit twelve photos into whatever window it is given, and a Handwired program cannot skip work. Its arithmetic is a fixed list of operations, and a ReLU, which is `max(0, x)`, zeroes negative values. Both branches of a decision are computed, and a bit picks one.

{% viz scene="books/handwired-candidate-gallery/chapter-1" section="chapter-1-every-answer-is-built" cue="0" from="0.000" to="21.734" title="A gallery with no branch builds every layout for twelve photos on every frame." %}
{% endviz %}

So this lab builds all the answers. On every frame it computes three complete layouts, and only afterwards decides which one to show.

### Three layouts, one program

Cinema is a hero image with a rail of thumbnails in two columns beside it. Clicking a thumbnail shows that photo in the hero, as the lab's README says. The Contact sheet has no hero: twelve equal thumbnails in four columns and three rows. Story puts a hero above thumbnails in three columns.

{% viz scene="books/handwired-candidate-gallery/chapter-1" section="chapter-1-three-layouts" cue="2" from="21.734" to="51.571" title="Cinema, Contact and Story are three rectangle recipes over the same twelve photos." %}
{% endviz %}

Every position is a sum of the stage's width, its height and a 14 pixel gap, with clamps along the way.

### The numbers on a 1,400 by 680 stage

On a 1,400 by 680 stage a Contact cell is 332.5 pixels wide and 208 tall. Its width is the stage width minus five gaps, divided by four, and its height is the stage height minus four gaps, divided by three.

{% viz scene="books/handwired-candidate-gallery/chapter-1" section="chapter-1-the-numbers" cue="5" from="51.571" to="82.523" title="One Contact cell is 332.5 by 208 on a 1,400 by 680 stage." %}
{% endviz %}

Cinema caps its rail at 280 pixels, which leaves a hero of 1,078 by 652. Story's hero is 394 tall, so its thumbnails get just over 50 pixels of height. Drag the stage narrower and every number slides along. Where a subtraction would go negative, a ReLU pins it at zero, so even a 20 pixel sliver gets finite sizes; the lab's tests check tiny viewports for exactly that.

### Building every answer costs 417 operations

The lab's guide puts the Dynamic UI demo, with its three layouts, clicks and focus, at 417 operations in 60 layers. Nothing is chosen yet; every frame computes every one of them.

{% viz scene="books/handwired-candidate-gallery/chapter-1" section="chapter-1-the-price" cue="8" from="82.523" to="99.567" title="The price of having no branch is that every layout is built, and the next step is to pick one." %}
{% endviz %}

Building every answer is the price of having no branch. The next question is how to pick one.

### A gauge is a size against its target

A layout is good when its pieces are big enough to see. Each size gets a gauge: the size times a scale, where the scale is the reciprocal of a target size, capped at 1. The lab's README gives the same definition.

{% viz scene="books/handwired-candidate-gallery/chapter-2" section="chapter-2-gauges" cue="0" from="0.000" to="30.824" title="Each size gets a gauge: the size times one over its target, capped at one." %}
{% endviz %}

A Contact cell targets 240 pixels. At 1,400 by 680 its width gauge is full, but its 208 pixel height reads 0.87. Cinema's four gauges all read 1 there. Story's thumbnails are 50 pixels tall against a target of 60, so its weakest gauge reads 0.84.

### The worst gauge is the score

A layout is only as good as its worst gauge, so its score is the smallest one. Handwired builds a minimum from a ReLU: the first number minus a ReLU of the difference gives the smaller of the two. The tournament that follows is a pair of comparisons.

{% viz scene="books/handwired-candidate-gallery/chapter-2" section="chapter-2-tournament" cue="3" from="30.824" to="59.002" title="Each layout's score is its smallest gauge, and the argmax compares two at a time." %}
{% endviz %}

The picker, argmax, compares two scores at a time: Cinema against Contact, then the survivor against Story. A bias one float step above a half sends exact ties left. What leaves the tournament is a one-hot: a 1 for the winner and a 0 for each loser. At 1,400 by 680 that is 1, 0, 0, and Cinema wins with a score of 1.

### Narrow the stage and the winner changes

Narrow to 984 by 730 and Cinema's hero shrinks to 666 pixels against a 900 target, so its gauge falls to 0.74. Contact wins, at 0.94 over Story's 0.93.

{% viz scene="books/handwired-candidate-gallery/chapter-2" section="chapter-2-narrow-and-flip" cue="6" from="59.002" to="89.861" title="Narrowing the stage moves the winner from Cinema to Contact to Story." %}
{% endviz %}

At 610 by 830, Contact's cells are 135 pixels wide, a gauge of 0.56. Its height gauge is a perfect 1, but only the worst gauge counts. Story's hero is 439 tall against a 440 target, its other gauges are full, and Story scores 0.998 and takes over.

### The flip is tight

The flip is tight. At 760 by 517 Contact wins, but at 600 wide Story wins, 0.555 against 0.552. A three-way tie, as at 1,280 by 800, goes to Cinema, the first candidate in the list.

{% viz scene="books/handwired-candidate-gallery/chapter-2" section="chapter-2-the-tight-flip" cue="9" from="89.861" to="105.790" title="At 600 wide Story edges out Contact, and an exact tie goes to the left candidate." %}
{% endviz %}

Ties pick the left candidate in both orders of the comparison, which the lab's status notes record.

### One bit multiplies every rectangle

The winner is just a 1 and two 0s. Twelve thumbnails and a hero still need rectangles, and they get them by multiplication, not by an `if`.

{% viz scene="books/handwired-candidate-gallery/chapter-3" section="chapter-3-one-bit-multiplies" cue="0" from="0.000" to="33.344" title="A one-hot bit multiplies each layout's value, and the products are summed." %}
{% endviz %}

Take thumbnail zero's left edge. Each layout offers a value; multiply each by its own bit and add. On the 1,400 by 680 stage the sum is Cinema's rectangle: left 1,106, top 14, 133 wide and 97 tall. The other two layouts were computed too, then erased by zero.

### The same sums place every thumbnail

Every thumbnail and the hero run the same four sums, one each for left, top, width and height. The Contact sheet has no hero, so its hero flag is zero.

{% viz scene="books/handwired-candidate-gallery/chapter-3" section="chapter-3-the-same-sums" cue="3" from="33.344" to="59.525" title="Every thumbnail and the hero are read from the picked layout with the same four sums." %}
{% endviz %}

At 984 by 730 the bit moves to Contact and thumbnail zero flies to the corner. At 610 by 830 it moves to Story and drops below the hero. Declared a one-hot, these products lower to gather reads: 26 in one group, and the stored weights fall from 940 to 848.

### A click reads the same rectangles

A click uses the same rectangles. Each thumbnail turns the click's distance from its nearest edge into a bit, and the first hit sets that photo's focus cell to 1.

{% viz scene="books/handwired-candidate-gallery/chapter-3" section="chapter-3-the-click" cue="6" from="59.525" to="78.565" title="A click is tested against every thumbnail's four edges, and the first hit takes focus." %}
{% endviz %}

At 1,400 by 680, a click one pixel inside thumbnail seven hits it. A quarter pixel inside misses, and focus stays put.

### Fourteen rounding points, and the status

The tests count exactly 14 rounding points: twelve thumbnail hit tests and two argmax comparisons. The rest is plain arithmetic.

{% viz scene="books/handwired-candidate-gallery/chapter-3" section="chapter-3-rounding-points-and-status" cue="8" from="78.565" to="110.573" title="The circuit's only rounding points are its 14 boolean atoms, and the lab is a working page with nothing learned." %}
{% endviz %}

The status is plain: the lab is a page you resize and click, moved into the lab folder on September 17, 2026, and measured by runtime-cost. Nothing is learned; the scales are written by hand. So the program never branches. It builds every layout, scores each by its worst gauge, and multiplies the losers by zero, every frame.

The main sources are the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46: its [README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/README.md), its [docs index](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/docs/README.md) and [tutorial](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/docs/tutorial.md), and the candidate gallery itself in `lab/candidate-gallery`, with its [tests](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/candidate-gallery/candidate-gallery.test.ts) and its [status notes](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md). The sources page under the player lists each spoken claim with its file and lines.
