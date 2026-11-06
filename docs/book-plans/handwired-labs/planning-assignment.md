You are the PLANNER for an O'RLY explainer book called "Handwired Labs". Output only the plan as markdown; do not write files; do not use tools except Read.

Goal: a narrated, 3blue1brown-style explainer book that explains EACH of the 15 experiments in chenglou/handwired's lab/ folder (pinned at 4ea7fcb27ebe93acf49b9f29a93e162b975bad46). Labs: candidate-gallery, cascade-argmax, data-adapter, event-window, generative-fields, hard-attend, json-search, knuth-plass, learned-gallery, learned-interpreter, reusable-layout, runtime-cost, trace-compiler, ui-exploration, user-effort. (lab/types is a helper, not a lab; mention it at most in passing.)

Read these source notes first (they are working digests written from the repo; check any claim you plan to use against the digest's Sources pointers, and do not add facts the digests do not support):
- /Users/blamy/Documents/Codex/orly-2/.orly-work/handwired-labs/digests/framing.md (overall question, per-lab status table, reassessment)
- /Users/blamy/Documents/Codex/orly-2/.orly-work/handwired-labs/digests/*.md (one digest per lab)

Produce:
1. Chapter structure: 5 chapters (no more, no fewer), each grouping 2–4 labs by a shared idea. Give each chapter a title and a one-line thesis.
2. For each chapter: the ONE visual metaphor that teaches it (a machine a viewer can watch working), the beat sheet (6–10 beats; what enters, moves, changes per beat), and the reused visual vocabulary it needs (e.g. ramps, bit selectors, tables, gallery grids, trees). No "boxes and arrows appear".
3. Captions: for each chapter, 8–14 caption lines the narrator will say. Each is 1–2 full sentences, ≤220 characters, written for the EAR (no code syntax read literally; expand identifiers). Each caption cites the lab(s) and the source pointer it rests on, as "[lab/<name>/<file>:<lines>]".
4. Honesty: where a lab's result is negative, abandoned, or open per its status, say so in the captions. Do not oversell.
5. A short list of "claims cut" — things in the digests that you judged not worth narrating, with a reason.

Keep the whole plan under 4000 words.
