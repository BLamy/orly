# Dossier: Perceptrons (1969), the Lighthill Report and the First AI Winter

- id: `perceptrons-book-first-winter`
- era: 1966-1980
- as-of: 2026-10-05
- status: drafted from background knowledge, then verified against primary text where marked **[VERIFIED-PRIMARY]**. Adversarially fact-checked 2026-10-05; see section 12 (Fact-check log) and `research/factcheck/perceptrons-book-first-winter.json`. Where only a secondary source was available it is marked **[SECONDARY]**. Points that are disputed are marked **[CONTESTED]**.

Source numbers in square brackets, e.g. [S3], refer to section 11.

---

## 1. Summary

Between 1966 and about 1980, government money for the most ambitious kinds of AI research shrank sharply in the US and the UK. Neural-network ("connectionist") research shrank even more. Several things happened at once, and the film should show them as separate events:

1. **ALPAC (November 1966).** A National Academy of Sciences committee chaired by John R. Pierce of Bell Labs reviewed machine translation, mostly Russian to English for intelligence use. It found "no immediate or predictable prospect of useful machine translation" and recommended that support go to basic computational linguistics and translator aids instead [S1][S2]. Hutchins says its effect was "to bring to an end the substantial funding of MT research in the United States for some twenty years" [S3]. **[CONTESTED figure]** Hutchins also argues the oft-repeated $20 million overstates US MT *research* spending, which "may well have been nearer $12-13 million" [S3]. ALPAC was about language programs, not neural nets.
2. **Perceptrons (1969).** Marvin Minsky and Seymour Papert of MIT published *Perceptrons: An Introduction to Computational Geometry* (MIT Press). It is a rigorous mathematical study of a narrowly defined class of single-layer, "local" perceptrons. It proved, for example, that **parity** (of which XOR is the two-input case) and **connectedness** cannot be computed by perceptrons whose units each look at only a bounded number of input points. Its final chapter then offered an unproven "intuitive judgment" that the multi-layer extension was "sterile" [S4][S5]. The theorems are correct. The book was later read as proof that neural nets in general were a dead end, which it did not prove. Papert himself conceded this in 1988 [S6].
3. **Mansfield Amendment (November 1969).** Section 203 of the FY1970 Military Authorization Act (P.L. 91-121) barred Defense Department money from research without "a direct and apparent relationship to a specific military function or operation" [S7][S8]. It was softened in October 1970 to a "potential relationship" test [S8]. It still pushed ARPA (renamed DARPA in 1972) toward mission-oriented, applied work, and some basic research moved to NSF [S9][S10].
4. **Frank Rosenblatt's death (11 July 1971).** The perceptron's inventor drowned while sailing his sloop *Shearwater* on Chesapeake Bay, on his 43rd birthday [S11]. His Cornell program lost its leading advocate.
5. **Lighthill Report (dated July 1972, published 1973).** For Britain's Science Research Council, the Lucasian Professor of Applied Mathematics Sir James Lighthill wrote "Artificial Intelligence: A General Survey." It sorted AI into categories A (Advanced Automation), B (Bridge, or "Building Robots") and C (Computer-based central-nervous-system research). It praised A and C in moderation, condemned B, and blamed the field's disappointments on "the combinatorial explosion" [S12]. Lighthill then defended his report in a televised Royal Institution debate in 1973 against Donald Michie, John McCarthy and Richard Gregory [S13][S14]. UK support for AI was cut back for about a decade, until the 1982-83 Alvey programme [S12].
6. **DARPA retrenchment (about 1974-76).** DARPA ended its Speech Understanding Research program without the planned follow-on and asked AI centres for more concrete deliverables [S9].

**What actually caused the decline of neural-network research is contested.** One account, popularised by the 1986 PDP connectionists and later called the "official history" by the sociologist Mikel Olazaran, says *Perceptrons* killed the field [S15]. Revisionists argue that other factors were at least as important: the field was already stalling, the hype of 1958 had backfired, analog hardware was hard to build, there was no practical way to train hidden layers, symbolic AI was competing for the same DARPA money, and the Mansfield-era funding environment had changed. They also point out that neural research never stopped, especially outside the US [S6][S15][S16].

**Work continued through the "winter" outside the US mainstream.** Examples include Alexey Ivakhnenko's deep, layer-by-layer GMDH networks in Kyiv (1965-1971) [S17][S18], Shun-ichi Amari's 1967 stochastic-gradient theory of adaptive classifiers [S19], Seppo Linnainmaa's 1970 Helsinki master's thesis on reverse-mode differentiation (the mathematical core of backpropagation) [S20][S21], Teuvo Kohonen's associative memories (1972) and self-organising maps (1982) [S22][S23], Stephen Grossberg's shunting networks and Adaptive Resonance Theory (1973-1976) [S24][S25], Paul Werbos's 1974 Harvard thesis, which discussed reverse-mode derivatives for neural-network training (how fully is **[CONTESTED]**: Schmidhuber calls it "preliminary, NN-specific discussion" and dates the first NN-specific application of efficient backprop to Werbos 1982) [S26][S18][S21], and Kunihiko Fukushima's Neocognitron at NHK in Tokyo (1979-80), a direct ancestor of convolutional networks [S27][S28].

---

## 2. Timeline

