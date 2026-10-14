# Dossier: Rosenblatt's Perceptron and the First Neural Boom (1957-1965)

id: `perceptron-first-boom` · era: 1957-1965 · as-of: 2026-10-05
Status: drafted from prior knowledge, then verified against primary sources where flagged **[PRIMARY-VERIFIED]**. Source numbers like [S3] refer to Section 11.

Verification legend:
- **[PRIMARY-VERIFIED]**: checked word for word in a primary document during this research pass (scan or archival page).
- **[SECONDARY]**: from a reputable secondary source; the primary was not re-read.
- **[CONTESTED]**: sources disagree; both sides are given.
- **[UNVERIFIED]**: do not state as fact or quote.

---

## 1. Summary

In 1957-58 Frank Rosenblatt, a Cornell-trained research psychologist at the Cornell Aeronautical Laboratory (CAL) in Buffalo, New York, proposed the **perceptron**. It was a network of simple threshold units whose connection strengths change when the machine makes a mistake. The Office of Naval Research (ONR) funded it from July 1957 under Project PARA (contract Nonr-2381(00)) [S3][S2]. He first ran it as a simulation on an IBM 704. On 7 July 1958 he and the Navy demonstrated it to reporters in Washington: after 50 trials the machine learned to tell punch cards marked on the left from cards marked on the right. A UPI wire story, printed in *The New York Times* on 8 July 1958 (p. 25), opened with the claim that the Navy "expects will be able to walk, talk, see, write, reproduce itself and be conscious of its existence" [S1]. (The lede attributes this to the Navy; later paragraphs of the same story, as transcribed by secondary sources, reportedly attribute similarly sweeping predictions to Rosenblatt himself; see Section 7.1 and the Fact-check log.) *The New Yorker* reported in December 1958 that "The first perceptron has yet to be built, but it has been successfully simulated on a 704" [S28].

The theory appeared in *Psychological Review* in November 1958 [S2]. The hardware followed: the **Mark I Perceptron** was assembled and tested in Buffalo in 1959 (per a 2026 participant account; the Smithsonian's record says "date made 1958" — **[CONTESTED]**, see Section 7.6) and first shown publicly on 23 June 1960 [S30][S6][S5]. It was a room of cabinets with these parts:
- a 20×20 "retina" of 400 photocells;
- a patch-panel plugboard wiring those cells at random to 512 association units;
- eight response units;
- learned weights stored in **motor-driven potentiometers** [S3][S6].

In 1961-62 Rosenblatt published his full theory, *Principles of Neurodynamics*. In its preface he complained about the press, which "fell to the task with all of the exuberance and sense of discretion of a pack of happy bloodhounds", and he insisted that "A perceptron is first and foremost a brain model, not an invention for pattern recognition" [S3].

The **perceptron convergence theorem** says that if any set of weights can classify the training examples correctly, the error-correction rule will find one in a finite number of corrections. Rosenblatt's own early proof was, in his words, "insufficient to prove the theorem in a rigorous fashion". Rosenblatt credited the subsequent rigorous forms to "Block, Joseph, Kesten, and others", and his March 1961 book already gives a corrected proof with a bound on the number of corrections. Block (1962) and A. B. J. Novikoff (1962) then published proofs; Novikoff's gives the clean (R/γ)² mistake bound [S3][S9][S10].

Parallel work:
- Oliver Selfridge's **Pandemonium** (MIT Lincoln Laboratory; presented at the Teddington symposium, November 1958; published 1959): layers of "demons", each shrieking, with a decision demon that picks the loudest [S17].
- Bernard Widrow and Ted Hoff's **ADALINE** and the **LMS rule** (Stanford, fall 1959; published 1960). They found the rule on a blackboard one Friday afternoon and built the first adaptive neuron in a box over a single weekend [S11][S12].
- Widrow's group then built **MADALINE** networks of many ADALINEs, trained by Madaline Rule I (Widrow 1962; mathematical analyses in the PhD theses of Ridgway, April 1962, Hoff, July 1962, and Glanz) [S13][S14].

The rival school was symbolic AI: the 1956 Dartmouth proposal, Newell and Simon's heuristic programs, and McCarthy and Minsky's MIT AI Project (1959). That school drew the larger, more flexible ARPA money after 1962-63 [S20][S31][S22]. Marvin Minsky built one of the first neural-net machines himself (SNARC, 1951), then turned against the approach. In 1961 he wrote that randomly connected nets "can probably never achieve recognition of such patterns as 'the class of figures having two separated parts'". Rosenblatt called Minsky's article "an entertaining statement of the views of the loyal opposition" [S19][S3]. Minsky and Rosenblatt both attended the Bronx High School of Science in the 1940s; sources disagree on which of them was ahead [S4][S25][S26].

By about 1965-66 the boom was fading:
- SRI and Widrow's group had largely left neural nets.
- Rosenblatt continued with less money.

The decisive blow, Minsky and Papert's *Perceptrons* (1969), belongs to the next dossier [S23][S22].

---

## 2. Timeline

| Date | Event | Sources |
|---|---|---|
| 1943 | McCulloch and Pitts publish the logical model of the neuron (background). Rosenblatt's 1958 paper cites them among those building "logical contrivances". | [S2] [PRIMARY-VERIFIED cite], [S6] |
| 1949 | Donald Hebb, *The Organization of Behavior*. Rosenblatt in 1958 called Hebb's work "a source of inspiration for much of what has been proposed here". | [S2] [PRIMARY-VERIFIED] |
| Summer 1951 | Minsky and Dean Edmonds build SNARC, a 40-"neuron" learning machine with motors and vacuum tubes, partly funded by ONR through George Miller. Minsky's 1954 Princeton PhD is on "neural-analog reinforcement systems". | [S27], [S24] [SECONDARY] |
| 31 Aug 1955 | The Dartmouth proposal (McCarthy, Minsky, Rochester, Shannon) lists "Neuron Nets" as research topic 3 and states the "conjecture that every aspect of learning ... can in principle be so precisely described that a machine can be made to simulate it." | [S20] [PRIMARY-VERIFIED] |
| Summer 1956 | Dartmouth summer project. Bernard Widrow (then at MIT) attends for one week. Afterwards he spends "the next six months thinking about thinking." | [S11] [PRIMARY-VERIFIED] |
| 1956 | Rosenblatt receives his Cornell PhD in psychology. For his thesis he built the EPAC (Electronic Profile Analyzing Computer). | [S4], [S7] [SECONDARY] |
| Jan 1957 | Rosenblatt's CAL report "The Perceptron: a perceiving and recognizing automaton" (Project PARA). | [S8] [SECONDARY] |
| July 1957 | ONR Information Systems Branch begins supporting the Buffalo program. | [S3] [PRIMARY-VERIFIED: "the Buffalo program since July, 1957"] |
| 14 Nov 1957 | Simon presents "Heuristic Problem Solving" (Simon & Newell) at the ORSA banquet in Pittsburgh. It predicts a computer chess champion "within ten years". Published in *Operations Research* in Jan/Feb 1958. | [S21] [SECONDARY on wording] |
| Jan 1958 | CAL Report VG-1196-G-1, "The Perceptron: A theory of statistical separability in cognitive systems". | [S2] ref. 15 [PRIMARY-VERIFIED] |
| 7 July 1958 | Navy/ONR press demonstration in Washington. A perceptron program running on the Weather Bureau's IBM 704 learns left from right "after fifty attempts". | [S1], [S4], [S43] [SECONDARY transcription of the UPI text; S32 does NOT contain this sentence], [S22] (Olazaran: press conference in Washington, 7 July 1958) |
| 8 July 1958 | *NYT* p. 25 prints the UPI story "NEW NAVY DEVICE LEARNS BY DOING; Psychologist Shows Embryo of Computer Designed to Read and Grow Wiser". | [S1] [PRIMARY-VERIFIED: headline, date, page, dateline, lede] |
| Summer 1958 | Rosenblatt, "The Design of an Intelligent Automaton", *Research Trends* (CAL) 6(2): "we are about to witness the birth of such a machine". *Neurodynamics* ref. 81 also lists it in ONR's *Research Reviews*, Washington, October 1958, pp. 5-13. | [S4], [S33] [SECONDARY], [S3] ref. 81 [PRIMARY-VERIFIED citation] |
| Nov 1958 | *Psychological Review* 65(6): 386-408: "The perceptron: a probabilistic model for information storage and organization in the brain". | [S2] [PRIMARY-VERIFIED], [S38] |
| 24-27 Nov 1958 | "Mechanisation of Thought Processes" symposium, National Physical Laboratory, Teddington, UK. Selfridge presents Pandemonium, McCarthy presents the Advice Taker, and Rosenblatt's paper "Two Theorems of Statistical Separability in the Perceptron" appears in the proceedings (vol. I, HMSO 1959). | [S17], [S42], [S3] ref. 82 [PRIMARY-VERIFIED citation], [S44] (dates 24-27 Nov) |
| 6 Dec 1958 (print issue) | *The New Yorker*, Talk of the Town, "Rival" (Harding Mason, D. Stewart, Brendan Gill): "...indeed, it strikes us as the first serious rival to the human brain ever devised". | [S28] [PRIMARY-VERIFIED via newyorker.com archive text] |
| Dec 1958 | Photograph of Rosenblatt and engineer Charles W. Wightman working on part of the first perceptron unit (Cornell archives). | [S4] |
| 1959 | McCarthy and Minsky start the MIT Artificial Intelligence Project. | [S24], [S37] |
| 1959 | Selfridge's paper is published in the Teddington proceedings (HMSO, 1959; pp. 511ff.). | [S17] [PRIMARY-VERIFIED] |
| June-14 Dec 1959 | Mark I assembled and tested at CAL, Buffalo. **[CONTESTED]**: this rests on Jensen & Dunning, "Assembling and Training the Perceptron: A Personal Account", *IEEE Annals* 48(2), 2026 (as cited by Wikipedia); the Smithsonian record gives "date made 1958" and says it was constructed "by the following year" after 1957. | [S6] [SECONDARY], [S5] |
| Sept 1959 | The Cornell (Ithaca) program begins under ONR; Rosenblatt becomes director of the Cognitive Systems Research Program. | [S3] [PRIMARY-VERIFIED], [S4] |
| Fall 1959 (a Friday afternoon) | Widrow and Ted Hoff derive the LMS rule at Widrow's blackboard at Stanford. It runs on an analog computer "within a half hour". The ADALINE box is built over that weekend. | [S11] [PRIMARY-VERIFIED] |
| 19 Dec 1959 | A *New Yorker* line ("Perception is standing on the sidewalk, watching all the girls go by.") later becomes an epigraph of *Principles of Neurodynamics*. | [S3] [PRIMARY-VERIFIED] |
| Mar 1960 | Rosenblatt, "Perceptron Simulation Experiments", *Proc. IRE* 48(3): 301-309. | [S39], [S8] |
| 23 June 1960 | First public demonstration of the Mark I Perceptron (press conference records CBI 48, Charles Babbage Institute: statements by Albert E. Murray, Rosenblatt and Marshall C. Yovits; WorldCat summary dates the press demonstration June 23, 1960). | [S30], [S6] |
| June-Aug 1960 | Widrow & Hoff, "Adaptive Switching Circuits": Stanford Electronics Labs TR 1553-1 (30 June 1960) and *IRE WESCON Convention Record*, Part 4, pp. 96-104 (Aug 1960). | [S12], [S11] |
| Oct 1960 | Widrow, "An Adaptive 'Adaline' Neuron Using Chemical 'Memistors'", Stanford TR 1553-2. | [S16] [SECONDARY] |
| Jan 1961 (dated) | Minsky, "Steps Toward Artificial Intelligence", *Proc. IRE* 49 (Rosenblatt calls it the statement of "the loyal opposition"). | [S19] [PRIMARY-VERIFIED], [S3] |
| 15 Mar 1961 | Rosenblatt signs the preface of *Principles of Neurodynamics* (CAL report; DTIC AD0256582). The Spartan Books edition appears in 1962. | [S3] [PRIMARY-VERIFIED] |
| 1962 | H. D. Block, "The Perceptron: A Model for Brain Functioning. I", *Rev. Mod. Phys.* 34: 123 (Cornell). | [S9] [PRIMARY-VERIFIED citation] |
| 1962 | A. B. J. Novikoff, "On convergence proofs on perceptrons", Symposium on the Mathematical Theory of Automata, Polytechnic Institute of Brooklyn, vol. XII, pp. 615-622. | [S10] [SECONDARY citation] |
| 1962 | Widrow, "Generalization and information storage in networks of Adaline 'neurons'" (*Self-Organizing Systems 1962*). Madaline Rule I (MRI) is credited by Widrow & Lehr to "Widrow and his students" (citing this 1962 paper): a layer of ADALINEs feeding a fixed OR/AND/majority unit. W. C. Ridgway III's PhD thesis (Stanford TR 1556-1, April 1962) supplied mathematical analysis (as did Hoff's, July 1962). | [S13], [S14] [PRIMARY-VERIFIED in S13] |
| 1961-1967 | Tobermory, a larger speech-oriented perceptron with 12,000 weights in magnetic cores, is built at Cornell. | [S7], [S4] [SECONDARY] |
| 1 July 1963 | MIT's Project MAC officially starts; $2,220,000 awarded by ONR on behalf of ARPA (Licklider had proposed $2 million). About a third of MAC's resources went to the Minsky AI group; most went to time-sharing. | [S31] [SECONDARY] |
| 1963-1966 | The Mark I is part of a formerly secret four-year NPIC (CIA) effort to develop the perceptron into a tool for photo-interpreters. (A Wikipedia summary gives "1960 to 1964" for a CIA Photo Division study; O'Connor's archival dates are preferred.) | [S29] [SECONDARY, peer-reviewed; abstract checked] |
| ~1965-66 | Widrow: "At the time that Hoff left, about 1965 or 1966, we had already had lots of troubles with neural nets." SRI's Charles Rosen: "About 1965 or 1966 we decided that we were more interested in the other artificial intelligence techniques." | [S23] quoting Olazaran 1991 [SECONDARY] |
| 1967 | The Mark I comes to the Smithsonian "from Cornell University as a transfer from the Office of Naval Research" (NMAH ID 1987.0819.01; currently not on view). | [S5] [PRIMARY-VERIFIED, NMAH record text via Smithsonian Open Access API] |
| (After the era) 1969; 11 July 1971 | *Perceptrons* (Minsky & Papert). Rosenblatt drowns on his 43rd birthday while sailing on Chesapeake Bay. | [S4], [S7] |

