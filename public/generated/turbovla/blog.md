# Skip the Giant Model

*An O'RLY? visual explainer of **“TurboVLA: Real-Time Vision-Language-Action Model at 32 Hz on an RTX 4090 with <1 GB VRAM”** by Hengyi Xie, Chenfei Yao, Xianjin Wu, Xuanyang Xi, Yiping Tang, Di Xu, Yingying Zhu, Dingkang Liang, Xiang Bai, and Han Ding. Stable paper ID: [arXiv:2607.27205](https://arxiv.org/abs/2607.27205) · DOI `10.48550/arXiv.2607.27205` · [Hugging Face Daily Paper](https://huggingface.co/papers/2607.27205) · [paper PDF](https://arxiv.org/pdf/2607.27205) · [official TurboVLA repository](https://github.com/H-EmbodVis/TurboVLA) · [official project page](https://h-embodvis.github.io/TurboVLA/). It was the #1 Hugging Face Paper of the Day for July 30, 2026, with 122 visible upvotes when selected.*

Vision-language-action policies have to turn camera frames, an instruction, and robot state into motion quickly enough for closed-loop control. TurboVLA asks what happens when the large generative language model is removed from that execution path. Its answer is a 0.2-billion-parameter policy that preserves token-level language, lets vision and language interact directly, and predicts a short action chunk in parallel. The paper reports 31.2 ms inference latency, 0.9 GB of inference memory, and 97.7% average LIBERO success at batch size one on an RTX 4090.

## Chapter 1 · Remove the Language Model Bottleneck

The comparison begins with two paths. A conventional VLA can send visual observations and language through a large language model before producing an action. TurboVLA instead uses two camera views and the instruction as inputs to one compact policy. In `turbovla/models/turbovla.py`, the forward path extracts visual tokens, joins them with cached instruction tokens in `feature_enhancer`, adds robot state later, and sends the resulting memory to `action_policy`.

<figure><img src="/generated/turbovla/blog/chapter-1-2.png" alt="Two camera views and one instruction feeding a large language model before an action"><figcaption>The reference route puts a large generative model on every control tick.</figcaption></figure>

That architectural substitution changes the timing budget. The paper's Table 1 reports 93.6 ms for π0.5, or roughly 11 Hz, versus 31.2 ms for TurboVLA, or about 32 Hz. These are measured system comparisons on the same RTX 4090 at batch size one; they are not hardware-independent constants.

<figure><img src="/generated/turbovla/blog/chapter-1-5.png" alt="A direct vision-language interaction module producing twelve seven-dimensional actions"><figcaption>TurboVLA replaces the generative middle with direct visual-language interaction and a parallel action decoder.</figcaption></figure>

The complete online policy is reported at 0.2 billion parameters and 0.9 GB of inference VRAM. The important claim is not that language disappears. Language stays present as a sequence of semantic features; the large autoregressive language model disappears from the time-critical route.

<figure><img src="/generated/turbovla/blog/chapter-1-7.png" alt="TurboVLA's direct path beside thirty-two hertz, parameter, and memory measurements"><figcaption>The reported deployment point combines a 31.2 ms tick, 0.2B parameters, and 0.9 GB of inference memory.</figcaption></figure>

## Chapter 2 · Make the Tokens Look at Each Other

TurboVLA starts visual processing with two DINOv2 views. The implementation concatenates their feature sequences after adding a learned `view_embed` that identifies which camera produced each token. The instruction is encoded separately and cached, but it remains a full sequence rather than being collapsed to a single class label.

<figure><img src="/generated/turbovla/blog/chapter-2-2.png" alt="Two visual token grids above a sequence of instruction tokens"><figcaption>View embeddings preserve camera identity while the instruction remains tokenized.</figcaption></figure>

The key mechanism is bidirectional cross-attention. In `turbovla/models/fusion.py`, `BiAttentionBlock` computes visual-to-language and language-to-visual updates, then adds both results back through learned residual scales. Visual features can therefore become instruction-conditioned while language features become aware of the observed scene.

<figure><img src="/generated/turbovla/blog/chapter-2-4.png" alt="Attention arcs running from instruction tokens to visual tokens and back"><figcaption>Both feature streams change; neither is treated as a frozen lookup table for the other.</figcaption></figure>

The model stacks six `GroundingDINOFeatureEnhancer` layers. The paper's interaction ablation reports 95.2% average LIBERO success with no interaction, 96.1% or 96.5% for the two one-way variants, and 97.7% for bidirectional interaction. Its depth sweep reports 93.5% for two layers, 95.7% for four, 97.7% for six, and 96.6% for eight. Six is the measured peak in that experiment, not a universal optimum for every robot policy.

