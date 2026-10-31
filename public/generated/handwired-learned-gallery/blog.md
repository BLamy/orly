# Learned Gallery

Learned Gallery is a page from Cheng Lou's [handwired](https://github.com/chenglou/handwired) repository, which writes programs as neural-net-style arithmetic. This book follows the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46 ([the pinned tree](https://github.com/chenglou/handwired/tree/4ea7fcb27ebe93acf49b9f29a93e162b975bad46)). You sketch rectangles on a stage, and a network of 244 weights lays photos out on them.

### Twenty slots, ten features

You sketch ten rectangles on a stage, and ten photos should land in them. Here a small fixed program draws the layout, and training adjusts its weights until the photos fit. The relu it uses keeps positive numbers and zeroes the rest.

{% viz scene="books/handwired-learned-gallery/chapter-1" section="chapter-1-slots-and-features" cue="0" from="0.000" to="45.580" title="Twenty slots, each with ten fixed features, feed the network." %}
{% endviz %}

The program has twenty output slots, and the page uses up to twelve of them, one per photo. A slot is only a position along a line, from minus one to plus one. Each position becomes ten fixed features: a constant, the position itself, and a sine and a cosine at each of four frequencies, computed once when the program is built.

### Gated units and the 244 weights

Two layers follow, six gated units each. A gated unit multiplies one weighted sum by the relu of another, so each one is a small branch built from arithmetic. Four weighted sums at the end read the second layer and give the slot's left edge, top edge, width and height.

{% viz scene="books/handwired-learned-gallery/chapter-1" section="chapter-1-gated-units-and-weights" cue="4" from="45.580" to="87.642" title="Two layers of gated units and four outputs turn each slot into a rectangle." %}
{% endviz %}

Count the weights: a hundred thirty-two in the first layer, eighty-four in the second, twenty-eight at the output. That is two hundred forty-four, and each one is a source cell. Unrolled, the whole program is 6,320 operations in eight layers, and its shape never changes. Only those 244 numbers move.

### Seeded pile, matching and presets

From the seeded starting weights, the photos sit in a pile. Training takes steps with a method called Adam, nudging every weight to shrink the gap between photo edges and sketch edges.

{% viz scene="books/handwired-learned-gallery/chapter-1" section="chapter-1-pile-matching-presets" cue="8" from="87.642" to="135.139" title="Seeded photos form a pile, then matching scores each edge." %}
{% endviz %}

Each sketch rectangle is paired with a photo by cheapest total matching, then scored edge by edge. Big misses count linearly, so one far-off edge can't dominate. Pick a preset and the first fit stops after 679 steps for Story, 1,389 for Cinema and 879 for Contact sheet, in one run. An edit continues training from the current weights, so a photo follows its rectangle, while a preset or the Retrain button starts over from the seeded weights.

### A penalty instead of a snap

Hand-drawn sketches are crooked, so a row of photos has tops a few pixels apart. Cheng asked for a bigger or adjustable penalty for a grid that was unaligned.

{% viz scene="books/handwired-learned-gallery/chapter-2" section="chapter-2-penalty-instead-of-snap" cue="0" from="0.000" to="39.358" title="The first answer snapped the sketch, and the penalty replaces the snap." %}
{% endviz %}

The first answer was ordinary code that straightened the sketch before training. Cheng's verdict was that snapping to alignment is just a simple thought, and the gallery should learn something. So since October fourteenth nothing straightens the sketch. The loss gets a second part, a misalignment penalty, and photos line up only because training lowers it. The penalty never reads the sketch, only the photos: for every two photo edges of one kind, say two tops, it charges for the gap between them.

### The pull, the reach and the multipliers

The pull on a pair is five times the gap, capped at the reach minus the gap. So it's strongest between nearly aligned edges, and gone once the gap reaches one reach.

{% viz scene="books/handwired-learned-gallery/chapter-2" section="chapter-2-pull-reach-multipliers" cue="4" from="39.358" to="84.288" title="The pull is strongest between nearly aligned edges and gone at one reach." %}
{% endviz %}