| Date | Event | Sources |
|---|---|---|
| 1957 | Rosenblatt at Cornell Aeronautical Laboratory (Buffalo, NY) describes the perceptron (Project PARA, report 85-460-1), funded by the Office of Naval Research. | [S29][S30] |
| 7-8 July 1958 | The Navy demonstrates a perceptron simulated on the Weather Bureau's IBM 704 (dateline Washington, 7 July). The NYT (8 July 1958, p. 25) headline reads "NEW NAVY DEVICE LEARNS BY DOING; Psychologist Shows Embryo of Computer Designed to Read and Grow Wiser." After 50 trials it learned to tell cards marked on the left from cards marked on the right. The article says the first physical Perceptron would be "finished in about a year at a cost of $100,000", with about 1,000 association cells and a 400-photocell eye. | [S11][S31][S51] |
| 1958-1960 | The Mark I Perceptron is built at Cornell Aeronautical Laboratory, Buffalo, funded by ONR and the Rome Air Development Center. **[CONTESTED DATE]** The Smithsonian dates the object "1958"; Jensen and Dunning (via Wikipedia "Perceptron") give assembly and testing as June-14 December 1959; Nilsson gives the first public demonstration as 23 June 1960; Wikipedia's Rosenblatt article says "hardware construction in 1960". Safe wording: "built around 1958-60". Its retina is 20x20 = 400 photocells, with 512 association units and 8 response units; weights sit on motor-driven potentiometers. | [S30][S32] |
| 1961-1967 | "Tobermory," Rosenblatt's speech-recognition perceptron, is built at Cornell Ithaca by graduate students (named after Saki's talking cat). | [S11][S33] |
| 1962 | Rosenblatt, *Principles of Neurodynamics* (Spartan Books, Washington), discusses multilayer perceptrons and uses the phrase "back-propagating error correction." | [S34][S35] |
| 1963 | Papert joins Minsky at MIT; the *Perceptrons* project begins. | [S5] |
| April 1964 | ALPAC is formed (chair John R. Pierce, Bell Labs). | [S2] |
| 1965 | Ivakhnenko and Lapa publish early GMDH work in Kyiv (Schmidhuber's dating). | [S18] |
| November 1966 | ALPAC report *Language and Machines: Computers in Translation and Linguistics* (NAS-NRC Publication 1416). | [S1][S2] |
| June 1967 | Amari, "A Theory of Adaptive Pattern Classifiers," *IEEE Trans. Electronic Computers* EC-16(3):299-307 (Kyushu University). | [S19] |
| 1969 | Minsky and Papert, *Perceptrons* (MIT Press). Minsky receives the 1969 ACM Turing Award. | [S4][S5][S36] |
| November 1969 | Mansfield Amendment (Sec. 203, P.L. 91-121) takes effect for FY1970. | [S7][S8] |
| 7 October 1970 | FY1971 Act (P.L. 91-441, Sec. 204) replaces it with a "potential relationship to a military function" test. | [S8] |
| 1970 | Linnainmaa, master's thesis (in Finnish), University of Helsinki: the first explicit published description of reverse-mode automatic differentiation, with FORTRAN code. | [S20][S21] |
| October 1971 | Ivakhnenko, "Polynomial Theory of Complex Systems," *IEEE Trans. SMC* 1(4):364-378; Schmidhuber describes an 8-layer GMDH network. | [S17][S18] |
| 11 July 1971 | Rosenblatt drowns sailing the sloop *Shearwater* on Chesapeake Bay, on his 43rd birthday. | [S11] |
| 1972 | ARPA renamed DARPA (March). The second printing of *Perceptrons* carries the authors' handwritten alterations and the handwritten dedication "In memory of Frank Rosenblatt" (who had died in 1971). | [S10][S5][S52] |
| April 1972 | Kohonen, "Correlation Matrix Memories," *IEEE Trans. Computers* C-21:353-359 (Helsinki University of Technology). | [S22] |
| July 1972 | Lighthill completes "Artificial Intelligence: A General Survey." | [S12] |
| 1973 (early) | The SRC publishes *Artificial Intelligence: a paper symposium*, containing Lighthill's report plus replies from Sutherland, Needham, Longuet-Higgins and Michie. | [S12] |
| 1973 | Televised "Controversy" debate at the Royal Institution, London, on the motion "The general purpose robot is a mirage": Lighthill vs. Michie, McCarthy and Gregory. **[CONTESTED DATE]**: 9 May 1973 (Wikipedia); "June 1973" (Edinburgh AIAI archive label); a research note citing a contemporaneous SRI report gives filming on 4 July and a BBC2 broadcast on 30 August 1973. Safe wording: "in 1973" or "the summer of 1973". | [S13][S14][S37] |
| 1973 | Grossberg proves the noise-saturation properties of shunting on-centre off-surround networks. | [S24] |
| 1973 | Lighthill becomes the first person to swim around the island of Sark, aged 49. | [S38][S39] |
| 1974 | Werbos, Harvard PhD thesis *Beyond Regression: New Tools for Prediction and Analysis in the Behavioral Sciences*. | [S26] |
| 1975 | DoD funding for mathematics and computer science reaches a 20-year low (NRC, as cited by AI Now). George Heilmeier is DARPA director 1975-77. | [S9][S40] |
| 1976 | DARPA's Speech Understanding Research program (begun 1971) ends without its planned follow-on. Grossberg introduces Adaptive Resonance Theory (*Biological Cybernetics* 23). | [S9][S25] |
| 1979-April 1980 | Fukushima (NHK Broadcasting Science Research Laboratories, Setagaya, Tokyo), "Neocognitron," *Biological Cybernetics* 36(4):193-202 (received 28 Oct 1979). | [S27][S28] |
| 1982 | Kohonen, "Self-Organized Formation of Topologically Correct Feature Maps." Werbos publishes backprop for neural nets. The UK opens an IKBS review that leads to Alvey. | [S23][S26][S12] |
| 1986 | Rumelhart, Hinton and Williams popularise backpropagation; the PDP volumes say "we believe that we have answered Minsky and Papert's challenge." | [S5][S6] |
| Winter 1988 | Papert, "One AI or Many?" (*Daedalus* 117(1):1-14), with the "Snow White" passage. | [S6] |
| 1988 | *Perceptrons*, Expanded Edition, adds "Prologue: A View from 1988" and an Epilogue. | [S5][S16] |
| August 1996 | Olazaran, "A Sociological Study of the Official History of the Perceptrons Controversy," *Social Studies of Science* 26(3):611-659. | [S15] |
| 17 July 1998 | Lighthill dies in the sea off Sark on his seventh circumnavigation swim. | [S38][S39] |

---

## 3. People

Appearance notes come from widely circulated photographs and are meant only for respectful silhouette work. The art department should check each against reference photos; where not confirmed, they are marked "(check)".

**Marvin Minsky** (1927-2016). Co-founder of the MIT AI Lab (Project MAC era), Cambridge, Massachusetts. He started out in neural networks: as a graduate student in 1951 he built SNARC, a learning machine of vacuum tubes and motor-driven clutches turning rheostats that simulated a rat in a maze [S16]. His 1954 Princeton PhD was on neural-net theory [S16]. By the 1960s he championed symbolic, heuristic AI. He and Rosenblatt attended the Bronx High School of Science a year apart (the Cornell Chronicle says Minsky "was a grade behind Rosenblatt"; Rosenblatt graduated in 1946), argued loudly at conferences, and stayed on friendly terms [S5][S11][S44]. He won the 1969 Turing Award [S36]. Rosenblatt called him "the loyal opposition" [S11]. **Look:** compact build; by the 1970s mostly bald with a high domed head; broad face and wide smile; often in a sweater, open collar or turtleneck (check). Silhouette cue: the domed bald head.

**Seymour Papert** (1928-2016). South African-born mathematician who came to MIT in 1963 after working with Piaget in Geneva. Later known for the Logo language and educational computing [S5]. He co-wrote *Perceptrons*. In 1988 he wrote that "there was some hostility in the energy behind the research" and that the book "was misleading in its suggestion that this class of nets was the heart of connectionism" [S6]. **Look:** full, bushy beard (dark in the 1960s, grey later), unruly hair, often rumpled jacket (check). Silhouette cue: the big beard.

**Frank Rosenblatt** (11 July 1928 to 11 July 1971). Psychologist (Cornell BA 1950, PhD 1956). Research psychologist and project engineer at Cornell Aeronautical Laboratory in Buffalo; from 1959 at Cornell's Ithaca campus, directing the Cognitive Systems Research Program; from 1966 associate professor of neurobiology and behavior [S11]. He believed brain-like learning machines could perceive and generalise. His public claims (the 1958 press demonstration) drew criticism as hype [S15][S31]. Interests included astronomy (he built a backyard observatory with his students at his house in Brooktondale, near Ithaca), music, mountaineering, and politics (he campaigned for Sen. Eugene McCarthy, who spoke at his memorial) [S11]. Colleagues said the loss of funding "didn't impinge on him emotionally, as it would for many people" (Richard O'Brien) [S11]. **Look:** slim, youthful; dark wavy hair combed back; in 1950s-60s photos at the Mark I he wears a jacket and narrow tie (check). Silhouette cue: a young man in shirt and tie at the patch-board.

**Sir (Michael) James Lighthill** (1924-1998). Born in Paris. A leading applied mathematician (aeroacoustics, fluid mechanics), Lucasian Professor of Applied Mathematics at Cambridge from 1969 [S12][S38]. He wrote the report at the request of Brian Flowers, head of the Science Research Council, after "two months spent looking through the literature" [S12][S41]. He was an adventure swimmer: in 1973, aged 49, he became the first person to swim around Sark, and he died there in 1998 [S38][S39]. **Look:** energetic lecturer; receding hair; glasses; 1970s suit and tie; in the debate he stood behind a lectern on a raised platform (check glasses and hair against stills) [S14].

**Donald Michie** (1923-2007). Wartime Bletchley Park codebreaker; co-founder (1967, with Richard Gregory and Christopher Longuet-Higgins) of Edinburgh's Department of Machine Intelligence and Perception [S45]; leader of the Freddy robot project [S14]. The Lighthill report hit Edinburgh hardest. He died in a car accident on 7 July 2007 [S12]. **Look:** tall, lean, greying hair (check).

**John McCarthy** (1927-2011). Stanford AI Lab; coined "artificial intelligence" (1955). He debated Lighthill on television, and in his separate *written* review of the report he argued that Lighthill's categories had "no place for what is or should be our main scientific activity" [S41]. (That wording is from the written review, not a transcript of the debate; do not put it in his mouth at the Royal Institution.) **Look (1973):** full dark beard, glasses, longish hair (check).

**Richard Gregory** (1923-2010). Perception psychologist. Professor of Bionics at Edinburgh 1967-70 (co-founder of the Department of Machine Intelligence and Perception); from 1970 Professor of Neuropsychology and director of the Brain and Perception Laboratory at the University of Bristol, so he debated in 1973 **from Bristol**, not Edinburgh [S45]. The third member of the pro-AI team [S13][S14]. **Look:** large, tall man (check).

**John R. Pierce** (1910-2002). Bell Labs engineer who chaired ALPAC [S2].

**Senator Mike Mansfield** (D-Montana), Senate Majority Leader. Author of Sec. 203 [S7][S8].

**Stephen Grossberg** (b. 1939). Mathematician-neuroscientist, later at Boston University. Used nonlinear differential equations for neural learning from 1957-58; outstar learning (1967); shunting networks (1973); ART (1976) [S24][S25].

**Kunihiko Fukushima** (b. 1936). Researcher at NHK Broadcasting Science Research Laboratories, Kinuta, Setagaya, Tokyo. Developed the Cognitron (1975) and then the Neocognitron (1979-80), which uses hierarchical S-cells and C-cells inspired by Hubel and Wiesel [S27][S28].

**Shun-ichi Amari** (b. 1936). Kyushu University, later Tokyo. In 1967 his theory of adaptive pattern classifiers derived stochastic-gradient error-correction learning. His student Saito ran computer experiments on a 5-layer network with two modifiable layers (per Schmidhuber) [S19][S21].

**Teuvo Kohonen** (1934-2021). Helsinki University of Technology. Correlation-matrix associative memories (1972); self-organising maps (1982) [S22][S23].

**Paul Werbos** (b. 1947). Harvard PhD student (advisers included Karl Deutsch). His 1974 thesis set out reverse-mode derivatives ("dynamic feedback") and discussed applying them to neural networks; Schmidhuber reads the 1974 NN discussion as "preliminary" and dates Werbos's first explicit NN application to 1982 **[CONTESTED]** [S21]. He recalls taking the idea to Minsky and being turned away (see section 6, secondary) [S26][S42].

**Alexey G. Ivakhnenko** (1913-2007). Institute of Cybernetics, Kyiv, Ukrainian SSR. Group Method of Data Handling: deep, layer-by-layer grown polynomial networks, pruned by a validation set [S17][S18].

**Seppo Linnainmaa** (b. 1945). University of Helsinki. His 1970 master's thesis on cumulative rounding error gave the first explicit reverse-mode automatic differentiation (published in English in *BIT* 1976). It was not applied to neural networks [S20][S21].

**Mikel Olazaran.** Sociologist at the University of the Basque Country (Bilbao). His 1991 Edinburgh PhD and 1996 paper reconstruct the controversy through interviews [S15].

---

## 4. The belief of the age

**The belief (about 1969 to the early 1980s, mainly US/UK):** single-layer perceptrons had been mathematically shown to be fundamentally limited. Nobody knew how to train multi-layer nets, and Minsky and Papert judged it likely that no useful method existed ("our intuitive judgment that the extension is sterile") [S4]. Real intelligence was thought to come from explicit symbolic programs (heuristic search, logic, knowledge representation, later expert systems). Neural nets were seen as a 1950s-60s fad that had overpromised.

**Who held it:** the MIT/Stanford/CMU symbolic-AI centres that DARPA's IPTO funded. Papert later described this cultural reading: "its universalism made it almost inevitable for AI to appropriate our work as proof that neural nets were universally bad" [S6]. Bernard Widrow, an ADALINE pioneer, later recalled leaving neural nets for adaptive antennas and signal processing [S16]. (His wording "So we stopped, basically stopped on neural nets" is seen only in a secondary essay citing Olazaran's 1991 thesis: **UNVERIFIED — do not use as a quote**.)

