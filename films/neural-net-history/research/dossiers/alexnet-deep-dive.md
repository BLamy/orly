# Dossier: AlexNet in Depth (ImageNet 2012 and the Morning After, 2012–2015)

Topic id: `alexnet-deep-dive` · Film: neural-net-history · As-of: 2026-10-05 · Deep dive: yes
Status: draft plus verification pass. The NeurIPS 2012 paper [S1] and the SuperVision workshop slide deck [S5] were read in full as extracted text. The ILSVRC 2012/2013/2014 results pages, the ZF, VGG, GoogLeNet, PReLU and ResNet papers, Karpathy's human-baseline post and the CHM release were read directly. **Adversarial fact-check completed 2026-10-05.** Corrections were made in place; see section 12, Fact-check log.

Status tags:
- **[VERIFIED-PRIMARY]**: checked against the original paper, results page, slide deck, or the speaker's or institution's own text.
- **[VERIFIED-SECONDARY]**: checked against a reputable secondary source.
- **[DERIVED]**: our own arithmetic from primary numbers. The working is shown, and the film may state it as "by our count".
- **[UNVERIFIED]**: do not state as fact, and do not quote.

Source numbers such as [S1] refer to section 11.

---

## 1. Summary

By the **30 September 2012** deadline (extended on 17 September; SuperVision's own submission date is not published) a team from the University of Toronto, entered as **"SuperVision"**, submitted its results to the ImageNet Large Scale Visual Recognition Challenge (ILSVRC‑2012). The team was graduate students **Alex Krizhevsky** and **Ilya Sutskever** with their supervisor **Geoffrey Hinton** [S3][S4]. Their best entry put the right answer outside its top five guesses on **15.3%** of the test images (top‑5 error 0.15315). The next team, **"ISI" of the University of Tokyo**, scored **26.2%** (0.26172). ISI used hand-engineered image features (SIFT and others) encoded as **Fisher Vectors** and fed to linear classifiers [S3]. Every other team's best entry fell between 26.2% and 34.5%. The margin, 10.9 points, was larger than the progress the field had made over the previous years combined. **[VERIFIED-PRIMARY]**

The system became known as **AlexNet**. It is a deep **convolutional neural network (CNN)** with **five convolutional layers and three fully connected layers**, about **60 million parameters** and **650,000 neurons** [S1]. It was trained by plain supervised learning on about **1.2 million labelled images** in 1,000 categories, on **two NVIDIA GTX 580 graphics cards with 3 GB each**, for **five to six days** (about 90 passes through the data) [S1]. The machine sat in Krizhevsky's bedroom at his parents' house [S9]. Almost none of its parts were new on their own. Convolutional networks dated to LeCun (1989/1998), and before him Fukushima's neocognitron (1980). What was new was the combination and the scale:
- **ReLU** units, which trained about six times faster on a test network [S1][S14].
- **Dropout**, a regularisation trick published by Hinton's group only months earlier [S13].
- Heavy **data augmentation**.
- **Overlapping max-pooling** and **local response normalisation**.
- Above all, Krizhevsky's hand-tuned **CUDA GPU code** (*cuda-convnet*), which made a net this size trainable at all [S1][S9].

The result was presented on **12 October 2012** in Florence at the ILSVRC workshop of the European Conference on Computer Vision (ECCV). The talk was the last of the session, 17:05–17:30 [S4]. By Fei‑Fei Li's first-hand account (memoir text known to us only through reader highlights), the room was so packed that Yann LeCun stood against the back wall. Hinton did not attend because of a chronic back problem [S23][S24]. (He could not sit, so flying was out; two months later he reached Lake Tahoe lying down on a bus, a train and a taxi [S17].) Veteran vision researchers were sceptical, but within two years the field had switched [S9]. In the "morning after":
- **December 2012:** Hinton auctioned the three-person company **DNNresearch** from a hotel room at Harrah's, Lake Tahoe, during the NIPS conference. The bidders were Baidu, Google, Microsoft and DeepMind. Google won at **US$44 million**, and the deal was announced in **March 2013** [S17][S19].
- **2013–2015:** Successors cut ImageNet error from 15.3% to 11.2% (Clarifai/ZFNet, 2013), then 7.3% (VGG) and 6.7% (GoogLeNet, 2014), and finally **3.57%** (ResNet, Microsoft Research, December 2015) [S28][S30][S31][S32][S34]. That last figure was below the **5.1%** that one trained human, Andrej Karpathy, scored in 2014 on a 1,500-image sample [S35]. The "superhuman" framing that followed is contested (section 7).
- **20 March 2025:** The Computer History Museum, with Google, released the original 2012 source code under a BSD‑2 licence [S9][S12].

Hinton's own summary, given to the CHM: **"Ilya thought we should do it, Alex made it work, and I got the Nobel Prize."** [S9][S10]

**Teen-level intuition.** A CNN is a stack of pattern detectors. The first layer slides 96 small stencils (11×11 pixels) across the photo and reports where each one matches; it ends up learning edges at all angles and blobs of colour (Figure 3 of the paper). Each later layer slides stencils over the previous layer's "where-did-it-match" maps, so detectors build on detectors: edges, then textures, then parts, then objects. Nobody designs the stencils. They start as random noise, and backpropagation nudges every one of the 60 million numbers, a tiny bit at a time, toward whatever reduces the network's mistakes. In 2012 the field's consensus was that good features had to be designed by experts, such as SIFT and HOG. AlexNet showed that with enough data and enough arithmetic, learned features beat designed ones by a mile.

---

## 2. Timeline

| Date | Event | Sources | Status |
|---|---|---|---|
| 1959 | Hubel & Wiesel report orientation-selective "simple cells" in cat visual cortex. This is the biological ancestor of AlexNet's first-layer edge detectors. | [S52] | VERIFIED-SECONDARY (classic) |
| 1980 | Fukushima's neocognitron: a hierarchical, shift-tolerant visual network. | [S1 cites lineage via S47]; see prior dossiers | context |
| 1989–1998 | LeCun et al. train convolutional networks with backprop on handwritten digits. The 1998 *Proc. IEEE* paper describes **LeNet‑5**: 32×32 input, roughly 60K trainable parameters. AlexNet's paper cites LeCun's 1990 NIPS paper [15]. | [S47][S1] | LeNet‑5 parameter count VERIFIED-SECONDARY (commonly reported; re-check §II.B of S47 before stating an exact number) |
| 2009 (CVPR, June) | Deng, Dong, Socher, Li, Li & Fei‑Fei publish "ImageNet: A Large-Scale Hierarchical Image Database". AlexNet's ref. [6]. | [S1] | VERIFIED-PRIMARY (as cited) |
| 2009 | Krizhevsky's master's thesis / tech report "Learning multiple layers of features from tiny images", which introduces the CIFAR‑10/100 datasets. | [S1 ref 12][S16] | VERIFIED-PRIMARY (as cited) |
| 2010 | First ILSVRC. The winner averaged six sparse-coding models: 47.1% top‑1 and 28.2% top‑5 error. | [S1 Table 1] | VERIFIED-PRIMARY |
| June 2010 | Nair & Hinton, "Rectified linear units improve restricted Boltzmann machines", ICML 2010. AlexNet takes the name "ReLU" from this paper. | [S1][S14] | VERIFIED-PRIMARY |
| 9 Nov 2010 | NVIDIA's GeForce GTX 580 (Fermi) consumer gaming card launches, the first card of the GeForce 500 series. AlexNet uses 3 GB variants. | [S1][S58] | VERIFIED-SECONDARY (fact-check: launch date from Wikipedia "GeForce 500 series") |
| 2011 | Cireșan, Meier, Masci, Gambardella & Schmidhuber (IDSIA, Lugano) show fast GPU CNNs winning smaller benchmarks. AlexNet cites them as refs [4][5]. | [S44][S45][S1] | VERIFIED-PRIMARY |
| 2011 | Sutskever, who believed neural-network performance would scale with data, convinces Krizhevsky to train a CNN on ImageNet, with Hinton as principal investigator. In 2011 Hinton also canvassed sceptics. Jitendra Malik (Berkeley) told him to prove it on a standard benchmark, and ImageNet was the one suggested. | [S9][S11][S23][S24][S25] | CHM part VERIFIED-PRIMARY (institutional history); Malik part VERIFIED-SECONDARY (Li memoir via reader highlights; Wikipedia) |
| 7 May 2012 | ILSVRC‑2012 announced. Training and validation data released 15–16 June. Test images released early July (10 July per news item). | [S4] | VERIFIED-PRIMARY |
| 3 July 2012 | Hinton, Srivastava, Krizhevsky, Sutskever & Salakhutdinov post "Improving neural networks by preventing co-adaptation of feature detectors" (dropout), arXiv:1207.0580. It already reports a **one-GPU** ImageNet‑2010 CNN: 48.6% error without dropout, **42.4% with dropout**, top‑1. Trained "on a single NVIDIA GTX 580 GPU", taking "roughly four days with dropout and two days without". | [S13] | VERIFIED-PRIMARY (fact-check: arXiv v1 dated 2012-07-03). The 42.4% used 50% dropout in the sixth hidden layer. |
| 11 Sep 2012 | ILSVRC‑2012 submission server opens. | [S4] | VERIFIED-PRIMARY |
| 17 Sep 2012 | Deadline extended to 30 September ("There will be no more extension"). | [S4] | VERIFIED-PRIMARY |
| **30 Sep 2012** | Submission deadline: "September 30, 2012 (Sunday, 23:00 GMT)". SuperVision's entries are in by then; the exact day they submitted is not published. | [S4] | VERIFIED-PRIMARY (deadline only) |
| 8 Oct 2012 | Preliminary results sent to participants. | [S4] | VERIFIED-PRIMARY |
| **12 Oct 2012** | ILSVRC‑2012 workshop inside the PASCAL VOC workshop at ECCV 2012, Florence. Fei‑Fei Li gives the overview at 15:30, then OXFORD_VGG at 16:00, ISI at 16:40, and **SuperVision 17:05–17:30**, followed by discussion until 18:00 (the PASCAL page lists the ILSVRC block as 15:30–18:15). Krizhevsky presents. Earlier that day, 14:30–15:00, Jitendra Malik gave an invited PASCAL talk, "The Three R's of Computer Vision". | [S4][S7][S9][S23] | VERIFIED-PRIMARY |
| 13 Oct 2012 | Full results published. | [S4] | VERIFIED-PRIMARY |
| 19 Oct 2012 | Creation date of the published SuperVision slide PDF (LibreOffice Impress). Slides were added to the ILSVRC site on 21 Oct. | [S5][S4] | VERIFIED-PRIMARY (PDF metadata) |
| 3–8 Dec 2012 | NIPS 2012, at the Harrah's/Harveys casino hotels at Lake Tahoe on the California–Nevada line. The AlexNet paper appears in *Advances in NIPS 25*, pp. 1097–1105. During the meeting Hinton auctions DNNresearch from **Room 731**. | [S1][S17][S18][S59] | Paper VERIFIED-PRIMARY. NIPS dates "Mon Dec 3rd through Sat the 8th, Harrahs and Harveys, Lake Tahoe" VERIFIED-PRIMARY [S59]. Auction details VERIFIED-SECONDARY (fact-check: Wired excerpt of 16 Mar 2021 read directly). |
| 12–13 Mar 2013 | Google's acquisition of DNNresearch Inc. announced. Terms undisclosed at the time; Metz later reports $44M. Hinton goes part-time at Google. Krizhevsky and Sutskever move to Google. | [S19][S20][S21][S17] | VERIFIED-PRIMARY (U of T release text via Engadget) |
| Nov 2013 | Zeiler & Fergus, "Visualizing and Understanding Convolutional Networks" (arXiv:1311.2901). This is ZFNet: AlexNet with a 7×7 stride‑2 first layer, 14.8% test top‑5 for an ensemble. | [S29] | VERIFIED-PRIMARY |
| ILSVRC 2013 (autumn) | Classification winner **Clarifai** (Matthew Zeiler): 11.197% with extra data, 11.743% on original data only. Third place "ZF" (Zeiler & Fergus, NYU) 13.5%. OverFeat (NYU incl. LeCun) 14.2%. | [S28] | VERIFIED-PRIMARY |
| 2 Sep 2014 | Karpathy publishes his human-vs-GoogLeNet experiment: **5.1%** human top‑5 error on 1,500 test images, versus GoogLeNet's 6.8% on the same images. | [S35] | VERIFIED-PRIMARY |
| Sep 2014 | VGG (Simonyan & Zisserman, Oxford, arXiv:1409.1556, 16–19 weight layers) and GoogLeNet (Szegedy et al., Google, arXiv:1409.4842, 17 Sep 2014, 22 layers). | [S31][S32] | VERIFIED-PRIMARY |
| ILSVRC 2014 | Classification: GoogLeNet **6.656%**, VGG **7.325%** (2nd). VGG wins localisation. | [S30] | VERIFIED-PRIMARY |
| 6 Feb 2015 | He, Zhang, Ren & Sun (Microsoft Research) PReLU paper: 4.94% top‑5. Claimed "the first to surpass human-level performance (5.1%, Russakovsky et al.)". | [S33] | VERIFIED-PRIMARY |
| 11 Feb 2015 | Ioffe & Szegedy (Google), Batch Normalization (arXiv:1502.03167): "4.9% top-5 validation error (and 4.8% test error), exceeding the accuracy of human raters" (4.82% per the ILSVRC server). | [S40] | VERIFIED-PRIMARY (fact-check) |
| 2 June 2015 | ILSVRC organisers announce Baidu's "Deep Image" team broke the test-submission rules: about 200 submissions from 30 accounts, against a limit of 2 per week. Baidu is barred for 12 months. Baidu fires team lead Ren Wu, who denies wrongdoing. | [S37][S38][S39] | VERIFIED-SECONDARY |
| 10 Dec 2015 | He, Zhang, Ren & Sun, "Deep Residual Learning for Image Recognition" (ResNet). The ensemble scores **3.57%** top‑5 error and wins ILSVRC 2015. Up to 152 layers, "8× deeper than VGG nets but still having lower complexity". | [S34] | VERIFIED-PRIMARY |
| 8 Oct 2024 | Nobel Prize in Physics to John Hopfield and Geoffrey Hinton. | [S55] | VERIFIED-PRIMARY (see earlier dossier) |
| **20 Mar 2025** | CHM blog (Hansen Hsu) announces release of the **original 2012 AlexNet source code** on GitHub (`computerhistory/AlexNet-Source-Code`, BSD‑2‑Clause), after **five years** of negotiation with Google. | [S9][S10][S11][S12] | VERIFIED-PRIMARY |

---

## 3. People

> Depiction note: silhouettes only. No invented dialogue. The descriptions below are of widely published public photographs. They are for respectful shape-language (posture, hair outline, glasses), not likeness.

**Alex Krizhevsky.** PhD student, Department of Computer Science, University of Toronto, supervised by Hinton.
- **Role:** First author, "Alex made it work" [S9]. He wrote *cuda-convnet*, the hand-optimised CUDA library for training CNNs on NVIDIA GPUs, first used on CIFAR‑10 [S1][S9][S16]. He extended it to two GPUs and spent about a year tweaking and retraining the ImageNet network. Training ran on a computer with two NVIDIA cards **in his bedroom at his parents' house** [S9][S11].
- **Presenter:** Gave the Florence talk alone [S9][S23].
- **Later:** Joined Google via DNNresearch in 2013 [S19]. He has kept a very low public profile and gives almost no interviews. The CHM credits him only with "additional clarifications" [S9].
- **Background:** **UNVERIFIED.** The current Wikipedia article [S56] (checked 2026-10-05) gives no birthplace or birth year; it lists him as a Canadian computer scientist, "Year of birth missing". Do not state a birthplace.
- **Beliefs:** We found no first-person statement of his beliefs. Don't put views in his mouth.
- **Pictured as:** Young man in his mid-20s in 2012, slim, short dark hair, casual student clothes such as T-shirt or hoodie. Few photographs exist. In Li's account his presentation was understated; she wrote that "his personal presentation didn't quite live up to the gravity of his work" [S24].

**Ilya Sutskever.** PhD student, University of Toronto (Hinton's group).
- **Role:** Co-author, "Ilya thought we should do it" [S9]. Per CHM, he "believed that the performance of neural networks would scale with the amount of data available" and in 2011 "convinced fellow Toronto graduate student Alex Krizhevsky" to train a CNN on ImageNet [S9].
- **Later:** Google Brain (2013), co-founder of OpenAI (2015), later Safe Superintelligence.
- **Belief at the time:** That big nets plus big data would work, a minority view then. In a 2023 GTC conversation with Jensen Huang he summarised the fit: NVIDIA's blog prints two fragments in quotation marks, attributed to Sutskever: "The ImageNet dataset and a convolutional neural network were a great fit for GPUs" … "made it unbelievably fast to train something unprecedented" [S48]. The two fragments are separated by the blog's own words, so check the video before quoting them as one sentence.
- **Background:** Born 1986 in Gorky (Nizhny Novgorod), USSR. Emigrated to Israel as a child, then Canada as a teen [S56]. VERIFIED-SECONDARY.
- **Pictured as (2012):** Mid-20s, dark hair (later receding; close-cropped in later years), intense posture, plain shirts.

**Geoffrey Hinton.** University Professor, Department of Computer Science, University of Toronto (also CIFAR).
- **Role:** Principal investigator, "I got the Nobel Prize" [S9]. Co-author of the 1986 backprop paper, of ReLU-in-RBMs (2010) [S14] and of dropout (2012) [S13].
- **Belief:** For decades, that learned distributed representations in deep nets would beat hand-engineered AI. In 2012 this was a minority view in computer vision.
- **Absent from Florence:** Li: "Hinton couldn't attend because of a chronic back problem", "so he'd sent Alex Krizhevsky in his place" [S24]. Metz: by December 2012 he "hadn't taken a seat for seven years". He reached Lake Tahoe by lying down on a bus, a train and a taxi [S17].
- **At the auction:** Ran it standing up. The laptop "sat on a trash can turned upside down on a table" in Room 731, "so that Hinton could type while standing up" [S17].
- **Birthday:** The Google dinner at Harrah's during NIPS fell on Hinton's 65th birthday [S17].
- **Later:** Part-time at Google from 2013 [S19]. Shared the 2024 Nobel Prize in Physics [S55].
- **Born:** 1947, Wimbledon, London.
- **Pictured as (2012):** Mid-60s, tall and lean, short grey-white hair, a slight stoop or the upright stance of someone who cannot sit, sweater or open-collar shirt. British.

**Fei‑Fei Li.** Associate professor at Stanford in 2012, previously Princeton. Creator of ImageNet [S1 ref 6] and lead organiser of ILSVRC‑2012 with Jia Deng, Alex Berg, Sanjeev Satheesh, Hao Su and Aditya Khosla [S1 ref 7][S6].
- **At Florence:** Gave the opening overview at 15:30 [S4].
- **Belief:** That data at scale was the missing ingredient. Her memoir *The Worlds I See* (2023) frames 2012 as the convergence of her bet on data with Hinton's bet on neural nets [S23][S24]. She says she was surprised that the winning solution was a neural network.
- **On the trip:** She describes a rushed journey: "I spent more time traveling to and from Florence than I did on the ground." That is a reader-highlight transcription; verify against print [S24].
- **Born:** 1976, Beijing. Emigrated to the US as a teenager.
- **Pictured as (2012):** Age 36 (born 3 July 1976 [S60]), shoulder-length straight black hair, professional jacket.

**Yann LeCun.** Professor, New York University (Courant).
- **Work:** Pioneer of convolutional networks, LeNet [S47].
- **At Florence:** Present at the workshop, standing at the back [S24]. Per the CHM, he "pronounced it a turning point for AI" [S9]. That is the CHM's paraphrase; the often-quoted exact words are UNVERIFIED (section 6).
- **Before 2012:** A famously frustrated outsider in the vision community. He wrote an open letter to CVPR program chairs saying he was giving up on submitting to vision conferences after convnet papers were rejected (section 4). The primary text was not retrieved.
- **Pictured as:** Early 50s in 2012, dark-rimmed glasses, short dark/greying hair, often a jacket over an open shirt. French.

**Jitendra Malik.** Professor, UC Berkeley. A leading figure in computer vision and a friendly sceptic of neural nets. Per Li's memoir and Wikipedia, in 2011 he challenged Hinton to show results on a standard benchmark. He suggested PASCAL VOC first and then, when Hinton said it was too small, ImageNet [S24][S25][S57]. Invited speaker at the PASCAL VOC 2012 workshop, the same afternoon, 14:30–15:00 [S7]. (Reader highlights of Li's memoir confirm Hinton's call to "Jitendra, a longtime friend who was skeptical", and the "too small" exchange. The ImageNet suggestion itself rests on Wikipedia's summary of the memoir.) *Pictured as:* Early 50s in 2012 (born 11 October 1960 [S57]), grey hair, glasses.

**The ISI team (University of Tokyo).** The runners-up: Naoyuki Gunji, Takayuki Higuchi, Koki Yasumoto, Hiroshi Muraoka, Yoshitaka Ushiku, Tatsuya Harada and Yasuo Kuniyoshi.
- **Method:** The team abstract describes Fisher Vectors and Graphical Gaussian Vectors over dense SIFT, CSIFT, LBP and GIST features, with passive-aggressive linear classifiers. The scoring entry (0.26172) is described only as a "Weighted sum of scores from each classifier with SIFT+FV, LBP+FV, GIST+FV, and CSIFT+FV" [S3]. Say "Fisher Vectors".
- **Naming:** "ISI" is the team's label (the lab name), not the University of Southern California's Information Sciences Institute. Do not confuse the two.

**Oxford VGG 2012 team.** Karen Simonyan, Yusuf Aytar, Andrea Vedaldi and Andrew Zisserman: Fisher vectors, 27.0% [S3]. Two years later, Simonyan & Zisserman built VGG‑16/19 CNNs [S31]. This is a neat arc: a hand-feature team became a deep-net team.

**XRCE/INRIA.** Florent Perronnin, Zeynep Akata, Zaid Harchaoui and Cordelia Schmid: Fisher Vectors, 27.1% [S3]. Perronnin's Fisher-vector line won ILSVRC‑2011 [S31 intro].

**Google side of the auction.** Alan Eustace, head of engineering, reportedly flew his own plane to Lake Tahoe. Jeff Dean was also there [S17]. VERIFIED-SECONDARY.

**Demis Hassabis / DeepMind.** One of four bidders. Metz calls it "a two-year-old London startup". It "bid with company shares, not cash" and soon dropped out [S17]. VERIFIED-SECONDARY.

**Later protagonists (2013–2015).**
- **Matthew Zeiler & Rob Fergus** (NYU; Zeiler founded Clarifai) [S28][S29].
- **Karen Simonyan & Andrew Zisserman** (Oxford) [S31].
- **Christian Szegedy et al.** (Google) [S32].
- **Kaiming He, Xiangyu Zhang, Shaoqing Ren and Jian Sun** (Microsoft Research Asia, Beijing) [S33][S34].
- **Andrej Karpathy** (Stanford PhD student; the "human baseline") [S35].
- **Olga Russakovsky** (lead author of the ILSVRC IJCV paper) [S36].

---

## 4. The belief of the age

**What the vision field believed (c. 2005–2012).**
- Object recognition = **hand-engineered local features** (SIFT 1999/2004, HOG 2005, LBP, GIST), then an **encoding** step (bag of visual words, spatial pyramids, then high-dimensional **Fisher Vectors**), then a **linear SVM** or similar classifier.
- Progress came from cleverer features and encodings, plus part-based models (Deformable Part Models) for detection.
- ILSVRC 2010–2012 was dominated by this pipeline. The 2010 winner was sparse coding at 28.2% top‑5 [S1]. The 2011 winner was XRCE's Fisher vectors [S31 intro]. In 2012, every non-Toronto entry was this kind of system, at 26–34% [S3].
- Neural networks were seen as:
  - slow to train;
  - hungry for data that did not exist;
  - fiddly, with "black magic" hyperparameters;
  - theoretically unattractive next to convex SVMs;
  - proven only on small, constrained tasks such as digits and traffic signs.
- AlexNet's paper itself notes that CNNs "have still been prohibitively expensive to apply in large scale to high-resolution images" [S1]. **[VERIFIED-PRIMARY for the paper's own framing]**

