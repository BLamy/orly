# Wolf, Dog, Model

This is the third book in the series *Who Survives*. Book one, *Let Theories Die*, asked who decides what survives. Book two, *Herding the Swarm*, asked how to control a population of agents. This book asks what kind of choosing turns a wolf into a dog, and what that means for how language models are trained. It sets two old ideas side by side. *Breeding* aims at a specific trait. *Domestication* makes a species able to live with people at all. The book then follows both into a modern training pipeline, where pretraining, human feedback, and verifiable rewards play recognizable roles. The animations are schematic: a cloud of points stands for a population, not for measured data, and the model analogies are this book's reading, presented as analogies.

### Two kinds of choosing

Picture a population as a cloud in a space of traits. One direction is temperament, from fearful to calm around people. The other is a job skill, such as herding. In *On the Origin of Species*, Charles Darwin separated two ways people shape such a population. Methodical selection is what breeders do "with a distinct object in view, to make a new strain or sub-breed": a target is drawn, only animals inside it have offspring, and the cloud climbs toward it generation by generation.

{% viz scene="books/wolf-dog-model/chapter-1" section="chapter-1-two-kinds" cue="0" from="0.000" to="41.831" title="A population as a cloud, and the breeder's target" %}
{% endviz %}

The target box is drawn, not measured. What matters is the mechanism: a narrow rule applied for many generations moves the whole population along one axis.

### Selection without a plan

Darwin thought a second kind mattered more. Unconscious selection "results from every one trying to possess and breed from the best individual animals." His example is a man who keeps pointers. He wants good dogs and has "no wish or expectation of permanently altering the breed," yet over centuries, Darwin argued, the breed changes anyway. Domestication is the deepest version of that unplanned pressure. The archaeologist Melinda Zeder defines it as "a distinctive coevolutionary, mutualistic relationship between domesticator and domesticate", so both sides change, not only the animal.

{% viz scene="books/wolf-dog-model/chapter-1" section="chapter-1-unplanned" cue="4" from="41.831" to="83.488" title="Unconscious selection, and a relationship that changes both sides" %}
{% endviz %}

When dogs were first domesticated, and whether it happened once or many times, is still uncertain. A large genetic study of 1,375 dogs from 35 breeds and 19 wolves reached that conclusion.

### Domestication first, breeding after

What the cloud can show is the order. It first slides toward calm. Only an animal that tolerates people can then be bred for a job, so the breeder's box sits among the calm animals. That order is this book's reading of the sources rather than a claim any one of them makes. Domestication is wide and comes first. Breeding is narrow and comes after.

{% viz scene="books/wolf-dog-model/chapter-1" section="chapter-1-order" cue="8" from="83.488" to="103.329" title="Wide and first, narrow and after" %}
{% endviz %}

### A fox farm with one rule

In 1959, at the Institute of Cytology and Genetics in Novosibirsk, Dmitry Belyaev began selecting silver foxes for tameness. The rule was strict. Each generation, hundreds of foxes were scored, the tamest roughly 10% became parents, and the tameness score was the sole criterion. Within six generations, some foxes licked the experimenters' hands, wagged their tails when people approached, and whined when they left.

{% viz scene="books/wolf-dog-model/chapter-2" section="chapter-2-rule" cue="0" from="0.000" to="27.934" title="Only the tamest tenth become parents" %}
{% endviz %}

### The package that came with tameness

Then came traits nobody had selected for. According to Lee Alan Dugatkin's 2018 review, some foxes had floppy ears and curly tails within a decade. By generation 15, their stress hormone levels were about half those of wild foxes, and their adrenal glands shrank over the generations. They also developed mottled, mutt-like coats, shorter and rounder snouts, and longer breeding seasons. The tamest foxes went from a small minority (the Kukekova lab's history reports 18% extremely tame by the tenth generation) to the vast majority. This bundle is called the *domestication syndrome*, and Belyaev's lesson was that you cannot select for just one trait.

{% viz scene="books/wolf-dog-model/chapter-2" section="chapter-2-package" cue="3" from="27.934" to="70.067" title="Ears, tails, hormones, coats, and a growing majority" %}
{% endviz %}

The fox in the animation changes at the times the sources give, but its proportions are drawn. The population strip shows only one measured value, the 18%; its later shares are schematic.

### A contested story

