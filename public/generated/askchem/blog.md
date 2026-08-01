# Search the Claim, Keep the Source

AskChem asks a practical question about chemistry literature: what if a search result were not merely a paper, but a small, typed scientific claim that still carried its source? The system described in **“AskChem: Claim-Centered Infrastructure for Chemistry Literature Synthesis”** builds a retrieval layer over 2.4 million claims extracted from 147,000 papers. On July 31, 2026, it was the #1 Hugging Face Daily Paper with 286 visible upvotes.

This explainer is grounded in the paper and the authors' public implementation. The stable paper identifier is **arXiv:2607.28618** (DOI **10.48550/arXiv.2607.28618**). Read the [Hugging Face paper page](https://huggingface.co/papers/2607.28618), the [canonical paper](https://arxiv.org/abs/2607.28618), or the [official AskChem repository](https://github.com/bingyan4science/askchem).

## 1. Cut Papers Into Verifiable Claims

AskChem's basic unit is the `Claim` model in `src/askchem/models.py`, not a whole document. A claim has a type, content, source DOI, and a quote or evidence locator. The extraction validators in `src/askchem/validation.py` reject records that lack the source information needed to trace a result back to the paper. The identifier is derived from source DOI, claim type, and content, so the claim's identity is tied to what was said and where it came from.

![A paper is cut into typed, source-bearing claims](/generated/askchem/blog/chapter-1-2.png)

That design changes the scale at which retrieval operates. A paper can contribute a result, method, limitation, or other typed statement without forcing a reader to treat the entire article as a single undifferentiated hit. Yet the smaller unit is not allowed to float free: DOI and evidence text remain attached as the claim passes into storage and search.

![The claim contract keeps type, DOI, and evidence together](/generated/askchem/blog/chapter-1-5.png)

The payoff is a result that can be checked. AskChem can rank a concise scientific statement while still providing the locator a person or agent needs to return to the source.

![A compact claim remains tethered to its paper](/generated/askchem/blog/chapter-1-7.png)

## 2. Let Five Search Signals Vote

The implementation of `search_claims` does not trust a single retrieval route. It builds query variants and gathers candidates from full-text search, vector similarity, the taxonomy tree, paper lookup, and author lookup. Those routes are useful for different reasons: literal chemistry vocabulary rewards exact matching, paraphrases need semantic retrieval, and known papers, people, or taxonomy branches offer precise structural entry points.

![Five retrieval lanes gather different candidate sets](/generated/askchem/blog/chapter-2-2.png)

AskChem combines the rankings with reciprocal-rank fusion. This lets each route vote based on position without pretending their raw scores share a common scale. The fused list can then be sharpened by an optional cross-encoder reranker. Diversity controls and a per-paper cap keep one source from crowding out the rest of the result set.

![Reciprocal-rank fusion combines incompatible score scales](/generated/askchem/blog/chapter-2-5.png)

Crucially, fusion changes order rather than identity. Every candidate retains the DOI and evidence locator from its claim record, so broader recall and stronger ranking do not erase provenance.

![The ranked result still exposes its source](/generated/askchem/blog/chapter-2-7.png)

## 3. Stabilize the Taxonomy

Chemistry can be organized by reaction type, substance class, application, technique, or mechanism. AskChem therefore provides several views over the same claim store. The view may change, but the sourced claim underneath does not.

![One sourced claim fans out into several browsing views](/generated/askchem/blog/chapter-3-2.png)

Extracted taxonomy labels naturally drift: near-synonyms, spelling variants, and differently specific paths can otherwise create duplicate branches. `taxonomy_path_aliases.json` maps those variants toward canonical destinations. `taxonomy_v2.json` supplies a stabilized L1/L2/L3 hierarchy, while `canonical_l3.py` and `taxonomy.py` enforce the paths used for browsing and retrieval.

![Aliases funnel unstable labels toward canonical paths](/generated/askchem/blog/chapter-3-4.png)

The repository also distinguishes a living taxonomy for principles, theories, models, mechanisms, and phenomena. That exploratory overlay can evolve without destabilizing the main facets on which search depends. AskChem gets both reliable navigation and room for scientific organization to grow.

![A living scientific taxonomy overlays the stable claim store](/generated/askchem/blog/chapter-3-7.png)

## 4. Follow the Evidence

Once claims are individually addressable, AskChem can connect them. The edge-building code in `pilot_edges.py` creates typed relationships such as `supports`, `derives_from`, `extends`, `contradicts`, and `cites_as_evidence`. An edge therefore says more than “these records are related”; it records what kind of evidential relationship the system is proposing.

![Typed edges turn isolated claims into an evidence graph](/generated/askchem/blog/chapter-4-2.png)

The same graph is exposed through several access paths. The repository implements web, REST, Python, and Model Context Protocol surfaces. MCP tools include claim search, individual claim retrieval, taxonomy browsing, source retrieval, and frontier exploration, allowing an agent to move from a question to a claim and then back to its paper.

![People and agents enter through different interfaces](/generated/askchem/blog/chapter-4-5.png)

The paper reports that AskChem's claims have 100% resolvable DOI provenance. Its synthesis evaluation also reports 88.3% citation correctness without retrieval and the highest citation density among the five compared systems. Those results reinforce the architectural point of the explainer: retrieval is more useful when claims, ranking, relationships, and source access remain one continuous path.

![The evidence path ends at an inspectable source](/generated/askchem/blog/chapter-4-7.png)

## Sources

- Yan, Wolfe, Martiniani, and Cho, [“AskChem: Claim-Centered Infrastructure for Chemistry Literature Synthesis”](https://arxiv.org/abs/2607.28618), arXiv:2607.28618.
- [Hugging Face Daily Paper page](https://huggingface.co/papers/2607.28618).
- [Official AskChem source repository](https://github.com/bingyan4science/askchem).
- [AskChem project site](https://askchem.org).
