# Dossier: Classical Machine Learning Ascendant. Statistics, SVMs and the Quiet Holdouts (1989–2006)

Topic id: `classical-ml-era` · Film: neural-net-history · As-of: 2026-10-05
Status: draft plus targeted verification pass (about 30 searches and fetches), then an adversarial fact-check pass on 2026-10-05 (see the **Fact-check log** at the end; corrections are applied inline and marked **[FC]**). Tags used below:
- **[VERIFIED-PRIMARY]**: checked against the original paper, abstract, dataset page or the speaker's own published words.
- **[VERIFIED-SECONDARY]**: checked against a reputable secondary source such as a newspaper, an institutional history or an encyclopedia with citations.
- **[KNOWLEDGE, NEEDS CHECK]**: comes from the researcher's background knowledge and was not re-verified in this pass. Do not state it on screen until a fact-checker confirms it.
- **[UNVERIFIED]**: do not use it as fact or as a quote.

Source numbers in square brackets, e.g. [S3], refer to section 11.

---

## 1. Summary

From roughly 1995 to 2006 the centre of gravity in machine learning moved away from neural networks. It moved toward methods with **clean mathematics**: support vector machines and kernel methods, boosting, random forests and other tree ensembles, and probabilistic graphical models (Bayesian networks, hidden Markov models). It also moved toward **statistics over hand-written rules** in speech and language.

**Why researchers preferred these methods:**
- **Convex optimisation:** an SVM has a single global optimum, so the training run is guaranteed to find the best answer and there are no "local minima".
- **Theory:** Vapnik–Chervonenkis bounds and margin-based generalisation guarantees on SVMs [S1][S27]. Boosting came with provable guarantees from computational learning theory [S5].
- **Practicality:** the methods worked well on the small and medium datasets of the day, needed little tuning, and came as off-the-shelf software.

Leo Breiman's 2001 essay "Statistical Modeling: The Two Cultures" captured the moment. It put "decision trees" and "neural nets" in the same black-box "algorithmic" culture. It then said that support vector machines "have proved to be more accurate predictors in classification and regression then neural nets" [S8] (the typo "then" is in the original).

**The belief of the age** about neural nets was roughly this: hard to train, fiddly, prone to local minima, without theory, black boxes, and beaten by SVMs anyway.
- LeCun later called the late 1990s and early 2000s the **"Neural Net Winter"**. He blamed it on the prevailing attitude "that you had to have ironclad theory, and the empirical results didn't count" [S14].
- LeCun told the *Toronto Star* in 2015: "We were outcast a little bit in the broader machine learning community: we couldn't get our papers published" [S15].
- Bengio told the same paper that 2004, when CIFAR's new neural-computation program began, "was the worst possible time" [S15].
- The belief persisted, at least in computer vision, until about 2012. A convnet scene-parsing paper from LeCun's group (Farabet et al.) was rejected by CVPR that year; a letter from the authors to CVPR program chair Serge Belongie circulated, and the paper went to ICML 2012 [S30][S31]. **[FC] Contested as evidence of bias:** two deep-learning face papers were accepted at CVPR 2012, and the blogger who publicised the episode later called his post "a joke" [S31]. Do not call the letter "angry" on screen; its tone was not verified.

**What the holdouts achieved anyway:**
- **Convolutional networks at Bell Labs (Holmdel, New Jersey).**
  - LeCun et al. 1989 trained a network on 9,298 handwritten ZIP-code digits from mail passing through the Buffalo, NY post office [S10].
  - A check-reading system built on this work was "deployed commercially and reads several million cheques per day" (abstract of LeCun, Bottou, Bengio & Haffner, 1998) [S11]. **[FC]** The paper's body says it was fielded in US banks "since June 1996"; note that its introduction says "millions of checks per month" while the abstract and conclusion say "per day" [S11].
  - The 1998 paper also introduced **LeNet-5** and the **MNIST** benchmark (60,000 training and 10,000 test digits). LeNet-5 had a 0.95% test error without distortions [S12].
- **Long memory in Munich and Lugano.**
  - Sepp Hochreiter's 1991 diploma thesis at TU Munich, supervised by Jürgen Schmidhuber, analysed why error signals vanish (or explode) as they are back-propagated through time [S16][S17].
  - Hochreiter & Schmidhuber's LSTM (*Neural Computation*, Nov 1997) bridged "minimal time lags in excess of 1000 discrete-time steps" [S18].
- **Neural language models in Montréal.** Bengio, Ducharme, Vincent & Jauvin (JMLR 2003) learned a distributed vector for each word. Their model beat the best n-gram models by about 24% in test perplexity on the Brown corpus and about 8% on AP News. The AP News run took "approximately three weeks with 40 CPUs" [S19].

**Keeping the field alive.**
- In 2004 Geoffrey Hinton and collaborators persuaded the Canadian Institute for Advanced Research (CIFAR) to fund **Neural Computation and Adaptive Perception (NCAP)**. Hinton directed it from 2004 to 2013 [S20][S21].
- It gathered a small international network that included LeCun and Bengio. The three later called themselves, half-jokingly, the "so-called 'Deep Learning conspiracy'" (LeCun, *IEEE Spectrum*, February 2015) [S14].
- Schmidhuber later used the phrase pointedly in his critique of their 2015 *Nature* review [S22].
- The era ends in 2006, when Hinton and colleagues published deep-belief-net papers, and "neural nets" was rebranded "deep learning" [S15].

**The wider field's priorities.**
- **IBM's Deep Blue** beat world champion Garry Kasparov 3½–2½ in New York on 11 May 1997 [S23][S24]. It did so with brute-force search on custom chess chips. It used no learning in the neural-net sense. **[FC]** Its evaluation function was hand-designed, but the values of its parameters were "determined by analyzing thousands of master games" [S39], so do not call it purely hand-tuned.
- In speech and translation, **Frederick Jelinek's IBM group** showed that statistical models trained on data beat hand-built linguistic rules. That bred his famous, and much re-worded, quip about firing linguists [S25][S26].
- The **Netflix Prize** (2006–2009) was won by a blend of hundreds of models, mainly matrix factorisation and neighbourhood methods [S28][S29]. It was a late showcase for classical ensembles.

---

## 2. Timeline

