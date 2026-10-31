This post follows the `lab/user-effort` study in Cheng Lou's [handwired](https://github.com/chenglou/handwired) repository at commit [4ea7fcb](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46). A simulator the lab wrote sets how long each pointer task takes. A small circuit of weighted sums then has to recover that formula from three features, and afterwards it chooses among four authored layouts for a stated mix of tasks.

### The simulator writes the truth: distance and width fold into one difficulty

The lab starts by writing the answer itself. A simulator takes the distance to a target, the target's width, a clutter number for the layout, and a motor-context number between zero and one. Distance and width fold into one difficulty, the base-two logarithm of one plus distance over width. Far and narrow gives a big number, and near and wide gives a small one.

{% viz scene="books/handwired-user-effort/chapter-1" section="chapter-1-simulator-writes-the-truth" cue="0" from="0.000" to="36.212" title="The simulator writes the truth: distance and width fold into one difficulty." %}
{% endviz %}

The fold is literally the simulator's line `const difficulty = Math.log2(1 + input.distance / input.targetWidth)`, so the difficulty is not a guess the learner makes.

### The mean is written term by term, then noise is added

The mean duration starts at two hundred milliseconds. It adds one hundred ten for each unit of difficulty and one hundred eighty for each unit of clutter. It then adds eighty for motor context, plus sixty-five more for context times difficulty, so a hard target costs extra when the context number is high. Every observation then gets uniform noise of up to thirty-five milliseconds either way, which has a standard deviation of about 20.21 ms.

{% viz scene="books/handwired-user-effort/chapter-1" section="chapter-1-mean-term-by-term" cue="3" from="36.212" to="66.920" title="The mean is written term by term, then noise is added." %}
{% endviz %}

The noise is the part the learner cannot remove. Its standard deviation is the floor that the later error numbers are measured against.

### Training and held-out sets, with held-out values training never used

The training set has 720 observations drawn from one grid of distances, widths, clutter levels and context levels. A second set of 192 held-out observations uses values training never saw: other distances, other widths, other clutter, other contexts. The README is explicit that the held-out values do not appear in training, though they stay inside the same authored family.

{% viz scene="books/handwired-user-effort/chapter-1" section="chapter-1-training-and-held-out" cue="6" from="66.920" to="86.030" title="Training and held-out sets, with held-out values training never used." %}
{% endviz %}

### Three features feed a six-operation circuit with five coefficients

The learner is never handed the formula's constants. It sees three features: difficulty divided by six, clutter, and motor context. Its circuit multiplies difficulty by motor context once, then sums five weighted terms. That is six operations in three layers, with five coefficients to learn.

{% viz scene="books/handwired-user-effort/chapter-1" section="chapter-1-three-features-circuit" cue="8" from="86.030" to="118.933" title="Three features feed a six-operation circuit with five coefficients." %}
{% endviz %}

The circuit's terms are the simulator's own terms, so this is a test of fitting an authored law. The README calls the setting deliberately favorable, and the rest of the post should be read with that in mind.

### Five coefficients start at zero, and eight hundred Adam steps move them

Training starts with all five coefficients at zero, so the circuit predicts zero for everything. Its mean squared error begins at about 0.593 seconds squared. Each step runs the circuit on all 720 durations and backpropagates exact gradients through the same six operations. Adam takes eight hundred steps at a learning rate of 0.04, and the README says those settings were not tuned against the test cases.

{% viz scene="books/handwired-user-effort/chapter-2" section="chapter-2-start-at-zero" cue="0" from="0.000" to="29.397" title="Five coefficients start at zero, and eight hundred Adam steps move them." %}
{% endviz %}

### The loss collapses, and the learned values sit near the authored ones

The recorded loss is about 0.025 at step ten, about 0.00105 at step one hundred, and flat near 0.0004 from step four hundred on. The value recorded at step ten is taken before that step's update. The learned coefficients, in seconds, are 0.1998 for the base, 0.6640 for difficulty, 0.1791 for clutter, 0.0753 for motor context and 0.3999 for the interaction.

Converted to the same seconds scale, the authored values are 0.2, 0.66, 0.18, 0.08 and 0.39. Each learned value is within about a hundredth of its authored value. That conversion is our reading of the formula, since the lab does not print it, and the README never claims exact recovery.

{% viz scene="books/handwired-user-effort/chapter-2" section="chapter-2-loss-and-coefficients" cue="3" from="29.397" to="69.243" title="The loss collapses, and the learned values sit near the authored ones." %}
{% endviz %}

