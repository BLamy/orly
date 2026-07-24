# Training T-Rex

**Paper:** *SLAI T-Rex: Full-Parameter Post-training of the DeepSeek-V4 Family on Ascend SuperPOD*  
**Authors:** Dongfang Li, Xiaodong Luo, Ruoyu Sun, Xuhui Chen, and collaborators  
**Stable identifier:** arXiv:2607.20145  
**Hugging Face:** https://huggingface.co/papers/2607.20145  
**Canonical paper:** https://arxiv.org/abs/2607.20145  
**PDF:** https://arxiv.org/pdf/2607.20145  
**Official code:** https://github.com/SLAI-AITP/SLAI-T-Rex

SLAI T-Rex connects two problems that are often discussed separately. The
report studies full-parameter post-training of the DeepSeek-V4 family on an
Ascend SuperPOD, while the public repository exposes the reproducible path for
Operations Research data construction, MindSpeed-LLM continued pre-training
and supervised fine-tuning, checkpoint conversion, and solver-backed
evaluation.

The report says its full system reaches 34.22% model FLOPs utilization on
DeepSeek-V4-Pro, a 2.93× improvement over the cited open-source baseline
recipe. The open repository does not publish every production kernel or
private dataset behind that result. This explainer therefore stays on the
released implementation boundary: the launch topology, the shared packed-data
index, the runnable SFT distillation pipeline, and the solver-grounded
benchmark suite.

## 1. Shard the Beast

The continued-pre-training launcher makes the hardware topology concrete:
eight nodes, sixteen Ascend accelerators per node, and a world size of 128.
That lattice is not treated as a featureless pool. The script chooses tensor
parallel size 1, pipeline parallel size 4, expert parallel size 32, and context
parallel size 1 for a 44-layer DeepSeek-V4-Flash configuration.

<figure><img src="/generated/slai-t-rex/blog/chapter-1-0.png" alt="An empty accelerator lattice begins to fill"><figcaption>A trillion-parameter mixture-of-experts workload first appears as a choreography problem.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-1-1.png" alt="Eight rows of sixteen accelerator cells"><figcaption>The released template expands to eight nodes by sixteen NPUs: 128 workers.</figcaption></figure>

Pipeline parallelism divides the layer stack into four stages. Expert
parallelism then distributes sparse experts across 32 lanes. Tensor and
context parallelism remain at one in the published template. Those values are
not universal tuning advice; they are the exact defaults in
`train_cpt_deepseek4_flash_4k.sh` and
`train_sft_deepseek4_flash_8k.sh`.

<figure><img src="/generated/slai-t-rex/blog/chapter-1-2.png" alt="The lattice divided into four colored bands"><figcaption>Four pipeline bands partition the 44-layer stack.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-1-3.png" alt="Expert identifiers spread across the lattice"><figcaption>Expert parallelism fans the mixture-of-experts work across 32 lanes.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-1-4.png" alt="Parallel configuration values below the lattice"><figcaption>The launch axes are explicit: TP=1, PP=4, EP=32, and CP=1.</figcaption></figure>

The visual micro-batch travels through the four pipeline bands because each
stage owns a different portion of the model. The training scripts pair a
micro-batch size of one with a global batch size of 128. The CPT recipe uses a
sequence length of 4096; the SFT recipe extends that to 8192.

<figure><img src="/generated/slai-t-rex/blog/chapter-1-5.png" alt="A micro-batch token moving through pipeline bands"><figcaption>One micro-batch crosses the four pipeline stages in order.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-1-6.png" alt="Bars comparing CPT and SFT sequence lengths"><figcaption>The released recipes use 4K context for CPT and 8K context for SFT.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-1-7.png" alt="Global batch calculation beneath the accelerator grid"><figcaption>Micro-batch one across 128 workers yields global batch 128.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-1-8.png" alt="Full parallel configuration shown together"><figcaption>The hardware grid and model-parallel axes form one configuration.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-1-9.png" alt="Closing panel summarizing the partition"><figcaption>The workers partition layers and experts rather than copying the whole workload blindly.</figcaption></figure>

## 2. One Shuffle, 128 Readers

Packed instruction training needs a shuffle index. The repository includes
`prepare_sft_indexmap.py` specifically to prevent every node from racing to
create that index independently. In the multi-node launcher, node zero builds
while non-zero nodes invoke the helper in waiting mode.

