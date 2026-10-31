# Speaking in Coordinates

This book explains **GroundingPI: A Grounding Foundation Model towards Physical Intelligence with Visual Primitives**, by Qize Yu, Lianrui Fan, Boyu Chen, Jiaqi Liang, Xini Ding, Yue Chen, Zetian Song, Yuran Wang, Yi Zou, Kaixuan Wang, Tianxing Chen, Wenxuan Song, Bohan Zhou, Mingleyang Li, Siqiao Huang, Yuqi Ye, Caigao Jiang, Wei Wei, Ruihai Wu, Hang Zhang, Yixiao Ge, Shuchang Zhou, Shilong Liu, Xianming Liu, Ping Luo, Shiyu Huang. Stable identifier: **arXiv:2609.39601** (2609.39601v1); Hugging Face Daily Papers ranking date: 2026-10-13. [Hugging Face paper](https://huggingface.co/papers/2609.39601) · [Canonical paper](https://arxiv.org/abs/2609.39601) · [PDF](https://arxiv.org/pdf/2609.39601) · [Official code](https://github.com/groundingpi/GroundingPI).


GroundingPI connects a phrase to a location by generating visual primitives as a structured token sequence. This explainer follows the released image-and-text inference path and the model formulation described in the paper. The red car and its coordinates below are illustrative, rather than a recorded model prediction. [Paper](https://arxiv.org/html/2609.39601v1) · [Official implementation](https://github.com/groundingpi/GroundingPI/tree/0047d4510e201fecfd77126f6036088638aa85d2)

### The image gets a shared coordinate vocabulary

A referring phrase such as “the red car” identifies a target; a point or bounding box supplies its location. GroundingPI uses one thousand coordinate tokens, from `<0>` through `<999>`, for these visual primitives. A point contains two coordinates, while a box contains four. Explicit phrase and geometry markers keep the target name attached to its coordinates, and `None` represents an absent target. This makes different grounding outputs learnable within the same vocabulary. [Protocol implementation](https://github.com/groundingpi/GroundingPI/blob/0047d4510e201fecfd77126f6036088638aa85d2/grounding_pi/protocol.py#L7-L41)

{% viz scene="books/groundingpi-speaking-in-coordinates/chapter-1" section="chapter-1-shared-coordinates" cue="0" from="0.000" to="52.802" title="One vocabulary carries labels and locations." %}
{% endviz %}

The coordinate grid is independent of image resolution. In the released visualizer, each horizontal coordinate is divided by 999 and multiplied by the image width minus one; vertical coordinates use the height minus one. The endpoints therefore map to the first and last pixel positions. The small example image is a way to inspect that convention, not evidence about localization accuracy. [Visualizer](https://github.com/groundingpi/GroundingPI/blob/0047d4510e201fecfd77126f6036088638aa85d2/grounding_pi/client.py#L101-L118)


![Chapter 1: The thousand-step ruler](/generated/groundingpi-speaking-in-coordinates/blog/chapter-1.png)

### Visual features enter the language sequence

The paper describes a MoonViT-V2 visual encoder connected to a Qwen3-4B language decoder. Adjacent two-by-two visual features pass through a learned projector into the decoder's embedding space. The released code exposes that connector as `GroundingPITwoLayerProjector`: normalization and reshaping feed two linear layers with GELU between them and output normalization afterward. Projected image features occupy the image positions of the input embeddings, alongside the query text. The decoder then generates the answer token by token. [Paper, model formulation](https://arxiv.org/html/2609.39601v1#S3.SS1) · [Projector and vision model](https://github.com/groundingpi/GroundingPI/blob/0047d4510e201fecfd77126f6036088638aa85d2/models/vlm/modeling_groundingpi.py#L964-L1013)

{% viz scene="books/groundingpi-speaking-in-coordinates/chapter-2" section="chapter-2-image-sequence" cue="0" from="0.000" to="56.657" title="An image and a phrase condition one generated answer." %}
{% endviz %}

The paper's training recipe teaches both the output format and spatial correspondence through supervised examples, then uses reinforcement post-training to evaluate sampled responses for qualities including localization and target coverage. The animation distinguishes this reported training method from the released client call. It does not reproduce training, measure model performance, or turn the grounding checkpoint into an action policy. [Paper, training design](https://arxiv.org/html/2609.39601v1#S3.SS3) · [Release scope](https://github.com/groundingpi/GroundingPI/blob/0047d4510e201fecfd77126f6036088638aa85d2/README.md#L338-L348)


![Chapter 2: An image becomes a sentence](/generated/groundingpi-speaking-in-coordinates/blog/chapter-2.png)

### The response must pass grammar and completion checks

The client gives the generated text to `parse_answer` with canonical formatting required. The parser consumes the complete response, validates boundaries and coordinate tuples, and rejects out-of-range or degenerate boxes. The client also checks that generation finished with the normal stop signal. Even a syntactically complete prefix is rejected if generation ended for another reason; invalid results retain the raw text for inspection but have no predictions to draw. [Parser](https://github.com/groundingpi/GroundingPI/blob/0047d4510e201fecfd77126f6036088638aa85d2/grounding_pi/protocol.py#L412-L534) · [Response handling](https://github.com/groundingpi/GroundingPI/blob/0047d4510e201fecfd77126f6036088638aa85d2/grounding_pi/client.py#L39-L59)

{% viz scene="books/groundingpi-speaking-in-coordinates/chapter-3" section="chapter-3-checked-geometry" cue="0" from="0.000" to="54.613" title="Checked coordinates return to the original image." %}
{% endviz %}

Once accepted, the visualizer converts the normalized coordinates to image pixels and draws the box or point. A `None` payload is a valid negative answer and contributes no geometry. These checks establish a well-formed, complete response; they cannot establish that the model selected the correct object. That remains a question for grounding evaluation. [Drawing and validity boundary](https://github.com/groundingpi/GroundingPI/blob/0047d4510e201fecfd77126f6036088638aa85d2/grounding_pi/client.py#L101-L118)


![Chapter 3: A box must survive the parser](/generated/groundingpi-speaking-in-coordinates/blog/chapter-3.png)

[Watch the narrated book](https://orly.brett-lamy.workers.dev/?bundle=groundingpi-speaking-in-coordinates)
