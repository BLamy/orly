# Dossier: The Expert Systems Boom and the Second AI Winter

- id: `expert-systems-second-winter`
- era: 1980-1995
- as-of: 2026-10-05
- status: drafted from background knowledge, then checked against primary texts where marked **[VERIFIED-PRIMARY]**. The primary texts checked were: the AAAI-84 panel transcript (OCR of the scanned *AI Magazine* pages), Lenat, Prakash and Shepherd's 1985 Cyc paper (OCR), Brooks 1990 and 1991 (PDF text), the MYCIN evaluation chapter (OCR), and Feigenbaum's "Expert Systems: Principles and Practice" (PDF text). **[SECONDARY]** marks a claim that rests only on a secondary source. **[CONTESTED]** marks a claim that sources disagree on. **[UNVERIFIED]** marks a claim that must not be stated as fact.

Source numbers in square brackets, e.g. [S3], refer to section 11.

---

## 1. Summary

In the 1980s, artificial intelligence became a business for the first time. The idea that sold it was the **expert system**. An expert system is a program that holds the rules of thumb of a human specialist, written by hand as hundreds or thousands of IF-THEN rules, and chains through them to diagnose a blood infection, configure a computer order or plan a drilling operation. Its intellectual father was **Edward Feigenbaum** at Stanford. From the DENDRAL chemistry program (begun 1965) he drew what he called the "knowledge-is-power hypothesis (later called the Knowledge Principle)". It says that knowledge of the specific task domain "was more important as a source of power for competent problem solving than the reasoning method employed" [S3]. The craft of extracting that knowledge from experts and coding it was named **knowledge engineering** [S3].

Two systems became the showpieces:

- **MYCIN** (Stanford, mid-1970s) recommended antibiotics. In a blinded 1979 trial on ten meningitis cases, eight outside experts rated 65% of MYCIN's prescriptions acceptable. The five Stanford faculty specialists scored between 42.5% and 62.5% [S7][S8]. MYCIN was still never put into routine clinical use [S9].
- **R1/XCON** (John McDermott, Carnegie Mellon, for Digital Equipment Corporation) configured VAX computer orders from January 1980. Work began in December 1978 in the OPS4 language (750 rules by October 1979); a spring-1980 rewrite in OPS5 cut it to 500 rules. It then grew to 850 rules by the end of 1980, about 3,300 by November 1983 and 6,200 by 1987, with about half its rules changing each year [S11][S15] **[VERIFIED-PRIMARY, fact-check]**. Its savings are usually quoted in the tens of millions of dollars a year. The exact figure is **[CONTESTED]** [S10][S14][S2].

Governments joined in. In 1982 Japan's Ministry of International Trade and Industry (MITI) launched the **Fifth Generation Computer Systems (FGCS)** project at ICOT in Tokyo, directed by Kazuhiro Fuchi. It aimed at parallel "knowledge information processing" machines built on logic programming [S16][S17][S21]. The West answered with a scare. Feigenbaum and Pamela McCorduck's 1983 book *The Fifth Generation* framed the project as "Japan's computer challenge to the world" [S21]. Then came national programmes:

- **MCC** (Microelectronics and Computer Technology Corporation), a US industry consortium. It was founded in late 1982 under Admiral Bobby Ray Inman and sited in Austin, Texas in 1983 [S33][S34].
- **DARPA's Strategic Computing Initiative** (announced 1983; about $1 billion over 1983-1993), with three flagship demonstrations: an Autonomous Land Vehicle, a Pilot's Associate and a naval Battle Management system [S24][S26].
- Britain's **Alvey Programme** (from 1983, £350 million proposed, with intelligent knowledge-based systems as one of four strands) [S28][S29].

At MCC in July 1984, **Doug Lenat** began the boldest knowledge-engineering bet of all, **Cyc**. The plan was to hand-encode the "common sense" that every encyclopedia article takes for granted, "over the coming decade" [S35][S36].

Insiders were already uneasy. At the AAAI conference in Austin in August 1984, Drew McDermott chaired a panel later published as "The Dark Ages of AI." He sketched a worst case in which DARPA's programme and the Fifth Generation project fail, startups fail, and funding dries up. He noted this condition was "called the 'AI Winter' by some" [S1] **[VERIFIED-PRIMARY]**. Roger Schank warned that if researchers abandoned science for products, "we will find that we are in the 'dark ages' of AI" [S1]. (Popular histories add Marvin Minsky to this warning. He was **not** on the published panel. See section 8.)

The forecast came true. Around **1987** the market for dedicated **Lisp machines** (Symbolics, LISP Machines Inc., TI, Xerox) collapsed. Cheaper Sun workstations and desktop PCs running Lisp and expert-system shells overtook them [S2][S40][S41]. Around 1987 Jack Schwartz took over DARPA's computing research office (by then named ISTO, IPTO's successor; the start year is given as 1986 or 1987, **[CONTESTED]**). According to McCorduck, he dismissed expert systems as "clever programming" and cut AI funding "deeply and brutally" (as quoted in [S2]) [SECONDARY] [S74]. Expert systems turned out to be **brittle**, meaning they failed badly outside their narrow domain. They were also **expensive to maintain**, and they were stuck behind the "knowledge acquisition bottleneck", a weakness Feigenbaum himself admitted [S3][S35]. The Fifth Generation project closed in June 1992. It had built working parallel inference machines, but they had little commercial impact [S16][S18][S19]. The Strategic Computing Initiative never delivered its three flagship systems in the promised form [S26]. Alvey's evaluators were downbeat about its commercial effect [S30][S31]. By the early 1990s "AI" was a word companies avoided.

Two dissenters had been arguing that the whole programme rested on a mistake:

- **Hubert Dreyfus**, a Berkeley philosopher, wrote *What Computers Can't Do* (1972). He argued that human expertise is intuitive and embodied, not a set of rules. In the 1992 MIT Press reissue, *What Computers Still Can't Do*, he called rule-based "Good Old-Fashioned AI" a "degenerating research program" [S44][S46].
- **Rodney Brooks**, an MIT roboticist, built insect-like robots without central world models. In "Elephants Don't Play Chess" (1990) he wrote that "the world is its own best model" [S50]. "Intelligence without representation" (written 1987, published 1991) argued that "Representation is the wrong unit of abstraction" [S51]. **[VERIFIED-PRIMARY]**

