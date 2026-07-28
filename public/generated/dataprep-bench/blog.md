# Proving Training Data

**Paper:** *DataPrep-Bench: Benchmarking LLMs as Training Data Preparators*

**Stable identifier:** arXiv:2607.20465

**Authors:** Hao Liang, Qifeng Cai, Yibo Lin, Jianzhuo Du, Qifeng Xia, Sizhe Qiu, Linzhuang Sun, Meiyi Qiang, Zhaoyang Han, Xiaochen Ma, Bohan Zeng, Ruichuan An, Conghui He, and Wentao Zhang

**Sources:** [Hugging Face paper](https://huggingface.co/papers/2607.20465) · [canonical paper](https://arxiv.org/abs/2607.20465) · [PDF](https://arxiv.org/pdf/2607.20465) · [official code](https://github.com/OpenDCAI/Data-Preparation-Bench)

DataPrep-Bench asks a practical question that surface-level data inspection cannot settle: if an LLM prepares a training dataset, does a model trained on that dataset become better at the target domain? The released repository makes that question executable. It contains a full-coverage construction skill, a shared fine-tuning and downstream-evaluation protocol, an embedding-based distribution metric, and code for correlating metric scores with measured model accuracy.

## 1. Every Chunk Gets a Verdict

The repository's `data_construction_skill` turns long Markdown sources into supervision data without quietly sampling away inconvenient sections. Its contract starts with full coverage: split the document, build a manifest, process the next unfinished chunks, validate the records, and audit the final ledger. That accounting discipline is the first part of the benchmark because a preparation method cannot be compared fairly if it silently ignores source material.

<figure><img src="/generated/dataprep-bench/blog/chapter-1-0.png" alt="A long source document entering the data construction skill"><figcaption>A long document enters with a strict invariant: every resulting chunk must eventually receive a final status.</figcaption></figure>

`split_markdown_book.py` respects Markdown headings before subdividing oversized material. That keeps a chunk attached to its section context while enforcing a manageable character ceiling.

<figure><img src="/generated/dataprep-bench/blog/chapter-1-1.png" alt="A document splitting into section-aware chunks"><figcaption>Heading-aware segmentation preserves local meaning; long sections split again only when needed.</figcaption></figure>

The skill does not reduce every passage to interchangeable question answering. It defines three supervision jobs: `concept_qa` for ideas, `process_qa` for ordered reasoning or procedures, and `case_application` for applying source-grounded rules to a concrete case.

<figure><img src="/generated/dataprep-bench/blog/chapter-1-2.png" alt="Concept, process, and case application supervision forms"><figcaption>Concept, process, and case examples teach different capabilities and therefore have different acceptance criteria.</figcaption></figure>

The accompanying reference rubric rejects document trivia, unsupported inference, and prompts that make sense only while the source is open beside them. Kept samples must stand alone while remaining traceable to their source chunk.

<figure><img src="/generated/dataprep-bench/blog/chapter-1-3.png" alt="A quality gate evaluating a candidate supervision sample"><figcaption>The quality gate favors reusable, source-supported supervision over extraction artifacts.</figcaption></figure>

Every chunk must end in one of two explicit states. A kept chunk produces synchronized supervision records; a skipped chunk carries a concrete reason. Missing output is not treated as a decision.

<figure><img src="/generated/dataprep-bench/blog/chapter-1-4.png" alt="Kept and skipped paths writing to a status ledger"><figcaption>Both outcomes are data: kept records and justified skips enter the same accounting system.</figcaption></figure>

`next_unprocessed_chunks.py` uses that status ledger to make the workflow resumable. After an interrupted run, the next batch is derived from what has already reached a final state rather than from guesswork.

<figure><img src="/generated/dataprep-bench/blog/chapter-1-5.png" alt="An append-only status ledger identifying unfinished chunks"><figcaption>The append-only ledger turns interruption recovery into a deterministic query.</figcaption></figure>

`validate_qa_jsonl.py` checks the record shape, accepted sample types, source anchoring, and suspicious placeholder language before the output can count as finished.

<figure><img src="/generated/dataprep-bench/blog/chapter-1-6.png" alt="Validation checks running over generated supervision records"><figcaption>Validation tests both structural completeness and common signs of ungrounded or placeholder output.</figcaption></figure>

The final coverage audit crosses the manifest, generated samples, and statuses. The skill's completion rule requires `unprocessed_chunks = 0`, with no generated sample left without a corresponding final status.

<figure><img src="/generated/dataprep-bench/blog/chapter-1-7.png" alt="A coverage audit crossing the full chunk manifest"><figcaption>Completion is a measurable property of the whole manifest, not a feeling derived from a plausible-looking sample.</figcaption></figure>

That is the chapter's core idea: before judging whether prepared data is useful, the benchmark first makes the preparation process accountable for every source chunk.

<figure><img src="/generated/dataprep-bench/blog/chapter-1-8.png" alt="A complete ledger with every source chunk accounted for"><figcaption>A complete dataset begins with a complete record of what was kept, skipped, and why.</figcaption></figure>

## 2. Make the Data Prove It

Polished examples are not the endpoint. DataPrep-Bench evaluates a constructed dataset by training a model on it under a shared recipe and then measuring the trained model on downstream tasks. Holding the protocol steady makes the candidate data—not a changing training setup—the variable under test.

<figure><img src="/generated/dataprep-bench/blog/chapter-2-0.png" alt="A downstream-trained model judging the value of prepared data"><figcaption>The benchmark's expensive judge is the behavior of a model after fine-tuning.</figcaption></figure>

Each construction method begins from the same source pool. The visual keeps those raw sources visible while the candidate methods branch, emphasizing that methods do not get to choose different starting material.

<figure><img src="/generated/dataprep-bench/blog/chapter-2-1.png" alt="Shared raw sources branching to multiple construction methods"><figcaption>Common inputs prevent source selection from masquerading as better preparation.</figcaption></figure>

The released experiment combines each method's candidate output with the same Dolly-15k anchor set. A common anchor makes comparisons less sensitive to an otherwise different base mixture.

<figure><img src="/generated/dataprep-bench/blog/chapter-2-2.png" alt="Candidate datasets joining a shared Dolly-15k anchor"><figcaption>Every candidate joins the same anchor, keeping the comparison centered on the constructed portion.</figcaption></figure>

`Experiment.md` specifies a shared three-epoch fine-tuning recipe with cosine scheduling and DeepSpeed ZeRO-3. The point is not that these are universally optimal settings; it is that the settings remain fixed across candidates.

<figure><img src="/generated/dataprep-bench/blog/chapter-2-3.png" alt="A fine-tuning furnace labeled three epochs, cosine, and DeepSpeed ZeRO-3"><figcaption>A fixed training recipe converts each candidate dataset into a comparable trained model.</figcaption></figure>

The evaluation spans six domains in the repository: math, general knowledge, science, business, medicine, and law. Each domain routes to its associated benchmark tooling.

<figure><img src="/generated/dataprep-bench/blog/chapter-2-4.png" alt="A six-spoke downstream evaluation wheel"><figcaption>Six domain spokes test whether preparation utility survives beyond a single benchmark family.</figcaption></figure>

`Data-Agent-Evaluation/scripts/run_all_bench.sh` coordinates the domain runs, while the simple-evaluation path serves the model, generates answers, applies the configured judge, and extracts aggregate scores.

<figure><img src="/generated/dataprep-bench/blog/chapter-2-5.png" alt="Serve, infer, judge, and aggregate evaluation stages"><figcaption>The repository turns a trained checkpoint into downstream evidence through an explicit evaluation pipeline.</figcaption></figure>

Once the runs complete, each method card receives a downstream score. This is where an appealing dataset becomes a measurable intervention.

<figure><img src="/generated/dataprep-bench/blog/chapter-2-6.png" alt="Construction method cards transforming into downstream score cards"><figcaption>Training utility replaces surface quality as the comparison target.</figcaption></figure>

The paper reports a concrete result for the construction skill: on Llama-3.1-8B in Finance, it improves the Dolly-only baseline by nearly twenty absolute points. This is a reported benchmark result, not a rerun performed for this explainer.

<figure><img src="/generated/dataprep-bench/blog/chapter-2-7.png" alt="Reported finance improvement over the Dolly-only baseline"><figcaption>The reported Finance result illustrates why downstream training is a stricter judge than visual inspection.</figcaption></figure>

The benchmark's standard is therefore operational: prepared data earns credit when a model trained on it can do more, under the same training and evaluation conditions.

<figure><img src="/generated/dataprep-bench/blog/chapter-2-8.png" alt="A clean end card stating that training utility is the judge"><figcaption>The candidate dataset must prove itself through the capability it transfers to the trained model.</figcaption></figure>

## 3. Measure the Gap Between Clouds

Full fine-tuning is informative but expensive. The repository also implements Distributional Alignment Score (DAS), an embedding-based metric intended to estimate whether candidate data resembles a trusted domain proxy before running another training job.

<figure><img src="/generated/dataprep-bench/blog/chapter-3-0.png" alt="Candidate and domain-proxy data clouds"><figcaption>DAS frames domain fit as a distance between two distributions of embedded examples.</figcaption></figure>

The released `examples/compute_mmd.py` experiment samples 5,000 examples from each dataset and shuffles with seed 42. Fixing the sample count and seed makes repeated comparisons reproducible.

<figure><img src="/generated/dataprep-bench/blog/chapter-3-1.png" alt="Two datasets sampled to five thousand points with seed forty-two"><figcaption>Equal sample sizes and a fixed shuffle seed establish the input to the metric.</figcaption></figure>

Qwen3-Embedding maps each sample into a 4,096-dimensional representation. The animation shows only a two-dimensional projection; the metric itself operates on the full embedding vectors.

<figure><img src="/generated/dataprep-bench/blog/chapter-3-2.png" alt="Text samples becoming high-dimensional embedding clouds"><figcaption>The on-screen plane is a visual shadow of the repository's 4,096-dimensional embedding space.</figcaption></figure>

An RBF kernel converts pairwise distance into soft similarity. Nearby embeddings contribute a stronger connection than distant ones, without requiring a hard cluster boundary.

<figure><img src="/generated/dataprep-bench/blog/chapter-3-3.png" alt="Radial-basis kernel links connecting nearby embedded points"><figcaption>The kernel makes proximity continuous: close pairs matter more, while distant pairs fade.</figcaption></figure>

The biased maximum mean discrepancy estimator first averages kernel similarities within the candidate cloud.

<figure><img src="/generated/dataprep-bench/blog/chapter-3-4.png" alt="Within-candidate kernel similarities being averaged"><figcaption>The first term summarizes how the candidate distribution relates to itself.</figcaption></figure>

It then computes the same within-distribution average for the proxy cloud, using the same kernel and scale.

<figure><img src="/generated/dataprep-bench/blog/chapter-3-5.png" alt="Within-proxy kernel similarities being averaged"><figcaption>The second term measures the trusted domain proxy under identical geometry.</figcaption></figure>

Cross-cloud similarity is subtracted twice. The resulting MMD value is small when the two embedded distributions align and grows as their distributions separate.

<figure><img src="/generated/dataprep-bench/blog/chapter-3-6.png" alt="Maximum mean discrepancy equation combining within- and cross-cloud terms"><figcaption>MMD balances two within-cloud averages against twice the cross-cloud average.</figcaption></figure>

Moving the candidate cloud toward the proxy strengthens cross-cloud similarity and contracts the discrepancy. This motion is explanatory geometry, not a claim that real data can be corrected by shifting two screen coordinates.

<figure><img src="/generated/dataprep-bench/blog/chapter-3-7.png" alt="Candidate cloud moving toward the proxy as discrepancy shrinks"><figcaption>Better distributional alignment corresponds to a smaller kernel distance.</figcaption></figure>

DAS does not require a fresh model fine-tune to produce its value, but the benchmark still holds the metric accountable to downstream training: its usefulness depends on predicting which candidate datasets actually yield better models.

<figure><img src="/generated/dataprep-bench/blog/chapter-3-8.png" alt="Distributional distance pointing toward downstream training utility"><figcaption>A cheaper proxy metric matters only if it tracks the expensive behavioral result.</figcaption></figure>

## 4. A Score Must Track Reality

A data-quality metric starts as a hypothesis about usefulness. `src/distflow/benchmark.py` turns that hypothesis into a test by pairing metric outputs with stored downstream benchmark results and then computing how consistently the two move together.

<figure><img src="/generated/dataprep-bench/blog/chapter-4-0.png" alt="Metric score and downstream accuracy axes"><figcaption>The central test is whether high metric values reliably accompany high measured utility.</figcaption></figure>

Each registered metric scores the same named candidate datasets. Running candidates one pool at a time keeps the identity of each metric result explicit.

<figure><img src="/generated/dataprep-bench/blog/chapter-4-1.png" alt="A metric evaluator scoring named candidate datasets"><figcaption>Every candidate receives a metric value before any correlation is computed.</figcaption></figure>

The evaluator then joins each metric value with the downstream accuracy stored under the same dataset name. A matched pair—not either number by itself—is the unit of evidence.

<figure><img src="/generated/dataprep-bench/blog/chapter-4-2.png" alt="Metric values joining downstream accuracies by dataset name"><figcaption>Name-aligned pairs connect the inexpensive prediction to the expensive training outcome.</figcaption></figure>

Pearson correlation measures the strength of a linear relationship between those paired values.

<figure><img src="/generated/dataprep-bench/blog/chapter-4-3.png" alt="Pearson correlation over metric and accuracy pairs"><figcaption>Pearson asks whether score and accuracy rise together along a straight-line pattern.</figcaption></figure>

Spearman correlation instead compares rank order. A metric can preserve the ordering of candidates even when the spacing between its raw values differs from the spacing between accuracies.

<figure><img src="/generated/dataprep-bench/blog/chapter-4-4.png" alt="Spearman rank correlation over the same candidate pairs"><figcaption>Spearman tests ordering agreement without requiring linear spacing.</figcaption></figure>

A linear fit adds a slope and intercept, providing a compact view of how score changes calibrate against accuracy changes in the observed candidates.

<figure><img src="/generated/dataprep-bench/blog/chapter-4-5.png" alt="A fitted line crossing the metric-accuracy scatter plot"><figcaption>The fitted line summarizes direction and scale without replacing the underlying points.</figcaption></figure>

Across the six domains, the paper reports DAS as the strongest cross-model correlation in four. This is the authors' reported comparison across their evaluated metrics and models.

<figure><img src="/generated/dataprep-bench/blog/chapter-4-6.png" alt="Six domain result cards with four led by DAS"><figcaption>DAS leads the reported cross-model correlation comparison in four of six domains.</figcaption></figure>

The paper also reports DAS as the only evaluated metric to exceed correlation 0.70 simultaneously for Math, Science, and Medical data.

<figure><img src="/generated/dataprep-bench/blog/chapter-4-7.png" alt="Math, science, and medical correlation cards above point seven"><figcaption>The simultaneous threshold result highlights consistency across three distinct domains.</figcaption></figure>

The full benchmark loop now closes: construct a candidate dataset, train under the shared protocol, evaluate downstream behavior, estimate distributional alignment, and compare the estimate with the observed result.

<figure><img src="/generated/dataprep-bench/blog/chapter-4-8.png" alt="Construction, training, distribution measurement, and correlation forming a closed loop"><figcaption>Preparation methods and proxy metrics both answer to downstream model behavior.</figcaption></figure>

DataPrep-Bench's durable contribution is this common court of appeal. A preparation method may use skills, agents, selectors, or another recipe; the benchmark asks each one to produce complete data and then demonstrate what the resulting model can actually do.

<figure><img src="/generated/dataprep-bench/blog/chapter-4-9.png" alt="The complete DataPrep-Bench evaluation loop"><figcaption>Construction quality becomes an empirical claim with a shared protocol, auditable artifacts, and measured outcomes.</figcaption></figure>
