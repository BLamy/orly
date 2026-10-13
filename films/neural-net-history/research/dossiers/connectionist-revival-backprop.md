# Dossier — The Connectionist Revival: Hopfield, Boltzmann Machines and Backpropagation (1979–1989)

Topic id: `connectionist-revival-backprop` · Film: neural-net-history · As-of: 2026-10-05
Status: draft + verification pass done (primary texts read where noted). **Adversarial fact-check completed 2026-10-05; corrections are applied in place and listed in section 12, "Fact-check log".** Items marked **[VERIFIED-PRIMARY]** were checked against the original paper or the speaker's own text; **[VERIFIED-SECONDARY]** against a reputable secondary source; **[UNVERIFIED]** must not be stated as fact or quoted without a further check.

Source numbers in square brackets, e.g. [S3], refer to section 11.

---

## 1. Summary

Between 1979 and 1989, neural networks went from a fringe subject (after the Minsky–Papert critique of 1969) back to the centre of cognitive science and engineering. Four things did it.

1. **A physicist's memory (1982).** John Hopfield, a condensed-matter physicist then at Caltech and Bell Labs, published "Neural networks and physical systems with emergent collective computational abilities" in *PNAS* (vol. 79, April 1982) [S1]. He showed that a network of simple binary "neurons" with symmetric connections has an "energy" that can only go down as units update. Stored memories sit at the bottoms of valleys in that energy landscape, so a partial or corrupted pattern rolls downhill to the full memory. This is a content-addressable memory. Because the maths was the maths of magnetic spin systems, it gave physicists a respectable way into the field. By Hopfield's own account it "was to provide an entryway to working in neuroscience for many physicists and computer scientists" [S2]. The 2024 Nobel Prize in Physics was awarded to Hopfield and Geoffrey Hinton [S3].
2. **The Boltzmann machine (1983–85).** Hinton (Carnegie Mellon) and Terry Sejnowski (Johns Hopkins), with David Ackley, added noise ("temperature") and hidden units to Hopfield-style networks. They derived a strikingly simple local learning rule: compare how often two units are on together when the world is clamped onto the network versus when it runs freely, and nudge the weight by the difference [S4]. It learned compact internal codes (for example the "4-2-4 encoder"), but it was very slow. The paper appeared in *Cognitive Science* 9 (1985), 147–169 [S4].
3. **Backpropagation popularised (1986).** David Rumelhart (UCSD), Hinton (CMU) and Ronald Williams (UCSD) published "Learning representations by back-propagating errors" in *Nature* 323, 533–536 (issue of 9 October 1986) [S5]. It showed that a gradient-descent procedure, sending error signals backwards through the network by the chain rule, makes hidden units invent useful features. Examples were symmetry detection with two hidden units and family-tree relationships in which hidden units came to encode nationality, generation and family branch [S5]. The *method* was not new: Linnainmaa (1970), Werbos (1974/1982), Parker (1985) and LeCun (1985) all had versions [S6][S7][S8][S9]. Who gets credit is still disputed, and Schmidhuber is the most vocal critic [S6]. The *Nature* paper did acknowledge two contemporaries: "Variants on the learning procedure have been discovered independently by David Parker (personal communication) and by Yann Le Cun" (ref. 3 is Le Cun, Cognitiva 85). It did not cite Linnainmaa or Werbos [S5]. Hinton himself: "I have never claimed that I invented backpropagation" [S10].
4. **A manifesto and a backlash.** The two *Parallel Distributed Processing* volumes (Rumelhart, McClelland and the PDP Research Group, MIT Press/Bradford, 1986; 1,158 pages) sold out their 6,000-copy first run before they went to press [S11]. In 1988 the journal *Cognition* published two long rebuttals, Fodor & Pylyshyn and Pinker & Prince [S12][S13]. They argued that connectionist networks lack "systematicity" and structured rules. The systematicity challenge was still being cited as unresolved in *Nature* in October 2023 [S14].

Public-facing demonstrations followed. **NETtalk** (Sejnowski & Rosenberg, 1987) learned to read English text aloud, going from babble to intelligible speech [S15]. **ALVINN** (Pomerleau, NIPS 1988 proceedings, published 1989) steered Carnegie Mellon's NAVLAB van along a wooded campus path using a 30×32-pixel camera "retina" and 29 hidden units [S16]. In 1989 Cybenko, Hornik, Stinchcombe and White, and also Funahashi, independently proved that one hidden layer is in principle enough to approximate essentially any continuous function [S17][S18][S33]. In July 1987 Hinton left Carnegie Mellon for the University of Toronto and became a fellow in CIFAR's first research programme [S20][S30].

---

## 2. Timeline

| Date | Event | Sources |
|---|---|---|
| 1960–62 | Kelley (1960), Bryson (1961) and Dreyfus (1962) develop gradient methods for multi-stage control problems. Schmidhuber calls these precursors of backprop. | [S6] |
| 1970 | Seppo Linnainmaa's master's thesis (University of Helsinki, in Finnish) describes reverse-mode automatic differentiation, the general form of backprop. The FORTRAN code is in the thesis itself (pp. 58–60, per Schmidhuber). It does not mention neural nets. Journal version: *BIT* 16(2):146–160, June 1976 (Crossref). | [S6] [S21] |
| Aug 1974 | Paul Werbos's Harvard PhD thesis "Beyond Regression: New Tools for Prediction and Analysis in the Behavioral Sciences" (advisor Karl Deutsch) applies reverse-mode derivatives ("dynamic feedback") to statistical models. Schmidhuber says its NN-specific discussion was only preliminary (sect. 5.5.1). | [S7] [S6] |
| 1979 | Hinton and James Anderson organise a meeting of the few people still working on neural nets. [Location "UCSD, La Jolla": UNVERIFIED. Gibbons [S11] gives the year and organisers but no venue; check the preface of *Parallel Models of Associative Memory*.] It is published as *Parallel Models of Associative Memory* (1981). | [S11] |
| Late 1981 | Rumelhart, McClelland and Hinton decide to write a book together on neural network models. It becomes the PDP volumes. | [S11] |
| Summer 1981 | Hopfield first presents his network in a talk at a "From Physics to Biology" symposium held in the Hall of Mirrors at Versailles. In his words: "I have never met anyone who remembered hearing the talk." | [S2] |
| First half of 1982 | Rumelhart, McClelland and Hinton are together at UCSD doing the foundational work on the PDP book. | [S11] |
| April 1982 | Hopfield, *PNAS* 79(8):2554–2558, "Neural networks and physical systems with emergent collective computational abilities". | [S1] |
| 1982 | Werbos, "Applications of advances in nonlinear sensitivity analysis" (Springer, *System Modeling and Optimization*). Schmidhuber dates the first NN-specific application of efficient backprop to this paper. | [S6] [S22] |
| Spring 1982 | Rumelhart independently re-derives backprop as a "generalized delta rule". | [S22] [S10] |
| Oct 1982 | Hinton joins Carnegie Mellon's computer science faculty as assistant professor, later associate professor. **[VERIFIED-PRIMARY: Hinton's own CV gives "Oct 82 – June 87".]** | [S30] |
| Feb/Mar 1983 | Hinton's CMU seminar on simulated annealing in Hopfield nets. The Boltzmann learning rule is worked out in 1983 (Hinton's oral history). | [S22] |
| 1983 | Hinton & Sejnowski, "Optimal perceptual inference" (IEEE CVPR, Washington DC, June 1983, pp. 448–453). It is one of the earliest Boltzmann machine papers. Do **not** call it "the first": the [S4] reference list also gives Hinton & Sejnowski, "Analyzing cooperative computation" (Cognitive Science Society, Rochester, May 1983), and Fahlman, Hinton & Sejnowski, "Massively parallel architectures for AI: NETL, Thistle, and Boltzmann Machines" (AAAI, Aug 1983). | [S4] (reference list) |
| 1983 | CIFAR founds its first research programme, Artificial Intelligence, Robotics & Society. | [S20] |
| Jan 1985 | Ackley, Hinton & Sejnowski, "A Learning Algorithm for Boltzmann Machines", *Cognitive Science* 9(1):147–169. | [S4] [S24] |
| 1985 | David Parker, "Learning-Logic", MIT tech report TR-47. Yann LeCun, "Une procédure d'apprentissage pour réseau à seuil asymétrique", Proceedings of Cognitiva 85, Paris, pp. 599–604. | [S8] [S9] |
| 1985 | Rumelhart, Hinton & Williams write up backprop: the ICS technical report (UCSD) and the *Nature* submission. Rumelhart: "The paper was really written in the spring of '85." (oral history, secondary transcription) | [S22] |
| 1 May 1986 | *Nature* receives the RHW manuscript; it is accepted 31 July 1986. | [S5] |
| July 1986 | *Parallel Distributed Processing*, Vols 1–2, MIT Press. MIT Press lists Vol. 1 hardcover as 17 July 1986. | [S11] [S25] |
| 9 Oct 1986 | RHW, "Learning representations by back-propagating errors", *Nature* 323:533–536. | [S5] |
| 1986 | Sloan Foundation sponsors a connectionist summer school "to seed the world with connectionists". The share of connectionist talks at the Cognitive Science Society meeting rises from 17% (1984) to 23% (1985) to 31% (1986). | [S11] |
| 1987 | Sejnowski & Rosenberg, "Parallel Networks that Learn to Pronounce English Text" (NETtalk), *Complex Systems* 1:145–168. | [S15] |
| Jul 1987 | Hinton moves to the University of Toronto as a professor of computer science (CV: "Jul 87") and a Fellow in CIFAR's Artificial Intelligence, Robotics & Society programme. | [S20] [S30] |
| 1988 (Cognition 28, issue 1–2) | Fodor & Pylyshyn, "Connectionism and cognitive architecture: A critical analysis", pp. 3–71. Pinker & Prince, "On language and connectionism", pp. 73–193. | [S12] [S13] [S24] |
| 1988 | Minsky & Papert publish the expanded edition of *Perceptrons*, with an epilogue sceptical of gradient descent. | [S22] |
| Nov–Dec 1988 (NIPS 1, publ. 1989) | Pomerleau, "ALVINN: An Autonomous Land Vehicle in a Neural Network". | [S16] |
| 1989 | Hornik, Stinchcombe & White, "Multilayer feedforward networks are universal approximators", *Neural Networks* 2(5):359–366. Cybenko, "Approximation by superpositions of a sigmoidal function", *Math. Control Signals Systems* 2(4):303–314 (Dec 1989). Funahashi, "On the approximate realization of continuous mappings by neural networks", *Neural Networks* 2(3):183–192 (1989), was a third independent proof. | [S17] [S18] [S24] [S33] |
| (Epilogue) 23–31 Jul 1995 | No Hands Across America: CMU's Navlab 5 steers 2,797 of 2,849 miles (98.2%) of a Pittsburgh→San Diego drive. **The steering system was RALPH, not ALVINN.** (The CMU press release [S26] predates the trip and does not name RALPH; RALPH and the 98.2% figure come from [S32]. **Primary added in fact-check:** CMU's own No Hands Across America home page reads "TRIP COMPLETE !!! 2797/2849 miles (98.2%)" and says the researchers "'drove' from Pittsburgh, PA to San Diego, CA using the RALPH computer program" [S36].) | [S26] [S32] [S36] |
| (Epilogue) Apr 2020 | Schmidhuber publishes a critique of Hinton's Honda Prize. Hinton replies on Reddit: "I have never claimed that I invented backpropagation." | [S10] |
| (Epilogue) 25 Oct 2023 (online; print *Nature* 623:115–121, 2 Nov 2023) | Lake & Baroni (*Nature*) state that "the systematicity challenge persists" and claim to address it with meta-learning. | [S14] |
| (Epilogue) 8 Oct 2024 | Nobel Prize in Physics to Hopfield and Hinton "for foundational discoveries and inventions that enable machine learning with artificial neural networks". | [S3] |

