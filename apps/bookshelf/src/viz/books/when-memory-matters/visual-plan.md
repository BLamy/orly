# When Memory Matters — visual plan

## Provenance and paper

- Planning role: Astra. `requested_model: gpt-6-astra`; `actual_model: gpt-6-astra`.
- D3/SVG implementation role: `claude-fable-5-1`, invoked with the latest Claude CLI through `generator/run-fable.mjs`. Preserve the captions below verbatim. This file is a plan, not an implementation.
- Paper: **RealCompanion: Benchmarking Human Understanding from Reasoning over Longitudinal Real-World Conversations**.
- Authors: **Arman Behnam, Sunglyoung Kim, Liangwei Yang**.
- arXiv: **2610.01780**, researched PDF **v2**, dated **2 October 2026**.
- Hugging Face: https://huggingface.co/papers/2610.01780
- Paper: https://arxiv.org/abs/2610.01780
- Official reproducibility repository: https://anonymous.4open.science/r/realcompanion-54CC/
- Source material: official repository digest `/tmp/realcompanion-digest.txt`; official repository at `/tmp/realcompanion-official.0nVBfb/repo`; full paper text at `/tmp/realcompanion-paper.oKvWzu/2610.01780.txt`.
- Book slug: `when-memory-matters`. Five two-dimensional chapters, about eighty seconds each. No 3D asset is necessary: temporal distance, set membership and denominators are the explanatory geometry.

## What this book establishes

The throughline is **the probe**: one actual user turn, taken from a released conversation, becomes an evidence-backed evaluation item. First show the complete path on a conversation tape. Then unpack sparse demand, the derivation, the public audit and the consequences for scoring.

The public package contains structural metadata and deterministic routines, not the real conversation text. It supplies a submission scorer for `chat` and `qa`. The paper additionally evaluates reconstruction of profiles and personas. Do not show a reconstruction command or imply that the full paper evaluation harness is implemented here. `docs/reproduction_map.md` explicitly marks the baseline evaluation suite, ablation and deployed-system evaluation commands as planned. Paper-only results must carry a small `Paper §6 / Table …` label, never a fabricated console run.

Use committed manifest/expected files for structural counts and the paper's named table for paper-only results. The paper contains inconsistent figures in different passages, notably persona empty-slot totals, reconstruction F1 in the abstract versus Table 6, and question defect rates across repair states. Omit those figures. Do not silently combine old reproduction-map evaluation numbers with the paper's current hit-at-five numbers. Retrieval **hit** means at least one gold turn; the public scorer's **recall** means the fraction of all gold turns recovered. Keep both names visible when comparing them.

The measured demand rate describes ten histories from one application, under an annotation procedure. It does not establish a universal rate for humans or companions. Verification can miss a referent; neither the recorded nor strict reading establishes perfect labels. Rewriting preserves a released version of the real conversations, not the original wording. The probe is verbatim **within that released version**.

## Visual system and implementation contract

Stage: 1280 by 720. Keep all essential marks, labels, equations and source notes inside x=70…1210, y=75…610, including after camera transforms. Nothing load-bearing may occupy y≥633. Put chapter heading at y=54 and a one-line source note near y=608. Use fixed screen overlays for source notes if camera motion would move them into the caption area.

Palette: pale blue for the current thread/probe, violet for distant references, warm yellow for a proposed claim, green for verified membership, rose for removed or inconsistent material. A hollow outline means metadata or a recorded judgment, not missing data. The same turn remains recognizable by its identifier and color throughout each chapter.

Every chapter must declare a camera using `tl.channel('cam', CAMERA_HOME, cameraInterp)`. The camera plan below is a target framing, not permission to clip labels. Use `ease.enter` 0.6s, `ease.move` 1.2s, `ease.draw` 1.4s, and `ease.linear` for scans. The beat tables give an 8s cadence: caption starts at the listed time, lasts 7.0s, and leaves roughly 1.0s stillness. First scene content starts at 0.3s. Total chapter duration 80.0s. Preserve this authored clock; publishing supplies the narration clock separately.

