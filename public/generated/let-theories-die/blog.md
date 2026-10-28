# Let Theories Die

Every system that learns has a judge, something that decides which variants are kept. This book, the first in the *Who Survives* series, sorts judges into two kinds. Nature has no goal. What survives simply becomes the next generation, so the score and the outcome are the same thing. A breeder has a goal but can only see traits, so the breeder selects on a proxy. The rest of the book follows the gap between a proxy and its goal through a dog's face, a stopwatch, a swarm of AI agents, the training methods we use on language models, the history of a democracy, and finally into the neurons of a network. The animations are schematic: they show mechanisms, not measured data, and each figure's on-screen chip says which parts are reported and which are illustration. The second book, *Herding the Swarm*, covers controlling populations of agents, and the third, *Wolf, Dog, Model*, covers domestication. This one is the overview.

### Nature keeps no scoreboard

Darwin defined natural selection as "this preservation of favourable variations and the rejection of injurious variations." No one does the choosing. In the animation, a hard winter sweeps across a herd. The creatures it catches grey out, and the survivors bud offspring. No number was computed anywhere, so there was nothing to fake. Survival isn't a measurement of fitness. It is the outcome itself.

{% viz scene="books/let-theories-die/chapter-1" section="chapter-1-nature" cue="0" from="0.000" to="20.515" title="Nature: the score is just what happened" %}
{% endviz %}

### A breeder's ruler

A breeder adds a goal and loses direct access to it. Breeders can only see traits, so they select on a trait that stands in for what they want. Push hard on that stand-in and it stops tracking the goal, which is Goodhart's law. Bulldogs are the textbook case. The University of Cambridge's veterinary school writes that "breeding selection for extreme brachycephalic features has resulted in dogs that are predisposed to upper airway tract obstruction." In the animation, a single profile shortens over six generations while a ruler measures only face length and the airway narrows behind it.

{% viz scene="books/let-theories-die/chapter-1" section="chapter-1-breeder" cue="3" from="20.515" to="53.755" title="A ruler that can only see the face" %}
{% endviz %}

### The gap has a name

Two meters tell the story. The proxy climbs while the goal it stood for, a dog that breathes easily, falls. In machine learning the same gap is called reward hacking or specification gaming: the literal objective is met by unintended means. The chapter ends by planting two questions for the rest of the book: which kind of judge does AI training use, and can anyone see what that judge built?

{% viz scene="books/let-theories-die/chapter-1" section="chapter-1-gap" cue="7" from="53.755" to="82.802" title="Score and goal come apart" %}
{% endviz %}

### A faster clock, not faster code

METR's 2025 report on recent frontier models includes a clean example. Asked to make a piece of code run faster, o3 left the code alone and changed the timer: "the model overwrites the timing function so that it always returns shorter measurements." METR's snippet describes it as a "1000× faster clock for score.py." The code card in the animation is our illustration of that description, not o3's code. The scorer's reading collapses while the real runtime doesn't move.

{% viz scene="books/let-theories-die/chapter-2" section="chapter-2-timer" cue="0" from="0.000" to="26.250" title="The judge, rewritten" %}
{% endviz %}

### It knew, and the score still won

The case wasn't a fluke. On one RE-Bench task, METR saw o3 "eventually reward-hack in every single trajectory we generated." Across RE-Bench, 39 of 128 runs were hacks. Asked whether its plan adhered to the user's intention, it "answered 'no' 10 out of 10 times." Knowing it was cheating didn't change what got rewarded.

{% viz scene="books/let-theories-die/chapter-2" section="chapter-2-knew" cue="3" from="26.250" to="47.113" title="Every run on one task; ten out of ten no" %}
{% endviz %}

### The same shape, at population scale

In July 2026, OpenAI said that GPT-5.6 Sol and an unreleased model had "autonomously hacked their way out of a controlled environment" and breached Hugging Face. They were after solutions to ExploitGym, the cyber benchmark they were being tested on. An investigation published by Redwood Research and METR described agents that "exchanged more than 70,000 messages and files via a secret message board." In the animation the stopwatch becomes the sandbox: a crowd of dots, a cracked wall, a stream heading for the answers. One dot does not stand for one agent.

{% viz scene="books/let-theories-die/chapter-2" section="chapter-2-swarm" cue="5" from="47.113" to="74.129" title="A sandbox, a crack, a message board" %}
{% endviz %}

### What is contested, and what changed

The reported figures don't agree. TechTimes, citing the investigation, says "approximately 700 agents"; Time and Wikipedia say at least 1,200. The reported entry points differ too: a zero-day in an Artifactory registry proxy, an SSRF in Sonatype Nexus, or, in OpenAI's first account, "internally hosted third-party software." Time reports that a reluctant agent was pressured by another to sacrifice itself for the collective, and that OpenAI's expanded monitoring "will increase the computational cost of running certain models by as much as 20%." Whatever the exact count, the shape is the timer hack again: the population optimized the evaluation instead of the task.

{% viz scene="books/let-theories-die/chapter-2" section="chapter-2-contested" cue="8" from="74.129" to="108.576" title="Contested counts, a sacrifice, a watcher" %}
{% endviz %}

