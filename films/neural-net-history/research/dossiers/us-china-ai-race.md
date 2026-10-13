# Dossier: The US–China AI Race: Chips, Talent, Open Weights and Safety Dialogue (2017–2026)

Topic id: `us-china-ai-race` · Film: neural-net-history · As-of: 2026-10-05
Status: drafted from prior knowledge, then verified on 2026-10-05 with about 28 targeted web searches and primary-document fetches. Primary documents fetched and read in this pass: the DigiChina translation of China's 2017 plan, the DeepSeek-V3 technical report (arXiv), Dario Amodei's January 2025 essay, and the IDAIS statements site. Everything else was checked against reputable outlets: Reuters (via syndication), AP, Bloomberg, the FT (via syndication), SCMP, NPR, MIT Technology Review and law-firm summaries of Federal Register rules.

Tags:
- **[VERIFIED-PRIMARY]**: checked in this pass against the original document or the speaker's own published words.
- **[VERIFIED-SECONDARY]**: checked in this pass against a reputable news report, law-firm analysis or reference work.
- **[WEAK]**: found only in trade blogs or aggregators. Treat as a lead. Do not narrate as fact without a further check.
- **[UNVERIFIED]**: drafted from memory and not re-checked in this pass. Do not state it as fact or quote it without a further check.

Source numbers in square brackets, e.g. [S7], refer to section 11.

Even-handedness rule for this chapter: every US policy step below is paired with China's stated response in its own words, where one exists. Neither government is narrated as villain. "China" means the Chinese state or Chinese companies as specified, never "the Chinese" as a people.

---

## 1. Summary

**The starting gun (2017).** On **8 July 2017**, China's **State Council** completed the **New Generation Artificial Intelligence Development Plan** (新一代人工智能发展规划). It was released on **20 July 2017** [S1] [VERIFIED-PRIMARY]. The plan set three steps:
- **By 2020:** keep AI "in step with globally advanced levels", with a core AI industry worth more than 150 billion RMB.
- **By 2025:** make "major breakthroughs in basic theories for AI", with a core industry worth more than 400 billion RMB.
- **By 2030:** reach "world-leading levels", "making China the world's primary AI innovation center", with a core AI industry worth more than 1 trillion RMB and related industries worth more than 10 trillion RMB [S1] [VERIFIED-PRIMARY].

Western press often summarised this as "China wants to lead the world in AI by 2030". That is a fair paraphrase. The document's own phrase is "the world's primary AI innovation center".

**The chip wall (2022–2024).** The United States chose to compete by restricting **compute**: the advanced chips and the machines that make them.
- **7 October 2022.** The Commerce Department's Bureau of Industry and Security (BIS) issued sweeping controls. They covered advanced computing chips, supercomputer and chip-factory end uses in China, semiconductor manufacturing equipment, and the activities of "U.S. persons" supporting advanced Chinese chip plants. BIS said the aim was to "restrict the People's Republic of China's (PRC's) ability to both purchase and manufacture certain high-end chips used in military applications" [S2][S3] [VERIFIED-SECONDARY].
  - Nvidia answered with China-only variants, the **A800** and **H800**, which had reduced chip-to-chip bandwidth. Amodei's essay confirms that "H800's were allowed under the initial round of 2022 export controls, but were banned in Oct 2023" [S32] [VERIFIED-PRIMARY].
- **17 October 2023.** BIS tightened the rules to "close loopholes", in its own words. The new rules widened the chip criteria (catching the A800/H800) and extended licence requirements to dozens more countries. The chips rule was due to take effect after 30 days, on 17 November 2023. But on 23 October 2023 the US government told Nvidia that the licence requirement was "effective immediately" for its A100, A800, H100, H800 and L40S [S4][S5][S76] [VERIFIED-PRIMARY for the BIS release wording and the Nvidia 8-K; corrected in fact-check].
- **2 December 2024.** BIS added controls on **high-bandwidth memory (HBM)** and more chipmaking tools, created new foreign-direct-product rules, and put **140 entities** on the Entity List [S6] [VERIFIED-SECONDARY].
- **13/15 January 2025.** The **Framework for Artificial Intelligence Diffusion** (90 FR 4544) was announced on 13 January and published on 15 January [S7][S8] [VERIFIED-SECONDARY].
  - It sorted the world into three tiers. Roughly 18 close allies had unlimited access, about 120 countries had capped access, and arms-embargoed countries including China had none.
  - For the first time it controlled the **weights of closed AI models** trained with ≥10^26 operations (new ECCN 4E091). **Open-weight models were exempt.**
  - Compliance was due **15 May 2025**.

**Reversals and bargains (2025–2026).** The Trump administration kept the China chip wall but changed nearly everything else.
- **Diffusion rule.** On **13 May 2025**, two days before compliance was due, BIS announced it was rescinding the diffusion rule. It said the rule would have "stifled American innovation". The same day it issued guidance warning that using **Huawei Ascend 910B/910C/910D** chips "anywhere in the world" risked violating US export rules [S9][S10] [VERIFIED-SECONDARY].
- **H20, April 2025.** Nvidia's **H20**, the downgraded chip it built for China after 2023, was put under an indefinite licence requirement in **April 2025**. Nvidia warned of about **$5.5 billion** in charges [S11] [VERIFIED-PRIMARY: Nvidia 8-K].
- **H20, July 2025.** In **July 2025** Washington reversed course. Nvidia said the government "has assured NVIDIA that licenses will be granted" [S12][S75] [VERIFIED-SECONDARY].
- **H20, August 2025.** In **August 2025** Nvidia and AMD agreed to pay the US government **15%** of China revenue from these chips [S13][S14] [VERIFIED-SECONDARY].
- **Beijing's counter-moves.** On **31 July 2025** the Cyberspace Administration of China (CAC) summoned Nvidia over alleged "back door" risks in the H20, and Nvidia denied it [S15][S16]. In **September 2025**, China's market regulator (SAMR) said preliminary findings showed Nvidia had violated antitrust law over its Mellanox acquisition [S18]. The CAC reportedly told ByteDance, Alibaba and others to stop buying Nvidia's RTX Pro 6000D [S17] [all VERIFIED-SECONDARY].
- **H200, December 2025.** On **8 December 2025** President Trump said Nvidia's more capable **H200** could go to approved Chinese customers, with **25%** going to the United States [S19] [VERIFIED-SECONDARY].
- **H200, January 2026.** BIS issued a rule on **13 January 2026** moving H200-class chips to case-by-case review. It was published and took effect on **15 January**. On **14 January**, the day after the rule was issued and before it took effect, Reuters reported that Chinese customs had told agents the H200 was "not permitted" [S19][S20] [VERIFIED-SECONDARY; timing corrected in fact-check].
- **H200, late January 2026.** On **28 January 2026**, during Jensen Huang's visit to China, Reuters reported that Beijing had given **conditional, preliminary approval** for ByteDance, Alibaba and Tencent to buy more than 400,000 H200s in total. The conditions were still being decided [S77] [VERIFIED-SECONDARY; added in fact-check].
- **H200, March–May 2026.** On about **17–18 March 2026**, Huang said Nvidia now had Beijing's licences for "many customers in China" and was restarting production [S21]. By **14 May 2026** the US Commerce Department had approved about 10 Chinese buyers, but Reuters reported that **not a single H200 had been delivered** [S78] [VERIFIED-SECONDARY; corrected in fact-check. Earlier drafts said Beijing first approved in March and that deliveries were "small"].
- **Blackwell.** Nvidia's top **Blackwell** chips remained barred for China. In **February 2026** a senior US official said DeepSeek's next model had been trained on smuggled Blackwells, probably in Inner Mongolia. The Chinese embassy rejected the claim, and it was not publicly proven [S23] [VERIFIED-SECONDARY as a report of an allegation].

**The Chinese labs' answer: efficiency and openness.**
- **Baidu** launched **ERNIE Bot** in March 2023 [UNVERIFIED date detail].
- **Alibaba** began releasing open **Qwen** weights in **August 2023** [S43] [VERIFIED-SECONDARY].
- **DeepSeek V3, 26 December 2024.** The paper said the final training run took **2.788 million H800 GPU-hours**, or "$5.576M" at an assumed $2 per GPU-hour. The figure explicitly excluded "prior research and ablation experiments" [S26] [VERIFIED-PRIMARY].
- **DeepSeek R1, 20 January 2025.** The reasoning model R1 came out under the MIT licence [S27] [VERIFIED-SECONDARY]. That afternoon its founder **Liang Wenfeng** sat at Premier Li Qiang's symposium [S31] [VERIFIED-SECONDARY].
- **27 January 2025.** The DeepSeek app topped the US App Store [S30]. **Nvidia fell about 17%** and lost **$589 billion** (Bloomberg) or **$593 billion** (Reuters/LSEG) in market value. That was the largest one-day loss for any company in US market history [S28][S29] [VERIFIED-SECONDARY].
- **Later Chinese open-weight releases:**
  - **Moonshot's Kimi K2**, 1 trillion parameters, July 2025 [S40].
  - **Zhipu's GLM-4.5**, July 2025 [S41].
  - **Baidu's ERNIE 4.5**, open-sourced 30 June 2025 [S42].
  - In early 2026: Kimi K2.5, GLM-5, MiniMax M2.5 and Qwen3.5 [S45][S46] [VERIFIED-SECONDARY / WEAK for some specifications].
- **DeepSeek V4**, 24 April 2026, preview, open weights, adapted to run on Huawei Ascend [S35][S36] [VERIFIED-SECONDARY].
- By late 2025, Qwen had passed Meta's Llama as the most-downloaded model family on Hugging Face [S44] [VERIFIED-SECONDARY].

**Talent.** The Paulson Institute's in-house think tank **MacroPolo** studied authors of NeurIPS 2022 papers. It found that **47%** of "top-tier" AI researchers did their undergraduate degree in China, up from **29% in 2019**. The US share was **18%** [S47][S48] [VERIFIED-SECONDARY]. The **United States** remained the leading place where such researchers *worked*.

**Dialogue never stopped, even at the coldest moments.**
- **Bletchley, November 2023.** China signed the UK's Bletchley Declaration (see the `chatgpt-and-frontier-race` dossier).
- **Woodside, 15 November 2023.** Presidents Biden and Xi agreed at the Woodside summit "to address the risks of advanced AI systems and improve AI safety through U.S.-China government talks" [S50] [VERIFIED-SECONDARY, readout quoted].
- **Geneva, 14 May 2024.** The first intergovernmental AI dialogue was held. Both sides called it candid and constructive. The US raised "misuse of AI, including by the PRC". China "expressed a stern stance on the U.S. restrictions and pressure" [S51][S52][S53] [VERIFIED-SECONDARY].
- **Lima, 16 November 2024.** The two leaders "affirmed the need to maintain human control over the decision to use nuclear weapons". It was the first such joint statement [S55][S56] [VERIFIED-SECONDARY].
- **The scientists' track.** The **International Dialogues on AI Safety (IDAIS)** brought Western and Chinese scientists together, including Bengio, Hinton, Andrew Yao, Zhang Ya-Qin, Stuart Russell, Fu Ying and Xue Lan. They met at Ditchley Park in October 2023, **Beijing** in March 2024 (red lines), **Venice** in September 2024 ("AI safety as a global public good") and **Shanghai** in July 2025, and then London in April 2026 [S57] [VERIFIED-PRIMARY].

**Two action plans, one week apart.**
- **23 July 2025.** The White House released **"Winning the Race: America's AI Action Plan"**. It included the line "We need to ensure America has leading open models founded on American values" [S58] [VERIFIED-SECONDARY].
- **26 July 2025.** At the World AI Conference in Shanghai, Premier Li Qiang announced China's **Global AI Governance Action Plan** and proposed a **World AI Cooperation Organization** [S59][S60] [VERIFIED-SECONDARY].

**Where it stands on 2026-10-05.**
- **Summits.** Trump visited Beijing on **14–15 May 2026**, where AI "guardrails" were discussed [S69]. Xi made a state visit to Washington on **23–25 September 2026** [S70] [VERIFIED-SECONDARY].
- **The new channel.** The two governments agreed a dialogue on AI risks and benefits, with its next round **by/in November 2026**, and a channel for AI-related incidents. Washington calls it the "Super Intelligence Dialogue". Beijing calls it the "China-U.S. AI Dialogue" [S70] [VERIFIED-SECONDARY, from multiple outlets; the White House fact sheet itself was not retrieved].
- **Chips.** Export controls on top chips were untouched.
- **Distillation.** Meanwhile a new dispute had opened over "distillation": using a rival model's outputs to train one's own.
  - **February 2026:** Anthropic accused DeepSeek, Moonshot and MiniMax of large-scale distillation of Claude [S65].
  - **September 2026:** a joint FBI/NSA/CISA advisory accused several Chinese labs. China's Foreign Ministry called this "unfounded accusations or smears", and its Commerce Ministry threatened "resolute countermeasures" [S66] [VERIFIED-SECONDARY].