Reach is half the slider's number. The slider runs from off to eight percent of the stage width and starts at four, so reach is two percent: about eleven pixels on a stage 538 pixels wide. A pair's charge is divided by how many edges share the line, so a row of four holds a photo no harder than a row of two. A pull alone stalls with a sliver of gap left, so each pair keeps a multiplier that grows by a tenth of the gap each step until the gap closes.

### Waiting, then the measured edits

The multipliers aren't part of the loss the page shows. The penalty waits, because the seeded pile has every edge within reach of every other. It switches on near the sketch, then ramps up over two hundred steps.

{% viz scene="books/handwired-learned-gallery/chapter-2" section="chapter-2-waiting-and-measured-edits" cue="8" from="84.288" to="134.862" title="The penalty waits for the pile to spread, then ramps up while edits are measured." %}
{% endviz %}

After 372 small edits at four percent, a line of photos ends one hundredth of a pixel apart at the median and sixteen hundredths at worst. Straightening gave four hundredths and fifty-two hundredths. Photos meet in the middle: drag one rectangle of a row of four twelve pixels down, and its photo stays in the row, nine pixels above the rectangle, while the other three move three pixels down. A photo joins a line at half the distance at which it leaves one, so a rectangle dragged fourteen pixels out of its row keeps its photo there.

### Fixed-rate Adam and the frame budget

Adam at a fixed rate doesn't come to rest once the loss is low. Its steps keep their size while gradients shrink, and before October thirteenth six small drags made photos jump up to fourteen pixels.

{% viz scene="books/handwired-learned-gallery/chapter-3" section="chapter-3-fixed-rate-and-budget" cue="0" from="0.000" to="36.954" title="Training runs at six hundred steps a second, and each frame is a bet." %}
{% endviz %}

Training runs at six hundred steps a second at any frame rate: ten steps a frame at sixty frames a second, five at a hundred twenty. A frame trains at most twenty, and no more than fit in six milliseconds. Each frame is a bet. The program measures one function before the frame's steps and after them, with the multipliers, line counts and penalty weight frozen for that frame.

### Taken back or kept

If the function went up, the frame is taken back. The weights and both of Adam's running averages are restored, and the learning rate halves, down to a sixty-fourth. If it went down, the frame is kept and the rate grows by fifteen percent, or doubles below a sixty-fourth. Climbing from a sixty-fourth back to full takes about thirty kept frames.

{% viz scene="books/handwired-learned-gallery/chapter-3" section="chapter-3-taken-back-or-kept" cue="3" from="36.954" to="72.166" title="A frame that raises its function is undone, and the rate climbs back when frames are kept." %}
{% endviz %}

At the floor there's a trap. After five frames in a row are taken back at the low rate, the rate keeps halving, to one four-thousand-ninety-sixth, and kept frames double it. Otherwise a photo could stall thirty pixels off.

### Two steps or none

A frame trains two steps or more, or none. After an undone one-step frame, the restored momentum can make the same step uphill at any rate, and every frame gets taken back while the photos freeze. On a device taking five milliseconds a step, one-step frames stopped Contact sheet's first fit at 529 steps, with a line nearly half a pixel apart. Two-step frames reached 874 steps and three hundredths of a pixel.

{% viz scene="books/handwired-learned-gallery/chapter-3" section="chapter-3-two-steps-or-none" cue="6" from="72.166" to="113.962" title="Frames of one step freeze the photos, and frames of two steps let them settle." %}
{% endviz %}

The price is time. Where a step takes over three milliseconds, a frame's training can take up to twice the six millisecond budget, and the lab accepts that.

### Stopping when the photos rest

Stopping is trickier than it sounds. With the penalty on, the loss has no value that means done. It rests where its two parts balance, say at one hundred-thousandth, with a photo held nine pixels from its rectangle.

{% viz scene="books/handwired-learned-gallery/chapter-3" section="chapter-3-stopping-when-photos-rest" cue="9" from="113.962" to="155.572" title="The page watches the photos, not the loss, to decide it is done." %}
{% endviz %}