**Who held it.** The mainstream of CVPR/ICCV/ECCV, broadly. The best-documented emblem of the period is LeCun's open letter to CVPR program chairs, written before the ImageNet result. It was widely reproduced, and the reproductions we found are secondary. Per those reproductions, it complained that reviewers treated end-to-end learning without hand-crafted features as a negative, and it ended "So, I'm giving up on submitting to computer vision conferences altogether." LeCun himself later tweeted that the paper concerned (Farabet et al., scene parsing) was rejected from CVPR 2011 and accepted at ICML 2012. **[VERIFIED-SECONDARY; primary text not retrieved, so do not quote without finding the original Google+ post or an archive]**

**Who dissented.**
- Hinton's Toronto group: Krizhevsky, Sutskever, Salakhutdinov and others.
- LeCun's NYU group (Farabet, Sermanet, Kavukcuoglu, Ranzato).
- Bengio's Montreal group.
- Schmidhuber's IDSIA group: Cireșan's GPU CNNs won several smaller competitions in 2011–2012 [S44][S45].
- Andrew Ng's Stanford/Google Brain work on large unsupervised nets ("cat paper", 2012). Prior dossier; not re-verified here.
- Within vision, Fei‑Fei Li was not a neural-net partisan. Her dissent was that data scale mattered more than the field believed [S23].