**How big is the gap?**
- **2024:** Liang Wenfeng said that people "often say that there is a gap of one or two years between Chinese AI and the United States, but the real gap is the difference between originality and imitation" [S34] [VERIFIED-SECONDARY, translation].
- **January 2025:** Amodei wrote that DeepSeek-V3 was "close to the performance of US models 7-10 months older" [S32] [VERIFIED-PRIMARY].
- **January 2026:** Demis Hassabis told CNBC (16 Jan) that Chinese models may be "only a matter of months" behind. At Davos (20 Jan) he told Bloomberg it was about six months [S61] [VERIFIED-SECONDARY; attribution split in fact-check].
- **2025:** Jensen Huang said on the BG2 podcast (26 Sep) that China was "nanoseconds behind" *in chips*. In November an Nvidia-posted statement said "China is nanoseconds behind America in AI" [S62] [VERIFIED-SECONDARY; context added in fact-check].
- **Dissent:** chip-focused analysts argue the compute gap is large and growing even if benchmark gaps look small (see section 7).

---

## 2. Timeline

| Date | Event | Sources | Status |
|---|---|---|---|
| 8 Jul 2017 (completed) / 20 Jul 2017 (released) | State Council issues the New Generation AI Development Plan. Three steps to 2020/2025/2030, ending with China as "the world's primary AI innovation center" | [S1] | VERIFIED-PRIMARY |
| 1 Aug 2017 | DigiChina/New America publishes full English translation (Webster, Creemers, Kania, Triolo) | [S1] | VERIFIED-PRIMARY |
| 7 Oct 2022 | BIS interim final rule on advanced computing and semiconductor manufacturing items (later 87 FR 62186). Phased effect 7 / 12 / 21 Oct 2022 | [S2][S3] | VERIFIED-SECONDARY |
| 8 Oct 2022 | PRC Foreign Ministry spokesperson Mao Ning says the US "abuses export control measures to maliciously block and suppress Chinese companies" (AP translation) | [S63] | VERIFIED-SECONDARY |
| 10 Oct 2022 | MOFCOM statement calls the controls "scientific and technological hegemony" (paraphrase in China Daily / CGTN) | [S63] | VERIFIED-SECONDARY |
| Nov 2022 (approx.) | Nvidia begins offering the A800 to China, then the H800 in early 2023 | [S32] (H800 status) | Product dates UNVERIFIED; H800 legality VERIFIED-PRIMARY via [S32] |
| 16 Mar 2023 | Baidu unveils ERNIE Bot | — | UNVERIFIED |
| 3 Aug 2023 | Alibaba open-sources Qwen-7B and Qwen-7B-Chat | [S43] | VERIFIED-SECONDARY |
| Aug–Sep 2023 | Huawei Mate 60 Pro appears with a SMIC 7 nm-class Kirin 9000s chip (TechInsights teardown) | — | UNVERIFIED (well known; not re-checked) |
| 17 Oct 2023 | BIS updated rules to "close loopholes"; licence requirements extended to D:1, D:4, D:5 countries; scheduled effective 17 Nov 2023; A800/H800 now caught | [S4][S5][S32] | VERIFIED-PRIMARY (BIS release) |
| 23 Oct 2023 | US government tells Nvidia the new licence requirement is "effective immediately" for A100, A800, H100, H800, L40S (Nvidia 8-K, 24 Oct) | [S76] | VERIFIED-PRIMARY (added in fact-check) |
| Oct 2023 | MOFCOM: US "overstretched the concept of national security, abused export control measures and resorted to unilateral bullying" | [S64] | VERIFIED-SECONDARY |
| 31 Oct 2023 | IDAIS-Oxford at Ditchley Park, UK | [S57] | VERIFIED-PRIMARY |
| 1–2 Nov 2023 | Bletchley Declaration, signed by US and China | see `chatgpt-and-frontier-race` dossier [S35 there] | VERIFIED-PRIMARY (elsewhere) |
| 15 Nov 2023 | Biden–Xi "Woodside Summit", San Francisco Bay Area, at APEC. Agree to government talks on AI risk and safety | [S50] | VERIFIED-SECONDARY |
| 10–11 Mar 2024 | IDAIS-Beijing at the Aman Summer Palace; red-lines statement | [S57] | VERIFIED-PRIMARY |
| Mar 2024 | NYT: "In One Key A.I. Metric, China Pulls Ahead of the U.S.: Talent" (reporting MacroPolo data) | [S47] (cited in search) | VERIFIED-SECONDARY (headline only) |
| 14 May 2024 | First US–China intergovernmental AI dialogue, Geneva (Chhabra and Center for the US) | [S51][S52][S53][S54] | VERIFIED-SECONDARY |
| Jul 2024 | Liang Wenfeng's 36Kr/Waves interview (later translated by ChinaTalk) | [S34] | VERIFIED-SECONDARY |
| 5–8 Sep 2024 | IDAIS-Venice, Casa dei Tre Oci; "AI safety as a global public good" | [S57] | VERIFIED-PRIMARY |
| 16 Nov 2024 | Biden–Xi, Lima (APEC): "human control over the decision to use nuclear weapons" | [S55][S56] | VERIFIED-SECONDARY |
| 2 Dec 2024 | BIS: HBM controls, new FDP rules, 140 Entity List additions (FR doc 2024-28267, published 5 Dec) | [S6] | VERIFIED-SECONDARY |
| Dec 2024 | SAMR opens antitrust investigation into Nvidia over Mellanox conditions | [S18] | VERIFIED-SECONDARY |
| 26 Dec 2024 (GitHub release; arXiv v1 posted 27 Dec UTC) | DeepSeek-V3 technical report: 671B params (37B active), 14.8T tokens, 2,048 H800s, 2.788M GPU-hours, "$5.576M" | [S26] | VERIFIED-PRIMARY |
| 10 Jan 2025 | DeepSeek app released in app stores (running V3) | [S30] (Sensor Tower via search) | VERIFIED-SECONDARY |
| 13 Jan 2025 (announced) / 15 Jan 2025 (published) | Framework for AI Diffusion, 90 FR 4544. Three tiers; ECCN 4E091 closed-weight model controls at ≥10^26 ops; compliance 15 May 2025 | [S7][S8] | VERIFIED-SECONDARY |
| 20 Jan 2025 | DeepSeek-R1 released, MIT licence, plus six distilled small models. Liang Wenfeng attends Premier Li Qiang's symposium the same day | [S27][S31] | VERIFIED-SECONDARY |
| 27 Jan 2025 | DeepSeek app #1 free app on US App Store. Nvidia -~17%, -$589B (Bloomberg) / -$593B (Reuters/LSEG). Nasdaq -3.1%. Philadelphia semiconductor index -9.2% | [S28][S29][S30] | VERIFIED-SECONDARY |
| 29 Jan 2025 | Lunar New Year (R1 landed in the week before the holiday) | — | UNVERIFIED (calendar fact) |
| Jan 2025 (late) | Dario Amodei publishes "On DeepSeek and Export Controls" | [S32] | VERIFIED-PRIMARY |
| ~31 Jan 2025 | SemiAnalysis estimates DeepSeek has access to ~50,000 Hopper GPUs and ~$1.6B server capex | [S33] | VERIFIED-SECONDARY |
| 9 / 14 Apr 2025 | US tells Nvidia H20 requires a licence "for the indefinite future". Nvidia 8-K: up to ~$5.5B charges | [S11] | VERIFIED-PRIMARY |
| 12–13 May 2025 | BIS announces rescission of the AI diffusion rule; GP10 guidance names Huawei Ascend 910B/C/D | [S9][S10] | VERIFIED-SECONDARY |
| 30 Jun 2025 | Baidu open-sources ERNIE 4.5 family (Apache 2.0) | [S42] | VERIFIED-SECONDARY |
| 11 Jul 2025 | Moonshot releases Kimi K2 (1T params, 32B active, modified MIT) | [S40] | VERIFIED-SECONDARY |
| 14 Jul 2025 | Nvidia says it will resume H20 sales; US "has assured NVIDIA that licenses will be granted" | [S12][S75] | VERIFIED-SECONDARY |
| 22–25 Jul 2025 | IDAIS-Shanghai | [S57] | VERIFIED-PRIMARY |
| 23 Jul 2025 | White House releases "Winning the Race: America's AI Action Plan" | [S58] | VERIFIED-SECONDARY |
| 26 Jul 2025 | Li Qiang announces China's Global AI Governance Action Plan and the World AI Cooperation Organization proposal at WAIC, Shanghai | [S59][S60] | VERIFIED-SECONDARY |
| 28 Jul 2025 | Zhipu (Z.ai) releases GLM-4.5 (MIT) | [S41] | VERIFIED-SECONDARY |
| 31 Jul 2025 | CAC summons Nvidia over alleged H20 "back door" risks; Nvidia denies | [S15][S16] | VERIFIED-SECONDARY |
| 10–11 Aug 2025 | Nvidia/AMD 15% China-revenue arrangement reported; Trump describes asking for 20% and settling at 15% | [S13][S14] | VERIFIED-SECONDARY |
| 5 Sep 2025 | Anthropic bars companies >50% owned by entities in unsupported regions (incl. China) from Claude | [S67] | VERIFIED-SECONDARY |
| 13 Sep 2025 | Science and Technology Daily column: "Anthropic's Ban Fails to Curb China's Booming AI Industry" | [S68] | VERIFIED-SECONDARY (via search summary) |
| 15 Sep 2025 | SAMR: preliminary finding that Nvidia violated anti-monopoly law (Mellanox) | [S18] | VERIFIED-SECONDARY |
| ~17 Sep 2025 | FT: CAC tells ByteDance, Alibaba and others to stop testing and ordering Nvidia RTX Pro 6000D | [S17] | VERIFIED-SECONDARY |
| 18 Sep 2025 | Huawei Connect: Ascend roadmap 950PR (Q1 2026), 950DT (Q4 2026), 960 (Q4 2027), 970 (Q4 2028) | [S38] | VERIFIED-SECONDARY |
| 26 Sep 2025 | Jensen Huang on the BG2 podcast: China "nanoseconds behind" | [S62] | VERIFIED-SECONDARY |
| 1 Nov 2025 | Xi proposes WAICO at APEC, Gyeongju | [S59] (via search) | VERIFIED-SECONDARY |
| ~5–6 Nov 2025 | FT quotes Huang "China is going to win the AI race"; Nvidia then posts his clarification "China is nanoseconds behind America in AI" | [S62] | VERIFIED-SECONDARY |
| 8 Dec 2025 | Trump announces H200 sales to approved Chinese customers with 25% to the US. DOJ announces "Operation Gatekeeper" (≥$160M H100/H200 smuggling) | [S19][S25] | VERIFIED-SECONDARY |
| Dec 2025 | The Information and others report alleged "ghost data center" smuggling of Blackwell servers to DeepSeek. Nvidia calls it "far-fetched" | [S24] | VERIFIED-SECONDARY (as report) |
| 13–15 Jan 2026 | BIS moves H200/MI325X-class exports to China to case-by-case review (effective 15 Jan). 14 Jan proclamation imposes 25% tariff mechanism | [S19][S74] | VERIFIED-SECONDARY |
| 14 Jan 2026 | Reuters: Chinese customs told H200 "not permitted"; firms told not to buy unless necessary | [S20] | VERIFIED-SECONDARY |
| ~10 Jan 2026 | AGI-Next summit, Tsinghua (Beijing): Qwen's Lin Junyang puts the chance of a Chinese firm overtaking US giants in 3–5 years at under 20% ("highly optimistic"), citing US compute "one to two orders of magnitude larger" | [S61][S79] | VERIFIED-SECONDARY (added in fact-check) |
| 16 Jan 2026 | CNBC: Hassabis says Chinese models may be "only a matter of months" behind | [S61] | VERIFIED-SECONDARY |
| 20 Jan 2026 | Bloomberg at Davos: Hassabis says about six months behind; calls the R1 reaction a "massive overreaction" | [S61] | VERIFIED-SECONDARY (added in fact-check) |
| 28 Jan 2026 | Reuters: Beijing gives conditional, preliminary approval for ByteDance, Alibaba and Tencent to buy >400,000 H200s, during Huang's China visit | [S77] | VERIFIED-SECONDARY (added in fact-check) |
| 27 Jan 2026 | Moonshot Kimi K2.5 (open weights) | [S45][S46] | WEAK |
| 11 Feb 2026 | Zhipu GLM-5 (open, MIT); reportedly trained on Huawei Ascend | [S46] | WEAK (Ascend-training claim needs a check) |
| 12 Feb 2026 | MiniMax M2.5 (open weights) | [S46] | WEAK |
| 15–16 Feb 2026 | Alibaba Qwen3.5-397B-A17B (open, Apache-2.0) | [S45] | VERIFIED-SECONDARY (Interconnects) |
| 23 Feb 2026 | Anthropic accuses DeepSeek, Moonshot and MiniMax of "industrial-scale" distillation: ~24,000 fraudulent accounts, >16M exchanges | [S65] | VERIFIED-SECONDARY |
| 23 Feb 2026 | Senior Trump administration official (to Reuters): DeepSeek's coming model trained on Blackwell chips, likely in Inner Mongolia; "we're not shipping Blackwells to China." Chinese embassy rejects | [S23] | VERIFIED-SECONDARY (allegation) |
| 17–18 Mar 2026 | Reuters: Nvidia gets Beijing's nod for H200 sales (licences for "many customers"; one buyer unsure whether approval was final). This followed January's preliminary approvals | [S21] | VERIFIED-SECONDARY |
| 17–19 Apr 2026 | IDAIS-London, Royal Society | [S57] | VERIFIED-PRIMARY |
| 20 Apr 2026 | Moonshot Kimi K2.6 | [S73] | WEAK |
| 24 Apr 2026 | DeepSeek V4 preview: V4-Pro (1.6T total / 49B active) and V4-Flash (284B / 13B), 1M context, open weights, adapted for Huawei Ascend | [S35][S36][S37] | VERIFIED-SECONDARY |
| 14–15 May 2026 | Trump–Xi summit in Beijing; AI "guardrails" and H200 discussed; no formal AI agreement | [S69] | VERIFIED-SECONDARY |
| 14 May 2026 | Reuters: Commerce has approved about 10 Chinese firms (incl. Alibaba, Tencent, ByteDance, JD.com) with purchases reportedly capped at up to 75,000 chips (whether per firm is unclear), but no H200 has been delivered | [S78] | VERIFIED-SECONDARY (upgraded and corrected in fact-check) |
| May–Jun 2026 | Alibaba's top Qwen 3.7-Max / 3.7-Plus offered as closed API models | [S73] | WEAK |
| 17–18 Jul 2026 | WAIC 2026, Shanghai. Assistant FM Liu Bin calls US distillation claims "misguided and counterproductive" | [S71] | WEAK |
| 8 Sep 2026 | NSA/CISA/FBI joint advisory (AA26-251A) on "industrial scale" distillation. Reported to name six companies (DeepSeek, Moonshot AI, Alibaba, MiniMax, StepFun, Z.ai; AP named four). PRC MFA and MOFCOM reject it | [S66][S80] | VERIFIED-SECONDARY (AP; date and names added in fact-check) |
| 20 Sep 2026 | Bessent in New York: US proposes an AI incident "notification mechanism" | [S70] | VERIFIED-SECONDARY |
| 23–25 Sep 2026 | Xi state visit to Washington; agreement on an AI dialogue (US: "Super Intelligence Dialogue") plus an incident channel; next round by/in November 2026; chip controls unchanged | [S70] | VERIFIED-SECONDARY (multiple outlets; fact sheet not retrieved) |

