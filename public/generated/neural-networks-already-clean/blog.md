# Already Clean

Nick Cammarata's essay [Neural Networks Are Already Clean](https://already-clean.goodfire.com/), published by Goodfire in 2026, asks whether the famous mixed-up neurons in vision models are a fact about how networks represent things, or a side effect of how we have been looking at them. The author argues for the second. A neuron that seems to answer to unrelated things may reflect weak tools, loose explanations, and the way architecture and training shape a network, and a pattern of growth the essay calls recursive generalization explains much of what remains. This book follows that argument with animated mechanisms. The animations are schematic: they show how each idea works, not measured geometry. The book's one-line description is *Why the famous mixed-up neurons may have been a microscope problem: tools, training, architecture, and a pattern of growth called recursive generalization.*

### Start with the suspect

A neuron that seems to mix unrelated jobs is called *polysemantic*. The best-known explanation for it is *superposition*: a network short on room packs unrelated things into the same neuron, betting that they rarely interfere with each other. The essay asks us to compare two predictions before accepting that story. Generalization groups things that share a pattern, so its groupings should be local, with neighbors resembling each other. Superposition packs unrelated things together, so its groupings should be non-local. The author's point is that the ordinary causes come first: bad tools, bad explanations, bad learning from architecture, data, and training, and recursive generalization. In the author's view, superposition should have been the last hypothesis to reach for, not the default, because it is the most radical and the hardest to test.

{% viz scene="books/neural-networks-already-clean/chapter-1" section="chapter-1-suspect" cue="0" from="0.000" to="41.343" title="Suspect, predictions, and test order" %}
{% endviz %}

### Climb the estimate ladder

The author's central evidence is a ladder of estimates for one layer: the last layer of InceptionV1, a 2014 image network. With the tools of the time, the author put its interpretable neurons at roughly 0–5%, with others near zero. Some early failures came from how the visualizations were made rather than from the neurons. Feature visualization, which optimizes a synthetic image to show what a neuron responds to, improved once the optimization was made robust to small shifts and rescalings of the image. With better tools, the same network reaches about 50%. Retraining the same architecture with modern regularization gives about 70%. A ConvNeXt with the same parameter count and the same dataset reaches about 99%, by the author's assessment. Here, interpretable means the author judged the neuron easily interpretable.

{% viz scene="books/neural-networks-already-clean/chapter-1" section="chapter-1-ladder" cue="5" from="41.343" to="83.767" title="Estimate ladder: microscope, training, architecture" %}
{% endviz %}

Only the first step keeps the trained network fixed. The animation keeps the same plate of cases for that step, then swaps in a new plate for the retrained network and another for the new architecture, so changing tools looks different from changing the network.

### Keep confidence apart from the count

The essay is explicit that its thesis carries a confidence level. The author is maybe 85% confident that generalization explains nearly everything in this picture. That is confidence in an argument. It is not a measurement that 85% of neurons are clean, and it does not belong on the ladder above. Keeping these apart matters. The ladder counts neurons that can be read under different tools and training, while the confidence concerns which explanation best accounts for the whole pattern.

{% viz scene="books/neural-networks-already-clean/chapter-1" section="chapter-1-confidence" cue="11" from="83.767" to="101.750" title="Confidence, separate from the count" %}
{% endviz %}

The chapter ends on a practical question: for this neuron, which ordinary explanation can we test before assuming its meanings were packed together arbitrarily? The animation fades the confidence dial out so that the question is what remains on screen.

### A V, not a cat and car

A neuron's *pole* is one end of its response: the side that pushes it positive and the side that pushes it negative. Neuron 4e:55 in InceptionV1 became the textbook case of a mixed neuron, responding to cat faces and car fronts, and it appears in both Feature Visualization and Zoom In. The author rereads it as a V-shape detector. Its positive pole responds to pointed contours that link objects whose names seem unrelated. Its inputs include a fox snout, a wolf face, and the front of a van, and its readers include flames, a coyote face, and a martini glass. The negative pole is an O: round shapes such as a ball or a clock push the neuron negative. A V against an O is one axis of shape, not a grab bag of categories.

{% viz scene="books/neural-networks-already-clean/chapter-2" section="chapter-2-v-shape" cue="0" from="0.000" to="42.841" title="The V reading and its readers" %}
{% endviz %}

The change is in the description rather than the weights: the same neuron, grouped by shape instead of by category name. The animation draws a V on each input and reader, then places an O on the stop face.

### Read the gate, not the label

Think of a neuron as a gate. Each incoming signal casts a weighted vote toward the positive or negative pole, and the votes add up before the neuron's activation rule is applied. A ReLU, the common activation rule, clips negative sums to zero, so the neuron cannot pass a negative value downstream. The negative side still matters, though. A negative vote can close the gate even though the neuron never emits a negative activation. Read this way, a shared pattern can admit useful signals to specialist neurons further on while keeping others out.