---

## 3. People

Physical descriptions are for **respectful silhouette depiction only**. Wherever a feature is not confirmed, the art department should check period photographs (1980s conference and university portraits) before committing to it. Do not caricature anyone.

**John J. Hopfield** (b. 1933, Chicago; PhD Cornell 1958 [S3])
- *Role:* theoretical physicist who worked on solid-state physics, then biophysics (kinetic proofreading, electron transfer). He moved from Princeton to Caltech in **February 1980**, to a professorship held jointly in Chemistry and Biology, and kept a part-time affiliation with Bell Labs "all during this epoch" [S2]. Today he is at Princeton [S3].
- *Belief:* computation in brains could be understood as "collective" behaviour of many simple units, settling to attractors. In his words, the mathematics of reciprocal networks "is closely related to the mathematics of 'spin' systems that are responsible for all the complex forms of magnetism in solids" [S2].
- *Setting:* he worked out the model on Caltech's quantum-chemistry computing facility ("multi-user real-time computing, with CRT displays and direct keyboard input") [S2].
- *Silhouette notes:* tall, slender, older academic (aged about 48–49 in 1982). Jacket and open collar or tie, the style of an early-1980s Caltech professor. [Glasses and hair: UNVERIFIED, check photos.]

**Geoffrey E. Hinton** (b. 1947, London; PhD Edinburgh 1978 [S3])
- *Role:* positions per his own CV [S30], VERIFIED-PRIMARY:
  - Research Fellow, Sussex, Jan 1976 – Sept 1978.
  - Visiting Scholar, Program in Cognitive Science, UCSD, Oct 1978 – Sept 1980.
  - Scientific Officer, MRC Applied Psychology Unit, Cambridge, Oct 1980 – Sept 1982.
  - Visiting Assistant Professor, Psychology, UCSD, Jan – June 1982. This is the overlap with Rumelhart and McClelland when the PDP book was started.
  - Carnegie-Mellon Computer Science, Oct 1982 – June 1987.
  - University of Toronto from Jul 1987, and CIFAR Fellow from 1987 [S20]. Co-inventor of the Boltzmann machine; co-author of the 1986 *Nature* paper.
- *Belief at the time:* he preferred the Boltzmann machine's probabilistic elegance to backprop. He called the Boltzmann learning rule "the nicest piece of theory I'll ever do" (oral history, secondary transcription [S22]). At first he dismissed backprop, arguing to Rumelhart that "it wouldn't work" because of symmetry-breaking and local minima [S22].
- *Politics:* he left the US partly because most American AI funding came from the Department of Defense and partly from disillusionment with Reagan-era politics [S19][S23]. The ACM Turing Award biography specifically cites his opposition to the "Star Wars" missile-defence initiative (as reported by search of amturing.acm.org; the page itself returned 403). [The "Central America" detail is UNVERIFIED in this pass; do not state it without a source such as Metz, *Genius Makers*.] Note the irony: the 1986 *Nature* paper thanks the Office of Naval Research for funding [S5].
- *Silhouette notes:* tall and lean, late 30s in 1986. [1980s hairstyle: UNVERIFIED, check photos.] In later life he is well known for standing rather than sitting because of a back condition. [That this applied in the 1980s is UNVERIFIED; do not show it in 1980s scenes without a source.]

**David E. Rumelhart** (1942–2011)
- *Role:* mathematical psychologist (Stanford PhD 1967) at UCSD from 1967; he worked closely with Donald Norman [S27]. [That he "co-directed the Institute for Cognitive Science" is UNVERIFIED in this pass.] He returned to Stanford in 1987 [S27]. Gibbons, citing McClelland, calls him the "senior, driving force" behind the PDP volumes [S11]. He re-derived backprop in 1982 as a "generalized delta rule" [S22]. MacArthur Fellow in 1987 (the award is in [S27]; the year is from secondary listings). He died on 13 March 2011, aged 68. APS and Stanford say only "complications of a progressive neurodegenerative disease" [S27]. The New York Times obituary names **Pick's disease**, citing his son Karl [S31].
- *Belief:* cognition emerges from the "microstructure" of many interacting units. Rules are approximate descriptions, not the mechanism (as summarised by Pinker & Prince [S13]).
- *Silhouette notes:* bearded, mid-40s in 1986. [Glasses and build: UNVERIFIED, check the APS Observer obituary photo [S27].]

**Ronald J. Williams**
- *Role:* third author of the 1986 *Nature* paper, then at the Institute for Cognitive Science, UCSD [S5]. Later at Northeastern University. Known for REINFORCE (1992) and, with Zipser, real-time recurrent learning (1989).
- *Silhouette notes:* UNVERIFIED. Use a generic 1980s academic figure.

**Terrence J. Sejnowski**
- *Role:* biophysicist at Johns Hopkins (Baltimore) [S4][S15]. Co-inventor of the Boltzmann machine. Built NETtalk with Charles Rosenberg (Princeton) [S15]. He was **Hopfield's PhD student** (Princeton physics, 1978), a link between the two strands of this chapter [S34]. He moved to the Salk Institute in La Jolla in **1988** per Salk/EurekAlert releases [S34]. His own Brain Prize biography says 1989, so the date is CONTESTED; "late 1980s" is safe.
- *Belief:* he was an early adopter of backprop. "I discovered very rapidly that backprop was about an order of magnitude faster than anything you could do with the Boltzmann machine" (oral history, secondary transcription [S22]).
- *Silhouette notes:* about 39 in 1986. [Hair and build UNVERIFIED.]

**David H. Ackley.** CMU graduate student and first author of the Boltzmann machine paper [S4].

**James L. McClelland.** Psychologist and co-editor of the PDP volumes. Co-author with Rumelhart of the past-tense model [S11][S13].

**Paul J. Werbos** (b. 1947). Harvard PhD 1974. His backprop came out of an attempt, in his own retelling, to translate Freud's "psychic energy" into mathematics (Talking Nets interview, secondary transcription [S22]). He received the IEEE Neural Network Pioneer Award in 1995 [S7].

**Seppo Linnainmaa** (Finland). He described reverse-mode AD in his 1970 Helsinki master's thesis, written in Finnish [S6][S21].

**David B. Parker** (MIT). Wrote the "Learning-Logic" tech report, TR-47, in 1985 [S8].