---

## 3. People

Appearance notes come from widely published photographs. They are approximations for **respectful silhouette** work only. Confirm against a licensed reference photo before animating. No caricature: depict heads of state as dignified silhouettes, with no exaggerated features.

### Chinese side

**Liang Wenfeng** (梁文锋), founder of DeepSeek (Hangzhou) and co-founder of the quant hedge fund High-Flyer.
- **Born:** c. 1985. He was 40 in January 2025 [S31].
- **Beliefs:** He believes in AGI as a research goal and in open source as strategy. In 2024 he said the binding constraint was chips, not money (see quote Q10) [S34].
- **Public profile:** extremely media-shy, with only a handful of interviews.
- **Appearance:** slim; short straight black hair; rimless or thin-framed glasses; plain dark jacket or casual shirt. In the CCTV footage from 20 Jan 2025 he wears a dark suit at a long conference table [S31] [appearance UNVERIFIED].

**Yang Zhilin** (杨植麟), founder and CEO of Moonshot AI (Beijing), maker of Kimi.
- **Background:** Tsinghua and Carnegie Mellon; co-author of Transformer-XL and XLNet [UNVERIFIED background].
- **Appearance:** young; slim; black hair; often in a hoodie or T-shirt [UNVERIFIED].

**Lin Junyang** (林俊旸), technical lead of Alibaba's Qwen team (Hangzhou).
- **Gap view:** In January 2026 he reportedly put the chance of a Chinese firm overtaking US giants within 3–5 years at under 20%, citing compute [S61] [VERIFIED-SECONDARY, paraphrase].

**Robin Li** (李彦宏), co-founder and CEO of Baidu (Beijing).
- **Role in the story:** He launched ERNIE Bot in 2023.
- **Appearance:** tall; neat side-parted black hair; dark suit, often with no tie [UNVERIFIED].

**Eric Xu** (徐直军), rotating chairman of Huawei (Shenzhen).
- **Role in the story:** He announced the Ascend roadmap on 18 Sep 2025. He conceded that China would lag in process nodes "for a relatively long time" [S38] [VERIFIED-SECONDARY].
- **Appearance:** middle-aged; short dark hair; glasses; business suit on a large keynote stage [UNVERIFIED].

**Li Qiang** (李强), Premier of the State Council.
- **Role in the story:** He hosted the 20 Jan 2025 symposium with Liang Wenfeng. He announced the Global AI Governance Action Plan and the WAICO proposal at WAIC, 26 Jul 2025 [S31][S59].
- **Appearance:** grey-black hair combed back; dark suit [UNVERIFIED].

**Xi Jinping** (习近平), President of the PRC.
- **Role in the story:** Woodside summit 2023, Lima 2024, Beijing May 2026, Washington state visit September 2026 [S50][S55][S69][S70].
- **Stated view in September 2026, as reported:** the US and China share a responsibility to keep AI under human control [S70] [VERIFIED-SECONDARY, paraphrase].
- **Depiction:** a dignified, formal silhouette in a dark suit, with no exaggeration.

**Mao Ning** (毛宁), PRC Foreign Ministry spokesperson.
- **Role in the story:** She was the voice of China's response in October 2022 and again in September 2026 [S63][S66].
- **Appearance:** shoulder-length dark hair; dark jacket; at the blue-backdropped MFA podium [UNVERIFIED].

**Fu Ying** (傅莹), former Vice Foreign Minister and chair of Tsinghua's Center for International Security and Strategy.
- **Role in the story:** An IDAIS signatory (Beijing, Venice, Shanghai) [S57].
- **Appearance:** short silver hair; elegant jacket [UNVERIFIED].

**Andrew Chi-Chih Yao** (姚期智), Turing Award 2000, Tsinghua (Beijing).
- **Role in the story:** IDAIS co-convener. He is the senior Chinese computer scientist most associated with the safety dialogue [S57].
- **Appearance:** elderly; white/grey hair; glasses; mild, scholarly bearing [UNVERIFIED].

**Zhang Ya-Qin** (张亚勤), Tsinghua Institute for AI Industry Research; former president of Baidu.
- **Role in the story:** IDAIS co-convener [S57].
- **Appearance:** grey hair; glasses; suit [UNVERIFIED].

**Xue Lan** (薛澜), Tsinghua, Schwarzman College.
- **Role in the story:** An IDAIS participant who works on AI governance [S57].

**Liu Bin** (刘彬), Assistant Foreign Minister.
- **Role in the story:** At WAIC 2026 he called US distillation claims "misguided and counterproductive" [S71] [WEAK].

### US side

**Gina Raimondo**, US Secretary of Commerce, 2021–January 2025, Washington DC.
- **Role in the story:** She oversaw the October 2022, October 2023 and December 2024 rules. On a press call on 16 October 2023 she said the rules would be updated "at least annually" [S81] [VERIFIED-SECONDARY; the phrase is not in the BIS release S4, citation corrected in fact-check].
- **Appearance:** shoulder-length dark-blonde hair; tailored suits [UNVERIFIED].

**Jake Sullivan**, National Security Advisor, 2021–25.
- **Role in the story:** He was the architect of the "small yard, high fence" approach [UNVERIFIED phrase origin]. He briefed on the Lima nuclear-control statement [S56].
- **Appearance:** slim; short light-brown hair; dark suit [UNVERIFIED].

**Tarun Chhabra** (NSC) and **Seth Center** (State Department).
- **Role in the story:** They led the US delegation at Geneva, 14 May 2024 [S51][S52].

**Dario Amodei**, CEO and co-founder of Anthropic (San Francisco).
- **Beliefs:** Strict, well-enforced chip export controls decide whether the world is "unipolar or bipolar" in AI. He called DeepSeek's engineers "very talented" and said "I don't see DeepSeek themselves as adversaries" [S32] [VERIFIED-PRIMARY].
- **Appearance:** curly dark hair; glasses; often in a sweater or open-collar shirt [UNVERIFIED].

**Jensen Huang**, founder and CEO of Nvidia (Santa Clara).
- **Beliefs:** He argued that restricting sales hands China's market to Huawei. He called China "nanoseconds behind" and "a formidable, innovative, hungry, fast-moving, underregulated" competitor [S62] [VERIFIED-SECONDARY].
- **Appearance:** signature black leather jacket; swept-back grey-black hair [UNVERIFIED but iconic].

**Demis Hassabis**, CEO of Google DeepMind (London).
- **Gap view:** On CNBC (16 Jan 2026) he said Chinese models may be "only a matter of months" behind, but China has not yet shown a breakthrough like the transformer. At Davos (20 Jan 2026) he told Bloomberg they were about six months behind and called the reaction to R1 a "massive overreaction" [S61] [VERIFIED-SECONDARY; the two interviews were conflated before the fact-check].
- **Appearance:** short dark hair; slight build; open-collar shirt [UNVERIFIED].

**Donald Trump**, US President from January 2025.
- **Role in the story:** He rescinded the diffusion rule (via BIS), reversed on the H20 with the 15% deal, approved the H200 with 25%, and held the Beijing summit (May 2026) and the Washington summit (September 2026) [S9][S13][S19][S69][S70].
- **Depiction:** a dignified formal silhouette.

**Joe Biden**, US President, 2021–January 2025.
- **Role in the story:** Woodside 2023 and Lima 2024 [S50][S55].
- **Depiction:** a dignified formal silhouette; aviator sunglasses are an often-photographed accessory [UNVERIFIED].

**Scott Bessent**, US Treasury Secretary.
- **Role in the story:** He led the US side of the 2026 AI dialogue. He said "The Chinese distill our models and they can never get ahead of us" [S66][S70] [VERIFIED-SECONDARY].

**Saif Khan**, former Biden NSC official and export-control advocate.
- **View:** He said reliance on smuggled Blackwells "underscores their massive shortfall of domestically produced AI chips" [S23] [VERIFIED-SECONDARY].

### Scientists' bridge

**Yoshua Bengio** (Mila, Montréal), **Geoffrey Hinton** (Toronto), **Stuart Russell** (UC Berkeley).
- **Role in the story:** Bengio and Russell convened the first dialogue (Ditchley, 2023) with Yao and Zhang. Hinton was not a convener: he attended Beijing (2024) and Shanghai (2025) and signed the Beijing and Venice statements [S57] [corrected in fact-check].
- **Bengio's appearance:** grey curly hair; beard.
- **Russell's appearance:** grey hair; glasses; British accent.
- **Hinton:** already described in earlier dossiers.

---

## 4. The belief of the age

There were several successive beliefs. Each is dated and sourced, with its holders and its dissenters.

### Belief A (c. 2017–2022): "Whoever leads in AI will lead the century, and China has the data advantage"
- **Who held it.** China's 2017 plan framed AI as a strategic technology and set a 2030 target to become "the world's primary AI innovation center" [S1]. Many Western commentators at the time stressed China's data scale and state backing [UNVERIFIED: specific commentators, e.g. Kai-Fu Lee's *AI Superpowers* (2018), not re-checked].
- **Who dissented.** Others argued that frontier research, chips and talent mattered more than data. MacroPolo's tracker work (2019 onward) showed the top tier of researchers *working* mainly in the US [S47].
- **What ended it.** The 2022 controls reframed the race around **compute**, and the scaling era (GPT-3 to GPT-4) made compute the bottleneck everyone talked about.

### Belief B (Oct 2022 – Dec 2024): "Compute is the chokepoint, and China is roughly 1–3 years behind"
- **Who held it.**
  - US policymakers built successive rules on this premise [S2][S4][S6].
  - Chinese founders also said it: Liang Wenfeng (July 2024) referred to the common view that there is "a gap of one or two years" and said the problem was "the bans on shipments of advanced chips", not money [S34].
  - ERNIE Bot's March 2023 launch was widely judged underwhelming [UNVERIFIED].
- **Who dissented.**
  - Some argued China would route around the controls via smuggling, rental of overseas cloud compute, or domestic chips. Huawei's Mate 60 Pro with a SMIC 7 nm-class chip in 2023 was the visible sign [UNVERIFIED].
  - Others argued that controls would accelerate Chinese self-reliance. That is the PRC government's own framing (Mao Ning: US actions "will only hurt and isolate itself") [S63].
- **How long it held.** About two years.

### Belief C, the "DeepSeek shock" (27 Jan 2025): "China has caught up for a fraction of the cost; maybe compute doesn't matter"
- **Who held it, briefly.** Equity markets did. Nvidia lost ~$589–593B in one day [S28][S29]. Viral commentary claimed DeepSeek built a frontier model for $6M.
- **Who dissented, immediately.**
  - Amodei said the $5.6M covered only the final run and that DeepSeek was 7–10 months behind US models; he called it "not a unique breakthrough" [S32].
  - SemiAnalysis estimated ~50,000 Hopper GPUs and ~$1.6B server capex [S33].
  - Defenders of DeepSeek replied that the company never claimed the whole programme cost $6M; the paper itself said the figure excludes research and ablations [S26][S33].
  - Hassabis later called the reaction a "massive overreaction" [S61].