At most three independently moving elements per beat. Earlier layers fade to ≤0.15 when no longer relevant. Final text gets a dark opaque field and prior decorative details fade away. All point positions, membership partitions, counts and set arithmetic are computed at module scope, and each frame is a pure function of sampled channels. Do not load the large upstream manifest at runtime; commit small, source-cited constants selected below. Reverse seeking must reconstruct the same state.

Studied exemplars: `explainers/fourier/scene.ts` and `Fourier.tsx` for one object changing representation with mathematically linked views; `explainers/pagerank/scene.ts` and `PageRank.tsx` for precomputed states, mass-preserving interpolation and staged labels. Borrow their continuity and restrained channels, not their historical narration wording or missing camera interpolation. Existing `Camera`, `MathLabel`, `NumberLine`, `Brace` and `MatrixGrid` are candidates; read each chosen primitive before use. Purpose-built local `ConversationTape`, `ProbeLedger`, `PopulationRibbon` and `EvidenceComb` are visual renderers, not claims that those components exist upstream. Do not modify shared core or primitives.

Book files: `chapter-1.tsx` through `chapter-5.tsx`, each with `buildScene`, `Render({s})`, `vizScene`, and a sibling Storybook story titled `Books/When Memory Matters/Chapter N`. Leading scene comments must list the specific sources below. No audio in scene/story code. Verification before narration: typecheck, build, every chapter rendered and scrubbed forward/backward at beat centers and boundaries. After publication generation, verify the built book with `generator/verify-book.mjs`.

## Chapter 1 — A conversation becomes a test

Persistent object: a **conversation tape**, first a living sequence of alternating speaker marks, then a keyed record with one probe and its earlier evidence. It fans into five aligned translucent layers while retaining the original turn marks at the base. This is a temporal object, not five boxes joined by arrows.

Camera: begin tight on the probe area around (890,310), k=1.15; pull out to all ten histories around (640,335), k=0.92 at beat 2; glide along the enlarged U10 tape at beat 4; push into two cited turns at beat 7; return home for the five-file overview and quiet close.

Data: subject message counts in order U01…U10 are `[115,173,173,195,420,1349,2005,2918,7243,12627]`, total 27,218. The tape graphics may aggregate turns into bins but must say `Each mark summarizes turns` when they do. Never imply each displayed dot is a real individual message unless using exact one-dot-per-turn data. Length is message count, not calendar span. On the local example use U10 `day8-151`, recent `day8-150`, distant `day7-50`, from the committed manifest. Do not reproduce private-looking invented dialogue. Labels alone explain source membership.

| At | Exact narration caption | What changes, and exact labels | Source |
|---|---|---|---|
| 0.3 | A companion can remember a conversation and still miss the moment when that memory matters. | A bright probe stops the tape; a distant violet mark remains visible while the recent window stays blue. | Paper §§1, 4.1 |
| 8.3 | This benchmark starts with ten real relationships, stretching across as many as one hundred twenty days. | Pull back to ten unequal tapes labeled `U01`…`U10`; show `10 subjects`, `up to 120 days`. | Paper Table 2; manifest `subjects` |
| 16.3 | Together, those relationships contain more than twenty seven thousand messages. | Tapes align on an honest shared message-count axis; total resolves to `27,218 messages`. | `expected/counts_both.json`, `totals.messages` |
| 24.3 | The released words are rewritten for privacy, while the conversation keeps its order and evidence links. | Marks retain position and identifier while an abstract text texture dissolves; label `Released, rewritten conversations`. | `docs/pipeline.md`, The released text; paper §3 |
| 32.3 | A test probe is a user message copied exactly from that released conversation. | Zoom to `U10 / probe_dayid: day8-151`; extract the same keyed mark, not a new authored question. | Manifest U10 chat row; paper §4.1; `gate_a` |
| 40.3 | The system sees the messages before the probe, so a future reply cannot become an answer key. | Sweep right of the probe into shadow; bracket earlier tape with `history strictly before probe`. | `README.md`, Submitting a system |
| 48.3 | The recent thread and the earlier evidence remain separate, even when both support the reply. | Recent `day8-150` and distant `day7-50` lift into separate slots without losing their tape anchors. | Manifest row `required_context` equivalents; `gate_d` |
| 56.3 | A profile records supported claims, while a persona records interpretations of the person. | Two transparent overlays grow above the same tape; labels `profile`, `persona`; keep evidence anchor lines faint. | Paper §3 and Appendix C.2 |
| 64.3 | Chat items and authored questions provide two ways to test what a system does with that history. | Two additional overlays reveal `chat` and `qa`; source base remains dominant; distinguish `verbatim probe` / `authored question`. | `README.md`; paper Table 3 |
| 72.3 | Every test now leads back to a record that a reader can inspect and challenge. | Five layers compress into one bound tape with source IDs still visible; quiet title `A probe with a traceable past`. | Paper Appendix C.7; `docs/pipeline.md` |