**How long it lasted.** Hand-feature dominance in large-scale recognition ran roughly from SIFT (1999) to 2012. The flip was fast:
- In 2012, one CNN entry among 6 teams on the results page [S3].
- By ILSVRC 2013, every one of the top five classification teams used convnets (Clarifai, NUS, ZF, Andrew Howard, OverFeat). NUS, in second, was a hybrid: it rectified "all outputs from CNNs" and combined them with its "refined PASCAL VOC12 winning solution" [S28].
- By 2014, the top entries were all deep CNNs [S30].

CHM: "Before AlexNet, almost none of the leading computer vision papers used neural nets. After it, almost all of them would." [S9]

**What ended it.**
1. The margin, 15.3% versus 26.2% [S3].
2. Transfer: ImageNet-trained CNN features beat hand features on other tasks (for example R‑CNN on PASCAL detection, 2013–14) [S25][S57].
3. Reproducibility: *cuda-convnet* was public, so others could replicate it. Zeiler & Fergus replicated the single-model validation result to "within 0.1% of their reported value" [S29].
4. Rapid successors (section 5).

**What lingered.** Sceptics argued that ImageNet classification did not require localisation. PASCAL VOC detection was the accepted benchmark, and the community remained cautious about generality until R‑CNN [S25]. Also, AlexNet's own paper still said it expected unsupervised pre-training to help: "we did not use any unsupervised pre-training even though we expect that it will help" [S1]. In practice the field moved to purely supervised training at scale. **[VERIFIED-PRIMARY]**

---

## 5. Experiments and results

### 5.1 The data
- **ImageNet** (2012 statement in paper): ">15 million labeled high-resolution images" in "roughly 22,000 categories", collected from the web and labelled via Amazon Mechanical Turk [S1].
- **ILSVRC subset:** about 1,000 images per class, in 1,000 classes: about **1.2 million training, 50,000 validation and 150,000 test images** [S1][S4].
  - [S4] says the 2012 validation and test data total "150,000 photographs", of which "50,000 of the images with labels" are validation. That leaves **100,000 test images**, and Karpathy confirms "the full test set of 100,000 images" [S35].
  - The paper's "1.2 million training images, 50,000 validation images, and 150,000 testing images" sits in its general description of ILSVRC, next to the sentence about ILSVRC‑2010. It matches the 2010 split, so it is not loose phrasing about 2012.
  - The film should say "about 1.2 million training photos" and, for 2012, "100,000 test images" [S4][S35]. **[VERIFIED-PRIMARY]**
- **Preprocessing:**
  - Rescale the shorter side to 256 and centre-crop to **256×256**.
  - Subtract the mean image.
  - Otherwise use "raw RGB values" [S1].
  - The slide deck shows "An input image (256x256) [minus] The mean input image" [S5].
- **Storage:** "only 27GB of disk storage is needed", with images stored as JPEG and decoded in parallel with training. The run used "about 2GB of RAM on each GPU, and around 5GB of system memory" [S5]. **[VERIFIED-PRIMARY]**

### 5.2 The machine (for the art department)
- **Two NVIDIA GeForce GTX 580 3GB** consumer gaming graphics cards [S1].
  - The paper: "A single GTX 580 GPU has only 3GB of memory, which limits the maximum size of the networks that can be trained on it" [S1].
  - Peak about **1.58 TFLOPS** FP32 each [S50 Epoch, citing TechPowerUp].
  - The GTX 580 was NVIDIA's top **Fermi (GF110)** gaming card of late 2010: dual-slot, about 27 cm long, with a blower fan and black shroud with green accents in the reference design. The reference card shipped with 1.5 GB; 3 GB versions came from board partners. *[Card appearance and memory variants from general knowledge; the TechPowerUp page returned 403. Treat visual details as plausible, not as a specific photographed card.]*
- **Location:** "a computer with two NVIDIA cards in Krizhevsky's bedroom at his parents' house" [S9]. *Contested in one source:* NVIDIA's 2023 blog says "a few GeForce GTX 580 GPUs in a University of Toronto lab" [S48]. Prefer the CHM: it thanks Krizhevsky for "additional clarifications", and Hinton reviewed its text. The CHM blog includes "a rare photograph of the home computer with GPUs used to create AlexNet" [S9]. The art department should look at that photo before designing the machine.
- **Software:** Python/C++/CUDA [S5]. The slides describe a four-stage pipeline running in parallel [S5]:
  1. "Train on batch n (on GPUs)"
  2. "Copy batch n+1 to GPU memory"
  3. "Transform batch n+2 (on CPU)"
  4. "Load batch n+3 from disk (on CPU)"
  
  This makes a lovely visual: a four-lane conveyor.
- **The GPUs talk directly:** "Current GPUs are particularly well-suited to cross-GPU parallelization, as they are able to read from and write to one another's memory directly, without going through host machine memory." [S1]
- **Training time:** "between five and six days to train on two GTX 580 3GB GPUs" [S1]. The workshop slides say "about a week" [S5], as does the ILSVRC entry description [S3].

### 5.3 The architecture, layer by layer

Paper description [S1, §3.5 and Fig. 2]: eight learned layers, "the first five are convolutional and the remaining three are fully-connected". ReLU follows every conv and FC layer. LRN follows conv1 and conv2. Max-pooling follows both LRN layers and conv5.