**A parallel belief, Lighthill's:** general-purpose AI ("Building Robots") had failed because of the combinatorial explosion, while narrow automation (A) and brain modelling (C) were respectable [S12]. Interestingly, Lighthill's category C explicitly approved "computer-based models of neural nets" for neurobiology [S12]. His target was general-purpose robotics and AI, not neural nets as such.

**Who dissented:**
- Rosenblatt, until 1971. He had already proved (Theorem 1, *Principles of Neurodynamics*) that an "elementary perceptron" with enough association units can represent any classification, and he had explored multi-layer and cross-coupled systems [S5][S34].
- H. D. Block's 1970 review said the book studies "a severely limited class of machines from a viewpoint quite alien to Rosenblatt's" and called the title "seriously misleading" [S5].
- Grossberg, Amari, Kohonen, Fukushima, Ivakhnenko, Werbos and Linnainmaa all kept working (see section 1).
- In the UK, Michie, McCarthy and Gregory argued the opposite of Lighthill on television [S13].

**How long it held:** roughly 1969 to 1982-86 in the US mainstream. Cracks appeared with Hopfield (1982), Boltzmann machines (1983-85) and the 1986 PDP volumes, which said "their pessimism about learning in multilayer machines was misplaced" [S5]. In 1988 Minsky and Papert still held that "little of significance [has] changed since 1969" in the theory (as quoted by Pollack, [SECONDARY]) [S5][S16].

**What ended it:** practical success of backpropagation in hidden-layer networks (1986), cheaper digital computers, and the rise of the PDP/connectionist community. In the UK, the Alvey programme (from 1983) reopened funding for "intelligent knowledge-based systems" [S12].

---

## 5. Experiments and results