{% viz scene="books/neural-networks-already-clean/chapter-2" section="chapter-2-gate" cue="5" from="42.841" to="74.165" title="Votes, the door, and a negative vote" %}
{% endviz %}

The door in the animation is schematic, and its vote weights are illustrative, chosen to make the arithmetic visible. What it shows is the shape of the rule: a positive sum swings the door open, and a negative sum leaves it pressed shut against its stop.

### Cars and dogs share a pose

The original Zoom In example was a circuit in which a car feature seemed to spread into unrelated dog neurons, as if the car signal were stored in hidden form. The author found that circuit in 2019 and now challenges the reading. Cars and dogs are grouped by shared pose, so their viewing angle matters more than their object category. The essay reports more than a hundred generalized pose neurons in InceptionV1, with later layers building on them, and similar pose neurons in the later DINOv2 model. Feature visualization had been pulled toward dog imagery. Guiding it along natural image paths exposed two car neurons and two car-and-dog pose neurons. Later processing develops car specialists and finer poses, rather than decoding a car hidden inside the dog neurons.

{% viz scene="books/neural-networks-already-clean/chapter-2" section="chapter-2-pose" cue="9" from="74.165" to="114.754" title="Pose, and the corrected view" %}
{% endviz %}

The animation rotates a car and a dog to the same angle while the door shrinks into a schematic downstream gate. Pose is the shared axis in that picture. The animation does not show a measured pose space.

### Follow the branch

Recursive generalization is the essay's name for a neuron that generalizes along more than one direction of similarity and then branches outward, with each step easy to follow locally. The language illustration begins with the letters iy, as in Miyazaki, and extends to diy, then to the phrase do it yourself, which contains no iy at all. The essay labels this a conceptual illustration, not a recorded training run. Its proposed mechanism is a head start: a neuron already active for the abbreviation is first in line to pick up the longer phrase.

{% viz scene="books/neural-networks-already-clean/chapter-3" section="chapter-3-branch" cue="0" from="0.000" to="40.461" title="iy to diy to do it yourself" %}
{% endviz %}

The lesson is about the path, not the endpoint. A finished list of top examples can look unrelated, while every step of the growth is a near neighbor of the one before.

### Two neurons over training

The vision example follows training directly. A last-layer neuron in a retrained InceptionV1 starts on rapeseed fields, and a ConvNeXt neuron trained on the same data starts on similar fields. Followed over training, the Inception neuron extends to tennis balls, dogs, and broccoli, and by the end its field responses have thinned to a small remnant. The ConvNeXt neuron briefly responds to balls and fruit, then mostly drops those extensions and stays with the fields. The essay's broader observations suggest side branches are less common and matter less than a neuron's main job, a claim the author treats as something to investigate.

{% viz scene="books/neural-networks-already-clean/chapter-3" section="chapter-3-training" cue="5" from="40.461" to="89.815" title="Two neurons over training" %}
{% endviz %}

The animation's time axis marks reported snapshots, not a true time scale. The essay credits Multimodal Neurons, which called the motif conjoined features, with seeing it first. The author prefers the newer name.

### Take away the room

What does a network do when it runs short of room? One possibility is that unrelated meanings get packed into shared neurons. Another is that each neuron takes on a broader job. The essay tests this on layer 3b of InceptionV1, called mixed3b. That layer holds curve detectors, which respond to curved edges, and the network has no shortcut route that lets information skip around it. The author then cuts the layer from 480 neurons to 10 and trains the network from scratch, a 48× reduction in that layer's room.

{% viz scene="books/neural-networks-already-clean/chapter-4" section="chapter-4-room" cue="0" from="0.000" to="25.704" title="Squeeze 480 to 10" %}
{% endviz %}

The animation narrows a band of 480 cells into 10 new cells. None of the old cells carries over, so the question is what the narrower layer learns, not whether the old neurons survive.

### Coarser, not hidden

If unrelated patterns were packed together, the squeezed layer should show conspicuous overlaps, such as a curve, a spiral, and spider-web strokes sharing one neuron. The author reports something different: coarser neurons. One curves-and-loops neuron takes the place of the more specific curve detectors. The squeezed model reaches 58.35% top-1 and 81.14% top-5 accuracy on ImageNet. Top-1 counts a correct first guess, and top-5 counts a correct label among the five best guesses. Coarsening keeps a shared pattern but loses fine distinctions. That differs from each original detector surviving intact inside a mixture. To look for those distinctions, the author trains a sparse autoencoder, a small model that rebuilds the layer's activity from a few active learned features.

{% viz scene="books/neural-networks-already-clean/chapter-4" section="chapter-4-coarser" cue="3" from="25.704" to="70.368" title="Coarser, not mixed" %}
{% endviz %}

The mixture prediction was a real test: under it, the squeezed layer should have looked like a jumble. The author reports coarser neurons instead.

