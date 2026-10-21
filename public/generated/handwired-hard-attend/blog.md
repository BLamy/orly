# Hard Attend

Hard Attend is a teaching page in Cheng Lou's handwired repository. This book follows the lab in `lab/hard-attend` at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 ([the pinned lab folder](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/hard-attend)). The page is plain JavaScript, not a numeric program. It scores three items against a query, picks the highest score exactly, and reads that item's value two ways that agree.

### Each item gets a key, and the query's dot product scores it

Three items sit on a line: Aster is worth ten, Banyan twenty, Cobalt thirty. A query lands somewhere near them, and you want the value of the nearest one. Give each item a key of two numbers, twice its position and minus its position squared. Banyan, at position one, gets two and minus one.

{% viz scene="books/handwired-hard-attend/chapter-1" section="chapter-1-keys" cue="0" from="0.000" to="29.501" title="Each item gets a two-number key, and the query dots against it." %}
{% endviz %}

The lab is a teaching page, plain web code rather than a numeric program. It turns that nearness question into scores, then picks exactly.

### The query's dot product makes the nearest item the tallest score

The query is the pair (query, 1). Multiply the pairs and add, and the score is twice the query times the position, minus the position squared. Park the query at one: Aster scores zero, Banyan one, Cobalt zero. Banyan is the tallest, and Banyan is the nearest.

{% viz scene="books/handwired-hard-attend/chapter-1" section="chapter-1-query-dot-product" cue="3" from="29.501" to="49.644" title="The query's dot product makes the nearest item the tallest score." %}
{% endviz %}

### Sliding the query moves the tallest score along a parabola

Working the algebra through, the score is the query squared minus the squared distance to the query, so across the positions the scores trace a parabola that peaks at the query. Slide the query to zero and Aster leads with zero, while Banyan falls to minus one and Cobalt to minus four. Slide it to two and Cobalt leads with four, Banyan has three and Aster has zero. In between the curve slides smoothly: at one and a quarter, Banyan scores one and a half and Cobalt one, so Banyan is still nearest.

{% viz scene="books/handwired-hard-attend/chapter-1" section="chapter-1-parabola" cue="5" from="49.644" to="81.084" title="Sliding the query moves the tallest score along a parabola." %}
{% endviz %}

### At one half, two scores tie, and the scores alone cannot pick

At exactly one half, Aster and Banyan are equally near, and both score zero. Cobalt sits at minus two. The scores alone cannot name a single winner there. So scoring turns nearest into highest. The harder part is choosing one winner exactly, even when two scores tie.

{% viz scene="books/handwired-hard-attend/chapter-1" section="chapter-1-tie" cue="9" from="81.084" to="97.616" title="At one half two scores tie, so the scores alone cannot pick." %}
{% endviz %}

### The leader is challenged, and only a strictly greater score takes over

Scores are not an answer yet. You need one winner, the position of the highest score, plus a tie rule decided in advance. The page starts with the first item as the leader and challenges it with each item after it. A challenger takes over only if its score is strictly greater, so an equal score leaves the earlier item in front.

{% viz scene="books/handwired-hard-attend/chapter-2" section="chapter-2-leader" cue="0" from="0.000" to="26.123" title="The leader is challenged, and only a strictly greater score takes over." %}
{% endviz %}

### At one half, ties go left, and at one and a half Banyan wins

At a query of one half, Banyan ties Aster at zero, fails to beat it, and Aster wins. Ties go left. At one and a half, Banyan and Cobalt both score two, and Banyan holds the lead against Cobalt, so Banyan wins.

{% viz scene="books/handwired-hard-attend/chapter-2" section="chapter-2-ties" cue="3" from="26.123" to="40.785" title="Ties go left: Aster wins at one half, and Banyan wins at one and a half." %}
{% endviz %}

### A one-hot sum and a direct index read return the same value

