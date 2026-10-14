# Dossier: The Logical Neuron — McCulloch-Pitts, Hebb, Cybernetics and Dartmouth (1943–1956)

Topic id: `logical-neuron-and-cybernetics`. Era: 1943–1956. As of: 2026-10-05.
Method: drafted from background knowledge, then each claim the film is likely to use was checked against primary texts. Primary texts read directly for this dossier: the McCulloch–Pitts 1943 paper (full text), Hebb 1949 (full text, archive.org), Turing 1950 (full text plus the OUP journal page), Wiener's *Cybernetics* (original-edition text in the MIT Press reissue), and the Dartmouth proposal (full text, McCarthy's Stanford site). Grace Solomonoff's archival history of the Dartmouth summer (built from Rockefeller Foundation files and participants' notes) was also read directly. Source numbers in [brackets] point to section 11.

---

## 1. Summary

Between 1943 and 1956 a small, overlapping set of people turned the question "what is a mind?" into an engineering question.

- **1943, the logical neuron.** Warren McCulloch, a neurophysiologist and psychiatrist in Chicago, and Walter Pitts, a self-taught teenage logician, published "A Logical Calculus of the Ideas Immanent in Nervous Activity". The paper idealized the neuron as an all-or-none threshold switch, so that networks of such units could be described exactly by propositional logic [1].
  - Its strongest claim: such a net, *if furnished with a tape, scanners … and suitable efferents*, can compute only what a Turing machine can, and every such number can be computed by such a net [1].
  - Its nets did not learn. Assumption 5 states: "The structure of the net does not change with time" [1].
  - Neuroscientists paid it little attention at first [9]. John von Neumann's 1945 EDVAC report, the founding document of the stored-program computer, cited it as its only reference [10][11].
- **1949, the learning rule.** Donald Hebb, a psychologist at McGill University in Montreal, published *The Organization of Behavior* [3]. It contained the "neurophysiological postulate": a connection grows stronger when cell A repeatedly takes part in firing cell B. This supplied the missing ingredient, a rule by which connections could change.
- **1946–1953, cybernetics.** The Macy conferences gathered mathematicians, physiologists, anthropologists and psychiatrists [12]. Norbert Wiener named the field in *Cybernetics* (1948) [5], which became an unlikely bestseller: over 22,000 copies by the end of 1949, per Kline's *The Cybernetics Moment* [14a]. The movement believed that brains and machines are both systems of feedback and information.
  - Inside the movement, a running argument set the "digital" view (McCulloch–Pitts, von Neumann) against the "analog" view (Ralph Gerard, and Gestalt psychology) [12][13].
- **1950, the child machine.** Alan Turing's "Computing Machinery and Intelligence" proposed the imitation game [6]. It also proposed building a "child machine" and educating it, instead of programming an adult mind directly. Rewards and punishments were part of his scheme, though he added that they "can at best be a part of the teaching process" [6].
- **1951, SNARC.** Marvin Minsky and Dean Edmonds built a learning machine at Harvard: about 40 artificial "neurons" made from vacuum tubes and motors, with a surplus B-24 bomber autopilot driving the clutches [15].
- **1955–56, Dartmouth.** John McCarthy, Minsky, Nathaniel Rochester and Claude Shannon wrote the Dartmouth proposal (dated 31 August 1955), which introduced the term "artificial intelligence" [7].
  - It proposed "a 2 month, 10 man study" on "the conjecture that every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it" [7].
  - "Neuron Nets" was explicitly topic 3 [7].
  - The Rockefeller Foundation gave roughly half of the $13,500 requested: $7,500, per the Foundation's own account [7][16][31].
  - The summer ran from about 18 June to 17 August 1956 [16].
- **The symbolic turn.** At Dartmouth, Allen Newell and Herbert Simon brought the Logic Theorist, a symbolic theorem-prover, as the rival approach already in play [16][17].
  - Historians describe the summer as the debut of the symbolic paradigm, "replacing the earlier methods of brain modelling associated with cybernetics and neural nets" [16].
  - Minsky later said that Ray Solomonoff's symbolic ideas "led me to switch from working on neural nets to working on symbolic ideas about AI" [16].
