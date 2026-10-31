# Dossier: Framing — From Logical Neurons to Programs Compiled into Networks

**Topic id:** `framing-logic-neurons-to-compiled-programs` · **Era:** 1943–2026 (brief context only) · **As of:** 2026-10-27
**Use in the film:** brief framing *only*. The film is about Handwired. Everything in this dossier except Section 2's Handwired entries is **context**, not the author's lineage. The repo cites none of McCulloch & Pitts, Kleene, Siegelmann & Sontag or Giannou et al. It does cite RASP, Percepta, and Merrill & Sabharwal at the pinned commit, and Tracr at an older tag (details in Section 2, items H1–H4).

Verification method: primary texts were downloaded and their text layers read with macOS PDFKit (McCulloch & Pitts 1990 reprint; Kleene RM-704 scan; Siegelmann & Sontag 1991 and 1992; Lettvin et al. 1959; Lindner et al. Tracr v5; Giannou et al. PMLR; Conmy et al. ACDC). arXiv abstracts were scraped verbatim from the abstract pages. The Handwired references come from `git grep` on `chenglou/handwired` at `257856e` and at the tag `exploration-2026-09`.

---

## 1. Summary

- **1943.** Warren McCulloch, a neuropsychiatrist, and Walter Pitts, a teenage logician, argued that because neurons fire "all-or-none", "neural events and the relations among them can be treated by means of propositional logic". They claimed that for "any logical expression satisfying certain conditions, one can find a net behaving in the fashion it describes" [S1]. They also asserted, without a full proof ("It is easily shown"), that a net equipped with a **tape** and scanners computes exactly what a Turing machine computes. A net *without* a tape computes "some of the numbers the machine can, but no others, and not all of them" [S1].
- **1951/1956.** Stephen Kleene, at RAND, recast the McCulloch–Pitts nets as **finite automata**. He showed that the events they can represent are exactly the **"regular events"**, the origin of regular expressions and the Kleene star. He wrote that the paper's treatment of arbitrary nets was "obscure", found an apparent counterexample, and "proceeded independently" [S3].
- **1991–1995.** Hava Siegelmann and Eduardo Sontag (Rutgers) proved that a *fixed, finite* recurrent net of saturated-linear neurons with **rational** weights can simulate any Turing machine: "in linear time" in the 1992 version, and "any multi-stack Turing machine in real time" in the 1995 journal version [S6][S7]. Their counts were under 10^5 neurons (1991), then about 1,000 (1992), then 886 (1995) [S5][S6][S7]. The caveat: the unbounded tape is stored in the **digits of the activations** (a base-4 stack encoding), so the result needs unbounded precision. With **real** weights the nets go beyond Turing machines [S6][S8]. Arbitrarily small analog noise drops the power back to finite automata [S9]. (Contested in emphasis: Siegelmann & Sontag 1994 claimed their models "exhibit at least some robustness with respect to noise and implementation errors" [S8]; Maass & Orponen's 1998 result is the standard reference for the opposite conclusion under their noise model [S9].)
- **2021–2023.** Researchers began writing **programs into transformer weights**:
  - **RASP** (Weiss, Goldberg, Yahav, ICML 2021) is a programming language whose primitives model a transformer encoder [S10].
  - **Tracr** (Lindner et al., DeepMind, 2023; NeurIPS 2023 spotlight) compiles RASP into real decoder-only transformer weights, as ground truth for interpretability research [S11].
  - **Looped Transformers as Programmable Computers** (Giannou et al., ICML 2023) hand-programs a transformer that, run in a loop, emulates a one-instruction-set computer (SUBLEQ, generalized to FLEQ). The arXiv abstract gives "a looped, 13-layer transformer"; the ICML/PMLR abstract says "a constant depth looped transformer network". In the paper, the FLEQ machine has 9 + (deepest function block) layers (Theorem 1), and the 13-layer figures appear in Lemmas 6–8 [S12].
  - **Percepta** (March 2026) compiles a WebAssembly VM into a "standard softmax-ReGLU transformer" with analytically computed weights; the wording is from the GitHub README, repo created 25 Mar 2026 [S17][S33].
- **How Handwired differs.** Handwired is not a transformer and has no attention. Builder JavaScript appends FP32 affine sums, ReGLU products, 0/1 boolean roundings and index reads to a `Circuit`. These compile into layers of one sparse matrix multiplication followed by gates. A host loop runs the circuit once per frame and copies next-state values back [S20][S21][S22].
- **Handwired's own positioning.** The repo itself places Handwired next to RASP ("two of this section's rewrites are RASP programs") [S23] and next to transformers with chain of thought ("Handwired has the same structure", meaning frame-by-frame write-back) [S24]. It names Percepta's scheduling as "the reference approach" for a parked TODO [S25]. An older tagged note discussed Tracr [S26].
- **The belief of the age.** Learned weights beat hand-built knowledge (Sutton, "The Bitter Lesson", 2019) [S16]. This is a widely cited position, not a consensus: Rodney Brooks replied six days later that "Sutton is wrong for a number of reasons" [S32]. Hand-compiled networks have survived as **proofs of expressivity** and **interpretability testbeds**, not as a way to build systems. Tracr's own authors say "we will likely never compile fully featured language models in Tracr" [S11].

---

## 2. Timeline

| Date | Event | Sources |
|---|---|---|
| 1943 | McCulloch & Pitts, "A Logical Calculus of the Ideas Immanent in Nervous Activity", *Bulletin of Mathematical Biophysics* 5:115–133. Authors listed at University of Illinois College of Medicine, Dept. of Psychiatry at the Illinois Neuropsychiatric Institute, and the University of Chicago. | [S1][S2] |
| 30 June 1945 | Von Neumann's *First Draft of a Report on the EDVAC* (Moore School, Univ. of Pennsylvania) models its computing elements on McCulloch–Pitts neurons (§4.2 "Neurons, synapses, excitatory and inhibitory types"; vacuum tubes as idealized neurons). Checked in Godfrey's 1992 transcription: "Following W.S. MacCulloch [*sic*] and W. Pitts (...) we ignore the more complicated aspects of neuron functioning". Gefter says it is the only paper the report cites; a text search of the transcription finds no other citation. | [S30][S14] |
| 15 Dec 1951 | Kleene, *Representation of Events in Nerve Nets and Finite Automata*, U.S. Air Force Project RAND Research Memorandum RM-704 (ii + 98 pp.), from investigations made in August 1951. | [S3][S4] |
| 1956 | The same work is published in Shannon & McCarthy (eds.), *Automata Studies* (Princeton), pp. 3–41/42 (the JSTOR listing gives 3–42). | [S4] |
| Nov 1959 | Lettvin, Maturana, McCulloch & Pitts, "What the Frog's Eye Tells the Frog's Brain", *Proc. IRE* 47(11):1940–1951. The retina reports features ("bug" detectors) rather than a copy of the light. | [S13] |
| 14 May 1969 | Pitts dies in Cambridge, MA. McCulloch dies about four months later (secondary source). | [S14] |
| June 1991 (received) | Siegelmann & Sontag, "Turing Computability with Neural Nets", *Appl. Math. Lett.* 4(6):77–80. A finite net of sigmoidal (saturated-linear) neurons simulates a universal Turing machine with "less then 10^5" processors. | [S5] |
| 1992 | Siegelmann & Sontag, "On the Computational Power of Neural Nets", COLT 1992, pp. 440–449. Rational nets simulate all Turing machines in linear time with a universal net of "about 1,000 processors". Real weights compute non-recursive functions. | [S6] |
| 1994 | Siegelmann & Sontag, "Analog Computation via Neural Networks", *Theoretical Computer Science*. With real weights, polynomial-time nets are "more powerful than Turing Machines" (they correspond to non-uniform circuits). | [S8] |
| 1995 | Siegelmann & Sontag, *J. Comput. Syst. Sci.* 50(1). The universal net is 886 processors. Later work cut this to 96 (Koiran et al. 1994) and to 25 (Indyk 1995), per Siegelmann & Margenstern 1999. | [S7] |
| 1998 | Maass & Orponen, *Neural Computation* 10(5):1071–1095. Arbitrarily small analog noise reduces analog nets to finite-automaton power. | [S9] |
| 13 Mar 2019 | Rich Sutton, "The Bitter Lesson". | [S16] |
| 3 Jan 2020 (issue date; released online 2 Jan) | Gidon et al., *Science* 367(6473):83–87. Human L2/3 dendrites produce graded calcium action potentials that classify linearly non-separable inputs (XOR-like), a job "conventionally thought to require multilayered networks". | [S15] |
| 13 Jun 2021 | Weiss, Goldberg & Yahav, "Thinking Like Transformers" (RASP), arXiv 2106.06981, ICML 2021. | [S10] |
| 12 Jan 2023 | Lindner, Kramár, Farquhar, Rahtz, McGrath & Mikulik, "Tracr: Compiled Transformers as a Laboratory for Interpretability", arXiv 2301.05062 (v5 3 Nov 2023, "Presented at NeurIPS 2023 (Spotlight)"). | [S11] |
| 30 Jan 2023 | Giannou, Rajput, Sohn, Lee, Lee & Papailiopoulos, "Looped Transformers as Programmable Computers", arXiv 2301.13196. ICML 2023, PMLR 202:11398–11442 (Honolulu, July 23–29, 2023). | [S12] |
| 2023 | Conmy et al., ACDC (NeurIPS 2023 spotlight) uses Tracr-compiled models (tracr-xproportion, tracr-reverse) as ground-truth circuits for automated circuit discovery. Friedman, Wettig & Chen, "Learning Transformer Programs" (NeurIPS 2023 oral) trains transformers that convert into RASP-like programs. | [S18][S19] |
| 11 & 25 Mar 2026 | Percepta blog posts "Can LLMs Be Computers?" (Christos Tzamos with others at Percepta) and "Constructing an LLM-Computer". Repo `Percepta-Core/transformer-vm` created 25 Mar 2026. | [S17] |
| 16 Sep 2026 | **H1.** Handwired tag `exploration-2026-09`: `lab/ui-exploration/notes/outside-techniques.md` §"Compiled transformer programs (RASP, Tracr, Percepta)" (L175–181) describes RASP, Tracr and Percepta. It notes that the measured counting sort "is a direct RASP program". | [S26] |
| 16 Oct 2026 (commit `257856e`) | **H2–H4.** Handwired main still cites RASP (`loops.md#L239`), Merrill & Sabharwal 2023/2024 and Liu et al. 2023 (`chains.md#L216-L218`) and Percepta (`lab/status.md#L256`, `chains.md#L210`, `executor.md#L230`, `indexing.md#L337`, `#L452`, and a code comment in `lab/event-window/integer-bits.ts#L23`). It does **not** mention McCulloch, Pitts, Kleene, Siegelmann, Sontag, Giannou or Tracr (`git grep` returns nothing), although `loops.md#L239` and `executor.md#L230` link to the tagged note that discusses Tracr. | [S23][S24][S25] |

---

## 3. People

Depiction guidance: silhouettes only, and no likeness of living people. Use generic figures, hands and desks for the modern researchers.

**Warren S. McCulloch (1898–1969).** Neurophysiologist and psychiatrist at the Illinois Neuropsychiatric Institute, University of Illinois College of Medicine, Chicago (1943 affiliation) [S1]. He later worked at MIT (RLE), per the 1959 paper's affiliations [S13].
- **Belief:** neurons' all-or-none firing makes the brain a logical machine; "the fundamental relations are those of two-valued logic" [S1].
- **Pictured as** "gray-eyed, wild-bearded, chain-smoking philosopher-poet" [S14]: a long, full beard, a thin face, the suit and tie of a 1940s academic, a cigarette. He was 42 when he met Pitts [S14].

**Walter Pitts (1923–1969).** Self-taught logician, unaffiliated, attached to the University of Chicago circle in 1943 [S1][S14].
- **Belief:** he co-authored the logical-neuron theory. After the frog's-eye work showed analog, interpretive processing in the eye, Lettvin said "It disappointed him" [S14].
- **Pictured as** "small and shy", "bespectacled", with a long forehead that made him look older [S14]. He was 18 when he met McCulloch, and a homeless runaway [S14]. He lived with the McCulloch family in Hinsdale outside Chicago, and the two worked late at night over whiskey [S14].
- Gefter's account says he later burned his dissertation and notes [S14]. That is a secondary source: use it as narration, not as a quote.

**Stephen Cole Kleene (1909–1994).** Logician (University of Wisconsin–Madison) who wrote RM-704 for Project RAND, Santa Monica, from investigations in August 1951 [S3][S4].
- **Belief:** the McCulloch–Pitts all-or-nothing assumption is "close to the biological reality", but the model's real fit to brains is an open question. He framed his results as "'it could be this way, and quite possibly the real process is significantly similar to this'" [S3].
- **Appearance:** not verified in this dossier. Use a generic 1950s academic in suit and tie, and consult an archival photograph before any distinctive feature.

**Hava T. Siegelmann and Eduardo D. Sontag.** At Rutgers University, New Brunswick, NJ, in 1991–1995: she in Computer Science, he in Mathematics [S5][S6].
- **Belief:** linear (first-order) nets with saturating activations are as powerful as Turing machines, and high-order connections are not needed, "contrary to what had been stated in the literature" [S6].
- **Depiction:** both are living, so use generic silhouettes (1990s office, chalkboard, workstation). No likeness.

**Gail Weiss, Yoav Goldberg, Eran Yahav.** Authors of RASP (ICML 2021) [S10]. Affiliations are not checked here; commonly given as Technion and Bar-Ilan/AI2. Living people: no likeness.

**David Lindner and co-authors (Kramár, Farquhar, Rahtz, McGrath, Mikulik), DeepMind.** Tracr. Per the paper, "VM proposed the initial idea for Tracr" and "DL led the project" [S11]. Living people: no likeness.

**Angeliki Giannou, Shashank Rajput and co-authors.** University of Wisconsin–Madison, Yonsei and Princeton (per the PMLR listing) [S12]. Living people: no likeness.

**Cheng Lou (`chenglou`).** Author of Handwired and tagger of `exploration-2026-09` [S26]. Per the brief, describe him only through what the repo says. No biography, no likeness.

---

## 4. The belief of the age

**1943–c.1959: "the brain is a logic machine".** Held by McCulloch and Pitts [S1], picked up by von Neumann for EDVAC (1945) [S14], and kept by Kleene as a working model with explicit caveats [S3]. Kleene already noted three problems [S3]:
- It is unrealistic to assume neurons never malfunction ("this is unrealistic").
- Memory "entirely in terms of McCulloch-Pitts neurons" is hard to explain.
- Analog control may be "the simplest and most efficient".

**Dissent from inside, 1959.** The frog's-eye paper, co-authored by McCulloch and Pitts themselves, concluded that "the eye speaks to the brain in a language already highly organized and interpreted" [S13]. The paper itself does not say it refutes the 1943 calculus; reading it as undercutting the logic-gate picture is Gefter's and Lettvin's later framing [S14], so narrate it as interpretation. Lettvin later said logic "didn't play the important or central part that one would have expected" (as quoted by Gefter) [S14].

**Today's neuroscience.** Single neurons are not simple threshold gates. Human dendrites produce graded, non-all-or-none spikes that do XOR-like classification [S15]. The "all-or-none" premise survives only for the axonal spike itself. So "neurons compute logic" is best stated as a **1940s modeling idealization** that founded computing theory, not as biology.

**Computational belief, 1990s–2026.** What neural nets *can* compute is settled in the theory:
- **Finite precision or noise:** finite automata [S3][S9].
- **Unbounded rational precision:** Turing-complete [S5][S6].
- **Real weights:** beyond Turing [S8].

Transformers were later shown Turing-complete under high or infinite precision assumptions. Giannou et al. summarize: "The constructions typically require high/infinite precision" [S12].

**Engineering belief, 2019–2026 (dominant but contested).** Learn the weights; don't hand-write knowledge. Dissent from the start: Brooks, "A Better Lesson" (19 Mar 2019), argued "we have to take into account the total cost of any solution" and that human ingenuity moves into architecture, data and hardware [S32]. Sutton: "general methods that leverage computation are ultimately the most effective, and by a large margin" [S16]. Hand-compiled networks persist in three niches:
1. Proofs of what an architecture can express (Giannou, RASP layer and head bounds) [S10][S12].
2. Ground truth for mechanistic interpretability (Tracr; ACDC's tracr tasks) [S11][S18].
3. Hybrid "compile then learn" research (Learning Transformer Programs [S19]; Percepta's compiled VM [S17]).

Handwired's README pitch ("no training, exact, yet also fully differentiable", and attaching a frozen program to a generic net to "train end-to-end") is a bet in the hybrid niche [S20]. It is a bet, not an established consensus.

**What ended "logic neurons" as biology:** electrophysiology (1959 onward [S13]) and dendritic computation (e.g., 2020 [S15]). As *computer science*, the idea never ended. It became automata theory (Kleene) and the digital computer (EDVAC).

---

## 5. Experiments and results

**McCulloch & Pitts 1943: a paper calculus, no apparatus.** The five physical assumptions, verbatim [S1]:
1. "The activity of the neuron is an 'all-or-none' process."
2. "A certain fixed number of synapses must be excited within the period of latent addition in order to excite a neuron at any time, and this number is independent of previous activity and position on the neuron."
3. "The only significant delay within the nervous sytem is synaptic delay." (*sic*: "sytem" is in the reprint)
4. "The activity of any inhibitory synapse absolutely prevents excitation of the neuron at that time."
5. "The structure of the net does not change with time."

Notes for the film:
- Inhibition is absolute veto. There is no weighted sum with real weights: thresholds are integer counts.
- Theorem 7: "Alterable synapses can be replaced by circles." Learning is replaced by loops.
- Visual: hand-drawn net diagrams with arrowheads and loops ("circles").

**Kleene RM-704 (1951): a 98-page typed memorandum.**
- Part I covers nerve nets; Part II covers finite automata.
- Key result: the events representable by McCulloch–Pitts nets (and by finite automata) are exactly the regular events, built from union, concatenation and iterate (star) [S3][S4]. Note: Kleene's original star is **binary**, E\*F, "zero or more consecutive occurrences of E preceded by one of F" (RM-704 p. 49–50); the unary E\* of modern regular expressions came later. The name "Kleene star" is later usage.
- Kleene's thought experiment: a robot whose memory is built only from delay chains "must thereafter suffer an advancing amnesia" [S3].

**Siegelmann & Sontag: constructions, no machines.**
- Neuron model: x(t+1) = σ(Ax + bu + c), with σ the saturated-linear function (0 below 0, identity on [0,1], 1 above 1) [S5].
- Trick: each Turing-machine stack is a rational number in [0,1] written in **base 4**. A stored "0" is digit 1 and a stored "1" is digit 3; empty is 0. "A binary representation, rather than a base-4 representation, would not allow such simple stack operation" [S6].
- Push and pop are multiply or divide by 4 plus an offset. Infinite memory lives in infinitely fine digits, which is why the result needs unbounded precision.
- Net sizes: <10^5 (1991) → ~1,000 (1992) → 886 (1995) → 96 → 25 [S5][S6][S7].
- Visual: a single dial whose needle position holds a whole stack in its decimals; zoom in and the digits keep going.

**Lettvin et al. 1959: real apparatus.**
- Single fibers in the frog's optic nerve, recorded with metal microelectrodes. **UNVERIFIED (no source found):** the anecdote that Lettvin traded the IRE an electrode paper for publishing this one. Do not narrate.
- Four fiber types, each "uniformly distributed over the whole retina", respond to *patterns of local variation of intensity*, not light intensity itself [S13].
- Visual (checked against the text, p. 1941–42): the frog's eye faces "an aluminum hemisphere, 20 mils thick and 14 inches in diameter, silvered to a matte grey finish on the inner surface and held concentric to the eye". Objects on the inner surface are "attached to small magnets" and "moved about by a large magnet moved by hand on the outer surface". Stimuli: "a dull black disk almost 1° in diameter" and a 30°×12° rectangle; 1° is "slightly less than an eighth of an inch" on the hemisphere [S13].

**RASP (2021).**
- Primitives: elementwise maps (MLP), `select` and `aggregate` (attention), and `selector_width` (count).
- RASP programs for histograms, sorting and Dyck languages. Transformers were trained to mimic them, and a RASP program bounds the layers and heads needed [S10].

**Tracr (2023).**
- Compiles RASP to decoder-only transformer weights in six steps, with categorical (one-hot) or numerical residual encodings.
- The study of "superposition" compresses a compiled model's residual stream.
- Example programs: token frequencies, sorting, parenthesis checking. Code at github.com/google-deepmind/tracr [S11].

**Giannou et al. (2023).**
- The input sequence is a "punchcard" of instructions plus memory.
- A looped transformer runs SUBLEQ, a one-instruction-set computer (Lemma 4: "This architecture has ten layers, two heads, and a width of O(log(n) + log(N))"). It generalizes to a FLEQ instruction; Theorem 1 gives the FLEQ machine "9 + max{l1,···,lM}" layers, where the l's are the function blocks' depths. The calculator/linear-algebra/SGD lemmas (6–8) use 13 layers and 1 head.
- Demos: a calculator, a linear-algebra library, and backprop-based in-context learning [S12].

**Percepta / transformer-vm (2026).**
- "A standard softmax-ReGLU transformer whose weights are computed **analytically** that correctly simulates a WebAssembly virtual machine on arbitrary programs" (README L7–9, verbatim apart from the bold) [S33].
- Pipeline: a MILP solves the schedule, then a C++ inference engine runs programs at "~30K tok/s" (README claim) [S17].
- Handwired's summary of Percepta: hard-max attention over 2D keys on a parabola, a convex-hull cache answering each lookup in O(log n), and residual-slot reuse by interval coloring [S26].

**Handwired, for contrast; all claims from the repo.**
- A program is "a fixed list of arithmetic operations over 32-bit floats". It is written in builder JavaScript that "runs once and appends the operations to a `Circuit`". "No tool converts existing JavaScript source into a program" [S21].
- The lab's trace compiler does compile "a defined numeric subset of TypeScript". It is an experiment, "not a runtime tracer and does not compile arbitrary JavaScript" (`lab/trace-compiler/README.md#L3`).
- The four operations are `affine`, `reglu`, `boolean`, `indexRead` [S21]. ReGLU is `reglu(left, gate) = f(left * max(0, gate))` [S22].
- A layer "gathers its earlier inputs, evaluates its sparse affine projection, applies gather reads, index reads, ReGLU gates and boolean rounding" [S22].
- There is no attention mechanism. Hard reads by computed index are described by the repo as hard attention whose keys are positions. The repo also says plainly that "What a transformer's attention adds isn't here" [S27].

**Key structural contrasts (the film can state these):**

| | Tracr / RASP | Looped transformer (Giannou) | Percepta VM | Handwired |
|---|---|---|---|---|
| Target architecture | standard decoder-only transformer | standard transformer encoder, looped | softmax-ReGLU transformer | custom sparse layers: affine + ReGLU + 0/1 rounding + index read; no attention |
| What's in the weights | one RASP program | an *interpreter* (the program is in the input "punchcard") | an *interpreter* (WebAssembly VM) | one specific UI/search program |
| Loop | none (one forward pass) | loop the whole transformer | autoregressive token steps | host loop: one evaluation per frame, next-state copied back |
| Precision story | categorical one-hot / numerical | N bits per integer, width O(log n + log N) | analytic weights | exact FP32 with declared ranges and rounding points |
| Purpose | interpretability ground truth | expressivity proof | "LLM as computer" | run real UI exactly; differentiable for training |

---

## 6. Verified quotes

All checked against primary text unless marked otherwise.

1. **McCulloch & Pitts, abstract (1943; checked in 1990 reprint) [S1]:** "Because of the "all-or-none" character of nervous activity, neural events and the relations among them can be treated by means of propositional logic. It is found that the behavior of every net can be described in these terms, with the addition of more complicated logical means for nets containing circles; and that for any logical expression satisfying certain conditions, one can find a net behaving in the fashion it describes."
2. **McCulloch & Pitts on Turing [S1], §3 end:** "It is easily shown: first, that every net, if furnished with a tape, scanners connected to afferents, and suitable efferents to perform the necessary motor-operations, can compute only such numbers as can a Turing machine; second, that each of the latter numbers can be computed by such a net".
   - Following sentence: "This is of interest as affording a psychological justification of the Turing definition of computability and its equivalents, Church's λ-definability and Kleene's primitive recursiveness: if any number can be computed by an organism, it is computable by these definitions, and conversely."
   - Caution: the 1990 reprint's text layer repeats a clause ("and that nets with circles can be computed by such a net;") right before "nets with circles can compute, without scanners and a tape, some of the numbers the machine can, but no others, and not all of them." If quoting that last part, check the 1943 original page image. The OCR also renders λ as "A".
3. **McCulloch & Pitts [S1], §4:** "Thus in psychology, introspective, behavioristic or physiological, the fundamental relations are those of two-valued logic."
4. **McCulloch & Pitts [S1], §4:** "Certainly for the psychiatrist it is more to the point that in such systems "Mind" no longer "goes more ghostly than a ghost.""
5. **Kleene, RM-704, p. 4 (1951) [S3]:** "The present memorandum is partly an exposition of the McCulloch-Pitts results; but we found the part of their paper which treats of arbitrary nets obscure; so we have proceeded independently here."
6. **Kleene, RM-704, p. 36 [S3]:** "This apparent counterexample has discouraged us from further attempts to decipher Part III of the McCulloch-Pitts 1943."
7. **Kleene, RM-704, p. 4 [S3]:** "Under the McCulloch-Pitts assumption of the all-or-nothing character of a neuron's firing (which is close to the biological reality) and their assumption which quantizes time so that all neurons have their moments of possible firing in phase, a nerve net has the character of a digital automaton." (OCR typos silently corrected: "which.is", "tha~".)
8. **Siegelmann & Sontag, COLT 1992 abstract [S6]:** "We prove that one may simulate all Turing Machines by rational nets. In particular, one can do this in linear time, and there is a net made up of about 1,000 processors which computes a universal partial-recursive function. Products (high order nets) are not required, contrary to what had been stated in the literature."
9. **Siegelmann & Sontag 1992 [S6], the precision caveat in their words:** "in our work, the activation values themselves are used instead to encode unbounded information" and "We restrict to rational states and weights in order to preserve computability. It turns out that using real valued weights results in processor nets that can "calculate" arbitrary partial functions, not necessarily recursive."
10. **Lettvin, Maturana, McCulloch & Pitts, Proc. IRE, p. 1950 (1959) [S13]:** "Fundamentally, it shows that the eye speaks to the brain in a language already highly organized and interpreted, instead of transmitting some more or less accurate copy of the distribution of light on the receptors."
11. **Weiss, Goldberg & Yahav, RASP abstract (2021) [S10]:** "Where recurrent neural networks have direct parallels in finite state machines, allowing clear discussion and thought around architecture variants or trained models, Transformers have no such familiar parallel. In this paper we aim to change that, proposing a computational model for the transformer-encoder in the form of a programming language."
12. **Lindner et al., Tracr abstract (2023) [S11]:** "We show how to "compile" human-readable programs into standard decoder-only transformer models. Our compiler, Tracr, generates models with known structure."
13. **Lindner et al., Tracr, closing discussion, "Limitations" paragraph (v5) [S11]:** "Clearly, we will likely never compile fully featured language models in Tracr. Therefore, we should interpret experiments conducted on compiled models carefully, and treat evaluations based on them as a minimum bar rather than a full validation of a technique."
14. **Lindner et al., Tracr, closing discussion (v5) [S11]:** "The current approach to doing interpretability research is similar to trying to invent a microscope lens without ever being able to point it at familiar, well-understood shapes."
15. **Giannou et al., arXiv abstract (2301.13196) [S12]:** "We present a framework for using transformer networks as universal computers by programming them with specific weights and placing them in a loop. Our input sequence acts as a punchcard, consisting of instructions and memory for data read/writes." Also (arXiv abstract only): "demonstrates that even shallow transformers can execute full-fledged, general-purpose programs." The ICML/PMLR abstract hyphenates "punch- card" (line break) and does not contain the "shallow transformers" sentence or the "13-layer" phrase; cite the arXiv version for these words.
16. **Sutton, "The Bitter Lesson", 13 Mar 2019 [S16]:** "The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin." Also: "We have to learn the bitter lesson that building in how we think we think does not work in the long run."
17. **Handwired README L3 [S20]:** "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!"
18. **Handwired README L7 [S20]:** "A program's made of if-else, loops, and state. Handwired transforms them into matrix multiplication + reglu over floats."
19. **Handwired `lab/ui-exploration/guide/sections/loops.md#L239` [S23]:** "RASP (Weiss, Goldberg and Yahav, "Thinking Like Transformers", 2021) is a programming language whose operations match what a transformer layer computes."
20. **Handwired `chains.md#L226` [S24]:** "A network approximates a chain of logic with whatever wide structure training finds, so its shortcuts can fail where the training data didn't reach, and its layers don't line up with the steps of the logic. Handwired compiles the chain itself, exactly, so its depth equals the logic's actual dependencies".
21. **Handwired `chains.md#L220` [S24]:** "Handwired has the same structure. One frame is one evaluation of a fixed-depth circuit, and the next-state write-back plays the role of the appended token".
22. **Von Neumann, *First Draft of a Report on the EDVAC*, §4.2 (30 June 1945; Godfrey 1992 transcription) [S30]:** "It is worth mentioning, that the neurons of the higher animals are definitely elements in the above sense. They have all-or-none character, that is two states: Quiescent and excited." And: "Following W.S. MacCulloch and W. Pitts (“A logical calculus of the ideas immanent in nervous activity,” Bull. Math. Biophysics, Vol. 5 (1943), pp. 115–133) we ignore the more complicated aspects of neuron functioning".
23. **Gidon et al., *Science* abstract (2020) [S31]:** "In contrast to typical all-or-none action potentials, dCaAPs were graded; their amplitudes were maximal for threshold-level stimuli but dampened for stronger stimuli. These dCaAPs enabled the dendrites of individual human neocortical pyramidal neurons to classify linearly nonseparable inputs-a computation conventionally thought to require multilayered networks."
24. **Siegelmann & Sontag, JCSS 1995 abstract (via CORE) [S7]:** "one can simulate any multi-stack Turing machine in real time, and there is a net made up of 886 processors which computes a universal partial-recursive function."

**Paraphrases, not quotes:**
- **UNVERIFIED as a quote:** any line like "McCulloch and Pitts proved the brain is a Turing machine". They asserted the tape-equipped case "is easily shown" and gave no detailed proof.
- **UNVERIFIED as a quote:** Lettvin's remarks to Gefter ("It disappointed him"; logic "didn't play the important or central part…"). They appear only in secondary journalism [S14]. Usable as attributed reportage ("Lettvin later told..."), not as a primary quote.
- **Now verified (primary transcription):** see quote 22 below. Note the report misspells the name "MacCulloch".

---

## 7. Debates and controversies

1. **Were McCulloch–Pitts nets Turing-complete?**
   - **For:** the paper asserts tape-equipped nets compute exactly the Turing-computable numbers [S1].
   - **Qualified:** the claim is asserted ("easily shown"), not proved in detail. Without a tape, nets with circles compute "some … but no others, and not all" [S1]. Kleene's analysis makes tape-less nets exactly finite automata (regular events) [S3][S4]. Siegelmann & Sontag 1991 note that "finitely many threshold neurons cannot simulate more than finite automata behavior, continuous-valued neurons are required" [S5].
   - **Film-safe phrasing:** "with a tape attached, they said, a net could compute anything a Turing machine could; on its own, a net is a finite machine."
2. **Did the 1943 paper hold up mathematically?** Kleene found Part III "obscure" and found an "apparent counterexample" to one formula [S3]. Copi, Elgot & Wright (1958) said Kleene's own proofs were "obscured" by complex concepts and gave new proofs (search-result summary, not checked against the original) [S4].
3. **Neurons as logic gates: biologically right?** **Contested, now largely rejected as biology.**
   - **For (at the time):** Kleene called all-or-nothing firing "close to the biological reality" [S3].
   - **Against:** McCulloch and Pitts's own 1959 frog work found interpretive, pattern-level coding in the retina [S13]. Single human cortical neurons compute non-linearly-separable functions in their dendrites with graded spikes, "in contrast to typical all-or-none action potentials" [S15].
   - **Fair statement:** the axonal spike is all-or-none; the neuron's computation is not a single threshold gate.
4. **Turing completeness of nets: meaningful or an artifact of precision?**
   - **For:** a finite net of 886 neurons is universal with rational weights [S7].
   - **Against:** the construction stores unbounded memory in activation digits [S6]. Arbitrarily small analog noise reduces power to finite automata [S9]. Transformer constructions typically need high or infinite precision [S12].
   - **Relevance to Handwired:** FP32 is finite, so one Handwired evaluation is a fixed finite circuit, and the host loop supplies the unbounded time. The repo makes the analogous argument with TC^0 and chain of thought, citing Merrill & Sabharwal [S24].
5. **Hand-compiled vs learned weights.**
   - **For learning:** Sutton [S16].
   - **For compiling, as tools:** Tracr's authors (interpretability ground truth) [S11]; ACDC's use of tracr tasks [S18]; Percepta's argument that transformers can execute programs [S17].
   - **Middle ground:** learn a program-shaped model, then decompile it (Friedman et al.) [S19].
   - **Critiques of compiled models:** Tracr's own authors list "expressivity, efficiency and realism" limits [S11]. (Corrected: ACDC's poor tracr result is **not** evidence that compiled models differ from trained ones. The paper says "ACDC achieved poor performance on both tracr tasks in Fig. 3, but the circuit was perfectly recovered by ACDC at any threshold τ >0 when patching activations with zeros" — a sensitivity to the patching distribution and metric [S18].)
   - **Handwired's own stance** is a hybrid bet (README "funny use-cases": unfreeze and train; attach to a nanoGPT) [S20]. Its lab is candid that "exact forward execution is distinct from a useful training gradient" (`lab/research-sweep.md`, September 2026 update).

---

## 8. Misconceptions to avoid

- **Don't** say Handwired descends from, or was inspired by, McCulloch & Pitts, Kleene, Siegelmann & Sontag or Giannou. The repo cites none of them. Frame them as "an old idea", context only.
- **Don't** call Handwired a transformer, or "Tracr for UI". It has no attention or residual stream. Its layers are sparse affine + ReGLU + 0/1 rounding + index reads [S22]. The repo itself says transformer attention's learned queries and keys "isn't here" [S27].
- **Don't** say Handwired compiles arbitrary JavaScript. The docs say "No tool converts existing JavaScript source into a program" [S21]. The lab trace compiler handles a defined TypeScript subset only.
- **Don't** say McCulloch–Pitts neurons learned. Assumption 5 fixes the structure [S1]. Learning rules came later (Hebb 1949; Rosenblatt's perceptron 1958, not covered here).
- **Don't** say McCulloch–Pitts proved nets are Turing-complete on their own. That needs a tape [S1][S3].
- **Don't** describe McCulloch–Pitts units as weighted sums with real weights. They count excited synapses against a fixed threshold, with absolute inhibition [S1]. Handwired's `boolean` rounds a 0..1 score at 0.5 [S22]: a cousin, not a copy.
- **Don't** imply Siegelmann–Sontag Turing-completeness applies to real or float hardware. It needs unbounded precision [S6][S9].
- **Don't** credit RASP with compiling to weights. RASP is the language, and the RASP paper *trained* transformers to mimic RASP solutions. Tracr is the compiler [S10][S11].
- **Don't** give Giannou's machine as "13 layers runs SUBLEQ". The SUBLEQ lemma is ten layers, two heads. The "13-layer" phrase is in the arXiv abstract; in the paper the FLEQ machine is 9 layers plus its deepest function block, and the 13-layer instances are the calculator/linear-algebra/SGD lemmas [S12].
- **Don't** call the 1943 journal "Bulletin of Mathematical Biology". It was *Bulletin of Mathematical Biophysics* in 1943. The 1990 reprint appeared in *Bulletin of Mathematical Biology* 52:99–115 [S1][S2].
- **Don't** say the frog paper was published in a biology journal. It was *Proceedings of the IRE*, an engineering journal [S13].

---

## 9. Curiosity hooks

1. **The first neural-network paper ends by consoling psychiatrists.** In such systems "Mind" no longer "goes more ghostly than a ghost" [S1].
2. **The father of regular expressions couldn't follow the paper he was extending.** Kleene's counterexample "discouraged us from further attempts to decipher Part III" [S3].
3. **Kleene's robot with an advancing amnesia.** A memory made only of delay chains means that past its design lifespan it forgets one early day for each new day [S3].
4. **McCulloch and Pitts undermined their own idea.** Their 1959 frog's-eye paper, co-written with Lettvin and Maturana, showed the eye "speaks to the brain in a language already highly organized and interpreted" [S13].
5. **A universal computer in 886 neurons, with the tape hidden in the decimals.** Siegelmann & Sontag store a whole stack in base-4 digits of one activation, because binary "would not allow such simple stack operation" [S6][S7]. Later first-order constructions cut it to 25 (Indyk 1995); with high-order "switch-affine" neurons, Siegelmann & Margenstern (1999) needed only nine [S7].
6. **A transformer that reads a punchcard.** Giannou et al.'s input sequence "acts as a punchcard" of instructions and memory [S12].
7. **Tracr's microscope.** Interpretability without compiled models is "trying to invent a microscope lens without ever being able to point it at familiar, well-understood shapes" [S11].
8. **Handwired already counts one of its sorts as a RASP program.** Its measured counting sort at 64 items takes 5 layers versus a bitonic network's 105 (with payload) [S26]. The repo's main docs say "two of this section's rewrites are RASP programs" [S23].
9. **Handwired's frames work like chain-of-thought tokens.** The repo argues each frame's next-state write-back "plays the role of the appended token" [S24].
10. **Same gate, two inventors.** Handwired's README primitive is "reglu" [S20]. Percepta's 2026 compiled computer is "a standard softmax-ReGLU transformer" [S17]. Handwired's notes cite Percepta's ReGLU gates as `reglu(a, b) = ReLU(b)·a` [S26].

---

## 10. Visual and dramatic details

- **Hinsdale, Illinois, early 1940s:** the McCulloch family house in a rural suburb outside Chicago, where Pitts lived. Late-night work "pour the whiskey, hunker down" [S14]. Silhouette: two figures at a kitchen table, one tall and bearded with a cigarette, one small and bespectacled, papers covered in arrow-and-loop net diagrams.
- **The 1943 page:** dense formal logic with small neuron diagrams (arrows, terminal dots, loops). Paper-cut idea: a net of cut-out arrows lighting up in propositional order.
- **RAND, Santa Monica, 1951:** a typed memorandum, "U.S. Air Force Project RAND", 98 pages [S3][S4]. Typewriter carriage-return clack (house rule: machines clack).
- **The frog lab, MIT (Research Laboratory of Electronics), 1959:** a frog facing a 14-inch matte-grey aluminum hemisphere; a small dark disk on the inner surface, dragged by a hand-held magnet on the outside [S13]. Electrode and oscilloscope as silhouette props.
- **Rutgers, early 1990s:** chalkboard of σ(Ax+bu+c), and one dial whose needle holds infinitely many base-4 digits; zoom reveals more digits.
- **2021–2026:** for RASP, Tracr, Giannou and Percepta, no rooms or people. Use abstract paper-cut "weight looms": a transformer drawn as stacked attention and MLP plates with a program fed in as a punchcard (Giannou). Contrast with Handwired's single sparse matmul loom plus ReGLU ramps, with a host-loop clockwork copying next-state back.
- **Period details:** 1940s suits, ties and pipes/cigarettes for McCulloch [S14]; 1959 IRE engineering journal; the 2023 papers' venues (NeurIPS, ICML in Honolulu, July 2023 [S12]). No identifiable modern faces.

---

## 11. Sources

1. [S1] McCulloch & Pitts, "A Logical Calculus of the Ideas Immanent in Nervous Activity", Bull. Math. Biophysics 5:115–133 (1943); 1990 reprint (Bull. Math. Biol. 52:99–115) PDF, text read via PDFKit: https://papers.baulab.info/papers/McCullochPitts-1943.pdf (also https://www.cs.cmu.edu/~./epxing/Class/10715/reading/McCulloch.and.Pitts.pdf)
2. [S2] DOI landing pages: https://www.doi.org/10.1007/BF02478259 ; reprint https://www.doi.org/10.1007/BF02459570
3. [S3] Kleene, RM-704 (RAND, 15 Dec 1951), scanned PDF: https://www.jmeiners.com/neural-nets-sim/papers/kleene.pdf ; DTIC copy https://apps.dtic.mil/sti/pdfs/ADA596138.pdf
4. [S4] RAND record: https://www.rand.org/pubs/research_memoranda/RM704.html ; *Automata Studies* contents (JSTOR): https://www.jstor.org/stable/j.ctt1bgzb3s ; JSL review listing RM-704 dates: https://www.cambridge.org/core/journals/journal-of-symbolic-logic/article/w-v-quine-a-theorem-on-parametric-boolean-functions-us-air-force-project-rand-rm196-27-071949-4-pp-w-v-quine-commutative-boolean-functions-us-air-force-project-rand-rm199-10-081949-5-pp-w-v-quine-on-functions-of-relations-with-especial-reference-to-social-welfare-us-air-force-project-rand-rm218-19-081949-15-pp-s-c-kleene-representation-of-events-in-nerve-nets-and-finite-automata-us-air-force-project-rand-rm704-15-121951-ii-98-pp/BD04E996990F937A02A94194D163ADA0
5. [S5] Siegelmann & Sontag, "Turing Computability with Neural Nets", Appl. Math. Lett. 4(6):77–80 (1991): https://people.cs.georgetown.edu/~cnewport/teaching/cosc844-spring17/pubs/nn-tm.pdf
6. [S6] Siegelmann & Sontag, "On the Computational Power of Neural Nets", COLT 1992, pp. 440–449: https://biocomputation.cs.umass.edu/papers/1992_Siegelmann_COLT.pdf ; https://mlanthology.org/colt/1992/siegelmann1992colt-computational
7. [S7] JCSS 1995 version (886 processors), per CORE record and Siegelmann & Margenstern 1999: https://core.ac.uk/display/82758236 ; https://binds.cs.umass.edu/papers/1999_Siegelmann_NeurNet.pdf
8. [S8] Siegelmann & Sontag, "Analog Computation via Neural Networks", Theor. Comput. Sci. (1994): https://binds.cs.umass.edu/papers/1994_Siegelmann_TheorCompSci.pdf
9. [S9] Maass & Orponen, "On the Effect of Analog Noise in Discrete-Time Analog Computations", Neural Computation 10(5):1071–1095 (1998): https://igi-web.tugraz.at/people/Abstracts/MaassOrponen:97j ; https://jyx.jyu.fi/handle/123456789/58969
10. [S10] Weiss, Goldberg & Yahav, "Thinking Like Transformers", ICML 2021: https://arxiv.org/abs/2106.06981
11. [S11] Lindner et al., "Tracr: Compiled Transformers as a Laboratory for Interpretability", NeurIPS 2023: https://arxiv.org/abs/2301.05062 (PDF v5 https://arxiv.org/pdf/2301.05062v5 ; code https://github.com/google-deepmind/tracr)
12. [S12] Giannou et al., "Looped Transformers as Programmable Computers", ICML 2023, PMLR 202:11398–11442: https://arxiv.org/abs/2301.13196 ; https://proceedings.mlr.press/v202/giannou23a.html ; PDF https://proceedings.mlr.press/v202/giannou23a/giannou23a.pdf
13. [S13] Lettvin, Maturana, McCulloch & Pitts, "What the Frog's Eye Tells the Frog's Brain", Proc. IRE 47(11):1940–1951 (1959): https://papers.baulab.info/papers/Lettvin-1959.pdf
14. [S14] Amanda Gefter, "The Man Who Tried to Redeem the World with Logic", Nautilus (secondary; biographical details, Lettvin recollections, EDVAC citation claim): https://nautil.us/the-man-who-tried-to-redeem-the-world-with-logic-235253/
15. [S15] Gidon et al., "Dendritic action potentials and computation in human layer 2/3 cortical neurons", Science 367(6473):83–87 (2020): https://www.science.org/doi/10.1126/science.aax6239 ; record https://zenodo.org/records/3530043 ; XOR modelling (Poirazi lab) https://dendrites.gr/?p=113 ; https://modeldb.science/260178
16. [S16] Rich Sutton, "The Bitter Lesson" (13 Mar 2019): http://www.incompleteideas.net/IncIdeas/BitterLesson.html
17. [S17] Percepta, "Can LLMs Be Computers?" (11 Mar 2026): https://www.percepta.ai/blog/can-llms-be-computers ; "Constructing an LLM-Computer" (25 Mar 2026): https://www.percepta.ai/blog/constructing-llm-computer ; code and README: https://github.com/Percepta-Core/transformer-vm
18. [S18] Conmy et al., "Towards Automated Circuit Discovery for Mechanistic Interpretability" (ACDC), NeurIPS 2023: https://arxiv.org/abs/2304.14997
19. [S19] Friedman, Wettig & Chen, "Learning Transformer Programs", NeurIPS 2023: https://arxiv.org/abs/2306.01128
20. [S20] `chenglou/handwired@257856e:README.md#L3-L36` (https://github.com/chenglou/handwired/blob/257856e/README.md)
21. [S21] `chenglou/handwired@257856e:docs/README.md#L3`, `#L15` (https://github.com/chenglou/handwired/blob/257856e/docs/README.md)
22. [S22] `chenglou/handwired@257856e:docs/execution-model.md#L23-L40` (https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md)
23. [S23] `chenglou/handwired@257856e:lab/ui-exploration/guide/sections/loops.md#L239-L241` (https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/guide/sections/loops.md)
24. [S24] `chenglou/handwired@257856e:lab/ui-exploration/guide/sections/chains.md#L216-L226` (https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/guide/sections/chains.md)
25. [S25] `chenglou/handwired@257856e:lab/status.md#L256` (https://github.com/chenglou/handwired/blob/257856e/lab/status.md)
26. [S26] `chenglou/handwired@exploration-2026-09:lab/ui-exploration/notes/outside-techniques.md#L113`, `#L175-L181` (https://github.com/chenglou/handwired/blob/exploration-2026-09/lab/ui-exploration/notes/outside-techniques.md); tag d01b763, 16 Sep 2026
27. [S27] `chenglou/handwired@257856e:lab/ui-exploration/guide/sections/indexing.md#L13`, `#L452-L453` (https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/guide/sections/indexing.md)
28. [S28] `chenglou/handwired@257856e:lab/research-sweep.md` (39 lines; no prior-work citations; Sept 2026 caveat on gradients): https://github.com/chenglou/handwired/blob/257856e/lab/research-sweep.md
29. [S29] `chenglou/handwired@257856e:lab/trace-compiler/README.md#L3` (TypeScript subset compiler, experiment): https://github.com/chenglou/handwired/blob/257856e/lab/trace-compiler/README.md
30. [S30] von Neumann, *First Draft of a Report on the EDVAC* (Moore School, 30 June 1945), M. D. Godfrey's corrected transcription (1992), §4.2 and §6: https://comp.anu.edu.au/courses/comp2310-2020/Papers/1945/von%20Neumann/The%20First%20Draft%20Report%20on.pdf ; digitized original: https://library.si.edu/digital-library/book/firstdraftofrepo00vonn
31. [S31] PubMed record and abstract, Gidon et al. 2020 (Science 2020 Jan 3;367(6473):83-87), PMID 31896716: https://pubmed.ncbi.nlm.nih.gov/31896716/ (fetched via NCBI E-utilities)
32. [S32] Rodney Brooks, "A Better Lesson" (19 Mar 2019): https://rodneybrooks.com/a-better-lesson/
33. [S33] Percepta-Core/transformer-vm repository metadata (created 2026-03-25T19:56:03Z) and README L7-9: https://github.com/Percepta-Core/transformer-vm
34. Command evidence: `git grep -niE "mcculloch|pitts|kleene|siegelmann|sontag|giannou|looped transformer|lindner|tracr" 257856e -- '*.md' '*.ts'` → no matches; the same at `exploration-2026-09` → only `outside-techniques.md:175,177`.

---

## 12. Fact-check log (adversarial pass, 2026-10-27)

Method: primary PDFs re-downloaded and text layers re-read with PDFKit (McCulloch & Pitts 1990 reprint, Kleene RM-704, Siegelmann & Sontag 1991/1992/1994, Siegelmann & Margenstern 1999, Lettvin et al. 1959, Tracr v5, Giannou et al. PMLR, ACDC, EDVAC Godfrey transcription); arXiv abstract pages and submission histories scraped; PubMed via E-utilities; Percepta repo via GitHub API; Handwired via `git grep`/`git show` on `257856e` and `exploration-2026-09` in the local clone.

**Confirmed unchanged:** McCulloch & Pitts abstract, Turing passage, five assumptions (incl. "sytem"), Theorem 7, "two-valued logic", "ghostly" quotes [S1]; Kleene RM-704 date 15 Dec 1951, ii + 98 pp., August 1951 investigations, "obscure… proceeded independently" (p. 4), "apparent counterexample" (p. 36), "close to the biological reality", "advancing amnesia", "simplest and most efficient", "unrealistic" (in the context of assuming no malfunctioning) [S3][S4]; Siegelmann & Sontag "less then 10^5" (received June 1991), "about 1,000 processors", base-4 stack, "binary representation… would not allow", "encode unbounded information", rational/real weights quote [S5][S6]; 886 processors, 96, 25 [S7]; 1994 "more powerful than Turing Machines" and non-uniform circuits [S8]; Maass & Orponen 1998 [S9]; frog's-eye quote p. 1950, four fiber types, Proc. IRE Nov 1959 [S13]; Gefter biographical quotes and dates [S14]; RASP abstract and v1 date 13 Jun 2021 [S10]; Tracr v1 12 Jan 2023, NeurIPS 2023 spotlight, quotes, author contributions, six steps [S11]; Giannou Lemma 4, punchcard, affiliations [S12]; Sutton date and quotes [S16]; Percepta README wording and blog dates [S17][S33]; ACDC/Friedman venues [S18][S19]; all Handwired quotes and line numbers (README L3, L7; docs/README; execution-model; loops L239; chains L220, L226; indexing L13, L453; trace-compiler L3; research-sweep L5) [S20]–[S29].

**Changes:**
1. Siegelmann & Sontag "real time" (Summary): corrected. 1992 says "linear time"; "real time" in the 1995 abstract is for multi-stack Turing machines [S6][S7].
2. Noise robustness: added contested note. Siegelmann & Sontag 1994 claimed "some robustness with respect to noise"; Maass & Orponen 1998 show arbitrarily small analog noise gives finite-automaton power [S8][S9].
3. Giannou "13-layer": clarified. The phrase is in the arXiv abstract only. The PMLR abstract says "constant depth". FLEQ depth is 9 + the deepest function block (Theorem 1), and the 13-layer instances are Lemmas 6–8 [S12]. Quote 15 re-attributed to the arXiv abstract.
4. EDVAC (Timeline, quotes): upgraded from secondary to primary-checked. Dated 30 June 1945; §4.2 wording quoted; the report spells the name "MacCulloch" [S30].
5. Gidon et al. date: corrected to the issue date, 3 Jan 2020 (PubMed); online release 2 Jan. Abstract added as quote 23 [S31].
6. Handwired citations (Timeline H2–H4): completed. More Percepta citation sites, Liu et al. 2023, and the main-branch links to the tagged note that names Tracr [S23]–[S25].
7. Frog's-eye "undercutting": marked as later interpretation (Gefter/Lettvin), not a claim the 1959 paper makes [S13][S14].
8. "Bitter Lesson" as the belief of the age: marked contested, with Brooks's "A Better Lesson" (19 Mar 2019) as the dissent [S32].
9. Kleene star: added that Kleene's 1951 star is binary (E*F) and that "Kleene star" is a later name [S3].
10. Lettvin electrode-paper anecdote: no source found, so demoted to UNVERIFIED (do not narrate).
11. Frog apparatus: the "verify before drawing" placeholders are replaced with dimensions checked against the paper text [S13].
12. ACDC: corrected. The poor tracr result is not evidence that compiled models differ from trained ones. With zero-patching, ACDC "perfectly recovered" the tracr circuits [S18].
13. Universal-net sizes: added Siegelmann & Margenstern 1999 (nine switch-affine, i.e. high-order, neurons). "25" is for first-order neurons [S7].
14. Tracr quote locations: "§7" replaced with "closing discussion (v5)", since the section number was not confirmed.
15. Percepta wording: sourced to the GitHub README (repo created 25 Mar 2026) [S33].

**Still unverifiable / not checked:** Copi, Elgot & Wright (1958) "obscured" wording; RASP authors' affiliations; Kleene's appearance; the duplicated clause in the 1990 reprint's Turing passage, not checked against the 1943 page image (keep the caution).