Blog sections: `chapter-1-record` covering authored 0–32s, title “Real histories, rewritten words”; `chapter-1-probe` covering 32–80s, title “The probe stays attached to its past”. Explain that real history and released wording are different claims.

## Chapter 2 — Rare does not mean nearby

Persistent object: a **population ribbon** of exactly 1,169 compact cells. Its 40 violet cells peel outward, then 25 become hollow under the stricter reading. The same ribbon expands to hold enriched cases in a visually separated extension. The farthest-evidence summary stretches its tape axis without pretending to show an empirical distribution from aggregate quantiles.

Camera: home for the complete denominator; push into the 40-cell tail at 16s; widen enough to compare recorded and strict at 24s; pan to the separated enriched extension at 40s; finally move to a single highlighted long-distance bracket at 64s and pull out for the close. Use real geometric proportion for 40/1169; a magnification inset may show the small part, but must carry `magnified`.

Do not animate a random sample: the code draws deterministically within routing buckets with tier floors. Use `proportional stratum` as the authors' name and describe it as the stratum used to estimate the natural rate; do not claim every source message had equal random selection probability. All fractions use scoreable populations. The 434 abstention controls stay outside the denominator.

| At | Exact narration caption | What changes, and exact labels | Source |
|---|---|---|---|
| 0.3 | Most messages in these conversations concern what is happening now. | Populate the ribbon with a large blue majority; hold a visible empty numerator slot. | Paper §6 |
| 8.3 | The sample used to estimate demand contains eleven hundred sixty nine scoreable probes. | The ribbon settles into exact cells; brace `proportional: 1,169 scoreable / 1,227 released`. | `expected/counts_proportional.json` |
| 16.3 | Forty carry verified references beyond the recent thread, giving the recorded rate of three point four percent. | Exactly 40 cells turn violet; `40 / 1,169 = 3.4%`, `recorded reading`. | `expected/on_screen.json`, proportional.recorded |
| 24.3 | Some referents are already visible in the recent conversation, despite having older citations. | Twenty-five of those 40 gain a hollow yellow inner mark; show `referent_on_screen: clear`. | `expected/on_screen.json`; `docs/pipeline.md`, on-screen field |
| 32.3 | Removing those cases leaves fifteen probes, or one point three percent under the stricter reading. | The 25 cells remain as outlines; 15 stay violet; `15 / 1,169 = 1.3%`, `clear removed`. | `expected/on_screen.json`, proportional.clear_removed |
| 40.3 | A separate sweep adds rare memory cases so comparisons have more examples to work with. | A separated extension reveals `enriched: 364 scoreable / 373 released`; never lengthen the natural-rate brace. | `expected/counts_enriched.json`; `expected/census.json` |
| 48.3 | Those selected cases cannot join the denominator used to describe ordinary conversation. | A attempted join stops at the brace boundary; `both = proportional + enriched` remains a comparison set, not a population rate. | `docs/pipeline.md`; `audit/counts.py`, `in_stratum` |
| 56.3 | Another four hundred thirty four cold openers test whether a system can hold back. | Separate outlined control ribbon `abstention: 434`; empty context icon; no inclusion in either sampled brace. | `expected/arithmetic.json`, control_rows; `gate_v` |
| 64.3 | When memory is needed, its furthest evidence sits a median of more than two thousand messages back. | A selected probe stretches a ruler to `median furthest evidence: 2,157 messages`; show `memory-bearing probes, recorded`. | Paper §6, distance result |
| 72.3 | The benchmark therefore asks two questions at once: when to remember, and how far to reach. | Original 40-cell ribbon remains on left, distance bracket on right; dim other elements; caption-sized visual words `Need` and `Reach`. | Paper §§4–6 |

