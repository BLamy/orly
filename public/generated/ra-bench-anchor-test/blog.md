# The Anchor Test

RA-Bench asks a deliberately hard question: can a detector recognize AI-generated crisis footage when the generator changes, people already found the result convincing, and social-media processing has damaged the original signal? The paper, **“Can We Defend Against AI-Generated Video Attacks on Real-World Crisis Events? A Systematic Evaluation of Detectors, Generators and Social Dissemination,”** is [arXiv:2608.14391](https://arxiv.org/abs/2608.14391), selected as the most-upvoted Hugging Face Daily Paper for August 17, 2026. Its [Hugging Face page](https://huggingface.co/papers/2608.14391), [canonical paper](https://arxiv.org/abs/2608.14391), and [official RA-Bench repository](https://github.com/24029100313/RA-Bench) provide the evidence behind this explainer.

The benchmark’s organizing idea is simple but powerful: keep real crisis videos as anchors. The released main track contains 1,830 real anchors across 10 social-risk categories and 16,056 generated counterparts from nine sources—four open-source and five closed-source generators—for 17,886 videos in total. The chapters follow that same anchor through dataset construction, source-equal scoring, human deception, and last-mile processing.

![One real anchor fans into nine generation sources](/generated/ra-bench-anchor-test/blog/chapter-1-2.png)

## 1. One Anchor, Nine Mirrors

A benchmark comparison is only meaningful if the examples being compared retain a stable identity. RA-Bench’s metadata does that with `norm_clip_id`: one real crisis clip remains fixed while generated counterparts from Hailuo, HappyHorse, Kling, LTX, Omni, Runway, Seedance, Wan dynamic, and Wan light are matched back to it. The scene turns that relationship into a matrix, with the real anchor on the left and nine source columns on the right.

The matrix matters because RA-Bench is not merely a pile of unrelated real and generated clips. Each generator is tested against the real scenes it attempted to reproduce. Scaling the same pattern across 1,830 anchors and 10 categories produces the released 17,886-video main track without losing the identity needed for paired evaluation.

![The matched matrix preserves norm_clip_id](/generated/ra-bench-anchor-test/blog/chapter-1-4.png)

![The real anchor remains the invariant](/generated/ra-bench-anchor-test/blog/chapter-1-7.png)

## 2. Count Each Source Once

The reference evaluator in `scripts/evaluate_predictions.py` begins with strict prediction records: an `item_id`, an optional continuous `fake_score`, and an optional discrete `prediction`. It rejects duplicates, missing required outputs, and non-finite scores before pairing a generated item with the real row that shares its normalized clip identity.

The nine generators do not contribute identical numbers of public pairs. A naïve pooled metric would therefore give larger sources more influence. RA-Bench instead computes each metric separately inside each generation source and takes the arithmetic mean of those nine source-level results. Every source gets one vote, regardless of its clip count. The public-media coverage evaluates 11,579 reproducible matched pairs; full coverage follows all 16,056 paper-manifest pairs when the URL-only real anchors are available under their original terms.

![Predictions pass validation before pairing](/generated/ra-bench-anchor-test/blog/chapter-2-1.png)

![Unequal source counts would distort a pooled score](/generated/ra-bench-anchor-test/blog/chapter-2-4.png)

![Source-level metrics are averaged equally](/generated/ra-bench-anchor-test/blog/chapter-2-7.png)

## 3. The Five-Person Sieve

RA-Bench-HumanProof isolates generated clips that people consistently mistake for real footage. Three reviewers judge a candidate in the first stage and two more repeat the test in the second. A single “generated” judgment removes the clip; only candidates called real by all five assigned reviewers enter the subset.

That rule yields 633 human-deceptive generated videos, each still linked to its matched real anchor. The evaluator reports pooled HumanProof metrics as the primary result and preserves source-specific and equal-source views as diagnostics. This track tests detectors on the exact outputs that already survived a five-person authenticity screen, not on an abstract proxy for visual quality.

![Five reviewers form a strict authenticity sieve](/generated/ra-bench-anchor-test/blog/chapter-3-3.png)

![Only all-five-real candidates survive](/generated/ra-bench-anchor-test/blog/chapter-3-6.png)

![Human-deceptive clips become a detector stress test](/generated/ra-bench-anchor-test/blog/chapter-3-8.png)

## 4. Six Trips Through the Last Mile

Real distribution platforms transform video. RA-Bench-LastMile follows the same paired evidence through six conditions: T0 keeps the standardized original; T1 encodes with VP9 and transcodes to H.264; T2 adds half-size spatial downsampling; T3 converts to eight frames per second; T4 adds a news badge; and T5 combines the complete chain. The released track repeats those conditions across 150 anchors and all nine generation sources.

The identity thread never changes even as pixels, frame cadence, codec artifacts, and overlays do. That controlled structure supports the paper’s finding that social dissemination makes detection harder: the benchmark can attribute the difficulty to a known transformation of the same underlying comparison rather than to a different collection of scenes.

![The six LastMile conditions form a controlled track](/generated/ra-bench-anchor-test/blog/chapter-4-1.png)

![The same clip accumulates dissemination changes](/generated/ra-bench-anchor-test/blog/chapter-4-6.png)

![Real evidence stays fixed across the whole test](/generated/ra-bench-anchor-test/blog/chapter-4-9.png)

RA-Bench’s contribution is not a claim that one current detector solves crisis-video authenticity. The paper reports the opposite: detector families fail to generalize consistently, videos that mislead people are difficult for current detectors, and dissemination further degrades reliability. The anchor design makes those failures comparable—and gives future detectors a precise target to improve against.
