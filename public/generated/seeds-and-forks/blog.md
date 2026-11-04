This is the written companion to Seeds and Forks. It follows one plan, deterministic simulation testing for a TanStack Start app on workerd, from a race in a small shop to a fork that restores a whole full-stack app at one moment. The plan labels every claim as verified by a run, read from code, or inferred, and this post keeps those labels. Most of the numbers come from one small app in one spike, and the plan says so.

## Chapter 1: The Obvious Shop Loses Receipts

### Read, work it out, write

Every buy in the obvious version of the shop reads the stock, works out what is left, writes it back, then reads the orders list, appends the receipt, and writes that back. The code is in scripts/shop-race.ts in the plan's folder, and one request at a time it looks right.

Two customers pressing Buy at nearly the same moment is where it breaks. Each request waits on the store, and while one waits, the other one runs.

{% viz scene="books/seeds-and-forks/chapter-1" section="chapter-1-shop" cue="0" from="0.000" to="24.299" title="Read the stock, work out what is left, and write it back." %}
{% endviz %}

### Two requests, one erased receipt

Seed five with two requests shows the whole failure in twelve actions. Both requests read the orders list before either one writes it. The bagel customer's write lands first, then the espresso customer writes back a copy made before the bagel receipt existed. The bagel receipt is gone, and the simulator reports it: the customer of r1 has a receipt that isn't in orders.

Across two thousand seeds of six requests, 1,978 break. 1,925 lose a receipt, and 53 sell more than the stock held. A seed fixes every choice of order, so each failing seed is one schedule you can run again.

{% viz scene="books/seeds-and-forks/chapter-1" section="chapter-1-erase" cue="3" from="24.299" to="54.276" title="Both read the list; the second write erases the first receipt." %}
{% endviz %}

### Small enough to read

Two requests are enough. With two requests, 77 of 200 seeds fail, and seed five fails in twelve steps. The whole trace fits on one screen. Test one request at a time and nothing here fails, because one request has nothing to interleave with. The bug exists only in the order the steps happen in.

{% viz scene="books/seeds-and-forks/chapter-1" section="chapter-1-trace" cue="6" from="54.276" to="75.929" title="Seed five, two requests, twelve actions." %}
{% endviz %}

## Chapter 2: Seeds Pick the Order

### A pick is a draw

At each step the simulator lists what could happen next: the requests not yet delivered, and the storage calls waiting to finish. A seeded random number generator picks one. For seed five, the two planned requests take their first draws. Then the picks take the next ones. The draw 0.22 lands on the first of two candidates, so the simulator delivers r0, the espresso request. The draw 0.62 lands on the second candidate, a storage read. A pick always spends a draw, even when only one candidate is left.

Replaying that generator in the same order reproduces the first four actions of seed five's trace.

{% viz scene="books/seeds-and-forks/chapter-2" section="chapter-2-pick" cue="0" from="0.000" to="27.620" title="A seeded draw, sliced across the candidates." %}
{% endviz %}

### Checks after every action

After every action the simulator checks the rules. Every request must get an answer, and an acknowledged write must be readable afterward. The app adds its own rule, such as stock plus sold equals the stock at the start. A violation is reported with the step it appears after.

{% viz scene="books/seeds-and-forks/chapter-2" section="chapter-2-checks" cue="4" from="27.620" to="56.390" title="The action runs, then the rules are checked." %}
{% endviz %}

### Seams, and seeded UUIDs

The seams are where the outside plugs in. The KV binding (kvNamespace = "sim") and outbound fetch (globalOutbound = "sim") both point at the simulator. Every storage call waits until the simulator releases it, while the app's own code runs as it would in production. Randomness is seeded as well: crypto.randomUUID comes from the seed. Without that, the order of events stays the same, but the response bytes differ.

{% viz scene="books/seeds-and-forks/chapter-2" section="chapter-2-seams" cue="6" from="56.390" to="76.441" title="Where the outside plugs in, and where randomness comes from." %}
{% endviz %}