### 5.1 The Mark I Perceptron (the apparatus *Perceptrons* argued about)
- Built at Cornell Aeronautical Laboratory, Buffalo, NY, "with funding from the Office of Naval Research and the Rome Air Development Center". Now in the Smithsonian National Museum of American History (ID Number 1987.0819.01; "date made" 1958). It "came to the Smithsonian in 1967 from Cornell University as a transfer from the Office of Naval Research"; status "Currently not on view" [S32][S48].
- **Smithsonian layout, left to right:** a unit with a monitor for the S (sensory) unit at top and an array of manual stimulus switches below; a cabinet whose two doors hide a large **plugboard** wiring S-units to A-units, marked at top "MARK I"; an array of **potentiometers** forming the A unit, marked "PERCEPTRON"; the R-unit panel; and, rightmost, a panel of meters [S32].
- **Retina:** a camera-like input of 20 x 20 = 400 cadmium-sulphide photocells; 512 association units; 8 response units. S-to-A wiring was set randomly from a table of random numbers to "eliminate any particular intentional bias" [S30]. [SECONDARY: these counts come from Wikipedia "Perceptron" citing Bishop 2006, Nilsson and the operators' manual, not from the Smithsonian record; Wikipedia notes that "Different versions of the Mark I used different numbers of units".]
- **Learning:** weights stored as potentiometer settings, turned by small electric motors when the machine erred [S30]. (One later patent claims operators adjusted connections by hand. Treat motor-driven as the standard account [S30].)
- **Tasks:** left vs. right marks (the 1958 IBM 704 simulation learned it in 50 trials); later, squares vs. circles and letters [S11][S30].
- Art notes: grey-painted 1950s instrument cabinets, a rat's-nest of patch cords on the plugboard, rows of round potentiometer knobs, a lamp-lit card or letter placed in front of the photocell "eye".

### 5.2 Tobermory (1961-67)
A room-filling speech-recognition perceptron with layers of 45, 1600, 1000 and 12 units and about 12,000 weights stored in toroidal magnetic cores. By the time it was finished, digital simulation had overtaken it [S16][S33].

### 5.3 What *Perceptrons* proved (mechanically)
- **Setting:** a "retina" R of points. Each first-layer predicate (feature detector) sees a subset of the points. The output is a single threshold unit: fire if the sum of a_i * psi_i exceeds theta. The **order** of a perceptron is the largest number of retina points any one detector looks at [S5].
- **Parity theorem (Theorem 3.1.1):** computing whether an odd number of points is lit requires order |R|, meaning at least one detector must look at **every** point. A "local" perceptron cannot do it [S5].
- **Connectedness (Section 5.5, credited to D. A. Huffman's construction):** deciding whether a figure is one connected piece needs order growing at least as the square root of the retina size, so it is not local either [S5].
- **Group-invariance theorem:** if the predicate is invariant under a symmetry group, you can average coefficients over the group. This is the tool behind the proofs [S5].
- **Positive results:** more than half the book covers surprising things perceptrons *can* do (Papert, 1988: "more than half of our book is devoted to 'pro-perceptron' findings") [S6].
- **What it did NOT prove:** anything about multi-layer networks with trainable hidden layers. The authors' only statement on that was a conjecture (pp. 231-232, "sterile") [S4]. They also acknowledged that "a universal computer could be built entirely out of linear threshold modules" (1972:232) [S5]. McCulloch and Pitts had shown in 1943 that networks of threshold units can compute any Boolean function [S5].

### 5.4 XOR, explained mechanically (for animation)
- XOR on two inputs (x1, x2) outputs 1 for (0,1) and (1,0), and 0 for (0,0) and (1,1).
- A single threshold unit computes w1*x1 + w2*x2 > theta, which geometrically is **one straight line** dividing the plane.
- Place the four inputs at the corners of a square. The two "1" corners are diagonally opposite, and so are the two "0" corners. No single straight line can put both 1-corners on one side and both 0-corners on the other.
- Proof by inequalities: (1,0) needs w1 > theta and (0,1) needs w2 > theta. (0,0) needs 0 <= theta, so theta >= 0. Adding gives w1 + w2 > 2*theta >= theta, so (1,1) would also fire. Contradiction.
- **Fix with one hidden layer:** h1 = OR(x1,x2) (fires if x1 + x2 > 0.5); h2 = AND(x1,x2) (fires if x1 + x2 > 1.5); output = h1 AND NOT h2 (fires if h1 - h2 > 0.5). Two lines carve out the diagonal band.
- The 1969 problem was not representing XOR with hidden units, which was known. It was **learning** hidden-unit weights automatically (caveat: "nobody could" is too strong. Amari's 1967 stochastic-gradient theory, with Saito's experiments on a five-layer net with two modifiable layers, and Ivakhnenko's layer-by-layer GMDH nets did train multi-layer systems, but they were little known in the US mainstream and not a general, practical method [S19][S21][S18]): which hidden unit is to blame for an error (the credit-assignment problem)? The perceptron rule needs a target for each unit, and hidden units have none. Backpropagation's answer requires smooth (differentiable) units instead of hard 0/1 thresholds. This is the point Werbos says he pressed on Minsky [S42].
- Caution: *Perceptrons* itself works mainly with parity and connectedness over large retinas. The book's own key point about XOR/parity is about **order/locality**, not just the 2-input case. Popular accounts that say "the book showed a perceptron can't do XOR" are a simplification (see section 8).

### 5.5 ALPAC's evidence
- The government had spent "some $20 million on machine translation and closely related subjects" over 10 years; "This is more than the government cost of translation for 1 year" [S1]. **[CONTESTED figure]** Hutchins (1996) argues much of the money went to computer equipment and US MT research funding "may well have been nearer $12-13 million" [S3].
- After 8 years of work, Georgetown's MT project in 1962 "had to resort to postediting"; "The postedited translation took slightly longer to do and was more expensive than conventional human translation" [S1].
- Unedited machine output "makes slow and painful reading" [S1]. John B. Carroll's evaluation experiments are in Appendix 10 [S2].

### 5.6 Winter-era technical results
- **GMDH (Ivakhnenko):** layers grown one at a time by regression, each unit a 2nd-order polynomial of two inputs, weak units pruned against a validation set. Schmidhuber reports an 8-layer network in the 1971 paper [S17][S18]. ("First deep learning" is Schmidhuber's framing [CONTESTED].)
- **Amari 1967:** error-correction (stochastic gradient) adjustment for linear and piecewise-linear classifiers under unknown distributions [S19].
- **Linnainmaa 1970:** reverse-mode accumulation of derivatives through a computational graph, with FORTRAN code. Later used as the computational core of backprop frameworks [S20][S21].
- **Neocognitron (1980):** alternating S-cell (feature-extracting) and C-cell (position-tolerant pooling) layers, trained without a teacher, recognising patterns "without affected by their positions" (sic, from the abstract) [S27].

---

## 6. Verified quotes

**Q1. Minsky and Papert, *Perceptrons* (1969; 1972 printing), pp. 231-232.** [VERIFIED via verbatim transcription by Pierre Baldi, Connectionists mailing list, 1 Feb 2022, S43; fragments matched by Quote Investigator, S4]
> "The perceptron has shown itself worthy of study despite (and even because of!) its severe limitations. It has many features to attract attention: its linearity; its intriguing learning theorem; its clear paradigmatic simplicity as a kind of parallel computation. There is no reason to suppose that any of these virtues carry over to the many-layered version. Nevertheless, we consider it to be an important research problem to elucidate (or reject) our intuitive judgment that the extension is sterile. Perhaps some powerful convergence theorem will be discovered, or some profound reason for the failure to produce an interesting "learning theorem" for the multilayered machine will be found."

Context: the closing chapter (13). It is a conjecture, not a theorem. Freedman (*Brainmakers*, 1994) called it "the most consequential" statement in the book [S4].

**Q2. Seymour Papert, "One AI or Many?", *Daedalus* 117(1), Winter 1988, pp. 3-4.** [VERIFIED-PRIMARY, S6] Papert is retelling the *connectionists'* version of the story, not endorsing it:
> "Once upon a time two daughter sciences were born to the new science of cybernetics. One sister was natural, with features inherited from the study of the brain, from the way nature does things. The other was artificial, related from the beginning to the use of computers."
> "...Lord DARPA, the Defense Department's Advanced Research Projects Agency. The artificial sister grew jealous and was determined to keep for herself the access to Lord DARPA's research funds. The natural sister would have to be slain."
> "The bloody work was attempted by two staunch followers of the artificial sister, Marvin Minsky and Seymour Papert, cast in the role of the huntsman sent to slay Snow White and bring back her heart as proof of the deed."
> "But Snow White was not dead. What Minsky and Papert had shown the world as proof was not the heart of the princess; it was the heart of a pig."

**Q3. Papert, same essay, p. 4.** [VERIFIED-PRIMARY, S6]
> "The book did indeed point out very serious limitations of a certain class of nets (nowadays known as one-layer perceptrons) but was misleading in its suggestion that this class of nets was the heart of connectionism."

**Q4. Papert, same essay, pp. 4-5.** [VERIFIED-PRIMARY, S6]
> "Did Minsky and I try to kill connectionism, and how do we feel now about its resurrection? Something more complex than a plea is needed. Yes, there was some hostility in the energy behind the research reported in Perceptrons, and there is some degree of annoyance at the way the new movement has developed; part of our drive came, as we quite plainly acknowledged in our book, from the fact that funding and research energy were being dissipated on what still appear to me (since the story of new, powerful network mechanisms is seriously exaggerated) to be misleading attempts to use connectionist methods in practical applications."

Context: Papert's very next sentence is "But most of the motivation for Perceptrons came from more fundamental concerns, many of which cut cleanly across the division between networkers and programmers." Do not present funding rivalry as the book's main motive in his telling [S6].

**Q5. Papert, same essay, pp. 7-8.** [VERIFIED-PRIMARY, S6]
> "By 1969, the date of the publication of Perceptrons, AI was not operating in an ivory-tower vacuum. Money was at stake."
> "We did not think of our work as killing Snow White; we saw it as a way to understand her."
> "But in a culture set up for global judgment of mechanisms, being understood can be a fate as bad as death."

**Q6. Sir James Lighthill, "Artificial Intelligence: A General Survey" (July 1972), section 3.** [VERIFIED-PRIMARY, S12]
> "Most workers in AI research and in related fields confess to a pronounced feeling of disappointment in what has been achieved in the past twenty-five years. Workers entered the field around 1950, and even around 1960, with high hopes that are very far from having been realised in 1972. In no part of the field have the discoveries made so far produced the major impact that was then promised."

**Q7. Lighthill, same, section 3.** [VERIFIED-PRIMARY, S12]
> "...he is inclined, as a mathematician, to single out one rather general cause for the disappointments that have been experienced: failure to recognise the implications of the combinatorial explosion."

**Q8. Lighthill, same, introduction.** [VERIFIED-PRIMARY, S12] He describes his own method:
> "...it would simply describe how AI appears to a lay person after two months spent looking through the literature of the subject..."

**Q9. Lighthill, section 2, Category B.** [VERIFIED-PRIMARY, S12] A notorious aside. Use with care; it is gendered and speculative, and he himself calls it a "highly uncertain hypothesis":
> "Incidentally, it has sometimes been argued that part of the stimulus to laborious male activity in creative fields of work, including pure science, is the urge to compensate for lack of the female capability of giving birth to children. If this were true, then Building Robots might indeed be seen as the ideal compensation!"

**Q10. John McCarthy, written review of the Lighthill Report (not the BBC debate).** [VERIFIED-PRIMARY, S41]
> "In fact, the combinatorial explosion problem has been recognized in AI from the beginning, and the usual meaning of heuristic is a device for reducing this explosion."

and:
> "...his three categories have no place for what is or should be our main scientific activity - studying the structure of information and the structure of problem solving processes independently of applications and independently of its realization in animals or humans."

**Q11. ALPAC, *Language and Machines* (1966), p. 32 of the original (NAP PDF p. 46).** [VERIFIED-PRIMARY, S1]
> "...while we have machine-aided translation of general scientific text, we do not have useful machine translation. Further, there is no immediate or predictable prospect of useful machine translation."

**Q12. ALPAC, p. 19 of the original (NAP PDF p. 33).** [VERIFIED-PRIMARY, S1]
> "...there has been no machine translation of general scientific text, and none is in immediate prospect."

**Q13. Mansfield Amendment, Sec. 203, P.L. 91-121 (1969).** [VERIFIED via NSF history and secondary statutory summaries, S7][S8] The statutory phrase:
> "a direct and apparent relationship to a specific military function or operation"

Note that some sources misquote this as "direct *or* apparent".

**Q14. New York Times (UPI), 8 July 1958.** [VERIFIED via transcription in Sejnowski, arXiv:2002.04806 and a clipping scan, S31]
> "The Navy revealed the embryo of an electronic computer today that it expects will be able to walk, talk, see, write, reproduce itself and be conscious of its existence."

**Q15. Rosenblatt, quoted by the Cornell Chronicle (2019).** [VERIFIED as quoted in S11; the original 1958 source is not checked]
> "the first machine which is capable of having an original idea"

**Q16. Cornell Chronicle, 25 Sept 2019 (Melanie Lefkowitz).** [VERIFIED, S11]
> "In 1971, he drowned while sailing a sloop called the Shearwater in Chesapeake Bay on his 43rd birthday."

**Q17. Rumelhart, Hinton and Williams, PDP vol. 1 ch. 8 (1986), p. 361.** [via Quote Investigator, S4]
> "we believe that we have answered Minsky and Papert's challenge"

**Q18. Minsky and Papert, "Prologue: A View from 1988," Expanded Edition.** [SECONDARY via QI/Pollack, S4][S16] Fragments only:
> "little of significance had changed since 1969"
> "we expect the future of network-based learning machines to be rich beyond imagining"

Check against the printed Expanded Edition before using on screen. Pollack's rendering (as cited by Wikipedia) has "[has]" and Wikipedia places it in the 1988 edition's closing chapter; Quote Investigator gives "had" and locates it in the Prologue, p. vii. **UNVERIFIED — do not use as a verbatim quote** until checked against the printed book.

### Quotes reported only secondhand. Do NOT voice as verbatim without checking the original.
- **Minsky, 1981 New Yorker profile by Jeremy Bernstein:** "after being irritated with Rosenblatt for overclaiming, and diverting all those people along a false path..." UNVERIFIED in the original (seen only in Yuxi Liu's essay, S16).
- **Minsky at ICNN 1988:** "Everybody seems to think I'm the devil." (via Olazaran's 1991 thesis). **Minsky at AI@50 (2006):** "Yes, I am the devil!" (via Sejnowski 2018). UNVERIFIED (S16).
- **Widrow, *Talking Nets* (2000):** "My God, what a hatchet job." UNVERIFIED in the original (S16).
- **Werbos, *Talking Nets* ch. 15 (1993 interview), recalling Minsky's reply:** "nobody is going to believe us. It's totally crazy. I can't get involved in anything like this." Werbos's own recollection, one side only. UNVERIFIED in the original (S42).
- **Werbos (1974 thesis origin):** "In 1968, I proposed that we somehow imitate Freud's concept of a backwards flow of credit assignment..." UNVERIFIED (search-snippet only, S26).
- **Yann LeCun on Papert's death (2016):** the book "had a hand in killing the first wave of neural nets, but it wasn't Papert's intention." UNVERIFIED — do not use as a quote. (The fact-check found that the Quote Investigator page [S4] does not contain it; trace to LeCun's original post.)
- **Minsky likening *Perceptrons* to the Necronomicon** ("widely known but seldom read"): UNVERIFIED (Wikipedia cites a course page).
- **Minsky to John Munson (SRI), 1966:** "This is an idea with no future." (via Metz, *Genius Makers*, 2021). Secondhand anecdote; UNVERIFIED.
- **Robert Hecht-Nielsen (in *Talking Nets*, 2000), on a prepublication draft:** "Later, on the strong and wise advice of colleagues, they expunged the vitriol. They did a complete flip-flop, dedicating the book to Rosenblatt!" Seen only via Liu's essay [S16]; one participant's recollection and in tension with the documented 1972 handwritten "In memory of" dedication. UNVERIFIED — do not use as a quote.

---

## 7. Debates and controversies

### 7.1 Did *Perceptrons* kill neural-network research? [CONTESTED]
**Yes, or it was a major cause:**
- The PDP group (1986) and later popular histories cast the book as the killer. Alom et al. (2018) say it was "killing research in neural networks for a decade" [S5].
- Papert concedes the energy behind the book included hostility over "funding and research energy" being "dissipated" [S6].
- Hecht-Nielsen claimed, secondhand, that Minsky and Papert lobbied ARPA against neural nets (unverified; reported in S16).
- Melanie Mitchell argues that what doomed the field was their **speculation** about multi-layer nets, not their theorems [S4].

**No, or it was overstated:**
- Olazaran (1996) argues that the "official history" (that the book's proofs showed neural nets could go no further) stemmed from the rise, institutionalisation and "(importantly) legitimation of the symbolic AI approach", including its funding allocation and authority structure. He also finds considerable "interpretative flexibility" in how researchers actually read the book, and a later rewriting of history during the 1980s revival [S15].
- Neural research had already stalled for internal reasons: no hidden-layer learning rule, hard analog hardware, and the backlash after the 1958 hype. Widrow says he had already left neural nets [S16].
- Pierre Baldi (2022): the "killed neural nets" story is an exaggeration propagated by the PDP group; Amari, Grossberg and others continued working [S43].
- Minsky and Papert's 1988 prologue blamed inherent problems rather than the book: no better credit-assignment learning rule existed, and perceptrons cannot represent some necessary knowledge (summarised by Pollack 1989) [S5].
- Funding context: the Mansfield Amendment and DARPA's move to applied work hit *all* basic research. Symbolic AI centres (MIT, Stanford, CMU) also faced demands for concrete results, though their money did not stop [S9].

**Suggested film framing:** the book proved true, narrow theorems. A field already short of money and embarrassed by hype read it as a verdict. The book was one cause among several, and how much weight it carries is still argued.

### 7.2 Was Lighthill fair? [CONTESTED]
- **For Lighthill:** the field had over-promised (his Q6 is hard to dispute). The combinatorial explosion was real.
- **Against:** McCarthy says Lighthill's taxonomy left out AI's actual science, and that the combinatorial explosion had been recognised "from the beginning" (Q10) [S41]. Michie's and Sutherland's replies were bound into the same 1973 SRC volume [S12]. Lighthill was an outsider who did two months of reading [S12].
- **Effect:** "a massive loss of confidence in AI by the academic establishment in the UK including the funding body. It persisted for almost a decade" (Chilton/SRC overview, a secondary summary) [S12]. Edinburgh's robotics work (Freddy) was hit hardest [S14].

### 7.3 Who invented backpropagation? [CONTESTED priority dispute]
Candidates include Kelley (1960) and Bryson (1961) (control theory), Linnainmaa (1970, general reverse mode, no reference to neural nets), Werbos (1974 thesis discussion; first explicit NN application 1982 per Schmidhuber, while Werbos and others credit the 1974 thesis), Parker (1985), LeCun (1985) and Rumelhart, Hinton and Williams (1986, demonstration and popularisation). Rosenblatt used the phrase "back-propagating error correction" in 1962 for a non-gradient procedure. Schmidhuber argues strongly for Linnainmaa and Ivakhnenko/Amari priority [S21]. Baydin et al. are more cautious, and credit Speelpenning (1980) with the first implementation of reverse-mode AD as we know it [S20]. The film should say "invented several times, independently" and not crown one person.

### 7.4 Mansfield "1973 amendment" [CONTESTED]
Wikipedia and Kasparov's *Deep Thinking* refer to a 1973 Mansfield Amendment that limited ARPA. No statute for a separate 1973 amendment surfaced. The verifiable record is the 1969 Sec. 203 (FY1970), replaced in 1970 by Sec. 204's "potential relationship" test, together with the 1972 rename to DARPA and the shift of IPTO budget growth toward 6.2 "Exploratory Development" [S8][S10]. Safe wording: "In 1969, Congress's Mansfield Amendment told the Pentagon to fund only research with a clear military purpose. The rule was soon softened, but the message stuck."

### 7.5 The date of the Lighthill debate [CONTESTED]
See the timeline. Use "1973" without a day.

---

## 8. Misconceptions to avoid

1. **"Perceptrons proved neural networks can't compute XOR."** It proved that *single-layer, order-limited* perceptrons cannot compute parity or connectedness. Multi-layer threshold networks were known to compute XOR. The open problem was *training* them [S4][S5].
2. **"Minsky and Papert proved multi-layer networks are useless."** They stated an "intuitive judgment" and explicitly called the question "an important research problem" [S4][S43].
3. **"The book alone caused the AI winter."** Funding pressure (Mansfield, DARPA), ALPAC, Lighthill, the end of SUR, hype backlash and real technical obstacles all contributed. See 7.1.
4. **"There was one AI winter that froze everything."** Symbolic AI funding at MIT, Stanford and CMU continued, with more strings attached [S9]. Expert systems boomed around 1980. The "first winter" hit neural nets, machine translation and UK AI hardest, at different times.
5. **"Lighthill attacked neural nets."** His category C endorsed "computer-based models of neural nets" for neuroscience. His target was general-purpose robotics/AI (category B) [S12].
6. **"Rosenblatt died a broken man / suicide."** Sources say drowning in a sailing accident on his birthday [S11]. Do not speculate about his state of mind. O'Brien said the funding loss "didn't impinge on him emotionally, as it would for many people" [S11].
7. **"The 1958 NYT story was about the Mark I hardware."** The 1958 demo was a simulation on an IBM 704; the Mark I came after [S31].
8. **"Nobody worked on neural nets in the 1970s."** False; see the list of winter-era researchers in section 1.
9. **"ALPAC was about AI or neural nets."** It was about machine translation and computational linguistics [S1].
10. **Papert's "Snow White" passage is not a confession that they set out to kill neural nets.** He presents it as the connectionists' fairy tale, then answers it with nuance (Q2-Q5) [S6].
11. **The Mansfield Amendment did not literally "cut DARPA's AI budget".** It changed the justification required. The NRC says DARPA's AI money to CMU, MIT and Stanford did not stop or shrink much at first [S9].

---

## 9. Curiosity hooks

1. **The book came to bear a dedication to the man it was read as burying.** After Rosenblatt drowned in 1971, the authors' handwritten second printing (1972) carried the line "In memory of Frank Rosenblatt"; he and Minsky had been at Bronx Science a year apart [S5][S52]. (Do not say the 1969 first printing was dedicated to him: that is unconfirmed, and "In memory of" cannot predate his death.)
2. **Rosenblatt died on his own birthday,** drowning on 11 July 1971, his 43rd birthday, while sailing a sloop named *Shearwater* on Chesapeake Bay [S11].
3. **The perceptron man built an observatory.** With grad students living in his house near Ithaca, he worked on Tobermory by day and built a backyard observatory by night: "Frank did most of the masonry" [S11].
4. **"The heart of a pig."** Papert, nineteen years later, retold the story as Snow White, with himself and Minsky as the huntsman [S6].
5. **The man who froze British AI was a champion open-water swimmer.** In 1973, the year of his televised AI debate, Lighthill became the first person to swim around Sark. He died there in 1998 on his seventh attempt [S38][S39].
6. **The mathematical core of modern deep learning first appeared in a Finnish master's thesis about rounding errors,** written in 1970 with FORTRAN code, and not about neural networks at all [S20][S21].
7. **A broadcasting company invented the CNN's ancestor.** Fukushima's Neocognitron came from NHK, Japan's public broadcaster, at its science research labs in Setagaya, Tokyo [S27][S28].
8. **ALPAC found the government had spent about $20 million in ten years on machine translation, more than a year's government spending on human translation,** and that edited machine output was slower and dearer than human translation [S1].
9. **Rosenblatt's own word "back-propagating" appears in 1962,** a dozen years before Werbos's thesis and 24 before the Nature paper [S34][S35].
10. **Lighthill's report mused that men build robots to compensate for not being able to give birth.** This is a real, odd passage in an official government-commissioned report [S12].

---

## 10. Visual and dramatic details

- **Royal Institution debate (London, 1973).** Staged like a courtroom: Lighthill stood behind a lectern on a raised platform; Michie, Gregory and McCarthy sat "in the pit" below [S14]. The RI lecture theatre is steeply raked and horseshoe-shaped with wooden benches. Film clips of Edinburgh's Freddy robot and SRI's Shakey were shown during the programme [S14]. Length about 81-90 minutes [S13][S14]. Silhouette staging: a lone lectern figure above, three seated challengers below, tiered audience rising behind.
- **The Mark I Perceptron** (see 5.1): 1950s grey cabinets; "MARK I" and "PERCEPTRON" stencilled lettering [S32]; a patch-board jungle; rows of potentiometer knobs that physically turned during learning; meters; a 20x20 photocell eye; a card with a letter or a shape lit in front of it.
- **The 1958 Navy press demonstration** in Washington: reporters, an IBM 704 (the Weather Bureau's $2,000,000 machine), punched cards marked left or right [S31].
- **Rosenblatt's world:** Cornell Ithaca in the 1960s; the Brooktondale farmhouse with students; a pasture where they dug observatory foundations; a $3,000 telescope [S11]. Late 1960s campus politics (the 1969 Willard Straight Hall occupation; he worked to improve campus climate afterwards) [S11].
- **His death:** a small sailing sloop on the broad, shallow Chesapeake Bay in July. Do not invent weather, time of day or circumstances. Sources give only "drowned while sailing."
- **MIT, late 1960s:** Tech Square, Project MAC, PDP-6/PDP-10 machines; Papert and Minsky at a chalkboard with retina diagrams (the book itself is full of hand-drawn figures of spirals and connected/disconnected figures; the cover shows a pair of spiral-like figures, one connected and one not; check reference). The spiral-maze connectedness figure is ideal for silhouette: a perceptron "looking" through small windows cannot tell whether the spiral is one piece.
- **Lighthill:** Cambridge, the Lucasian chair (Newton's chair); a mathematician who swam in rough tidal seas. Paper-cut motif: a swimmer's silhouette circling a rocky island, echoing the combinatorial explosion as currents.
- **ALPAC:** 1960s Washington committee room; Russian scientific journals; punched-card printouts of garbled machine Russian-to-English. The report reproduces real unedited output, e.g. "...there was conducted the check for the state or PIGMENTAQII the hair at black mice..." [S1], usable verbatim as on-screen texture.
- **The winter dissenters:** Kyiv's Institute of Cybernetics (Ivakhnenko); a Helsinki university room with FORTRAN printouts (Linnainmaa); NHK's Tokyo research labs (Fukushima); a Harvard graduate carrel (Werbos); Boston University (Grossberg). Visual idea: small, scattered candle-lights across a dark snowy map, Kyiv, Helsinki, Tokyo, Kyushu, Boston and Cambridge MA, each a lone researcher keeping the flame.
- **Funding motif:** Papert's "Lord DARPA" with "the largest coffers ever seen in the kingdom of the sciences" [S6]. It suits paper-cut theatre (a fairy-tale court with two sister sciences), provided it is framed as Papert's satirical telling.

---

## 11. Sources

1. ALPAC, *Language and Machines: Computers in Translation and Linguistics* (NAS-NRC Pub. 1416, 1966), full text: https://nap.nationalacademies.org/resource/alpac_lm/ARC000005.pdf (also https://www.mt-archive.net/50/ALPAC-1966.pdf)
2. ALPAC overview (membership, dates, printings): https://en.wikipedia.org/wiki/ALPAC
3. John Hutchins, "ALPAC: the (in)famous report" (1996): https://aclanthology.org/www.mt-archive.info/90/MTNI-1996-Hutchins.pdf
4. Quote Investigator, "Our Intuitive Judgment That the Extension Is Sterile" (24 July 2026): https://quoteinvestigator.com/2026/07/24/perceptron-sterile/
5. "Perceptrons (book)", Wikipedia (theorems, reviews, dedication, 1988 edition; cites Block 1970, Newell 1969, Pollack 1989, Olazaran 1996): https://en.wikipedia.org/wiki/Perceptrons_(book)
6. Seymour Papert, "One AI or Many?", *Daedalus* 117(1):1-14 (Winter 1988): https://www.jstor.org/stable/20025136; scan: https://gwern.net/doc/ai/1988-papert.pdf
7. Mansfield Amendment (1969), wording and context: https://theportal.wiki/wiki/Mansfield_Amendment_(1969); NSF history (archived page): https://nsf.gov/nsb/documents/2000/nsb00215/nsb50/1970/mansfield.html
8. FY1971 Act text (P.L. 91-441, Sec. 203/204): https://www.govinfo.gov/content/pkg/STATUTE-84/pdf/STATUTE-84-Pg905.pdf; current statute notes: https://www.law.cornell.edu/uscode/text/10/4001
9. National Research Council, *Funding a Revolution* (1999), ch. 9 "Developments in Artificial Intelligence": https://nap.nationalacademies.org/read/6323/chapter/11
10. NRC, *Funding a Revolution*, ch. 4 (Mansfield, ARPA to DARPA 1972, 6.1 to 6.2 shift): https://nap.nationalacademies.org/read/6323/chapter/6; DARPA, "ARPA becomes DARPA": https://www.darpa.mil/about/innovation-timeline/arpa-becomes-darpa
11. Melanie Lefkowitz, "Professor's perceptron paved the way for AI – 60 years too soon," Cornell Chronicle, 25 Sept 2019: https://news.cornell.edu/stories/2019/09/professors-perceptron-paved-way-ai-60-years-too-soon
12. Lighthill, "Artificial Intelligence: A General Survey" (July 1972) and replies, in *Artificial Intelligence: a paper symposium* (SRC, 1973): https://rodsmith.nz/wp-content/uploads/Lighthill_1973_Report.pdf; original Chilton archive: http://www.chilton-computing.org.uk/inf/literature/reports/lighthill_report/contents.htm
13. University of Edinburgh AIAI, "BBC TV - June 1973 - Lighthill Controversy Debate at the Royal Institution": https://www.aiai.ed.ac.uk/events/lighthill1973/
14. "Lighthill report", Wikipedia (debate staging, 9 May 1973 date, Freddy/Shakey): https://en.wikipedia.org/wiki/Lighthill_report; "Freddy II": https://en.wikipedia.org/wiki/Freddy_II
15. Mikel Olazaran, "A Sociological Study of the Official History of the Perceptrons Controversy," *Social Studies of Science* 26(3):611-659 (1996): https://doi.org/10.1177/030631296026003005 (abstract: https://colab.ws/articles/10.1177%2F030631296026003005)
16. Yuxi Liu, "The Perceptron Controversy" (essay; used as a LEAD for secondhand quotes): https://yuxi.ml/essays/posts/perceptron-controversy/
17. A. G. Ivakhnenko, "Polynomial Theory of Complex Systems," IEEE Trans. SMC 1(4):364-378 (1971): https://gmdh.net/articles/history/polynomial.pdf
18. J. Schmidhuber, "Deep Learning in Neural Networks: An Overview" (2014): https://arxiv.org/pdf/1404.7828
19. S. Amari, "A Theory of Adaptive Pattern Classifiers," IEEE Trans. EC-16(3):299-307 (1967): https://people.idsia.ch/~juergen/amari1967.pdf
20. Baydin et al., "Automatic Differentiation in Machine Learning: a Survey": https://arxiv.org/pdf/1502.05767; Linnainmaa, "Taylor expansion of the accumulated rounding error," BIT 16:146-160 (1976): https://link.springer.com/article/10.1007/BF01931367
21. J. Schmidhuber, "Who Invented Backpropagation?": https://people.idsia.ch/~juergen/who-invented-backpropagation.html
22. T. Kohonen, "Correlation Matrix Memories," IEEE Trans. Computers C-21:353-359 (1972): https://direct.mit.edu/books/edited-volume/5431/chapter/4468693/1972-Teuvo-Kohonen-Correlation-matrix-memories
23. T. Kohonen, "Self-Organized Formation of Topologically Correct Feature Maps," Biol. Cybern. 43:59-69 (1982); summary: https://www.scholarpedia.org/article/Kohonen_network
24. Carpenter and Grossberg, "Adaptive Resonance Theory" (shunting networks 1973): http://www.scholarpedia.org/article/Adaptive_resonance_theory
25. S. Grossberg, "Adaptive Pattern Classification and Universal Recoding I" (1976): https://sites.bu.edu/steveg/files/2016/06/Gro1976BiolCyb_I.pdf
26. "Paul Werbos", Wikipedia (1974 thesis, advisers, 1982 publication): https://en.wikipedia.org/wiki/Paul_Werbos; thesis record: https://www.bibsonomy.org/bibtex/2b0644d7aa84be0df0f198d586d341843/schaul
27. K. Fukushima, "Neocognitron," Biol. Cybern. 36:193-202 (1980): https://link.springer.com/article/10.1007/BF00344251; PDF: https://www.rctn.org/bruno/public/papers/Fukushima1980.pdf
28. "Neocognitron", Wikipedia (NHK STRL, Setagaya): https://en.wikipedia.org/wiki/Neocognitron
29. F. Rosenblatt, *The Perceptron: A Perceiving and Recognizing Automaton* (Project PARA), CAL Report 85-460-1 (1957): https://web.archive.org/web/20230407120421/https://blogs.umass.edu/brain-wars/files/2016/03/rosenblatt-1957.pdf
30. "Mark I Perceptron", Wikipedia (400 photocells, 512 A-units, 8 R-units, motor-driven potentiometers): https://en.wikipedia.org/wiki/Mark_I_Perceptron; "Perceptron": https://en.wikipedia.org/wiki/Perceptron
31. T. Sejnowski, "The Unreasonable Effectiveness of Deep Learning in AI" (NYT 1958 transcription): https://arxiv.org/pdf/2002.04806; clipping scan: https://jcblackmon.com/2018/01/08/rosenblatts-perceptron/
32. Smithsonian NMAH, "Electronic Neural Network, Mark I Perceptron," ID 1987.0819.01: https://americanhistory.si.edu/collections/object/nmah_334414
33. George Nagy, "Frank Rosenblatt, my distinguished advisor" (2011, Tobermory schematics): https://sites.ecse.rpi.edu/~nagy/PDF_chrono/2011_Nagy_Pace_FR.pdf
34. Britannica, "back-propagating error correction": https://www.britannica.com/technology/back-propagating-error-correction
35. Joe Pater, "Did Frank Rosenblatt invent deep learning in 1962?": https://websites.umass.edu/comphon/?p=798
36. ACM Turing Award, Marvin Minsky (1969): https://amturing.acm.org/award_winners/minsky_7440781.cfm
37. Research note citing a contemporaneous SRI report for the 4 July / 30 August 1973 dates (LEAD only): https://github.com/tmzncty/problem-history/pull/14
38. MacTutor, "James Lighthill (1924-1998)": https://mathshistory.st-andrews.ac.uk/Biographies/Lighthill/
39. "Sir James Lighthill" obituary, J. Fluid Mech. 386:1-3 (1999): https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/sir-james-lighthill/E4D4024659B1C6197CC578FA95E09D98
40. AI Now Institute, "AI and Tech Industrial Policy" (cites NRC on the 1975 low and Heilmeier): https://ainowinstitute.org/publications/ai-and-tech-industrial-policy-from-post-cold-war-post-industrialism-to-post-neoliberal-re-industrialization
41. John McCarthy, "Review of 'Artificial Intelligence: A General Survey'": http://www-formal.stanford.edu/jmc/reviews/lighthill/lighthill.html
42. Yuxi Liu, "The Backstory of Backpropagation" (LEAD for Werbos/*Talking Nets* quotes): https://yuxi.ml/essays/posts/backstory-of-backpropagation/
43. Pierre Baldi, Connectionists mailing list, 1 Feb 2022 (verbatim pp. 231-232 passage; "killed neural nets" exaggeration claim): https://mailman.srv.cs.cmu.edu/pipermail/connectionists/2022-February/037275.html
44. Frank Rosenblatt, Wikipedia (dates; cites the Cornell memorial statement by Emlen, Howland and O'Brien): https://en.wikipedia.org/wiki/Frank_Rosenblatt
45. Richard Gregory, Royal Society Biographical Memoir (Edinburgh 1967-70; Bristol from 1970): https://royalsocietypublishing.org/rsbm/article/64/1/163/63937/Richard-Langton-Gregory-24-July-1923-17-May; CV: https://www.richardgregory.org/cv.htm
46. P.L. 91-121, 83 Stat. 204 (19 Nov 1969), Sec. 203: https://www.govinfo.gov/content/pkg/STATUTE-83/pdf/STATUTE-83-Pg204.pdf
47. Journal of Fluid Mechanics obituary of Lighthill (1999), ADS abstract ("carrying out the swim for the seventh time"): https://ui.adsabs.harvard.edu/abs/1999JFM...386....1C/abstract
48. Smithsonian Open Access record for the Mark I Perceptron (ID 1987.0819.01, date made 1958, 1967 transfer, not on view): https://api.si.edu/openaccess/api/v1.0/search?q=%22Mark+I+Perceptron%22 (catalog page S32)
49. Quote Investigator page (S4) re-checked 2026-10-05: contains Freedman p. 74, PDP p. 361, 1988 Prologue fragments, Mitchell p. 32; no LeCun quote.
50. Olazaran 1996 abstract (via colab.ws, S15).
51. New York Times archive, 8 July 1958, p. 25: https://www.nytimes.com/1958/07/08/archives/new-navy-device-learns-by-doing-psychologist-shows-embryo-of.html
52. Minsky and Papert, *Perceptrons*, 2017 MIT Press reissue of the 1988 Expanded Edition, front matter ("Handwritten alterations were made by the authors for the second printing (1972)"): https://leon.bottou.org/publications/pdf/perceptrons-2017.pdf; 1988 front matter with "In memory of Frank Rosenblatt": https://www.scribd.com/document/770825076/Perceptrons-Marvin-Minsky-Seymour-Papert

---

## 12. Fact-check log (adversarial pass, 2026-10-05)

Method: each key claim was re-checked against an opened source, not the dossier's own citation. Primary texts were downloaded and searched by string: Papert 1988 *Daedalus* (JSTOR scan via gwern), the Lighthill report (SRC 1973 symposium, rodsmith.nz copy of the Chilton text), the ALPAC report (NAP PDF), P.L. 91-121 and P.L. 91-441 (govinfo), Fukushima 1980 (PDF), Schmidhuber 2014 (arXiv), Hutchins 1996, the Bottou/MIT 2017 reissue of *Perceptrons*, and the Smithsonian Open Access record.

**Confirmed verbatim against primary text:** Q2-Q5 (Papert, including the page breaks: Snow White p. 3-4, "heart of a pig" and "misleading in its suggestion" p. 4, "some hostility" p. 4-5, "Money was at stake" p. 7, "fate as bad as death" p. 8); Q6-Q9 (Lighthill; "July 1972" dateline; categories A "Advanced Automation", B "Bridge activity" / "Building Robots", C "Computer-based CNS research"; category C's "computer-based models of neural nets"); Q10 (McCarthy's written review); Q11-Q12 (ALPAC); Q13 (Sec. 203, P.L. 91-121, 19 Nov 1969); P.L. 91-441 (7 Oct 1970) Sec. 204 "potential relationship" wording; Q14 (NYT 8 July 1958); Q16 and the Cornell Chronicle details ("loyal opposition", "Frank did most of the masonry", $3,000 telescope, Brooktondale, Eugene McCarthy at the memorial, O'Brien's "impinge"); Neocognitron citation, NHK Kinuta/Setagaya affiliation, received 28 Oct 1979, and the "without affected by their positions" abstract wording; Smithsonian ID 1987.0819.01; Lighthill born 23 Jan 1924 in Paris, Lucasian chair 1969-79, first swim round Sark 1973 at 49, died 17 July 1998 on his seventh swim (JFM obituary; MacTutor's "half a dozen times" is looser); ALPAC formed April 1964 under John R. Pierce, report November 1966; Schmidhuber's 8-layer GMDH (1971) and Linnainmaa 1970 FORTRAN; Q1 via Baldi 2022 and Quote Investigator (ch. 13, pp. 231-232).

**Changes made:**
1. **Dedication (key claim 4), corrected.** The documented dedication is the handwritten "In memory of Frank Rosenblatt", which appears with the authors' handwritten alterations for the second printing (1972), after his death in July 1971. It cannot have been in the 1969 first printing in that form; whether the 1969 printing had any dedication is unconfirmed (only Hecht-Nielsen's secondhand anecdote suggests it). Timeline 1972 row and Hook 1 rewritten. Sources: S52, S16, S5.
2. **Key claim 1 wording, corrected.** Connectedness needs order growing at least as |R|^(1/2): an unbounded *number* of points per detector, not "a growing fraction" of the retina (|R|^(1/2)/|R| shrinks). Parity needs order |R|, meaning some detector sees every point. The dossier body (5.3) was already correct. Source: S5.
3. **Key claim 3 / 5.4, corrected.** "In 1969 nobody had a practical way to learn hidden-unit weights" overstates it: Amari 1967 (and Saito's five-layer, two-modifiable-layer experiments) and Ivakhnenko's GMDH trained multi-layer systems, but these were little known in the US mainstream. Caveat added. Sources: S19, S21, S18.
4. **Richard Gregory's affiliation, corrected.** He left Edinburgh in 1970 for Bristol (Brain and Perception Laboratory), so in 1973 he debated from Bristol. Source: S45.
5. **McCarthy quote context, corrected.** "no place for what is or should be our main scientific activity" is from his written review, not the televised debate. People entry and Q10 heading fixed. Source: S41.
6. **Michie, corrected** from "founder" to co-founder (1967, with Gregory and Longuet-Higgins) of the Department of Machine Intelligence and Perception. Source: S45.
7. **Olazaran paraphrase, corrected** to match his abstract (rise, institutionalisation and legitimation of symbolic AI, including its funding and authority structure); removed the unsupported "who believed resources were being diverted from them". Source: S15/S50.
8. **Papert funding motive, context added** (key claim 5): his next sentence says "most of the motivation for Perceptrons came from more fundamental concerns". Source: S6.
9. **Timeline order, corrected** (June 1967 Amari row moved after the November 1966 ALPAC row).
10. **ALPAC $20 million, marked CONTESTED.** The figure and the "more than the government cost of translation for 1 year" line are verbatim ALPAC, but Hutchins argues US MT research funding "may well have been nearer $12-13 million". Hutchins's "some twenty years" effect is now quoted. Sources: S1, S3.
11. **Werbos 1974, marked CONTESTED** (key claim 15). Schmidhuber: 1974 has only "preliminary, NN-specific discussion"; first NN-specific application of efficient BP in 1982. Werbos and Wikipedia credit the 1974 thesis. Sources: S18, S21, S26.
12. **Mark I build date, marked CONTESTED.** The Smithsonian says 1958; Jensen and Dunning give assembly in June-December 1959; Nilsson gives a first public demonstration on 23 June 1960. The Smithsonian record adds RADC funding, the 1967 transfer and "Currently not on view". The 400/512/8 unit counts are secondary (via Wikipedia "Perceptron"). Sources: S32, S48, S30.
13. **Lighthill debate date, still CONTESTED** (key claim 12). Edinburgh AIAI labels it "June 1973" (81 minutes); Wikipedia gives 9 May 1973, citing only a 2024 GitHub repo; a research note citing a contemporaneous SRI report gives 4 July filming and a 30 August BBC2 broadcast. No BBC Genome listing was found. Keep "1973". Sources: S13, S14, S37.
14. **Widrow "So we stopped..." quote demoted** to UNVERIFIED (seen only via a secondary essay).
15. **LeCun 2016 quote**: the Quote Investigator page does not contain it. It stays UNVERIFIED.
16. **Q18 "little of significance had/[has] changed since 1969"**: the wording and location (Prologue p. vii per QI vs closing chapter per Wikipedia/Pollack) conflict. Marked UNVERIFIED as a verbatim quote.
17. **Additions:** NYT p. 25, the 7 July dateline, and the article's "$100,000" / "about a year" / 1,000 association cells and 400 photocells (S51); ALPAC's garbled machine-translation sample as an on-screen texture (S1); Minsky "was a grade behind Rosenblatt" (S11).

**Confirmed without change:** key claims 2, 5, 6 (Baldi's wording verified: "an exaggeration propagated by the PDP group"), 7, 8 (with the caveats above), 9, 10, 11, 13 (the Chilton/SRC overview: "It persisted for almost a decade", next major activity the September 1982 IKBS review leading to Alvey), 14 and 16.
