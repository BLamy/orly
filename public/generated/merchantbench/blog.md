# The Long Game

*An O'RLY? visual explainer of **“MerchantBench: Benchmarking LLM Agents for Long-Term Coherence in E-Commerce Operations”** by Qiming Shi, Yulong Tao, Linbo Jin, Zhaolu Kang, Yibo Dou, Jiawen Zhu, Tianjun Pan, Shaokang Fu, Chengyu Wang, Siyue Li, Yaping Cheng, Di Weng, and Chengfu Huo. Stable paper ID: [arXiv:2607.28956](https://arxiv.org/abs/2607.28956) · DOI `10.48550/arXiv.2607.28956` · [Hugging Face Daily Paper](https://huggingface.co/papers/2607.28956) · [paper PDF](https://arxiv.org/pdf/2607.28956) · [official MerchantBench repository](https://github.com/KhanCold/merchantbench) at commit [`6a3dd978`](https://github.com/KhanCold/merchantbench/commit/6a3dd978985763fdca0c64c1dabdb63698b9c965) · [official project page](https://air.1688.com/kapp/next1688/merchantbench/). It was the #1 Hugging Face Paper of the Day for August 5, 2026, with 90 visible upvotes when selected, ahead of the runner-up at 81.*

Most agent benchmarks compress success into one short episode: answer a question, finish a checkout, or recover from one mistake. MerchantBench asks a different question. Can an agent run the same e-commerce store for 365 simulated days while old pricing, sourcing, inventory, and cash decisions keep changing what becomes possible next? The official repository supplies the simulator, merchant-tool interface, human playground, SDK, and evaluation runner used to make that question executable.

## Chapter 1 · A Year Is the Task

MerchantBench begins with one persistent store rather than a sequence of reset tasks. Its state includes cash, deposit, listings, orders, supplier relationships, and store reputation. A decision is therefore not successful merely because it looks locally sensible; it enters a ledger that the next decision inherits.

<figure><img src="/generated/merchantbench/blog/chapter-1-0.png" alt="A persistent merchant store at the center of a year-long circular timeline"><figcaption>The benchmark keeps one store alive across the entire episode.</figcaption></figure>

<figure><img src="/generated/merchantbench/blog/chapter-1-1.png" alt="A calendar ring beginning to fill around the persistent store"><figcaption>Reset-free state turns each choice into context for the choices that follow.</figcaption></figure>

The default scenario in `env/scenarios/default.yaml` sets `horizon_steps` to 8,760. In `env/core/simulator.py`, each step advances the world by one simulated hour, updating the processes that do not wait for the agent: demand, orders, suppliers, logistics, settlement, and hazards.

<figure><img src="/generated/merchantbench/blog/chapter-1-2.png" alt="A full 365-day ring around the store with the hour counter advancing toward 8760"><figcaption>Eight thousand seven hundred sixty hourly transitions make one benchmark episode.</figcaption></figure>

The agent is activated every 12 hours, not every hour. Between decision windows the environment continues to move. The paper calls this a partially observable, long-horizon process: future demand, latent product and supplier risks, and recovery schedules are not handed to the policy as simulator state.

<figure><img src="/generated/merchantbench/blog/chapter-1-3.png" alt="Sparse decision-window marks around the denser hourly year ring"><figcaption>The world advances continuously while the agent receives a bounded cadence of interventions.</figcaption></figure>

<figure><img src="/generated/merchantbench/blog/chapter-1-4.png" alt="A hidden sector containing future demand risk parameters and recovery times"><figcaption>The observation boundary withholds exactly the future information that would make long-term planning trivial.</figcaption></figure>

An early listing or price change alters later traffic and orders; those orders change available cash, delayed receivables, penalties, and rating. The wake shown here is not an invented module—it is the accumulated consequence of simulator transitions and the order lifecycle implemented in the repository.