So the page watches the photos. A change gets at least 500 more steps, and training stops once no edge has moved more than a hundredth of a percent of the stage in 100 steps, or after 2,000. Once photos rest, most frames are taken back: 238 of the 300 after Story's first fit. Many redo the same ten steps from identical weights, up to 171 in a row, until the multipliers change.

### How the penalty was chosen

How was the penalty chosen? A probe compared four forms over 24 sessions of 40 small edits, counting edits that end with two photo edges stuck between half a pixel and eight pixels apart.

{% viz scene="books/handwired-learned-gallery/chapter-4" section="chapter-4-how-penalty-was-chosen" cue="0" from="0.000" to="38.406" title="Four forms of the penalty, compared on the same stuck-edge count." %}
{% endviz %}

A fixed pull without multipliers left seventy-eight percent of edits stuck. Rounded less, forty-seven. Multipliers with a limit that stays full for two pixels, twenty-one percent. Multipliers with a limit that falls from a gap of zero, the form that was kept, got it to one point eight percent. That probe used a reach of about one and a half percent, a little under the shipped two.

### The shipped setting against straightening

At the shipped setting, 96 sessions of 40 small edits ended stuck one point one percent of the time, between 0.7 and 1.4 by batch, against about two and a half percent for straightening. In eight sessions of 200 random edits the lab saw none in 1,600. A reviewer's own generator saw five in 1,600, and half a percent of 1,920 mixed edits. So read it as rare, not zero.

{% viz scene="books/handwired-learned-gallery/chapter-4" section="chapter-4-shipped-setting-and-straightening" cue="3" from="38.406" to="65.701" title="The shipped penalty ends fewer edits stuck than straightening did." %}
{% endviz %}

Fitting 200 variants of Story's proportions, every line ended within fifteen hundredths of a pixel when training stopped. Twenty-six variants used all 2,000 steps to get there.

### Edits of 22 pixels and an edge on no line

Edits of 22 pixels pulled a photo off every line in 151 of 180 cases. Those photos ended a median twelve hundredths of a pixel from their rectangles, and 2.3 pixels at worst.

{% viz scene="books/handwired-learned-gallery/chapter-4" section="chapter-4-edits-and-edge-on-no-line" cue="6" from="65.701" to="118.711" title="Large edits leave photos near their rectangles, and an edge on no line is the open problem." %}
{% endviz %}

The open problem is an edge on no line. Twelve of those 200 variants end with one two to four pixels off, five after all 2,000 steps. Edges share 244 weights, and rest where all the slopes balance. Story shows it: one edge rests six tenths of a pixel from where it's drawn. Its own error pulls 29 times harder than the total gradient, but the other edges pull the shared weights the other way.

### Status and what is missing

Status: current, with that limit open. Forty-one tests pass, but the scripts behind the measurements aren't in the repo, and the numbers describe the page as it was on October fourteenth.

{% viz scene="books/handwired-learned-gallery/chapter-4" section="chapter-4-status-and-what-is-missing" cue="9" from="118.711" to="155.944" title="The status is current, the measurements are dated, and there is no held-out test." %}
{% endviz %}

There's no held-out test. The network is fitted to one sketch at a time, so the lab shows how well it fits a sketch, not how it handles one it never saw. To recap: twenty slots feed 244 weights that output rectangles, a penalty with multipliers lines them up, and undoable frames keep them still. Alignment is learned and mostly holds; off-line edges remain open.

The main sources are the repository at commit 4ea7fcb27ebe93acf49b9f29a93e162b975bad46, especially its [learned gallery README](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/src/learned-gallery/README.md), the lab's [measurement record](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/learned-gallery/README.md), the [status page](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/lab/status.md), and the code in [trainable-geometry.ts](https://github.com/chenglou/handwired/blob/4ea7fcb27ebe93acf49b9f29a93e162b975bad46/src/learned-gallery/trainable-geometry.ts). The sources page under the player lists each spoken claim with its file and lines.

[Watch all four narrated chapters](?bundle=handwired-learned-gallery).