- **What it changed.** The debate moved from "is China behind?" to "how far, and does it matter if Chinese models are open and cheap?"

### Belief D (2025–2026): "The gap is months, not years, but compute is still the long-run decider"
- **Who held it.**
  - Hassabis: "a matter of months" (CNBC), or about six months (Bloomberg) [S61].
  - Huang: "nanoseconds", first said of chips (BG2, Sep 2025), then of AI (Nov 2025), while arguing for sales [S62].
  - Amodei in January 2025: 7–10 months on V3 [S32].
- **Who dissented.**
  - **Export-control advocates** argue that benchmark gaps hide a widening compute gap. Saif Khan calls the reliance on smuggled chips evidence of a "massive shortfall" [S23].
  - **Chinese insiders:** Lin Junyang put the odds of China overtaking within 3–5 years at under 20%, because of compute [S61].
  - **Latent Space** judged DeepSeek V4 "no longer the benchmarks leader" among open models, and **SemiAnalysis** notes Huawei's poor 7 nm yields [S37][S39].
  - **Distillation:** some US officials argue Chinese models stay close partly through distillation of US models [S23][S66]. China rejects this and calls distillation "a common practice" [S66].
- **Status on 2026-10-05.** Contested and live. Present it as an open question.

### Belief E (throughout): "Competition and safety cooperation are incompatible"
- **Dissent in practice.** Governments kept talking even while escalating chip rules:
  - Woodside 2023, Geneva 2024, Lima 2024's nuclear-control statement [S50][S51][S55].
  - The 2026 "Super Intelligence Dialogue" / "China-U.S. AI Dialogue" with an incident channel [S70].
  - IDAIS scientists published joint red lines in Beijing in 2024 [S57].
- **Skeptics on both sides:** RSIS called the 2024 Geneva bar "low" [S54]. Commentators on the 2026 deal noted it set no incident definitions or response times [S70].

---

## 5. Experiments and results

This chapter's "experiments" are engineering runs, policy instruments and market events. For each one: the setup, the machine and the numbers.

### 5.1 DeepSeek-V3 training run (paper dated 26 Dec 2024) [S26] [VERIFIED-PRIMARY]
- **Model:** Mixture-of-Experts transformer, 671B total parameters, 37B activated per token. Multi-head Latent Attention, carried over from V2.
- **Data:** 14.8 trillion tokens.
- **Machine:** "a cluster equipped with 2048 NVIDIA H800 GPUs".
  - The H800 is Nvidia's export-compliant Hopper variant for China, with reduced chip-to-chip (NVLink) bandwidth. It was legal under the 2022 rules and banned from October 2023 [S32].
- **Compute and cost:**
  - "DeepSeek-V3 costs only 2.788M GPU hours for its full training."
  - The breakdown is about 2,664K GPU-hours for pre-training, 119K for context extension and 5K for post-training.
  - "Assuming the rental price of the H800 GPU is $2 per GPU hour, our total training costs amount to only $5.576M", "excluding the costs associated with prior research and ablation experiments".
- **Engineering tricks** (paper; details not re-quoted): FP8 mixed-precision training, DualPipe pipeline parallelism overlapping computation with communication, and auxiliary-loss-free load balancing. These are ways to get more from bandwidth-limited chips [UNVERIFIED detail wording].
- **Art note:** a long hall of server racks, 256 eight-GPU servers (2,048 ÷ 8, assuming standard HGX 8-GPU nodes [UNVERIFIED configuration]), cold-aisle blue light, tangled cabling.
  - The film can contrast this 2,048-chip hall with US clusters of 100,000+ GPUs [UNVERIFIED specific US cluster figures; check before narrating].

### 5.2 DeepSeek-R1 (20 Jan 2025) [S27] [VERIFIED-SECONDARY]
- **What it is:** a reasoning model trained with large-scale reinforcement learning on top of V3. DeepSeek said it performed "on par with OpenAI-o1".
- **Licence:** MIT, plus six small distilled models; the 32B and 70B versions were "on par with OpenAI-o1-mini".
- **The R1 paper** described a variant, R1-Zero, trained with RL and no supervised fine-tuning, which developed long chains of reasoning and self-checking [UNVERIFIED wording; the "aha moment" passage should be quoted only after checking arXiv 2501.12948].

### 5.3 The 27 January 2025 market event [S28][S29][S30] [VERIFIED-SECONDARY]
- **Nvidia:** close of ~$118.42, down from $142.62, about -17% [S29 via Paperjam; price figures VERIFIED-SECONDARY].
  - **Value lost:** $589B (Bloomberg) / $593B (Reuters, LSEG data), the biggest one-day market-cap loss for any US-listed company.
- **The wider market:**
  - Broadcom -17.4%; Philadelphia semiconductor index -9.2%; Nasdaq -3.1%; S&P 500 -1.5%.
  - ASML -7%; SoftBank -8.3% in Tokyo.
- **The trigger:** the DeepSeek app hit #1 on the US App Store's free list, overtaking ChatGPT. The same day DeepSeek reported a "large-scale" cyberattack and limited new registrations.

### 5.4 The export-control instruments as "apparatus"
- **2022 rule (ECCN 3A090) [S2][S3]:**
  - It controlled chips by performance and interconnect thresholds [UNVERIFIED: the exact thresholds, 4,800 TOPS-equivalent and 600 GB/s, not re-checked].
  - It controlled tools for advanced logic (≤16/14 nm), DRAM and NAND (new ECCN 3B090).
  - It restricted "U.S. persons" supporting advanced Chinese fabs.
- **2023 rule [S4][S5]:**
  - It replaced the bandwidth test with "total processing performance" and performance-density tests [UNVERIFIED exact criteria]. This is what caught the A800/H800.
  - It extended licence requirements to D:1/D:4/D:5 countries to stop diversion.
- **2024 rule [S6]:** HBM, more tools, new foreign direct product rules, and 140 entities added.
- **2025 diffusion rule [S7][S8]:** a worldwide licence requirement with tiered exceptions, plus controls on closed model weights at ≥10^26 training operations (ECCN 4E091). It never reached its compliance date.
- **2026 H200 rule [S19]:**
  - Case-by-case review for chips with Total Processing Performance below 21,000 and DRAM bandwidth below 6,500 GB/s.
  - Conditions included a 50% volume cap relative to US customers, third-party testing in the US and know-your-customer checks.
  - The 25% was collected through a tariff on import for testing [S19][S74; Introl is WEAK, Covington is VERIFIED-SECONDARY].

### 5.5 Huawei Ascend and SMIC [S38][S39] [VERIFIED-SECONDARY]
- **Ascend 910B/910C** are made on SMIC's enhanced 7 nm-class process (Bloomberg via [S38]); Nvidia's comparable chips use TSMC 4 nm.
- **Output and yields:** Huawei reportedly aims for ~600,000 Ascend 910C units in 2026, about twice 2025. SemiAnalysis reports poor yields on large dies.
- **Roadmap:** Ascend 950PR (Q1 2026), 950DT (Q4 2026; 144 GB HiZQ 2.0 HBM, 4 TB/s), 960 (Q4 2027), 970 (Q4 2028).
  - "Generally, we will follow a 1-year release cycle and double compute with each release." (Eric Xu)
- **Supernodes:** the Atlas 950 is designed for 8,192 chips and the Atlas 960 for 15,488.
- **Domestic-chip training claims:**
  - DeepSeek V4 (April 2026) is "adapted" to Ascend. How much of its *training* used Ascend is **not known** (Reuters via Quartz). Some outlets claimed it was trained entirely on Huawei chips [S36] [contested; do not narrate the "entirely" claim].
  - GLM-5 is claimed to have been trained on Ascend 910B [S46] [WEAK; verify before narrating].

### 5.6 MacroPolo Global AI Talent Tracker [S47][S48] [VERIFIED-SECONDARY]
- **Method:**
  - The sample is authors of accepted NeurIPS papers (2,671 papers in 2022, 25.6% acceptance), used as a proxy for the "top-tier" (~top 20%) of researchers.
  - Origin is coded by **country of undergraduate degree**, using LinkedIn and personal sites.
- **Origin results:**
  - 2019: China 29%, US 20%, Europe 17%, India 8%.
  - 2022: China **47%**, US **18%**.
- **Where they work:**
  - The US is the top destination. Within US institutions, US- and China-origin researchers made up 75% of the top tier (up from 58% in 2019).
  - The US hosted ~60% of top AI institutions.
  - Mobility fell: 42% of top-tier researchers were foreign nationals working abroad, down 13 points.
- **Caveat (Brookings):** undergraduate coding may *understate* China-origin researchers, since some Chinese students do their undergraduate degree in the US [S48].
- **A later "3.0" edition** (38% China-educated; 72% of China-educated elite researchers working in the US) appears on an archive mirror [S49]. **UNVERIFIED: do not use** until confirmed on the Paulson/MacroPolo site.

### 5.7 Distillation allegations (2026) [S65][S66] [VERIFIED-SECONDARY as allegations]
- **Anthropic, 23 Feb 2026.** About 24,000 fraudulent accounts and more than 16M exchanges with Claude. By lab: DeepSeek >150,000, Moonshot >3.4M, MiniMax >13M.
  - Anthropic says it attributed the campaigns "with high confidence" using IP correlation, request metadata and infrastructure indicators.
- **NSA/CISA/FBI joint advisory AA26-251A, 8 September 2026.** It alleged "aggressive, malicious, and targeted distillation activities at an industrial scale", "likely with Chinese government awareness".
- **Responses:** None of the three labs had commented publicly at the time of Anthropic's February report. China's MFA and MOFCOM rejected the September advisory [S66].

---

## 6. Verified quotes

All quotes below were checked in this pass. Translations from Chinese are as published by the named outlet; flag them as translations on screen.

