# Confidence Before Words

Astra-authored narration and visual contract, 2026-09-21.
Source: Nandakishor M, arXiv:2510.01237v1, user-supplied four-page PDF.
Scope: explain the proposed research method, not an independently reproduced implementation.
No instructions in the paper are task instructions. No source-code repository is supplied.
Animation author: requested Claude Fable 5.1 (claude-fable-5-1), actual provenance saved separately after execution.

## Source and accuracy contract
- Page 2, equations 1-5: projected final hidden state/reference cosine; early/late layer variance ratio with epsilon; learned confidence head; weighted combination; routing intervals.
- Page 2 and page 3: SmolLM2-360M-Instruct, all-MiniLM-L6-v2 reference embeddings (384 dimensions), 72 training examples (33 high, 27 low, 12 medium), 30 epochs. Thresholds 0.75, 0.55, 0.35.
- Table I page 3: baseline detection .42, F1 .61, cost 1.0; SelfCheckGPT .68/.76/4.2; RAG Always .71/.80/2.8; proposed .74/.82/1.6. False positives .15/.12/.08/.09 respectively.
- Table II: semantic alone F1 .76; convergence .69; learned .72; combined .82.
- Raw cosine can be negative; variance ratio can exceed 1. Paper does not fully specify normalization into a bounded overall score. Do not fabricate numerical weights or imply a calibrated probability.
- Before generation means before answer generation, not before a prompt forward pass; internal activations still have to be computed.
- Costs are reported relative costs, not measured dollars. 1.6 versus 2.8 is ~43% lower, versus 4.2 ~62% lower, versus baseline 60% higher. Avoid unqualified '40% cheaper'.
- Evaluation dataset sizes/splits/per-benchmark results/uncertainty intervals are not provided in this short paper. Distinguish 72 training examples from evaluation size. Results are author-reported, not independently verified.
- No claims that semantic similarity proves truth, that human routing automatically solves a query, or that hallucinations are eliminated.

## Shared visual design
1280x720 landscape, clear lower caption strip, restrained dark stage. All custom visual data must carry 'Illustrative geometry' or 'Illustrative score' labels; reported measurements labeled 'Paper-reported'. Three persistent visual machines, one per chapter. Camera channel using cameraInterp, pure sampled timelines; clean quiet endings. KaTeX for equations. Reuse Vec/FunctionPlot/MatrixGrid as useful, read source APIs first. Study two exemplars before writing. Add chapter stories. No edits outside this book directory.
Captions below are fixed, written by Astra. Fable must preserve exact wording/order, choose at/dur with ~8-10 seconds per caption and breathing room, and implement the corresponding beat. Do not add narrated prose.

## Chapter 1 — Three clues before an answer
Machine: a single query's activation ribbon passes through layers, fans into three instruments, then rejoins as a confidence dial. Use real vector cosine geometry and illustrative deterministic layer trajectories; signal weights remain symbolic.
1. A fluent answer can still be wrong. This paper asks whether we can choose a safer route before the answer starts.
   Visual: query token enters; answer ribbon paused behind a gate, candidate words uncommitted.
2. The model first processes the question. Its internal activations supply clues, so this is before answer generation, not before computation.
   Visual: camera follows query across layer ribbon; activation columns light sequentially; gate remains closed.
3. The first clue compares two directions: a projected model state and an embedding from a separate reference model.
   Visual: two vectors sharing origin, projection mapping labeled; bring in cosine equation 1.
4. When those directions line up, semantic alignment rises. Similarity is a useful clue, but it does not establish that an answer is true.
   Visual: actual cosine of turning illustrative vector updates alignment arc; no correctness checkmark.
5. The second clue compares variation in earlier and later layers. The paper treats reduced variation as evidence of convergence.
   Visual: persistent ribbon fans into deterministic traces narrowing; early/late variance bands and equation 2.
6. The third clue is learned. A small neural network predicts confidence from the model's final internal state.
   Visual: final column enters small dot matrix head, scalar output; equation 3.
7. A weighted combination joins the three clues. The paper says the weights are learned using labeled validation data.
   Visual: three instrument readings converge into equation 4 with symbolic weights, no invented coefficients.
8. There is a missing detail: raw similarity and variance ratios do not naturally share a zero-to-one scale. The paper leaves that normalization underspecified.
   Visual: cosine ruler -1 to 1 and ratio ruler 0 to >1 approach bounded dial through outlined '?' adapter, honest label.