| # | Layer | Kernels (paper) | Stride / pad | Output shape | Split across GPUs | Params (DERIVED) |
|---|---|---|---|---|---|---|
| — | Input | — | — | 224×224×3 per paper and original code (cuda-convnet's ceiling rule gives 55; with standard floor arithmetic 227 is needed) | both GPUs see the whole image | — |
| 1 | conv1 + ReLU + LRN | 96 × (11×11×3) | stride 4 | 55×55×96 | 48 kernels per GPU | 34,944 |
| | max-pool 3×3, s2 | | | 27×27×96 | | |
| 2 | conv2 + ReLU + LRN | 256 × (5×5×48) | pad 2* | 27×27×256 | 128 per GPU; **each sees only its own GPU's 48 maps** | 307,456 |
| | max-pool 3×3, s2 | | | 13×13×256 | | |
| 3 | conv3 + ReLU | 384 × (3×3×256) | pad 1* | 13×13×384 | **cross-GPU: sees all 256 maps** | 885,120 |
| 4 | conv4 + ReLU | 384 × (3×3×192) | pad 1* | 13×13×384 | within-GPU only | 663,936 |
| 5 | conv5 + ReLU | 256 × (3×3×192) | pad 1* | 13×13×256 | within-GPU only | 442,624 |
| | max-pool 3×3, s2 | | | 6×6×256 = 9,216 | | |
| 6 | fc6 + ReLU + dropout | 4096 | | 4096 | split, fully connected across | 37,752,832 |
| 7 | fc7 + ReLU + dropout | 4096 | | 4096 | | 16,781,312 |
| 8 | fc8 → 1000-way softmax | 1000 | | 1000 | | 4,097,000 |
| | **Total** | | | | | **≈ 60.97 M** |

\*Padding is not stated in the paper. These values are the standard reconstruction used in cuda-convnet-derived configs and reimplementations, and they make the stated output sizes come out.

Kernel counts and sizes for every layer, and the 4096-neuron FC layers, are **[VERIFIED-PRIMARY]** from [S1]. Output shapes and parameter counts are **[DERIVED]**.

**Key derived facts** (from the table above):
- **About 96% of the parameters are in the three fully connected layers.** fc6 alone holds 37.8M, or 62%. The five conv layers together hold only about 2.33M, about 3.8%.
- The paper says removing any conv layer, "each of which contains no more than 1% of the model's parameters", hurt performance [S1]. By our grouped count, conv3 is about 1.45% and conv4 about 1.09%, so the "1%" is approximate. Do not have the film assert "each less than 1%".
- **Computation:** about **0.72 billion multiply-adds** per 227×227 image, forward pass. Roughly 1.4 GFLOPs counting multiply and add separately. 92% of the multiply-adds are in the **conv** layers.
  - **The inversion makes a good visual:** the parameters live in the FC layers, while the computation lives in the convolutions.
  - The slide deck says "630,000,000 connections" [S5]; Li's memoir repeats 630 million [S24]. Our multiply-add count, about 724M, is in the same ballpark. The difference is in how shared weights and the halved connectivity are counted.
- **Neurons:** the paper's Fig. 2 caption gives layer sizes "253,440–186,624–64,896–64,896–43,264–4096–4096–1000" and says the input is "150,528-dimensional" (= 224×224×3) [S1][S5].
  - 186,624 = 27·27·256. 64,896 = 13·13·384. 43,264 = 13·13·256. Those all match.
  - **253,440 does not equal 55·55·96 = 290,400.** It is a long-noted inconsistency in the figure.
  - The total is 622K by the caption's numbers or 659K with 290,400. The paper rounds to "650,000 neurons".
- **The 224 versus 227 discrepancy:**
  - With an 11×11 kernel and stride 4, a 224-pixel input gives (224−11)/4+1 = 54.25, which is not an integer. A 227-pixel input gives exactly 55.
  - Re-implementations disagree. Caffe's reference AlexNet uses a 227 crop. torchvision's `alexnet` keeps 224 and adds `padding=2` to conv1 (it is also a 64-filter variant) [S61]. Do not say "most use 227".
  - **The cause is now verified from the original code.** In the CHM-released 2012 source, `layer.py` computes the conv output size as `1 + ceil((2*padding + imgSize - filterSize) / stride)`, and the ImageNet configs declare conv1 with `padding=0, stride=4, filterSize=11` [S12]. A 224 input therefore gives 1 + ceil(213/4) = 55, with the last window overhanging the image edge. The paper's 224 and 55 are both correct for cuda-convnet's convention.
  - The film can say "a 224-pixel crop", and add "227 in some re-implementations" if needed. **[VERIFIED-PRIMARY (source code)]** (The earlier note that Wikipedia credits Karpathy with the observation is not in the current article and has been removed.)
- **Training compute (DERIVED):**
  - About 0.72 GMAC × 2 FLOP/MAC × 3 (forward plus backward) × 1.2M images × 90 epochs ≈ **4.7×10¹⁷ FLOP**, using Epoch AI's standard method [S50].
  - Two GTX 580s at peak for 5.5 days would deliver about 1.5×10¹⁸ FLOP, which implies roughly 30% utilisation.
  - For scale: a frontier model in 2025–26 uses about 10²⁵–10²⁶ FLOP, roughly 100 million times more. Use only as a rough order of magnitude, and cite the Epoch database if stated.

### 5.4 The ingredients and their measured effects (all from [S1], VERIFIED-PRIMARY)

The paper sorts §3.1–3.4 "according to our estimation of their importance, with the most important first."

| Ingredient | Mechanism | Effect reported |
|---|---|---|
| **ReLU** f(x)=max(0,x) (§3.1) | Non-saturating: the gradient doesn't vanish for large positive inputs, unlike tanh or sigmoid. | A four-layer CNN on CIFAR‑10 reaches 25% training error "six times faster" than the tanh equivalent (Fig. 1). "we would not have been able to experiment with such large neural networks for this work if we had used traditional saturating neuron models." |
| **Two-GPU training** (§3.2) | Half the kernels on each GPU. The GPUs communicate only at certain layers (into conv3 and into the FC layers). | Cuts top‑1/top‑5 error by **1.7% / 1.2%** "as compared with a net with half as many kernels in each convolutional layer trained on one GPU". Footnote 2: the one-GPU net kept full size in the last conv layer and the FC layers, so the comparison "is biased in favor of the one-GPU net". The two-GPU net "takes slightly less time to train" than the one-GPU net. |
| **Local response normalisation** (§3.3) | Each activation is divided by (k + α·Σ of squared neighbours across n adjacent kernel maps)^β, with **k=2, n=5, α=10⁻⁴, β=0.75**. A form of "lateral inhibition" that the paper says "would be more correctly termed 'brightness normalization'". | Cuts top‑1/top‑5 by **1.4% / 1.2%**. On CIFAR‑10 a four-layer CNN goes from 13% to 11% test error. |
| **Overlapping pooling** (§3.4) | Pool windows z=3, stride s=2, so the windows overlap. | Cuts top‑1/top‑5 by **0.4% / 0.3%** compared with s=2, z=2. Models "find it slightly more difficult to overfit". |
| **Data augmentation 1** (§4.1) | Random 224×224 crops of the 256×256 image, plus horizontal mirror images. | Enlarges the training set "by a factor of 2048" (32×32 positions × 2 flips), though the examples are "highly inter-dependent". Without it, "substantial overfitting". At test time: 4 corners + centre, plus their mirrors, = **ten patches**, softmax averaged. Without the 10-patch averaging, ILSVRC‑2010 error is 39.0%/18.3% instead of 37.5%/17.0% (footnote 5). |
| **Data augmentation 2** (§4.1) | PCA colour jitter: add multiples of the principal components of RGB pixel values, scaled by eigenvalue × N(0, 0.1). This approximates changes in illumination colour and intensity. | Cuts top‑1 error "by over 1%". |
| **Dropout** (§4.2) | Each hidden neuron in fc6 and fc7 is set to zero with probability 0.5. At test time all neurons are used and their outputs multiplied by 0.5. The paper calls this "a reasonable approximation to taking the geometric mean" of exponentially many thinned networks. | "Without dropout, our network exhibits substantial overfitting." "Dropout roughly doubles the number of iterations required to converge." |
| **SGD with momentum and weight decay** (§5) | Batch size **128**, momentum **0.9**, weight decay **0.0005**. Update: v ← 0.9·v − 0.0005·ε·w − ε·⟨∂L/∂w⟩; w ← w + v. | Weight decay "is not merely a regularizer: it reduces the model's training error." |
| **Initialisation** | Weights drawn from N(0, 0.01²). Biases set to 1 in conv2, conv4, conv5 and the FC hidden layers ("providing the ReLUs with positive inputs"), and 0 elsewhere. | Accelerates early learning. |
| **Learning-rate schedule** | Starts at 0.01. Divided by 10 when validation error stops improving, three times in total, **adjusted by hand**. | About **90 epochs**, "five to six days". |
| **Depth** | — | Removing any middle conv layer costs "about 2%" top‑1. "So the depth really is important for achieving our results." (§7) |

**Overfitting arithmetic, a great line for a teenager.** "Although the 1000 classes of ILSVRC make each training example impose 10 bits of constraint on the mapping from image to label, this turns out to be insufficient to learn so many parameters without considerable overfitting." [S1]
- log₂1000 ≈ 10 bits per label.
- 1.2M labels × 10 bits ≈ 12 million bits of constraint, against 60 million parameters.

### 5.5 Results (VERIFIED-PRIMARY)

**ILSVRC‑2010 test set** (labels public) [S1, Table 1]:

| Model | Top‑1 | Top‑5 |
|---|---|---|
| Sparse coding (2010 winner) | 47.1% | 28.2% |
| SIFT + Fisher Vectors (best published since) | 45.7% | 25.7% |
| **CNN (AlexNet)** | **37.5%** | **17.0%** |

**ILSVRC‑2012** [S1, Table 2]:

| Model | Top‑1 (val) | Top‑5 (val) | Top‑5 (test) |
|---|---|---|---|
| SIFT + FVs (2nd-best entry) | — | — | 26.2% |
| 1 CNN | 40.7% | 18.2% | — |
| 5 CNNs | 38.1% | 16.4% | **16.4%** |
| 1 CNN* (6 conv layers, pre-trained on ImageNet Fall 2011, i.e. 15M images and 22K classes, then fine-tuned) | 39.0% | 16.6% | — |
| 7 CNNs* (2 pre-trained + the 5 above) | 36.7% | 15.4% | **15.3%** |

**The winning 15.3% used extra data.** It was an ensemble of seven nets, two of them pre-trained on the full 15M-image Fall 2011 ImageNet release. This was declared and allowed; the results page marks it [S3].
- The best SuperVision entry **without** extra data was 16.4% (0.16422 on the results page) [S3]. That is still 9.8 points ahead of second place.
- A single AlexNet scored 18.2% on validation.
- The film should not imply that one network scored 15.3%.

**Official ILSVRC‑2012 classification leaderboard, best entry per team (top‑5 error)** [S3]:

| Rank | Team | Affiliation | Method | Top‑5 error |
|---|---|---|---|---|
| 1 | **SuperVision** | U. Toronto (Krizhevsky, Sutskever, Hinton) | Deep CNN | **0.15315** |
| 2 | **ISI** | U. Tokyo (Gunji, Higuchi, Yasumoto, Muraoka, Ushiku, Harada, Kuniyoshi) | Fisher Vectors over SIFT, CSIFT, LBP and GIST (the team also explored Graphical Gaussian Vectors); passive-aggressive linear classifiers, weighted late fusion | 0.26172 |
| 3 | OXFORD_VGG | Oxford (Simonyan, Aytar, Vedaldi, Zisserman) | Fisher vectors + SVMs | 0.26979 |
| 4 | XRCE/INRIA | Xerox Research Centre Europe / INRIA (Perronnin, Akata, Harchaoui, Schmid) | Fisher Vectors, PQ compression, linear SVMs | 0.27058 |
| 5 | University of Amsterdam | | | 0.29576 |
| 6 | LEAR‑XRCE | | | 0.34464 |

**Localisation (Task 2):** SuperVision 0.3355, OXFORD_VGG 0.5003, ISI 0.5365 [S3].

**Other numbers:**
- **ImageNet Fall 2009** (10,184 categories, 8.9M images): 67.4% top‑1 and 40.9% top‑5, against the best published 78.1% and 60.9% [S1].
- **Pre-AlexNet waypoint (July 2012 dropout preprint):** a single-GPU five-conv-layer net reached 48.6% top‑1 on ILSVRC‑2010, and **42.4%** with dropout. It took "roughly four days with dropout and two days without" on one GTX 580 [S13]. AlexNet's 37.5% came after the two-GPU split, augmentation and other changes.

### 5.6 What the first layer learned (VERIFIED-PRIMARY)
- Figure 3: "96 convolutional kernels of size 11×11×3 learned by the first convolutional layer". "The top 48 kernels were learned on GPU 1 while the bottom 48 kernels were learned on GPU 2." [S1]
- §6.1: "The network has learned a variety of frequency- and orientation-selective kernels, as well as various colored blobs." [S1]
- **The two GPUs specialised by themselves:** "The kernels on GPU 1 are largely color-agnostic, while the kernels on on GPU 2 are largely color-specific. This kind of specialization occurs during every run and is independent of any particular random weight initialization (modulo a renumbering of the GPUs)." [S1]
  - **Visual:** two rows of 48 tiles. One row is grey striped edges at all angles, Gabor-like. The other is coloured blobs and colour-opponent edges.
  - **Why it happens:** the restricted connectivity means the two halves only meet at conv3.
- The resemblance to Hubel & Wiesel's simple cells [S52] and to Gabor filters is the standard interpretation. The paper itself does not use the word "Gabor"; it says "frequency- and orientation-selective". Narration can say "edge detectors much like Gabor filters, which neuroscientists had found in the visual cortex", but should not attribute "Gabor" to the paper.
- **Critique by Zeiler & Fergus (2013) [S29]:** AlexNet's first-layer filters "are a mix of extremely high and low frequency information, with little coverage of the mid frequencies". The second layer "shows aliasing artifacts caused by the large stride 4". ZFNet's fix was 7×7 filters at stride 2, which gives "more distinctive features and fewer 'dead' features".
- **Last layer:** test images retrieve training images whose 4096-d fc7 vectors are nearest. The dogs and elephants come back "in a variety of poses", so the similarity is not pixel-level [S1, Fig. 4]. Paper examples: the off-centre "mite" correctly recognised; the leopard's alternative guesses are all other cats; "grille" and "cherry" are genuinely ambiguous.

### 5.7 Lineage and successors (VERIFIED-PRIMARY unless marked)

| Net | Year | Who | Depth / params | ILSVRC top‑5 | What changed |
|---|---|---|---|---|---|
| LeNet‑5 | 1998 | LeCun, Bottou, Bengio, Haffner (AT&T Bell Labs) | 7 layers, ~60K params (VERIFIED-SECONDARY) | — (digits) | Conv + subsampling + backprop on 32×32 greyscale |
| **AlexNet** | 2012 | Krizhevsky, Sutskever, Hinton (Toronto) | 8 learned layers, ~60M params | 15.3% (ensemble, extra data) / 16.4% (no extra data) | ReLU, dropout, augmentation, two GPUs, scale |
| ZFNet / Clarifai | 2013 | Zeiler & Fergus (NYU); Clarifai | AlexNet-like with 7×7/2 first layer (stride 2 also in layer 2) | ZF ensemble 14.8% (paper, trained on 2012 data only); Clarifai 11.2% won ILSVRC 2013 (11.197%, with an extra model trained on 5,000 categories; 11.743% on original data) | Deconvnet visualisation used to tune the architecture [S28][S29] |
| VGG‑16/19 | 2014 | Simonyan & Zisserman (Oxford) | 16–19 weight layers, 133–144M params | 7.3% (2nd in ILSVRC 2014); 6.8% after the competition | Only 3×3 convs, stacked deep. Trained on four NVIDIA Titan Black GPUs, "2–3 weeks" per net [S31] |
| GoogLeNet (Inception v1) | 2014 | Szegedy et al. (Google) | 22 layers; "12× fewer parameters than the winning architecture of Krizhevsky et al" | **6.67%** per the paper (0.06656 on the results page; "6.66%" in He et al.), won ILSVRC 2014 | Inception modules. Budget "1.5 billion multiply-adds". Trained with a **CPU-based** DistBelief implementation [S32] |
| PReLU-net | Feb 2015 | He, Zhang, Ren, Sun (MSRA) | — | 4.94% | Learnable leaky ReLU. Claimed first to beat the 5.1% human figure [S33] |
| ResNet | Dec 2015 | He, Zhang, Ren, Sun (MSRA) | up to 152 layers | **3.57%**, won ILSVRC 2015 | Residual skip connections. "8x deeper than VGG nets but still having lower complexity" [S34] |

Across 2012–2015, top‑5 error went **15.3% → 11.2% → 6.7% → 3.57%**, a 4.3× reduction in three years.

---

## 6. Verified quotes

All quotes below are verbatim from the cited text unless flagged.

**From the paper, Krizhevsky, Sutskever & Hinton (NIPS 2012) [S1]. VERIFIED-PRIMARY.**
1. "We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes." (Abstract)
2. "...achieved a winning top-5 test error rate of 15.3%, compared to 26.2% achieved by the second-best entry." (Abstract)
3. "Our network takes between five and six days to train on two GTX 580 3GB GPUs. All of our experiments suggest that our results can be improved simply by waiting for faster GPUs and bigger datasets to become available." (§1). **This is the scaling-hypothesis line, a strong narration candidate.**
4. "In the end, the network's size is limited mainly by the amount of memory available on current GPUs and by the amount of training time that we are willing to tolerate." (§1)
5. "This plot shows that we would not have been able to experiment with such large neural networks for this work if we had used traditional saturating neuron models." (§3.1, on ReLU)
6. "So every time an input is presented, the neural network samples a different architecture, but all these architectures share weights." (§4.2, on dropout)
7. "It is notable that our network's performance degrades if a single convolutional layer is removed. ... So the depth really is important for achieving our results." (§7)
8. "Thus far, our results have improved as we have made our network larger and trained it longer but we still have many orders of magnitude to go in order to match the infero-temporal pathway of the human visual system." (§7)
9. "Ultimately we would like to use very large and deep convolutional nets on video sequences where the temporal structure provides very helpful information that is missing or far less obvious in static images." (§7, the final sentence)
10. "The kernels on GPU 1 are largely color-agnostic, while the kernels on on GPU 2 are largely color-specific." (§6.1; the doubled "on on" is in the original)

**From the SuperVision workshop slides, Florence, 12 Oct 2012 (PDF created 19 Oct 2012) [S5]. VERIFIED-PRIMARY.**
11. "Trained with stochastic gradient descent on two NVIDIA GPUs for about a week" / "650,000 neurons" / "60,000,000 parameters" / "630,000,000 connections" / "Final feature layer: 4096-dimensional"
12. On the neurons slide: "f(x) = tanh(x) ... Very bad (slow to train)" versus "f(x) = max(0, x) ... Very good (quick to train)"
13. "It overfits a lot. Therefore we train on 224x224 patches extracted randomly from 256x256 images, and also their horizontal reflections."
14. "Learned: all feature extractors initialized at white Gaussian noise and learned from the data" / "Entirely supervised" / "More data = good"
15. "Using stochastic gradient descent and the backpropagation algorithm (just repeated application of the chain rule)"

**Hinton**
16. "Ilya thought we should do it, Alex made it work, and I got the Nobel Prize." Said to the Computer History Museum and published in the CHM blog of 20 Mar 2025 and its press release [S9][S10]. Reprinted by IEEE Spectrum (lower-case "prize") [S11]. **VERIFIED-PRIMARY** (institutional publication of his statement). The date he said it is not given; it was after Oct 2024.
17. "I am extremely excited about this fantastic opportunity to keep my research here in Toronto and, at the same time, help Google apply new developments in deep learning to make systems that help people." From the U of T release on the Google acquisition, March 2013, as printed by Engadget and CBC [S19][S20]. **VERIFIED-PRIMARY** (release text). Engadget's fetch confirmed the first clause verbatim and the CBC summary carries the rest.
18. "The deal with Google allows me and my students to work on whatever we like and to publish whenever and whatever we like … It doesn't put any constraints on what we work on and when we publish". Toronto Star interview, as printed in *The Varsity*, 18 Mar 2013 [S21]. **VERIFIED-SECONDARY** (fact-check: Wayback copy read directly; the live page returns 403).

**Fei‑Fei Li, *The Worlds I See* (2023) [S23].** Transcribed from reader highlights [S24], re-fetched for this fact-check and matching the wording below. **VERIFIED-SECONDARY: check wording against the printed book before use.**
19. "AlexNet, it appeared, was no mere contest entry. It was a moment of vindication a quarter century in the making."
20. On the Florence room: "the workshop was so crowded that LeCun himself had to stand against the back wall".
20a. "Hinton couldn't attend because of a chronic back problem".
20b. Via Timothy B. Lee [S62]: "I settled reluctantly on a twenty-hour slog of sleep deprivation and cramped elbow room." and "Most of us saw the neural network as a dusty artifact encased in glass and protected by velvet ropes."
21. On Hinton: "...so he'd sent Alex Krizhevsky in his place."
22. "I spent more time traveling to and from Florence than I did on the ground."
23. "his personal presentation didn't quite live up to the gravity of his work". Use with care: it is mildly critical of a living person who avoids publicity.

**Successors and human baseline (VERIFIED-PRIMARY)**
24. Karpathy, 2 Sep 2014 [S35]: "My own error in the end turned out to be 5.1%, approximately 1.7% better." / "I became very good at identifying breeds of dogs." From the post's **February 2015 update**, not the September 2014 original: "Human accuracy is not a point. It lives on a tradeoff curve." / "an ensemble of very dedicated expert human labelers might push this down to 3%, with about 2% being an optimistic error rate lower bound."
25. He et al., 6 Feb 2015 [S33]: "To our knowledge, our result is the first to surpass human-level performance (5.1%, Russakovsky et al.)..."
26. He et al., 10 Dec 2015 [S34]: "An ensemble of these residual nets achieves 3.57% error on the ImageNet test set."
27. Szegedy et al., 2014 [S32]: "Our GoogLeNet submission to ILSVRC 2014 actually uses 12× fewer parameters than the winning architecture of Krizhevsky et al [9] from two years ago, while being significantly more accurate."
28. CHM (Hansen Hsu, institutional voice, 20 Mar 2025) [S9]: "Before AlexNet, almost none of the leading computer vision papers used neural nets. After it, almost all of them would."

**UNVERIFIED: do not use as a quote**
- LeCun calling AlexNet "an unequivocal turning point in the history of computer vision. This is proof." Fact-check trail: Timothy B. Lee attributes it to Cade Metz ("Cade Metz reports"), who has LeCun standing up after the talk to say it [S62][S18]. We have not read Metz's page, and there is no recording or LeCun-authored source. The CHM, whose text Metz helped clarify, gives only a paraphrase: "pronounced it a turning point for AI" [S9]. If used, narrate as paraphrase: "LeCun, who was in the room, called it a turning point." At most say "according to journalist Cade Metz…".
- LeCun: "In 2012, you couldn't get a paper accepted at CVPR if you used neural networks. By 2014, you couldn't get a paper accepted at CVPR if you did not use neural networks." This is a secondary attribution with no source. UNVERIFIED.
- LeCun's 2012 CVPR letter: "So, I'm giving up on submitting to computer vision conferences altogether." Secondary reproductions only. UNVERIFIED until the original post or an archive copy is found.
- Hinton's deal with Krizhevsky: each 1% ImageNet improvement bought another week before a required report (variously "depth oral", "term paper" or "essay"). There are two second-hand retellings of a Hinton talk, and they differ [S53]. Also the line "While avoiding writing his term paper, he probably conducted the most influential research of the century". UNVERIFIED. It is a lovely anecdote, so narrate it only as "Hinton has told a story that..." once a recording is found.
- Sutskever, GTC fireside chat (22 Mar 2023). NVIDIA's blog prints these in quotation marks as his words: "The ImageNet dataset and a convolutional neural network were a great fit for GPUs" … "made it unbelievably fast to train something unprecedented" [S48]. That makes it VERIFIED-SECONDARY as two fragments. The joining words are the blog's, so verify against the video (youtube.com/watch?v=I6qQinoY9WM) before quoting it as one sentence. The same blog says the work ran on "a few GeForce GTX 580 GPUs in a University of Toronto lab", which conflicts with the CHM's bedroom account (see the Fact-check log).
- Sutskever, Eye on AI podcast (15 Mar 2023): "Alex had these very fast convolutional kernels, image net had the large enough data..." The transcript page could not be fetched. UNVERIFIED.
- Jensen Huang supposedly said AlexNet was trained on "14 million images" and "ignited the big bang of AI". **Attribution UNVERIFIED.** [S48] contains no "14 million". Its "Big Bang of AI" is the blog author's paraphrase of Huang, not in quotation marks. Whatever its source, the number is wrong (section 8). Do not use either.

---

## 7. Debates and controversies

**7.1 Was AlexNet "first"? (Priority)**
- *For AlexNet's primacy:*
  - First deep CNN to win the large-scale, 1,000-class, high-resolution benchmark, and by a margin that converted the vision community [S3][S9].
  - First widely reproduced. *cuda-convnet* was public (paper footnote 1: code.google.com/p/cuda-convnet) [S1].
- *Against "first GPU CNN" claims:*
  - Cireșan et al. (IDSIA) trained deep GPU CNNs ("DanNet") in 2011 and won several competitions, among them IJCNN 2011 traffic signs and ISBI 2012 neuron segmentation [S44][S45].
  - Schmidhuber argues that IDSIA's work triggered the CNN revolution [S46].
  - AlexNet cites Cireșan twice, and calls its two-GPU columns "somewhat similar to that of the 'columnar' CNN employed by Cireșan et al. [5], except that our columns are not independent" [S1].
  - GPU neural nets also predate both groups (e.g. Raina, Madhavan & Ng 2009 for DBNs).
- *Film stance:* AlexNet was the decisive demonstration on the benchmark that mattered to vision, not the invention of GPU CNNs. **Contested in emphasis, not in fact.**

**7.2 Who deserves the credit: data, algorithms or hardware?**
- Li's memoir frames 2012 as the convergence of her lab's data-at-scale bet with Hinton's algorithmic bet [S23][S24].
- Hinton's quip spreads credit to the students [S9].
- NVIDIA frames it as the GPU's "big bang" moment [S48].
- The paper itself credits all three: CNN priors, a large dataset, and "current GPUs, paired with a highly-optimized implementation of 2D convolution" [S1].
- *Film stance:* three ingredients, three camps, each with a fair claim. Avoid a single hero.

**7.3 "Superhuman" ImageNet: 2015 and after**
- *Claim:*
  - PReLU-net (4.94%) was framed as "the first to surpass human-level performance (5.1%...)" [S33].
  - ResNet reached 3.57% [S34].
  - Batch norm (Feb 2015) also claimed to exceed human raters: "4.8% test error, exceeding the accuracy of human raters" [S40] (verified).
- *Caveats, many from the human baseline's own author* [S35]:
  - The 5.1% is **one person** (Karpathy) on **1,500 test images**, in a "week-long exercise" after training himself on 500 validation images.
  - A second "expert labeler" got "about 12%" on only 280 images. Labmates using a pruned interface reached "13-15% error rates".
  - About 37% of his errors were fine-grained classes, such as the 120 dog breeds.
  - His estimate, added in a Feb 2015 update: "an ensemble of very dedicated expert human labelers might push this down to 3%".
  - Top‑5 scoring is lenient: five guesses per image.
- *Later evidence the benchmark itself is noisy or overfit:*
  - Recht et al. (2019) built a fresh test set, ImageNetV2. Accuracy dropped about 11–14 percentage points, though model rankings were preserved [S41].
  - Beyer et al. (2020) re-annotated the validation labels and asked "Are we done with ImageNet?" [S42].
  - Northcutt et al. (2021) estimated label errors in benchmark test sets, including ImageNet validation [S43].
  - *Fact-check, abstracts read:*
    - Recht et al. report "accuracy drops of … 11% - 14% on ImageNet".
    - Northcutt et al. report that "label errors comprise at least 6% of the ImageNet validation set".
    - Beyer et al. answer their own title "Yes, and no".
- *Film stance:* "machines beat one careful human's score on this test" is accurate. "Machines see better than people" is not.

**7.4 Benchmark gaming: Baidu, 2015**
- Baidu's "Deep Image" claimed 5.98% (arXiv v1, 13 Jan 2015), then 4.58% (May 2015) [S39][S37]. The current arXiv abstract (v5) no longer states any error rate.
- ILSVRC found "at least 30 accounts" making "at least 200" submissions between 28 Nov 2014 and 13 May 2015, against a limit of 2 per week. Baidu was barred from the test server for 12 months [S37][S38].
- Baidu apologised and fired team lead Ren Wu. Wu denied wrongdoing: "We didn't break any rules, and the allegation of cheating is completely baseless", arguing the limit was per person, not per team [S38]. **Both sides sourced (VERIFIED-SECONDARY).**
- Relevance: the test-set race had become fierce enough to cheat over, just three years after AlexNet.

**7.5 The DNNresearch auction: details that vary**
Per Metz (Wired excerpt, 16 Mar 2021, read directly in the fact-check; and *Genius Makers*) [S17][S18]:
- A Baidu vice-president had offered $12M to hire Hinton and his students before the auction.
- Bids came by email (Gmail), each raise at least $1M, on a one-hour clock that Hinton later cut to 30 minutes.
- Microsoft objected that Google owned the email system.
- DeepMind "bid with company shares, not cash" and soon dropped out.
- At $15M–$20M Microsoft dropped out, "but then returned". At about $22M it dropped out again, leaving Baidu and Google.
- Near midnight, "as the price hit $44 million", Hinton suspended bidding. The next day he ended the auction and chose Google "without pushing the price any higher". Metz writes that "finding the right home for his research was ultimately more important to him than commanding the maximum price".

Metz has Google's bidders believing more money was "still coming", so Google's offer may not have been the most Baidu would pay. The U of T release did not disclose terms [S19]. The $44M figure rests on Metz's reporting. **VERIFIED-SECONDARY: attribute it ("according to journalist Cade Metz").** Room 731 is in the Wired text itself: "his hotel room, number 731 in the Harrah's tower".

**7.6 LRN: an ingredient that didn't last**
- The paper credits LRN with 1.4%/1.2% gains [S1].
- VGG's paper reports that LRN did not help its nets: "such normalisation does not improve the performance on the ILSVRC dataset, but leads to increased memory consumption and computation time" (§2.1). Its table shows A-LRN at 29.7%/10.5% against A at 29.6%/10.4% [S31]. **VERIFIED-PRIMARY** (fact-check replaced a from-memory paraphrase).
- Batch normalisation (2015) displaced it [S40].
- Good "what the field kept versus dropped" beat: ReLU, dropout and augmentation stayed; LRN and the two-GPU split did not.

**7.7 Did the vision community "instantly" convert?**
- The CHM says veteran researchers "weren't convinced" [S9].
- Malik and others wanted proof on detection, which came with R‑CNN [S25].
- Yet by ILSVRC 2013 every top-5 classification entry was a CNN [S28].
- *Stance:* scepticism at the workshop is reported; conversion took about a year in competitions and about two years in conference papers.

---

## 8. Misconceptions to avoid

1. **"AlexNet invented CNNs / deep learning / GPU training."** No. CNNs go back to LeCun (1989) and Fukushima (1980). GPU CNNs were already in use (Cireșan 2011). Dropout and ReLU came from earlier Toronto papers [S1][S13][S14][S44].
2. **"A single network scored 15.3%."** No. 15.3% was a seven-net ensemble, two of them pre-trained on the 15M-image Fall 2011 release. One CNN scored 18.2% on validation, and the best no-extra-data entry was 16.4% [S1][S3].
3. **"Trained on 14 million images."** This is a common popular claim. Its attribution to Jensen Huang at GTC 2023 is UNVERIFIED: [S48] does not contain it. The main model saw about 1.2 million training images (augmented on the fly). Only the two pre-trained ensemble members used the ~15M-image release.
4. **"Trained on a supercomputer / at Google."** No. Two consumer GTX 580 gaming cards in a home PC in Krizhevsky's bedroom at his parents' house [S1][S9].
5. **"The paper's 224×224 is a typo for 227."** Not quite. With standard floor arithmetic 224 cannot give 55, but the original cuda-convnet code rounds the output size up, so 224 with no padding yields 55 [S12]. Caffe uses 227, and torchvision uses 224 with padding 2 [S61]. Don't "correct" the paper.
6. **"The runner-up was USC's ISI."** No. ISI was a **University of Tokyo** team (Harada/Kuniyoshi lab) [S3].
7. **"The runner-up used SVMs on SIFT" (loosely true) or "a neural net" (false).** ISI used Fisher Vectors and Graphical Gaussian Vectors over SIFT, CSIFT, LBP and GIST, with passive-aggressive linear classifiers [S3].
8. **"Most of AlexNet's parameters are in the convolutions."** The reverse is true: about 96% are in the fully connected layers. Most of the *arithmetic* is in the convolutions [DERIVED from S1].
9. **"Hinton presented it in Florence."** No. Krizhevsky did [S9]. Hinton didn't attend because of his back [S24]; he couldn't sit, so he didn't fly.
10. **"It was presented at ICCV" or "at NIPS first."** The first public presentation was the ILSVRC workshop at **ECCV 2012**, Florence, 12 Oct 2012. NIPS came in December [S4]. Li herself has misspoken "ICCV" in a talk.
11. **"Google paid $44M in a public auction."** The auction was private, by email. The $44M figure comes from Metz's reporting; the announcement disclosed no terms [S17][S19].
12. **"ImageNet was 'solved' / machines surpassed humans in vision in 2015."** See 7.3.
13. **"The CHM released the trained model weights."** The README says the package "also includes the parameter files trained on the ImageNet dataset". A fact-check listing of the repo found many `layers/layer-params-*.cfg` files, which are hyperparameter configs, and no obvious weight checkpoint. Say "the original source code" and stop there [S12].
14. **"The first-layer filters were designed to be Gabor filters."** They were learned from random noise. The paper calls them "frequency- and orientation-selective kernels" and "colored blobs" [S1][S5].
15. **"AlexNet used unsupervised pre-training (like 2006 deep belief nets)."** No: "we did not use any unsupervised pre-training" [S1]. Its "pre-training" (asterisked models) was *supervised* training on the larger ImageNet release.

---

## 9. Curiosity hooks (true and sourced)

1. **The world-changing net trained in a bedroom.** The machine had two gaming graphics cards and sat in Krizhevsky's bedroom at his parents' house [S9].
2. **The two GPUs divided the work by themselves.** With nobody telling them to, one GPU's first-layer filters came out mostly colourless edges and the other's mostly colour blobs, "during every run" [S1].
3. **"Wait for faster GPUs."** In 2012 the paper predicted the scaling era in one sentence: results "can be improved simply by waiting for faster GPUs and bigger datasets to become available." [S1]
4. **Hinton couldn't sit down.** "I last sat down in 2005," he often said, "and it was a mistake" (as quoted by Metz). He missed Florence because of his back. He then ran an auction that reached $44M for a three-person company, standing at a laptop on an upside-down trash can in Harrah's Room 731, Lake Tahoe [S24][S17].
5. **The paper's metadata holds an earlier draft.** The PDF in the NeurIPS proceedings still carries an earlier abstract in its metadata. That abstract says "500,000 neurons", "globally connected layers" and ILSVRC‑2010 errors of 39.7%/18.9%; the printed abstract says 650,000, "fully-connected" and 37.5%/17.0%. It is a fossil of the paper improving between drafts [S1 PDF metadata, fetched 2026-10-05]. *Verified by direct fetch; treat as a light aside.*
6. **10 bits per photo.** Each label carries only about 10 bits (log₂1000), against 60 million parameters to set. That is why the team invented ways to manufacture more data from the same photos: crops, mirrors and colour shifts, a "factor of 2048" more [S1].
7. **The runner-up team became the next leader.** Oxford's VGG group came 3rd in 2012 with hand-built features. Two years later its members built VGG‑16/19, deep CNNs that came 2nd in 2014 and became a field standard [S3][S31].
8. **Google's 2014 winner trained on CPUs.** GoogLeNet beat AlexNet's descendants with 12× fewer parameters, and the paper says it used "CPU based implementation only" [S32].
9. **One human set the bar for "superhuman".** The 5.1% human score that machines "beat" in 2015 came from one PhD student, Andrej Karpathy, labelling 1,500 images. He wrote that he "became very good at identifying breeds of dogs" [S35].
10. **In three years, error fell from 15.3% to 3.57%,** and the winning depth went from 8 layers to 152 [S1][S34].
11. **Five years to free the code.** The Computer History Museum asked in 2020. Releasing the 2012 source code took five years of negotiation with Google, finishing in March 2025 [S9].

---

## 10. Visual and dramatic details

- **The bedroom (Toronto, 2011–12):**
  - A suburban family home. A desktop tower whose side panel would show two long dual-slot cards, fans whining under load for days at a time.
  - A student's desk and monitor showing a scrolling training log.
  - Toronto winter outside the window (the year of tweaking ran through 2011–2012) [S9].
  - Ground the design in the CHM's "rare photograph of the home computer" [S9], and avoid inventing décor.
- **The conveyor (from the slides):** four simultaneous lanes: disk → CPU transform → copy to GPU → GPU training [S5]. Paper-cut opportunity: JPEGs flow off a 27 GB shelf, get cropped and flipped by little scissor-hands on the CPU, and drop into two glowing furnaces.
- **The two-GPU figure:** Figure 2 of the paper is famously **cropped at the top in the published PDF**, a widely noticed quirk; *verify visually before using*. Its two parallel towers, with crossing wires only at conv3 and the FC layers, are a ready-made silhouette diagram: two lanterns joined by a few bridges [S1].
- **Florence, Friday 12 October 2012:**
  - ECCV ran 7–13 October [S8]. The ILSVRC session ran 15:30–18:00, and the SuperVision talk came last at 17:05. Mid-October Florence light would be failing by the end of the session (sunset around 18:40 local time; *astronomical estimate*).
  - The room was overfull, with LeCun standing at the back [S24].
  - A young presenter with LibreOffice slides; the published PDF was produced in LibreOffice Impress, so the talk deck plausibly was too [S5].
  - Slide 9 is simply "96 learned low-level filters", a grid of tiny coloured stripes projected large [S5].
  - Venue specifics (hall name) are not verified; keep the interior generic: rows of chairs, projector beam, Renaissance city outside.
- **Lake Tahoe, December 2012:** NIPS (3–8 Dec) at the Harrah's and Harveys casino towers on the state line [S59]. Room 731 "looked out over the Nevada pines and onto the snowy mountain peaks" [S17]. Google's Alan Eustace flew in on his own twin-engine plane. He and Jeff Dean dined with Hinton and his students in the top-floor steak house "decorated with a thousand wine bottles". It was Hinton's 65th birthday, and he stood at a bar table while the others sat [S17].
  - **More true props:** a makeshift humidifier canopy of wet towels over an ironing board between the beds, hidden whenever Baidu's Kai Yu dropped by. Two contrails crossed in an X over the mountains; "Does that mean we should join Google?" [S17].
  - **Silhouette:** a tall man standing at a laptop on an upturned bin, a hotel window, snow, casino lights below.
- **Objects:**
  - GTX 580 cards.
  - The 96-filter mosaic (Fig. 3).
  - The ten-crop test-time pattern: four corners, centre and their mirrors.
  - The ILSVRC leaderboard with one number far from the pack.
  - The "Very bad (slow to train) / Very good (quick to train)" tanh-vs-ReLU slide [S5].
  - The mite, leopard, grille and cherry test images of Fig. 4 [S1].
- **Sound/tempo idea:** the leaderboard as a row of lanterns at nearly the same height (26–34%), with one dropped far lower (15.3%).

---

## 11. Sources

- [S1] Krizhevsky, Sutskever & Hinton, "ImageNet Classification with Deep Convolutional Neural Networks", *NIPS 25* (2012), pp. 1097–1105. PDF: https://papers.nips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf (read in full)
- [S2] NeurIPS proceedings page: https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks
- [S3] ILSVRC2012 results: https://image-net.org/challenges/LSVRC/2012/results.html
- [S4] ILSVRC2012 main page (timeline, workshop schedule): https://image-net.org/challenges/LSVRC/2012/index.php
- [S5] SuperVision workshop slides (Krizhevsky, Sutskever, Hinton; Oct 2012): https://www.image-net.org/static_files/files/supervision.pdf (read in full)
- [S6] ILSVRC2012 overview slides (Jia Deng et al.): https://www.image-net.org/static_files/files/ilsvrc2012.pdf
- [S7] PASCAL VOC 2012 workshop page: https://www.robots.ox.ac.uk/~vgg/projects/pascal/VOC/voc2012/workshop/index.html
- [S8] ECCV 2012 Florence: https://eccv2012.unifi.it/ ; proceedings (Oct 7–13, 2012): https://link.springer.com/book/10.1007/978-3-642-33783-3
- [S9] Hansen Hsu, "CHM Releases AlexNet Source Code", CHM blog, 20 Mar 2025: https://computerhistory.org/blog/chm-releases-alexnet-source-code/
- [S10] CHM press release: https://computerhistory.org/press-releases/chm-makes-alexnet-source-code-available-to-the-public/
- [S11] IEEE Spectrum (Hsu), 21 Mar 2025: https://spectrum.ieee.org/alexnet-source-code
- [S12] GitHub repo: https://github.com/computerhistory/AlexNet-Source-Code
- [S13] Hinton, Srivastava, Krizhevsky, Sutskever & Salakhutdinov, "Improving neural networks by preventing co-adaptation of feature detectors", arXiv:1207.0580 (2012): https://arxiv.org/abs/1207.0580
- [S14] Nair & Hinton, "Rectified Linear Units Improve Restricted Boltzmann Machines", ICML 2010: https://www.cs.toronto.edu/~hinton/absps/reluICML.pdf
- [S15] cuda-convnet (Google Code archive): https://code.google.com/archive/p/cuda-convnet/
- [S16] Krizhevsky, "Learning Multiple Layers of Features from Tiny Images" (2009): https://www.cs.toronto.edu/~kriz/learning-features-2009-TR.pdf
- [S17] Cade Metz, "The Secret Auction That Set Off the Race for AI Supremacy", *Wired*, March 2021: https://www.wired.com/story/secret-auction-race-ai-supremacy-google-microsoft-baidu/ (dated 16 Mar 2021; read directly in the fact-check)
- [S18] Cade Metz, *Genius Makers* (Dutton, 2021): https://www.penguinrandomhouse.com/books/603370/genius-makers-by-cade-metz/
- [S19] Engadget, 13 Mar 2013 (U of T release text): https://www.engadget.com/2013-03-13-google-acquires-neural-network-startup-dnnresearch.html
- [S20] CBC News, "Google buys University of Toronto startup": https://www.cbc.ca/news/science/google-buys-university-of-toronto-startup-1.1373641
- [S21] *The Varsity*, 18 Mar 2013: https://thevarsity.ca/2013/03/18/google-acquires-u-of-t-start-up/
- [S22] TechCrunch on Google+ photo search after DNNresearch: https://techcrunch.com/?p=831855
- [S23] Fei‑Fei Li, *The Worlds I See* (Flatiron/Moment of Lift, 2023): https://us.macmillan.com/books/9781250897930/theworldsisee/
- [S24] Reader highlights of *The Worlds I See* (Goodreads; secondary transcription): https://www.goodreads.com/notes/65211854-the-worlds-i-see/185327722-daniel-dantas?page=5
- [S25] Wikipedia, "AlexNet" (lead only): https://en.wikipedia.org/wiki/AlexNet
- [S26] Timothy B. Lee, Ars Technica, 11 Nov 2024: https://arstechnica.com/ai/2024/11/how-a-stubborn-computer-scientist-accidentally-launched-the-deep-learning-boom/ (fetch blocked)
- [S27] "AlexNet: When Deep Learning Became AI" (blog; lead only): https://a-history-of-ai.github.io/blog/AlexNet/
- [S28] ILSVRC2013 results: https://image-net.org/challenges/LSVRC/2013/results.php
- [S29] Zeiler & Fergus, "Visualizing and Understanding Convolutional Networks", arXiv:1311.2901: https://arxiv.org/abs/1311.2901
- [S30] ILSVRC2014 results: https://image-net.org/challenges/LSVRC/2014/results
- [S31] Simonyan & Zisserman, "Very Deep Convolutional Networks for Large-Scale Image Recognition", arXiv:1409.1556: https://arxiv.org/abs/1409.1556
- [S32] Szegedy et al., "Going Deeper with Convolutions", arXiv:1409.4842: https://arxiv.org/abs/1409.4842
- [S33] He, Zhang, Ren & Sun, "Delving Deep into Rectifiers", arXiv:1502.01852: https://arxiv.org/abs/1502.01852
- [S34] He, Zhang, Ren & Sun, "Deep Residual Learning for Image Recognition", arXiv:1512.03385: https://arxiv.org/abs/1512.03385
- [S35] Andrej Karpathy, "What I learned from competing against a ConvNet on ImageNet", 2 Sep 2014: https://karpathy.github.io/2014/09/02/what-i-learned-from-competing-against-a-convnet-on-imagenet/
- [S36] Russakovsky et al., "ImageNet Large Scale Visual Recognition Challenge", IJCV 2015, arXiv:1409.0575: https://arxiv.org/abs/1409.0575
- [S37] MIT Technology Review, 4 Jun 2015: https://www.technologyreview.com/2015/06/04/72951/why-and-how-baidu-cheated-an-artificial-intelligence-test/
- [S38] VentureBeat on Baidu firing Ren Wu: https://venturebeat.com/business/baidu-fires-researcher-who-told-subordinates-to-break-rules-in-image-recognition-competition/ ; Ren Wu denial: https://www.aiwire.net/2015/06/12/baidu-fires-deep-images-ren-wu/
- [S39] Wu et al., "Deep Image: Scaling up Image Recognition", arXiv:1501.02876: https://arxiv.org/abs/1501.02876
- [S40] Ioffe & Szegedy, "Batch Normalization", arXiv:1502.03167: https://arxiv.org/abs/1502.03167 (abstract figures from memory; re-check)
- [S41] Recht et al., "Do ImageNet Classifiers Generalize to ImageNet?", arXiv:1902.10811: https://arxiv.org/abs/1902.10811
- [S42] Beyer et al., "Are we done with ImageNet?", arXiv:2006.07159: https://arxiv.org/abs/2006.07159
- [S43] Northcutt, Athalye & Mueller, "Pervasive Label Errors in Test Sets Destabilize Machine Learning Benchmarks", arXiv:2103.14749: https://arxiv.org/abs/2103.14749
- [S44] Cireșan, Meier & Schmidhuber, "Multi-column Deep Neural Networks for Image Classification", arXiv:1202.2745: https://arxiv.org/abs/1202.2745
- [S45] Cireșan et al., "High-Performance Neural Networks for Visual Object Classification", arXiv:1102.0183: https://arxiv.org/abs/1102.0183
- [S46] J. Schmidhuber, on DanNet and the CNN revolution (advocacy; lead): https://people.idsia.ch/~juergen/DanNet-triggers-deep-CNN-revolution-2011.html
- [S47] LeCun, Bottou, Bengio & Haffner, "Gradient-Based Learning Applied to Document Recognition", *Proc. IEEE* 1998: http://yann.lecun.com/exdb/publis/pdf/lecun-98.pdf
- [S48] NVIDIA blog, "AI Opener: OpenAI's Sutskever in Conversation With Jensen Huang", 22 Mar 2023: https://blogs.nvidia.com/blog/sutskever-openai-gtc/ ; video: https://www.youtube.com/watch?v=I6qQinoY9WM
- [S49] Krizhevsky, "One weird trick for parallelizing convolutional neural networks", arXiv:1404.5997: https://arxiv.org/abs/1404.5997
- [S50] Epoch AI, compute-estimation method: https://epoch.ai/data/ai-models-documentation/estimation ; Epoch simulator article (GTX 580 1.581 TFLOPS; 5–6 days): https://epoch.ai/latest/introducing-the-distributed-training-interactive-simulator
- [S51] TechPowerUp GTX 580 spec page: https://www.techpowerup.com/gpu-specs/geforce-gtx-580.c270 (403 on fetch)
- [S52] Hubel & Wiesel, "Receptive fields of single neurones in the cat's striate cortex", *J. Physiol.* 1959: https://physoc.onlinelibrary.wiley.com/doi/10.1113/jphysiol.1959.sp006308
- [S53] Second-hand accounts of the Hinton "1% per week" anecdote (leads only): https://medium.com/@hasanimranmalik245/listening-to-geoffrey-hinton-234466eb996e ; https://sasodolenc.substack.com/p/the-man-who-unlocked-ai
- [S54] LeCun tweet referencing the pre-2012 CVPR letter (lead; fetch blocked): https://x.com/ylecun/status/1612337939173855234
- [S55] Nobel Prize in Physics 2024 press release: https://www.nobelprize.org/prizes/physics/2024/press-release/
- [S56] Wikipedia biographies (biographical leads): https://en.wikipedia.org/wiki/Alex_Krizhevsky ; https://en.wikipedia.org/wiki/Ilya_Sutskever
- [S57] Wikipedia, "Jitendra Malik" (lead): https://en.wikipedia.org/wiki/Jitendra_Malik
- [S58] Wikipedia, "GeForce 500 series" (GTX 580 launch, 9 Nov 2010): https://en.wikipedia.org/wiki/GeForce_500_series
- [S59] NIPS 2012 conference page ("Mon Dec 3rd through Sat the 8th, Harrahs and Harveys, Lake Tahoe"): https://nips.cc/Conferences/2012
- [S60] Wikipedia, "Fei-Fei Li" (born 3 July 1976; associate professor with tenure at Stanford, 2012): https://en.wikipedia.org/wiki/Fei-Fei_Li
- [S61] torchvision AlexNet source (conv1 `kernel_size=11, stride=4, padding=2`, 64 filters): https://github.com/pytorch/vision/blob/main/torchvision/models/alexnet.py
- [S62] Timothy B. Lee, "Why the deep learning boom caught almost everyone by surprise", *Understanding AI*: https://www.understandingai.org/p/why-the-deep-learning-boom-caught
- [S63] Original 2012 cuda-convnet/AlexNet output-size rule, `layer.py` line 1004, and conv1 config: https://github.com/computerhistory/AlexNet-Source-Code/blob/main/layer.py ; https://github.com/computerhistory/AlexNet-Source-Code/blob/main/layers/layers-120.cfg
- [S64] The Varsity, 18 Mar 2013, archived copy: https://web.archive.org/web/2016/https://thevarsity.ca/2013/03/18/google-acquires-u-of-t-start-up/

---

## 12. Fact-check log (adversarial pass, 2026-10-05)

**Method.** Primary texts were re-opened independently:
- the NeurIPS PDF and its metadata;
- the ILSVRC 2012, 2013 and 2014 results pages and the 2012 main page;
- the PASCAL VOC 2012 workshop page;
- the SuperVision slide PDF and its metadata;
- arXiv full texts of 1207.0580, 1311.2901, 1409.1556, 1409.4842, 1502.01852, 1502.03167 and 1512.03385, with v1 dates from the arXiv API;
- the CHM blog (full HTML);
- the CHM GitHub repo, including its licence, `layer.py` and layer configs;
- the Wired/Metz excerpt (full text);
- Karpathy's post;
- the Engadget release text and an archived copy of the Varsity article;
- the NIPS 2012 page and the Springer ECCV 2012 proceedings page;
- NVIDIA's blog;
- Goodreads highlights of Li's memoir.

Derived numbers were recomputed. Parameters total 60,965,224, with FC layers 96.2% and fc6 61.9%. Multiply-adds are 724.4M per image, 91.9% of them in conv layers. Training compute is ≈4.69×10¹⁷ FLOP. Neurons total 622,312 by the caption, or 659,272 with 290,400.

**Confirmed without change.** Key claims 1, 2, 3, 5, 7, 8, 9, 11, 13, 16, 17 and 18 hold as written, as do the timeline dates for 7 May, 16 Jun, 10 Jul, 11 Sep, 8 Oct, 12 Oct, 13 Oct, 19 Oct and 21 Oct 2012, 13 Nov 2013, 2 and 17 Sep 2014, 6 Feb 2015 and 10 Dec 2015. Specifically:
- every paper quote (1–10) and slide quote (11–15);
- the CHM quote and Hinton quote 16;
- quotes 17 and 18;
- the Li memoir highlights (19–23, secondary);
- the auction narrative (Room 731, four bidders, $44M);
- the 12–13 Mar 2013 announcement;
- the Baidu 2015 episode;
- the BSD-2 licence, 20 Mar 2025 date and "five years";
- ECCV 7–13 Oct 2012.

**Changes made**
1. **§1, §2: submission date.** "SuperVision submitted on 30 Sep" became "by the 30 Sep deadline". The ILSVRC page gives only the deadline, which was extended on 17 Sep; no source dates SuperVision's own upload. [S4]
2. **§5.1: test-set count.** The "discrepancy" note was wrong. The paper's 150,000 test images describe ILSVRC‑2010; the 2012 test set is 100,000 (Karpathy: "the full test set of 100,000 images"). [S1][S4][S35]
3. **§5.3, §8.5: 224 versus 227.**
   - The cause, previously UNVERIFIED, is now verified from source code. cuda-convnet sizes outputs as `1 + ceil((2p + n − f)/s)`, so 224 with padding 0 gives 55.
   - "Most reimplementations use 227" was overstated: torchvision uses 224 with padding 2.
   - The claim that Wikipedia attributes the observation to Karpathy was removed; the current article has no such text.
   - [S12][S63][S61][S25]
4. **§4: ZF replication.** "Within 0.2%" became "within 0.1%". [S29]
5. **§4: ILSVRC 2013 top five "all convnets".** Qualified: NUS (2nd) was a CNN plus traditional PASCAL‑pipeline hybrid. [S28]
6. **§3: Malik.** "Late 50s in 2012" became "early 50s" (born 11 Oct 1960). [S57]
7. **§3: Li.** "Late 30s" became "36" (born 3 Jul 1976). [S60]
8. **§3: Krizhevsky birthplace ("Ukrainian SSR").** Demoted to UNVERIFIED. The current Wikipedia article states no birthplace or year. [S56]
9. **§6 quote 24 and §7.3: dating.** "Human accuracy is not a point…" and the "3%" estimate come from Karpathy's February 2015 update, not the 2 Sep 2014 post. The labeller details were reworded to match the post: 12% on 280 images, and 13–15% with a pruned interface. [S35]
10. **§7.6: VGG on LRN.** A from-memory paraphrase was replaced with the verified text and table values. [S31]
11. **Timeline: batch norm.** "From memory" became verified: 4.9% validation and 4.8% (4.82%) test, "exceeding the accuracy of human raters"; arXiv 11 Feb 2015. [S40]
12. **Timeline: GTX 580.** "Late 2010" became 9 Nov 2010. [S58]
13. **§2 and §10: NIPS 2012 dates.** "From memory" became verified: 3–8 Dec, Harrahs and Harveys. [S59]
14. **§7.5: auction details.**
   - Microsoft dropped out at $15–20M, returned, then dropped out again at about $22M.
   - DeepMind bid in shares.
   - The bidding window was cut to 30 minutes.
   - The laptop sat on an upside-down trash can on a table.
   - The Google dinner fell on Hinton's 65th birthday.
   - The Wired text was read directly.
   - [S17]
15. **§3, §5.5: ISI method.** The scoring entry (0.26172) lists only Fisher Vectors over SIFT, LBP, GIST and CSIFT. GGV appears only in the team abstract. [S3]
16. **§5.4: two-GPU comparison.** Added the paper's footnote: the one-GPU baseline was larger than half-size, so the comparison is "biased in favor of the one-GPU net". [S1]
17. **§1, §3, §8.9: Hinton's absence.** "Could not travel" became "did not attend because of a chronic back problem". Li's wording is "couldn't attend". He travelled overland to Lake Tahoe two months later, lying down. [S24][S17]
18. **§6: Sutskever GTC quote.** Moved from UNVERIFIED to VERIFIED-SECONDARY as two fragments that NVIDIA's blog prints as his words. Check the video before joining them. [S48]
19. **§6, §8.3: Jensen Huang "14 million images" / "big bang".** Attribution demoted. [S48] has no "14 million", and its "Big Bang of AI" is the author's paraphrase. [S48]
20. **§6: LeCun "unequivocal turning point".** Still UNVERIFIED as a quote. The trail now leads to Cade Metz (*Genius Makers*) via Timothy B. Lee; there is no primary record. [S62][S18][S9]
21. **§5.2: location (contested).** NVIDIA's blog says "a University of Toronto lab". The CHM, with Krizhevsky's clarifications, says his bedroom at his parents' house. The CHM is preferred, and the conflict is noted. [S9][S48]
22. **§2: workshop details.** The PASCAL page lists the ILSVRC block as 15:30–18:15, against 18:00 on the ILSVRC page. Malik spoke 14:30–15:00 the same day. [S7][S4]
23. **§6 quote 18.** Re-verified from an archived copy and extended with the second sentence. [S64]

**Still UNVERIFIED (unchanged, do not quote)**
- LeCun's 2012 CVPR open letter: no primary text found.
- The "2012/2014 CVPR" line attributed to LeCun.
- Hinton's "1% per week" anecdote.
- Sutskever's Eye on AI line.
- Figure 2 being "cropped at the top": not visually checked in this pass.

**Contested (both sides noted)**
- AlexNet's primacy versus IDSIA/DanNet (§7.1).
- "Superhuman" ImageNet (§7.3).
- Bedroom versus "University of Toronto lab" (§5.2).