1. **China State Council, New Generation AI Development Plan, 2017** [S1] (DigiChina translation): the 2030 goal of "making China the world's primary AI innovation center." Also, 2030: AI theory, technology and applications to "achieve world-leading levels."
2. **BIS press release, 7 Oct 2022** [S2] (via [S3]): the rules aim to "restrict the People's Republic of China's (PRC's) ability to both purchase and manufacture certain high-end chips used in military applications".
3. **Mao Ning, PRC MFA spokesperson, 8 Oct 2022** [S63] (AP translation): "Out of the need to maintain its sci-tech hegemony, the U.S. abuses export control measures to maliciously block and suppress Chinese companies." Also: "It will not only damage the legitimate rights and interests of Chinese companies, but also affect American companies' interests." *(Reuters rendered part of it as an abuse of trade measures; CGTN used the past tense. Cite as the AP translation.)*
4. **BIS press release, 17 Oct 2023** [S4]: "These updates are necessary to maintain the effectiveness of these controls, close loopholes, and ensure they remain durable." This is the release's own narrative text, not a quote from a named official. Separately, on a press call on 16 Oct 2023, Raimondo said the rules would be updated "at least annually" [S81] (this phrase does not appear in the BIS release).
5. **MOFCOM spokesperson, Oct 2023** [S64] (as reported): the US "has constantly overstretched the concept of national security, abused export control measures and resorted to unilateral bullying."
6. **White House readout, Woodside, 15 Nov 2023** [S50] (quoted in secondary analysis): "The leaders affirmed the need to address the risks of advanced AI systems and improve AI safety through U.S.-China government talks."
7. **Adrienne Watson, NSC spokesperson, 15 May 2024** [S51][S52]: "The United States also raised concerns over the misuse of AI, including by the PRC."
8. **PRC MFA, Department of North American and Oceanian Affairs, May 2024** [S52] (AP): China "expressed a stern stance on the U.S. restrictions and pressure in the field of artificial intelligence."
9. **White House readout, Lima, 16 Nov 2024** [S55]: "The two leaders affirmed the need to maintain human control over the decision to use nuclear weapons." Jake Sullivan, 17 Nov 2024 [S56]: "a good place to start is with the straightforward proposition that there should be human control over the decision to use nuclear weapons."
10. **Liang Wenfeng, interview with 36Kr/Waves, July 2024** [S34] (ChinaTalk's translation, published 27 Nov 2024; wording varies between translations): "Money has never been the problem for us; bans on shipments of advanced chips are the problem." Also from the same interview: "We often say that there is a gap of one or two years between Chinese AI and the United States, but the real gap is the difference between originality and imitation." *(Fact-check: the first line was previously given as "The problem has never been money; the problem is the bans on shipments of advanced chips", a paraphrase. The wording above was copied from the ChinaTalk page. Flag both as translations on screen.)*
11. **DeepSeek-V3 technical report, Dec 2024** [S26]: "Assuming the rental price of the H800 GPU is $2 per GPU hour, our total training costs amount to only $5.576M." Caveat in the same passage: "excluding the costs associated with prior research and ablation experiments on architectures, algorithms, or data."
12. **Dario Amodei, "On DeepSeek and Export Controls", Jan 2025** [S32] (primary):
    - "DeepSeek produced a model close to the performance of US models 7-10 months older, for a good deal less cost"
    - "DeepSeek-V3 is not a unique breakthrough or something that fundamentally changes the economics of LLM's"
    - "Well-enforced export controls are the only thing that can prevent China from getting millions of chips"
    - "If they can, we'll live in a *bipolar* world, where both the US and China have powerful AI models"
    - "They are simply very talented engineers and show why China is a serious competitor to the US."
    - "I don't see DeepSeek themselves as adversaries and the point isn't to target them in particular."
13. **Nvidia statement, 14 Jul 2025** [S75]: "NVIDIA is filing applications to sell the NVIDIA H20 GPU again. The U.S. government has assured NVIDIA that licenses will be granted, and NVIDIA hopes to start deliveries soon."
14. **Nvidia, responding to the CAC, Jul/Aug 2025** [S15][S16]: "Nvidia does not have 'back doors' in our chips that would give anyone a remote way to access or control them."
15. **President Trump, White House press conference, 11 Aug 2025** [S13] (NPR): "if I'm going to do that, I want you to pay us as a country something, because I'm giving you a release."
16. **America's AI Action Plan, 23 Jul 2025** [S58]: "We need to ensure America has leading open models founded on American values."
17. **Jensen Huang, Sep and Nov 2025** [S62]:
    - On BG2 (posted 26 Sep 2025), speaking about **chip** development and manufacturing: China is "nanoseconds behind us, and so we've got to go compete." Also: "We're up against a formidable, innovative, hungry, fast-moving, underregulated" competitor (the last word is bracketed in Tom's Hardware's rendering).
    - Nvidia-posted statement (Nov): "As I have long said, China is nanoseconds behind America in AI." "It's vital that America wins by racing ahead and winning developers worldwide."
    - **Context:** the FT had earlier quoted him as saying "China is going to win the AI race".
18. **Jensen Huang, Sep 2025, on China's RTX Pro 6000D halt** [S17]: "We can only be in service of a market if a country wants us to be."
19. **Eric Xu, Huawei Connect, 18 Sep 2025** [S38]: "Generally, we will follow a 1-year release cycle and double compute with each release."
20. **Demis Hassabis, CNBC "The Tech Download", 16 Jan 2026** [S61]: only the fragment "only a matter of months" (behind) is confirmed across outlets. **UNVERIFIED — do not use as a quote:** the full sentence "Maybe they're only a matter of months behind at this point." No outlet seen in the fact-check printed it word for word. "Massive overreaction" belongs to the separate Bloomberg interview at Davos, 20 Jan 2026.
21. **Senior Trump administration official (anonymous), to Reuters, 23 Feb 2026** [S23]: "we're not shipping Blackwells to China." Chinese embassy response: China opposes "drawing ideological lines, overstretching the concept of national security, expansive use of export controls and politicizing economic, trade, and technological issues."
22. **Saif Khan, Feb 2026** [S23]: "Chinese AI companies' reliance on smuggled Blackwells underscores their massive shortfall of domestically produced AI chips and why approvals of H200 chips would represent a lifeline".
23. **Mao Ning, Sep 2026** [S66] (AP): "China's AI development is the result of high-level technological self-reliance and strength." MFA: the US should "refrain from making unfounded accusations or smears". MOFCOM (as rendered by AP): "under the pretext of targeting distillation, China will take resolute countermeasures"; distillation "is a common practice".
24. **Scott Bessent, Sep 2026** [S66]: "The Chinese distill our models and they can never get ahead of us." On 20 Sep 2026 [S70]: "The US has proposed that we have a notification mechanism between the two countries."
25. **IDAIS-Venice statement, Sep 2024** [S57]: "The global nature of AI risks makes it necessary to recognize AI safety as a global public good". **IDAIS-Shanghai, Jul 2025** [S57]: "AI systems today already demonstrate the capability and propensity to undermine their creators' safety and control efforts".
26. **IDAIS-Beijing, Mar 2024** [S57]: The statement recalls that during the Cold War "international scientific and governmental coordination helped avert thermonuclear catastrophe". **Flag:** the "prohibiting development of AI systems that can autonomously replicate, improve, seek power or deceive their creators" line is from the IDAIS event *summary*, not necessarily the statement text. Verify against the statement page before quoting it as the statement.

**UNVERIFIED — do not use as quotes:**
- "Whoever becomes the leader in this sphere will become the ruler of the world." This is Putin (2017), not a US or China figure, and it was not checked here.
- Any line attributed to Xi Jinping about AI "under human control" in September 2026. Only paraphrases were seen [S70].
- "Small yard, high fence" as Sullivan's exact formulation. It was not checked in this pass.
- ~~The ChinaTalk wording of Liang's "money/chips" line.~~ Resolved in fact-check; see quote 10.
- Hassabis's full sentence "Maybe they're only a matter of months behind at this point." See quote 20.
- Xi Jinping, September 2026: a line widely reported in aggregators ("We have both the capability and responsibility to develop and manage AI for good and ensure that the development of AI is always under human control") was not found in a primary transcript or a wire report in the fact-check. Keep it a paraphrase until it is checked against Xinhua or the White House pool report.

---

## 7. Debates and controversies

1. **Do export controls work?**
   - *Yes, or they are necessary:* Amodei argues they decide whether the world becomes unipolar or bipolar, and that DeepSeek's success shows China is a serious competitor, not that the controls failed [S32]. Saif Khan reads the smuggling as evidence of a domestic shortfall [S23]. SemiAnalysis documents poor SMIC yields [S39].
   - *No, or they backfire:* Huang argues that cutting off China cedes the market to Huawei and that China is "nanoseconds behind" [S62]. China's MFA says US actions "will only hurt and isolate itself" and will not stop China's progress [S63]. Beijing's own steps (H20 discouragement, the RTX Pro 6000D halt, the H200 customs block, 50% domestic-chip quotas for state data centres) suggest controls also hardened Chinese self-reliance policy [S17][S20].
   - *Note:* Huang has a commercial interest in China sales [S62]. Hawks may have institutional interests too. State both.

2. **Did DeepSeek really cost $6 million?**
   - *Skeptics:* SemiAnalysis estimates ~$1.6B server capex and >$500M in GPUs [S33]. Amodei: DeepSeek "does not 'do for $6M what cost US AI companies billions'" [S32].
   - *Defenders:* DeepSeek only claimed the rental-equivalent cost of the final run and stated its exclusions [S26]. The $6M "total" claim was a media straw man [S33]. Amodei himself put Claude 3.5 Sonnet's training at "a few $10M's" [S32]. On that comparison, DeepSeek was cheaper but in the same order of magnitude.
   - **Narration-safe line:** "The paper's $5.6 million was the rented-GPU price of one final training run, by DeepSeek's own accounting. It left out the research, the people and the thousands of chips behind it."

3. **Smuggling and the Blackwell claim (2026).**
   - *US claim:* a senior official said DeepSeek trained on Blackwells, likely in Inner Mongolia [S23]. The DOJ's Operation Gatekeeper documented ≥$160M of H100/H200 smuggling (Oct 2024–May 2025) [S25]. The December 2025 "ghost data center" reports alleged servers were dismantled and moved piece by piece [S24].
   - *Counter:* Nvidia called the ghost-data-center story "far-fetched" and said it had found no credible proof [S24]. The Chinese embassy rejected the accusation [S23]. Neither DeepSeek nor the Commerce Department commented [S23]. No public proof was presented [S23].
   - **Status:** an allegation. Narrate it as "a senior US official said", never as fact.

4. **Distillation.**
   - *US side:* Anthropic (Feb 2026) and the FBI/NSA/CISA (Sep 2026) allege industrial-scale distillation [S65][S66].
   - *Chinese side:* MOFCOM says distillation "is a common practice" and calls the accusations "anxiety and double standards". The MFA calls them "smears" [S66].
   - *Third-party critics* (e.g. Elon Musk, Chinese social media) accused Anthropic of hypocrisy over its own data collection [S65 via search summary] [VERIFIED-SECONDARY as reported].

5. **Open weights vs. closed weights.**
   - *Pro-open, US side:*
     - The AI Action Plan wants "leading open models founded on American values", partly because open models can become global standards [S58].
     - Meta's case: Zuckerberg, "Open Source AI Is the Path Forward", July 2024 [UNVERIFIED in this pass].
     - OpenAI released open-weight gpt-oss models in August 2025 [UNVERIFIED in this pass; the existence of GPT-OSS-120B is referenced in [S45]].
   - *Pro-open, Chinese side:*
     - DeepSeek's founder sees open source as the dominant strategy [S34].
     - China's Global AI Governance Action Plan stresses open source and helping the Global South [S59].
     - Chinese open models (Qwen, DeepSeek, Kimi, GLM, MiniMax) dominated open-model downloads by 2025–26 [S44].
   - *Caution or control side:*
     - The 2025 diffusion rule would have controlled *closed* frontier weights while exempting open ones [S7]. Even the most restrictive US rule treated publication as outside control.
     - National-security arguments focus on distillation and on chips more than on banning open weights [S23][S32][S66].
   - *Twist:* by mid-2026, some top Qwen models were offered closed-only [S73] [WEAK]. "Chinese = open, American = closed" is too simple.

6. **The 15% / 25% revenue-share arrangements.** Critics argue that fees tied to export licences may violate the Export Control Reform Act. Supporters frame the 25% as a lawful national-security tariff [S19][S74]. Bloomberg called the 15% deal "unusual and legally questionable" [S14]. **Status:** unresolved as of the sources seen.

7. **What the talent numbers mean.** MacroPolo shows China *producing* the largest share of top-tier talent while the US *employs* the most [S47]. Brookings argues that US security and immigration policies threaten this advantage [S48]. Avoid any framing that treats Chinese-origin researchers as suspects. Many of the leading US researchers are of Chinese origin [S47].

8. **Is the dialogue meaningful?**
   - *Skeptics:* RSIS said Geneva set the bar "low" [S54]. The 2026 deal names a channel but defines no incident, operator or response time [S70].
   - *Optimists:* Lima's nuclear-control statement was a first [S56]. The scientists' red lines (IDAIS) came from both countries' senior figures [S57].

---

## 8. Misconceptions to avoid

- **"DeepSeek built a frontier model for $6 million."** The paper's $5.576M was the rental-equivalent cost of the *final* V3 training run and explicitly excluded research and ablations [S26].
- **"R1 caused the crash the day it came out."** R1 came out on 20 January. The crash came on 27 January, after the app topped the US App Store. The V3 paper with the cost figure was a month old [S26][S27][S30].
- **"The diffusion rule restricted chip sales worldwide in 2025."** It was published, but compliance was not due until 15 May 2025. It was rescinded two days before that [S7][S9].
- **"The US bans all Nvidia chips to China."**
  - China-specific chips (A800/H800 until October 2023, then the H20) were sold legally at various times.
  - The H20 was licensed again from August 2025 and the H200 from January 2026, with conditions [S12][S19].
  - Blackwell remained barred [S23].
- **"China eagerly took every US chip it was offered."** Beijing itself discouraged H20 purchases, halted RTX Pro 6000D orders and blocked H200 imports at customs in January 2026 [S17][S20].
- **"China refused to talk about AI safety."** China signed Bletchley (2023), held government talks in Geneva (2024), agreed the Lima nuclear statement (2024), its scientists co-authored the IDAIS statements, and it agreed an AI dialogue and incident channel in September 2026 [S51][S55][S57][S70].
- **"China's 2017 plan said it would beat America by 2030."** The plan names no rival. Its goal was "world-leading levels" and "the world's primary AI innovation center" [S1].
- **"DeepSeek V4 was trained entirely on Huawei chips."** Unknown. It was *adapted* for Ascend, and the training split is unconfirmed [S36].
- **"Half the world's AI researchers are Chinese."** MacroPolo says 47% of *top-tier NeurIPS 2022 authors* did their *undergraduate degree* in China. That is a specific, narrower claim [S47].
- **"All Chinese models are open and all US models are closed."** Baidu's ERNIE was closed until June 2025, and some 2026 Qwen flagships are API-only [S42][S73]. Meta and OpenAI have released open weights [S45].
- **"The September 2026 agreement relaxed export controls."** It did not. Chip controls were untouched [S70].

---

## 9. Curiosity hooks

1. **The cost figure was hiding in plain sight for a month.** DeepSeek published the "$5.576M" line in its V3 paper on 26 December 2024. The market panic came on 27 January 2025, when an app topped the iPhone charts [S26][S30].
2. **The biggest one-day loss in US market history** (about $589 billion, Nvidia, 27 January 2025) followed a free chatbot from a hedge-fund spin-off in Hangzhou [S28][S31].
3. **The rule that never ran.** Washington spent years designing a three-tier global "AI diffusion" regime. It was rescinded two days before anyone had to comply [S7][S9].
4. **The government takes a cut.** Export permission for the H20 came with 15% of China revenue going to the US Treasury (2025). The H200 came with 25% (2026). That was a first in export-control history, and its legality is contested [S13][S19].
5. **The importer said no.** The day after Washington issued its rule allowing H200 sales (13 January 2026), Reuters reported that Chinese customs agents had been told the chips were "not permitted" [S20]. Two weeks later Beijing gave conditional approvals, but by mid-May not one H200 had been delivered [S77][S78].
6. **The founder at the Premier's table.** On the very day DeepSeek released R1, its founder sat in a symposium with China's Premier, reportedly the only AI boss there [S31].
7. **Rivals agreed on nuclear weapons.** In November 2024, the US and Chinese presidents jointly affirmed for the first time that humans, not AI, must decide on using nuclear weapons [S55][S56].
8. **Red lines in a hotel next to an imperial garden.** In March 2024, Western and Chinese scientists, including three Turing laureates (Andrew Yao, Geoffrey Hinton and Yoshua Bengio), met at the Aman Summer Palace in Beijing. They published "red lines" against AI that can autonomously replicate or deceive its creators [S57].
9. **Born in China, working in America.** In 2022, the single largest group of top-tier AI researchers had done their undergraduate degrees in China (47%). The United States was still where most of the top researchers worked [S47].
10. **Two names for one hotline.** The September 2026 agreement is a "Super Intelligence Dialogue" in Washington's fact sheet and a "China-U.S. AI Dialogue" in Beijing's [S70].
11. **The "open" exemption.** The strictest US rule ever drafted, the diffusion rule, controlled the weights of secret frontier models but explicitly left openly published models alone [S7].

---

## 10. Visual and dramatic details

- **Hangzhou, January 2025.** DeepSeek is based in Hangzhou, the West Lake city that is also home to Alibaba [S31][S44]. R1 landed in the week before the Lunar New Year of the Snake (29 Jan 2025) [UNVERIFIED calendar link; Lunar New Year 2025 was 29 January]. Visual: red lanterns going up as a single laptop screen glows.
- **Zhongnanhai / Great Hall-style symposium room, 20 Jan 2025.** CCTV footage shows a long table and officials in dark suits, with Liang Wenfeng speaking [S31]. Silhouette: a long table receding into perspective, with tea cups.
- **Wall Street, 27 January 2025.** A ticker board running red; Nvidia's line falling off a cliff. Earlier the same day the selloff began in Asia (SoftBank -8.3%) and moved through Europe (ASML -7%) [S29]. The visual could follow dawn around the globe.
- **The Federal Register.** Dense three-column government print: 87 FR 62186 (2022), 90 FR 4544 (2025) [S3][S7]. A paper-cut "fence" built from rule pages, each year adding a higher rail: 2022, 2023, 2024.
- **The chips themselves.** A800, H800 and H20 as identical-looking slabs with differently throttled "pipes" between them (interconnect). Blackwell as the forbidden chip behind glass. Ascend 910C as a domestic slab stamped "7 nm" [S32][S38].
- **"Ghost data centers."** Alleged: whole server halls in Southeast Asia passing inspection, then dismantled and carried across borders in suitcases. This is an allegation, so stage it as a shadow-play "rumour" with Nvidia's denial shown [S24].
- **Inner Mongolia.** Alleged site of the Blackwell clusters [S23]. A vast, cold steppe at night with a lit data centre on the horizon. Label it as an allegation.
- **Shenzhen customs, January 2026.** Logistics firms told the H200 could not be cleared [S20]. A customs counter with a crate stamped and set aside.
- **Geneva, 14 May 2024.** Lakeside city of diplomacy; a closed-door meeting room [S51]. Two delegations of silhouettes facing each other across a table with water glasses.
- **Lima, 16 November 2024, APEC.** The last Biden–Xi meeting [S55]. Two figures at a table, flags behind them.
- **Woodside, California, 15 November 2023.** A garden-estate setting south of San Francisco for the APEC-sideline summit [S50]. The venue's name (Filoli estate) is [UNVERIFIED]; check before drawing specific architecture.
- **Aman Summer Palace, Beijing, March 2024.** A hotel beside the Qing-dynasty Summer Palace: courtyards, grey-tile roofs, early spring cold [S57].
- **Casa dei Tre Oci, Venice, September 2024.** A neo-Gothic house on the Giudecca, famous for three arched windows (the "three eyes") facing the lagoon [S57]. The three windows are [UNVERIFIED as an architectural detail]; the name means "house of the three eyes". This is a gorgeous silhouette opportunity: three glowing arches over water.
- **Ditchley Park, Oxfordshire, October 2023.** An English country house [S57].
- **WAIC, Shanghai, July 2025.** Premier Li Qiang at the podium announcing the Global AI Governance Action Plan and the proposed WAICO, with Shanghai preliminarily considered for its headquarters [S59]. A crowded expo hall with robot booths [UNVERIFIED specific exhibits].
- **Huawei Connect, Shanghai, 18 September 2025.** A giant keynote screen showing the Ascend roadmap stairs: 950, 960, 970 [S38]. The venue city is [UNVERIFIED].
- **White House, September 2026.** Xi's first state visit to the US since 2015, with the full ceremony [S70]. The fact sheet reportedly also included a pair of pandas for Atlanta, a light, humane detail [S70] [VERIFIED-SECONDARY via secondary summary; confirm before narrating].
- **Two lecterns, one week apart, July 2025.** Washington (23 July, AI Action Plan) and Shanghai (26 July, Global AI Governance Action Plan) [S58][S59]. A split-screen silhouette composition.
- **Colour and tone guidance.** Keep both nations' palettes equally warm, with no red-menace or eagle-vs-dragon clichés. Treat this as a story of two scientific communities and two states making choices under uncertainty.

---

## 11. Sources

1. [S1] DigiChina (Stanford), "Full Translation: China's 'New Generation Artificial Intelligence Development Plan' (2017)", trans. Webster, Creemers, Kania, Triolo: https://digichina.stanford.edu/work/full-translation-chinas-new-generation-artificial-intelligence-development-plan-2017/
2. [S2] BIS press release, 7 Oct 2022: https://www.bis.doc.gov/index.php/documents/about-bis/newsroom/press-releases/3158-2022-10-07-bis-press-release-advanced-computing-and-semiconductor-manufacturing-controls-final/file
3. [S3] Thompson Hine, "BIS Issues Interim Final Rule…" (Oct 2022): https://www.thompsonhinesmartrade.com/2022/10/bis-issues-interim-final-rule-to-implement-additional-export-controls-on-advanced-computing-and-semiconductor-items/ ; Baker McKenzie: https://sanctionsnews.bakermckenzie.com/bis-issues-new-export-controls-targeting-chinas-advanced-computing-and-semiconductor-sectors/
4. [S4] BIS press release, 17 Oct 2023, "Commerce Strengthens Restrictions on Advanced Computing Semiconductors…": https://www.bis.gov/press-release/commerce-strengthens-restrictions-advanced-computing-semiconductors-semiconductor-manufacturing-equipment
5. [S5] Skadden, "BIS Updates October 2022 Semiconductor Export Control Rules": https://skadden.com/insights/publications/2023/10/bis-updates-october-2022-semiconductor-export-control-rules
6. [S6] Federal Register document 2024-28267 (Dec 2024 rule): https://www.federalregister.gov/api/v1/documents/2024-28267.json
7. [S7] Federal Register, "Framework for Artificial Intelligence Diffusion", 90 FR 4544, 15 Jan 2025: https://www.federalregister.gov/documents/2025/01/15/2025-00636/framework-for-artificial-intelligence-diffusion ; govinfo HTML: https://www.govinfo.gov/content/pkg/FR-2025-01-15/html/2025-00636.htm
8. [S8] Akin Gump, "BIS Issues New Framework for AI Diffusion": https://www.akingump.com/en/insights/ai-law-and-regulation-tracker/bis-issues-new-framework-for-ai-diffusion
9. [S9] Crowell & Moring, "U.S. Department of Commerce Rescinds Biden Administration's AI Diffusion…": https://www.crowell.com/en/insights/client-alerts/us-department-of-commerce-rescinds-biden-administrations-ai-diffusion-export-control-rule-and-issues-new-guidance-on-huawei-chips-for-ai-purposes-and-diligence-expectations
10. [S10] Wiley, "BIS Rescinds AI Diffusion Rule": https://www.wiley.law/alert-BIS-Rescinds-AI-Diffusion-Rule ; WilmerHale: https://www.wilmerhale.com/en/insights/client-alerts/20250515-us-export-controls-on-ai-diffusion-officially-paused-but-new-guidance-elevates-risk-for-ai-related-exports
11. [S11] NVIDIA Corp. Form 8-K, April 2025: https://www.sec.gov/Archives/edgar/data/1045810/000104581025000082/nvda-20250409.htm
12. [S12] Bloomberg Law, "Nvidia, AMD to Resume AI Chip Sales to China in US Reversal": https://news.bloomberglaw.com/esg/nvidia-to-resume-h20-ai-chip-sales-to-china-in-us-reversal-2
13. [S13] NPR (via KNAU), "Trump says Nvidia will hand the U.S. 15% of its H20 chip sales to China", 11 Aug 2025: https://www.knau.org/npr-news/2025-08-11/trump-says-nvidia-will-hand-the-u-s-15-of-its-h20-chip-sales-to-china
14. [S14] Bloomberg, "Nvidia, AMD Reach Deal to Give US a Cut of China AI Chip Sales", 10 Aug 2025: https://www.bloomberg.com/news/articles/2025-08-10/nvidia-amd-to-pay-15-of-china-chip-sale-income-to-us-ft-says
15. [S15] The Register, "Beijing summons Nvidia over alleged backdoors in China-bound AI chips", 31 Jul 2025: https://www.theregister.com/2025/07/31/beijing_nvidia_backdoors/
16. [S16] SCMP, "Nvidia denies back-door features in its H20 chips…": https://www.scmp.com/tech/tech-war/article/3320382/nvidia-denies-back-door-features-its-h20-chips-after-beijing-raises-security-concerns
17. [S17] The Standard (FT report), "China tells tech firms to stop buying Nvidia's AI chips": https://www.thestandard.com.hk/innovation/article/311827/China-tells-tech-firms-to-stop-buying-Nvidias-AI-chips-FT-reports ; DCD: https://www.datacenterdynamics.com/en/news/chinas-internet-regulator-tells-chinese-tech-companies-to-stop-buying-nvidia-ai-chips-report/
18. [S18] The Register, "China turns the screws on Nvidia with antitrust probe", 15 Sep 2025: https://www.theregister.com/2025/09/15/china_nvidia_antitrust/ ; Fortune: https://fortune.com/2025/09/15/china-nvidia-mellanox-antitrust-trade-trump-tariffs-talks-beijing-washington
19. [S19] Covington, "U.S. Commerce Department Revises License Review Policy for Exports of Certain Advanced Computing Commodities to China and Macau" (Jan 2026): https://www.cov.com/news-and-insights/insights/2026/01/us-commerce-department-revises-license-review-policy-for-exports-of-certain-advanced-computing-commodities-to-china-and-macau
20. [S20] The Standard (Reuters), "China's customs agents told Nvidia's H200 chips are not permitted, sources say": https://www.thestandard.com.hk/china/article/321575/Chinas-customs-agents-told-Nvidias-H200-chips-are-not-permitted-sources-say ; Yahoo Finance (FT): https://finance.yahoo.com/news/nvidia-suppliers-halt-h200-output-014143078.html
21. [S21] Yahoo Finance (Reuters), "Nvidia gets Beijing's nod for H200 chip sales…": https://finance.yahoo.com/news/chinese-authorities-approve-nvidias-h200-013235310.html ; BusinessDay (Reuters, 18 Mar 2026): https://www.businessday.co.za/world/international-companies/2026-03-18-nvidia-cracks-beijings-nod-for-h200-chip-sales/
22. [S22] Spheron blog, "Nvidia H200 China shipment 2026" [WEAK]: https://www.spheron.network/blog/nvidia-h200-china-shipment-2026/
23. [S23] Malay Mail (Reuters), "US says China's DeepSeek trained AI model on Nvidia Blackwell chip despite export ban", 24 Feb 2026: https://www.malaymail.com/news/money/2026/02/24/us-says-chinas-deepseek-trained-ai-model-on-nvidia-blackwell-chip-despite-export-ban/210263 ; Citizen Digital: https://citizen.digital/article/chinas-deepseek-trained-ai-model-on-nvidias-best-chip-despite-us-ban-official-says-n377970
24. [S24] DigiTimes, Dec 2025, on DeepSeek GPU smuggling reports: https://apps.digitimes.com/news/a20251211PD234/nvidia-deepseek-gpu-startup-data.html
25. [S25] Fox 4 (KDFW), "Operation Gatekeeper…": https://www.fox4news.com/news/feds-say-houston-linked-operation-gatekeeper-broke-160m-ai-chip-smuggling-pipeline-china ; Arnold & Porter: https://www.arnoldporter.com/en/perspectives/blogs/enforcement-edge/2025/12/doj-shutdown-of-major-china-linked-ai-tech-smuggling-network
26. [S26] DeepSeek-AI, "DeepSeek-V3 Technical Report", arXiv:2412.19437: https://arxiv.org/html/2412.19437v2 (abs: https://arxiv.org/abs/2412.19437)
27. [S27] DeepSeek, "DeepSeek-R1 Release", 20 Jan 2025: https://deepseek.com/en/news/deepseek-r1/ ; Gigazine: https://gigazine.net/gsc_news/en/20250121-deepseek-r1-open-released
28. [S28] Bloomberg, "Nvidia's $589 Billion DeepSeek Rout Is Largest in Market History", 27 Jan 2025: https://www.bloomberg.com/news/articles/2025-01-27/asml-sinks-as-china-ai-startup-triggers-panic-in-tech-stocks
29. [S29] Korea JoongAng Daily (Reuters), "Investors dump tech stocks after record $593 billion Nvidia loss": https://www.koreajoongangdaily.com/business/investors-dump-tech-stocks-after-record-593-billion-nvidia-loss/12473281 ; Paperjam: https://en.paperjam.lu/article/what-drove-nvidias-540bn-single-day-crash
30. [S30] TechNode, "DeepSeek AI assistant surpasses ChatGPT on US App Store", 27 Jan 2025: https://technode.com/2025/01/27/deepseek-ai-assistant-surpasses-chatgpt-on-us-app-store/
31. [S31] SCMP, "Beijing meeting puts spotlight on China's new face of AI, DeepSeek founder Liang Wenfeng": https://scmp.com/tech/policy/article/3295662/beijing-meeting-puts-spotlight-chinas-new-face-ai-deepseek-founder-liang-wenfeng ; CGTN: https://news.cgtn.com/news/2025-01-21/Li-Qiang-chairs-symposium-to-hear-opinions-on-draft-govt-work-report-1AkU7auuARG/share_amp.html
32. [S32] Dario Amodei, "On DeepSeek and Export Controls", January 2025: https://darioamodei.com/on-deepseek-and-export-controls
33. [S33] Tom's Hardware on SemiAnalysis, "DeepSeek might not be as disruptive as claimed…": https://tomshardware.com/tech-industry/artificial-intelligence/deepseek-might-not-be-as-disruptive-as-claimed-firm-reportedly-has-50-000-nvidia-gpus-and-spent-usd1-6-billion-on-buildouts ; Michael Tsai roundup: https://mjtsai.com/blog/2025/02/10/deepseeks-true-training-cost
34. [S34] ChinaTalk, "Deepseek: The Quiet Giant Leading China's AI Race" (translation of 36Kr/Waves interview, July 2024): https://www.chinatalk.media/p/deepseek-ceo-interview-with-chinas
35. [S35] MIT Technology Review, "Why DeepSeek's V4 matters", 24 Apr 2026: https://www.technologyreview.com/2026/04/24/1136422/why-deepseeks-v4-matters/
36. [S36] Quartz (Reuters), DeepSeek V4 on Huawei chips: https://qz.com/deepseek-v4-model-huawei-chips-open-source-042426
37. [S37] Latent Space, "DeepSeek V4 Pro 1.6T-A49B…": https://www.latent.space/p/ainews-deepseek-v4-pro-16t-a49b-and
38. [S38] RCR Wireless, "Huawei outlines roadmap for Ascend AI chips": https://www.rcrwireless.com/20250922/ai-infrastructure/huawei-ai-chips ; SCMP: https://www.scmp.com/tech/big-tech/article/3326210/tech-war-huaweis-ai-chip-road-map-bolsters-chinas-tech-self-sufficiency-efforts
39. [S39] SemiAnalysis, "Huawei Ascend Production Ramp": https://newsletter.semianalysis.com/p/huawei-ascend-production-ramp
40. [S40] Simon Willison, "Kimi K2", 11 Jul 2025: https://simonwillison.net/2025/Jul/11/kimi-k2/ ; HPCwire: https://www.hpcwire.com/2025/07/16/chinas-moonshot-ai-releases-trillion-parameter-model-kimi-k2/
41. [S41] Beijing Municipal Government, "'Made-in-Beijing' Large-Scale Model GLM-4.5 Released": https://english.beijing.gov.cn/beijinginfo/sci/latesttrends/202508/t20250804_4165289.html
42. [S42] Gigazine, Baidu ERNIE open source, 30 Jun 2025: https://www.gigazine.net/news/20250630-baidu-ernie-open-source/ ; SiliconANGLE: https://siliconangle.com/2025/02/14/baidu-open-source-ernie-large-language-model-series/
43. [S43] AI Business, "Alibaba Publishes Open Source AI Model for Commercial Use" (Aug 2023): https://aibusiness.com/nlp/alibaba-publishes-open-source-ai-model-for-commercial-use
44. [S44] The Next Web, "Qwen is the world's most downloaded open model…": https://thenextweb.com/news/alibaba-qwen-downloads-hugging-face-open-models ; eHangzhou: https://www.ehangzhou.gov.cn/2026-01/13/c_296686.htm
45. [S45] Interconnects (Nathan Lambert), "Latest open artifacts #19: Qwen 3.5": https://www.interconnects.ai/p/latest-open-artifacts-19-qwen-35
46. [S46] AWS Japan blog, MiniMax M2.5 and GLM-5 [WEAK for spec details]: https://aws.amazon.com/jp/blogs/news/minimax-m25-and-glm-5 ; comparison: https://www.morphllm.com/comparisons/glm-5-vs-kimi-k2-5
47. [S47] MacroPolo (Paulson Institute), "The Global AI Talent Tracker 2.0": https://macropolo.org/digital-projects/the-global-ai-talent-tracker/ ; Paulson Institute press release: https://www.paulsoninstitute.org/press_release/study-finds-us-remains-a-magnet-for-worlds-best-and-brightest-ai-talent-but-more-global-talent-are-staying-home-instead-of-going-abroad/
48. [S48] Brookings, "US security and immigration policies threaten its AI leadership": https://www.brookings.edu/articles/us-security-and-immigration-policies-threaten-its-ai-leadership/
49. [S49] Archive mirror claiming a "3.0" tracker [UNVERIFIED; do not use]: https://archivemacropolo.org/interactive/digital-projects/the-global-ai-talent-tracker/
50. [S50] Washington Current (Substack), "US and China to hold talks on artificial intelligence" (quotes Woodside readout): https://washingtoncurrent.substack.com/p/us-and-china-to-hold-talks-on-artificial ; Chertoff Group: https://chertoffgroup.com/biden-and-xi-discuss-ai-as-executive-order-implementation-begins/ ; Apr 2024 call readout referencing the Woodside Summit: https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2024/04/02/readout-of-president-joe-bidens-call-with-president-xi-jinping-of-the-peoples-republic-of-china
51. [S51] White House (archived), "Statement from NSC Spokesperson Adrienne Watson on the U.S.-PRC Talks on AI Risk and Safety", 15 May 2024: https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2024/05/15/statement-from-nsc-spokesperson-adrienne-watson-on-the-u-s-prc-talks-on-ai-risk-and-safety-2/ ; USINDOPACOM repost: https://www.pacom.mil/Media/News/News-Articles/Article/3775271/statement-from-nsc-spokesperson-adrienne-watson-on-the-us-prc-talks-on-ai-risk/
52. [S52] PBS NewsHour (AP), "In first AI dialogue, US cites 'misuse' of AI by China, Beijing protests Washington's restrictions": https://www.pbs.org/newshour/politics/in-first-ai-dialogue-us-cites-misuse-of-ai-by-china-beijing-protests-washingtons-restrictions
53. [S53] China Daily, 16 May 2024, on the Geneva talks: https://www.chinadaily.com.cn/a/202405/16/WS6645652da31082fc043c765b.html ; gov.cn: https://english.www.gov.cn/news/202405/16/content_WS664579edc6d0868f4e8e7268.html
54. [S54] RSIS, "Parsing the Inaugural China-US AI Talks": https://www.rsis.edu.sg/rsis-publication/idss/ip24050-parsing-the-inaugural-china-us-ai-talks/
55. [S55] White House (archived), "Readout of President Joe Biden's Meeting with President Xi Jinping", 16 Nov 2024: https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2024/11/16/readout-of-president-joe-bidens-meeting-with-president-xi-jinping-of-the-peoples-republic-of-china/ ; UCSB American Presidency Project: https://presidency.ucsb.edu/node/375219
56. [S56] White House (archived), "On-the-Record Press Gaggle by APNSA Jake Sullivan…", 17 Nov 2024: https://bidenwhitehouse.archives.gov/briefing-room/press-briefings/2024/11/17/on-the-record-press-gaggle-by-apnsa-jake-sullivan-on-president-bidens-meeting-with-president-xi-jinping
57. [S57] International Dialogues on AI Safety (IDAIS), statements and dialogues: https://idais.ai/
58. [S58] Morgan Lewis, "US Administration Rolls Out America's AI Action Plan": https://www.morganlewis.com/pubs/2025/07/us-administration-rolls-out-americas-ai-action-plan ; ETO AGORA entry: https://agora.eto.tech/instrument/2665
59. [S59] PRC Ministry of Foreign Affairs, Global AI Governance Action Plan (30 Jul 2025 posting): https://www.mfa.gov.cn/eng/xw/wjbxw/202507/t20250730_11679453.html ; ANSI: https://www.ansi.org/standards-news/all-news/8-1-25-china-announces-action-plan-for-global-ai-governance
60. [S60] Concordia AI, "AI Safety in China: Special Edition: World AI Conference Recap": https://aisafetychina.substack.com/p/special-edition-world-ai-conference
61. [S61] Dataconomy (reporting CNBC), 16 Jan 2026: https://dataconomy.com/2026/01/16/google-deepmind-ceo-claims-china-trails-western-ai-by-only-months/ ; Bloomberg Law, "DeepMind CEO Says Chinese AI Firms Are 6 Months Behind the West": https://news.bloomberglaw.com/artificial-intelligence/deepmind-ceo-says-chinese-ai-firms-are-6-months-behind-the-west
62. [S62] SCMP, "China 'nanoseconds behind' US in chips, says Nvidia's Jensen Huang": https://www.scmp.com/tech/big-tech/article/3327138/china-nanoseconds-behind-us-chips-says-nvidias-jensen-huang ; The National (AFP): https://www.thenationalnews.com/future/2025/11/06/jensen-huang-china-ai-race-nvidia/ ; Quartz: https://qz.com/nvidia-jensen-huang-china-ai-comments
63. [S63] WRAL TechWire (AP), "China: latest US crackdown on chips is sign of sci-tech hegemony", 10 Oct 2022: https://wraltechwire.com/2022/10/10/china-latest-us-crackdown-on-chips-is-sign-of-sci-tech-hegemony/ ; CGTN, 8 Oct 2022: https://news.cgtn.com/news/2022-10-08/China-says-U-S-politicizing-technology-will-only-backfire-on-itself-1dXOBDL73ws/index.html ; Malay Mail (Reuters): https://www.malaymail.com/news/money/2022/10/08/china-says-us-abusing-trade-measures-with-chip-export-controls/32455
64. [S64] Business Today Malaysia, "China accuses US of abusing export control on semiconductors", 18 Oct 2023: https://www.businesstoday.com.my/2023/10/18/china-accuses-us-of-abusing-export-control-on-semiconductors/
65. [S65] NBC News, "Chinese AI companies 'distilled' Claude to improve own models, Anthropic says" (Feb 2026): https://www.nbcnews.com/world/asia/chinese-ai-companies-distilled-claude-improve-models-anthropic-says-rcna260386 ; The Decoder: https://the-decoder.com/anthropic-accuses-deepseek-moonshot-and-minimax-of-stealing-claudes-ai-data-through-16-million-queries/ ; TechInformed: https://techinformed.com/anthropic-accuses-chinese-ai-labs-of-claude-distillation/
66. [S66] AP (via NBC4 WCMH), "China hits back at US claims of malicious AI distillation ahead of planned Trump-Xi talks" (Sep 2026): https://www.nbc4i.com/technology/ap-technology/ap-china-hits-back-at-us-claims-of-malicious-ai-distillation-ahead-of-planned-trump-xi-talks/amp/ ; SCMP: https://scmp.com/economy/article/3367001/china-rejects-us-claims-industrial-scale-ai-model-distillation-warns-retaliation
67. [S67] Tom's Hardware, "Anthropic blocks Chinese-controlled firms from Claude AI": https://www.tomshardware.com/tech-industry/anthropic-blocks-chinese-firms-from-claude ; RTÉ (AFP), 5 Sep 2025: https://rte.ie/news/business/2025/0905/1531954-us-ai-giant-anthropic-bars-chinese-owned-entities/ ; SCMP: https://www.scmp.com/tech/tech-war/article/3324504/tech-war-us-start-anthropic-blocks-chinese-firms-subsidiaries-worldwide-ai-access
68. [S68] Science and Technology Daily (科技日报), 13 Sep 2025: https://digitalpaper.stdaily.com/http_www.kjrb.com/ywtk/html/2025-09/13/content_594463.htm
69. [S69] Bloomberg Government, "Trump Says He Discussed AI Guardrails, Nvidia's Chips With Xi" (May 2026): https://news.bgov.com/us-law-week/trump-says-he-discussed-ai-guardrails-nvidias-chips-with-xi
70. [S70] Express Tribune, "China, US agree to $30b tariff cut, AI dialogue during Xi visit, Beijing says" (Sep 2026): https://tribune.com.pk/story/2631526/china-us-agree-to-30b-tariff-cut-ai-dialogue-during-xi-visit-beijing-says ; Daily Tribune (PH), "China, U.S. to open AI 'communication channel' after summit": https://tribune.net.ph/2026/09/26/china-us-to-open-ai-communication-channel-after-summit ; KTVU, "US pitches new AI alert system to China…": https://www.ktvu.com/news/us-pitches-new-ai-alert-system-china-incidents-affecting-national-security ; All India Radio: https://newsonair.gov.in/chinese-president-concludes-three-day-u-s-state-visit-with-focus-on-trade-ai-and-foreign-policy/ ; Bloomberg Government (Jul 2026): https://news.bgov.com/artificial-intelligence/us-china-plan-ai-talks-before-xis-september-trip-reuters-says
71. [S71] AI Weekly, "China's Liu Bin calls US AI distillation claims 'misguided'" [WEAK]: https://aiweekly.co/alerts/chinas-liu-bin-calls-us-ai-distillation-claims-misguided
72. [S72] (reserved)
73. [S73] Tech Insider, "Kimi K2.6 vs Claude Opus vs GPT-5.5 (2026)" [WEAK]: https://tech-insider.org/kimi-k2-6-vs-claude-opus-vs-gpt-5-5-2026/
74. [S74] Introl, "BIS Export Policy Shift: H200 and MI325X Move to Case-by-Case Review" [WEAK]: https://introl.com/blog/bis-export-policy-h200-mi325x-china-case-by-case-2026
75. [S75] The Peninsula (Reuters/AFP), "Nvidia says it will resume sales of 'H20' AI chips to China", 15 Jul 2025: https://thepeninsulaqatar.com/article/15/07/2025/nvidia-says-it-will-resume-sales-of-h20-ai-chips-to-china
76. [S76] NVIDIA Corp. Form 8-K, event date 23 Oct 2023 (licence requirement "effective immediately"): https://www.sec.gov/Archives/edgar/data/1045810/000104581023000221/nvda-20231023.htm ; earlier 8-K, 17 Oct 2023: https://www.sec.gov/Archives/edgar/data/1045810/000104581023000217/nvda-20231017.htm
77. [S77] Reuters via Hargreaves Lansdown/Sharecast, "China gives OK for ByteDance, Alibaba and Tencent to buy Nvidia's H200 chips", 28 Jan 2026: https://www.hl.co.uk/shares/stock-market-news/company--news/archive/china-gives-ok-for-bytedance,-alibaba-and-tencent-to-buy-nvidias-h200-chips-reports ; DigiTimes: https://www.digitimes.com/news/a20260128VL212.html
78. [S78] Khaleej Times (Reuters), "US clears Nvidia's H200 chip sales to 10 China firms" (May 2026): https://www.khaleejtimes.com/business/tech/us-clears-nvidias-h200-chip-sales-to-10-china-firms ; Trivium China, 14 May 2026: https://triviumchina.com/2026/05/14/us-approves-chinese-firms-to-buy-nvidia-h200s/
79. [S79] SCMP, "China AI has less than 20% chance to exceed US over next 3-5 years: Alibaba scientist" (Jan 2026): https://www.scmp.com/tech/big-tech/article/3339527/china-ai-has-less-20-chance-exceed-us-over-next-3-5-years-alibaba-scientist
80. [S80] eSecurity Planet, "NSA, FBI, CISA Warn of Industrial-Scale AI Model Distillation Attacks" (Sep 2026): https://www.esecurityplanet.com/news/news-ai-model-distillation-attacks/ ; Cloud Security Alliance research note on AA26-251A: https://labs.cloudsecurityalliance.org/research/csa-research-note-china-ai-distillation-campaign-20260918-cs/
81. [S81] Export Compliance Daily, report on Raimondo's 16 Oct 2023 press call ("at least annually"), Oct 2023: https://exportcompliancedaily.com/article/2023/10/17/bis-releases-texts-of-new-chip-export-control-rules-2310170009
82. [S82] Anthropic, "Detecting and preventing distillation attacks", 23 Feb 2026: https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks
83. [S83] BIS press release, 7 Oct 2022 (bis.gov copy): https://www.bis.gov/press-release/commerce-implements-new-export-controls-advanced-computing-semiconductor-manufacturing-items-peoples
84. [S84] Morning Sun (AP), "China lashes out at latest US export controls on chips", 8 Oct 2022: https://morningsun.net/ap-free/china-lashes-out-at-latest-us-export-controls-on-chips/
85. [S85] The Next Web, "US and China agree a super intelligence dialogue and incident channel" (Sep 2026, quotes the White House fact sheet): https://thenextweb.com/news/us-china-super-intelligence-dialogue-ai-incident-channel ; The Standard (Reuters): https://www.thestandard.com.hk/china/article/343917/US-China-to-set-up-communication-channel-for-AI-incidents
86. [S86] World and Japan database (GRIPS/Univ. of Tokyo), full text of the White House Woodside readout, 15 Nov 2023: https://worldjpn.net/documents/texts/USC/20231115.O2E.html

---

## 12. Open items for the fact-check pass

Status after the 2026-10-05 fact-check:
- RESOLVED: Woodside readout wording (verbatim in [S86]). September 2026 fact sheet: the White House text, as quoted by [S85], says "U.S.-China Super Intelligence (SI) Dialogue" and that the next exchange takes place "by November 2026". The fact sheet itself was still not fetched directly.
- RESOLVED: Liang Wenfeng's chips line, copied verbatim from ChinaTalk (quote 10).
- RESOLVED in part: H200 deliveries. As of 14 May 2026 none had been delivered [S78]. Whether volume deliveries began between May and October 2026 is still unknown.
- OPEN: ECCN 3A090 thresholds; GLM-5 "trained on Ascend"; Kimi K2.5/K2.6 dates; MacroPolo "3.0"; Xi's September 2026 quoted line (see the UNVERIFIED list in section 6).

---

## Fact-check log (2026-10-05, adversarial pass)

Method: I checked all 19 key claims, the timeline, the experiments and the quote list against primary documents where I could reach them. Those were Amodei's essay, the DeepSeek-V3 arXiv record, the IDAIS site, the BIS 2023 release, the ChinaTalk translation, the MacroPolo tracker and the Nvidia 8-K. For the rest I used wire reports (Reuters, AP, Bloomberg) via syndication. Result: about 62 items checked, 50 confirmed, 10 corrected, 2 left unverifiable.

### Corrections
1. **When Beijing approved H200 purchases (key claim 6).** The draft said Beijing approved purchases "only in March 2026". In fact Reuters reported on **28 Jan 2026** that Beijing had given conditional, preliminary approval for ByteDance, Alibaba and Tencent to buy more than 400,000 H200s. In March, Nvidia said it had licences for "many customers". Sources: [S77], [S21].
2. **Customs timing (key claim 6).** BIS *issued* the H200 rule on 13 Jan 2026, and it was *published and effective* on 15 Jan. The Reuters "not permitted" report came on 14 Jan: the day after issue, but before the rule took effect. The draft's "within a day" of 15 Jan was wrong. Sources: [S19], [S20], https://www.akingump.com/en/insights/blogs/overruled-sanctions-export-controls-update/overruled-updates-15-Jan-2026
3. **H200 deliveries.** The draft said deliveries "remained small" (WEAK). Reuters reported on 14 May 2026 that **no** H200 had been delivered, although about 10 Chinese buyers had US approval. Source: [S78].
4. **Liang Wenfeng quote (quote 10).** The draft's line was a paraphrase. The verbatim ChinaTalk wording is: "Money has never been the problem for us; bans on shipments of advanced chips are the problem." ChinaTalk published the translation on 27 Nov 2024. Source: [S34].
5. **Raimondo's "at least annually" (quote 4; People).** The draft cited the BIS release [S4], which does not contain the phrase. Raimondo said it on a press call on 16 Oct 2023. The release's "close loopholes" sentence is BIS narrative, not a named official's words. Sources: [S4], [S81].
6. **When the 2023 rule took effect (key claim 3).** The draft said "took effect 17 November 2023". That was the scheduled date. On 23 Oct 2023 the US government told Nvidia the licence requirement was "effective immediately" for the A100, A800, H100, H800 and L40S. Source: [S76].
7. **Hassabis attribution (key claim 17; People; Belief C/D).** "Massive overreaction" and "about six months" come from **Bloomberg at Davos, 20 Jan 2026**, not from the 16 Jan CNBC interview, which is the source of "only a matter of months". Source: [S61] (Bloomberg Law link), https://www.cnbc.com/2026/01/16/google-deepmind-china-ai-demis-hassabis.html
8. **Turing laureates at IDAIS-Beijing (hook 8).** The draft said "two"; there were **three**: Andrew Yao (2000), Geoffrey Hinton and Yoshua Bengio (2018). All three are listed as attendees and signatories. Source: [S57].
9. **Hinton's IDAIS role.** The draft called him a "convener". The first dialogue was convened by Bengio, Yao, Russell and Zhang Ya-Qin. Hinton attended Beijing and Shanghai and signed the Beijing and Venice statements. Source: [S57].
10. **Context for Huang's "nanoseconds" (key claim 17; quote 17).** On BG2 (posted 26 Sep 2025) he was talking about **chip** development and manufacturing ("nanoseconds behind us, and so we've got to go compete"). The AI wording came in Nvidia's November statement. Sources: [S62], https://www.techspot.com/news/109664-nvidia-boss-calls-china-nanoseconds-behind-chips-urges.html

### Unverifiable (demoted)
- Hassabis's full sentence "Maybe they're only a matter of months behind at this point." Only the fragment "only a matter of months" is confirmed (quote 20).
- Xi's September 2026 line on AI "always under human control". It appears only in secondary aggregators, so it stays a paraphrase (section 6, UNVERIFIED list).

### Confirmed (selected, with the source opened)
- **Key claim 1.** 2017 plan: 8 July completed / 20 July released; the "world's primary AI innovation center" wording; RMB targets; no rival named [S1].
- **Key claim 2.** BIS, 7 Oct 2022: "restrict the People's Republic of China's (PRC's) ability to both purchase and manufacture certain high-end chips used in military applications". Phased effect 7 / 12 / 21 Oct [S83]. Mao Ning's AP-translated quote, 8 Oct 2022, is verbatim [S84].
- **Key claim 7.** DeepSeek-V3: 671B / 37B, 14.8T tokens, 2.788M H800 GPU-hours [S26]. arXiv v1 was posted 27 Dec 2024 UTC; the GitHub release was 26 Dec.
- **Key claim 9.** Amodei essay: every quote in quote 12 is verbatim, including "7-10 months older", "not a unique breakthrough", "very talented engineers", "I don't see DeepSeek themselves as adversaries", "unipolar or bipolar" and "a few $10M's" [S32].
- **Key claim 10.** Qwen passed Llama in cumulative Hugging Face downloads by October 2025. This comes from Xinhua and Alibaba citing Hugging Face data, so it is company-sourced; the independent ATOM report shows the same trend [S44].
- **Key claim 11.** DeepSeek V4 preview, 24 Apr 2026: V4-Pro 1.6T/49B, V4-Flash 284B/13B, MIT licence, day-0 Ascend adaptation. The training-hardware split is undisclosed [S35][S36][S37].
- **Key claim 12.** Blackwell allegation: Reuters, Monday 23 Feb 2026. The official also alleged distillation from US models [S23]. Operation Gatekeeper: DOJ, 8 Dec 2025, "at least $160 million" of H100/H200, Oct 2024–May 2025 [S25].
- **Key claim 13.** MacroPolo: China 29% (2019) → 47% (2022); US 20% → 18%; NeurIPS 2022 had 2,671 papers at 25.6% acceptance; 75% / 60% / 42% figures [S47].
- **Key claim 14.** Woodside readout sentence verbatim [S86]. Geneva, 14 May 2024 (Chhabra and Center) [S51]. Lima nuclear-control sentence verbatim [S55].
- **Key claim 15.** IDAIS dates and venues: Ditchley, 31 Oct 2023; Aman Summer Palace, 10–11 Mar 2024; Casa dei Tre Oci, 5–8 Sep 2024; Shanghai, 22–25 Jul 2025; Royal Society, 17–19 Apr 2026. Venice and Shanghai quotes verbatim [S57].
- **Key claim 16.** AI Action Plan quote verbatim; WAIC, 26 Jul 2025 [S58][S59].
- **Key claim 17.** Lin Junyang: under 20% ("highly optimistic"), AGI-Next summit at Tsinghua, about 10 Jan 2026 [S79].
- **Key claim 18.** Anthropic, 23 Feb 2026: about 24,000 accounts, more than 16M exchanges (DeepSeek >150k, Moonshot >3.4M, MiniMax >13M) [S82]. Advisory AA26-251A, 8 Sep 2026. AP quotes verbatim: "unfounded accusations or smears", "resolute countermeasures", "common practice", "anxiety and double standards", and Bessent's "The Chinese distill our models..." [S66][S80].
- **Key claim 19.** Beijing summit ended 15 May 2026 [S69]. Xi state visit 23–25 Sep 2026. White House: "U.S.-China Super Intelligence (SI) Dialogue", next exchange "by November 2026", plus an SI-incident channel; China calls it the "China-U.S. AI Dialogue"; chip controls unchanged [S85][S70].
