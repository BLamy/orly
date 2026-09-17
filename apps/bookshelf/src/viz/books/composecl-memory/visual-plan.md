# The Three Anchors — visual plan

Paper: **Continual Learning Mechanisms Compose for Long-Horizon Memorization**

Stable identifier: **arXiv:2609.06986**

Official source: **https://github.com/cozheyuanzhangde/compose-cl** at `32fc441a8e8d6120becf144f74370a59eca213a1`

Throughline: one query-answer association enters task one and tries to remain legible after ninety-nine more updates.

## Chapter 1 — One Hundred Ways to Forget

Grounding: `README.md`, dataset manifests, `evaluate.py`, and `analysis/summarize.py`.

The persistent object is a gold query-answer memory. A one-hundred-task tape grows beneath it; the memory dims as naive sequential fine-tuning overwrites it. The tape folds into the lower-triangular temporal accuracy matrix that `evaluate.py` actually records. The final row becomes the retention readout. Three dataset lanes—Symbol-QA, LLM-QA, and Real-QA—make clear that this is memorization without task identifiers, not a benchmark with routing hints.

## Chapter 2 — Three Anchors, One Update

Grounding: `core/generative_replay.py`, `core/self_distillation.py`, `core/si.py`, `core/ewc.py`, and `core/training.py`.

The persistent object is the same memory inside a model core. The data anchor sends generated replay examples back through the learner. The function anchor lays the previous-state teacher distribution over the student distribution. The weight anchor turns important parameters into springs that resist displacement. Each mechanism guards a different surface—examples, outputs, and parameters—before the three restraints visibly compose around one update.

## Chapter 3 — Fold, Then Make Room

Grounding: `train.py` and `experiments/methods.py`.

The persistent object is the base weight matrix. A rank-thirty-two LoRA update arrives as two thin factors, multiplies into a delta, and folds into the base with `merge_and_unload`. A fresh adapter is then created with `get_peft_model` for the next task. Three task-colored deltas accumulate in the matrix while the active low-rank slot resets, contrasting with one shared adapter being rewritten repeatedly.

## Chapter 4 — Halve the Field, Measure the Memory

Grounding: `tsh/run.py`, `tsh/README.md`, `experiments/methods.py`, `analysis/factorial.py`, and the paper/project results.

The persistent object is a cloud of ninety candidate configurations. Task-Level Successive Halving evaluates them at horizons ten, twenty, fifty, and one hundred, reducing the field 90→45→23→10. The survivors unfold into the sixteen cells of the two-to-the-four factorial over SI, self-distillation, replay, and merged LoRA. The ending lands on the reported fixed composition: 18.5%, 41.8%, and 44.3% final retention across the three datasets, averaging 34.9% versus 1.2% for naive fine-tuning.