### Same seed, same bytes, two runtimes

Three processes ran the same 300 seeds and printed the same trace and response hashes (062551a2 and 01013c1d) every time. The same 100 seeds on stock workerd and on Replay's workerd matched too (7b1dc5a8 and cf463dfb).

Two things are still open. The plan keeps a failing seed as its list of named actions, so it can run again. And time is not yet controlled: the clock for seeded runs is not built, so this is randomness and order, not time.

{% viz scene="books/seeds-and-forks/chapter-2" section="chapter-2-determinism" cue="8" from="76.441" to="101.333" title="Three processes, two runtimes, one hash." %}
{% endviz %}

## Chapter 3: Replay Opens the Failure

### Record once, replay to the same hash

Seed one of the obvious shop breaks at step 22. Under Replay, that run records to 0.66 MB. A replay does not reopen the network or the disk. It plays back what they returned, so the run comes back the same. The replay prints the same hash, 1:dd1f318c:29e6ab08, and the same violation at step 22.

{% viz scene="books/seeds-and-forks/chapter-3" section="chapter-3-record" cue="0" from="0.000" to="25.379" title="One recording, one replay, the same hash." %}
{% endviz %}

### Stop anywhere, read the values

The run has 19,452 JavaScript steps, and any of them can be stopped at, with the stack and the values there. The track in the video is schematic: only the count and the order are facts. A logpoint prints a value as the run passes it, without rerunning anything. On the stock write it prints espresso writes 2, bagel writes 1, espresso writes 1, and so on. On the orders write it shows the loss: after the bagel is written, the list holds one order, not two.

{% viz scene="books/seeds-and-forks/chapter-3" section="chapter-3-track" cue="3" from="25.379" to="57.086" title="A stop reads the values; logpoints print in run order." %}
{% endviz %}

### Three fixes, counted in seeds

The first fix queues requests, so each one waits for the one before. It still fails 42 of 50 seeds. Simulation also surfaces a new failure: workerd cancels a request that waits on another request's promise, because it thinks the request has hung.

The fix that works puts the whole order in one transaction in the store, and 0 of 2,000 seeds fail. Then the store starts failing five percent of the time. Now a commit can land while its reply is lost, and 184 of 2,000 seeds break.

A failing seed stays a bug you can run again. The plan notes that a seed only reproduces on the same code and settings, so after a fix the same seed can mean different choices.

{% viz scene="books/seeds-and-forks/chapter-3" section="chapter-3-fixes" cue="6" from="57.086" to="81.421" title="Three fixes, as the share of seeds that fail." %}
{% endviz %}

### What the number is

184 of 2,000 seeds leave stock and sales out of step when the store fails five percent of the time. That is a finding of this spike, not proof that the shop is safe. The plan's own estimate of how far it generalizes is the same caution: one app, one binding, and no timers, Durable Objects or browser in the loop.

{% viz scene="books/seeds-and-forks/chapter-3" section="chapter-3-summary" cue="9" from="81.421" to="96.177" title="184 of 2,000 seeds, with stock and sales out of step." %}
{% endviz %}

## Chapter 4: Fork Both Sides at One Moment

### One timeline, two recordings

The page runs in Replay's Chromium 108. The worker runs in workerd, which in this repo is a fork of Cloudflare's workerd built on V8 with Replay's record and replay patches. The two recordings share one clock, and a moment is a pair of steps, one from each side.

Replay can get to any step of a recording. A fork used to be a paused process: you could read it, but it never went back to running. The spike changes that, so a fork keeps running from its moment.

{% viz scene="books/seeds-and-forks/chapter-4" section="chapter-4-timeline" cue="0" from="0.000" to="26.656" title="Two recordings on one clock, and a fork." %}
{% endviz %}

### Buy in a fork

A fork copies each process at that step, copy on write. In one run, a page fork was about 28 MB beside a 775 MB parent. Fork both sides before the first order, click Buy in the forked page, and the request leaves through the forked worker's own socket. The worker runs its real code and the answer comes back to the page.

