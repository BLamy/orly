# Event Window

Event Window is a lab in Cheng Lou's handwired repository, and this book follows it at commit 4ea7fcb ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)). Four windows sit on a stage, and each one can be dragged, clicked and focused. The question is whether that memory can live in a fixed circuit of weighted sums and ReLUs. Plain code plays the referee, and the circuit has to agree with it on every frame.

### The circuit has to match a plain referee

Each frame the circuit sees at most one input: a pointer down, a move, an up, or nothing. Its answer is where every window is drawn. The referee is an oracle program written the ordinary way, and the lab compares the two for exact FP32 equality, bit for bit, frame after frame.

{% viz scene="books/handwired-event-window/chapter-1" section="chapter-1-circuit-matches-referee" cue="0" from="0.000" to="35.968" title="The circuit gets one input per frame and must match a plain oracle bit for bit." %}
{% endviz %}

The memory question is the sharp one. A window has to remember whether a pointer press was a drag or a click, which window has focus, and whether it is maximized. Those facts outlast any single frame, so the circuit has to hold them somewhere.

### A press writes a record, and latches hold it

Pressing the title bar, the top thirty pixels, is the only moment the circuit writes a press record. The record holds where the pointer landed, which window it hit, where that window's corner was, and whether the press hit the title. Only a press writes it.

Moves never touch that record. Each move measures the larger of the sideways and vertical distance from the press point. Once that distance crosses four pixels, a second latch, the drag-begin latch, flips on. While it is on, the window is drawn at its grab position plus the pointer's travel, kept inside the stage. Sixty pixels to the right puts the left edge at 460.

{% viz scene="books/handwired-event-window/chapter-1" section="chapter-1-press-record-and-drag" cue="3" from="35.968" to="84.753" title="A press writes the record, and a moved-away pointer flips the drag latch." %}
{% endviz %}

The stored position still reads 400 until a release. Letting go commits the dragged position, and only if the drag latch is on. Nothing before that writes the window's position into memory.

### Focus and click are two different latches

A press on a window that isn't focused only gives it focus. Focus changes on a pointer down and at no other time. A click on the focused window's body, released without crossing four pixels, leaves the drag latch off, so the maximized bit flips by arithmetic: the old value plus a toggle times one minus twice the old value.

If the pointer crosses four pixels and drifts back to the start, the click is cancelled. The latch remembers the crossing until release, so a quick out-and-back cannot sneak in a toggle.

{% viz scene="books/handwired-event-window/chapter-1" section="chapter-1-focus-click-and-probe" cue="7" from="84.753" to="143.221" title="A click toggles maximize unless the pointer crossed four pixels, and a probe of raw inputs cannot tell two drags apart." %}
{% endviz %}

Could the circuit skip the latches and look only at its last few inputs? A probe says no. One trace holds a drag, another holds nothing, and both end with the same last 256 inputs. The window still ends in two places, 460 and 400, and no fixed window of raw inputs tells them apart at any length tested. A latch holds the committed total, so the circuit can.

### A ramp that narrows

The title test and the slop test share one shape: a ramp. Take the difference between a boundary and a measure, scale it by a sharpness, add one half, and clamp the result between zero and one. In the shipped circuit a rounding step then snaps the ramp to exactly zero or one. The training copy has no rounding, so the ramp keeps its slope, and a slope is something gradient descent can follow.

For the title test, the measure is how far below the window's top the pointer landed. The boundary sits at 29.5, so 29 pixels counts as title and 30 as body. Training adjusts six numbers: the title boundary, the slop boundary, and four relation cells saying whether a title or body press drags or toggles. It trains on single frames, pairing one input and the oracle's stored state with 21 decision bits, so no backpropagation through time is needed.

{% viz scene="books/handwired-event-window/chapter-2" section="chapter-2-ramp-shape-and-six-numbers" cue="0" from="0.000" to="61.045" title="One ramp shape decides title and slop, and training adjusts six numbers on single frames." %}
{% endviz %}

The latch structure stays as authored. Training recovers those six cells, not new latches.

### Annealing from wide to narrow

Training starts far off: the title boundary near 86 pixels, the slop boundary near 13. The first ramp is 32 pixels wide, so frames within sixteen pixels of a far boundary still pull on it. Then the ramp narrows in three snaps, to four pixels, then one, then a quarter pixel. The learning rate drops for the last two, and the optimizer's memory resets at each snap.