Blog sections: `chapter-2-denominator` 0–40s, “Keep the denominator visible”; `chapter-2-selection` 40–64s, “Enrichment adds cases, not a natural rate”; `chapter-2-distance` 64–80s, “Rare references can be far away”.

## Chapter 3 — The probe earns its label

Persistent object: a **probe ledger** rolled out from the same conversation tape. Five writable bands accumulate on this single object. The evidence slots visibly shrink after verification, and the final label is mechanically attached to the remaining slots. Use the real U10 `day8-151` row throughout. Its pre-verification `signals.hint` is `basic`; its verified tier is `hard` and category `event_recall`. That change reflects evidence discovered by the derivation; do not describe it as a later verifier adding evidence. The monotone-removal rule applies after candidate references are proposed.

Camera: start centered (640,340), k=1; push to the A band (470,245), k=1.15; pan along the evidence comb at B (690,315), k=1.12; widen for the three context lists; then descend only to y=500 for D and E, returning home for the complete ledger. On-screen bottom of ledger ≤570 throughout.

Five candidate teeth at B are a count visualization, not five invented turn IDs. Only the verified tooth has a real label, `day7-50`. Losing candidates are marked `candidate` without content. No claim about which unverified turn failed is supported by the public manifest. The profile verification branch is a small secondary example using aggregate counts, not a switch to a different story.

| At | Exact narration caption | What changes, and exact labels | Source |
|---|---|---|---|
| 0.3 | A memory label begins as a claim that the conversation may prove wrong. | Ledger opens with probe `day8-151` and subdued `signals.hint: basic`; an unverified distant marker is yellow. | Manifest U10 row; paper §4.2 |
| 8.3 | First, a model identifies what the probe refers to and where that referent would live. | Band `A — referent_text / locus` appears; exact `locus: episode`; no fabricated referent quotation. | `docs/pipeline.md`, Phase A; paper Appendix D.1 |
| 16.3 | Next, retrieval searches earlier material and verification checks whether the candidates actually support that referent. | Band B opens the five-tooth comb; past-only tape sweeps underneath; `retrieve_distant_turns`. | `builder/__init__.py`; pipeline Stage B |
| 24.3 | In this released example, five retrieved candidates shrink to one verified earlier turn. | Four unnamed teeth retract; `retrieved: 5`, `verified: 1`, surviving `day7-50`. | Manifest U10 day8-151 `stage_b_counts` |
| 32.3 | Profile claims face the same demand for support from the messages behind them. | A small inset comb shrinks from `1,544 matched` to `752 kept`; label `profile claim re-verification totals`. | `expected/stage_b_report.json`; pipeline Stage B |
| 40.3 | A fixed rule then assigns the tier from the context that survives. | Band C snaps onto three sockets: `recent_context`, `profile_refs`, `episode_refs`; episode occupied; `hard / event_recall`. | `categorize_turn`; manifest row; `audit/arithmetic.py`, recoverable_tier |
| 48.3 | If verification removes every distant reference, the later rule can reduce the item to a thread-only case. | Clearly labeled `Rule illustration` briefly empties the episode socket; `has_evidence: false` produces `basic`; restore real row afterward. | `builder/__init__.py`, categorize_turn |
| 56.3 | The reference reply is written from the recorded context, and its grounding names the turns it uses. | Band D draws a tether to `grounding_dayids: [day7-50]`; keep recent/probe in the allowed envelope. | Manifest row; pipeline Phase D; `gate_s` |
| 64.3 | A final check challenges the reply and category, sending failed items back for repair or withdrawal. | Band E stamps `ok: true`, `category_ok: true` on the real record; an outlined repair route appears as a rule, not an actual failure of this row. | Paper Table 16; pipeline Phase E; manifest row |
| 72.3 | The released trace preserves the decisions and the reasons, so a disagreement has a specific place to start. | Pull back to all five bands on one ledger; header `trace { A, B, C, D, E }`; no claim of independent correctness. | Paper §4.2, Appendix D.1; pipeline |