<figure><img src="/generated/merchantbench/blog/chapter-1-5.png" alt="An early listing decision leaving a colored wake through later days"><figcaption>One action can remain economically active long after its decision window closes.</figcaption></figure>

The control horizon and the accounting horizon are deliberately different. After day 365 the simulator stops generating new demand, but pending orders continue until their terminal outcomes settle. The reported objective is final net assets after that ledger closes, rather than cash at an arbitrary cutoff.

<figure><img src="/generated/merchantbench/blog/chapter-1-6.png" alt="The 365-day control boundary followed by unresolved orders settling"><figcaption>Stopping new demand does not erase obligations already in flight.</figcaption></figure>

<figure><img src="/generated/merchantbench/blog/chapter-1-7.png" alt="A final card reading that the past stays on the ledger"><figcaption>The benchmark's core wager is that history must keep constraining the future.</figcaption></figure>

## Chapter 2 · Cash Leaves Before the Truth Arrives

The most concrete source of delayed evidence is an order. In `env/core/order_manager.py`, an order begins by committing procurement cost from the store's cash. The simulator knows the product and supplier attributes that will shape the outcome, but the merchant sees only the evidence exposed through its tools.

<figure><img src="/generated/merchantbench/blog/chapter-2-0.png" alt="A new order entering a lifecycle rail as procurement cash exits immediately"><figcaption>The economic commitment happens before the eventual customer outcome is known.</figcaption></figure>

<figure><img src="/generated/merchantbench/blog/chapter-2-1.png" alt="An order packet at the ordered state with a cash debit card above it"><figcaption>The chosen listing becomes a real order with an addressable order identifier.</figcaption></figure>

The default configuration gives the supplier a 48-hour promised dispatch window. Missing it marks the order late and applies the configured timeout penalty, but does not terminate the lifecycle. Dispatch and logistics can still move that same order through shipped and delivered states.

<figure><img src="/generated/merchantbench/blog/chapter-2-2.png" alt="The order crossing a 48-hour promised shipping threshold"><figcaption>A late order pays a penalty and remains an unresolved obligation.</figcaption></figure>

<figure><img src="/generated/merchantbench/blog/chapter-2-3.png" alt="The same order moving from late through shipped to delivered"><figcaption>Operational state continues to evolve after the first failure signal.</figcaption></figure>

Delivery is not immediate revenue. The normal settlement delay in the scenario is 168 hours—seven days—so cash can remain in transit even after logistics reports success. That gap is why a balance snapshot, open-order view, and cash-pipeline query answer different questions.

<figure><img src="/generated/merchantbench/blog/chapter-2-4.png" alt="A delivered order waiting through a 168-hour settlement bar"><figcaption>Successful delivery still leaves a week of unresolved accounting state.</figcaption></figure>

Customer outcomes can later branch into a bad review, a refund with return, or a returnless refund. The order manager applies each branch's revenue, cost, penalty, and rating effects when the outcome realizes—not when the original listing decision was made.

<figure><img src="/generated/merchantbench/blog/chapter-2-5.png" alt="A delivered order branching into bad review refund and returnless-refund outcomes"><figcaption>Several delayed outcomes can reinterpret the economics of the same earlier decision.</figcaption></figure>

<figure><img src="/generated/merchantbench/blog/chapter-2-6.png" alt="Realized revenue penalty and rating evidence flowing back toward the earlier order"><figcaption>The lifecycle ties delayed evidence to a specific order and listing.</figcaption></figure>

Long-term coherence is therefore more than remembering that something went wrong. The agent must connect a realized outcome to its earlier sourcing, listing, or pricing choice, decide whether the evidence is representative, and update policy without discarding a viable store on one noisy event.

<figure><img src="/generated/merchantbench/blog/chapter-2-7.png" alt="A closing card connecting delayed evidence to one listing decision that should be revisited"><figcaption>Delayed evidence is useful only when the policy can trace where it came from.</figcaption></figure>

