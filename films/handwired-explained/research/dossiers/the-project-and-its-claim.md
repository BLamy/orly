# Dossier: The Project: Handwired, Its Claim, Its Author and Its Repo

- id: `the-project-and-its-claim` · era: June 2026 to October 2026 · as-of: 2026-10-27
- Primary source: the local clone `.orly-work/repos/handwired`, `main` at
  `257856e3b221140acb4cc4460626b850c0bd4ff1` (author date 2026-10-16 17:33:49 -0700).
- Repo URL base used below: `B = https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1`
  (written out in full in section 11). Commit URLs are `https://github.com/chenglou/handwired/commit/<hash>`.
- Method: read the files at the pin; `git log` / `git show` in the clone (commands recorded inline);
  GitHub REST API via `gh api` on 2026-10-27/28; Hacker News Algolia API; fxtwitter API for the
  launch post; one fetch of the live demo site. `bun lab/runtime-cost/report.ts` was **not** run
  in this pass (the sandbox refused executing repo code); numbers below are the repo's own
  recorded measurements, with their conditions.

---

## 1. Summary

Handwired is an MIT-licensed TypeScript/Bun repository by Cheng Lou (`chenglou`) whose README
opens with the claim, verbatim: **"Turn your regular JavaScript code into a neural net; no
training, exact, yet also fully differentiable!"** [S1]. Its mechanism, per the README: "A
program's made of if-else, loops, and state. Handwired transforms them into matrix
multiplication + reglu over floats" [S1], illustrated with `(a > 4) ? 10 : 12` rewritten as
`above4 = Math.max(0, a - 4) - Math.max(0, a - 5)` and `above4 * 10 + (1 - above4) * 12` [S1].
The README lists three "funny use-cases": unfreezing the weights and training them, attaching a
frozen program to a generic neural net and training end to end, and GPU-level parallelism from
single-threaded-style JS, pointing at the JSON search over 100k documents [S1].

The headline needs a careful gloss that the repo itself supplies. The docs say: "With Handwired
you write a numeric program ... You write it in builder code, i.e. ordinary JavaScript that runs
once and appends the operations to a `Circuit`. **No tool converts existing JavaScript source
into a program.** The runtime evaluates a program in JavaScript on the CPU, and only the JSON
search demo runs on WebGPU" [S2]. That gap between tagline and docs was the main public
criticism on Hacker News [S20].

The repo began on **2026-06-03** with commit `3d2c717` "Create numeric UI atom lab" [S9]. At the
pin there are **825 commits** (824 in `3d2c717...257856e` plus the root, confirmed by the GitHub
compare API) [S9][S19], **49** of them merges, **217** on the first-parent line, all authored as
"Cheng Lou", and **756** carrying the trailer `Co-Authored-By: Claude Code` [S9]. Work came in
bursts: 72 commits in June, 6 in July, none in August, 58 in September, 689 in October, of which
683 fall on October 13 to 16 [S9]. The project's first README title was "Numeric UI Atom Lab"
(June 3 to 6 only); from `2be29e4` (2026-06-06) the README is titled **Indirect**, and the desktop
was IndirectOS from June 8; both were renamed on **2026-10-06** [S7][S9][S10]. Its history was rewritten with `git filter-repo` and the GitHub repo was
created and made public on **2026-10-14** (Pacific; `created_at` 2026-10-15T02:15:09Z) [S11][S19],
and Cheng Lou announced it on X about nine minutes later [S21]. The live demo site is
**https://chenglou.me/handwired/**, built by a GitHub Pages workflow [S3][S12][S19].

