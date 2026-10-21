# Reusable Layout

This book follows the reusable photo-layout experiment in Cheng Lou's [handwired](https://github.com/chenglou/handwired) repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)), in `lab/reusable-layout`. A small learned function proposes each photo's width, and ordinary code still wraps the rows and measures the captions.

### One rule, eight numbers

The lab learns one small function that proposes a photo's width from changing content and viewport features. The same parameters are reused for every photo and every collection, so there is one rule, not one per page. For each photo the function receives eight numbers: viewport width, aspect ratio, caption length, importance, photo count, mean aspect ratio, reading position and mean importance.

{% viz scene="books/handwired-reusable-layout/chapter-1" section="chapter-1-one-rule-eight-numbers" cue="0" from="0.000" to="44.965" title="One shared rule reads eight numbers for each photo." %}
{% endviz %}

No photo identifier enters the function. The repository says so directly: stable IDs do not enter the learned function, so it has no ID to key on and only sees numbers that describe the situation.

### Twelve units and a width

Twelve hidden units each take a weighted sum of those eight numbers, plus a bias. Each sum passes through a ReLU, which keeps positive values and zeroes the rest. One more weighted sum of the twelve results, times four hundred, is a width in pixels.

{% viz scene="books/handwired-reusable-layout/chapter-1" section="chapter-1-twelve-units-and-a-width" cue="4" from="44.965" to="75.534" title="Twelve ReLU units and one weighted sum give a width in pixels." %}
{% endviz %}

The whole circuit has 121 parameters, 133 operations and five layers of dependency per photo. It is the kind of circuit the first book built, now with learned weights.

### Ordinary code does the layout

The cards take those widths and wrap into rows. The repository's flow layout consumes the preferred widths and wraps rows without reordering items. Row breaks and caption measuring are ordinary web code, and the network only proposes widths.

{% viz scene="books/handwired-reusable-layout/chapter-1" section="chapter-1-ordinary-code-does-the-layout" cue="7" from="75.534" to="121.346" title="The cards take the proposed widths and wrap into rows." %}
{% endviz %}

Shuffle how the photos are stored, or rename their identifiers, and the layout comes out the same. The repository's storage and ID test checks this. The chapter ends on the question the next one answers: what is the rule trying to please?

### A preference is written down

The rule needs right answers, and they come from a teacher: a slow search that tunes one layout at a time against a written objective. That objective is an authored preference, not a model of human taste, and no human examples or click logs are involved. Its first term sets each photo's target area to 22,000 square pixels times 0.7, plus 1.5 times its importance.

{% viz scene="books/handwired-reusable-layout/chapter-2" section="chapter-2-a-preference-is-written-down" cue="0" from="0.000" to="44.432" title="The teacher's objective is written down before any search runs." %}
{% endviz %}

The second term penalizes a caption longer than three lines, squared. The third is a small charge for unused row width. Photo terms are averaged, and the row charge is added once per layout.

### Search tunes each layout

Search starts every photo at 224 pixels. It tries widths from 128 to 416 in two passes, keeping any that lowers the loss, then nudges each photo by 16, 8, 4, 2 and 1 pixels. That is thirty evaluations per photo, plus one: 181 for six photos, 361 for twelve, 481 for sixteen. It is coordinate search, with no promise of the global best.

{% viz scene="books/handwired-reusable-layout/chapter-2" section="chapter-2-search-tunes-each-layout" cue="4" from="44.432" to="94.506" title="Coordinate search tries widths, then nudges each one." %}
{% endviz %}

On the wide 2.6 photo at importance about a half, area alone asks for roughly 287 pixels. The search settles at 290, close to that area-only answer.

### The student learns to imitate

The student trains on sixteen collections of four or eight photos at widths of 480, 768 and 1080, using short captions only: 96 layouts and 576 photo examples. Each example pairs the eight features with the search's width. An optimizer called Adam adjusts the 121 parameters over 160 passes, shrinking the squared error.

{% viz scene="books/handwired-reusable-layout/chapter-2" section="chapter-2-the-student-learns-to-imitate" cue="8" from="94.506" to="140.991" title="The student fits the search's widths over 160 passes." %}
{% endviz %}

For seed 17 the normalized loss falls from about 0.0091 to 0.00008 in under a second of training, and training is seeded, so the saved model reproduces exactly. The saved model is seed 17, selected before looking at held-out results. The fair test that follows uses held-out scenes with new collections, counts and widths.

### Held-out numbers on short captions

Each held-out set has 96 layouts, and lower preference loss is better. On short captions, ordinary wrapping at a fixed 224 pixels scores 0.3727 and per-layout search scores 0.0229. The shared rule, across three training seeds, scores 0.0259 to 0.0266.

{% viz scene="books/handwired-reusable-layout/chapter-3" section="chapter-3-held-out-numbers-on-short-captions" cue="0" from="0.000" to="49.331" title="On short captions the shared rule stays close to its teacher." %}
{% endviz %}

So the one-shot rule stays close to its teacher, a little worse, and far better than wrapping. It is also cheaper. In the saved seed-17 run, the shared rule takes a median of 18 microseconds on short captions, where search takes 317. Other seeds put search at 350 and 421.

### Longer captions widen the gap

Now change the test: longer captions and new crops, with aspect ratios from 0.55 to 2.6, which the rule never trained on. Wrapping scores 1.0530 and search 0.1987. The shared rule scores 0.2854 to 0.3079, far ahead of wrapping but clearly behind its teacher.

{% viz scene="books/handwired-reusable-layout/chapter-3" section="chapter-3-longer-captions-widen-the-gap" cue="4" from="49.331" to="82.245" title="On longer captions and new crops the rule falls behind its teacher." %}
{% endviz %}

The README names this as where the rule loses ground. One limit it names: the network gets a caption's total width, not each word's width, so it cannot predict exactly where lines break.

### Resizing makes the rule jump

The safety checks hold everywhere. Across all 192 held-out layouts, all three methods keep every photo in reading order, with zero text overflow, horizontal overflow or overlap. Resizing is a separate test: every pixel width from 360 to 1180, for short and long captions.

{% viz scene="books/handwired-reusable-layout/chapter-3" section="chapter-3-resizing-makes-the-rule-jump" cue="7" from="82.245" to="126.943" title="Every pixel width is swept, and the photos jump at some of them." %}
{% endviz %}

In the saved model, wrapping has 6 transitions where mean movement tops 10 pixels, the shared rule 35 and search 53. The README says it plainly: all three methods reflow abruptly. The worst wrapping step moves photos 939 pixels on average.

### What the test does not show

The study does not show that a neural network is necessary, or that it beats a carefully tuned responsive formula. The 224-pixel wrapper is not tuned, and no human ratings are involved.

{% viz scene="books/handwired-reusable-layout/chapter-3" section="chapter-3-what-the-test-does-not-show" cue="10" from="126.943" to="166.533" title="The result is limited to this objective, these counts, and one photo set." %}
{% endviz %}

The status is narrowed. The result is current, but limited to this objective, these counts and widths, and one photo set. The long-caption gap is recorded, not fixed. So: one rule of 121 parameters, taught by a slow search. It is close on short captions, behind on long ones, and abrupt on resize.

The main sources are the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, especially its [experiment README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/reusable-layout/README.md), its [model](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/reusable-layout/model.ts), [layout](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/reusable-layout/layout.ts), [study](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/reusable-layout/study.ts) and [test](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/reusable-layout/layout.test.ts) files, and the saved [results](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/reusable-layout/results.json). The sources page under the player lists each spoken claim with its file and lines.

[Watch all three narrated chapters](?bundle=handwired-reusable-layout).