## Chapter 3 · Twenty-Six Levers, One Store

MerchantBench does not give the agent direct access to the simulator object. `env/tools/registry.py` registers the merchant interface, `env/tools/dispatch.py` executes permitted calls, and `env/tools/observation.py` constructs the observation delivered at a decision window. The control surface is intentionally narrower than the world it controls.

<figure><img src="/generated/merchantbench/blog/chapter-3-0.png" alt="An agent decision window framed as the only control surface into the store"><figcaption>The policy acts through merchant operations, never hidden simulator state.</figcaption></figure>

The repository registers 28 tools in total, including two trend helpers. The default benchmark denylist removes `market_brief` and `hot_search_terms`, leaving the 26 tools used in the paper's standard setting.

<figure><img src="/generated/merchantbench/blog/chapter-3-1.png" alt="A denylist removing market brief and hot search terms above four tool groups"><figcaption>The default interface exposes twenty-six allowed merchant tools.</figcaption></figure>

Sourcing calls reveal the current catalog, product details, and supplier profiles. They support comparison, but they do not reveal the environment's latent hazard parameters or future recovery schedule. Evidence must be accumulated from observations over time.

<figure><img src="/generated/merchantbench/blog/chapter-3-2.png" alt="The product-sourcing tool group highlighted within the full merchant interface"><figcaption>Catalog evidence is observable; the hidden process that generated it is not.</figcaption></figure>

Listing and pricing tools mutate the active shelf. The default scenario caps active listings at 50, making attention and capital finite: adding one product can crowd out another, and a broad shelf can strand cash across too many weak bets.

<figure><img src="/generated/merchantbench/blog/chapter-3-3.png" alt="Listing and pricing tools highlighted above a fifty-slot product shelf"><figcaption>The agent controls a bounded shelf rather than an unlimited catalog.</figcaption></figure>

Cash and order queries expose distinct slices of the ledger: available balance, store snapshot, open and updated orders, order details, and the cash pipeline. The visual keeps available cash, funds in transit, and receivables separate because the implementation and the decision problem do too.

<figure><img src="/generated/merchantbench/blog/chapter-3-4.png" alt="Cash and order tools highlighted above separate available pending and receivable balances"><figcaption>Money can be committed, pending, or realized, and each state supports different actions.</figcaption></figure>

The interface also includes performance and anomaly queries plus a memory document. `read_memory_doc` and `write_memory_doc` can preserve a strategy across a year, but persistence is not truth: a mistaken interpretation can be written and reused just as faithfully as a correct one.

<figure><img src="/generated/merchantbench/blog/chapter-3-5.png" alt="Feedback and memory tools beside a card warning that a persistent lesson is not guaranteed true"><figcaption>Memory extends a policy's reach while also extending the life of its errors.</figcaption></figure>

`end_of_step` closes the agent's decision hook. The simulator then resumes hourly transitions until the next activation. Coherence lives in this repeated boundary: observe, act, close, and return later to evidence created by earlier mutations.

<figure><img src="/generated/merchantbench/blog/chapter-3-6.png" alt="The end of step control closing a loop into the next simulated hour"><figcaption>A tool call changes state; the loop exists only when later windows revisit the consequences.</figcaption></figure>

<figure><img src="/generated/merchantbench/blog/chapter-3-7.png" alt="A closing card spelling out observe decide mutate close and revisit"><figcaption>The interface makes intervention possible, but the year-long loop makes coherence measurable.</figcaption></figure>

## Chapter 4 · Activity Is Not Coherence

Table 1 reports the strongest model configuration—Qwen3.7-Max with the Hermes framework—at 59.46 thousand RMB in final net assets. The rule-based baseline reaches 24.48 thousand, while the human mean reaches 217.61 thousand.

