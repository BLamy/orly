# The Three Anchors

**Paper:** [Continual Learning Mechanisms Compose for Long-Horizon Memorization](https://arxiv.org/abs/2609.06986) by Zheyuan Zhang, Alvin Zhang, Daniel Khashabi, and Tianmin Shu

**Stable identifier:** arXiv:2609.06986 · DOI: 10.48550/arXiv.2609.06986

**Daily Paper:** [Hugging Face paper page](https://huggingface.co/papers/2609.06986)

**Official implementation:** [cozheyuanzhangde/compose-cl](https://github.com/cozheyuanzhangde/compose-cl) at commit `32fc441a8e8d6120becf144f74370a59eca213a1`

Language models learn new information by changing the same parameters that hold earlier information. The ComposeCL paper makes that collision measurable over one hundred sequential query-answer tasks, then asks whether defenses that preserve different surfaces of memory become stronger when combined.

### One hundred updates turn memory into a matrix

The experiment removes easy routing clues. At inference, the model receives a question without a task identifier, and every question maps to one globally unique answer. Symbol-QA uses ten thousand arbitrary key-value associations; LLM-QA uses ten thousand fluent but fictional facts; Real-QA uses five thousand natural questions filtered so the base model cannot already answer them. Training and evaluation use the same associations because the target is retention, not held-out generalization.

{% viz scene="books/composecl-memory/chapter-1" section="chapter-1-horizon" cue="5" from="0.000" to="76.486" title="One hundred updates turn memory into a matrix." %}
{% endviz %}

After every task, `evaluate.py` revisits all learned tasks and appends an accuracy row. The diagonal measures immediate acquisition; the last row measures final retention; the gap between a task's best score and that last row measures forgetting. A bright diagonal is therefore not success by itself. Long-horizon memory lives or dies in the final row.

### Three anchors restrain three kinds of drift

The data anchor in `core/generative_replay.py` snapshots the previous adapter as a frozen teacher. That teacher generates replay text from a dedicated seed token and supplies soft targets on the generated examples, letting the learner rehearse without retaining the original training records. The solver mixes current-task cross-entropy with forward-KL distillation on replay.

{% viz scene="books/composecl-memory/chapter-2" section="chapter-2-anchors" cue="6" from="0.000" to="87.120" title="Three anchors restrain three kinds of drift." %}
{% endviz %}

The function anchor in `core/self_distillation.py` compares the student's full next-token distribution with the previous-state teacher on current inputs. The weight anchor in `core/si.py` records the path integral of task gradients and parameter displacement, consolidates that evidence at the task boundary, and penalizes movement away from important saved coordinates. Replay protects remembered data, distillation protects outputs, and Synaptic Intelligence protects parameters; `core/training.py` applies them to the same update.

### A protected update still needs somewhere to live

LoRA limits each task's trainable change to rank thirty-two factors. With one shared adapter, later tasks continue writing into the same narrow coordinates. The merged allocation rule changes the task boundary instead: `train.py` calls `merge_and_unload()` to fold the current delta into the base model, saves that merged checkpoint, then creates a fresh adapter with `get_peft_model(merged, lora_cfg)`.

{% viz scene="books/composecl-memory/chapter-3" section="chapter-3-merge" cue="5" from="0.000" to="88.189" title="A protected update still needs somewhere to live." %}
{% endviz %}

That loop separates two questions the paper treats as independent design dimensions. Anchors determine what an update should preserve; allocation determines where the update is retained. Merged LoRA keeps one fixed-size active learner state with respect to the number of tasks, while each completed task becomes part of the cumulative base model.

### The search narrows before the factorial opens

Task-Level Successive Halving starts with ninety development configurations: three weight-anchor choices, three function-anchor choices, five data-anchor choices, and two allocation choices. It evaluates ninety configurations at ten tasks, forty-five at twenty tasks, twenty-three at fifty tasks, and ten at one hundred tasks. Every score is final retention averaged over seeds forty-one, forty-two, and forty-three.

{% viz scene="books/composecl-memory/chapter-4" section="chapter-4-factorial" cue="6" from="0.000" to="106.160" title="The search narrows before the factorial opens." %}
{% endviz %}

The final experiment evaluates all sixteen on-or-off combinations of Synaptic Intelligence, self-distillation, replay, and merged LoRA. The all-mechanisms composition reaches 18.5% final retention on Symbol-QA, 41.8% on LLM-QA, and 44.3% on Real-QA—34.9% on average, compared with 1.2% for naive sequential fine-tuning. It is the only fixed composition ranked in the top three on all three datasets. Factorial analysis attributes the largest average gains to replay and merged LoRA and finds their interaction super-additive in every stream.

The important result is not that one defense wins. It is that different defenses leave different holes, and a measured composition can cover them.