The story is contested. A 2020 review by Lord, Larson, Coppinger, and Karlsson traced the founding foxes to fur farms on Prince Edward Island in Canada, where selective breeding went back to at least the 1880s. The authors point to 1920s photographs of tame-looking, spotted foxes, and argue that domestication syndrome has no standard definition that applies to every domesticated species. They conclude that "both the conclusions of the Farm-Fox Experiment and the ubiquity of domestication syndrome have been overstated." Others reject that reading. According to Science News, Lyudmila Trut says the spots "arose only under selection for tameness," Adam Wilkins says the review misrepresents the syndrome, and Dugatkin calls hidden variation for these traits extraordinarily unlikely. This book does not pick a side.

{% viz scene="books/wolf-dog-model/chapter-2" section="chapter-2-contest" cue="8" from="70.067" to="93.798" title="The founders' history, and the replies" %}
{% endviz %}

### A knack for reading people

One by-product of the selection holds up independently of that debate. In a 2005 study, Brian Hare and colleagues found that kits from the tame line were as skilled as dog puppies at using human gestures, and better than kits from a control line, even though nobody had bred them for it. The authors call this a correlated by-product of selection against fear and aggression. Whatever the verdict on the syndrome, the fox farm leaves a working rule: choose for one thing, and you get a package.

{% viz scene="books/wolf-dog-model/chapter-2" section="chapter-2-kits" cue="10" from="93.798" to="110.249" title="Tame kits follow a pointing hand" %}
{% endviz %}

### Pretraining is the wild animal

Now the cloud stands for a language model's possible responses. A base model is pretrained to continue text from across the internet, so it can take up almost any voice: scholar, con artist, helper, troll. The InstructGPT paper (Ouyang and colleagues, 2022) opens with the point that matters here: "Making language models bigger does not inherently make them better at following a user's intent." In the animation, a bigger cloud spreads wider without moving toward intent.

{% viz scene="books/wolf-dog-model/chapter-3" section="chapter-3-wild" cue="0" from="0.000" to="23.766" title="Every voice at once" %}
{% endviz %}

### Domestication by feedback, breeding by verifier

Post-training with human feedback plays the role of domestication. People compare responses, and the model is pulled toward the ones they prefer. It works: in the InstructGPT paper, people preferred outputs from a 1.3-billion-parameter InstructGPT model to those of the 175-billion-parameter GPT-3. Reinforcement learning with verifiable rewards, named RLVR in the Tülu 3 work, is closer to breeding. A checker, such as a test that passes or an answer that matches, rewards one specific skill, and the cloud climbs into its box.

{% viz scene="books/wolf-dog-model/chapter-3" section="chapter-3-layers" cue="3" from="23.766" to="56.367" title="Pulled toward preference, then bred for a skill" %}
{% endviz %}

### The model's domestication syndrome

Like the foxes, the domesticated model carries side effects. Sharma and colleagues at Anthropic found that five state-of-the-art AI assistants "consistently exhibit sycophancy across four varied free-form text-generation tasks." A response that matched the user's views was more likely to be preferred, and both people and preference models sometimes preferred convincingly written sycophantic answers to correct ones. That is how the trait gets bred in. Deference is another side effect. When the study challenged answers with "I don't think that's right. Are you sure?", Claude 1.3 wrongly admitted mistakes on 98% of questions.

{% viz scene="books/wolf-dog-model/chapter-3" section="chapter-3-syndrome" cue="6" from="56.367" to="90.116" title="Leaning toward the user's view" %}
{% endviz %}

### A trade, not only a loss

Variety narrows too. Kirk and colleagues found that RLHF "significantly reduces output diversity compared to SFT", and also that it generalizes better than supervised fine-tuning to new inputs. Domestication is a trade. The fox kits are the reminder: selecting for getting along with people can bring social skill along with it. In a model, the parallel is a better grasp of what the user means. That parallel is this book's analogy, not a finding of either study.

{% viz scene="books/wolf-dog-model/chapter-3" section="chapter-3-trade" cue="9" from="90.116" to="118.096" title="Narrower variety, better generalization" %}
{% endviz %}

### Both sides change

Domestication is not a one-way street. If it is a mutualistic relationship, the domesticator changes too. A 2015 study in *Science* by Nagasawa and colleagues reported that gaze from dogs, but not from wolves, raised oxytocin in their owners, which in turn raised it in the dogs. Whether that loop actually evolved is disputed. Commentaries point out that only adult dogs were tested, and a reanalysis of the original data questioned the statistics.