The receipt matches the one the real session got: 350 cents, six espresso left, and a served count of two.

{% viz scene="books/seeds-and-forks/chapter-4" section="chapter-4-buy" cue="3" from="26.656" to="47.949" title="Copy both sides, click Buy, and get the real receipt." %}
{% endviz %}

### Moments after one and two orders

Forks at zero, one, and two orders reproduce the first three receipts of the recording. The third is the loyal price, 315 cents, because every third order is ten percent off. Each matches the real session.

A fork at three orders is different. Its fourth order never happened in the recording. It is a new receipt, and its stock and served count carry on from the fork itself.

{% viz scene="books/seeds-and-forks/chapter-4" section="chapter-4-moments" cue="5" from="47.949" to="74.222" title="Three receipts that match, and one that is new." %}
{% endviz %}

### The cut, and the case not yet delivered

A request can be in flight across the cut in four places. Before the cut, the page has sent it and the worker has not seen it, so the fork sends it. Mid-handling, the fork finishes it. After the worker finishes its JavaScript but before it writes the answer, the fork delivers the answer it had already made. In all three, the session got one receipt and the request was handled once.

The fourth case is an answer the worker wrote and the page has not read. The engine keeps those bytes, but the plan says that case is not delivered yet: it needs two overlapping requests to exercise it.

{% viz scene="books/seeds-and-forks/chapter-4" section="chapter-4-cut" cue="9" from="74.222" to="103.281" title="Four places a request can be when the fork is taken." %}
{% endviz %}

## Chapter 5: Load New Code, Then Find the Edges

### New code, same state

The hot load swaps the worker's price rule for half price and gives the page a new Shop component. At the moment with two orders, the unchanged code gives 315 cents, and the new code gives 175 cents. The Durable Object keeps its stock and orders, and the page keeps its receipt.

The new code was written by hand and evaluated in the module's scope. It was not produced by a rebuild, and the plan lists that as a gap. A running Durable Object keeps the method it was given until it is evicted.

{% viz scene="books/seeds-and-forks/chapter-5" section="chapter-5-hot" cue="0" from="0.000" to="36.176" title="The same moment, two prices; the page keeps its state." %}
{% endviz %}

### What a fork cannot do yet

On a page, animation frames never fire, and fetch and the older request calls never finish unless they go through the wrapper. The indexed database, blobs, cookies, iframes and new Workers hang or never finish, so each one must be refused by name or given a stand-in.

The quiet failures are the dangerous ones. A page call with no answer gets 0, and a worker file the fork never read comes back as zeros.

{% viz scene="books/seeds-and-forks/chapter-5" section="chapter-5-limits" cue="4" from="36.176" to="56.238" title="What a fork cannot do yet, with its status." %}
{% endviz %}

### The rule that is not met

Anything a fork cannot do must stop with its name, and each refusal needs a test. The plan marks that rule as not met yet. Until it is, no fork's answer should be trusted.

{% viz scene="books/seeds-and-forks/chapter-5" section="chapter-5-rule" cue="6" from="56.238" to="76.277" title="Says when it can't: not met." %}
{% endviz %}

### The definition of done, as measured

The plan's table has twelve rows, and most of them are spike results on one small app. Forks at every fifth step: 348 of 348 answered. Hot load: code written by hand, not from a rebuild. Says when it can't: not met. At an hour: not measured. In the app: not built.

{% viz scene="books/seeds-and-forks/chapter-5" section="chapter-5-done" cue="8" from="76.277" to="103.003" title="The definition of done, as the spike left it." %}
{% endviz %}

### It tests apps on workerd, not workerd

This tests apps running on workerd. It does not test workerd itself. What happens between two awaits is the JavaScript engine's, and the scheduling inside workerd stays workerd's. The plan counts both as real limits.

Seeds find the bug. Forks let you stand inside it. The edges are written down.

---

Sources: plans/deterministic-simulation-testing.md with results/spike.txt and results/forks.txt, from the replay-recording-inspector repo, and FORKS.md for the engine's forks.