`257856e` is still the head of `main` on GitHub as of 2026-10-27 (GitHub commits API; `pushed_at`
2026-10-17T01:12:12Z) [S19]. `257856e` is a **merge commit** (parents `4ea7fcb` and `e86c1b4`): on
`main`'s first-parent line it directly follows `4ea7fcb`, and it brings in a side branch of 239
commits (from 2026-10-15 00:50 PDT; its message says "The 238 commits are the experiment's
history") [S9][S15]. Every commit after the shelf books' pin `4ea7fcb` (2026-10-15) and up
to `257856e` touches only `lab/` (`git diff --stat 4ea7fcb 257856e` lists no file outside lab/;
README.md, docs/, src/, template/ and tests/runtime/ are byte-identical) [S9], so the shelf
books' README/docs claims remain valid at the film's pin.

## 2. Timeline

All times are commit author dates in Pacific time (-0700) unless marked UTC. Source of every
`git` fact: the clone, `git log --format='%h %ad %s' --date=iso` [S9], plus the commit URL.

| Date | Event | Source |
|---|---|---|
| 2026-06-03 20:24 | First commit `3d2c717` "Create numeric UI atom lab": README, `numeric-ui-core.mjs` ("universal numeric vocabulary and tensor backend"), `numeric-ui-atoms.mjs`, a rectangle demo; 7 files, 1,219 lines. The first README: "This browser-free experiment tests whether apparently different UI derivations can lower into a small homogeneous numeric circuit." | [S9] commit 3d2c717 |
| 2026-06-03 20:38 | `592f296` "Set up minimal Bun TypeScript project" | [S9] |
| 2026-06-06 14:22 | `2be29e4` "Build numeric window manager": the README's title changes from "Numeric UI Atom Lab" to "Indirect" (first "IndirectOS" mention: `a084158`, 2026-06-08) | [S9] (`git show <c>:README.md`, `git log -S IndirectOS`) |
| 2026-06-06, 06-08 | Busiest June days: 19 and 20 commits | [S9] |
| 2026-06-14 | `542698d` "Add shared agent guidance" (agents.md) | [S9] |
| 2026-06-21 01:23 | `7409b62` "Add MIT license" | [S9][S5] |
| 2026-07-05 to 07-08 | Six commits; then no commits until September (none in August) | [S9] |
| 2026-09-03 06:13 | `c6bf933` "Fix circuit semantics and test reusable learned rules"; adds `lab/reassessment-2026-09-03.md`, "the September 3, 2026 review of the July results" | [S9][S8][S6 L289] |
| 2026-09-12 to 09-14 | The `lab/ui-exploration` study "of how far circuit UI goes" (24 prototypes; 16 remain) | [S6 L290] |
| 2026-09-14 | Cheng decides runtime questions 1 to 3, "choosing the recommended option each time": (1) add an index-read instruction, (2) "one helper that chooses from declarations" (`emitCompare`), (3) "JavaScript writes durations, event times and the spring matrix" (one spring matrix, not "time matrices") | [S13 L119, L121-123, L149, L177][S6 L7] |
| 2026-09-15 08:47-08:49 | `17c2318` "Add the UI exploration lab, index reads, exact comparisons and host-timed springs"; `2b1df27` "Split tricks.md into expressions.md, patterns.md and behavior-choices.md". status.md: tricks.md "renamed to `expressions.md` and rewritten on September 15, 2026, with Cheng's approval" | [S9][S6 L3] |
| 2026-09-16 | Duplicated experiments removed or merged; tag `exploration-2026-09` keeps every removed path; README TODO's last item (dynamic division) parked and `ideas.md` removed "with Cheng's approval" | [S6 L3, L287] |
| 2026-09-17 | "Engineering guide pass" over src/runtime and src/handwiredos at Cheng's request; JSON highlighter and regex search experiments start | [S6 L42-44, L127] |
| 2026-10-06 20:10 | `e86f5ed` "Rename the repo from Indirect to Handwired, and IndirectOS to HandwiredOS" | [S10][S6 L287] |
| 2026-10-13 09:39 | `2816746` GitHub Pages workflow. Demo site gets "one site and one look"; site.css: "paper, ink and one copper accent, with system fonts only" (`f3cd407`). 242 commits that day | [S12][S6 L95][S9] |
| 2026-10-14 | 200 commits. Learned gallery promoted to src/ (`19509c1`, 08:59), JSON search promoted to src/ (`40dfd52`, 13:15); JSON highlighter and regex-search pages removed (tag `json-regex-experiments-2026-10` at `4a80450`); Cheng's own commit `59b12cd` "Cleanup" (05:50) rewrites the README opening and deletes agents.md and claude.md | [S6 L95-127][S9] |
| 2026-10-14 19:06 | `0fc1d1d` fixes the README opening's typos ("promitives", "shakespare", "JSON research demo", "miliseconds", `labs/`) and adds the live-site link | [S14] |
| 2026-10-14 19:11 | `0237d40` records the history rewrite done with `git filter-repo` "before making the repo public" | [S11][S6 L36] |
| 2026-10-15 02:15:09 UTC (Oct 14 19:15 PDT) | GitHub repo `chenglou/handwired` created | [S19] |
| 2026-10-15 02:24:24 UTC | Launch post on X by @_chenglou ("Introducing Handwired ...") | [S21] |
| 2026-10-15 00:35 | `4ea7fcb` "Entry docs: what four readers without any background tripped on" (the shelf books' pin) | [S9] |
| 2026-10-15 to 10-16 | First HN submissions by others (items 50102806, 50105849, 50112421) | [S20b] |
| 2026-10-15 00:50 to 10-16 17:33 | A side branch of 239 commits builds `lab/recovery-parser` (README first added by `14cacd6`, 2026-10-15 01:24), `lab/recovery-toml` and `lab/recovery-lr` | [S9] (`git log 4ea7fcb..257856e`) |
| 2026-10-16 17:33 | `257856e` (head of main), a **merge commit** (parents `4ea7fcb`, `e86c1b4`) that brings that branch into main: "lab: an experiment that trains a strict parser's unused table entries until it recovers from errors, on JSON, TOML and a table made by bison" | [S9][S15] |
| 2026-10-20 21:32 UTC | "Show HN: Turn regular JavaScript into a neural net", submitted by chenglou (45 points, 12 comments when fetched) | [S20] |
| 2026-10-27 | As-of date: no newer commit on `main`; repo shows 2,033 stars, 158 forks (snapshot, changes daily) | [S19] |

## 3. People

**Cheng Lou (`chenglou`)**, the author and only commit author.

- What the repo says: the LICENSE reads "Copyright (c) 2026 Cheng Lou" [S5]. Every one of the 825
  commits is authored "Cheng Lou" [S9]. The repo's own documents speak of him in the third person,
  as the person who decides and asks; they were largely written with an AI coding agent (756
  commits carry `Co-Authored-By: Claude Code`; the reassessment's reviewer writes "I traced the
  relevant June and July Claude conversations ... the original June Codex design discussion")
  [S9][S8 L15]. The film must not present those documents' prose as Cheng's own words; only the
  passages the repo marks as his quotations are his.
- Decisions and requests the repo records (all verbatim-sourced in section 6):
  - Decisions 1 to 3, September 14, 2026: "Cheng decided questions 1 to 3 on September 14, 2026,
    choosing the recommended option each time" [S13 L119]: (1) add an index-read instruction
    (`circuit.indexRead`), (2) one comparison helper, `emitCompare`, that "chooses from
    declarations", (3) "JavaScript writes durations, event times and the spring matrix" [S13 L123,
    L149, L177] (one spring matrix; do not say "time and spring matrices"). status.md: "Every existing circuit compiled to the same program with the same
    values, e.g. HandwiredOS stayed at 5,253 operations in 192 layers" [S6 L7].
  - Three doc removals "with Cheng's approval" on September 15 and 16, 2026 [S6 L3].
  - Asked "whether regex search or the JSON highlighter, or both in one app, becomes clearly
    faster on the GPU" [S6 L107]; asked for temporary demos of traditional JavaScript tasks
    [S6 L234]; asked whether pretext's layout is faster on the GPU; noted Knuth-Plass line
    breaking "fits min-plus matrix products combined in a tree" [S6 L239-240]; asked for a
    measured pass of his own engineering guide (chenguini) [S6 L44]; his "point" on term order:
    "correctness needs one deterministic order that every evaluator shares, not statement order in
    particular" (paraphrase by the repo) [S6 L93].
  - Wrote the README's opening himself: `27f1ea1` "README: Cheng's edit of the opening, carried
    from the main checkout"; his commit `59b12cd` "Cleanup" [S9][S14].
- Verifiable public facts beyond the repo (GitHub profile via API [S19b]): name "Cheng Lou",
  location "California", bio "Work: ReactJS, ReasonML, ReScript, Messenger, Midjourney", X handle
  `_chenglou`. His other public repos the docs cite: `chenglou/chenguini` ("a set of engineering
  and UI guidelines", per behavior-choices.md) and the npm package `@chenglou/pretext` (a text
  layout library, a devDependency) [S16][S4]. Trade press calls him "formerly a member of the React
  core team" [S23]; treat as secondary, do not narrate beyond the GitHub bio wording.
- City/institution: the repo names none. Commit times carry a -0700 offset (US Pacific daylight
  time) [S9]; the GitHub profile says California [S19b]. The measurement machine named throughout
  is "an Apple M5 Max" with 18 cores [S6 L40][S17].
- Depiction: the repo gives no appearance and the brief forbids invented biography. Recommend
  **no likeness**: a generic adult silhouette (or only hands, a laptop and a desk lamp) in present
  day (2026) casual clothing, never captioned as a portrait. Do not draw glasses, hair or build
  from memory of photos.
- Not a person but present in the record: the AI coding agents (Claude Code; an earlier Codex
  agent in June) [S8 L15][S9]. If shown, show as a second "hand" at the keyboard, not a character
  with words.

**Public responders** (HN usernames, only as named commenters, no bios): gregsadetsky, curtisblaine,
dvrp, echoangle, hungryhobbit, aatd86 [S20].

## 4. The belief of the age

- The common belief in 2026: a neural net is something you **train**, whose weights come out of
  data and whose outputs are statistical, approximate and hard to read. Handwired's premise
  inverts it: write the weights by hand so the net equals a program, exactly. Cheng's own
  launch post frames it as three contrasts: "no training", "exact outputs vs the JS program",
  "fully differentiable" [S21]. A reply attributed to him, "Yes if you train it, no if you
  hand-wrote the weights that correspond exactly to your program", circulates in press [S22] but is
  UNVERIFIED (original post not located).
- Prior art the public pointed to: an HN commenter (aatd86) replied "google/tracr" [S20] (in reply
  to another commenter's speculation about models replacing code, not to a direct prior-art question), DeepMind's 2023
  compiler from RASP programs into transformer weights (Lindner et al., arXiv 2301.05062 [S24];
  RASP from Weiss et al., arXiv 2106.06981 [S25]). The repo does not cite tracr. The older idea
  that neurons compute logic (McCulloch and Pitts, 1943) belongs to the framing dossier, not this
  one. Lead only.
- Who dissented, and on what: not on the arithmetic, which checks by hand, but on the word
  "regular". gregsadetsky (HN, 2026-10-22): the project "doesn't turn 'regular' JavaScript into a
  NN, it's rather 'write your logic in a DSL that creates a neural-net-shaped circuit'", "The main
  site & readme seem to overclaim", citing the docs' own "No tool converts existing JavaScript
  source into a program" [S20]. Others asked simply "why?" / "What's the point of this?" [S20][S20b].
- Inside the repo, the belief that changed: the September 3 reassessment says "Change what we
  treat as established": a learned-interpreter failure (0/20) reversed just by scaling the loss.
  The full table: for "two adds", 0/20 at 1x and 10x, 3/20 at 100x, 4/20 at 1,000x, 9/20 at
  10,000x and **20/20 at 1,000,000x**; for "coordinate transform", 0/20 up to 1,000x and **20/20
  from 10,000x** [S8 L21-34]. (Do not summarize it as "0/20 into 3/20 to 4/20": the reversal is
  complete at the largest multipliers.) The reassessment's own caveat: "It does not show that the
  method scales" [S8 L38]. And "some correctness checks compare implementations that share the
  same mistake" [S8 L9]. A second honest finding: the JSON
  search GPU program beats one-thread RegExp at most patterns but **not** JavaScript spread across
  8 to 16 workers [S17 L126].

## 5. Experiments and results (the repo's claims, with conditions)

Machine for nearly all numbers: an Apple M5 Max (18 cores), Bun 1.4.x, headless Chrome 153 to 155
through Metal [S6 L40][S17 L115]. Numbers are dated; they change commit to commit.

- **The README example, worked by hand** (the landing page's own source comment) [S3 src L45-64]:
  for `a` up to 4 both ReLUs are 0; from 5 they are `a - 4` and `a - 5`, difference 1. `a = 5`:
  above4 = 1 - 0 = 1, result 10; `a = 4`: above4 = 0 - 0 = 0, result 12. **Limits stated in the same
  comment**: between 4 and 5 above4 is `a - 4`, "e.g. a = 4.5 gives 0.5, and the result is then
  11"; in FP32 "the first such integer is 2^24 + 6 = 16,777,222, where a - 5 rounds to 2^24, so
  above4 is 2 and the result 8"; in float64 the first is 2^53 + 6. The runtime's real comparison
  is `emitCompare`, which on a declared grid builds `a > b` as `relu(1 - relu(1 - D))` [S3 src L66-68].
  (Check: 2^24 + 6 = 16,777,222; 16,777,222 - 5 = 16,777,217, not representable in FP32, rounds to
  16,777,216 = 2^24; 16,777,222 - 4 = 16,777,218 is representable; 16,777,218 - 16,777,216 = 2;
  2*10 + (1-2)*12 = 8. Correct.)
- **HandwiredOS ("Mini OS" on the landing page)**: "A small desktop with 3 windows (Monitor, Notes
  and Photos) and a dock, run by one compiled program ... Every weight of the program is written
  by builder code, and none is trained" [S18a]. Landing card: weights 9,909, layers 130, training 0,
  "read on October 14, 2026, from its Monitor window in Chrome", and `bun run site:check` fails if
  the card disagrees with the page [S3 src L126, L142-143]. History of size: 5,253 operations in
  192 layers before Sept 14; 3,654 live operations and 124 layers after Sept 15 [S6 L7, L14]; a peak
  of 21,229 live operations, 230 layers, 46,930 stored weights on Oct 13 before Notes' text layout
  left the program [S6 L22-26].
- **Learned gallery**: "Unfreeze a compiled program's weights & train them in real time" [S3]; 6,320
  operations in 8 layers with 244 weights; trains at 600 steps a second; a misalignment-penalty
  slider from off to 8% of the stage width, default 4% [S6 L102][S18b].
- **JSON search**: "searches 100,000 generated JSON documents again at each keystroke, on the GPU,
  with two fixed numeric programs ... none of their weights is trained" [S18c]. Sample line: "10,559
  of 100,000 documents match. This program: 13 ms on the GPU. Native RegExp: 21 ms." [S18c L30]
  (status.md quotes the same line with 12 ms [S6 L103]; use the README's 13 ms or say "about a dozen
  ms"). The page "doesn't say that its search is faster than RegExp" [S6 L103]. Measured answers:
  4.5 to 5.2 ms per search back to back, 11 to 16 ms after a pause; RegExp on one thread 8 to 43 ms;
  a backtracking pattern 5 to 12 ms vs 2.1 s; **against 8 workers, no** (RegExp 1.9 to 6.7 ms; 16
  workers 1.3 to 4.0 ms), except that the backtracking pattern (279 / 136 ms in 8 / 16 workers) is
  still beaten by the GPU [S17 L117-126].
  CPU toggle: 13 to 14 s for a pattern of up to 8 states [S6 L103].
- **Runtime costs** (lab/runtime-cost): about 10 µs per 1,000 layers on the CPU executor (54 to 55 µs
  at 64 layers, 210 to 214 µs at 16,384) [S26]. HandwiredOS on WebGPU (Sept 16): 2.2 ms per
  evaluation vs 81 µs on the CPU executor in Bun, "because one table's statements run one after
  another in a shader" [S6 L40]. So the README's "run it on JS or WebGPU" is real, but the GPU
  only pays off for the wide JSON search.
- **Test suite**: `bun run test` "every test in tests/, template/ and lab/, in about 3 minutes";
  `bun test tests/runtime` "in about 2 s"; `tests/runtime/` "runs programs, including seeded random
  ones, through a plain reference evaluator and the compiled one, and compares the results" [S2 L31-32, L48].
- **Last experiment at the pin** (lab/recovery-parser, 2026-10-16): the JSON highlighter's tables
  "have about 1,560 entries, and valid JSON only ever reads about 240 of them"; training fills the
  other ~1,300; "On JSON the trained parser ended up slightly better than recovery rules written by
  hand. On TOML and on a parser made by bison, the gradient training alone did not carry over with
  JSON's settings and random damage as its training data. Filling the same entries by trial and
  error did, and so did gradient training once it was given a fairer start: one small hand-written
  rule on TOML, realistic mistakes in the training data on the bison parser." [S15 L3] Quote it
  whole: cutting after "did not carry over" overstates the failure. The work arrived on main as
  one merge commit (`257856e`) of a 239-commit side branch, with sibling folders
  `lab/recovery-toml` and `lab/recovery-lr` [S9].
  Note: status.md's folder list predates it and does not mention it.

Physical apparatus for the art department: there is none beyond a laptop-class Apple M5 Max
machine and a browser. The "apparatus" is the program: a Float32Array source table of cells,
operations in layers, a host loop. The landing page draws it as boxes and copper wires; the
HandwiredOS wallpaper "draws every stored weight as one arc" [S6 L99].

## 6. Verified quotes (verbatim)

| # | Quote | Speaker | Date | Source | Context |
|---|---|---|---|---|---|
| Q1 | "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!" | README (Cheng's opening) | at pin; opening written 2026-10-14 | [S1 L3] | README tagline |
| Q2 | "A program's made of if-else, loops, and state. Handwired transforms them into matrix multiplication + reglu over floats." | README | 2026-10-14 | [S1 L7] | How It Works |
| Q3 | "We then collect the + and * and relu into a giant matmul, and either run it on JS or WebGPU, for fun." | README | 2026-10-14 | [S1 L26] | |
| Q4 | "the weights don't need training since they're written manually" | README | 2026-10-14 | [S1 L30] | list of benefits of "these 2 primitives" |
| Q5 | "existing gpu techniques, such as fusion, sparsity, reordering, have a great time optimizing such minimal primitives" | README | 2026-10-14 | [S1 L31] | |
| Q6 | "unfreezing the weights and train them (what does that even do? Let's find out!)" | README | 2026-10-14 | [S1 L34] | use-case 1 |
| Q7 | "attaching a specific frozen program to a generic neural net and train end-to-end (now a nanoGPT can do both Shakespeare and your particular UI?)" | README | 2026-10-14 | [S1 L35] | use-case 2 |
| Q8 | "achieving GPU-level of parallelism with JS code that was written in a traditional single-threaded way (see the JSON search demo that runs in milliseconds over 100k documents)" | README | 2026-10-14 | [S1 L36] | use-case 3 |
| Q9 | "`lab/` is a bunch of old experiments you can check or ignore" | README | 2026-10-14 | [S1 L42] | |
| Q10 | "No tool converts existing JavaScript source into a program." | docs/README.md | at pin | [S2 L3] | the docs' own correction of Q1 |
| Q11 | "The program runs every operation on every frame and can't stop early, so a loop becomes a count, a tree, a table, or the same work on every item." | docs/README.md | at pin | [S2 L9] | |
| Q12 | "No training, exact yet also fully differentiable, runnable in a browser without GPU." | landing page deck | 2026-10-13/14 | [S3 src L37][S3] | |
| Q13 | "My dear friends, I'd like to show you my latest toy project / Introducing Handwired: turn your regular JavaScript code into a neural net! - no training - exact outputs vs the JS program - fully differentiable / All runnable in a browser, without GPU" | Cheng Lou, X | 2026-10-15 02:24 UTC | [S21] | launch post (curly apostrophe in "I'd" in the original) |
| Q14 | "strip 1-4 yeah. Do it quick plz, then publish." | Cheng Lou, as quoted in commit 0237d40 | 2026-10-14 | [S11] | approving four audit fixes, incl. the history rewrite, before going public |
| Q15 | "No need to abide by the guide religiously. Back out what didn't" | Cheng, quoted in lab/status.md | Sept 2026 | [S6 L44] | his engineering-guide pass request |
| Q16 | "we can remove all the bits from the 2 old json and regex experiments, except whichever important new patterns we found, like that nlogn loop or whatever. Beside those lessons, the demos should disappear." | Cheng, quoted in lab/status.md | Oct 2026 | [S6 L127] | |
| Q17 | "go. Make sure btw that the docs are without legacy crufts. Those and the tutorial and templates are the entrypoint for ppl when we release." | Cheng, quoted in lab/status.md | Oct 2026 | [S6 L127] | |
| Q18 | "Cheng decided questions 1 to 3 on September 14, 2026, choosing the recommended option each time." | lab guide (agent-written record) | 2026-09-14 | [S13 L119] | not Cheng's words |
| Q19 | "Keep the smaller numeric representation and the ambition to learn useful computation. Change what we treat as established ..." | reassessment author (an AI agent's review, per its own text) | 2026-09-03 | [S8 L7] | not Cheng's words |
| Q20 | "As far as I understand, this doesn't turn \"regular\" JavaScript into a NN, it's rather \"write your logic in a DSL that creates a neural-net-shaped circuit\"" | gregsadetsky, HN | 2026-10-22 | [S20] | criticism |
| Q21 | "Lol, if you pass a = 4.5 to their homepage const result = (a > 4) ? 10 : 12 you get 11." | curtisblaine, HN | 2026-10-23 | [S20] | matches the page's own hidden comment |
| Q22 | "Website is missing the #1 thing I imagine most readers would want to know: why ?" | hungryhobbit, HN | 2026-10-22 | [S20] | |
| Q23 | "Isn't a neural net probabilistic? Yes if you train it, no if you hand-wrote the weights that correspond exactly to your program, lol" | attributed to Cheng Lou on X | Oct 2026 | [S22] | **UNVERIFIED — do not use as a quote** (only seen second-hand) |

## 7. Debates and controversies

1. **"Regular JavaScript" vs builder code (contested).** Claim side: README and landing page,
   "Turn your regular JavaScript code into a neural net" [S1][S3]; echoangle (HN): "basically a
   compiler that turns arbitrary JS code into weights" [S20]. Critic side: gregsadetsky (HN): "The
   main site & readme seem to overclaim" [S20]; and the repo's own docs: builder code "runs once and
   appends the operations to a `Circuit`. No tool converts existing JavaScript source into a
   program" [S2]. Nuance in the repo: lab/trace-compiler is "a compiler for a restricted
   chenguini-style TypeScript subset" that compiled one real file's layout modes "with zero
   mismatches across 1.1M comparisons", plus "a twelve-category taxonomy of what does not compile"
   [S27]. It is a lab experiment, not the shipped path. **Film stance:** say "you write the program
   in JavaScript that builds the network"; never say Handwired converts arbitrary existing JS.
2. **"Exact" (true within declared conditions).** Exact in FP32 for declared ranges/grids [S2][S3
   src]; the README's toy example gives 11 at a = 4.5 and 8 at 2^24 + 6 [S3 src L60-64][S20].
3. **"Runnable in a browser without GPU" vs "WebGPU".** Both true: the runtime runs on the CPU; only
   JSON search uses WebGPU [S2 L3]; HandwiredOS is slower on WebGPU (2.2 ms vs 81 µs) [S6 L40].
4. **GPU speed claim.** Faster than one-thread RegExp on most patterns, not faster than 8-16
   workers; the page itself avoids claiming it beats RegExp [S17 L117-126][S6 L103].
5. **"What's the point?"** HN skeptics [S20][S20b]; the README's answer is the three use-cases [S1]
   and Ohentis's guess "to initialize a neural network with some hand coded behavior before
   tuning it" [S20b].
6. **Who wrote it.** All commits are authored by Cheng Lou; 756 of 825 carry Claude Code
   co-author trailers; 15 trailers that named a specific model were normalized in the rewrite
   [S9][S11]. One HN reply was abusive about AI authorship [S20b]; do not dramatize.

## 8. Misconceptions to avoid

- Do not say Handwired converts any existing JavaScript file. It does not [S2 L3].
- Do not say it "runs on the GPU" in general; only JSON search does [S2 L3].
- Do not say the weights are learned or trained (except the learned gallery's coefficients,
  trained with the program's own gradients) [S18a][S18b].
- Do not call the README's two-ReLU trick the runtime's comparison; production uses
  `emitCompare` [S3 src L66].
- Do not say the repo started in October; it started 2026-06-03 under the name "Numeric UI Atom
  Lab", was named Indirect from 2026-06-06 (three days later), then Handwired on 2026-10-06
  [S9][S10]. Do not say it was "Numeric UI Atom Lab" through June.
- Do not cite pre-2026-10-14 commit hashes from elsewhere: the history was rewritten, "a hash from
  a clone made before that day names a commit that the repo no longer has" [S6 L36].
- Do not treat lab/ numbers as current production: "Its READMEs describe the code as it was when
  each was written" [S2 L50].
- Do not quote agent-written repo prose as Cheng's words; only marked quotations (Q14-Q17).
- HandwiredOS has 3 windows (not 4) since 2026-10-13; the landing page calls it "Mini OS" [S18a].
- Star/fork counts are a dated snapshot (2,033 / 158 on 2026-10-27/28) [S19].

## 9. Curiosity hooks

1. The project's first name was not Handwired: it was "Numeric UI Atom Lab" for its first three
   days (June 3 to 6), then "Indirect" with an "IndirectOS" for four months, renamed 2026-10-06
   [S9][S10].
2. The landing page's HTML carries a hidden comment that admits the hero example's own limits:
   a = 4.5 gives 11, and a = 16,777,222 gives 8 [S3 src L60-64]. An HN commenter found the 4.5 case
   by hand a week after launch [S20].
3. 683 of the 825 commits landed in the four days October 13 to 16, with commits in every hour of
   the clock [S9].
4. Before going public the whole history was rewritten; the go-ahead is preserved in a commit
   message: "strip 1-4 yeah. Do it quick plz, then publish." [S11]
5. The docs correct the headline: "No tool converts existing JavaScript source into a program."
   [S2 L3]
6. The landing card's numbers (9,909 weights, 130 layers) are policed by a check that fails the
   build if the card ever disagrees with the live program [S3 src L122-127].
7. HandwiredOS's Monitor window lists the program's own cells and operations, computed by the
   same program [S6 L18, L24].
8. The newest commit (a merge of a 239-commit experiment branch) teaches a strict parser to
   recover from errors by training only the ~1,300 table entries valid JSON never reads, leaving
   valid parsing untouched [S15][S9].
9. The JSON search beats one-thread RegExp on a backtracking pattern 5-12 ms vs 2.1 s, yet loses to
   8 JavaScript workers on ordinary ones, and the repo says so [S17 L124-126].
10. The README's typos ("promitives", "shakespare", "miliseconds") were fixed (19:06:30 PDT) about
    5 minutes before the history-rewrite record (19:11:53) and about 9 minutes before the GitHub
    repo existed (19:15:09 PDT) [S14][S11][S19].

## 10. Visual and dramatic details

- The site's look, from its own commit: "paper, ink and one copper accent, with system fonts only"
  (`f3cd407`, 2026-10-13) [S9]. The condition `a > 4` is copper in every view; boxes are outlined in
  ink; wires are copper [S3 src]. This matches the film's paper-cut register: use cream paper, ink
  black, one copper.
- The landing figure: input `a` splits into two ReLU boxes, a plus and a minus into `above4`, then
  `result`, "the circuit's last box; no wire leaves it" [S3 src].
- HandwiredOS: a small desktop, three windows (Monitor, Notes, Photos) and a dock; the wallpaper is
  arcs, one per stored weight, "the fainter the more weights the program stores"; Monitor's footer
  has a chart of time per frame over the last 60 frames [S6 L99][S18a].
- JSON search: a map with one cell per document lighting up for matches, one line of counts and
  ms [S6 L103].
- Learned gallery: a hand-drawn sketch, photos sliding into alignment as it trains [S6 L102].
- The workshop: one laptop-class machine (Apple M5 Max), late-night commit hours, a terminal
  running `bun`; the season is June (start) to mid-October (launch), California [S9][S19b].
  No weather or rooms are recorded; do not invent specifics beyond "a desk, a laptop, night".
- Dramatic beat: the 4-day October sprint ending in "publish", then the HN question "why?".

## 11. Sources

B = https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1

- [S1] README.md: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/README.md (L3 tagline, L7, L26-36 primitives and use-cases, L40-42)
- [S2] docs/README.md: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/README.md (L3, L7-11 doc order, L13-21 "Words the docs use", L23-40 "Running", L42-50 "Where things are")
- [S3] Live demo site: https://chenglou.me/handwired/ ; its source assets/demos.html: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/assets/demos.html (L7, L37, L55-71 hidden comment, L122-143 card)
- [S4] package.json: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/package.json
- [S5] LICENSE (MIT, "Copyright (c) 2026 Cheng Lou"): https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/LICENSE ; added in https://github.com/chenglou/handwired/commit/7409b6279e9119555ce697254058771e7760d0cd
- [S6] lab/status.md: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/status.md (L3, L7, L14-36, L40, L44, L93, L95-103, L107, L127, L234-240, L287-289)
- [S7] lab/status.md "The folders of lab/" (rename note): https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/status.md#the-folders-of-lab
- [S8] lab/reassessment-2026-09-03.md: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/reassessment-2026-09-03.md (L1-30)
- [S9] git log of the clone at 257856e (commands: `git log --oneline | wc -l` → 825; `git log --merges --oneline | wc -l` → 49; `git log --first-parent --oneline | wc -l` → 217; `git log --format=%b | grep -c "Co-Authored-By: Claude Code"` → 756; per-month counts 72/6/0/58/689). First commit: https://github.com/chenglou/handwired/commit/3d2c717732f9b276dac7372a281c622508a1988f ; commit list: https://github.com/chenglou/handwired/commits/main
- [S10] Rename commit: https://github.com/chenglou/handwired/commit/e86f5edcc7d144712b3635e193d4446762371524
- [S11] History-rewrite record: https://github.com/chenglou/handwired/commit/0237d405e80f33a5b74bf1d9d3b69a28f1571ca4
- [S12] GitHub Pages workflow commit: https://github.com/chenglou/handwired/commit/28167466a9117bdd8e5e3e5afd36dab00cc6ad61
- [S13] lab/ui-exploration/guide/review-and-decisions.md: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/ui-exploration/guide/review-and-decisions.md#decisions-for-you (L115-119, L123, L149, L177)
- [S14] README slip fixes: https://github.com/chenglou/handwired/commit/0fc1d1dbbcc725475756661379cb4ae535b364ab
- [S15] lab/recovery-parser/README.md (pin commit): https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/recovery-parser/README.md ; https://github.com/chenglou/handwired/commit/257856e3b221140acb4cc4460626b850c0bd4ff1
- [S16] docs/behavior-choices.md (chenguini references): https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/docs/behavior-choices.md ; https://github.com/chenglou/chenguini
- [S17] lab/json-search/README.md: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/json-search/README.md (L115-126)
- [S18a] src/handwiredos/README.md: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/handwiredos/README.md
- [S18b] src/learned-gallery/README.md: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/learned-gallery/README.md
- [S18c] src/json-search/README.md: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/src/json-search/README.md (L30)
- [S19] GitHub API repo metadata (created_at 2026-10-15T02:15:09Z, pushed_at 2026-10-17T01:12:12Z, MIT, TypeScript, homepage, description "Turn your regular JavaScript code into a neural net.", 2,033 stars / 158 forks on 2026-10-27/28; latest commit 257856e): https://api.github.com/repos/chenglou/handwired ; https://api.github.com/repos/chenglou/handwired/commits ; compare: https://github.com/chenglou/handwired/compare/3d2c717...257856e
- [S19b] GitHub profile: https://github.com/chenglou ; https://api.github.com/users/chenglou
- [S20] Show HN thread: https://news.ycombinator.com/item?id=50172984 (via https://hn.algolia.com/api/v1/items/50172984)
- [S20b] Earlier HN submission and others: https://news.ycombinator.com/item?id=50112421 ; https://news.ycombinator.com/item?id=50102806 ; https://news.ycombinator.com/item?id=50105849
- [S21] Launch post on X: https://x.com/_chenglou/status/2110557373651931267 (text and timestamp via https://api.fxtwitter.com/_chenglou/status/2110557373651931267)
- [S22] Secondary, unverified quote: https://javascript.plainenglish.io/goodbye-if-else-hello-handwired-neural-code-35c821945d96
- [S23] Secondary press: https://alphasignal.ai/news/cheng-lou-s-handwired-compiles-javascript-directly-into-neural-networks-without
- [S24] Lindner et al., Tracr (2023): https://arxiv.org/abs/2301.05062
- [S25] Weiss, Goldberg, Yahav, Thinking Like Transformers (2021): https://arxiv.org/abs/2106.06981
- [S26] lab/runtime-cost/README.md: https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/runtime-cost/README.md
- [S27] lab/research-sweep.md (trace compiler): https://github.com/chenglou/handwired/blob/257856e3b221140acb4cc4460626b850c0bd4ff1/lab/research-sweep.md#L29
- [S28] Shelf leads re-checked: public/generated/handwired*/sources.json pin 4ea7fcb (1,219 claims) and d01b763 (12); `git diff --stat 4ea7fcb 257856e` touches only lab/, so README/docs/src/template/tests claims carry over unchanged.

## 12. Fact-check log (adversarial pass, 2026-10-27)

Method: every key claim re-derived from the clone at `257856e` (`git log`, `git show`, `git diff`,
`git grep`), the GitHub REST API (`gh api repos/chenglou/handwired`, `/commits`, `/compare`,
`/branches/main`), the HN Algolia API (items 50172984, 50102806, 50105849, 50112421), the
fxtwitter API for the launch post, and a fetch of https://chenglou.me/handwired/ (HTTP 200).

**Confirmed unchanged** (re-derived independently): README tagline, mechanism, example and three
use-cases verbatim (README.md L3, L7, L16-22, L34-36); docs/README.md L3 correction verbatim, the
vocabulary (L15-21), Bun 1.4.3, `bun start`, `bun run test` "in about 3 minutes" (L25-31) and the
repo layout (src/runtime has exactly numeric-ui-core.ts, cells.ts, host-timing.ts,
prefix-networks.ts; template/ is the toggle; tests/runtime as described); first commit `3d2c717`
2026-06-03 20:24:40 -0700; 825 commits, 49 merges, 217 first-parent; all 825 authored "Cheng Lou";
756 `Co-Authored-By: Claude Code <noreply@anthropic.com>` trailers; month counts 72/6/0/58/689;
Oct 13-16 = 242+200+113+128 = 683, commits in all 24 hours; GitHub compare 3d2c717...257856e = 824;
`created_at` 2026-10-15T02:15:09Z, `pushed_at` 2026-10-17T01:12:12Z, MIT, TypeScript, homepage,
2,033 stars / 158 forks; head of main = 257856e on 2026-10-27; rename `e86f5ed` 2026-10-06 20:10;
`f3cd407` "paper, ink and one copper accent, with system fonts only" (2026-10-13 07:42) and
`2816746` Pages workflow (09:39); "one site and one look" (status.md L97); live site shows Mini OS,
Learned gallery, Search 100,000 JSON documents, 9,909 / 130 / 0; demos.html L122-128 card comment
("read on October 14, 2026 ... fails when a number here isn't the page's") and L59-68 hidden
comment (4.5 → 11; 2^24 + 6 = 16,777,222 → above4 2, result 8; emitCompare); `0237d40` message
quote "strip 1-4 yeah. Do it quick plz, then publish."; launch post text and 2026-10-15 02:24:24 UTC
verbatim (curly apostrophe); HN quotes Q20-Q22 verbatim and dated; Ohentis and "What's the point
of this ?" in item 50112421; JSON search line "13 ms" (src/json-search/README.md L29) vs "12 ms"
(status.md L103); "The page doesn't say that its search is faster than RegExp"; reassessment L15
("I traced the relevant June and July Claude conversations ... the original June Codex design
discussion"); status.md L3 "with Cheng's approval"; LICENSE "Copyright (c) 2026 Cheng Lou", added
`7409b62` 2026-06-21; Q15-Q17 verbatim in status.md L44, L127; `git diff --name-only 4ea7fcb 257856e`
lists 0 files outside lab/ (and no commit in the range touches one).

**Changes made:**

1. **Reassessment loss-scaling result (claim 9) — corrected.** "0/20 into 3/20 to 4/20" understated
   it; the table (reassessment L25-32) goes to 20/20 for two adds at 1,000,000x and 20/20 for the
   coordinate transform from 10,000x. Section 4 rewritten with the full table and the "does not show
   that the method scales" caveat (L38). Source: lab/reassessment-2026-09-03.md at the pin.
2. **Decision 3 wording (claim 10) — corrected.** Not "time and spring matrices": the decision is
   "JavaScript writes durations, event times and the spring matrix" (review-and-decisions.md L177);
   decision 2 is "one helper that chooses from declarations" (L149). Timeline row and section 3 fixed.
3. **Head commit 257856e (claims 5, 20) — corrected/clarified.** It is a merge commit (parents
   4ea7fcb, e86c1b4) of a 239-commit side branch begun 2026-10-15 00:50 (its own message says
   "The 238 commits"); it brings in lab/recovery-parser (README first added by `14cacd6`),
   lab/recovery-toml and lab/recovery-lr. "Commit number 825" is true only as a count of all
   reachable commits; on main's first-parent line it is the 217th. Timeline, summary, hook 8 fixed.
4. **Recovery-parser result (claim 20) — corrected (truncated quote).** README L3 continues: "with
   JSON's settings and random damage as its training data. Filling the same entries by trial and
   error did, and so did gradient training once it was given a fairer start". Section 5 now quotes it
   whole.
5. **Project names (claim 8) — clarified.** "Numeric UI Atom Lab" was the README title only June 3-6;
   `2be29e4` (2026-06-06 14:22) retitles it "Indirect"; "IndirectOS" first appears in `a084158`
   (2026-06-08). Summary, timeline, misconceptions and hook 1 fixed.
6. **Hook 10 timing — corrected.** 0fc1d1d (19:06:30 PDT) is ~5 min before 0237d40 (19:11:53) and ~9
   min before repo creation (19:15:09 PDT), not 9 and 18 minutes.
7. **Status.md citation — corrected.** "the September 3, 2026 review of the July results" is at
   status.md L289, not L287.
8. **tracr context — clarified.** aatd86's "google/tracr" was a reply to jahala's comment about models
   replacing code (HN item 50172984), not an answer to a prior-art question.
9. **JSON search vs workers — nuance added.** The GPU still beats 8/16 workers on the backtracking
   pattern (279/136 ms vs 5-12 ms), lab/json-search/README.md "Is the GPU clearly faster?".

**Still unverifiable:** Q23 ("Isn't a neural net probabilistic? ...") — only second-hand (a paywalled
JavaScript in Plain English article, HTTP 403 on fetch; web search found no original post). Stays
**UNVERIFIED — do not use as a quote**. Contested claim 19 (HN "overclaim") remains marked contested
in section 7 with both sides sourced.