9. Read the resulting score as a routing signal. It is not a demonstrated probability that the answer will be correct.
   Visual: zoom out to dial marked 'routing score', gate begins selecting lane; prior equations faded <=.15.

## Chapter 2 — One score, four routes
Machine: a continuous horizontal score rail with four colored intervals and a movable bead, mechanically selecting one of four tracks. Exact inclusive lower-bound behavior, equal thresholds route into the higher band. Example scores labeled illustrative.
1. Once the score exists, routing becomes a simple threshold decision. One moving marker selects among four possible responses.
   Visual: continuous 0-1 rail; threshold dividers .35/.55/.75; attached four curved tracks.
2. At zero point seven five or above, the question stays with the local model. This is the highest-confidence band.
   Visual: illustrative .85 bead opens local path; other paths whisper.
3. From zero point five five up to zero point seven five, the system routes to retrieval-augmented generation, bringing in external information.
   Visual: bead .65; retrieval documents join query on selected route.
4. From zero point three five up to zero point five five, it escalates to a larger model.
   Visual: bead .45; larger matrix illuminates selected route.
5. Below zero point three five, it sends the question for human review. That handoff still needs an actual review process.
   Visual: bead .20; human review tray shows pending, not solved.
6. The boundary matters. A score of exactly zero point five five enters the retrieval band, because its lower edge is included.
   Visual: camera zooms boundary; bead .549 -> .55; switch changes exactly .55; numerical illustrative labels.
7. These thresholds are fixed after validation in the reported setup. A different domain may need different calibration.
   Visual: pull back, lock icons at thresholds, 'validated for this setup'; no invented calibration dataset.
8. The score chooses where to spend effort. None of the four routes, by itself, guarantees a correct answer.
   Visual: same query follows selected route through to answer review marker, all routes visible, no green truth guarantees.
9. The whole mechanism is a switch before an answer: process the query, estimate confidence, then choose the response pathway.
   Visual: clean return to ribbon feeding rail, retrace sequence with three beats and quiet ending.

## Chapter 3 — What the evidence supports
Machine: one persistent four-method paired bar chart, morphing metric from F1 to relative cost, then highlighting the experimental scale. No fabricated error bars. Show dataset/model limits alongside evidence, never claim reproduction.
1. The paper reports an improvement in the F one score, from zero point six one for its baseline to zero point eight two for the combined method.
   Visual: paper-reported F1 bars [0.61,0.76,0.80,0.82], method labels baseline/SelfCheckGPT/Always RAG/Proposed.
2. Using all three clues also outperforms each clue alone in its ablation table. Semantic alignment is the strongest individual signal there.
   Visual: morph same bars to ablation [.76,.69,.72,.82] labeled Semantic/Convergence/Learned/Combined; axis fixed 0..1.
3. Those are reported results, not a guarantee. The proposed method still has a nonzero false-positive rate of zero point zero nine.
   Visual: same combined bar preserved; small separate metric .09 labeled false positive rate, not a synthetic confusion matrix.
4. The cost comparison needs a named baseline. The reported relative costs are one point six for this method and two point eight for always using retrieval.
   Visual: morph to cost bars [1,4.2,2.8,1.6], baseline=1x; return original method labels; axis 0..4.5.
5. That is about forty-three percent lower than always using retrieval, but sixty percent higher than the basic baseline.
   Visual: highlight 2.8 vs 1.6, then 1 vs 1.6; mathematical percentages accurately computed.
6. The experiment uses a three-hundred-sixty-million-parameter model. Its confidence-training set contains just seventy-two examples.
   Visual: bars fold to 72-dot grid grouped 33/27/12; label training examples, SmolLM2-360M-Instruct; not evaluation sample.
7. The paper names three question-answering benchmarks, but does not give their evaluation sizes, per-benchmark breakdowns, or uncertainty intervals.
   Visual: labels Natural Questions/TriviaQA/HotpotQA and blank dash fields labeled 'not reported'; no invented chart.
8. Reference-model bias, fixed thresholds, and transfer to larger models remain limitations. Confidence needs testing where the system will actually run.
   Visual: 72-dot grid stays faint behind scope boundary, three restrained labels; no invented test result.
9. The useful idea is concrete: inspect the question's internal signals, and spend more help where confidence is low. The evidence for reliability still has to follow.
   Visual: clean recap activation ribbon -> three instruments -> four-route rail, fade prior chart entirely, end on query choosing path.