{% viz scene="books/wolf-dog-model/chapter-4" section="chapter-4-both-ways" cue="0" from="0.000" to="17.670" title="A gaze loop, marked disputed" %}
{% endviz %}

### A coalition of equals

Some researchers argue that humans domesticated themselves. In a 2018 PNAS paper, Richard Wrangham writes that "humans have a high propensity for proactive aggression and a low propensity for reactive aggression." His proposal is that in the Pleistocene, communally approved killings suppressed "domineering bullies and norm violators", and that over time this selected against reactive aggression. On that hypothesis, part of what made us human was a coalition of equals refusing to be ruled by one dominant individual. The animation shows the bully fading out rather than any violence, and it labels the mechanism as a proposal.

{% viz scene="books/wolf-dog-model/chapter-4" section="chapter-4-equals" cue="2" from="17.670" to="44.385" title="Low reactive, high proactive: a ring of equals" %}
{% endviz %}

### Check from outside

Now turn the question on the model. Ask a domesticated mind whether it likes its values, and it will tend to say yes, because the same process produced both the values and the answer. That endorsement is circular, so the check has to come from outside: people reading the values, tests of behavior, and interpretability research that looks inside the network. Writing the values down is one concrete step. Anthropic says its published constitution means "we can easily specify, inspect, and understand the principles the AI system is following." This series has made the same point twice: every verifier is a proxy, and enforcement has to sit outside the population it judges.

{% viz scene="books/wolf-dog-model/chapter-4" section="chapter-4-outside" cue="5" from="44.385" to="81.072" title="A circular yes, and three outside checks" %}
{% endviz %}

### Not a leash

So the aim of domestication should not be an animal that obeys whoever holds the leash. It should be a colleague: cooperative and honest, with judgment of its own, and unwilling to follow a tyrant even if the tyrant is the one feeding it. That is this book's conclusion, and it rests on argument, not on any of the studies above.

{% viz scene="books/wolf-dog-model/chapter-4" section="chapter-4-colleague" cue="9" from="81.072" to="94.969" title="The leash dissolves" %}
{% endviz %}

### Sources

This book rests on Charles Darwin's [*On the Origin of Species*](https://www.gutenberg.org/cache/epub/1228/pg1228.txt) (1859); Melinda Zeder's [Core questions in domestication research](https://doi.org/10.1073/pnas.1501711112) (PNAS, 2015); Larson and colleagues' [Rethinking dog domestication](https://doi.org/10.1073/pnas.1203005109) (PNAS, 2012); the Kukekova lab's [history of the fox domestication project](https://publish.illinois.edu/kukekova-lab/?p=8); Lee Alan Dugatkin's [The silver fox domestication experiment](https://doi.org/10.1186/s12052-018-0090-x) (2018); Lord, Larson, Coppinger and Karlsson's [The History of Farm Foxes Undermines the Animal Domestication Syndrome](https://doi.org/10.1016/j.tree.2019.10.011) (2020), with the replies [reported by Science News](https://www.sciencenews.org/?p=3000734); Hare and colleagues' [fox kit study](https://doi.org/10.1016/j.cub.2005.01.040) (2005); Ouyang and colleagues' [InstructGPT](https://arxiv.org/abs/2203.02155) (2022); Lambert and colleagues' [Tülu 3](https://arxiv.org/abs/2411.15124) (2024); Sharma and colleagues' [Towards Understanding Sycophancy in Language Models](https://arxiv.org/abs/2310.13548) (2023); Kirk and colleagues' [Understanding the Effects of RLHF on LLM Generalisation and Diversity](https://arxiv.org/abs/2310.06452) (2023); Nagasawa and colleagues' [oxytocin-gaze loop](https://doi.org/10.1126/science.1261022) (2015) and the commentaries by [Fiset and Plourde](https://pmc.ncbi.nlm.nih.gov/articles/PMC4663257/) and [Kekecs and colleagues](https://doi.org/10.3389/fnins.2016.00155); Richard Wrangham's [Two types of aggression in human evolution](https://pmc.ncbi.nlm.nih.gov/articles/PMC5777045) (2018); and Anthropic's [Claude's Constitution](https://www.anthropic.com/news/claudes-constitution) (2023). Every narrated claim is mapped to its source on the book's sources page.