Blog sections: `chapter-3-proposal` 0–40s, “A candidate is not yet evidence”; `chapter-3-rule` 40–56s, “The context shape determines the tier”; `chapter-3-grounding` 56–80s, “A reply leaves a trail back to source”.

## Chapter 4 — What the public audit can prove

Persistent object: the **probe ledger becomes a transparent structural stencil**. Words recede; identifiers, order, labels and list membership remain. A scanning ruler tests the stencil and pins findings next to the exact invariant. Twenty-six edge notches labeled A…Z form the gate inventory, but only one or two are focused at once. This is a mechanical comparison, not a wall of green checkboxes.

Camera: begin close on the ledger with text texture, ease out as the text disappears; track the timeline ordering test; push into a broken correspondence between empty reference sockets and a distant locus; pull back to the 26-notch ledger and finally leave four amber notches beside a clearly bounded structural result.

Broken examples must carry `Invariant illustration` and use no invented corpus identifier or alleged current failure. The real historical repair is aggregate: 51 rows had their verified locus reset, 48 to thread and 3 to none; the original claim remains in trace A. At the end show `22 fully computable on manifest` and `4 need text: A, L, N, Q`. A is partially checked (identifier/sender), not entirely absent. B and Z are vacuous guards on this release; never sell them as strong empirical validation. W/Y use recorded scans when raw text is absent.

| At | Exact narration caption | What changes, and exact labels | Source |
|---|---|---|---|
| 0.3 | A trace is useful only if someone else can check what its fields claim. | Ledger becomes a structural stencil, retaining the same evidence locations. | `README.md`; paper Appendix D.7 |
| 8.3 | The public repository releases a manifest of identifiers and labels without the conversation text. | Prose texture fades completely; keep `manifest/realcompanion_manifest.json`; source IDs remain. | `README.md`; manifest |
| 16.3 | One check confirms that cited turns exist, so a reference cannot point into empty space. | Gate `C / gate_c` ruler aligns evidence IDs with tape IDs; an illustrative missing slot gets a rose outline. | `audit/gates.py`, gate_c |
| 24.3 | Another checks that evidence precedes the probe and sits outside its recorded recent window. | Gate `D / gate_d`: sweep order to probe, recent bracket rejects an overlapping distant-reference tooth. | `audit/gates.py`, gate_d |
| 32.3 | Grounding must stay inside the declared context, with the probe itself also allowed. | Gate `S / gate_s`: envelope around probe + three context lists; grounding dot must remain inside. | `audit/gates.py`, gate_s |
| 40.3 | The verified location must agree with whether any distant references remain. | Gate `U / gate_u`: empty sockets beside distant locus visibly mismatch; do not alter real row data. | `audit/gates.py`, gate_u |
| 48.3 | That check preserves a real repair: fifty one rows once kept a distant location after their references were gone. | Repair counter `51 = 48 thread + 3 none`; original `trace.A.locus` ghost remains beside corrected `trace.B.locus`. | `docs/pipeline.md`, Two loci; paper Appendix D.5 |
| 56.3 | Counts and strata are checked too, so a stale total cannot silently change the population being reported. | `T / meta counters` and `V / declared strata`; sample/control seam from chapter 2 reappears on ledger. | `audit/gates.py`, gate_t, gate_v |
| 64.3 | Twenty two gates can run on the public manifest, while four need the withheld text to finish their checks. | All 26 notches reveal; amber `A L N Q`, green outlined other 22; footer `A: identifiers/senders checked; verbatim needs text`. | `expected/gates_manifest.json`; `run_gates` |
| 72.3 | These checks establish internal consistency. Whether the words support the labels still requires a separate audit. | Quiet result `Structural consistency ≠ semantic correctness`; four amber notches remain visible, no universal pass stamp. | Paper Appendix D.7; `docs/gates.md` |