**Yann LeCun** (Paris). Published an asymmetric-threshold-network learning procedure at Cognitiva 85 [S9]. He later used backprop for handwritten digits (Bell Labs, 1989; outside this topic's scope).

**Jürgen Schmidhuber** (IDSIA, Switzerland). Historian-critic of credit assignment in deep learning [S6][S10].

**Jerry Fodor and Zenon Pylyshyn** [S12]. Classical "language of thought" theorists. **Affiliations in 1988 (corrected in fact-check):** Fodor was at the CUNY Graduate Center (1986–88) and moved to Rutgers in 1988; Pylyshyn was at the University of Western Ontario (1964–94) and only moved to Rutgers in 1994 [S37]. The "Rutgers Center for Cognitive Science" header on the [S12] preprint is a later re-typesetting, not the 1988 affiliation. Pylyshyn then held a Senior Fellowship from CIFAR (VERIFIED-PRIMARY: the paper's footnote 1 thanks "a Senior Fellowship from the Canadian Institute for Advanced Research to ZWP" [S12]), the same institute that took Hinton on as a Fellow in 1987. [Lead only, VERIFIED-SECONDARY: Wikipedia, citing the Rutgers Center for Cognitive Science, says Pylyshyn directed CIFAR's Artificial Intelligence and Robotics programme from 1985 to 1994, i.e. the programme Hinton joined. Confirm with a CIFAR or Rutgers primary source before the script uses it [S37].]

**Steven Pinker** (MIT) **and Alan Prince** (Brandeis). Wrote the 1988 critique of the past-tense model [S13].

**Charles R. Rosenberg** (Princeton Cognitive Science Laboratory). Co-author of NETtalk [S15].

**Dean A. Pomerleau** (CMU graduate student). Built ALVINN [S16].

**George Cybenko**; **Kurt Hornik, Maxwell Stinchcombe, Halbert White.** Authors of the universal approximation theorems [S17][S18]. White was an econometrician at UC San Diego.

---

## 4. The belief of the age

**What most of AI believed going in (around 1979–82).** After *Perceptrons* (1969), mainstream AI assumed that intelligence was symbol manipulation (expert systems were booming) and that single-layer learning machines were provably limited. The general view was that multi-layer nets could not be trained. Minsky and others believed gradient methods would get stuck in local minima. Minsky, recalled by Werbos (Talking Nets, secondary): "everybody knows a neuron is a 1-0 spike generator". Discrete threshold units have no usable derivative, which blocked gradient thinking [S22].
- *Held by:* Minsky, Papert and most of the symbolic AI establishment. The view continued in Minsky & Papert's 1988 epilogue [S22].
- *Dissenters:* a scattered group. These included Hinton and Anderson (1979 meeting), Grossberg, Kohonen, Amari, Fukushima, Widrow, and Werbos (isolated) [S11][S22].

**The new belief (1982–1988).** "Connectionism": knowledge lives in connection strengths, and computation is parallel settling and learning. Walter Schneider, in his 1987 Psychonomic Society presidential address, called the interest "explosive" and *probably* "the most dramatic shift in theoretical orientation in psychology in the last 20 years". The hedge "probably" is Schneider's and must be kept. In 1988 Smolensky wrote that Cognitive Science Society meetings "have begun to look like connectionist pep rallies" (both as quoted in Gibbons 2019 [S11]).
- *Held by:* the PDP group (Rumelhart, McClelland, Hinton, Smolensky, Williams and others), Sejnowski, the physics-of-networks community that followed Hopfield, and engineers.

**Beliefs inside the revival that did not last.**
- That the Boltzmann machine's local rule was "how the brain works". Hinton: "It felt like we'd solved the problem. That must be how the brain works." It turned out to be impractically slow and noisy (oral history, secondary transcription [S22]).
- That backprop would mostly get stuck. The 1986 paper itself reports that "the network very rarely gets stuck in poor local minima that are significantly worse than the global minimum" [S5].
- RHW were explicit that backprop "in its current form, is not a plausible model of learning in brains" [S5]. That question is still open as of 2026.

**The dissent (1988 onward).** Fodor & Pylyshyn argued that connectionism is at best an implementation theory for a classical symbolic architecture [S12]. Pinker & Prince argued that the past-tense model fails empirically and that rules are real [S13].

**How long the belief lasted and what ended it.** The engineering optimism peaked in the late 1980s. In the early-to-mid 1990s it lost ground to statistical methods (SVMs and kernel methods; see the `classical-ml-era` dossier) because deep nets were hard to train and data and compute were scarce. The cognitive-science debate never ended. The systematicity challenge was described as persisting 35 years later, in 2023 [S14], and large language models revived it. *Do not state that the debate was "settled".*

---

## 5. Experiments and results

### 5.1 Hopfield network (1982) [S1][S2]
- **Units:** N binary "neurons" (on/off). Connections T_ij are symmetric (T_ij = T_ji) and set by a Hebbian sum over the stored patterns. Updates are asynchronous: each unit fires at random times and flips to whichever state lowers the energy E = −½ Σ T_ij V_i V_j. Because E can only decrease, the network flows to a stable state, a memory [S1][S3].
- **What it showed:** a content-addressable memory "which correctly yields an entire memory from any subpart of sufficient size", together with "generalization, familiarity recognition, categorization, error correction, and time sequence retention", and robustness to the failure of individual devices (abstract [S1]).
- **Capacity:** "About 0.15 N states can be simultaneously remembered before error in recall is severe", from simulations with N = 30 and N = 100. [VERIFIED-SECONDARY via citations of the paper; check the PNAS PDF for exact wording before on-screen use.] Later theory gives about 0.138 N (Amit, Gutfreund & Sompolinsky 1985).
- **Machine:** simulated on Caltech's quantum-chemistry computing facility with CRT terminals [S2].
- **Publication quirk:** as a National Academy member, Hopfield could publish in *PNAS* without review. *PNAS* had a hard 5-page limit, and Hopfield felt that what he left out invited others to build on the work [S2]. It was also the first paper in which he used the word "neuron" [S2].
- **Visual metaphor (accurate):** an energy landscape. A ball (the network state) rolls into the nearest valley (the stored memory). The Nobel committee describes stored images as given "low energy" [S3].

### 5.2 Boltzmann machine (1983–85) [S4]
- **Units:** stochastic binary units that turn on with probability 1/(1+e^(−ΔE/T)). T is a "temperature". At thermal equilibrium the probability of a global state follows the Boltzmann distribution [S4].
- **Simulated annealing:** start hot and cool gradually (after Kirkpatrick, Gelatt & Vecchi 1983) to escape local minima [S4].
- **Learning rule:** two phases.
  - *Clamped:* the environment's patterns are fixed on the visible units. Measure p⁺_ij, how often units i and j are both on at equilibrium.
  - *Free-running:* nothing is clamped. Measure p⁻_ij.
  - Change each weight in proportion to (p⁺_ij − p⁻_ij).
  - The rule is purely local and minimises an information-theoretic distance G between the environment's distribution and the network's own [S4].
- **The encoder problem:** two visible groups V1 and V2 of v units each, linked only through h < v hidden units. The network must invent a binary code [S4].
  - 4-2-4 encoder: "In 250 different tests of the 4-2-4 encoder, it always found one of the global minima… The median time required to discover four different codes was 110 learning cycles. The longest time was 1810 learning cycles." [VERIFIED-PRIMARY, OCR text]
  - 8-3-8 encoder: 20 simulations of 4,000 learning cycles each. All 8 codes were found in 16 of 20 runs [S4].
  - A 40-10-40 encoder was also tried [S4].
  - Annealing schedule example: 2 time units at T = 20, 2 at 15, 2 at 12, 4 at 10 [S4].
- **Slowness, in the authors' own words:** "Because of the severe speed limitation of simulation on a sequential machine, and because the learning requires many annealings, we have primarily experimented with small versions of the encoder problem" (paper [S4], VERIFIED-PRIMARY). **Context (corrected in fact-check):** in the 1985 paper this sentence explains why the authors stuck to *small encoder problems*. It is not their verdict on why the Boltzmann machine later faded, so do not present it as one. Hinton later blamed noise: the rule takes "the difference between two noisy variables" (oral history, secondary [S22]).
- **Funding acknowledgment:** System Development Foundation. Thanked: Francis Crick, John Hopfield, Rumelhart, McClelland, Smolensky and others [S4].

### 5.3 Backpropagation, Rumelhart, Hinton & Williams (Nature, 1986) [S5]

**Mechanics, step by step (for animation; equations follow the paper's notation)**
1. **Forward pass.** Each unit j sums its weighted inputs, x_j = Σ_i y_i w_ji (eq. 1). A bias is an extra input fixed at 1. The unit outputs a smooth squashing function, y_j = 1/(1+e^(−x_j)) (eq. 2). Layers are computed bottom-up; units within a layer are computed in parallel [S5].
2. **Error.** E = ½ Σ_cases Σ_outputs (y_j − d_j)², where d is the desired output (eq. 3).
3. **Backward pass (chain rule).**
   - At each output unit: ∂E/∂y_j = y_j − d_j.
   - Through the sigmoid: ∂E/∂x_j = ∂E/∂y_j · y_j(1 − y_j).
   - Each incoming weight: ∂E/∂w_ji = ∂E/∂x_j · y_i.
   - To the layer below: ∂E/∂y_i = Σ_j ∂E/∂x_j · w_ji. In other words, the "blame" sent back to a hidden unit is the weighted sum of the blame of the units it feeds.
   - Repeat layer by layer down to the inputs.
   - This is **credit assignment**: deciding how much each hidden weight contributed to the error.
4. **Update.** Δw = −ε ∂E/∂w. With momentum: Δw(t) = −ε ∂E/∂w(t) + α Δw(t−1).
   - [The equation numbers and the momentum form are standard and match the paper's ε and α. The OCR scan confirms the ε and α values quoted below; the exact equation layout should be checked against the scan before on-screen typesetting.]
5. **Key requirement:** smooth, differentiable units. The sharp 0/1 thresholds of perceptrons give no gradient [S22].
6. **Breaking symmetry:** start from small random weights. If all weights are equal, the hidden units stay identical. This was Hinton's first objection, per his oral history [S22].
7. **Hidden representations:** the point of the paper is that hidden units, "which are not part of the input or output come to represent important features of the task domain" [S5].

**Experiments in the paper [S5] (VERIFIED-PRIMARY via OCR of the Nature scan)**
- **Mirror-symmetry detection.**
  - Setup: 6 binary inputs, 2 hidden units, 1 output. The training set is all 64 input vectors.
  - Training: "The learning required 1,425 sweeps through the set of 64 possible input vectors", with ε = 0.1, α = 0.9 and initial weights uniform in [−0.3, 0.3].
  - Solution: each hidden unit's weights are mirror-image equal-and-opposite (the figure labels show values such as ±14.2, ±7.2 and ±3.6). Symmetric inputs leave both hidden units off, so the output, which has a positive bias, turns on.
- **Family trees.**
  - Data: two isomorphic families, one English and one Italian, with 12 people each and 12 relationships (father, mother, husband, wife, son, daughter, uncle, aunt, brother, sister, nephew, niece). This gives 104 (person1, relationship, person2) triples, of which 100 were used for training.
  - Network: 24 person-input units feed a 6-unit encoding layer.
  - Training: 1,500 sweeps, with weight decay of 0.2% per update.
  - Generalisation: "the network generalizes correctly to the four triples on which it was not trained."
  - Learned features: hidden unit 1 encodes English vs Italian, unit 2 the generation, unit 6 the branch of the family. None of these features was given in the input encoding.
- **Recurrent networks:** an iterated recurrent net is equivalent to a layered net with shared weights (Fig. 5). This is the seed of backprop through time.
- **Caveat in the paper:** "The learning procedure, in its current form, is not a plausible model of learning in brains."
- **Funding:** System Development Foundation and the Office of Naval Research.
- **Typo (curiosity):** the CMU address is printed as "Pittsburgh, Philadelphia 15213".

### 5.4 Hinton's first backprop run (anecdote; oral history via secondary transcription [S22])
- None of about ten students would program backprop, because they were committed to Boltzmann machines. Hinton "spent a weekend. I wrote a LISP program to do it."
- He tried it first on an 8-3-8 encoder. The hidden units did not show the neat binary code he expected: "Then I looked at the error, and the error was zero. I was amazed."
- *Treat these as quotations from Rosenfeld & Anderson, Talking Nets (MIT Press, 2000), ch. 16, transcribed by a secondary source. Verify against the book before on-screen use.*

### 5.5 NETtalk (Sejnowski & Rosenberg, 1987) [S15] (VERIFIED-PRIMARY)
- **Task:** convert English letters to phonemes and stress, then play them through **DECtalk**, a commercial speech synthesiser, to hear the result.
- **Architecture:**
  - Input: a 7-letter sliding window. 7 groups × 29 units (26 letters, comma, period, word boundary) = **203 input units**.
  - Hidden: **80** units.
  - Output: **26** units (articulatory features plus stress and syllable boundaries).
  - **18,629 weights** including thresholds.
- **Machine:** a simulator written in C. "A network of 10,000 weights had a throughput during learning of about 2 letters/sec on a VAX 11/780 FPA." **Caution:** this speed is for a *10,000-weight* network during *learning*. It is not the speed of the standard 18,629-weight NETtalk, so do not say "NETtalk ran at 2 letters per second".
- **Corpus 1:** "the first two pages of transcriptions, which contained 1024 words from a child in first grade". Phoneme accuracy reached 95% after 50 passes.
- **Learning stages:** "the network predicted the same vowel for all vowels and the same consonant for all consonants, which resulted in a babbling sound". Next, word boundaries were recognised and the output "resembled pseudowords". Finally, "by 10 passes the text was understandable."
- **Corpus 2:** a 20,012-word dictionary, training on the 1,000 most common words (frequencies from the Brown corpus). With 120 hidden units it reached 98% on the 1,000 words. With no further training, that network scored 77% on the full 20,012-word dictionary. This rose to 85% after one training pass through the dictionary and 90% after five passes. A network with two hidden layers of 80 units each generalised at 80% without extra training.
- **Damage:** performance degraded gracefully when weights were damaged, and relearning after damage was faster than the original learning (abstract).
- **Public impact:** appeared on NBC's *Today* show (Sejnowski, *The Deep Learning Revolution*, 2018, p. 115, via [S28]). [Date of broadcast UNVERIFIED.]
- **Overfitting fears:** "There were 18,629 weights in the network, a large number by the standards of 1986… we were told that we would overfit the training set" (Sejnowski 2018, p. 113, via [S22]; secondary transcription).

### 5.6 ALVINN (Pomerleau, NIPS 1988 proceedings, published 1989) [S16] (VERIFIED-PRIMARY)
- **Architecture:** a 3-layer backprop network.
  - Inputs:
    - a **30×32 video "retina"** using only the **blue** colour band, because it "provides the highest contrast between the road and the non-road";
    - an **8×32 laser range-finder retina**;
    - one road-intensity feedback unit.
  - That makes **1,217 inputs**, feeding **29 hidden units** and then **46 outputs**: 45 steering-direction units plus 1 road-intensity unit.
- **Training:** on **1,200 simulated road images**. After 40 epochs it was within two units of the correct curvature about 90% of the time on novel simulated images. Training used the **Warp** backprop simulator.
- **Vehicle:** the **NAVLAB**, "a modified Chevy van equipped with 3 Sun computers, a Warp, a video camera, and a laser range finder".
- **Road test:** it drove "at a speed of 1/2 meter per second along a 400 meter path through a wooded area of the CMU campus under sunny fall conditions". The network was run on an on-board Sun.
- **Later:** ALVINN-based systems reached highway speeds in the early 1990s (secondary; check Pomerleau's 1992 thesis or 1993 book for exact figures). The 1995 cross-country trip used **RALPH**, a different system [S26].

### 5.7 Universal approximation (1989)
- **Cybenko:** a finite sum of sigmoids of affine functions can "uniformly approximate any continuous function of n real variables with support in the unit hypercube". "Arbitrary decision regions can be arbitrarily well approximated by continuous feedforward neural networks with only a single internal, hidden layer and any continuous sigmoidal nonlinearity" [S17].
- **Hornik, Stinchcombe & White:** networks "with as few as one hidden layer using arbitrary squashing functions are capable of approximating any Borel measurable function from one finite dimensional space to another to any desired degree of accuracy, provided sufficiently many hidden units are available" [S18] (abstract, VERIFIED-SECONDARY via search of the publisher abstract).
- **Funahashi (1989)**, *Neural Networks* 2(3):183–192, was a third, independent proof in the same year [S33]. Do not present Cybenko and Hornik et al. as the only provers.
- **Caveat for the script:** these are *existence* theorems. They say nothing about how many units are needed, whether gradient descent will find the weights, or whether the network will generalise.

### 5.8 Past-tense model (Rumelhart & McClelland, PDP vol. 2, ch. 18) [S13]
- **Representation:** stems and past tenses are encoded as "Wickelfeatures", trigrams of phonetic features.
- **Network:** a single layer of modifiable connections, with no hidden layer. It was trained with a perceptron/delta-style rule.
- **Training regime:** first 10 high-frequency verbs (2 of them regular), 10 times each; then 410 more verbs (334 regular), with the 420-verb set presented 190 times. These figures are VERIFIED in the Pinker & Prince text [S13]. Tests followed on 86 low-frequency verbs. [The "86" was not found in the P&P text fetched in this pass: UNVERIFIED; check PDP vol. 2, ch. 18.]
- **Claimed result:** a U-shaped learning curve, including over-regularisation errors such as "goed".

---

## 6. Verified quotes

**Q1. Hopfield (1982), PNAS abstract, opening sentence** [S1] (Europe PMC record)
> "Computational properties of use to biological organisms or to the construction of computers can emerge as collective properties of systems having a large number of simple equivalent components (or neurons)."

*Note:* the Europe PMC metadata reads "of use **of** biological organisms", and so does the NCBI PMC XML abstract (PMC346238, re-checked in the fact-check). The printed paper is widely quoted as "of use **to**". The PNAS PDF could not be retrieved in either pass, so the opening words are **UNVERIFIED — do not use as a quote** until checked against the page scan. Safe option: quote from "can emerge as collective properties…" onward.

**Q2. Hopfield (1982), PNAS abstract** [S1]
> "The collective properties of this model produce a content-addressable memory which correctly yields an entire memory from any subpart of sufficient size."

**Q3. Hopfield, autobiographical essay "Now What?"** (Princeton Neuroscience Institute PDF, CC-BY) [S2]
> "Suddenly there was a connection between neurobiology and physics systems I understood (thanks to a lifetime of interaction with P.W. Anderson). A month later I was writing a paper."

*Context:* describing the moment, in about 1981, when associative memory with reciprocal connections mapped onto spin-system mathematics.

**Q4. Hopfield, "Now What?"** [S2]
> "This 1982 PNAS paper is the first publication in which I use the word 'neuron'. It was to provide an entryway to working in neuroscience for many physicists and computer scientists."

**Q5. Hopfield, "Now What?"** [S2]
> "I have never met anyone who remembered hearing the talk."

*Context:* his first public talk on the network, at Versailles in summer 1981.

**Q6. Rumelhart, Hinton & Williams (1986), Nature abstract** [S5] (VERIFIED-PRIMARY from the nature.com metadata)
> "We describe a new learning procedure, back-propagation, for networks of neurone-like units. The procedure repeatedly adjusts the weights of the connections in the network so as to minimize a measure of the difference between the actual output vector of the net and the desired output vector. As a result of the weight adjustments, internal 'hidden' units which are not part of the input or output come to represent important features of the task domain, and the regularities in the task are captured by the interactions of these units."

*Note the British spelling "neurone" in Nature.* Also note that "new" in "a new learning procedure" is itself the crux of the priority dispute.

**Q7. RHW (1986), closing paragraph** [S5]
> "The learning procedure, in its current form, is not a plausible model of learning in brains. However, applying the procedure to various tasks shows that interesting internal representations can be constructed by gradient descent in weight-space, and this suggests that it is worth looking for more biologically plausible ways of doing gradient descent in neural networks."

**Q8. RHW (1986)** [S5]
> "Because the hidden features capture the underlying structure of the task domain, the network generalizes correctly to the four triples on which it was not trained."

**Q9. Ackley, Hinton & Sejnowski (1985)** [S4]
> "We describe a general parallel search method, based on statistical mechanics, and we show how it leads to a general learning rule for modifying the connection strengths so as to incorporate knowledge about a task domain in an efficient way."

**Q10. Hinton, Reddit reply to Schmidhuber, April 2020** [S10] (as reproduced by Synced, 23 Apr 2020)
> "I have never claimed that I invented backpropagation. David Rumelhart invented it independently long after people in other fields had invented it. It is true that when we first published we did not know the history so there were previous inventors that we failed to cite. What I have claimed is that I was the person to clearly demonstrate that backpropagation could learn interesting internal representations and that this is what made it popular."

and
> "I've seen things in the press that say that I invented backpropagation, and that is completely wrong. It's one of these rare cases where an academic feels he has got too much credit for something!"

*Primary is the r/MachineLearning comment, which could not be fetched. Synced is a reputable trade outlet quoting it. Try to link the Reddit original before broadcast.*

**Q11. Schmidhuber, "Who invented backpropagation?" (IDSIA web page)** [S6]
> "This experimental analysis of backpropagation did not cite the origin of the method"

*Context:* about RHW 1985/86. Schmidhuber characterises RHW as "an experimental analysis of the known method".

**Q12. Schmidhuber, 2015 blog, as quoted by Synced** [S10]
> "The inventor of an important method should get credit for inventing it. She may not always be the one who popularizes it. Then the popularizer should get credit for popularizing it (but not for inventing it)"

**Q13. Fodor & Pylyshyn (1988)** [S12] (Rutgers preprint text; the Cognition typesetting may differ trivially). Fact-check: the exact sentence was located in the Rutgers preprint, in the phrase-book passage of the systematicity section.
> "You don't, for example, find native speakers who know how to say in English that John loves the girl but don't know how to say in English that the girl loves John."

**Q14. Fodor & Pylyshyn (1988), abstract** [S12]
> "We claim that such arguments make a powerful case that mind/brain architecture is not Connectionist at the cognitive level."

**Q15. Pinker & Prince (1988), "On language and connectionism: Analysis of a parallel distributed processing model of language acquisition", abstract** [S13]
> "Does knowledge of language consist of mentally-represented rules?"

and
> "We conclude that connectionists' claims about the dispensability of rules in explanations in the psychology of language must be rejected"

**Q16. Lake & Baroni (2023), Nature abstract** [S14] (published online 25 Oct 2023; *Nature* 623:115–121). The next sentence of the abstract is "Here we successfully address Fodor and Pylyshyn's challenge…". Do not quote "persists" without saying that the authors claim to have answered it.
> "Fodor and Pylyshyn famously argued that artificial neural networks lack this capacity and are therefore not viable models of the mind. Neural networks have advanced considerably in the years since, yet the systematicity challenge persists."

**Q17. Sejnowski & Rosenberg (1987)** [S15]
> "the network predicted the same vowel for all vowels and the same consonant for all consonants, which resulted in a babbling sound."

**Q18. Pomerleau (1989)** [S16]
> "the network can accurately drive the NAVLAB at a speed of 1/2 meter per second along a 400 meter path through a wooded area of the CMU campus under sunny fall conditions."

**Q19. Nobel citation, 8 Oct 2024** [S3]
> "for foundational discoveries and inventions that enable machine learning with artificial neural networks"

**Oral-history quotes: VERIFIED-SECONDARY only.** These come from Rosenfeld & Anderson, *Talking Nets* (2000), as transcribed in Liu's essay [S22]. They may be used **only after checking against the book**.
- Hinton on Rumelhart's 1982 idea: "I first of all explained to him why it wouldn't work, based on an argument in Rosenblatt's book…"
- Hinton: "Then I looked at the error, and the error was zero. I was amazed."
- Hinton on the Boltzmann rule: "I still think that's the nicest piece of theory I'll ever do."
- Rumelhart: "I had no idea that Paul Werbos had done work on it… I consider them independent discoveries, at least three and maybe more."
- Sejnowski: "backprop was about an order of magnitude faster than anything you could do with the Boltzmann machine."
- Minsky to Werbos (as recalled by Werbos): "Look, everybody knows a neuron is a 1-0 spike generator." *This is doubly indirect: Werbos recalling Minsky, transcribed by a secondary source. If used at all, attribute it as Werbos's recollection.*

**UNVERIFIED — do not use as quotes**
- Any wording of the form "Hinton: 'I don't think it's how the brain works'" from 1986, unless sourced.
- "Backprop is just the chain rule." This is a common paraphrase with no specific speaker. Schmidhuber explicitly argues backprop is the *efficient* application of the chain rule, not merely the chain rule [S6].
- The Hinton line that he "last sat down in 2005" (back condition). Not traced to a primary source in this pass.

---

## 7. Debates and controversies

### 7.1 Who invented backpropagation? (CONTESTED)

**Case for early inventors (Schmidhuber, Werbos supporters)**
- Linnainmaa 1970 is the first published description of modern reverse-mode AD, which is backprop for arbitrary sparse computational graphs. It includes FORTRAN code and is the method every modern deep-learning library uses [S6][S21].
- Kelley (1960), Bryson (1961) and Dreyfus (1962) are precursors from control theory. Dreyfus explicitly used backprop to tune control parameters in 1973 [S6].
- Werbos's 1974 thesis applied it to general models, and his 1982 paper applied it to neural networks [S6][S7]. Schmidhuber says the first NN-specific application was in Werbos's 1982 paper, "but not yet in his 1974 thesis, as is sometimes claimed". The thesis had only "some preliminary, NN-specific discussion (Werbos, 1974, section 5.5.1)" [S6]. These are Schmidhuber's exact words; an earlier draft paraphrased them inside quotation marks. Others, including the Wiley republication of the thesis as *The Roots of Backpropagation* (1994), call the thesis "the original source" [S7]. *This is a dispute even among the critics.*
- Parker (1985) and LeCun (1985) were independent rediscoveries [S8][S9].
- Schmidhuber: RHW "did not cite the origin of the method", and later surveys by the authors also failed to cite prior art [S6].
- *Fairness note (verified in the Nature scan [S5]):* RHW did acknowledge contemporaries. "Variants on the learning procedure have been discovered independently by David Parker (personal communication) and by Yann Le Cun", and the reference list cites Le Cun, *Proc. Cognitiva 85*, 599–604. What they omitted were the *earlier* origins: Linnainmaa, Werbos and the control-theory line. Do not say that RHW "cited no one".

**Case for the RHW contribution (Hinton, Rumelhart)**
- They never claimed to have invented it [S10].
- Rumelhart's derivation was independent: "I had no idea that Paul Werbos had done work on it" [S22].
- Their contribution was to *demonstrate* that backprop makes hidden units learn meaningful internal representations, and to bring it to a wide audience. The *Nature* paper, the PDP chapter and the 1986 timing did this [S10][S5].
- Rumelhart conceded: "maybe we should have done better scholarship" [S22].

**Neutral framing for the film:** the method was discovered several times, from 1960s control theory to 1970 numerical analysis to 1974–1985 in economics, engineering and cognitive science. The 1986 paper is the one that made it stick. Liu's essay puts it this way: "it is not the first inventor who gets the credit, but the last re-inventor" [S22].

**Recurrence:** the dispute flared again around Hinton's 2019 Honda Prize (April 2020) and the 2024 Nobel Prize (for example, Grossberg citing Werbos; see [S10] coverage). It is still live as of 2026.

### 7.2 Systematicity and rules (1988 to present) (CONTESTED, UNRESOLVED)
- **Fodor & Pylyshyn:** thought is systematic. Anyone who can think "John loves the girl" can think "the girl loves John". Classical architectures explain this through constituent structure; connectionist networks do not, unless they merely implement a classical system [S12].
- **Pinker & Prince:** the Rumelhart–McClelland past-tense model cannot represent some words, learns rules found in no human language, fails at its own task, and mis-explains the over-regularisation stage ("bringed") and the "ated" errors [S13].
- **Connectionist replies:** Smolensky's tensor-product representations (around 1990), Elman's simple recurrent networks (1990), and later neural models of inflection. Kirov & Cotterell (2018) revisited Pinker & Prince using RNNs [S29].
- **2023:** Lake & Baroni say the challenge "persists" and claim meta-learning solves it [S14]. Critics dispute this; for example, Marcus has long argued that LLMs still lack robust compositionality (see the later-era dossiers).
- **Duration:** at least 35 years and counting. *Do not declare a winner.*
- **CONTESTED status of "unresolved":** Lake & Baroni present the challenge as persisting *until* their paper, then state "Here we successfully address Fodor and Pylyshyn's challenge" [S14]. Whether that claim succeeds is disputed. Correct wording: "In 2023, *Nature* authors wrote that the challenge had persisted for 35 years, and claimed to have met it; not everyone agrees." Avoid both "solved" and "unanswered".

### 7.3 Biological plausibility of backprop (CONTESTED)
- RHW themselves said it was not plausible as a model of the brain [S5]. Hinton's students rejected real-valued neurons as "totally unrealistic" (oral history [S22]).
- The question is still open, for example Lillicrap et al., "Backpropagation and the brain", *Nature Reviews Neuroscience* (2020).

### 7.4 Minsky & Papert's 1988 epilogue
- In the expanded *Perceptrons* (1988), Minsky and Papert argued that the new connectionism had not escaped their earlier scaling objections and were sceptical that gradient descent would scale [S22].
- Minsky in a 1991 interview (Olazaran 1991, via [S22]): "It converges slowly, and it cannot learn anything difficult." This is VERIFIED-SECONDARY; check Olazaran's dissertation before quoting.

---

## 8. Misconceptions to avoid

1. **"Hinton invented backpropagation."** False, and Hinton says so himself [S10]. Say that he co-authored the 1986 paper that popularised it and showed what it could learn.
2. **"Rumelhart, Hinton & Williams 1986 was the first backprop paper."** No. It was preceded by Linnainmaa 1970, Werbos 1974/1982, Parker 1985 and LeCun 1985 [S6]–[S9].
3. **"Backprop is just the chain rule."** The chain rule is 17th-century calculus. Backprop is the *efficient reverse-order* application of it, which reuses intermediate results so that all gradients cost about one extra pass [S6].
4. **"Hopfield networks learn by backprop."** No. Hopfield weights are set by a Hebbian outer-product rule, and the network *recalls*; it does not learn by gradient descent [S1][S3].
5. **"Boltzmann machines are the same as RBMs."** Restricted Boltzmann machines, with no within-layer connections, are a later restriction (Smolensky 1986 "harmonium"; Hinton in the 2000s). The 1985 machine allowed general symmetric connections [S4].
6. **"ALVINN drove across America."** The 1995 No Hands Across America trip used RALPH, not ALVINN [S26]. The 1989 ALVINN paper reports 0.5 m/s on a 400 m campus path [S16].
7. **"NETtalk learned to speak."** It learned letter-to-phoneme mapping. The voice was DECtalk, a commercial synthesiser [S15].
8. **"The universal approximation theorem means neural nets can learn anything."** It is an existence result. It says nothing about training, data or network size [S17][S18].
9. **"Hinton went to Toronto to found the deep learning programme at CIFAR in 1987."** In 1987 he joined CIFAR's *existing* AI, Robotics & Society programme (founded 1983). He co-founded NCAP, now Learning in Machines & Brains, in **2004** [S20].
10. **"The PDP books were a bestseller."** They were an *academic* sensation: the 6,000-copy first run sold out before press, and an estimated 30,000 were in print two years later [S11]. They did not appear on general bestseller lists.
11. **"The Hopfield paper was peer-reviewed in PNAS."** As an Academy member, Hopfield published without external review [S2].
12. **"The Nature paper was RHW's only backprop publication."** There was also the 1985 UCSD ICS technical report and PDP vol. 1, ch. 8, "Learning internal representations by error propagation" [S11][S22].
13. **Dating:** the Nature paper's issue date is 9 October 1986, not 1985 [S5]. Many sources say "1985", meaning the tech report.

---

## 9. Curiosity hooks

1. **A physicist walked into neuroscience through a five-page loophole.** As an Academy member, Hopfield could publish in *PNAS* without review. The 5-page limit forced omissions he later felt "probably increased the impact of the paper". It was the first time he had ever used the word "neuron" in print [S2].
2. **The first talk was in the Hall of Mirrors at Versailles, and nobody remembers it.** Hopfield: "I have never met anyone who remembered hearing the talk" [S2].
3. **The weekend LISP hack.** No student would program backprop for Hinton, so he "spent a weekend" writing it in LISP. On the 8-3-8 encoder the weights looked "wrong", "and the error was zero. I was amazed" (oral history, secondary [S22]; verify against the book).
4. **The address typo in Nature.** The landmark 1986 paper lists Carnegie-Mellon as "Pittsburgh, Philadelphia 15213" [S5] (scan).
5. **Navy money, then a principled exit.** The 1986 paper thanks the Office of Naval Research [S5]. A year later Hinton left the US, partly because he did not want to depend on military funding for AI [S19][S23].
6. **NETtalk babbled like a baby.** Early in training it used one vowel and one consonant for everything, a "babbling sound". By 10 passes "the text was understandable" [S15]. (Do not attach the "2 letters per second on a VAX" figure to NETtalk itself. The paper gives it for a 10,000-weight network during learning [S15].)
7. **ALVINN saw the world in blue.** It used only the blue colour channel because blue gave the best road/non-road contrast. It learned mostly from *simulated* roads and drove at walking pace through autumn woods on the CMU campus [S16].
8. **Backprop from Freud.** Werbos recalled that his route to backprop began as an attempt to translate Freud's "psychic energy" into mathematics (Talking Nets interview, secondary [S22]; frame as his recollection).
9. **The PDP books sold out before they existed.** The 6,000-copy first run was gone before the volumes went to press [S11].
10. **Credit, the eternal argument.** Hinton, on being called the inventor of backprop: "one of these rare cases where an academic feels he has got too much credit for something!" [S10]. Schmidhuber calls machine learning "the science of credit assignment" [S10]. Credit assignment is also exactly the problem backprop solves.
11. **Thirty-five years and counting.** Fodor and Pylyshyn's 1988 challenge was still being answered in *Nature* in 2023 [S14].

---

## 10. Visual and dramatic details

- **Caltech, 1980–81 (Hopfield).**
  - A computing room of the quantum-chemistry facility, with green-phosphor or amber CRT terminals and keyboards, used "for trying out models". By Hopfield's account this was "a perversion of the intended purpose of this facility, but no one was looking" [S2].
  - Silhouette: a tall physicist at a terminal, a slow scroll of on/off dots settling into a pattern.
  - Visual metaphor: a ball rolling into valleys of a landscape (energy). A row of tiny compass needles or magnets flipping, for the spin analogy [S3].
- **Versailles, summer 1981.** The Hall of Mirrors lecture; speakers lodged at the Trianon Palace Hotel [S2]. Chandeliers, mirrors and a sparse audience make a strong paper-cut tableau.
- **UCSD / La Jolla, 1982.**
  - The Institute for Cognitive Science (mail code C-015 in the Nature address [S5]).
  - The PDP Research Group's discussion meetings [S11].
  - Coastal light, eucalyptus, Pacific haze. Chalkboards with network diagrams. (Specific weather on specific days: UNVERIFIED; general coastal atmosphere is fine.)
- **Carnegie Mellon, Pittsburgh, 1983–86.**
  - Winter seminars (Hinton's Feb/Mar 1983 talk [S22]). Brick buildings and steel-city skyline.
  - Lisp-machine-era terminals.
  - The NAVLAB van parked outside: a modified **Chevy van** with a camera and a laser range finder on top, carrying 3 Sun computers and a Warp inside [S16].
- **The NAVLAB on the wooded path.** Sunny autumn day, 400 m path through trees, the van creeping at half a metre per second [S16]. A 30×32 mosaic "retina" of blue-channel pixels floating above the windscreen. 45 output units fanning left to right like a steering gauge.
- **Johns Hopkins, Baltimore (Sejnowski).** VAX 11/780 cabinets and a DECtalk box with a speaker [S15]. A sliding 7-letter window moving across a child's transcript. Sound design: babble → pseudo-words → reading.
- **The Boltzmann machine as a thermal scene.** A network of lanterns flickering randomly when "hot", then steadying as temperature lowers (annealing schedule 20 → 15 → 12 → 10 [S4]). Two phases: "clamped" (eyes open, the world pinned on) vs "free-running" (dreaming). The weight change is the difference [S4].
- **Backprop animation storyboard.**
  1. Forward: activations flow upward as light through sigmoid "valves".
  2. The output is compared with the target, and the error appears as a red glow.
  3. Backward: red glow travels down the same wires, scaled by each weight and by y(1−y) at each unit (the chain rule as a relay of multipliers).
  4. Each wire adjusts in proportion to (incoming activity × outgoing blame).
  5. Repeat for 1,425 sweeps until the mirror-symmetry detector's two hidden units form mirror-image weight patterns of ±14.2, ±7.2 and ±3.6 [S5].
  6. Family trees: two paper-cut family trees, English and Italian, side by side. A 6-unit hidden layer lights up with "nationality", "generation" and "branch" columns [S5].
- **Period objects.** The 2-volume PDP set: two thick paperbacks, MIT Press/Bradford, 1,158 pages [S11]. Nature's 9 October 1986 issue. The *Cognition* vol. 28 special issue (1988) [S24]. Overhead projector transparencies; dot-matrix printouts. Hinton's "stacks of paper about three inches thick" of Boltzmann reports (oral history, secondary [S22]; verify).
- **Toronto, 1987.** Arrival in winter-coat country. CIFAR says the neural-network field Hinton pursued "at the time had been met with widespread skepticism and an episodic dearth of funding" [S20]. (The skepticism was aimed at the *field*, not at CIFAR's support.) Silhouette of a man on a snowy campus. (Do not invent the specific weather on the arrival day.)

---

## 11. Sources

1. [S1] Hopfield, J. J. (1982). "Neural networks and physical systems with emergent collective computational abilities." *PNAS* 79(8):2554–2558. https://doi.org/10.1073/pnas.79.8.2554 · Europe PMC record (abstract): https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1073/pnas.79.8.2554&resultType=core&format=json · PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC346238/
2. [S2] Hopfield, J. J. "Now What?" (autobiographical essay, CC-BY). https://pni.princeton.edu/sites/g/files/toruqf321/files/documents/John%20Hopfield%20Now%20What%203_0.pdf
3. [S3] Royal Swedish Academy of Sciences, press release, Nobel Prize in Physics 2024 (8 Oct 2024). https://www.nobelprize.org/prizes/physics/2024/press-release/
4. [S4] Ackley, D. H., Hinton, G. E., & Sejnowski, T. J. (1985). "A Learning Algorithm for Boltzmann Machines." *Cognitive Science* 9(1):147–169. https://doi.org/10.1207/s15516709cog0901_7 · PDF: https://www.cs.toronto.edu/~hinton/absps/cogscibm.pdf
5. [S5] Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). "Learning representations by back-propagating errors." *Nature* 323:533–536 (9 Oct 1986; received 1 May, accepted 31 July 1986). https://www.nature.com/articles/323533a0 · scan: https://gwern.net/doc/ai/nn/1986-rumelhart-2.pdf · https://www.cs.toronto.edu/~hinton/absps/naturebp.pdf
6. [S6] Schmidhuber, J. "Who Invented Backpropagation?" (IDSIA). https://people.idsia.ch/~juergen/who-invented-backpropagation.html
7. [S7] Werbos, P. J. (1974). *Beyond Regression* (Harvard PhD thesis). Republished as *The Roots of Backpropagation* (Wiley, 1994). https://www.wiley-vch.de/en/areas-interest/engineering/electrical-electronics-engineering-10ee/intelligent-systems-agents-10ee7/neural-networks-10ee77/the-roots-of-backpropagation-978-0-471-59897-8 · biographical summary (lead): https://en.wikipedia.org/wiki/Paul_Werbos
8. [S8] Parker, D. B. (1985). *Learning-Logic*, TR-47, Center for Computational Research in Economics and Management Science, MIT. Citation record: https://www.bibsonomy.org/publication/291bb7407babd3192f127469f2899a71 · cited in Lillicrap et al. 2020: https://www.nature.com/articles/s41583-020-0277-3
9. [S9] LeCun, Y. (1985). "Une procédure d'apprentissage pour réseau à seuil asymétrique." *Proceedings of Cognitiva 85*, Paris, 599–604. Citation record: https://www.bibsonomy.org/bibtex/b3af2c2d3257dc8c11e0f8e643f384c2
10. [S10] Synced (23 Apr 2020). "Who Invented Backpropagation? Hinton Says He Didn't, but His Work Made It Popular" (quotes Hinton's Reddit reply and Schmidhuber's critique). https://syncedreview.com/2020/04/23/who-invented-backpropagation-hinton-says-he-didnt-but-his-work-made-it-popular/
11. [S11] Gibbons, M. G. (2019). "Attaining landmark status: Rumelhart and McClelland's PDP Volumes and the Connectionist Paradigm." *J. Hist. Behav. Sci.* https://onlinelibrary.wiley.com/doi/10.1002/jhbs.21946 · PDF: https://courses.edx.org/assets/courseware/v1/1d43fffe0d4527c250963b7eb31e1ac9/asset-v1:UniversityofCambridge+2324EDX001+2T2023+type@asset+block/J_History_Behavioral_Science_-_2018_-_Gibbons.pdf
12. [S12] Fodor, J. A., & Pylyshyn, Z. W. (1988). "Connectionism and cognitive architecture: A critical analysis." *Cognition* 28(1–2):3–71. https://doi.org/10.1016/0010-0277(88)90031-5 · preprint text: https://ruccs.rutgers.edu/images/personal-zenon-pylyshyn/proseminars/Proseminar13/ConnectionistArchitecture.pdf
13. [S13] Pinker, S., & Prince, A. (1988). "On language and connectionism." *Cognition* 28(1–2):73–193. https://doi.org/10.1016/0010-0277(88)90032-7 · text: http://www.blutner.de/NeuralNets/Texts/Pinker_Prince.htm
14. [S14] Lake, B. M., & Baroni, M. (2023). "Human-like systematic generalization through a meta-learning neural network." *Nature* (25 Oct 2023). https://www.nature.com/articles/s41586-023-06668-3
15. [S15] Sejnowski, T. J., & Rosenberg, C. R. (1987). "Parallel Networks that Learn to Pronounce English Text." *Complex Systems* 1:145–168. https://papers.cnl.salk.edu/PDFs/Parallel%20Networks%20That%20Learn%20to%20Pronounce%20English%20Text%201987-3351.pdf
16. [S16] Pomerleau, D. A. (1989). "ALVINN: An Autonomous Land Vehicle in a Neural Network." *Advances in NIPS 1* (NIPS 1988). https://papers.nips.cc/paper_files/paper/1988/file/812b4ba287f5ee0bc9d43bbf5bbe87fb-Paper.pdf
17. [S17] Cybenko, G. (1989). "Approximation by superpositions of a sigmoidal function." *Math. Control Signals Systems* 2(4):303–314. https://doi.org/10.1007/BF02551274 · open copy: https://hal.science/hal-03753170
18. [S18] Hornik, K., Stinchcombe, M., & White, H. (1989). "Multilayer feedforward networks are universal approximators." *Neural Networks* 2(5):359–366. https://doi.org/10.1016/0893-6080(89)90020-8 · https://www.sciencedirect.com/science/article/abs/pii/0893608089900208
19. [S19] Britannica, "Geoffrey Hinton." https://www.britannica.com/biography/Geoffrey-Hinton · Toronto Life profile: https://torontolife.com/life/ai-superstars-google-facebook-apple-studied-guy/
20. [S20] CIFAR, "CIFAR Nobel Laureates" and "Long-time CIFAR Fellow Geoffrey Hinton awarded 2024 Nobel Prize in Physics", plus "CIFAR 40" and "Our Story". https://cifar.ca/awards/cifar-nobel-laureates/ · https://cifar.ca/cifarnews/2024/10/08/long-time-cifar-fellow-geoffrey-hinton-awarded-2024-nobel-prize-in-physics/ · https://cifar.ca/40-years/ · https://cifar.ca/our-story/
21. [S21] Linnainmaa, S. (1976). "Taylor expansion of the accumulated rounding error." *BIT* 16(2):146–160. https://doi.org/10.1007/BF01931367
22. [S22] Liu, Y. "The Backstory of Backpropagation" (essay quoting Rosenfeld & Anderson, *Talking Nets: An Oral History of Neural Networks*, MIT Press 2000; Sejnowski 2018; Olazaran 1991). https://yuxi-liu-wired.github.io/essays/posts/backstory-of-backpropagation/ (secondary; quotes must be checked against Talking Nets)
23. [S23] Hinton profile (dates at CMU; lead only): https://en.wikipedia.org/wiki/Geoffrey_Hinton
24. [S24] Crossref metadata for the Boltzmann, Fodor–Pylyshyn, Pinker–Prince, Cybenko, Hornik et al. and Linnainmaa papers. https://api.crossref.org/works/10.1207/s15516709cog0901_7 (and corresponding DOIs above)
25. [S25] MIT Press, *Parallel Distributed Processing, Volume 1*. https://mitpress.mit.edu/9780262680530/parallel-distributed-processing-volume-1/
26. [S26] CMU, No Hands Across America official press release. https://www.cs.cmu.edu/~tjochem/nhaa/official_press_release.html · Robot Hall of Fame, NavLab 5: http://www.robothalloffame.org/inductees/08inductees/navlab.html
27. [S27] Association for Psychological Science, "Remembering David E. Rumelhart (1942–2011)." https://www.psychologicalscience.org/observer/david-rumelhart
28. [S28] NETtalk overview (lead; cites Sejnowski 2018, p. 115 for the Today show). https://en.wikipedia.org/wiki/NETtalk_(artificial_neural_network)
29. [S29] Kirov, C., & Cotterell, R. (2018). "Recurrent Neural Networks in Linguistic Theory: Revisiting Pinker and Prince (1988) and the Past Tense Debate." *TACL*. https://arxiv.org/abs/1807.04783
30. [S30] Hinton, G. E. *Curriculum Vitae* (dated 6 Jan 2025; primary for employment dates). https://www.cs.toronto.edu/~hinton/shortcv.pdf
31. [S31] Carey, B. "David Rumelhart Dies at 68; Created Computer Simulations of Perception." *New York Times*, March 2011 (names Pick's disease). https://www.nytimes.com/2011/03/19/health/19rumelhart.html · reprint: http://archive.boston.com/bostonglobe/obituaries/articles/2011/03/28/david_rumelhart_created_perception_simulations_at_68/ · Stanford Report: https://news.stanford.edu/stories/2011/03/david-rumelhart-pioneer-cognitive-neuroscience-dies-68
32. [S32] No Hands Across America (RALPH, 2,797/2,849 miles): The Robot Report, "Back to the Future: Autonomous Driving in 1995." https://www.therobotreport.com/back-to-the-future-autonomous-driving-in-1995/ · Robot Hall of Fame, NavLab 5: http://www.robothalloffame.org/inductees/08inductees/navlab.html · CMU RI: https://www.ri.cmu.edu/robot/navlab-5
33. [S33] Funahashi, K. (1989). "On the approximate realization of continuous mappings by neural networks." *Neural Networks* 2(3):183–192. https://doi.org/10.1016/0893-6080(89)90003-8
34. [S34] Salk Institute / EurekAlert, "Salk scientist Terrence Sejnowski elected to National Academy of Sciences" (Salk 1988). https://www.eurekalert.org/news-releases/539980 · Brain Prize biography (in his words; says 1989): https://brainprize.org/winners/computational-and-theoretical-neuroscience-2024/terrence-j-sejnowski
35. [S35] Werbos, P. J. (Aug 1974). *Beyond Regression* (thesis scan; title page "August, 1974"; Karl Deutsch named as thesis supervisor). https://gwern.net/doc/ai/nn/1974-werbos.pdf
36. [S36] CMU, No Hands Across America home page (Navlab 5; "TRIP COMPLETE !!! 2797/2849 miles (98.2%)"; RALPH). https://www.cs.cmu.edu/~tjochem/nhaa/nhaa_home_page.html
37. [S37] Affiliation leads for Fodor and Pylyshyn in 1988: Wikipedia, "Jerry Fodor" (MIT 1959–86, CUNY 1986–88, Rutgers from 1988; cites the Guardian and Rutgers obituaries) https://en.wikipedia.org/wiki/Jerry_Fodor · Rutgers obituary https://www.rutgers.edu/news/obituary-jerry-fodor-rutgers-university-philosopher-pioneer-cognitive-science · Wikipedia, "Zenon Pylyshyn" (University of Western Ontario 1964–94; CIFAR AI & Robotics programme director 1985–94; Rutgers from 1994; cites ruccs.rutgers.edu/zenon) https://en.wikipedia.org/wiki/Zenon_Pylyshyn

---

## 12. Fact-check log (adversarial pass, 2026-10-05)

**Method.** Primary texts were opened and searched directly:
- Hopfield, "Now What?" (PNI PDF); the Hopfield 1982 abstract and date (NCBI E-utilities PMC XML: ppub April 1982).
- Ackley, Hinton & Sejnowski 1985 (Hinton's PDF).
- The RHW 1986 *Nature* scan (gwern.net PDF text layer) and the nature.com metadata (received 1 May, accepted 31 July 1986; issue 6088, 9 Oct 1986).
- Sejnowski & Rosenberg 1987 (Salk PDF) and Pomerleau 1989 (NIPS PDF).
- Gibbons 2019 (PDF); the Fodor & Pylyshyn Rutgers preprint; the Pinker & Prince text (blutner.de).
- Schmidhuber's IDSIA page; Synced 2020; the Nobel press release; CIFAR pages; Hinton's CV.
- Crossref records for Cognitive Science 9(1), Cognition 28, BIT 16(2), MCSS 2(4), Neural Networks 2(5) and Nature 623.
- Liu's essay, checked for the oral-history wording.

**Confirmed without change (selection):** the Hopfield abstract wording (Q2), the Feb 1980 Caltech move, the part-time Bell Labs affiliation, the "spin systems" passage, the "entryway" and first "neuron" sentence (Q4), Versailles/Hall of Mirrors/"I have never met anyone…" (Q5), and the Academy member "without any review" and 5-page limit. Also confirmed:
- Boltzmann paper: 9:147–169, CMU/Johns Hopkins affiliations, the 4-2-4 result in 250 tests (median 110 cycles, longest 1810), 8-3-8 with 16 of 20 runs, the 2@20, 2@15, 2@12, 4@10 annealing schedule, "severe speed limitation", and System Development Foundation funding.
- RHW: the abstract (Q6), equations 4–9 and momentum, 1,425 sweeps, ε=0.1, α=0.9, weights in ±0.3, 100 of 104 triples, the 4 generalised triples, units 1/2/6 for nationality/generation/branch, 1,500 sweeps, 0.2% weight decay, "very rarely gets stuck", the closing "not a plausible model" paragraph (Q7), SDF and ONR funding, and the "Pittsburgh, Philadelphia" typo.
- NETtalk: 203/80/26, 18,629 weights, DECtalk, 1,024 words from a first-grade child, 95% after 50 passes, babbling → pseudowords → understandable by 10 passes, and the 20,012-word dictionary figures (77/85/90%, 98% with 120 hidden units, 80% for the two-hidden-layer net).
- ALVINN: 30×32 blue band, 8×32 range finder, 1,217 inputs, 29 hidden units, 46 outputs (45 steering), 1,200 simulated images, 40 epochs at about 90%, the Chevy van with 3 Suns and a Warp, 1/2 m/s on a 400 m wooded path.
- PDP: 1,158 pages, 6,000 sold out before press, about 30,000 two years later, and 17/23/31% (via Gibbons citing Schneider 1987 and Dreyfus & Dreyfus 1988).
- Fodor & Pylyshyn and Pinker & Prince pages and abstract quotes (Q13–Q15); Lake & Baroni wording (Q16); the Nobel citation and date (Q19).
- CIFAR: Hinton a 1987 Fellow in the first programme (AIRS, founded 1983), and NCAP in 2004.
- Hinton's Reddit reply as reproduced verbatim by Synced (Q10); the Schmidhuber "did not cite the origin" wording (Q11); Werbos's thesis of Aug 1974 with Deutsch as supervisor and his 1995 IEEE Pioneer Award.
- RALPH, not ALVINN, in 1995.

**Changes made:**
1. **Schmidhuber paraphrase in quotation marks (corrected).** "not in the 1974 thesis, contrary to some claims" was replaced by his actual words: "but not yet in his 1974 thesis, as is sometimes claimed" [S6].
2. **NETtalk speed (corrected).** The paper's "about 2 letters/sec on a VAX 11/780 FPA" is for "a network of 10,000 weights" during learning, not for the 18,629-weight NETtalk. Section 5.5 and curiosity hook 6 were fixed [S15].
3. **RHW citation of prior work (corrected; context added).** The *Nature* paper states "Variants on the learning procedure have been discovered independently by David Parker (personal communication) and by Yann Le Cun" and cites Le Cun's Cognitiva 85 paper as ref. 3. The omission Schmidhuber criticises concerns the earlier origins (Linnainmaa, Werbos), not all prior work [S5] (nature.com reference metadata and scan).
4. **Linnainmaa FORTRAN code (corrected).** The code is in the 1970 thesis (pp. 58–60), not specifically in *BIT* 1976 [S6]. *BIT* 16(2):146–160 is dated June 1976 (Crossref) [S21].
5. **Universal approximation (corrected; incomplete).** Funahashi (1989, *Neural Networks* 2(3):183–192) was added as a third independent proof [S33].
6. **CIFAR "skepticism" quote (corrected; misattributed).** CIFAR says the *field* "at the time had been met with widespread skepticism and an episodic dearth of funding", not CIFAR's support [S20].
7. **Rumelhart's cause of death (corrected attribution).** APS [S27] and Stanford say only "progressive neurodegenerative disease". "Pick's disease" comes from the NYT obituary [S31]. The ICS co-directorship is now marked UNVERIFIED.
8. **Hinton's career dates (corrected; UNVERIFIED resolved).** All positions were replaced with dates from his own CV [S30]: Sussex 1976–78, UCSD 1978–80, MRC APU 1980–82, UCSD Jan–Jun 1982, CMU Oct 1982 – Jun 1987, Toronto Jul 1987.
9. **"First Boltzmann machine paper" (corrected; overclaim).** The [S4] reference list shows Hinton & Sejnowski, "Analyzing cooperative computation" (May 1983), before "Optimal perceptual inference" (June 1983). The entry is now "one of the earliest".
10. **Schneider quote (corrected; dropped hedge).** He called it *probably* "the most dramatic shift…" (Gibbons [S11]).
11. **Lake & Baroni dates (corrected).** Published online 25 Oct 2023; print *Nature* 623:115–121 (2 Nov 2023) (Crossref).
12. **Pinker & Prince full title (corrected; minor).** The subtitle "Analysis of a parallel distributed processing model of language acquisition" was added (Crossref).
13. **1995 RALPH sourcing (corrected).** The CMU press release [S26] predates the trip and names neither RALPH nor ALVINN. [S32] was added for RALPH, 23–31 July 1995 and 2,797 of 2,849 miles (98.2%).

**Marked CONTESTED:**
- Whether the systematicity challenge is "unresolved". Lake & Baroni claim to have "successfully address[ed]" it [S14]; others dispute this.
- The year Sejnowski moved to Salk: 1988 per Salk [S34], 1989 per his Brain Prize biography.
- The Werbos 1974 vs 1982 neural-network application (already marked; wording corrected).

**Marked UNVERIFIED (do not state as fact without a further source):**
- The venue of the 1979 Hinton–Anderson meeting (UCSD/La Jolla).
- The "Central America" component of Hinton's reasons for leaving the US. The verified reasons are DoD/military funding and Reagan-era politics, with "Star Wars" cited in the ACM biography as reported.
- Rumelhart as co-director of UCSD's Institute for Cognitive Science.
- The 86 low-frequency test verbs in the past-tense model.
- The broadcast date of NETtalk's *Today* show appearance (already flagged).
- The MIT Press publication date of 17 July 1986 for Vol. 1 (the page was blocked in this pass; "1986" is confirmed by Gibbons).

**Not re-verified but already labelled VERIFIED-SECONDARY:** the oral-history quotations from *Talking Nets*. Their wording matches Liu's transcription [S22] exactly, and they must still be checked against the book before on-screen use. The Reddit original of Q10 was not fetched; the Synced reproduction is verbatim.