<figure><img src="/generated/slai-t-rex/blog/chapter-2-0.png" alt="Many training nodes racing toward a shared file"><figcaption>Without coordination, many workers can race toward the same missing index map.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-2-1.png" alt="Node zero identified as the builder while others wait"><figcaption>The launcher gives node zero the build role and turns the rest into waiting readers.</figcaption></figure>

The helper resolves the required sample count directly or multiplies training
iterations by global batch size. It infers the document count from explicit
arguments, conversion statistics, an indexed dataset, or an unambiguous JSONL
source. It repeats document IDs until the array is long enough and optionally
shuffles each pass with NumPy’s seeded random state. The default seed is 1234.

<figure><img src="/generated/slai-t-rex/blog/chapter-2-2.png" alt="Formula for required sample count"><figcaption>The index length follows train iterations times global batch size.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-2-3.png" alt="A tape of repeated document identifiers"><figcaption>Document IDs repeat until the index contains enough samples.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-2-4.png" alt="Document identifiers shuffled on the tape"><figcaption>Seed 1234 makes the shuffled order reproducible.</figcaption></figure>

The write path is deliberately staged. `build_index` writes to a
process-specific temporary path, then uses `os.replace` to install the final
NumPy array atomically. Only after that replacement does it write the adjacent
`.ready` marker.

<figure><img src="/generated/slai-t-rex/blog/chapter-2-5.png" alt="Temporary array file isolated from readers"><figcaption>The builder completes a private temporary array first.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-2-6.png" alt="Temporary file moving to the final index path"><figcaption>An atomic replace installs the complete array at the final path.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-2-7.png" alt="Ready marker beside the final array"><figcaption>The ready marker appears only after the final index exists.</figcaption></figure>

Waiting nodes require both the marker and a valid index whose first dimension
meets the requested sample count. A marker without a loadable, sufficiently
large array is not accepted. The small helper therefore turns a filesystem
race into a reproducible rendezvous.

<figure><img src="/generated/slai-t-rex/blog/chapter-2-8.png" alt="Waiting nodes released toward the validated index"><figcaption>Readers proceed only after the marker and array validity check agree.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-2-9.png" alt="Closing panel summarizing the index rendezvous"><figcaption>One shuffle and one atomic handoff give every node the same packed-data order.</figcaption></figure>

## 3. A Dataset That Rejects Itself

The runnable SFT distillation module begins with compact, high-quality
Operations Research seeds. One public seed describes a portfolio of
EquityFund, BondFund, and MoneyMarket assets with a sum-to-one constraint,
sector composition ranges, and a cost-minimization objective.

<figure><img src="/generated/slai-t-rex/blog/chapter-3-0.png" alt="Portfolio optimization seed card"><figcaption>A real public seed anchors the synthetic generation process.</figcaption></figure>

The pipeline normalizes each seed into an intermediate representation with
explicit modeling dimensions: mode, domain, structure, difficulty, data
interface, and answer style. Controlled generation produces synthetic IR
candidates, then rendering turns each candidate into the two-message SFT
shape expected downstream: one user problem and one assistant modeling answer.

<figure><img src="/generated/slai-t-rex/blog/chapter-3-1.png" alt="Seed factored into a six-axis intermediate representation"><figcaption>The intermediate representation separates six modeling dimensions.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-3-2.png" alt="Several synthetic intermediate representation crystals"><figcaption>Controlled generation varies the structured representation rather than editing prose blindly.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-3-3.png" alt="Candidate structures rendered as user and assistant messages"><figcaption>Each surviving structure renders into an OpenAI-style two-message training row.</figcaption></figure>

Generation is only the beginning. IR validation checks the synthetic
structure; `validate_sft_record` checks the rendered example. Failures go to
`rejected.jsonl` with their stage, attempt identifier, row, and issues.

<figure><img src="/generated/slai-t-rex/blog/chapter-3-4.png" alt="Quality gate over synthetic candidates"><figcaption>Schema and SFT quality checks form the first rejection gate.</figcaption></figure>

The second gate tokenizes problem text and computes Jaccard similarity against
the existing index. Empty problem tokens, duplicate SFT IDs, and candidates
above the configured similarity threshold are rejected even if their schema
is otherwise valid.