Blog sections: `chapter-4-structure` 0–40s, “A text-free manifest still exposes contradictions”; `chapter-4-repair` 40–64s, “The invariant remembers the repair”; `chapter-4-limit` 64–80s, “A passing gate has a boundary”.

## Chapter 5 — Score the decision, not just the average

Persistent object: an **evidence comb** taken from the ledger. Its two real gold teeth become a ranked retrieval measure, then the comb expands into a population ruler that separates near and distant cases. Finally it becomes a two-part response-gain bar, retaining the same color assignment for recent versus distant demand.

Camera: tight on the two gold teeth at (480,325), k=1.14; pull back to twenty rank positions at beat 4; pan to the separate abstention well at beat 5; home for population comparisons at beat 7; push gently into the small violet contribution on the gain bar at beat 9; final home shot of tape → trace → score, using the same geometry collapsing rather than three boxes.

For the arithmetic demonstration use gold `{day8-150, day7-50}` from the U10 row and a synthetic submission ranked `[day8-150]`, explicitly labeled `Illustrative submission, real gold IDs`. Then the exact implemented scores are `r@1 = 1/2`, `r@5 = 1/2`, `r@20 = 1/2`, `mrr = 1`. Do not call that a measured system result. The paper's 95.9% vs 2.2% is **pooled Hit@5**, not the public scorer's recall. The populations are `all with gold: n=1,477` and `memory-bearing: n=404`, both sampled strata. This is a comparison of subsets, never a claim of natural prevalence. The final decomposition uses the proportional recorded row of paper Table 8: +0.004 and +0.104 total approximately +0.108, 96% from no-memory probes. Call it a reported context contrast; it includes a heading difference and is not an isolated causal estimate of memory.

| At | Exact narration caption | What changes, and exact labels | Source |
|---|---|---|---|
| 0.3 | A system can find a nearby message and still miss the earlier detail that made a probe difficult. | Gold comb has one blue and one violet tooth; an illustrative ranked list captures only blue. | `score/__init__.py`, gold_set and retrieval_scores |
| 8.3 | The public scorer accepts a ranked list of consulted turns, together with a reply or an answer. | Unroll one submission strip labeled `track`, `subject`, `item`, `retrieved`, `reply / answer`, `abstained`; `TRACKS = (chat, qa)`. | `README.md`; `score/__init__.py` |
| 16.3 | For chat, the target includes the recent thread as well as the episode and profile evidence. | Union the two real teeth under `gold_set`; show the three source list names, profile slot empty here. | `score/__init__.py`, gold_set |
| 24.3 | Finding one of two required turns earns half the recall, even when the first retrieved turn is correct. | Display `r@1 = 1/2`, `mrr = 1`; then extend rank ruler to `CUTS = (1, 5, 20)` without changing the score. | `score/__init__.py`, retrieval_scores |
| 32.3 | Empty targets are scored for abstention, while submission coverage is reported separately. | Empty comb becomes `abstention_on_controls`; unsubmitted slots remain outlined under `coverage`, never falsely counted as successes. | `score/__init__.py`, score_records |
| 40.3 | Reply correctness needs the actual text and a judge, beyond what the public manifest can establish. | Reply channel stops at boundary `--corpus DIR --judge`; retrieval channel stays transparent and deterministic. | `score/__init__.py`, judge_records; `README.md` |
| 48.3 | The paper shows why populations matter: recent messages produce an impressive overall retrieval result. | Population ruler reveals `Paper §6: Recency Hit@5 = 95.9%`, `n=1,477 with gold`, `pooled, both strata`. | Paper §6, pooled retrieval paragraph |
| 56.3 | On the probes carrying distant references, that same result falls to just two point two percent. | Same bar contracts to `2.2%`, `n=404 memory-bearing`; hold a faint original endpoint for comparison. | Paper Table 4, Recency / All items; §6 |
| 64.3 | In the reported context comparison, ninety six percent of the sampled gain comes from probes labeled as needing no distant memory. | Comb straightens into stacked bar `+0.004` violet and `+0.104` blue, `≈ +0.108`; `proportional, recorded`; small `C2 vs C1 also changes heading`. | Paper Table 8, Appendix A.3; Appendix E.1 |
| 72.3 | Follow the probe from conversation to evidence to score, and keep the decision to remember separate from the ability to retrieve. | Retrace tape through ledger into a quiet paired finish `When memory is needed` / `What retrieval recovers`; no extra metric claims. | Paper §§4–6; public scorer |