The title boundary lands at 29.7, inside the band from 29 to 30. The slop boundary lands at 4.5, inside the band from 4 to 5. Rounding the relation cells to zero or one gives the hardened circuit, and played against the oracle on three fresh traces of 10,000 frames, it diverges zero times in 30,000.

{% viz scene="books/handwired-event-window/chapter-2" section="chapter-2-annealing-to-the-bands" cue="5" from="61.045" to="109.308" title="The ramp narrows in three snaps, and the thresholds settle inside their bands." %}
{% endviz %}

### Recovery from scrambled starts, and a fixed ramp that fails

Training repeats from twenty scrambled starts, and all twenty land inside both bands. Titles range from 29.39 to 29.82, and slops from 4.17 to 4.84.

Hold the ramp fixed at four pixels wide and start from the true values, and the title boundary drifts to about 30.01 and the slop boundary to about 3.97. With a wide ramp the training loss is lowest at 30, about 2.59 thousandths, not at the true 29.5, where it is about 2.63 thousandths. Hardened, that drifted circuit diverges from the oracle in 9,120 of 10,000 frames, starting at frame 135. The narrowing is what makes recovery work.

{% viz scene="books/handwired-event-window/chapter-2" section="chapter-2-scrambled-starts-and-fixed-ramp" cue="9" from="109.308" to="161.426" title="Twenty scrambled starts recover, and a fixed narrow ramp drifts out of its band." %}
{% endviz %}

### The scorecard and its scope

The hand-set circuit runs closed loop: its own state feeds the next frame, and the oracle is checked after every one. Its own outputs latch its next event window, and the oracle runs in parallel purely as a judge.

Twelve seeds of 10,000 frames make 120,000 frames, with zero divergences, and the comparison is exact equality. All sixteen settings of the two-by-two relation table pass 2,000 frames each. Two hundred drags in a row, alternating plus seven and minus six pixels, leave the window exactly 100 pixels right. The trained circuits were checked on 30,000 frames each, not 120,000, and the committed test asks only that five of its six starts recover. Different checks, different sizes.

{% viz scene="books/handwired-event-window/chapter-3" section="chapter-3-scorecard-and-scope" cue="0" from="0.000" to="49.668" title="Closed loop, twelve seeds, sixteen relation settings, and a smaller check for the trained circuits." %}
{% endviz %}

### The cost, and the archive nothing reads

One press record compiles to 480 operations, 52 layers deep. Each extra record adds 36 operations, and the depth stays at 52. The lab's own readme table says 502 operations and depth 38. Running the script at this commit prints 480 and 52, so this book uses the printed numbers.

Those extra records form an archive of older presses. It is built, but behavior never reads it. Behavior uses only the current record, so the added operations buy nothing yet.

{% viz scene="books/handwired-event-window/chapter-3" section="chapter-3-cost-and-archive" cue="4" from="49.668" to="85.159" title="One press record costs 480 operations at depth 52, and the archive costs more without changing behavior." %}
{% endviz %}

### What training learned, and what is still open

Training learned six numbers. Every example handed it the oracle's correct internal state and labels, and which latches exist was authored. The status file says the same: training supplies correct internal state and decision labels, while persistent state and temporal dependencies remain. The result is narrowed to that scope, and it holds there.

An earlier review found a demo bug: consecutive moves were squashed into the last one, which could erase a drag. The demo now keeps every move, and a test checks that an out-and-back movement cancels the click. Still open are double-click, which would read the archive, and flick speed, which needs a move archive. Training on whole rollouts, fractional and batched inputs, and discovering the latches are open too, and none is built.

{% viz scene="books/handwired-event-window/chapter-3" section="chapter-3-learned-scope-and-open-items" cue="7" from="85.159" to="151.533" title="Training learned six cells under a stated scope, and the open items are not built." %}
{% endviz %}

The memory is real: a few latches written only on events, one ramp shape that narrows to recover six parameters, and exact agreement with plain code on the traces tested. Learning the memory is not shown.

### Sources

The main sources are the Event Window lab's README, which states the claims and its own corrections, and its code: `oracle.ts` for the referee rules, `circuit.ts` for the latches, the ramp and the archive, and `train.ts` for the annealing and hardening. The tests `boundary-probe.test.ts`, `training.test.ts`, `exactness.test.ts` and `window-depth.test.ts` pin the probe, the recovery floor, the exact agreement and the linear cost. The repository's `lab/status.md` gives the scope of what training supplies, and `lab/reassessment-2026-09-03.md` records the consecutive-move defect. Every link points at the pinned commit 4ea7fcb.