### Held-out error lands near the noise floor, and the scope stays narrow

On the held-out points, the error against the noise-free formula is 1.68 ms. A constant guess at the training average misses by about 134 ms. Against the noisy observations, the error is 20.22 ms, which matches the injected noise of 20.21 ms. No predictor can do better than that in expectation, since the noise has zero mean. Three fresh training seeds give 0.76, 0.67 and 0.86 ms against the noise-free formula, so one lucky run is not the story.

The scope is narrow. This is interpolation within one simulator and one authored formula. It shows that fitting recovers a law we wrote. It says nothing about how people move.

{% viz scene="books/handwired-user-effort/chapter-2" section="chapter-2-held-out-and-scope" cue="6" from="69.243" to="114.197" title="Held-out error lands near the noise floor, and the scope stays narrow." %}
{% endviz %}

### Four layouts are scored by the expected cost of a stated task mix

Prediction alone picks nothing. The second job takes four authored layouts and a stated mix of tasks, then chooses the layout with the lowest expected duration. The layouts are near-small, with three tiny buttons close to the pointer; wide-confirm; wide-details; and balanced, with three medium buttons in a column. A task mix gives a probability to confirm, details and cancel, and each layout's expected cost is each task's probability times its predicted duration, summed.

At motor context 0.375, with 80% of tasks being confirm, wide-confirm wins at about 546 ms, balanced takes 589 ms, and wide-details follows. Near-small comes last at 685 ms.

{% viz scene="books/handwired-user-effort/chapter-3" section="chapter-3-layouts-and-expected-cost" cue="0" from="0.000" to="46.522" title="Four layouts are scored by the expected cost of a stated task mix." %}
{% endviz %}

### The same trained weights choose different layouts for different mixes

Now make details the common task, with the same trained weights. Wide-details wins at the same 546 ms. Only the probabilities changed, and nothing was retrained.

A rule that only minimizes distance from the pointer behaves differently. It favors near-small, whose buttons sit closest, although the predicted duration puts that layout last in the confirm-heavy case. Designers can also forbid layouts, for example with a minimum target width or a maximum clutter. Invalid layouts are skipped, and if two valid layouts tie exactly, the earlier one in the list wins.

Across 120 situations, the learned model picks the simulator's best layout every time, averaging 606.37 ms. Shortest expected distance matches 88 of them, averaging 624.08 ms.

{% viz scene="books/handwired-user-effort/chapter-3" section="chapter-3-same-weights-new-mix" cue="4" from="46.522" to="92.683" title="The same trained weights choose different layouts for different mixes." %}
{% endviz %}

### Count the real choices before reading the 120 situations as a score

Count the real choices. Forty of the 120 situations allow only one valid layout, sixty allow three, and just twenty allow all four, so the forty single-layout cases are trivial wins.

In the twenty open situations, learned effort matches the best layout twenty times out of twenty. Shortest distance matches none of them, and costs 102.58 ms more on average. Even that is a soft win. The best layout is judged by the true formula, and the learner's features are that same formula, so matching it is close to what one should expect.

{% viz scene="books/handwired-user-effort/chapter-3" section="chapter-3-count-the-real-choices" cue="8" from="92.683" to="127.479" title="Count the real choices before reading the 120 situations as a score." %}
{% endviz %}

### The status holds, with no human data behind it

At the pinned commit the eleven tests pass, and the report reproduces the README's numbers. There are no human observations, no error prediction, and no uncertainty estimates. The selection uses point predictions only.

So the book ends where the lab does: a law we wrote, five coefficients that recover it, and a chooser that follows a stated task mix without retraining. It is a clean pipeline test, not evidence about real users.

{% viz scene="books/handwired-user-effort/chapter-3" section="chapter-3-status-and-catch" cue="11" from="127.479" to="151.674" title="The status holds, with no human data behind it." %}
{% endviz %}

The main sources are the lab's files at commit [4ea7fcb27ebe93acf49b9f29a93e162b975bad46](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46): its [README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/user-effort/README.md), [simulator](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/user-effort/simulator.ts), [predictor](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/user-effort/predictor.ts), [selection](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/user-effort/selection.ts) and [report](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/user-effort/report.ts) under `lab/user-effort`, plus the [status table](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md) in `lab/status.md`. The sources page under the player lists each spoken claim with its file and lines.