Blog sections: `chapter-5-contract` 0–48s, “A retrieved turn is not the whole target”; `chapter-5-subsets` 48–64s, “An average can hide the distant cases”; `chapter-5-gain` 64–80s, “A context gain is not automatically a memory gain”. Explain the hit-versus-recall distinction in prose immediately before the second viewer.

## Blog timing and source presentation

The section windows above are **authored-clock planning boundaries**, not final `blog.md` timestamps. After narration builds the manifest, map these boundaries using the manifest cues into disjoint manifest-clock windows. Use the exact `books/when-memory-matters/chapter-N` scene IDs and stable section IDs given above. Each semantic section gets a heading, one lead paragraph, one live `{% viz %}` viewer and at most one takeaway paragraph. Do not make one viewer per caption or use media embeds. Run `node generator/blog-viz.mjs --slug when-memory-matters` afterward. The narrated chapter remains intact.

The blog should link the paper and official repository, list all three authors, and include a compact evidence note distinguishing (a) reproduced public structural counts, (b) paper-reported model results, and (c) inaccessible conversation text. If the root run executes the public checks, report only checks actually run and their actual outputs.

Run verification reported by the integrating agent: `realcompanion-audit all` passed and matched the committed outputs. The public test run returned **112 passed, 1 failed** because `tests/prompt_hashes.json` expects seven `prompts/deployed/*` files absent from the public zip/API. Use the passing manifest audit as the reproducibility anchor; do not claim the complete public test suite passed.

## Cover recommendation

**An elephant**, alone in a calm three-quarter pose, with one ear turned attentively and the trunk slightly curled back toward its body. Its silhouette connects familiar long memory with selective attention; the ear and restrained posture emphasize listening before bringing up the past. This is a visual metaphor, not a scientific claim about elephant cognition. Fine natural-history ink engraving, dense crosshatching, crisp anatomical detail, pure uniform white `#FFFFFF` background. No props, landscape, lettering, numbers, logo, frame, banner, cream tint, texture or vignette. Generate only the animal with built-in ImageGen and visually inspect before converting the accepted image to `animal.webp`. The app provides the title and O'RLY? parody binding.

## Handoff acceptance criteria

- Five scenes, one persistent transforming visual machine each; meaningful camera travel in every chapter.
- Exactly ten narration captions per chapter, verbatim above; none contains code symbols, paths, acronyms read as letters, or machine identifiers.
- Every numerical visual names its denominator and scope. No staged count is mislabeled as a real record. No private conversation text is invented.
- The example U10 `day8-151` retains its actual manifest fields. Avoid U10 `day10-21` as the main example: the paper figure displays an earlier `biographical` category, while the manifest has `change_over_time` with a repair record.
- Gate A is partial on a manifest; A/L/N/Q are not stamped as fully computable. A green structural result never implies all semantic labels are correct.
- `gold_set` includes recent turns; memory-bearing demand concerns distant references. Keep these sets visually and verbally distinct.
- The paper's reconstruction track is not presented as an implemented public scorer. Baseline/model performance is attributed to the paper, not claimed reproduced.
- Every ending is quiet; all essential content remains above y=633 under all camera states; reverse scrubs do not leak animation state.