<figure><img src="/generated/turbovla/blog/chapter-2-7.png" alt="Six fusion layers beside an ablation chart topped by bidirectional interaction"><figcaption>The selected six-layer bidirectional stack is tied to the paper's measured ablations.</figcaption></figure>

## Chapter 3 · Ask for Twelve Moves at Once

Robot state enters after visual-language fusion. `StateProjector` maps the current state into two learned tokens, and `VLAActionModel.forward` concatenates them with the enhanced visual and text features to form `act_memory`. This placement keeps the earlier grounding stage focused on the relationship between what the cameras see and what the instruction asks.

<figure><img src="/generated/turbovla/blog/chapter-3-2.png" alt="Visual and text memory tokens joined by two green robot-state tokens"><figcaption>Two projected state tokens complete the decoder memory.</figcaption></figure>

Above that memory sit twelve learned queries. `ACTActionDecoder` sends all twelve through the transformer decoder together; its final head maps each hidden state to a seven-dimensional continuous action and bounds the normalized output with `tanh`. The result has shape `[12, 7]`, so one forward pass predicts a coordinated action chunk rather than waiting for twelve autoregressive rounds.

<figure><img src="/generated/turbovla/blog/chapter-3-6.png" alt="Twelve learned queries decoding in parallel into twelve action vectors"><figcaption>Shared memory and parallel queries produce the entire short-horizon action block.</figcaption></figure>

The evaluation policy denormalizes the chunk and can execute it whole or slice the first few moves before requesting a new observation-conditioned chunk. The paper's horizon sweep reports 96.4% at 8 steps, 96.9% at 10, 97.7% at 12, and 95.6% at 15. Twelve is the chosen balance in this system: shorter chunks reduce temporal reach, while the longest tested horizon was harder to predict.

<figure><img src="/generated/turbovla/blog/chapter-3-8.png" alt="An action-horizon curve peaking at twelve steps"><figcaption>The measured sweep peaks at the implementation's twelve-step chunk.</figcaption></figure>

## Chapter 4 · Put Speed on the Same Plot as Success

Table 1 makes latency and task success visible together. TurboVLA sits at 31.2 ms and 97.7% average LIBERO success. For context, π0.5 is reported at 93.6 ms, 96.9%, 3.4 billion parameters, and 12.8 GB, while TurboVLA is 0.2 billion parameters and 0.9 GB. The comparisons use batch size one on an RTX 4090.

<figure><img src="/generated/turbovla/blog/chapter-4-2.png" alt="A latency-versus-success plot highlighting TurboVLA at the fast high-success corner"><figcaption>The deployment claim is a joint point on speed, success, size, and memory—not any one metric alone.</figcaption></figure>

The 97.7% average comes from 99.2% on LIBERO-Spatial, 99.8% on LIBERO-Object, 97.4% on LIBERO-Goal, and 94.2% on LIBERO-Long. The paper evaluates 40 tasks across those four suites with 50 rollouts per task, for 2,000 trials. Removing language drops average success to 70.8% and LIBERO-Goal to 11.6%, reinforcing that the compact policy still depends on semantic instruction features.

<figure><img src="/generated/turbovla/blog/chapter-4-6.png" alt="Four LIBERO suite bars above a language-ablation panel"><figcaption>Suite-level results and the no-language ablation keep the average attached to its components.</figcaption></figure>

Training in `turbovla/training/trainer.py` uses cached text features, mixed demonstration data, and a masked L1 behavior-cloning loss. The resulting recipe is an execution specialist: semantic language, six bidirectional fusion layers, twelve-step chunks, and parallel continuous actions. The authors explicitly leave complex high-level planning outside the current system's scope; the paper evaluates concrete execution-level instructions rather than claiming a general robot planner.

<figure><img src="/generated/turbovla/blog/chapter-4-7.png" alt="TurboVLA recipe chips above performance and language-ablation panels"><figcaption>The result is strongest when its execution-level scope remains visible beside the headline numbers.</figcaption></figure>

## Sources

- Xie et al., [“TurboVLA: Real-Time Vision-Language-Action Model at 32 Hz on an RTX 4090 with <1 GB VRAM”](https://arxiv.org/abs/2607.27205), arXiv:2607.27205, DOI `10.48550/arXiv.2607.27205`.
- [Hugging Face paper page](https://huggingface.co/papers/2607.27205), selected as the #1 paper for July 30, 2026 with 122 visible upvotes.
- [Official TurboVLA source repository](https://github.com/H-EmbodVis/TurboVLA).
- [Official TurboVLA project page](https://h-embodvis.github.io/TurboVLA/).