The first way to read the winner's value is a one-hot list: a one at the winner's position and zeros everywhere else. Multiply each bit by its item's value and add them up. With Banyan winning, zero, one, zero against ten, twenty, thirty gives twenty. The second way skips the sum and reads the value at the winner's position directly. The page prints Banyan's twenty and labels this read `hardAttend`.

{% viz scene="books/handwired-hard-attend/chapter-2" section="chapter-2-two-reads" cue="5" from="40.785" to="80.851" title="The one-hot sum and the direct index read return the same value." %}
{% endviz %}

The two reads agree at every query. That is by construction, since both start from the same winner, so it checks the bookkeeping rather than discovering anything.

### The one-hot sum touches every item, while the index read copies one entry

The one-hot sum touches every item. The toolkit's index read copies one entry in a single operation at any table size, for an index range strictly inside ±2^24.

{% viz scene="books/handwired-hard-attend/chapter-2" section="chapter-2-cost" cue="9" from="80.851" to="98.452" title="The one-hot sum touches every item, while the index read copies one entry." %}
{% endviz %}

That is hard attention: score, take the leftmost highest, read the winner. It is exact, with no blending anywhere.

### Softmax turns the scores into weights and blends the values

The page adds a third read, softmax. It turns every score into a weight, the weights add up to one, and the value is the blend of all three items. A sharpness slider scales the score gaps before the exponential, from one half up to fourteen. Turning it up makes the weights spikier.

{% viz scene="books/handwired-hard-attend/chapter-3" section="chapter-3-softmax-weights" cue="0" from="0.000" to="18.541" title="Softmax turns the scores into weights, and the weights blend the values." %}
{% endviz %}

### Softmax approaches the exact value away from ties and misses at ties

At a query of one quarter and sharpness fourteen, Aster gets nearly all the weight, and the blend is about 10.01: close to ten, never exactly ten. At three quarters it flips toward Banyan, and the blend is about 19.99, near the exact answer of twenty but not equal to it. Away from ties, more sharpness pulls the blend toward the exact value. At a tie it cannot: at one half, Aster and Banyan split the weight evenly at any sharpness, giving fifteen. At one and a half, that same even split gives twenty-five where the exact rule gives twenty, because softmax averages the tie while the exact rule picks the left.

{% viz scene="books/handwired-hard-attend/chapter-3" section="chapter-3-blend-vs-exact" cue="2" from="18.541" to="59.814" title="Softmax approaches the exact value away from ties and misses at ties." %}
{% endviz %}

### Softmax only approaches the exact read, and the folder is a teaching sketch

Softmax only approaches the exact read, and exact picking needs an explicit tie rule. The folder has no tests, and the page needs a browser, so it cannot run in a terminal. It is a teaching sketch.

{% viz scene="books/handwired-hard-attend/chapter-3" section="chapter-3-contrast-and-status" cue="6" from="59.814" to="84.415" title="Softmax only approaches the exact read, and the folder cannot run in a terminal." %}
{% endviz %}

The old plan's indexed half, reading at a chosen position, is now covered by index reads. Gather lowering found hard attention after a selection was made, but learned no scoring.

### The scored half stays open, and the journey ends on a question

The scored half, learning a shared scoring rule from changing data, stays open. The notes warn that exact selection has no useful gradient, so training would go through soft mixtures.

{% viz scene="books/handwired-hard-attend/chapter-3" section="chapter-3-open-half" cue="9" from="84.415" to="105.743" title="The scored half stays open, and training would go through soft mixtures." %}
{% endviz %}

To recap: score by closeness, pick the leftmost highest, and read the value two agreeing ways. Whether a circuit can learn those scores is still an open question.

The main sources are the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, especially its [lab folder](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/hard-attend), its [status notes](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md) and its [reassessment](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/reassessment-2026-09-03.md). The sources page under the player lists each spoken claim with its file and lines.

[Watch all three narrated chapters](?bundle=handwired-hard-attend).
