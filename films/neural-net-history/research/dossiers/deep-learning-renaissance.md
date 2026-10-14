# Dossier: The Deep Learning Renaissance — Pretraining, GPUs, ImageNet and Speech (2006–2012)

Topic id: `deep-learning-renaissance` · Film: neural-net-history · As-of: 2026-10-05
Status: draft plus verification pass (2026-10-05). **Adversarial fact-check completed 2026-10-05; corrections are applied in place and listed in section 12, "Fact-check log".** Tags:
- **[VERIFIED-PRIMARY]**: checked against the original paper, slides or the speaker's own text, retrieved and read in this pass.
- **[VERIFIED-SECONDARY]**: checked against a reputable secondary source (news report, institutional history).
- **[UNVERIFIED]**: do not state as fact, and do not quote, without a further check.

Source numbers in square brackets, e.g. [S3], refer to section 11.

---

## 1. Summary

Between 2006 and 2012, neural networks went from a career risk to the hottest idea in computing. Five things converged.

**1. A trick for depth (2006).** Neural nets had been out of fashion since the late 1990s. Deep ones (many hidden layers) were widely believed to be untrainable: gradient descent from random weights seemed to stall. Two 2006 papers from Geoffrey Hinton's group in Toronto offered a way around this.
- **Hinton, Osindero & Teh**, "A fast learning algorithm for deep belief nets" (*Neural Computation* 18(7), 2006) [S2]. It showed that a deep network can be trained **one layer at a time**: the lower layers are learned without labels, each as a restricted Boltzmann machine (RBM) that models the layer below. Labels enter only at the top, where they are "provided as part of the input" to the top-level associative memory. The whole stack is then fine-tuned [S2]. On MNIST handwritten digits the network had three hidden layers and about 1.7 million weights. It made **1.25% errors**, beating the best back-propagation nets (1.5%) and support vector machines (1.4%) on the "permutation-invariant" version of the task [S2].
- **Hinton & Salakhutdinov**, "Reducing the Dimensionality of Data with Neural Networks" (*Science* 313, 28 July 2006, pp. 504–507) [S1]. It used the same layer-by-layer pretraining to initialise deep "autoencoders". These compressed images and documents far better than principal components analysis.

Yoshua Bengio's Montréal group (2007) and Marc'Aurelio Ranzato and Yann LeCun at NYU (2006/2007) generalised the recipe. Their versions stacked autoencoders and sparse energy-based models instead of RBMs [S3][S4]. The network that brought these groups together was a CIFAR programme, "Neural Computation and Adaptive Perception", launched in 2004 [S41][S35]. The field rebranded itself as **"deep learning"** [S45][S35].

**2. The engine: GPUs (2009–2011).** NVIDIA's CUDA made gaming graphics cards programmable in C. The first CUDA GPU (G80) launched in November 2006, and the SDK went to beta in February 2007 [S43].
- Raina, Madhavan & Ng (Stanford, ICML 2009) trained deep belief nets on a GeForce GTX 280 up to **70× faster** than on a dual-core CPU. A four-layer, 100-million-parameter model dropped "from several weeks to around a single day" [S6].
- At IDSIA in Lugano, Dan Cireșan, Ueli Meier, Luca Gambardella and Jürgen Schmidhuber showed in 2010 that "good old on-line back-propagation" on a GPU reached a record **0.35%** error on MNIST. They used **no pretraining at all**, only large plain nets, deformed training images and a GTX 280 [S7].
- From 2011 their GPU convolutional nets ("DanNet") won contests: Chinese handwriting (ICDAR, May 2011) and German traffic signs (IJCNN, August 2011). On traffic signs, a committee of CNNs reached **99.46%** accuracy against an average human's **98.84%** [S8][S9].

**3. The data: ImageNet (2007–2010).** Fei-Fei Li arrived at Princeton in January 2007. Her office neighbour was Christiane Fellbaum, a linguist who had spent 20 years building **WordNet** [S15]. Li set out to fill WordNet's noun hierarchy with images. Labelling by hand looked impossible: her own back-of-envelope estimate was **≈19 years** of human effort [S12]. "In summer 2008, we discovered crowdsourcing" (Amazon Mechanical Turk) [S12].
- The CVPR 2009 paper reported 3.2 million images in 5,247 categories [S11].
- By April 2010 there were 11 million images in more than 15,000 categories [S12]. About 50,000 workers from 167 countries had cleaned the candidate images [S13][S14].
- Colleagues told Li to "do something more useful for my tenure" [S13].
- The ImageNet Large Scale Visual Recognition Challenge (ILSVRC) began in 2010 as a "taster competition" alongside PASCAL VOC. It had 1,000 categories and 1.2 million training images [S16][S17]. It ran until 2017 [S14].
- Before AlexNet, the winners used hand-designed features with SVMs: NEC-UIUC at 28.2% top-5 error in 2010, and XRCE at about 25.8% in 2011 [S17][S18].

**4. The first real-world win: speech (2009–2012).** Deep nets broke through in speech recognition before vision.
- Abdel-rahman Mohamed, George Dahl and Hinton (Toronto, NIPS 2009 workshop) reached **23.0%** phone error on TIMIT with a pretrained deep net, trained on an NVIDIA Tesla S1070 GPU [S20]. Hinton's slides give the best previous TIMIT result as 24.4% [S36].
- Dahl joined Microsoft Research Redmond as an intern in June 2010, working with Dong Yu and Li Deng [S51]. That work produced context-dependent DNN-HMMs, tested on 24 hours of Bing mobile voice-search data: a 16.0% relative sentence-error reduction over the best GMM system [S22][S23][S21]. In June 2012 Microsoft shipped the first DNN recogniser in a product, the MAVIS audio-video indexing service [S24].
- In 2011 Frank Seide, Gang Li and Yu cut Switchboard word error from **27.4% to 18.5%**, a 33% relative reduction [S21].
- Navdeep Jaitly took the Toronto model to Google during a 2011 internship [S36]. By **Android 4.1 "Jelly Bean" (mid-2012)**, "when you speak to your Android phone, chances are, you are talking to a neural network" [S27].
- In November 2012 the four groups (Toronto, Microsoft Research, Google, IBM) published a joint review in *IEEE Signal Processing Magazine* [S21].

**5. Simplifications and scale (2010–2012).**
- **Rectified linear units.** Nair & Hinton (ICML 2010) introduced them for RBMs [S28]. Glorot, Bordes & Bengio (AISTATS 2011) showed that deep rectifier nets "can reach their best performance without requiring any unsupervised pre-training" when labelled data are plentiful [S29].
- **Dropout.** Hinton, Srivastava, Krizhevsky, Sutskever & Salakhutdinov (arXiv, 3 July 2012) randomly omitted "half of the feature detectors on each training case" [S32].
- **Google Brain.** Founded in 2011 inside Google X by Jeff Dean, Greg Corrado and Andrew Ng [S40]. Its "cat" paper (Le et al., ICML 2012, Edinburgh) trained a 9-layer network with **1 billion connections** on **10 million** YouTube frames. The run used **1,000 machines (16,000 cores) for three days** [S33]. The *New York Times* headline was "How Many Computers to Identify a Cat? 16,000" [S34].