**Neural networks during the second winter.** The connectionist revival of 1986 (backpropagation, the PDP volumes) peaked in the late 1980s, at the same moment expert systems crashed. DARPA even ran a Neural Network Study (October 1987-February 1988) and started a neural-network programme in 1989 [S73]. By the mid-1990s, however, enthusiasm for neural nets had also cooled. Networks with many layers or long time spans were hard to train. Hochreiter (1991, in German) and Bengio, Simard and Frasconi (1994) showed why error signals **vanish** as they are propagated back through many layers or time steps [S53][S54]. Labelled datasets were small and computers were slow. Support vector machines (Cortes and Vapnik, 1995) offered cleaner theory and competitive results [S62]. Neural-net research continued (LeCun's convolutional nets read handwritten digits at Bell Labs, for example), but most of machine learning moved to statistical methods until the mid-2000s. See the sibling dossiers `connectionist-revival-backprop` and (if present) `classical-ml-era`.

**The belief of the age** was that intelligence equals knowledge, and that knowledge can be written down as explicit symbols and rules by people who interview experts. It held mainstream commercial and governmental authority from about 1980 to about 1987-1990. It eroded through the early 1990s and was displaced in research by statistical machine learning. Its deepest bet, Cyc, ran for nearly four decades (Lenat died in 2023) [S38]. In the 1985 Cyc paper Lenat wrote that simply putting an encyclopedia online "would be of little use, as there is practically nothing that current AI technology could draw from the raw text" [S35] **[VERIFIED-PRIMARY]**. The film can use this line as a hinge toward the era when machines did learn from raw text. It must be careful to present that as hindsight, not mockery.

---

## 2. Timeline

| Date | Event | Sources |
|---|---|---|
| 1965 | DENDRAL begins at Stanford (Feigenbaum, Joshua Lederberg, Bruce Buchanan, Carl Djerassi's mass-spectrometry lab). Its results give rise to the "knowledge-is-power hypothesis." | [S3][S4] |
| 1965 | Hubert Dreyfus, "Alchemy and Artificial Intelligence," RAND paper P-3244, compares AI to alchemy and uses the image of climbing a tree to reach the moon. | [S46][S47] |
| 22 Sep 1967 (per Wolfram example page) | Dreyfus loses a chess game in 37 moves to Richard Greenblatt's Mac Hack VI at MIT. **[SECONDARY]**; the date is given by a single source. | [S49] |
| 1972 | Dreyfus, *What Computers Can't Do: A Critique of Artificial Reason* (Harper & Row). | [S46][S47] |
| mid-1970s | MYCIN developed at Stanford (Edward Shortliffe's dissertation work with Buchanan, Stanley Cohen and others). It recommends antibiotics for bacteremia, later also meningitis. | [S8][S9] |
| 1977 | Feigenbaum, "The Art of Artificial Intelligence: Themes and Case Studies of Knowledge Engineering," IJCAI-77. | [S3][S5] |
| Dec 1978 | John McDermott (CMU) begins R1, first written in the OPS4 production-rule language, to configure DEC VAX-11/780 orders (250 rules by April 1979, 750 by October 1979). It was rewritten in OPS5 from April 1980. **[VERIFIED-PRIMARY, S11]** The claim that two earlier DEC attempts in FORTRAN and BASIC had failed is **[UNVERIFIED]**. | [S11][S10][S12] |
| 1979 | Richard Greenblatt founds LISP Machines Inc. (LMI) out of the MIT AI Lab. | [S41] |
| 21 Sep 1979 | Yu et al., "Antimicrobial selection by a computer: a blinded evaluation by infectious diseases experts," *JAMA* 242(12):1279-82. MYCIN 65% acceptable vs. faculty 42.5-62.5%. | [S7][S8] |
| Jan 1980 | CMU hands R1 to DEC, and DEC's manufacturing organisation uses it regularly from January 1980. After the three-month OPS5 rewrite (begun April 1980), it has 500 rules. By the end of 1980 it has 850. | [S11] |
| 9 Apr 1980 | Symbolics, Inc. incorporated (Russell Noftsker, Robert Adams and others; spun out of the MIT AI Lab; Cambridge, Mass.). | [S40] |
| July 1981 | Teknowledge founded (Feigenbaum co-founder) with 20 scientists from Stanford, MIT and RAND. | [S4] |
| Oct 1981 | Japan hosts the international conference announcing the Fifth Generation plans in Tokyo. A UK Department of Industry mission attends. | [S28] |
| April 1982 | ICOT (Institute for New Generation Computer Technology) starts in Tokyo under MITI, directed by Kazuhiro Fuchi (from MITI's Electrotechnical Laboratory). Plan: three stages, 1982-84, 1985-88, 1989-91. | [S16][S17][S70] |
| 1982 | The UK Alvey Report (committee chaired by John Alvey of British Telecom) recommends a national IT programme. | [S28] |
| late 1982 | MCC is founded by US computer and chip companies under Admiral Bobby Ray Inman (former NSA director, CIA deputy director). | [S33][S34] |
| 1983 | Feigenbaum and McCorduck, *The Fifth Generation: Artificial Intelligence and Japan's Computer Challenge to the World* (Addison-Wesley). | [S21] |
| 1983 | MCC picks Austin, Texas over San Diego, Atlanta and Research Triangle (57 cities bid). | [S34] |
| Apr-Jun 1983 | The UK Alvey Programme begins. The government announces acceptance in April 1983 (about £200M from government over five years, with the remaining £150M from industry), and director Brian Oakley takes up his post on 1 June 1983 (Hansard). Wikipedia gives the programme's run as 1984-1990. **[CONTESTED start year; use "1983"]** | [S28][S29] |
| 1983 (fall; 28 Oct per secondary sources) | DARPA announces the 10-year Strategic Computing plan, with $300M new money for the first three years. | [S24][S25] |
| 27 Oct 1983 | Joseph Weizenbaum's scathing review of *The Fifth Generation* appears in the *New York Review of Books*. | [S22] |
| 1984 | US National Cooperative Research Act legalises joint research consortia such as MCC. | [S33] |
| July 1984 | Lenat begins Cyc at MCC (leaving Stanford). | [S36][S38] |
| Aug 1984 | AAAI-84, Austin, Texas. Panel "The Dark Ages of AI" (Drew McDermott, Mitch Waldrop, Roger Schank, B. Chandrasekaran, John McDermott; DARPA's Ron Ohlander also introduced). "AI Winter" is named on stage. **[CONTESTED/UNVERIFIED exact dates]**: AAAI-84 is usually dated 6-10 August 1984. The transcript itself confirms only Austin and the 1984 conference. | [S1] |
| Fall 1984 | Bachant and McDermott, "R1 Revisited: Four Years in the Trenches," *AI Magazine* 5(3):21-32: 500 rules after the 1980 OPS5 rewrite, about 2,000 by mid-1982, and about 3,300 by November 1983, with about 5,500 component descriptions. | [S11] |
| 15 Mar 1985 | symbolics.com is registered, the first .com domain name. | [S40] |
| Fall 1985 | The panel transcript is published in *AI Magazine* 6(3):122-134. | [S1] |
| Winter 1985 | Lenat, Prakash and Shepherd, "CYC: Using Common Sense Knowledge to Overcome Brittleness and Knowledge Acquisition Bottlenecks," *AI Magazine* 6(4):65-85. Some indexes date it 1986. | [S35] |
| 1986 | Symbolics revenue peaks (about $100M+; figures vary). The Lisp-machine market peaks. **[CONTESTED figure]** | [S42][S43] |
| 1987 | Soloway, Bachant and Jensen (AAAI-87): XCON has 6,200 rules, about 50% changing each year. | [S15] |
| 1987 | The Lisp-machine market collapses. Workstations (Sun) and PCs running Lisp and expert-system shells overtake the dedicated machines. LMI goes bankrupt. Crevier: "An entire industry worth half a billion dollars was replaced in a single year." | [S2][S41][S42] |
| 1986/1987 **[CONTESTED year]** | Jack (Jacob T.) Schwartz becomes director of DARPA's Information Science and Technology Office (ISTO, IPTO's successor) and cuts AI funding within Strategic Computing. His Wikipedia biography gives 1986-1989 for ISTO. The AI-winter and SCI articles say he took over "IPTO" in 1987. | [S2][S24][S74] |
| Sep 1987 | Brooks's "Intelligence without representation" is received by *Artificial Intelligence*. It circulates widely before publication in 1991. | [S51] |
| Oct 1987-Feb 1988 | DARPA Neural Network Study (director Bernard Widrow; sponsor Jasper Lupo, DARPA Tactical Technology Office). It leads to a DARPA neural-network programme in 1989. | [S73] |
| April 1988 | DARPA formally cancels the Autonomous Land Vehicle work. | [S24] |
| early 1988 | The Symbolics board ousts Noftsker and CEO Brian Sear. | [S42] |
| 1989 | Pomerleau's ALVINN: a neural network with 29 hidden units steers CMU's Navlab. | [S55] |
| 1990 | Brooks, "Elephants Don't Play Chess," *Robotics and Autonomous Systems* 6:3-15. Brooks co-founds iRobot (1990). | [S50][S52] |
| 1990 | Guha and Lenat, "Cyc: A Midterm Report," *AI Magazine* 11(3). | [S39] |
| 1991 | Brooks, "Intelligence without representation," *Artificial Intelligence* 47:139-159. | [S51] |
| 1991 (exact day **[UNVERIFIED]**) | Sepp Hochreiter's diploma thesis (TU Munich, advisor Jürgen Schmidhuber) analyses vanishing gradients, in German. | [S53] |
| June 1992 (1-5 June per secondary sources) | The FGCS'92 conference in Tokyo marks the end of the main Fifth Generation project. A reduced follow-on ran in 1993-94: Wikipedia gives "1982 to 1994" and "a little less than ¥57 billion" for the whole effort. **[CONTESTED end date]** The *Washington Post* (2 June) says it had little impact on the computer market. The *New York Times* (5 June, Andrew Pollack) headline: "'Fifth Generation' Became Japan's Lost Generation." | [S18][S19][S20] |
| 1992 | Dreyfus, *What Computers Still Can't Do* (MIT Press), with a new introduction. | [S44] |
| 1993 | McDermott, "R1 ('XCON') at age 12," *Artificial Intelligence* 59:241-247. | [S13] |
| 1993 | The Strategic Computing Initiative ends (1983-1993 span). | [S24][S26] |
| 1993 (filing) / 1996 (defunct) | Symbolics enters Chapter 11. Wikipedia's infobox lists it defunct 7 May 1996. **[CONTESTED dates]** | [S40][S42] |
| 1993-1994 | ICOT continues on a reduced scale. MITI releases its software free of charge. | [S18][S70] |
| Mar 1994 | Bengio, Simard and Frasconi, "Learning long-term dependencies with gradient descent is difficult," *IEEE Trans. Neural Networks* 5(2):157-166. | [S54] |
| Jan 1995 | Cyc spins out of MCC into Cycorp, Austin (Lenat CEO). | [S36] |
| 1995 | Cortes and Vapnik, "Support-Vector Networks," *Machine Learning* 20:273-297. | [S62] |
| 1996 | John McCarthy reviews Dreyfus (1992) in *Artificial Intelligence* 80, rejecting the "degenerating research program" charge. | [S45] |
| 2000 | MCC ceases operations (its board voted to dissolve it in June 2000). It is formally dissolved in 2004. | [S33] |
| 22 Apr 2017 | Dreyfus dies in Berkeley, aged 87. | [S47][S48] |
| 31 Aug 2023 | Lenat dies in Austin, aged 72. | [S38] |

---

## 3. People

> Physical descriptions are for **respectful silhouette** work. They summarise widely circulated period photographs. The art department should check each against licensed reference images before final design. Anything not checked is marked *(check)*.

**Edward A. Feigenbaum** (b. 20 Jan 1936, Weehawken, New Jersey) [S4]
- *Role:* professor of computer science at Stanford (Palo Alto/Stanford, California) from 1965. He led the Heuristic Programming Project and later the Knowledge Systems Laboratory, and worked on DENDRAL, MYCIN and SUMEX [S4]. He co-founded Teknowledge (1981) and IntelliCorp [S4]. He shared the 1994 ACM Turing Award with Raj Reddy [S4]. He is called the "father of expert systems" [S4].
- *Believed:* knowledge, not clever inference, is the source of machine intelligence (the "Knowledge Principle") [S3]. He saw Japan's Fifth Generation as a strategic challenge the US had to answer [S21]. He was candid about limits. In "Expert Systems: Principles and Practice" (c. 1992) he wrote that tools and shells "do not usually help with the crucial bottleneck problem of knowledge acquisition", and that machine learning had produced "virtually no techniques" to help with it [S3] **[VERIFIED-PRIMARY]**.
- *Pictured:* slight build, neat dark hair (grey to white in later decades), glasses, jacket and tie or open-collared shirt in the 1980s *(check)*.

**Edward H. Shortliffe** (Stanford medical student / PhD, then physician-informatician)
- *Role:* principal author of MYCIN (Stanford; Shortliffe's dissertation work). He co-edited, with Bruce Buchanan, *Rule-Based Expert Systems: The MYCIN Experiments of the Stanford Heuristic Programming Project* (1984) [S8][S9].
- *Pictured:* young man in mid-1970s clothes; details *(check)*.

**John P. McDermott** (Carnegie-Mellon University, Pittsburgh)
- *Role:* author of R1/XCON [S10][S12]. He sat on the AAAI-84 "Dark Ages" panel [S1]. There he doubted that disappointed expectations would cut research funding: "it's not completely clear to me that people who have violated expectations are going to end up withdrawing support" [S1] **[VERIFIED-PRIMARY]**.
- *Pictured:* *(check; no reliable description gathered)*.

**Drew McDermott** (Yale University, New Haven, Connecticut). *Not related to John McDermott; do not conflate.*
- *Role:* chaired the AAAI-84 panel and gave the "AI Winter" worst-case scenario [S1].
- *Pictured:* *(check)*.

**Roger C. Schank** (Yale University, New Haven, Connecticut; later Northwestern). Died 2023 [S61].
- *Role:* natural-language and story-understanding researcher, founder of startups (he told the panel he had "a new company that does educational software") [S1]. He gave the bluntest warning on the panel [S1].
- *Believed:* AI was abandoning science for products. He told the panel, "I don't much believe in expert systems," and that the community had "forgotten that we are here to do science, and that we are nowhere near the solution" [S1] **[VERIFIED-PRIMARY]**.
- *Pictured:* full dark beard, curly hair, stocky; open shirt or sweater *(check)*.

**B. Chandrasekaran** (Ohio State University, Columbus)
- *Role:* AAAI-84 panelist. He predicted an "AI dusk" rather than a winter [S1].

**M. Mitchell Waldrop** (*Science* magazine, Washington DC)
- *Role:* the press representative on the panel. He described the public's "exaggerated expectations" and "exaggerated fears" [S1].

**Kazuhiro Fuchi** (16 Feb 1936 - 13 Aug 2006) [S17][S58]
- *Role:* moved from MITI's Electrotechnical Laboratory (Tsukuba/Tokyo) to become research director of ICOT in Tokyo, 1982-1992. He became a University of Tokyo professor after the project ended [S17].
- *Believed:* parallel logic-programming machines would carry "knowledge information processing." At FGCS'92 he defended the project as basic research, not an applications effort, and said: "Although this project is about to end, the end is just another starting point" (as quoted in [S18]) **[SECONDARY quote; see section 6]**. A Stanford history calls him "a brilliant, unorthodox, and charismatic scientist" [S60-lead].
- *Pictured:* Japanese man in a dark business suit, glasses *(check)*.

**Douglas B. Lenat** (13 Sep 1950 - 31 Aug 2023) [S38]
- *Role:* Stanford AI researcher (AM, Eurisko). Principal scientist at MCC, Austin, 1984-1994. CEO of Cycorp from 1995 [S36][S38].
- *Believed:* expert systems are "brittle" because they lack common sense. The only remedy was to "encode all the world's knowledge down to some level of detail; there is no way to finesse this" [S35] **[VERIFIED-PRIMARY]**.
- *Pictured:* bearded, curly hair, glasses, casual shirt; large presence *(check)*.

**Admiral Bobby Ray Inman** (b. 1931)
- *Role:* former NSA director and CIA deputy director. First chairman and CEO of MCC in Austin [S33][S34].
- *Pictured:* lean, short hair, suit; ex-naval bearing *(check)*.

**Robert Kahn / Robert Cooper / Clint Kelly / Jack Schwartz** (DARPA, Arlington, Virginia)
- *Role:* architects and managers of Strategic Computing. Cooper was DARPA director and pushed the "NASA-style" demonstration projects. Kahn was the IPTO-side architect. Kelly managed the programme and the ALV [S24]. Jacob T. "Jack" Schwartz (NYU mathematician) headed DARPA's ISTO (IPTO's successor) from 1986 or 1987 **[CONTESTED year]** and cut AI funding [S2][S24][S74].

**Hubert L. Dreyfus** (15 Oct 1929, Terre Haute, Indiana - 22 Apr 2017, Berkeley) [S47][S48]
- *Role:* philosopher (Heidegger, Merleau-Ponty). Taught at MIT, then from 1968 at UC Berkeley for almost 50 years [S48].
- *Believed:* human expertise rests on intuition, embodiment and a background of practices that cannot be fully captured as explicit rules. He saw symbolic AI as alchemy: early success hiding a wrong direction [S46][S47]. With his brother Stuart he wrote *Mind Over Machine* (1986), a skill-acquisition model aimed directly at expert systems [S46].
- *Pictured:* tall, lean, dark wavy hair (grey later), animated lecturer; jacket, open collar *(check)*.

**Rodney A. Brooks** (b. 1954, Adelaide, Australia)
- *Role:* Flinders University (mathematics), Stanford PhD 1981, then MIT AI Lab (Cambridge, Massachusetts), where he led the mobile robot group [S50]. Co-founder of iRobot (1990) [S52].
- *Believed:* intelligence should be built bottom-up from layered behaviours coupled directly to sensors and motors (the "subsumption architecture"). Central symbolic world models "simply get in the way" [S51].
- *Pictured:* curly hair, moustache, Australian; jeans and casual shirts among small robots on a lab floor *(check)*.

**Joseph Weizenbaum** (MIT; creator of ELIZA)
- *Role:* reviewed *The Fifth Generation* with hostility in the *New York Review of Books*, 27 Oct 1983 [S22]. His "absurd" line targets Simon and Newell's 1958 forecast of machines whose problem-solving would become "coextensive" with the human mind's. He ties that forecast to the Fifth Generation claims. It is not a direct verdict on the Japanese plan.

**John McCarthy** (Stanford)
- *Role:* the logic-based AI pioneer who answered Dreyfus in 1996 [S45].

---

## 4. The belief of the age

**What the field believed.**
1. *Intelligence is knowledge.* The power of a program comes mainly from domain-specific knowledge, not from general reasoning methods: Feigenbaum's "knowledge-is-power hypothesis (later called the Knowledge Principle)" [S3].
2. *Knowledge can be made explicit.* An expert's competence can be drawn out through interviews by a "knowledge engineer" and written as rules (IF patient is a compromised host AND ... THEN ... with certainty 0.6), frames or logic [S3][S8].
3. *Scale is a matter of effort.* If programs are brittle, add more knowledge. Lenat's Cyc took this to the limit: "we must encode all the world's knowledge down to some level of detail; there is no way to finesse this" [S35].
4. *The hardware should fit the language.* AI ran in Lisp (US) or Prolog (Japan), and special-purpose Lisp machines and parallel inference machines were the natural platforms [S16][S40].
5. *Machine intelligence is a strategic national asset.* Japan's FGCS, America's Strategic Computing and MCC, and Britain's Alvey all treated "knowledge-based systems" as a race between nations [S21][S24][S28].

**Who held it.** Feigenbaum and the Stanford Heuristic Programming Project; CMU (McDermott's R1); start-ups (Teknowledge, IntelliCorp, Inference, Symbolics, LMI); corporations (DEC, Texas Instruments, Schlumberger, Xerox, Hewlett-Packard, GTE and Exxon were all named at AAAI-84 as having AI groups [S1]); and governments (MITI and ICOT, DARPA, the UK DTI/SERC). Wikipedia, summarising Newquist and Crevier, says corporations were spending "over a billion dollars on AI" by 1985 [S2] **[SECONDARY]**. Russell and Norvig's summary, as quoted there, is that "the AI industry boomed from a few million dollars in 1980 to billions of dollars in 1988" [S2] **[SECONDARY]**.

**Who dissented, and how.**
- **From inside, about hype rather than method:** the AAAI-84 panel. Drew McDermott feared an "AI Winter". Schank feared the loss of science. Chandrasekaran predicted an "AI dusk" [S1].
- **Philosophy:** Hubert Dreyfus (1965, 1972, 1986, 1992) argued that expertise is not rule-following [S46][S47]. Weizenbaum attacked the Fifth Generation enthusiasm as morally and technically absurd [S22].
- **Robotics and embodiment:** Rodney Brooks's "nouvelle AI" [S50][S51].
- **Connectionists:** the PDP group (Rumelhart, McClelland, Hinton and others) argued that knowledge should be *learned* as distributed weights, not typed in as rules (see `connectionist-revival-backprop`).
- **Japan specialists:** J. Marshall Unger's *The Fifth Generation Fallacy* (1987) attacked the Western panic as a misreading of Japan [S59].

**How long it held.** Commercial and governmental confidence ran from about 1980 (XCON goes live; ICOT planning) to about 1987 (Lisp machine crash; DARPA cuts). Expert systems did not vanish. They lived on as "business rules engines," configuration tools and embedded components, usually no longer called AI [S2][S3]. The research belief that hand-coded symbolic knowledge is the road to general intelligence lost its central place during the 1990s, as statistical learning rose. Cyc kept the bet alive at Cycorp for decades [S36][S38].

**What ended it.**
1. *Brittleness.* Systems failed badly on inputs outside their narrow domain and did not "recognize their own limitations" (Lenat et al. 1985, quoting McCarthy) [S35].
2. *Maintenance cost and the acquisition bottleneck.* XCON's rule base churned by about 50% a year [S15]. Feigenbaum conceded that machine learning had produced "virtually no techniques" to help with knowledge acquisition [S3].
3. *Hardware economics.* General-purpose workstations and PCs became fast enough to run Lisp, which wiped out the $0.5 billion Lisp-machine niche in about a year [S2][S42].
4. *Missed government milestones.* None of Strategic Computing's three flagship systems was delivered "in the exact form and on the exact date" promised [S26]. FGCS ended with technically impressive but commercially irrelevant machines [S16][S19].
5. *Funding politics.* DARPA's 1987 change of direction [S2][S24]. The end of the Cold War build-up also hurt (Symbolics' sales were tied to defence-funded projects) [S40] **[SECONDARY]**.

---

## 5. Experiments and results

### 5.1 MYCIN's blinded evaluation (Stanford, published 1979) [S7][S8] **[VERIFIED-PRIMARY via OCR of reprint chapter]**
- **Set-up.** Ten meningitis patients were selected by "a physician who was not acquainted with MYCIN's methods or with its knowledge base." All had been hospitalised at a county hospital affiliated with Stanford and were "diagnostically challenging." There were no more than three viral cases, and at least one case each of tuberculous, fungal, viral and bacterial meningitis [S8].
- **Prescribers.** Ten prescriptions per case were compiled: MYCIN, a medical student, five Stanford faculty specialists, other physicians, and the therapy actually given [S8].
- **Blinding.** Eight infectious-disease specialists from outside rated every prescription "without knowing the identity of the prescribers" [S8].
- **Result.** "Sixty-five percent of MYCIN's prescriptions were rated as acceptable by the evaluators. The corresponding mean rating for the five faculty specialists was 55.5% (range, 42.5% to 62.5%)." Seventy percent of MYCIN's therapies were rated acceptable by a majority of evaluators, against a faculty mean of 44% [S8]. MYCIN never failed to cover a treatable pathogen [S7].
- **Caution.** The study is about **choice of antimicrobials** in ten cases, not general diagnosis. It also shows that even experts disagreed. No prescriber came close to 100%.
- **Aftermath.** MYCIN was not used in routine practice. Commonly cited reasons are legal and ethical questions and the impracticality of typing in a consultation at a time-shared terminal [S9] **[SECONDARY]**.
- **Physical apparatus.** MYCIN was written in Lisp and ran on a DEC KI10 PDP-10 time-sharing machine, reached over the ARPANET (Wikipedia [S9]; SUMEX-AIM attribution *(check)*). A clinician typed answers to a long series of questions at a terminal, and MYCIN could explain itself with "WHY" and "HOW" commands [S9] **[SECONDARY]**.

### 5.2 R1/XCON at Digital Equipment Corporation (1980-1990s) [S10][S11][S12][S15]
- **The problem.** A VAX order was a list of hundreds of separately ordered parts: cabinets, backplanes, memory, cables, disk drives, software. Sales staff often got combinations wrong, leaving customers with missing cables or incompatible parts [S10].
- **The program.** A forward-chaining production system, first written in OPS4 (Dec 1978-1979) and rewritten in OPS5 in 1980 [S11]. At each step it "recognizes what to do," so little search is needed [S10][S12]. McDermott's 1980 technical report gives it 772 rules at that time [S12-lead].
- **Growth.** 750 rules (Oct 1979, OPS4), then 500 (after the 1980 OPS5 rewrite), 850 (end of 1980), about 2,000 (mid-1982) and about 3,300 (Nov 1983) [S11]. Wikipedia's "about 2500 rules" conflicts with this primary account; do not use it. Then then 6,200 (1987, about 50% changing per year) [S15], then more than 10,000 by the late 1980s, when a re-implementation was needed [S10-lead] **[SECONDARY for 10,000]**.
- **Results.** By 1986 it had processed 80,000 orders with 95-98% accuracy [S10] **[SECONDARY]**.
- **Savings [CONTESTED].** $25M a year (Wikipedia XCON [S10]); "40 million dollars over just six years" (Wikipedia AI winter, citing Newquist/Crevier [S2]); "an estimated $15 million" from eliminating a manufacturing step (Sviokla 1990, MIS Quarterly abstract [S14]). Safe wording: "saved DEC tens of millions of dollars."
- **Physical apparatus.** The output configured VAX-11/780 systems: rows of refrigerator-height cabinets, tape drives, disk packs. XCON itself ran on DEC hardware and was used in manufacturing at DEC's Salem, New Hampshire plant (per [S10]) **[SECONDARY]**.

### 5.3 Fifth Generation Computer Systems (ICOT, Tokyo, 1982-1992) [S16][S17][S18][S70]
- **Aim.** Parallel "knowledge information processing" machines that run logic programs (Prolog, then the concurrent language KL1), with natural-language interfaces as a long-range goal [S16][S18].
- **Budget.** "Approximately ¥54 billion ... over 11 years" (IPSJ Computer Museum) [S16]; ¥54.15 billion, about $416.5 million (UT retrospective) [S18]. The FY1983 budget was ¥2.7 billion [S70]. Wikipedia's AI-winter article cites $850 million as MITI's 1981 commitment [S2]. Wikipedia's FGCS article says the project "ran from 1982 to 1994, spending a little less than ¥57 billion (about US$320 million)", which counts the 1993-94 follow-on [S75]. **[CONTESTED: planned vs. spent; 1992 vs. 1994 end]** Safe wording: "about ¥54 billion over the ten-year main project, 1982-1992".
- **Machines.** Sequential inference machines (PSI) and five models of Parallel Inference Machine (PIM). For example, PIM/p had 512 processors and PIM/m had 256. Both are preserved at the National Museum of Nature and Science in Tokyo [S16]. The IPSJ museum calls the system "the world's fastest and largest computer oriented toward knowledge information processing" [S16].
- **Outputs.** 382 patents, 2,371 technical reports and memoranda, and about 100 software packages released free [S18-lead] **[SECONDARY]**.
- **Verdict at the time.** *Washington Post*, 2 June 1992: little impact on the global computer market [S19]. *NYT*, 5 June 1992: "'Fifth Generation' Became Japan's Lost Generation" [S20].

### 5.4 DARPA Strategic Computing Initiative (1983-1993) [S24][S25][S26]
- **Structure.** Three layers: hardware (parallel machines), generic software (vision, speech, natural language, expert systems) and three flagship military applications [S24][S26].
  - **Autonomous Land Vehicle (Army).** An eight-wheeled vehicle carrying cameras and a laser scanner, driven by computer vision along roads at Martin Marietta's Denver test site *(check vehicle details)*. An officer complained it was "huge, slow, and painted white, it would be too easy a target on the battlefield" (quoted in the Roland and Shiman history, via review [S26]) **[SECONDARY quote]**. DARPA cancelled it in April 1988 [S24].
  - **Pilot's Associate (Air Force).** An expert-system co-pilot [S24].
  - **Battle Management (Navy).** Fleet command decision aids [S24][S26].
- **Spend.** $300M in new money for the first three years. More than $1 billion over the decade [S24][S25].
- **Outcome.** None of the three applications was delivered in the promised form. The programme still advanced vision, speech, parallel processing and expert systems [S26]. CMU's Navlab work, partly funded in this era, produced **ALVINN**, a *neural network* that learned to steer (see [S55] and `connectionist-revival-backprop` §5.6).

### 5.5 Alvey Programme (UK, 1983-c.1990) [S28][S29][S30][S31][S32]
- **Four strands:** VLSI, software engineering, intelligent knowledge-based systems (IKBS, the British euphemism for AI after the Lighthill years), and man-machine interface [S28].
- **Money.** £350M proposed: "up to £200 million" from government over five years and "the remaining £150 million" from industry (Lord Lyell, Hansard, 18 Jan 1984) [S29] **[VERIFIED-PRIMARY]**.
- **Outcome.** The technical objectives were largely met, and it created a collaborative research community and a template for the EU's ESPRIT. The Manchester/Sussex evaluators' overall conclusion was "downbeat" about competitiveness [S31]. A DTI-commissioned evaluation (cited by the House of Lords, 2018) found that the pre-competitive focus hindered commercial impact [S30]. **[UNVERIFIED in fact-check: both pages refused connection or returned 403; do not quote "downbeat" until it is re-read]**

### 5.6 MCC and Cyc (Austin, 1983/1984 onward) [S33][S34][S35][S36][S37]
- **MCC.** About 400 people at 9430 Research Boulevard, Austin [S35][S36].
- **Cyc's 1985 plan** (Lenat, Prakash and Shepherd) **[VERIFIED-PRIMARY]**:
  - Encode a one-volume desk encyclopedia's worth of knowledge **and** the common sense it assumes. There are "approximately 30,000 articles in a typical one-volume desk encyclopedia, and most of them are one paragraph long."
  - "A conservative estimate for the data enterers' rate is one paragraph per day; this would make their total effort about 150 man-years."
  - The time horizon was "roughly one decade."
  - Knowledge must be re-represented "by hand." Simply having an online encyclopedia "would be of little use."
  - It required "Lisp machines" and "funding for a decade-long effort."
- **Reality.** About 1 million assertions by 1994 and about 24.5 million by 2017 [S36] **[SECONDARY, uncited in Wikipedia]**. By 2002 it had "consumed $60 million and 600 person-years of effort" [S37] **[SECONDARY]**.

### 5.7 The Lisp machine market (1979-c.1993) [S40][S41][S42][S43]
- **Products.** MIT CADR derivatives: LMI Lambda, Symbolics LM-2 (1981) and 3600 (1983), TI Explorer, Xerox 1100-series ("D-machines"). Symbolics' operating system was Genera [S40][S42].
- **Collapse.** Sun and other workstations, Lucid and Franz Common Lisp on Unix, and PC-based shells such as CLIPS made dedicated hardware uneconomic [S2]. LMI went bankrupt in 1987. Symbolics was weakened by expensive long-term leases, a 1988 boardroom purge and lost defence sales [S40][S42].
- **Physical apparatus.** A Symbolics 3600 was a tall floor-standing cabinet beside the desk. On the desk sat a large high-resolution black-and-white bitmap monitor, a mouse, and a keyboard with extra modifier keys (Symbol, Super, Hyper, Meta) *(check exact keyboard and monitor against museum photos)*.

### 5.8 Brooks's robots (MIT AI Lab, mid-1980s-1990) [S50][S51] **[VERIFIED-PRIMARY]**
- **Allen.** Sonar range sensors and odometry. Ran on "an offboard lisp machine." It "would happily sit in the middle of a room until approached, then scurry away, avoiding collisions as it went" [S50].
- **Herbert.** A 24-processor onboard computer of "slow CMOS 8-bit microprocessors". Links between behaviours were "physically embodied as actual copper wires". It had 30 infrared proximity sensors, an arm, and a laser striping system giving a 256×32 depth image every second. It was programmed "to wander around office areas, go into people's offices and steal empty soda cans from their desks" [S50].
- **Genghis.** "a 1Kg six legged robot," with 12 motors, 12 force sensors, 6 pyroelectric (body-heat) sensors, one inclinometer and 2 whiskers. It walked over rough terrain and followed people [S50].
- **Fig. 1 roster.** Allen, Herbert, Seymour, Toto, Tito, Genghis, Squirt ("very small"), Tom and Jerry, and Labnav [S50].

### 5.9 Neural nets in the second winter [S53][S54][S55][S62][S73]
- **1987-89 rise.** NETtalk, ALVINN and the DARPA Neural Network Study (Oct 1987-Feb 1988; Widrow director; hundreds of researchers interviewed; DARPA programme from 1989) [S73]. A 1989 SIGCSE abstract opens: "Neural networks have been called 'more important than the atomic bomb'" [S73-lead]. The attribution to DARPA's Jasper Lupo is **UNVERIFIED**.
- **The cooling.** Hochreiter (1991) and Bengio et al. (1994) showed that gradients shrink, or explode, as they pass back through many layers or time steps [S53][S54]. Data were small (for example thousands of digits, not millions of photos). Workstations offered megaflops, not the later teraflops. SVMs (1995) offered convex training and margin theory [S62].
- **Safe framing.** Neural-net research did not stop. Hinton (Toronto), LeCun (Bell Labs), Bengio (Montréal) and Schmidhuber (Munich/IDSIA) kept working. But between the mid-1990s and the mid-2000s the mainstream of machine learning favoured kernel methods and probabilistic models. See sibling dossiers.

---

## 6. Verified quotes

All quotes below were read in the source named, except those marked otherwise.

**Q1. Drew McDermott, AAAI-84 panel, Austin, August 1984 (published *AI Magazine* 6(3), Fall 1985, p. 122) [S1] [VERIFIED-PRIMARY, OCR of the scanned page]**
> "To sketch a worst case scenario, suppose that five years from now the strategic computing initiative collapses miserably as autonomous vehicles fail to roll. The fifth generation turns out not to go anywhere, and the Japanese government immediately gets out of computing. Every startup company fails. Texas Instruments and Schlumberger and all other companies lose interest. And there's a big backlash so that you can't get money for anything connected with AI. Everybody hurriedly changes the names of their research projects to something else. This condition, called the "AI Winter" by some, prompted someone to ask me if "nuclear winter" were the situation where funding is cut off for nuclear weapons. So that's the worst case scenario."

Context: his opening remarks as panel chair. He immediately added: "I don't think this scenario is very likely to happen, nor even a milder version of it. But there is nervousness, and I think it is important that we take steps to make sure the "AI Winter" doesn't happen" [S1]. Note "called the 'AI Winter' by some": the term was already circulating, so McDermott did not coin it on stage.

**Q2. Drew McDermott, same, opening line [S1] [VERIFIED-PRIMARY]**
> "In spite of all the commercial hustle and bustle around AI these days, there's a mood that I'm sure many of you are familiar with of deep unease among AI researchers who have been around more than the last four years or so. This unease is due to the worry that perhaps expectations about AI are too high, and that this will eventually result in disaster."

**Q3. Roger Schank, same panel, pp. 124-125 [S1] [VERIFIED-PRIMARY]**
> "I said: "You may have come to the wrong person; I don't much believe in expert systems.""

Context: retelling his conversation with a real-estate developer who wanted to build "an expert systems industrial park."

**Q4. Roger Schank, same [S1] [VERIFIED-PRIMARY]**
> "The expectations that we, as an AI community ... have forgotten that we are here to do science, and that we are nowhere near the solution."

(The ellipsis replaces his aside "I assume that the people left here at this conference are the actual AI community-". Use with the ellipsis or not at all.)

**Q5. Roger Schank, same [S1] [VERIFIED-PRIMARY]**
> "It's difficult. But if we don't do that, we will find that we are in the "dark ages" of AI."

Context: "that" means going into a university and doing science instead of joining startups. This is where the panel's title comes from.

**Q6. Roger Schank, same [S1] [VERIFIED-PRIMARY]**
> "But I am concerned that people here who are first entering this field will begin to believe that a Ph.D means building another expert system. They're wrong."

**Q7. B. Chandrasekaran, same, p. 127 [S1] [VERIFIED-PRIMARY]**
> "Will there be an AI Winter? I think there may be an AI dusk, which may be even better, rather than the hard sunshine that we have been having in Austin recently."

**Q8. Edward Feigenbaum, "Expert Systems: Principles and Practice" (adapted for *The Encyclopedia of Computer Science and Engineering*, 1992) [S3] [VERIFIED-PRIMARY, PDF text]**
> "The key empirical result of DENDRAL experiments became known as the knowledge-is-power hypothesis (later called the Knowledge Principle), stating that knowledge of the specific task domain in which the program is to do its problem solving was more important as a source of power for competent problem solving than the reasoning method employed."

**Q9. Feigenbaum, same [S3] [VERIFIED-PRIMARY]**
> "Note, however, that although tools/shells simplify programming ESs, they do not usually help with the crucial bottleneck problem of knowledge acquisition."

**Q10. Lenat and Feigenbaum, "On the Thresholds of Knowledge," IJCAI-87, vol. 2, pp. 1173ff (also *AI Journal* 47, 1991) [S6] [VERIFIED-PRIMARY in fact-check: https://www.ijcai.org/Proceedings/87-2/Papers/122.pdf, section 2]**
> "Their reasoning components are weak; in their knowledge bases lies their power."

**UNVERIFIED, do not use as a quote:** "In the knowledge lies the power" and "Knowledge is power" as a Feigenbaum coinage. These are paraphrases. Bacon's phrase is much older.

**Q11. Lenat, Prakash and Shepherd, *AI Magazine* 6(4), Winter 1985, p. 65 [S35] [VERIFIED-PRIMARY, OCR]**
> "MCC's CYC project is the building, over the coming decade, of a large knowledge base (or KB) of real world facts and heuristics and—as a part of the KB itself—methods for efficiently reasoning over the KB."

**Q12. Same paper, "Underlying Assumptions" [S35] [VERIFIED-PRIMARY]**
> "To build CYC, we must encode all the world's knowledge down to some level of detail; there is no way to finesse this. Fifteenth century explorers couldn't discover new lands without long voyages."

**Q13. Same paper [S35] [VERIFIED-PRIMARY]**
> "For this reason, simply having an online version of an encyclopedia would be of little use, as there is practically nothing that current AI technology could draw from the raw text. Rather, we must carefully re-represent the encyclopedia's knowledge—by hand—into some more structured form."

**Q14. Same paper [S35] [VERIFIED-PRIMARY]**
> "It is at once an extremely humble and an extremely brash hypothesis."

**Q15. Rodney Brooks, "Elephants Don't Play Chess," *Robotics and Autonomous Systems* 6 (1990) 3-15 [S50] [VERIFIED-PRIMARY]**
> "The key observation is that the world is its own best model. It is always exactly up to date. It always contains every detail there is to be known. The trick is to sense it appropriately and often enough."

**Q16. Brooks, same, §5.3 "But It Can't Do X" [S50] [VERIFIED-PRIMARY]**
> "Likewise it is unfair to claim that an elephant has no intelligence worth studying just because it does not play chess."

**Q17. Brooks, "Intelligence without representation," *Artificial Intelligence* 47 (1991) 139-159 (received September 1987) [S51] [VERIFIED-PRIMARY]**
> "(C) When we examine very simple level intelligence we find that explicit representations and models of the world simply get in the way. It turns out to be better to use the world as its own model.
> (H) Representation is the wrong unit of abstraction in building the bulkiest parts of intelligent systems."

**Q18. Brooks, same, abstract [S51] [VERIFIED-PRIMARY]**
> "Artificial intelligence research has foundered on the issue of representation."

**Q19. Hubert Dreyfus, *What Computers Can't Do* (Harper & Row, 1972), p. 12, as transcribed by Quote Investigator [S46] [SECONDARY transcription of the primary text]**
> "...the first man to climb a tree could claim tangible progress toward reaching the moon."

Context: rebutting Feigenbaum and Feldman's definition of AI progress. Dreyfus continues: "Rather than climbing blindly, it is better to look where one is going" [S46].

**Q20. Dreyfus, *What Computers Can't Do* (1972; text reprinted in the 1992 MIT Press edition, Part I introduction) [VERIFIED-PRIMARY in fact-check via the Internet Archive scan of the 1992 edition]. CORRECTED: the dossier had "recurrent pattern" and attributed the line to the 1965 RAND paper.**
> "...the field of artificial intelligence exhibits a recurring pattern: early, dramatic success followed by sudden unexpected difficulties."

(The 1965 RAND paper's own wording was not checked: **UNVERIFIED — do not use as a quote from "Alchemy and AI"**.)

**Q21. Dreyfus, *What Computers Still Can't Do* (MIT Press, 1992), Introduction to the MIT Press edition, p. ix [S44] [VERIFIED-PRIMARY in fact-check via the Internet Archive scan: https://archive.org/details/dreyfus-what-computers-still-cant-do-a-critique-of-artificial-reason]**
> "Indeed, what John Haugeland has called Good Old-Fashioned AI (GOFAI) is a paradigm case of what philosophers of science call a degenerating research program."

Also from the same introduction (verified in the scan; the page is not pinned): "The triumphant arrival of the neural-net revolutionaries, also called connectionists, completed the degeneration of the GOFAI research program." (Note the hyphen in "neural-net".)

**Q22. John McCarthy, review of *What Computers Still Can't Do* (*Artificial Intelligence* 80, 1996; web version) [S45] [VERIFIED-PRIMARY]**
> "Hubert Dreyfus claims that ``symbolic AI'' is a ``degenerating research program'', i.e. is not making progress. It's hard to see how he would know, since he makes no claim to have read much of the recent literature."

And: "it isn't a crossroads but a race including logic based AI, SOAR, connectionism and several other contenders" [S45].

**Q23. Joseph Weizenbaum, "The Computer in Your Future," *NYRB*, 27 Oct 1983 [S22] [VERIFIED via fetched page]**
> "That ambition remains as absurd today as it was twenty-five years ago."

Context (CORRECTED in fact-check): "That ambition" is Herbert Simon and Allen Newell's 1958 forecast that the problems machines could handle would become coextensive with those the human mind had tackled. Weizenbaum links that forecast to the claims made for the Fifth Generation. Do not narrate it as his verdict on "the Japanese ambition" itself. The other line, "The computer has long been a solution looking for problems—the ultimate technological fix", is about computers in **schools**, not about the Fifth Generation [S22].

**Q24. Kazuhiro Fuchi, keynote at FGCS'92, Tokyo, June 1992, as quoted in the UT retrospective [S18] [SECONDARY]**
> "Although this project is about to end, the end is just another starting point."

**Q25. Schwartz on expert systems, "clever programming," and McCorduck's "deeply and brutally" [S2] [SECONDARY via Wikipedia summarising McCorduck 2004, pp. 430-431]**
Use only as attributed paraphrase ("McCorduck writes that Schwartz cut AI funding 'deeply and brutally'"), not as Schwartz's words.

**UNVERIFIED, do not use as quotes:**
- Any line attributed to **Marvin Minsky** "at the 1984 AAAI panel". He was not on the published panel (see §8).
- "More important than the atom bomb", attributed to Jasper Lupo (DARPA, 1988). The phrase is attested (SIGCSE '89 abstract: "Neural networks have been called 'more important than the atomic bomb'") [S73-lead], but the speaker is not.
- "An entire industry worth half a billion dollars was replaced in a single year" is **Crevier's** sentence (1993, pp. 209-210), quoted in [S2]. Usable only attributed to the historian Daniel Crevier.

---

## 7. Debates and controversies

**7.1 Were expert systems a failure? [CONTESTED]**
- *Failure:* they were brittle and costly to maintain, and the Lisp-machine and expert-system industries crashed in 1987-1990 [S2][S42]. Schank in 1984 already doubted them [S1]. Dreyfus said rule-based expertise was a "degenerating research program" [S44].
- *Success:* XCON ran at DEC for well over a decade (McDermott's 1993 retrospective is titled "R1 ('XCON') at age 12") [S13]. Feigenbaum (c. 1992) reported that typical systems had 10^2-10^3 rules and many had 10^4 [S3]. Rule engines survive inside banking, insurance and configuration software. The technology was absorbed into ordinary software and stopped being called "AI" [S2].
- *Film framing:* both. The commercial bubble burst, but the technique survived in narrower roles.

**7.2 How much did XCON save? [CONTESTED]** $15M (Sviokla, MISQ 1990 abstract) [S14]; $25M/year (Wikipedia XCON) [S10]; $40M over six years (Wikipedia AI winter, from Newquist/Crevier) [S2]. Use "tens of millions of dollars".

**7.3 Was the Fifth Generation project a failure? [CONTESTED]**
- *Failure:* the *Washington Post* and *NYT* (June 1992) called it a project with little market impact, Japan's "Lost Generation" [S19][S20]. Critics said the custom hardware and languages were closed and quickly outpaced by commodity chips [S18].
- *Success:* the IPSJ calls PIM "the world's fastest and largest computer oriented toward knowledge information processing" [S16]. The project trained a generation of Japanese engineers, released its software free, and was a research (not product) programme by Fuchi's own account [S18].
- *Western over-reaction:* Unger (1987) and Weizenbaum (1983) argued that the US panic misread Japan [S22][S59].

**7.4 Dreyfus vs. the AI establishment.**
- Dreyfus: rules cannot capture expertise. AI is alchemy and tree-climbing [S46][S47].
- MIT response: Papert's 1968 rebuttal ("The Artificial Intelligence of Hubert L. Dreyfus: A Budget of Fallacies") and the 1967 chess game Dreyfus lost to Mac Hack [S47][S49].
- McCarthy (1996): Dreyfus ignored progress in nonmonotonic logic, "about 1,000 papers he doesn't know about" [S45].
- Hindsight: Dreyfus's critique of hand-coded rules looks prescient, and he himself welcomed the connectionists in 1992 [S44]. But his stronger claims about embodiment and the limits of computers are still debated. Do not present him as simply "proved right."

**7.5 Brooks vs. representation.**
- Brooks: build from the bottom up, with no central world model [S50][S51].
- Critics (summarised in Brooks's own §5.3) say such systems "can't do X", for example plan, reason or use language. Brooks's answer is the elephant line [S50]. His approach succeeded commercially (iRobot, 1990) [S52]. Whether it scales to human-level cognition remained open.

**7.6 Who coined "AI winter"? [CONTESTED]**
- The AAAI-84 transcript has Drew McDermott saying the condition was "called the 'AI Winter' by some", so the term predates his remark [S1].
- Wikipedia says the term "first appeared in 1984 as the topic of a public debate at the annual meeting of AAAI" and credits Schank and Minsky with the warning (citing Crevier 1993, p. 203) [S2].
- The panel transcript does **not** list Minsky as a panelist [S1].
- Safe wording: "By 1984 AI researchers were already worrying aloud about an 'AI winter', a phrase that echoed the 'nuclear winter' then in the news."

**7.7 Did the backprop revival "fail" in the 1990s? [CONTESTED framing]**
- *Cooling:* vanishing gradients [S53][S54], small data, slow compute, and the SVM wave [S62].
- *Continuity:* successful deployments such as ALVINN [S55] and LeCun's digit readers, plus steady research in Toronto, Montréal and Munich. The PDP-era cognitive debates also continued.
- Not a "winter" for every lab. Call it a shift of fashion and funding.

---

## 8. Misconceptions to avoid

1. **"Minsky and Schank warned of an AI winter on a 1984 AAAI panel."** The published panel was Drew McDermott, Mitch Waldrop, Roger Schank, B. Chandrasekaran and John McDermott, with DARPA's Ron Ohlander introduced as a speaker. Minsky is mentioned only by Waldrop, as a fellow participant at an Isaac Asimov seminar in New York state earlier that week [S1]. Minsky's 1984 warning comes from Crevier's book as summarised by Wikipedia [S2], not from this transcript. The task brief for this dossier repeats the Wikipedia version. Do not put Minsky on the panel stage.
2. **"Drew McDermott coined 'AI winter' at the panel."** He said it was "called the 'AI Winter' by some" [S1].
3. **Drew McDermott and John McDermott are the same person.** They are not. Drew was at Yale and chaired the panel. John was at CMU and wrote R1/XCON. Both were on the panel [S1].
4. **"MYCIN was better than doctors and was used in hospitals."** It outscored the faculty specialists on one ten-case antimicrobial test [S8]. It was never used in routine practice [S9].
5. **"XCON had 2,500 rules."** The rule count changed over time: 500 (1980), 3,300 (1983), 6,200 (1987), and more than 10,000 later [S11][S15][S10].
6. **"The Fifth Generation project was about neural networks."** It was about logic programming and parallel inference (Prolog/KL1). A Japanese newspaper criticised it for *missing* neural networks [S18].
7. **"Cyc failed and was abandoned in the 1990s."** It spun into Cycorp in 1995 and was still being developed decades later [S36][S38]. Its *original* ten-year plan was not met.
8. **"The second winter killed all AI research."** Funding and hype fell, especially for Lisp hardware and expert-system start-ups. Research continued under other names (machine learning, intelligent systems, knowledge-based systems).
9. **"Symbolics went bankrupt in 1987."** LMI went bankrupt in 1987 [S41]. Symbolics filed in the early 1990s and was listed defunct in 1996 [S40] **[CONTESTED dates]**.
10. **"ALVINN drove across America."** That was RALPH in 1995 (see the sibling dossier).
11. **"Brooks said robots don't need any representation at all."** His claim (H) is that representation is "the wrong unit of abstraction in building the bulkiest parts of intelligent systems" [S51]. It is narrower than "no representation ever."
12. **"Dreyfus said computers could never play chess."** After losing to Mac Hack he complained that he had not said that [S49] **[SECONDARY]**.
13. **"The Strategic Computing Initiative was Star Wars."** SCI (1983) and the Strategic Defense Initiative (SDI, also 1983) were different programmes. Both drove defence AI spending [S24][S40].
14. **Treating Japan as a villain or caricature.** The Fifth Generation panic was partly a Western projection [S59]. Depict ICOT as researchers in a Tokyo institute, not as a menace.

---

## 9. Curiosity hooks

1. **The man who wrote XCON sat on the doom panel.** John McDermott, author of the most successful expert system, was on the 1984 "Dark Ages of AI" panel, and he was the panelist least worried about a backlash [S1].
2. **"AI winter" was a nuclear joke.** Drew McDermott said the phrase prompted someone to ask whether "nuclear winter" meant cutting off funding for nuclear weapons [S1]. "Nuclear winter" was a fresh coinage in 1983-84 *(TTAPS study, 1983; check before use)*.
3. **A computer out-prescribed Stanford professors and was never used.** MYCIN scored 65% acceptable against the faculty's 42.5-62.5% in a blinded test [S8], yet it never entered routine clinical use [S9].
4. **Cyc's founders dismissed raw text.** In 1985 Lenat wrote that an online encyclopedia "would be of little use, as there is practically nothing that current AI technology could draw from the raw text" [S35]. His plan instead was "about 150 man-years" of hand-entry at a paragraph a day [S35].
5. **The first .com was an AI company.** symbolics.com, registered 15 March 1985, was the first .com domain. Symbolics built the Lisp machines whose market collapsed two years later [S40].
6. **A robot that stole soda cans.** Brooks's Herbert wandered MIT offices to "steal empty soda cans from their desks" with 24 tiny 8-bit processors and no central world model [S50].
7. **An elephant walked into an AI debate.** Brooks's title answers the chess-obsessed tradition: "it is unfair to claim that an elephant has no intelligence worth studying just because it does not play chess" [S50].
8. **A philosopher lost to a chess program, and the ACM made it a headline.** "A Ten Year Old Can Beat the Machine— Dreyfus: But the Machine Can Beat Dreyfus" [S49] **[SECONDARY]**.
9. **Brooks's manifesto waited four years.** "Intelligence without representation" was received in September 1987 and published in 1991 [S51].
10. **XCON's rules kept churning.** About half of its 6,200 rules changed every year by 1987 [S15]. It was knowledge that would not stay written down.
11. **As expert systems crashed, DARPA turned to neural nets.** Its 1987-88 Neural Network Study, directed by Bernard Widrow (of ADALINE fame), led to a neural-network programme in 1989 [S73].

---

## 10. Visual and dramatic details

- **Austin, Texas, August 1984 (AAAI-84).** A conference hall with a panel table of five or six men and microphones. Chandrasekaran mentioned "the hard sunshine that we have been having in Austin recently" [S1]: glaring summer light, cicada heat. In the hall, "commercial hustle and bustle" [S1]: vendor booths, Lisp machines on display. Schank called it a "show for all the venture capitalists" [S1]. Silhouette staging could show a bright exhibition floor outside and a dim panel room inside where people talk of winter.
- **A Lisp machine at a desk.** A tall cabinet humming beside a desk, a large monochrome bitmap screen with windows and a mouse, and a keyboard with extra modifier keys *(check model-specific details)*. When the market dies in 1987, the screens go dark one by one while slim Sun pizza-box workstations and beige PCs take their places.
- **Stanford, 1970s, MYCIN.** A clinician at a time-sharing terminal answering question after question about a patient, with the printout scrolling. The program can be asked "WHY?" *(check terminal type)*.
- **DEC's VAX room.** Rows of refrigerator-sized cabinets, cable runs and a parts list as long as a scroll. XCON as a hand sorting thousands of parts into a working machine.
- **Tokyo, ICOT, 1982-1992.** An office floor of young engineers (about 100 per [S18]). Racks of parallel inference machines (PIM/p with 512 processors) that are now museum exhibits in Tokyo [S16]. The final conference in June 1992 took place in a hotel ballroom (Washington Post via search summary [S19]) **[SECONDARY]**.
- **Austin, MCC, 1984.** 9430 Research Boulevard [S35]. "Cyclists" at Lisp machines typing out what children know: "an object can't be in two places at once" [S35]. The visual metaphor is a one-volume desk encyclopedia being disassembled into thousands of tiny cards, while Lenat's image of "Fifteenth century explorers" on "long voyages" plays as paper-cut ships on a sea of index cards [S35].
- **DARPA's Autonomous Land Vehicle.** "Huge, slow, and painted white" [S26]. A big boxy vehicle crawling along a road with a sensor pod, set against Colorado foothills *(check location)*.
- **MIT AI Lab, late 1980s.** Small robots on a lab floor: Genghis (1 kg, six legs, whiskers) climbing over books; Herbert rolling into an office to lift a soda can [S50]. Ideal paper-cut insects.
- **Berkeley.** Dreyfus lecturing, chalkboard, Heidegger on the desk. The tree-and-moon image is ready-made for silhouette art: a man inching up a tree toward a huge moon [S46].
- **The "winter" itself.** Frost spreading across a shelf of Lisp-machine manuals and expert-system shells. Funding streams as rivers freezing over. Then a warmer thread in the corner: a small neural net (ALVINN) learning to steer a van down a leafy path [S55], foreshadowing what comes next.

---

## 11. Sources

1. [S1] McDermott, D., Waldrop, M. M., Schank, R., Chandrasekaran, B., McDermott, J. (1985). "The Dark Ages of AI: A Panel Discussion at AAAI-84." *AI Magazine* 6(3):122-134. https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/494 · PDF: https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/download/494/430 · DOI https://doi.org/10.1609/aimag.v6i3.494
2. [S2] Wikipedia, "AI winter" (summarising Crevier 1993, Newquist 1994, McCorduck 2004, Russell and Norvig 2003). https://en.wikipedia.org/wiki/AI_winter
3. [S3] Feigenbaum, E. A. "Expert Systems: Principles and Practice" (adapted for *The Encyclopedia of Computer Science and Engineering*, 1992). https://imarcai.com/wp-content/uploads/2019/04/Feigenbaum-EXPERT-SYSTEMS-PRINCIPLES-AND-PRACTICE.pdf
4. [S4] Wikipedia, "Edward Feigenbaum." https://en.wikipedia.org/wiki/Edward_Feigenbaum · ACM Turing Award page: https://amturing.acm.org/award_winners/feigenbaum_4167235.cfm
5. [S5] Feigenbaum, E. A. (1977). "The Art of Artificial Intelligence: I. Themes and Case Studies of Knowledge Engineering." Stanford HPP-77-25 / IJCAI-77. https://apps.dtic.mil/sti/tr/pdf/ADA046289.pdf
6. [S6] Lenat, D. B. and Feigenbaum, E. A. "On the Thresholds of Knowledge." IJCAI 1987; *Artificial Intelligence* 47 (1991). https://www.researchgate.net/publication/220814724_On_the_Thresholds_of_Knowledge
7. [S7] Yu, V. L. et al. (1979). "Antimicrobial Selection by a Computer: A Blinded Evaluation by Infectious Diseases Experts." *JAMA* 242(12):1279-1282. https://doi.org/10.1001/jama.1979.03300120033020 · https://jamanetwork.com/HttpHandlers/ArticlePdfHandler.ashx?journal=JAMA&articleId=366606&pdfFileName=jama_242_12_020.pdf
8. [S8] Buchanan, B. G. and Shortliffe, E. H., eds. (1984). *Rule-Based Expert Systems*, Chapter 31, "An Evaluation of MYCIN's Advice." https://people.dbmi.columbia.edu/shortliffe/Buchanan-Shortliffe-1984/Chapter-31.pdf
9. [S9] Wikipedia, "Mycin." https://en.wikipedia.org/wiki/Mycin
10. [S10] Wikipedia, "Xcon." https://en.wikipedia.org/wiki/Xcon · Charles Forgy (10,000+ rules): https://en.wikipedia.org/wiki/Charles_Forgy
11. [S11] Bachant, J. and McDermott, J. (1984). "R1 Revisited: Four Years in the Trenches." *AI Magazine* 5(3):21-32. https://ojs.aaai.org/index.php/aimagazine/article/view/445
12. [S12] McDermott, J. (1980). "R1: A Rule-Based Configurer of Computer Systems." CMU tech report (DTIC). https://apps.dtic.mil/sti/tr/pdf/ADA223957.pdf (772-rule figure as reported by search summary; marked lead)
13. [S13] McDermott, J. (1993). "R1 ('XCON') at age 12: lessons from an elementary school achiever." *Artificial Intelligence* 59:241-247. https://www.sciencedirect.com/science/article/abs/pii/000437029390192E
14. [S14] Sviokla, J. J. (1990). "An Examination of the Impact of Expert Systems on the Firm: The Case of XCON." *MIS Quarterly* 14(2):127-140. https://aisel.aisnet.org/misq/vol14/iss2/1/
15. [S15] Soloway, E., Bachant, J., Jensen, K. (1987). "Assessing the maintainability of XCON-in-RIME." AAAI-87. https://dl.acm.org/doi/abs/10.5555/1856740.1856819
16. [S16] IPSJ Computer Museum, "Start of the 5th Generation Computer Project." https://museum.ipsj.or.jp/en/computer/other/0002.html
17. [S17] IPSJ Computer Museum, "Fuchi Kazuhiro." https://museum.ipsj.or.jp/en/pioneer/fuchi.html
18. [S18] "A Retrospective and Prospects of the Fifth Generation Computer Project" (UT Austin repository). https://repositories.lib.utexas.edu/items/d920916f-8ed3-4a10-94a8-ff75f037b160
19. [S19] *Washington Post*, 2 June 1992, "Japanese Government Ends Development of Computer." https://www.washingtonpost.com/archive/business/1992/06/02/japanese-government-ends-development-of-computer/97184ba9-7177-4516-82f9-d684aecd1f24/ (paywalled; content via search summary)
20. [S20] Pollack, A. "'Fifth Generation' Became Japan's Lost Generation." *New York Times*, 5 June 1992. Cited in https://dl.acm.org/doi/10.5555/3447065.3447072 · discussion/link: https://news.ycombinator.com/item?id=16630174
21. [S21] Feigenbaum, E. A. and McCorduck, P. (1983). *The Fifth Generation: Artificial Intelligence and Japan's Computer Challenge to the World*. Addison-Wesley. https://archive.org/details/fifthgenerationa0000feig
22. [S22] Weizenbaum, J. "The Computer in Your Future." *New York Review of Books*, 27 Oct 1983. https://www.nybooks.com/articles/1983/10/27/the-computer-in-your-future/
23. [S23] "'Computers in Your Future'" (exchange), *NYRB*, 8 Dec 1983. https://www.nybooks.com/articles/1983/12/08/computers-in-your-future/
24. [S24] Wikipedia, "Strategic Computing Initiative." https://en.wikipedia.org/wiki/Strategic_Computing_Initiative · Paleofuture: https://paleofuture.com/blog/2013/4/30/darpa-spent-1-billion-trying-to-build-a-real-life-skynet-in-the-1980s
25. [S25] Stefik, M. (1985). "Strategic Computing at DARPA: Overview and Assessment." *CACM* 28(7). https://dl.acm.org/doi/pdf/10.1145/3894.3896
26. [S26] Review of Roland, A. and Shiman, P., *Strategic Computing: DARPA and the Quest for Machine Intelligence, 1983-1993* (MIT Press, 2002). Project MUSE. https://muse.jhu.edu/article/44248/summary
27. [S27] FreakTakes, "The Autonomous Land Vehicle, Pilot's Associate, and Battle Management" (lead). https://www.freaktakes.com/p/the-autonomous-land-vehicle-pilots
28. [S28] Wikipedia, "Alvey Programme." https://en.wikipedia.org/wiki/Alvey_Programme
29. [S29] Hansard, House of Lords, 18 Jan 1984, "Information Technology: The Alvey Report." https://api.parliament.uk/historic-hansard/lords/1984/jan/18/information-technology-the-alvey-report
30. [S30] House of Lords Select Committee on AI (2018), *AI in the UK: ready, willing and able?* https://publications.parliament.uk/pa/ld201719/ldselect/ldai/100/10018.htm
31. [S31] Manchester Policy Blog (2018), "To Every Thing There is a Season: lessons from the Alvey Programme." https://blog.policy.manchester.ac.uk/posts/2018/05/to-every-thing-there-is-a-season-lessons-from-the-alvey-programme-for-creating-an-innovation-ecosystem-for-artificial-intelligence/
32. [S32] Oakley, B. and Owen, K. (1989). *Alvey: Britain's Strategic Computing Initiative*. MIT Press. https://mitpress.mit.edu/9780262150385/alvey/
33. [S33] Wikipedia, "Microelectronics and Computer Technology Corporation." https://en.wikipedia.org/wiki/Microelectronics_and_Computer_Technology_Corporation
34. [S34] *Austin American-Statesman* (2013), "30 years ago, MCC consortium helped 'put Austin on the technology map'." https://www.statesman.com/story/business/2013/05/25/plugged-in-30-years-ago-mcc-consortium-helped-put-austin-on-the-technology-map/10072723007/
35. [S35] Lenat, D., Prakash, M., Shepherd, M. (1985). "CYC: Using Common Sense Knowledge to Overcome Brittleness and Knowledge Acquisition Bottlenecks." *AI Magazine* 6(4):65-85. https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/510 · PDF: https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/download/510/446
36. [S36] Wikipedia, "Cyc." https://en.wikipedia.org/wiki/Cyc
37. [S37] Leslie, M. (2002). "Wise Up, Dumb Machine." *Stanford Magazine*. https://stanfordmag.org/contents/wise-up-dumb-machine
38. [S38] Wikipedia, "Douglas Lenat." https://en.wikipedia.org/wiki/Douglas_Lenat
39. [S39] Guha, R. V. and Lenat, D. B. (1990). "Cyc: A Midterm Report." *AI Magazine* 11(3). https://dl.acm.org/doi/10.1609/aimag.v11i3.842
40. [S40] Wikipedia, "Symbolics." https://en.wikipedia.org/wiki/Symbolics
41. [S41] Wikipedia, "Lisp Machines" (LMI). https://en.wikipedia.org/wiki/Lisp_Machines
42. [S42] Wikipedia, "Lisp machine." https://en.wikipedia.org/wiki/Lisp_machine · Dan Luu, "History of Symbolics lisp machines": https://danluu.com/symbolics-lisp-machines/
43. [S43] Graylin, A. "Symbolics, Inc.: A failure of heterogeneous engineering" (MIT 6.933 paper). https://ocw.mit.edu/courses/6-933j-the-structure-of-engineering-revolutions-fall-2001/30eb0d06f5903c7a4256d397a92f6628_Symbolics.pdf
44. [S44] Dreyfus, H. L. (1992). *What Computers Still Can't Do: A Critique of Artificial Reason*. MIT Press. https://mitpressbookstore.mit.edu/book/9780262540674 · Strom and Darden review: https://philpapers.org/rec/DREFST (related record)
45. [S45] McCarthy, J. Review of *What Computers Still Can't Do* (*Artificial Intelligence* 80, 1996). https://www-formal.stanford.edu/jmc/reviews/dreyfus/dreyfus.html · section: https://www-formal.stanford.edu/jmc/reviews/dreyfus/node1.html
46. [S46] Quote Investigator (2024), "AI Researchers Are Trying To Reach the Moon by Climbing the Tallest Trees." https://quoteinvestigator.com/2024/04/20/moon-tree/
47. [S47] Wikipedia, "Hubert Dreyfus." https://en.wikipedia.org/wiki/Hubert_Dreyfus · "Hubert Dreyfus's views on artificial intelligence": https://en.wikipedia.org/wiki/Hubert_Dreyfus's_views_on_artificial_intelligence
48. [S48] Kelly, S. D., obituary, Daily Nous (24 Apr 2017). https://dailynous.com/2017/04/24/hubert-dreyfus-1930-2017/ · Harvard: https://philosophy.fas.harvard.edu/news/memoriam-hubert-l-dreyfus-1929-2017
49. [S49] Chess Programming Wiki, "Mac Hack." https://chessprogramming.org/Mac_Hack · Wolfram example (game date): https://resources.wolframcloud.com/ExampleRepository/resources/fe00c0dd-6f50-40bb-b549-d58a69bc5e70/
50. [S50] Brooks, R. A. (1990). "Elephants Don't Play Chess." *Robotics and Autonomous Systems* 6:3-15. https://people.csail.mit.edu/brooks/papers/elephants.pdf
51. [S51] Brooks, R. A. (1991). "Intelligence without representation." *Artificial Intelligence* 47:139-159. https://people.csail.mit.edu/brooks/papers/representation.pdf
52. [S52] Wikipedia, "Rodney Brooks." https://en.wikipedia.org/wiki/Rodney_Brooks
53. [S53] Hochreiter, S. (1991). *Untersuchungen zu dynamischen neuronalen Netzen*. Diploma thesis, TU München. https://www.researchgate.net/publication/243781690_Untersuchungen_zu_dynamischen_neuronalen_Netzen
54. [S54] Bengio, Y., Simard, P., Frasconi, P. (1994). "Learning long-term dependencies with gradient descent is difficult." *IEEE TNN* 5(2):157-166. https://dblp.org/rec/journals/tnn/BengioSF94.html · https://doi.org/10.1109/72.279181
55. [S55] Pomerleau, D. A. (1989). "ALVINN: An Autonomous Land Vehicle in a Neural Network." NIPS 1. https://papers.nips.cc/paper_files/paper/1988/file/812b4ba287f5ee0bc9d43bbf5bbe87fb-Paper.pdf
56. [S56] Mitchell, M. (2021). "Why AI is Harder Than We Think" (quotes the AAAI-84 panel). https://arxiv.org/abs/2104.12871
57. [S57] Eric Jang (2019), "Selected Quotes from 'The Dark Ages of AI Panel Discussion'" (lead). https://blog.evjang.com/2019/12/aaai84.html
58. [S58] Chikayama, T. (2006). "In Memoriam of Dr. Kazuhiro Fuchi." *Computer Software* (JSSST) 23(4). https://www.jstage.jst.go.jp/article/jssst/23/4/23_4_4_94/_article
59. [S59] Review of Unger, J. M., *The Fifth Generation Fallacy* (1987), *Computational Linguistics* 14(4), 1988. https://aclanthology.org/J88-4009.pdf
60. [S60] "The Fifth Generation in Japan and Europe" (Stanford archive; Feigenbaum papers) (lead). https://stacks.stanford.edu/file/druid:sh967vf0144/sh967vf0144.pdf · de Kleer review of *The Fifth Generation*: https://stacks.stanford.edu/file/druid:nw161wq2824/nw161wq2824.pdf
61. [S61] Wikipedia, "Roger Schank." https://en.wikipedia.org/wiki/Roger_Schank
62. [S62] Cortes, C. and Vapnik, V. (1995). "Support-Vector Networks." *Machine Learning* 20:273-297. https://link.springer.com/article/10.1007/BF00994018
63. [S63] Feigenbaum interview (ResearchGate) (lead). https://www.researchgate.net/publication/236904576_An_Interview_with_Edward_A_Feigenbaum
64. [S70] Trip report, "The Fifth Generation Project: A Trip Report," *CACM* (1983) (ICOT April 1982; FY1983 ¥2.7bn). https://dl.acm.org/doi/pdf/10.1145/358172.358179 · ICOT final evaluation archive (Waseda): https://www.ueda.info.waseda.ac.jp/AITEC_ICOT_ARCHIVES/ICOT/Museum/FinalEval/finaleval018.html
65. [S71] Haigh, T. "How the AI Boom Went Bust." *Communications of the ACM* (lead; not read: paywall/403). https://cacm.acm.org/opinion/how-the-ai-boom-went-bust/
66. [S72] Hendler, J. (2008). "Avoiding Another AI Winter." *IEEE Intelligent Systems* 23(2) (cited in [S2]). https://doi.org/10.1109/MIS.2008.20
67. [S73] *DARPA Neural Network Study Final Report* (MIT Lincoln Laboratory TR-840, ESD-TR-88-311, June 1988). https://apps.dtic.mil/sti/tr/pdf/ADA207580.pdf · AFCEA book (Internet Archive): https://archive.org/details/darpaneuralnetwo0000darp · SIGCSE '89 "Neural networks and artificial intelligence" (atomic-bomb phrase, lead): https://dl.acm.org/doi/10.1145/65294.71221

68. [S74] Wikipedia, "Jacob T. Schwartz" (DARPA/ISTO director 1986-1989). https://en.wikipedia.org/wiki/Jacob_T._Schwartz
69. [S75] Wikipedia, "Fifth Generation Computer Systems" (1982-1994; under ¥57 billion). https://en.wikipedia.org/wiki/Fifth_Generation_Computer_Systems
70. [S76] Paleofuture (Novak, M., 2013), citing Roland and Shiman: DARPA plan of 28 Oct 1983; ALV "formally cancelled ... in April of 1988". https://paleofuture.com/blog/2013/4/30/darpa-spent-1-billion-trying-to-build-a-real-life-skynet-in-the-1980s
71. [S77] Lenat, D. B. and Feigenbaum, E. A. (1987). "On the Thresholds of Knowledge." IJCAI-87. https://www.ijcai.org/Proceedings/87-2/Papers/122.pdf
72. [S78] Dreyfus, H. L. *What Computers Still Can't Do* (1992), Internet Archive scan. https://archive.org/details/dreyfus-what-computers-still-cant-do-a-critique-of-artificial-reason

---

### Verification notes (for the fact-checker)
- **OCR-verified primary texts:** [S1] full 13-page transcript, [S35] the Cyc 1985 paper, [S8] the MYCIN evaluation chapter. All were rendered and OCR'd locally with the macOS Vision framework from the publishers' scanned PDFs. Quotes were copied from the OCR output, with obvious OCR errors corrected ("Al" to "AI", "detall" to "detail", "Seldridge" left as printed). Re-check punctuation against the page images before on-screen typography.
- **Text-layer primary:** [S3], [S45], [S50] and [S51].
- **Not directly read:** the *Washington Post* and *NYT* 1992 articles (paywalled), Roland and Shiman (via review only), Crevier, Newquist and McCorduck (via Wikipedia only), and Dreyfus 1972 and 1992 (via Quote Investigator and search summaries).
- **Open items:** AAAI-84 exact dates; Symbolics bankruptcy filing date; the Symbolics 3600 console and keyboard; ALV test-site location and vehicle details; MYCIN hardware; physical descriptions of all people.


---

## Fact-check log (adversarial pass, 2026-10-05)

The fact-checker re-opened the primary sources independently. They were: Bachant and McDermott 1984 (AAAI OJS PDF, OCR); Soloway, Bachant and Jensen, AAAI-87 (https://cdn.aaai.org/AAAI/1987/AAAI87-148.pdf); the MYCIN chapter 31 and the JAMA abstract page; Feigenbaum's "Principles and Practice" PDF; the AAAI-84 panel and Cyc 1985 OCR; Brooks 1990 and 1991; Dreyfus 1992 (Internet Archive full text); McCarthy's review (www-formal.stanford.edu node1); the NYRB Weizenbaum review; IJCAI-87 "Thresholds"; Hansard 18 Jan 1984; the IPSJ museum pages; and Wikipedia (XCON, Cyc, MCC, Symbolics, Lisp Machines, SCI, FGCS, Jacob T. Schwartz, Feigenbaum, Mycin, Inman, AI winter).

**Corrections**
1. **R1/XCON language and rule history.** R1 was *begun* in December 1978 in **OPS4**, not OPS5. It had 250 rules by April 1979 and 750 by October 1979. DEC has used it since **January 1980**. A three-month OPS5 rewrite starting April 1980 cut it to 500 rules. It had 850 by the end of 1980, about 2,000 by mid-1982 and about 3,300 by November 1983. Source: Bachant and McDermott 1984, p. 3 (https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/download/445/381). "500 rules (July 1980)" as a *starting* size was misleading. The 6,200 rules with about 50% changing per year is confirmed by AAAI-87 (https://cdn.aaai.org/AAAI/1987/AAAI87-148.pdf). The FORTRAN/BASIC precursor claim is now marked UNVERIFIED.
2. **Jack Schwartz's office.** In 1986-89 the office was **ISTO**, IPTO's successor (https://en.wikipedia.org/wiki/Jacob_T._Schwartz). The year he started is CONTESTED: 1986 (his biography) vs. 1987 (https://en.wikipedia.org/wiki/AI_winter, citing McCorduck pp. 430-431, where the name is spelled "Schwarz"). The "clever programming" and "deeply and brutally" wording rests only on Wikipedia's summary of McCorduck. Keep it as attributed paraphrase.
3. **Weizenbaum's quote, Q23.** The wording is verbatim and the date (27 Oct 1983) is confirmed (https://www.nybooks.com/articles/1983/10/27/the-computer-in-your-future/). But "That ambition" refers to Simon and Newell's 1958 forecast, which he ties to Fifth Generation claims, not to "the Japanese ambition" as such. The line "solution looking for problems" is about schools. Context fixed.
4. **Dreyfus's "recurring pattern", Q20.** The verified text (the 1972 book, reprinted in 1992) reads "recurring", not "recurrent". The 1965 RAND wording could not be checked, so it is marked UNVERIFIED as a RAND quote (https://archive.org/details/dreyfus-what-computers-still-cant-do-a-critique-of-artificial-reason). The tree/moon line is confirmed in the 1972/1992 text. Quote Investigator confirms that the 1965 paper uses a different tree-and-moon wording (https://quoteinvestigator.com/2024/04/20/moon-tree/).
5. **Fifth Generation end date and budget.** This is now CONTESTED. The IPSJ gives about ¥54 billion over 11 years, 1982-1992 (https://museum.ipsj.or.jp/en/computer/other/0002.html). Wikipedia gives 1982-1994 and under ¥57 billion, counting the follow-on (https://en.wikipedia.org/wiki/Fifth_Generation_Computer_Systems). The IPSJ Fuchi page says the project "was finished in 1993", meaning the fiscal year (https://museum.ipsj.or.jp/en/pioneer/fuchi.html).
6. **Alvey start.** This is now CONTESTED. Hansard shows the government accepted the programme in April 1983 and Oakley took up his post on 1 June 1983, with £200M from government and £150M from industry (https://api.parliament.uk/historic-hansard/lords/1984/jan/18/information-technology-the-alvey-report). Wikipedia says 1984-1990 (https://en.wikipedia.org/wiki/Alvey_Programme). Keep "1983". The earlier "industry pays at least half" wording was replaced with the Hansard split.
7. **MCC end.** It "ceased operations in 2000 and was formally dissolved in 2004" (https://en.wikipedia.org/wiki/Microelectronics_and_Computer_Technology_Corporation).
8. **Hochreiter's thesis.** "15 Jun 1991" could not be confirmed; use "1991" (https://people.idsia.ch/~juergen/fundamentaldeeplearningproblem.html).
9. **MYCIN hardware.** It ran on a DEC KI10 PDP-10, written in Lisp (https://en.wikipedia.org/wiki/Mycin). The JAMA authors are Yu, Fagan, Wraith, Clancey, Scott, Hannigan, Blum, Buchanan and Cohen. Shortliffe is not among them (https://jamanetwork.com/journals/jama/article-abstract/366606).

**Upgraded to VERIFIED-PRIMARY:** Q10 (IJCAI-87, https://www.ijcai.org/Proceedings/87-2/Papers/122.pdf); Q21 and the "neural-net revolutionaries" line (the 1992 scan, p. ix; note the hyphen in "neural-net").

**Confirmed:** Feigenbaum's Knowledge Principle and knowledge-engineering text, and Q8 and Q9. MYCIN: 8 evaluators from institutions other than Stanford, 65% vs. a faculty mean of 55.5% (range 42.5-62.5%), JAMA 242(12):1279-82, 21 Sep 1979. The AAAI-84 transcript: the panelists named; Minsky is mentioned only by Waldrop, about the Asimov seminar; Q1-Q7. The Cyc 1985 quotes (Q11-Q14, 30,000 articles, 150 man-years, roughly one decade). Cyc began July 1984 and moved to Cycorp in January 1995. Brooks's Q15-Q18 ("Received September 1987"; Herbert's 24 processors and soda cans; Genghis at 1 kg). McCarthy's Q22. symbolics.com was registered 15 Mar 1985. Symbolics was incorporated 9 Apr 1980. LMI was founded in 1979 and went bankrupt in 1987. The Crevier "half a billion" sentence (via Wikipedia). Feigenbaum's biography (b. 20 Jan 1936; Teknowledge July 1981; Turing Award 1994). Fuchi's dates. The PIM/p with 512 processors and the PIM/m with 256. MCC founded late 1982 under Inman and sited in Austin in 1983. SCI ran 1983-1993 and cost about $1 billion. ALVINN had 29 hidden units. The DARPA Neural Network Study title dates are Oct 1987-Feb 1988 (Internet Archive record darpaneuralnetwo0000darp).

**Still SECONDARY or UNVERIFIED:** the ALV cancellation in April 1988 and the "huge, slow, and painted white" quote (Paleofuture blog citing Roland and Shiman; the Project MUSE review was blocked). The claim that none of the three SCI flagships was delivered in the promised form (Roland and Shiman, not re-read). Alvey's "downbeat" or disappointing commercial verdict (Manchester blog and House of Lords pages were unreachable). XCON's savings figures. Fuchi's FGCS'92 quote. The Symbolics 1988 ouster date. The DARPA neural-network programme starting in 1989.