### Test the dictionary against the neurons

The sparse autoencoder here is a TopK model with 640 features, and only 2 are active at each position. A larger dictionary gives it room to try to recover the curves. Its features closest to the original curve detectors are broad and bunched together, not a set of sharp curves, so this test does not recover the originals. A separate test looks at the last layer of a ConvNeXt, where 88% of the autoencoder's activity comes from near-copies of single neurons. Removing dictionary directions that match no neuron leaves accuracy unchanged in that experiment. The author concludes that the neurons themselves are the useful building blocks, and calls this a leading hypothesis rather than a proof.

{% viz scene="books/neural-networks-already-clean/chapter-4" section="chapter-4-dictionary" cue="8" from="70.368" to="121.208" title="Dictionary matches and the ConvNeXt check" %}
{% endviz %}

The 88% is a share of one autoencoder's activity in a different model. It is not a share of clean neurons, and it says nothing about the squeezed layer.

### Discouraging numbers, read carefully

Two 2023 studies help explain why language-model neurons once looked discouraging. In Towards Monosemanticity, the median neuron of a one-layer model scored 0 of 14 on a rubric, meaning the annotator could not form a hypothesis about it. The author, who started the automated interpretability project at OpenAI, also reports that it found about 1.7% of neurons interpretable by its most generous measure, in the author's account. The author's preliminary audit of Qwen3-32B reports about 90% of neuron poles with one main job, often with small related offshoots, about 7% with two related jobs, and about 2–4% not yet understood. These are estimates about poles, not whole neurons, and they depend on thresholds.

{% viz scene="books/neural-networks-already-clean/chapter-5" section="chapter-5-estimates" cue="0" from="0.000" to="55.054" title="Three separate estimates" %}
{% endviz %}

The three estimates use different models and measures, so they are not one controlled before-and-after score. The animation shows them as three separate bands rather than one stacked bar, because they do not sum to anything.

### A bitter lesson, four steps

Rich Sutton's 2019 essay *The Bitter Lesson* argues that methods which scale with computation, rather than with hand-built knowledge, tend to win out by a wide margin. The author asks whether investigating neurons could benefit in a similar way, and lays out four steps. First, networks run on one learning principle rather than two, so nothing blocks ordinary science on them. Second, with modern models and improved tools, that science goes much better than most people expect. Third, explanations constrain their neighbors: once you know what one part does, the next part is easier to test. Fourth, the author suggests this might supply most of what interpretability needs, and labels that step *highly speculative*.

{% viz scene="books/neural-networks-already-clean/chapter-5" section="chapter-5-lesson" cue="6" from="55.054" to="94.668" title="Bitter lesson, four steps" %}
{% endviz %}

The animation treats the fourth step as unfinished: a dashed extension to the map that never fills in, because for now it rests on argument rather than evidence.

### Investigate the unexplained

The proposed lesson is to expand systematic experiments on the network itself, rather than assume that a new decomposition has to come first. In the author's framing, scaling ordinary investigation might beat engineering a clever new way to split the network apart. On this account, an unexplained response is a reason to look closer. Superposition still belongs among the hypotheses to test, but after the simpler explanations have had their chance. The author now thinks it should sit far down the list.

{% viz scene="books/neural-networks-already-clean/chapter-5" section="chapter-5-open" cue="11" from="94.668" to="126.595" title="Unfinished step four" %}
{% endviz %}

The essay makes an argument about the order of inquiry, and by its own description its evidence is preliminary. It does not show that superposition is wrong, that sparse autoencoders are useless, or that interpretability is solved, and this book does not claim any of those things.

### Sources

The post and the book rest on Nick Cammarata's essay at Goodfire (2026), together with the figure details and cited work behind it. The main sources are Olah, Mordvintsev, and Schubert's [Feature Visualization](https://distill.pub/2017/feature-visualization/) (2017); Olah, Cammarata, and colleagues' [Zoom In](https://distill.pub/2020/circuits/zoom-in/) (2020); Goh, Cammarata, and colleagues' [Multimodal Neurons](https://distill.pub/2021/multimodal-neurons/) (2021); Bricken and colleagues' [Towards Monosemanticity](https://transformer-circuits.pub/2023/monosemantic-features/index.html) (2023); Bills, Cammarata, and colleagues' [Language Models Can Explain Neurons in Language Models](https://openaipublic.blob.core.windows.net/neuron-explainer/paper/index.html) (2023); Elhage and colleagues' [Softmax Linear Units](https://transformer-circuits.pub/2022/solu/index.html) (2022); Oquab and colleagues' [DINOv2](https://arxiv.org/abs/2304.07193) (2023); and Rich Sutton's [The Bitter Lesson](https://web.archive.org/web/20200101013420/http://www.incompleteideas.net/IncIdeas/BitterLesson.html) (archived copy) (2019). Every narrated claim is mapped to its source on the book's sources page.
