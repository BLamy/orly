# A Million Tokens Deep

**Paper:** *Kimi K3: Open Frontier Intelligence*

**Stable identifier:** arXiv:2607.24653

**Authors:** Kimi Team et al.

**Sources:** [Hugging Face paper](https://huggingface.co/papers/2607.24653) · [canonical paper](https://arxiv.org/abs/2607.24653) · [PDF](https://arxiv.org/pdf/2607.24653) · [official repository](https://github.com/MoonshotAI/Kimi-K3)

Kimi K3 is organized around a demanding systems question: how can a model keep useful state across a million-token trajectory without letting memory, numerical range, or distributed coordination grow without control? The technical report answers at four different scales. Kimi Delta Attention manages state across tokens, Attention Residuals retrieve state across network depth, Stable LatentMoE routes state across experts, and the reinforcement-learning infrastructure preserves both model caches and agent environments across long, interruptible rollouts.

The official repository publishes the technical report and project documentation rather than an implementation source tree. This explainer therefore stays within the mechanisms, equations, architecture constants, and infrastructure measurements documented in those official sources.

## 1. Decay Without Overflow

Kimi K3 alternates three Kimi Delta Attention layers with one Gated Multi-head Latent Attention layer. Delta attention provides a recurrent path through long local spans, while periodic global attention lets information cross those spans. The report's architecture table specifies 93 layers and a maximum context length of 1,048,576 tokens.

<figure><img src="/generated/kimi-k3/blog/chapter-1-0.png" alt="A million-token tape entering lower-bounded Kimi Delta Attention"><figcaption>The chapter begins with the scale of the problem: a state must remain useful across an exceptionally long token stream.</figcaption></figure>

The recurrent state is not a verbatim cache of every token. Each step updates a compact state, so the computation can continue without allocating a full attention matrix over the entire history.

<figure><img src="/generated/kimi-k3/blog/chapter-1-1.png" alt="A compact recurrent state moving along a token tape"><figcaption>Kimi Delta Attention carries a recurrent state forward instead of retaining every token-to-token interaction.</figcaption></figure>

That recurrence depends on a decay gate. If the accumulated log-decay can fall without bound, long sequences eventually push the state into a numerically hostile range.

<figure><img src="/generated/kimi-k3/blog/chapter-1-2.png" alt="An unbounded log-decay curve falling across a long sequence"><figcaption>An unconstrained negative log-decay accumulates range problems as the sequence grows.</figcaption></figure>

Kimi K3 replaces the unbounded gate with a scaled sigmoid and fixes its minimum at \(g_{\min}=-5\). The lower bound is the key numerical constraint: decay remains expressive, but the representation cannot disappear into arbitrarily negative exponents.

<figure><img src="/generated/kimi-k3/blog/chapter-1-3.png" alt="A bounded decay curve stopping at negative five"><figcaption>The scaled sigmoid preserves a trainable gate while enforcing the report's lower bound.</figcaption></figure>

The report then divides attention into 16-token tiles. Within a tile, the bounded range makes the position-pair scaling safe to represent in BF16.

<figure><img src="/generated/kimi-k3/blog/chapter-1-4.png" alt="A causal sixteen-token attention tile"><figcaption>A small causal tile turns the long recurrence into a local, regular unit of work.</figcaption></figure>

Position-pair scaling follows the causal diagonal. Because the log-decay difference within a tile is bounded, its exponentiated scale does not span an uncontrolled numerical range.

<figure><img src="/generated/kimi-k3/blog/chapter-1-5.png" alt="A diagonal path through a causal attention tile"><figcaption>The diagonal highlights the bounded relative decay between positions inside one tile.</figcaption></figure>

The tile remains dense below the causal diagonal. That is important for hardware: the operation can use dense Tensor Core matrix multiplication rather than introducing a sparse kernel merely to express decay.

<figure><img src="/generated/kimi-k3/blog/chapter-1-6.png" alt="Dense causal tiles mapped to Tensor Core computation"><figcaption>Lower-bounded decay and dense tiling work together: numerical stability does not require abandoning efficient matrix kernels.</figcaption></figure>

Periodic Gated MLA supplies the global path that a purely recurrent local mechanism would lack. The architecture repeats a three-to-one rhythm: three KDA layers, then one Gated MLA layer.

<figure><img src="/generated/kimi-k3/blog/chapter-1-7.png" alt="Three KDA layers followed by one Gated MLA layer"><figcaption>The repeating 3:1 rhythm combines recurrent local state with periodic global retrieval.</figcaption></figure>

The result is a division of labor rather than one monolithic attention mechanism. KDA carries state economically through long spans; Gated MLA reconnects that state to global context.

<figure><img src="/generated/kimi-k3/blog/chapter-1-8.png" alt="The completed KDA and Gated MLA architecture rhythm"><figcaption>Kimi K3's token-level memory is both bounded and periodically global.</figcaption></figure>

## 2. Every Layer Can Look Back

A conventional residual stream compresses the history of network depth into one accumulated representation. Each layer inherits that single state and must preserve every detail that a later layer might need.

<figure><img src="/generated/kimi-k3/blog/chapter-2-0.png" alt="Layer outputs connected by one residual stream"><figcaption>Standard residual depth behaves like recurrence: one evolving state carries the past.</figcaption></figure>

That creates a depth bottleneck. Old information survives only through every intervening merge, even when a much later layer would benefit from retrieving an earlier representation directly.

<figure><img src="/generated/kimi-k3/blog/chapter-2-1.png" alt="One residual state bottleneck beside a stack of layers"><figcaption>One state must simultaneously preserve all the features that future layers could request.</figcaption></figure>

Attention Residuals make earlier layer outputs addressable. A later layer uses a learned pseudo-query to attend over representations from previous depths, treating depth more like a memory axis.

<figure><img src="/generated/kimi-k3/blog/chapter-2-2.png" alt="Earlier layer outputs fanning into a learned pseudo-query"><figcaption>Earlier representations become retrievable keys and values rather than an irreversibly merged stream.</figcaption></figure>

The learned query assigns soft weights, so the next layer can emphasize the depths that are useful for its current computation.

<figure><img src="/generated/kimi-k3/blog/chapter-2-3.png" alt="Weighted connections from earlier layers to a pseudo-query"><figcaption>Depth retrieval is selective: line weight represents the learned contribution of each prior representation.</figcaption></figure>

Full attention over depth is affordable in arithmetic but expensive in live state. Retaining every layer output costs memory and creates pipeline communication proportional to the number of layers, \(O(Ld)\).

<figure><img src="/generated/kimi-k3/blog/chapter-2-4.png" alt="A full-depth state cost panel"><figcaption>The pressure comes from keeping and moving every layer representation, not merely from computing the weights.</figcaption></figure>

Kimi K3's Block Attention Residuals compress that depth axis. Layers are grouped into blocks, with partial sums inside a block and attention over one summary per completed block.

<figure><img src="/generated/kimi-k3/blog/chapter-2-5.png" alt="Layer outputs reorganized into residual-attention blocks"><figcaption>Block summaries preserve depth access while reducing how many representations remain globally live.</figcaption></figure>

The report specifies eight blocks of 12 layers, plus the embedding as an additional source representation. The visualization condenses the 93-layer network while preserving that documented organization.

<figure><img src="/generated/kimi-k3/blog/chapter-2-6.png" alt="Eight colored blocks and an embedding source"><figcaption>Eight block summaries and the embedding replace a flat list of every layer output.</figcaption></figure>

With \(N\) block sources rather than \(L\) individual layers, the live memory and communication term becomes \(O(Nd)\). Every new layer can still retrieve across network depth, but the system moves a bounded set of summaries.

<figure><img src="/generated/kimi-k3/blog/chapter-2-7.png" alt="Block summaries flowing into a compact source panel"><figcaption>Block-level retrieval keeps depth addressable while shrinking the state that crosses the pipeline.</figcaption></figure>

Attention Residuals therefore apply the same general idea twice: keep history available, then learn what to retrieve. Across tokens the model addresses temporal state; across layers it addresses representational state.

<figure><img src="/generated/kimi-k3/blog/chapter-2-8.png" alt="Eight block summaries and nine compact source points"><figcaption>Depth becomes a compact, addressable memory rather than one increasingly burdened residual stream.</figcaption></figure>

## 3. Sixteen Experts, No Stampede

Kimi K3's mixture-of-experts layer has 896 routed experts, activates 16 of them per token, and includes two shared experts. Routing this many destinations directly from the model-width representation would make both projection and dispatch unnecessarily large.

<figure><img src="/generated/kimi-k3/blog/chapter-3-0.png" alt="One token representation facing a large field of experts"><figcaption>A wide token representation approaches a field of 896 possible routed experts.</figcaption></figure>

Stable LatentMoE first projects the token from model width \(d=7168\) into a latent width \(\ell=3584\). Routing and expert computation operate in that compact latent space.

<figure><img src="/generated/kimi-k3/blog/chapter-3-1.png" alt="A model-width token projected into a narrower latent representation"><figcaption>The latent projection reduces the representation carried into the routed expert field.</figcaption></figure>

Only the top 16 routed experts activate for a token. The two shared experts remain available outside that sparse choice, providing capacity that does not depend on the router's selection.

<figure><img src="/generated/kimi-k3/blog/chapter-3-2.png" alt="Sixteen highlighted routed experts plus two shared experts"><figcaption>Sparse activation uses a small subset of the 896 routed experts alongside two shared paths.</figcaption></figure>

Sparse routing is useful only if its numerical inputs remain controlled. The report applies RMSNorm before the latent projection \(W^\downarrow\), normalizing the coordinates that enter the MoE.

<figure><img src="/generated/kimi-k3/blog/chapter-3-3.png" alt="RMSNorm placed before the latent down projection"><figcaption>Normalization precedes the latent projection, constraining the representation before routing.</figcaption></figure>

The expert nonlinearity is SiTU-GLU, a smoothed, bounded variant of the multiplicative GLU path. The report sets \(\beta_1=4\) and \(\beta_2=25\).

<figure><img src="/generated/kimi-k3/blog/chapter-3-4.png" alt="A SiTU-GLU response curve with a smooth cap"><figcaption>The smoothed cap bounds the activation branch instead of allowing a multiplicative coordinate to grow unchecked.</figcaption></figure>

Bounding both branches matters because their product can amplify a large coordinate. SiTU-GLU retains a useful nonlinear transition while suppressing extreme products.

<figure><img src="/generated/kimi-k3/blog/chapter-3-5.png" alt="A capped activation curve feeding the routed expert field"><figcaption>The activation cap is a stability mechanism for the expert computation, not a routing heuristic.</figcaption></figure>

Capacity is the other failure mode. If many tokens select the same few experts, those destinations become stragglers even when the average assignment looks balanced.

<figure><img src="/generated/kimi-k3/blog/chapter-3-6.png" alt="A concentrated band of overloaded experts"><figcaption>A routing stampede turns a small set of experts into a distributed-systems bottleneck.</figcaption></figure>

Kimi K3 uses Quantile Balancing. Rather than responding only to mean load, the balancing signal tracks the high-load portion of the expert distribution.

<figure><img src="/generated/kimi-k3/blog/chapter-3-7.png" alt="Expert-load quantiles identifying an overloaded tail"><figcaption>Quantile-based feedback focuses on the overloaded tail that determines straggler time.</figcaption></figure>

The router can then steer future assignments away from saturated experts while preserving top-16 sparsity for each token.

<figure><img src="/generated/kimi-k3/blog/chapter-3-8.png" alt="Expert assignments spreading into a balanced load row"><figcaption>Balancing changes where sparse work lands; it does not make every token visit every expert.</figcaption></figure>

Stable LatentMoE is therefore a coordinated design: compact latent computation, normalized inputs, bounded multiplicative activations, and tail-aware load balancing. Each mechanism controls a different way that a large expert field could become unstable or slow.

<figure><img src="/generated/kimi-k3/blog/chapter-3-9.png" alt="The completed Stable LatentMoE flow with balanced expert load"><figcaption>Sixteen active experts remain useful only when the representation, activation, and distributed load are all controlled.</figcaption></figure>

## 4. Keep the Agent's World Alive

Long-context reinforcement learning adds a second kind of persistence problem. A trajectory may approach 1,048,576 tokens, but it also carries tool results and an external environment whose state must survive pauses between rollout iterations.

<figure><img src="/generated/kimi-k3/blog/chapter-4-0.png" alt="A million-token agent trajectory with tool-result markers"><figcaption>The trajectory includes both model tokens and events that belong to the agent's surrounding world.</figcaption></figure>

Kimi K3 uses partial rollouts: an unfinished trajectory can stop at an iteration boundary and continue later. Recomputing the discarded prefix would waste the most expensive part of an already long run.

<figure><img src="/generated/kimi-k3/blog/chapter-4-1.png" alt="A partial-rollout boundary on a long trajectory"><figcaption>A partial rollout creates an explicit resume point rather than forcing the trajectory to restart.</figcaption></figure>

Active decoding cache blocks stay on the GPU. Reusable, idle prefixes can be written back to an external KV-cache pool in CPU DRAM and prefetched when the rollout resumes.

<figure><img src="/generated/kimi-k3/blog/chapter-4-2.png" alt="GPU cache blocks moving to an external CPU-memory pool"><figcaption>The external pool trades slower memory for much larger persistent prefix capacity.</figcaption></figure>

Kimi K3's hybrid attention means a reusable prefix has two cache forms: recurrent KDA state and MLA key/value blocks. The cache lifecycle keeps both forms aligned.

<figure><img src="/generated/kimi-k3/blog/chapter-4-3.png" alt="KDA recurrent state paired with MLA key-value cache"><figcaption>A hybrid prefix is valid only when its recurrent and global-attention state describe the same boundary.</figcaption></figure>

An auto-throttling scheduler watches queued work and KV-cache pressure. It lowers concurrency before long contexts exhaust the available cache budget.

<figure><img src="/generated/kimi-k3/blog/chapter-4-4.png" alt="An auto-throttling panel reacting to cache pressure"><figcaption>Concurrency follows available state capacity instead of remaining fixed while contexts grow.</figcaption></figure>

The model cache is only half of an agent rollout. AgentENV runs each task in an isolated microVM so the filesystem and memory state belonging to the tool environment can persist as well.

<figure><img src="/generated/kimi-k3/blog/chapter-4-5.png" alt="An AgentENV microVM beside the model cache lifecycle"><figcaption>AgentENV preserves the world that generated the observations, not just the tokens that recorded them.</figcaption></figure>

The report says checkpoints transfer only dirtied pages and gives minimum measured times of 133 milliseconds for checkpoint and 49 milliseconds for resume.

<figure><img src="/generated/kimi-k3/blog/chapter-4-6.png" alt="AgentENV checkpoint and resume times"><figcaption>Dirty-page checkpointing makes environment persistence practical within a rollout loop.</figcaption></figure>

Pause releases resources while inference proceeds; fork creates a judging branch without mutating the original environment; snapshot provides a recovery point. These are lifecycle operations for the agent's stateful world.

<figure><img src="/generated/kimi-k3/blog/chapter-4-7.png" alt="A forked judging environment branching from AgentENV"><figcaption>Forking supports evaluation against the same starting world while leaving the original trajectory intact.</figcaption></figure>

Prefix reuse also needs finer boundaries than one large physical cache block. The report illustrates 12 hash blocks of 512 tokens inside a 6,144-token physical block, with sparse delta-state checkpoints marking resumable boundaries.

<figure><img src="/generated/kimi-k3/blog/chapter-4-8.png" alt="Twelve fine-grained hash blocks inside a physical cache block"><figcaption>Fine-grained hashes locate reusable text spans; state checkpoints determine where hybrid computation can resume.</figcaption></figure>

In the report's example, the system restores at \(B=2560\). The KDA recurrent state and MLA cache return together, so prefill continues without recomputing the prefix interval \([0,B)\).

<figure><img src="/generated/kimi-k3/blog/chapter-4-9.png" alt="A restore marker at token 2560"><figcaption>The restore boundary binds the two cache forms to one verified reusable prefix.</figcaption></figure>

This infrastructure completes the paper's state story. Across tokens, layers, experts, model caches, and agent environments, Kimi K3 keeps the smallest useful representation of the past and restores it at an explicit boundary instead of rebuilding everything.

<figure><img src="/generated/kimi-k3/blog/chapter-4-10.png" alt="A clean hybrid-prefix restore at token 2560"><figcaption>Million-token agents become tractable when both model state and environment state can pause, move, and resume coherently.</figcaption></figure>