- **The optimism.** It was explicit. The proposal hoped for "a significant advance" in one summer [7]. In 1958 Simon and Newell predicted a computer world chess champion "within ten years" (first delivered in Simon's 1957 address to the Operations Research Society of America) [20]. Deep Blue beat Kasparov only in 1997, 29 years after that deadline [20]. Critics such as Hubert Dreyfus were already quoting these predictions back at the field in 1972 [27].

The big irony for the film: the neural approach was present at AI's christening, as topic 3 of the proposal, as Minsky's own SNARC and as Rochester's IBM simulations of Hebb's theory [7][18]. Yet the summer marked the moment its own builders began walking away from it.

---

## 2. Timeline

| Date | Event | Sources |
|---|---|---|
| c. 1935 | Walter Pitts, about 12, hides from bullies in a Detroit library, reads Whitehead & Russell's *Principia Mathematica* in three days and writes to Russell about errors; Russell invites him to Cambridge (account in Gefter's reported feature, based on Conway & Siegelman's biography) | [9] |
| c. 1941 | Jerome Lettvin introduces Pitts (about 18) to Warren McCulloch (about 42) in Chicago; McCulloch takes Pitts into his family home in Hinsdale, Illinois | [9] |
| 1942 | Macy Foundation meeting in New York on "central inhibition"; Rosenblueth presents the Bigelow–Rosenblueth–Wiener ideas on purpose and feedback; McCulloch attends | [5] |
| 1943 (Bull. Math. Biophys. vol. 5, pp. 115–133) | McCulloch & Pitts, "A Logical Calculus of the Ideas Immanent in Nervous Activity" | [1][2] |
| Summer–autumn 1943 | Lettvin introduces Pitts to Wiener; Pitts comes to MIT "in the autumn of 1943" to work with Wiener (Wiener's own account) | [5][9] |
| June 1945 | Von Neumann, *First Draft of a Report on the EDVAC*: sect. 4.2 models computer "elements" on neurons, "Following W. Pitts and W. S. MacCulloch" — the draft's only citation | [10][11] |
| 8–9 March 1946 | First Macy conference, New York (initially titled "Feedback Mechanisms and Circular Causal Systems in Biological and Social Systems"); McCulloch chairs; 10 conferences through 1953 | [12] |
| Spring 1947 | McCulloch & Pitts's scanning theory of form perception (from a reading machine for the blind), presented at a Macy meeting and the NY Academy of Sciences | [5] |
| 1948 | Turing, "Intelligent Machinery" (NPL report): randomly connected "unorganised machines" of neuron-like units that can be "trained" — unpublished until 1968 | [21] |
| 1948 | Wiener, *Cybernetics: Or Control and Communication in the Animal and the Machine* (Hermann, Paris; Technology Press/Wiley, US); >22,000 copies sold by end of 1949 | [5][14][14a] |
| 1949 | Hebb, *The Organization of Behavior* (Wiley, New York); postulate on p. 62 | [3][4] |
| October 1950 | Turing, "Computing Machinery and Intelligence," *Mind* 59(236): 433–460 | [6] |
| 1950 (filmed 1952) | Claude Shannon's maze-learning mouse "Theseus" at Bell Labs; demonstrated at the 1951 Macy conference | [22] |
| 23–24 March 1950 | 7th Macy conference: Ralph Gerard, "Some of the Problems Concerning Digital Notions [Concepts] in the Central Nervous System" — the analog vs. digital argument | [13] |
| Summer 1951 | Minsky and Dean Edmonds build SNARC at Harvard, funded by "a couple of thousand dollars" from the Office of Naval Research via George Miller (Minsky to Bernstein, 1981) | [15] |
| c. 1952 | Wiener abruptly cuts off McCulloch, Pitts and Lettvin; reason never explained to Pitts (contested; see §7) | [9] |
| 1954 | Minsky's Princeton PhD thesis, "Theory of Neural-Analog Reinforcement Systems and Its Application to the Brain-Model Problem"; von Neumann on committee | [23] |
| 1954 | Farley & Clark (MIT) simulate self-organizing nets on a digital computer (cited in the Dartmouth proposal as "Farley and Clark") | [7][18] |
| February–June 1955 | McCarthy approaches the Rockefeller Foundation; meets Robert Morison with Shannon in June | [16] |
| 31 August 1955 | Dartmouth proposal dated; Solomonoff's history says it was sent 2 Sept 1955 | [7][16] |
| December 1955 – January 1956 | Newell & Simon hand-simulate the Logic Theorist; Simon reportedly tells his class "Over Christmas, Allen Newell and I invented a thinking machine" (reported by Feigenbaum to McCorduck) | [17][24] |
| 26 May 1956 | McCarthy writes to Morison listing 11 expected attendees | [16] |
| c. 18 June – 17 August 1956 | Dartmouth Summer Research Project, top floor of the mathematics building (then Dartmouth Hall), Hanover, NH | [16] |
| June 1956 | RAND report P-868, "The Logic Theory Machine" | [17] |
| August 1956 | First Logic Theorist proof printed by RAND's JOHNNIAC computer (Cordeschi; the Moews recreation project gives the same month). The bulk of the 38-of-52 results came from runs in late 1956 and 1957; the two accounts are compatible | [17][25][32] |
| September 1956 | IRE Transactions on Information Theory IT-2: Newell & Simon's Logic Theory Machine paper, and Rochester, Holland, Haibt & Duda's IBM 704 test of Hebb's cell assemblies (pp. 80–93) | [17][18] |
| 1958 (Jan–Feb) | Simon & Newell, "Heuristic Problem Solving: The Next Advance in Operations Research", *Operations Research* 6(1), pp. 7–8: four ten-year predictions (from Simon's 1957 ORSA address) | [20] |
| 1960 | Simon, *The New Science of Management Decision*, p. 38: "machines will be capable, within twenty years, of doing any work that a man can do" | [27] |
| 1959 | Lettvin, Maturana, McCulloch & Pitts, "What the Frog's Eye Tells the Frog's Brain"; per Lettvin, the results disillusioned Pitts about logic as the brain's language | [9][26] |
| 1967 | Minsky: "Within a generation, I am convinced, few compartments of intellect will remain outside the machine's realm…" | [27] |
| 14 May 1969 | Pitts dies alone in a Cambridge boarding house; McCulloch dies four months later (24 Sept 1969) | [9][33] |
| May 1997 | Deep Blue defeats Kasparov: 39 years after the 1958 chess prediction, 29 years after its ten-year deadline | [20] |
| 13–15 July 2006 | AI@50 at Dartmouth; five original attendees present (Minsky, Solomonoff, Selfridge, More, McCarthy) | [28] |

---

## 3. People

Silhouette notes are for respectful art direction only. Physical descriptions come from the cited sources where noted. Everything else is marked *(verify against period photos)*.

### Warren S. McCulloch (1898–1969)
- **Role and institution:** Neurophysiologist and psychiatrist. In 1943 at the University of Illinois College of Medicine, Department of Psychiatry, Illinois Neuropsychiatric Institute, Chicago. The paper's byline also names the University of Chicago, Pitts's informal base [1]. Moved to MIT (Research Laboratory of Electronics) in 1952 [9]. Chaired the Macy cybernetics conferences [12].
- **Belief:** The brain is a logical machine. In his view, a neuron's all-or-none firing is a proposition, and so mind can be "rigorously deduced" from neurophysiology. The 1943 paper says "both the formal and the final aspects of that activity which we are wont to call mental are rigorously deduceable from present neurophysiology" [1].
- **Silhouette:** "a confident, gray-eyed, wild-bearded, chain-smoking philosopher-poet" [9]. A full, unruly beard is his signature outline. Add a cigarette and a 1940s three-piece suit *(verify)*.

### Walter Pitts (1923–1969)
- **Role and institution:** Self-taught logician, never formally enrolled as a degree student in Chicago; there he sat in on courses and knew Carnap and Rashevsky's group [5]. At MIT from autumn 1943 as a "special student" working with Wiener [5][9].
- **Belief:** That logic is the brain's language. Lettvin recalled that the 1959 frog's-eye results showed logic "didn't play the important or central part that one would have expected", and that "It disappointed him" [9].
- **Fate:** He burned his dissertation and notes, refused to sign the paperwork for his PhD, and died 14 May 1969 [9]. Smalheiser (2000) says MIT had arranged in 1955 to award him a PhD without a thesis, and he would not sign the acceptance [34].
- **Degrees (contested):** Smalheiser says Pitts "never held degrees of any kind" [34]. Wikipedia, citing an editorial note in Gödel's *Collected Works*, says the University of Chicago awarded him an Associate of Arts, "his only earned degree" [33]. **Film-safe wording:** "he never finished a doctorate" or "he had no advanced degree".
- **Wiener on Pitts (Wiener's own words):** "Another young migrant from the field of mathematical logic to cybernetics is Walter Pitts" [5]. Gefter also cites Wiener calling him "without question the strongest young scientist whom I have ever met" [9]; quote that as reported speech.
- **Silhouette:** "small and shy, with a long forehead that prematurely aged him", and a "squat, duck-like, bespectacled face" [9]. Draw a slight figure in glasses, younger than everyone around him: a teenager among professors in 1943.

### Jerome Lettvin (1920–2011)
- **Role and institution:** Physician, and Pitts's closest friend. In 1943 at Boston City Hospital [5]. Introduced Pitts to McCulloch, then to Wiener [5][9]. Lead author of the 1959 frog's-eye paper [26].
- **Silhouette:** Large, heavyset man *(verify)*.

### Donald O. Hebb (1904–1985)
- **Role and institution:** Canadian psychologist at McGill University, Montreal. Author of *The Organization of Behavior* (1949) [3]. Earlier he trained with Karl Lashley *(background; verify if used)*.
- **Belief:** Learning is a physical change at the synapse. Groups of cells that repeatedly fire together form "cell-assemblies", and chains of these form "phase sequences", which he called "the thought process" [3]. His focus was learning and perception, the very thing the McCulloch–Pitts nets had set aside.
- **Silhouette:** Lean academic in a 1940s suit, with glasses in later photos *(verify)*.

### Norbert Wiener (1894–1964)
- **Role and institution:** MIT mathematician. Coined "cybernetics" with the Rosenblueth group in 1947 [5]. Author of *Cybernetics* (1948) [5].
- **Belief:** Animals and machines share one science of "control and communication" built on feedback [5]. He also believed information is a third fundamental quantity: "Information is information, not matter or energy" [5].
- **Silhouette:** Short, stout, with round thick glasses, a goatee and often a cigar *(widely photographed; verify)*. A rounded, distinctive outline.

### John von Neumann (1903–1957)
- **Role and institution:** Institute for Advanced Study, Princeton. Macy core member [12]. Author of the EDVAC report [10]. Sat on Minsky's thesis committee [23].
- **Belief:** Used McCulloch–Pitts neurons as the abstract design language for computer "elements" [10]. In the Macy discussions he supplied the digital/analog definitions that Gerard quoted [13].
- **Silhouette:** Stocky, high forehead, always in a formal three-piece suit *(verify)*.

### Ralph W. Gerard (1900–1974)
- **Role and institution:** Neurophysiologist, University of Chicago. Macy participant [12][13].
- **Dissent:** Argued the brain works in a far more "analog" than "digital" way. This was the main dissent inside cybernetics against the McCulloch–Pitts picture [12][13].

### Alan M. Turing (1912–1954)
- **Role and institution:** In 1948 at the National Physical Laboratory, Teddington [5]. In 1950 at Manchester *(Manchester affiliation; verify for on-screen text)*. Author of "Intelligent Machinery" (1948) [21] and "Computing Machinery and Intelligence" (1950) [6].
- **Belief:** The question "Can machines think?" was "too meaningless to deserve discussion" [6]. The productive path was to build a child-machine and educate it [6]. He also sketched trainable random networks of neuron-like units [21].
- **Silhouette:** Athletic (a serious long-distance runner), dark hair, rumpled tweed jacket *(verify)*.

### Claude E. Shannon (1916–2001)
- **Role and institution:** Bell Telephone Laboratories, Murray Hill, NJ [7]. Co-author of the Dartmouth proposal [7]. Built the Theseus maze-mouse [22].
- **Silhouette:** Tall and slender, with an angular face and swept-back hair *(verify)*.

### Marvin L. Minsky (1927–2016)
- **Role and institution:** In 1951 a Princeton mathematics graduate student who built SNARC at Harvard [15][23]. In 1955 a Harvard Junior Fellow in Mathematics and Neurology [7].
- **Belief:** In the early 1950s he was a neural-net builder. After 1956 he turned to symbolic AI. In his own words: "In the early 1950s I developed many theories about ways to make neural networks learn — but none of these seemed likely to lead to high-level kinds of idea" [16].
- **Silhouette:** Late 20s in 1956, slight build, short hair *(verify against the 1956 Dartmouth lawn photo)*.

### John McCarthy (1927–2011)
- **Role and institution:** Assistant Professor of Mathematics, Dartmouth College [7][16]. Lead organizer of the workshop and coiner of the term "artificial intelligence" [7][19].
- **Belief:** AI should be built through formal reasoning. He chose the new name partly to escape association with cybernetics, writing in 1988: "Its concentration on analog feedback seemed misguided" [19].
- **Silhouette:** Late 20s in 1956, glasses; the famous beard is later *(verify)*.

### Nathaniel Rochester (1919–2001)
- **Role and institution:** IBM; designer of the IBM 701 [16]. Co-author of the proposal [7].
- **Work:** Led the IBM 704 simulations of Hebb's cell-assembly theory [18].

### Allen Newell (1927–1992), Herbert A. Simon (1916–2001), J. C. "Cliff" Shaw (1922–1991)
- **Role and institution:** RAND Corporation in Santa Monica, plus the Carnegie Institute of Technology in Pittsburgh (Simon, and Newell as a student) [17].
- **Work:** Built the Logic Theorist, the symbolic alternative [17].
- **Silhouette:** Simon: slim, glasses, receding hairline, jacket and tie. Newell: tall, broad-shouldered *(verify both)*.

### Ray Solomonoff (1926–2009)
- **Role:** One of only three who stayed the whole Dartmouth summer [16]. His "inductive inference machine" work drew Minsky toward symbolic methods [16].

### Robert S. Morison
- **Role:** Director of Biological and Medical Research at the Rockefeller Foundation. Funded Dartmouth with caution [16].

---

## 4. The belief of the age

**What the field believed (c. 1943–1956)**

1. **The brain is a logic machine, and logic machines can be built.** McCulloch & Pitts argued that because neurons are "all-or-none", "neural events and the relations among them can be treated by means of propositional logic" [1]. Von Neumann transplanted the idea directly into computer design: "neurons of the higher animals are definitely elements in the above sense," with "all-or-none character" [10][11]. The press language of "electronic brains" and "giant brains" grew from this two-way analogy; Edmund Berkeley's *Giant Brains, or Machines That Think* came out in 1949 [14].
   - Held by: McCulloch, Pitts, von Neumann (as a design abstraction), most Macy mathematicians [12].
2. **Mind is feedback and information, in animals and machines alike.** Wiener: "We have decided to call the entire field of control and communication theory, whether in the machine or in the animal, by the name Cybernetics" [5].
   - Held by: the Macy core group of Wiener, Rosenblueth, McCulloch, Bateson, Mead and others [12].
3. **Learning lives in changing connections.** Hebb's postulate [3]. Turing's punishment/reward child machine and trainable unorganised machines [6][21]. Minsky's SNARC [15]. Rochester's cell-assembly simulations [18].
4. **Intelligence can be precisely described, and therefore simulated, soon.** The Dartmouth "conjecture" [7]. The 1958 ten-year predictions [20]. Turing's "about fifty years" (2000) prediction for the imitation game [6]. Turing was relatively cautious; his deadline was half a century away.

**Who dissented, and how**
- **Analog vs. digital (inside cybernetics).** Ralph Gerard argued the brain is much more analog than digital. "Digital" vs. "analogical" became a recurring Macy debate. One meeting argued at length about Köhler's continuous Gestalt field model against McCulloch–Pitts's discrete coding [12][13].
- **The biologists' indifference.** The 1943 paper initially "made barely a ripple among brain scientists" [9].
- **The empirical undoing.** The 1959 frog's-eye study, co-authored by Pitts himself, found the retina doing rich, analog-flavored feature detection. Per Lettvin, it showed logic "didn't play the important or central part that one would have expected" [9][26].
- **The funder's caution.** Robert Morison of the Rockefeller Foundation found "this new field of mathematical models for thought, though very challenging for the long run, is still difficult to grasp very clearly", and gave about half the money [16].
- **The symbolists versus the brain-modelers.** McCarthy deliberately avoided "cybernetics" [19]. Newell and Simon offered programs that manipulated symbols, not simulated neurons [17]. Minsky defected from nets to symbols after 1956 [16].

**How long it lasted, and what ended it**
- **The logical-neuron picture as neuroscience:** roughly 1943 to 1959. The frog's-eye paper is the symbolic end for Pitts [9]. As engineering, the threshold unit never died: it is the ancestor of the perceptron (next era) and of every "neuron" in modern networks.
- **Cybernetics as the umbrella:** the Macy series ended in 1953 [12]. "AI" took its place at Dartmouth in 1955–56 by deliberate rebranding [19].
- **The fast-arrival optimism:** it peaked in 1956–1967 with Simon and Newell in 1958 [20] and Minsky in 1967 [27]. It eroded as the deadlines passed. In 1982 Minsky said "The AI problem is one of the hardest science has ever undertaken" (quoted via a secondary roundup [27]; verify before using). The chess prediction came true only in 1997, 29 years after its 1968 deadline [20].
- **What ended it:** the funding cuts and critiques of the late 1960s and early 1970s. These belong to the next dossiers (Perceptrons, Lighthill, the first winter).

---

## 5. Experiments and results

### 5.1 The McCulloch–Pitts net (1943), a paper machine
- **No apparatus.** It is pure logic, written in Carnap's "Language II" with *Principia* notation [1].
- **The five assumptions, verbatim [1]:**
  1. "The activity of the neuron is an 'all-or-none' process."
  2. "A certain fixed number of synapses must be excited within the period of latent addition in order to excite a neuron at any time, and this number is independent of previous activity and position on the neuron."
  3. "The only significant delay within the nervous system is synaptic delay."
  4. "The activity of any inhibitory synapse absolutely prevents excitation of the neuron at that time."
  5. "The structure of the net does not change with time."
- **Results:**
  - The behavior of every net without "circles" (loops) can be described by a logical expression. The reverse holds only for expressions "satisfying certain conditions": for any such expression a net can be found that behaves as it describes [1].
  - Nets with circles need "more complicated logical means" and give memory-like behavior, where "reference to time past becomes indefinite" [1].
  - With tape and scanners, the nets are equivalent to Turing machines [1].
- **The figures:** Figure 1 shows nine small nets (a–i): little triangular cell bodies, axons ending in loops (excitatory) and filled circles (inhibitory). Nets 1d–1e include a heat/cold illusion example *(the heat-illusion reading of Fig. 1d/e is from the paper's text; verify before animating)*.
- **Art note:** Figure 1 is a perfect paper-cut motif: triangles, threads and knots.
- **Reference list:** only three works: Carnap (1938), Hilbert & Ackermann (1927), and Russell & Whitehead's *Principia Mathematica* (1925) [1].

### 5.2 Hebb's postulate and cell-assemblies (1949)
- **A theory, not a machine.** Repeated co-activation grows "synaptic knobs" that increase "the area of contact between the afferent axon and efferent soma" (Hebb's own "most probable suggestion") [3].
- **Rochester et al., IBM 704 (published 1956):**
  - Simulated nets of model neurons to test Hebb's and Milner's theories [18].
  - Showed "formation of cell assemblies from an unorganized net of neurons" [18].
  - Admitted: "The cell assemblies do not yet act just as the theory requires" [18].
  - Reported network sizes differ across later accounts (69 vs. 512 neurons) [18]. **Do not put a number on screen** without checking the paper.
- **Rochester's Dartmouth section** says early simulation was premature: "An attempt was made to test a theory of how the brain does it", footnoted to Hebb [7].

### 5.3 SNARC (Stochastic Neural Analog Reinforcement Calculator), summer 1951
Physical apparatus, in Minsky's words to Jeremy Bernstein (*New Yorker*, 14 Dec 1981) [15]:
- About **40 "neurons"**: "I thought it would work pretty well with about forty neurons."
- Each neuron "with just six vacuum tubes and a motor". In total, "It had three hundred tubes and a lot of motors."
  - *Contested count:* the AIMA textbook says 3,000 tubes [29]. Minsky's own arithmetic (40 × 6 ≈ 240–300) supports about 300.
- Memory stored "in the positions of its control knobs—forty of them". While learning, "it used the clutches to adjust its own knobs". The clutches were "automatic electric clutches, which we machined ourselves." Secondary sources identify the knobs as potentiometers, the kind used in volume controls [29].
- "We used a surplus gyropilot from a B-24 bomber to move the clutches" [15]. The secondary account names it a Honeywell C-1 autopilot driving a chain to all 40 synapses [29].
- **Task:** simulated "rats" running a maze through the network. "because of an electronic accident in our design we could put two or three rats in the same maze and follow them all … If one of them found a good path, the others would tend to follow it." "We sort of quit science for a while to watch the machine" [15].
- **Robustness:** "If one of the neurons wasn't working, it wouldn't make much of a difference"; "I don't think we ever debugged our machine completely, but that didn't matter" [15].
- **Funding:** "a couple of thousand dollars from the Office of Naval Research", arranged by psychologist George Miller [15].
- **Limits (Minsky):** "My Harvard machine was basically Skinnerian … It could never formulate a plan" [15].
- **Physical survival:** no known photograph of the full assembly; reportedly only one neuron unit survives [29] *(secondary; verify before stating on screen)*.
- **Art note:** a rack of glowing tubes, forty brass knobs turning by themselves, a war-surplus bomber gyro whirring, and blinking lights as the "rats".

### 5.4 Theseus, Shannon's maze mouse (1950; Bell Labs film 1952)
- A wooden mouse with a bar magnet and copper wire "whiskers", on a 5×5 grid of 25 squares with movable metal walls [22].
- Under the floor, an electromagnet on a motorized carriage drags the mouse. The "intelligence" is in telephone-exchange relays under the floor, one per square, remembering the last exit direction [22].
- First run about 2 minutes of trial and error to reach the brass "cheese" (which rings a buzzer). Second run about 15 seconds with no wrong turns [22].
- Demonstrated at the 1951 Macy conference. The original is at the MIT Museum [22].
- *Note:* Theseus is relay memory, not a neural net. It belongs to the cybernetic "learning machine" culture.

### 5.5 Turing's child machine experiment (reported 1950)
- "I have done some experiments with one such child machine, and succeeded in teaching it a few things, but the teaching method was too unorthodox for the experiment to be considered really successful" [6].
- The 1948 NPL report describes B-type "unorganised machines": randomly connected two-state units that can be trained by "appropriate interference, mimicking education" [21].

### 5.6 The Logic Theorist (1955–57), the symbolic alternative
- **Hand-simulated in January 1956 with people as components.** Simon's family and students each held cards representing program subroutines [17].
- **Machine runs:** the first JOHNNIAC proof came in August 1956 per Cordeschi [25] and the Moews recreation project [32]. The 2026 reconstruction says machine-executable proofs came with IPL-II on the JOHNNIAC "in late 1956 and early 1957", and that the headline 38-of-52 result "stems from these 1957 runs" [17]. These accounts do not conflict: a first proof in August, the full results later.
- **Results:** proved 38 of the first 52 theorems of *Principia* chapter 2. Found a shorter proof of theorem 2.85; Simon showed it to Russell, who "responded with delight" (McCorduck, via [17]).
- **Language:** written in IPL, the team's own list-processing language [17].

### 5.7 The Dartmouth budget (from the proposal) [7]
- Faculty salaries of $1,200 each (6 × $1,200 = $7,200).
- Graduate students at $700 each (2 × $700 = $1,400).
- Travel and rent for 8 participants at about $300 each = $2,400.
- Secretarial $650 plus organization $200 ($850).
- Additional travel $600; contingencies $550.
- **Total requested: $13,500.** Rockefeller granted about half [16]. The Rockefeller Foundation's own retrospective gives the figure as "a $7,500 grant" [31].

---

## 6. Verified quotes

All checked verbatim against the primary text unless noted.

1. **McCulloch & Pitts, 1943 (abstract, first sentence):** "Because of the "all-or-none" character of nervous activity, neural events and the relations among them can be treated by means of propositional logic." Source: *Bull. Math. Biophys.* 5:115 [1]. Context: the paper's opening claim.
2. **McCulloch & Pitts, 1943 (the Turing result):** "every net, if furnished with a tape, scanners connected to afferents, and suitable efferents to perform the necessary motor-operations, can compute only such numbers as can a Turing machine; second, that each of the latter numbers can be computed by such a net; and that nets with circles can compute, without scanners and a tape, some of the numbers the machine can, but no others, and not all of them." p. 129 [1]. (The PDF's OCR duplicates a clause; this is the corrected reading. Check against a print copy.)
   - Same passage: "This is of interest as affording a psychological justification of the Turing definition of computability and its equivalents, Church's λ-definability and Kleene's primitive recursiveness: If any number can be computed by an organism, it is computable by these definitions, and conversely." [1]
3. **McCulloch & Pitts, 1943, assumption 5:** "The structure of the net does not change with time." p. 118 [1]. Context: why these nets don't learn.
4. **McCulloch & Pitts, 1943 (conclusion):** "Thus both the formal and the final aspects of that activity which we are wont to call mental are rigorously deduceable from present neurophysiology." p. 132 [1]. Also: "in such systems "Mind" no longer "goes more ghostly than a ghost."" [1].
5. **Hebb, 1949, p. 62, "A Neurophysiological Postulate":** "Let us assume then that the persistence or repetition of a reverberatory activity (or "trace") tends to induce lasting cellular changes that add to its stability. The assumption can be precisely stated as follows: When an axon of cell A is near enough to excite a cell B and repeatedly or persistently takes part in firing it, some growth process or metabolic change takes place in one or both cells such that A's efficiency, as one of the cells firing B, is increased." [3][4]
   - **"Neurons that fire together, wire together" is NOT Hebb's wording.** Do not attribute it to him.
6. **Wiener, 1948 (Introduction):** "We have decided to call the entire field of control and communication theory, whether in the machine or in the animal, by the name Cybernetics, which we form from the Greek χυβερνήτης or steersman." [5]
7. **Wiener, 1948 (Ch. V, "Computing Machines and the Nervous System"):** "The mechanical brain does not secrete thought "as the liver does bile," as the earlier materialists claimed, nor does it put it out in the form of energy, as the muscle puts out its activity. Information is information, not matter or energy. No materialism which does not admit this can survive at the present day." [5]
8. **Wiener, 1948, on von Bonin seeing McCulloch's reading-machine diagram:** "Is this a diagram of the fourth layer of the visual cortex of the brain?" (von Bonin's question as recounted by Wiener) [5].
9. **Turing, 1950:** "I believe that in about fifty years' time it will be possible to programme computers, with a storage capacity of about 10⁹, to make them play the imitation game so well that an average interrogator will not have more than 70 per cent. chance of making the right identification after five minutes of questioning." [6]
   - Next: "The original question, "Can machines think?" I believe to be too meaningless to deserve discussion. Nevertheless I believe that at the end of the century the use of words and general educated opinion will have altered so much that one will be able to speak of machines thinking without expecting to be contradicted." [6]
10. **Turing, 1950, sect. 7 "Learning Machines":** "Instead of trying to produce a programme to simulate the adult mind, why not rather try to produce one which simulates the child's? If this were then subjected to an appropriate course of education one would obtain the adult brain. Presumably the child-brain is something like a note-book as one buys it from the stationers. Rather little mechanism, and lots of blank sheets." [6]
    - Punctuation differs between reprints ("child brain"/"notebook"/"stationer's"); the *Mind* original as rendered on OUP uses "child-brain", "note-book", "stationers".
11. **Turing, 1950 (closing line):** "We can only see a short distance ahead, but we can see plenty there that needs to be done." [6]
12. **Dartmouth proposal, 31 Aug 1955:** "We propose that a 2 month, 10 man study of artificial intelligence be carried out during the summer of 1956 at Dartmouth College in Hanover, New Hampshire. The study is to proceed on the basis of the conjecture that every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it. An attempt will be made to find how to make machines use language, form abstractions and concepts, solve kinds of problems now reserved for humans, and improve themselves. We think that a significant advance can be made in one or more of these problems if a carefully selected group of scientists work on it together for a summer." [7]
13. **Dartmouth proposal, topic 3 "Neuron Nets":** "How can a set of (hypothetical) neurons be arranged so as to form concepts. Considerable theoretical and experimental work has been done on this problem by Uttley, Rashevsky and his group, Farley and Clark, Pitts and McCulloch, Minsky, Rochester and Holland, and others. Partial results have been obtained but the problem needs more theoretical work." [7]
14. **Dartmouth proposal, topic 1:** "the major obstacle is not lack of machine capacity, but our inability to write programs taking full advantage of what we have." [7]
15. **Dartmouth proposal, Minsky's bio:** "Minsky has built a machine for simulating learning by nerve nets" [7].
16. **Von Neumann, EDVAC First Draft, 1945, §4.2:** "Following W. Pitts and W. S. MacCulloch ("A logical calculus of the ideas immanent in nervous activity", Bull. Math. Biophysics, Vol. 5 (1943), pp. 115-133) we ignore the more complicated aspects of neuron functioning". Note von Neumann's misspelling "MacCulloch", and that author order varies by transcription [10][11].
17. **McCarthy, 1988 (review of *The Question of Artificial Intelligence*):** "one of the reasons for inventing the term "artificial intelligence" was to escape association with "cybernetics". Its concentration on analog feedback seemed misguided, and I wished to avoid having either to accept Norbert (not Robert) Wiener as a guru or having to argue with him." [19]
    - Checked verbatim against McCarthy's own page on his Stanford site [19]. The sentence there begins "As for myself, one of the reasons…". Kline's book reportedly prints "association" for "concentration"; use McCarthy's page.
18. **Robert Morison (Rockefeller Foundation) to the organizers:** "I hope you won't feel that we are being overcautious, but the general feeling here is that this new field of mathematical models for thought, though very challenging for the long run, is still difficult to grasp very clearly. This suggests a modest gamble for exploring a new approach, but there is a great deal of hesitancy about risking any very substantial amount at this stage." Quoted by G. Solomonoff from the Rockefeller Foundation archives [16]. The exact letter date is unclear in her citation; say "the foundation replied".
19. **McCarthy, recalled later (via G. Solomonoff):** "one was that Rockefeller didn't give us anywhere near enough money for that; and the people had other commitments and so they came for short times and different times." [16]
20. **Minsky, retrospective (via G. Solomonoff, from Ray Solomonoff memorial pages):** "In the early 1950s I developed many theories about ways to make neural networks learn — but none of these seemed likely to lead to high-level kinds of idea." [16]
21. **Minsky to Bernstein, *New Yorker* 1981:** the SNARC quotes in §5.3 [15]. These are a 1981 recollection of 1951.
22. **Simon & Newell, 1958, *Operations Research* 6(1):** "That within ten years a digital computer will be the world's chess champion, unless the rules bar it from competition." [20]
23. **Minsky, 1967, *Computation: Finite and Infinite Machines*, p. 2:** "Within a generation, I am convinced, few compartments of intellect will remain outside the machine's realm—the problems of creating "artificial intelligence" will be substantially solved." [27]
    - The common shortened version ("the problem … will substantially be solved") is a misquotation.
24. **Simon, 1960, *The New Science of Management Decision*, Lecture III (7 April 1960), p. 38:** ". . . machines will be capable, within twenty years, of doing any work that a man can do." Verified from scans by Quote Investigator [27]. Often misdated to 1965, when it was reprinted in *The Shape of Automation*.

**UNVERIFIED — do not use as a quote**
- **Simon, January 1956: "Over Christmas, Allen Newell and I invented a thinking machine."** This is second-hand, Feigenbaum's recollection as told to McCorduck. It may be used only as "as a student later recalled, Simon told his class…" [24].
- **Von Neumann on Minsky's thesis: "If it isn't now, it will be someday."** Anecdote with no primary source located. It is not in the excerpt of the 1981 Bernstein profile checked [15]. Do not use.
- **Wiener on Pitts: "without question the strongest young scientist whom I have ever met."** Reported by Gefter [9] without the primary letter. Use as reported speech only.
- **Pitts's letter to Russell, and Russell's invitation.** Biographical tradition (Gefter, after Conway & Siegelman); no surviving letter is cited.
- **"Neurons that fire together, wire together."** Not Hebb's; a later paraphrase usually traced to Carla Shatz (1992).
- **Minsky 1982: "The AI problem is one of the hardest science has ever undertaken."** Found only second-hand, in Ellen Ullman (2005) as reported by Quote Investigator [27]; the original 1982 source is not identified.

---

## 7. Debates and controversies

1. **Did the Logic Theorist actually run on a computer at Dartmouth?**
   - *Popular account:* Newell and Simon "arrived with … a working AI program" and met a lukewarm reception [17].
   - *Counter:* the 2026 reconstruction says it was "not yet running on a machine" at the workshop, but "essentially specified" and hand-simulated [17]. Cordeschi dates the first JOHNNIAC-printed proof to August 1956, overlapping the end of the workshop [25]. Newell and Simon were expected only "for the first two weeks" [16].
   - **Verdict after fact-check:** this is less contested than it looks. Newell and Simon were scheduled only "for the first two weeks" (late June to early July) [16], and the first machine proof came in August [25][32]. So the program was not running on a computer while they were at Dartmouth. The popular "working program" line is the one to avoid.
   - **Film-safe wording:** "They brought a program that had been worked out by hand and would soon run on RAND's JOHNNIAC."
2. **Who coined "artificial intelligence," and why?**
   - The proposal is the first documented use [7]. McCarthy says he chose it to escape cybernetics [19].
   - Yet in a recorded 1974 interview for *Machines Who Think* (1979) he told Pamela McCorduck: "I won't swear that I hadn't seen it before - a vague memory that someone else had used the word" [19 (Manion summary; the primary audio is in McCorduck's papers at CMU, access restricted, so treat as second-hand and do not voice it as a quote)]. Credit McCarthy for putting the term into circulation.
3. **SNARC's specifications.**
   - 300 tubes (Minsky 1981 [15]; Wikipedia) vs. 3,000 (AIMA [29]).
   - 1951 (Minsky [15]) vs. summer 1950 (AIMA).
   - B-24 vs. B-52; the B-52 is anachronistic [29].
   - **Use Minsky's own figures:** summer 1951, about 40 neurons, about 300 tubes, B-24 gyropilot.
4. **Were McCulloch–Pitts nets "Turing-complete"?**
   - Only with an external tape and scanners. Finite nets with loops compute "some of the numbers the machine can, but no others, and not all of them" [1]. Kleene (1956) later showed finite nets correspond to what are now called regular events, i.e. finite automata *(background; verify if used)*.
5. **The Wiener–McCulloch–Pitts rupture (c. 1952).**
   - Gefter, following Conway & Siegelman, reports that Margaret Wiener invented a story that McCulloch's "boys" had seduced the Wieners' daughter Barbara. Wiener's telegram said "all connection between me and your projects is permanently abolished" [9].
   - This is one account resting on family testimony and letters. Present it as "according to Wiener's biographers" and do not dramatize it as fact.
6. **Analog vs. digital brain (Macy).**
   - *Digital side:* McCulloch, Pitts, von Neumann as design abstraction.
   - *Analog side:* Gerard, Köhler's Gestalt field theory [12][13].
   - Both are partly right by modern lights: spikes are all-or-none, but timing, rates and dendritic integration are graded.
7. **Was Dartmouth the "birth of AI"?**
   - *For:* it named the field, gathered the founders, and McCarthy, Minsky, Newell and Simon went on to found the major AI labs [16][28].
   - *Against:* attendance was patchy, "Many participants only showed up for a day or even less", and McCarthy said "Rockefeller didn't give us anywhere near enough money" [16]. MacKay and Holland never came; More replaced Rochester for three weeks [16].
   - **Length (contested):** six weeks (Nilsson, the traditional figure), eight weeks (Solomonoff's and More's notes, c. 18 June – 17 August [16]), or five weeks (the Rockefeller Foundation's own retrospective, probably the period its grant covered [31]). Film-safe: "one summer, about two months".
8. **Did Turing anticipate connectionism?**
   - Copeland & Proudfoot (1996) say yes, citing the 1948 B-type unorganised machines [21]. Others call it "proto-connectionist" [21].
   - The report went unpublished until 1968, so it had little influence on the 1950s field.
9. **Wiener's book title and page numbers.** Pagination differs between the 1948 and 1961/2019 editions. Cite by chapter.

---

## 8. Misconceptions to avoid

- **Don't say McCulloch–Pitts neurons learned.** Their nets had fixed structure (assumption 5). Learning came from Hebb (1949) as theory, and later from Rosenblatt's perceptron (1957–58) as a working rule.
- **Don't call the 1943 paper an instant sensation among neuroscientists.** Its big early reader was von Neumann, for computer design [9][10].
- **Don't put "neurons that fire together, wire together" in Hebb's mouth.** Also, Hebb's wording is causal ("takes part in firing it"), not mere co-firing.
- **Don't say "Dartmouth ignored neural nets."** "Neuron Nets" was topic 3. Minsky's bio cites his nerve-net machine, and Rochester's section discusses neuron-net simulation tied to Hebb [7]. What's true is that the summer marked a pivot toward symbolic methods [16].
- **Don't say the Turing test was proposed as a definition of thinking.** Turing called "Can machines think?" "too meaningless to deserve discussion" and offered the game as a replacement question [6].
- **Don't credit Wiener with inventing feedback, or cybernetics as a word.** Ampère used "cybernétique" in 1834. Wiener credits Maxwell's 1868 paper on governors [5].
- **Don't put 3,000 tubes or a B-52 on screen for SNARC.**
- **Don't say Logic Theorist proved "all" of *Principia*.** It proved 38 of the first 52 theorems of chapter 2 [17].
- **Don't say the proposal predicted human-level AI in one summer.** It hoped for "a significant advance … in one or more of these problems" [7]. The bold decade-scale predictions came in 1958–1967 [20][27].
- **Don't say Pitts was a professor or held an advanced degree.** He never finished a doctorate and burned his dissertation [9][34]. Whether he held any degree at all is contested (see §3).
- **Don't treat the misspelled "MacCulloch" in the EDVAC report as an error in our film.** If shown on screen, it is von Neumann's spelling.
- **Don't present Theseus as a neural network.** Its memory was relays.

---

## 9. Curiosity hooks

1. **The paper that started neural networks cites only three works:** Carnap, Hilbert & Ackermann, and *Principia Mathematica*. No biology papers at all [1].
2. **The first stored-program computer design has exactly one citation, and it's a paper about neurons.** Von Neumann's 1945 EDVAC draft describes vacuum-tube "elements" as neurons, "Following W. Pitts and W. S. MacCulloch" [10][11].
3. **A teenage runaway co-wrote it.** Pitts was about 12 when he read *Principia Mathematica* in a library in three days and found mistakes (Gefter's account; the letter to Russell is unverified). He was 19–20 when the 1943 paper appeared, and never finished a doctorate [9][34].
4. **A reading machine for the blind looked like a brain.** When the neuroanatomist von Bonin saw McCulloch's 1947 diagram for a device to read print aloud at any type size, he asked, "Is this a diagram of the fourth layer of the visual cortex of the brain?" [5]. Recognizing a shape whatever its size is the same invariance problem that convolutional networks would tackle decades later.
5. **A bomber autopilot taught a machine to learn.** SNARC's 40 "synapses" were knobs turned by clutches driven by a surplus B-24 gyropilot. Thanks to a wiring accident, its simulated rats followed each other: "We sort of quit science for a while to watch the machine" [15].
6. **AI was named to dodge a person.** McCarthy picked "artificial intelligence" partly to avoid "having either to accept Norbert (not Robert) Wiener as a guru or having to argue with him" [19].
7. **The birth of AI was underfunded by half.** They asked for $13,500, about $1,200 a head for faculty. Rockefeller worried the field was "difficult to grasp very clearly" and offered a "modest gamble" [7][16].
8. **The dictionary is still there.** In 2006 Trenchard More led the organizers back to the old math rooms. The big dictionary in which the 1956 group had looked up "heuristic" was still on its stand [16].
9. **A human computer made of a family.** In January 1956 the Logic Theorist was first run by Simon's wife, children and students, each holding cards for one subroutine [17].
10. **Turing's 2000 deadline and the coal scuttle.** Turing noted that his child machine could not be "asked to go out and fill the coal scuttle", and that the other children would make "excessive fun of it" at school [6].

---

## 10. Visual and dramatic details

- **Hinsdale, Illinois, early 1940s:** McCulloch's family home in a rural suburb outside Chicago, where Pitts lived with the family [9]. Late-night logic sessions with whisky and cigarettes are part of the McCulloch legend *(atmosphere; avoid specifics without a source)*.
- **The paper's look:** dense logical notation, the upright "E" and arrow substitutions forced by "typographical necessity" [1], and the Figure 1 neuron diagrams (triangles and loops). Use as paper-cut ornament.
- **The Beekman Hotel, Park Avenue, New York:** venue of the Macy conferences (at least the 6th, March 1949) [12]. Format: "a group of modest size, not exceeding some twenty in number … for two successive days in all-day series of informal papers" [5]. Picture a long table, smoke haze, a dozen disciplines interrupting each other.
- **MIT, 1940s–50s:** Wiener's office, where Lettvin brought Pitts in 1943 [9].
- **Bell Labs, Murray Hill:** Theseus's 5×5 maze board, a mouse with copper whiskers, the relay bank, brass "cheese" and a buzzer [22].
- **Harvard, summer 1951:** SNARC as a rack of about 300 glowing tubes, 40 knobs, hand-machined clutches, a chain, a bomber gyro and lights tracking "rats" [15][29].
- **Dartmouth, Hanover, New Hampshire, summer 1956:** sessions on the top floor of the mathematics building (Dartmouth Hall at the time) [16]. Furnishings: a big dictionary on a stand, windows looking out over the green. Most visitors stayed at the Hanover Inn; Solomonoff and Minsky in professors' apartments [16].
  - A widely reproduced lawn photograph shows several attendees seated outdoors *(credit and identities to verify before use)*.
  - Summer in New Hampshire: green, heat, open windows *(atmosphere)*.
- **RAND, Santa Monica:** the JOHNNIAC computer. For the January 1956 hand simulation, a family around a table each holding index cards [17].
- **Pittsburgh classroom, January 1956:** Simon announcing a "thinking machine" (use only as a reported recollection) [24].
- **Endings:** a Cambridge boarding house in May 1969 [9]. Pitts setting fire to his dissertation and notes [9] is a powerful but sad image; handle with restraint.
- **Period objects:** slide rules; punched cards; relay racks; vacuum tubes; teletype; chalkboards of logic; Principia volumes; ashtrays; fedoras and three-piece suits (1940s), shirtsleeves in summer 1956.

---

## 11. Sources

1. McCulloch, W. S. & Pitts, W. (1943). "A Logical Calculus of the Ideas Immanent in Nervous Activity." *Bulletin of Mathematical Biophysics* 5: 115–133. Full text read: https://home.csulb.edu/~cwallis/382/readings/482/mccolloch.logical.calculus.ideas.1943.pdf (also scanned at https://www.cs.cmu.edu/~./epxing/Class/10715/reading/McCulloch.and.Pitts.pdf)
2. Springer record of the paper: https://link.springer.com/article/10.1007/BF02478259
3. Hebb, D. O. (1949). *The Organization of Behavior: A Neuropsychological Theory*. Wiley. Full text: https://archive.org/details/in.ernet.dli.2015.168156 (text file: https://archive.org/download/in.ernet.dli.2015.168156/2015.168156.The-Organization-Of-Behavior-A-Neuropsychological-Theory_djvu.txt)
4. Hebbian theory, p. 62 citation and interpretive notes: https://en.wikipedia.org/wiki/Hebbian_theory ; Keysers & Gazzola review on causality in Hebb's wording: https://pmc.ncbi.nlm.nih.gov/articles/PMC4006178/
5. Wiener, N. (1948/1961). *Cybernetics: Or Control and Communication in the Animal and the Machine*. MIT Press reissue (Part I = original 1948 text): https://electronicliteraturereview.org/downloads/PDF/Wiener_1948.pdf
6. Turing, A. M. (1950). "Computing Machinery and Intelligence." *Mind* 59(236): 433–460. https://academic.oup.com/mind/article/LIX/236/433/986238 ; text copy: https://redirect.cs.umbc.edu/courses/471/papers/turing.pdf
7. McCarthy, J., Minsky, M. L., Rochester, N., Shannon, C. E. (31 Aug 1955). "A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence." http://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html
8. Dartmouth College, "Artificial Intelligence (AI) Coined at Dartmouth": https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth
9. Gefter, A. (2015). "The Man Who Tried to Redeem the World with Logic." *Nautilus*. https://nautil.us/the-man-who-tried-to-redeem-the-world-with-logic-235253/
10. Von Neumann, J. (1945). *First Draft of a Report on the EDVAC*. https://cs.carleton.edu/faculty/jondich/courses/cs208_s19/assignments/16_files/edvac.pdf ; https://fab.cba.mit.edu/classes/862.16/notes/computation/vonNeumann-1945.pdf
11. *Communications of the ACM* on the First Draft's single citation: https://dl.acm.org/doi/fullHtml/10.1145/3372920
12. American Society for Cybernetics, "Summary: The Macy Conferences": https://www.asc-cybernetics.org/foundations/history/MacySummary.htm ; Pias (ed.), *Cybernetics: The Macy Conferences 1946–1953* (catalog): https://search.library.wisc.edu/catalog/9913310587802121
13. Gerard, R. W., "Some of the Problems Concerning Digital Notions in the Central Nervous System" (Macy 7th conference, 1950), in Pias ed.: https://diaphanes.com/titel/some-of-the-problems-concerning-digital-notions-in-the-central-nervous-system-3535 ; Ralph W. Gerard: https://en.wikipedia.org/wiki/Ralph_W._Gerard
14. History of Information, "Norbert Wiener Issues 'Cybernetics'": https://www.historyofinformation.com/detail.php?id=664 ; https://en.wikipedia.org/wiki/Cybernetics:_Or_Control_and_Communication_in_the_Animal_and_the_Machine
14a. IEEE Technology and Society, review of R. Kline, *The Cybernetics Moment* (2015), source of "over 22 000 copies sold by the end of 1949": https://technologyandsociety.org/the-cybernetics-movement/
15. Bernstein, J. (14 Dec 1981). Profile of Marvin Minsky, *The New Yorker*, as excerpted at cyberneticzoo: https://cyberneticzoo.com/mazesolvers/1951-maze-solver-minsky-edmonds-american/
16. Solomonoff, G. "Ray Solomonoff and the Dartmouth Summer Research Project in Artificial Intelligence, 1956" (from Rockefeller Foundation archive letters and participants' notes): https://raysolomonoff.com/dartmouth/dartray.pdf
17. "Executable Archaeology: Reanimating the Logic Theorist from its IPL-V Source" (arXiv 2603.13514, 2026): https://arxiv.org/html/2603.13514v1 ; Logic Theorist overview: https://en.wikipedia.org/wiki/Logic_Theorist ; https://www.historyofinformation.com/detail.php?id=742
18. Rochester, N., Holland, J. H., Haibt, L. H., Duda, W. L. (1956). "Tests on a cell assembly theory of the action of the brain, using a large digital computer." *IRE Trans. Information Theory* IT-2(3): 80–93. https://doi.org/10.1109/TIT.1956.1056810 ; MIT Press reprint note: https://direct.mit.edu/books/edited-volume/5431/chapter/3958513/1956-N-Rochester-J-H-Holland-L-H-Haibt-and-W-L ; Modha on Rochester: https://modha.org/2006/09/nathaniel-rochester-iii-1919-2001/
19. McCarthy, J. (1988). Review of *The Question of Artificial Intelligence* (B. Bloomfield, ed.), primary text on McCarthy's site: http://www-formal.stanford.edu/jmc/reviews/bloomfield/bloomfield.html ; quoted in: https://simonwillison.net/2024/Jan/7/call-it-ai/ ; https://stream.syscoi.com/2024/05/09/john-mccarthy-and-the-ai-schism-from-cybernetics-links-for-reference/ ; counterpoint (McCarthy to McCorduck, 1974): https://seanmanion.substack.com/p/artificial-imitation-did-john-mccarthy
20. Simon, H. A. & Newell, A. (1958). "Heuristic Problem Solving: The Next Advance in Operations Research." *Operations Research* 6(1). Quote Investigator: https://quoteinvestigator.com/2024/04/18/ai-prediction/ ; Kuipers, "Progress in AI": https://web.eecs.umich.edu/~kuipers/opinions/AI-progress.html ; https://en.wikipedia.org/wiki/Human%E2%80%93computer_chess_matches
21. Copeland, B. J. & Proudfoot, D. (1996). "On Alan Turing's Anticipation of Connectionism." *Synthese* 108: 361–377. https://link.springer.com/content/pdf/10.1007/BF00413694.pdf ; Turing (1948) "Intelligent Machinery": https://www.alanturing.net/turing_archive/pages/pub/turing3/turing3.pdf ; https://en.wikipedia.org/wiki/Unorganized_machine
22. Theseus: MIT Technology Review, "Mighty mouse" (2018): https://www.technologyreview.com/2018/12/19/138508/mighty-mouse/ ; Gíslason, "Claude Shannon's Maze-Solving Mouse": https://hjalli.com/posts/shannons-mouse/ ; Bell Labs film: https://www.youtube.com/watch?v=_9_AEVQ_p74
23. Minsky PhD thesis (Princeton, 1954), scan: https://people.csail.mit.edu/brooks/idocs/Marvin_Minsky_PhD_Princeton_1953_1954.pdf ; ACM Turing Award biography: https://amturing.acm.org/award_winners/minsky_7440781.cfm
24. "Over Christmas, We Invented a Thinking Machine" (account via McCorduck/Feigenbaum): https://pressbooks.pub/thiscouldbeimportantbook/chapter/over-christmas-we-invented-a-thinking-machine/
25. Cordeschi, R. (2007). "AI Turns Fifty: Revisiting Its Origins." *Applied Artificial Intelligence*: https://www.tandfonline.com/doi/full/10.1080/08839510701252304 ; Gugerty, "Newell and Simon's Logic Theorist: Historical Background and Impact on Cognitive Modeling": https://www.researchgate.net/publication/276216226_Newell_and_Simon's_Logic_Theorist_Historical_Background_and_Impact_on_Cognitive_Modeling
26. Lettvin, J. Y., Maturana, H. R., McCulloch, W. S., Pitts, W. H. (1959). "What the Frog's Eye Tells the Frog's Brain." *Proc. IRE* 47(11): 1940–1951. https://doi.org/10.1109/JRPROC.1959.287207
27. Quote Investigator on Minsky 1967: https://quoteinvestigator.com/2021/03/04/ai-solved/ ; MIT Technology Review, "Mens et Apparata": https://www.technologyreview.com/2014/04/23/173182/mens-et-apparata/ ; comp.ai.philosophy FAQ (Simon 1965 wording): https://www.dontveter.com/caipfaq/timing.html
28. Moor, J. (2006). "The Dartmouth College Artificial Intelligence Conference: The Next Fifty Years." *AI Magazine* 27(4): 87–91. https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/1911 ; https://en.wikipedia.org/wiki/AI@50
29. SNARC secondary accounts (tube-count dispute, Honeywell C-1, survival of one unit): https://medium.com/@georgetzanetakis/reflections-on-snarc-fa46588f3916 ; https://en.wikipedia.org/wiki/Stochastic_Neural_Analog_Reinforcement_Calculator ; https://www.museumofai.org.uk/nodes/snarc-neural-simulator
30. Dartmouth workshop overview ($7,500 grant, attendee list): https://en.wikipedia.org/wiki/Dartmouth_workshop
31. Rockefeller Foundation, "Seventy Years After the Birth of AI, the Work Begins" ($7,500 grant; "five-week" project): https://www.rockefellerfoundation.org/perspective/seventy-years-after-the-birth-of-ai-the-work-begins/
32. Moews, D., Logic Theorist recreation (README: IPL-II version "ran on the JOHNNIAC, producing its first proof in August 1956"): https://github.com/dmoews/logic-theorist
33. Wikipedia, "Walter Pitts" (Associate of Arts claim, citing Gödel, *Collected Works*, Clarendon Press, p. 157) and "Warren Sturgis McCulloch" (death 24 Sept 1969): https://en.wikipedia.org/wiki/Walter_Pitts ; https://en.wikipedia.org/wiki/Warren_Sturgis_McCulloch
34. Smalheiser, N. R. (2000). "Walter Pitts." *Perspectives in Biology and Medicine* 43(2): 217–226. https://www.researchgate.net/publication/12512396_Walter_Pitts
35. Macy 7th conference (23–24 March 1950), Gerard transcript: https://pespmc1.vub.ac.be/books/Gerard.pdf
36. Copeland, B. J., notes to Turing's "Intelligent Machinery" ("appropriate interference, mimicking education"): https://www.alanturing.net/turing_archive/pages/pub/turing3/turing3.pdf
37. AI Magazine (Moor 2006) on the AI@50 plaque in Dartmouth Hall, "the building in which the 1956 summer activities took place": https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/1911/1809

---

## 12. Fact-check log (adversarial pass, 2026-10-05)

Method: the primary texts were downloaded and searched directly for exact wording. These were the McCulloch–Pitts PDF, the Hebb djvu text, Turing 1950, the EDVAC First Draft (Godfrey transcription), Wiener's *Cybernetics*, the Dartmouth proposal, G. Solomonoff's Dartmouth history, McCarthy's 1988 review, and the Bernstein/SNARC excerpt. Gefter, Quote Investigator, the 2026 Logic Theorist reconstruction and the Rockefeller Foundation's retrospective were also opened. All 18 key claims were checked. Overall: 26 claims confirmed, 7 corrected, 4 unverifiable and 3 contested.

**Confirmed verbatim:** the five 1943 assumptions (p. 118); the abstract's first sentence; the Turing passage (p. 129); "rigorously deduceable" and "ghostly" (p. 132); the three-item reference list; Hebb's postulate (p. 62, confirmed from the page breaks); Wiener's "steersman" sentence, the "Information is information" sentence, von Bonin's question, and "autumn of 1943"; Turing's 70 per cent prediction, "too meaningless", the child-machine passage, the coal scuttle, the closing line; the proposal's opening, topic 3, topic 1, Minsky's bio, Rochester's "test a theory" (Hebb is ref. 3 in his reference list); the budget lines ($650 = $500 secretary + $150 duplicating; $200 organization); Morison's letter; McCarthy's "anywhere near enough money"; Minsky's "switch from working on neural nets" and "high-level kinds of idea"; "top floor of the Dartmouth Math Department" (Dartmouth Hall, per the AI@50 plaque [37]); the 18 June – 17 August dates; that only McCarthy, Minsky and Solomonoff stayed throughout; the 26 May 1956 list of 11 (Newell and Simon "for the first two weeks"); all SNARC quotes (summer 1951, forty neurons, six tubes and a motor each, "three hundred tubes", the B-24 gyropilot, "a couple of thousand dollars" from ONR via George Miller); the McCarthy 1988 quote, verbatim on his own Stanford page; Simon & Newell's 1958 chess prediction (*Operations Research* 6(1), pp. 7–8); Minsky's 1967 sentence (p. 2, plural "problems", verified from scans by QI); Gefter's "barely a ripple", the frog's-eye quote, the burned dissertation, the boarding house, 14 May 1969 and "four months later" (McCulloch died 24 Sept 1969); the 7th Macy conference on 23–24 March 1950 with Gerard's analog/digital challenge [35]; Turing 1948's "appropriate interference, mimicking education" [36]; the EDVAC draft's all-or-none neuron passage and its single citation (author order differs between transcriptions, as already noted).

**Changes made**
1. **Corrected (McCulloch–Pitts converse).** The draft said every loop-free net matches a logical expression "and the reverse also holds". The paper's abstract limits the converse to expressions "satisfying certain conditions". Wording fixed in §5.1 [1].
2. **Corrected (byline).** The 1943 byline also names "The University of Chicago", not only UIC's Illinois Neuropsychiatric Institute (§3) [1].
3. **Corrected (sourcing).** ">22,000 copies by end of 1949" was cited to [14] (History of Information, Wikipedia), and neither contains it. The figure comes from Kline's *The Cybernetics Moment*, via the IEEE T&S review. Added [14a].
4. **Corrected (Turing nuance).** Turing proposed rewards and punishments but wrote that they "can at best be a part of the teaching process". Summary reworded [6].
5. **Corrected (arithmetic).** The draft said "39 years late" for the chess prediction. 1997 is 39 years after the 1958 prediction but 29 years after its 1968 deadline. Fixed in §1, §2 and §4 [20].
6. **Corrected (Simon quote, promoted).** "Within twenty years … any work that a man can do" is from 1960 (*The New Science of Management Decision*, p. 38, verified from scans by Quote Investigator), not 1965. Moved from UNVERIFIED to verified quote 24, with the exact wording [27].
7. **Corrected (Logic Theorist framing).** The "contested" label was overstated. The first JOHNNIAC proof was in August 1956 (Cordeschi [25]; the Moews recreation [32]), and the 38/52 results came from runs in late 1956 and 1957 [17]. Newell and Simon were scheduled for only the first two weeks of Dartmouth [16]. So it was not running during their visit. The popular "arrived with a working program" line is the error.
8. **Contested (added): Pitts's degrees.** Smalheiser 2000: "never held degrees of any kind" [34]. Wikipedia, citing Gödel's *Collected Works*: a University of Chicago Associate of Arts [33]. The film should say "never finished a doctorate". §3, §8 and §9 updated.
9. **Contested (added): workshop length.** Five weeks (Rockefeller Foundation [31]), six (traditional), eight (Solomonoff/More notes [16]).
10. **Contested (kept): SNARC tube count.** Minsky gives ~300; AIMA gives 3,000. Minsky's own figure stands.
11. **Confirmed with a better source: $7,500.** The Rockefeller Foundation itself states "a $7,500 grant" [31]. Replaced the reliance on Wikipedia, whose current text no longer gives the figure.
12. **Unverifiable (kept demoted):** von Neumann's "If it isn't now, it will be someday" (not in the Bernstein excerpt); Minsky 1982 "hardest science has ever undertaken" (only via Ullman 2005); Wiener's "strongest young scientist" (Gefter, primary letter not seen); Pitts's letter to Russell and the invitation (Gefter only).
13. **Added context:** the 1958 predictions were first delivered in Simon's 1957 ORSA address [20]. Dreyfus quoted them back at the field in 1972 [27].

**Second pass (resumed run, 2026-10-05).** Re-opened the primary texts independently:
- **Gefter [9], re-confirmed verbatim:** "barely a ripple among brain scientists", "McCulloch, 42 years old when he met Pitts", "Pitts, 18, was small and shy", three days with *Principia*, the telegram ("all connection between me and your projects is permanently abolished"), Lettvin's "didn't play the important or central part that one would have expected" and "It disappointed him", "He set fire to his dissertation along with all of his notes and his papers", and "On May 14, 1969 Walter Pitts died alone in a boarding house in Cambridge … Four months later, McCulloch passed away".
  - Gefter gives no year for the telegram; it follows McCulloch's 1952 move to MIT, so "c. 1952" stands.
- **Dartmouth proposal [7], re-confirmed:** the date line ("August 31, 1955"), the "2 month, 10 man study" opening, "$13,500", topic 3 "Neuron Nets" with its citations, Minsky's bio sentence, and Rochester's "An attempt was made to test a theory of how the brain does it" (footnoted to Hebb 1949).
- **McCarthy review [19], re-confirmed:** "escape association with 'cybernetics'" and "Norbert (not Robert) Wiener as a guru". The web page itself carries no date (it was generated in 2000). 1988 is the publication year of the review (*Annals of the History of Computing*), which matches the book's 1987 date.
- **Rochester [18], partly confirmed:** Modha confirms "IT-2", pp. 80–93, and Rochester's leadership of the IBM 701 architecture. The issue number (3) and month (September) come from the IEEE DOI record and were not re-opened in this pass.
- **Refined (§7.2):** McCarthy's 1974 remark to McCorduck now has its full wording, "I won't swear that I hadn't seen it before - a vague memory that someone else had used the word". It is labelled second-hand: the audio is in McCorduck's CMU papers, with restricted access.
- No new errors were found in the 18 key claims. The verdicts above stand.
