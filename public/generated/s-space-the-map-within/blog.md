# The Map Within

An illustrated companion to **S-Space: Exploring Spatial Workspace in Multimodal Language Models**, by Zhiyuan Shi and colleagues. Stable paper identifier: **arXiv:2610.13527** ([canonical paper](https://arxiv.org/abs/2610.13527), [PDF](https://arxiv.org/pdf/2610.13527), [Hugging Face paper](https://huggingface.co/papers/2610.13527)).

Selected from [Hugging Face Daily Papers for October 12, 2026](https://huggingface.co/papers/date/2026-10-12), observed at rank one with 269 upvotes. The explainer follows the [official implementation](https://github.com/MirroS-Lab/S-Space) at commit `fbb09403ac21ff9a889b9a64b1b4f3f0d92140ae`. Toy activations and geometry are labeled illustrative; reported results retain their model, benchmark and subset context.

### Three rulers inside a token

S-Space searches for a compact spatial readout inside a model's existing object-token representations. The identification pass differentiates a spatial-answer logit contrast with respect to the query and reference tokens, subtracts the two gradients, and averages across examples, templates, and object order. Only then does it normalize the direction. With those directions fixed for a model and layer, a forward pass and three dot products produce continuous coordinates. A relative answer can be selected directly from their difference. The coordinate system is a diagnostic readout, not a metric reconstruction of the world.

{% viz scene="books/s-space-the-map-within/chapter-1" section="gradient-rulers" from="0.000" to="64.412" title="Three rulers inside a token" %}
{% endviz %}

The animation's activations are illustrative. Its equations follow [the paper's method](https://arxiv.org/html/2610.13527v1#S2) and the official [gradient extraction](https://github.com/MirroS-Lab/S-Space/blob/fbb09403ac21ff9a889b9a64b1b4f3f0d92140ae/sspace/core/extraction/execution.py) and [axis construction](https://github.com/MirroS-Lab/S-Space/blob/fbb09403ac21ff9a889b9a64b1b4f3f0d92140ae/sspace/core/extraction/merge.py). The implementation labels positive vertical values as below, whereas the paper's first equation uses above; this explainer follows the implementation's signs.

![Illustrative object-token projections yield a horizontal readout margin of positive two; these coordinates are not meters.](/generated/s-space-the-map-within/blog/readout-margin.png)

### Changing a readout is a testable intervention

A coordinate readout becomes stronger evidence when changing it changes the model's behavior. The intervention computes a right inverse of the readout matrix, translating a requested coordinate change into an activation change while preserving the hidden component orthogonal to the spatial subspace. Shifting both objects preserves their relative coordinate difference; exchanging their coordinates reverses it. Neither mathematical fact guarantees that the generated answer changes. The paper therefore measures answer retention over increasing edit strengths and compares spatial edits with equally sized random edits.

{% viz scene="books/s-space-the-map-within/chapter-2" section="coordinate-intervention" from="0.000" to="65.759" title="Changing a readout is a testable intervention" %}
{% endviz %}

For Molmo2-ER at layer 17 on 800 EmbSpatial examples, [Table 7](https://arxiv.org/html/2610.13527v1#A3.SS3) reports 43.93 percent answer retention at swap strength six, versus 99.83 percent for random edits. At strength one, swap retention is still 98.71 percent. These are retained answers, not accuracies. The mechanism appears in [coordinate_right_inverse and CoordinateEditHook](https://github.com/MirroS-Lab/S-Space/blob/fbb09403ac21ff9a889b9a64b1b4f3f0d92140ae/sspace/experiments/intervention/spatial_causality/spatial_jacobian/spatial_causality.py).

![Paper Table 7: retained answers under spatial swaps and matched random edits, measured on Molmo2-ER at layer 17.](/generated/s-space-the-map-within/blog/answer-retention.png)

### A map still needs the right transformation

Perspective taking separates spatial perception from subsequent computation. The official SpinBench evaluation places a measured source-view relation in a sparse coordinate vector, leaves unmeasured entries zero, applies an explicit viewpoint rotation, and reads the requested sign. Moving to the left transforms horizontal and distance coordinates as `(x,z) → (z,−x)`. This is an external calculation supplied by the experiment. Its success shows that useful information can be present in activations even when the model's own generated answer fails to use it reliably.

{% viz scene="books/s-space-the-map-within/chapter-3" section="viewpoint-rotation" from="0.000" to="77.368" title="A map still needs the right transformation" %}
{% endviz %}

On the 146-example SpinBench subset without spatial premises, Qwen3.6-27B achieves 60.96 percent with direct answers, 83.56 percent with reasoning, and 95.21 percent with S-Space plus rotation ([Table 10](https://arxiv.org/html/2610.13527v1#A3.SS5)). The [projection evaluator](https://github.com/MirroS-Lab/S-Space/blob/fbb09403ac21ff9a889b9a64b1b4f3f0d92140ae/sspace/experiments/spinbench/perspective_taking/projection.py) and [rotation matrices](https://github.com/MirroS-Lab/S-Space/blob/fbb09403ac21ff9a889b9a64b1b4f3f0d92140ae/sspace/experiments/spinbench/perspective_taking/adapter.py) make that separation concrete.

![Paper Table 10: Qwen3.6-27B accuracy on 146 SpinBench examples without spatial premises.](/generated/s-space-the-map-within/blog/viewpoint-benchmark.png)

[Read the full narrated explainer](https://orly.brett-lamy.workers.dev/?bundle=s-space-the-map-within).
