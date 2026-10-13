# Rendering the Rules

AgentGarten separates a world's rules from the pixels an agent sees. This walkthrough follows the released neural renderer: how geometry becomes conditioning tokens, how training rebuilds differentiable history, and how inference keeps that history bounded. The repository's code worlds and agent practice loop remain listed for a future release. These are illustrative diagrams of released code; no trained model inference is shown.

Paper: [AgentGarten: Code Worlds for Evolving Agents](https://arxiv.org/abs/2610.12374), arXiv:2610.12374v1 (base identifier 2610.12374). [Hugging Face paper](https://huggingface.co/papers/2610.12374), selected from the [October 9, 2026 listing](https://huggingface.co/papers/date/2026-10-09), where it ranked first at 139 upvotes when checked on October 10. By Jiawei Chi, Shangchen Miao, Zhiyuan Shi, Kailu Wu, Hanyang Wang, Weiliang Chen, Qiyu Dai, Jinshan Ren, Jun Gao, Mingsheng Long, Yueqi Duan, Jiangran Lyu, Jialong Wu, and Fangfu Liu. [Official code](https://github.com/MirroS-Lab/AgentGarten), pinned to source commit 06bb4621deb9b380c34abb6dac42fe0b31eec2e3.

### Geometry becomes a compact condition sequence

Depth and surface normals are [prepared as video-like signals and spatially pooled](https://github.com/MirroS-Lab/AgentGarten/blob/06bb4621deb9b380c34abb6dac42fe0b31eec2e3/wm/networks/cosmos3/geometry.py), then [encoded with the frozen video codec](https://github.com/MirroS-Lab/AgentGarten/blob/06bb4621deb9b380c34abb6dac42fe0b31eec2e3/wm/networks/cosmos3/conditioner.py). The implementation averages corresponding depth and normal latent patches before applying the shared image projection and adding the geometry modality embedding. At the paper's 480-by-832 output setting, 28 geometry tokens accompany 390 image tokens per latent frame. Their spatial coordinates cover the same image extent; the smaller grid supplies coarse geometric context rather than a separate control network. [Source](https://github.com/MirroS-Lab/AgentGarten/blob/06bb4621deb9b380c34abb6dac42fe0b31eec2e3/wm/networks/cosmos3/network.py).

{% viz scene="books/agentgarten-rendering-the-rules/chapter-1" section="geometry-condition" cue="0" from="0.000" to="67.384" title="Geometry becomes a compact condition sequence." %}
{% endviz %}

![Illustrative chapter 1 frame](/generated/agentgarten-rendering-the-rules/blog/geometry-condition.png)

### Rebuild the encoding, keep the recorded frame fixed

The [training rollout](https://github.com/MirroS-Lab/AgentGarten/blob/06bb4621deb9b380c34abb6dac42fe0b31eec2e3/wm/models/dmd.py) records final noisy inputs and clean outputs without retaining the sampling graph. Its replay keeps those recorded latents detached, but recomputes the history keys and values inside a differentiable graph. A later prediction's loss can therefore update the parameters that encode earlier history. The replay preserves blockwise attention calls, key/value order, and projection grouping because a matching visibility mask alone does not guarantee matching floating-point execution. [Source](https://github.com/MirroS-Lab/AgentGarten/blob/06bb4621deb9b380c34abb6dac42fe0b31eec2e3/wm/networks/cosmos3/attention.py).

{% viz scene="books/agentgarten-rendering-the-rules/chapter-2" section="replay-history-gradient" cue="0" from="0.000" to="73.189" title="Rebuild the encoding, keep the recorded frame fixed." %}
{% endviz %}

![Illustrative chapter 2 frame](/generated/agentgarten-rendering-the-rules/blog/replay-history-gradient.png)

### Keep the recent past inside a fixed position horizon

Streaming inference first publishes the clean reference, then denoises and commits blocks of four latent frames. The default policy retains five sink frames and 44 recent frames, with the current block outside that budget. Once the stream crosses its 61-frame training horizon, top-aligned rotary coordinates keep the active block within the trained range while recent history shifts behind it. Retained keys are re-rotated; values move without rotation. Geometry content continues to use the true simulation timeline. [Source](https://github.com/MirroS-Lab/AgentGarten/blob/06bb4621deb9b380c34abb6dac42fe0b31eec2e3/wm/networks/cosmos3/streaming.py).

{% viz scene="books/agentgarten-rendering-the-rules/chapter-3" section="bounded-stream" cue="0" from="0.000" to="65.203" title="Keep the recent past inside a fixed position horizon." %}
{% endviz %}

![Illustrative chapter 3 frame](/generated/agentgarten-rendering-the-rules/blog/bounded-stream.png)
