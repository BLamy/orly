# The Masked Mechanism — visual plan

Throughline: one masked cell. The same blank cell survives every chapter: it gains an identity, gathers evidence across two axes, becomes a training question, and finally exits through one of three public task routes.

## 1. Every cell keeps its place

Grounding: paper §§2.1–2.2; `model/v2_0/transformer.py`; `model/v2_0/encoders.py`.

Persistent machine: a table whose cells rise into separate 256-dimensional tokens. One cell is erased into the shared missing embedding, then receives its low-rank column code. The row never collapses to one token. The camera moves from the whole table into the masked cell and back.

## 2. Across rows, then columns

Grounding: paper §2.3; `model/v2_0/transformer.py`; `model/v2_0/layer.py`; `model/v2_0/decoupled_structural_task_attention.py`.

Persistent machine: the token table becomes a loom. A vertical sweep carries context along the sample axis; a horizontal sweep mixes variables within each row. The target opens into four slots, and asymmetric attention lets the task read features without turning every task token into a feature. Twenty-four layers accumulate behind the same grid.

## 3. A mask becomes a question

Grounding: paper §§3.1–3.3; `model/v2_0/transformer.py` (`eval_pos`, feature reconstruction); `model/v2_0/encoders.py`.

Persistent machine: one context/query table cycles through the three paper mask patterns—individual entries, query columns, and blocks. Each blank retains its column identity. The model reconstructs the blank or reads the target from the same conditional evidence.

## 4. Three answers, one model

Grounding: paper §2.4 and conclusion; `README.md`; `inference/v2_0/predictor.py`; `config/cls_default_noretrieval_v2.json`; `config/reg_default_noretrieval_v2.json`; `config/reg_default_noretrieval_MVI_v2.json`.

Persistent machine: support and query rows enter the public `LimiXPredictor.predict` route, fan through the configured preprocessing ensemble, reunite at the LimiX-2 checkpoint, and leave as class probabilities, a 5,000-bin regression expectation, or an imputed matrix. The closing beat retraces the masked cell through all four chapters.