<figure><img src="/generated/merchantbench/blog/chapter-4-0.png" alt="Bars introducing the rule-based best-model and human final net assets"><figcaption>All results use the same terminal-ledger objective after 365 simulated days.</figcaption></figure>

<figure><img src="/generated/merchantbench/blog/chapter-4-1.png" alt="Final net asset bars at 24.48 59.46 and 217.61 thousand RMB"><figcaption>The best reported model configuration reaches 27.3 percent of the human mean.</figcaption></figure>

The paper also measures whether agents keep participating in sustained decision windows. Human operators act in 100% of those windows. Across tested model configurations, the sustained-window ranges span 10.6% to 99.4% under ReAct and 17.8% to 66.1% under Hermes. A high endpoint in one configuration does not erase the broad instability across models and frameworks.

<figure><img src="/generated/merchantbench/blog/chapter-4-2.png" alt="Sustained-window ranges for ReAct Hermes and human operators"><figcaption>Operational persistence varies sharply even before strategy quality is considered.</figcaption></figure>

For Qwen under Hermes, the effective-window rate falls from 62% in the first quarter to 37% in the fourth; under ReAct, the paper reports a fall from 68% to 23%. The decline matters because later windows contain the delayed evidence needed to revise earlier decisions.

<figure><img src="/generated/merchantbench/blog/chapter-4-3.png" alt="A quarterly effective-window line falling from the first to fourth quarter"><figcaption>The intervention loop narrows as the episode gets older.</figcaption></figure>

The paper separates operational coherence from strategic coherence. An agent can keep issuing calls yet remain trapped in a false explanation. In one qualitative trajectory, Claude attributes weak sales to traffic concentration and contracts its shelf from 47 listings on day 54 to three by day 322.

<figure><img src="/generated/merchantbench/blog/chapter-4-4.png" alt="A narrowing sequence of decision loops beside the quarterly decay"><figcaption>Fewer effective windows reduce the opportunities to test and revise a strategy.</figcaption></figure>

<figure><img src="/generated/merchantbench/blog/chapter-4-5.png" alt="A false traffic belief shrinking forty-seven product slots to three"><figcaption>Activity can reinforce a bad theory instead of correcting it.</figcaption></figure>

Another trajectory shows Kimi declaring the store unrecoverable on day 104, then taking no environment action in 355 of the remaining 523 decision windows. That failure is visible only because the episode is long enough for a declaration to become a durable operating policy.

<figure><img src="/generated/merchantbench/blog/chapter-4-6.png" alt="A timeline after day 104 marking 355 silent decision windows"><figcaption>A premature conclusion can suppress hundreds of later opportunities to recover.</figcaption></figure>

MerchantBench's result is not that more tool calls automatically produce profit. It is that long-term agent evaluation needs coupled measures: continued intervention, consistent objectives, revision under delayed evidence, and a terminal ledger that makes accumulated consequences unavoidable.

<figure><img src="/generated/merchantbench/blog/chapter-4-7.png" alt="A closing card listing continued action objective retention evidence revision and terminal settlement"><figcaption>A year makes the difference between motion and coherence observable.</figcaption></figure>

## Sources

- Shi et al., [“MerchantBench: Benchmarking LLM Agents for Long-Term Coherence in E-Commerce Operations”](https://arxiv.org/abs/2607.28956), arXiv:2607.28956, DOI `10.48550/arXiv.2607.28956`.
- [Hugging Face paper page](https://huggingface.co/papers/2607.28956), selected as the #1 paper for August 5, 2026 with 90 visible upvotes, ahead of the runner-up at 81.
- [Official MerchantBench source repository](https://github.com/KhanCold/merchantbench), grounded at commit [`6a3dd978985763fdca0c64c1dabdb63698b9c965`](https://github.com/KhanCold/merchantbench/commit/6a3dd978985763fdca0c64c1dabdb63698b9c965).
- [Official MerchantBench project page](https://air.1688.com/kapp/next1688/merchantbench/).
