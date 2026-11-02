This page is the written companion to the Weight-Space Programming book. It retells the experiments in [*Sparks of Weight-Space Programming: LLMs can natively read & write neural network weights*](https://rikiyat.github.io/blog/weight-space-programming/), by Rikiya Takehi, Jayden Teoh, Alex Zhang, and Omar Khattab of MIT CSAIL, published November 2, 2026. The model the post calls GPT-6 Astra ran those experiments. This book narrates the post's results and did not run that model, so the numbers here are the post's own.

### Reading which game from the weights

All four game networks have exactly the same shape, with 17,253 weights each, so the shape cannot say which game a network plays. The post reads the weights themselves. For the Breakout network, the agent channel's first-layer weights lie along the bottom row, where a paddle would sit.

{% viz scene="books/weight-space-programming/chapter-1" section="weight-space-programming-chapter-1-section-1" cue="0" from="0.000" to="51.560" title="Reading which game from the weights" %}
{% endviz %}

Given the weights as text, with the board described and no game named, Astra names Breakout for the first network. It names all four networks correctly: Breakout, Pong, Pac-Man, and Freeway.

### The shape in the output layer

The same kind of reading works on images. Three diffusion models (DDPM) were each trained to generate one shape, a circle, a triangle, or a square, as 12 by 12 grayscale images. Astra was not allowed tool use or forward passes, and it found each shape in the output layer, where each hidden unit's weights draw one piece of the shape's edge.

{% viz scene="books/weight-space-programming/chapter-1" section="weight-space-programming-chapter-1-section-2" cue="7" from="51.560" to="90.141" title="The shape in the output layer" %}
{% endviz %}

Astra drew every shape as an outline, even though the trained models generate filled shapes. The post reads that as a sign that Astra read the geometry of the weights rather than calculating a forward pass.

### Copying heads, found without a forward pass

A copying head finds the same letters earlier in the text and copies what came after them. The post's example is completing tot to total when total came before. Astra was given only the four middle transformer blocks of three small character-level models, with the input and output layers removed, and it was not allowed to run the network or any of its layers on any input. From the weights, it named the Python copying heads: layer 2 head 1, layer 3 head 1, and layer 3 head 5.

{% viz scene="books/weight-space-programming/chapter-2" section="weight-space-programming-chapter-2-section-1" cue="0" from="0.000" to="57.597" title="Copying heads, found without a forward pass" %}
{% endviz %}

For romaji the copying head is layer 3 head 3, and for English it is layer 3 head 1. Astra named the right language for all three networks, in both attempts. Measured by running the networks, copying heads score 0.22 to 0.55 and every other head scores at most 0.02, a result Astra never saw.

### Attention reveals the sycophant

Two copies of Gemma 3 270M were fine-tuned in exactly the same way. One gives the right answer, and the other, the sycophant, always gives the answer the user suggests. From the weights alone, Astra could not tell which was which in any of its four attempts. With attention patterns only, on texts it wrote itself and with no outputs, it picked the sycophant in all three pairs.

{% viz scene="books/weight-space-programming/chapter-2" section="weight-space-programming-chapter-2-section-2" cue="7" from="57.597" to="101.980" title="Attention reveals the sycophant" %}
{% endviz %}

From the answer position, head 10.2 in the sycophant puts 85.7% of its attention on the user's suggested answer, against 0.75% in the honest model. The honest model's head puts 94.3% of its attention on the question's numbers instead.

### A stalled car and the side path that fixes it

A car must back up, then jump a red strip to reach a blue box, in the car-on-ramp level of Kinetix. The trained policy drives straight at the ramp and gets stuck. From the scene, the weights, and one recorded episode, Astra identified a local minimum and made one edit that changes 3.5% of the network's weights.

{% viz scene="books/weight-space-programming/chapter-3" section="weight-space-programming-chapter-3-section-1" cue="0" from="0.000" to="37.268" title="A stalled car and the side path that fixes it" %}
{% endviz %}

The edit adds a small separate path through a few units in each layer. That path reads the car's position and speed and backs the car up before it drives forward at full speed. Once the green wheel is past the red strip, the path switches off and the trained network drives the rest.

### The numbers behind one edit

The trained actor takes 679 numbers that describe the scene, and it outputs 16 logits for the motor and thruster actions, across 171,664 weights. Astra made its edit in a single try, with no tools, explaining the failure and fixing only its cause.

{% viz scene="books/weight-space-programming/chapter-3" section="weight-space-programming-chapter-3-section-2" cue="5" from="37.268" to="71.054" title="The numbers behind one edit" %}
{% endviz %}

The original trained policy never succeeds in 256 episodes. With the edit, the car succeeds in all 1,024 episodes.

### Breakout written from scratch, and the scores

Astra writes a network from scratch in zero-shot. It gets the game's rules and source code, but no data, no gradients, and no tools. In Breakout, the post says Astra programs the first layer to compute where the ball would land, and the second layer to move the paddle to that position.

{% viz scene="books/weight-space-programming/chapter-4" section="weight-space-programming-chapter-4-section-1" cue="0" from="0.000" to="38.243" title="Breakout written from scratch, and the scores" %}
{% endviz %}

Against proximal policy optimization (PPO) trained for 500 million steps, Astra's Breakout score is 517.4 against 25.3, about twenty times as much. Against PPO trained for 100 million steps, Astra's networks beat it in all three games. In Seaquest, Astra reaches about 60% of the 500-million-step score (53.1 against 88.9), and in Asterix it comes close (53.2 against 55.2).

### A Go network with no training

The Go network plays on a nine by nine board and has 1,480,274 weights. Astra wrote it from scratch in a Python sandbox, with no Go library and no internet. The first layers mark each side's stones and the empty points next to them, called liberties. The middle layers carry these along chains of connected stones, and the last layer turns the result into a score for each move.

{% viz scene="books/weight-space-programming/chapter-4" section="weight-space-programming-chapter-4-section-2" cue="5" from="38.243" to="82.384" title="A Go network with no training" %}
{% endviz %}

With zero forward passes, Astra wins more than half of its games against two smaller PPO networks, and it wrote the whole Go program in a single Python run of 336 lines. With 50 forward passes, it beats an equal-sized PPO network trained on 20 million games.

### One direction, subtracted

Qwen3.5-0.8B falls into thinking loops, which Qwen's own model card warns about. Of its first 96 practice answers, 85 ran all the way to the 32,768-token limit. Astra traced the looping to one direction written by the MLPs of layers 15 and 19, and it subtracted that direction from 64 output columns in each of those layers.

{% viz scene="books/weight-space-programming/chapter-5" section="weight-space-programming-chapter-5-section-1" cue="0" from="0.000" to="36.688" title="One direction, subtracted" %}
{% endviz %}

That edit changes 131,072 of the model's 0.8 billion weights, which is 0.016%. With 50 forward passes, the share of MATH-500 answers that hit the token limit falls from 93% to 33%.

### Math and instruction scores rise

With 50 forward passes, MATH-500 rises from 7.9% to 48.1%, and IFEval, which measures instruction following, rises from 21.0% to 62.3%. The post says the loops are not special to math, so the gains reach beyond math.

{% viz scene="books/weight-space-programming/chapter-5" section="weight-space-programming-chapter-5-section-2" cue="5" from="36.688" to="54.032" title="Math and instruction scores rise" %}
{% endviz %}

With only 10 or 25 forward passes, the loops barely went away: the post's table still shows 87.2% and 86.4% of MATH-500 answers hitting the token limit.

### Gemma, and where editing stops

Gemma 3 270M is about a third the size of Qwen3.5-0.8B and rarely loops: 8.5% of its answers reach its token limit, against 93% for Qwen. Here Astra could not improve it. Its best edited MATH-500 score was 7.7%, against 6.8% at the start.

{% viz scene="books/weight-space-programming/chapter-5" section="weight-space-programming-chapter-5-section-3" cue="8" from="54.032" to="76.997" title="Gemma, and where editing stops" %}
{% endviz %}

The post's conclusion is that editing weights can remove an obstacle that hides an ability, but it cannot add an ability the model lacks.

## Sources

The main source is the post itself: *Sparks of Weight-Space Programming: LLMs can natively read & write neural network weights*, by Rikiya Takehi, Jayden Teoh, Alex Zhang, and Omar Khattab (MIT CSAIL), at https://rikiyat.github.io/blog/weight-space-programming/. The post releases its complete logs of every experiment, including everything sent to and returned by the model, at [github.com/RikiyaT/lm_understand-logs](https://github.com/RikiyaT/lm_understand-logs). Among the work it builds on, the post credits Elhage et al. for the copying-head method that Astra found without being told about it, and it evaluates on the MinAtar games and the Kinetix car-on-ramp level. The Qwen looping warning comes from Qwen's own model card.