**The belief of the age, and how fast it fell.** From 2006 to roughly 2010–2011, the working belief was that **deep nets need unsupervised layer-wise pretraining**. (The end date is the film's interpretive framing, not a sourced fact; see section 4, "How long it lasted".) That belief shaped papers, workshops and the 2012 speech review. It eroded within about four to six years:
- Cireșan 2010 trained without pretraining (GPU, big data).
- Martens 2010 trained deep autoencoders without pretraining (second-order optimisation) [S31].
- Glorot & Bengio 2010 analysed why random initialisation failed [S30].
- Glorot et al. 2011 (ReLU) made pretraining unnecessary on large labelled data.
- AlexNet (December 2012) was purely supervised, with ReLU, dropout and two GPUs (see the AlexNet dossier).

By 2015 Hinton, LeCun and Bengio wrote in *Nature* that "it turned out that the pre-training stage was only needed for small data sets" [S35]. The irony: "pretraining" returned a few years later in a new form, self-supervised pretraining of transformers.

---

## 2. Timeline

| Date | Event | Sources |
|---|---|---|
| 2004 | CIFAR launches the "Neural Computation and Adaptive Perception" (NCAP) programme (CIFAR: "Founded 2004"). Hinton as its director, with Bengio and LeCun as core members, is widely reported but **[UNVERIFIED in this pass]**: the CIFAR sources read here name the programme and year, not its director. | [S41][S53][S35] |
| 8 Nov 2006 | NVIDIA launches the GeForce 8800 GTX (G80), the first GPU with the CUDA general-purpose architecture. CUDA is announced with it. | [S43] |
| Jul 2006 | Hinton, Osindero & Teh, "A fast learning algorithm for deep belief nets", *Neural Computation* 18(7):1527–1554. 1.25% MNIST error. Greedy training took "a few hours per layer in Matlab on a 3GHz Xeon processor", and total learning time was "about a week". | [S2] |
| 28 Jul 2006 | Hinton & Salakhutdinov, *Science* 313:504–507. Deep autoencoders "work much better than principal components analysis". | [S1] |
| Dec 2006 (NIPS 19, publ. 2007) | Bengio, Lamblin, Popovici & Larochelle, "Greedy Layer-Wise Training of Deep Networks" (Montréal). Ranzato, Poultney, Chopra & LeCun, "Efficient learning of sparse representations with an energy-based model" (NYU), 0.39% on MNIST. | [S3][S4][S7] |
| Jan 2007 | Fei-Fei Li joins Princeton as an assistant professor. Her office neighbour on the second floor of the CS building is Christiane Fellbaum (WordNet). | [S15] |
| 2007 | Li and Kai Li launch the ImageNet project at Princeton. | [S13][S15] |
| Feb 2007 (beta); Jun 2007 (1.0) | CUDA SDK released. | [S43] |
| Dec 2007 | NIPS in Vancouver (3–8 Dec; workshops in Whistler). Hinton recalls the programme committee rejecting a deep-learning paper because "they already accepted a paper on deep learning and two papers on the same topic would be excessive". Accounts of an unofficial CIFAR-funded deep-learning workshop that year are **[UNVERIFIED]** in detail. | [S36][S42] |
| Jul 2008 | ImageNet Mechanical Turk labelling begins: "July 2008: 0 images". | [S12] |
| Summer 2008 | "In summer 2008, we discovered crowdsourcing" (Li's 2010 slides). | [S12] |
| Dec 2008 | ImageNet reaches 3 million images and 6,000+ synsets. | [S12] |
| Jun 2009 | Deng, Dong, Socher, Li, Li & Fei-Fei, "ImageNet: A Large-Scale Hierarchical Image Database", CVPR 2009 (Miami). 3.2 million images, 5,247 synsets, 12 subtrees. Presented as a poster (**[VERIFIED-SECONDARY]**, via Quartz as reported in search results; not read directly). | [S11][S19] |
| Jun 2009 | Raina, Madhavan & Ng, ICML 2009 (Montréal): GPU DBN training up to 70× faster, on a GeForce GTX 280. | [S6] |
| Dec 2009 | Mohamed, Dahl & Hinton, "Deep Belief Networks for phone recognition", NIPS 2009 Workshop on Deep Learning for Speech Recognition and Related Applications (organisers Li Deng, Hinton, Dong Yu). TIMIT PER 23.0%. Hinton recalls telling "about 1,000 researchers they should all buy GPUs" in a talk at NIPS that year. | [S20][S36][S37] |
| Feb 2010 | Erhan, Bengio, Courville, Manzagol, Vincent & Bengio, "Why Does Unsupervised Pre-training Help Deep Learning?", JMLR 11. The peak of the pretraining orthodoxy. | [S5] |
| 1 Mar 2010 | Cireșan, Meier, Gambardella & Schmidhuber, "Deep, Big, Simple Neural Nets Excel on Handwritten Digit Recognition" (arXiv; *Neural Computation* 2010). 0.35% MNIST with plain backprop on a GPU. | [S7] |
| May 2010 | AISTATS 2010: Glorot & Bengio, "Understanding the difficulty of training deep feedforward neural networks". | [S30] |
| Jun 2010 | ICML 2010 (Haifa): Nair & Hinton, "Rectified Linear Units Improve Restricted Boltzmann Machines". Martens, "Deep learning via Hessian-free optimization", deep autoencoders trained "without using pre-training". | [S28][S31] |
| Jun 2010 | George Dahl joins Microsoft Research Redmond as an intern (Dong Yu, Li Deng). Context-dependent DNN-HMM, tested on Bing voice-search data. | [S51][S22][S23] |
| Apr 2010 | ImageNet reaches 11 million images and 15,000+ synsets (Li's slide). Wikipedia dates the Mechanical Turk labelling window July 2008 – April 2010. | [S12][S48] |
| 3 May 2010 | ILSVRC 2010 training data released. Submission deadline 30 Aug 2010. | [S16] |
| 11 Sep 2010 | ILSVRC 2010 results presented at the PASCAL VOC workshop, ECCV 2010, Crete. 35 submissions from 11 teams. Winner NEC-UIUC (top-5 flat cost 0.28). | [S16][S17] |
| Apr 2011 | AISTATS 2011 (Fort Lauderdale): Glorot, Bordes & Bengio, "Deep Sparse Rectifier Neural Networks". No pretraining needed with large labelled data. | [S29] |
| May 2011 | ICASSP 2011: Dahl, Yu, Deng & Acero present context-dependent DBN-HMMs on Bing voice search, a 16% error reduction (per Microsoft Research). | [S23][S24] |
| 2011 | Google Brain begins at Google X: Jeff Dean, Greg Corrado, Andrew Ng (Quoc Le, Rajat Monga and others in the early team). DistBelief is built. | [S40] |
| 2011 | Navdeep Jaitly (Toronto) implements the Toronto acoustic model at Google during an internship. | [S36] |
| 15 May 2011 | IDSIA GPU CNN wins the ICDAR 2011 Chinese handwriting contest (Schmidhuber's dating). | [S8] |
| Aug 2011 | IDSIA committee of CNNs wins the German Traffic Sign Recognition Benchmark at IJCNN 2011 (San Jose): 99.46% vs average human 98.84%. | [S8][S9] |
| Aug 2011 | Interspeech 2011 (Florence): Seide, Li & Yu, Switchboard WER 27.4% → 18.5%. | [S21][S25] |
| 29 Dec 2011 | Le et al. "Building High-level Features Using Large Scale Unsupervised Learning" posted to arXiv (v5 12 Jul 2012). | [S33] |
| Feb 2012 | Cireșan, Meier & Schmidhuber, "Multi-column Deep Neural Networks for Image Classification" (arXiv 1202.2745; CVPR 2012). | [S10] |
| 14 Jun 2012 | Microsoft Research blog (Rob Knies): DNN speech recognition "debuts" in a commercial product, the Microsoft Audio Video Indexing Service (MAVIS), with a "10- to 20-percent relative error reduction". | [S24] |
| 25–26 Jun 2012 | John Markoff, *New York Times*: "How Many Computers to Identify a Cat? 16,000". ICML 2012 in Edinburgh. | [S34][S33] |
| 3 Jul 2012 | Dropout paper on arXiv (1207.0580). | [S32] |
| Jul 2012 | Android 4.1 Jelly Bean ships with a DNN acoustic model for voice search. Google blog post on 6 Aug 2012. | [S27] |
| Sep 2012 | Interspeech 2012 (Portland): Jaitly, Nguyen, Senior & Vanhoucke. 5,870 h Voice Search and 1,400 h YouTube data. | [S26] |
| 30 Sep – 13 Oct 2012 | ILSVRC 2012: submission deadline 30 Sep; preliminary results to participants 8 Oct; PASCAL workshop at ECCV, Florence, 12 Oct; full results 13 Oct. AlexNet (SuperVision) 15.3% top-5 vs 26.2% for the runner-up (ISI). Covered in the AlexNet dossier. | [S18][S52] |
| Nov 2012 | Hinton et al., "Deep Neural Networks for Acoustic Modeling in Speech Recognition: The shared views of four research groups", *IEEE Signal Processing Magazine* 29(6):82–97. | [S21] |
| 2013 | Coates et al. (with Catanzaro and Ng), ICML 2013: 1-billion-parameter nets "on just 3 machines in a couple of days" using GPU servers. | [S39] |
| 28 May 2015 | LeCun, Bengio & Hinton, "Deep learning", *Nature* 521. Pretraining "was only needed for small data sets". | [S35] |
| 30 Sep 2026 | Amazon Mechanical Turk, the platform ImageNet was labelled on, "permanently closed". | [S44] |

---

## 3. People

The appearance notes are for respectful silhouette depiction only. Confirm them against dated photographs from 2006–2012 before final art. Items marked [check] are from general knowledge and not verified in this pass.

**Geoffrey Hinton** (b. 1947, London)
- **Role and place:** Professor, University of Toronto (Department of Computer Science, 10 King's College Road / 6 King's College Rd addresses on the 2006 and 2012 papers [S2][S32]). He is widely reported to have directed CIFAR NCAP (**[UNVERIFIED in this pass]**; [S41] confirms the programme and its 2004 launch, not the directorship).
- **Beliefs:** Held that the brain-inspired, learning-based approach would win. In 2006 he championed generative, unsupervised pretraining (RBMs, deep belief nets). By 2012 he was also pushing purely discriminative tricks (ReLU, dropout). In *Science* 2006 he wrote that backprop through deep autoencoders "would be very effective … provided that computers were fast enough, data sets were big enough, and the initial weights were close enough to a good solution. All three conditions are now satisfied" [S1].
- **Pictured as:** Tall and lean, with white-grey hair swept back. British manner; sweaters or open-collar shirts. Famous for working standing up because of a chronic back problem: he does not sit, and lies across the back seat of cars (**[VERIFIED-SECONDARY]**, via a secondary summary of Cade Metz's *Genius Makers* [S46]; a standing desk is a safe staging choice).

**Ruslan (Russ) Salakhutdinov**
- **Role:** PhD student of Hinton at Toronto. Co-author of the *Science* 2006 paper and the dropout paper [S1][S32].
- **Pictured as:** A young man in his late twenties in 2006, short dark hair [check].

**Simon Osindero** (Toronto postdoc) and **Yee-Whye Teh** (then at the National University of Singapore, per the paper's affiliation): co-authors of the 2006 DBN paper [S2].

**Yoshua Bengio** (Université de Montréal, DIRO)
- **Work:** Led the greedy layer-wise training paper (2007), the "Why does unsupervised pre-training help" analysis (2010), the Glorot initialisation paper (2010) and the rectifier paper (2011) [S3][S5][S30][S29].
- **Beliefs:** Argued from circuit-complexity theory that deep architectures can be "exponentially" more efficient than shallow ones [S3].
- Hinton recounts that around 2009 "A reviewer tells Yoshua Bengio that papers about neural nets have no place in ICML" [S36].
- **Pictured as:** Curly dark hair greying [check]. Usually casual: sweater, open collar.

**Xavier Glorot and Antoine Bordes**: Bengio's students and collaborators on initialisation and ReLU [S29][S30].

**Yann LeCun** (NYU Courant Institute, New York)
- **Work:** Convolutional nets since 1989. With Ranzato, Poultney and Chopra he did sparse energy-based pretraining (2006) [S4].
- Hinton's slides report that around 2010 a CVPR reviewer rejected a LeCun paper "even though it beats the state-of-the-art", saying "it tells us nothing about computer vision because everything is learned" [S36].
- Quoted in the June 2012 NYT cat article: "This is the hottest thing in the speech recognition field these days" [S34].
- **Pictured as:** Medium build, dark hair greying, often glasses [check].

**Marc'Aurelio Ranzato**: LeCun's PhD student at NYU (2006 sparse features). By 2012 he was at Google and a co-author on the cat paper [S4][S33].

**Fei-Fei Li** (Princeton 2007–2009, then Stanford)
- **Role:** Assistant professor. Created ImageNet with senior colleague Kai Li (no relation) [S13][S15].
- **Belief:** A vision system needs to see examples the way a child does. "If you consider a child's eyes as a pair of biological cameras, they take one picture about every 200 milliseconds" [S13].
- **Dissenters:** "friendly colleagues" who urged a more tenure-safe project [S13]. Olga Russakovsky put the field's view this way: "Prestige comes from building models … Most people wondered why collecting a dataset would be intellectually interesting" [S15].
- **Pictured as:** Slight build, long straight dark hair [check]. In 2007 she was a recent PhD (Caltech, 2005).

**Kai Li** (Princeton CS, systems and storage): senior faculty co-PI who "championed her project when few others did" [S15][S12].

**Jia Deng**: Kai Li's PhD student and lead author of the CVPR 2009 ImageNet paper. He later co-ran ILSVRC with Alex Berg and Fei-Fei Li [S11][S15][S17]. He called using data to build AI "a very bold hypothesis" [S15].

**Christiane Fellbaum** (Princeton, linguist)
- Joined George A. Miller's WordNet project in 1987. WordNet was begun in 1985 and had over 145,000 English words [S15].
- Credited on Li's 2010 slides as a "WordNet friend" [S12].
- "We talked often and became very friendly" [S15].
- **Pictured as:** [check photos].

**George A. Miller** (1920–2012): Princeton psychologist who started WordNet in 1985 [S15].

**Olga Russakovsky**: Stanford graduate student who co-organised ILSVRC [S15][S18].

**Andrew Ng** (Stanford; Google part-time from 2011)
- **Work:** Co-author of the 2009 GPU paper. Co-founded Google Brain [S6][S40]. Jeff Dean recalls meeting Ng at Google in 2011 when Ng had "signed on as a one-day-a-week consultant" [S40].
- **Beliefs:** Unsupervised feature learning at scale ("throw a ton of data at the algorithm") [S34]. Ng nudged Hinton toward GPUs: "I remember going to Geoff Hinton saying check out CUDA, I think it can help build bigger neural networks" (2015 GTC talk, as quoted by NVIDIA) [S38].
- **Pictured as:** Tall and slim, short dark hair, collared shirt [check].

**Jeff Dean** (Google Fellow, Mountain View)
- Co-designer of Google's large-scale infrastructure (MapReduce, Bigtable). Co-led the cat project. "We never told it during the training, 'This is a cat'" [S34].
- **Pictured as:** Medium build, close-cropped greying hair [check].

**Greg Corrado** (Google, neuroscientist by training): Google Brain co-founder and cat-paper co-author [S33][S40].

**Quoc V. Le**: Ng's Stanford PhD student working at Google. First author of the cat paper [S33].

**Rajat Raina and Anand Madhavan**: Stanford, the 2009 GPU paper [S6].

**Jürgen Schmidhuber** (IDSIA, Manno-Lugano, Switzerland)
- Co-director of IDSIA. Ran the lab whose GPU nets won four contests before AlexNet [S7][S8].
- **Beliefs:** Hardware progress "may be more important than advances in algorithms" (Cireșan et al. 2010) [S7]. A persistent critic of how credit for deep learning has been assigned [S8].
- **Pictured as:** [check photos].

**Dan Claudiu Cireșan**: Romanian postdoc at IDSIA who built the fast GPU implementations. **Ueli Meier and Luca Maria Gambardella**: IDSIA co-authors [S7].

**Abdel-rahman Mohamed**: Toronto PhD student who led the TIMIT phone-recognition work [S20][S21].

**George E. Dahl**: Toronto PhD student. Co-led the TIMIT work, then took deep nets to Microsoft Research as a 2010 intern [S20][S22][S24].

**Navdeep Jaitly**: Toronto PhD student who carried the model to Google in 2011 [S36][S26].

**Li Deng and Dong Yu** (Microsoft Research, Redmond)
- Senior speech researchers. They co-organised the NIPS 2009 speech workshop with Hinton and hosted Dahl. Yu contributed the "context-dependent" output targets (senones) [S22][S24].
- **Frank Seide** (MSR Asia, Beijing) scaled the approach to Switchboard [S24][S21].
- **Alex Acero**: MSR co-author [S22].

**Vincent Vanhoucke, Andrew Senior and Patrick Nguyen** (Google speech team): Jelly Bean deployment [S26][S27].

**Brian Kingsbury and Tara Sainath** (IBM Research): co-authors of the four-group review [S21].

**Nitish Srivastava, Alex Krizhevsky and Ilya Sutskever**: Toronto students on the dropout paper [S32].

---

## 4. The belief of the age

**The belief (c. 2006–2011):** Deep networks cannot be trained well from random initial weights by backpropagation alone. They need an **unsupervised, layer-by-layer pretraining** phase (RBMs, autoencoders or sparse coding) to put the weights "close to a good solution" before supervised fine-tuning.

**Who held it, and how it was framed:**
- **Hinton & Salakhutdinov 2006:** gradient-descent fine-tuning "works well only if the initial weights are close to a good solution" [S1].
- **Bengio et al. 2007:** "Complexity theory of circuits strongly suggests that deep architectures can be much more efficient (sometimes exponentially) than shallow architectures" [S3]. The training method was greedy layer-wise pretraining.
- **Erhan et al. 2010 (JMLR):** "The best results obtained on supervised learning tasks involve an unsupervised learning component, usually in an unsupervised pre-training phase" [S5]. Their study argued that pretraining acts as an unusual regulariser.
- **The 2012 four-group speech review** still opened its method description with the two-stage recipe: "In the first stage, layers of feature detectors are initialized, one layer at a time, by fitting a stack of generative models" [S21]. Google's 2012 Jelly Bean paper was titled "Application of *Pretrained* Deep Neural Networks…" [S26].
- **Andrew Ng's group and Google Brain** held a related belief: the future lay in *unsupervised* feature learning from unlabelled data at enormous scale. The cat paper is its high-water mark [S33][S34].

**The older background belief this replaced (1990s–2006):** Deep nets were simply not worth it. In 2015 the three pioneers wrote: "In the late 1990s, neural nets and backpropagation were largely forsaken by the machine-learning community and ignored by the computer-vision and speech-recognition communities. It was widely thought that learning useful, multistage, feature extractors with little prior knowledge was infeasible. In particular, it was commonly thought that simple gradient descent would get trapped in poor local minima" [S35]. Hinton's 2019 slides list the hostility in this period:
- the 2007 NIPS rejection;
- the ~2009 ICML reviewer;
- the ~2010 CVPR reviewer who said learned features tell "nothing about computer vision" [S36].

**Who dissented from pretraining-is-necessary, and when:**
- **IDSIA (Cireșan, Meier, Gambardella, Schmidhuber), March 2010:** plain backprop with "many hidden layers, many neurons per layer, numerous deformed training images, and graphics cards" set the MNIST record with no pretraining [S7].
- **James Martens (Toronto), ICML 2010:** "Without using pre-training, we obtain results superior to those reported by Hinton & Salakhutdinov (2006)", using second-order (Hessian-free) optimisation [S31].
- **Glorot & Bengio, AISTATS 2010:** diagnosed *why* random initialisation failed: sigmoid saturation and poorly scaled initial weights. They proposed better initialisation [S30].
- **Glorot, Bordes & Bengio, AISTATS 2011:** rectifier nets "can reach their best performance without requiring any unsupervised pre-training on purely supervised tasks with large labeled datasets" [S29].
- **Microsoft speech (Seide, Li, Yu 2011):** with context-dependent states it was "possible to outperform state-of-the-art BMMI trained GMM-HMM systems with a two-hidden-layer neural network without using any pretraining … though using more hidden layers and pretraining works even better" [S21].
- **Dropout (July 2012) and AlexNet (December 2012):** large supervised nets with ReLU and dropout, no pretraining [S32][S35].

**How long it lasted (CONTESTED as a date range; the decline was gradual):** About four to six years. It was strongest from 2006 to 2010. It was undermined by evidence from 2010 to 2011, but speech practice kept pretraining through 2012: the November 2012 four-group review still describes the two-stage recipe, while conceding that for one large task pretraining "leads to the best results but it is not critical", giving "an absolute WER reduction of less than 1%" [S21]. It was abandoned for large supervised problems after AlexNet (late 2012). The 2015 *Nature* review: "Once deep learning had been rehabilitated, it turned out that the pre-training stage was only needed for small data sets" [S35]. Hinton's 2019 slides still list "Unsupervised pre-training" as one of the tricks, alongside dropout and ReLUs [S36].

**What ended it:** three forces together.
1. **Compute:** GPUs gave 10–70× speedups [S6][S35].
2. **Data:** ImageNet's 1.2 million labelled training images, and thousands of hours of transcribed speech [S16][S26].
3. **Simple tricks:** better initialisation, ReLU and dropout [S29][S30][S32].

The Nature review sums up the speech chapter: GPUs "allowed researchers to train networks 10 or 20 times faster" [S35].

**Nuance for the film:** "pretraining" did not die. It was reborn: unsupervised and self-supervised pretraining of word embeddings and transformers became central after 2018. Hinton's 2019 summary slide says "Unsupervised learning is making a comeback" [S36]. It is fair to say the *2006 version* (greedy, layer-wise, RBM-based initialisation) was abandoned. It is not fair to say "pretraining was a mistake".

---

## 5. Experiments and results

### 5.1 Deep belief net on MNIST (Hinton, Osindero & Teh 2006) [S2]
- **Architecture:** 784 input pixels → 500 → 500 → 2,000 hidden units, with 10 label units joined to the top-level "associative memory". About 1.7 million weights.
- **Training:** Greedy layer-by-layer RBM training took "a few hours per layer in Matlab on a 3GHz Xeon processor". It was then fine-tuned with a contrastive wake-sleep algorithm. Total learning time was "about a week".
  - A footnote says the network was then left running "with a very small learning rate". "After six weeks the test error was fluctuating between 1.12% and 1.31%."
- **Result:** 1.25% test error, against SVM 1.4% and backprop 1.5% on the permutation-invariant task.
- **Visual hook:** The model is *generative*. Run backwards, it can "display what the associative memory has in mind": it dreams up digit images.

### 5.2 Deep autoencoders (Hinton & Salakhutdinov, *Science* 2006) [S1]
- **Architecture:** A deep encoder squeezes data through a tiny central "code" layer. The paper's examples: 784-1000-500-250-30 for MNIST digits, 625-2000-1000-500-30 for Olivetti face patches, and 2000-500-250-125-10 for newswire documents (a 2000-500-250-125-2 version gives the two-dimensional document map in Fig. 4). The stack of RBMs is "unrolled" into encoder and decoder, then fine-tuned with backprop.
- **Results:**
  - Two-dimensional codes for news documents separate topics far better than latent semantic analysis.
  - On MNIST classification, a pretrained 784-500-500-2000-10 network reached 1.2%, against 1.6% for randomly initialised backprop and 1.4% for SVMs.
- **Visual hook:** A funnel or hourglass network, with the image squeezed to a few numbers and re-expanded.

### 5.3 Greedy layer-wise training (Bengio et al. 2007) and sparse energy-based models (Ranzato et al. 2006) [S3][S4]
- **Bengio:** Showed that stacking ordinary autoencoders, not just RBMs, also works. Gave the theoretical motivation (depth efficiency).
- **Ranzato/LeCun:** Sparse feature learning combined with a convolutional net gave 0.39% MNIST error, the record that Cireșan's 0.35% later beat [S7].

### 5.4 GPUs enter (Raina, Madhavan & Ng, ICML 2009) [S6]
- **Machine:** NVIDIA GeForce GTX 280, 1 GB memory, "240 total cores (30 multiprocessors with 8 stream processors each)". Compared against a dual-core 3.16 GHz CPU.
- **Result:** DBN learning "up to 70 times faster". A four-layer DBN with 100 million parameters went from "several weeks to around a single day". Sparse coding was 5–15× faster.
- **Programming model:** Nvidia CUDA.

### 5.5 IDSIA "Deep, Big, Simple" (Cireșan et al. 2010) [S7]
- **Machine:** "a computer with a Core2 Quad 9450 2.66GHz processor, 3GB of RAM, and a GTX280 graphics card". The GPU sped up forward and back-propagation 40× and the elastic deformations 10×.
- **Networks:** Plain MLPs with 2 to 9 hidden layers and 1.34–12.11 million weights. The best was 2500-2000-1500-1000-500-10: 0.35% test error (35 of 10,000 digits), with 114.5 hours of training.
- **Key ingredient:** Images were deformed continuously, so "the network rarely sees any training image twice".
- **Conclusion:** "Our results show that this ongoing hardware progress may be more important than advances in algorithms and software."

### 5.6 IDSIA contest streak (2011–2012) [S8][S9][S10]
- Wins listed by Schmidhuber's dating:
  - ICDAR Chinese handwriting (May 2011)
  - IJCNN German traffic signs (August 2011)
  - ISBI neuronal-membrane segmentation (2012)
  - ICPR mitosis detection (September 2012)
- **German Traffic Sign Recognition Benchmark** (51,839 images, 43 classes):
  - Committee of CNNs: 99.46%
  - Average human: 98.84%
  - Best single human: 99.22%
  - Pierre Sermanet & LeCun's multi-scale CNN: 98.31%
  - Random forests: 96.14%

### 5.7 ImageNet construction [S11][S12][S13][S14][S15]
- **Source:** Candidate images came from web image search engines, using WordNet synonyms. Queries were expanded with ancestor words ("sheepdog, dog") and translated into Chinese, Spanish, Dutch and Italian.
- **Cleaning:** Mechanical Turk workers were shown a grid of candidate images and the WordNet definition, with the instruction "Click on the good images." There was a "Definition quiz" to make sure workers read definitions. Ambiguous words caused trouble: "Box", "Keyboard (holder … on which keys … can be hung)" [S12].
- **Li's feasibility arithmetic (2010 slide):** 40,000 synsets × 10,000 candidate images × ~3 people × 2 images/sec ⇒ "≈ 19 years". "Moral of the story: no graduate students would want to do this project!" [S12]
- **Growth:**
  - July 2008: 0 images
  - December 2008: 3 million images, 6,000+ synsets
  - April 2010: 11 million images, 15,000+ synsets [S12]
  - Final: 14,197,122 images across 21,841 synsets (the figure shown on image-net.org) [S16][S14]
- **Workforce:** "almost 50,000 workers from 167 countries … nearly a billion candidate images" (Li, TED 2015) [S13]. These are whole-project totals given in 2015, not figures for April 2010; do not pin them to the 11-million-image milestone. The Daedalus essay says "approximately fifty thousand workers from 167 countries" [S14]. Li's slide says the project "hired more than 25,000 AMT workers" during the 2008–2009 recession period [S12].
- **CVPR 2009 snapshot:** 12 subtrees (mammal, bird, fish, reptile, amphibian, vehicle, furniture, musical instrument, geological formation, tool, flower, fruit), 5,247 synsets, 3.2 million images [S11].

### 5.8 ILSVRC 2010–2011 [S16][S17][S18]
- **2010:**
  - Held as a "taster competition" with PASCAL VOC 2010: 1,000 leaf categories, 1.2 million training images, plus 50,000 new validation images and 150,000 new test images [S16][S17].
  - 150+ registrations; 35 submissions from 11 teams, including NEC-UIUC, XRCE, University of Tokyo, UC Irvine, MIT, NTU Singapore and IBM.
  - Winner NEC-UIUC at 0.28 flat top-5 cost (the results slide says "Descriptor Coding + SVM"; the IJCV retrospective specifies SIFT and LBP features, two non-linear codings and a stochastic SVM) [S17][S18]. XRCE (Fisher kernel + SVM) at 0.34.
  - Hardest categories: logwood, China tree, red beech, cap opener. Easiest: odometer, website, lunar crater [S17].
- **2011:** Winner XRCE (compressed Fisher vectors + SVM), 25.8% top-5 error (IJCV Table) [S18].
- **2012:** AlexNet. See the AlexNet dossier.

### 5.9 Speech: TIMIT, Bing, Switchboard, Google Voice [S20][S21][S22][S26][S27][S36]
- **TIMIT (Mohamed, Dahl, Hinton 2009):**
  - Input: 11 frames of acoustic coefficients.
  - Network: the 23.0% model had four hidden layers of 2,048 units plus a final 128-unit "bottleneck" layer, with 183 output labels (3 HMM states × 61 phones). Hinton's 2019 slide simplifies this to four layers of "2000 hidden units" [S20][S36].
  - Result: 23.0% phone error on the TIMIT core test set. The paper's own comparison table gives the previous best as 24.40% ("Heterogeneous Classifiers") [S20][S36].
  - Hardware: "one of the GPUs in a NVIDIA Tesla S1070 system". A pretraining pass took about 5 minutes; a fine-tuning epoch took about 13 minutes [S20].
- **Bing mobile voice search (Dahl, Yu, Deng & Acero, ICASSP 2011 / TASLP 2012):** context-dependent DBN-HMM predicting senones (tied triphone states). Absolute sentence-accuracy gains of 5.8% and 9.2% over GMM-HMM baselines [S22][S23].
- **Switchboard (Seide, Li, Yu, Interspeech 2011):** 309 hours of training data. A DNN with 7 hidden layers × 2,048 units cut WER from 27.4% to 18.5% (33% relative). That matched a speaker-adaptive GMM system trained on about 2,000 hours [S21].
- **Google Voice Input / Jelly Bean (Jaitly, Nguyen, Senior & Vanhoucke 2012):**
  - 5,870 hours of Voice Search data and 1,400 hours of YouTube data.
  - 3.7-point absolute WER gain on Voice Search (16.0% → 12.3%, from the SPM review's table; the Interspeech paper itself was not read) [S21].
  - The Google blog said the research "reduces the error rate by over 20%" [S27].
  - The SPM review reports 12.3% WER, a 23% relative reduction [S21].

### 5.10 Rectified linear units [S28][S29][S35]
- A ReLU outputs max(0, x): zero for negative input, identity for positive.
- **Nair & Hinton (2010):** derived ReLUs as an approximation to an infinite stack of binary units with shifted biases ("Stepped Sigmoid Units"). Tested on NORB objects and Labeled Faces in the Wild.
- **Glorot et al. (2011):** sparse "true zeros", no saturation on the positive side, no pretraining needed.
- **Nature 2015:** ReLU "typically learns much faster in networks with many layers, allowing training of a deep supervised network without unsupervised pre-training".

### 5.11 Dropout [S32]
- During training, each hidden unit is dropped with probability 0.5 on each training case. This "prevents complex co-adaptations in which a feature detector is only helpful in the context of several other specific feature detectors."
- Results reported:
  - MNIST record of 79 errors (mean) without prior knowledge.
  - TIMIT improvements.
  - CIFAR-10 at 15.6% error.
  - ImageNet test cases shown with top-5 guesses.
- The paper also says that "Random 'dropout' gives big improvements on many benchmark tasks and sets new records for speech and object recognition."

### 5.12 Google Brain's "cat" (Le et al., ICML 2012) [S33][S34]
- **Data:** One frame sampled from each of 10 million YouTube videos, as 200×200-pixel colour images.
- **Model:** A 9-layer locally connected sparse autoencoder with pooling and local contrast normalisation; 1 billion connections.
- **Machine:** "a cluster with 1,000 machines (16,000 cores) for three days", using model parallelism and asynchronous SGD (the DistBelief system).
- **Results:**
  - A single neuron became a face detector, robust to translation, scaling and out-of-plane rotation. Others responded to cat faces and human bodies.
  - On ImageNet with 22,000 categories: 15.8% accuracy, "a leap of 70% relative improvement over the previous state-of-the-art" (random guess: under 0.005%). This number needed *supervised* training on labelled ImageNet on top of the unsupervised features ("Starting with these learned features, we trained our network…"); without the unsupervised pretraining the same setup gave 13.6% [S33].
- **Framing:** The paper explicitly frames it as asking whether a "grandmother neuron" could be learned from unlabelled data.
- **Coverage (NYT, Markoff, 25–26 June 2012):**
  - "in Google's secretive X laboratory".
  - 16,000 processors, "more than one billion connections", "roughly doubling its accuracy" on a list of 20,000 items (the paper says 22,000 categories and 70% relative improvement; prefer the paper's numbers).
- **Coda:** In 2013 Coates, Catanzaro, Ng et al. trained 1-billion-parameter networks "on just 3 machines in a couple of days" with GPUs [S39]. Bryan Catanzaro: they "replaced 1,000 servers at Google with three servers using GPUs" [S37].

### Art-department notes on physical apparatus
- **2006 (Toronto):** Ordinary Linux/Windows workstation towers; Matlab on a 3 GHz Xeon. Weeks of runtime, with nothing glamorous to look at [S2].
- **GTX 280 (2008–2010):**
  - Physical: a long, double-slot, all-black shrouded gaming card with a single blower fan and a red-lit or black NVIDIA logo, installed in a desktop tower. Students bought these consumer cards [S6][S7] [shroud details: check product photos].
  - Silhouette: a long, rectangular slab with a circular fan cutout.
- **NVIDIA Tesla S1070:** a 1U rack-mounted box holding four GPUs, connected by cable to a host server [S20] [form factor: check product photos].
- **IDSIA, Manno near Lugano:** "Galleria 2, 6928 Manno-Lugano" [S7]. An Italian-speaking Swiss canton, with lake and mountain light.
- **Google cat (2012):** Rows of data-centre racks, with blinking LEDs and cold-aisle airflow. Juxtapose 16,000 cores with the single neuron's dreamy, ghostly "optimal stimulus" face, and the later cat image (both are figures in the paper).
- **Mechanical Turk:** A worker anywhere in the world (167 countries) clicks on a web grid of thumbnails at home. A dense mosaic of thousands of small images converges into a tree (the WordNet hierarchy: mammal → placental → carnivore → canine → dog → working dog → husky) [S11 Fig. 1].
- **Speech:** Spectrogram windows (11 frames) sliding through a deep stack of four ~2,000-unit layers (2,048 in the paper). A phone held to the mouth (Android Jelly Bean, 2012). Do not show a Windows Phone/Bing product launch: Microsoft's first shipped DNN recogniser (June 2012) was the MAVIS audio-video indexing service, not a phone [S24].

---

## 6. Verified quotes

1. **Hinton & Salakhutdinov, *Science* 313, 28 July 2006, p. 507** [S1] [VERIFIED-PRIMARY]
   > "It has been obvious since the 1980s that backpropagation through deep autoencoders would be very effective for nonlinear dimensionality reduction, provided that computers were fast enough, data sets were big enough, and the initial weights were close enough to a good solution. All three conditions are now satisfied."

   Context: the concluding paragraph of the paper. This is the thesis of the whole era in one sentence.

2. **Hinton & Salakhutdinov, abstract, *Science* 2006** [S1] [VERIFIED-PRIMARY]
   > "Gradient descent can be used for fine-tuning the weights in such 'autoencoder' networks, but this works well only if the initial weights are close to a good solution."

3. **Cireșan, Meier, Gambardella & Schmidhuber, arXiv 1003.0358 (1 Mar 2010), abstract** [S7] [VERIFIED-PRIMARY]
   > "Good old on-line back-propagation for plain multi-layer perceptrons yields a very low 0.35% error rate on the famous MNIST handwritten digits benchmark. All we need to achieve this best result so far are many hidden layers, many neurons per layer, numerous deformed training images, and graphics cards to greatly speed up learning."

4. **Same paper, conclusion** [S7] [VERIFIED-PRIMARY]
   > "Our results show that this ongoing hardware progress may be more important than advances in algorithms and software (although the future will belong to methods combining the best of both worlds)."

5. **Raina, Madhavan & Ng, ICML 2009, abstract** [S6] [VERIFIED-PRIMARY]
   > "We argue that modern graphics processors far surpass the computational capabilities of multicore CPUs, and have the potential to revolutionize the applicability of deep unsupervised learning methods."

   Also: "we are able to reduce the time required to learn a four-layer DBN with 100 million free parameters from several weeks to around a single day."

6. **Fei-Fei Li, TED2015, "How we're teaching computers to understand pictures"** [S13] [VERIFIED-PRIMARY, from the TED transcript]
   > "Some very friendly colleagues advised me to do something more useful for my tenure, and we were constantly struggling for research funding. Once, I even joked to my graduate students that I would just reopen my dry cleaner's shop to fund ImageNet. After all, that's how I funded my college years."

   Context: she says just before this, "back in 2007, it was not so obvious. We were fairly alone on this journey for quite a while."

7. **Fei-Fei Li, TED2015** [S13] [VERIFIED-PRIMARY]
   > "If you consider a child's eyes as a pair of biological cameras, they take one picture about every 200 milliseconds, the average time an eye movement is made."

8. **Fei-Fei Li, TED2015** [S13] [VERIFIED-PRIMARY]
   > "At its peak, ImageNet was one of the biggest employers of the Amazon Mechanical Turk workers: together, almost 50,000 workers from 167 countries around the world helped us to clean, sort and label nearly a billion candidate images."

9. **Fei-Fei Li, slide text, "crowdsourcing, benchmarking & other cool things" (2010 talk)** [S12] [VERIFIED-PRIMARY]
   > "Moral of the story: no graduate students would want to do this project!"
   > "In summer 2008, we discovered crowdsourcing"

   These are slide text, not spoken words. Present them as on-screen slide text.

10. **Christiane Fellbaum, quoted by Princeton CS, 2025** [S15] [VERIFIED-SECONDARY]
    > "We talked often and became very friendly."

11. **Olga Russakovsky, quoted by Princeton CS, 2025** [S15] [VERIFIED-SECONDARY]
    > "Prestige comes from building models … Most people wondered why collecting a dataset would be intellectually interesting."

    (Two consecutive sentences in the article; the ellipsis marks the break.)

12. **Jia Deng, quoted by Princeton CS, 2025** [S15] [VERIFIED-SECONDARY]: using data to build AI "was a very bold hypothesis."

13. **Jeff Dean, *New York Times* (John Markoff), online 25 June 2012; print 26 June 2012, p. B1** [S34] [VERIFIED-SECONDARY: full text checked in the NYT News Service reprint (Bend Bulletin) and a full-text copy that carries the NYT print note]
    > "We never told it during the training, 'This is a cat.'"
    > "It basically invented the concept of a cat."

14. **Andrew Ng, same NYT article** [S34] [VERIFIED-SECONDARY]
    > "A loose and frankly awful analogy is that our numerical parameters correspond to synapses"

    Ng also said: "It'd be fantastic if it turns out that all we need to do is take current algorithms and run them bigger, but my gut feeling is that we still don't quite have the right algorithm yet." Both lines match in two independent full-text copies of the article (punctuation checked).

15. **Yann LeCun, same NYT article** [S34] [VERIFIED-SECONDARY]
    > "This is the hottest thing in the speech recognition field these days"

    Context: LeCun was speaking about deep learning in *speech*, right after the article notes that Microsoft had shown the techniques worked for speech "last year". It is not a comment on the cat result.

16. **Le et al., ICML 2012, abstract** [S33] [VERIFIED-PRIMARY]
    > "Contrary to what appears to be a widely-held intuition, our experimental results reveal that it is possible to train a face detector without having to label images as containing a face or not."

17. **Vincent Vanhoucke, Google Research blog, 6 Aug 2012** [S27] [VERIFIED-PRIMARY]
    > "when you speak to your Android phone, chances are, you are talking to a neural network trained to recognize your speech."
    > "Using neural networks for speech recognition is nothing new: the first proofs of concept were developed in the late 1980s, and after what can only be described as a 20-year dry-spell, evidence that the technology could scale to modern computing resources has recently begun to emerge."

18. **Glorot, Bordes & Bengio, AISTATS 2011, abstract** [S29] [VERIFIED-PRIMARY]
    > "deep rectifier networks can reach their best performance without requiring any unsupervised pre-training on purely supervised tasks with large labeled datasets."

19. **Martens, ICML 2010, abstract** [S31] [VERIFIED-PRIMARY]
    > "Without using pre-training, we obtain results superior to those reported by Hinton & Salakhutdinov (2006) on the same tasks they considered."

20. **Hinton et al., dropout, arXiv 1207.0580, abstract** [S32] [VERIFIED-PRIMARY]
    > "This 'overfitting' is greatly reduced by randomly omitting half of the feature detectors on each training case."

21. **LeCun, Bengio & Hinton, *Nature* 521, 28 May 2015** [S35] [VERIFIED-PRIMARY, author PDF]
    > "Once deep learning had been rehabilitated, it turned out that the pre-training stage was only needed for small data sets."

22. **Same review** [S35] [VERIFIED-PRIMARY]
    > "Interest in deep feedforward networks was revived around 2006 by a group of researchers brought together by the Canadian Institute for Advanced Research (CIFAR)."

    In the original the sentence carries reference numbers after "2006"; they are dropped here.

23. **Geoffrey Hinton, recalled to VentureBeat in 2022, published 23 Feb 2023** [S37][S38] [VERIFIED-SECONDARY]
    > "In 2009, I remember giving a talk at NIPS [now NeurIPS] where I told about 1,000 researchers they should all buy GPUs because GPUs are going to be the future of machine learning."

    The bracket is VentureBeat's. Note that this is a recollection about 13 years after the event.

24. **Andrew Ng, NVIDIA GTC 2015, as quoted by NVIDIA's blog** [S38] [VERIFIED-SECONDARY]
    > "I remember going to Geoff Hinton saying check out CUDA, I think it can help build bigger neural networks"

25. **Hinton, slide text, "The Deep Learning Revolution", Royal Society of Edinburgh, 18 July 2019** [S36] [VERIFIED-PRIMARY]
    > "2007: NIPS program committee rejects a paper on deep learning by al. et. Hinton because they already accepted a paper on deep learning and two papers on the same topic would be excessive."

    The joke "al. et. Hinton" is in the original. This is Hinton's own wry retrospective, not a contemporaneous document.

**UNVERIFIED (do not use as quotes):**
- LeCun: "Neural net was again a subject of mockery" (on the rebrand to "deep learning"). Found only in a Substack profile. **UNVERIFIED — do not use as a quote.**
- The story that Hinton coined "deep learning" in a NIPS 2007 lecture on his 60th birthday and joked that everyone else was doing "shallow learning". It comes from Goodreads highlights of Metz's *Genius Makers*; the book itself was not checked. **UNVERIFIED — do not use as a quote or date.**
- "I last sat down in 2005 … and it was a mistake" (Hinton). Secondary blog only. **UNVERIFIED — do not use as a quote.** (The standing-staging is fine.)
- Hinton's account that he emailed NVIDIA asking for a free GPU and was told "no". This is a second-hand quote attributed to a magazine profile that was not checked. **UNVERIFIED — do not use as a quote.**
- A mentor (named by one Substack as Jitendra Malik) telling Li "I think you've taken this idea way too far". It is reported via Fortune and Ars Technica citing her memoir; the memoir text was not checked. **UNVERIFIED — do not use as a quote** until checked against *The Worlds I See* (2023).
- Grant reviewers calling it "shameful" that Princeton would research this (via Quartz 2017, not readable this pass). **UNVERIFIED — do not use as a quote.**
- "Further discussion of it merely incumbers the literature and befogs the mind of fellow students." This appears on Hinton's 2019 slide but is a historical quote from the continental-drift controversy, not from a neural-net reviewer. Do not attribute it to anyone in AI.

---

## 7. Debates and controversies

1. **Who deserves credit for the GPU-deep-learning breakthrough? IDSIA vs Toronto.**
   - *Schmidhuber's position:* IDSIA's GPU CNN ("DanNet") "won 4 image recognition challenges prior to AlexNet". It was "the first pure deep convolutional neural network (CNN) to win computer vision contests", and achieved "the first superhuman performance in a vision challenge" in 2011. He argues that ReLU and dropout "are not really required to win vision contests" and that AlexNet under-cited prior work [S8].
   - *Mainstream position:* the *Nature* 2015 review dates the turn for vision to "the ImageNet competition in 2012", crediting GPUs, ReLUs, dropout and data augmentation [S35]. ImageNet was a much larger, more diverse benchmark than MNIST or traffic signs.
   - *Film stance:* state both. IDSIA's GPU wins (2011) are documented fact [S9], and ImageNet 2012 is the event that changed the field's mind [S15][S35].

2. **Was pretraining necessary? (2006–2012)** See section 4.
   - For: Hinton, Bengio, Erhan et al. [S1][S3][S5].
   - Against or "not on big data": Cireșan [S7], Martens [S31], Glorot et al. [S29], Seide et al. [S21].
   - *Resolution:* not needed with large labelled data and good initialisation or ReLU; useful on small data [S35].

3. **Was ImageNet worth building? (2007–2010)**
   - *Skeptics:* "friendly colleagues" urged a more tenure-safe project; funding was a constant struggle [S13]. "Most people wondered why collecting a dataset would be intellectually interesting" [S15]. The prevailing culture focused on models, not data: "the focus on data was fairly contrarian" [S14].
   - *Li's side:* a child's visual experience implies data at a scale "thousands of times more" than existing datasets [S13].
   - *Later critiques (outside this era, but worth a line):* labour conditions on Mechanical Turk. Li's own 2010 slide asked "So are we exploiting chained prisoners?" [S12]. There were also later audits of offensive "person" categories, which belong to another dossier.

4. **"Deep learning" as rebrand vs new science.**
   - Sejnowski (2016): "Neural networks, rebranded as 'deep learning'" [S45].
   - The pioneers framed it as a revival "around 2006" with new methods [S35].
   - The phrase "deep learning" predates Hinton: Rina Dechter (1986, in constraint satisfaction) and Aizenberg et al. (2000, neural nets) [UNVERIFIED in this pass; verify before stating].
   - *Film stance:* it was partly a new name for an old programme, made credible by new results.

5. **Unsupervised vs supervised (2012).**
   - The Google cat project showed that unlabelled learning at massive scale could find "cat" and "face" neurons [S33].
   - Months later, supervised AlexNet on two GPUs beat everything on ImageNet.
   - Coates et al. (2013) replicated cat-scale networks on 3 GPU servers [S39].
   - The tension (unlabelled data plus CPU clusters, vs labelled data plus GPUs) defined late 2012.

6. **Brain analogy.** Ng himself called the synapse analogy "loose and frankly awful" [S34], while the press reached for "brain" metaphors: the NYT opened by saying the X-lab group had begun working "on a simulation of the human brain" [S34].

---

## 8. Misconceptions to avoid

- **"Hinton invented deep learning in 2006."** The 2006 papers revived interest and offered a training recipe. Deep multilayer nets, backprop, CNNs and LSTMs all predate 2006. The term is older too [S35][S45].
- **"Deep learning was born on ImageNet in 2012."** Speech recognition was already in production (Microsoft's MAVIS indexing service in June 2012; Android Jelly Bean, released to manufacturing 9 July 2012) before AlexNet's ILSVRC result, which went to participants on 8 October 2012 and was presented in Florence on 12 October [S24][S27][S52]. IDSIA's GPU nets won contests in 2011 [S9].
- **"ImageNet had 15 million images in 2009."** The CVPR 2009 paper reported 3.2 million images and 5,247 synsets [S11]. Li's TED talk compresses the timeline ("In 2009, the ImageNet project delivered a database of 15 million images across 22,000 classes") [S13]. Her own 2010 slide shows 11 million images by April 2010 [S12]. Use "3.2 million at launch, about 14 million by the early 2010s".
- **"ILSVRC used all of ImageNet."** It used a 1,000-class subset with about 1.2 million training images [S16][S17].
- **"ILSVRC began in 2009."** It began in 2010 [S16]. The Daedalus essay contains a stray "competition began back in 2009" line that conflicts with its own "2010 until 2017" [S14].
- **"The Google cat network was shown cats and learned them."** It was never given labels: one frame from each of 10 million YouTube videos [S33]. It also learned faces most strongly; the face neuron is the paper's headline result.
- **"The cat network ran on GPUs."** It ran on 16,000 CPU cores across 1,000 machines [S33]. The GPU replication came in 2013 [S39].
- **"Dropout and ReLU were invented for AlexNet."** Nair & Hinton 2010 [S28] and the July 2012 dropout preprint [S32] came first. Rectifier-like units also have older roots (Fukushima), which Schmidhuber emphasises [S8].
- **"CUDA was created for deep learning."** It was a general-purpose GPU computing platform (2006–2007). Deep learning adopted it later (2009 onward) [S43][S6].
- **"Pretraining was proven wrong."** It was shown to be *unnecessary for large labelled datasets* [S35]. Pretraining returned in a different form with transformers.
- **"Hinton told NVIDIA to make deep-learning chips in 2009."** He told NIPS attendees to *buy GPUs*, by his own later recollection [S37].
- **Speech result framing:** Mohamed, Dahl & Hinton's 23.0% PER was on TIMIT, a small *phone*-recognition benchmark, not word error [S20]. The big word-error drops came on Bing voice search, Switchboard and Google Voice Search [S21][S22].
- **Depiction:** Do not show Fei-Fei Li and Kai Li as related; they are not ("no relation") [S15].

---

## 9. Curiosity hooks

1. **Nineteen years.** Fei-Fei Li calculated that labelling ImageNet with students would take about 19 years. Her slide's moral: "no graduate students would want to do this project!" With crowdsourcing, her slide's growth chart goes from 0 images in July 2008 to 11 million in April 2010: under two years [S12].
2. **The office next door.** ImageNet began because Li's new office at Princeton (January 2007) was next to Christiane Fellbaum's. Fellbaum had spent 20 years on WordNet, the dictionary-tree that became ImageNet's skeleton [S15].
3. **The platform that built the data has closed.** Amazon Mechanical Turk, which recruited almost 50,000 people in 167 countries to clean ImageNet, "permanently closed on September 30, 2026", five days before this film's "now" [S44][S13].
4. **A gaming card beat a decade of hand-crafted methods.** In 2010 a single consumer graphics card (GTX 280) let "good old on-line back-propagation" set the MNIST world record, with no new algorithm needed [S7].
5. **Machines beat people at reading road signs in 2011.** A committee of IDSIA GPU nets scored 99.46% on German traffic signs. The average human scored 98.84%, and even the best human tested scored 99.22% [S9].
6. **Your phone got there first.** Deep learning's first mass-market win was not seeing but *hearing*. Jelly Bean shipped in July 2012, and on 6 August Google wrote that "when you speak to your Android phone, chances are, you are talking to a neural network trained to recognize your speech" [S27]. That was about three months before AlexNet's October 2012 ImageNet result [S52].
7. **16,000 cores to find a cat; three machines a year later.** Google's 2012 network used 1,000 machines for three days [S33]. In 2013 the same scale ran "on just 3 machines in a couple of days" with GPUs [S39].
8. **"Two papers on the same topic would be excessive."** Hinton's dry account of NIPS rejecting a 2007 deep-learning paper because it had already accepted one [S36].
9. **Knocking out half the brain makes it smarter.** Dropout randomly silences half the neurons on every training example, and the network generalises *better* [S32].
10. **A week on one CPU.** The 2006 deep belief net took "about a week" to learn in Matlab, with greedy training at "a few hours per layer" on a 3 GHz Xeon. The team then left it running for six more weeks with a tiny learning rate; the test error wandered "between 1.12% and 1.31%" [S2].

---

## 10. Visual and dramatic details

- **Toronto, 2006:** University of Toronto CS department, King's College Road. A Canadian winter, with snow on Victorian and modern brick. Hinton standing at a desk (his back), with a whiteboard of stacked RBMs (pairs of layers joined by symmetric lines). Matlab windows on a beige-era CRT/LCD. Possible motif: the "ravines in the free-energy landscape" from the DBN abstract [S2].
- **Montréal and New York:** Bengio's Université de Montréal (DIRO, Pavillon André-Aisenstadt, on the slope of Mont Royal) [check building]. LeCun's NYU Courant in Greenwich Village. These three cities form a "Canadian triangle" (Toronto, Montréal, plus LeCun's NYU), knitted together by CIFAR [S41].
- **Princeton, 2007–2009:**
  - The CS building, second floor, with neighbouring offices (Li and Fellbaum) [S15].
  - A wall-sized WordNet tree: mammal → placental → carnivore → canine → dog → working dog → husky [S11 Fig. 1].
  - A "wombat" entry in the 2009 ImageNet web interface [S15].
  - Mechanical Turk workers around the globe at night and day, each clicking "the good images" in a grid [S12].
  - Period details: recession years 2008–2009; Li's slide notes the platform "hired more than 25,000 AMT workers" during the downturn [S12].
- **Miami, CVPR 2009:** The ImageNet poster in a crowded poster hall (poster status [VERIFIED-SECONDARY] only). Quartz reported ImageNet-branded pens handed out [UNVERIFIED detail].
- **Crete, ECCV 2010 (11 September 2010):** A small PASCAL VOC workshop room on a Mediterranean island, where the first ILSVRC results were read out: 35 submissions, 11 teams [S16][S17].
- **Lugano/Manno, IDSIA:** Lake Lugano and the pre-Alps. A desktop tower with a GTX 280 running elastic deformations of digits, each digit wobbling like a reflection in water [S7]. A traffic-sign montage: 43 German sign classes, many blurred, dark or partly hidden (the GTSRB data) [S9].
- **Stanford and Mountain View:** Ng's lab, then Google X ("secretive X laboratory") [S34]. Rows of servers and 16,000 cores. Out of the noise of 10 million YouTube thumbnails, a ghostly face slowly resolves, then a cat face [S33].
- **Whistler, December 2009:** The NIPS workshops took place at Whistler ski resort (official 2007 workshops: Westin and Hilton Whistler [S42]). The speech workshop co-organised by Deng, Hinton and Yu took place there [S20]. Snow, ski lodges, laptops in a conference room. A dramatic place for the speech-recognition alliance to form (Microsoft and Toronto) [check exact venue for 2009].
- **Redmond, summer 2010:** Microsoft Research, with a Toronto PhD intern (Dahl) bringing deep nets to the Bing voice-search team [S22][S24].
- **Phones:** A 2012 Android phone (Jelly Bean) with the microphone icon [S27]. (Bing voice search was the *research dataset* for Microsoft's 2010–2011 work; no source here documents a 2012 Bing phone launch with DNNs [S22][S24].)
- **Sound design idea:** A spectrogram scrolling as eleven-frame windows feed a tower of four ~2,000-unit layers [S36][S20].
- **Colour and mood arc:** grey winter (2006, orthodoxy is hostile) → warm GPU glow (2009–2010) → a global mosaic of images (ImageNet) → the quiet triumph of a phone that understands speech (2012) → a data centre that "invented the concept of a cat" (June 2012). This leads straight into AlexNet.

---

## 11. Sources

- [S1] Hinton, G. E. & Salakhutdinov, R. R. (2006). Reducing the Dimensionality of Data with Neural Networks. *Science* 313:504–507, 28 July 2006.
  - PDF: https://www.cs.toronto.edu/~hinton/absps/science.pdf
  - DOI: https://www.science.org/doi/10.1126/science.1127647
- [S2] Hinton, G. E., Osindero, S. & Teh, Y.-W. (2006). A fast learning algorithm for deep belief nets. *Neural Computation* 18(7):1527–1554. https://www.cs.toronto.edu/~hinton/absps/fastnc.pdf
- [S3] Bengio, Y., Lamblin, P., Popovici, D. & Larochelle, H. (2007). Greedy Layer-Wise Training of Deep Networks. NIPS 19. https://papers.nips.cc/paper_files/paper/2006/file/5da713a690c067105aeb2fae32403405-Paper.pdf
- [S4] Ranzato, M., Poultney, C., Chopra, S. & LeCun, Y. (2007). Efficient Learning of Sparse Representations with an Energy-Based Model. NIPS 19. http://yann.lecun.com/exdb/publis/pdf/ranzato-06.pdf
- [S5] Erhan, D., Bengio, Y., Courville, A., Manzagol, P.-A., Vincent, P. & Bengio, S. (2010). Why Does Unsupervised Pre-training Help Deep Learning? *JMLR* 11. https://www.jmlr.org/papers/volume11/erhan10a/erhan10a.pdf
- [S6] Raina, R., Madhavan, A. & Ng, A. Y. (2009). Large-scale Deep Unsupervised Learning using Graphics Processors. ICML 2009.
  - PDF: https://ai.stanford.edu/~ang/papers/icml09-LargeScaleUnsupervisedDeepLearningGPU.pdf
  - ACM: https://dl.acm.org/doi/10.1145/1553374.1553486
- [S7] Cireșan, D. C., Meier, U., Gambardella, L. M. & Schmidhuber, J. (2010). Deep, Big, Simple Neural Nets Excel on Handwritten Digit Recognition. https://arxiv.org/abs/1003.0358
- [S8] Schmidhuber, J. DanNet: the CUDA CNN of Dan Ciresan in Jurgen Schmidhuber's team won 4 image recognition challenges prior to AlexNet (web essay). https://people.idsia.ch/~juergen/DanNet-triggers-deep-CNN-revolution-2011.html
- [S9] Stallkamp, J., Schlipsing, M., Salmen, J. & Igel, C. (2012). Man vs. computer: Benchmarking machine learning algorithms for traffic sign recognition. *Neural Networks* 32:323–332.
  - Article: https://www.sciencedirect.com/science/article/abs/pii/S0893608012000457
  - Results table: https://benchmark.ini.rub.de/gtsrb_results.html
- [S10] Cireșan, D., Meier, U. & Schmidhuber, J. (2012). Multi-column Deep Neural Networks for Image Classification. https://arxiv.org/abs/1202.2745
- [S11] Deng, J., Dong, W., Socher, R., Li, L.-J., Li, K. & Fei-Fei, L. (2009). ImageNet: A Large-Scale Hierarchical Image Database. CVPR 2009. https://www.image-net.org/static_files/papers/imagenet_cvpr09.pdf
- [S12] Fei-Fei Li (2010). "ImageNet: crowdsourcing, benchmarking & other cool things" (talk slides). https://www.image-net.org/static_files/papers/ImageNet_2010.pdf
- [S13] Fei-Fei Li (2015). How we're teaching computers to understand pictures. TED2015 transcript. https://www.ted.com/talks/fei_fei_li_how_we_re_teaching_computers_to_understand_pictures/transcript
- [S14] Li, F.-F. & Krishna, R. (2022). Searching for Computer Vision North Stars. *Daedalus*.
  - Article: https://www.amacad.org/publication/daedalus/searching-computer-vision-north-stars
  - PDF: https://www.amacad.org/sites/default/files/publication/downloads/Daedalus_Sp22_06_Li.pdf
- [S15] Schwarz, Julia (22 Sept 2025, Princeton Computer Science; reposted on Princeton University news 3 Oct 2025). In the hallways of Princeton, a fascination with the human mind unlocked the power of deep learning.
  - https://www.cs.princeton.edu/node/6767
  - https://www.princeton.edu/news/2025/10/03/hallways-princeton-fascination-human-mind-unlocked-power-deep-learning
- [S16] ImageNet Large Scale Visual Recognition Challenge 2010 (ILSVRC2010), official page. https://image-net.org/challenges/LSVRC/2010/
- [S17] Berg, A., Deng, J. & Fei-Fei, L. (2010). Large Scale Visual Recognition Challenge 2010 (results slides). https://image-net.org/static_files/files/pascal_ilsvrc.pdf
- [S18] Russakovsky, O. et al. (2015). ImageNet Large Scale Visual Recognition Challenge. *IJCV*. https://arxiv.org/abs/1409.0575
  - Secondary summaries for 2011 XRCE 25.8%: https://aiimpacts.org/time-for-ai-to-cross-the-human-performance-range-in-imagenet-image-classification/
- [S19] Gershgorn, D. (2017). The data that transformed AI research—and possibly the world. *Quartz*, 26 July 2017. https://qz.com/1034972/the-data-that-changed-the-direction-of-ai-research-and-possibly-the-world (not directly readable in this pass; details via search summaries)
- [S20] Mohamed, A., Dahl, G. & Hinton, G. (2009). Deep Belief Networks for phone recognition. NIPS 2009 Workshop on Deep Learning for Speech Recognition and Related Applications. https://www.cs.toronto.edu/~asamir/papers/NIPS09.pdf
- [S21] Hinton, G., Deng, L., Yu, D., Dahl, G., Mohamed, A., Jaitly, N., Senior, A., Vanhoucke, V., Nguyen, P., Sainath, T. & Kingsbury, B. (2012). Deep Neural Networks for Acoustic Modeling in Speech Recognition: The shared views of four research groups. *IEEE Signal Processing Magazine* 29(6):82–97.
  - Proof PDF: https://www.cs.toronto.edu/~hinton/absps/DNN-2012-proof.pdf
  - IEEE: https://ieeexplore.ieee.org/document/6296526
- [S22] Dahl, G. E., Yu, D., Deng, L. & Acero, A. (2012). Context-Dependent Pre-Trained Deep Neural Networks for Large-Vocabulary Speech Recognition. *IEEE TASLP* 20(1). https://www.cs.toronto.edu/~gdahl/papers/DBN4LVCSR-TransASLP.pdf
- [S23] Dahl, Yu, Deng & Acero (2011). Large Vocabulary Continuous Speech Recognition with Context-Dependent DBN-HMMs. ICASSP 2011. https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/CD-DNN-HMM-ICASSP2011.pdf
- [S24] Microsoft Research blog (14 June 2012). Deep-Neural-Network Speech Recognition Debuts. https://www.microsoft.com/en-us/research/blog/deep-neural-network-speech-recognition-debuts/
- [S25] Seide, F., Li, G. & Yu, D. (2011). Conversational Speech Transcription Using Context-Dependent Deep Neural Networks. Interspeech 2011. https://www.isca-speech.org/archive/interspeech_2011/seide11_interspeech.html (numbers taken from [S21])
- [S26] Jaitly, N., Nguyen, P., Senior, A. & Vanhoucke, V. (2012). Application of Pretrained Deep Neural Networks to Large Vocabulary Speech Recognition. Interspeech 2012.
  - ISCA: https://www.isca-speech.org/archive/interspeech_2012/jaitly12_interspeech.html
  - Google: https://research.google/pubs/application-of-pretrained-deep-neural-networks-to-large-vocabulary-speech-recognition/
- [S27] Vanhoucke, V. (6 Aug 2012). Speech Recognition and Deep Learning. Google Research blog. https://research.google/blog/speech-recognition-and-deep-learning/
- [S28] Nair, V. & Hinton, G. E. (2010). Rectified Linear Units Improve Restricted Boltzmann Machines. ICML 2010. https://www.cs.toronto.edu/~hinton/absps/reluICML.pdf
- [S29] Glorot, X., Bordes, A. & Bengio, Y. (2011). Deep Sparse Rectifier Neural Networks. AISTATS 2011, JMLR W&CP 15. https://proceedings.mlr.press/v15/glorot11a/glorot11a.pdf
- [S30] Glorot, X. & Bengio, Y. (2010). Understanding the difficulty of training deep feedforward neural networks. AISTATS 2010.
  - Page: https://proceedings.mlr.press/v9/glorot10a.html
  - PDF: https://proceedings.mlr.press/v9/glorot10a/glorot10a.pdf
- [S31] Martens, J. (2010). Deep learning via Hessian-free optimization. ICML 2010. https://www.cs.toronto.edu/~jmartens/docs/Deep_HessianFree.pdf
- [S32] Hinton, G. E., Srivastava, N., Krizhevsky, A., Sutskever, I. & Salakhutdinov, R. R. (2012). Improving neural networks by preventing co-adaptation of feature detectors. https://arxiv.org/abs/1207.0580
- [S33] Le, Q. V., Ranzato, M., Monga, R., Devin, M., Chen, K., Corrado, G. S., Dean, J. & Ng, A. Y. (2012). Building High-level Features Using Large Scale Unsupervised Learning. ICML 2012 (Edinburgh). https://arxiv.org/abs/1112.6209
- [S34] Markoff, J. (online 25 June 2012; print 26 June 2012, p. B1). How Many Computers to Identify a Cat? 16,000. *The New York Times*. NYT URL: https://www.nytimes.com/2012/06/26/technology/in-a-big-network-of-computers-evidence-of-machine-learning.html (not machine-readable this pass)
  - NYT News Service reprint: https://bendbulletin.com/2012/06/26/how-many-computers-to-identify-a-cat-16000/
  - Copy: https://davidbader.net/post/20120625-nytimes-cat/
- [S35] LeCun, Y., Bengio, Y. & Hinton, G. (2015). Deep learning. *Nature* 521:436–444.
  - Article: https://www.nature.com/articles/nature14539
  - Author PDF: https://www.cs.toronto.edu/~hinton/absps/NatureDeepReview.pdf
- [S36] Hinton, G. (2019). The Deep Learning Revolution (slides, Royal Society of Edinburgh, 18 July 2019). https://rse.org.uk/wp-content/uploads/2021/08/Hintons-Presentation_20190718.pdf
- [S37] Goldman, S. (23 Feb 2023). How Nvidia dominated AI — and plans to keep it that way as generative AI explodes. VentureBeat. https://venturebeat.com/ai/how-nvidia-dominated-ai-and-plans-to-keep-it-that-way-as-generative-ai-explodes
- [S38] Merritt, R. (4 Dec 2023). Why GPUs Are Great for AI. NVIDIA blog. https://blogs.nvidia.com/blog/why-gpus-are-great-for-ai/
- [S39] Coates, A., Huval, B., Wang, T., Wu, D., Catanzaro, B. & Ng, A. (2013). Deep learning with COTS HPC systems. ICML 2013, PMLR 28(3):1337–1345. https://proceedings.mlr.press/v28/coates13.html
- [S40] Google Brain founding:
  - https://en.wikipedia.org/wiki/Google_Brain (lead only)
  - Jeff Dean's NeurIPS 2024 account (recap): https://www.turing.com/blog/agi-icons-3-recap
  - https://www.historyofinformation.com/detail.php?id=5165
- [S41] CIFAR (2019/2020). Annual Report of the CIFAR Pan-Canadian AI Strategy (NCAP history). https://cifar.ca/wp-content/uploads/2020/04/ai_annualreport2019_web.pdf
- [S42] NIPS 2007 conference page (venues: Hyatt Regency Vancouver; workshops in Whistler). https://nips.cc/Conferences/2007
- [S43] GPU and CUDA history:
  - TechSpot, History of the Modern Graphics Processor, Part 4: https://www.techspot.com/article/659-history-of-the-gpu-part-4/
  - NVIDIA Fermi whitepaper: https://www.nvidia.com/content/pdf/fermi_white_papers/nvidiafermicomputearchitecturewhitepaper.pdf
  - https://en.wikipedia.org/wiki/GeForce_8_series
- [S44] Amazon Mechanical Turk closure:
  - https://www.mturk.com/help
  - https://techcrunch.com/2026/07/05/amazon-will-stop-accepting-new-customers-for-mechanical-turk/
  - https://www.cnbc.com/2026/08/25/amazon-service-that-jeff-bezos-called-artificial-ai-is-shutting-down.html
- [S45] Sejnowski, T. (2016). The Neural Net Reloaded. Edge. https://www.edge.org/response-detail/26629
- [S46] Intelliphants. The story of the British 'Godfather of AI' – who's not sat down since 2005 (secondary; cites Metz, *Genius Makers*). https://intelliphants.com/the-story-of-the-british-godfather-of-ai-whos-not-sat-down-since-2005/
- [S47] Metz, C. (2021). *Genius Makers*. Dutton. (Not read in this pass; cited via secondary sources only.) https://www.goodreads.com/notes/57473123-genius-makers/30630347-krishna-chaitanya-venkata/2243318a-76ae-4ef0-bd87-e75ae24a3154
- [S48] ImageNet (Wikipedia, lead for Biederman's 30,000-category estimate and the July 2008–April 2010 labelling window). https://en.wikipedia.org/wiki/ImageNet
- [S49] Biederman, I. (1987). Recognition-by-components. *Psychological Review* 94(2):115–147. https://doi.org/10.1037/0033-295X.94.2.115
- [S50] ICML 2012, Edinburgh. https://icml.cc/2012/
- [S51] Chang, J. (29 Aug 2011). Speech Recognition Leaps Forward. Microsoft Research blog ("In June 2010, intern George Dahl, from the University of Toronto, joined the team"). https://www.microsoft.com/en-us/research/blog/speech-recognition-leaps-forward/
- [S52] ImageNet Large Scale Visual Recognition Challenge 2012 (ILSVRC2012), official page (timeline: deadline 30 Sep 2012; preliminary results 8 Oct; workshop 12 Oct, ECCV Florence; full results 13 Oct). https://image-net.org/challenges/LSVRC/2012/
- [S53] CIFAR, Learning in Machines & Brains programme page ("Founded 2004"). https://cifar.ca/research-programs/learning-in-machines-brains/
- [S54] Stallkamp, Schlipsing, Salmen & Igel (2012), author PDF, Table 2 (99.46 IDSIA; 99.22 human best individual; 98.84 human average; 98.31 Sermanet; 96.14 random forests). https://christian-igel.github.io/paper/MvCBMLAfTSR.pdf

---

## 12. Fact-check log (adversarial pass, 2026-10-05)

**Method.** Primary texts were downloaded and their text searched directly: Hinton, Osindero & Teh 2006 (fastnc.pdf); Hinton & Salakhutdinov 2006 (science.pdf); Raina, Madhavan & Ng 2009; Cireșan et al. arXiv 1003.0358; Mohamed, Dahl & Hinton NIPS 2009 workshop paper; the SPM 2012 review proof; LeCun, Bengio & Hinton 2015 (author PDF); Hinton's RSE 2019 slides; Li's 2010 ImageNet slides; the CVPR 2009 ImageNet paper; the ILSVRC 2010 results slides and the 2010 and 2012 challenge pages; Russakovsky et al. IJCV (arXiv 1409.0575); the dropout preprint; Glorot, Bordes & Bengio 2011; Martens 2010; Le et al. arXiv 1112.6209; Dahl et al. TASLP 2012; Erhan et al. JMLR 2010; Bengio et al. NIPS 2006; Coates et al. ICML 2013; the CIFAR 2019 AI annual report. Web pages were read for the TED2015 transcript (raw HTML), the Princeton CS article, the Google Research blog (6 Aug 2012), two Microsoft Research blog posts, two full-text copies of the NYT cat article, the NVIDIA blog, VentureBeat, Schmidhuber's DanNet page, the GTSRB results table (Wayback) and the Stallkamp et al. author PDF, and mturk.com, TechCrunch and CNBC for the 2026 Mechanical Turk closure.

**Key claims (from the task list).** Confirmed unless noted.
1. DBN 1.25% vs backprop 1.5% vs SVM 1.4%; "a few hours per layer in Matlab on a 3GHz Xeon processor"; "total learning time about a week": **confirmed** [S2]. **Corrected nuance:** training was not wholly label-free, because labels are "provided as part of the input" when the top-level associative memory is trained. The lower layers are unsupervised.
2. *Science* 313, 28 July 2006; "All three conditions are now satisfied"; "much better than principal components analysis": **confirmed verbatim** [S1]. **Corrected:** the face autoencoder was 625-2000-1000-500-30, not 784-1000-500-250-30 (that is the digits net). The document net is 2000-500-250-125-10, with a -2 variant for the map.
3. Nature 2015 sentence on the CIFAR revival "around 2006": **confirmed verbatim** [S35]. NCAP "Founded 2004" is **confirmed** [S41][S53]. Bengio (greedy layer-wise, NIPS 19) and Ranzato/LeCun (sparse energy-based, 0.39% MNIST) are **confirmed** [S3][S7]. **Unverifiable this pass:** that Hinton *directed* NCAP. It is widely reported, but the CIFAR documents read here do not state it, so it is now tagged.
4. Raina et al.: GTX 280, CUDA, "up to 70 times faster than a dual-core CPU implementation", "several weeks to around a single day", four-layer DBN with 100 million parameters: **confirmed verbatim** [S6].
5. Cireșan et al.: 0.35%, "Good old on-line back-propagation", GTX280, no pretraining, deformations, arXiv 1 March 2010; the 114.5 h figure and the hardware sentence: **confirmed** [S7].
6. GTSRB at IJCNN 2011: 99.46 / 98.84 average human / 99.22 best individual human / 98.31 / 96.14: **confirmed** from the Stallkamp et al. Table 2 and the official results table [S54][S9]. Dataset: more than 50,000 images, 43 classes (39,209 training + 12,630 test = 51,839). Schmidhuber dates the win to 6 Aug 2011 [S8].
7. ImageNet at Princeton 2007; Li arrived January 2007, second floor, neighbour Fellbaum; WordNet begun 1985, Fellbaum joined 1987, over 145,000 words; Kai Li "(no relation)", who "championed her project when few others did"; CVPR 2009 figures of 3.2 million images, 5,247 synsets, 12 subtrees: **confirmed** [S15][S11]. **Citation corrected:** the Princeton article's author is Julia Schwarz, and it was published by Princeton CS on 22 Sept 2025 and reposted on 3 Oct 2025.
8. "≈ 19 years" slide arithmetic; "July 2008: 0 images"; "Dec 2008: 3 million images, 6000+ synsets"; "April 2010: 11 million images, 15,000+ synsets"; "almost 50,000 workers from 167 countries … nearly a billion candidate images": **confirmed** [S12][S13]. **Corrected:** the 50,000 workers and the billion images are project totals stated in 2015, not figures as of April 2010. The hook "Crowdsourcing made it about two and a half years" is **wrong**: the slide shows 0 to 11 million images between July 2008 and April 2010, under two years.
9. TED2015 "Some very friendly colleagues advised me to do something more useful for my tenure, and we were constantly struggling for research funding" and the dry-cleaner line: **confirmed verbatim**, with the preceding "back in 2007, it was not so obvious. We were fairly alone on this journey for quite a while." Russakovsky's "Prestige comes from building models" and "Most people wondered why collecting a dataset would be intellectually interesting." are **confirmed** [S13][S15].
10. ILSVRC 2010: "taster competition" with VOC2010, 1,000 categories, 1.2 million training images, 35 submissions from 11 teams, 150+ registrations, NEC-UIUC 0.28, XRCE 0.34, workshop 11 Sept 2010 at ECCV in Crete: **confirmed** [S16][S17]. **Added:** 150,000 test images. SIFT and LBP features for NEC are **confirmed via IJCV** [S18]; they are not on the challenge page.
11. TIMIT 23.0% phone error rate; Tesla S1070; NIPS 2009 workshop; previous best 24.40%: **confirmed** [S20][S36]. **Corrected:** the best net had four hidden layers of 2,048 units plus a 128-unit bottleneck layer, not "four layers of 2,000". The paper also gives the timings: about 5 min per pretraining pass and about 13 min per fine-tuning epoch, on one GPU of the S1070.
12. Seide, Li & Yu: 27.4% → 18.5%, 33% relative, 309 h, 7 × 2,048: **confirmed** [S21]. Dahl's internship began June 2010 (**confirmed** [S51]). Bing figures (5.8/9.2 absolute; 16.0/23.2% relative) are **confirmed** [S22]. **Corrected:** Microsoft's June 2012 product debut was the **MAVIS** audio-video indexing service, not Bing voice search [S24]. Bing voice search was the research dataset (24 h). No source read here documents when Bing's production voice search adopted DNNs, so "improved Bing voice search" now means the research result only. The production claim is **unverifiable**.
13. Jaitly's 2011 internship and "By 2012, its was being used for voice search on the Android" (Hinton's slide, typo in original) are **confirmed** [S36]. The Vanhoucke blog of 6 Aug 2012 is **confirmed verbatim** [S27]. Jelly Bean was released to manufacturing on 9 July 2012. AlexNet's results came in October 2012 [S52], so "before AlexNet" is **confirmed**. **Corrected:** the gap was about three months, not "two months", and the "September 2012" dating of AlexNet's result is wrong (30 Sept was the submission deadline).
14. SPM 29(6), November 2012, the four groups (Toronto, MSR, Google, IBM): **confirmed** [S21].
15. Nair & Hinton 2010; Glorot et al. 2011 quote; dropout "randomly omitting half of the feature detectors on each training case", arXiv 1207.0580: **confirmed verbatim** [S28][S29][S32]. MNIST "mean of 79 errors" and CIFAR-10 15.6% are **confirmed**.
16. Cat paper: 9-layer (the paper: "can be interpreted as a nine-layered network"), 1 billion connections, 10 million 200×200 frames, "1,000 machines (16,000 cores) for three days", 15.8% on 22,000 categories, 70% relative: **confirmed** [S33]. **Corrected nuance:** the 15.8% figure needed supervised training on labelled ImageNet on top of the unsupervised features. Google Brain's 2011 start with Dean, Corrado and Ng is **verified-secondary** (Wikipedia, Dean recap) [S40].
17. NYT, Markoff: print 26 June 2012, p. B1, "How Many Computers to Identify a Cat? 16,000"; online 25 June. Dean's "We never told it during the training, 'This is a cat,'" and "It basically invented the concept of a cat." are **confirmed** in two full-text copies [S34]. **Corrected:** the NYT phrase is "a simulation of the human brain", not "simulating the human brain". Ng's "gut feeling" line is now given in full.
18. Nature 2015 "Once deep learning had been rehabilitated, it turned out that the pre-training stage was only needed for small data sets." is **confirmed verbatim** [S35]. **CONTESTED as framing:** the 2006–2010 "belief window" with abandonment "by 2012" is interpretive, and the dossier had been internally inconsistent (2006–2010 vs 2006–2011). Speech practice kept pretraining through 2012: the SPM review describes the two-stage recipe and says pretraining "leads to the best results but it is not critical" (<1% absolute WER) [S21]. The text now says the decline was gradual.
19. Hinton's "In 2009, I remember giving a talk at NIPS [now NeurIPS] where I told about 1,000 researchers they should all buy GPUs…" is **confirmed** in VentureBeat (Sharon Goldman, 23 Feb 2023; "Hinton told VentureBeat last fall", i.e. 2022) and NVIDIA's blog (Rick Merritt, 4 Dec 2023), which adds a comma after "[now NeurIPS]". Ng's "I remember going to Geoff Hinton saying check out CUDA, I think it can help build bigger neural networks" (GTC talk) is **confirmed** as quoted by NVIDIA. When Ng said this to Hinton is **unverifiable**, because the quote has no date.

**Other checks (confirmed):**
- The Nature 2015 "largely forsaken", "10 or 20 times faster", ReLU "learns much faster" and "until the ImageNet competition in 2012" sentences.
- Hinton's RSE slide lines: the 2007 NIPS "al. et. Hinton" rejection, the ~2009 ICML reviewer, the ~2010 CVPR reviewer, and "Unsupervised learning is making a comeback".
- The Erhan et al. JMLR 11 (published 2/10) sentence.
- The Bengio et al. "Complexity theory of circuits…" sentence.
- The Martens sentence.
- Le et al.'s "Contrary to what appears to be a widely-held intuition…" and "grandmother neuron".
- Coates et al.'s "1 billion parameter networks on just 3 machines in a couple of days".
- Ranzato's 0.39% (as cited by Cireșan).
- The DBN six-week footnote (1.12%–1.31%); hook 10 reworded so it no longer paraphrases the motive.
- Teh's 2006 affiliation (National University of Singapore).
- The DanNet win dates (15 May 2011, 6 Aug 2011, 1 Mar 2012, 10 Sep 2012) as Schmidhuber gives them.
- The XRCE 2011 result (25.8%) and NEC 2010 (28.2%) per the IJCV tables.
- GeForce 8 series release on 8 Nov 2006.
- Mechanical Turk "permanently closed on September 30, 2026" (mturk.com; TechCrunch 5 Jul 2026; CNBC 25 Aug 2026).
- The MSR "10- to 20-percent relative error reduction" (blog by Rob Knies, 14 Jun 2012).

**Structural fixes:**
- The April 2010 ImageNet row was moved into date order.
- The ILSVRC 2012 row now gives the deadline, preliminary-results, workshop and full-results dates.
- New sources [S51]–[S54] were added.