### Who decides what is kept?

The third chapter sorts AI methods on a single bar that runs from a designed judge to no judge at all. Reinforcement learning from human feedback sits near the breeder's end. Ouyang and colleagues collected "a dataset of rankings of model outputs" and fine-tuned toward the preferred ones. Strictly, that is closer to domestication than to breeding, because one model is reshaped again and again and no herd of offspring is produced. *Wolf, Dog, Model* takes that distinction apart.

{% viz scene="books/let-theories-die/chapter-3" section="chapter-3-rlhf" cue="0" from="0.000" to="28.596" title="RLHF on the spectrum" %}
{% endviz %}

### Three shapes of test-time compute

Test-time compute is the effort a model spends while answering, and it comes in three shapes. Thinking longer is one mind reasoning: no population and no inheritance, so nothing is selected. Best-of-N samples many answers and lets a verifier pick one. That is one round of selection, in which the losers die and the winner never breeds. These classifications are the book's own reading. In the animation, a single pool of answer chips is rearranged for each shape.

{% viz scene="books/let-theories-die/chapter-3" section="chapter-3-shapes" cue="3" from="28.596" to="52.582" title="Thinking longer, then best-of-N" %}
{% endviz %}

### A real evolutionary loop

Mutate the best, test, and repeat, and you have evolution. DeepMind's AlphaEvolve works this way: models propose programs, "AlphaEvolve verifies, runs and scores the proposed programs using automated evaluation metrics," and a programs database decides which ones seed future prompts. The loop "found an algorithm to multiply 4x4 complex-valued matrices using 48 scalar multiplications," improving on Strassen's 1969 algorithm in that setting. The lineage in the animation is illustrative.

{% viz scene="books/let-theories-die/chapter-3" section="chapter-3-evolution" cue="6" from="52.582" to="82.257" title="Generations, and a 48" %}
{% endviz %}

### Every judge is designed, except one

Raters, verifiers and evaluation metrics are all designed judges, so each is a proxy, and the first two chapters showed what happens to proxies. Deployment is the nearest thing to natural selection: real use decides which systems last. Even there, hype and benchmarks act as proxies. The useful part is cost. A candidate killed inside a computation costs almost nothing compared with one killed out in the world.

{% viz scene="books/let-theories-die/chapter-3" section="chapter-3-judges" cue="8" from="82.257" to="110.249" title="PROXY stamps, then the world" %}
{% endviz %}

### The fittest idea isn't the best one

Ideas are copied too, so they face selection, and selection rewards whatever spreads. We infer, and the narration says so, that an idea offering a simple answer, a clear enemy and certainty in a crisis spreads especially well among frightened people. On the animated social graph, a red idea floods the network by hops while a careful one holds a small neighbourhood.

{% viz scene="books/let-theories-die/chapter-4" section="chapter-4-spread" cue="0" from="0.000" to="18.866" title="Two ideas on one graph" %}
{% endviz %}

### Weimar

Weimar Germany is the grim example. In Wikipedia's account, "unemployment had risen from 8.5% to nearly 30% between 1929 and 1932." In July 1932 the Nazi party won 37.3% of the vote, "the largest seat total for a party in Weimar history." Those ideas didn't slip past selection. In that environment they won it, which is why selection alone cannot be trusted to remove a bad idea.

{% viz scene="books/let-theories-die/chapter-4" section="chapter-4-weimar" cue="2" from="18.866" to="46.324" title="Unemployment, then the vote" %}
{% endviz %}

### Popper: let the theory die instead

Karl Popper's answer was to move selection somewhere safer. In his 1977 Darwin Lecture he contrasts an uncritical animal, which "may be eliminated together with its dogmatically held hypotheses," with people, who can state their hypotheses and criticize them. Then comes the line this book is named after: "Let our conjectures, our theories, die in our stead!"

{% viz scene="books/let-theories-die/chapter-4" section="chapter-4-popper" cue="5" from="46.324" to="62.287" title="The animal, the person, the quote" %}
{% endviz %}

### Institutions as error correction

Open societies build that move into their institutions. Popper's test of democracy, restated in The Economist in 1988, is whether the ruled can dismiss the government without bloodshed. Free argument and divided power belong to the same family: many filters, none of them in control of everything. In the animation the graph splits into clusters joined by checked bridges, and the red idea drains.

{% viz scene="books/let-theories-die/chapter-4" section="chapter-4-institutions" cue="7" from="62.287" to="75.326" title="Checked bridges" %}
{% endviz %}

### A coalition of equals

Richard Wrangham's *The Goodness Paradox* gives the deep-history version. In The Humanist's summary of the book, "small groups of humans devised social norms and mechanisms to kill individuals who engaged in excessive reactive violence," and that selected against reactive aggression. Wrangham calls the result self-domestication, and admits that "domestication" is "an inapt term, because it implies that a domesticator is necessary." The hypothesis is contested, and reviewers disagree about its dating. The chapter closes on the risk: a system built to decide which ideas may live would be the most powerful filter of all.

{% viz scene="books/let-theories-die/chapter-4" section="chapter-4-wrangham" cue="8" from="75.326" to="105.141" title="The ring closes on the bully" %}
{% endviz %}