<figure><img src="/generated/slai-t-rex/blog/chapter-3-5.png" alt="Token-set similarity gate"><figcaption>Jaccard similarity prevents near-duplicate problems from inflating the dataset.</figcaption></figure>

The pipeline separates accepted rows, rejected attempts, and valid surplus
created after the target quota is reached. Its manifest records target count,
accepted count, similarity threshold, synthetic IR rows, SFT rows, rejected
rows, and output paths.

<figure><img src="/generated/slai-t-rex/blog/chapter-3-6.png" alt="Accepted rejected and surplus output ledgers"><figcaption>Three output ledgers preserve why each attempt did or did not enter training.</figcaption></figure>

Accepted synthetic IRs can re-enter `accepted_synthetic_pool.jsonl` as parents
for later rounds. That gives the flywheel its expansion mechanism while the
original seeds remain anchors.

<figure><img src="/generated/slai-t-rex/blog/chapter-3-7.png" alt="Accepted examples looping back into the parent pool"><figcaption>Accepted structures become controlled parent context for future rounds.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-3-8.png" alt="Accepted count measured against target count"><figcaption>Progress is accepted examples divided by the requested target, not raw generation attempts.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-3-9.png" alt="Closing panel showing the guarded flywheel"><figcaption>The flywheel expands only through examples that survive quality and similarity checks.</figcaption></figure>

## 4. Let the Solver Keep Score

The evaluation module does not grade optimization answers as free-form prose.
Its prompt templates ask the model to emit Python compatible with Gurobi 12.x.
The solver-backed entry points extract code and evaluate the resulting
formulation against feasibility and objective checks.

<figure><img src="/generated/slai-t-rex/blog/chapter-4-0.png" alt="Capital budgeting problem with objective and constraints"><figcaption>A benchmark problem hides variables, objective, and constraints inside natural language.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-4-1.png" alt="Gurobi-compatible Python generated from the problem"><figcaption>The requested answer is executable formulation code, not merely an explanation.</figcaption></figure>

A candidate can sound plausible while landing outside the feasible region.
Executing the model makes that distinction mechanical. A valid formulation
must satisfy the constraints and recover the expected objective under the
benchmark’s solver checks.

<figure><img src="/generated/slai-t-rex/blog/chapter-4-2.png" alt="Candidate point outside a feasible polygon"><figcaption>A plausible candidate can still violate the optimization constraints.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-4-3.png" alt="Red infeasible solver verdict"><figcaption>Solver execution rejects an infeasible point regardless of fluent prose.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-4-4.png" alt="Candidate moved into the feasible region"><figcaption>A passing answer satisfies the constraints and reaches the checked objective.</figcaption></figure>

The default `run_eval.sh` target set covers NL4OPT, OptiBench,
B40-Feasible, and B40-ORGEval. It exposes sampling and execution controls
including temperature, top-p, seed, few-shot settings, accuracy samples, and
per-target worker counts. The default seed is 42 and the default number of
accuracy samples is one.

<figure><img src="/generated/slai-t-rex/blog/chapter-4-5.png" alt="Four solver-backed benchmark targets"><figcaption>The same solver gate is applied across the four default benchmark targets.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-4-6.png" alt="Evaluation seed temperature and worker settings"><figcaption>The runner makes sampling and concurrency controls explicit.</figcaption></figure>

The resulting metric is Pass@1: whether the first generated formulation
actually solves the task. The repository README reports a 71.81% average
zero-shot Pass@1 across the four benchmarks, 3.98 percentage points above the
reported GPT-5.4-Mini comparison and 11.27 points above the base
DeepSeek-V4-Flash comparison.

<figure><img src="/generated/slai-t-rex/blog/chapter-4-7.png" alt="Pass at one score begins to fill"><figcaption>Pass@1 asks whether the first formulation survives execution and checking.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-4-8.png" alt="Reported average zero-shot pass at one of 71.81 percent"><figcaption>The paper reports 71.81% average zero-shot Pass@1 across the suite.</figcaption></figure>

<figure><img src="/generated/slai-t-rex/blog/chapter-4-9.png" alt="Closing journey from seed through training to solver verdict"><figcaption>The end-to-end path closes on a solver verdict rather than a stylistic judgment.</figcaption></figure>