| Date | Event | Sources |
|---|---|---|
| 1988 | Judea Pearl (UCLA) publishes *Probabilistic Reasoning in Intelligent Systems: Networks of Plausible Inference* (Morgan Kaufmann, San Mateo; xix + 552 pp.). It is the canonical text that consolidated Bayesian networks and belief propagation as a field. **[FC] Corrected:** it did not found them; Pearl coined the term "Bayesian network" in a 1985 paper, and his belief-propagation work began in 1982. [VERIFIED-SECONDARY] | [S2][S3][S47] |
| 1988 | Yann LeCun joins Larry Jackel's Adaptive Systems Research Department at AT&T Bell Laboratories, Holmdel, NJ. [VERIFIED-SECONDARY; **[FC]** the month "October" was not confirmed, so give the year only] | [S13] |
| Dec 1988 (by Jelinek's own later account; others say 1985) | Jelinek makes the "fire a linguist" remark at a workshop in Wayne, Pennsylvania. Wording and date are contested; see section 6. | [S25][S26] |
| Dec 1989 | LeCun, Boser, Denker, Henderson, Howard, Hubbard & Jackel (all AT&T Bell Laboratories, Holmdel), "Backpropagation Applied to Handwritten Zip Code Recognition", *Neural Computation* 1(4):541–551. 9,298 digits from Buffalo NY mail: 7,291 for training, 2,007 for testing. Test error 5.0% (102 mistakes); 12.1% of test digits had to be rejected to reach 1% error. Run on a SUN-4/260 with the SN simulator. **[FC] VERIFIED-PRIMARY** (paper text and Crossref) | [S10][S13] |
| June 1990 | Brown, Cocke, Della Pietra, Della Pietra, Jelinek, Lafferty, Mercer & Roossin (IBM Yorktown Heights), "A Statistical Approach to Machine Translation", *Computational Linguistics* 16(2):79–85. [VERIFIED-PRIMARY: ACL Anthology] | [S32] |
| End of 1990 (BBVA biography says 1991) | Vladimir Vapnik leaves the Institute of Control Sciences, Moscow, for Bell Labs Holmdel. [VERIFIED-SECONDARY] | [S27] |
| 1991 | Sepp Hochreiter's diploma thesis, "Untersuchungen zu dynamischen neuronalen Netzen" (TU München; advisor J. Schmidhuber), in German. It analyses vanishing and exploding gradients. [VERIFIED-SECONDARY] | [S16][S17] |
| July 1992 | Boser, Guyon & Vapnik, "A training algorithm for optimal margin classifiers" (COLT '92, Pittsburgh, pp. 144–152), which brings the "kernel trick" into maximum-margin classifiers. **[FC] VERIFIED-PRIMARY metadata (Crossref)**; the listed affiliations are Boser at UC Berkeley, Guyon at AT&T Bell Labs San Francisco and Vapnik at AT&T Bell Labs Holmdel. | [S33] |
| 1993 | Brown, Della Pietra, Della Pietra & Mercer, "The Mathematics of Statistical Machine Translation: Parameter Estimation", *Computational Linguistics* 19(2):263–311 (the "IBM Models 1–5"), trained on Canadian parliamentary Hansards. [VERIFIED-PRIMARY] | [S34] |
| 1993 | LeCun's "LeNet 1" real-time demo is filmed: a DSP card inside a 486 PC, with a video camera and frame grabber. Footage later restored from VHS. [VERIFIED-SECONDARY] | [S13] |
| 1994 | Bengio, Simard & Frasconi, "Learning long-term dependencies with gradient descent is difficult", *IEEE Trans. Neural Networks* 5(2):157–166. An independent analysis of the vanishing-gradient problem. [VERIFIED-SECONDARY] | [S17] |
| 1994 | IBM's Candide French-to-English statistical MT system is described at the ARPA HLT workshop. [VERIFIED-PRIMARY] | [S35] |
| 13–15 Mar 1995 | Freund & Schapire present AdaBoost in its preliminary form at EuroCOLT '95, Barcelona (LNCS 904, pp. 23–37). [VERIFIED-SECONDARY] | [S5] |
| 14 Mar 1995 | The Bell Labs **Jackel–Vapnik bet**, signed by Vapnik and Jackel, "Witnessed by Y. LeCun". Each signature is dated 3/14/95. **[FC] VERIFIED-PRIMARY** (image of the signed document) | [S36][S37] |
| Sept 1995 | Cortes & Vapnik, "Support-Vector Networks", *Machine Learning* 20(3):273–297 (soft-margin SVM). [VERIFIED-PRIMARY metadata via Crossref] | [S1] |
| 1995 | Vapnik, *The Nature of Statistical Learning Theory* (Springer). [VERIFIED-SECONDARY] | [S27] |
| Feb 1996 | Kasparov beats Deep Blue 4–2 in Philadelphia. [VERIFIED-SECONDARY] | [S23][S24] |
| June 1996 | The check reader, integrated into NCR's line of check-reading systems, "has been fielded in several banks across the US since June 1996" (LeCun et al. 1998, §X). **[FC] VERIFIED-PRIMARY** | [S11] |
| 3–11 May 1997 | Deep Blue beats Kasparov 3½–2½ at the Equitable Center, New York. Game 6 is lost by Kasparov in 19 moves on 11 May. [VERIFIED-SECONDARY] | [S23][S24][S39] |
| Aug 1997 | Freund & Schapire, "A decision-theoretic generalization of on-line learning and an application to boosting", *J. Computer and System Sciences* 55(1):119–139. [VERIFIED-SECONDARY] | [S5] |
| Nov 1997 | Hochreiter & Schmidhuber, "Long Short-Term Memory", *Neural Computation* 9(8):1735–1780 (Crossref issue date 1 Nov 1997). **[FC] VERIFIED-PRIMARY metadata and abstract (Crossref)** | [S18] |
| Nov 1998 | LeCun, Bottou, Bengio & Haffner, "Gradient-Based Learning Applied to Document Recognition", *Proc. IEEE* 86(11):2278–2324. LeNet-5, MNIST, graph transformer networks, the commercial check reader. [VERIFIED-PRIMARY: abstract] | [S11][S12] |
| Nov–Dec 2000 | Bengio, Ducharme & Vincent present "A Neural Probabilistic Language Model" at NIPS 13 (proceedings 2001). [VERIFIED-SECONDARY] | [S19] |
| 2001 | Breiman, "Random Forests", *Machine Learning* 45:5–32. [VERIFIED-PRIMARY header] | [S7] |
| Aug 2001 | Breiman, "Statistical Modeling: The Two Cultures", *Statistical Science* 16(3):199–231, with comments and rejoinder. [VERIFIED-PRIMARY] | [S8] |
| Dec 2001 | Viola & Jones, "Rapid object detection using a boosted cascade of simple features", CVPR 2001 (Kauai), vol. 1, pp. I-511–I-518, shows boosting running in real time. **[FC] VERIFIED (Crossref metadata)** | [S40] |
| 2002 | Vapnik leaves AT&T for NEC Laboratories, Princeton. [VERIFIED-SECONDARY] | [S27] |
| Feb 2003 | Bengio, Ducharme, Vincent & Jauvin, JMLR 3:1137–1155. [VERIFIED-PRIMARY] | [S19] |
| 2003 | Freund & Schapire receive the Gödel Prize for AdaBoost. LeCun becomes a professor at NYU. [VERIFIED-SECONDARY] | [S5][S14] |
| 2004 | CIFAR launches **Neural Computation and Adaptive Perception (NCAP)**, proposed by Hinton, Bengio, David Fleet and others. Hinton is director from 2004 to 2013. [VERIFIED-PRIMARY: CIFAR, Hinton bio] | [S20][S21] |
| 2004 (LREC, Lisbon) | Jelinek receives the first Antonio Zampolli Prize. His talk "Some of My Best Friends Are Linguists" is published in *Language Resources and Evaluation* 39(1):25–34 in February 2005. [VERIFIED-SECONDARY] | [S25][S26] |
| 2005 | First NCAP summer school. [VERIFIED-SECONDARY] | [S21] |
| 2006 | Hinton, Osindero & Teh, "A fast learning algorithm for deep belief nets", *Neural Computation* 18(7):1527–1554 (July 2006). Hinton & Salakhutdinov, "Reducing the Dimensionality of Data with Neural Networks", *Science* 313(5786):504–507 (28 July 2006). "Deep learning" rebrand. **[FC] Citation details VERIFIED (Crossref).** Note: the *Toronto Star* credits both 2006 papers to "Hinton and a PhD student, Ruslan Salakhutdinov", which is wrong for the Osindero–Teh paper; do not repeat it. | [S15][S48] |
| 2 Oct 2006 | Netflix Prize competition begins: $1M for a 10% improvement over Cinematch. **[FC] VERIFIED-SECONDARY** ("The competition began on October 2, 2006") | [S28][S49] |
| 21 Sept 2009 | BellKor's Pragmatic Chaos is awarded the Netflix Prize at a ceremony; Netflix had named the winner on 18 Sept 2009. It tied The Ensemble at 10.06% (test RMSE 0.8567) on the hidden test set and won by submitting about 20 minutes earlier. [VERIFIED-SECONDARY] | [S28][S29][S49] |
| 2012 | CVPR rejects the Farabet, Couprie, Najman & LeCun convnet scene-parsing paper ("Scene Parsing with Multiscale Feature Learning, Purity Trees, and Optimal Covers"). A letter to PC chair Serge Belongie circulates, and the paper is accepted at ICML 2012. [VERIFIED-SECONDARY]. **[FC] Contested** as proof of an anti-neural-net bias (see §7.5). | [S30][S31] |
| Feb 2015 | LeCun, in *IEEE Spectrum*, names the "so-called 'Deep Learning conspiracy'". [VERIFIED-PRIMARY] | [S14] |
| 17 Apr 2015 | Kate Allen, *Toronto Star*, profile of Hinton with the Bengio and LeCun quotes on CIFAR. [VERIFIED-PRIMARY] | [S15] |
| June 2015 | Schmidhuber's critique "Paper by 'Deep Learning Conspiracy' in Nature". [VERIFIED-PRIMARY] | [S22] |

---

## 3. People

> Physical descriptions are for respectful silhouette depiction. They come from widely circulated photographs and portraits and are approximate. The art department should confirm them against a dated photo reference for the right decade. Do not caricature.

**Vladimir Naumovich Vapnik** (born 6 Dec 1936, Tashkent) [S27]
- **Career:** at the Institute of Control Sciences, Moscow, from 1961 to 1990; there, with Alexey Chervonenkis, he developed VC theory and structural risk minimisation. At AT&T Bell Labs, Holmdel, NJ, from the end of 1990 to 2002 (Adaptive Systems Research Dept). Then NEC Labs Princeton, Royal Holloway and Columbia.
- **Belief:** learning should rest on rigorous theorems about generalisation. He was sceptical of neural nets as theoretically unprincipled. He bet in 1995 that by 2005 nobody would be using them [S36].
- **Silhouette:** in the 1990s, middle-aged, stocky, broad-shouldered, a high forehead with receding grey hair, sometimes glasses. Plain shirts or a jacket, no tie. A heavy, deliberate presence, often at a blackboard.

**Corinna Cortes** (Danish) [S1]
- **Career:** a Bell Labs researcher (born 31 March 1961) who co-authored the 1995 soft-margin SVM paper and the 1995 handwritten-digit comparison study. She later became a Vice President at Google Research in New York **[FC] VERIFIED-SECONDARY** [S50].
- **Silhouette:** a slim, athletic woman with short, light-coloured hair. She is a long-distance runner [KNOWLEDGE, NEEDS CHECK; **[FC]** not confirmed, so do not state it].

**Isabelle Guyon** [S27][S33]
- **Career:** a Bell Labs colleague of Vapnik and co-author of the 1992 optimal-margin and kernel paper.
- **Silhouette:** shoulder-length hair.

**Yoav Freund and Robert Schapire** [S5]
- **Career:** at AT&T Labs at the time of AdaBoost, which they published in 1995 and 1997. Gödel Prize 2003; Kanellakis Award 2004.
- **Belief:** weak learners can be combined into strong ones with provable guarantees.
- **Silhouette:** two men in their thirties in 1990s casual dress. Schapire is usually shown bearded. [Approximate; check photos]

**Leo Breiman** (1928–2005), UC Berkeley Statistics [S7][S8][S41]
- **Career:** an academic probabilist at UCLA for seven years, then a freelance consultant for 13 years. He joined Berkeley in 1980. Co-author of CART (1984) and inventor of bagging (1996) and random forests (2001).
- **Belief:** statistics should judge models by predictive accuracy, not by fitting assumed data models. He was a self-described member of the "small second culture" [S8].
- **Silhouette:** an elderly, lean man with white hair, glasses and an open-collar shirt.

**Judea Pearl** (UCLA since 1970) [S2]
- **Career:** invented Bayesian networks and belief propagation. Turing Award 2011 (awarded 2012) "for fundamental contributions to artificial intelligence through the development of a calculus for probabilistic and causal reasoning" [S2].
- **Silhouette:** in the late 1980s, middle-aged, with a full beard (greying by the 2000s) and glasses.

**Frederick (Fred) Jelinek** (born Bedřich Jelínek, 18 Nov 1932, Kladno, Czechoslovakia; died 14 Sept 2010, Baltimore) [S25]
- **Early life:** his father died in Theresienstadt. The family emigrated to New York after 1948. PhD at MIT under Robert Fano (1962). Cornell from 1962.
- **IBM (Watson Research Center) 1972–1993:** headed the Continuous Speech Recognition Group. The group coined "language model" and "perplexity", built the Tangora system and, from 1987, statistical MT. Johns Hopkins CLSP from 1993 to 2010.
- **Belief:** data plus probability beats hand-written linguistic rules. Late in life he insisted he did not dislike linguists [S25][S26].
- **Silhouette:** an older man, balding, with glasses, a suit or jacket and an Eastern-European bearing.

**Yann LeCun** (born 1960, France) [S13][S14]
- **Career:** Bell Labs Holmdel from 1988 (later AT&T Labs). NYU from 2003. CIFAR NCAP member, and co-director of the successor program from 2014.
- **Belief:** end-to-end learned features (convolutional nets) beat hand-engineered features. He had little patience with "ironclad theory" as a gatekeeper [S14].
- **Silhouette:** in the early 1990s, about 30, with thick dark wavy hair, glasses and a round face, in a shirt and sweater at a 486 PC with a video camera (the 1993 demo) [S13].

**Larry (Lawrence D.) Jackel**
- **Career:** head of the Adaptive Systems Research Department at Bell Labs, Holmdel. He hired LeCun and was Vapnik's boss [S13][S36]. He ran the "Snowbird" neural-networks-for-computing workshop from 1986 to 1996 (LeCun on X; secondary) [S37].
- **Belief:** in the 1995 bet he bet that people would "understand quantitatively why big neural nets working on large databases are not so bad" by 14 March 2000, and lost. He took the other side of Vapnik's bet that by 2005 "no one in his right mind" would use 1995-style neural nets, and won [S36].
- **Silhouette:** a manager figure in 1990s office clothes. [Photo check needed]

**Léon Bottou and Patrick Haffner**
- **Career:** co-authors of the 1998 paper. Bottou was at Bell Labs Holmdel around 1991, founded Neuristique in France in 1992, returned to Bell Labs in 1995, moved to AT&T Labs in 1996 and joined NEC Labs in 2002 [S38]. **[FC]** Wikipedia's "over 10% of all the checks" line has no citation. Use LeCun's own wording instead: "an estimated 10 percent of all the checks written in the US" [S51].

**Sepp (Josef) Hochreiter** (Bavarian)
- **Career:** a TU Munich diploma student in 1991. Doctorate 1999 (advisor Wilfried Brauer). Later at JKU Linz [S16].
- **Belief:** error signals in recurrent nets shrink or blow up exponentially with time lag. He proposed a constant-error pathway as the fix [S16][S18].
- **Silhouette:** in the early 1990s, a young student, slim, with dark hair.

**Jürgen Schmidhuber**
- **Career:** at TU Munich in 1991, supervising Hochreiter. Moved to IDSIA, Lugano (Switzerland) [S18].
- **Belief:** in recurrent nets, history compressors and credit assignment. Later the most vocal critic of credit allocation in deep-learning history [S22].
- **Silhouette:** in later years, shaved or very short hair, a trim beard and dark clothes. [Approximate]

**Yoshua Bengio** (Université de Montréal)
- **Career:** co-author of the 1994 vanishing-gradient paper, the 1998 LeNet paper and the 2003 neural language model. A CIFAR NCAP fellow from the start [S15][S19].
- **Belief:** distributed representations defeat the curse of dimensionality [S19].
- **Silhouette:** in the 2000s, dark curly hair and a short beard, in a casual sweater.

**Geoffrey Hinton** (University of Toronto from 1987)
- **Career:** CIFAR fellow from 1987. Proposed NCAP in 2004 and directed it until 2013 [S20][S21].
- **Belief:** brain-like learning in multilayer nets, through unsupervised pre-training (2006) [S15].
- **Silhouette:** tall and lean, with grey hair. In the 2000s, sweaters or open shirts. (He is often reported to avoid sitting because of a back injury [UNVERIFIED in this pass; do not state].)

**Garry Kasparov** (world chess champion)
- **Silhouette in 1997:** 34 years old, with thick dark hair and an intense, forward-leaning posture over the board. Dark suit, often with his head in his hands.
- **Deep Blue team:** Feng-hsiung Hsu, Murray Campbell, A. Joseph Hoane Jr. and others.

**The Netflix Prize team** [S28]
- BellKor's Pragmatic Chaos: Bob Bell, Martin Chabbert, Michael Jahrer, Yehuda Koren, Martin Piotte, Andreas Töscher and Chris Volinsky. They came from AT&T Labs (Bell, Volinsky), Pragmatic Theory (Piotte, Chabbert), Yahoo! (Koren) and Commendo Research & Consulting in Austria (Töscher, Jahrer). **[FC] VERIFIED-SECONDARY** [S49]

---

## 4. The belief of the age

**What the mainstream believed, roughly 1995 to 2006–2012:**
1. *Neural nets are hard to train.* Backpropagation gets stuck in local minima, needs careful tuning (learning rates, initialisation, architecture) and is a "black art".
2. *Neural nets lack theory.* There is no guarantee they generalise. SVMs come with VC and margin bounds and convex training. The 1995 Bell Labs bet names exactly this. Jackel bet "that by March 14, 2000, people will understand quantitatively why big neural nets working on large databases are not so bad. (Understanding means that there will be clear conditions and bounds)", and lost [S36]. **[FC] Corrected:** the earlier wording "a math theory explaining why neural networks work" was a blog paraphrase presented as a quote.
3. *Neural nets are black boxes.* Breiman lists "neural nets" inside the unknown box of the algorithmic culture [S8].
4. *Neural nets are simply less accurate than kernel methods.* Breiman in 2001: SVMs "have proved to be more accurate predictors in classification and regression then neural nets" [S8]. On MNIST a "Virtual SVM, deg-9 poly" with distortions reached 0.8% in 1998, and 0.68% by 2002 (DeCoste & Schölkopf). That was neck and neck with or better than many convnets of the time [S12].
5. *Language and speech are statistics problems, but shallow ones.* N-gram counts with smoothing (Kneser–Ney), HMMs and Gaussian mixtures. Learned word vectors were exotic [S19][S25].

**Who held it.** Most of the NIPS, ICML and COLT community in the late 1990s and 2000s, plus computer-vision reviewers (CVPR) into 2012. The statistics establishment largely rejected *both* neural nets and algorithmic modelling: by Breiman's estimate, "98% of all statisticians" were in the data-modelling culture [S8].

**Who dissented.**
- LeCun and Bottou (Bell Labs, then NYU and NEC).
- Hinton (Toronto).
- Bengio (Montréal).
- Schmidhuber and Hochreiter (Munich, Lugano).
- A few others in CIFAR NCAP: Zemel, Frey, de Freitas, Fleet, Ng, Seung, Welling, Salakhutdinov [S21].

**How long it held.** LeCun dates the "Neural Net Winter" to "the late 1990s and early 2000s" [S14]. Bengio is said to have described neural networks as having "fell out of fashion in the mid-90s" [S42, secondary; **[FC] UNVERIFIED**: the O'Reilly page was inaccessible, so do not use this as a quote]. The thaw began with the 2006 deep-belief-net papers [S15]. Speech fell to deep nets around 2009–2012 (the NIPS 2009 workshop on deep learning for speech recognition [S43]). Vision fell in 2012 (AlexNet, covered in another dossier). So the belief held for about 10 to 15 years, depending on subfield.

**What ended it.** Unsupervised pre-training (2006) made deep nets trainable. Large labelled datasets and GPUs then let supervised convnets win outright. The *Toronto Star* summary: "when researchers began throwing huge data sets at them, and combining them with new and powerful graphics processing units originally built for video games, the systems began beating traditional machine learning systems that had been tweaked for decades" [S15].

**Nuance the film must keep.** Neural nets were never fully dead in industry. LeNet-family networks were reading a large share of US checks throughout the "winter", an estimated 10% by LeCun's own account [S11][S51]. The winter was mainly *academic prestige and publication*, not total disuse. Jackel won his bet that neural nets would still be used in 2005 [S36].

---

## 5. Experiments and results

### 5.1 Bell Labs digit recognition (1989–1998)
- **Setting.** AT&T Bell Laboratories, Holmdel, New Jersey: Eero Saarinen's huge mirrored-glass building, dubbed "the biggest mirror ever", in a rural setting **[FC] VERIFIED-SECONDARY** [S52]. The department was the Adaptive Systems Research Department [S13].
- **1989 data.** 9,298 segmented numerals digitised from handwritten ZIP codes on US mail passing through the Buffalo, NY post office. 7,291 for training, 2,007 for testing. Images were 16×16 pixels [S10]. **[FC]** The *Neural Computation* paper reports 5.0% raw test error (102 mistakes) and a 12.1% reject rate for 1% error. The companion NIPS paper, using a different network on a superset database that adds printed digits, reported 1% error at about a 9% reject rate. Do not attach the 9% figure to the 1989 journal paper [S10].
- **1993 demo apparatus.** "LeNet 1" running in real time on a **DSP card inside a 486 PC, with a video camera and frame grabber**. The camera pointed at handwritten digits on paper. Software was the Lisp-based "SN" simulator, which compiled networks to C with the weights as array literals [S13]. *Art note:* a beige 486 tower, a CRT monitor, a small camera on a stand, a hand-written digit under a desk lamp, and the recognised digit appearing on screen.
- **MNIST (1998).**
  - **Source data:** built from NIST Special Database 3 (written by Census Bureau employees) and Special Database 1 (written by high-school students). SD-3 was "much cleaner and easier to recognize" [S12].
  - **Split:** 60,000 training and 10,000 test images. Training digits came from about 250 writers, kept disjoint from the test writers.
  - **Images:** each digit was size-normalised into a 20×20 box, then centred by centre of mass in a 28×28 field [S12].
- **Key 1998 error rates** (test error %, LeCun et al. 1998, as listed on the MNIST page [S12]):

| Classifier | Error % |
|---|---|
| linear classifier (1-layer NN) | 12.0 |
| k-nearest neighbours, Euclidean | 5.0 |
| 2-layer NN, 300 hidden units | 4.7 |
| SVM, Gaussian kernel (Burges & Schölkopf's "regular SVM", as reported in LeCun et al. 1998; **[FC]** the MNIST page gives no reference for this row) | 1.4 |
| LeNet-1 (16×16 input) | 1.7 |
| LeNet-4 | 1.1 |
| LeNet-5 (no distortions) | 0.95 |
| Virtual SVM, deg-9 poly (distortions) | 0.8 |
| LeNet-5 (distortions) | 0.8 |
| Boosted LeNet-4 (distortions) | 0.7 |

  (Later: 0.23%, Ciresan et al., CVPR 2012 [S12].)
- **The check reader.** A graph transformer network combining convolutional character recognisers with global training. From the abstract: "It is deployed commercially and reads several million cheques per day" (IEEE spelling; author PDFs say "checks") [S11].
  - The body of the paper places it in the NCR line of check-recognition systems [S38, secondary summary of the paper].
  - **[FC] Corrected.** LeCun's own homepage says the system "reads an estimated 10 percent of all the checks written in the US", and his official bio says it "was reading between 10 and 20% of all the checks in the US in the early 2000s" [S51]. Bottou's Wikipedia "over 10%" is uncited. The arXiv source previously cited (1412.8341) is an astrophysics master's thesis and has been dropped. The ACM Turing profile could not be fetched to confirm "more than 10%".
  - **Use "an estimated one in ten US checks" (or "about 10%") as the safe figure.** Do not say "more than 10%".

### 5.2 Support-vector networks (1992–1995)
- **Idea:** map inputs non-linearly into a very high-dimensional feature space and build a maximum-margin linear separator there. Kernels make this computable without ever building the space. "Soft margins" (slack variables, parameter C) tolerate non-separable data [S1][S8].
- **Benchmark:** handwritten digits. On the US Postal Service database, polynomial SVMs of degree 2–7 had raw test errors of about 4.7% to 4.2% [S1, secondary summary]. In the Bell Labs comparisons, SVMs matched LeNet-4-class networks [S12][S36].
- **Why it was loved:** a convex quadratic program, so a unique optimum and no local minima. Generalisation bounds came from VC theory. There were few knobs (kernel and C).

### 5.3 Boosting (1995–1997)
- **AdaBoost:** repeatedly re-weight the training examples so the next weak learner focuses on the previous one's mistakes, then take a weighted vote. It grew out of an on-line "Hedge" algorithm for apportioning bets among experts [S5].
- **Viola–Jones face detection (2001):** used a boosted cascade of simple Haar-like features and ran in real time on ordinary PCs. It became the standard way cameras found faces in the 2000s [KNOWLEDGE, NEEDS CHECK; **[FC]** the paper's metadata is verified, but this adoption claim is not, so do not state it] [S40].

### 5.4 Random forests (2001)
- **Method:** many decision trees, each grown on a bootstrap sample with random feature selection, which then vote [S7].
- **Breiman's self-assessment:** "So forests are A+ predictors… So on interpretability, they rate an F" [S8].
- **Benchmark:** on the 16×16 ZIP-code data, "A neural net handcrafted to the data got a test set error of 5.1% vs. 6.2% for a standard run of random forest" [S8]. This is a candid concession inside a pro-algorithmic essay.

### 5.5 Bayesian networks and HMMs
- **Pearl (1988):** directed acyclic graphs of conditional probabilities, with exact belief propagation on trees [S2][S3].
- **IBM speech:** HMM acoustic models plus n-gram "language models". The Tangora system had a 5,000-word vocabulary and trigram LMs [S25] **[FC] VERIFIED-SECONDARY**. (Wikipedia credits "IBM researchers", not Jelinek personally, with introducing the terms "language model" and "perplexity".) *Art note:* an IBM researcher speaking slowly, word by word, into a headset microphone; racks of IBM hardware [KNOWLEDGE, NEEDS CHECK on the isolated-word dictation style].

### 5.6 Statistical machine translation at IBM (1988–1994)
- **Data:** about a million-plus sentence pairs from the Canadian parliamentary Hansards (French–English). The authors said they had "minimal linguistic content" in their algorithms [S34].
- **Candide:** of a test set from unseen Hansard data, the 1992 version translated 45 sentences correctly and the 1993 version 62. In the evaluation it beat Systran on fluency but not adequacy [S35].

### 5.7 The vanishing gradient (1991, 1994) and LSTM (1997)
- **Hochreiter 1991:** back-propagated error signals either shrink exponentially (vanish) or blow up with the number of time steps or layers [S16][S17].
- **Bengio, Simard & Frasconi (1994):** reached the same conclusion independently [S17].
- **LSTM:** "constant error carousels" (a self-connection of weight 1.0) protected by multiplicative input and output gates. "LSTM can learn to bridge minimal time lags in excess of 1000 discrete-time steps" [S18]. The experiments were on artificial sequence tasks. (The forget gate was added later: Gers, Schmidhuber & Cummins, "Learning to Forget: Continual Prediction with LSTM", *Neural Computation* 12(10):2451–2471, Oct 2000. **[FC] VERIFIED (Crossref)** [S53])

### 5.8 Neural probabilistic language model (2000/2003)
- **Architecture:** each word gets a learned feature vector (the shared matrix C), then a tanh hidden layer, then a softmax over the vocabulary [S19].
- **Data:** Brown corpus (1,181,041 words; |V| = 16,383) and AP News 1995–96 (training set about 14 million words; |V| = 17,964) [S19].
- **Results:** the paper reports "a test perplexity difference of about 24% on Brown and about 8% on AP News" against the best n-gram [S19]. **[FC] Corrected baselines:** on Brown the best MLP (MLP10, mixed with an interpolated trigram) reached 252 against 312 for the best n-gram, a class-based back-off model with 500 classes; Kneser–Ney back-off scored 321–323. On AP News the MLP reached 109 against 117 for the modified Kneser–Ney back-off 5-gram. The "24%" is the n-gram's perplexity *above* the network's (312/252); measured the other way, the network is about 19% lower. The earlier text wrongly paired the Brown figure with the AP baseline of 117.
- **Machines:** a cluster of **1.2 GHz Athlon processors (32 × 2 CPUs) linked by Myrinet**, using MPI. The AP News run took "approximately three weeks with 40 CPUs" for only 5 epochs [S19]. *Art note:* a Linux cluster in a university machine room in Montréal, beige rack-mounted PCs, blinking network switches.

### 5.9 Deep Blue (1996–1997)
- **Machine:** a 30-node IBM RS/6000 SP system with **480 custom VLSI chess chips**, in two tall black towers. It evaluated **200 million positions per second**, twice the speed of the 1996 version. Software was in C, running on AIX [S23][S39]. **[FC]** Wikipedia gives "30 PowerPC 604e processors and 480 custom ... chess chips"; IBM gives "32 processors" and 11.38 GFLOPS. The evaluation-function parameters "were determined by analyzing thousands of master games" [S39].
  - IBM's own page says 32 processors and 11.38 GFLOPS [S23]. Use "about 30 processors plus 480 chess chips".
  - One tower is at the Smithsonian [S39].
- **Venue:** the Equitable Center, Manhattan. The games were played in a small TV-studio room on the 35th floor, set up to look like a professor's study. Up to 500 spectators watched on closed-circuit screens in a basement-level auditorium, paying about $25 per game [S24][S39].
  - **Accuracy note:** there was no *paying* audience in the game room. **[FC] Softened:** one account says "only a few dozen VIPs were allowed in the room" [S39, Gizmodo]. Show a sparse room with a few observers, not an auditorium.
- **Result:** Kasparov won Game 1, Deep Blue Game 2, then three draws. Deep Blue won Game 6 in 19 moves on 11 May 1997, for a 3½–2½ final score [S24].
- **Prize money:** $700,000 to the IBM team and $400,000 to Kasparov [S39].
- **Significance for this film:** Deep Blue was search plus hand-tuned evaluation in silicon. It was not a learning system in the neural sense. It shows that public "AI triumphs" of the era came from engineering and search, not from neural nets.

### 5.10 The Netflix Prize (2006–2009), optional
- **Goal:** $1M for a 10% RMSE improvement over Netflix's Cinematch. The training set held 100,480,507 ratings from 480,189 users on 17,770 movies **[FC] VERIFIED-SECONDARY** [S49].
- **Result:** BellKor's Pragmatic Chaos and The Ensemble both reached 10.06% on the hidden test set. BellKor won by submission order. The winning entry came about 20 minutes before The Ensemble's (accounts give 19 min 54 s to 24 min) [S28][S29].
  - **Accuracy note:** the public leaderboard showed The Ensemble at 10.10%, but that was the *quiz* subset, not the deciding test set [S29].
- **Afterward:** Netflix later said the full winning blend was not put into production. The extra accuracy "did not seem to justify the engineering effort" (Netflix Tech Blog, 2012; seen via secondary quotation [S29]).

---

## 6. Verified quotes

| # | Quote (verbatim) | Speaker | Date | Source | Context | Status |
|---|---|---|---|---|---|---|
| Q1 | "Estimated culture population. 98% of all statisticians." / "Estimated culture population. 2% of statisticians, many in other fields." | Leo Breiman | Aug 2001 | *Statistical Science* 16(3), p. 199 [S8] | Describing the data-modelling culture and the algorithmic-modelling culture. (In the PDF a line break hyphenates "statisti-cians".) | VERIFIED-PRIMARY |
| Q2 | "These theoretical bounds led to support vector machines (see Vapnik, 1995, 1998) which have proved to be more accurate predictors in classification and regression then neural nets, and are the subject of heated current research" | Leo Breiman | 2001 | [S8] | Praising Vapnik's theory. "then" is Breiman's typo for "than"; keep it as is or use [sic]. | VERIFIED-PRIMARY |
| Q3 | "If our goal as a field is to use data to solve problems, then we need to move away from exclusive dependence on data models and adopt a more diverse set of tools." | Leo Breiman | 2001 | Abstract [S8] | His thesis sentence. | VERIFIED-PRIMARY |
| Q4 | "So forests are A+ predictors. But their mechanism for producing a prediction is difficult to understand. … So on interpretability, they rate an F." | Leo Breiman | 2001 | §9.4 "The Occam Dilemma" [S8] | On his own random forests. | VERIFIED-PRIMARY |
| Q5 | "In the mid-1980s two powerful new algorithms for fitting data became available: neural nets and decision trees. A new research community using these tools sprang up. Their goal was predictive accuracy. The community consisted of young computer scientists, physicists and engineers plus a few aging statisticians." | Leo Breiman | 2001 | §7.1 [S8] | Who built machine learning. | VERIFIED-PRIMARY |
| Q6 | "the so-called "Deep Learning conspiracy"" (in the sentence: "A lot of us involved in the resurgence of Deep Learning in the mid-2000s, including Geoff Hinton, Yoshua Bengio, and myself—the so-called "Deep Learning conspiracy"—as well as Andrew Ng, started with the idea of using unsupervised learning more than supervised learning.") | Yann LeCun | 18 Feb 2015 | *IEEE Spectrum*, interview by Lee Gomes [S14] | The earliest *documented on-record* use found. "So-called" implies the label was already in circulation, but no earlier source was found. | VERIFIED-PRIMARY for the bracketed phrase; the full sentence is VERIFIED-SECONDARY via the search excerpt plus a partial fetch. Recheck before using the full sentence. |
| Q7 | "the "Neural Net Winter" during the late 1990s and early 2000s was a consequence of that philosophy" … "that you had to have ironclad theory, and the empirical results didn't count." … "It's a very bad way to approach an engineering problem." | Yann LeCun | Feb 2015 | *IEEE Spectrum* [S14] | Asked whether his work is science or hacking. These are fragments; quote them as fragments. | VERIFIED-PRIMARY (fragments) |
| Q8 | "It was the worst possible time," … "Everyone else was doing something different. Somehow, Geoff convinced them." … "We should give (CIFAR) a lot of credit for making that gamble." | Yoshua Bengio | 17 Apr 2015 | Kate Allen, *Toronto Star* [S15] | On Hinton's 2004 proposal for the NCAP program. | VERIFIED-PRIMARY |
| Q9 | "We were outcast a little bit in the broader machine learning community: we couldn't get our papers published. This gave us a place where we could exchange ideas." | Yann LeCun | 17 Apr 2015 | *Toronto Star* [S15] | On CIFAR NCAP. | VERIFIED-PRIMARY |
| Q10 | CIFAR "had a huge impact in forming a community around deep learning" | Yann LeCun | 17 Apr 2015 | *Toronto Star* [S15] | Partial quote embedded in reporter's sentence. | VERIFIED-PRIMARY |
| Q11 | "People said, 'This is crazy. Why are you wasting your time on this stuff? It's already shown to be nonsense.'" | Geoffrey Hinton, recalling others | 17 Apr 2015 | *Toronto Star* [S15] | About starting his PhD in the 1970s (first winter). Use it in the earlier chapter, not this one. | VERIFIED-PRIMARY |
| Q12 | "It is deployed commercially and reads several million cheques per day." | LeCun, Bottou, Bengio & Haffner | Nov 1998 | *Proc. IEEE* abstract (IEEE spelling; author PDF has "checks") [S11] | The check reader. | VERIFIED-PRIMARY |
| Q13 | "LSTM can learn to bridge minimal time lags in excess of 1000 discrete-time steps by enforcing constant error flow through constant error carousels within special units." | Hochreiter & Schmidhuber | Nov 1997 | *Neural Computation* abstract [S18] | The preprint spells it "carrousels" and writes "discrete time steps". | VERIFIED-PRIMARY (**[FC]** the published abstract via Crossref matches) |
| Q14 | "We propose to fight the curse of dimensionality by learning a distributed representation for words which allows each training sentence to inform the model about an exponential number of semantically neighboring sentences." | Bengio, Ducharme, Vincent & Jauvin | 2003 | JMLR abstract [S19] | The core idea of word embeddings. | VERIFIED-PRIMARY |
| Q15 | "SD-3 was collected among Census Bureau employees, while SD-1 was collected among high-school students." | LeCun, Cortes & Burges (MNIST page) | c. 1998 | MNIST page (archived) [S12] | Why MNIST mixes the two. The page has "The reason for this can be found on the fact that…" | VERIFIED-PRIMARY |
| Q16 | "For fundamental contributions to artificial intelligence through the development of a calculus for probabilistic and causal reasoning." | ACM (Turing citation for Pearl) | 2012 (2011 award) | [S2] | | VERIFIED-SECONDARY |
| Q17 | "three CIFAR-funded collaborators who call themselves the "deep learning conspiracy" (e.g., LeCun, 2015)" | Jürgen Schmidhuber | June 2015 | [S22] | Critique of the *Nature* "Deep Learning" review (Nature 521, p. 436). | VERIFIED-PRIMARY |
| Q18 | "Whenever I fire a linguist our system performance improves" | Fred Jelinek (his own later recollection of his wording) | Said Dec 1988 (per Jelinek); recalled 28 May 2004 | Jelinek's own LREC 2004 slides, "Some of My Best Friends Are Linguists", slide "The Quote": "From my talk entitled: Applying Information Theoretic Methods: Evaluation of Grammar Quality, Workshop on Evaluation of NLP Systems, Wayne PA, December 1988" [S26][S54] | See the next row. | **[FC] VERIFIED-PRIMARY as Jelinek's own 2004 recollection.** It is not attested in the 1988 proceedings, and Moore dates a variant to 1985, so the original wording is still **contested**. On screen, attribute it as "as Jelinek himself later recalled it". |
| Q18-alt | "Every time I fire a linguist, the performance of the speech recognizer goes up" | Attributed to Jelinek | various | Popular version; Wikipedia says "the exact wording and date vary among sources" [S25] | Other versions: "Anytime a linguist leaves the group the recognition rate goes up" (Jurafsky & Martin, citing Jelinek's recollection, 1988); "Every time we fire a phonetician/linguist, the performance of our system goes up" (R. K. Moore, dated 1985). | **UNVERIFIED as exact wording. Do not use as a verbatim quote.** Safe narration: *Jelinek is remembered for joking that every time he fired a linguist, his system got better. He later said he wished the line were apocryphal.* |
| Q19 | "Neural networks are the second best way of doing just about anything." | Attributed to John Denker (Bell Labs) | ? | Origin unknown. People were already asking for the source on the Connectionists list in 2001 [S44] | | **UNVERIFIED. Do not use as a quote.** It can be described as "a joke attributed to Bell Labs physicist John Denker". |
| Q20 | Kasparov: "human-like", "there was a human hand" and similar accusations after Game 2 | Kasparov | May 1997 | Accounts differ on which press conference and on the wording [S39] | | UNVERIFIED wording; paraphrase only. |

**Not found and not to be invented:** any verbatim Vapnik remark disparaging neural nets. The bet document is the evidence; describe it, don't quote Vapnik. Likewise any verbatim NIPS rejection notice from the 2000s.

---

## 7. Debates and controversies

1. **SVMs versus neural nets (1995 to the mid-2000s).**
   - *For SVMs:* convexity, theory and equal or better accuracy on the benchmarks of the day, especially with small data. Breiman [S8], and the MNIST table shows SVM variants close to or better than LeNet-4 [S12].
   - *For neural nets:* learned features, scaling with data and engineering success in deployment (checks) [S11]. LeCun criticised "ironclad theory" as a gatekeeper [S14]. The best 1998 MNIST result was a neural net (boosted LeNet-4, 0.7%) [S12].
   - **The Jackel–Vapnik bet** made the debate literal. It was a signed one-page typed document. **[FC] Transcribed from the image of the document [S36] (VERIFIED-PRIMARY):**
     - **Bet 1:** "Jackel bets (one fancy dinner) that by March 14, 2000, people will understand quantitatively why big neural nets working on large databases are not so bad. (Understanding means that there will be clear conditions and bounds)" / "Vapnik bets (one fancy dinner) that Jackel is wrong." / "But .. If Vapnik figures out the bounds and conditions, Vapnik still wins the bet."
     - **Bet 2:** "Vapnik bets (one fancy dinner) that by March 14, 2005, no one in his right mind will use neural nets that are essentially like those used in 1995." / "Jackel bets ( one fancy dinner) that Vapnik is wrong"
     - **Signatures:** "V. Vapnik" (top), "L. Jackel" (middle) and "Witnessed by Y. LeCun" (bottom), each dated 3/14/95.
     - **Outcome (VERIFIED-SECONDARY):** Jackel lost bet 1 and Vapnik lost bet 2. LeCun clarified that he was only the witness [S36][S37]. Accounts that he enjoyed both dinners are secondary (a Medium post citing his autobiography); say "reportedly".
     - **Caution:** a widely shared LeCun retelling gives Vapnik's deadline as 2000, but the document says 14 March 2005. Vapnik's bet was about nets "essentially like those used in 1995", not about neural nets in general.
     - The document's lines may now be quoted verbatim, including the odd spacing in "But .." and "( one".
2. **Credit for the vanishing-gradient analysis and LSTM.** Hochreiter (1991, in German, unpublished as a journal article) came before Bengio, Simard & Frasconi (1994). Schmidhuber calls the thesis "one of the most important documents in the history of machine learning" (**[FC]** verified on his "Annotated History of Modern AI and Deep Learning" page; his "Miraculous Year" page has "which I consider one of the most important documents...") [S55]. The four authors wrote a joint English treatment in 2001 [S17]. Narrate it as "independently identified by Hochreiter (1991) and by Bengio and colleagues (1994)".
3. **The "deep learning conspiracy" and credit.** The trio used it as a joke [S14]. Schmidhuber's 2015 critique turned it into an accusation that the 2015 *Nature* review under-credited earlier pioneers, including Ivakhnenko, Linnainmaa, Werbos and Fukushima [S22]. He also notes that "deep learning" as a term came from Dechter (1986) and Aizenberg et al. (2000) [S22]. Present both: a self-mocking nickname, and a pointed critique.
4. **Rationalism versus empiricism in language.** Jelinek's IBM group against rule-based linguistics. Jelinek himself softened the story: his group was not anti-linguist, and the hard part was getting linguistic knowledge into statistical systems [S25][S26].
5. **Was the "winter" real?** Industry kept using neural nets (checks, some OCR and speech), and Bengio's 2003 paper was published at a top venue. Counter-evidence for a real academic chill: LeCun's "couldn't get our papers published" [S15] and the 2012 CVPR episode [S30][S31]. In that episode a 2012 blogger noted that two face-related deep-learning papers *were* accepted at CVPR 2012, and a commenter suggested the rejected paper was simply hard to digest [S31]. So "bias against neural nets" is contested at the level of individual papers.
6. **Kasparov's cheating accusation (1997).** Kasparov suspected human help during Game 2. IBM said the only human intervention was between games, to fix bugs, as the rules allowed. IBM retired Deep Blue and declined a rematch [S39]. There is no evidence of cheating. Present it as Kasparov's suspicion and IBM's denial.

---

## 8. Misconceptions to avoid

- **Don't say "neural nets were abandoned".** They were unfashionable in academia but deployed in industry (an estimated 10% of US checks, per LeCun) [S11][S51].
- **Don't say "Deep Blue used AI learning / neural networks".** It used massively parallel alpha-beta search plus a hand-tuned evaluation function in custom chips [S23][S39].
- **Don't show an audience watching Kasparov in the same room.** The game room on the 35th floor was private; the audience watched on screens elsewhere in the building [S39].
- **Don't say Hinton, LeCun and Bengio coined "deep learning".** The term predates them (Dechter 1986; Aizenberg et al. 2000) [S22]. They popularised it for neural nets after 2006 [S15].
- **Don't quote "Every time I fire a linguist…" as exact words.** The wording is contested; see Q18.
- **Don't call Hochreiter's 1991 work a PhD thesis.** It was a *Diplom* (diploma, master's-level) thesis. His doctorate came in 1999 [S16].
- **Don't say LSTM had a forget gate in 1997.** That was added in 2000 (Gers, Schmidhuber & Cummins) **[FC] VERIFIED** [S53].
- **Don't say MNIST came from the US Postal Service.** It came from NIST SD-1 and SD-3 (Census employees and high-school students). The *1989* ZIP-code set came from Buffalo, NY postal mail [S10][S12].
- **Don't say SVMs were invented in 1995.** The optimal-margin idea goes back to Vapnik and Chervonenkis's 1960s "generalized portrait". Kernels came in 1992 (Boser, Guyon & Vapnik) and soft margins in 1995 (Cortes & Vapnik) [S1][S27][S33].
- **Don't misstate who won the Vapnik–Jackel bets.** Each man won one bet and lost one, and LeCun was the witness. He was not a party, though some retellings say Vapnik and Jackel "lost a dinner to LeCun" [S36][S37].
- **The Netflix Prize was not won by a single algorithm.** It was won by a blend of hundreds of predictors, and the full blend was never deployed [S28][S29].
- **Breiman's random forest did *not* beat the neural net on ZIP codes** in his own table (6.2% versus 5.1%) [S8].

---

## 9. Curiosity hooks

1. **A dinner bet on the future of AI.** On 14 March 1995 at Bell Labs, Vapnik bet "one fancy dinner" that by 2005 "no one in his right mind" would use neural nets like those of 1995. His boss, Larry Jackel, bet that by 2000 people would "understand quantitatively" why big neural nets work. Each lost one bet. Yann LeCun signed as witness and reportedly enjoyed both dinners [S36][S37]. **[FC] corrected wording.**
2. **The "Neural Net Winter" was a time of check-reading.** While neural nets were academically out of fashion, a Bell Labs convolutional net was "deployed commercially" and reading "several million cheques per day" [S11]. By LeCun's own estimate, that was about one in ten US checks [S51]. **[FC] corrected from "more than one in ten".**
3. **MNIST's secret.** The famous dataset mixes digits written by US Census Bureau employees, which were neat, with digits written by high-school students, which were messy. That mix is exactly why it was a fair test [S12].
4. **A statistician's census.** In 2001 Leo Breiman estimated that 98% of statisticians were in one "culture" and 2% in the other. The 2% included neural-net and decision-tree people [S8].
5. **Three weeks for five passes.** Bengio's 2003 neural language model, an ancestor of today's word embeddings, took about three weeks on 40 CPUs to train for just five passes over 14 million words of AP News [S19].
6. **Translation learned from Canadian politics.** IBM's statistical translation models learned French and English from the bilingual record of Canada's Parliament (the Hansards) [S34].
7. **Deep Blue's private room.** The 1997 match was played in a small TV studio on the 35th floor, dressed as a professor's study. Hundreds of spectators watched on screens in an auditorium in the same building [S39].
8. **A thesis in German that held a key to modern AI.** Sepp Hochreiter's 1991 diploma thesis, written in German, analysed the vanishing-gradient problem that would block deep learning for 15 years [S16].
9. **A joke label that became a battle line.** "The so-called Deep Learning conspiracy" was a self-mocking nickname for Hinton, LeCun and Bengio [S14]. Schmidhuber turned it into the title of a critique of how they credit history [S22].
10. **A tie decided by 20 minutes.** The $1M Netflix Prize ended in a dead heat at 10.06%. The winner was whoever had submitted about 20 minutes earlier [S28][S29].

---

## 10. Visual and dramatic details

- **Bell Labs, Holmdel, New Jersey (1988–1996).**
  - The building: an enormous mirrored-glass box set in landscaped grounds. **[FC] Corrected:** the 127-ft water tower is a white saucer-shaped bowl on three legs. It is popularly said to look like a transistor, but there is no documented evidence it was designed as one; it is an urban legend, so do not narrate it as fact [S52]. Long interior atriums.
  - Lab rooms: beige 486 PCs, CRT monitors, a small video camera on a gooseneck stand aimed at a sheet of handwritten digits, and VHS tapes (the 1993 demo was recorded on VHS) [S13].
  - *Silhouette staging:* LeCun at the desk, a hand holding a pen-written "3" under the camera, and a glowing digit on screen.
- **Vapnik's whiteboard.** Dense margin geometry: two classes of dots, a fat empty "street" between them, and the support vectors circled on its edges. That is a natural paper-cut motif, a corridor between two crowds [S8].
- **The signed bet.** One typed sheet with two numbered bets separated by a row of asterisks, then three signatures: V. Vapnik at the top, L. Jackel in the middle, and "Witnessed by Y. LeCun" at the bottom, each dated 3/14/95 [S36]. **[FC] VERIFIED-PRIMARY** Prop: a fountain pen, two wine glasses, and a restaurant table for the two dinners.
- **IBM Watson Research Center, Yorktown Heights, NY.** Saarinen's large crescent-shaped building (1956–61) of three levels, with offices that have no windows [S56] **[FC] VERIFIED-SECONDARY**; the "fieldstone" detail is not confirmed. Headset microphones, reel and disk drives, stacks of bilingual Hansard printouts in French and English side by side.
- **Equitable Center, Manhattan, May 1997.**
  - Upstairs (35th floor): a small studio dressed as a study, wood panels and bookshelves, with Kasparov at the board facing Deep Blue's operator; rotating IBM team members moved the pieces. A few observers at most [S39].
  - Downstairs: an auditorium with large screens and grandmaster commentators on stage [S39].
  - Two tall black RS/6000 SP towers, one now at the Smithsonian [S39]. Spring in New York.
  - *Staging:* Kasparov's head in his hands; then the theatre audience seeing the resignation on a screen.
- **TU Munich, 1991.** A student desk, a German typewritten thesis, and graphs of error signals decaying to nothing over time steps. A visual metaphor: a whisper passed down a long line of people, fading to silence.
- **Montréal, early 2000s.** A machine room with a Linux cluster (32 dual-CPU Athlon boxes), Myrinet cables and a winter view of snow outside [S19; snow is atmospheric licence].
- **Toronto, 2004–2006.** CIFAR NCAP meetings: a small group of researchers around a table; summer schools from 2005 [S21]. *Staging:* a handful of figures holding a lit lantern while the larger hall (the NIPS crowd) is lit by SVM diagrams. Use it as metaphor only.
- **Period details.**
  - 1990s: CRT monitors, 3.5-inch floppies, overhead-projector transparencies at NIPS (Denver, then Vancouver and Whistler workshops), wire-bound conference proceedings.
  - 2006: Netflix's red DVD-by-mail envelopes, for the Netflix Prize coda.

---

## 11. Sources

1. [S1] Cortes, C. & Vapnik, V. (1995). "Support-Vector Networks." *Machine Learning* 20(3):273–297. https://link.springer.com/article/10.1007/BF00994018 · metadata: https://api.crossref.org/works/10.1007/BF00994018 · ACM DL: https://dl.acm.org/doi/10.1023/A:1022627411411 · summary: https://paperswelove.org/papers/support-vector-networks-2df91e4a/
2. [S2] ACM Turing Award, Judea Pearl. https://amturing.acm.org/award_winners/pearl_2658896.cfm · https://cacm.acm.org/blogcacm/judea-pearl-wins-2011-acm-turing-award/
3. [S3] Pearl, J. (1988). *Probabilistic Reasoning in Intelligent Systems*. Morgan Kaufmann. Review listing: https://www.cambridge.org/core/journals/journal-of-symbolic-logic/article/abs/judea-pearl-probabilistic-reasoning-in-intelligent-systems-networks-of-plausible-inference-series-in-representation-and-reasoning-morgan-kaufmann-san-mateo1988-xix-552-pp/12004ABE6A62B67B79D92DB3CE16D0D8 · https://books.google.com/books/about/Probabilistic_Reasoning_in_Intelligent_S.html?id=AvNID7LyMusC
4. [S4] (reserved)
5. [S5] Freund, Y. & Schapire, R. (1997). JCSS 55(1):119–139. https://www.semanticscholar.org/paper/A-decision-theoretic-generalization-of-on-line-and-Freund-Schapire/4ba566223e426677d12a9a18418c023a4deec77e · Freund publication list: https://cseweb.ucsd.edu/~yfreund/papers/index.html · Gödel Prize: https://en.wikipedia.org/wiki/G%C3%B6del_Prize · https://en.wikipedia.org/wiki/Robert_Schapire
6. [S6] (reserved)
7. [S7] Breiman, L. (2001). "Random Forests." *Machine Learning* 45:5–32. https://mfm.uchicago.edu/wp-content/uploads/2020/06/Breiman-Random-Forests.pdf
8. [S8] Breiman, L. (2001). "Statistical Modeling: The Two Cultures." *Statistical Science* 16(3):199–231. https://projecteuclid.org/journals/statistical-science/volume-16/issue-3/Statistical-Modeling--The-Two-Cultures-with-comments-and-a/10.1214/ss/1009213726.pdf · full-text copy used: https://www2.math.uu.se/~thulin/mm/breiman.pdf
9. [S9] (reserved)
10. [S10] LeCun, Y. et al. (1989). "Backpropagation Applied to Handwritten Zip Code Recognition." *Neural Computation* 1(4):541–551. https://direct.mit.edu/neco/article/1/4/541/5515/Backpropagation-Applied-to-Handwritten-Zip-Code · NIPS 1989 companion: https://proceedings.neurips.cc/paper/1989/file/53c3bce66e43be4f209556518c2fcb54-Paper.pdf · Karpathy reproduction: https://github.com/karpathy/lecun1989-repro
11. [S11] LeCun, Y., Bottou, L., Bengio, Y. & Haffner, P. (1998). "Gradient-Based Learning Applied to Document Recognition." *Proc. IEEE* 86(11):2278–2324. https://ieeexplore.ieee.org/document/726791 · abstract via OpenAlex: https://api.openalex.org/works/doi:10.1109/5.726791 · PDF: http://yann.lecun.com/exdb/publis/pdf/lecun-98.pdf
12. [S12] The MNIST database (LeCun, Cortes, Burges), archived. https://web.archive.org/web/2019/http://yann.lecun.com/exdb/mnist/
13. [S13] LeNet (Wikipedia, incl. 1993 demo and Holmdel details). https://en.wikipedia.org/wiki/LeNet · Yann LeCun: https://en.wikipedia.org/wiki/Yann_LeCun · KDnuggets interview (2014): https://www.kdnuggets.com/2014/02/exclusive-yann-lecun-deep-learning-facebook-ai-lab.html
14. [S14] Gomes, L. (18 Feb 2015). "Facebook AI Director Yann LeCun on His Quest to Unleash Deep Learning and Make Machines Smarter." *IEEE Spectrum*. https://spectrum.ieee.org/facebook-ai-director-yann-lecun-on-deep-learning
15. [S15] Allen, K. (17 Apr 2015). "How a Toronto professor's research revolutionized artificial intelligence." *Toronto Star*. https://www.thestar.com/news/world/2015/04/17/how-a-toronto-professors-research-revolutionized-artificial-intelligence.html
16. [S16] Sepp Hochreiter (Wikipedia). https://en.wikipedia.org/wiki/Sepp_Hochreiter · Jürgen Schmidhuber (Wikipedia): https://en.wikipedia.org/wiki/J%C3%BCrgen_Schmidhuber · Schmidhuber, "Who invented deep residual learning?" (2025): https://www.alphaxiv.org/de/abs/2509.24732
17. [S17] Hochreiter, Bengio, Frasconi & Schmidhuber (2001), "Gradient flow in recurrent nets", in *A Field Guide to Dynamical Recurrent Neural Networks* (IEEE Press), and Bengio, Simard & Frasconi (1994), IEEE TNN 5(2):157–166. Both cited in Schmidhuber's overview: https://arxiv.org/pdf/1404.7828
18. [S18] Hochreiter, S. & Schmidhuber, J. (1997). "Long Short-Term Memory." *Neural Computation* 9(8):1735–1780. https://dl.acm.org/doi/10.1162/neco.1997.9.8.1735 · preprint PDF: https://www.cri.minesparis.psl.eu/people/silber/cours/2025/nlp/bib/HochreiterS1997.pdf
19. [S19] Bengio, Y., Ducharme, R., Vincent, P. & Jauvin, C. (2003). "A Neural Probabilistic Language Model." JMLR 3:1137–1155. https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf · https://jmlr.org/papers/v3/bengio03a.html
20. [S20] CIFAR, "Long-time CIFAR Fellow Geoffrey Hinton awarded 2024 Nobel Prize in Physics" (8 Oct 2024). https://cifar.ca/cifarnews/2024/10/08/long-time-cifar-fellow-geoffrey-hinton-awarded-2024-nobel-prize-in-physics/ · CIFAR Hinton bio: https://cifar.ca/bios/geoffrey-hinton/
21. [S21] CIFAR, "Our Story." https://cifar.ca/our-story/ · CIFAR Wikipedia: https://en.wikipedia.org/wiki/Canadian_Institute_for_Advanced_Research · CIFAR LMB: https://cifar.ca/research-programs/learning-in-machines-brains/ · Kyunghyun Cho on NCAP summer schools: https://kyunghyuncho.me/supporting-female-researchers-and-researchers-from-under-represented-groups-together-with-cifar/
22. [S22] Schmidhuber, J. (June 2015). "Critique of Paper by 'Deep Learning Conspiracy' (Nature 521 p 436)." https://people.idsia.ch/~juergen/deep-learning-conspiracy.html
23. [S23] IBM, "Deep Blue." https://www.ibm.com/history/deep-blue
24. [S24] Britannica, "Deep Blue." https://www.britannica.com/topic/Deep-Blue · Wikipedia: https://en.wikipedia.org/wiki/Deep_Blue_versus_Garry_Kasparov
25. [S25] Frederick Jelinek (Wikipedia). https://en.wikipedia.org/wiki/Frederick_Jelinek · Wikiquote: https://en.wikiquote.org/wiki/Fred_Jelinek
26. [S26] Jelinek, F. (2005). "Some of my Best Friends are Linguists." *Language Resources and Evaluation* 39(1):25–34. https://www.researchgate.net/publication/220147830_Some_of_my_Best_Friends_are_Linguists · quoted in *Frontiers in AI* (2022): https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2022.796741/full
27. [S27] Vladimir Vapnik (Wikipedia). https://en.wikipedia.org/wiki/Vladimir_Vapnik · BBVA Frontiers of Knowledge bio: https://www.frontiersofknowledgeawards-fbbva.es/galardonados/vladimir-vapnik-2/ · ICS Moscow: https://www.ipu.rssi.ru/en/node/74413
28. [S28] Netflix Prize forum, "Grand Prize awarded to team BellKor's Pragmatic Chaos." https://www.netflixprize.com/community/topic_1537.html · BellKor's Pragmatic Chaos page (AT&T): http://stats.research.att.com/volinsky/bpc.html
29. [S29] Slashdot, "BellKor Wins Netflix $1 Million By 20 Minutes" (21 Sept 2009). https://science.slashdot.org/story/09/09/21/2312245/bellkor-wins-netflix-1-million-by-20-minutes · TechCrunch: https://techcrunch.com/?p=86761 · U. Michigan excerpt: https://lsa.umich.edu/social-solutions/diversity-democracy/oci-series/excerpts/volume-ii/the-netflix-prize.html · Netflix Tech Blog (2012): https://netflixtechblog.com/netflix-recommendations-beyond-the-5-stars-part-1-55838468f429
30. [S30] LeCun on X re: Farabet et al. rejection. https://x.com/ylecun/status/1612337939173855234
31. [S31] "What if CVPR hates deep learning? Please mention faces" (blog, 26 May 2012; reproduces LeCun's letter). https://largescalevision.wordpress.com/2012/05/26/what-if-cvpr-hate-deep-learning-please-mention-faces/ · Synced Review: https://medium.com/syncedreview/cvpr-paper-controversy-ml-community-reviews-peer-review-79bf49eb0547
32. [S32] Brown, P. F. et al. (1990). "A Statistical Approach to Machine Translation." *Computational Linguistics* 16(2). https://aclanthology.org/J90-2002.pdf
33. [S33] Boser, B., Guyon, I. & Vapnik, V. (1992). "A training algorithm for optimal margin classifiers." COLT '92. https://dl.acm.org/doi/10.1145/130385.130401 [KNOWLEDGE, NEEDS CHECK for URL]
34. [S34] Brown, P. F. et al. (1993). "The Mathematics of Statistical Machine Translation: Parameter Estimation." *Computational Linguistics* 19(2):263–311. https://aclanthology.org/J93-2003.pdf
35. [S35] Berger, A. L. et al. (1994). "The Candide System for Machine Translation." https://aclanthology.org/H94-1028.pdf
36. [S36] Kashnitsky, Y. (2022). "How Vladimir Vapnik lost a fancy dinner in a bet witnessed by Yann LeCun." https://yorko.github.io/2022/vapnik-jackel-bet/ · Medium summary citing LeCun's autobiography: https://medium.com/@1528371521zx/vladimir-vapnik-c231aa190bb5
37. [S37] LinkedIn thread with LeCun's correction (witness, not party). https://ci.linkedin.com/posts/kashnitskiy_how-vladimir-vapnik-the-father-of-support-activity-6996018680484503552-5-1q · LeCun on Jackel and Snowbird: https://x.com/ylecun/status/1843790298205356412
38. [S38] Léon Bottou (Wikipedia; "over 10% of all the checks in the US", uncited). https://en.wikipedia.org/wiki/L%C3%A9on_Bottou · ~~arXiv 1412.8341~~ (dropped in the fact-check: an astrophysics master's thesis, not a reliable source) · ACM Turing profile of LeCun (not fetchable during the fact-check): https://amturing.acm.org/award_winners/lecun_6017366.cfm · Fortune/Yahoo profile: https://finance.yahoo.com/news/rise-yann-lecun-65-old-171352719.html
39. [S39] Deep Blue (chess computer), Wikipedia. https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer) · ChessBase, "Deep Blue's cheating move": https://en.chessbase.com/post/deep-blue-s-cheating-move · ChessBase on the ARTE film: https://en.chessbase.com/post/arte-film-on-kasparov-vs-deep-blue · J. Schaeffer, "Kasparov versus Deep Blue: The Re-match": https://webdocs.cs.ualberta.ca/~jonathan/PREVIOUS/Grad/Papers/db.html · Gizmodo (2023): https://gizmodo.com/kasparov-ibm-deep-blue-ai-chess-match-changed-minds-1850270696 · AI Business: https://aibusiness.com/ml/25-years-ago-today-how-deep-blue-vs-kasparov-changed-ai-forever
40. [S40] Viola, P. & Jones, M. (2001). "Rapid object detection using a boosted cascade of simple features." CVPR 2001. [KNOWLEDGE, NEEDS CHECK; no URL verified in this pass]
41. [S41] Leo Breiman (Wikipedia). https://en.wikipedia.org/wiki/Leo_Breiman · Cutler, "Remembering Leo Breiman" (2010): https://arxiv.org/pdf/1101.0917
42. [S42] O'Reilly, "Machines that dream" (Bengio interview). https://www.oreilly.com/content/machines-that-dream/
43. [S43] NeurIPS 2010 workshop "Deep Learning and Unsupervised Feature Learning." https://neurips.cc/virtual/2010/workshop/1986
44. [S44] Connectionists mailing list (Aug 2001), query on the "second best way" quote. https://mailman.srv.cs.cmu.edu/pipermail/connectionists/2001-August/020299.html
45. [S45] Steve Hsu, "Back to the deep" (quotes *Chronicle* profile on the rebrand). https://stevehsu.substack.com/p/back-to-the-deep
46. [S46] Karpathy, "Deep Neural Nets: 33 years ago and 33 years from now" (ICLR blog, 2022). https://iclr-blog-track.github.io/2022/03/26/lecun1989/
47. [S47] Bayesian network (Wikipedia, History: "The term Bayesian network was coined by Judea Pearl in 1985"). https://en.wikipedia.org/wiki/Bayesian_network · Judea Pearl (Wikipedia): https://en.wikipedia.org/wiki/Judea_Pearl
48. [S48] Crossref records: Hinton, Osindero & Teh 2006, https://api.crossref.org/works/10.1162/neco.2006.18.7.1527 · Hinton & Salakhutdinov 2006, https://api.crossref.org/works/10.1126/science.1127647 · LeCun et al. 1989, https://api.crossref.org/works/10.1162/neco.1989.1.4.541 · Boser, Guyon & Vapnik 1992, https://api.crossref.org/works/10.1145/130385.130401 · Viola & Jones 2001, https://api.crossref.org/works/10.1109/CVPR.2001.990517 · Freund & Schapire EuroCOLT 1995, https://api.crossref.org/works/10.1007/3-540-59119-2_166 · JCSS 1997, https://api.crossref.org/works/10.1006/jcss.1997.1504 · Breiman 2001, https://api.crossref.org/works/10.1023/A:1010933404324 · LSTM 1997, https://api.crossref.org/works/10.1162/neco.1997.9.8.1735 · Bengio, Simard & Frasconi 1994, https://api.crossref.org/works/10.1109/72.279181
49. [S49] Netflix Prize (Wikipedia). https://en.wikipedia.org/wiki/Netflix_Prize
50. [S50] Corinna Cortes (Wikipedia). https://en.wikipedia.org/wiki/Corinna_Cortes
51. [S51] LeCun's own pages: homepage ("reads an estimated 10 percent of all the checks written in the US"), http://yann.lecun.com/ex/index.html · bio ("between 10 and 20% of all the checks in the US in the early 2000s"), http://yann.lecun.com/ex/bio.html · research page (NCR check reader and ATM), http://yann.lecun.com/ex/research/index.html
52. [S52] Bell Labs Holmdel Complex (Wikipedia; "the biggest mirror ever"; the water tower and the transistor urban legend). https://en.wikipedia.org/wiki/Bell_Labs_Holmdel_Complex
53. [S53] Gers, F., Schmidhuber, J. & Cummins, F. (2000). "Learning to Forget: Continual Prediction with LSTM." *Neural Computation* 12(10):2451–2471. https://api.crossref.org/works/10.1162/089976600300015015
54. [S54] Jelinek, F. (28 May 2004). "Some of My Best Friends Are Linguists" (LREC 2004 slides). http://www.lrec-conf.org/lrec2004/doc/jelinek.pdf
55. [S55] Schmidhuber, "Annotated History of Modern AI and Deep Learning": https://people.idsia.ch/~juergen/deep-learning-history.html · "Deep Learning: Our Miraculous Year 1990-1991": https://people.idsia.ch/~juergen/deep-learning-miraculous-year-1990-1991.html · "Fundamental Deep Learning Problem" page: https://people.idsia.ch/~juergen/fundamentaldeeplearningproblem.html
56. [S56] Thomas J. Watson Research Center (Wikipedia). https://en.wikipedia.org/wiki/Thomas_J._Watson_Research_Center
57. [S57] Hinton's directorship and NCAP: CIFAR Hinton bio ("From 2004 until 2013 he was the director of the program on 'Neural Computation and Adaptive Perception'"), https://cifar.ca/bios/geoffrey-hinton/ · CIFAR Nobel news ("Hinton and collaborators including Yoshua Bengio and David Fleet, among others, successfully proposed the launch"), https://cifar.ca/cifarnews/2024/10/08/long-time-cifar-fellow-geoffrey-hinton-awarded-2024-nobel-prize-in-physics/

---

## 12. Open items for the fact-checker

- ~~Confirm the Boser–Guyon–Vapnik 1992 COLT details and the DOI [S33].~~ **Resolved [FC]** (Crossref).
- ~~Confirm the Viola–Jones 2001 details [S40].~~ **Resolved [FC]** (Crossref). The "standard in cameras" claim is still unverified.
- ~~Confirm the exact launch date of the Netflix Prize (2 Oct 2006) and the size of the dataset.~~ **Resolved [FC]** [S49].
- ~~Get a primary source for the bet wording.~~ **Resolved [FC]**: the document image is transcribed in §7.1.
- ~~Find a primary source for NCR's June 1996 deployment date.~~ **Resolved [FC]**: LeCun et al. 1998, §X.
- ~~Confirm the 2006 citation details.~~ **Resolved [FC]** [S48].
- Bell Labs Holmdel: **resolved [FC]**; the transistor-shaped water tower is a legend [S52]. IBM Yorktown: **crescent shape resolved [FC]**; "fieldstone" is still open [S56].
- Still open: the ACM Turing profile wording ("more than 10%") and the tone of LeCun's 2012 CVPR letter. Cortes as a runner and the Viola–Jones camera adoption are also still unconfirmed.

---

## 13. Fact-check log (adversarial pass, 2026-10-05)

**Method.** I re-read the primary texts directly wherever I could:
- Breiman's *Two Cultures* (full PDF text).
- Bengio et al. 2003 (JMLR PDF).
- LeCun et al. 1998 (*Proc. IEEE*, OCR of the author PDF).
- LeCun et al. 1989 (*Neural Computation*, OCR of the author PDF) and the NIPS 1989 companion.
- The MNIST page (archived HTML).
- The *Toronto Star* article (cached HTML).
- *IEEE Spectrum*, 18 Feb 2015.
- The image of the signed Jackel–Vapnik bet.
- Jelinek's own LREC 2004 slides.
- Schmidhuber's IDSIA pages.
- Crossref records for every journal citation.
- LeCun's own homepage and bio.
- Secondary checks: CIFAR pages and Wikipedia (Deep Blue, Netflix Prize, Jelinek, Vapnik, Pearl, Bayesian network, Bottou, Holmdel, Watson, Cortes, LeCun).

Several sites (ACM, Springer, MIT Press, O'Reilly, dblp, netflixprize.com) were blocked or bot-walled.

**Key claims (from the task list).**

1. **Cortes & Vapnik 1995 (MLJ 20(3):273–297, Sept 1995).** CONFIRMED (Crossref). The Holmdel affiliation is supported by Vapnik's 1992 Holmdel address [S48]; the Springer page was blocked.
2. **AdaBoost.** CONFIRMED: LNCS 904 (1995) pp. 23–37, JCSS 55(1):119–139 (Aug 1997) and the 2003 Gödel Prize [S48][S5]. The Barcelona and March 13–15 venue details were not re-fetched (LNCS 904 is the EuroCOLT '95 volume).
3. **Breiman 2001.** CONFIRMED verbatim, including "98% of all statisti-cians", "2% of statisticians, many in other fields", the "then neural nets" typo, the "A+ ... F" passage, §7.1, and 5.1% vs 6.2%. *Random Forests* is MLJ 45(1):5–32, Oct 2001 [S8][S48].
4. **Pearl.** CORRECTED. The 1988 book consolidated Bayesian networks but did not found them: the term was coined in 1985 [S47]. The Turing citation is confirmed (secondary).
5. **LeCun 1989.** CONFIRMED (paper text): 9,298 digits, Buffalo NY, 7,291/2,007, AT&T Bell Labs Holmdel. ADDED: 5.0% raw error and 12.1% rejection for 1% error. CORRECTED: the 9% reject rate belongs only to the NIPS companion paper (superset database) [S10].
6. **Check reader.** "Several million checks per day" CONFIRMED (abstract), with the internal inconsistency noted (the intro says "per month"). June 1996 fielding is now VERIFIED-PRIMARY. **"More than 10%" is CORRECTED** to LeCun's own "an estimated 10 percent" (homepage) and "between 10 and 20% ... early 2000s" (bio). The unreliable arXiv source is dropped [S11][S51].
7. **MNIST.** CONFIRMED: 60k/10k, SD-3 Census Bureau employees and SD-1 high-school students, 0.95, 0.7, 1.4 and 12.0. NUANCE: the 1.4% Gaussian-SVM row is Burges & Schölkopf's "regular SVM", as reported in LeCun et al. 1998; the MNIST page gives no reference for it [S12][S11].
8. **Hochreiter 1991.** CONFIRMED: diploma thesis, TU Munich, in German, supervised by Schmidhuber, covering vanishing and exploding gradients. Bengio, Simard & Frasconi 1994 is confirmed as IEEE TNN 5(2):157–166, March 1994. The Schmidhuber "most important documents" phrase is confirmed and re-cited to [S55] (it was not on the Wikipedia pages cited).
9. **LSTM.** CONFIRMED: *Neural Computation* 9(8):1735–1780, Crossref date 1 Nov 1997. The abstract wording of Q13 is confirmed, so it is upgraded to PRIMARY [S48].
10. **Bengio 2003.** The 24%/8% and "approximately three weeks with 40 CPUs" are CONFIRMED verbatim. CORRECTED: the baseline numbers. On Brown, 252 vs 312 (class-based back-off); on AP, 109 vs 117 (modified KN 5-gram). The earlier text paired 252 with 117. NUANCE: the "24%" is the n-gram's excess over the network, so the network is about 19% lower; the best MLPs are mixtures with a trigram.
11. **CIFAR NCAP 2004.** CONFIRMED: proposed by Hinton with Bengio, Fleet and others; Hinton was director 2004–2013. Bengio's "It was the worst possible time," is confirmed verbatim [S57][S15].
12. **LeCun "We were outcast a little bit ...".** CONFIRMED verbatim (*Toronto Star*, 17 Apr 2015) [S15].
13. **"So-called 'Deep Learning conspiracy'", "Neural Net Winter" and "ironclad theory".** CONFIRMED (*IEEE Spectrum*, 18 Feb 2015, Lee Gomes). Schmidhuber's critique is CONFIRMED as June 2015, with the wording of Q17 [S14][S22].
14. **Jackel–Vapnik bet.** CORRECTED and upgraded to PRIMARY. The document is dated 3/14/95. Jackel's bet was that people would "understand quantitatively why big neural nets working on large databases are not so bad" (with "clear conditions and bounds"), not "a math theory". Vapnik's bet was that "no one in his right mind will use neural nets that are essentially like those used in 1995", not "nobody would use neural nets". The outcomes (each lost one; LeCun as witness) are confirmed (secondary). The signature order is Vapnik, Jackel, then LeCun [S36].
15. **Deep Blue.** CONFIRMED: 3½–2½, Equitable Center, Game 6 on 11 May 1997 in 19 moves, 480 chips, 200 million positions per second. NUANCE: Wikipedia says 30 processors, IBM says 32. The evaluation parameters "were determined by analyzing thousands of master games", so it was search plus a partly data-tuned evaluation, not neural learning. The claim of "no audience in the game room" is SOFTENED: an account mentions "a few dozen VIPs" [S23][S39].
16. **Jelinek.** CONFIRMED: IBM 1972–1993, Brown et al. 1990/1993. The wording "Whenever I fire a linguist our system performance improves" and Dec 1988 at Wayne PA are confirmed as Jelinek's own recollection in his LREC 2004 slides (PRIMARY). The original wording and date are still CONTESTED (absent from the 1988 proceedings; Moore dates a variant to 1985) [S54][S25].
17. **CVPR 2012.** CONFIRMED (secondary): rejection, letter to PC chair Serge Belongie, ICML 2012 acceptance. The inference that "attitude persisted until 2012" is CONTESTED: two deep-learning face papers were accepted at CVPR 2012, and the blogger later called his post "a joke". "Angry" is not verified [S31].
18. **Netflix Prize.** CONFIRMED: tie at 10.06% (test RMSE 0.8567), about 20 minutes earlier, a blend of many models. NUANCE: Netflix named the winner on 18 Sept 2009; 21 Sept 2009 was the award ceremony [S49][S29].

**Other changes made.**
- LeCun's Bell Labs start is now "1988"; "Oct" was not confirmed.
- Jackel's "Belief" line is rewritten to the bet's real wording.
- §4 belief #2: a paraphrase in quotation marks was replaced with the verbatim bet text.
- Hooks 1 and 2: corrected the wording; "more than one in ten" became "about one in ten".
- Holmdel water tower: the "transistor" shape is an urban legend [S52].
- IBM Yorktown building: crescent-shaped (confirmed); "fieldstone" is unconfirmed [S56].
- Kasparov staging: a few observers, no paying audience; rotating IBM team members moved the pieces.
- *Toronto Star* error flagged: it credits both 2006 papers to Hinton and Salakhutdinov.
- Verified from KNOWLEDGE, NEEDS CHECK: Boser, Guyon & Vapnik 1992; Viola & Jones 2001 (metadata); Gers et al. 2000; the 2006 citations; the Netflix launch date and 100,480,507 ratings; Commendo affiliation; Tangora 5,000 words; Cortes at Google Research NY.
- Still unverified: Cortes as a runner; Viola–Jones as "the standard" in cameras; Bengio's "fell out of fashion in the mid-90s" (S42, page inaccessible); ACM's "more than 10%"; Hinton's back injury.

**Unchanged and still valid:** Q19 (Denker, "second best way") and Q20 (Kasparov's "human hand" wording) stay UNVERIFIED. Do not use them as quotes.