---

## 3. People

Depiction note: these are silhouette and posture cues for respectful cut-outs. Confirm every silhouette against a licensed archival photograph before final art. Items marked (photo-check) are impressions, not facts.

### Frank Rosenblatt (b. 11 July 1928, New Rochelle NY; d. 11 July 1971)
- **Role:** inventor of the perceptron. Research psychologist, later head of the Cognitive Systems Section, at the Cornell Aeronautical Laboratory, Buffalo NY. From 1959, director of the Cognitive Systems Research Program at Cornell University, Ithaca NY. Later associate professor of neurobiology and behavior [S3][S4][S7].
- **Education:** Bronx High School of Science (class of 1946); Cornell A.B. 1950 and Ph.D. 1956 (social psychology / psychology) [S4][S7][S26].
- **Beliefs:** Rosenblatt was a connectionist and empiricist in the line of Hebb. He held that memory lives "in connections or associations rather than topographic representations" [S2]. He rejected brain models built from symbolic logic: "a difference in principle is clearly indicated" [S2]. He described the perceptron as a brain model, not an engineering gadget [S3]. Even so, he made big public claims in 1958 and wrote that "we are about to witness the birth of such a machine" [S4].
- **Character, per colleagues:** "he would reach out and grasp the biggest problems that he could see" (Richard O'Brien). Students lived at his house in Brooktondale and helped him build an astronomical observatory there. He also pursued music and mountaineering. In 1968 he campaigned for Eugene McCarthy [S4][S7].
- **How pictured (photo-check):** a slim young man in his late twenties or early thirties, with dark hair combed back. He wears a white shirt and narrow tie, sometimes a jacket. He is usually shown at the Mark I plugboard among a tangle of patch wires, often next to engineer Charles Wightman (Cornell photograph, Dec 1958) [S4]. Suggested silhouette: a lean figure leaning into a wall of wires.

### Charles W. Wightman, Francis Martin, John C. Hay (CAL engineers)
"The engineering work on the Mark I was carried out primarily by Charles Wightman and Francis Martin at C.A.L. The experimental program with the Mark I was carried out by John Hay" [S3] [PRIMARY-VERIFIED].

### H. D. (Henry David) Block (Cornell, Ithaca)
An applied mathematician who made the perceptron mathematics rigorous. Author of *Rev. Mod. Phys.* 34:123 (1962). Rosenblatt credits R. D. Joseph and H. D. Block as contributors who "should entitle them to co-authorship of several chapters" [S3][S9].

### A. B. J. Novikoff (Stanford Research Institute)
Gave the clean convergence proof with a mistake bound (1962) [S10]. Affiliation is [SECONDARY]; it is commonly given as SRI.

### Marvin Minsky (b. 9 Aug 1927, New York City)
- **Background:** Fieldston, then Bronx Science, then Phillips Academy Andover; U.S. Navy 1944-45; Harvard A.B. 1950; Princeton Ph.D. 1954, on neural-analog reinforcement systems [S24].
- **Neural work:** built SNARC in summer 1951 with Dean Edmonds. In Minsky's 1981 recollection he expected it to "work pretty well with about forty neurons" and that "in principle, at least" each could be realized "with just six vacuum tubes and a motor"; the machine as built "had three hundred tubes and a lot of motors", with forty control knobs as its memory. George Miller got "a couple of thousand dollars from the Office of Naval Research" for it [S27, Bernstein, *New Yorker* 1981, quoting Minsky].
- **Turn to symbolic AI:** co-founded the MIT AI Project with McCarthy in 1959 [S24].
- **Belief, c. 1961:** heuristic, symbolic problem-solving was the way forward. He judged that randomly wired perceptron-style nets could not capture structural concepts and complained of a lack of analysis in Rosenblatt's reports [S19].
- **Relationship to Rosenblatt:** both attended Bronx Science. They debated publicly at conferences, and Rosenblatt called him "the loyal opposition" [S3][S4].
- **How pictured (photo-check):** slight build with a high forehead; bald or balding in later decades [S24 footnote]. 1960s photos show him in shirtsleeves among MIT machines. Check early photographs before adding glasses.

### Bernard Widrow (b. 24 Dec 1929, Norwich CT; d. 30 Sept 2025, aged 95)
- **Career:** MIT S.B., S.M., Sc.D. (1951/53/56), then MIT faculty. Moved to Stanford in 1959 [S11][S15].
- **Belief:** came out of the 1956 Dartmouth meeting "so taken" with building an artificial brain that "I never got over it" [S11].
- **Legacy:** LMS became one of engineering's most widely used adaptive algorithms (adaptive filters, modems, echo cancellation) [S15].
- **Later course:** by about 1965-66 his group turned to adaptive antennas and signal processing [S23].
- **How pictured (photo-check):** dark hair and glasses; 1960s jacket and tie; holding the "black, shoebox-sized" ADALINE with its knobs and switches [S15].
- **Date note:** confirmed by Stanford Report, "Bernard Widrow, pioneer of adaptive neural networks, dies at 95" (12 Dec 2025): died September 30, 2025, aged 95 [S45].

### Marcian E. "Ted" Hoff Jr. (b. 1937)
- Widrow's first doctoral student at Stanford (MS '59, PhD '62). Co-inventor of LMS and ADALINE [S15][S11].
- Later a co-inventor of the Intel 4004 microprocessor [S35].
- **How pictured (photo-check):** a young graduate student in his early twenties.

### Oliver G. Selfridge (b. London, 10 May 1926)
- Studied at MIT 1942-45 and 1946-50. Spent two years at Signal Corps Laboratories at Fort Monmouth, then became Group Leader at MIT Lincoln Laboratory, Group 34 (from his own 1959 biographical note) [S17] [PRIMARY-VERIFIED].
- Author of Pandemonium. Often called the father of machine perception [S36].
- **Belief:** parallel, self-improving, modular recognition: "the seeds of self-improvement" [S17].

### John McCarthy, Allen Newell, Herbert Simon (the symbolic rivals)
- McCarthy (Dartmouth, then MIT; Stanford from 1962) coined "artificial intelligence" in the 1955 proposal [S20][S31].
- Newell and Simon (RAND and Carnegie Tech) built heuristic programs (Logic Theorist, General Problem Solver). Their 1957 address predicted a computer chess champion within ten years [S21].
- **Shared belief:** intelligence is symbol manipulation by programs on general-purpose digital computers.
- **How pictured (photo-check):** 1950s suits and ties.

### Marshall C. Yovits (ONR)
ONR figure who appeared in the *New Yorker* coverage. Later co-edited *Self-Organizing Systems 1962* [S7][S13].

### Charles Rosen and Nils Nilsson (SRI)
- Ran SRI's perceptron-style "MINOS" pattern-recognition work in the early 1960s.
- Rosen later said: "Minsky and his crew thought that Frank Rosenblatt's work was a waste of time" [S23, quoting Olazaran 1993].

---

## 4. The belief of the age

**What the neural camp believed (1957-c.1962).** Brain-like machines could learn perception straight from examples, without being programmed. Intelligence would emerge from many simple, randomly connected units whose connection strengths change with experience.
- Rosenblatt framed this as a scientific theory of the brain: "the information is contained in connections or associations rather than topographic representations" [S2].
- He thought the probabilistic approach better than symbolic logic: "the language of symbolic logic and Boolean algebra is less well suited for such investigations" [S2].
- The press and the Navy turned this into a near-term promise of machines that would read, write, translate, recognise faces, and even be "conscious of its existence" [S1].
- **Who held it:** Rosenblatt's Cornell group, Widrow's Stanford group (an engineering version), Rosen and Nilsson at SRI, Selfridge (a hybrid), and ONR program managers [S3][S11][S23].

**What the symbolic camp believed.** Intelligence is the manipulation of symbols by programs, and the digital computer is already the right machine.
- The Dartmouth conjecture: "every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it" [S20].
- Newell and Simon predicted that within ten years a computer would be chess champion [S21].
- Neural nets were not excluded at first. "Neuron Nets" was Dartmouth topic 3 [S20], and Minsky's own PhD was on neural-analog systems [S24]. By 1961, though, Minsky judged random nets fundamentally limited [S19].

**Dissent within the boom.**
- Minsky (1961), on random nets: they "can probably never achieve recognition of such patterns as 'the class of figures having two separated parts'". On Rosenblatt's publications: "We can find nothing resembling an analysis" [S19].
- Rosenblatt himself conceded that the 1958 hype hurt him. He listed three reasons for "negative reactions": "the admitted lack of mathematical rigor in preliminary reports", "the handling of the first public announcement of the program in 1958 by the popular press", and a "failure to comprehend the difference in motivation" between brain modelling and engineering AI [S3].
- Rosenblatt also stated limits frankly in 1961. Figure-ground separation and topological relations "represent new territory, against which few inroads have been made". Teaching the Mark I all 26 letters in two typefaces at once "ha[d] been unsuccessful" [S3].

**How long it held.** The optimism peaked from 1958 to about 1962. Jack Cowan later recalled: "There's no question that after '62 there was a quiet period in the field" [S23, quoting Rosenfeld & Anderson 2000; SECONDARY].

**What ended it.**
- No one could train more than one layer of adaptive weights:
  - Rosen (SRI): "Our group never solved the problem of training more than one layer of weights in an automatic fashion" [S23, SECONDARY: Olazaran 1991 PhD thesis interview, pp. 131-33 as cited by Liu; the film's shortened form must keep "in an automatic fashion" or mark the ellipsis]. Rosen on the exit: "About 1965 or 1966 we decided that we were more interested in the other artificial intelligence techniques" [S23, same source].
  - Widrow on the exit: "At the time that Hoff left, about 1965 or 1966, we had already had lots of troubles with neural nets ... So we stopped, basically stopped on neural nets, and began on adaptive antennas very strongly" [S23, SECONDARY: Olazaran 1991 pp. 129-30 as cited by Liu]. Widrow & Lehr (1990) say the lab returned to neural nets "after 20 years of research in adaptive signal processing" [S13].
  - Nilsson: "But what stymied us all was how to change weights in more than one layer of multilayer networks" (Nilsson, *The Quest for Artificial Intelligence*, 2009, ch. 29.4 — not an Olazaran interview) [S23 as lead].
- Money shifted: ARPA's large block grants (from 1963) went mainly to symbolic-AI centres rather than to neural nets [S22][S31]. Note that Project MAC's money was mostly for time-sharing; about a third went to the AI group [S31].
- The 1969 book *Perceptrons* then fixed the "official history" in place. Olazaran (1996) argues that this history reflected the institutional victory of symbolic AI more than the book's actual theorems [S22].

**The 1958 claim and what happened next.** The 1958 promise was walking, talking, reading, translating, self-reproducing, conscious machines. The Mark I could learn to sort letters and simple shapes on a 20×20 grid [S1][S3].

---

## 5. Experiments and results

### 5.1 The perceptron as Rosenblatt defined it (1958) [S2, PRIMARY-VERIFIED]
- "Stimuli impinge on a retina of sensory units (S-points)".
- S-points connect to **association cells (A-units)** in a "projection area" and then an "association area". These connections are random, with a probability that falls off with distance.
- A-units connect to **response units (R-units)**. Responses inhibit each other's source-sets, so one response wins.
- Learning means changing the "value" of active A-units. The paper's eight conclusions include: "In an environment of random stimuli, a system consisting of randomly connected units ... can learn to associate specific responses to specific stimuli", and "Trial-and-error learning is possible in bivalent reinforcement systems."
- He gave the theory as probability formulas for learning curves rather than as a circuit diagram.

### 5.2 The 7 July 1958 demonstration (IBM 704)
- The machine was the Weather Bureau's IBM 704, described as "the Weather Bureau's $2,000,000 '704' computer" in the UPI text [S43, SECONDARY transcription; not in S32]. Cornell calls it "a 5-ton computer the size of a room" [S4].
- It was fed punch cards. "After 50 trials, the computer taught itself to distinguish cards marked on the left from cards marked on the right" [S4].
- **Note for the film:** this was a software simulation. The Mark I hardware did not exist yet [S6]. *The New Yorker* (Dec 1958), in its own voice: "The first perceptron has yet to be built, but it has been successfully simulated on a 704" [S28, PRIMARY-VERIFIED].

### 5.3 The Mark I Perceptron (built 1958-59, first public demonstration 23 June 1960)
- **Builders:** CAL, Buffalo, with ONR and the Rome Air Development Center ("The Rome Air Development Center has assisted in the development of the Mark I perceptron") [S3][S5].
- **Eye:** 400 photocells in a 20×20 grid, cadmium sulfide according to Bishop (2006) as cited by Wikipedia [S6][SECONDARY]. *Neurodynamics* uses "a 20 by 20 mosaic of S-units" / "400 sensory points arranged in a 20 by 20 toroidally connected array" as its standard retina [S3, PRIMARY-VERIFIED in OCR]; the Mark I-specific photocell count rests on [S6]. UNVERIFIED: the dossier earlier claimed the 1958 UPI story promised "an eye-like scanning device with 400 photo cells"; this phrase is not in [S32] or any transcription found in the fact-check — do not use. Printed figures (block letters, shapes) were lit and focused onto this grid (Bishop's description, as relayed by [S6]).
- **Wiring:** S-units were connected at random to A-units through a large patch-panel plugboard, using a table of random numbers to avoid built-in bias. These S→A connections were fixed and not learned [S6]. Rosenblatt: "The Mark I ... employs motor-driven potentiometers for integrators, and a large patch-panel for connections - both intolerable solutions for very large systems" [S3, PRIMARY-VERIFIED].
- **Units:** "The Mark I perceptron at C.A.L. is equipped with eight binary R-units, and 512 A-units, which can be employed in any combination" [S3, PRIMARY-VERIFIED].
- **Weights:** the adjustable A→R weights were potentiometers (rotary variable resistors), each turned by a small electric motor whenever learning called for a change [S3][S6].
- **Physical layout:** the Smithsonian describes the units from left to right [S5]:
  - The S-unit cabinet has a monitor at the top and an array of manual switches for stimuli below it.
  - The next cabinet, labeled "MARK I", has a large plugboard behind two doors.
  - Next comes the A-unit: an array of potentiometers labeled "PERCEPTRON". (This is the museum's labelling. Functionally the motor-driven potentiometers are the learned A→R weights — Rosenblatt calls them "integrators" — so do not narrate "the A-units were potentiometers".)
  - Then the R-unit panel.
  - On the far right, a panel of meters.
- **Results reported by Rosenblatt [S3, PRIMARY-VERIFIED]:**
  - **Letters "E" and "X" with noise:** "Two 240 A-unit perceptrons were tested, both learning to perfection in the absence of noise. With noise present, one perceptron learned as well as before, the second falling to about 75% accuracy."
  - **Eight letters:** it learned to identify eight block letters "in random locations, over a considerable part of the retinal field".
  - **Whole alphabet:** it learned the alphabet in fixed position with a five-R-unit binary code. Rosenblatt: "This represents about the limit of the capacity of the Mark I system. Attempts at teaching the Mark I to recognize all 26 letters in two type faces simultaneously have been unsuccessful".
- **Later use:** 1963-66, NPIC/CIA tests on automatic target recognition in aerial photographs [S29]. In 1967 it went to the Smithsonian (National Museum of American History, object nmah_334414, ID 1987.0819.01; currently not on view) [S5].
- **A term ahead of its time:** *Neurodynamics* Figure 38 is captioned "BACK-PROPAGATING ERROR-CORRECTION EXPERIMENTS" (1961) [S3, PRIMARY-VERIFIED in OCR]. Rosenblatt's procedure was not the gradient backpropagation of 1986, so present it as a name, not as the later algorithm.

### 5.4 Simple mechanics (for animation)
These are the textbook forms. Rosenblatt's own notation differs (A-unit "values", reinforcement Δη).
- **Weighted sum:** s = w₁x₁ + w₂x₂ + ... + wₙxₙ + b.
- **Threshold:** output y = +1 if s > 0, otherwise −1. On the Mark I this was an R-unit firing or not.
- **Error-driven update (perceptron rule):**
  - If the output is correct, change nothing.
  - If it is wrong, with target t ∈ {+1, −1}, set wᵢ ← wᵢ + η·t·xᵢ and b ← b + η·t.
  - Only the inputs that were active move, and they move toward the right answer. Rosenblatt's version reinforced the active A-units [S3][S6].
- **Geometric picture:** the weight vector defines a line (or hyperplane) that splits the plane. Each mistake swings the line toward the misclassified point.
- **Convergence theorem:**
  - Rosenblatt's Theorem 4: given a classification "for which a solution exists", with every stimulus recurring "in finite time", error correction "will always yield a solution ... in finite time" from any starting state [S3, PRIMARY-VERIFIED, OCR-normalised].
  - Novikoff's bound: if all inputs lie within radius R and some separating weight vector achieves margin γ, the number of mistakes is at most (R/γ)² [S10][S6].
  - What it does **not** promise: anything when no separating line exists (e.g. XOR). The 1969 critique builds on that gap.
- **LMS (Widrow-Hoff) contrast:** the error is measured *before* the threshold, as a continuous number: εₖ = dₖ − Xₖᵀ Wₖ, then Wₖ₊₁ = Wₖ + 2μ εₖ Xₖ [S11, PRIMARY-VERIFIED]. This is a gradient-descent step on squared error, an ancestor of backprop's gradient thinking.
- **Animation idea:** two dials (potentiometers) twitching toward the target after each mistake, compared with LMS's smooth slide down an error bowl.

### 5.5 ADALINE (1959-60)
- **Build:** "We needed an aluminum chassis, potentiometers, switches, batteries, a microammeter, etc." The parts came from Zack Electronics in Palo Alto on a Saturday. "By late Sunday afternoon, the single neuron was fabricated and working" [S11].
- **Inputs:** "a set of switches mounted in a 4 × 4 array. Each input pixel was +1 or −1." The weights were analog knobs, and a meter showed the output [S11].
- **Memistor:** a later version used memistors, electroplating cells that serve as resistors with memory (pencil lead in a copper-sulfate plating bath) [S16][SECONDARY].
- **Museums:** two ADALINEs have been held by the Smithsonian since 2018; one is on show at the Computer History Museum [S15].

### 5.6 Pandemonium (1958-59) [S17, PRIMARY-VERIFIED]
- **Structure:** four levels. Data demons store and pass on the data. Computational demons (sub-demons) compute features. Cognitive demons "weigh the evidence". "Each cognitive demon computes a shriek, and from all the shrieks the highest level demon of all, the decision demon, merely selects the loudest."
- **Task:** translating hand-keyed Morse code into text, starting with telling dots from dashes [S17][S18].
- **Learning:** adjusting the weights on sub-demons (hill-climbing), and mutating or combining useful sub-demons, an early evolutionary idea [S18][SECONDARY].

### 5.7 MADALINE (1962)
Many ADALINEs feed a fixed logic unit (OR, AND or majority vote). Training by "minimal disturbance" adapts the ADALINE whose sum is closest to zero (Madaline Rule I, devised by "Widrow and his students", 1962; analysed in Ridgway's April 1962 thesis) [S13][S14]. Widrow & Lehr (1990) call MRI "the earliest popular learning rule for neural networks with multiple adaptive elements"; "The Madalines of the 1960s had adaptive first layers and fixed threshold functions in the second (output) layers" [S13, PRIMARY-VERIFIED].

---

## 6. Verified quotes

Quotes marked **[PRIMARY-VERIFIED]** were read in a scan or archival page during this pass; OCR noise has been repaired, and repairs are noted. Everything else is labelled.

1. **UPI / *New York Times*, 8 July 1958, p. 25 (dateline Washington, 7 July)** [PRIMARY-VERIFIED via the NYT archive page as captured by the Wayback Machine]
   > "WASHINGTON, July 7 (UPI) -- The Navy revealed the embryo of an electronic computer today that it expects will be able to walk, talk, see, write, reproduce itself and be conscious of its existence."
   - Headline: "NEW NAVY DEVICE LEARNS BY DOING; Psychologist Shows Embryo of Computer Designed to Read and Grow Wiser".
   - Source: [S1]. **The prediction is attributed to the Navy, not directly to Rosenblatt.**

2. **Same article, later paragraphs** [SECONDARY: partial transcriptions only; check against the TimesMachine scan before narrating]
   > "The service said it would use this principle to build the first of its Perceptron thinking machines that will be able to read and write. It is expected to be finished in about a year at a cost of $100,000."
   - The "$100,000 ... read and write" sentence is consistent across USNA [S32] and Brightwork [S43]; usable with a SECONDARY label.
   - **UNVERIFIED — do not use as a quote:** "Later Perceptrons will be able to recognize people and call out their names and instantly translate speech in one language to speech or writing in another language". Three transcriptions disagree: "speech or writing" (Brightwork), "speech and writing" (Hacker News), "speech or language" (USNA [S32]); Brightwork also has "name" (singular). Paraphrase only until the scan is checked.
   - Also in the transcriptions: "The embryo—the Weather Bureau's $2,000,000 '704' computer—learned to differentiate between right and left after fifty attempts in the Navy's demonstration for newsmen" [S43, SECONDARY].
   - Also secondary only: Rosenblatt "said the machine would be the first device to think as the human brain", and that like humans it "will make mistakes at first, but will grow wiser as it gains experience" (paraphrase-level; the exact wording is unverified).

3. **Frank Rosenblatt, *Principles of Neurodynamics*, Preface (signed 15 March 1961; CAL report, Spartan edition 1962)** [PRIMARY-VERIFIED, DTIC scan [S3]]
   > "Second, was the handling of the first public announcement of the program in 1958 by the popular press, which fell to the task with all of the exuberance and sense of discretion of a pack of happy bloodhounds. Such headlines as 'Frankenstein Monster Designed by Navy Robot That Thinks' (Tulsa, Oklahoma Times) were hardly designed to inspire scientific confidence."
   - The OCR reads "Navy- Rebu'". The page image (DTIC PDF p. vii, checked visually) shows a punctuation mark (apparently a dash) between "Navy" and "Robot", so the headline is two clauses: "Frankenstein Monster Designed by Navy" / "Robot That Thinks". Render it as "Frankenstein Monster Designed by Navy—Robot That Thinks" (Wikiquote gives "Navy: Robot"). Do **not** print "Navy Robot" as one noun phrase. The original Tulsa paper was not found.

4. **Rosenblatt, same Preface** [PRIMARY-VERIFIED [S3]]
   > "For this writer, the perceptron program is not primarily concerned with the invention of devices for 'artificial intelligence', but rather with investigating the physical structures and neurodynamic principles which underlie 'natural intelligence'. A perceptron is first and foremost a brain model, not an invention for pattern recognition."

5. **Rosenblatt, same Preface** [PRIMARY-VERIFIED [S3]]
   > "The term 'perceptron', originally intended as a generic name for a variety of theoretical nerve nets, has an unfortunate tendency to suggest a specific piece of hardware, and it is only with difficulty that its well-meaning popularizers can be persuaded to suppress their natural urge to capitalize the initial 'P'. On being asked, 'How is Perceptron performing today?' I am often tempted to respond, 'Very well, thank you, and how are Neutron and Electron behaving?'"

6. **Rosenblatt, Preface footnote on Minsky** [PRIMARY-VERIFIED [S3]]
   > "See, for example, Minsky's article, 'Steps Toward Artificial Intelligence', Proc. I.R.E., 49, January, 1961, for an entertaining statement of the views of the loyal opposition, which includes an excellent bibliography."

7. **Rosenblatt, *Psychological Review*, Nov 1958, opening** [PRIMARY-VERIFIED [S2]]
   > "If we are eventually to understand the capability of higher organisms for perceptual recognition, generalization, recall, and thinking, we must first have answers to three fundamental questions: 1. How is information about the physical world sensed, or detected, by the biological system? 2. In what form is information stored, or remembered? 3. How does information contained in storage, or in memory, influence recognition and behavior?"

8. **Rosenblatt 1958, the connectionist creed** [PRIMARY-VERIFIED [S2]]
   > "Whatever information is retained must somehow be stored as a preference for a particular response; i.e., the information is contained in connections or associations rather than topographic representations."

9. **Rosenblatt 1958, against logic-based brain models** [PRIMARY-VERIFIED [S2]]
   > "The writer takes the position, on the other hand, that these shortcomings are such that a mere refinement or improvement of the principles already suggested can never account for biological intelligence; a difference in principle is clearly indicated."

10. **Rosenblatt 1958, closing line** [PRIMARY-VERIFIED [S2]]
    > "By the study of systems such as the perceptron, it is hoped that those fundamental laws of organization which are common to all information handling systems, machines and men included, may eventually be understood."

11. **Rosenblatt, "The Design of an Intelligent Automaton", *Research Trends*, Summer 1958 (also listed in ONR *Research Reviews*, Oct 1958, pp. 5-13, per *Neurodynamics* ref. 81)** [SECONDARY: quoted by Cornell Chronicle [S4]]
    > "Stories about the creation of machines having human qualities have long been a fascinating province in the realm of science fiction. Yet we are about to witness the birth of such a machine – a machine capable of perceiving, recognizing and identifying its surroundings without any human training or control."

12. **Rosenblatt, *Neurodynamics* §27.3, on the hardware** [PRIMARY-VERIFIED [S3]]
    > "The Mark I (Frontispiece) employs motor-driven potentiometers for integrators, and a large patch-panel for connections - both intolerable solutions for very large systems."

13. **Rosenblatt, *Neurodynamics* §12.3, on its limits** [PRIMARY-VERIFIED [S3]]
    > "This represents about the limit of the capacity of the Mark I system. Attempts at teaching the Mark I to recognize all 26 letters in two type faces simultaneously have been unsuccessful"

14. **Rosenblatt, *Neurodynamics* §5.5, on the convergence proof** [PRIMARY-VERIFIED [S3]]
    > "The proof of this theorem (which was first published by Rosenblatt in Ref. 86) has undergone a number of modifications. The original treatment was insufficient to prove the theorem in a rigorous fashion; subsequent forms have been due to Block, Joseph, Kesten, and others"

15. **Rosenblatt, *Neurodynamics* §27.3, a prophetic line** [PRIMARY-VERIFIED [S3]]
    > "Linguistic capability, related to perceptual experience, is of the essence for an 'intelligent' system, artificial or otherwise."

16. ***The New Yorker*, "Rival", Talk of the Town, print issue of 6 Dec 1958 (credited online to Harding Mason, D. Stewart and Brendan Gill)** [PRIMARY-VERIFIED via newyorker.com archive text [S28]]
    > "This about-to-be marvel is a lot more subtle than the 704; indeed, it strikes us as the first serious rival to the human brain ever devised, and our own brain is thoroughly dazzled by the things it's said to do."
    - These are the magazine's words, not Rosenblatt's. "indeed" is lowercase mid-sentence in the original; the Cornell Chronicle's capitalised "Indeed, ..." is a trimmed form. If trimmed on screen, use "...it strikes us as the first serious rival to the human brain ever devised."
    - Same piece, magazine's voice: the perceptron, "as its name implies, is capable of what amounts to original thought." Also: "The first perceptron has yet to be built, but it has been successfully simulated on a 704".

16a. **Rosenblatt as quoted by *The New Yorker*, 6 Dec 1958** [PRIMARY-VERIFIED [S28]; his words as reported by the magazine]
    > "Our success in developing the perceptron means that for the first time a non-biological object will achieve an organization of its external environment in a meaningful way"
    >
    > Of what practical use, we asked, would the perceptron be? "At the moment, none whatever," Dr. Rosenblatt said cheerfully. "Someday we may find it useful to send one out into space to take in impressions for us,"
    >
    > What, we asked, wasn't the perceptron capable of? Dr. Rosenblatt threw up his hands. "Love," he said. "Hope. Despair. Human nature, in short. If we don't understand the human sex drive, why should we expect a machine to?"
    >
    > "My colleague disapproves of all the loose talk one hears nowadays about mechanical brains. He prefers to call our machine a self-organizing system, but, between you and me, that's precisely what any brain is."
    - The reporter's questions are the magazine's narration, now given verbatim (earlier drafts paraphrased them inside the quote block). "My colleague" is Yovits (ONR), named just before as the co-"begetter": evidence that ONR's own program officer distanced himself from "mechanical brain" talk, while Rosenblatt half-embraced it.    - The interview took place over coffee in New York, with Rosenblatt "on his way to a consultation with Dr. Yovits". The magazine calls Rosenblatt and Marshall C. Yovits (ONR) the "begetters of the prodigy".

17. **Marvin Minsky, "Steps Toward Artificial Intelligence", *Proc. IRE*, Jan 1961** [PRIMARY-VERIFIED [S19]; the PDF text layer lacks spaces, so spacing was restored]
    > "But these nets, with their simple, randomly generated, connections can probably never achieve recognition of such patterns as 'the class of figures having two separated parts,' and they cannot even achieve the effect of template recognition without size and position normalization"
    - Footnote 10: "We can find nothing resembling an analysis [see (1) above] in [22] or subsequent publications of Rosenblatt." Minsky's [22] is Rosenblatt's CAL report VG-1196-G-1, January 1958.

18. **Dartmouth proposal, 31 Aug 1955** [PRIMARY-VERIFIED [S20]]
    > "The study is to proceed on the basis of the conjecture that every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it."
    - Topic 3, "Neuron Nets": "How can a set of (hypothetical) neurons be arranged so as to form concepts."

19. **Oliver Selfridge, "Pandemonium: A Paradigm for Learning" (1959)** [PRIMARY-VERIFIED [S17]]
    > "Each cognitive demon computes a shriek, and from all the shrieks the highest level demon of all, the decision demon, merely selects the loudest."
    >
    > "We are not going to apologize for a frequent use of anthropomorphic or biamorphic terminology."

20. **Bernard Widrow, "Thinking About Thinking: The Discovery of the LMS Algorithm", *IEEE Signal Processing Magazine*, Jan 2005** [PRIMARY-VERIFIED [S11]]
    > "I met Ted for the first time on a Friday afternoon in the fall of 1959."
    >
    > "Within a half hour after the discovery of LMS, it was up and running and we had an adaptive neuron being trained to do simple pattern classification tasks."
    >
    > "By late Sunday afternoon, the single neuron was fabricated and working."
    >
    > "Some people at the Dartmouth AI meeting were seriously considering building an artificial brain. I was so taken by this that I never got over it. I spent the next six months thinking about thinking."

21. **Interview quotes, as relayed by Olazaran** [SECONDARY]
    > Charles Rosen (SRI): "Minsky and his crew thought that Frank Rosenblatt's work was a waste of time"
    >
    > Widrow: "At the time that Hoff left, about 1965 or 1966, we had already had lots of troubles with neural nets."
    - Source: [S23], which cites the Widrow quote to Olazaran 1991 (PhD thesis), pp. 129-30, and the Rosen quote to "Olazaran 1993, 622". That page number cannot belong to Olazaran 1993 (*Advances in Computers* 37: 335-425); it is probably Olazaran 1996 [S22], p. 622. Confirm in Olazaran before on-screen use.
    - "a press agent's dream, a real medicine man" is one of the anonymous "rhetorical expressions" Olazaran collected (1991, p. 112). No speaker is named, so do not attribute it to a person.

22. **UNVERIFIED: do not use as a quote**
    - "the first machine which is capable of having an original idea" is attributed to Rosenblatt by the Cornell Chronicle [S4], which gives no primary source. The closest primary wording found is *The New Yorker*'s own voice, not Rosenblatt's: "capable of what amounts to original thought" [S28]. Use only as "Cornell's 2019 article reports he called it...", or avoid.
    - "Perceptrons might be fired to the planets as mechanical space explorers" and "it would be possible to build brains that could reproduce themselves on an assembly line and which would be conscious of their existence" are attributed by secondary transcriptions (Popular Science [S40], Brightwork [S43]) to **Rosenblatt**, in later paragraphs of the same 8 July 1958 UPI/NYT story. Not seen in a primary scan. If they are confirmed, the "Navy, not Rosenblatt" framing of the lede must be softened (see Section 7.1).
    - "400 photo cells" and "about 1,000" association cells: earlier drafts said these appear in the UPI text [S32]. They do not appear in S32 or in any transcription found. Do not use.
    - "Frank was the thinker, and we were the worker bees" (Terrell Koken) is reliable as a 2019 interview quote [S4]. It is fine if attributed to the Cornell Chronicle 2019.

---

## 7. Debates and controversies

1. **Who over-hyped: Rosenblatt, the Navy, or the press?**
   - *Against Rosenblatt:* his own Summer 1958 article said "we are about to witness the birth of such a machine" [S4]. Critics at the time (Minsky's circle) blamed him personally. Hecht-Nielsen recalled "The wall-to-wall media coverage of Rosenblatt and his machine irked Minsky" [S23]. Colleagues of the era called Rosenblatt "a press agent's dream" [S23, quoting Olazaran 1991].
   - *In his defence:* the NYT lede attributes the "conscious of its existence" prediction to **the Navy** [S1]. By 1961 Rosenblatt publicly blamed the "popular press" and called the perceptron "first and foremost a brain model" [S3].
   - **[CONTESTED] against the defence:** secondary transcriptions of the same story attribute to "Dr. Rosenblatt" the claims that perceptrons "might be fired to the planets as mechanical space explorers" and that it would be possible to "build brains that could reproduce themselves on an assembly line" and be "conscious of their existence" [S40][S43]. In *The New Yorker* (Dec 1958) Rosenblatt, in his own words, said one might "send one out into space to take in impressions for us", though he also said it had no practical use "At the moment" [S28].
   - **Verdict for the film:** shared responsibility. Quote the lede as the Navy's expectation. Do not say Rosenblatt made no such claims.

2. **Rigor.**
   - Minsky (1961): "nothing resembling an analysis" in Rosenblatt's reports [S19].
   - Rosenblatt conceded "the admitted lack of mathematical rigor in preliminary reports" [S3], then produced 600-plus pages with theorems. Block, Joseph and Novikoff made the convergence proof rigorous [S3][S9][S10].
   - Rosenblatt also criticised Papert's alternative proof: "there are several logical errors in Papert's argument" [S3, PRIMARY-VERIFIED]. This is an early skirmish with the future co-author of *Perceptrons*.

3. **Could random nets do real vision?**
   - Minsky: no, not for connectedness or two-part figures [S19].
   - Rosenblatt agreed the problem was open: figure-ground and topological relations were "new territory" [S3]. The disagreement was over whether better perceptrons (multi-layer, cross-coupled) would get there.

4. **Funding: competition or coexistence?** [CONTESTED]
   - Olazaran argues that symbolic-AI researchers feared neural nets were drawing money away and promoted the "official history" accordingly. In this account ARPA funded symbolic AI almost exclusively until the mid-1970s, while ONR kept Rosenblatt going [S22][S23].
   - Counter-view: the main cause was technical. No one could train hidden layers, as Rosen and Nilsson admitted [S23]. ONR chose to fund Rosenblatt partly *because* results were not expected soon (Wikipedia citing ONR's Marvin Denicoff) [S6][SECONDARY].

5. **Minsky and Rosenblatt at Bronx Science: who was ahead?** [CONTESTED]
   - Cornell Chronicle (2019): "Marvin Minsky, who was a grade behind Rosenblatt at the Bronx High School of Science" [S4].
   - Bronx Science's Hall of Fame lists "Marvin Minsky '45". Wikipedia's Frank Rosenblatt article says "After graduating from The Bronx High School of Science in 1946". Hecht-Nielsen (Rosenfeld & Anderson 2000) says only that Minsky "had gone to the same New York 'science' high school". Minsky was born about 11 months earlier (Aug 1927 against July 1928) [S25][S26][S24]. Minsky also left for Phillips Academy Andover and the Navy (1944-45) [S24].
   - **Safe line:** "Both attended the Bronx High School of Science in the 1940s." Do not say who was ahead, and do not claim they were close friends. Their friendly personal terms later are attested only secondarily [S23].

6. **When was the Mark I "unveiled"?** [CONTESTED in popular sources]
   - Many popular accounts put the 1958 NYT story next to the Mark I.
   - In fact the 1958 demonstration ran on an IBM 704. The Mark I was built in 1958-59 (see below) and first shown publicly on 23 June 1960 [S6][S30].
   - **[CONTESTED] build year.** The Smithsonian record gives "date made 1958" and says "By the following year [after 1957], he and colleagues had constructed this device" [S5]. Wikipedia, citing Jensen & Dunning's 2026 personal account (*IEEE Annals* 48(2): 62-65), says it was assembled and tested "between June 1959 and December 14, 1959" [S6]. Work on parts was under way in Dec 1958 (Cornell photograph [S4]), and *The New Yorker* (Dec 1958) said "The first perceptron has yet to be built" [S28]. A third variant: Wikipedia's *Frank Rosenblatt* article speaks of "hardware construction in 1960 of the Mark I Perceptron" (https://en.wikipedia.org/wiki/Frank_Rosenblatt), which likely conflates construction with the 1960 unveiling. **Safe line:** "built in 1958-59, first shown publicly in June 1960."

7. **A-unit count.** An earlier draft said the 1958 press promised "about 1,000" association cells [S32]. That is UNVERIFIED: the phrase is not in S32. The built Mark I had 512 A-units [S3]. Some experiments used 240-A-unit configurations [S3].

---

## 8. Misconceptions to avoid

- **"The NYT said Rosenblatt claimed the machine would be conscious."** The lede attributes it to the Navy ("that it expects") [S1].
- **"The Mark I was shown to the press in 1958."** The 1958 demonstration was a simulation on an IBM 704. The Mark I was first shown in June 1960 [S6][S30].
- **"The perceptron was a single neuron."** The Mark I had 400 sensory units, 512 association units and 8 response units. Only the A→R layer learned; S→A was random and fixed [S3][S6].
- **"Rosenblatt only thought of single-layer machines."** *Neurodynamics* treats multi-layer and cross-coupled perceptrons (Part III and later). What he lacked was a general rule to train hidden layers [S3][S23].
- **"Minsky was always anti-neural."** He built SNARC (1951), wrote a neural-net PhD (1954), and his name appears in the Dartmouth "Neuron Nets" topic [S27][S24][S20].
- **"The convergence theorem says perceptrons can learn anything."** It guarantees convergence *only if* a separating solution exists [S3][S10].
- **"Rosenblatt proved convergence."** His first proof (CAL report VG-1196-G-4, Feb 1960) was not rigorous, by his own account. The rigorous forms were due to "Block, Joseph, Kesten, and others" (his words), and Block (1962) and Novikoff (1962) published proofs [S3][S9][S10].
- **"The NYT/UPI story never quotes Rosenblatt making big claims."** Unproven either way: secondary transcriptions put the "planets" and "assembly line" claims in his mouth [S40][S43].
- **"LMS is the same as the perceptron rule."** LMS uses the error *before* the threshold (a continuous value, gradient descent). The perceptron rule uses the error *after* it (right or wrong) [S11].
- **"The *New Yorker* called it 'the first machine capable of an original idea'."** The *New Yorker*'s lines are "the first serious rival to the human brain ever devised" and "capable of what amounts to original thought", both in the magazine's own voice [S28].
- **Do not call the Weather Bureau 704 "5-ton" and "$2,000,000" as if from the same source.** "$2,000,000" comes from the UPI text [S32]; "5-ton" is the Cornell Chronicle's description [S4].
- **Do not say Rosenblatt died in a "suicide".** The record says a boating accident (drowned while sailing the sloop *Shearwater*) [S4][S7]. Speculation exists elsewhere but is unsourced.

---

## 9. Curiosity hooks

1. **The joke in the preface.** Rosenblatt was so tired of reporters treating "Perceptron" as a robot's name that he joked he wanted to answer "Very well, thank you, and how are Neutron and Electron behaving?" [S3].
2. **"A pack of happy bloodhounds."** Rosenblatt's own description of the 1958 press. A Tulsa paper ran "Frankenstein Monster Designed by Navy—Robot That Thinks" [S3].
2a. **"Love. Hope. Despair."** Asked over coffee in 1958 what the perceptron could not do, Rosenblatt "threw up his hands" and answered "Love," "Hope. Despair. Human nature, in short." Asked what practical use it had: "At the moment, none whatever" [S28].
2b. **"Back-propagating" in 1961.** A figure in *Neurodynamics* is titled "BACK-PROPAGATING ERROR-CORRECTION EXPERIMENTS", 25 years before the 1986 backprop paper. It was a different procedure under a prophetic name [S3].
3. **Neurons with motors.** Every learned weight in the Mark I was a knob turned by a small electric motor. Learning was something you could hear [S3][S6].
4. **Random wiring on purpose.** The plugboard connections were laid out from a table of random numbers, so that no human bias was built in [S6].
5. **A weekend neuron.** Widrow and Hoff found the LMS rule on a Friday, bought parts at Zack Electronics in Palo Alto on Saturday, and had a working neuron by Sunday afternoon. LMS later became one of the most widely used algorithms in signal processing [S11][S15].
6. **Shrieking demons.** Selfridge's 1959 recogniser was a hierarchy of "demons" that "shriek", with a decision demon listening for the loudest. It is a cartoon of today's softmax [S17].
7. **The future co-author.** In 1961 Rosenblatt found "several logical errors" in Seymour Papert's version of the convergence proof. Eight years later Papert co-wrote *Perceptrons* [S3].
8. **The perceptron went to the CIA.** From 1963 to 1966 the Mark I was part of a formerly secret NPIC project to spot targets in reconnaissance photographs [S29].
9. **The skeptic built a neural net first.** Minsky's 1951 SNARC had about forty "neurons", each designed around "six vacuum tubes and a motor" (the built machine had "three hundred tubes and a lot of motors"). It was paid for with "a couple of thousand dollars" from ONR and built years before the perceptron [S27].
10. **Neural nets were on the founding agenda.** The 1955 Dartmouth proposal, the founding document of "artificial intelligence", lists "Neuron Nets" as topic 3 [S20].
11. **A 1961 prophecy.** Rosenblatt wrote that "Linguistic capability, related to perceptual experience, is of the essence for an 'intelligent' system" [S3].

---

## 10. Visual and dramatic details

- **Washington, 7 July 1958:** a Navy press demonstration for "newsmen" [S43, SECONDARY transcription of UPI]. Reporters, a room-sized IBM 704 (Weather Bureau) and punch cards marked on the left or right; the machine "learns" after 50 cards [S1][S4]. Weather and room unverified; do not invent specifics.
- **The Mark I:** a row of grey equipment cabinets, from left to right [S5]:
  1. A stimulus and monitor unit with manual switches.
  2. A cabinet labeled "MARK I", with a huge plugboard behind double doors: a nest of hundreds of patch cords.
  3. A rack of potentiometers labeled "PERCEPTRON", each driven by a small motor.
  4. The response panel.
  5. A panel of meters.
  - A separate camera-like "eye": a 20×20 photocell grid, lit by bright lamps and pointed at printed letters [S6].
  - Silhouette opportunity: a backlit wall of patch cords, like a loom or a harp.
- **Buffalo, December 1958:** Rosenblatt and Wightman bent over a chassis (archival photograph) [S4]. Buffalo is a lake-effect snow city; use winter only as general mood and do not state specific weather.
- **Ithaca, 1959 onward:** the Cognitive Systems Research Program at Cornell. Students built an observatory at Rosenblatt's Brooktondale house, with a big telescope under a night sky. His other interests were music and mountaineering [S4][S7].
- **Stanford, autumn 1959:** Widrow's office blackboard with chalk equations, and Prof. Gene Franklin's room-sized analog computer across the hall, with a plugboard Hoff wired in half an hour [S11].
- **The ADALINE box:** a "black, shoebox-sized device with an array of knobs and switches". It has a 4×4 grid of toggle switches, analog weight knobs and a microammeter needle swinging toward zero error [S11][S15]. Silhouette: a hand flipping switches, with a needle settling.
- **Memistor:** a tiny plating cell, pencil lead in copper-sulfate solution, whose resistance remembers [S16].
- **Teddington, November 1958:** National Physical Laboratory, UK symposium "Mechanisation of Thought Processes". In one room: Selfridge's demons, McCarthy's Advice Taker and early perceptron work [S17][S42].
- **Pandemonium staging:** a tiered amphitheatre of little paper-cut demons, each shrieking; the top demon cups an ear [S17].
- **Period objects:** IBM 704 consoles with blinking light panels and tape drives, punch cards, slide rules, vacuum tubes, patch cords, rotary potentiometers, analog meters. Men in white shirts, narrow ties and short hair.
- **Dramatic contrast:**
  - 1958 headline: "walk, talk, see, write, reproduce itself and be conscious of its existence" [S1].
  - 1961 reality, in Rosenblatt's own words: teaching it all 26 letters in two typefaces was "unsuccessful" [S3].
  - That distance is the emotional spine of the chapter.

---

## 11. Sources

1. [S1] *The New York Times*, 8 July 1958, p. 25, "NEW NAVY DEVICE LEARNS BY DOING" (UPI), archive page: https://www.nytimes.com/1958/07/08/archives/new-navy-device-learns-by-doing-psychologist-shows-embryo-of.html. Wayback capture used for verification: http://web.archive.org/web/20170501122550/http://www.nytimes.com:80/1958/07/08/archives/new-navy-device-learns-by-doing-psychologist-shows-embryo-of.html
2. [S2] Rosenblatt, F. (1958). "The perceptron: a probabilistic model for information storage and organization in the brain." *Psychological Review* 65(6): 386-408. Scan: https://homepages.math.uic.edu/~lreyzin/papers/rosenblatt58.pdf ; DOI: https://doi.org/10.1037/h0042519
3. [S3] Rosenblatt, F. *Principles of Neurodynamics: Perceptrons and the Theory of Brain Mechanisms*, CAL report, preface dated 15 March 1961 (DTIC AD0256582; Spartan Books 1962). https://archive.org/details/DTIC_AD0256582 ; full text: https://archive.org/download/DTIC_AD0256582/DTIC_AD0256582_djvu.txt
4. [S4] Lefkowitz, M. "Professor's perceptron paved the way for AI – 60 years too soon," *Cornell Chronicle*, 25 Sept 2019. https://news.cornell.edu/stories/2019/09/professors-perceptron-paved-way-ai-60-years-too-soon
5. [S5] Smithsonian NMAH, "Electronic Neural Network, Mark I Perceptron." https://americanhistory.si.edu/collections/object/nmah_334414
6. [S6] Wikipedia, "Perceptron" (history and Mark I sections; cites Bishop 2006 and Hay et al. 1960). https://en.wikipedia.org/wiki/Perceptron
7. [S7] Wikipedia, "Frank Rosenblatt." https://en.wikipedia.org/wiki/Frank_Rosenblatt
8. [S8] Wikipedia, "Mark I Perceptron." https://en.wikipedia.org/wiki/Mark_I_Perceptron
9. [S9] Block, H. D. (1962). "The Perceptron: A Model for Brain Functioning. I." *Rev. Mod. Phys.* 34: 123. https://journals.aps.org/rmp/abstract/10.1103/RevModPhys.34.123
10. [S10] Novikoff (1962), as cited and restated in Freund & Schapire (1999), "Large Margin Classification Using the Perceptron Algorithm." https://link.springer.com/article/10.1023/A:1007662407062
11. [S11] Widrow, B. (2005). "Thinking About Thinking: The Discovery of the LMS Algorithm." *IEEE Signal Processing Magazine*, Jan 2005, pp. 100-106. https://www-isl.stanford.edu/~widrow/papers/j2005thinkingabout.pdf
12. [S12] Widrow, B. & Hoff, M. E. (1960). "Adaptive Switching Circuits," Stanford Electronics Labs TR 1553-1 / IRE WESCON Conv. Rec. pt. 4: 96-104. https://apps.dtic.mil/sti/tr/pdf/AD0241531.pdf ; list: https://www-isl.stanford.edu/~widrow/publications.html
13. [S13] Widrow, B. & Lehr, M. (1990). "30 years of adaptive neural networks: Perceptron, Madaline, and backpropagation." *Proc. IEEE* 78(9). https://isl.stanford.edu/~widrow/papers/j199030years.pdf
14. [S14] Winter, R. & Widrow, B. (1988). "MADALINE Rule II." https://www-isl.stanford.edu/~widrow/papers/c1988madalinerule.pdf
15. [S15] Shiloh, K. "Trailblazer of Computers that Learn" (Widrow obituary), *Stanford Magazine*, Spring 2026. https://stanfordmag.org/contents/trailblazer-of-computers-that-learn
16. [S16] Wikipedia, "Memistor." https://en.wikipedia.org/wiki/Memistor
17. [S17] Selfridge, O. G. (1959). "Pandemonium: A Paradigm for Learning," in *Mechanisation of Thought Processes* (NPL Symposium, Nov 1958; HMSO 1959), pp. 511ff. https://gwern.net/doc/ai/nn/1959-selfridge.pdf
18. [S18] Wikipedia, "Pandemonium architecture." https://en.wikipedia.org/wiki/Pandemonium_architecture
19. [S19] Minsky, M. (1961). "Steps Toward Artificial Intelligence." *Proc. IRE* 49(1): 8-30. https://courses.csail.mit.edu/6.803/pdf/steps.pdf
20. [S20] McCarthy, Minsky, Rochester, Shannon (31 Aug 1955). "A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence." http://jmc.stanford.edu/articles/dartmouth/dartmouth.pdf
21. [S21] Simon, H. A. & Newell, A. (1958). "Heuristic Problem Solving: The Next Advance in Operations Research." *Operations Research* 6(1): 1-10. https://pubsonline.informs.org/doi/10.1287/opre.6.1.1
22. [S22] Olazaran, M. (1996). "A Sociological Study of the Official History of the Perceptrons Controversy." *Social Studies of Science* 26(3): 611-659. https://doi.org/10.1177/030631296026003005
23. [S23] Liu, Yuxi. "The Perceptron Controversy" (essay compiling Olazaran's interviews, Bernstein 1981, Rosenfeld & Anderson 2000). Lead and quote-compilation only. https://yuxi.ml/essays/posts/perceptron-controversy/
24. [S24] Wikipedia, "Marvin Minsky." https://en.wikipedia.org/wiki/Marvin_Minsky
25. [S25] Bronx High School of Science Alumni Hall of Fame, "Marvin Minsky '45." https://bxscience.edu/apps/pages/index.jsp?uREC_ID=350440&type=d&pREC_ID=695703
26. [S26] Wikipedia, "List of Bronx High School of Science alumni." https://en.wikipedia.org/wiki/List_of_Bronx_High_School_of_Science_alumni
27. [S27] SNARC: Wikipedia https://en.wikipedia.org/wiki/Stochastic_Neural_Analog_Reinforcement_Calculator ; cyberneticzoo extract of Bernstein, *New Yorker*, 14 Dec 1981: https://cyberneticzoo.com/mazesolvers/1951-maze-solver-minsky-edmonds-american/ ; original: https://www.newyorker.com/magazine/1981/12/14/a-i
28. [S28] *The New Yorker*, "Rival," 6 Dec 1958. https://www.newyorker.com/magazine/1958/12/06/rival-2
29. [S29] O'Connor, J. (2022/2023). "Undercover Algorithm: A Secret Chapter in the Early History of Artificial Intelligence and Satellite Imagery." *Int. J. Intelligence and CounterIntelligence* 36(4): 1337-1351 (online 21 June 2022). https://www.tandfonline.com/doi/abs/10.1080/08850607.2022.2073542
30. [S30] Charles Babbage Institute, "Cornell Aeronautical Laboratory, Inc. MARK I Perceptron press conference records, 1960." https://archives.lib.umn.edu/repositories/3/resources/45 ; https://search.worldcat.org/title/mark-i-perceptron-press-conference-records-1960/oclc/63287884
31. [S31] Multicians, "Project MAC." https://multicians.org/project-mac.html
32. [S32] USNA SI470 course notes, "perceptron" (quotes later paragraphs of the 1958 NYT/UPI story). https://www.usna.edu/Users/cs/jatho/si470/notes/perceptron.html
33. [S33] Cornell University Library, "Frank Rosenblatt publications, 1956-1958" (includes *Research Trends*, Summer 1958). https://search.worldcat.org/title/frank-rosenblatt-publications-1956-1958/oclc/64057171
34. [S34] Seising, R. (2018). "The Emergence of Fuzzy Sets in the Decade of the Perceptron." *Mathematics* 6(7): 110. https://www.mdpi.com/2227-7390/6/7/110
35. [S35] Wikipedia, "Marcian Hoff." https://en.wikipedia.org/wiki/Marcian_Hoff
36. [S36] Wikipedia, "Oliver Selfridge." https://en.wikipedia.org/wiki/Oliver_Selfridge
37. [S37] MIT CSAIL, "Early Artificial Intelligence Projects." https://projects.csail.mit.edu/films/aifilms/AIFilms.html
38. [S38] PubMed record for Rosenblatt 1958. https://pubmed.ncbi.nlm.nih.gov/13602029/
39. [S39] Rosenblatt, F. (1960). "Perceptron Simulation Experiments." *Proc. IRE* 48(3): 301-309. https://doi.org/10.1109/JRPROC.1960.287598
40. [S40] *Popular Science*, "From the archives: A forecast on artificial intelligence..." (secondary for the 1958 "assembly line" claim). https://www.popsci.com/technology/ai-history-eighties/
41. [S41] Computer History Museum, Widrow oral history. https://www.computerhistory.org/collections/catalog/102746758
42. [S42] "The Representation of Knowledge and the Relevance of Biological Models at the Symposium on the Mechanization of Thought Processes, 1958," *IEEE Annals of the History of Computing* (2023). https://dl.acm.org/doi/abs/10.1109/MAHC.2023.3297745
43. [S43] Secondary transcriptions of the later paragraphs of the 8 July 1958 UPI/NYT story (leads, not sources): Brightwork Research, "The Complicity of the Media in Pushing the AI Bubble", https://www.brightworkresearch.com/the-complicity-of-the-media-in-pushing-the-ai-bubble/ ; the clipping is reproduced as an image in Sejnowski, "The Unreasonable Effectiveness of Deep Learning in AI" (PNAS 2020), Fig. 3, https://arxiv.org/abs/2002.04806 . Primary: NYT TimesMachine, 8 July 1958, p. 25 (not yet read).
44. [S44] *Mechanisation of Thought Processes: proceedings of a symposium held at the National Physical Laboratory on 24th, 25th, 26th and 27th November 1958* (HMSO 1959), Open Library record: https://openlibrary.org/books/OL24514899M/Mechanisation_of_thought_processes
45. [S45] Stanford Report, "Bernard Widrow, pioneer of adaptive neural networks, dies at 95", 12 Dec 2025. https://news.stanford.edu/stories/2025/12/bernard-widrow-obituary
46. [S46] Smithsonian Open Access record for nmah_334414 (full NMAH description text, "date made 1958", "came to the Smithsonian in 1967 from Cornell University as a transfer from the Office of Naval Research"). https://api.si.edu/openaccess/api/v1.0/content/edanmdm:nmah_334414
47. [S47] WorldCat, "Mark I Perceptron press conference records, 1960" (summary: "a press demonstration of the Mark I Perceptron on June 23, 1960"). https://search.worldcat.org/title/mark-i-perceptron-press-conference-records-1960/oclc/63287884

---

## 12. Fact-check log (adversarial pass, 2026-10-05)

Method: primary texts were re-read directly. These were the DTIC OCR of *Neurodynamics*, including a visual check of the preface page image (p. vii); the 1958 *Psychological Review* scan; Minsky's 1961 *Proc. IRE* text; Selfridge 1959; Widrow 2005; Widrow & Lehr 1990; the Dartmouth proposal; the NYT archive capture; the *New Yorker* archive page for "Rival"; Bernstein 1981 (SNARC); and the Smithsonian record through its Open Access API. Web checks covered the Cornell Chronicle, the CBI/WorldCat records, the Wikipedia Perceptron, Mark I and Rosenblatt pages, Multicians, the O'Connor abstract, the Olazaran abstract, Liu's essay, the Stanford Report obituary and the Teddington proceedings record.

**Confirmed against the primary text (no change):**
- NYT headline, date, page, dateline and lede [S1].
- Psych. Rev. 65(6): 386-408, CAL, contract Nonr-2381(00), and the "connections or associations rather than topographic representations" passage [S2].
- ONR Information Systems Branch: Buffalo from July 1957, Ithaca from September 1959; the Rome Air Development Center "has assisted in the development of the Mark 1 perceptron" [S3].
- "motor-driven potentiometers for integrators, and a large patch-panel for connections"; eight binary R-units and 512 A-units [S3].
- Preface signed "15 March 1961"; the "bloodhounds" passage (with "all of the exuberance"); "first and foremost a brain model"; "Neutron and Electron"; the "loyal opposition" footnote [S3].
- §12.3 alphabet limits; §5.5 "insufficient to prove the theorem in a rigorous fashion"; Theorem 4 conditions; "several logical errors in Papert's argument" [S3].
- Minsky 1961 "two separated parts" and footnote 10 [S19].
- Selfridge's "shriek ... loudest", the Morse code task and the biographical note [S17].
- Widrow 2005 quotes, the LMS equations, the 4×4 switches and Zack Electronics [S11].
- Widrow & Lehr on MRI, "earliest popular", and adaptive first layers only [S13].
- Dartmouth conjecture and topic 3, "Neuron Nets" [S20].
- Smithsonian 1967 transfer from ONR via Cornell [S46].
- 23 June 1960 first public demonstration [S47][S6].
- Teddington, 24-27 Nov 1958 [S44].
- Widrow died 30 Sept 2025 [S45].
- Novikoff citation and the (R/γ)² bound [S10][S6].

**Changes made:**
1. **Tulsa headline (key claim 7), corrected.** The page image shows punctuation between "Navy" and "Robot". It now reads "Navy—Robot That Thinks", not "Navy Robot That Thinks". Source: DTIC AD0256582 p. vii.
2. **Convergence proofs (key claim 10), corrected.** Rosenblatt names "Block, Joseph, Kesten, and others", not Novikoff, and his March 1961 book already contains a corrected proof with a corrections bound. Block (1962) and Novikoff (1962) are the published proofs. Sources: [S3] §5.5; [S9]; [S10].
3. **MADALINE Rule I (key claim 13), corrected.** Widrow & Lehr credit MRI to "Widrow and his students" (Widrow 1962). Ridgway's April 1962 thesis (TR 1556-1) gave mathematical analysis; it did not originate the rule. Source: [S13] refs. 2, 75-77.
4. **SNARC (key claim 16), corrected for nuance.** "six vacuum tubes and a motor" per neuron is Minsky's design-level recollection ("in principle, at least"). The built machine "had three hundred tubes and a lot of motors". ONR funding was "a couple of thousand dollars" obtained by George Miller. Source: Bernstein 1981 via cyberneticzoo [S27].
5. **Project MAC (key claim 18), corrected.** It started 1 July 1963 with $2,220,000 awarded by ONR on behalf of ARPA; $2M was Licklider's proposal. About one third went to the AI group, and most went to time-sharing. The Nilsson "stymied us all" quote is from Nilsson 2009, not an Olazaran interview. The Rosen page cite "Olazaran 1993, 622" is inconsistent. Sources: [S31]; [S23].
6. ***New Yorker* "Rival" (key claim 20), corrected and upgraded.** The quote is verbatim, but "indeed" is lowercase mid-sentence in the original (full sentence now given). It is now PRIMARY-VERIFIED from the newyorker.com archive text: print issue 6 Dec 1958, Talk of the Town, credited to Harding Mason, D. Stewart and Brendan Gill. Added the magazine's "capable of what amounts to original thought" and "has yet to be built ... simulated on a 704", plus Rosenblatt's reported lines ("none whatever", "Love ... Hope. Despair."). Source: [S28].
7. **Wrong citation [S32], corrected.** The USNA notes do NOT contain the Weather Bureau/"$2,000,000 '704'"/"fifty attempts"/"newsmen" sentence, nor "400 photo cells" or "about 1,000" association cells. The 704 sentence is re-cited to secondary transcriptions [S43]. The photocell and association-cell claims are demoted to UNVERIFIED. Sources: [S32]; [S43].
8. **"Design of an Intelligent Automaton", corrected (addition).** *Neurodynamics* ref. 81 lists it in ONR *Research Reviews*, Oct 1958, pp. 5-13, as well as CAL's *Research Trends*, Summer 1958. Source: [S3] bibliography.
9. **Teddington, corrected.** Rosenblatt's own paper, "Two Theorems of Statistical Separability in the Perceptron", is in the proceedings (vol. I). This replaces the vague "one of the first expositions". Sources: [S3] ref. 82; [S44].
10. **NPIC citation, corrected.** Now *IJIC* 36(4): 1337-1351, online 21 June 2022. Source: Taylor & Francis record [S29].
11. **Later UPI paragraph wording, UNVERIFIED.** "speech or writing" / "speech and writing" / "speech or language" and "names"/"name" differ across transcriptions, so it is demoted to "do not use as a quote". The "$100,000 ... read and write" sentence stays SECONDARY. Sources: [S32]; [S43].
12. **"first machine which is capable of having an original idea", UNVERIFIED.** No primary source was found. The nearest primary wording is the *New Yorker*'s own "capable of what amounts to original thought". Sources: [S4]; [S28].
13. **"fired to the planets" / "assembly line ... conscious of their existence", UNVERIFIED.** No primary scan was found. Secondary transcriptions attribute these to Rosenblatt within the same UPI story. Sources: [S40]; [S43].
14. **"400 photo cells" / "about 1,000" in the 1958 press, UNVERIFIED.** No source was found. Source: [S32].
15. **Mark I build year (key claim 6), CONTESTED.** The Smithsonian has "date made 1958" and "By the following year"; Jensen & Dunning 2026, via Wikipedia, have June-14 Dec 1959. Safe line: "built 1958-59; first shown publicly 23 June 1960". Sources: [S46]; [S6].
16. **NPIC dates (key claim 19), CONTESTED (minor).** O'Connor's archival 1963-66 is preferred over a "1960 to 1964" CIA Photo Division variant in Wikipedia summaries. Sources: [S29]; [S6].
17. **Navy vs Rosenblatt attribution (key claim 1), CONTESTED.** The lede attributes the walk/talk/conscious prediction to the Navy, which is confirmed. But secondary transcriptions put similar claims in Rosenblatt's mouth later in the same story, and he said in the *New Yorker* that one might "send one out into space". Do not tell the film audience he made no such claims. Sources: [S1]; [S28]; [S40]; [S43].
18. **Widrow's death date, upgraded** from "inferred" to confirmed: 30 Sept 2025. Birth date 24 Dec 1929 added. Source: [S45].
19. **New hook added (PRIMARY):** *Neurodynamics* Fig. 38, "BACK-PROPAGATING ERROR-CORRECTION EXPERIMENTS" (1961). Source: [S3].

### Fact-check log, round 2 (resumed run, 2026-10-05)

The resumed run re-checked the key claims that round 1 had not logged explicitly. Web search budget was exhausted, so all checks were direct fetches of primary or record pages.

**Confirmed (no change):**
- *New Yorker* "Rival" (6 Dec 1958) wording re-read from the newyorker.com page text: "...indeed, it strikes us as the first serious rival to the human brain ever devised..."; "The first perceptron has yet to be built, but it has been successfully simulated on a 704"; "'Love,' he said. 'Hope. Despair. Human nature, in short.'"; "At the moment, none whatever"; "over a cup of coffee". Source: https://www.newyorker.com/magazine/1958/12/06/rival-2
- Cornell Chronicle: "a grade behind Rosenblatt at the Bronx High School of Science"; "After 50 trials, the computer taught itself to distinguish cards marked on the left from cards marked on the right." Wikipedia: Rosenblatt graduated from Bronx Science "in 1946". The Bronx Science claim stays CONTESTED. Sources: [S4]; https://en.wikipedia.org/wiki/Frank_Rosenblatt
- Smithsonian (Open Access API): "date made 1958"; "By the following year..."; funding from ONR and the Rome Air Development Center; "came to the Smithsonian in 1967 from Cornell University as a transfer from the Office of Naval Research". Source: [S5]/[S46]
- *Neurodynamics*: "eight binary R-units, and 512 A-units"; a standard retina of "400 sensory points arranged in a 20 by 20 toroidally connected array". Source: [S3]

**Changes made:**
20. **New Yorker quote block, corrected.** The reporter's questions had been paraphrased inside the blockquote. They now read verbatim: "Of what practical use, we asked, would the perceptron be?" and "What, we asked, wasn't the perceptron capable of? Dr. Rosenblatt threw up his hands." The rest of the "Love" answer is restored. Source: [S28].
21. **New PRIMARY quote added.** "My colleague disapproves of all the loose talk one hears nowadays about mechanical brains. He prefers to call our machine a self-organizing system..." The colleague is Yovits of ONR. This is useful for the shared-responsibility framing of the hype. Source: [S28].
22. **Rosen quote, sourced.** It previously had no citation. It is now attributed to Olazaran's 1991 thesis interview (pp. 131-33), as compiled by Liu [S23, SECONDARY]. The full wording ends "in an automatic fashion", so the film must mark any truncation. Rosen's "About 1965 or 1966" exit quote and Widrow's "about 1965 or 1966 ... basically stopped on neural nets ... adaptive antennas" quote (Olazaran 1991, pp. 129-30) were added, sourcing key claim 18's "SRI and Widrow's group left neural nets". Source: https://yuxi.ml/essays/posts/perceptron-controversy/
23. **Mark I build year, internal inconsistency fixed.** §7.6 still said "built in 1959". It now says "1958-59", matching the CONTESTED status. Wikipedia's Rosenblatt article adds a third variant ("hardware construction in 1960"), which is noted as a likely conflation with the 1960 unveiling. Sources: [S5]; [S6]; https://en.wikipedia.org/wiki/Frank_Rosenblatt
24. **Mark I photocells, clarified.** The 20×20 retina is PRIMARY in *Neurodynamics*. The Mark I-specific count of 400 photocells remains SECONDARY [S6]. The museum's label calls the potentiometer array "the A unit". The dossier now warns that the potentiometers are functionally the learned A→R weights. Sources: [S3]; [S5].

**Not re-fetchable this run:** the NYT archive page blocks automated fetches. Round 1's Wayback verification of the headline, page and lede stands.