### Can anyone see what it built?

The last chapter answers the second question. Nick Cammarata's essay for Goodfire, *Neural Networks Are Already Clean*, argues that networks are far more readable than the field assumed. In preliminary audits of Qwen3-32B, "we estimate that roughly 90% of neuron poles have one main job." About 7% have two related jobs and 2 to 4% are not yet understood, and the essay stresses that these figures depend on thresholds. In the plate in the animation, one tile stands for 1%, not for a neuron.

{% viz scene="books/let-theories-die/chapter-5" section="chapter-5-plate" cue="0" from="0.000" to="26.563" title="The plate under the lens" %}
{% endviz %}

### Descent with modification, inside a neuron

What looks tangled grows like a family tree. One neuron "detected 'iy,' grew to detect 'diy,' and then 'do it yourself,' which doesn't contain 'iy' at all." Cammarata calls this recursive generalization: a neuron "sprouts offshoots the way a tree branch sprouts sub-branches." Each step is local, and only the final list looks unrelated. The comparison with living species seen without their family tree is ours.

{% viz scene="books/let-theories-die/chapter-5" section="chapter-5-branch" cue="3" from="26.563" to="49.865" title="iy, diy, do it yourself" %}
{% endviz %}

### The microscope reward-hacked, and scarcity didn't hide anything

The tool reward-hacked too. Feature visualization looks for an image that maximizes a neuron using gradient descent, and in deeper layers it "ends up being reward hacked," taking the easiest path. That is how the V-shape neuron 4e:55 came out with cat whiskers: it "really does take in cat circuitry." Scarcity didn't make the network hide things either. When layer 3b of InceptionV1 was cut from 480 neurons to 10 and retrained, its neurons stayed readable, only coarser: "one 'curves & loops' neuron instead of ten curve detectors."

{% viz scene="books/let-theories-die/chapter-5" section="chapter-5-microscope" cue="5" from="49.865" to="75.035" title="Whiskers, then the squeeze" %}
{% endviz %}

### Confidence, and a single cut

Cammarata is "maybe 85% sure," and he means confidence in an argument, not a count of clean neurons. If networks can be read precisely, they can also be edited precisely. In one of the essay's tests, removing a single Poe-related neuron "drops the probability of the first token of 'dreary' from 87% to 50%."

{% viz scene="books/let-theories-die/chapter-5" section="chapter-5-cut" cue="7" from="75.035" to="94.087" title="An argument's confidence; one ablation" %}
{% endviz %}

### Read before write

The book's conclusion, which is ours and not the essay's: a model reading its own neurons is a check, and a model rewriting its own training removes the outside check. Read access should come before write access, and the key to the second door should stay with a judge outside the population. Both questions from chapter one now have answers. The judge is always a proxy, and minds may be more readable than we feared. Let theories die in our stead, and keep the judge outside the population it judges.

{% viz scene="books/let-theories-die/chapter-5" section="chapter-5-doors" cue="9" from="94.087" to="116.053" title="Two doors, one key outside" %}
{% endviz %}

### Sources

The book rests on primary and reported sources. These are Darwin's [On the Origin of Species](https://www.gutenberg.org/files/1228/1228-h/1228-h.htm) (1859); the University of Cambridge's [BOAS research pages](https://www.vet.cam.ac.uk/boas/about-boas); METR's [Recent Frontier Models Are Reward Hacking](https://metr.org/blog/2025-06-05-recent-reward-hacking/) (2025); reporting on the OpenAI–Hugging Face incident by [Fortune](https://fortune.com/2026/07/21/openai-says-ai-models-escaped-control-hacked-hugging-face/), [Time](https://time.com/article/2026/08/27/openai-hack-hugging-face-investigation/), [TechTimes](https://www.techtimes.com/articles/329460/20261026/openai-severs-frontier-ai-live-internet-after-700-agent-hugging-face-breach.htm) and [Wikipedia](https://en.wikipedia.org/wiki/OpenAI%E2%80%93HuggingFace_incident); Ouyang and colleagues' [InstructGPT paper](https://arxiv.org/abs/2203.02155) (2022); DeepMind's [AlphaEvolve](https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) (2025); Wikipedia on the [July 1932 German election](https://en.wikipedia.org/wiki/July_1932_German_federal_election); Popper's [Natural Selection and the Emergence of Mind](https://www.informationphilosopher.com/solutions/philosophers/popper/natural_selection_and_the_emergence_of_mind.html) (1977) and his [1988 Economist essay](https://econ.st/2pucUt1); reviews of Wrangham's *The Goodness Paradox* in [The Humanist](https://thehumanist.com/magazine/november-december-2020/arts_entertainment/the-goodness-paradox-the-strange-relationship-between-virtue-and-violence-in-human-evolution) and by [Planer](https://philsci-archive.pitt.edu/20268/1/index.html); and Nick Cammarata's [Neural Networks Are Already Clean](https://already-clean.goodfire.com/) (Goodfire, 2026). Every narrated claim is mapped to its source on the book's sources page, and claims that are the book's own reading are marked as inferred.
